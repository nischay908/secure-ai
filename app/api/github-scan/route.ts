// app/api/github-scan/route.ts
// REAL GitHub API integration - reads actual company repository code
// This is what makes CyberSentry a real product, not a demo

import { NextRequest, NextResponse } from 'next/server'

interface FileVulnerability {
  file: string
  line: number
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  fix: string
  cvss: number
  cwe: string
  snippet: string
}

interface ScanResult {
  repoName: string
  totalFiles: number
  scannedFiles: number
  vulnerabilities: FileVulnerability[]
  securityScore: number
  languages: Record<string, number>
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  scanDuration: number
  branch: string
  lastCommit: string
}

// ── REAL vulnerability detection patterns ─────────────────────────────────────
function scanFileContent(content: string, filename: string): FileVulnerability[] {
  const vulns: FileVulnerability[] = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) return

    // 1. SQL Injection
    if (
      /["'`].*SELECT.*WHERE.*["'`]\s*\+/i.test(line) ||
      /["'`].*INSERT.*VALUES.*["'`]\s*\+/i.test(line) ||
      /f["'`].*SELECT.*\{/i.test(line) ||
      /sprintf.*SELECT.*%s/i.test(line) ||
      (/query.*=.*["'`].*SELECT/i.test(line) && /\+\s*(req\.|request\.|params\.|query\.)/i.test(line))
    ) {
      vulns.push({
        file: filename, line: lineNum, type: 'SQL Injection',
        severity: 'critical', cvss: 9.8, cwe: 'CWE-89',
        description: 'User input is directly concatenated into SQL query. Attacker can bypass authentication, dump entire database, or execute OS commands.',
        fix: 'Replace string concatenation with parameterized queries: db.execute("SELECT * FROM users WHERE id = ?", [userId])',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 2. Hardcoded secrets - API keys
    if (/(?:api[_-]?key|apikey)\s*[=:]\s*['"][A-Za-z0-9\-_]{20,}['"]/i.test(line) ||
        /(?:secret|token|password|passwd)\s*[=:]\s*['"][^'"]{8,}['"]/i.test(line)) {
      // Skip if it's already using env vars
      if (!line.includes('process.env') && !line.includes('os.environ') && !line.includes('System.getenv')) {
        vulns.push({
          file: filename, line: lineNum, type: 'Hardcoded Secret',
          severity: 'high', cvss: 7.5, cwe: 'CWE-798',
          description: 'Credentials hardcoded in source code. Will be committed to git history permanently. Automated scanners find these in seconds.',
          fix: 'Move to environment variable: process.env.SECRET_NAME. Add .env to .gitignore.',
          snippet: trimmed.replace(/['"][A-Za-z0-9\-_]{8,}['"]/g, '"[REDACTED]"').slice(0, 120)
        })
      }
    }

    // 3. JWT hardcoded secret
    if (/jwt\.sign\s*\(.*,\s*['"][^'"]{8,}['"]/i.test(line) ||
        /jwt_secret\s*[=:]\s*['"][^'"]{8,}['"]/i.test(line)) {
      vulns.push({
        file: filename, line: lineNum, type: 'Hardcoded JWT Secret',
        severity: 'critical', cvss: 9.8, cwe: 'CWE-798',
        description: 'JWT signing secret hardcoded. Attacker can forge tokens for ANY user including admins without a password.',
        fix: 'Use process.env.JWT_SECRET with a cryptographically random 256-bit value.',
        snippet: trimmed.replace(/['"][A-Za-z0-9\-_!@#$%^&*]{8,}['"]/g, '"[REDACTED]"').slice(0, 120)
      })
    }

    // 4. XSS via innerHTML
    if (/\.innerHTML\s*=\s*(?!['"`])/.test(line) ||
        /dangerouslySetInnerHTML\s*=\s*\{\s*\{/.test(line)) {
      vulns.push({
        file: filename, line: lineNum, type: 'Cross-Site Scripting (XSS)',
        severity: 'high', cvss: 7.2, cwe: 'CWE-79',
        description: 'User-controlled data rendered as raw HTML. Attacker can inject malicious scripts that run in victims browsers.',
        fix: 'Use textContent instead of innerHTML, or sanitize with DOMPurify.sanitize(userInput).',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 5. Command injection
    if (/(exec|spawn|system|popen|subprocess)\s*\(.*(?:req\.|request\.|params\.|query\.)/i.test(line)) {
      vulns.push({
        file: filename, line: lineNum, type: 'Command Injection',
        severity: 'critical', cvss: 9.9, cwe: 'CWE-78',
        description: 'User input passed directly to OS command execution. Attacker can run arbitrary commands on your server.',
        fix: 'Never pass user input to exec/spawn. Use allowlists to validate inputs. Use child_process with array arguments.',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 6. Path traversal
    if (/readFile[Sync]?\s*\(.*(?:req\.|params\.|query\.)/i.test(line) ||
        /fs\.\w+\s*\(.*\+.*(?:req\.|params\.)/i.test(line)) {
      vulns.push({
        file: filename, line: lineNum, type: 'Path Traversal',
        severity: 'high', cvss: 7.5, cwe: 'CWE-22',
        description: 'User input used in file system path. Attacker can read /../../../etc/passwd and other sensitive files.',
        fix: 'Validate paths with path.resolve() and check they stay within allowed directory. Use allowlist of permitted files.',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 7. Insecure deserialization
    if (/JSON\.parse\s*\(.*(?:req\.|request\.body|params\.)/i.test(line) && 
        !/(try|catch|validate|schema)/i.test(lines.slice(Math.max(0,idx-2), idx+3).join(''))) {
      vulns.push({
        file: filename, line: lineNum, type: 'Unvalidated Deserialization',
        severity: 'medium', cvss: 5.9, cwe: 'CWE-502',
        description: 'JSON parsed from user input without schema validation. Malformed input can cause crashes or prototype pollution.',
        fix: 'Validate deserialized data with a schema library: const data = UserSchema.parse(JSON.parse(req.body))',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 8. Missing authentication check
    if (/app\.(get|post|put|delete|patch)\s*\(['"]\/api\/admin/i.test(line) &&
        !/(auth|middleware|protect|guard|verify|token)/i.test(lines.slice(idx, idx+5).join(''))) {
      vulns.push({
        file: filename, line: lineNum, type: 'Missing Authentication',
        severity: 'critical', cvss: 9.1, cwe: 'CWE-306',
        description: 'Admin API endpoint defined without authentication middleware. Anyone can access admin functions.',
        fix: 'Add authentication middleware before the route: app.use("/api/admin", authMiddleware)',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 9. Weak cryptography
    if (/(?:md5|sha1)\s*\(/i.test(line) && /password|passwd|secret/i.test(line)) {
      vulns.push({
        file: filename, line: lineNum, type: 'Weak Cryptography',
        severity: 'high', cvss: 7.4, cwe: 'CWE-327',
        description: 'MD5/SHA1 used for password hashing. These are broken algorithms — passwords can be cracked in seconds with rainbow tables.',
        fix: 'Use bcrypt with salt rounds ≥ 12: const hash = await bcrypt.hash(password, 12)',
        snippet: trimmed.slice(0, 120)
      })
    }

    // 10. Database connection string in code
    if (/(mongodb|postgresql|mysql|redis):\/\/[^:]+:[^@]+@/i.test(line)) {
      vulns.push({
        file: filename, line: lineNum, type: 'Exposed Database Credentials',
        severity: 'critical', cvss: 9.5, cwe: 'CWE-312',
        description: 'Full database connection string with credentials hardcoded. Anyone with code access has direct database access.',
        fix: 'Move to process.env.DATABASE_URL. Rotate database credentials immediately.',
        snippet: trimmed.replace(/:\/\/[^@]+@/, '://[REDACTED]@').slice(0, 120)
      })
    }
  })

  return vulns
}

// ── Fetch file tree from GitHub ───────────────────────────────────────────────
async function getRepoTree(owner: string, repo: string, token: string, branch: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  )
  if (!res.ok) throw new Error(`Failed to fetch repo tree: ${res.status}`)
  const data = await res.json()
  return data.tree || []
}

// ── Fetch file content from GitHub ───────────────────────────────────────────
async function getFileContent(owner: string, repo: string, path: string, token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  )
  if (!res.ok) return ''
  const data = await res.json()
  if (data.encoding === 'base64' && data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }
  return ''
}

// ── Scannable file extensions ─────────────────────────────────────────────────
const SCANNABLE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs',
  '.py', '.java', '.go', '.rb', '.php',
  '.cs', '.cpp', '.c', '.swift', '.kt'
]

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'vendor', '__pycache__']

function isScannable(path: string): boolean {
  if (SKIP_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`))) return false
  return SCANNABLE_EXTENSIONS.some(ext => path.endsWith(ext))
}

function detectLanguage(path: string): string {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'TypeScript'
  if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.mjs')) return 'JavaScript'
  if (path.endsWith('.py')) return 'Python'
  if (path.endsWith('.java')) return 'Java'
  if (path.endsWith('.go')) return 'Go'
  if (path.endsWith('.rb')) return 'Ruby'
  if (path.endsWith('.php')) return 'PHP'
  return 'Other'
}

// ── MAIN SCAN HANDLER ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const { repoUrl, token, branch = 'main', maxFiles = 50 } = await req.json()

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 })
    }

    // Parse repo URL: https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?(?:\/.*)?$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
    }

    const [, owner, repo] = match

    // Use provided token or fall back to env variable
    const accessToken = token || process.env.GITHUB_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'GitHub token required' }, { status: 401 })
    }

    // Get repo info
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' }
    })

    if (!repoRes.ok) {
      if (repoRes.status === 404) return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 })
      if (repoRes.status === 401) return NextResponse.json({ error: 'Invalid GitHub token' }, { status: 401 })
      return NextResponse.json({ error: 'Failed to access repository' }, { status: repoRes.status })
    }

    const repoInfo = await repoRes.json()
    const defaultBranch = repoInfo.default_branch || branch

    // Get last commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
    )
    const commitData = commitRes.ok ? await commitRes.json() : null
    const lastCommit = commitData?.sha?.slice(0, 7) || 'unknown'

    // Get file tree
    const tree = await getRepoTree(owner, repo, accessToken, defaultBranch)
    const scannableFiles = tree
      .filter((f: any) => f.type === 'blob' && isScannable(f.path))
      .slice(0, maxFiles)

    // Count languages
    const languages: Record<string, number> = {}
    scannableFiles.forEach((f: any) => {
      const lang = detectLanguage(f.path)
      languages[lang] = (languages[lang] || 0) + 1
    })

    // Scan each file
    const allVulnerabilities: FileVulnerability[] = []

    // Scan files in batches of 5 to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < scannableFiles.length; i += batchSize) {
      const batch = scannableFiles.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (file: any) => {
          const content = await getFileContent(owner, repo, file.path, accessToken)
          if (!content) return []
          return scanFileContent(content, file.path)
        })
      )
      batchResults.forEach(vulns => allVulnerabilities.push(...vulns))
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    allVulnerabilities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    const criticalCount = allVulnerabilities.filter(v => v.severity === 'critical').length
    const highCount = allVulnerabilities.filter(v => v.severity === 'high').length
    const mediumCount = allVulnerabilities.filter(v => v.severity === 'medium').length
    const lowCount = allVulnerabilities.filter(v => v.severity === 'low').length

    // Calculate real security score
    const securityScore = Math.max(0, Math.min(100,
      100 - (criticalCount * 22) - (highCount * 12) - (mediumCount * 6) - (lowCount * 2)
    ))

    const result: ScanResult = {
      repoName: `${owner}/${repo}`,
      totalFiles: tree.filter((f: any) => f.type === 'blob').length,
      scannedFiles: scannableFiles.length,
      vulnerabilities: allVulnerabilities,
      securityScore,
      languages,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      scanDuration: Date.now() - startTime,
      branch: defaultBranch,
      lastCommit
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}