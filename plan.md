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

- Population
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