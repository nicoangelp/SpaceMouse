import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Helper for Gemini AI Assistant
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI SpaceMouse Hardware, Firmware & CAD macro Advisor
app.post("/api/gemini/assist", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback with rich default engineering guidance if no key is provided
      return res.json({
        reply: `### DIY SpaceMouse Hardware & Config Guidance

Here are practical recommendations for your build:

1. **Hardware Architecture**:
   - **Best Choice:** ESP32-S2 or ESP32-S3. They feature native hardware USB (TinyUSB), allowing your DIY SpaceMouse to enumerate as a true Multi-Axis Controller HID device or composite USB device with 0ms latency.
   - **Sensors:** 4x or 6x Linear Hall effect sensors (e.g. SS49E or AH49E) centered around neodymium disc magnets under a spring-suspended knob puck give the smoothest 6-DOF response without mechanical wear.
   - **Alternative Sensors:** Dual 2-axis analog joysticks + MPU6050 6-axis gyro/accelerometer, or strain gauge load cells.

2. **Fusion 360 & Blender Setup**:
   - **Fusion 360:** In Preferences > General, set "Pan, Zoom, Orbit shortcuts" to Fusion (or Tinkercad/Inventor/SolidWorks). For direct HID, use the 3Dconnexion multi-axis controller HID descriptor or map buttons to \`Shift+MMB\` (Orbit), \`MMB\` (Pan), \`F6\` (Fit View), and \`E\` (Extrude).
   - **Blender 4.x / 5.x:** Blender has native NDOFD (3D Mouse) support enabled out of the box in Preferences > Input > NDOF.

3. **Filtering & Deadzones**:
   - Hall sensors usually output analog voltages between 1.0V and 2.3V centered at ~1.65V. Set a 5-10% deadzone to prevent camera drift.
   - Use an Exponential Moving Average (EMA) with $\\alpha = 0.25$ to $0.4$ for buttery smooth camera gliding without noticeable input lag.`,
      });
    }

    const systemInstruction = `You are the lead embedded hardware & CAD navigation engineer for DIY SpaceMouse projects.
You specialize in ESP32, ESP32-S2, ESP32-S3, C++, Arduino, PlatformIO, TinyUSB, USB HID 3Dconnexion descriptors, Hall effect sensor arrays (SS49E), MPU6050 IMUs, calibration decoupling matrices, and CAD hotkey mappings for Autodesk Fusion 360, Blender, SolidWorks, FreeCAD, and Rhino.
Provide direct, concise, clear, and actionable engineering responses with clean C++ snippets, electrical wiring tips, or CAD macro advice when requested.`;

    const fullPrompt = `${context ? `[Context: ${JSON.stringify(context)}]\n\n` : ""}${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || "No response generated." });
  } catch (err: any) {
    console.error("Gemini assist error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI advice" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DIY SpaceMouse Studio running on http://localhost:${PORT}`);
  });
}

startServer();
