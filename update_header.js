const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'LNGPortalApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Breadcrumb fixes
content = content.replace(
  '<span className="text-white font-bold hidden sm:inline">{currentNav.location}</span>',
  '<span className="text-slate-800 font-semibold hidden sm:inline">{currentNav.location}</span>'
);
content = content.replace(
  '<span className="text-white font-bold hidden sm:inline">/</span>',
  '<span className="text-slate-400 hidden sm:inline">/</span>'
);
content = content.replace(
  '<div className="flex items-center gap-1.5 font-bold text-white font-bold">',
  '<div className="flex items-center gap-1.5 text-slate-800 font-semibold">'
);

// 2. Fix the SUBPROCESS_TITLES text-white
// The SUBPROCESS_TITLES uses text-white, let\'s change it to text-slate-800
const subProcessBlockEnd = content.indexOf('};', content.indexOf('const SUBPROCESS_TITLES'));
if (subProcessBlockEnd !== -1) {
    let subProcessBlock = content.substring(0, subProcessBlockEnd);
    subProcessBlock = subProcessBlock.replace(/text-white/g, 'text-slate-800');
    content = subProcessBlock + content.substring(subProcessBlockEnd);
}

// 3. Theme Switcher fixes
// 3-Way Theme Switcher Container
content = content.replace(
  'const { theme, setTheme } = useTheme();',
  'const { theme, setTheme } = useTheme();' // keep as is
);

// Theme toggle buttons - the user wants active to be bg-white text-blue-700 border border-slate-300 font-bold shadow-xs
// Inactive: text-slate-600 hover:text-slate-900
const themeSwitcherRegexPURE = /theme === \'PURE_WHITE\'\s*\?\s*\'bg-white text-white font-bold font-bold shadow-sm ring-1 ring-slate-300\'\s*:\s*\'text-white font-bold hover:text-white font-bold\'/g;
content = content.replace(themeSwitcherRegexPURE, 
    "theme === 'PURE_WHITE' ? 'bg-white text-blue-700 border border-slate-300 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'");

const themeSwitcherRegexIND = /theme === \'INDUSTRIAL_LIGHT\'\s*\?\s*\'bg-white text-white font-bold font-bold shadow-sm ring-1 ring-slate-300\'\s*:\s*\'text-white font-bold hover:text-white font-bold\'/g;
content = content.replace(themeSwitcherRegexIND, 
    "theme === 'INDUSTRIAL_LIGHT' ? 'bg-white text-blue-700 border border-slate-300 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'");

const themeSwitcherRegexCYB = /theme === \'CYBER_DARK\'\s*\?\s*\'bg-slate-800 text-white font-bold font-bold shadow-sm ring-1 ring-slate-700\'\s*:\s*\'text-white font-bold hover:text-white font-bold\'/g;
content = content.replace(themeSwitcherRegexCYB, 
    "theme === 'CYBER_DARK' ? 'bg-white text-blue-700 border border-slate-300 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'");

// Fix the icons inside the theme switcher
content = content.replace(/<Sun className="w-3.5 h-3.5 text-white font-bold" \/>/g, '<Sun className="w-3.5 h-3.5" />');
content = content.replace(/<CloudSun className="w-3.5 h-3.5 text-white font-bold" \/>/g, '<CloudSun className="w-3.5 h-3.5" />');
content = content.replace(/<Moon className="w-3.5 h-3.5 text-white font-bold" \/>/g, '<Moon className="w-3.5 h-3.5" />');

// 4. Total Fleet styling
content = content.replace(
  '<Radio className="w-3.5 h-3.5 text-white font-bold animate-pulse" />',
  '<Radio className="w-3.5 h-3.5 text-slate-800 animate-pulse" />'
);
content = content.replace(
  '<span className={theme === \'CYBER_DARK\' ? \'text-white font-bold\' : \'text-white font-bold\'}>Total Fleet:</span>',
  '<span className="text-slate-800 font-semibold">Total Fleet:</span>'
);
content = content.replace(
  '<span className={`font-mono font-bold ${theme === \'CYBER_DARK\' ? \'text-white font-bold\' : \'text-white font-bold\'}`}>',
  '<span className="font-mono font-bold text-slate-900">'
);


// 5. Status Badges
// MRO
content = content.replace(
  'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-white font-bold text-xs font-bold hover:bg-amber-500/25 transition-colors"',
  'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 transition-colors"'
);

// Regas Active
content = content.replace(
  'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-white font-bold font-bold text-xs"',
  'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs"'
);

// Disputes
content = content.replace(
  'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-white font-bold text-xs font-bold"',
  'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs"'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete.');
