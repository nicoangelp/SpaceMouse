import React from 'react'; 
import { Slider } from './Slider';
import { SixDofState, SixDofAxesConfig, GlobalFilterConfig } from '../types';
import { MoveHorizontal, MoveVertical, ZoomIn, RotateCcw, Lock, Unlock, Sliders } from 'lucide-react';

interface SixDofGaugesProps {
 state: SixDofState;
 axes: SixDofAxesConfig;
 filters: GlobalFilterConfig;
 isSimulating: boolean;
 onSimulateChange: (key: keyof SixDofState, value: number) => void;
 onToggleFilter: (filterKey: keyof GlobalFilterConfig) => void;
 onZeroTare: () => void;
}

export const SixDofGauges: React.FC<SixDofGaugesProps> = ({
 state,
 axes,
 filters,
 isSimulating,
 onSimulateChange,
 onToggleFilter,
 onZeroTare,
}) => {
 const renderGaugeBar = (
 label: string,
 axisKey: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz',
 value: number,
 colorClass: string,
 description: string,
 icon: React.ReactNode
 ) => {
 const config = axes[axisKey];
 const percentage = Math.round(value * 100);
 const isLocked =
 (axisKey === 'x' || axisKey === 'y' || axisKey === 'z') ? filters.lockPan : filters.lockRotation;
 const isOverThreshold = Math.abs(value) > 0.02;

 return (
 <div className={`p-3.5 rounded-xl border transition-all ${isLocked ? 'bg-[#0a0d12]/40 border-[#1e2632]/40 opacity-50' : 'bg-[#0a0d12] border-[#1e2632] shadow-lg hover:border-blue-200'}`}>
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="p-1.5 rounded-lg bg-[#050608] border border-[#1e2632] text-blue-400">{icon}</span>
 <div>
 <div className="text-xs font-semibold text-white flex items-center gap-1.5 ">
 <span>{label}</span>
 {config.inverted && (
 <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-blue-400 border border-amber-500/30">INV</span>
 )}
 </div>
 <div className="text-xs text-zinc-400 ">{description}</div>
 </div>
 </div>
 <div className="text-right">
 <span
 className={` text-xs font-extrabold ${
 isOverThreshold ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-zinc-500'
 }`}
 >
 {value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}
 </span>
 <div className="text-xs text-zinc-500 ">{percentage}%</div>
 </div>
 </div>

 {/* Bi-directional Center-Zero Progress Bar */}
 <div className="relative w-full h-3 bg-[#050608] rounded-full overflow-hidden border border-[#1e2632] flex items-center">
 {/* Center line */}
 <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10" />

 {/* Deadzone highlight marker */}
 <div
 className="absolute top-0 bottom-0 neo-panel-inset/80 z-0"
 style={{
 left: `${50 - (config.deadzone / 2)}%`,
 width: `${config.deadzone}%`,
 }}
 title={`Deadzone: ${config.deadzone}%`}
 />

 {/* Active bar */}
 {value < 0 ? (
 <div
 className={`absolute right-1/2 h-full transition-all duration-75 rounded-l-full ${colorClass}`}
 style={{ width: `${Math.min(50, Math.abs(value) * 50)}%` }}
 />
 ) : (
 <div
 className={`absolute left-1/2 h-full transition-all duration-75 rounded-r-full ${colorClass}`}
 style={{ width: `${Math.min(50, value * 50)}%` }}
 />
 )}
 </div>

 {/* Manual Simulation Slider */}
 {isSimulating && (
 <div className="mt-2.5 pt-2 border-t border-[#1e2632]/80 flex items-center gap-2">
 <span className="text-xs text-zinc-500 ">-1</span>
 <Slider 
 
 min="-1"
 max="1"
 step="0.02"
 value={value}
 onChange={(e) => onSimulateChange(axisKey, parseFloat(e.target.value))}
 className="w-full h-1 neo-panel-inset rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-95"
 />
 <span className="text-xs text-zinc-500 ">+1</span>
 <button
 onClick={() => onSimulateChange(axisKey, 0)}
 className="text-xs px-1.5 py-0.5 rounded bg-[#1e2632] text-zinc-300 hover:text-white "
 >
 0
 </button>
 </div>
 )}
 </div>
 );
 };

 return (
 <div className="w-full space-y-3.5">
 {/* Quick Global Toggles Header */}
 <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#0a0d12] rounded-xl border border-[#1e2632]">
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-zinc-300 uppercase">Axis Locks:</span>
 <button
 id="toggle-pan-lock"
 onClick={() => onToggleFilter('lockPan')}
 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
 filters.lockPan
 ? 'bg-amber-950/80 border-amber-500 text-blue-400 glow-amber-sm'
 : 'bg-[#050608] border-[#1e2632] text-zinc-400 hover:text-white hover:border-slate-700'
 }`}
 >
 {filters.lockPan ? <Lock className="w-3 h-3 text-blue-400" /> : <Unlock className="w-3 h-3" />}
 <span className=" text-xs">Lock Pan</span>
 </button>
 <button
 id="toggle-rot-lock"
 onClick={() => onToggleFilter('lockRotation')}
 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
 filters.lockRotation
 ? 'bg-amber-950/80 border-amber-500 text-blue-400 glow-amber-sm'
 : 'bg-[#050608] border-[#1e2632] text-zinc-400 hover:text-white hover:border-slate-700'
 }`}
 >
 {filters.lockRotation ? <Lock className="w-3 h-3 text-blue-400" /> : <Unlock className="w-3 h-3" />}
 <span className=" text-xs">Lock Orbit</span>
 </button>
 </div>

 <button
 id="btn-zero-tare"
 onClick={onZeroTare}
 className="neo-button-primary"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>ZERO TARE</span>
 </button>
 </div>

 {/* Translations (Linear 3-Axis) */}
 <div className="space-y-2">
 <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 ">
 <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
 <span>Linear Translation (Pan & Dolly)</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
 {renderGaugeBar('X - Pan L/R', 'x', state.x, 'bg-blue-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]', 'Lateral Axis', <MoveHorizontal className="w-3 h-3 text-blue-400" />)}
 {renderGaugeBar('Y - Pan U/D', 'y', state.y, 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', 'Vertical Axis', <MoveVertical className="w-3 h-3 text-blue-400" />)}
 {renderGaugeBar('Z - Zoom Dolly', 'z', state.z, 'bg-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]', 'Depth Push/Pull', <ZoomIn className="w-3 h-3 text-blue-400" />)}
 </div>
 </div>

 {/* Rotations (Angular 3-Axis) */}
 <div className="space-y-2">
 <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 ">
 <Sliders className="w-3.5 h-3.5 text-blue-400" />
 <span>Angular Rotation (Orbit & Tilt)</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
 {renderGaugeBar('Rx - Pitch', 'rx', state.rx, 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]', 'Forward / Backward', <RotateCcw className="w-3 h-3 text-blue-400" />)}
 {renderGaugeBar('Ry - Roll', 'ry', state.ry, 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]', 'Left / Right Bank', <RotateCcw className="w-3 h-3 text-red-600" />)}
 {renderGaugeBar('Rz - Yaw', 'rz', state.rz, 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]', 'Horizontal Spin', <RotateCcw className="w-3 h-3 text-teal-300" />)}
 </div>
 </div>
 </div>
 );
};
