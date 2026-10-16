function calculateScore(stats, month) {
  const civic = ["economy", "healthcare", "education", "infrastructure", "environment", "governance", "approval"];
  const average = civic.reduce((sum, key) => sum + Number(stats[key] || 0), 0) / civic.length;
  const populationBonus = Math.min(15, Math.max(0, Number(stats.population || 0) / 50000) * 15);
  const termBonus = Math.max(0, 10 - month / 12);
  return Math.round(Math.min(100, average * 0.75 + populationBonus + termBonus));
}

function finish(city, result, reason, failingStat = null) {
  city.status = result;
  city.outcomeReason = reason;
  const score = calculateScore(city.stats, city.month);
  city.outcome = { result, reason, month: city.month, score, stars: score >= 82 ? 3 : score >= 62 ? 2 : 1, failingStat };
  updateWarnings(city);
  city.log.push({ month: city.month, type: "status", message: reason, data: city.outcome });
  return city;
}

function updateWarnings(city) {
  const warnings = [];
  if (city.stats.treasury < 8000) warnings.push("Treasury is low; spending beyond your reserves may end your term.");
  if (city.stats.approval <= 55 && city.stats.approval >= 50) warnings.push("Public approval is close to the 50% confidence threshold.");
  for (const stat of ["healthcare", "education", "infrastructure", "environment", "governance"]) {
    if (city.stats[stat] <= 20) warnings.push(`${stat[0].toUpperCase()}${stat.slice(1)} is in critical condition.`);
  }
  city.warnings = warnings;
}

// Politaria is an open-ended city simulation. There is no victory streak or
// fixed mayoral term; a campaign ends only when the city collapses.
function checkWinLoss(city) {
  if (city.status !== "active") return city;
  const { stats } = city;
  if (stats.population <= 0) return finish(city, "lost", "The city has been abandoned as its population reached zero.", "population");
  if (stats.treasury < 0) return finish(city, "lost", "The city entered debt. You were removed from office.", "treasury");
  if (stats.approval < 50) return finish(city, "lost", "Public approval fell below 50%; you lost the confidence of the majority and were removed as mayor.", "approval");
  if (stats.governance <= 0) return finish(city, "lost", "Total governance collapse — the city fell into chaos.", "governance");
  updateWarnings(city);
  return city;
}

module.exports = { checkWinLoss, calculateScore, updateWarnings };
