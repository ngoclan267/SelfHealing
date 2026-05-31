"""
db/db_manager.py  —  SQLite Database Manager
═══════════════════════════════════════════════════════════════════════

MỤC ĐÍCH:
    Lưu trữ snapshot và healing log vào SQLite.

SCHEMA — 3 bảng:
    snapshots        : fingerprint element tại lúc test PASS
    healing_events   : lịch sử mỗi lần healing
    candidate_scores : tất cả ứng viên của mỗi lần healing
                       (winner + losers, dùng để phân tích sau này)

LUỒNG DỮ LIỆU:
    Test PASS → save_snapshot()
    Healing   → save_healing_event() + save_candidate_scores()
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Tuple
import logging

logger = logging.getLogger("DBManager")


class DBManager:
    """
    Quản lý toàn bộ dữ liệu SQLite cho hệ thống Self-Healing.

    Dùng context manager (with statement) để đảm bảo connection
    luôn được đóng đúng cách, tránh database lock.
    """

    def __init__(self, db_path: str = "healing.db"):
        self.db_path = Path(db_path)
        # Tạo database và toàn bộ bảng nếu chưa tồn tại
        self._init_db()
        logger.info(f"[DB] Đã kết nối SQLite: {self.db_path.resolve()}")

    # ──────────────────────────────────────────────────────────────
    # KHỞI TẠO
    # ──────────────────────────────────────────────────────────────

    def _init_db(self):
        """
        Tạo 3 bảng nếu chưa tồn tại.
        IF NOT EXISTS đảm bảo idempotent — gọi nhiều lần vẫn an toàn.
        """
        with self._connect() as conn:
            conn.executescript("""
                -- ═══════════════════════════════════════════════════
                -- BẢNG 1: snapshots
                -- Lưu fingerprint 5 chiều của element tại lúc test PASS
                -- Mỗi row = 1 element đã được observe thành công
                -- ═══════════════════════════════════════════════════
                CREATE TABLE IF NOT EXISTS snapshots (
                    id             INTEGER PRIMARY KEY AUTOINCREMENT,

                    -- Định danh
                    step_name      TEXT NOT NULL,
                    ui_version     TEXT NOT NULL DEFAULT 'v1',

                    -- Chiều 1: ATTRIBUTE (id, class, name, placeholder...)
                    tag            TEXT,
                    el_id          TEXT,
                    classes        TEXT,   -- JSON array: ["btn", "btn-primary"]
                    name_attr      TEXT,
                    input_type     TEXT,
                    placeholder    TEXT,
                    aria_label     TEXT,
                    data_testid    TEXT,

                    -- Chiều 2: SEMANTIC (text, role, href...)
                    text_content   TEXT,
                    role_attr      TEXT,
                    href           TEXT,

                    -- Chiều 3: STRUCTURE (xpath, parent, depth...)
                    xpath_abs      TEXT,
                    parent_tag     TEXT,
                    parent_id      TEXT,
                    depth          INTEGER DEFAULT 0,
                    sibling_index  INTEGER DEFAULT 0,
                    siblings_count INTEGER DEFAULT 0,

                    -- Chiều 4: VISUAL (bounding box)
                    bounding_w     REAL DEFAULT 0,
                    bounding_h     REAL DEFAULT 0,
                    bounding_x     REAL DEFAULT 0,
                    bounding_y     REAL DEFAULT 0,

                    -- Chiều 5: CONTEXT (url, form)
                    page_url       TEXT,
                    form_context   TEXT,
                    nearby_label   TEXT,

                    -- Metadata
                    captured_at    TEXT DEFAULT (datetime('now')),

                    -- Index để query nhanh theo step + version
                    UNIQUE(step_name, ui_version)
                        ON CONFLICT REPLACE   -- Nếu đã có → ghi đè (snapshot mới nhất)
                );

                -- ═══════════════════════════════════════════════════
                -- BẢNG 2: healing_events
                -- Ghi lại MỌI lần healing được kích hoạt
                -- Đây là "training data" cho ML
                -- ═══════════════════════════════════════════════════
                CREATE TABLE IF NOT EXISTS healing_events (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,

                    step_name        TEXT NOT NULL,
                    ui_version       TEXT NOT NULL,

                    -- Locator gốc thất bại
                    original_by      TEXT,
                    original_value   TEXT,

                    -- Locator mới tìm được (NULL nếu healing fail)
                    healed_by        TEXT,
                    healed_value     TEXT,

                    -- Điểm similarity 5 chiều (feature vector cho ML)
                    attr_score       REAL DEFAULT 0,
                    sem_score        REAL DEFAULT 0,
                    struct_score     REAL DEFAULT 0,
                    visual_score     REAL DEFAULT 0,
                    ctx_score        REAL DEFAULT 0,
                    total_score      REAL DEFAULT 0,

                    -- Nhãn: healing có thành công không? (label cho supervised ML)
                    healing_success  INTEGER DEFAULT 0,  -- 1=True, 0=False

                    -- Metadata
                    action           TEXT,   -- 'AUTO_FIX', 'SUGGEST', 'FAILED'
                    healed_at        TEXT DEFAULT (datetime('now'))
                );

                -- Index để ML query nhanh theo success/fail
                CREATE INDEX IF NOT EXISTS idx_healing_success
                    ON healing_events(healing_success);

                CREATE INDEX IF NOT EXISTS idx_healing_step
                    ON healing_events(step_name, ui_version);

                -- ═══════════════════════════════════════════════════
                -- BẢNG 4: candidate_scores
                -- Lưu TẤT CẢ ứng viên được quét trong mỗi lần healing
                -- không chỉ winner — đây mới là training data đúng
                -- nghĩa cho ML phân biệt đúng/sai.
                --
                -- Vấn đề của healing_events (bảng 2):
                --   Chỉ lưu 1 dòng/healing → không có negative samples
                --   → Random Forest không học được phân biệt
                --
                -- Bảng này giải quyết bằng cách lưu:
                --   is_correct=1 : ứng viên được chọn (winner)
                --   is_correct=0 : ứng viên bị loại  (losers)
                -- ═══════════════════════════════════════════════════
                CREATE TABLE IF NOT EXISTS candidate_scores (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,

                    -- Liên kết với healing event
                    healing_event_id INTEGER,
                    step_name        TEXT NOT NULL,
                    ui_version       TEXT NOT NULL,

                    -- Feature vector 5 chiều (input cho ML)
                    attr_score       REAL DEFAULT 0,
                    sem_score        REAL DEFAULT 0,
                    struct_score     REAL DEFAULT 0,
                    visual_score     REAL DEFAULT 0,
                    ctx_score        REAL DEFAULT 0,
                    total_score      REAL DEFAULT 0,

                    -- Thông tin ứng viên (để debug, không dùng train)
                    cand_tag         TEXT,
                    cand_testid      TEXT,
                    cand_text        TEXT,

                    -- LABEL: đây có phải ứng viên đúng không?
                    -- 1 = winner (được chọn), 0 = loser (bị loại)
                    is_correct       INTEGER NOT NULL DEFAULT 0,

                    -- Metadata
                    recorded_at      TEXT DEFAULT (datetime('now')),

                    FOREIGN KEY (healing_event_id)
                        REFERENCES healing_events(id)
                );

                -- Index để ML query nhanh
                CREATE INDEX IF NOT EXISTS idx_candidate_correct
                    ON candidate_scores(is_correct);

                CREATE INDEX IF NOT EXISTS idx_candidate_step
                    ON candidate_scores(step_name, ui_version);

                -- ═══════════════════════════════════════════════════
                -- BẢNG 3: learned_weights
                -- Lưu trọng số đã học từ ML
                -- Được load lại mỗi khi SimilarityEngine khởi động
                -- ═══════════════════════════════════════════════════
                CREATE TABLE IF NOT EXISTS learned_weights (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,

                    -- 5 trọng số (tổng = 1.0)
                    w_attribute   REAL NOT NULL,
                    w_semantic    REAL NOT NULL,
                    w_structure   REAL NOT NULL,
                    w_visual      REAL NOT NULL,
                    w_context     REAL NOT NULL,

                    -- Đánh giá chất lượng model
                    accuracy      REAL DEFAULT 0,   -- cross-validation accuracy
                    n_samples     INTEGER DEFAULT 0, -- số training samples
                    trained_at    TEXT,              -- ISO timestamp, set lúc insert
                    notes         TEXT               -- thông tin thêm (vd: "retrain #3")
                );
                -- ═══════════════════════════════════════════════════
                -- BẢNG 5: knowledge_base
                -- Cache locator đã heal, thay thế healing_map.json
                -- ═══════════════════════════════════════════════════
                CREATE TABLE IF NOT EXISTS knowledge_base (
                    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                    step_name           TEXT NOT NULL,
                    ui_version          TEXT NOT NULL,
                    old_locator_type    TEXT NOT NULL,
                    old_locator_value   TEXT NOT NULL,
                    new_locator_type    TEXT NOT NULL,
                    new_locator_value   TEXT NOT NULL,
                    confidence          REAL DEFAULT 0,
                    similarity_detail   TEXT,           -- JSON dict
                    times_used          INTEGER DEFAULT 0,
                    learned_at          TEXT DEFAULT (datetime('now')),
                    last_used_at        TEXT,
                    UNIQUE(step_name, ui_version, old_locator_type, old_locator_value)
                        ON CONFLICT REPLACE
                );

                CREATE INDEX IF NOT EXISTS idx_kb_lookup
                    ON knowledge_base(step_name, ui_version, old_locator_type, old_locator_value);
            """)


    def _connect(self) -> sqlite3.Connection:
        """
        Tạo connection với WAL mode (Write-Ahead Logging).
        WAL cho phép đọc đồng thời khi đang ghi — quan trọng khi
        nhiều test chạy song song (pytest-xdist).

        Nguồn: SQLite WAL documentation — https://www.sqlite.org/wal.html
        """
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row  # Truy cập column theo tên: row['step_name']
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    # ──────────────────────────────────────────────────────────────
    # BẢNG 1: snapshots
    # ──────────────────────────────────────────────────────────────

    def save_snapshot(self, snap) -> int:
        """
        Lưu ElementSnapshot vào database.
        Nếu đã có snapshot cho step+version → REPLACE (cập nhật).

        Tham số: snap — ElementSnapshot object từ Snapshot.py
        Trả về:  id của row vừa insert/replace
        """
        with self._connect() as conn:
            cursor = conn.execute("""
                INSERT OR REPLACE INTO snapshots (
                    step_name, ui_version,
                    tag, el_id, classes, name_attr, input_type,
                    placeholder, aria_label, data_testid,
                    text_content, role_attr, href,
                    xpath_abs, parent_tag, parent_id,
                    depth, sibling_index, siblings_count,
                    bounding_w, bounding_h, bounding_x, bounding_y,
                    page_url, form_context, nearby_label,
                    captured_at
                ) VALUES (
                    ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?,
                    ?
                )
            """, (
                snap.step_name, snap.ui_version,
                snap.tag, snap.id,
                json.dumps(snap.classes, ensure_ascii=False),
                snap.name, snap.input_type,
                snap.placeholder, snap.aria_label, snap.data_testid,
                snap.text, snap.role, snap.href,
                snap.xpath_abs, snap.parent_tag, snap.parent_id,
                snap.depth, snap.sibling_index, snap.siblings_count,
                snap.bounding_w, snap.bounding_h,
                snap.bounding_x, snap.bounding_y,
                snap.page_url, snap.form_context, snap.nearby_label,
                datetime.now().isoformat()
            ))
            return cursor.lastrowid

    def load_snapshot_dict(self, step_name: str,
                           ui_version: str = "v1") -> Optional[Dict]:
        """
        Load snapshot từ DB dưới dạng dict.
        Trả về None nếu chưa có snapshot cho step+version này.
        """
        with self._connect() as conn:
            row = conn.execute("""
                SELECT * FROM snapshots
                WHERE step_name = ? AND ui_version = ?
                ORDER BY captured_at DESC LIMIT 1
            """, (step_name, ui_version)).fetchone()

            if row is None:
                return None

            d = dict(row)
            # Giải mã JSON classes array
            try:
                d['classes'] = json.loads(d.get('classes') or '[]')
            except Exception:
                d['classes'] = []
            return d

    # ──────────────────────────────────────────────────────────────
    # BẢNG 2: healing_events
    # ──────────────────────────────────────────────────────────────

    def save_healing_event(self,
                           step_name: str,
                           ui_version: str,
                           original_by: str,
                           original_value: str,
                           healed_by: Optional[str],
                           healed_value: Optional[str],
                           scores: Dict[str, float],
                           success: bool,
                           action: str) -> int:
        """
        Ghi lại một lần healing vào database.

        Tham số scores: dict với keys attribute/semantic/structure/visual/context/total
        Đây là hàm quan trọng nhất — dữ liệu này sẽ là training data cho ML.
        """
        with self._connect() as conn:
            cursor = conn.execute("""
                INSERT INTO healing_events (
                    step_name, ui_version,
                    original_by, original_value,
                    healed_by, healed_value,
                    attr_score, sem_score, struct_score,
                    visual_score, ctx_score, total_score,
                    healing_success, action
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                step_name, ui_version,
                original_by, original_value,
                healed_by, healed_value,
                scores.get('attribute', 0),
                scores.get('semantic', 0),
                scores.get('structure', 0),
                scores.get('visual', 0),
                scores.get('context', 0),
                scores.get('total', 0),
                1 if success else 0,
                action
            ))
            logger.info(f"[DB] Healing event saved: step={step_name} "
                        f"success={success} score={scores.get('total', 0):.2f}")
            return cursor.lastrowid

    def save_candidate_scores(self,
                              healing_event_id: int,
                              step_name:        str,
                              ui_version:       str,
                              candidates:       List[Dict],
                              winner_index:     int) -> int:
        """
        Lưu TẤT CẢ ứng viên từ một lần healing vào candidate_scores.

        Tham số:
            healing_event_id : id từ save_healing_event() trả về
            step_name        : tên step đang heal
            ui_version       : phiên bản UI
            candidates       : list dict, mỗi dict gồm:
                {
                  "attr_score", "sem_score", "struct_score",
                  "visual_score", "ctx_score", "total_score",
                  "cand_tag", "cand_testid", "cand_text"
                }
            winner_index     : vị trí index trong candidates của ứng viên
                               được chọn → is_correct=1, còn lại is_correct=0

        Trả về: số dòng đã insert

        ĐÂY LÀ HÀM QUAN TRỌNG NHẤT CHO ML —
        Mỗi candidates list sinh ra:
          - 1 mẫu dương  (is_correct=1)  ← winner
          - N-1 mẫu âm   (is_correct=0)  ← losers
        Đây chính xác là dữ liệu mà WeightOptimizer.train_all() cần.
        """
        if not candidates:
            return 0

        # Tách winner ra khỏi danh sách losers
        winner = candidates[winner_index]
        losers = [c for i, c in enumerate(candidates) if i != winner_index]

        # Chỉ giữ top 5 losers có điểm cao nhất
        # (các loser điểm thấp không giúp ích cho ML — chỉ gây lệch dữ liệu)
        TOP_LOSERS = 5
        losers_top5 = sorted(losers, key=lambda c: c.get("total_score", 0), reverse=True)[:TOP_LOSERS]

        # Ghép lại: winner trước, losers sau
        selected = [(winner, 1)] + [(c, 0) for c in losers_top5]

        rows = []
        for cand, is_correct in selected:
            rows.append((
                healing_event_id,
                step_name,
                ui_version,
                cand.get("attr_score",    0),
                cand.get("sem_score",     0),
                cand.get("struct_score",  0),
                cand.get("visual_score",  0),
                cand.get("ctx_score",     0),
                cand.get("total_score",   0),
                cand.get("cand_tag",      ""),
                cand.get("cand_testid",   ""),
                cand.get("cand_text",     ""),
                is_correct,
            ))

        with self._connect() as conn:
            conn.executemany("""
                INSERT INTO candidate_scores (
                    healing_event_id, step_name, ui_version,
                    attr_score, sem_score, struct_score,
                    visual_score, ctx_score, total_score,
                    cand_tag, cand_testid, cand_text,
                    is_correct
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)

        n_losers = len(rows) - 1
        logger.info(
            f"[DB] Saved {len(rows)} candidates for step='{step_name}' "
            f"(1 winner + {n_losers} losers) "
            f"[{len(candidates) - 1 - n_losers} losers discarded]"
        )
        return len(rows)

    def get_training_data_v2(self, min_samples: int = 20) -> List[Dict]:
        """
        Lấy training data từ candidate_scores (bảng 4).

        Đây là phiên bản đúng — thay thế get_training_data() cũ
        vốn chỉ lấy data từ healing_events (không có negative samples).

        Mỗi dict trả về:
            attr_score, sem_score, struct_score, visual_score, ctx_score
            → is_correct  (label: 1=winner, 0=loser)

        Phân phối mẫu điển hình:
            is_correct=1 : 1 dòng/healing   (minority class)
            is_correct=0 : N-1 dòng/healing  (majority class)
        → WeightOptimizer sẽ dùng class_weight="balanced" để xử lý
        """
        with self._connect() as conn:
            rows = conn.execute("""
                SELECT
                    attr_score,
                    sem_score,
                    struct_score,
                    visual_score,
                    ctx_score,
                    total_score,
                    is_correct
                FROM candidate_scores
                ORDER BY recorded_at DESC
            """).fetchall()

        if len(rows) < min_samples:
            logger.warning(
                f"[DB] candidate_scores chưa đủ data: "
                f"{len(rows)}/{min_samples} samples"
            )
            return []

        result = [dict(r) for r in rows]

        # Log thống kê để dễ debug
        n_pos = sum(1 for r in result if r["is_correct"] == 1)
        n_neg = len(result) - n_pos
        logger.info(
            f"[DB] Training data v2: {len(result)} samples "
            f"(winners={n_pos}, losers={n_neg}, ratio=1:{n_neg//n_pos if n_pos else '?'})"
        )
        return result

    def get_candidate_stats(self) -> Dict:
        """
        Thống kê bảng candidate_scores.
        Dùng để kiểm tra data trước khi train ML.
        """
        with self._connect() as conn:
            total = conn.execute(
                "SELECT COUNT(*) FROM candidate_scores"
            ).fetchone()[0]

            winners = conn.execute(
                "SELECT COUNT(*) FROM candidate_scores WHERE is_correct=1"
            ).fetchone()[0]

            avg_winner_score = conn.execute(
                "SELECT AVG(total_score) FROM candidate_scores WHERE is_correct=1"
            ).fetchone()[0] or 0

            avg_loser_score = conn.execute(
                "SELECT AVG(total_score) FROM candidate_scores WHERE is_correct=0"
            ).fetchone()[0] or 0

            by_version = conn.execute("""
                SELECT ui_version,
                       COUNT(*) as total,
                       SUM(is_correct) as winners
                FROM candidate_scores
                GROUP BY ui_version
            """).fetchall()

        return {
            "total_candidates":   total,
            "total_winners":      winners,
            "total_losers":       total - winners,
            "avg_winner_score":   round(avg_winner_score, 4),
            "avg_loser_score":    round(avg_loser_score,  4),
            "score_gap":          round(avg_winner_score - avg_loser_score, 4),
            "by_version":         [dict(r) for r in by_version],
        }

    def get_training_data(self, element_type: Optional[str] = None,
                          min_samples: int = 10) -> List[Dict]:
        """
        Lấy dữ liệu training cho ML từ healing_events.

        Tham số:
            element_type: Lọc theo loại element (None = lấy tất cả)
            min_samples : Chỉ trả về nếu có đủ số sample

        Trả về: list of dict với keys X (feature vector) và y (label)

        Đây là bước "data collection" trong ML pipeline.
        """
        with self._connect() as conn:
            rows = conn.execute("""
                SELECT
                    attr_score, sem_score, struct_score,
                    visual_score, ctx_score,
                    healing_success
                FROM healing_events
                WHERE total_score > 0
                ORDER BY healed_at DESC
            """).fetchall()

        if len(rows) < min_samples:
            logger.warning(f"[DB] Chưa đủ training data: {len(rows)}/{min_samples}")
            return []

        return [dict(r) for r in rows]

    def get_healing_stats(self) -> Dict:
        """
        Thống kê tổng quan về healing history.
        Dùng cho dashboard và báo cáo.
        """
        with self._connect() as conn:
            total = conn.execute(
                "SELECT COUNT(*) FROM healing_events").fetchone()[0]
            success = conn.execute(
                "SELECT COUNT(*) FROM healing_events WHERE healing_success=1"
            ).fetchone()[0]
            avg_score = conn.execute(
                "SELECT AVG(total_score) FROM healing_events WHERE healing_success=1"
            ).fetchone()[0] or 0
            by_version = conn.execute("""
                SELECT ui_version,
                       COUNT(*) as total,
                       SUM(healing_success) as success
                FROM healing_events
                GROUP BY ui_version
            """).fetchall()

        return {
            "total_events":   total,
            "success_count":  success,
            "fail_count":     total - success,
            "success_rate":   success / total if total > 0 else 0,
            "avg_score":      round(avg_score, 4),
            "by_version":     [dict(r) for r in by_version]
        }

    # ──────────────────────────────────────────────────────────────
    # BẢNG 3: learned_weights
    # ──────────────────────────────────────────────────────────────

    def save_learned_weights(self, weights: Dict[str, float],
                             accuracy: float,
                             n_samples: int,
                             notes: str = ""):
        """
        Lưu trọng số đã học từ ML model vào database.
        Mỗi lần retrain → insert 1 hàng mới (giữ lịch sử).
        """
        with self._connect() as conn:
            conn.execute("""
                INSERT INTO learned_weights (
                    w_attribute, w_semantic, w_structure,
                    w_visual, w_context,
                    accuracy, n_samples, trained_at, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                weights.get('attribute', 0.30),
                weights.get('semantic',  0.25),
                weights.get('structure', 0.20),
                weights.get('visual',    0.10),
                weights.get('context',   0.15),
                accuracy, n_samples,
                datetime.now().isoformat(),
                notes,
            ))
            logger.info(f"[DB] Saved learned weights: "
                        f"accuracy={accuracy:.2%} n={n_samples}")

    def load_learned_weights(self) -> Optional[Dict[str, float]]:
        """
        Load trọng số mới nhất từ bảng learned_weights.
        Trả về None nếu chưa có → SimilarityEngine sẽ dùng default weights.
        """
        with self._connect() as conn:
            row = conn.execute("""
                SELECT w_attribute, w_semantic, w_structure,
                       w_visual, w_context, accuracy, n_samples
                FROM learned_weights
                ORDER BY id DESC LIMIT 1
            """).fetchone()

        if row is None:
            return None

        return {
            'attribute':  row['w_attribute'],
            'semantic':   row['w_semantic'],
            'structure':  row['w_structure'],
            'visual':     row['w_visual'],
            'context':    row['w_context'],
            '_accuracy':  row['accuracy'],
            '_n_samples': row['n_samples'],
        }

    def load_all_weights(self) -> List[Dict]:
        """Load toàn bộ lịch sử learned weights theo thứ tự thời gian."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM learned_weights ORDER BY id ASC"
            ).fetchall()

        return [
            {
                'id':         row['id'],
                'trained_at': row['trained_at'],
                'n_samples':  row['n_samples'],
                'accuracy':   row['accuracy'],
                'attribute':  row['w_attribute'],
                'semantic':   row['w_semantic'],
                'structure':  row['w_structure'],
                'visual':     row['w_visual'],
                'context':    row['w_context'],
                'notes':      row['notes'],
            }
            for row in rows
        ]
    def kb_lookup(self, step_name: str, old_by: str,
                  old_val: str, ui_version: str = "v1") -> Optional[Tuple[str, str]]:
        """Tra cache KB. Trả về (new_by, new_val) hoặc None nếu không có."""
        with self._connect() as conn:
            row = conn.execute("""
                SELECT new_locator_type, new_locator_value
                FROM knowledge_base
                WHERE step_name=? AND ui_version=?
                  AND old_locator_type=? AND old_locator_value=?
            """, (step_name, ui_version, old_by, old_val)).fetchone()

        if row:
            return row["new_locator_type"], row["new_locator_value"]
        return None

    def kb_learn(self, step_name: str, old_by: str, old_val: str,
                 new_by: str, new_val: str, confidence: float,
                 similarity_detail: dict, ui_version: str = "v1"):
        """Lưu hoặc cập nhật một entry vào KB cache."""
        with self._connect() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO knowledge_base (
                    step_name, ui_version,
                    old_locator_type, old_locator_value,
                    new_locator_type, new_locator_value,
                    confidence, similarity_detail, learned_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                step_name, ui_version,
                old_by, old_val,
                new_by, new_val,
                confidence,
                json.dumps(similarity_detail, ensure_ascii=False),
                datetime.now().isoformat(),
            ))
        logger.debug(f"[KB] Learned: step='{step_name}' "
                     f"'{old_val}' → '{new_val}' (conf={confidence:.2f})")

    def kb_increment_usage(self, step_name: str, old_by: str,
                           old_val: str, ui_version: str = "v1"):
        """Tăng counter mỗi khi cache hit được dùng thành công."""
        with self._connect() as conn:
            conn.execute("""
                UPDATE knowledge_base
                SET times_used   = times_used + 1,
                    last_used_at = datetime('now')
                WHERE step_name=? AND ui_version=?
                  AND old_locator_type=? AND old_locator_value=?
            """, (step_name, ui_version, old_by, old_val))

    def kb_get_all(self) -> List[Dict]:
        """Lấy toàn bộ KB — dùng để debug hoặc export."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM knowledge_base ORDER BY learned_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]

    def kb_stats(self) -> Dict:
        """Thống kê nhanh bảng knowledge_base."""
        with self._connect() as conn:
            total = conn.execute(
                "SELECT COUNT(*) FROM knowledge_base"
            ).fetchone()[0]
            hits = conn.execute(
                "SELECT SUM(times_used) FROM knowledge_base"
            ).fetchone()[0] or 0
            by_version = conn.execute("""
                SELECT ui_version, COUNT(*) as entries,
                       SUM(times_used) as total_hits
                FROM knowledge_base
                GROUP BY ui_version
                ORDER BY ui_version
            """).fetchall()

        return {
            "total_entries": total,
            "total_hits":    hits,
            "by_version":    [dict(r) for r in by_version],
        }