import React, { useState, useEffect, useRef } from 'react';
import { LedRingConfig, IdleAnimationType, ActiveAnimationType, SixDofState } from '../types';
import {
  Sun,
  Sparkles,
  RotateCw,
  Palette,
  Activity,
  Zap,
  Flame,
  CheckCircle,
  Eye,
  Sliders,
  BatteryCharging,
  Layers,
  Compass,
  Repeat,
} from 'lucide-react';

interface LedRingCustomizerTabProps {
  config: LedRingConfig;
  onChangeConfig: (config: LedRingConfig) => void;
  sixDofState?: SixDofState;
}

const PRESET_COLOR_PALETTES = [
  { name: 'OOFO Cyan', primary: '#00e5ff', secondary: '#0055ff', accent: '#ffffff' },
  { name: 'Fusion Ember', primary: '#ff7700', secondary: '#ff0055', accent: '#ffea00' },
  { name: 'Blender Orange', primary: '#e87d0d', secondary: '#00a3ff', accent: '#ffffff' },
  { name: 'Emerald CAD', primary: '#10b981', secondary: '#06b6d4', accent: '#a7f3d0' },
  { name: 'Pure Violet', primary: '#a855f7', secondary: '#ec4899', accent: '#ffffff' },
  { name: 'Stealth White', primary: '#e2e8f0', secondary: '#475569', accent: '#38bdf8' },
];

const IDLE_ANIMATION_OPTIONS: Array<{ id: IdleAnimationType; label: string; desc: string }> = [
  { id: 'breathing', label: 'Breathing Pulse', desc: 'Sinusoidal ambient color breath' },
  { id: 'spinning', label: 'Radar Sweep', desc: 'Rotating directional halo sweep' },
  { id: 'rainbow_cycle', label: 'Rainbow Flow', desc: 'Full-spectrum RGB color evolution' },
  { id: 'two_halves_bouncing', label: 'Dual Orbit', desc: 'Two symmetric light pulses meeting at poles' },
  { id: 'sweeping', label: 'Clockwise Chase', desc: 'Smooth trailing particle ring' },
  { id: 'static_solid', label: 'Solid Glow', desc: 'Steady single or dual-tone illumination' },
];

const ACTIVE_ANIMATION_OPTIONS: Array<{ id: ActiveAnimationType; label: string; desc: string }> = [
  { id: 'rotational_twist_swirl', label: 'Kinematic Swirl', desc: 'Spins ring dynamically with 6-DOF deflection' },
  { id: 'deflection_brightness', label: 'Force Brightness', desc: 'Glows brighter when pushing or pulling knob' },
  { id: 'axis_angle_spectrum', label: 'Tilt Spectrum', desc: 'Shifts color hue dynamically based on tilt angle' },
  { id: 'velocity_pulse', label: 'Velocity Ripple', desc: 'Smooth acceleration-driven ripples' },
  { id: 'match_idle', label: 'Match Idle', desc: 'Maintains undisturbed ambient glow' },
];

export const LedRingCustomizerTab: React.FC<LedRingCustomizerTabProps> = ({
  config,
  onChangeConfig,
  sixDofState,
}) => {
  const [previewMode, setPreviewMode] = useState<'idle' | 'active' | 'battery_gauge' | 'profile_spin'>('idle');
  const [selectedLedIndex, setSelectedLedIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(performance.now());

  const ledRing: LedRingConfig = {
    brightness: config.brightness ?? 65,
    primaryColor: config.primaryColor || '#00e5ff',
    secondaryColor: config.secondaryColor || '#0055ff',
    accentColor: config.accentColor || '#ffffff',
    idleAnimation: config.idleAnimation || 'breathing',
    idleSpeed: config.idleSpeed ?? 5,
    activeAnimation: config.activeAnimation || 'rotational_twist_swirl',
    activeSpeed: config.activeSpeed ?? 5,
    individualLeds: config.individualLeds || Array(24).fill(config.primaryColor || '#00e5ff'),
    ledCount: 24,
    rotationOffsetDeg: config.rotationOffsetDeg ?? 0,
    rotationLedOffset: config.rotationLedOffset ?? 0,
  };

  const currentLedOffset = ledRing.rotationLedOffset || 0;

  const handleUpdate = (updated: Partial<LedRingConfig>) => {
    onChangeConfig({ ...ledRing, ...updated });
  };

  // Helper to convert rotation angle to LED offset
  const handleAngleChange = (deg: number) => {
    const normalizedDeg = ((deg % 360) + 360) % 360;
    const ledOffset = Math.round(normalizedDeg / 15) % 24;
    handleUpdate({
      rotationOffsetDeg: normalizedDeg,
      rotationLedOffset: ledOffset,
    });
  };

  const handleLedOffsetChange = (leds: number) => {
    const normalizedLeds = ((leds % 24) + 24) % 24;
    const deg = normalizedLeds * 15;
    handleUpdate({
      rotationOffsetDeg: deg,
      rotationLedOffset: normalizedLeds,
    });
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split('').map((c) => c + c).join('') : cleanHex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const lerpColor = (c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] => {
    const clampedT = Math.max(0, Math.min(1, t));
    return [
      c1[0] + (c2[0] - c1[0]) * clampedT,
      c1[1] + (c2[1] - c1[1]) * clampedT,
      c1[2] + (c2[2] - c1[2]) * clampedT,
    ];
  };

  // Canvas visual rendering with software angle rotation and wide speed curves (slow crawl to blur fast)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = (now: number) => {
      const elapsedSec = (now - startTimeRef.current) / 1000;
      const numLeds = 24;
      const pRgb = hexToRgb(ledRing.primaryColor);
      const sRgb = hexToRgb(ledRing.secondaryColor);
      const masterBrightness = ledRing.brightness / 100;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      // Position center with ample top margin so 12 o'clock label is NEVER cut off
      const centerY = height / 2 + 18;
      const radius = 95;

      ctx.clearRect(0, 0, width, height);

      // Draw background ring PCB track
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#141822';
      ctx.lineWidth = 26;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#232b3c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top North marker on the housing (12 o'clock front of OOFO One)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius - 16);
      ctx.lineTo(centerX - 6, centerY - radius - 26);
      ctx.lineTo(centerX + 6, centerY - radius - 26);
      ctx.closePath();
      ctx.fillStyle = '#00e5ff';
      ctx.fill();

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('12 O\'CLOCK (FRONT)', centerX, centerY - radius - 32);

      // Compute colors for each LED with rotation offset applied
      const rotShift = currentLedOffset;

      // Speed mapping: Level 1 = 0.02 (crawl), Level 5 = 1.5 (moderate), Level 10 = 16.0 (blur fast!)
      const speedSlider = ledRing.idleSpeed;
      const speedCurve = 0.02 + Math.pow((speedSlider - 1) / 9, 2.5) * 16.0;

      for (let i = 0; i < numLeds; i++) {
        // Apply software rotation: physical LED i corresponds to logical rotated index
        const logicalIndex = (i - rotShift + numLeds) % numLeds;
        const ledAngleRad = ((i * 360) / numLeds - 90) * (Math.PI / 180);

        const x = centerX + radius * Math.cos(ledAngleRad);
        const y = centerY + radius * Math.sin(ledAngleRad);

        let rgb: [number, number, number] = pRgb;

        if (previewMode === 'profile_spin') {
          // Profile switch visual feedback: 3 fast spins in profile primary color
          const spinProgress = (elapsedSec * 2.5) % 1;
          const head = spinProgress * numLeds;
          const dist = (logicalIndex - head + numLeds) % numLeds;
          const trail = Math.max(0, 1 - dist / 8);
          rgb = lerpColor([15, 23, 42], pRgb, trail);
        } else if (previewMode === 'battery_gauge') {
          // Battery gauge preview: 18/24 LEDs lit (75% battery), green zone
          // Starts from logical index 0 (12 o'clock) respecting the rotation offset
          const simulatedLedsLit = 18;
          const isLit = logicalIndex < simulatedLedsLit;
          rgb = isLit ? [16, 185, 129] : [30, 41, 59]; // Emerald vs Dark
        } else if (previewMode === 'idle') {
          switch (ledRing.idleAnimation) {
            case 'breathing': {
              const phase = elapsedSec * speedCurve;
              const b = (Math.sin(phase) + 1) / 2;
              rgb = lerpColor(pRgb, sRgb, b);
              break;
            }
            case 'spinning': {
              const pos = ((logicalIndex / numLeds + elapsedSec * (speedCurve * 0.2)) % 1 + 1) % 1;
              rgb = lerpColor(pRgb, sRgb, pos);
              break;
            }
            case 'rainbow_cycle': {
              const hue = (((logicalIndex / numLeds + elapsedSec * (speedCurve * 0.15)) % 1 + 1) % 1) * 360;
              const hPrime = hue / 60;
              const c = 1, xH = 1 - Math.abs((hPrime % 2) - 1);
              let r = 0, g = 0, b = 0;
              if (hPrime >= 0 && hPrime < 1) { r = c; g = xH; }
              else if (hPrime < 2) { r = xH; g = c; }
              else if (hPrime < 3) { g = c; b = xH; }
              else if (hPrime < 4) { g = xH; b = c; }
              else if (hPrime < 5) { r = xH; b = c; }
              else { r = c; b = xH; }
              rgb = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
              break;
            }
            case 'two_halves_bouncing': {
              const t = (Math.sin(elapsedSec * (speedCurve * 0.3)) + 1) / 2;
              const dist = Math.abs(logicalIndex - 12) / 12;
              const factor = (Math.sin((dist + t) * Math.PI) + 1) / 2;
              rgb = lerpColor(pRgb, sRgb, factor);
              break;
            }
            case 'sweeping': {
              const head = (((elapsedSec * (speedCurve * 0.25)) % 1 + 1) % 1) * numLeds;
              const diff = ((logicalIndex - head + numLeds) % numLeds) / numLeds;
              rgb = lerpColor(pRgb, sRgb, diff);
              break;
            }
            case 'static_solid':
            default:
              rgb = pRgb;
              break;
          }
        } else {
          // Active preview mode
          const state = sixDofState || { x: 0.4, y: 0.2, z: 0.1, rx: 0, ry: 0, rz: 0.5, rawAdc: [], buttonsPressed: [], timestamp: 0 };
          const deflection = Math.sqrt((state.x || 0) ** 2 + (state.y || 0) ** 2 + (state.z || 0) ** 2);
          const activeSpeedVal = 0.04 + Math.pow((ledRing.activeSpeed - 1) / 9, 2.5) * 10.0;

          switch (ledRing.activeAnimation) {
            case 'rotational_twist_swirl': {
              const spin = ((logicalIndex / numLeds + elapsedSec * activeSpeedVal + (state.rz || 0) * 0.4) % 1 + 1) % 1;
              rgb = lerpColor(pRgb, sRgb, spin);
              break;
            }
            case 'deflection_brightness': {
              const boost = Math.min(1, deflection * 1.5);
              rgb = lerpColor(pRgb, [255, 255, 255], boost);
              break;
            }
            case 'axis_angle_spectrum': {
              const angle = Math.atan2(state.y || 0, state.x || 0);
              const normAngle = ((angle / (Math.PI * 2) + 0.5) % 1 + 1) % 1;
              rgb = lerpColor(pRgb, sRgb, normAngle);
              break;
            }
            default:
              rgb = pRgb;
              break;
          }
        }

        // Apply Master Brightness
        const rFin = Math.round(rgb[0] * masterBrightness);
        const gFin = Math.round(rgb[1] * masterBrightness);
        const bFin = Math.round(rgb[2] * masterBrightness);

        // Draw LED Glow Halo
        const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 14);
        glowGrad.addColorStop(0, `rgba(${rFin}, ${gFin}, ${bFin}, 0.8)`);
        glowGrad.addColorStop(1, `rgba(${rFin}, ${gFin}, ${bFin}, 0)`);
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Draw LED Core Die
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${rFin}, ${gFin}, ${bFin})`;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = i === rotShift ? 1.5 : 0.5; // Highlight physical LED 0
        ctx.stroke();

        // Physical LED 0 marker (badge)
        if (i === 0) {
          ctx.beginPath();
          ctx.arc(x, y, 7.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff0055';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Center Hub with Current Profile Status
      ctx.beginPath();
      ctx.arc(centerX, centerY, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#0c0e14';
      ctx.fill();
      ctx.strokeStyle = '#232b3c';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('24-LED RING', centerX, centerY - 8);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`ROT: ${ledRing.rotationOffsetDeg}° (LED ${currentLedOffset})`, centerX, centerY + 8);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [ledRing, previewMode, sixDofState, currentLedOffset]);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="p-5 rounded-2xl bg-[#141822] border border-[#232b3c] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              24-NeoPixel LED Ring Studio & Orientation Alignment
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Software-rotate the LED ring so LED 1 aligns with your physical housing mount, tune color schemes, and calibrate speeds from slow crawl to blur.
          </p>
        </div>

        {/* Live Preview Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#0c0e14] border border-[#232b3c] gap-1">
          <button
            onClick={() => setPreviewMode('idle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              previewMode === 'idle'
                ? 'bg-cyan-500 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ambient Idle</span>
          </button>
          <button
            onClick={() => setPreviewMode('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              previewMode === 'active'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Active 6-DOF</span>
          </button>
          <button
            onClick={() => setPreviewMode('profile_spin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              previewMode === 'profile_spin'
                ? 'bg-purple-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Profile Spin</span>
          </button>
          <button
            onClick={() => setPreviewMode('battery_gauge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              previewMode === 'battery_gauge'
                ? 'bg-emerald-500 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>Battery Fuel Gauge</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-LED Ring Visual Simulator & Software Rotation (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#141822] border border-[#232b3c] flex flex-col items-center justify-center space-y-5">
            {/* Canvas Simulator with Generous Top Padding to prevent any cut off */}
            <div className="relative w-full aspect-square max-w-[340px] bg-[#0c0e14] rounded-2xl border border-[#232b3c] p-2 flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={340}
                height={340}
                className="w-full h-full block"
              />
            </div>

            {/* Software Rotation Offset Controls */}
            <div className="w-full p-4 rounded-xl bg-[#0c0e14] border border-[#232b3c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Mounting Rotation Alignment</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {ledRing.rotationOffsetDeg}° (LED {currentLedOffset})
                </span>
              </div>

              {/* Angle Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Rotate LED 1 to match front</span>
                  <span className="font-mono">{ledRing.rotationOffsetDeg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="345"
                  step="15"
                  value={ledRing.rotationOffsetDeg}
                  onChange={(e) => handleAngleChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-[#141822] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Quick Rotation Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => handleAngleChange(deg)}
                    className={`py-1 rounded-lg text-xs font-mono font-semibold transition ${
                      ledRing.rotationOffsetDeg === deg
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-[#141822] text-slate-400 hover:text-white border border-[#232b3c]'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lighting Customization Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#141822] border border-[#232b3c] space-y-5">
            {/* Color Palette Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Color Theme Presets</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_COLOR_PALETTES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleUpdate({
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                        accentColor: preset.accent,
                      });
                    }}
                    className="p-2.5 rounded-xl bg-[#0c0e14] border border-[#232b3c] hover:border-slate-600 text-left transition flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block group-hover:text-cyan-400 transition">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#232b3c]">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Primary Color (Idle & Profile)</label>
                <div className="flex items-center gap-2 bg-[#0c0e14] p-2 rounded-xl border border-[#232b3c]">
                  <input
                    type="color"
                    value={ledRing.primaryColor}
                    onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={ledRing.primaryColor}
                    onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                    className="bg-transparent text-xs font-mono text-white focus:outline-none uppercase w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Secondary Accent Color</label>
                <div className="flex items-center gap-2 bg-[#0c0e14] p-2 rounded-xl border border-[#232b3c]">
                  <input
                    type="color"
                    value={ledRing.secondaryColor}
                    onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={ledRing.secondaryColor}
                    onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                    className="bg-transparent text-xs font-mono text-white focus:outline-none uppercase w-full"
                  />
                </div>
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-2 pt-2 border-t border-[#232b3c]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Master Ring Brightness</span>
                <span className="font-mono font-bold text-cyan-400">{ledRing.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={ledRing.brightness}
                onChange={(e) => handleUpdate({ brightness: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Animation Speed Slider (Wide Dynamic Range: crawl to blur!) */}
            <div className="space-y-2 pt-2 border-t border-[#232b3c]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Animation Speed (Crawl to Blur Fast)</span>
                <span className="font-mono font-bold text-purple-400">Level {ledRing.idleSpeed}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={ledRing.idleSpeed}
                onChange={(e) => handleUpdate({ idleSpeed: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-[#0c0e14] rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Serene Crawl)</span>
                <span>5 (Standard)</span>
                <span>10 (Blur Fast)</span>
              </div>
            </div>

            {/* Idle Animation Pattern Selector */}
            <div className="space-y-2 pt-2 border-t border-[#232b3c]">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Idle Ambient Animation Pattern
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {IDLE_ANIMATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleUpdate({ idleAnimation: opt.id })}
                    className={`p-3 rounded-xl border text-left transition ${
                      ledRing.idleAnimation === opt.id
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-sm'
                        : 'bg-[#0c0e14] border-[#232b3c] hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
