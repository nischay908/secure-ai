'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ── LIVE THREAT FEED (scrolling on left) ── */
const THREATS = [
  { time: '00:00:01', type: 'CRITICAL', ip: '185.234.XX.XX', attack: 'SQL Injection attempt', target: '/api/login', blocked: true },
  { time: '00:00:03', type: 'HIGH',     ip: '91.108.XX.XX',  attack: 'Path Traversal ../../etc/passwd', target: '/file?name=', blocked: true },
  { time: '00:00:07', type: 'CRITICAL', ip: '45.142.XX.XX',  attack: 'Command Injection via os.popen', target: '/run?cmd=', blocked: true },
  { time: '00:00:11', type: 'MEDIUM',   ip: '104.21.XX.XX',  attack: 'XSS payload in input field', target: '/search?q=', blocked: true },
  { time: '00:00:15', type: 'HIGH',     ip: '198.51.XX.XX',  attack: 'Hardcoded JWT secret found', target: '/auth/token', blocked: false },
  { time: '00:00:19', type: 'CRITICAL', ip: '203.0.XX.XX',   attack: 'Broken Auth bypass attempt', target: '/admin/panel', blocked: true },
  { time: '00:00:24', type: 'HIGH',     ip: '172.16.XX.XX',  attack: 'Insecure deserialization', target: '/api/object', blocked: true },
  { time: '00:00:28', type: 'MEDIUM',   ip: '10.0.XX.XX',    attack: 'CSRF token missing', target: '/user/update', blocked: false },
  { time: '00:00:33', type: 'CRITICAL', ip: '66.220.XX.XX',  attack: 'Buffer overflow detected', target: '/upload/file', blocked: true },
  { time: '00:00:38', type: 'HIGH',     ip: '31.13.XX.XX',   attack: 'Sensitive data in response', target: '/api/profile', blocked: false },
]

/* ── ANIMATED CANVAS BACKGROUND ── */
function LoginBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    type P = { x:number; y:number; vx:number; vy:number; r:number; opacity:number; pulse:number }
    const particles: P[] = Array.from({length:80}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*0.45, vy: (Math.random()-.5)*0.45,
      r: Math.random()*1.8+0.4, opacity: Math.random()*0.5+0.1,
      pulse: Math.random()*Math.PI*2,
    }))

    type Orb = { x:number; y:number; r:number; vx:number; vy:number; hue:number; phase:number }
    const orbs: Orb[] = [
      {x:W*0.12, y:H*0.25, r:200, vx:0.18, vy:0.1, hue:145, phase:0},
      {x:W*0.88, y:H*0.72, r:260, vx:-0.14, vy:0.12, hue:190, phase:1},
      {x:W*0.5,  y:H*0.9,  r:180, vx:0.1, vy:-0.14, hue:160, phase:2},
    ]

    // Scan lines (horizontal sweeps)
    type ScanLine = { y:number; speed:number; width:number; opacity:number }
    const scanLines: ScanLine[] = Array.from({length:3}, () => ({
      y: Math.random()*H, speed: 0.3+Math.random()*0.5,
      width: 40+Math.random()*60, opacity: 0.03+Math.random()*0.04,
    }))

    let t = 0, frame: number
    function draw() {
      ctx.clearRect(0,0,W,H); t += 0.01

      // BG
      ctx.fillStyle = '#030408'; ctx.fillRect(0,0,W,H)

      // Orbs
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy
        if(o.x<-o.r||o.x>W+o.r) o.vx*=-1
        if(o.y<-o.r||o.y>H+o.r) o.vy*=-1
        const p = Math.sin(t+o.phase)*0.2+0.8
        const g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*p)
        g.addColorStop(0, `hsla(${o.hue},100%,60%,0.07)`)
        g.addColorStop(0.5, `hsla(${o.hue},100%,50%,0.03)`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H)
      })

      // Hex grid (faint)
      const HEX = 48, HW = HEX*Math.sqrt(3)
      const cols = Math.ceil(W/HW)+2, rows = Math.ceil(H/HEX)+2
      for(let row=-1;row<rows;row++) for(let col=-1;col<cols;col++) {
        const x=col*HW+(row%2)*HW/2, y=row*HEX*1.5
        ctx.beginPath()
        for(let k=0;k<6;k++){const a=Math.PI/3*k-Math.PI/6; k===0?ctx.moveTo(x+HEX*0.46*Math.cos(a),y+HEX*0.46*Math.sin(a)):ctx.lineTo(x+HEX*0.46*Math.cos(a),y+HEX*0.46*Math.sin(a))}
        ctx.closePath(); ctx.strokeStyle='rgba(0,255,136,0.022)'; ctx.lineWidth=0.5; ctx.stroke()
      }

      // Moving scan lines
      scanLines.forEach(sl => {
        sl.y += sl.speed
        if(sl.y > H+sl.width) sl.y = -sl.width
        const sg = ctx.createLinearGradient(0,sl.y-sl.width,0,sl.y+sl.width)
        sg.addColorStop(0,'transparent')
        sg.addColorStop(0.5,`rgba(0,255,136,${sl.opacity})`)
        sg.addColorStop(1,'transparent')
        ctx.fillStyle=sg; ctx.fillRect(0,sl.y-sl.width,W,sl.width*2)
      })

      // Particles
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.pulse+=0.025
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0
        const alpha = p.opacity*(Math.sin(p.pulse)*0.3+0.7)
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(0,255,136,${alpha})`; ctx.fill()
      })

      // Connection lines between nearby particles
      for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++) {
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y
        const d=Math.sqrt(dx*dx+dy*dy)
        if(d<100) {
          ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y)
          ctx.strokeStyle=`rgba(0,255,136,${0.07*(1-d/100)})`; ctx.lineWidth=0.5; ctx.stroke()
        }
      }

      // Vertical scan line (sweeping left to right)
      const scanX = ((t*60)%(W+80))-40
      const vg = ctx.createLinearGradient(scanX-20,0,scanX+20,0)
      vg.addColorStop(0,'transparent'); vg.addColorStop(0.5,'rgba(0,255,136,0.035)'); vg.addColorStop(1,'transparent')
      ctx.fillStyle=vg; ctx.fillRect(scanX-20,0,40,H)

      // Vignette
      const vig = ctx.createRadialGradient(W/2,H/2,H*0.08,W/2,H/2,H*0.82)
      vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(3,4,8,0.65)')
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H)

      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize',onResize) }
  }, [])
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>
}

/* ── LIVE THREAT FEED PANEL ── */
function ThreatFeed() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    const add = () => {
      setVisible(prev => {
        const next = [...prev, idx % THREATS.length]
        return next.slice(-6) // Keep last 6
      })
      setIdx(i => i + 1)
    }
    add()
    const id = setInterval(add, 1800)
    return () => clearInterval(id)
  }, [])

  const typeColor = (t: string) => t === 'CRITICAL' ? '#ff4466' : t === 'HIGH' ? '#ff9500' : '#ffc800'

  return (
    <div style={{position:'fixed',left:0,top:0,bottom:0,width:'360px',zIndex:5,background:'rgba(3,4,8,0.7)',backdropFilter:'blur(20px)',borderRight:'1px solid rgba(0,255,136,0.08)',display:'flex',flexDirection:'column',padding:'24px 0',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'0 20px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#ff4466',boxShadow:'0 0 8px #ff4466',animation:'blink 1s ease infinite'}}/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.15em'}}>LIVE THREAT FEED</span>
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'rgba(255,255,255,0.2)'}}>Real-time attack detection · All blocked by CyberSentry</div>
      </div>

      {/* Threats */}
      <div style={{flex:1,padding:'16px 0',display:'flex',flexDirection:'column',gap:2,overflow:'hidden'}}>
        {visible.map((threatIdx, i) => {
          const t = THREATS[threatIdx]
          return (
            <div key={`${i}-${threatIdx}`} style={{padding:'10px 20px',borderLeft:`2px solid ${t.blocked?typeColor(t.type):'rgba(255,255,255,0.15)'}`,marginLeft:0,animation:'slideIn 0.4s ease',background:i === visible.length-1 ? `rgba(${t.type==='CRITICAL'?'255,68,102':t.type==='HIGH'?'255,149,0':'255,200,0'},0.04)` : 'transparent',transition:'all 0.3s'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:typeColor(t.type),fontWeight:800,letterSpacing:'0.1em'}}>{t.type}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.2)'}}>{t.time}</span>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'rgba(255,255,255,0.55)',marginBottom:3,lineHeight:1.4}}>{t.attack}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.2)'}}>{t.ip}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:t.blocked?'#00ff88':'#ff4466',background:t.blocked?'rgba(0,255,136,0.08)':'rgba(255,68,102,0.08)',padding:'2px 7px',borderRadius:20,border:`1px solid ${t.blocked?'rgba(0,255,136,0.2)':'rgba(255,68,102,0.2)'}`}}>
                  {t.blocked?'BLOCKED':'DETECTED'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats at bottom */}
      <div style={{padding:'16px 20px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {[{n:'2,341',l:'Attacks Blocked',c:'#00ff88'},{n:'99.8%',l:'Detection Rate',c:'#4488ff'},{n:'<4.2s',l:'Avg Scan Time',c:'#ff9500'},{n:'OWASP',l:'Top 10 Covered',c:'#aa88ff'}].map((s,i)=>(
          <div key={i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10,padding:'10px 12px'}}>
            <div style={{fontSize:15,fontWeight:900,color:s.c,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'-0.02em'}}>{s.n}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── FLOATING CODE SNIPPETS ── */
function FloatingCode() {
  const snippets = [
    'cursor.execute(query, params)',
    'os.environ.get("SECRET_KEY")',
    'Path.resolve().startswith(safe)',
    'OWASP A01: Injection — CVSS 9.8',
    '# FIXED: parameterized query',
    'bcrypt.hashpw(pwd, salt)',
    'SELECT * FROM users WHERE id=?',
    'Content-Security-Policy: default-src',
  ]
  return (
    <div style={{position:'fixed',inset:0,zIndex:1,pointerEvents:'none',overflow:'hidden'}}>
      {snippets.map((s,i)=>(
        <div key={i} style={{
          position:'absolute',
          left:`${15+(i*11)%70}%`,
          top:`${5+(i*19)%88}%`,
          fontSize:'10px',
          fontFamily:"'JetBrains Mono',monospace",
          color:'rgba(0,255,136,0.06)',
          whiteSpace:'nowrap',
          animation:`float${i%3} ${9+i%5}s ease infinite`,
          animationDelay:`${i*0.8}s`,
          transform:`rotate(${-10+i*4}deg)`,
        }}>{s}</div>
      ))}
    </div>
  )
}

/* ── MAIN ── */
export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState<{type:'error'|'success'; text:string}|null>(null)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  const handleAuth = async () => {
    if(!email || !password) { setMessage({type:'error', text:'Please fill in all fields'}); return }
    setLoading(true); setMessage(null)
    try {
      if(isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if(error) setMessage({type:'error', text:error.message})
        else setMessage({type:'success', text:'Account created! Check your email or sign in directly.'})
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if(error) setMessage({type:'error', text:error.message})
        else router.push('/scan')
      }
    } catch { setMessage({type:'error', text:'Something went wrong'}) }
    setLoading(false)
  }

  const handleForgot = async () => {
    if(!email) { setMessage({type:'error', text:'Enter your email above first'}); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {redirectTo:`${window.location.origin}/scan`})
    setMessage(error ? {type:'error', text:error.message} : {type:'success', text:'Password reset email sent!'})
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#030408;color:white;font-family:'Outfit',sans-serif;overflow:hidden;}

        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes float0{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-14px) rotate(-8deg)}}
        @keyframes float1{0%,100%{transform:translateY(0) rotate(5deg)}50%{transform:translateY(-18px) rotate(5deg)}}
        @keyframes float2{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-10px) rotate(-3deg)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes scanLine{0%{top:-2px}100%{top:100%}}
        @keyframes glowBorder{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0)}50%{box-shadow:0 0 30px rgba(0,255,136,0.15),0 0 0 1px rgba(0,255,136,0.3)}}
        @keyframes cardPop{0%{opacity:0;transform:translateY(30px) scale(0.97)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmerText{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes radarSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .page{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;}

        /* Back button */
        .back-btn{position:fixed;top:22px;right:24px;z-index:20;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.4);padding:9px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:6px;}
        .back-btn:hover{background:rgba(255,255,255,0.09);color:white;}

        /* CARD */
        .card{position:relative;z-index:10;width:100%;max-width:440px;background:rgba(6,8,16,0.9);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:38px;backdrop-filter:blur(40px);box-shadow:0 40px 120px rgba(0,0,0,0.85),0 0 60px rgba(0,255,136,0.04);animation:${mounted?'cardPop 0.6s cubic-bezier(0.34,1.4,0.64,1) both':'none'};overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.5),transparent);}
        .card-scan{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.3),transparent);animation:scanLine 4s ease infinite;}

        /* Logo */
        .card-logo{display:flex;align-items:center;gap:10px;margin-bottom:26px;}
        .cico{width:38px;height:38px;border-radius:11px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.22);display:flex;align-items:center;justify-content:center;font-size:17px;}
        .cname{font-size:17px;font-weight:800;letter-spacing:-0.02em;}

        /* Title */
        .card-title{font-size:26px;font-weight:900;letter-spacing:-0.03em;margin-bottom:5px;}
        .card-sub{font-size:13px;color:rgba(255,255,255,0.32);margin-bottom:22px;font-family:'JetBrains Mono',monospace;}

        /* Security badges */
        .sec-badges{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
        .sec-badge{font-size:10px;background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.12);color:rgba(0,255,136,0.6);padding:3px 9px;border-radius:20px;font-family:'JetBrains Mono',monospace;}

        /* Fields */
        .field{margin-bottom:15px;}
        .field-label{font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:7px;display:block;}
        .input-wrap{position:relative;}
        .field-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:13px 17px;color:white;font-size:14px;font-family:'Outfit',sans-serif;outline:none;transition:all 0.25s;font-weight:500;}
        .field-input::placeholder{color:rgba(255,255,255,0.2);}
        .field-input:focus{border-color:rgba(0,255,136,0.45);background:rgba(0,255,136,0.025);box-shadow:0 0 0 4px rgba(0,255,136,0.07),0 0 20px rgba(0,255,136,0.05);}
        .pw-toggle{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-size:17px;padding:4px;transition:color 0.2s;}
        .pw-toggle:hover{color:rgba(255,255,255,0.7);}

        .forgot{display:block;text-align:right;color:#00ff88;font-size:12px;font-weight:600;cursor:pointer;margin-top:-4px;margin-bottom:20px;background:none;border:none;font-family:'Outfit',sans-serif;transition:opacity 0.2s;}
        .forgot:hover{opacity:0.7;}

        /* Submit */
        .submit-btn{width:100%;background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;border:none;padding:15px;border-radius:15px;font-weight:900;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;letter-spacing:-0.01em;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 6px 28px rgba(0,255,136,0.3);margin-bottom:14px;}
        .submit-btn:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(0,255,136,0.45);}
        .submit-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
        .spinner{width:17px;height:17px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;}

        /* Divider */
        .divider{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
        .divider-line{flex:1;height:1px;background:rgba(255,255,255,0.06);}
        .divider-text{font-size:11px;color:rgba(255,255,255,0.18);font-family:'JetBrains Mono',monospace;}

        /* Skip btn */
        .skip-btn{width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.35);padding:12px;border-radius:13px;font-weight:600;font-size:13px;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;margin-bottom:18px;}
        .skip-btn:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.65);}

        /* Toggle */
        .toggle-mode{text-align:center;font-size:13px;color:rgba(255,255,255,0.28);}
        .toggle-link{color:#00ff88;cursor:pointer;font-weight:700;background:none;border:none;font-size:13px;font-family:'Outfit',sans-serif;margin-left:4px;transition:opacity 0.2s;}
        .toggle-link:hover{opacity:0.7;}

        /* Message */
        .msg{border-radius:11px;padding:11px 15px;font-size:12px;margin-bottom:14px;display:flex;align-items:flex-start;gap:9px;font-family:'JetBrains Mono',monospace;line-height:1.55;animation:fadeIn 0.3s ease;}
        .msg-error{background:rgba(255,68,102,0.08);border:1px solid rgba(255,68,102,0.22);color:#ff8899;}
        .msg-success{background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.22);color:#00ff88;}

        /* Radar decoration on card */
        .radar-deco{position:absolute;bottom:-30px;right:-30px;width:120px;height:120px;opacity:0.06;pointer-events:none;}
        .radar-ring{position:absolute;inset:0;border-radius:50%;border:1px solid #00ff88;}
        .radar-ring2{inset:15px;animation:radarSpin 8s linear infinite;}
        .radar-sweep{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(0,255,136,0.4),transparent 60deg);}

        @media(max-width:900px){.page{padding-left:0;justify-content:center;}}
        @media(max-width:500px){.card{padding:28px 20px;}.card-title{font-size:22px;}}
      `}</style>

      <LoginBG />
      <FloatingCode />

      <button className="back-btn" onClick={() => router.push('/')}>← Back to Home</button>

      {/* Threat feed on left — hidden on mobile */}
      <div style={{ display: 'window.innerWidth > 900 ? "block" : "none"' }} className="threat-panel">
        <ThreatFeed />
      </div>

      {/* Center the card, shifted right to account for threat panel */}
      <div className="page" style={{ paddingLeft: 'min(360px, 30vw)', paddingRight: '4vw' }}>
        <div className="card">
          <div className="card-scan" style={{ top: 0 }} />

          {/* Radar deco */}
          <div className="radar-deco">
            <div className="radar-ring" />
            <div className="radar-ring" style={{ inset: 15 }} />
            <div className="radar-ring" style={{ inset: 30 }} />
            <div className="radar-sweep" style={{ animation: 'radarSpin 4s linear infinite' }} />
          </div>

          <div className="card-logo">
            <div className="cico">🛡</div>
            <span className="cname">Cyber<span style={{ color: '#00ff88' }}>Sentry</span></span>
            <span style={{ fontSize: 10, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', padding: '2px 8px', borderRadius: 20, fontWeight: 700, marginLeft: 4, fontFamily: "'JetBrains Mono',monospace" }}>AI</span>
          </div>

          <div className="card-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</div>
          <div className="card-sub">{isSignUp ? 'Start securing your codebase today' : 'Continue securing your codebase'}</div>

          <div className="sec-badges">
            <span className="sec-badge">🔐 SSL Encrypted</span>
            <span className="sec-badge">🛡 OWASP Compliant</span>
            <span className="sec-badge">⚡ Instant Access</span>
          </div>

          {message && (
            <div className={`msg ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>
              <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
              <span>{message.text}</span>
            </div>
          )}

          <div className="field">
            <label className="field-label">Email</label>
            <div className="input-wrap">
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="you@example.com" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="input-wrap">
              <input className="field-input" type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()}
                placeholder="••••••••" style={{ paddingRight: 46 }} />
              <button className="pw-toggle" onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁'}</button>
            </div>
          </div>

          {!isSignUp && <button className="forgot" onClick={handleForgot}>Forgot password?</button>}

          <button className="submit-btn" onClick={handleAuth} disabled={loading}>
            {loading ? <><span className="spinner" />Processing...</> : <>{isSignUp ? 'Create Account →' : 'Sign In →'}</>}
          </button>

          <div className="divider"><div className="divider-line" /><div className="divider-text">or</div><div className="divider-line" /></div>

          <button className="skip-btn" onClick={() => router.push('/scan')}>
            👁 Skip — View Live Demo (No account needed)
          </button>

          <div className="toggle-mode">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button className="toggle-link" onClick={() => { setIsSignUp(p => !p); setMessage(null) }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
