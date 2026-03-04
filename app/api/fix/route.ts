import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const { code, vulnerabilities, language } = await req.json()

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Fix ALL these security vulnerabilities in the code.

VULNERABLE CODE:
\`\`\`${language}
${code}
\`\`\`

FIXES NEEDED:
${vulnerabilities?.map((v: any) => `- ${v.name}: ${v.fix}`).join('\n')}

Return ONLY the fixed code. No explanations. No markdown. Just raw code.`
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const fixedCode = content.text
        .replace(/```[\w]*/g, '')
        .replace(/```/g, '')
        .trim()
      return NextResponse.json({ fixedCode })
    }

    return NextResponse.json({ fixedCode: code })

  } catch (error: any) {
    console.error('Fix error:', error)
    return NextResponse.json({ fixedCode: code })
  }
}