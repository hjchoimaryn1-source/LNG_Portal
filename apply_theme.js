const fs = require('fs');
const files = [
  'src/components/locations/NiasTerminalView.tsx',
  'src/components/locations/nias/NiasOperationalOverviewTab.tsx',
  'src/components/locations/ArunTerminalView.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('File not found: ' + file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Backgrounds
  content = content.replace(/bg-slate-900\/90/g, 'bg-white');
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-950/g, 'bg-white');
  content = content.replace(/bg-slate-800\/90/g, 'bg-slate-50');
  content = content.replace(/bg-slate-800\/80/g, 'bg-slate-50');
  content = content.replace(/bg-slate-800/g, 'bg-slate-100');
  content = content.replace(/bg-slate-700/g, 'bg-slate-100');

  // Borders
  content = content.replace(/border-slate-600/g, 'border-slate-200');
  content = content.replace(/border-slate-700/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-slate-500/g, 'border-slate-300');
  
  // Specific fix for hover borders
  content = content.replace(/hover:border-amber-400/g, 'hover:border-blue-400');
  content = content.replace(/hover:border-cyan-400/g, 'hover:border-blue-400');
  content = content.replace(/hover:border-emerald-400/g, 'hover:border-blue-400');

  // Text colors
  content = content.replace(/text-white font-bold/g, 'text-slate-900 font-bold');
  content = content.replace(/text-white/g, 'text-slate-700');
  content = content.replace(/text-slate-400/g, 'text-slate-500');

  // Tags/Badges
  content = content.replace(/bg-emerald-950\/[0-9]+/g, 'bg-emerald-50 text-emerald-700');
  content = content.replace(/border-emerald-500\/[0-9]+/g, 'border-emerald-200');
  content = content.replace(/bg-amber-950\/[0-9]+/g, 'bg-amber-50 text-amber-700');
  content = content.replace(/border-amber-500\/[0-9]+/g, 'border-amber-200');
  content = content.replace(/bg-indigo-950\/[0-9]+/g, 'bg-indigo-50 text-indigo-700');
  content = content.replace(/border-indigo-500\/[0-9]+/g, 'border-indigo-200');
  content = content.replace(/bg-blue-500\/10/g, 'bg-blue-50');
  content = content.replace(/border-blue-500\/30/g, 'border-blue-200');

  // Fix button text that got overwritten (we want primary buttons to keep white text)
  content = content.replace(/(bg-blue-600[^"']*?)text-slate-[0-9]+/g, '$1text-white');
  content = content.replace(/(bg-emerald-600[^"']*?)text-slate-[0-9]+/g, '$1text-white');
  content = content.replace(/(bg-amber-600[^"']*?)text-slate-[0-9]+/g, '$1text-white');
  content = content.replace(/(bg-blue-500[^"']*?)text-slate-[0-9]+/g, '$1text-white');
  
  // Also fix text-slate-700 font-bold inside specific badges if needed
  content = content.replace(/(bg-emerald-600[^"']*?)text-slate-900 font-bold/g, '$1text-white font-bold');
  content = content.replace(/(bg-amber-600[^"']*?)text-slate-900 font-bold/g, '$1text-white font-bold');
  content = content.replace(/(bg-blue-600[^"']*?)text-slate-900 font-bold/g, '$1text-white font-bold');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Processed: ' + file);
});
console.log('Done.');
