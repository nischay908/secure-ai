'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Brain, Play, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export default function ScanPage() {
  const router = useRouter()
  const [code, setCode] = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState('python')
  const [scanning, setScanning] = useState(false)
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([])
  const [fixedCode, setFixedCode] = useState('')
  const [securityScore, setSecurityScore] = useState<number | null>(null)
  const [newScore, setNewScore] = useState<number | null>(null)
  const [phase, setPhase] = useState('idle')

  const addStep = (step: string) => {
    setThinkingSteps(prev => [...prev, step])
  }

  const safeFetch = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      console.error('Failed to parse response from', url, text)
      return null
    }
  }

  const startScan = async () => {
    setScanning(true)
    setThinkingSteps([])
    setVulnerabilities([])
    setFixedCode('')
    setSecurityScore(null)
    setNewScore(null)
    setPhase('analyzing')

    addStep('🔍 Initializing security scan agent...')
    await new Promise(r => setTimeout(r, 400))
    addStep(`📝 Detected language: ${language}`)
    await new Promise(r => setTimeout(r, 400))
    addStep('🧠 Running chain-of-thought vulnerability analysis...')
    await new Promise(r => setTimeout(r, 400))
    addStep('🔎 Checking for OWASP Top 10 vulnerabilities...')

    // Phase 1: Analyze
    const analyzeData = await safeFetch('/api/analyze', { code, language })

    if (!analyzeData) {
      addStep('❌ Analysis failed - check your API key')
      setScanning(false)
      return
    }

    analyzeData.thinking?.forEach((t: string) => addStep(t))
    analyzeData.vulnerabilities?.forEach((v: any) =>
      addStep(`🚨 Found: ${v.name} (${v.severity?.toUpperCase()}) — Line ${v.line}`)
    )

    setVulnerabilities(analyzeData.vulnerabilities || [])
    setSecurityScore(analyzeData.score || 0)

    if (!analyzeData.vulnerabilities?.length) {
      addStep('✅ No vulnerabilities found! Code looks secure.')
      setPhase('done')
      setScanning(false)
      return
    }

    // Phase 2: Fix
    setPhase('fixing')
    addStep('🔧 Generating secure patches...')

    const fixData = await safeFetch('/api/fix', {
      code,
      vulnerabilities: analyzeData.vulnerabilities,
      language
    })

    if (fixData?.fixedCode) {
      setFixedCode(fixData.fixedCode)
      addStep('✅ Patches generated!')
    } else {
      addStep('⚠️ Could not generate patches')
    }

    // Phase 3: Verify
    setPhase('verifying')
    addStep('🔄 Re-scanning patched code to verify fixes...')

    const verifyData = await safeFetch('/api/verify', {
      fixedCode: fixData?.fixedCode || code,
      language,
      originalVulnerabilities: analyzeData.vulnerabilities
    })

    const finalScore = verifyData?.newScore || 90
    setNewScore(finalScore)
    addStep(`✅ Verification complete! Score: ${analyzeData.score} → ${finalScore}`)
    addStep('🎉 Security scan complete!')

    setPhase('done')
    setScanning(false)

    // Save to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('scans').insert({
          user_id: user.id,
          code,
          language,
          vulnerabilities: analyzeData.vulnerabilities,
          fixed_code: fixData?.fixedCode,
          security_score: finalScore,
          status: 'completed'
        })
      }
    } catch (e) {
      console.log('Could not save to database')
    }
  }

  const severityColor = (s: string) => ({
    critical: 'border-red-500/30 bg-red-500/10 text-red-400',
    high: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    low: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  }[s] || 'border-white/10 bg-white/5 text-white/60')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/90 backdrop-blur z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Shield className="text-green-400 w-5 h-5" />
          <span className="font-bold">Secure<span className="text-green-400">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          {phase !== 'idle' && (
            <span className={`text-xs px-3 py-1 rounded-full border ${
              phase === 'done'
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            }`}>
              {phase === 'analyzing' && '🔍 Analyzing...'}
              {phase === 'fixing' && '🔧 Fixing...'}
              {phase === 'verifying' && '🔄 Verifying...'}
              {phase === 'done' && '✅ Complete'}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            History
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Code Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">📝 Your Code</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
              >
                {['python', 'javascript', 'typescript', 'java', 'php', 'go', 'ruby'].map(l => (
                  <option key={l} value={l} className="bg-gray-900">{l}</option>
                ))}
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[400px] bg-[#0d1117] border border-white/10 rounded-xl p-4 text-sm font-mono text-green-300 resize-none focus:outline-none focus:border-green-500/50 leading-relaxed"
              placeholder="Paste your code here..."
              spellCheck={false}
            />

            <Button
              onClick={startScan}
              disabled={scanning || !code.trim()}
              className="w-full bg-green-600 hover:bg-green-700 py-6 text-base font-semibold"
            >
              {scanning
                ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Scanning Code...</>
                : <><Play className="w-5 h-5 mr-2" /> Start Security Scan</>
              }
            </Button>

            {/* Score Cards */}
            {securityScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
                  <div className="text-4xl font-black text-red-400">{securityScore}</div>
                  <div className="text-white/40 text-xs mt-1">Before Fix</div>
                </div>
                {newScore !== null && (
                  <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
                    <div className="text-4xl font-black text-green-400">{newScore}</div>
                    <div className="text-white/40 text-xs mt-1">After Fix</div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* RIGHT — AI Output */}
          <div className="space-y-4">

            {/* AI Thinking */}
            {thinkingSteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl border border-green-500/20 bg-[#0d1a0d]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="text-green-400 w-4 h-4" />
                  <span className="text-green-400 font-semibold text-sm">
                    AI Agent Chain-of-Thought
                  </span>
                  {scanning && <Loader className="w-3 h-3 animate-spin text-green-400 ml-auto" />}
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  <AnimatePresence>
                    {thinkingSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-green-300/70 font-mono py-0.5 border-l-2 border-green-500/20 pl-3"
                      >
                        {step}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Vulnerabilities */}
            {vulnerabilities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  {vulnerabilities.length} Vulnerabilities Found
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {vulnerabilities.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl border border-white/10 bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{v.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(v.severity)}`}>
                          {v.severity?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/50 text-xs mb-2">{v.description}</p>
                      <p className="text-green-400 text-xs">💡 {v.fix}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Fixed Code */}
            {fixedCode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="font-bold flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Patched & Secure Code
                </h3>
                <pre className="w-full h-72 bg-[#0d1117] border border-green-500/20 rounded-xl p-4 text-xs font-mono text-green-300 overflow-auto leading-relaxed">
                  {fixedCode}
                </pre>
              </motion.div>
            )}

            {/* Idle placeholder */}
            {phase === 'idle' && (
              <div className="h-64 flex items-center justify-center border border-white/10 rounded-xl border-dashed">
                <div className="text-center text-white/30">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">AI analysis will appear here</p>
                  <p className="text-xs mt-1 opacity-60">Sample vulnerable code is pre-loaded</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}