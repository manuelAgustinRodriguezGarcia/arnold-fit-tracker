# Personal bottle hydration — design

Date: 2026-09-10

## Goal

Replace freeform L/ml water entry after a workout with a personal-bottle counter. Capacity lives in Settings and drives total `waterMl`.

## Data

- `settings.bottleCapacityMl`: integer ≥ 0. Default `0` = unset.
- Session still stores `waterMl = bottleCount × bottleCapacityMl`.
- Count starts at `0`; finishing with 0 bottles records 0 ml (same empty semantics as today when possible).

## Settings UI

Section **Botella personal** (after Appearance, before Spotify):

- Copy: “Indicá la capacidad de tu botella personal”
- Numeric input + fixed `Ml` suffix
- Empty/invalid → `0`; valid → rounded integer via `updateSettings`

## Hydration step

Same screen, two modes:

1. **Unset (`bottleCapacityMl === 0`)**: ask capacity (ml + Ml). On confirm, `updateSettings({ bottleCapacityMl })`, then show counter.
2. **Set**: centered `− [n] +` (buttons only; n not typed). Glasses in a centered row; add/remove with smooth animation. Emit `n × bottleCapacityMl`. Cap so total ≤ `MAX_WATER_ML`.

Remove unit picker and freeform L/ml field.

## Approach

Extend settings + rewrite `HydrationStep` (no new feature modules).
