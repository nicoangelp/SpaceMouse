const fs = require('fs');
let code = fs.readFileSync('src/data/firmwareTemplates.ts', 'utf8');

code = code.replace(
  'if (sscanf(cmd + 13, "%d:%d:%d:%d:%f:%d:%u:%u:%u:%u:%u:%u:%u:%u",',
  'if (sscanf(cmd + 13, "%d:%d:%d:%d:%f:%d:%u:%u:%u:%u:%u:%u:%u:%u",'
);
code = code.replace(
  '               &pk0, &pk1, &pk2, &pk3, &nk0, &nk1, &nk2, &nk3) >= 6) {',
  '               &pk0, &pk1, &pk2, &pk3, &nk0, &nk1, &nk2, &nk3) == 14) {'
);

code = code.replace(
  'if (sscanf(cmd + 12, "%d:%15[^:]:%15[^:]:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%d",',
  'if (sscanf(cmd + 12, "%d:%15[^:]:%15[^:]:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%d",'
);
code = code.replace(
  '               &dzX, &dzY, &dzZ, &dzRx, &dzRy, &dzRz, &invMask) >= 4) {',
  '               &dzX, &dzY, &dzZ, &dzRx, &dzRy, &dzRz, &invMask) == 16) {'
);

code = code.replace(
  'if (sscanf(cmd + 8, "%d:%15[^:]:%15[^:]:%15[^:]:%d:%d:%d:%d:%d:%d",',
  'if (sscanf(cmd + 8, "%d:%15[^:]:%15[^:]:%15[^:]:%d:%d:%d:%d:%d:%d",'
);
code = code.replace(
  '                &idx, hexP, hexS, hexA, &iAnim, &iSpd, &aAnim, &aSpd, &brt, &rotOff) >= 4) {',
  '                &idx, hexP, hexS, hexA, &iAnim, &iSpd, &aAnim, &aSpd, &brt, &rotOff) == 10) {'
);

code = code.replace(
  'if (sscanf(cmd + 11, "%d:%d:%f:%f:%f:%f:%f:%f", &pIdx, &row, &m0, &m1, &m2, &m3, &m4, &m5) >= 8) {',
  'if (sscanf(cmd + 11, "%d:%d:%f:%f:%f:%f:%f:%f", &pIdx, &row, &m0, &m1, &m2, &m3, &m4, &m5) == 8) {'
);

fs.writeFileSync('src/data/firmwareTemplates.ts', code);
