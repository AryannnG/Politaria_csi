const express = require("express");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const {
  createCity,
  listMyCities,
  getCity,
  buildBuilding,
  enactPolicy,
  revokePolicy,
  advanceMonthHandler,
  resolveEventHandler,
} = require("../controllers/cityController");

const router = express.Router();

router.use(requireAuth);

router.post("/", asyncHandler(createCity));
router.get("/", asyncHandler(listMyCities));
router.get("/:cityId", asyncHandler(getCity));

router.post("/:cityId/buildings", asyncHandler(buildBuilding));
router.post("/:cityId/policies", asyncHandler(enactPolicy));
router.delete("/:cityId/policies/:policyId", asyncHandler(revokePolicy));

router.post("/:cityId/advance-month", asyncHandler(advanceMonthHandler));
router.post("/:cityId/resolve-event", asyncHandler(resolveEventHandler));

module.exports = router;
