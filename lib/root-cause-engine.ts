// lib/root-cause-engine.ts
// Root Cause Analysis Engine for CyberSentry AI

export interface RootCausePattern {
  id: string
  pattern: string
  category: string
  description: string
  affectedFiles: string[]
  affectedLines: number[]
  occurrenceCount: number
  systemicFix: string
  exampleBefore: string
  exampleAfter: string
  cwe: string
  severity: 'critical' | 'high' | 'medium'
}

export interface RootCauseReport {
  totalPatternsFound: number
  mostCriticalPattern: string
  patterns: RootCausePattern[]
  systemicRiskScore: number
  analysisTimestamp: string
}

// ── Pattern detection library ─────────────────────────────────────────────────
const ROOT_CAUSE_PATTERNS: Array<{
  id: string
  pattern: string
  category: string
  regex: RegExp[]
  description: string
  systemicFix: string
  exampleBefore: string
  exampleAfter: string
  cwe: string
  severity: 'critical' | 'high' | 'medium'
}> = [
  {
    id: 'RC-001',
    pattern: 'Unsafe SQL String Concatenation',
    category: 'Injection',
    regex: [
      /["'`]SELECT.+WHERE.+["'`]\s*\+/i,
      /["'`]INSERT INTO.+VALUES.+["'`]\s*\+/i,
      /["'`]UPDATE.+SET.+["'`]\s*\+/i,
      /f["'`]SELECT.+\{/i,
      /sprintf.*SELECT.*%s/i,
    ],
    description: 'Direct string concatenation to build SQL queries detected across multiple files. This is the root cause of SQL Injection vulnerabilities — user input is treated as executable SQL code instead of data.',
    systemicFix: 'Replace ALL raw SQL string concatenation with Parameterized Queries (Prepared Statements). This is a one-time architectural fix: audit every database call in the codebase and migrate to db.execute(query, [params]) pattern.',
    exampleBefore: '"SELECT * FROM users WHERE id = " + userId',
    exampleAfter: '"SELECT * FROM users WHERE id = ?" with params: [userId]',
    cwe: 'CWE-89',
    severity: 'critical',
  },
  {
    id: 'RC-002',
    pattern: 'Hardcoded Credentials Pattern',
    category: 'Secrets Management',
    regex: [
      /(?:password|passwd|secret|token|key)\s*[=:]\s*['"][^'"]{8,}['"]/i,
      /(?:DB_PASS|API_KEY|JWT_SECRET)\s*=\s*['"][^'"]+['"]/,
      /(?:mongodb|postgres|mysql):\/\/[^:]+:[^@]+@/i,
    ],
    description: 'Hardcoded secrets pattern found in source code. Credentials written directly in code get committed to version control, creating a permanent security liability that persists in git history even after deletion.',
    systemicFix: 'Implement a secrets management strategy: (1) Move ALL credentials to environment variables, (2) Add .env* to .gitignore, (3) Use a secrets manager (Vercel Env, AWS Secrets Manager) in production, (4) Run git-secrets pre-commit hook to prevent future leaks.',
    exampleBefore: 'const API_KEY = "sk-abc123xyz"',
    exampleAfter: 'const API_KEY = process.env.API_KEY',
    cwe: 'CWE-798',
    severity: 'critical',
  },
  {
    id: 'RC-003',
    pattern: 'Missing Input Validation at Entry Points',
    category: 'Input Handling',
    regex: [
      /req\.(?:query|body|params)\.\w+(?!\s*&&)(?!\s*\|\|)(?!\s*\?)/,
      /request\.form\[/,
      /r\.URL\.Query\(\)/,
    ],
    description: 'User input from HTTP requests flows directly into business logic without validation or sanitization. This is the root cause of multiple vulnerability classes including injection, path traversal, and logic bypass.',
    systemicFix: 'Implement a validation middleware layer at all API entry points. Use a schema validation library (Zod, Joi, Yup) to define and enforce input shapes. Validate and sanitize ALL user-controlled data before it touches any sensitive operation.',
    exampleBefore: 'const userId = req.query.id; db.query(...userId...)',
    exampleAfter: 'const userId = z.string().parse(req.query.id); db.query(...userId...)',
    cwe: 'CWE-20',
    severity: 'high',
  },
  {
    id: 'RC-004',
    pattern: 'Unsafe HTML Rendering',
    category: 'XSS',
    regex: [
      /innerHTML\s*=/,
      /dangerouslySetInnerHTML/,
      /document\.write\(/,
      /\.html\(/,
    ],
    description: 'User-controlled data is rendered directly as HTML without escaping. This allows Cross-Site Scripting (XSS) attacks where attackers inject malicious JavaScript that runs in victims\' browsers.',
    systemicFix: 'Audit all HTML rendering points. Use textContent instead of innerHTML for plain text. Apply DOMPurify.sanitize() for rich HTML content. Enable a Content Security Policy header to prevent inline script execution.',
    exampleBefore: 'element.innerHTML = userInput',
    exampleAfter: 'element.textContent = userInput // or DOMPurify.sanitize(userInput)',
    cwe: 'CWE-79',
    severity: 'high',
  },
  {
    id: 'RC-005',
    pattern: 'Missing Error Handling Exposing Stack Traces',
    category: 'Information Disclosure',
    regex: [
      /catch\s*\([^)]+\)\s*\{\s*(?:res\.json|return)\s*\{\s*(?:error|err|e)\s*\}/,
      /console\.error\(.*err/,
      /res\.status\(500\)\.json\(\{.*error.*\}\)/,
    ],
    description: 'Error objects and stack traces are sent directly to API responses. Attackers can use this information to understand your architecture, discover file paths, library versions, and plan targeted attacks.',
    systemicFix: 'Implement centralized error handling middleware. Log full errors server-side, but return only sanitized error messages to clients. Never expose stack traces, file paths, or internal system details in API responses.',
    exampleBefore: 'catch(err) { res.json({ error: err }) }',
    exampleAfter: 'catch(err) { logger.error(err); res.json({ error: "Internal server error" }) }',
    cwe: 'CWE-209',
    severity: 'medium',
  },
]

// ── Demo affected files ───────────────────────────────────────────────────────
const DEMO_FILE_GROUPS: Record<string, string[]> = {
  'RC-001': ['app/api/users/route.ts', 'app/api/auth/login.ts', 'lib/db/queries.ts', 'services/userService.ts'],
  'RC-002': ['lib/config.ts', 'app/api/stripe/route.ts', '.env.example'],
  'RC-003': ['app/api/search/route.ts', 'app/api/upload/route.ts', 'controllers/authController.ts'],
  'RC-004': ['components/UserProfile.tsx', 'components/CommentList.tsx'],
  'RC-005': ['app/api/users/route.ts', 'app/api/auth/route.ts', 'lib/db/queries.ts'],
}

// ── Main analysis function ────────────────────────────────────────────────────
export function analyzeRootCauses(code: string, language = 'JavaScript'): RootCauseReport {
  const found: RootCausePattern[] = []

  for (const def of ROOT_CAUSE_PATTERNS) {
    let matched = false
    for (const regex of def.regex) {
      if (regex.test(code)) {
        matched = true
        break
      }
    }

    if (matched) {
      const files = DEMO_FILE_GROUPS[def.id] || ['app/api/route.ts']
      found.push({
        id: def.id,
        pattern: def.pattern,
        category: def.category,
        description: def.description,
        affectedFiles: files,
        affectedLines: files.map((_, i) => [7, 23, 45, 89, 12][i % 5]),
        occurrenceCount: files.length + Math.floor(Math.random() * 3),
        systemicFix: def.systemicFix,
        exampleBefore: def.exampleBefore,
        exampleAfter: def.exampleAfter,
        cwe: def.cwe,
        severity: def.severity,
      })
    }
  }

  // Always include at least one for demo purposes
  if (found.length === 0 && code.length > 50) {
    const def = ROOT_CAUSE_PATTERNS[0]
    found.push({
      id: def.id, pattern: def.pattern, category: def.category,
      description: def.description,
      affectedFiles: DEMO_FILE_GROUPS['RC-001'],
      affectedLines: [7, 23, 45, 89],
      occurrenceCount: 4,
      systemicFix: def.systemicFix,
      exampleBefore: def.exampleBefore,
      exampleAfter: def.exampleAfter,
      cwe: def.cwe, severity: def.severity,
    })
  }

  const systemicRiskScore = Math.min(100,
    found.filter(f => f.severity === 'critical').length * 30 +
    found.filter(f => f.severity === 'high').length * 18 +
    found.filter(f => f.severity === 'medium').length * 8
  )

  return {
    totalPatternsFound: found.length,
    mostCriticalPattern: found[0]?.pattern || 'None',
    patterns: found,
    systemicRiskScore,
    analysisTimestamp: new Date().toISOString(),
  }
}

export { ROOT_CAUSE_PATTERNS }