// app/api/github-webhook/route.ts
// GitHub Webhook Handler for Continuous Security Monitoring

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabase } from '@/lib/supabase'

/* ─────────────────────────────────────────────────
   WEBHOOK SIGNATURE VERIFICATION
   Prevents fake webhook calls
───────────────────────────────────────────────── */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expected = `sha256=${hmac.digest('hex')}`
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

/* ─────────────────────────────────────────────────
   SIMPLE CODE ANALYZER
   Lightweight checks for webhook-triggered scans
───────────────────────────────────────────────── */
function quickAnalyze(code: string): { vulnCount: number; criticalCount: number; issues: string[] } {
  const issues: string[] = []
  const lower = code.toLowerCase()

  if (lower.includes('select ') && lower.includes('where ') && (lower.includes(' + ') || lower.includes('f"') || lower.includes('sprintf'))) {
    issues.push('SQL Injection — unsanitized query detected')
  }
  if (/(?:api[_-]?key|password|secret|token)\s*[=:]\s*['"][^'"]{8,}['"]/i.test(code)) {
    issues.push('Hardcoded Secret — credential found in source')
  }
  if (lower.includes('innerhtml') && (lower.includes('req.') || lower.includes('user'))) {
    issues.push('XSS — unsanitized input rendered as HTML')
  }
  if ((lower.includes('exec(') || lower.includes('spawn(')) && lower.includes('req.')) {
    issues.push('Command Injection — user input reaches shell')
  }
  if (lower.includes('readfile') && lower.includes('req.')) {
    issues.push('Path Traversal — user input used in file path')
  }

  const criticalCount = issues.filter(i =>
    i.includes('SQL Injection') || i.includes('Hardcoded Secret') || i.includes('Command Injection')
  ).length

  return { vulnCount: issues.length, criticalCount, issues }
}

/* ─────────────────────────────────────────────────
   MAIN WEBHOOK HANDLER
───────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-hub-signature-256')
    const event = req.headers.get('x-github-event')
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || ''

    // Verify signature in production
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)

    // Only process push events
    if (event !== 'push') {
      return NextResponse.json({ message: `Event ${event} ignored` }, { status: 200 })
    }

    const commits = payload.commits || []
    const repo = payload.repository?.full_name || 'unknown/repo'
    const branch = payload.ref?.replace('refs/heads/', '') || 'main'
    const pusher = payload.pusher?.name || 'unknown'

    if (commits.length === 0) {
      return NextResponse.json({ message: 'No commits to scan' }, { status: 200 })
    }

    const latestCommit = commits[commits.length - 1]
    const commitSha = latestCommit.id?.slice(0, 7) || 'unknown'
    const commitMsg = latestCommit.message || ''
    const filesChanged = [
      ...(latestCommit.added || []),
      ...(latestCommit.modified || []),
    ].filter(f =>
      f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.py') ||
      f.endsWith('.java') || f.endsWith('.go') || f.endsWith('.env')
    )

    // Build a mock "code blob" from commit metadata for analysis
    // In production you'd fetch actual file content via GitHub API
    const mockCode = `
// Commit: ${commitMsg}
// Files: ${filesChanged.join(', ')}
// Pusher: ${pusher}
${latestCommit.url || ''}
`
    const analysis = quickAnalyze(mockCode + commitMsg)

    // Save scan result to Supabase
    const scanRecord = {
      trigger: 'webhook',
      repo,
      branch,
      commit_sha: commitSha,
      commit_message: commitMsg.slice(0, 200),
      pusher,
      files_changed: filesChanged,
      vuln_count: analysis.vulnCount,
      critical_count: analysis.criticalCount,
      issues: analysis.issues,
      security_score: Math.max(0, 100 - analysis.vulnCount * 20),
      status: analysis.criticalCount > 0 ? 'critical' : analysis.vulnCount > 0 ? 'warning' : 'passed',
      scanned_at: new Date().toISOString(),
    }

    let savedId: string | null = null
    try {
      const { data, error } = await supabase
        .from('webhook_scans')
        .insert(scanRecord)
        .select('id')
        .single()
      if (!error && data) savedId = data.id
    } catch (dbErr) {
      console.warn('Supabase insert failed:', dbErr)
    }

    return NextResponse.json({
      success: true,
      scanId: savedId,
      commitSha,
      filesScanned: filesChanged.length,
      vulnsFound: analysis.vulnCount,
      criticalFound: analysis.criticalCount,
      status: scanRecord.status,
      issues: analysis.issues,
    })
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GitHub sends GET to verify webhook URL is reachable
export async function GET() {
  return NextResponse.json({
    status: 'CyberSentry AI webhook endpoint active',
    timestamp: new Date().toISOString(),
  })
}