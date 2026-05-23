---
id: f7mfxl
title: Hide Active Search Engine from Dashboard and Settings
status: done
priority: medium
labels: []
createdAt: '2026-05-23T16:54:17.258Z'
updatedAt: '2026-05-23T16:55:34.043Z'
timeSpent: 74
---
# Hide Active Search Engine from Dashboard and Settings

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hide the Active Search Engine stats card from the main dashboard and remove the engine selection option from the settings control panel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Modify src/components/StatsGrid.tsx to remove search engine card and change grid to 3 columns.
2. Modify src/components/SettingsForm.tsx to remove engine select and Amadeus warnings.
3. Modify src/app/settings/actions.ts to hardcode serpapi engine.
4. Build and verify.
<!-- SECTION:PLAN:END -->

