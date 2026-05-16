const { postPRComment, getPRFiles, getPRDiff } = require("./client");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function handlePREvent(payload) {
  const { pull_request, repository } = payload;

  const owner = repository.owner.login;
  const repo = repository.name;
  const prNumber = pull_request.number;
  const prTitle = pull_request.title;
  const prAuthor = pull_request.user.login;

  try {
    // Get files and diff
    const files = await getPRFiles(owner, repo, prNumber);
    const diff = await getPRDiff(owner, repo, prNumber);

    // Filter out noise (lock files, binaries)
    const relevantFiles = files.filter(f =>
      !f.filename.includes("lock") &&
      !f.filename.includes(".png") &&
      !f.filename.includes(".jpg") &&
      !f.filename.includes(".svg")
    );

    const fileList = relevantFiles
      .map(f => `- \`${f.filename}\` (+${f.additions} / -${f.deletions})`)
      .join("\n");

    // Post initial comment immediately
    const initialComment = buildInitialComment(prAuthor, prTitle, relevantFiles, fileList);
    await postPRComment(owner, repo, prNumber, initialComment);

    // Get AI review
    const aiReview = await getAIReview(prTitle, relevantFiles, diff);

    // Post AI review as follow-up comment
    await postPRComment(owner, repo, prNumber, aiReview);

  } catch (err) {
    console.error("❌ Error handling PR event:", err.message);
  }
}

async function getAIReview(prTitle, files, diff) {
  const fileNames = files.map(f => f.filename).join(", ");

  // Truncate diff if too long
  const truncatedDiff = diff.length > 6000 ? diff.substring(0, 6000) + "\n... (diff truncated)" : diff;

  const prompt = `You are a senior software engineer reviewing a pull request. Be direct, specific, and helpful.

PR Title: "${prTitle}"
Files changed: ${fileNames}

Code diff:
\`\`\`
${truncatedDiff}
\`\`\`

Review this code and provide:
1. Any bugs or errors you see
2. Security issues (hardcoded secrets, unsafe functions, injection risks)
3. Code quality improvements
4. What was done well

Be concise. Use emojis for visual clarity. Give an overall score out of 10.
Format your response in markdown.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const reviewText = response.choices[0].message.content;

  return `## 🧠 AI Code Review\n\n${reviewText}\n\n---\n> *Reviewed by SeniorAI Review Bot*`;
}

function buildInitialComment(author, prTitle, files, fileList) {
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return `## 🤖 AI PR Reviewer

Hey @${author}! Reviewing **"${prTitle}"** now...

### 📂 Files Changed (${files.length})
${fileList}

### 📊 Stats
| | Count |
|---|---|
| Lines added | +${totalAdditions} |
| Lines removed | -${totalDeletions} |
| Files touched | ${files.length} |

⏳ *AI review posting now...*`;
}

module.exports = { handlePREvent };