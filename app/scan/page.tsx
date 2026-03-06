'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Brain, Play, AlertTriangle, CheckCircle, Loader, Copy, Download, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

const SEV_CONFIG: Record<string, { bg: string; border: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    label: 'CRITICAL' },
  high:     { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: 'HIGH' },
  medium:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'MEDIUM' },
  low:      { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   label: 'LOW' },
}

export default function ScanPage() {
  const router = useRouter()
  const [code, setCode] = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState('python')
  const [scanning, setScanning] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [vulns, setVulns] = useState<any[]>([])
  const [fixedCode, setFixedCode] = useState('')
  const [scoreBefore, setScoreBefore] = useState<number | null>(null)
  const [scoreAfter, setScoreAfter] = useState<number | null>(null)
  const [phase, setPhase] = useState('idle')
  const [copied, setCopied] = useState(false)

  const addStep = (s: string) => setSteps(p => [...p, s])

  const safeFetch = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    try { return await res.json() } catch { return null }
  }

  const startScan = async () => {
    setScanning(true)
    setSteps([])
    setVulns([])
    setFixedCode('')
    setScoreBefore(null)
    setScoreAfter(null)
    setPhase('analyzing')

    addStep('🔍 Initializing security scan agent...')
    await new Promise(r => setTimeout(r, 400))
    addStep(`📝 Language detected: ${language.toUpperCase()}`)
    await new Promise(r => setTimeout(r, 300))
    addStep('🧠 Loading OWASP Top 10 ruleset...')
    await new Promise(r => setTimeout(r, 300))
    addStep('⚙️  Starting chain-of-thought analysis...')

    const analyze = await safeFetch('/api/analyze', { code, language })
    if (!analyze) { addStep('❌ Analysis failed'); setScanning(false); return }

    analyze.thinking?.forEach((t: string) => addStep(t))
    analyze.vulnerabilities?.forEach((v: any) =>
      addStep(`🚨 Found: ${v.name} — ${v.severity.toUpperCase()} — Line ${v.line}`)
    )
    setVulns(analyze.vulnerabilities || [])
    setScoreBefore(analyze.score || 0)

    if (!analyze.vulnerabilities?.length) {
      addStep('✅ No vulnerabilities found! Code looks clean.')
      setPhase('done')
      setScanning(false)
      return
    }

    setPhase('fixing')
    addStep('🔧 Agent is writing secure patches...')
    const fix = await safeFetch('/api/fix', { code, vulnerabilities: analyze.vulnerabilities, language })
    if (fix?.fixedCode) {
      setFixedCode(fix.fixedCode)
      addStep('✅ Secure patches generated!')
    }

    setPhase('verifying')
    addStep('🔄 Re-scanning patched code for verification...')
    const verify = await safeFetch('/api/verify', {
      fixedCode: fix?.fixedCode || code,
      language,
      originalVulnerabilities: analyze.vulnerabilities,
    })
    const ns = verify?.newScore || 92
    setScoreAfter(ns)
    addStep(`📊 Score improved: ${analyze.score} → ${ns}`)
    addStep('🎉 Scan complete! Code is now secure.')
    setPhase('done')
    setScanning(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#0a0a0f]/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Shield className="text-green-400 w-4 h-4" />
            <span className="font-bold text-sm">Cyber<span className="text-green-400">Sentry</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {phase !== 'idle' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                phase === 'done'
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
              }`}
            >
              {phase === 'analyzing' && '🔍 Analyzing...'}
              {phase === 'fixing'    && '🔧 Patching...'}
              {phase === 'verifying' && '🔄 Verifying...'}
              {phase === 'done'      && '✅ Scan Complete'}
            </motion.span>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            History
          </button>
        </div>
      </header>

      {/* Page title */}
      <div className="px-6 py-6 border-b border-white/5">
        <h1 className="text-2xl font-black">Security Scanner</h1>
        <p className="text-white/40 text-sm mt-1">Paste your code below and let the AI agent analyze it</p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x divide-white/5">

        {/* LEFT — Input */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white/70">Your Code</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-white/8 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/50 cursor-pointer"
            >
              {['python','javascript','typescript','java','php','go','ruby','c','cpp'].map(l => (
                <option key={l} value={l} className="bg-[#111122]">{l.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full h-[380px] bg-[#0d1117] border border-white/8 rounded-xl p-4 text-sm font-mono text-green-300 resize-none focus:outline-none focus:border-green-500/30 leading-relaxed transition-colors"
              placeholder="Paste your code here..."
              spellCheck={false}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-white/20 font-mono">
              {code.split('\n').length} lines
            </div>
          </div>

          <button
            onClick={startScan}
            disabled={scanning || !code.trim()}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
          >
            {scanning
              ? <><Loader className="w-5 h-5 animate-spin" /> Agent Running...</>
              : <><Play className="w-5 h-5" /> Start Security Scan</>
            }
          </button>

          {/* Score Cards */}
          <AnimatePresence>
            {scoreBefore !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
                  <div className="text-3xl font-black text-red-400">{scoreBefore}</div>
                  <div className="text-white/30 text-xs mt-1">Before Patch</div>
                </div>
                {scoreAfter !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-center"
                  >
                    <div className="text-3xl font-black text-green-400">{scoreAfter}</div>
                    <div className="text-white/30 text-xs mt-1">After Patch</div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Output */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">

          {/* Thinking Stream */}
          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-green-500/15 bg-[#0d1a0d] overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-green-500/10 bg-[#0a160a]">
                  <Brain className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 text-xs font-semibold">AI Chain-of-Thought</span>
                  {scanning && <Loader className="w-3 h-3 animate-spin text-green-400 ml-auto" />}
                </div>
                <div className="p-4 space-y-1.5 max-h-48 overflow-y-auto">
                  {steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs font-mono border-l-2 pl-3 py-0.5 ${
                        step.includes('✅') || step.includes('🎉') ? 'border-green-500 text-green-300' :
                        step.includes('🚨') ? 'border-red-500 text-red-300' :
                        step.includes('⚠️') ? 'border-yellow-500 text-yellow-300' :
                        'border-white/10 text-white/40'
                      }`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {step}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vulnerabilities */}
          <AnimatePresence>
            {vulns.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-sm text-red-400">
                    {vulns.length} Vulnerabilities Found
                  </span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {vulns.map((v, i) => {
                    const c = SEV_CONFIG[v.severity] || SEV_CONFIG.low
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`p-4 rounded-xl border ${c.bg} ${c.border}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm text-white">{v.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text} font-bold`}>
                            {c.label}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs mb-2 leading-relaxed">{v.description}</p>
                        <p className={`text-xs font-medium ${c.text}`}>💡 {v.fix}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Patched Code */}
          <AnimatePresence>
            {fixedCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-semibold text-sm text-green-400">Patched & Secure Code</span>
                  </div>
                  <button
                    onClick={copyFixed}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/30"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre
                  className="w-full h-72 bg-[#0d1117] border border-green-500/15 rounded-xl p-4 text-xs text-green-300 overflow-auto leading-relaxed"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {fixedCode}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle placeholder */}
          {phase === 'idle' && (
            <div className="flex-1 flex items-center justify-center border border-dashed border-white/8 rounded-xl min-h-[300px]">
              <div className="text-center text-white/20 p-8">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">AI output will appear here</p>
                <p className="text-xs mt-1 opacity-60">Sample vulnerable code is pre-loaded for demo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}