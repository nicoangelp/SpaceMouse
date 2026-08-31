import { Profile, SixDofAxesConfig, GlobalFilterConfig, LedRingConfig, PowerManagementConfig, TriangularSpringFlexureConfig } from '../types';

export const createDefaultLedRing = (primaryColor: string, secondaryColor = '#00e5ff', accentColor = '#ff007f'): LedRingConfig => {
  // Generate 24 individual LED colors default gradient/pattern
  const individualLeds: string[] = Array.from({ length: 24 }, (_, i) => {
    if (i < 8) return primaryColor;
    if (i < 16) return secondaryColor;
    return accentColor;
  });

  return {
    brightness: 65, // Comfortable desk underglow
    primaryColor,
    secondaryColor,
    accentColor,
    idleAnimation: 'breathing',
    idleSpeed: 5,
    activeAnimation: 'rotational_twist_swirl',
    activeSpeed: 6,
    individualLeds,
    ledCount: 24,
  };
};

export const createDefaultPowerManagement = (): PowerManagementConfig => ({
  batteryCapacityMah: 4200, // AKZYTUE 3.7V 4200mAh LiPo
  enableLightSleep: true,
  lightSleepTimeoutMin: 15, // 15 min inactivity
  lightSleepLedMode: 'dim_slow_breathe',
  lightSleepCpuFreqMhz: 80, // CPU throttled to 80MHz
  enableDeepSleep: true,
  deepSleepTimeoutMin: 60, // 60 min inactivity -> Hibernate
  wakeOnMotionThreshold: 15, // MPU6050 WOM sensitivity
  wakeOnButtons: true, // Any 9-key press wakes
  autoReconnectBle: true,
  // 2x 100k Ohm Resistor Voltage Divider Battery Monitor
  enableBatterySense: true,
  batteryAdcPin: 35, // ESP32 ADC1 (GPIO 35)
  voltageDividerR1Kohm: 100, // 100 kOhm to Bat (+)
  voltageDividerR2Kohm: 100, // 100 kOhm to GND
  batteryMinVoltage: 3.2, // 3.2V = 0%
  batteryMaxVoltage: 4.2, // 4.2V = 100%
  batteryHotkeyHoldSec: 1.0, // 1.0s long press
  batteryHotkeyButtonIndex: 8, // Button 9 / Center Key
  batteryIndicatorDisplaySec: 3.5, // 3.5s LED fuel gauge duration
});

export const createDefaultTriangularFlexure = (): TriangularSpringFlexureConfig => ({
  flexureGeometry: 'triangular_6_spring_parallel', // Stewart/Delta-derived 3-post paired compression/tension springs
  springRateStiffness: 1.15, // Balanced compliance for 6-spring flexure
  radialSymmetryDeg: 120, // 120-degree 3-column symmetry
  shearTiltDecoupling: 0.88, // Decouples lateral shear (X/Y) from rotation tilt (Rx/Ry)
  axialZPreloadComp: 0.92, // Preload offset compensation for vertical Z push/pull
  torsionYawDamping: 0.90, // Leaky spring decay to suppress continuous gyro drift
});

const defaultAxesConfig: SixDofAxesConfig = {
  x: { deadzone: 8, sensitivity: 1.2, inverted: false, curve: 'quadratic', expoPower: 2.0, minRaw: 800, maxRaw: 3200, centerRaw: 2048 },
  y: { deadzone: 8, sensitivity: 1.2, inverted: false, curve: 'quadratic', expoPower: 2.0, minRaw: 800, maxRaw: 3200, centerRaw: 2048 },
  z: { deadzone: 10, sensitivity: 1.5, inverted: false, curve: 'quadratic', expoPower: 2.2, minRaw: 800, maxRaw: 3200, centerRaw: 2048 },
  rx: { deadzone: 8, sensitivity: 1.0, inverted: false, curve: 's_curve', expoPower: 1.8, minRaw: 800, maxRaw: 3200, centerRaw: 2048 },
  ry: { deadzone: 8, sensitivity: 1.0, inverted: false, curve: 's_curve', expoPower: 1.8, minRaw: 800, maxRaw: 3200, centerRaw: 2048 },
  rz: { deadzone: 10, sensitivity: 1.1, inverted: false, curve: 's_curve', expoPower: 1.8, minRaw: 800, maxRaw: 3200, centerRaw: 2048 },
};

const defaultFilters: GlobalFilterConfig = {
  smoothingAlpha: 0.32,
  jitterThreshold: 3,
  lockPan: false,
  lockRotation: false,
  dominantAxisOnly: false,
  precisionMultiplier: 0.3,
};

export const defaultProfiles: Profile[] = [
  {
    id: 'fusion360-default',
    name: 'Autodesk Fusion 360',
    targetApp: 'fusion360',
    description: 'Optimized 6-DOF navigation with Quick Fit, Extrude, Sketch, and View Cube hotkeys.',
    axes: {
      ...defaultAxesConfig,
      z: { ...defaultAxesConfig.z, inverted: false, sensitivity: 1.4 },
    },
    filters: {
      ...defaultFilters,
      smoothingAlpha: 0.35,
    },
    ledColor: '#ff8800', // Autodesk Orange
    ledRing: createDefaultLedRing('#ff8800', '#00e5ff', '#ff3366'),
    powerManagement: createDefaultPowerManagement(),
    hapticFeedback: true,
    buttons: [
      {
        id: 'btn-1',
        pinNumber: 13,
        label: 'K1: Fit View',
        actionType: 'cad_action',
        keyCombo: ['F6'],
        cadActionName: 'Fit Model to Window (F6)',
        description: 'Zooms and centers all visible geometry in current viewport',
        color: '#0284c7',
      },
      {
        id: 'btn-2',
        pinNumber: 12,
        label: 'K2: Orbit / Pan Lock',
        actionType: 'axis_lock',
        description: 'Toggles between 6-DOF full movement and pure Pan-only translation mode',
        color: '#10b981',
      },
      {
        id: 'btn-3',
        pinNumber: 14,
        label: 'K3: Top View',
        actionType: 'keyCombo',
        keyCombo: ['Numpad7'],
        cadActionName: 'Orthographic Top View',
        description: 'Snaps view camera to Top face',
        color: '#8b5cf6',
      },
      {
        id: 'btn-4',
        pinNumber: 27,
        label: 'K4: Front View',
        actionType: 'keyCombo',
        keyCombo: ['Numpad1'],
        cadActionName: 'Orthographic Front View',
        description: 'Snaps camera to Front face',
        color: '#6366f1',
      },
      {
        id: 'btn-5',
        pinNumber: 26,
        label: 'K5: Extrude (E)',
        actionType: 'keyCombo',
        keyCombo: ['KeyE'],
        cadActionName: 'Extrude Feature',
        description: 'Triggers active Extrude modeling command',
        color: '#f59e0b',
      },
      {
        id: 'btn-6',
        pinNumber: 25,
        label: 'K6: Precision 0.25x',
        actionType: 'precision_mode',
        description: 'Hold to reduce 6-DOF sensitivity to 25% for ultra-fine micro positioning',
        color: '#ec4899',
      },
      {
        id: 'btn-7',
        pinNumber: 33,
        label: 'K7: Undo',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyZ'],
        cadActionName: 'Undo Last Action',
        description: 'Reverts previous modeling operation',
        color: '#ef4444',
      },
      {
        id: 'btn-8',
        pinNumber: 32,
        label: 'K8: Radial Menu',
        actionType: 'radial_menu',
        description: 'Opens 8-way on-screen radial pie menu (Sketch, Measure, Fillet, Hole)',
        color: '#14b8a6',
        radialOptions: [
          { label: 'Create Sketch', keyCombo: ['KeyS'], iconName: 'PenTool' },
          { label: 'Measure (I)', keyCombo: ['KeyI'], iconName: 'Ruler' },
          { label: 'Fillet (F)', keyCombo: ['KeyF'], iconName: 'Circle' },
          { label: 'Chamfer', keyCombo: ['Alt', 'KeyC'], iconName: 'Scissors' },
          { label: 'Isolate', keyCombo: ['Alt', 'KeyI'], iconName: 'Eye' },
          { label: 'Look At', keyCombo: ['F5'], iconName: 'Compass' },
          { label: 'Home View', keyCombo: ['Home'], iconName: 'Home' },
          { label: 'Construct Plane', keyCombo: ['KeyP'], iconName: 'Square' },
        ],
      },
      {
        id: 'btn-9',
        pinNumber: 4,
        label: 'K9: Zero / Tare',
        actionType: 'zero_tare',
        cadActionName: 'Re-zero Center Drift',
        description: 'Instantly resets current spring equilibrium position to neutral center',
        color: '#06b6d4',
      },
    ],
  },
  {
    id: 'blender-default',
    name: 'Blender 4.x / 5.x',
    targetApp: 'blender',
    description: 'Sculpting and 3D Viewport navigation with NDOF 3D mouse emulation and View Selected.',
    axes: {
      ...defaultAxesConfig,
      y: { ...defaultAxesConfig.y, inverted: true },
      rx: { ...defaultAxesConfig.rx, inverted: false },
    },
    filters: {
      ...defaultFilters,
      smoothingAlpha: 0.38,
    },
    ledColor: '#ea580c', // Blender Orange
    ledRing: createDefaultLedRing('#ea580c', '#38bdf8', '#fbbf24'),
    powerManagement: createDefaultPowerManagement(),
    hapticFeedback: true,
    buttons: [
      {
        id: 'btn-1',
        pinNumber: 4,
        label: 'View Selected',
        actionType: 'keyCombo',
        keyCombo: ['NumpadDecimal'],
        cadActionName: 'Frame Selected Object (Numpad .)',
        description: 'Frames active mesh in center of viewport',
        color: '#0284c7',
      },
      {
        id: 'btn-2',
        pinNumber: 5,
        label: 'Quad View Toggle',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'Alt', 'KeyQ'],
        cadActionName: 'Toggle 4-Way Quad View',
        description: 'Splits view into Top, Front, Right, and 3D Perspective',
        color: '#10b981',
      },
      {
        id: 'btn-3',
        pinNumber: 6,
        label: 'Camera View',
        actionType: 'keyCombo',
        keyCombo: ['Numpad0'],
        cadActionName: 'Active Camera View (Numpad 0)',
        description: 'Toggles look-through active render camera',
        color: '#8b5cf6',
      },
      {
        id: 'btn-4',
        pinNumber: 7,
        label: 'Wireframe Shading',
        actionType: 'keyCombo',
        keyCombo: ['KeyZ'],
        cadActionName: 'Viewport Shading Pie Menu (Z)',
        description: 'Quick toggle between Solid, Wireframe, and Rendered preview',
        color: '#6366f1',
      },
      {
        id: 'btn-5',
        pinNumber: 15,
        label: 'Front Ortho',
        actionType: 'keyCombo',
        keyCombo: ['Numpad1'],
        description: 'Snaps to Front Orthographic view',
        color: '#f59e0b',
      },
      {
        id: 'btn-6',
        pinNumber: 16,
        label: 'Precision Mode',
        actionType: 'precision_mode',
        description: 'Reduces translation and rotation speed to 25% for fine sculpting',
        color: '#ec4899',
      },
      {
        id: 'btn-7',
        pinNumber: 17,
        label: 'Undo',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyZ'],
        description: 'Undo last transform or sculpting stroke',
        color: '#ef4444',
      },
      {
        id: 'btn-8',
        pinNumber: 18,
        label: 'Zero Tare',
        actionType: 'zero_tare',
        description: 'Re-zeroes the SpaceMouse sensor drift in current position',
        color: '#14b8a6',
      },
    ],
  },
  {
    id: 'solidworks-default',
    name: 'SolidWorks',
    targetApp: 'solidworks',
    description: 'Parametric CAD navigation with Zoom to Fit, Normal To, and Feature Tree hotkeys.',
    axes: {
      ...defaultAxesConfig,
      z: { ...defaultAxesConfig.z, inverted: true, sensitivity: 1.3 },
    },
    filters: {
      ...defaultFilters,
      smoothingAlpha: 0.3,
    },
    ledColor: '#dc2626', // SolidWorks Red
    ledRing: createDefaultLedRing('#dc2626', '#0284c7', '#f59e0b'),
    powerManagement: createDefaultPowerManagement(),
    hapticFeedback: true,
    buttons: [
      {
        id: 'btn-1',
        pinNumber: 4,
        label: 'Zoom to Fit (F)',
        actionType: 'keyCombo',
        keyCombo: ['KeyF'],
        cadActionName: 'Zoom to Fit (F)',
        description: 'Auto-fits entire assembly into the graphics area',
        color: '#0284c7',
      },
      {
        id: 'btn-2',
        pinNumber: 5,
        label: 'Normal To',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'Digit8'],
        cadActionName: 'Normal To Plane (Ctrl+8)',
        description: 'Rotates camera normal to selected planar face or sketch',
        color: '#10b981',
      },
      {
        id: 'btn-3',
        pinNumber: 6,
        label: 'Isometric (Ctrl+7)',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'Digit7'],
        cadActionName: 'Isometric Standard View',
        description: 'Snaps to standard Dimetric/Isometric orientation',
        color: '#8b5cf6',
      },
      {
        id: 'btn-4',
        pinNumber: 7,
        label: 'Rebuild (Ctrl+B)',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyB'],
        cadActionName: 'Rebuild Active Part/Assembly',
        description: 'Re-evaluates feature tree and updates geometry',
        color: '#6366f1',
      },
      {
        id: 'btn-5',
        pinNumber: 15,
        label: 'Measure Tool',
        actionType: 'cad_action',
        keyCombo: ['KeyM'],
        description: 'Launches distance and angle measuring tool',
        color: '#f59e0b',
      },
      {
        id: 'btn-6',
        pinNumber: 16,
        label: 'Lock Rotation',
        actionType: 'axis_lock',
        description: 'Locks rotation axes so only pure 2D/3D Pan and Zoom move',
        color: '#ec4899',
      },
      {
        id: 'btn-7',
        pinNumber: 17,
        label: 'Undo',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyZ'],
        description: 'Undo previous sketch entity or feature edit',
        color: '#ef4444',
      },
      {
        id: 'btn-8',
        pinNumber: 18,
        label: 'Smart Dimension',
        actionType: 'keyCombo',
        keyCombo: ['KeyD'],
        description: 'Activates Smart Dimension tool in sketch mode',
        color: '#14b8a6',
      },
    ],
  },
  {
    id: 'freecad-default',
    name: 'FreeCAD',
    targetApp: 'freecad',
    description: 'Open-source parametric modeler with OpenSCAD/Blender navigation preset bindings.',
    axes: {
      ...defaultAxesConfig,
      y: { ...defaultAxesConfig.y, sensitivity: 1.1 },
    },
    filters: {
      ...defaultFilters,
      smoothingAlpha: 0.35,
    },
    ledColor: '#9333ea', // FreeCAD Purple
    ledRing: createDefaultLedRing('#9333ea', '#06b6d4', '#ec4899'),
    powerManagement: createDefaultPowerManagement(),
    hapticFeedback: false,
    buttons: [
      {
        id: 'btn-1',
        pinNumber: 4,
        label: 'Fit All (V,F)',
        actionType: 'keyCombo',
        keyCombo: ['KeyV', 'KeyF'],
        description: 'Fit all objects into viewport',
        color: '#0284c7',
      },
      {
        id: 'btn-2',
        pinNumber: 5,
        label: 'Isometric View (0)',
        actionType: 'keyCombo',
        keyCombo: ['Digit0'],
        description: 'Standard Axonometric isometric angle',
        color: '#10b981',
      },
      {
        id: 'btn-3',
        pinNumber: 6,
        label: 'Top View (2)',
        actionType: 'keyCombo',
        keyCombo: ['Digit2'],
        description: 'Switch to Top orthographic view',
        color: '#8b5cf6',
      },
      {
        id: 'btn-4',
        pinNumber: 7,
        label: 'Front View (1)',
        actionType: 'keyCombo',
        keyCombo: ['Digit1'],
        description: 'Switch to Front view',
        color: '#6366f1',
      },
      {
        id: 'btn-5',
        pinNumber: 15,
        label: 'Precision Mode',
        actionType: 'precision_mode',
        description: '0.25x micro movements',
        color: '#f59e0b',
      },
      {
        id: 'btn-6',
        pinNumber: 16,
        label: 'Lock Pan',
        actionType: 'axis_lock',
        description: 'Orbit-only mode',
        color: '#ec4899',
      },
      {
        id: 'btn-7',
        pinNumber: 17,
        label: 'Undo',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyZ'],
        description: 'Undo command',
        color: '#ef4444',
      },
      {
        id: 'btn-8',
        pinNumber: 18,
        label: 'Zero Tare',
        actionType: 'zero_tare',
        description: 'Re-calibrate center',
        color: '#14b8a6',
      },
    ],
  },
  {
    id: 'bambu-slicer-default',
    name: 'Bambu Studio / OrcaSlicer',
    targetApp: 'bambu',
    description: '3D printing bed inspection, plate rotation, auto-arrange, and slice trigger.',
    axes: {
      ...defaultAxesConfig,
      z: { ...defaultAxesConfig.z, sensitivity: 1.6 },
    },
    filters: defaultFilters,
    ledColor: '#16a34a', // Bambu Green
    ledRing: createDefaultLedRing('#16a34a', '#06b6d4', '#84cc16'),
    powerManagement: createDefaultPowerManagement(),
    hapticFeedback: true,
    buttons: [
      {
        id: 'btn-1',
        pinNumber: 4,
        label: 'Auto Orient / Arrange',
        actionType: 'keyCombo',
        keyCombo: ['KeyA'],
        description: 'Auto-arranges models on print build plate',
        color: '#0284c7',
      },
      {
        id: 'btn-2',
        pinNumber: 5,
        label: 'Slice Plate (Ctrl+R)',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyR'],
        description: 'Generates G-code toolpaths',
        color: '#10b981',
      },
      {
        id: 'btn-3',
        pinNumber: 6,
        label: 'Top View',
        actionType: 'keyCombo',
        keyCombo: ['Digit1'],
        description: 'Look down from top onto build plate',
        color: '#8b5cf6',
      },
      {
        id: 'btn-4',
        pinNumber: 7,
        label: 'Home View',
        actionType: 'keyCombo',
        keyCombo: ['Home'],
        description: 'Returns view to default angled plate perspective',
        color: '#6366f1',
      },
      {
        id: 'btn-5',
        pinNumber: 15,
        label: 'Scale Object',
        actionType: 'keyCombo',
        keyCombo: ['KeyS'],
        description: 'Activates scale handles',
        color: '#f59e0b',
      },
      {
        id: 'btn-6',
        pinNumber: 16,
        label: 'Rotate Object',
        actionType: 'keyCombo',
        keyCombo: ['KeyR'],
        description: 'Activates rotation rings',
        color: '#ec4899',
      },
      {
        id: 'btn-7',
        pinNumber: 17,
        label: 'Undo',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyZ'],
        description: 'Undo change',
        color: '#ef4444',
      },
      {
        id: 'btn-8',
        pinNumber: 18,
        label: 'Send / Print',
        actionType: 'keyCombo',
        keyCombo: ['Control', 'KeyP'],
        description: 'Open Print dialog to send to 3D printer',
        color: '#14b8a6',
      },
    ],
  },
];
