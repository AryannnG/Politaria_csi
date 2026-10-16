# POLITARIA backend

Express and MongoDB remain the source of truth for player accounts, city state, simulation, construction, missions, crises, and outcomes. The frontend consumes this API; the simulation rules do not run in the browser.

## Run locally

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Set MONGO_URI and a private JWT_SECRET in .env
npm run dev
```

The API listens on port `5002` when `PORT=5002` is set. MongoDB must be available at `MONGO_URI`. Set `FRONTEND_ORIGIN` to the deployed frontend origin in production. Auth endpoints are rate limited; production CORS denies requests unless that origin is configured.

## Endpoints

All city routes require `Authorization: Bearer <token>`. Catalog routes and health/version checks are public.

| Method and path | Purpose |
| --- | --- |
| `POST /api/auth/register` | Create a mayor account |
| `POST /api/auth/login` | Log in |
| `GET /api/health` | Readiness check (`{ "status": "ok" }`) |
| `GET /api/version` | API version |
| `GET /api/catalog/buildings` | Building prices, upkeep and stat effects |
| `GET /api/catalog/policies` | Policy costs and monthly effects |
| `GET /api/catalog/missions` | Mission descriptions, target, deadline length and reward |
| `POST /api/cities` | Create a city (`{ "name": "Northbank", "difficulty": "normal" }`) |
| `GET /api/cities` | List the authenticated mayor's cities |
| `GET /api/cities/:id` | Read a city's saved state |
| `POST /api/cities/:id/buildings` | Build a catalog building (`{ "buildingId": "hospital" }`) |
| `POST /api/cities/:id/policies` | Enact a catalog policy (`{ "policyId": "green_initiative" }`) |
| `DELETE /api/cities/:id/policies/:policyId` | Repeal an active policy |
| `PATCH /api/cities/:id/tax-rate` | Set `taxRate` to a number from 0 through 40 |
| `POST /api/cities/:id/advance-month` | Collect revenue, pay costs, simulate a month and possibly queue a crisis |
| `POST /api/cities/:id/resolve-event` | Resolve a pending crisis (`{ "eventId": "...", "choiceId": "..." }`) |
| `POST /api/cities/:id/restart` | Create a fresh city with the same name/difficulty after a win or loss; the old save remains in history |

Successful city responses contain `{ "city": ... }`; validation errors use HTTP 400, ownership errors 403, missing saves 404, and mutations after a city has ended 409. A pending crisis must be resolved before the next month can advance. It has no automatic timeout.

## City state contract

The city document contains:

- `month`, `difficulty`, `taxRate`, `stats`, `buildings`, and `activePolicies`.
- `missions`: active/completed/failed status, `startedOnMonth`, `deadlineMonth`, `current`, `target`, `progressPercent`, escalation tier, reward snapshot, and `rewardGranted`.
- `pendingEvents`: crisis category, severity, visual type, response labels, and a hidden server-side consequence table.
- `mapEffects`: temporary, persisted visual effects for the 3D world; `seenEvents` enforces an eight-month repeat cooldown; `scheduledEvents` drives follow-up chains.
- `milestoneRewards`: one-time, increasing treasury grants for each ten months survived.
- `warnings`, `status`, `outcomeReason`, `outcome`, and `log`.

The campaign is endless while the city remains viable; bankruptcy, majority approval loss, population loss, or total governance collapse end the term. Missions are assigned only while their goal is unmet, and their challenge tier rises over time. Their final month is still eligible for completion. On success, rewards are applied once and may include treasury, stat gains, or a free building. Missing a deadline harms treasury and approval. Easy/normal/hard starts with ₹70,000/₹50,000/₹35,000, changes monthly upkeep and changes crisis frequency/deadlines.

Crises are selected from 108 unique scenarios across health, weather, conflict, safety, infrastructure, diplomacy, protest, education, culture, film, economy and environment. Low related sector scores make matching events more likely. Choices can schedule follow-up incidents. Resolved effects remain visible on the map for several months.

The mayor loses immediately if treasury goes below zero, approval drops below 50%, population reaches zero, or governance collapses. The city wins after all development thresholds hold for three consecutive months. A 120-month term limit ends unresolved cities. Outcomes contain result, reason, month, score, stars and the failing stat when applicable.

## Validation

```powershell
npm test
```

The engine suite checks event volume, map effects, cooldowns, follow-up events, mission rewards and deadlines, win/loss thresholds and 1,000 randomized games. The API suite uses `mongodb-memory-server` for auth, ownership, city creation, tax-rate validation, build/policy flows, ended-city guards and replay.
