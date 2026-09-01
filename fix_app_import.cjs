const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  'import { ActiveTab } from "./components/NavigationHeader";\nimport { Sidebar } from "./components/Sidebar";\nimport { TopBar } from "./components/TopBar" from \'./components/NavigationHeader\';',
  'import { ActiveTab } from "./components/NavigationHeader";\nimport { Sidebar } from "./components/Sidebar";\nimport { TopBar } from "./components/TopBar";'
);
fs.writeFileSync('src/App.tsx', code);
