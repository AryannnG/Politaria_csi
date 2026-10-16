const User = require("../models/User");
const { signToken } = require("../utils/token");

async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email and password are required." });
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return res.status(409).json({ error: "A user with that email or username already exists." });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ username, email, passwordHash });

  const token = signToken(user._id);
  res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user._id);
  res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
}

module.exports = { register, login };
