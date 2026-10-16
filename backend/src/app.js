const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const cityRoutes = require("./routes/cityRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const securityHeaders = require("./middleware/securityHeaders");

const app = express();
app.use(securityHeaders);
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const corsOptions = frontendOrigin ? { origin: frontendOrigin } : process.env.NODE_ENV === "production" ? { origin: false } : undefined;
app.use(cors(corsOptions));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/version", (req, res) => res.json({ version: "1.0.0" }));
app.use("/api/auth", authRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/catalog", catalogRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

module.exports = app;
