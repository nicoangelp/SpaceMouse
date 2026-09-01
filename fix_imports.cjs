const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  // First, remove "Info, " from '../types' if it got accidentally added.
  code = code.replace(/import\s*\{\s*Info,\s*/, 'import { ');
  
  // Make sure we have Info from lucide-react.
  if (!code.includes('import { Info')) {
    code = code.replace(/import\s*\{([^}]*)\}\s*from\s*'lucide-react';/, "import { Info, $1 } from 'lucide-react';");
  }
  
  // Wait, if I stripped Info from types, I need to make sure I add it to lucide-react.
  if (!code.match(/import\s*\{[^}]*Info[^}]*\}\s*from\s*'lucide-react'/)) {
     if (code.includes("'lucide-react'")) {
         code = code.replace(/import\s*\{([^}]*)\}\s*from\s*'lucide-react';/, "import { Info, $1 } from 'lucide-react';");
     } else {
         code = "import { Info } from 'lucide-react';\n" + code;
     }
  }

  fs.writeFileSync(file, code);
}

fixFile('src/components/AxisTuningTab.tsx');
fixFile('src/components/LedRingCustomizerTab.tsx');
fixFile('src/components/PowerBatteryManagerTab.tsx');

// Also fix the TooltipLabel not found in LedRingCustomizerTab
let ledCode = fs.readFileSync('src/components/LedRingCustomizerTab.tsx', 'utf8');
if (!ledCode.includes("import { TooltipLabel }")) {
   ledCode = ledCode.replace("import React from 'react';", "import React from 'react';\nimport { TooltipLabel } from './TooltipLabel';");
   fs.writeFileSync('src/components/LedRingCustomizerTab.tsx', ledCode);
}
