# Master Prompt: Next.js 16 + HeroUI Flight Price Tracker Bot & Dashboard

You are a world-class React/Next.js developer and System Architect. Your goal is to build a premium, highly aesthetic **Flight Price Tracker Web Application and integrated Telegram Bot** named **tele-flight-tracker**, configured to push to the repository `git@github.com:khanhnguyendev/tele-flight-tracker.git`.

You must use **Next.js 16 (App Router)**, **TailwindCSS**, and the **HeroUI** component library (formerly known as NextUI).

The application must periodically track flight ticket prices for round-trips based on dynamic search parameters (Origin, Destination, Dates, Interval), record a historical log of the last 10 scans, plot gorgeous visual charts, calculate timezone-safe departure countdowns, support conversational Telegram chat commands, and offer a premium web dashboard with glassmorphic aesthetics.

---

## Technical Stack & Architecture

1. **Framework:** Next.js 16 (App Router, React Server Components, Server Actions).
2. **Styling & UI:** TailwindCSS + **HeroUI** (NextUI v2) for clean glassmorphism, Harmonies Emerald/Slate dark mode, beautiful modals, forms, and custom progress components.
3. **Database:** SQLite (via `better-sqlite3`) or local JSON files (`data/settings.json`, `data/history.json`) to persist configurations and historical prices.
4. **Scheduled Task Scheduler:** Integrated Next.js Route Handler for cron jobs (compatible with Vercel Cron or local `node-cron` daemon process), reading intervals from the database and supporting dynamic rescheduling.
5. **APIs Integrations (SerpApi is the RECOMMENDED live engine):**
   - **SerpApi (Google Flights API) [RECOMMENDED DEFAULT]:** Real-time, live scraped flights directly from Google Flights. Highly accurate, live-verified. Free tier offers **100 searches per month**, which fits perfectly with a 6-hour or 8-hour tracking interval. It executes outbound and return searches timezone-safely, dynamically pairing same-carrier round trips and cheapest combos.
   - **Travelpayouts V3 API:** (aviasales/v3/prices_for_dates) For free, unlimited cached round-trip pricing.
   - **Mock Service:** Simulates flight searches with small price fluctuations for immediate credential-free testing.
   - **Amadeus GDS API:** (⚠️ Deprecating July 17, 2026. Avoid active dependencies).
6. **Telegram Bot Integration:** Fully secure route handler (`/api/telegram/webhook` or integrated polling engine) handling chat commands, updating the central database, and sending premium English HTML notifications.

---

## Directory Structure

Generate a clean Next.js 16 directory layout:
```
/
├── package.json
├── tailwind.config.js
├── next.config.js
├── .env.example
├── .env
├── data/
│   ├── settings.json          # Dynamic travel parameters (Persistent)
│   └── history.json           # Price history trends & last 10 points
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with HeroUIProvider
│   │   ├── page.tsx           # Premium Main Dashboard (RSC + Glassmorphic UI)
│   │   ├── settings/
│   │   │   └── page.tsx       # Interactive Controls Settings Form page (HeroUI Form)
│   │   └── api/
│   │       ├── scan/
│   │       │   └── route.ts   # Route Handler to trigger scan manually/cron
│   │       └── telegram/
│   │           └── route.ts   # Webhook / Polling entrypoint for bot commands
│   ├── components/
│   │   ├── StatsGrid.tsx      # Premium stats cards (Best price, route, engine)
│   │   ├── TrendChart.tsx     # Chart.js or Recharts line chart (Emerald Green theme)
│   │   ├── FlightList.tsx     # Accordion of carrier flight segment cards (HeroUI)
│   │   └── SettingsForm.tsx   # Zod-validated settings form
│   ├── services/
│   │   ├── config.ts          # Env loading & sunset warnings
│   │   ├── settingsDb.ts      # Settings read/write
│   │   ├── historyDb.ts       # History logs & cap to 10 points
│   │   ├── serpapi.ts         # Google Flights SerpApi engine (RECOMMENDED DEFAULT)
│   │   ├── travelpayouts.ts   # Travelpayouts GDS cache engine
│   │   ├── amadeus.ts         # Amadeus GDS engine (Deprecating July 17, 2026)
│   │   ├── mock.ts            # Simulated fluctuated flight engine
│   │   ├── telegram.ts        # Countdown, ASCII chart, QuickChart URL & Telegram POST
│   │   └── tracker.ts         # Engine routing and delta analyser orchestrator
│   └── hooks/
│       └── useCountdown.ts    # React countdown timer hook
```

---

## Core Product Feature Requirements

### 1. Unified Dynamic Search Engine (`src/services/tracker.ts`)
Implement an abstract router that switches between `'serpapi' | 'travelpayouts' | 'mock' | 'amadeus'` depending on the settings database (with **SerpApi** set as the recommended default). Normalize all results into a clean uniform schema:
```typescript
interface StandardizedOffer {
  id: string;
  carrierCode: string;
  carrierName: string;
  price: number;
  outbound: {
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    stopsAirports: string[];
  };
  inbound: {
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    stopsAirports: string[];
  };
  deeplink: string;
}
```

### 2. Conversational Telegram Bot Listener (`src/app/api/telegram/route.ts`)
Build an API endpoint / Route Handler that listens to incoming messages. Check incoming `chat_id` strictly against `TELEGRAM_CHAT_ID` for security. Parse and process commands:
* `/status` : Returns current search criteria, active API engine (defaults to SerpApi), cron interval, and departure countdown.
* `/scannow` or `/scan` : Triggers the flight scanner Server Action instantly, updating the dashboard history and sending the resulting HTML message.
* `/setorigin <IATA>` : Updates origin airport (e.g. `/setorigin HAN`).
* `/setdest <IATA>` : Updates destination airport (e.g. `/setdest CAN`).
* `/setdates <Outbound> <Return>` : Updates travel dates (e.g. `/setdates 2026-08-28 2026-09-02`).
* `/setinterval <Cron>` : Updates background tracking intervals, stopping old crons and scheduling the new one dynamically.
* `/help` : Returns a list of these English instructions.

All Telegram reports must be compiled into beautiful HTML formats:
* **Countdown:** Render ICT GMT+7 countdown dynamically in bold.
* **Ascii Bar Chart:** Generate a horizontal Unicode block chart comparing historical checks inside a `<code>` block:
  ```text
  23/05 22:57 ➔ 4,900k | ██████████████
  23/05 22:58 ➔ 4,800k | ██
  ```
* **Interactive Chart Link:** Dynamically compile a QuickChart JSON query URL mapped to an Emerald Green line chart config.

### 3. Premium Glassmorphic Web Dashboard (`src/app/page.tsx`)
Create a visually stunning web interface using a harmonious dark mode theme (Slate/Zinc background, Emerald-Green highlight accents, glassmorphic backdrop filters, and sleek borders).

* **Header:** Title, route subtitle, and a **Live Countdown Timer Widget** that dynamically ticks down (Days, Hours, Minutes, Seconds) to the departure date.
* **Stats Cards Grid:** 4 premium Cards showing:
  1. Cheapest Price (with a colored badge showing drop `📉 -200,000` or spike `📈 +50,000`).
  2. Active Route & Dates (SGN ⇄ CAN | Aug 28 - Sep 2).
  3. API Engine & Currency (SERPAPI [RECOMMENDED] | VND).
  4. Auto-Scan Schedule (Cron: `0 */6 * * *` with a "Scan Now" CTA button).
* **Price Trend Graphic:** A beautiful, responsive line chart (using Chart.js, Recharts, or HeroUI charts) with smooth borders, tooltips, grid lines, and emerald linear gradients representing price history points.
* **Carrier Accordion List:** A list of cards per airline (Vietnam Airlines, China Southern, Shenzhen Airlines, etc.) grouping outbound/inbound segments, flight durations, stopovers details, departure/arrival times, price tags, and a "Book on Google Flights" button.

### 4. Interactive Configuration panel (`src/app/settings/page.tsx`)
* A clean form layout displaying inputs for Origin, Destination, Outbound date, Return date, Currency, Engine (default: SerpApi), and Cron schedule.
* Uses **HeroUI Inputs, Selects, and Buttons**.
* Includes client-side validations (Zod schemas matching `settings.json` boundaries) and Server Actions to save changes and reschedule the crons dynamically.
* Displays a prominent "Trigger Real-time Scan" button with a loading spinner that runs `/api/scan`, updates history, and shoots a Telegram alert.

---

## Environment Configuration (.env.example)

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Mode Settings (true = Mock simulation; false = Fetch active APIs)
USE_MOCK_DATA=true

# API Engine Selection (when USE_MOCK_DATA=false)
# Options:
# - 'serpapi'       : RECOMMENDED DEFAULT! Live scraped real-time searches from Google Flights (100 free/month)
# - 'travelpayouts' : Cached round-trip searches from Aviasales GDS, free & unlimited
# - 'amadeus'       : Live Amadeus GDS searches (⚠️ SUNSETTING JULY 17, 2026!)
API_ENGINE=serpapi

# API Credentials
SERPAPI_KEY=your_serpapi_key_here
TRAVELPAYOUTS_TOKEN=your_travelpayouts_token_here
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here

# Scanning frequency (Standard Cron Expression - Default: every 6 hours)
TRACK_INTERVAL_CRON=0 */6 * * *

# Target Currency
CURRENCY=VND
```

---

## Detailed Step-by-Step Instructions for the AI

1. **Setup Project:** Start by setting up a standard Next.js 16 directory with App Router and TailwindCSS. Install required dependencies: `heroui` (formerly `@nextui-org/react`), `framer-motion` (for HeroUI micro-animations), `axios`, `node-cron`, `chart.js` (and `react-chartjs-2`), `zod`, and `lucide-react`.
2. **Setup Git & GitHub Integration:**
   Initialize a Git repository and hook up the remote origin provided by the developer:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of tele-flight-tracker Next.js 16 App with HeroUI dashboard"
   git branch -M main
   git remote add origin git@github.com:khanhnguyendev/tele-flight-tracker.git
   git push -u origin main
   ```
3. **Implement Database Services:** Write `src/services/settingsDb.ts` and `src/services/historyDb.ts` to manage file-based JSON database reads/writes (`data/settings.json`, `data/history.json`), initializing default travel coordinates (SGN-CAN, Aug 28 - Sep 2, 2026).
4. **Implement Abstract Query Router:** Write flight services for SerpApi Google Flights scraped one-way combinations (RECOMMENDED default), Travelpayouts V3 pricing, Mock mock data fluctuations, and Amadeus. Build the centralized `tracker.ts` routing the search dynamically.
5. **Implement Telegram Bot & Long Polling API:** Write the conversational message compiler in `telegram.ts` (handling countdown, ASCII block charts, QuickChart link, and axios Telegram POST). Write the Long Polling listener / Webhook Route Handler in `src/app/api/telegram/route.ts` that maps chat slash commands to parameters updates.
6. **Implement Dynamic Cron Rescheduler:** Implement a cron scheduler manager inside Next.js (either via Vercel Crons or a background node-cron singleton daemon) that automatically stops and registers new schedules dynamically.
7. **Implement Gorgeous Glassmorphic UI:** Build the layout, Stats Grid, custom Canvas Chart trend graphics, and Accordion carriers list inside `src/app/page.tsx` using Tailwind glassmorphic styling (`backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20`).
8. **Implement Configuration Controls:** Write `src/app/settings/page.tsx` with Zod validations and HeroUI elements. Use Server Actions to process updates and trigger instantaneous live flight scans!
9. **Double-check Sunsetting Safeguards:** Enforce strict warning messages and errors if `amadeus` engine is selected past July 17th, 2026.
