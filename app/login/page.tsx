'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ── ANIMATED BACKGROUND: morphing blobs + particle net + panning ── */
function LoginBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const onR = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onR)

    // blobs — positioned to stay behind the left panel
    const blobs = [
      { x: W*0.18, y: H*0.25, r: 480, vx: 0.18, vy: 0.11, h: 160, s: 100, l: 52, ph: 0 },
      { x: W*0.32, y: H*0.72, r: 380, vx: 0.14, vy: -0.14, h: 145, s: 95, l: 46, ph: 2.1 },
      { x: W*0.05, y: H*0.55, r: 300, vx: -0.12, vy: 0.16, h: 195, s: 88, l: 50, ph: 1.2 },
    ]
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random()*(W*0.55), y: Math.random()*H,
      vx: (Math.random()-.5)*0.25, vy: (Math.random()-.5)*0.25,
      r: Math.random()*1.3+0.4, a: Math.random()*0.3+0.07, ph: Math.random()*Math.PI*2
    }))

    let t = 0, fr: number
    const draw = () => {
      ctx.clearRect(0, 0, W, H); t += 0.006

      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r*.5 || b.x > W*0.65) b.vx *= -1
        if (b.y < -b.r*.4 || b.y > H+b.r*.4) b.vy *= -1
        const p = Math.sin(t + b.ph) * 0.14 + 0.86
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r*p)
        g.addColorStop(0, `hsla(${b.h},${b.s}%,${b.l}%,0.12)`)
        g.addColorStop(0.45, `hsla(${b.h},${b.s}%,${b.l}%,0.048)`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })

      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.ph += 0.022
        if (p.x < 0) p.x = W*0.55; if (p.x > W*0.55) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        const a = p.a * (Math.sin(p.ph) * 0.3 + 0.7)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(74,222,128,${a})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
        const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y, d = Math.sqrt(dx*dx+dy*dy)
        if (d < 110) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(74,222,128,${0.06*(1-d/110)})`; ctx.lineWidth=0.5; ctx.stroke() }
      }

      // Hex grid — left side only
      const HX = 38, HW = HX * Math.sqrt(3)
      const cols = Math.ceil(W*0.55/HW)+2, rows = Math.ceil(H/HX)+2
      for (let row = -1; row < rows; row++) for (let col = -1; col < cols; col++) {
        const x = col*HW+(row%2)*HW/2, y = row*HX*1.5
        ctx.beginPath()
        for (let k = 0; k < 6; k++) { const a = Math.PI/3*k-Math.PI/6; k===0?ctx.moveTo(x+HX*.42*Math.cos(a),y+HX*.42*Math.sin(a)):ctx.lineTo(x+HX*.42*Math.cos(a),y+HX*.42*Math.sin(a)) }
        ctx.closePath(); ctx.strokeStyle='rgba(74,222,128,0.03)'; ctx.lineWidth=0.5; ctx.stroke()
      }

      // Vignette left side
      const v = ctx.createLinearGradient(W*0.4, 0, W*0.62, 0)
      v.addColorStop(0,'transparent'); v.addColorStop(1,'rgba(3,4,10,0.95)')
      ctx.fillStyle=v; ctx.fillRect(0,0,W,H)
      // top/bottom vignette
      const v2 = ctx.createLinearGradient(0,0,0,H)
      v2.addColorStop(0,'rgba(3,4,10,0.4)'); v2.addColorStop(0.15,'transparent'); v2.addColorStop(0.85,'transparent'); v2.addColorStop(1,'rgba(3,4,10,0.4)')
      ctx.fillStyle=v2; ctx.fillRect(0,0,W,H)

      fr = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(fr); window.removeEventListener('resize', onR) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}/>
}

/* ── FLOATING CODE SNIPPETS ── */
const SNIPPETS = [
  'SELECT * FROM users WHERE id=?',
  'os.environ.get("SECRET_KEY")',
  'cursor.execute(query, params)',
  'OWASP A01: Broken Access Control',
  'CVSS Score: 9.8 CRITICAL',
  '# FIXED: parameterized query',
  'Path.resolve().startswith(safe)',
  'hash = bcrypt.hashpw(pwd,salt)',
]
function FloatingSnippets() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {SNIPPETS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${4+(i*11)%48}%`, top: `${6+(i*14)%85}%`,
          fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
          color: 'rgba(74,222,128,0.065)', whiteSpace: 'nowrap',
          transform: `rotate(${-12+i*4}deg)`,
          animation: `flt${i%3} ${9+i%4}s ease infinite`,
          animationDelay: `${i*0.7}s`
        }}>{s}</div>
      ))}
    </div>
  )
}

/* ── PING RINGS ── */
function PingRings() {
  return (
    <div style={{ position: 'relative', width: 60, height: 60 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.35)', animation: `ping 3s ease-out ${i}s infinite` }}/>
      ))}
      <div style={{ position: 'absolute', inset: '20px', borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}/>
    </div>
  )
}

/* ── MAIN ── */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type:'error'|'success';text:string}|null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleAuth = async () => {
    if (!email || !password) { setMessage({ type:'error', text:'Please fill in all fields' }); return }
    setLoading(true); setMessage(null)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setMessage({ type:'error', text:error.message })
        else setMessage({ type:'success', text:'Account created! Sign in below.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage({ type:'error', text:error.message })
        else router.push('/scan')
      }
    } catch { setMessage({ type:'error', text:'Something went wrong' }) }
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!email) { setMessage({ type:'error', text:'Enter your email above first' }); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/scan` })
    setMessage(error ? { type:'error', text:error.message } : { type:'success', text:'Reset email sent!' })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains Mono:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#03040a;color:white;font-family:'Syne',sans-serif;overflow:hidden;height:100%}

        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes ping{0%{transform:scale(0.7);opacity:0.7}100%{transform:scale(2.4);opacity:0}}
        @keyframes flt0{0%,100%{transform:translateY(0) rotate(-9deg)}50%{transform:translateY(-14px) rotate(-9deg)}}
        @keyframes flt1{0%,100%{transform:translateY(0) rotate(6deg)}50%{transform:translateY(-18px) rotate(6deg)}}
        @keyframes flt2{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-11px) rotate(-4deg)}}
        @keyframes cardSlide{from{opacity:0;transform:translateX(48px) scale(0.97)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes leftSlide{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes glowBorder{0%,100%{border-color:rgba(74,222,128,0.12)}50%{border-color:rgba(74,222,128,0.4)}}
        @keyframes scanCard{0%{top:-1px;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:calc(100% + 1px);opacity:0}}

        .page{position:fixed;inset:0;display:flex;align-items:stretch;overflow:hidden}

        /* LEFT PANEL */
        .left{position:relative;z-index:10;flex:1.1;display:flex;flex-direction:column;justify-content:center;padding:64px 60px;opacity:0;animation:${mounted?'leftSlide 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s forwards':'none'}}
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:56px}
        .brand-icon{width:46px;height:46px;border-radius:14px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 40px rgba(74,222,128,0.12)}
        .brand-name{font-size:22px;font-weight:800;letter-spacing:-0.025em}
        .brand-badge{font-size:10px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.22);color:#4ade80;padding:3px 9px;border-radius:20px;font-family:'JetBrains Mono',monospace;font-weight:600}
        .hero-tag{font-size:11px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#4ade80;font-family:'JetBrains Mono',monospace;margin-bottom:16px}
        .hero-title{font-size:clamp(36px,3.5vw,52px);font-weight:800;letter-spacing:-0.04em;line-height:1.1;margin-bottom:18px}
        .grad{background:linear-gradient(130deg,#4ade80 0%,#22d3ee 45%,#818cf8 90%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 7s linear infinite}
        .hero-desc{font-size:14px;color:rgba(255,255,255,0.3);line-height:1.9;font-family:'JetBrains Mono',monospace;max-width:360px;margin-bottom:40px}
        .stats-row{display:flex;gap:14px;flex-wrap:wrap}
        .stat{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px 18px;text-align:center;min-width:80px}
        .stat-n{font-size:18px;font-weight:800;color:#4ade80;letter-spacing:-0.03em}
        .stat-l{font-size:10px;color:rgba(255,255,255,0.22);font-family:'JetBrains Mono',monospace;margin-top:2px}
        .ping-wrap{margin-top:44px;display:flex;align-items:center;gap:14px}
        .ping-label{font-size:12px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.22)}

        /* RIGHT PANEL / CARD */
        .right{position:relative;z-index:10;display:flex;align-items:center;justify-content:center;padding:32px;flex:0.9;background:rgba(3,4,10,0.6);backdrop-filter:blur(0px)}
        .card{position:relative;width:100%;max-width:440px;background:rgba(8,10,18,0.88);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:42px;backdrop-filter:blur(44px);box-shadow:0 48px 130px rgba(0,0,0,0.85),0 0 80px rgba(74,222,128,0.03);overflow:hidden;opacity:0;animation:${mounted?'cardSlide 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards':'none'};animation:${mounted?'cardSlide 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards, glowBorder 5s ease 1s infinite':'none'}}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(74,222,128,0.5),transparent)}
        .card-scan{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(74,222,128,0.22),transparent);animation:scanCard 5s ease infinite}

        .card-logo{display:flex;align-items:center;gap:9px;margin-bottom:30px}
        .cl-icon{width:34px;height:34px;border-radius:10px;background:rgba(74,222,128,0.09);border:1px solid rgba(74,222,128,0.2);display:flex;align-items:center;justify-content:center;font-size:15px}
        .cl-name{font-size:15px;font-weight:800;letter-spacing:-0.02em}
        .card-title{font-size:26px;font-weight:800;letter-spacing:-0.03em;margin-bottom:6px}
        .card-sub{font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:26px;font-family:'JetBrains Mono',monospace}

        .sec-badges{display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap}
        .sb{font-size:10px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.12);color:rgba(74,222,128,0.6);padding:4px 10px;border-radius:20px;font-family:'JetBrains Mono',monospace}

        .field{margin-bottom:14px}
        .field-label{display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:7px}
        .iw{position:relative}
        .fi{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:13px 16px;color:white;font-size:15px;font-family:'Syne',sans-serif;font-weight:500;outline:none;transition:all 0.25s}
        .fi::placeholder{color:rgba(255,255,255,0.2)}
        .fi:focus{border-color:rgba(74,222,128,0.4);background:rgba(74,222,128,0.025);box-shadow:0 0 0 4px rgba(74,222,128,0.07)}
        .pw-btn{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.28);font-size:17px;padding:4px;transition:color 0.2s}
        .pw-btn:hover{color:rgba(255,255,255,0.65)}

        .forgot{display:block;text-align:right;background:none;border:none;color:#4ade80;font-size:12px;font-weight:600;cursor:pointer;font-family:'Syne',sans-serif;margin-top:-6px;margin-bottom:22px;transition:opacity 0.2s}
        .forgot:hover{opacity:0.65}

        .submit{width:100%;background:linear-gradient(135deg,#4ade80,#22d3ee);color:#03040a;border:none;padding:15px;border-radius:15px;font-weight:900;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Syne',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 6px 28px rgba(74,222,128,0.28);margin-bottom:16px;letter-spacing:-0.01em}
        .submit:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(74,222,128,0.45)}
        .submit:disabled{opacity:0.55;cursor:not-allowed;transform:none}
        .spinner{width:17px;height:17px;border:2.5px solid rgba(0,0,0,0.25);border-top-color:#03040a;border-radius:50%;animation:spin 0.7s linear infinite}

        .divider{display:flex;align-items:center;gap:12px;margin-bottom:14px}
        .div-line{flex:1;height:1px;background:rgba(255,255,255,0.06)}
        .div-text{font-size:11px;color:rgba(255,255,255,0.18);font-family:'JetBrains Mono',monospace}

        .skip{width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.35);padding:12px;border-radius:13px;font-weight:600;font-size:13px;cursor:pointer;transition:all 0.2s;font-family:'Syne',sans-serif;margin-bottom:20px}
        .skip:hover{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.65)}

        .toggle{text-align:center;font-size:13px;color:rgba(255,255,255,0.28)}
        .toggle-btn{background:none;border:none;color:#4ade80;cursor:pointer;font-weight:700;font-size:13px;font-family:'Syne',sans-serif;margin-left:4px;transition:opacity 0.2s}
        .toggle-btn:hover{opacity:0.65}

        .msg{border-radius:12px;padding:12px 14px;font-size:12px;margin-bottom:14px;display:flex;gap:9px;align-items:flex-start;font-family:'JetBrains Mono',monospace;line-height:1.6}
        .msg-e{background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);color:#fca5a5}
        .msg-s{background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.2);color:#4ade80}

        .back{position:fixed;top:22px;left:22px;z-index:50;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);padding:8px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-family:'Syne',sans-serif;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:6px}
        .back:hover{background:rgba(255,255,255,0.09);color:white}

        @media(max-width:860px){
          .left{display:none}
          .right{flex:1;background:rgba(3,4,10,0.5)}
          html,body{overflow:auto}
        }
      `}</style>

      <LoginBG/>
      <FloatingSnippets/>

      <button className="back" onClick={() => router.push('/')}>← Back</button>

      <div className="page">
        {/* LEFT BRANDING PANEL */}
        <div className="left">
          <div className="brand">
            <div className="brand-icon">🛡</div>
            <span className="brand-name">Cyber<span style={{color:'#4ade80'}}>Sentry</span></span>
            <span className="brand-badge">AI</span>
          </div>
          <div className="hero-tag">Agentic Security Platform</div>
          <h1 className="hero-title">
            Secure your code<br/>with <span className="grad">AI-powered</span><br/>intelligence
          </h1>
          <p className="hero-desc">
            Autonomous agent that scans, reasons, patches<br/>
            and verifies your code in seconds.
          </p>
          <div className="stats-row">
            {[{n:'OWASP',l:'Top 10'},{n:'96/100',l:'Max Score'},{n:'<5s',l:'Scan Time'},{n:'9',l:'Languages'}].map((s,i)=>(
              <div className="stat" key={i}>
                <div className="stat-n">{s.n}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="ping-wrap">
            <PingRings/>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#4ade80',marginBottom:3}}>Agent Online</div>
              <div className="ping-label">Ready to scan your codebase</div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="right">
          <div className="card">
            <div className="card-scan"/>

            <div className="card-logo">
              <div className="cl-icon">🛡</div>
              <span className="cl-name">Cyber<span style={{color:'#4ade80'}}>Sentry</span></span>
              <span style={{fontSize:10,background:'rgba(74,222,128,0.07)',border:'1px solid rgba(74,222,128,0.18)',color:'#4ade80',padding:'2px 7px',borderRadius:20,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,marginLeft:4}}>AI</span>
            </div>

            <div className="card-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</div>
            <div className="card-sub">{isSignUp ? 'Start securing your codebase today' : 'Continue securing your codebase'}</div>

            <div className="sec-badges">
              <span className="sb">🔐 SSL Encrypted</span>
              <span className="sb">🛡 OWASP Compliant</span>
              <span className="sb">⚡ Instant Access</span>
            </div>

            {message && (
              <div className={`msg ${message.type==='error'?'msg-e':'msg-s'}`}>
                <span>{message.type==='error'?'⚠️':'✅'}</span>
                <span>{message.text}</span>
              </div>
            )}

            <div className="field">
              <label className="field-label">Email</label>
              <div className="iw">
                <input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleAuth()} placeholder="you@example.com"/>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="iw">
                <input className="fi" type={showPw?'text':'password'} value={password}
                  onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()}
                  placeholder="••••••••" style={{paddingRight:46}}/>
                <button className="pw-btn" onClick={()=>setShowPw(p=>!p)}>{showPw?'🙈':'👁'}</button>
              </div>
            </div>

            {!isSignUp && <button className="forgot" onClick={handleForgot}>Forgot password?</button>}

            <button className="submit" onClick={handleAuth} disabled={loading}>
              {loading ? <><span className="spinner"/>Processing...</> : <>{isSignUp ? 'Create Account →' : 'Sign In →'}</>}
            </button>

            <div className="divider">
              <div className="div-line"/><span className="div-text">or</span><div className="div-line"/>
            </div>

            <button className="skip" onClick={() => router.push('/scan')}>
              👁 Skip — View Demo (No account needed)
            </button>

            <div className="toggle">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button className="toggle-btn" onClick={() => { setIsSignUp(p=>!p); setMessage(null) }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}