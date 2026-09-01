const fs = require('fs');

// LedRingCustomizerTab
let codeLed = fs.readFileSync('src/components/LedRingCustomizerTab.tsx', 'utf8');
if (!codeLed.includes('Info')) {
  codeLed = codeLed.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Info, $1 } from 'lucide-react';");
}
if (!codeLed.includes('TooltipLabel')) {
  codeLed = codeLed.replace("import React from 'react';", "import React from 'react';\nimport { TooltipLabel } from './TooltipLabel';");
}
codeLed = codeLed.replace(
  '<span className="font-semibold text-slate-300">Master Ring Brightness</span>',
  '<TooltipLabel label="Master Ring Brightness" tooltip="Sets the global brightness limit for the entire NeoPixel array. Lower this to save battery." className="font-semibold text-slate-300" />'
);
codeLed = codeLed.replace(
  '<span className="font-semibold text-slate-300">Animation Speed (Crawl to Blur Fast)</span>',
  '<TooltipLabel label="Animation Speed" tooltip="Controls the update frequency of the NeoPixel patterns in the 60FPS loop." className="font-semibold text-slate-300" />'
);
fs.writeFileSync('src/components/LedRingCustomizerTab.tsx', codeLed);

// PowerBatteryManagerTab
let codePower = fs.readFileSync('src/components/PowerBatteryManagerTab.tsx', 'utf8');
if (!codePower.includes('Info')) {
  codePower = codePower.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Info, $1 } from 'lucide-react';");
}
if (!codePower.includes('TooltipLabel')) {
  codePower = codePower.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { TooltipLabel } from './TooltipLabel';");
}
codePower = codePower.replace(
  '<span className="font-semibold text-slate-300 flex items-center gap-2">',
  '<TooltipLabel label="Light Sleep Timeout" tooltip="Time before ESP32 powers down WiFi/Bluetooth while maintaining CPU context." className="font-semibold text-slate-300" />\n<span className="hidden">'
);
fs.writeFileSync('src/components/PowerBatteryManagerTab.tsx', codePower);

