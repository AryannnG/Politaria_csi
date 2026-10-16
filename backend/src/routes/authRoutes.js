const express = require("express");
const { register, login } = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");
const authRateLimit = require("../middleware/authRateLimit");

const router = express.Router();

router.post("/register", authRateLimit, asyncHandler(register));
router.post("/login", authRateLimit, asyncHandler(login));

module.exports = router;
