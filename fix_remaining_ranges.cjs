const fs = require('fs');

let bm = fs.readFileSync('src/components/ButtonMapperTab.tsx', 'utf8');
bm = bm.replace(/className="w-full accent-cyan-400 cursor-pointer"/g, 'className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-95"');
bm = bm.replace(/className="w-full accent-purple-400 cursor-pointer"/g, 'className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-95"');
fs.writeFileSync('src/components/ButtonMapperTab.tsx', bm);

let pb = fs.readFileSync('src/components/PowerBatteryManagerTab.tsx', 'utf8');
pb = pb.replace(/className="w-full h-2 bg-black\/40 rounded-lg appearance-none cursor-pointer accent-amber-400"/g, 'className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-95"');
fs.writeFileSync('src/components/PowerBatteryManagerTab.tsx', pb);

