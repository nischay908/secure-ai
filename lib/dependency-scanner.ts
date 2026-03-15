// lib/dependency-scanner.ts
// Dependency Vulnerability Scanner for CyberSentry AI
// Checks npm packages against known vulnerability databases

export interface DependencyVuln {
  library: string
  currentVersion: string
  vulnerability: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  cvss: number
  cve?: string
  description: string
  fix: string
  fixVersion: string
  publishedDate: string
}

export interface ScanResult {
  totalPackages: number
  vulnerablePackages: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  vulnerabilities: DependencyVuln[]
  scannedAt: string
  riskScore: number // 0–100
}

/* ─────────────────────────────────────────────────
   LOCAL VULNERABILITY DATABASE
   (Offline-first — no external API needed by default)
   Based on real CVEs from NVD / OSV / GitHub Advisories
───────────────────────────────────────────────── */
const VULN_DB: Record<string, DependencyVuln[]> = {
  lodash: [
    {
      library: 'lodash',
      currentVersion: '',
      vulnerability: 'Prototype Pollution',
      severity: 'high',
      cvss: 7.4,
      cve: 'CVE-2019-10744',
      description: 'Versions before 4.17.21 allow attackers to modify Object.prototype by passing specially crafted objects to merge/set methods, enabling denial of service or remote code execution.',
      fix: 'Upgrade to lodash 4.17.21 or later',
      fixVersion: '4.17.21',
      publishedDate: '2019-07-26',
    },
  ],
  moment: [
    {
      library: 'moment',
      currentVersion: '',
      vulnerability: 'ReDoS (Regular Expression DoS)',
      severity: 'medium',
      cvss: 5.5,
      cve: 'CVE-2022-24785',
      description: 'Moment.js path traversal and ReDoS vulnerability. Regex-based date string parsing can be exploited to cause excessive CPU consumption.',
      fix: 'Migrate to date-fns, day.js, or Luxon. If stuck on moment, upgrade to 2.29.4+',
      fixVersion: '2.29.4',
      publishedDate: '2022-04-04',
    },
  ],
  axios: [
    {
      library: 'axios',
      currentVersion: '',
      vulnerability: 'Cross-Site Request Forgery (CSRF)',
      severity: 'medium',
      cvss: 6.5,
      cve: 'CVE-2023-45857',
      description: 'Axios before 1.6.0 exposes confidential XSRF-TOKEN header to a third-party when there is a redirect to a different origin.',
      fix: 'Upgrade to axios 1.6.0 or later',
      fixVersion: '1.6.0',
      publishedDate: '2023-11-08',
    },
  ],
  'node-fetch': [
    {
      library: 'node-fetch',
      currentVersion: '',
      vulnerability: 'Exposure of Sensitive Information',
      severity: 'high',
      cvss: 8.8,
      cve: 'CVE-2022-0235',
      description: 'node-fetch forwards Authorization headers to third-party origins on redirect. This can leak sensitive tokens to attacker-controlled servers.',
      fix: 'Upgrade to node-fetch 2.6.7 / 3.1.1 or later',
      fixVersion: '3.1.1',
      publishedDate: '2022-01-21',
    },
  ],
  'json-schema': [
    {
      library: 'json-schema',
      currentVersion: '',
      vulnerability: 'Prototype Pollution',
      severity: 'critical',
      cvss: 9.8,
      cve: 'CVE-2021-3918',
      description: 'json-schema is vulnerable to Prototype Pollution. The library\'s walk() function allows modifying Object.prototype, enabling authentication bypass or RCE.',
      fix: 'Upgrade to json-schema 0.4.0 or later',
      fixVersion: '0.4.0',
      publishedDate: '2021-11-13',
    },
  ],
  'follow-redirects': [
    {
      library: 'follow-redirects',
      currentVersion: '',
      vulnerability: 'Exposure of Private Personal Information',
      severity: 'medium',
      cvss: 6.5,
      cve: 'CVE-2022-0536',
      description: 'follow-redirects leaks Authorization header data during redirect to a different host.',
      fix: 'Upgrade to follow-redirects 1.14.8 or later',
      fixVersion: '1.14.8',
      publishedDate: '2022-02-09',
    },
  ],
  minimist: [
    {
      library: 'minimist',
      currentVersion: '',
      vulnerability: 'Prototype Pollution',
      severity: 'critical',
      cvss: 9.8,
      cve: 'CVE-2021-44906',
      description: 'minimist before 1.2.6 is vulnerable to prototype pollution. A specially crafted argument string can set arbitrary properties on Object.prototype.',
      fix: 'Upgrade to minimist 1.2.6 or later',
      fixVersion: '1.2.6',
      publishedDate: '2022-03-17',
    },
  ],
  express: [
    {
      library: 'express',
      currentVersion: '',
      vulnerability: 'Open Redirect',
      severity: 'medium',
      cvss: 6.1,
      cve: 'CVE-2022-24999',
      description: 'Express.js before 4.18.2 allows attackers to perform open redirects via specially crafted URLs passed to res.location() or res.redirect().',
      fix: 'Upgrade to express 4.18.2 or later',
      fixVersion: '4.18.2',
      publishedDate: '2022-11-26',
    },
  ],
  'qs': [
    {
      library: 'qs',
      currentVersion: '',
      vulnerability: 'Prototype Poisoning',
      severity: 'high',
      cvss: 8.1,
      cve: 'CVE-2022-24999',
      description: 'qs before 6.11.0 allows prototype poisoning via arrays with no index. Malicious query strings can write to Object.prototype.',
      fix: 'Upgrade to qs 6.11.0 or later',
      fixVersion: '6.11.0',
      publishedDate: '2022-11-26',
    },
  ],
  jsonwebtoken: [
    {
      library: 'jsonwebtoken',
      currentVersion: '',
      vulnerability: 'JWT Signature Bypass',
      severity: 'critical',
      cvss: 9.8,
      cve: 'CVE-2022-23529',
      description: 'jsonwebtoken before 9.0.0 is vulnerable to signature bypass when the algorithm is set to "none". Attackers can forge arbitrary tokens without a secret key.',
      fix: 'Upgrade to jsonwebtoken 9.0.0 and explicitly reject algorithm:none',
      fixVersion: '9.0.0',
      publishedDate: '2022-12-21',
    },
  ],
  'multiparty': [
    {
      library: 'multiparty',
      currentVersion: '',
      vulnerability: 'Denial of Service',
      severity: 'medium',
      cvss: 5.3,
      cve: 'CVE-2022-24434',
      description: 'multiparty before 4.2.3 is vulnerable to DoS. An attacker can trigger excessive memory consumption via a crafted multipart request.',
      fix: 'Upgrade to multiparty 4.2.3 or later',
      fixVersion: '4.2.3',
      publishedDate: '2022-03-21',
    },
  ],
  'dot-prop': [
    {
      library: 'dot-prop',
      currentVersion: '',
      vulnerability: 'Prototype Pollution',
      severity: 'high',
      cvss: 7.5,
      cve: 'CVE-2020-8116',
      description: 'dot-prop before 5.1.1 is vulnerable to prototype pollution via the set() function.',
      fix: 'Upgrade to dot-prop 6.0.1 or later',
      fixVersion: '6.0.1',
      publishedDate: '2020-02-04',
    },
  ],
}

/* ─────────────────────────────────────────────────
   VERSION COMPARISON UTILITY
───────────────────────────────────────────────── */
function parseVersion(v: string): number[] {
  return v
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
    .slice(0, 3)
}

function isVulnerable(current: string, fixVersion: string): boolean {
  const cur = parseVersion(current)
  const fix = parseVersion(fixVersion)
  for (let i = 0; i < 3; i++) {
    const c = cur[i] || 0
    const f = fix[i] || 0
    if (c < f) return true
    if (c > f) return false
  }
  return false // equal = patched
}

/* ─────────────────────────────────────────────────
   MAIN SCANNER FUNCTION
   Accepts parsed package.json dependencies object
───────────────────────────────────────────────── */
export function scanDependencies(
  dependencies: Record<string, string>
): ScanResult {
  const vulnerabilities: DependencyVuln[] = []

  for (const [pkg, versionRaw] of Object.entries(dependencies)) {
    const version = versionRaw.replace(/[\^~>=<]/g, '').trim()
    const knownVulns = VULN_DB[pkg]

    if (knownVulns) {
      for (const vuln of knownVulns) {
        if (isVulnerable(version, vuln.fixVersion)) {
          vulnerabilities.push({ ...vuln, currentVersion: version })
        }
      }
    }
  }

  // Sort by CVSS descending
  vulnerabilities.sort((a, b) => b.cvss - a.cvss)

  const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length
  const highCount = vulnerabilities.filter((v) => v.severity === 'high').length
  const mediumCount = vulnerabilities.filter((v) => v.severity === 'medium').length
  const lowCount = vulnerabilities.filter((v) => v.severity === 'low').length

  // Risk score: weighted sum capped at 100
  const riskScore = Math.min(
    100,
    criticalCount * 25 + highCount * 15 + mediumCount * 8 + lowCount * 3
  )

  return {
    totalPackages: Object.keys(dependencies).length,
    vulnerablePackages: new Set(vulnerabilities.map((v) => v.library)).size,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    vulnerabilities,
    scannedAt: new Date().toISOString(),
    riskScore,
  }
}

/* ─────────────────────────────────────────────────
   DEMO DATA — used when no real package.json provided
───────────────────────────────────────────────── */
export function getDemoScanResult(): ScanResult {
  const demoDeps: Record<string, string> = {
    express: '4.17.1',
    lodash: '4.17.15',
    axios: '0.21.1',
    'json-schema': '0.2.5',
    jsonwebtoken: '8.5.1',
    minimist: '1.2.5',
    moment: '2.29.1',
    'follow-redirects': '1.14.0',
    'node-fetch': '2.6.0',
    qs: '6.5.2',
    react: '18.2.0',
    next: '14.0.0',
    typescript: '5.0.0',
    tailwindcss: '3.3.0',
  }
  return scanDependencies(demoDeps)
}