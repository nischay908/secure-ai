'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Code, Globe, Shield, Home, User, AlertTriangle, Bug, Sparkles, CheckCircle, ChevronDown, Download, RotateCcw, LogOut, Settings, Copy, FileCode2 } from 'lucide-react'

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
	"database/sql"
	"fmt"
	"net/http"
)

func getUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		// VULNERABLE: Sprintf concat
		query := fmt.Sprintf("SELECT name, email FROM users WHERE id = %s", id)
		
		var name, email string
		err := db.QueryRow(query).Scan(&name, &email)
		if err != nil {
			http.Error(w, "User not found", 404)
			return
		}
		fmt.Fprintf(w, "User: %s", name)
	}
}`,
    fixed: `package main

import (
	"database/sql"
	"fmt"
	"net/http"
)

func getUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		// FIXED: Use parameterized query (?) in place of args
		query := "SELECT name, email FROM users WHERE id = ?"
		
		var name, email string
		err := db.QueryRow(query, id).Scan(&name, &email)
		if err != nil {
			http.Error(w, "User not found", 404)
			return
		}
		fmt.Fprintf(w, "User: %s", name)
	}
}`
  }
}


function analyzeCode(inputStr: string, mode: 'code' | 'url', lang: string): {vulns:any[];score:number;thinking:string[]} {
  const thinking: string[] = []
  const vulns: any[] = []

  if (mode === 'url') {
    thinking.push('Initializing network scanner against target URL...', 'Simulating HTTP reconnaissance...', 'Checking default port configurations...')
    if (inputStr.trim().length > 0) {
      vulns.push({
        name: 'Missing Security Headers',
        severity: 'high',
        description: 'The target web server is missing crucial security headers like Strict-Transport-Security and X-Frame-Options.',
        fix: 'Configure your web server (Nginx/Apache) or application framework to append these headers on all responses.',
        line: 0
      })
      vulns.push({
        name: 'Unencrypted Sub-Resource Calls',
        severity: 'critical',
        description: 'Network sniffer detected assets being loaded over HTTP paths, leaving them open to man-in-the-middle attacks.',
        fix: 'Enforce HTTPS for all resource fetching by rewriting URLs to HTTPS or using a Content Security Policy (upgrade-insecure-requests).',
        line: 0
      })
    }
  } else {
    thinking.push(`Parsing ${lang} syntax tree...`, 'Loading language-specific OWASP rule sets...', 'Checking for dangerous operators...')
    
    // Check for SQLi patterns based on language select
    const code = inputStr.toLowerCase()
    
    if (code.includes('select ') && code.includes('where ')) {
      const isVuln = code.includes('+"') || code.includes('+"') || code.includes('+') || code.includes('f"') || code.includes('sprintf') || code.includes('format') || code.includes('%s')
      
      if (isVuln) {
        vulns.push({
          name: 'SQL Injection (SQLi)',
          severity: 'critical',
          description: 'Untrusted input is unsafely concatenated directly into a database query. Attackers can modify the query logic to bypass authentication or steal data.',
          fix: 'Refactor to use Parameterized Queries or Prepared Statements provided by your database driver.',
          line: 7
        })
      }
    }
    
    // Add generic ones if no SQLi found to demo UI
    if (vulns.length === 0 && inputStr.length > 20) {
      vulns.push({
        name: 'Hardcoded Secrets Detection',
        severity: 'high',
        description: 'Potential API token or password found written in plaintext in the repository.',
        fix: 'Extract secrets to environment variables (.env files) and load them into application memory at runtime.',
        line: 14
      })
    }
  }

  const score = vulns.length === 0 ? 98 : Math.max(12, 100 - (vulns.length * 30))
  return {vulns, score, thinking}
}

/* ─────────────────────────────────────────────────
   ANIMATED COUNTER COMPONENT
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
    let start = 0
    const duration = 1500
    const step = 16
    const steps = duration / step
    const inc = target / steps
    let cur = 0
    const timer = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(cur))
    }, step)
    return () => clearInterval(timer)
  }, [visible, target])

  return <div ref={ref} className="text-4xl font-extrabold font-outfit tracking-tight">{val}</div>
}

/* ─────────────────────────────────────────────────
   DIFF VIEWER
───────────────────────────────────────────────── */
function DiffViewer({original,patched}:{original:string;patched:string}) {
  const oLines = original.split('\n'), pLines = patched.split('\n')
  return (
    <div className="grid grid-cols-2 gap-[1px] bg-white/5 rounded-xl border border-white/5 overflow-hidden">
      <div>
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs font-bold text-red-400 font-mono flex items-center gap-2">
          <span>—</span> Vulnerable Code
        </div>
        <div className="p-3 bg-[#08050a] overflow-auto max-h-[400px]">
          {oLines.map((line,i)=>{
            const bad=!pLines.includes(line)&&line.trim()
            return(
              <div key={i} className={`flex gap-3 font-mono text-xs leading-relaxed ${bad?'bg-red-500/10 border-l-2 border-red-500 pl-1.5':'border-l-2 border-transparent pl-1.5'}`}>
                <span className="text-white/20 min-w-[20px] select-none text-right">{i+1}</span>
                <span className={bad?'text-red-300':'text-white/40'} style={{whiteSpace:'pre'}}>{line||' '}</span>
              </div>
          )})}
        </div>
      </div>
      <div>
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs font-bold text-emerald-400 font-mono flex items-center gap-2">
          <span>+</span> Secured Code
        </div>
        <div className="p-3 bg-[#050a08] overflow-auto max-h-[400px]">
          {pLines.map((line,i)=>{
            const good=!oLines.includes(line)&&line.trim()
            return(
              <div key={i} className={`flex gap-3 font-mono text-xs leading-relaxed ${good?'bg-emerald-500/10 border-l-2 border-emerald-500 pl-1.5':'border-l-2 border-transparent pl-1.5'}`}>
                <span className="text-white/20 min-w-[20px] select-none text-right">{i+1}</span>
                <span className={good?'text-emerald-400':'text-white/40'} style={{whiteSpace:'pre'}}>{line||' '}</span>
              </div>
          )})}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
───────────────────────────────────────────────── */
export default function UnifiedDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  // Stats state
  const [stats, setStats] = useState({ total: 0, vulns: 0, crit: 0, patched: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Scan state
  const [language, setLanguage] = useState('JavaScript')
  const [code, setCode] = useState(CODE_SAMPLES['JavaScript'].vulnb)
  const [scanMode, setScanMode] = useState<'code' | 'url'>('code')
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'alert' | 'report'>('idle')
  const [scanSteps, setScanSteps] = useState<string[]>([])
  const [vulns, setVulns] = useState<any[]>([])
  
  // UI Dropdowns
  const [profileOpen, setProfileOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Report state
  const [activeTab, setActiveTab] = useState<'vulns' | 'original' | 'corrected' | 'sentry'>('sentry')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        // Fallback for demo when not logged in
        setUser({ email: 'demo@cybersentry.ai', id: 'promo-id' })
      }

      // Fetch actual stats from history
      const { data } = await supabase.from('scans').select('*').eq('user_id', user ? user.id : 'promo-id')
      if (data) {
        let total = data.length
        let vCount = 0
        let critCount = 0
        data.forEach(s => {
          if(s.vulnerabilities) {
            vCount += s.vulnerabilities.length
            critCount += s.vulnerabilities.filter((v:any)=>v.severity==='critical'||v.severity==='high').length
          }
        })
        setStats({ total, vulns: vCount, crit: critCount, patched: vCount })
      }
      setLoadingStats(false)
    }
    init()
  }, [])

  const startScan = async () => {
    setPhase('scanning')
    setScanSteps([])
    
    // Animate scan steps
    const steps = scanMode === 'url' 
      ? ['Resolving hostname', 'Reconnaissance phase', 'Scanning for security headers', 'Finalizing network report']
      : ['Initializing scan engine', 'Analyzing syntax trees', 'Running vulnerability checks', 'Applying OWASP rulesets']
    
    for (const step of steps) {
      setScanSteps(p => [...p, step])
      await new Promise(r => setTimeout(r, 800))
    }
    
    const {vulns: foundVulns} = analyzeCode(code, scanMode, language)
    setVulns(foundVulns)
    
    // Auto-generate first AI message
    if (foundVulns.length > 0) {
      setChatMessages([
        { role: 'bot', text: `Hello ${user?.email?.split('@')[0] || 'User'}. I've completed the security audit. I've detected ${foundVulns.length} vulnerabilities that require your attention. The most critical is the ${foundVulns[0].name}.\n\nYou can see my full briefing in the panel below, or ask me specific questions about these findings.` }
      ])
    } else {
      setChatMessages([
        { role: 'bot', text: "Excellent news! My deep scan found no security vulnerabilities in this codebase. You're following best practices." }
      ])
    }
    
    await new Promise(r => setTimeout(r, 600))
    
    if (foundVulns.length > 0) {
      setPhase('alert')
    } else {
      setPhase('report')
    }
    
    // Save to DB
    try {
      if(user) {
        await supabase.from('scans').insert({
          user_id: user.id,
          code,
          language: scanMode === 'url' ? 'URL' : language,
          vulnerabilities: foundVulns,
          fixed_code: scanMode === 'code' ? CODE_SAMPLES[language]?.fixed || code : '',
          security_score: foundVulns.length === 0 ? 100 : Math.max(12, 100 - (foundVulns.length * 30)),
          status: 'completed'
        })
      }
    } catch(e) {}
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    if (CODE_SAMPLES[lang]) {
      setCode(CODE_SAMPLES[lang].vulnb)
    }
  }

  const sendAIQuery = async () => {
    if (!chatInput.trim() || isTyping) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatInput('')
    setIsTyping(true)
    
    // Simulate AI thinking and response
    await new Promise(r => setTimeout(r, 1200))
    
    let response = "I'm analyzing that specific context for you. Based on the scan, I recommend focusing on the parameterized query implementation first."
    const lowMsg = userMsg.toLowerCase()
    
    if (lowMsg.includes('sql') || lowMsg.includes('injection')) {
      response = "SQL Injection is a critical risk where untrusted input manipulates your database queries. The fix I've generated uses 'Prepared Statements' which separate the query logic from the data, making it impossible for an attacker to break out of the string literal."
    } else if (lowMsg.includes('fix') || lowMsg.includes('how') || lowMsg.includes('apply')) {
      response = "To apply the fix, navigate to the 'Corrected Code' tab. You'll see I've refactored the data access logic using secure patterns. You can copy that directly into your source file."
    } else if (lowMsg.includes('url') || lowMsg.includes('header') || lowMsg.includes('network')) {
      response = "For the network vulnerabilities, you should ensure your web server (like Nginx or Apache) is configured to send HSTS and X-Frame-Options headers. This prevents simple Man-in-the-Middle and Clickjacking attacks."
    } else if (lowMsg.includes('who') || lowMsg.includes('you')) {
      response = "I am Sentry AI, your agentic security assistant. I don't just find bugs; I help you understand them and fix them with production-ready code."
    }
    
    setChatMessages(prev => [...prev, { role: 'bot', text: response }])
    setIsTyping(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const username = user?.email?.split('@')[0] || 'user'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        html,body { background: #111216; color: white; font-family: 'Outfit', sans-serif; overflow-x: hidden; }
        
        /* Layout */
        .page-container { min-height: 100vh; background: #111216; }
        
        /* Header */
        .dash-header { border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; background: #14151a; position: sticky; top: 0; z-index: 50; }
        .brand-logo { width: 32px; height: 32px; background: linear-gradient(135deg, #d946ef, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .brand-text { font-size: 18px; font-weight: 800; }
        .nav-link { color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 600; text-decoration: none; transition: color 0.2s; display: flex; align-items: center; gap: 8px; }
        .nav-link:hover { color: white; }
        .nav-link.active { color: #10b981; }
        
        .user-pill { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 6px 16px 6px 6px; border-radius: 24px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .user-avatar { width: 28px; height: 28px; background: linear-gradient(135deg, #d946ef, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; text-transform: uppercase; }
        
        /* Content Gen */
        .dash-content { max-w: 1200px; margin: 0 auto; padding: 40px 32px; display: flex; flex-direction: column; gap: 32px; }
        
        /* Hero */
        .hero-box { background: linear-gradient(to right, rgba(217,70,239,0.05), rgba(139,92,246,0.01)); border: 1px solid rgba(255,255,255,0.03); border-radius: 20px; padding: 40px; position: relative; overflow: hidden; }
        .hero-glow { position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .sys-active { display: inline-flex; align-items: center; gap: 8px; color: #10b981; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; }
        .pulse-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        .hero-title { font-size: 42px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px; }
        .hero-name-gradient { background: linear-gradient(to right, #d946ef, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .card { background: #16171d; border: 1px solid rgba(255,255,255,0.03); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; position: relative; overflow: hidden; }
        .card-icon-box { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .card span { color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; }
        
        /* Scanner Container */
        .scanner-box { background: #16171d; border: 1px solid rgba(255,255,255,0.03); border-radius: 20px; overflow: hidden; }
        .scanner-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.03); background: #191a21; }
        .sc-tab { flex: 1; text-align: center; padding: 20px 0; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 10px; }
        .sc-tab.active { background: linear-gradient(135deg, #d946ef, #ec4899); color: white; box-shadow: 0 4px 20px rgba(217,70,239,0.25); }
        .sc-tab.inactive { color: rgba(255,255,255,0.3); }
        .sc-tab.inactive:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.02); }
        
        .sc-body { padding: 24px 32px; }
        .sc-label { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600; margin-bottom: 12px; display: block; }
        .sc-select { background: #111216; border: 1px solid rgba(255,255,255,0.05); color: white; border-radius: 10px; padding: 12px 16px; width: 100%; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; appearance: none; outline: none; margin-bottom: 24px; cursor: pointer; }
        
        .code-area { background: #111216; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid #8b5cf6; border-radius: 10px; padding: 20px; color: rgba(255,255,255,0.8); font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; width: 100%; min-height: 240px; resize: vertical; outline: none; margin-bottom: 24px; }
        
        .scan-action-btn { width: 100%; padding: 20px; background: linear-gradient(135deg, #d946ef, #ec4899); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 8px 32px rgba(217,70,239,0.25); }
        .scan-action-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(217,70,239,0.35); }
        
        /* Scanning View */
        .scanning-view { min-height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; text-align: center; }
        .scan-icon-pulse { width: 80px; height: 80px; background: linear-gradient(135deg, #2a113a, #1f0d2c); border-radius: 20px; margin-bottom: 24px; position: relative; animation: float 3s ease-in-out infinite; box-shadow: 0 0 60px rgba(217,70,239,0.1); border: 1px solid rgba(217,70,239,0.2); }
        .scan-title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .scan-sub { color: rgba(255,255,255,0.4); margin-bottom: 40px; }
        .scan-steps-list { display: flex; flex-direction: column; gap: 16px; text-align: left; }
        .scan-step { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 500; animation: fadeUp 0.4s ease forwards; opacity: 0; transform: translateY(10px); }
        .step-dot { width: 8px; height: 8px; background: #d946ef; border-radius: 50%; box-shadow: 0 0 10px #d946ef; }
        .p-bar-container { width: 100%; max-width: 400px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-top: 40px; }
        .p-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #d946ef); border-radius: 10px; transition: width 0.3s ease; }
        
        /* Alert Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s ease; }
        .alert-card { background: #130a10; border: 1px solid rgba(239,68,68,0.2); border-radius: 24px; padding: 40px; max-width: 460px; text-align: center; box-shadow: 0 0 100px rgba(239,68,68,0.1); animation: popIn 0.4s cubic-bezier(0.16,1,0.3,1); position: relative; }
        .alert-ico-wrap { width: 80px; height: 80px; background: rgba(239,68,68,0.1); border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px solid rgba(239,68,68,0.2); box-shadow: inset 0 0 20px rgba(239,68,68,0.2); color: #ef4444; }
        .alert-title { font-size: 28px; font-weight: 800; color: #ef4444; line-height: 1.2; margin-bottom: 16px; }
        .alert-desc { color: rgba(255,255,255,0.6); font-size: 15px; margin-bottom: 32px; line-height: 1.5; }
        .alert-pill { display: inline-block; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 14px; margin-bottom: 32px; }
        .alert-btn { background: linear-gradient(135deg, #ef4444, #f97316); border: none; width: 100%; padding: 18px; border-radius: 12px; color: white; font-weight: 800; font-size: 16px; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 30px rgba(239,68,68,0.3); }
        .alert-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(239,68,68,0.4); }
        
        /* Report View */
        .rep-header { background: #16171d; border: 1px solid rgba(255,255,255,0.03); border-radius: 20px; padding: 32px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
        .rep-title-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
        .rep-title { font-size: 24px; font-weight: 800; }
        .rep-sub { color: rgba(255,255,255,0.4); font-size: 14px; font-family: 'Outfit'; }
        .badges-row { display: flex; gap: 12px; margin-top: 24px; }
        .rep-badge { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid; display: flex; align-items: center; gap: 8px; }
        
        .rep-btn-group { display: flex; gap: 12px; }
        .rep-btn-prm { background: linear-gradient(135deg, #d946ef, #ec4899); border: none; padding: 10px 20px; border-radius: 8px; color: white; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .rep-btn-sec { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 8px; color: white; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
        .rep-btn-sec:hover { background: rgba(255,255,255,0.08); }
        
        .rep-body { background: #16171d; border: 1px solid rgba(255,255,255,0.03); border-radius: 20px; overflow: hidden; }
        .rep-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .rtab { padding: 20px 32px; font-weight: 700; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 8px; transition: all 0.2s; border-bottom: 2px solid transparent; }
        .rtab.active { color: white; border-bottom-color: #d946ef; }
        .rtab:hover:not(.active) { color: rgba(255,255,255,0.8); }
        
        .sentry-panel { padding: 32px; padding-bottom: 0px; display: flex; flex-direction: column; gap: 24px; }
        .ai-banner { background: #1f1b2d; border: 1px solid rgba(217,70,239,0.15); border-radius: 12px; padding: 16px 24px; font-size: 14px; font-weight: 700; color: white; display: flex; align-items: center; gap: 12px; }
        
        .intel-card { background: #111216; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
        .ic-header { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 10px; }
        .ic-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.7); }
        .ic-title { font-weight: 800; color: white; font-size: 15px; margin-top: 8px; }
        .ic-text b { color: white; }
        .ic-code-inline { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono'; font-size: 12px; color: #60a5fa; }
        
        .chat-input-area { padding: 24px; border-top: 1px solid rgba(255,255,255,0.03); margin-top: 24px; background: #16171d; }
        .chat-bar { background: #111216; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px; display: flex; gap: 12px; }
        .chat-bar input { flex: 1; background: transparent; border: none; outline: none; color: white; font-family: 'Outfit'; font-size: 15px; padding-left: 12px; }
        .chat-send { width: 40px; height: 40px; border-radius: 8px; background: rgba(217,70,239,0.1); color: #d946ef; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; }
        .chat-send:hover { background: rgba(217,70,239,0.2); }
        
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn { 0%{opacity:0;transform:scale(0.95)} 100%{opacity:1;transform:scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes gleam { from{left:-100%} to{left:150%} }
        @keyframes bgShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* Futuristic Redesigns */
        .rep-btn-prm { 
          position: relative;
          background: linear-gradient(135deg, #d946ef, #8b5cf6, #3b82f6); 
          background-size: 200% 200%;
          animation: bgShift 6s ease infinite;
          border: none; padding: 12px 24px; border-radius: 12px; color: white; 
          font-weight: 800; font-size: 14px; cursor: pointer; display: flex; 
          align-items: center; gap: 10px; overflow: hidden; 
          box-shadow: 0 0 20px rgba(217,70,239,0.3);
          transition: all 0.3s ease;
        }
        .rep-btn-prm::after {
          content: ''; position: absolute; top: -50%; left: -100%; width: 50%; height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: rotate(25deg); animation: gleam 4s infinite;
        }
        .rep-btn-prm:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(217,70,239,0.5); }

        .chat-msg-user {
          align-self: flex-end; background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white; padding: 12px 20px; border-radius: 18px 18px 4px 18px;
          max-width: 80%; animation: fadeUp 0.3s ease; font-weight: 500; font-size: 14px;
        }
        .chat-msg-bot {
          align-self: flex-start; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.9);
          padding: 16px; border-radius: 4px 18px 18px 18px;
          max-width: 90%; animation: fadeIn 0.4s ease; line-height: 1.6; font-size: 14px;
        }
        .chat-scroll { height: 400px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; scroll-behavior: smooth; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      <div className="page-container flex flex-col items-center">
        
        {/* NAV HEADER */}
        <header className="dash-header w-full">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="brand-logo"><Shield className="w-5 h-5 text-white" /></div>
              <div className="brand-text">Cyber Sentry AI</div>
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            
            <nav className="flex items-center gap-6">
              <span className="nav-link active cursor-pointer"><Home className="w-4 h-4" /> Dashboard</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <div className="user-pill" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="user-avatar">{username[0]}</div>
              <span className="text-sm font-semibold pr-2">{username}</span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1c22] border border-white/5 rounded-xl shadow-2xl z-[60] overflow-hidden fade-in">
                <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                  <div className="text-xs text-white/40 mb-1">Signed in as</div>
                  <div className="text-sm font-bold truncate">{user?.email}</div>
                </div>
                <button className="w-full px-4 py-3 text-sm text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-3" onClick={() => setProfileOpen(false)}>
                  <Home className="w-4 h-4 text-purple-400" /> Dashboard
                </button>
                <button className="w-full px-4 py-3 text-sm text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-3" onClick={() => setProfileOpen(false)}>
                  <Settings className="w-4 h-4 text-white/40" /> Settings & API Keys
                </button>
                <button className="w-full px-4 py-3 text-sm text-left hover:bg-red-500/10 text-red-400 flex items-center gap-3" onClick={signOut}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MAIN GENERIC AREA */}
        <main className="dash-content w-full items-stretch">
          
          {phase === 'idle' && (
            <>
              {/* HERO */}
              <div className="hero-box">
                <div className="hero-glow"></div>
                <div className="sys-active"><div className="pulse-dot"></div> SYSTEM ACTIVE</div>
                <h1 className="hero-title">Welcome back, <span className="hero-name-gradient">{username}</span></h1>
                <p className="text-white/40 text-[15px] font-medium max-w-lg leading-relaxed">
                  Your security command center. Run scans, track vulnerabilities, and let AI patch your code.
                </p>
              </div>

              {/* STATS */}
              <div className="stats-grid">
                <div className="card">
                  <div className="card-icon-box bg-purple-500/10 text-purple-400"><Code className="w-5 h-5" /></div>
                  <AnimatedCounter target={stats.total} />
                  <span>Total Scans</span>
                </div>
                <div className="card">
                  <div className="card-icon-box bg-pink-500/10 text-pink-400"><Bug className="w-5 h-5" /></div>
                  <AnimatedCounter target={stats.vulns} />
                  <span>Vulnerabilities</span>
                </div>
                <div className="card">
                  <div className="card-icon-box bg-orange-500/10 text-orange-400"><AlertTriangle className="w-5 h-5" /></div>
                  <AnimatedCounter target={stats.crit} />
                  <span>Critical / High</span>
                </div>
                <div className="card">
                  <div className="card-icon-box bg-teal-500/10 text-teal-400"><Sparkles className="w-5 h-5" /></div>
                  <AnimatedCounter target={stats.patched} />
                  <span>Auto-Patched</span>
                </div>
              </div>

              {/* SCAN SECTION */}
              <div className="scanner-box">
                <div className="scanner-tabs">
                  <div 
                    className={`sc-tab ${scanMode === 'code' ? 'active' : 'inactive'}`} 
                    onClick={() => setScanMode('code')}
                  >
                    <Code className="w-4 h-4"/> Paste Code
                  </div>
                  <div 
                    className={`sc-tab ${scanMode === 'url' ? 'active' : 'inactive'}`} 
                    onClick={() => setScanMode('url')}
                  >
                    <Globe className="w-4 h-4"/> Website URL
                  </div>
                </div>
                <div className="sc-body">
                  {scanMode === 'code' ? (
                    <>
                      <label className="sc-label">Programming Language</label>
                      <select 
                        className="sc-select" 
                        value={language} 
                        onChange={e => handleLanguageChange(e.target.value)}
                      >
                        {Object.keys(CODE_SAMPLES).map(lang => (
                          <option key={lang}>{lang}</option>
                        ))}
                      </select>
                      
                      <label className="sc-label">Paste your code</label>
                      <textarea 
                        className="code-area" 
                        value={code} 
                        onChange={e => setCode(e.target.value)}
                        spellCheck={false}
                      />
                    </>
                  ) : (
                    <>
                      <label className="sc-label">Website URL</label>
                      <input 
                        className="sc-select" 
                        placeholder="https://example.com"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                      />
                      <p className="text-white/20 text-xs mb-6">Enter the URL of the website you want to scan for network-level vulnerabilities.</p>
                    </>
                  )}
                  
                  <button className="scan-action-btn" onClick={startScan} disabled={!code.trim()}>
                    <Sparkles className="w-5 h-5" /> Start Security Scan
                  </button>
                </div>
              </div>
            </>
          )}

          {phase === 'scanning' && (
            <div className="scanning-view">
              <div className="scan-icon-pulse"></div>
              <h2 className="scan-title">Scanning in Progress</h2>
              <p className="scan-sub">Analyzing code for vulnerabilities...</p>
              
              <div className="scan-steps-list">
                {scanSteps.map((s, i) => (
                  <div key={i} className="scan-step" style={{animationDelay: `${i * 0.1}s`}}>
                    <div className="step-dot"></div> {s}
                  </div>
                ))}
              </div>
              
              <div className="p-bar-container">
                <div className="p-bar-fill" style={{width: `${(scanSteps.length / 4) * 100}%`}}></div>
              </div>
            </div>
          )}

          {phase === 'alert' && (
            <div className="modal-overlay">
              <div className="alert-card">
                <button className="absolute top-4 right-4 text-white/40 hover:text-white" onClick={() => setPhase('report')}>✕</button>
                <div className="alert-ico-wrap"><Shield className="w-10 h-10" /></div>
                <h2 className="alert-title">🚨 Dangerous Code Detected!</h2>
                <p className="alert-desc">Found {vulns.filter(v=>v.severity==='critical').length} critical and {vulns.filter(v=>v.severity==='high').length} high severity vulnerabilities that need immediate attention.</p>
                
                <div className="alert-pill">{vulns.filter(v=>v.severity==='critical').length} Critical</div>
                
                <button className="alert-btn" onClick={() => setPhase('report')}>
                  View Full Report →
                </button>
              </div>
            </div>
          )}

          {phase === 'report' && (
            <div className="fade-in">
              <button className="mb-6 text-sm text-white/40 hover:text-white flex items-center gap-2" onClick={() => setPhase('idle')}>
                ← Back to Dashboard
              </button>
              
              <div className="rep-header">
                <div>
                  <div className="rep-title-wrap">
                    <Shield className="w-6 h-6 text-purple-400" />
                    <h1 className="rep-title">Scan Complete</h1>
                  </div>
                  <div className="rep-sub">
                    Found {vulns.length} vulnerabilit{vulns.length===1?'y':'ies'} in 2.8s • {language}
                  </div>
                  
                  <div className="badges-row">
                    <div className="rep-badge bg-red-500/10 border-red-500/20 text-red-400">
                      <div className="w-2 h-2 rounded-full border border-red-400"></div> 
                      {vulns.filter(v=>v.severity==='critical').length} critical
                    </div>
                    <div className="rep-badge bg-orange-500/10 border-orange-500/20 text-orange-400">
                      <div className="w-2 h-2 rounded-full border border-orange-400"></div> 
                      {vulns.filter(v=>v.severity==='high').length} high
                    </div>
                    <div className="rep-badge bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                      <div className="w-2 h-2 rounded-full border border-yellow-400"></div> 
                      {vulns.filter(v=>v.severity==='medium').length} medium
                    </div>
                    <div className="rep-badge bg-blue-500/10 border-blue-500/20 text-blue-400">
                      <div className="w-2 h-2 rounded-full border border-blue-400 px-1">i</div> 
                      0 low
                    </div>
                  </div>
                </div>
                
                <div className="rep-btn-group relative">
                  <button 
                    className="rep-btn-prm"
                    onClick={() => setExportOpen(!exportOpen)}
                  >
                    <Download className="w-4 h-4"/> Export & Share
                  </button>
                  {exportOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1c22]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden fade-in">
                      <div className="px-4 py-3 border-b border-white/5 bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">Select Export Format</div>
                      <button className="w-full px-4 py-3 text-sm text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-3 transition-colors" onClick={() => { navigator.clipboard.writeText(JSON.stringify(vulns, null, 2)); setExportOpen(false) }}>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20"><Copy className="w-4 h-4" /></div>
                        <span>Copy JSON Report</span>
                      </button>
                      <button className="w-full px-4 py-3 text-sm text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-3 transition-colors" onClick={() => setExportOpen(false)}>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400"><Download className="w-4 h-4" /></div>
                        <span>Download PDF Brief</span>
                      </button>
                      <button className="w-full px-4 py-3 text-sm text-left hover:bg-white/5 flex items-center gap-3 transition-colors" onClick={() => setExportOpen(false)}>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><FileCode2 className="w-4 h-4" /></div>
                        <span>Open in VS Code</span>
                      </button>
                    </div>
                  )}
                  <button className="rep-btn-sec" onClick={() => setPhase('idle')}><RotateCcw className="w-4 h-4"/> New Scan</button>
                </div>
              </div>

              <div className="rep-body">
                <div className="rep-tabs">
                  <div className={`rtab ${activeTab==='vulns'?'active':''}`} onClick={()=>setActiveTab('vulns')}><Bug className="w-4 h-4"/> Vulnerabilities</div>
                  <div className={`rtab ${activeTab==='original'?'active':''}`} onClick={()=>setActiveTab('original')}><Code className="w-4 h-4"/> Original Code</div>
                  <div className={`rtab ${activeTab==='corrected'?'active':''}`} onClick={()=>setActiveTab('corrected')}><CheckCircle className="w-4 h-4"/> Corrected Code</div>
                  <div className={`rtab flex-1 justify-end ${activeTab==='sentry'?'active':''}`} onClick={()=>setActiveTab('sentry')}><Sparkles className="w-4 h-4"/> Sentry AI</div>
                </div>

                {activeTab === 'sentry' && (
                  <div className="sentry-panel fade-in">
                    <div className="ai-banner glass-panel">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 animate-pulse"><Sparkles className="w-3 h-3"/></div>
                      Sentry AI Agent: Operational & Analyzing Threat Metrices
                    </div>
                    
                    <div className="intel-card border-white/5 !bg-[#0f1115]">
                      <div className="ic-header border-b border-white/5 bg-white/[0.02] flex justify-between items-center px-6">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d946ef] to-[#8b5cf6] flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(217,70,239,0.5)] text-[10px] font-black">AI</div>
                           <span className="tracking-tight font-extrabold uppercase text-[12px] opacity-80">Intelligence Hub</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Neural Link Active</span>
                         </div>
                      </div>
                      
                      <div className="chat-scroll scrollbar-thin scrollbar-thumb-white/10">
                        {chatMessages.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                             <Sparkles className="w-12 h-12 animate-pulse" />
                             <p className="text-sm font-medium tracking-widest uppercase">Initializing neural interface...</p>
                           </div>
                        ) : (
                          chatMessages.map((msg, i) => (
                            <div key={i} className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}>
                              {msg.text.split('\n').map((line, li) => (
                                <p key={li} className="mb-2 last:mb-0">{line}</p>
                              ))}
                            </div>
                          ))
                        )}
                        {isTyping && (
                          <div className="chat-msg-bot">
                            <div className="flex gap-1.5 items-center opacity-50">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce delay-75"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-bounce delay-150"></span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-black/20 border-t border-white/5">
                        <div className="chat-bar !bg-[#15171d] !border-white/10 !p-1.5">
                          <input 
                            type="text" 
                            placeholder="Type a meaningful security question..." 
                            className="bg-transparent border-none outline-none text-white text-[14px] font-medium px-4 py-2 flex-1"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendAIQuery()}
                          />
                          <button 
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isTyping || !chatInput.trim() ? 'bg-white/5 text-white/20' : 'bg-gradient-to-tr from-[#d946ef] to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:scale-105 active:scale-95'}`}
                            onClick={sendAIQuery}
                            disabled={isTyping || !chatInput.trim()}
                          >
                             <Sparkles className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'corrected' && (
                  <div className="p-10 fade-in flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black text-white">Neural Patch View</h3>
                        <p className="text-xs text-white/30 uppercase tracking-widest font-mono">Comparing: Scanned Source (L) vs AI Corrected (R)</p>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Auto-Correction Verified
                      </div>
                    </div>
                    <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
                      <DiffViewer 
                        original={code} 
                        patched={scanMode === 'code' ? (CODE_SAMPLES[language]?.fixed || code) : 'Network hardening report generated.'} 
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'original' && (
                  <div className="p-10 fade-in">
                    <div className="relative group p-1 bg-white/[0.03] rounded-3xl border border-white/10 overflow-hidden glass-panel">
                      <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#8b5cf6]"></div>
                           <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Source Code Analysis</span>
                        </div>
                        <span className="text-purple-400 font-mono text-xs font-bold px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">{language}</span>
                      </div>
                      <pre className="p-8 bg-black/40 font-mono text-[13px] text-white/70 overflow-x-auto leading-relaxed max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
                        {code}
                      </pre>
                    </div>
                  </div>
                )}
                
                {activeTab === 'vulns' && (
                  <div className="p-8 fade-in flex flex-col gap-8">
                    {vulns.map((v, i) => (
                      <div key={i} className="group relative border border-white/10 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 rounded-3xl p-10 overflow-hidden glass-panel">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${v.severity === 'critical' ? 'bg-gradient-to-b from-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-gradient-to-b from-orange-500 to-transparent shadow-[0_0_20px_rgba(249,115,22,0.6)]'}`}></div>
                        
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <div className="flex items-center gap-4 mb-3">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${v.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {v.severity}
                              </span>
                              <span className="text-white/30 text-[11px] font-mono tracking-widest uppercase bg-white/5 px-2 py-1 rounded">V-ID: SY-{i+102}</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-purple-400 transition-colors">{v.name}</h3>
                          </div>
                          <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/40 font-mono text-[10px] uppercase tracking-widest">Entry: Line {v.line}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="flex flex-col gap-4">
                            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Intelligence Report
                            </span>
                            <div className="text-white/80 text-[15px] leading-relaxed font-medium bg-black/20 p-6 rounded-2xl border border-white/5">
                              {v.description}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <span className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.3em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Automated Mitigation
                            </span>
                            <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20 text-[15px] italic text-emerald-400 font-bold leading-relaxed shadow-[inset_0_0_30px_rgba(16,185,129,0.05)]">
                              "{v.fix}"
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {vulns.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-bounce">
                          <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black mb-3">System Secure</h3>
                        <p className="text-white/40 max-w-sm font-medium">Cyber Sentry AI deep scan returned zero critical findings. Baseline security integrity is optimal.</p>
                      </div>
                    )}
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