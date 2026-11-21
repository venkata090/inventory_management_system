# System Design — Inventory Management System

## 1. Architecture

```mermaid
flowchart TD
  A[Admin in browser] -->|HTTP GET and POST| B[Node.js web server]
  B --> C[Session authentication]
  C --> D[Inventory API routes]
  D --> E[(SQLite database)]
  E --> F[Products table]
  E --> G[Movements table]
  E --> H[Users table]
```

- **Client:** browser-based JavaScript application with dashboard, forms and product tables.
- **Server:** Node HTTP server handles sessions, validation, CRUD and reports.
- **Database:** SQLite stores three related entities persistently on disk.

## 2. Entity relationship diagram

```mermaid
erDiagram
  USERS {
    int id PK
    string username UK
    string password_hash
  }
  PRODUCTS {
    int id PK
    string sku UK
    string name
    string category
    float price
    int quantity
    int reorder_level
    int active
    datetime created_at
    datetime updated_at
  }
  MOVEMENTS {
    int id PK
    int product_id FK
    string type
    int quantity
    int before_qty
    int after_qty
    string note
    datetime created_at
  }
  PRODUCTS ||--o{ MOVEMENTS : has
```

## 3. Inventory update flow

```mermaid
flowchart TD
  A[User chooses stock IN or OUT] --> B[Enter positive whole-number quantity]
  B --> C[Validate stock request]
  C --> D{Enough stock for OUT?}
  D -->|No| E[Show error; keep stock unchanged]
  D -->|Yes| F[Start SQLite transaction]
  F --> G[Update product quantity]
  G --> H[Insert movement history record]
  H --> I[Commit transaction]
  I --> J[Refresh dashboard and product list]
```

## 4. Use cases

**Actor:** Admin

| Use case | Result |
|---|---|
| Authenticate | Log in or log out |
| Manage products | Create, view, update, archive |
| Search and filter | Find products and low-stock items |
| Maintain inventory | Add or withdraw stock |
| Review movements | View audit trail of recorded changes |
| View dashboard | See totals and stock alerts |
| Export report | Download current product inventory CSV |

## 5. Important design decisions

- **Unique SKU** avoids duplicate product codes.
- **Soft delete** preserves historical stock records even when a product is archived.
- **SQLite transaction** keeps a stock change and movement record together.
- **Quantity cannot be negative**, enforced by server validation and database constraints.
- **Passwords are salted and hashed** with Node.js `scrypt`, never stored in clear text.
- **In-memory sessions** are sufficient only for the local college demo; a production deployment requires stronger session infrastructure.
