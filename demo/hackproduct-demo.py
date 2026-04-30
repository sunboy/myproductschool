#!/usr/bin/env python3
"""
HackProduct Demo Script
=======================
Navigates through the app cinematically for recording with Recordly.

Usage:
  1. Set USE_MOCK_DATA=true in .env.local
  2. Run: npm run dev
  3. Open Recordly → start recording your screen
  4. Run: python demo/hackproduct-demo.py
  5. Stop Recordly → export video

The browser window runs headed at 1440×900 with slow_mo for a cinematic feel.
"""

from playwright.sync_api import sync_playwright
import sys

BASE_URL = "http://localhost:3000"

# ── Change these to your demo account credentials ──────────────────────────
DEMO_EMAIL    = "sandeeptnvs@gmail.com"
DEMO_PASSWORD = "Sandeep#89"
# ───────────────────────────────────────────────────────────────────────────

# Pause durations (ms) — tune these to match your preferred pacing
SHORT   = 1200
MEDIUM  = 2000
LONG    = 3500
BEAT    = 600   # micro-pause between micro-actions


def smooth_scroll(page, direction="down", distance=400):
    """Smooth scroll that looks human."""
    page.evaluate(f"""
        window.scrollBy({{
            top: {distance if direction == 'down' else -distance},
            behavior: 'smooth'
        }})
    """)
    page.wait_for_timeout(800)


def recon_screenshot(page, name):
    """Debug screenshot saved to /tmp for troubleshooting."""
    path = f"/tmp/demo-{name}.png"
    page.screenshot(path=path)
    print(f"  📸 {name} → {path}")


def run_demo(page):
    print("\n🎬 HackProduct Demo — Starting\n")

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 0 · Login
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 0: Login")
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(LONG)
    recon_screenshot(page, "00-login")

    # Make sure we're on the Login tab (not Signup)
    try:
        login_tab = page.locator('button:has-text("Log In"), button:has-text("Login")').first
        login_tab.wait_for(timeout=3000)
        login_tab.click()
        page.wait_for_timeout(BEAT)
    except Exception:
        pass  # already on login

    # Fill email
    email_input = page.locator('input[type="email"]').first
    email_input.wait_for(timeout=5000)
    email_input.click()
    page.wait_for_timeout(BEAT)
    email_input.type(DEMO_EMAIL, delay=60)
    page.wait_for_timeout(BEAT)

    # Fill password
    password_input = page.locator('input[type="password"]').first
    password_input.click()
    page.wait_for_timeout(BEAT)
    password_input.type(DEMO_PASSWORD, delay=60)
    page.wait_for_timeout(MEDIUM)

    recon_screenshot(page, "00b-login-filled")

    # Submit
    page.locator('button:has-text("Log In")').last.click()
    print("  ✓ Submitted login form")

    # Wait for redirect to dashboard
    page.wait_for_url(f"{BASE_URL}/dashboard", timeout=15000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(MEDIUM)
    print("  ✓ Logged in → dashboard")

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 1 · Dashboard
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 1: Dashboard")
    page.goto(f"{BASE_URL}/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(LONG)  # Let the hero load in

    recon_screenshot(page, "01-dashboard")

    # Slow scroll to show the bento grid below the fold
    smooth_scroll(page, "down", 300)
    page.wait_for_timeout(MEDIUM)
    smooth_scroll(page, "down", 300)
    page.wait_for_timeout(LONG)
    smooth_scroll(page, "up", 600)
    page.wait_for_timeout(MEDIUM)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 2 · Open Ask Luma drawer
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 2: Ask Luma")

    # Try the NavRail "Ask Luma" button first (desktop sidebar)
    try:
        luma_btn = page.locator('[aria-label="Ask Luma"]').first
        luma_btn.wait_for(timeout=3000)
        luma_btn.click()
        print("  ✓ Clicked 'Ask Luma' in NavRail")
    except Exception:
        # Fallback: floating FAB on mobile layout
        try:
            page.locator('button:has-text("Ask Luma")').first.click()
            print("  ✓ Clicked 'Ask Luma' FAB")
        except Exception as e:
            print(f"  ⚠️  Could not find Ask Luma button: {e}")
            recon_screenshot(page, "ask-luma-miss")

    page.wait_for_timeout(MEDIUM)
    recon_screenshot(page, "02-luma-drawer")

    # Wait for input to appear
    try:
        input_el = page.locator('input[placeholder*="Ask about FLOW"]').first
        input_el.wait_for(timeout=4000)
        page.wait_for_timeout(BEAT)

        # Type the question slowly so it reads naturally on screen
        question = "What is FLOW and why does it matter in product interviews?"
        input_el.click()
        page.wait_for_timeout(BEAT)
        input_el.type(question, delay=45)  # ~45ms between keystrokes
        page.wait_for_timeout(MEDIUM)

        recon_screenshot(page, "03-luma-typed")

        # Send the message
        send_btn = page.locator('button:has([class*="send"])').first
        try:
            send_btn.click()
        except Exception:
            # Fallback: press Enter
            input_el.press("Enter")
        print("  ✓ Sent FLOW question to Luma")

        # Wait for Luma to respond (up to 12s)
        page.wait_for_timeout(SHORT)
        try:
            page.wait_for_selector('.animate-bounce', timeout=2000)  # loading dots
            print("  … Luma is thinking")
            page.wait_for_selector('.animate-bounce', state='hidden', timeout=12000)
            print("  ✓ Luma responded")
        except Exception:
            pass  # response may have come back immediately

        page.wait_for_timeout(LONG)  # Let viewer read the response
        recon_screenshot(page, "04-luma-response")

        # Close the drawer
        close_btn = page.locator('[aria-label="Close"]').first
        close_btn.click()
        page.wait_for_timeout(MEDIUM)
        print("  ✓ Closed Luma drawer")

    except Exception as e:
        print(f"  ⚠️  Luma chat error: {e}")
        recon_screenshot(page, "luma-error")
        # Try to close drawer anyway
        try:
            page.keyboard.press("Escape")
        except Exception:
            pass
        page.wait_for_timeout(SHORT)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 3 · Explore Hub
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 3: Explore")
    page.goto(f"{BASE_URL}/explore")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(LONG)
    recon_screenshot(page, "05-explore")

    smooth_scroll(page, "down", 350)
    page.wait_for_timeout(MEDIUM)
    smooth_scroll(page, "down", 350)
    page.wait_for_timeout(LONG)
    smooth_scroll(page, "up", 700)
    page.wait_for_timeout(MEDIUM)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 4 · Practice / Challenges Hub
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 4: Practice Hub")
    page.goto(f"{BASE_URL}/challenges")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(LONG)
    recon_screenshot(page, "06-challenges")

    smooth_scroll(page, "down", 400)
    page.wait_for_timeout(MEDIUM)
    smooth_scroll(page, "down", 400)
    page.wait_for_timeout(LONG)
    smooth_scroll(page, "up", 800)
    page.wait_for_timeout(MEDIUM)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 5 · Live Interviews Hub
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 5: Live Interviews")
    page.goto(f"{BASE_URL}/live-interviews")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(LONG)
    recon_screenshot(page, "07-interviews")

    # Click through a few personas: Google → Meta → Uber
    for company in ["Google", "Meta", "Uber"]:
        try:
            btn = page.locator(f'button:has-text("{company}")').first
            btn.wait_for(timeout=3000)
            btn.click()
            page.wait_for_timeout(MEDIUM)
            print(f"  ✓ Selected {company}")
        except Exception:
            print(f"  ⚠️  Could not select {company}")

    recon_screenshot(page, "08-uber-selected")
    page.wait_for_timeout(LONG)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 6 · Start the Uber PM Interview
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 6: Starting Uber PM interview")
    try:
        start_btn = page.locator('button:has-text("Start Interview →")').first
        start_btn.wait_for(timeout=5000)
        start_btn.click()
        print("  ✓ Clicked 'Start Interview →'")

        # The API call creates a session — wait for navigation to /live-interviews/[id]
        page.wait_for_url(f"{BASE_URL}/live-interviews/**", timeout=15000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(LONG)
        recon_screenshot(page, "09-interview-ready")
        print(f"  ✓ Navigated to: {page.url}")

    except Exception as e:
        print(f"  ⚠️  Could not start interview: {e}")
        recon_screenshot(page, "start-interview-error")

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 7 · Inside the Interview Session
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 7: Interview session")
    try:
        # Click "Start Interview" on the ready screen
        begin_btn = page.locator('button:has-text("Start Interview")').first
        begin_btn.wait_for(timeout=5000)
        page.wait_for_timeout(MEDIUM)  # Dramatic pause before starting
        begin_btn.click()
        print("  ✓ Clicked 'Start Interview' (begin session)")
        page.wait_for_timeout(LONG)
        recon_screenshot(page, "10-interview-active")

    except Exception as e:
        print(f"  ⚠️  Begin session error: {e}")
        recon_screenshot(page, "begin-error")

    # Open the chat panel to show the conversation
    try:
        chat_btn = page.locator('[aria-label="Open chat"]').first
        chat_btn.wait_for(timeout=4000)
        chat_btn.click()
        print("  ✓ Opened chat panel")
        page.wait_for_timeout(LONG)
        recon_screenshot(page, "11-chat-open")

        # Scroll through transcript slowly
        smooth_scroll(page, "down", 300)
        page.wait_for_timeout(MEDIUM)
        smooth_scroll(page, "down", 300)
        page.wait_for_timeout(LONG)

    except Exception as e:
        print(f"  ⚠️  Chat panel: {e}")
        recon_screenshot(page, "chat-error")

    # Linger on the FLOW HUD coverage bars
    page.wait_for_timeout(LONG)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENE 8 · End Interview → Debrief
    # ─────────────────────────────────────────────────────────────────────────
    print("Scene 8: End & debrief")
    try:
        end_btn = page.locator('[aria-label="End interview"]').first
        end_btn.wait_for(timeout=4000)
        end_btn.click()
        page.wait_for_timeout(MEDIUM)

        # Confirm in modal
        debrief_btn = page.locator('button:has-text("End & debrief")').first
        debrief_btn.wait_for(timeout=3000)
        debrief_btn.click()
        print("  ✓ Confirmed 'End & debrief'")

        # Show the debrief loading screen
        page.wait_for_timeout(LONG)
        recon_screenshot(page, "12-debrief-loading")
        page.wait_for_timeout(LONG)  # Let Recordly capture the loading animation

    except Exception as e:
        print(f"  ⚠️  End interview error: {e}")
        recon_screenshot(page, "end-error")

    # ─────────────────────────────────────────────────────────────────────────
    # FIN
    # ─────────────────────────────────────────────────────────────────────────
    print("\n✅ Demo complete — screenshots saved to /tmp/demo-*.png")
    print("   Stop Recordly and export your video!\n")

    # Hold the final frame for 3s so Recordly captures the end state cleanly
    page.wait_for_timeout(3000)


def main():
    print("HackProduct × Recordly Demo Script")
    print("====================================")
    print(f"Target: {BASE_URL}")
    print("Browser: Chromium headed at 1440×900 with slow_mo=600\n")

    # Check server is reachable
    import urllib.request
    try:
        urllib.request.urlopen(BASE_URL, timeout=5)
    except Exception:
        print("❌ Dev server not responding at http://localhost:3000")
        print("   Run: npm run dev\n")
        sys.exit(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,        # Recordly needs a visible window
            slow_mo=600,           # Cinematic pacing on all actions
            args=[
                "--window-size=1440,900",
                "--window-position=0,0",
                "--disable-infobars",
                "--no-default-browser-check",
            ],
        )

        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="en-US",
            timezone_id="America/Los_Angeles",
        )

        page = ctx.new_page()

        # Intercept console errors so we know if something is broken
        page.on("console", lambda msg: print(f"  [browser] {msg.type}: {msg.text}") if msg.type == "error" else None)

        try:
            run_demo(page)
        except KeyboardInterrupt:
            print("\n⚠️  Demo interrupted by user")
        finally:
            page.wait_for_timeout(2000)
            browser.close()


if __name__ == "__main__":
    main()
