import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json()

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a senior security engineer. Analyze this ${language} code for security vulnerabilities.

CODE:
\`\`\`${language}
${code}
\`\`\`

Return ONLY this exact JSON format, nothing else:
{
  "thinking": [
    "First I notice...",
    "Looking deeper...",
    "I also found..."
  ],
  "vulnerabilities": [
    {
      "name": "SQL Injection",
      "severity": "critical",
      "line": 12,
      "description": "User input directly used in SQL query",
      "fix": "Use parameterized queries"
    }
  ],
  "score": 20
}`
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const text = content.text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      }
    }

    return NextResponse.json({
      thinking: ['Analysis complete'],
      vulnerabilities: [],
      score: 80
    })

  } catch (error: any) {
    console.error('Analyze error:', error)
    return NextResponse.json({
      thinking: ['Error during analysis: ' + error.message],
      vulnerabilities: [],
      score: 0
    })
  }
}