// app/api/chat/route.ts
// Real AI chat — sends user question + scan context to Claude
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { question, vulnerabilities, securityScore, repo } = await req.json()

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 })
    }

    const vulnContext = vulnerabilities?.length
      ? vulnerabilities.map((v: any, i: number) =>
          `${i+1}. ${v.name} (${v.severity}, CVSS ${v.cvss}) in ${v.file}:${v.line}\n   Issue: ${v.description}\n   Fix: ${v.fix}`
        ).join('\n\n')
      : 'No vulnerabilities found — code appears secure.'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are CyberSentry AI, a security expert assistant. You just scanned ${repo || 'a codebase'} and found these results:

Security Score: ${securityScore || 'N/A'}/100

Vulnerabilities Found:
${vulnContext}

Answer the user's question about these scan results. Be specific, reference exact file names and line numbers from the scan. Keep responses concise (2-4 sentences). Use plain English, not jargon. If asked about something not in the scan, say so honestly.`,
      messages: [{ role: 'user', content: question }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      reply: `I encountered an error processing your question. The scan data is still valid — try asking again or rephrase your question.`
    })
  }
}