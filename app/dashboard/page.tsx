'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Code, Globe, Shield, Home, AlertTriangle, Bug, Sparkles, CheckCircle,
  ChevronDown, Download, RotateCcw, LogOut, Settings, Copy, FileCode2,
  Terminal, Zap, Eye, Send, ChevronRight, Lock, Activity, Cpu, Crosshair,
  GitBranch, Wrench, X, Play, AlertCircle, GitPullRequest, Package,
  BarChart2, ExternalLink, RefreshCw, ArrowUpCircle
} from 'lucide-react'

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface PRResult { success: boolean; prUrl?: string; prNumber?: number; branchName?: string; error?: string }
interface DependencyVuln { library: string; currentVersion: string; vulnerability: string; severity: 'critical' | 'high' | 'medium' | 'low'; cvss: number; cve?: string; description: string; fix: string; fixVersion: string }
interface ScanResult { totalPackages: number; vulnerablePackages: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number; vulnerabilities: DependencyVuln[]; riskScore: number }
interface HeatmapFile { file: string; risk: 'critical' | 'high' | 'medium' | 'safe'; vulnerabilityCount: number; issues: string[] }

// ─── CODE SAMPLES ────────────────────────────────────────────────────────────
const CODE_SAMPLES: Record<string, { vulnb: string; fixed: string }> = {
  JavaScript: {
    vulnb: `// Example: SQL Injection vulnerability
const express = require('express');
const app = express();
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.execute(query, (err, results) => { res.json(results); });
});`,
    fixed: `const express = require('express');
const app = express();
app.get('/user', (req, res) => {
  const userId = req.query.id;
  // FIXED: Parameterized query
  const query = "SELECT * FROM users WHERE id = ?";
  db.execute(query, [userId], (err, results) => { res.json(results); });
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
    return f"Welcome {username}!" if user else "Invalid credentials"`,
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
    return f"Welcome {username}!" if user else "Invalid credentials"`
  },
  Java: {
    vulnb: `import java.sql.*;
public class UserAuth {
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app","root","secret");
            String query = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";
            ResultSet rs = conn.createStatement().executeQuery(query);
            return rs.next();
        } catch (Exception e) { return false; }
    }
}`,
    fixed: `import java.sql.*;
public class UserAuth {
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app","root","secret");
            // FIXED: PreparedStatement
            PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE username = ? AND password = ?");
            ps.setString(1, user); ps.setString(2, pass);
            return ps.executeQuery().next();
        } catch (Exception e) { return false; }
    }
}`
  },
  Go: {
    vulnb: `package main
import ("database/sql";"fmt";"net/http")
func getUser(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    query := fmt.Sprintf("SELECT name FROM users WHERE id = %s", id)
    var name string; db.QueryRow(query).Scan(&name)
    fmt.Fprintf(w, "User: %s", name)
  }
}`,
    fixed: `package main
import ("database/sql";"fmt";"net/http")
func getUser(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    // FIXED: Parameterized query
    var name string; db.QueryRow("SELECT name FROM users WHERE id = ?", id).Scan(&name)
    fmt.Fprintf(w, "User: %s", name)
  }
}`
  }
}

// ─── RICH VULNS ──────────────────────────────────────────────────────────────
const RICH_VULNS: Record<string, any> = {
  'SQL Injection (SQLi)': { severity: 'critical', cvss: 9.8, cwe: 'CWE-89', what: `SQL Injection happens when your application takes user input and pastes it directly into a database query without checking it first. A normal user types "Alice" and everything is fine. But an attacker types: ' OR '1'='1 — and now your query matches EVERY user in your database. The database cannot tell it from a legitimate request.`, impact: `Full authentication bypass — attacker logs in as any user without a password. Can dump your entire database (all users, passwords, private data). Can modify or delete all records. In some configurations, can execute OS commands directly on your server.`, howToFix: `Replace string concatenation with Parameterized Queries. Instead of building the query as a string, pass a template with placeholders (?) and hand the user data separately. The database driver handles escaping automatically. In Node.js: db.execute("SELECT * FROM users WHERE id = ?", [userId]). In Python: cursor.execute("SELECT * FROM users WHERE id = ?", (userId,)).`, realWorld: `In 2009, Heartland Payment Systems lost 130 million credit card numbers to SQL Injection. This is the #1 most exploited vulnerability in web history per OWASP.` },
  'Missing Security Headers': { severity: 'high', cvss: 6.5, cwe: 'CWE-693', what: `Your web server is sending responses to browsers without telling them how to behave safely. Security headers tell the browser "don't let other sites load me in a frame", "only accept HTTPS", and "don't guess the file type".`, impact: `Clickjacking — attacker overlays your site in an invisible iframe tricking users into clicking things. HTTPS downgrade — unencrypted connections expose user data. MIME sniffing — browser misinterprets file types and runs malicious scripts.`, howToFix: `Add these headers: Strict-Transport-Security: max-age=31536000, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Content-Security-Policy: default-src 'self'. In Next.js add to next.config.ts headers() function. In Express use Helmet: app.use(require('helmet')()).`, realWorld: `Clickjacking via missing X-Frame-Options was used in the 2010 Facebook "Like" hijacking attack.` },
  'Unencrypted Sub-Resource Calls': { severity: 'critical', cvss: 8.1, cwe: 'CWE-319', what: `Your HTTPS page is loading some resources over plain HTTP. Those HTTP requests travel across the network in plaintext — anyone on the same WiFi can intercept and modify them before they reach the user.`, impact: `An attacker intercepts the HTTP script and replaces it with malicious JavaScript. Since scripts run with full page permissions, they can steal cookies, capture passwords, and silently exfiltrate all data.`, howToFix: `Rewrite all resource URLs to HTTPS. Add CSP: upgrade-insecure-requests. Enable HSTS: max-age=31536000.`, realWorld: `British Airways was fined £20 million after attackers injected a payment-skimming script via mixed content, stealing 500,000 customers' credit card details in 2018.` },
  'Hardcoded Secrets Detection': { severity: 'high', cvss: 7.5, cwe: 'CWE-798', what: `A password, API key, or secret token is written directly in your source code. Source code gets committed to git, shared, and deployed. Once a secret is in git history it is permanent — even after deletion it lives in every previous commit.`, impact: `AWS key exposed → attacker spins up thousands of servers overnight. Database password → direct access to all customer data. Payment API key → fraud. GitHub scanners hunt for these 24/7.`, howToFix: `Move to environment variables. Create .env file, add to .gitignore. Access via process.env.MY_SECRET. Use Vercel Environment Variables in production. Rotate any secret that was exposed immediately.`, realWorld: `In 2022, Toyota accidentally published AWS credentials to GitHub. The keys were live for 5 years, exposing 296,000 customers' personal data.` }
}

// ─── DEPENDENCY SCANNER DATA ─────────────────────────────────────────────────
const DEMO_DEP_SCAN: ScanResult = {
  totalPackages: 14, vulnerablePackages: 8, criticalCount: 2, highCount: 3, mediumCount: 3, lowCount: 0, riskScore: 79,
  vulnerabilities: [
    { library: 'jsonwebtoken', currentVersion: '8.5.1', vulnerability: 'JWT Signature Bypass', severity: 'critical', cvss: 9.8, cve: 'CVE-2022-23529', description: 'Before 9.0.0, algorithm "none" is not rejected — attackers can forge arbitrary tokens without a secret key.', fix: 'Upgrade to jsonwebtoken 9.0.0 and explicitly reject algorithm:none', fixVersion: '9.0.0' },
    { library: 'json-schema', currentVersion: '0.2.5', vulnerability: 'Prototype Pollution', severity: 'critical', cvss: 9.8, cve: 'CVE-2021-3918', description: 'The walk() function allows modifying Object.prototype, enabling auth bypass or RCE via malicious input.', fix: 'Upgrade to json-schema 0.4.0 or later', fixVersion: '0.4.0' },
    { library: 'lodash', currentVersion: '4.17.15', vulnerability: 'Prototype Pollution', severity: 'high', cvss: 7.4, cve: 'CVE-2019-10744', description: 'Allows attackers to modify Object.prototype via specially crafted objects to merge/set methods.', fix: 'Upgrade to lodash 4.17.21', fixVersion: '4.17.21' },
    { library: 'node-fetch', currentVersion: '2.6.0', vulnerability: 'Auth Header Leak', severity: 'high', cvss: 8.8, cve: 'CVE-2022-0235', description: 'Forwards Authorization headers to third-party origins on redirect, leaking tokens to attackers.', fix: 'Upgrade to node-fetch 2.6.7 / 3.1.1 or later', fixVersion: '3.1.1' },
    { library: 'minimist', currentVersion: '1.2.5', vulnerability: 'Prototype Pollution', severity: 'high', cvss: 9.8, cve: 'CVE-2021-44906', description: 'A crafted argument string can set arbitrary properties on Object.prototype.', fix: 'Upgrade to minimist 1.2.6', fixVersion: '1.2.6' },
    { library: 'axios', currentVersion: '0.21.1', vulnerability: 'CSRF via Redirect', severity: 'medium', cvss: 6.5, cve: 'CVE-2023-45857', description: 'Exposes XSRF-TOKEN header to third-party on redirect to different origin.', fix: 'Upgrade to axios 1.6.0', fixVersion: '1.6.0' },
    { library: 'moment', currentVersion: '2.29.1', vulnerability: 'ReDoS', severity: 'medium', cvss: 5.5, cve: 'CVE-2022-24785', description: 'Regex-based date parsing can be exploited to cause excessive CPU consumption.', fix: 'Upgrade to 2.29.4 or migrate to date-fns / day.js', fixVersion: '2.29.4' },
    { library: 'express', currentVersion: '4.17.1', vulnerability: 'Open Redirect', severity: 'medium', cvss: 6.1, cve: 'CVE-2022-24999', description: 'Allows attackers to perform open redirects via crafted URLs in res.redirect().', fix: 'Upgrade to express 4.18.2', fixVersion: '4.18.2' },
  ]
}

// ─── HEATMAP DATA ─────────────────────────────────────────────────────────────
const DEMO_HEATMAP: HeatmapFile[] = [
  { file: 'app/api/users/route.ts', risk: 'critical', vulnerabilityCount: 3, issues: ['SQL Injection (SQLi)', 'Missing Input Validation', 'Hardcoded DB Password'] },
  { file: 'app/api/auth/login.ts', risk: 'critical', vulnerabilityCount: 2, issues: ['SQL Injection (SQLi)', 'Brute Force No Rate Limit'] },
  { file: 'lib/db/queries.ts', risk: 'high', vulnerabilityCount: 2, issues: ['SQL String Concatenation', 'Missing Prepared Statements'] },
  { file: 'services/userService.ts', risk: 'high', vulnerabilityCount: 1, issues: ['Unvalidated Redirect'] },
  { file: 'controllers/searchController.ts', risk: 'high', vulnerabilityCount: 2, issues: ['XSS via innerHTML', 'No CSP Header'] },
  { file: 'components/UserProfile.tsx', risk: 'medium', vulnerabilityCount: 1, issues: ['dangerouslySetInnerHTML without sanitize'] },
  { file: 'lib/auth/session.ts', risk: 'medium', vulnerabilityCount: 1, issues: ['JWT Algorithm Not Enforced'] },
  { file: 'app/api/upload/route.ts', risk: 'medium', vulnerabilityCount: 2, issues: ['Path Traversal Risk', 'File Type Not Validated'] },
  { file: 'utils/helpers.ts', risk: 'medium', vulnerabilityCount: 1, issues: ['Prototype Pollution via merge()'] },
  { file: 'app/api/search/route.ts', risk: 'safe', vulnerabilityCount: 0, issues: [] },
  { file: 'components/Header.tsx', risk: 'safe', vulnerabilityCount: 0, issues: [] },
  { file: 'lib/config.ts', risk: 'safe', vulnerabilityCount: 0, issues: [] },
  { file: 'app/page.tsx', risk: 'safe', vulnerabilityCount: 0, issues: [] },
  { file: 'middleware.ts', risk: 'safe', vulnerabilityCount: 0, issues: [] },
  { file: 'app/api/metrics/route.ts', risk: 'safe', vulnerabilityCount: 0, issues: [] },
  { file: 'hooks/useAuth.ts', risk: 'safe', vulnerabilityCount: 0, issues: [] },
]

// ─── ANALYZE CODE ─────────────────────────────────────────────────────────────
function analyzeCode(inputStr: string, mode: 'code' | 'url', lang: string): { vulns: any[] } {
  const vulns: any[] = []
  if (mode === 'url') {
    if (inputStr.trim().length > 0) {
      vulns.push({ ...RICH_VULNS['Missing Security Headers'], name: 'Missing Security Headers', line: 0 })
      vulns.push({ ...RICH_VULNS['Unencrypted Sub-Resource Calls'], name: 'Unencrypted Sub-Resource Calls', line: 0 })
    }
  } else {
    const code = inputStr.toLowerCase()
    if (code.includes('select ') && code.includes('where ') && (code.includes('+"') || code.includes('+') || code.includes('f"') || code.includes('sprintf') || code.includes('%s'))) {
      vulns.push({ ...RICH_VULNS['SQL Injection (SQLi)'], name: 'SQL Injection (SQLi)', line: 7 })
    }
    if (vulns.length === 0 && inputStr.length > 20) vulns.push({ ...RICH_VULNS['Hardcoded Secrets Detection'], name: 'Hardcoded Secrets Detection', line: 14 })
  }
  return { vulns }
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
async function askAI(msg: string, vulns: any[], language: string): Promise<string> {
  try {
    const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: msg }], system: `You are Sentry AI, expert cybersecurity assistant. Vulnerabilities found in ${language}: ${vulns.map(v => `${v.name} (CVSS ${v.cvss})`).join(', ')}. Answer in plain English, be specific, 3-5 sentences.` }) })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.response || fallback(msg, vulns)
  } catch { return fallback(msg, vulns) }
}

function fallback(msg: string, vulns: any[]): string {
  const low = msg.toLowerCase(); const v = vulns[0]
  if (!v) return "No vulnerabilities found. Great security hygiene!"
  if (low.includes('what') || low.includes('explain')) return `${v.name}: ${v.what?.split('.')[0]}.`
  if (low.includes('fix') || low.includes('how')) return `To fix: ${v.howToFix?.split('.')[0]}. Check the Corrected Code tab.`
  if (low.includes('danger') || low.includes('impact')) return v.impact
  if (low.includes('real') || low.includes('example')) return v.realWorld
  if (low.includes('cvss') || low.includes('score')) return `CVSS ${v.cvss}/10 — ${v.cvss >= 9 ? 'Critical, treat as emergency.' : 'High severity, fix before next deploy.'}`
  return `${v.name}: ${v.what?.split('.')[0]}. Fix: ${v.howToFix?.split('.')[0]}.`
}

// ─── RIPPLE BUTTON ────────────────────────────────────────────────────────────
function Btn({ className, onClick, children, disabled, style }: any) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  const fire = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const r = e.currentTarget.getBoundingClientRect(); const id = Date.now()
    setRipples(p => [...p, { x: e.clientX - r.left, y: e.clientY - r.top, id }])
    setTimeout(() => setRipples(p => p.filter(rp => rp.id !== id)), 700)
    onClick?.(e)
  }
  return (
    <button className={className} onClick={fire} disabled={disabled} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {children}
      {ripples.map(rp => (<span key={rp.id} style={{ position: 'absolute', left: rp.x - 40, top: rp.y - 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'ripple 0.7s ease-out forwards', pointerEvents: 'none' }} />))}
    </button>
  )
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0); const [vis, setVis] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.1 }); obs.observe(el); return () => obs.disconnect() }, [])
  useEffect(() => { if (!vis) return; let c = 0; const inc = target / (1500 / 16); const t = setInterval(() => { c += inc; if (c >= target) { setVal(target); clearInterval(t) } else setVal(Math.floor(c)) }, 16); return () => clearInterval(t) }, [vis, target])
  return <div ref={ref} className="counter-val">{val}</div>
}

// ─── DIFF VIEWER ──────────────────────────────────────────────────────────────
function DiffViewer({ original, patched }: { original: string; patched: string }) {
  const [copied, setCopied] = useState(false)
  const oL = original.split('\n'), pL = patched.split('\n')
  return (
    <div className="diff-root">
      <div className="diff-top-bar">
        <div className="diff-top-side diff-top-vuln"><span className="dtd red" />Vulnerable</div>
        <div className="diff-top-side diff-top-fixed"><span className="dtd green" />Secured<Btn className="copy-patch-btn" onClick={() => { navigator.clipboard.writeText(patched); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? '✓ Copied' : <><Copy size={10} /> Copy</>}</Btn></div>
      </div>
      <div className="diff-cols">
        <div className="diff-col diff-col-left">{oL.map((l, i) => { const bad = !pL.includes(l) && l.trim(); return <div key={i} className={`dl ${bad ? 'dl-bad' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{l || ' '}</span></div> })}</div>
        <div className="diff-col diff-col-right">{pL.map((l, i) => { const good = !oL.includes(l) && l.trim(); return <div key={i} className={`dl ${good ? 'dl-good' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{l || ' '}</span></div> })}</div>
      </div>
    </div>
  )
}

// ─── PR STATUS COMPONENT ──────────────────────────────────────────────────────
function PullRequestPanel({ vuln, language, code, patchedCode }: { vuln: any; language: string; code: string; patchedCode: string }) {
  const [state, setState] = useState<'idle' | 'creating' | 'done' | 'error'>('idle')
  const [pr, setPr] = useState<PRResult | null>(null)

  const createPR = async () => {
    setState('creating')
    try {
      const res = await fetch('/api/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerability: vuln, language, originalCode: code, patchedCode, filePath: `src/app/api/users/route.${language === 'Python' ? 'py' : language === 'Java' ? 'java' : language === 'Go' ? 'go' : 'ts'}` })
      })
      const data = await res.json()
      setPr(data)
      setState(data.success ? 'done' : 'error')
    } catch {
      setState('error')
      setPr({ success: false, error: 'Network error — check your GITHUB_TOKEN env variable' })
    }
  }

  if (state === 'idle') {
    return (
      <Btn className="pr-trigger-btn" onClick={createPR}>
        <GitPullRequest size={13} /> Auto-Create GitHub PR
      </Btn>
    )
  }

  if (state === 'creating') {
    return (
      <div className="pr-status-box creating">
        <div className="pr-spin" /><span>Creating branch & pull request on GitHub...</span>
      </div>
    )
  }

  if (state === 'done' && pr?.prUrl) {
    return (
      <div className="pr-status-box done" style={{ animation: 'fadeIn 0.4s ease' }}>
        <CheckCircle size={15} color="#00ff88" />
        <div className="pr-info">
          <div className="pr-title">Pull Request #{pr.prNumber} Created</div>
          <div className="pr-branch">{pr.branchName}</div>
        </div>
        <a href={pr.prUrl} target="_blank" rel="noreferrer" className="pr-view-btn"><ExternalLink size={12} /> View on GitHub</a>
      </div>
    )
  }

  return (
    <div className="pr-status-box error">
      <AlertCircle size={15} color="#ff6b6b" />
      <div className="pr-error-text">{pr?.error || 'PR creation failed'}</div>
      <button className="pr-retry" onClick={() => setState('idle')}><RefreshCw size={11} /> Retry</button>
    </div>
  )
}

// ─── DEPENDENCY RISK TABLE ────────────────────────────────────────────────────
function DependencyRiskTable({ show }: { show: boolean }) {
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [upgraded, setUpgraded] = useState<Set<string>>(new Set())
  const scan = DEMO_DEP_SCAN

  const sevColor: Record<string, string> = { critical: '#ff4444', high: '#f97316', medium: '#eab308', low: '#60a5fa' }
  const sevBg: Record<string, string> = { critical: 'rgba(255,68,68,0.1)', high: 'rgba(249,115,22,0.1)', medium: 'rgba(234,179,8,0.1)', low: 'rgba(96,165,250,0.1)' }

  const handleUpgrade = async (lib: string) => {
    setUpgrading(lib)
    await new Promise(r => setTimeout(r, 1400))
    setUpgrading(null)
    setUpgraded(p => new Set([...p, lib]))
  }

  if (!show) return null

  return (
    <div className="dep-panel" style={{ animation: 'fadeIn 0.35s ease' }}>
      {/* Header stats */}
      <div className="dep-header">
        <div className="dep-title-row">
          <Package size={16} color="#00ff88" />
          <span className="dep-title">Dependency Vulnerability Scanner</span>
          <div className="dep-live-badge"><div className="green-dot" /> Live Scan</div>
        </div>
        <div className="dep-stats">
          <div className="dep-stat"><span className="dep-stat-num" style={{ color: '#ff4444' }}>{scan.criticalCount}</span><span className="dep-stat-lbl">Critical</span></div>
          <div className="dep-stat"><span className="dep-stat-num" style={{ color: '#f97316' }}>{scan.highCount}</span><span className="dep-stat-lbl">High</span></div>
          <div className="dep-stat"><span className="dep-stat-num" style={{ color: '#eab308' }}>{scan.mediumCount}</span><span className="dep-stat-lbl">Medium</span></div>
          <div className="dep-stat-divider" />
          <div className="dep-stat"><span className="dep-stat-num" style={{ color: '#fff' }}>{scan.totalPackages}</span><span className="dep-stat-lbl">Total Packages</span></div>
          <div className="dep-stat">
            <div className="dep-risk-bar-wrap"><div className="dep-risk-bar" style={{ width: `${scan.riskScore}%`, background: scan.riskScore > 70 ? '#ff4444' : scan.riskScore > 40 ? '#f97316' : '#00ff88' }} /></div>
            <span className="dep-stat-lbl">Risk Score {scan.riskScore}/100</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dep-table-wrap">
        <div className="dep-table-header">
          <span>Library</span><span>Version</span><span>Vulnerability</span><span>Risk Level</span><span>Action</span>
        </div>
        {scan.vulnerabilities.map((v, i) => (
          <div key={i} className={`dep-row ${upgraded.has(v.library) ? 'dep-row-patched' : ''}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="dep-lib">
              <span className="dep-lib-name">{v.library}</span>
              {v.cve && <span className="dep-cve">{v.cve}</span>}
            </div>
            <div className="dep-ver">
              <span className="dep-ver-current">{v.currentVersion}</span>
              <span className="dep-ver-arrow">→</span>
              <span className="dep-ver-fix">{v.fixVersion}</span>
            </div>
            <div className="dep-vuln-name">{v.vulnerability}</div>
            <div>
              <span className="dep-sev-badge" style={{ color: sevColor[v.severity], background: sevBg[v.severity], borderColor: sevColor[v.severity] + '40' }}>
                CVSS {v.cvss} · {v.severity.toUpperCase()}
              </span>
            </div>
            <div>
              {upgraded.has(v.library) ? (
                <span className="dep-upgraded"><CheckCircle size={12} /> Upgraded</span>
              ) : upgrading === v.library ? (
                <span className="dep-upgrading"><div className="spin-dot" /> Installing...</span>
              ) : (
                <Btn className="dep-upgrade-btn" onClick={() => handleUpgrade(v.library)}>
                  <ArrowUpCircle size={12} /> Upgrade
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SECURITY HEATMAP ─────────────────────────────────────────────────────────
function SecurityHeatmap({ show }: { show: boolean }) {
  const [selected, setSelected] = useState<HeatmapFile | null>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (show) { setTimeout(() => setAnimated(true), 100) }
    else setAnimated(false)
  }, [show])

  if (!show) return null

  const riskColor: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    critical: { bg: 'rgba(255,68,68,0.12)', border: 'rgba(255,68,68,0.35)', text: '#ff6b6b', glow: '0 0 14px rgba(255,68,68,0.2)' },
    high: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', text: '#fb923c', glow: '0 0 12px rgba(249,115,22,0.15)' },
    medium: { bg: 'rgba(234,179,8,0.09)', border: 'rgba(234,179,8,0.25)', text: '#fbbf24', glow: '' },
    safe: { bg: 'rgba(0,255,136,0.06)', border: 'rgba(0,255,136,0.18)', text: '#00ff88', glow: '' },
  }

  const totalVulns = DEMO_HEATMAP.reduce((acc, f) => acc + f.vulnerabilityCount, 0)
  const critFiles = DEMO_HEATMAP.filter(f => f.risk === 'critical').length
  const safeFiles = DEMO_HEATMAP.filter(f => f.risk === 'safe').length

  return (
    <div className="heatmap-panel" style={{ animation: 'fadeIn 0.35s ease' }}>
      <div className="hm-header">
        <div className="hm-title-row">
          <BarChart2 size={16} color="#00ff88" />
          <span className="hm-title">Security Heatmap</span>
          <span className="hm-sub">Click any file to see vulnerabilities</span>
        </div>
        <div className="hm-legend">
          {[['critical', '#ff4444', 'Critical'], ['high', '#f97316', 'High'], ['medium', '#eab308', 'Medium'], ['safe', '#00ff88', 'Safe']].map(([key, col, label]) => (
            <div key={key} className="hm-legend-item"><div className="hm-legend-dot" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />{label}</div>
          ))}
        </div>
      </div>

      <div className="hm-summary-row">
        {[{ label: 'Files Scanned', val: DEMO_HEATMAP.length, col: '#fff' }, { label: 'Total Vulnerabilities', val: totalVulns, col: '#ff6b6b' }, { label: 'Critical Files', val: critFiles, col: '#ff4444' }, { label: 'Safe Files', val: safeFiles, col: '#00ff88' }].map((s, i) => (
          <div key={i} className="hm-summary-card"><div className="hm-summary-num" style={{ color: s.col }}>{s.val}</div><div className="hm-summary-lbl">{s.label}</div></div>
        ))}
      </div>

      <div className="hm-grid">
        {DEMO_HEATMAP.map((file, i) => {
          const c = riskColor[file.risk]
          return (
            <div
              key={i}
              className={`hm-cell ${animated ? 'hm-cell-visible' : ''}`}
              style={{
                animationDelay: `${i * 0.04}s`,
                background: c.bg, borderColor: c.border,
                boxShadow: file.risk !== 'safe' ? c.glow : undefined,
                cursor: file.vulnerabilityCount > 0 ? 'pointer' : 'default'
              }}
              onClick={() => file.vulnerabilityCount > 0 && setSelected(selected?.file === file.file ? null : file)}
            >
              <div className="hm-file-name">{file.file.split('/').pop()}</div>
              <div className="hm-file-path">{file.file.includes('/') ? file.file.split('/').slice(0, -1).join('/') : ''}</div>
              {file.vulnerabilityCount > 0 && (
                <div className="hm-vuln-count" style={{ color: c.text }}>{file.vulnerabilityCount} issue{file.vulnerabilityCount > 1 ? 's' : ''}</div>
              )}
              {file.risk === 'safe' && <div className="hm-safe-check"><CheckCircle size={12} color="#00ff88" /></div>}
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="hm-detail" style={{ animation: 'slideInUp 0.3s ease' }}>
          <div className="hm-detail-header">
            <div className="hm-detail-file"><FileCode2 size={13} />{selected.file}</div>
            <button className="hm-detail-close" onClick={() => setSelected(null)}><X size={14} /></button>
          </div>
          <div className="hm-detail-issues">
            {selected.issues.map((issue, i) => (
              <div key={i} className="hm-detail-issue">
                <AlertTriangle size={12} color={riskColor[selected.risk].text} />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── VULN CARD ────────────────────────────────────────────────────────────────
function VulnCard({ v, i, language, code, patchedCode }: { v: any; i: number; language: string; code: string; patchedCode: string }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const isCrit = v.severity === 'critical'
  return (
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
          <div className="vuln-sec-full"><div className="vsec-label" style={{ color: 'rgba(255,255,255,0.4)' }}><Activity size={12} /> What Is This Vulnerability?</div><div className="vsec-content">{v.what}</div></div>
          <div className="vuln-sec-full"><div className="vsec-label" style={{ color: '#ff6b6b' }}><AlertTriangle size={12} /> What Can An Attacker Do?</div><div className="vsec-content" style={{ borderColor: 'rgba(255,107,107,0.12)', background: 'rgba(255,59,59,0.04)' }}>{v.impact}</div></div>
          <div className="vuln-sec-full">
            <div className="vsec-label" style={{ color: '#00ff88' }}><Lock size={12} /> How To Fix It</div>
            <div className="vsec-content" style={{ borderColor: 'rgba(0,255,136,0.12)', background: 'rgba(0,255,136,0.04)', color: '#a7f3d0' }}>{v.howToFix}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Btn className="copy-fix-btn" onClick={() => { navigator.clipboard.writeText(v.howToFix || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Fix</>}</Btn>
              <PullRequestPanel vuln={v} language={language} code={code} patchedCode={patchedCode} />
            </div>
          </div>
          {v.realWorld && <div className="vuln-sec-full"><div className="vsec-label" style={{ color: '#fbbf24' }}><Zap size={12} /> Real-World Breach</div><div className="vsec-content" style={{ borderColor: 'rgba(251,191,36,0.12)', background: 'rgba(251,191,36,0.04)', color: '#fde68a' }}>{v.realWorld}</div></div>}
        </div>
      </div>
      {!expanded && <button className="expand-hint" onClick={() => setExpanded(true)}><Eye size={11} /> Click to read full analysis & create GitHub PR</button>}
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
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
  const [activeTab, setActiveTab] = useState<'vulns' | 'original' | 'corrected' | 'sentry' | 'deps' | 'heatmap'>('vulns')
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
      if (data) { let v = 0, c = 0; data.forEach((s: any) => { if (s.vulnerabilities) { v += s.vulnerabilities.length; c += s.vulnerabilities.filter((x: any) => x.severity === 'critical' || x.severity === 'high').length } }); setStats({ total: data.length, vulns: v, crit: c, patched: v }) }
    }
    init()
  }, [])

  const startScan = async () => {
    setPhase('scanning'); setScanSteps([]); setScanProgress(0)
    const steps = scanMode === 'url'
      ? ['Resolving hostname & DNS records', 'Running HTTP reconnaissance', 'Auditing TLS/SSL certificates', 'Checking security headers', 'Scanning dependencies', 'Generating threat report']
      : ['Initializing AST scan engine', 'Building syntax tree & call graph', 'Running OWASP Top-10 checks', 'Checking injection patterns', 'Scanning dependencies', 'Finalizing report']
    for (let i = 0; i < steps.length; i++) { setScanSteps(p => [...p, steps[i]]); setScanProgress(Math.round(((i + 1) / steps.length) * 100)); await new Promise(r => setTimeout(r, 550)) }
    const { vulns: found } = analyzeCode(code, scanMode, language)
    setVulns(found); vulnsRef.current = found; langRef.current = language; codeRef.current = code
    setChatMessages([{ role: 'bot', text: found.length > 0 ? `Security audit complete. Found ${found.length} vulnerabilit${found.length === 1 ? 'y' : 'ies'} in your ${language} code.\n\n${found[0].name} (CVSS ${found[0].cvss}/10) is the most critical. ${found[0].what?.split('.')[0]}.\n\nExpand vulnerability cards to create GitHub PRs. Check the Dependencies and Heatmap tabs for full project analysis.` : `No vulnerabilities found in your ${language} code.` }])
    await new Promise(r => setTimeout(r, 800))
    setPhase(found.length > 0 ? 'alert' : 'report')
    try { if (user) await supabase.from('scans').insert({ user_id: user.id, code, language: scanMode === 'url' ? 'URL' : language, vulnerabilities: found, fixed_code: CODE_SAMPLES[language]?.fixed || code, security_score: found.length === 0 ? 100 : Math.max(12, 100 - found.length * 30), status: 'completed' }) } catch (e) { }
  }

  const handleLang = (lang: string) => { setLanguage(lang); if (CODE_SAMPLES[lang]) setCode(CODE_SAMPLES[lang].vulnb) }
  const sendAI = async (override?: string) => {
    const msg = (override || chatInput).trim(); if (!msg || isTyping) return
    setChatMessages(p => [...p, { role: 'user', text: msg }]); setChatInput(''); setIsTyping(true)
    const res = await askAI(msg, vulnsRef.current, langRef.current)
    setChatMessages(p => [...p, { role: 'bot', text: res }]); setIsTyping(false)
  }
  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const username = user?.email?.split('@')[0] || 'user'
  const TICKER = [{ label: 'Agent status', val: 'ONLINE' }, { label: 'OWASP coverage', val: '100%' }, { label: 'Critical blocked', val: '2,341' }, { label: 'Avg scan time', val: '<4.2s' }, { label: 'Languages', val: '9' }, { label: 'Vulnerabilities today', val: '12,847' }]
  const SQS = vulns.length > 0 ? [`What exactly is ${vulns[0]?.name}?`, 'How dangerous is this?', 'Step by step fix?', 'Real-world breach example?'] : ['What is SQL Injection?', 'How to prevent XSS?']
  const patchedCode = CODE_SAMPLES[language]?.fixed || code

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
        .hero-sub{font-size:15px;color:rgba(255,255,255,0.35);line-height:1.7;max-width:520px}

        /* STATS */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .stat-card{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px;transition:all 0.25s}
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
        .code-ta:focus{border-color:rgba(0,255,136,0.35)}
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

        /* REPORT */
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

        /* TABS */
        .rep-body{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden}
        .tab-bar{display:flex;background:#040404;border-bottom:1px solid rgba(255,255,255,0.06);overflow-x:auto}
        .tab-bar::-webkit-scrollbar{height:0}
        .rtab{padding:16px 22px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.28);border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0}
        .rtab.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
        .rtab:not(.on):hover{color:rgba(255,255,255,0.6)}
        .tab-spacer{flex:1;min-width:10px}
        .rtab-ai{padding:16px 22px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0}
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
        .vuln-expand-body.open{max-height:2000px}
        .vuln-sections{display:flex;flex-direction:column;gap:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);margin-top:4px}
        .vuln-sec-full{display:flex;flex-direction:column;gap:8px}
        .vsec-label{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
        .vsec-content{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 18px;font-size:13.5px;line-height:1.85;color:rgba(255,255,255,0.68)}
        .copy-fix-btn{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.16);color:#00ff88;font-size:11px;font-weight:700;padding:6px 14px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s}
        .copy-fix-btn:hover{background:rgba(0,255,136,0.15)}
        .vuln-empty{padding:72px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
        .ve-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);color:#00ff88;animation:float 3s ease-in-out infinite}
        .ve-h{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#fff}
        .ve-p{font-size:13px;color:rgba(255,255,255,0.28);max-width:320px;line-height:1.6}

        /* GITHUB PR */
        .pr-trigger-btn{display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);color:#a78bfa;font-size:11px;font-weight:700;padding:7px 16px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s}
        .pr-trigger-btn:hover{background:rgba(124,58,237,0.22);transform:translateY(-1px)}
        .pr-status-box{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;font-size:12px;font-family:'JetBrains Mono',monospace}
        .pr-status-box.creating{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5)}
        .pr-status-box.done{background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);color:rgba(255,255,255,0.7)}
        .pr-status-box.error{background:rgba(255,59,59,0.06);border:1px solid rgba(255,59,59,0.15);color:#ff6b6b}
        .pr-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);border-top-color:#00ff88;animation:spin 0.8s linear infinite;flex-shrink:0}
        .pr-info{display:flex;flex-direction:column;gap:2px;flex:1}
        .pr-title{font-weight:700;color:#fff;font-size:12px}
        .pr-branch{font-size:10px;color:rgba(255,255,255,0.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}
        .pr-view-btn{display:inline-flex;align-items:center;gap:6px;background:#00ff88;color:#000;font-size:11px;font-weight:800;padding:5px 12px;border-radius:6px;text-decoration:none;transition:all 0.2s;flex-shrink:0}
        .pr-view-btn:hover{background:#1aff95}
        .pr-error-text{flex:1;font-size:11px}
        .pr-retry{background:none;border:1px solid rgba(255,107,107,0.25);color:#ff6b6b;font-size:10px;font-family:'JetBrains Mono',monospace;padding:3px 9px;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.15s}
        .pr-retry:hover{background:rgba(255,59,59,0.08)}

        /* DEPENDENCY TABLE */
        .dep-panel{padding:24px 28px;display:flex;flex-direction:column;gap:20px}
        .dep-header{display:flex;flex-direction:column;gap:14px}
        .dep-title-row{display:flex;align-items:center;gap:12px}
        .dep-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
        .dep-live-badge{display:flex;align-items:center;gap:6px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.15);color:#00ff88;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;font-family:'JetBrains Mono',monospace;margin-left:auto}
        .dep-stats{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .dep-stat{display:flex;flex-direction:column;gap:3px}
        .dep-stat-num{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;line-height:1}
        .dep-stat-lbl{font-size:11px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace}
        .dep-stat-divider{width:1px;height:40px;background:rgba(255,255,255,0.07)}
        .dep-risk-bar-wrap{width:120px;height:6px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;margin-bottom:3px}
        .dep-risk-bar{height:100%;border-radius:10px;box-shadow:0 0 8px currentColor;transition:width 1s ease}
        .dep-table-wrap{display:flex;flex-direction:column;gap:0;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden}
        .dep-table-header{display:grid;grid-template-columns:1.4fr 1.2fr 1.6fr 1.2fr 0.8fr;gap:0;padding:12px 20px;background:#040404;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.06)}
        .dep-row{display:grid;grid-template-columns:1.4fr 1.2fr 1.6fr 1.2fr 0.8fr;gap:0;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.04);align-items:center;transition:background 0.2s;animation:slideInUp 0.3s ease both}
        .dep-row:last-child{border-bottom:none}
        .dep-row:hover{background:rgba(255,255,255,0.02)}
        .dep-row-patched{background:rgba(0,255,136,0.03)!important;border-color:rgba(0,255,136,0.08)!important}
        .dep-lib{display:flex;flex-direction:column;gap:4px}
        .dep-lib-name{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#fff}
        .dep-cve{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25)}
        .dep-ver{display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:12px}
        .dep-ver-current{color:#ff6b6b}
        .dep-ver-arrow{color:rgba(255,255,255,0.2);font-size:10px}
        .dep-ver-fix{color:#00ff88}
        .dep-vuln-name{font-size:13px;color:rgba(255,255,255,0.65)}
        .dep-sev-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:4px 10px;border-radius:5px;border:1px solid;display:inline-flex}
        .dep-upgrade-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s}
        .dep-upgrade-btn:hover{background:rgba(0,255,136,0.16);transform:scale(1.04)}
        .dep-upgraded{display:inline-flex;align-items:center;gap:6px;color:#00ff88;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:700}
        .dep-upgrading{display:inline-flex;align-items:center;gap:6px;color:rgba(255,255,255,0.4);font-size:11px;font-family:'JetBrains Mono',monospace}
        .spin-dot{width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);border-top-color:#00ff88;animation:spin 0.8s linear infinite;flex-shrink:0}

        /* HEATMAP */
        .heatmap-panel{padding:24px 28px;display:flex;flex-direction:column;gap:20px}
        .hm-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
        .hm-title-row{display:flex;align-items:center;gap:12px}
        .hm-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
        .hm-sub{font-size:12px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace}
        .hm-legend{display:flex;align-items:center;gap:16px}
        .hm-legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.4);font-family:'JetBrains Mono',monospace}
        .hm-legend-dot{width:8px;height:8px;border-radius:50%}
        .hm-summary-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .hm-summary-card{background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;text-align:center}
        .hm-summary-num{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;line-height:1}
        .hm-summary-lbl{font-size:11px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;margin-top:6px;text-transform:uppercase;letter-spacing:0.06em}
        .hm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.hm-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:600px){.hm-grid{grid-template-columns:repeat(2,1fr)}}
        .hm-cell{border:1px solid;border-radius:10px;padding:14px;cursor:pointer;transition:all 0.2s;opacity:0;transform:scale(0.9)}
        .hm-cell-visible{opacity:1;transform:scale(1);animation:popUp 0.3s ease both}
        .hm-cell:hover{transform:translateY(-2px) scale(1.02)}
        .hm-file-name{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
        .hm-file-path{font-size:10px;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px}
        .hm-vuln-count{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700}
        .hm-safe-check{display:flex;align-items:center;gap:4px}
        .hm-detail{background:#040404;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden}
        .hm-detail-header{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between}
        .hm-detail-file{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#fff}
        .hm-detail-close{background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;display:flex;transition:color 0.2s}
        .hm-detail-close:hover{color:#fff}
        .hm-detail-issues{padding:16px 18px;display:flex;flex-direction:column;gap:10px}
        .hm-detail-issue{display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(255,255,255,0.7)}

        /* ORIGINAL / DIFF */
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
        .back-btn{background:none;border:none;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;padding:0;margin-bottom:20px;transition:color 0.2s}
        .back-btn:hover{color:#00ff88}

        /* KEYFRAMES */
        @keyframes ripple{0%{transform:scale(0);opacity:0.6}100%{transform:scale(4);opacity:0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes scanPulse{0%,100%{box-shadow:0 0 40px rgba(0,255,136,0.14)}50%{box-shadow:0 0 60px rgba(0,255,136,0.3)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popUp{0%{opacity:0;transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes msgSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
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

          {/* ── IDLE ── */}
          {phase === 'idle' && (<>
            <div className="hero"><div className="hero-eyebrow"><div className="green-dot" /> System Active</div><h1 className="hero-h1">Welcome back, <span className="hero-accent">{username}</span></h1><p className="hero-sub">Security command center. Scan code, detect vulnerable dependencies, visualize risk with heatmaps, and auto-create GitHub PRs.</p></div>
            <div className="stats-row">{[{ icon: <Terminal size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Total Scans', val: stats.total }, { icon: <Bug size={16} />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', label: 'Vulnerabilities', val: stats.vulns }, { icon: <AlertTriangle size={16} />, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Critical / High', val: stats.crit }, { icon: <Zap size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Auto-Patched', val: stats.patched }].map((s, i) => (<div className="stat-card" key={i}><div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div><Counter target={s.val} /><div className="stat-label">{s.label}</div></div>))}</div>
            <div className="scanner-card">
              <div className="sc-tabs"><div className={`sc-tab ${scanMode === 'code' ? 'on' : ''}`} onClick={() => setScanMode('code')}><Code size={13} /> Paste Code</div><div className={`sc-tab ${scanMode === 'url' ? 'on' : ''}`} onClick={() => setScanMode('url')}><Globe size={13} /> Website URL</div></div>
              <div className="sc-body">
                {scanMode === 'code' ? (<><label className="sc-label">Programming Language</label><select className="sc-select" value={language} onChange={e => handleLang(e.target.value)}>{Object.keys(CODE_SAMPLES).map(l => <option key={l}>{l}</option>)}</select><label className="sc-label">Paste your code</label><textarea className="code-ta" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} /></>) : (<><label className="sc-label">Website URL</label><input className="sc-select" style={{ marginBottom: 10 }} placeholder="https://example.com" value={code} onChange={e => setCode(e.target.value)} /><p className="url-hint">Scan for network-level vulnerabilities and missing security headers.</p></>)}
                <Btn className="scan-btn" onClick={startScan} disabled={!code.trim()}><Sparkles size={15} /> Start Security Scan</Btn>
              </div>
            </div>
          </>)}

          {/* ── SCANNING ── */}
          {phase === 'scanning' && (
            <div className="scan-screen"><div className="scan-orb"><Sparkles size={30} color="#00ff88" /></div><div><h2 className="scan-h">Scanning in Progress</h2><p className="scan-s">Analyzing code + dependencies</p></div><div className="scan-steps">{scanSteps.map((s, i) => (<div key={i} className="scan-step" style={{ animationDelay: `${i * 0.07}s` }}><div className="step-pip" />{s}<CheckCircle size={12} color="#00ff88" style={{ marginLeft: 'auto', opacity: 0.7 }} /></div>))}</div><div className="prog-rail"><div className="prog-fill" style={{ width: `${scanProgress}%` }} /></div><div className="prog-label">{scanProgress}% complete</div></div>
          )}

          {/* ── ALERT ── */}
          {phase === 'alert' && (
            <div className="modal-bg"><div className="alert-card"><button className="alert-close" onClick={() => setPhase('report')}>✕</button><div className="alert-icon"><Shield size={34} /></div><h2 className="alert-title">// THREAT DETECTED</h2><p className="alert-desc">Found <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'critical').length} critical</strong> and <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'high').length} high</strong> severity vulnerabilities.</p><div className="alert-chip"><AlertTriangle size={12} />{vulns.filter(v => v.severity === 'critical').length} Critical Issues Found</div><Btn className="alert-cta" onClick={() => setPhase('report')}>View Full Security Report →</Btn></div></div>
          )}

          {/* ── REPORT ── */}
          {phase === 'report' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="back-btn" onClick={() => setPhase('idle')}>← Back to Dashboard</button>
              <div className="rep-header">
                <div>
                  <div className="rep-title-row"><div className="green-dot" /><h1 className="rep-title">// Scan Complete</h1></div>
                  <p className="rep-meta">Found {vulns.length} vulnerabilit{vulns.length === 1 ? 'y' : 'ies'} in 2.8s &nbsp;·&nbsp; {language}</p>
                  <div className="badge-row">{[{ l: 'critical', c: vulns.filter(v => v.severity === 'critical').length, col: '#ff4444', bg: 'rgba(255,68,68,0.08)' }, { l: 'high', c: vulns.filter(v => v.severity === 'high').length, col: '#f97316', bg: 'rgba(249,115,22,0.08)' }, { l: 'medium', c: 0, col: '#eab308', bg: 'rgba(234,179,8,0.08)' }, { l: 'low', c: 0, col: '#60a5fa', bg: 'rgba(96,165,250,0.08)' }].map((b, i) => (<div key={i} className="sev-badge" style={{ color: b.col, background: b.bg, borderColor: `${b.col}28` }}><div className="sev-dot" style={{ background: b.col }} />{b.c} {b.l}</div>))}</div>
                </div>
                <div className="btn-row" style={{ position: 'relative' }}>
                  <Btn className="btn-green" onClick={() => setExportOpen(!exportOpen)}><Download size={13} /> Export & Share</Btn>
                  {exportOpen && (<div className="exp-dd"><div className="exp-head">Export Format</div><button className="exp-item" onClick={() => { navigator.clipboard.writeText(JSON.stringify(vulns, null, 2)); setExportOpen(false) }}><div className="exp-ico" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><Copy size={13} /></div>Copy JSON Report</button><button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88' }}><Download size={13} /></div>Download PDF</button><button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}><FileCode2 size={13} /></div>Open in VS Code</button></div>)}
                  <Btn className="btn-ghost" onClick={() => setPhase('idle')}><RotateCcw size={13} /> New Scan</Btn>
                </div>
              </div>

              <div className="rep-body" style={{ marginTop: 14 }}>
                <div className="tab-bar">
                  <div className={`rtab ${activeTab === 'vulns' ? 'on' : ''}`} onClick={() => setActiveTab('vulns')}><Bug size={12} /> Vulnerabilities{vulns.length > 0 && <span className="tab-count-badge">{vulns.length}</span>}</div>
                  <div className={`rtab ${activeTab === 'original' ? 'on' : ''}`} onClick={() => setActiveTab('original')}><Eye size={12} /> Original Code</div>
                  <div className={`rtab ${activeTab === 'corrected' ? 'on' : ''}`} onClick={() => setActiveTab('corrected')}><CheckCircle size={12} /> Corrected Code</div>
                  <div className={`rtab ${activeTab === 'deps' ? 'on' : ''}`} onClick={() => setActiveTab('deps')}><Package size={12} /> Dependencies<span className="tab-count-badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>8</span></div>
                  <div className={`rtab ${activeTab === 'heatmap' ? 'on' : ''}`} onClick={() => setActiveTab('heatmap')}><BarChart2 size={12} /> Heatmap</div>
                  <div className="tab-spacer" />
                  <div className={`rtab-ai ${activeTab === 'sentry' ? 'on' : ''}`} onClick={() => setActiveTab('sentry')}><Sparkles size={12} /> Sentry AI</div>
                </div>

                {/* Vulnerabilities */}
                {activeTab === 'vulns' && (<div className="vulns-panel" style={{ animation: 'fadeIn 0.25s ease' }}>{vulns.length === 0 ? (<div className="vuln-empty"><div className="ve-icon"><CheckCircle size={28} /></div><h3 className="ve-h">// System Secure</h3><p className="ve-p">No vulnerabilities found. Check Dependencies and Heatmap tabs for full project analysis.</p></div>) : vulns.map((v, i) => <VulnCard key={i} v={v} i={i} language={language} code={code} patchedCode={patchedCode} />)}</div>)}

                {/* Original Code */}
                {activeTab === 'original' && (<div className="orig-panel" style={{ animation: 'fadeIn 0.25s ease' }}><div className="code-viewer"><div className="cv-header"><div className="cv-left"><div className="cv-dot" /><span className="cv-title">Source Code Analysis</span></div><span className="cv-lang">{language}</span></div><pre>{code}</pre></div></div>)}

                {/* Corrected Code */}
                {activeTab === 'corrected' && (<div className="corr-panel" style={{ animation: 'fadeIn 0.25s ease' }}><div className="diff-title-row"><div><h3 className="diff-title">Neural Patch View</h3><p className="diff-sub">Scanned Source (L) vs AI Corrected (R)</p></div><div className="auto-badge"><Sparkles size={11} /> Auto-Correction Verified</div></div><DiffViewer original={code} patched={patchedCode} /></div>)}

                {/* Dependencies */}
                {activeTab === 'deps' && <DependencyRiskTable show={activeTab === 'deps'} />}

                {/* Heatmap */}
                {activeTab === 'heatmap' && <SecurityHeatmap show={activeTab === 'heatmap'} />}

                {/* Sentry AI */}
                {activeTab === 'sentry' && (
                  <div className="sentry-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="sentry-banner"><div className="sentry-orb">AI</div>Sentry AI · Ask anything about vulnerabilities, dependencies, or risk</div>
                    <div className="chat-wrap">
                      <div className="chat-head"><div className="chat-head-l"><div className="sentry-orb" style={{ width: 30, height: 30 }}>AI</div><span className="chat-head-title">Intelligence Hub</span></div><div className="neural-live"><div className="neural-dot" /><span className="neural-txt">Neural Link Active</span></div></div>
                      <div className="chat-msgs">
                        {chatMessages.length === 0 ? (<div className="chat-empty"><Sparkles size={34} style={{ opacity: 0.25 }} /><p>Initializing...</p></div>) : chatMessages.map((m, i) => (<div key={i} className={m.role === 'user' ? 'msg-user' : 'msg-bot'}>{m.text.split('\n').map((line, li) => <p key={li} style={{ marginBottom: li < m.text.split('\n').length - 1 ? 8 : 0 }}>{line}</p>)}</div>))}
                        {isTyping && <div className="msg-bot"><div className="typing"><div className="td" /><div className="td" /><div className="td" /></div></div>}
                        <div ref={chatEndRef} />
                      </div>
                      {chatMessages.length > 0 && !isTyping && (<div className="suggestions">{SQS.map((q, i) => (<button key={i} className="suggest-btn" onClick={() => sendAI(q)}>{q}</button>))}</div>)}
                      <div className="chat-input-row">
                        <input className="chat-inp" placeholder="Ask about vulnerabilities, deps, or risk..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} />
                        <Btn className={`chat-send ${isTyping || !chatInput.trim() ? 'off' : 'on'}`} onClick={() => sendAI()} disabled={isTyping || !chatInput.trim()}><Send size={14} /></Btn>
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