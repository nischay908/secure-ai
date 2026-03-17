// app/api/chat/route.ts
// AI chat about scan results — Claude AI with smart fallback
import { NextRequest, NextResponse } from 'next/server'

function smartReply(question: string, vulns: any[], score: number, repo: string): string {
  const q = question.toLowerCase()
  const criticals = vulns.filter((v: any) => v.severity === 'critical')
  const highs = vulns.filter((v: any) => v.severity === 'high')

  if (q.includes('most critical') || q.includes('worst') || q.includes('fix first') || q.includes('most dangerous')) {
    if (criticals.length > 0) {
      const v = criticals[0]
      return `The most critical vulnerability is **${v.name}** (CVSS ${v.cvss}) in \`${v.file}:${v.line}\`. ${v.description} Fix: ${v.fix}`
    }
    return 'No critical vulnerabilities were found. Focus on the high-severity findings if any exist.'
  }

  if (q.includes('how many') || q.includes('total') || q.includes('summary') || q.includes('overview')) {
    return `I found **${vulns.length} vulnerabilities** in ${repo}: ${criticals.length} critical, ${highs.length} high, ${vulns.length - criticals.length - highs.length} medium/low. Security score: **${score}/100**. ${criticals.length > 0 ? 'The critical findings need immediate attention.' : 'No critical issues found.'}`
  }

  if (q.includes('sql') || q.includes('injection') || q.includes('database')) {
    const sqli = vulns.find((v: any) => v.name.toLowerCase().includes('sql'))
    if (sqli) return `**SQL Injection** (CVSS ${sqli.cvss}) found in \`${sqli.file}:${sqli.line}\`. ${sqli.description} An attacker could input \`' OR '1'='1\` to bypass authentication and dump your database. **Fix:** ${sqli.fix}`
    return 'No SQL injection vulnerabilities were found in the scanned code.'
  }

  if (q.includes('secret') || q.includes('key') || q.includes('hardcoded') || q.includes('password') || q.includes('token')) {
    const sec = vulns.find((v: any) => v.name.toLowerCase().includes('secret') || v.name.toLowerCase().includes('credential') || v.name.toLowerCase().includes('exposed'))
    if (sec) return `**${sec.name}** found in \`${sec.file}:${sec.line}\`. ${sec.description} **Fix:** ${sec.fix}`
    return 'No hardcoded secrets were detected in the scanned code.'
  }

  if (q.includes('xss') || q.includes('cross-site') || q.includes('script')) {
    const xss = vulns.find((v: any) => v.name.toLowerCase().includes('xss') || v.name.toLowerCase().includes('cross-site'))
    if (xss) return `**XSS** found in \`${xss.file}:${xss.line}\`. ${xss.description} **Fix:** ${xss.fix}`
    return 'No XSS vulnerabilities were found.'
  }

  if (q.includes('fix') || q.includes('patch') || q.includes('how to') || q.includes('remediat')) {
    if (vulns.length === 0) return 'No vulnerabilities to fix — your code looks secure!'
    const fixes = vulns.slice(0, 3).map((v: any, i: number) => `${i+1}. **${v.name}** in \`${v.file}\`: ${v.fix}`).join('\n')
    return `Here are the top fixes:\n${fixes}`
  }

  if (q.includes('score') || q.includes('grade') || q.includes('rating')) {
    const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : score >= 35 ? 'D' : 'F'
    return `Security score: **${score}/100** (Grade ${grade}). ${score < 50 ? 'This is critical — multiple serious vulnerabilities need immediate fixing.' : score < 75 ? 'Room for improvement. Fix the high-severity issues first.' : 'Good security posture with minor improvements needed.'}`
  }

  if (q.includes('safe') || q.includes('secure') || q.includes('ok') || q.includes('good')) {
    if (vulns.length === 0) return `Yes, the scanned code looks secure. Score: ${score}/100. No critical vulnerabilities detected.`
    return `Not yet — there are ${vulns.length} vulnerabilities to address. ${criticals.length} are critical and need immediate fixing. Start with the highest CVSS scores first.`
  }

  if (q.includes('cvss') || q.includes('score mean') || q.includes('severity')) {
    return `CVSS scores rate vulnerability impact from 0-10:\n- **9.0-10.0** = Critical (exploit is trivial, damage is total)\n- **7.0-8.9** = High (serious risk, fix immediately)\n- **4.0-6.9** = Medium (moderate risk)\n- **0.1-3.9** = Low (minor concern)\n\nYour scan found: ${criticals.length} critical (9.0+), ${highs.length} high (7.0+).`
  }

  // Default response
  if (vulns.length > 0) {
    const top = vulns[0]
    return `Based on the scan of ${repo}, the most pressing issue is **${top.name}** (CVSS ${top.cvss}) in \`${top.file}\`. ${top.description} There are ${vulns.length} total findings. What specific vulnerability would you like to know more about?`
  }
  return `The scan of ${repo} found no critical vulnerabilities. Score: ${score}/100. Is there a specific security concern you'd like me to check?`
}

export async function POST(req: NextRequest) {
  try {
    const { question, vulnerabilities = [], securityScore = 0, repo = '' } = await req.json()
    if (!question) return NextResponse.json({ error: 'No question' }, { status: 400 })

    // Try Claude first
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })
        const vulnContext = vulnerabilities.map((v: any, i: number) =>
          `${i+1}. ${v.name} (${v.severity}, CVSS ${v.cvss}) in ${v.file}:${v.line} — ${v.description}`
        ).join('\n')

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: `You are CyberSentry AI. You scanned ${repo}. Score: ${securityScore}/100. Findings:\n${vulnContext || 'None'}\nAnswer concisely (2-4 sentences). Reference exact files and lines.`,
          messages: [{ role: 'user', content: question }]
        })
        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        if (text) return NextResponse.json({ reply: text })
      } catch {}
    }

    // Fallback — smart pattern matching
    const reply = smartReply(question, vulnerabilities, securityScore, repo)
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: 'Something went wrong. Try asking again.' })
  }
}