const express = require("express");
const buildings = require("../data/buildings");
const policies = require("../data/policies");
const missions = require("../data/missions");

const router = express.Router();

router.get("/buildings", (req, res) => res.json({ buildings }));
router.get("/policies", (req, res) => res.json({ policies }));
router.get("/missions", (req, res) =>
  res.json({ missions: missions.map(({ id, name, description }) => ({ id, name, description })) })
);

module.exports = router;
