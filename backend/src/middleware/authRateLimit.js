const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 20;
const requests = new Map();

module.exports = function authRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  let bucket = requests.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) bucket = { startedAt: now, count: 0 };
  bucket.count += 1;
  requests.set(key, bucket);
  if (requests.size > 5000) {
    for (const [ip, entry] of requests) if (now - entry.startedAt >= WINDOW_MS) requests.delete(ip);
  }
  res.setHeader("RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("RateLimit-Remaining", Math.max(0, MAX_REQUESTS - bucket.count));
  if (bucket.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", Math.ceil((WINDOW_MS - (now - bucket.startedAt)) / 1000));
    return res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
  }
  return next();
};
