# Presentation and code walkthrough

## 45-second introduction (Tanglish)

“Maa project peru Table & Thyme — AI-Enhanced Restaurant Order & Billing System. Restaurant lo manual order-taking, incorrect totals, table confusion, sales tracking problems solve cheyadaaniki build chesaam. React frontend lo staff menu select chesthaaru. Spring Boot Java backend REST APIs validate chesi MySQL lo order save chesthayi. Kitchen stages taruvatha bill generate avuthundhi. Payment record ayyaka table release avuthundhi, sales dashboard update avuthundhi. Optional Gemini integration menu pairing and natural-language ordering ki help chesthundhi.”

## Requirements mapped to a live demonstration

| Requirement | Show in app | Show in source / MySQL |
|---|---|---|
| React frontend | Add/remove dishes without reload; category filters | `frontend/src/main.jsx`: hooks, components, controlled inputs |
| Java + Spring Boot | API responses and validation | `ApiController`, `RestaurantService`, `pom.xml` |
| REST APIs | Browser Network tab; GET menu and POST orders | `docs/API.md` |
| MySQL database | Persist order and restart backend | `database/demo-queries.sql` |
| Menu database | Menu studio edit, price/stock/availability | `menu_items` |
| Order summary | Kitchen ticket with quantities and notes | `orders` + `order_items` |
| Automatic bill | 10% discount; exact tax and total | `RestaurantService.generate()` + `bills` |
| Digital receipt | View receipt; browser Print/Save as PDF | receipt component + print CSS |
| Sales records | Paid revenue, best sellers, CSV | PAID rows only |
| AI extension | Pairings and typed quick order | `AssistantService`; say which mode is active |

## Exact sample calculations

Two biryanis at ₹280 and one mango lassi at ₹90:

```text
Subtotal = 2 × 280 + 1 × 90 = 650.00
Discount = 650 × 10 / 100 = 65.00
Taxable amount = 650 - 65 = 585.00
Demo tax = 585 × 0.05 = 29.25
Final total = 585 + 29.25 = 614.25
```

First seed: biryani stock 40, mango lassi stock 40. After this order: 38, 39. Payment does not deduct stock again. Cancel BEFORE serving in a separate example: stock restored once. Existing records may mean your IDs/stock differ; compare before/after, not hardcoded IDs.

## Code explanation order

1. `Application.java`: starts the application and scans the package.
2. `ApiController.java`: maps HTTP requests to Java methods. Explain GET vs POST vs PUT vs PATCH.
3. `Dtos.java`: validates quantity, text limits, order type, discount and payment method. Client validation alone is not enough.
4. `RestaurantService.place()`: checks a reusable request key, locks the table, merges duplicate items, validates stock, takes price snapshots, saves order atomically.
5. `Models.java`: `@Entity`, `@Id`, `@ManyToOne`, `@OneToMany`, `@OneToOne`; show actual foreign keys in MySQL.
6. `Repositories.java`: JpaRepository supplies CRUD; explicit queries acquire database row locks.
7. `generate()` and `pay()`: demonstrate that creating a bill is separate from receiving payment.
8. React `api.js`: fetch and error handling; `main.jsx`: state controls cart, page, and server data; `styles.css`: responsive and print layouts.
9. `AssistantService.java`: backend-only API key, timeout, catalog-limited validation, clear local fallback.
10. `OrderFlowTest.java`: demonstrate tests and explain H2 is ONLY for isolated tests; MySQL is the application database.

## Common viva questions

**Why Spring Boot?** Auto-configuration, embedded server, REST controllers, validation, transactions and JPA make Java backend development consistent.

**Why React?** Components and state allow cart quantities, totals, filters and screens to update without full-page reloads.

**What is an API?** A defined request/response contract. Example: POST `/api/orders` accepts item IDs and quantities, and returns a saved order ID and status.

**Why don't you trust prices from the browser?** A browser request can be edited. The backend reads authoritative menu prices and calculates the bill.

**Why save unitPrice in order_items?** A later menu price edit must not change an old order/receipt.

**What if two staff order the last portion?** A pessimistic row lock makes requests wait; the second checks the updated stock and fails if insufficient.

**What does @Transactional do?** All related database changes commit together, or roll back together on a failure.

**Why BigDecimal instead of double?** Decimal arithmetic avoids binary floating-point rounding errors in currency.

**How does the dashboard work?** The frontend polls every 8 seconds. Backend aggregates PAID bills, trends by paid date, and item quantities. It is polling, not WebSockets.

**Does clicking UPI send money?** No. It records an externally received payment. The academic app has no live payment gateway.

**Is the fallback AI?** No. Local rules use exact menu names and category pairings. Actual Gemini responses are clearly labelled Gemini AI.

**Can AI place an order automatically?** No. Suggestions are validated against the menu; staff review and explicitly submit the cart.

**Where is the API key?** Backend environment variable only; not stored in frontend source or MySQL.

**Can this be deployed to a real restaurant today?** It is a working academic localhost prototype. Real deployment needs authentication, staff permissions, audit trails, tax configuration, backups and payment integrations.

## Original scope and implementation choices

The supplied Gemini conversation selected restaurant ordering and billing, with React, Spring Boot/Java, MySQL and APIs mandatory. The abstract mentioned Gemini, inventory and recommendations. This implementation includes those integration points, plus kitchen tracking, CSV and separate payment states. Categories are stored as constrained strings in menu_items rather than a separate category table. No other unnamed “extra features” were assumed mandatory.
