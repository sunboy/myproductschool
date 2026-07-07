# cart-pricing

Pricing engine for the checkout service. Computes line totals with tiered
volume discounts, applies coupons, and produces the cart summary.

Support has three open tickets this week: customers at exactly 10 units say
they were promised the bulk rate and did not get it, and two customers report
that removing a coupon did not change their total until they emptied the cart.

Run the tests:

    npm test
