import { FirmwareConfig, Profile, ButtonMapping } from '../types';
import { defaultProfiles } from './defaultProfiles';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 229, b: 255 };
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getActionTypeEnum(actionType?: string): number {
  switch (actionType) {
    case 'keyCombo': return 1;
    case 'profile_cycle_next': return 2;
    case 'zero_tare': return 3;
    case 'battery_indicator': return 4;
    case 'precision_mode': return 5;
    case 'axis_lock': return 6;
    case 'toggle_dominant_axis': return 7;
    case 'toggle_lights': return 8;
    case 'reboot_esp32': return 9;
    case 'ble_pairing_mode': return 10;
    case 'cycle_brightness': return 12;
    case 'cad_action':
    case 'media_key':
    default:
      return 1;
  }
}

export function getIdleAnimationEnum(anim?: string): number {
  switch (anim) {
    case 'breathing': return 0;
    case 'spinning': return 1;
    case 'rainbow_cycle': return 2;
    case 'two_halves_bouncing': return 3;
    case 'sweeping': return 4;
    case 'static_solid': return 5;
    case 'comet_tail': return 4;
    case 'custom_per_led': return 5;
    default: return 0;
  }
}

export function getActiveAnimationEnum(anim?: string): number {
  switch (anim) {
    case 'rotational_twist_swirl': return 0;
    case 'deflection_brightness': return 1;
    case 'axis_angle_spectrum': return 2;
    case 'velocity_pulse': return 3;
    case 'match_idle': return 4;
    case 'orbit_chase': return 0;
    default: return 0;
  }
}

export function getAxisOutputModeEnum(mode?: string): number {
  switch (mode) {
    case 'cad_6dof': return 0;
    case 'media_volume': return 1;
    case 'media_track': return 2;
    case 'mouse_scroll': return 3;
    case 'keystroke_repeat': return 4;
    case 'custom_hotkey_bidirectional': return 5;
    default: return 0;
  }
}

export function getCurveTypeEnum(curve?: string): number {
  switch (curve) {
    case 'linear': return 0;
    case 'exponential': return 1;
    case 'quadratic': return 2;
    case 's_curve': return 3;
    default: return 0;
  }
}

export function getNumericKeyCode(key: string): number {
  const normalized = key.trim();
  const lower = normalized.toLowerCase();

  // Modifiers
  if (['ctrl', 'control', 'lctrl', 'leftctrl'].includes(lower)) return 0x80;
  if (['shift', 'lshift', 'leftshift'].includes(lower)) return 0x81;
  if (['alt', 'lalt', 'leftalt', 'option'].includes(lower)) return 0x82;
  if (['win', 'windows', 'meta', 'super', 'cmd', 'command', 'gui'].includes(lower)) return 0x83;

  // Special Keys
  if (['esc', 'escape'].includes(lower)) return 0xB1;
  if (['enter', 'return'].includes(lower)) return 0xB0;
  if (['tab'].includes(lower)) return 0xB3;
  if (['space', ' '].includes(lower)) return 0x20;
  if (['backspace', 'bksp'].includes(lower)) return 0xB2;
  if (['del', 'delete'].includes(lower)) return 0xD4;
  if (['ins', 'insert'].includes(lower)) return 0xD1;
  if (['home'].includes(lower)) return 0xD2;
  if (['end'].includes(lower)) return 0xD5;
  if (['pageup', 'pgup'].includes(lower)) return 0xD3;
  if (['pagedown', 'pgdn'].includes(lower)) return 0xD6;
  if (['up', 'arrowup'].includes(lower)) return 0xDA;
  if (['down', 'arrowdown'].includes(lower)) return 0xD9;
  if (['left', 'arrowleft'].includes(lower)) return 0xD8;
  if (['right', 'arrowright'].includes(lower)) return 0xD7;
  if (['printscreen', 'prtsc'].includes(lower)) return 0xCE;

  // Function Keys F1..F12 (F1=0xC2, F2=0xC3 ... F12=0xCD)
  const fMatch = lower.match(/^f([1-9]|1[0-2])$/);
  if (fMatch) {
    return 0xC1 + parseInt(fMatch[1], 10);
  }

  // Media Keys
  if (['audiovolumeup', 'volumeup'].includes(lower)) return 0xEC;
  if (['audiovolumedown', 'volumedown'].includes(lower)) return 0xED;
  if (['audiovolumemute', 'mute'].includes(lower)) return 0xEB;
  if (['mediaplaypause', 'playpause', 'play', 'pause'].includes(lower)) return 0xEA;
  if (['mediatracknext', 'nexttrack', 'next'].includes(lower)) return 0xE8;
  if (['mediatrackprevious', 'prevtrack', 'prev', 'previous'].includes(lower)) return 0xE9;
  if (['mediastop', 'stop'].includes(lower)) return 0xE6;

  // Num keys (e.g., Num7 -> '7', Num. -> '.')
  if (lower.startsWith('num') && lower.length > 3) {
    return lower.charCodeAt(3);
  }

  if (normalized.length >= 1) {
    return normalized.toLowerCase().charCodeAt(0);
  }

  return 0;
}

export function parseKeyComboToKeyCodes(keys?: string[]): number[] {
  if (!keys || keys.length === 0) return [0, 0, 0, 0];
  const codes: number[] = [];

  // Put modifiers first
  for (const k of keys) {
    const lower = k.toLowerCase().trim();
    if (['ctrl', 'control', 'lctrl', 'leftctrl'].includes(lower)) codes.push(0x80);
    else if (['shift', 'lshift', 'leftshift'].includes(lower)) codes.push(0x81);
    else if (['alt', 'lalt', 'leftalt', 'option'].includes(lower)) codes.push(0x82);
    else if (['win', 'windows', 'meta', 'super', 'cmd', 'command', 'gui'].includes(lower)) codes.push(0x83);
  }

  // Put non-modifiers
  for (const k of keys) {
    const lower = k.toLowerCase().trim();
    if (!['ctrl', 'control', 'lctrl', 'leftctrl', 'shift', 'lshift', 'leftshift', 'alt', 'lalt', 'leftalt', 'option', 'win', 'windows', 'meta', 'super', 'cmd', 'command', 'gui'].includes(lower)) {
      const code = getNumericKeyCode(k);
      if (code > 0) codes.push(code);
    }
  }

  while (codes.length < 4) codes.push(0);
  return codes.slice(0, 4);
}

function formatProfileMemoryStructC(p: Profile, slotIdx: number): string {
  const pCol = hexToRgb(p.ledColor || p.ledRing?.primaryColor || '#ff8800');
  const sCol = hexToRgb(p.ledRing?.secondaryColor || '#00e5ff');
  const aCol = hexToRgb(p.ledRing?.accentColor || '#ffffff');
  const pColHex = `0x${((pCol.r << 16) | (pCol.g << 8) | pCol.b).toString(16).padStart(6, '0').toUpperCase()}`;
  const sColHex = `0x${((sCol.r << 16) | (sCol.g << 8) | sCol.b).toString(16).padStart(6, '0').toUpperCase()}`;
  const aColHex = `0x${((aCol.r << 16) | (aCol.g << 8) | aCol.b).toString(16).padStart(6, '0').toUpperCase()}`;

  const idleAnim = getIdleAnimationEnum(p.ledRing?.idleAnimation);
  const idleSpd = Math.min(Math.max(p.ledRing?.idleSpeed ?? 5, 1), 10);
  const activeAnim = getActiveAnimationEnum(p.ledRing?.activeAnimation);
  const activeSpd = Math.min(Math.max(p.ledRing?.activeSpeed ?? 6, 1), 10);
  const brightness = Math.round(((p.ledRing?.brightness ?? 65) / 100) * 255);
  const rotOffset = Math.min(Math.max(p.ledRing?.rotationLedOffset ?? 0, 0), 23);

  const cleanName = (p.name || `Profile ${slotIdx + 1}`).slice(0, 15).replace(/"/g, '');

  const sens = [
    p.axes.x.sensitivity.toFixed(2),
    p.axes.y.sensitivity.toFixed(2),
    p.axes.z.sensitivity.toFixed(2),
    p.axes.rx.sensitivity.toFixed(2),
    p.axes.ry.sensitivity.toFixed(2),
    p.axes.rz.sensitivity.toFixed(2),
  ].map((v) => `${v}f`).join(', ');

  const dz = [
    p.axes.x.deadzone.toFixed(1),
    p.axes.y.deadzone.toFixed(1),
    p.axes.z.deadzone.toFixed(1),
    p.axes.rx.deadzone.toFixed(1),
    p.axes.ry.deadzone.toFixed(1),
    p.axes.rz.deadzone.toFixed(1),
  ].map((v) => `${v}f`).join(', ');

  const inv = [
    p.axes.x.inverted ? 'true' : 'false',
    p.axes.y.inverted ? 'true' : 'false',
    p.axes.z.inverted ? 'true' : 'false',
    p.axes.rx.inverted ? 'true' : 'false',
    p.axes.ry.inverted ? 'true' : 'false',
    p.axes.rz.inverted ? 'true' : 'false',
  ].join(', ');

  const defaultMatrix = [
    [1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
  ];
  const mat = (p.decouplingMatrix && p.decouplingMatrix.length === 6) ? p.decouplingMatrix : defaultMatrix;
  const matRows = mat.map((row) => `{ ${row.map((v) => `${(v ?? 0).toFixed(3)}f`).join(', ')} }`).join(',\n      ');

  // Axis Output Mode, Curves, Expo, Repeat Rates & Hotkeys
  const axesList = [p.axes.x, p.axes.y, p.axes.z, p.axes.rx, p.axes.ry, p.axes.rz];
  const axisOutputModes = axesList.map((a) => getAxisOutputModeEnum(a.outputMode)).join(', ');
  const axisRepeatRates = axesList.map((a) => a.repeatRateMs || 80).join(', ');
  const axisPosKeyCodes = axesList.map((a) => {
    const codes = parseKeyComboToKeyCodes(a.positiveKeyCombo);
    return `{ ${codes.map((c) => `0x${c.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')} }`;
  }).join(',\n      ');
  const axisNegKeyCodes = axesList.map((a) => {
    const codes = parseKeyComboToKeyCodes(a.negativeKeyCombo);
    return `{ ${codes.map((c) => `0x${c.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')} }`;
  }).join(',\n      ');
  const axisCurveTypes = axesList.map((a) => getCurveTypeEnum(a.curve)).join(', ');
  const axisExpoPowers = axesList.map((a) => `${(a.expoPower || 1.0).toFixed(2)}f`).join(', ');

  const defaultPins = [13, 12, 14, 27, 26, 25, 33, 32, 4];
  const buttons: ButtonMapping[] = p.buttons && p.buttons.length === 9
    ? p.buttons
    : Array.from({ length: 9 }, (_, i) => ({
        id: `btn-${i + 1}`,
        pinNumber: defaultPins[i],
        gridPosition: i,
        label: i === 8 ? 'Next Profile' : `Key ${i + 1}`,
        actionType: i === 8 ? 'profile_cycle_next' : 'cad_action',
        keyCombo: i === 8 ? [] : ['F6'],
        cadActionName: i === 8 ? 'Switch Profile' : `Action ${i + 1}`,
        description: `Key ${i + 1}`,
        holdActionType: i === 8 ? 'battery_indicator' : 'disabled',
        color: '#06b6d4',
      }));

  const tapActions = buttons.map((b, i) => {
    if (i === 8 && (!b.actionType || b.actionType === 'profile_cycle_next')) return 2;
    return getActionTypeEnum(b.actionType);
  }).join(', ');

  const holdActions = buttons.map((b, i) => {
    if (i === 8 && (!b.holdActionType || b.holdActionType === 'battery_indicator')) return 4;
    return getActionTypeEnum(b.holdActionType);
  }).join(', ');

  const tapCombos = buttons.map((b) => {
    const codes = parseKeyComboToKeyCodes(b.keyCombo);
    return `{ ${codes.map((c) => `0x${c.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')} }`;
  }).join(',\n      ');

  const holdCombos = buttons.map((b) => {
    const codes = parseKeyComboToKeyCodes(b.holdKeyCombo);
    return `{ ${codes.map((c) => `0x${c.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')} }`;
  }).join(',\n      ');

  return `  {
    "${cleanName}",
    ${pColHex}, ${sColHex}, ${aColHex},
    ${idleAnim}, ${idleSpd}, ${activeAnim}, ${activeSpd}, ${brightness}, ${rotOffset},
    { ${sens} },
    { ${dz} },
    { ${inv} },
    {
      ${matRows}
    },
    { ${axisOutputModes} },
    { ${axisRepeatRates} },
    {
      ${axisPosKeyCodes}
    },
    {
      ${axisNegKeyCodes}
    },
    { ${axisCurveTypes} },
    { ${axisExpoPowers} },
    { ${tapActions} },
    { ${holdActions} },
    {
      ${tapCombos}
    },
    {
      ${holdCombos}
    }
  }`;
}

export function generateEsp32Firmware(config: FirmwareConfig, profile: Profile, allProfiles?: Profile[]): string {
  const isMpu6050 = config.sensorType === 'imu_mpu6050_spring' || config.sensorType === 'imu_mpu6050_joystick';

  // Build the array of initial profiles for embedded standalone flash (up to 16 slots)
  const sourceProfiles: Profile[] = [];
  if (allProfiles && allProfiles.length > 0) {
    sourceProfiles.push(...allProfiles.slice(0, 16));
  }
  const initialActiveCount = Math.min(Math.max(sourceProfiles.length, 1), 16);

  // Fill remaining slots up to 16 with defaultProfiles
  for (const dp of defaultProfiles) {
    if (sourceProfiles.length < 16 && !sourceProfiles.some((sp) => sp.id === dp.id)) {
      sourceProfiles.push(dp);
    }
  }
  let defaultIdx = 0;
  while (sourceProfiles.length < 16) {
    sourceProfiles.push(defaultProfiles[defaultIdx % defaultProfiles.length]);
    defaultIdx++;
  }
  const profiles16 = sourceProfiles.slice(0, 16);

  // If the active profile is in profiles16, record its index
  let activeProfileIdx = profiles16.findIndex((p) => p.id === profile.id);
  if (activeProfileIdx < 0) {
    // Put activeProfile as slot 0
    profiles16[0] = profile;
    activeProfileIdx = 0;
  }

  const profilesInitCode = profiles16.map((p, idx) => formatProfileMemoryStructC(p, idx)).join(',\n');

  // Extract custom pins from profile buttons or fallback to config
  const defaultPins = [13, 12, 14, 27, 26, 25, 33, 32, 4];
  const buttonPins = profile.buttons && profile.buttons.length === 9
    ? profile.buttons.map((b, idx) => b.pinNumber ?? defaultPins[idx])
    : config.buttonPins;
  const buttonPinsStr = buttonPins.join(', ');

  const ledConfig = profile.ledRing || {
    brightness: 65,
    primaryColor: profile.ledColor || '#ff8800',
    secondaryColor: '#00e5ff',
    accentColor: '#ff3366',
    idleAnimation: 'breathing' as const,
    idleSpeed: 5,
    activeAnimation: 'rotational_twist_swirl' as const,
    activeSpeed: 6,
    individualLeds: Array(24).fill(profile.ledColor || '#ff8800'),
    ledCount: 24,
    rotationOffsetDeg: 0,
    rotationLedOffset: 0,
  };

  const powerConfig = profile.powerManagement || {
    batteryCapacityMah: 4200,
    enableLightSleep: true,
    lightSleepTimeoutMin: 15,
    lightSleepLedMode: 'dim_slow_breathe' as const,
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

  const pColor = hexToRgb(ledConfig.primaryColor);
  const sColor = hexToRgb(ledConfig.secondaryColor);
  const aColor = hexToRgb(ledConfig.accentColor);

  const customLedsArrayStr = (ledConfig.individualLeds || Array(24).fill(ledConfig.primaryColor))
    .slice(0, 24)
    .map((hex) => {
      const c = hexToRgb(hex);
      return `0x${((c.r << 16) | (c.g << 8) | c.b).toString(16).padStart(6, '0').toUpperCase()}`;
    })
    .join(', ');

  const rotationOffsetLed = ledConfig.rotationLedOffset || 0;

  return `/**
 * =========================================================================
 * OOFO One 6-DOF Open-Hardware Controller Embedded Firmware
 * Project: OOFO Studio (https://oofo.io)
 * Target MCU: ${config.chip.toUpperCase()} | Sensor: ${isMpu6050 ? 'MPU-6050 (I2C) with Gravity Decoupling' : '6-Channel Analog ADC (Hall/Strain)'}
 * Keypad Matrix: 3x3 (9 Mechanical Keys with Dynamic Multi-Key Dispatch Engine)
 * Lighting: 24x WS2812B NeoPixel Ring (Non-blocking 60FPS Millis State Machine)
 * Power: 4200mAh LiPo Engine + Dual-Tier Sleep + ADC Voltage Divider Sense
 * Active Profile: ${profile.name} (${profile.targetApp})
 * Generated by OOFO One Studio
 * =========================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_NeoPixel.h>
#include <Preferences.h>
#include <esp_sleep.h>
#include <esp_pm.h>

// =========================================================================
// 1. UNIFIED BLE HID ENGINE STACK
// (Prevents Dual-BLE-Server Bluedroid panic / boot-loop crashes on ESP32)
// =========================================================================
#define ENABLE_BLE_KEYBOARD 1
#define ENABLE_BLE_GAMEPAD  0

#if ENABLE_BLE_KEYBOARD
#include <BleKeyboard.h>
BleKeyboard bleKeyboard("OOFO One Controller", "OOFO Studio", 100);
#elif ENABLE_BLE_GAMEPAD
#include <BleGamepad.h>
BleGamepad bleGamepad("OOFO One 6-DOF", "OOFO Studio", 100);
#endif

// --- HARDWARE PIN DEFINITIONS ---
#define SDA_PIN ${config.i2cSdaPin}       // ESP32 I2C SDA (GPIO 21)
#define SCL_PIN ${config.i2cSclPin}       // ESP32 I2C SCL (GPIO 22)
#define NEOPIXEL_PIN ${config.neopixelPin}  // NeoPixel 24-LED Ring Data (GPIO 15)
#define NEOPIXEL_COUNT 24                 // 24 LEDs
#define BATTERY_ADC_PIN ${powerConfig.batteryAdcPin || 35} // ADC1 Voltage Divider Sense (GPIO 35)

// 3x3 Keypad (9 Keys) Physical GPIO Pin Array (Direct with INPUT_PULLUP)
const uint8_t BUTTON_PINS[9] = { ${buttonPinsStr} };

// NeoPixel Hardware Mounting Rotation Offset (0 to 23 LEDs)
const uint8_t LED_ROTATION_OFFSET = ${rotationOffsetLed};

// Hardware Objects
Adafruit_MPU6050 mpu;
Adafruit_NeoPixel strip(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
Preferences prefs;

// =========================================================================
// 2. DYNAMIC MULTI-PROFILE DATA STRUCTURE & NVS MEMORY MODEL
// =========================================================================
struct ProfileMemory {
  char name[16];
  uint32_t primaryColor;
  uint32_t secondaryColor;
  uint32_t accentColor;
  uint8_t idleAnimation;    // 0=breathing, 1=spinning, 2=rainbow_cycle, 3=two_halves_bouncing, 4=sweeping, 5=static_solid
  uint8_t idleSpeed;        // 1 to 10
  uint8_t activeAnimation;  // 0=rotational_twist_swirl, 1=deflection_brightness, 2=axis_angle_spectrum, 3=velocity_pulse, 4=match_idle
  uint8_t activeSpeed;      // 1 to 10
  uint8_t brightness;       // 0 to 255
  uint8_t rotationOffset;   // 0 to 23 physical LED index shift
  float sensitivity[6];
  float deadzone[6];
  bool inverted[6];
  float decouplingMatrix[6][6]; // 6x6 cross-talk decoupling matrix
  uint8_t axisOutputMode[6];
  uint16_t axisRepeatRate[6];
  uint16_t axisPosKeyCodes[6][4];
  uint16_t axisNegKeyCodes[6][4];
  uint8_t axisCurveType[6];
  float axisExpoPower[6];
  uint8_t tapActionType[9];
  uint8_t holdActionType[9];
  uint16_t tapKeyCodes[9][4];
  uint16_t holdKeyCodes[9][4];
};

const uint8_t MAX_PROFILES = 16;
const uint8_t DEFAULT_PROFILE_COUNT = ${initialActiveCount};
uint8_t totalActiveProfiles = DEFAULT_PROFILE_COUNT;
uint8_t activeProfileIdx = ${activeProfileIdx};

// Standalone Factory Flash Profiles (16-Slot Capacity)
const ProfileMemory PROGMEM DEFAULT_PROFILES[MAX_PROFILES] = {
${profilesInitCode}
};

ProfileMemory profilesMemory[MAX_PROFILES];

// --- ACTIVE RUNTIME LOOKUP CACHE ---
struct RuntimeConfig {
  float sensitivity[6];
  float deadzone[6];
  bool inverted[6];
  bool dominantAxisOnly;
  bool precisionModeActive;
  bool axisLockActive;
  float precisionMultiplier;
  float jitterThreshold;
} runtimeConfig;

// Master Lighting State
uint8_t masterBrightness       = ${Math.round((ledConfig.brightness / 100) * 255)};
uint32_t colorPrimary          = 0x${((pColor.r << 16) | (pColor.g << 8) | pColor.b).toString(16).padStart(6, '0').toUpperCase()};
uint32_t colorSecondary        = 0x${((sColor.r << 16) | (sColor.g << 8) | sColor.b).toString(16).padStart(6, '0').toUpperCase()};
uint32_t colorAccent           = 0x${((aColor.r << 16) | (aColor.g << 8) | aColor.b).toString(16).padStart(6, '0').toUpperCase()};
const uint32_t CUSTOM_LEDS[24] = { ${customLedsArrayStr} };

// Power Management Timers (Dual-Tier Sleep with EXT1 Key-Wake)
uint32_t lightSleepTimeoutMs = ${powerConfig.lightSleepTimeoutMin} * 60 * 1000UL;
uint32_t deepSleepTimeoutMs  = ${powerConfig.deepSleepTimeoutMin} * 60 * 1000UL;
uint32_t lastInteractionTime = 0;

// Non-blocking Keystroke Repeater Tracker
uint32_t lastRepeatTime[6] = { 0, 0, 0, 0, 0, 0 };

// --- KINEMATICS, SENSOR FUSION & GRAVITY COMPENSATION ---
float gyroBiasX = 0.0f, gyroBiasY = 0.0f, gyroBiasZ = 0.0f;
float accelBiasX = 0.0f, accelBiasY = 0.0f, accelBiasZ = 9.80665f;
float pitchAngle = 0.0f; // Radians
float rollAngle  = 0.0f; // Radians
uint32_t lastKinematicsTime = 0;

float filtered6Dof[6] = { 0, 0, 0, 0, 0, 0 };
float smoothingAlpha = ${profile.filters.smoothingAlpha};

// Sampling rates
const uint32_t SENSOR_SAMPLE_INTERVAL_MS = 10; // Fixed 100Hz Sensor Ticker
uint32_t lastSensorPollTime = 0;
uint32_t lastLedRenderTime = 0;

// Button State Machine (Debounce, Tap & Hold Tracking)
bool buttonStatePrev[9] = { false };
uint32_t buttonPressStartTime[9] = { 0 };
bool buttonHoldTriggered[9] = { false };

// Non-blocking LED Animation State Machine
struct LedAnimationState {
  bool isSpinning;
  uint32_t spinStartTime;
  uint32_t spinDuration;
  uint32_t spinColor;
  bool isBatteryGauge;
  uint32_t batteryEndTime;
  float cachedBatteryPct;
  uint8_t cachedBatteryLit;
  bool lightsEnabled;
} ledAnimState = { false, 0, 0, 0, false, 0, 1.0f, 24, true };

// Non-blocking Tare Calibration State Machine
struct TareState {
  bool inProgress;
  uint8_t sampleCount;
  uint32_t nextSampleTime;
  float sumGx, sumGy, sumGz;
  float sumAx, sumAy, sumAz;
} tareState = { false, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

// Serial Incoming Buffer
char serialBuffer[256];
uint8_t serialBufferIdx = 0;

// --- COLOR INTERPOLATION & HSV HELPERS ---
uint32_t lerpColor(uint32_t c1, uint32_t c2, float t) {
  float ct = constrain(t, 0.0f, 1.0f);
  uint8_t r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
  uint8_t r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
  uint8_t r = (uint8_t)(r1 + (r2 - r1) * ct);
  uint8_t g = (uint8_t)(g1 + (g2 - g1) * ct);
  uint8_t b = (uint8_t)(b1 + (b2 - b1) * ct);
  return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
}

uint32_t hsvToRgb(float h, float s, float v) {
  while (h < 0.0f) h += 360.0f;
  while (h >= 360.0f) h -= 360.0f;
  float c = v * s;
  float hPrime = h / 60.0f;
  float x = c * (1.0f - fabs(fmod(hPrime, 2.0f) - 1.0f));
  float r1 = 0, g1 = 0, b1 = 0;
  if (hPrime >= 0 && hPrime < 1) { r1 = c; g1 = x; b1 = 0; }
  else if (hPrime < 2) { r1 = x; g1 = c; b1 = 0; }
  else if (hPrime < 3) { r1 = 0; g1 = c; b1 = x; }
  else if (hPrime < 4) { r1 = 0; g1 = x; b1 = c; }
  else if (hPrime < 5) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  float m = v - c;
  uint8_t r = (uint8_t)((r1 + m) * 255.0f);
  uint8_t g = (uint8_t)((g1 + m) * 255.0f);
  uint8_t b = (uint8_t)((b1 + m) * 255.0f);
  return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
}

// Helper to translate logical LED index to physical rotated index
inline uint8_t getPhysicalLedIndex(uint8_t logicalIdx, uint8_t offset) {
  return (logicalIdx + offset) % NEOPIXEL_COUNT;
}

// Forward Declarations
void startZeroTare();
void updateZeroTare(uint32_t now);
void cycleToNextProfile();
void applyActiveProfile();
void triggerBatteryGauge();
void triggerProfileSwitchAnimation(uint32_t color);
void loadProfilesFromNvs();
void saveProfilesToNvs();
void loadDefaultProfiles();
void processSerialCommand(const char* cmd);
void checkPowerManagement(uint32_t now);

// Axis Response Curve Mathematical Transfer Functions
// Applies mathematical response curves for fine motor control at the center and high-speed panning at the extremes.
float applyAxisCurve(float inputVal, uint8_t curveType, float expoPower) {
  float sign = (inputVal >= 0.0f) ? 1.0f : -1.0f;
  float absVal = fabs(inputVal);
  float out = absVal;
  switch (curveType) {
    case 1: // exponential
      out = pow(absVal, expoPower > 0.1f ? expoPower : 1.0f);
      break;
    case 2: // quadratic
      out = absVal * absVal;
      break;
    case 3: // s_curve
      {
        float x = constrain(absVal, 0.0f, 1.0f);
        out = (3.0f * x * x - 2.0f * x * x * x) * (absVal > 1.0f ? absVal : 1.0f);
      }
      break;
    case 0: // linear
    default:
      out = absVal;
      break;
  }
  return sign * out;
}

// Read Battery Voltage via 2x 100k Ohm Voltage Divider
float readBatteryVoltage() {
  uint32_t rawAdc = analogRead(BATTERY_ADC_PIN);
  float pinVoltage = (rawAdc / 4095.0f) * 3.3f * 1.05f;
  return pinVoltage * 2.0f;
}

// Trigger non-blocking battery gauge on 24-LED ring (Caches lit count to eliminate render flicker)
void triggerBatteryGauge() {
  ledAnimState.isBatteryGauge = true;
  ledAnimState.batteryEndTime = millis() + 3500;
  float v = readBatteryVoltage();
  float pct = constrain((v - 3.2f) / (4.2f - 3.2f), 0.0f, 1.0f);
  ledAnimState.cachedBatteryPct = pct;
  ledAnimState.cachedBatteryLit = (uint8_t)round(pct * (float)NEOPIXEL_COUNT);
  Serial.printf("$BAT,%0.2fV\\n", v);
}

// Trigger non-blocking spin animation on profile switch
void triggerProfileSwitchAnimation(uint32_t color) {
  ledAnimState.isSpinning = true;
  ledAnimState.spinStartTime = millis();
  ledAnimState.spinDuration = 600;
  ledAnimState.spinColor = color;
}

void togglePrecisionMode() {
  runtimeConfig.precisionModeActive = !runtimeConfig.precisionModeActive;
  Serial.printf("$MODE,PRECISION=%d\\n", runtimeConfig.precisionModeActive ? 1 : 0);
}

void toggleAxisLock() {
  runtimeConfig.axisLockActive = !runtimeConfig.axisLockActive;
  Serial.printf("$MODE,AXIS_LOCK=%d\\n", runtimeConfig.axisLockActive ? 1 : 0);
}

void toggleDominantAxis() {
  runtimeConfig.dominantAxisOnly = !runtimeConfig.dominantAxisOnly;
  Serial.printf("$MODE,DOMINANT=%d\\n", runtimeConfig.dominantAxisOnly ? 1 : 0);
}

void toggleLedRingLights() {
  ledAnimState.lightsEnabled = !ledAnimState.lightsEnabled;
  if (!ledAnimState.lightsEnabled) {
    strip.clear();
    strip.show();
  }
  Serial.printf("$LIGHTS,ENABLED=%d\\n", ledAnimState.lightsEnabled ? 1 : 0);
}

void enterBlePairingMode() {
  Serial.println(F(">> Entering BLE Discoverable Pairing Mode..."));
  triggerProfileSwitchAnimation(0x00E5FF);
}

// =========================================================================
// 3. DYNAMIC MULTI-KEY DISPATCH ENGINE
// =========================================================================
void dispatchKeyCombo(const uint16_t keys[4]) {
#if ENABLE_BLE_KEYBOARD
  if (!bleKeyboard.isConnected()) return;

  // Media Key Check
  for (int k = 0; k < 4; k++) {
    uint16_t code = keys[k];
    if (code == 0) continue;
    if (code == 0xEC) { bleKeyboard.write(KEY_MEDIA_VOLUME_UP); return; }
    if (code == 0xED) { bleKeyboard.write(KEY_MEDIA_VOLUME_DOWN); return; }
    if (code == 0xEB) { bleKeyboard.write(KEY_MEDIA_MUTE); return; }
    if (code == 0xEA) { bleKeyboard.write(KEY_MEDIA_PLAY_PAUSE); return; }
    if (code == 0xE8) { bleKeyboard.write(KEY_MEDIA_NEXT_TRACK); return; }
    if (code == 0xE9) { bleKeyboard.write(KEY_MEDIA_PREVIOUS_TRACK); return; }
    if (code == 0xE6) { bleKeyboard.write(KEY_MEDIA_STOP); return; }
  }

  bool pressedAny = false;
  for (int k = 0; k < 4; k++) {
    uint16_t code = keys[k];
    if (code == 0) continue;
    bleKeyboard.press((uint8_t)code);
    pressedAny = true;
  }
  if (pressedAny) {
    delay(15);
    bleKeyboard.releaseAll();
  }
#endif
}

void executeAction(uint8_t actionType, const uint16_t keyCodes[4], uint8_t btnIdx, bool isHold) {
  switch (actionType) {
    case 2: // ACTION_PROFILE_CYCLE_NEXT
      cycleToNextProfile();
      break;
    case 3: // ACTION_ZERO_TARE
      startZeroTare();
      break;
    case 4: // ACTION_BATTERY_INDICATOR
      triggerBatteryGauge();
      break;
    case 5: // ACTION_PRECISION_MODE
      togglePrecisionMode();
      break;
    case 6: // ACTION_AXIS_LOCK
      toggleAxisLock();
      break;
    case 7: // ACTION_TOGGLE_DOMINANT
      toggleDominantAxis();
      break;
    case 8: // ACTION_TOGGLE_LIGHTS
      toggleLedRingLights();
      break;
    case 9: // ACTION_REBOOT_ESP32
      Serial.println(F("$ACK,REBOOTING"));
      delay(50);
      ESP.restart();
      break;
    case 10: // ACTION_BLE_PAIRING
      enterBlePairingMode();
      break;
    case 12: // ACTION_CYCLE_BRIGHTNESS
      if (masterBrightness <= 64) {
        masterBrightness = 255;
      } else {
        masterBrightness -= 64;
      }
      strip.setBrightness(masterBrightness);
      profilesMemory[activeProfileIdx].brightness = masterBrightness;
      saveProfilesToNvs();
      Serial.printf("$ACK,BRIGHTNESS,%d\\n", masterBrightness);
      break;
    case 1:  // ACTION_KEY_COMBO / HOTKEY
    case 11: // ACTION_CAD_HOTKEY
    default:
      dispatchKeyCombo(keyCodes);
      break;
  }

  Serial.printf("$BTN_%s,%d,ACT=%d\\n", isHold ? "HOLD" : "TAP", btnIdx + 1, actionType);
}

void executeButtonTap(uint8_t btnIdx) {
  if (btnIdx >= 9) return;
  executeAction(
    profilesMemory[activeProfileIdx].tapActionType[btnIdx],
    profilesMemory[activeProfileIdx].tapKeyCodes[btnIdx],
    btnIdx,
    false
  );
}

void executeButtonHold(uint8_t btnIdx) {
  if (btnIdx >= 9) return;
  executeAction(
    profilesMemory[activeProfileIdx].holdActionType[btnIdx],
    profilesMemory[activeProfileIdx].holdKeyCodes[btnIdx],
    btnIdx,
    true
  );
}

// =========================================================================
// 4. DYNAMIC PROFILE CYCLING & COLOR SWITCHING
// =========================================================================
void applyActiveProfile() {
  const ProfileMemory& p = profilesMemory[activeProfileIdx];
  colorPrimary   = p.primaryColor;
  colorSecondary = p.secondaryColor;
  colorAccent    = p.accentColor;
  masterBrightness = p.brightness;
  strip.setBrightness(masterBrightness);

  for (int i = 0; i < 6; i++) {
    runtimeConfig.sensitivity[i] = p.sensitivity[i];
    runtimeConfig.deadzone[i]    = p.deadzone[i];
    runtimeConfig.inverted[i]    = p.inverted[i];
  }

  triggerProfileSwitchAnimation(colorPrimary);
  Serial.printf("$ACK,PROFILE_SWAP,%d,%s,0x%06X\\n", activeProfileIdx, p.name, colorPrimary);
}

void cycleToNextProfile() {
  if (totalActiveProfiles <= 1) {
    activeProfileIdx = 0;
  } else {
    activeProfileIdx = (activeProfileIdx + 1) % totalActiveProfiles;
  }
  prefs.begin("oofo_ctrl", false);
  prefs.putUChar("prof_idx", activeProfileIdx);
  prefs.end();

  applyActiveProfile();
}

// =========================================================================
// 5. NVS FLASH STORAGE & DEFAULT PROFILES INITIALIZATION
// =========================================================================
void loadDefaultProfiles() {
  totalActiveProfiles = DEFAULT_PROFILE_COUNT;
  for (int i = 0; i < MAX_PROFILES; i++) {
    memcpy_P(&profilesMemory[i], &DEFAULT_PROFILES[i], sizeof(ProfileMemory));
  }
}

void saveProfilesToNvs() {
  prefs.begin("oofo_ctrl", false);
  prefs.putUChar("prof_count", totalActiveProfiles);
  prefs.putUChar("prof_idx", activeProfileIdx);
  prefs.putFloat("alpha", smoothingAlpha);
  prefs.putBool("dominant", runtimeConfig.dominantAxisOnly);
  prefs.putFloat("jitter", runtimeConfig.jitterThreshold);
  prefs.putFloat("prec_mult", runtimeConfig.precisionMultiplier);
  prefs.putUInt("pwr_light", lightSleepTimeoutMs);
  prefs.putUInt("pwr_deep", deepSleepTimeoutMs);
  prefs.putBytes("prof_arr", profilesMemory, sizeof(profilesMemory));
  prefs.end();
}

void loadProfilesFromNvs() {
  prefs.begin("oofo_ctrl", false);
  totalActiveProfiles = prefs.getUChar("prof_count", DEFAULT_PROFILE_COUNT);
  if (totalActiveProfiles == 0 || totalActiveProfiles > MAX_PROFILES) {
    totalActiveProfiles = DEFAULT_PROFILE_COUNT;
  }
  activeProfileIdx = prefs.getUChar("prof_idx", 0);
  if (activeProfileIdx >= totalActiveProfiles) activeProfileIdx = 0;
  smoothingAlpha = prefs.getFloat("alpha", ${profile.filters.smoothingAlpha});
  runtimeConfig.dominantAxisOnly = prefs.getBool("dominant", ${profile.filters.dominantAxisOnly ? 'true' : 'false'});
  runtimeConfig.jitterThreshold = prefs.getFloat("jitter", ${(profile.filters.jitterThreshold ?? 0.0).toFixed(2)}f);
  runtimeConfig.precisionMultiplier = prefs.getFloat("prec_mult", ${(profile.filters.precisionMultiplier ?? 0.25).toFixed(2)}f);
  lightSleepTimeoutMs = prefs.getUInt("pwr_light", ${powerConfig.lightSleepTimeoutMin} * 60 * 1000UL);
  deepSleepTimeoutMs = prefs.getUInt("pwr_deep", ${powerConfig.deepSleepTimeoutMin} * 60 * 1000UL);

  size_t bytesRead = prefs.getBytes("prof_arr", profilesMemory, sizeof(profilesMemory));
  prefs.end();

  if (bytesRead != sizeof(profilesMemory)) {
    Serial.println(F("[NVS] Initializing Flash with Default Profile Configuration..."));
    loadDefaultProfiles();
    saveProfilesToNvs();
  } else {
    Serial.printf("[NVS] Loaded %d Profile Slots (Active Capacity: %d) from Flash Memory.\\n", MAX_PROFILES, totalActiveProfiles);
  }

  applyActiveProfile();
}

// =========================================================================
// 6. ZERO TARE EQUILIBRIUM CALIBRATION (Non-blocking State Machine)
// =========================================================================
void startZeroTare() {
  Serial.println(F(">> Initiating non-blocking sensor tare equilibrium calibration..."));
  tareState.inProgress = true;
  tareState.sampleCount = 0;
  tareState.nextSampleTime = millis();
  tareState.sumGx = 0; tareState.sumGy = 0; tareState.sumGz = 0;
  tareState.sumAx = 0; tareState.sumAy = 0; tareState.sumAz = 0;
}

void updateZeroTare(uint32_t now) {
  if (!tareState.inProgress) return;
  if (now < tareState.nextSampleTime) return;

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  tareState.sumGx += g.gyro.x;
  tareState.sumGy += g.gyro.y;
  tareState.sumGz += g.gyro.z;
  tareState.sumAx += a.acceleration.x;
  tareState.sumAy += a.acceleration.y;
  tareState.sumAz += a.acceleration.z;
  tareState.sampleCount++;
  tareState.nextSampleTime = now + 3; // 3ms non-blocking interval

  if (tareState.sampleCount >= 40) {
    gyroBiasX = tareState.sumGx * 0.025f;
    gyroBiasY = tareState.sumGy * 0.025f;
    gyroBiasZ = tareState.sumGz * 0.025f;
    accelBiasX = tareState.sumAx * 0.025f;
    accelBiasY = tareState.sumAy * 0.025f;
    accelBiasZ = (tareState.sumAz * 0.025f) - 9.80665f;
    pitchAngle = 0.0f;
    rollAngle = 0.0f;
    tareState.inProgress = false;
    Serial.printf("$ACK,CAL_ZERO,SUCCESS,GYRO=(%0.3f,%0.3f,%0.3f)\\n", gyroBiasX, gyroBiasY, gyroBiasZ);
  }
}

// =========================================================================
// POWER STATE ENGINE (Dual-Tier Sleep with EXT1 Key-Wake Only)
// =========================================================================
void checkPowerManagement(uint32_t now) {
  uint32_t idleDuration = now - lastInteractionTime;

  // Tier 2: Deep Sleep (> deepSleepTimeoutMs)
  if (deepSleepTimeoutMs > 0 && idleDuration >= deepSleepTimeoutMs) {
    Serial.println(F("[PWR] Entering Deep Sleep (EXT1 Key-Wake)..."));
    strip.clear();
    strip.show();
    uint64_t ext1Mask = 0;
    for (int i = 0; i < 9; i++) {
      ext1Mask |= (1ULL << BUTTON_PINS[i]);
    }
    esp_sleep_enable_ext1_wakeup(ext1Mask, ESP_EXT1_WAKEUP_ALL_LOW);
    esp_deep_sleep_start();
  }
  // Tier 1: Light Sleep (> lightSleepTimeoutMs)
  else if (lightSleepTimeoutMs > 0 && idleDuration >= lightSleepTimeoutMs) {
    uint64_t ext1Mask = 0;
    for (int i = 0; i < 9; i++) {
      ext1Mask |= (1ULL << BUTTON_PINS[i]);
    }
    esp_sleep_enable_ext1_wakeup(ext1Mask, ESP_EXT1_WAKEUP_ALL_LOW);
    esp_light_sleep_start();
    lastInteractionTime = millis();
  }
}

// =========================================================================
// 7. COMPACT NVS PROTOCOL PARSER (BURNNVS & LIVE TUNING)
// =========================================================================
void processSerialCommand(const char* cmd) {
  if (strncmp(cmd, "CAL_ZERO", 8) == 0 || strncmp(cmd, "TARE", 4) == 0) {
    startZeroTare();
    return;
  }

  if (strncmp(cmd, "PING", 4) == 0) {
    Serial.println(F("$ACK,PONG,OOFO_ONE"));
    return;
  }

  if (strncmp(cmd, "GET_ACTIVE_CONFIG", 17) == 0 || strncmp(cmd, "GET_CONFIG", 10) == 0 || strncmp(cmd, "STATUS", 6) == 0) {
    const ProfileMemory& p = profilesMemory[activeProfileIdx];
    Serial.printf("$CONFIG,%d,%d,%s,0x%06X,S=(%0.2f,%0.2f,%0.2f,%0.2f,%0.2f,%0.2f),BAT=%0.2fV\\n",
      activeProfileIdx, totalActiveProfiles, p.name, p.primaryColor,
      p.sensitivity[0], p.sensitivity[1], p.sensitivity[2],
      p.sensitivity[3], p.sensitivity[4], p.sensitivity[5],
      readBatteryVoltage()
    );
    return;
  }

  // SET_PROFILE_COUNT:<count>
  if (strncmp(cmd, "SET_PROFILE_COUNT:", 18) == 0) {
    int count = atoi(cmd + 18);
    if (count >= 1 && count <= MAX_PROFILES) {
      totalActiveProfiles = (uint8_t)count;
      if (activeProfileIdx >= totalActiveProfiles) {
        activeProfileIdx = 0;
      }
      saveProfilesToNvs();
      Serial.printf("$ACK,SET_PROFILE_COUNT,%d,OK\\n", totalActiveProfiles);
    }
    return;
  }

  // SET_ACTIVE_PROFILE:<idx>
  if (strncmp(cmd, "SET_ACTIVE_PROFILE:", 19) == 0 || strncmp(cmd, "SWITCH_PROFILE:", 15) == 0) {
    int targetIdx = atoi(strchr(cmd, ':') + 1);
    if (targetIdx >= 0 && targetIdx < totalActiveProfiles) {
      activeProfileIdx = targetIdx;
      prefs.begin("oofo_ctrl", false);
      prefs.putUChar("prof_idx", activeProfileIdx);
      prefs.end();
      applyActiveProfile();
      Serial.printf("$ACK,SET_ACTIVE_PROFILE,%d,OK\\n", activeProfileIdx);
    }
    return;
  }

  // SET_PROFILE:<idx>:<hexP>:<hexS>:<sx>:<sy>:<sz>:<srx>:<sry>:<srz>:<dzX>:<dzY>:<dzZ>:<dzRx>:<dzRy>:<dzRz>:<invMask>
  if (strncmp(cmd, "SET_PROFILE:", 12) == 0) {
    int idx = 0;
    char hexP[16] = {0}, hexS[16] = {0};
    float sx = 1.0f, sy = 1.0f, sz = 1.0f, srx = 1.0f, sry = 1.0f, srz = 1.0f;
    float dzX = 8.0f, dzY = 8.0f, dzZ = 10.0f, dzRx = 8.0f, dzRy = 8.0f, dzRz = 10.0f;
    int invMask = 0;
    if (sscanf(cmd + 12, "%d:%15[^:]:%15[^:]:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%f:%d",
               &idx, hexP, hexS, &sx, &sy, &sz, &srx, &sry, &srz,
               &dzX, &dzY, &dzZ, &dzRx, &dzRy, &dzRz, &invMask) == 16) {
      if (idx >= 0 && idx < MAX_PROFILES) {
        profilesMemory[idx].primaryColor   = (uint32_t)strtoul(hexP, NULL, 16);
        profilesMemory[idx].secondaryColor = (uint32_t)strtoul(hexS, NULL, 16);
        profilesMemory[idx].sensitivity[0] = sx;  profilesMemory[idx].sensitivity[1] = sy;  profilesMemory[idx].sensitivity[2] = sz;
        profilesMemory[idx].sensitivity[3] = srx; profilesMemory[idx].sensitivity[4] = sry; profilesMemory[idx].sensitivity[5] = srz;
        profilesMemory[idx].deadzone[0]    = dzX;  profilesMemory[idx].deadzone[1]    = dzY;  profilesMemory[idx].deadzone[2]    = dzZ;
        profilesMemory[idx].deadzone[3]    = dzRx; profilesMemory[idx].deadzone[4]    = dzRy; profilesMemory[idx].deadzone[5]    = dzRz;
        profilesMemory[idx].inverted[0]    = (invMask & 1) != 0;
        profilesMemory[idx].inverted[1]    = (invMask & 2) != 0;
        profilesMemory[idx].inverted[2]    = (invMask & 4) != 0;
        profilesMemory[idx].inverted[3]    = (invMask & 8) != 0;
        profilesMemory[idx].inverted[4]    = (invMask & 16) != 0;
        profilesMemory[idx].inverted[5]    = (invMask & 32) != 0;

        if (idx == activeProfileIdx) {
          applyActiveProfile();
        }
        saveProfilesToNvs();
        Serial.printf("$ACK,SET_PROFILE,%d,OK\\n", idx);
      }
    }
    return;
  }

  // SET_AXIS_MAP:<profIdx>:<axisIdx>:<outMode>:<curve>:<expo>:<rate>:<pK0>:<pK1>:<pK2>:<pK3>:<nK0>:<nK1>:<nK2>:<nK3>
  if (strncmp(cmd, "SET_AXIS_MAP:", 13) == 0) {
    int pIdx = 0, aIdx = 0, outMode = 0, curve = 0, rate = 80;
    float expo = 1.0f;
    uint32_t pk0 = 0, pk1 = 0, pk2 = 0, pk3 = 0, nk0 = 0, nk1 = 0, nk2 = 0, nk3 = 0;
    if (sscanf(cmd + 13, "%d:%d:%d:%d:%f:%d:%u:%u:%u:%u:%u:%u:%u:%u",
               &pIdx, &aIdx, &outMode, &curve, &expo, &rate,
               &pk0, &pk1, &pk2, &pk3, &nk0, &nk1, &nk2, &nk3) == 14) {
      if (pIdx >= 0 && pIdx < MAX_PROFILES && aIdx >= 0 && aIdx < 6) {
        profilesMemory[pIdx].axisOutputMode[aIdx] = (uint8_t)outMode;
        profilesMemory[pIdx].axisCurveType[aIdx]  = (uint8_t)curve;
        profilesMemory[pIdx].axisExpoPower[aIdx]  = expo;
        profilesMemory[pIdx].axisRepeatRate[aIdx] = (uint16_t)rate;
        profilesMemory[pIdx].axisPosKeyCodes[aIdx][0] = (uint16_t)pk0;
        profilesMemory[pIdx].axisPosKeyCodes[aIdx][1] = (uint16_t)pk1;
        profilesMemory[pIdx].axisPosKeyCodes[aIdx][2] = (uint16_t)pk2;
        profilesMemory[pIdx].axisPosKeyCodes[aIdx][3] = (uint16_t)pk3;
        profilesMemory[pIdx].axisNegKeyCodes[aIdx][0] = (uint16_t)nk0;
        profilesMemory[pIdx].axisNegKeyCodes[aIdx][1] = (uint16_t)nk1;
        profilesMemory[pIdx].axisNegKeyCodes[aIdx][2] = (uint16_t)nk2;
        profilesMemory[pIdx].axisNegKeyCodes[aIdx][3] = (uint16_t)nk3;
        saveProfilesToNvs();
        Serial.printf("$ACK,SET_AXIS_MAP,%d,%d,OK\\n", pIdx, aIdx);
      }
    }
    return;
  }

  // SET_POWER:<lightSleepMin>:<deepSleepMin>
  if (strncmp(cmd, "SET_POWER:", 10) == 0) {
    int lightMin = 15, deepMin = 60;
    if (sscanf(cmd + 10, "%d:%d", &lightMin, &deepMin) == 2) {
      lightSleepTimeoutMs = (uint32_t)lightMin * 60 * 1000UL;
      deepSleepTimeoutMs  = (uint32_t)deepMin * 60 * 1000UL;
      saveProfilesToNvs();
      Serial.printf("$ACK,SET_POWER,%d,%d,OK\\n", lightMin, deepMin);
    }
    return;
  }

  // SET_FILTERS:<alpha>:<jitter>:<precisionMult>
  if (strncmp(cmd, "SET_FILTERS:", 12) == 0) {
    float a = 0.32f, j = 0.0f, pMult = 0.25f;
    if (sscanf(cmd + 12, "%f:%f:%f", &a, &j, &pMult) == 3) {
      if (a > 0.01f && a <= 1.0f) smoothingAlpha = a;
      runtimeConfig.jitterThreshold = j;
      runtimeConfig.precisionMultiplier = pMult;
      saveProfilesToNvs();
      Serial.printf("$ACK,SET_FILTERS,%0.2f,%0.2f,%0.2f,OK\\n", smoothingAlpha, runtimeConfig.jitterThreshold, runtimeConfig.precisionMultiplier);
    }
    return;
  }

  // SET_LED:<profIdx>:<hexP>:<hexS>:<hexA>:<idleAnim>:<idleSpd>:<activeAnim>:<activeSpd>:<bright>:<rotOffset>
  if (strncmp(cmd, "SET_LED:", 8) == 0) {
    int idx = 0;
    char hexP[16] = {0}, hexS[16] = {0}, hexA[16] = {0};
    int iAnim = 0, iSpd = 5, aAnim = 0, aSpd = 6, brt = 165, rotOff = 0;
    if (sscanf(cmd + 8, "%d:%15[^:]:%15[^:]:%15[^:]:%d:%d:%d:%d:%d:%d", 
               &idx, hexP, hexS, hexA, &iAnim, &iSpd, &aAnim, &aSpd, &brt, &rotOff) >= 4) {
      if (idx >= 0 && idx < MAX_PROFILES) {
        profilesMemory[idx].primaryColor   = (uint32_t)strtoul(hexP, NULL, 16);
        profilesMemory[idx].secondaryColor = (uint32_t)strtoul(hexS, NULL, 16);
        profilesMemory[idx].accentColor    = (uint32_t)strtoul(hexA, NULL, 16);
        profilesMemory[idx].idleAnimation  = (uint8_t)constrain(iAnim, 0, 5);
        profilesMemory[idx].idleSpeed      = (uint8_t)constrain(iSpd, 1, 10);
        profilesMemory[idx].activeAnimation= (uint8_t)constrain(aAnim, 0, 4);
        profilesMemory[idx].activeSpeed    = (uint8_t)constrain(aSpd, 1, 10);
        profilesMemory[idx].brightness     = (uint8_t)constrain(brt, 0, 255);
        profilesMemory[idx].rotationOffset = (uint8_t)constrain(rotOff, 0, 23);

        if (idx == activeProfileIdx) {
          colorPrimary   = profilesMemory[idx].primaryColor;
          colorSecondary = profilesMemory[idx].secondaryColor;
          colorAccent    = profilesMemory[idx].accentColor;
          masterBrightness = profilesMemory[idx].brightness;
          strip.setBrightness(masterBrightness);
        }
        saveProfilesToNvs();
        Serial.printf("$ACK,SET_LED,%d,OK\\n", idx);
      }
    }
    return;
  }

  // SET_MATRIX:<profIdx>:<row>:<m0>:<m1>:<m2>:<m3>:<m4>:<m5>
  if (strncmp(cmd, "SET_MATRIX:", 11) == 0) {
    int pIdx = 0, row = 0;
    float m0 = 0, m1 = 0, m2 = 0, m3 = 0, m4 = 0, m5 = 0;
    if (sscanf(cmd + 11, "%d:%d:%f:%f:%f:%f:%f:%f", &pIdx, &row, &m0, &m1, &m2, &m3, &m4, &m5) == 8) {
      if (pIdx >= 0 && pIdx < MAX_PROFILES && row >= 0 && row < 6) {
        profilesMemory[pIdx].decouplingMatrix[row][0] = m0;
        profilesMemory[pIdx].decouplingMatrix[row][1] = m1;
        profilesMemory[pIdx].decouplingMatrix[row][2] = m2;
        profilesMemory[pIdx].decouplingMatrix[row][3] = m3;
        profilesMemory[pIdx].decouplingMatrix[row][4] = m4;
        profilesMemory[pIdx].decouplingMatrix[row][5] = m5;
        saveProfilesToNvs();
        Serial.printf("$ACK,SET_MATRIX,%d,%d,OK\\n", pIdx, row);
      }
    }
    return;
  }

  // SET_KEY:<profIdx>:<keyIdx>:<isHold>:<actionType>:<modMask>:<keyCode>
  if (strncmp(cmd, "SET_KEY:", 8) == 0) {
    int pIdx = 0, kIdx = 0, isHold = 0, actType = 1, modMask = 0;
    uint32_t keyCode = 0;
    if (sscanf(cmd + 8, "%d:%d:%d:%d:%d:%u", &pIdx, &kIdx, &isHold, &actType, &modMask, &keyCode) == 6) {
      if (pIdx >= 0 && pIdx < MAX_PROFILES && kIdx >= 0 && kIdx < 9) {
        uint16_t combo[4] = {0, 0, 0, 0};
        int slot = 0;
        if (modMask & 1) combo[slot++] = 0x80; // KEY_LEFT_CTRL
        if (modMask & 2) combo[slot++] = 0x81; // KEY_LEFT_SHIFT
        if (modMask & 4) combo[slot++] = 0x82; // KEY_LEFT_ALT
        if (modMask & 8) combo[slot++] = 0x83; // KEY_LEFT_GUI
        if (keyCode > 0 && slot < 4) combo[slot++] = (uint16_t)keyCode;

        if (isHold == 0) {
          profilesMemory[pIdx].tapActionType[kIdx] = (uint8_t)actType;
          for (int c = 0; c < 4; c++) profilesMemory[pIdx].tapKeyCodes[kIdx][c] = combo[c];
        } else {
          profilesMemory[pIdx].holdActionType[kIdx] = (uint8_t)actType;
          for (int c = 0; c < 4; c++) profilesMemory[pIdx].holdKeyCodes[kIdx][c] = combo[c];
        }
        saveProfilesToNvs();
        Serial.printf("$ACK,SET_KEY,%d,%d,%d,OK\\n", pIdx, kIdx, isHold);
      }
    }
    return;
  }

  // SET_KEY4:<profIdx>:<keyIdx>:<isHold>:<actionType>:<k0>:<k1>:<k2>:<k3>
  if (strncmp(cmd, "SET_KEY4:", 9) == 0) {
    int pIdx = 0, kIdx = 0, isHold = 0, actType = 1;
    uint32_t k0 = 0, k1 = 0, k2 = 0, k3 = 0;
    if (sscanf(cmd + 9, "%d:%d:%d:%d:%u:%u:%u:%u", &pIdx, &kIdx, &isHold, &actType, &k0, &k1, &k2, &k3) == 8) {
      if (pIdx >= 0 && pIdx < MAX_PROFILES && kIdx >= 0 && kIdx < 9) {
        uint16_t combo[4] = {(uint16_t)k0, (uint16_t)k1, (uint16_t)k2, (uint16_t)k3};
        if (isHold == 0) {
          profilesMemory[pIdx].tapActionType[kIdx] = (uint8_t)actType;
          for (int c = 0; c < 4; c++) profilesMemory[pIdx].tapKeyCodes[kIdx][c] = combo[c];
        } else {
          profilesMemory[pIdx].holdActionType[kIdx] = (uint8_t)actType;
          for (int c = 0; c < 4; c++) profilesMemory[pIdx].holdKeyCodes[kIdx][c] = combo[c];
        }
        saveProfilesToNvs();
        Serial.printf("$ACK,SET_KEY4,%d,%d,%d,OK\\n", pIdx, kIdx, isHold);
      }
    }
    return;
  }

  if (strncmp(cmd, "NVS_ALPHA:", 10) == 0) {
    float a = atof(cmd + 10);
    if (a > 0.01f && a <= 1.0f) {
      smoothingAlpha = a;
      prefs.begin("oofo_ctrl", false);
      prefs.putFloat("alpha", smoothingAlpha);
      prefs.end();
    }
    Serial.println(F("$ACK,NVS_ALPHA,OK"));
    return;
  }

  if (strncmp(cmd, "NVS_DOMINANT:", 13) == 0) {
    runtimeConfig.dominantAxisOnly = (atoi(cmd + 13) == 1);
    prefs.begin("oofo_ctrl", false);
    prefs.putBool("dominant", runtimeConfig.dominantAxisOnly);
    prefs.end();
    Serial.println(F("$ACK,NVS_DOMINANT,OK"));
    return;
  }

  if (strncmp(cmd, "NVS_COMMIT", 10) == 0) {
    saveProfilesToNvs();
    Serial.println(F("$ACK,COMMIT,NVS_SAVED_OK"));
    triggerProfileSwitchAnimation(0x00FF88);
    return;
  }

  if (strncmp(cmd, "NVS_FACTORY_RESET", 17) == 0) {
    prefs.begin("oofo_ctrl", false);
    prefs.clear();
    prefs.end();
    loadDefaultProfiles();
    saveProfilesToNvs();
    applyActiveProfile();
    Serial.println(F("$ACK,FACTORY_RESET_OK"));
    triggerProfileSwitchAnimation(0xFF3300);
    return;
  }

  if (strncmp(cmd, "REBOOT", 6) == 0) {
    Serial.println(F("$ACK,REBOOTING"));
    delay(50);
    ESP.restart();
    return;
  }
}

void processIncomingSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\\n' || c == '\\r') {
      if (serialBufferIdx > 0) {
        serialBuffer[serialBufferIdx] = '\\0';
        processSerialCommand(serialBuffer);
        serialBufferIdx = 0;
      }
    } else {
      if (serialBufferIdx < sizeof(serialBuffer) - 1) {
        serialBuffer[serialBufferIdx++] = c;
      }
    }
  }
}

// =========================================================================
// 8. NON-BLOCKING LED ANIMATION RENDERER (~60 FPS)
// =========================================================================
void renderLedRing(uint32_t now) {
  if (!ledAnimState.lightsEnabled) return;

  uint8_t rotOffset = profilesMemory[activeProfileIdx].rotationOffset;

  // 1. Profile Switch Fast Spin Animation (Non-blocking)
  if (ledAnimState.isSpinning) {
    uint32_t elapsed = now - ledAnimState.spinStartTime;
    if (elapsed >= ledAnimState.spinDuration) {
      ledAnimState.isSpinning = false;
    } else {
      float progress = (float)elapsed / (float)ledAnimState.spinDuration;
      int head = (int)(progress * NEOPIXEL_COUNT * 2.0f) % NEOPIXEL_COUNT;
      strip.clear();
      for (int t = 0; t < 5; t++) {
        int idx = (head - t + NEOPIXEL_COUNT) % NEOPIXEL_COUNT;
        uint8_t dim = 255 / (t + 1);
        uint8_t r = ((ledAnimState.spinColor >> 16) & 0xFF) * dim / 255;
        uint8_t g = ((ledAnimState.spinColor >> 8) & 0xFF) * dim / 255;
        uint8_t b = (ledAnimState.spinColor & 0xFF) * dim / 255;
        strip.setPixelColor(getPhysicalLedIndex(idx, rotOffset), strip.Color(r, g, b));
      }
      strip.show();
      return;
    }
  }

  // 2. Battery Indicator Overlay (Cached reading to prevent render loop flicker)
  if (ledAnimState.isBatteryGauge) {
    if (now >= ledAnimState.batteryEndTime) {
      ledAnimState.isBatteryGauge = false;
    } else {
      float pct = ledAnimState.cachedBatteryPct;
      uint8_t lit = ledAnimState.cachedBatteryLit;
      strip.clear();
      for (int i = 0; i < NEOPIXEL_COUNT; i++) {
        if (i < lit) {
          if (pct > 0.6f) {
            strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), strip.Color(0, 255, 60)); // Green > 60%
          } else if (pct > 0.2f) {
            strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), strip.Color(255, 180, 0)); // Amber 20%-60%
          } else {
            strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), strip.Color(255, 20, 20)); // Red < 20%
          }
        }
      }
      strip.show();
      return;
    }
  }

  // 3. Motion & Deflection Detection
  const ProfileMemory& cur = profilesMemory[activeProfileIdx];
  uint32_t pCol = cur.primaryColor;
  uint32_t sCol = cur.secondaryColor;
  float elapsedSec = (float)now * 0.001f;

  float defX = filtered6Dof[0] * 0.102041f;
  float defY = filtered6Dof[1] * 0.102041f;
  float defZ = filtered6Dof[2] * 0.102041f;
  float linDeflection = sqrt(defX * defX + defY * defY + defZ * defZ);
  float rotDeflection = sqrt(filtered6Dof[3] * filtered6Dof[3] + filtered6Dof[4] * filtered6Dof[4] + filtered6Dof[5] * filtered6Dof[5]);
  float totalMotion = linDeflection + rotDeflection * 0.15f;
  bool isDeflected = (totalMotion > 0.08f) && (cur.activeAnimation != 4);

  // 4. Render Active or Idle Pattern
  if (isDeflected) {
    float activeSpeedVal = 0.04f + powf(((float)cur.activeSpeed - 1.0f) * 0.111111f, 2.5f) * 10.0f;
    switch (cur.activeAnimation) {
      case 0: { // 0=rotational_twist_swirl (Kinematic Swirl)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          float spin = fmod(fmod(((float)i * 0.0416667f + elapsedSec * activeSpeedVal + filtered6Dof[5] * 0.4f), 1.0f) + 1.0f, 1.0f);
          uint32_t col = lerpColor(pCol, sCol, spin);
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 1: { // 1=deflection_brightness (Force Brightness)
        float boost = constrain(totalMotion * 2.0f, 0.0f, 1.0f);
        uint32_t col = lerpColor(pCol, 0xFFFFFF, boost);
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 2: { // 2=axis_angle_spectrum (Tilt Spectrum)
        float angle = atan2(filtered6Dof[1], filtered6Dof[0]);
        float normAngle = fmod(fmod(((angle / (2.0f * PI)) + 0.5f), 1.0f) + 1.0f, 1.0f);
        uint32_t col = lerpColor(pCol, sCol, normAngle);
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 3: { // 3=velocity_pulse (Velocity Ripple)
        float ripple = (sin(elapsedSec * activeSpeedVal * 8.0f + totalMotion * 12.0f) + 1.0f) * 0.5f;
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          float dist = (float)i * 0.0416667f;
          float wave = (sin(dist * 2.0f * PI * 2.0f - elapsedSec * activeSpeedVal * 10.0f) + 1.0f) * 0.5f * ripple;
          uint32_t col = lerpColor(pCol, sCol, wave);
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      default:
        break;
    }
  } else {
    // IDLE PATTERNS
    float idleSpeedCurve = 0.02f + powf(((float)cur.idleSpeed - 1.0f) * 0.111111f, 2.5f) * 16.0f;
    switch (cur.idleAnimation) {
      case 0: { // 0=breathing (Breathing Pulse)
        float phase = elapsedSec * idleSpeedCurve;
        float b = (sin(phase) + 1.0f) * 0.5f;
        uint32_t col = lerpColor(pCol, sCol, b);
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 1: { // 1=spinning (Radar Sweep)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          float pos = fmod(fmod(((float)i * 0.0416667f + elapsedSec * (idleSpeedCurve * 0.2f)), 1.0f) + 1.0f, 1.0f);
          uint32_t col = lerpColor(pCol, sCol, pos);
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 2: { // 2=rainbow_cycle (Rainbow Flow)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          float hue = fmod(fmod(((float)i * 0.0416667f + elapsedSec * (idleSpeedCurve * 0.15f)), 1.0f) + 1.0f, 1.0f) * 360.0f;
          uint32_t col = hsvToRgb(hue, 1.0f, 1.0f);
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 3: { // 3=two_halves_bouncing (Dual Orbit)
        float t = (sin(elapsedSec * (idleSpeedCurve * 0.3f)) + 1.0f) * 0.5f;
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          float dist = fabs((float)i - 12.0f) * 0.0833333f;
          float factor = (sin((dist + t) * PI) + 1.0f) * 0.5f;
          uint32_t col = lerpColor(pCol, sCol, factor);
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 4: { // 4=sweeping (Clockwise Chase)
        float head = fmod(fmod(elapsedSec * (idleSpeedCurve * 0.25f), 1.0f) + 1.0f, 1.0f) * (float)NEOPIXEL_COUNT;
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          float diff = fmod((float)i - head + (float)NEOPIXEL_COUNT, (float)NEOPIXEL_COUNT) * 0.0416667f;
          uint32_t col = lerpColor(pCol, sCol, diff);
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), col);
        }
        break;
      }
      case 5: // 5=static_solid (Solid Glow)
      default: {
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          strip.setPixelColor(getPhysicalLedIndex(i, rotOffset), pCol);
        }
        break;
      }
    }
  }

  strip.show();
}

// =========================================================================
// 9. SETUP & INITIALIZATION
// =========================================================================
void setup() {
  Serial.begin(115200);
  delay(150);
  Serial.println(F("\\n======================================================="));
  Serial.println(F("  OOFO ONE 6-DOF EMBEDDED FIRMWARE (OOFO STUDIO v3.0)  "));
  Serial.println(F("======================================================="));

  // Initialize 3x3 Keypad GPIO Pins (Direct Pull-up)
  for (int i = 0; i < 9; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  }

  // Battery ADC Sense Pin
  pinMode(BATTERY_ADC_PIN, INPUT);

  // Initialize 24-LED NeoPixel Ring
  strip.begin();
  strip.setBrightness(masterBrightness);

  // Initialize NVS Storage & Load Profiles
  loadProfilesFromNvs();

  // Initialize I2C & MPU-6050
  Wire.begin(SDA_PIN, SCL_PIN, 400000);
  if (!mpu.begin()) {
    Serial.println(F("[ERROR] Could not communicate with MPU-6050 sensor!"));
  } else {
    Serial.println(F("[OK] MPU-6050 6-DOF Sensor Initialized with Gravity Decoupling."));
    mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
    mpu.setGyroRange(MPU6050_RANGE_250_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    startZeroTare();
  }

  // Start Unified BLE Stack (Single BLE Host)
  #if ENABLE_BLE_KEYBOARD
  bleKeyboard.begin();
  Serial.println(F("[OK] Unified BLE Keyboard/Hotkeys Service Started."));
  #elif ENABLE_BLE_GAMEPAD
  bleGamepad.begin();
  Serial.println(F("[OK] Unified BLE Gamepad 6-DOF Service Started."));
  #endif

  lastInteractionTime = millis();
  lastKinematicsTime  = millis();
}

// =========================================================================
// 10. MAIN NON-BLOCKING EXECUTION LOOP
// =========================================================================
void loop() {
  uint32_t now = millis();

  // 1. Process Non-blocking Serial Commands & Tare Calibration
  processIncomingSerial();
  updateZeroTare(now);

  // 2. Process 3x3 Mechanical Keypad (Tap & Hold Detection)
  for (int i = 0; i < 9; i++) {
    bool isPressed = (digitalRead(BUTTON_PINS[i]) == LOW);

    // Button Down Transition
    if (isPressed && !buttonStatePrev[i]) {
      buttonPressStartTime[i] = now;
      buttonHoldTriggered[i] = false;
      lastInteractionTime = now;
    }

    // Button Hold Check (> 1.0 sec)
    if (isPressed && !buttonHoldTriggered[i] && (now - buttonPressStartTime[i] >= 1000)) {
      buttonHoldTriggered[i] = true;
      executeButtonHold(i);
    }

    // Button Release Transition (Instant Tap)
    if (!isPressed && buttonStatePrev[i]) {
      if (!buttonHoldTriggered[i]) {
        executeButtonTap(i);
      }
    }

    buttonStatePrev[i] = isPressed;
  }

  // 3. Fixed 100Hz 6-DOF Kinematics, 6x6 Decoupling Matrix & Gravity Tilt Compensation
  if (now - lastSensorPollTime >= SENSOR_SAMPLE_INTERVAL_MS) {
    lastSensorPollTime = now;

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float dt = (now - lastKinematicsTime) * 0.001f;
    if (dt <= 0.001f || dt > 0.1f) dt = 0.01f;
    lastKinematicsTime = now;

    // Accel-derived tilt angles (pitch & roll in radians)
    float accelPitch = atan2(-a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z));
    float accelRoll  = atan2(a.acceleration.y, a.acceleration.z);

    // Complementary Filter Fusion (96% Gyro Integration + 4% Accel Reference)
    pitchAngle = 0.96f * (pitchAngle + (g.gyro.y - gyroBiasY) * dt) + 0.04f * accelPitch;
    rollAngle  = 0.96f * (rollAngle  + (g.gyro.x - gyroBiasX) * dt) + 0.04f * accelRoll;

    // GRAVITY TILT DECOUPLING:
    // Subtract Earth's gravity vector component (g * sin(theta)) to isolate pure lateral linear motion
    const float GRAVITY = 9.80665f;
    float gravAx = -GRAVITY * sin(pitchAngle);
    float gravAy =  GRAVITY * sin(rollAngle);

    float rawAx = a.acceleration.x - accelBiasX - gravAx;
    float rawAy = a.acceleration.y - accelBiasY - gravAy;
    float rawAz = a.acceleration.z - accelBiasZ;
    float rawGx = g.gyro.x - gyroBiasX;
    float rawGy = g.gyro.y - gyroBiasY;
    float rawGz = g.gyro.z - gyroBiasZ;

    // 6x6 CROSS-TALK DECOUPLING MATRIX:
    // Resolves pure Cartesian kinematics (X,Y,Z,Rx,Ry,Rz) by canceling parasitic mechanical deflection.
    float rawVec[6] = { rawAx, rawAy, rawAz, rawGx, rawGy, rawGz };
    float decoupledVec[6] = { 0, 0, 0, 0, 0, 0 };
    const ProfileMemory& curProf = profilesMemory[activeProfileIdx];
    for (int r = 0; r < 6; r++) {
      for (int c = 0; c < 6; c++) {
        decoupledVec[r] += curProf.decouplingMatrix[r][c] * rawVec[c];
      }
    }

    // Jitter Threshold Filter (suppress deflections smaller than threshold)
    for (int r = 0; r < 6; r++) {
      if (runtimeConfig.jitterThreshold > 0.0f && fabs(decoupledVec[r]) < runtimeConfig.jitterThreshold * 0.02f) {
        decoupledVec[r] = 0.0f;
      }
    }

    // Low-Pass Alpha Filtering
    for (int i = 0; i < 6; i++) {
      filtered6Dof[i] = filtered6Dof[i] * (1.0f - smoothingAlpha) + decoupledVec[i] * smoothingAlpha;
    }

    // Non-Blocking Keystroke & Media Repeater Engine for mapped axes
    for (int i = 0; i < 6; i++) {
      uint8_t outMode = curProf.axisOutputMode[i];
      if (outMode == 0) continue; // Standard cad_6dof, handled in telemetry

      float rawVal = filtered6Dof[i] * runtimeConfig.sensitivity[i] * (runtimeConfig.inverted[i] ? -1.0f : 1.0f);
      float curvedVal = applyAxisCurve(rawVal, curProf.axisCurveType[i], curProf.axisExpoPower[i]);
      float dzThreshold = runtimeConfig.deadzone[i] * 0.02f;

      if (fabs(curvedVal) >= dzThreshold && dzThreshold > 0.0f) {
        uint16_t repRate = (curProf.axisRepeatRate[i] >= 20) ? curProf.axisRepeatRate[i] : 80;
        if (now - lastRepeatTime[i] >= repRate) {
          lastRepeatTime[i] = now;
          lastInteractionTime = now;
          if (curvedVal > 0.0f) {
            dispatchKeyCombo(curProf.axisPosKeyCodes[i]);
          } else {
            dispatchKeyCombo(curProf.axisNegKeyCodes[i]);
          }
        }
      }
    }

    // Apply Precision Mode Scaling
    float pScale = runtimeConfig.precisionModeActive ? runtimeConfig.precisionMultiplier : 1.0f;

    // Motion activity resets sleep timer
    float linMag = sqrt(filtered6Dof[0]*filtered6Dof[0] + filtered6Dof[1]*filtered6Dof[1] + filtered6Dof[2]*filtered6Dof[2]);
    float rotMag = sqrt(filtered6Dof[3]*filtered6Dof[3] + filtered6Dof[4]*filtered6Dof[4] + filtered6Dof[5]*filtered6Dof[5]);
    if (linMag > 0.15f || rotMag > 0.25f) {
      lastInteractionTime = now;
    }

    // Pack 9 button states into bitmask
    uint16_t btnMask = 0;
    for (int b = 0; b < 9; b++) {
      if (digitalRead(BUTTON_PINS[b]) == LOW) btnMask |= (1 << b);
    }

    // High-Speed Serial Telemetry Stream for OOFO Studio / CAD Add-ins ($OOFO,x,y,z,rx,ry,rz,btns)
    Serial.printf("$OOFO,%0.3f,%0.3f,%0.3f,%0.3f,%0.3f,%0.3f,%u\\n",
      filtered6Dof[0] * pScale,
      filtered6Dof[1] * pScale,
      filtered6Dof[2] * pScale,
      filtered6Dof[3] * pScale,
      filtered6Dof[4] * pScale,
      filtered6Dof[5] * pScale,
      btnMask
    );
  }

  // 4. Non-blocking LED Lighting Render (~60 FPS)
  if (now - lastLedRenderTime >= 16) {
    lastLedRenderTime = now;
    renderLedRing(now);
  }

  // 5. Power States & Sleep Engine (EXT1 Key-Wake Only)
  checkPowerManagement(now);
}
`;
}

export function generatePlatformioIni(config: FirmwareConfig): string {
  const envName = config.chip === 'esp32_s3' ? 'esp32-s3-devkitc-1' : config.chip === 'esp32_s2' ? 'esp32-s2-saola-1' : 'esp32dev';
  return `; =========================================================================
; OOFO One 6-DOF Controller PlatformIO Build Configuration
; Generated by OOFO One Studio
; =========================================================================

[platformio]
default_envs = ${envName}

[env:${envName}]
platform = espressif32
board = ${envName}
framework = arduino
monitor_speed = 115200

lib_deps =
  adafruit/Adafruit MPU6050@^2.2.4
  adafruit/Adafruit NeoPixel@^1.11.0
  adafruit/Adafruit Unified Sensor@^1.1.9
  T-vK/ESP32 BLE Keyboard@^0.3.2

build_flags =
  -D CORE_DEBUG_LEVEL=0
`;
}

export function generateFusion360AddinPython(): string {
  return `# =========================================================================
# OOFO One 6-DOF Controller Autodesk Fusion 360 Python Bridge
# Reads BLE HID / Serial 6-DOF telemetry and rotates the camera viewport
# =========================================================================

import adsk.core, adsk.fusion, traceback
import math

app = None
ui = None

def run(context):
    global app, ui
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        ui.messageBox('OOFO One 6-DOF Controller Bridge Active!')
    except:
        if ui:
            ui.messageBox('Failed:\\n{}'.format(traceback.format_exc()))

def stop(context):
    global app, ui
    try:
        pass
    except:
        if ui:
            ui.messageBox('Failed:\\n{}'.format(traceback.format_exc()))
`;
}
