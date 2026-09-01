const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace bg/borders
  content = content.replace(/bg-\[#141822\]/g, 'bg-[#121620]/70 backdrop-blur-xl');
  content = content.replace(/border-\[#232b3c\]/g, 'border-white/5');
  content = content.replace(/bg-\[#0c0e14\]/g, 'bg-black/40');
  content = content.replace(/bg-\[#080a0f\]/g, 'bg-[#080a0f]/80 backdrop-blur-2xl');
  content = content.replace(/bg-\[#1c2230\]/g, 'bg-white/10');
  content = content.replace(/bg-\[#1a202c\]/g, 'bg-[#1a202c]/80 backdrop-blur-xl');
  
  // Upgrade corner radii for main cards
  content = content.replace(/rounded-2xl bg-\[#121620\]\/70/g, 'rounded-3xl bg-[#121620]/70');
  
  // Replace long paragraphs with Tooltips (just hiding the paragraphs for now, or changing them to tooltips is harder with Regex)
  // Let's at least remove the common description <p> tags if they are just text-slate-400
  // Actually, wait, replacing inline descriptions with Info icons requires parsing JSX structure.
  
  fs.writeFileSync(filePath, content);
}
