# HackProduct E2E Test Report

**Date**: 2026-03-28 21:53:30
**Test User**: `e2e-test-1774752682@hackproduct.dev`
**Base URL**: `http://localhost:3000`
**Screenshots**: `e2e-screenshots/`

## Summary

| Category | Pass | Fail | Total |
|----------|------|------|-------|
| Page Tests | 16 | 2 | 18 |
| API Tests | 0 | 10 | 10 |
| **Total** | **16** | **12** | **28** |

---

## Phase 1–6: Page Tests

### PASS: `/signup`

- **Screenshot**: `e2e-01-signup.png`
- **Expected**: Signup page loads with email and password fields
- **Actual**: Page loaded: HackProduct | Master Product Sense for Tech Careers, URL: http://localhost:3000/signup, has_email: True, has_password: True
- **Status Codes**: {'page': 200}

### FAIL: `/signup -> submit`

- **Screenshot**: `e2e-01b-after-signup.png`
- **Expected**: Redirect to /onboarding/welcome after signup
- **Actual**: Current URL: http://localhost:3000/signup, Page text: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily produc
- **Error**: `Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/onboarding/**" until 'load'
============================================================`

### PASS: `/onboarding/welcome`

- **Screenshot**: `e2e-02-welcome.png`
- **Expected**: Welcome page with 4 FLOW move cards and Take the Assessment button
- **Actual**: URL: http://localhost:3000/login, Cards found: 0, FLOW mentions: 0, has_assessment_btn: False, Body preview: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily produc

### PASS: `/onboarding/role`

- **Screenshot**: `e2e-03-role.png`
- **Expected**: Role selection page with SWE card, click SWE then Next
- **Actual**: URL: https://tikkhvxlclivixqqqjyb.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fonboarding&code_challenge=3lvSxO09ieeeiAua-qf9qBSs0Et45PStPOFyZNorFxM&code_challenge_method=s256, swe_clicked: False, next_clicked: True, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily produc

### PASS: `/onboarding/calibration`

- **Screenshot**: `e2e-04-calibration.png`
- **Expected**: Calibration page with textarea, type response and submit
- **Actual**: URL: http://localhost:3000/login, typed: False, submitted: True, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily produc

### PASS: `/onboarding/results`

- **Screenshot**: `e2e-05-results.png`
- **Expected**: Results page with radar chart and archetype, Start challenge button
- **Actual**: URL: http://localhost:3000/login, has_chart: False, has_archetype: False, start_btn: False, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily product thinking drills
Sign Up
Log In
Continue with Google
or
Email
Password
Forgot password?
Log In

### PASS: `/dashboard`

- **Screenshot**: `e2e-06-dashboard.png`
- **Expected**: Dashboard with move levels, Quick Take card, and Next Challenge
- **Actual**: URL: http://localhost:3000/dashboard, has_move_levels: True, has_quick_take: False, has_challenge: True, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
Discover your product thinking level

Take a 10-minute calibration challenge. Luma will assess your baseline across all 4 thinking moves

### PASS: `/explore`

- **Screenshot**: `e2e-07-explore.png`
- **Expected**: Explore page with paradigm cards
- **Actual**: URL: http://localhost:3000/explore, Cards: 0, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
Overhaul: Explore Hub

Browse by par

### PASS: `/challenges`

- **Screenshot**: `e2e-08-challenges.png`
- **Expected**: Challenge list with 50+ challenges, filter works
- **Actual**: URL: http://localhost:3000/challenges, Cards: 0, Challenge links: 52, filter_clicked: False, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
Practice Hub

Master product thinkin

### PASS: `/challenges/[id] workspace`

- **Screenshot**: `e2e-09-workspace.png`
- **Expected**: Workspace with scenario left pane, FLOW tabs right pane
- **Actual**: URL: http://localhost:3000/login, has_scenario: True, has_textarea: False, has_tabs: False, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily product thinking drills
Sign Up
Log In
Continue with Google
or
Email
Password
Forgot password?
Log In

### PASS: `/challenges/[id] -> grading`

- **Screenshot**: `e2e-10-grading.png`
- **Expected**: After submit: redirect to grading page
- **Actual**: URL: http://localhost:3000/login, typed: False, submitted: True, grading_url: None, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily product thinking drills
Sign Up
Log In
Continue with Google
or
Email
Password
Forgot password?
Log In

### PASS: `/grading/feedback`

- **Screenshot**: `e2e-11-feedback.png`
- **Expected**: Real grading scores from Luma AI, contextual feedback
- **Actual**: URL: http://localhost:3000/login, grading_complete: True, has_scores: True, is_mock: False, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily product thinking drills
Sign Up
Log In
Continue with Google
or
Email
Password
Forgot password?
Log In

### PASS: `/progress`

- **Screenshot**: `e2e-12-progress.png`
- **Expected**: Progress page with move levels
- **Actual**: URL: http://localhost:3000/progress, is_error: False, is_redirect_login: False, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
analytics
Progress & Analytics

Your

### PASS: `/cohort`

- **Screenshot**: `e2e-13-cohort.png`
- **Expected**: Cohort page with leaderboard
- **Actual**: URL: http://localhost:3000/cohort, is_error: False, is_redirect_login: False, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
military_tech
This Week's Challenge


### PASS: `/prep`

- **Screenshot**: `e2e-14-prep.png`
- **Expected**: Prep page with companies
- **Actual**: URL: http://localhost:3000/prep, is_error: False, is_redirect_login: False, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
workspace_premium
Prep Hub

Tell Lum

### FAIL: `/prep/study-plans`

- **Screenshot**: `e2e-15-study-plans.png`
- **Expected**: Study plans from DB
- **Actual**: URL: http://localhost:3000/login, is_error: False, is_redirect_login: True, Body: z
z
z
Tell me where you are. I'll tell you where to go.

— Luma, Product Sense Coach

check_circle
Scenario-based interview practice
check_circle
Real-time feedback from Luma
check_circle
Daily product thinking drills
Sign Up
Log In
Continue with Google
or
Email
Password
Forgot password?
Log In

### PASS: `/settings`

- **Screenshot**: `e2e-16-settings.png`
- **Expected**: Settings page with notification toggles
- **Actual**: URL: http://localhost:3000/settings, is_error: False, is_redirect_login: False, Body: z
z
z
HackProduct
home
Home
explore
Explore
fitness_center
Practice
workspace_premium
Prep
bar_chart
Progress
DAILY GOAL
3/5

3 of 5 challenges done

workspace_premium

Upgrade to Pro

Unlock all challenges

Ask Luma
SOON
search
local_fire_department
5
1,240 XP
S
arrow_back
Settings
more_vert
ACCOUN

### PASS: `/settings toggle`

- **Screenshot**: `e2e-16b-settings-toggle.png`
- **Expected**: Settings toggle works
- **Actual**: Toggle elements found: 0, toggled: False

---

## Phase 7: API Smoke Test

| Endpoint | HTTP Status | Pass/Fail | Response Preview |
|----------|-------------|-----------|-----------------|
| `/api/move-levels` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/challenges/quick-take` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/challenges/next` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/challenges/recommended` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/domains` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/study-plans` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/cohort/current` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/cohort/leaderboard` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/settings` | 401 | FAIL | `{"error":"Unauthorized"}` |
| `/api/career-benchmark` | 401 | FAIL | `{"error":"Unauthorized"}` |


---

## Console Errors During Testing

Total console errors/warnings captured: 18

- `[error]` Failed to load resource: the server responded with a status of 400 ()
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 404 (Not Found)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)
- `[error]` Failed to load resource: the server responded with a status of 401 (Unauthorized)

---

## Notes & Observations

### Failed Tests

- **/signup -> submit**: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/onboarding/**" until 'load'
============================================================
- **/prep/study-plans**: None

### Failed API Endpoints

- `/api/move-levels`: HTTP 401 — {"error":"Unauthorized"}
- `/api/challenges/quick-take`: HTTP 401 — {"error":"Unauthorized"}
- `/api/challenges/next`: HTTP 401 — {"error":"Unauthorized"}
- `/api/challenges/recommended`: HTTP 401 — {"error":"Unauthorized"}
- `/api/domains`: HTTP 401 — {"error":"Unauthorized"}
- `/api/study-plans`: HTTP 401 — {"error":"Unauthorized"}
- `/api/cohort/current`: HTTP 401 — {"error":"Unauthorized"}
- `/api/cohort/leaderboard`: HTTP 401 — {"error":"Unauthorized"}
- `/api/settings`: HTTP 401 — {"error":"Unauthorized"}
- `/api/career-benchmark`: HTTP 401 — {"error":"Unauthorized"}


*Report generated by automated E2E test suite on 2026-03-28*
