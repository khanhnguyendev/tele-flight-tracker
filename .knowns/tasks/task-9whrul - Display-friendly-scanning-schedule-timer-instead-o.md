---
id: 9whrul
title: Display friendly scanning schedule timer instead of cron expression
status: done
priority: medium
labels: []
createdAt: '2026-05-23T16:55:39.384Z'
updatedAt: '2026-05-23T16:56:46.448Z'
timeSpent: 64
---
# Display friendly scanning schedule timer instead of cron expression

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Format the background track cron expression as a human-friendly timer on the stats grid and settings panel with live preview.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/services/cronFormatter.ts to format cron expressions.
2. Modify src/components/StatsGrid.tsx to display friendly schedule.
3. Modify src/components/SettingsForm.tsx to show live parsed preview.
4. Build and verify.
<!-- SECTION:PLAN:END -->

