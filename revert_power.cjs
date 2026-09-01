const fs = require('fs');
let code = fs.readFileSync('src/components/PowerBatteryManagerTab.tsx', 'utf8');
code = code.replace(
  '<TooltipLabel label="Light Sleep Timeout" tooltip="Time before ESP32 powers down WiFi/Bluetooth while maintaining CPU context." className="font-semibold text-slate-300" />\n<span className="hidden">',
  '<span className="font-semibold text-slate-300 flex items-center gap-2">'
);
fs.writeFileSync('src/components/PowerBatteryManagerTab.tsx', code);
