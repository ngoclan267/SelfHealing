import sys
import os
import time
import pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from core.Healing_driver_v2 import SelfHealingDriverV2
from tests.config import BASE_URL, ADMIN_EMAIL, ADMIN_PASS, USER_EMAIL, USER_PASS
IS_CI = os.environ.get("CI", "false").lower() == "true"
@pytest.fixture(scope="function")
def driver():
    opts = Options()
    if IS_CI:
        # GitHub Actions: bắt buộc headless
        opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1920,1080")
        opts.add_argument("--remote-debugging-port=9222")
        opts.add_argument("--disable-web-security")
        opts.add_argument("--allow-running-insecure-content")
        opts.add_argument("--disable-features=VizDisplayCompositor")
    else:
        if os.getenv("HEADLESS") == "true":
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--window-size=1366,768")
    svc = Service(ChromeDriverManager().install())
    raw = webdriver.Chrome(service=svc, options=opts)
    # yield raw
    # raw.quit()
    healing = SelfHealingDriverV2(
        raw,
        test_name    = "apple_shop_suite_v2",
        snapshot_dir = "snapshots",
        db_path      = "healing.db",
        kb_dir       = "knowledge_base",
    )
    yield healing
    try:
        healing.quit()
    except Exception:
        pass
    
def navigate_to(driver, path: str):
    driver.get(f"{BASE_URL}{path}")
    time.sleep(0.5)

def do_login(driver, email: str, password: str,
            expect_success: bool = True):
    navigate_to(driver, "/login")

    email_el = driver.find_element(
        By.CSS_SELECTOR,
        '[data-testid="login-email"]',
        step_name  = "email_field",
        ui_version = "baseline"
    )
    email_el.clear()
    email_el.send_keys(email)
    pass_el = driver.find_element(
        By.CSS_SELECTOR,
        '[data-testid="login-password"]',
        step_name  = "password_field",
        ui_version = "baseline"
    )
    pass_el.clear()
    pass_el.send_keys(password)
    btn = driver.find_element(
        By.CSS_SELECTOR,
        '[data-testid="btn-login"]',
        step_name  = "login_button",
        ui_version = "baseline"
    )
    driver.execute_script(
    "arguments[0].scrollIntoView({block:'center'});",
        btn
    )
    time.sleep(0.5)
    driver.execute_script("arguments[0].click();", btn)
    # Dismiss alert "Đăng nhập thành công!" nếu có (Login_v1 dùng alert)
    try:
        WebDriverWait(driver, 3).until(EC.alert_is_present())
        driver.switch_to.alert.accept()
    except Exception:
        pass
    time.sleep(1.5)
    page = driver.page_source.lower()
    if expect_success:
        assert (
            "khám phá" in page or
            "sản phẩm" in page or
            "product"  in page
        ), "Đăng nhập thất bại dù expect_success=True"
    else:
        assert (
            "đăng nhập" in page and
            ("thất bại" in page or
             "sai" in page or
             driver.current_url.endswith("/login"))
        ), "Đăng nhập thành công dù expect_success=False"

def do_logout(driver):
    driver.execute_script("sessionStorage.clear();")
    driver.get(f"{BASE_URL}/login")
    WebDriverWait(driver, 10).until(
        lambda d: "login" in d.page_source.lower()
                  or "Đăng nhập" in d.page_source.lower()
    )