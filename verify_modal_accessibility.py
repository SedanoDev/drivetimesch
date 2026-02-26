from playwright.sync_api import Page, expect, sync_playwright

def verify_modal_accessibility(page: Page):
    # 1. Navigate to Test Page
    print("Navigating to Test Modal page...")
    page.goto("http://localhost:5173/test-modal")

    # 2. Open Modal
    print("Opening Modal...")
    open_btn = page.locator("text=Open Modal")
    open_btn.wait_for()
    open_btn.click()

    # Wait for modal to appear
    modal = page.locator('div[role="dialog"]')
    modal.wait_for()
    expect(modal).to_be_visible()

    # 3. Verify ARIA attributes
    print("Verifying ARIA attributes...")
    aria_modal = modal.get_attribute("aria-modal")
    aria_label_by = modal.get_attribute("aria-labelledby")

    assert aria_modal == "true", f"Expected aria-modal='true', got {aria_modal}"
    assert aria_label_by == "modal-title", f"Expected aria-labelledby='modal-title', got {aria_label_by}"

    # Check title ID
    title = page.locator("#modal-title")
    expect(title).to_be_visible()
    expect(title).to_have_text("Test Modal Title")

    # Check close button ARIA label
    close_btn = modal.locator('button[aria-label="Cerrar"]')
    expect(close_btn).to_be_visible()

    print("Attributes verified.")

    # 4. Verify Focus Management
    print("Verifying focus management...")
    is_focused = page.evaluate("document.activeElement.getAttribute('role') === 'dialog'")

    if is_focused:
        print("Focus is correctly on the modal container.")
    else:
        active_tag = page.evaluate("document.activeElement.tagName")
        active_role = page.evaluate("document.activeElement.getAttribute('role')")
        print(f"Warning: Focus is on <{active_tag} role='{active_role}'> instead of modal container.")

    # 5. Verify Escape Key closes modal
    print("Pressing Escape...")
    page.keyboard.press("Escape")

    # Wait for modal to disappear
    expect(modal).not_to_be_visible()
    print("Modal closed successfully via Escape key.")

    # Re-open for screenshot
    print("Re-opening modal for screenshot...")
    open_btn.click()
    modal.wait_for()

    page.screenshot(path="/home/jules/verification/modal_accessibility.png")
    print("Screenshot saved to /home/jules/verification/modal_accessibility.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            verify_modal_accessibility(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
