const fs = require('fs');

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/bg-gradient-to-br from-cyan-400 to-emerald-400/g, 'bg-gradient-to-br from-blue-600 to-indigo-600');
sidebar = sidebar.replace(/bg-\[#1a2333\]\/90 text-blue-600 shadow-sm border border-blue-200 shadow-sm/g, 'bg-white text-blue-600 shadow-sm border border-gray-200');
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);


let topbar = fs.readFileSync('src/components/TopBar.tsx', 'utf8');
topbar = topbar.replace(
  /'bg-blue-700 text-black'/,
  "'bg-blue-700 text-white'"
);
topbar = topbar.replace(
  /'bg-blue-600 hover:bg-cyan-400 text-black shadow-lg shadow-sm'/,
  "'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'"
);
topbar = topbar.replace(
  /className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500\/10 hover:bg-sky-500\/20 text-sky-300 border border-sky-500\/20 text-xs font-semibold transition-all duration-300 hover:scale-\[1.02\] active:scale-95"/,
  'className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95"'
);
fs.writeFileSync('src/components/TopBar.tsx', topbar);
