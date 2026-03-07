'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    type P = { x: number; y: number; vx: number; vy: number; r: number; pulse: number }
    const pts: P[] = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.5 + .3, pulse: Math.random() * Math.PI * 2 }))
    const orbs = [{ x: W * .15, y: H * .3, r: 220, vx: .15, vy: .09, hue: 145, phase: 0 }, { x: W * .85, y: H * .7, r: 260, vx: -.12, vy: .1, hue: 190, phase: 1 }]
    type SL = { y: number; speed: number; w: number; op: number }
    const scanLines: SL[] = Array.from({ length: 3 }, () => ({ y: Math.random() * H, speed: .35 + Math.random() * .4, w: 50 + Math.random() * 60, op: .025 + Math.random() * .035 }))
    let t = 0, frame: number
    const draw = () => {
      ctx.clearRect(0, 0, W, H); t += .01
      ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H)
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy
        if (o.x < -o.r || o.x > W + o.r) o.vx *= -1; if (o.y < -o.r || o.y > H + o.r) o.vy *= -1
        const p = Math.sin(t + o.phase) * .2 + .8
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * p)
        g.addColorStop(0, `hsla(${o.hue},100%,60%,.07)`); g.addColorStop(.5, `hsla(${o.hue},100%,50%,.025)`); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })
      const HEX = 48, HW = HEX * Math.sqrt(3), cols = Math.ceil(W / HW) + 2, rows = Math.ceil(H / HEX) + 2
      for (let row = -1; row < rows; row++) for (let col = -1; col < cols; col++) {
        const x = col * HW + (row % 2) * HW / 2, y = row * HEX * 1.5
        ctx.beginPath()
        for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k - Math.PI / 6; k === 0 ? ctx.moveTo(x + HEX * .46 * Math.cos(a), y + HEX * .46 * Math.sin(a)) : ctx.lineTo(x + HEX * .46 * Math.cos(a), y + HEX * .46 * Math.sin(a)) }
        ctx.closePath(); ctx.strokeStyle = 'rgba(0,255,136,.02)'; ctx.lineWidth = .5; ctx.stroke()
      }
      scanLines.forEach(sl => {
        sl.y += sl.speed; if (sl.y > H + sl.w) sl.y = -sl.w
        const sg = ctx.createLinearGradient(0, sl.y - sl.w, 0, sl.y + sl.w)
        sg.addColorStop(0, 'transparent'); sg.addColorStop(.5, `rgba(0,255,136,${sl.op})`); sg.addColorStop(1, 'transparent')
        ctx.fillStyle = sg; ctx.fillRect(0, sl.y - sl.w, W, sl.w * 2)
      })
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += .022
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${(Math.sin(p.pulse) * .25 + .65) * .28})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 95) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(0,255,136,${.055 * (1 - d / 95)})`; ctx.lineWidth = .4; ctx.stroke() }
      }
      const scanX = ((t * 55) % (W + 80)) - 40
      const vg = ctx.createLinearGradient(scanX - 20, 0, scanX + 20, 0)
      vg.addColorStop(0, 'transparent'); vg.addColorStop(.5, 'rgba(0,255,136,.03)'); vg.addColorStop(1, 'transparent')
      ctx.fillStyle = vg; ctx.fillRect(scanX - 20, 0, 40, H)
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * .06, W / 2, H / 2, H * .8)
      vig.addColorStop(0, 'transparent'); vig.addColorStop(1, 'rgba(3,4,8,.7)')
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ t: 'e' | 's'; txt: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleAuth = async () => {
    if (!email || !password) { setMsg({ t: 'e', txt: 'Please fill in all fields' }); return }
    setLoading(true); setMsg(null)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        error ? setMsg({ t: 'e', txt: error.message }) : setMsg({ t: 's', txt: 'Account created! Check your email.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        error ? setMsg({ t: 'e', txt: error.message }) : router.push('/scan')
      }
    } catch { setMsg({ t: 'e', txt: 'Something went wrong' }) }
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!email) { setMsg({ t: 'e', txt: 'Enter your email first' }); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/scan` })
    setMsg(error ? { t: 'e', txt: error.message } : { t: 's', txt: 'Reset email sent!' })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#030408;color:white;font-family:'Outfit',sans-serif;overflow:hidden;height:100%;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes scanLine{0%{top:-2px}100%{top:102%}}
        @keyframes cardPop{0%{opacity:0;transform:translateY(24px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes radarSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 14px rgba(0,255,136,.14)}50%{box-shadow:0 0 36px rgba(0,255,136,.45)}}
        input::placeholder{color:rgba(255,255,255,.2);}
      `}</style>

      <LoginBG />

      <button onClick={() => router.push('/')} style={{ position: 'fixed', top: 18, left: 22, zIndex: 50, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.4)', padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>← Home</button>

      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '16px' }}>
        <div style={{
          position: 'relative', width: '100%', maxWidth: 400,
          background: 'rgba(5,7,14,.92)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 22, padding: '28px 28px 24px',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 100px rgba(0,0,0,.88), 0 0 50px rgba(0,255,136,.04)',
          animation: mounted ? 'cardPop .55s cubic-bezier(.34,1.4,.64,1) both' : 'none',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,255,136,.55),transparent)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,255,136,.25),transparent)', animation: 'scanLine 4.5s ease infinite', top: 0 }} />
          <div style={{ position: 'absolute', bottom: -28, right: -28, width: 100, height: 100, opacity: .055, pointerEvents: 'none' }}>
            {[0, 15, 30].map((ins, i) => <div key={i} style={{ position: 'absolute', inset: ins, borderRadius: '50%', border: '1px solid #00ff88' }} />)}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg,rgba(0,255,136,.5),transparent 55deg)', animation: 'radarSpin 4s linear infinite' }} />
          </div>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,255,136,.1)', border: '1px solid rgba(0,255,136,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, animation: 'glow 4s ease infinite' }}>🛡</div>
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em' }}>Cyber<span style={{ color: '#00ff88' }}>Sentry</span></span>
            <span style={{ fontSize: 9, background: 'rgba(0,255,136,.08)', border: '1px solid rgba(0,255,136,.2)', color: '#00ff88', padding: '2px 7px', borderRadius: 20, fontWeight: 700, marginLeft: 2, fontFamily: "'JetBrains Mono',monospace" }}>AI</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', animation: 'blink 2s ease infinite' }} />
              <span style={{ fontSize: 9, color: '#00ff88', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>SECURE</span>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-.025em', marginBottom: 3 }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontFamily: "'JetBrains Mono',monospace" }}>{isSignUp ? 'Start scanning your codebase today' : 'Continue securing your codebase'}</div>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap' }}>
            {['🔐 SSL', '🛡 OWASP', '⚡ Instant'].map((badge, i) => (
              <span key={i} style={{ fontSize: 10, background: 'rgba(0,255,136,.04)', border: '1px solid rgba(0,255,136,.1)', color: 'rgba(0,255,136,.6)', padding: '3px 9px', borderRadius: 20, fontFamily: "'JetBrains Mono',monospace" }}>{badge}</span>
            ))}
          </div>

          {/* Message */}
          {msg && (
            <div style={{ borderRadius: 9, padding: '9px 12px', fontSize: 11, marginBottom: 12, display: 'flex', gap: 7, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5, animation: 'fadeIn .3s ease', background: msg.t === 'e' ? 'rgba(255,68,102,.08)' : 'rgba(0,255,136,.07)', border: `1px solid ${msg.t === 'e' ? 'rgba(255,68,102,.22)' : 'rgba(0,255,136,.22)'}`, color: msg.t === 'e' ? '#ff8899' : '#00ff88' }}>
              <span>{msg.t === 'e' ? '⚠️' : '✅'}</span><span>{msg.txt}</span>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="you@example.com"
              style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '11px 14px', color: 'white', fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: 'none', transition: 'all .25s' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,255,136,.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,255,136,.07)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.08)'; e.target.style.boxShadow = 'none' }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: !isSignUp ? 6 : 14 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="••••••••"
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '11px 44px 11px 14px', color: 'white', fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: 'none', transition: 'all .25s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,255,136,.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,255,136,.07)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.08)'; e.target.style.boxShadow = 'none' }} />
              <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)', fontSize: 16, padding: 3 }}>{showPw ? '🙈' : '👁'}</button>
            </div>
          </div>

          {!isSignUp && (
            <button onClick={handleForgot} style={{ display: 'block', textAlign: 'right', width: '100%', color: '#00ff88', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginBottom: 14, background: 'none', border: 'none', fontFamily: "'Outfit',sans-serif" }}>Forgot password?</button>
          )}

          {/* Submit */}
          <button onClick={handleAuth} disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg,#00ff88,#00cc6a)', color: '#000', border: 'none', padding: '13px', borderRadius: 13, fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 5px 24px rgba(0,255,136,.28)', marginBottom: 12, opacity: loading ? .65 : 1, transition: 'all .25s' }}>
            {loading ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(0,0,0,.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Processing...</> : isSignUp ? 'Create Account →' : 'Sign In →'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.18)', fontFamily: "'JetBrains Mono',monospace" }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
          </div>

          <button onClick={() => router.push('/scan')} style={{ width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', color: 'rgba(255,255,255,.38)', padding: '11px', borderRadius: 11, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", marginBottom: 14, transition: 'all .2s' }}>
            👁 Skip — View Demo (No account needed)
          </button>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.28)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsSignUp(p => !p); setMsg(null) }} style={{ color: '#00ff88', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', fontSize: 12, fontFamily: "'Outfit',sans-serif", marginLeft: 5 }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}