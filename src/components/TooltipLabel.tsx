import React from 'react';
import { Info } from 'lucide-react';

interface TooltipLabelProps {
 label: string;
 tooltip: string;
 className?: string;
}

export const TooltipLabel: React.FC<TooltipLabelProps> = ({ label, tooltip, className = "" }) => {
 return (
 <div className={`flex items-center gap-2 ${className}`}>
 <span>{label}</span>
 <div className="group relative flex items-center">
 <Info className="w-4 h-4 text-zinc-500 cursor-help hover:text-white transition-colors" />
 <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute z-50 backdrop-blur-2xl bg-[#1c1c1e]/90 border border-t-white/10 border-l-white/10 shadow-[8px_8px_16px_rgba(0,0,0,0.6)] p-3 rounded-xl text-xs text-white top-full mt-2 left-1/2 -translate-x-1/2 w-64 pointer-events-none scale-95 group-hover:scale-100 origin-top">
 {tooltip}
 </div>
 </div>
 </div>
 );
};