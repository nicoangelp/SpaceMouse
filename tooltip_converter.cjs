const fs = require('fs');
const path = require('path');

const files = [
  'AxisTuningTab.tsx',
  'ButtonMapperTab.tsx',
  'PowerBatteryManagerTab.tsx',
  'LedRingCustomizerTab.tsx'
];

// Instead of manually parsing the AST, I will look for patterns like:
// <span className="text-xs font-semibold text-slate-300 block mb-1">
//   Label
// </span>
// <span className="text-[10px] text-slate-500 mb-2 block">
//   Some description
// </span>

// Let's first replace range inputs:
files.forEach(file => {
  const filePath = path.join('src/components', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Redesign <input type="range">
  // Original might be: className="..."
  // Let's replace the whole className if it contains range
  content = content.replace(/<input\s*type="range"/g, '<input type="range"');
  content = content.replace(/type="range"\s*className="[^"]*"/g, 'type="range" className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-95"');
  
  // Replace <p> tags with hidden
  content = content.replace(/<p className="/g, '<p className="hidden ');

  fs.writeFileSync(filePath, content);
});
