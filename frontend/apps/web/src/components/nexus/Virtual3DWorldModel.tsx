'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    Box,
    Layers,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Compass,
    Eye,
    Activity,
    Thermometer,
    Zap,
    ShieldAlert,
    Clock,
    Flame,
    Maximize2,
    RefreshCw,
    Radio,
    Cpu,
    CheckCircle2,
    Sliders,
    Camera,
    Info,
    X,
    Crosshair,
    Navigation,
    Gauge,
    Sparkles,
    AlertTriangle,
    Bot,
    Send,
    Wind,
    Terminal,
    Check,
    Volume2,
    VolumeX,
    Wrench,
    Droplets,
    Play,
    Pause,
    ShieldCheck,
} from 'lucide-react';

// =========================================================================
// TYPES & CONTRACTS (BACKWARD COMPATIBLE & ULTRA-EXTENDED)
// =========================================================================

export type CameraPreset =
    | 'OVERVIEW'
    | 'STAT_CHEMISTRY'
    | 'HEMATOLOGY_LINE'
    | 'CENTRIFUGE_HUB'
    | 'ROBOTIC_DECAPPER'
    | 'COLD_ARCHIVE'
    | 'MASS_SPEC_WING'
    | 'PNEUMATIC_BAY'
    | 'AGV_PATROL'
    | 'AGV_FPV_COCKPIT'
    | 'PNEUMATIC_POV_FLYBY'
    | 'DIRECTOR_ORBIT_CINEMATIC';

export type RenderMode =
    | 'HOLOGRAPHIC_3D'
    | 'REALISTIC_CAD'
    | 'THERMAL_HEATMAP'
    | 'QUEUE_FRICTION'
    | 'CLEANROOM_AIRFLOW'
    | 'ELECTROMAGNETIC_FLUX'
    | 'ARCHITECTURAL_2D'
    | 'CYBER_NEON_GRID';

export interface WorkstationNode3D {
    id: string;
    name: string;
    shortName: string;
    department:
        | 'BIOCHEMISTRY'
        | 'HEMATOLOGY'
        | 'IMMUNOASSAY'
        | 'COAGULATION'
        | 'MICROBIOLOGY'
        | 'MASS_SPECTROMETRY'
        | 'PRE_ANALYTICAL'
        | 'ARCHIVE'
        | 'AIR_TRANSIT'
        | 'DECONTAMINATION';
    zoneId: string;
    gridX: number; // 3D local coordinate X (m)
    gridY: number; // 3D local coordinate Y (m)
    width: number;
    depth: number;
    height: number;
    color: string;
    status: 'ONLINE' | 'STAT_PROCESSING' | 'MAINTENANCE_WARNING' | 'CRITICAL_HOLD' | 'DECONTAMINATING';
    throughputPerHour: number;
    currentWip: number;
    temperatureC: number;
    opticalLampHours: number;
    vacuumPressureKpa: number;
    reagentRemainingPct: number;
    rulHours: number;
    rpm?: number;
    rcfG?: number;
    rotorImbalanceGmm?: number;
    laserScatterHours?: number;
    ionSourceGlow?: boolean;
    cleanroomIsoClass?: string;
}

export interface SpecimenTube3D {
    carrierId: string;
    barcode: string;
    patientUhid: string;
    capColorHex: string;
    capLabel: string;
    department: string;
    priority: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE';
    trackProgress: number; // 0.0 to 1.0 along route
    routeIndex: number;
    viabilityPct: number;
    elapsedMinutes: number;
    speedMultiplier?: number;
    isExpressBypass?: boolean;
    testsOrdered?: string[];
}

export interface AgvRobot3D {
    id: string;
    name: string;
    callsign: string;
    posX: number;
    posY: number;
    headingDeg: number;
    targetWaypointIdx: number;
    status: 'NAVIGATING' | 'DOCKING' | 'LOADING' | 'AVOIDING_OBSTACLE';
    batteryPct: number;
    payloadSamples: number;
    payloadType: string;
    lidarScanAngleDeg: number;
}

export interface PneumaticCapsule3D {
    id: string;
    originWard: string;
    destinationHub: string;
    progress: number; // 0.0 to 1.0
    velocityMps: number;
    priority: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE';
    patientUhid: string;
    barcode: string;
    testName: string;
}

export interface CleanroomSensor3D {
    id: string;
    zoneName: string;
    gridX: number;
    gridY: number;
    isoClass: string;
    particlesPerM3: number;
    maxLimit: number;
    tempC: number;
    rhPct: number;
    pressurePa: number;
    status: 'OPTIMAL' | 'ELEVATED' | 'LEAK_WARNING';
}

export interface Virtual3DWorldModelProps {
    facilityName?: string;
    emergencyCode?: string;
    onSelectWorkstation?: (workstation: WorkstationNode3D) => void;
    onSelectTube?: (tube: SpecimenTube3D) => void;
    onSelectAgv?: (agv: AgvRobot3D) => void;
    onSelectCapsule?: (capsule: PneumaticCapsule3D) => void;
    onInjectStatSpecimen?: (carrier?: any) => void;
    onLaunchPneumatic?: (capsule?: any) => void;
    onTriggerUvc?: () => void;
    onDispatchWorkOrder?: (analyzerId: string, taskTitle: string) => void;
}


// =========================================================================
// SOUND SYNTHESIZER (WEB AUDIO API BROWSER NATIVE)
// =========================================================================

class SoundFxSynthesizer {
    private ctx: AudioContext | null = null;
    public isMuted: boolean = false;

    private init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    public playClick() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        } catch {
            // Ignore
        }
    }

    public playWhoosh() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch {
            // Ignore
        }
    }

    public playStatAlarm() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(1040, now + 0.1);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch {
            // Ignore
        }
    }

    public playSonar() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1480, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        } catch {
            // Ignore
        }
    }

    public playPneumaticLaunch() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch {
            // Ignore
        }
    }

    public playBiometricChime() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.04, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.28);
            });
        } catch {
            // Ignore
        }
    }

    public playCentrifugeWhir() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(920, now + 0.45);
            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        } catch {
            // Ignore
        }
    }

    public speak(announcement: string) {
        if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(announcement);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            utterance.volume = 0.75;
            window.speechSynthesis.speak(utterance);
        } catch {
            // Ignore
        }
    }
}

const sfx = new SoundFxSynthesizer();

// =========================================================================
// QUATERNARY HOSPITAL PROCEDURAL 3D WORKSTATION FLEET (13 ENGINES)
// =========================================================================

const WORKSTATIONS_3D: WorkstationNode3D[] = [
    {
        id: 'ANZ-BIO-01',
        name: 'Roche Cobas Pro c503 Chemistry & ISE Hub #1',
        shortName: 'Cobas c503 #1',
        department: 'BIOCHEMISTRY',
        zoneId: 'ZONE-CORE-BIO',
        gridX: -150,
        gridY: -65,
        width: 85,
        depth: 60,
        height: 56,
        color: '#06b6d4',
        status: 'ONLINE',
        throughputPerHour: 1000,
        currentWip: 26,
        temperatureC: 37.0,
        opticalLampHours: 1420,
        vacuumPressureKpa: -82.4,
        reagentRemainingPct: 84,
        rulHours: 3200,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-BIO-02',
        name: 'Roche Cobas Pro c503 Chemistry & ISE Hub #2',
        shortName: 'Cobas c503 #2',
        department: 'BIOCHEMISTRY',
        zoneId: 'ZONE-CORE-BIO',
        gridX: -150,
        gridY: 35,
        width: 85,
        depth: 60,
        height: 56,
        color: '#06b6d4',
        status: 'STAT_PROCESSING',
        throughputPerHour: 1000,
        currentWip: 42,
        temperatureC: 37.1,
        opticalLampHours: 2180,
        vacuumPressureKpa: -81.9,
        reagentRemainingPct: 42,
        rulHours: 1950,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-HEM-01',
        name: 'Sysmex XN-9100 Hematology Automation Line A',
        shortName: 'Sysmex XN-9100 A',
        department: 'HEMATOLOGY',
        zoneId: 'ZONE-CORE-HEM',
        gridX: 20,
        gridY: -115,
        width: 110,
        depth: 52,
        height: 60,
        color: '#a855f7',
        status: 'ONLINE',
        throughputPerHour: 220,
        currentWip: 18,
        temperatureC: 22.4,
        opticalLampHours: 920,
        laserScatterHours: 3410,
        vacuumPressureKpa: -74.0,
        reagentRemainingPct: 91,
        rulHours: 4100,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-HEM-02',
        name: 'Sysmex SP-50 Automated Slide Maker & Stainer',
        shortName: 'Sysmex SP-50',
        department: 'HEMATOLOGY',
        zoneId: 'ZONE-CORE-HEM',
        gridX: 140,
        gridY: -115,
        width: 55,
        depth: 46,
        height: 50,
        color: '#c084fc',
        status: 'ONLINE',
        throughputPerHour: 120,
        currentWip: 7,
        temperatureC: 23.0,
        opticalLampHours: 1650,
        vacuumPressureKpa: -68.5,
        reagentRemainingPct: 76,
        rulHours: 2800,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-HEM-03',
        name: 'Sysmex DI-60 Automated Digital Morphology System',
        shortName: 'Sysmex DI-60 AI',
        department: 'HEMATOLOGY',
        zoneId: 'ZONE-CORE-HEM',
        gridX: 210,
        gridY: -115,
        width: 50,
        depth: 44,
        height: 48,
        color: '#d946ef',
        status: 'ONLINE',
        throughputPerHour: 80,
        currentWip: 4,
        temperatureC: 22.8,
        opticalLampHours: 850,
        vacuumPressureKpa: -55.0,
        reagentRemainingPct: 98,
        rulHours: 5400,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-IMM-01',
        name: 'Abbott ARCHITECT i2000SR Chemiluminescence',
        shortName: 'ARCHITECT i2000SR',
        department: 'IMMUNOASSAY',
        zoneId: 'ZONE-IMMUNO',
        gridX: 20,
        gridY: 35,
        width: 85,
        depth: 55,
        height: 55,
        color: '#f59e0b',
        status: 'ONLINE',
        throughputPerHour: 200,
        currentWip: 15,
        temperatureC: 36.8,
        opticalLampHours: 3100,
        vacuumPressureKpa: -79.2,
        reagentRemainingPct: 62,
        rulHours: 850,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-COAG-01',
        name: 'Stago STA R Max High-Throughput Coagulation',
        shortName: 'Stago STA R Max',
        department: 'COAGULATION',
        zoneId: 'ZONE-COAG',
        gridX: 125,
        gridY: 35,
        width: 65,
        depth: 50,
        height: 48,
        color: '#38bdf8',
        status: 'ONLINE',
        throughputPerHour: 120,
        currentWip: 9,
        temperatureC: 37.0,
        opticalLampHours: 1200,
        vacuumPressureKpa: -76.0,
        reagentRemainingPct: 88,
        rulHours: 3400,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-MS-01',
        name: 'Thermo Orbitrap Exploris LC-MS/MS Mass Spec Suite',
        shortName: 'Orbitrap LC-MS',
        department: 'MASS_SPECTROMETRY',
        zoneId: 'ZONE-MASS-SPEC',
        gridX: 215,
        gridY: 35,
        width: 80,
        depth: 60,
        height: 62,
        color: '#8b5cf6',
        status: 'ONLINE',
        throughputPerHour: 45,
        currentWip: 6,
        temperatureC: 19.8,
        opticalLampHours: 420,
        vacuumPressureKpa: -98.8,
        reagentRemainingPct: 95,
        rulHours: 7200,
        ionSourceGlow: true,
        cleanroomIsoClass: 'ISO Class 6',
    },
    {
        id: 'ANZ-PRE-CENT-01',
        name: 'Dual High-Speed Robotic Centrifuge Carousel (3,500 RPM)',
        shortName: 'Centrifuge (3k G)',
        department: 'PRE_ANALYTICAL',
        zoneId: 'ZONE-PRE-ANALYTICAL',
        gridX: -150,
        gridY: 140,
        width: 85,
        depth: 72,
        height: 50,
        color: '#10b981',
        status: 'ONLINE',
        throughputPerHour: 360,
        currentWip: 52,
        temperatureC: 20.0,
        opticalLampHours: 400,
        vacuumPressureKpa: -55.0,
        reagentRemainingPct: 100,
        rulHours: 5200,
        rpm: 3500,
        rcfG: 3013,
        rotorImbalanceGmm: 0.028,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-PRE-DECAP-01',
        name: 'SCARA Robotic Decapper & Optical Cap Profiler',
        shortName: 'Robotic SCARA Decapper',
        department: 'PRE_ANALYTICAL',
        zoneId: 'ZONE-PRE-ANALYTICAL',
        gridX: -45,
        gridY: 140,
        width: 65,
        depth: 55,
        height: 52,
        color: '#34d399',
        status: 'ONLINE',
        throughputPerHour: 450,
        currentWip: 14,
        temperatureC: 21.2,
        opticalLampHours: 1900,
        vacuumPressureKpa: -64.0,
        reagentRemainingPct: 100,
        rulHours: 6400,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-ARC-01',
        name: 'High-Density Ultra-Low Cryo-Archive (-80°C / 4°C Vault)',
        shortName: 'Cryo-Archive Vault',
        department: 'ARCHIVE',
        zoneId: 'ZONE-ARCHIVE',
        gridX: 135,
        gridY: 140,
        width: 95,
        depth: 75,
        height: 64,
        color: '#0284c7',
        status: 'ONLINE',
        throughputPerHour: 150,
        currentWip: 480,
        temperatureC: -80.0,
        opticalLampHours: 200,
        vacuumPressureKpa: -40.0,
        reagentRemainingPct: 100,
        rulHours: 12000,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-PNEU-01',
        name: 'Swisslog TranspoNet Pneumatic Air Capsule Infeed',
        shortName: 'Pneumatic Infeed Hub',
        department: 'AIR_TRANSIT',
        zoneId: 'ZONE-AIR-TRANSIT',
        gridX: -150,
        gridY: 225,
        width: 70,
        depth: 50,
        height: 68,
        color: '#84cc16',
        status: 'ONLINE',
        throughputPerHour: 500,
        currentWip: 8,
        temperatureC: 21.0,
        opticalLampHours: 100,
        vacuumPressureKpa: -88.0,
        reagentRemainingPct: 100,
        rulHours: 8900,
        cleanroomIsoClass: 'ISO Class 7',
    },
    {
        id: 'ANZ-AIRLOCK-01',
        name: 'BSL-3 Negative-Pressure Cleanroom Decon Airlock',
        shortName: 'BSL-3 Airlock Decon',
        department: 'DECONTAMINATION',
        zoneId: 'ZONE-BSL3-AIRLOCK',
        gridX: 215,
        gridY: 140,
        width: 60,
        depth: 55,
        height: 58,
        color: '#f43f5e',
        status: 'ONLINE',
        throughputPerHour: 60,
        currentWip: 2,
        temperatureC: 19.5,
        opticalLampHours: 600,
        vacuumPressureKpa: -92.5,
        reagentRemainingPct: 100,
        rulHours: 14500,
        cleanroomIsoClass: 'ISO Class 6',
    },
];

// Continuous MagneMotion Main Track Waypoints (Ground Level, Z=2)
const MAIN_TRACK_WAYPOINTS: [number, number][] = [
    [-190, -65],
    [-190, 140],
    [-100, 140],
    [-100, -65],
    [-20, -65],
    [-20, -115],
    [130, -115],
    [190, -115],
    [260, -115],
    [260, -60],
    [180, -40],
    [130, 35],
    [20, 35],
    [20, 95],
    [135, 135],
    [135, 165],
    [40, 140],
];

// High-Priority STAT Express Bypass Shortcut (Cuts directly to chemistry & hematology)
const STAT_BYPASS_WAYPOINTS: [number, number][] = [
    [-100, 140],
    [-60, 50],
    [-20, -65],
    [20, -115],
    [130, -115],
    [130, 35],
    [-100, 140],
];

// Overhead Pneumatic Tube Path (Z = 72)
const PNEUMATIC_TUBE_PATH: [number, number, number][] = [
    [-230, 240, 72],
    [-150, 225, 72],
    [-80, 180, 72],
    [20, 140, 72],
    [130, 100, 72],
    [220, 50, 72],
];

// Cleanroom Sensor Nodes Across Laboratory Floor
const CLEANROOM_SENSORS: CleanroomSensor3D[] = [
    {
        id: 'SENSOR-CHEM-01',
        zoneName: 'Central Biochemistry Suite',
        gridX: -100,
        gridY: -15,
        isoClass: 'ISO Class 7',
        particlesPerM3: 24120,
        maxLimit: 352000,
        tempC: 20.2,
        rhPct: 44.8,
        pressurePa: 15.2,
        status: 'OPTIMAL',
    },
    {
        id: 'SENSOR-HEM-01',
        zoneName: 'Hematology Automation Wing',
        gridX: 90,
        gridY: -80,
        isoClass: 'ISO Class 7',
        particlesPerM3: 28400,
        maxLimit: 352000,
        tempC: 21.0,
        rhPct: 46.1,
        pressurePa: 14.8,
        status: 'OPTIMAL',
    },
    {
        id: 'SENSOR-MS-BSL3',
        zoneName: 'Mass Spec & BSL-3 Cleanroom',
        gridX: 200,
        gridY: 85,
        isoClass: 'ISO Class 6',
        particlesPerM3: 3100,
        maxLimit: 35200,
        tempC: 19.5,
        rhPct: 42.0,
        pressurePa: -24.5, // Negative pressure barrier!
        status: 'OPTIMAL',
    },
    {
        id: 'SENSOR-CRYO-01',
        zoneName: 'Robotic Cryo-Archive Vault',
        gridX: 135,
        gridY: 180,
        isoClass: 'ISO Class 7',
        particlesPerM3: 1200,
        maxLimit: 352000,
        tempC: 4.0,
        rhPct: 30.0,
        pressurePa: 10.0,
        status: 'OPTIMAL',
    },
];

export const Virtual3DWorldModel: React.FC<Virtual3DWorldModelProps> = ({
    facilityName = 'METROPOLITAN QUATERNARY CENTRAL CORE REFERENCE HOSPITAL',
    emergencyCode = 'NORMAL',
    onSelectWorkstation,
    onSelectTube,
    onSelectAgv,
    onSelectCapsule,
    onInjectStatSpecimen,
    onLaunchPneumatic,
    onTriggerUvc,
    onDispatchWorkOrder,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // 3D Camera & View Controls
    const [cameraAngle, setCameraAngle] = useState<number>(45); // Degrees around Z axis
    const [cameraElevation, setCameraElevation] = useState<number>(36); // Degrees elevation pitch
    const [cameraZoom, setCameraZoom] = useState<number>(1.15);
    const [cameraPanX, setCameraPanX] = useState<number>(0);
    const [cameraPanY, setCameraPanY] = useState<number>(0);
    const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(false);
    const [isFollowTube, setIsFollowTube] = useState<boolean>(false);
    const [isFollowAgv, setIsFollowAgv] = useState<boolean>(false);
    const [renderMode, setRenderMode] = useState<RenderMode>('HOLOGRAPHIC_3D');

    // Layer Visibility Toggles
    const [showOverheadTubes, setShowOverheadTubes] = useState<boolean>(true);
    const [showAgvFleet, setShowAgvFleet] = useState<boolean>(true);
    const [showCleanroomAirflow, setShowCleanroomAirflow] = useState<boolean>(true);
    const [showTacticalRadar, setShowTacticalRadar] = useState<boolean>(true);
    const [showCyberScanlines, setShowCyberScanlines] = useState<boolean>(true);
    const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
    const [activeFacility, setActiveFacility] = useState<string>(facilityName);

    // Interactive Clinical Actions (UV-C, Teleoperation, STAT Injection)
    const [isUvcActive, setIsUvcActive] = useState<boolean>(false);
    const [uvcCountdown, setUvcCountdown] = useState<number>(0);
    const [isManualAgvControl, setIsManualAgvControl] = useState<boolean>(false);

    // Interactive Selection & Hover
    const [hoveredWorkstationId, setHoveredWorkstationId] = useState<string | null>(null);
    const [selectedWorkstation, setSelectedWorkstation] = useState<WorkstationNode3D | null>(null);
    const [selectedTube, setSelectedTube] = useState<SpecimenTube3D | null>(null);
    const [selectedAgv, setSelectedAgv] = useState<AgvRobot3D | null>(null);
    const [selectedCapsule, setSelectedCapsule] = useState<PneumaticCapsule3D | null>(null);

    // Maintenance Action State (Simulates remote biomedical commands)
    const [maintenanceSuccessBanner, setMaintenanceSuccessBanner] = useState<string | null>(null);
    const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

    // Trigger Whole-Lab UV-C Surface Decontamination Cycle
    const handleTriggerUvc = () => {
        setIsUvcActive(true);
        setUvcCountdown(8);
        sfx.playWhoosh();
        sfx.speak('Alert. Whole-room automated UV-C decontamination cycle engaged. Sterilization in progress.');
        if (onTriggerUvc) onTriggerUvc();

        let remaining = 8;
        const interval = setInterval(() => {
            remaining -= 1;
            setUvcCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                setIsUvcActive(false);
                sfx.playSonar();
                sfx.speak('UV-C decontamination complete. Log-6 sterilization achieved.');
            }
        }, 1000);
    };

    // Inject STAT Specimen (Emergency Express Infeed)
    const handleInjectStatTube = (type: 'STROKE' | 'SEPSIS' | 'CARDIAC') => {
        const idNum = Math.floor(1000 + Math.random() * 9000);
        const tubeConfigs = {
            STROKE: { hex: '#38bdf8', label: 'Light Blue Citrate (STAT Stroke Coag)', tests: ['PT/INR', 'aPTT', 'D-Dimer'] },
            SEPSIS: { hex: '#94a3b8', label: 'Grey Fluoride (STAT Sepsis Blood Lactate)', tests: ['Blood Lactate', 'Procalcitonin'] },
            CARDIAC: { hex: '#22c55e', label: 'Green Heparin (STAT High-Sens Troponin I)', tests: ['hs-cTnI', 'CK-MB', 'NT-proBNP'] },
        };
        const config = tubeConfigs[type];
        const newTube: SpecimenTube3D = {
            carrierId: `CARRIER-STAT-${idNum}`,
            barcode: `BC-STAT-${idNum}`,
            patientUhid: `UHID-TRAUMA-${idNum}`,
            capColorHex: config.hex,
            capLabel: config.label,
            department: type === 'STROKE' ? 'COAGULATION' : 'BIOCHEMISTRY',
            priority: 'STAT_EMERGENCY',
            trackProgress: 0.0,
            routeIndex: 0,
            viabilityPct: 100.0,
            elapsedMinutes: 0.1,
            speedMultiplier: 2.2,
            isExpressBypass: true,
            testsOrdered: config.tests,
        };

        setTubes((prev) => [newTube, ...prev]);
        setSelectedTube(newTube);
        sfx.playStatAlarm();
        sfx.speak(`STAT ${type} specimen injected onto express automation track.`);
        if (onInjectStatSpecimen) onInjectStatSpecimen(newTube);
    };

    // Launch High-Speed Aerial Pneumatic Tube Capsule
    const handleLaunchPneumatic = (originWard: string = 'OR-03 Main Cardiac Theatre') => {
        const idNum = Math.floor(100 + Math.random() * 900);
        const newCapsule: PneumaticCapsule3D = {
            id: `CAP-STAT-${idNum}`,
            originWard,
            destinationHub: 'Accessioning Infeed Hub',
            progress: 0.0,
            velocityMps: 14.5,
            priority: 'STAT_EMERGENCY',
            patientUhid: `UHID-OR-${idNum}`,
            barcode: `BC-CAP-${idNum}`,
            testName: 'Emergency Intra-Operative STAT Coag & Blood Gas',
        };

        setPneumaticCapsules((prev) => [newCapsule, ...prev]);
        setSelectedCapsule(newCapsule);
        sfx.playPneumaticLaunch();
        sfx.speak(`Pneumatic vacuum capsule launched from ${originWard}.`);
        if (onLaunchPneumatic) onLaunchPneumatic(newCapsule);
    };

    // Drive AGV via Teleoperation
    const handleDriveAgv = (forwardSpeed: number, turnDeg: number) => {
        setAgvFleet((prev) =>
            prev.map((agv, i) => {
                if (i === 0) {
                    const newHeading = (agv.headingDeg + turnDeg + 360) % 360;
                    const rad = (newHeading * Math.PI) / 180;
                    const newX = Math.max(-140, Math.min(160, agv.posX + Math.cos(rad) * forwardSpeed * 8));
                    const newY = Math.max(-80, Math.min(100, agv.posY + Math.sin(rad) * forwardSpeed * 8));
                    return {
                        ...agv,
                        posX: newX,
                        posY: newY,
                        headingDeg: newHeading,
                        status: forwardSpeed !== 0 ? 'NAVIGATING' : 'DOCKING',
                    };
                }
                return agv;
            })
        );
        sfx.playClick();
    };


    // Drag-to-Rotate / Drag-to-Pan state
    const isDraggingRef = useRef<boolean>(false);
    const dragModeRef = useRef<'ROTATE' | 'PAN'>('ROTATE');
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Real-Time Physics & Animation Loops
    const [rotorAngle, setRotorAngle] = useState<number>(0);
    const [scaraCycleSec, setScaraCycleSec] = useState<number>(0);
    const [linearMotorPulseOffset, setLinearMotorPulseOffset] = useState<number>(0);
    const [plasmaFlicker, setPlasmaFlicker] = useState<number>(0.85);

    // Specimen Tube Fleet Simulation (7 Distinct Hospital Vacutainer Tubes)
    const [tubes, setTubes] = useState<SpecimenTube3D[]>([
        {
            carrierId: 'CARRIER-STAT-901',
            barcode: 'BC-TROP-9021',
            patientUhid: 'UHID-7729-ICU',
            capColorHex: '#22c55e',
            capLabel: 'Green Heparin (STAT High-Sens Troponin I)',
            department: 'BIOCHEMISTRY',
            priority: 'STAT_EMERGENCY',
            trackProgress: 0.18,
            routeIndex: 2,
            viabilityPct: 98.4,
            elapsedMinutes: 4.2,
            speedMultiplier: 1.8,
            isExpressBypass: true,
            testsOrdered: ['hs-cTnI', 'CK-MB', 'NT-proBNP'],
        },
        {
            carrierId: 'CARRIER-CBC-412',
            barcode: 'BC-CBC-8812',
            patientUhid: 'UHID-4421-ED',
            capColorHex: '#a855f7',
            capLabel: 'Lavender EDTA (Complete Blood Count + Diff)',
            department: 'HEMATOLOGY',
            priority: 'STAT_EMERGENCY',
            trackProgress: 0.44,
            routeIndex: 6,
            viabilityPct: 99.2,
            elapsedMinutes: 6.8,
            speedMultiplier: 1.5,
            isExpressBypass: false,
            testsOrdered: ['CBC', 'Automated Platelets', 'Reticulocytes'],
        },
        {
            carrierId: 'CARRIER-COAG-304',
            barcode: 'BC-COAG-5519',
            patientUhid: 'UHID-3310-OR',
            capColorHex: '#38bdf8',
            capLabel: 'Light Blue Citrate (PT / INR & D-Dimer)',
            department: 'COAGULATION',
            priority: 'STAT_EMERGENCY',
            trackProgress: 0.62,
            routeIndex: 9,
            viabilityPct: 97.6,
            elapsedMinutes: 9.1,
            speedMultiplier: 1.4,
            isExpressBypass: false,
            testsOrdered: ['PT/INR', 'aPTT', 'Fibrinogen', 'D-Dimer'],
        },
        {
            carrierId: 'CARRIER-ROUT-118',
            barcode: 'BC-CHEM-1082',
            patientUhid: 'UHID-9920-OPD',
            capColorHex: '#eab308',
            capLabel: 'Gold SST (Comprehensive Metabolic & Lipid)',
            department: 'BIOCHEMISTRY',
            priority: 'ROUTINE',
            trackProgress: 0.82,
            routeIndex: 12,
            viabilityPct: 94.0,
            elapsedMinutes: 22.4,
            speedMultiplier: 1.0,
            isExpressBypass: false,
            testsOrdered: ['CMP', 'Lipid Profile', 'Liver Enzymes'],
        },
        {
            carrierId: 'CARRIER-GLU-552',
            barcode: 'BC-GLU-3011',
            patientUhid: 'UHID-1102-MED',
            capColorHex: '#94a3b8',
            capLabel: 'Gray Fluoride (Blood Lactate / Glucose)',
            department: 'BIOCHEMISTRY',
            priority: 'URGENT',
            trackProgress: 0.05,
            routeIndex: 0,
            viabilityPct: 99.8,
            elapsedMinutes: 1.5,
            speedMultiplier: 1.2,
            isExpressBypass: true,
            testsOrdered: ['Lactate (Sepsis)', 'Venous Glucose'],
        },
        {
            carrierId: 'CARRIER-MS-881',
            barcode: 'BC-TOX-7740',
            patientUhid: 'UHID-6612-NEO',
            capColorHex: '#1e3a8a',
            capLabel: 'Dark Blue (Newborn Metabolic / LC-MS Screen)',
            department: 'MASS_SPECTROMETRY',
            priority: 'URGENT',
            trackProgress: 0.32,
            routeIndex: 4,
            viabilityPct: 96.5,
            elapsedMinutes: 14.0,
            speedMultiplier: 1.1,
            isExpressBypass: false,
            testsOrdered: ['Acylcarnitines', 'Amino Acids LC-MS/MS'],
        },
        {
            carrierId: 'CARRIER-SER-205',
            barcode: 'BC-SERO-4491',
            patientUhid: 'UHID-8833-TRANS',
            capColorHex: '#ef4444',
            capLabel: 'Red Plain (Infectious Disease Serology)',
            department: 'IMMUNOASSAY',
            priority: 'ROUTINE',
            trackProgress: 0.91,
            routeIndex: 14,
            viabilityPct: 92.5,
            elapsedMinutes: 38.0,
            speedMultiplier: 0.95,
            isExpressBypass: false,
            testsOrdered: ['HIV Ag/Ab', 'HBsAg', 'HCV Ab', 'Syphilis'],
        },
    ]);

    // Autonomous Mobile Delivery Robots (AMR / AGVs)
    const [agvFleet, setAgvFleet] = useState<AgvRobot3D[]>([
        {
            id: 'AGV-01',
            name: 'Autonomous Mobile Robot Alpha',
            callsign: 'OMNI-AGV 01 [Apex]',
            posX: -50,
            posY: -20,
            headingDeg: 45,
            targetWaypointIdx: 1,
            status: 'NAVIGATING',
            batteryPct: 94,
            payloadSamples: 32,
            payloadType: 'STAT TROPO & BLOOD GAS',
            lidarScanAngleDeg: 0,
        },
        {
            id: 'AGV-02',
            name: 'Autonomous Mobile Robot Beta',
            callsign: 'OMNI-AGV 02 [Titan]',
            posX: 80,
            posY: 80,
            headingDeg: 190,
            targetWaypointIdx: 2,
            status: 'NAVIGATING',
            batteryPct: 81,
            payloadSamples: 64,
            payloadType: 'CRYO-ARCHIVE RACKS (-80°C)',
            lidarScanAngleDeg: 0,
        },
    ]);

    // Aerial High-Speed Pneumatic Capsules
    const [pneumaticCapsules, setPneumaticCapsules] = useState<PneumaticCapsule3D[]>([
        {
            id: 'CAP-ED-STAT-99',
            originWard: 'Level 1 Trauma ED (Bay 3)',
            destinationHub: 'Accessioning Infeed Hub',
            progress: 0.28,
            velocityMps: 9.8,
            priority: 'STAT_EMERGENCY',
            patientUhid: 'UHID-9921-TRAUMA',
            barcode: 'BC-TRM-8890',
            testName: 'Emergency Trauma Crossmatch & CBC',
        },
        {
            id: 'CAP-ICU-SEPSIS-42',
            originWard: 'Neuro-Intensive Care Unit (Bed 14)',
            destinationHub: 'Accessioning Infeed Hub',
            progress: 0.65,
            velocityMps: 10.2,
            priority: 'STAT_EMERGENCY',
            patientUhid: 'UHID-4410-ICU',
            barcode: 'BC-SEP-1192',
            testName: 'Procalcitonin & Arterial Blood Gas',
        },
    ]);

    // Physics Update Loop (RequestAnimationFrame at 60 FPS)
    useEffect(() => {
        let frameId: number;
        let lastTime = performance.now();

        const updatePhysics = (now: number) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            // Centrifuge 3500 RPM rotor rotation
            setRotorAngle((prev) => (prev + 3500 * 6 * dt) % 360);

            // SCARA 3.2s cyclic pick-and-place animation
            setScaraCycleSec((prev) => (prev + dt) % 3.2);

            // Linear motor travelling magnetic wave
            setLinearMotorPulseOffset((prev) => (prev + dt * 2.4) % 1.0);

            // Mass spec ionization plasma micro-flicker
            setPlasmaFlicker(0.8 + Math.random() * 0.35);

            // Auto-orbit camera
            if (isAutoOrbit) {
                setCameraAngle((prev) => (prev + 10 * dt) % 360);
            }

            // AGV movement & 360° LIDAR rotation
            setAgvFleet((prevFleet) =>
                prevFleet.map((agv, idx) => {
                    const lidar = (agv.lidarScanAngleDeg + 360 * dt * 1.5) % 360;
                    // Move in gentle closed figure-8 loop along floor corridors
                    const moveSpeed = idx === 0 ? 14 : -12;
                    const nextX = agv.posX + Math.cos((agv.headingDeg * Math.PI) / 180) * moveSpeed * dt;
                    const nextY = agv.posY + Math.sin((agv.headingDeg * Math.PI) / 180) * moveSpeed * dt;

                    let newHeading = agv.headingDeg;
                    if (nextX > 160 || nextX < -140 || nextY > 100 || nextY < -80) {
                        newHeading = (agv.headingDeg + 90) % 360;
                    }

                    return {
                        ...agv,
                        posX: Math.max(-140, Math.min(160, nextX)),
                        posY: Math.max(-80, Math.min(100, nextY)),
                        headingDeg: newHeading,
                        lidarScanAngleDeg: lidar,
                    };
                })
            );

            // Overhead pneumatic capsule flight
            setPneumaticCapsules((prevCapsules) =>
                prevCapsules.map((cap) => {
                    const nextProgress = (cap.progress + 0.16 * dt) % 1.0;
                    return {
                        ...cap,
                        progress: nextProgress,
                    };
                })
            );

            frameId = requestAnimationFrame(updatePhysics);
        };

        frameId = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(frameId);
    }, [isAutoOrbit]);

    // Specimen Movement Continuous Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setTubes((prevTubes) =>
                prevTubes.map((tube) => {
                    const emergencyBoost =
                        emergencyCode !== 'NORMAL' && tube.priority === 'STAT_EMERGENCY' ? 1.7 : 1.0;
                    const baseSpeed = tube.priority === 'STAT_EMERGENCY' ? 0.0055 : 0.0028;
                    const finalSpeed = baseSpeed * (tube.speedMultiplier || 1.0) * emergencyBoost;
                    const nextProgress = (tube.trackProgress + finalSpeed) % 1.0;
                    return {
                        ...tube,
                        trackProgress: nextProgress,
                        elapsedMinutes: Number((tube.elapsedMinutes + 0.02).toFixed(1)),
                        viabilityPct: Math.max(88, Number((tube.viabilityPct - 0.0025).toFixed(1))),
                    };
                })
            );
        }, 50);
        return () => clearInterval(interval);
    }, [emergencyCode]);

    // 3D Isometric Projection Helper
    const project3D = useCallback(
        (x: number, y: number, z: number, centerX: number, centerY: number) => {
            const radAngle = (cameraAngle * Math.PI) / 180;
            const radElev = (cameraElevation * Math.PI) / 180;

            // Rotation around Z axis
            const rotX = x * Math.cos(radAngle) - y * Math.sin(radAngle);
            const rotY = x * Math.sin(radAngle) + y * Math.cos(radAngle);

            // Isometric tilt elevation with depth
            const screenX = centerX + cameraPanX + rotX * cameraZoom;
            const screenY = centerY + cameraPanY + (rotY * Math.sin(radElev) - z * Math.cos(radElev)) * cameraZoom;

            return { x: screenX, y: screenY, depth: rotY };
        },
        [cameraAngle, cameraElevation, cameraZoom, cameraPanX, cameraPanY]
    );

    // Follow-Cam smoothly locks onto selected tube
    useEffect(() => {
        if (!isFollowTube || !selectedTube) return;
        const pts = selectedTube.isExpressBypass ? STAT_BYPASS_WAYPOINTS : MAIN_TRACK_WAYPOINTS;
        const totalPts = pts.length;
        const progressFloat = selectedTube.trackProgress * (totalPts - 1);
        const idx1 = Math.floor(progressFloat);
        const idx2 = (idx1 + 1) % totalPts;
        const frac = progressFloat - idx1;
        const curX = pts[idx1][0] + (pts[idx2][0] - pts[idx1][0]) * frac;
        const curY = pts[idx1][1] + (pts[idx2][1] - pts[idx1][1]) * frac;

        setCameraPanX((prev) => prev + (-curX * cameraZoom * 0.7 - prev) * 0.12);
        setCameraPanY((prev) => prev + (-curY * cameraZoom * 0.4 - prev) * 0.12);
    }, [isFollowTube, selectedTube, cameraZoom]);

    // Follow-Cam smoothly locks onto AGV robot
    useEffect(() => {
        if (!isFollowAgv || agvFleet.length === 0) return;
        const targetAgv = selectedAgv || agvFleet[0];
        setCameraPanX((prev) => prev + (-targetAgv.posX * cameraZoom * 0.7 - prev) * 0.12);
        setCameraPanY((prev) => prev + (-targetAgv.posY * cameraZoom * 0.4 - prev) * 0.12);
        setCameraAngle((prev) => prev + (targetAgv.headingDeg - 90 - prev) * 0.08);
    }, [isFollowAgv, selectedAgv, agvFleet, cameraZoom]);

    // Camera Presets
    const applyCameraPreset = (preset: CameraPreset) => {
        setIsAutoOrbit(false);
        setIsFollowTube(false);
        setIsFollowAgv(false);
        sfx.playClick();

        switch (preset) {
            case 'OVERVIEW':
                setCameraAngle(45);
                setCameraElevation(36);
                setCameraZoom(1.15);
                setCameraPanX(0);
                setCameraPanY(0);
                break;
            case 'STAT_CHEMISTRY':
                setCameraAngle(35);
                setCameraElevation(40);
                setCameraZoom(1.8);
                setCameraPanX(160);
                setCameraPanY(20);
                break;
            case 'HEMATOLOGY_LINE':
                setCameraAngle(55);
                setCameraElevation(32);
                setCameraZoom(1.75);
                setCameraPanX(-110);
                setCameraPanY(120);
                break;
            case 'CENTRIFUGE_HUB':
                setCameraAngle(20);
                setCameraElevation(50);
                setCameraZoom(2.2);
                setCameraPanX(160);
                setCameraPanY(-160);
                break;
            case 'ROBOTIC_DECAPPER':
                setCameraAngle(60);
                setCameraElevation(42);
                setCameraZoom(2.3);
                setCameraPanX(60);
                setCameraPanY(-150);
                break;
            case 'COLD_ARCHIVE':
                setCameraAngle(125);
                setCameraElevation(35);
                setCameraZoom(1.8);
                setCameraPanX(-120);
                setCameraPanY(-120);
                break;
            case 'MASS_SPEC_WING':
                setCameraAngle(110);
                setCameraElevation(38);
                setCameraZoom(2.1);
                setCameraPanX(-220);
                setCameraPanY(-40);
                break;
            case 'PNEUMATIC_BAY':
                setCameraAngle(15);
                setCameraElevation(28);
                setCameraZoom(1.7);
                setCameraPanX(180);
                setCameraPanY(-230);
                break;
            case 'AGV_PATROL':
                setCameraAngle(40);
                setCameraElevation(48);
                setCameraZoom(1.5);
                setCameraPanX(0);
                setCameraPanY(0);
                break;
            case 'AGV_FPV_COCKPIT':
                setIsFollowAgv(true);
                setCameraElevation(22);
                setCameraZoom(2.3);
                sfx.playWhoosh();
                break;
            case 'PNEUMATIC_POV_FLYBY':
                setCameraAngle(25);
                setCameraElevation(32);
                setCameraZoom(2.0);
                setCameraPanX(80);
                setCameraPanY(-100);
                sfx.playPneumaticLaunch();
                break;
            case 'DIRECTOR_ORBIT_CINEMATIC':
                setIsAutoOrbit(true);
                setCameraElevation(38);
                setCameraZoom(1.3);
                setCameraPanX(0);
                setCameraPanY(0);
                break;
        }
    };

    // Remote Biomedical Machinery Maintenance Action Trigger
    const handleExecuteMaintenanceAction = (actionTitle: string, durationMs: number = 1800) => {
        setIsExecutingAction(true);
        sfx.playWhoosh();
        setTimeout(() => {
            setIsExecutingAction(false);
            setMaintenanceSuccessBanner(`Executed: ${actionTitle} successfully.`);
            sfx.playSonar();
            setTimeout(() => setMaintenanceSuccessBanner(null), 4000);
        }, durationMs);
    };

    // MAIN HIGH-PRECISION 60 FPS 3D CANVAS RENDERING ENGINE
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            // 1. DEEP OBSIDIAN / CLEANROOM BACKGROUND
            if (renderMode === 'REALISTIC_CAD') {
                ctx.fillStyle = '#0a0f1d';
                ctx.fillRect(0, 0, width, height);
            } else {
                ctx.fillStyle = '#030712';
                ctx.fillRect(0, 0, width, height);

                const bgGlow = ctx.createRadialGradient(centerX, centerY, 60, centerX, centerY, width * 0.8);
                bgGlow.addColorStop(0, '#0f172a');
                bgGlow.addColorStop(0.5, '#030712');
                bgGlow.addColorStop(1, '#020617');
                ctx.fillStyle = bgGlow;
                ctx.fillRect(0, 0, width, height);
            }

            // 2. ISOMETRIC LABORATORY REFLECTIVE FLOOR GRID
            const gridSize = 40;
            const gridRange = 280;

            ctx.lineWidth = renderMode === 'CYBER_NEON_GRID' ? 1.5 : 1;
            ctx.strokeStyle =
                renderMode === 'CYBER_NEON_GRID'
                    ? 'rgba(6, 182, 212, 0.45)'
                    : renderMode === 'ELECTROMAGNETIC_FLUX'
                    ? 'rgba(6, 182, 212, 0.28)'
                    : renderMode === 'REALISTIC_CAD'
                    ? 'rgba(71, 85, 105, 0.4)'
                    : 'rgba(30, 41, 59, 0.5)';
            if (renderMode === 'CYBER_NEON_GRID') {
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 4;
            }

            for (let gx = -gridRange; gx <= gridRange; gx += gridSize) {
                const p1 = project3D(gx, -gridRange, 0, centerX, centerY);
                const p2 = project3D(gx, gridRange, 0, centerX, centerY);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            for (let gy = -gridRange; gy <= gridRange; gy += gridSize) {
                const p1 = project3D(-gridRange, gy, 0, centerX, centerY);
                const p2 = project3D(gridRange, gy, 0, centerX, centerY);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            // Cleanroom ISO Class Floor Boundary Lines
            const bsl3p1 = project3D(180, 0, 0, centerX, centerY);
            const bsl3p2 = project3D(280, 0, 0, centerX, centerY);
            const bsl3p3 = project3D(280, 180, 0, centerX, centerY);
            const bsl3p4 = project3D(180, 180, 0, centerX, centerY);

            ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(bsl3p1.x, bsl3p1.y);
            ctx.lineTo(bsl3p2.x, bsl3p2.y);
            ctx.lineTo(bsl3p3.x, bsl3p3.y);
            ctx.lineTo(bsl3p4.x, bsl3p4.y);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);

            // 2B. WHOLE-ROOM UV-C SURFACE DECONTAMINATION ULTRAVIOLET WAVE
            if (isUvcActive) {
                const uvcGlow = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, width * 0.9);
                uvcGlow.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
                uvcGlow.addColorStop(0.4, 'rgba(147, 51, 234, 0.28)');
                uvcGlow.addColorStop(1, 'rgba(88, 28, 135, 0.12)');
                ctx.fillStyle = uvcGlow;
                ctx.fillRect(0, 0, width, height);

                // Ionization radiation sparkles
                const nowSec = performance.now() * 0.005;
                ctx.fillStyle = '#ffffff';
                for (let sp = 0; sp < 32; sp++) {
                    const sx = (Math.sin(nowSec + sp * 5.7) * 0.48 + 0.5) * width;
                    const sy = (Math.cos(nowSec * 0.8 + sp * 3.3) * 0.48 + 0.5) * height;
                    ctx.beginPath();
                    ctx.arc(sx, sy, (sp % 3) + 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Decontamination Banner on Canvas
                ctx.font = 'bold 12px ui-monospace, monospace';
                ctx.fillStyle = '#f3e8ff';
                ctx.textAlign = 'center';
                ctx.fillText(`⚡ AUTOMATED UV-C 254nm STERILIZATION ACTIVE (${uvcCountdown}s) • BIO-BURDEN ZERO-LOG DECON`, centerX, 45);
            }

            // 3. CONTINUOUS GLOWING MAGNEMOTION CONVEYOR TRACK (MAIN LOOP)

            const isEmergency = emergencyCode !== 'NORMAL';
            ctx.lineWidth = 4 * cameraZoom;
            ctx.strokeStyle =
                renderMode === 'QUEUE_FRICTION'
                    ? 'rgba(239, 68, 68, 0.75)'
                    : isEmergency
                    ? 'rgba(244, 63, 94, 0.85)'
                    : 'rgba(6, 182, 212, 0.7)';
            ctx.shadowBlur = isEmergency ? 16 : 10;
            ctx.shadowColor =
                renderMode === 'QUEUE_FRICTION' ? '#ef4444' : isEmergency ? '#f43f5e' : '#06b6d4';

            ctx.beginPath();
            for (let i = 0; i < MAIN_TRACK_WAYPOINTS.length; i++) {
                const pt = project3D(MAIN_TRACK_WAYPOINTS[i][0], MAIN_TRACK_WAYPOINTS[i][1], 2, centerX, centerY);
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.stroke();

            // 3B. HIGH-SPEED STAT EXPRESS BYPASS TRACK
            ctx.lineWidth = 2.5 * cameraZoom;
            ctx.strokeStyle = isEmergency ? 'rgba(244, 63, 94, 0.95)' : 'rgba(234, 179, 8, 0.75)';
            ctx.shadowColor = isEmergency ? '#f43f5e' : '#eab308';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let i = 0; i < STAT_BYPASS_WAYPOINTS.length; i++) {
                const pt = project3D(STAT_BYPASS_WAYPOINTS[i][0], STAT_BYPASS_WAYPOINTS[i][1], 3, centerX, centerY);
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 3C. MAGNEMOTION LINEAR MOTOR TRAVELLING ELECTROMAGNETIC PULSES
            const totalMainPoints = MAIN_TRACK_WAYPOINTS.length;
            const pulseCount = 10;
            for (let p = 0; p < pulseCount; p++) {
                const pulseT = (linearMotorPulseOffset + p / pulseCount) % 1.0;
                const floatIdx = pulseT * (totalMainPoints - 1);
                const i1 = Math.floor(floatIdx);
                const i2 = (i1 + 1) % totalMainPoints;
                const frac = floatIdx - i1;
                const px =
                    MAIN_TRACK_WAYPOINTS[i1][0] +
                    (MAIN_TRACK_WAYPOINTS[i2][0] - MAIN_TRACK_WAYPOINTS[i1][0]) * frac;
                const py =
                    MAIN_TRACK_WAYPOINTS[i1][1] +
                    (MAIN_TRACK_WAYPOINTS[i2][1] - MAIN_TRACK_WAYPOINTS[i1][1]) * frac;
                const screenP = project3D(px, py, 3, centerX, centerY);

                ctx.beginPath();
                ctx.arc(screenP.x, screenP.y, 3 * cameraZoom, 0, Math.PI * 2);
                ctx.fillStyle = isEmergency ? '#f43f5e' : '#38bdf8';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // 4. DRAW OVERHEAD PNEUMATIC TRANSIT TUBE SYSTEM (Z = 72)
            if (showOverheadTubes) {
                ctx.lineWidth = 3 * cameraZoom;
                ctx.strokeStyle = 'rgba(132, 204, 22, 0.45)';
                ctx.beginPath();
                for (let i = 0; i < PNEUMATIC_TUBE_PATH.length; i++) {
                    const pt = project3D(
                        PNEUMATIC_TUBE_PATH[i][0],
                        PNEUMATIC_TUBE_PATH[i][1],
                        PNEUMATIC_TUBE_PATH[i][2],
                        centerX,
                        centerY
                    );
                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();

                // Pneumatic Flight Capsules
                pneumaticCapsules.forEach((cap) => {
                    const totalPts = PNEUMATIC_TUBE_PATH.length;
                    const floatIdx = cap.progress * (totalPts - 1);
                    const i1 = Math.floor(floatIdx);
                    const i2 = (i1 + 1) % totalPts;
                    const frac = floatIdx - i1;

                    const cx =
                        PNEUMATIC_TUBE_PATH[i1][0] +
                        (PNEUMATIC_TUBE_PATH[i2][0] - PNEUMATIC_TUBE_PATH[i1][0]) * frac;
                    const cy =
                        PNEUMATIC_TUBE_PATH[i1][1] +
                        (PNEUMATIC_TUBE_PATH[i2][1] - PNEUMATIC_TUBE_PATH[i1][1]) * frac;
                    const cz =
                        PNEUMATIC_TUBE_PATH[i1][2] +
                        (PNEUMATIC_TUBE_PATH[i2][2] - PNEUMATIC_TUBE_PATH[i1][2]) * frac;

                    const screenCap = project3D(cx, cy, cz, centerX, centerY);

                    // Capsule Body with aerodynamic glow
                    ctx.beginPath();
                    ctx.arc(screenCap.x, screenCap.y, 6 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = cap.priority === 'STAT_EMERGENCY' ? '#f43f5e' : '#84cc16';
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 12;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    ctx.font = '8px ui-monospace, monospace';
                    ctx.fillStyle = '#f8fafc';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${cap.id} (${cap.velocityMps}m/s)`, screenCap.x, screenCap.y - 10);
                });
            }

            // 5. DRAW AUTONOMOUS MOBILE ROBOTS (AGV FLEET) WITH 360° LIDAR FAN
            if (showAgvFleet) {
                agvFleet.forEach((agv) => {
                    const agvScreen = project3D(agv.posX, agv.posY, 2, centerX, centerY);
                    const isSelected = selectedAgv?.id === agv.id;

                    // 360° Rotating Dynamic LIDAR Laser Scan Cone on the floor
                    const radLidar = (agv.lidarScanAngleDeg * Math.PI) / 180;
                    const lidarRange = 45 * cameraZoom;
                    const lEnd1 = {
                        x: agvScreen.x + Math.cos(radLidar - 0.4) * lidarRange,
                        y: agvScreen.y + Math.sin(radLidar - 0.4) * (lidarRange * 0.6),
                    };
                    const lEnd2 = {
                        x: agvScreen.x + Math.cos(radLidar + 0.4) * lidarRange,
                        y: agvScreen.y + Math.sin(radLidar + 0.4) * (lidarRange * 0.6),
                    };

                    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
                    ctx.beginPath();
                    ctx.moveTo(agvScreen.x, agvScreen.y);
                    ctx.lineTo(lEnd1.x, lEnd1.y);
                    ctx.lineTo(lEnd2.x, lEnd2.y);
                    ctx.closePath();
                    ctx.fill();

                    // AGV Chassis (Octagonal robot base)
                    ctx.beginPath();
                    ctx.arc(agvScreen.x, agvScreen.y, 8 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = isSelected ? '#38bdf8' : '#1e293b';
                    ctx.fill();
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // AGV Status Beacon
                    ctx.beginPath();
                    ctx.arc(agvScreen.x, agvScreen.y - 4, 3 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = agv.batteryPct > 50 ? '#10b981' : '#f59e0b';
                    ctx.fill();

                    ctx.font = '9px ui-monospace, monospace';
                    ctx.fillStyle = '#38bdf8';
                    ctx.textAlign = 'center';
                    ctx.fillText(agv.callsign, agvScreen.x, agvScreen.y - 12);
                });
            }

            // 6. DRAW 3D PROCEDURAL WORKSTATIONS
            // Sort by depth for painter's algorithm
            const sortedWorkstations = [...WORKSTATIONS_3D].sort((a, b) => {
                const depthA = project3D(a.gridX, a.gridY, 0, centerX, centerY).depth;
                const depthB = project3D(b.gridX, b.gridY, 0, centerX, centerY).depth;
                return depthA - depthB;
            });

            sortedWorkstations.forEach((ws) => {
                const isHovered = hoveredWorkstationId === ws.id;
                const isSelected = selectedWorkstation?.id === ws.id;

                const halfW = ws.width / 2;
                const halfD = ws.depth / 2;
                const h = ws.height;

                // 8 Isometric Vertices of the 3D Machine Chassis
                const b1 = project3D(ws.gridX - halfW, ws.gridY - halfD, 0, centerX, centerY);
                const b2 = project3D(ws.gridX + halfW, ws.gridY - halfD, 0, centerX, centerY);
                const b3 = project3D(ws.gridX + halfW, ws.gridY + halfD, 0, centerX, centerY);
                const b4 = project3D(ws.gridX - halfW, ws.gridY + halfD, 0, centerX, centerY);

                const t1 = project3D(ws.gridX - halfW, ws.gridY - halfD, h, centerX, centerY);
                const t2 = project3D(ws.gridX + halfW, ws.gridY - halfD, h, centerX, centerY);
                const t3 = project3D(ws.gridX + halfW, ws.gridY + halfD, h, centerX, centerY);
                const t4 = project3D(ws.gridX - halfW, ws.gridY + halfD, h, centerX, centerY);

                // Floor Drop Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.beginPath();
                ctx.moveTo(b1.x, b1.y);
                ctx.lineTo(b2.x, b2.y);
                ctx.lineTo(b3.x, b3.y);
                ctx.lineTo(b4.x, b4.y);
                ctx.closePath();
                ctx.fill();

                // Glossy Epoxy Specular Reflection Glow
                ctx.save();
                ctx.globalAlpha = 0.14;
                ctx.fillStyle = ws.color;
                ctx.beginPath();
                ctx.moveTo(b1.x, b1.y);
                ctx.lineTo(b2.x, b2.y);
                ctx.lineTo(b3.x, b3.y);
                ctx.lineTo(b4.x, b4.y);
                ctx.closePath();
                ctx.fill();
                ctx.restore();


                // Dynamic Colors based on Render Mode
                let baseColor = ws.color;
                if (renderMode === 'THERMAL_HEATMAP') {
                    baseColor =
                        ws.temperatureC > 30 ? '#ef4444' : ws.temperatureC < 10 ? '#0284c7' : '#10b981';
                } else if (renderMode === 'QUEUE_FRICTION') {
                    baseColor =
                        ws.currentWip > 30 ? '#ef4444' : ws.currentWip > 15 ? '#f59e0b' : '#10b981';
                } else if (renderMode === 'ELECTROMAGNETIC_FLUX') {
                    baseColor = '#38bdf8';
                }

                // Front Left Wall (South-West)
                ctx.fillStyle = isSelected
                    ? '#38bdf8'
                    : isHovered
                    ? '#0ea5e9'
                    : renderMode === 'REALISTIC_CAD'
                    ? '#1e293b'
                    : 'rgba(30, 41, 59, 0.9)';
                ctx.beginPath();
                ctx.moveTo(b4.x, b4.y);
                ctx.lineTo(b3.x, b3.y);
                ctx.lineTo(t3.x, t3.y);
                ctx.lineTo(t4.x, t4.y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = isSelected ? 2.5 : 1;
                ctx.stroke();

                // Front Right Wall (South-East)
                ctx.fillStyle = isSelected
                    ? '#0284c7'
                    : isHovered
                    ? '#0369a1'
                    : renderMode === 'REALISTIC_CAD'
                    ? '#0f172a'
                    : 'rgba(15, 23, 42, 0.92)';
                ctx.beginPath();
                ctx.moveTo(b3.x, b3.y);
                ctx.lineTo(b2.x, b2.y);
                ctx.lineTo(t2.x, t2.y);
                ctx.lineTo(t3.x, t3.y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = baseColor;
                ctx.stroke();

                // Top Roof Face (Equipment Worktable Surface)
                ctx.fillStyle = isSelected
                    ? '#7dd3fc'
                    : isHovered
                    ? '#38bdf8'
                    : baseColor + (renderMode === 'HOLOGRAPHIC_3D' ? '99' : 'bb');
                ctx.beginPath();
                ctx.moveTo(t1.x, t1.y);
                ctx.lineTo(t2.x, t2.y);
                ctx.lineTo(t3.x, t3.y);
                ctx.lineTo(t4.x, t4.y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                // -------------------------------------------------------------
                // 6A. HIGH-SPEED ROBOTIC CENTRIFUGE ROTOR (ANZ-PRE-CENT-01)
                // -------------------------------------------------------------
                if (ws.id === 'ANZ-PRE-CENT-01') {
                    const centCenter = project3D(ws.gridX, ws.gridY, h + 2, centerX, centerY);
                    const rotorRadius = 19 * cameraZoom;

                    ctx.beginPath();
                    ctx.arc(centCenter.x, centCenter.y, rotorRadius, 0, Math.PI * 2);
                    ctx.fillStyle = '#0f172a';
                    ctx.fill();
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // 4-Spoke Rotor with sample swinging buckets
                    const radRotor = (rotorAngle * Math.PI) / 180;
                    for (let a = 0; a < 4; a++) {
                        const ang = radRotor + (a * Math.PI) / 2;
                        const bx = centCenter.x + Math.cos(ang) * (rotorRadius * 0.78);
                        const by =
                            centCenter.y +
                            Math.sin(ang) *
                                (rotorRadius * 0.78 * Math.sin((cameraElevation * Math.PI) / 180));

                        ctx.beginPath();
                        ctx.moveTo(centCenter.x, centCenter.y);
                        ctx.lineTo(bx, by);
                        ctx.strokeStyle = '#64748b';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.arc(bx, by, 3 * cameraZoom, 0, Math.PI * 2);
                        ctx.fillStyle = a % 2 === 0 ? '#38bdf8' : '#34d399';
                        ctx.fill();
                    }

                    ctx.beginPath();
                    ctx.arc(centCenter.x, centCenter.y, 3.5 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = '#f8fafc';
                    ctx.fill();

                    if (cameraZoom >= 1.2) {
                        ctx.font = '9px ui-monospace, monospace';
                        ctx.fillStyle = '#10b981';
                        ctx.textAlign = 'center';
                        ctx.fillText(`3,500 RPM • 3,013 G`, centCenter.x, centCenter.y - rotorRadius - 6);
                    }
                }

                // -------------------------------------------------------------
                // 6B. ARTICULATED SCARA ROBOTIC ARM (ANZ-PRE-DECAP-01)
                // -------------------------------------------------------------
                if (ws.id === 'ANZ-PRE-DECAP-01') {
                    const armBase = project3D(ws.gridX, ws.gridY, h + 2, centerX, centerY);
                    const normTime = scaraCycleSec / 3.2;
                    let shoulderAng = 0;
                    let elbowAng = 0;
                    let quillLift = 0;

                    if (normTime < 0.35) {
                        const prog = normTime / 0.35;
                        shoulderAng = Math.sin(prog * Math.PI) * 0.6;
                        elbowAng = Math.sin(prog * Math.PI) * 0.8;
                        quillLift = Math.sin(prog * Math.PI) * 8;
                    } else if (normTime < 0.75) {
                        const prog = (normTime - 0.35) / 0.4;
                        shoulderAng = -Math.sin(prog * Math.PI) * 0.5;
                        elbowAng = -Math.sin(prog * Math.PI) * 0.7;
                        quillLift = 8 - Math.sin(prog * Math.PI) * 4;
                    }

                    // Base Pedestal
                    ctx.beginPath();
                    ctx.arc(armBase.x, armBase.y, 4 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = '#34d399';
                    ctx.fill();

                    // Link 1 (Shoulder)
                    const link1Len = 16 * cameraZoom;
                    const l1x = armBase.x + Math.cos(shoulderAng - Math.PI / 4) * link1Len;
                    const l1y = armBase.y + Math.sin(shoulderAng - Math.PI / 4) * (link1Len * 0.6);

                    ctx.lineWidth = 3.5 * cameraZoom;
                    ctx.strokeStyle = '#059669';
                    ctx.beginPath();
                    ctx.moveTo(armBase.x, armBase.y);
                    ctx.lineTo(l1x, l1y);
                    ctx.stroke();

                    // Link 2 (Elbow)
                    const link2Len = 14 * cameraZoom;
                    const l2x = l1x + Math.cos(shoulderAng + elbowAng + Math.PI / 6) * link2Len;
                    const l2y = l1y + Math.sin(shoulderAng + elbowAng + Math.PI / 6) * (link2Len * 0.6);

                    ctx.lineWidth = 2.5 * cameraZoom;
                    ctx.strokeStyle = '#10b981';
                    ctx.beginPath();
                    ctx.moveTo(l1x, l1y);
                    ctx.lineTo(l2x, l2y);
                    ctx.stroke();

                    // Quill & Decapper Gripper
                    const quillY = l2y - quillLift * cameraZoom;
                    ctx.lineWidth = 1.5 * cameraZoom;
                    ctx.strokeStyle = '#f8fafc';
                    ctx.beginPath();
                    ctx.moveTo(l2x, l2y);
                    ctx.lineTo(l2x, quillY + 8 * cameraZoom);
                    ctx.stroke();

                    // Optical cap profiling laser targeting beam
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(l2x, quillY + 8 * cameraZoom);
                    ctx.lineTo(l2x, quillY + 22 * cameraZoom);
                    ctx.stroke();
                }

                // -------------------------------------------------------------
                // 6C. THERMO ORBITRAP LC-MS/MS IONIZATION SOURCE (ANZ-MS-01)
                // -------------------------------------------------------------
                if (ws.id === 'ANZ-MS-01') {
                    const msCenter = project3D(ws.gridX, ws.gridY, h + 4, centerX, centerY);
                    ctx.beginPath();
                    ctx.arc(msCenter.x, msCenter.y, 8 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(168, 85, 247, ${plasmaFlicker})`;
                    ctx.shadowColor = '#c084fc';
                    ctx.shadowBlur = 14;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    if (cameraZoom >= 1.2) {
                        ctx.font = '8px ui-monospace, monospace';
                        ctx.fillStyle = '#c084fc';
                        ctx.textAlign = 'center';
                        ctx.fillText('ELECTROSPRAY PLASMA', msCenter.x, msCenter.y - 12);
                    }
                }

                // -------------------------------------------------------------
                // 6D. CRYOGENIC BIOBANK ARCHIVE FROST MIST (ANZ-ARC-01)
                // -------------------------------------------------------------
                if (ws.id === 'ANZ-ARC-01') {
                    const arcTop = project3D(ws.gridX, ws.gridY, h + 2, centerX, centerY);
                    ctx.fillStyle = 'rgba(186, 230, 253, 0.15)';
                    ctx.beginPath();
                    ctx.arc(arcTop.x, arcTop.y, 22 * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();

                    if (cameraZoom >= 1.2) {
                        ctx.font = '9px ui-monospace, monospace';
                        ctx.fillStyle = '#38bdf8';
                        ctx.textAlign = 'center';
                        ctx.fillText('-80.0°C CRYOGENIC VAULT', arcTop.x, arcTop.y - 14);
                    }
                }

                // Machine Status LED Beacon
                const centerTop = project3D(ws.gridX, ws.gridY, h + 10, centerX, centerY);
                ctx.beginPath();
                ctx.arc(centerTop.x, centerTop.y, 4 * cameraZoom, 0, Math.PI * 2);
                ctx.fillStyle =
                    ws.status === 'STAT_PROCESSING'
                        ? '#ef4444'
                        : ws.status === 'ONLINE'
                        ? '#10b981'
                        : '#f59e0b';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Equipment Name Header Label
                ctx.font = `${Math.max(9, Math.round(10 * cameraZoom))}px ui-monospace, monospace`;
                ctx.fillStyle = '#f8fafc';
                ctx.textAlign = 'center';
                ctx.fillText(ws.shortName, centerTop.x, centerTop.y - 10);

                // Live WIP & Temp Subtitle
                ctx.font = `${Math.max(8, Math.round(8 * cameraZoom))}px sans-serif`;
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(`WIP: ${ws.currentWip} | ${ws.temperatureC}°C`, centerTop.x, centerTop.y + 14);
            });

            // 7. DRAW ANIMATED SPECIMEN TUBES ALONG MAGNEMOTION TRACK
            tubes.forEach((tube) => {
                const pts = tube.isExpressBypass ? STAT_BYPASS_WAYPOINTS : MAIN_TRACK_WAYPOINTS;
                const totalPts = pts.length;
                const progressFloat = tube.trackProgress * (totalPts - 1);
                const idx1 = Math.floor(progressFloat);
                const idx2 = (idx1 + 1) % totalPts;
                const frac = progressFloat - idx1;

                const curX = pts[idx1][0] + (pts[idx2][0] - pts[idx1][0]) * frac;
                const curY = pts[idx1][1] + (pts[idx2][1] - pts[idx1][1]) * frac;

                const tubeBase = project3D(curX, curY, 3, centerX, centerY);
                const tubeCap = project3D(curX, curY, 22, centerX, centerY);

                const isSelected = selectedTube?.carrierId === tube.carrierId;

                // STAT emergency aura halo
                if (tube.priority === 'STAT_EMERGENCY') {
                    ctx.beginPath();
                    ctx.arc(tubeBase.x, tubeBase.y, 12 * cameraZoom, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                    ctx.fill();
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Glass Tube Body
                ctx.lineWidth = 4.5 * cameraZoom;
                ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
                ctx.beginPath();
                ctx.moveTo(tubeBase.x, tubeBase.y);
                ctx.lineTo(tubeCap.x, tubeCap.y);
                ctx.stroke();

                // Colored Tube Stopper Cap
                ctx.beginPath();
                ctx.arc(tubeCap.x, tubeCap.y, 4.5 * cameraZoom, 0, Math.PI * 2);
                ctx.fillStyle = tube.capColorHex;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (cameraZoom >= 1.2 || isSelected) {
                    ctx.font = '8px ui-monospace, monospace';
                    ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
                    ctx.textAlign = 'center';
                    ctx.fillText(tube.barcode, tubeCap.x, tubeCap.y - 8);
                }
            });

            // 8. CLEANROOM LAMINAR AIRFLOW STREAMLINES (ISO Class 7 Diffusers)
            if (showCleanroomAirflow && renderMode === 'CLEANROOM_AIRFLOW') {
                CLEANROOM_SENSORS.forEach((sensor) => {
                    const sPos = project3D(sensor.gridX, sensor.gridY, 60, centerX, centerY);
                    const sFloor = project3D(sensor.gridX, sensor.gridY, 0, centerX, centerY);

                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 6]);
                    ctx.beginPath();
                    ctx.moveTo(sPos.x, sPos.y);
                    ctx.lineTo(sFloor.x, sFloor.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.beginPath();
                    ctx.arc(sPos.x, sPos.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fill();

                    ctx.font = '9px ui-monospace, monospace';
                    ctx.fillStyle = '#38bdf8';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        `${sensor.zoneName}: ${sensor.particlesPerM3.toLocaleString()} pt/m³ (${sensor.pressurePa > 0 ? '+' : ''}${sensor.pressurePa}Pa)`,
                        sPos.x,
                        sPos.y - 8
                    );
                });
            }

            // 9. FLOATING MINI-MAP / TACTICAL RADAR (BOTTOM-LEFT CORNER)
            if (showTacticalRadar) {
                const radarX = 90;
                const radarY = height - 90;
                const radarR = 65;

                ctx.save();
                ctx.beginPath();
                ctx.arc(radarX, radarY, radarR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Concentric Range Rings
                ctx.beginPath();
                ctx.arc(radarX, radarY, radarR * 0.5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
                ctx.stroke();

                // Sweeping Radar Beam
                const sweepAng = (performance.now() / 1000) * 2;
                ctx.beginPath();
                ctx.moveTo(radarX, radarY);
                ctx.arc(radarX, radarY, radarR, sweepAng, sweepAng + 0.4);
                ctx.closePath();
                ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                ctx.fill();

                // Plot Workstations as mini dots on radar
                WORKSTATIONS_3D.forEach((ws) => {
                    const rx = radarX + (ws.gridX / 300) * (radarR * 0.8);
                    const ry = radarY + (ws.gridY / 300) * (radarR * 0.8);
                    ctx.beginPath();
                    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                    ctx.fillStyle = ws.color;
                    ctx.fill();
                });

                // Plot Specimen Tubes
                tubes.forEach((t) => {
                    const pts = t.isExpressBypass ? STAT_BYPASS_WAYPOINTS : MAIN_TRACK_WAYPOINTS;
                    const idx = Math.floor(t.trackProgress * (pts.length - 1));
                    const rx = radarX + (pts[idx][0] / 300) * (radarR * 0.8);
                    const ry = radarY + (pts[idx][1] / 300) * (radarR * 0.8);
                    ctx.beginPath();
                    ctx.arc(rx, ry, t.priority === 'STAT_EMERGENCY' ? 2.5 : 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = t.priority === 'STAT_EMERGENCY' ? '#f43f5e' : '#38bdf8';
                    ctx.fill();
                });

                // Radar Header
                ctx.font = '8px ui-monospace, monospace';
                ctx.fillStyle = '#06b6d4';
                ctx.textAlign = 'center';
                ctx.fillText('SPATIAL RADAR', radarX, radarY - radarR + 12);
                ctx.restore();
            }

            // 8. POST-PROCESSING PASS: CYBER SCANLINES & HOSPITAL HUD VIGNETTE
            if (showCyberScanlines) {
                ctx.save();
                ctx.fillStyle = 'rgba(6, 182, 212, 0.025)';
                for (let y = 0; y < height; y += 4) {
                    ctx.fillRect(0, y, width, 1.5);
                }
                // Vignette shadow around perimeter
                const vigGrad = ctx.createRadialGradient(centerX, centerY, width * 0.42, centerX, centerY, width * 0.72);
                vigGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
                vigGrad.addColorStop(1, 'rgba(2, 6, 23, 0.65)');
                ctx.fillStyle = vigGrad;
                ctx.fillRect(0, 0, width, height);

                // HUD Crosshair Reticle in Center (Subtle)
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX - 16, centerY);
                ctx.lineTo(centerX + 16, centerY);
                ctx.moveTo(centerX, centerY - 16);
                ctx.lineTo(centerX, centerY + 16);
                ctx.stroke();

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [
        cameraAngle,
        cameraElevation,
        cameraZoom,
        cameraPanX,
        cameraPanY,
        hoveredWorkstationId,
        selectedWorkstation,
        selectedTube,
        selectedAgv,
        tubes,
        agvFleet,
        pneumaticCapsules,
        renderMode,
        project3D,
        rotorAngle,
        scaraCycleSec,
        linearMotorPulseOffset,
        plasmaFlicker,
        emergencyCode,
        showOverheadTubes,
        showAgvFleet,
        showCleanroomAirflow,
        showTacticalRadar,
        showCyberScanlines,
    ]);

    // Mouse Interaction (Orbit, Pan, Zoom, Raycast picking)
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        isDraggingRef.current = true;
        dragModeRef.current = e.button === 2 || e.shiftKey ? 'PAN' : 'ROTATE';
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            let foundId: string | null = null;
            for (const ws of WORKSTATIONS_3D) {
                const pt = project3D(ws.gridX, ws.gridY, ws.height / 2, centerX, centerY);
                const dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
                if (dist < 38 * cameraZoom) {
                    foundId = ws.id;
                    break;
                }
            }
            setHoveredWorkstationId(foundId);
            return;
        }

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.clientX, y: e.clientY };

        if (dragModeRef.current === 'ROTATE') {
            setCameraAngle((prev) => (prev + deltaX * 0.45) % 360);
            setCameraElevation((prev) => Math.max(15, Math.min(80, prev - deltaY * 0.35)));
        } else {
            setCameraPanX((prev) => prev + deltaX);
            setCameraPanY((prev) => prev + deltaY);
        }
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        setCameraZoom((prev) => Math.max(0.55, Math.min(3.2, prev + zoomDelta)));
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // 1. Raycast Check Workstations
        for (const ws of WORKSTATIONS_3D) {
            const pt = project3D(ws.gridX, ws.gridY, ws.height / 2, centerX, centerY);
            const dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
            if (dist < 42 * cameraZoom) {
                setSelectedWorkstation(ws);
                setSelectedTube(null);
                setSelectedAgv(null);
                setSelectedCapsule(null);
                sfx.playClick();
                if (onSelectWorkstation) onSelectWorkstation(ws);
                return;
            }
        }

        // 2. Raycast Check Specimen Tubes
        for (const tube of tubes) {
            const pts = tube.isExpressBypass ? STAT_BYPASS_WAYPOINTS : MAIN_TRACK_WAYPOINTS;
            const totalPts = pts.length;
            const progressFloat = tube.trackProgress * (totalPts - 1);
            const idx1 = Math.floor(progressFloat);
            const idx2 = (idx1 + 1) % totalPts;
            const frac = progressFloat - idx1;
            const curX = pts[idx1][0] + (pts[idx2][0] - pts[idx1][0]) * frac;
            const curY = pts[idx1][1] + (pts[idx2][1] - pts[idx1][1]) * frac;
            const pt = project3D(curX, curY, 15, centerX, centerY);
            const dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
            if (dist < 20 * cameraZoom) {
                setSelectedTube(tube);
                setSelectedWorkstation(null);
                setSelectedAgv(null);
                setSelectedCapsule(null);
                sfx.playClick();
                if (onSelectTube) onSelectTube(tube);
                return;
            }
        }

        // 3. Raycast Check AGV Robots
        for (const agv of agvFleet) {
            const pt = project3D(agv.posX, agv.posY, 2, centerX, centerY);
            const dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
            if (dist < 22 * cameraZoom) {
                setSelectedAgv(agv);
                setSelectedWorkstation(null);
                setSelectedTube(null);
                setSelectedCapsule(null);
                sfx.playClick();
                if (onSelectAgv) onSelectAgv(agv);
                return;
            }
        }

        // 4. Raycast Check Pneumatic Capsules
        for (const cap of pneumaticCapsules) {
            const totalPts = PNEUMATIC_TUBE_PATH.length;
            const floatIdx = cap.progress * (totalPts - 1);
            const i1 = Math.floor(floatIdx);
            const i2 = (i1 + 1) % totalPts;
            const frac = floatIdx - i1;
            const cx =
                PNEUMATIC_TUBE_PATH[i1][0] +
                (PNEUMATIC_TUBE_PATH[i2][0] - PNEUMATIC_TUBE_PATH[i1][0]) * frac;
            const cy =
                PNEUMATIC_TUBE_PATH[i1][1] +
                (PNEUMATIC_TUBE_PATH[i2][1] - PNEUMATIC_TUBE_PATH[i1][1]) * frac;
            const cz =
                PNEUMATIC_TUBE_PATH[i1][2] +
                (PNEUMATIC_TUBE_PATH[i2][2] - PNEUMATIC_TUBE_PATH[i1][2]) * frac;
            const pt = project3D(cx, cy, cz, centerX, centerY);
            const dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
            if (dist < 18 * cameraZoom) {
                setSelectedCapsule(cap);
                setSelectedWorkstation(null);
                setSelectedTube(null);
                setSelectedAgv(null);
                sfx.playWhoosh();
                if (onSelectCapsule) onSelectCapsule(cap);
                return;
            }
        }

        setSelectedWorkstation(null);
        setSelectedTube(null);
        setSelectedAgv(null);
        setSelectedCapsule(null);
    };

    // Double-Click to Smoothly Focus and Frame Analyzers or Tubes
    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (const ws of WORKSTATIONS_3D) {
            const pt = project3D(ws.gridX, ws.gridY, ws.height / 2, centerX, centerY);
            const dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
            if (dist < 46 * cameraZoom) {
                setSelectedWorkstation(ws);
                setCameraPanX(-ws.gridX * cameraZoom * 0.7);
                setCameraPanY(-ws.gridY * cameraZoom * 0.4);
                setCameraZoom(2.2);
                sfx.playWhoosh();
                if (isVoiceEnabled) {
                    sfx.speak(`Workstation focused: ${ws.name}`);
                }
                return;
            }
        }
    };

    // Multi-Touch Gestures for Touchscreen Clinical Stations
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 1) {
            isDraggingRef.current = true;
            dragModeRef.current = 'ROTATE';
            dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            isDraggingRef.current = true;
            dragModeRef.current = 'PAN';
            const avgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const avgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            dragStartRef.current = { x: avgX, y: avgY };
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current) return;
        if (e.touches.length === 1 && dragModeRef.current === 'ROTATE') {
            const deltaX = e.touches[0].clientX - dragStartRef.current.x;
            const deltaY = e.touches[0].clientY - dragStartRef.current.y;
            dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setCameraAngle((prev) => (prev + deltaX * 0.45) % 360);
            setCameraElevation((prev) => Math.max(15, Math.min(80, prev - deltaY * 0.35)));
        } else if (e.touches.length === 2) {
            const avgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const avgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const deltaX = avgX - dragStartRef.current.x;
            const deltaY = avgY - dragStartRef.current.y;
            dragStartRef.current = { x: avgX, y: avgY };
            setCameraPanX((prev) => prev + deltaX);
            setCameraPanY((prev) => prev + deltaY);
        }
    };

    const handleTouchEnd = () => {
        isDraggingRef.current = false;
    };

    return (
        <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Top Command & Telemetry Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Box className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-white tracking-wide">
                                TLA 3D VIRTUAL WORLD MODEL & AUTONOMOUS ROBOTIC TWIN
                            </h2>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                <span>60 FPS SUB-MS PHYSICAL KINEMATICS</span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            {facilityName} • 13 Heavy Analyzers • Aerial Pneumatic Hub • AMR AGV Fleet
                        </p>
                    </div>
                </div>

                {/* Camera Presets & Render Modes */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Render Mode Switcher */}
                    <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
                        <button
                            onClick={() => {
                                setRenderMode('HOLOGRAPHIC_3D');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'HOLOGRAPHIC_3D'
                                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            3D Hologram
                        </button>
                        <button
                            onClick={() => {
                                setRenderMode('REALISTIC_CAD');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'REALISTIC_CAD'
                                    ? 'bg-slate-700 text-white font-bold border border-slate-600'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            CAD Architecture
                        </button>
                        <button
                            onClick={() => {
                                setRenderMode('THERMAL_HEATMAP');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'THERMAL_HEATMAP'
                                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            FLIR Heatmap
                        </button>
                        <button
                            onClick={() => {
                                setRenderMode('QUEUE_FRICTION');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'QUEUE_FRICTION'
                                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Queue Friction
                        </button>
                        <button
                            onClick={() => {
                                setRenderMode('CLEANROOM_AIRFLOW');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'CLEANROOM_AIRFLOW'
                                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Airflow & ISO
                        </button>
                        <button
                            onClick={() => {
                                setRenderMode('ELECTROMAGNETIC_FLUX');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'ELECTROMAGNETIC_FLUX'
                                    ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            EM Wave Flux
                        </button>
                        <button
                            onClick={() => {
                                setRenderMode('CYBER_NEON_GRID');
                                sfx.playClick();
                            }}
                            className={`px-2.5 py-1 rounded transition-all ${
                                renderMode === 'CYBER_NEON_GRID'
                                    ? 'bg-fuchsia-500/20 text-fuchsia-300 font-bold border border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/30'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Cyber Neon
                        </button>
                    </div>

                    {/* Camera Preset Quick Buttons */}
                    <div className="hidden xl:flex items-center gap-1">
                        <button
                            onClick={() => applyCameraPreset('OVERVIEW')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => applyCameraPreset('STAT_CHEMISTRY')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                        >
                            Cobas Line
                        </button>
                        <button
                            onClick={() => applyCameraPreset('HEMATOLOGY_LINE')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700"
                        >
                            Sysmex Line
                        </button>
                        <button
                            onClick={() => applyCameraPreset('CENTRIFUGE_HUB')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
                        >
                            Centrifuge
                        </button>
                        <button
                            onClick={() => applyCameraPreset('ROBOTIC_DECAPPER')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700"
                        >
                            SCARA Arm
                        </button>
                        <button
                            onClick={() => applyCameraPreset('MASS_SPEC_WING')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
                        >
                            LC-MS/MS
                        </button>
                        <button
                            onClick={() => applyCameraPreset('COLD_ARCHIVE')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
                        >
                            -80°C Vault
                        </button>
                        <button
                            onClick={() => applyCameraPreset('PNEUMATIC_BAY')}
                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-lime-300 border border-slate-700"
                        >
                            Pneumatic
                        </button>
                        <button
                            onClick={() => applyCameraPreset('AGV_FPV_COCKPIT')}
                            className="px-2 py-1 text-xs rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 font-semibold"
                            title="First-Person Ground Camera on AGV Alpha"
                        >
                            AGV FPV
                        </button>
                        <button
                            onClick={() => applyCameraPreset('PNEUMATIC_POV_FLYBY')}
                            className="px-2 py-1 text-xs rounded bg-lime-950/80 hover:bg-lime-900 text-lime-300 border border-lime-800/60 font-semibold"
                            title="Fly-by Camera on Swisslog Pneumatic Tube"
                        >
                            Aerial POV
                        </button>
                        <button
                            onClick={() => applyCameraPreset('DIRECTOR_ORBIT_CINEMATIC')}
                            className="px-2 py-1 text-xs rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 font-semibold"
                            title="Smooth Cinematic 360 Drone Flyaround"
                        >
                            Director 360
                        </button>
                    </div>

                    {/* Follow Tube Mode */}
                    <button
                        onClick={() => {
                            if (!selectedTube && tubes.length > 0) setSelectedTube(tubes[0]);
                            setIsFollowTube(!isFollowTube);
                            sfx.playClick();
                        }}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                            isFollowTube
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Lock Camera onto Moving Specimen Tube"
                    >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Chaser Cam</span>
                    </button>

                    {/* Auto Orbit Toggle */}
                    <button
                        onClick={() => {
                            setIsAutoOrbit(!isAutoOrbit);
                            sfx.playClick();
                        }}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                            isAutoOrbit
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="360° Drone Orbit Flight"
                    >
                        <RotateCw className={`w-3.5 h-3.5 ${isAutoOrbit ? 'animate-spin' : ''}`} />
                        <span>360° Drone</span>
                    </button>

                    {/* AI Voice Toggle */}
                    <button
                        onClick={() => {
                            const next = !isVoiceEnabled;
                            setIsVoiceEnabled(next);
                            if (next) sfx.speak('Voice telemetry enabled.');
                        }}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                            isVoiceEnabled
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                        title="AI Voice Telemetry Announcements"
                    >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Voice</span>
                    </button>

                    {/* Cyber Scanlines Toggle */}
                    <button
                        onClick={() => setShowCyberScanlines(!showCyberScanlines)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                            showCyberScanlines
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                        title="Toggle Cyberpunk Scanlines & HUD CRT Overlay"
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>HUD CRT</span>
                    </button>

                    {/* Sound Mute Toggle */}
                    <button
                        onClick={() => {
                            const next = !isSoundMuted;
                            setIsSoundMuted(next);
                            sfx.isMuted = next;
                            if (!next) sfx.playClick();
                        }}
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                        title="Toggle Sound Synthesizer"
                    >
                        {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Enterprise Quaternary Hospital Direct Physical Quick-Action Strip */}
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>TACTICAL COMMANDS:</span>
                    </span>

                    {/* Inject STAT Specimen Dropdown / Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleInjectStatTube('STROKE')}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                            title="Inject Code Stroke Sodium Citrate STAT Specimen"
                        >
                            <Zap className="w-3 h-3 text-sky-400" />
                            <span>+ STAT Stroke Coag</span>
                        </button>
                        <button
                            onClick={() => handleInjectStatTube('CARDIAC')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                            title="Inject STAT High-Sensitivity Troponin-I"
                        >
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span>+ STAT Troponin</span>
                        </button>
                        <button
                            onClick={() => handleInjectStatTube('SEPSIS')}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                            title="Inject STAT Sepsis Blood Lactate"
                        >
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>+ STAT Lactate</span>
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-800 mx-1" />

                    {/* Launch Pneumatic Tube Capsule */}
                    <button
                        onClick={() => handleLaunchPneumatic('OR-03 Main Cardiac Theatre')}
                        className="px-2.5 py-1 rounded-lg bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                        title="Launch Pneumatic Tube Capsule from OR to Core Lab"
                    >
                        <Send className="w-3 h-3 text-lime-400" />
                        <span>Launch Aerial Capsule</span>
                    </button>

                    {/* Trigger Automated UV-C Decontamination Cycle */}
                    <button
                        onClick={handleTriggerUvc}
                        disabled={isUvcActive}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border ${
                            isUvcActive
                                ? 'bg-purple-600/40 text-purple-200 border-purple-400 shadow-md shadow-purple-500/40 animate-pulse'
                                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40'
                        }`}
                        title="Trigger Automated UV-C 254nm Whole-Lab Sterilization"
                    >
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        <span>{isUvcActive ? `UV-C Sterilizing (${uvcCountdown}s)` : 'Sterilize Lab (UV-C)'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* AGV Teleoperation Mode Toggle */}
                    <button
                        onClick={() => {
                            const next = !isManualAgvControl;
                            setIsManualAgvControl(next);
                            if (next) {
                                setIsFollowAgv(true);
                                setCameraZoom(2.2);
                                sfx.playClick();
                                sfx.speak('AGV Remote Teleoperation manual driving cockpit activated.');
                            } else {
                                sfx.playClick();
                            }
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                            isManualAgvControl
                                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-lg shadow-cyan-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Manual Teleoperation Cockpit for Autonomous Mobile Robot AGV Alpha"
                    >
                        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isManualAgvControl ? 'AGV Cockpit Active' : 'Drive AGV Alpha'}</span>
                    </button>
                </div>
            </div>

            {/* Interactive 3D Canvas Area */}
            <div className="relative w-full h-[680px] bg-slate-950 cursor-grab active:cursor-grabbing select-none overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={1400}
                    height={720}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    onClick={handleClick}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full block"
                />

                {/* AGV Manual Teleoperation Cyberpunk Cockpit HUD */}
                {isManualAgvControl && (
                    <div className="absolute bottom-5 left-5 z-20 p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/50 backdrop-blur-xl shadow-2xl text-xs font-mono space-y-2 animate-fadeIn select-none">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-cyan-300 font-bold">
                            <span className="flex items-center gap-1.5">
                                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                                <span>AGV ALPHA [APEX] COCKPIT</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                {agvFleet[0]?.batteryPct}% LiFePO4
                            </span>
                        </div>

                        {/* Teleoperation D-Pad Controls */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                            <button
                                onClick={() => handleDriveAgv(1, 0)}
                                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white font-bold flex items-center justify-center border border-slate-700 hover:border-cyan-400 transition-all active:scale-95 shadow-md shadow-cyan-500/20"
                                title="Drive Forward"
                            >
                                ▲
                            </button>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDriveAgv(0, -15)}
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white font-bold flex items-center justify-center border border-slate-700 hover:border-cyan-400 transition-all active:scale-95"
                                    title="Steer Left"
                                >
                                    ◀
                                </button>
                                <button
                                    onClick={() => {
                                        sfx.playSonar();
                                        handleDriveAgv(0, 0);
                                    }}
                                    className="w-10 h-10 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border border-rose-400 transition-all active:scale-95 shadow-md shadow-rose-500/30"
                                    title="Emergency Brake"
                                >
                                    BRAKE
                                </button>
                                <button
                                    onClick={() => handleDriveAgv(0, 15)}
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white font-bold flex items-center justify-center border border-slate-700 hover:border-cyan-400 transition-all active:scale-95"
                                    title="Steer Right"
                                >
                                    ▶
                                </button>
                            </div>
                            <button
                                onClick={() => handleDriveAgv(-1, 0)}
                                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white font-bold flex items-center justify-center border border-slate-700 hover:border-cyan-400 transition-all active:scale-95"
                                title="Reverse"
                            >
                                ▼
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            <button
                                onClick={() => {
                                    sfx.playSonar();
                                    sfx.speak('Sonar horn pulsed.');
                                }}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-center"
                            >
                                🔊 Sonar Horn
                            </button>
                            <button
                                onClick={() => {
                                    setIsManualAgvControl(false);
                                    sfx.playClick();
                                }}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-center"
                            >
                                ✖ Exit FPV
                            </button>
                        </div>
                    </div>
                )}


                {/* Floating On-Screen Navigation Controls */}
                <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-10 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-xl text-slate-300">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => {
                                setCameraZoom((z) => Math.min(3.2, z + 0.15));
                                sfx.playClick();
                            }}
                            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-all"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setCameraZoom((z) => Math.max(0.55, z - 0.15));
                                sfx.playClick();
                            }}
                            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-all"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => applyCameraPreset('OVERVIEW')}
                            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-all"
                            title="Reset Camera"
                        >
                            <Compass className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-1 text-center">
                        Rot: {Math.round(cameraAngle)}° | Pitch: {Math.round(cameraElevation)}°
                    </div>
                </div>

                {/* Floating Centrifuge Real-Time Dynamics HUD */}
                <div className="absolute top-4 left-4 z-10 bg-slate-900/90 p-3 rounded-xl border border-slate-800/90 backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-1.5 shadow-2xl">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-1 text-emerald-400 font-bold">
                        <Gauge className="w-3.5 h-3.5" />
                        <span>LIVE ROTOR & TLA TELEMETRY</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Centrifuge RCF:</span>
                        <span className="text-white font-bold">3,013 × g (3,500 RPM)</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Dynamic Balance:</span>
                        <span className="text-emerald-400 font-bold">0.028 g·mm (NOMINAL)</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">MagneMotion Speed:</span>
                        <span className="text-purple-300 font-bold">2.2 m/sec</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Pneumatic Line:</span>
                        <span className="text-lime-300 font-bold">10.2 m/sec (1.4 bar)</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Core Pressure:</span>
                        <span className="text-cyan-300 font-bold">+15.2 Pa (ISO Class 7)</span>
                    </div>
                </div>

                {/* Maintenance Execution Banner */}
                {maintenanceSuccessBanner && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/60 backdrop-blur-xl flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold shadow-2xl animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{maintenanceSuccessBanner}</span>
                    </div>
                )}

                {/* Emergency STAT Code Active Banner */}
                {emergencyCode !== 'NORMAL' && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 backdrop-blur-xl flex items-center gap-2 text-rose-300 font-mono text-xs font-bold animate-pulse shadow-lg shadow-rose-500/20">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>TACTICAL EMERGENCY STAT PRIORITY EXPRESS ACTIVE: {emergencyCode}</span>
                    </div>
                )}

                {/* Interactive Workstation Holographic HUD Drawer */}
                {selectedWorkstation && (
                    <div className="absolute top-4 right-4 z-20 w-96 p-4 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3 max-h-[620px] overflow-y-auto">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                    {selectedWorkstation.department} • {selectedWorkstation.cleanroomIsoClass || 'ISO Class 7'}
                                </span>
                                <h3 className="text-sm font-bold text-white mt-1.5">
                                    {selectedWorkstation.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedWorkstation(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <div>
                                <span className="text-slate-500 block text-[10px]">CURRENT WIP</span>
                                <strong className="text-white">{selectedWorkstation.currentWip} tubes</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px]">THROUGHPUT</span>
                                <strong className="text-cyan-300">{selectedWorkstation.throughputPerHour}/hr</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px]">CHAMBER TEMP</span>
                                <strong className="text-emerald-400">{selectedWorkstation.temperatureC}°C</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px]">VACUUM</span>
                                <strong className="text-slate-300">{selectedWorkstation.vacuumPressureKpa} kPa</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px]">OPTIC LAMP</span>
                                <strong className="text-slate-300">{selectedWorkstation.opticalLampHours}h</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px]">WEIBULL RUL</span>
                                <strong className={selectedWorkstation.rulHours < 1000 ? 'text-amber-400' : 'text-cyan-400'}>
                                    {selectedWorkstation.rulHours}h
                                </strong>
                            </div>
                        </div>

                        {/* Reagent Capacity Bar */}
                        <div>
                            <div className="flex justify-between text-[11px] font-mono mb-1 text-slate-400">
                                <span>Reagent Pack Autonomy</span>
                                <span className="text-white font-bold">{selectedWorkstation.reagentRemainingPct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${
                                        selectedWorkstation.reagentRemainingPct <= 30
                                            ? 'bg-rose-500'
                                            : selectedWorkstation.reagentRemainingPct <= 60
                                            ? 'bg-amber-400'
                                            : 'bg-cyan-400'
                                    }`}
                                    style={{ width: `${selectedWorkstation.reagentRemainingPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Remote Biomedical Engineering Action Cockpit */}
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                Real-World Remote Biomedical Controls:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <button
                                    disabled={isExecutingAction}
                                    onClick={() => handleExecuteMaintenanceAction('Photometer Baseline Calibration')}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 text-[11px] font-semibold"
                                >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>Photometer Calib</span>
                                </button>
                                <button
                                    disabled={isExecutingAction}
                                    onClick={() => handleExecuteMaintenanceAction('Hydraulic Fluidics Flush')}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1.5 text-[11px] font-semibold"
                                >
                                    <Droplets className="w-3.5 h-3.5" />
                                    <span>Flush Fluidics</span>
                                </button>
                                <button
                                    disabled={isExecutingAction}
                                    onClick={() => handleExecuteMaintenanceAction('Syringe De-Bubble Prime Cycle')}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 text-[11px] font-semibold"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>De-Bubble Prime</span>
                                </button>
                                <button
                                    disabled={isExecutingAction}
                                    onClick={() => {
                                        handleExecuteMaintenanceAction('Biomedical Work Order Dispatched', 1000);
                                        if (onDispatchWorkOrder && selectedWorkstation) {
                                            onDispatchWorkOrder(selectedWorkstation.id, `Preventative Sensor Calibration & QC Offset Verification for ${selectedWorkstation.name}`);
                                        }
                                    }}
                                    className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 text-[11px] font-bold shadow-md shadow-cyan-600/30"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>BioMed Ticket</span>
                                </button>

                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                            <span className="text-emerald-400 font-mono flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ISO 15189 Validated</span>
                            </span>
                            <button
                                onClick={() => {
                                    if (onSelectWorkstation) onSelectWorkstation(selectedWorkstation);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[11px]"
                            >
                                Full Telemetry
                            </button>
                        </div>
                    </div>
                )}

                {/* Interactive Specimen Tube Dossier Drawer */}
                {selectedTube && (
                    <div className="absolute top-4 right-4 z-20 w-88 p-4 rounded-xl bg-slate-900/95 border border-purple-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="w-3 h-3 rounded-full border border-white"
                                        style={{ backgroundColor: selectedTube.capColorHex }}
                                    />
                                    <span className="text-xs font-bold text-white font-mono">
                                        {selectedTube.barcode}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                    {selectedTube.capLabel}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedTube(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <div className="flex justify-between">
                                <span className="text-slate-500">PATIENT UHID:</span>
                                <span className="text-cyan-300 font-bold">{selectedTube.patientUhid}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">PRIORITY SLA:</span>
                                <span
                                    className={
                                        selectedTube.priority === 'STAT_EMERGENCY'
                                            ? 'text-rose-400 font-bold'
                                            : 'text-slate-300'
                                    }
                                >
                                    {selectedTube.priority}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">TRANSIT TIME:</span>
                                <span className="text-white font-semibold">{selectedTube.elapsedMinutes} min</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">BIO-STABILITY:</span>
                                <span
                                    className={
                                        selectedTube.viabilityPct < 95
                                            ? 'text-amber-400 font-bold'
                                            : 'text-emerald-400'
                                    }
                                >
                                    {selectedTube.viabilityPct}%
                                </span>
                            </div>
                            {selectedTube.testsOrdered && (
                                <div className="pt-1 border-t border-slate-800 text-[10px]">
                                    <span className="text-slate-500 block">TESTS ORDERED:</span>
                                    <strong className="text-purple-300">
                                        {selectedTube.testsOrdered.join(', ')}
                                    </strong>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                            <button
                                onClick={() => {
                                    setIsFollowTube(true);
                                    sfx.playClick();
                                }}
                                className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-[11px] font-semibold"
                            >
                                Track Tube Cam
                            </button>
                            <button
                                onClick={() => {
                                    if (onSelectTube) onSelectTube(selectedTube);
                                }}
                                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px]"
                            >
                                Full Chain Dossier
                            </button>
                        </div>
                    </div>
                )}

                {/* Interactive AGV Robot Dossier Drawer */}
                {selectedAgv && (
                    <div className="absolute top-4 right-4 z-20 w-84 p-4 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <Bot className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs font-bold text-white font-mono">
                                        {selectedAgv.callsign}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                    LIDAR-Guided Autonomous Mobile Robot (AMR)
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedAgv(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <div className="flex justify-between">
                                <span className="text-slate-500">STATUS:</span>
                                <span className="text-emerald-400 font-bold">{selectedAgv.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">BATTERY:</span>
                                <span className="text-cyan-300 font-bold">{selectedAgv.batteryPct}% LiFePO4</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">PAYLOAD COUNT:</span>
                                <span className="text-white font-semibold">{selectedAgv.payloadSamples} tubes</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">CARGO CLASS:</span>
                                <span className="text-purple-300 font-semibold">{selectedAgv.payloadType}</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2 text-xs">
                            <button
                                onClick={() => {
                                    handleExecuteMaintenanceAction(`AGV ${selectedAgv.id} Rerouted to STAT Accessioning`, 1200);
                                }}
                                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px]"
                            >
                                Dispatch AGV
                            </button>
                        </div>
                    </div>
                )}

                {/* Interactive Pneumatic Capsule Drawer */}
                {selectedCapsule && (
                    <div className="absolute top-4 right-4 z-20 w-84 p-4 rounded-xl bg-slate-900/95 border border-lime-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <Send className="w-4 h-4 text-lime-400" />
                                    <span className="text-xs font-bold text-white font-mono">
                                        {selectedCapsule.id}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                    Swisslog TranspoNet Aerial Vacuum Capsule
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedCapsule(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <div className="flex justify-between">
                                <span className="text-slate-500">ORIGIN WARD:</span>
                                <span className="text-lime-300 font-bold">{selectedCapsule.originWard}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">TRANSIT VELOCITY:</span>
                                <span className="text-white font-bold">{selectedCapsule.velocityMps} m/sec</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">PATIENT UHID:</span>
                                <span className="text-cyan-300">{selectedCapsule.patientUhid}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">CLINICAL ORDER:</span>
                                <span className="text-rose-400 font-bold">{selectedCapsule.testName}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Physical Zone Status Bar & Layer Toggles */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                    <span>
                        Active Infeed: <strong className="text-white">1,620 tubes/hr</strong>
                    </span>
                    <span>
                        Centrifuges: <strong className="text-emerald-400">3,500 RPM (3k G)</strong>
                    </span>
                    <span>
                        SCARA Decapper: <strong className="text-cyan-400">3.2 sec/tube</strong>
                    </span>
                    <span>
                        Pneumatic Hub: <strong className="text-lime-400">10.2 m/sec</strong>
                    </span>
                    <span>
                        AMR AGVs: <strong className="text-purple-300">2 Patrolling</strong>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowOverheadTubes(!showOverheadTubes)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                            showOverheadTubes
                                ? 'bg-lime-500/20 text-lime-300 border-lime-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                    >
                        Aerial Tubes
                    </button>
                    <button
                        onClick={() => setShowAgvFleet(!showAgvFleet)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                            showAgvFleet
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                    >
                        AGV Robots
                    </button>
                    <button
                        onClick={() => setShowCleanroomAirflow(!showCleanroomAirflow)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                            showCleanroomAirflow
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                    >
                        Cleanroom Air
                    </button>
                    <button
                        onClick={() => setShowTacticalRadar(!showTacticalRadar)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                            showTacticalRadar
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                    >
                        Spatial Radar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Virtual3DWorldModel;
