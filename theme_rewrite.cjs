const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Text Colors
  content = content.replace(/text-slate-100/g, 'text-gray-900');
  content = content.replace(/text-slate-200/g, 'text-gray-800');
  content = content.replace(/text-slate-300/g, 'text-gray-700');
  content = content.replace(/text-slate-400/g, 'text-gray-500');
  content = content.replace(/text-slate-500/g, 'text-gray-400');
  content = content.replace(/text-slate-600/g, 'text-gray-400');
  // Be careful with text-white, mostly replace it in buttons/cards, but maybe safe to globally replace in this context
  content = content.replace(/text-white/g, 'text-gray-900');
  
  content = content.replace(/text-cyan-400/g, 'text-blue-600');
  content = content.replace(/text-cyan-300/g, 'text-blue-600');
  content = content.replace(/text-cyan-500/g, 'text-blue-600');
  content = content.replace(/text-cyan-200/g, 'text-blue-700');
  
  content = content.replace(/text-emerald-400/g, 'text-green-600');
  content = content.replace(/text-emerald-300/g, 'text-green-600');
  content = content.replace(/text-emerald-200/g, 'text-green-700');
  
  content = content.replace(/text-rose-400/g, 'text-red-600');
  content = content.replace(/text-rose-300/g, 'text-red-600');
  content = content.replace(/text-rose-200/g, 'text-red-700');
  
  content = content.replace(/text-amber-400/g, 'text-orange-600');
  content = content.replace(/text-purple-400/g, 'text-indigo-600');

  // 2. Background Colors
  content = content.replace(/bg-\[#0a0d14\]/g, 'bg-[#F2F2F7]');
  content = content.replace(/bg-\[#121620\]\/70/g, 'bg-white shadow-sm');
  content = content.replace(/bg-\[#141822\]/g, 'bg-white');
  content = content.replace(/bg-\[#1a202c\]\/80/g, 'bg-white shadow-sm');
  content = content.replace(/bg-\[#1c2230\]/g, 'bg-gray-100');
  content = content.replace(/bg-\[#181d2a\]/g, 'bg-gray-50');
  content = content.replace(/bg-black\/40/g, 'bg-gray-100');
  content = content.replace(/bg-slate-900\/90/g, 'bg-white/95');
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-800/g, 'bg-gray-200');
  content = content.replace(/bg-\[#080a0f\]\/80/g, 'bg-[#F2F2F7]/80');
  content = content.replace(/bg-\[#0c0e14\]/g, 'bg-gray-100');
  
  content = content.replace(/bg-cyan-500/g, 'bg-blue-600');
  content = content.replace(/bg-cyan-600/g, 'bg-blue-700');
  content = content.replace(/bg-cyan-950\/95/g, 'bg-blue-50');
  content = content.replace(/bg-emerald-950\/95/g, 'bg-green-50');
  content = content.replace(/bg-rose-950\/95/g, 'bg-red-50');
  content = content.replace(/bg-rose-950\/40/g, 'bg-red-50');
  content = content.replace(/bg-purple-950\/40/g, 'bg-indigo-50');
  
  content = content.replace(/bg-white\/5/g, 'bg-gray-100');
  content = content.replace(/bg-white\/10/g, 'bg-gray-200');

  // 3. Border Colors
  content = content.replace(/border-white\/5/g, 'border-gray-200');
  content = content.replace(/border-white\/10/g, 'border-gray-200');
  content = content.replace(/border-\[#232b3c\]/g, 'border-gray-200');
  content = content.replace(/border-slate-600/g, 'border-gray-300');
  
  content = content.replace(/border-cyan-500\/20/g, 'border-blue-200');
  content = content.replace(/border-cyan-500\/30/g, 'border-blue-200');
  content = content.replace(/border-cyan-500\/50/g, 'border-blue-300');
  content = content.replace(/border-cyan-500/g, 'border-blue-500');
  
  content = content.replace(/border-emerald-500\/20/g, 'border-green-200');
  content = content.replace(/border-emerald-500\/40/g, 'border-green-300');
  content = content.replace(/border-emerald-500\/50/g, 'border-green-300');
  
  content = content.replace(/border-rose-500\/30/g, 'border-red-200');
  content = content.replace(/border-rose-500\/50/g, 'border-red-300');
  
  content = content.replace(/border-purple-500\/50/g, 'border-indigo-200');

  // 4. Accents & Misc
  content = content.replace(/accent-cyan-500/g, 'accent-blue-600');
  content = content.replace(/accent-cyan-400/g, 'accent-blue-500');
  content = content.replace(/accent-rose-400/g, 'accent-red-500');
  content = content.replace(/accent-purple-400/g, 'accent-indigo-500');
  content = content.replace(/accent-emerald-400/g, 'accent-green-500');
  content = content.replace(/accent-amber-400/g, 'accent-orange-500');
  
  content = content.replace(/selection:bg-cyan-500/g, 'selection:bg-blue-200');
  content = content.replace(/selection:text-black/g, 'selection:text-blue-900');
  
  content = content.replace(/shadow-cyan-900\/20/g, 'shadow-sm');
  content = content.replace(/shadow-cyan-900\/30/g, 'shadow-sm');
  content = content.replace(/shadow-cyan-500\/10/g, 'shadow-sm');
  
  // Specific fix for tooltips being text-gray-900 on white bg now
  // Since we replaced bg-slate-900/90 with bg-white/95, the text should be gray-800
  // Tooltip text was text-slate-200, which became text-gray-800. Perfect.

  fs.writeFileSync(filePath, content);
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  replaceInFile(path.join(dir, file));
}
replaceInFile('src/App.tsx');
