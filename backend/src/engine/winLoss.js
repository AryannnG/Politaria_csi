const WIN_THRESHOLDS = {
  population: 50000,
  economy: 70,
  healthcare: 70,
  education: 70,
  infrastructure: 70,
  environment: 60,
  governance: 70,
  approval: 65,
};

function meetsWinThresholds(stats) {
  return Object.entries(WIN_THRESHOLDS).every(([key, min]) => stats[key] >= min);
}

// CHECK WIN / LOSS step of the core game loop.
// Returns the city with `status`/`outcomeReason` set when the game ends,
// otherwise leaves it `active`.
function checkWinLoss(city) {
  const { stats } = city;

  if (stats.treasury < -10000) {
    city.status = "lost";
    city.outcomeReason = "The city went bankrupt.";
    return city;
  }

  if (stats.approval <= 0) {
    city.status = "lost";
    city.outcomeReason = "You were removed from office by a vote of no confidence.";
    return city;
  }

  if (stats.population <= 0) {
    city.status = "lost";
    city.outcomeReason = "The city has been abandoned.";
    return city;
  }

  if (stats.governance <= 0) {
    city.status = "lost";
    city.outcomeReason = "Total governance collapse — the city fell into chaos.";
    return city;
  }

  if (meetsWinThresholds(stats)) {
    city.status = "won";
    city.outcomeReason = "The city has thrived under your leadership.";
    return city;
  }

  return city;
}

module.exports = { checkWinLoss, WIN_THRESHOLDS };
