"""
scripts/db_stats.py
───────────────────
In thống kê healing.db ra console để dễ theo dõi trên GitHub Actions log.
Không can thiệp vào logic của Healing_driver_v2.
"""

import sqlite3
import os
import sys
from pathlib import Path

DB_PATH = os.environ.get("HEALING_DB_PATH", "healing.db")


def print_stats():
    db = Path(DB_PATH)
    if not db.exists():
        print(f"⚠️  {DB_PATH} chưa tồn tại (lần chạy đầu tiên hoặc cache miss)")
        return

    size_kb = db.stat().st_size / 1024
    print(f"\n{'═'*55}")
    print(f"  HEALING DATABASE STATS — {DB_PATH} ({size_kb:.1f} KB)")
    print(f"{'═'*55}")

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row

            # ── Heal events ──────────────────────────────────────────
            total = conn.execute(
                "SELECT COUNT(*) FROM healing_events"
            ).fetchone()[0]

            success = conn.execute(
                "SELECT COUNT(*) FROM healing_events WHERE healing_success = 1"
            ).fetchone()[0]

            failed = total - success

            print(f"  Heal events total   : {total}")
            print(f"  ├─ Successful heals : {success}  ← dùng để tính train threshold")
            print(f"  └─ Failed heals     : {failed}")

            # ── Training threshold ────────────────────────────────────
            FIRST_TRAIN_AT   = 140
            RETRAIN_EVERY    = 20

            if success < FIRST_TRAIN_AT:
                remaining = FIRST_TRAIN_AT - success
                print(f"\n  Train threshold     : {success}/{FIRST_TRAIN_AT}")
                print(f"  ⏳ Còn thiếu {remaining} successful heals nữa để train lần đầu")
            else:
                should_have_trained = 1 + (success - FIRST_TRAIN_AT) // RETRAIN_EVERY
                print(f"\n  Train threshold     : ĐÃ ĐẠT ({success} successful heals)")
                print(f"  Nên đã train        : {should_have_trained} lần")

            # ── Lịch sử train từ learned_weights ─────────────────────
            try:
                history = conn.execute(
                    "SELECT COUNT(*) FROM learned_weights"
                ).fetchone()[0]

                print(f"  Actual train count  : {history} lần")

                if history > 0:
                    last = conn.execute(
                        "SELECT * FROM learned_weights ORDER BY trained_at DESC LIMIT 1"
                    ).fetchone()
                    if last:
                        print(f"\n  Last trained at     : {last['trained_at']}")
                        # In weights nếu có cột riêng
                        for col in last.keys():
                            if col not in ('id', 'trained_at', 'trigger_count'):
                                val = last[col]
                                if isinstance(val, float):
                                    print(f"    {col:<14}: {val:.4f}")

            except sqlite3.OperationalError:
                print(f"  learned_weights     : (bảng chưa tồn tại — chưa train lần nào)")

            # ── Retrain history ───────────────────────────────────────
            try:
                retrain_count = conn.execute(
                    "SELECT COUNT(*) FROM retrain_history"
                ).fetchone()[0]
                print(f"  Retrain history     : {retrain_count} entries")
            except sqlite3.OperationalError:
                pass

            # ── Candidates ────────────────────────────────────────────
            try:
                cands = conn.execute(
                    "SELECT COUNT(*) FROM candidate_scores"
                ).fetchone()[0]
                print(f"  Candidate scores    : {cands} rows (training data)")
            except sqlite3.OperationalError:
                pass

        print(f"{'═'*55}\n")

    except Exception as e:
        print(f"❌ Không đọc được DB: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print_stats()
