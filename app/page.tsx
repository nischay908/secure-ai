'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TYPING = [
  "🔍 Scanning Flask app for vulnerabilities...",
  "🧠 Reasoning: f-string in SQL = injection vector",
  "🚨 CRITICAL: SQL Injection at line 18 — CVSS 9.8",
  "🚨 HIGH: Hardcoded secret_key — CVSS 8.2",
  "🔧 Generating parameterized query patch...",
  "🔄 Re-verifying patched codebase...",
  "✅ Security score: 4 → 96 | All clear 🎉",
]

/* ── ANIMATED COUNTER ── */
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number | string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState<string | number>(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    if (typeof target === 'string') { setVal(target); return }
    let start = 0
    const duration = 1800
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

  return <span ref={ref} style={{ display: 'inline-block', transition: 'transform 0.3s', transform: visible ? 'scale(1)' : 'scale(0.8)' }}>{prefix}{val}{suffix}</span>
}

/* ── STAGGERED INFO SPANS ── */
function StaggeredInfo({ items, baseDelay = 0 }: { items: { icon?: string; text: string; color?: string }[]; baseDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 14px', borderRadius: '100px', fontSize: '12px',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
          background: item.color ? `rgba(${item.color},0.07)` : 'rgba(0,255,136,0.06)',
          border: `1px solid ${item.color ? `rgba(${item.color},0.22)` : 'rgba(0,255,136,0.18)'}`,
          color: item.color ? `rgb(${item.color})` : '#00ff88',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
          transition: `opacity 0.5s ease ${baseDelay + i * 0.1}s, transform 0.5s cubic-bezier(0.34,1.3,0.64,1) ${baseDelay + i * 0.1}s`,
        }}>
          {item.icon && <span>{item.icon}</span>}
          {item.text}
        </span>
      ))}
    </div>
  )
}

/* ── SEQUENTIAL INFO LINES ── */
function InfoLines({ lines, baseDelay = 0 }: { lines: { prefix?: string; content: string; color?: string }[]; baseDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-16px)',
          transition: `opacity 0.45s ease ${baseDelay + i * 0.12}s, transform 0.45s ease ${baseDelay + i * 0.12}s`,
          color: line.color || 'rgba(255,255,255,0.45)',
          padding: '2px 0',
        }}>
          {line.prefix && <span style={{ color: '#00ff88', marginRight: '8px' }}>{line.prefix}</span>}
          {line.content}
        </div>
      ))}
    </div>
  )
}

/* ── SPLASH BG: stars + cyber grid ── */
function SplashBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = window.innerWidth; c.height = window.innerHeight
    const W = c.width, H = c.height
    // Stars
    const stars = Array.from({length:180}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.4+0.2, a: Math.random(), da: (Math.random()-0.5)*0.008
    }))
    // Grid lines
    const GS = 52
    let t = 0
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      // Deep space gradient bg
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.8)
      bg.addColorStop(0,'#050a14'); bg.addColorStop(0.5,'#030810'); bg.addColorStop(1,'#020508')
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)
      // Grid
      const gAlpha = 0.04 + Math.sin(t*0.02)*0.01
      ctx.strokeStyle = `rgba(0,255,136,${gAlpha})`; ctx.lineWidth = 0.5
      for(let x=0;x<W;x+=GS){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for(let y=0;y<H;y+=GS){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      // Scanline
      const sy = ((t*1.2)%(H+40))-20
      const sg = ctx.createLinearGradient(0,sy-12,0,sy+12)
      sg.addColorStop(0,'transparent');sg.addColorStop(0.5,'rgba(0,255,136,0.08)');sg.addColorStop(1,'transparent')
      ctx.fillStyle=sg; ctx.fillRect(0,sy-12,W,24)
      // Aurora blobs
      const auroras=[{cx:W*0.2,cy:H*0.3,r:320,c:'0,200,255'},{cx:W*0.8,cy:H*0.7,r:280,c:'180,0,255'}]
      auroras.forEach(o=>{
        const p = Math.sin(t*0.015+o.r)*0.3+0.7
        const og = ctx.createRadialGradient(o.cx,o.cy,0,o.cx,o.cy,o.r*p)
        og.addColorStop(0,`rgba(${o.c},0.07)`);og.addColorStop(1,'rgba(0,0,0,0)')
        ctx.fillStyle=og; ctx.fillRect(0,0,W,H)
      })
      // Stars
      stars.forEach(s => {
        s.a = Math.max(0.05, Math.min(1, s.a + s.da))
        if(s.a<=0.05||s.a>=1) s.da*=-1
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2)
        ctx.fillStyle = `rgba(255,255,255,${s.a})`; ctx.fill()
      })
      t++; requestAnimationFrame(draw)
    }
    const id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [])
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
}

/* ── STAGED SPLASH SCREEN ── */
const FEATURES = [
  { icon:'🔍', text:'OWASP Top 10 · Full Vulnerability Coverage' },
  { icon:'🧠', text:'AI Chain-of-Thought · Real-time Reasoning' },
  { icon:'⚡', text:'Auto-Patch Generation · CVSS Scoring' },
]
function SplashScreen({onDone}:{onDone:()=>void}) {
  const [fadingOut, setFadingOut] = useState(false)
  
  useEffect(() => {
    // Shorter sequence: Logo only, then fade out
    const ts = [
      setTimeout(()=>setFadingOut(true), 1800),
      setTimeout(onDone, 2400),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onDone])

  return (
    <div className={`splash${fadingOut?' fade':''}`}>
      <SplashBG/>
      <div className="sc">
        <div className="sring"><span className="sicon">🛡</span></div>
        <div className="sname">Cyber<span style={{color:'#00ff88'}}>Sentry</span>
          <span style={{fontSize:'13px',marginLeft:'10px',background:'rgba(0,255,136,0.1)',color:'#00ff88',padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(0,255,136,0.28)',fontWeight:700,verticalAlign:'middle',fontFamily:"'JetBrains Mono',monospace"}}>AI</span>
        </div>
        <div className="sbar" style={{marginTop:'20px'}}>
          <div className="strack"><div className="sfill" style={{animationDuration:'1.8s'}}/></div>
          <div className="spct">Initializing Base Protocols...</div>
        </div>
      </div>
    </div>
  )
}

/* ── HERO BG: HEX GRID + RADAR + NODES + ORBS ── */
function HeroBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; initNodes() }
    window.addEventListener('resize', onResize)

    const HEX = 40, HW = HEX * Math.sqrt(3)
    function hexPath(x:number,y:number,s:number) {
      ctx.beginPath()
      for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;i===0?ctx.moveTo(x+s*Math.cos(a),y+s*Math.sin(a)):ctx.lineTo(x+s*Math.cos(a),y+s*Math.sin(a))}
      ctx.closePath()
    }

    type Node={x:number;y:number;vx:number;vy:number;r:number;type:string;pulse:number}
    const COLS:Record<string,string>={critical:'255,68,102',high:'255,149,0',medium:'255,200,0',info:'68,136,255'}
    const TYPES=['critical','high','medium','info']
    let nodes:Node[]=[]
    function initNodes(){nodes=Array.from({length:18},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*0.35,vy:(Math.random()-.5)*0.35,r:Math.random()*2.5+1.5,type:TYPES[Math.floor(Math.random()*4)],pulse:Math.random()*Math.PI*2}))}
    initNodes()

    /* Orbs */
    const orbs=[
      {x:W*0.15,y:H*0.25,vx:0.18,vy:0.1,r:280,phase:0},
      {x:W*0.88,y:H*0.65,vx:-0.14,vy:0.12,r:320,phase:2},
    ]

    let t=0, frame:number
    const CX=()=>W/2, CY=()=>H*0.44

    function draw(){
      ctx.clearRect(0,0,W,H); t++
      const angle=t*0.007

      /* Orbs */
      orbs.forEach(o=>{
        o.x+=o.vx; o.y+=o.vy
        if(o.x<-o.r||o.x>W+o.r)o.vx*=-1
        if(o.y<-o.r||o.y>H+o.r)o.vy*=-1
        const pulse=Math.sin(t*0.01+o.phase)*0.2+0.8
        const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*pulse)
        g.addColorStop(0,'rgba(0,255,136,0.045)'); g.addColorStop(0.5,'rgba(0,200,255,0.018)'); g.addColorStop(1,'transparent')
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
      })

      /* Hex grid */
      const cols2=Math.ceil(W/HW)+2, rows2=Math.ceil(H/HEX)+2
      for(let row=-1;row<rows2;row++){for(let col=-1;col<cols2;col++){
        const x=col*HW+(row%2)*HW/2, y=row*HEX*1.5
        const dx=x-CX(), dy=y-CY(), dist=Math.sqrt(dx*dx+dy*dy)
        const fade=Math.max(0,1-dist/(Math.max(W,H)*0.66))
        const na=Math.atan2(dy,dx)
        let da=((na-angle+Math.PI*3)%(Math.PI*2))-Math.PI
        const swept=da<0&&da>-0.26
        hexPath(x,y,HEX*0.44)
        ctx.strokeStyle=`rgba(0,255,136,${(0.04+(swept?0.2:0))*fade})`
        ctx.lineWidth=swept?1.1:0.5; ctx.stroke()
        if(swept&&fade>0.25){ctx.fillStyle=`rgba(0,255,136,${0.038*fade})`;ctx.fill()}
      }}

      /* Radar sweep */
      const R=Math.min(W,H)*0.52
      ctx.save(); ctx.translate(CX(),CY())
      for(let i=0;i<38;i++){const a=angle-0.55*(i/38);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,a-0.018,a,false);ctx.closePath();ctx.fillStyle=`rgba(0,255,136,${(1-i/38)*0.09})`;ctx.fill()}
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(angle)*R,Math.sin(angle)*R)
      ctx.strokeStyle='rgba(0,255,136,0.65)';ctx.lineWidth=1.5;ctx.shadowColor='#00ff88';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0
      ;[0.28,0.52,0.76,1].forEach(f=>{ctx.beginPath();ctx.arc(0,0,R*f,0,Math.PI*2);ctx.strokeStyle='rgba(0,255,136,0.05)';ctx.lineWidth=0.5;ctx.stroke()})
      ctx.restore()

      /* Threat nodes */
      nodes.forEach(n=>{
        n.x+=n.vx;n.y+=n.vy;n.pulse+=0.04
        if(n.x<0)n.x=W;if(n.x>W)n.x=0;if(n.y<0)n.y=H;if(n.y>H)n.y=0
        const dx2=n.x-CX(),dy2=n.y-CY()
        if(Math.sqrt(dx2*dx2+dy2*dy2)>R)return
        const na2=Math.atan2(dy2,dx2)
        let da2=((na2-angle+Math.PI*3)%(Math.PI*2))-Math.PI
        const lit=da2<0&&da2>-1.1
        const col=COLS[n.type], pulse=Math.sin(n.pulse)*0.5+0.5
        if(lit){ctx.beginPath();ctx.arc(n.x,n.y,n.r+12+pulse*8,0,Math.PI*2);ctx.strokeStyle=`rgba(${col},${0.22*pulse})`;ctx.lineWidth=1;ctx.stroke()}
        ctx.beginPath();ctx.arc(n.x,n.y,n.r+pulse,0,Math.PI*2)
        ctx.fillStyle=`rgba(${col},${lit?0.9:0.25})`;ctx.shadowColor=`rgba(${col},0.8)`;ctx.shadowBlur=lit?14:3;ctx.fill();ctx.shadowBlur=0
        if(lit){ctx.font='10px JetBrains Mono,monospace';ctx.fillStyle=`rgba(${col},0.75)`;ctx.fillText(n.type.toUpperCase(),n.x+n.r+7,n.y+3)}
      })

      /* Node connections */
      nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{const dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);if(d<160){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(0,255,136,${0.055*(1-d/160)})`;ctx.lineWidth=0.5;ctx.stroke()}}))

      /* Scan line across full page */
      const scanY=((t*0.6)%(H+60))-30
      const sg=ctx.createLinearGradient(0,scanY-20,0,scanY+20)
      sg.addColorStop(0,'transparent');sg.addColorStop(0.5,'rgba(0,255,136,0.025)');sg.addColorStop(1,'transparent')
      ctx.fillStyle=sg;ctx.fillRect(0,scanY-20,W,40)

      /* Vignette */
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.82)
      vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(3,4,8,0.72)')
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)

      frame=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',onResize)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1}}/>
}

/* ── STAT CARD with animated counter bar ── */
function StatCard({ item, delay = 0 }: { item: { num: number | string; suffix?: string; label: string; sub: string; bar: number }; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className="stat" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.34,1.2,0.64,1) ${delay}s`,
    }}>
      <div className="sn">
        <AnimatedCounter target={item.num} suffix={item.suffix || ''}/>
      </div>
      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',fontFamily:"'JetBrains Mono',monospace",marginBottom:'2px',textTransform:'uppercase',letterSpacing:'0.1em'}}>{item.label}</div>
      <div className="sl">{item.sub}</div>
      <div className="stat-bar">
        <div className="stat-bar-fill" style={{width: visible ? `${item.bar}%` : '0%', transition: `width 1.8s cubic-bezier(0.4,0,0.2,1) ${delay + 0.3}s`}}/>
      </div>
    </div>
  )
}

/* ── GLITCH TEXT ── */
function Glitch({text}:{text:string}) {
  const [g,setG]=useState(false)
  useEffect(()=>{
    const fire=()=>{setG(true);setTimeout(()=>setG(false),160);setTimeout(fire,3500+Math.random()*3500)}
    const id=setTimeout(fire,2500); return()=>clearTimeout(id)
  },[])
  return (
    <span style={{position:'relative',display:'inline-block'}}>
      {text}
      {g&&<>
        <span style={{position:'absolute',inset:0,color:'#ff4466',clipPath:'inset(20% 0 55% 0)',transform:'translate(-4px)',mixBlendMode:'screen'}}>{text}</span>
        <span style={{position:'absolute',inset:0,color:'#00aaff',clipPath:'inset(55% 0 15% 0)',transform:'translate(4px)',mixBlendMode:'screen'}}>{text}</span>
      </>}
    </span>
  )
}

/* ── LIVE COUNTER ── */
function LiveCounter(){const [n,setN]=useState(12847);useEffect(()=>{const id=setInterval(()=>setN(c=>c+Math.floor(Math.random()*3)),2000);return()=>clearInterval(id)},[]);return <span>{n.toLocaleString()}</span>}

/* ── SCROLL REVEAL ── */
function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const ref=useRef<HTMLDivElement>(null);const [v,setV]=useState(false)
  useEffect(()=>{const el=ref.current;if(!el)return;const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);obs.disconnect()}},{threshold:0.12});obs.observe(el);return()=>obs.disconnect()},[])
  return <div ref={ref} style={{opacity:v?1:0,transform:v?'translateY(0)':'translateY(28px)',transition:`opacity 0.7s ease ${delay}s,transform 0.7s ease ${delay}s`}}>{children}</div>
}

/* ── MAIN ── */
export default function Home() {
  const router=useRouter()
  const [splash,setSplash]=useState(true)
  const [visible,setVisible]=useState(false)
  const [lineIdx,setLineIdx]=useState(0)
  const [text,setText]=useState('')
  const [charIdx,setCharIdx]=useState(0)
  const [done,setDone]=useState<string[]>([])
  const [buildPhase, setBuildPhase] = useState(0)

  const handleSplashDone = () => { 
    setSplash(false); setVisible(true)
    // Staggered interface build sequence
    setTimeout(() => setBuildPhase(1), 100)  // Nav + Hero Text
    setTimeout(() => setBuildPhase(2), 600)  // Terminal
    setTimeout(() => setBuildPhase(3), 1200) // Stats & Cards
  }

  useEffect(()=>{
    if(splash || buildPhase < 2) return // Don't start typing until terminal is visible
    
    // Ensure lineIdx doesn't exceed array
    if (lineIdx >= TYPING.length) {
      setLineIdx(0);
      setDone([]);
      return;
    }
    
    const line=TYPING[lineIdx]
    if(charIdx<line.length){
      const t=setTimeout(()=>{
        setText(p=>p+line[charIdx]);
        setCharIdx(c=>c+1)
      },26);
      return()=>clearTimeout(t)
    } else {
      const t=setTimeout(()=>{
        setDone(p=>[...p.slice(-4),line]);
        setText('');
        setCharIdx(0);
        setLineIdx(i=>i+1)
      },900);
      return()=>clearTimeout(t)
    }
  },[charIdx,lineIdx,splash,buildPhase])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#020510;color:white;font-family:'Outfit',sans-serif;overflow-x:hidden;scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#050508;}::-webkit-scrollbar-thumb{background:#1a2a1a;border-radius:3px;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{box-shadow:0 0 14px rgba(0,255,136,0.18)}50%{box-shadow:0 0 48px rgba(0,255,136,0.55),0 0 90px rgba(0,255,136,0.08)}}
        @keyframes loadBar{from{width:0}to{width:100%}}
        @keyframes ringPop{0%{transform:scale(0) rotate(-180deg);opacity:0}65%{transform:scale(1.1) rotate(6deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes ringPulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.14);opacity:0}}
        @keyframes scanLine{0%{transform:translateY(-100%)}100%{transform:translateY(1400%)}}
        @keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(0,255,136,0.14)}50%{border-color:rgba(0,255,136,0.45)}}
        @keyframes radarPing{0%{transform:scale(0.8);opacity:0.6}100%{transform:scale(2.4);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes countUp{0%{transform:scale(1.2);color:#00ff88}100%{transform:scale(1)}}
        @keyframes splashIn{0%{opacity:0;transform:translateY(18px) scale(0.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes featIn{0%{opacity:0;transform:translateX(-22px)}100%{opacity:1;transform:translateX(0)}}
        @keyframes ctaIn{0%{opacity:0;transform:translateY(16px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes haloSpin{to{transform:rotate(360deg)}}
        @keyframes popIn{0%{opacity:0;transform:scale(0.5) translateY(20px)}70%{transform:scale(1.08) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes numberFlip{0%{transform:translateY(-100%);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes infoBarLoad{from{width:0%}to{width:var(--w,100%)}}
        @keyframes pulse-ring{0%{transform:scale(0.9);opacity:1}100%{transform:scale(1.5);opacity:0}}

        /* SPLASH */
        .splash{position:fixed;inset:0;z-index:9999;background:#020510;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:opacity 1s ease;}
        .splash.fade{opacity:0;pointer-events:none;}
        .sc{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:22px;}
        .sring{width:116px;height:116px;border-radius:50%;border:2px solid transparent;background:linear-gradient(#020510,#020510) padding-box,linear-gradient(135deg,#00ff88,#00ccff,#a855f7,#00ff88) border-box;display:flex;align-items:center;justify-content:center;position:relative;animation:ringPop 0.9s cubic-bezier(0.34,1.56,0.64,1) both;box-shadow:0 0 80px rgba(0,255,136,0.18),0 0 160px rgba(0,200,255,0.08);}
        .sring::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:1px solid rgba(0,255,136,0.2);animation:ringPulse 2s ease infinite;}
        .sring::after{content:'';position:absolute;inset:-22px;border-radius:50%;border:1px solid rgba(168,85,247,0.12);animation:ringPulse 2.4s ease 0.6s infinite;}
        .sicon{font-size:46px;filter:drop-shadow(0 0 28px rgba(0,255,136,0.9));}
        .sname{font-size:32px;font-weight:900;letter-spacing:-0.03em;animation:fadeUp 0.55s ease 0.5s both;text-shadow:0 0 40px rgba(0,255,136,0.18);}
        /* Splash staged elements */
        .splash-stage{opacity:0;pointer-events:none;}
        .splash-stage.splash-show{animation:splashIn 0.6s cubic-bezier(0.34,1.3,0.64,1) forwards;}
        .stag{font-size:11px;color:rgba(255,255,255,0.28);letter-spacing:0.24em;text-transform:uppercase;font-weight:600;font-family:'JetBrains Mono',monospace;}
        .splash-features{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;}
        .splash-feat{display:flex;align-items:center;gap:12px;background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.12);border-radius:12px;padding:10px 16px;font-size:13px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.65);opacity:0;}
        .splash-feat.splash-show{animation:featIn 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards;}
        .sfeat-icon{font-size:18px;flex-shrink:0;}
        .splash-ctas{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;opacity:0;}
        .splash-ctas.splash-show{animation:ctaIn 0.7s cubic-bezier(0.34,1.4,0.64,1) forwards;}
        .splash-btn-p{background:linear-gradient(135deg,#00ff88,#00ccaa);color:#000;border:none;padding:13px 30px;border-radius:12px;font-weight:900;font-size:15px;cursor:pointer;font-family:'Outfit',sans-serif;box-shadow:0 4px 32px rgba(0,255,136,0.38);transition:transform 0.2s,box-shadow 0.2s;}
        .splash-btn-p:hover{transform:translateY(-3px);box-shadow:0 10px 44px rgba(0,255,136,0.55);}
        .splash-btn-o{background:rgba(255,255,255,0.04);color:white;border:1px solid rgba(255,255,255,0.14);padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.2s;}
        .splash-btn-o:hover{border-color:rgba(0,255,136,0.4);background:rgba(0,255,136,0.06);transform:translateY(-3px);}
        .sbar{width:200px;animation:fadeUp 0.5s ease 0.3s both;}
        .strack{height:2px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;}
        .sfill{height:100%;background:linear-gradient(90deg,#00ff88,#00ccff,#a855f7);border-radius:2px;animation:loadBar 5.2s cubic-bezier(0.4,0,0.2,1) forwards;box-shadow:0 0 12px rgba(0,255,136,0.7);}
        .spct{text-align:right;font-family:'JetBrains Mono',monospace;font-size:11px;color:#00ff88;margin-top:6px;transition:all 0.3s;}

        .page{opacity:0;transition:opacity 1s ease;}
        .page.show{opacity:1;}

        nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:16px 52px;background:rgba(3,4,8,0.75);backdrop-filter:blur(28px);border-bottom:1px solid rgba(0,255,136,0.06);}
        .nlogo{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .nico{width:36px;height:36px;border-radius:10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;animation:glow 4s ease infinite;}
        .nbadge{font-size:10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.22);color:#00ff88;padding:2px 9px;border-radius:20px;font-weight:700;letter-spacing:0.06em;font-family:'JetBrains Mono',monospace;}
        .nlink{color:rgba(255,255,255,0.35);background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s;font-family:'Outfit',sans-serif;}
        .nlink:hover{color:white;background:rgba(255,255,255,0.05);}
        .nstart{background:#00ff88;color:#000;border:none;padding:10px 22px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;box-shadow:0 4px 20px rgba(0,255,136,0.3);}
        .nstart:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,255,136,0.45);background:#11ffaa;}

        .ticker{position:relative;z-index:10;background:rgba(0,255,136,0.025);border-bottom:1px solid rgba(0,255,136,0.07);padding:9px 0;overflow:hidden;margin-top:68px;}
        .ttrack{display:flex;width:max-content;animation:ticker 26s linear infinite;}
        .titem{display:flex;align-items:center;gap:8px;padding:0 44px;font-size:12px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.26);white-space:nowrap;}
        .tdot{width:5px;height:5px;border-radius:50%;}

        .hero{position:relative;z-index:10;min-height:calc(100vh - 115px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:50px 24px 40px;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.16);border-radius:100px;padding:7px 20px;margin-bottom:28px;animation:borderGlow 4s ease infinite,fadeUp 0.7s ease 0.15s both;}
        .pdot{width:7px;height:7px;border-radius:50%;background:#00ff88;animation:blink 1.8s ease infinite;}
        h1{font-size:clamp(46px,8.5vw,94px);font-weight:900;line-height:1.01;letter-spacing:-0.04em;margin-bottom:22px;animation:fadeUp 0.7s ease 0.25s both;}
        .grad{background:linear-gradient(105deg,#00ff88 0%,#00ddff 45%,#00ff88 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
        .hsub{font-size:clamp(14px,1.8vw,18px);color:rgba(255,255,255,0.36);max-width:520px;line-height:1.88;margin-bottom:38px;animation:fadeUp 0.7s ease 0.35s both;font-family:'JetBrains Mono',monospace;}
        .ctas{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:48px;animation:fadeUp 0.7s ease 0.45s both;}
        .btn-p{background:#00ff88;color:#000;border:none;padding:15px 36px;border-radius:14px;font-weight:900;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;box-shadow:0 4px 28px rgba(0,255,136,0.32);display:inline-flex;align-items:center;gap:8px;}
        .btn-p:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(0,255,136,0.5);background:#11ffaa;}
        .btn-o{background:transparent;color:white;border:1px solid rgba(255,255,255,0.13);padding:15px 28px;border-radius:14px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;display:inline-flex;align-items:center;gap:8px;}
        .btn-o:hover{border-color:rgba(0,255,136,0.45);background:rgba(0,255,136,0.05);transform:translateY(-3px);}

        .twrap{width:100%;max-width:700px;animation:fadeUp 0.7s ease 0.55s both;}
        .terminal{background:#060810;border:1px solid rgba(0,255,136,0.12);border-radius:18px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.9),0 0 60px rgba(0,255,136,0.04);position:relative;}
        .terminal::before{content:'';position:absolute;left:0;right:0;height:1px;top:0;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.5),transparent);animation:scanLine 5s ease infinite;}
        .tbar{background:#0c0f1a;padding:13px 18px;display:flex;align-items:center;gap:7px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .dot{width:11px;height:11px;border-radius:50%;}
        .ttitle{margin-left:10px;font-size:12px;color:rgba(255,255,255,0.16);font-family:'JetBrains Mono',monospace;}
        .tbody{padding:18px 22px;min-height:140px;display:flex;flex-direction:column;gap:4px;}
        .tline{font-size:13px;font-family:'JetBrains Mono',monospace;padding:2px 0;line-height:1.55;}
        .tdone{opacity:0.35;}.tok{color:#00ff88;opacity:1;}.terr{color:#ff4466;opacity:1;}.twarn{color:#ff9500;opacity:1;}
        .cursor{display:inline-block;width:8px;height:14px;background:#00ff88;vertical-align:middle;margin-left:2px;animation:blink 1s ease infinite;}

        .stats{position:relative;z-index:10;padding:44px 52px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1000px;margin:0 auto;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);}
        .stat{text-align:center;padding:20px 16px;border-radius:16px;background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.05);transition:all 0.3s;position:relative;overflow:hidden;}
        .stat::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.35),transparent);}
        .stat:hover{border-color:rgba(0,255,136,0.22);background:rgba(0,255,136,0.03);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.5),0 0 30px rgba(0,255,136,0.04);}
        .sn{font-size:34px;font-weight:900;color:#00ff88;letter-spacing:-0.03em;margin-bottom:6px;font-variant-numeric:tabular-nums;}
        .sl{font-size:11px;color:rgba(255,255,255,0.26);font-family:'JetBrains Mono',monospace;}
        .stat-bar{height:2px;background:rgba(255,255,255,0.04);border-radius:2px;margin-top:12px;overflow:hidden;}
        .stat-bar-fill{height:100%;background:linear-gradient(90deg,#00ff88,#00ccff);border-radius:2px;width:0%;transition:width 1.8s cubic-bezier(0.4,0,0.2,1);}
        .stat-bar-fill.active{width:100%;}

        .section{position:relative;z-index:10;padding:96px 52px;text-align:center;}
        .sec-tag{font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#00ff88;margin-bottom:14px;font-family:'JetBrains Mono',monospace;}
        .sec-title{font-size:clamp(28px,4vw,52px);font-weight:900;letter-spacing:-0.03em;margin-bottom:14px;line-height:1.08;}
        .sec-sub{font-size:16px;color:rgba(255,255,255,0.32);max-width:500px;line-height:1.8;margin:0 auto 52px;font-family:'JetBrains Mono',monospace;}

        .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1080px;margin:0 auto;}
        .card{background:rgba(255,255,255,0.013);border:1px solid rgba(255,255,255,0.06);border-radius:22px;padding:32px;transition:all 0.4s;cursor:default;position:relative;overflow:hidden;}
        .card::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top left,rgba(0,255,136,0.08),transparent 55%);opacity:0;transition:opacity 0.4s;}
        .card:hover{border-color:rgba(0,255,136,0.3);transform:translateY(-10px);box-shadow:0 32px 80px rgba(0,0,0,0.6),0 0 60px rgba(0,255,136,0.05);}
        .card:hover::after{opacity:1;}
        .cico{width:52px;height:52px;border-radius:14px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.16);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px;transition:all 0.35s;}
        .card:hover .cico{background:rgba(0,255,136,0.14);transform:scale(1.12) rotate(6deg);}
        .cnum{font-size:56px;font-weight:900;color:rgba(255,255,255,0.022);float:right;line-height:1;letter-spacing:-0.04em;}
        .ctit{font-size:18px;font-weight:800;margin-bottom:10px;letter-spacing:-0.02em;}
        .cdesc{font-size:13px;color:rgba(255,255,255,0.32);line-height:1.8;font-family:'JetBrains Mono',monospace;}

        .vwrap{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:860px;margin:0 auto 52px;}
        .vb{padding:9px 18px;border-radius:100px;font-size:12px;font-weight:700;cursor:default;transition:all 0.25s;border-width:1px;border-style:solid;font-family:'JetBrains Mono',monospace;}
        .vb:hover{transform:translateY(-5px) scale(1.06);}
        .vc{background:rgba(255,68,102,0.07);border-color:rgba(255,68,102,0.25);color:#ff4466;}
        .vh{background:rgba(255,149,0,0.07);border-color:rgba(255,149,0,0.25);color:#ff9500;}
        .vm{background:rgba(255,200,0,0.07);border-color:rgba(255,200,0,0.25);color:#ffc800;}

        .cgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;max-width:940px;margin:0 auto;}
        .ccard{background:rgba(255,255,255,0.016);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;transition:all 0.3s;}
        .ccard:hover{transform:translateY(-5px);border-color:rgba(0,255,136,0.2);box-shadow:0 16px 48px rgba(0,0,0,0.4);}
        .csco{min-width:50px;height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;font-family:'JetBrains Mono',monospace;}
        .cna{font-size:13px;font-weight:800;margin-bottom:3px;letter-spacing:-0.01em;}
        .cds{font-size:11px;color:rgba(255,255,255,0.27);font-family:'JetBrains Mono',monospace;}

        .tech-row{display:flex;flex-wrap:wrap;justify-content:center;gap:48px;align-items:center;}
        .tech-item{color:rgba(255,255,255,0.17);font-weight:700;font-size:14px;cursor:default;transition:all 0.25s;font-family:'JetBrains Mono',monospace;}
        .tech-item:hover{color:rgba(255,255,255,0.75);transform:translateY(-2px);}

        .cta-wrap{position:relative;z-index:10;text-align:center;padding:96px 52px;}
        .cta-box{max-width:680px;margin:0 auto;background:rgba(0,255,136,0.018);border:1px solid rgba(0,255,136,0.1);border-radius:32px;padding:76px 56px;position:relative;overflow:hidden;animation:borderGlow 4s ease infinite;}
        .cta-box::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.055),transparent 70%);}
        .cta-title{font-size:clamp(26px,3.8vw,44px);font-weight:900;letter-spacing:-0.03em;margin-bottom:14px;}
        .cta-sub{font-size:16px;color:rgba(255,255,255,0.32);margin-bottom:38px;line-height:1.7;font-family:'JetBrains Mono',monospace;}

        footer{position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);padding:28px 52px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:rgba(255,255,255,0.15);font-family:'JetBrains Mono',monospace;}
        .fbrand{color:#00ff88;font-weight:700;}

        @media(max-width:768px){nav{padding:14px 20px;}.section{padding:60px 20px;}.stats{grid-template-columns:repeat(2,1fr);padding:32px 20px;}.cta-box{padding:44px 24px;}footer{flex-direction:column;gap:8px;text-align:center;}}
      `}</style>

      {/* STAGED SPLASH */}
      {splash&&<SplashScreen onDone={handleSplashDone}/>}

      {/* ANIMATED BG */}
      {!splash&&<HeroBG/>}

      {/* NAV */}
      <nav style={{
        opacity: visible ? 1 : 0, 
        transform: buildPhase >= 1 ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.3,0.64,1)',
        pointerEvents: visible ? 'auto' : 'none'
      }}>
        <div className="nlogo" onClick={()=>router.push('/')}>
          <div className="nico">🛡</div>
          <span style={{fontSize:'17px',fontWeight:900,letterSpacing:'-0.02em'}}>Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
          <span className="nbadge">AI</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <button className="nlink" onClick={()=>router.push('/login')}>Login</button>
          <button className="nstart" onClick={()=>router.push('/login')}>Start Free →</button>
        </div>
      </nav>

      {/* LIVE TICKER */}
      <div className="ticker" style={{opacity:visible?1:0,transition:'opacity 0.9s ease 0.3s'}}>
        <div className="ttrack">
          {[...Array(2)].map((_,rep)=>(
            <span key={rep} style={{display:'contents'}}>
              {[
                {dot:'#00ff88',txt:'Vulnerabilities today: ',val:<LiveCounter/>},
                {dot:'#ff9500',txt:'Agent status: ',val:<span style={{color:'#ff9500'}}>ONLINE</span>},
                {dot:'#4488ff',txt:'OWASP coverage: ',val:<span style={{color:'#4488ff'}}>100%</span>},
                {dot:'#ff4466',txt:'Critical blocked: ',val:<span style={{color:'#ff4466'}}>2,341</span>},
                {dot:'#00ff88',txt:'Avg scan time: ',val:<span style={{color:'#00ff88'}}>&lt;4.2s</span>},
                {dot:'#ffc800',txt:'Languages: ',val:<span style={{color:'#ffc800'}}>9</span>},
              ].map((item,i)=>(
                <div key={`${rep}-${i}`} className="titem">
                  <div className="tdot" style={{background:item.dot}}/>
                  <span>{item.txt}<span style={{fontWeight:700,color:'white'}}>{item.val}</span></span>
                  <span style={{opacity:0.18,marginLeft:'18px'}}>◆</span>
                </div>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* PAGE */}
      <div className={`page${visible?' show':''}`}>

        {/* HERO */}
        <div className="hero">
          <div style={{
            opacity: buildPhase >= 1 ? 1 : 0,
            transform: buildPhase >= 1 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.34,1.3,0.64,1) 0.1s'
          }}>
            <div className="eyebrow" style={{animation:'none'}}>
              <div className="pdot"/>
              <span style={{fontSize:'12px',color:'#00ff88',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>Agentic AI · Chain-of-Thought · OWASP Top 10</span>
            </div>
            <h1 style={{animation:'none'}}>Your Code's<br/><span className="grad"><Glitch text="AI Security Guard"/></span></h1>
            <p className="hsub" style={{animation:'none',margin:'0 auto 38px'}}>An autonomous agent that thinks like a<br/>senior security engineer — in real time.</p>
            <div className="ctas" style={{animation:'none'}}>
              <button className="btn-p" onClick={()=>router.push('/login')}>🛡 Scan My Code Free</button>
              <button className="btn-o" onClick={()=>router.push('/dashboard')}>👁 Live Demo</button>
            </div>
          </div>
          
          <div className="twrap" style={{
            opacity: buildPhase >= 2 ? 1 : 0,
            transform: buildPhase >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.7s ease 0.2s, transform 0.7s cubic-bezier(0.34,1.3,0.64,1) 0.2s'
          }}>
            <div className="terminal">
              <div className="tbar">
                <div className="dot" style={{background:'#ff5f56'}}/><div className="dot" style={{background:'#ffbd2e'}}/><div className="dot" style={{background:'#27c93f'}}/>
                <span className="ttitle">cyber-sentry — agent output [live]</span>
              </div>
              <div className="tbody">
                {done.map((l,i)=><div key={i} className={`tline tdone ${l.includes('✅')||l.includes('🎉')?'tok':l.includes('🚨')?'terr':l.includes('🔧')||l.includes('🔄')?'twarn':''}`}>{l}</div>)}
                <div className="tline" style={{color:'#00ff88'}}>{text}<span className="cursor"/></div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats" style={{
          opacity: buildPhase >= 3 ? 1 : 0, 
          transform: buildPhase >= 3 ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.3,0.64,1)'
        }}>
          {[
            {num:10,   suffix:'',      label:'OWASP',   sub:'Top 10 Covered',    bar:100},
            {num:3,    suffix:'-Step', label:'Agentic', sub:'Reasoning Loop',    bar:75},
            {num:96,   suffix:'',      label:'Score',   sub:'Security Rating',   bar:96},
            {num:4.2,  suffix:'s',     label:'Speed',   sub:'Avg Scan Time',     bar:60},
          ].map((s,i)=>(
            <StatCard key={i} item={s} delay={i * 0.12}/>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="section" style={{
          opacity: buildPhase >= 3 ? 1 : 0,
          transition: 'opacity 0.8s ease'
        }}>
          <Reveal><p className="sec-tag">The Agent Loop</p></Reveal>
          <Reveal delay={0.1}><h2 className="sec-title">How CyberSentry <Glitch text="Thinks"/></h2></Reveal>
          <Reveal delay={0.15}><p className="sec-sub">Watch AI reason through every vulnerability — not just detect, but explain and patch</p></Reveal>
          <Reveal delay={0.2}>
            <div style={{maxWidth:'640px',margin:'0 auto 40px',padding:'0 4px'}}>
              <InfoLines baseDelay={0.3} lines={[
                {prefix:'[INIT]',    content:'Loading vulnerability pattern database...'},
                {prefix:'[SCAN]',    content:'Running OWASP Top 10 static analysis checks...', color:'rgba(255,255,255,0.5)'},
                {prefix:'[REASON]',  content:'Chain-of-thought: evaluating injection vectors...', color:'rgba(255,200,0,0.7)'},
                {prefix:'[PATCH]',   content:'Generating production-ready secure code patches...', color:'rgba(0,200,255,0.7)'},
                {prefix:'[VERIFY]',  content:'Re-scanning patched codebase... ✅ All clear', color:'rgba(0,255,136,0.85)'},
              ]}/>
            </div>
          </Reveal>
          <div className="cards">
            {[
              {i:'🔍',n:'01',t:'Analyze & Reason',d:'Scans full codebase, builds vulnerability map via chain-of-thought — every decision visible in real time.'},
              {i:'⚡',n:'02',t:'Generate Patches',d:'Writes production-ready secure code with parameterized queries, env variables, path validation, explaining each change.'},
              {i:'🔒',n:'03',t:'Verify & Score',d:'Re-scans patched code to confirm all fixes, issues an industry-standard CVSS security score showing exact improvement.'},
            ].map((c,i)=>(
              <Reveal key={i} delay={i*0.15}>
                <div className="card">
                  <span className="cnum">{c.n}</span>
                  <div className="cico">{c.i}</div>
                  <div className="ctit">{c.t}</div>
                  <div className="cdesc">{c.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* VULNS + CVSS */}
        <div className="section" style={{background:'rgba(255,255,255,0.007)',borderTop:'1px solid rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <Reveal><p className="sec-tag">Detection Coverage</p></Reveal>
          <Reveal delay={0.1}><h2 className="sec-title">What We Find</h2></Reveal>
          <Reveal delay={0.15}><p className="sec-sub">Full OWASP Top 10 · 9 languages · CVSS scoring</p></Reveal>
          <Reveal delay={0.2}>
            <StaggeredInfo baseDelay={0.1} items={[
              {icon:'🔴', text:'SQL Injection',               color:'255,68,102'},
              {icon:'🔴', text:'Command Injection',           color:'255,68,102'},
              {icon:'🔴', text:'Broken Auth',                 color:'255,68,102'},
              {icon:'🟠', text:'XSS',                        color:'255,149,0'},
              {icon:'🟠', text:'Path Traversal',             color:'255,149,0'},
              {icon:'🟠', text:'Hardcoded Secrets',          color:'255,149,0'},
              {icon:'🟠', text:'Insecure Deserialization',   color:'255,149,0'},
              {icon:'🟠', text:'Sensitive Data Exposure',    color:'255,149,0'},
              {icon:'🟡', text:'CSRF',                       color:'255,200,0'},
              {icon:'🟡', text:'Security Misconfiguration',  color:'255,200,0'},
            ]}/>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="sec-tag" style={{marginBottom:'22px'}}>CVSS Industry Scoring</p>
            <div className="cgrid">
              {[
                {s:'9.8',n:'SQL Injection',     d:'Remote code execution',   bg:'rgba(255,68,102,0.08)', b:'rgba(255,68,102,0.22)', c:'#ff4466'},
                {s:'9.0',n:'Command Injection', d:'Arbitrary code execution', bg:'rgba(255,68,102,0.06)', b:'rgba(255,68,102,0.18)', c:'#ff4466'},
                {s:'8.2',n:'Hardcoded Secrets', d:'Credential exposure',     bg:'rgba(255,149,0,0.08)',  b:'rgba(255,149,0,0.22)',  c:'#ff9500'},
                {s:'7.5',n:'Path Traversal',    d:'File system bypass',      bg:'rgba(255,149,0,0.06)',  b:'rgba(255,149,0,0.18)',  c:'#ff9500'},
                {s:'6.1',n:'XSS',               d:'Client-side injection',   bg:'rgba(255,200,0,0.07)',  b:'rgba(255,200,0,0.2)',   c:'#ffc800'},
                {s:'5.3',n:'CSRF',              d:'Cross-site forgery',      bg:'rgba(68,136,255,0.07)', b:'rgba(68,136,255,0.2)',  c:'#4488ff'},
              ].map((cv,i)=>(
                <div className="ccard" key={i}>
                  <div className="csco" style={{background:cv.bg,border:`1px solid ${cv.b}`,color:cv.c}}>{cv.s}</div>
                  <div><div className="cna">{cv.n}</div><div className="cds">{cv.d}</div></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* TECH STACK */}
        <div className="section" style={{paddingTop:'60px',paddingBottom:'60px'}}>
          <Reveal>
            <p style={{fontSize:'10px',letterSpacing:'0.24em',textTransform:'uppercase',color:'rgba(255,255,255,0.13)',marginBottom:'32px',fontFamily:"'JetBrains Mono',monospace"}}>Powered By</p>
            <div className="tech-row">
              {['Next.js 14','Claude API','Supabase','TypeScript','Vercel','Tailwind CSS'].map((t,i)=><span key={i} className="tech-item">{t}</span>)}
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <div className="cta-wrap">
          <Reveal>
            <div className="cta-box">
              <p className="sec-tag" style={{marginBottom:'18px'}}>Get Started Free</p>
              <h2 className="cta-title">Ready to <Glitch text="Secure"/> Your Code?</h2>
              <p className="cta-sub">Paste code, watch the AI agent work in real-time,<br/>get production-ready patches in seconds.</p>
              <button className="btn-p" style={{fontSize:'16px',padding:'16px 44px',margin:'0 auto'}} onClick={()=>router.push('/login')}>
                Start Scanning Free →
              </button>
            </div>
          </Reveal>
        </div>

        <footer>
          <span>© 2026 <span className="fbrand">CyberSentry AI</span></span>
          <span>Built for Hackathon · Nischay Bansal</span>
        </footer>
      </div>
    </>
  )
}