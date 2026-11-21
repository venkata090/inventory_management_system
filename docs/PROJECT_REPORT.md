# Inventory Management System — Software Engineering Project Report

**Project name:** Inventory Management System (IMS)

**Project type:** Web-based software engineering / Agile development project

**Team members:** [Add names / roll numbers]

**Department / institute:** [Add department and institute]

**Guide:** [Add faculty guide]

## Abstract

The Inventory Management System is a web-based application designed to simplify recording and monitoring stock in a small store or laboratory. It allows an authorized administrator to register products, update stock balances, track stock-in and stock-out movements, monitor products requiring replenishment, and export a current inventory report. The development workflow is organized using Scrum concepts in Jira, including Epics, stories, tasks and sprint planning.

## 1. Introduction

Organizations need accurate stock records to avoid overstocking, stockouts and manual-entry errors. Paper-based stock ledgers can make it difficult to determine current quantities or trace stock changes. This project explores a local computerized inventory system with an intuitive browser interface, a server API and a database.

## 2. Problem statement

Manual inventory management makes product lookup, stock updates and shortage detection time-consuming and error-prone. A centralized and searchable digital stock ledger can reduce repetitive work and improve visibility into available stock.

## 3. Objectives

1. Maintain a product catalog with unique SKU, category, price and quantity.
2. Record valid stock additions and withdrawals.
3. Prevent negative available stock.
4. Display automatic low-stock warnings.
5. Provide a dashboard and downloadable report.
6. Apply Agile project management using Jira.

## 4. Methodology

An Agile/Scrum project plan is divided into three suggested sprints: requirements and foundation, inventory functionality, and testing and documentation. Jira provides Epics, stories and tasks. GitHub can maintain version history. Implementation uses a responsive browser frontend, Node.js server and SQLite.

## 5. Requirements

### Functional requirements

- Administrator login/logout
- Create, list, search, filter, edit and archive products
- Record stock-in and stock-out transactions with before/after quantity
- Display low-stock and out-of-stock alerts
- Display current stock valuation, total products and total units
- Export a CSV inventory listing

### Non-functional requirements

- Responsive layout for laptop and mobile screens
- Input validation to reject invalid quantities and prices
- Atomic database updates for stock changes
- Persistent stock records across restarts
- Maintainable code and documented interfaces

## 6. System design

See `SYSTEM_DESIGN.md` for architecture, data model, flows and use cases.

## 7. Implementation

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js local HTTP server
- **Database:** SQLite
- **Security (local demo):** password hashing, HttpOnly session cookie, authenticated inventory API
- **Planning:** Jira Scrum board using `jira/backlog.csv`

## 8. Testing

Automated unit tests verify password checking, product validation, negative-stock prevention and report escaping. `TEST_PLAN.md` contains functional and edge-case scenarios for browser-based verification. Do not mark tests as passed until they have been executed in your environment.

## 9. Expected outcomes

A running local web application that demonstrates CRUD product management, live stock quantities, audit trails, low-stock warnings and inventory report export. The accompanying Jira backlog demonstrates project decomposition using Agile methodology.

## 10. Limitations and future enhancements

This prototype targets a single local administrator. Future improvements can include production hosting, employee roles, barcode scanning, supplier and purchase-order records, customer billing, SMS/email alerts, analytics and improved integration testing.

## 11. Conclusion

The project demonstrates how a digital inventory workflow can improve stock visibility and record keeping while using Agile project management practices to organize development and verification.

## 12. Screenshots and results

[Insert screenshots of login, dashboard, products, stock operation, reports, Jira board and test outcomes after verifying them.]

## References

- Jira Software: https://www.atlassian.com/software/jira
- Node.js documentation: https://nodejs.org/docs/latest/api/
- SQLite documentation: https://www.sqlite.org/docs.html
