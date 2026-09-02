import React, { useState } from 'react';
import {
 Cpu,
 Wrench,
 Zap,
 BatteryCharging,
 Layers,
 Sparkles,
 CheckCircle,
 Radio,
 Sliders,
 Keyboard,
 ShieldCheck,
 ChevronRight,
 Code,
 Copy,
 Check,
 Flame,
 Info,
 ExternalLink,
 Compass,
 CircleDot
} from 'lucide-react';
import { Profile } from '../types';

interface HardwareManualTabProps {
 profile: Profile;
 onApplyHardwarePreset?: () => void;
}

export const HardwareManualTab: React.FC<HardwareManualTabProps> = ({
 profile,
 onApplyHardwarePreset,
}) => {
 const [copiedWiring, setCopiedWiring] = useState<boolean>(false);
 const [presetApplied, setPresetApplied] = useState<boolean>(false);
 const [activeSubSection, setActiveSubSection] = useState<'overview' | 'kinematics' | 'wiring' | 'steps' | 'firmware'>('overview');

 const handleCopyWiring = () => {
 const text = `
=== OOFO ONE 6-DOF CONTROLLER PINOUT & WIRING MATRIX ===
Target MCU: ELEGOO ESP-WROOM-32 (USB-C CP2102)

1. MPU-6050 6-AXIS IMU (I2C):
 - VCC -> ESP32 3.3V (or 5V if 5V-tolerant)
 - GND -> ESP32 GND
 - SDA -> ESP32 GPIO 21 (Default I2C SDA)
 - SCL -> ESP32 GPIO 22 (Default I2C SCL)
 - AD0 -> GND (Sets I2C address to 0x68)

2. ADAFRUIT 24 NEOPIXEL LED RING (WS2812B):
 - 5V / VDD -> TP4056 OUT+ or ESP32 5V (VIN)
 - GND -> Common GND
 - DIN -> ESP32 GPIO 15 (via 330 ohm resistor)

3. TREEDIX 9-KEY MECHANICAL KEYPAD (3x3 Matrix, INPUT_PULLUP to GND):
 - Key 1 (Top Left) -> ESP32 GPIO 13 (Fit View)
 - Key 2 (Top Mid) -> ESP32 GPIO 12 (Orbit/Pan Lock)
 - Key 3 (Top Right) -> ESP32 GPIO 14 (Top View)
 - Key 4 (Mid Left) -> ESP32 GPIO 27 (Front View)
 - Key 5 (Center) -> ESP32 GPIO 26 (Extrude / Action)
 - Key 6 (Mid Right) -> ESP32 GPIO 25 (Precision 0.25x)
 - Key 7 (Bottom Left) -> ESP32 GPIO 33 (Undo)
 - Key 8 (Bottom Mid) -> ESP32 GPIO 32 (Radial Pie Menu)
 - Key 9 (Bottom Right)-> ESP32 GPIO 4 (Zero Tare Center)
 - Key Common Grounds -> Common GND

4. POWER SUBSYSTEM (TP4056 + 4200mAh LiPo):
 - AKZYTUE 4200mAh LiPo (+) -> TP4056 B+
 - AKZYTUE 4200mAh LiPo (-) -> TP4056 B-
 - TP4056 OUT+ -> SPDT Switch Pin 1
 - SPDT Switch Pin 2 -> ESP32 5V / VIN & NeoPixel 5V
 - TP4056 OUT- -> Common GND
`;
 navigator.clipboard.writeText(text);
 setCopiedWiring(true);
 setTimeout(() => setCopiedWiring(false), 2500);
 };

 const handleApplyPreset = () => {
 if (onApplyHardwarePreset) {
 onApplyHardwarePreset();
 }
 setPresetApplied(true);
 setTimeout(() => setPresetApplied(false), 3000);
 };

 return (
 <div className="space-y-6 text-white">
 {/* Top Banner with Prototype Header */}
 <div className="p-5 bg-gradient-to-r from-[#0a0f16] via-[#0d1520] to-[#0a0f16] rounded-xl border border-blue-200 shadow-2xl relative overflow-hidden">
 <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
 <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-blue-500/40 text-xs text-blue-400 font-semibold uppercase tracking-wider">
 Custom Hardware Blueprint
 </span>
 <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-green-300 text-xs text-blue-400 font-semibold">
 MPU6050 + ESP32 + 24 NeoPixel + 9-Key Treedix
 </span>
 </div>
 <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
 <Wrench className="w-5 h-5 text-blue-400" />
 <span>HARDWARE ASSEMBLY MANUAL & WIRING SCHEMATICS</span>
 </h1>
 <p className="text-xs text-zinc-300 max-w-3xl">
 Complete engineering manual for your custom OOFO One 6-DOF build: spring kinematics, electrical pinouts, 3x3 mechanical macro keypad, underglow ring, and LiPo power system.
 </p>
 </div>

 <div className="flex items-center gap-2.5">
 <button
 id="btn-copy-hardware-wiring"
 onClick={handleCopyWiring}
 className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#050608] hover:border-transparent text-zinc-200 text-xs font-semibold border border-[#1e2632] shadow-sm transition-all"
 >
 {copiedWiring ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
 <span>{copiedWiring ? 'COPIED TO CLIPBOARD' : 'COPY PINOUT TXT'}</span>
 </button>
 <button
 id="btn-apply-prototype-preset"
 onClick={handleApplyPreset}
 className="neo-button-primary"
 >
 <Zap className="w-3.5 h-3.5 text-black" />
 <span>{presetApplied ? 'PRESET APPLIED!' : 'SYNC HARDWARE PRESET'}</span>
 </button>
 </div>
 </div>

 {/* Quick Sub-Navigation Pills */}
 <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1e2632] overflow-x-auto no-scrollbar text-xs">
 {[
 { id: 'overview' as const, label: '1. Architecture & Parts', icon: Layers },
 { id: 'kinematics' as const, label: '2. Spring Kinematics Math', icon: Compass },
 { id: 'wiring' as const, label: '3. Complete Wiring Matrix', icon: Cpu },
 { id: 'steps' as const, label: '4. Step-by-Step Assembly', icon: Wrench },
 { id: 'firmware' as const, label: '5. Wireless & Setup', icon: Radio },
 ].map((sec) => {
 const Icon = sec.icon;
 const isAct = activeSubSection === sec.id;
 return (
 <button
 key={sec.id}
 onClick={() => setActiveSubSection(sec.id)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
 isAct
 ? 'bg-blue-600/20 border border-cyan-400/50 text-blue-400 font-semibold'
 : 'bg-[#050608]/80 text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-slate-800'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${isAct ? 'text-blue-400' : 'text-zinc-500'}`} />
 <span>{sec.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* SECTION 1: ARCHITECTURE & PARTS BREAKDOWN */}
 {(activeSubSection === 'overview' || activeSubSection === 'steps') && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
 <Layers className="w-4 h-4 text-blue-400" />
 <span>1. BILL OF MATERIALS & PROTOTYPE SUBSYSTEMS</span>
 </h2>
 <span className="text-xs text-zinc-500">6 Modular Components</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {/* Part 1: MPU-6050 IMU on Spring Knob */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-blue-200 space-y-2 relative overflow-hidden">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 01
 </div>
 <div>
 <h3 className="text-xs font-semibold text-white ">MPU-6050 6-Axis IMU</h3>
 <p className="text-xs text-blue-400 ">Top of Spring Knob</p>
 </div>
 </div>
 <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-blue-500/40 text-[9px] text-blue-400">
 I2C (0x68)
 </span>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed">
 Mounted directly inside the top cylindrical cap. As the knob twists, tilts, or translates against the internal springs, the gyro and accelerometer measure instantaneous 6-DOF force and angle vectors.
 </p>
 <div className="text-xs text-zinc-400 bg-[#050608] p-2 rounded border border-[#1e2632]">
 <span className="text-blue-400 font-semibold">Connections:</span> VCC (3.3V), GND, SDA (GPIO 21), SCL (GPIO 22)
 </div>
 </div>

 {/* Part 2: ELEGOO ESP-WROOM-32 */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-blue-400 text-xs font-semibold">
 02
 </div>
 <div>
 <h3 className="text-xs font-semibold text-white ">ELEGOO ESP-WROOM-32</h3>
 <p className="text-xs text-blue-400 ">Main Controller & Brain</p>
 </div>
 </div>
 <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-[9px] text-indigo-300">
 Dual Core 240MHz
 </span>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed">
 Runs the 6-DOF kinematic engine, 200Hz sensor polling, 9-key debouncing, NeoPixel animation engine, and dual Bluetooth BLE + High-Speed USB Serial telemetry.
 </p>
 <div className="text-xs text-zinc-400 bg-[#050608] p-2 rounded border border-[#1e2632]">
 <span className="text-blue-400 font-semibold">Features:</span> CP2102 USB-C, BLE 4.2, WiFi, 512KB SRAM
 </div>
 </div>

 {/* Part 3: Treedix 9-Key Switch PCB */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-emerald-500/30 space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-green-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 03
 </div>
 <div>
 <h3 className="text-xs font-semibold text-white ">Treedix 9-Key PCB</h3>
 <p className="text-xs text-blue-400 ">3x3 Mechanical Keypad</p>
 </div>
 </div>
 <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-green-300 text-[9px] text-blue-400">
 9 Switches
 </span>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed">
 Attached directly to the ergonomic thumb/palm rest (visible in your photo). Provides 9 tactile mechanical key switches for instant CAD shortcuts (Fit, Extrude, Sketch, Look At, Undo, Zero Tare).
 </p>
 <div className="text-xs text-zinc-400 bg-[#050608] p-2 rounded border border-[#1e2632]">
 <span className="text-blue-400 font-semibold">Wiring:</span> GPIOs 13, 12, 14, 27, 26, 25, 33, 32, 4 (Active LOW)
 </div>
 </div>

 {/* Part 4: Adafruit 24 NeoPixel Ring */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-blue-500/30 space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-indigo-200 flex items-center justify-center text-blue-400 text-xs font-semibold">
 04
 </div>
 <div>
 <h3 className="text-xs font-semibold text-white ">Adafruit 24 NeoPixel Ring</h3>
 <p className="text-xs text-blue-400 ">Base 360° Underglow</p>
 </div>
 </div>
 <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-blue-500/40 text-[9px] text-blue-400">
 24 RGB LEDs
 </span>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed">
 Mounted under the knob base. Displays dynamic rotational swirls matching knob twist, color shift on deflection, battery level, and CAD app theme colors (Orange for Fusion, etc.).
 </p>
 <div className="text-xs text-zinc-400 bg-[#050608] p-2 rounded border border-[#1e2632]">
 <span className="text-blue-400 font-semibold">Connection:</span> DIN to GPIO 15, VDD to 5V, GND to Common GND
 </div>
 </div>

 {/* Part 5: HiLetgo TP4056 Type-C Charger */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-amber-500/30 space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-blue-400 text-xs font-semibold">
 05
 </div>
 <div>
 <h3 className="text-xs font-semibold text-white ">HiLetgo TP4056 Module</h3>
 <p className="text-xs text-blue-400 ">Type-C 5V 1A LiPo Charger</p>
 </div>
 </div>
 <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-[9px] text-blue-400">
 DW01A Protected
 </span>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed">
 Provides safe constant-current/constant-voltage charging for the LiPo battery with built-in overcharge, over-discharge, and short-circuit protection.
 </p>
 <div className="text-xs text-zinc-400 bg-[#050608] p-2 rounded border border-[#1e2632]">
 <span className="text-blue-400 font-semibold">Terminals:</span> B+/B- to Battery, OUT+/OUT- to Switch & ESP32
 </div>
 </div>

 {/* Part 6: AKZYTUE 3.7V 4200mAh LiPo Battery */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-sky-500/30 space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-500/50 flex items-center justify-center text-blue-400 text-xs font-semibold">
 06
 </div>
 <div>
 <h3 className="text-xs font-semibold text-white ">AKZYTUE 4200mAh LiPo</h3>
 <p className="text-xs text-blue-400 ">3.7V Lithium Polymer</p>
 </div>
 </div>
 <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-[9px] text-sky-300">
 35-50+ Hours
 </span>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed">
 Huge 4200mAh capacity provides days of continuous wireless Bluetooth 6-DOF CAD modeling on a single charge. Fits snugly in the bottom chassis base.
 </p>
 <div className="text-xs text-zinc-400 bg-[#050608] p-2 rounded border border-[#1e2632]">
 <span className="text-blue-400 font-semibold">Connector:</span> 2-Pin JST-PH 2.0mm to TP4056 B+/B-
 </div>
 </div>
 </div>
 </div>
 )}

 {/* SECTION 2: SPRING KINEMATICS & PHYSICS BREAKDOWN */}
 {(activeSubSection === 'overview' || activeSubSection === 'kinematics') && (
 <div className="space-y-4">
 <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold text-white flex items-center gap-2">
 <Compass className="w-4 h-4 text-blue-400" />
 <span>2. HOW 6-DOF WORKS WITH AN MPU-6050 & SPRING SUSPENSION</span>
 </h2>
 <span className="text-xs text-blue-400">Kinematic Math Explained</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ">
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-2">
 <div className="text-blue-400 font-semibold flex items-center gap-1.5">
 <CircleDot className="w-3.5 h-3.5" />
 <span>Rotational Axes (Pitch Rx, Roll Ry, Yaw Rz):</span>
 </div>
 <ul className="space-y-1.5 text-zinc-300 text-xs">
 <li>
 <strong className="text-white">Pitch (Rx - Tilt Forward/Back):</strong> Calculated by fusing gravity tilt (<span className="text-blue-400">atan2(Ay, √(Ax²+Az²))</span>) with Gyroscope X rate via 94% Complementary Filter.
 </li>
 <li>
 <strong className="text-white">Roll (Ry - Tilt Left/Right):</strong> Calculated via gravity tilt (<span className="text-blue-400">atan2(-Ax, Az)</span>) fused with Gyroscope Y rate.
 </li>
 <li>
 <strong className="text-white">Yaw (Rz - Twist Left/Right):</strong> Gyroscope Z rate (<span className="text-blue-400">Gz</span>) is integrated into an angular deflection angle. When the user releases the knob, the springs force the knob back to center; the firmware’s leaky spring decay factor (<span className="text-blue-400">0.92 per tick</span>) resets Yaw to zero with zero drift!
 </li>
 </ul>
 </div>

 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-2">
 <div className="text-blue-400 font-semibold flex items-center gap-1.5">
 <CircleDot className="w-3.5 h-3.5" />
 <span>Translational Axes (Pan X, Pan Y, Zoom Z):</span>
 </div>
 <ul className="space-y-1.5 text-zinc-300 text-xs">
 <li>
 <strong className="text-white">Pan X (Left / Right):</strong> Pushing against the springs produces dynamic linear acceleration impulses (<span className="text-blue-400">Ax</span>), scaled through the exponential smoothing filter.
 </li>
 <li>
 <strong className="text-white">Pan Y (Forward / Backward):</strong> Pushing forward/back produces dynamic (<span className="text-blue-400">Ay</span>) linear impulse.
 </li>
 <li>
 <strong className="text-white">Zoom Z (Pull Up / Push Down):</strong> Pulling upward or depressing downward against the axial springs creates a delta acceleration from baseline gravity (<span className="text-blue-400">Az - 9.81 m/s²</span>).
 </li>
 </ul>
 </div>
 </div>

 {/* Visual Spring Equilibrium Callout */}
 <div className="p-3 bg-cyan-950/20 border border-blue-200 rounded-lg text-xs text-zinc-300 flex items-start gap-2.5">
 <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
 <div>
 <strong className="text-blue-400">Why the Spring Suspension is essential:</strong> The physical springs provide immediate mechanical force feedback to your fingers (so you feel the deflection amount) and automatically return the knob to (0,0,0,0,0,0) when released. The firmware takes advantage of this mechanical equilibrium to continuously tare and eliminate sensor drift!
 </div>
 </div>
 </div>
 </div>
 )}

 {/* SECTION 3: COMPLETE WIRING MATRIX & PINOUT */}
 {(activeSubSection === 'overview' || activeSubSection === 'wiring') && (
 <div className="space-y-4">
 <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <h2 className="text-sm font-semibold text-white flex items-center gap-2">
 <Cpu className="w-4 h-4 text-blue-400" />
 <span>3. COMPLETE ELECTRICAL PINOUT & WIRING MATRIX</span>
 </h2>
 <p className="text-xs text-zinc-400 mt-0.5">
 Connect each component directly to the ELEGOO ESP-WROOM-32 pins as specified below.
 </p>
 </div>
 <button
 onClick={handleCopyWiring}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#050608] hover:border-blue-500 border border-[#1e2632] text-xs text-blue-400 active:scale-95 transition-all"
 >
 <Copy className="w-3.5 h-3.5" />
 <span>Copy Table</span>
 </button>
 </div>

 {/* Pinout Table */}
 <div className="overflow-x-auto border border-[#1e2632] rounded-lg">
 <table className="w-full text-left text-xs">
 <thead className="bg-[#050608] text-zinc-400 border-b border-[#1e2632]">
 <tr>
 <th className="p-2.5 font-semibold text-zinc-200">Subsystem</th>
 <th className="p-2.5 font-semibold text-zinc-200">Component Pin</th>
 <th className="p-2.5 font-semibold text-blue-400">ESP32 Pin (GPIO)</th>
 <th className="p-2.5 font-semibold text-zinc-200">Voltage / Level</th>
 <th className="p-2.5 font-semibold text-zinc-200">Recommended Wire</th>
 <th className="p-2.5 font-semibold text-zinc-200">Function</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#1e2632]/60 text-zinc-300">
 {/* MPU6050 */}
 <tr className="bg-cyan-950/10">
 <td className="p-2.5 font-semibold text-blue-400">MPU-6050 IMU</td>
 <td className="p-2.5">VCC</td>
 <td className="p-2.5 font-semibold text-blue-400">3.3V</td>
 <td className="p-2.5">3.3V DC</td>
 <td className="p-2.5 text-red-600">Red Wire</td>
 <td className="p-2.5 text-zinc-400">Sensor Power Supply</td>
 </tr>
 <tr className="bg-cyan-950/10">
 <td className="p-2.5 font-semibold text-blue-400">MPU-6050 IMU</td>
 <td className="p-2.5">GND</td>
 <td className="p-2.5 font-semibold text-blue-400">GND</td>
 <td className="p-2.5">0V (Ground)</td>
 <td className="p-2.5 text-zinc-400">Black Wire</td>
 <td className="p-2.5 text-zinc-400">Common Ground</td>
 </tr>
 <tr className="bg-cyan-950/10">
 <td className="p-2.5 font-semibold text-blue-400">MPU-6050 IMU</td>
 <td className="p-2.5">SDA</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 21</td>
 <td className="p-2.5">3.3V I2C Data</td>
 <td className="p-2.5 text-blue-400">Blue Wire</td>
 <td className="p-2.5 text-zinc-400">I2C Data Bus (400kHz)</td>
 </tr>
 <tr className="bg-cyan-950/10">
 <td className="p-2.5 font-semibold text-blue-400">MPU-6050 IMU</td>
 <td className="p-2.5">SCL</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 22</td>
 <td className="p-2.5">3.3V I2C Clock</td>
 <td className="p-2.5 text-blue-400">Yellow Wire</td>
 <td className="p-2.5 text-zinc-400">I2C Clock Bus (400kHz)</td>
 </tr>
 <tr className="bg-cyan-950/10">
 <td className="p-2.5 font-semibold text-blue-400">MPU-6050 IMU</td>
 <td className="p-2.5">AD0</td>
 <td className="p-2.5 font-semibold text-blue-400">GND</td>
 <td className="p-2.5">Ground</td>
 <td className="p-2.5 text-zinc-400">Black Wire</td>
 <td className="p-2.5 text-zinc-400">Sets I2C Address = 0x68</td>
 </tr>

 {/* 24 NeoPixel Ring */}
 <tr className="bg-purple-950/10">
 <td className="p-2.5 font-semibold text-blue-400">24 NeoPixel Ring</td>
 <td className="p-2.5">DIN (Data In)</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 15</td>
 <td className="p-2.5">3.3V / 5V Logic</td>
 <td className="p-2.5 text-blue-400">Green Wire</td>
 <td className="p-2.5 text-zinc-400">WS2812B 800kHz Signal</td>
 </tr>
 <tr className="bg-purple-950/10">
 <td className="p-2.5 font-semibold text-blue-400">24 NeoPixel Ring</td>
 <td className="p-2.5">5V / VDD</td>
 <td className="p-2.5 font-semibold text-blue-400">VIN (5V) / OUT+</td>
 <td className="p-2.5">3.7V - 5.0V</td>
 <td className="p-2.5 text-red-600">Red Wire</td>
 <td className="p-2.5 text-zinc-400">Power for 24 RGB LEDs</td>
 </tr>
 <tr className="bg-purple-950/10">
 <td className="p-2.5 font-semibold text-blue-400">24 NeoPixel Ring</td>
 <td className="p-2.5">GND</td>
 <td className="p-2.5 font-semibold text-blue-400">GND</td>
 <td className="p-2.5">0V</td>
 <td className="p-2.5 text-zinc-400">Black Wire</td>
 <td className="p-2.5 text-zinc-400">Common Ground</td>
 </tr>

 {/* Treedix 9-Key Switches */}
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K1)</td>
 <td className="p-2.5">Switch 1</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 13</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 1</td>
 <td className="p-2.5 text-zinc-400">Fit View to Window (F6)</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K2)</td>
 <td className="p-2.5">Switch 2</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 12</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 2</td>
 <td className="p-2.5 text-zinc-400">Orbit / Pan Lock Toggle</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K3)</td>
 <td className="p-2.5">Switch 3</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 14</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 3</td>
 <td className="p-2.5 text-zinc-400">Top Orthographic View (Num 7)</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K4)</td>
 <td className="p-2.5">Switch 4</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 27</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 4</td>
 <td className="p-2.5 text-zinc-400">Front View (Num 1)</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K5)</td>
 <td className="p-2.5">Switch 5</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 26</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 5</td>
 <td className="p-2.5 text-zinc-400">Extrude Feature (E)</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K6)</td>
 <td className="p-2.5">Switch 6</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 25</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 6</td>
 <td className="p-2.5 text-zinc-400">Precision Mode (0.25x Speed)</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K7)</td>
 <td className="p-2.5">Switch 7</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 33</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 7</td>
 <td className="p-2.5 text-zinc-400">Undo (Ctrl + Z)</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K8)</td>
 <td className="p-2.5">Switch 8</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 32</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 8</td>
 <td className="p-2.5 text-zinc-400">Radial 8-Way CAD Menu</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (K9)</td>
 <td className="p-2.5">Switch 9</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 4</td>
 <td className="p-2.5">INPUT_PULLUP</td>
 <td className="p-2.5 text-blue-400">Ribbon Wire 9</td>
 <td className="p-2.5 text-zinc-400">Instant Hardware Zero Tare</td>
 </tr>
 <tr className="bg-emerald-950/10">
 <td className="p-2.5 font-semibold text-blue-400">Treedix Keypad (GND)</td>
 <td className="p-2.5">Common Ground</td>
 <td className="p-2.5 font-semibold text-blue-400">GND</td>
 <td className="p-2.5">Ground</td>
 <td className="p-2.5 text-zinc-400">Black Wire</td>
 <td className="p-2.5 text-zinc-400">Shared Keypad Return</td>
 </tr>

 {/* Power & Charger */}
 <tr className="bg-amber-950/10">
 <td className="p-2.5 font-semibold text-blue-400">TP4056 Charger</td>
 <td className="p-2.5">B+ / B-</td>
 <td className="p-2.5 font-semibold text-blue-400">4200mAh LiPo</td>
 <td className="p-2.5">3.7V - 4.2V</td>
 <td className="p-2.5 text-red-600">Red (+) / Blk (-)</td>
 <td className="p-2.5 text-zinc-400">Direct to LiPo Battery JST</td>
 </tr>
 <tr className="bg-amber-950/10">
 <td className="p-2.5 font-semibold text-blue-400">TP4056 Charger</td>
 <td className="p-2.5">OUT+</td>
 <td className="p-2.5 font-semibold text-blue-400">Power Switch &rarr; VIN</td>
 <td className="p-2.5">3.7V - 4.2V (Switched)</td>
 <td className="p-2.5 text-red-600">Red Wire</td>
 <td className="p-2.5 text-zinc-400">Main Power Rail to ESP32 5V</td>
 </tr>
 <tr className="bg-amber-950/10">
 <td className="p-2.5 font-semibold text-blue-400">TP4056 Charger</td>
 <td className="p-2.5">OUT-</td>
 <td className="p-2.5 font-semibold text-blue-400">Common GND</td>
 <td className="p-2.5">0V</td>
 <td className="p-2.5 text-zinc-400">Black Wire</td>
 <td className="p-2.5 text-zinc-400">System Ground Rail</td>
 </tr>

 {/* Battery Sensing Voltage Divider */}
 <tr className="bg-emerald-950/20 border-t-2 border-green-300">
 <td className="p-2.5 font-semibold text-blue-400">Battery Fuel Gauge</td>
 <td className="p-2.5">100kΩ Resistor (R1)</td>
 <td className="p-2.5 font-semibold text-blue-400">LiPo (+) to GPIO 35</td>
 <td className="p-2.5">3.2V–4.2V input</td>
 <td className="p-2.5 text-blue-400">100kΩ Resistor</td>
 <td className="p-2.5 text-blue-400 font-semibold">Upper divider arm (LiPo + &rarr; GPIO 35)</td>
 </tr>
 <tr className="bg-emerald-950/20">
 <td className="p-2.5 font-semibold text-blue-400">Battery Fuel Gauge</td>
 <td className="p-2.5">100kΩ Resistor (R2)</td>
 <td className="p-2.5 font-semibold text-blue-400">GPIO 35 to GND</td>
 <td className="p-2.5">1.6V–2.1V ADC</td>
 <td className="p-2.5 text-blue-400">100kΩ Resistor</td>
 <td className="p-2.5 text-blue-400 font-semibold">Lower divider arm (GPIO 35 &rarr; GND)</td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Visual ASCII Circuit Flow */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] text-xs text-zinc-300 overflow-x-auto">
 <div className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
 <Code className="w-3.5 h-3.5" />
 <span>ELECTRICAL POWER & DATA FLOW DIAGRAM</span>
 </div>
 <pre className="text-zinc-300 leading-tight">
{`
 [ 4200mAh LiPo ] ===(JST)===> [ TP4056 USB-C Charger ] 
 | |
 (OUT+) (OUT-)
 | |
 [ SPDT Switch ] |
 | |
 +-------------------+---------+-------------------+
 | | |
 v (5V / VIN) v (5V VDD) v (GND)
 [ ELEGOO ESP32 MCU ] [ 24 NeoPixel Ring ] [ Common Ground ]
 | | | | ^ ^
 (3.3V) | (GND) | (15)===========(DIN) |
 | | | |
 v v +================(I2C: SDA=21, SCL=22) |
 [ MPU-6050 IMU ] |
 |
 [ Treedix 9-Key Switch PCB ] ======(GPIO 13,12,14,27,26,25,33,32,4)
 |
 +------------------------------------------------+
`}
 </pre>
 </div>
 </div>
 </div>
 )}

 {/* SECTION 4: STEP-BY-STEP ASSEMBLY & CALIBRATION GUIDE */}
 {(activeSubSection === 'overview' || activeSubSection === 'steps') && (
 <div className="space-y-4">
 <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4">
 <h2 className="text-sm font-semibold text-white flex items-center gap-2">
 <Wrench className="w-4 h-4 text-blue-400" />
 <span>4. STEP-BY-STEP ASSEMBLY & SETUP GUIDE</span>
 </h2>

 <div className="space-y-3">
 {/* Step 1 */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded bg-cyan-950 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 1
 </span>
 <h3 className="text-xs font-semibold text-white ">
 Mount MPU-6050 Inside the Top Knob Cap
 </h3>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed pl-7">
 Secure the MPU-6050 PCB flat against the underside of the top knob surface using double-sided foam tape or M2 screws. Ensure the X-axis arrow points forward and Z points straight up. Route a flexible 4-wire silicone cable down through the central spring core into the base chassis.
 </p>
 </div>

 {/* Step 2 */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded bg-cyan-950 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 2
 </span>
 <h3 className="text-xs font-semibold text-white ">
 Wire and Mount the Treedix 9-Key Mechanical Keypad
 </h3>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed pl-7">
 Solder 9 signal wires from the 9 switch outputs to ESP32 GPIOs <span className="text-blue-400">13, 12, 14, 27, 26, 25, 33, 32, 4</span>. Daisy-chain the common pin of all 9 switches together and connect to ESP32 GND. Fasten the Treedix PCB to the ergonomic handrest bracket beside the knob (as shown in your prototype photo).
 </p>
 </div>

 {/* Step 3 */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded bg-cyan-950 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 3
 </span>
 <h3 className="text-xs font-semibold text-white ">
 Install the Adafruit 24 NeoPixel Ring Underglow
 </h3>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed pl-7">
 Place the 24-LED NeoPixel ring in the circular recess under the knob base. Solder DIN to <span className="text-blue-400">GPIO 15</span>, 5V/VDD to the switched power line, and GND to common ground.
 </p>
 </div>

 {/* Step 4 */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded bg-cyan-950 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 4
 </span>
 <h3 className="text-xs font-semibold text-white ">
 Connect LiPo Battery, TP4056 Charger & Power Switch
 </h3>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed pl-7">
 Connect the AKZYTUE 4200mAh LiPo JST leads to TP4056 <span className="text-blue-400">B+</span> and <span className="text-blue-400">B-</span>. Connect <span className="text-blue-400">OUT+</span> through your SPDT power switch to the ESP32 <span className="text-red-600">VIN (5V)</span> pin, and <span className="text-blue-400">OUT-</span> to ESP32 <span className="text-zinc-400">GND</span>.
 </p>
 </div>

 {/* Step 5 */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded bg-cyan-950 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 5
 </span>
 <h3 className="text-xs font-semibold text-white ">
 Flash Turnkey Firmware via Arduino IDE or PlatformIO
 </h3>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed pl-7">
 Navigate to the <strong className="text-blue-400">ESP32 Firmware</strong> tab in this app. Select <span className="text-blue-400">ESP32-WROOM</span> and <span className="text-blue-400">MPU6050 Gyro/Accel (Spring Knob)</span>, download the <span className=" text-white">.ino</span> or <span className=" text-white">platformio.ini</span>, and upload to your ESP32.
 </p>
 </div>

 {/* Step 6 */}
 <div className="p-3.5 bg-[#050608] rounded-lg border border-[#1e2632] space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded bg-cyan-950 border border-blue-300 flex items-center justify-center text-blue-400 text-xs font-semibold">
 6
 </span>
 <h3 className="text-xs font-semibold text-white ">
 Zero Tare & Calibrate in Studio
 </h3>
 </div>
 <p className="text-xs text-zinc-300 leading-relaxed pl-7">
 With the device powered on and resting motionless on your desk, click <span className="text-blue-400 font-semibold">CONNECT SERIAL</span> in the top header or press <span className="text-blue-400 font-semibold">Key 9</span> on your mechanical keypad. The NeoPixel ring will flash purple and calibrate the resting spring equilibrium tare in 2 seconds!
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* SECTION 5: WIRELESS BLUETOOTH & CAD INTEGRATION */}
 {(activeSubSection === 'overview' || activeSubSection === 'firmware') && (
 <div className="space-y-4">
 <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4">
 <h2 className="text-sm font-semibold text-white flex items-center gap-2">
 <Radio className="w-4 h-4 text-blue-400" />
 <span>5. WIRELESS BLUETOOTH & COMPANION DAEMON</span>
 </h2>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ">
 <div className="p-4 bg-[#050608] rounded-lg border border-[#1e2632] space-y-2">
 <div className="text-blue-400 font-semibold flex items-center gap-2">
 <Radio className="w-4 h-4" />
 <span>Mode A: Wireless Bluetooth BLE 3D Controller</span>
 </div>
 <p className="text-zinc-300 text-xs leading-relaxed">
 Your ESP-WROOM-32 advertises as <strong className="text-white">"DIY SpaceMouse 6-DOF"</strong>. Pair directly in Windows/Mac Bluetooth settings without any dongles! Sends multi-axis joystick and 9 button reports continuously with 4200mAh battery power.
 </p>
 </div>

 <div className="p-4 bg-[#050608] rounded-lg border border-[#1e2632] space-y-2">
 <div className="text-blue-400 font-semibold flex items-center gap-2">
 <Sparkles className="w-4 h-4" />
 <span>Mode B: High-Speed USB Serial + WebSerial Studio</span>
 </div>
 <p className="text-zinc-300 text-xs leading-relaxed">
 Plug USB-C directly into PC to charge the battery and stream high-speed JSON telemetry packets at 115200 baud. Use our Fusion 360 Python Add-in or this Web Studio to tune response curves live!
 </p>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
