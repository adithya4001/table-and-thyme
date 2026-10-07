# REST API reference

Base URL: `http://127.0.0.1:8080/api`. JSON request/response. Browser frontend uses relative `/api` through the local frontend server's proxy. APIs are intended for localhost academic staff usage; no authentication is implemented.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Application health |
| GET | `/menu` | Menu including stock and availability |
| POST | `/menu` | Add dish |
| PUT | `/menu/{id}` | Edit dish / set absolute stock |
| GET | `/tables` | Table states |
| GET | `/orders` | All order history |
| GET | `/orders/active` | Orders excluding completed/cancelled |
| POST | `/orders` | Submit order and reserve stock |
| PATCH | `/orders/{id}/status` | PREPARING, SERVED or CANCELLED |
| GET | `/bills` | Receipts and payment status |
| POST | `/bills/generate/{orderId}` | Generate one final bill per served order |
| POST | `/bills/{billId}/pay` | Record externally received payment |
| GET | `/analytics/sales-summary` | Paid revenue, trend, popular items, low stock |
| POST | `/assistant` | Optional Gemini / local suggestions |

## Place order

```json
{
  "requestKey": "unique-demo-request-001",
  "orderType": "DINE_IN",
  "tableId": 1,
  "customer": "Demo guest",
  "notes": "Less spicy",
  "items": [{"menuItemId":1,"quantity":2},{"menuItemId":9,"quantity":1}]
}
```

Read item IDs from GET menu; defaults above refer to a fresh seed only. For takeaway, use `"orderType":"TAKEAWAY"` and omit tableId. Do not send prices/totals. Reuse the same requestKey when retrying the same order. Generate a new key for a genuinely new order.

## Kitchen status

```json
{"status":"PREPARING"}
```

Then `{"status":"SERVED"}`. An invalid state transition gives 409. Cancellation is allowed only from RECEIVED/PREPARING and restores reserved stock.

## Generate bill

```json
{"discountPercent":10}
```

Bill generation freezes the discount and returns an existing bill unchanged on repeat calls. The order must be SERVED. Values 0–100 allowed.

## Record payment

```json
{"method":"CASH"}
```

Methods CASH, UPI, CARD. Repeat payment calls return the existing paid receipt without counting revenue again.

## Assistant

```json
{"text":"two Hyderabadi Biryani and one Mango Lassi","itemIds":[]}
```

Use empty text and selected itemIds for pairings. Output: `{mode,message,items:[{menuItemId,quantity}]}`. Mode is GEMINI or LOCAL_RULES. This endpoint never writes orders.

## Validation and conflict cases

- 400: invalid quantity, empty cart, invalid payment method, discount outside 0–100, excessive input lengths.
- 404: unknown entity ID.
- 409: unavailable/insufficient stock, occupied table, invalid state transition, conflicting duplicate request.
- Frontend displays server errors and leaves the cart available for review/retry.
