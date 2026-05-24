"""
Module học trọng số 5 chiều bằng Logistic Regression.
THIẾT KẾ:
    - Input (X): [attr_score, sem_score, struct_score, visual_score, ctx_score]
    - Output (y): is_correct (1 = winner, 0 = loser) — lấy từ bảng candidate_scores
    - Sau khi fit, hệ số |coef[i]| → normalize → trọng số mới cho 5 chiều
    - Trọng số được lưu vào bảng learned_weights trong SQLite
    - SimilarityEngineV2 đọc trọng số từ DB thay vì dùng STATIC_WEIGHTS cứng

TRIGGER: Sau mỗi 20 healing event thành công → tự động retrain.

BẢNG learned_weights (tạo bởi DBManager):
    id            INTEGER PK AUTOINCREMENT
    trained_at    TEXT     -- ISO timestamp
    n_samples     INTEGER  -- số dòng training data
    accuracy      REAL     -- accuracy trên toàn tập train
    w_attribute   REAL
    w_semantic    REAL
    w_structure   REAL
    w_visual      REAL
    w_context     REAL
    notes         TEXT     -- thông tin thêm (vd: "retrain #3")
"""

import logging
import sqlite3
from datetime import datetime
from typing import Dict, Optional, Tuple

logger = logging.getLogger("LogisticWeightModel")

try:
    from sklearn.linear_model import LogisticRegression
    import numpy as np
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    logger.warning("[LR] scikit-learn chưa cài -> model sẽ dùng STATIC weights")

# Trọng số mặc định (dùng khi chưa có model nào được train)
DEFAULT_WEIGHTS: Dict[str, float] = {
    'attribute': 0.27,
    'semantic':  0.24,
    'structure': 0.2,
    'visual':    0.17,
    'context':   0.12,
}
FEATURE_NAMES = ['attribute', 'semantic', 'structure', 'visual', 'context']
class LogisticWeightModel:
    """
    Học trọng số 5 chiều bằng Logistic Regression.
        model = LogisticWeightModel(db_path="healing.db")
        # Retrain từ dữ liệu trong DB
        result = model.retrain()
        # Lấy trọng số hiện tại (đã học hoặc mặc định)
        weights = model.get_current_weights()
    """

    FIRST_TRAIN_AFTER = 140   # train lần đầu sau khi đủ 40 heal thành công
    RETRAIN_EVERY     = 20   # sau lần train đầu, cứ thêm 20 heal → retrain lại

    def __init__(self, db_path: str = "healing.db"):
        self.db_path = db_path
        self._weights: Dict[str, float] = {}   # cache in-memory
        # Tải trọng số mới nhất từ DB vào cache
        self._weights = self._load_latest_weights_from_db()

    def get_current_weights(self) -> Dict[str, float]:
        """
        Trả về trọng số đang dùng.
        Ưu tiên: learned_weights DB -> DEFAULT_WEIGHTS.
        """
        if self._weights:
            return dict(self._weights)
        return dict(DEFAULT_WEIGHTS)

    def retrain(self) -> Optional[Dict[str, float]]:
        """
        Đọc dữ liệu từ candidate_scores → train Logistic Regression
        -> tính trọng số mới -> lưu vào learned_weights.
        Trả về: dict trọng số mới, hoặc None nếu không đủ dữ liệu / lỗi.
        """
        if not _SKLEARN_AVAILABLE:
            logger.error("[LR] scikit-learn không có -> bỏ qua retrain")
            return None

        X, y, n = self._load_training_data()

        if n < 10:
            logger.warning(f"[LR] Chỉ có {n} mẫu — cần ít nhất 10 để train")
            return None

        if len(set(y)) < 2:
            logger.warning("[LR] Chỉ có 1 class trong y -> không thể train")
            return None

        try:
            # Train Logistic Regression
            lr = LogisticRegression(
                penalty     = 'l2',
                C=0.1,     
                max_iter    = 1000,
                solver      = 'lbfgs',
                class_weight= 'balanced',   # xử lý imbalance winner/loser
                random_state= 42,
            )
            lr.fit(X, y)

            # Tính accuracy trên tập train
            accuracy = float(lr.score(X, y))

            # Chuyển hệ số -> trọng số có nghĩa
            # coef_ shape: (1, 5) — lấy abs value rồi normalize
            coefs = np.abs(lr.coef_[0])
            total = coefs.sum()
            if total == 0:
                logger.warning("[LR] Tất cả coef = 0 -> giữ DEFAULT_WEIGHTS")
                return None
            new_weights = {
                name: round(float(coefs[i] / total), 4)
                for i, name in enumerate(FEATURE_NAMES)
            }

            # Đếm lần retrain để ghi notes
            retrain_count = self._count_retrain_history()
            notes = (
                f"retrain #{retrain_count + 1} | "
                f"n_samples={n} | "
                f"accuracy={accuracy:.1%} | "
                f"scikit-learn LogisticRegression"
            )
            # Lưu vào DB
            self._save_weights_to_db(new_weights, n, accuracy, notes)
            # Cập nhật cache in-memory
            self._weights = new_weights
            logger.info(
                f"[LR] Retrain xong! accuracy={accuracy:.1%}  n={n}\n"
                f"     Trọng số mới: {new_weights}"
            )
            self._print_weight_comparison(new_weights)
            return new_weights
        except Exception as e:
            logger.error(f"[LR] Retrain thất bại: {e}")
            return None

    def _load_training_data(self) -> Tuple:
        """
        Đọc dữ liệu từ candidate_scores.
        Trả về (X: np.ndarray, y: np.ndarray, n: int).
        Mỗi hàng X = [attr, sem, struct, vis, ctx]; y = is_correct.
        """
        if not _SKLEARN_AVAILABLE:
            return [], [], 0

        try:
            with sqlite3.connect(self.db_path) as conn:
                rows = conn.execute("""
                    SELECT
                        attr_score,
                        sem_score,
                        struct_score,
                        visual_score,
                        ctx_score,
                        is_correct
                    FROM candidate_scores
                    WHERE attr_score  IS NOT NULL
                      AND sem_score   IS NOT NULL
                      AND struct_score IS NOT NULL
                      AND visual_score IS NOT NULL
                      AND ctx_score   IS NOT NULL
                """).fetchall()

            if not rows:
                return np.array([]), np.array([]), 0

            X = np.array([[r[0], r[1], r[2], r[3], r[4]] for r in rows],
                         dtype=float)
            y = np.array([int(r[5]) for r in rows])
            return X, y, len(rows)

        except Exception as e:
            logger.error(f"[LR] Đọc training data thất bại: {e}")
            return np.array([]), np.array([]), 0

    def _save_weights_to_db(self, weights: Dict[str, float],
                             n_samples: int, accuracy: float, notes: str):
        """Chèn hàng mới vào bảng learned_weights."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO learned_weights
                        (trained_at, n_samples, accuracy,
                         w_attribute, w_semantic, w_structure,
                         w_visual, w_context, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    datetime.now().isoformat(),
                    n_samples,
                    accuracy,
                    weights.get('attribute', 0),
                    weights.get('semantic',  0),
                    weights.get('structure', 0),
                    weights.get('visual',    0),
                    weights.get('context',   0),
                    notes,
                ))
                conn.commit()
            logger.info(f"[LR] Đã lưu trọng số vào learned_weights: {weights}")
        except Exception as e:
            logger.error(f"[LR] Lưu learned_weights thất bại: {e}")

    def _load_latest_weights_from_db(self) -> Dict[str, float]:
        """Đọc hàng mới nhất từ learned_weights → trả về dict trọng số."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                row = conn.execute("""
                    SELECT w_attribute, w_semantic, w_structure,
                           w_visual, w_context
                    FROM learned_weights
                    ORDER BY id DESC
                    LIMIT 1
                """).fetchone()

            if row:
                weights = {
                    'attribute': row[0],
                    'semantic':  row[1],
                    'structure': row[2],
                    'visual':    row[3],
                    'context':   row[4],
                }
                logger.info(f"[LR] Tải trọng số từ DB: {weights}")
                return weights
        except Exception as e:
            logger.debug(f"[LR] Chưa có learned_weights trong DB: {e}")
        return {}

    def _count_retrain_history(self) -> int:
        """Đếm số lần đã retrain (số hàng trong learned_weights)."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                count = conn.execute(
                    "SELECT COUNT(*) FROM learned_weights"
                ).fetchone()[0]
            return count
        except Exception:
            return 0

    def _print_weight_comparison(self, new_weights: Dict[str, float]):
        """In bảng so sánh trọng số cũ -> mới ra console."""
        old = DEFAULT_WEIGHTS
        print(f"\n{'═'*55}")
        print("  LOGISTIC REGRESSION — CẬP NHẬT TRỌNG SỐ MỚI")
        print(f"{'─'*55}")
        print(f"  {'Chiều':<12} {'Cũ (static)':>12} {'Mới (learned)':>14}")
        print(f"{'─'*55}")
        for name in FEATURE_NAMES:
            arrow = "↑" if new_weights[name] > old[name] else (
                    "↓" if new_weights[name] < old[name] else "=")
            print(f"  {name:<12} {old[name]:>12.4f} {new_weights[name]:>12.4f}  {arrow}")
        print(f"{'═'*55}\n")

    def get_weight_history(self) -> list:
        """Đọc toàn bộ lịch sử retrain từ DB — dùng để phân tích."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                rows = conn.execute("""
                    SELECT id, trained_at, n_samples, accuracy,
                           w_attribute, w_semantic, w_structure,
                           w_visual, w_context, notes
                    FROM learned_weights
                    ORDER BY id ASC
                """).fetchall()
            return [
                {
                    'id': r[0], 'trained_at': r[1],
                    'n_samples': r[2], 'accuracy': r[3],
                    'attribute': r[4], 'semantic': r[5],
                    'structure': r[6], 'visual':   r[7],
                    'context':  r[8],  'notes':    r[9],
                }
                for r in rows
            ]
        except Exception:
            return []