import random
import string
import pytest
import subprocess
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .config import ADMIN_EMAIL
from .conftest import navigate_to

def switch_ui(version):
    subprocess.run(["bash", "../myapp/src_mutated/switch_ui.sh", version], shell=True)

def random_email():
    suffix = "".join(random.choices(string.ascii_lowercase, k=6))
    return f"test_{suffix}@gmail.com"

ALL_UI_VERSIONS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"]
def build_register_cases():
    cases = []
    
    for ui in ALL_UI_VERSIONS:
        if ui == "v1":
            # Bản v1: Chạy đầy đủ các kịch bản Đăng ký (Hợp lệ, Trùng Email, Thiếu trường, Sai định dạng...)
            cases += [
                {"email": random_email(), "password": "newpass123", "expect": True, "ui_version": ui, "desc": f"[{ui}] email mới hợp lệ"},
                {"email": ADMIN_EMAIL, "password": "anypass", "expect": False, "ui_version": ui, "desc": f"[{ui}] email đã tồn tại → lỗi"},
                {"email": random_email(), "password": "12", "expect": False, "ui_version": ui, "desc": f"[{ui}] mật khẩu quá ngắn"},
                {"email": "", "password": "abc123", "expect": False, "ui_version": ui, "desc": f"[{ui}] email rỗng"},
                {"email": random_email(), "password": "", "expect": False, "ui_version": ui, "desc": f"[{ui}] password rỗng"},
                {"email": "notanemail", "password": "abc123", "expect": False, "ui_version": ui, "desc": f"[{ui}] email không có @"},
            ]
        else:
            # Các bản v2 -> v11: Chỉ chọn ra 2 trường hợp cốt lõi kiểm tra hành vi tương tác Form và Healing locator
            cases += [
                # 1. Case Đăng ký thành công (Kiểm tra xem form có submit và chuyển tiếp qua login không)
                {"email": random_email(), "password": "newpass123", "expect": True, "ui_version": ui, "desc": f"[{ui}] email mới hợp lệ (Healing Check)"},
                # 2. Case Đăng ký thất bại (Kiểm tra xem locator có điền được form bị mutate và chặn lại không)
                {"email": ADMIN_EMAIL, "password": "anypass", "expect": False, "ui_version": ui, "desc": f"[{ui}] email đã tồn tại → lỗi (Healing Check)"}
            ]
            
    return cases

@pytest.mark.parametrize(
    "case",
    build_register_cases(),
    ids=[c["desc"] for c in build_register_cases()]
)
def test_register(driver, case):
    print(f"\n {case['desc']}")
    switch_ui(case["ui_version"])
    navigate_to(driver, "/register", case["ui_version"])
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "form"))
    )

    email_el = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="register-email"]',
        step_name  = "register_email_field",
        ui_version = case["ui_version"],
    )
    email_el.clear()
    email_el.send_keys(case["email"])

    pass_el = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="register-password"]',
        step_name  = "register_password_field",
        ui_version = case["ui_version"],
    )
    pass_el.clear()
    pass_el.send_keys(case["password"])

    btn = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="btn-register"]',
        step_name  = "register_button",
        ui_version = case["ui_version"],
    )
    btn.click()

    WebDriverWait(driver, 10).until(
        lambda d: "login"     in (d.current_url or "").lower()
               or "đăng nhập" in (d.page_source or "").lower()
               or "lỗi"       in (d.page_source or "").lower()
    )
    current_url = driver.current_url or ""
    page = (driver.page_source or "").lower()

    if case["expect"]:
        assert "/login" in current_url or "đăng nhập" in page, "Đăng ký thành công nhưng không redirect sang trang login"
        print(" PASSED — redirect sang login")
    else:
        assert ("/register" in current_url or "lỗi" in page or "tồn tại" in page or "thất bại" in page)
        print(" PASSED (expected failure)")