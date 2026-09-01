const fs = require('fs');
const path = require('path');

const filesToFix = ['src/components/ProfilesAndFlashTab.tsx', 'src/components/ProfileManagerModal.tsx'];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace light background classes with neo-button
    content = content.replace(/className="[^"]*bg-blue-50[^"]*text-blue-[^"]*"/g, 'className="neo-button"');
    content = content.replace(/className="[^"]*bg-blue-100[^"]*text-blue-[^"]*"/g, 'className="neo-button"');
    content = content.replace(/className="[^"]*bg-slate-100[^"]*text-slate-[^"]*"/g, 'className="neo-button"');
    content = content.replace(/className="[^"]*bg-[#f1f5f9][^"]*"/g, 'className="neo-button"');
    content = content.replace(/className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition bg-slate-100 hover:bg-slate-200 text-slate-700"/g, 'className="neo-button"');

    // Make sure they have the right classes
    content = content.replace(/className="px-3 py-1.5 rounded-lg text-sm font-semibold transition bg-slate-200 hover:bg-slate-300 text-black flex items-center gap-2"/g, 'className="neo-button"');
    
    fs.writeFileSync(file, content);
  }
}
