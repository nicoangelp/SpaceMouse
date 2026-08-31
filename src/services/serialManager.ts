import { SixDofState } from '../types';

export type SerialPacketCallback = (data: SixDofState) => void;
export type SerialLogCallback = (log: string, type: 'rx' | 'tx' | 'info' | 'error') => void;

class SerialManager {
  private port: any | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private isReading: boolean = false;
  private onPacketCallback: SerialPacketCallback | null = null;
  private onLogCallback: SerialLogCallback | null = null;
  private packetCount: number = 0;
  private lastHzTime: number = Date.now();
  public currentHz: number = 0;
  public isConnected: boolean = false;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public setCallbacks(onPacket: SerialPacketCallback, onLog: SerialLogCallback) {
    this.onPacketCallback = onPacket;
    this.onLogCallback = onLog;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      this.log('Web Serial API is not supported in this browser. Use Chrome/Edge/Opera.', 'error');
      return false;
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;
      this.log(`Connected to Serial Port at ${baudRate} baud.`, 'info');

      this.startReading();
      return true;
    } catch (err: any) {
      this.log(`Serial connection error: ${err.message || err}`, 'error');
      this.isConnected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.isReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      this.isConnected = false;
      this.log('Serial Port disconnected.', 'info');
    } catch (err: any) {
      this.log(`Error during disconnect: ${err.message}`, 'error');
    }
  }

  public async sendCommand(cmd: string): Promise<boolean> {
    if (!this.port || !this.isConnected) {
      this.log(`Cannot send "${cmd}": Serial not connected.`, 'error');
      return false;
    }

    try {
      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable, { preventClose: true });
      const writer = textEncoder.writable.getWriter();
      await writer.write(cmd + '\n');
      writer.releaseLock();
      this.log(`TX: ${cmd}`, 'tx');
      return true;
    } catch (err: any) {
      this.log(`TX Error: ${err.message}`, 'error');
      return false;
    }
  }

  private async startReading() {
    this.isReading = true;
    let buffer = '';

    while (this.port && this.port.readable && this.isReading) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep trailing incomplete chunk

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              this.parseLine(trimmed);
            }
          }
        }
      } catch (err: any) {
        this.log(`Read error: ${err.message}`, 'error');
      } finally {
        if (this.reader) {
          this.reader.releaseLock();
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

    // JSON Format: {"x":0.12,"y":-0.05,"z":0.0,"rx":0.0,"ry":0.0,"rz":0.0,"adc":[...],"btns":3}
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

    // CSV Format: $SM,x,y,z,rx,ry,rz,btns
    if (line.startsWith('$SM,')) {
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

    // Generic response / ACK / Log
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

export const serialManager = new SerialManager();
