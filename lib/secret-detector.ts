// lib/secret-detector.ts
// Secret Leak Detection Engine for CyberSentry AI
// NOTE: All patterns below use regex matching only — no real secrets stored here

export type SecretSeverity = 'critical' | 'high' | 'medium'

export interface SecretLeak {
  id: string
  type: string
  category: string
  file: string
  line: number
  lineContent: string
  severity: SecretSeverity
  cvss: number
  description: string
  recommendation: string
  envVarName: string
  patchedLine: string
  redacted: string
}

export interface SecretScanResult {
  totalScanned: number
  leaksFound: number
  criticalCount: number
  highCount: number
  mediumCount: number
  leaks: SecretLeak[]
  riskScore: number
  scannedAt: string
}

// ── Pattern definitions (regex only, no example secrets stored) ──────────────
interface PatternDef {
  type: string
  category: string
  regex: RegExp
  severity: SecretSeverity
  cvss: number
  description: string
  recommendation: string
  envVar: string
}

const PATTERNS: PatternDef[] = [
  {
    type: 'AWS Access Key ID',
    category: 'Cloud Credentials',
    regex: /AKIA[0-9A-Z]{16}/,
    severity: 'critical', cvss: 9.8,
    description: 'AWS Access Key ID found in source code. Attackers can use this to access your AWS account, read S3 buckets, launch EC2 instances, and run up massive bills.',
    recommendation: 'Revoke this key immediately in the AWS IAM console. Move to process.env.AWS_ACCESS_KEY_ID and use IAM roles in production.',
    envVar: 'AWS_ACCESS_KEY_ID',
  },
  {
    type: 'AWS Secret Access Key',
    category: 'Cloud Credentials',
    regex: /(?:aws.?secret.?(?:access.?)?key|AWS_SECRET)['":\s=]+['"]?([A-Za-z0-9+/]{40})['"]?/i,
    severity: 'critical', cvss: 9.8,
    description: 'AWS Secret Access Key found. Combined with the Access Key ID, this provides full programmatic access to your AWS account.',
    recommendation: 'Rotate this key in AWS IAM immediately. Use process.env.AWS_SECRET_ACCESS_KEY.',
    envVar: 'AWS_SECRET_ACCESS_KEY',
  },
  {
    type: 'Stripe Secret Key',
    category: 'Payment Credentials',
    // Split pattern so the literal string is never reconstructed in this file
    regex: new RegExp('s' + 'k' + '_(?:live|test)_[0-9a-zA-Z]{24,}'),
    severity: 'critical', cvss: 9.5,
    description: 'Stripe API key found. Live keys allow reading customer data, issuing refunds, creating charges, and full Stripe account manipulation.',
    recommendation: 'Immediately revoke this key in the Stripe dashboard. Use process.env.STRIPE_SECRET_KEY.',
    envVar: 'STRIPE_SECRET_KEY',
  },
  {
    type: 'OpenAI API Key',
    category: 'AI Credentials',
    // Pattern split to avoid false positive detection
    regex: new RegExp('s' + 'k-[A-Za-z0-9]{48}'),
    severity: 'high', cvss: 8.0,
    description: 'OpenAI API key exposed. Attackers can make API calls at your expense, potentially running up thousands of dollars in charges.',
    recommendation: 'Revoke in OpenAI dashboard. Move to process.env.OPENAI_API_KEY.',
    envVar: 'OPENAI_API_KEY',
  },
  {
    type: 'Anthropic API Key',
    category: 'AI Credentials',
    regex: new RegExp('s' + 'k-ant-[A-Za-z0-9\\-_]{40,}'),
    severity: 'high', cvss: 8.0,
    description: 'Anthropic Claude API key exposed. Attackers can make expensive API calls at your cost.',
    recommendation: 'Revoke in Anthropic console. Use process.env.ANTHROPIC_API_KEY.',
    envVar: 'ANTHROPIC_API_KEY',
  },
  {
    type: 'GitHub Personal Access Token',
    category: 'Version Control',
    regex: new RegExp('g' + 'hp_[A-Za-z0-9]{36}'),
    severity: 'critical', cvss: 9.5,
    description: 'GitHub Personal Access Token found. Attacker gains full access to your repositories, can push code, delete branches, and access private repos.',
    recommendation: 'Revoke this token immediately in GitHub Settings → Developer Settings → Personal Access Tokens.',
    envVar: 'GITHUB_TOKEN',
  },
  {
    type: 'JWT Secret',
    category: 'Authentication',
    regex: /(?:jwt.?secret|JWT_SECRET)['":\s=]+['"]([A-Za-z0-9!@#$%^&*\-_]{16,})['"]/i,
    severity: 'critical', cvss: 9.8,
    description: 'JWT signing secret exposed. Attackers can forge authentication tokens for ANY user including admins, with no password required.',
    recommendation: 'Rotate JWT secret immediately. Use process.env.JWT_SECRET with a random 256-bit value.',
    envVar: 'JWT_SECRET',
  },
  {
    type: 'Database Password',
    category: 'Database Credentials',
    regex: /(?:DB_PASS(?:WORD)?|db_pass(?:word)?|database_pass(?:word)?)\s*[=:]\s*['"]([^'"]{6,})['"]/i,
    severity: 'critical', cvss: 9.0,
    description: 'Database password hardcoded in source. Attacker gains direct read/write access to your entire database.',
    recommendation: 'Rotate the database password. Use process.env.DB_PASSWORD.',
    envVar: 'DB_PASSWORD',
  },
  {
    type: 'Database Connection String',
    category: 'Database Credentials',
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@[^/'";\s]+/i,
    severity: 'critical', cvss: 9.5,
    description: 'Full database connection string with embedded credentials found. This gives direct database access to anyone who reads the code.',
    recommendation: 'Move the entire connection string to process.env.DATABASE_URL. Rotate credentials immediately.',
    envVar: 'DATABASE_URL',
  },
  {
    type: 'Generic API Key',
    category: 'API Credentials',
    regex: /(?:api.?key|apikey)['":\s=]+['"]([A-Za-z0-9\-_]{20,80})['"]/i,
    severity: 'high', cvss: 7.5,
    description: 'A plaintext API key is hardcoded in source code. This gives anyone who reads your code full access to that API service.',
    recommendation: 'Move to process.env.API_KEY. Add .env to .gitignore. Rotate the exposed key immediately.',
    envVar: 'API_KEY',
  },
  {
    type: 'Hardcoded Password',
    category: 'Authentication',
    regex: /(?:password|passwd)\s*[=:]\s*['"]([^'"]{8,})['"]/i,
    severity: 'high', cvss: 7.5,
    description: 'Password string hardcoded directly in source code. Anyone with code access has this credential.',
    recommendation: 'Move to process.env.PASSWORD. Never hardcode passwords.',
    envVar: 'SECRET_PASSWORD',
  },
  {
    type: 'RSA Private Key',
    category: 'Cryptographic Keys',
    regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
    severity: 'critical', cvss: 10.0,
    description: 'Private key found in source code. This can be used to decrypt TLS traffic, forge signatures, or impersonate your server.',
    recommendation: 'Revoke and regenerate this key pair immediately. Never store private keys in source code.',
    envVar: 'PRIVATE_KEY',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function redact(value: string): string {
  if (value.length <= 8) return '●●●●●'
  const visible = Math.min(5, Math.floor(value.length * 0.2))
  return value.slice(0, visible) + '●●●●●' + value.slice(-2)
}

function patchLine(line: string, envVar: string, language = 'JavaScript'): string {
  const ref: Record<string, string> = {
    JavaScript: `process.env.${envVar}`,
    TypeScript: `process.env.${envVar}`,
    Python: `os.environ['${envVar}']`,
    Java: `System.getenv("${envVar}")`,
    Go: `os.Getenv("${envVar}")`,
  }
  const replacement = ref[language] || `process.env.${envVar}`
  return line.replace(/['"][A-Za-z0-9+/=\-_.@]{8,}['"]/g, replacement)
}

// ── Main scan function ────────────────────────────────────────────────────────
export function scanForSecrets(
  code: string,
  fileName = 'uploaded-code',
  language = 'JavaScript'
): SecretScanResult {
  const lines = code.split('\n')
  const leaks: SecretLeak[] = []
  let idCounter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    // Skip pure comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue

    for (const pat of PATTERNS) {
      const match = pat.regex.exec(line)
      if (match) {
        const secretValue = match[1] || match[0]
        leaks.push({
          id: `leak-${++idCounter}`,
          type: pat.type,
          category: pat.category,
          file: fileName,
          line: i + 1,
          lineContent: trimmed.slice(0, 120),
          severity: pat.severity,
          cvss: pat.cvss,
          description: pat.description,
          recommendation: pat.recommendation,
          envVarName: pat.envVar,
          patchedLine: patchLine(line, pat.envVar, language).trim(),
          redacted: redact(secretValue),
        })
        break
      }
    }
  }

  const criticalCount = leaks.filter(l => l.severity === 'critical').length
  const highCount = leaks.filter(l => l.severity === 'high').length
  const mediumCount = leaks.filter(l => l.severity === 'medium').length

  return {
    totalScanned: lines.length,
    leaksFound: leaks.length,
    criticalCount, highCount, mediumCount,
    leaks,
    riskScore: Math.min(100, criticalCount * 28 + highCount * 16 + mediumCount * 8),
    scannedAt: new Date().toISOString(),
  }
}