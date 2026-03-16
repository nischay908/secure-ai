// app/api/scan-url/route.ts
// REAL website security scanner - runs server-side so no CORS issues
// Checks ACTUAL HTTP headers returned by the target website
// Every website returns different headers = different real results

import { NextRequest, NextResponse } from 'next/server'

interface HeaderCheck {
  header: string
  present: boolean
  value: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  impact: string
  learnMore: string
}

interface URLScanResult {
  url: string
  finalUrl: string
  statusCode: number
  serverInfo: {
    server: string | null
    poweredBy: string | null
    via: string | null
  }
  tlsEnabled: boolean
  tlsRedirect: boolean
  headerChecks: HeaderCheck[]
  cookieIssues: string[]
  exposedInfo: string[]
  securityScore: number
  grade: string
  criticalCount: number
  highCount: number
  mediumCount: number
  scanDuration: number
  scannedAt: string
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // Normalize URL
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`
    }

    // Fetch the actual website (server-side = no CORS)
    let response: Response
    let finalUrl = targetUrl
    let statusCode = 0

    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'CyberSentry-SecurityScanner/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000)
      })
      statusCode = response.status
      finalUrl = response.url || targetUrl
    } catch (fetchErr: any) {
      return NextResponse.json({
        error: `Could not reach ${targetUrl}. The site may be down or blocking automated requests.`,
        details: fetchErr.message
      }, { status: 422 })
    }

    const headers = response.headers
    const htmlBody = await response.text().catch(() => '')

    // ── Check TLS ──────────────────────────────────────────────────────────────
    const tlsEnabled = finalUrl.startsWith('https://')
    
    // Check if HTTP redirects to HTTPS
    let tlsRedirect = false
    if (targetUrl.startsWith('https://')) {
      try {
        const httpUrl = targetUrl.replace('https://', 'http://')
        const httpRes = await fetch(httpUrl, {
          redirect: 'manual',
          signal: AbortSignal.timeout(5000)
        })
        tlsRedirect = httpRes.status >= 300 && httpRes.status < 400 &&
          (httpRes.headers.get('location') || '').startsWith('https://')
      } catch { tlsRedirect = false }
    }

    // ── Server info leakage ────────────────────────────────────────────────────
    const serverHeader = headers.get('server')
    const poweredBy = headers.get('x-powered-by')
    const via = headers.get('via')

    const exposedInfo: string[] = []
    if (serverHeader && /\d/.test(serverHeader)) {
      exposedInfo.push(`Server version exposed: "${serverHeader}" — attackers can look up known CVEs for this exact version`)
    }
    if (poweredBy) {
      exposedInfo.push(`Technology stack exposed via X-Powered-By: "${poweredBy}" — reveals framework and version to attackers`)
    }

    // ── Check cookies ──────────────────────────────────────────────────────────
    const cookieIssues: string[] = []
    const setCookieHeaders = headers.getSetCookie?.() || []
    setCookieHeaders.forEach((cookie: string) => {
      const cookieName = cookie.split('=')[0]
      if (!cookie.toLowerCase().includes('httponly')) {
        cookieIssues.push(`Cookie "${cookieName}" missing HttpOnly flag — readable by JavaScript, vulnerable to XSS theft`)
      }
      if (!cookie.toLowerCase().includes('secure')) {
        cookieIssues.push(`Cookie "${cookieName}" missing Secure flag — transmitted over HTTP, can be intercepted`)
      }
      if (!cookie.toLowerCase().includes('samesite')) {
        cookieIssues.push(`Cookie "${cookieName}" missing SameSite attribute — vulnerable to CSRF attacks`)
      }
    })

    // ── Check mixed content in HTML ────────────────────────────────────────────
    const httpResources = (htmlBody.match(/src\s*=\s*["']http:\/\//g) || []).length +
                          (htmlBody.match(/href\s*=\s*["']http:\/\//g) || []).length
    if (httpResources > 0 && tlsEnabled) {
      exposedInfo.push(`${httpResources} HTTP (unencrypted) resource${httpResources > 1 ? 's' : ''} loaded on HTTPS page — mixed content allows MITM injection`)
    }

    // ── Security header checks ─────────────────────────────────────────────────
    const headerChecks: HeaderCheck[] = [
      {
        header: 'Strict-Transport-Security',
        present: !!headers.get('strict-transport-security'),
        value: headers.get('strict-transport-security'),
        severity: 'high',
        description: 'HTTP Strict Transport Security (HSTS) forces browsers to always use HTTPS.',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        impact: 'Without HSTS, attackers on public WiFi can intercept and downgrade connections to HTTP, stealing session cookies and credentials.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'
      },
      {
        header: 'Content-Security-Policy',
        present: !!headers.get('content-security-policy'),
        value: headers.get('content-security-policy'),
        severity: 'high',
        description: 'Content Security Policy controls which resources the browser is allowed to load.',
        recommendation: "Add: Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'",
        impact: 'Without CSP, injected scripts from XSS attacks run freely. CSP is the primary defense against XSS.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
      },
      {
        header: 'X-Frame-Options',
        present: !!headers.get('x-frame-options'),
        value: headers.get('x-frame-options'),
        severity: 'high',
        description: 'Prevents your site from being embedded in iframes on other domains.',
        recommendation: 'Add: X-Frame-Options: DENY (or use CSP frame-ancestors directive)',
        impact: 'Without this header, attackers can embed your site in an invisible iframe and trick users into clicking buttons they cannot see (clickjacking).',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'
      },
      {
        header: 'X-Content-Type-Options',
        present: !!headers.get('x-content-type-options'),
        value: headers.get('x-content-type-options'),
        severity: 'medium',
        description: 'Prevents browsers from guessing (sniffing) the content type of responses.',
        recommendation: 'Add: X-Content-Type-Options: nosniff',
        impact: 'Without this, browsers may execute uploaded files as scripts if they look like JavaScript, enabling drive-by XSS attacks.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'
      },
      {
        header: 'Referrer-Policy',
        present: !!headers.get('referrer-policy'),
        value: headers.get('referrer-policy'),
        severity: 'medium',
        description: 'Controls how much referrer information is included with requests.',
        recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        impact: 'Without this, sensitive URL parameters (session tokens, user IDs) may leak to third-party sites via the Referer header.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy'
      },
      {
        header: 'Permissions-Policy',
        present: !!headers.get('permissions-policy'),
        value: headers.get('permissions-policy'),
        severity: 'medium',
        description: 'Controls which browser features and APIs can be used by the page.',
        recommendation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()',
        impact: 'Without this, malicious scripts can access camera, microphone, or geolocation without explicit user permission.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy'
      },
      {
        header: 'X-XSS-Protection',
        present: !!headers.get('x-xss-protection'),
        value: headers.get('x-xss-protection'),
        severity: 'low',
        description: 'Legacy XSS filter for older browsers (deprecated but still checked).',
        recommendation: 'Add: X-XSS-Protection: 1; mode=block (or rely on CSP for modern browsers)',
        impact: 'Minimal impact on modern browsers but provides a safety net for older browser users.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection'
      },
      {
        header: 'Cache-Control',
        present: !!headers.get('cache-control'),
        value: headers.get('cache-control'),
        severity: 'low',
        description: 'Controls caching behavior for sensitive pages.',
        recommendation: 'For authenticated pages: Cache-Control: no-store, no-cache, must-revalidate',
        impact: 'Without proper cache headers on authenticated pages, sensitive data may be stored in browser cache and readable by other users on shared computers.',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control'
      }
    ]

    // Calculate real security score based on actual findings
    const missingCritical = headerChecks.filter(h => !h.present && h.severity === 'critical').length
    const missingHigh = headerChecks.filter(h => !h.present && h.severity === 'high').length
    const missingMedium = headerChecks.filter(h => !h.present && h.severity === 'medium').length
    const missingLow = headerChecks.filter(h => !h.present && h.severity === 'low').length
    const tlsPenalty = !tlsEnabled ? 30 : 0
    const cookiePenalty = Math.min(20, cookieIssues.length * 5)
    const exposedPenalty = Math.min(15, exposedInfo.length * 5)

    const securityScore = Math.max(0, Math.min(100,
      100 - tlsPenalty - (missingHigh * 10) - (missingMedium * 6) - (missingLow * 3) - cookiePenalty - exposedPenalty
    ))

    const grade = securityScore >= 90 ? 'A+' :
      securityScore >= 80 ? 'A' :
      securityScore >= 70 ? 'B' :
      securityScore >= 60 ? 'C' :
      securityScore >= 50 ? 'D' : 'F'

    const criticalCount = !tlsEnabled ? 1 : 0
    const highCount = missingHigh + cookieIssues.filter(c => c.includes('Secure')).length
    const mediumCount = missingMedium + exposedInfo.length

    const result: URLScanResult = {
      url: targetUrl,
      finalUrl,
      statusCode,
      serverInfo: {
        server: serverHeader,
        poweredBy,
        via
      },
      tlsEnabled,
      tlsRedirect,
      headerChecks,
      cookieIssues,
      exposedInfo,
      securityScore,
      grade,
      criticalCount,
      highCount,
      mediumCount,
      scanDuration: Date.now() - startTime,
      scannedAt: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('URL scan error:', err)
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}