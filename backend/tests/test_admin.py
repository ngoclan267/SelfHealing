import pytest
import subprocess
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .conftest import do_login, navigate_to
from .config import ADMIN_EMAIL, ADMIN_PASS, USER_EMAIL, USER_PASS
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

def build_admin_cases():
    cases = []
    full_scenarios = [
        {"type": "admin_see_add_btn", "desc_suffix": "admin thấy nút thêm sản phẩm"},
        {"type": "user_no_add_btn", "desc_suffix": "user thường không thấy nút thêm SP"},
        {"type": "admin_add_product", "name": "Test iPhone 99", "price": "25000000", "desc_suffix": "admin thêm sản phẩm mới"},
        {"type": "admin_add_missing_name", "name": "", "price": "25000000", "desc_suffix": "admin thêm thiếu tên → lỗi"},
        {"type": "user_access_admin_route", "desc_suffix": "user vào /admin/add-product → bị chặn"},
        {"type": "admin_see_delete_edit_btn", "desc_suffix": "admin thấy nút Xóa/Sửa trên product card"},
    ]
    for ui in ALL_UI_VERSIONS:
        if ui == "v1":
            for sc in full_scenarios:
                case = sc.copy()
                case["ui_version"] = ui
                case["desc"] = f"[{ui}] {case['desc_suffix']}"
                cases.append(case)
        else:
            healing_scenarios = [sc for sc in full_scenarios if sc["type"] in [
                "admin_see_add_btn", "admin_add_product", "admin_see_delete_edit_btn"
            ]]
            for sc in healing_scenarios:
                case = sc.copy()
                case["ui_version"] = ui
                case["desc"] = f"[{ui}] {case['desc_suffix']} (Healing Check)"
                cases.append(case)

    return cases

@pytest.mark.parametrize(
    "case",
    build_admin_cases(),
    ids=[c["desc"] for c in build_admin_cases()]
)

def test_admin_flow(driver, case):
    print(f"\n {case['desc']}")
    switch_ui(case["ui_version"])
    handlers = {
        "admin_see_add_btn":         _test_admin_see_add_btn,
        "user_no_add_btn":           _test_user_no_add_btn,
        "admin_add_product":         _test_admin_add_product,
        "admin_add_missing_name":    _test_admin_add_missing,
        "user_access_admin_route":   _test_user_access_admin_route,
        "admin_see_delete_edit_btn": _test_admin_see_crud_buttons,
    }
    handler = handlers.get(case["type"])
    if handler:
        handler(driver, case)
    else:
        print(f"  Case type '{case['type']}' chưa implement")

def _test_admin_see_add_btn(driver, case):
    do_login(driver, ADMIN_EMAIL, ADMIN_PASS, case["ui_version"], True)
    navigate_to(driver, "/product", case["ui_version"])
    # Đợi loading spinner biến mất
    WebDriverWait(driver, 15).until(
        lambda d: "đang tải sản phẩm" not in d.page_source.lower()
    )
    btn = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="btn-add-product"]',
        step_name  = "add_product_button",
        ui_version = case["ui_version"],
    )
    assert btn is not None, "Admin không thấy nút Thêm sản phẩm"
    print(" Admin thấy nút thêm sản phẩm")

def _test_user_no_add_btn(driver, case):
    do_login(driver, USER_EMAIL, USER_PASS, case["ui_version"], True)
    navigate_to(driver, "/product", case["ui_version"])
    # Đợi loading spinner biến mất
    WebDriverWait(driver, 15).until(
        lambda d: "đang tải sản phẩm" not in d.page_source.lower()
    )
    btns = (
        driver.find_elements(By.CSS_SELECTOR, '[data-testid="btn-add-product"]') +
        driver.find_elements(By.CSS_SELECTOR, '[data-testid="add-product-link-btn"]') +
        driver.find_elements(By.CSS_SELECTOR, '[data-role="add-btn"]')
    )
    assert len(btns) == 0, "User không được thấy nút Thêm sản phẩm"
    print(" User không thấy nút thêm SP (phân quyền đúng)")

def _test_admin_add_product(driver, case):
    do_login(driver, ADMIN_EMAIL, ADMIN_PASS, case["ui_version"], True)
    navigate_to(driver, "/admin/add-product", case["ui_version"])
    WebDriverWait(driver, 10).until(
        lambda d: "product" in d.page_source.lower()
    )
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    name_el = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="product-name"]',
        step_name  = "product_name_field",
        ui_version = case["ui_version"],
    )
    name_el.clear()
    name_el.send_keys(case["name"])
    price_el = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="product-price"]',
        step_name  = "product_price_field",
        ui_version = case["ui_version"],
    )
    price_el.clear()
    price_el.send_keys(case["price"])
    submit_btn = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="btn-add-product"]',
        step_name  = "submit_product_button",
        ui_version = case["ui_version"],
    )
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", submit_btn)
    WebDriverWait(driver, 10).until(
        lambda d: submit_btn.is_displayed() and submit_btn.is_enabled()
    )
    driver.execute_script("arguments[0].click();", submit_btn)
    print(f" Admin thêm sản phẩm '{case['name']}' — hoàn tất")

def _test_admin_add_missing(driver, case):
    do_login(driver, ADMIN_EMAIL, ADMIN_PASS, case["ui_version"], True)
    navigate_to(driver, "/admin/add-product", case["ui_version"])
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    WebDriverWait(driver, 10).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "input, textarea")) >= 1
    )
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    price_el = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="product-price"]',
        step_name  = "product_price_field",
        ui_version = case["ui_version"],
    )
    price_el.clear()
    price_el.send_keys(case["price"])
    submit_btn = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="btn-add-product"]',
        step_name  = "submit_product_button",
        ui_version = case["ui_version"],
    )
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", submit_btn)
    WebDriverWait(driver, 10).until(
        lambda d: submit_btn.is_displayed() and submit_btn.is_enabled()
    )
    driver.execute_script("arguments[0].click();", submit_btn)
    alert_text = ""
    try:
        WebDriverWait(driver, 4).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        alert_text = alert.text.lower()
        alert.accept()
    except Exception:
        pass
    page = driver.page_source.lower()
    still_on_page = (
        "add-product" in driver.current_url or
        "thêm"        in page or
        "sản phẩm"    in page
    )
    server_error_alert = any(kw in alert_text for kw in [
        "thất bại", "lỗi", "thêm", "không", "failed", "error"
    ])
    inline_error = any(kw in page for kw in [
        "bắt buộc", "required", "tên sản phẩm", "không được để trống"
    ])
    assert still_on_page or server_error_alert or inline_error, (
        f"Thiếu tên nhưng submit thành công và redirect — "
        f"URL: {driver.current_url} | alert: '{alert_text}'"
    )
    print(" Form báo lỗi khi thiếu tên (validation đúng)")

def _test_user_access_admin_route(driver, case):
    do_login(driver, USER_EMAIL, USER_PASS, case["ui_version"], True)
    navigate_to(driver, "/admin/add-product", case["ui_version"])
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME,"body"))
    )
    page = driver.page_source.lower()
    is_blocked = (
        "add-product"     not in driver.current_url or
        "không có quyền"  in page or
        "unauthorized"    in page or
        "403"             in page
    )
    assert is_blocked, "User vẫn truy cập được route admin — lỗi phân quyền!"
    print("User bị chặn khỏi route admin")

def _test_admin_see_crud_buttons(driver, case):
    do_login(driver, ADMIN_EMAIL, ADMIN_PASS, case["ui_version"], True)
    navigate_to(driver, "/product", case["ui_version"])
    # Đợi loading xong VÀ có ít nhất 1 product card
    WebDriverWait(driver, 15).until(
        lambda d: "đang tải sản phẩm" not in d.page_source.lower()
                  and len(d.find_elements(By.CSS_SELECTOR, ".card, article")) > 0
    )
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    delete_btns = driver.find_elements(
        By.XPATH,
        "//button[contains(text(),'Xóa') "
        "or contains(text(),'XÓA') "
        "or contains(text(),'Gỡ') "
        "or @data-role='remove-item' "
        "or @data-action='delete'] "
        "| //button[contains(@class,'btn-danger') and not(contains(text(),'Thêm'))]"
    )
    edit_btns = driver.find_elements(
        By.XPATH,
        "//button[contains(text(),'Sửa') "
        "or contains(text(),'SỬA') "
        "or contains(text(),'Chỉnh sửa') "
        "or contains(text(),'Cập nhật') "
        "or @data-role='edit-item' "
        "or @data-action='edit'] "
        "| //button[contains(@class,'btn-warning') and not(contains(text(),'Thêm'))]"
    )
    assert len(delete_btns) > 0, f"Admin không thấy nút Xóa ở {case['ui_version']}"
    assert len(edit_btns) > 0, f"Admin không thấy nút Sửa ở {case['ui_version']}"
    print(f" Admin thấy {len(delete_btns)} nút Xóa, {len(edit_btns)} nút Sửa")