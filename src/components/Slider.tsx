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
        background: `linear-gradient(to right, #3b82f6 ${percentage}%, #1c1c1e ${percentage}%)`
      }}
      className={`appearance-none h-1.5 rounded-full border border-white/5 outline-none cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] ${props.className || ''}`}
    />
  );
};