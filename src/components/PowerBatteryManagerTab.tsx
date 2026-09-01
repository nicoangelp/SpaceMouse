import React, { useState, useEffect } from 'react'; 
import { Slider } from './Slider';
import { TooltipLabel } from './TooltipLabel';
import { PowerManagementConfig, LedRingConfig } from '../types';
import { Info, 
 BatteryCharging,
 Zap,
 Moon,
 Power,
 Shield,
 Activity,
 Sliders,
 Clock,
 Cpu,
 RefreshCw,
 Sun,
 CheckCircle,
 Radio,
 } from 'lucide-react';

interface PowerBatteryManagerTabProps {
 config?: PowerManagementConfig;
 onChangeConfig?: (config: PowerManagementConfig) => void;
 ledBrightness?: number;
 ledRing?: LedRingConfig;
}

export const PowerBatteryManagerTab: React.FC<PowerBatteryManagerTabProps> = ({
 config: propConfig,
 onChangeConfig: propOnChangeConfig,
 ledBrightness = 65,
 ledRing,
}) => {
 const config: PowerManagementConfig = propConfig || {
 batteryCapacityMah: 4200,
 enableLightSleep: true,
 lightSleepTimeoutMin: 15,
 lightSleepLedMode: 'dim_slow_breathe',
 lightSleepCpuFreqMhz: 80,
 enableDeepSleep: true,
 deepSleepTimeoutMin: 60,
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

 const [simulatedState, setSimulatedState] = useState<'active' | 'light_sleep' | 'deep_sleep'>('active');
 const [dailyActiveHours, setDailyActiveHours] = useState<number>(4);

 // Simulated Battery Voltage
 const [simulatedVoltage, setSimulatedVoltage] = useState<number>(3.95);
 const [isHoldingHotkey, setIsHoldingHotkey] = useState<boolean>(false);
 const [holdProgressMs, setHoldProgressMs] = useState<number>(0);
 const [isBatteryGaugeActive, setIsBatteryGaugeActive] = useState<boolean>(false);
 const [gaugeRemainingSec, setGaugeRemainingSec] = useState<number>(0);

 // Software angle offset for ring
 const rotShift = ledRing?.rotationLedOffset || 0;

 // Percentage from 3.2V to 4.2V curve
 const minV = config.batteryMinVoltage || 3.2;
 const maxV = config.batteryMaxVoltage || 4.2;
 const batteryPct = Math.min(100, Math.max(0, Math.round(((simulatedVoltage - minV) / (maxV - minV)) * 100)));
 const numLedsLit = Math.round((batteryPct / 100) * 24);

 const getBatteryColor = (pct: number) => {
 if (pct > 60) return { name: 'Green', hex: '#10b981', text: 'text-blue-400' };
 if (pct >= 30) return { name: 'Yellow', hex: '#f59e0b', text: 'text-blue-400' };
 return { name: 'Red', hex: '#ef4444', text: 'text-red-600' };
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

 // Power math
 const activeCurrentMa = Math.round(50 + 25 + 4 + (ledBrightness / 100) * 24 * 1.5);
 const lightSleepCurrentMa = config.lightSleepLedMode === 'off' ? 18 : 24;
 const deepSleepCurrentMa = 1.1;
 const usableCapacityMah = (config.batteryCapacityMah || 4200) * 0.9;
 const continuousActiveHours = (usableCapacityMah / activeCurrentMa).toFixed(1);
 const realWorldBatteryDays = (
 usableCapacityMah /
 (dailyActiveHours * activeCurrentMa + Math.min(24 - dailyActiveHours, 2) * lightSleepCurrentMa + Math.max(0, 24 - dailyActiveHours - 2) * deepSleepCurrentMa)
 ).toFixed(1);

 return (
 <div className="space-y-6">
 {/* Top Banner Card */}
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex flex-wrap items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <BatteryCharging className="w-5 h-5 text-blue-400" />
 <TooltipLabel label="Battery Management & Power Sleep States
 " tooltip="Configure ESP32 low-power sleep modes, EXT1 key-wake triggers, and the 24-LED ring fuel gauge.
 " className="text-base font-semibold text-white tracking-tight" /></div>
 </div>

 {/* Real-World Battery Estimate Pill */}
 <div className="flex items-center gap-3 px-4 py-2 rounded-xl neo-panel-inset border border-transparent">
 <div>
 <span className="text-xs text-zinc-400 block font-medium">Estimated Battery Life</span>
 <span className="text-sm font-semibold text-blue-400">~{realWorldBatteryDays} Days</span>
 </div>
 <span className="text-xs text-zinc-500">({dailyActiveHours}h CAD/day)</span>
 </div>
 </div>

 {/* Main 2-Column Content */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left: 24-LED Fuel Gauge Visualizer with Software Rotation (5 Cols) */}
 <div className="lg:col-span-5 space-y-4">
 <div className="p-6 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex flex-col items-center justify-center relative">
 <div className="relative w-56 h-56 flex items-center justify-center">
 <svg viewBox="0 0 200 200" className="w-full h-full">
 {/* Outer guide track */}
 <circle cx="100" cy="100" r="76" fill="none" stroke="#0c0e14" strokeWidth="16" />
 <circle cx="100" cy="100" r="76" fill="none" stroke="#232b3c" strokeWidth="1" />

 {/* 12 O'Clock Top Marker */}
 <polygon points="100,8 96,16 104,16" fill="#00e5ff" />

 {/* 24 Individual NeoPixel LEDs (Rotated by software angle offset) */}
 {Array.from({ length: 24 }).map((_, i) => {
 // Apply software rotation offset so index 0 aligns with rotated top position
 const logicalIndex = (i - rotShift + 24) % 24;
 const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
 const cx = 100 + 76 * Math.cos(angle);
 const cy = 100 + 76 * Math.sin(angle);
 const isLit = isBatteryGaugeActive ? logicalIndex < numLedsLit : true;

 let ledColor = '#1c2230';
 if (isBatteryGaugeActive) {
 ledColor = isLit ? currentStatusColor.hex : '#121620';
 } else {
 ledColor = '#00e5ff';
 }

 return (
 <circle
 key={i}
 cx={cx}
 cy={cy}
 r={isLit && isBatteryGaugeActive ? '6' : '4'}
 fill={ledColor}
 className="transition-all duration-300"
 />
 );
 })}
 </svg>

 {/* Center Info Circle */}
 <div className="absolute flex flex-col items-center justify-center text-center p-3 rounded-full neo-panel-inset border border-transparent w-28 h-28">
 <span className="text-xs text-zinc-400 font-semibold uppercase">
 {isBatteryGaugeActive ? 'Fuel Gauge' : 'Normal'}
 </span>
 <span className={`text-2xl font-semibold ${isBatteryGaugeActive ? currentStatusColor.text : 'text-white'}`}>
 {batteryPct}%
 </span>
 <span className="text-xs text-zinc-400">
 {numLedsLit}/24 LEDs
 </span>
 <span className="text-xs text-blue-400 font-semibold mt-0.5">
 {simulatedVoltage.toFixed(2)}V
 </span>
 </div>
 </div>

 {/* Hold-Down Hotkey Test Button */}
 <div className="w-full mt-4 p-4 rounded-xl neo-panel-inset border border-transparent space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-white flex items-center gap-1.5">
 <Radio className="w-3.5 h-3.5 text-blue-400" />
 <span>Test Hardware Fuel Gauge Hotkey</span>
 </span>
 <button
 onMouseDown={() => setIsHoldingHotkey(true)}
 onMouseUp={() => setIsHoldingHotkey(false)}
 onMouseLeave={() => setIsHoldingHotkey(false)}
 onTouchStart={() => setIsHoldingHotkey(true)}
 onTouchEnd={() => setIsHoldingHotkey(false)}
 className={`px-4 py-2 rounded-xl text-xs font-semibold transition select-none shadow-sm ${
 isBatteryGaugeActive
 ? 'bg-emerald-500 text-black'
 : isHoldingHotkey
 ? 'bg-amber-500 text-black'
 : 'bg-blue-600 hover:bg-blue-500 text-black'
 }`}
 >
 {isHoldingHotkey ? `Holding... (${(holdProgressMs / 1000).toFixed(1)}s)` : 'Press & Hold Key'}
 </button>
 </div>

 {isHoldingHotkey && (
 <div className="w-full h-1.5 neo-panel-inset rounded-full overflow-hidden">
 <div
 className="h-full bg-blue-500 transition-all duration-75"
 style={{ width: `${Math.min(100, (holdProgressMs / ((config.batteryHotkeyHoldSec || 1.0) * 1000)) * 100)}%` }}
 />
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Right: Power Settings & Low Power Timers (7 Cols) */}
 <div className="lg:col-span-7 space-y-4">
 {/* Simulated Voltage Input */}
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-3">
 <div className="flex items-center justify-between text-xs">
 <span className="font-semibold text-zinc-300 flex items-center gap-2">
 <Zap className="w-4 h-4 text-blue-400" />
 <span>Simulate Battery Voltage (3.2V - 4.2V LiPo)</span>
 </span>
 <span className="font-semibold text-blue-400">{simulatedVoltage.toFixed(2)}V ({batteryPct}%)</span>
 </div>
 <Slider  
 min="3.20"
 max="4.20"
 step="0.02"
 value={simulatedVoltage}
 onChange={(e) => setSimulatedVoltage(parseFloat(e.target.value))}
 className="w-full h-1.5 neo-panel-inset rounded-full overflow-hidden"
 />
 <div className="flex justify-between text-xs text-zinc-500">
 <span>3.20V (0% Cutoff)</span>
 <span>3.70V (Nominal 50%)</span>
 <span>4.20V (100% Full)</span>
 </div>
 </div>

 {/* Sleep Timers & Low Power Modes */}
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-4">
 <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
 Automatic Sleep & Power Optimizations
 </span>

 {/* Light Sleep */}
 <div className="flex items-center justify-between p-3 rounded-xl neo-panel-inset border border-transparent">
 <div>
 <TooltipLabel label="Light Sleep Mode (Standby)" tooltip="Disables WiFi and Bluetooth but keeps RAM powered. Wakes instantly on any movement." className="text-xs font-semibold text-white block" />
 <span className="text-xs text-zinc-400">Drops CPU clock to 80 MHz, dims LEDs; wakes instantly in &lt;5ms</span>
 </div>
 <div className="flex items-center gap-3">
 <select
 value={config.lightSleepTimeoutMin}
 onChange={(e) => onChangeConfig({ ...config, lightSleepTimeoutMin: parseInt(e.target.value, 10) })}
 className="px-2.5 py-1 rounded-lg neo-panel-inset border border-transparent text-xs text-white focus:outline-none"
 >
 <option value={5}>5 Minutes</option>
 <option value={15}>15 Minutes</option>
 <option value={30}>30 Minutes</option>
 <option value={60}>1 Hour</option>
 </select>
 <input
 type="checkbox"
 checked={config.enableLightSleep}
 onChange={(e) => onChangeConfig({ ...config, enableLightSleep: e.target.checked })}
 className="w-4 h-4 rounded neo-panel-inset border-transparent text-blue-400 focus:ring-0 cursor-pointer"
 />
 </div>
 </div>

 {/* Deep Sleep */}
 <div className="flex items-center justify-between p-3 rounded-xl neo-panel-inset border border-transparent">
 <div>
 <TooltipLabel label="Deep Hibernate Sleep" tooltip="Powers down the entire ESP32 to save maximum battery. Requires a button press to wake." className="text-xs font-semibold text-white block" />
 <span className="text-xs text-zinc-400">Consumes only ~1.1 mA; wakes on touch or button press</span>
 </div>
 <div className="flex items-center gap-3">
 <select
 value={config.deepSleepTimeoutMin}
 onChange={(e) => onChangeConfig({ ...config, deepSleepTimeoutMin: parseInt(e.target.value, 10) })}
 className="px-2.5 py-1 rounded-lg neo-panel-inset border border-transparent text-xs text-white focus:outline-none"
 >
 <option value={30}>30 Minutes</option>
 <option value={60}>1 Hour</option>
 <option value={120}>2 Hours</option>
 <option value={240}>4 Hours</option>
 </select>
 <input
 type="checkbox"
 checked={config.enableDeepSleep}
 onChange={(e) => onChangeConfig({ ...config, enableDeepSleep: e.target.checked })}
 className="w-4 h-4 rounded neo-panel-inset border-transparent text-blue-400 focus:ring-0 cursor-pointer"
 />
 </div>
 </div>

 {/* Key-Wake Info */}
 <div className="pt-2 border-t border-[#1c2230] text-xs text-zinc-400">
 <span className="font-semibold text-zinc-300 block mb-0.5">Instant Key-Wake (EXT1 Interrupts):</span>
 All 9 mechanical switch inputs are hardware-mapped to wake the ESP32 from deep sleep in &lt;15ms.
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
