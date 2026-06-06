import logging
import sqlite3
from collections import defaultdict
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
    'visual':    0.12,
    'context':   0.17,
}
FEATURE_NAMES = ['attribute', 'semantic', 'structure', 'visual', 'context']

class LogisticWeightModel:
    """
    Học trọng số 5 chiều bằng Logistic Regression (pairwise).

        model = LogisticWeightModel(db_path="healing.db")
        result = model.retrain()
        weights = model.get_current_weights()

    Pairwise: thay vì học P(is_correct=1 | features), model học
    P(winner > loser | winner_feats − loser_feats) trong cùng event.
    Mỗi cặp (w, l) sinh 2 samples: diff→y=1 và −diff→y=0 (mirror).
    """

    FIRST_TRAIN_AFTER = 100  # train lần đầu sau khi đủ 100 heal thành công
    RETRAIN_EVERY     = 20   # sau lần train đầu, cứ thêm 20 heal → retrain lại

    def __init__(self, db_path: str = "healing.db"):
        self.db_path = db_path
        self._weights: Dict[str, float] = {}
        self._weights = self._load_latest_weights_from_db()

    def get_current_weights(self) -> Dict[str, float]:
        """Trả về trọng số đang dùng. Ưu tiên: learned_weights DB -> DEFAULT."""
        if self._weights:
            return dict(self._weights)
        return dict(DEFAULT_WEIGHTS)

    def retrain(self) -> Optional[Dict[str, float]]:
        """
        Đọc dữ liệu từ candidate_scores -> train Logistic Regression (pairwise)
        -> tính trọng số mới -> lưu vào learned_weights.
        Trả về: dict trọng số mới, hoặc None nếu không đủ dữ liệu / lỗi.
        """
        if not _SKLEARN_AVAILABLE:
            logger.error("[LR] scikit-learn không có -> bỏ qua retrain")
            return None
        X, y, n = self._load_training_data()
        if n < 20:
            logger.warning(f"[LR] Chỉ có {n} mẫu pairwise — cần ít nhất 20")
            return None
        if len(set(y)) < 2:
            logger.warning("[LR] Chỉ có 1 class trong y -> không thể train")
            return None
        try:
            lr = LogisticRegression(
                penalty='l2',
                C=1.0,         
                max_iter=1000,
                solver='lbfgs',
                class_weight='balanced',
                random_state=42,
            )
            lr.fit(X, y)
            accuracy = float(lr.score(X, y))
            # |coef| -> normalize -> trọng số
            coefs = np.abs(lr.coef_[0])
            total = coefs.sum()
            if total == 0:
                logger.warning("[LR] Tất cả coef = 0 -> giữ DEFAULT_WEIGHTS")
                return None
            new_weights = {
                name: round(float(coefs[i] / total), 4)
                for i, name in enumerate(FEATURE_NAMES)
            }
            retrain_count = self._count_retrain_history()
            notes = (
                f"retrain #{retrain_count + 1} | "
                f"n_pairs={n} | "
                f"accuracy={accuracy:.1%} | "
                f"pairwise LogisticRegression"
            )
            self._save_weights_to_db(new_weights, n, accuracy, notes)
            self._weights = new_weights
            logger.info(
                f"[LR] Retrain xong! accuracy={accuracy:.1%}  n_pairs={n}\n"
                f"     Trọng số mới: {new_weights}"
            )
            self._print_weight_comparison(new_weights)
            return new_weights
        except Exception as e:
            logger.error(f"[LR] Retrain thất bại: {e}")
            return None

    def _load_training_data(self) -> Tuple:
        """
        Đọc raw rows từ candidate_scores (bao gồm healing_event_id),
        sau đó gọi _build_pairwise_data để tạo pairwise samples.
        Trả về (X: np.ndarray, y: np.ndarray, n_pairs: int).
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
                        is_correct,
                        healing_event_id
                    FROM candidate_scores
                    WHERE attr_score   IS NOT NULL
                      AND sem_score    IS NOT NULL
                      AND struct_score IS NOT NULL
                      AND visual_score IS NOT NULL
                      AND ctx_score    IS NOT NULL
                      AND healing_event_id     IS NOT NULL
                """).fetchall()

            if not rows:
                return np.array([]), np.array([]), 0

            return self._build_pairwise_data(rows)
        except Exception as e:
            logger.error(f"[LR] Đọc training data thất bại: {e}")
            return np.array([]), np.array([]), 0

    def _build_pairwise_data(self, rows: list) -> Tuple:
        """
        Chuyển raw rows thành pairwise training data.
        Với mỗi event:
          - Gom winners (is_correct=1) và losers (is_correct=0)
          - Tạo mọi cặp (w, l):
              diff = w_feats − l_feats  ->  y = 1  (winner thắng)
              −diff                     ->  y = 0  (mirror, bắt buộc để cân bằng)
          - Bỏ cặp quá giống nhau (|diff|.sum < 1e-6) vì là nhiễu
        """
        events: dict = defaultdict(lambda: {'winners': [], 'losers': []})
        for r in rows:
            attr, sem, struct, vis, ctx, is_correct, healing_event_id = r
            feats = np.array([attr, sem, struct, vis, ctx], dtype=float)
            bucket = 'winners' if int(is_correct) == 1 else 'losers'
            events[healing_event_id][bucket].append(feats)
        X_pairs, y_pairs = [], []
        for healing_event_id, group in events.items():
            winners = group['winners']
            losers  = group['losers']
            if not winners or not losers:
                # Event thiếu 1 phía (toàn winner hoặc toàn loser) → bỏ qua
                logger.debug(f"[LR] event {healing_event_id}: bỏ qua (thiếu winner/loser)")
                continue
            for w in winners:
                for l in losers:
                    diff = w - l
                    if np.abs(diff).sum() < 1e-6:
                        continue  # hai candidate giống hệt nhau → nhiễu
                    X_pairs.append(diff)
                    y_pairs.append(1)
                    X_pairs.append(-diff)   # mirror
                    y_pairs.append(0)
        if not X_pairs:
            logger.warning("[LR] Không tạo được cặp pairwise nào từ dữ liệu")
            return np.array([]), np.array([]), 0
        return (
            np.array(X_pairs, dtype=float),
            np.array(y_pairs, dtype=int),
            len(X_pairs),
        )

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