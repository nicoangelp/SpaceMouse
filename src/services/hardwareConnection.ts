import { Profile, SixDofState, CalibrationData, AxisParameters } from '../types';
import {
  getActionTypeEnum,
  getNumericKeyCode,
  parseKeyComboToKeyCodes,
  getIdleAnimationEnum,
  getActiveAnimationEnum,
  getAxisOutputModeEnum,
  getCurveTypeEnum,
} from '../data/firmwareTemplates';

export type ConnectionType = 'none' | 'serial' | 'bluetooth';
export type PacketCallback = (data: SixDofState) => void;
export type LogCallback = (log: string, type: 'rx' | 'tx' | 'info' | 'error') => void;

// Nordic UART Service (NUS) UUIDs standard on ESP32 BLE
const NORDIC_UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Web sends to ESP32
const NORDIC_UART_TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 notifies Web

function parseKeyComboToModAndCode(keys?: string[]): { modMask: number; keyCode: number } {
  if (!keys || keys.length === 0) return { modMask: 0, keyCode: 0 };
  let modMask = 0;
  let keyCode = 0;

  for (const k of keys) {
    const lower = k.toLowerCase().trim();
    if (['ctrl', 'control', 'lctrl', 'leftctrl'].includes(lower)) {
      modMask |= 1;
    } else if (['shift', 'lshift', 'leftshift'].includes(lower)) {
      modMask |= 2;
    } else if (['alt', 'lalt', 'leftalt', 'option'].includes(lower)) {
      modMask |= 4;
    } else if (['win', 'windows', 'meta', 'super', 'cmd', 'command', 'gui'].includes(lower)) {
      modMask |= 8;
    } else {
      keyCode = getNumericKeyCode(k);
    }
  }

  return { modMask, keyCode };
}

class HardwareConnectionManager {
  public connectionType: ConnectionType = 'none';
  public isConnected: boolean = false;
  public deviceName: string = '';
  public currentHz: number = 0;
  public hardwareProfileCount: number = 6;
  public hardwareActiveProfileIdx: number = 0;

  // Web Serial Handles
  private serialPort: any | null = null;
  private serialReader: ReadableStreamDefaultReader<string> | null = null;
  private isSerialReading: boolean = false;

  // Web Bluetooth Handles
  private bleDevice: any | null = null;
  private bleServer: any | null = null;
  private bleRxChar: any | null = null;
  private bleTxChar: any | null = null;
  private bleBuffer: string = '';

  // Callbacks & Metrics
  private onPacketCallback: PacketCallback | null = null;
  private onLogCallback: LogCallback | null = null;
  private onConnectionChangeCallback: ((connected: boolean, type: ConnectionType, name: string) => void) | null = null;
  private packetCount: number = 0;
  private lastHzTime: number = Date.now();

  public isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public setCallbacks(
    onPacket: PacketCallback,
    onLog: LogCallback,
    onConnectionChange?: (connected: boolean, type: ConnectionType, name: string) => void
  ) {
    this.onPacketCallback = onPacket;
    this.onLogCallback = onLog;
    if (onConnectionChange) {
      this.onConnectionChangeCallback = onConnectionChange;
    }
  }

  // ==========================================
  // WEB BLUETOOTH (BLE) CONNECTION
  // ==========================================
  public async connectBluetooth(): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      this.log('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.', 'error');
      return false;
    }

    try {
      this.log('Scanning for Bluetooth OOFO One Controller...', 'info');

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OOFO One' },
          { namePrefix: 'OOFO' },
          { namePrefix: 'DIY SpaceMouse' },
          { namePrefix: 'SpaceMouse' },
          { namePrefix: 'ESP32' },
          { services: [NORDIC_UART_SERVICE_UUID] },
        ],
        optionalServices: [
          NORDIC_UART_SERVICE_UUID,
          'generic_access',
          'battery_service',
          '0000180f-0000-1000-8000-00805f9b34fb',
        ],
      });

      this.bleDevice = device;
      this.deviceName = device.name || 'OOFO One 6-DOF (BLE)';
      this.log(`Found BLE Device: ${this.deviceName}. Connecting to GATT server...`, 'info');

      // Listen for disconnects
      device.addEventListener('gattserverdisconnected', () => {
        this.log(`Bluetooth device "${this.deviceName}" disconnected.`, 'info');
        this.handleDisconnectCleanup();
      });

      const server = await device.gatt.connect();
      this.bleServer = server;

      // Access Nordic UART Service for bidirectional serial-over-BLE
      const service = await server.getPrimaryService(NORDIC_UART_SERVICE_UUID);
      this.bleRxChar = await service.getCharacteristic(NORDIC_UART_RX_CHAR_UUID);
      this.bleTxChar = await service.getCharacteristic(NORDIC_UART_TX_CHAR_UUID);

      // Start Notifications on TX
      await this.bleTxChar.startNotifications();
      this.bleTxChar.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(value);
        this.handleBleIncomingChunk(text);
      });

      this.isConnected = true;
      this.connectionType = 'bluetooth';
      this.log(`Wirelessly connected to ${this.deviceName} via Web Bluetooth!`, 'info');

      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true, 'bluetooth', this.deviceName);
      }

      // Request NVS status from ESP32
      setTimeout(() => {
        this.sendCommand('GET_ACTIVE_CONFIG');
      }, 500);

      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.log('Bluetooth pairing cancelled by user.', 'info');
      } else {
        this.log(`Bluetooth connection error: ${err.message || err}`, 'error');
      }
      this.handleDisconnectCleanup();
      return false;
    }
  }

  private handleBleIncomingChunk(chunk: string) {
    this.bleBuffer += chunk;
    const lines = this.bleBuffer.split('\n');
    this.bleBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      this.parseLine(trimmed);
    }
  }

  // ==========================================
  // WEB SERIAL (USB / VIRTUAL COM) CONNECTION
  // ==========================================
  public async connectSerial(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSerialSupported()) {
      this.log('Web Serial API is not supported in this browser. Use Chrome, Edge, or Opera.', 'error');
      return false;
    }

    try {
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate });
      this.isConnected = true;
      this.connectionType = 'serial';
      this.deviceName = 'OOFO One (USB Serial)';
      this.log(`Connected to USB Serial at ${baudRate} baud.`, 'info');

      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true, 'serial', this.deviceName);
      }

      this.startSerialReading();

      // Request NVS active config
      setTimeout(() => {
        this.sendCommand('GET_ACTIVE_CONFIG');
      }, 500);

      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.log('Serial port selection cancelled by user.', 'info');
      } else {
        this.log(`Serial connection failed: ${err.message || err}`, 'error');
      }
      this.handleDisconnectCleanup();
      return false;
    }
  }

  public async disconnect() {
    this.log(`Disconnecting from ${this.deviceName}...`, 'info');
    await this.handleDisconnectCleanup();
  }

  private async handleDisconnectCleanup() {
    this.isSerialReading = false;

    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {}
      this.serialReader = null;
    }

    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {}
      this.serialPort = null;
    }

    if (this.bleDevice && this.bleDevice.gatt && this.bleDevice.gatt.connected) {
      try {
        this.bleDevice.gatt.disconnect();
      } catch {}
    }
    this.bleDevice = null;
    this.bleServer = null;
    this.bleRxChar = null;
    this.bleTxChar = null;

    const wasConnected = this.isConnected;
    this.isConnected = false;
    this.connectionType = 'none';
    this.deviceName = '';
    this.currentHz = 0;

    if (wasConnected && this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(false, 'none', '');
    }
  }

  // ==========================================
  // SEND COMMAND TO ESP32 (BLE / SERIAL)
  // ==========================================
  public async sendCommand(cmd: string): Promise<boolean> {
    if (!this.isConnected) {
      this.log('Command send failed: Device is not connected.', 'error');
      return false;
    }

    try {
      const payload = cmd.endsWith('\n') ? cmd : cmd + '\n';

      if (this.connectionType === 'bluetooth' && this.bleRxChar) {
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        
        // BLE MTU chunking (standard 20 to 128 bytes)
        const chunkSize = 64;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await this.bleRxChar.writeValue(chunk);
        }
        this.log(`TX (BLE): ${cmd.trim()}`, 'tx');
        return true;
      }

      if (this.connectionType === 'serial' && this.serialPort && this.serialPort.writable) {
        const textEncoder = new TextEncoderStream();
        textEncoder.readable.pipeTo(this.serialPort.writable, { preventClose: true });
        const writer = textEncoder.writable.getWriter();
        await writer.write(payload);
        writer.releaseLock();
        this.log(`TX (Serial): ${cmd.trim()}`, 'tx');
        return true;
      }

      return false;
    } catch (err: any) {
      this.log(`TX Error sending "${cmd}": ${err.message}`, 'error');
      return false;
    }
  }

  // ==========================================
  // ONBOARD ESP32 NVS FLASH & LIVE TUNING METHODS
  // ==========================================

  /**
   * Sets the total active profile capacity (1 to 16) in ESP32 NVS.
   */
  public async setProfileCount(count: number): Promise<boolean> {
    if (!this.isConnected) return false;
    const clamped = Math.min(Math.max(count, 1), 16);
    this.log(`Setting active profile capacity on hardware to ${clamped}...`, 'info');
    const ok = await this.sendCommand(`SET_PROFILE_COUNT:${clamped}`);
    if (ok) {
      this.hardwareProfileCount = clamped;
    }
    return ok;
  }

  /**
   * Burns a profile directly into the ESP32's internal Non-Volatile Storage (NVS).
   * Sends discrete binary/ASCII tuning commands (SET_PROFILE, SET_LED, SET_MATRIX, SET_AXIS_MAP, SET_KEY4, SET_FILTERS, SET_POWER, NVS_COMMIT).
   */
  public async burnProfileToNVS(profile: Profile, profileIndex?: number, totalProfilesCount?: number): Promise<boolean> {
    if (!this.isConnected) {
      this.log('Cannot burn to NVS: Hardware not connected. Connect via Bluetooth or Serial first.', 'error');
      return false;
    }

    // Determine target profile index (0..15)
    let pIdx = 0;
    if (typeof profileIndex === 'number' && profileIndex >= 0 && profileIndex < 16) {
      pIdx = profileIndex;
    } else {
      const knownApps = ['fusion360', 'blender', 'solidworks', 'freecad', 'bambu', 'desktop'];
      const found = knownApps.indexOf(profile.targetApp);
      pIdx = found >= 0 ? found : 0;
    }

    if (typeof totalProfilesCount === 'number' && totalProfilesCount >= 1 && totalProfilesCount <= 16) {
      await this.sendCommand(`SET_PROFILE_COUNT:${totalProfilesCount}`);
      await this.delay(25);
    }

    this.log(`Flashing profile "${profile.name}" (Slot #${pIdx}) into ESP32 NVS Flash...`, 'info');

    try {
      const hexP = (profile.ledColor || profile.ledRing?.primaryColor || '#FF8800').replace('#', '').toUpperCase();
      const hexS = (profile.ledRing?.secondaryColor || '#00E5FF').replace('#', '').toUpperCase();
      const hexA = (profile.ledRing?.accentColor || '#FFFFFF').replace('#', '').toUpperCase();
      const idleAnim = getIdleAnimationEnum(profile.ledRing?.idleAnimation);
      const idleSpd = Math.min(Math.max(profile.ledRing?.idleSpeed ?? 5, 1), 10);
      const activeAnim = getActiveAnimationEnum(profile.ledRing?.activeAnimation);
      const activeSpd = Math.min(Math.max(profile.ledRing?.activeSpeed ?? 6, 1), 10);
      const bright = Math.round(((profile.ledRing?.brightness ?? 65) / 100) * 255);
      const rotOffset = Math.min(Math.max(profile.ledRing?.rotationLedOffset ?? 0, 0), 23);

      const sx = profile.axes.x.sensitivity.toFixed(2);
      const sy = profile.axes.y.sensitivity.toFixed(2);
      const sz = profile.axes.z.sensitivity.toFixed(2);
      const srx = profile.axes.rx.sensitivity.toFixed(2);
      const sry = profile.axes.ry.sensitivity.toFixed(2);
      const srz = profile.axes.rz.sensitivity.toFixed(2);

      const dzX = profile.axes.x.deadzone.toFixed(1);
      const dzY = profile.axes.y.deadzone.toFixed(1);
      const dzZ = profile.axes.z.deadzone.toFixed(1);
      const dzRx = profile.axes.rx.deadzone.toFixed(1);
      const dzRy = profile.axes.ry.deadzone.toFixed(1);
      const dzRz = profile.axes.rz.deadzone.toFixed(1);

      let invMask = 0;
      if (profile.axes.x.inverted) invMask |= 1;
      if (profile.axes.y.inverted) invMask |= 2;
      if (profile.axes.z.inverted) invMask |= 4;
      if (profile.axes.rx.inverted) invMask |= 8;
      if (profile.axes.ry.inverted) invMask |= 16;
      if (profile.axes.rz.inverted) invMask |= 32;

      // 1. SET_PROFILE:<idx>:<hexP>:<hexS>:<sx>:<sy>:<sz>:<srx>:<sry>:<srz>:<dzX>:<dzY>:<dzZ>:<dzRx>:<dzRy>:<dzRz>:<invMask>
      await this.sendCommand(`SET_PROFILE:${pIdx}:${hexP}:${hexS}:${sx}:${sy}:${sz}:${srx}:${sry}:${srz}:${dzX}:${dzY}:${dzZ}:${dzRx}:${dzRy}:${dzRz}:${invMask}`);
      await this.delay(30);

      // 1.1 SET_LED:<profIdx>:<hexP>:<hexS>:<hexA>:<idleAnim>:<idleSpd>:<activeAnim>:<activeSpd>:<bright>:<rotOffset>
      await this.sendCommand(`SET_LED:${pIdx}:${hexP}:${hexS}:${hexA}:${idleAnim}:${idleSpd}:${activeAnim}:${activeSpd}:${bright}:${rotOffset}`);
      await this.delay(25);

      // 1.2 SET_POWER:<lightSleepMin>:<deepSleepMin>
      await this.sendCommand(`SET_POWER:15:60`);
      await this.delay(20);

      // 1.3 SET_FILTERS:<alpha>:<jitter>:<precisionMult>
      if (profile.filters) {
        await this.sendCommand(`SET_FILTERS:${profile.filters.smoothingAlpha.toFixed(3)}:${(profile.filters.jitterThreshold ?? 0.0).toFixed(2)}:${(profile.filters.precisionMultiplier ?? 0.25).toFixed(2)}`);
        await this.delay(20);
        await this.sendCommand(`NVS_DOMINANT:${profile.filters.dominantAxisOnly ? 1 : 0}`);
        await this.delay(20);
      }

      // 1.4 SET_MATRIX and SET_AXIS_MAP for all 6 axes
      const AXIS_NAMES = ['x', 'y', 'z', 'rx', 'ry', 'rz'] as const;
      for (let a = 0; a < 6; a++) {
        // SET_MATRIX row
        if (profile.decouplingMatrix && profile.decouplingMatrix.length === 6) {
          const row = profile.decouplingMatrix[a];
          await this.sendCommand(`SET_MATRIX:${pIdx}:${a}:${(row[0] ?? 0).toFixed(3)}:${(row[1] ?? 0).toFixed(3)}:${(row[2] ?? 0).toFixed(3)}:${(row[3] ?? 0).toFixed(3)}:${(row[4] ?? 0).toFixed(3)}:${(row[5] ?? 0).toFixed(3)}`);
          await this.delay(12);
        }

        // SET_AXIS_MAP
        const axisKey = AXIS_NAMES[a];
        const axis = profile.axes[axisKey];
        const outMode = getAxisOutputModeEnum(axis.outputMode);
        const curve = getCurveTypeEnum(axis.curve);
        const expo = axis.expoPower ?? 1.0;
        const rate = axis.repeatRateMs ?? 80;
        const pCodes = parseKeyComboToKeyCodes(axis.positiveKeyCombo);
        const nCodes = parseKeyComboToKeyCodes(axis.negativeKeyCombo);
        await this.sendCommand(`SET_AXIS_MAP:${pIdx}:${a}:${outMode}:${curve}:${expo.toFixed(2)}:${rate}:${pCodes[0]}:${pCodes[1]}:${pCodes[2]}:${pCodes[3]}:${nCodes[0]}:${nCodes[1]}:${nCodes[2]}:${nCodes[3]}`);
        await this.delay(12);
      }

      // 2. SET_KEY4 commands for each of the 9 buttons (Tap & Hold)
      if (profile.buttons && profile.buttons.length > 0) {
        for (let b = 0; b < Math.min(profile.buttons.length, 9); b++) {
          const btn = profile.buttons[b];
          const tapAct = getActionTypeEnum(btn.actionType);
          const tapCodes = parseKeyComboToKeyCodes(btn.keyCombo);
          await this.sendCommand(`SET_KEY4:${pIdx}:${b}:0:${tapAct}:${tapCodes[0]}:${tapCodes[1]}:${tapCodes[2]}:${tapCodes[3]}`);
          await this.delay(12);

          const holdAct = getActionTypeEnum(btn.holdActionType);
          const holdCodes = parseKeyComboToKeyCodes(btn.holdKeyCombo);
          await this.sendCommand(`SET_KEY4:${pIdx}:${b}:1:${holdAct}:${holdCodes[0]}:${holdCodes[1]}:${holdCodes[2]}:${holdCodes[3]}`);
          await this.delay(12);
        }
      }

      // 4. Commit to NVS Flash
      await this.sendCommand('NVS_COMMIT');
      await this.delay(40);

      // 5. Activate this profile slot immediately
      await this.sendCommand(`SET_ACTIVE_PROFILE:${pIdx}`);
      
      this.log(`SUCCESS: Profile "${profile.name}" burned and activated in ESP32 Flash Memory!`, 'info');
      return true;
    } catch (err: any) {
      this.log(`NVS Burn Error: ${err.message}`, 'error');
      return false;
    }
  }

  /**
   * Transmits and flashes ALL current active profiles (1 to 16) into ESP32 NVS memory,
   * setting SET_PROFILE_COUNT, streaming all slot definitions & axis maps & button tables, and issuing NVS_COMMIT.
   */
  public async burnAllProfilesToNVS(
    profiles: Profile[],
    activeProfileIdOrIndex?: string | number,
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<boolean> {
    if (!this.isConnected) {
      this.log('Cannot burn all profiles: Hardware is not connected. Connect via Bluetooth or Serial first.', 'error');
      return false;
    }

    if (!profiles || profiles.length === 0) {
      this.log('No profiles provided for burning.', 'error');
      return false;
    }

    const clampedCount = Math.min(Math.max(profiles.length, 1), 16);
    const targetProfiles = profiles.slice(0, clampedCount);

    // Resolve target active profile index
    let activeIdx = 0;
    if (typeof activeProfileIdOrIndex === 'number') {
      activeIdx = Math.min(Math.max(activeProfileIdOrIndex, 0), clampedCount - 1);
    } else if (typeof activeProfileIdOrIndex === 'string') {
      const foundIdx = targetProfiles.findIndex((p) => p.id === activeProfileIdOrIndex);
      if (foundIdx >= 0) activeIdx = foundIdx;
    }

    this.log(`Flashing all ${clampedCount} profile(s) to ESP32 Flash (Active: Slot #${activeIdx} "${targetProfiles[activeIdx]?.name}")...`, 'info');
    if (onProgress) onProgress(5, `Configuring hardware profile count to ${clampedCount}...`);

    try {
      // 1. Send SET_PROFILE_COUNT
      await this.sendCommand(`SET_PROFILE_COUNT:${clampedCount}`);
      await this.delay(30);

      const AXIS_NAMES = ['x', 'y', 'z', 'rx', 'ry', 'rz'] as const;

      // 2. Stream all profiles
      for (let i = 0; i < targetProfiles.length; i++) {
        const p = targetProfiles[i];
        const progressBase = 10 + Math.round((i / targetProfiles.length) * 75);
        if (onProgress) onProgress(progressBase, `Flashing Profile [${i + 1}/${targetProfiles.length}]: "${p.name}"...`);

        const hexP = (p.ledColor || p.ledRing?.primaryColor || '#FF8800').replace('#', '').toUpperCase();
        const hexS = (p.ledRing?.secondaryColor || '#00E5FF').replace('#', '').toUpperCase();
        const hexA = (p.ledRing?.accentColor || '#FFFFFF').replace('#', '').toUpperCase();
        const idleAnim = getIdleAnimationEnum(p.ledRing?.idleAnimation);
        const idleSpd = Math.min(Math.max(p.ledRing?.idleSpeed ?? 5, 1), 10);
        const activeAnim = getActiveAnimationEnum(p.ledRing?.activeAnimation);
        const activeSpd = Math.min(Math.max(p.ledRing?.activeSpeed ?? 6, 1), 10);
        const bright = Math.round(((p.ledRing?.brightness ?? 65) / 100) * 255);
        const rotOffset = Math.min(Math.max(p.ledRing?.rotationLedOffset ?? 0, 0), 23);

        const sx = p.axes.x.sensitivity.toFixed(2);
        const sy = p.axes.y.sensitivity.toFixed(2);
        const sz = p.axes.z.sensitivity.toFixed(2);
        const srx = p.axes.rx.sensitivity.toFixed(2);
        const sry = p.axes.ry.sensitivity.toFixed(2);
        const srz = p.axes.rz.sensitivity.toFixed(2);

        const dzX = p.axes.x.deadzone.toFixed(1);
        const dzY = p.axes.y.deadzone.toFixed(1);
        const dzZ = p.axes.z.deadzone.toFixed(1);
        const dzRx = p.axes.rx.deadzone.toFixed(1);
        const dzRy = p.axes.ry.deadzone.toFixed(1);
        const dzRz = p.axes.rz.deadzone.toFixed(1);

        let invMask = 0;
        if (p.axes.x.inverted) invMask |= 1;
        if (p.axes.y.inverted) invMask |= 2;
        if (p.axes.z.inverted) invMask |= 4;
        if (p.axes.rx.inverted) invMask |= 8;
        if (p.axes.ry.inverted) invMask |= 16;
        if (p.axes.rz.inverted) invMask |= 32;

        // SET_PROFILE:<idx>:<hexP>:<hexS>:<sx>:<sy>:<sz>:<srx>:<sry>:<srz>:<dzX>:<dzY>:<dzZ>:<dzRx>:<dzRy>:<dzRz>:<invMask>
        await this.sendCommand(`SET_PROFILE:${i}:${hexP}:${hexS}:${sx}:${sy}:${sz}:${srx}:${sry}:${srz}:${dzX}:${dzY}:${dzZ}:${dzRx}:${dzRy}:${dzRz}:${invMask}`);
        await this.delay(25);

        // SET_LED:<profIdx>:<hexP>:<hexS>:<hexA>:<idleAnim>:<idleSpd>:<activeAnim>:<activeSpd>:<bright>:<rotOffset>
        await this.sendCommand(`SET_LED:${i}:${hexP}:${hexS}:${hexA}:${idleAnim}:${idleSpd}:${activeAnim}:${activeSpd}:${bright}:${rotOffset}`);
        await this.delay(20);

        // SET_POWER:<lightSleepMin>:<deepSleepMin>
        await this.sendCommand(`SET_POWER:15:60`);
        await this.delay(20);

        // SET_FILTERS
        if (p.filters) {
          await this.sendCommand(`SET_FILTERS:${p.filters.smoothingAlpha.toFixed(3)}:${(p.filters.jitterThreshold ?? 0.0).toFixed(2)}:${(p.filters.precisionMultiplier ?? 0.25).toFixed(2)}`);
          await this.delay(20);
          await this.sendCommand(`NVS_DOMINANT:${p.filters.dominantAxisOnly ? 1 : 0}`);
          await this.delay(20);
        }

        // Stream Axis Maps (6 axes)
        for (let a = 0; a < 6; a++) {
          // SET_MATRIX row
          if (p.decouplingMatrix && p.decouplingMatrix.length === 6) {
            const row = p.decouplingMatrix[a];
            await this.sendCommand(`SET_MATRIX:${i}:${a}:${(row[0] ?? 0).toFixed(3)}:${(row[1] ?? 0).toFixed(3)}:${(row[2] ?? 0).toFixed(3)}:${(row[3] ?? 0).toFixed(3)}:${(row[4] ?? 0).toFixed(3)}:${(row[5] ?? 0).toFixed(3)}`);
            await this.delay(10);
          }

          // SET_AXIS_MAP
          const axisKey = AXIS_NAMES[a];
          const axis = p.axes[axisKey];
          const outMode = getAxisOutputModeEnum(axis.outputMode);
          const curve = getCurveTypeEnum(axis.curve);
          const expo = axis.expoPower ?? 1.0;
          const rate = axis.repeatRateMs ?? 80;
          const pCodes = parseKeyComboToKeyCodes(axis.positiveKeyCombo);
          const nCodes = parseKeyComboToKeyCodes(axis.negativeKeyCombo);
          await this.sendCommand(`SET_AXIS_MAP:${i}:${a}:${outMode}:${curve}:${expo.toFixed(2)}:${rate}:${pCodes[0]}:${pCodes[1]}:${pCodes[2]}:${pCodes[3]}:${nCodes[0]}:${nCodes[1]}:${nCodes[2]}:${nCodes[3]}`);
          await this.delay(10);
        }

        // Button maps (9 keys, tap & hold)
        if (p.buttons && p.buttons.length > 0) {
          for (let b = 0; b < Math.min(p.buttons.length, 9); b++) {
            const btn = p.buttons[b];
            const tapAct = getActionTypeEnum(btn.actionType);
            const tapCodes = parseKeyComboToKeyCodes(btn.keyCombo);
            await this.sendCommand(`SET_KEY4:${i}:${b}:0:${tapAct}:${tapCodes[0]}:${tapCodes[1]}:${tapCodes[2]}:${tapCodes[3]}`);
            await this.delay(10);

            const holdAct = getActionTypeEnum(btn.holdActionType);
            const holdCodes = parseKeyComboToKeyCodes(btn.holdKeyCombo);
            await this.sendCommand(`SET_KEY4:${i}:${b}:1:${holdAct}:${holdCodes[0]}:${holdCodes[1]}:${holdCodes[2]}:${holdCodes[3]}`);
            await this.delay(10);
          }
        }
      }

      // 3. (Filters are now set per profile above)

      const activeP = targetProfiles[activeIdx];

      // 4. Commit to NVS Flash
      if (onProgress) onProgress(93, 'Writing NVS partition to physical ESP32 flash...');
      await this.sendCommand('NVS_COMMIT');
      await this.delay(40);

      // 5. Activate active profile slot
      if (onProgress) onProgress(98, `Activating Profile Slot #${activeIdx} ("${activeP.name}")...`);
      await this.sendCommand(`SET_ACTIVE_PROFILE:${activeIdx}`);
      await this.delay(25);

      if (onProgress) onProgress(100, `Successfully flashed ${clampedCount} profile(s) to ESP32!`);
      this.log(`SUCCESS: Full multi-profile sync complete! ${clampedCount} profile(s) burned to ESP32 Flash.`, 'info');
      return true;
    } catch (err: any) {
      this.log(`Multi-profile Flash Error: ${err.message}`, 'error');
      return false;
    }
  }

  /**
   * Recalibrate MPU-6050 sensor zero equilibrium tare
   */
  public async zeroTare(): Promise<boolean> {
    if (!this.isConnected) return false;
    this.log('Triggering sensor tare equilibrium re-zeroing...', 'info');
    return this.sendCommand('CAL_ZERO');
  }

  /**
   * Switch the active profile slot directly on the physical hardware
   */
  public async switchProfileOnHardware(profileIndex: number): Promise<boolean> {
    if (!this.isConnected) return false;
    this.log(`Switching hardware to profile slot #${profileIndex}...`, 'info');
    return this.sendCommand(`SET_ACTIVE_PROFILE:${profileIndex}`);
  }

  /**
   * Request ESP32 to dump current active profile parameters
   */
  public async getActiveConfig(): Promise<boolean> {
    if (!this.isConnected) return false;
    return this.sendCommand('GET_ACTIVE_CONFIG');
  }

  /**
   * Factory Reset ESP32 NVS Flash memory back to embedded firmware defaults
   */
  public async eraseNVS(): Promise<boolean> {
    if (!this.isConnected) return false;
    this.log('Erasing ESP32 NVS Flash to factory defaults...', 'info');
    return this.sendCommand('NVS_FACTORY_RESET');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================
  // INCOMING SERIAL STREAM PARSER
  // ==========================================
  private async startSerialReading() {
    this.isSerialReading = true;
    let buffer = '';

    while (this.serialPort && this.serialPort.readable && this.isSerialReading) {
      const textDecoder = new TextDecoderStream();
      this.serialPort.readable.pipeTo(textDecoder.writable);
      this.serialReader = textDecoder.readable.getReader();

      try {
        while (true) {
          const { value, done } = await this.serialReader.read();
          if (done) break;
          if (value) {
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              this.parseLine(trimmed);
            }
          }
        }
      } catch (err: any) {
        if (this.isSerialReading) {
          this.log(`Serial read error: ${err.message}`, 'error');
        }
      } finally {
        if (this.serialReader) {
          this.serialReader.releaseLock();
        }
      }
    }
  }

  private parseLine(line: string) {
    this.packetCount++;
    const now = Date.now();
    if (now - this.lastHzTime >= 1000) {
      this.currentHz = this.packetCount;
      this.packetCount = 0;
      this.lastHzTime = now;
    }

    // JSON Format
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const parsed = JSON.parse(line);
        const state: SixDofState = {
          x: parsed.x ?? 0,
          y: parsed.y ?? 0,
          z: parsed.z ?? 0,
          rx: parsed.rx ?? 0,
          ry: parsed.ry ?? 0,
          rz: parsed.rz ?? 0,
          rawAdc: Array.isArray(parsed.adc) ? parsed.adc : [2048, 2048, 2048, 2048, 2048, 2048],
          buttonsPressed: this.decodeButtonBitmask(parsed.btns ?? 0),
          timestamp: Date.now(),
        };
        if (this.onPacketCallback) this.onPacketCallback(state);
      } catch {
        this.log(`RX: ${line}`, 'rx');
      }
      return;
    }

    // CSV High-Speed Telemetry: $OOFO,x,y,z,rx,ry,rz,btns or $SM,x,y,z,rx,ry,rz,btns
    if (line.startsWith('$OOFO,') || line.startsWith('$SM,')) {
      const parts = line.split(',');
      if (parts.length >= 8) {
        const state: SixDofState = {
          x: parseFloat(parts[1]) || 0,
          y: parseFloat(parts[2]) || 0,
          z: parseFloat(parts[3]) || 0,
          rx: parseFloat(parts[4]) || 0,
          ry: parseFloat(parts[5]) || 0,
          rz: parseFloat(parts[6]) || 0,
          rawAdc: [2048, 2048, 2048, 2048, 2048, 2048],
          buttonsPressed: this.decodeButtonBitmask(parseInt(parts[7], 10) || 0),
          timestamp: Date.now(),
        };
        if (this.onPacketCallback) this.onPacketCallback(state);
        return;
      }
    }

    // NVS ACKs & Status Notifications
    if (line.startsWith('$CONFIG,')) {
      const parts = line.split(',');
      if (parts.length >= 7) {
        // $CONFIG,activeIdx,totalActiveProfiles,name,primaryColor,...
        const activeIdx = parseInt(parts[1], 10);
        const totalCount = parseInt(parts[2], 10);
        if (!isNaN(activeIdx)) this.hardwareActiveProfileIdx = activeIdx;
        if (!isNaN(totalCount) && totalCount >= 1 && totalCount <= 16) {
          this.hardwareProfileCount = totalCount;
        }
      }
      this.log(`HARDWARE: ${line}`, 'info');
      return;
    }

    if (line.startsWith('$ACK,SET_PROFILE_COUNT,')) {
      const parts = line.split(',');
      const count = parseInt(parts[2], 10);
      if (!isNaN(count)) this.hardwareProfileCount = count;
      this.log(`HARDWARE: ${line}`, 'info');
      return;
    }

    if (line.startsWith('$ACK,SET_ACTIVE_PROFILE,') || line.startsWith('$ACK,PROFILE_SWAP,')) {
      const parts = line.split(',');
      const idx = parseInt(parts[2], 10);
      if (!isNaN(idx)) this.hardwareActiveProfileIdx = idx;
      this.log(`HARDWARE: ${line}`, 'info');
      return;
    }

    if (line.startsWith('$ACK,') || line.startsWith('$BAT,') || line.startsWith('$MODE,') || line.startsWith('$BTN_')) {
      this.log(`HARDWARE: ${line}`, 'info');
      return;
    }

    if (line.startsWith('$ERR,')) {
      this.log(`HARDWARE: ${line}`, 'error');
      return;
    }

    // Log raw serial/BLE line
    this.log(`RX: ${line}`, 'rx');
  }

  private decodeButtonBitmask(mask: number): boolean[] {
    const btns: boolean[] = [];
    for (let i = 0; i < 16; i++) {
      btns.push((mask & (1 << i)) !== 0);
    }
    return btns;
  }

  private log(message: string, type: 'rx' | 'tx' | 'info' | 'error') {
    if (this.onLogCallback) {
      this.onLogCallback(message, type);
    }
  }
}

export const hardwareConnection = new HardwareConnectionManager();
// Alias for backward compatibility
export const serialManager = hardwareConnection;
