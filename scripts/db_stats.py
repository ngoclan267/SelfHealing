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
            print(f"  ├─ Successful heals : {success} ")
            print(f"  └─ Failed heals     : {failed}")

            # ── Training threshold ────────────────────────────────────
            FIRST_TRAIN_AT   = 100
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
                        for col in last.keys():
                            if col not in ('id', 'trained_at', 'notes', 'trigger_count'):
                                val = last[col]
                                if isinstance(val, float):
                                    print(f"    {col:<14}: {val:.4f}")
                                elif val is not None:
                                    print(f"    {col:<14}: {val}")

            except sqlite3.OperationalError:
                print(f"  learned_weights     : (bảng chưa tồn tại — chưa train lần nào)")

            # ── Candidates ────────────────────────────────────────────
            try:
                cands = conn.execute(
                    "SELECT COUNT(*) FROM candidate_scores"
                ).fetchone()[0]
                winners = conn.execute(
                    "SELECT COUNT(*) FROM candidate_scores WHERE is_correct=1"
                ).fetchone()[0]
                print(f"\n  Candidate scores    : {cands} rows (training data)")
                print(f"  ├─ Winners          : {winners}")
                print(f"  └─ Losers           : {cands - winners}")
            except sqlite3.OperationalError:
                pass

            # ── Locator Cache (MỚI — thay healing_map.json) ──────────
            try:
                cache_total = conn.execute(
                    "SELECT COUNT(*) FROM locator_cache"
                ).fetchone()[0]
                cache_hits_total = conn.execute(
                    "SELECT COALESCE(SUM(times_used), 0) FROM locator_cache"
                ).fetchone()[0]

                print(f"\n  Locator cache       : {cache_total} entries (thay healing_map.json)")
                print(f"  └─ Tổng cache hits  : {cache_hits_total} lần skip full-healing")

                if cache_total > 0:
                    top_rows = conn.execute("""
                        SELECT step_name, old_locator_value, new_locator_value,
                               times_used, confidence
                        FROM locator_cache
                        ORDER BY times_used DESC LIMIT 5
                    """).fetchall()
                    if top_rows:
                        print(f"\n  Top cache entries (by hits):")
                        for r in top_rows:
                            print(f"    [{r['times_used']:>3}x] step={r['step_name'][:25]:<25} "
                                  f"-> {r['new_locator_value'][:30]} "
                                  f"(conf={r['confidence']:.2f})")
            except sqlite3.OperationalError:
                print(f"\n  Locator cache       : (bảng chưa tồn tại — cần migrate DB)")

        print(f"{'═'*55}\n")

    except Exception as e:
        print(f"❌ Không đọc được DB: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print_stats()