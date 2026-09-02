import React, { useState, useEffect } from 'react';
import { SixDofState, CalibrationData } from '../types';
import { Target, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, Activity, Save, Sparkles, Compass, SlidersHorizontal } from 'lucide-react';

interface CalibrationWizardTabProps {
 state: SixDofState;
 calibration: CalibrationData;
 onSaveCalibration: (data: CalibrationData) => void;
 onPreviewMatrix?: (matrix: number[][]) => void;
 eulerAngles: { yaw: number, pitch: number, roll: number };
 onEulerChange: (e: { yaw: number, pitch: number, roll: number }) => void;
 invertAxes: { x: boolean, y: boolean, z: boolean };
 onInvertChange: (e: { x: boolean, y: boolean, z: boolean }) => void;
 onSendSerialCommand: (cmd: string) => void;
 isConnected: boolean;
}

export const CalibrationWizardTab: React.FC<CalibrationWizardTabProps> = ({
 state,
 calibration,
 onSaveCalibration,
 onPreviewMatrix,
 eulerAngles,
 onEulerChange,
 invertAxes,
 onInvertChange,
 onSendSerialCommand,
 isConnected,
}) => {
 const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
 const [isSamplingZero, setIsSamplingZero] = useState<boolean>(false);
 const [capturedMins, setCapturedMins] = useState<number[]>([0, 0, 0, 0, 0, 0]);
 const [capturedMaxs, setCapturedMaxs] = useState<number[]>([0, 0, 0, 0, 0, 0]);
 const [zeroOffsets, setZeroOffsets] = useState<number[]>(calibration.zeroOffsets || [0, 0, 0, 0, 0, 0]);
 const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

 const [mappedMatrix, setMappedMatrix] = useState<number[][]>(calibration.matrixDecoupling || [
  [1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  [0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
  [0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
 ]);

 // Recalculate 6x6 matrix when Euler angles change
 useEffect(() => {
   const yawRad = (eulerAngles.yaw * Math.PI) / 180;
   const pitchRad = (eulerAngles.pitch * Math.PI) / 180;
   const rollRad = (eulerAngles.roll * Math.PI) / 180;

   // Rz (Yaw)
   const Rz = [
     [Math.cos(yawRad), -Math.sin(yawRad), 0],
     [Math.sin(yawRad),  Math.cos(yawRad), 0],
     [0, 0, 1]
   ];

   // Rx (Pitch)
   const Rx = [
     [1, 0, 0],
     [0, Math.cos(pitchRad), -Math.sin(pitchRad)],
     [0, Math.sin(pitchRad),  Math.cos(pitchRad)]
   ];

   // Ry (Roll)
   const Ry = [
     [ Math.cos(rollRad), 0, Math.sin(rollRad)],
     [0, 1, 0],
     [-Math.sin(rollRad), 0, Math.cos(rollRad)]
   ];

   const multiply3x3 = (A: number[][], B: number[][]) => {
     let C = [[0,0,0],[0,0,0],[0,0,0]];
     for(let i=0; i<3; i++) {
       for(let j=0; j<3; j++) {
         C[i][j] = A[i][0]*B[0][j] + A[i][1]*B[1][j] + A[i][2]*B[2][j];
       }
     }
     return C;
   };

   // R = Rz * Rx * Ry
   let R = multiply3x3(multiply3x3(Rz, Rx), Ry);

   // Apply Inversions
   const Invert = [
     [invertAxes.x ? -1 : 1, 0, 0],
     [0, invertAxes.y ? -1 : 1, 0],
     [0, 0, invertAxes.z ? -1 : 1]
   ];
   R = multiply3x3(R, Invert);

   const newMatrix = [
     [R[0][0], R[0][1], R[0][2], 0, 0, 0],
     [R[1][0], R[1][1], R[1][2], 0, 0, 0],
     [R[2][0], R[2][1], R[2][2], 0, 0, 0],
     [0, 0, 0, 1, 0, 0],
     [0, 0, 0, 0, 1, 0],
     [0, 0, 0, 0, 0, 1]
   ];
   
   setMappedMatrix(newMatrix);
   if (onPreviewMatrix) onPreviewMatrix(newMatrix);
 }, [eulerAngles.yaw, eulerAngles.pitch, eulerAngles.roll, invertAxes.x, invertAxes.y, invertAxes.z, onPreviewMatrix]);

 // Step 1: Tare / Zero
 const handleTareZero = () => {
 setIsSamplingZero(true);
 if (isConnected) {
 onSendSerialCommand('CAL_ZERO');
 }
 setTimeout(() => {
 setZeroOffsets([state.x, state.y, state.z, state.rx, state.ry, state.rz]);
 setIsSamplingZero(false);
 }, 1500);
 };

 // Step 2: Continuous Live Range Envelope Tracker
 React.useEffect(() => {
   if (currentStep === 2) {
     const currentValues = [state.x, state.y, state.z, state.rx, state.ry, state.rz];
     setCapturedMins((prev) => prev.map((min, i) => Math.min(min, currentValues[i])));
     setCapturedMaxs((prev) => prev.map((max, i) => Math.max(max, currentValues[i])));
   }
 }, [state, currentStep]);

 const handleResetLimits = () => {
   const currentValues = [state.x, state.y, state.z, state.rx, state.ry, state.rz];
   setCapturedMins([...currentValues]);
   setCapturedMaxs([...currentValues]);
 };

 const handleGoToStep2 = () => {
   const currentValues = [state.x, state.y, state.z, state.rx, state.ry, state.rz];
   setCapturedMins([...currentValues]);
   setCapturedMaxs([...currentValues]);
   setCurrentStep(2);
 };

 const handleFinishCalibration = () => {
 const newCal: CalibrationData = {
 zeroOffsets,
 minDeflections: capturedMins,
 maxDeflections: capturedMaxs,
 matrixDecoupling: mappedMatrix,
 calibrationDate: new Date().toLocaleDateString(),
 isCalibrated: true,
 };
 onSaveCalibration(newCal);
 if (isConnected) {
 onSendSerialCommand('SAVE_EEPROM');
 }
 try {
 localStorage.setItem('oofo_calibration', JSON.stringify(newCal));
 } catch (e) {
 console.warn("Failed to save calibration to local storage:", e);
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
 {[1, 2, 3, 4, 5].map((step) => (
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
 {['ax', 'ay', 'az', 'gx', 'gy', 'gz'].map((label, idx) => {
 const cur = [state.x, state.y, state.z, state.rx, state.ry, state.rz][idx];
 return (
 <div key={idx} className="p-3 bg-[#050608] rounded-lg border border-[#1e2632] text-center">
 <div className="text-xs font-semibold text-zinc-400 uppercase ">Axis {label}</div>
 <div className="text-sm font-semibold text-blue-400 my-1">{cur.toFixed(2)}</div>
 <div className="text-xs text-zinc-500 ">Zero: {zeroOffsets[idx] ? zeroOffsets[idx].toFixed(2) : '0.00'}</div>
 </div>
 );
 })}
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
  onClick={handleGoToStep2}
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
  <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
  <div className="flex items-center justify-between gap-3">
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

  <button
  onClick={handleResetLimits}
  className="px-3 py-1.5 rounded-lg bg-[#141a23] border border-[#1e2632] hover:border-blue-400 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
  title="Reset captured min/max envelope limits to current resting values"
  >
  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
  <span>Reset Limits</span>
  </button>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  {['Accel X (Pan L/R)', 'Accel Y (Pan U/D)', 'Accel Z (Zoom Dolly)', 'Gyro X (Pitch Tilt)', 'Gyro Y (Roll Bank)', 'Gyro Z (Yaw Twist)'].map((label, idx) => {
  const min = capturedMins[idx];
  const max = capturedMaxs[idx];
  const cur = [state.x, state.y, state.z, state.rx, state.ry, state.rz][idx] || 0;
  const span = max - min;
  return (
  <div key={idx} className="p-4 bg-[#050608] rounded-xl border border-[#1e2632] space-y-2">
  <div className="flex items-center justify-between text-xs ">
  <span className="font-semibold text-zinc-300">{label}</span>
  <span className="text-blue-400 font-semibold">Span: {span.toFixed(2)}</span>
  </div>
  <div className="h-2 bg-[#090c10] rounded-full overflow-hidden border border-[#1e2632] relative">
  <div
  className="h-full bg-blue-600 rounded-full transition-all glow-cyan-sm"
  style={{ width: `${Math.min(100, Math.max(0, ((cur - min) / Math.max(0.001, span)) * 100))}%` }}
  />
  </div>
  <div className="flex justify-between text-xs text-zinc-500 ">
  <span>Min: {min.toFixed(2)}</span>
  <span>Cur: {cur.toFixed(2)}</span>
  <span>Max: {max.toFixed(2)}</span>
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
  <span>NEXT: AXIS MAPPING</span>
  <ArrowRight className="w-3.5 h-3.5 text-black" />
  </button>
  </div>
  </div>
 )}

 {/* STEP 3: Axis Mapping */}
 {currentStep === 3 && (
  <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
  <div className="flex items-center gap-3">
  <div className="p-2.5 rounded-lg bg-orange-950/80 border border-orange-500/40 text-orange-400 glow-orange-sm">
  <SlidersHorizontal className="w-6 h-6" />
  </div>
  <div>
  <h3 className="text-sm font-semibold text-white ">STEP 3: SOFTWARE ORIENTATION ALIGNMENT</h3>
  <p className="text-xs text-zinc-400 ">
  Manually dial in your hardware's physical orientation. Adjust these angles to match the real-world mounting.
  </p>
  </div>
  </div>
 
  <div className="p-5 rounded-xl bg-[#050608] border border-[#1e2632] space-y-6">
    {/* Euler Angle Sliders */}
    <div className="space-y-4">
      {[
        { label: 'Yaw Offset (Z-Axis Spin)', value: eulerAngles.yaw, setter: (val: number) => onEulerChange({ ...eulerAngles, yaw: val }) },
        { label: 'Pitch Offset (X-Axis Tilt)', value: eulerAngles.pitch, setter: (val: number) => onEulerChange({ ...eulerAngles, pitch: val }) },
        { label: 'Roll Offset (Y-Axis Tilt)', value: eulerAngles.roll, setter: (val: number) => onEulerChange({ ...eulerAngles, roll: val }) }
      ].map((axis, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-zinc-300">
            <span>{axis.label}</span>
            <span className="text-blue-400">{axis.value}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={axis.value}
            onChange={(e) => axis.setter(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>-180°</span>
            <span>0°</span>
            <span>+180°</span>
          </div>
        </div>
      ))}
    </div>

    {/* Polarity Inversions */}
    <div className="pt-4 border-t border-[#1e2632] space-y-3">
      <div className="text-xs font-semibold text-zinc-400">HARDWARE POLARITY INVERSION (FLIP AXIS)</div>
        <div className="flex gap-4">
          {[
            { label: 'Invert X (Left/Right)', val: invertAxes.x, set: (v: boolean) => onInvertChange({ ...invertAxes, x: v }) },
            { label: 'Invert Y (Fwd/Back)', val: invertAxes.y, set: (v: boolean) => onInvertChange({ ...invertAxes, y: v }) },
            { label: 'Invert Z (Up/Down)', val: invertAxes.z, set: (v: boolean) => onInvertChange({ ...invertAxes, z: v }) }
          ].map((inv, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inv.val} onChange={(e) => inv.set(e.target.checked)} className="w-4 h-4 rounded border-[#2a3441] bg-[#0d1117] text-blue-500 focus:ring-blue-500/50" />
              <span className="text-sm font-medium text-zinc-300">{inv.label}</span>
            </label>
          ))}
        </div>
    </div>
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
  <span>NEXT: NOISE & HYSTERESIS</span>
  <ArrowRight className="w-3.5 h-3.5 text-black" />
  </button>
  </div>
  </div>
 )}

 {/* STEP 4: Noise Floor */}
 {currentStep === 4 && (
 <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-green-300 text-blue-400 glow-emerald-sm">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-white ">STEP 4: NOISE FLOOR & RECOMMENDED DEADBANDS</h3>
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
 onClick={() => setCurrentStep(3)}
 className="px-4 py-2 rounded-lg bg-[#050608] border border-[#1e2632] text-zinc-300 hover:text-white text-xs font-semibold "
 >
 BACK
 </button>
 <button
 onClick={() => setCurrentStep(5)}
 className="neo-button-primary"
 >
 <span>NEXT: DECOUPLING MATRIX & SAVE</span>
 <ArrowRight className="w-3.5 h-3.5 text-black" />
 </button>
 </div>
 </div>
 )}

 {/* STEP 5: Save & Flash */}
 {currentStep === 5 && (
 <div className="p-6 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-5 shadow-xl">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-blue-500/40 text-blue-400 glow-cyan-sm">
 <Save className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-white ">STEP 5: COMMIT CALIBRATION TO ESP32 FLASH (NVS)</h3>
 <p className="text-xs text-zinc-400 ">
 Write zero offsets, deflections, and the axis mapping matrix directly to ESP32 non-volatile storage.
 </p>
 </div>
 </div>

 <div className="p-4 bg-[#050608] rounded-xl border border-[#1e2632] text-xs text-zinc-300 space-y-1">
 <div className="text-blue-400 font-semibold mb-2">// Calibration Payload Ready:</div>
 <div><span className="text-zinc-500">Zeros:</span> [{zeroOffsets.map(v => v.toFixed(2)).join(', ')}]</div>
 <div><span className="text-zinc-500">Min Envelope:</span> [{capturedMins.map(v => v.toFixed(2)).join(', ')}]</div>
 <div><span className="text-zinc-500">Max Envelope:</span> [{capturedMaxs.map(v => v.toFixed(2)).join(', ')}]</div>
 <div className="mt-2 text-zinc-500">Axis Mapping Matrix:</div>
 {mappedMatrix.map((row, i) => (
   <div key={i} className="pl-4 text-emerald-400">
     [{row.map(v => v.toFixed(1).padStart(4, ' ')).join(', ')}]
   </div>
 ))}
 </div>

 {savedSuccess && (
 <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500 text-blue-400 text-xs font-semibold flex items-center gap-2 glow-emerald-sm">
 <CheckCircle2 className="w-4 h-4 text-blue-400" />
 <span>CALIBRATION COMMITTED & SAVED TO ESP32 FLASH NVS</span>
 </div>
 )}

 <div className="flex items-center justify-between pt-3 border-t border-[#1e2632]">
 <button
 onClick={() => setCurrentStep(4)}
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
