'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Code, Globe, Shield, Home, AlertTriangle, Bug, Sparkles, CheckCircle, ChevronDown, Download, RotateCcw, LogOut, Settings, Copy, FileCode2, Terminal, Zap, Eye } from 'lucide-react'

/* ─────────────────────────────────────────────────
   MOCK DATA & VULN LOGIC
───────────────────────────────────────────────── */
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
    vulnb: `# Example: SQL Injection in Python Flask
from flask import Flask, request
import sqlite3

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # VULNERABLE: Direct string interpolation into query
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
    # FIXED: Use parameterized queries for Python sqlite3
    query = "SELECT * FROM users WHERE username=? AND password=?"
    cursor.execute(query, (username, password))
    user = cursor.fetchone()
    if user:
        return f"Welcome {username}!"
    return "Invalid credentials"`
  },
  Java: {
    vulnb: `// Example: Java SQL Injection
import java.sql.*;

public class UserAuth {
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app", "root", "secret");
            Statement stmt = conn.createStatement();
            // VULNERABLE: String concatenation creates unsafe query
            String query = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";
            ResultSet rs = stmt.executeQuery(query);
            return rs.next();
        } catch (Exception e) {
            return false;
        }
    }
}`,
    fixed: `import java.sql.*;

public class UserAuth {
    public boolean authenticate(String user, String pass) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/app", "root", "secret");
            // FIXED: PreparedStatements automatically escape user input
            String query = "SELECT * FROM users WHERE username = ? AND password = ?";
            PreparedStatement pstmt = conn.prepareStatement(query);
            pstmt.setString(1, user);
            pstmt.setString(2, pass);
            ResultSet rs = pstmt.executeQuery();
            return rs.next();
        } catch (Exception e) {
            return false;
        }
    }
}`
  },
  Go: {
    vulnb: `// Example: Go SQLi
package main

import (
\t"database/sql"
\t"fmt"
\t"net/http"
)

func getUserHandler(db *sql.DB) http.HandlerFunc {
\treturn func(w http.ResponseWriter, r *http.Request) {
\t\tid := r.URL.Query().Get("id")
\t\t// VULNERABLE: Sprintf concat
\t\tquery := fmt.Sprintf("SELECT name, email FROM users WHERE id = %s", id)
\t\t
\t\tvar name, email string
\t\terr := db.QueryRow(query).Scan(&name, &email)
\t\tif err != nil {
\t\t\thttp.Error(w, "User not found", 404)
\t\t\treturn
\t\t}
\t\tfmt.Fprintf(w, "User: %s", name)
\t}
}`,
    fixed: `package main

import (
\t"database/sql"
\t"fmt"
\t"net/http"
)

func getUserHandler(db *sql.DB) http.HandlerFunc {
\treturn func(w http.ResponseWriter, r *http.Request) {
\t\tid := r.URL.Query().Get("id")
\t\t// FIXED: Use parameterized query (?) in place of args
\t\tquery := "SELECT name, email FROM users WHERE id = ?"
\t\t
\t\tvar name, email string
\t\terr := db.QueryRow(query, id).Scan(&name, &email)
\t\tif err != nil {
\t\t\thttp.Error(w, "User not found", 404)
\t\t\treturn
\t\t}
\t\tfmt.Fprintf(w, "User: %s", name)
\t}
}`
  }
}

function analyzeCode(inputStr: string, mode: 'code' | 'url', lang: string): { vulns: any[]; score: number; thinking: string[] } {
  const thinking: string[] = []
  const vulns: any[] = []

  if (mode === 'url') {
    thinking.push('Initializing network scanner against target URL...', 'Simulating HTTP reconnaissance...', 'Checking default port configurations...')
    if (inputStr.trim().length > 0) {
      vulns.push({ name: 'Missing Security Headers', severity: 'high', description: 'The target web server is missing crucial security headers like Strict-Transport-Security and X-Frame-Options.', fix: 'Configure your web server (Nginx/Apache) or application framework to append these headers on all responses.', line: 0 })
      vulns.push({ name: 'Unencrypted Sub-Resource Calls', severity: 'critical', description: 'Network sniffer detected assets being loaded over HTTP paths, leaving them open to man-in-the-middle attacks.', fix: 'Enforce HTTPS for all resource fetching by rewriting URLs to HTTPS or using a Content Security Policy (upgrade-insecure-requests).', line: 0 })
    }
  } else {
    thinking.push(`Parsing ${lang} syntax tree...`, 'Loading language-specific OWASP rule sets...', 'Checking for dangerous operators...')
    const code = inputStr.toLowerCase()
    if (code.includes('select ') && code.includes('where ')) {
      const isVuln = code.includes('+"') || code.includes('+') || code.includes('f"') || code.includes('sprintf') || code.includes('format') || code.includes('%s')
      if (isVuln) {
        vulns.push({ name: 'SQL Injection (SQLi)', severity: 'critical', description: 'Untrusted input is unsafely concatenated directly into a database query. Attackers can modify the query logic to bypass authentication or steal data.', fix: 'Refactor to use Parameterized Queries or Prepared Statements provided by your database driver.', line: 7 })
      }
    }
    if (vulns.length === 0 && inputStr.length > 20) {
      vulns.push({ name: 'Hardcoded Secrets Detection', severity: 'high', description: 'Potential API token or password found written in plaintext in the repository.', fix: 'Extract secrets to environment variables (.env files) and load them into application memory at runtime.', line: 14 })
    }
  }

  const score = vulns.length === 0 ? 98 : Math.max(12, 100 - (vulns.length * 30))
  return { vulns, score, thinking }
}

/* ─────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────── */
function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let cur = 0
    const inc = target / (1500 / 16)
    const timer = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(cur))
    }, 16)
    return () => clearInterval(timer)
  }, [visible, target])

  return <div ref={ref} className="counter-num">{val}</div>
}

/* ─────────────────────────────────────────────────
   DIFF VIEWER — improved with copy button
───────────────────────────────────────────────── */
function DiffViewer({ original, patched }: { original: string; patched: string }) {
  const [copied, setCopied] = useState(false)
  const oLines = original.split('\n'), pLines = patched.split('\n')

  const copyFixed = () => {
    navigator.clipboard.writeText(patched)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="diff-wrap">
      {/* Header row */}
      <div className="diff-headers">
        <div className="diff-col-label diff-label-vuln">
          <span className="diff-badge-dot red" />
          <span>Vulnerable Code</span>
        </div>
        <div className="diff-col-label diff-label-fixed">
          <span className="diff-badge-dot green" />
          <span>Secured Code</span>
          <button className="copy-fixed-btn" onClick={copyFixed}>
            {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Fixed</>}
          </button>
        </div>
      </div>
      {/* Code grid */}
      <div className="diff-grid">
        {/* Left — original */}
        <div className="diff-pane diff-pane-left">
          {oLines.map((line, i) => {
            const bad = !pLines.includes(line) && line.trim()
            return (
              <div key={i} className={`diff-line ${bad ? 'diff-line-bad' : ''}`}>
                <span className="diff-ln">{i + 1}</span>
                <span className="diff-code" style={{ whiteSpace: 'pre' }}>{line || ' '}</span>
              </div>
            )
          })}
        </div>
        {/* Right — patched */}
        <div className="diff-pane diff-pane-right">
          {pLines.map((line, i) => {
            const good = !oLines.includes(line) && line.trim()
            return (
              <div key={i} className={`diff-line ${good ? 'diff-line-good' : ''}`}>
                <span className="diff-ln">{i + 1}</span>
                <span className="diff-code" style={{ whiteSpace: 'pre' }}>{line || ' '}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────── */
export default function UnifiedDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, vulns: 0, crit: 0, patched: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
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
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) { setUser(user) } else { setUser({ email: 'demo@cybersentry.ai', id: 'promo-id' }) }
      const { data } = await supabase.from('scans').select('*').eq('user_id', user ? user.id : 'promo-id')
      if (data) {
        let total = data.length, vCount = 0, critCount = 0
        data.forEach(s => { if (s.vulnerabilities) { vCount += s.vulnerabilities.length; critCount += s.vulnerabilities.filter((v: any) => v.severity === 'critical' || v.severity === 'high').length } })
        setStats({ total, vulns: vCount, crit: critCount, patched: vCount })
      }
      setLoadingStats(false)
    }
    init()
  }, [])

  const startScan = async () => {
    setPhase('scanning'); setScanSteps([])
    const steps = scanMode === 'url'
      ? ['Resolving hostname & DNS records', 'HTTP reconnaissance in progress', 'Auditing security response headers', 'Generating threat intelligence report']
      : ['Initializing AST scan engine', 'Parsing syntax trees & call graphs', 'Running OWASP Top-10 rule checks', 'Finalizing vulnerability assessment']
    for (const step of steps) { setScanSteps(p => [...p, step]); await new Promise(r => setTimeout(r, 800)) }
    const { vulns: foundVulns } = analyzeCode(code, scanMode, language)
    setVulns(foundVulns)
    if (foundVulns.length > 0) {
      setChatMessages([{ role: 'bot', text: `Hello ${user?.email?.split('@')[0] || 'User'}. I've completed the security audit. I've detected ${foundVulns.length} vulnerabilit${foundVulns.length === 1 ? 'y' : 'ies'} that require your attention. The most critical is the ${foundVulns[0].name}.\n\nYou can see my full briefing in the panel below, or ask me specific questions about these findings.` }])
    } else {
      setChatMessages([{ role: 'bot', text: "Excellent news! My deep scan found no security vulnerabilities in this codebase. You're following best practices." }])
    }
    await new Promise(r => setTimeout(r, 600))
    setPhase(foundVulns.length > 0 ? 'alert' : 'report')
    try {
      if (user) {
        await supabase.from('scans').insert({ user_id: user.id, code, language: scanMode === 'url' ? 'URL' : language, vulnerabilities: foundVulns, fixed_code: scanMode === 'code' ? CODE_SAMPLES[language]?.fixed || code : '', security_score: foundVulns.length === 0 ? 100 : Math.max(12, 100 - (foundVulns.length * 30)), status: 'completed' })
      }
    } catch (e) { }
  }

  const handleLanguageChange = (lang: string) => { setLanguage(lang); if (CODE_SAMPLES[lang]) setCode(CODE_SAMPLES[lang].vulnb) }

  const sendAIQuery = async () => {
    if (!chatInput.trim() || isTyping) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatInput(''); setIsTyping(true)
    await new Promise(r => setTimeout(r, 1200))
    const lowMsg = userMsg.toLowerCase()
    let response = "I'm analyzing that specific context for you. Based on the scan, I recommend focusing on the parameterized query implementation first."
    if (lowMsg.includes('sql') || lowMsg.includes('injection')) response = "SQL Injection is a critical risk where untrusted input manipulates your database queries. The fix I've generated uses Prepared Statements — these separate query logic from data, making it impossible for an attacker to break out of the string literal."
    else if (lowMsg.includes('fix') || lowMsg.includes('how') || lowMsg.includes('apply')) response = "To apply the fix, navigate to the 'Corrected Code' tab. I've refactored the data access logic using secure patterns. You can copy the patched code directly into your source file."
    else if (lowMsg.includes('url') || lowMsg.includes('header') || lowMsg.includes('network')) response = "For the network vulnerabilities, ensure your web server (Nginx or Apache) is configured to send HSTS and X-Frame-Options headers on all responses. This prevents Man-in-the-Middle and Clickjacking attacks."
    else if (lowMsg.includes('who') || lowMsg.includes('you')) response = "I am Sentry AI, your agentic security assistant. I don't just find bugs — I help you understand them and fix them with production-ready code."
    setChatMessages(prev => [...prev, { role: 'bot', text: response }])
    setIsTyping(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const username = user?.email?.split('@')[0] || 'user'

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #0c0d11;
      color: #e8eaf0;
      font-family: 'Space Grotesk', sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* ── LAYOUT ── */
    .page-wrap { min-height: 100vh; background: #0c0d11; display: flex; flex-direction: column; }
    .main-content { max-width: 1280px; width: 100%; margin: 0 auto; padding: 40px 32px; display: flex; flex-direction: column; gap: 28px; }

    /* ── NAV ── */
    .nav-bar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(12,13,17,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 0 32px;
      display: flex; align-items: center; justify-content: space-between;
      height: 64px;
    }
    .nav-left { display: flex; align-items: center; gap: 32px; }
    .brand { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; }
    .brand-icon {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #c026d3, #7c3aed);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(192,38,211,0.4);
    }
    .brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .nav-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); }
    .nav-pill {
      display: flex; align-items: center; gap: 7px;
      color: #10b981; font-size: 13px; font-weight: 600;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
      padding: 5px 14px; border-radius: 20px;
    }
    .nav-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: blink 2s infinite; }

    /* ── USER MENU ── */
    .user-btn {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 6px 14px 6px 6px;
      border-radius: 40px; cursor: pointer;
      transition: background 0.2s;
    }
    .user-btn:hover { background: rgba(255,255,255,0.07); }
    .user-avatar {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, #c026d3, #7c3aed);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase;
    }
    .user-name { font-size: 14px; font-weight: 600; color: #e8eaf0; }
    .dropdown-menu {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 220px;
      background: #17181f;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: fadeDown 0.15s ease;
    }
    .dropdown-header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
    .dropdown-label { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .dropdown-email { font-size: 13px; font-weight: 600; color: #e8eaf0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dropdown-item {
      width: 100%; padding: 11px 16px;
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; font-weight: 500; color: #c8cad4;
      background: none; border: none; cursor: pointer; text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s, color 0.15s;
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
    .dropdown-item.danger { color: #f87171; }
    .dropdown-item.danger:hover { background: rgba(248,113,113,0.08); }

    /* ── HERO ── */
    .hero {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, rgba(192,38,211,0.07) 0%, rgba(124,58,237,0.03) 50%, transparent 100%);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 44px 48px;
    }
    .hero::before {
      content: '';
      position: absolute; top: -80px; right: -80px;
      width: 360px; height: 360px;
      background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
      border-radius: 50%; pointer-events: none;
    }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 600;
      color: #10b981; letter-spacing: 0.12em; text-transform: uppercase;
      margin-bottom: 18px;
    }
    .hero-h1 {
      font-family: 'Syne', sans-serif;
      font-size: 44px; font-weight: 800;
      letter-spacing: -0.03em; line-height: 1.1;
      color: #fff; margin-bottom: 14px;
    }
    .hero-gradient { background: linear-gradient(90deg, #e879f9, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-sub { font-size: 15px; color: rgba(255,255,255,0.45); font-weight: 500; line-height: 1.65; max-width: 480px; }

    /* ── STAT CARDS ── */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .stat-card {
      background: #13141a;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px; padding: 22px 24px;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.2s, transform 0.2s;
    }
    .stat-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-2px); }
    .stat-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .counter-num { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1; }
    .stat-label { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.38); }

    /* ── SCANNER BOX ── */
    .scanner-wrap {
      background: #13141a;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px; overflow: hidden;
    }
    .scanner-mode-tabs { display: flex; background: #0f1015; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .mode-tab {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 9px;
      padding: 18px 0; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
      color: rgba(255,255,255,0.3);
    }
    .mode-tab.active {
      color: #fff;
      background: linear-gradient(135deg, rgba(192,38,211,0.18), rgba(124,58,237,0.12));
      border-bottom: 2px solid #c026d3;
      box-shadow: 0 4px 20px rgba(192,38,211,0.15) inset;
    }
    .mode-tab:not(.active):hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.02); }
    .scanner-body { padding: 32px 36px; }
    .form-label {
      display: block; font-size: 12px; font-weight: 600;
      color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 10px;
    }
    .form-select {
      width: 100%; background: #0c0d11; border: 1px solid rgba(255,255,255,0.07);
      color: #e8eaf0; border-radius: 10px; padding: 12px 16px;
      font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 500;
      appearance: none; outline: none; cursor: pointer;
      margin-bottom: 24px; transition: border-color 0.2s;
    }
    .form-select:focus { border-color: rgba(192,38,211,0.5); }
    .code-editor {
      width: 100%; min-height: 220px; resize: vertical;
      background: #0c0d11;
      border: 1px solid rgba(255,255,255,0.07);
      border-left: 3px solid #7c3aed;
      border-radius: 10px; padding: 18px 20px;
      color: rgba(255,255,255,0.82);
      font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.7;
      outline: none; margin-bottom: 24px;
      transition: border-color 0.2s;
    }
    .code-editor:focus { border-color: rgba(192,38,211,0.5); border-left-color: #c026d3; }
    .scan-btn {
      width: 100%; padding: 18px;
      background: linear-gradient(135deg, #c026d3, #9333ea);
      border: none; border-radius: 12px;
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      font-size: 15px; font-weight: 700; letter-spacing: 0.01em;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: all 0.2s;
      box-shadow: 0 6px 30px rgba(192,38,211,0.3);
    }
    .scan-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(192,38,211,0.4); }
    .scan-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .url-hint { font-size: 12px; color: rgba(255,255,255,0.2); margin-top: -18px; margin-bottom: 24px; line-height: 1.5; }

    /* ── SCANNING PHASE ── */
    .scanning-screen {
      min-height: 480px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 32px;
      padding: 60px; text-align: center;
      background: #13141a; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;
    }
    .scan-orb {
      width: 88px; height: 88px;
      background: linear-gradient(135deg, #1e0a2a, #160820);
      border: 1px solid rgba(192,38,211,0.25);
      border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 60px rgba(192,38,211,0.15);
      animation: float 3s ease-in-out infinite;
    }
    .scan-h { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .scan-sub { font-size: 14px; color: rgba(255,255,255,0.35); }
    .scan-steps { display: flex; flex-direction: column; gap: 14px; text-align: left; min-width: 300px; }
    .scan-step-item {
      display: flex; align-items: center; gap: 12px;
      font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65);
      animation: slideIn 0.4s ease both;
    }
    .step-pip { width: 8px; height: 8px; background: #c026d3; border-radius: 50%; box-shadow: 0 0 10px #c026d3; flex-shrink: 0; }
    .progress-track { width: 320px; height: 5px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #7c3aed, #c026d3); border-radius: 10px; transition: width 0.35s ease; }

    /* ── ALERT MODAL ── */
    .modal-bg {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; animation: fadeIn 0.25s ease;
    }
    .alert-box {
      background: #110a0e;
      border: 1px solid rgba(239,68,68,0.22);
      border-radius: 24px; padding: 44px;
      max-width: 460px; width: 100%; text-align: center;
      box-shadow: 0 0 80px rgba(239,68,68,0.1);
      animation: popUp 0.35s cubic-bezier(0.16,1,0.3,1);
      position: relative;
    }
    .alert-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 18px; transition: color 0.2s; }
    .alert-close:hover { color: #fff; }
    .alert-icon-wrap {
      width: 76px; height: 76px; margin: 0 auto 24px;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 22px; display: flex; align-items: center; justify-content: center;
      color: #ef4444;
    }
    .alert-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #ef4444; margin-bottom: 14px; line-height: 1.2; }
    .alert-desc { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.6; margin-bottom: 28px; }
    .alert-chip {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      color: #f87171; font-size: 13px; font-weight: 700;
      padding: 7px 16px; border-radius: 10px; margin-bottom: 28px;
    }
    .alert-cta {
      width: 100%; padding: 16px;
      background: linear-gradient(135deg, #ef4444, #f97316);
      border: none; border-radius: 12px;
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 6px 28px rgba(239,68,68,0.28);
      transition: all 0.2s;
    }
    .alert-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(239,68,68,0.38); }

    /* ── REPORT HEADER ── */
    .report-header {
      background: #13141a; border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px; padding: 32px 36px;
      display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
    }
    .report-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    .report-h { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .report-meta { font-size: 13px; color: rgba(255,255,255,0.35); font-weight: 500; margin-bottom: 20px; }
    .badge-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .sev-badge {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 5px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 700; border: 1px solid;
    }
    .sev-dot { width: 7px; height: 7px; border-radius: 50%; }
    .btn-row { display: flex; gap: 10px; flex-shrink: 0; }
    .btn-primary {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, #c026d3, #7c3aed);
      border: none; padding: 11px 22px; border-radius: 10px;
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      font-size: 14px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 20px rgba(192,38,211,0.3);
      transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(192,38,211,0.4); }
    .btn-secondary {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 11px 22px; border-radius: 10px;
      color: #c8cad4; font-family: 'Space Grotesk', sans-serif;
      font-size: 14px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: all 0.15s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .export-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 220px;
      background: #17181f; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      z-index: 60; animation: fadeDown 0.15s ease;
    }
    .export-header { padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.12em; background: rgba(255,255,255,0.02); }
    .export-item {
      width: 100%; padding: 11px 16px;
      display: flex; align-items: center; gap: 12px;
      font-size: 13px; font-weight: 500; color: #c8cad4;
      background: none; border: none; cursor: pointer; text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
    }
    .export-item:last-child { border-bottom: none; }
    .export-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
    .export-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    /* ── REPORT BODY TABS ── */
    .report-body {
      background: #13141a; border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px; overflow: hidden;
    }
    .tab-bar { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); background: #0f1015; }
    .tab-btn {
      padding: 17px 28px; font-size: 13px; font-weight: 600;
      color: rgba(255,255,255,0.35); cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      border-bottom: 2px solid transparent;
      transition: all 0.2s; white-space: nowrap;
    }
    .tab-btn.active { color: #fff; border-bottom-color: #c026d3; background: rgba(192,38,211,0.05); }
    .tab-btn:not(.active):hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.02); }
    .tab-spacer { flex: 1; }
    .sentry-tab-btn {
      padding: 17px 28px; font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      border-bottom: 2px solid transparent;
      transition: all 0.2s; white-space: nowrap;
      margin-left: auto;
    }
    .sentry-tab-btn.active { color: #e879f9; border-bottom-color: #e879f9; background: rgba(232,121,249,0.05); }
    .sentry-tab-btn:not(.active) { color: rgba(255,255,255,0.35); }
    .sentry-tab-btn:not(.active):hover { color: rgba(232,121,249,0.7); }

    /* ── VULN TAB ── */
    .vulns-panel { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
    .vuln-card {
      position: relative; overflow: hidden;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 28px 32px;
      transition: all 0.25s;
    }
    .vuln-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); transform: translateY(-1px); }
    .vuln-stripe { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 2px 0 0 2px; }
    .vuln-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
    .vuln-badges { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .vuln-sev {
      padding: 4px 12px; border-radius: 6px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    }
    .vuln-id { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 6px; }
    .vuln-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .vuln-line-tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); padding: 5px 12px; border-radius: 8px; flex-shrink: 0; }
    .vuln-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .vuln-section { display: flex; flex-direction: column; gap: 10px; }
    .vuln-section-label {
      display: flex; align-items: center; gap: 7px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    }
    .label-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .vuln-desc-box {
      background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 18px 20px;
      font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.72); font-weight: 400;
    }
    .vuln-fix-box {
      border-radius: 12px; padding: 18px 20px;
      font-size: 14px; line-height: 1.7; font-weight: 500;
    }
    .empty-vulns { padding: 80px 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 16px; }
    .empty-icon { width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
    .empty-h { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; }
    .empty-p { font-size: 14px; color: rgba(255,255,255,0.35); max-width: 340px; line-height: 1.6; }

    /* ── ORIGINAL CODE TAB ── */
    .original-panel { padding: 28px 32px; }
    .code-viewer {
      background: #0c0d11; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; overflow: hidden;
    }
    .code-viewer-header {
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.02);
      display: flex; align-items: center; justify-content: space-between;
    }
    .code-viewer-label { display: flex; align-items: center; gap: 8px; }
    .code-viewer-dot { width: 7px; height: 7px; border-radius: 50%; background: #7c3aed; box-shadow: 0 0 8px #7c3aed; }
    .code-viewer-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.12em; }
    .lang-tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #a78bfa; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.2); padding: 4px 12px; border-radius: 6px; font-weight: 600; }
    .code-viewer pre { padding: 24px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: rgba(255,255,255,0.68); line-height: 1.75; overflow-x: auto; max-height: 560px; }

    /* ── DIFF (CORRECTED CODE) TAB ── */
    .corrected-panel { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
    .diff-header-row { display: flex; align-items: center; justify-content: space-between; }
    .diff-h { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .diff-sub { font-size: 12px; color: rgba(255,255,255,0.3); font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
    .auto-verified { display: inline-flex; align-items: center; gap: 7px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #34d399; font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px; }
    .diff-wrap { border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
    .diff-headers { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .diff-col-label { padding: 12px 18px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .diff-label-vuln { background: rgba(239,68,68,0.08); color: #f87171; border-right: 1px solid rgba(255,255,255,0.06); }
    .diff-label-fixed { background: rgba(16,185,129,0.06); color: #34d399; justify-content: space-between; }
    .diff-badge-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .diff-badge-dot.red { background: #ef4444; }
    .diff-badge-dot.green { background: #10b981; }
    .copy-fixed-btn { display: flex; align-items: center; gap: 5px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
    .copy-fixed-btn:hover { background: rgba(16,185,129,0.2); }
    .diff-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .diff-pane { overflow-x: auto; max-height: 480px; overflow-y: auto; }
    .diff-pane-left { background: #0c0007; border-right: 1px solid rgba(255,255,255,0.05); }
    .diff-pane-right { background: #030c06; }
    .diff-line { display: flex; gap: 0; align-items: stretch; min-height: 22px; }
    .diff-line-bad { background: rgba(239,68,68,0.1); border-left: 3px solid rgba(239,68,68,0.6); }
    .diff-line-good { background: rgba(16,185,129,0.08); border-left: 3px solid rgba(16,185,129,0.5); }
    .diff-ln { min-width: 40px; padding: 2px 10px 2px 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.15); text-align: right; user-select: none; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.04); }
    .diff-code { padding: 2px 14px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.75; color: rgba(255,255,255,0.5); }
    .diff-line-bad .diff-code { color: #fca5a5; }
    .diff-line-good .diff-code { color: #6ee7b7; }

    /* ── SENTRY AI TAB ── */
    .sentry-panel { padding: 28px 32px 0; display: flex; flex-direction: column; gap: 20px; }
    .sentry-status-bar {
      background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.18);
      border-radius: 12px; padding: 14px 20px;
      display: flex; align-items: center; gap: 12px;
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8);
    }
    .sentry-orb { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #c026d3, #7c3aed); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff; box-shadow: 0 0 16px rgba(192,38,211,0.4); flex-shrink: 0; }
    .chat-container {
      background: #0c0d11; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .chat-header {
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      display: flex; align-items: center; justify-content: space-between;
    }
    .chat-header-left { display: flex; align-items: center; gap: 10px; }
    .chat-ai-badge { font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.12em; }
    .neural-active { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; }
    .neural-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: blink 1.8s infinite; }
    .chat-messages {
      height: 380px; overflow-y: auto;
      padding: 24px 20px; display: flex; flex-direction: column; gap: 16px;
      scroll-behavior: smooth;
    }
    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
    .chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: rgba(255,255,255,0.18); text-align: center; }
    .chat-empty-icon { opacity: 0.4; }
    .chat-empty-text { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    .msg-bot {
      align-self: flex-start; max-width: 90%;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 4px 16px 16px 16px;
      padding: 14px 18px; font-size: 14px; line-height: 1.7;
      color: rgba(255,255,255,0.82);
      animation: fadeIn 0.3s ease;
    }
    .msg-user {
      align-self: flex-end; max-width: 80%;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      border-radius: 16px 16px 4px 16px;
      padding: 12px 18px; font-size: 14px; line-height: 1.6;
      color: #fff; font-weight: 500;
      animation: fadeIn 0.2s ease;
    }
    .typing-indicator { display: flex; gap: 5px; align-items: center; padding: 4px 0; }
    .typing-dot { width: 7px; height: 7px; border-radius: 50%; background: #7c3aed; animation: bounce 1.2s infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }
    .chat-input-row {
      padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(0,0,0,0.2);
      display: flex; gap: 10px; align-items: center;
    }
    .chat-input {
      flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 11px 16px;
      color: #e8eaf0; font-family: 'Space Grotesk', sans-serif; font-size: 14px;
      outline: none; transition: border-color 0.2s;
    }
    .chat-input:focus { border-color: rgba(192,38,211,0.4); }
    .chat-input::placeholder { color: rgba(255,255,255,0.22); }
    .chat-send-btn {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
    }
    .chat-send-btn.active { background: linear-gradient(135deg, #c026d3, #7c3aed); color: #fff; box-shadow: 0 0 16px rgba(192,38,211,0.35); }
    .chat-send-btn.active:hover { transform: scale(1.05); }
    .chat-send-btn.inactive { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.2); cursor: not-allowed; }

    /* ── BACK BUTTON ── */
    .back-btn {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.35);
      background: none; border: none; cursor: pointer;
      transition: color 0.2s; margin-bottom: 20px; padding: 0;
    }
    .back-btn:hover { color: rgba(255,255,255,0.8); }

    /* ── ANIMATIONS ── */
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popUp { 0%{opacity:0;transform:scale(0.94)} 100%{opacity:1;transform:scale(1)} }
    @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
  `

  return (
    <>
      <style>{STYLES}</style>

      <div className="page-wrap">

        {/* ── NAVBAR ── */}
        <nav className="nav-bar">
          <div className="nav-left">
            <div className="brand" onClick={() => router.push('/')}>
              <div className="brand-icon"><Shield size={17} color="#fff" /></div>
              <span className="brand-name">Cyber Sentry AI</span>
            </div>
            <div className="nav-divider" />
            <div className="nav-pill">
              <div className="nav-dot" />
              <Home size={13} /> Dashboard
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="user-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="user-avatar">{username[0]}</div>
              <span className="user-name">{username}</span>
              <ChevronDown size={14} color="rgba(255,255,255,0.35)" />
            </div>
            {profileOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-label">Signed in as</div>
                  <div className="dropdown-email">{user?.email}</div>
                </div>
                <button className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <Home size={14} color="#a78bfa" /> Dashboard
                </button>
                <button className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <Settings size={14} color="rgba(255,255,255,0.35)" /> Settings & API Keys
                </button>
                <button className="dropdown-item danger" onClick={signOut}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className="main-content">

          {/* ══ IDLE PHASE ══ */}
          {phase === 'idle' && (
            <>
              {/* Hero */}
              <div className="hero">
                <div className="hero-eyebrow">
                  <div className="nav-dot" /> System Active
                </div>
                <h1 className="hero-h1">
                  Welcome back,{' '}
                  <span className="hero-gradient">{username}</span>
                </h1>
                <p className="hero-sub">
                  Your security command center. Run scans, track vulnerabilities, and let AI patch your code automatically.
                </p>
              </div>

              {/* Stats */}
              <div className="stats-row">
                {[
                  { icon: <Terminal size={18} />, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', val: stats.total, label: 'Total Scans' },
                  { icon: <Bug size={18} />, color: '#db2777', bg: 'rgba(219,39,119,0.12)', val: stats.vulns, label: 'Vulnerabilities' },
                  { icon: <AlertTriangle size={18} />, color: '#ea580c', bg: 'rgba(234,88,12,0.12)', val: stats.crit, label: 'Critical / High' },
                  { icon: <Zap size={18} />, color: '#0d9488', bg: 'rgba(13,148,136,0.12)', val: stats.patched, label: 'Auto-Patched' },
                ].map((s, i) => (
                  <div className="stat-card" key={i}>
                    <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    <AnimatedCounter target={s.val} />
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Scanner */}
              <div className="scanner-wrap">
                <div className="scanner-mode-tabs">
                  <div className={`mode-tab ${scanMode === 'code' ? 'active' : ''}`} onClick={() => setScanMode('code')}>
                    <Code size={15} /> Paste Code
                  </div>
                  <div className={`mode-tab ${scanMode === 'url' ? 'active' : ''}`} onClick={() => setScanMode('url')}>
                    <Globe size={15} /> Website URL
                  </div>
                </div>
                <div className="scanner-body">
                  {scanMode === 'code' ? (
                    <>
                      <label className="form-label">Programming Language</label>
                      <select className="form-select" value={language} onChange={e => handleLanguageChange(e.target.value)}>
                        {Object.keys(CODE_SAMPLES).map(lang => <option key={lang}>{lang}</option>)}
                      </select>
                      <label className="form-label">Paste your code</label>
                      <textarea className="code-editor" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} />
                    </>
                  ) : (
                    <>
                      <label className="form-label">Website URL</label>
                      <input className="form-select" style={{ marginBottom: 10 }} placeholder="https://example.com" value={code} onChange={e => setCode(e.target.value)} />
                      <p className="url-hint">Enter the full URL of the website you want to scan for network-level vulnerabilities and missing security headers.</p>
                    </>
                  )}
                  <button className="scan-btn" onClick={startScan} disabled={!code.trim()}>
                    <Sparkles size={16} /> Start Security Scan
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ SCANNING PHASE ══ */}
          {phase === 'scanning' && (
            <div className="scanning-screen">
              <div className="scan-orb">
                <Sparkles size={34} color="#c026d3" />
              </div>
              <div>
                <h2 className="scan-h">Scanning in Progress</h2>
                <p className="scan-sub" style={{ marginTop: 6 }}>Analyzing for vulnerabilities — please wait</p>
              </div>
              <div className="scan-steps">
                {scanSteps.map((s, i) => (
                  <div key={i} className="scan-step-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="step-pip" />
                    {s}
                  </div>
                ))}
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(scanSteps.length / 4) * 100}%` }} />
              </div>
            </div>
          )}

          {/* ══ ALERT MODAL ══ */}
          {phase === 'alert' && (
            <div className="modal-bg">
              <div className="alert-box">
                <button className="alert-close" onClick={() => setPhase('report')}>✕</button>
                <div className="alert-icon-wrap"><Shield size={38} /></div>
                <h2 className="alert-title">Dangerous Code Detected</h2>
                <p className="alert-desc">
                  Found <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'critical').length} critical</strong> and{' '}
                  <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'high').length} high</strong> severity vulnerabilities requiring immediate attention.
                </p>
                <div className="alert-chip">
                  <AlertTriangle size={13} />
                  {vulns.filter(v => v.severity === 'critical').length} Critical Issues Found
                </div>
                <button className="alert-cta" onClick={() => setPhase('report')}>View Full Security Report →</button>
              </div>
            </div>
          )}

          {/* ══ REPORT PHASE ══ */}
          {phase === 'report' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="back-btn" onClick={() => setPhase('idle')}>
                ← Back to Dashboard
              </button>

              {/* Report header */}
              <div className="report-header">
                <div>
                  <div className="report-title-row">
                    <Shield size={22} color="#a78bfa" />
                    <h1 className="report-h">Scan Complete</h1>
                  </div>
                  <p className="report-meta">
                    Found {vulns.length} vulnerabilit{vulns.length === 1 ? 'y' : 'ies'} in 2.8s &nbsp;·&nbsp; {language}
                  </p>
                  <div className="badge-row">
                    {[
                      { sev: 'critical', count: vulns.filter(v => v.severity === 'critical').length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', dot: '#ef4444' },
                      { sev: 'high', count: vulns.filter(v => v.severity === 'high').length, color: '#f97316', bg: 'rgba(249,115,22,0.08)', dot: '#f97316' },
                      { sev: 'medium', count: vulns.filter(v => v.severity === 'medium').length, color: '#eab308', bg: 'rgba(234,179,8,0.08)', dot: '#eab308' },
                      { sev: 'low', count: 0, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', dot: '#60a5fa' },
                    ].map((b, i) => (
                      <div key={i} className="sev-badge" style={{ color: b.color, background: b.bg, borderColor: `${b.color}30` }}>
                        <div className="sev-dot" style={{ background: b.dot }} />
                        {b.count} {b.sev}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="btn-row" style={{ position: 'relative' }}>
                  <button className="btn-primary" onClick={() => setExportOpen(!exportOpen)}>
                    <Download size={14} /> Export & Share
                  </button>
                  {exportOpen && (
                    <div className="export-dropdown">
                      <div className="export-header">Select Export Format</div>
                      <button className="export-item" onClick={() => { navigator.clipboard.writeText(JSON.stringify(vulns, null, 2)); setExportOpen(false) }}>
                        <div className="export-icon" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><Copy size={14} /></div>
                        Copy JSON Report
                      </button>
                      <button className="export-item" onClick={() => setExportOpen(false)}>
                        <div className="export-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}><Download size={14} /></div>
                        Download PDF Brief
                      </button>
                      <button className="export-item" onClick={() => setExportOpen(false)}>
                        <div className="export-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}><FileCode2 size={14} /></div>
                        Open in VS Code
                      </button>
                    </div>
                  )}
                  <button className="btn-secondary" onClick={() => setPhase('idle')}>
                    <RotateCcw size={14} /> New Scan
                  </button>
                </div>
              </div>

              {/* Report body */}
              <div className="report-body" style={{ marginTop: 16 }}>
                {/* Tab bar */}
                <div className="tab-bar">
                  <div className={`tab-btn ${activeTab === 'vulns' ? 'active' : ''}`} onClick={() => setActiveTab('vulns')}>
                    <Bug size={14} /> Vulnerabilities
                    {vulns.length > 0 && (
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, marginLeft: 2 }}>
                        {vulns.length}
                      </span>
                    )}
                  </div>
                  <div className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`} onClick={() => setActiveTab('original')}>
                    <Eye size={14} /> Original Code
                  </div>
                  <div className={`tab-btn ${activeTab === 'corrected' ? 'active' : ''}`} onClick={() => setActiveTab('corrected')}>
                    <CheckCircle size={14} /> Corrected Code
                  </div>
                  <div className="tab-spacer" />
                  <div className={`sentry-tab-btn ${activeTab === 'sentry' ? 'active' : ''}`} onClick={() => setActiveTab('sentry')}>
                    <Sparkles size={14} /> Sentry AI
                  </div>
                </div>

                {/* ── Vulnerabilities Tab ── */}
                {activeTab === 'vulns' && (
                  <div className="vulns-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    {vulns.length === 0 ? (
                      <div className="empty-vulns">
                        <div className="empty-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle size={34} />
                        </div>
                        <h3 className="empty-h">System Secure</h3>
                        <p className="empty-p">Cyber Sentry AI deep scan returned zero critical findings. Your baseline security integrity is optimal.</p>
                      </div>
                    ) : vulns.map((v, i) => (
                      <div className="vuln-card" key={i}>
                        <div className="vuln-stripe" style={{ background: v.severity === 'critical' ? 'linear-gradient(to bottom, #ef4444, transparent)' : 'linear-gradient(to bottom, #f97316, transparent)' }} />
                        <div style={{ paddingLeft: 12 }}>
                          <div className="vuln-top">
                            <div>
                              <div className="vuln-badges">
                                <span className="vuln-sev" style={{ background: v.severity === 'critical' ? '#ef4444' : '#f97316', color: '#fff' }}>
                                  {v.severity}
                                </span>
                                <span className="vuln-id">V-ID: SY-{i + 102}</span>
                              </div>
                              <h3 className="vuln-name">{v.name}</h3>
                            </div>
                            <div className="vuln-line-tag">Entry: Line {v.line}</div>
                          </div>
                          <div className="vuln-grid">
                            <div className="vuln-section">
                              <div className="vuln-section-label" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <div className="label-dot" style={{ background: '#7c3aed' }} />
                                Intelligence Report
                              </div>
                              <div className="vuln-desc-box">{v.description}</div>
                            </div>
                            <div className="vuln-section">
                              <div className="vuln-section-label" style={{ color: 'rgba(52,211,153,0.7)' }}>
                                <div className="label-dot" style={{ background: '#10b981' }} />
                                Automated Mitigation
                              </div>
                              <div className="vuln-fix-box" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
                                {v.fix}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Original Code Tab ── */}
                {activeTab === 'original' && (
                  <div className="original-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="code-viewer">
                      <div className="code-viewer-header">
                        <div className="code-viewer-label">
                          <div className="code-viewer-dot" />
                          <span className="code-viewer-title">Source Code Analysis</span>
                        </div>
                        <span className="lang-tag">{language}</span>
                      </div>
                      <pre>{code}</pre>
                    </div>
                  </div>
                )}

                {/* ── Corrected Code Tab ── */}
                {activeTab === 'corrected' && (
                  <div className="corrected-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="diff-header-row">
                      <div>
                        <h3 className="diff-h">Neural Patch View</h3>
                        <p className="diff-sub">Comparing: Scanned Source (L) vs AI Corrected (R)</p>
                      </div>
                      <div className="auto-verified">
                        <Sparkles size={12} /> Auto-Correction Verified
                      </div>
                    </div>
                    <DiffViewer
                      original={code}
                      patched={scanMode === 'code' ? (CODE_SAMPLES[language]?.fixed || code) : 'Network hardening report generated.'}
                    />
                  </div>
                )}

                {/* ── Sentry AI Tab ── */}
                {activeTab === 'sentry' && (
                  <div className="sentry-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="sentry-status-bar">
                      <div className="sentry-orb">AI</div>
                      Sentry AI Agent: Operational &amp; Analyzing Threat Metrics
                    </div>
                    <div className="chat-container">
                      <div className="chat-header">
                        <div className="chat-header-left">
                          <div className="sentry-orb" style={{ width: 32, height: 32 }}>AI</div>
                          <span className="chat-ai-badge">Intelligence Hub</span>
                        </div>
                        <div className="neural-active">
                          <div className="neural-dot" /> Neural Link Active
                        </div>
                      </div>
                      <div className="chat-messages">
                        {chatMessages.length === 0 ? (
                          <div className="chat-empty">
                            <Sparkles size={40} className="chat-empty-icon" />
                            <p className="chat-empty-text">Initializing neural interface…</p>
                          </div>
                        ) : chatMessages.map((msg, i) => (
                          <div key={i} className={msg.role === 'user' ? 'msg-user' : 'msg-bot'}>
                            {msg.text.split('\n').map((line, li) => <p key={li} style={{ marginBottom: li < msg.text.split('\n').length - 1 ? 8 : 0 }}>{line}</p>)}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="msg-bot">
                            <div className="typing-indicator">
                              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="chat-input-row">
                        <input
                          className="chat-input"
                          placeholder="Type a meaningful security question..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendAIQuery()}
                        />
                        <button
                          className={`chat-send-btn ${isTyping || !chatInput.trim() ? 'inactive' : 'active'}`}
                          onClick={sendAIQuery}
                          disabled={isTyping || !chatInput.trim()}
                        >
                          <Sparkles size={17} />
                        </button>
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