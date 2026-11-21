# Stockwise — Inventory Management System (IMS)

A self-contained, locally runnable web application for a software engineering college project. It comes with a Jira Scrum backlog, design documentation, test plan, and a functional inventory management demo.

## Quick start (Windows / macOS / Linux)

1. Install **Node.js 22.13 or newer** from https://nodejs.org/ (Node.js 24 LTS also works).
2. Unzip `Inventory_Management_System_Project.zip`.
3. Open the folder `inventory_management_system` in VS Code.
4. Open a terminal in that folder and run:

   ```powershell
   node server.js
   ```

5. Visit **http://127.0.0.1:3000** in a web browser.
6. Sign in using the demo credentials below.

No `npm install`, external database, internet connection, or API keys are needed. The `node:sqlite` library is bundled with modern Node.js, though Node 22 may print an experimental SQLite warning. That warning is expected.

### Demo login

- **Username:** `admin`
- **Password:** `Admin@123`

**Security warning:** These default credentials are only for a **local college demo**, not internet hosting. To use a different password for a new database, set the `IMS_ADMIN_PASSWORD` environment variable before the first run (or remove `data/inventory.db` to reset demo data). Do not deploy to the public internet without proper production security hardening, secure sessions, account management, and HTTPS.

## What works

- Administrator login and logout (password hash, local memory sessions)
- Responsive dashboard with product, quantity, value and alert summary
- Product listing, search and category filter
- Add new product, edit details, archive (soft-delete)
- Stock in / stock out; does not permit negative stock
- Automatic stock transaction/audit history
- Low-stock alerts based on each product's reorder level
- Report page and CSV export
- Sample products seeded at initial startup
- Six unit tests and one end-to-end API integration test with Node's test runner

## Start and test

```powershell
node server.js
```

Optional automated tests:

```powershell
npm test
```

You can also run `node --test tests/*.test.js` without npm.

The application binds to `127.0.0.1` by default to avoid unintended network exposure. Set `PORT=3001` if port 3000 is already in use. On Windows PowerShell:

```powershell
$env:PORT=3001; node server.js
```

### Database persistence

A local SQLite file is automatically created at `data/inventory.db` on first launch. **It is not included in the ZIP**; sample data appears when you first run the server. Keep the file if you want to retain your changes. Deleting the file resets the demo database and credentials.

### Technology choices

- **Frontend:** HTML5, CSS3, vanilla JavaScript (responsive single-page UI)
- **Backend:** Node.js built-in HTTP server and JavaScript modules
- **Database:** SQLite (`node:sqlite`, included in recent Node versions)
- **Project management:** Jira Scrum (importable issues under `jira/`)
- **Version control:** Git / GitHub (push the project as a new repository)

This is intentionally **dependency-free**, so the demo starts with one command. It covers the same frontend/backend/database responsibilities as a React/Express app; React and Express can be used later if your faculty explicitly requires them.

## Files included

```text
inventory_management_system/
├── server.js                  # HTTP endpoints, SQLite and sample data
├── lib.js                     # Validation and password helpers
├── package.json               # Node commands and version requirement
├── public/
│   ├── index.html             # Login and application shell
│   ├── styles.css             # Responsive dashboard design
│   └── app.js                 # UI interactions and API calls
├── tests/lib.test.js          # Seven automated tests
├── jira/
│   ├── backlog.csv            # Jira-ready Epics / Stories / Tasks
│   ├── epic_mapping.csv       # Parent epic mapping reference
│   ├── JIRA_SETUP.md          # Jira setup and import walkthrough
│   └── SPRINT_PLAN.md         # Suggested sprint plan
└── docs/
    ├── PROJECT_REPORT.md      # Report draft and project details
    ├── SYSTEM_DESIGN.md       # Architecture, ERD, flow diagrams
    └── TEST_PLAN.md           # Manual test cases and acceptance criteria
```

## Data and API

### Data tables

- `users`: authentication
- `products`: unique SKU, name, category, price, quantity, threshold, status
- `movements`: stock in/out audit trail, before/after quantities

### Main routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/login` | User login |
| GET | `/api/me` | Session status |
| POST | `/api/logout` | Logout |
| GET | `/api/overview` | KPIs, alerts, categories, activity |
| GET | `/api/products` | List and filter products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Edit product details |
| DELETE | `/api/products/:id` | Archive product |
| POST | `/api/products/:id/movements` | Add stock movement |
| GET | `/api/movements` | Stock audit history |
| GET | `/api/export` | Download product stock report CSV |

All inventory APIs require authentication. Product deletion preserves existing movement history.

## Project boundaries

**Included:** local demonstration of inventory quantities and product metadata.

**Not yet included:** supplier purchase orders, customer invoicing, business accounting, barcode camera scanning, multi-admin permissions, remote deployment, production-ready session persistence or distributed concurrency. The Jira backlog can be extended for these modules if required.

## Jira and GitHub

- Read `jira/JIRA_SETUP.md` for Jira import guidance.
- Read `jira/SPRINT_PLAN.md` for a Scrum implementation schedule.
- Read `docs/SYSTEM_DESIGN.md` for architecture and ER diagrams.
- In a Git repository, add source code but do **not** commit `data/inventory.db` (ignored in `.gitignore`).

## Disclaimer

This is a functional **local project prototype**, not a production-ready inventory service. The Jira board itself cannot be created in your account until you connect an Atlassian workspace or import the provided CSV using your own account.
