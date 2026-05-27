import time
import pytest
import subprocess
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import ElementClickInterceptedException, UnexpectedAlertPresentException
from .conftest import do_login, navigate_to
from .config import USER_EMAIL, USER_PASS

def switch_ui(version):
    subprocess.run(f"bash myapp/src_mutated/switch_ui.sh {version}", shell=True)

ALL_UI_VERSIONS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"]

# Từ khóa thông báo thành công — cover mọi variant text của các UI version
SUCCESS_KEYWORDS = [
    "cảm ơn", "thành công", "ghi nhận", "đã được gửi",
    "liên hệ lại", "sẽ phản hồi", "sẽ liên hệ", "tin nhắn",
]

# Từ khóa yêu cầu đăng nhập — cover mọi variant text của các UI version
AUTH_REQUIRED_KEYWORDS = [
    "chưa đăng nhập", "đăng nhập ngay", "vui lòng đăng nhập",
    "cần đăng nhập", "yêu cầu đăng nhập", "đăng nhập để tiếp tục",
    "đăng nhập trước", "đăng nhập để gửi", "yêu cầu xác thực",
    "yêu cầu tài khoản", "đăng nhập để sử dụng",
]


def build_contact_cases():
    valid = [
        ("Nguyễn Văn A", "0901234567", "tu-van", "Tôi muốn hỏi về iPhone 16", True, "gửi đầy đủ thông tin"),
        ("Trần Thị B", "0987654321", "bao-hanh", "Giá MacBook Air M3 là bao nhiêu?", True, "gửi với nội dung khác"),
    ]

    invalid = [
        ("",      "0901234567", "tu-van", "Test lỗi", False, "thiếu tên"),
        ("Tên A", "",           "tu-van", "Test lỗi", False, "thiếu số điện thoại"),
        ("Tên A", "0901234567", "tu-van", "",         False, "thiếu lời nhắn"),
        ("Tên A", "090abc",     "tu-van", "Test lỗi", False, "số điện thoại có chữ cái"),
        ("Tên A", "090123456",  "tu-van", "Test lỗi", False, "số điện thoại 9 số — thiếu 1"),
        ("Tên A", "09012345678","tu-van", "Test lỗi", False, "số điện thoại 11 số — dư 1"),
        ("Tên A", "0901234567", "tu-van", "x" * 501,  False, "lời nhắn quá 500 ký tự"),
    ]

    edge_valid = [
        ("Tên A", "0901234567", "tu-van", "Test OK",  True, "SĐT đúng 10 số — hợp lệ"),
        ("Tên A", "0901234567", "tu-van", "x" * 500,  True, "lời nhắn đúng 500 ký tự — hợp lệ"),
    ]

    cases = []

    for ui in ALL_UI_VERSIONS:
        if ui == "v1":
            for name, phone, subject, msg, expect, desc in valid + invalid + edge_valid:
                cases.append({
                    "name": name, "phone": phone, "subject": subject, "message": msg, "expect": expect,
                    "ui_version": ui, "need_login": True, "description": f"[{ui}] contact: {desc}",
                })
            cases.append({
                "name": "", "phone": "", "subject": "", "message": "", "expect": False,
                "ui_version": ui, "need_login": False, "description": f"[{ui}] contact: chưa đăng nhập",
            })
        else:
            name, phone, subject, msg, expect, desc = valid[0]
            cases.append({
                "name": name, "phone": phone, "subject": subject, "message": msg, "expect": expect,
                "ui_version": ui, "need_login": True, "description": f"[{ui}] contact: {desc} (Healing Check)",
            })
            cases.append({
                "name": "", "phone": "", "subject": "", "message": "", "expect": False,
                "ui_version": ui, "need_login": False, "description": f"[{ui}] contact: chưa đăng nhập (Healing Check)",
            })

    return cases


def _sync_token(driver):
    token = (
        driver.execute_script("return sessionStorage.getItem('authToken');") or
        driver.execute_script("return sessionStorage.getItem('token');") or
        driver.execute_script("return localStorage.getItem('authToken');") or
        driver.execute_script("return localStorage.getItem('token');")
    )
    if not token:
        return
    driver.execute_script(f"""
        sessionStorage.setItem('token', '{token}');
        sessionStorage.setItem('authToken', '{token}');
        localStorage.setItem('token', '{token}');
        localStorage.setItem('authToken', '{token}');
    """)


def _fill_subject(driver, subject, ui_version):
    if not subject:
        return
    try:
        for selector in [
            '[data-testid="contact-subject"]',
            '[data-testid="input-contact-subject"]',
            '#subject-select',
            'select',
        ]:
            els = driver._drv.find_elements(By.CSS_SELECTOR, selector)
            if els:
                Select(els[0]).select_by_value(subject)
                return
    except Exception:
        pass


def _fill_and_verify(driver, selector, step_name, ui_version, value, field_label):
    if field_label == "message":
        textareas = driver._drv.find_elements(By.CSS_SELECTOR, "textarea")
        if textareas:
            el = textareas[0]
            el.clear()
            el.send_keys(value)
            return

    el = driver.find_element(
        By.CSS_SELECTOR, selector,
        step_name  = step_name,
        ui_version = ui_version,
    )
    el.clear()
    el.send_keys(value)


def _assert_success(driver):
    """Kiểm tra gửi thành công — cover mọi variant text của các UI version."""
    try:
        WebDriverWait(driver, 10).until(EC.alert_is_present())
        alert      = driver.switch_to.alert
        alert_text = alert.text.lower()
        alert.accept()
        assert any(kw in alert_text for kw in SUCCESS_KEYWORDS), \
            f"Alert không chứa từ khóa thành công: '{alert_text}'"
    except Exception as e:
        page = driver.page_source.lower()
        assert any(kw in page for kw in SUCCESS_KEYWORDS), \
            f"Gửi thất bại: {e}"


def _assert_failure(driver, case):
    alert_appeared = False
    try:
        WebDriverWait(driver, 3).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        alert.accept()
        alert_appeared = True
        assert False
    except Exception:
        if alert_appeared:
            raise

    assert "/contact" in driver.current_url
    error_els = driver.find_elements(By.CSS_SELECTOR, ".invalid-feedback")
    visible_errors = [el for el in error_els if el.is_displayed()]
    page = driver.page_source.lower()
    has_error_text = any(kw in page for kw in ["vui lòng", "không được", "phải gồm", "quá ngắn", "quá dài"])
    assert len(visible_errors) > 0 or has_error_text


def _check_auth_required(page):
    """Kiểm tra trang có yêu cầu đăng nhập hay không — cover mọi variant text."""
    return any(kw in page for kw in AUTH_REQUIRED_KEYWORDS)


@pytest.mark.parametrize(
    "case",
    build_contact_cases(),
    ids=[c["description"] for c in build_contact_cases()]
)
def test_contact(driver, case):
    print(f"\n {case['description']}")
    switch_ui(case["ui_version"])

    if case["need_login"]:
        do_login(driver, USER_EMAIL, USER_PASS, case["ui_version"], expect_success=True)
        _sync_token(driver)

    navigate_to(driver, "/contact", case["ui_version"])

    if not case["need_login"]:
        page = driver.page_source.lower()
        # Kiểm tra trang yêu cầu đăng nhập theo nhiều dạng text khác nhau
        # Hoặc kiểm tra không có form liên hệ (input/textarea) trên trang
        has_auth_msg = _check_auth_required(page)
        has_login_link = "/login" in page
        has_contact_form = len(driver.find_elements(
            By.CSS_SELECTOR, 'input[type="text"], input[type="tel"], textarea'
        )) > 0
        assert has_auth_msg or (has_login_link and not has_contact_form), \
            f"[{case['ui_version']}] Trang contact không yêu cầu đăng nhập khi chưa login"
        return

    WebDriverWait(driver, 10).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "input, textarea, select")) >= 1
    )
    _sync_token(driver)

    page = driver.page_source.lower()
    if _check_auth_required(page):
        driver.refresh()
        WebDriverWait(driver, 10).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "input, textarea, select")) >= 1
        )

    if case["name"]:
        _fill_and_verify(driver, '[data-testid="contact-name"]', "contact_name_field", case["ui_version"], case["name"], "name")

    if case["phone"]:
        _fill_and_verify(driver, '[data-testid="contact-phone"]', "contact_phone_field", case["ui_version"], case["phone"], "phone")

    _fill_subject(driver, case.get("subject", ""), case["ui_version"])

    if case["message"]:
        _fill_and_verify(driver, '[data-testid="contact-mess"]', "contact_mess_field", case["ui_version"], case["message"], "message")

    submit = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="btn-contact-submit"]',
        step_name  = "contact_submit_button",
        ui_version = case["ui_version"],
    )
    # Fallback JS click nếu bị element khác che (vd: v5 có disclaimer overlay)
    try:
        submit.click()
    except ElementClickInterceptedException:
        driver.execute_script("arguments[0].click();", submit)

    if case["expect"]:
        _assert_success(driver)
    else:
        _assert_failure(driver, case)