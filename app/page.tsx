'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TYPING_LINES = [
  { text: "Initializing CyberSentry agent...", color: "#94a3b8" },
  { text: "Scanning Flask app for vulnerabilities...", color: "#94a3b8" },
  { text: "🚨 SQL Injection detected — CVSS 9.8", color: "#f87171" },
  { text: "🚨 Hardcoded secret_key — CVSS 8.2", color: "#fb923c" },
  { text: "🚨 Path Traversal — CVSS 7.5", color: "#fb923c" },
  { text: "🔧 Generating parameterized query patch...", color: "#facc15" },
  { text: "🔄 Re-verifying patched codebase...", color: "#22d3ee" },
  { text: "✅ Score: 4 → 96  |  All vulnerabilities fixed!", color: "#4ade80" },
]

/* ── GLITCH TEXT ── */
function GlitchText({ text }: { text: string }) {
  const [g, setG] = useState(false)
  useEffect(() => {
    const run = () => { setG(true); setTimeout(() => setG(false), 180); setTimeout(run, 3500 + Math.random() * 3000) }
    const t = setTimeout(run, 2500); return () => clearTimeout(t)
  }, [])
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {text}
      {g && <>
        <span style={{ position: 'absolute', inset: 0, color: '#22d3ee', clipPath: 'inset(25% 0 45% 0)', transform: 'translateX(-4px)', mixBlendMode: 'screen' }}>{text}</span>
        <span style={{ position: 'absolute', inset: 0, color: '#f43f5e', clipPath: 'inset(52% 0 12% 0)', transform: 'translateX(4px)', mixBlendMode: 'screen' }}>{text}</span>
      </>}
    </span>
  )
}

/* ── TERMINAL TYPER ── */
function TerminalTyper() {
  const [done, setDone] = useState<typeof TYPING_LINES>([])
  const [current, setCurrent] = useState('')
  const [li, setLi] = useState(0)
  const [ci, setCi] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const line = TYPING_LINES[li]
    if (ci < line.text.length) {
      const t = setTimeout(() => { setCurrent(p => p + line.text[ci]); setCi(c => c + 1) }, 22)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setDone(p => [...p.slice(-6), line]); setCurrent(''); setCi(0); setLi(i => (i + 1) % TYPING_LINES.length)
      }, 800)
      return () => clearTimeout(t)
    }
  }, [ci, li])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [done, current])

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.015)' }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:'50%',background:c,opacity:0.85}}/>)}
        <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.18)', fontFamily: "'JetBrains Mono',monospace" }}>cybersentry — live agent output</span>
        <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'blink 1.6s ease infinite', display: 'inline-block' }}/>
      </div>
      <div style={{ padding: '18px 20px', minHeight: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {done.map((l, i) => <div key={i} style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: l.color, opacity: 0.4, lineHeight: 1.7 }}>{l.text}</div>)}
        <div style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace", color: TYPING_LINES[li].color, lineHeight: 1.7 }}>
          {current}<span style={{ display: 'inline-block', width: 7, height: 13, background: '#4ade80', verticalAlign: 'middle', marginLeft: 2, animation: 'blink 1s ease infinite' }}/>
        </div>
        <div ref={endRef}/>
      </div>
    </div>
  )
}

/* ── ANIMATED BLOB BACKGROUND ── */
function BlobBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const onR = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onR)

    const blobs = [
      { x: W*0.15, y: H*0.25, r: 520, vx: 0.2, vy: 0.12, h: 158, s: 100, l: 52, ph: 0 },
      { x: W*0.85, y: H*0.6,  r: 600, vx: -0.16, vy: 0.14, h: 192, s: 90, l: 48, ph: 1.8 },
      { x: W*0.5,  y: H*0.92, r: 440, vx: 0.1, vy: -0.18, h: 148, s: 95, l: 44, ph: 3.1 },
      { x: W*0.08, y: H*0.75, r: 350, vx: 0.25, vy: -0.1, h: 206, s: 85, l: 54, ph: 0.8 },
    ]
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*0.28, vy: (Math.random()-.5)*0.28,
      r: Math.random()*1.4+0.5, a: Math.random()*0.35+0.08, ph: Math.random()*Math.PI*2
    }))

    let t = 0, fr: number
    const draw = () => {
      ctx.clearRect(0, 0, W, H); t += 0.006

      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r*.4 || b.x > W+b.r*.4) b.vx *= -1
        if (b.y < -b.r*.4 || b.y > H+b.r*.4) b.vy *= -1
        const p = Math.sin(t + b.ph) * 0.14 + 0.86
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r*p)
        g.addColorStop(0, `hsla(${b.h},${b.s}%,${b.l}%,0.11)`)
        g.addColorStop(0.45, `hsla(${b.h},${b.s}%,${b.l}%,0.05)`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })

      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.ph += 0.02
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        const a = p.a * (Math.sin(p.ph) * 0.3 + 0.7)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(74,222,128,${a})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
        const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y, d = Math.sqrt(dx*dx+dy*dy)
        if (d < 115) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(74,222,128,${0.065*(1-d/115)})`; ctx.lineWidth=0.5; ctx.stroke() }
      }

      const v = ctx.createRadialGradient(W/2, H/2, H*0.12, W/2, H/2, H*0.88)
      v.addColorStop(0,'transparent'); v.addColorStop(1,'rgba(3,4,10,0.68)')
      ctx.fillStyle=v; ctx.fillRect(0,0,W,H)
      fr = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(fr); window.removeEventListener('resize', onR) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}/>
}

/* ── SCROLL REVEAL ── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: v?1:0, transform: v?'none':'translateY(36px)', transition: `opacity 0.9s ease ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>
      {children}
    </div>
  )
}

/* ── SCROLL NAV ── */
function ScrollNav({ router }: { router: any }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 52px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(3,4,10,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(28px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
      transition: 'all 0.5s ease',
      animation: 'navIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both'
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => router.push('/')}>
        <div style={{ width:36,height:36,borderRadius:10,background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>🛡</div>
        <span style={{ fontSize:17,fontWeight:800,letterSpacing:'-0.025em' }}>Cyber<span style={{color:'#4ade80'}}>Sentry</span></span>
        <span style={{ fontSize:10,background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.22)',color:'#4ade80',padding:'2px 8px',borderRadius:20,fontFamily:"'JetBrains Mono',monospace",fontWeight:600 }}>AI</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button onClick={() => router.push('/login')} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:"'Syne',sans-serif",transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.color='white';e.currentTarget.style.background='rgba(255,255,255,0.06)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.4)';e.currentTarget.style.background='none'}}>Login</button>
        <button onClick={() => router.push('/login')} style={{ background:'#4ade80',color:'#03040a',border:'none',padding:'10px 22px',borderRadius:12,fontWeight:800,fontSize:14,fontFamily:"'Syne',sans-serif",cursor:'pointer',transition:'all 0.25s',boxShadow:'0 0 24px rgba(74,222,128,0.22)' }}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(74,222,128,0.4)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 24px rgba(74,222,128,0.22)'}}>Start Free →</button>
      </div>
    </nav>
  )
}

/* ── MAIN ── */
export default function Home() {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [counter, setCounter] = useState(12847)
  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
    const id = setInterval(() => setCounter(c => c + Math.floor(Math.random()*2+1)), 1800)
    return () => clearInterval(id)
  }, [])

  const R = ({ children, d = 0 }: { children: React.ReactNode; d?: number }) => <Reveal delay={d}>{children}</Reveal>

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#03040a;color:white;font-family:'Syne',sans-serif;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#060610}::-webkit-scrollbar-thumb{background:#1a3028;border-radius:3px}

        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes navIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroLoad{from{opacity:0;transform:translateY(55px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes scanDown{0%{top:-2px;opacity:0.6}100%{top:100%;opacity:0}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 16px rgba(74,222,128,0.18)}50%{box-shadow:0 0 50px rgba(74,222,128,0.55),0 0 100px rgba(74,222,128,0.08)}}
        @keyframes borderAnim{0%,100%{border-color:rgba(74,222,128,0.12)}50%{border-color:rgba(74,222,128,0.4)}}
        @keyframes counterUp{0%{transform:scale(1.15);color:#4ade80}100%{transform:scale(1)}}

        .page{opacity:0;transition:opacity 1.3s ease}
        .page.on{opacity:1}

        /* SCAN LINE */
        .scanline{position:fixed;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(74,222,128,0.18) 50%,transparent 100%);animation:scanDown 9s linear infinite;pointer-events:none;z-index:200}

        /* TICKER */
        .ticker{position:relative;z-index:10;overflow:hidden;background:rgba(74,222,128,0.025);border-bottom:1px solid rgba(74,222,128,0.06);padding:10px 0;margin-top:70px}
        .ticker-track{display:flex;width:max-content;animation:ticker 24s linear infinite}
        .ticker-item{display:flex;align-items:center;gap:8px;padding:0 44px;font-size:11.5px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.26);white-space:nowrap}

        /* HERO */
        .hero{position:relative;z-index:10;min-height:91vh;display:flex;align-items:center;padding:0 52px;gap:60px}
        .hero-left{flex:1;max-width:640px}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(74,222,128,0.05);border:1px solid rgba(74,222,128,0.18);border-radius:100px;padding:7px 18px;margin-bottom:30px;animation:fadeUp 0.8s ease 0.5s both;animation:borderAnim 4s ease infinite,fadeUp 0.8s ease 0.5s both}
        .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:glowPulse 2s ease infinite}
        h1{font-size:clamp(48px,6vw,86px);font-weight:800;line-height:1.0;letter-spacing:-0.04em;margin-bottom:24px;animation:heroLoad 1.1s cubic-bezier(0.16,1,0.3,1) 0.6s both}
        .grad{background:linear-gradient(130deg,#4ade80 0%,#22d3ee 40%,#818cf8 80%,#4ade80 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 7s linear infinite}
        .hero-sub{font-size:17px;color:rgba(255,255,255,0.35);line-height:1.9;margin-bottom:38px;font-family:'JetBrains Mono',monospace;animation:fadeUp 0.8s ease 0.75s both}
        .ctas{display:flex;gap:12px;flex-wrap:wrap;animation:fadeUp 0.8s ease 0.9s both}
        .btn-p{background:#4ade80;color:#03040a;border:none;padding:15px 32px;border-radius:14px;font-weight:800;font-size:15px;font-family:'Syne',sans-serif;cursor:pointer;transition:all 0.25s;box-shadow:0 4px 28px rgba(74,222,128,0.28);display:flex;align-items:center;gap:8px}
        .btn-p:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(74,222,128,0.5)}
        .btn-s{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.1);padding:15px 28px;border-radius:14px;font-weight:700;font-size:15px;font-family:'Syne',sans-serif;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;gap:8px}
        .btn-s:hover{border-color:rgba(74,222,128,0.35);color:white;background:rgba(74,222,128,0.05);transform:translateY(-3px)}

        .hero-right{flex:1;max-width:520px;animation:fadeUp 0.8s ease 0.7s both;display:flex;flex-direction:column;gap:14px}
        .score-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .sc{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:22px;text-align:center;backdrop-filter:blur(20px);transition:all 0.35s}
        .sc:hover{transform:translateY(-5px)}
        .sn{font-size:40px;font-weight:800;letter-spacing:-0.04em;margin-bottom:4px}
        .sl{font-size:11px;color:rgba(255,255,255,0.22);font-family:'JetBrains Mono',monospace}

        /* STATS */
        .statsbar{position:relative;z-index:10;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,0.04);border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
        .si{padding:28px 24px;text-align:center;background:#03040a;transition:all 0.3s;cursor:default}
        .si:hover{background:rgba(74,222,128,0.02)}
        .siv{font-size:28px;font-weight:800;letter-spacing:-0.04em;color:#4ade80;margin-bottom:5px}
        .sil{font-size:11.5px;color:rgba(255,255,255,0.22);font-family:'JetBrains Mono',monospace}

        /* SECTIONS */
        .sec{position:relative;z-index:10;padding:110px 52px}
        .sec-tag{font-size:11px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:#4ade80;font-family:'JetBrains Mono',monospace;margin-bottom:16px}
        .sec-title{font-size:clamp(28px,3.5vw,46px);font-weight:800;letter-spacing:-0.035em;line-height:1.08;margin-bottom:14px}
        .sec-sub{font-size:15px;color:rgba(255,255,255,0.28);line-height:1.9;font-family:'JetBrains Mono',monospace;max-width:480px}

        .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:52px}
        .card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:34px;position:relative;overflow:hidden;transition:all 0.45s cubic-bezier(0.16,1,0.3,1);cursor:default}
        .card::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 0 0,rgba(74,222,128,0.08),transparent 55%);opacity:0;transition:opacity 0.4s}
        .card:hover{border-color:rgba(74,222,128,0.28);transform:translateY(-12px) scale(1.01);box-shadow:0 44px 100px rgba(0,0,0,0.55),0 0 80px rgba(74,222,128,0.04)}
        .card:hover::after{opacity:1}
        .card-num{font-size:72px;font-weight:800;color:rgba(255,255,255,0.022);letter-spacing:-0.04em;line-height:1;float:right}
        .card-icon{width:52px;height:52px;border-radius:15px;background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.16);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px;transition:all 0.35s}
        .card:hover .card-icon{transform:scale(1.12) rotate(6deg);background:rgba(74,222,128,0.14)}
        .card-title{font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-bottom:10px}
        .card-desc{font-size:13px;color:rgba(255,255,255,0.3);line-height:1.85;font-family:'JetBrains Mono',monospace}

        /* VULNS */
        .vsec{position:relative;z-index:10;padding:110px 52px;background:rgba(255,255,255,0.008);border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);text-align:center}
        .chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:820px;margin:0 auto 56px}
        .chip{padding:9px 18px;border-radius:100px;font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace;border:1px solid;cursor:default;transition:all 0.25s}
        .chip:hover{transform:translateY(-5px) scale(1.06)}
        .cc{background:rgba(248,113,113,0.06);border-color:rgba(248,113,113,0.2);color:#f87171}
        .ch{background:rgba(251,146,60,0.06);border-color:rgba(251,146,60,0.2);color:#fb923c}
        .cm{background:rgba(250,204,21,0.06);border-color:rgba(250,204,21,0.2);color:#facc15}
        .cvss{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:13px;max-width:900px;margin:0 auto}
        .cvc{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;transition:all 0.3s;text-align:left}
        .cvc:hover{transform:translateY(-5px);border-color:rgba(74,222,128,0.18)}
        .cvn{font-size:13px;font-weight:800;margin-bottom:2px}
        .cvd{font-size:11px;color:rgba(255,255,255,0.22);font-family:'JetBrains Mono',monospace}
        .cvs{min-width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;font-family:'JetBrains Mono',monospace}

        /* CTA */
        .cta{position:relative;z-index:10;padding:110px 52px;text-align:center}
        .cta-inner{max-width:620px;margin:0 auto;position:relative}
        .cta-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:580px;height:280px;background:radial-gradient(ellipse,rgba(74,222,128,0.07),transparent 70%);pointer-events:none}
        .cta-title{font-size:clamp(30px,3.8vw,50px);font-weight:800;letter-spacing:-0.04em;line-height:1.1;margin-bottom:16px}
        .cta-sub{font-size:15px;color:rgba(255,255,255,0.28);line-height:1.85;margin-bottom:38px;font-family:'JetBrains Mono',monospace}

        /* TECH + FOOTER */
        .tech{position:relative;z-index:10;padding:52px;text-align:center;border-top:1px solid rgba(255,255,255,0.04)}
        .tech-label{font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(255,255,255,0.12);font-family:'JetBrains Mono',monospace;margin-bottom:28px}
        .tech-items{display:flex;flex-wrap:wrap;justify-content:center;gap:44px}
        .ti{font-size:13px;font-weight:700;color:rgba(255,255,255,0.13);font-family:'JetBrains Mono',monospace;cursor:default;transition:all 0.2s;text-transform:uppercase;letter-spacing:0.06em}
        .ti:hover{color:rgba(255,255,255,0.55)}
        footer{position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);padding:26px 52px;display:flex;justify-content:space-between;align-items:center}
        .ft{font-size:12px;color:rgba(255,255,255,0.14);font-family:'JetBrains Mono',monospace}

        @media(max-width:960px){
          .hero{flex-direction:column;padding:40px 24px;gap:36px;min-height:auto;padding-top:60px}
          .hero-left,.hero-right{max-width:100%;width:100%}
          .sec,.vsec,.cta{padding:72px 24px}
          .statsbar{grid-template-columns:repeat(2,1fr)}
          .cards{grid-template-columns:1fr}
          nav,footer{padding-left:24px;padding-right:24px}
          .tech{padding:48px 24px}
        }
      `}</style>

      <BlobBG/>
      <div className="scanline"/>

      <div className={`page${loaded ? ' on' : ''}`}>
        <ScrollNav router={router}/>

        {/* TICKER */}
        <div className="ticker">
          <div className="ticker-track">
            {[...Array(2)].map((_,r) => (
              <span key={r} style={{display:'contents'}}>
                {[
                  {c:'#4ade80',k:'Agent:',v:'ONLINE'},
                  {c:'#22d3ee',k:'OWASP:',v:'100% covered'},
                  {c:'#f87171',k:'Critical blocked:',v:'2,341'},
                  {c:'#fb923c',k:'Vulns fixed today:',v:counter.toLocaleString()},
                  {c:'#818cf8',k:'Avg scan time:',v:'<4.2s'},
                  {c:'#4ade80',k:'Languages:',v:'9 supported'},
                  {c:'#facc15',k:'CVSS scoring:',v:'Live'},
                ].map((item,i) => (
                  <div key={`${r}-${i}`} className="ticker-item">
                    <div style={{width:5,height:5,borderRadius:'50%',background:item.c,flexShrink:0}}/>
                    <span>{item.k} <span style={{color:'white',fontWeight:700}}>{item.v}</span></span>
                    <span style={{opacity:0.15,marginLeft:18}}>◆</span>
                  </div>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* HERO */}
        <section className="hero">
          <div className="hero-left">
            <div className="eyebrow">
              <div className="eyebrow-dot"/>
              <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:'#4ade80',fontWeight:600}}>Agentic AI · OWASP Top 10 · Chain-of-Thought</span>
            </div>
            <h1>
              Your Code's<br/>
              <span className="grad"><GlitchText text="AI Security"/></span><br/>
              <span style={{color:'rgba(255,255,255,0.88)'}}>Guardian.</span>
            </h1>
            <p className="hero-sub">Autonomous agent that thinks,<br/>patches & verifies — in real time.</p>
            <div className="ctas">
              <button className="btn-p" onClick={()=>router.push('/login')}>🛡 Scan My Code Free</button>
              <button className="btn-s" onClick={()=>router.push('/scan')}>👁 Live Demo</button>
            </div>
          </div>
          <div className="hero-right">
            <TerminalTyper/>
            <div className="score-row">
              <div className="sc">
                <div className="sn" style={{color:'#f87171'}}>4</div>
                <div className="sl">Score Before</div>
              </div>
              <div className="sc" style={{border:'1px solid rgba(74,222,128,0.2)',background:'rgba(74,222,128,0.025)'}}>
                <div className="sn" style={{color:'#4ade80'}}>96</div>
                <div className="sl">Score After ↑92pts</div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <Reveal>
          <div className="statsbar">
            {[{v:'OWASP',l:'Top 10 Covered'},{v:'3-Step',l:'Agentic Loop'},{v:'4→96',l:'Score Delta'},{v:'<5s',l:'Scan Speed'}].map((s,i)=>(
              <div className="si" key={i}><div className="siv">{s.v}</div><div className="sil">{s.l}</div></div>
            ))}
          </div>
        </Reveal>

        {/* HOW IT WORKS */}
        <section className="sec">
          <Reveal><div className="sec-tag">The Agent Loop</div></Reveal>
          <Reveal d={0.1}><h2 className="sec-title">How CyberSentry <GlitchText text="Thinks"/></h2></Reveal>
          <Reveal d={0.15}><p className="sec-sub">Every reasoning step is visible. Not a black box — a glass box.</p></Reveal>
          <div className="cards">
            {[{i:'🔍',n:'01',t:'Analyze & Reason',d:'Scans your full codebase using chain-of-thought reasoning. Every decision is surfaced live — you see exactly what the AI is thinking.'},
              {i:'⚡',n:'02',t:'Generate Patches',d:'Writes production-ready secure fixes: parameterized queries, env vars, path validation — fully explained in plain English.'},
              {i:'🔒',n:'03',t:'Verify & Score',d:'Re-scans the patched code, confirms all vulnerabilities fixed, then issues an industry-standard CVSS security score.'},
            ].map((s,i) => (
              <Reveal key={i} delay={i*0.12}>
                <div className="card">
                  <span className="card-num">{s.n}</span>
                  <div className="card-icon">{s.i}</div>
                  <div className="card-title">{s.t}</div>
                  <div className="card-desc">{s.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* VULNS */}
        <div className="vsec">
          <Reveal>
            <div className="sec-tag" style={{textAlign:'center'}}>Detection Coverage</div>
            <h2 className="sec-title" style={{textAlign:'center'}}>What We <GlitchText text="Detect"/></h2>
            <p className="sec-sub" style={{margin:'0 auto 52px',textAlign:'center'}}>Full OWASP Top 10 · 9 languages · Live CVSS scoring</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="chips">
              {[{n:'SQL Injection',s:'c'},{n:'Command Injection',s:'c'},{n:'Broken Auth',s:'c'},{n:'Path Traversal',s:'h'},{n:'Hardcoded Secrets',s:'h'},{n:'XSS',s:'h'},{n:'Insecure Deserialization',s:'h'},{n:'Security Misconfiguration',s:'m'},{n:'CSRF',s:'m'},{n:'Sensitive Data Exposure',s:'h'}].map((v,i)=>(
                <span key={i} className={`chip c${v.s}`}>{v.n}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="cvss">
              {[{s:'9.8',n:'SQL Injection',d:'Remote code execution',bg:'rgba(248,113,113,0.07)',b:'rgba(248,113,113,0.22)',c:'#f87171'},
                {s:'9.0',n:'Command Injection',d:'Arbitrary OS execution',bg:'rgba(248,113,113,0.05)',b:'rgba(248,113,113,0.16)',c:'#f87171'},
                {s:'8.2',n:'Hardcoded Secrets',d:'Credential exposure',bg:'rgba(251,146,60,0.07)',b:'rgba(251,146,60,0.22)',c:'#fb923c'},
                {s:'7.5',n:'Path Traversal',d:'File system bypass',bg:'rgba(251,146,60,0.05)',b:'rgba(251,146,60,0.16)',c:'#fb923c'},
                {s:'6.1',n:'XSS',d:'Client-side injection',bg:'rgba(250,204,21,0.06)',b:'rgba(250,204,21,0.2)',c:'#facc15'},
                {s:'5.3',n:'CSRF',d:'Cross-site forgery',bg:'rgba(129,140,248,0.06)',b:'rgba(129,140,248,0.2)',c:'#818cf8'},
              ].map((cv,i)=>(
                <div className="cvc" key={i}>
                  <div className="cvs" style={{background:cv.bg,border:`1px solid ${cv.b}`,color:cv.c}}>{cv.s}</div>
                  <div><div className="cvn">{cv.n}</div><div className="cvd">{cv.d}</div></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* TECH */}
        <div className="tech">
          <Reveal>
            <div className="tech-label">Powered By</div>
            <div className="tech-items">
              {['Next.js 14','Claude API','Supabase','TypeScript','Vercel','Tailwind CSS'].map((t,i)=><span key={i} className="ti">{t}</span>)}
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <div className="cta">
          <Reveal>
            <div className="cta-inner">
              <div className="cta-glow"/>
              <div className="sec-tag" style={{marginBottom:20}}>Get Started Free</div>
              <h2 className="cta-title">Ready to <span className="grad">Secure</span><br/>Your Code?</h2>
              <p className="cta-sub">Paste code, watch the AI reason in real time,<br/>get production-ready patches in seconds.</p>
              <button className="btn-p" style={{margin:'0 auto',fontSize:16,padding:'16px 42px'}} onClick={()=>router.push('/login')}>
                Start Scanning Free →
              </button>
            </div>
          </Reveal>
        </div>

        <footer>
          <span className="ft">© 2026 <span style={{color:'#4ade80'}}>CyberSentry AI</span></span>
          <span className="ft">Built for Hackathon · Nischay Bansal</span>
        </footer>
      </div>
    </>
  )
}