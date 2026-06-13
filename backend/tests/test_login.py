import pytest
import subprocess
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .conftest import do_login
from .config import ADMIN_EMAIL, ADMIN_PASS, USER_EMAIL, USER_PASS, WRONG_PASS
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
# ALL_UI_VERSIONS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"]
def build_login_cases():
    base = [
        (ADMIN_EMAIL, ADMIN_PASS, True,  "admin đúng"),
        (USER_EMAIL,  USER_PASS,  True,  "user đúng"),
        (ADMIN_EMAIL, WRONG_PASS, False, "admin sai mật khẩu"),
        ("notexist@gmail.com", "123", False, "email không tồn tại"),
        ("",          "",         False, "cả hai trường rỗng"),
        ("invalid",   "123456",   False, "email không có @"),
    ]
    # edges = [
    #     (ADMIN_EMAIL,              "123456 ",  False, "pass có trailing space"),
    #     (ADMIN_EMAIL.upper(),      ADMIN_PASS, False, "email viết hoa"),
    #     (ADMIN_EMAIL,              "",         False, "pass rỗng"),
    #     ("a@b.c",                  "x",        False, "email cực ngắn"),
    #     ("'; DROP TABLE users;",   "x",        False, "SQL injection"),
    #     ("<script>alert(1)</script>", "x",     False, "XSS attempt"),
    #     (ADMIN_EMAIL,              "A" * 200,  False, "pass cực dài"),
    #     ("a" * 200 + "@b.com",     "x",        False, "email cực dài"),
    #     (ADMIN_EMAIL, ADMIN_PASS,  True,  "admin đúng — lần 1"),
    #     (ADMIN_EMAIL, ADMIN_PASS,  True,  "admin đúng — lần 2"),
    #     (ADMIN_EMAIL, ADMIN_PASS,  True,  "admin đúng — lần 3"),
    # ]#
    cases = []
    for email, pwd, expect, desc in base: #+ edges:
        cases.append({
            "email":         email,
            "password":      pwd,
            "expect_success": expect,
            "description":   desc,
        })
    # for ui in ALL_UI_VERSIONS:
    #     if ui == "v1":
    #         # Bản v1 chạy toàn bộ base cases và edge cases nghiệp vụ
    #         for email, pwd, expect, desc in base:
    #             cases.append({
    #                 "email": email, "password": pwd, "ui_version": ui, "expect_success": expect,
    #                 "description": f"[{ui}] {desc}",
    #             })
    #         for email, pwd, expect, desc in edges:
    #             cases.append({
    #                 "email": email, "password": pwd, "ui_version": "v1", "expect_success": expect,
    #                 "description": f"[edge] {desc}",
    #             })
    #     else:
    #         # Các bản UI khác (v2 -> v11): Chỉ chọn 2 case đặc trưng để xem locator tự phục hồi (Healing)
    #         # Chọn 1 case hợp lệ (True) và 1 case không hợp lệ (False)
    #         cases.append({
    #             "email": ADMIN_EMAIL, "password": ADMIN_PASS, "ui_version": ui, "expect_success": True,
    #             "description": f"[{ui}] admin đúng (Healing Check)",
    #         })
    #         cases.append({
    #             "email": ADMIN_EMAIL, "password": WRONG_PASS, "ui_version": ui, "expect_success": False,
    #             "description": f"[{ui}] admin sai mật khẩu (Healing Check)",
    #         })
    return cases

@pytest.mark.parametrize(
    "case",
    build_login_cases(),
    ids=[c["description"] for c in build_login_cases()]
)
def test_login(driver, case):
    print(f"\n {case['description']}")
    # switch_ui(case["ui_version"])
    do_login(
        driver,
        email          = case["email"],
        password       = case["password"],
        # ui_version     = case["ui_version"],
        expect_success = case["expect_success"],
    )
    print("PASSED")