'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Shield, Brain, Code, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="text-green-400 w-6 h-6" />
          <span className="text-xl font-bold">
            Secure<span className="text-green-400">AI</span>
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/login')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Login
          </Button>
          <Button
            onClick={() => router.push('/login')}
            className="bg-green-600 hover:bg-green-700"
          >
            Start Scanning Free
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
            <Brain className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">Agentic AI Security Analysis</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Find Vulnerabilities
            <br />
            <span className="text-green-400">Before Hackers Do</span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10">
            Our AI agent thinks like a senior security engineer —
            scanning your code, explaining vulnerabilities with
            chain-of-thought reasoning, and auto-generating patches.
          </p>

          <Button
            size="lg"
            onClick={() => router.push('/login')}
            className="bg-green-600 hover:bg-green-700 px-10 py-6 text-lg"
          >
            <Shield className="w-5 h-5 mr-2" />
            Scan My Code →
          </Button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">How The AI Agent Works</h2>
        <p className="text-white/40 text-center mb-16">
          Watch the agent think, reason, and fix in real time
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Code className="w-8 h-8" />,
              title: 'Paste Your Code',
              desc: 'Supports Python, JavaScript, TypeScript, Java, Go, PHP and more',
            },
            {
              icon: <Brain className="w-8 h-8" />,
              title: 'AI Agent Analyzes',
              desc: 'Watch chain-of-thought reasoning as the agent scans for vulnerabilities',
            },
            {
              icon: <CheckCircle className="w-8 h-8" />,
              title: 'Get Patched Code',
              desc: 'Receive fixed code with detailed explanation of every change made',
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-green-500/30 transition-all"
            >
              <div className="text-green-400 mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-white/40">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Vulnerability Types */}
        <div className="mt-16 p-8 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Detects These Vulnerabilities
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              'SQL Injection', 'XSS', 'CSRF',
              'Broken Auth', 'Sensitive Data Exposure',
              'Path Traversal', 'Command Injection',
              'Hardcoded Secrets', 'Buffer Overflow',
              'Race Conditions', 'Security Misconfiguration',
              'Insecure Deserialization',
            ].map((v, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" /> {v}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}