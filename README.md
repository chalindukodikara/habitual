# Habitual

**Build better habits, one day at a time.**

A full-featured habit tracker with a GitHub-style contribution heatmap, streak tracking, weekly analytics, focus timer, achievement badges, and intelligent insights. Check off daily habits, watch your streaks grow, get a consistency grade, time your focus sessions, and visualize your progress over time — all in light or dark mode.

## Architecture

| Component      | Type       | Tech              | Port | Visibility |
|----------------|------------|-------------------|------|------------|
| habitual-ui    | deployment | React + Vite      | 3000 | external   |
| habitual-api   | deployment | Go (net/http)     | 8080 | project    |
| habitual-db    | statefulset| PostgreSQL 16     | 5432 | project    |
| streak-engine  | cronjob    | Go                | --   | --         |

## Quick Start

```bash
make dev              # Start all services
open http://localhost:3000
make run-cronjob      # Run streak calculation manually
make clean            # Stop and remove everything
```

### Custom Ports

Port mappings are configurable via environment variables for running multiple apps simultaneously:

```bash
FRONTEND_PORT=3002 BACKEND_PORT=8082 PG_PORT=5434 \
  VITE_API_URL=http://localhost:8082 docker compose up --build -d
```

## Features

### Today View
- **Live clock** in the header — real-time HH:MM:SS with AM/PM, timezone indicator, updates every second
- **Dynamic greeting** — automatically transitions between Good morning / afternoon / evening / night as time passes
- **Quote + Challenge row** — motivational quote and daily challenge side-by-side in a compact layout
- **Circular progress ring** (160px) with 4-stop gradient, tick marks at 25/50/75%, milestone markers, and a glow filter effect at 100%
- **Mini widgets** — 3-column row showing: days to next streak milestone, today's completion %, and "at risk" habit spotlight
- **Daily Focus** — compact sidebar card highlighting the uncompleted habit with lowest 30-day rate + "Do it" button
- **Weekly Recap** — average streak, best day, and 30-day rate at a glance
- **In-app encouragements** — toast notifications on page load when a habit hits a streak milestone (7/14/30/60/100 days)
- **Habit rows** with rate indicator dots, descriptions, streak badges, ripple effect on toggle, and optimistic updates
- **Celebration card** — 16-dot confetti animation, streak highlight, and "100% Complete" badge when all habits are done

### Timer
- **Stopwatch mode** — Start/Stop/Reset with precision timing (MM:SS.ms), lap tracking with split times
- **Focus Timer (Pomodoro)** — three presets (Pomodoro 25min, Short 15min, Deep Work 50min) with configurable work/break durations
- **Circular progress animation** — shows time remaining with phase-colored stroke (green for work, cyan for short break, violet for long break)
- **Auto phase advancement** — automatically transitions between work and break phases, long break every 4 sessions
- **Audio notification** — soft tone via Web Audio API when timer completes
- **Session tracking** — dot visualization showing completed sessions and total focused minutes

### Activity (Heatmap)
- **GitHub-style 52-week contribution grid** with 6-level color intensity (separate palettes for light/dark mode), hover tooltips, and month/day labels
- **Stats dashboard** (5-column grid on desktop) — Current streak, Best streak, Total completions, Perfect Days, Daily Average
- **Best Day analysis** — which day of the week has the most completions
- **Month-over-month comparison** — this month vs last month with percentage change
- **Last 7 Days timeline** — daily completion bars with counts, perfect day checkmarks, and today highlight
- **Achievement Badges** — 12 unlockable badges computed from habit data:
  - First Seed, Week Warrior (7d), Monthly Master (30d), Century Club (100d)
  - Half Century (50 completions), 500 Club, Rocket (1000 completions)
  - Perfect Week (7 perfect days), Perfect Month (30 perfect days)
  - Consistent (80%+ avg), Multi-Master (3+ habits above 80%), Electrified (14d active streak)

### Statistics
- **Consistency Score** — letter grade (A+ through D) computed from 30-day average with color-coded card
- **Habit of the Month** spotlight — weighted by completion rate and streak length
- **Compare Habits** — collapsible side-by-side comparison of any two habits (30-day rate, current streak, longest streak) with winner indicators
- **Performance Radar** — SVG spider chart showing all habits' 30-day rates on axes with grid circles, data polygon, and legend
- **Weekly completion chart** — animated bar chart with color-coded performance and trend indicators
- **Trend insights** — dynamic motivational text based on your trajectory
- **Personal Records** — longest streak, most consistent habit, most improved habit
- **30-day performance** — per-habit progress bars with animated fill, sparklines, streak info, and performance labels

### Habit Management
- **Create habits** with 30 emoji icons (searchable), 16 color options, and 3 frequency choices (Daily, Weekdays, Weekend)
- **Edit habits** — modify name, icon, color, frequency, and description of existing habits via pencil icon
- **Habit Detail page** (`/habit/:id`) — tap habit name to see: hero card, stats grid, progress ring with sparkline, streak milestones (7/14/30/60/100d), performance insight, and linked timer sessions
- **Habits Overview card** — active count, average 30-day rate, top performer, and "needs attention" alert
- **2-column grid** on desktop for habit cards
- **Archive/restore** habits to hide without losing data
- **Delete** habits with inline confirmation
- **Habit Packs** — 5 categorized template packs with 17 total habits
- **Inline 30-day rate bars** for each active habit

### Theming
- **Light mode** — clean white UI with emerald accent (default)
- **Dark mode** — full dark theme across all components (cards, inputs, charts, heatmap, navigation, toasts)
- **Auto mode** — follows system `prefers-color-scheme` preference, updates in real-time
- **Theme toggle** — sun/moon/monitor icon in header, cycles through light → dark → auto
- **Smooth transitions** — 300ms color transition when switching themes
- **Persistent preference** — theme choice saved to localStorage

### General
- **5-tab navigation** — Today, Activity, Timer, Habits, Stats with bottom tab bar
- **Desktop-friendly** — max-w-4xl layout with responsive grids, iOS safe area support
- **Streak milestones** — Visual badges for 7-day, 30-day, and 100-day streaks with pulse animations
- **Header streak counter** — fire badge showing your best active streak
- **Toast notifications** — Completion confirmations and error feedback (dark-mode aware)
- **Loading skeletons** — Shimmer animations for all data-fetching views (dark-mode aware)
- **Page transitions** — Smooth fade/slide animations between views
- **Glass morphism** — Frosted header and bottom navigation (adapts to theme)
- **Floating Action Button** — persistent "+" button with quick actions (New Habit, Start Timer), auto-hides on Habits/Timer pages
- **Micro-interactions** — Ripple effects on habit toggles, card hover lift, count-up animations, floating empty states
- **Accessibility** — `prefers-reduced-motion` support disables all animations for users who prefer it
- **OpenAPI spec** — full API documentation in `openapi.yaml`

## Cronjob (Streak Engine)

Runs daily at 00:05 UTC. Performs two computations:

1. **Streak calculation** — for each active habit, walks backwards from today counting consecutive days with completions. Updates `current_streak`, `longest_streak` (high-water mark), and `completion_rate_30d` (completions in last 30 days / 30 * 100).

2. **Weekly aggregation** — for each profile, counts completions in the current Mon-Sun week and total possible (active habits * 7). Feeds the weekly completion chart on the Stats page.

All results are upserted into `streaks` and `weekly_stats` tables. The API reads from these tables directly — no computation on the request path.

## API Endpoints

| Method | Path                          | Description                         |
|--------|-------------------------------|-------------------------------------|
| POST   | `/api/profiles`               | Create profile                      |
| GET    | `/api/profiles/:id`           | Get profile                         |
| POST   | `/api/profiles/:id/habits`    | Create habit (with description)     |
| GET    | `/api/profiles/:id/habits`    | List habits with streaks            |
| GET    | `/api/profiles/:id/today`     | Get today's completions             |
| PATCH  | `/api/habits/:id`             | Update habit (name, icon, color, frequency, description, archived) |
| DELETE | `/api/habits/:id`             | Delete habit permanently            |
| POST   | `/api/habits/:id/complete`    | Toggle habit completion             |
| GET    | `/api/profiles/:id/heatmap`   | Heatmap data (configurable months)  |
| GET    | `/api/profiles/:id/stats`     | Weekly stats + habit rates          |
| GET    | `/healthz`                    | Health check                        |

## Seed Data

- 1 demo profile ("Demo User") with **8 habits**:
  - 💪 Exercise — 30 minutes of cardio or strength training
  - 📚 Read 30min — Read at least 30 minutes of a book
  - 💧 Drink 2L Water — Drink at least 2 liters throughout the day
  - 🧘 Meditate — 10 minutes of mindfulness meditation
  - 📵 No Social Media — Stay off social media for the entire day
  - 📝 Journal — Write at least one page in your journal
  - 🥗 Eat Healthy — No junk food, eat whole foods only
  - 🚶 Walk 10k Steps — Hit 10,000 steps by end of day (weekdays only)
- **180 days** (6 months) of semi-realistic completion data with weekday/weekend variation per habit
- Pre-computed streaks, 30-day completion rates, and **26 weeks** of weekly stats
- Seed is **re-runnable** (`ON CONFLICT` upserts) — run `make seed` to reset demo data
