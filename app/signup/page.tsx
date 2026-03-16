'use client'
// app/signup/page.tsx — Company signs up with company name first, then work email
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'company'|'account'>('company')
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [industry, setIndustry] = useState('')
  const [firstName, setFirstName] = useState('')
  const [workEmail, setWorkEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const goNext = () => {
    if (!companyName.trim() || !companySize || !industry) { setError('Please fill in all fields'); return }
    setError(''); setStep('account')
  }

  const handleSignup = async () => {
    if (!workEmail.trim() || !password.trim() || !firstName.trim()) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signUp({
        email: workEmail, password,
        options: { data: { first_name: firstName, company_name: companyName, company_size: companySize, industry } }
      })
      if (err) throw err
      sessionStorage.setItem('signup_company', JSON.stringify({ companyName, companySize, industry, firstName }))
      router.push('/onboarding')
    } catch (err: any) { setError(err.message || 'Signup failed') }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#030303;color:#fff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
        .su-wrap{min-height:100vh;display:grid;grid-template-columns:1fr 1fr}
        @media(max-width:860px){.su-wrap{grid-template-columns:1fr}}
        .su-left{background:#000;border-right:1px solid rgba(255,255,255,0.06);padding:52px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
        .su-left::before{content:'';position:absolute;bottom:-80px;left:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(0,255,136,0.08) 0%,transparent 70%);pointer-events:none;border-radius:50%}
        @media(max-width:860px){.su-left{display:none}}
        .su-brand{display:flex;align-items:center;gap:10px}
        .su-brand-ico{width:36px;height:36px;border-radius:9px;background:#030303;border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;font-size:18px}
        .su-brand-name{font-family:'Syne',sans-serif;font-size:18px;font-weight:800}
        .su-brand-tag{font-size:10px;font-weight:800;color:#000;background:#00ff88;padding:2px 7px;border-radius:4px}
        .su-left-mid{flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px}
        .su-left-h{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1.12;letter-spacing:-0.03em}
        .su-left-h span{color:#00ff88}
        .su-feats{display:flex;flex-direction:column;gap:16px}
        .su-feat{display:flex;align-items:flex-start;gap:12px}
        .su-feat-ico{width:34px;height:34px;border-radius:8px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.14);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-top:1px}
        .su-feat-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:3px}
        .su-feat-desc{font-size:13px;color:rgba(255,255,255,0.38);line-height:1.5}
        .su-trust{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.25);padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)}
        .su-right{padding:52px 60px;display:flex;flex-direction:column;justify-content:center}
        @media(max-width:600px){.su-right{padding:32px 24px}}
        .su-inner{max-width:400px;width:100%;margin:0 auto}
        .su-back-btn{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;font-size:12px;margin-bottom:28px;padding:0;display:flex;align-items:center;gap:6px;transition:color 0.2s}
        .su-back-btn:hover{color:#00ff88}
        .su-dots{display:flex;gap:8px;margin-bottom:24px}
        .su-dot{height:4px;width:28px;border-radius:10px;transition:background 0.3s}
        .su-h2{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-0.02em}
        .su-sub{font-size:14px;color:rgba(255,255,255,0.38);margin-bottom:24px;line-height:1.6}
        .su-lbl{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.38);margin-bottom:7px;font-family:'JetBrains Mono',monospace}
        .su-inp{width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:13px 16px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s;margin-bottom:14px}
        .su-inp:focus{border-color:rgba(0,255,136,0.4)}
        .su-inp::placeholder{color:rgba(255,255,255,0.2)}
        .su-sel{width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:13px 16px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;appearance:none;transition:border-color 0.2s;margin-bottom:14px;cursor:pointer}
        .su-sel:focus{border-color:rgba(0,255,136,0.4)}
        .su-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .su-pass-wrap{position:relative;margin-bottom:14px}
        .su-pass-inp{width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:13px 44px 13px 16px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s}
        .su-pass-inp:focus{border-color:rgba(0,255,136,0.4)}
        .su-pass-inp::placeholder{color:rgba(255,255,255,0.2)}
        .su-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);padding:4px;font-size:15px}
        .su-eye:hover{color:#fff}
        .su-err{background:rgba(255,59,59,0.07);border:1px solid rgba(255,59,59,0.2);border-radius:8px;padding:11px 14px;font-size:13px;color:#ff6b6b;margin-bottom:14px;font-family:'JetBrains Mono',monospace}
        .su-hint{font-size:11px;color:rgba(0,255,136,0.65);margin-top:-10px;margin-bottom:14px;font-family:'JetBrains Mono',monospace}
        .su-btn{width:100%;padding:15px;background:#00ff88;border:none;border-radius:9px;color:#000;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:800;cursor:pointer;transition:all 0.2s;box-shadow:0 0 22px rgba(0,255,136,0.2);margin-top:4px}
        .su-btn:hover{background:#1aff95;box-shadow:0 0 34px rgba(0,255,136,0.35)}
        .su-btn:disabled{opacity:0.4;cursor:not-allowed;box-shadow:none}
        .su-login{text-align:center;font-size:14px;color:rgba(255,255,255,0.38);margin-top:18px}
        .su-login a{color:#00ff88;cursor:pointer;font-weight:600}
        .su-terms{font-size:11px;color:rgba(255,255,255,0.22);text-align:center;margin-top:14px;line-height:1.6}
      `}</style>

      <div className="su-wrap">
        {/* LEFT */}
        <div className="su-left">
          <div className="su-brand"><div className="su-brand-ico">🛡️</div><span className="su-brand-name">CyberSentry</span><span className="su-brand-tag">AI</span></div>
          <div className="su-left-mid">
            <h2 className="su-left-h">The AI Security<br/>Engineer for<br/><span>your company.</span></h2>
            <div className="su-feats">
              {[{ico:'🔍',t:'Scans your real code',d:'Connects to your GitHub and finds SQL injection, hardcoded secrets, and XSS in your actual source files.'},
                {ico:'🔧',t:'Auto-generates fixes',d:'AI writes the secure version of your code and opens a GitHub Pull Request. You just review and merge.'},
                {ico:'📡',t:'Monitors every commit',d:'Every push to GitHub triggers a scan. Vulnerabilities are caught before they reach production.'}
              ].map((f,i)=><div key={i} className="su-feat"><div className="su-feat-ico">{f.ico}</div><div><div className="su-feat-title">{f.t}</div><div className="su-feat-desc">{f.d}</div></div></div>)}
            </div>
          </div>
          <div className="su-trust">🔒 Your code is accessed read-only via GitHub API and never stored on our servers.</div>
        </div>

        {/* RIGHT */}
        <div className="su-right">
          <div className="su-inner">
            <button className="su-back-btn" onClick={()=>step==='account'?setStep('company'):router.push('/')}>← {step==='account'?'Back':'Home'}</button>
            <div className="su-dots"><div className="su-dot" style={{background:'#00ff88'}}/><div className="su-dot" style={{background:step==='account'?'#00ff88':'rgba(255,255,255,0.1)'}}/></div>

            {step==='company'?<>
              <h2 className="su-h2">Set up your company</h2>
              <p className="su-sub">CyberSentry tailors security checks to your industry and tech stack.</p>
              {error&&<div className="su-err">{error}</div>}
              <label className="su-lbl">Company Name *</label>
              <input className="su-inp" placeholder="e.g. Acme Technologies" value={companyName} onChange={e=>setCompanyName(e.target.value)}/>
              <div className="su-row">
                <div>
                  <label className="su-lbl">Size *</label>
                  <select className="su-sel" value={companySize} onChange={e=>setCompanySize(e.target.value)}>
                    <option value="">Select...</option>
                    <option value="1-10">1–10</option><option value="11-50">11–50</option>
                    <option value="51-200">51–200</option><option value="201-1000">201–1,000</option>
                    <option value="1000+">1,000+</option>
                  </select>
                </div>
                <div>
                  <label className="su-lbl">Industry *</label>
                  <select className="su-sel" value={industry} onChange={e=>setIndustry(e.target.value)}>
                    <option value="">Select...</option>
                    <option value="fintech">Fintech</option><option value="healthcare">Healthcare</option>
                    <option value="ecommerce">E-Commerce</option><option value="saas">SaaS</option>
                    <option value="startup">Startup</option><option value="enterprise">Enterprise</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button className="su-btn" onClick={goNext}>Continue →</button>
            </>:<>
              <h2 className="su-h2">Create your account</h2>
              <p className="su-sub">Setting up CyberSentry for <strong style={{color:'#00ff88'}}>{companyName}</strong>.</p>
              {error&&<div className="su-err">{error}</div>}
              <label className="su-lbl">Your Name *</label>
              <input className="su-inp" placeholder="John Smith" value={firstName} onChange={e=>setFirstName(e.target.value)}/>
              <label className="su-lbl">Work Email *</label>
              <input className="su-inp" type="email" placeholder="john@yourcompany.com" value={workEmail} onChange={e=>setWorkEmail(e.target.value)}/>
              <div className="su-hint">✓ Use your company email — not Gmail or Yahoo</div>
              <label className="su-lbl">Password *</label>
              <div className="su-pass-wrap">
                <input className="su-pass-inp" type={showPass?'text':'password'} placeholder="Min. 8 characters" value={password} onChange={e=>setPassword(e.target.value)}/>
                <button className="su-eye" onClick={()=>setShowPass(!showPass)}>{showPass?'🙈':'👁'}</button>
              </div>
              <button className="su-btn" onClick={handleSignup} disabled={loading}>
                {loading?'Creating account...':(`Create account for ${companyName} →`)}
              </button>
              <p className="su-terms">Your code is accessed read-only via the GitHub API and never stored on our servers.</p>
            </>}

            <p className="su-login">Already have an account? <a onClick={()=>router.push('/login')}>Sign in</a></p>
          </div>
        </div>
      </div>
    </>
  )
}