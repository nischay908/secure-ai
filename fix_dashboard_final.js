const fs = require('fs');
const path = 'c:/Users/lenovo/secure-ai/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// 1. Fix line 376 (username ReferenceError)
// Find the exact line
const line376Index = lines.findIndex(l => l.includes("Hello ${username}"));
if (line376Index !== -1) {
    lines[line376Index] = lines[line376Index].replace("${username}", "${user?.email?.split('@')[0] || 'User'}");
    console.log('Fixed line 376');
}

// 2. Fix the broken end of the file starting from line 999
// We want to keep everything up to line 998 (index 997)
const lastGoodLineIndex = 997; // Line 998 is the last good one: "                      </div>"
const restoredLines = lines.slice(0, lastGoodLineIndex + 1);

restoredLines.push(
    '                    ))}',
    '                    {vulns.length === 0 && (',
    '                      <div className="flex flex-col items-center justify-center py-32 text-center">',
    '                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-bounce">',
    '                          <CheckCircle className="w-10 h-10" />',
    '                        </div>',
    '                        <h3 className="text-3xl font-black mb-3">System Secure</h3>',
    '                        <p className="text-white/40 max-w-sm font-medium">Cyber Sentry AI deep scan returned zero critical findings. Baseline security integrity is optimal.</p>',
    '                      </div>',
    '                    )}',
    '                  </div>',
    '                )}',
    '',
    '              </div>',
    '            </div>',
    '          )}',
    '        </main>',
    '      </div>',
    '    </>',
    '  )',
    '}'
);

fs.writeFileSync(path, restoredLines.join('\n'));
console.log('Successfully restored file integrity');
