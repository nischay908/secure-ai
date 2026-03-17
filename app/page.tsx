'use client'
// app/page.tsx - Professional Landing Page
// Shows what the product does BEFORE anyone logs in
// Visitors see: hero, how it works, features, pricing, then sign up as a COMPANY

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [counters, setCounters] = useState({ vulns: 0, companies: 0, patches: 0, uptime: 0 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Animate step loop
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 5), 2200)
    return () => clearInterval(t)
  }, [])

  // Animate counters
  useEffect(() => {
    const targets = { vulns: 48291, companies: 312, patches: 31847, uptime: 99 }
    const duration = 2000
    const steps = 60
    let step = 0
    const t = setInterval(() => {
      step++
      const p = step / steps
      setCounters({
        vulns: Math.floor(targets.vulns * p),
        companies: Math.floor(targets.companies * p),
        patches: Math.floor(targets.patches * p),
        uptime: Math.floor(targets.uptime * p),
      })
      if (step >= steps) clearInterval(t)
    }, duration / steps)
    return () => clearInterval(t)
  }, [])

  const HOW_IT_WORKS = [
    { n: '01', title: 'Company Signs Up', desc: 'Create your company account in 2 minutes. No credit card required to start.', icon: '🏢', color: '#00ff88' },
    { n: '02', title: 'Connect Your Repository', desc: 'Link your GitHub repository. CyberSentry gets read access to your actual source code.', icon: '🔗', color: '#00e5ff' },
    { n: '03', title: 'AI Scans Your Real Code', desc: 'Our autonomous agent reads every file, traces data flows, and finds real vulnerabilities — not generic guesses.', icon: '🔍', color: '#a78bfa' },
    { n: '04', title: 'Auto-Patches & Creates PRs', desc: 'The AI generates secure code fixes and opens a GitHub Pull Request — you just review and merge.', icon: '🔧', color: '#fbbf24' },
    { n: '05', title: 'Continuous Monitoring', desc: 'Every new commit is automatically scanned. New vulnerability found = instant alert + auto-fix.', icon: '📡', color: '#00ff88' },
  ]

  const FEATURES = [
    { icon: '🧠', title: 'Real Code Analysis', desc: 'Reads your actual source files via GitHub API. Finds SQL injection in your real database queries, not fake examples.', tag: 'Core' },
    { icon: '⚔️', title: 'Exploit Simulation', desc: 'AI Red Team generates real attack payloads against your vulnerabilities to confirm they are actually exploitable.', tag: 'Advanced' },
    { icon: '🔧', title: 'Autonomous Patching', desc: 'AI writes the secure version of your vulnerable code and creates a GitHub PR with one click.', tag: 'Core' },
    { icon: '🧪', title: 'Patch Verification', desc: 'Before showing you a fix, the AI tests it in a sandbox to confirm it works and doesn\'t break anything.', tag: 'Trust' },
    { icon: '📊', title: 'Security Score Tracking', desc: 'Track how your codebase security improves over time as the AI fixes vulnerabilities.', tag: 'Analytics' },
    { icon: '📡', title: 'Real-Time Monitoring', desc: 'Every GitHub push triggers an automatic scan. Catch vulnerabilities before they reach production.', tag: 'Core' },
    { icon: '🔑', title: 'Secret Detection', desc: 'Finds hardcoded API keys, passwords, and tokens across your entire codebase — even in git history.', tag: 'Core' },
    { icon: '📋', title: 'Compliance Reports', desc: 'Generate OWASP, PCI-DSS, GDPR, HIPAA compliance reports tailored to your industry.', tag: 'Enterprise' },
  ]

  const PRICING = [
    {
      name: 'Starter', price: '$49', period: '/month',
      desc: 'Perfect for small teams and startups',
      color: '#00e5ff',
      features: ['1 GitHub repository', 'Up to 50 files scanned', 'OWASP Top-10 checks', 'Auto-generated patches', 'Email alerts', '7-day scan history'],
      cta: 'Start Free Trial', highlight: false
    },
    {
      name: 'Pro', price: '$199', period: '/month',
      desc: 'For growing companies with multiple repos',
      color: '#00ff88',
      features: ['Unlimited repositories', 'Full codebase scanning', 'All vulnerability checks', 'GitHub PR auto-creation', 'Slack/Teams alerts', 'Compliance reports (PCI, GDPR)', 'Priority support', '90-day history'],
      cta: 'Start Free Trial', highlight: true
    },
    {
      name: 'Enterprise', price: 'Custom', period: '',
      desc: 'For large organizations with strict requirements',
      color: '#a78bfa',
      features: ['Everything in Pro', 'On-premise deployment', 'SSO / SAML integration', 'Custom compliance rules', 'SLA guarantee', 'Dedicated security engineer', 'API access', 'Audit logs'],
      cta: 'Contact Sales', highlight: false
    },
  ]

  const TESTIMONIALS = [
    { company: 'FinPay Systems', role: 'CTO', name: 'Sarah Chen', quote: 'CyberSentry found 3 SQL injection vulnerabilities in our payment flow that our manual code review missed for 6 months. The auto-patch feature saved us 2 days of engineering work.', logo: '💳' },
    { company: 'HealthTrack', role: 'Head of Engineering', name: 'Raj Patel', quote: 'As a HIPAA-regulated company, we needed continuous security monitoring. CyberSentry monitors every commit and generates HIPAA compliance reports automatically.', logo: '🏥' },
    { company: 'CloudCart', role: 'Lead Developer', name: 'Alex Morgan', quote: 'We had hardcoded API keys in 4 files committed to git. CyberSentry found them all in the first scan, explained the risk, and told us exactly how to fix each one.', logo: '🛍️' },
  ]

  const VULNS_DETECTED = [
    { type: 'SQL Injection', file: 'auth/login.js', severity: 'CRITICAL', time: '2s ago' },
    { type: 'Hardcoded Secret', file: 'config/stripe.ts', severity: 'HIGH', time: '14s ago' },
    { type: 'XSS Vulnerability', file: 'components/Comment.tsx', severity: 'HIGH', time: '31s ago' },
    { type: 'Path Traversal', file: 'api/files/route.ts', severity: 'HIGH', time: '1m ago' },
    { type: 'Missing Auth', file: 'api/admin/users.ts', severity: 'CRITICAL', time: '2m ago' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#030303;color:#fff;font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        .lp{background:#030303}
        /* NAV */
        .lnav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 40px;height:68px;display:flex;align-items:center;justify-content:space-between;transition:all 0.3s}
        .lnav.scrolled{background:rgba(3,3,3,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06)}
        .lnav-brand{display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer}
        .lnav-ico{width:34px;height:34px;border-radius:8px;background:#000;border:1px solid rgba(0,255,136,0.35);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px rgba(0,255,136,0.15)}
        .lnav-name{font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;color:#fff}
        .lnav-ai{font-size:10px;font-weight:800;color:#000;background:#00ff88;padding:2px 7px;border-radius:4px}
        .lnav-links{display:flex;align-items:center;gap:32px}
        .lnav-link{font-size:14px;font-weight:500;color:rgba(255,255,255,0.55);text-decoration:none;cursor:pointer;transition:color 0.2s}
        .lnav-link:hover{color:#fff}
        .lnav-btns{display:flex;align-items:center;gap:12px}
        .lnav-login{font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);cursor:pointer;padding:8px 18px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);transition:all 0.2s;background:none}
        .lnav-login:hover{color:#fff;border-color:rgba(255,255,255,0.3)}
        .lnav-cta{font-size:14px;font-weight:700;color:#000;cursor:pointer;padding:9px 22px;border-radius:8px;background:#00ff88;border:none;transition:all 0.2s;box-shadow:0 0 18px rgba(0,255,136,0.25)}
        .lnav-cta:hover{background:#1aff95;box-shadow:0 0 30px rgba(0,255,136,0.4)}
        /* HERO */
        .hero-section{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 40px 80px;text-align:center;position:relative;overflow:hidden}
        .hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(0,255,136,0.08) 0%,transparent 60%);pointer-events:none}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);color:#00ff88;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;padding:6px 16px;border-radius:40px;margin-bottom:28px;letter-spacing:0.08em;text-transform:uppercase}
        .hero-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:blink 2s infinite}
        .hero-h1{font-family:'Outfit',sans-serif;font-size:clamp(44px,7vw,88px);font-weight:800;letter-spacing:-0.04em;line-height:1.0;color:#fff;margin-bottom:24px;max-width:900px}
        .hero-h1-green{color:#00ff88}
        .hero-sub{font-size:clamp(16px,2vw,20px);color:rgba(255,255,255,0.45);line-height:1.7;max-width:600px;margin:0 auto 40px;font-weight:300}
        .hero-btns{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:60px}
        .hero-btn-primary{font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#000;cursor:pointer;padding:16px 36px;border-radius:10px;background:#00ff88;border:none;transition:all 0.25s;box-shadow:0 0 40px rgba(0,255,136,0.3)}
        .hero-btn-primary:hover{background:#1aff95;box-shadow:0 0 60px rgba(0,255,136,0.5);transform:translateY(-2px)}
        .hero-btn-secondary{font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;color:rgba(255,255,255,0.7);cursor:pointer;padding:15px 32px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);transition:all 0.2s}
        .hero-btn-secondary:hover{color:#fff;border-color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.08)}
        /* LIVE DEMO WINDOW */
        .demo-window{width:100%;max-width:860px;margin:0 auto;background:#080808;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.6)}
        .demo-titlebar{padding:12px 18px;background:#0d0d0d;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px}
        .demo-dot{width:10px;height:10px;border-radius:50%}
        .demo-title{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.3);margin-left:8px;letter-spacing:0.06em}
        .demo-body{padding:20px;display:flex;flex-direction:column;gap:10px}
        .demo-scan-line{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;border-left:3px solid;animation:slideIn 0.4s ease both}
        .demo-scan-label{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;flex-shrink:0;width:70px}
        .demo-scan-file{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.6);flex:1}
        .demo-scan-sev{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:800;padding:2px 9px;border-radius:4px;flex-shrink:0}
        .demo-scan-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25);flex-shrink:0}
        /* STATS */
        .stats-section{padding:60px 40px;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
        .stats-grid{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0}
        .stat-item{text-align:center;padding:30px 20px;border-right:1px solid rgba(255,255,255,0.06)}
        .stat-item:last-child{border-right:none}
        .stat-num{font-family:'Outfit',sans-serif;font-size:clamp(32px,4vw,52px);font-weight:800;color:#fff;line-height:1;margin-bottom:8px}
        .stat-num-green{color:#00ff88}
        .stat-lbl{font-size:14px;color:rgba(255,255,255,0.35);font-weight:400}
        /* HOW IT WORKS */
        .section{padding:100px 40px}
        .section-center{text-align:center}
        .section-tag{display:inline-flex;align-items:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#00ff88;margin-bottom:18px}
        .section-h2{font-family:'Outfit',sans-serif;font-size:clamp(32px,4vw,52px);font-weight:800;letter-spacing:-0.03em;color:#fff;margin-bottom:18px;line-height:1.1}
        .section-sub{font-size:17px;color:rgba(255,255,255,0.4);max-width:560px;margin:0 auto;line-height:1.7;font-weight:300}
        .steps-grid{max-width:1100px;margin:60px auto 0;display:grid;grid-template-columns:repeat(5,1fr);gap:0;position:relative}
        .steps-grid::before{content:'';position:absolute;top:32px;left:10%;right:10%;height:1px;background:linear-gradient(to right,transparent,rgba(0,255,136,0.3),transparent)}
        .step-item{text-align:center;padding:0 16px;position:relative;z-index:1}
        .step-circle{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 20px;border:1px solid;transition:all 0.3s}
        .step-num{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:800;color:rgba(255,255,255,0.25);margin-bottom:10px;letter-spacing:0.1em}
        .step-title{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bottom:10px}
        .step-desc{font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6}
        /* FEATURES */
        .features-grid{max-width:1100px;margin:60px auto 0;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        @media(max-width:900px){.features-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.features-grid{grid-template-columns:1fr}}
        .feature-card{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:24px;transition:all 0.25s;cursor:default}
        .feature-card:hover{border-color:rgba(0,255,136,0.2);transform:translateY(-3px);box-shadow:0 20px 40px rgba(0,0,0,0.4)}
        .feature-ico{font-size:28px;margin-bottom:14px}
        .feature-tag{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#00ff88;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.18);padding:2px 8px;border-radius:4px;margin-bottom:12px}
        .feature-title{font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#fff;margin-bottom:10px}
        .feature-desc{font-size:13px;color:rgba(255,255,255,0.42);line-height:1.6}
        /* PRICING */
        .pricing-grid{max-width:1000px;margin:60px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        @media(max-width:800px){.pricing-grid{grid-template-columns:1fr}}
        .price-card{background:#080808;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:32px 28px;display:flex;flex-direction:column;gap:0;transition:all 0.25s;position:relative}
        .price-card-highlight{border-color:rgba(0,255,136,0.3);box-shadow:0 0 40px rgba(0,255,136,0.08)}
        .price-popular{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#00ff88;color:#000;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:800;padding:4px 14px;border-radius:40px;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap}
        .price-name{font-family:'Outfit',sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:8px}
        .price-amount{display:flex;align-items:flex-end;gap:4px;margin-bottom:10px}
        .price-num{font-family:'Outfit',sans-serif;font-size:48px;font-weight:800;color:#fff;line-height:1}
        .price-period{font-size:14px;color:rgba(255,255,255,0.4);padding-bottom:8px}
        .price-desc{font-size:13px;color:rgba(255,255,255,0.35);margin-bottom:24px;line-height:1.5}
        .price-divider{height:1px;background:rgba(255,255,255,0.07);margin-bottom:20px}
        .price-features{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;flex:1}
        .price-feature{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.4}
        .price-check{flex-shrink:0;margin-top:1px;font-size:12px}
        .price-btn{width:100%;padding:14px;border-radius:9px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;border:none;margin-top:auto}
        .price-btn-green{background:#00ff88;color:#000;box-shadow:0 0 24px rgba(0,255,136,0.22)}
        .price-btn-green:hover{background:#1aff95;box-shadow:0 0 36px rgba(0,255,136,0.4)}
        .price-btn-outline{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.12)!important}
        .price-btn-outline:hover{background:rgba(255,255,255,0.09);color:#fff}
        /* TESTIMONIALS */
        .testimonials-grid{max-width:1000px;margin:60px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        @media(max-width:800px){.testimonials-grid{grid-template-columns:1fr}}
        .testimonial-card{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:28px}
        .testimonial-logo{font-size:28px;margin-bottom:16px}
        .testimonial-quote{font-size:14px;color:rgba(255,255,255,0.65);line-height:1.8;margin-bottom:20px;font-style:italic}
        .testimonial-author{display:flex;flex-direction:column;gap:3px}
        .testimonial-name{font-weight:700;color:#fff;font-size:14px}
        .testimonial-role{font-size:12px;color:rgba(255,255,255,0.35);font-family:'JetBrains Mono',monospace}
        /* CTA SECTION */
        .cta-section{padding:120px 40px;text-align:center;position:relative;overflow:hidden}
        .cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 50% 50%,rgba(0,255,136,0.06) 0%,transparent 70%)}
        .cta-h2{font-family:'Outfit',sans-serif;font-size:clamp(36px,5vw,64px);font-weight:800;letter-spacing:-0.04em;color:#fff;margin-bottom:20px;line-height:1.05}
        .cta-sub{font-size:18px;color:rgba(255,255,255,0.4);margin-bottom:40px;font-weight:300}
        /* FOOTER */
        .footer{padding:40px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .footer-brand{display:flex;align-items:center;gap:8px}
        .footer-copy{font-size:13px;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace}
        .footer-links{display:flex;gap:20px}
        .footer-link{font-size:13px;color:rgba(255,255,255,0.3);cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#fff}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="lp">
        {/* NAV */}
        <nav className={`lnav ${scrolled ? 'scrolled' : ''}`}>
          <div className="lnav-brand">
            <div className="lnav-ico">🛡️</div>
            <span className="lnav-name">CyberSentry</span>
            <span className="lnav-ai">AI</span>
          </div>
          <div className="lnav-links">
            <a className="lnav-link" href="#how-it-works">How It Works</a>
            <a className="lnav-link" href="#features">Features</a>
            <a className="lnav-link" href="#pricing">Pricing</a>
          </div>
          <div className="lnav-btns">
            <button className="lnav-login" onClick={() => router.push('/login')}>Sign In</button>
            <button className="lnav-login" onClick={() => router.push('/scan')}style={{borderColor:'rgba(0,255,136,0.3)',color:'#00ff88'}}>Live Demo</button>
            <button className="lnav-cta" onClick={() => router.push('/signup')}>Start Free Trial →</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero-section">
          <div className="hero-bg"/>
          <div className="hero-grid"/>
          <div className="hero-badge">
            <span className="hero-dot"/>
            Autonomous AI Security Engineer
          </div>
          <h1 className="hero-h1">
            Your Codebase Has<br/>
            <span className="hero-h1-green">Security Vulnerabilities.</span><br/>
            We Find &amp; Fix Them.
          </h1>
          <p className="hero-sub">
            CyberSentry AI connects to your GitHub repository, reads your actual source code,
            finds real vulnerabilities, and automatically creates pull requests with fixes —
            while you sleep.
          </p>
          <div className="hero-btns">
  <button className="hero-btn-primary" onClick={() => router.push('/scan')}>
    🔍 Try Live Demo — Scan Any Repo
  </button>
  <button className="hero-btn-secondary" onClick={() => router.push('/signup')}>
    Start Free Trial — No Card Required
  </button>
  <button className="hero-btn-secondary" onClick={() => router.push('/login')}>
    Sign In to Dashboard
  </button>
</div>

          {/* Live demo window */}
          <div className="demo-window">
            <div className="demo-titlebar">
              <div className="demo-dot" style={{ background: '#ff5f57' }}/>
              <div className="demo-dot" style={{ background: '#ffbd2e' }}/>
              <div className="demo-dot" style={{ background: '#28c840' }}/>
              <span className="demo-title">CyberSentry AI — Live Scan Feed</span>
            </div>
            <div className="demo-body">
              {VULNS_DETECTED.map((v, i) => (
                <div key={i} className="demo-scan-line"
                  style={{
                    background: v.severity === 'CRITICAL' ? 'rgba(255,68,68,0.06)' : 'rgba(249,115,22,0.05)',
                    borderLeftColor: v.severity === 'CRITICAL' ? '#ff4444' : '#f97316',
                    animationDelay: `${i * 0.1}s`
                  }}>
                  <span className="demo-scan-label" style={{ color: v.severity === 'CRITICAL' ? '#ff4444' : '#f97316' }}>
                    {v.type.split(' ')[0]}
                  </span>
                  <span className="demo-scan-file">📄 {v.file}</span>
                  <span className="demo-scan-sev" style={{
                    color: v.severity === 'CRITICAL' ? '#ff4444' : '#f97316',
                    background: v.severity === 'CRITICAL' ? 'rgba(255,68,68,0.12)' : 'rgba(249,115,22,0.1)',
                  }}>{v.severity}</span>
                  <span className="demo-scan-time">{v.time}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(0,255,136,0.06)', borderRadius: 8, border: '1px solid rgba(0,255,136,0.14)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', flexShrink: 0, animation: 'blink 1.5s infinite' }}/>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#00ff88' }}>AI Agent: Generating patches for 3 critical vulnerabilities...</span>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="stats-section">
          <div className="stats-grid">
            {[
              { num: counters.vulns.toLocaleString(), label: 'Vulnerabilities Detected', green: true },
              { num: counters.companies.toLocaleString() + '+', label: 'Companies Protected', green: false },
              { num: counters.patches.toLocaleString(), label: 'Patches Auto-Generated', green: false },
              { num: counters.uptime + '.9%', label: 'Platform Uptime', green: true },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <div className={`stat-num ${s.green ? 'stat-num-green' : ''}`}>{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="section section-center" id="how-it-works">
          <div className="section-tag">How It Works</div>
          <h2 className="section-h2">From signup to secured in minutes</h2>
          <p className="section-sub">No complex setup. No security expertise required. CyberSentry handles everything automatically.</p>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="step-item">
                <div className="step-circle" style={{
                  background: activeStep === i ? `${s.color}15` : 'rgba(255,255,255,0.04)',
                  borderColor: activeStep === i ? s.color : 'rgba(255,255,255,0.08)',
                  boxShadow: activeStep === i ? `0 0 20px ${s.color}25` : 'none',
                }}>
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                </div>
                <div className="step-num">{s.n}</div>
                <div className="step-title" style={{ color: activeStep === i ? s.color : '#fff' }}>{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="section section-center" id="features" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="section-tag">Features</div>
          <h2 className="section-h2">Everything your security team needs</h2>
          <p className="section-sub">Not a generic scanner. A fully autonomous AI security engineer that thinks, patches, and verifies.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-ico">{f.icon}</div>
                <div className="feature-tag">{f.tag}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="section section-center">
          <div className="section-tag">Testimonials</div>
          <h2 className="section-h2">Trusted by engineering teams</h2>
          <p className="section-sub">Companies use CyberSentry to catch vulnerabilities their teams miss and automate security compliance.</p>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-logo">{t.logo}</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">{t.name}</span>
                  <span className="testimonial-role">{t.role} · {t.company}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section className="section section-center" id="pricing" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="section-tag">Pricing</div>
          <h2 className="section-h2">One AI security engineer.<br/>A fraction of the cost.</h2>
          <p className="section-sub">A human security engineer costs $150,000/year. CyberSentry starts at $49/month.</p>
          <div className="pricing-grid">
            {PRICING.map((p, i) => (
              <div key={i} className={`price-card ${p.highlight ? 'price-card-highlight' : ''}`}>
                {p.highlight && <div className="price-popular">Most Popular</div>}
                <div className="price-name" style={{ color: p.color }}>{p.name}</div>
                <div className="price-amount">
                  <span className="price-num">{p.price}</span>
                  <span className="price-period">{p.period}</span>
                </div>
                <p className="price-desc">{p.desc}</p>
                <div className="price-divider"/>
                <div className="price-features">
                  {p.features.map((f, j) => (
                    <div key={j} className="price-feature">
                      <span className="price-check" style={{ color: p.color }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`price-btn ${p.highlight ? 'price-btn-green' : 'price-btn-outline'}`}
                  onClick={() => p.cta === 'Contact Sales' ? null : router.push('/signup')}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-bg"/>
          <div className="section-tag">Get Started</div>
          <h2 className="cta-h2">Secure your codebase<br/><span style={{ color: '#00ff88' }}>starting today.</span></h2>
          <p className="cta-sub">Join hundreds of companies protecting their code with CyberSentry AI.<br/>Free trial. No credit card required.</p>
          <button className="hero-btn-primary" style={{ fontSize: 18, padding: '18px 48px' }} onClick={() => router.push('/signup')}>
            Start Free Trial →
          </button>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-brand">
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15 }}>CyberSentry AI</span>
          </div>
          <span className="footer-copy">© 2026 CyberSentry AI. All rights reserved.</span>
          <div className="footer-links">
            <span className="footer-link">Privacy</span>
            <span className="footer-link">Terms</span>
            <span className="footer-link">Security</span>
            <span className="footer-link">Docs</span>
          </div>
        </footer>
      </div>
    </>
  )
}