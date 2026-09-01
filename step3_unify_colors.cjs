const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Replace text colors that shouldn't be rainbow
  content = content.replace(/text-green-[456]00/g, 'text-blue-400');
  content = content.replace(/text-purple-[345]00/g, 'text-blue-400');
  content = content.replace(/text-emerald-[456]00/g, 'text-blue-400');
  content = content.replace(/text-amber-[345]00/g, 'text-blue-400');
  content = content.replace(/text-orange-[456]00/g, 'text-blue-400');
  content = content.replace(/text-cyan-[456]00/g, 'text-blue-400');
  content = content.replace(/text-indigo-[456]00/g, 'text-blue-400');
  content = content.replace(/text-sky-[456]00/g, 'text-blue-400');
  
  // Also unify some background highlight colors to blue-500/20
  content = content.replace(/bg-purple-500\/20/g, 'bg-blue-500/20');
  content = content.replace(/bg-purple-500\/30/g, 'bg-blue-500/30');
  content = content.replace(/border-purple-500\/40/g, 'border-blue-500/40');
  content = content.replace(/border-purple-400/g, 'border-blue-400');
  content = content.replace(/border-purple-500\/30/g, 'border-blue-500/30');
  
  content = content.replace(/bg-emerald-500\/20/g, 'bg-blue-500/20');
  content = content.replace(/bg-amber-500\/20/g, 'bg-blue-500/20');
  content = content.replace(/bg-cyan-500\/20/g, 'bg-blue-500/20');

  // Unified toggles
  content = content.replace(/bg-purple-500/g, 'bg-blue-500');

  // Specific ButtonMapperTab replacements
  if (file === 'ButtonMapperTab.tsx') {
    // 3x3 Keypad Container background 
    content = content.replace(/bg-\[#F2F2F7\]\/95/g, 'bg-[#1c1c1e]');
    
    // Active key in 3x3
    // 'bg-blue-600 text-black ring-2 ring-cyan-400 shadow-cyan-500/40 scale-105 z-20' -> Optimal Curves Style
    content = content.replace(/'bg-blue-600 text-black ring-2 ring-cyan-400 shadow-cyan-500\/40 scale-105 z-20'/g, 
                              "'bg-blue-500/20 text-blue-300 border border-blue-500/40 scale-105 z-20'");
    
    // Pressed key in 3x3
    // 'bg-amber-400 text-black ring-2 ring-amber-400 scale-95'
    content = content.replace(/'bg-amber-400 text-black ring-2 ring-amber-400 scale-95'/g, 
                              "'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-95'");

    // Instant Tap active
    // 'bg-blue-600 text-black font-semibold shadow-sm'
    content = content.replace(/'bg-blue-600 text-black font-semibold shadow-sm'/g, 
                              "'bg-blue-500/20 text-blue-300 border border-blue-500/40'");
  }

  if (file === 'Sidebar.tsx') {
      // Fix Sidebar active selection background
      content = content.replace(/'bg-\[#2a2b30\] text-blue-400 shadow-\[inset_4px_4px_8px_rgba\(0,0,0,0\.5\),inset_-2px_-2px_6px_rgba\(255,255,255,0\.02\)\] border-b border-r border-white\/5'/g, 
          "'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm'");
      
      // Secondary items
      content = content.replace(/'bg-\[#2a2b30\] text-blue-400 shadow-\[inset_4px_4px_8px_rgba\(0,0,0,0\.5\)\] border-b border-r border-white\/5'/g, 
          "'bg-blue-500/10 text-blue-400 border border-blue-500/20'");
  }
  
  if (file === 'AxisTuningTab.tsx') {
      content = content.replace(/'bg-purple-950\/50 border-blue-400 shadow-md ring-1 ring-purple-400\/50'/g, 
          "'bg-blue-500/20 border-blue-400 shadow-md ring-1 ring-blue-500/40'");
  }

  fs.writeFileSync(path.join(dir, file), content);
}
