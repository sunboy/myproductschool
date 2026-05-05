# Onboarding Enforcement Manual Test

Run these checks after applying the `onboarding_state` and calibration migrations.

## Fresh User

1. Sign up or log in as a user with `profiles.onboarding_completed_at` set to `null`.
2. Visit `/dashboard`.
3. Confirm the proxy redirects to `/onboarding/welcome`.
4. Visit `/challenges`.
5. Confirm the proxy redirects to `/onboarding/welcome`.
6. Visit `/onboarding/role`, select a role, then refresh.
7. Confirm the role is restored.
8. Advance to `/calibration`, answer two questions, then refresh.
9. Confirm the same calibration screen, selected role, and prior answers are restored.
10. Finish calibration.
11. Confirm `profiles.onboarding_completed_at` is populated and `onboarding_state` has no row for the user.
12. Visit `/dashboard`.
13. Confirm the dashboard loads without redirect.

## Completed User

1. Log in as a user with a non-null `profiles.onboarding_completed_at`.
2. Visit `/dashboard`, `/challenges`, `/progress`, and `/settings`.
3. Confirm each route loads without onboarding redirects.
4. Visit `/login`.
5. Confirm the proxy redirects to `/dashboard`.

## Unauthenticated Visitor

1. Open a private browser session.
2. Visit `/`, `/pricing`, `/login`, and `/onboarding/welcome`.
3. Confirm marketing, auth, and onboarding entry pages render.
4. Visit `/dashboard`.
5. Confirm the proxy redirects to `/login`.
