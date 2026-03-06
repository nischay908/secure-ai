'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')
  const router = useRouter()

  const handleAuth = async () => {
    if (!email || !password) { setMessage('Please fill in all fields'); return }
    setLoading(true); setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('✅ Account created! Check your email or sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/scan')
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!email) { setMessage('Enter your email address first'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/scan`
    })
    if (error) setMessage(error.message)
    else setMessage('✅ Password reset email sent! Check your inbox.')
  }

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 24px;
          background: #050508; position: relative;
        }
        .login-bg-orb {
          position: fixed; border-radius: 50%;
          filter: blur(100px); pointer-events: none;
        }
        .login-box {
          width: 100%; max-width: 460px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 48px 40px;
          position: relative; z-index: 10;
          box-shadow: 0 40px 120px rgba(0,0,0,0.6);
        }
        .login-logo {
          display: flex; align-items: center; gap: 10px; margin-bottom: 36px;
        }
        .login-logo-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: rgba(0,255,136,0.12);
          border: 1px solid rgba(0,255,136,0.25);
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .login-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
        .login-sub   { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 32px; }
        .form-group  { margin-bottom: 16px; }
        .form-label  { display: block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
        .pw-wrap     { position: relative; }
        .pw-toggle   {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: rgba(255,255,255,0.3);
          cursor: pointer; font-size: 16px; padding: 0; line-height: 1;
        }
        .forgot-row  { text-align: right; margin-top: 6px; margin-bottom: 4px; }
        .forgot-btn  {
          background: none; border: none; color: rgba(0,255,136,0.6);
          font-size: 13px; cursor: pointer; font-family: 'Space Grotesk', sans-serif;
          transition: color 0.2s;
        }
        .forgot-btn:hover { color: #00ff88; }
        .error-msg {
          background: rgba(255,68,102,0.1); border: 1px solid rgba(255,68,102,0.25);
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: #ff6688; margin-bottom: 16px;
        }
        .success-msg {
          background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.2);
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: #00ff88; margin-bottom: 16px;
        }
        .submit-btn {
          width: 100%; padding: 15px;
          background: #00ff88; color: #000;
          border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; font-family: 'Space Grotesk', sans-serif;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { background: #00ff99; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,255,136,0.3); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 24px 0; }
        .demo-btn {
          width: 100%; padding: 13px;
          background: transparent; color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; font-family: 'Space Grotesk', sans-serif;
        }
        .demo-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
        .switch-text { text-align: center; margin-top: 24px; font-size: 14px; color: rgba(255,255,255,0.3); }
        .switch-btn  {
          background: none; border: none; color: #00ff88; cursor: pointer;
          font-weight: 600; margin-left: 6px; font-size: 14px;
          font-family: 'Space Grotesk', sans-serif;
        }
        .switch-btn:hover { text-decoration: underline; }
        .back-link {
          display: flex; align-items: center; gap: 6px;
          position: fixed; top: 28px; left: 28px; z-index: 100;
          color: rgba(255,255,255,0.3); font-size: 14px;
          background: none; border: none; cursor: pointer; transition: color 0.2s;
          font-family: 'Space Grotesk', sans-serif;
        }
        .back-link:hover { color: white; }
        .security-note {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.2);
        }
      `}</style>

      <button className="back-link" onClick={() => router.push('/')}>← Back</button>

      <div className="login-bg-orb" style={{width:'500px',height:'500px',background:'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',top:'-100px',left:'-100px'}} />
      <div className="login-bg-orb" style={{width:'400px',height:'400px',background:'radial-gradient(circle, rgba(68,136,255,0.05) 0%, transparent 70%)',bottom:'-50px',right:'-50px'}} />

      <div className="login-page">
        <div className="login-box">

          <div className="login-logo">
            <div className="login-logo-icon">🛡</div>
            <span style={{fontSize:'18px', fontWeight:700, color:'white'}}>
              Cyber<span style={{color:'#00ff88'}}>Sentry</span>
            </span>
            <span style={{fontSize:'11px', background:'rgba(0,255,136,0.15)', color:'#00ff88', padding:'2px 8px', borderRadius:'20px', border:'1px solid rgba(0,255,136,0.3)'}}>AI</span>
          </div>

          <div className="login-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</div>
          <div className="login-sub">{isSignUp ? 'Start scanning your code for free' : 'Continue securing your codebase'}</div>

          {message && (
            <div className={message.includes('✅') ? 'success-msg' : 'error-msg'}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="pw-wrap">
              <input
                className="input-field"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                style={{paddingRight:'44px'}}
              />
              <button className="pw-toggle" onClick={() => setShowPw(!showPw)} type="button">
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {!isSignUp && (
              <div className="forgot-row">
                <button className="forgot-btn" onClick={handleForgotPassword} type="button">
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <button className="submit-btn" onClick={handleAuth} disabled={loading}>
            {loading ? '⏳ Loading...' : isSignUp ? 'Create Account' : 'Sign In →'}
          </button>

          <div className="divider" />

          <button className="demo-btn" onClick={() => router.push('/scan')}>
            👁 Skip — View Live Demo
          </button>

          <div className="switch-text">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button className="switch-btn" onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          <div className="security-note">
            🔒 Secured by Supabase · End-to-end encrypted
          </div>
        </div>
      </div>
    </>
  )
}