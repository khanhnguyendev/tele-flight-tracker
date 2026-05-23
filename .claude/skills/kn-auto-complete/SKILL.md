---
name: kn-auto-complete
description: Finish all remaining tasks in the project task by task using implement -> verify -> commit pipeline
---

# Complete All Tasks Pipeline

Sequential execution mode to implement, verify, and commit all remaining tasks in the project task-by-task.

**Announce:** "Using kn-auto-complete to finish all remaining tasks sequentially."

**Core principle:** SCAN TASKS → SEQUENCE → PLAN & IMPLEMENT → VERIFY → COMMIT → REPEAT

## Inputs

- Optional: `--dry-run` to preview the execution plan and task sequence without modifying any files.

## Step 1: Scan & Retrieve Tasks

Run `knowns task list --plain` (or query the `.knowns/tasks` directory) to find all tasks in `todo` or `in-progress` status.

```bash
knowns task list --plain
```

Filter out all tasks that are already in the `done` status.

## Step 2: Sequence Tasks in Dependency Order

Analyze the task definitions to build a logical execution plan. Tasks must be tackled in strict dependency order (foundational bootstrap/database first, query engines next, conversational webhook/bot logic, followed by dashboard front-end components, settings panels, and final manual/live verification).

For this repository, the correct execution order is:
1. `@task-qbpiqp` (Setup project bootstrap and initial Next.js codebase)
2. `@task-qdhw6k` (Implement file-based settings and history database services)
3. `@task-vamol5` (Implement unified flight query engines: SerpApi, Travelpayouts, mock, Amadeus)
4. `@task-dg6rmv` (Implement Telegram Bot API client and message formatter)
5. `@task-gdd3t1` (Implement Telegram Bot webhook and conversational command handler)
6. `@task-grakrt` (Implement background scan router and dynamic cron scheduler)
7. `@task-bl4txl` (Build glassmorphic web dashboard UI components)
8. `@task-8cvbcf` (Build interactive settings control panel and validation)
9. `@task-ahh8zp` (Verify mock/live integration and finalize validation)

## Step 3: Sequential Execution Loop

For each task in the sequence:

### 3a. Initialize & Plan (Based on `kn-plan` / `kn-implement`)
- Start the timer and set the task status to `in-progress`:
  ```bash
  knowns task edit <id> --status in-progress
  knowns time start <id>
  ```
- Gather context, read requirements, and check if any custom templates are available.
- Draft the specific implementation steps for the task.

### 3b. Implement the Task Requirements
- Follow premium design aesthetics (Harmonies Emerald/Slate dark mode, beautiful modals, forms, and custom progress components).
- Ensure no placeholder images or simple/broken code blocks are added.
- Add features and services in a robust, clean, and highly structured manner.

### 3c. Verify and Validate (Based on `kn-verify`)
- Run tests and check that the application builds successfully:
  ```bash
  npm run build
  ```
- Ensure the newly added code satisfies all the task's acceptance criteria (ACs).
- Run Knowns validation to ensure references are clean and unbroken:
  ```bash
  knowns validate <id> --plain
  ```
- Stop the timer and mark the task as completed:
  ```bash
  knowns time stop <id>
  knowns task edit <id> --status done
  ```

### 3d. Commit Changes (Based on `kn-commit`)
- Verify staged changes to ensure only related, clean code is added:
  ```bash
  git status
  git diff --staged
  ```
- Draft a high-quality conventional commit message of format `<type>(<scope>): <short description>` referencing the completed task:
  ```text
  feat(tracker): implement database services

  - Created settingsDb and historyDb services
  - Closes task-qdhw6k
  ```
- Ask the user for confirmation and commit the changes:
  ```bash
  git add -A
  git commit -m "..."
  ```

## Step 4: Final Validation

After completing all tasks, run the global SDD validation to check spec coverage:

```bash
knowns validate --sdd --plain
```

Verify that the system is fully integrated, the dev server boots up beautifully, and all features perform timezone-safely and responsively.

## Checklist

- [ ] All remaining tasks scanned
- [ ] Tasks ordered by logical dependency
- [ ] For each task:
  - [ ] Timers used and status updated
  - [ ] Code implemented with premium styling and design best practices
  - [ ] Local build and tests pass
  - [ ] Knowns validation is clean
  - [ ] Clean conventional commit created
- [ ] Final global verification completed and reported
