'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPING = [
  "🔍 Scanning Flask app for vulnerabilities...",
  "🧠 Reasoning: f-string in SQL = injection vector",
  "🚨 CRITICAL: SQL Injection at line 12",
  "🚨 HIGH: Hardcoded secret at line 18",
  "🔧 Generating parameterized query fix...",
  "✅ Security score: 23 → 94 | Scan complete 🎉",
]

export default function Home() {
  const router = useRouter()
  const [lineIdx, setLineIdx] = useState(0)
  const [text, setText] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [completedLines, setCompletedLines] = useState<string[]>([])

  useEffect(() => {
    const line = TYPING[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setText(p => p + line[charIdx])
        setCharIdx(c => c + 1)
      }, 28)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setCompletedLines(p => [...p.slice(-4), line])
        setText('')
        setCharIdx(0)
        setLineIdx(i => (i + 1) % TYPING.length)
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [charIdx, lineIdx])

  return (
    <>
      <style>{`
        .hero-bg {
          position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
        }
        .orb {
          position: absolute; border-radius: 50%; filter: blur(80px);
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%);
          top: -100px; left: -100px;
          animation: float 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(68,136,255,0.06) 0%, transparent 70%);
          bottom: -50px; right: -50px;
          animation: float 10s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(255,68,102,0.04) 0%, transparent 70%);
          top: 50%; left: 50%;
          animation: float 12s ease-in-out infinite;
        }
        .particles {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(0,255,136,0.12) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: float 25s ease infinite;
          opacity: 0.25;
        }
        .grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 48px;
          background: rgba(5,5,8,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 18px; font-weight: 700; color: white;
          text-decoration: none; cursor: pointer;
        }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(0,255,136,0.12);
          border: 1px solid rgba(0,255,136,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          animation: glow-pulse 3s ease infinite;
        }
        .badge {
          font-size: 10px; background: rgba(0,255,136,0.15);
          border: 1px solid rgba(0,255,136,0.3);
          color: #00ff88; padding: 2px 8px; border-radius: 20px;
          font-weight: 600; letter-spacing: 0.05em;
        }
        .nav-links { display: flex; align-items: center; gap: 8px; }
        .nav-link {
          color: rgba(255,255,255,0.4); background: none; border: none;
          padding: 8px 16px; border-radius: 8px; cursor: pointer;
          font-size: 14px; font-weight: 500; transition: color 0.2s, background 0.2s;
          font-family: 'Space Grotesk', sans-serif;
        }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.05); }
        .hero {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 100vh;
          padding: 100px 24px 60px; text-align: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,255,136,0.08);
          border: 1px solid rgba(0,255,136,0.2);
          border-radius: 100px; padding: 8px 20px; margin-bottom: 32px;
          animation: fadeUp 0.6s ease forwards;
        }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #00ff88; animation: blink 1.5s ease infinite;
        }
        .hero-badge span { font-size: 13px; color: #00ff88; font-weight: 600; }
        h1 {
          font-size: clamp(48px, 8vw, 88px); font-weight: 700;
          line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 24px;
          opacity: 0; animation: fadeUp 0.7s ease 0.1s forwards;
        }
        .sub {
          font-size: clamp(16px, 2vw, 20px); color: rgba(255,255,255,0.45);
          max-width: 580px; line-height: 1.7; margin-bottom: 40px;
          opacity: 0; animation: fadeUp 0.7s ease 0.2s forwards;
        }
        .cta-row {
          display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
          margin-bottom: 64px; opacity: 0; animation: fadeUp 0.7s ease 0.3s forwards;
        }
        .terminal-wrap {
          width: 100%; max-width: 640px;
          opacity: 0; animation: fadeUp 0.7s ease 0.4s forwards;
        }
        .terminal-body {
          padding: 20px 24px; min-height: 120px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .term-line {
          font-size: 13px; font-family: 'JetBrains Mono', monospace;
          opacity: 0.4; padding: 2px 0;
        }
        .term-line.active { opacity: 1; }
        .term-line.success { color: #00ff88; opacity: 1; }
        .term-line.error   { color: #ff4466; opacity: 1; }
        .term-line.warn    { color: #ff9500; opacity: 1; }
        .cursor {
          display: inline-block; width: 8px; height: 14px;
          background: #00ff88; vertical-align: middle; margin-left: 2px;
          animation: blink 1s ease infinite;
        }
        .stats-bar {
          position: relative; z-index: 10;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 40px 48px;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 32px; max-width: 900px; margin: 0 auto;
        }
        .stat { text-align: center; }
        .stat-num {
          font-size: 32px; font-weight: 700; color: #00ff88;
          letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.35); }
        section { position: relative; z-index: 10; padding: 100px 48px; }
        .section-tag {
          font-size: 11px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; color: #00ff88; margin-bottom: 16px;
        }
        .section-title {
          font-size: clamp(32px, 5vw, 52px); font-weight: 700;
          letter-spacing: -0.02em; margin-bottom: 16px; line-height: 1.1;
        }
        .section-sub {
          font-size: 17px; color: rgba(255,255,255,0.4);
          max-width: 500px; line-height: 1.6; margin-bottom: 60px;
        }
        .cards-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px; max-width: 1100px; margin: 0 auto;
        }
        .card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 32px;
          transition: all 0.3s; cursor: default;
        }
        .card:hover {
          border-color: rgba(0,255,136,0.25);
          background: rgba(0,255,136,0.03);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(0,255,136,0.05);
        }
        .card-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 20px;
        }
        .card-num {
          font-size: 48px; font-weight: 700; color: rgba(255,255,255,0.04);
          float: right; line-height: 1; margin-top: -8px; letter-spacing: -0.04em;
        }
        .card-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: white; }
        .card-desc { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.7; }
        .vuln-grid {
          display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;
          max-width: 900px; margin: 0 auto;
        }
        .vuln-badge {
          padding: 8px 18px; border-radius: 100px; font-size: 13px;
          font-weight: 600; cursor: default; transition: transform 0.2s;
        }
        .vuln-badge:hover { transform: translateY(-2px); }
        .vuln-critical { background: rgba(255,68,102,0.1); border: 1px solid rgba(255,68,102,0.3); color: #ff4466; }
        .vuln-high     { background: rgba(255,149,0,0.1); border: 1px solid rgba(255,149,0,0.3); color: #ff9500; }
        .vuln-medium   { background: rgba(255,200,0,0.1); border: 1px solid rgba(255,200,0,0.3); color: #ffc800; }
        .cta-section { text-align: center; padding: 120px 48px; position: relative; z-index: 10; }
        .cta-box {
          max-width: 700px; margin: 0 auto;
          background: rgba(0,255,136,0.03);
          border: 1px solid rgba(0,255,136,0.12);
          border-radius: 32px; padding: 80px 60px;
          position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute;
          top: -100px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%);
        }
        .cta-title { font-size: 42px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; }
        .cta-sub { font-size: 17px; color: rgba(255,255,255,0.4); margin-bottom: 40px; }
        footer {
          position: relative; z-index: 10;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 32px 48px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; color: rgba(255,255,255,0.2);
        }
        .footer-logo { color: #00ff88; font-weight: 700; }
        @media (max-width: 768px) {
          nav { padding: 16px 24px; }
          section { padding: 60px 24px; }
          .stats-bar { grid-template-columns: repeat(2,1fr); padding: 32px 24px; }
          .cta-box { padding: 48px 28px; }
          footer { flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      <div className="hero-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="particles" />
      </div>
      <div className="grid-bg" />

      <nav>
        <div className="nav-logo" onClick={() => router.push('/')}>
          <div className="logo-icon">🛡</div>
          <span>Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
          <span className="badge">AI</span>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => router.push('/login')}>Login</button>
          <button className="btn-green" style={{padding:'10px 22px', fontSize:'14px'}} onClick={() => router.push('/login')}>
            Start Free →
          </button>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-badge">
          <div className="pulse-dot" />
          <span>Agentic AI · Chain-of-Thought Reasoning · OWASP Top 10</span>
        </div>
        <h1>Your Code's<br /><span className="text-gradient">AI Security Guard</span></h1>
        <p className="sub">
          An autonomous AI agent that thinks like a senior security engineer —
          scanning, reasoning, patching, and verifying your code in seconds.
        </p>
        <div className="cta-row">
          <button className="btn-green" onClick={() => router.push('/login')}>🛡 Scan My Code Free</button>
          <button className="btn-ghost" onClick={() => router.push('/scan')}>👁 Live Demo</button>
        </div>
        <div className="terminal-wrap">
          <div className="terminal">
            <div className="terminal-bar">
              <div className="dot dot-red" />
              <div className="dot dot-yellow" />
              <div className="dot dot-green" />
              <span style={{marginLeft:'12px', fontSize:'12px', color:'rgba(255,255,255,0.25)', fontFamily:'JetBrains Mono'}}>
                cyber-sentry — agent output
              </span>
            </div>
            <div className="terminal-body">
              {completedLines.map((line, i) => (
                <div key={i} className={`term-line ${
                  line.includes('✅') ? 'success' :
                  line.includes('🚨') ? 'error' :
                  line.includes('🔧') ? 'warn' : ''
                }`}>{line}</div>
              ))}
              <div className="term-line active" style={{color:'#00ff88'}}>
                {text}<span className="cursor" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-bar">
        {[
          {num:'OWASP', label:'Top 10 Fully Covered'},
          {num:'3-Step', label:'Agentic Loop'},
          {num:'23→94', label:'Score Improvement'},
          {num:'<5s',   label:'Scan Speed'},
        ].map((s,i) => (
          <div className="stat" key={i}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section style={{textAlign:'center'}}>
        <p className="section-tag">The Agent Loop</p>
        <h2 className="section-title">How CyberSentry Thinks</h2>
        <p className="section-sub" style={{margin:'0 auto 60px'}}>
          Watch the AI reason through every vulnerability — not just detect, but explain and fix
        </p>
        <div className="cards-grid">
          {[
            {icon:'🔍', num:'01', title:'Analyze & Reason',   desc:'Agent scans your full codebase, identifies language patterns, and builds a vulnerability map using chain-of-thought reasoning.'},
            {icon:'⚡', num:'02', title:'Generate Patches',   desc:'Agent writes production-ready secure code — parameterized queries, env variables, path validation — explaining every change.'},
            {icon:'🔒', num:'03', title:'Verify & Score',     desc:'Agent re-scans patched code to confirm all fixes work, then issues a security score showing improvement.'},
          ].map((c,i) => (
            <div className="card" key={i}>
              <span className="card-num">{c.num}</span>
              <div className="card-icon">{c.icon}</div>
              <div className="card-title">{c.title}</div>
              <div className="card-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{textAlign:'center', background:'rgba(255,255,255,0.01)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <p className="section-tag">Detection Coverage</p>
        <h2 className="section-title">What We Find</h2>
        <div className="vuln-grid">
          {[
            {name:'SQL Injection',           sev:'critical'},
            {name:'XSS',                     sev:'high'},
            {name:'Path Traversal',          sev:'high'},
            {name:'Hardcoded Secrets',       sev:'high'},
            {name:'Command Injection',       sev:'critical'},
            {name:'CSRF',                    sev:'medium'},
            {name:'Broken Auth',             sev:'critical'},
            {name:'Insecure Deserialization',sev:'high'},
            {name:'Security Misconfiguration',sev:'medium'},
            {name:'Sensitive Data Exposure', sev:'high'},
          ].map((v,i) => (
            <span key={i} className={`vuln-badge vuln-${v.sev}`}>{v.name}</span>
          ))}
        </div>
      </section>

      <section style={{textAlign:'center'}}>
        <p style={{fontSize:'11px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginBottom:'40px'}}>
          Built With
        </p>
        <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'40px', alignItems:'center'}}>
          {['Next.js 14','Claude API','Supabase','Tailwind CSS','Vercel','TypeScript'].map((t,i) => (
            <span key={i}
              style={{color:'rgba(255,255,255,0.25)', fontWeight:700, fontSize:'15px', cursor:'default', transition:'color 0.2s'}}
              onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.25)')}
            >{t}</span>
          ))}
        </div>
      </section>

      <div className="cta-section">
        <div className="cta-box">
          <p className="section-tag" style={{marginBottom:'20px'}}>Get Started</p>
          <h2 className="cta-title">Ready to Secure<br/>Your Code?</h2>
          <p className="cta-sub">Paste your code, watch the AI agent work,<br/>get patches in seconds. Free to try.</p>
          <button className="btn-green" style={{fontSize:'16px', padding:'16px 40px'}} onClick={() => router.push('/login')}>
            Start Scanning Free →
          </button>
        </div>
      </div>

      <footer>
        <span>© 2026 <span className="footer-logo">CyberSentry AI</span></span>
        <span>Built for Hackathon · Nischay Bansal</span>
      </footer>
    </>
  )
}