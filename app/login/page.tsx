'use client'
// app/login/page.tsx — Professional company login

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Incorrect email or password. Please try again.' : err.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#030303;color:#fff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
        .li-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(0,255,136,0.05) 0%,transparent 60%)}
        .li-card{width:100%;max-width:420px;background:#080808;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:44px 40px}
        .li-brand{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:32px}
        .li-brand-ico{width:36px;height:36px;border-radius:9px;background:#000;border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;font-size:18px}
        .li-brand-name{font-family:'Syne',sans-serif;font-size:18px;font-weight:800}
        .li-brand-tag{font-size:10px;font-weight:800;color:#000;background:#00ff88;padding:2px 7px;border-radius:4px}
        .li-h2{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#fff;margin-bottom:6px;text-align:center;letter-spacing:-0.02em}
        .li-sub{font-size:14px;color:rgba(255,255,255,0.38);margin-bottom:28px;text-align:center;line-height:1.5}
        .li-lbl{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.38);margin-bottom:7px;font-family:'JetBrains Mono',monospace}
        .li-inp{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:13px 16px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s;margin-bottom:16px}
        .li-inp:focus{border-color:rgba(0,255,136,0.4)}
        .li-inp::placeholder{color:rgba(255,255,255,0.2)}
        .li-pass-wrap{position:relative;margin-bottom:16px}
        .li-pass-inp{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.08);color:#fff;border-radius:9px;padding:13px 44px 13px 16px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s}
        .li-pass-inp:focus{border-color:rgba(0,255,136,0.4)}
        .li-pass-inp::placeholder{color:rgba(255,255,255,0.2)}
        .li-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);padding:4px;font-size:15px}
        .li-eye:hover{color:#fff}
        .li-err{background:rgba(255,59,59,0.07);border:1px solid rgba(255,59,59,0.2);border-radius:8px;padding:11px 14px;font-size:13px;color:#ff6b6b;margin-bottom:16px;font-family:'JetBrains Mono',monospace}
        .li-btn{width:100%;padding:15px;background:#00ff88;border:none;border-radius:9px;color:#000;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:800;cursor:pointer;transition:all 0.2s;box-shadow:0 0 22px rgba(0,255,136,0.2)}
        .li-btn:hover{background:#1aff95;box-shadow:0 0 34px rgba(0,255,136,0.35)}
        .li-btn:disabled{opacity:0.4;cursor:not-allowed;box-shadow:none}
        .li-divider{display:flex;align-items:center;gap:12px;margin:20px 0}
        .li-divider-line{flex:1;height:1px;background:rgba(255,255,255,0.07)}
        .li-divider-text{font-size:12px;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace}
        .li-signup{text-align:center;font-size:14px;color:rgba(255,255,255,0.38);margin-top:18px}
        .li-signup a{color:#00ff88;cursor:pointer;font-weight:600}
        .li-back{display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .li-back-btn{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;font-size:12px;padding:0;transition:color 0.2s}
        .li-back-btn:hover{color:#00ff88}
        .li-info-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .li-forgot{font-size:12px;color:rgba(0,255,136,0.7);cursor:pointer;font-family:'JetBrains Mono',monospace;transition:color 0.2s}
        .li-forgot:hover{color:#00ff88}
      `}</style>

      <div className="li-wrap">
        <div className="li-card">
          <div className="li-back">
            <button className="li-back-btn" onClick={() => router.push('/')}>← Back to home</button>
          </div>

          <div className="li-brand">
            <div className="li-brand-ico">🛡️</div>
            <span className="li-brand-name">CyberSentry</span>
            <span className="li-brand-tag">AI</span>
          </div>

          <h2 className="li-h2">Sign in to your account</h2>
          <p className="li-sub">Welcome back. Enter your work email to access your company's security dashboard.</p>

          {error && <div className="li-err">{error}</div>}

          <label className="li-lbl">Work Email</label>
          <input className="li-inp" type="email" placeholder="john@yourcompany.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}/>

          <div className="li-info-row">
            <label className="li-lbl" style={{ margin: 0 }}>Password</label>
            <span className="li-forgot">Forgot password?</span>
          </div>
          <div className="li-pass-wrap">
            <input className="li-pass-inp" type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}/>
            <button className="li-eye" onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁'}</button>
          </div>

          <button className="li-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <div className="li-divider">
            <div className="li-divider-line"/>
            <span className="li-divider-text">New to CyberSentry?</span>
            <div className="li-divider-line"/>
          </div>

          <button style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.target as HTMLElement).style.color = '#fff' }}
            onMouseOut={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
            onClick={() => router.push('/signup')}>
            Create company account →
          </button>

          <p className="li-signup" style={{ marginTop: 14 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono,monospace' }}>
              Your code is accessed read-only and never stored.
            </span>
          </p>
        </div>
      </div>
    </>
  )
}