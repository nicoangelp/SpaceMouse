const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Replace hover:bg-gray-200 with hover:bg-[#252e40] or hover:bg-slate-800
  content = content.replace(/hover:bg-gray-200/g, 'hover:bg-slate-800');
  
  // Replace bg-gray-200 (that isn't a hover) with neo-panel-inset
  // Note: Some of these were "bg-gray-200" for an inactive/disabled state or track
  content = content.replace(/bg-gray-200/g, 'neo-panel-inset');
  content = content.replace(/bg-gray-100/g, 'neo-panel-inset');

  // In TopBar:
  content = content.replace(/bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/g, 'bg-[#1c1c1e] hover:bg-slate-800 text-zinc-300 hover:text-white border border-[#273248]');
  content = content.replace(/bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500\/20/g, 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'); // keep this if primary
  
  content = content.replace(/text-gray-400/g, 'text-zinc-500');
  content = content.replace(/text-gray-700/g, 'text-zinc-300');
  content = content.replace(/border-gray-200/g, 'border-transparent');

  fs.writeFileSync(path.join(dir, file), content);
}
