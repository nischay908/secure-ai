// lib/security-score-tracker.ts
// Security Score Evolution Tracking for CyberSentry AI

export interface ScoreSnapshot {
  id: string
  date: string               // ISO string
  label: string              // e.g. "Initial Scan"
  score: number              // 0–100
  delta: number              // change from previous
  event: string              // what happened
  vulnsFixed: number
  secretsRemoved: number
  depsPatched: number
  aiActions: string[]
  scanId?: string
}

export interface ScoreEvolution {
  currentScore: number
  startScore: number
  totalImprovement: number
  snapshots: ScoreSnapshot[]
  trend: 'improving' | 'stable' | 'degrading'
  projectedScore: number     // estimated score after all pending fixes
}

// ── Demo evolution data ────────────────────────────────────────────────────────
export function getDemoEvolution(): ScoreEvolution {
  const now = Date.now()
  const day = 86400000

  const snapshots: ScoreSnapshot[] = [
    {
      id: 'snap-1',
      date: new Date(now - day * 7).toISOString(),
      label: 'Initial Scan',
      score: 24,
      delta: 0,
      event: 'First security audit — multiple critical issues found',
      vulnsFixed: 0, secretsRemoved: 0, depsPatched: 0,
      aiActions: ['Detected SQL Injection in 4 files', 'Found 3 hardcoded secrets', 'Identified 6 vulnerable dependencies'],
    },
    {
      id: 'snap-2',
      date: new Date(now - day * 5).toISOString(),
      label: 'SQL Injection Patched',
      score: 48,
      delta: +24,
      event: 'AI fixed SQL injection across all endpoints',
      vulnsFixed: 4, secretsRemoved: 0, depsPatched: 0,
      aiActions: ['Parameterized 4 SQL queries', 'Added input validation middleware', 'Created GitHub PR #12'],
    },
    {
      id: 'snap-3',
      date: new Date(now - day * 3).toISOString(),
      label: 'Secrets Removed',
      score: 67,
      delta: +19,
      event: 'Hardcoded credentials moved to environment variables',
      vulnsFixed: 0, secretsRemoved: 3, depsPatched: 0,
      aiActions: ['Moved Stripe key to .env', 'Rotated JWT secret', 'Removed DB password from config.ts'],
    },
    {
      id: 'snap-4',
      date: new Date(now - day * 1).toISOString(),
      label: 'Dependencies Patched',
      score: 81,
      delta: +14,
      event: 'Vulnerable npm packages upgraded',
      vulnsFixed: 0, secretsRemoved: 0, depsPatched: 5,
      aiActions: ['Upgraded lodash to 4.17.21', 'Updated jsonwebtoken to 9.0.0', 'Patched 3 more packages'],
    },
    {
      id: 'snap-5',
      date: new Date(now).toISOString(),
      label: 'Current State',
      score: 89,
      delta: +8,
      event: 'Security headers added, XSS vectors patched',
      vulnsFixed: 2, secretsRemoved: 0, depsPatched: 1,
      aiActions: ['Added Helmet.js security headers', 'Fixed XSS in UserProfile component', 'Enabled HSTS'],
    },
  ]

  return {
    currentScore: 89,
    startScore: 24,
    totalImprovement: 65,
    snapshots,
    trend: 'improving',
    projectedScore: 96,
  }
}

// ── Score calculator ──────────────────────────────────────────────────────────
export function calculateSecurityScore(params: {
  vulnCount: number
  criticalCount: number
  secretLeaks: number
  vulnerableDeps: number
  hasSecurityHeaders: boolean
  hasCsp: boolean
}): number {
  let score = 100
  score -= params.criticalCount * 20
  score -= (params.vulnCount - params.criticalCount) * 10
  score -= params.secretLeaks * 15
  score -= params.vulnerableDeps * 5
  if (!params.hasSecurityHeaders) score -= 8
  if (!params.hasCsp) score -= 5
  return Math.max(0, Math.min(100, Math.round(score)))
}

// ── Score label ───────────────────────────────────────────────────────────────
export function getScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Excellent', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' }
  if (score >= 75) return { label: 'Good', color: '#00e5ff', bg: 'rgba(0,229,255,0.1)' }
  if (score >= 60) return { label: 'Fair', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }
  if (score >= 40) return { label: 'Poor', color: '#f97316', bg: 'rgba(249,115,22,0.1)' }
  return { label: 'Critical', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' }
}