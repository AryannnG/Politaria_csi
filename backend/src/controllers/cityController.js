const City = require("../models/City");
const User = require("../models/User");
const buildings = require("../data/buildings");
const policies = require("../data/policies");
const { advanceMonth, applyPlayerChoice } = require("../engine/turnEngine");

async function loadOwnedCity(req, res) {
  const city = await City.findById(req.params.cityId);
  if (!city) {
    res.status(404).json({ error: "City not found." });
    return null;
  }
  if (String(city.mayor) !== req.userId) {
    res.status(403).json({ error: "You are not the mayor of this city." });
    return null;
  }
  return city;
}

async function createCity(req, res) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required." });
  }

  const city = await City.create({ name, mayor: req.userId });
  await User.findByIdAndUpdate(req.userId, { $push: { cities: city._id } });

  res.status(201).json({ city });
}

async function listMyCities(req, res) {
  const cities = await City.find({ mayor: req.userId }).select(
    "name month status stats.population stats.treasury stats.approval"
  );
  res.json({ cities });
}

async function getCity(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;
  res.json({ city });
}

// MAKE POLICY / BUILDING DECISION step: construction.
async function buildBuilding(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;

  const { buildingId } = req.body;
  const def = buildings.find((b) => b.id === buildingId);
  if (!def) {
    return res.status(400).json({ error: `Unknown building: ${buildingId}` });
  }
  if (city.stats.treasury < def.cost) {
    return res.status(400).json({ error: "Insufficient treasury for this building." });
  }

  city.stats.treasury -= def.cost;
  city.buildings.push({ buildingId: def.id, builtOnMonth: city.month });

  for (const [key, delta] of Object.entries(def.effects)) {
    if (key in city.stats) city.stats[key] += delta;
  }

  city.log.push({
    month: city.month,
    type: "decision",
    message: `Built ${def.name}.`,
    data: { buildingId: def.id, cost: def.cost },
  });

  await city.save();
  res.json({ city });
}

// MAKE POLICY / BUILDING DECISION step: policy enactment.
async function enactPolicy(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;

  const { policyId } = req.body;
  const def = policies.find((p) => p.id === policyId);
  if (!def) {
    return res.status(400).json({ error: `Unknown policy: ${policyId}` });
  }
  if (city.activePolicies.some((p) => p.policyId === policyId)) {
    return res.status(409).json({ error: "This policy is already active." });
  }

  city.activePolicies.push({ policyId: def.id, enactedOnMonth: city.month });
  if (def.taxRateModifier) {
    city.taxRate = Math.max(0, Math.min(40, city.taxRate + def.taxRateModifier));
  }

  city.log.push({
    month: city.month,
    type: "decision",
    message: `Enacted policy: ${def.name}.`,
    data: { policyId: def.id },
  });

  await city.save();
  res.json({ city });
}

async function revokePolicy(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;

  const { policyId } = req.params;
  const def = policies.find((p) => p.id === policyId);
  const wasActive = city.activePolicies.some((p) => p.policyId === policyId);
  if (!wasActive) {
    return res.status(404).json({ error: "This policy is not active." });
  }

  city.activePolicies = city.activePolicies.filter((p) => p.policyId !== policyId);
  if (def && def.taxRateModifier) {
    city.taxRate = Math.max(0, Math.min(40, city.taxRate - def.taxRateModifier));
  }

  city.log.push({
    month: city.month,
    type: "decision",
    message: `Revoked policy: ${def ? def.name : policyId}.`,
    data: { policyId },
  });

  await city.save();
  res.json({ city });
}

async function advanceMonthHandler(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;

  try {
    advanceMonth(city);
  } catch (err) {
    return res.status(409).json({ error: err.message });
  }

  await city.save();
  res.json({ city });
}

async function resolveEventHandler(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;

  const { eventId, choiceId } = req.body;
  const pending = city.pendingEvents.find((e) => e.eventId === eventId);
  if (!pending) {
    return res.status(404).json({ error: "No such pending event on this city." });
  }

  try {
    applyPlayerChoice(city, eventId, choiceId);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  await city.save();
  res.json({ city });
}

module.exports = {
  createCity,
  listMyCities,
  getCity,
  buildBuilding,
  enactPolicy,
  revokePolicy,
  advanceMonthHandler,
  resolveEventHandler,
};
