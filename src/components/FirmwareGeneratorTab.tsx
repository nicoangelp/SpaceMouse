import React, { useState } from 'react';
import { FirmwareConfig, Profile, Esp32Chip, SensorArchitecture, FirmwareMode } from '../types';
import { generateEsp32Firmware, generatePlatformioIni } from '../data/firmwareTemplates';
import { Cpu, Download, Copy, Check, Terminal, CircuitBoard, Sparkles, AlertTriangle, Layers } from 'lucide-react';

interface FirmwareGeneratorTabProps {
  profile: Profile;
}

export const FirmwareGeneratorTab: React.FC<FirmwareGeneratorTabProps> = ({ profile }) => {
  const [config, setConfig] = useState<FirmwareConfig>({
    chip: 'esp32_wroom',
    sensorType: 'imu_mpu6050_spring',
    firmwareMode: 'ble_gamepad_3d',
    baudRate: 115200,
    adcSamplingRateHz: 100,
    analogPins: [32, 33, 34, 35, 36, 39],
    buttonPins: [13, 12, 14, 27, 26, 25, 33, 32, 4], // 9 Treedix Switches
    neopixelPin: 15, // Adafruit 24 NeoPixel Ring
    neopixelCount: 24,
    i2cSdaPin: 21,
    i2cSclPin: 22,
    enableOledDisplay: false,
    enableEepromSave: true,
  });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedIni, setCopiedIni] = useState<boolean>(false);
  const [viewFile, setViewFile] = useState<'cpp' | 'ini' | 'wiring'>('cpp');

  const generatedCpp = generateEsp32Firmware(config, profile);
  const generatedIni = generatePlatformioIni(config);

  const handleCopy = (text: string, type: 'cpp' | 'ini') => {
    navigator.clipboard.writeText(text);
    if (type === 'cpp') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedIni(true);
      setTimeout(() => setCopiedIni(false), 2000);
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>ESP32 FIRMWARE GENERATOR & C++ SOURCE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Generates turnkey C++ Arduino/PlatformIO firmware with native USB 3D SpaceMouse HID report descriptors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('SpaceMouse_ESP32.ino', generatedCpp)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold font-mono shadow-md glow-cyan-sm transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>DOWNLOAD .INO</span>
          </button>
          <button
            onClick={() => handleDownload('platformio.ini', generatedIni)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#050608] hover:border-slate-700 text-slate-200 text-xs font-bold font-mono border border-[#1e2632] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD PLATFORMIO.INI</span>
          </button>
        </div>
      </div>

      {/* Hardware Configuration Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0a0d12] p-5 rounded-xl border border-[#1e2632] shadow-xl">
        {/* Chip Model */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 font-mono">Target Microcontroller</label>
          <select
            value={config.chip}
            onChange={(e) => {
              const chip = e.target.value as Esp32Chip;
              setConfig({
                ...config,
                chip,
                firmwareMode: chip.includes('s2') || chip.includes('s3') ? 'native_tinyusb_spacemouse' : 'ble_gamepad_3d',
                analogPins: chip === 'esp32_s3' ? [1, 2, 3, 4, 5, 6] : [32, 33, 34, 35, 36, 39],
              });
            }}
            className="w-full px-3 py-2 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="esp32_s3">ESP32-S3 (Recommended: Native USB-OTG + Dual Core)</option>
            <option value="esp32_s2">ESP32-S2 (Native USB-OTG)</option>
            <option value="esp32_wroom">ESP32-WROOM / ESP32-D0WD (Bluetooth BLE / Serial)</option>
            <option value="esp32_c3">ESP32-C3 (RISC-V USB-CDC)</option>
          </select>
        </div>

        {/* Sensor Architecture */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 font-mono">Sensor Hardware Type</label>
          <select
            value={config.sensorType}
            onChange={(e) => {
              const sensorType = e.target.value as SensorArchitecture;
              if (sensorType === 'imu_mpu6050_spring') {
                setConfig({
                  ...config,
                  sensorType,
                  buttonPins: [13, 12, 14, 27, 26, 25, 33, 32, 4],
                  neopixelPin: 15,
                  neopixelCount: 24,
                  i2cSdaPin: 21,
                  i2cSclPin: 22,
                });
              } else {
                setConfig({ ...config, sensorType });
              }
            }}
            className="w-full px-3 py-2 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="imu_mpu6050_spring">MPU-6050 IMU on Spring Knob (Your Custom Build)</option>
            <option value="hall_array_ss49e">6x Linear Hall Sensors (SS49E / AH49E + Magnets)</option>
            <option value="dual_joysticks">Dual 2-Axis Analog Joysticks (4 ADC channels)</option>
            <option value="imu_mpu6050_joystick">MPU6050 Gyro/Accel + Joystick</option>
            <option value="as5600_magnetic_encoders">AS5600 12-Bit Magnetic Angle Sensors</option>
          </select>
        </div>

        {/* Firmware Protocol Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 font-mono">Emulation Protocol</label>
          <select
            value={config.firmwareMode}
            onChange={(e) => setConfig({ ...config, firmwareMode: e.target.value as FirmwareMode })}
            className="w-full px-3 py-2 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="native_tinyusb_spacemouse">3Dconnexion Multi-Axis HID (Native USB)</option>
            <option value="composite_hid_mouse_kbd">Composite Keyboard + Mouse Injection</option>
            <option value="ble_gamepad_3d">Bluetooth BLE 6-DOF Wireless Controller</option>
            <option value="serial_companion_bridge">High-Speed Serial JSON Bridge</option>
          </select>
        </div>
      </div>

      {/* Code / Wiring Tabs */}
      <div className="bg-[#06080c] rounded-xl border border-[#1e2632] overflow-hidden shadow-xl">
        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0d12] border-b border-[#1e2632]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewFile('cpp')}
              className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-all ${
                viewFile === 'cpp'
                  ? 'bg-cyan-950/80 border border-cyan-500 text-cyan-300 glow-cyan-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              src/main.cpp (C++)
            </button>
            <button
              onClick={() => setViewFile('ini')}
              className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-all ${
                viewFile === 'ini'
                  ? 'bg-cyan-950/80 border border-cyan-500 text-cyan-300 glow-cyan-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              platformio.ini
            </button>
            <button
              onClick={() => setViewFile('wiring')}
              className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-all ${
                viewFile === 'wiring'
                  ? 'bg-cyan-950/80 border border-cyan-500 text-cyan-300 glow-cyan-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Wiring & Schematics
            </button>
          </div>

          {viewFile !== 'wiring' && (
            <button
              onClick={() => handleCopy(viewFile === 'cpp' ? generatedCpp : generatedIni, viewFile === 'cpp' ? 'cpp' : 'ini')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#050608] border border-[#1e2632] hover:border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
            >
              {(viewFile === 'cpp' ? copiedCode : copiedIni) ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>COPY CODE</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Code Viewport */}
        {viewFile === 'cpp' && (
          <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#050608] select-text">
            <pre className="whitespace-pre">{generatedCpp}</pre>
          </div>
        )}

        {viewFile === 'ini' && (
          <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#050608] select-text">
            <pre className="whitespace-pre">{generatedIni}</pre>
          </div>
        )}

        {viewFile === 'wiring' && (
          <div className="p-6 space-y-6 bg-[#050608] text-xs text-slate-300">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 font-mono">
              <CircuitBoard className="w-5 h-5" />
              <span>WIRING GUIDE & ELECTRICAL SCHEMATICS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0a0d12] border border-cyan-500/40 space-y-2">
                <h4 className="font-bold text-cyan-300 font-mono">1. MPU-6050 6-Axis IMU (I2C)</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
                  <li><strong>VCC:</strong> 3.3V (or 5V if 5V tolerant board).</li>
                  <li><strong>GND / AD0:</strong> Common GND (Sets I2C address to 0x68).</li>
                  <li><strong>SDA:</strong> ESP32 <strong>GPIO 21</strong> (400kHz fast I2C).</li>
                  <li><strong>SCL:</strong> ESP32 <strong>GPIO 22</strong> (400kHz fast I2C).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0a0d12] border border-emerald-500/40 space-y-2">
                <h4 className="font-bold text-emerald-300 font-mono">2. Treedix 9-Key Mechanical Keypad</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
                  <li>Keys 1-9 to GPIOs: <strong className="text-emerald-400">13, 12, 14, 27, 26, 25, 33, 32, 4</strong>.</li>
                  <li>Common pin: Connect to <strong>GND</strong> (firmware uses INPUT_PULLUP).</li>
                  <li>Key 9 serves as instantaneous zero-drift Tare reset.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0a0d12] border border-purple-500/40 space-y-2">
                <h4 className="font-bold text-purple-300 font-mono">3. Adafruit 24 RGB NeoPixel Ring</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
                  <li><strong>DI (Data In):</strong> Connect to <strong>GPIO 15</strong>.</li>
                  <li><strong>5V / VDD:</strong> Connect to TP4056 Switched 5V rail.</li>
                  <li><strong>GND:</strong> Common GND.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0a0d12] border border-amber-500/40 space-y-2">
                <h4 className="font-bold text-amber-300 font-mono">4. TP4056 + 4200mAh LiPo Power</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
                  <li>Battery JST connector to TP4056 <strong>B+</strong> and <strong>B-</strong>.</li>
                  <li>TP4056 <strong>OUT+</strong> via SPDT switch to ESP32 <strong>VIN (5V)</strong>.</li>
                  <li>TP4056 <strong>OUT-</strong> to ESP32 <strong>GND</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
