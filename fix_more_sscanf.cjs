const fs = require('fs');
let code = fs.readFileSync('src/data/firmwareTemplates.ts', 'utf8');

code = code.replace(
  'if (sscanf(cmd + 10, "%d:%d", &lightMin, &deepMin) >= 2) {',
  'if (sscanf(cmd + 10, "%d:%d", &lightMin, &deepMin) == 2) {'
);

code = code.replace(
  'if (sscanf(cmd + 12, "%f:%f:%f", &a, &j, &pMult) >= 3) {',
  'if (sscanf(cmd + 12, "%f:%f:%f", &a, &j, &pMult) == 3) {'
);

code = code.replace(
  'if (sscanf(cmd + 8, "%d:%d:%d:%d:%d:%u", &pIdx, &kIdx, &isHold, &actType, &modMask, &keyCode) >= 4) {',
  'if (sscanf(cmd + 8, "%d:%d:%d:%d:%d:%u", &pIdx, &kIdx, &isHold, &actType, &modMask, &keyCode) == 6) {'
);

code = code.replace(
  'if (sscanf(cmd + 9, "%d:%d:%d:%d:%u:%u:%u:%u", &pIdx, &kIdx, &isHold, &actType, &k0, &k1, &k2, &k3) >= 4) {',
  'if (sscanf(cmd + 9, "%d:%d:%d:%d:%u:%u:%u:%u", &pIdx, &kIdx, &isHold, &actType, &k0, &k1, &k2, &k3) == 8) {'
);

fs.writeFileSync('src/data/firmwareTemplates.ts', code);
