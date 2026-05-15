# 🤖 AI PR Reviewer Bot

GitHub bot that automatically reviews pull requests.

## Setup (5 steps)

### 1. Clone & Install
```bash
git clone <your-repo>
cd ai-pr-reviewer-bot
npm install
```

### 2. Get a GitHub Token
- Go to github.com/settings/tokens
- Generate new token (classic)
- Select scopes: `repo`, `pull_requests`
- Copy the token

### 3. Set Environment Variables
```bash
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
```

### 4. Expose your local server (for testing)
```bash
# Install ngrok (free)
npx ngrok http 3000
# Copy the https URL it gives you
```

### 5. Create GitHub Webhook on your repo
- Go to your repo → Settings → Webhooks → Add webhook
- Payload URL: `https://your-ngrok-url/webhook`
- Content type: `application/json`
- Secret: anything (put same value in .env as GITHUB_WEBHOOK_SECRET)
- Events: select "Pull requests"

### Run the bot
```bash
npm run dev
```

Now open a PR on your repo — bot will comment automatically!

## Project Structure
```
├── index.js              # Express server + webhook listener
├── webhooks/
│   └── verify.js         # GitHub signature verification
├── github_app/
│   └── client.js         # GitHub API (post comments, fetch diffs)
├── bot/
│   └── handler.js        # PR event logic
└── .env.example
```

## Week 2: AI Review
Next step is plugging in Gemma/Deepseek to actually analyze the diff.
