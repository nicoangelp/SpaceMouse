const fs = require('fs');

const sliderCode = `
import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Slider: React.FC<SliderProps> = (props) => {
  const min = Number(props.min) || 0;
  const max = Number(props.max) || 100;
  const val = Number(props.value) || 0;
  // Prevent division by zero
  const percentage = max - min === 0 ? 0 : Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

  return (
    <input
      {...props}
      type="range"
      style={{
        ...props.style,
        background: \`linear-gradient(to right, #3b82f6 \${percentage}%, #1c1c1e \${percentage}%)\`
      }}
      className={\`appearance-none h-1.5 rounded-full border border-white/5 outline-none cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] \${props.className || ''}\`}
    />
  );
};
`;
fs.writeFileSync('src/components/Slider.tsx', sliderCode.trim());

// Add the custom thumb styles to CSS
let css = fs.readFileSync('src/index.css', 'utf8');
css += `
@layer components {
  input[type=range]::-webkit-slider-thumb {
    @apply appearance-none w-4 h-4 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 active:scale-95 border-none;
  }
  input[type=range]::-moz-range-thumb {
    @apply appearance-none w-4 h-4 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 active:scale-95 border-none;
  }
}
`;
fs.writeFileSync('src/index.css', css);

