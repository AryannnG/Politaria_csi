const missionCatalog = require("../data/missions");

const MAX_ACTIVE_MISSIONS = 2;

function assignNewMissions(city) {
  const takenIds = new Set(city.missions.map((m) => m.missionId));
  const activeCount = city.missions.filter((m) => m.status === "active").length;

  const available = missionCatalog.filter((def) => !takenIds.has(def.id));

  let slotsToFill = MAX_ACTIVE_MISSIONS - activeCount;
  while (slotsToFill > 0 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    const def = available.splice(index, 1)[0];
    city.missions.push({
      missionId: def.id,
      status: "active",
      startedOnMonth: city.month,
      completedOnMonth: null,
    });
    slotsToFill -= 1;
  }
}

// UPDATE MISSIONS step of the core game loop.
function updateMissions(city) {
  for (const progress of city.missions) {
    if (progress.status !== "active") continue;

    const def = missionCatalog.find((m) => m.id === progress.missionId);
    if (!def) continue;

    if (def.check(city)) {
      progress.status = "completed";
      progress.completedOnMonth = city.month;
      continue;
    }

    if (def.expiresAfterMonths && city.month - progress.startedOnMonth > def.expiresAfterMonths) {
      progress.status = "failed";
    }
  }

  assignNewMissions(city);
}

module.exports = { updateMissions };
