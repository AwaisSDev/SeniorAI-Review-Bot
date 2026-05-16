const RULES = [
    // ============ SECRETS ============
    {
        id: "hardcoded_api_key",
        severity: "CRITICAL",
        pattern: /(api_key|apikey|api-key)\s*[=:]\s*["'][^"']{8,}["']/gi,
        message: "Hardcoded API key detected. Use environment variables.",
    },
    {
        id: "hardcoded_password",
        severity: "CRITICAL",
        pattern: /(password|passwd|pwd|pass)\s*[=:]\s*["'][^"']{4,}["']/gi,
        message: "Hardcoded password detected. Never store passwords in code.",
    },
    {
        id: "hardcoded_secret",
        severity: "CRITICAL",
        pattern: /(secret|token|private_key|jwt_secret|auth_token)\s*[=:]\s*["'][^"']{8,}["']/gi,
        message: "Hardcoded secret/token detected. Move to environment variables.",
    },
    {
        id: "github_token",
        severity: "CRITICAL",
        pattern: /ghp_[a-zA-Z0-9]{36}/g,
        message: "GitHub personal access token exposed in code.",
    },
    {
        id: "aws_key",
        severity: "CRITICAL",
        pattern: /AKIA[0-9A-Z]{16}/g,
        message: "AWS access key exposed in code.",
    },
    {
        id: "private_key_block",
        severity: "CRITICAL",
        pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
        message: "Private key block found in code. Remove immediately.",
    },

    // ============ JS UNSAFE ============
    {
        id: "eval_usage",
        severity: "HIGH",
        pattern: /\beval\s*\(/g,
        message: "eval() allows arbitrary code execution. Avoid it.",
    },
    {
        id: "inner_html",
        severity: "HIGH",
        pattern: /\.innerHTML\s*=/g,
        message: "innerHTML risks XSS. Use textContent or sanitize input.",
    },
    {
        id: "document_write",
        severity: "MEDIUM",
        pattern: /document\.write\s*\(/g,
        message: "document.write() is outdated and risks XSS.",
    },
    {
        id: "prototype_pollution",
        severity: "HIGH",
        pattern: /\.__proto__\s*=/g,
        message: "Prototype pollution detected. Dangerous object manipulation.",
    },

    // ============ PHP UNSAFE ============
    {
        id: "php_eval",
        severity: "CRITICAL",
        pattern: /\beval\s*\(\s*(base64_decode|str_rot13|\$_(POST|GET|REQUEST|COOKIE))/g,
        message: "PHP eval() with user input or encoded payload — critical RCE risk.",
    },
    {
        id: "php_system",
        severity: "CRITICAL",
        pattern: /\b(system|exec|shell_exec|passthru|popen)\s*\(\s*\$_(POST|GET|REQUEST|COOKIE)/g,
        message: "PHP command execution with user input — remote code execution risk.",
    },
    {
        id: "php_include_user",
        severity: "CRITICAL",
        pattern: /\b(include|require|include_once|require_once)\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/g,
        message: "PHP file inclusion with user input — local/remote file inclusion risk.",
    },
    {
        id: "php_sql_concat",
        severity: "CRITICAL",
        pattern: /(SELECT|INSERT|UPDATE|DELETE).{0,80}\.\s*\$_(GET|POST|REQUEST|COOKIE)/gi,
        message: "SQL query built with user input — SQL injection risk. Use prepared statements.",
    },
    {
        id: "php_extract",
        severity: "HIGH",
        pattern: /\bextract\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/g,
        message: "extract() with user input allows variable injection attacks.",
    },
    {
        id: "php_preg_replace_e",
        severity: "CRITICAL",
        pattern: /preg_replace\s*\([^,]*\/e[^,]*,/g,
        message: "preg_replace with /e modifier executes code — critical RCE. Use preg_replace_callback instead.",
    },
    {
        id: "php_xss_echo",
        severity: "HIGH",
        pattern: /echo\s+[^;]*\$_(GET|POST|REQUEST|COOKIE)/g,
        message: "Echoing raw user input — XSS risk. Use htmlspecialchars().",
    },
    {
        id: "php_file_user",
        severity: "HIGH",
        pattern: /\b(file_get_contents|fopen|readfile)\s*\([^)]*\$_(GET|POST|COOKIE)/g,
        message: "File operation with user input — path traversal risk.",
    },
    {
        id: "php_display_errors",
        severity: "MEDIUM",
        pattern: /display_errors['"]\s*,\s*['"1]1/g,
        message: "display_errors enabled — exposes stack traces in production.",
    },
    {
        id: "php_hardcoded_db",
        severity: "CRITICAL",
        pattern: /mysqli_connect\s*\([^)]*["'][^"']{4,}["'][^)]*["'][^"']{4,}["']/g,
        message: "Hardcoded database credentials in mysqli_connect call.",
    },

    // ============ PYTHON UNSAFE ============
    {
        id: "python_exec",
        severity: "CRITICAL",
        pattern: /\bexec\s*\(/g,
        message: "exec() executes arbitrary code. Avoid with user input.",
    },
    {
        id: "python_pickle",
        severity: "HIGH",
        pattern: /\bpickle\.loads?\s*\(/g,
        message: "pickle.load() with untrusted data allows RCE. Use JSON instead.",
    },
    {
        id: "python_shell_true",
        severity: "HIGH",
        pattern: /subprocess\.(run|call|Popen).{0,100}shell\s*=\s*True/g,
        message: "subprocess with shell=True and user input risks command injection.",
    },

    // ============ GENERAL ============
    {
        id: "sql_concat_js",
        severity: "CRITICAL",
        pattern: /(SELECT|INSERT|UPDATE|DELETE).{0,50}\+\s*(user|input|req\.|params|query|body)/gi,
        message: "SQL string concatenation — SQL injection risk. Use parameterized queries.",
    },
    {
        id: "cors_wildcard",
        severity: "MEDIUM",
        pattern: /Access-Control-Allow-Origin['":\s]+\*/g,
        message: "CORS wildcard (*) allows any origin to access your API.",
    },
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
        message: "debugger statement left in code.",
    },
    {
        id: "todo_comment",
        severity: "LOW",
        pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/gi,
        message: "Unresolved TODO/FIXME found.",
    },
    // ============ ENTROPY SECRET ============
    {
        id: "high_entropy_secret",
        severity: "HIGH",
        // placeholder pattern – real detection performed in engine
        pattern: /[A-Za-z0-9+/=]{20,}/g,
        message: "Potential high‑entropy secret detected. Verify and remove.",
    },
];

const ENTROPY_THRESHOLD = 3.5;

const SEVERITY_EMOJI = {
    CRITICAL: "🚨",
    HIGH: "⚠️",
    MEDIUM: "🔶",
    LOW: "💡",
};

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// List of file extensions each rule applies to (empty => all)
const EXTENSION_MAP = {
    hardcoded_api_key: ['js', 'php', 'py'],
    hardcoded_password: ['js', 'php', 'py'],
    hardcoded_secret: ['js', 'php', 'py'],
    github_token: ['js', 'php', 'py'],
    aws_key: ['js', 'php', 'py'],
    private_key_block: ['js', 'php', 'py'],
    eval_usage: ['js'],
    inner_html: ['js'],
    document_write: ['js'],
    prototype_pollution: ['js'],
    php_eval: ['php'],
    php_system: ['php'],
    php_include_user: ['php'],
    php_sql_concat: ['php'],
    php_extract: ['php'],
    php_preg_replace_e: ['php'],
    php_xss_echo: ['php'],
    php_file_user: ['php'],
    php_display_errors: ['php'],
    php_hardcoded_db: ['php'],
    python_exec: ['py'],
    python_pickle: ['py'],
    python_shell_true: ['py'],
    sql_concat_js: ['js'],
    cors_wildcard: [],
    console_log: ['js'],
    debugger: [],
    todo_comment: [],
    high_entropy_secret: []
};

// Simple allow‑list of patterns that are usually false positives (e.g., test data)
const ALLOWLIST = [
    /test_key/i,
    /dummy_password/i,
    /example_secret/i,
];

/** Compute Shannon entropy for a string */
function shannonEntropy(data) {
    const len = data.length;
    const frequencies = {};
    for (const char of data) frequencies[char] = (frequencies[char] || 0) + 1;
    return Object.values(frequencies).reduce((sum, count) => {
        const p = count / len;
        return sum - p * Math.log2(p);
    }, 0);
}

/**
 * Parse a unified diff into per‑file hunks with line numbers.
 * Returns a map: filename → array of { lineNumber, text } for added lines.
 */
function parseDiff(diff) {
    const fileMap = {};
    const lines = diff.split('\n');
    let currentFile = null;
    let newLineNum = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fileHeader = line.match(/^diff --git a\/([^ ]+) b\/([^ ]+)/);
        if (fileHeader) {
            currentFile = fileHeader[2];
            fileMap[currentFile] = [];
            continue;
        }
        const hunkHeader = line.match(/^@@ -\d+,\d+ \+(\d+),\d+ @@/);
        if (hunkHeader) {
            newLineNum = parseInt(hunkHeader[1], 10) - 1; // will be incremented before first line
            continue;
        }
        if (!currentFile) continue;
        if (line.startsWith('+') && !line.startsWith('+++')) {
            newLineNum++;
            fileMap[currentFile].push({ lineNumber: newLineNum, text: line.slice(1) });
        } else if (!line.startsWith('-')) {
            newLineNum++;
        }
    }
    return fileMap;
}

function ruleAppliesToFile(ruleId, filename) {
    const exts = EXTENSION_MAP[ruleId];
    if (!exts || exts.length === 0) return true;
    const fileExt = filename.split('.').pop();
    return exts.includes(fileExt);
}

function isAllowlisted(match) {
    return ALLOWLIST.some(re => re.test(match));
}

function runRulesEngine(diff, files) {
    const findings = [];
    const fileDiffMap = parseDiff(diff);

    // First pass – pattern based rules
    for (const rule of RULES) {
        if (rule.id === "high_entropy_secret") continue; // handled later
        // Determine applicable files for this rule
        const applicableFiles = files.filter(f => ruleAppliesToFile(rule.id, f.filename));
        for (const file of applicableFiles) {
            const fileDiff = fileDiffMap[file.filename] || [];
            for (const { lineNumber, text } of fileDiff) {
                if (rule.pattern.test(text) && !isAllowlisted(text)) {
                    findings.push({
                        id: rule.id,
                        severity: rule.severity,
                        message: rule.message,
                        file: file.filename,
                        line: lineNumber,
                        suggestion: rule.suggestion || null,
                        count: 1,
                    });
                }
                // Reset lastIndex for global regexes
                rule.pattern.lastIndex = 0;
            }
        }
    }

    // Second pass – entropy based secret detection
    const entropyMatches = diff.match(/[A-Za-z0-9+/=]{20,}/g) || [];
    for (const candidate of entropyMatches) {
        if (shannonEntropy(candidate) >= ENTROPY_THRESHOLD && !isAllowlisted(candidate)) {
            // Find the file & line where candidate appears (quick scan)
            for (const [filename, lines] of Object.entries(fileDiffMap)) {
                const matchLine = lines.find(l => l.text.includes(candidate));
                if (matchLine) {
                    findings.push({
                        id: "high_entropy_secret",
                        severity: "HIGH",
                        message: `Potential high‑entropy secret detected: "${candidate.slice(0, 12)}…`,
                        file: filename,
                        line: matchLine.lineNumber,
                        suggestion: "Consider moving this value to a secret manager or env var.",
                        count: 1,
                    });
                    break;
                }
            }
        }
    }

    findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    return findings;
}

/**
 * Updated formatter that prints file and line when present.
 */
function formatFindings(findings) {
    if (findings.length === 0) return "✅ **No issues detected by rules engine.**";
    return findings
        .map(f => {
            const location = f.file ? `(${f.file}:${f.line})` : "";
            const suggestion = f.suggestion ? `\n  💡 Suggestion: ${f.suggestion}` : "";
            return `- ${SEVERITY_EMOJI[f.severity]} **[${f.severity}]** ${f.message} ${location}${f.count > 1 ? ` (${f.count}x)` : ""}${suggestion}`;
        })
        .join("\n");
}

/**
 * Updated summary to count per‑severity.
 */
function getRulesSummary(findings) {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    findings.forEach(f => counts[f.severity]++);
    return counts;
}

module.exports = { runRulesEngine, formatFindings, getRulesSummary };
