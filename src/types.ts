export type AppTarget = 'fusion360' | 'blender' | 'solidworks' | 'freecad' | 'bambu' | 'custom';

export type CurveType = 'linear' | 'exponential' | 'quadratic' | 's_curve';

export interface AxisParameters {
  deadzone: number; // 0 to 50 (%)
  sensitivity: number; // 0.1 to 5.0 (multiplier)
  inverted: boolean;
  curve: CurveType;
  expoPower: number; // 1.0 to 4.0
  minRaw: number;
  maxRaw: number;
  centerRaw: number;
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
  | 'profile_switch'
  | 'battery_indicator';

export interface ButtonMapping {
  id: string;
  pinNumber: number;
  label: string;
  actionType: ActionType;
  keyCombo?: string[]; // e.g. ['Control', 'Shift', 'Z'] or ['F6']
  cadActionName?: string; // e.g. 'Fit View', 'Orbit Mode', 'Extrude', 'Look At'
  mouseButton?: 'left' | 'right' | 'middle' | 'wheel_up' | 'wheel_down';
  description: string;
  color?: string;
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
}

export type LightSleepLedBehavior = 'dim_slow_breathe' | 'single_pulse_beacon' | 'off';

export interface TriangularSpringFlexureConfig {
  flexureGeometry: 'triangular_6_spring_parallel'; // Stewart/Delta-derived paired compression/tension springs
  springRateStiffness: number; // 0.1 to 3.0 (compliance factor)
  radialSymmetryDeg: number; // 120 deg 3-post equilateral geometry
  shearTiltDecoupling: number; // 0.0 to 1.0 (decouple lateral translation X/Y from tilt Rx/Ry)
  axialZPreloadComp: number; // 0.0 to 1.0 (vertical compression/tension balance)
  torsionYawDamping: number; // 0.5 to 0.99 (spring leaky center return)
}

export interface PowerManagementConfig {
  batteryCapacityMah: number; // e.g. 4200 mAh (AKZYTUE LiPo 3.7V)
  enableLightSleep: boolean; // default true
  lightSleepTimeoutMin: number; // default 15 minutes
  lightSleepLedMode: LightSleepLedBehavior;
  lightSleepCpuFreqMhz: number; // e.g. 80 MHz (down from 240 MHz)
  enableDeepSleep: boolean; // default true
  deepSleepTimeoutMin: number; // default 60 minutes
  wakeOnMotionThreshold: number; // 1 to 50 (sensitivity threshold for MPU6050 WOM)
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
  triangularFlexure?: TriangularSpringFlexureConfig;
  hapticFeedback: boolean;
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
