'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const INTRO_STEPS = [
  { delay: 0,    type: 'sys',    text: 'CYBERSENTRY AGENT v2.4.1 — INITIALIZING...' },
  { delay: 600,  type: 'sys',    text: 'Loading OWASP Top 10 ruleset v2024...' },
  { delay: 1100, type: 'sys',    text: 'Connecting to threat intelligence feed...' },
  { delay: 1600, type: 'ok',     text: 'All modules online. Agent ready.' },
  { delay: 2000, type: 'sep',    text: '─────────────────────────────────────────────' },
  { delay: 2200, type: 'info',   text: 'Target: Flask application — 47 lines of Python' },
  { delay: 2500, type: 'scan',   text: '🔍 Building AST... chain-of-thought analysis started' },
  { delay: 3200, type: 'warn',   text: '⚠  CRITICAL ► SQL Injection at line 18    [CVSS 9.8]' },
  { delay: 3700, type: 'warn',   text: '⚠  CRITICAL ► Command Injection line 29   [CVSS 9.0]' },
  { delay: 4100, type: 'warn',   text: '⚠  HIGH     ► Hardcoded secret_key        [CVSS 8.2]' },
  { delay: 4500, type: 'warn',   text: '⚠  HIGH     ► Path Traversal line 24      [CVSS 7.5]' },
  { delay: 4900, type: 'sep',    text: '─────────────────────────────────────────────' },
  { delay: 5100, type: 'fix',    text: '🔧 Generating secure patches for all 4 issues...' },
  { delay: 5500, type: 'ok',     text: '✓  Parameterized SQL query — injection eliminated' },
  { delay: 5800, type: 'ok',     text: '✓  os.environ.get() replacing hardcoded key' },
  { delay: 6100, type: 'ok',     text: '✓  Path.resolve() guard inserted at file handler' },
  { delay: 6400, type: 'ok',     text: '✓  Command whitelist replacing os.popen(cmd)' },
  { delay: 6700, type: 'sep',    text: '─────────────────────────────────────────────' },
  { delay: 6900, type: 'verify', text: '🔄 Re-scanning patched code to verify all fixes...' },
  { delay: 7500, type: 'score',  text: '📊 Security score:  4 → 96  (+92 pts)  ✅ SECURE' },
  { delay: 8000, type: 'done',   text: '🎉 Agent complete. Code is production-ready.' },
]

const LIVE_LINES = [
  "🔍 Scanning Flask app for vulnerabilities...",
  "🧠 Reasoning: f-string in SQL = injection vector",
  "🚨 CRITICAL: SQL Injection at line 18 — CVSS 9.8",
  "🚨 CRITICAL: Command Injection — os.popen(cmd)",
  "🚨 HIGH: Hardcoded secret_key — git history exposure",
  "🔧 Generating parameterized query patch...",
  "🔧 Replacing os.popen() with whitelist approach...",
  "🔄 Re-verifying patched codebase...",
  "✅ Security score: 4 → 96 | All vulnerabilities fixed 🎉",
]

function MatrixRain({ opacity = 1 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = window.innerWidth; c.height = window.innerHeight
    const cols = Math.floor(c.width / 16)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01アカCVSSINJECTION{}[]SECURE脆弱性PATCH</>$#@!?'
    const id = setInterval(() => {
      ctx.fillStyle = 'rgba(3,4,8,0.06)'; ctx.fillRect(0, 0, c.width, c.height)
      drops.forEach((y, i) => {
        const bright = Math.random() > 0.97
        ctx.fillStyle = bright ? '#ffffff' : `rgba(0,255,136,${Math.random() * 0.4 + 0.1})`
        ctx.font = `${bright ? 'bold ' : ''}12px monospace`
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16)
        if (y * 16 > c.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }, 50)
    return () => clearInterval(id)
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }} />
}

function CinematicIntro({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<typeof INTRO_STEPS>([])
  const [fading, setFading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    INTRO_STEPS.forEach(step => {
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, step])
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, step.delay))
    })
    timers.push(setTimeout(() => setFading(true), 8800))
    timers.push(setTimeout(onDone, 9600))
    return () => timers.forEach(clearTimeout)
  }, [])

  const color = (type: string) => ({ sys: 'rgba(255,255,255,0.28)', ok: '#00ff88', warn: '#ff9500', fix: '#4488ff', verify: '#aa88ff', score: '#00ff88', done: '#00ff88', sep: 'rgba(255,255,255,0.07)', info: 'rgba(255,255,255,0.45)', scan: '#00ccff' }[type] || 'rgba(255,255,255,0.3)')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#030408', opacity: fading ? 0 : 1, transition: 'opacity 0.8s ease', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MatrixRain opacity={0.12} />
      <div style={{ position: 'relative', zIndex: 2, borderBottom: '1px solid rgba(0,255,136,0.15)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(3,4,8,0.85)', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 12px #00ff88', animation: 'blink 1.5s ease infinite' }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#00ff88', fontWeight: 700, letterSpacing: '0.1em' }}>CYBERSENTRY AI — LIVE SCAN SESSION</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['ANALYZING', 'PATCHING', 'SECURING'].map((label, i) => (
            <span key={i} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(0,255,136,0.2)', color: 'rgba(0,255,136,0.5)', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(0,255,136,0.04)', animation: `blink ${1.2 + i * 0.4}s ease ${i * 0.3}s infinite` }}>{label}</span>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 2, flex: 1, padding: '28px 36px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: line.type === 'score' ? 16 : 13, color: color(line.type), fontWeight: line.type === 'score' || line.type === 'done' ? 800 : 400, padding: '3px 0', borderLeft: line.type === 'warn' ? '3px solid #ff9500' : line.type === 'ok' ? '3px solid #00ff88' : line.type === 'score' ? '3px solid #00ff88' : '3px solid transparent', paddingLeft: ['warn','ok','score','fix','verify','done'].includes(line.type) ? 12 : 0, background: line.type === 'score' ? 'rgba(0,255,136,0.06)' : line.type === 'warn' ? 'rgba(255,149,0,0.04)' : 'transparent', borderRadius: 4, animation: 'fadeIn 0.3s ease', lineHeight: 1.7 }}>
            {line.type === 'sys' && <span style={{ color: 'rgba(0,255,136,0.35)', marginRight: 8 }}>[SYS]</span>}
            {line.type === 'info' && <span style={{ color: 'rgba(255,255,255,0.22)', marginRight: 8 }}>[INFO]</span>}
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
        {lines.length < INTRO_STEPS.length && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#00ff88', marginTop: 4, animation: 'blink 1s ease infinite' }}>█</div>}
      </div>
      <div style={{ position: 'relative', zIndex: 2, padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(3,4,8,0.85)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>SCAN PROGRESS</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#00ff88' }}>{Math.round((lines.length / INTRO_STEPS.length) * 100)}%</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(lines.length / INTRO_STEPS.length) * 100}%`, background: 'linear-gradient(90deg,#00ff88,#00ccff)', borderRadius: 3, transition: 'width 0.4s ease', boxShadow: '0 0 10px rgba(0,255,136,0.6)' }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.15)', textAlign: 'right' }}>Loading CyberSentry interface...</div>
      </div>
    </div>
  )
}

function HeroBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    type Node = { x:number; y:number; vx:number; vy:number; r:number; type:string; pulse:number }
    const COLS: Record<string,string> = { critical:'255,68,102', high:'255,149,0', medium:'255,200,0', info:'68,136,255' }
    const TYPES = ['critical','high','medium','info']
    const nodes: Node[] = Array.from({length:20},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*0.3,vy:(Math.random()-.5)*0.3,r:Math.random()*2.5+1.5,type:TYPES[Math.floor(Math.random()*4)],pulse:Math.random()*Math.PI*2}))
    const orbs = [{x:W*0.15,y:H*0.3,r:300,vx:0.15,vy:0.08,phase:0},{x:W*0.85,y:H*0.7,r:350,vx:-0.12,vy:0.1,phase:2}]
    let t=0, frame:number
    function draw() {
      ctx.clearRect(0,0,W,H); t++
      const angle = t*0.007
      orbs.forEach(o => {
        o.x+=o.vx; o.y+=o.vy
        if(o.x<-o.r||o.x>W+o.r)o.vx*=-1; if(o.y<-o.r||o.y>H+o.r)o.vy*=-1
        const pulse=Math.sin(t*0.01+o.phase)*0.2+0.8
        const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*pulse)
        g.addColorStop(0,'rgba(0,255,136,0.04)');g.addColorStop(0.5,'rgba(0,200,255,0.015)');g.addColorStop(1,'transparent')
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H)
      })
      const HEX=40,HW=HEX*Math.sqrt(3),CX=W/2,CY=H*0.44,R=Math.min(W,H)*0.52
      const cols2=Math.ceil(W/HW)+2,rows2=Math.ceil(H/HEX)+2
      for(let row=-1;row<rows2;row++)for(let col=-1;col<cols2;col++){
        const x=col*HW+(row%2)*HW/2,y=row*HEX*1.5
        const dx=x-CX,dy=y-CY,dist=Math.sqrt(dx*dx+dy*dy)
        const fade=Math.max(0,1-dist/(Math.max(W,H)*0.66))
        const na=Math.atan2(dy,dx)
        let da=((na-angle+Math.PI*3)%(Math.PI*2))-Math.PI
        const swept=da<0&&da>-0.26
        ctx.beginPath()
        for(let k=0;k<6;k++){const a=Math.PI/3*k-Math.PI/6;k===0?ctx.moveTo(x+HEX*0.44*Math.cos(a),y+HEX*0.44*Math.sin(a)):ctx.lineTo(x+HEX*0.44*Math.cos(a),y+HEX*0.44*Math.sin(a))}
        ctx.closePath();ctx.strokeStyle=`rgba(0,255,136,${(0.04+(swept?0.18:0))*fade})`;ctx.lineWidth=swept?1:0.4;ctx.stroke()
        if(swept&&fade>0.25){ctx.fillStyle=`rgba(0,255,136,${0.035*fade})`;ctx.fill()}
      }
      ctx.save();ctx.translate(CX,CY)
      for(let i=0;i<40;i++){const a=angle-0.55*(i/40);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,a-0.018,a,false);ctx.closePath();ctx.fillStyle=`rgba(0,255,136,${(1-i/40)*0.08})`;ctx.fill()}
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(angle)*R,Math.sin(angle)*R)
      ctx.strokeStyle='rgba(0,255,136,0.6)';ctx.lineWidth=1.5;ctx.shadowColor='#00ff88';ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0
      ;[0.28,0.52,0.76,1].forEach(f=>{ctx.beginPath();ctx.arc(0,0,R*f,0,Math.PI*2);ctx.strokeStyle='rgba(0,255,136,0.045)';ctx.lineWidth=0.5;ctx.stroke()})
      ctx.restore()
      nodes.forEach(n=>{
        n.x+=n.vx;n.y+=n.vy;n.pulse+=0.04
        if(n.x<0)n.x=W;if(n.x>W)n.x=0;if(n.y<0)n.y=H;if(n.y>H)n.y=0
        const dx2=n.x-CX,dy2=n.y-CY
        if(Math.sqrt(dx2*dx2+dy2*dy2)>R)return
        const na2=Math.atan2(dy2,dx2)
        let da2=((na2-angle+Math.PI*3)%(Math.PI*2))-Math.PI
        const lit=da2<0&&da2>-1.1
        const col=COLS[n.type],pulse=Math.sin(n.pulse)*0.5+0.5
        if(lit){ctx.beginPath();ctx.arc(n.x,n.y,n.r+12+pulse*8,0,Math.PI*2);ctx.strokeStyle=`rgba(${col},${0.2*pulse})`;ctx.lineWidth=1;ctx.stroke()}
        ctx.beginPath();ctx.arc(n.x,n.y,n.r+pulse,0,Math.PI*2)
        ctx.fillStyle=`rgba(${col},${lit?0.9:0.22})`;ctx.shadowColor=`rgba(${col},0.8)`;ctx.shadowBlur=lit?12:3;ctx.fill();ctx.shadowBlur=0
        if(lit){ctx.font='9px JetBrains Mono,monospace';ctx.fillStyle=`rgba(${col},0.7)`;ctx.fillText(n.type.toUpperCase(),n.x+n.r+6,n.y+3)}
      })
      nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{const dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(0,255,136,${0.05*(1-d/140)})`;ctx.lineWidth=0.4;ctx.stroke()}}))
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.85)
      vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(3,4,8,0.75)')
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H)
      frame=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',onResize)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1}}/>
}

function LiveTerminal() {
  const [lineIdx,setLineIdx]=useState(0)
  const [text,setText]=useState('')
  const [charIdx,setCharIdx]=useState(0)
  const [done,setDone]=useState<string[]>([])
  useEffect(()=>{
    const line=LIVE_LINES[lineIdx]
    if(charIdx<line.length){const t=setTimeout(()=>{setText(p=>p+line[charIdx]);setCharIdx(c=>c+1)},22);return()=>clearTimeout(t)}
    else{const t=setTimeout(()=>{setDone(p=>[...p.slice(-6),line]);setText('');setCharIdx(0);setLineIdx(i=>(i+1)%LIVE_LINES.length)},1000);return()=>clearTimeout(t)}
  },[charIdx,lineIdx])
  const lc=(l:string)=>l.includes('✅')||l.includes('🎉')?'#00ff88':l.includes('🚨')?'#ff4466':l.includes('🔧')||l.includes('🔄')?'#ff9500':'rgba(255,255,255,0.4)'
  return(
    <div style={{background:'#060810',border:'1px solid rgba(0,255,136,0.12)',borderRadius:18,overflow:'hidden',boxShadow:'0 40px 120px rgba(0,0,0,0.9),0 0 60px rgba(0,255,136,0.04)',position:'relative'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.5),transparent)',animation:'scanSlide 4s ease infinite'}}/>
      <div style={{background:'#0c0f1a',padding:'12px 18px',display:'flex',alignItems:'center',gap:7,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        {['#ff5f56','#ffbd2e','#27c93f'].map((bg,i)=><div key={i} style={{width:11,height:11,borderRadius:'50%',background:bg}}/>)}
        <span style={{marginLeft:10,fontSize:12,color:'rgba(255,255,255,0.16)',fontFamily:"'JetBrains Mono',monospace"}}>cyber-sentry — agent output [live]</span>
        <div style={{marginLeft:'auto',width:7,height:7,borderRadius:'50%',background:'#00ff88',animation:'blink 1.5s ease infinite',boxShadow:'0 0 8px #00ff88'}}/>
      </div>
      <div style={{padding:'18px 22px',minHeight:150,display:'flex',flexDirection:'column',gap:4}}>
        {done.map((l,i)=><div key={i} style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",color:lc(l),opacity:0.35,padding:'2px 0',lineHeight:1.55}}>{l}</div>)}
        <div style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",color:lc(LIVE_LINES[lineIdx]),padding:'2px 0',lineHeight:1.55}}>
          {text}<span style={{display:'inline-block',width:8,height:14,background:'#00ff88',verticalAlign:'middle',marginLeft:2,animation:'blink 1s ease infinite'}}/>
        </div>
      </div>
    </div>
  )
}

function Glitch({text}:{text:string}){
  const[g,setG]=useState(false)
  useEffect(()=>{const fire=()=>{setG(true);setTimeout(()=>setG(false),160);setTimeout(fire,3500+Math.random()*3500)};const id=setTimeout(fire,2500);return()=>clearTimeout(id)},[])
  return(<span style={{position:'relative',display:'inline-block'}}>{text}{g&&<><span style={{position:'absolute',inset:0,color:'#ff4466',clipPath:'inset(20% 0 55% 0)',transform:'translate(-4px)',mixBlendMode:'screen'}}>{text}</span><span style={{position:'absolute',inset:0,color:'#00aaff',clipPath:'inset(55% 0 15% 0)',transform:'translate(4px)',mixBlendMode:'screen'}}>{text}</span></>}</span>)
}

function LiveCounter(){const[n,setN]=useState(12847);useEffect(()=>{const id=setInterval(()=>setN(c=>c+Math.floor(Math.random()*3)),2000);return()=>clearInterval(id)},[]);return<span>{n.toLocaleString()}</span>}

function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const ref=useRef<HTMLDivElement>(null);const[v,setV]=useState(false)
  useEffect(()=>{const el=ref.current;if(!el)return;const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);obs.disconnect()}},{threshold:0.12});obs.observe(el);return()=>obs.disconnect()},[])
  return<div ref={ref} style={{opacity:v?1:0,transform:v?'translateY(0)':'translateY(28px)',transition:`opacity 0.7s ease ${delay}s,transform 0.7s ease ${delay}s`}}>{children}</div>
}

export default function Home() {
  const router=useRouter()
  const[showIntro,setShowIntro]=useState(true)
  const[visible,setVisible]=useState(false)
  const handleIntroDone=()=>{setShowIntro(false);setTimeout(()=>setVisible(true),100)}

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#030408;color:white;font-family:'Outfit',sans-serif;overflow-x:hidden;scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#050508;}::-webkit-scrollbar-thumb{background:#1a2a1a;border-radius:3px;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{box-shadow:0 0 14px rgba(0,255,136,0.18)}50%{box-shadow:0 0 48px rgba(0,255,136,0.55),0 0 90px rgba(0,255,136,0.08)}}
        @keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(0,255,136,0.14)}50%{border-color:rgba(0,255,136,0.45)}}
        @keyframes scanSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:16px 52px;background:rgba(3,4,8,0.75);backdrop-filter:blur(28px);border-bottom:1px solid rgba(0,255,136,0.06);}
        .nlogo{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .nico{width:36px;height:36px;border-radius:10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;animation:glow 4s ease infinite;}
        .nbadge{font-size:10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.22);color:#00ff88;padding:2px 9px;border-radius:20px;font-weight:700;letter-spacing:0.06em;font-family:'JetBrains Mono',monospace;}
        .nlink{color:rgba(255,255,255,0.35);background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s;font-family:'Outfit',sans-serif;}
        .nlink:hover{color:white;background:rgba(255,255,255,0.05);}
        .nstart{background:#00ff88;color:#000;border:none;padding:10px 22px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;box-shadow:0 4px 20px rgba(0,255,136,0.3);}
        .nstart:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,255,136,0.45);}
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
        .btn-p:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(0,255,136,0.5);}
        .btn-o{background:transparent;color:white;border:1px solid rgba(255,255,255,0.13);padding:15px 28px;border-radius:14px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;display:inline-flex;align-items:center;gap:8px;}
        .btn-o:hover{border-color:rgba(0,255,136,0.45);background:rgba(0,255,136,0.05);transform:translateY(-3px);}
        .stats{position:relative;z-index:10;padding:44px 52px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1000px;margin:0 auto;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);}
        .stat{text-align:center;padding:16px;border-radius:16px;background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.05);transition:all 0.3s;}
        .stat:hover{border-color:rgba(0,255,136,0.22);background:rgba(0,255,136,0.03);transform:translateY(-3px);}
        .sn{font-size:32px;font-weight:900;color:#00ff88;letter-spacing:-0.03em;margin-bottom:4px;}
        .sl{font-size:12px;color:rgba(255,255,255,0.26);font-family:'JetBrains Mono',monospace;}
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
        .cta-wrap{position:relative;z-index:10;text-align:center;padding:96px 52px;}
        .cta-box{max-width:680px;margin:0 auto;background:rgba(0,255,136,0.018);border:1px solid rgba(0,255,136,0.1);border-radius:32px;padding:76px 56px;position:relative;overflow:hidden;animation:borderGlow 4s ease infinite;}
        .cta-box::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.055),transparent 70%);}
        .cta-title{font-size:clamp(26px,3.8vw,44px);font-weight:900;letter-spacing:-0.03em;margin-bottom:14px;}
        .cta-sub{font-size:16px;color:rgba(255,255,255,0.32);margin-bottom:38px;line-height:1.7;font-family:'JetBrains Mono',monospace;}
        footer{position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);padding:28px 52px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:rgba(255,255,255,0.15);font-family:'JetBrains Mono',monospace;}
        .fbrand{color:#00ff88;font-weight:700;}
        @media(max-width:768px){nav{padding:14px 20px;}.section{padding:60px 20px;}.stats{grid-template-columns:repeat(2,1fr);padding:32px 20px;}.cta-box{padding:44px 24px;}footer{flex-direction:column;gap:8px;text-align:center;}}
      `}</style>

      {showIntro&&<CinematicIntro onDone={handleIntroDone}/>}

      {!showIntro&&(
        <>
          <HeroBG/>
          <nav style={{opacity:visible?1:0,transition:'opacity 0.9s ease'}}>
            <div className="nlogo" onClick={()=>router.push('/')}>
              <div className="nico">🛡</div>
              <span style={{fontSize:17,fontWeight:900,letterSpacing:'-0.02em'}}>Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
              <span className="nbadge">AI</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button className="nlink" onClick={()=>router.push('/login')}>Login</button>
              <button className="nstart" onClick={()=>router.push('/login')}>Start Free →</button>
            </div>
          </nav>
          <div className="ticker" style={{opacity:visible?1:0,transition:'opacity 0.9s ease 0.3s'}}>
            <div className="ttrack">
              {[...Array(2)].map((_,rep)=>(
                <span key={rep} style={{display:'contents'}}>
                  {[{dot:'#00ff88',txt:'Vulnerabilities today: ',val:<LiveCounter/>},{dot:'#ff9500',txt:'Agent status: ',val:<span style={{color:'#ff9500'}}>ONLINE</span>},{dot:'#4488ff',txt:'OWASP coverage: ',val:<span style={{color:'#4488ff'}}>100%</span>},{dot:'#ff4466',txt:'Critical blocked: ',val:<span style={{color:'#ff4466'}}>2,341</span>},{dot:'#00ff88',txt:'Avg scan time: ',val:<span style={{color:'#00ff88'}}>&lt;4.2s</span>},{dot:'#ffc800',txt:'Languages: ',val:<span style={{color:'#ffc800'}}>9</span>}].map((item,i)=>(
                    <div key={`${rep}-${i}`} className="titem">
                      <div className="tdot" style={{background:item.dot}}/>
                      <span>{item.txt}<span style={{fontWeight:700,color:'white'}}>{item.val}</span></span>
                      <span style={{opacity:0.18,marginLeft:18}}>◆</span>
                    </div>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <div style={{opacity:visible?1:0,transition:'opacity 1s ease 0.2s'}}>
            <div className="hero">
              <div className="eyebrow"><div className="pdot"/><span style={{fontSize:12,color:'#00ff88',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>Agentic AI · Chain-of-Thought · OWASP Top 10</span></div>
              <h1>Your Code's<br/><span className="grad"><Glitch text="AI Security Guard"/></span></h1>
              <p className="hsub">An autonomous agent that thinks like a<br/>senior security engineer — in real time.</p>
              <div className="ctas">
                <button className="btn-p" onClick={()=>router.push('/login')}>🛡 Scan My Code Free</button>
                <button className="btn-o" onClick={()=>router.push('/scan')}>👁 Live Demo</button>
              </div>
              <div style={{width:'100%',maxWidth:700}}><LiveTerminal/></div>
            </div>
            <Reveal>
              <div className="stats">
                {[{n:'OWASP',l:'Top 10 Covered'},{n:'3-Step',l:'Agentic Loop'},{n:'4→96',l:'Score Delta'},{n:'<5s',l:'Scan Speed'}].map((s,i)=>(
                  <div className="stat" key={i}><div className="sn">{s.n}</div><div className="sl">{s.l}</div></div>
                ))}
              </div>
            </Reveal>
            <div className="section">
              <Reveal><p className="sec-tag">The Agent Loop</p></Reveal>
              <Reveal delay={0.1}><h2 className="sec-title">How CyberSentry <Glitch text="Thinks"/></h2></Reveal>
              <Reveal delay={0.15}><p className="sec-sub">Watch AI reason through every vulnerability — not just detect, but explain and patch</p></Reveal>
              <div className="cards">
                {[{i:'🔍',t:'Analyze & Reason',d:'Scans full codebase, builds vulnerability map via chain-of-thought — every decision visible in real time.'},{i:'⚡',t:'Generate Patches',d:'Writes production-ready secure code with parameterized queries, env variables, path validation, explaining each change.'},{i:'🔒',t:'Verify & Score',d:'Re-scans patched code to confirm all fixes, issues an industry-standard CVSS security score.'}].map((c,i)=>(
                  <Reveal key={i} delay={i*0.12}><div className="card"><div className="cico">{c.i}</div><div className="ctit">{c.t}</div><div className="cdesc">{c.d}</div></div></Reveal>
                ))}
              </div>
            </div>
            <div className="section" style={{background:'rgba(255,255,255,0.007)',borderTop:'1px solid rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <Reveal><p className="sec-tag">Detection Coverage</p></Reveal>
              <Reveal delay={0.1}><h2 className="sec-title">What We Find</h2></Reveal>
              <Reveal delay={0.2}>
                <div className="vwrap">
                  {[{n:'SQL Injection',s:'c'},{n:'XSS',s:'h'},{n:'Path Traversal',s:'h'},{n:'Hardcoded Secrets',s:'h'},{n:'Command Injection',s:'c'},{n:'CSRF',s:'m'},{n:'Broken Auth',s:'c'},{n:'Insecure Deserialization',s:'h'},{n:'Security Misconfiguration',s:'m'},{n:'Sensitive Data Exposure',s:'h'}].map((v,i)=>(<span key={i} className={`vb v${v.s}`}>{v.n}</span>))}
                </div>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="cgrid">
                  {[{s:'9.8',n:'SQL Injection',d:'Remote code execution',bg:'rgba(255,68,102,0.08)',b:'rgba(255,68,102,0.22)',c:'#ff4466'},{s:'9.0',n:'Command Injection',d:'Arbitrary code execution',bg:'rgba(255,68,102,0.06)',b:'rgba(255,68,102,0.18)',c:'#ff4466'},{s:'8.2',n:'Hardcoded Secrets',d:'Credential exposure',bg:'rgba(255,149,0,0.08)',b:'rgba(255,149,0,0.22)',c:'#ff9500'},{s:'7.5',n:'Path Traversal',d:'File system bypass',bg:'rgba(255,149,0,0.06)',b:'rgba(255,149,0,0.18)',c:'#ff9500'},{s:'6.1',n:'XSS',d:'Client-side injection',bg:'rgba(255,200,0,0.07)',b:'rgba(255,200,0,0.2)',c:'#ffc800'},{s:'5.3',n:'CSRF',d:'Cross-site forgery',bg:'rgba(68,136,255,0.07)',b:'rgba(68,136,255,0.2)',c:'#4488ff'}].map((cv,i)=>(
                    <div className="ccard" key={i}><div className="csco" style={{background:cv.bg,border:`1px solid ${cv.b}`,color:cv.c}}>{cv.s}</div><div><div className="cna">{cv.n}</div><div className="cds">{cv.d}</div></div></div>
                  ))}
                </div>
              </Reveal>
            </div>
            <div className="cta-wrap">
              <Reveal>
                <div className="cta-box">
                  <p className="sec-tag" style={{marginBottom:18}}>Get Started Free</p>
                  <h2 className="cta-title">Ready to <Glitch text="Secure"/> Your Code?</h2>
                  <p className="cta-sub">Paste code, watch the AI agent work in real-time,<br/>get production-ready patches in seconds.</p>
                  <button className="btn-p" style={{fontSize:16,padding:'16px 44px',margin:'0 auto'}} onClick={()=>router.push('/login')}>Start Scanning Free →</button>
                </div>
              </Reveal>
            </div>
            <footer><span>© 2026 <span className="fbrand">CyberSentry AI</span></span><span>Built for Hackathon · Nischay Bansal</span></footer>
          </div>
        </>
      )}
    </>
  )
}