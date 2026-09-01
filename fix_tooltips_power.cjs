const fs = require('fs');
let code = fs.readFileSync('src/components/PowerBatteryManagerTab.tsx', 'utf8');

code = code.replace(
  '<span className="text-xs font-bold text-white block">Light Sleep Mode (Standby)</span>',
  '<TooltipLabel label="Light Sleep Mode (Standby)" tooltip="Disables WiFi and Bluetooth but keeps RAM powered. Wakes instantly on any movement." className="text-xs font-bold text-white block" />'
);

code = code.replace(
  '<span className="text-xs font-bold text-white block">Deep Hibernate Sleep</span>',
  '<TooltipLabel label="Deep Hibernate Sleep" tooltip="Powers down the entire ESP32 to save maximum battery. Requires a button press to wake." className="text-xs font-bold text-white block" />'
);

fs.writeFileSync('src/components/PowerBatteryManagerTab.tsx', code);
