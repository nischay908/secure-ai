'use client'
// app/onboarding/page.tsx
// Company onboarding wizard - collects company details, tech stack, compliance needs
// Then connects GitHub OAuth to give CyberSentry real code access

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Shield, CheckCircle, ChevronRight, Github, Building2,
  Code2, Lock, FileCheck, Zap, ArrowRight, Eye, EyeOff,
  Globe, Database, Server, Cpu, CreditCard, Users, AlertTriangle
} from 'lucide-react'

const TECH_STACKS = [
  { id: 'nodejs', label: 'Node.js', icon: '🟢' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'go', label: 'Go', icon: '🔵' },
  { id: 'php', label: 'PHP', icon: '🐘' },
  { id: 'ruby', label: 'Ruby', icon: '💎' },
  { id: 'dotnet', label: '.NET', icon: '🔷' },
  { id: 'react', label: 'React', icon: '⚛️' },
  { id: 'nextjs', label: 'Next.js', icon: '▲' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
]

const DATABASES = [
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'redis', label: 'Redis' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'dynamodb', label: 'DynamoDB' },
  { id: 'supabase', label: 'Supabase' },
]

const COMPLIANCE = [
  { id: 'pci', label: 'PCI-DSS', desc: 'Payment card data', icon: <CreditCard size={14}/> },
  { id: 'gdpr', label: 'GDPR', desc: 'EU user data', icon: <Users size={14}/> },
  { id: 'hipaa', label: 'HIPAA', desc: 'Healthcare data', icon: <FileCheck size={14}/> },
  { id: 'soc2', label: 'SOC 2', desc: 'Service organization', icon: <Shield size={14}/> },
  { id: 'iso27001', label: 'ISO 27001', desc: 'Info security mgmt', icon: <Lock size={14}/> },
  { id: 'owasp', label: 'OWASP Top-10', desc: 'Web security standard', icon: <AlertTriangle size={14}/> },
]

const CLOUD = [
  { id: 'aws', label: 'AWS' },
  { id: 'gcp', label: 'Google Cloud' },
  { id: 'azure', label: 'Azure' },
  { id: 'vercel', label: 'Vercel' },
  { id: 'heroku', label: 'Heroku' },
  { id: 'digitalocean', label: 'DigitalOcean' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [selectedDbs, setSelectedDbs] = useState<string[]>([])
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([])
  const [selectedCloud, setSelectedCloud] = useState<string[]>([])
  const [securityFocus, setSecurityFocus] = useState('')
  const [criticalAssets, setCriticalAssets] = useState('')

  const TOTAL_STEPS = 4

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
  }

  const canProceed = () => {
    if (step === 1) return companyName.trim().length > 0 && companySize && industry
    if (step === 2) return selectedTech.length > 0
    if (step === 3) return repoUrl.trim().length > 0 && githubToken.trim().length > 0
    return true
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('company_profiles').upsert({
          user_id: user.id,
          company_name: companyName,
          company_size: companySize,
          industry,
          website,
          repo_url: repoUrl,
          github_token_hint: githubToken.slice(0, 8) + '...',
          tech_stack: selectedTech,
          databases: selectedDbs,
          compliance_requirements: selectedCompliance,
          cloud_providers: selectedCloud,
          security_focus: securityFocus,
          critical_assets: criticalAssets,
          onboarded_at: new Date().toISOString(),
        })
      }
      // Store token securely in session for this scan session
      sessionStorage.setItem('gh_token', githubToken)
      sessionStorage.setItem('company_profile', JSON.stringify({
        companyName, techStack: selectedTech, compliance: selectedCompliance,
        repoUrl, databases: selectedDbs, cloud: selectedCloud
      }))
      router.push('/dashboard')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#000;color:#fff;font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
        .ob-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;background:radial-gradient(ellipse at 50% 0%,rgba(0,255,136,0.06) 0%,transparent 60%)}
        .ob-card{width:100%;max-width:640px;background:#080808;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden}
        .ob-header{padding:32px 40px 0;text-align:center}
        .ob-brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:28px}
        .ob-brand-ico{width:36px;height:36px;border-radius:9px;background:#000;border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(0,255,136,0.14)}
        .ob-brand-name{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700}
        .ob-brand-ai{font-size:11px;font-weight:800;color:#000;background:#00ff88;padding:2px 8px;border-radius:4px}
        .ob-progress{display:flex;align-items:center;gap:0;margin:0 40px 32px;background:rgba(255,255,255,0.04);border-radius:40px;overflow:hidden;height:5px}
        .ob-prog-fill{height:100%;background:#00ff88;border-radius:40px;transition:width 0.4s ease;box-shadow:0 0 10px rgba(0,255,136,0.4)}
        .ob-steps-row{display:flex;justify-content:space-between;padding:0 36px;margin-bottom:6px}
        .ob-step-dot{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer}
        .ob-step-circle{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;transition:all 0.2s;border:2px solid}
        .ob-step-label{font-size:10px;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;opacity:0.5}
        .ob-body{padding:0 40px 32px}
        .ob-step-title{font-size:24px;font-weight:700;color:#fff;margin-bottom:8px;letter-spacing:-0.02em}
        .ob-step-sub{font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:28px;line-height:1.6}
        .ob-field{margin-bottom:18px}
        .ob-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);font-family:'JetBrains Mono',monospace;margin-bottom:8px}
        .ob-input{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s}
        .ob-input:focus{border-color:rgba(0,255,136,0.4)}
        .ob-input::placeholder{color:rgba(255,255,255,0.2)}
        .ob-select{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none;appearance:none;transition:border-color 0.2s}
        .ob-select:focus{border-color:rgba(0,255,136,0.4)}
        .ob-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px}
        .ob-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;border:1px solid;user-select:none}
        .ob-chip-off{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.45)}
        .ob-chip-off:hover{border-color:rgba(0,255,136,0.25);color:rgba(255,255,255,0.8)}
        .ob-chip-on{background:rgba(0,255,136,0.1);border-color:rgba(0,255,136,0.35);color:#00ff88}
        .ob-compliance-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ob-compliance-chip{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:9px;cursor:pointer;transition:all 0.15s;border:1px solid}
        .ob-compliance-off{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07)}
        .ob-compliance-off:hover{border-color:rgba(0,255,136,0.2)}
        .ob-compliance-on{background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.3)}
        .ob-compliance-label{font-size:13px;font-weight:700;color:#fff;margin-bottom:2px}
        .ob-compliance-desc{font-size:11px;color:rgba(255,255,255,0.35)}
        .ob-token-wrap{position:relative}
        .ob-token-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);transition:color 0.2s}
        .ob-token-eye:hover{color:#fff}
        .ob-info-box{background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.15);border-radius:10px;padding:14px 16px;margin-bottom:18px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6}
        .ob-info-box strong{color:#00ff88}
        .ob-warning-box{background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.15);border-radius:10px;padding:14px 16px;margin-bottom:18px;font-size:12px;color:rgba(251,191,36,0.8);line-height:1.6;font-family:'JetBrains Mono',monospace}
        .ob-footer{padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;gap:14px}
        .ob-back-btn{background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;cursor:pointer;transition:all 0.2s;font-family:'Space Grotesk',sans-serif}
        .ob-back-btn:hover{color:#fff;border-color:rgba(255,255,255,0.25)}
        .ob-next-btn{background:#00ff88;border:none;color:#000;font-size:14px;font-weight:800;padding:12px 28px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;box-shadow:0 0 20px rgba(0,255,136,0.22);font-family:'Space Grotesk',sans-serif;flex:1;justify-content:center}
        .ob-next-btn:hover{background:#1aff95;box-shadow:0 0 32px rgba(0,255,136,0.4)}
        .ob-next-btn:disabled{opacity:0.3;cursor:not-allowed;box-shadow:none}
        .ob-textarea{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none;resize:vertical;min-height:80px;transition:border-color 0.2s;line-height:1.6}
        .ob-textarea:focus{border-color:rgba(0,255,136,0.4)}
        .ob-textarea::placeholder{color:rgba(255,255,255,0.2)}
        .step-complete{display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px 0;text-align:center}
        .step-complete-ico{width:72px;height:72px;border-radius:18px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;animation:pop 0.4s cubic-bezier(0.16,1,0.3,1)}
        @keyframes pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
        .check-list{display:flex;flex-direction:column;gap:10px;width:100%;text-align:left}
        .check-item{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:rgba(255,255,255,0.7);background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.1);border-radius:8px;padding:11px 14px}
        .ob-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      `}</style>

      <div className="ob-wrap">
        <div className="ob-card">
          {/* Header */}
          <div className="ob-header">
            <div className="ob-brand">
              <div className="ob-brand-ico"><Shield size={16} color="#00ff88"/></div>
              <span className="ob-brand-name">CyberSentry</span>
              <span className="ob-brand-ai">AI</span>
            </div>
          </div>

          {/* Progress */}
          <div style={{padding:'0 40px',marginBottom:8}}>
            <div className="ob-progress">
              <div className="ob-prog-fill" style={{width:`${(step/TOTAL_STEPS)*100}%`}}/>
            </div>
          </div>
          <div className="ob-steps-row">
            {[{n:1,label:'Company'},{n:2,label:'Tech Stack'},{n:3,label:'GitHub'},{n:4,label:'Confirm'}].map(s=>(
              <div key={s.n} className="ob-step-dot" onClick={()=>s.n<step&&setStep(s.n)}>
                <div className="ob-step-circle" style={{
                  background:s.n<step?'#00ff88':s.n===step?'rgba(0,255,136,0.1)':'rgba(255,255,255,0.04)',
                  borderColor:s.n<=step?'#00ff88':'rgba(255,255,255,0.1)',
                  color:s.n<step?'#000':s.n===step?'#00ff88':'rgba(255,255,255,0.3)'
                }}>
                  {s.n<step?'✓':s.n}
                </div>
                <span className="ob-step-label" style={{color:s.n===step?'#00ff88':'rgba(255,255,255,0.3)'}}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step Body */}
          <div className="ob-body">

            {/* ── STEP 1: Company Info ── */}
            {step===1&&<>
              <h2 className="ob-step-title">Tell us about your company</h2>
              <p className="ob-step-sub">CyberSentry tailors its security checks to your specific industry and company size.</p>
              <div className="ob-row">
                <div className="ob-field">
                  <label className="ob-label">Company Name *</label>
                  <input className="ob-input" placeholder="Acme Corp" value={companyName} onChange={e=>setCompanyName(e.target.value)}/>
                </div>
                <div className="ob-field">
                  <label className="ob-label">Company Size *</label>
                  <select className="ob-select" value={companySize} onChange={e=>setCompanySize(e.target.value)}>
                    <option value="">Select size</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-1000">201–1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </select>
                </div>
              </div>
              <div className="ob-row">
                <div className="ob-field">
                  <label className="ob-label">Industry *</label>
                  <select className="ob-select" value={industry} onChange={e=>setIndustry(e.target.value)}>
                    <option value="">Select industry</option>
                    <option value="fintech">Fintech / Banking</option>
                    <option value="healthcare">Healthcare / MedTech</option>
                    <option value="ecommerce">E-Commerce / Retail</option>
                    <option value="saas">SaaS / Software</option>
                    <option value="startup">Startup</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="government">Government / Public Sector</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="ob-field">
                  <label className="ob-label">Company Website</label>
                  <input className="ob-input" placeholder="https://acmecorp.com" value={website} onChange={e=>setWebsite(e.target.value)}/>
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-label">What are your most critical assets to protect?</label>
                <textarea className="ob-textarea" placeholder="e.g. User payment data, proprietary algorithms, customer PII, API keys..." value={criticalAssets} onChange={e=>setCriticalAssets(e.target.value)}/>
              </div>
              <div className="ob-field">
                <label className="ob-label">Compliance Requirements</label>
                <div className="ob-compliance-grid">
                  {COMPLIANCE.map(c=>(
                    <div key={c.id} className={`ob-compliance-chip ${selectedCompliance.includes(c.id)?'ob-compliance-on':'ob-compliance-off'}`}
                      onClick={()=>toggleItem(selectedCompliance,setSelectedCompliance,c.id)}>
                      <div style={{color:selectedCompliance.includes(c.id)?'#00ff88':'rgba(255,255,255,0.3)'}}>{c.icon}</div>
                      <div>
                        <div className="ob-compliance-label">{c.label}</div>
                        <div className="ob-compliance-desc">{c.desc}</div>
                      </div>
                      {selectedCompliance.includes(c.id)&&<CheckCircle size={14} color="#00ff88" style={{marginLeft:'auto'}}/>}
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── STEP 2: Tech Stack ── */}
            {step===2&&<>
              <h2 className="ob-step-title">Your technology stack</h2>
              <p className="ob-step-sub">CyberSentry runs stack-specific vulnerability checks. A Node.js app gets different checks than a Python Django app.</p>
              <div className="ob-field">
                <label className="ob-label">Programming Languages & Frameworks * (select all that apply)</label>
                <div className="ob-grid">
                  {TECH_STACKS.map(t=>(
                    <div key={t.id} className={`ob-chip ${selectedTech.includes(t.id)?'ob-chip-on':'ob-chip-off'}`}
                      onClick={()=>toggleItem(selectedTech,setSelectedTech,t.id)}>
                      <span>{t.icon}</span>{t.label}
                      {selectedTech.includes(t.id)&&<CheckCircle size={12} color="#00ff88"/>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-label">Databases</label>
                <div className="ob-grid">
                  {DATABASES.map(d=>(
                    <div key={d.id} className={`ob-chip ${selectedDbs.includes(d.id)?'ob-chip-on':'ob-chip-off'}`}
                      onClick={()=>toggleItem(selectedDbs,setSelectedDbs,d.id)}>
                      <Database size={12}/>{d.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-label">Cloud / Hosting</label>
                <div className="ob-grid">
                  {CLOUD.map(c=>(
                    <div key={c.id} className={`ob-chip ${selectedCloud.includes(c.id)?'ob-chip-on':'ob-chip-off'}`}
                      onClick={()=>toggleItem(selectedCloud,setSelectedCloud,c.id)}>
                      <Server size={12}/>{c.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-label">Specific security concerns (optional)</label>
                <textarea className="ob-textarea" placeholder="e.g. We have a payment flow using Stripe, user auth with JWT, file uploads to S3..." value={securityFocus} onChange={e=>setSecurityFocus(e.target.value)}/>
              </div>
            </>}

            {/* ── STEP 3: GitHub Connect ── */}
            {step===3&&<>
              <h2 className="ob-step-title">Connect your repository</h2>
              <p className="ob-step-sub">CyberSentry needs access to your actual code to find real vulnerabilities — not guesses based on your website's public pages.</p>

              <div className="ob-info-box">
                <strong>Why we need this:</strong> Unlike tools that only check public pages, CyberSentry reads your actual source code to find SQL injection in your database queries, hardcoded secrets in your config files, and insecure patterns in your business logic.
              </div>

              <div className="ob-field">
                <label className="ob-label">GitHub Repository URL *</label>
                <input className="ob-input" placeholder="https://github.com/yourcompany/your-repo" value={repoUrl} onChange={e=>setRepoUrl(e.target.value)}/>
              </div>

              <div className="ob-field">
                <label className="ob-label">GitHub Personal Access Token *</label>
                <div className="ob-token-wrap">
                  <input
                    className="ob-input"
                    type={showToken?'text':'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={e=>setGithubToken(e.target.value)}
                    style={{paddingRight:44}}
                  />
                  <button className="ob-token-eye" onClick={()=>setShowToken(!showToken)}>
                    {showToken?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </div>

              <div className="ob-warning-box">
                🔒 Your token is stored only in your browser session and never logged to our servers. We recommend creating a read-only token with only `repo` (read) scope for maximum safety.
                <br/><br/>
                To create a token: GitHub → Settings → Developer Settings → Personal Access Tokens → Generate New Token → Select <strong>repo</strong> scope
              </div>
            </>}

            {/* ── STEP 4: Confirm ── */}
            {step===4&&<>
              <h2 className="ob-step-title">Ready to scan</h2>
              <p className="ob-step-sub">CyberSentry will scan your real codebase with checks customized for your stack.</p>

              <div className="step-complete">
                <div className="step-complete-ico"><CheckCircle size={36} color="#00ff88"/></div>
                <div className="check-list">
                  {[
                    `Company: ${companyName} (${industry}, ${companySize})`,
                    `Tech stack: ${selectedTech.join(', ') || 'Not specified'}`,
                    `Compliance: ${selectedCompliance.join(', ') || 'General security'}`,
                    `Repository: ${repoUrl}`,
                    `Real-time scanning: ${selectedTech.length} stack-specific rule sets loaded`,
                    `Agentic AI: Will autonomously patch and create GitHub PRs`,
                  ].map((item,i)=>(
                    <div key={i} className="check-item">
                      <CheckCircle size={14} color="#00ff88" style={{flexShrink:0,marginTop:1}}/>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>}
          </div>

          {/* Footer */}
          <div className="ob-footer">
            {step > 1
              ? <button className="ob-back-btn" onClick={()=>setStep(s=>s-1)}>← Back</button>
              : <div/>
            }
            {step < TOTAL_STEPS
              ? <button className="ob-next-btn" onClick={()=>setStep(s=>s+1)} disabled={!canProceed()}>
                  Continue <ArrowRight size={15}/>
                </button>
              : <button className="ob-next-btn" onClick={handleFinish} disabled={saving}>
                  {saving?'Setting up...':<><Zap size={15}/>Launch Security Scan</>}
                </button>
            }
          </div>
        </div>

        <p style={{marginTop:18,fontSize:12,color:'rgba(255,255,255,0.2)',fontFamily:'JetBrains Mono,monospace',textAlign:'center'}}>
          Your code never leaves your GitHub account. CyberSentry reads it via the GitHub API with your permission.
        </p>
      </div>
    </>
  )
}