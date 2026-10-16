# MAYOR — Development Plan

> Interactive 3D City-Building & Decision Simulation Game
>
> Stack: MERN + React Three Fiber + Three.js
>
> Team:
> - Aryan — 3D World & Game Visualization
> - Aarushi — Frontend, UI/UX & Player Experience
> - Ashwera — Backend, Simulation Engine & Game Logic

---

# 0. Product Definition

## 0.1 Game Concept

The player becomes the newly elected mayor of a developing city.

The player must grow the city while balancing:

- Populationup
- Treasury
- Economy
- Healthcare
- Education
- Infrastructure
- Environment
- Governance
- Citizen Approval

Every major decision has positive and negative consequences.

The game progresses through turns/months.

The player receives:

- Missions
- Crisis events
- Policy decisions
- Construction opportunities
- Random events
- Event chains

The player wins by developing the city to the required level while maintaining minimum thresholds across critical systems.

The player loses if critical city conditions collapse.

---

# 1. Core Game Loop

```text
LOGIN
  ↓
CREATE CITY
  ↓
BECOME MAYOR
  ↓
INITIAL CITY STATE
  ↓
VIEW CITY
  ↓
MAKE POLICY / BUILDING DECISION
  ↓
ADVANCE MONTH
  ↓
COLLECT TAX REVENUE
  ↓
PAY CITY EXPENSES
  ↓
UPDATE CITY SIMULATION
  ↓
TRIGGER EVENT
  ↓
PLAYER CHOOSES RESPONSE
  ↓
APPLY CONSEQUENCES
  ↓
UPDATE MISSIONS
  ↓
CHECK WIN / LOSS
  ↓
NEXT MONTH
```

---

# 2. Current Status (as of 7 Oct 2026)

| Area | State |
|---|---|
| Backend API (auth, cities, build, policies, advance month, events, missions) | Built, connected to MongoDB Atlas, 17 automated tests passing (`npm test` in `backend/`) |
| 3D city (React Three Fiber): roads, buildings, greenery, traffic, pollution/unrest effects | Built, integrated with the live API |
| Frontend: landing, auth, city list, create city, city view | Built, functional, but styled as a dashboard |
| `main` | Contains Aryan's 3D world + city gameplay integration (`aryan/3d-city-world` merged) |
| Ports | Backend `5002` (`backend/.env`), frontend default API URL `http://localhost:5002/api` |

**Known gaps driving the next round:** the UI feels like an admin dashboard, the 3D scene is not fullscreen, and the game logic is too easy to win and too easy to ignore (see Section 5).

Branch rules: one feature branch per person (`aarushi/...`, `aryan/...`, `ashwera/...`), PR into `main`, nobody pushes to `main` directly. Rebase on `main` before opening a PR. Run `npm test` in `backend/` and `npm run build` in `frontend/` before every PR.

---

# 3. Aarushi — Make the UI a game, not a dashboard

**Goal:** the first 10 seconds after opening a city should feel like starting a level in a mobile game (Subway Surfers, Clash of Clans, Township, Monopoly GO, Two Dots), not logging into an admin panel. Today `CityReadyPage.jsx` shows KPI cards, stat bars and forms around a canvas. The world should be the screen, and the UI should float over it.

## 3.1 Design principles (read before building anything)

1. **The world is the hero.** Fullscreen canvas (see Aryan, Section 4). All UI is overlay HUD with transparent or glass panels. No page chrome, no site header while playing.
2. **One primary action at a time.** Subway Surfers always makes the next action obvious. The player should always see one big glowing button: "Next Month", "Resolve Event" or "Collect". No menus buried in forms.
3. **Juice on every action.** Nothing changes silently: numbers count up/down, icons pop and float, bars flash green/red, screen shakes on crises, coins fly to the treasury counter.
4. **Show, don't tell.** Replace text and number tables with icons, bars, avatars, emoji-style status faces and colour. Numbers are secondary.
5. **Short sessions, clear goals.** Always show the current mission and its progress, like a daily quest strip.
6. **Reward everything.** Missions completed, buildings built, months survived, and streaks give stars, XP or a satisfying animation.
7. **Touch-first sizing.** Buttons at least 48px, big tap targets, works on a phone-width viewport.

## 3.2 Reference games to study (take one concrete idea from each)

- **Subway Surfers:** persistent top HUD (score, coins), one-thumb big buttons, bright saturated colour, constant motion, "mission" strip, pop-ups with rewards.
- **Clash of Clans / Township:** build menu as a bottom icon tray, tap a building to get a radial or floating action bubble, resource counters with animated icons, construction timers.
- **Monopoly GO / Candy Crush:** chunky 3D-style buttons, event cards that slide up, celebratory confetti on wins, "juicy" progress bars.
- **Stardew / Cities: Skylines (console UI):** a calm top bar with the key stats and a collapsible bottom toolbar.

## 3.3 Screens and tasks

### A. Game HUD (replaces the current city page layout), the biggest task
Build as overlay components over the fullscreen canvas in `frontend/src/components/hud/`:

- **Top-left, "Mayor card":** avatar circle (use the hero mascot image already in `frontend/src/`), city name, month counter ("Month 7"), approval shown as a face icon that goes 😄→🙂→😐→😠 with colour.
- **Top-centre, resource pills:** Treasury (coin icon, count-up animation, red flash when it drops), Population (people icon). Pills only. No cards, no labels longer than one word.
- **Top-right:** settings (⚙), fullscreen toggle (coordinate with Aryan), logout.
- **Left side, vertical sector gauges:** Economy, Health, Education, Infrastructure, Environment, Governance as 6 small circular or vertical gauges with icons. Colour by value (green >60, amber 35–60, red <35), pulse when <25. Hover or tap expands to a tooltip with the number. This replaces `StatBar` and the stat list.
- **Right side, mission strip:** up to 2 active missions as quest cards with a progress bar, star icon and a "completed!" burst. Data: `city.missions` plus `GET /api/catalog/missions`.
- **Bottom-centre, the big action button:** large pill "NEXT MONTH ▶" with a pulsing glow. Disabled with a lock icon while an event is pending. Shows a short spinner and animation (calendar flip) while the request runs.
- **Bottom-left, build tray:** icon tray (clinic, school, park, factory, power plant, transit) as a horizontally scrollable row of cards: icon, name, cost. Tap, then a confirm bubble ("Build Park ₹4,000?"). Greyed out and shaking when unaffordable. Data: `GET /api/catalog/buildings`.
- **Bottom-right, policy button:** opens a slide-up "Policies" sheet with toggle cards (on/off), monthly cost and effect icons. Data: `GET /api/catalog/policies`, `POST/DELETE /api/cities/:id/policies`.

### B. Event cards (crisis / decision moments)
When `city.pendingEvents` is non-empty, dim the world and slide up a full-width **event card** (like a Clash Royale chest reveal): big illustration or emoji, title, a one-line description, and 2–3 large choice buttons showing cost and effect icons (💰−6000 ❤️+8). After choosing, show a result toast ("Outbreak contained! +8 health") with floating stat deltas. Data: `pendingEvents[].choices` and `POST /api/cities/:id/resolve-event`.

### C. Turn feedback ("juice")
- After "Next Month", show a **month recap pop-up** built from `city.log` entries for the new month: tax collected (+), expenses (−), event triggered. Auto-dismiss after ~2.5s, tap to skip.
- Animated floating numbers (`+₹1,000`, `−₹300`) rising from the treasury pill.
- Sound hooks (optional but recommended): tap, coin, success, alert. Provide a mute toggle. Keep files small, free licence.
- Screen-shake and red vignette on crises or when a stat enters the red.

### D. Win / Lose screens (pair with Ashwera's logic, Section 5)
- **Win:** confetti, "THE CITY THRIVES", final stats as a star rating (1–3 stars), months taken, buttons "Play again" / "Back to cities".
- **Lose:** dark overlay, headline from `city.outcomeReason` (bankrupt, no-confidence vote, abandoned, chaos), "what went wrong" row highlighting the failing stat, button "Try again".
- Trigger when `city.status` is `won` or `lost`.

### E. Landing, auth and city list (restyle only)
- Landing: hero image full-bleed, one giant "PLAY" button, tagline. Remove the paragraph-heavy layout.
- Login/Register: single centred card, big inputs, friendly error messages (already surfaced via `ApiError`).
- City list ("Campaigns"): cards that look like save slots with a mini stat strip, month, status badge (Active / Won / Lost), "Continue" button; "New City" as a big "+" card.
- Visual language: rounded 16–24px corners, thick soft shadows, bright but harmonious palette (extend POLITARIA greens and golds with a vivid accent), chunky display font for headings and a readable rounded font for body. Define colours, radii and shadows as CSS variables in `global.css` so the whole UI can be reskinned from one place.

### F. Onboarding
- First time in a city: 4-step coach-mark tour (highlight pill, gauge, build tray, Next Month) with a "Skip" option. Persist "seen" in localStorage.

## 3.4 Deliverables and acceptance criteria

- [ ] No page scroll while playing. HUD overlays the canvas at 360px, 768px and 1440px widths.
- [ ] The only text paragraph the player sees during normal play is an event description.
- [ ] Every API action (build, enact, advance, resolve) has a visible animation or feedback within 100 ms and handles error states (toast with the backend `error` message).
- [ ] Win and lose screens appear on `status` change.
- [ ] Lighthouse accessibility >= 90, all buttons keyboard-focusable and have labels, and `prefers-reduced-motion` disables shakes and confetti.
- [ ] `npm run build` passes; no console errors.

Branch: `aarushi/game-hud`. Suggested order: A (HUD skeleton) → C (juice) → B (events) → D (end screens) → E (restyle) → F (onboarding).

---

# 4. Aryan — Fullscreen 3D experience

**Goal:** the game runs full-viewport, edge to edge, like a native game. The canvas fills the screen, with no header, margins or scrollbars while playing, and the browser Fullscreen API is available on demand.

## 4.1 Tasks

1. **Fullscreen layout (the base requirement)**
   - Make the city route (`/cities/:cityId`) render outside `AppShell`: no site header or footer. Add a route-level layout flag, or a separate `GameLayout`, in `App.jsx`.
   - `.city-canvas` and its wrapper: `position: fixed; inset: 0; width: 100vw; height: 100dvh; overflow: hidden`. Use `dvh` so mobile browser bars do not cut it off. Set `html, body { overflow: hidden }` while the game route is mounted (restore on unmount).
   - R3F `<Canvas>` must resize with the window. Verify no 1px scrollbars and no blurry stretch. Handle `devicePixelRatio` via the existing `dpr={[1, 1.6]}`.
2. **Browser Fullscreen API**
   - A `useFullscreen()` hook (`requestFullscreen` / `exitFullscreen` / `fullscreenchange` listener) and a toggle button exposed to Aarushi's HUD (top-right). Also bind the `F` key; `Esc` exits.
   - Handle the iOS Safari limitation (no element fullscreen): fall back to `100dvh` plus the "Add to Home Screen" meta tags (`apple-mobile-web-app-capable`, `viewport-fit=cover`) and respect safe-area insets (`env(safe-area-inset-*)`).
   - Optional: prompt "Tap to enter fullscreen" on first interaction, because browsers require a user gesture.
3. **Camera and controls for a game feel**
   - Re-tune `OrbitControls` for fullscreen: larger zoom range, smooth damping, and a gentle auto-rotate idle on the main menu / city list background.
   - Touch: one-finger rotate, two-finger pinch zoom and pan; make sure the HUD does not capture canvas gestures outside its own elements (use `pointer-events: none` on the HUD root and `auto` only on interactive pieces).
   - Camera focus-on-select: when a building is tapped, ease the camera toward it. Keep the existing `cityworld:reset-camera` event working.
4. **Performance budget (fullscreen makes it matter)**
   - Target 60 fps on a mid-range laptop at 1080p and >= 30 fps on a recent phone. Measure with `r3f-perf` or `stats.js` (dev only).
   - Levers: cap `dpr`, instance repeated meshes (buildings, trees, cars), disable shadows on low-power devices, `frameloop="demand"` when the world is idle, lazy-load heavy assets (the route already uses `lazy`).
   - Add a simple quality setting (Low / Medium / High) stored in localStorage, passed to `CityWorld`.
5. **World reacts to game state (visible from fullscreen)**
   - Verify `normalizeCity.js` mappings against real data from the backend: new buildings appear within one render, pollution tints the sky, unrest shows effects when approval is low, and traffic scales with population.
   - Add a visible **month change** transition (quick day/night sweep or sun arc) that Aarushi's "Next Month" button can trigger via a window event, like the existing `cityworld:reset-camera` pattern.
   - Add placeholders for win/lose: bright celebratory lighting (win), grey/red desaturated lighting and smoke (lose), driven by `city.status`.
6. **Loading screen**: full-screen branded loader with progress while the lazy chunk and assets load, and no flash of unstyled canvas.

## 4.2 Acceptance criteria

- [ ] Opening a city shows the world edge to edge with no scrollbars at 1280x720, 1920x1080, 390x844 (phone) and a resized window.
- [ ] Fullscreen toggle works via button and `F`; state stays in sync when the user presses `Esc`.
- [ ] 60 fps desktop / 30 fps phone on the default city; documented in a short PERFORMANCE note in the PR.
- [ ] HUD overlay (Aarushi) receives clicks; canvas gestures still work between HUD elements.
- [ ] No memory growth after 20 minutes of play (check the Chrome Performance monitor).

Branch: `aryan/fullscreen-world`. Coordinate with Aarushi on the HUD overlay contract and the fullscreen toggle hook name before either starts.

---

# 5. Ashwera — Verify, validate and finish the game logic (including winning and losing)

**Goal:** the simulation is fair, predictable, fully tested, and has clear, satisfying win and lose conditions with proper end states. Backend lives in `backend/src/` (engine in `engine/`, content in `data/`, API in `controllers/` and `routes/`).

## 5.1 What was verified on 7 Oct 2026 (baseline)

Done: 17 tests (`backend/test/engine.test.js`, `api.test.js`) cover tax and expense maths, stat clamping, every event choice, win/loss detection, 300-month fuzz, auth, ownership, build/policy/advance/resolve flows, and ended-game rejection. Fixed: building past a stat cap caused a 500.

A 300-run simulation of three player types found the real problems:

| Player behaviour | Result | Problem |
|---|---|---|
| Idle (just advance months) | Still alive after 600 months | No pressure, so the game never ends |
| Random choices | Lost 100% (mostly "no confidence", avg 63 months) | Plausible, but harsh and abrupt |
| "Smart" (policies plus random buildings) | Won 96% in ~50 months, all stats pinned at 100 | Far too easy, stats saturate, no tension |

## 5.2 Tasks

### A. Validate and fix the economy and balance
1. Make idle play lose. Currently tax revenue (`pop x 2 x economy% x tax%`) outruns costs. Tune `INCOME_PER_CAPITA`, upkeep and drift so a player who does nothing slowly declines (target: lose by month 40–80 through approval or environment decay).
2. Cap policy stacking / diminishing returns: monthly effects add 1.5 per policy per month with no ceiling, which pins stats at 100. Options: smaller deltas, upkeep scaling with population, or effects that fade as the stat approaches 100.
3. Fix mission quirks: a mission already satisfied when assigned (e.g. `balance_budget` at the starting 50,000 treasury) completes for free; require the condition to be reached *after* assignment or pick only unmet missions. Add mission **rewards** (treasury or approval bonus) and log a `mission` entry (the `type` exists in the schema but is never written).
4. Make `taxRate` player-controllable: add `PATCH /api/cities/:id/tax-rate` (0–40, validated). Higher taxes should raise revenue but reduce approval and economy growth.
5. Constrain population growth to scale with housing/infrastructure/healthcare, not only approval and economy, and fix the divide-by-zero or negative edge cases.
6. Write a **balance simulation script** (`backend/scripts/simulate.js`, based on the one used for the table above) with strategies: idle, random, greedy, "balanced human". Targets: idle loses, random loses >70% but not before month 15, a good strategy wins 30–60% of the time in 60–120 months.

### B. Build the winning and losing logic properly (currently a first pass in `engine/winLoss.js`)
Current: win = population >= 50,000 and economy, healthcare, education, infrastructure, governance >= 70, environment >= 60, approval >= 65, all at once. Lose = treasury < −10,000, approval <= 0, population <= 0, or governance <= 0.

1. **Win condition review:** require the thresholds to hold for **3 consecutive months** (sustained, not a one-month spike) so players cannot win by accident. Track `winStreak` on the city model.
2. **Warnings before losing:** introduce a "danger" state. When a critical stat is below a threshold (approval < 20, treasury < 0, governance < 15), push a warning log entry and a `warnings` array on the city payload so the UI can show alerts. If the stat stays critical for N months (e.g. 3), then the city loses. Add `lossStreaks` to the model.
3. **More loss reasons** with distinct messages: bankruptcy (treasury below −10,000, plus a debt grace period), vote of no confidence (approval <= 0, or < 15 for 3 months), abandonment (population collapse), governance collapse, environmental disaster (environment <= 0 for 3 months), and a **time limit** (e.g. term ends at month 120, evaluated as a score).
4. **Outcome payload:** on `won` or `lost` include `outcome: { result, reason, month, score, stars, failingStat }`. Score = weighted stat average + population bonus + months-efficiency; stars 1–3 by thresholds. Aarushi's end screens consume this.
5. **Terminal state integrity:** once `status !== "active"`, every mutating endpoint (build, enact/revoke policy, tax rate, resolve-event, advance) must return `409`. Today only advance and event-pipeline paths guard it. Add the guard to `loadOwnedCity` consumers for mutations.
6. **Replay:** `POST /api/cities/:id/restart` (or create-new-with-same-name) to reset a lost or won city; keep the old city in history.

### C. Events, event chains and crises (promised in Section 0.1, not built)
1. **Event chains:** add `followUps: [{ eventId, afterMonths, ifChoice }]` to choice definitions. A choice can schedule a future event (e.g. ignoring the outbreak → "Hospital Overload" 2 months later). Store scheduled events on the city (`scheduledEvents`).
2. Expand the catalog from 6 to >= 15 events, including **crises** (`severity: "crisis"`, e.g. fire, flood, strike, scandal) which are more likely when the relevant stat is low.
3. Prevent repetition: do not trigger the same event within N months (cooldown). Add a `seenEvents` log.
4. Allow pending events to **expire** (auto-apply the "default" choice after N months) or force resolution — decide and document.
5. Make the 40% "no event" chance configurable and dependent on difficulty.

### D. Difficulty and starting conditions
- Add `difficulty` (`easy`, `normal`, `hard`) to city creation. It changes the starting treasury, event frequency, upkeep multiplier and win thresholds. Validate in `createCity`.

### E. Tests required (extend `backend/test/`)
- Unit: win after N consecutive months; loss only after grace period; each loss reason; difficulty scaling; event cooldown; chain scheduling and firing; mission reward granted once; mission not instantly complete.
- API: tax-rate endpoint validation (negative, >40, non-numeric); mutations on an ended city → 409; restart endpoint; outcome payload shape.
- Property/fuzz: 1,000 random games, never throws, stats always finite and in range, and every game terminates by month 200.
- Run `npm test` in CI (add a GitHub Actions workflow `backend-tests.yml`).

### F. API contract and docs
- `backend/README.md` documenting every endpoint, request/response example, error codes, the city document shape (`stats`, `warnings`, `outcome`, `scheduledEvents`, `pendingEvents`, `missions`, `log`) and win/lose rules. Aarushi and Aryan build against this.
- Keep `/api/health` and add `/api/version`.
- Input validation on all request bodies (types, ranges); return `400` with a clear `error` string.
- Rate-limit auth routes (`express-rate-limit`) and add `helmet`. Lock CORS to the frontend origin in production.

## 5.3 Acceptance criteria

- [ ] `npm test` is green with the new tests; the balance script prints targets that are met (idle loses, random mostly loses, good play wins sometimes).
- [ ] A full game can be played from API calls alone (curl or test) to `won` and to each `lost` reason, and the `outcome` payload is returned each time.
- [ ] Ended cities reject all mutations with 409.
- [ ] README documents the contract; Aarushi confirms the UI can render every field.

Branch: `ashwera/feat` (current). Suggested order: B.5 (terminal guard) → A (balance) → B (win/lose) → C (events/chains) → D → E/F.

---

# 6. Integration & Release

1. **Order of merges:** Aryan's fullscreen layout lands first (it changes the page structure), then Aarushi's HUD on top, then Ashwera's logic (additive API). Each rebases on `main` after the previous merge.
2. **Integration checklist** (after all three merge): register → create city → build → enact policy → advance months → resolve an event chain → reach a win → reach a loss, all in fullscreen with the HUD. Record a short screen capture.
3. **Definition of done for the MVP:** a stranger can open the site, understand what to do in 10 seconds without reading, play 15 minutes, and either win or lose with a clear reason, on desktop and phone, without any crash.
4. **Environment:** `backend/.env` is never committed (use `.env.example`); MongoDB Atlas network access must include every developer's current IP (or 0.0.0.0/0 for dev); rotate any password that was shared in chat or screenshots.
