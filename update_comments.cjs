const fs = require('fs');
let code = fs.readFileSync('src/data/firmwareTemplates.ts', 'utf8');

// Update applyAxisCurve
code = code.replace(
  'float applyAxisCurve(float inputVal, uint8_t curveType, float expoPower) {',
  '// Applies mathematical response curves for fine motor control at the center and high-speed panning at the extremes.\nfloat applyAxisCurve(float inputVal, uint8_t curveType, float expoPower) {'
);

// Update matrix comment
code = code.replace(
  '// 6x6 CROSS-TALK DECOUPLING MATRIX:\n    // Decouple axes BEFORE applying the low-pass alpha filter',
  '// 6x6 CROSS-TALK DECOUPLING MATRIX:\n    // Resolves pure Cartesian kinematics (X,Y,Z,Rx,Ry,Rz) by canceling parasitic mechanical deflection.'
);

fs.writeFileSync('src/data/firmwareTemplates.ts', code);
