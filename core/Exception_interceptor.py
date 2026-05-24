import logging
import time
from enum import Enum, auto
from dataclasses import dataclass
from typing import Optional, Callable, Any

from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
    ElementNotInteractableException,
    ElementClickInterceptedException,
    WebDriverException,
)
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

logger = logging.getLogger("ExceptionInterceptor")
class ExceptionType(Enum):
    """Phân loại các exception Selenium có thể xảy ra."""
    LOCATOR_NOT_FOUND   = auto()   # Locator sai → cần healing
    STALE_ELEMENT       = auto()   # DOM đã re-render → thử find lại
    TIMEOUT             = auto()   # Trang chậm → chờ thêm
    NOT_INTERACTABLE    = auto()   # Element ẩn/disabled → cần scroll
    CLICK_INTERCEPTED   = auto()   # Bị element khác che → JS click
    UNKNOWN             = auto()   # Lỗi không rõ → log và raise


class HealingStrategy(Enum):
    """Chiến lược xử lý sau khi bắt được exception."""
    TRIGGER_HEALING     = auto()   # Kích hoạt self-healing pipeline
    RETRY_FIND          = auto()   # Thử find lại không dùng healing
    WAIT_AND_RETRY      = auto()   # Chờ rồi thử lại
    SCROLL_INTO_VIEW    = auto()   # Cuộn đến element rồi thử lại
    JS_CLICK            = auto()   # Dùng JavaScript để click thay Selenium
    RAISE               = auto()   # Không thể phục hồi → raise exception


@dataclass
class InterceptionResult:
    """Kết quả sau khi Exception Interceptor xử lý."""
    exception_type:  ExceptionType
    strategy:        HealingStrategy
    original_error:  Exception
    retry_count:     int    = 0
    should_heal:     bool   = False   # True = kích hoạt Module 3,4,5
    message:         str    = ""

class ExceptionInterceptor:
    """
    Lớp bắt và phân loại exception từ Selenium.
    LUỒNG XỬ LÝ:
    1. Gọi intercept(exception, context) → nhận InterceptionResult
    2. Dựa vào result.strategy để quyết định:
       - TRIGGER_HEALING  -> gọi Module 3,4,5 để self-heal
       - RETRY_FIND       -> thử find lại (không cần healing)
       - WAIT_AND_RETRY   -> sleep rồi thử lại
       - SCROLL_INTO_VIEW -> JS scroll rồi thử lại
       - JS_CLICK         -> dùng JS thay Selenium click
       - RAISE            -> không cứu được → báo lỗi
    """

    # Cấu hình retry mặc định
    MAX_STALE_RETRY   = 3    # StaleElement: thử lại tối đa 3 lần
    MAX_TIMEOUT_WAIT  = 10   # Timeout: chờ thêm tối đa 10 giây
    RETRY_DELAY       = 0.5  # Delay giữa các lần retry (giây)

    def intercept(self, exception: Exception, step_name: str = "") -> InterceptionResult:
        """Phân tích exception và quyết định chiến lược xử lý"""
        exc_type = type(exception)
        logger.warning(f"[{step_name}] Exception bắt được: {exc_type.__name__}: {exception}")

        # Case 1: NoSuchElement -> Locator sai/đổi -> CẦN HEALING
        if exc_type == NoSuchElementException:
            return InterceptionResult(
                exception_type = ExceptionType.LOCATOR_NOT_FOUND,
                strategy       = HealingStrategy.TRIGGER_HEALING,
                original_error = exception,
                should_heal    = True,  
                message        = (
                    f"Locator không tìm thấy phần tử. "
                    f"Đây là dấu hiệu UI đã thay đổi. "
                    f"Kích hoạt self-healing pipeline."
                )
            )

        # Case 2: StaleElement → DOM đã re-render
        elif exc_type == StaleElementReferenceException:
            return InterceptionResult(
                exception_type = ExceptionType.STALE_ELEMENT,
                strategy       = HealingStrategy.RETRY_FIND,
                original_error = exception,
                should_heal    = False, 
                message        = (
                    f"Element bị stale (DOM re-render). "
                    f"Thử find lại với locator cũ trước."
                )
            )

        # Case 3: Timeout → Trang load chậm
        elif exc_type == TimeoutException:
            return InterceptionResult(
                exception_type = ExceptionType.TIMEOUT,
                strategy       = HealingStrategy.WAIT_AND_RETRY,
                original_error = exception,
                should_heal    = False,
                message        = (
                    f"Timeout chờ element. Có thể trang load chậm. "
                    f"Thử chờ thêm {self.MAX_TIMEOUT_WAIT}s."
                )
            )

        # Case 4: Not Interactable → Element ẩn hoặc disabled
        elif exc_type == ElementNotInteractableException:
            return InterceptionResult(
                exception_type = ExceptionType.NOT_INTERACTABLE,
                strategy       = HealingStrategy.SCROLL_INTO_VIEW,
                original_error = exception,
                should_heal    = False,
                message        = (
                    f"Element tồn tại nhưng không tương tác được. "
                    f"Thử scroll vào viewport."
                )
            )

        # Case 5: Click bị chặn → Overlay/modal che mất
        elif exc_type == ElementClickInterceptedException:
            return InterceptionResult(
                exception_type = ExceptionType.CLICK_INTERCEPTED,
                strategy       = HealingStrategy.JS_CLICK,
                original_error = exception,
                should_heal    = False,
                message        = (
                    f"Click bị chặn bởi element khác (overlay/modal). "
                    f"Dùng JavaScript click."
                )
            )

        # Default: Lỗi không xác định → Raise
        else:
            return InterceptionResult(
                exception_type = ExceptionType.UNKNOWN,
                strategy       = HealingStrategy.RAISE,
                original_error = exception,
                should_heal    = False,
                message        = f"Lỗi không xác định: {exc_type.__name__}"
            )

class RecoveryActions:
    """Thực hiện các action phục hồi dựa trên kết quả từ ExceptionInterceptor."""
    def __init__(self, driver):
        self._driver = driver

    def retry_find(self, by, value, max_retry: int = 3) -> Optional[Any]:
        """
        Thử find lại element tối đa max_retry lần.
        Dùng cho StaleElementReferenceException.
        """
        for attempt in range(max_retry):
            try:
                time.sleep(ExceptionInterceptor.RETRY_DELAY)
                element = self._driver.find_element(by, value)
                logger.info(f"[retry_find] Thành công lần {attempt + 1}")
                return element
            except Exception:
                logger.debug(f"[retry_find] Thất bại lần {attempt + 1}/{max_retry}")
        return None

    def wait_and_find(self, by, value, timeout: int = 10) -> Optional[Any]:
        """
        Chờ element xuất hiện trong DOM trong khoảng timeout giây.
        Dùng cho TimeoutException.
        """
        try:
            wait    = WebDriverWait(self._driver, timeout)
            element = wait.until(EC.presence_of_element_located((by, value)))
            logger.info(f"[wait_and_find] Tìm thấy sau khi chờ")
            return element
        except TimeoutException:
            logger.warning(f"[wait_and_find] Vẫn không tìm thấy sau {timeout}s")
            return None

    def scroll_into_view(self, element) -> bool:
        """
        Cuộn trang để đưa element vào viewport.
        Dùng cho ElementNotInteractableException.
        """
        try:
            self._driver.execute_script(
                "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                element
            )
            time.sleep(0.5)  # Chờ animation scroll hoàn tất
            return True
        except Exception as e:
            logger.error(f"[scroll_into_view] Lỗi: {e}")
            return False

    def js_click(self, element) -> bool:
        """
        Click element bằng JavaScript thay vì Selenium click.
        Dùng cho ElementClickInterceptedException.
        """
        try:
            self._driver.execute_script("arguments[0].click();", element)
            logger.info("[js_click] JS click thành công")
            return True
        except Exception as e:
            logger.error(f"[js_click] Lỗi: {e}")
            return False