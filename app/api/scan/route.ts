// app/api/scan/route.ts
// Real vulnerability scanner — fetches code from GitHub, analyzes with Claude AI
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Parse GitHub URL into owner/repo ──────────────────────────────────────────
function parseGitHub(url: string): { owner: string; repo: string } | null {
  // Handles: github.com/owner/repo, https://github.com/owner/repo.git, etc.
  const m = url.match(/github\.com\/([^\/\s]+)\/([^\/\s.]+)/)
  if (m) return { owner: m[1], repo: m[2] }
  // Also handle owner/repo format directly
  const m2 = url.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/)
  if (m2) return { owner: m2[1], repo: m2[2] }
  return null
}

// ── Fetch files from GitHub API (public repos, no token needed) ───────────────
async function fetchRepoFiles(owner: string, repo: string): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = []
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.php', '.rb', '.cs', '.env', '.yaml', '.yml', '.json', '.sql', '.sh']
  const skipDirs = ['node_modules', '.next', 'dist', 'build', '.git', 'vendor', '__pycache__', '.venv', 'coverage']
  const maxFiles = 25 // Keep within Claude's context

  async function crawl(path: string) {
    if (files.length >= maxFiles) return
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CyberSentry-AI-Scanner',
        },
      })
      if (!res.ok) return
      const items = await res.json()
      if (!Array.isArray(items)) return

      for (const item of items) {
        if (files.length >= maxFiles) break

        if (item.type === 'dir' && !skipDirs.some(s => item.name === s || item.path.includes(s))) {
          await crawl(item.path)
        }

        if (item.type === 'file' && item.size < 50000) {
          const ext = '.' + item.name.split('.').pop()?.toLowerCase()
          const isConfig = ['.env', 'Dockerfile', 'docker-compose'].some(c => item.name.includes(c))
          if (extensions.includes(ext) || isConfig) {
            try {
              const fRes = await fetch(item.download_url)
              if (fRes.ok) {
                const content = await fRes.text()
                files.push({ path: item.path, content: content.slice(0, 8000) }) // Truncate large files
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  await crawl('')
  return files
}

// ── Main API handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { repoUrl, codeSnippet } = body

    let codeToAnalyze = ''
    let repoName = 'Code Snippet'
    let fileCount = 0

    // Mode 1: GitHub repo URL — fetch real files
    if (repoUrl) {
      const parsed = parseGitHub(repoUrl)
      if (!parsed) {
        return NextResponse.json({ error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' }, { status: 400 })
      }

      repoName = `${parsed.owner}/${parsed.repo}`
      const files = await fetchRepoFiles(parsed.owner, parsed.repo)
      fileCount = files.length

      if (files.length === 0) {
        return NextResponse.json({ error: 'Could not fetch files. Make sure the repository is public.' }, { status: 400 })
      }

      codeToAnalyze = files.map(f => `\n=== FILE: ${f.path} ===\n${f.content}`).join('\n')
    }
    // Mode 2: Direct code paste
    else if (codeSnippet) {
      codeToAnalyze = codeSnippet
      fileCount = 1
    }
    else {
      return NextResponse.json({ error: 'Provide either repoUrl or codeSnippet' }, { status: 400 })
    }

    // ── Call Claude to analyze ─────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are CyberSentry AI, an expert code security auditor. Analyze this code for real security vulnerabilities.

CRITICAL RULES:
- Only report REAL vulnerabilities you can see in the code. Never invent fake ones.
- If the code is secure, say so — report 0 vulnerabilities.
- For each vulnerability, cite the EXACT file path and line number.
- Give a CVSS score based on real impact.
- Provide a concrete fix with actual code.

Respond ONLY with valid JSON in this exact format (no markdown, no backticks):
{
  "repo": "${repoName}",
  "filesScanned": ${fileCount},
  "securityScore": <0-100 integer>,
  "grade": "<A/B/C/D/F>",
  "vulnerabilities": [
    {
      "id": "V-001",
      "name": "<vulnerability type>",
      "severity": "<critical|high|medium|low>",
      "cvss": <float>,
      "cwe": "<CWE-XXX>",
      "file": "<exact file path>",
      "line": <line number>,
      "snippet": "<the vulnerable code line>",
      "description": "<what the vulnerability is and why it's dangerous — plain English, 1-2 sentences>",
      "impact": "<what an attacker could do — specific to THIS codebase>",
      "fix": "<exact code fix with explanation>",
      "fixedCode": "<the corrected version of the vulnerable code block>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>",
  "thinkingSteps": [
    "<step 1: what you checked first>",
    "<step 2: what pattern you found>",
    "<step 3: how you confirmed it>",
    "<step 4: what fix you recommend>"
  ]
}

If no vulnerabilities found, return empty vulnerabilities array with score 95+ and grade A.

CODE TO ANALYZE:
${codeToAnalyze.slice(0, 80000)}`
      }]
    })

    // Parse Claude's response
    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Clean potential markdown wrapping
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch {
      // If JSON parsing fails, return a structured error with the raw text
      return NextResponse.json({
        repo: repoName,
        filesScanned: fileCount,
        securityScore: 50,
        grade: 'C',
        vulnerabilities: [],
        summary: 'Analysis completed but response parsing failed. The AI may have found issues — please try again.',
        thinkingSteps: ['Scan initiated', 'Files fetched', 'Analysis completed', 'Response parsing error — retry recommended'],
        rawResponse: text.slice(0, 500),
      })
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Scan API error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error during scan',
    }, { status: 500 })
  }
}