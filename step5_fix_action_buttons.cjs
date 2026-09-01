const fs = require('fs');

const path = 'src/components/ProfilesAndFlashTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// Factory Reset button
content = content.replace(/className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500\/10 hover:bg-red-500\/20 text-xs font-semibold text-red-400 border border-red-500\/20 transition"/g, 
'className="neo-button-danger text-xs px-3 py-2"');

content = content.replace(/className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500\/10 hover:bg-rose-500\/20 text-xs font-semibold text-rose-400 border border-rose-500\/20 transition"/g, 
'className="neo-button-danger text-xs px-3 py-2"');

// Import and Export
content = content.replace(/className="neo-panel-inset hover:bg-slate-800 text-xs font-semibold text-zinc-300 hover:text-white"/g, 'className="neo-button text-xs px-3 py-2 text-zinc-300 hover:text-blue-400"');
content = content.replace(/className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-semibold text-zinc-800 border border-gray-300 transition"/g, 'className="neo-button text-xs px-3 py-2 text-zinc-300 hover:text-blue-400"');

// Specifically finding the export button
content = content.replace(/<button\s+onClick=\{handleExportProfiles\}\s+className="[^"]*"/g, '<button onClick={handleExportProfiles} className="neo-button text-xs px-3 py-2 text-zinc-300 hover:text-blue-400"');
// Specifically finding the import button (its actually a label wrapping an input)
content = content.replace(/<label\s+className="[^"]*"\s*>\s*<Upload/g, '<label className="neo-button text-xs px-3 py-2 text-zinc-300 hover:text-blue-400 cursor-"><Upload');

fs.writeFileSync(path, content);
