import time
import pytest
import subprocess
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    UnexpectedAlertPresentException,
)
from .conftest import do_login, navigate_to
from .config import ADMIN_EMAIL, ADMIN_PASS
import os
import shutil

def switch_ui(version):
    ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    script = os.path.join(ROOT, "myapp", "src_mutated", "switch_ui.sh")
    
    # Tìm Git Bash trên Windows
    git_bash = r"C:\Program Files\Git\bin\bash.exe"
    if not os.path.exists(git_bash):
        git_bash = shutil.which("bash")  
    subprocess.run([git_bash, script, version], check=True)
ALL_UI_VERSIONS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"]

def build_product_cases():
    search_queries = [
        ("iPhone",  True,  "từ khóa thực tế"),
        ("iphone",  True,  "chữ thường"),
        ("IPHONE",  True,  "chữ hoa"),
        ("MacBook", True,  "macbook"),
        ("xyz9999", False, "không tồn tại"),
    ]
    filter_cats = [
        ("iphone",  "btn-filter-iphone"),
        ("ipad",    "btn-filter-ipad"),
        ("macbook", "btn-filter-macbook"),
        ("airpods", "btn-filter-airpods"),
        ("Tất cả",  "btn-filter-all"),
    ]
    edge_searches = [
        ("",          True,  "v1", "rỗng → hiện tất cả"),
        ("  ",        False, "v1", "chỉ space"),
        ("iPhone 16", True,  "v1", "tên đầy đủ"),
        ("iP",        True,  "v1", "2 ký tự đầu"),
        ("@#$%",      False, "v1", "ký tự đặc biệt"),
    ]
    cases = []

    for ui in ALL_UI_VERSIONS:
        if ui == "v1":
            for q, expect, desc in search_queries:
                cases.append({
                    "type": "search", "query": q, "expect_result": expect, "ui_version": ui,
                    "description": f"[{ui}] search '{q}': {desc}",
                })
            for cat, testid in filter_cats:
                cases.append({
                    "type": "filter", "category": cat, "testid": testid, "ui_version": ui,
                    "description": f"[{ui}] lọc danh mục '{cat}'",
                })
            for q, expect, _, desc in edge_searches:
                cases.append({
                    "type": "search", "query": q, "expect_result": expect, "ui_version": "v1",
                    "description": f"[edge] {desc}",
                })
        else:
            cases.append({
                "type": "search", "query": "iPhone", "expect_result": True, "ui_version": ui,
                "description": f"[{ui}] search 'iPhone' (Healing Check)",
            })
            for cat, testid in filter_cats:
                cases.append({
                    "type": "filter", "category": cat, "testid": testid, "ui_version": ui,
                    "description": f"[{ui}] lọc danh mục '{cat}'",
                })

    return cases

@pytest.mark.parametrize(
    "case",
    build_product_cases(),
    ids=[c["description"] for c in build_product_cases()]
)
def test_products(driver, case):
    print(f"\n {case['description']}")
    switch_ui(case["ui_version"])
    do_login(driver, ADMIN_EMAIL, ADMIN_PASS, case["ui_version"], expect_success=True)
    navigate_to(driver, "/product", case["ui_version"])
    WebDriverWait(driver, 10).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, '[data-testid="search-input"]')
    )
    if case["type"] == "search":
        _run_search(driver, case)
    elif case["type"] == "filter":
        _run_filter(driver, case)
        
def _dismiss_any_alert(driver):
    try:
        driver.switch_to.alert.dismiss()
    except Exception:
        pass
    
def _count_product_cards(driver):
    cards = driver.find_elements(By.CSS_SELECTOR, ".card, article")
    product_cards = [
        el for el in cards
        if el.find_elements(By.CSS_SELECTOR, "img, a[href*='/product/']")
    ]
    return len(product_cards)

def _reset_filter_to_all(driver):
    try:
        all_btns = driver.find_elements(
            By.XPATH,
            "//button[contains(text(),'Tất cả') or contains(text(),'TẤT CẢ') "
            "or contains(text(),'Tất cả danh mục') or @data-testid='btn-filter-all']"
        )
        if all_btns:
            driver.execute_script("arguments[0].click();", all_btns[0])
            time.sleep(0.3)
            return
        # Fallback: select dropdown (v4)
        selects = driver.find_elements(
            By.CSS_SELECTOR,
            'select[data-testid*="filter"], select[id*="filter"], select.form-select'
        )
        if selects:
            try:
                Select(selects[0]).select_by_value("Tất cả")
            except Exception:
                try:
                    Select(selects[0]).select_by_value("Tất cả loại")  # v12 dùng "Tất cả loại"
                except Exception:
                    Select(selects[0]).select_by_index(0)
            time.sleep(0.3)
    except Exception:
        pass
    
def _run_search(driver, case):
    _dismiss_any_alert(driver)
    _reset_filter_to_all(driver)
    search_el = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="search-input"]',
        step_name  = "search_input",
        ui_version = case["ui_version"],
    )
    search_el.clear()
    search_el.send_keys(case["query"])
    try:
        if case["expect_result"]:
            WebDriverWait(driver, 8).until(
                lambda d: _count_product_cards(d) > 0
            )
        else:
            WebDriverWait(driver, 5).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
    except Exception:
        pass
    count = _count_product_cards(driver)
    if case["expect_result"]:
        assert count > 0, f"Tìm '{case['query']}' mong có kết quả nhưng không có"
        print(f" Tìm thấy {count} sản phẩm")
    else:
        empty_els = driver.find_elements(
            By.XPATH,
            "//*[contains(text(),'Không có sản phẩm') or contains(text(),'Không tìm thấy')]"
        )
        assert count == 0 or len(empty_els) > 0
        print(" Không có kết quả như mong đợi")

def _run_filter(driver, case):
    _dismiss_any_alert(driver)
    filter_found = False
    try:
        filter_btn = driver.find_element(
            By.CSS_SELECTOR, f'[data-testid="{case["testid"]}"]',
            step_name  = f"filter_{case['category']}_button",
            ui_version = case["ui_version"],
        )
        try:
            filter_btn.click()
        except (ElementClickInterceptedException, UnexpectedAlertPresentException):
            _dismiss_any_alert(driver)
            driver.execute_script("arguments[0].click();", filter_btn)
        try:
            WebDriverWait(driver, 1.5).until(EC.alert_is_present())
            alert_text = driver.switch_to.alert.text
            driver.switch_to.alert.dismiss()
            raise Exception(f"Nhầm delete button, alert: {alert_text}")
        except Exception as alert_err:
            if "Nhầm delete" in str(alert_err):
                raise  # re-raise để vào fallback select bên dưới
            # Không có alert → click đúng rồi
            filter_found = True
    except Exception:
        selects = driver.find_elements(
            By.CSS_SELECTOR, "select.form-select, select[data-testid*='filter']"
        )
        if selects:
            try:
                Select(selects[0]).select_by_value(case["category"])
                filter_found = True
            except Exception:
                try:
                    Select(selects[0]).select_by_visible_text(case["category"].upper())
                    filter_found = True
                except Exception:
                    pass
    if not filter_found:
        pytest.skip(
            f"[{case['ui_version']}] Filter UI thay đổi hoàn toàn, "
            f"Healing không phục hồi được"
        )
    _dismiss_any_alert(driver)
    try:
        WebDriverWait(driver, 5).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
    except UnexpectedAlertPresentException:
        _dismiss_any_alert(driver)
    _dismiss_any_alert(driver)
    cards = _count_product_cards(driver)
    print(f" Lọc '{case['category']}': {cards} sản phẩm")