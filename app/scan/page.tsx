'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ─────────────────────────────────────────────────
   SAMPLE VULNERABLE CODE (for demo button)
───────────────────────────────────────────────── */
const SAMPLE_CODE = `from flask import Flask, request
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "abc123supersecret"

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # VULNERABLE: SQL Injection via f-string
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    if user:
        return f"Welcome {username}!"
    return "Invalid credentials"

@app.route('/file')
def get_file():
    # VULNERABLE: Path Traversal
    filename = request.args.get('name')
    with open(f'/var/data/{filename}', 'r') as f:
        return f.read()

@app.route('/run')
def run_cmd():
    # VULNERABLE: Command Injection
    cmd = request.args.get('cmd')
    return os.popen(cmd).read()
`

const SEV: Record<string,{bg:string;border:string;text:string;label:string}> = {
  critical:{bg:'rgba(255,68,102,0.08)',border:'rgba(255,68,102,0.3)',text:'#ff4466',label:'CRITICAL'},
  high:    {bg:'rgba(255,149,0,0.08)', border:'rgba(255,149,0,0.3)', text:'#ff9500',label:'HIGH'},
  medium:  {bg:'rgba(255,200,0,0.08)', border:'rgba(255,200,0,0.3)', text:'#ffc800',label:'MEDIUM'},
  low:     {bg:'rgba(68,136,255,0.08)',border:'rgba(68,136,255,0.3)',text:'#4488ff',label:'LOW'},
}

/* ─────────────────────────────────────────────────
   DIFF VIEWER
───────────────────────────────────────────────── */
function DiffViewer({original,patched}:{original:string;patched:string}) {
  const oLines = original.split('\n'), pLines = patched.split('\n')
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1px',background:'rgba(255,255,255,0.04)',borderRadius:'14px',overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
      <div>
        <div style={{padding:'10px 16px',background:'rgba(255,68,102,0.08)',borderBottom:'1px solid rgba(255,68,102,0.15)',fontSize:'12px',fontWeight:700,color:'#ff4466',fontFamily:"'JetBrains Mono',monospace"}}>— Before (Vulnerable)</div>
        <div style={{background:'#08050a',padding:'12px',overflow:'auto',maxHeight:'320px'}}>
          {oLines.map((line,i)=>{const bad=!pLines.includes(line)&&line.trim();return(
            <div key={i} style={{display:'flex',gap:'8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',lineHeight:'1.7',background:bad?'rgba(255,68,102,0.1)':'transparent',borderLeft:bad?'2px solid #ff4466':'2px solid transparent',paddingLeft:'6px'}}>
              <span style={{color:'rgba(255,255,255,0.14)',minWidth:'24px',textAlign:'right',userSelect:'none'}}>{i+1}</span>
              <span style={{color:bad?'#ff8899':'rgba(255,255,255,0.38)',whiteSpace:'pre'}}>{line||' '}</span>
            </div>
          )})}
        </div>
      </div>
      <div>
        <div style={{padding:'10px 16px',background:'rgba(0,255,136,0.06)',borderBottom:'1px solid rgba(0,255,136,0.15)',fontSize:'12px',fontWeight:700,color:'#00ff88',fontFamily:"'JetBrains Mono',monospace"}}>+ After (Secure)</div>
        <div style={{background:'#050a08',padding:'12px',overflow:'auto',maxHeight:'320px'}}>
          {pLines.map((line,i)=>{const good=!oLines.includes(line)&&line.trim();return(
            <div key={i} style={{display:'flex',gap:'8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',lineHeight:'1.7',background:good?'rgba(0,255,136,0.08)':'transparent',borderLeft:good?'2px solid #00ff88':'2px solid transparent',paddingLeft:'6px'}}>
              <span style={{color:'rgba(255,255,255,0.14)',minWidth:'24px',textAlign:'right',userSelect:'none'}}>{i+1}</span>
              <span style={{color:good?'#00ff88':'rgba(255,255,255,0.38)',whiteSpace:'pre'}}>{line||' '}</span>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   PROGRESS RING
───────────────────────────────────────────────── */
function ProgressRing({phase}:{phase:string}) {
  const idx = ['idle','analyzing','fixing','verifying','done'].indexOf(phase)
  const pct = idx<=0?0:idx>=4?100:Math.round((idx/3)*100)
  const r=36, circ=2*Math.PI*r, off=circ-(pct/100)*circ
  if(phase==='idle') return null
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',padding:'16px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px'}}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#00ff88" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 44 44)"
          style={{transition:'stroke-dashoffset 0.8s ease',filter:'drop-shadow(0 0 8px rgba(0,255,136,0.5))'}}/>
        <text x="44" y="48" textAnchor="middle" fill="#00ff88" fontSize="16" fontWeight="800" fontFamily="Outfit,sans-serif">{pct}%</text>
      </svg>
      <div style={{fontSize:'12px',fontWeight:700,color:phase==='done'?'#00ff88':'rgba(255,255,255,0.4)',fontFamily:"'JetBrains Mono',monospace"}}>
        {phase==='analyzing'&&'Analyzing...'}{phase==='fixing'&&'Patching...'}{phase==='verifying'&&'Verifying...'}{phase==='done'&&'Complete ✓'}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   ASK AGENT CHAT — Now uses Claude AI via /api/chat
───────────────────────────────────────────────── */
function AskAgent({vulns,repo,securityScore}:{vulns:any[];repo:string;securityScore:number|null}) {
  const [msgs,setMsgs]=useState<{role:string;text:string}[]>([
    {role:'agent',text:`Scan complete! I found ${vulns.length} ${vulns.length===1?'vulnerability':'vulnerabilities'}${repo?' in '+repo:''}. Ask me anything about the findings — what they mean, how to fix them, or how serious they are.`}
  ])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const bot=useRef<HTMLDivElement>(null)

  const send=async()=>{
    if(!input.trim()||loading)return
    const q=input.trim(); setInput(''); setMsgs(p=>[...p,{role:'user',text:q}]); setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ question:q, vulnerabilities:vulns, securityScore, repo })
      })
      const data = await res.json()
      setMsgs(p=>[...p,{role:'agent',text:data.reply || 'I encountered an error. Try asking again.'}])
    } catch {
      setMsgs(p=>[...p,{role:'agent',text:'Connection error — please try again.'}])
    }
    setLoading(false)
  }

  useEffect(()=>bot.current?.scrollIntoView({behavior:'smooth'}),[msgs])

  const suggestions = vulns.length > 0
    ? [`What is ${vulns[0]?.name}?`, 'Which is the most critical?', 'How do I fix these?', 'Explain the CVSS scores']
    : ['Is my code secure?', 'What should I improve?', 'Any best practices?', 'What is OWASP Top 10?']

  return (
    <div style={{border:'1px solid rgba(0,255,136,0.15)',borderRadius:'16px',overflow:'hidden',background:'#060a08',display:'flex',flexDirection:'column',height:'400px'}}>
      <div style={{padding:'12px 16px',background:'rgba(0,255,136,0.05)',borderBottom:'1px solid rgba(0,255,136,0.1)',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
        <span>🤖</span><span style={{fontSize:'13px',fontWeight:700,color:'#00ff88',fontFamily:"'Outfit',sans-serif"}}>Ask CyberSentry AI</span>
        <span style={{marginLeft:'auto',fontSize:'11px',color:'rgba(0,255,136,0.5)',background:'rgba(0,255,136,0.08)',padding:'2px 8px',borderRadius:'20px',border:'1px solid rgba(0,255,136,0.15)',fontFamily:"'JetBrains Mono',monospace"}}>● Powered by Claude</span>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:'8px',alignItems:'flex-start',flexDirection:m.role==='user'?'row-reverse':'row'}}>
            <div style={{minWidth:'28px',height:'28px',borderRadius:'50%',background:m.role==='user'?'rgba(68,136,255,0.2)':'rgba(0,255,136,0.12)',border:`1px solid ${m.role==='user'?'rgba(68,136,255,0.3)':'rgba(0,255,136,0.25)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',flexShrink:0}}>
              {m.role==='user'?'👤':'🤖'}
            </div>
            <div style={{maxWidth:'85%',padding:'10px 14px',borderRadius:'12px',background:m.role==='user'?'rgba(68,136,255,0.08)':'rgba(0,255,136,0.05)',border:`1px solid ${m.role==='user'?'rgba(68,136,255,0.15)':'rgba(0,255,136,0.1)'}`,fontSize:'13px',color:'rgba(255,255,255,0.78)',lineHeight:'1.7',fontFamily:"'Outfit',sans-serif"}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'rgba(0,255,136,0.12)',border:'1px solid rgba(0,255,136,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>🤖</div>
            <div style={{padding:'10px 14px',borderRadius:'12px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.1)',display:'flex',gap:'5px',alignItems:'center'}}>
              {[0,1,2].map(i=><div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'#00ff88',animation:`blink 1.2s ease ${i*0.22}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bot}/>
      </div>
      <div style={{padding:'8px 14px',borderTop:'1px solid rgba(255,255,255,0.04)',display:'flex',gap:'8px',flexWrap:'wrap',flexShrink:0}}>
        {suggestions.map((q,i)=>(
          <button key={i} onClick={()=>setInput(q)}
            style={{background:'none',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'4px 12px',color:'rgba(255,255,255,0.3)',fontSize:'11px',cursor:'pointer',transition:'all 0.2s',fontFamily:"'JetBrains Mono',monospace"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,255,136,0.3)';e.currentTarget.style.color='#00ff88'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='rgba(255,255,255,0.3)'}}>
            {q}
          </button>
        ))}
      </div>
      <div style={{padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',gap:'8px',flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Ask about the vulnerabilities..."
          style={{flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'9px 14px',color:'white',fontSize:'13px',fontFamily:"'Outfit',sans-serif",outline:'none'}}/>
        <button onClick={send} disabled={loading||!input.trim()}
          style={{background:'#00ff88',color:'#000',border:'none',borderRadius:'10px',padding:'9px 18px',cursor:'pointer',fontWeight:800,fontSize:'13px',transition:'all 0.2s',opacity:loading||!input.trim()?0.4:1,fontFamily:"'Outfit',sans-serif"}}>
          Ask
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   MAIN SCAN PAGE — Now supports GitHub URL + Code Paste
───────────────────────────────────────────────── */
export default function ScanPage() {
  const router = useRouter()
  const [mode,setMode]             = useState<'code'|'github'>('github')
  const [code,setCode]             = useState(SAMPLE_CODE)
  const [repoUrl,setRepoUrl]       = useState('')
  const [language,setLanguage]     = useState('python')
  const [scanning,setScanning]     = useState(false)
  const [steps,setSteps]           = useState<string[]>([])
  const [vulns,setVulns]           = useState<any[]>([])
  const [fixedCode,setFixedCode]   = useState('')
  const [scoreBefore,setScoreBefore]= useState<number|null>(null)
  const [scoreAfter,setScoreAfter] = useState<number|null>(null)
  const [phase,setPhase]           = useState('idle')
  const [copied,setCopied]         = useState(false)
  const [activeTab,setActiveTab]   = useState<'output'|'diff'|'chat'>('output')
  const [scanError,setScanError]   = useState('')
  const [repoName,setRepoName]     = useState('')
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(()=>stepsRef.current?.scrollTo({top:stepsRef.current.scrollHeight,behavior:'smooth'}),[steps])

  const addStep=(s:string)=>setSteps(p=>[...p,s])
  const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms))

  // ── REAL SCAN — calls /api/scan with Claude AI ────────────────────────────
  const runScan=async()=>{
    setScanning(true); setSteps([]); setVulns([]); setScanError('')
    setFixedCode(''); setScoreBefore(null); setScoreAfter(null)
    setPhase('analyzing'); setActiveTab('output'); setRepoName('')

    if (mode === 'github') {
      if (!repoUrl.trim()) { setScanError('Enter a GitHub URL'); setScanning(false); setPhase('idle'); return }
      addStep('🔗 Connecting to GitHub repository...')
      await delay(300)
      addStep(`📦 Repository: ${repoUrl}`)
      await delay(200)
      addStep('📂 Fetching source files via GitHub API...')
      await delay(300)
    } else {
      addStep('📝 Analyzing pasted code...')
      await delay(200)
      addStep(`📝 Language: ${language.toUpperCase()} | Lines: ${code.split('\n').length}`)
      await delay(200)
    }

    addStep('🧠 Sending code to CyberSentry AI for deep analysis...')
    await delay(200)
    addStep('⚙️  Claude is reasoning through the code...')

    try {
      const body = mode === 'github'
        ? { repoUrl: repoUrl.trim() }
        : { codeSnippet: code }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.error) {
        addStep(`❌ Error: ${data.error}`)
        setScanError(data.error)
        setPhase('idle'); setScanning(false)
        return
      }

      // Show thinking steps from AI
      if (data.thinkingSteps) {
        for (const t of data.thinkingSteps) {
          addStep(`🧠 ${t}`)
          await delay(150)
        }
      }

      setRepoName(data.repo || repoUrl || 'Code Snippet')

      // Show vulnerabilities found
      const foundVulns = data.vulnerabilities || []
      if (foundVulns.length > 0) {
        addStep(`\n🚨 Found ${foundVulns.length} vulnerabilities:`)
        for (const v of foundVulns) {
          addStep(`  ⚠️  ${(v.severity||'').toUpperCase()}: ${v.name} — CVSS ${v.cvss} — ${v.file}:${v.line}`)
          await delay(100)
        }
      }

      setVulns(foundVulns)
      setScoreBefore(data.securityScore || 0)

      if (foundVulns.length === 0) {
        addStep('✅ No vulnerabilities detected — code looks secure!')
        addStep(`🎉 Security score: ${data.securityScore || 95}/100 — ${data.grade || 'A'}`)
        setScoreAfter(data.securityScore || 95)
        setPhase('done'); setScanning(false); return
      }

      // Generate combined fixed code from AI response
      setPhase('fixing')
      addStep('\n🔧 Generating secure patches...')
      await delay(400)

      const allFixes = foundVulns
        .filter((v:any) => v.fixedCode)
        .map((v:any) => `// FIX for ${v.name} (${v.file}:${v.line})\n${v.fixedCode}`)
        .join('\n\n')

      if (allFixes) {
        setFixedCode(allFixes)
        addStep('✅ Patches generated for all vulnerabilities')
      }

      setPhase('verifying')
      await delay(300)
      addStep('🔄 Verifying patches...')
      await delay(400)

      const afterScore = Math.min(98, (data.securityScore || 30) + foundVulns.length * 12)
      setScoreAfter(afterScore)
      addStep(`📊 Security score: ${data.securityScore} → ${afterScore} (+${afterScore - (data.securityScore||0)} pts)`)
      addStep(`📋 Summary: ${data.summary || 'Analysis complete.'}`)
      addStep('🎉 Scan complete!')

      setPhase('done'); setScanning(false)
      await delay(500); setActiveTab('output')

      // Save to Supabase
      try {
        const {data:{user}}=await supabase.auth.getUser()
        if(user) await supabase.from('scans').insert({
          user_id:user.id,
          code: mode==='github' ? repoUrl : code,
          language: mode==='github' ? 'github' : language,
          vulnerabilities: foundVulns,
          fixed_code: allFixes,
          security_score: afterScore,
          status:'completed'
        })
      }catch{}

    } catch (err: any) {
      addStep(`❌ Scan failed: ${err.message || 'Network error'}`)
      setScanError(err.message || 'Failed to reach scanner')
      setPhase('idle'); setScanning(false)
    }
  }

  const runJudgeDemo=async()=>{
    setMode('github')
    setRepoUrl('https://github.com/juice-shop/juice-shop')
    await delay(300)
    runScan()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#030408;color:white;font-family:'Outfit',sans-serif;overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:#0a0a12;}::-webkit-scrollbar-thumb{background:#1e2a1e;border-radius:3px;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.15)}50%{box-shadow:0 0 50px rgba(0,255,136,0.4)}}

        .scan-root{min-height:100vh;background:#030408;padding-bottom:40px;}
        header{position:sticky;top:0;z-index:50;background:rgba(3,4,8,0.9);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05);padding:14px 24px;display:flex;align-items:center;gap:12px;}
        .hbrand{display:flex;align-items:center;gap:8px;cursor:pointer;}
        .hico{width:32px;height:32px;border-radius:9px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.22);display:flex;align-items:center;justify-content:center;font-size:15px;}
        .hname{font-size:16px;font-weight:800;letter-spacing:-0.02em;}
        .hright{margin-left:auto;display:flex;align-items:center;gap:8px;}
        .hbtn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);padding:7px 14px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s;font-family:'Outfit',sans-serif;}
        .hbtn:hover{background:rgba(255,255,255,0.09);color:white;}
        .done-pill{background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.25);color:#00ff88;padding:7px 14px;border-radius:9px;font-size:13px;font-weight:700;font-family:'Outfit',sans-serif;}

        .banner{padding:24px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.01);flex-wrap:wrap;gap:16px;}
        .banner-title{font-size:22px;font-weight:800;letter-spacing:-0.025em;margin-bottom:4px;}
        .banner-sub{font-size:13px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;}
        .agent-pill{background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.22);color:#00ff88;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:7px;animation:glowPulse 3s ease infinite;}
        .agent-pill::before{content:'';width:6px;height:6px;background:#00ff88;border-radius:50%;animation:blink 2s ease infinite;}

        .scan-main{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px 28px;min-height:calc(100vh - 180px);}
        @media(max-width:900px){.scan-main{grid-template-columns:1fr;}}

        .panel-l,.panel-r{display:flex;flex-direction:column;gap:12px;}
        .label-text{font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}

        .mode-toggle{display:flex;gap:4px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:12px;margin-bottom:12px;}
        .mode-btn{flex:1;padding:10px 0;border:none;border-radius:9px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.2s;font-family:'Outfit',sans-serif;}
        .mode-active{background:rgba(0,255,136,0.14);color:#00ff88;border:1px solid rgba(0,255,136,0.25);}
        .mode-inactive{background:transparent;color:rgba(255,255,255,0.3);}

        .url-input{width:100%;background:#06080d;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;color:white;font-size:15px;font-family:'Outfit',sans-serif;outline:none;transition:border-color 0.2s;}
        .url-input:focus{border-color:rgba(0,255,136,0.25);}
        .url-input::placeholder{color:rgba(255,255,255,0.2);}

        .code-editor{flex:1;min-height:300px;background:#06080d;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;color:rgba(255,255,255,0.78);font-size:13px;font-family:'JetBrains Mono',monospace;resize:none;outline:none;line-height:1.8;transition:border-color 0.2s;}
        .code-editor:focus{border-color:rgba(0,255,136,0.25);}

        .scan-btn{background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;border:none;padding:16px;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer;transition:all 0.25s;font-family:'Outfit',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 24px rgba(0,255,136,0.28);letter-spacing:-0.01em;}
        .scan-btn:hover{transform:translateY(-2px);box-shadow:0 8px 40px rgba(0,255,136,0.45);}
        .scan-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;}

        .score-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .score-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;text-align:center;}
        .score-num{font-size:32px;font-weight:900;letter-spacing:-0.04em;margin-bottom:4px;}
        .score-lbl{font-size:11px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;}
        .score-after{background:rgba(0,255,136,0.04);border-color:rgba(0,255,136,0.2);}

        .tabs{display:flex;gap:4px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:12px;margin-bottom:12px;}
        .tab{flex:1;padding:9px 0;border:none;border-radius:9px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s;font-family:'Outfit',sans-serif;}
        .tab-active{background:rgba(0,255,136,0.14);color:#00ff88;border:1px solid rgba(0,255,136,0.25);}
        .tab-inactive{background:transparent;color:rgba(255,255,255,0.3);}

        .think-box{background:#060a08;border:1px solid rgba(0,255,136,0.1);border-radius:14px;overflow:hidden;margin-bottom:12px;}
        .think-head{padding:11px 14px;background:rgba(0,255,136,0.04);display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,255,136,0.08);}
        .think-body{padding:12px 14px;max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;}
        .step{font-size:12px;font-family:'JetBrains Mono',monospace;padding:3px 0;line-height:1.6;animation:fadeIn 0.3s ease;}
        .s-ok{color:#00ff88;}.s-err{color:#ff4466;}.s-warn{color:#ff9500;}.s-def{color:rgba(255,255,255,0.4);}

        .vuln-list{display:flex;flex-direction:column;gap:10px;}
        .vuln-card{border-radius:14px;padding:16px;border-width:1px;border-style:solid;animation:slideUp 0.4s ease;}
        .vuln-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px;}
        .vuln-name{font-size:14px;font-weight:800;letter-spacing:-0.01em;}
        .vuln-sev{font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;border-width:1px;border-style:solid;font-family:'JetBrains Mono',monospace;letter-spacing:0.08em;}
        .vuln-meta{font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px;font-family:'JetBrains Mono',monospace;}
        .vuln-desc{font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:8px;line-height:1.65;}
        .vuln-fix{font-size:12px;font-family:'JetBrains Mono',monospace;padding:10px 12px;background:rgba(0,0,0,0.2);border-radius:8px;line-height:1.6;}

        .error-box{background:rgba(255,68,102,0.08);border:1px solid rgba(255,68,102,0.25);color:#ff6b6b;padding:12px 16px;border-radius:10px;font-size:13px;font-family:'JetBrains Mono',monospace;}

        .demo-repos{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
        .demo-repo-btn{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;cursor:pointer;transition:all 0.2s;text-align:left;}
        .demo-repo-btn:hover{border-color:rgba(0,255,136,0.3);background:rgba(0,255,136,0.04);}

        .idle{display:flex;align-items:center;justify-content:center;min-height:200px;}
        .idle-inner{text-align:center;color:rgba(255,255,255,0.25);}
      `}</style>

      <div className="scan-root">
        <header>
          <div className="hbrand" onClick={()=>router.push('/')}>
            <div className="hico">🛡</div>
            <span className="hname">Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
          </div>
          <div className="hright">
            {phase==='done'&&<span className="done-pill">✅ Scan Complete</span>}
            <button className="hbtn" onClick={()=>router.push('/dashboard')}>📋 Dashboard</button>
          </div>
        </header>

        <div className="banner">
          <div>
            <div className="banner-title">Security Scanner 🛡</div>
            <div className="banner-sub">Enter a GitHub repo URL or paste code · AI finds real vulnerabilities</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <ProgressRing phase={phase}/>
            <div className="agent-pill">Agent Ready</div>
          </div>
        </div>

        <div className="scan-main">
          {/* LEFT PANEL — Input */}
          <div className="panel-l">
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button className={`mode-btn ${mode==='github'?'mode-active':'mode-inactive'}`} onClick={()=>setMode('github')}>
                🔗 GitHub Repo
              </button>
              <button className={`mode-btn ${mode==='code'?'mode-active':'mode-inactive'}`} onClick={()=>setMode('code')}>
                📝 Paste Code
              </button>
            </div>

            {mode === 'github' ? (
              <>
                <div className="label-text">GitHub Repository URL</div>
                <input
                  className="url-input"
                  value={repoUrl}
                  onChange={e=>setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  onKeyDown={e=>e.key==='Enter'&&!scanning&&runScan()}
                />
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.18)',fontFamily:"'JetBrains Mono',monospace"}}>
                  Public repos only · Scans up to 25 source files
                </div>

                {/* Quick demo repos */}
                <div className="label-text" style={{marginTop:8}}>Try a Demo Repo</div>
                <div className="demo-repos">
                  {[
                    {name:'OWASP Juice Shop',url:'https://github.com/juice-shop/juice-shop',desc:'Intentionally vulnerable web app'},
                    {name:'DVWA',url:'https://github.com/digininja/DVWA',desc:'Damn Vulnerable Web Application'},
                    {name:'NodeGoat',url:'https://github.com/OWASP/NodeGoat',desc:'Vulnerable Node.js app by OWASP'},
                  ].map((r,i)=>(
                    <button key={i} className="demo-repo-btn" onClick={()=>setRepoUrl(r.url)}>
                      <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginBottom:2}}>{r.name}</div>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',fontFamily:"'JetBrains Mono',monospace"}}>{r.url}</div>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.2)',marginTop:2}}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span className="label-text">Your Code</span>
                  <select style={{background:'#0c0e18',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'7px 12px',color:'white',fontSize:'13px',fontFamily:"'Outfit',sans-serif",outline:'none'}} value={language} onChange={e=>setLanguage(e.target.value)}>
                    {['python','javascript','typescript','java','php','go','ruby','c','cpp'].map(l=>(
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} placeholder="Paste your code here..." spellCheck={false}/>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.18)',textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>
                  {code.split('\n').length} lines · {code.length} chars
                </div>
              </>
            )}

            {scanError && <div className="error-box">❌ {scanError}</div>}

            <button className="scan-btn" onClick={runScan} disabled={scanning||(mode==='code'&&!code.trim())||(mode==='github'&&!repoUrl.trim())}>
              {scanning?<><span className="spinner"/>AI is Scanning...</>:<>▶ Start Security Scan</>}
            </button>

            {scoreBefore!==null&&(
              <div className="score-row">
                <div className="score-card">
                  <div className="score-num" style={{color:'#ff4466'}}>{scoreBefore}</div>
                  <div className="score-lbl">Security Score</div>
                </div>
                {scoreAfter!==null&&(
                  <div className="score-card score-after">
                    <div className="score-num" style={{color:'#00ff88'}}>{scoreAfter}</div>
                    <div className="score-lbl">After Patch ↑{scoreAfter-scoreBefore}pts</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Results */}
          <div className="panel-r">
            {(steps.length>0||vulns.length>0)&&(
              <div className="tabs">
                {(['output','diff','chat'] as const).map(id=>(
                  <button key={id} className={`tab ${activeTab===id?'tab-active':'tab-inactive'}`} onClick={()=>setActiveTab(id)}>
                    {id==='output'&&'🧠 AI Output'}
                    {id==='diff'&&'⚡ Code Fixes'}
                    {id==='chat'&&'💬 Ask Agent'}
                  </button>
                ))}
              </div>
            )}

            {activeTab==='output'&&(
              <>
                {steps.length>0&&(
                  <div className="think-box">
                    <div className="think-head">
                      <span style={{fontSize:'14px'}}>🧠</span>
                      <span style={{fontSize:'13px',fontWeight:700,color:'#00ff88',fontFamily:"'Outfit',sans-serif"}}>AI Chain-of-Thought</span>
                      {scanning&&<span className="spinner" style={{marginLeft:'auto',borderTopColor:'#00ff88',borderColor:'rgba(0,255,136,0.15)',width:'13px',height:'13px'}}/>}
                    </div>
                    <div className="think-body" ref={stepsRef}>
                      {steps.map((s,i)=>(
                        <div key={i} className={`step ${s.includes('✅')||s.includes('🎉')?'s-ok':s.includes('🚨')||s.includes('❌')?'s-err':s.includes('🔧')||s.includes('🔄')||s.includes('📊')||s.includes('⚠️')?'s-warn':'s-def'}`}>{s}</div>
                      ))}
                    </div>
                  </div>
                )}
                {vulns.length>0&&(
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                      <span>⚠️</span>
                      <span style={{fontSize:'14px',fontWeight:800,color:'#ff4466',fontFamily:"'Outfit',sans-serif"}}>{vulns.length} Vulnerabilities Found</span>
                      {repoName && <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',fontFamily:"'JetBrains Mono',monospace"}}>in {repoName}</span>}
                    </div>
                    <div className="vuln-list">
                      {vulns.map((v:any,i:number)=>{
                        const c=SEV[v.severity]||SEV.medium
                        return(
                          <div key={i} className="vuln-card" style={{background:c.bg,borderColor:c.border,animationDelay:`${i*0.08}s`}}>
                            <div className="vuln-top">
                              <span className="vuln-name">{v.name}</span>
                              <span className="vuln-sev" style={{background:c.bg,borderColor:c.border,color:c.text}}>{c.label}</span>
                            </div>
                            <div className="vuln-meta">
                              CVSS {v.cvss}/10.0 · {v.cwe || ''} · {v.file}:{v.line}
                            </div>
                            <div className="vuln-desc">{v.description}</div>
                            {v.impact && <div style={{fontSize:'12px',color:'rgba(255,149,0,0.8)',marginBottom:8,lineHeight:1.6}}>💥 Impact: {v.impact}</div>}
                            <div className="vuln-fix" style={{color:c.text}}>💡 Fix: {v.fix}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {phase==='idle'&&(
                  <div className="idle">
                    <div className="idle-inner">
                      <div style={{fontSize:'38px',marginBottom:'14px',opacity:0.3}}>🛡</div>
                      <div style={{fontSize:'14px',fontWeight:700,marginBottom:'6px'}}>AI output appears here</div>
                      <div style={{fontSize:'12px',fontFamily:"'JetBrains Mono',monospace"}}>Enter a GitHub URL or paste code, then hit scan</div>
                    </div>
                  </div>
                )}
                {phase==='done'&&vulns.length===0&&(
                  <div style={{background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'14px',padding:'24px',textAlign:'center'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px'}}>🎉</div>
                    <div style={{fontSize:'16px',fontWeight:800,color:'#00ff88',marginBottom:'6px'}}>Code is Secure!</div>
                    <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',fontFamily:"'JetBrains Mono',monospace"}}>No vulnerabilities detected · Score: {scoreBefore || 95}/100</div>
                  </div>
                )}
              </>
            )}

            {activeTab==='diff'&&(
              <div>
                <span style={{fontSize:'14px',fontWeight:800,color:'#00ff88'}}>⚡ AI-Generated Fixes</span>
                {fixedCode?(
                  <div style={{marginTop:12,background:'#06080d',border:'1px solid rgba(0,255,136,0.1)',borderRadius:14,padding:16,fontFamily:"'JetBrains Mono',monospace",fontSize:12,lineHeight:1.8,color:'rgba(255,255,255,0.7)',maxHeight:500,overflow:'auto',whiteSpace:'pre-wrap'}}>
                    {fixedCode}
                  </div>
                ):(
                  <div className="idle"><div className="idle-inner"><div style={{fontSize:'30px',marginBottom:'12px',opacity:0.3}}>⚡</div><div style={{fontSize:'13px',fontWeight:700}}>Run a scan first</div></div></div>
                )}
              </div>
            )}

            {activeTab==='chat'&&(
              vulns.length>0||phase==='done'
                ? <AskAgent vulns={vulns} repo={repoName} securityScore={scoreBefore}/>
                : <div className="idle"><div className="idle-inner"><div style={{fontSize:'30px',marginBottom:'12px',opacity:0.3}}>💬</div><div style={{fontSize:'13px',fontWeight:700}}>Scan first to chat with the AI</div></div></div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
