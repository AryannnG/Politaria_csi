const City = require("../models/City");
const User = require("../models/User");
const buildings = require("../data/buildings");
const policies = require("../data/policies");
const { applyEffects } = require("../engine/statUtils");
const { advanceMonth, applyPlayerChoice } = require("../engine/turnEngine");
const { updateMissions, assignNewMissions } = require("../engine/missions");
const { checkWinLoss } = require("../engine/winLoss");

async function loadOwnedCity(req, res, { mutation = false } = {}) {
  const city = await City.findById(req.params.cityId);
  if (!city) {
    res.status(404).json({ error: "City not found." });
    return null;
  }
  if (String(city.mayor) !== req.userId) {
    res.status(403).json({ error: "You are not the mayor of this city." });
    return null;
  }
  // Campaigns that were marked "won" by the former three-month streak rule
  // are migrated back into play so existing saves can continue indefinitely.
  if (city.status === "won") {
    city.status = "active";
    city.outcomeReason = null;
    city.outcome = null;
    city.log.push({ month: city.month, type: "status", message: "The city has no fixed term. Your open-ended mayoral campaign continues.", data: { resumedFromFormerVictory: true } });
    await city.save();
  }
  if (mutation && city.status !== "active") {
    res.status(409).json({ error: "This city's game has ended." });
    return null;
  }
  return city;
}

async function createCity(req, res) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const difficulty = req.body?.difficulty ?? "normal";
  if (!name) return res.status(400).json({ error: "name is required." });
  if (name.length > 60) return res.status(400).json({ error: "City names must be 60 characters or fewer." });
  if (!["easy", "normal", "hard"].includes(difficulty)) return res.status(400).json({ error: "difficulty must be easy, normal, or hard." });

  const treasury = difficulty === "easy" ? 70000 : difficulty === "hard" ? 35000 : 50000;
  const city = await City.create({ name, mayor: req.userId, difficulty, stats: { treasury, approval: 50 } });
  assignNewMissions(city);
  await city.save();
  await User.findByIdAndUpdate(req.userId, { $push: { cities: city._id } });
  res.status(201).json({ city });
}

async function listMyCities(req, res) {
  const allCities = await City.find({ mayor: req.userId });
  const formerWinners = allCities.filter((city) => city.status === "won");
  await Promise.all(formerWinners.map(async (city) => {
    city.status = "active";
    city.outcomeReason = null;
    city.outcome = null;
    city.log.push({ month: city.month, type: "status", message: "The city has no fixed term. Your open-ended mayoral campaign continues.", data: { resumedFromFormerVictory: true } });
    await city.save();
  }));
  const cities = await City.find({ mayor: req.userId }).select("name month status difficulty outcome stats.population stats.treasury stats.approval");
  res.json({ cities });
}

async function deleteCity(req, res) {
  const city = await City.findById(req.params.cityId);
  if (!city) return res.status(404).json({ error: "City not found." });
  if (String(city.mayor) !== req.userId) return res.status(403).json({ error: "You are not the mayor of this city." });
  await City.deleteOne({ _id: city._id, mayor: req.userId });
  await User.findByIdAndUpdate(req.userId, { $pull: { cities: city._id } });
  res.json({ deleted: true, cityId: String(city._id) });
}

async function getCity(req, res) {
  const city = await loadOwnedCity(req, res);
  if (!city) return;
  res.json({ city });
}

async function buildBuilding(req, res) {
  const city = await loadOwnedCity(req, res, { mutation: true });
  if (!city) return;
  const { buildingId } = req.body || {};
  const def = buildings.find((building) => building.id === buildingId);
  if (!def) return res.status(400).json({ error: `Unknown building: ${buildingId}` });
  if (city.stats.treasury < def.cost) return res.status(400).json({ error: "Insufficient treasury for this building." });

  city.stats.treasury -= def.cost;
  city.buildings.push({ buildingId: def.id, builtOnMonth: city.month, constructionEndsOnMonth: city.month + 1, level: 1 });
  applyEffects(city.stats, def.effects);
  city.log.push({ month: city.month, type: "decision", message: `Built ${def.name}.`, data: { buildingId: def.id, cost: def.cost } });
  updateMissions(city);
  checkWinLoss(city);
  await city.save();
  res.json({ city });
}

async function enactPolicy(req, res) {
  const city = await loadOwnedCity(req, res, { mutation: true });
  if (!city) return;
  const { policyId } = req.body || {};
  const def = policies.find((policy) => policy.id === policyId);
  if (!def) return res.status(400).json({ error: `Unknown policy: ${policyId}` });
  if (city.activePolicies.some((policy) => policy.policyId === policyId)) return res.status(409).json({ error: "This policy is already active." });

  city.activePolicies.push({ policyId: def.id, enactedOnMonth: city.month });
  if (def.taxRateModifier) city.taxRate = Math.max(0, Math.min(40, city.taxRate + def.taxRateModifier));
  city.log.push({ month: city.month, type: "decision", message: `Enacted policy: ${def.name}.`, data: { policyId: def.id } });
  updateMissions(city);
  checkWinLoss(city);
  await city.save();
  res.json({ city });
}

async function revokePolicy(req, res) {
  const city = await loadOwnedCity(req, res, { mutation: true });
  if (!city) return;
  const { policyId } = req.params;
  const def = policies.find((policy) => policy.id === policyId);
  const wasActive = city.activePolicies.some((policy) => policy.policyId === policyId);
  if (!wasActive) return res.status(404).json({ error: "This policy is not active." });

  city.activePolicies = city.activePolicies.filter((policy) => policy.policyId !== policyId);
  if (def?.taxRateModifier) city.taxRate = Math.max(0, Math.min(40, city.taxRate - def.taxRateModifier));
  city.log.push({ month: city.month, type: "decision", message: `Revoked policy: ${def ? def.name : policyId}.`, data: { policyId } });
  await city.save();
  res.json({ city });
}

async function updateTaxRate(req, res) {
  const city = await loadOwnedCity(req, res, { mutation: true });
  if (!city) return;
  const rate = req.body?.taxRate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 40) {
    return res.status(400).json({ error: "taxRate must be a number between 0 and 40." });
  }
  city.taxRate = rate;
  city.log.push({ month: city.month, type: "decision", message: `Set the city tax rate to ${rate}%.`, data: { taxRate: rate } });
  await city.save();
  res.json({ city });
}

async function advanceMonthHandler(req, res) {
  const city = await loadOwnedCity(req, res, { mutation: true });
  if (!city) return;
  try { advanceMonth(city); } catch (err) { return res.status(409).json({ error: err.message }); }
  await city.save();
  res.json({ city });
}

async function resolveEventHandler(req, res) {
  const city = await loadOwnedCity(req, res, { mutation: true });
  if (!city) return;
  const { eventId, choiceId } = req.body || {};
  const pending = city.pendingEvents.find((event) => event.eventId === eventId);
  if (!pending) return res.status(404).json({ error: "No such pending event on this city." });
  try { applyPlayerChoice(city, eventId, choiceId); } catch (err) { return res.status(400).json({ error: err.message }); }
  await city.save();
  res.json({ city });
}

async function restartCity(req, res) {
  const oldCity = await loadOwnedCity(req, res);
  if (!oldCity) return;
  if (oldCity.status === "active") return res.status(409).json({ error: "Only a finished city can be restarted." });
  const difficulty = oldCity.difficulty || "normal";
  const treasury = difficulty === "easy" ? 70000 : difficulty === "hard" ? 35000 : 50000;
  const city = await City.create({ name: oldCity.name, mayor: req.userId, difficulty, stats: { treasury, approval: 50 } });
  assignNewMissions(city);
  await city.save();
  await User.findByIdAndUpdate(req.userId, { $push: { cities: city._id } });
  res.status(201).json({ city });
}

module.exports = { createCity, listMyCities, getCity, deleteCity, buildBuilding, enactPolicy, revokePolicy, updateTaxRate, advanceMonthHandler, resolveEventHandler, restartCity };
