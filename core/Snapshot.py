import json
import hashlib
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict
from pathlib import Path

@dataclass
class ElementSnapshot:
    """Luu tru tat ca cac dac diem cua mot phan tu HTML tai thoi diem test pass"""
    # Attribute 
    tag: str = ""
    id: Optional[str] = None
    classes: list = field(default_factory=list)
    name: Optional[str] = None
    input_type: Optional[str] = None
    placeholder: Optional[str] = None
    aria_label: Optional[str] = None
    data_testid: Optional[str] = None

    # Semantic 
    text: Optional[str] = None
    role: Optional[str] = None
    href: Optional[str] = None
    value: Optional[str] = None

    # Structure 
    xpath_abs: Optional[str] = None
    xpath_rel: Optional[str] = None
    parent_tag: Optional[str] = None
    parent_id: Optional[str] = None
    parent_classes: list = field(default_factory=list)
    depth: int = 0
    siblings_count: int = 0
    sibling_index: int = 0

    # Visual 
    bounding_x: float = 0.0
    bounding_y: float = 0.0
    bounding_w: float = 0.0
    bounding_h: float = 0.0
    viewport_w: float = 0.0
    viewport_h: float = 0.0
    is_visible: bool = True
    is_enabled: bool = True
    in_viewport: Optional[bool] = None
    z_index: int = 0
    css_style_hash: Optional[str] = None
    computed_font_size: Optional[str] = None
    computed_color: Optional[str] = None

    # Context 
    page_url: Optional[str] = None
    page_title: Optional[str] = None
    form_context: Optional[str] = None
    nearby_label: Optional[str] = None
    nearest_landmark: Optional[str] = None
    modal_or_overlay: Optional[bool] = None
    shadow_root_depth: int = 0
    scroll_container_hash: Optional[str] = None

    # Meta 
    step_name: str = ""
    ui_version: str = ""
    captured_at: str = field(default_factory=lambda: datetime.now().isoformat())
    locator_type: Optional[str] = None
    locator_value: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "ElementSnapshot":
        valid_fields = {f for f in cls.__dataclass_fields__}
        filtered = {k: v for k, v in d.items() if k in valid_fields}
        return cls(**filtered)

    def fingerprint_hash(self) -> str:
        key = f"{self.step_name}|{self.id}|{self.tag}|{self.text}|{self.ui_version}"
        return hashlib.md5(key.encode()).hexdigest()[:8]

def _safe_get_viewport(driver) -> tuple:
    """
    Lấy kích thước viewport với nhiều fallback.
    Thứ tự ưu tiên: window.innerWidth -> documentElement.clientWidth → 1280×720.
    Không bao giờ trả về 0 để tránh vô hiệu hóa toàn bộ bbox scoring.
    """
    try:
        result = driver.execute_script("""
            return {
                w: window.innerWidth
                   || document.documentElement.clientWidth
                   || document.body.clientWidth
                   || 1280,
                h: window.innerHeight
                   || document.documentElement.clientHeight
                   || document.body.clientHeight
                   || 720
            };
        """)
        vw = float(result.get("w") or 1280)
        vh = float(result.get("h") or 720)
        # Sanity check: viewport không thể nhỏ hơn 100px
        vw = vw if vw >= 100 else 1280.0
        vh = vh if vh >= 100 else 720.0
        return vw, vh
    except Exception:
        return 1280.0, 720.0

def _compute_css_style_hash(driver, element) -> Optional[str]:
    """
    Tạo fingerprint ngắn từ một tập computed CSS property quan trọng.
    Chỉ lấy các thuộc tính ổn định (không phải animation frame).
    """
    try:
        props = driver.execute_script("""
            var s = window.getComputedStyle(arguments[0]);
            return [
                s.display, s.position, s.flexDirection, s.justifyContent,
                s.alignItems, s.fontSize, s.fontWeight, s.color,
                s.backgroundColor, s.borderRadius, s.padding, s.margin,
                s.width, s.height, s.visibility, s.opacity
            ].join('|');
        """, element)
        if props:
            return hashlib.md5(props.encode()).hexdigest()[:12]
    except Exception:
        pass
    return None

def _compute_scroll_container_hash(driver, element) -> Optional[str]:
    """
    Tìm scroll container gần nhất và tạo fingerprint từ id/class của nó.
    """
    try:
        container_sig = driver.execute_script("""
            var el = arguments[0].parentElement;
            var overflow_vals = ['auto', 'scroll', 'overlay'];
            while (el && el !== document.body) {
                var s = window.getComputedStyle(el);
                if (overflow_vals.includes(s.overflow) ||
                    overflow_vals.includes(s.overflowY) ||
                    overflow_vals.includes(s.overflowX)) {
                    return (el.id || '') + '|' + (el.className || '') + '|' + el.tagName;
                }
                el = el.parentElement;
            }
            return 'body';
        """, element)
        if container_sig:
            return hashlib.md5(container_sig.encode()).hexdigest()[:8]
    except Exception:
        pass
    return None

def capture_snapshot(
    driver,
    element,
    step_name: str = "",
    ui_version: str = "",
    loc_type: str = None,
    loc_value: str = None
) -> ElementSnapshot:
    """Chup toan bo dac diem cua 1 WebElement dang ton tai tren trang."""

    # Attributes 
    tag = element.tag_name
    el_id = element.get_attribute("id") or None
    classes_raw = element.get_attribute("class")
    classes = [c for c in classes_raw.split() if c] if classes_raw else []
    name = element.get_attribute("name") or None
    input_type = element.get_attribute("type") or None
    placeholder = element.get_attribute("placeholder") or None
    aria_label = element.get_attribute("aria-label") or None
    data_testid = element.get_attribute("data-testid") or None

    # Semantic
    text = (element.text or "").strip() or None
    role = element.get_attribute("role") or None
    href = element.get_attribute("href") or None
    value = element.get_attribute("value") or None

    # Structure 
    try:
        xpath_abs = driver.execute_script("""
            function getXPath(el) {
                if (el.id) return '//' + el.tagName.toLowerCase() + '[@id="' + el.id + '"]';
                if (el === document.body) return '/html/body';
                var pos = 1, siblings = el.parentNode.childNodes;
                for (var i = 0; i < siblings.length; i++) {
                    var s = siblings[i];
                    if (s === el) return getXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + pos + ']';
                    if (s.nodeType === 1 && s.tagName === el.tagName) pos++;
                }
            }
            return getXPath(arguments[0]);
        """, element)
    except Exception:
        xpath_abs = None

    try:
        parent = driver.execute_script("return arguments[0].parentElement;", element)
        parent_tag = parent.tag_name if parent else None
        parent_id = (parent.get_attribute("id") or None) if parent else None
        parent_cls_raw = (parent.get_attribute("class") or "") if parent else ""
        parent_classes = [c for c in parent_cls_raw.split() if c]
    except Exception:
        parent_tag = parent_id = None
        parent_classes = []

    try:
        sibling_data = driver.execute_script("""
            var el = arguments[0];
            var parent = el.parentElement;
            if (!parent) return {index: 0, count: 0};
            var children = Array.from(parent.children);
            return { index: children.indexOf(el), count: children.length };
        """, element)
        sibling_index = sibling_data.get("index", 0)
        siblings_count = sibling_data.get("count", 0)
    except Exception:
        sibling_index = siblings_count = 0

    try:
        depth = driver.execute_script("""
            var d = 0, el = arguments[0];
            while (el.parentElement) { d++; el = el.parentElement; }
            return d;
        """, element)
    except Exception:
        depth = 0

    # Visual 
    try:
        loc = element.location
        size = element.size
        bx, by = float(loc.get("x", 0)), float(loc.get("y", 0))
        bw, bh = float(size.get("width", 0)), float(size.get("height", 0))
    except Exception:
        bx = by = bw = bh = 0.0

    #Dùng _safe_get_viewport — không bao giờ trả về 0
    viewport_w, viewport_h = _safe_get_viewport(driver)

    try:
        is_visible = element.is_displayed()
        is_enabled = element.is_enabled()
    except Exception:
        is_visible = is_enabled = True

    #in_viewport — log warning nếu JS fail
    try:
        in_viewport = driver.execute_script("""
            var r = arguments[0].getBoundingClientRect();
            return (r.top < window.innerHeight && r.bottom > 0 &&
                    r.left < window.innerWidth  && r.right  > 0);
        """, element)
    except Exception as e:
        import logging
        logging.getLogger("Snapshot").warning(
            f"[capture_snapshot] in_viewport JS failed: {e} — defaulting to None"
        )
        in_viewport = None

    # z-index — log warning nếu JS fail
    try:
        z_raw = driver.execute_script(
            "return window.getComputedStyle(arguments[0]).zIndex;", element
        )
        z_index = int(z_raw) if z_raw and z_raw != "auto" else 0
    except Exception as e:
        import logging
        logging.getLogger("Snapshot").warning(
            f"[capture_snapshot] z_index JS failed: {e} — defaulting to 0"
        )
        z_index = 0

    try:
        computed_font_size = driver.execute_script(
            "return window.getComputedStyle(arguments[0]).fontSize;", element)
        computed_color = driver.execute_script(
            "return window.getComputedStyle(arguments[0]).color;", element)
    except Exception:
        computed_font_size = computed_color = None

    css_style_hash = _compute_css_style_hash(driver, element)

    # Context 
    try:
        page_url = driver.current_url
        page_title = driver.title
    except Exception:
        page_url = page_title = None

    try:
        nearby_label = driver.execute_script("""
            var el = arguments[0];
            var id = el.id;
            if (id) {
                var lbl = document.querySelector('label[for="' + id + '"]');
                if (lbl) return lbl.textContent.trim();
            }
            var p = el.parentElement;
            while (p) {
                if (p.tagName === 'LABEL') return p.textContent.trim();
                p = p.parentElement;
                if (p && p.tagName === 'FORM') break;
            }
            return null;
        """, element)
    except Exception:
        nearby_label = None

    try:
        form_context = driver.execute_script("""
            var el = arguments[0];
            while (el.parentElement) {
                el = el.parentElement;
                if (el.tagName === 'FORM') {
                    return el.id || el.className || 'form';
                }
            }
            return null;
        """, element)
    except Exception:
        form_context = None

    # ARIA landmark — log warning nếu None để dễ debug
    try:
        nearest_landmark = driver.execute_script("""
            var el = arguments[0];
            var landmarkRoles = ['main', 'nav', 'navigation', 'aside',
                                 'complementary', 'header', 'banner',
                                 'footer', 'contentinfo', 'dialog',
                                 'alertdialog', 'region', 'search',
                                 'form', 'article', 'section'];
            var landmarkTags  = ['MAIN', 'NAV', 'ASIDE', 'HEADER', 'FOOTER', 'SECTION'];
            while (el && el !== document.body) {
                var r = el.getAttribute('role');
                if (r && landmarkRoles.includes(r)) return r;
                if (landmarkTags.includes(el.tagName)) return el.tagName.toLowerCase();
                el = el.parentElement;
            }
            return null;
        """, element)
        if nearest_landmark is None:
            import logging
            logging.getLogger("Snapshot").debug(
                "[capture_snapshot] nearest_landmark=None — context score sẽ dùng neutral 0.40"
            )
    except Exception as e:
        import logging
        logging.getLogger("Snapshot").warning(
            f"[capture_snapshot] nearest_landmark JS failed: {e}"
        )
        nearest_landmark = None

    # Modal / overlay detection — log warning nếu fail
    try:
        modal_or_overlay = driver.execute_script("""
            var el = arguments[0];
            while (el && el !== document.body) {
                var r = el.getAttribute('role');
                if (r === 'dialog' || r === 'alertdialog') return true;
                var cls = el.className || '';
                if (/modal|overlay|drawer|popup|lightbox/i.test(cls)) return true;
                var ariaModal = el.getAttribute('aria-modal');
                if (ariaModal === 'true') return true;
                el = el.parentElement;
            }
            return false;
        """, element)
    except Exception as e:
        import logging
        logging.getLogger("Snapshot").warning(
            f"[capture_snapshot] modal_or_overlay JS failed: {e}"
        )
        modal_or_overlay = None

    # Shadow DOM depth
    try:
        shadow_root_depth = driver.execute_script("""
            var el = arguments[0], depth = 0;
            var root = el.getRootNode();
            while (root && root instanceof ShadowRoot) {
                depth++;
                root = root.host ? root.host.getRootNode() : null;
            }
            return depth;
        """, element)
        shadow_root_depth = int(shadow_root_depth or 0)
    except Exception:
        shadow_root_depth = 0

    scroll_container_hash = _compute_scroll_container_hash(driver, element)

    # Tạo và trả về snapshot 
    return ElementSnapshot(
        # Attribute
        tag=tag, id=el_id, classes=classes, name=name,
        input_type=input_type, placeholder=placeholder,
        aria_label=aria_label, data_testid=data_testid,
        # Semantic
        text=text, role=role, href=href, value=value,
        # Structure
        xpath_abs=xpath_abs, xpath_rel=None,
        parent_tag=parent_tag, parent_id=parent_id,
        parent_classes=parent_classes,
        depth=depth, siblings_count=siblings_count,
        sibling_index=sibling_index,
        # Visual
        bounding_x=bx, bounding_y=by, bounding_w=bw, bounding_h=bh,
        viewport_w=viewport_w, viewport_h=viewport_h,
        is_visible=is_visible, is_enabled=is_enabled,
        in_viewport=in_viewport, z_index=z_index,
        css_style_hash=css_style_hash,
        computed_font_size=computed_font_size, computed_color=computed_color,
        # Context
        page_url=page_url, page_title=page_title,
        form_context=form_context, nearby_label=nearby_label,
        nearest_landmark=nearest_landmark,
        modal_or_overlay=modal_or_overlay,
        shadow_root_depth=shadow_root_depth,
        scroll_container_hash=scroll_container_hash,
        # Meta
        step_name=step_name, ui_version=ui_version,
        locator_type=loc_type, locator_value=loc_value,
    )


class SnapshotStore:
    """Quản lý việc lưu và đọc snapshot từ hệ thống file."""

    def __init__(self, store_dir: str = "snapshots"):
        self.store_dir = Path(store_dir)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        (self.store_dir / "history").mkdir(exist_ok=True)

    def save(self, snap: ElementSnapshot) -> Path:
        safe_name = snap.step_name.replace(" ", "_").lower()
        filename = f"{safe_name}_{snap.ui_version}_{snap.fingerprint_hash()}.json"
        filepath = self.store_dir / filename
        data = snap.to_dict()
        filepath.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

        date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        hist_path = self.store_dir / "history" / f"{safe_name}_{snap.ui_version}_{date_str}.json"
        hist_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

        return filepath

    def load(self, step_name: str, ui_version: str = "v1") -> Optional[ElementSnapshot]:
        safe_name = step_name.replace(" ", "_").lower()
        pattern = f"{safe_name}_{ui_version}_*.json"
        matches = list(self.store_dir.glob(pattern))
        if not matches:
            pattern_v1 = f"{safe_name}_v1_*.json"
            matches = list(self.store_dir.glob(pattern_v1))
            if not matches:
                return None

        latest = max(matches, key=lambda p: p.stat().st_mtime)
        try:
            data = json.loads(latest.read_text(encoding="utf-8"))
            return ElementSnapshot.from_dict(data)
        except Exception as e:
            print(f"[SnapshotStore] Lỗi đọc {latest}: {e}")
            return None

    def load_all_for_step(self, step_name: str) -> Dict[str, ElementSnapshot]:
        safe_name = step_name.replace(" ", "_").lower()
        result = {}
        for filepath in self.store_dir.glob(f"{safe_name}_*.json"):
            if "history" in str(filepath):
                continue
            try:
                data = json.loads(filepath.read_text(encoding="utf-8"))
                snap = ElementSnapshot.from_dict(data)
                result[snap.ui_version] = snap
            except Exception:
                continue
        return result

    def list_steps(self) -> list:
        steps = set()
        for f in self.store_dir.glob("*.json"):
            parts = f.stem.split("_")
            for i, p in enumerate(parts):
                if p.startswith("v") and p[1:].isdigit():
                    steps.add("_".join(parts[:i]))
                    break
        return sorted(steps)

    def delete(self, step_name: str, ui_version: str = None):
        safe_name = step_name.replace(" ", "_").lower()
        pattern = f"{safe_name}_{ui_version or '*'}_*.json"
        for f in self.store_dir.glob(pattern):
            f.unlink()