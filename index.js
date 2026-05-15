const express = require("express");
const { verifyWebhook } = require("./webhooks/verify");
const { handlePREvent } = require("./bot/handler");

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ status: "Bot is alive 🤖" }));

// GitHub sends all events here
app.post("/webhook", verifyWebhook, async (req, res) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  console.log(`📥 Event received: ${event}`);

  if (event === "pull_request") {
    const action = payload.action;

    // Only review when PR is opened or new commits pushed
    if (action === "opened" || action === "synchronize") {
      console.log(`🔍 PR ${action}: #${payload.pull_request.number}`);
      await handlePREvent(payload);
    }
  }

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot running on port ${PORT}`));
