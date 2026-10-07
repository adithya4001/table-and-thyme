# Verification report

Verified on 6 October 2026 on Windows using installed Java 24.0.2 and MySQL 8.0.46.

## Passed

- Maven `package`: BUILD SUCCESS.
- Three Spring MVC / JPA integration tests: 3 run, 0 failures, 0 errors, 0 skipped.
- React production bundle: generated successfully with esbuild; JavaScript and CSS source maps included.
- Live Spring Boot + real MySQL database, using a separate project test instance on port 3307.
- Menu seeded with 14 items and 8 tables.
- Dine-in order: two Hyderabadi Biryanis and one Mango Lassi; subtotal 650.00, discount 65.00, tax 29.25, total 614.25.
- Exact order retry returned the same order ID.
- Kitchen transitions, bill generation, recorded payment, inventory deduction and table release.
- Repeated payment did not change the original payment method or create an additional bill.
- Paid-sales aggregation and local natural-language parser.
- Chrome browser interaction: add dishes, takeaway, send to kitchen, prepare, serve, generate bill, record cash payment and view insights.
- Browser runtime: no uncaught page errors.
- Responsive layout: mobile navigation clickable at 390×844; no horizontal page overflow.
- Desktop, receipt, insights and mobile screenshots captured and visually reviewed.

## Evidence

- `mysql-verification.json`: API results from the real MySQL test.
- `mysql-output.txt`: actual SQL query output from test records (captured before the additional browser order in that run).
- `app-desktop.png`, `app-receipt.png`, `app-insights.png`, `app-mobile.png`: actual application screenshots, not mockups. Test orders explain the revenue visible in screenshots; a fresh installation starts with zero sales.

## Not verified / scope limits

- Live Gemini calls were not tested because no user API key was provided. The backend integration is implemented; the verified fallback is explicitly labelled LOCAL_RULES.
- No production deployment, load test, authentication or live bank/payment-gateway integration.
- Browser print styles and receipt appearance were inspected; physical printer output was not tested.
- Standard startup instructions use MySQL port 3306. Verification used an isolated 3307 instance so existing user databases were not modified.

Test services were stopped after verification. Use the launchers and README to start your own demo.
