# Replay Workout Complete Sheet from Home Week Bar

## Goal
On Home, tapping today’s activity bar (when that day has a workout) reopens the congratulations complete sheet for the latest session of today, without confetti. Other weekdays keep the existing caption behavior. Progress is unchanged.

## Trigger
- Surface: Home only (`WeeklySummary` → `WeekActivityBars`)
- Condition: tapped day is today (local calendar day) AND day has at least one completed session
- Session shown: latest session of that day by `endedAt || startedAt`
- Dismiss: same as after a real finish (`Listo` / backdrop / Escape)

## Non-goals
- Replay from Progress `ActivityChart` / `WeekActivityBars`
- Replay for past weekdays
- Confetti on replay
- Picker when multiple sessions exist (always latest)

## Behavior matrix
| Context | Day | Trained? | Result |
| --- | --- | --- | --- |
| Home | Today | Yes | Open `WorkoutCompleteSheet` for latest today session, no confetti |
| Home | Today | No | No-op (clear selection if any) |
| Home | Other day | Yes | Existing caption toggle |
| Home | Other day | No | Existing no-op |
| Progress | Any | Any | Unchanged (caption only) |

## Content
Reuse current `WorkoutCompleteSheet` (title with weekday, hero icon, stats, exercise list, record badge when applicable). Recalculate duration record with `isLongestDurationSession(session, sessions)` on open so the badge stays correct.

## Architecture
- `WeekActivityBars`: optional `onTodaySessionSelect(session)`. When provided and the clicked day is today with sessions, call it with the latest session instead of (or without relying on) caption-only selection for that path. When omitted, keep current caption behavior (Progress).
- `HomeView` / `WeeklySummary`: local state for `replaySession` (+ derived `isDurationRecord`); render `WorkoutCompleteSheet` when set; pass `onTodaySessionSelect`.
- `WorkoutCompleteSheet`: add `celebrate` prop (default `true`). When `false`, skip confetti. Finish flow keeps default `true`.

## Edge cases
- Active workout in progress: still allow replay if today already has a finished session (sheet overlays; dismiss returns to Home).
- Reduced motion: sheet enter/exit already respects it; confetti already skipped when `celebrate` is false.
