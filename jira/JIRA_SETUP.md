# Jira setup and CSV import — Inventory Management System

## 1. Create an Agile software project

1. Sign in to Atlassian Jira Cloud.
2. Create a **Scrum** software project/space called **Inventory Management System**.
3. Use **IMS** as the project key if available, and choose Team-managed when offered.
4. Add workflow statuses **To Do**, **In Progress**, **In Review**, and **Done** (or use the defaults).

> Jira interface labels and import permissions vary by Jira Cloud plan and configuration. Some views use “Space” in place of “Project.”

## 2. Import the backlog

- Open `backlog.csv` in a spreadsheet editor to review **32** sample Jira issues.
- Use your Jira Cloud issue CSV import flow (e.g., Issues/Search → Import issues from CSV, or admin External System Import if enabled) to upload it.
- Map **Summary**, **Issue Type**, **Description**, **Priority**, and **Labels** to the matching Jira fields.
- If Jira does not allow Epic/Story/Task CSV import through your account, create the **six Epics** and the user stories manually from the CSV; a Jira administrator can often enable more advanced CSV import.
- Use `epic_mapping.csv` to assign each Story and Task to its intended **Parent Epic** after import. This mapping is **not** automatically imported because Jira versions and project types differ in how they represent epic-parent relationships.
- Verify imported issues individually before you move work into the Scrum sprint.

### The six epics

1. Requirements and Project Planning
2. UI and System Design
3. Database and Backend
4. Inventory Features
5. Testing and Quality Assurance
6. Documentation and Presentation

## 3. Suggested sprint structure

Use `SPRINT_PLAN.md` to group the work into three sprints. Add tasks to the backlog and then drag them into the correct sprint.

## 4. Suggested Jira issue workflow

**To Do → In Progress → In Review → Done**

- **To Do**: not started
- **In Progress**: coding/design in progress
- **In Review**: awaiting test/review
- **Done**: implemented and verified

Mark only verified tasks as completed. The CSV intentionally has **no fabricated status, assignees, completion dates, or story points**.

## 5. Evidence to collect for a software engineering evaluation

- Project overview and backlog screenshot
- Six Epics and user stories with acceptance criteria
- Three sprint plans and a sample board screenshot
- GitHub commits showing incremental development
- Test case results and any documented bugs
- Running software demo and exported inventory CSV

**Note:** Importing issues creates planning records only; it does not create a running app or automatically validate any development tasks.
