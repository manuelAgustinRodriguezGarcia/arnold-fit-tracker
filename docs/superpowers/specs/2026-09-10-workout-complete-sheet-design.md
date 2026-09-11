# Workout Complete Sheet

## Goal
After finishing a workout (stretch → fatigue → hydration), show a congratulations bottom sheet with session summary, confetti in theme accent, and a duration record badge when applicable.

## Trigger
After hydration confirm/skip → `finishWorkout` persists session → open sheet → on dismiss → home.

## Content
- Title: Rutina terminada / congratulations tone
- Routine name, duration, exercise count, completed sets, volume (kg), fatigue, water
- Exercise list (performed): name + series count (reps) or total time (timed)
- Badge "NUEVO RÉCORD" when session duration is longest of all prior sessions

## UI / motion
- Dedicated bottom sheet (not Modal), slide-up from bottom, smooth enter/exit
- Confetti via `canvas-confetti`, colors from CSS `--accent` (and related accent tokens), respects reduced motion

## Architecture
- `WorkoutCompleteSheet` component + CSS module
- `finishWorkout` returns saved session
- AppShell keeps workout surface open until sheet closes (`workoutOpen` without requiring `activeWorkout`)
- Helper to detect duration record against previous sessions
