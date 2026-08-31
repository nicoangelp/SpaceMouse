import React, { useState, useEffect, useRef } from 'react';
import { LedRingConfig, IdleAnimationType, ActiveAnimationType, SixDofState } from '../types';
import {
  Sparkles,
  Sun,
  Palette,
  Zap,
  Play,
  Pause,
  RotateCw,
  Sliders,
  Paintbrush,
  Layers,
  Flame,
  Activity,
  CheckCircle,
  Copy,
  Radio,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface LedRingCustomizerTabProps {
  config?: LedRingConfig;
  ledRing?: LedRingConfig;
  onChangeConfig?: (config: LedRingConfig) => void;
  onChangeLedRing?: (config: LedRingConfig) => void;
  sixDofState: SixDofState;
}

const PRESET_PALETTES = [
  { name: 'Autodesk Orange', primary: '#ff8800', secondary: '#00e5ff', accent: '#ff3366' },
  { name: 'Blender Sky', primary: '#ea580c', secondary: '#38bdf8', accent: '#fbbf24' },
  { name: 'Cyberpunk Neon', primary: '#00ffcc', secondary: '#ff007f', accent: '#ffe600' },
  { name: 'Vaporwave Sunset', primary: '#ff71ce', secondary: '#01cdfe', accent: '#05ffa1' },
  { name: 'Matrix Emerald', primary: '#10b981', secondary: '#064e3b', accent: '#34d399' },
  { name: 'SolidWorks Red', primary: '#dc2626', secondary: '#0284c7', accent: '#f59e0b' },
  { name: 'Deep Space Blue', primary: '#3b82f6', secondary: '#8b5cf6', accent: '#06b6d4' },
  { name: 'Pure Minimalist', primary: '#f8fafc', secondary: '#64748b', accent: '#38bdf8' },
];

export const LedRingCustomizerTab: React.FC<LedRingCustomizerTabProps> = ({
  config,
  ledRing: propLedRing,
  onChangeConfig,
  onChangeLedRing: propOnChangeLedRing,
  sixDofState,
}) => {
  const ledRing: LedRingConfig = config || propLedRing || {
    brightness: 65,
    primaryColor: '#ff8800',
    secondaryColor: '#00e5ff',
    accentColor: '#ff007f',
    idleAnimation: 'breathing',
    idleSpeed: 5,
    activeAnimation: 'rotational_twist_swirl',
    activeSpeed: 6,
    individualLeds: Array(24).fill('#ff8800'),
    ledCount: 24,
  };

  const onChangeLedRing = (updatedConfig: LedRingConfig) => {
    if (onChangeConfig) onChangeConfig(updatedConfig);
    if (propOnChangeLedRing) propOnChangeLedRing(updatedConfig);
  };

  const [previewMode, setPreviewMode] = useState<'idle' | 'active'>('idle');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedBrushColor, setSelectedBrushColor] = useState<string>(ledRing?.primaryColor || '#ff8800');
  const [simulatedTwist, setSimulatedTwist] = useState<number>(0);
  const [simulatedForce, setSimulatedForce] = useState<number>(0.5);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [hoveredLedIndex, setHoveredLedIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  // Convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    if (isNaN(num)) return [0, 229, 255];
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return [r, g, b];
    }
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return (
      '#' +
      clamp(r).toString(16).padStart(2, '0') +
      clamp(g).toString(16).padStart(2, '0') +
      clamp(b).toString(16).padStart(2, '0')
    );
  };

  const lerpColor = (c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] => {
    const clampedT = Math.max(0, Math.min(1, t));
    return [
      c1[0] + (c2[0] - c1[0]) * clampedT,
      c1[1] + (c2[1] - c1[1]) * clampedT,
      c1[2] + (c2[2] - c1[2]) * clampedT,
    ];
  };

  // Helper to calculate estimated LED power draw in milliamps
  // 24 WS2812B / SK6812 LEDs draw ~50mA at 100% white each, scaled by brightness
  const estimatedLedMa = Math.round((ledRing.brightness / 100) * 24 * 35 * 0.7);

  // Animation calculation for 24 LEDs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = (now: number) => {
      if (!running) return;

      const elapsedSec = (now - startTimeRef.current) / 1000;
      const numLeds = ledRing.ledCount || 24;
      const pRgb = hexToRgb(ledRing.primaryColor);
      const sRgb = hexToRgb(ledRing.secondaryColor);
      const aRgb = hexToRgb(ledRing.accentColor);
      const masterBrightness = (ledRing.brightness / 100);

      // Compute color for each of the 24 LEDs
      const currentLedColors: Array<[number, number, number]> = [];

      // Determine active vs idle motion status
      const realOrSimTwist = previewMode === 'active' ? (sixDofState.rz !== 0 ? sixDofState.rz : simulatedTwist) : 0;
      const realOrSimForce = previewMode === 'active' ? (Math.sqrt(sixDofState.x ** 2 + sixDofState.y ** 2 + sixDofState.z ** 2) || simulatedForce) : 0;

      if (previewMode === 'idle') {
        const speed = ledRing.idleSpeed * 0.8;
        const phase = elapsedSec * speed;

        for (let i = 0; i < numLeds; i++) {
          const ledAngleRatio = i / numLeds; // 0 to 1

          switch (ledRing.idleAnimation) {
            case 'breathing': {
              // Smooth sinusoidal breath pulse
              const pulse = (Math.sin(phase * 2) + 1) / 2; // 0 to 1
              const col = lerpColor(sRgb, pRgb, pulse);
              currentLedColors.push([
                col[0] * masterBrightness * (0.3 + 0.7 * pulse),
                col[1] * masterBrightness * (0.3 + 0.7 * pulse),
                col[2] * masterBrightness * (0.3 + 0.7 * pulse),
              ]);
              break;
            }

            case 'spinning': {
              // Revolving comet with decaying tail
              const head = (phase * 2) % 1;
              let dist = (ledAngleRatio - head + 1) % 1;
              const intensity = Math.pow(1 - dist, 3.5);
              const col = lerpColor(sRgb, pRgb, intensity);
              currentLedColors.push([
                col[0] * masterBrightness * intensity,
                col[1] * masterBrightness * intensity,
                col[2] * masterBrightness * intensity,
              ]);
              break;
            }

            case 'two_halves_bouncing': {
              // Dual bouncing ping-pong pulses from top to bottom
              const bounce = (Math.sin(phase * 2.5) + 1) / 2; // 0 to 1
              const pos1 = bounce * 0.5; // 0 to 0.5
              const pos2 = 1 - bounce * 0.5; // 1 to 0.5
              const dist1 = Math.min(Math.abs(ledAngleRatio - pos1), 1 - Math.abs(ledAngleRatio - pos1));
              const dist2 = Math.min(Math.abs(ledAngleRatio - pos2), 1 - Math.abs(ledAngleRatio - pos2));
              const int1 = Math.max(0, 1 - dist1 * 5);
              const int2 = Math.max(0, 1 - dist2 * 5);
              const totalInt = Math.min(1, int1 + int2);
              const col = int1 > int2 ? pRgb : aRgb;
              currentLedColors.push([
                col[0] * masterBrightness * (0.15 + 0.85 * totalInt),
                col[1] * masterBrightness * (0.15 + 0.85 * totalInt),
                col[2] * masterBrightness * (0.15 + 0.85 * totalInt),
              ]);
              break;
            }

            case 'sweeping': {
              // Radar sweep
              const sweepPos = (phase * 1.5) % 1;
              let dist = (ledAngleRatio - sweepPos + 1) % 1;
              const intSweep = Math.pow(Math.max(0, 1 - dist), 2.2);
              const col = lerpColor(sRgb, pRgb, intSweep);
              currentLedColors.push([
                col[0] * masterBrightness * intSweep,
                col[1] * masterBrightness * intSweep,
                col[2] * masterBrightness * intSweep,
              ]);
              break;
            }

            case 'rainbow_cycle': {
              // 360 rainbow spectrum rotation
              const hue = ((ledAngleRatio + phase * 0.4) % 1) * 360;
              const rgb = hslToRgb(hue, 1, 0.5);
              currentLedColors.push([
                rgb[0] * masterBrightness,
                rgb[1] * masterBrightness,
                rgb[2] * masterBrightness,
              ]);
              break;
            }

            case 'comet_tail': {
              // Fast twin comets
              const head1 = (phase * 1.8) % 1;
              const head2 = (phase * 1.8 + 0.5) % 1;
              const dist1 = (ledAngleRatio - head1 + 1) % 1;
              const dist2 = (ledAngleRatio - head2 + 1) % 1;
              const int1 = Math.pow(1 - dist1, 4.0);
              const int2 = Math.pow(1 - dist2, 4.0);
              const col1 = lerpColor(sRgb, pRgb, int1);
              const col2 = lerpColor(sRgb, aRgb, int2);
              currentLedColors.push([
                (col1[0] * int1 + col2[0] * int2) * masterBrightness,
                (col1[1] * int1 + col2[1] * int2) * masterBrightness,
                (col1[2] * int1 + col2[2] * int2) * masterBrightness,
              ]);
              break;
            }

            case 'custom_per_led': {
              const hex = ledRing.individualLeds?.[i] || ledRing.primaryColor;
              const rgb = hexToRgb(hex);
              currentLedColors.push([
                rgb[0] * masterBrightness,
                rgb[1] * masterBrightness,
                rgb[2] * masterBrightness,
              ]);
              break;
            }

            case 'static_solid':
            default: {
              currentLedColors.push([
                pRgb[0] * masterBrightness,
                pRgb[1] * masterBrightness,
                pRgb[2] * masterBrightness,
              ]);
              break;
            }
          }
        }
      } else {
        // ACTIVE / IN-USE ANIMATION
        const speed = ledRing.activeSpeed * 1.2;
        const phase = elapsedSec * speed;

        for (let i = 0; i < numLeds; i++) {
          const ledAngleRatio = i / numLeds;
          const ledAngleRad = ledAngleRatio * Math.PI * 2;

          switch (ledRing.activeAnimation) {
            case 'rotational_twist_swirl': {
              // Rotates around the ring in direction and velocity of knob Yaw
              const rotationOffset = realOrSimTwist * 1.5 + phase * 0.3;
              const shiftedRatio = (ledAngleRatio - rotationOffset + 10) % 1;
              const pulse = (Math.sin(shiftedRatio * Math.PI * 4) + 1) / 2;
              const col = lerpColor(pRgb, aRgb, pulse);
              const boost = Math.min(1.5, 0.7 + Math.abs(realOrSimTwist) * 1.2);
              currentLedColors.push([
                Math.min(255, col[0] * masterBrightness * boost),
                Math.min(255, col[1] * masterBrightness * boost),
                Math.min(255, col[2] * masterBrightness * boost),
              ]);
              break;
            }

            case 'deflection_brightness': {
              // Flare focused in direction of 6-DOF tilt (X/Y) with intensity = total deflection force
              const forceAngle = Math.atan2(sixDofState.y || 0.1, sixDofState.x || 0.1);
              let angleDiff = Math.abs(ledAngleRad - forceAngle);
              if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
              const proximity = Math.max(0, 1 - angleDiff / Math.PI);
              const flare = Math.pow(proximity, 2.5) * (0.4 + 1.2 * realOrSimForce);
              const col = lerpColor(sRgb, pRgb, flare);
              currentLedColors.push([
                Math.min(255, col[0] * masterBrightness * (0.2 + 0.8 * flare)),
                Math.min(255, col[1] * masterBrightness * (0.2 + 0.8 * flare)),
                Math.min(255, col[2] * masterBrightness * (0.2 + 0.8 * flare)),
              ]);
              break;
            }

            case 'axis_angle_spectrum': {
              // HSL Hue shifts in real time mapped to 3D orientation
              const tiltMag = Math.sqrt((sixDofState.rx || 0) ** 2 + (sixDofState.ry || 0) ** 2);
              const hue = (((ledAngleRatio + tiltMag * 0.5 + phase * 0.2) % 1) * 360);
              const rgb = hslToRgb(hue, 1, 0.5);
              currentLedColors.push([
                rgb[0] * masterBrightness * (0.5 + 0.5 * realOrSimForce),
                rgb[1] * masterBrightness * (0.5 + 0.5 * realOrSimForce),
                rgb[2] * masterBrightness * (0.5 + 0.5 * realOrSimForce),
              ]);
              break;
            }

            case 'velocity_pulse': {
              const strobe = (Math.sin(phase * 8) + 1) / 2;
              const col = strobe > 0.5 ? aRgb : pRgb;
              currentLedColors.push([
                col[0] * masterBrightness * (0.4 + 0.6 * strobe),
                col[1] * masterBrightness * (0.4 + 0.6 * strobe),
                col[2] * masterBrightness * (0.4 + 0.6 * strobe),
              ]);
              break;
            }

            case 'orbit_chase': {
              const head = (phase * (1 + realOrSimForce * 3)) % 1;
              const dist = (ledAngleRatio - head + 1) % 1;
              const intOrbit = Math.pow(1 - dist, 4.0);
              const col = lerpColor(sRgb, pRgb, intOrbit);
              currentLedColors.push([
                col[0] * masterBrightness * (0.2 + 0.8 * intOrbit),
                col[1] * masterBrightness * (0.2 + 0.8 * intOrbit),
                col[2] * masterBrightness * (0.2 + 0.8 * intOrbit),
              ]);
              break;
            }

            case 'match_idle':
            default: {
              const pulse = (Math.sin(phase * 3) + 1) / 2;
              const col = lerpColor(sRgb, pRgb, pulse);
              currentLedColors.push([
                col[0] * masterBrightness,
                col[1] * masterBrightness,
                col[2] * masterBrightness,
              ]);
              break;
            }
          }
        }
      }

      // Draw onto Canvas
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw outer SpaceMouse metallic ring shadow & bevel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 22, 0, Math.PI * 2);
      ctx.fillStyle = '#06080c';
      ctx.fill();
      ctx.strokeStyle = '#1e2632';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Outer glow diffused under desk
      const glowGrad = ctx.createRadialGradient(centerX, centerY, radius - 15, centerX, centerY, radius + 35);
      glowGrad.addColorStop(0, `rgba(${Math.round(pRgb[0])}, ${Math.round(pRgb[1])}, ${Math.round(pRgb[2])}, ${masterBrightness * 0.45})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 35, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // 2. Draw black center pedestal
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 22, 0, Math.PI * 2);
      ctx.fillStyle = '#090d14';
      ctx.fill();
      ctx.strokeStyle = '#151d2a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center logo / knob top
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.48, 0, Math.PI * 2);
      ctx.fillStyle = '#0e141f';
      ctx.fill();
      ctx.strokeStyle = '#00e5ff33';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center indicator text
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`24x NEOPIXEL`, centerX, centerY - 6);
      ctx.fillStyle = previewMode === 'active' ? '#00e5ff' : '#a855f7';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(previewMode === 'active' ? '● IN-USE ACTIVE' : '○ IDLE ANIMATION', centerX, centerY + 8);

      // 3. Draw each of the 24 individual NeoPixel LEDs
      for (let i = 0; i < numLeds; i++) {
        const angle = (i / numLeds) * Math.PI * 2 - Math.PI / 2; // Start from 12 o'clock top
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const [r, g, b] = currentLedColors[i] || [0, 0, 0];
        const hex = rgbToHex(r, g, b);
        const isHovered = hoveredLedIndex === i;

        // Individual LED diffused glow
        const ledGlow = ctx.createRadialGradient(x, y, 1, x, y, isHovered ? 18 : 12);
        ledGlow.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0.9)`);
        ledGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 18 : 12, 0, Math.PI * 2);
        ctx.fillStyle = ledGlow;
        ctx.fill();

        // LED Diode package
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 7.5 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = hex;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#ffffff' : '#050608';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // LED index number near perimeter
        if (numLeds <= 24) {
          const numX = centerX + Math.cos(angle) * (radius + 14);
          const numY = centerY + Math.sin(angle) * (radius + 14);
          ctx.fillStyle = isHovered ? '#38bdf8' : '#475569';
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i}`, numX, numY);
        }
      }

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ledRing, previewMode, isPlaying, simulatedTwist, simulatedForce, hoveredLedIndex, sixDofState]);

  // Helper for HSL to RGB
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = h / 360;
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // Handle clicking on an LED in the circular list to paint it
  const handlePaintLed = (index: number) => {
    const updated = [...(ledRing.individualLeds || Array(24).fill(ledRing.primaryColor))];
    updated[index] = selectedBrushColor;
    onChangeLedRing({
      ...ledRing,
      idleAnimation: 'custom_per_led',
      individualLeds: updated,
    });
  };

  const handleFillAllLeds = (color: string) => {
    onChangeLedRing({
      ...ledRing,
      idleAnimation: 'custom_per_led',
      individualLeds: Array(24).fill(color),
    });
  };

  const handleApplyPalette = (palette: typeof PRESET_PALETTES[0]) => {
    onChangeLedRing({
      ...ledRing,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      individualLeds: Array.from({ length: 24 }, (_, i) => {
        if (i < 8) return palette.primary;
        if (i < 16) return palette.secondary;
        return palette.accent;
      }),
    });
    setSelectedBrushColor(palette.primary);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-[#080b10] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center text-cyan-300">
              <Palette className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">Adafruit 24 NeoPixel Ring Studio</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 font-mono font-semibold">
                GPIO 15 · WS2812B / SK6812
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Dual-state behavior: distinct animations for <strong>In-Use 6-DOF interaction</strong> vs <strong>Idle desk underglow</strong>.
            </p>
          </div>
        </div>

        {/* Live Power Meter Badge */}
        <div className="flex items-center gap-3 px-3 py-2 bg-[#050608] rounded-xl border border-[#1e2632]">
          <Zap className="w-4 h-4 text-amber-400" />
          <div className="text-[11px] font-mono">
            <span className="text-slate-400">EST. LED CURRENT:</span>{' '}
            <strong className="text-amber-300">{estimatedLedMa} mA</strong>
            <span className="text-slate-500 text-[10px] ml-1.5">(@ {ledRing.brightness}% bright)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage Visualizer, Right Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Live Circular 24-LED Canvas Stage (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#090d14] border border-[#1e2632] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  24-LED Ring Visualizer
                </h3>
              </div>
              
              {/* Play/Pause & Animation Preview State */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-[#050608] border border-[#1e2632] text-slate-400 hover:text-white text-xs transition"
                  title={isPlaying ? 'Pause Animation' : 'Play Animation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                <div className="flex rounded-lg bg-[#050608] p-0.5 border border-[#1e2632] text-[11px] font-mono">
                  <button
                    onClick={() => setPreviewMode('idle')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      previewMode === 'idle'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Idle Mode
                  </button>
                  <button
                    onClick={() => setPreviewMode('active')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      previewMode === 'active'
                        ? 'bg-cyan-500 text-[#050608] font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    In-Use Active
                  </button>
                </div>
              </div>
            </div>

            {/* Circular Canvas Ring */}
            <div className="relative flex items-center justify-center py-2">
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="max-w-full rounded-2xl cursor-crosshair"
              />
            </div>

            {/* Test Interactive Motion Trigger (when in Active Preview) */}
            {previewMode === 'active' && (
              <div className="p-3 rounded-xl bg-[#050608] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Simulate 6-DOF Twist ($R_z$):
                  </span>
                  <span className="text-white font-mono">{simulatedTwist.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={simulatedTwist}
                  onChange={(e) => setSimulatedTwist(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>-1.0 (Twist Left)</span>
                  <span>0.0 (Neutral)</span>
                  <span>+1.0 (Twist Right)</span>
                </div>
              </div>
            )}

            {/* Preset Color Themes Bar */}
            <div className="space-y-2 pt-1 border-t border-[#1e2632]">
              <label className="text-[11px] font-mono text-slate-400 font-semibold block">
                Quick CAD Color Themes:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_PALETTES.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleApplyPalette(p)}
                    className="p-2 rounded-lg bg-[#050608] border border-[#1e2632] hover:border-cyan-500/60 transition text-left group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.secondary }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.accent }} />
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono block truncate group-hover:text-white">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Behavior, Colors, and Animation Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Universal Brightness & Speeds */}
          <div className="p-5 rounded-2xl bg-[#090d14] border border-[#1e2632] space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Universal Brightness & Speed
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Brightness Slider */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Master Brightness</span>
                  <span className="text-amber-400 font-bold">{ledRing.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ledRing.brightness}
                  onChange={(e) => onChangeLedRing({ ...ledRing, brightness: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-[9px] font-mono text-slate-500 block">0% Off &bull; 50% Desk &bull; 100% Max</span>
              </div>

              {/* Idle Animation Speed */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300">Idle Animation Speed</span>
                  <span className="text-purple-400 font-bold">{ledRing.idleSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={ledRing.idleSpeed}
                  onChange={(e) => onChangeLedRing({ ...ledRing, idleSpeed: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <span className="text-[9px] font-mono text-slate-500 block">1x Relaxed &bull; 10x Fast</span>
              </div>

              {/* Active Reaction Speed */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300">In-Use Reaction Speed</span>
                  <span className="text-cyan-400 font-bold">{ledRing.activeSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={ledRing.activeSpeed}
                  onChange={(e) => onChangeLedRing({ ...ledRing, activeSpeed: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[9px] font-mono text-slate-500 block">1x Smooth &bull; 10x Twitch</span>
              </div>
            </div>

            {/* 3 Main Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#1e2632]">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050608] border border-[#1e2632]">
                <input
                  type="color"
                  value={ledRing.primaryColor}
                  onChange={(e) => {
                    onChangeLedRing({ ...ledRing, primaryColor: e.target.value });
                    setSelectedBrushColor(e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Primary Color</span>
                  <span className="text-xs font-mono font-bold text-white uppercase">{ledRing.primaryColor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050608] border border-[#1e2632]">
                <input
                  type="color"
                  value={ledRing.secondaryColor}
                  onChange={(e) => onChangeLedRing({ ...ledRing, secondaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Secondary Color</span>
                  <span className="text-xs font-mono font-bold text-white uppercase">{ledRing.secondaryColor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050608] border border-[#1e2632]">
                <input
                  type="color"
                  value={ledRing.accentColor}
                  onChange={(e) => onChangeLedRing({ ...ledRing, accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Accent Color</span>
                  <span className="text-xs font-mono font-bold text-white uppercase">{ledRing.accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Mode Behavior Selectors (Idle vs Active) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IDLE ANIMATION SELECTOR */}
            <div className="p-4 rounded-2xl bg-[#090d14] border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <h4 className="text-xs font-bold text-purple-300 uppercase font-mono">
                  1. When Idle (Desk Resting)
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Pattern displayed while CAD puck is untouched:
              </p>

              <div className="space-y-1.5">
                {[
                  { id: 'breathing', label: 'Breathing / Pulse', desc: 'Gentle sine-wave brightness breathing' },
                  { id: 'spinning', label: 'Spinning Comet', desc: 'Continuous orbital tracer with decaying tail' },
                  { id: 'two_halves_bouncing', label: 'Two Halves Bouncing', desc: 'Dual pulses ping-ponging from top to bottom' },
                  { id: 'sweeping', label: 'Sweeping / Radar', desc: '360° radar beam sweep with trail' },
                  { id: 'rainbow_cycle', label: 'Rainbow Cycle', desc: 'Traveling smooth full RGB spectrum' },
                  { id: 'comet_tail', label: 'Dual Orbit Comets', desc: 'Two high-speed synchronized runners' },
                  { id: 'static_solid', label: 'Static Solid Color', desc: 'Solid primary color desk wash' },
                  { id: 'custom_per_led', label: 'Custom Per-LED Matrix', desc: 'User-painted 24-LED custom pattern' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer border transition text-xs font-mono ${
                      ledRing.idleAnimation === item.id
                        ? 'bg-purple-950/40 border-purple-500/60 text-white'
                        : 'bg-[#050608] border-[#1e2632] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="idleAnim"
                      value={item.id}
                      checked={ledRing.idleAnimation === item.id}
                      onChange={(e) => onChangeLedRing({ ...ledRing, idleAnimation: e.target.value as IdleAnimationType })}
                      className="mt-0.5 accent-purple-500"
                    />
                    <div>
                      <span className="font-bold text-white block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* ACTIVE IN-USE REACTION SELECTOR */}
            <div className="p-4 rounded-2xl bg-[#090d14] border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h4 className="text-xs font-bold text-cyan-300 uppercase font-mono">
                  2. When In-Use (6-DOF Moving)
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time reactive visual feedback while manipulating CAD:
              </p>

              <div className="space-y-1.5">
                {[
                  { id: 'rotational_twist_swirl', label: 'Rotational Twist Swirl', desc: 'Ring rotates live with physical knob Yaw twist (Rz)' },
                  { id: 'deflection_brightness', label: 'Deflection Flare & Glow', desc: 'Flares brighter in direction of tilt & total thrust force' },
                  { id: 'axis_angle_spectrum', label: 'Axis Angle Spectrum', desc: 'Hue dynamically shifts with 3D spatial orientation' },
                  { id: 'velocity_pulse', label: 'Velocity Pulse', desc: 'High-speed reactive strobe on fast maneuvers' },
                  { id: 'orbit_chase', label: 'Orbit Velocity Runner', desc: 'Orbit speed accelerates proportional to CAD velocity' },
                  { id: 'match_idle', label: 'Match Idle Style', desc: 'Continues peaceful idle animation without reactive burst' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer border transition text-xs font-mono ${
                      ledRing.activeAnimation === item.id
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                        : 'bg-[#050608] border-[#1e2632] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activeAnim"
                      value={item.id}
                      checked={ledRing.activeAnimation === item.id}
                      onChange={(e) => onChangeLedRing({ ...ledRing, activeAnimation: e.target.value as ActiveAnimationType })}
                      className="mt-0.5 accent-cyan-400"
                    />
                    <div>
                      <span className="font-bold text-white block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Individual 24-LED Custom Paint Palette */}
          <div className="p-4 rounded-2xl bg-[#090d14] border border-[#1e2632] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Per-LED 24-Pixel Custom Paint Tool
                </h4>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFillAllLeds(selectedBrushColor)}
                  className="px-2.5 py-1 rounded-lg bg-[#050608] border border-[#1e2632] hover:border-emerald-500 text-[10px] font-mono text-emerald-300 transition"
                >
                  Fill All with Brush
                </button>
                <button
                  onClick={() => {
                    const alt = Array.from({ length: 24 }, (_, i) =>
                      i % 2 === 0 ? ledRing.primaryColor : ledRing.secondaryColor
                    );
                    onChangeLedRing({
                      ...ledRing,
                      idleAnimation: 'custom_per_led',
                      individualLeds: alt,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#050608] border border-[#1e2632] hover:border-cyan-500 text-[10px] font-mono text-cyan-300 transition"
                >
                  Alternate 1-by-1
                </button>
              </div>
            </div>

            {/* Brush Selector */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#050608] border border-[#1e2632]">
              <span className="text-xs font-mono text-slate-400">Current Paint Brush:</span>
              <input
                type="color"
                value={selectedBrushColor}
                onChange={(e) => setSelectedBrushColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono font-bold text-white uppercase">{selectedBrushColor}</span>
              <span className="text-[10px] text-slate-500 font-mono ml-auto">
                Click any LED box below to paint it
              </span>
            </div>

            {/* 24-LED Grid Matrix */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {Array.from({ length: 24 }, (_, i) => {
                const color = ledRing.individualLeds?.[i] || ledRing.primaryColor;
                return (
                  <button
                    key={i}
                    onClick={() => handlePaintLed(i)}
                    onMouseEnter={() => setHoveredLedIndex(i)}
                    onMouseLeave={() => setHoveredLedIndex(null)}
                    className="p-2 rounded-lg bg-[#050608] border border-[#1e2632] hover:border-white transition flex flex-col items-center gap-1 group"
                    title={`LED #${i} · Click to paint with ${selectedBrushColor}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-white">
                      #{i}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
