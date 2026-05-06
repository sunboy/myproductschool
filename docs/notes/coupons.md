# Coupon Workflow

Stripe promotion codes are enabled in Checkout through `allow_promotion_codes: true` in `src/app/api/stripe/create-checkout/route.ts`.

Use `/admin/coupons` to create the discount objects:

1. Create a coupon with the discount amount, duration, and optional max redemptions.
2. Create one or more promotion codes attached to that coupon.
3. Share the promotion code with the intended audience.
4. Monitor redemptions in `/admin/coupons` or Stripe.

Operational notes:

- Prefer promotion codes over sharing raw coupon IDs. Codes are the customer-facing handles.
- Use finite max redemptions for launch, student, and partner offers.
- Use repeating coupons for time-boxed subscription discounts, such as 20% off for 3 months.
- Checkout accepts the code directly because promotion-code entry is already enabled.
