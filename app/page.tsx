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

/* ── SPLASH MATRIX RAIN ── */
function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = window.innerWidth; c.height = window.innerHeight
    const cols = Math.floor(c.width / 18)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01アイウエカキクケコセキュリティ脆弱性SECURE{}[]</>$#@'
    const draw = () => {
      ctx.fillStyle = 'rgba(5,5,8,0.055)'; ctx.fillRect(0,0,c.width,c.height)
      drops.forEach((y,i) => {
        const bright = Math.random() > 0.95
        ctx.fillStyle = bright ? '#fff' : '#00ff88'
        ctx.font = `${bright?'bold ':''}13px monospace`
        ctx.globalAlpha = bright ? 0.8 : 0.22
        ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*18, y*18)
        ctx.globalAlpha = 1
        if (y*18 > c.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const id = setInterval(draw, 45)
    return () => clearInterval(id)
  }, [])
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
}

function SplashCounter() {
  const [n, setN] = useState(0)
  useEffect(() => {
    let v = 0
    const id = setInterval(() => {
      v += Math.ceil((100-v)/10)
      if (v>=100){setN(100);clearInterval(id)}else setN(v)
    }, 35)
    return () => clearInterval(id)
  }, [])
  return <div style={{textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:'#00ff88',marginTop:'6px'}}>{n}%</div>
}

/* ── HERO CANVAS: HEX GRID + RADAR SWEEP + THREAT NODES ── */
function HeroBG() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = window.innerWidth, H = window.innerHeight
    c.width = W; c.height = H

    const onResize = () => {
      W = c.width = window.innerWidth
      H = c.height = window.innerHeight
      initNodes()
    }
    window.addEventListener('resize', onResize)

    const HEX = 38
    const HW = HEX * Math.sqrt(3)

    function hexPath(x:number, y:number, size:number) {
      ctx.beginPath()
      for (let i=0;i<6;i++){
        const a = Math.PI/3*i - Math.PI/6
        i===0 ? ctx.moveTo(x+size*Math.cos(a), y+size*Math.sin(a))
              : ctx.lineTo(x+size*Math.cos(a), y+size*Math.sin(a))
      }
      ctx.closePath()
    }

    type Node = {x:number;y:number;vx:number;vy:number;r:number;type:string;pulse:number}
    const TYPES = ['critical','high','medium','info']
    const COLS: Record<string,string> = {critical:'255,68,102',high:'255,149,0',medium:'255,200,0',info:'68,136,255'}
    let nodes: Node[] = []

    function initNodes() {
      nodes = Array.from({length:16}, () => ({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-.5)*0.35, vy: (Math.random()-.5)*0.35,
        r: Math.random()*2.5+1.5,
        type: TYPES[Math.floor(Math.random()*TYPES.length)],
        pulse: Math.random()*Math.PI*2,
      }))
    }
    initNodes()

    let t = 0, frame: number
    const CX = () => W/2, CY = () => H*0.44

    function draw() {
      ctx.clearRect(0,0,W,H)
      t++
      const angle = t * 0.008

      /* HEX GRID */
      const cols2 = Math.ceil(W/HW)+2, rows2 = Math.ceil(H/HEX)+2
      for (let row=-1;row<rows2;row++) {
        for (let col=-1;col<cols2;col++) {
          const x = col*HW + (row%2)*HW/2
          const y = row*HEX*1.5
          const dx=x-CX(), dy=y-CY()
          const dist = Math.sqrt(dx*dx+dy*dy)
          const fade = Math.max(0, 1-dist/(Math.max(W,H)*0.65))
          const na = Math.atan2(dy,dx)
          let da = ((na-angle+Math.PI*3)%(Math.PI*2))-Math.PI
          const swept = da<0 && da>-0.25
          hexPath(x,y,HEX*0.44)
          ctx.strokeStyle = `rgba(0,255,136,${(0.04+(swept?0.22:0))*fade})`
          ctx.lineWidth = swept ? 1.2 : 0.5
          ctx.stroke()
          if (swept && fade>0.25) {
            ctx.fillStyle = `rgba(0,255,136,${0.04*fade})`
            ctx.fill()
          }
        }
      }

      /* RADAR SWEEP */
      const R = Math.min(W,H)*0.52
      ctx.save(); ctx.translate(CX(),CY())
      for (let i=0;i<35;i++) {
        const a = angle - 0.55*(i/35)
        ctx.beginPath(); ctx.moveTo(0,0)
        ctx.arc(0,0,R,a-0.018,a,false); ctx.closePath()
        ctx.fillStyle = `rgba(0,255,136,${(1-i/35)*0.1})`
        ctx.fill()
      }
      ctx.beginPath(); ctx.moveTo(0,0)
      ctx.lineTo(Math.cos(angle)*R, Math.sin(angle)*R)
      ctx.strokeStyle='rgba(0,255,136,0.65)'; ctx.lineWidth=1.5
      ctx.shadowColor='#00ff88'; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0
      ;[0.28,0.52,0.76,1].forEach(f=>{
        ctx.beginPath(); ctx.arc(0,0,R*f,0,Math.PI*2)
        ctx.strokeStyle='rgba(0,255,136,0.05)'; ctx.lineWidth=0.5; ctx.stroke()
      })
      ctx.restore()

      /* THREAT NODES */
      nodes.forEach(n=>{
        n.x+=n.vx; n.y+=n.vy; n.pulse+=0.04
        if(n.x<0)n.x=W; if(n.x>W)n.x=0
        if(n.y<0)n.y=H; if(n.y>H)n.y=0
        const dx2=n.x-CX(), dy2=n.y-CY()
        if(Math.sqrt(dx2*dx2+dy2*dy2)>R) return
        const na2=Math.atan2(dy2,dx2)
        let da2=((na2-angle+Math.PI*3)%(Math.PI*2))-Math.PI
        const lit=da2<0&&da2>-1.0
        const col=COLS[n.type]
        const pulse=Math.sin(n.pulse)*0.5+0.5
        if(lit){
          ctx.beginPath(); ctx.arc(n.x,n.y,n.r+10+pulse*8,0,Math.PI*2)
          ctx.strokeStyle=`rgba(${col},${0.25*pulse})`; ctx.lineWidth=1; ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r+pulse,0,Math.PI*2)
        ctx.fillStyle=`rgba(${col},${lit?0.9:0.28})`
        ctx.shadowColor=`rgba(${col},0.8)`; ctx.shadowBlur=lit?14:3; ctx.fill(); ctx.shadowBlur=0
        if(lit){
          ctx.font='10px JetBrains Mono,monospace'
          ctx.fillStyle=`rgba(${col},0.75)`
          ctx.fillText(n.type.toUpperCase(),n.x+n.r+7,n.y+3)
        }
      })

      /* NODE CONNECTIONS */
      nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{
        const dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<160){
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)
          ctx.strokeStyle=`rgba(0,255,136,${0.06*(1-d/160)})`;ctx.lineWidth=0.5;ctx.stroke()
        }
      }))

      /* VIGNETTE */
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.82)
      vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(3,4,8,0.72)')
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H)

      frame = requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',onResize)}
  }, [])
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1}}/>
}

/* ── GLITCH TEXT ── */
function GlitchText({text}:{text:string}) {
  const [g, setG] = useState(false)
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
function LiveCounter() {
  const [n,setN]=useState(12847)
  useEffect(()=>{const id=setInterval(()=>setN(c=>c+Math.floor(Math.random()*3)),2000);return()=>clearInterval(id)},[])
  return <span>{n.toLocaleString()}</span>
}

/* ── SCROLL REVEAL ── */
function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}) {
  const ref=useRef<HTMLDivElement>(null)
  const [v,setV]=useState(false)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);obs.disconnect()}},{threshold:0.12})
    obs.observe(el);return()=>obs.disconnect()
  },[])
  return <div ref={ref} style={{opacity:v?1:0,transform:v?'translateY(0)':'translateY(28px)',transition:`opacity 0.7s ease ${delay}s,transform 0.7s ease ${delay}s`}}>{children}</div>
}

/* ── MAIN ── */
export default function Home() {
  const router=useRouter()
  const [splash,setSplash]=useState(true)
  const [splashFade,setSplashFade]=useState(false)
  const [visible,setVisible]=useState(false)
  const [lineIdx,setLineIdx]=useState(0)
  const [text,setText]=useState('')
  const [charIdx,setCharIdx]=useState(0)
  const [completedLines,setCompletedLines]=useState<string[]>([])

  useEffect(()=>{
    const t1=setTimeout(()=>setSplashFade(true),2200)
    const t2=setTimeout(()=>{setSplash(false);setVisible(true)},3000)
    return()=>{clearTimeout(t1);clearTimeout(t2)}
  },[])

  useEffect(()=>{
    if(splash)return
    const line=TYPING[lineIdx]
    if(charIdx<line.length){
      const t=setTimeout(()=>{setText(p=>p+line[charIdx]);setCharIdx(c=>c+1)},26)
      return()=>clearTimeout(t)
    }else{
      const t=setTimeout(()=>{setCompletedLines(p=>[...p.slice(-5),line]);setText('');setCharIdx(0);setLineIdx(i=>(i+1)%TYPING.length)},900)
      return()=>clearTimeout(t)
    }
  },[charIdx,lineIdx,splash])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#030408;color:white;font-family:'Syne',sans-serif;overflow-x:hidden;scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#050508;}::-webkit-scrollbar-thumb{background:#1a2a1a;border-radius:3px;}

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

        .splash{position:fixed;inset:0;z-index:9999;background:#030408;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:opacity 0.8s ease;}
        .splash.fade{opacity:0;pointer-events:none;}
        .sc{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:20px;}
        .sring{width:110px;height:110px;border-radius:50%;border:2px solid transparent;background:linear-gradient(#030408,#030408) padding-box,linear-gradient(135deg,#00ff88,#00ccff,#ff4466,#00ff88) border-box;display:flex;align-items:center;justify-content:center;position:relative;animation:ringPop 0.9s cubic-bezier(0.34,1.56,0.64,1) both;box-shadow:0 0 80px rgba(0,255,136,0.12);}
        .sring::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(0,255,136,0.18);animation:ringPulse 2s ease infinite;}
        .sring::after{content:'';position:absolute;inset:-18px;border-radius:50%;border:1px solid rgba(0,255,136,0.07);animation:ringPulse 2s ease 0.5s infinite;}
        .sicon{font-size:44px;filter:drop-shadow(0 0 22px rgba(0,255,136,0.8));}
        .sname{font-size:30px;font-weight:800;letter-spacing:-0.03em;animation:fadeUp 0.5s ease 0.5s both;}
        .stag2{font-size:11px;color:rgba(255,255,255,0.22);letter-spacing:0.22em;text-transform:uppercase;font-weight:600;animation:fadeUp 0.5s ease 0.7s both;}
        .sbar{width:180px;animation:fadeUp 0.5s ease 0.9s both;}
        .strack{height:2px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;}
        .sfill{height:100%;background:linear-gradient(90deg,#00ff88,#00ccff);border-radius:2px;animation:loadBar 2s cubic-bezier(0.4,0,0.2,1) forwards;box-shadow:0 0 10px rgba(0,255,136,0.6);}

        .page{opacity:0;transition:opacity 1s ease;}
        .page.show{opacity:1;}

        nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:18px 52px;background:rgba(3,4,8,0.72);backdrop-filter:blur(28px);border-bottom:1px solid rgba(0,255,136,0.06);}
        .nlogo{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .nicon{width:36px;height:36px;border-radius:10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;animation:glow 4s ease infinite;}
        .nbadge{font-size:10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.22);color:#00ff88;padding:2px 9px;border-radius:20px;font-weight:700;letter-spacing:0.06em;}
        .nright{display:flex;align-items:center;gap:8px;}
        .nlink{color:rgba(255,255,255,0.35);background:none;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s;font-family:'Syne',sans-serif;}
        .nlink:hover{color:white;background:rgba(255,255,255,0.05);}
        .btn-g{background:#00ff88;color:#000;border:none;padding:10px 22px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;transition:all 0.25s;font-family:'Syne',sans-serif;box-shadow:0 4px 20px rgba(0,255,136,0.3);}
        .btn-g:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,255,136,0.45);background:#11ffaa;}

        .ticker{position:relative;z-index:10;background:rgba(0,255,136,0.025);border-bottom:1px solid rgba(0,255,136,0.07);padding:9px 0;overflow:hidden;margin-top:72px;}
        .ttrack{display:flex;width:max-content;animation:ticker 24s linear infinite;}
        .titem{display:flex;align-items:center;gap:8px;padding:0 40px;font-size:12px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.26);white-space:nowrap;}
        .tdot{width:5px;height:5px;border-radius:50%;}

        .hero{position:relative;z-index:10;min-height:calc(100vh - 114px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:50px 24px 40px;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.16);border-radius:100px;padding:7px 20px;margin-bottom:28px;animation:borderGlow 4s ease infinite,fadeUp 0.7s ease 0.15s both;}
        .pdot{width:7px;height:7px;border-radius:50%;background:#00ff88;animation:blink 1.8s ease infinite;}
        h1{font-size:clamp(46px,8.5vw,90px);font-weight:800;line-height:1.02;letter-spacing:-0.035em;margin-bottom:22px;animation:fadeUp 0.7s ease 0.25s both;}
        .grad{background:linear-gradient(100deg,#00ff88 0%,#00ddff 45%,#00ff88 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
        .hsub{font-size:clamp(14px,1.8vw,18px);color:rgba(255,255,255,0.38);max-width:520px;line-height:1.85;margin-bottom:38px;animation:fadeUp 0.7s ease 0.35s both;font-family:'JetBrains Mono',monospace;}
        .cta-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:48px;animation:fadeUp 0.7s ease 0.45s both;}
        .btn-p{background:#00ff88;color:#000;border:none;padding:15px 36px;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Syne',sans-serif;box-shadow:0 4px 28px rgba(0,255,136,0.32);display:inline-flex;align-items:center;gap:8px;}
        .btn-p:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(0,255,136,0.5);background:#11ffaa;}
        .btn-o{background:transparent;color:white;border:1px solid rgba(255,255,255,0.13);padding:15px 28px;border-radius:14px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Syne',sans-serif;display:inline-flex;align-items:center;gap:8px;}
        .btn-o:hover{border-color:rgba(0,255,136,0.45);background:rgba(0,255,136,0.05);transform:translateY(-3px);}

        .twrap{width:100%;max-width:680px;animation:fadeUp 0.7s ease 0.55s both;}
        .terminal{background:#060810;border:1px solid rgba(0,255,136,0.12);border-radius:18px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.9),0 0 60px rgba(0,255,136,0.04);position:relative;}
        .terminal::before{content:'';position:absolute;left:0;right:0;height:1px;top:0;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.5),transparent);animation:scanLine 5s ease infinite;}
        .tbar2{background:#0c0f1a;padding:13px 18px;display:flex;align-items:center;gap:7px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .dot{width:11px;height:11px;border-radius:50%;}
        .dr{background:#ff5f56;}.dy{background:#ffbd2e;}.dg{background:#27c93f;}
        .ttitle{margin-left:10px;font-size:12px;color:rgba(255,255,255,0.16);font-family:'JetBrains Mono',monospace;}
        .tbody2{padding:18px 22px;min-height:140px;display:flex;flex-direction:column;gap:4px;}
        .tline{font-size:13px;font-family:'JetBrains Mono',monospace;padding:2px 0;line-height:1.55;}
        .tdone{opacity:0.35;}.tok{color:#00ff88;opacity:1;}.terr{color:#ff4466;opacity:1;}.twarn{color:#ff9500;opacity:1;}
        .cursor{display:inline-block;width:8px;height:14px;background:#00ff88;vertical-align:middle;margin-left:2px;animation:blink 1s ease infinite;}

        .stats{position:relative;z-index:10;padding:44px 52px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1000px;margin:0 auto;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);}
        .stat{text-align:center;padding:16px;border-radius:16px;background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.05);transition:all 0.3s;}
        .stat:hover{border-color:rgba(0,255,136,0.22);background:rgba(0,255,136,0.03);transform:translateY(-3px);}
        .sn{font-size:32px;font-weight:800;color:#00ff88;letter-spacing:-0.03em;margin-bottom:4px;}
        .sl{font-size:12px;color:rgba(255,255,255,0.26);font-family:'JetBrains Mono',monospace;}

        .section{position:relative;z-index:10;padding:96px 52px;text-align:center;}
        .sec-tag{font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#00ff88;margin-bottom:14px;font-family:'JetBrains Mono',monospace;}
        .sec-title{font-size:clamp(28px,4vw,50px);font-weight:800;letter-spacing:-0.025em;margin-bottom:14px;line-height:1.1;}
        .sec-sub{font-size:16px;color:rgba(255,255,255,0.34);max-width:500px;line-height:1.78;margin:0 auto 52px;font-family:'JetBrains Mono',monospace;}

        .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1080px;margin:0 auto;}
        .card{background:rgba(255,255,255,0.014);border:1px solid rgba(255,255,255,0.06);border-radius:22px;padding:32px;transition:all 0.4s;cursor:default;position:relative;overflow:hidden;}
        .card::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top left,rgba(0,255,136,0.07),transparent 55%);opacity:0;transition:opacity 0.4s;}
        .card:hover{border-color:rgba(0,255,136,0.3);transform:translateY(-10px);box-shadow:0 32px 80px rgba(0,0,0,0.6),0 0 60px rgba(0,255,136,0.05);}
        .card:hover::after{opacity:1;}
        .cico{width:52px;height:52px;border-radius:14px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.16);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px;transition:all 0.35s;}
        .card:hover .cico{background:rgba(0,255,136,0.14);transform:scale(1.12) rotate(6deg);}
        .cnum{font-size:56px;font-weight:800;color:rgba(255,255,255,0.024);float:right;line-height:1;letter-spacing:-0.04em;}
        .ctit{font-size:18px;font-weight:700;margin-bottom:10px;}
        .cdesc{font-size:13px;color:rgba(255,255,255,0.33);line-height:1.78;font-family:'JetBrains Mono',monospace;}

        .vwrap{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:860px;margin:0 auto 52px;}
        .vb{padding:9px 18px;border-radius:100px;font-size:12px;font-weight:700;cursor:default;transition:all 0.25s;border-width:1px;border-style:solid;font-family:'JetBrains Mono',monospace;}
        .vb:hover{transform:translateY(-5px) scale(1.06);}
        .vc{background:rgba(255,68,102,0.07);border-color:rgba(255,68,102,0.25);color:#ff4466;}
        .vh{background:rgba(255,149,0,0.07);border-color:rgba(255,149,0,0.25);color:#ff9500;}
        .vm{background:rgba(255,200,0,0.07);border-color:rgba(255,200,0,0.25);color:#ffc800;}

        .cgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;max-width:940px;margin:0 auto;}
        .ccard{background:rgba(255,255,255,0.016);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;transition:all 0.3s;}
        .ccard:hover{transform:translateY(-5px);border-color:rgba(0,255,136,0.2);box-shadow:0 16px 48px rgba(0,0,0,0.4);}
        .csco{min-width:50px;height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;font-family:'JetBrains Mono',monospace;}
        .cna{font-size:13px;font-weight:700;margin-bottom:3px;}
        .cds{font-size:11px;color:rgba(255,255,255,0.27);font-family:'JetBrains Mono',monospace;}

        .tech-row{display:flex;flex-wrap:wrap;justify-content:center;gap:48px;align-items:center;}
        .tech-item{color:rgba(255,255,255,0.17);font-weight:700;font-size:14px;cursor:default;transition:all 0.25s;font-family:'JetBrains Mono',monospace;}
        .tech-item:hover{color:rgba(255,255,255,0.75);transform:translateY(-2px);}

        .cta-wrap{position:relative;z-index:10;text-align:center;padding:96px 52px;}
        .cta-box{max-width:680px;margin:0 auto;background:rgba(0,255,136,0.018);border:1px solid rgba(0,255,136,0.1);border-radius:32px;padding:76px 56px;position:relative;overflow:hidden;animation:borderGlow 4s ease infinite;}
        .cta-box::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.055),transparent 70%);}
        .cta-title{font-size:clamp(26px,3.8vw,42px);font-weight:800;letter-spacing:-0.025em;margin-bottom:14px;}
        .cta-sub{font-size:16px;color:rgba(255,255,255,0.33);margin-bottom:38px;line-height:1.7;font-family:'JetBrains Mono',monospace;}

        footer{position:relative;z-index:10;border-top:1px solid rgba(255,255,255,0.05);padding:28px 52px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:rgba(255,255,255,0.15);font-family:'JetBrains Mono',monospace;}
        .fbrand{color:#00ff88;font-weight:700;}

        @media(max-width:768px){
          nav{padding:14px 20px;}.section{padding:60px 20px;}.stats{grid-template-columns:repeat(2,1fr);padding:32px 20px;}.cta-box{padding:44px 24px;}footer{flex-direction:column;gap:8px;text-align:center;}
        }
      `}</style>

      {/* SPLASH */}
      {splash && (
        <div className={`splash${splashFade?' fade':''}`}>
          <MatrixRain/>
          <div className="sc">
            <div className="sring"><span className="sicon">🛡</span></div>
            <div className="sname">Cyber<span style={{color:'#00ff88'}}>Sentry</span>
              <span style={{fontSize:'13px',marginLeft:'10px',background:'rgba(0,255,136,0.1)',color:'#00ff88',padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(0,255,136,0.28)',fontWeight:700,verticalAlign:'middle'}}>AI</span>
            </div>
            <div className="stag2">Agentic Security · OWASP Top 10</div>
            <div className="sbar"><div className="strack"><div className="sfill"/></div><SplashCounter/></div>
          </div>
        </div>
      )}

      {/* ANIMATED HERO BACKGROUND */}
      {!splash && <HeroBG/>}

      {/* NAV */}
      <nav style={{opacity:visible?1:0,transition:'opacity 0.9s ease'}}>
        <div className="nlogo" onClick={()=>router.push('/')}>
          <div className="nicon">🛡</div>
          <span style={{fontSize:'17px',fontWeight:800}}>Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
          <span className="nbadge">AI</span>
        </div>
        <div className="nright">
          <button className="nlink" onClick={()=>router.push('/login')}>Login</button>
          <button className="btn-g" onClick={()=>router.push('/login')}>Start Free →</button>
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
          <div className="eyebrow">
            <div className="pdot"/>
            <span style={{fontSize:'12px',color:'#00ff88',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>Agentic AI · Chain-of-Thought · OWASP Top 10</span>
          </div>
          <h1>Your Code's<br/><span className="grad"><GlitchText text="AI Security Guard"/></span></h1>
          <p className="hsub">An autonomous agent that thinks like a<br/>senior security engineer — in real time.</p>
          <div className="cta-row">
            <button className="btn-p" onClick={()=>router.push('/login')}>🛡 Scan My Code Free</button>
            <button className="btn-o" onClick={()=>router.push('/scan')}>👁 Live Demo</button>
          </div>
          <div className="twrap">
            <div className="terminal">
              <div className="tbar2">
                <div className="dot dr"/><div className="dot dy"/><div className="dot dg"/>
                <span className="ttitle">cyber-sentry — agent output [live]</span>
              </div>
              <div className="tbody2">
                {completedLines.map((l,i)=>(
                  <div key={i} className={`tline tdone ${l.includes('✅')?'tok':l.includes('🚨')?'terr':l.includes('🔧')||l.includes('🔄')?'twarn':''}`}>{l}</div>
                ))}
                <div className="tline" style={{color:'#00ff88'}}>{text}<span className="cursor"/></div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <Reveal>
          <div className="stats">
            {[{n:'OWASP',l:'Top 10 Covered'},{n:'3-Step',l:'Agentic Loop'},{n:'23→94',l:'Score Delta'},{n:'<5s',l:'Scan Speed'}].map((s,i)=>(
              <div className="stat" key={i}><div className="sn">{s.n}</div><div className="sl">{s.l}</div></div>
            ))}
          </div>
        </Reveal>

        {/* HOW IT WORKS */}
        <div className="section">
          <Reveal><p className="sec-tag">The Agent Loop</p></Reveal>
          <Reveal delay={0.1}><h2 className="sec-title">How CyberSentry <GlitchText text="Thinks"/></h2></Reveal>
          <Reveal delay={0.15}><p className="sec-sub">Watch AI reason through every vulnerability — not just detect, but explain and fix</p></Reveal>
          <div className="cards">
            {[
              {i:'🔍',n:'01',t:'Analyze & Reason',  d:'Scans full codebase, builds vulnerability map via chain-of-thought reasoning — every decision visible in real time.'},
              {i:'⚡',n:'02',t:'Generate Patches',  d:'Writes production-ready secure code with parameterized queries, env variables, path validation — explaining every change.'},
              {i:'🔒',n:'03',t:'Verify & Score',    d:'Re-scans patched code to confirm all fixes, issues an industry-standard security score showing exact improvement.'},
            ].map((c,i)=>(
              <Reveal key={i} delay={i*0.12}>
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
            <div className="vwrap">
              {[{n:'SQL Injection',s:'c'},{n:'XSS',s:'h'},{n:'Path Traversal',s:'h'},{n:'Hardcoded Secrets',s:'h'},{n:'Command Injection',s:'c'},{n:'CSRF',s:'m'},{n:'Broken Auth',s:'c'},{n:'Insecure Deserialization',s:'h'},{n:'Security Misconfiguration',s:'m'},{n:'Sensitive Data Exposure',s:'h'}].map((v,i)=>(
                <span key={i} className={`vb v${v.s}`}>{v.n}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="sec-tag" style={{marginBottom:'22px'}}>CVSS Industry Scoring</p>
            <div className="cgrid">
              {[
                {s:'9.8',n:'SQL Injection',     d:'Remote code execution',    bg:'rgba(255,68,102,0.08)',  b:'rgba(255,68,102,0.22)',c:'#ff4466'},
                {s:'9.0',n:'Command Injection', d:'Arbitrary code execution', bg:'rgba(255,68,102,0.06)',  b:'rgba(255,68,102,0.18)',c:'#ff4466'},
                {s:'8.2',n:'Hardcoded Secrets', d:'Credential exposure',      bg:'rgba(255,149,0,0.08)',   b:'rgba(255,149,0,0.22)', c:'#ff9500'},
                {s:'7.5',n:'Path Traversal',    d:'File system bypass',       bg:'rgba(255,149,0,0.06)',   b:'rgba(255,149,0,0.18)', c:'#ff9500'},
                {s:'6.1',n:'XSS',               d:'Client-side injection',    bg:'rgba(255,200,0,0.07)',   b:'rgba(255,200,0,0.2)',  c:'#ffc800'},
                {s:'5.3',n:'CSRF',              d:'Cross-site forgery',       bg:'rgba(68,136,255,0.07)',  b:'rgba(68,136,255,0.2)', c:'#4488ff'},
              ].map((c,i)=>(
                <div className="ccard" key={i}>
                  <div className="csco" style={{background:c.bg,border:`1px solid ${c.b}`,color:c.c}}>{c.s}</div>
                  <div><div className="cna">{c.n}</div><div className="cds">{c.d}</div></div>
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
              {['Next.js 14','Claude API','Supabase','TypeScript','Vercel','Tailwind CSS'].map((t,i)=>(
                <span key={i} className="tech-item">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <div className="cta-wrap">
          <Reveal>
            <div className="cta-box">
              <p className="sec-tag" style={{marginBottom:'18px'}}>Get Started Free</p>
              <h2 className="cta-title">Ready to <GlitchText text="Secure"/> Your Code?</h2>
              <p className="cta-sub">Paste code, watch the AI agent work in real-time,<br/>get production-ready patches in seconds.</p>
              <button className="btn-p" style={{fontSize:'16px',padding:'16px 44px'}} onClick={()=>router.push('/login')}>
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
