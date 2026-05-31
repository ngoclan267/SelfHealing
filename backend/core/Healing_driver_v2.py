"""
LUỒNG TỔNG QUÁT (V2 — Static Weights):
    find_element(by, value, step_name, ui_version, snapshot)
        ↓ thành công
        → lưu snapshot vào SQLite → trả về element
        ↓ thất bại (NoSuchElementException)
        → ExceptionInterceptor.intercept()
        → nếu should_heal=True → _full_healing()
            → load snapshot từ DB
            → SimilarityEngineV2.calculate() (5 chiều + STATIC weights)
            → CandidateRanker.rank()
            → lưu healing_event vào SQLite
            → lưu TẤT CẢ candidates vào candidate_scores
            → trả về best element
THIẾT KẾ:
    - Trọng số 5 chiều được định nghĩa tĩnh trong SimilarityEngineV2
    - Toàn bộ dữ liệu healing vẫn được lưu vào SQLite (healing_events,
      candidate_scores) để phân tích và train model offline sau 
"""

import json
import logging
import requests
import sqlite3
import core.Similarity_engine_v2 as se_module
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Tuple

from selenium.webdriver.common.by import By
from selenium.common.exceptions import (
    NoSuchElementException,
    UnexpectedAlertPresentException,
    NoAlertPresentException,
)

from .Snapshot import ElementSnapshot, SnapshotStore, capture_snapshot
from .Similarity_engine_v2 import (
    SimilarityEngineV2, Candidate, find_candidates_v2, STATIC_WEIGHTS
)
from .Exception_interceptor import (
    ExceptionInterceptor, RecoveryActions,
    HealingStrategy, InterceptionResult,
)
from .Logistic_weight_model import LogisticWeightModel
logger = logging.getLogger("HealingDriverV2")
logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)

API_BASE = "http://localhost:5000"

class CandidateRanker:
    """Xếp hạng danh sách ứng viên — giữ nguyên logic từ v1."""
    THRESHOLD_AUTO    = 0.70
    THRESHOLD_SUGGEST = 0.50

    def rank(self, candidates: List[Candidate]) -> Tuple[Optional[Candidate], str]:
        if not candidates:
            return None, "FAILED"
        best = candidates[0]
        if best.score >= self.THRESHOLD_AUTO:
            return best, "AUTO_FIX"
        elif best.score >= self.THRESHOLD_SUGGEST:
            return best, "SUGGEST"
        return best, "FAILED"

    def get_best_locator(self, driver, element) -> Tuple[str, str]:
        """Chọn locator bền vững nhất: data-testid > aria-label > name > ..."""
        tag = element.tag_name
        priority_attrs = [
            ("data-testid", lambda v: (By.XPATH, f"//{tag}[@data-testid='{v}']")),
            ("aria-label",  lambda v: (By.XPATH, f"//{tag}[@aria-label='{v}']")),
            ("name",        lambda v: (By.NAME, v)),
            ("placeholder", lambda v: (By.XPATH, f"//{tag}[@placeholder='{v}']")),
            ("id",          lambda v: (By.ID, v)),
        ]
        for attr, builder in priority_attrs:
            val = element.get_attribute(attr)
            if val:
                return builder(val)
        text = (element.text or "").strip()
        if text and tag in ("button", "a"):
            return By.XPATH, f"//{tag}[normalize-space(text())='{text}']"
        return By.XPATH, f"//{tag}"

    def print_report(self, candidates, chosen, action, failed_locator):
        print(f"\n{'═'*65}")
        print(f"LOCATOR THẤT BẠI: {failed_locator}")
        print(f"Đã quét DOM, tìm được {len(candidates)} ứng viên")
        print(f"{'─'*65}")
        for i, c in enumerate(candidates[:5]):
            fp  = c.snapshot
            bar = "*" * int(c.score * 10) + "-" * (10 - int(c.score * 10))
            print(f"  [{i+1}] {bar} {c.score:.1%}  "
                  f"id='{fp.id or '-':15}'  "
                  f"text='{(fp.text or '')[:20]:20}'  "
                  f"testid='{fp.data_testid or '-'}'")
        if chosen:
            sim = chosen.similarity
            print(f"\n ỨNG VIÊN ĐƯỢC CHỌN (score={chosen.score:.1%}):")
            print(f"  Attr:{sim.attribute_score:.2f}  Sem:{sim.semantic_score:.2f}  "
                  f"Struct:{sim.structure_score:.2f}  "
                  f"Vis:{sim.visual_score:.2f}  Ctx:{sim.context_score:.2f}")
            w = sim.weights_used
            print(f"  Weights [{'LEARNED' if w.get('_source') == 'lr' else 'STATIC'}]: "
                  f"attr={w.get('attribute',0):.2f}"
                  f"sem={w.get('semantic',0):.2f}"
                  f"struct={w.get('structure',0):.2f}"
                  f"vis={w.get('visual',0):.2f}  "
                  f"ctx={w.get('context',0):.2f}")
            print(f"  -> QUYẾT ĐỊNH: {action}")
        else:
            print(" KHÔNG TÌM ĐƯỢC ỨNG VIÊN PHÙ HỢP -> FAILED")
        print(f"{'═'*65}\n")


class SelfHealingDriverV2:
    def __init__(self, driver,
                 test_name:    str = "default",
                 snapshot_dir: str = "snapshots",
                 db_path:      str = "healing.db",
                 kb_dir:       str = "knowledge_base"):
        """
        Tham số:
            driver       : Selenium WebDriver instance
            test_name    : Tên test run (dùng để log)
            snapshot_dir : Thư mục lưu snapshot JSON (fallback)
            db_path      : Đường dẫn SQLite database
            kb_dir       : Thư mục Knowledge Base (locator cache)
        Weights: Ban đầu = STATIC, tự động chuyển sang LEARNED sau mỗi 30 healing thành công tích lũy trong DB.
        """
        self._drv         = driver
        self.test_name    = test_name
        self._store       = SnapshotStore(snapshot_dir)
        self._interceptor = ExceptionInterceptor()
        self._recovery    = RecoveryActions(driver)
        self._ranker      = CandidateRanker()
        self._session_log = []
        #Khởi tạo model, luôn tạo model kể cả khi DB chưa có dữ liệu, model tự load trọng số mới nhất từ bảng learned_weights.
        self._lr_model = LogisticWeightModel(db_path=db_path)
        try:
            from db.db_manager import DBManager
            self._db           = DBManager(db_path)
            self._db_available = True
            current_weights = self._lr_model.get_current_weights()
            self._sim_engine   = SimilarityEngineV2() 
            self._active_weights = current_weights

            logger.info(
                f"SQLite DB: {db_path}\n"
                f"  -> Weights hiện tại: {current_weights}\n"
                f"  -> Train lần đầu: sau {LogisticWeightModel.FIRST_TRAIN_AFTER} heal | "
                f"Retrain định kỳ: mỗi {LogisticWeightModel.RETRAIN_EVERY} heal tiếp theo"
            )

        except ImportError as e:
            logger.warning(f"DB module không load được: {e}")
            self._db           = None
            self._sim_engine   = SimilarityEngineV2(None)
            self._active_weights = self._lr_model.get_current_weights()
            self._db_available = False

        self._kb = _SimpleKnowledgeBase(kb_dir)
    # Đếm heal thành công trong DB để trigger retrain
    def _count_successful_heal_in_db(self) ->int:
        """Đếm tổng số heal_event có success=1 trong DB, nếu không có trả về 0"""
        if not self._db_available:
            return 0
        try:
            with sqlite3.connect(self._db.db_path) as conn:
                count = conn.execute(
                    "Select count(*) from healing_events where healing_success = 1"
                ).fetchone()[0]
            return count
        except Exception as e:
            logger.debug(f"Không đếm đươck heal count: {e}")
            return 0
    def _maybe_retrain_model(self):
        """
        Kiểm tra điều kiện trigger retrain theo 2 giai đoạn:
          - Lần đầu : train khi total_success >= FIRST_TRAIN_AFTER (60)
          - Các lần sau: retrain thêm mỗi khi tích lũy thêm RETRAIN_EVERY (20) heal
        """
        try:
            total_success   = self._count_successful_heal_in_db()
            history_count   = self._lr_model._count_retrain_history()
            first_threshold = LogisticWeightModel.FIRST_TRAIN_AFTER   # 60
            retrain_every   = LogisticWeightModel.RETRAIN_EVERY        # 20

            # Tính số lần đáng lẽ đã train dựa trên công thức 2 giai đoạn
            if total_success < first_threshold:
                # Chưa đủ 60 heal → chưa train lần nào
                should_have_trained = 0
            else:
                # Lần 1 tại heal thứ 60, rồi mỗi 20 heal tiếp theo
                should_have_trained = 1 + (total_success - first_threshold) // retrain_every

            logger.debug(
                f"[Retrain check] total_success={total_success} | "
                f"history_count={history_count} | "
                f"first_threshold={first_threshold} | "
                f"retrain_every={retrain_every} | "
                f"should_have_trained={should_have_trained}"
            )

            if should_have_trained > history_count:
                logger.info(
                    f"[Retrain] Đạt milestone: {total_success} heals "
                    f"(cần train lần #{history_count + 1}) "
                    f"-> Bắt đầu retrain..."
                )
                new_weights = self._lr_model.retrain()
                if new_weights:
                    self._active_weights = new_weights
                    logger.info(
                        f"[Retrain] Model cập nhật thành công. "
                        f"Trọng số mới sẽ áp dụng từ heal tiếp theo."
                    )
                else:
                    logger.warning("[Retrain] retrain() trả về None - giữ weights cũ")
        except Exception as e:
            import traceback
            logger.error(
                f"[Retrain] _maybe_retrain_model lỗi: {e}\n"
                f"{traceback.format_exc()}"
            )
    def _is_driver_alive(self):
        try:
            return (
                self._drv is not None and
                getattr(self._drv, "session_id", None) is not None
            )
        except Exception:
            return False

    def find_element(self, by, value,
                     step_name:  str = "",
                     ui_version: str = "v1",
                     snapshot:   Optional[ElementSnapshot] = None):
        """
        Tìm element với self-healing.
        Bước 1: Thử find bình thường → nếu thành công:
            - Chụp snapshot -> lưu JSON + SQLite
            - Trả về element
        Bước 2: Thất bại -> ExceptionInterceptor phân loại
        Bước 3: Nếu cần healing -> _full_healing()
            ->Dùng STATIC weights để tính similarity
            ->Lưu candidates vào DB (training data cho sau này)
        """
        try:
            element = self._drv.find_element(by, value)

            # Lưu snapshot khi tìm thành công
            if step_name:
                snap = capture_snapshot(
                    self._drv, element,
                    step_name  = step_name,
                    ui_version = "v1",
                    loc_type   = str(by),
                    loc_value  = value
                )
                self._store.save(snap)
                if self._db_available:
                    self._db.save_snapshot(snap)

            return element

        except UnexpectedAlertPresentException:
            try:
                alert = self._drv.switch_to.alert
                logger.info(f"[Alert] {alert.text}")
                alert.accept()
            except NoAlertPresentException:
                pass
            return self._drv.find_element(by, value)

        except Exception as raw_exc:
            # Module 1: phân loại exception
            result = self._interceptor.intercept(raw_exc, step_name)
            logger.warning(f"[M1] {result.message}")

            # Recovery strategies không cần healing (stale ref, timeout)
            recovered = self._handle_recovery(by, value, result)
            if recovered is not None:
                return recovered

            # Healing pipeline
            if result.should_heal:
                # Tra cache Knowledge Base trước
                cached = self._kb.lookup(step_name, str(by), value, ui_version)
                if cached:
                    new_by, new_val = cached
                    try:
                        element = self._drv.find_element(new_by, new_val)
                        self._kb.increment_usage(step_name, str(by), value, ui_version)
                        logger.info(f"[KB] Cache hit: {new_val}")
                        return element
                    except Exception:
                        logger.warning("[KB] Cache stale, chạy full healing...")

                # Full healing pipeline với static weights
                return self._full_healing(by, value, step_name, ui_version, snapshot)

            raise raw_exc

    def _handle_recovery(self, by, value, result: InterceptionResult):
        """Recovery không cần healing (stale element, timeout)"""
        if result.strategy == HealingStrategy.RETRY_FIND:
            return self._recovery.retry_find(by, value)
        if result.strategy == HealingStrategy.WAIT_AND_RETRY:
            return self._recovery.wait_and_find(by, value)
        return None

    def _full_healing(self, failed_by, failed_value,
                      step_name, ui_version,
                      provided_snapshot=None):
        """Pipeline healing đầy đủ"""
        history_count = self._lr_model._count_retrain_history()
        weight_source = f"LEARNED (retrain #{history_count})" if history_count >0\
            else "STATIC (chưa có đủ dữ liệu để train)"
        print("\n{-}*65")
        print(f"\n'HEALING PIPELINE LR weights:{weight_source}'")
        print(f"{'-'*65}")

        # Module 2: Load snapshot
        # Ưu tiên: snapshot truyền vào > SQLite > JSON file
        original = provided_snapshot

        if original is None and self._db_available:
            snap_dict = self._db.load_snapshot_dict(step_name, "v1")
            if snap_dict:
                original = self._dict_to_snapshot(snap_dict)
                logger.info(f"[M2] Loaded snapshot from SQLite: "
                            f"tag={original.tag} id={original.id}")

        if original is None:
            original = self._store.load(step_name, "v1")
            if original:
                logger.info(f"[M2] Loaded snapshot from JSON: "
                            f"tag={original.tag} id={original.id}")

        if original is None:
            logger.error(f"[M2] Không có snapshot cho step='{step_name}'")
            self._save_healing_event(
                step_name, ui_version, failed_by, failed_value,
                None, None, {}, False, "FAILED"
            )
            raise NoSuchElementException(
                f"[Healing] Không có snapshot cho '{step_name}'. "
                f"Cần chạy thành công ít nhất 1 lần với locator đúng."
            )

        # Module 3: Quét DOM + tính similarity Trọng số động: lấy từ LR model (LEARNED hoặc STATIC)
        active_weights = dict(self._active_weights)
        active_weights['_source']='lr' if history_count >0 else 'static'
        
        logger.info(
            f"[M3] Quét DOM — weights: "
            f"attr={active_weights.get('attribute', 0):.3f}  "
            f"sem={active_weights.get('semantic', 0):.3f}  "
            f"struct={active_weights.get('structure', 0):.3f}  "
            f"vis={active_weights.get('visual', 0):.3f}  "
            f"ctx={active_weights.get('context', 0):.3f}"
        )
        runtime_weights = {
            k: v
            for k, v in active_weights.items()
            if k != '_source'
        }

        candidates = find_candidates_v2(
            self._drv,
            original,
            self._sim_engine,
            min_score=0.40,
            weights=runtime_weights
        )
        # Module 4: Xếp hạng
        best, action = self._ranker.rank(candidates)
        self._ranker.print_report(
            candidates, best, action,
            f"{failed_by}='{failed_value}'"
        )

        self._sim_engine.explain(
            original, candidates, best,
            threshold=self._ranker.THRESHOLD_SUGGEST
        )

        if action == "FAILED" or best is None:
            event_id = self._save_healing_event(
                step_name, ui_version, str(failed_by), failed_value,
                None, None, {}, False, "FAILED"
            )
            # Lưu losers vào candidate_scores (winner_index=-1 = không có winner)
            self._save_all_candidates(event_id, step_name, ui_version,
                                      candidates, winner_index=-1)
            raise NoSuchElementException(
                f"[Healing FAILED] '{failed_value}' — "
                f"best score = {best.score if best else 0:.1%}"
            )

        # Lấy locator bền nhất cho element tìm được
        new_by, new_val = self._ranker.get_best_locator(self._drv, best.element)

        # Module 5: Lưu kết quả healing
        scores = {
            'attribute': best.similarity.attribute_score,
            'semantic':  best.similarity.semantic_score,
            'structure': best.similarity.structure_score,
            'visual':    best.similarity.visual_score,
            'context':   best.similarity.context_score,
            'total':     best.score,
        }

        # Cập nhật Knowledge Base (cache locator cho lần sau)
        self._kb.learn(
            step_name, str(failed_by), failed_value,
            str(new_by), new_val, best.score,
            asdict(best.similarity), ui_version
        )

        # Lưu healing_event vào SQLite
        event_id = self._save_healing_event(
            step_name, ui_version, str(failed_by), failed_value,
            str(new_by), new_val, scores, True, action
        )

        # Lưu TẤT CẢ candidates vào candidate_scores
        # candidates[0] = winner (is_correct=1)
        # candidates[1:] = losers (is_correct=0)
        self._save_all_candidates(event_id, step_name, ui_version,
                                  candidates, winner_index=0)

        # Push log lên API server (tùy chọn)
        self._push_api_log(step_name, ui_version, failed_by, failed_value,
                           action, best.score, scores, [str(new_by), new_val])

        logger.info(f"[M5] Healing OK: '{failed_value}' -> '{new_val}' "
                    f"(score={best.score:.1%} action={action})")
        self._maybe_retrain_model()
        return best.element

    def _save_healing_event(self, step_name, ui_version,
                            original_by, original_value,
                            healed_by, healed_value,
                            scores, success, action) -> int:
        """
        Lưu healing event vào SQLite + session log.
        Trả về: event_id để save_candidate_scores dùng làm FK
        """
        entry = {
            "test_name":      self.test_name,
            "step_name":      step_name,
            "ui_version":     ui_version,
            "failed_locator": f"{original_by}='{original_value}'",
            "action":         action,
            "confidence":     scores.get('total', 0),
            "score_detail":   scores,
            "new_locator":    [healed_by, healed_value],
            "timestamp":      datetime.now().isoformat(),
        }
        self._session_log.append(entry)

        event_id = -1
        if self._db_available:
            try:
                event_id = self._db.save_healing_event(
                    step_name      = step_name,
                    ui_version     = ui_version,
                    original_by    = original_by,
                    original_value = original_value,
                    healed_by      = healed_by,
                    healed_value   = healed_value,
                    scores         = scores,
                    success        = success,
                    action         = action,
                )
            except Exception as e:
                logger.warning(f"[DB] save_healing_event failed: {e}")
        return event_id

    def _save_all_candidates(self, event_id: int, step_name: str,
                             ui_version: str, candidates: list,
                             winner_index: int):
        """Lưu TẤT CẢ ứng viên vào candidate_scores"""
        if not self._db_available or not candidates:
            return
        try:
            self._db.save_candidate_scores(
                healing_event_id = event_id,
                step_name        = step_name,
                ui_version       = ui_version,
                candidates       = [
                    {
                        "attr_score":   c.similarity.attribute_score,
                        "sem_score":    c.similarity.semantic_score,
                        "struct_score": c.similarity.structure_score,
                        "visual_score": c.similarity.visual_score,
                        "ctx_score":    c.similarity.context_score,
                        "total_score":  c.score,
                        "cand_tag":     c.snapshot.tag,
                        "cand_testid":  c.snapshot.data_testid or "",
                        "cand_text":    (c.snapshot.text or "")[:50],
                    }
                    for c in candidates
                ],
                winner_index = winner_index,
            )
            logger.debug(
                f"[DB] Saved {len(candidates)} candidates "
                f"(winner_idx={winner_index})"
            )
        except Exception as e:
            logger.warning(f"[DB] save_candidate_scores failed: {e}")

    def _dict_to_snapshot(self, d: dict) -> ElementSnapshot:
        """Chuyển dict từ SQLite row -> ElementSnapshot object"""
        from .Snapshot import ElementSnapshot
        mapping = {
            'step_name':     d.get('step_name', ''),
            'ui_version':    d.get('ui_version', 'v1'),
            'tag':           d.get('tag', 'div'),
            'id':            d.get('el_id'),
            'classes':       d.get('classes', []),
            'name':          d.get('name_attr'),
            'input_type':    d.get('input_type'),
            'placeholder':   d.get('placeholder'),
            'aria_label':    d.get('aria_label'),
            'data_testid':   d.get('data_testid'),
            'text':          d.get('text_content'),
            'role':          d.get('role_attr'),
            'href':          d.get('href'),
            'xpath_abs':     d.get('xpath_abs'),
            'parent_tag':    d.get('parent_tag'),
            'parent_id':     d.get('parent_id'),
            'depth':         d.get('depth', 0),
            'sibling_index': d.get('sibling_index', 0),
            'siblings_count':d.get('siblings_count', 0),
            'bounding_w':    d.get('bounding_w', 0),
            'bounding_h':    d.get('bounding_h', 0),
            'bounding_x':    d.get('bounding_x', 0),
            'bounding_y':    d.get('bounding_y', 0),
            'page_url':      d.get('page_url'),
            'form_context':  d.get('form_context'),
            'nearby_label':  d.get('nearby_label'),
        }
        return ElementSnapshot(**mapping)

    def _push_api_log(self, *args, **kwargs):
        """Gửi log lên FastAPI server (tùy chọn, không ảnh hưởng flow chính)"""
        try:
            step, ui_ver, failed_by, failed_val, action, confidence, detail, new_loc = args
            entry = {
                "test_name":      self.test_name,
                "step_name":      step,
                "ui_version":     ui_ver,
                "failed_locator": f"{failed_by}='{failed_val}'",
                "action":         action,
                "confidence":     confidence,
                "score_detail":   detail,
                "new_locator":    new_loc,
            }
            requests.post(f"{API_BASE}/api/healing-log", json=entry, timeout=2)
        except Exception:
            pass

    def get_session_report(self) -> dict:
        """Báo cáo tổng kết session hiện tại"""
        total    = len(self._session_log)
        success  = sum(1 for e in self._session_log if e.get('action') != 'FAILED')
        db_stats = self._db.get_healing_stats() if self._db_available else {}
        history = self._lr_model._count_retrain_history()
        weights = self._lr_model.get_current_weights()
        return {
            "session_events":  total,
            "session_success": success,
            "session_fail":    total - success,
            "db_total_events": db_stats.get('total_events', 'N/A'),
            "db_success_rate": db_stats.get('success_rate', 'N/A'),
            "lr_retrain_count": history,
            "active_weights": weights,
            "weights_model": "LEARNED" if history >0 else "STATIC",
        }

    def print_session_report(self):
        """In báo cáo session ra console"""
        r = self.get_session_report()
        print(f"\n{'═'*50}")
        print("SESSION REPORT — Self-Healing Driver")
        print(f"{'═'*50}")
        print(f"  Session events:  {r['session_events']}")
        print(f"  Session success: {r['session_success']}")
        print(f"  Session fail:    {r['session_fail']}")
        print(f"  DB total events: {r['db_total_events']}")
        db_rate = r['db_success_rate']
        if isinstance(db_rate, str):
            print(f"  DB success rate: {db_rate}")
        else:
            print(f"  DB success rate: {db_rate:.1%}")
        print(f"LR retrain count: {r['lr_retrain_count']}")
        print(f" Weights model: {r.get('weights_model', 'N/A')}")
        if r.get('weights_model')=='LEARNED':
            w=r['active_weights']
            print(f"Active weights:")
            for k,v in w.items():
                print(f"{k:<12}:{v:.4f}")
        print(f"{'='*55}")

    def __getattr__(self, name):
        """Proxy tất cả method/attribute khác xuống raw driver"""
        try:
            return getattr(self._drv, name)
        except UnexpectedAlertPresentException:
            try:
                alert = self._drv.switch_to.alert
                alert.accept() 
            except NoAlertPresentException:
                pass
            return getattr(self._drv, name)

    def quit(self):
        try:
            self.print_session_report()
        except Exception as e:
            logger.warning(f"[Quit] report failed: {e}")

        try:
            if self._is_driver_alive():
                try:
                    self._drv.quit()
                    logger.info("[Session] WebDriver quit OK")
                except Exception as e:
                    logger.warning(f"[Quit] Selenium quit failed safely: {e}")
            else:
                logger.warning("[Quit] Driver already dead → skip quit()")
        finally:
            logger.info(f"[Session] Ended. Total events: {len(self._session_log)}")

class _SimpleKnowledgeBase:
    """KB đơn giản — cache locator đã heal để tránh heal lại cùng 1 element"""

    def __init__(self, kb_dir: str = "knowledge_base"):
        self.kb_dir   = Path(kb_dir)
        self.kb_dir.mkdir(exist_ok=True)
        self.map_file = self.kb_dir / "healing_map.json"
        self.log_file = self.kb_dir / "healing_log.json"
        self._map = self._load(self.map_file, {})
        self._log = self._load(self.log_file, [])

    def _load(self, path, default):
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                return default
        return default

    def _save(self):
        self.map_file.write_text(
            json.dumps(self._map, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
        self.log_file.write_text(
            json.dumps(self._log, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    def lookup(self, step, old_by, old_val, ui_ver):
        key = f"{step}::{ui_ver}::{old_by}::{old_val}"
        e = self._map.get(key)
        if e:
            return e.get("new_locator_type"), e.get("new_locator_value")
        return None

    def learn(self, step, old_by, old_val, new_by, new_val,
              confidence, detail, ui_ver):
        key = f"{step}::{ui_ver}::{old_by}::{old_val}"
        self._map[key] = {
            "step_name":        step,
            "ui_version":       ui_ver,
            "old_locator_type": old_by,
            "old_locator_value":old_val,
            "new_locator_type": new_by,
            "new_locator_value":new_val,
            "confidence":       confidence,
            "similarity_detail":detail,
            "learned_at":       datetime.now().isoformat(),
            "times_used":       0,
        }
        self._save()

    def increment_usage(self, step, old_by, old_val, ui_ver):
        key = f"{step}::{ui_ver}::{old_by}::{old_val}"
        if key in self._map:
            self._map[key]["times_used"] = (
                self._map[key].get("times_used", 0) + 1
            )
            self._save()

    def add_log(self, entry):
        self._log.append(entry)
        self._save()