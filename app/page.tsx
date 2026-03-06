'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TYPING = [
  "🔍 Scanning Flask app for vulnerabilities...",
  "🧠 Reasoning: f-string in SQL = injection vector",
  "🚨 CRITICAL: SQL Injection at line 12",
  "🚨 HIGH: Hardcoded secret_key = 'abc123'",
  "🔧 Generating parameterized query patch...",
  "🔄 Re-verifying patched codebase...",
  "✅ Security score: 23 → 94 | All clear 🎉",
]

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cols = Math.floor(canvas.width / 18)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01アイウエカキクケコセキュリティ脆弱性SECURE{}[]</>$#@'
    const draw = () => {
      ctx.fillStyle = 'rgba(5,5,8,0.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drops.forEach((y, i) => {
        const bright = Math.random() > 0.95
        ctx.fillStyle = bright ? '#ffffff' : '#00ff88'
        ctx.font = `${bright ? 'bold ' : ''}13px monospace`
        ctx.globalAlpha = bright ? 0.9 : 0.25
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 18, y * 18)
        ctx.globalAlpha = 1
        if (y * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const id = setInterval(draw, 45)
    return () => clearInterval(id)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

function SplashCounter() {
  const [n, setN] = useState(0)
  useEffect(() => {
    let v = 0
    const id = setInterval(() => {
      v += Math.ceil((100 - v) / 10)
      if (v >= 100) { setN(100); clearInterval(id) } else setN(v)
    }, 35)
    return () => clearInterval(id)
  }, [])
  return <div style={{ textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: '#00ff88', marginTop: '6px' }}>{n}%</div>
}

function LiveCounter() {
  const [count, setCount] = useState(12847)
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3)), 2000)
    return () => clearInterval(id)
  }, [])
  return <span>{count.toLocaleString()}</span>
}

export default function Home() {
  const router = useRouter()
  const [splash, setSplash] = useState(true)
  const [splashFade, setSplashFade] = useState(false)
  const [lineIdx, setLineIdx] = useState(0)
  const [text, setText] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [completedLines, setCompletedLines] = useState<string[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFade(true), 2200)
    const t2 = setTimeout(() => { setSplash(false); setVisible(true) }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (splash) return
    const line = TYPING[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => { setText(p => p + line[charIdx]); setCharIdx(c => c + 1) }, 26)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setCompletedLines(p => [...p.slice(-5), line])
        setText(''); setCharIdx(0); setLineIdx(i => (i + 1) % TYPING.length)
      }, 900)
      return () => clearTimeout(t)
    }
  }, [charIdx, lineIdx, splash])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#050508;color:white;font-family:'Space Grotesk',sans-serif;overflow-x:hidden;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:#0a0a12;} ::-webkit-scrollbar-thumb{background:#1a1a2e;border-radius:3px;}

        /* KEYFRAMES */
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.2)}50%{box-shadow:0 0 50px rgba(0,255,136,0.5),0 0 100px rgba(0,255,136,0.1)}}
        @keyframes scanLine{0%{transform:translateY(-100%)}100%{transform:translateY(800%)}}
        @keyframes ringPop{0%{transform:scale(0) rotate(-180deg);opacity:0}60%{transform:scale(1.12) rotate(8deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes ringPulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.15);opacity:0}}
        @keyframes loadBar{from{width:0}to{width:100%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes countPop{0%{transform:scale(1)}50%{transform:scale(1.15);color:#00ff88}100%{transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes borderFlow{0%{border-color:rgba(0,255,136,0.3)}33%{border-color:rgba(0,170,255,0.3)}66%{border-color:rgba(255,68,102,0.2)}100%{border-color:rgba(0,255,136,0.3)}}

        /* SPLASH */
        .splash{position:fixed;inset:0;z-index:9999;background:#050508;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;transition:opacity 0.8s ease;}
        .splash.fade{opacity:0;pointer-events:none;}
        .splash-center{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:20px;}
        .splash-ring{width:110px;height:110px;border-radius:50%;border:2px solid transparent;background:linear-gradient(#050508,#050508) padding-box,linear-gradient(135deg,#00ff88,#00aaff,#ff4466,#00ff88) border-box;display:flex;align-items:center;justify-content:center;position:relative;animation:ringPop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards;box-shadow:0 0 80px rgba(0,255,136,0.15),inset 0 0 40px rgba(0,255,136,0.04);}
        .splash-ring::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(0,255,136,0.2);animation:ringPulse 2s ease infinite;}
        .splash-ring::after{content:'';position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(0,255,136,0.08);animation:ringPulse 2s ease 0.4s infinite;}
        .splash-icon{font-size:42px;filter:drop-shadow(0 0 24px rgba(0,255,136,0.7));}
        .splash-name{font-size:30px;font-weight:800;letter-spacing:-0.03em;animation:fadeUp 0.5s ease 0.5s both;}
        .splash-tag{font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.2em;text-transform:uppercase;font-weight:600;animation:fadeUp 0.5s ease 0.7s both;}
        .splash-bar{width:180px;animation:fadeUp 0.5s ease 0.8s both;}
        .splash-track{height:2px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;}
        .splash-fill{height:100%;background:linear-gradient(90deg,#00ff88,#00ccff);border-radius:2px;animation:loadBar 2s cubic-bezier(0.4,0,0.2,1) forwards;box-shadow:0 0 10px rgba(0,255,136,0.5);}

        /* PAGE */
        .page{opacity:0;transition:opacity 1s ease;}
        .page.show{opacity:1;}

        /* BG */
        .bg-fixed{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
        .orb{position:absolute;border-radius:50%;filter:blur(100px);}
        .orb1{width:800px;height:800px;background:radial-gradient(circle,rgba(0,255,136,0.06) 0%,transparent 70%);top:-250px;left:-250px;animation:float 12s ease infinite;}
        .orb2{width:700px;height:700px;background:radial-gradient(circle,rgba(68,136,255,0.05) 0%,transparent 70%);bottom:-150px;right:-150px;animation:float 15s ease infinite reverse;}
        .orb3{width:500px;height:500px;background:radial-gradient(circle,rgba(255,68,102,0.03) 0%,transparent 70%);top:45%;left:40%;animation:float 10s ease 2s infinite;}
        .grid-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(0,255,136,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.02) 1px,transparent 1px);background-size:56px 56px;}
        .dots-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(circle,rgba(0,255,136,0.08) 1px,transparent 1px);background-size:40px 40px;opacity:0.18;}

        /* NAV */
        nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:16px 48px;background:rgba(5,5,8,0.85);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05);}
        .nav-logo{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .nav-icon{width:36px;height:36px;border-radius:10px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;animation:glow 3s ease infinite;}
        .nav-badge{font-size:10px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.25);color:#00ff88;padding:2px 8px;border-radius:20px;font-weight:700;letter-spacing:0.05em;}
        .nav-right{display:flex;align-items:center;gap:8px;}
        .btn-ghost-nav{color:rgba(255,255,255,0.4);background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.2s;font-family:'Space Grotesk',sans-serif;}
        .btn-ghost-nav:hover{color:white;background:rgba(255,255,255,0.06);}

        /* LIVE TICKER */
        .live-ticker{position:relative;z-index:10;background:rgba(0,255,136,0.04);border-bottom:1px solid rgba(0,255,136,0.1);padding:10px 0;overflow:hidden;margin-top:68px;}
        .ticker-inner{display:flex;align-items:center;justify-content:center;gap:32px;font-size:12px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.3);}
        .ticker-item{display:flex;align-items:center;gap:8px;}
        .ticker-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;animation:blink 2s ease infinite;}
        .ticker-val{color:#00ff88;font-weight:600;}

        /* HERO */
        .hero{position:relative;z-index:10;min-height:calc(100vh - 68px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.18);border-radius:100px;padding:8px 20px;margin-bottom:28px;animation:fadeUp 0.7s ease 0.1s both;}
        .pulse-dot{width:7px;height:7px;border-radius:50%;background:#00ff88;animation:blink 1.5s ease infinite;}
        h1{font-size:clamp(50px,9vw,96px);font-weight:800;line-height:1.0;letter-spacing:-0.03em;margin-bottom:22px;animation:fadeUp 0.7s ease 0.2s both;}
        .grad{background:linear-gradient(135deg,#00ff88 0%,#00ccff 60%,#00ff88 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}
        .hero-sub{font-size:clamp(16px,2.2vw,20px);color:rgba(255,255,255,0.42);max-width:560px;line-height:1.75;margin-bottom:42px;animation:fadeUp 0.7s ease 0.3s both;}
        .cta-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:56px;animation:fadeUp 0.7s ease 0.4s both;}
        .btn-primary{background:#00ff88;color:#000;border:none;padding:15px 34px;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer;transition:all 0.25s;display:inline-flex;align-items:center;gap:8px;font-family:'Space Grotesk',sans-serif;box-shadow:0 4px 24px rgba(0,255,136,0.3);}
        .btn-primary:hover{background:#00ff99;transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,255,136,0.45);}
        .btn-outline{background:transparent;color:white;border:1px solid rgba(255,255,255,0.12);padding:15px 28px;border-radius:14px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.25s;display:inline-flex;align-items:center;gap:8px;font-family:'Space Grotesk',sans-serif;}
        .btn-outline:hover{border-color:rgba(0,255,136,0.4);background:rgba(0,255,136,0.05);transform:translateY(-3px);}

        /* TERMINAL */
        .terminal-wrap{width:100%;max-width:680px;animation:fadeUp 0.7s ease 0.5s both;}
        .terminal{background:#07080f;border:1px solid rgba(0,255,136,0.14);border-radius:18px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.8),0 0 60px rgba(0,255,136,0.04);position:relative;}
        .terminal::before{content:'';position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.4),transparent);top:0;animation:scanLine 4s ease infinite;}
        .term-bar{background:#0d0e18;padding:13px 18px;display:flex;align-items:center;gap:7px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .dot{width:11px;height:11px;border-radius:50%;}
        .dot-r{background:#ff5f56;} .dot-y{background:#ffbd2e;} .dot-g{background:#27c93f;}
        .term-title{margin-left:10px;font-size:12px;color:rgba(255,255,255,0.18);font-family:'JetBrains Mono',monospace;}
        .term-body{padding:18px 22px;min-height:140px;display:flex;flex-direction:column;gap:4px;}
        .term-line{font-size:13px;font-family:'JetBrains Mono',monospace;padding:2px 0;line-height:1.5;}
        .term-done{opacity:0.38;}
        .term-success{color:#00ff88;opacity:1;} .term-error{color:#ff4466;opacity:1;} .term-warn{color:#ff9500;opacity:1;}
        .cursor{display:inline-block;width:8px;height:14px;background:#00ff88;vertical-align:middle;margin-left:2px;animation:blink 1s ease infinite;}

        /* STATS */
        .stats{position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);padding:48px;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;max-width:960px;margin:0 auto;}
        .stat{text-align:center;}
        .stat-n{font-size:34px;font-weight:800;color:#00ff88;letter-spacing:-0.02em;margin-bottom:4px;}
        .stat-l{font-size:13px;color:rgba(255,255,255,0.3);}

        /* SECTIONS */
        .section{position:relative;z-index:10;padding:96px 48px;text-align:center;}
        .sec-tag{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00ff88;margin-bottom:14px;}
        .sec-title{font-size:clamp(30px,4.5vw,52px);font-weight:800;letter-spacing:-0.02em;margin-bottom:14px;line-height:1.1;}
        .sec-sub{font-size:17px;color:rgba(255,255,255,0.38);max-width:520px;line-height:1.7;margin:0 auto 56px;}

        /* CARDS */
        .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px;max-width:1080px;margin:0 auto;}
        .card{background:rgba(255,255,255,0.018);border:1px solid rgba(255,255,255,0.07);border-radius:22px;padding:32px;transition:all 0.35s;cursor:default;position:relative;overflow:hidden;animation:borderFlow 8s ease infinite;}
        .card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at top left,rgba(0,255,136,0.05),transparent 60%);opacity:0;transition:opacity 0.35s;}
        .card:hover{border-color:rgba(0,255,136,0.3);transform:translateY(-8px) scale(1.01);box-shadow:0 30px 80px rgba(0,0,0,0.5),0 0 50px rgba(0,255,136,0.06);}
        .card:hover::before{opacity:1;}
        .card-icon{width:52px;height:52px;border-radius:14px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.18);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px;transition:all 0.3s;}
        .card:hover .card-icon{background:rgba(0,255,136,0.15);transform:scale(1.1) rotate(5deg);}
        .card-n{font-size:54px;font-weight:800;color:rgba(255,255,255,0.03);float:right;line-height:1;margin-top:-6px;letter-spacing:-0.04em;}
        .card-t{font-size:18px;font-weight:700;margin-bottom:10px;color:white;}
        .card-d{font-size:14px;color:rgba(255,255,255,0.36);line-height:1.75;}

        /* VULNS */
        .vuln-wrap{display:flex;flex-wrap:wrap;gap:11px;justify-content:center;max-width:880px;margin:0 auto;}
        .vbadge{padding:9px 18px;border-radius:100px;font-size:13px;font-weight:700;cursor:default;transition:all 0.25s;border-width:1px;border-style:solid;}
        .vbadge:hover{transform:translateY(-4px) scale(1.05);}
        .vc{background:rgba(255,68,102,0.07);border-color:rgba(255,68,102,0.28);color:#ff4466;}
        .vh{background:rgba(255,149,0,0.07);border-color:rgba(255,149,0,0.28);color:#ff9500;}
        .vm{background:rgba(255,200,0,0.07);border-color:rgba(255,200,0,0.28);color:#ffc800;}

        /* CVSS TABLE */
        .cvss-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;max-width:960px;margin:0 auto;}
        .cvss-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;display:flex;align-items:center;gap:16px;transition:all 0.3s;cursor:default;}
        .cvss-card:hover{transform:translateY(-4px);border-color:rgba(0,255,136,0.2);}
        .cvss-score{min-width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;}
        .cvss-info{}
        .cvss-name{font-size:14px;font-weight:700;margin-bottom:3px;}
        .cvss-desc{font-size:12px;color:rgba(255,255,255,0.3);line-height:1.5;}

        /* TECH STACK */
        .tech-row{display:flex;flex-wrap:wrap;justify-content:center;gap:44px;align-items:center;}
        .tech-item{color:rgba(255,255,255,0.2);font-weight:700;font-size:15px;cursor:default;transition:color 0.25s;}
        .tech-item:hover{color:rgba(255,255,255,0.7);}

        /* CTA */
        .cta-wrap{position:relative;z-index:10;text-align:center;padding:100px 48px;}
        .cta-box{max-width:700px;margin:0 auto;background:rgba(0,255,136,0.02);border:1px solid rgba(0,255,136,0.1);border-radius:32px;padding:80px 60px;position:relative;overflow:hidden;}
        .cta-box::before{content:'';position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.05) 0%,transparent 70%);}
        .cta-title{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-0.02em;margin-bottom:14px;}
        .cta-sub{font-size:17px;color:rgba(255,255,255,0.36);margin-bottom:40px;line-height:1.6;}

        /* FOOTER */
        footer{position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);padding:32px 48px;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:rgba(255,255,255,0.18);}
        .footer-brand{color:#00ff88;font-weight:700;}

        @media(max-width:768px){
          nav{padding:14px 20px;}
          .stats{grid-template-columns:repeat(2,1fr);padding:36px 20px;}
          .section{padding:60px 20px;}
          .cta-box{padding:48px 24px;}
          footer{flex-direction:column;gap:8px;text-align:center;padding:24px;}
          .ticker-inner{gap:16px;font-size:11px;}
        }
      `}</style>

      {/* SPLASH */}
      {splash && (
        <div className={`splash${splashFade ? ' fade' : ''}`}>
          <MatrixRain />
          <div className="splash-center">
            <div className="splash-ring">
              <span className="splash-icon">🛡</span>
            </div>
            <div className="splash-name">
              Cyber<span style={{color:'#00ff88'}}>Sentry</span>
              <span style={{fontSize:'13px',marginLeft:'10px',background:'rgba(0,255,136,0.12)',color:'#00ff88',padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(0,255,136,0.3)',fontWeight:700,verticalAlign:'middle'}}>AI</span>
            </div>
            <div className="splash-tag">Agentic Security · OWASP Top 10</div>
            <div className="splash-bar">
              <div className="splash-track"><div className="splash-fill" /></div>
              <SplashCounter />
            </div>
          </div>
        </div>
      )}

      {/* BG */}
      <div className="bg-fixed">
        <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
      </div>
      <div className="grid-bg"/>
      <div className="dots-bg"/>

      <div className={`page${visible ? ' show' : ''}`}>

        {/* NAV */}
        <nav>
          <div className="nav-logo" onClick={() => router.push('/')}>
            <div className="nav-icon">🛡</div>
            <span style={{fontSize:'17px',fontWeight:800,color:'white'}}>Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
            <span className="nav-badge">AI</span>
          </div>
          <div className="nav-right">
            <button className="btn-ghost-nav" onClick={() => router.push('/login')}>Login</button>
            <button className="btn-primary" style={{padding:'10px 22px',fontSize:'14px'}} onClick={() => router.push('/login')}>Start Free →</button>
          </div>
        </nav>

        {/* LIVE TICKER */}
        <div className="live-ticker">
          <div className="ticker-inner">
            <div className="ticker-item"><div className="ticker-dot"/><span>Vulnerabilities found today: <span className="ticker-val"><LiveCounter /></span></span></div>
            <div className="ticker-item"><div className="ticker-dot" style={{background:'#ff9500'}}/><span>Agent status: <span style={{color:'#ff9500',fontWeight:600}}>ONLINE</span></span></div>
            <div className="ticker-item"><div className="ticker-dot" style={{background:'#4488ff'}}/><span>OWASP coverage: <span style={{color:'#4488ff',fontWeight:600}}>100%</span></span></div>
          </div>
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">
            <div className="pulse-dot"/>
            <span style={{fontSize:'13px',color:'#00ff88',fontWeight:600}}>Agentic AI · Chain-of-Thought Reasoning · OWASP Top 10</span>
          </div>
          <h1>Your Code's<br/><span className="grad">AI Security Guard</span></h1>
          <p className="hero-sub">An autonomous AI agent that thinks like a senior security engineer — scanning, reasoning, patching, and verifying your code in seconds.</p>
          <div className="cta-row">
            <button className="btn-primary" onClick={() => router.push('/login')}>🛡 Scan My Code Free</button>
            <button className="btn-outline" onClick={() => router.push('/scan')}>👁 Live Demo</button>
          </div>
          <div className="terminal-wrap">
            <div className="terminal">
              <div className="term-bar">
                <div className="dot dot-r"/><div className="dot dot-y"/><div className="dot dot-g"/>
                <span className="term-title">cyber-sentry — agent output</span>
              </div>
              <div className="term-body">
                {completedLines.map((line, i) => (
                  <div key={i} className={`term-line term-done ${line.includes('✅')?'term-success':line.includes('🚨')?'term-error':line.includes('🔧')||line.includes('🔄')?'term-warn':''}`}>{line}</div>
                ))}
                <div className="term-line" style={{color:'#00ff88'}}>{text}<span className="cursor"/></div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          {[{n:'OWASP',l:'Top 10 Covered'},{n:'3-Step',l:'Agentic Loop'},{n:'23→94',l:'Score Delta'},{n:'<5s',l:'Scan Speed'}].map((s,i)=>(
            <div className="stat" key={i}><div className="stat-n">{s.n}</div><div className="stat-l">{s.l}</div></div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="section">
          <p className="sec-tag">The Agent Loop</p>
          <h2 className="sec-title">How CyberSentry Thinks</h2>
          <p className="sec-sub">Watch the AI reason through every vulnerability — not just detect, but explain and fix</p>
          <div className="cards">
            {[
              {i:'🔍',n:'01',t:'Analyze & Reason',d:'Agent scans your full codebase, builds a vulnerability map using chain-of-thought reasoning — every decision is visible to you in real time.'},
              {i:'⚡',n:'02',t:'Generate Patches',d:'Writes production-ready secure code with parameterized queries, env variables, path validation — explaining every single change made.'},
              {i:'🔒',n:'03',t:'Verify & Score',d:'Re-scans patched code to confirm all fixes work, then issues an industry-standard security score showing your exact improvement.'},
            ].map((c,i)=>(
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
          <p className="sec-sub" style={{marginBottom:'40px'}}>Full OWASP Top 10 coverage across 9 programming languages</p>
          <div className="vuln-wrap" style={{marginBottom:'60px'}}>
            {[{n:'SQL Injection',s:'c'},{n:'XSS',s:'h'},{n:'Path Traversal',s:'h'},{n:'Hardcoded Secrets',s:'h'},{n:'Command Injection',s:'c'},{n:'CSRF',s:'m'},{n:'Broken Auth',s:'c'},{n:'Insecure Deserialization',s:'h'},{n:'Security Misconfiguration',s:'m'},{n:'Sensitive Data Exposure',s:'h'}].map((v,i)=>(
              <span key={i} className={`vbadge v${v.s}`}>{v.n}</span>
            ))}
          </div>

          {/* CVSS SCORES */}
          <p className="sec-tag" style={{marginBottom:'24px'}}>Industry-Standard CVSS Scoring</p>
          <div className="cvss-grid">
            {[
              {score:'9.8',name:'SQL Injection',desc:'Remote code execution risk',bg:'rgba(255,68,102,0.1)',border:'rgba(255,68,102,0.25)',color:'#ff4466'},
              {score:'8.2',name:'Hardcoded Secrets',desc:'Credential exposure vector',bg:'rgba(255,149,0,0.1)',border:'rgba(255,149,0,0.25)',color:'#ff9500'},
              {score:'7.5',name:'Path Traversal',desc:'File system access bypass',bg:'rgba(255,149,0,0.1)',border:'rgba(255,149,0,0.25)',color:'#ff9500'},
              {score:'6.1',name:'XSS',desc:'Client-side script injection',bg:'rgba(255,200,0,0.1)',border:'rgba(255,200,0,0.25)',color:'#ffc800'},
              {score:'5.3',name:'CSRF',desc:'Cross-site request forgery',bg:'rgba(68,136,255,0.1)',border:'rgba(68,136,255,0.25)',color:'#4488ff'},
              {score:'4.8',name:'Insecure Config',desc:'Security misconfiguration',bg:'rgba(68,136,255,0.1)',border:'rgba(68,136,255,0.25)',color:'#4488ff'},
            ].map((c,i)=>(
              <div className="cvss-card" key={i}>
                <div className="cvss-score" style={{background:c.bg,border:`1px solid ${c.border}`,color:c.color}}>{c.score}</div>
                <div className="cvss-info">
                  <div className="cvss-name">{c.name}</div>
                  <div className="cvss-desc">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TECH STACK */}
        <div className="section">
          <p style={{fontSize:'11px',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(255,255,255,0.15)',marginBottom:'36px'}}>Built With</p>
          <div className="tech-row">
            {['Next.js 14','Claude API','Supabase','TypeScript','Vercel','Tailwind CSS'].map((t,i)=>(
              <span key={i} className="tech-item">{t}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-wrap">
          <div className="cta-box">
            <p className="sec-tag" style={{marginBottom:'18px'}}>Get Started Free</p>
            <h2 className="cta-title">Ready to Secure<br/>Your Code?</h2>
            <p className="cta-sub">Paste your code, watch the AI agent work in real-time,<br/>get production-ready patches in seconds.</p>
            <button className="btn-primary" style={{fontSize:'16px',padding:'16px 44px'}} onClick={() => router.push('/login')}>
              Start Scanning Free →
            </button>
          </div>
        </div>

        <footer>
          <span>© 2026 <span className="footer-brand">CyberSentry AI</span></span>
          <span>Built for Hackathon · Nischay Bansal</span>
        </footer>
      </div>
    </>
  )
}
