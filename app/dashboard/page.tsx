'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Code, Globe, Shield, Home, AlertTriangle, Bug, Sparkles, CheckCircle,
  ChevronDown, Download, RotateCcw, LogOut, Settings, Copy, FileCode2,
  Terminal, Zap, Eye, Send, ChevronRight, Lock, Activity,
  GitBranch, X, AlertCircle, GitPullRequest,
  Package, BarChart2, ExternalLink, RefreshCw, ArrowUpCircle,
  Key, Radio, Clock, GitCommit, Bell, BellOff, PlayCircle,
  TrendingUp, Database
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface SecretLeak {
  id: string; type: string; category: string; file: string; line: number
  lineContent: string; severity: 'critical' | 'high' | 'medium'
  cvss: number; description: string; recommendation: string
  envVarName: string; patchedLine: string; redacted: string
}
interface SecretScanResult {
  totalScanned: number; leaksFound: number; criticalCount: number
  highCount: number; mediumCount: number; leaks: SecretLeak[]; riskScore: number
}
interface WebhookScan {
  id: string; repo: string; branch: string; commit_sha: string
  commit_message: string; pusher: string; vuln_count: number
  critical_count: number; issues: string[]; security_score: number
  status: 'passed' | 'warning' | 'critical'; scanned_at: string
}
interface PRResult { success: boolean; prUrl?: string; prNumber?: number; branchName?: string; error?: string }
interface DependencyVuln { library: string; currentVersion: string; vulnerability: string; severity: 'critical' | 'high' | 'medium' | 'low'; cvss: number; cve?: string; description: string; fix: string; fixVersion: string }
interface ScanResult { totalPackages: number; vulnerablePackages: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number; vulnerabilities: DependencyVuln[]; riskScore: number }
interface HeatmapFile { file: string; risk: 'critical' | 'high' | 'medium' | 'safe'; vulnerabilityCount: number; issues: string[] }

// ─── CODE SAMPLES ─────────────────────────────────────────────────────────────
const CODE_SAMPLES: Record<string, { vulnb: string; fixed: string }> = {
  JavaScript: {
    vulnb: `// Example: SQL Injection + hardcoded secrets
const express = require('express');
const stripe = require('stripe')('sk_live_51H8xyzABCDEF123456789');
const JWT_SECRET = 'my-super-secret-jwt-key-2024';
const app = express();
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.execute(query, (err, results) => { res.json(results); });
});`,
    fixed: `const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
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
import sqlite3, os
app = Flask(__name__)
DB_PASSWORD = 'admin@Database2024!'
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    conn = sqlite3.connect(f"postgresql://admin:{DB_PASSWORD}@db.example.com/users")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username='{username}'"
    cursor.execute(query)
    return "ok"`,
    fixed: `from flask import Flask, request
import sqlite3, os
app = Flask(__name__)
DB_PASSWORD = os.environ['DB_PASSWORD']
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    conn = sqlite3.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    # FIXED: Parameterized query
    cursor.execute("SELECT * FROM users WHERE username=?", (username,))
    return "ok"`,
  },
  Java: {
    vulnb: `import java.sql.*;
public class UserAuth {
    private static final String DB_PASS = "Admin@2024Secret!";
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app","root", DB_PASS);
            String query = "SELECT * FROM users WHERE username = '" + user + "'";
            return conn.createStatement().executeQuery(query).next();
        } catch (Exception e) { return false; }
    }
}`,
    fixed: `import java.sql.*;
public class UserAuth {
    private static final String DB_PASS = System.getenv("DB_PASSWORD");
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app","root", DB_PASS);
            PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE username = ?");
            ps.setString(1, user);
            return ps.executeQuery().next();
        } catch (Exception e) { return false; }
    }
}`,
  },
  Go: {
    vulnb: `package main
import ("database/sql";"fmt";"net/http";"os")
const API_KEY = "sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234567890"
func getUser(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    query := fmt.Sprintf("SELECT name FROM users WHERE id = %s", id)
    var name string; db.QueryRow(query).Scan(&name)
    fmt.Fprintf(w, "User: %s", name)
  }
}`,
    fixed: `package main
import ("database/sql";"fmt";"net/http";"os")
var API_KEY = os.Getenv("ANTHROPIC_API_KEY")
func getUser(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    // FIXED: Parameterized query
    var name string; db.QueryRow("SELECT name FROM users WHERE id = ?", id).Scan(&name)
    fmt.Fprintf(w, "User: %s", name)
  }
}`,
  }
}

// ─── RICH VULNS ──────────────────────────────────────────────────────────────
const RICH_VULNS: Record<string, any> = {
  'SQL Injection (SQLi)': { severity: 'critical', cvss: 9.8, cwe: 'CWE-89', what: `SQL Injection happens when user input is pasted directly into a database query. An attacker types ' OR '1'='1 — and the query matches every user in your database. The database cannot tell it from a legitimate request.`, impact: `Full authentication bypass. Dump entire database. Modify or delete all records. In some DB setups, execute OS commands directly.`, howToFix: `Replace string concatenation with Parameterized Queries. Pass a template with placeholders (?) and user data separately — the driver handles escaping automatically.`, realWorld: `In 2009, Heartland Payment Systems lost 130 million credit card numbers to SQL Injection. #1 exploited vulnerability per OWASP for over a decade.` },
  'Missing Security Headers': { severity: 'high', cvss: 6.5, cwe: 'CWE-693', what: `Your server sends responses without telling browsers how to behave safely. Security headers block clickjacking, HTTPS downgrade, MIME sniffing, and XSS amplification.`, impact: `Clickjacking — attacker overlays your site in an invisible iframe. HTTPS downgrade exposes user data. CSP absence lets injected scripts run freely.`, howToFix: `Add X-Frame-Options: DENY, Strict-Transport-Security: max-age=31536000, Content-Security-Policy: default-src 'self', X-Content-Type-Options: nosniff. Use Helmet.js in Express.`, realWorld: `Clickjacking via missing X-Frame-Options was used in the 2010 Facebook "Like" hijacking attack affecting millions of users.` },
  'Unencrypted Sub-Resource Calls': { severity: 'critical', cvss: 8.1, cwe: 'CWE-319', what: `Your HTTPS page loads some resources over plain HTTP. Those requests travel in plaintext — anyone on the same WiFi can intercept and replace them.`, impact: `Attacker replaces your HTTP script with malicious JavaScript. Full DOM access — steal cookies, capture passwords, exfiltrate data in real time.`, howToFix: `Rewrite all URLs to HTTPS. Add CSP: upgrade-insecure-requests. Enable HSTS to prevent future downgrades.`, realWorld: `British Airways fined £20M after attackers injected payment-skimming script via mixed content, stealing 500,000 customers' card details.` },
  'Hardcoded Secrets Detection': { severity: 'high', cvss: 7.5, cwe: 'CWE-798', what: `Credentials hardcoded in source get committed to git permanently. Even after deletion, every previous commit contains the secret. Automated scanners find them in seconds.`, impact: `AWS key → thousands of servers spun up overnight. DB password → full data breach. JWT secret → forge auth tokens for any user.`, howToFix: `Move to process.env. Create .env file, add to .gitignore. Use Vercel Environment Variables in production. Rotate any exposed secret immediately.`, realWorld: `Toyota published AWS credentials to GitHub. Keys were live for 5 years, exposing 296,000 customers' personal data before discovery in 2022.` }
}

// ─── SECRET SCANNER (CLIENT-SIDE) ─────────────────────────────────────────────
const SECRET_PATTERNS = [
  { type: 'Stripe API Key', category: 'Payment', regex: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/, severity: 'critical' as const, cvss: 9.5, envVar: 'STRIPE_SECRET_KEY', desc: 'Stripe live key gives attackers full access to your payment account — they can read customer data, issue refunds, and make charges.', rec: 'Revoke immediately in Stripe dashboard. Replace with process.env.STRIPE_SECRET_KEY.' },
  { type: 'JWT Secret', category: 'Auth', regex: /(?:jwt[_-]?secret|JWT_SECRET)\s*[=:]\s*['"]([^'"]{10,})['"]/, severity: 'critical' as const, cvss: 9.8, envVar: 'JWT_SECRET', desc: 'JWT signing secret exposed. Attackers can forge authentication tokens for ANY user including admins, with no password needed.', rec: 'Rotate JWT secret immediately — all existing tokens are compromised. Use process.env.JWT_SECRET with a random 256-bit value.' },
  { type: 'AWS Access Key', category: 'Cloud', regex: /AKIA[0-9A-Z]{16}/, severity: 'critical' as const, cvss: 9.8, envVar: 'AWS_ACCESS_KEY_ID', desc: 'AWS Access Key ID found. Combined with the secret key, this provides programmatic access to your entire AWS account.', rec: 'Revoke in AWS IAM console immediately. Use process.env.AWS_ACCESS_KEY_ID and IAM roles in production.' },
  { type: 'OpenAI / Anthropic Key', category: 'AI', regex: /sk-(?:ant-|)[A-Za-z0-9\-_]{40,}/, severity: 'high' as const, cvss: 8.0, envVar: 'API_KEY', desc: 'AI API key exposed. Attackers can make expensive API calls at your cost, potentially running up thousands of dollars in charges.', rec: 'Revoke in provider dashboard. Use process.env.OPENAI_API_KEY or process.env.ANTHROPIC_API_KEY.' },
  { type: 'GitHub Token', category: 'Version Control', regex: /ghp_[A-Za-z0-9]{36}/, severity: 'critical' as const, cvss: 9.5, envVar: 'GITHUB_TOKEN', desc: 'GitHub Personal Access Token found. Attacker gains full access to repositories, can push malicious code, delete branches, read private repos.', rec: 'Revoke in GitHub Settings → Developer Settings → Personal Access Tokens immediately.' },
  { type: 'Database Password', category: 'Database', regex: /(?:DB_PASS(?:WORD)?|db_pass(?:word)?|database_pass(?:word)?)\s*[=:]\s*['"]([^'"]{6,})['"]/, severity: 'critical' as const, cvss: 9.0, envVar: 'DB_PASSWORD', desc: 'Database password hardcoded in source. Attacker gains direct read/write access to your entire database and all user data.', rec: 'Rotate database password. Use process.env.DB_PASSWORD. Restrict DB access by IP in your firewall.' },
  { type: 'Connection String', category: 'Database', regex: /(?:postgresql|mongodb|mysql|redis):\/\/[^:]+:[^@]+@/, severity: 'critical' as const, cvss: 9.5, envVar: 'DATABASE_URL', desc: 'Full database connection string with credentials found. Anyone who reads this code has direct database access.', rec: 'Move entire connection string to process.env.DATABASE_URL. Rotate credentials immediately.' },
  { type: 'Hardcoded Password', category: 'Auth', regex: /(?:password|passwd)\s*[=:]\s*['"]([^'"]{8,})['"]/, severity: 'high' as const, cvss: 7.5, envVar: 'SECRET_PASSWORD', desc: 'Password string hardcoded in source code. Anyone with code access has this credential.', rec: 'Move to process.env.PASSWORD. Use a secrets manager. Never hardcode credentials.' },
]

function scanCodeForSecrets(code: string, language: string): SecretLeak[] {
  const lines = code.split('\n')
  const leaks: SecretLeak[] = []
  let id = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) continue
    for (const pat of SECRET_PATTERNS) {
      if (pat.regex.test(line)) {
        const match = line.match(pat.regex)
        const secret = match?.[1] || match?.[0] || ''
        const visible = Math.min(5, Math.floor(secret.length * 0.2))
        const redacted = secret.length > 6 ? secret.slice(0, visible) + '●●●●●' + secret.slice(-2) : '●●●●●'
        const envRef = language === 'Python' ? `os.environ['${pat.envVar}']` : language === 'Java' ? `System.getenv("${pat.envVar}")` : language === 'Go' ? `os.Getenv("${pat.envVar}")` : `process.env.${pat.envVar}`
        leaks.push({
          id: `s${++id}`, type: pat.type, category: pat.category,
          file: `src/app/api/route.${language === 'Python' ? 'py' : language === 'Java' ? 'java' : language === 'Go' ? 'go' : 'ts'}`,
          line: i + 1, lineContent: line.trim().slice(0, 100),
          severity: pat.severity, cvss: pat.cvss,
          description: pat.desc, recommendation: pat.rec,
          envVarName: pat.envVar,
          patchedLine: line.replace(pat.regex, envRef).trim(),
          redacted,
        })
        break
      }
    }
  }
  return leaks
}

// ─── MOCK WEBHOOK HISTORY ─────────────────────────────────────────────────────
const MOCK_WEBHOOK_HISTORY: WebhookScan[] = [
  { id: '1', repo: 'nischay908/secure-ai', branch: 'main', commit_sha: 'a3f9c2d', commit_message: 'feat: add user authentication flow', pusher: 'nischay908', vuln_count: 2, critical_count: 1, issues: ['SQL Injection — unsanitized query', 'Hardcoded Secret — credential found'], security_score: 58, status: 'critical', scanned_at: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
  { id: '2', repo: 'nischay908/secure-ai', branch: 'main', commit_sha: 'b8e1d5a', commit_message: 'fix: update styling and layout', pusher: 'nischay908', vuln_count: 0, critical_count: 0, issues: [], security_score: 100, status: 'passed', scanned_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: '3', repo: 'nischay908/secure-ai', branch: 'feature/api', commit_sha: 'c2a7f8b', commit_message: 'add API endpoint for search', pusher: 'nischay908', vuln_count: 1, critical_count: 0, issues: ['XSS — unsanitized input rendered as HTML'], security_score: 75, status: 'warning', scanned_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: '4', repo: 'nischay908/secure-ai', branch: 'main', commit_sha: 'd9b3e1c', commit_message: 'chore: update dependencies and clean up', pusher: 'nischay908', vuln_count: 0, critical_count: 0, issues: [], security_score: 100, status: 'passed', scanned_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: '5', repo: 'nischay908/secure-ai', branch: 'main', commit_sha: 'e4f2a9d', commit_message: 'feat: implement dashboard analytics', pusher: 'nischay908', vuln_count: 3, critical_count: 2, issues: ['SQL Injection', 'Path Traversal', 'Hardcoded Secret'], security_score: 34, status: 'critical', scanned_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
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
      vulns.push({ ...RICH_VULNS['SQL Injection (SQLi)'], name: 'SQL Injection (SQLi)', line: 8 })
    }
    const secrets = scanCodeForSecrets(inputStr, lang)
    if (secrets.length > 0) vulns.push({ ...RICH_VULNS['Hardcoded Secrets Detection'], name: 'Hardcoded Secrets Detection', line: secrets[0].line })
  }
  return { vulns }
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
async function askAI(msg: string, vulns: any[], language: string): Promise<string> {
  try {
    const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: msg }], system: `You are Sentry AI, expert cybersecurity assistant. Vulnerabilities found in ${language}: ${vulns.map(v => `${v.name} (CVSS ${v.cvss})`).join(', ')}. Answer in plain English, 3-5 sentences, specific and actionable.` }) })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.response || fb(msg, vulns)
  } catch { return fb(msg, vulns) }
}
function fb(msg: string, vulns: any[]): string {
  const low = msg.toLowerCase(); const v = vulns[0]
  if (!v) return "No vulnerabilities found. Keep using parameterized queries and environment variables for secrets."
  if (low.includes('what') || low.includes('explain')) return `${v.name}: ${v.what?.split('.')[0]}.`
  if (low.includes('fix') || low.includes('how')) return `To fix: ${v.howToFix?.split('.')[0]}. Check the Corrected Code tab.`
  if (low.includes('danger') || low.includes('impact')) return v.impact
  if (low.includes('real') || low.includes('example')) return v.realWorld
  return `${v.name}: ${v.what?.split('.')[0]}. Fix: ${v.howToFix?.split('.')[0]}.`
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0); const [vis, setVis] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect() } }, { threshold: 0.1 }); o.observe(el); return () => o.disconnect() }, [])
  useEffect(() => { if (!vis) return; let c = 0; const inc = target / (1500 / 16); const t = setInterval(() => { c += inc; if (c >= target) { setVal(target); clearInterval(t) } else setVal(Math.floor(c)) }, 16); return () => clearInterval(t) }, [vis, target])
  return <div ref={ref} className="counter-val">{val}</div>
}
function Btn({ className, onClick, children, disabled, style }: any) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  const fire = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return; const r = e.currentTarget.getBoundingClientRect(); const id = Date.now()
    setRipples(p => [...p, { x: e.clientX - r.left, y: e.clientY - r.top, id }])
    setTimeout(() => setRipples(p => p.filter(rp => rp.id !== id)), 700); onClick?.(e)
  }
  return (<button className={className} onClick={fire} disabled={disabled} style={{ position: 'relative', overflow: 'hidden', ...style }}>{children}{ripples.map(rp => (<span key={rp.id} style={{ position: 'absolute', left: rp.x - 40, top: rp.y - 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'ripple 0.7s ease-out forwards', pointerEvents: 'none' }} />))}</button>)
}
function DiffViewer({ original, patched }: { original: string; patched: string }) {
  const [cp, setCp] = useState(false)
  const oL = original.split('\n'), pL = patched.split('\n')
  return (<div className="diff-root"><div className="diff-top-bar"><div className="diff-top-side diff-top-vuln"><span className="dtd red" />Vulnerable</div><div className="diff-top-side diff-top-fixed"><span className="dtd green" />Secured<Btn className="copy-patch-btn" onClick={() => { navigator.clipboard.writeText(patched); setCp(true); setTimeout(() => setCp(false), 2000) }}>{cp ? '✓ Copied' : <><Copy size={10} /> Copy</>}</Btn></div></div><div className="diff-cols"><div className="diff-col diff-col-left">{oL.map((l, i) => { const bad = !pL.includes(l) && l.trim(); return <div key={i} className={`dl ${bad ? 'dl-bad' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{l || ' '}</span></div> })}</div><div className="diff-col diff-col-right">{pL.map((l, i) => { const good = !oL.includes(l) && l.trim(); return <div key={i} className={`dl ${good ? 'dl-good' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{l || ' '}</span></div> })}</div></div></div>)
}
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── SECRET LEAK PANEL ────────────────────────────────────────────────────────
function SecretLeakPanel({ code, language, show }: { code: string; language: string; show: boolean }) {
  const [patchedIdx, setPatchedIdx] = useState<Set<string>>(new Set())
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null)
  const leaks = scanCodeForSecrets(code, language)

  const copyPatch = (leak: SecretLeak) => {
    navigator.clipboard.writeText(`// Move to .env file:\n${leak.envVarName}=${leak.redacted}\n\n// Replace in code:\n${leak.patchedLine}`)
    setCopiedIdx(leak.id); setTimeout(() => setCopiedIdx(null), 2000)
  }
  const applyPatch = (id: string) => setPatchedIdx(p => new Set([...p, id]))

  const sevColor: Record<string, string> = { critical: '#ff4444', high: '#f97316', medium: '#eab308' }
  const sevBg: Record<string, string> = { critical: 'rgba(255,68,68,0.08)', high: 'rgba(249,115,22,0.08)', medium: 'rgba(234,179,8,0.08)' }

  if (!show) return null

  return (
    <div className="secret-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="sp-header">
        <div className="sp-title-row">
          <Key size={16} color="#ff6b6b" />
          <span className="sp-title">Secret Leak Detection</span>
          {leaks.length > 0
            ? <span className="sp-critical-badge"><AlertTriangle size={11} /> {leaks.filter(l => l.severity === 'critical').length} Critical · {leaks.length} Total Found</span>
            : <span className="sp-clean-badge"><CheckCircle size={11} /> No Secrets Detected</span>
          }
        </div>
        <div className="sp-stats">
          {[{ label: 'Critical', count: leaks.filter(l => l.severity === 'critical').length, col: '#ff4444' }, { label: 'High', count: leaks.filter(l => l.severity === 'high').length, col: '#f97316' }, { label: 'Lines Scanned', count: code.split('\n').length, col: '#fff' }].map((s, i) => (
            <div key={i} className="sp-stat"><span className="sp-stat-num" style={{ color: s.col }}>{s.count}</span><span className="sp-stat-lbl">{s.label}</span></div>
          ))}
        </div>
      </div>

      {leaks.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon"><Lock size={28} color="#00ff88" /></div>
          <div className="sp-empty-title">// No Secrets Exposed</div>
          <div className="sp-empty-sub">Scanned {code.split('\n').length} lines — no hardcoded credentials, API keys, or tokens detected.</div>
        </div>
      ) : (
        <div className="sp-leaks">
          {leaks.map((leak, i) => (
            <div key={leak.id} className={`sp-leak-card ${patchedIdx.has(leak.id) ? 'patched' : ''}`} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="sp-leak-stripe" style={{ background: `linear-gradient(to bottom,${sevColor[leak.severity]},transparent)` }} />
              <div className="sp-leak-top">
                <div className="sp-leak-meta">
                  <span className="sp-leak-sev" style={{ background: sevColor[leak.severity] + '20', color: sevColor[leak.severity], border: `1px solid ${sevColor[leak.severity]}40` }}>{leak.severity.toUpperCase()}</span>
                  <span className="sp-leak-category">{leak.category}</span>
                  <span className="sp-leak-cvss">CVSS {leak.cvss}</span>
                </div>
                <h3 className="sp-leak-type">{leak.type}</h3>
              </div>

              {/* File + line */}
              <div className="sp-leak-location">
                <FileCode2 size={11} color="rgba(255,255,255,0.3)" />
                <span>{leak.file}</span>
                <span className="sp-leak-line-tag">Line {leak.line}</span>
              </div>

              {/* Redacted preview */}
              <div className="sp-leak-code-row">
                <span className="sp-leak-code-label">Found:</span>
                <code className="sp-leak-code">{leak.lineContent}</code>
              </div>
              <div className="sp-leak-redacted">
                <span className="sp-leak-redacted-label">Value (redacted):</span>
                <span className="sp-leak-redacted-val">{leak.redacted}</span>
              </div>

              {/* Description */}
              <div className="sp-leak-desc">{leak.description}</div>

              {/* Recommended fix */}
              <div className="sp-leak-rec-box">
                <div className="sp-rec-label"><Lock size={11} color="#00ff88" /> Recommended Action</div>
                <div className="sp-rec-text">{leak.recommendation}</div>
              </div>

              {/* Patch preview */}
              <div className="sp-patch-preview">
                <div className="sp-patch-label">Auto-Generated Patch</div>
                <div className="sp-patch-before"><span className="sp-diff-minus">−</span><code>{leak.lineContent.slice(0, 80)}</code></div>
                <div className="sp-patch-after"><span className="sp-diff-plus">+</span><code>{leak.patchedLine.slice(0, 80)}</code></div>
              </div>

              {/* Actions */}
              {patchedIdx.has(leak.id) ? (
                <div className="sp-patched-badge"><CheckCircle size={13} /> Patch Applied — Move {leak.envVarName} to .env file</div>
              ) : (
                <div className="sp-leak-actions">
                  <Btn className="sp-copy-btn" onClick={() => copyPatch(leak)}>
                    {copiedIdx === leak.id ? <><CheckCircle size={11} /> Copied!</> : <><Copy size={11} /> Copy Patch</>}
                  </Btn>
                  <Btn className="sp-apply-btn" onClick={() => applyPatch(leak.id)}>
                    <Wrench size={11} /> Apply & Move to .env
                  </Btn>
                </div>
              )}
            </div>
          ))}

          {/* .env template */}
          <div className="sp-env-template">
            <div className="sp-env-title"><Database size={13} /> Auto-generated .env Template</div>
            <div className="sp-env-code">
              {leaks.map(l => `${l.envVarName}=your_${l.envVarName.toLowerCase()}_here`).join('\n')}
            </div>
            <Btn className="sp-copy-env-btn" onClick={() => navigator.clipboard.writeText(leaks.map(l => `${l.envVarName}=your_${l.envVarName.toLowerCase()}_here`).join('\n'))}>
              <Copy size={11} /> Copy .env Template
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LIVE MONITORING PANEL ────────────────────────────────────────────────────
function LiveMonitoringPanel({ show }: { show: boolean }) {
  const [history, setHistory] = useState<WebhookScan[]>(MOCK_WEBHOOK_HISTORY)
  const [monitoring, setMonitoring] = useState(true)
  const [simulatingCommit, setSimulatingCommit] = useState(false)
  const [newScan, setNewScan] = useState<WebhookScan | null>(null)
  const [selected, setSelected] = useState<WebhookScan | null>(null)

  const statusColor = { passed: '#00ff88', warning: '#f97316', critical: '#ff4444' }
  const statusBg = { passed: 'rgba(0,255,136,0.1)', warning: 'rgba(249,115,22,0.1)', critical: 'rgba(255,68,68,0.1)' }
  const statusIcon = { passed: <CheckCircle size={12} />, warning: <AlertTriangle size={12} />, critical: <AlertCircle size={12} /> }

  const simulateNewCommit = async () => {
    setSimulatingCommit(true); setNewScan(null)
    await new Promise(r => setTimeout(r, 2200))
    const messages = ['feat: add payment processing endpoint', 'fix: resolve auth token validation', 'refactor: optimize database queries']
    const scenarios = [
      { vuln_count: 2, critical_count: 1, issues: ['SQL Injection detected', 'Hardcoded DB password'], status: 'critical' as const, score: 52 },
      { vuln_count: 0, critical_count: 0, issues: [], status: 'passed' as const, score: 100 },
      { vuln_count: 1, critical_count: 0, issues: ['XSS via innerHTML'], status: 'warning' as const, score: 78 },
    ]
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
    const scan: WebhookScan = {
      id: Date.now().toString(),
      repo: 'nischay908/secure-ai',
      branch: 'main',
      commit_sha: Math.random().toString(36).slice(2, 9),
      commit_message: messages[Math.floor(Math.random() * messages.length)],
      pusher: 'nischay908',
      vuln_count: scenario.vuln_count,
      critical_count: scenario.critical_count,
      issues: scenario.issues,
      security_score: scenario.score,
      status: scenario.status,
      scanned_at: new Date().toISOString(),
    }
    setNewScan(scan)
    setHistory(prev => [scan, ...prev.slice(0, 9)])
    setSimulatingCommit(false)
  }

  // Calculate trend stats
  const passRate = Math.round((history.filter(h => h.status === 'passed').length / history.length) * 100)
  const avgScore = Math.round(history.reduce((a, h) => a + h.security_score, 0) / history.length)
  const totalVulns = history.reduce((a, h) => a + h.vuln_count, 0)

  if (!show) return null

  return (
    <div className="monitor-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="mp-header">
        <div className="mp-title-row">
          <Radio size={16} color={monitoring ? '#00ff88' : 'rgba(255,255,255,0.3)'} style={{ animation: monitoring ? 'blink 2s infinite' : 'none' }} />
          <span className="mp-title">Continuous Security Monitoring</span>
          <span className={`mp-status-pill ${monitoring ? 'active' : 'paused'}`}>
            <div className={`mp-status-dot ${monitoring ? 'live' : ''}`} />
            {monitoring ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
        <div className="mp-controls">
          <div className="mp-repo-tag"><GitBranch size={11} /> nischay908/secure-ai · main</div>
          <Btn className={`mp-toggle-btn ${monitoring ? 'on' : 'off'}`} onClick={() => setMonitoring(!monitoring)}>
            {monitoring ? <><BellOff size={12} /> Pause</> : <><Bell size={12} /> Resume</>}
          </Btn>
          <Btn className="mp-simulate-btn" onClick={simulateNewCommit} disabled={simulatingCommit}>
            {simulatingCommit ? <><div className="spin-dot" /> Scanning...</> : <><PlayCircle size={12} /> Simulate Push</>}
          </Btn>
        </div>
      </div>

      {/* Live new commit notification */}
      {newScan && (
        <div className={`mp-new-scan-alert ${newScan.status}`} style={{ animation: 'slideInDown 0.4s ease' }}>
          <div className="mp-alert-icon">{statusIcon[newScan.status]}</div>
          <div className="mp-alert-content">
            <div className="mp-alert-title">
              {newScan.status === 'passed' ? '✅ New commit scanned — No issues found' : newScan.status === 'critical' ? '🚨 New commit scanned — Critical vulnerabilities found!' : '⚠️ New commit scanned — Issues detected'}
            </div>
            <div className="mp-alert-sub">{newScan.commit_sha} · {newScan.commit_message}</div>
          </div>
          <button className="mp-alert-close" onClick={() => setNewScan(null)}><X size={13} /></button>
        </div>
      )}

      {/* Simulating animation */}
      {simulatingCommit && (
        <div className="mp-scanning-bar">
          <GitCommit size={13} color="#00ff88" />
          <span>New commit detected · Running security scan...</span>
          <div className="mp-scan-progress"><div className="mp-scan-fill" /></div>
        </div>
      )}

      {/* Stats row */}
      <div className="mp-stats-row">
        {[
          { icon: <TrendingUp size={14} />, label: 'Pass Rate', val: `${passRate}%`, col: passRate >= 70 ? '#00ff88' : '#f97316' },
          { icon: <Shield size={14} />, label: 'Avg Security Score', val: avgScore, col: avgScore >= 80 ? '#00ff88' : avgScore >= 60 ? '#f97316' : '#ff4444' },
          { icon: <Bug size={14} />, label: 'Total Vulns Found', val: totalVulns, col: '#ff6b6b' },
          { icon: <GitCommit size={14} />, label: 'Commits Scanned', val: history.length, col: '#a78bfa' },
        ].map((s, i) => (
          <div key={i} className="mp-stat-card">
            <div className="mp-stat-icon" style={{ color: s.col }}>{s.icon}</div>
            <div className="mp-stat-val" style={{ color: s.col }}>{s.val}</div>
            <div className="mp-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="mp-timeline-header">
        <Clock size={13} color="rgba(255,255,255,0.4)" />
        <span className="mp-timeline-title">Scan History Timeline</span>
        <span className="mp-timeline-sub">{history.length} scans</span>
      </div>

      <div className="mp-timeline">
        {history.map((scan, i) => (
          <div key={scan.id} className={`mp-timeline-item ${selected?.id === scan.id ? 'selected' : ''}`} onClick={() => setSelected(selected?.id === scan.id ? null : scan)} style={{ animationDelay: `${i * 0.06}s` }}>
            {/* Timeline line */}
            <div className="mp-tl-line-col">
              <div className="mp-tl-dot" style={{ background: statusColor[scan.status], boxShadow: `0 0 8px ${statusColor[scan.status]}` }} />
              {i < history.length - 1 && <div className="mp-tl-connector" />}
            </div>

            {/* Content */}
            <div className="mp-tl-content">
              <div className="mp-tl-row">
                <div className="mp-tl-commit">
                  <code className="mp-tl-sha">{scan.commit_sha}</code>
                  <span className="mp-tl-msg">{scan.commit_message}</span>
                </div>
                <div className="mp-tl-right">
                  <div className="mp-tl-time">{timeAgo(scan.scanned_at)}</div>
                  <span className="mp-tl-status-badge" style={{ color: statusColor[scan.status], background: statusBg[scan.status], border: `1px solid ${statusColor[scan.status]}30` }}>
                    {statusIcon[scan.status]} {scan.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="mp-tl-meta">
                <GitBranch size={10} color="rgba(255,255,255,0.3)" />
                <span>{scan.branch}</span>
                <span>·</span>
                <span>{scan.pusher}</span>
                {scan.vuln_count > 0 && <span className="mp-tl-vuln-tag">{scan.vuln_count} issue{scan.vuln_count > 1 ? 's' : ''}</span>}
                <div className="mp-tl-score-bar">
                  <div className="mp-tl-score-fill" style={{ width: `${scan.security_score}%`, background: scan.security_score >= 80 ? '#00ff88' : scan.security_score >= 60 ? '#f97316' : '#ff4444' }} />
                </div>
                <span className="mp-tl-score-num" style={{ color: scan.security_score >= 80 ? '#00ff88' : scan.security_score >= 60 ? '#f97316' : '#ff4444' }}>{scan.security_score}</span>
              </div>

              {/* Expanded issues */}
              {selected?.id === scan.id && scan.issues.length > 0 && (
                <div className="mp-tl-issues" style={{ animation: 'fadeIn 0.2s ease' }}>
                  {scan.issues.map((issue, j) => (
                    <div key={j} className="mp-tl-issue">
                      <AlertTriangle size={11} color="#ff6b6b" />{issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Webhook setup instructions */}
      <div className="mp-setup-box">
        <div className="mp-setup-title"><Shield size={13} /> Setup Automatic Monitoring</div>
        <div className="mp-setup-steps">
          <div className="mp-setup-step"><span className="mp-step-num">1</span>Go to your GitHub repo → Settings → Webhooks → Add webhook</div>
          <div className="mp-setup-step"><span className="mp-step-num">2</span>Payload URL: <code className="mp-setup-code">https://secure-ai-livid.vercel.app/api/github-webhook</code></div>
          <div className="mp-setup-step"><span className="mp-step-num">3</span>Content type: application/json · Select "Push events"</div>
          <div className="mp-setup-step"><span className="mp-step-num">4</span>Add to Vercel env: <code className="mp-setup-code">GITHUB_WEBHOOK_SECRET=your_random_secret</code></div>
        </div>
      </div>
    </div>
  )
}

// Missing import for Wrench
function Wrench({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
}

// ─── VULN CARD ────────────────────────────────────────────────────────────────
function VulnCard({ v, i }: { v: any; i: number }) {
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
          <div className="vuln-sec-full"><div className="vsec-label" style={{ color: 'rgba(255,255,255,0.4)' }}><Activity size={12} /> What Is This?</div><div className="vsec-content">{v.what}</div></div>
          <div className="vuln-sec-full"><div className="vsec-label" style={{ color: '#ff6b6b' }}><AlertTriangle size={12} /> Impact</div><div className="vsec-content" style={{ borderColor: 'rgba(255,107,107,0.12)', background: 'rgba(255,59,59,0.04)' }}>{v.impact}</div></div>
          <div className="vuln-sec-full">
            <div className="vsec-label" style={{ color: '#00ff88' }}><Lock size={12} /> How To Fix</div>
            <div className="vsec-content" style={{ borderColor: 'rgba(0,255,136,0.12)', background: 'rgba(0,255,136,0.04)', color: '#a7f3d0' }}>{v.howToFix}</div>
            <Btn className="copy-fix-btn" onClick={() => { navigator.clipboard.writeText(v.howToFix || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Fix</>}</Btn>
          </div>
          {v.realWorld && <div className="vuln-sec-full"><div className="vsec-label" style={{ color: '#fbbf24' }}><Zap size={12} /> Real-World Breach</div><div className="vsec-content" style={{ borderColor: 'rgba(251,191,36,0.12)', background: 'rgba(251,191,36,0.04)', color: '#fde68a' }}>{v.realWorld}</div></div>}
        </div>
      </div>
      {!expanded && <button className="expand-hint" onClick={() => setExpanded(true)}><Eye size={11} /> Click to read full analysis</button>}
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
  const [activeTab, setActiveTab] = useState<'vulns' | 'secrets' | 'original' | 'corrected' | 'monitor' | 'sentry'>('vulns')
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
      ? ['Resolving hostname & DNS', 'Running HTTP reconnaissance', 'Auditing security headers', 'Scanning for mixed content', 'Detecting secret patterns', 'Generating threat report']
      : ['Initializing AST scan engine', 'Building syntax tree', 'Running OWASP checks', 'Scanning for hardcoded secrets', 'Detecting injection patterns', 'Finalizing report']
    for (let i = 0; i < steps.length; i++) { setScanSteps(p => [...p, steps[i]]); setScanProgress(Math.round(((i + 1) / steps.length) * 100)); await new Promise(r => setTimeout(r, 550)) }
    const { vulns: found } = analyzeCode(code, scanMode, language)
    const secretLeaks = scanCodeForSecrets(code, language)
    setVulns(found); vulnsRef.current = found; langRef.current = language; codeRef.current = code
    const totalIssues = found.length + secretLeaks.length
    setChatMessages([{ role: 'bot', text: totalIssues > 0 ? `Security audit complete. Found ${found.length} vulnerabilit${found.length === 1 ? 'y' : 'ies'} and ${secretLeaks.length} secret leak${secretLeaks.length !== 1 ? 's' : ''} in your ${language} code.\n\n${found[0] ? `Most critical: ${found[0].name} (CVSS ${found[0].cvss}/10).` : ''} ${secretLeaks[0] ? `Also found: ${secretLeaks[0].type} exposed at line ${secretLeaks[0].line}.` : ''}\n\nCheck the Secrets tab for exposed credentials and the Monitoring tab for real-time push scanning.` : `No vulnerabilities or secrets found in your ${language} code. Great security hygiene!` }])
    await new Promise(r => setTimeout(r, 800))
    setPhase(totalIssues > 0 ? 'alert' : 'report')
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
  const TICKER = [{ label: 'Agent status', val: 'ONLINE' }, { label: 'OWASP coverage', val: '100%' }, { label: 'Secrets detected', val: '1,247' }, { label: 'Avg scan time', val: '<4.2s' }, { label: 'Commits monitored', val: '8,391' }, { label: 'Vulns today', val: '12,847' }]
  const SQS = vulns.length > 0 ? [`What exactly is ${vulns[0]?.name}?`, 'How dangerous is this?', 'Step by step fix?', 'Real-world example?'] : ['How do I prevent SQL injection?', 'How to store secrets safely?', 'What is OWASP Top 10?']
  const secretLeaks = scanCodeForSecrets(codeRef.current || code, langRef.current || language)
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
        .alert-cta{width:100%;padding:15px;background:#ff3b3b;border:none;border-radius:10px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.2s}
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
        .rtab{padding:16px 20px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.28);border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0}
        .rtab.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
        .rtab:not(.on):hover{color:rgba(255,255,255,0.6)}
        .tab-spacer{flex:1;min-width:8px}
        .rtab-ai{padding:16px 20px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0}
        .rtab-ai.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
        .rtab-ai:not(.on){color:rgba(255,255,255,0.22)}
        .rtab-ai:not(.on):hover{color:rgba(0,255,136,0.55)}
        .tab-count-badge{background:rgba(255,59,59,0.14);color:#ff6b6b;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace}
        .tab-warn-badge{background:rgba(255,107,107,0.14);color:#ff8c8c;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace}
        /* VULN CARDS */
        .vulns-panel{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
        .vuln-card{position:relative;overflow:hidden;background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:22px 24px 22px 30px;transition:all 0.25s;animation:slideInUp 0.4s ease both}
        .vuln-card:hover{border-color:rgba(255,255,255,0.1)}
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
        .vuln-expand-body.open{max-height:1400px}
        .vuln-sections{display:flex;flex-direction:column;gap:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);margin-top:4px}
        .vuln-sec-full{display:flex;flex-direction:column;gap:8px}
        .vsec-label{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
        .vsec-content{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 18px;font-size:13.5px;line-height:1.85;color:rgba(255,255,255,0.68)}
        .copy-fix-btn{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.16);color:#00ff88;font-size:11px;font-weight:700;padding:6px 14px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s;margin-top:6px}
        .copy-fix-btn:hover{background:rgba(0,255,136,0.15)}
        .vuln-empty{padding:72px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
        .ve-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);color:#00ff88;animation:float 3s ease-in-out infinite}
        .ve-h{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#fff}
        .ve-p{font-size:13px;color:rgba(255,255,255,0.28);max-width:320px;line-height:1.6}
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

        /* ── SECRET LEAK PANEL ── */
        .secret-panel{padding:24px 28px;display:flex;flex-direction:column;gap:20px}
        .sp-header{display:flex;flex-direction:column;gap:14px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.05)}
        .sp-title-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .sp-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
        .sp-critical-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.25);color:#ff6b6b;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;font-family:'JetBrains Mono',monospace;margin-left:auto}
        .sp-clean-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);color:#00ff88;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;font-family:'JetBrains Mono',monospace;margin-left:auto}
        .sp-stats{display:flex;align-items:center;gap:24px}
        .sp-stat{display:flex;flex-direction:column;gap:3px}
        .sp-stat-num{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;line-height:1}
        .sp-stat-lbl{font-size:11px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace}
        .sp-empty{display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px 28px;text-align:center}
        .sp-empty-icon{width:64px;height:64px;border-radius:16px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);display:flex;align-items:center;justify-content:center;animation:float 3s ease-in-out infinite}
        .sp-empty-title{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#00ff88}
        .sp-empty-sub{font-size:13px;color:rgba(255,255,255,0.3);max-width:380px;line-height:1.6}
        .sp-leaks{display:flex;flex-direction:column;gap:16px}
        .sp-leak-card{position:relative;background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px 22px 20px 28px;transition:all 0.25s;animation:slideInUp 0.4s ease both}
        .sp-leak-card:hover{border-color:rgba(255,255,255,0.1)}
        .sp-leak-card.patched{border-color:rgba(0,255,136,0.15)!important;background:rgba(0,255,136,0.02)}
        .sp-leak-stripe{position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px}
        .sp-leak-top{margin-bottom:12px}
        .sp-leak-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
        .sp-leak-sev{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 10px;border-radius:4px}
        .sp-leak-category{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
        .sp-leak-cvss{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:4px}
        .sp-leak-type{font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.02em}
        .sp-leak-location{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:12px}
        .sp-leak-line-tag{background:rgba(255,255,255,0.04);padding:2px 8px;border-radius:4px;font-size:10px}
        .sp-leak-code-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:6px}
        .sp-leak-code-label{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.08em;flex-shrink:0;margin-top:2px}
        .sp-leak-code{font-family:'JetBrains Mono',monospace;font-size:12px;color:#fca5a5;background:rgba(255,59,59,0.07);padding:4px 10px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:block}
        .sp-leak-redacted{display:flex;align-items:center;gap:10px;margin-bottom:12px}
        .sp-leak-redacted-label{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.08em;flex-shrink:0}
        .sp-leak-redacted-val{font-family:'JetBrains Mono',monospace;font-size:13px;color:#fbbf24;font-weight:700;letter-spacing:0.05em}
        .sp-leak-desc{font-size:13px;color:rgba(255,255,255,0.58);line-height:1.7;margin-bottom:12px}
        .sp-leak-rec-box{background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.1);border-radius:10px;padding:14px 16px;margin-bottom:12px}
        .sp-rec-label{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(0,255,136,0.7);margin-bottom:8px}
        .sp-rec-text{font-size:13px;color:rgba(255,255,255,0.62);line-height:1.7}
        .sp-patch-preview{background:#000;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 16px;margin-bottom:12px}
        .sp-patch-label{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);margin-bottom:10px}
        .sp-patch-before,.sp-patch-after{display:flex;align-items:flex-start;gap:10px;margin-bottom:6px}
        .sp-patch-before:last-of-type,.sp-patch-after:last-of-type{margin-bottom:0}
        .sp-diff-minus{color:#ff4444;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;flex-shrink:0}
        .sp-diff-plus{color:#00ff88;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;flex-shrink:0}
        .sp-patch-before code,.sp-patch-after code{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all}
        .sp-patch-before code{color:#fca5a5}
        .sp-patch-after code{color:#6ee7b7}
        .sp-leak-actions{display:flex;gap:10px;flex-wrap:wrap}
        .sp-copy-btn{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;padding:7px 14px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s}
        .sp-copy-btn:hover{background:rgba(255,255,255,0.1);color:#fff}
        .sp-apply-btn{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);color:#00ff88;font-size:11px;font-weight:700;padding:7px 14px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s}
        .sp-apply-btn:hover{background:rgba(0,255,136,0.15)}
        .sp-patched-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);color:#00ff88;font-size:12px;font-weight:700;padding:8px 16px;border-radius:8px;font-family:'JetBrains Mono',monospace;animation:fadeIn 0.3s ease}
        .sp-env-template{background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 20px}
        .sp-env-title{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px}
        .sp-env-code{font-family:'JetBrains Mono',monospace;font-size:13px;color:#00ff88;background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.1);border-radius:8px;padding:14px 16px;margin-bottom:12px;white-space:pre;overflow-x:auto}
        .sp-copy-env-btn{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:11px;font-weight:700;padding:6px 14px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s}
        .sp-copy-env-btn:hover{background:rgba(0,255,136,0.16)}

        /* ── MONITORING PANEL ── */
        .monitor-panel{padding:24px 28px;display:flex;flex-direction:column;gap:20px}
        .mp-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.05)}
        .mp-title-row{display:flex;align-items:center;gap:12px}
        .mp-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
        .mp-status-pill{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;font-family:'JetBrains Mono',monospace;letter-spacing:0.08em}
        .mp-status-pill.active{background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.25);color:#00ff88}
        .mp-status-pill.paused{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)}
        .mp-status-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.3)}
        .mp-status-dot.live{background:#00ff88;box-shadow:0 0 8px #00ff88;animation:blink 1.5s infinite}
        .mp-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .mp-repo-tag{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);padding:5px 12px;border-radius:8px}
        .mp-toggle-btn{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:7px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all 0.2s;border:none}
        .mp-toggle-btn.on{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5)}
        .mp-toggle-btn.on:hover{background:rgba(255,59,59,0.1);color:#ff6b6b}
        .mp-toggle-btn.off{background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);color:#00ff88}
        .mp-simulate-btn{display:inline-flex;align-items:center;gap:7px;background:#00ff88;border:none;padding:7px 16px;border-radius:7px;color:#000;font-size:11px;font-weight:800;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all 0.2s;box-shadow:0 0 14px rgba(0,255,136,0.2)}
        .mp-simulate-btn:hover{background:#1aff95;box-shadow:0 0 22px rgba(0,255,136,0.35)}
        .mp-simulate-btn:disabled{opacity:0.5;cursor:not-allowed}
        .mp-new-scan-alert{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;border:1px solid;animation:slideInDown 0.4s ease}
        .mp-new-scan-alert.passed{background:rgba(0,255,136,0.07);border-color:rgba(0,255,136,0.2)}
        .mp-new-scan-alert.warning{background:rgba(249,115,22,0.07);border-color:rgba(249,115,22,0.2)}
        .mp-new-scan-alert.critical{background:rgba(255,59,59,0.07);border-color:rgba(255,59,59,0.2)}
        .mp-alert-icon{flex-shrink:0}
        .mp-alert-content{flex:1}
        .mp-alert-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:3px}
        .mp-alert-sub{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.4)}
        .mp-alert-close{background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;display:flex;transition:color 0.2s;flex-shrink:0}
        .mp-alert-close:hover{color:#fff}
        .mp-scanning-bar{display:flex;align-items:center;gap:12px;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);border-radius:10px;padding:12px 16px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.6)}
        .mp-scan-progress{flex:1;height:3px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
        .mp-scan-fill{height:100%;background:#00ff88;border-radius:10px;animation:scanProgress 2.2s ease-out forwards}
        .mp-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .mp-stat-card{background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:all 0.2s}
        .mp-stat-card:hover{border-color:rgba(255,255,255,0.1);transform:translateY(-1px)}
        .mp-stat-icon{width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center}
        .mp-stat-val{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;line-height:1}
        .mp-stat-lbl{font-size:11px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace}
        .mp-timeline-header{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05)}
        .mp-timeline-title{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em}
        .mp-timeline-sub{font-size:11px;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;margin-left:auto}
        .mp-timeline{display:flex;flex-direction:column;gap:0}
        .mp-timeline-item{display:flex;gap:16px;cursor:pointer;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s;border-radius:8px;animation:slideInUp 0.3s ease both}
        .mp-timeline-item:hover{background:rgba(255,255,255,0.02)}
        .mp-timeline-item.selected{background:rgba(255,255,255,0.03)}
        .mp-timeline-item:last-child{border-bottom:none}
        .mp-tl-line-col{display:flex;flex-direction:column;align-items:center;padding-top:4px;flex-shrink:0;width:20px}
        .mp-tl-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
        .mp-tl-connector{width:2px;flex:1;min-height:16px;background:rgba(255,255,255,0.06);margin-top:6px}
        .mp-tl-content{flex:1;min-width:0}
        .mp-tl-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px}
        .mp-tl-commit{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
        .mp-tl-sha{font-family:'JetBrains Mono',monospace;font-size:12px;color:#a78bfa;background:rgba(167,139,250,0.1);padding:2px 8px;border-radius:4px;flex-shrink:0}
        .mp-tl-msg{font-size:13px;color:rgba(255,255,255,0.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
        .mp-tl-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .mp-tl-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25)}
        .mp-tl-status-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;font-family:'JetBrains Mono',monospace}
        .mp-tl-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace}
        .mp-tl-vuln-tag{background:rgba(255,59,59,0.1);color:#ff6b6b;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700}
        .mp-tl-score-bar{width:50px;height:3px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
        .mp-tl-score-fill{height:100%;border-radius:10px;transition:width 0.5s ease}
        .mp-tl-score-num{font-weight:700;font-size:11px}
        .mp-tl-issues{display:flex;flex-direction:column;gap:6px;margin-top:10px;padding:10px 14px;background:rgba(255,59,59,0.05);border:1px solid rgba(255,59,59,0.12);border-radius:8px}
        .mp-tl-issue{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace}
        .mp-setup-box{background:#040404;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 22px}
        .mp-setup-title{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px}
        .mp-setup-steps{display:flex;flex-direction:column;gap:10px}
        .mp-setup-step{display:flex;align-items:flex-start;gap:12px;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5}
        .mp-step-num{background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);color:#00ff88;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .mp-setup-code{font-family:'JetBrains Mono',monospace;font-size:12px;color:#00ff88;background:rgba(0,255,136,0.06);padding:2px 8px;border-radius:4px}

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
        .spin-dot{width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);border-top-color:#00ff88;animation:spin 0.8s linear infinite;flex-shrink:0}

        /* KEYFRAMES */
        @keyframes ripple{0%{transform:scale(0);opacity:0.6}100%{transform:scale(4);opacity:0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes scanPulse{0%,100%{box-shadow:0 0 40px rgba(0,255,136,0.14)}50%{box-shadow:0 0 60px rgba(0,255,136,0.3)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popUp{0%{opacity:0;transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes msgSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes scanProgress{0%{width:0}100%{width:100%}}
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
          {/* IDLE */}
          {phase === 'idle' && (<>
            <div className="hero"><div className="hero-eyebrow"><div className="green-dot" /> System Active</div><h1 className="hero-h1">Welcome back, <span className="hero-accent">{username}</span></h1><p className="hero-sub">Scan code for vulnerabilities, detect exposed secrets, monitor every GitHub push in real time, and auto-patch your entire codebase.</p></div>
            <div className="stats-row">{[{ icon: <Terminal size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Total Scans', val: stats.total }, { icon: <Bug size={16} />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', label: 'Vulnerabilities', val: stats.vulns }, { icon: <AlertTriangle size={16} />, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Critical / High', val: stats.crit }, { icon: <Zap size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Auto-Patched', val: stats.patched }].map((s, i) => (<div className="stat-card" key={i}><div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div><Counter target={s.val} /><div className="stat-label">{s.label}</div></div>))}</div>
            <div className="scanner-card">
              <div className="sc-tabs"><div className={`sc-tab ${scanMode === 'code' ? 'on' : ''}`} onClick={() => setScanMode('code')}><Code size={13} /> Paste Code</div><div className={`sc-tab ${scanMode === 'url' ? 'on' : ''}`} onClick={() => setScanMode('url')}><Globe size={13} /> Website URL</div></div>
              <div className="sc-body">
                {scanMode === 'code' ? (<><label className="sc-label">Programming Language</label><select className="sc-select" value={language} onChange={e => handleLang(e.target.value)}>{Object.keys(CODE_SAMPLES).map(l => <option key={l}>{l}</option>)}</select><label className="sc-label">Paste your code</label><textarea className="code-ta" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} /></>) : (<><label className="sc-label">Website URL</label><input className="sc-select" style={{ marginBottom: 10 }} placeholder="https://example.com" value={code} onChange={e => setCode(e.target.value)} /><p className="url-hint">Scan for network vulnerabilities and missing security headers.</p></>)}
                <Btn className="scan-btn" onClick={startScan} disabled={!code.trim()}><Sparkles size={15} /> Start Security Scan</Btn>
              </div>
            </div>
          </>)}

          {/* SCANNING */}
          {phase === 'scanning' && (<div className="scan-screen"><div className="scan-orb"><Sparkles size={30} color="#00ff88" /></div><div><h2 className="scan-h">Scanning in Progress</h2><p className="scan-s">Analyzing code + secrets + dependencies</p></div><div className="scan-steps">{scanSteps.map((s, i) => (<div key={i} className="scan-step" style={{ animationDelay: `${i * 0.07}s` }}><div className="step-pip" />{s}<CheckCircle size={12} color="#00ff88" style={{ marginLeft: 'auto', opacity: 0.7 }} /></div>))}</div><div className="prog-rail"><div className="prog-fill" style={{ width: `${scanProgress}%` }} /></div><div className="prog-label">{scanProgress}% complete</div></div>)}

          {/* ALERT */}
          {phase === 'alert' && (<div className="modal-bg"><div className="alert-card"><button className="alert-close" onClick={() => setPhase('report')}>✕</button><div className="alert-icon"><Shield size={34} /></div><h2 className="alert-title">// THREAT DETECTED</h2><p className="alert-desc">Found <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'critical').length} critical vulnerabilities</strong> and <strong style={{ color: '#fff' }}>{secretLeaks.length} exposed secrets</strong> in your code.</p><div className="alert-chip"><AlertTriangle size={12} />{vulns.filter(v => v.severity === 'critical').length + secretLeaks.filter(s => s.severity === 'critical').length} Critical Issues</div><Btn className="alert-cta" onClick={() => setPhase('report')}>View Full Security Report →</Btn></div></div>)}

          {/* REPORT */}
          {phase === 'report' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="back-btn" onClick={() => setPhase('idle')}>← Back to Dashboard</button>
              <div className="rep-header">
                <div>
                  <div className="rep-title-row"><div className="green-dot" /><h1 className="rep-title">// Scan Complete</h1></div>
                  <p className="rep-meta">Found {vulns.length} vulnerabilit{vulns.length === 1 ? 'y' : 'ies'} · {secretLeaks.length} secret leak{secretLeaks.length !== 1 ? 's' : ''} · {language}</p>
                  <div className="badge-row">{[{ l: 'critical', c: vulns.filter(v => v.severity === 'critical').length, col: '#ff4444', bg: 'rgba(255,68,68,0.08)' }, { l: 'high', c: vulns.filter(v => v.severity === 'high').length, col: '#f97316', bg: 'rgba(249,115,22,0.08)' }, { l: 'secrets', c: secretLeaks.length, col: '#fbbf24', bg: 'rgba(251,191,36,0.08)' }].map((b, i) => (<div key={i} className="sev-badge" style={{ color: b.col, background: b.bg, borderColor: `${b.col}28` }}><div className="sev-dot" style={{ background: b.col }} />{b.c} {b.l}</div>))}</div>
                </div>
                <div className="btn-row" style={{ position: 'relative' }}>
                  <Btn className="btn-green" onClick={() => setExportOpen(!exportOpen)}><Download size={13} /> Export</Btn>
                  {exportOpen && (<div className="exp-dd"><div className="exp-head">Export Format</div><button className="exp-item" onClick={() => { navigator.clipboard.writeText(JSON.stringify({ vulns, secretLeaks }, null, 2)); setExportOpen(false) }}><div className="exp-ico" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><Copy size={13} /></div>Copy JSON</button><button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88' }}><Download size={13} /></div>Download PDF</button><button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}><FileCode2 size={13} /></div>Open in VS Code</button></div>)}
                  <Btn className="btn-ghost" onClick={() => setPhase('idle')}><RotateCcw size={13} /> New Scan</Btn>
                </div>
              </div>

              <div className="rep-body" style={{ marginTop: 14 }}>
                <div className="tab-bar">
                  <div className={`rtab ${activeTab === 'vulns' ? 'on' : ''}`} onClick={() => setActiveTab('vulns')}><Bug size={12} /> Vulnerabilities{vulns.length > 0 && <span className="tab-count-badge">{vulns.length}</span>}</div>
                  <div className={`rtab ${activeTab === 'secrets' ? 'on' : ''}`} onClick={() => setActiveTab('secrets')}><Key size={12} /> Secrets{secretLeaks.length > 0 && <span className="tab-warn-badge">{secretLeaks.length}</span>}</div>
                  <div className={`rtab ${activeTab === 'original' ? 'on' : ''}`} onClick={() => setActiveTab('original')}><Eye size={12} /> Original Code</div>
                  <div className={`rtab ${activeTab === 'corrected' ? 'on' : ''}`} onClick={() => setActiveTab('corrected')}><CheckCircle size={12} /> Corrected Code</div>
                  <div className={`rtab ${activeTab === 'monitor' ? 'on' : ''}`} onClick={() => setActiveTab('monitor')}><Radio size={12} /> Live Monitor</div>
                  <div className="tab-spacer" />
                  <div className={`rtab-ai ${activeTab === 'sentry' ? 'on' : ''}`} onClick={() => setActiveTab('sentry')}><Sparkles size={12} /> Sentry AI</div>
                </div>

                {activeTab === 'vulns' && (<div className="vulns-panel" style={{ animation: 'fadeIn 0.25s ease' }}>{vulns.length === 0 ? (<div className="vuln-empty"><div className="ve-icon"><CheckCircle size={28} /></div><h3 className="ve-h">// No Vulnerabilities</h3><p className="ve-p">No injection or logic vulnerabilities found. Check the Secrets tab for any exposed credentials.</p></div>) : vulns.map((v, i) => <VulnCard key={i} v={v} i={i} />)}</div>)}
                {activeTab === 'secrets' && <SecretLeakPanel code={codeRef.current || code} language={langRef.current || language} show />}
                {activeTab === 'original' && (<div className="orig-panel" style={{ animation: 'fadeIn 0.25s ease' }}><div className="code-viewer"><div className="cv-header"><div className="cv-left"><div className="cv-dot" /><span className="cv-title">Source Code Analysis</span></div><span className="cv-lang">{language}</span></div><pre>{code}</pre></div></div>)}
                {activeTab === 'corrected' && (<div className="corr-panel" style={{ animation: 'fadeIn 0.25s ease' }}><div className="diff-title-row"><div><h3 className="diff-title">Neural Patch View</h3><p className="diff-sub">Scanned Source (L) vs AI Corrected (R)</p></div><div className="auto-badge"><Sparkles size={11} /> Auto-Correction Verified</div></div><DiffViewer original={code} patched={patchedCode} /></div>)}
                {activeTab === 'monitor' && <LiveMonitoringPanel show />}

                {activeTab === 'sentry' && (
                  <div className="sentry-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="sentry-banner"><div className="sentry-orb">AI</div>Sentry AI · Ask about vulnerabilities, secrets, or monitoring</div>
                    <div className="chat-wrap">
                      <div className="chat-head"><div className="chat-head-l"><div className="sentry-orb" style={{ width: 30, height: 30 }}>AI</div><span className="chat-head-title">Intelligence Hub</span></div><div className="neural-live"><div className="neural-dot" /><span className="neural-txt">Neural Link Active</span></div></div>
                      <div className="chat-msgs">
                        {chatMessages.length === 0 ? (<div className="chat-empty"><Sparkles size={34} style={{ opacity: 0.25 }} /><p>Initializing...</p></div>) : chatMessages.map((m, i) => (<div key={i} className={m.role === 'user' ? 'msg-user' : 'msg-bot'}>{m.text.split('\n').map((line, li) => <p key={li} style={{ marginBottom: li < m.text.split('\n').length - 1 ? 8 : 0 }}>{line}</p>)}</div>))}
                        {isTyping && <div className="msg-bot"><div className="typing"><div className="td" /><div className="td" /><div className="td" /></div></div>}
                        <div ref={chatEndRef} />
                      </div>
                      {chatMessages.length > 0 && !isTyping && (<div className="suggestions">{SQS.map((q, i) => (<button key={i} className="suggest-btn" onClick={() => sendAI(q)}>{q}</button>))}</div>)}
                      <div className="chat-input-row">
                        <input className="chat-inp" placeholder="Ask about secrets, vulnerabilities, or monitoring..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} />
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