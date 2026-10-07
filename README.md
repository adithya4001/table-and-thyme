# Table & Thyme

**AI-Enhanced Restaurant Order & Billing System**  
Technical Training · Semester 5 · React + Spring Boot (Java) + MySQL + REST APIs

A restaurant workspace with menu search, cart, dine-in/takeaway orders, table occupancy, kitchen tickets, inventory, separate billing, recorded payments, printable receipts, paid-sales analytics, CSV export and an optional Gemini assistant.

## Start here (Tanglish)

Idi complete source project. `frontend` React application; `backend` Java Spring Boot application; `database` SQL scripts. Browser lo React open avuthundhi, React API requests Spring Boot ki velthayi, Spring Boot MySQL lo data save chesthundhi. UI lo fake saved orders/localStorage database levu.

**Fast demo:** ZIP extract chesi MySQL lo `database/setup.sql` run cheyyandi. Taruvatha **`START-DEMO.cmd`** double-click cheyyandi. Included backend JAR + built React frontend run avuthayi; Java, Node, running MySQL chaalu. `Started Application` vachaka **http://127.0.0.1:5173** open cheyyandi. Ee fast path ki Maven/npm install avasaram ledu. Source edit chesina taruvatha rebuild cheyyali; development steps kindha unnayi.

### 1. Prerequisites

- Java **17 or newer** (17/21 recommended; this project also built using installed Java 24).
- Maven 3.6.3+ (`mvn -version`).
- Node.js 20.19+ / 22.12+ or 24, npm (`node -v`, `npm -v`).
- MySQL Server 8.0+ running, normally on port 3306; MySQL Workbench optional.
- Internet for the first dependency install; Gemini requires internet and your own API key.

### 2. MySQL setup

MySQL Workbench lo mee administrator connection open chesi `database/setup.sql` execute cheyyandi. Idi `table_thyme` database, local project user create chesthundhi. Existing project user unte script password reset cheyyadhu; aa user's password `DB_PASSWORD` lo set cheyyandi.

Default academic credentials: `tablethyme` / `tablethyme_local`. Spring Boot first start lo tables create chesi 14 dishes, 8 tables seed chesthundhi. Sales fake ga prefill cheyyadhu.

### 3. Start backend (terminal 1)

Project folder lo PowerShell open cheyyandi:

```powershell
cd backend
$env:DB_USER="tablethyme"
$env:DB_PASSWORD="tablethyme_local"
$env:DB_URL="jdbc:mysql://localhost:3306/table_thyme?serverTimezone=Asia/Kolkata"
mvn spring-boot:run
```

`Started Application` vacchaka backend ready. [Health endpoint](http://127.0.0.1:8080/api/health) open cheyyandi. Port 8080 busy aithe aa application stop cheyyandi or backend port and frontend proxy renditini consistent ga change cheyyandi.

### 4. Start frontend (terminal 2)

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open **[Table & Thyme](http://127.0.0.1:5173)**. Rendu terminals running lo undaali. Subsequent runs lo `npm ci` repeat avasaram ledu. Windows lo root folder `start-backend.cmd` and `start-frontend.cmd` double-click chesi kuda run cheyyochu, prerequisites and database ready undaali.

### 5. Enable real Gemini AI (optional)

Backend terminal lo start cheyyakamundhu:

```powershell
$env:GEMINI_API_KEY="YOUR_OWN_KEY"
$env:GEMINI_MODEL="gemini-2.5-flash"
mvn spring-boot:run
```

Key chat lo paste cheyyakandi; frontend code lo pettakandi. Your Google account lo available model veraithe `GEMINI_MODEL` change cheyyandi. Response label **Gemini AI** unte live Gemini result. Key absent or provider unavailable aithe **Local rules** ani explicit ga chupisthundhi. Local parser exact dish names recognize chesthundhi; adi machine-learning model kaadhu. AI output review chesi Add click chesina taruvatha kuda Send to kitchen click chesthene order save avuthundhi.

Example: `two Hyderabadi Biryani and one Mango Lassi`.

## Demo in 5 minutes

1. Order desk: table 1 select chesi **2 Hyderabadi Biryani + 1 Mango Lassi** add cheyyandi. Subtotal ₹650; estimated 5% tax ₹32.50; total ₹682.50.
2. Optional: assistant lo same sentence parse cheyyandi; suggestions inspect cheyyandi. Existing cart ki malli add chesthe quantities increase avuthayi.
3. **Send to kitchen** → MySQL `orders`, `order_items` create; stock 2 and 1 portions decrease; table occupied.
4. Kitchen → **Start preparing** → **Mark as served**. Status sequence RECEIVED → PREPARING → SERVED.
5. **Generate bill**, enter **10%** discount → subtotal ₹650, discount ₹65, tax ₹29.25, final ₹614.25. Bill PENDING; table BILLING.
6. **CASH / UPI / CARD** click → record externally received payment. Bill PAID, order COMPLETED, table AVAILABLE. No live payment gateway integration.
7. **Print / Save as PDF** → browser print dialog lo Save as PDF select cheyyandi.
8. Insights → revenue and popular items; Billing → Export paid sales.
9. MySQL Workbench lo `database/demo-queries.sql` execute chesi actual rows chupinchandi.

More detailed presentation and viva explanations: `docs/DEMO-AND-VIVA.md`.

## Folder guide

```text
table-and-thyme/
  frontend/
    src/main.jsx        React screens, state and actions
    src/styles.css      Responsive restaurant design + receipt print styles
    src/api.js          REST client + INR formatting
    scripts/serve.cjs    Static frontend server + proxy to Spring Boot
    package-lock.json   Reproducible npm dependency versions
  backend/
    pom.xml             Maven and Spring Boot dependencies
    src/main/java/com/tablethyme/
      Application.java       Application entry point
      Models.java            JPA entities and relationships
      Repositories.java      Database access and row locks
      Dtos.java              Validated request contracts
      RestaurantService.java Order, stock, billing, payment and analytics rules
      ApiController.java     REST endpoints
      ApiErrors.java         User-readable validation/business errors
      AssistantService.java  Gemini + honest local fallback
      SeedData.java          Initial menu and tables
    src/main/resources/application.properties
    src/test/java/com/tablethyme/OrderFlowTest.java
  database/setup.sql
  database/demo-queries.sql
  docs/                  Abstract, workflow, API reference and viva guide
```

## Build and test

```powershell
cd backend
mvn test
mvn package
java -jar target/table-and-thyme-1.0.0.jar
```

Tests use an isolated H2 in-memory database so they cannot alter your MySQL records. The actual application uses MySQL; H2 is test-scope only. MySQL runtime validation is documented separately in `docs/VERIFICATION.md`.

```powershell
cd frontend
npm.cmd run build
npm.cmd run preview
```

Preview runs on port 4173 and proxies API requests to 8080; backend must stay running. `dist` is the production frontend output. A standalone static server needs `/api` reverse-proxy configuration.

## Important design details

- **Money:** Java BigDecimal / MySQL DECIMAL; tax rounded half-up to 2 decimals on the discounted subtotal.
- **Transactions:** stock deductions, table assignment and order save happen together. Invalid orders roll back all changes.
- **Concurrency:** inventory/table/order/bill rows use pessimistic locks. Inventory locks follow sorted item IDs.
- **Historical accuracy:** each order item saves its name and price at order time.
- **Idempotency:** order request keys, one bill per order, and already-paid checks prevent sequential retry duplication. Concurrent duplicate-key conflicts return 409; refresh before retrying.
- **Sales:** only PAID bills count as revenue. Eight-second polling refreshes screens.
- **Local scope:** a single-restaurant academic staff workspace, bound to localhost. Authentication/roles, payment processing, printer hardware, multi-branch deployment and production security are not implemented.
- **Tax:** configurable development work would be needed for real tax rules; this submission uses an explicitly labelled 5% demo tax, not a legally compliant tax invoice.
- **Availability:** hide a dish instead of deleting historical references. Cancelling received/preparing orders restores reserved portions. Served/billed orders cannot be cancelled in this version.
- **Stock unit:** ready-to-serve portions, not ingredient-level inventory. Menu editing replaces the current stock value; coordinate restocking with staff.
- **Fonts:** optional Google Fonts with local sans-serif fallback. All dish artwork uses built-in emoji/CSS, so the menu does not depend on remote images.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `java` hangs or wrong Java version | Set `JAVA_HOME` to a real JDK folder and put its `bin` first in PATH. On this PC: `C:\Program Files\Java\jdk-24`. |
| Database connection refused | Start MySQL Server; verify port and DB_URL. |
| Access denied for database user | Check DB_USER / DB_PASSWORD; execute setup as a MySQL administrator. |
| Public key retrieval not allowed | For a local trusted MySQL instance only, append `&allowPublicKeyRetrieval=true` to DB_URL if your authentication configuration requires it. |
| 5173 in use | Stop the earlier frontend process; the local frontend server uses a strict port. |
| Browser says Backend offline | Start backend, check its terminal; refresh. Do not assume a failed request saved an order. |
| Maven cannot download | Check internet access/proxy, retry `mvn -U package`. |
| `npm.ps1` blocked | Use `npm.cmd` as shown above. |
| Table is occupied | Finish/settle its active order or cancel it before serving. |
| Gemini shows Local rules | Check backend key, model availability, quota and network. Local mode remains usable. |

## Reference documentation

- [Spring Boot](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
- [Gemini generateContent API](https://ai.google.dev/api/generate-content)
- [React](https://react.dev/learn)
- [MySQL](https://dev.mysql.com/doc/refman/8.0/en/)
#   t a b l e - a n d - t h y m e  
 