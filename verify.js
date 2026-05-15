const crypto = require("crypto");

// GitHub signs every webhook with your secret
// We verify it to make sure the request is actually from GitHub
function verifyWebhook(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("⚠️  No webhook secret set — skipping verification (dev mode)");
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: "No signature provided" });
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  const trusted = Buffer.from(digest);
  const received = Buffer.from(signature);

  // Timing-safe comparison to prevent timing attacks
  if (trusted.length !== received.length || !crypto.timingSafeEqual(trusted, received)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}

module.exports = { verifyWebhook };
