import React, { useState } from 'react';
import { SixDofAxesConfig, GlobalFilterConfig, AxisParameters, CurveType, TriangularSpringFlexureConfig } from '../types';
import {
  Sliders,
  Activity,
  Sparkles,
  RotateCcw,
  Zap,
  Save,
  CheckCircle,
  Layers,
  Compass,
  ArrowUpDown,
  Move,
  RotateCw,
  Cpu,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface AxisTuningTabProps {
  axes: SixDofAxesConfig;
  filters: GlobalFilterConfig;
  triangularFlexure?: TriangularSpringFlexureConfig;
  onUpdateAxis: (axisKey: keyof SixDofAxesConfig, params: Partial<AxisParameters>) => void;
  onUpdateFilters: (filters: Partial<GlobalFilterConfig>) => void;
  onUpdateTriangularFlexure?: (config: TriangularSpringFlexureConfig) => void;
  onSyncToEsp32: () => void;
  isConnected: boolean;
}

export const AxisTuningTab: React.FC<AxisTuningTabProps> = ({
  axes,
  filters,
  triangularFlexure,
  onUpdateAxis,
  onUpdateFilters,
  onUpdateTriangularFlexure,
  onSyncToEsp32,
  isConnected,
}) => {
  const [selectedAxis, setSelectedAxis] = useState<keyof SixDofAxesConfig>('x');
  const [syncedRecently, setSyncedRecently] = useState(false);
  const [appliedPresetMsg, setAppliedPresetMsg] = useState<string | null>(null);

  const flexureConfig: TriangularSpringFlexureConfig = triangularFlexure || {
    flexureGeometry: 'triangular_6_spring_parallel',
    springRateStiffness: 1.15,
    radialSymmetryDeg: 120,
    shearTiltDecoupling: 0.88,
    axialZPreloadComp: 0.92,
    torsionYawDamping: 0.90,
  };

  const handleUpdateFlexure = (updated: Partial<TriangularSpringFlexureConfig>) => {
    if (onUpdateTriangularFlexure) {
      onUpdateTriangularFlexure({ ...flexureConfig, ...updated });
    }
  };

  const currentAxis = axes[selectedAxis];

  const axisNames: Record<keyof SixDofAxesConfig, { label: string; desc: string; type: 'trans' | 'rot' }> = {
    x: { label: 'X - Pan Left / Right', desc: 'Lateral horizontal camera tracking (Shear translation)', type: 'trans' },
    y: { label: 'Y - Pan Up / Down', desc: 'Vertical / Depth translation (Shear translation)', type: 'trans' },
    z: { label: 'Z - Zoom Pull / Push', desc: 'Dolly camera in/out (Axial compression/tension)', type: 'trans' },
    rx: { label: 'Rx - Pitch (Tilt Forward/Back)', desc: 'Elevation view angle (Angular moment)', type: 'rot' },
    ry: { label: 'Ry - Roll (Tilt Left/Right)', desc: 'Horizon banking angle (Angular moment)', type: 'rot' },
    rz: { label: 'Rz - Yaw (Twist Left/Right)', desc: 'Azimuth rotational spin (Torsional twist)', type: 'rot' },
  };

  const handleSyncClick = () => {
    onSyncToEsp32();
    setSyncedRecently(true);
    setTimeout(() => setSyncedRecently(false), 2500);
  };

  // Apply Triangular 6-Spring Stewart / Delta parallel flexure optimized preset
  const handleApplyTriangularPreset = () => {
    // 1. Optimized deadzones and curves for 3 paired compression/tension spring geometry
    onUpdateAxis('x', { deadzone: 8, sensitivity: 1.25, curve: 'quadratic', expoPower: 2.0 });
    onUpdateAxis('y', { deadzone: 8, sensitivity: 1.25, curve: 'quadratic', expoPower: 2.0 });
    onUpdateAxis('z', { deadzone: 10, sensitivity: 1.6, curve: 'quadratic', expoPower: 2.2 });
    onUpdateAxis('rx', { deadzone: 8, sensitivity: 1.05, curve: 's_curve', expoPower: 1.8 });
    onUpdateAxis('ry', { deadzone: 8, sensitivity: 1.05, curve: 's_curve', expoPower: 1.8 });
    onUpdateAxis('rz', { deadzone: 9, sensitivity: 1.15, curve: 's_curve', expoPower: 1.8 });

    // 2. Global kinematics filtering optimized for MPU6050 inside spring knob
    onUpdateFilters({
      smoothingAlpha: 0.35,
      jitterThreshold: 3,
      dominantAxisOnly: false,
      precisionMultiplier: 0.28,
    });

    handleUpdateFlexure({
      springRateStiffness: 1.2,
      shearTiltDecoupling: 0.90,
      axialZPreloadComp: 0.94,
      torsionYawDamping: 0.91,
    });

    setAppliedPresetMsg('Applied Triangular Parallel 6-Spring Flexure Kinematics Preset!');
    setTimeout(() => setAppliedPresetMsg(null), 4000);
  };

  // Generate SVG curve points based on deadzone and expo power
  const generateCurvePath = (dz: number, curve: CurveType, expo: number) => {
    const points: string[] = [];
    const deadzoneNorm = dz / 100;

    for (let i = 0; i <= 50; i++) {
      const input = i / 50; // 0.0 to 1.0
      let output = 0;

      if (input > deadzoneNorm) {
        const scaled = (input - deadzoneNorm) / (1 - deadzoneNorm);
        if (curve === 'linear') {
          output = scaled;
        } else if (curve === 'quadratic') {
          output = Math.pow(scaled, 2);
        } else if (curve === 'exponential') {
          output = Math.pow(scaled, expo);
        } else if (curve === 's_curve') {
          output = 1 / (1 + Math.exp(-8 * (scaled - 0.5)));
        }
      }

      // Map to SVG coordinates: 0..200 width, 100..0 height
      const svgX = input * 200;
      const svgY = 100 - output * 100;
      points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
    }

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sync Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632]">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>6-DOF AXIS DYNAMICS & KINEMATICS ENGINE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Fine-tune deadzones, exponential transfer functions, gain multipliers, and triangular parallel spring kinematics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyTriangularPreset}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono bg-purple-950/80 border border-purple-500/50 hover:bg-purple-900 text-purple-200 transition"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>APPLY 6-SPRING FLEXURE PRESET</span>
          </button>

          <button
            id="btn-sync-axes-esp32"
            onClick={handleSyncClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono shadow-lg transition-all active:scale-95 ${
              syncedRecently
                ? 'bg-emerald-600 text-black glow-emerald-sm'
                : isConnected
                ? 'bg-cyan-600 hover:bg-cyan-500 text-black glow-cyan-sm'
                : 'bg-[#050608] border border-[#1e2632] text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {syncedRecently ? (
              <>
                <CheckCircle className="w-4 h-4 text-black" />
                <span>SYNCED TO ESP32 FLASH</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isConnected ? 'SYNC TO ESP32 EEPROM' : 'SAVE LOCALLY'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {appliedPresetMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{appliedPresetMsg}</span>
        </div>
      )}

      {/* FEATURE SECTION: Triangular Parallel Spring Flexure (Stewart / Delta 6-Spring Geometry) */}
      <div className="p-5 rounded-2xl bg-[#090d14] border border-cyan-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1e2632]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Triangular Parallel Spring Flexure Model
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  Stewart/Delta 6-Spring Paired Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                3-post equilateral geometry with paired compression/tension springs balances forces across all 6 degrees of freedom.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Radial 120° Symmetry Compliant Matrix</span>
          </div>
        </div>

        {/* Flexure Kinematic Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parameter 1: Shear vs Tilt Decoupling */}
          <div className="p-3.5 rounded-xl bg-[#050608] border border-[#1e2632] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lateral Shear / Tilt Decoupling</span>
              </span>
              <span className="text-cyan-400 font-bold">{(flexureConfig.shearTiltDecoupling * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="1.00"
              step="0.02"
              value={flexureConfig.shearTiltDecoupling}
              onChange={(e) => handleUpdateFlexure({ shearTiltDecoupling: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-slate-500 block">
              Isolates lateral pan (X/Y) from angular tilt (Rx/Ry) caused by spring moment arms
            </span>
          </div>

          {/* Parameter 2: Axial Z Preload Balance */}
          <div className="p-3.5 rounded-xl bg-[#050608] border border-[#1e2632] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Axial Z Compression/Tension Preload</span>
              </span>
              <span className="text-emerald-400 font-bold">{(flexureConfig.axialZPreloadComp * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="1.00"
              step="0.02"
              value={flexureConfig.axialZPreloadComp}
              onChange={(e) => handleUpdateFlexure({ axialZPreloadComp: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] font-mono text-slate-500 block">
              Balances vertical push/pull stiffness against puck weight & gravity
            </span>
          </div>

          {/* Parameter 3: Yaw Torsion Spring Damping */}
          <div className="p-3.5 rounded-xl bg-[#050608] border border-[#1e2632] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Yaw Torsion Spring Decay</span>
              </span>
              <span className="text-purple-400 font-bold">{(flexureConfig.torsionYawDamping * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.70"
              max="0.99"
              step="0.01"
              value={flexureConfig.torsionYawDamping}
              onChange={(e) => handleUpdateFlexure({ torsionYawDamping: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <span className="text-[10px] font-mono text-slate-500 block">
              Leaky spring center return to eliminate angular drift when releasing twist
            </span>
          </div>
        </div>
      </div>

      {/* Axis Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {(Object.keys(axisNames) as Array<keyof SixDofAxesConfig>).map((key) => {
          const info = axisNames[key];
          const isSelected = selectedAxis === key;
          return (
            <button
              key={key}
              id={`tab-axis-${key}`}
              onClick={() => setSelectedAxis(key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500 text-white glow-cyan-sm'
                  : 'bg-[#0a0d12] border-[#1e2632] text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-extrabold uppercase font-mono text-cyan-400">{key}</div>
              <div className="text-xs font-semibold truncate text-slate-200">{info.label.split(' - ')[1]}</div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{axes[key].sensitivity.toFixed(1)}x</span>
                {axes[key].inverted && <span className="text-amber-400 font-bold">INV</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Selected Axis Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Parameters */}
        <div className="lg:col-span-7 space-y-4 bg-[#0a0d12] p-5 rounded-xl border border-[#1e2632] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e2632]">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">{axisNames[selectedAxis].label}</h3>
              <p className="text-xs text-slate-400 font-mono">{axisNames[selectedAxis].desc}</p>
            </div>
            {/* Invert Switch */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentAxis.inverted}
                onChange={(e) => onUpdateAxis(selectedAxis, { inverted: e.target.checked })}
                className="w-4 h-4 rounded bg-[#050608] border-[#1e2632] text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-amber-300 font-mono">INVERT AXIS</span>
            </label>
          </div>

          {/* Deadzone Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 font-mono">Center Deadzone (Noise Floor)</span>
              <span className="font-mono text-cyan-400 font-bold">{currentAxis.deadzone}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={currentAxis.deadzone}
              onChange={(e) => onUpdateAxis(selectedAxis, { deadzone: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-[#050608] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Ultra-sensitive)</span>
              <span>8% (Recommended for 6-Spring)</span>
              <span>35% (Stiff)</span>
            </div>
          </div>

          {/* Sensitivity Multiplier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 font-mono">Gain / Sensitivity Multiplier</span>
              <span className="font-mono text-cyan-400 font-bold">{currentAxis.sensitivity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.5"
              step="0.05"
              value={currentAxis.sensitivity}
              onChange={(e) => onUpdateAxis(selectedAxis, { sensitivity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#050608] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.2x (Micro precision)</span>
              <span>1.2x (Standard CAD)</span>
              <span>3.5x (Fast navigation)</span>
            </div>
          </div>

          {/* Curve Type Selector */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-semibold text-slate-300 font-mono">Response Profile Curve</span>
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
              {(['linear', 'exponential', 'quadratic', 's_curve'] as CurveType[]).map((cType) => (
                <button
                  key={cType}
                  onClick={() => onUpdateAxis(selectedAxis, { curve: cType })}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                    currentAxis.curve === cType
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 glow-cyan-sm'
                      : 'bg-[#050608] border-[#1e2632] text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cType === 'linear' && 'Linear'}
                  {cType === 'exponential' && 'Exponential'}
                  {cType === 'quadratic' && 'Quadratic'}
                  {cType === 's_curve' && 'Sigmoid S'}
                </button>
              ))}
            </div>
          </div>

          {/* Expo Power if Exponential */}
          {currentAxis.curve === 'exponential' && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 font-mono">Expo Power (Curvature Factor)</span>
                <span className="font-mono text-cyan-400 font-bold">{currentAxis.expoPower.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.1"
                max="3.5"
                step="0.1"
                value={currentAxis.expoPower}
                onChange={(e) => onUpdateAxis(selectedAxis, { expoPower: parseFloat(e.target.value) })}
                className="w-full h-2 bg-[#050608] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Right: SVG Response Curve Preview */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#06080c] p-5 rounded-xl border border-[#1e2632] shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>TRANSFER FUNCTION</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Spring Force → Output</span>
            </div>

            {/* SVG Graph Viewport */}
            <div className="relative w-full h-44 bg-[#0a0d12] rounded-lg border border-[#1e2632] p-2 overflow-hidden">
              {/* Deadzone visual zone */}
              <div
                className="absolute top-0 bottom-0 left-2 bg-red-950/30 border-r border-red-500/40 pointer-events-none"
                style={{ width: `${(currentAxis.deadzone / 100) * 100}%` }}
              />

              <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="200" y2="25" stroke="#1e2632" strokeDasharray="2,2" strokeWidth="0.8" />
                <line x1="0" y1="50" x2="200" y2="50" stroke="#1e2632" strokeDasharray="2,2" strokeWidth="0.8" />
                <line x1="0" y1="75" x2="200" y2="75" stroke="#1e2632" strokeDasharray="2,2" strokeWidth="0.8" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#1e2632" strokeDasharray="2,2" strokeWidth="0.8" />
                <line x1="100" y1="0" x2="100" y2="100" stroke="#1e2632" strokeDasharray="2,2" strokeWidth="0.8" />
                <line x1="150" y1="0" x2="150" y2="100" stroke="#1e2632" strokeDasharray="2,2" strokeWidth="0.8" />

                {/* Linear Reference Ghost Line */}
                <line x1="0" y1="100" x2="200" y2="0" stroke="#334155" strokeDasharray="3,3" strokeWidth="1" />

                {/* Active Dynamic Curve */}
                <path
                  d={generateCurvePath(currentAxis.deadzone, currentAxis.curve, currentAxis.expoPower)}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
              <span>0% Deflection</span>
              <span>100% Full Stroke</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e2632] text-xs text-slate-400 space-y-1">
            <div className="text-cyan-300 font-mono font-semibold text-[11px]">TRIANGULAR FLEXURE NOTE:</div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              The 3 pairs of compression/tension springs provide natural physical centering. Using Sigmoid S or Quadratic curves delivers micro-millimeter precision near rest while allowing full-speed pan/orbit at deflection extremes.
            </p>
          </div>
        </div>
      </div>

      {/* Global Filtering & Smoothing Settings */}
      <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>GLOBAL HARDWARE FILTERING & KINEMATICS</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EMA Filter Alpha */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 font-mono">Low-Pass EMA Filter Alpha (α)</span>
              <span className="font-mono text-purple-400 font-bold">{filters.smoothingAlpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.95"
              step="0.02"
              value={filters.smoothingAlpha}
              onChange={(e) => onUpdateFilters({ smoothingAlpha: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#050608] rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.08 (Ultra Smooth Glide)</span>
              <span>0.35 (CAD Balanced)</span>
              <span>0.95 (Raw Sensor ADC)</span>
            </div>
          </div>

          {/* Dominant Axis Toggle & Precision Multiplier */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.dominantAxisOnly}
                onChange={(e) => onUpdateFilters({ dominantAxisOnly: e.target.checked })}
                className="w-4 h-4 rounded bg-[#050608] border-[#1e2632] text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-300 font-mono">
                Dominant Axis Only Mode (Suppresses accidental secondary axis cross-talk)
              </span>
            </label>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-mono">Precision Multiplier (Shift key modifier)</span>
              <span className="font-mono text-cyan-400 font-bold">{(filters.precisionMultiplier * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
