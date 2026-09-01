const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  if (file === 'Slider.tsx') continue;
  
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  if (content.includes('<input') && content.includes('type="range"')) {
    // Add import if missing
    if (!content.includes("import { Slider }")) {
      content = content.replace(/import React[^;]*;/, `$& \nimport { Slider } from './Slider';`);
    }

    // Replace input tags. Since attributes could span multiple lines, we'll use a regex that matches <input ... type="range" ... />
    // It's safer to just replace `<input` with `<Slider` and remove `type="range"` and `neo-slider-gradient` class
    
    // Actually, React components might have other inputs (text, number), so only target range inputs
    // A simple regex might not handle all cases if they span multiple lines.
    // Let's replace `<input` with `<Slider` where `type="range"` is present in the same tag.
    
    // Find all <input ... /> blocks
    content = content.replace(/<input([^>]*type="range"[^>]*)>/g, (match, p1) => {
        let newAttrs = p1.replace(/type="range"/, '');
        newAttrs = newAttrs.replace(/className="neo-slider-gradient"/, ''); // we removed this class logic
        newAttrs = newAttrs.replace(/className="[^"]*neo-slider-gradient[^"]*"/, 'className="w-full"');
        return `<Slider ${newAttrs} />`;
    });
    
    content = content.replace(/<input([^>]*type="range"[^>]*)\/>/g, (match, p1) => {
        let newAttrs = p1.replace(/type="range"/, '');
        newAttrs = newAttrs.replace(/className="neo-slider-gradient"/, '');
        newAttrs = newAttrs.replace(/className="[^"]*neo-slider-gradient[^"]*"/, 'className="w-full"');
        return `<Slider ${newAttrs} />`;
    });
  }

  fs.writeFileSync(path.join(dir, file), content);
}
