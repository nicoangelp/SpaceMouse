var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config({ path: ".env.local" });
import_dotenv.default.config({ path: ".env" });
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "5mb" }));
var geminiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}
function generateLocalHardwareAdvice(prompt, context) {
  const lower = (prompt || "").toLowerCase();
  if (lower.includes("wire") || lower.includes("wiring") || lower.includes("pin") || lower.includes("sensor") || lower.includes("ss49e") || lower.includes("ah49e")) {
    return `### ESP32 6-DOF Hall Effect Sensor Array Wiring Guide

The **OOFO One** uses 6x Linear Hall Effect Sensors (SS49E or AH49E) positioned beneath neodymium disc magnets in a 3D-printed Stewart-platform / compliant flexure layout.

#### Recommended Pin Assignment (ESP32 ADC1):
> **Note:** Always use **ADC1** pins for analog sensor readings because ADC2 conflicts with active Wi-Fi and Bluetooth BLE stacks.

| Hall Sensor Channel | Axis Measured | ESP32 GPIO | ADC Channel | Voltage Range |
| :--- | :--- | :--- | :--- | :--- |
| **Sensor 1 (S1)** | Front Left ($+X, +Z$) | **GPIO 36 (VP)** | ADC1_CH0 | 0.8V \u2013 2.5V (Center ~1.65V) |
| **Sensor 2 (S2)** | Front Right ($-X, +Z$) | **GPIO 39 (VN)** | ADC1_CH3 | 0.8V \u2013 2.5V (Center ~1.65V) |
| **Sensor 3 (S3)** | Rear Center ($+Y, +Z$) | **GPIO 34** | ADC1_CH6 | 0.8V \u2013 2.5V (Center ~1.65V) |
| **Sensor 4 (S4)** | Pitch / Roll 1 | **GPIO 35** | ADC1_CH7 | 0.8V \u2013 2.5V (Center ~1.65V) |
| **Sensor 5 (S5)** | Yaw / Twist 1 | **GPIO 32** | ADC1_CH4 | 0.8V \u2013 2.5V (Center ~1.65V) |
| **Sensor 6 (S6)** | Yaw / Twist 2 | **GPIO 33** | ADC1_CH5 | 0.8V \u2013 2.5V (Center ~1.65V) |

#### Power & Decoupling Circuit:
- **VCC:** Connect all SS49E $V_{CC}$ pins to the filtered **3.3V rail** (do *not* use 5V directly or you will exceed ESP32 ADC max input voltage).
- **Decoupling Capacitors:** Place a **0.1\xB5F (100nF) ceramic capacitor** across $V_{CC}$ and $GND$ close to each sensor group to suppress switching noise.
- **Low-Pass RC Filter:** Add a 1k\u03A9 resistor in series with the analog output and a 10nF capacitor to ground before the ADC pin to eliminate high-frequency EMI.`;
  }
  if (lower.includes("decoupl") || lower.includes("matrix") || lower.includes("cross-talk") || lower.includes("crosstalk") || lower.includes("kinematic")) {
    return `### 6-DOF Cross-Talk Decoupling Matrix Mathematics

In a compliant mechanism or Stewart platform, pressing the puck down ($+Z$) or pushing forward ($+Y$) inevitably causes minor parasitic deflections in adjacent sensors. A **$6 \\times 6$ linear decoupling matrix** transforms raw calibrated sensor readings into pure, decoupled 6-DOF Cartesian axes ($X, Y, Z, Rx, Ry, Rz$).

$$\\begin{bmatrix} X \\\\ Y \\\\ Z \\\\ R_x \\\\ R_y \\\\ R_z \\end{bmatrix} = \\mathbf{M}_{6\\times6} \\times \\begin{bmatrix} S_1 - S_{1,\\text{center}} \\\\ S_2 - S_{2,\\text{center}} \\\\ S_3 - S_{3,\\text{center}} \\\\ S_4 - S_{4,\\text{center}} \\\\ S_5 - S_{5,\\text{center}} \\\\ S_6 - S_{6,\\text{center}} \\end{bmatrix}$$

#### Ideal Calibration Procedure:
1. **Zero Calibration:** Sample 200 readings at rest with hands off the device to record $S_{\\text{center}}$ offsets.
2. **Pure Axis Deflection:** Deflect the controller along a single pure axis (e.g. pure $+X$ slide). Record the sensor response vector $\\vec{v}_X$.
3. **Inversion & Normalization:** Form the forward response matrix $\\mathbf{A} = [\\vec{v}_X, \\vec{v}_Y, \\vec{v}_Z, \\vec{v}_{Rx}, \\vec{v}_{Ry}, \\vec{v}_{Rz}]$ and compute the inverse $\\mathbf{M} = \\mathbf{A}^{-1}$.
4. **Firmware Execution:** In the 100Hz loop, the firmware executes a single matrix-vector multiplication with zero floating-point division for ultra-low latency.`;
  }
  if (lower.includes("fusion") || lower.includes("cad") || lower.includes("blender") || lower.includes("solidworks") || lower.includes("macro") || lower.includes("hotkey")) {
    return `### Optimized CAD & 3D Navigation Macro Setup

#### 1. Autodesk Fusion 360:
- **Navigation Type:** In *Preferences > General > Pan, Zoom, Orbit shortcuts*, select **Fusion** or **Inventor**.
- **Recommended 9-Key Keypad Layout:**
  - **Key 1:** \`Shift + MMB\` \u2014 Orbit Viewport
  - **Key 2:** \`MMB\` \u2014 Pan Viewport
  - **Key 3:** \`F6\` \u2014 Home / Isometric Fit View
  - **Key 4:** \`E\` \u2014 Extrude feature
  - **Key 5:** \`S\` \u2014 Design Shortcut Search Toolbar
  - **Key 6:** \`C\` \u2014 Center Diameter Circle
  - **Key 7:** \`L\` \u2014 Line Tool
  - **Key 8:** \`D\` \u2014 Sketch Dimension
  - **Key 9:** \`Escape\` \u2014 Cancel / Clear Selection

#### 2. Blender 4.x / 5.x:
- In *Preferences > Input > NDOF*, set Mode to **Free / Orbit**, Sensitivity to **1.0**, and enable *Lock Horizon* for architectural visualization.
- Keypad map: \`Numpad .\` (Frame Selected), \`Numpad 7\` (Top View), \`Numpad 1\` (Front View), \`G\` (Grab/Move), \`R\` (Rotate), \`Tab\` (Toggle Edit Mode).`;
  }
  if (lower.includes("noise") || lower.includes("drift") || lower.includes("jitter") || lower.includes("adc") || lower.includes("filter") || lower.includes("smooth")) {
    return `### Eliminating ESP32 ADC Noise & Thermal Drift

The ESP32's built-in SAR ADC can exhibit non-linearity and high-frequency noise. Here is the multi-stage filter pipeline implemented in OOFO One:

1. **Hardware Oversampling:**
   - Sample each ADC channel 16 times in rapid burst mode using \`analogReadMilliVolts()\` with internal $V_{\\text{ref}}$ calibration.
2. **Jitter Gate:**
   - Discard deflections below the configurable Jitter Threshold ($pm 1.5\\%$ of range) to eliminate baseline analog fluctuation.
3. **Exponential Moving Average (EMA Low-Pass):**
   $$Y_t = \\alpha \\cdot X_t + (1 - \\alpha) \\cdot Y_{t-1}$$
   - **Recommended $\\alpha$:** \`0.28\` to \`0.35\` provides crisp response with zero perceptible smoothing lag.
4. **Deadzone & S-Curve Remapping:**
   - Deadzone cuts out the center rest position ($pm 6-8\\%$).
   - Quadratic or Cubic S-Curves enable ultra-fine millimeter positioning near center while allowing high-speed panning at maximum throw.`;
  }
  if (lower.includes("battery") || lower.includes("power") || lower.includes("sleep") || lower.includes("deep sleep") || lower.includes("ble")) {
    return `### ESP32 Battery & Power Optimization Strategy

For wireless operation with a 1200mAh LiPo battery (1S 3.7V):

1. **Dual Power Modes:**
   - **Light Sleep (Dynamic Frequency Scaling):** When idle for 5\u201315 minutes, reduce CPU clock from 240MHz down to 80MHz or 40MHz, dim the 24-LED ring to 10% brightness. Current drops from ~95mA to ~18mA.
   - **Deep Sleep:** After 30\u201360 minutes of inactivity, shutdown BLE and core peripherals, putting the ESP32 into Deep Sleep ($< 15\\mu\\text{A}$ draw).
2. **Hardware Wake Triggers:**
   - Configure **ESP32 EXT1 Wakeup** across the 9 keypad pins (\`esp_sleep_enable_ext1_wakeup\`). Tapping any key instantly wakes the system with full state restored from NVS Flash.
3. **Battery Fuel Gauge:**
   - Read cell voltage through a $2\\times 100\\text{k}\\Omega$ voltage divider on GPIO 34.
   - The 24-LED NeoPixel ring animates green ($>3.9V$), amber ($3.6-3.8V$), and flashing red ($<3.4V$).`;
  }
  return `### OOFO One DIY SpaceMouse Engineering Guide

Here is an architectural summary for your 6-DOF controller build:

1. **Microcontroller Architecture:**
   - **ESP32-S3 / ESP32-WROOM:** Native BLE Gamepad & Web Bluetooth + High-speed 115200/921600 baud Serial telemetry.
2. **Kinematic Decoupling & Curves:**
   - Real-time $6 \\times 6$ cross-talk matrix eliminates interference between translation ($X,Y,Z$) and rotation ($Rx,Ry,Rz$).
   - Per-axis configurable deadzones ($0-30\\%$) and S-Curve response formulas.
3. **Keypad & Fast Navigation:**
   - 9 mechanical switches with dual-action tap & hold commands (e.g. Tap = Extrude, Hold = Revolve).
4. **Onboard Flash Memory:**
   - Complete multi-profile storage directly in ESP32 NVS Flash partition for zero-driver host independence.

*Feel free to ask specific questions about schematic wiring, calibration formulas, CAD shortcuts, or C++ firmware functions!*`;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.7-flash",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/gemini/assist", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const ai = getGeminiClient();
    if (!ai) {
      const localAdvice = generateLocalHardwareAdvice(prompt, context);
      return res.json({
        reply: localAdvice,
        isFallback: true,
        source: "local-knowledge-engine"
      });
    }
    const systemInstruction = `You are the lead embedded hardware & CAD navigation engineer for the OOFO One DIY 6-DOF SpaceMouse project.
You specialize in:
1. ESP32, ESP32-S2, ESP32-S3, C++, Arduino, PlatformIO, TinyUSB, BLE HID Gamepad & Keyboard descriptors.
2. 6-DOF Hall effect sensor arrays (SS49E / AH49E), Stewart platforms, 3D printed flexure mechanics, ADC noise reduction, and EMA filtering.
3. 6x6 cross-talk decoupling matrices, response curve mathematical transfer functions (Linear, Expo, Quadratic, Cubic S-Curve), and jitter suppression.
4. Keypad matrix debouncing, dual-action tap vs long-hold dispatching, and 24-LED NeoPixel ring visual status rings.
5. CAD macros, hotkeys, and navigation workflows for Autodesk Fusion 360, Blender 4/5, SolidWorks, FreeCAD, Onshape, and Rhino.
6. ESP32 battery management, voltage dividers, Light Sleep & Deep Sleep with EXT1 pin wake-up.

Provide direct, actionable, engineering-grade answers with clean markdown, pin tables, C++ code snippets, or mathematical formulas when relevant. Format cleanly with markdown headers, bold terms, and code blocks.`;
    const fullPrompt = `${context ? `[Current App Context: ${JSON.stringify(context, null, 2)}]

` : ""}User Question: ${prompt.trim()}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const replyText = response.text || "";
    if (!replyText) {
      const localAdvice = generateLocalHardwareAdvice(prompt, context);
      return res.json({ reply: localAdvice, isFallback: true });
    }
    res.json({ reply: replyText, source: "gemini-3.7-flash" });
  } catch (err) {
    console.error("Gemini assist error, using local knowledge engine:", err);
    const localAdvice = generateLocalHardwareAdvice(req.body?.prompt || "", req.body?.context);
    res.json({
      reply: localAdvice,
      isFallback: true,
      errorNotice: err.message
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DIY SpaceMouse Studio running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
