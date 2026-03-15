'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Code, Globe, Shield, Home, User, AlertTriangle, Bug, Sparkles, CheckCircle, ChevronDown, Download, RotateCcw } from 'lucide-react'

/* ─────────────────────────────────────────────────
   MOCK DATA & VULN LOGIC (From previous ScanPage)
───────────────────────────────────────────────── */
const SAMPLE_CODE = `// Example: SQL Injection vulnerability
const express = require('express');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.execute(query, (err, results) => {
    res.json(results);
  });
});`

const FIXED_CODE = `const express = require('express');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  // FIXED: Parameterized query prevents SQL injection
  const query = "SELECT * FROM users WHERE id = ?";
  db.execute(query, [userId], (err, results) => {
    res.json(results);
  });
});`

function analyzeCode(code: string): {vulns:any[];score:number;thinking:string[]} {
  const thinking: string[] = []
  const vulns: any[] = []

  // Mock SQL Injection detection for JS
  const hasSQLi = code.includes("SELECT * FROM users WHERE id = \" + userId") || code.includes("req.query.id")
  
  if (hasSQLi) {
    vulns.push({
      name:'SQL Injection (SQLi)',
      severity:'critical',
      description:'F-string SQL concatenation lets attackers inject arbitrary SQL commands.',
      fix:'Use parameterized queries: db.execute(query, [userId])',
      line:7
    })
  }

  const score = vulns.length === 0 ? 96 : Math.max(10, 28 - vulns.length * 6)
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
  const [code, setCode] = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState('JavaScript')
  const [phase, setPhase] = useState<'idle'|'scanning'|'alert'|'report'>('idle')
  const [scanSteps, setScanSteps] = useState<string[]>([])
  const [vulns, setVulns] = useState<any[]>([])
  
  // Report state
  const [activeTab, setActiveTab] = useState<'vulns'|'original'|'corrected'|'sentry'>('sentry')

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
      const { data } = await supabase.from('scans').select('*').eq('user_id', user.id)
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
    const steps = [
      'Initializing scan engine',
      'Analyzing attack surface',
      'Running vulnerability checks',
      'Applying OWASP rulesets'
    ]
    
    for (const step of steps) {
      setScanSteps(p => [...p, step])
      await new Promise(r => setTimeout(r, 800))
    }
    
    const {vulns: foundVulns} = analyzeCode(code)
    setVulns(foundVulns)
    
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
          language,
          vulnerabilities: foundVulns,
          fixed_code: FIXED_CODE,
          security_score: foundVulns.length===0?100:23,
          status: 'completed'
        })
      }
    } catch(e) {}
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
      `}</style>

      <div className="page-container flex flex-col items-center">
        
        {/* NAV HEADER */}
        <header className="dash-header w-full">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="brand-logo"><Shield className="w-5 h-5 text-white" /></div>
              <div className="brand-text">VulnHunter</div>
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            
            <nav className="flex items-center gap-6">
              <span className="nav-link active"><Home className="w-4 h-4" /> Dashboard</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="user-pill">
              <div className="user-avatar">{username[0]}</div>
              <span className="text-sm font-semibold pr-2">{username}</span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
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
                  <div className="sc-tab active"><Code className="w-4 h-4"/> Paste Code</div>
                  <div className="sc-tab inactive"><Globe className="w-4 h-4"/> Website URL</div>
                </div>
                <div className="sc-body">
                  <label className="sc-label">Programming Language</label>
                  <select className="sc-select" value={language} onChange={e=>setLanguage(e.target.value)}>
                    <option>JavaScript</option>
                    <option>Python</option>
                    <option>TypeScript</option>
                    <option>Java</option>
                  </select>
                  
                  <label className="sc-label">Paste your code</label>
                  <textarea 
                    className="code-area" 
                    value={code} 
                    onChange={e=>setCode(e.target.value)}
                    spellCheck={false}
                  />
                  
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
                
                <div className="rep-btn-group">
                  <button className="rep-btn-prm"><Download className="w-4 h-4"/> Export & Share</button>
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
                  <>
                    <div className="sentry-panel fade-in">
                      <div className="ai-banner">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Sparkles className="w-3 h-3"/></div>
                        4. Security hardening recommendations
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-magenta-500/20 bg-[#d946ef] flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.5)]">🤖</div>
                        
                        <div className="intel-card flex-1 border border-white/5">
                          <div className="ic-header border-b border-white/5 bg-white/5">Sentry AI Threat Intelligence Briefing</div>
                          
                          <div className="ic-body relative bg-transparent">
                            
                            {vulns.length > 0 ? (
                              <>
                                <div className="z-10 relative">
                                  <div className="ic-title mb-2 tracking-tight">1. Executive Summary</div>
                                  <div className="ic-text">
                                    The scan detected a <b>Critical SQL Injection (SQLi)</b> vulnerability in your data access layer. This is the equivalent of leaving your front door wide open with a sign saying "Vault is this way." By concatenating <span className="ic-code-inline">userId</span> directly into a string, you have granted any user the ability to bypass authentication, dump your entire database, or even execute administrative commands depending on your DB permissions. <b>This must be remediated immediately.</b>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-2 pb-2 border-b border-white/5 z-10 relative">
                                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                  <div className="text-sm font-black tracking-widest text-white/90">THREAT LEVEL: CRITICAL</div>
                                </div>
                                
                                <div className="z-10 relative">
                                  <div className="ic-title mb-2 tracking-tight">2. Are there dangerous/malicious changes?</div>
                                  <div className="ic-text">
                                    While the scan identifies a <b>vulnerability</b> (a weakness), it does not explicitly confirm a <b>breach</b> (an exploit). However, this specific code pattern is a magnet for automated scrapers and SQLmap-style tools.
                                    <br/><br/>
                                    <b>Danger Assessment:</b><br/>
                                    <b>Data Exfiltration:</b> An attacker could use <span className="ic-code-inline">1 OR 1=1</span> to dump your entire users table.<br/>
                                    <b>Administrative Takeover:</b> If your DB user has permissions, an attacker could run <span className="ic-code-inline">; DROP TABLE users; --</span> or create a new admin user.<br/>
                                    <b>Credential Harvesting:</b> Hashed passwords and PII are currently at extreme risk.
                                  </div>
                                </div>

                                <div className="z-10 relative">
                                  <div className="ic-title mb-2 tracking-tight">3. Priority Action Plan</div>
                                  <div className="ic-text">
                                    <b>Stop the Bleed:</b> Deploy the parameterized query fix (see tabs) to production immediately.<br/>
                                    <b>Audit Logs:</b> Check your database logs for unusual queries containing <span className="ic-code-inline">SELECT *</span>, <span className="ic-code-inline">UNION</span>, or <span className="ic-code-inline">OR 1=1</span>.<br/>
                                    <b>Least Privilege:</b> Ensure the database user account executing the web app does not have `DROP` tables.
                                  </div>
                                </div>
                                
                                {/* Vertical Accent Bar Component directly generated */}
                                <div style={{position:'absolute',right:'-2px',top:'50%',width:'4px',height:'120px',background:'#9333ea',borderRadius:'10px',transform:'translateY(-50%)',boxShadow:'0 0 15px rgba(147,51,234,0.6)'}}></div>

                              </>
                            ) : (
                              <div className="text-emerald-400 font-bold z-10 relative">Code is secure! No vulnerabilities found. Excellent job.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="chat-input-area border-t border-white/5 bg-[#16171d] !mt-8">
                      <div className="chat-bar bg-[#111216]">
                        <input type="text" placeholder="Ask about your scan results..." className="w-full bg-transparent border-none outline-none text-white text-[15px] font-outfit" />
                        <button className="chat-send shrink-0">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'corrected' && (
                  <div className="p-8 fade-in">
                    <DiffViewer original={code} patched={FIXED_CODE} />
                  </div>
                )}
                
                {activeTab === 'original' && (
                  <div className="p-8 fade-in">
                    <pre className="p-6 bg-[#08050a] rounded-xl border border-white/5 font-mono text-xs text-white/70 overflow-x-auto leading-relaxed max-h-[500px]">
                      {code}
                    </pre>
                  </div>
                )}
                
                {activeTab === 'vulns' && (
                  <div className="p-8 fade-in flex flex-col gap-4">
                    {vulns.map((v, i) => (
                      <div key={i} className="border border-red-500/20 bg-red-500/5 rounded-xl p-6">
                        <div className="flex justify-between mb-4">
                          <div className="font-bold text-lg">{v.name}</div>
                          <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase">{v.severity}</div>
                        </div>
                        <div className="text-white/60 text-sm mb-4 leading-relaxed">{v.description}</div>
                        <div className="bg-black/30 p-4 rounded-lg font-mono text-xs text-white/80">
                          <span className="text-emerald-400 mb-2 block">💡 Recommended Fix:</span>
                          {v.fix}
                        </div>
                      </div>
                    ))}
                    {vulns.length === 0 && <div className="text-white/40">No vulnerabilities found.</div>}
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