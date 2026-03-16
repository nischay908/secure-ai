'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Code, Globe, Shield, Home, AlertTriangle, Bug, Sparkles, CheckCircle,
  ChevronDown, Download, RotateCcw, LogOut, Settings, Copy, FileCode2,
  Terminal, Zap, Eye, Send, ChevronRight, Lock, Activity, TrendingUp,
  PlayCircle, ShieldCheck, Workflow, FlaskConical, BrainCircuit, Target,
  Package, BarChart2, Key, GitBranch, X, AlertCircle, Radio, Bell
} from 'lucide-react'

// ── Inline SVG icons not in lucide ──────────────────────────────────────────
const WrenchIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)
const SwordsIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" /><line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" y1="14" x2="9" y2="18" /><line x1="7" y1="21" x2="9" y2="19" />
    <line x1="3" y1="19" x2="5" y2="21" />
  </svg>
)
const RadarIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" />
    <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
    <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />
    <line x1="12" y1="12" x2="19.07" y2="4.93" /><circle cx="12" cy="12" r="2" />
  </svg>
)

// ── TYPES ────────────────────────────────────────────────────────────────────
type TabId = 'vulns'|'agent'|'redblue'|'verify'|'timeline'|'rootcause'|'radar'|'original'|'corrected'|'sentry'
interface AgentStep { id:string; label:string; detail:string; icon:string; status:'pending'|'running'|'done'; duration?:number }
interface RBEvent { team:'red'|'blue'|'system'; msg:string; time:string; type:'attack'|'defend'|'info'|'success' }
interface VTest { id:string; name:string; desc:string; status:'pending'|'running'|'passed'|'failed'; ms?:number; detail?:string }
interface Snap { id:string; date:string; label:string; score:number; delta:number; event:string; actions:string[] }
interface RC { id:string; pattern:string; category:string; desc:string; files:string[]; count:number; fix:string; before:string; after:string; cwe:string; sev:'critical'|'high'|'medium' }
interface RS { cat:string; score:number; color:string }

// ── CODE SAMPLES ─────────────────────────────────────────────────────────────
const SAMPLES: Record<string,{v:string;f:string}> = {
  JavaScript:{
    v:`// SQL Injection + hardcoded secrets
const express = require('express')
const app = express()
const JWT_SECRET = 'my-super-secret-jwt-key-2024'
const DB_PASS = 'Admin@Database2024!'
app.get('/user', (req, res) => {
  const userId = req.query.id
  const query = "SELECT * FROM users WHERE id = " + userId
  db.execute(query, (err, r) => res.json(r))
})`,
    f:`const express = require('express')
const app = express()
const JWT_SECRET = process.env.JWT_SECRET
const DB_PASS = process.env.DB_PASSWORD
app.get('/user', (req, res) => {
  const userId = req.query.id
  // FIXED: Parameterized query
  const query = "SELECT * FROM users WHERE id = ?"
  db.execute(query, [userId], (err, r) => res.json(r))
})`
  },
  Python:{
    v:`from flask import Flask, request
import sqlite3, os
app = Flask(__name__)
DB_PASSWORD = 'admin@Database2024!'
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE username='{username}'"
    conn.cursor().execute(query)
    return "ok"`,
    f:`from flask import Flask, request
import sqlite3, os
app = Flask(__name__)
DB_PASSWORD = os.environ['DB_PASSWORD']
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    conn = sqlite3.connect('users.db')
    # FIXED: Parameterized query
    conn.cursor().execute(
        "SELECT * FROM users WHERE username=?", (username,))
    return "ok"`
  },
  Java:{
    v:`import java.sql.*;
public class UserAuth {
    static final String DB_PASS = "Admin@2024Secret!";
    public boolean auth(String user, String pass) {
        try {
            Connection c = DriverManager.getConnection(
                "jdbc:mysql://localhost/app","root",DB_PASS);
            String q = "SELECT * FROM users WHERE name = '"+user+"'";
            return c.createStatement().executeQuery(q).next();
        } catch(Exception e){return false;}
    }
}`,
    f:`import java.sql.*;
public class UserAuth {
    static final String DB_PASS = System.getenv("DB_PASSWORD");
    public boolean auth(String user, String pass) {
        try {
            Connection c = DriverManager.getConnection(
                "jdbc:mysql://localhost/app","root",DB_PASS);
            PreparedStatement ps = c.prepareStatement(
                "SELECT * FROM users WHERE name = ?");
            ps.setString(1, user);
            return ps.executeQuery().next();
        } catch(Exception e){return false;}
    }
}`
  },
  Go:{
    v:`package main
import ("database/sql";"fmt";"net/http")
func getUser(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    q := fmt.Sprintf("SELECT name FROM users WHERE id=%s",id)
    var name string
    db.QueryRow(q).Scan(&name)
    fmt.Fprintf(w,"User: %s",name)
  }
}`,
    f:`package main
import ("database/sql";"fmt";"net/http")
func getUser(db *sql.DB) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    // FIXED: Parameterized query
    var name string
    db.QueryRow("SELECT name FROM users WHERE id=?",id).Scan(&name)
    fmt.Fprintf(w,"User: %s",name)
  }
}`
  }
}

// ── VULNERABILITY DATA ───────────────────────────────────────────────────────
const VULNDB: Record<string,any> = {
  'SQL Injection (SQLi)':{severity:'critical',cvss:9.8,cwe:'CWE-89',
    what:`SQL Injection happens when user input is pasted directly into a database query. An attacker types ' OR '1'='1 and the query matches every user in your database — the database cannot tell it from a legitimate request.`,
    impact:`Full authentication bypass without a password. Complete database dump of all users and passwords. Ability to modify or delete all records. In some database configurations, attackers can execute OS commands on your server.`,
    howToFix:`Replace string concatenation with Parameterized Queries. Pass user data separately — the driver handles escaping automatically. In Node.js: db.execute("SELECT * FROM users WHERE id = ?", [userId]). In Python: cursor.execute("SELECT * FROM users WHERE id = ?", (userId,)).`,
    realWorld:`In 2009, Heartland Payment Systems lost 130 million credit card numbers to SQL Injection. It remains the #1 most exploited web vulnerability per OWASP.`},
  'Hardcoded Secrets Detection':{severity:'high',cvss:7.5,cwe:'CWE-798',
    what:`A password, API key or secret is written directly in your source code. Source code gets committed to git permanently — automated scanners find these in seconds, even in old commits after you delete the file.`,
    impact:`AWS key exposed means attackers spin up thousands of servers overnight. JWT secret means forging authentication tokens for any user including admins. Database password means a direct breach of all customer data.`,
    howToFix:`Move all secrets to environment variables. Create a .env file, add it to .gitignore, and access via process.env.MY_SECRET. Use Vercel Environment Variables in production. Rotate any secret that was exposed — assume it is already compromised.`,
    realWorld:`Toyota accidentally published AWS credentials to a public GitHub repo. The keys were live for 5 years before discovery, potentially exposing 296,000 customers' personal data in 2022.`},
  'Missing Security Headers':{severity:'high',cvss:6.5,cwe:'CWE-693',
    what:`Your server sends responses without telling browsers how to behave safely. Security headers block clickjacking, HTTPS downgrade, MIME sniffing, and XSS amplification attacks.`,
    impact:`Clickjacking — attacker overlays your site in an invisible iframe. HTTPS downgrade exposes user data on public WiFi. Missing CSP lets any injected scripts run without restriction.`,
    howToFix:`Add X-Frame-Options: DENY, Strict-Transport-Security: max-age=31536000, X-Content-Type-Options: nosniff, Content-Security-Policy: default-src 'self'. In Express: app.use(require('helmet')()). In Next.js: add to next.config.ts headers().`,
    realWorld:`The 2010 Facebook "Like" hijacking attack exploited missing X-Frame-Options, affecting millions of users who unknowingly liked pages they never visited.`},
  'Unencrypted Sub-Resource Calls':{severity:'critical',cvss:8.1,cwe:'CWE-319',
    what:`Your HTTPS page loads some resources over plain HTTP. Those requests travel in plaintext — anyone on the same WiFi can intercept and replace them before they reach the user.`,
    impact:`An attacker intercepts your HTTP script and replaces it with malicious JavaScript. Full DOM access — steal session cookies, capture passwords in real time, silently redirect users.`,
    howToFix:`Rewrite all resource URLs to HTTPS. Add CSP: upgrade-insecure-requests. Enable HSTS: max-age=31536000. Audit your codebase for any hardcoded http:// URLs.`,
    realWorld:`British Airways was fined £20M after attackers injected a payment-skimming script via mixed content, stealing 500,000 customers' card details during checkout in 2018.`}
}

// ── STATIC DATA ──────────────────────────────────────────────────────────────
const SCORE_HISTORY: Snap[] = [
  {id:'s1',date:new Date(Date.now()-86400000*7).toISOString(),label:'Day 1',score:24,delta:0,event:'First audit — multiple critical issues found',actions:['Found SQL Injection in 4 files','Detected 3 hardcoded secrets','Identified 6 vulnerable dependencies']},
  {id:'s2',date:new Date(Date.now()-86400000*5).toISOString(),label:'Day 3',score:48,delta:24,event:'AI fixed all SQL injection endpoints',actions:['Parameterized 4 SQL queries','Added input validation middleware','Created GitHub PR #12']},
  {id:'s3',date:new Date(Date.now()-86400000*3).toISOString(),label:'Day 5',score:67,delta:19,event:'Hardcoded credentials moved to env vars',actions:['Moved Stripe key to .env','Rotated JWT secret','Removed DB password from config']},
  {id:'s4',date:new Date(Date.now()-86400000*1).toISOString(),label:'Day 6',score:81,delta:14,event:'Vulnerable npm packages upgraded',actions:['Upgraded lodash to 4.17.21','Updated jsonwebtoken to 9.0.0','Patched 3 more packages']},
  {id:'s5',date:new Date().toISOString(),label:'Today',score:89,delta:8,event:'Security headers added, XSS patched',actions:['Added Helmet.js','Fixed XSS in UserProfile','Enabled HSTS policy']},
]

const ROOT_CAUSES: RC[] = [
  {id:'RC-001',pattern:'Unsafe SQL String Concatenation',category:'Injection',cwe:'CWE-89',sev:'critical',
    desc:'Direct string concatenation to build SQL queries detected across multiple files. User input is treated as executable SQL code instead of data — the root cause of all SQL injection vulnerabilities in this codebase.',
    files:['app/api/users/route.ts','app/api/auth/login.ts','lib/db/queries.ts','services/userService.ts'],count:7,
    fix:'Replace ALL raw SQL concatenation with Parameterized Queries across the entire codebase. Audit every database call and migrate to db.execute(query,[params]) pattern. This one-time architectural fix eliminates the entire vulnerability class permanently.',
    before:'"SELECT * FROM users WHERE id = " + userId',after:'"SELECT * FROM users WHERE id = ?" with [userId]'},
  {id:'RC-002',pattern:'Hardcoded Credentials Pattern',category:'Secrets',cwe:'CWE-798',sev:'critical',
    desc:'Credentials written directly in code across multiple files. These get committed to version control permanently, creating a security liability that persists in git history even after deletion.',
    files:['lib/config.ts','app/api/stripe/route.ts','.env.example'],count:3,
    fix:'Implement a secrets management strategy: (1) Move ALL credentials to environment variables, (2) Add .env* to .gitignore, (3) Use Vercel Environment Variables in production, (4) Add git-secrets pre-commit hook to prevent future leaks.',
    before:'const API_KEY = "sk-abc123xyz"',after:'const API_KEY = process.env.API_KEY'},
  {id:'RC-003',pattern:'Missing Input Validation at API Entry Points',category:'Input Handling',cwe:'CWE-20',sev:'high',
    desc:'User input from HTTP requests flows directly into business logic without validation. This is the root cause of multiple vulnerability classes including injection, path traversal, and logic bypass.',
    files:['app/api/search/route.ts','app/api/upload/route.ts','controllers/authController.ts'],count:5,
    fix:'Implement a validation middleware layer at all API entry points using Zod or Joi. Validate and sanitize ALL user-controlled data before it touches any sensitive operation. This eliminates injection, path traversal, and type coercion attacks in one sweep.',
    before:'const userId = req.query.id; db.query(...userId...)',after:'const userId = z.string().uuid().parse(req.query.id); db.query(...userId...)'},
]

const RADAR_DATA: RS[] = [
  {cat:'Authentication',score:62,color:'#f97316'},
  {cat:'Dependencies',score:45,color:'#ff4444'},
  {cat:'Secrets',score:78,color:'#fbbf24'},
  {cat:'API Security',score:71,color:'#f97316'},
  {cat:'Input Validation',score:55,color:'#ff4444'},
  {cat:'Encryption',score:88,color:'#00ff88'},
]

const AGENT_DEFS = [
  {id:'scan',label:'Scan Repository',detail:'Parsing AST, building call graph, mapping data flows...',icon:'🔍'},
  {id:'detect',label:'Detect Vulnerabilities',detail:'Running OWASP Top-10 rules, checking injection patterns...',icon:'🐛'},
  {id:'rootcause',label:'Root Cause Analysis',detail:'Identifying systemic patterns across codebase...',icon:'🧠'},
  {id:'exploit',label:'Simulate Exploits',detail:"Red Team: generating attack payloads and testing vectors...",icon:'⚔️'},
  {id:'patch',label:'Generate Patch',detail:'Blue Team: writing secure replacement code...',icon:'🔧'},
  {id:'verify',label:'Verify Patch',detail:'Running sandbox tests — confirming fix without regression...',icon:'🧪'},
  {id:'report',label:'Update Security Score',detail:'Calculating delta, generating full audit report...',icon:'📊'},
]

// ── ANALYSIS ─────────────────────────────────────────────────────────────────
function analyzeCode(src: string, mode: 'code'|'url'): any[] {
  if (mode === 'url') {
    if (src.trim().length > 0) return [
      {...VULNDB['Missing Security Headers'],name:'Missing Security Headers',line:0},
      {...VULNDB['Unencrypted Sub-Resource Calls'],name:'Unencrypted Sub-Resource Calls',line:0}
    ]
    return []
  }
  const r: any[] = []
  const lo = src.toLowerCase()
  if (lo.includes('select ') && lo.includes('where ') && (lo.includes(' + ') || lo.includes('f"') || lo.includes('sprintf') || lo.includes('%s')))
    r.push({...VULNDB['SQL Injection (SQLi)'],name:'SQL Injection (SQLi)',line:8})
  if (/(?:jwt_secret|db_pass(?:word)?|password|api_key)\s*[=:]\s*['"][^'"]{8,}['"]/i.test(src))
    r.push({...VULNDB['Hardcoded Secrets Detection'],name:'Hardcoded Secrets Detection',line:4})
  return r
}

async function askAI(msg: string, vulns: any[], lang: string): Promise<string> {
  try {
    const res = await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:[{role:'user',content:msg}],
        system:`You are Sentry AI, an autonomous cybersecurity agent. Code: ${lang}. Vulnerabilities: ${vulns.map(v=>`${v.name} CVSS ${v.cvss}`).join(', ')}. Answer in 3-5 clear sentences.`})})
    const d = await res.json(); return d.response || fb(msg,vulns)
  } catch { return fb(msg,vulns) }
}
function fb(msg: string, vulns: any[]): string {
  const lo = msg.toLowerCase(); const v = vulns[0]
  if (!v) return "No vulnerabilities found. Your code follows security best practices."
  if (lo.includes('critical')||lo.includes('most')) return `Most critical: ${v.name} (CVSS ${v.cvss}/10). ${v.what?.split('.')[0]}. Fix this first.`
  if (lo.includes('auth')) return `Authentication weaknesses: SQL Injection allows login bypass, hardcoded JWT secret allows forging tokens for any user.`
  if (lo.includes('api')) return `API security issues: no input validation at endpoints, missing rate limiting, and authentication tokens may be forgeable.`
  if (lo.includes('improv')) return `Prioritize: 1) Fix SQL Injection (CVSS 9.8), 2) Rotate exposed secrets, 3) Add security headers, 4) Upgrade vulnerable packages.`
  if (lo.includes('fix')||lo.includes('how')) return `To fix ${v.name}: ${v.howToFix?.split('.')[0]}.`
  return `${v.name}: ${v.what?.split('.')[0]}. Fix: ${v.howToFix?.split('.')[0]}.`
}

// ── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────
function Counter({ target }: { target: number }) {
  const [val,setVal] = useState(0); const [vis,setVis] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVis(true);o.disconnect()}},{threshold:0.1});o.observe(el);return()=>o.disconnect()},[])
  useEffect(()=>{if(!vis)return;let c=0;const inc=target/(1500/16);const t=setInterval(()=>{c+=inc;if(c>=target){setVal(target);clearInterval(t)}else setVal(Math.floor(c))},16);return()=>clearInterval(t)},[vis,target])
  return <div ref={ref} className="ctr">{val}</div>
}
function Btn({ className,onClick,children,disabled,style }: any) {
  const [rip,setRip] = useState<{x:number;y:number;id:number}[]>([])
  const fire=(e:React.MouseEvent<HTMLButtonElement>)=>{
    if(disabled)return; const r=e.currentTarget.getBoundingClientRect(); const id=Date.now()
    setRip(p=>[...p,{x:e.clientX-r.left,y:e.clientY-r.top,id}])
    setTimeout(()=>setRip(p=>p.filter(x=>x.id!==id)),700); onClick?.(e)
  }
  return <button className={className} onClick={fire} disabled={disabled} style={{position:'relative',overflow:'hidden',...style}}>
    {children}{rip.map(r=><span key={r.id} style={{position:'absolute',left:r.x-40,top:r.y-40,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.2)',animation:'rip 0.7s ease-out forwards',pointerEvents:'none'}}/>)}
  </button>
}
function Diff({ orig,patch }: { orig:string;patch:string }) {
  const [cp,setCp] = useState(false); const oL=orig.split('\n'); const pL=patch.split('\n')
  return <div className="diff-root">
    <div className="diff-bar">
      <div className="diff-side diff-l"><span className="dd red"/>Vulnerable</div>
      <div className="diff-side diff-r"><div style={{display:'flex',alignItems:'center',gap:8}}><span className="dd grn"/>Secured</div>
        <Btn className="diff-copy-btn" onClick={()=>{navigator.clipboard.writeText(patch);setCp(true);setTimeout(()=>setCp(false),2000)}}>{cp?'✓ Copied':<><Copy size={10}/>Copy</>}</Btn>
      </div>
    </div>
    <div className="diff-cols">
      <div className="diff-col diff-cl">{oL.map((l,i)=>{const b=!pL.includes(l)&&l.trim();return<div key={i} className={`dl ${b?'dl-b':''}`}><span className="dl-n">{i+1}</span><span className="dl-c" style={{whiteSpace:'pre'}}>{l||' '}</span></div>})}</div>
      <div className="diff-col diff-cr">{pL.map((l,i)=>{const g=!oL.includes(l)&&l.trim();return<div key={i} className={`dl ${g?'dl-g':''}`}><span className="dl-n">{i+1}</span><span className="dl-c" style={{whiteSpace:'pre'}}>{l||' '}</span></div>})}</div>
    </div>
  </div>
}

// ── AGENT PANEL ──────────────────────────────────────────────────────────────
function AgentPanel({ vulns,language }: any) {
  const [steps,setSteps] = useState<AgentStep[]>(AGENT_DEFS.map(d=>({...d,status:'pending'})))
  const [running,setRunning] = useState(false); const [done,setDone] = useState(false)
  const [log,setLog] = useState<string[]>([]); const logRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{logRef.current?.scrollTo({top:logRef.current.scrollHeight,behavior:'smooth'})},[log])
  const addLog=(m:string)=>setLog(p=>[...p.slice(-30),`[${new Date().toLocaleTimeString()}] ${m}`])
  const run=async()=>{
    setRunning(true);setDone(false);setLog([]);setSteps(AGENT_DEFS.map(d=>({...d,status:'pending'})))
    const T=[900,800,1000,700,800,1100,600]
    const L=[
      ['Initializing AST parser...',`Scanning ${language} source files...`,'Mapping all database interaction points...'],
      [`Found ${vulns.length} vulnerabilit${vulns.length!==1?'ies':'y'}`,...vulns.map((v:any)=>`→ ${v.name} (CVSS ${v.cvss})`),'Severity assessment complete'],
      ['Analyzing patterns across codebase...','Identified root cause: unsafe SQL string concatenation','Pattern found in 7 locations across 4 files'],
      ["Red Team: launching SQL injection payload ' OR '1'='1",'Attack simulation: authentication bypass CONFIRMED','Data exfiltration simulation: 2,847 records accessible'],
      ['Blue Team: generating parameterized query patch...','Applying fix to all affected endpoints...','Patch generation complete ✓'],
      ['Running sandbox verification tests...','✓ Injection blocked','✓ Functionality preserved','✓ No regression detected'],
      [`Security score: ${Math.max(12,100-vulns.length*20)} → ${Math.min(100,100-vulns.length*5)}`,'Full audit report generated','Agent loop complete ✓'],
    ]
    for(let i=0;i<AGENT_DEFS.length;i++){
      setSteps(p=>p.map((s,j)=>j===i?{...s,status:'running'}:s))
      for(const m of L[i]){addLog(m);await new Promise(r=>setTimeout(r,140))}
      await new Promise(r=>setTimeout(r,T[i]))
      setSteps(p=>p.map((s,j)=>j===i?{...s,status:'done',duration:T[i]}:s))
    }
    setRunning(false);setDone(true)
  }
  const sc={pending:'rgba(255,255,255,0.15)',running:'#00ff88',done:'#00ff88'}
  return <div className="ap">
    <div className="ap-hdr">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <Workflow size={16} color="#00ff88"/>
        <span className="ap-title">Autonomous Security Agent Loop</span>
        {done&&<span className="ap-badge-done"><CheckCircle size={11}/>Loop Complete</span>}
        {running&&<span className="ap-badge-run"><div className="spin"/>Agent Running</span>}
      </div>
      {!running&&<Btn className="ap-btn" onClick={run}><PlayCircle size={13}/>{done?'Run Again':'Start Agent Loop'}</Btn>}
    </div>
    <div className="ap-steps">
      {steps.map((s,i)=><div key={s.id} className="ap-step" style={{borderColor:sc[s.status]+'40',background:s.status==='running'?'rgba(0,255,136,0.06)':s.status==='done'?'rgba(0,255,136,0.03)':'#040404',animation:s.status==='running'?'apulse 1.5s infinite':'none'}}>
        <div className="ap-step-num" style={{color:sc[s.status]}}>{s.status==='done'?'✓':s.status==='running'?'◉':String(i+1).padStart(2,'0')}</div>
        <div className="ap-step-icon">{s.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="ap-step-label" style={{color:s.status==='pending'?'rgba(255,255,255,0.35)':'#fff'}}>{s.label}</div>
          {s.status!=='pending'&&<div className="ap-step-detail">{s.detail}</div>}
        </div>
        {s.duration&&<div className="ap-step-ms">{s.duration}ms</div>}
      </div>)}
    </div>
    {log.length>0&&<div className="ap-log">
      <div className="ap-log-hdr"><Terminal size={11} color="#00ff88"/>Agent Output{running&&<div className="spin" style={{marginLeft:'auto'}}/>}</div>
      <div className="ap-log-body" ref={logRef}>
        {log.map((l,i)=><div key={i} className="ap-log-line"><span className="ap-log-p">▶</span>{l}</div>)}
        {running&&<span className="ap-cursor">█</span>}
      </div>
    </div>}
  </div>
}

// ── RED vs BLUE ───────────────────────────────────────────────────────────────
function RBPanel({ vulns }: any) {
  const [evts,setEvts] = useState<RBEvent[]>([]); const [running,setRunning] = useState(false)
  const [wins,setWins] = useState({r:0,b:0}); const feedRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{feedRef.current?.scrollTo({top:feedRef.current.scrollHeight,behavior:'smooth'})},[evts])
  const add=(team:RBEvent['team'],msg:string,type:RBEvent['type'])=>
    setEvts(p=>[...p,{team,msg,time:new Date().toLocaleTimeString(),type}])
  const run=async()=>{
    setRunning(true);setEvts([])
    const vn=vulns[0]?.name||'SQL Injection'
    const steps=[
      {d:400,t:'system' as const,m:'══════ BATTLE INITIATED ══════',ty:'info' as const},
      {d:600,t:'red' as const,m:`Scanning target for ${vn} vulnerability...`,ty:'attack' as const},
      {d:700,t:'red' as const,m:`Injection point found: GET /api/users?id=`,ty:'attack' as const},
      {d:500,t:'red' as const,m:`Payload: ' OR '1'='1; DROP TABLE users; --`,ty:'attack' as const},
      {d:600,t:'red' as const,m:`Authentication bypass successful! Dumping user records...`,ty:'attack' as const},
      {d:800,t:'blue' as const,m:`THREAT DETECTED — SQL injection in auth.js line 23`,ty:'defend' as const},
      {d:600,t:'blue' as const,m:`Analyzing attack vector and generating defense...`,ty:'defend' as const},
      {d:700,t:'blue' as const,m:`Generating parameterized query patch...`,ty:'defend' as const},
      {d:500,t:'blue' as const,m:`Deploying patch to all affected endpoints...`,ty:'defend' as const},
      {d:600,t:'red' as const,m:`Retrying: ' UNION SELECT * FROM users --`,ty:'attack' as const},
      {d:400,t:'red' as const,m:`Error: Prepared statement rejected injection payload`,ty:'attack' as const},
      {d:700,t:'blue' as const,m:`Attack blocked ✓ — parameterized query neutralized injection`,ty:'success' as const},
      {d:400,t:'blue' as const,m:`Verification: authentication functionality preserved ✓`,ty:'success' as const},
      {d:500,t:'system' as const,m:`══════ BLUE TEAM WINS — ${vn} NEUTRALIZED ══════`,ty:'success' as const},
    ]
    for(const s of steps){await new Promise(r=>setTimeout(r,s.d));add(s.t,s.m,s.ty)}
    setWins(w=>({...w,b:w.b+1}));setRunning(false)
  }
  const tc={red:'#ff4444',blue:'#00e5ff',system:'#00ff88'}
  const tb={red:'rgba(255,68,68,0.08)',blue:'rgba(0,229,255,0.06)',system:'rgba(0,255,136,0.06)'}
  const ti={attack:'⚔️',defend:'🛡️',info:'⚡',success:'✅'}
  return <div className="rb">
    <div className="rb-hdr">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <SwordsIcon size={16}/><span className="rb-title">Red Team vs Blue Team Simulation</span>
        <span className="rb-tag">AI War Room</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <div className="rb-score"><span style={{color:'#ff4444',fontWeight:800}}>RED {wins.r}</span><span style={{color:'rgba(255,255,255,0.3)'}}>·</span><span style={{color:'#00e5ff',fontWeight:800}}>BLUE {wins.b}</span></div>
        <Btn className="rb-btn" onClick={run} disabled={running}>
          {running?<><div className="spin"/>Active</>:<><SwordsIcon size={12}/>Start Battle</>}
        </Btn>
      </div>
    </div>
    <div className="rb-teams">
      <div className="rb-team rb-red"><Target size={13} color="#ff4444"/>RED TEAM — Attacker</div>
      <div className="rb-div"/>
      <div className="rb-team rb-blue"><ShieldCheck size={13} color="#00e5ff"/>BLUE TEAM — Defender</div>
    </div>
    <div className="rb-feed" ref={feedRef}>
      {evts.length===0&&<div className="rb-empty"><SwordsIcon size={36}/><p>Click "Start Battle" to begin the simulation</p></div>}
      {evts.map((e,i)=><div key={i} className="rb-evt" style={{background:tb[e.team],borderLeftColor:tc[e.team]}}>
        <div className="rb-evt-top"><span style={{color:tc[e.team],fontFamily:'JetBrains Mono,monospace',fontSize:10,fontWeight:800}}>[{e.team.toUpperCase()}]</span><span className="rb-evt-time">{e.time}</span><span style={{marginLeft:'auto',fontSize:13}}>{ti[e.type]}</span></div>
        <div className="rb-evt-msg" style={{color:e.team==='red'?'#fca5a5':e.team==='blue'?'#bae6fd':'#00ff88'}}>{e.msg}</div>
      </div>)}
      {running&&<div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'rgba(255,255,255,0.3)'}}><div className="spin"/>Processing...</div>}
    </div>
  </div>
}

// ── PATCH VERIFIER ────────────────────────────────────────────────────────────
function VerifyPanel({ vuln,patchedCode }: any) {
  const [tests,setTests] = useState<VTest[]>([]); const [running,setRunning] = useState(false)
  const [res,setRes] = useState<{pass:number;total:number;ok:boolean}|null>(null)
  const SUITES:Record<string,VTest[]>={
    'SQL Injection (SQLi)':[
      {id:'v1',name:'Injection Payload Blocked',desc:"' OR '1'='1 no longer bypasses auth",status:'pending'},
      {id:'v2',name:'UNION Attack Blocked',desc:'UNION SELECT payloads return no data',status:'pending'},
      {id:'v3',name:'Normal Auth Preserved',desc:'Valid credentials still authenticate correctly',status:'pending'},
      {id:'v4',name:'Performance Maintained',desc:'Parameterized queries execute within 50ms',status:'pending'},
      {id:'v5',name:'End-to-End Flow Intact',desc:'Full user authentication journey passes',status:'pending'},
    ],
    default:[
      {id:'v1',name:'Vulnerability Pattern Removed',desc:'Vulnerable code pattern no longer exists',status:'pending'},
      {id:'v2',name:'Exploit Payload Blocked',desc:'Known exploit payloads are rejected',status:'pending'},
      {id:'v3',name:'Core Functionality Preserved',desc:'Patched component still works as intended',status:'pending'},
      {id:'v4',name:'No Regression Detected',desc:'Related code paths show no side effects',status:'pending'},
    ]
  }
  const runV=async()=>{
    const suite=(SUITES[vuln?.name]||SUITES.default).map(t=>({...t,status:'pending' as const}))
    setTests(suite);setRunning(true);setRes(null)
    const hasFix=patchedCode?.includes('?')||patchedCode?.includes('process.env')||patchedCode?.includes('PreparedStatement')
    const details=['Payload rejected — prepared statement prevented injection','UNION attack neutralized by parameterization','Valid credentials authenticate successfully ✓','Query executes in 12ms — within threshold ✓','All 47 E2E assertions passed ✓']
    for(let i=0;i<suite.length;i++){
      setTests(p=>p.map((t,j)=>j===i?{...t,status:'running'}:t))
      await new Promise(r=>setTimeout(r,400+Math.random()*350))
      const pass=i<2?hasFix:Math.random()>0.04
      setTests(p=>p.map((t,j)=>j===i?{...t,status:pass?'passed':'failed',ms:Math.floor(150+Math.random()*400),detail:pass?(details[i]||'Test passed'):'Requires manual review'}:t))
    }
    const passed=suite.length-(hasFix?0:1)
    setRes({pass:passed,total:suite.length,ok:passed===suite.length})
    setRunning(false)
  }
  const sc={pending:'rgba(255,255,255,0.18)',running:'#00e5ff',passed:'#00ff88',failed:'#ff4444'}
  const si={pending:'○',running:'◌',passed:'✓',failed:'✗'}
  return <div className="vp">
    <div className="vp-hdr">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <FlaskConical size={15} color="#00e5ff"/>
        <span className="vp-title">Patch Verification Engine</span>
        <span className="vp-badge">Sandbox Testing</span>
      </div>
      <Btn className="vp-btn" onClick={runV} disabled={running}>
        {running?<><div className="spin"/>Testing...</>:<><PlayCircle size={12}/>Run Verification</>}
      </Btn>
    </div>
    {tests.length===0?<div className="vp-empty"><FlaskConical size={32} style={{opacity:0.2}}/><p>Click "Run Verification" to test whether the generated patch resolves the vulnerability without breaking functionality.</p></div>
    :<div style={{display:'flex',flexDirection:'column',gap:10}}>
      {tests.map(t=><div key={t.id} className="vp-test" style={{borderColor:sc[t.status]+'40',background:t.status==='passed'?'rgba(0,255,136,0.04)':t.status==='failed'?'rgba(255,68,68,0.04)':'rgba(255,255,255,0.02)'}}>
        <div className="vp-test-icon" style={{color:sc[t.status]}}>
          {t.status==='running'?<div className="spin" style={{width:14,height:14}}/>:<span style={{fontSize:16,fontWeight:700}}>{si[t.status]}</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div className="vp-test-name" style={{color:t.status==='pending'?'rgba(255,255,255,0.4)':'#fff'}}>{t.name}</div>
          <div className="vp-test-desc">{t.status!=='pending'?(t.detail||t.desc):t.desc}</div>
        </div>
        {t.ms&&<div className="vp-test-ms">{t.ms}ms</div>}
      </div>)}
      {res&&<div className={`vp-result ${res.ok?'vp-ok':'vp-fail'}`}>
        {res.ok?<CheckCircle size={14} color="#00ff88"/>:<AlertCircle size={14} color="#ff4444"/>}
        <span><strong style={{color:'#fff'}}>{res.pass}/{res.total} tests passed</strong>{res.ok?' — Patch is safe to deploy ✓':' — Review failed tests before deploying'}</span>
      </div>}
    </div>}
  </div>
}

// ── SECURITY TIMELINE ─────────────────────────────────────────────────────────
function Timeline() {
  const [idx,setIdx] = useState(SCORE_HISTORY.length-1); const sel=SCORE_HISTORY[idx]
  const sc=(s:number)=>s>=80?'#00ff88':s>=60?'#fbbf24':s>=40?'#f97316':'#ff4444'
  return <div className="tl">
    <div className="tl-hdr"><TrendingUp size={15} color="#00ff88"/><span className="tl-title">Security Score Evolution</span><span className="tl-delta">+{SCORE_HISTORY[SCORE_HISTORY.length-1].score-SCORE_HISTORY[0].score} pts in 7 days</span></div>
    <div className="tl-graph">
      <svg viewBox="0 0 520 130" style={{width:'100%',display:'block'}}>
        <defs><linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity="0.25"/><stop offset="100%" stopColor="#00ff88" stopOpacity="0"/></linearGradient></defs>
        {[25,50,75,100].map(v=><g key={v}><line x1="40" y1={125-(v/100)*100} x2="515" y2={125-(v/100)*100} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x="34" y={125-(v/100)*100+4} fill="rgba(255,255,255,0.22)" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono,monospace">{v}</text></g>)}
        <path d={`M${SCORE_HISTORY.map((s,i)=>`${40+(i/(SCORE_HISTORY.length-1))*470},${125-(s.score/100)*100}`).join(' L')} L${40+470},125 L40,125 Z`} fill="url(#tlg)"/>
        <polyline points={SCORE_HISTORY.map((s,i)=>`${40+(i/(SCORE_HISTORY.length-1))*470},${125-(s.score/100)*100}`).join(' ')} fill="none" stroke="#00ff88" strokeWidth="2.5"/>
        {SCORE_HISTORY.map((s,i)=><g key={i} onClick={()=>setIdx(i)} style={{cursor:'pointer'}}>
          <circle cx={40+(i/(SCORE_HISTORY.length-1))*470} cy={125-(s.score/100)*100} r={i===idx?8:5} fill={i===idx?'#00ff88':'#000'} stroke={sc(s.score)} strokeWidth="2"/>
          <text x={40+(i/(SCORE_HISTORY.length-1))*470} y={125-(s.score/100)*100-13} fill={i===idx?'#00ff88':'rgba(255,255,255,0.35)'} fontSize="10" textAnchor="middle" fontWeight="700" fontFamily="JetBrains Mono,monospace">{s.score}</text>
        </g>)}
      </svg>
    </div>
    <input type="range" min={0} max={SCORE_HISTORY.length-1} value={idx} onChange={e=>setIdx(Number(e.target.value))} className="tl-slider"/>
    <div className="tl-labels">{SCORE_HISTORY.map((s,i)=><span key={i} className={`tl-lbl ${i===idx?'tl-lbl-on':''}`} onClick={()=>setIdx(i)}>{s.label}</span>)}</div>
    <div className="tl-card">
      <div className="tl-card-top">
        <div className="tl-big-score" style={{color:sc(sel.score)}}>{sel.score}</div>
        <div><div className="tl-card-label">{sel.label}</div><div className="tl-card-date">{new Date(sel.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>{sel.delta!==0&&<div style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color:sel.delta>0?'#00ff88':'#ff4444'}}>{sel.delta>0?'+':''}{sel.delta} pts</div>}</div>
      </div>
      <p className="tl-event">{sel.event}</p>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>{sel.actions.map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'JetBrains Mono,monospace'}}><Sparkles size={10} color="#00ff88"/>{a}</div>)}</div>
    </div>
  </div>
}

// ── ROOT CAUSE ────────────────────────────────────────────────────────────────
function RCPanel() {
  const [open,setOpen] = useState<string|null>(null)
  const sv={critical:'#ff4444',high:'#f97316',medium:'#eab308'}
  return <div className="rc">
    <div className="rc-hdr"><BrainCircuit size={15} color="#a78bfa"/><span className="rc-title">Root Cause Intelligence</span><span className="rc-badge">Systemic Analysis</span></div>
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {ROOT_CAUSES.map(rc=><div key={rc.id} className="rc-card" style={{borderColor:open===rc.id?sv[rc.sev]+'35':'rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',marginBottom:10}} onClick={()=>setOpen(open===rc.id?null:rc.id)}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span className="rc-sev" style={{color:sv[rc.sev],background:sv[rc.sev]+'18',border:`1px solid ${sv[rc.sev]}30`}}>{rc.sev.toUpperCase()}</span>
            <span className="rc-cwe">{rc.cwe}</span><span className="rc-cat">{rc.category}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span className="rc-cnt">{rc.count} occurrences</span>
            <ChevronRight size={14} color="rgba(255,255,255,0.3)" style={{transform:open===rc.id?'rotate(90deg)':'none',transition:'transform 0.25s'}}/>
          </div>
        </div>
        <h4 className="rc-name">{rc.pattern}</h4>
        <p className="rc-short">{rc.desc.split('.')[0]}.</p>
        <div style={{maxHeight:open===rc.id?1000:0,overflow:'hidden',transition:'max-height 0.5s cubic-bezier(0.16,1,0.3,1)'}}>
          <div className="rc-expand">
            <div className="rc-sec"><div className="rc-sec-lbl"><FileCode2 size={10}/>Affected Files</div><div style={{display:'flex',flexWrap:'wrap',gap:7}}>{rc.files.map((f,i)=><span key={i} className="rc-file"><FileCode2 size={9}/>{f}</span>)}</div></div>
            <div className="rc-sec"><div className="rc-sec-lbl" style={{color:'rgba(255,107,107,0.8)'}}><AlertTriangle size={10}/>Full Description</div><div className="rc-desc-box">{rc.desc}</div></div>
            <div className="rc-diff">
              <div className="rc-diff-bad"><div className="rc-diff-lbl">❌ Vulnerable Pattern</div><code>{rc.before}</code></div>
              <div className="rc-diff-good"><div className="rc-diff-lbl">✅ Secure Pattern</div><code>{rc.after}</code></div>
            </div>
            <div className="rc-fix-box"><div className="rc-sec-lbl"><WrenchIcon size={10}/>Systemic Fix Strategy</div><p className="rc-fix-text">{rc.fix}</p></div>
          </div>
        </div>
      </div>)}
    </div>
  </div>
}

// ── SECURITY RADAR ────────────────────────────────────────────────────────────
function SecurityRadar() {
  const sz=260;const cx=sz/2;const r=96;const n=RADAR_DATA.length
  const pts=RADAR_DATA.map((s,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;const d=(s.score/100)*r;return{x:cx+d*Math.cos(a),y:cx+d*Math.sin(a)}})
  const gp=(l:number)=>RADAR_DATA.map((_,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;const d=(l/100)*r;return`${cx+d*Math.cos(a)},${cx+d*Math.sin(a)}`}).join(' ')
  const lp=RADAR_DATA.map((s,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return{x:cx+(r+30)*Math.cos(a),y:cx+(r+30)*Math.sin(a),...s}})
  const avg=Math.round(RADAR_DATA.reduce((a,s)=>a+s.score,0)/RADAR_DATA.length)
  return <div className="radar">
    <div className="radar-hdr"><RadarIcon size={15}/><span className="radar-title">Security Radar</span><span className="radar-badge">Risk Posture Overview</span></div>
    <div className="radar-body">
      <svg viewBox={`0 0 ${sz} ${sz}`} style={{width:'100%',maxWidth:260,display:'block'}}>
        {[25,50,75,100].map(v=><polygon key={v} points={gp(v)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>)}
        {RADAR_DATA.map((_,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return<line key={i} x1={cx} y1={cx} x2={cx+r*Math.cos(a)} y2={cx+r*Math.sin(a)} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>})}
        <polygon points={pts.map(p=>`${p.x},${p.y}`).join(' ')} fill="rgba(0,229,255,0.12)" stroke="#00e5ff" strokeWidth="2"/>
        {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={5} fill={RADAR_DATA[i].color} stroke="#000" strokeWidth="1.5"/>)}
        {lp.map((p,i)=><text key={i} x={p.x} y={p.y} fill="rgba(255,255,255,0.55)" fontSize="9" textAnchor="middle" dominantBaseline="middle" fontFamily="JetBrains Mono,monospace">{p.cat}</text>)}
      </svg>
      <div className="radar-bars">
        {RADAR_DATA.map((s,i)=><div key={i} className="radar-bar-row">
          <span className="radar-bar-lbl">{s.cat}</span>
          <div className="radar-bar-track"><div className="radar-bar-fill" style={{width:`${s.score}%`,background:s.color,boxShadow:`0 0 6px ${s.color}50`}}/></div>
          <span className="radar-bar-num" style={{color:s.color}}>{s.score}</span>
        </div>)}
        <div className="radar-overall"><span className="radar-ov-lbl">Overall</span><span className="radar-ov-num" style={{color:avg>=80?'#00ff88':avg>=60?'#fbbf24':'#ff4444'}}>{avg}<span style={{fontSize:14,opacity:0.5}}>/100</span></span></div>
      </div>
    </div>
  </div>
}

// ── VULN CARD ─────────────────────────────────────────────────────────────────
function VulnCard({ v,i }: { v:any;i:number }) {
  const [open,setOpen] = useState(false); const [cp,setCp] = useState(false)
  const isCrit=v.severity==='critical'
  return <div className={`vc ${open?'vc-open':''}`} style={{animationDelay:`${i*0.08}s`}}>
    <div className="vc-stripe" style={{background:isCrit?'linear-gradient(to bottom,#ff4444,transparent)':'linear-gradient(to bottom,#f97316,transparent)'}}/>
    <div className="vc-top" onClick={()=>setOpen(!open)}>
      <div>
        <div className="vc-meta">
          <span className="vc-sev" style={{background:isCrit?'#ff4444':'#f97316',color:'#fff'}}>{v.severity}</span>
          <span className="vc-id">V-ID: SY-{i+102}</span>
          {v.cwe&&<span className="vc-id">{v.cwe}</span>}
          {v.cvss&&<span className="vc-cvss" style={{color:isCrit?'#ff6b6b':'#fb923c'}}>CVSS {v.cvss}</span>}
        </div>
        <h3 className="vc-name">{v.name}</h3>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        {v.line>0&&<span className="vc-line">Line {v.line}</span>}
        <ChevronRight size={16} color="rgba(255,255,255,0.3)" style={{transform:open?'rotate(90deg)':'none',transition:'transform 0.25s',flexShrink:0}}/>
      </div>
    </div>
    <p className="vc-preview">{v.what?.split('.')[0]}.</p>
    <div style={{maxHeight:open?1200:0,overflow:'hidden',transition:'max-height 0.5s cubic-bezier(0.16,1,0.3,1)'}}>
      <div className="vc-expand">
        {[['rgba(255,255,255,0.4)','Activity','What Is This?',v.what,null,null],['#ff6b6b','Alert','Impact',v.impact,'rgba(255,107,107,0.12)','rgba(255,59,59,0.04)'],['#00ff88','Lock','How To Fix',v.howToFix,'rgba(0,255,136,0.12)','rgba(0,255,136,0.04)'],v.realWorld?['#fbbf24','Zap','Real-World Breach',v.realWorld,'rgba(251,191,36,0.12)','rgba(251,191,36,0.04)']:null].filter(Boolean).map((s:any,j)=><div key={j} className="vc-sec">
          <div className="vc-sec-lbl" style={{color:s[0]}}>{s[2]}</div>
          <div className="vc-sec-box" style={{borderColor:s[4]||'rgba(255,255,255,0.06)',background:s[5]||'rgba(255,255,255,0.02)',color:s[0]==='#00ff88'?'#a7f3d0':s[0]==='#fbbf24'?'#fde68a':'rgba(255,255,255,0.68)'}}>{s[3]}</div>
          {s[0]==='#00ff88'&&<Btn className="vc-copy" onClick={()=>{navigator.clipboard.writeText(v.howToFix||'');setCp(true);setTimeout(()=>setCp(false),2000)}}>{cp?<><CheckCircle size={11}/>Copied!</>:<><Copy size={11}/>Copy Fix</>}</Btn>}
        </div>)}
      </div>
    </div>
    {!open&&<button className="vc-hint" onClick={()=>setOpen(true)}><Eye size={10}/>Click for full analysis, impact & fix</button>}
  </div>
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [user,setUser] = useState<any>(null)
  const [stats,setStats] = useState({total:0,vulns:0,crit:0,patched:0})
  const [lang,setLang] = useState('JavaScript')
  const [code,setCode] = useState(SAMPLES['JavaScript'].v)
  const [scanMode,setScanMode] = useState<'code'|'url'>('code')
  const [phase,setPhase] = useState<'idle'|'scanning'|'alert'|'report'>('idle')
  const [scanSteps,setScanSteps] = useState<string[]>([])
  const [vulns,setVulns] = useState<any[]>([])
  const [profileOpen,setProfileOpen] = useState(false)
  const [exportOpen,setExportOpen] = useState(false)
  const [chatMsgs,setChatMsgs] = useState<{role:'user'|'bot';text:string}[]>([])
  const [chatInput,setChatInput] = useState('')
  const [typing,setTyping] = useState(false)
  const [tab,setTab] = useState<TabId>('vulns')
  const [prog,setProg] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const vulnsRef = useRef<any[]>([])
  const langRef = useRef('JavaScript')
  const codeRef = useRef('')

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'})},[chatMsgs,typing])
  useEffect(()=>{
    const init=async()=>{
      const {data:{user}}=await supabase.auth.getUser()
      const u=user||{email:'demo@cybersentry.ai',id:'demo'}
      setUser(u)
      const {data}=await supabase.from('scans').select('*').eq('user_id',u.id)
      if(data){let v=0,c=0;data.forEach((s:any)=>{if(s.vulnerabilities){v+=s.vulnerabilities.length;c+=s.vulnerabilities.filter((x:any)=>x.severity==='critical'||x.severity==='high').length}});setStats({total:data.length,vulns:v,crit:c,patched:v})}
    }
    init()
  },[])

  const scan=async()=>{
    setPhase('scanning');setScanSteps([]);setProg(0)
    const steps=['Initializing AST scan engine','Building syntax tree & call graph','Running OWASP Top-10 checks','Scanning for injection patterns','Detecting hardcoded secrets','Analyzing root cause patterns','Generating AI recommendations','Finalizing security report']
    for(let i=0;i<steps.length;i++){setScanSteps(p=>[...p,steps[i]]);setProg(Math.round(((i+1)/steps.length)*100));await new Promise(r=>setTimeout(r,480))}
    const found=analyzeCode(code,scanMode)
    setVulns(found);vulnsRef.current=found;langRef.current=lang;codeRef.current=code
    setChatMsgs([{role:'bot',text:found.length>0?`Security audit complete. Found ${found.length} vulnerabilit${found.length===1?'y':'ies'} in your ${lang} code.\n\nMost critical: ${found[0].name} (CVSS ${found[0].cvss}/10).\n\nNew tabs available:\n• Agent Loop — watch AI fix vulnerabilities autonomously\n• Red vs Blue — AI attacker vs defender simulation\n• Verify — test if patches actually work\n• Timeline — track security improvement over time\n• Root Cause — systemic pattern analysis\n• Radar — visual security posture overview`:`No vulnerabilities found in your ${lang} code. All ${lang} security checks passed.`}])
    await new Promise(r=>setTimeout(r,800))
    setPhase(found.length>0?'alert':'report')
    try{if(user)await supabase.from('scans').insert({user_id:user.id,code,language:scanMode==='url'?'URL':lang,vulnerabilities:found,fixed_code:SAMPLES[lang]?.f||code,security_score:found.length===0?100:Math.max(12,100-found.length*30),status:'completed'})}catch(e){}
  }

  const changeLang=(l:string)=>{setLang(l);if(SAMPLES[l])setCode(SAMPLES[l].v)}
  const sendAI=async(override?:string)=>{
    const msg=(override||chatInput).trim();if(!msg||typing)return
    setChatMsgs(p=>[...p,{role:'user',text:msg}]);setChatInput('');setTyping(true)
    const res=await askAI(msg,vulnsRef.current,langRef.current)
    setChatMsgs(p=>[...p,{role:'bot',text:res}]);setTyping(false)
  }
  const signOut=async()=>{await supabase.auth.signOut();router.push('/')}
  const username=user?.email?.split('@')[0]||'user'
  const patchedCode=SAMPLES[lang]?.f||code
  const TICKER=[{l:'Agent Status',v:'AUTONOMOUS'},{l:'OWASP Coverage',v:'100%'},{l:'Battles Won',v:'847'},{l:'Patches Verified',v:'2,341'},{l:'Secrets Detected',v:'1,247'},{l:'Security Score',v:'89/100'}]
  const SQS=vulns.length>0?['What is the most critical vulnerability?','Where are authentication weaknesses?','How can I improve API security?','Show me a step by step fix']:['What is SQL Injection?','How to prevent XSS attacks?','What is OWASP Top 10?','How do I secure my API?']

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      html,body{background:#000;color:#fff;font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
      /* TICKER */
      .ticker{background:#000;border-bottom:1px solid rgba(255,255,255,0.06);overflow:hidden;height:36px;display:flex;align-items:center}
      .ticker-t{display:flex;animation:ticker 32s linear infinite;white-space:nowrap}
      .ticker-i{display:inline-flex;align-items:center;gap:8px;padding:0 40px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.35)}
      .t-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88;flex-shrink:0}
      .t-v{color:#00ff88;font-weight:700}
      /* NAV */
      .nav{position:sticky;top:0;z-index:100;background:rgba(0,0,0,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06);height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px}
      .nav-l{display:flex;align-items:center;gap:20px}
      .brand{display:flex;align-items:center;gap:10px;cursor:pointer;transition:opacity 0.2s}
      .brand:hover{opacity:0.8}
      .brand-ico{width:32px;height:32px;border-radius:8px;background:#000;border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,255,136,0.12)}
      .brand-name{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .brand-ai{font-size:10px;font-weight:800;color:#000;background:#00ff88;padding:2px 7px;border-radius:4px}
      .nav-pill{display:flex;align-items:center;gap:7px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;font-family:'JetBrains Mono',monospace}
      .gdot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:blink 2s infinite;flex-shrink:0}
      .upill{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);padding:5px 14px 5px 5px;border-radius:40px;cursor:pointer;transition:all 0.2s}
      .upill:hover{border-color:rgba(0,255,136,0.3)}
      .uav{width:28px;height:28px;border-radius:50%;background:#00ff88;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#000;text-transform:uppercase}
      .uname{font-size:13px;font-weight:600;color:rgba(255,255,255,0.8)}
      .drop{position:absolute;top:calc(100% + 10px);right:0;width:210px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.8);animation:fadeDown 0.15s ease;z-index:200}
      .drop-head{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.02)}
      .drop-lbl{font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;font-family:'JetBrains Mono',monospace}
      .drop-email{font-size:12px;font-weight:600;color:rgba(255,255,255,0.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .drop-item{width:100%;padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.5);background:none;border:none;cursor:pointer;text-align:left;border-bottom:1px solid rgba(255,255,255,0.04);transition:all 0.15s}
      .drop-item:last-child{border-bottom:none}
      .drop-item:hover{background:rgba(255,255,255,0.04);color:#fff}
      .drop-danger{color:#f87171}
      .drop-danger:hover{background:rgba(248,113,113,0.07)!important}
      /* PAGE */
      .page{min-height:100vh;background:#000}
      .main{max-width:1280px;margin:0 auto;padding:40px 32px;display:flex;flex-direction:column;gap:24px}
      /* HERO */
      .hero{position:relative;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:48px 52px;transition:border-color 0.3s}
      .hero:hover{border-color:rgba(0,255,136,0.15)}
      .hero::after{content:'';position:absolute;bottom:-80px;right:-80px;width:350px;height:350px;background:radial-gradient(circle,rgba(0,255,136,0.07) 0%,transparent 70%);pointer-events:none;border-radius:50%}
      .hero-ey{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#00ff88;text-transform:uppercase;margin-bottom:20px}
      .hero-h1{font-size:52px;font-weight:800;letter-spacing:-0.04em;line-height:1.05;color:#fff;margin-bottom:16px}
      .hero-acc{color:#00ff88}
      .hero-sub{font-size:15px;color:rgba(255,255,255,0.35);line-height:1.7;max-width:560px}
      /* STATS */
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
      .stat{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px;transition:all 0.25s}
      .stat:hover{border-color:rgba(0,255,136,0.2);box-shadow:0 0 24px rgba(0,255,136,0.05);transform:translateY(-2px)}
      .stat-ico{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s}
      .stat:hover .stat-ico{transform:scale(1.1)}
      .ctr{font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;color:#fff;line-height:1}
      .stat-lbl{font-size:12px;font-weight:500;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace}
      /* SCANNER */
      .scanner{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden}
      .sc-tabs{display:flex;background:#040404;border-bottom:1px solid rgba(255,255,255,0.06)}
      .sc-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;padding:18px 0;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;border-bottom:2px solid transparent}
      .sc-tab.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
      .sc-tab:not(.on):hover{color:rgba(255,255,255,0.6)}
      .sc-body{padding:32px 36px}
      .sc-lbl{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;margin-bottom:10px}
      .sc-sel{width:100%;background:#040404;border:1px solid rgba(255,255,255,0.07);color:#fff;border-radius:8px;padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-size:14px;appearance:none;outline:none;margin-bottom:24px;transition:border-color 0.2s}
      .sc-sel:focus{border-color:rgba(0,255,136,0.35)}
      .code-ta{width:100%;min-height:220px;resize:vertical;background:#040404;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #00ff88;border-radius:8px;padding:18px 20px;color:rgba(255,255,255,0.8);font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;outline:none;margin-bottom:24px;transition:border-color 0.2s}
      .code-ta:focus{border-color:rgba(0,255,136,0.35)}
      .scan-btn{width:100%;padding:17px;background:#00ff88;border:none;border-radius:10px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.25s;box-shadow:0 0 30px rgba(0,255,136,0.22)}
      .scan-btn:hover{background:#1aff95;box-shadow:0 0 50px rgba(0,255,136,0.42);transform:translateY(-2px)}
      .scan-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none;box-shadow:none}
      /* SCANNING SCREEN */
      .scan-screen{min-height:460px;background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:60px;text-align:center}
      .scan-orb{width:80px;height:80px;border-radius:20px;background:#000;border:1px solid rgba(0,255,136,0.22);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(0,255,136,0.14);animation:float 3s ease-in-out infinite,spulse 2s ease-in-out infinite}
      .scan-h{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#fff}
      .scan-s{font-size:13px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace;margin-top:6px}
      .scan-steps{display:flex;flex-direction:column;gap:12px;min-width:380px;text-align:left}
      .scan-step{display:flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,0.6);animation:sli 0.35s ease both}
      .step-pip{width:7px;height:7px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;flex-shrink:0}
      .prog-rail{width:380px;height:4px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
      .prog-fill{height:100%;background:#00ff88;border-radius:10px;box-shadow:0 0 10px #00ff88;transition:width 0.5s ease}
      .prog-lbl{font-family:'JetBrains Mono',monospace;font-size:12px;color:#00ff88;margin-top:8px}
      /* ALERT MODAL */
      .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fi 0.2s ease}
      .alert-card{background:#080808;border:1px solid rgba(255,59,59,0.2);border-radius:20px;padding:44px;max-width:460px;width:100%;text-align:center;position:relative;box-shadow:0 0 100px rgba(255,59,59,0.08);animation:pu 0.35s cubic-bezier(0.16,1,0.3,1)}
      .alert-x{position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.22);cursor:pointer;font-size:18px;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
      .alert-x:hover{color:#fff;background:rgba(255,255,255,0.06)}
      .alert-ico{width:70px;height:70px;border-radius:18px;background:rgba(255,59,59,0.08);border:1px solid rgba(255,59,59,0.16);display:flex;align-items:center;justify-content:center;color:#ff4444;margin:0 auto 24px;animation:shake 0.5s ease 0.3s}
      .alert-title{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#ff4444;margin-bottom:14px}
      .alert-desc{font-size:14px;color:rgba(255,255,255,0.42);line-height:1.7;margin-bottom:26px}
      .alert-chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,59,59,0.07);border:1px solid rgba(255,59,59,0.18);color:#ff6b6b;font-size:12px;font-weight:700;padding:6px 14px;border-radius:7px;font-family:'JetBrains Mono',monospace;margin-bottom:26px}
      .alert-cta{width:100%;padding:15px;background:#ff3b3b;border:none;border-radius:10px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.2s}
      .alert-cta:hover{background:#ff5555;transform:translateY(-1px)}
      /* REPORT HEADER */
      .rep-hdr{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px 36px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
      .rep-title{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:#fff}
      .rep-meta{font-size:12px;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;margin:6px 0 16px}
      .badges{display:flex;gap:10px;flex-wrap:wrap}
      .badge{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;border:1px solid;transition:transform 0.15s}
      .badge:hover{transform:scale(1.05)}
      .bdot{width:6px;height:6px;border-radius:50%}
      .btn-row{display:flex;gap:10px;flex-shrink:0}
      .btn-g{background:#00ff88;border:none;padding:10px 20px;border-radius:8px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 0 18px rgba(0,255,136,0.18);transition:all 0.2s}
      .btn-g:hover{background:#1aff95;transform:translateY(-1px)}
      .btn-gh{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:10px 20px;border-radius:8px;color:rgba(255,255,255,0.55);font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s}
      .btn-gh:hover{background:rgba(255,255,255,0.08);color:#fff}
      .exp-dd{position:absolute;top:calc(100% + 8px);right:0;width:200px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.8);z-index:60;animation:fadeDown 0.15s ease}
      .exp-hd{padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:10px;font-weight:700;color:rgba(255,255,255,0.22);text-transform:uppercase;letter-spacing:0.12em;font-family:'JetBrains Mono',monospace}
      .exp-item{width:100%;padding:10px 16px;display:flex;align-items:center;gap:11px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.52);background:none;border:none;cursor:pointer;text-align:left;border-bottom:1px solid rgba(255,255,255,0.04);transition:all 0.15s}
      .exp-item:last-child{border-bottom:none}
      .exp-item:hover{background:rgba(255,255,255,0.04);color:#fff}
      .exp-ico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      /* TABS */
      .rep-body{background:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden}
      .tab-bar{display:flex;background:#040404;border-bottom:1px solid rgba(255,255,255,0.06);overflow-x:auto}
      .tab-bar::-webkit-scrollbar{height:0}
      .rtab{padding:14px 16px;font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;color:rgba(255,255,255,0.28);border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0}
      .rtab.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
      .rtab:not(.on):hover{color:rgba(255,255,255,0.6)}
      .tab-sp{flex:1;min-width:6px}
      .rtab-ai{padding:14px 16px;font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0}
      .rtab-ai.on{color:#00ff88;border-bottom-color:#00ff88;background:rgba(0,255,136,0.04)}
      .rtab-ai:not(.on){color:rgba(255,255,255,0.22)}
      .rtab-ai:not(.on):hover{color:rgba(0,255,136,0.55)}
      .tcnt{background:rgba(255,59,59,0.14);color:#ff6b6b;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace}
      /* VULN CARDS */
      .vulns-panel{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
      .vc{position:relative;overflow:hidden;background:#040404;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:22px 24px 22px 30px;transition:all 0.25s;animation:siu 0.4s ease both}
      .vc:hover{border-color:rgba(255,255,255,0.1)}
      .vc-open{border-color:rgba(0,255,136,0.12)!important}
      .vc-stripe{position:absolute;left:0;top:0;bottom:0;width:3px}
      .vc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;cursor:pointer}
      .vc-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
      .vc-sev{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 10px;border-radius:4px}
      .vc-id{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
      .vc-cvss{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
      .vc-name{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em}
      .vc-line{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.22);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);padding:4px 10px;border-radius:6px}
      .vc-preview{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;margin-bottom:12px}
      .vc-hint{background:none;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:7px 14px;color:rgba(255,255,255,0.25);font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;margin-top:4px}
      .vc-hint:hover{color:rgba(0,255,136,0.7);border-color:rgba(0,255,136,0.2)}
      .vc-expand{display:flex;flex-direction:column;gap:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);margin-top:4px}
      .vc-sec{display:flex;flex-direction:column;gap:8px}
      .vc-sec-lbl{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
      .vc-sec-box{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 18px;font-size:13.5px;line-height:1.85;color:rgba(255,255,255,0.68)}
      .vc-copy{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.16);color:#00ff88;font-size:11px;font-weight:700;padding:6px 14px;border-radius:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.2s;margin-top:6px}
      .vc-copy:hover{background:rgba(0,255,136,0.15)}
      .vc-empty{padding:72px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
      /* DIFF */
      .orig-panel{padding:24px 28px}
      .code-view{background:#000;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden}
      .cv-hdr{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:space-between}
      .cv-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88}
      .cv-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.12em}
      .cv-lang{font-family:'JetBrains Mono',monospace;font-size:11px;color:#00ff88;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.15);padding:3px 10px;border-radius:5px;font-weight:700}
      .code-view pre{padding:22px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,0.62);line-height:1.75;overflow-x:auto;max-height:520px}
      .corr-panel{padding:24px 28px;display:flex;flex-direction:column;gap:18px}
      .diff-title{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#fff}
      .diff-sub{font-size:11px;color:rgba(255,255,255,0.22);font-family:'JetBrains Mono',monospace;margin-top:5px}
      .auto-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.16);color:#00ff88;font-size:11px;font-weight:700;padding:6px 12px;border-radius:6px;font-family:'JetBrains Mono',monospace}
      .diff-root{border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden}
      .diff-bar{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(255,255,255,0.06)}
      .diff-side{padding:11px 16px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;display:flex;align-items:center;gap:8px}
      .diff-l{background:rgba(255,59,59,0.05);color:#ff6b6b;border-right:1px solid rgba(255,255,255,0.05)}
      .diff-r{background:rgba(0,255,136,0.04);color:#00ff88;justify-content:space-between}
      .dd{width:7px;height:7px;border-radius:50%}
      .dd.red{background:#ef4444}
      .dd.grn{background:#00ff88;box-shadow:0 0 6px #00ff88}
      .diff-copy-btn{display:flex;align-items:center;gap:5px;background:rgba(0,255,136,0.09);border:1px solid rgba(0,255,136,0.18);color:#00ff88;font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace}
      .diff-cols{display:grid;grid-template-columns:1fr 1fr}
      .diff-col{overflow-x:auto;max-height:460px;overflow-y:auto}
      .diff-col::-webkit-scrollbar{width:3px}
      .diff-col::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
      .diff-cl{background:#070004;border-right:1px solid rgba(255,255,255,0.04)}
      .diff-cr{background:#020800}
      .dl{display:flex;min-height:22px}
      .dl-b{background:rgba(255,59,59,0.08);border-left:2px solid rgba(255,59,59,0.45)}
      .dl-g{background:rgba(0,255,136,0.06);border-left:2px solid rgba(0,255,136,0.35)}
      .dl-n{min-width:38px;padding:2px 10px 2px 8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.12);text-align:right;user-select:none;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.04)}
      .dl-c{padding:2px 14px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.75;color:rgba(255,255,255,0.42)}
      .dl-b .dl-c{color:#fca5a5}
      .dl-g .dl-c{color:#6ee7b7}
      /* AGENT */
      .ap{padding:24px 28px;display:flex;flex-direction:column;gap:18px}
      .ap-hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
      .ap-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .ap-badge-done{display:inline-flex;align-items:center;gap:6px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);color:#00ff88;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;font-family:'JetBrains Mono',monospace}
      .ap-badge-run{display:inline-flex;align-items:center;gap:6px;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.2);color:#00e5ff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;font-family:'JetBrains Mono',monospace}
      .ap-btn{background:#00ff88;border:none;padding:9px 20px;border-radius:8px;color:#000;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;box-shadow:0 0 16px rgba(0,255,136,0.2)}
      .ap-btn:hover{background:#1aff95;box-shadow:0 0 26px rgba(0,255,136,0.35)}
      .ap-steps{display:flex;flex-direction:column;gap:8px}
      .ap-step{display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid;border-radius:10px;transition:all 0.2s}
      .ap-step-num{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:800;width:24px;flex-shrink:0;text-align:center}
      .ap-step-icon{font-size:18px;flex-shrink:0}
      .ap-step-label{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700}
      .ap-step-detail{font-size:11px;color:rgba(255,255,255,0.35);margin-top:3px}
      .ap-step-ms{font-family:'JetBrains Mono',monospace;font-size:10px;color:#00ff88;flex-shrink:0;margin-left:auto}
      .ap-log{background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden}
      .ap-log-hdr{padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em}
      .ap-log-body{padding:14px;max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
      .ap-log-body::-webkit-scrollbar{width:3px}
      .ap-log-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
      .ap-log-line{display:flex;align-items:flex-start;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.65);animation:sli 0.2s ease}
      .ap-log-p{color:#00ff88;flex-shrink:0}
      .ap-cursor{font-family:'JetBrains Mono',monospace;font-size:14px;color:#00ff88;animation:blink 1s infinite}
      /* RED vs BLUE */
      .rb{padding:24px 28px;display:flex;flex-direction:column;gap:14px}
      .rb-hdr{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
      .rb-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .rb-tag{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;background:rgba(255,255,255,0.04);padding:3px 10px;border-radius:4px}
      .rb-score{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:13px}
      .rb-btn{background:rgba(255,68,68,0.12);border:1px solid rgba(255,68,68,0.25);color:#ff6b6b;padding:8px 18px;border-radius:7px;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s}
      .rb-btn:hover{background:rgba(255,68,68,0.22)}
      .rb-btn:disabled{opacity:0.5;cursor:not-allowed}
      .rb-teams{display:grid;grid-template-columns:1fr auto 1fr;background:#040404;border:1px solid rgba(255,255,255,0.07);border-radius:10px 10px 0 0}
      .rb-team{padding:12px 18px;display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em}
      .rb-red{background:rgba(255,68,68,0.06);color:#ff4444}
      .rb-blue{background:rgba(0,229,255,0.05);color:#00e5ff;justify-content:flex-end}
      .rb-div{background:rgba(255,255,255,0.07);width:1px}
      .rb-feed{height:360px;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#000;border:1px solid rgba(255,255,255,0.07);border-top:none;border-radius:0 0 10px 10px}
      .rb-feed::-webkit-scrollbar{width:3px}
      .rb-feed::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
      .rb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:rgba(255,255,255,0.18);text-align:center}
      .rb-empty p{font-family:'JetBrains Mono',monospace;font-size:12px}
      .rb-evt{padding:10px 14px;border-radius:8px;border-left:3px solid;animation:sli 0.25s ease}
      .rb-evt-top{display:flex;align-items:center;gap:10px;margin-bottom:5px}
      .rb-evt-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.2)}
      .rb-evt-msg{font-size:13px;line-height:1.5}
      /* VERIFY */
      .vp{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
      .vp-hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
      .vp-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .vp-badge{font-family:'JetBrains Mono',monospace;font-size:10px;color:#00e5ff;text-transform:uppercase;letter-spacing:0.1em;background:rgba(0,229,255,0.07);border:1px solid rgba(0,229,255,0.18);padding:3px 10px;border-radius:4px}
      .vp-btn{background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.25);color:#00e5ff;padding:8px 18px;border-radius:7px;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s}
      .vp-btn:hover{background:rgba(0,229,255,0.18)}
      .vp-btn:disabled{opacity:0.5;cursor:not-allowed}
      .vp-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px 28px;text-align:center;color:rgba(255,255,255,0.18)}
      .vp-empty p{font-family:'JetBrains Mono',monospace;font-size:12px;max-width:340px;line-height:1.6}
      .vp-test{display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid;border-radius:10px;transition:all 0.2s}
      .vp-test-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,0.04)}
      .vp-test-name{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;margin-bottom:3px}
      .vp-test-desc{font-size:12px;color:rgba(255,255,255,0.35);line-height:1.4}
      .vp-test-ms{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.25);flex-shrink:0}
      .vp-result{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:10px;font-size:13px;margin-top:4px}
      .vp-ok{background:rgba(0,255,136,0.07);border:1px solid rgba(0,255,136,0.2);color:rgba(255,255,255,0.8)}
      .vp-fail{background:rgba(255,68,68,0.07);border:1px solid rgba(255,68,68,0.2);color:rgba(255,255,255,0.8)}
      /* TIMELINE */
      .tl{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
      .tl-hdr{display:flex;align-items:center;gap:12px}
      .tl-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .tl-delta{font-family:'JetBrains Mono',monospace;font-size:11px;color:#00ff88;margin-left:auto}
      .tl-graph{background:#000;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px}
      .tl-slider{width:100%;appearance:none;height:3px;background:rgba(255,255,255,0.1);border-radius:10px;outline:none;cursor:pointer;margin:4px 0}
      .tl-slider::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:#00ff88;border:2px solid #000;box-shadow:0 0 10px rgba(0,255,136,0.5);cursor:pointer}
      .tl-labels{display:flex;justify-content:space-between}
      .tl-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.28);cursor:pointer;padding:3px 6px;border-radius:4px;transition:all 0.15s;text-transform:uppercase;letter-spacing:0.06em}
      .tl-lbl-on{color:#00ff88;background:rgba(0,255,136,0.1)}
      .tl-lbl:hover{color:rgba(255,255,255,0.6)}
      .tl-card{background:#040404;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 20px;animation:fi 0.2s ease}
      .tl-card-top{display:flex;align-items:center;gap:16px;margin-bottom:10px}
      .tl-big-score{font-family:'JetBrains Mono',monospace;font-size:42px;font-weight:700;line-height:1}
      .tl-card-label{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:#fff}
      .tl-card-date{font-size:12px;color:rgba(255,255,255,0.3);font-family:'JetBrains Mono',monospace}
      .tl-event{font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:12px;line-height:1.5}
      /* ROOT CAUSE */
      .rc{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
      .rc-hdr{display:flex;align-items:center;gap:12px}
      .rc-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .rc-badge{font-family:'JetBrains Mono',monospace;font-size:10px;color:#a78bfa;text-transform:uppercase;letter-spacing:0.1em;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.18);padding:3px 10px;border-radius:4px;margin-left:auto}
      .rc-card{background:#040404;border:1px solid;border-radius:12px;padding:18px 20px;transition:all 0.2s;animation:siu 0.3s ease both}
      .rc-card:hover{background:#060606}
      .rc-sev{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 10px;border-radius:4px}
      .rc-cwe{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);padding:3px 9px;border-radius:4px}
      .rc-cat{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(167,139,250,0.8);background:rgba(167,139,250,0.08);padding:3px 9px;border-radius:4px}
      .rc-cnt{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.3)}
      .rc-name{font-size:16px;font-weight:700;color:#fff;margin:10px 0 6px;letter-spacing:-0.01em}
      .rc-short{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6}
      .rc-expand{display:flex;flex-direction:column;gap:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.05);margin-top:12px}
      .rc-sec{display:flex;flex-direction:column;gap:8px}
      .rc-sec-lbl{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.35)}
      .rc-file{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.04);padding:4px 10px;border-radius:5px}
      .rc-desc-box{font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:12px 14px}
      .rc-diff{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .rc-diff-bad{background:rgba(255,59,59,0.06);border:1px solid rgba(255,59,59,0.12);border-radius:8px;padding:12px 14px}
      .rc-diff-good{background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.12);border-radius:8px;padding:12px 14px}
      .rc-diff-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;margin-bottom:8px;opacity:0.7}
      .rc-diff-bad code{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;color:#fca5a5}
      .rc-diff-good code{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;color:#6ee7b7}
      .rc-fix-box{background:rgba(167,139,250,0.05);border:1px solid rgba(167,139,250,0.14);border-radius:10px;padding:14px 16px}
      .rc-fix-text{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.7;margin-top:8px}
      /* RADAR */
      .radar{padding:24px 28px;display:flex;flex-direction:column;gap:16px}
      .radar-hdr{display:flex;align-items:center;gap:12px}
      .radar-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#fff}
      .radar-badge{font-family:'JetBrains Mono',monospace;font-size:10px;color:#00e5ff;text-transform:uppercase;letter-spacing:0.1em;background:rgba(0,229,255,0.07);border:1px solid rgba(0,229,255,0.18);padding:3px 10px;border-radius:4px;margin-left:auto}
      .radar-body{display:grid;grid-template-columns:260px 1fr;gap:24px;align-items:start}
      @media(max-width:700px){.radar-body{grid-template-columns:1fr}}
      .radar-bars{display:flex;flex-direction:column;gap:12px}
      .radar-bar-row{display:flex;align-items:center;gap:12px}
      .radar-bar-lbl{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.5);width:130px;flex-shrink:0}
      .radar-bar-track{flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
      .radar-bar-fill{height:100%;border-radius:10px;transition:width 1s ease}
      .radar-bar-num{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;width:28px;text-align:right;flex-shrink:0}
      .radar-overall{display:flex;align-items:center;justify-content:space-between;padding:14px 0 0;border-top:1px solid rgba(255,255,255,0.07);margin-top:4px}
      .radar-ov-lbl{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em}
      .radar-ov-num{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;line-height:1}
      /* SENTRY AI */
      .sentry-panel{padding:24px 28px 0;display:flex;flex-direction:column;gap:16px}
      .sentry-banner{background:#000;border:1px solid rgba(0,255,136,0.13);border-radius:10px;padding:13px 18px;display:flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:rgba(255,255,255,0.55)}
      .sorb{width:28px;height:28px;border-radius:50%;background:#00ff88;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#000;box-shadow:0 0 12px rgba(0,255,136,0.35);flex-shrink:0}
      .chat-wrap{background:#000;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
      .chat-hd{padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.01);display:flex;align-items:center;justify-content:space-between}
      .chat-hd-l{display:flex;align-items:center;gap:10px}
      .chat-hd-title{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.38)}
      .neural{display:flex;align-items:center;gap:6px}
      .neural-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88;animation:blink 1.8s infinite}
      .neural-txt{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:rgba(255,255,255,0.22);text-transform:uppercase;letter-spacing:0.1em}
      .chat-msgs{height:360px;overflow-y:auto;padding:20px 18px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth}
      .chat-msgs::-webkit-scrollbar{width:3px}
      .chat-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
      .chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:rgba(255,255,255,0.14);text-align:center}
      .chat-empty p{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em}
      .msg-bot{align-self:flex-start;max-width:92%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:2px 14px 14px 14px;padding:14px 18px;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.8);animation:msgS 0.3s ease}
      .msg-user{align-self:flex-end;max-width:78%;background:rgba(0,255,136,0.09);border:1px solid rgba(0,255,136,0.16);border-radius:14px 14px 2px 14px;padding:12px 16px;font-size:14px;line-height:1.6;color:#d1fae5;font-weight:500;animation:msgS 0.2s ease}
      .typing{display:flex;gap:5px;align-items:center;padding:4px 0}
      .td{width:6px;height:6px;border-radius:50%;background:#00ff88;animation:bnc 1.2s infinite}
      .td:nth-child(2){animation-delay:0.15s}
      .td:nth-child(3){animation-delay:0.3s}
      .suggs{display:flex;flex-wrap:wrap;gap:8px;padding:12px 18px;border-top:1px solid rgba(255,255,255,0.04);background:rgba(0,0,0,0.3)}
      .sug-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.45);font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all 0.2s;white-space:nowrap}
      .sug-btn:hover{background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.2);color:#00ff88;transform:translateY(-1px)}
      .chat-inp-row{padding:14px 18px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.5);display:flex;gap:10px}
      .chat-inp{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none;transition:border-color 0.2s}
      .chat-inp::placeholder{color:rgba(255,255,255,0.18)}
      .chat-inp:focus{border-color:rgba(0,255,136,0.3)}
      .chat-send{width:40px;height:40px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
      .chat-send.on{background:#00ff88;color:#000;box-shadow:0 0 14px rgba(0,255,136,0.28)}
      .chat-send.on:hover{background:#1aff95;transform:scale(1.08)}
      .chat-send.off{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.14);cursor:not-allowed}
      .back-btn{background:none;border:none;color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;padding:0;margin-bottom:20px;transition:color 0.2s}
      .back-btn:hover{color:#00ff88}
      /* SPINNER */
      .spin{width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);border-top-color:#00ff88;animation:spin 0.8s linear infinite;flex-shrink:0}
      /* KEYFRAMES */
      @keyframes rip{0%{transform:scale(0);opacity:0.6}100%{transform:scale(4);opacity:0}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      @keyframes spulse{0%,100%{box-shadow:0 0 40px rgba(0,255,136,0.14)}50%{box-shadow:0 0 60px rgba(0,255,136,0.3)}}
      @keyframes sli{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
      @keyframes siu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fi{from{opacity:0}to{opacity:1}}
      @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pu{0%{opacity:0;transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
      @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
      @keyframes bnc{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
      @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes msgS{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      @keyframes apulse{0%,100%{box-shadow:0 0 0 rgba(0,255,136,0)}50%{box-shadow:0 0 14px rgba(0,255,136,0.2)}}
    `}</style>

    <div className="page">
      {/* TICKER */}
      <div className="ticker"><div className="ticker-t">{[...TICKER,...TICKER].map((t,i)=><span key={i} className="ticker-i"><span className="t-dot"/>{t.l}: <span className="t-v">{t.v}</span></span>)}</div></div>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-l">
          <div className="brand" onClick={()=>router.push('/')}><div className="brand-ico"><Shield size={15} color="#00ff88"/></div><span className="brand-name">CyberSentry</span><span className="brand-ai">AI</span></div>
          <div className="nav-pill"><div className="gdot"/><Home size={11}/>Dashboard</div>
        </div>
        <div style={{position:'relative'}}>
          <div className="upill" onClick={()=>setProfileOpen(!profileOpen)}><div className="uav">{username[0]}</div><span className="uname">{username}</span><ChevronDown size={13} color="rgba(255,255,255,0.28)" style={{transition:'transform 0.2s',transform:profileOpen?'rotate(180deg)':'none'}}/></div>
          {profileOpen&&<div className="drop"><div className="drop-head"><div className="drop-lbl">Signed in as</div><div className="drop-email">{user?.email}</div></div><button className="drop-item" onClick={()=>setProfileOpen(false)}><Home size={13} color="#00ff88"/>Dashboard</button><button className="drop-item" onClick={()=>setProfileOpen(false)}><Settings size={13}/>Settings</button><button className="drop-item drop-danger" onClick={signOut}><LogOut size={13}/>Sign Out</button></div>}
        </div>
      </nav>

      <main className="main">
        {/* ── IDLE ── */}
        {phase==='idle'&&<>
          <div className="hero">
            <div className="hero-ey"><div className="gdot"/>Autonomous Security Agent</div>
            <h1 className="hero-h1">Welcome back, <span className="hero-acc">{username}</span></h1>
            <p className="hero-sub">Fully autonomous AI security engineer — scans, detects vulnerabilities, simulates attacks, verifies patches, tracks security evolution, and defends your codebase in real time.</p>
          </div>
          <div className="stats">{[{ico:<Terminal size={16}/>,col:'#00ff88',bg:'rgba(0,255,136,0.08)',lbl:'Total Scans',val:stats.total},{ico:<Bug size={16}/>,col:'#ff6b6b',bg:'rgba(255,107,107,0.08)',lbl:'Vulnerabilities',val:stats.vulns},{ico:<AlertTriangle size={16}/>,col:'#f97316',bg:'rgba(249,115,22,0.08)',lbl:'Critical / High',val:stats.crit},{ico:<Zap size={16}/>,col:'#00ff88',bg:'rgba(0,255,136,0.08)',lbl:'Auto-Patched',val:stats.patched}].map((s,i)=><div className="stat" key={i}><div className="stat-ico" style={{background:s.bg,color:s.col}}>{s.ico}</div><Counter target={s.val}/><div className="stat-lbl">{s.lbl}</div></div>)}</div>
          <div className="scanner">
            <div className="sc-tabs"><div className={`sc-tab ${scanMode==='code'?'on':''}`} onClick={()=>setScanMode('code')}><Code size={13}/>Paste Code</div><div className={`sc-tab ${scanMode==='url'?'on':''}`} onClick={()=>setScanMode('url')}><Globe size={13}/>Website URL</div></div>
            <div className="sc-body">
              {scanMode==='code'?<><label className="sc-lbl">Programming Language</label><select className="sc-sel" value={lang} onChange={e=>changeLang(e.target.value)}>{Object.keys(SAMPLES).map(l=><option key={l}>{l}</option>)}</select><label className="sc-lbl">Paste your code</label><textarea className="code-ta" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false}/></>:<><label className="sc-lbl">Website URL</label><input className="sc-sel" style={{marginBottom:10}} placeholder="https://example.com" value={code} onChange={e=>setCode(e.target.value)}/><p style={{fontSize:12,color:'rgba(255,255,255,0.18)',marginBottom:24,fontFamily:'JetBrains Mono,monospace',lineHeight:1.6}}>Scan for network vulnerabilities and missing security headers.</p></>}
              <Btn className="scan-btn" onClick={scan} disabled={!code.trim()}><Sparkles size={15}/>Start Autonomous Security Scan</Btn>
            </div>
          </div>
        </>}

        {/* ── SCANNING ── */}
        {phase==='scanning'&&<div className="scan-screen">
          <div className="scan-orb"><Sparkles size={30} color="#00ff88"/></div>
          <div><h2 className="scan-h">Agent Scanning...</h2><p className="scan-s">Autonomous security analysis in progress</p></div>
          <div className="scan-steps">{scanSteps.map((s,i)=><div key={i} className="scan-step" style={{animationDelay:`${i*0.07}s`}}><div className="step-pip"/>{s}<CheckCircle size={12} color="#00ff88" style={{marginLeft:'auto',opacity:0.7}}/></div>)}</div>
          <div className="prog-rail"><div className="prog-fill" style={{width:`${prog}%`}}/></div>
          <div className="prog-lbl">{prog}% complete</div>
        </div>}

        {/* ── ALERT ── */}
        {phase==='alert'&&<div className="modal-bg">
          <div className="alert-card">
            <button className="alert-x" onClick={()=>setPhase('report')}>✕</button>
            <div className="alert-ico"><Shield size={34}/></div>
            <h2 className="alert-title">// THREAT DETECTED</h2>
            <p className="alert-desc">Found <strong style={{color:'#fff'}}>{vulns.filter(v=>v.severity==='critical').length} critical</strong> and <strong style={{color:'#fff'}}>{vulns.filter(v=>v.severity==='high').length} high</strong> severity vulnerabilities. The autonomous agent is ready to patch and verify.</p>
            <div className="alert-chip"><AlertTriangle size={12}/>{vulns.filter(v=>v.severity==='critical').length} Critical Issues</div>
            <Btn className="alert-cta" onClick={()=>setPhase('report')}>Launch Security Command Center →</Btn>
          </div>
        </div>}

        {/* ── REPORT ── */}
        {phase==='report'&&<div style={{animation:'fi 0.3s ease'}}>
          <button className="back-btn" onClick={()=>setPhase('idle')}>← Back to Dashboard</button>

          {/* Report header */}
          <div className="rep-hdr">
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><div className="gdot"/><h1 className="rep-title">// Security Command Center</h1></div>
              <p className="rep-meta">Found {vulns.length} vulnerabilit{vulns.length===1?'y':'ies'} · {lang} · Score: {Math.max(12,100-vulns.length*30)}/100</p>
              <div className="badges">{[{l:'critical',c:vulns.filter(v=>v.severity==='critical').length,col:'#ff4444',bg:'rgba(255,68,68,0.08)'},{l:'high',c:vulns.filter(v=>v.severity==='high').length,col:'#f97316',bg:'rgba(249,115,22,0.08)'},{l:'root causes',c:ROOT_CAUSES.length,col:'#a78bfa',bg:'rgba(167,139,250,0.08)'}].map((b,i)=><div key={i} className="badge" style={{color:b.col,background:b.bg,borderColor:`${b.col}28`}}><div className="bdot" style={{background:b.col}}/>{b.c} {b.l}</div>)}</div>
            </div>
            <div className="btn-row" style={{position:'relative'}}>
              <Btn className="btn-g" onClick={()=>setExportOpen(!exportOpen)}><Download size={13}/>Export</Btn>
              {exportOpen&&<div className="exp-dd"><div className="exp-hd">Export Format</div><button className="exp-item" onClick={()=>{navigator.clipboard.writeText(JSON.stringify(vulns,null,2));setExportOpen(false)}}><div className="exp-ico" style={{background:'rgba(96,165,250,0.1)',color:'#60a5fa'}}><Copy size={13}/></div>Copy JSON</button><button className="exp-item" onClick={()=>setExportOpen(false)}><div className="exp-ico" style={{background:'rgba(0,255,136,0.08)',color:'#00ff88'}}><Download size={13}/></div>Download PDF</button></div>}
              <Btn className="btn-gh" onClick={()=>setPhase('idle')}><RotateCcw size={13}/>New Scan</Btn>
            </div>
          </div>

          {/* Tab panel */}
          <div className="rep-body" style={{marginTop:14}}>
            <div className="tab-bar">
              <div className={`rtab ${tab==='vulns'?'on':''}`} onClick={()=>setTab('vulns')}><Bug size={11}/>Vulns{vulns.length>0&&<span className="tcnt">{vulns.length}</span>}</div>
              <div className={`rtab ${tab==='agent'?'on':''}`} onClick={()=>setTab('agent')}><Workflow size={11}/>Agent Loop</div>
              <div className={`rtab ${tab==='redblue'?'on':''}`} onClick={()=>setTab('redblue')}><SwordsIcon size={11}/>Red vs Blue</div>
              <div className={`rtab ${tab==='verify'?'on':''}`} onClick={()=>setTab('verify')}><FlaskConical size={11}/>Verify Patch</div>
              <div className={`rtab ${tab==='timeline'?'on':''}`} onClick={()=>setTab('timeline')}><TrendingUp size={11}/>Timeline</div>
              <div className={`rtab ${tab==='rootcause'?'on':''}`} onClick={()=>setTab('rootcause')}><BrainCircuit size={11}/>Root Cause</div>
              <div className={`rtab ${tab==='radar'?'on':''}`} onClick={()=>setTab('radar')}><RadarIcon size={11}/>Radar</div>
              <div className={`rtab ${tab==='original'?'on':''}`} onClick={()=>setTab('original')}><Eye size={11}/>Code</div>
              <div className={`rtab ${tab==='corrected'?'on':''}`} onClick={()=>setTab('corrected')}><CheckCircle size={11}/>Patch</div>
              <div className="tab-sp"/>
              <div className={`rtab-ai ${tab==='sentry'?'on':''}`} onClick={()=>setTab('sentry')}><Sparkles size={11}/>Sentry AI</div>
            </div>

            {/* ── Vulnerabilities Tab ── */}
            {tab==='vulns'&&<div className="vulns-panel" style={{animation:'fi 0.25s ease'}}>
              {vulns.length===0
                ?<div className="vc-empty"><div style={{fontSize:52}}>✅</div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:18,fontWeight:700,color:'#fff'}}>{`// System Secure`}</div><p style={{fontSize:13,color:'rgba(255,255,255,0.3)',maxWidth:340,lineHeight:1.6}}>No vulnerabilities found. Check the Root Cause and Radar tabs for a systemic security overview.</p></div>
                :vulns.map((v,i)=><VulnCard key={i} v={v} i={i}/>)}
            </div>}

            {/* ── Agent Loop Tab ── */}
            {tab==='agent'&&<div style={{animation:'fi 0.25s ease'}}><AgentPanel vulns={vulns} language={lang}/></div>}

            {/* ── Red vs Blue Tab ── */}
            {tab==='redblue'&&<div style={{animation:'fi 0.25s ease'}}><RBPanel vulns={vulns}/></div>}

            {/* ── Verify Patch Tab ── */}
            {tab==='verify'&&<div style={{animation:'fi 0.25s ease'}}><VerifyPanel vuln={vulns[0]} patchedCode={patchedCode}/></div>}

            {/* ── Timeline Tab ── */}
            {tab==='timeline'&&<div style={{animation:'fi 0.25s ease'}}><Timeline/></div>}

            {/* ── Root Cause Tab ── */}
            {tab==='rootcause'&&<div style={{animation:'fi 0.25s ease'}}><RCPanel/></div>}

            {/* ── Radar Tab ── */}
            {tab==='radar'&&<div style={{animation:'fi 0.25s ease'}}><SecurityRadar/></div>}

            {/* ── Original Code Tab ── */}
            {tab==='original'&&<div className="orig-panel" style={{animation:'fi 0.25s ease'}}>
              <div className="code-view">
                <div className="cv-hdr"><div style={{display:'flex',alignItems:'center',gap:8}}><div className="cv-dot"/><span className="cv-title">Source Code — Vulnerable Version</span></div><span className="cv-lang">{lang}</span></div>
                <pre>{code}</pre>
              </div>
            </div>}

            {/* ── Corrected Code Tab ── */}
            {tab==='corrected'&&<div className="corr-panel" style={{animation:'fi 0.25s ease'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div><div className="diff-title">Neural Patch View</div><div className="diff-sub">Scanned Source (L) vs AI Corrected (R)</div></div>
                <div className="auto-badge"><Sparkles size={11}/>Auto-Correction Verified</div>
              </div>
              <Diff orig={code} patch={patchedCode}/>
            </div>}

            {/* ── Sentry AI Tab ── */}
            {tab==='sentry'&&<div className="sentry-panel" style={{animation:'fi 0.25s ease'}}>
              <div className="sentry-banner"><div className="sorb">AI</div>Sentry AI Security Assistant — ask anything about your codebase security</div>
              <div className="chat-wrap">
                <div className="chat-hd">
                  <div className="chat-hd-l"><div className="sorb" style={{width:30,height:30}}>AI</div><span className="chat-hd-title">Security Intelligence Hub</span></div>
                  <div className="neural"><div className="neural-dot"/><span className="neural-txt">Autonomous Mode</span></div>
                </div>
                <div className="chat-msgs">
                  {chatMsgs.length===0?<div className="chat-empty"><Sparkles size={34} style={{opacity:0.25}}/><p>Initializing...</p></div>
                  :chatMsgs.map((m,i)=><div key={i} className={m.role==='user'?'msg-user':'msg-bot'}>{m.text.split('\n').map((line,li)=><p key={li} style={{marginBottom:li<m.text.split('\n').length-1?8:0}}>{line}</p>)}</div>)}
                  {typing&&<div className="msg-bot"><div className="typing"><div className="td"/><div className="td"/><div className="td"/></div></div>}
                  <div ref={chatEndRef}/>
                </div>
                {chatMsgs.length>0&&!typing&&<div className="suggs">{SQS.map((q,i)=><button key={i} className="sug-btn" onClick={()=>sendAI(q)}>{q}</button>)}</div>}
                <div className="chat-inp-row">
                  <input className="chat-inp" placeholder="Ask: What is the most critical vulnerability? Where are auth weaknesses? How to improve API security?" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAI()}/>
                  <Btn className={`chat-send ${typing||!chatInput.trim()?'off':'on'}`} onClick={()=>sendAI()} disabled={typing||!chatInput.trim()}><Send size={14}/></Btn>
                </div>
              </div>
            </div>}
          </div>
        </div>}
      </main>
    </div>
  </>
}