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
  const [splash, setSplash] = useState(true)
  const [splashFade, setSplashFade] = useState(false)
  const [lineIdx, setLineIdx] = useState(0)
  const [text, setText] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [completedLines, setCompletedLines] = useState<string[]>([])
  const [visible, setVisible] = useState(false)

  // Splash screen
  useEffect(() => {
    const t1 = setTimeout(() => setSplashFade(true), 1800)
    const t2 = setTimeout(() => { setSplash(false); setVisible(true) }, 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Typing animation
  useEffect(() => {
    if (splash) return
    const line = TYPING[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => { setText(p => p + line[charIdx]); setCharIdx(c => c + 1) }, 28)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setCompletedLines(p => [...p.slice(-4), line])
        setText(''); setCharIdx(0); setLineIdx(i => (i + 1) % TYPING.length)
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [charIdx, lineIdx, splash])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050508; color: white; font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }

        /* SPLASH */
        .splash {
          position: fixed; inset: 0; z-index: 9999;
          background: #050508;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 20px;
          transition: opacity 0.6s ease;
        }
        .splash.fade { opacity: 0; pointer-events: none; }
        .splash-logo {
          width: 80px; height: 80px; border-radius: 24px;
          background: rgba(0,255,136,0.1);
          border: 2px solid rgba(0,255,136,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px;
          animation: splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
          box-shadow: 0 0 60px rgba(0,255,136,0.2);
        }
        .splash-name {
          font-size: 28px; font-weight: 800; letter-spacing: -0.02em;
          animation: fadeUp 0.5s ease 0.3s both;
        }
        .splash-bar {
          width: 160px; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.06); overflow: hidden;
          animation: fadeUp 0.5s ease 0.4s both;
        }
        .splash-bar-fill {
          height: 100%; background: linear-gradient(90deg, #00ff88, #00aaff);
          border-radius: 2px; animation: loadBar 1.6s ease forwards;
        }
        @keyframes splashPop {
          0%   { transform: scale(0.4) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.1) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes loadBar { from { width: 0; } to { width: 100%; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 20px rgba(0,255,136,0.2); }
          50%      { box-shadow: 0 0 40px rgba(0,255,136,0.5), 0 0 80px rgba(0,255,136,0.1); }
        }
        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.05); opacity: 0.8; }
        }

        /* PAGE */
        .page { opacity: 0; transition: opacity 0.8s ease; }
        .page.show { opacity: 1; }

        /* BG */
        .bg-fixed { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .orb { position: absolute; border-radius: 50%; filter: blur(90px); }
        .orb1 { width:700px;height:700px;background:radial-gradient(circle,rgba(0,255,136,0.07) 0%,transparent 70%);top:-200px;left:-200px;animation:float 10s ease infinite; }
        .orb2 { width:600px;height:600px;background:radial-gradient(circle,rgba(68,136,255,0.05) 0%,transparent 70%);bottom:-100px;right:-100px;animation:float 13s ease infinite reverse; }
        .orb3 { width:400px;height:400px;background:radial-gradient(circle,rgba(255,68,102,0.04) 0%,transparent 70%);top:40%;left:40%;animation:float 9s ease infinite 2s; }
        .grid { position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px);background-size:60px 60px; }
        .dots { position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,255,136,0.1) 1px,transparent 1px);background-size:44px 44px;opacity:0.2;animation:float 30s linear infinite; }

        /* NAV */
        nav {
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;justify-content:space-between;align-items:center;
          padding:16px 48px;
          background:rgba(5,5,8,0.8);backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .nav-logo { display:flex;align-items:center;gap:10px;cursor:pointer; }
        .nav-icon {
          width:36px;height:36px;border-radius:10px;
          background:rgba(0,255,136,0.12);border:1px solid rgba(0,255,136,0.25);
          display:flex;align-items:center;justify-content:center;font-size:16px;
          animation:glow 3s ease infinite;
        }
        .nav-name { font-size:17px;font-weight:800;color:white; }
        .nav-badge { font-size:10px;background:rgba(0,255,136,0.12);border:1px solid rgba(0,255,136,0.25);color:#00ff88;padding:2px 8px;border-radius:20px;font-weight:700;letter-spacing:0.05em; }
        .nav-right { display:flex;align-items:center;gap:8px; }
        .btn-ghost-sm { color:rgba(255,255,255,0.45);background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.2s;font-family:'Space Grotesk',sans-serif; }
        .btn-ghost-sm:hover { color:white;background:rgba(255,255,255,0.06); }

        /* HERO */
        .hero { position:relative;z-index:10;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 60px; }
        .hero-badge {
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.2);
          border-radius:100px;padding:8px 20px;margin-bottom:32px;
          animation:fadeUp 0.7s ease 0.1s both;
        }
        .pulse-dot { width:8px;height:8px;border-radius:50%;background:#00ff88;animation:blink 1.5s ease infinite; }
        .badge-text { font-size:13px;color:#00ff88;font-weight:600; }
        h1 {
          font-size:clamp(52px,9vw,96px);font-weight:800;line-height:1.0;
          letter-spacing:-0.03em;margin-bottom:24px;
          animation:fadeUp 0.7s ease 0.2s both;
        }
        .grad { background:linear-gradient(135deg,#00ff88 0%,#00ccff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .hero-sub {
          font-size:clamp(16px,2.2vw,21px);color:rgba(255,255,255,0.45);
          max-width:580px;line-height:1.7;margin-bottom:44px;
          animation:fadeUp 0.7s ease 0.3s both;
        }
        .cta-row { display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:64px;animation:fadeUp 0.7s ease 0.4s both; }

        /* BUTTONS */
        .btn-primary {
          background:#00ff88;color:#000;border:none;
          padding:15px 34px;border-radius:14px;font-weight:800;font-size:16px;
          cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;
          font-family:'Space Grotesk',sans-serif;
          box-shadow:0 4px 24px rgba(0,255,136,0.25);
        }
        .btn-primary:hover { background:#00ff99;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,255,136,0.4); }
        .btn-outline {
          background:transparent;color:white;
          border:1px solid rgba(255,255,255,0.12);
          padding:15px 28px;border-radius:14px;font-weight:700;font-size:16px;
          cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;
          font-family:'Space Grotesk',sans-serif;
        }
        .btn-outline:hover { border-color:rgba(0,255,136,0.4);background:rgba(0,255,136,0.05);transform:translateY(-2px); }

        /* TERMINAL */
        .terminal-wrap { width:100%;max-width:660px;animation:fadeUp 0.7s ease 0.5s both; }
        .terminal {
          background:#08090f;border:1px solid rgba(0,255,136,0.15);
          border-radius:18px;overflow:hidden;
          box-shadow:0 30px 100px rgba(0,0,0,0.7),0 0 80px rgba(0,255,136,0.04);
          position:relative;
        }
        .terminal::before {
          content:'';position:absolute;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,rgba(0,255,136,0.3),transparent);
          animation:scanLine 3s ease infinite;
        }
        .term-bar { background:#0f1118;padding:13px 18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.04); }
        .dot { width:12px;height:12px;border-radius:50%; }
        .dot-r{background:#ff5f56;} .dot-y{background:#ffbd2e;} .dot-g{background:#27c93f;}
        .term-title { margin-left:12px;font-size:12px;color:rgba(255,255,255,0.2);font-family:'JetBrains Mono',monospace; }
        .term-body { padding:20px 24px;min-height:130px;display:flex;flex-direction:column;gap:5px; }
        .term-line { font-size:13px;font-family:'JetBrains Mono',monospace;padding:2px 0; }
        .term-done { opacity:0.45; }
        .term-success{color:#00ff88;opacity:1;} .term-error{color:#ff4466;opacity:1;} .term-warn{color:#ff9500;opacity:1;}
        .cursor { display:inline-block;width:8px;height:15px;background:#00ff88;vertical-align:middle;margin-left:2px;animation:blink 1s ease infinite; }

        /* STATS */
        .stats { position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);padding:48px;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;max-width:960px;margin:0 auto; }
        .stat { text-align:center; }
        .stat-n { font-size:34px;font-weight:800;color:#00ff88;letter-spacing:-0.02em;margin-bottom:4px; }
        .stat-l { font-size:13px;color:rgba(255,255,255,0.3); }

        /* SECTIONS */
        .section { position:relative;z-index:10;padding:100px 48px;text-align:center; }
        .sec-tag { font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#00ff88;margin-bottom:14px; }
        .sec-title { font-size:clamp(30px,4.5vw,50px);font-weight:800;letter-spacing:-0.02em;margin-bottom:14px;line-height:1.1; }
        .sec-sub { font-size:17px;color:rgba(255,255,255,0.4);max-width:520px;line-height:1.65;margin:0 auto 56px; }

        /* CARDS */
        .cards { display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1100px;margin:0 auto; }
        .card {
          background:rgba(255,255,255,0.02);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:22px;padding:32px;
          transition:all 0.35s;cursor:default;
          position:relative;overflow:hidden;
        }
        .card::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at top left,rgba(0,255,136,0.04),transparent 60%);opacity:0;transition:opacity 0.35s; }
        .card:hover { border-color:rgba(0,255,136,0.28);transform:translateY(-6px);box-shadow:0 24px 70px rgba(0,0,0,0.5),0 0 40px rgba(0,255,136,0.06); }
        .card:hover::before { opacity:1; }
        .card-icon { width:52px;height:52px;border-radius:14px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.18);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px;transition:all 0.3s; }
        .card:hover .card-icon { background:rgba(0,255,136,0.15);transform:scale(1.08); }
        .card-n { font-size:52px;font-weight:800;color:rgba(255,255,255,0.035);float:right;line-height:1;margin-top:-6px;letter-spacing:-0.04em; }
        .card-t { font-size:18px;font-weight:700;margin-bottom:10px;color:white; }
        .card-d { font-size:14px;color:rgba(255,255,255,0.38);line-height:1.7; }

        /* VULNS */
        .vuln-wrap { display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:900px;margin:0 auto; }
        .vbadge { padding:8px 18px;border-radius:100px;font-size:13px;font-weight:700;cursor:default;transition:all 0.2s;border-width:1px;border-style:solid; }
        .vbadge:hover { transform:translateY(-3px); }
        .vc{background:rgba(255,68,102,0.08);border-color:rgba(255,68,102,0.3);color:#ff4466;}
        .vh{background:rgba(255,149,0,0.08);border-color:rgba(255,149,0,0.3);color:#ff9500;}
        .vm{background:rgba(255,200,0,0.08);border-color:rgba(255,200,0,0.3);color:#ffc800;}

        /* CTA BOX */
        .cta-wrap { position:relative;z-index:10;text-align:center;padding:100px 48px; }
        .cta-box {
          max-width:700px;margin:0 auto;
          background:rgba(0,255,136,0.025);border:1px solid rgba(0,255,136,0.1);
          border-radius:32px;padding:80px 60px;position:relative;overflow:hidden;
        }
        .cta-box::before { content:'';position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.05) 0%,transparent 70%); }
        .cta-title { font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-0.02em;margin-bottom:14px; }
        .cta-sub { font-size:17px;color:rgba(255,255,255,0.38);margin-bottom:40px;line-height:1.6; }

        /* FOOTER */
        footer { position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);padding:32px 48px;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:rgba(255,255,255,0.2); }
        .footer-brand { color:#00ff88;font-weight:700; }

        @media(max-width:768px){
          nav{padding:14px 20px;}
          .stats{grid-template-columns:repeat(2,1fr);padding:36px 24px;}
          .section{padding:60px 20px;}
          .cta-box{padding:48px 24px;}
          footer{flex-direction:column;gap:8px;text-align:center;}
        }
      `}</style>

      {/* SPLASH SCREEN */}
      {splash && (
        <div className={`splash${splashFade ? ' fade' : ''}`}>
          <div className="splash-logo">🛡</div>
          <div className="splash-name">
            Cyber<span style={{color:'#00ff88'}}>Sentry</span>
            <span style={{fontSize:'14px', marginLeft:'8px', background:'rgba(0,255,136,0.15)', color:'#00ff88', padding:'2px 10px', borderRadius:'20px', border:'1px solid rgba(0,255,136,0.3)', fontWeight:700}}>AI</span>
          </div>
          <div className="splash-bar"><div className="splash-bar-fill" /></div>
        </div>
      )}

      {/* BACKGROUNDS */}
      <div className="bg-fixed">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
        <div className="dots" />
      </div>
      <div className="grid" />

      {/* PAGE CONTENT */}
      <div className={`page${visible ? ' show' : ''}`}>

        {/* NAV */}
        <nav>
          <div className="nav-logo" onClick={() => router.push('/')}>
            <div className="nav-icon">🛡</div>
            <span className="nav-name">Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
            <span className="nav-badge">AI</span>
          </div>
          <div className="nav-right">
            <button className="btn-ghost-sm" onClick={() => router.push('/login')}>Login</button>
            <button className="btn-primary" style={{padding:'10px 22px',fontSize:'14px'}} onClick={() => router.push('/login')}>
              Start Free →
            </button>
          </div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">
            <div className="pulse-dot" />
            <span className="badge-text">Agentic AI · Chain-of-Thought Reasoning · OWASP Top 10</span>
          </div>
          <h1>Your Code's<br /><span className="grad">AI Security Guard</span></h1>
          <p className="hero-sub">
            An autonomous AI agent that thinks like a senior security engineer —
            scanning, reasoning, patching, and verifying your code in seconds.
          </p>
          <div className="cta-row">
            <button className="btn-primary" onClick={() => router.push('/login')}>🛡 Scan My Code Free</button>
            <button className="btn-outline" onClick={() => router.push('/scan')}>👁 Live Demo</button>
          </div>

          {/* Terminal */}
          <div className="terminal-wrap">
            <div className="terminal">
              <div className="term-bar">
                <div className="dot dot-r"/><div className="dot dot-y"/><div className="dot dot-g"/>
                <span className="term-title">cyber-sentry — agent output</span>
              </div>
              <div className="term-body">
                {completedLines.map((line, i) => (
                  <div key={i} className={`term-line term-done ${line.includes('✅')?'term-success':line.includes('🚨')?'term-error':line.includes('🔧')?'term-warn':''}`}>
                    {line}
                  </div>
                ))}
                <div className="term-line" style={{color:'#00ff88'}}>
                  {text}<span className="cursor"/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          {[
            {n:'OWASP', l:'Top 10 Covered'},
            {n:'3-Step', l:'Agentic Loop'},
            {n:'23→94', l:'Score Delta'},
            {n:'<5s',   l:'Scan Speed'},
          ].map((s,i) => (
            <div className="stat" key={i}>
              <div className="stat-n">{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="section">
          <p className="sec-tag">The Agent Loop</p>
          <h2 className="sec-title">How CyberSentry Thinks</h2>
          <p className="sec-sub">Watch the AI reason through every vulnerability — not just detect, but explain and fix</p>
          <div className="cards">
            {[
              {i:'🔍',n:'01',t:'Analyze & Reason',  d:'Agent scans your full codebase, identifies language patterns, and builds a vulnerability map using chain-of-thought reasoning visible to you.'},
              {i:'⚡',n:'02',t:'Generate Patches',  d:'Agent writes production-ready secure code — parameterized queries, env variables, path validation — explaining every single change it makes.'},
              {i:'🔒',n:'03',t:'Verify & Score',    d:'Agent re-scans patched code to confirm all fixes work, then issues a security score showing your improvement from vulnerable to secure.'},
            ].map((c,i) => (
              <div className="card" key={i}>
                <span className="card-n">{c.n}</span>
                <div className="card-icon">{c.i}</div>
                <div className="card-t">{c.t}</div>
                <div className="card-d">{c.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* VULNS */}
        <div className="section" style={{background:'rgba(255,255,255,0.01)',borderTop:'1px solid rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <p className="sec-tag">Detection Coverage</p>
          <h2 className="sec-title">What We Find</h2>
          <div className="vuln-wrap">
            {[
              {n:'SQL Injection',sev:'c'},{n:'XSS',sev:'h'},
              {n:'Path Traversal',sev:'h'},{n:'Hardcoded Secrets',sev:'h'},
              {n:'Command Injection',sev:'c'},{n:'CSRF',sev:'m'},
              {n:'Broken Auth',sev:'c'},{n:'Insecure Deserialization',sev:'h'},
              {n:'Security Misconfiguration',sev:'m'},{n:'Sensitive Data Exposure',sev:'h'},
            ].map((v,i) => (
              <span key={i} className={`vbadge v${v.sev}`}>{v.n}</span>
            ))}
          </div>
        </div>

        {/* TECH STACK */}
        <div className="section">
          <p style={{fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.18)',marginBottom:'36px'}}>
            Built With
          </p>
          <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'44px',alignItems:'center'}}>
            {['Next.js 14','Claude API','Supabase','TypeScript','Vercel','Tailwind CSS'].map((t,i)=>(
              <span key={i} style={{color:'rgba(255,255,255,0.22)',fontWeight:700,fontSize:'15px',cursor:'default',transition:'color 0.2s'}}
                onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.22)')}
              >{t}</span>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="cta-wrap">
          <div className="cta-box">
            <p className="sec-tag" style={{marginBottom:'18px'}}>Get Started</p>
            <h2 className="cta-title">Ready to Secure<br/>Your Code?</h2>
            <p className="cta-sub">Paste your code, watch the AI agent work,<br/>get patches in seconds. Free to try.</p>
            <button className="btn-primary" style={{fontSize:'16px',padding:'16px 44px'}} onClick={() => router.push('/login')}>
              Start Scanning Free →
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <footer>
          <span>© 2026 <span className="footer-brand">CyberSentry AI</span></span>
          <span>Built for Hackathon · Nischay Bansal</span>
        </footer>
      </div>
    </>
  )
}