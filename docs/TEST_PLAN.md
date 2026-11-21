# Inventory Management System — Test Plan

**Status:** Checklist prepared. Mark Pass/Fail only after executing each case in your own environment.

| ID | Test scenario | Expected result | Result |
|---|---|---|---|
| TC-01 | Visit dashboard before login | Login page displayed | Not run |
| TC-02 | Correct admin password | Dashboard loads | Not run |
| TC-03 | Wrong password | Login is rejected | Not run |
| TC-04 | Create product with valid SKU | Product appears in list | Not run |
| TC-05 | Create another product with same SKU | Duplicate rejected | Not run |
| TC-06 | Enter negative product price | Form/server rejects entry | Not run |
| TC-07 | Edit product name and threshold | Changes visible in product list | Not run |
| TC-08 | Search product name | Matching products displayed | Not run |
| TC-09 | Filter by category | Only chosen category appears | Not run |
| TC-10 | Add 5 stock units to product | Quantity increases by five | Not run |
| TC-11 | Withdraw 2 units | Quantity decreases by two | Not run |
| TC-12 | Withdraw more units than available | Rejected; quantity unchanged | Not run |
| TC-13 | Use zero or fractional stock change | Rejected | Not run |
| TC-14 | Decrease quantity below reorder threshold | Low-stock status displayed | Not run |
| TC-15 | Reach zero stock | Out-of-stock status displayed | Not run |
| TC-16 | Open movements page | Recent stock changes listed | Not run |
| TC-17 | Archive a product | Product disappears but old history remains | Not run |
| TC-18 | Download CSV report | Active inventory downloaded as CSV | Not run |
| TC-19 | Restart server | Previously saved product data remains | Not run |
| TC-20 | Log out and access API | Inventory endpoints return unauthorized | Not run |

## Automated unit tests

Run:

```bash
npm test
```

Unit assertions cover password hashing, SKU normalization, product quantities, stock addition and subtraction, fractional quantities, and CSV escaping. An additional integration test covers login, CRUD, insufficient-stock rejection, movement history, CSV export and logout. See `tests/lib.test.js` and `tests/integration.test.js`.

## Demo walkthrough for presentation

1. Open the login screen and sign in.
2. Show KPI cards and low-stock alerts on the overview.
3. Add a new product called `USB Cable` with SKU `CABL-999`, price ₹249, quantity 12, reorder level 5.
4. Search for `CABL-999` and show it in the products table.
5. Record a stock-out transaction for 9 units; stock should become 3 and show Low Stock.
6. Open Stock Movements and show the recorded stock-out transaction.
7. Open Reports and download the current inventory CSV.
8. Show Jira Epics and Scrum backlog with planned tasks.

## Risk assessment

| Risk | Mitigation |
|---|---|
| Wrong inventory count | Atomic transaction and audit trail |
| Duplicate product SKU | Unique database constraint |
| Invalid input | Client and server checks |
| Unauthorized modifications | Authenticated API routes |
| Lost local database file | Keep backup copies during evaluation |
| Exposing demo credentials publicly | Bind to localhost; never internet-deploy unchanged |
