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
        # Dùng Xvfb thay vì headless — KHÔNG thêm --headless nữa
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1920,1080")          # giống local
        opts.add_argument("--force-device-scale-factor=1")    # fix DPI
        opts.add_argument("--disable-extensions")
        opts.add_argument("--hide-scrollbars")
        opts.add_argument("--font-render-hinting=none")       # font nhất quán
        # KHÔNG có --headless=new
    else:
        if os.getenv("HEADLESS") == "true":
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--window-size=1920,1080")          # đổi local cũng thành 1920x1080
    svc = Service(ChromeDriverManager().install())
    raw = webdriver.Chrome(service=svc, options=opts)

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
def navigate_to(driver, path: str, ui_version: str = ''):
    driver.get(f"{BASE_URL}{path}")
    time.sleep(0.5)


def do_login(driver, email: str, password: str,
             ui_version: str = "v1", expect_success: bool = True):
    """
    Helper đăng nhập — giống hệt v1.
    SelfHealingDriverV2.find_element() có cùng signature → không cần sửa.
    """
    navigate_to(driver, "/login", ui_version)

    # WebDriverWait(driver, 10).until(
    #     EC.presence_of_element_located((
    #         By.CSS_SELECTOR,
    #         '[data-testid="login-email"]'
    #     ))
    # )   

    email_el = driver.find_element(
        By.CSS_SELECTOR,
        '[data-testid="login-email"]',
        step_name  = "email_field",
        ui_version = ui_version
    )
    email_el.clear()
    email_el.send_keys(email)

    pass_el = driver.find_element(
        By.CSS_SELECTOR,
        '[data-testid="login-password"]',
        step_name  = "password_field",
        ui_version = ui_version
    )
    pass_el.clear()
    pass_el.send_keys(password)

    btn = driver.find_element(
        By.CSS_SELECTOR,
        '[data-testid="btn-login"]',
        step_name  = "login_button",
        ui_version = ui_version
    )

    driver.execute_script(
    "arguments[0].scrollIntoView({block:'center'});",
        btn
    )

    time.sleep(0.5)
    driver.execute_script("arguments[0].click();", btn)
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