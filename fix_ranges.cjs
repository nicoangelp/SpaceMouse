const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to replace className="..." on any <input type="range"
  // Let's use a regex that matches className="[anything]" if it is immediately preceded by <input type="range" ...
  // Actually, standard regex is hard. Let's do it simply by replacing `className="... accent-...` if it's an input
  content = content.replace(/className="w-full\s+h-1\.5\s+[^"]+"/g, 'className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-95"');
  content = content.replace(/className="w-full\s+h-1\s+bg-slate-800\s+[^"]+"/g, 'className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-95"');
  
  fs.writeFileSync(filePath, content);
}
