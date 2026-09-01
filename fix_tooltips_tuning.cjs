const fs = require('fs');
let code = fs.readFileSync('src/components/AxisTuningTab.tsx', 'utf8');

// Ensure Info is imported
if (!code.includes('Info')) {
  code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Info, $1 } from 'lucide-react';");
}
if (!code.includes('TooltipLabel')) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { TooltipLabel } from './TooltipLabel';");
}

// Replace the span label for Sensitivity Multiplier
code = code.replace(
  '<span className="font-semibold text-slate-300">Sensitivity Multiplier</span>',
  '<TooltipLabel label="Sensitivity Multiplier" tooltip="Scales the raw physical sensor deflection. Higher values increase speed. Default is 1.0x." className="font-semibold text-slate-300" />'
);

// Replace Deadzone Threshold
code = code.replace(
  '<span className="font-semibold text-slate-300">Deadzone Threshold</span>',
  '<TooltipLabel label="Deadzone Threshold" tooltip="Filters out small, unintended vibrations near the center of the knob. Useful for heavy knobs or noisy environments." className="font-semibold text-slate-300" />'
);

// Replace Exponential Power
code = code.replace(
  '<span className="font-semibold text-slate-300">Exponential Power (Exponent)</span>',
  '<TooltipLabel label="Exponential Power" tooltip="Controls the steepness of the response curve. Higher powers make the center very precise while the extremes remain fast." className="font-semibold text-slate-300" />'
);

// Replace Smoothing Alpha (Low-Pass)
code = code.replace(
  '<span className="font-semibold text-slate-300">Smoothing Alpha (Low-Pass)</span>',
  '<TooltipLabel label="Smoothing Alpha (Low-Pass)" tooltip="Mathematical filter that smooths out jerky movements. 1.0 = instant raw, 0.1 = heavily smoothed." className="font-semibold text-slate-300" />'
);

// Replace Jitter Rejection
code = code.replace(
  '<span className="font-semibold text-slate-300">Jitter Rejection Filter</span>',
  '<TooltipLabel label="Jitter Rejection Filter" tooltip="Aggressively clamps tiny micromovements to zero before they enter the smoothing pipeline." className="font-semibold text-slate-300" />'
);

// Replace Precision Mode Divider
code = code.replace(
  '<span className="font-semibold text-slate-300">Precision Mode Divider</span>',
  '<TooltipLabel label="Precision Mode Divider" tooltip="The multiplier applied when the Precision Action button is held. E.g., 0.25x slows movement by 4x." className="font-semibold text-slate-300" />'
);

fs.writeFileSync('src/components/AxisTuningTab.tsx', code);
