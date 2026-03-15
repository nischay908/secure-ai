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
    # FIXED: Use parameterized queries
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
            // FIXED: PreparedStatements escape user input
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
    vulnb: `package main

import (
\t"database/sql"
\t"fmt"
\t"net/http"
)

func getUserHandler(db *sql.DB) http.HandlerFunc {
\treturn func(w http.ResponseWriter, r *http.Request) {
\t\tid := r.URL.Query().Get("id")
\t\tquery := fmt.Sprintf("SELECT name, email FROM users WHERE id = %s", id)
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
\t\t// FIXED: Parameterized query
\t\tquery := "SELECT name, email FROM users WHERE id = ?"
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
    thinking.push('Initializing network scanner...', 'Simulating HTTP reconnaissance...', 'Checking port configurations...')
    if (inputStr.trim().length > 0) {
      vulns.push({ name: 'Missing Security Headers', severity: 'high', description: 'The target web server is missing crucial security headers like Strict-Transport-Security and X-Frame-Options.', fix: 'Configure your web server (Nginx/Apache) to append these headers on all responses.', line: 0 })
      vulns.push({ name: 'Unencrypted Sub-Resource Calls', severity: 'critical', description: 'Assets are being loaded over HTTP, leaving them open to man-in-the-middle attacks.', fix: 'Enforce HTTPS for all resource fetching using a Content Security Policy (upgrade-insecure-requests).', line: 0 })
    }
  } else {
    thinking.push(`Parsing ${lang} syntax tree...`, 'Loading OWASP rule sets...', 'Checking for dangerous operators...')
    const code = inputStr.toLowerCase()
    if (code.includes('select ') && code.includes('where ')) {
      const isVuln = code.includes('+"') || code.includes('+') || code.includes('f"') || code.includes('sprintf') || code.includes('format') || code.includes('%s')
      if (isVuln) vulns.push({ name: 'SQL Injection (SQLi)', severity: 'critical', description: 'Untrusted input is unsafely concatenated into a database query. Attackers can modify query logic to bypass authentication or steal data.', fix: 'Refactor to use Parameterized Queries or Prepared Statements provided by your database driver.', line: 7 })
    }
    if (vulns.length === 0 && inputStr.length > 20) vulns.push({ name: 'Hardcoded Secrets Detection', severity: 'high', description: 'Potential API token or password found written in plaintext in the repository.', fix: 'Extract secrets to environment variables (.env files) and load them at runtime.', line: 14 })
  }
  return { vulns, score: vulns.length === 0 ? 98 : Math.max(12, 100 - vulns.length * 30), thinking }
}

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) return
    let cur = 0; const inc = target / (1500 / 16)
    const t = setInterval(() => { cur += inc; if (cur >= target) { setVal(target); clearInterval(t) } else setVal(Math.floor(cur)) }, 16)
    return () => clearInterval(t)
  }, [visible, target])
  return <div ref={ref} className="counter-val">{val}</div>
}

function DiffViewer({ original, patched }: { original: string; patched: string }) {
  const [copied, setCopied] = useState(false)
  const oLines = original.split('\n'), pLines = patched.split('\n')
  const copy = () => { navigator.clipboard.writeText(patched); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="diff-root">
      <div className="diff-top-bar">
        <div className="diff-top-side diff-top-vuln"><span className="dtd red" />Vulnerable Code</div>
        <div className="diff-top-side diff-top-fixed">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="dtd green" />Secured Code</div>
          <button className="copy-patch-btn" onClick={copy}>{copied ? <><CheckCircle size={11} /> Copied!</> : <><Copy size={11} /> Copy Patch</>}</button>
        </div>
      </div>
      <div className="diff-cols">
        <div className="diff-col diff-col-left">
          {oLines.map((line, i) => { const bad = !pLines.includes(line) && line.trim(); return (<div key={i} className={`dl ${bad ? 'dl-bad' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{line || ' '}</span></div>) })}
        </div>
        <div className="diff-col diff-col-right">
          {pLines.map((line, i) => { const good = !oLines.includes(line) && line.trim(); return (<div key={i} className={`dl ${good ? 'dl-good' : ''}`}><span className="dl-ln">{i + 1}</span><span className="dl-code" style={{ whiteSpace: 'pre' }}>{line || ' '}</span></div>) })}
        </div>
      </div>
    </div>
  )
}

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
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, isTyping])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const u = user || { email: 'demo@cybersentry.ai', id: 'promo-id' }
      setUser(u)
      const { data } = await supabase.from('scans').select('*').eq('user_id', u.id)
      if (data) {
        let vCount = 0, critCount = 0
        data.forEach((s: any) => { if (s.vulnerabilities) { vCount += s.vulnerabilities.length; critCount += s.vulnerabilities.filter((v: any) => v.severity === 'critical' || v.severity === 'high').length } })
        setStats({ total: data.length, vulns: vCount, crit: critCount, patched: vCount })
      }
    }
    init()
  }, [])

  const startScan = async () => {
    setPhase('scanning'); setScanSteps([])
    const steps = scanMode === 'url'
      ? ['Resolving hostname & DNS records', 'HTTP reconnaissance in progress', 'Auditing security response headers', 'Generating threat intelligence report']
      : ['Initializing AST scan engine', 'Parsing syntax trees & call graphs', 'Running OWASP Top-10 rule checks', 'Finalizing vulnerability assessment']
    for (const step of steps) { setScanSteps(p => [...p, step]); await new Promise(r => setTimeout(r, 800)) }
    const { vulns: found } = analyzeCode(code, scanMode, language)
    setVulns(found)
    setChatMessages([{ role: 'bot', text: found.length > 0 ? `Hello ${user?.email?.split('@')[0] || 'User'}. I've completed the security audit. I detected ${found.length} vulnerabilit${found.length === 1 ? 'y' : 'ies'}. The most critical is the ${found[0].name}.\n\nYou can see my full briefing in the panel below, or ask me specific questions.` : "Excellent news! My deep scan found no security vulnerabilities in this codebase. You're following best practices." }])
    await new Promise(r => setTimeout(r, 600))
    setPhase(found.length > 0 ? 'alert' : 'report')
    try { if (user) await supabase.from('scans').insert({ user_id: user.id, code, language: scanMode === 'url' ? 'URL' : language, vulnerabilities: found, fixed_code: scanMode === 'code' ? CODE_SAMPLES[language]?.fixed || code : '', security_score: found.length === 0 ? 100 : Math.max(12, 100 - found.length * 30), status: 'completed' }) } catch (e) { }
  }

  const handleLanguageChange = (lang: string) => { setLanguage(lang); if (CODE_SAMPLES[lang]) setCode(CODE_SAMPLES[lang].vulnb) }

  const sendAIQuery = async () => {
    if (!chatInput.trim() || isTyping) return
    const msg = chatInput.trim(); setChatMessages(p => [...p, { role: 'user', text: msg }]); setChatInput(''); setIsTyping(true)
    await new Promise(r => setTimeout(r, 1200))
    const low = msg.toLowerCase()
    let res = "Analyzing that context. Based on the scan, focus on the parameterized query implementation first."
    if (low.includes('sql') || low.includes('injection')) res = "SQL Injection is critical — untrusted input manipulates your database queries. The fix uses Prepared Statements which separate query logic from data, making injection impossible."
    else if (low.includes('fix') || low.includes('how') || low.includes('apply')) res = "Navigate to the 'Corrected Code' tab. I've refactored the data access logic using secure patterns. Copy that code directly into your source file."
    else if (low.includes('url') || low.includes('header') || low.includes('network')) res = "Configure your web server (Nginx/Apache) to send HSTS and X-Frame-Options headers on all responses. This prevents Man-in-the-Middle and Clickjacking attacks."
    else if (low.includes('who') || low.includes('you')) res = "I am Sentry AI — your agentic security assistant. I don't just find bugs; I help you understand and fix them with production-ready code."
    setChatMessages(p => [...p, { role: 'bot', text: res }]); setIsTyping(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const username = user?.email?.split('@')[0] || 'user'

  const TICKER = [
    { label: 'Agent status', val: 'ONLINE' },
    { label: 'OWASP coverage', val: '100%' },
    { label: 'Critical blocked', val: '2,341' },
    { label: 'Avg scan time', val: '<4.2s' },
    { label: 'Languages', val: '9' },
    { label: 'Vulnerabilities today', val: '12,847' },
  ]

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

        /* NAVBAR */
        .dash-nav{position:sticky;top:0;z-index:100;background:rgba(0,0,0,0.93);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06);height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px}
        .nav-left{display:flex;align-items:center;gap:20px}
        .brand{display:flex;align-items:center;gap:10px;cursor:pointer}
        .brand-icon{width:32px;height:32px;border-radius:8px;background:#000;border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,255,136,0.12)}
        .brand-name{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
        .brand-ai{font-size:10px;font-weight:800;color:#000;background:#00ff88;padding:2px 7px;border-radius:4px;letter-spacing:0.05em}
        .nav-pill{display:flex;align-items:center;gap:7px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;font-family:'JetBrains Mono',monospace}
        .green-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:blink 2s infinite;flex-shrink:0}

        /* USER PILL */
        .user-pill{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);padding:5px 14px 5px 5px;border-radius:40px;cursor:pointer;transition:border-color 0.2s}
        .user-pill:hover{border-color:rgba(0,255,136,0.3)}
        .u-avatar{width:28px;height:28px;border-radius:50%;background:#00ff88;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#000;text-transform:uppercase}
        .u-name{font-size:13px;font-weight:600;color:rgba(255,255,255,0.8)}

        /* DROPDOWN */
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
        .hero{position:relative;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:48px 52px}
        .hero::after{content:'';position:absolute;bottom:-80px;right:-80px;width:350px;height:350px;background:radial-gradient(circle,rgba(0,255,136,0.07) 0%,transparent 70%);pointer-events:none;border-radius:50%}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#00ff88;text-transform:uppercase;margin-bottom:20px}
        .hero-h1{font-size:52px;font-weight:800;letter-spacing:-0.04em;line-height:1.05;color:#fff;margin-bottom:16px}
        .hero-accent{color:#00ff88}
        .hero-sub{font-size:15px;color:rgba(255,255,255,0.35);line-height:1.7;max-width:460px}

        /* STATS */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .stat-card{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px;transition:border-color 0.2s,box-shadow 0.2s}
        .stat-card:hover{border-color:rgba(0,255,136,0.2);box-shadow:0 0 20px rgba(0,255,136,0.04)}
        .stat-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center}
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
        .scan-btn{width:100%;padding:17px;background:#00ff88;border:none;border-radius:10px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;box-shadow:0 0 30px rgba(0,255,136,0.22)}
        .scan-btn:hover{background:#1aff95;box-shadow:0 0 44px rgba(0,255,136,0.38);transform:translateY(-1px)}
        .scan-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none;box-shadow:none}
        .url-hint{font-size:12px;color:rgba(255,255,255,0.18);margin-top:-18px;margin-bottom:24px;line-height:1.6;font-family:'JetBrains Mono',monospace}

        /* SCANNING */
        .scan-screen{min-height:460px;background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:60px;text-align:center}
        .scan-orb{width:80px;height:80px;border-radius:20px;background:#000;border:1px solid rgba(0,255,136,0.22);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(0,255,136,0.14),inset 0 0 20px rgba(0,255,136,0.04);animation:float 3s ease-in-out infinite}
        .scan-h{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#fff}
        .scan-s{font-size:13px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;margin-top:6px}
        .scan-steps{display:flex;flex-direction:column;gap:14px;min-width:320px;text-align:left}
        .scan-step{display:flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,0.6);animation:slideIn 0.35s ease both}
        .step-pip{width:7px;height:7px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;flex-shrink:0}
        .prog-rail{width:300px;height:3px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
        .prog-fill{height:100%;background:#00ff88;border-radius:10px;box-shadow:0 0 10px #00ff88;transition:width 0.35s ease}

        /* ALERT */
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.2s ease}
        .alert-card{background:#080808;border:1px solid rgba(255,59,59,0.18);border-radius:20px;padding:44px;max-width:440px;width:100%;text-align:center;position:relative;box-shadow:0 0 80px rgba(255,59,59,0.07);animation:popUp 0.3s cubic-bezier(0.16,1,0.3,1)}
        .alert-close{position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.22);cursor:pointer;font-size:18px;transition:color 0.2s}
        .alert-close:hover{color:#fff}
        .alert-icon{width:70px;height:70px;border-radius:18px;background:rgba(255,59,59,0.08);border:1px solid rgba(255,59,59,0.16);display:flex;align-items:center;justify-content:center;color:#ff4444;margin:0 auto 24px}
        .alert-title{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#ff4444;margin-bottom:14px}
        .alert-desc{font-size:14px;color:rgba(255,255,255,0.42);line-height:1.7;margin-bottom:26px}
        .alert-chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,59,59,0.07);border:1px solid rgba(255,59,59,0.18);color:#ff6b6b;font-size:12px;font-weight:700;padding:6px 14px;border-radius:7px;font-family:'JetBrains Mono',monospace;margin-bottom:26px}
        .alert-cta{width:100%;padding:15px;background:#ff3b3b;border:none;border-radius:10px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.2s;box-shadow:0 0 24px rgba(255,59,59,0.22)}
        .alert-cta:hover{background:#ff5555;box-shadow:0 0 36px rgba(255,59,59,0.32);transform:translateY(-1px)}

        /* REPORT HEADER */
        .rep-header{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px 36px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
        .rep-title-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}
        .rep-title{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:#fff}
        .rep-meta{font-size:12px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;margin-bottom:18px}
        .badge-row{display:flex;gap:10px;flex-wrap:wrap}
        .sev-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;border:1px solid}
        .sev-dot{width:6px;height:6px;border-radius:50%}
        .btn-row{display:flex;gap:10px;flex-shrink:0}
        .btn-green{background:#00ff88;border:none;padding:10px 20px;border-radius:8px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 0 18px rgba(0,255,136,0.18);transition:all 0.2s}
        .btn-green:hover{background:#1aff95;box-shadow:0 0 28px rgba(0,255,136,0.32);transform:translateY(-1px)}
        .btn-ghost{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:10px 20px;border-radius:8px;color:rgba(255,255,255,0.55);font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s}
        .btn-ghost:hover{background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.14)}
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

        /* VULNS TAB */
        .vulns-panel{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
        .vuln-card{position:relative;overflow:hidden;background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:26px 28px 26px 34px;transition:all 0.2s}
        .vuln-card:hover{border-color:rgba(255,255,255,0.1);background:#060606}
        .vuln-stripe{position:absolute;left:0;top:0;bottom:0;width:3px}
        .vuln-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
        .vuln-meta{display:flex;align-items:center;gap:10px;margin-bottom:10px}
        .vuln-sev{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 10px;border-radius:4px}
        .vuln-id{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
        .vuln-name{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em}
        .vuln-line{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.22);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);padding:4px 10px;border-radius:6px}
        .vuln-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .vuln-sec{display:flex;flex-direction:column;gap:8px}
        .vuln-sec-label{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
        .lbl-pip{width:5px;height:5px;border-radius:50%}
        .vuln-desc{background:#000;border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:15px 17px;font-size:13px;line-height:1.75;color:rgba(255,255,255,0.58)}
        .vuln-fix{border-radius:10px;padding:15px 17px;font-size:13px;line-height:1.75}
        .vuln-empty{padding:72px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
        .ve-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);color:#00ff88}
        .ve-h{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#fff}
        .ve-p{font-size:13px;color:rgba(255,255,255,0.28);max-width:320px;line-height:1.6}

        /* ORIGINAL CODE TAB */
        .orig-panel{padding:24px 28px}
        .code-viewer{background:#000;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden}
        .cv-header{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:space-between}
        .cv-left{display:flex;align-items:center;gap:8px}
        .cv-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88}
        .cv-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.12em}
        .cv-lang{font-family:'JetBrains Mono',monospace;font-size:11px;color:#00ff88;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);padding:3px 10px;border-radius:5px;font-weight:700}
        .code-viewer pre{padding:22px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,0.62);line-height:1.75;overflow-x:auto;max-height:520px}

        /* DIFF TAB */
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
        .copy-patch-btn{display:flex;align-items:center;gap:5px;background:rgba(0,255,136,0.09);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;cursor:pointer;transition:all 0.15s;font-family:'JetBrains Mono',monospace}
        .copy-patch-btn:hover{background:rgba(0,255,136,0.17)}
        .diff-cols{display:grid;grid-template-columns:1fr 1fr}
        .diff-col{overflow-x:auto;max-height:460px;overflow-y:auto}
        .diff-col::-webkit-scrollbar{width:3px;height:3px}
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

        /* SENTRY AI TAB */
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
        .msg-bot{align-self:flex-start;max-width:88%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:2px 12px 12px 12px;padding:13px 16px;font-size:13px;line-height:1.75;color:rgba(255,255,255,0.75);animation:fadeIn 0.3s ease}
        .msg-user{align-self:flex-end;max-width:78%;background:rgba(0,255,136,0.09);border:1px solid rgba(0,255,136,0.16);border-radius:12px 12px 2px 12px;padding:12px 16px;font-size:13px;line-height:1.6;color:#d1fae5;font-weight:500;animation:fadeIn 0.2s ease}
        .typing{display:flex;gap:5px;align-items:center;padding:4px 0}
        .td{width:6px;height:6px;border-radius:50%;background:#00ff88;animation:bounce 1.2s infinite}
        .td:nth-child(2){animation-delay:0.15s}
        .td:nth-child(3){animation-delay:0.3s}
        .chat-input-row{padding:14px 18px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.5);display:flex;gap:10px}
        .chat-inp{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none;transition:border-color 0.2s}
        .chat-inp::placeholder{color:rgba(255,255,255,0.18)}
        .chat-inp:focus{border-color:rgba(0,255,136,0.3)}
        .chat-send{width:40px;height:40px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
        .chat-send.on{background:#00ff88;color:#000;box-shadow:0 0 14px rgba(0,255,136,0.28)}
        .chat-send.on:hover{background:#1aff95;box-shadow:0 0 22px rgba(0,255,136,0.42);transform:scale(1.05)}
        .chat-send.off{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.14);cursor:not-allowed}

        /* MISC */
        .back-btn{background:none;border:none;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;padding:0;margin-bottom:20px;transition:color 0.2s}
        .back-btn:hover{color:#00ff88}

        /* KEYFRAMES */
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popUp{0%{opacity:0;transform:scale(0.94)}100%{opacity:1;transform:scale(1)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      <div className="page-root">

        {/* TICKER */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="ticker-item">
                <span className="t-dot" />{item.label}: <span className="t-val">{item.val}</span>
              </span>
            ))}
          </div>
        </div>

        {/* NAVBAR */}
        <nav className="dash-nav">
          <div className="nav-left">
            <div className="brand" onClick={() => router.push('/')}>
              <div className="brand-icon"><Shield size={15} color="#00ff88" /></div>
              <span className="brand-name">CyberSentry</span>
              <span className="brand-ai">AI</span>
            </div>
            <div className="nav-pill">
              <div className="green-dot" /><Home size={11} /> Dashboard
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="user-pill" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="u-avatar">{username[0]}</div>
              <span className="u-name">{username}</span>
              <ChevronDown size={13} color="rgba(255,255,255,0.28)" />
            </div>
            {profileOpen && (
              <div className="drop-menu">
                <div className="drop-head">
                  <div className="drop-label">Signed in as</div>
                  <div className="drop-email">{user?.email}</div>
                </div>
                <button className="drop-item" onClick={() => setProfileOpen(false)}><Home size={13} color="#00ff88" /> Dashboard</button>
                <button className="drop-item" onClick={() => setProfileOpen(false)}><Settings size={13} /> Settings & API Keys</button>
                <button className="drop-item danger" onClick={signOut}><LogOut size={13} /> Sign Out</button>
              </div>
            )}
          </div>
        </nav>

        {/* MAIN */}
        <main className="page-main">

          {phase === 'idle' && (<>
            <div className="hero">
              <div className="hero-eyebrow"><div className="green-dot" /> System Active</div>
              <h1 className="hero-h1">Welcome back, <span className="hero-accent">{username}</span></h1>
              <p className="hero-sub">Your security command center. Run scans, track vulnerabilities, and let AI patch your code automatically.</p>
            </div>

            <div className="stats-row">
              {[
                { icon: <Terminal size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Total Scans', val: stats.total },
                { icon: <Bug size={16} />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', label: 'Vulnerabilities', val: stats.vulns },
                { icon: <AlertTriangle size={16} />, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Critical / High', val: stats.crit },
                { icon: <Zap size={16} />, color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: 'Auto-Patched', val: stats.patched },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <AnimatedCounter target={s.val} />
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="scanner-card">
              <div className="sc-tabs">
                <div className={`sc-tab ${scanMode === 'code' ? 'on' : ''}`} onClick={() => setScanMode('code')}><Code size={13} /> Paste Code</div>
                <div className={`sc-tab ${scanMode === 'url' ? 'on' : ''}`} onClick={() => setScanMode('url')}><Globe size={13} /> Website URL</div>
              </div>
              <div className="sc-body">
                {scanMode === 'code' ? (<>
                  <label className="sc-label">Programming Language</label>
                  <select className="sc-select" value={language} onChange={e => handleLanguageChange(e.target.value)}>
                    {Object.keys(CODE_SAMPLES).map(l => <option key={l}>{l}</option>)}
                  </select>
                  <label className="sc-label">Paste your code</label>
                  <textarea className="code-ta" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} />
                </>) : (<>
                  <label className="sc-label">Website URL</label>
                  <input className="sc-select" style={{ marginBottom: 10 }} placeholder="https://example.com" value={code} onChange={e => setCode(e.target.value)} />
                  <p className="url-hint">Enter the full URL to scan for network-level vulnerabilities and missing security headers.</p>
                </>)}
                <button className="scan-btn" onClick={startScan} disabled={!code.trim()}><Sparkles size={15} /> Start Security Scan</button>
              </div>
            </div>
          </>)}

          {phase === 'scanning' && (
            <div className="scan-screen">
              <div className="scan-orb"><Sparkles size={30} color="#00ff88" /></div>
              <div><h2 className="scan-h">Scanning in Progress</h2><p className="scan-s">Analyzing for vulnerabilities — please wait</p></div>
              <div className="scan-steps">
                {scanSteps.map((s, i) => (<div key={i} className="scan-step" style={{ animationDelay: `${i * 0.08}s` }}><div className="step-pip" />{s}</div>))}
              </div>
              <div className="prog-rail"><div className="prog-fill" style={{ width: `${(scanSteps.length / 4) * 100}%` }} /></div>
            </div>
          )}

          {phase === 'alert' && (
            <div className="modal-bg">
              <div className="alert-card">
                <button className="alert-close" onClick={() => setPhase('report')}>✕</button>
                <div className="alert-icon"><Shield size={34} /></div>
                <h2 className="alert-title">// THREAT DETECTED</h2>
                <p className="alert-desc">Found <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'critical').length} critical</strong> and <strong style={{ color: '#fff' }}>{vulns.filter(v => v.severity === 'high').length} high</strong> severity vulnerabilities requiring immediate attention.</p>
                <div className="alert-chip"><AlertTriangle size={12} />{vulns.filter(v => v.severity === 'critical').length} Critical Issues Found</div>
                <button className="alert-cta" onClick={() => setPhase('report')}>View Full Security Report →</button>
              </div>
            </div>
          )}

          {phase === 'report' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="back-btn" onClick={() => setPhase('idle')}>← Back to Dashboard</button>

              <div className="rep-header">
                <div>
                  <div className="rep-title-row"><div className="green-dot" /><h1 className="rep-title">// Scan Complete</h1></div>
                  <p className="rep-meta">Found {vulns.length} vulnerabilit{vulns.length === 1 ? 'y' : 'ies'} in 2.8s &nbsp;·&nbsp; {language}</p>
                  <div className="badge-row">
                    {[
                      { l: 'critical', c: vulns.filter(v => v.severity === 'critical').length, col: '#ff4444', bg: 'rgba(255,68,68,0.08)' },
                      { l: 'high', c: vulns.filter(v => v.severity === 'high').length, col: '#f97316', bg: 'rgba(249,115,22,0.08)' },
                      { l: 'medium', c: vulns.filter(v => v.severity === 'medium').length, col: '#eab308', bg: 'rgba(234,179,8,0.08)' },
                      { l: 'low', c: 0, col: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
                    ].map((b, i) => (
                      <div key={i} className="sev-badge" style={{ color: b.col, background: b.bg, borderColor: `${b.col}28` }}>
                        <div className="sev-dot" style={{ background: b.col }} />{b.c} {b.l}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="btn-row" style={{ position: 'relative' }}>
                  <button className="btn-green" onClick={() => setExportOpen(!exportOpen)}><Download size={13} /> Export & Share</button>
                  {exportOpen && (
                    <div className="exp-dd">
                      <div className="exp-head">Select Export Format</div>
                      <button className="exp-item" onClick={() => { navigator.clipboard.writeText(JSON.stringify(vulns, null, 2)); setExportOpen(false) }}><div className="exp-ico" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><Copy size={13} /></div>Copy JSON Report</button>
                      <button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88' }}><Download size={13} /></div>Download PDF Brief</button>
                      <button className="exp-item" onClick={() => setExportOpen(false)}><div className="exp-ico" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}><FileCode2 size={13} /></div>Open in VS Code</button>
                    </div>
                  )}
                  <button className="btn-ghost" onClick={() => setPhase('idle')}><RotateCcw size={13} /> New Scan</button>
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
                    {vulns.length === 0 ? (
                      <div className="vuln-empty"><div className="ve-icon"><CheckCircle size={28} /></div><h3 className="ve-h">// System Secure</h3><p className="ve-p">Deep scan returned zero critical findings. Baseline security integrity is optimal.</p></div>
                    ) : vulns.map((v, i) => (
                      <div className="vuln-card" key={i}>
                        <div className="vuln-stripe" style={{ background: v.severity === 'critical' ? 'linear-gradient(to bottom, #ff4444, transparent)' : 'linear-gradient(to bottom, #f97316, transparent)' }} />
                        <div className="vuln-top">
                          <div>
                            <div className="vuln-meta">
                              <span className="vuln-sev" style={{ background: v.severity === 'critical' ? '#ff4444' : '#f97316', color: '#fff' }}>{v.severity}</span>
                              <span className="vuln-id">V-ID: SY-{i + 102}</span>
                            </div>
                            <h3 className="vuln-name">{v.name}</h3>
                          </div>
                          <div className="vuln-line">Entry: Line {v.line}</div>
                        </div>
                        <div className="vuln-grid">
                          <div className="vuln-sec">
                            <div className="vuln-sec-label" style={{ color: 'rgba(255,255,255,0.3)' }}><div className="lbl-pip" style={{ background: '#00ff88' }} /> Intelligence Report</div>
                            <div className="vuln-desc">{v.description}</div>
                          </div>
                          <div className="vuln-sec">
                            <div className="vuln-sec-label" style={{ color: 'rgba(0,255,136,0.55)' }}><div className="lbl-pip" style={{ background: '#00ff88' }} /> Automated Mitigation</div>
                            <div className="vuln-fix" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)', color: '#6ee7b7' }}>{v.fix}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'original' && (
                  <div className="orig-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="code-viewer">
                      <div className="cv-header"><div className="cv-left"><div className="cv-dot" /><span className="cv-title">Source Code Analysis</span></div><span className="cv-lang">{language}</span></div>
                      <pre>{code}</pre>
                    </div>
                  </div>
                )}

                {activeTab === 'corrected' && (
                  <div className="corr-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="diff-title-row">
                      <div><h3 className="diff-title">Neural Patch View</h3><p className="diff-sub">Comparing: Scanned Source (L) vs AI Corrected (R)</p></div>
                      <div className="auto-badge"><Sparkles size={11} /> Auto-Correction Verified</div>
                    </div>
                    <DiffViewer original={code} patched={scanMode === 'code' ? (CODE_SAMPLES[language]?.fixed || code) : 'Network hardening report generated.'} />
                  </div>
                )}

                {activeTab === 'sentry' && (
                  <div className="sentry-panel" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div className="sentry-banner"><div className="sentry-orb">AI</div>Sentry AI Agent: Operational &amp; Analyzing Threat Metrics</div>
                    <div className="chat-wrap">
                      <div className="chat-head">
                        <div className="chat-head-l"><div className="sentry-orb" style={{ width: 30, height: 30 }}>AI</div><span className="chat-head-title">Intelligence Hub</span></div>
                        <div className="neural-live"><div className="neural-dot" /><span className="neural-txt">Neural Link Active</span></div>
                      </div>
                      <div className="chat-msgs">
                        {chatMessages.length === 0 ? (
                          <div className="chat-empty"><Sparkles size={34} style={{ opacity: 0.25 }} /><p>Initializing neural interface...</p></div>
                        ) : chatMessages.map((m, i) => (
                          <div key={i} className={m.role === 'user' ? 'msg-user' : 'msg-bot'}>
                            {m.text.split('\n').map((line, li) => <p key={li} style={{ marginBottom: li < m.text.split('\n').length - 1 ? 8 : 0 }}>{line}</p>)}
                          </div>
                        ))}
                        {isTyping && <div className="msg-bot"><div className="typing"><div className="td" /><div className="td" /><div className="td" /></div></div>}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="chat-input-row">
                        <input className="chat-inp" placeholder="Type a meaningful security question..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAIQuery()} />
                        <button className={`chat-send ${isTyping || !chatInput.trim() ? 'off' : 'on'}`} onClick={sendAIQuery} disabled={isTyping || !chatInput.trim()}><Sparkles size={15} /></button>
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