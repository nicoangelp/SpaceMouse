import React, { useState } from 'react';
import { SixDofAxesConfig, GlobalFilterConfig, AxisParameters, CurveType, AxisOutputMode } from '../types';
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
  Flame,
  Volume2,
  VolumeX,
  Volume1,
  SkipForward,
  SkipBack,
  Keyboard,
  Settings2,
  Gauge,
  Check,
} from 'lucide-react';

interface AxisTuningTabProps {
  axes: SixDofAxesConfig;
  filters: GlobalFilterConfig;
  onUpdateAxis: (axisKey: keyof SixDofAxesConfig, params: Partial<AxisParameters>) => void;
  onUpdateFilters: (filters: Partial<GlobalFilterConfig>) => void;
  onSyncToEsp32: () => void;
  isConnected: boolean;
}

export const AxisTuningTab: React.FC<AxisTuningTabProps> = ({
  axes,
  filters,
  onUpdateAxis,
  onUpdateFilters,
  onSyncToEsp32,
  isConnected,
}) => {
  const [selectedAxis, setSelectedAxis] = useState<keyof SixDofAxesConfig>('x');
  const [tuningMode, setTuningMode] = useState<'kinematics' | 'remapping'>('kinematics');
  const [syncedRecently, setSyncedRecently] = useState(false);
  const [appliedPresetMsg, setAppliedPresetMsg] = useState<string | null>(null);

  const currentAxis = axes[selectedAxis] || {
    deadzone: 8,
    sensitivity: 1.2,
    inverted: false,
    curve: 'quadratic' as CurveType,
    expoPower: 2.0,
    minRaw: 800,
    maxRaw: 3200,
    centerRaw: 2048,
    outputMode: 'cad_6dof' as AxisOutputMode,
  };

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

  const handleApplyOptimalPreset = () => {
    onUpdateAxis('x', { deadzone: 8, sensitivity: 1.25, curve: 'quadratic', expoPower: 2.0 });
    onUpdateAxis('y', { deadzone: 8, sensitivity: 1.25, curve: 'quadratic', expoPower: 2.0 });
    onUpdateAxis('z', { deadzone: 10, sensitivity: 1.6, curve: 'quadratic', expoPower: 2.2 });
    onUpdateAxis('rx', { deadzone: 8, sensitivity: 1.05, curve: 's_curve', expoPower: 1.8 });
    onUpdateAxis('ry', { deadzone: 8, sensitivity: 1.05, curve: 's_curve', expoPower: 1.8 });
    onUpdateAxis('rz', { deadzone: 9, sensitivity: 1.15, curve: 's_curve', expoPower: 1.8 });

    onUpdateFilters({
      smoothingAlpha: 0.35,
      jitterThreshold: 3,
      dominantAxisOnly: false,
      precisionMultiplier: 0.28,
    });

    setAppliedPresetMsg('Kinematics Curves and Deadzones Optimized!');
    setTimeout(() => setAppliedPresetMsg(null), 3000);
  };

  // Generate SVG curve points
  const generateCurvePath = (dz: number, curve: CurveType, expo: number) => {
    const points: string[] = [];
    const deadzoneNorm = dz / 100;

    for (let i = 0; i <= 50; i++) {
      const input = i / 50;
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

      const svgX = input * 200;
      const svgY = 100 - output * 100;
      points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
    }

    return `M ${points.join(' L ')}`;
  };

  const AXIS_OUTPUT_MODES: Array<{ id: AxisOutputMode; label: string; desc: string; icon: any }> = [
    { id: 'cad_6dof', label: '3D 6-DOF CAD Navigation', desc: 'Standard 3D SpaceMouse Pan, Zoom, Orbit & Tilt', icon: Compass },
    { id: 'media_volume', label: 'Audio Volume Control', desc: '+Deflection: Volume Up / -Deflection: Volume Down', icon: Volume2 },
    { id: 'media_track', label: 'Media Track Skipping', desc: '+Deflection: Next Track / -Deflection: Prev Track', icon: SkipForward },
    { id: 'mouse_scroll', label: 'Mouse Scroll Wheel', desc: '+Deflection: Scroll Up / -Deflection: Scroll Down', icon: ArrowUpDown },
    { id: 'keystroke_repeat', label: 'Deflection Keystroke Repeater', desc: 'Continuous hotkey pulses (e.g. Zoom Ctrl+/Ctrl-, Left/Right scrub)', icon: Keyboard },
    { id: 'custom_hotkey_bidirectional', label: 'Bidirectional Custom Hotkeys', desc: 'Positive = Combo A, Negative = Combo B', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="p-5 rounded-2xl bg-[#141822] border border-[#232b3c] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              6-DOF Kinematics & Universal Joystick Mapping
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure response curves, deadzones, and freely remap any 6-DOF axis to volume twist, track skipping, scrolling, or custom hotkeys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-mode toggle: Kinematics vs Remapping */}
          <div className="flex items-center p-1 rounded-xl bg-[#0c0e14] border border-[#232b3c] gap-1">
            <button
              onClick={() => setTuningMode('kinematics')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tuningMode === 'kinematics'
                  ? 'bg-cyan-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Response Curves</span>
            </button>
            <button
              onClick={() => setTuningMode('remapping')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tuningMode === 'remapping'
                  ? 'bg-purple-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Axis Output Remap</span>
            </button>
          </div>

          <button
            onClick={handleApplyOptimalPreset}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optimal Curves</span>
          </button>

          <button
            onClick={handleSyncClick}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              syncedRecently
                ? 'bg-emerald-500 text-black'
                : !isConnected
                ? 'bg-[#0c0e14] text-slate-500 border border-[#232b3c]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black'
            }`}
          >
            {syncedRecently ? <CheckCircle className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
            <span>{syncedRecently ? 'Burned to Flash!' : 'Burn to NVS'}</span>
          </button>
        </div>
      </div>

      {appliedPresetMsg && (
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 text-xs font-semibold text-purple-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-400" />
          <span>{appliedPresetMsg}</span>
        </div>
      )}

      {/* Axis Selector Bar (X, Y, Z, Rx, Ry, Rz) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(['x', 'y', 'z', 'rx', 'ry', 'rz'] as Array<keyof SixDofAxesConfig>).map((key) => {
          const ax = axes[key] || { outputMode: 'cad_6dof', sensitivity: 1.0, deadzone: 8 };
          const isSelected = selectedAxis === key;
          const info = axisNames[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedAxis(key)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-[#1a202c] border-cyan-500 shadow-md shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-[#141822] border-[#232b3c] hover:border-slate-600 hover:bg-[#181d2a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase font-mono ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                  Axis {key.toUpperCase()}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0c0e14] border border-[#232b3c] text-slate-400 font-mono">
                  {ax.outputMode === 'cad_6dof' ? `${ax.sensitivity}x` : ax.outputMode?.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold block mt-1 truncate">
                {info.label.split('-')[1]?.trim() || info.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Mode View */}
      {tuningMode === 'kinematics' ? (
        /* KINEMATICS & RESPONSE CURVE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Curve Visualizer (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-[#141822] border border-[#232b3c] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Response Curve Profile</span>
                  <span className="text-[11px] text-slate-400 font-mono">Deflection Input vs Output Velocity</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {currentAxis.curve} (expo {currentAxis.expoPower?.toFixed(1) || '2.0'})
                </span>
              </div>

              {/* SVG Response Curve Canvas */}
              <div className="relative w-full aspect-[2/1] bg-[#0c0e14] rounded-xl border border-[#232b3c] p-3 flex items-center justify-center overflow-hidden">
                {/* Deadzone visual zone */}
                <div
                  className="absolute left-3 top-3 bottom-3 bg-rose-500/10 border-r border-rose-500/40 transition-all pointer-events-none"
                  style={{ width: `${(currentAxis.deadzone / 100) * 85}%` }}
                >
                  <span className="absolute bottom-1 left-1 text-[9px] text-rose-400 font-mono font-bold">
                    DZ: {currentAxis.deadzone}%
                  </span>
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="200" y2="25" stroke="#1c2333" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="200" y2="50" stroke="#1c2333" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="200" y2="75" stroke="#1c2333" strokeDasharray="3 3" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#1c2333" strokeDasharray="3 3" />
                  <line x1="100" y1="0" x2="100" y2="100" stroke="#1c2333" strokeDasharray="3 3" />
                  <line x1="150" y1="0" x2="150" y2="100" stroke="#1c2333" strokeDasharray="3 3" />

                  {/* Dynamic Curve */}
                  <path
                    d={generateCurvePath(currentAxis.deadzone, currentAxis.curve, currentAxis.expoPower || 2.0)}
                    fill="none"
                    stroke="#00e5ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Curve Selection Chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {(['linear', 'quadratic', 'exponential', 's_curve'] as CurveType[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateAxis(selectedAxis, { curve: c })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition ${
                      currentAxis.curve === c
                        ? 'bg-cyan-500 text-black font-bold shadow-sm'
                        : 'bg-[#0c0e14] text-slate-400 hover:text-white border border-[#232b3c]'
                    }`}
                  >
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Fine-Tuning Sliders & Low Pass Filter (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-[#141822] border border-[#232b3c] space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Parameters for {axisNames[selectedAxis].label}
                </span>
                <button
                  onClick={() => onUpdateAxis(selectedAxis, { inverted: !currentAxis.inverted })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    currentAxis.inverted
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-[#0c0e14] border border-[#232b3c] text-slate-400 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{currentAxis.inverted ? 'Inverted (Reverse)' : 'Normal Direction'}</span>
                </button>
              </div>

              {/* Sensitivity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Sensitivity Multiplier</span>
                  <span className="font-mono font-bold text-cyan-400">{currentAxis.sensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={currentAxis.sensitivity}
                  onChange={(e) => onUpdateAxis(selectedAxis, { sensitivity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Deadzone Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Neutral Sensor Deadzone</span>
                  <span className="font-mono font-bold text-rose-400">{currentAxis.deadzone}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={currentAxis.deadzone}
                  onChange={(e) => onUpdateAxis(selectedAxis, { deadzone: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-rose-400"
                />
              </div>

              {/* Exponential Power Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Exponential Curvature Factor (Gamma)</span>
                  <span className="font-mono font-bold text-purple-400">{(currentAxis.expoPower || 2.0).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={currentAxis.expoPower || 2.0}
                  onChange={(e) => onUpdateAxis(selectedAxis, { expoPower: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              {/* Global Smoothing Alpha */}
              <div className="pt-2 border-t border-[#232b3c] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Global Low-Pass Smoothing Alpha</span>
                  <span className="font-mono font-bold text-emerald-400">{filters.smoothingAlpha.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.02"
                  value={filters.smoothingAlpha}
                  onChange={(e) => onUpdateFilters({ smoothingAlpha: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* UNIVERSAL JOYSTICK & AXIS REMAPPING VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Mode Selection (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl bg-[#141822] border border-[#232b3c] space-y-3">
              <span className="text-xs font-bold text-white block">
                Select Output Function for Axis {selectedAxis.toUpperCase()}
              </span>
              
              <div className="space-y-2">
                {AXIS_OUTPUT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = (currentAxis.outputMode || 'cad_6dof') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onUpdateAxis(selectedAxis, { outputMode: mode.id })}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 shadow-sm'
                          : 'bg-[#0c0e14] border-[#232b3c] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-purple-500 text-white' : 'bg-[#141822] text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {mode.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{mode.desc}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Custom Hotkey / Rate Configuration (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-[#141822] border border-[#232b3c] space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  Mapping Configuration for Axis {selectedAxis.toUpperCase()} ({currentAxis.outputMode || 'cad_6dof'})
                </span>
                <p className="text-xs text-slate-400">
                  Deflecting the controller knob along this axis will trigger these configured actions.
                </p>
              </div>

              {currentAxis.outputMode === 'cad_6dof' && (
                <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#232b3c] text-xs text-slate-300 space-y-2">
                  <span className="font-bold text-cyan-400 block">Native 3D Navigation Mode Active</span>
                  <p>
                    Axis {selectedAxis.toUpperCase()} operates directly with CAD camera viewports (Fusion 360, Blender, SolidWorks, FreeCAD, Bambu Slicer).
                  </p>
                </div>
              )}

              {currentAxis.outputMode === 'media_volume' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#232b3c] space-y-2">
                    <span className="text-xs font-bold text-white block">Volume Knob Behavior:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#141822] border border-cyan-500/30">
                        <span className="text-[10px] text-cyan-400 font-bold block">+ Deflection (Right / Push)</span>
                        <span className="text-white font-bold">Volume Up</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#141822] border border-rose-500/30">
                        <span className="text-[10px] text-rose-400 font-bold block">- Deflection (Left / Pull)</span>
                        <span className="text-white font-bold">Volume Down</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentAxis.outputMode === 'media_track' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#232b3c] space-y-2">
                    <span className="text-xs font-bold text-white block">Track Skip Behavior:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#141822] border border-cyan-500/30">
                        <span className="text-[10px] text-cyan-400 font-bold block">+ Deflection</span>
                        <span className="text-white font-bold">Next Track (Skip)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#141822] border border-rose-500/30">
                        <span className="text-[10px] text-rose-400 font-bold block">- Deflection</span>
                        <span className="text-white font-bold">Previous Track</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(currentAxis.outputMode === 'keystroke_repeat' || currentAxis.outputMode === 'custom_hotkey_bidirectional') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-cyan-400">Positive (+) Action Name</label>
                      <input
                        type="text"
                        value={currentAxis.positiveActionName || 'Zoom In'}
                        onChange={(e) => onUpdateAxis(selectedAxis, { positiveActionName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0e14] border border-[#232b3c] text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-rose-400">Negative (-) Action Name</label>
                      <input
                        type="text"
                        value={currentAxis.negativeActionName || 'Zoom Out'}
                        onChange={(e) => onUpdateAxis(selectedAxis, { negativeActionName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0e14] border border-[#232b3c] text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Repeat Rate Slider */}
                  <div className="space-y-2 pt-2 border-t border-[#232b3c]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Repeat Trigger Rate</span>
                      <span className="font-mono font-bold text-purple-400">{currentAxis.repeatRateMs || 80} ms</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      step="10"
                      value={currentAxis.repeatRateMs || 80}
                      onChange={(e) => onUpdateAxis(selectedAxis, { repeatRateMs: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
