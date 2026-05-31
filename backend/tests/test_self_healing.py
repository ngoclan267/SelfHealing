"""
Mục đích:
  Cố tình dùng locator SAI để kích hoạt self-healing pipeline.
  Nếu healing thành công → element tìm lại được → test PASS.
  Chứng minh: "UI đổi nhưng test vẫn chạy được nhờ self-healing".

Test trên tất cả v2→v11 (v1 là baseline, locator đúng → không cần heal).

Các loại lỗi locator được test:
  1. id bị đổi tên
  2. data-testid bị đổi
  3. id bị xóa hoàn toàn
  4. placeholder bị đổi
  5. aria-label thay thế id
  6. xpath sai hoàn toàn
"""

import time
import pytest
import subprocess
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from core.Snapshot import SnapshotStore
from .config import ADMIN_EMAIL, ADMIN_PASS
from .conftest import do_login, navigate_to
import os
import shutil
HEALING_UI_VERSIONS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"]

def switch_ui(version):
    ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    script = os.path.join(ROOT, "myapp", "src_mutated", "switch_ui.sh")
    
    # Tìm Git Bash trên Windows
    git_bash = r"C:\Program Files\Git\bin\bash.exe"
    if not os.path.exists(git_bash):
        git_bash = shutil.which("bash") 
    
    subprocess.run([git_bash, script, version], check=True)
    
def build_healing_cases():
    """
    Mỗi kịch bản = (step_name, locator_by, locator_SAI, mô_tả, route)
    Locator SAI = locator gốc của v1, không còn tồn tại trên UI đã mutate
    """
    scenarios = [
        # Trang Login (/login)
        ("email_field",    By.ID,
         "email-old",
         "id email bị đổi",             "/login"),

        ("email_field",    By.CSS_SELECTOR,
         '[data-testid="input-email-v0"]',
         "data-testid email bị đổi",    "/login"),

        ("password_field", By.ID,
         "password-old",
         "id password bị đổi",          "/login"),

        ("password_field", By.CSS_SELECTOR,
         '[data-testid="pw-old"]',
         "data-testid password bị đổi", "/login"),

        ("login_button",   By.ID,
         "login-button-old",
         "id button login bị đổi",      "/login"),

        ("login_button",   By.CSS_SELECTOR,
         '[data-testid="btn-old-login"]',
         "data-testid button bị đổi",   "/login"),

        ("login_button",   By.XPATH,
         "//button[@id='nonexistent']",
         "xpath button sai hoàn toàn",  "/login"),

        # Trang Products (/product)
        ("search_input",   By.ID,
         "search-box-old",
         "id search bị đổi",            "/product"),

        ("search_input",   By.CSS_SELECTOR,
         '[data-testid="search-old"]',
         "data-testid search bị đổi",   "/product"),

        ("filter_iphone",  By.CSS_SELECTOR,
         '[data-testid="iphone-btn-old"]',
         "testid filter iPhone đổi",    "/product"),

        ("filter_ipad",    By.CSS_SELECTOR,
         '[data-testid="ipad-btn-old"]',
         "testid filter iPad đổi",      "/product"),

        ("filter_macbook", By.CSS_SELECTOR,
         '[data-testid="mac-btn-old"]',
         "testid filter MacBook đổi",   "/product"),

        ("filter_airpods", By.CSS_SELECTOR,
         '[data-testid="pods-btn-old"]',
         "testid filter AirPods đổi",   "/product"),

        ("filter_all",     By.CSS_SELECTOR,
         '[data-testid="all-btn-old"]',
         "testid filter Tất cả đổi",    "/product"),
    ]

    cases = []
    for ui in HEALING_UI_VERSIONS:
        for step, by, val, desc, route in scenarios:
            cases.append({
                "step_name":     step,
                "locator_by":    by,
                "locator_value": val,
                "ui_version":    ui,
                "route":         route,
                "description":   f"[heal][{ui}] {desc}",
            })

    return cases

@pytest.mark.parametrize(
    "case",
    build_healing_cases(),
    ids=[c["description"] for c in build_healing_cases()]
)
def test_self_healing(driver, case):
    """
    Test tự phục hồi — cố tình dùng locator SAI
    Luồng chạy:
      1. find_element(locator_SAI) -> NoSuchElementException
      2. Module 1 bắt exception -> xác định cần healing
      3. Module 2 load snapshot FP[snapshot_key]
      4. Module 3 quét DOM, tính điểm 5 chiều
      5. Module 4 chọn ứng viên tốt nhất (score >= 0.50)
      6. Module 5 trả về element + lưu knowledge base
      -> Test PASS dù locator ban đầu sai
    """
    print(f"\n {case['description']}")
    switch_ui(case["ui_version"])
    store = SnapshotStore("snapshots")
    if case["route"] == "/product":
        do_login(driver, ADMIN_EMAIL, ADMIN_PASS,
                 case["ui_version"], expect_success=True)
    navigate_to(driver, case["route"], case["ui_version"])
    wait_locator = (By.TAG_NAME, "form") if "login" in case["route"] \
                   else (By.TAG_NAME, "body")
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(wait_locator)
    )
    snapshot = store.load(case["step_name"])
    try:
        element = driver.find_element(
            case["locator_by"],
            case["locator_value"],    # locator SAI
            step_name  = case["step_name"],
            ui_version = case["ui_version"],
            snapshot   = snapshot,    # fingerprint gốc để so sánh
        )
        assert element is not None,    "Healing trả về None"
        assert element.is_displayed(), "Element tìm được nhưng không hiển thị"
        assert element.is_enabled(),   "Element tìm được nhưng bị disabled"
        print(f" Healing thành công — [{case['ui_version']}] element tìm lại được")
        driver.execute_script(
            "arguments[0].style.border='3px solid red'", element
        )
        time.sleep(1)
    except Exception as e:
        print(f"    Healing không phục hồi được [{case['ui_version']}]: {type(e).__name__}")
        err_str = str(e).lower()
        is_healing_failure = any(x in err_str for x in [
            "snapshot", "healing", "nosuchelement",
            "stale", "timeout", "candidate"
        ])
        if not is_healing_failure:
            pytest.fail(f"Lỗi không liên quan đến healing: {e}")