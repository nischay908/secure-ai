// app/api/create-pr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSecurityPR } from '@/lib/github-integration'

export async function POST(req: NextRequest) {
  try {
    const { vulnerability, language, originalCode, patchedCode, filePath } = await req.json()

    if (!vulnerability || !originalCode || !patchedCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine file extension from language
    const extMap: Record<string, string> = {
      Python: 'py',
      Java: 'java',
      Go: 'go',
      JavaScript: 'js',
      TypeScript: 'ts',
    }
    const ext = extMap[language] || 'ts'
    const defaultPath = `src/app/api/users/route.${ext}`

    const result = await createSecurityPR(
      {
        name: vulnerability.name,
        severity: vulnerability.severity,
        description: vulnerability.what || vulnerability.description || '',
        fix: vulnerability.howToFix || vulnerability.fix || '',
        cvss: vulnerability.cvss,
        cwe: vulnerability.cwe,
      },
      [
        {
          path: filePath || defaultPath,
          originalContent: originalCode,
          patchedContent: patchedCode,
        },
      ]
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('PR creation error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}