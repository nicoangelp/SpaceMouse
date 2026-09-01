export type AppTarget = 'fusion360' | 'blender' | 'solidworks' | 'freecad' | 'bambu' | 'desktop' | 'custom';

export type CurveType = 'linear' | 'exponential' | 'quadratic' | 's_curve';

export type AxisOutputMode = 
  | 'cad_6dof' // Standard 3D 6-DOF Orbit/Pan/Zoom
  | 'media_volume' // Twist / Deflect for Volume Up (+) / Volume Down (-)
  | 'media_track' // Deflect for Next Track (+) / Previous Track (-)
  | 'mouse_scroll' // Vertical / Horizontal scroll wheel
  | 'keystroke_repeat' // Deflection repeats key combo (e.g. Left/Right arrow, Timeline scrub, Zoom)
  | 'custom_hotkey_bidirectional'; // Positive deflection = Key Combo A, Negative deflection = Key Combo B

export interface AxisParameters {
  deadzone: number; // 0 to 50 (%)
  sensitivity: number; // 0.1 to 5.0 (multiplier)
  inverted: boolean;
  curve: CurveType;
  expoPower: number; // 1.0 to 4.0
  minRaw: number;
  maxRaw: number;
  centerRaw: number;
  // Universal Joystick & Axis Output Mapping
  outputMode?: AxisOutputMode;
  positiveActionName?: string;
  positiveKeyCombo?: string[];
  negativeActionName?: string;
  negativeKeyCombo?: string[];
  repeatRateMs?: number; // 20ms to 500ms
}

export interface SixDofAxesConfig {
  x: AxisParameters; // Pan Left / Right
  y: AxisParameters; // Pan Up / Down (or Forward/Back depending on CAD)
  z: AxisParameters; // Zoom In / Out (Pull / Push)
  rx: AxisParameters; // Pitch (Tilt Forward / Backward)
  ry: AxisParameters; // Roll (Tilt Left / Right)
  rz: AxisParameters; // Yaw (Twist Left / Right)
}

export interface GlobalFilterConfig {
  smoothingAlpha: number; // 0.05 (heavy smooth) to 1.0 (instant raw)
  jitterThreshold: number; // 0 to 10
  lockPan: boolean;
  lockRotation: boolean;
  dominantAxisOnly: boolean; // only move strongest axis if enabled
  precisionMultiplier: number; // shift multiplier (e.g. 0.25x when precision button held)
}

export type ActionType = 
  | 'key_combo' 
  | 'keyCombo'
  | 'cad_action' 
  | 'mouse_action' 
  | 'axis_lock' 
  | 'precision_mode' 
  | 'zero_tare' 
  | 'radial_menu' 
  | 'profile_cycle_next' // Next Profile on ESP32 Flash with LED spin
  | 'profile_cycle_prev' // Previous Profile on ESP32 Flash
  | 'profile_switch'     // Alias for profile cycling
  | 'battery_indicator'  // 24-LED ring fuel gauge for 3.5s
  | 'ble_pairing_mode'   // Enter Bluetooth discoverable mode
  | 'toggle_lights'      // Toggle LED ring ON/OFF
  | 'cycle_brightness'   // Cycle LED ring brightness (100% -> 75% -> 50% -> 25% -> wrap)
  | 'toggle_dominant_axis' // Toggle dominant axis isolation
  | 'reboot_esp32'       // Soft reboot ESP32
  | 'ble_disconnect_all' // Disconnect / clear bonded BLE devices
  | 'reset_center'
  | 'disabled';

export interface SavedCombo {
  id: string;
  name: string;
  category: 'windows' | 'media' | 'web' | 'cad' | 'custom';
  keys: string[];
  description?: string;
}

export interface ButtonMapping {
  id: string;
  pinNumber: number;
  gridPosition?: number; // 0 to 8 (Key 1 to Key 9 in 3x3 layout)
  label: string;
  // Tap Action
  actionType: ActionType;
  keyCombo?: string[]; // e.g. ['Control', 'Shift', 'Z'] or ['F6']
  cadActionName?: string; // e.g. 'Fit View', 'Orbit Mode', 'Extrude', 'Look At'
  mouseButton?: 'left' | 'right' | 'middle' | 'wheel_up' | 'wheel_down';
  description: string;
  color?: string;
  // Hold-down Action (e.g. hold for 0.8s)
  holdActionType?: ActionType;
  holdKeyCombo?: string[];
  holdCadActionName?: string;
  holdDescription?: string;
  holdThresholdMs?: number; // default 600ms
  radialOptions?: Array<{ label: string; keyCombo: string[]; iconName: string }>;
}

export type IdleAnimationType = 
  | 'breathing' 
  | 'spinning' 
  | 'two_halves_bouncing' 
  | 'sweeping' 
  | 'rainbow_cycle' 
  | 'comet_tail' 
  | 'static_solid' 
  | 'custom_per_led';

export type ActiveAnimationType = 
  | 'rotational_twist_swirl' 
  | 'deflection_brightness' 
  | 'axis_angle_spectrum' 
  | 'velocity_pulse' 
  | 'orbit_chase' 
  | 'match_idle';

export interface LedRingConfig {
  brightness: number; // 0 to 100 (%)
  primaryColor: string; // Hex color (e.g. #00e5ff)
  secondaryColor: string; // Hex color (e.g. #ff007f)
  accentColor: string; // Hex color (e.g. #ffaa00)
  idleAnimation: IdleAnimationType;
  idleSpeed: number; // 1 to 10 (speed multiplier)
  activeAnimation: ActiveAnimationType;
  activeSpeed: number; // 1 to 10
  individualLeds: string[]; // Array of 24 hex color strings
  ledCount: number; // 24 for Adafruit NeoPixel ring
  rotationOffsetDeg: number; // 0, 15, 30, 45, 90, 180, etc. (or LED index offset 0-23) to orient top LED in software
  rotationLedOffset: number; // 0 to 23 (LED shift index for hardware alignment)
}

export type LightSleepLedBehavior = 'dim_slow_breathe' | 'single_pulse_beacon' | 'off';

export interface PowerManagementConfig {
  batteryCapacityMah: number; // e.g. 4200 mAh (AKZYTUE LiPo 3.7V)
  enableLightSleep: boolean; // default true
  lightSleepTimeoutMin: number; // default 15 minutes
  lightSleepLedMode: LightSleepLedBehavior;
  lightSleepCpuFreqMhz: number; // e.g. 80 MHz (down from 240 MHz)
  enableDeepSleep: boolean; // default true
  deepSleepTimeoutMin: number; // default 60 minutes
  wakeOnButtons: boolean; // true - any of 9 buttons wakes immediately
  autoReconnectBle: boolean; // true - quick resume without re-pairing
  // Battery Sensing with 2x 100k Ohm Voltage Divider
  enableBatterySense: boolean; // default true
  batteryAdcPin: number; // default GPIO 35 (ADC1_CH7 on ESP32)
  voltageDividerR1Kohm: number; // 100 kOhm
  voltageDividerR2Kohm: number; // 100 kOhm
  batteryMinVoltage: number; // 3.2V (0% empty)
  batteryMaxVoltage: number; // 4.2V (100% full charge)
  batteryHotkeyHoldSec: number; // e.g. 1.0 second hold-down
  batteryHotkeyButtonIndex: number; // default button index (e.g. 8 for Key 9 Center or configurable)
  batteryIndicatorDisplaySec: number; // 3.5s LED fuel gauge overlay
}

export interface Profile {
  id: string;
  name: string;
  targetApp: AppTarget;
  description: string;
  axes: SixDofAxesConfig;
  filters: GlobalFilterConfig;
  buttons: ButtonMapping[];
  ledColor: string; // Hex color for ESP32 status LED ring (Neopixel)
  ledRing?: LedRingConfig;
  powerManagement?: PowerManagementConfig;
  decouplingMatrix?: number[][]; // 6x6 matrix for cross-talk cancellation
}

export interface SixDofState {
  x: number; // Normalized -1.0 to +1.0
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  rawAdc: number[]; // e.g. [1820, 1850, 1790, 1840, 1810, 1800]
  buttonsPressed: boolean[]; // Array of button states
  timestamp: number;
}

export type Esp32Chip = 'esp32_s3' | 'esp32_s2' | 'esp32_wroom' | 'esp32_c3';

export type SensorArchitecture = 
  | 'hall_array_ss49e' // 4 to 6 Linear Hall effect sensors around magnets
  | 'imu_mpu6050_spring' // MPU6050 6-axis gyro/accel inside spring-loaded knob
  | 'imu_mpu6050_joystick' // MPU6050 6-axis gyro/accel + 2-axis joystick
  | 'dual_joysticks' // 2x 2-axis analog joysticks (4 analog channels)
  | 'as5600_magnetic_encoders'; // I2C 12-bit magnetic angle sensors

export type FirmwareMode = 
  | 'native_tinyusb_spacemouse' // True 3Dconnexion HID multi-axis descriptor (ESP32-S2 / S3 only)
  | 'composite_hid_mouse_kbd' // Keyboard + Mouse injection (Works on all CAD apps)
  | 'ble_gamepad_3d' // Bluetooth BLE for wireless operation
  | 'serial_companion_bridge'; // High-speed Serial/WebSocket to companion Python/Node daemon

export interface FirmwareConfig {
  chip: Esp32Chip;
  sensorType: SensorArchitecture;
  firmwareMode: FirmwareMode;
  baudRate: number;
  adcSamplingRateHz: number;
  analogPins: number[];
  buttonPins: number[];
  neopixelPin: number;
  neopixelCount: number;
  i2cSdaPin: number;
  i2cSclPin: number;
  enableOledDisplay: boolean;
  enableEepromSave: boolean;
}

export interface CalibrationData {
  zeroOffsets: number[];
  minDeflections: number[];
  maxDeflections: number[];
  matrixDecoupling: number[][]; // 6x6 matrix for sensor cross-talk cancellation
  calibrationDate?: string;
  isCalibrated: boolean;
}
