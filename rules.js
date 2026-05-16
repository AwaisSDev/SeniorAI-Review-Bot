// Rules Engine — deterministic checks before AI runs
// These fire every time, no hallucination, no inconsistency

const RULES = [
    // Hardcoded secrets
    {
        id: "hardcoded_api_key",
        severity: "CRITICAL",
        pattern: /(api_key|apikey|api-key)\s*=\s*["'][^"']{8,}["']/gi,
        message: "Hardcoded API key detected. Use environment variables instead.",
    },
    {
        id: "hardcoded_password",
        severity: "CRITICAL",
        pattern: /(password|passwd|pwd)\s*=\s*["'][^"']{4,}["']/gi,
        message: "Hardcoded password detected. Never store passwords in code.",
    },
    {
        id: "hardcoded_secret",
        severity: "CRITICAL",
        pattern: /(secret|token|private_key)\s*=\s*["'][^"']{8,}["']/gi,
        message: "Hardcoded secret/token detected. Move to environment variables.",
    },

    // Unsafe functions
    {
        id: "eval_usage",
        severity: "HIGH",
        pattern: /\beval\s*\(/g,
        message: "eval() is dangerous — allows arbitrary code execution. Avoid it.",
    },
    {
        id: "exec_usage",
        severity: "HIGH",
        pattern: /\bexec\s*\(/g,
        message: "exec() can be dangerous if user input is involved. Validate carefully.",
    },

    // XSS risks
    {
        id: "inner_html",
        severity: "HIGH",
        pattern: /\.innerHTML\s*=/g,
        message: "innerHTML assignment risks XSS. Use textContent or sanitize input.",
    },
    {
        id: "document_write",
        severity: "MEDIUM",
        pattern: /document\.write\s*\(/g,
        message: "document.write() is outdated and can cause XSS issues.",
    },

    // SQL injection
    {
        id: "sql_concat",
        severity: "CRITICAL",
        pattern: /(SELECT|INSERT|UPDATE|DELETE).{0,50}\+\s*(user|input|req\.|params|query|body)/gi,
        message: "Possible SQL injection — string concatenation in query. Use parameterized queries.",
    },

    // Debug leftovers
    {
        id: "console_log",
        severity: "LOW",
        pattern: /console\.log\s*\(/g,
        message: "console.log() left in code. Remove before production.",
    },
    {
        id: "debugger",
        severity: "MEDIUM",
        pattern: /\bdebugger\b/g,
        message: "debugger statement left in code. Remove before production.",
    },

    // TODO/FIXME
    {
        id: "todo_comment",
        severity: "LOW",
        pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/gi,
        message: "Unresolved TODO/FIXME comment found.",
    },
];

const SEVERITY_EMOJI = {
    CRITICAL: "🚨",
    HIGH: "⚠️",
    MEDIUM: "🔶",
    LOW: "💡",
};

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// Run all rules against the diff
function runRulesEngine(diff, files) {
    const findings = [];

    for (const rule of RULES) {
        // Reset regex state
        rule.pattern.lastIndex = 0;

        const matches = diff.match(rule.pattern);
        if (matches) {
            findings.push({
                id: rule.id,
                severity: rule.severity,
                message: rule.message,
                count: matches.length,
            });
        }
    }

    // Sort by severity
    findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    return findings;
}

// Format findings into markdown
function formatFindings(findings) {
    if (findings.length === 0) {
        return "✅ **No issues detected by rules engine.**";
    }

    const lines = findings.map(f => {
        const emoji = SEVERITY_EMOJI[f.severity];
        const count = f.count > 1 ? ` (${f.count}x)` : "";
        return `- ${emoji} **[${f.severity}]** ${f.message}${count}`;
    });

    return lines.join("\n");
}

// Get summary stats
function getRulesSummary(findings) {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    findings.forEach(f => counts[f.severity]++);
    return counts;
}

module.exports = { runRulesEngine, formatFindings, getRulesSummary };