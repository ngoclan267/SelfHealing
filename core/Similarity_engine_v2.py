"""
SimilarityEngineV2 
"""
import re
import math
import logging
from difflib import SequenceMatcher
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from selenium.webdriver.common.by import By
logger = logging.getLogger("SimilarityEngineV2")

# DYNAMIC PATTERN DETECTION
DYNAMIC_PATTERNS = [
    re.compile(r'\d{4,}'),
    re.compile(r'[a-f0-9]{8,}', re.IGNORECASE),
    re.compile(r'sc-[a-zA-Z0-9]+'),
    re.compile(r'css-[a-zA-Z0-9]+'),
]

# STATIC WEIGHTS
STATIC_WEIGHTS: Dict[str, float] = {
    'attribute': 0.27,
    'semantic':  0.24,
    'structure': 0.2,
    'visual':    0.17,
    'context':   0.12,
}

# HEALING DECISION
class HealingDecision(Enum):
    AUTO_HEAL = "auto"      # score >= 0.7
    CONFIRM   = "suggest"   # 0.50 <= score < 0.7
    FAIL      = "fail"      # score < 0.50

def healing_decision(score: float) -> HealingDecision:
    if score >= 0.75:
        return HealingDecision.AUTO_HEAL
    elif score >= 0.50:
        return HealingDecision.CONFIRM
    return HealingDecision.FAIL

# HELPER FUNCTIONS
def _is_dynamic_value(value: Optional[str]) -> bool:
    if not value:
        return False
    return any(p.search(value) for p in DYNAMIC_PATTERNS)

def _str_sim(a: Optional[str], b: Optional[str]) -> float:
    if a is None and b is None:
        return 1.0
    if a is None or b is None:
        return 0.0
    a, b = a.lower().strip(), b.lower().strip()
    if a == b:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()

def _token_set_sim(a: Optional[str], b: Optional[str]) -> float:
    if a is None and b is None:
        return 1.0
    if a is None or b is None:
        return 0.0
    tokens_a = set(re.split(r'[\s\-_]+', a.lower().strip()))
    tokens_b = set(re.split(r'[\s\-_]+', b.lower().strip()))
    tokens_a.discard('')
    tokens_b.discard('')
    if not tokens_a and not tokens_b:
        return 1.0
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    jaccard = len(intersection) / len(union)
    sorted_a = ' '.join(sorted(tokens_a))
    sorted_b = ' '.join(sorted(tokens_b))
    exact_bonus = 0.1 if sorted_a == sorted_b else 0.0
    return min(1.0, jaccard + exact_bonus)

def _list_sim(a: list, b: list) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    set_a, set_b = set(a), set(b)
    return len(set_a & set_b) / len(set_a | set_b)

def _position_sim(i: int, j: int, scale: float = 0.25) -> float:
    return max(0.0, 1.0 - abs(i - j) * scale)

# CHIỀU 1: ATTRIBUTE
def compute_attribute_score(
    orig, cand, dynamic_flags: Dict[str, bool]
) -> Tuple[float, Dict[str, float]]:
    tag_factor = 1.0 if orig.tag == cand.tag else 0.5

    attr = {
        'tag':         1.0 if orig.tag == cand.tag else 0.0,
        'id':          _token_set_sim(orig.id, cand.id)
                       * (0.5 if dynamic_flags['id'] else 1.0),
        'classes':     _list_sim(orig.classes or [], cand.classes or []),
        'name':        _token_set_sim(orig.name, cand.name),
        'input_type':  1.0 if orig.input_type == cand.input_type else 0.0,
        'placeholder': _token_set_sim(orig.placeholder, cand.placeholder),
        'aria_label':  _token_set_sim(orig.aria_label, cand.aria_label),
        'data_testid': _str_sim(orig.data_testid, cand.data_testid)
                       * (0.3 if dynamic_flags['data_testid'] else 1.0),
    }

    raw = (
        attr['id']          * 0.29 +
        attr['classes']     * 0.22 +
        attr['name']        * 0.15 +
        attr['input_type']  * 0.10 +
        attr['placeholder'] * 0.09 +
        attr['aria_label']  * 0.08 +
        attr['data_testid'] * 0.07
    )
    score = raw * tag_factor
    return round(score, 4), {k: round(v, 3) for k, v in attr.items()}

# CHIỀU 2: SEMANTIC
def compute_semantic_score(orig, cand) -> Tuple[float, Dict[str, float]]:
    sem = {
        'text':         _str_sim(orig.text, cand.text),
        'role':         _str_sim(orig.role, cand.role),
        'href':         _str_sim(orig.href, cand.href),
        'nearby_label': _token_set_sim(orig.nearby_label, cand.nearby_label),
        'value':        _str_sim(orig.value, cand.value),
    }
    score = (
        sem['text']         * 0.38 +
        sem['role']         * 0.22 +
        sem['href']         * 0.22 +
        sem['nearby_label'] * 0.13 +
        sem['value']        * 0.05
    )
    return round(score, 4), {k: round(v, 3) for k, v in sem.items()}

# CHIỀU 3: STRUCTURE
def _css_selector_fingerprint(snap) -> str:
    parts = [snap.tag or '']
    if snap.classes:
        stable = [c for c in (snap.classes or []) if not _is_dynamic_value(c)][:2]
        if stable:
            parts.append('.' + '.'.join(stable))
    if snap.name:
        parts.append(f'[name={snap.name}]')
    if snap.input_type:
        parts.append(f'[type={snap.input_type}]')
    return ''.join(parts)

def compute_structure_score(orig, cand) -> Tuple[float, Dict[str, float]]:
    fp_orig = _css_selector_fingerprint(orig)
    fp_cand = _css_selector_fingerprint(cand)

    struct = {
        'xpath':           _str_sim(orig.xpath_abs, cand.xpath_abs),
        'css_fingerprint': _str_sim(fp_orig, fp_cand),
        'parent_tag':      1.0 if orig.parent_tag == cand.parent_tag else 0.2,
        'parent_id':       _str_sim(orig.parent_id, cand.parent_id),
        'parent_classes':  _list_sim(orig.parent_classes or [], cand.parent_classes or []),
        'depth':           _position_sim(orig.depth, cand.depth),
        'sibling_index':   _position_sim(orig.sibling_index, cand.sibling_index),
        'siblings_count':  _position_sim(orig.siblings_count, cand.siblings_count),
    }
    score = (
        struct['xpath']           * 0.20 +
        struct['css_fingerprint'] * 0.18 +
        struct['parent_tag']      * 0.20 +
        struct['parent_id']       * 0.16 +
        struct['parent_classes']  * 0.12 +
        struct['depth']           * 0.06 +
        struct['sibling_index']   * 0.05 +
        struct['siblings_count']  * 0.03
    )
    return round(score, 4), {k: round(v, 3) for k, v in struct.items()}

# CHIỀU 4: VISUAL — fix bbox fallback và css_hash neutral
def compute_visual_score(orig_snap, cand_snap) -> Tuple[float, Dict]:
    """
    So sánh hình thức hiển thị của phần tử trong trình duyệt.
    """
    scores = {}

    # Bbox relative theo viewport
    vw_orig = getattr(orig_snap, 'viewport_w', 0) or 1280.0
    vh_orig = getattr(orig_snap, 'viewport_h', 0) or 720.0
    vw_cand = getattr(cand_snap, 'viewport_w', 0) or 1280.0
    vh_cand = getattr(cand_snap, 'viewport_h', 0) or 720.0

    vw_orig = vw_orig if vw_orig >= 100 else 1280.0
    vh_orig = vh_orig if vh_orig >= 100 else 720.0
    vw_cand = vw_cand if vw_cand >= 100 else 1280.0
    vh_cand = vh_cand if vh_cand >= 100 else 720.0

    has_bbox = (orig_snap.bounding_w > 0 and cand_snap.bounding_w > 0)

    if has_bbox:
        rw_orig = orig_snap.bounding_w / vw_orig
        rh_orig = orig_snap.bounding_h / vh_orig
        rw_cand = cand_snap.bounding_w / vw_cand
        rh_cand = cand_snap.bounding_h / vh_cand

        rx_orig = orig_snap.bounding_x / vw_orig
        ry_orig = orig_snap.bounding_y / vh_orig
        rx_cand = cand_snap.bounding_x / vw_cand
        ry_cand = cand_snap.bounding_y / vh_cand

        size_sim = max(0.0, 1.0 - (abs(rw_orig - rw_cand) + abs(rh_orig - rh_cand)) / 2)
        pos_sim  = max(0.0, 1.0 - math.sqrt(
            (rx_orig - rx_cand)**2 + (ry_orig - ry_cand)**2
        ) * 3.0)

        scores['bbox_size'] = round(size_sim, 3)
        scores['bbox_pos']  = round(pos_sim,  3)
    else:
        # [FIX] Neutral thấp hơn — element không có size là signal bất thường
        scores['bbox_size'] = 0.20
        scores['bbox_pos']  = 0.20
        logger.debug(
            "[visual] bbox không hợp lệ (bounding_w=0) — dùng neutral 0.20"
        )

    # CSS style hash
    css_orig = getattr(orig_snap, 'css_style_hash', None)
    css_cand = getattr(cand_snap, 'css_style_hash', None)
    if css_orig and css_cand:
        if css_orig == css_cand:
            scores['css_hash'] = 1.0
        else:
            is_form_el = getattr(orig_snap, 'tag', '') in ('button', 'input', 'a')
            scores['css_hash'] = 0.50 if is_form_el else 0.25
    else:
        scores['css_hash'] = 0.30
        logger.debug(
            "[visual] css_style_hash thiếu ở orig hoặc cand — dùng neutral 0.30"
        )

    # Visibility / stacking context
    vis = 0.0
    is_vis_orig = getattr(orig_snap, 'is_visible', None)
    is_vis_cand = getattr(cand_snap, 'is_visible', None)
    in_vp_orig  = getattr(orig_snap, 'in_viewport', None)
    in_vp_cand  = getattr(cand_snap, 'in_viewport', None)
    z_orig      = getattr(orig_snap, 'z_index', 0) or 0
    z_cand      = getattr(cand_snap, 'z_index', 0) or 0

    if is_vis_orig is not None and is_vis_cand is not None:
        vis += 0.50 if is_vis_orig == is_vis_cand else 0.0
    else:
        vis += 0.25

    if in_vp_orig is not None and in_vp_cand is not None:
        vis += 0.30 if in_vp_orig == in_vp_cand else 0.0
    else:
        vis += 0.10
        logger.debug(
            "[visual] in_viewport=None ở orig hoặc cand — dùng neutral 0.10"
        )

    z_diff = abs(z_orig - z_cand)
    vis += 0.20 * max(0.0, 1.0 - z_diff / 100)
    scores['visibility'] = round(vis, 3)

    # Tổng điểm 
    weights = {'bbox_size': 0.35, 'bbox_pos': 0.25,
               'css_hash':  0.25, 'visibility': 0.15}
    total = sum(scores[k] * weights[k] for k in weights)
    return round(total, 4), scores

# CHIỀU 5: CONTEXT — fix neutral values
def _route_segment_sim(url1: Optional[str], url2: Optional[str]) -> float:
    if not url1 or not url2:
        return 0.50
    def stable_segments(u: str) -> List[str]:
        path = u.split('?')[0].strip('/')
        segs = path.split('/')
        return [s for s in segs if s and not s.isdigit() and not len(s) > 30
                and not re.match(r'^[a-f0-9\-]{8,}$', s, re.I)]
    s1 = stable_segments(url1)
    s2 = stable_segments(url2)
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.30
    matches = sum(a == b for a, b in zip(s1, s2))
    return round(matches / max(len(s1), len(s2)), 3)

def compute_context_score(orig, cand) -> Tuple[float, Dict[str, float]]:
    """
    So sánh ngữ cảnh bao quanh phần tử trên trang.
    """
    ctx = {}

    ctx['form_context'] = _token_set_sim(
        getattr(orig, 'form_context', None),
        getattr(cand, 'form_context', None)
    )
    ctx['route'] = _route_segment_sim(
        getattr(orig, 'page_url', None),
        getattr(cand, 'page_url', None)
    )

    # ARIA landmark
    lm_orig = getattr(orig, 'nearest_landmark', None)
    lm_cand = getattr(cand, 'nearest_landmark', None)
    if lm_orig and lm_cand:
        ctx['landmark'] = 1.0 if lm_orig == lm_cand else 0.10
    else:
        ctx['landmark'] = 0.40
        logger.debug(
            f"[context] nearest_landmark=None (orig={lm_orig}, cand={lm_cand}) "
            f"— dùng neutral 0.40"
        )

    # Modal / overlay detection
    mo_orig = getattr(orig, 'modal_or_overlay', None)
    mo_cand = getattr(cand, 'modal_or_overlay', None)
    if mo_orig is not None and mo_cand is not None:
        ctx['modal'] = 1.0 if mo_orig == mo_cand else 0.0
    else:
        ctx['modal'] = 0.50
        logger.debug(
            f"[context] modal_or_overlay=None (orig={mo_orig}, cand={mo_cand}) "
            f"— dùng neutral 0.50"
        )

    # Shadow DOM depth
    sd_orig = getattr(orig, 'shadow_root_depth', 0) or 0
    sd_cand = getattr(cand, 'shadow_root_depth', 0) or 0
    ctx['shadow'] = max(0.0, 1.0 - abs(sd_orig - sd_cand) * 0.4)

    # Scroll container
    sc_orig = getattr(orig, 'scroll_container_hash', None)
    sc_cand = getattr(cand, 'scroll_container_hash', None)
    if sc_orig and sc_cand:
        ctx['scroll'] = 1.0 if sc_orig == sc_cand else 0.40
    else:
        ctx['scroll'] = 0.40
        logger.debug(
            "[context] scroll_container_hash thiếu — dùng neutral 0.40"
        )

    score = (
        ctx['form_context'] * 0.28 +
        ctx['route']        * 0.22 +
        ctx['landmark']     * 0.20 +
        ctx['modal']        * 0.16 +
        ctx['shadow']       * 0.08 +
        ctx['scroll']       * 0.06
    )
    return round(score, 4), {k: round(v, 3) for k, v in ctx.items()}

# DATA CLASSES
@dataclass
class SimilarityDetail:
    attribute_score:  float = 0.0
    semantic_score:   float = 0.0
    structure_score:  float = 0.0
    visual_score:     float = 0.0
    context_score:    float = 0.0
    total_score:      float = 0.0
    decision:         str   = "fail"
    weights_used:     Dict[str, float] = field(default_factory=dict)
    attribute_detail: Dict[str, float] = field(default_factory=dict)
    semantic_detail:  Dict[str, float] = field(default_factory=dict)
    structure_detail: Dict[str, float] = field(default_factory=dict)
    visual_detail:    Dict[str, float] = field(default_factory=dict)
    context_detail:   Dict[str, float] = field(default_factory=dict)
    dynamic_flags:    Dict[str, bool]  = field(default_factory=dict)

@dataclass
class Candidate:
    element:    object
    snapshot:   object
    similarity: SimilarityDetail

    @property
    def score(self) -> float:
        return self.similarity.total_score

    @property
    def decision(self) -> HealingDecision:
        return healing_decision(self.score)

# ENGINE CHÍNH
class SimilarityEngineV2:

    def calculate(
        self,
        orig,
        cand,
        weights: Optional[Dict[str, float]] = None
    ) -> SimilarityDetail:
        w = weights or STATIC_WEIGHTS

        dynamic_flags = {
            'id':          _is_dynamic_value(getattr(orig, 'id', None)),
            'data_testid': _is_dynamic_value(getattr(orig, 'data_testid', None)),
            'classes':     any(_is_dynamic_value(c)
                               for c in (getattr(orig, 'classes', None) or [])),
        }

        attr_score,  attr_detail   = compute_attribute_score(orig, cand, dynamic_flags)
        sem_score,   sem_detail    = compute_semantic_score(orig, cand)
        struct_score, struct_detail = compute_structure_score(orig, cand)
        vis_score,   vis_detail    = compute_visual_score(orig, cand)
        ctx_score,   ctx_detail    = compute_context_score(orig, cand)

        total = round(
            attr_score   * w['attribute'] +
            sem_score    * w['semantic']  +
            struct_score * w['structure'] +
            vis_score    * w['visual']    +
            ctx_score    * w['context'],
            4
        )

        dec = healing_decision(total)

        return SimilarityDetail(
            attribute_score  = attr_score,
            semantic_score   = sem_score,
            structure_score  = struct_score,
            visual_score     = vis_score,
            context_score    = ctx_score,
            total_score      = total,
            decision         = dec.value,
            weights_used     = w,
            attribute_detail = attr_detail,
            semantic_detail  = sem_detail,
            structure_detail = struct_detail,
            visual_detail    = vis_detail,
            context_detail   = ctx_detail,
            dynamic_flags    = dynamic_flags,
        )

    def explain(
        self,
        orig,
        candidates: List[Candidate],
        chosen: Optional[Candidate],
        threshold: float = 0.50
    ):
        W = 68
        print(f"\n{'═'*W}")
        print("HEALING DIAGNOSIS — Chi tiết tại sao healing thành công/thất bại")
        print(f"{'═'*W}")
        print(f"Original : tag={orig.tag}  id={orig.id}  "
              f"testid={getattr(orig,'data_testid','-')}  "
              f"text={getattr(orig,'text','')!r:.30}")
        print(f"Candidates: {len(candidates)}  |  "
              f"Confidence band: AUTO≥0.75 / SUGGEST.50 / FAIL<0.50")
        print(f"{'─'*W}")

        if not candidates:
            print("  KHÔNG TÌM ĐƯỢC CANDIDATE NÀO trên DOM")
            print("  Gợi ý: Element bị xóa hoàn toàn hoặc tag thay đổi lớn")
            print(f"{'═'*W}")
            return

        print(f"TOP {min(3, len(candidates))} CANDIDATES:")
        for i, c in enumerate(candidates[:3]):
            sim = c.similarity
            w   = sim.weights_used
            dec = healing_decision(c.score)
            dec_str = {'auto': 'AUTO', 'suggest': 'Suggest', 'fail': 'FAIL'}[dec.value]
            print(f"\n  [{i+1}] {dec_str}  score={c.score:.1%}  "
                  f"tag={c.snapshot.tag}  "
                  f"text={getattr(c.snapshot,'text','')!r:.25}")
            print(f"       attr ={sim.attribute_score:.2f}×{w['attribute']:.2f}"
                  f"={sim.attribute_score*w['attribute']:.3f}  "
                  f"sem  ={sim.semantic_score:.2f}×{w['semantic']:.2f}"
                  f"={sim.semantic_score*w['semantic']:.3f}  "
                  f"struct={sim.structure_score:.2f}×{w['structure']:.2f}"
                  f"={sim.structure_score*w['structure']:.3f}")
            print(f"       vis  ={sim.visual_score:.2f}×{w['visual']:.2f}"
                  f"={sim.visual_score*w['visual']:.3f}  "
                  f"ctx  ={sim.context_score:.2f}×{w['context']:.2f}"
                  f"={sim.context_score*w['context']:.3f}")
            if sim.dynamic_flags.get('id') or sim.dynamic_flags.get('data_testid'):
                print("Dynamic attribute detected -> attribute score reduced")
            if sim.visual_detail.get('phash') is not None:
                print(f"pHash sim: {sim.visual_detail['phash']:.2f}")

        if chosen:
            dec = healing_decision(chosen.score)
            print(f"\n{'─'*W}")
            print(f"  RESULT: {dec.value.upper()}  score={chosen.score:.1%}")
        else:
            best = candidates[0]
            print(f"\n{'─'*W}")
            print(f"  RESULT: FAIL  best={best.score:.1%} < ngưỡng AUTO (0.75)")
            sim = best.similarity
            if sim.semantic_score > 0.6 and sim.attribute_score < 0.2:
                print("  Gợi ý: Semantic tốt nhưng attribute thấp")
                print("  -> Developer đổi strategy (vd: data-testid→aria-label)")
            elif sim.context_score < 0.3:
                print("  Gợi ý: Context rất thấp — element có thể đã chuyển trang/modal")
            elif sim.structure_score < 0.3:
                print("  Gợi ý: Structure thấp — layout thay đổi lớn")
            elif sim.visual_score < 0.3:
                print("  Gợi ý: Visual thấp — element bị ẩn hoặc di chuyển màn hình")
            elif best.score > 0.45:
                print(f"  Gợi ý: score gần ngưỡng CONFIRM ({best.score:.1%})")
                print("  -> Cân nhắc cho vào CONFIRM zone để log thay vì fail cứng")

        print(f"{'═'*W}\n")

# CANDIDATE FINDER
def find_candidates_v2(
    driver,
    original,
    engine: SimilarityEngineV2,
    min_score: float = 0.40,
    weights: Optional[Dict[str, float]] = None
) -> List[Candidate]:
    try:
        elements = driver.find_elements(By.TAG_NAME, original.tag)
        if original.tag == "button":
            elements += driver.find_elements(
                By.XPATH, "//input[@type='submit' or @type='button']"
            )
    except Exception:
        return []

    from .Snapshot import capture_snapshot
    candidates = []
    for elem in elements:
        try:
            if not elem.is_displayed():
                continue
            if elem.tag_name in {"body", "html", "script", "style", "head"}:
                continue
            cand_snap = capture_snapshot(driver, elem)
            sim = engine.calculate(original, cand_snap, weights=weights)
            if sim.total_score >= min_score:
                candidates.append(Candidate(
                    element=elem, snapshot=cand_snap, similarity=sim
                ))
        except Exception:
            continue

    candidates.sort(key=lambda c: c.score, reverse=True)
    return candidates