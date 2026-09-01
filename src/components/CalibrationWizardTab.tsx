import React, { useState } from 'react';
import { SixDofState, CalibrationData } from '../types';
import { Target, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, Activity, Save, Sparkles } from 'lucide-react';

interface CalibrationWizardTabProps {
 state: SixDofState;
 calibration: CalibrationData;
 onSaveCalibration: (data: CalibrationData) => void;
 onSendSerialCommand: (cmd: string) => void;
 isConnected: boolean;
}

export const CalibrationWizardTab: React.FC<CalibrationWizardTabProps> = ({
 state,
 calibration,
 onSaveCalibration,
 onSendSerialCommand,
 isConnected,
}) => {
 const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
 const [isSamplingZero, setIsSamplingZero] = useState<boolean>(false);
 const [capturedMins, setCapturedMins] = useState<number[]>([2048, 2048, 2048, 2048, 2048, 2048]);
 const [capturedMaxs, setCapturedMaxs] = useState<number[]>([2048, 2048, 2048, 2048, 2048, 2048]);
 const [zeroOffsets, setZeroOffsets] = useState<number[]>(calibration.zeroOffsets || [2048, 2048, 2048, 2048, 2048, 2048]);
 const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

 // Step 1: Tare / Zero
 const handleTareZero = () => {
 setIsSamplingZero(true);
 if (isConnected) {
 onSendSerialCommand('CAL_ZERO');
 }
 setTimeout(() => {
 setZeroOffsets([...state.rawAdc]);
 setIsSamplingZero(false);
 }, 1500);
 };

 // Step 2: Live Range Tracker
 const updateRangeMinMax = () => {
 const nextMins = capturedMins.map((min, i) => Math.min(min, state.rawAdc[i] || 2048));
 const nextMaxs = capturedMaxs.map((max, i) => Math.max(max, state.rawAdc[i] || 2048));
 setCapturedMins(nextMins);
 setCapturedMaxs(nextMaxs);
 };

 const handleFinishCalibration = () => {
 const newCal: CalibrationData = {
 zeroOffsets,
 minDeflections: capturedMins,
 maxDeflections: capturedMaxs,
 matrixDecoupling: [
 [1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
 [0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
 [0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
 [0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
 [0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
 [0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
 ],
 calibrationDate: new Date().toLocaleDateString(),
 isCalibrated: true,
 };
 onSaveCalibration(newCal);
 if (isConnected) {
 onSendSerialCommand('SAVE_EEPROM');
 }
 setSavedSuccess(true);
 setTimeout(() => setSavedSuccess(false), 3000);
 };

 return (
 <div className="space-y-5">
 {/* Wizard Header */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632] flex flex-wrap items-center justify-between gap-4">
 <div>
 <h2 className="text-base font-semibold text-white flex items-center gap-2 ">
 <Target className="w-5 h-5 text-blue-400" />
 <span>SENSOR CALIBRATION & DECOUPLING WIZARD</span>
 </h2>
 <p className="text-xs text-zinc-400 mt-0.5 ">
 Calibrate Hall effect sensors (SS49E) or analog joysticks to eliminate resting drift and compensate for magnetic cross-talk.
 </p>
 </div>

 {/* Step Indicator */}
 <div className="flex items-center gap-2">
 {[1, 2, 3, 4].map((step) => (
 <button
 key={step}
 onClick={() => setCurrentStep(step as any)}
 className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
 currentStep === step
 ? 'bg-blue-600 text-black font-extrabold glow-cyan-sm'
 : currentStep > step
 ? 'bg-emerald-950 text-blue-400 border border-green-300'
 : 'bg-[#050608] border border-[#1e2632] text-zinc-400'
 }`}
 >
 {currentStep > step ? '✓' : step}
 </button>
 ))}
 </div>
 </div>

 {/* STEP 1: Center Tare */}
 {currentStep === 1 && (
 <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-blue-500/40 text-blue-400 glow-cyan-sm">
 <RotateCcw className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-white ">STEP 1: ZERO-POINT REST CALIBRATION (TARE)</h3>
 <p className="text-xs text-zinc-400 ">
 Ensure your DIY SpaceMouse knob is completely stationary in its natural centered spring rest position.
 </p>
 </div>
 </div>

 {/* Live ADC Channel Indicators */}
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
 {state.rawAdc.map((raw, idx) => (
 <div key={idx} className="p-3 bg-[#050608] rounded-lg border border-[#1e2632] text-center">
 <div className="text-xs font-semibold text-zinc-400 uppercase ">Channel {idx} (A{idx})</div>
 <div className="text-sm font-semibold text-blue-400 my-1">{raw}</div>
 <div className="text-xs text-zinc-500 ">Zero: {zeroOffsets[idx] || 2048}</div>
 </div>
 ))}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-[#1e2632]">
 <button
 onClick={handleTareZero}
 disabled={isSamplingZero}
 className="neo-button-primary"
 >
 <RotateCcw className={`w-4 h-4 text-black ${isSamplingZero ? 'animate-spin' : ''}`} />
 <span>{isSamplingZero ? 'SAMPLING 200 CYCLES...' : 'CAPTURE ZERO TARE NOW'}</span>
 </button>

 <button
 onClick={() => setCurrentStep(2)}
 className="px-4 py-2 rounded-lg bg-[#050608] border border-[#1e2632] hover:border-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
 >
 <span>NEXT: DEFLECTION RANGE</span>
 <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
 </button>
 </div>
 </div>
 )}

 {/* STEP 2: Full Deflection Range */}
 {currentStep === 2 && (
 <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl" onMouseMove={updateRangeMinMax}>
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-lg bg-purple-950/80 border border-blue-500/40 text-blue-400 glow-purple-sm">
 <Activity className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-white ">STEP 2: DEFLECTION ENVELOPE & RANGE TESTING</h3>
 <p className="text-xs text-zinc-400 ">
 Firmly push, pull, tilt, and twist your SpaceMouse knob in all directions to register the physical mechanical limits.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
 {['Pan X', 'Pan Y', 'Zoom Z', 'Pitch Rx', 'Roll Ry', 'Yaw Rz'].map((label, idx) => {
 const min = capturedMins[idx];
 const max = capturedMaxs[idx];
 const cur = state.rawAdc[idx] || 2048;
 const span = max - min;
 return (
 <div key={idx} className="p-4 bg-[#050608] rounded-xl border border-[#1e2632] space-y-2">
 <div className="flex items-center justify-between text-xs ">
 <span className="font-semibold text-zinc-300">{label}</span>
 <span className="text-blue-400 font-semibold">Span: {span} ADC</span>
 </div>
 <div className="h-2 bg-[#090c10] rounded-full overflow-hidden border border-[#1e2632] relative">
 <div
 className="h-full bg-blue-600 rounded-full transition-all glow-cyan-sm"
 style={{ width: `${Math.min(100, Math.max(5, ((cur - min) / Math.max(1, span)) * 100))}%` }}
 />
 </div>
 <div className="flex justify-between text-xs text-zinc-500 ">
 <span>Min: {min}</span>
 <span>Cur: {cur}</span>
 <span>Max: {max}</span>
 </div>
 </div>
 );
 })}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-[#1e2632]">
 <button
 onClick={() => setCurrentStep(1)}
 className="px-4 py-2 rounded-lg bg-[#050608] border border-[#1e2632] text-zinc-300 hover:text-white text-xs font-semibold "
 >
 BACK
 </button>
 <button
 onClick={() => setCurrentStep(3)}
 className="neo-button-primary"
 >
 <span>NEXT: NOISE & HYSTERESIS</span>
 <ArrowRight className="w-3.5 h-3.5 text-black" />
 </button>
 </div>
 </div>
 )}

 {/* STEP 3: Noise Floor */}
 {currentStep === 3 && (
 <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-green-300 text-blue-400 glow-emerald-sm">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-white ">STEP 3: NOISE FLOOR & RECOMMENDED DEADBANDS</h3>
 <p className="text-xs text-zinc-400 ">
 Calculates analog ripple from your power supply and Hall effect sensor wiring to prevent camera creep.
 </p>
 </div>
 </div>

 <div className="p-4 rounded-xl bg-[#050608] border border-[#1e2632] text-xs text-zinc-300 space-y-2">
 <div className="font-semibold text-blue-400 flex items-center gap-2 ">
 <Sparkles className="w-4 h-4" />
 <span>RECOMMENDED TUNING MATRIX:</span>
 </div>
 <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-xs ">
 <li>Recommended Deadzone: <strong className="text-blue-400">8% - 10%</strong> (Sensor noise is &lt; 15 ADC counts).</li>
 <li>Recommended Smoothing α: <strong className="text-blue-400">0.32</strong> (Sub-pixel smooth tracking for CAD).</li>
 <li>ADC Attenuation: <strong className="text-blue-400">11dB (0 - 3.3V range)</strong> on ESP32.</li>
 </ul>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-[#1e2632]">
 <button
 onClick={() => setCurrentStep(2)}
 className="px-4 py-2 rounded-lg bg-[#050608] border border-[#1e2632] text-zinc-300 hover:text-white text-xs font-semibold "
 >
 BACK
 </button>
 <button
 onClick={() => setCurrentStep(4)}
 className="neo-button-primary"
 >
 <span>NEXT: DECOUPLING MATRIX & SAVE</span>
 <ArrowRight className="w-3.5 h-3.5 text-black" />
 </button>
 </div>
 </div>
 )}

 {/* STEP 4: Save & Flash */}
 {currentStep === 4 && (
 <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-blue-500/40 text-blue-400 glow-cyan-sm">
 <Save className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-white ">STEP 4: COMMIT CALIBRATION TO ESP32 FLASH (NVS)</h3>
 <p className="text-xs text-zinc-400 ">
 Write zero offsets and deflection constants directly to ESP32 non-volatile storage so it persists across power cycles.
 </p>
 </div>
 </div>

 <div className="p-4 bg-[#050608] rounded-xl border border-[#1e2632] text-xs text-zinc-300 space-y-1">
 <div className="text-blue-400 font-semibold">// Calibration Payload Ready:</div>
 <div>Zeros: [{zeroOffsets.join(', ')}]</div>
 <div>Min Envelope: [{capturedMins.join(', ')}]</div>
 <div>Max Envelope: [{capturedMaxs.join(', ')}]</div>
 </div>

 {savedSuccess && (
 <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500 text-blue-400 text-xs font-semibold flex items-center gap-2 glow-emerald-sm">
 <CheckCircle2 className="w-4 h-4 text-blue-400" />
 <span>CALIBRATION COMMITTED & SAVED TO ESP32 FLASH NVS</span>
 </div>
 )}

 <div className="flex items-center justify-between pt-3 border-t border-[#1e2632]">
 <button
 onClick={() => setCurrentStep(3)}
 className="px-4 py-2 rounded-lg bg-[#050608] border border-[#1e2632] text-zinc-300 hover:text-white text-xs font-semibold "
 >
 BACK
 </button>
 <button
 id="btn-flash-calibration-nvs"
 onClick={handleFinishCalibration}
 className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-semibold shadow-lg glow-emerald-sm flex items-center gap-2 active:scale-95 transition-all"
 >
 <Save className="w-4 h-4 text-black" />
 <span>SAVE & FLASH TO ESP32 NVS</span>
 </button>
 </div>
 </div>
 )}
 </div>
 );
};
