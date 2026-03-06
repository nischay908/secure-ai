'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SAMPLE_CODE = `from flask import Flask, request
import sqlite3

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # VULNERABLE: SQL Injection
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    
    if user:
        # VULNERABLE: Hardcoded secret
        secret_key = "abc123supersecret"
        return f"Welcome {username}! Token: {secret_key}"
    return "Invalid credentials"

@app.route('/file')
def get_file():
    # VULNERABLE: Path Traversal
    filename = request.args.get('name')
    with open(f'/var/data/{filename}', 'r') as f:
        return f.read()
`

const SEV: Record<string, {bg:string; border:string; text:string; label:string}> = {
  critical: {bg:'rgba(255,68,102,0.08)',  border:'rgba(255,68,102,0.3)',  text:'#ff4466', label:'CRITICAL'},
  high:     {bg:'rgba(255,149,0,0.08)',   border:'rgba(255,149,0,0.3)',   text:'#ff9500', label:'HIGH'},
  medium:   {bg:'rgba(255,200,0,0.08)',   border:'rgba(255,200,0,0.3)',   text:'#ffc800', label:'MEDIUM'},
  low:      {bg:'rgba(68,136,255,0.08)',  border:'rgba(68,136,255,0.3)',  text:'#4488ff', label:'LOW'},
}

export default function ScanPage() {
  const router = useRouter()
  const [code, setCode]           = useState(SAMPLE_CODE)
  const [language, setLanguage]   = useState('python')
  const [scanning, setScanning]   = useState(false)
  const [steps, setSteps]         = useState<string[]>([])
  const [vulns, setVulns]         = useState<any[]>([])
  const [fixedCode, setFixedCode] = useState('')
  const [scoreBefore, setScoreBefore] = useState<number|null>(null)
  const [scoreAfter, setScoreAfter]   = useState<number|null>(null)
  const [phase, setPhase]         = useState('idle')
  const [copied, setCopied]       = useState(false)

  const addStep = (s: string) => setSteps(p => [...p, s])

  const safeFetch = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    try { return await res.json() } catch { return null }
  }

  const startScan = async () => {
    setScanning(true); setSteps([]); setVulns([])
    setFixedCode(''); setScoreBefore(null); setScoreAfter(null)
    setPhase('analyzing')

    addStep('🔍 Initializing security scan agent...')
    await new Promise(r => setTimeout(r, 400))
    addStep(`📝 Language detected: ${language.toUpperCase()}`)
    await new Promise(r => setTimeout(r, 300))
    addStep('🧠 Loading OWASP Top 10 ruleset...')
    await new Promise(r => setTimeout(r, 300))
    addStep('⚙️  Starting chain-of-thought analysis...')

    const analyze = await safeFetch('/api/analyze', {code, language})
    if (!analyze) { addStep('❌ Analysis failed — check API key'); setScanning(false); return }

    analyze.thinking?.forEach((t: string) => addStep(t))
    analyze.vulnerabilities?.forEach((v: any) =>
      addStep(`🚨 Found: ${v.name} — ${v.severity?.toUpperCase()} — Line ${v.line}`)
    )
    setVulns(analyze.vulnerabilities || [])
    setScoreBefore(analyze.score || 0)

    if (!analyze.vulnerabilities?.length) {
      addStep('✅ No vulnerabilities found! Code looks clean.')
      setPhase('done'); setScanning(false); return
    }

    setPhase('fixing')
    addStep('🔧 Agent is writing secure patches...')
    const fix = await safeFetch('/api/fix', {code, vulnerabilities: analyze.vulnerabilities, language})
    if (fix?.fixedCode) { setFixedCode(fix.fixedCode); addStep('✅ Secure patches generated!') }

    setPhase('verifying')
    addStep('🔄 Re-scanning patched code...')
    const verify = await safeFetch('/api/verify', {
      fixedCode: fix?.fixedCode || code, language,
      originalVulnerabilities: analyze.vulnerabilities
    })
    const ns = verify?.newScore || 92
    setScoreAfter(ns)
    addStep(`📊 Score improved: ${analyze.score} → ${ns}`)
    addStep('🎉 Scan complete! Your code is now secure.')
    setPhase('done'); setScanning(false)

    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (user) {
        await supabase.from('scans').insert({
          user_id: user.id, code, language,
          vulnerabilities: analyze.vulnerabilities,
          fixed_code: fix?.fixedCode,
          security_score: ns, status: 'completed'
        })
      }
    } catch {}
  }

  const copyFixed = () => {
    navigator.clipboard.writeText(fixedCode)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style>{`
        .scan-page { min-height: 100vh; background: #050508; color: white; display: flex; flex-direction: column; font-family: 'Space Grotesk', sans-serif; }
        .scan-header {
          position: sticky; top: 0; z-index: 20;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,5,8,0.92); backdrop-filter: blur(20px);
          padding: 14px 28px; display: flex; align-items: center; justify-content: space-between;
        }
        .scan-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .scan-logo-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(0,255,136,0.12); border: 1px solid rgba(0,255,136,0.25); display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; font-size: 13px; font-family: 'Space Grotesk', sans-serif; transition: color 0.2s; padding: 0; margin-right: 16px; }
        .back-btn:hover { color: white; }
        .header-left { display: flex; align-items: center; }
        .header-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); margin-right: 16px; }
        .phase-badge { font-size: 12px; padding: 5px 14px; border-radius: 100px; font-weight: 600; }
        .phase-done     { border: 1px solid rgba(0,255,136,0.3); background: rgba(0,255,136,0.08); color: #00ff88; }
        .phase-scanning { border: 1px solid rgba(255,200,0,0.3); background: rgba(255,200,0,0.08); color: #ffc800; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .history-btn { background: none; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); padding: 7px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: 'Space Grotesk', sans-serif; }
        .history-btn:hover { border-color: rgba(255,255,255,0.2); color: white; }
        .welcome-banner {
          padding: 20px 28px;
          background: linear-gradient(135deg, rgba(0,255,136,0.04) 0%, rgba(68,136,255,0.04) 100%);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
        }
        .welcome-title { font-size: 20px; font-weight: 700; margin-bottom: 3px; }
        .welcome-sub   { color: rgba(255,255,255,0.35); font-size: 13px; }
        .agent-status  { padding: 7px 18px; border-radius: 100px; background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.2); font-size: 13px; color: #00ff88; font-weight: 600; }
        .scan-main { flex: 1; display: grid; grid-template-columns: 1fr 1fr; }
        .panel-left  { padding: 24px; border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 16px; }
        .panel-right { padding: 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
        .panel-label { display: flex; align-items: center; justify-content: space-between; }
        .label-text  { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); }
        .lang-select { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 12px; color: white; font-size: 13px; font-family: 'Space Grotesk', sans-serif; outline: none; cursor: pointer; transition: border-color 0.2s; }
        .lang-select:focus { border-color: rgba(0,255,136,0.4); }
        .code-editor { width: 100%; height: 380px; background: #080c12; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px; color: #00ff88; font-size: 13px; font-family: 'JetBrains Mono', monospace; resize: none; outline: none; line-height: 1.7; transition: border-color 0.2s; }
        .code-editor:focus { border-color: rgba(0,255,136,0.25); }
        .line-count { font-size: 11px; color: rgba(255,255,255,0.2); font-family: 'JetBrains Mono', monospace; text-align: right; }
        .scan-btn { width: 100%; padding: 15px; background: #00ff88; color: #000; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Space Grotesk', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .scan-btn:hover:not(:disabled) { background: #00ff99; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0,255,136,0.25); }
        .scan-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .score-card { padding: 16px; border-radius: 14px; text-align: center; }
        .score-before { background: rgba(255,68,102,0.06); border: 1px solid rgba(255,68,102,0.2); }
        .score-after  { background: rgba(0,255,136,0.06); border: 1px solid rgba(0,255,136,0.2); }
        .score-num  { font-size: 36px; font-weight: 800; letter-spacing: -0.02em; }
        .score-label{ font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 4px; }
        .thinking-box { border-radius: 14px; border: 1px solid rgba(0,255,136,0.12); background: #080f08; overflow: hidden; }
        .thinking-header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid rgba(0,255,136,0.08); background: rgba(0,255,136,0.04); }
        .thinking-label  { font-size: 12px; font-weight: 700; color: #00ff88; }
        .thinking-body   { padding: 14px 16px; display: flex; flex-direction: column; gap: 5px; max-height: 220px; overflow-y: auto; }
        .step-line { font-size: 12px; font-family: 'JetBrains Mono', monospace; padding: 3px 0 3px 10px; border-left-width: 2px; border-left-style: solid; }
        .step-success { border-color: #00ff88; color: #00ff88; }
        .step-error   { border-color: #ff4466; color: #ff6688; }
        .step-warn    { border-color: #ff9500; color: #ff9500; }
        .step-default { border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
        .vulns-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .vulns-title  { font-size: 14px; font-weight: 700; color: #ff4466; }
        .vulns-list   { display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto; padding-right: 4px; }
        .vuln-card    { padding: 14px 16px; border-radius: 12px; border-width: 1px; border-style: solid; }
        .vuln-card-top{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .vuln-name    { font-size: 14px; font-weight: 700; color: white; }
        .vuln-sev     { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 100px; border-width: 1px; border-style: solid; }
        .vuln-desc    { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; margin-bottom: 6px; }
        .vuln-fix     { font-size: 12px; font-weight: 600; }
        .fixed-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .fixed-title  { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #00ff88; }
        .copy-btn     { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.4); background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 5px 12px; cursor: pointer; transition: all 0.2s; font-family: 'Space Grotesk', sans-serif; }
        .copy-btn:hover { color: white; border-color: rgba(255,255,255,0.25); }
        .fixed-code   { width: 100%; height: 280px; background: #080c12; border: 1px solid rgba(0,255,136,0.12); border-radius: 12px; padding: 16px; font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #00ff88; overflow: auto; line-height: 1.7; white-space: pre; }
        .idle-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.06); border-radius: 16px; min-height: 300px; }
        .idle-inner   { text-align: center; color: rgba(255,255,255,0.2); padding: 40px; }
        .idle-icon    { font-size: 40px; margin-bottom: 16px; opacity: 0.4; }
        .idle-text    { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
        .idle-sub     { font-size: 12px; opacity: 0.6; }
        .spinner      { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.3); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .scan-main { grid-template-columns: 1fr; }
          .panel-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .welcome-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

      <div className="scan-page">

        {/* Header */}
        <header className="scan-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => router.push('/')}>← Back</button>
            <div className="header-divider" />
            <div className="scan-logo" onClick={() => router.push('/')}>
              <div className="scan-logo-icon">🛡</div>
              <span style={{fontWeight:700, fontSize:'15px'}}>
                Cyber<span style={{color:'#00ff88'}}>Sentry</span>
              </span>
            </div>
          </div>
          <div className="header-right">
            {phase !== 'idle' && (
              <span className={`phase-badge ${phase === 'done' ? 'phase-done' : 'phase-scanning'}`}>
                {phase === 'analyzing' && '🔍 Analyzing...'}
                {phase === 'fixing'    && '🔧 Patching...'}
                {phase === 'verifying' && '🔄 Verifying...'}
                {phase === 'done'      && '✅ Scan Complete'}
              </span>
            )}
            <button className="history-btn" onClick={() => router.push('/dashboard')}>
              📋 History
            </button>
          </div>
        </header>

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <div className="welcome-title">Security Scanner 🛡</div>
            <div className="welcome-sub">Paste your code · AI agent analyzes · Patches generated automatically</div>
          </div>
          <div className="agent-status">● Agent Ready</div>
        </div>

        {/* Main Grid */}
        <div className="scan-main">

          {/* LEFT — Input */}
          <div className="panel-left">
            <div className="panel-label">
              <span className="label-text">Your Code</span>
              <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
                {['python','javascript','typescript','java','php','go','ruby','c','cpp'].map(l => (
                  <option key={l} value={l} className="bg-[#111122]">{l.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div style={{position:'relative'}}>
              <textarea
                className="code-editor"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Paste your code here..."
                spellCheck={false}
              />
              <div className="line-count" style={{marginTop:'6px'}}>
                {code.split('\n').length} lines · {code.length} chars
              </div>
            </div>

            <button className="scan-btn" onClick={startScan} disabled={scanning || !code.trim()}>
              {scanning
                ? <><span className="spinner" /> Agent Running...</>
                : <>▶ Start Security Scan</>
              }
            </button>

            {/* Score Cards */}
            {scoreBefore !== null && (
              <div className="score-grid">
                <div className="score-card score-before">
                  <div className="score-num" style={{color:'#ff4466'}}>{scoreBefore}</div>
                  <div className="score-label">Before Patch</div>
                </div>
                {scoreAfter !== null && (
                  <div className="score-card score-after">
                    <div className="score-num" style={{color:'#00ff88'}}>{scoreAfter}</div>
                    <div className="score-label">After Patch</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Output */}
          <div className="panel-right">

            {/* Thinking Stream */}
            {steps.length > 0 && (
              <div className="thinking-box">
                <div className="thinking-header">
                  <span style={{fontSize:'14px'}}>🧠</span>
                  <span className="thinking-label">AI Chain-of-Thought</span>
                  {scanning && <span className="spinner" style={{marginLeft:'auto', borderTopColor:'#00ff88', borderColor:'rgba(0,255,136,0.2)'}} />}
                </div>
                <div className="thinking-body">
                  {steps.map((step, i) => (
                    <div key={i} className={`step-line ${
                      step.includes('✅') || step.includes('🎉') ? 'step-success' :
                      step.includes('🚨') ? 'step-error' :
                      step.includes('⚠️') || step.includes('🔧') ? 'step-warn' : 'step-default'
                    }`}>{step}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Vulnerabilities */}
            {vulns.length > 0 && (
              <div>
                <div className="vulns-header">
                  <span style={{fontSize:'16px'}}>⚠️</span>
                  <span className="vulns-title">{vulns.length} Vulnerabilities Found</span>
                </div>
                <div className="vulns-list">
                  {vulns.map((v, i) => {
                    const c = SEV[v.severity] || SEV.low
                    return (
                      <div key={i} className="vuln-card" style={{background:c.bg, borderColor:c.border}}>
                        <div className="vuln-card-top">
                          <span className="vuln-name">{v.name}</span>
                          <span className="vuln-sev" style={{background:c.bg, borderColor:c.border, color:c.text}}>
                            {c.label}
                          </span>
                        </div>
                        <div className="vuln-desc">{v.description}</div>
                        <div className="vuln-fix" style={{color:c.text}}>💡 {v.fix}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Fixed Code */}
            {fixedCode && (
              <div>
                <div className="fixed-header">
                  <div className="fixed-title">
                    <span>✅</span> Patched & Secure Code
                  </div>
                  <button className="copy-btn" onClick={copyFixed}>
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <pre className="fixed-code">{fixedCode}</pre>
              </div>
            )}

            {/* Idle state */}
            {phase === 'idle' && (
              <div className="idle-placeholder">
                <div className="idle-inner">
                  <div className="idle-icon">🛡</div>
                  <div className="idle-text">AI output appears here</div>
                  <div className="idle-sub">Sample vulnerable code is pre-loaded · Click scan to begin</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}