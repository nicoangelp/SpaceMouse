import React, { useState, useEffect } from 'react';
import { PowerManagementConfig, LightSleepLedBehavior } from '../types';
import {
  BatteryCharging,
  Zap,
  Moon,
  Power,
  Shield,
  Activity,
  CheckCircle,
  Radio,
  Sliders,
  Clock,
  Cpu,
  RefreshCw,
  Sun,
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2,
  Gauge,
  HelpCircle,
  Flame,
  Info,
  Sparkles,
} from 'lucide-react';

interface PowerBatteryManagerTabProps {
  config?: PowerManagementConfig;
  onChangeConfig?: (config: PowerManagementConfig) => void;
  ledBrightness?: number;
}

export const PowerBatteryManagerTab: React.FC<PowerBatteryManagerTabProps> = ({
  config: propConfig,
  onChangeConfig: propOnChangeConfig,
  ledBrightness = 65,
}) => {
  const config: PowerManagementConfig = propConfig || {
    batteryCapacityMah: 4200,
    enableLightSleep: true,
    lightSleepTimeoutMin: 15,
    lightSleepLedMode: 'dim_slow_breathe',
    lightSleepCpuFreqMhz: 80,
    enableDeepSleep: true,
    deepSleepTimeoutMin: 60,
    wakeOnMotionThreshold: 15,
    wakeOnButtons: true,
    autoReconnectBle: true,
    enableBatterySense: true,
    batteryAdcPin: 35,
    voltageDividerR1Kohm: 100,
    voltageDividerR2Kohm: 100,
    batteryMinVoltage: 3.2,
    batteryMaxVoltage: 4.2,
    batteryHotkeyHoldSec: 1.0,
    batteryHotkeyButtonIndex: 8,
    batteryIndicatorDisplaySec: 3.5,
  };

  const onChangeConfig = (newConfig: PowerManagementConfig) => {
    if (propOnChangeConfig) propOnChangeConfig(newConfig);
  };

  const [dailyActiveHours, setDailyActiveHours] = useState<number>(4); // 4 hours CAD modeling / day
  const [simulatedState, setSimulatedState] = useState<'active' | 'light_sleep' | 'deep_sleep'>('active');
  const [wakeTriggerMessage, setWakeTriggerMessage] = useState<string | null>(null);

  // --- Battery Voltage Divider & Hotkey State ---
  const [simulatedVoltage, setSimulatedVoltage] = useState<number>(3.95); // 3.95V default (~75%)
  const [isHoldingHotkey, setIsHoldingHotkey] = useState<boolean>(false);
  const [holdProgressMs, setHoldProgressMs] = useState<number>(0);
  const [isBatteryGaugeActive, setIsBatteryGaugeActive] = useState<boolean>(false);
  const [gaugeRemainingSec, setGaugeRemainingSec] = useState<number>(0);

  // Calculate battery percentage from LiPo discharge curve (3.2V to 4.2V)
  const minV = config.batteryMinVoltage || 3.2;
  const maxV = config.batteryMaxVoltage || 4.2;
  const batteryPct = Math.min(100, Math.max(0, Math.round(((simulatedVoltage - minV) / (maxV - minV)) * 100)));

  // Calculate how many of the 24 LEDs illuminate (equally divided in percentages)
  // Each LED = 100 / 24 = 4.166%
  const numLedsLit = Math.round((batteryPct / 100) * 24);

  // Determine LED color zone:
  // > 60% = Green
  // 30% - 60% = Yellow
  // < 30% = Red
  const getBatteryColor = (pct: number) => {
    if (pct > 60) return { name: 'Green', hex: '#22c55e', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' };
    if (pct >= 30) return { name: 'Yellow', hex: '#eab308', bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400' };
    return { name: 'Red', hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
  };

  const currentStatusColor = getBatteryColor(batteryPct);

  // Simulate Hotkey Hold Progress
  useEffect(() => {
    let interval: any;
    if (isHoldingHotkey && !isBatteryGaugeActive) {
      const targetHoldMs = (config.batteryHotkeyHoldSec || 1.0) * 1000;
      interval = setInterval(() => {
        setHoldProgressMs((prev) => {
          const next = prev + 50;
          if (next >= targetHoldMs) {
            // Trigger Gauge!
            setIsBatteryGaugeActive(true);
            setGaugeRemainingSec(config.batteryIndicatorDisplaySec || 3.5);
            return 0;
          }
          return next;
        });
      }, 50);
    } else {
      setHoldProgressMs(0);
    }
    return () => clearInterval(interval);
  }, [isHoldingHotkey, isBatteryGaugeActive, config.batteryHotkeyHoldSec, config.batteryIndicatorDisplaySec]);

  // Gauge Display Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isBatteryGaugeActive && gaugeRemainingSec > 0) {
      timer = setInterval(() => {
        setGaugeRemainingSec((prev) => {
          if (prev <= 0.1) {
            setIsBatteryGaugeActive(false);
            return 0;
          }
          return parseFloat((prev - 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isBatteryGaugeActive, gaugeRemainingSec]);

  // Power math based on ESP32 + MPU6050 + 24 NeoPixels + BLE
  const activeCurrentMa = Math.round(50 + 25 + 4 + (ledBrightness / 100) * 24 * 1.5);
  const lightSleepCurrentMa = config.lightSleepLedMode === 'off' ? 18 : 24;
  const deepSleepCurrentMa = 1.1;

  const usableCapacityMah = (config.batteryCapacityMah || 4200) * 0.9;
  const continuousActiveHours = (usableCapacityMah / activeCurrentMa).toFixed(1);
  const continuousLightSleepHours = (usableCapacityMah / lightSleepCurrentMa).toFixed(0);
  const continuousDeepSleepDays = (usableCapacityMah / (deepSleepCurrentMa * 24)).toFixed(0);

  const dailySleepHours = 24 - dailyActiveHours;
  const dailyDrawMah = (dailyActiveHours * activeCurrentMa) + (Math.min(dailySleepHours, 2) * lightSleepCurrentMa) + (Math.max(0, dailySleepHours - 2) * deepSleepCurrentMa);
  const realWorldBatteryDays = (usableCapacityMah / dailyDrawMah).toFixed(1);

  const handleSimulateWake = (trigger: string) => {
    setSimulatedState('active');
    setWakeTriggerMessage(`Woke up via: ${trigger} (< 5ms latency, zero reconnection delay)`);
    setTimeout(() => setWakeTriggerMessage(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-[#080b10] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center text-emerald-300">
              <BatteryCharging className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">Battery & Power Efficiency Architecture</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-300 font-mono font-semibold">
                AKZYTUE 4200mAh LiPo · 3.7V
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Dual 100kΩ voltage divider battery gauge, multi-tier sleep optimizer, and hold-down 24-LED fuel gauge overlay.
            </p>
          </div>
        </div>

        {/* Big Real-World Runtime Estimate */}
        <div className="flex items-center gap-3 px-3.5 py-2 bg-[#050608] rounded-xl border border-emerald-500/40">
          <Zap className="w-5 h-5 text-emerald-400" />
          <div className="font-mono text-left">
            <div className="text-[10px] text-slate-400">EST. BATTERY RUNTIME</div>
            <div className="text-sm font-black text-emerald-300">
              ~{realWorldBatteryDays} Days <span className="text-[10px] text-slate-400 font-normal">(@ {dailyActiveHours}h CAD/day)</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE SECTION 1: 2x 100kΩ Resistor Voltage Divider & 24-LED Fuel Gauge */}
      <div className="p-6 rounded-2xl bg-[#090d14] border border-cyan-500/40 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e2632]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  2x 100kΩ Battery Voltage Divider & 24-LED Ring Fuel Gauge
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 font-semibold">
                  Hold-Down Hotkey Trigger
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Press & hold <strong>Key 9 (Center Key) for {config.batteryHotkeyHoldSec || 1.0}s</strong> to illuminate the 24-LED ring proportionally to battery level.
              </p>
            </div>
          </div>

          {/* Real-Time Battery Indicator Status Badge */}
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 font-mono ${
            isBatteryGaugeActive
              ? `${currentStatusColor.border} bg-black ring-2 ring-${currentStatusColor.name.toLowerCase()}-400/30 animate-pulse`
              : 'border-[#1e2632] bg-[#050608]'
          }`}>
            <div className={`w-3 h-3 rounded-full ${currentStatusColor.bg} shadow-lg`} />
            <div>
              <div className="text-[10px] text-slate-400">BATTERY LEVEL</div>
              <div className={`text-sm font-black ${currentStatusColor.text}`}>
                {batteryPct}% ({simulatedVoltage.toFixed(2)}V) · {currentStatusColor.name}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 24-LED Circular Ring Fuel Gauge Viewport (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-[#050608] border border-[#1e2632]">
            <div className="text-xs font-mono font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>24-LED NEOPIXEL RING FUEL GAUGE</span>
              {isBatteryGaugeActive && (
                <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40 font-mono">
                  ACTIVE ({gaugeRemainingSec}s)
                </span>
              )}
            </div>

            {/* Circular Ring SVG Simulation */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Background Ring Track */}
                <circle cx="100" cy="100" r="76" fill="none" stroke="#151d2a" strokeWidth="12" />

                {/* 24 Individual NeoPixel LEDs */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
                  const cx = 100 + 76 * Math.cos(angle);
                  const cy = 100 + 76 * Math.sin(angle);
                  const isLit = isBatteryGaugeActive ? i < numLedsLit : true;
                  
                  // In gauge mode: lit LEDs get color based on threshold (>60% green, 30-60% yellow, <30% red)
                  // In resting mode: gentle cyan / profile color
                  let ledColor = '#1e293b';
                  if (isBatteryGaugeActive) {
                    ledColor = isLit ? currentStatusColor.hex : '#151d2a';
                  } else {
                    ledColor = '#00e5ff';
                  }

                  return (
                    <g key={i}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isLit && isBatteryGaugeActive ? "6.5" : "4.5"}
                        fill={ledColor}
                        className="transition-all duration-300"
                        filter={isLit && isBatteryGaugeActive ? `drop-shadow(0 0 6px ${currentStatusColor.hex})` : undefined}
                      />
                      {/* LED index label */}
                      <text
                        x={100 + 58 * Math.cos(angle)}
                        y={100 + 58 * Math.sin(angle) + 2.5}
                        fontSize="6"
                        fill="#64748b"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Center Hub Display */}
              <div className="absolute flex flex-col items-center justify-center text-center p-3 rounded-full bg-[#0a0d14] border border-[#1e2632] w-28 h-28 shadow-inner">
                <span className="text-[10px] font-mono text-slate-400">
                  {isBatteryGaugeActive ? 'FUEL GAUGE' : 'RESTING'}
                </span>
                <span className={`text-2xl font-black font-mono ${isBatteryGaugeActive ? currentStatusColor.text : 'text-white'}`}>
                  {batteryPct}%
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {numLedsLit}/24 LEDs Lit
                </span>
                <span className="text-[9px] font-mono text-cyan-400 mt-0.5">
                  {simulatedVoltage.toFixed(2)}V LiPo
                </span>
              </div>
            </div>

            {/* Threshold Legend Bar */}
            <div className="mt-5 w-full grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
              <div className={`p-1.5 rounded-lg border ${batteryPct > 60 ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 font-bold' : 'bg-[#0a0d14] border-[#1e2632] text-slate-400'}`}>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>&gt; 60%: GREEN</span>
                </div>
                <div className="text-[9px] opacity-75">15–24 LEDs (3.80V+)</div>
              </div>
              <div className={`p-1.5 rounded-lg border ${batteryPct >= 30 && batteryPct <= 60 ? 'bg-yellow-950/80 border-yellow-400 text-yellow-300 font-bold' : 'bg-[#0a0d14] border-[#1e2632] text-slate-400'}`}>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>30–60%: YELLOW</span>
                </div>
                <div className="text-[9px] opacity-75">8–14 LEDs (3.50V–3.80V)</div>
              </div>
              <div className={`p-1.5 rounded-lg border ${batteryPct < 30 ? 'bg-red-950/80 border-red-400 text-red-300 font-bold' : 'bg-[#0a0d14] border-[#1e2632] text-slate-400'}`}>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span>&lt; 30%: RED</span>
                </div>
                <div className="text-[9px] opacity-75">1–7 LEDs (&lt;3.50V)</div>
              </div>
            </div>
          </div>

          {/* Right: Voltage Slider & Hotkey Trigger & Wiring Schematic (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Battery Voltage Input Slider */}
            <div className="p-4 rounded-xl bg-[#050608] border border-[#1e2632] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Simulate Battery Voltage (LiPo 3.7V Discharge)</span>
                </span>
                <span className="text-amber-300 font-bold">{simulatedVoltage.toFixed(2)} Volts ({batteryPct}%)</span>
              </div>
              <input
                type="range"
                min="3.10"
                max="4.20"
                step="0.02"
                value={simulatedVoltage}
                onChange={(e) => setSimulatedVoltage(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>3.20V (0% Cutoff)</span>
                <span>3.70V (Nominal 50%)</span>
                <span>4.20V (100% Full)</span>
              </div>
            </div>

            {/* Interactive Hold-Down Hotkey Test Button */}
            <div className="p-4 rounded-xl bg-[#050608] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>TEST HOLD-DOWN HOTKEY ON CONTROLLER</span>
                  </span>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Click and hold the button below for <strong>{(config.batteryHotkeyHoldSec || 1.0).toFixed(1)} second</strong> to trigger the fuel gauge:
                  </p>
                </div>

                <button
                  onMouseDown={() => setIsHoldingHotkey(true)}
                  onMouseUp={() => setIsHoldingHotkey(false)}
                  onMouseLeave={() => setIsHoldingHotkey(false)}
                  onTouchStart={() => setIsHoldingHotkey(true)}
                  onTouchEnd={() => setIsHoldingHotkey(false)}
                  className={`px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all select-none shadow-lg active:scale-95 flex items-center gap-2 ${
                    isBatteryGaugeActive
                      ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                      : isHoldingHotkey
                      ? 'bg-amber-500 text-black ring-4 ring-amber-500/30'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-cyan-500/30'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{isHoldingHotkey ? `HOLDING... (${(holdProgressMs / 1000).toFixed(1)}s)` : 'PRESS & HOLD KEY 9'}</span>
                </button>
              </div>

              {/* Hold Progress Bar */}
              {isHoldingHotkey && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#151d2a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75"
                      style={{ width: `${Math.min(100, (holdProgressMs / ((config.batteryHotkeyHoldSec || 1.0) * 1000)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-cyan-300">
                    <span>Holding Key 9 (Center Key)...</span>
                    <span>{Math.round((holdProgressMs / ((config.batteryHotkeyHoldSec || 1.0) * 1000)) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Circuit Schematic & Soldering Diagram Box */}
            <div className="p-4 rounded-xl bg-[#070a0f] border border-[#1e2632] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>2x 100kΩ RESISTOR VOLTAGE DIVIDER SCHEMATIC</span>
              </div>

              <div className="p-3 rounded-lg bg-[#040608] border border-[#151d2a] font-mono text-[11px] text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-[#1e2632] pb-1.5">
                  <span>LiPo Battery (+) 3.2V–4.2V</span>
                  <span>───[ 100kΩ R1 ]───┬───[ 100kΩ R2 ]─── GND</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300 pl-24">
                  <span>│</span>
                  <span></span>
                </div>
                <div className="flex items-center justify-between text-emerald-300 pl-20 font-bold">
                  <span>└──► ESP32 Pin GPIO {config.batteryAdcPin || 35} (ADC1)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Halves voltage: 1.6V–2.1V</span>
                </div>
              </div>

              <ul className="text-[11px] font-mono text-slate-400 space-y-1 list-disc list-inside">
                <li><strong>Why 100kΩ resistors?</strong> Draws only ~21 µA (0.021 mA), meaning the divider alone takes <strong>&gt;20 years to drain</strong> the 4200mAh battery.</li>
                <li><strong>Safe for ESP32 ADC:</strong> Drops 4.20V max LiPo voltage to <strong>2.10V</strong>, perfectly inside the 0–3.3V ADC range without overloading GPIO pins.</li>
                <li><strong>ADC1 Pin Recommended:</strong> Uses <strong>GPIO 35</strong> (or 34/36/39) which operates continuously without conflicting with ESP32 WiFi / Bluetooth BLE.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Power State Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* State 1: Active Mode */}
        <div className={`p-4 rounded-2xl border transition-all ${
          simulatedState === 'active'
            ? 'bg-gradient-to-b from-cyan-950/40 to-[#090d14] border-cyan-400 ring-2 ring-cyan-400/20'
            : 'bg-[#090d14] border-[#1e2632]'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
              STATE 1: ACTIVE
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">~{activeCurrentMa} mA</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">Full Performance</h3>
          <ul className="mt-2.5 space-y-1 text-[11px] font-mono text-slate-300 list-disc list-inside">
            <li><strong>CPU:</strong> 240 MHz Dual-Core (100%)</li>
            <li><strong>IMU:</strong> 200 Hz I2C kinematics sampling</li>
            <li><strong>BLE:</strong> 1000 Hz HID gamepad link</li>
            <li><strong>LEDs:</strong> Full 24-pixel active animation</li>
            <li><strong>Runtime:</strong> ~{continuousActiveHours} continuous hours</li>
          </ul>
        </div>

        {/* State 2: Light Sleep Mode */}
        <div className={`p-4 rounded-2xl border transition-all ${
          simulatedState === 'light_sleep'
            ? 'bg-gradient-to-b from-purple-950/40 to-[#090d14] border-purple-400 ring-2 ring-purple-400/20'
            : 'bg-[#090d14] border-[#1e2632]'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
              STATE 2: LIGHT SLEEP ({config.lightSleepTimeoutMin}m)
            </span>
            <span className="text-xs font-mono font-bold text-purple-400">~{lightSleepCurrentMa} mA</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">Fast-Wake Standby</h3>
          <ul className="mt-2.5 space-y-1 text-[11px] font-mono text-slate-300 list-disc list-inside">
            <li><strong>CPU:</strong> Throttled to 80 MHz</li>
            <li><strong>IMU:</strong> 20 Hz low-power wake polling</li>
            <li><strong>BLE:</strong> Connection kept alive (0 delay)</li>
            <li><strong>LEDs:</strong> Ultra-dim 5% slow breathe</li>
            <li><strong>Wake:</strong> Instant on touch/button (&lt;5ms)</li>
          </ul>
        </div>

        {/* State 3: Deep Sleep Hibernate Mode */}
        <div className={`p-4 rounded-2xl border transition-all ${
          simulatedState === 'deep_sleep'
            ? 'bg-gradient-to-b from-emerald-950/40 to-[#090d14] border-emerald-400 ring-2 ring-emerald-400/20'
            : 'bg-[#090d14] border-[#1e2632]'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
              STATE 3: DEEP SLEEP ({config.deepSleepTimeoutMin}m)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">~{deepSleepCurrentMa} mA</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">Ultra-Low Hibernate</h3>
          <ul className="mt-2.5 space-y-1 text-[11px] font-mono text-slate-300 list-disc list-inside">
            <li><strong>CPU:</strong> Deep Sleep RTC Mode (0.15mA)</li>
            <li><strong>IMU:</strong> MPU6050 Low-Power WOM (0.05mA)</li>
            <li><strong>LEDs:</strong> Powered OFF completely (0mA)</li>
            <li><strong>Wake:</strong> Hardware WOM or Ext1 buttons</li>
            <li><strong>Standby:</strong> ~{continuousDeepSleepDays} days (~5 months)</li>
          </ul>
        </div>
      </div>

      {/* Lower Dual Panel: Sleep Config & Workday Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Deep & Light Sleep Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* Light Sleep Settings Box */}
          <div className="p-5 rounded-2xl bg-[#090d14] border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Tier 1: Light Sleep Configuration (Zero-Latency Wake)
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableLightSleep}
                  onChange={(e) => onChangeConfig({ ...config, enableLightSleep: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Sleep Inactivity Timeout */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Inactivity Timeout</span>
                  <span className="text-purple-400 font-bold">{config.lightSleepTimeoutMin} minutes</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  value={config.lightSleepTimeoutMin}
                  onChange={(e) => onChangeConfig({ ...config, lightSleepTimeoutMin: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>3 min</span>
                  <span>15 min (default)</span>
                  <span>30 min</span>
                </div>
              </div>

              {/* CPU Frequency Throttling */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Throttled CPU Speed</span>
                  <span className="text-cyan-400 font-bold">{config.lightSleepCpuFreqMhz} MHz</span>
                </div>
                <select
                  value={config.lightSleepCpuFreqMhz}
                  onChange={(e) => onChangeConfig({ ...config, lightSleepCpuFreqMhz: parseInt(e.target.value) })}
                  className="w-full py-1 px-2 text-xs font-mono bg-[#090d14] border border-[#1e2632] rounded text-white"
                >
                  <option value={80}>80 MHz (Recommended - Low Power)</option>
                  <option value={40}>40 MHz (Ultra Low Power)</option>
                  <option value={160}>160 MHz (Medium Savings)</option>
                </select>
                <span className="text-[9px] font-mono text-slate-500 block">
                  Drops from 240MHz to save &gt;60% CPU current
                </span>
              </div>
            </div>
          </div>

          {/* Deep Sleep / Hibernate Settings Box */}
          <div className="p-5 rounded-2xl bg-[#090d14] border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Power className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Tier 2: Deep Sleep Hibernate Configuration
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableDeepSleep}
                  onChange={(e) => onChangeConfig({ ...config, enableDeepSleep: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hibernate Inactivity Timeout */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Hibernate Timeout</span>
                  <span className="text-emerald-400 font-bold">{config.deepSleepTimeoutMin} minutes</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="180"
                  step="5"
                  value={config.deepSleepTimeoutMin}
                  onChange={(e) => onChangeConfig({ ...config, deepSleepTimeoutMin: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>20 min</span>
                  <span>60 min (default)</span>
                  <span>180 min</span>
                </div>
              </div>

              {/* Wake On Motion Sensitivity */}
              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Motion Wake Sensitivity</span>
                  <span className="text-cyan-400 font-bold">{config.wakeOnMotionThreshold} mg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={config.wakeOnMotionThreshold}
                  onChange={(e) => onChangeConfig({ ...config, wakeOnMotionThreshold: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[9px] font-mono text-slate-500 block">
                  Lower = more sensitive touch wake
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Workday Calculator & Simulator */}
        <div className="lg:col-span-5 space-y-5">
          {/* Daily Usage & Battery Math Calculator */}
          <div className="p-5 rounded-2xl bg-[#090d14] border border-[#1e2632] space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Workday Battery Calculator
              </h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Active Modeling Hours / Day:</span>
                  <span className="text-amber-400 font-bold">{dailyActiveHours} hrs/day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={dailyActiveHours}
                  onChange={(e) => setDailyActiveHours(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#151d2a] rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#050608] border border-[#1e2632] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>LiPo Battery Model:</span>
                  <strong className="text-white">AKZYTUE 4200mAh (3.7V)</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Avg. Daily Consumption:</span>
                  <strong className="text-amber-300">{Math.round(dailyDrawMah)} mAh / day</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Continuous 3D Modeling:</span>
                  <strong className="text-cyan-300">~{continuousActiveHours} hours</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Deep Sleep Standby Shelf:</span>
                  <strong className="text-emerald-300">~{continuousDeepSleepDays} days (~5 mos)</strong>
                </div>
                <div className="pt-2 border-t border-[#1e2632] flex justify-between text-sm font-bold text-emerald-400">
                  <span>Expected Charge Cycle:</span>
                  <span>Every {realWorldBatteryDays} Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
