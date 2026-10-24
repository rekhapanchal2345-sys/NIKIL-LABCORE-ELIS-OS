'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Box,
    Brain,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Compass,
    Cpu,
    Database,
    DollarSign,
    Download,
    Eye,
    FileCheck2,
    FileText,
    Filter,
    Flame,
    FlaskConical,
    GitBranch,
    HelpCircle,
    Info,
    Layers,
    Lock,
    Maximize2,
    Minimize2,
    Network,
    Play,
    Plus,
    Printer,
    Radio,
    RefreshCw,
    RotateCcw,
    Scale,
    Search,
    Send,
    Share2,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Target,
    Thermometer,
    TrendingDown,
    TrendingUp,
    Volume2,
    VolumeX,
    Workflow,
    Wrench,
    X,
    XCircle,
    Zap,
} from 'lucide-react';

import Virtual3DWorldModel from './Virtual3DWorldModel';
import AdvancedClinicalGraphs from './AdvancedClinicalGraphs';
import {
    NexusStoreProvider,
    useNexusStore,
    DOMAIN_PILLARS,
    DomainPillarId,
    PurchaseOrderRecord,
} from './useNexusStore';
import {
    DataProvenance,
    EnterpriseAnalyzerTelemetry,
    HospitalFacilityId,
    EmergencyStatCode,
    NexusTab,
    ControlledAutonomyProposal,
    DeltaCheckAlert,
    ReagentInventoryAdvisory,
    LiveSpecimenCarrier,
    QueueProcessAnalytics,
    Hl7FhirMessagePacket,
} from './nexus.contracts';

// =========================================================================
// DATA PROVENANCE BADGE (ISO 15189:2022)
// =========================================================================

export const ProvenanceBadge: React.FC<{ provenance: DataProvenance; className?: string }> = ({
    provenance,
    className = '',
}) => {
    const config: Record<DataProvenance, { bg: string; text: string; border: string }> = {
        LIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        CONFIRMED: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
        PREDICTED: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
        SIMULATED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
        HISTORICAL: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
        SYNTHETIC: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
        HYPOTHETICAL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    };

    const style = config[provenance] || config.LIVE;

    return (
        <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded border ${style.bg} ${style.text} ${style.border} ${className}`}
            title={`Data Provenance Standard: ${provenance}`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {provenance}
        </span>
    );
};

// =========================================================================
// SOUND SYNTHESIZER UTILITY (Web Audio API)
// =========================================================================

class SoundSynthesizer {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    private initContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
    }

    public playTactileClick() {
        if (this.isMuted) return;
        try {
            this.initContext();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch {
            // Audio context fallback
        }
    }

    public playRadarPing() {
        if (this.isMuted) return;
        try {
            this.initContext();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch {
            // Ignore
        }
    }

    public playStatChime() {
        if (this.isMuted) return;
        try {
            this.initContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc1.type = 'triangle';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.18);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.35);
        } catch {
            // Ignore
        }
    }

    public playAlarmPulse() {
        if (this.isMuted) return;
        try {
            this.initContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } catch {
            // Ignore
        }
    }
}

const INITIAL_HL7_MESSAGES: Hl7FhirMessagePacket[] = [
    {
        messageControlId: 'MSG-20261016-9021',
        eventCode: 'ORM^O01',
        sendingFacility: 'EPIC_BEAKER_TRAUMA_ED',
        patientUhid: 'UHID-7729-ICU',
        accessionBarcode: 'BC-TROP-9021',
        orderedTests: ['hs-cTnI (High-Sens Troponin I)', 'CK-MB', 'NT-proBNP'],
        priority: 'STAT',
        timestamp: '14:42:08.120 IST',
        parserLatencyMs: 9.8,
        securitySignatureSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        rawHl7Payload: 'MSH|^~\\&|EPIC_BEAKER|METRO_TRAUMA|LABCORE_NEXUS|CORE_LAB|20261016144208||ORM^O01|MSG-9021|P|2.8\\nPID|1||UHID-7729-ICU^^^METRO||SHARMA^RAJESH^^^MR||19680412|M|||ICU-BED-04\\nPV1|1|I|ICU^04^01|EMERGENCY|||11029^DR_KAPOOR^CARDIOLOGY\\nORC|NW|ORD-99021||||^^^STAT||202610161442\\nOBR|1|ORD-99021||TROP_HS^Troponin I High Sensitivity^LN|||202610161440|||||||||GREEN_HEPARIN',
    },
    {
        messageControlId: 'MSG-20261016-8812',
        eventCode: 'ORU^R01',
        sendingFacility: 'SYSMEX_XN9100_AUTO',
        patientUhid: 'UHID-4421-ED',
        accessionBarcode: 'BC-CBC-8812',
        orderedTests: ['CBC With Automated Differential', 'Platelets'],
        priority: 'STAT',
        timestamp: '14:41:45.340 IST',
        parserLatencyMs: 11.2,
        securitySignatureSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        rawHl7Payload: 'MSH|^~\\&|SYSMEX_XN|CORE_HEM|EPIC_BEAKER|METRO_ED|20261016144145||ORU^R01|MSG-8812|P|2.8\\nPID|1||UHID-4421-ED^^^METRO||VERMA^PRIYA^^^MS||19851120|F|||ED-TRIAGE-02\\nOBR|1|ORD-88812||CBC_DIFF^Complete Blood Count^LN|||202610161435\\nOBX|1|NM|WBC^White Blood Count^LN||14.8|10*3/uL|4.0-11.0|H|||F\\nOBX|2|NM|HGB^Hemoglobin^LN||12.2|g/dL|12.0-16.0|N|||F\\nOBX|3|NM|PLT^Platelet Count^LN||285|10*3/uL|150-450|N|||F',
    },
    {
        messageControlId: 'MSG-20261016-7740',
        eventCode: 'ORM^O01',
        sendingFacility: 'CERNER_MILLENNIUM_NICU',
        patientUhid: 'UHID-6612-NEO',
        accessionBarcode: 'BC-TOX-7740',
        orderedTests: ['Newborn Acylcarnitine Profile (LC-MS/MS)'],
        priority: 'URGENT',
        timestamp: '14:40:12.600 IST',
        parserLatencyMs: 14.1,
        securitySignatureSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        rawHl7Payload: 'MSH|^~\\&|CERNER|METRO_NICU|LABCORE_NEXUS|MASS_SPEC|20261016144012||ORM^O01|MSG-7740|P|2.8\\nPID|1||UHID-6612-NEO^^^METRO||BABY_OF_ANITA^^^INFANT||20261015|M|||NICU-ISO-01\\nOBR|1|ORD-7740||ACYL_MS^Acylcarnitines Tandem MS^LN|||202610161430',
    },
    {
        messageControlId: 'MSG-20261016-5519',
        eventCode: 'ORU^R01',
        sendingFacility: 'STAGO_STAR_MAX_COAG',
        patientUhid: 'UHID-3310-OR',
        accessionBarcode: 'BC-COAG-5519',
        orderedTests: ['Prothrombin Time / INR', 'Fibrinogen'],
        priority: 'STAT',
        timestamp: '14:38:50.110 IST',
        parserLatencyMs: 8.9,
        securitySignatureSha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        rawHl7Payload: 'MSH|^~\\&|STAGO_STAR|CORE_COAG|EPIC_BEAKER|METRO_OR|20261016143850||ORU^R01|MSG-5519|P|2.8\\nPID|1||UHID-3310-OR^^^METRO||DESHMUKH^ARUN^^^MR||19540819|M|||OR-MAIN-THEATRE-03\\nOBX|1|NM|INR^International Normalized Ratio^LN||1.04|ratio|0.8-1.2|N|||F\\nOBX|2|NM|PT^Prothrombin Time^LN||11.8|sec|11.0-13.5|N|||F',
    },
];

const audioSynth = new SoundSynthesizer();

// =========================================================================
// INNER ENTERPRISE COMMAND CENTER DECK (CONSUMES USE_NEXUS_STORE)
// =========================================================================

function OmniscientNexusDeckInner() {
    const { state, actions } = useNexusStore();

    // Local transient UI states
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [inspectedCarrier, setInspectedCarrier] = useState<LiveSpecimenCarrier | null>(
        state.liveSpecimens[0] || null
    );
    const [inspectedAnalyzer, setInspectedAnalyzer] = useState<EnterpriseAnalyzerTelemetry | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // HL7 v2.8 / FHIR R5 Event Bus Modal State
    const [isHl7ModalOpen, setIsHl7ModalOpen] = useState<boolean>(false);
    const [selectedHl7Msg, setSelectedHl7Msg] = useState<Hl7FhirMessagePacket | null>(INITIAL_HL7_MESSAGES[0]);
    const [hl7Messages, setHl7Messages] = useState<Hl7FhirMessagePacket[]>(INITIAL_HL7_MESSAGES);

    // Delta-Check Clinician Note Prompt Modal
    const [acknowledgingDeltaId, setAcknowledgingDeltaId] = useState<string | null>(null);
    const [deltaNoteInput, setDeltaNoteInput] = useState<string>('Attending physician and nephrology on-call paged. Repeat drawn.');

    // Specimen Tracker Filter State
    const [specimenFilterDept, setSpecimenFilterDept] = useState<string>('ALL');

    // Mathematical Sandbox Inputs
    const [mathInputSeries, setMathInputSeries] = useState<string>('32, 45, 42, 38, 51, 48, 62, 39, 44, 40, 95');
    const [mathResult, setMathResult] = useState<any>(null);

    // Weibull Simulator Inputs
    const [weibullOperatingHours, setWeibullOperatingHours] = useState<number>(380);
    const [weibullEta, setWeibullEta] = useState<number>(500);
    const [weibullBeta, setWeibullBeta] = useState<number>(2.4);

    // Arrhenius Simulator Inputs
    const [arrheniusTempC, setArrheniusTempC] = useState<number>(24);
    const [arrheniusAnalyte, setArrheniusAnalyte] = useState<string>('K_SERUM');

    // Erlang-C Queue Simulator Inputs
    const [queueLambda, setQueueLambda] = useState<number>(140);
    const [queueMu, setQueueMu] = useState<number>(80);
    const [queueChannels, setQueueChannels] = useState<number>(2);

    // Toggle Sound Mute
    const handleToggleSound = () => {
        actions.toggleSoundMuted();
        audioSynth.setMuted(!state.isSoundMuted);
        if (state.isSoundMuted) {
            audioSynth.playTactileClick();
        }
    };

    // Toggle Fullscreen
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        }
    };

    // Emergency Code Activation
    const handleActivateEmergencyCode = (code: EmergencyStatCode) => {
        actions.setEmergencyCode(code);
        if (code === 'NORMAL') {
            audioSynth.playTactileClick();
            setNotification({
                type: 'success',
                message: 'Standard Operational Balancing restored across all TLA channels.',
            });
        } else if (code === 'CODE_STROKE') {
            audioSynth.playStatChime();
            setNotification({
                type: 'error',
                message: 'EMERGENCY CODE STROKE ACTIVE: Coagulation & STAT Troponin lines prioritized. Policy set to Aggressive STAT Minimum TAT.',
            });
        } else if (code === 'CODE_SEPSIS') {
            audioSynth.playAlarmPulse();
            setNotification({
                type: 'error',
                message: 'EMERGENCY CODE SEPSIS ACTIVE: Procalcitonin, Blood Lactate, & Blood Culture expedited to 0-wait SLA.',
            });
        } else if (code === 'CODE_TRAUMA_MTP') {
            audioSynth.playAlarmPulse();
            setNotification({
                type: 'error',
                message: 'MASSIVE TRANSFUSION PROTOCOL (MTP) ACTIVE: Type & Crossmatch and Hemoglobin channels locked.',
            });
        } else if (code === 'CODE_BIOHAZARD') {
            audioSynth.playAlarmPulse();
            setNotification({
                type: 'error',
                message: 'BIOHAZARD BSL-3 ISOLATION ACTIVE: Negative pressure barriers locked (-24.5 Pa), automated UV-C decontamination engaged, air shower active.',
            });
        }
    };

    // Barcode Search Action
    const handleBarcodeSearch = () => {
        if (!state.searchBarcode.trim()) return;
        const query = state.searchBarcode.trim().toUpperCase();
        const match = state.liveSpecimens.find(
            (c) => c.barcode.toUpperCase().includes(query) || c.patientUhid.toUpperCase().includes(query)
        );
        if (match) {
            audioSynth.playTactileClick();
            setInspectedCarrier(match);
            actions.setActiveTab('SPECIMEN_TRACKER');
            setNotification({
                type: 'success',
                message: `Carrier Identified: ${match.barcode} (${match.tubeLabel}) currently in ${match.currentZoneName}`,
            });
        } else {
            audioSynth.playAlarmPulse();
            setNotification({
                type: 'error',
                message: `Barcode "${query}" not found on active automation tracks. Check accessioning intake.`,
            });
        }
    };

    // Autonomy Proposal Authorization
    const handleAuthorizeProposal = (proposalId: string) => {
        const res = actions.authorizeProposal(proposalId);
        if (res.success) {
            audioSynth.playStatChime();
            setNotification({ type: 'success', message: res.message });
        } else {
            audioSynth.playAlarmPulse();
            setNotification({ type: 'error', message: res.message });
        }
    };

    // Autonomy Proposal Rejection
    const handleRejectProposal = (proposalId: string) => {
        const res = actions.rejectProposal(proposalId);
        if (res.success) {
            audioSynth.playTactileClick();
            setNotification({ type: 'success', message: res.message });
        } else {
            audioSynth.playAlarmPulse();
            setNotification({ type: 'error', message: res.message });
        }
    };

    // Recalibration Action
    const handleRecalibration = (analyzerId: string) => {
        audioSynth.playTactileClick();
        actions.scheduleRecalibration(analyzerId);
        setNotification({
            type: 'success',
            message: `Instrument 3-Point Recalibration verified on ${analyzerId}. Westgard breach cleared; Analyzer ONLINE.`,
        });
    };

    // Delta-Check Acknowledgment Submission
    const handleConfirmDeltaAcknowledgment = () => {
        if (!acknowledgingDeltaId) return;
        actions.acknowledgeDeltaCheck(acknowledgingDeltaId, deltaNoteInput);
        audioSynth.playTactileClick();
        setNotification({
            type: 'success',
            message: `Delta alert ${acknowledgingDeltaId} successfully signed off & logged to clinician communications.`,
        });
        setAcknowledgingDeltaId(null);
    };

    // Reagent PO Generation
    const handleGeneratePo = (reagentId: string) => {
        audioSynth.playStatChime();
        const po = actions.generatePurchaseOrder(reagentId);
        setNotification({
            type: 'success',
            message: `Purchase Order ${po.poNumber} generated for ${po.reagentName} (${po.quantityPacks} packs, $${po.totalAmountUsd.toLocaleString()}). Dispatched to ERP.`,
        });
    };

    // Descriptive Statistics Workbench Calculation
    const handleRunMathCalculation = () => {
        audioSynth.playTactileClick();
        try {
            const numbers = mathInputSeries
                .split(',')
                .map((s) => parseFloat(s.trim()))
                .filter((n) => !isNaN(n));

            if (numbers.length === 0) {
                setMathResult(null);
                return;
            }

            const n = numbers.length;
            const mean = numbers.reduce((a, b) => a + b, 0) / n;
            const variance = n > 1 ? numbers.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (n - 1) : 0;
            const stdDev = Math.sqrt(variance);

            const sorted = [...numbers].sort((a, b) => a - b);
            const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

            const q1Idx = Math.floor(n * 0.25);
            const q3Idx = Math.floor(n * 0.75);
            const q1 = sorted[q1Idx];
            const q3 = sorted[q3Idx];
            const iqr = q3 - q1;

            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;
            const outliers = numbers.filter((x) => x < lowerFence || x > upperFence);

            // MAD calculation
            const absDevs = numbers.map((x) => Math.abs(x - median)).sort((a, b) => a - b);
            const mad = n % 2 === 0 ? (absDevs[n / 2 - 1] + absDevs[n / 2]) / 2 : absDevs[Math.floor(n / 2)];

            setMathResult({
                sampleSize: n,
                mean: mean.toFixed(3),
                median: median.toFixed(3),
                variance: variance.toFixed(3),
                stdDev: stdDev.toFixed(3),
                iqr: iqr.toFixed(3),
                mad: mad.toFixed(3),
                lowerFence: lowerFence.toFixed(2),
                upperFence: upperFence.toFixed(2),
                outliersCount: outliers.length,
                p10: sorted[Math.floor(n * 0.1)] || sorted[0],
                p25: q1,
                p75: q3,
                p90: sorted[Math.floor(n * 0.9)] || sorted[n - 1],
                p99: sorted[Math.floor(n * 0.99)] || sorted[n - 1],
            });
        } catch {
            setMathResult(null);
        }
    };

    // Calculate Weibull Survival Live
    const weibullMetrics = useMemo(() => {
        if (weibullEta <= 0 || weibullBeta <= 0) {
            return { survivalPct: '0.0', hazardRate: '0.000', failure24hPct: '0.0', rulHours: '0.0' };
        }
        const t = weibullOperatingHours;
        const R = Math.exp(-Math.pow(t / weibullEta, weibullBeta));
        const h = (weibullBeta / weibullEta) * Math.pow(t / weibullEta, weibullBeta - 1);
        const R24 = Math.exp(-Math.pow((t + 24) / weibullEta, weibullBeta));
        const condFail24h = R > 0 ? (R - R24) / R : 1.0;
        const targetR = 0.5;
        const tTarget = weibullEta * Math.pow(-Math.log(targetR), 1 / weibullBeta);
        const rul = Math.max(0, tTarget - t);

        return {
            survivalPct: (R * 100).toFixed(2),
            hazardRate: h.toFixed(5),
            failure24hPct: (condFail24h * 100).toFixed(2),
            rulHours: rul.toFixed(1),
        };
    }, [weibullOperatingHours, weibullEta, weibullBeta]);

    // Calculate Arrhenius Kinetics Live
    const arrheniusMetrics = useMemo(() => {
        const EaOverRMap: Record<string, number> = {
            K_SERUM: 4200,
            GLUCOSE: 5400,
            LACTATE: 6100,
            AMMONIA: 6500,
            TROPONIN_I: 3800,
        };
        const kRefMap: Record<string, number> = {
            K_SERUM: 0.005,
            GLUCOSE: 0.010,
            LACTATE: 0.020,
            AMMONIA: 0.080,
            TROPONIN_I: 0.008,
        };

        const EaOverR = EaOverRMap[arrheniusAnalyte] || 4200;
        const kRef = kRefMap[arrheniusAnalyte] || 0.005;
        const TRefK = 277.15; // 4°C
        const TK = 273.15 + arrheniusTempC;

        const kRatio = Math.exp(EaOverR * (1 / TRefK - 1 / TK));
        const kActive = kRef * kRatio;
        const halfLifeHours = Math.log(2) / kActive;
        const halfLifeRef = Math.log(2) / kRef;

        return {
            tempC: arrheniusTempC,
            multiplier: kRatio.toFixed(2),
            activeRatePerHour: kActive.toFixed(4),
            halfLifeHours: halfLifeHours.toFixed(1),
            halfLifeRefHours: halfLifeRef.toFixed(1),
            lossIn4HoursPct: ((1 - Math.exp(-kActive * 4)) * 100).toFixed(2),
        };
    }, [arrheniusTempC, arrheniusAnalyte]);

    // Calculate Erlang-C Live
    const erlangCMetrics = useMemo(() => {
        const lambda = queueLambda;
        const mu = queueMu;
        const c = queueChannels;
        const a = lambda / mu;
        const rho = a / c;

        if (rho >= 1.0) {
            return {
                isSaturated: true,
                rho: (rho * 100).toFixed(1),
                pWait: '100.0',
                wqMinutes: 'Infinity',
                wTotalMinutes: 'Infinity',
                wipL: 'Unbounded',
            };
        }

        let sum = 0;
        let term = 1;
        for (let k = 0; k < c; k++) {
            if (k > 0) term = (term * a) / k;
            sum += term;
        }
        let termC = term * (a / c);
        const lastTerm = termC / (1 - rho);
        const pWait = lastTerm / (sum + lastTerm);
        const wqHours = pWait / (c * mu * (1 - rho));
        const wqMin = wqHours * 60;
        const wTotalMin = wqMin + (1 / mu) * 60;
        const wipL = lambda * (wTotalMin / 60);

        return {
            isSaturated: false,
            rho: (rho * 100).toFixed(1),
            pWait: (pWait * 100).toFixed(2),
            wqMinutes: wqMin.toFixed(1),
            wTotalMinutes: wTotalMin.toFixed(1),
            wipL: wipL.toFixed(1),
        };
    }, [queueLambda, queueMu, queueChannels]);

    // Active Domain Object
    const activeDomainObj = DOMAIN_PILLARS.find((p) => p.id === state.activeDomain) || DOMAIN_PILLARS[0];
    const currentFacility = state.facilities?.[state.activeFacility];

    return (
        <div className="flex flex-col min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            {/* ========================================================================= */}
            {/* PERSISTENT GLOBAL ENTERPRISE HEADER (PINNED TOP) */}
            {/* ========================================================================= */}
            <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0a0d14]/95 backdrop-blur-md px-6 py-2.5 transition-all shadow-xl shadow-black/40">
                <div className="flex flex-wrap items-center justify-between gap-4 max-w-[1780px] mx-auto w-full">
                    {/* Left: Brand & Live Telemetry Ticker */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/20 to-indigo-600/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                            <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#0a0d14] animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                                    <span>LABCORE</span>
                                    <span className="text-cyan-400 font-mono">OMNISCIENT NEXUS</span>
                                </h1>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                                    v4.0 PROD
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>TLA Bus: <strong className="text-white">ONLINE</strong></span>
                                </span>
                                <span>•</span>
                                <span>ASTM E1394-97: <strong className="text-emerald-400">0 DLQ Errors</strong></span>
                                <span>•</span>
                                <span>HL7 v2.5.1: <strong className="text-slate-300">3,280 msgs/hr</strong></span>
                                <span>•</span>
                                <span>Fleet MTBF: <strong className="text-cyan-300">1,840h</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Multi-Facility Network Selector & STAT Emergency Action Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Hospital Facility Selector & Profile Badge */}
                        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                            <Network className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <select
                                value={state.activeFacility}
                                onChange={(e) => {
                                    audioSynth.playTactileClick();
                                    actions.setActiveFacility(e.target.value as HospitalFacilityId);
                                }}
                                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                            >
                                <option value="FACILITY-METRO-CORE" className="bg-slate-900 text-white">
                                    Metro Central Academic Medical Center - Core Lab
                                </option>
                                <option value="FACILITY-NORTH-STAT" className="bg-slate-900 text-white">
                                    North Pavilion Emergency STAT Lab
                                </option>
                                <option value="FACILITY-WEST-CANCER" className="bg-slate-900 text-white">
                                    Westside Regional Cancer Institute
                                </option>
                                <option value="FACILITY-SUBURBAN-CLINIC" className="bg-slate-900 text-white">
                                    Suburban Diagnostic Satellite Clinic
                                </option>
                            </select>

                            {/* Active Facility Profile Micro-Ribbon */}
                            {currentFacility && (
                                <div className="hidden xl:flex items-center gap-2 pl-2.5 border-l border-slate-800 font-mono text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-bold">
                                        {currentFacility.bedCount.toLocaleString()} Beds
                                    </span>
                                    <span className="text-slate-400">
                                        {currentFacility.dailyThroughput.toLocaleString()} tubes/24h
                                    </span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-emerald-400 font-medium">
                                        {currentFacility.primaryLims}
                                    </span>
                                    <span className="text-slate-600">•</span>
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[9px]">
                                        {currentFacility.activeCleanroomClass}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Emergency STAT Code Action Bar */}
                        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
                            <button
                                onClick={() => handleActivateEmergencyCode('NORMAL')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    state.emergencyCode === 'NORMAL'
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                NORMAL
                            </button>
                            <button
                                onClick={() => handleActivateEmergencyCode('CODE_STROKE')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    state.emergencyCode === 'CODE_STROKE'
                                        ? 'bg-amber-600 text-white animate-pulse shadow-md shadow-amber-600/30'
                                        : 'text-amber-400 hover:bg-amber-950/40'
                                }`}
                                title="Prioritize tPA Coagulation (PT/INR, PTT) and STAT Troponin"
                            >
                                <Flame className="w-2.5 h-2.5" />
                                <span>CODE STROKE</span>
                            </button>
                            <button
                                onClick={() => handleActivateEmergencyCode('CODE_SEPSIS')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    state.emergencyCode === 'CODE_SEPSIS'
                                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                                        : 'text-rose-400 hover:bg-rose-950/40'
                                }`}
                                title="Prioritize Blood Gas, Lactate, Procalcitonin & Blood Culture"
                            >
                                <AlertOctagon className="w-2.5 h-2.5" />
                                <span>CODE SEPSIS</span>
                            </button>
                            <button
                                onClick={() => handleActivateEmergencyCode('CODE_TRAUMA_MTP')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    state.emergencyCode === 'CODE_TRAUMA_MTP'
                                        ? 'bg-purple-600 text-white animate-pulse shadow-md shadow-purple-600/30'
                                        : 'text-purple-400 hover:bg-purple-950/40'
                                }`}
                                title="Massive Transfusion Protocol: Type & Crossmatch Priority"
                            >
                                <ShieldAlert className="w-2.5 h-2.5" />
                                <span>TRAUMA MTP</span>
                            </button>
                            <button
                                onClick={() => handleActivateEmergencyCode('CODE_BIOHAZARD')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    state.emergencyCode === 'CODE_BIOHAZARD'
                                        ? 'bg-rose-700 text-white animate-pulse shadow-md shadow-rose-700/40 ring-1 ring-rose-400'
                                        : 'text-rose-400 hover:bg-rose-950/40'
                                }`}
                                title="BSL-3 Cleanroom Isolation & Decontamination Protocol"
                            >
                                <ShieldAlert className="w-2.5 h-2.5" />
                                <span>BIOHAZARD BSL-3</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Barcode Search, Role Switcher, HL7 Feed, Audit Dossier & Sound */}
                    <div className="flex items-center gap-3">
                        {/* Barcode Quick Radar Search */}
                        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Locate Specimen Barcode or UHID..."
                                value={state.searchBarcode}
                                onChange={(e) => actions.setSearchBarcode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                                className="bg-transparent text-xs text-cyan-300 placeholder:text-slate-600 focus:outline-none w-48 font-mono"
                            />
                            <button
                                onClick={handleBarcodeSearch}
                                className="px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-[10px] font-bold border border-cyan-500/40"
                            >
                                Track
                            </button>
                        </div>

                        {/* HL7 v2.8 / FHIR R5 Event Bus Trigger */}
                        <button
                            onClick={() => {
                                audioSynth.playStatChime();
                                setIsHl7ModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-md"
                            title="Real-Time Hospital HL7 v2.8 / FHIR R5 Clinical Event Feed"
                        >
                            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            <span>HL7/FHIR Live</span>
                        </button>

                        {/* Audit Dossier Trigger */}
                        <button
                            onClick={() => {
                                audioSynth.playStatChime();
                                actions.setIsAuditModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
                        >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Audit Dossier</span>
                        </button>

                        {/* Virtual Hardware Twin Simulator Direct Link */}
                        <Link
                            href="/analyzers/simulator"
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
                            title="Open Virtual Laboratory Analyzer & Hardware Digital Twin Simulator"
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Hardware Twin</span>
                        </Link>

                        {/* Role Switcher */}
                        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
                            <Shield className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
                            {(['LAB_DIRECTOR', 'PATHOLOGIST', 'LAB_TECHNICIAN'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => {
                                        audioSynth.playTactileClick();
                                        actions.setActiveRole(role);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                                        state.activeRole === role
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {role === 'LAB_DIRECTOR' ? 'DIRECTOR' : role === 'PATHOLOGIST' ? 'PATHOLOGIST' : 'TECH'}
                                </button>
                            ))}
                        </div>

                        {/* Sound Toggle */}
                        <button
                            onClick={handleToggleSound}
                            className={`p-2 rounded-lg border transition-all ${
                                state.isSoundMuted
                                    ? 'bg-slate-900 border-slate-800 text-slate-500'
                                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            }`}
                            title={state.isSoundMuted ? 'Telemetry Audio Muted' : 'Telemetry Audio Live'}
                        >
                            {state.isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={handleToggleFullscreen}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                            title="Toggle Fullscreen Operations Display"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* ========================================================================= */}
            {/* CONSOLIDATED 5 PRIMARY DOMAIN PILLARS & INSTANT SUB-TAB PILLS NAVIGATION */}
            {/* ========================================================================= */}
            <nav className="sticky top-[58px] z-40 border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-md px-6 py-2 transition-all">
                <div className="max-w-[1780px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-3">
                    {/* The 5 Domain Pillars */}
                    <div className="flex items-center gap-1.5 w-full md:w-auto">
                        {DOMAIN_PILLARS.map((pillar) => {
                            const isPillarActive = state.activeDomain === pillar.id;
                            const pillarIcons: Record<number, any> = {
                                1: Compass,
                                2: Cpu,
                                3: ShieldCheck,
                                4: GitBranch,
                                5: BarChart3,
                            };
                            const IconComponent = pillarIcons[pillar.id] || Compass;

                            return (
                                <button
                                    key={pillar.id}
                                    onClick={() => {
                                        audioSynth.playTactileClick();
                                        actions.setActiveDomain(pillar.id);
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        isPillarActive
                                            ? 'bg-gradient-to-r from-cyan-950 to-slate-900 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                                    }`}
                                >
                                    <IconComponent className={`w-3.5 h-3.5 ${isPillarActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                    <span>{pillar.title}</span>
                                    <span className="text-[10px] font-mono opacity-60">
                                        ({pillar.tabs.length})
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Instant Sub-Tab Pills for the Active Domain (1-Click Access) */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
                        <span className="text-[10px] font-mono text-slate-500 uppercase px-2 font-bold hidden lg:inline">
                            Sub-Modules:
                        </span>
                        {activeDomainObj.tabs.map((t) => {
                            const isTabActive = state.activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        audioSynth.playTactileClick();
                                        actions.setActiveTab(t.id);
                                    }}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        isTabActive
                                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                                    }`}
                                >
                                    <span>{t.label}</span>
                                    {t.id === 'OVERVIEW' && <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">LIVE</span>}
                                    {t.id === 'WORLD_MODEL' && <span className="text-[9px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">3D</span>}
                                    {t.id === 'SPECIMEN_TRACKER' && <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300">{state.liveSpecimens.length}</span>}
                                    {t.id === 'FLEET_TELEMETRY' && <span className="text-[9px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">6 ANZ</span>}
                                    {t.id === 'AUTONOMY' && <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300">{state.proposals.length} PEND</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-md ${
                            notification.type === 'success'
                                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                                : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                        }`}
                    >
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <p className="text-xs font-medium leading-relaxed">{notification.message}</p>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-slate-400 hover:text-white ml-auto"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MAIN WORKSPACE VIEWPORT (ALL 15 SUB-MODULES WITH ZERO DEAD SPACE) */}
            {/* ========================================================================= */}
            <main className="flex-1 p-6 space-y-6 max-w-[1780px] mx-auto w-full">
                {/* --------------------------------------------------------------------- */}
                {/* 1.1 MISSION CONTROL (EXECUTIVE OVERVIEW) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'OVERVIEW' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Executive KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Daily Accession Intake</span>
                                    <ProvenanceBadge provenance="LIVE" />
                                </div>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-white tracking-tight">
                                        {state.kpis.dailyAccessions}
                                    </span>
                                    <span className="text-xs text-slate-400">specimens today</span>
                                </div>
                                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+14.2% intake vs 30-day baseline</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Median Turnaround Time (P50)</span>
                                    <ProvenanceBadge provenance="LIVE" />
                                </div>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-white tracking-tight">
                                        {state.kpis.medianTatMinutes.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-slate-400">min (P90: 54.2m)</span>
                                </div>
                                <div className="mt-2 text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3" />
                                    <span>ED STAT TAT: 18.2m • OP: 42.4m</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Predicted SLA Breach Risk</span>
                                    <ProvenanceBadge provenance="PREDICTED" />
                                </div>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className={`text-3xl font-extrabold tracking-tight ${state.kpis.predictedSlaBreachPct > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {state.kpis.predictedSlaBreachPct.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {state.kpis.predictedSlaBreachPct > 3 ? '2 active breaches' : '0 breaches active'}
                                    </span>
                                </div>
                                <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1 font-mono">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>
                                        {state.kpis.predictedSlaBreachPct > 3
                                            ? 'Biochemistry ISE queue approaching limit'
                                            : 'Rerouted worklist stabilized traffic'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Fleet Availability & Westgard</span>
                                    <ProvenanceBadge provenance="CONFIRMED" />
                                </div>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className={`text-3xl font-extrabold tracking-tight ${state.kpis.fleetAvailabilityPct === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {state.kpis.fleetAvailabilityPct.toFixed(0)}%
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {state.kpis.activeAnalyzersCount} / {state.kpis.totalAnalyzersCount} analyzers active
                                    </span>
                                </div>
                                <div className="mt-2 text-[11px] font-mono">
                                    {state.kpis.westgardViolationsCount > 0 ? (
                                        <span className="text-rose-400 flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            <span>Cobas #1 locked (Westgard 2_2s shift)</span>
                                        </span>
                                    ) : (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>All 6 fleet analyzers verified IN-CONTROL</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mid-Row: Active Specimen In-Flight Trackers (8 cols) & Controlled Autonomy Deck (4 cols) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Target className="w-4 h-4 text-cyan-400" />
                                            Active Specimen In-Flight Trackers
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Real-time biological sample tracking along Total Laboratory Automation (TLA) conveyor
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => actions.setActiveTab('SPECIMEN_TRACKER')}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                    >
                                        <span>View Manifest ({state.liveSpecimens.length})</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {state.liveSpecimens.slice(0, 5).map((carrier) => {
                                        const tubeColors: Record<string, string> = {
                                            LAVENDER_EDTA: 'bg-purple-500 text-white',
                                            GOLD_SST: 'bg-amber-400 text-slate-950',
                                            LIGHT_BLUE_CITRATE: 'bg-sky-400 text-slate-950',
                                            GREEN_HEPARIN: 'bg-emerald-500 text-white',
                                            GREY_FLUORIDE: 'bg-slate-400 text-slate-950',
                                        };
                                        const badgeClass = tubeColors[carrier.tubeColor] || 'bg-slate-600 text-white';

                                        return (
                                            <div
                                                key={carrier.carrierId}
                                                onClick={() => {
                                                    audioSynth.playTactileClick();
                                                    setInspectedCarrier(carrier);
                                                    actions.setActiveTab('SPECIMEN_TRACKER');
                                                }}
                                                className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer flex flex-wrap items-center justify-between gap-3 text-xs transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${badgeClass}`}>
                                                        {carrier.tubeColor.split('_')[0]}
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                                                            {carrier.barcode}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 block font-mono">
                                                            {carrier.patientUhid} • {carrier.tests[0]}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 font-mono text-xs">
                                                    <div>
                                                        <span className="text-[10px] text-slate-500 block">Zone</span>
                                                        <span className="text-cyan-300 font-semibold">{carrier.currentZoneName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-500 block">Elapsed</span>
                                                        <span className="text-white">{carrier.elapsedMinutes}m</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-500 block">Viability</span>
                                                        <span className={carrier.stabilityRemainingPct < 50 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                                            {carrier.stabilityRemainingPct}%
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                carrier.priority === 'STAT_EMERGENCY'
                                                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                                                    : 'bg-slate-800 text-slate-300'
                                                            }`}
                                                        >
                                                            {carrier.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Controlled Autonomy Deck Quick Actions (4 cols) */}
                            <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                            <GitBranch className="w-4 h-4 text-purple-400" />
                                            Controlled Autonomy Deck
                                        </h2>
                                        <ProvenanceBadge provenance="CONFIRMED" />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Human-in-the-loop failover routing & emergency load shed
                                    </p>
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                                    {state.proposals.length === 0 ? (
                                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                                            No pending autonomy proposals. All automated routing rules operating within nominal bounds.
                                        </div>
                                    ) : (
                                        state.proposals.map((prop) => (
                                            <div
                                                key={prop.id}
                                                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-white tracking-tight">{prop.title}</span>
                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        {prop.riskLevel}
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 text-[11px] leading-relaxed">{prop.reason}</p>
                                                <div className="text-[10px] text-emerald-400 font-mono">
                                                    Benefit: {prop.expectedBenefit}
                                                </div>

                                                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                                                    <span className="text-[10px] text-slate-500">
                                                        Sign-off: <span className="text-slate-300 font-semibold">{prop.requiredRole}</span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleRejectProposal(prop.id)}
                                                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleAuthorizeProposal(prop.id)}
                                                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-1"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Authorize
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Critical Clinical Delta-Checks (6 cols) & Pre-Analytical HIL Radar (6 cols) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Delta-Check Organ Injury Watch */}
                            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                                        <h2 className="text-sm font-bold text-white">Critical Clinical Delta-Checks</h2>
                                    </div>
                                    <ProvenanceBadge provenance="CONFIRMED" />
                                </div>

                                <div className="space-y-2.5">
                                    {state.deltaCheckAlerts.map((delta) => (
                                        <div
                                            key={delta.id}
                                            className="p-3.5 rounded-lg bg-slate-950 border border-rose-900/50 space-y-2 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-white">{delta.analyteName}</span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                    {delta.deltaPct > 0 ? `+${delta.deltaPct}%` : `${delta.deltaPct}%`} in {delta.elapsedHours}h
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                                                <span>Previous: <strong className="text-slate-400">{delta.previousValue} {delta.unit}</strong></span>
                                                <span>Current: <strong className="text-white">{delta.currentValue} {delta.unit}</strong></span>
                                                <span>Velocity: <strong className="text-rose-400">{delta.velocityPerHour > 0 ? `+${delta.velocityPerHour}` : delta.velocityPerHour}/h</strong></span>
                                            </div>
                                            <p className="text-[11px] text-rose-200/90 leading-relaxed bg-rose-950/30 p-2 rounded border border-rose-800/40">
                                                {delta.clinicalInterpretation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pre-Analytical HIL Interference Radar */}
                            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-amber-400" />
                                        <h2 className="text-sm font-bold text-white">Pre-Analytical HIL Interference Radar</h2>
                                    </div>
                                    <ProvenanceBadge provenance="LIVE" />
                                </div>

                                <div className="space-y-2.5">
                                    <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-900/50 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-white">Potassium (Serum ISE)</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                ACTION: REJECT_COLD_REDRAW
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                                            <span>Hemolysis: <strong className="text-rose-400">180 mg/dL (Cutoff: 50)</strong></span>
                                            <span>Icterus: <strong className="text-slate-400">8 mg/dL</strong></span>
                                            <span>Lipemia: <strong className="text-slate-400">45 NTU</strong></span>
                                        </div>
                                        <p className="text-[11px] text-amber-200/90 leading-relaxed bg-amber-950/30 p-2 rounded border border-amber-800/40">
                                            CRITICAL HEMOLYSIS: Free hemoglobin causes intracellular potassium leakage. Auto-verification blocked.
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-900/50 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-white">Total Bilirubin (Diazo Method)</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                ACTION: DILUTE_AND_RERUN
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                                            <span>Hemolysis: <strong className="text-slate-400">15 mg/dL</strong></span>
                                            <span>Icterus: <strong className="text-slate-400">4 mg/dL</strong></span>
                                            <span>Lipemia: <strong className="text-amber-400">420 NTU (Cutoff: 300)</strong></span>
                                        </div>
                                        <p className="text-[11px] text-amber-200/90 leading-relaxed bg-amber-950/30 p-2 rounded border border-amber-800/40">
                                            HIGH LIPEMIA TURBIDITY: Severe chylomicron scatter blocks 540nm absorbance. Perform high-speed ultracentrifugation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 1.2 2D/3D FLOOR TWIN (TLA SPATIAL WORLD MODEL) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'WORLD_MODEL' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Quaternary Laboratory Command Telemetry Cockpit Strip */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md text-xs font-mono">
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block">TOTAL TLA INFEED</span>
                                <strong className="text-white text-sm">1,620 tubes/hr</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block">MEDIAN TRANSIT TAT</span>
                                <strong className="text-cyan-300 text-sm">8.4 minutes</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block">ROTOR DYNAMICS (3.5k RPM)</span>
                                <strong className="text-emerald-400 text-sm">3,013 G (0.028 g·mm)</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block">AERIAL PNEUMATIC</span>
                                <strong className="text-lime-300 text-sm">10.2 m/s (1.4 bar)</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block">AMR AGVs PATROLLING</span>
                                <strong className="text-purple-300 text-sm">2 Units Active</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] text-slate-500 block">CORE CLEANROOM AIR</span>
                                <strong className="text-sky-300 text-sm">+15.2 Pa (ISO 7)</strong>
                            </div>
                        </div>

                        {/* Interactive 3D Canvas Digital Twin */}
                        <Virtual3DWorldModel
                            facilityName={
                                state.activeFacility === 'FACILITY-METRO-CORE'
                                    ? 'METROPOLITAN CENTRAL CORE REFERENCE LAB'
                                    : state.activeFacility === 'FACILITY-NORTH-STAT'
                                    ? 'NORTH PAVILION EMERGENCY STAT LAB'
                                    : state.activeFacility === 'FACILITY-WEST-CANCER'
                                    ? 'WESTSIDE REGIONAL CANCER CENTER'
                                    : 'SUBURBAN CLINIC ACCESSIONING HUB'
                            }
                            emergencyCode={state.emergencyCode}
                            onSelectWorkstation={(ws) => {
                                const found = state.fleet.find((a) => a.analyzerId === ws.id);
                                if (found) setInspectedAnalyzer(found);
                            }}
                            onSelectTube={(tube) => {
                                const found = state.liveSpecimens.find((c) => c.barcode === tube.barcode);
                                if (found) {
                                    setInspectedCarrier(found);
                                    actions.setActiveTab('SPECIMEN_TRACKER');
                                }
                            }}
                            onInjectStatSpecimen={(carrier) => {
                                actions.injectStatSpecimen(carrier);
                                setNotification({
                                    type: 'success',
                                    message: `STAT Express Tube ${carrier?.barcode || 'NEW'} injected onto MagneMotion track!`,
                                });
                            }}
                            onLaunchPneumatic={(capsule) => {
                                actions.launchPneumaticCapsule(capsule?.originWard || 'OR-03 Main Cardiac Theatre', 'Accessioning Hub');
                                setNotification({
                                    type: 'success',
                                    message: `Pneumatic Tube Capsule ${capsule?.id || 'STAT'} launched at 14.5 m/sec!`,
                                });
                            }}
                            onTriggerUvc={() => {
                                actions.triggerUvcDecontamination();
                                setNotification({
                                    type: 'success',
                                    message: 'Automated UV-C 254nm sterilization cycle active. Log-6 bio-burden decontamination.',
                                });
                            }}
                            onDispatchWorkOrder={(analyzerId, taskTitle) => {
                                const order = actions.dispatchWorkOrder(analyzerId, taskTitle, 'HIGH');
                                setNotification({
                                    type: 'success',
                                    message: `Biomedical Work Order ${order.workOrderId} logged and dispatched to Field Engineering.`,
                                });
                            }}
                        />


                        {/* Physical Departmental Workstation Matrices & Zone WIP */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Box className="w-4 h-4 text-cyan-400" />
                                    Physical Departmental Workstation Matrices & Zone WIP
                                </h3>
                                <ProvenanceBadge provenance="LIVE" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { code: 'REC-01', name: 'Patient Reception & Registration', wip: 12, cap: 120, util: 45, status: 'OPTIMAL', anz: [] },
                                    { code: 'ACC-01', name: 'Phlebotomy & Accessioning Hub', wip: 24, cap: 160, util: 68, status: 'OPTIMAL', anz: [] },
                                    { code: 'HEM-CORE', name: 'Core Hematology Suite', wip: 28, cap: 200, util: 72, status: 'OPTIMAL', anz: ['ANZ-HEM-01'] },
                                    { code: 'BIO-CORE', name: 'High-Volume Biochemistry Suite', wip: 54, cap: 320, util: 88, status: state.fleet.find(a => a.analyzerId === 'ANZ-BIO-01')?.status === 'ONLINE' ? 'OPTIMAL' : 'ELEVATED', anz: ['ANZ-BIO-01', 'ANZ-BIO-02'] },
                                    { code: 'IMM-CORE', name: 'Chemiluminescence Immunoassay', wip: 22, cap: 200, util: 62, status: 'OPTIMAL', anz: ['ANZ-IMM-01'] },
                                    { code: 'COAG-CORE', name: 'STAT Coagulation & Hemostasis', wip: 18, cap: 120, util: 65, status: 'OPTIMAL', anz: ['ANZ-COAG-01'] },
                                    { code: 'MICRO-CORE', name: 'Automated Microbiology & Blood Culture', wip: 14, cap: 40, util: 55, status: 'OPTIMAL', anz: ['ANZ-MICRO-01'] },
                                    { code: 'ARC-01', name: 'Robotic Specimen Archive (4°C)', wip: 420, cap: 600, util: 70, status: 'OPTIMAL', anz: [] },
                                ].map((zone) => {
                                    const isSelected = selectedZoneId === zone.code;
                                    return (
                                        <div
                                            key={zone.code}
                                            onClick={() => {
                                                audioSynth.playTactileClick();
                                                setSelectedZoneId(zone.code);
                                            }}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-slate-850 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-102'
                                                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                    {zone.code}
                                                </span>
                                                <span
                                                    className={`w-3 h-3 rounded-full ${
                                                        zone.status === 'OPTIMAL'
                                                            ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                                                            : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                                                    }`}
                                                />
                                            </div>

                                            <h3 className="text-xs font-bold text-white mt-2.5 group-hover:text-cyan-300 transition-colors">
                                                {zone.name}
                                            </h3>

                                            <div className="mt-3 space-y-1.5 text-[11px] font-mono text-slate-400">
                                                <div className="flex justify-between">
                                                    <span>Active WIP:</span>
                                                    <span className="text-white font-semibold">{zone.wip} samples</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Capacity:</span>
                                                    <span>{zone.cap}/h</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Utilization:</span>
                                                    <span className={zone.util >= 80 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                                        {zone.util}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 1.3 SPECIMEN RADAR (IN-FLIGHT MANIFEST & 12-COL SPLIT DRAWER) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'SPECIMEN_TRACKER' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left 8 Cols: Full Interactive Specimen Manifest Table */}
                            <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                                            <Target className="w-5 h-5 text-cyan-400" />
                                            Specimen In-Flight Radar & Tube Cap Manifest
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Real-time inventory of all accessioned biological specimens with live bio-stability kinetics
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            value={specimenFilterDept}
                                            onChange={(e) => setSpecimenFilterDept(e.target.value)}
                                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="ALL">All Departments</option>
                                            <option value="HEMATOLOGY">Hematology</option>
                                            <option value="BIOCHEMISTRY">Biochemistry</option>
                                            <option value="IMMUNOASSAY">Immunoassay</option>
                                            <option value="COAGULATION">Coagulation</option>
                                        </select>
                                        <ProvenanceBadge provenance="LIVE" />
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                                            <tr>
                                                <th className="p-3">Cap / Matrix</th>
                                                <th className="p-3">Barcode / UHID</th>
                                                <th className="p-3">Assay Panel</th>
                                                <th className="p-3">Current Zone</th>
                                                <th className="p-3">Transit Time</th>
                                                <th className="p-3">Bio-Stability</th>
                                                <th className="p-3">Priority</th>
                                                <th className="p-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 font-mono">
                                            {state.liveSpecimens
                                                .filter((c) => specimenFilterDept === 'ALL' || c.department === specimenFilterDept)
                                                .map((carrier) => {
                                                    const tubeColors: Record<string, string> = {
                                                        LAVENDER_EDTA: 'bg-purple-500 text-white',
                                                        GOLD_SST: 'bg-amber-400 text-slate-950',
                                                        LIGHT_BLUE_CITRATE: 'bg-sky-400 text-slate-950',
                                                        GREEN_HEPARIN: 'bg-emerald-500 text-white',
                                                        GREY_FLUORIDE: 'bg-slate-400 text-slate-950',
                                                    };
                                                    const badgeClass = tubeColors[carrier.tubeColor] || 'bg-slate-600 text-white';
                                                    const isSelected = inspectedCarrier?.carrierId === carrier.carrierId;

                                                    return (
                                                        <tr
                                                            key={carrier.carrierId}
                                                            onClick={() => {
                                                                audioSynth.playTactileClick();
                                                                setInspectedCarrier(carrier);
                                                            }}
                                                            className={`cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                                                                    : 'hover:bg-slate-900/50'
                                                            }`}
                                                        >
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                                                                    {carrier.tubeColor.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="font-bold text-white">{carrier.barcode}</div>
                                                                <div className="text-[10px] text-slate-400">{carrier.patientUhid}</div>
                                                            </td>
                                                            <td className="p-3 text-slate-300">
                                                                {carrier.tests.join(', ')}
                                                            </td>
                                                            <td className="p-3 text-cyan-300 font-semibold">
                                                                {carrier.currentZoneName}
                                                            </td>
                                                            <td className="p-3 text-white">
                                                                {carrier.elapsedMinutes}m / {carrier.maxStabilityMinutes}m max
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${
                                                                                carrier.stabilityRemainingPct < 50
                                                                                    ? 'bg-rose-500'
                                                                                    : carrier.stabilityRemainingPct < 80
                                                                                    ? 'bg-amber-400'
                                                                                    : 'bg-emerald-400'
                                                                            }`}
                                                                            style={{ width: `${carrier.stabilityRemainingPct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={carrier.stabilityRemainingPct < 50 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                                                        {carrier.stabilityRemainingPct}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        carrier.priority === 'STAT_EMERGENCY'
                                                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                                                            : 'bg-slate-800 text-slate-300'
                                                                    }`}
                                                                >
                                                                    {carrier.priority}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        audioSynth.playTactileClick();
                                                                        setInspectedCarrier(carrier);
                                                                    }}
                                                                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                                                        isSelected
                                                                            ? 'bg-cyan-600 text-white border-cyan-500'
                                                                            : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700'
                                                                    }`}
                                                                >
                                                                    Inspect Dossier
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right 4 Cols: Live Specimen Molecular & Chain-of-Custody Dossier (Zero Dead Space!) */}
                            <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <FlaskConical className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-sm font-bold text-white">Live Specimen Kinetic Dossier</h3>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                        ISO 15189 §7.4
                                    </span>
                                </div>

                                {inspectedCarrier ? (
                                    <div className="space-y-4 text-xs font-mono">
                                        {/* Specimen Header Card */}
                                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-cyan-300">{inspectedCarrier.barcode}</span>
                                                <span className="text-slate-400 font-semibold">{inspectedCarrier.patientUhid}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-300">
                                                Tube: <strong className="text-white">{inspectedCarrier.tubeLabel}</strong>
                                            </div>
                                            <div className="text-[11px] text-slate-300">
                                                Panel: <strong className="text-cyan-400">{inspectedCarrier.tests.join(', ')}</strong>
                                            </div>
                                        </div>

                                        {/* Physical & Thermal Kinetics */}
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                                <span className="text-[10px] text-slate-500 block">Current Location</span>
                                                <strong className="text-white text-xs">{inspectedCarrier.currentZoneName}</strong>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                                <span className="text-[10px] text-slate-500 block">Viability Remaining</span>
                                                <strong className={inspectedCarrier.stabilityRemainingPct < 50 ? 'text-rose-400 text-xs' : 'text-emerald-400 text-xs'}>
                                                    {inspectedCarrier.stabilityRemainingPct}%
                                                </strong>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                                <span className="text-[10px] text-slate-500 block">Elapsed Transit</span>
                                                <strong className="text-cyan-300 text-xs">{inspectedCarrier.elapsedMinutes} min</strong>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                                <span className="text-[10px] text-slate-500 block">Max Window</span>
                                                <strong className="text-slate-300 text-xs">{inspectedCarrier.maxStabilityMinutes} min</strong>
                                            </div>
                                        </div>

                                        {/* Real-World Chain of Custody Audit Trail */}
                                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                                            <span className="text-[11px] font-bold text-slate-200 block border-b border-slate-800 pb-1">
                                                Chain-of-Custody Audit Log:
                                            </span>
                                            <div className="space-y-1.5 text-[10px] text-slate-400">
                                                <div className="flex items-center gap-1.5 text-emerald-400">
                                                    <Check className="w-3 h-3" />
                                                    <span>14:10 IST: Venipuncture logged at Phlebotomy Station #2</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-400">
                                                    <Check className="w-3 h-3" />
                                                    <span>14:18 IST: Pneumatic Tube Infeed arrival at Core Accessioning</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-400">
                                                    <Check className="w-3 h-3" />
                                                    <span>14:24 IST: Centrifugation verified (3,000 G, 10 min, 20°C)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-400">
                                                    <Check className="w-3 h-3" />
                                                    <span>14:36 IST: Spectrophotometric HIL profile scanned (Clear)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-cyan-300">
                                                    <Radio className="w-3 h-3 animate-pulse" />
                                                    <span>CURRENT: Transit on High-Speed TLA Conveyor (1.25 m/s)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    audioSynth.playTactileClick();
                                                    actions.triggerSpecimenRerun(inspectedCarrier.barcode, 'REDRAW');
                                                    setNotification({
                                                        type: 'success',
                                                        message: `STAT Redraw Flag dispatched for specimen ${inspectedCarrier.barcode}.`,
                                                    });
                                                }}
                                                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-xs font-semibold border border-rose-500/40"
                                            >
                                                Flag Redraw
                                            </button>
                                            <button
                                                onClick={() => {
                                                    audioSynth.playStatChime();
                                                    setNotification({
                                                        type: 'success',
                                                        message: `Specimen ${inspectedCarrier.barcode} expedited to STAT fast-lane routing.`,
                                                    });
                                                }}
                                                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
                                            >
                                                Prioritize STAT
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                                        Select any tube in the manifest table to view live molecular dossier.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 2.1 FLEET TELEMETRY (6 ANALYZER DIAGNOSTIC GRID) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'FLEET_TELEMETRY' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                            <div>
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-cyan-400" />
                                    Clinical Analyzer Fleet Diagnostic Telemetry (6 Instruments)
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Real-time onboard reagents, chamber temperatures, optical diode hours, and Weibull RUL prognostics
                                </p>
                            </div>
                            <ProvenanceBadge provenance="LIVE" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {state.fleet.map((anz) => (
                                <div
                                    key={anz.analyzerId}
                                    className={`p-5 rounded-xl bg-slate-900/90 border transition-all space-y-4 ${
                                        anz.status === 'LOCKED_WESTGARD_VIOLATION'
                                            ? 'border-rose-600/90 shadow-xl shadow-rose-950/50 ring-1 ring-rose-500/50'
                                            : 'border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{anz.name}</h3>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                {anz.manufacturer} • {anz.serialNumber}
                                            </span>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                                anz.status === 'ONLINE'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                                            }`}
                                        >
                                            {anz.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                                        <div>Throughput: <strong className="text-white">{anz.currentThroughputRealtime} / {anz.throughputNominalPerHour}h</strong></div>
                                        <div>Queue Depth: <strong className="text-cyan-300">{anz.currentQueueDepth} racks</strong></div>
                                        <div>Lamp Hours: <strong className="text-slate-300">{anz.opticalLampHours}h</strong></div>
                                        <div>Chamber Temp: <strong className="text-emerald-400">{anz.chamberTemperatureCelsius}°C</strong></div>
                                        <div>Vacuum Press: <strong className="text-slate-300">{anz.vacuumPressureKpa} kPa</strong></div>
                                        <div>RUL Remaining: <strong className={anz.rulHours < 50 ? 'text-rose-400' : 'text-cyan-400'}>{anz.rulHours}h</strong></div>
                                    </div>

                                    {/* Reagents list */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                                            Onboard Reagent Packs ({anz.reagentPacks.length})
                                        </span>
                                        {anz.reagentPacks.map((pack, pIdx) => (
                                            <div key={pIdx} className="text-xs bg-slate-950/70 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                                                <div>
                                                    <span className="text-slate-200 block font-semibold">{pack.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">Lot: {pack.lot}</span>
                                                </div>
                                                <div className="text-right font-mono">
                                                    <span className={pack.testsRemaining <= pack.lowThreshold ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                                        {pack.testsRemaining} tests
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 block">Exp: {pack.expiry}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                        {anz.status === 'LOCKED_WESTGARD_VIOLATION' && (
                                            <button
                                                onClick={() => handleRecalibration(anz.analyzerId)}
                                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-rose-600/30"
                                            >
                                                <Wrench className="w-3 h-3" />
                                                Recalibrate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                audioSynth.playTactileClick();
                                                setInspectedAnalyzer(anz);
                                            }}
                                            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 ml-auto"
                                        >
                                            <Activity className="w-3.5 h-3.5" />
                                            <span>Subsystem Diagnostics & Frames</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Biomedical Engineering & Maintenance Work Orders Console */}
                        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Wrench className="w-4 h-4 text-cyan-400" />
                                        Hospital Biomedical Engineering (BME) Active Work Orders ({state.workOrders.length})
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Direct ISO 15189 compliance log, preventative maintenance tickets, and optical baseline recalibrations
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const order = actions.dispatchWorkOrder('ANZ-BIO-01', 'Electrode 2-Point Calibrator Run', 'HIGH');
                                        audioSynth.playStatChime();
                                        setNotification({
                                            type: 'success',
                                            message: `Work Order ${order.workOrderId} created and assigned to Field Engineering Lead.`,
                                        });
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Dispatch New Work Order</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                {state.workOrders.map((order) => (
                                    <div
                                        key={order.workOrderId}
                                        className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-cyan-300">{order.workOrderId}</span>
                                                <span className="text-slate-400">• {order.analyzerName}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    order.priority === 'EMERGENCY_STAT'
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                        : 'bg-slate-800 text-slate-300'
                                                }`}>
                                                    {order.priority}
                                                </span>
                                            </div>
                                            <p className="text-slate-200 text-xs font-sans font-medium">{order.taskTitle}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">ASSIGNED ENGINEER</span>
                                                <span className="text-slate-300 text-xs">{order.assignedEngineer}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                order.status === 'COMPLETED_VERIFIED'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* --------------------------------------------------------------------- */}
                {/* 2.2 QUEUEING & LITTLE'S LAW (ERLANG-C WORKBENCH & SATURATION CURVE) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'QUEUES' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-cyan-400" />
                                        Stochastic Queueing Theory & Little&apos;s Law WIP Workbench
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Multi-server Erlang-C delay calculations and Work-in-Progress conservation (L = λ · W)
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            {/* Department Queue Table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                                        <tr>
                                            <th className="p-3.5">Department</th>
                                            <th className="p-3.5">Channels (c)</th>
                                            <th className="p-3.5">Arrival Rate (λ)</th>
                                            <th className="p-3.5">Intensity (ρ)</th>
                                            <th className="p-3.5">Queue WIP (L_q)</th>
                                            <th className="p-3.5">Mean Total TAT (W)</th>
                                            <th className="p-3.5">Erlang-C Delay P(wait)</th>
                                            <th className="p-3.5">Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono">
                                        {state.departmentQueues.map((q) => (
                                            <tr key={q.department} className="hover:bg-slate-900/50">
                                                <td className="p-3.5 font-bold text-white">{q.department}</td>
                                                <td className="p-3.5 text-slate-300">{q.activeChannels} channels</td>
                                                <td className="p-3.5 text-slate-300">{q.arrivalRateLambdaPerHour}/h</td>
                                                <td className="p-3.5">
                                                    <span className={q.trafficIntensityRho >= 0.85 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                                        {(q.trafficIntensityRho * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-white font-semibold">{q.workInProgressL} tubes</td>
                                                <td className="p-3.5 text-cyan-300">{q.meanTotalTatWMinutes} min</td>
                                                <td className="p-3.5 text-slate-300">{(q.erlangCWaitProbability * 100).toFixed(1)}%</td>
                                                <td className="p-3.5">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            q.bottleneckSeverity === 'OPTIMAL'
                                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                                : 'bg-amber-500/20 text-amber-300'
                                                        }`}
                                                    >
                                                        {q.bottleneckSeverity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bottom 12-Col Grid: Left Calculator (5 cols) + Right Saturation Chart (7 cols) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Interactive Erlang-C Delay Calculator
                                    </h3>
                                    <div className="space-y-3 text-xs font-mono">
                                        <div>
                                            <label className="text-slate-400 block mb-1">Arrival Rate λ (tubes/hr):</label>
                                            <input
                                                type="number"
                                                value={queueLambda}
                                                onChange={(e) => setQueueLambda(Number(e.target.value))}
                                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-slate-400 block mb-1">Service Rate μ (per channel/hr):</label>
                                            <input
                                                type="number"
                                                value={queueMu}
                                                onChange={(e) => setQueueMu(Number(e.target.value))}
                                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-slate-400 block mb-1">Parallel Channels c:</label>
                                            <input
                                                type="number"
                                                value={queueChannels}
                                                onChange={(e) => setQueueChannels(Number(e.target.value))}
                                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-center">
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Utilization (ρ)</span>
                                            <strong className={Number(erlangCMetrics.rho) >= 85 ? 'text-rose-400' : 'text-emerald-400'}>
                                                {erlangCMetrics.rho}%
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Delay Prob P(wait)</span>
                                            <strong className="text-amber-400">{erlangCMetrics.pWait}%</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Queue Wait (W_q)</span>
                                            <strong className="text-white">{erlangCMetrics.wqMinutes} min</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Total WIP (L = λ · W)</span>
                                            <strong className="text-cyan-300">{erlangCMetrics.wipL} specimens</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Right 7 Cols: Queue Saturation Curve (Fills Dead Space!) */}
                                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Erlang-C Delay Inflection & Saturation Curve
                                        </h3>
                                        <span className="text-[10px] font-mono text-cyan-400">
                                            Current ρ = {erlangCMetrics.rho}%
                                        </span>
                                    </div>

                                    {/* SVG Saturation Curve */}
                                    <div className="h-56 w-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 relative flex flex-col justify-end">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
                                            {/* Grid lines */}
                                            <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="4" />
                                            <line x1="40" y1="80" x2="380" y2="80" stroke="#1e293b" strokeDasharray="4" />
                                            <line x1="40" y1="140" x2="380" y2="140" stroke="#334155" />
                                            <line x1="40" y1="20" x2="40" y2="140" stroke="#334155" />

                                            {/* Critical 85% utilization line */}
                                            <line x1="329" y1="20" x2="329" y2="140" stroke="#f43f5e" strokeDasharray="3" strokeWidth="1.5" />
                                            <text x="332" y="32" fill="#f43f5e" fontSize="9" fontFamily="monospace">ρ = 85% Critical</text>

                                            {/* Erlang C Exponential Saturation Curve */}
                                            <path
                                                d="M 40 138 Q 200 135, 280 120 T 340 70 T 375 25"
                                                fill="none"
                                                stroke="#06b6d4"
                                                strokeWidth="2.5"
                                            />

                                            {/* Active operating point */}
                                            {(() => {
                                                const rhoNum = Math.min(99, Math.max(10, parseFloat(erlangCMetrics.rho) || 50));
                                                const cx = 40 + (rhoNum / 100) * 340;
                                                const cy = 138 - Math.pow(rhoNum / 100, 3) * 115;
                                                return (
                                                    <g>
                                                        <circle cx={cx} cy={cy} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                                                        <text x={cx - 20} y={cy - 12} fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                                                            {erlangCMetrics.rho}%
                                                        </text>
                                                    </g>
                                                );
                                            })()}
                                        </svg>
                                        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                                            <span>0% Load</span>
                                            <span>50% Load</span>
                                            <span>85% Inflection</span>
                                            <span>100% Saturation</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                                        Nonlinear delay buildup occurs past 80% channel traffic intensity. Once ρ &gt; 85%, wait time escalates exponentially, mandating controlled routing or preemption.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 2.3 REAGENT STOCKOUT RADAR (SUPPLY HORIZON & LIVE ERP PO QUEUE) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'INVENTORY' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Database className="w-5 h-5 text-cyan-400" />
                                        Reagent Supply Chain & Stockout Horizon Radar
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Predictive reagent exhaustion horizons based on real-time accession velocities
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="PREDICTED" />
                            </div>

                            {/* Top 3 Predictive Horizon Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {state.reagentAlerts.map((rgt) => (
                                    <div
                                        key={rgt.reagentId}
                                        className={`p-5 rounded-xl bg-slate-950 border space-y-3 ${
                                            rgt.stockoutRisk === 'CRITICAL_DEPLETION_RISK'
                                                ? 'border-rose-600/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                                                : 'border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xs font-bold text-white">{rgt.reagentName}</h3>
                                                <span className="text-[10px] text-slate-500 font-mono">{rgt.analyzerName}</span>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                                    rgt.stockoutRisk === 'CRITICAL_DEPLETION_RISK'
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                                        : 'bg-emerald-500/20 text-emerald-300'
                                                }`}
                                            >
                                                {rgt.stockoutRisk.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                            <div className="flex justify-between">
                                                <span>Tests Remaining:</span>
                                                <strong className={rgt.testsRemaining <= rgt.safetyStockThreshold ? 'text-rose-400' : 'text-white'}>
                                                    {rgt.testsRemaining} tests
                                                </strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Stock Horizon:</span>
                                                <strong className={rgt.daysOfStockRemaining < 2 ? 'text-rose-400 font-bold' : 'text-cyan-300'}>
                                                    {rgt.daysOfStockRemaining} days
                                                </strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Reorder Lead Time:</span>
                                                <span>{rgt.reorderLeadTimeDays} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Recommended Order:</span>
                                                <span className="text-amber-400 font-semibold">{rgt.recommendedReorderDate}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => handleGeneratePo(rgt.reagentId)}
                                                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                <span>Generate PO Requisition</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom Half: Live Consumption Velocity & Automated ERP Purchase Order Queue */}
                            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileCheck2 className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Live Consumption Velocity & Automated ERP Purchase Order Queue
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        Active POs: {state.purchaseOrders.length}
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                                            <tr>
                                                <th className="p-3">PO Number</th>
                                                <th className="p-3">Reagent Item</th>
                                                <th className="p-3">Target Instrument</th>
                                                <th className="p-3">Packs Qty</th>
                                                <th className="p-3">Total Amount</th>
                                                <th className="p-3">Delivery SLA</th>
                                                <th className="p-3">ERP Status</th>
                                                <th className="p-3 text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {state.purchaseOrders.map((po) => (
                                                <tr key={po.poNumber} className="hover:bg-slate-900/40">
                                                    <td className="p-3 font-bold text-cyan-300">{po.poNumber}</td>
                                                    <td className="p-3 text-white">{po.reagentName}</td>
                                                    <td className="p-3 text-slate-400">{po.analyzerName}</td>
                                                    <td className="p-3 text-white">{po.quantityPacks} packs</td>
                                                    <td className="p-3 text-emerald-400 font-semibold">${po.totalAmountUsd.toLocaleString()}</td>
                                                    <td className="p-3 text-slate-300">{po.expectedDeliveryDays} days</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            {po.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right text-slate-400 text-[11px]">
                                                        {new Date(po.timestamp).toLocaleTimeString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 3.1 LEVEY-JENNINGS & CUSUM DRIFT RADAR */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'QUALITY' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                                        Levey-Jennings Statistical Quality Control & CUSUM Drift Radar
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Systematic shift & drift detection across multi-level control lots (Westgard 1-3s, 2-2s, R-4s, 4-1s, 10x rules)
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            {/* Levey-Jennings Graph Container */}
                            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
                                    <span>Analyte: Potassium (Serum ISE) • Instrument: Roche Cobas Pro c503 #1</span>
                                    <span>Lot: LOT-K-8842 • Target Mean: 4.20 mmol/L • SD: 0.12 mmol/L</span>
                                </div>

                                {/* Graph Canvas */}
                                <div className="h-56 w-full relative flex items-center justify-between px-6 border-y border-slate-800/60 my-6">
                                    <div className="absolute inset-x-0 top-[10%] border-b border-rose-500/40 border-dashed text-[10px] text-rose-400 pl-2">
                                        +3 SD (4.56) [1-3s Action Limit]
                                    </div>
                                    <div className="absolute inset-x-0 top-[25%] border-b border-amber-500/40 border-dashed text-[10px] text-amber-400 pl-2">
                                        +2 SD (4.44) [Warning Limit]
                                    </div>
                                    <div className="absolute inset-x-0 top-[50%] border-b border-cyan-500/80 text-[10px] text-cyan-300 pl-2">
                                        Mean (4.20) [Target Homeostasis]
                                    </div>
                                    <div className="absolute inset-x-0 top-[75%] border-b border-amber-500/40 border-dashed text-[10px] text-amber-400 pl-2">
                                        -2 SD (3.96) [Warning Limit]
                                    </div>
                                    <div className="absolute inset-x-0 top-[90%] border-b border-rose-500/40 border-dashed text-[10px] text-rose-400 pl-2">
                                        -3 SD (3.84) [1-3s Action Limit]
                                    </div>

                                    {/* Data Points */}
                                    {[4.21, 4.19, 4.22, 4.25, 4.28, 4.31, 4.34, 4.39, 4.42, 4.46].map((val, idx) => {
                                        const z = (val - 4.20) / 0.12;
                                        const topPct = 50 - (z / 3) * 40;
                                        const isViolating = Math.abs(z) > 2.0;
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                                                style={{ left: `${(idx + 1) * 9}%`, top: `${topPct}%` }}
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 ${
                                                        isViolating
                                                            ? 'bg-rose-500 border-white shadow-lg shadow-rose-500/50'
                                                            : 'bg-cyan-500 border-slate-900'
                                                    }`}
                                                />
                                                <div className="absolute -top-6 hidden group-hover:block px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-white font-mono whitespace-nowrap z-20">
                                                    Run #{idx + 1}: {val} mmol/L (Z = {z > 0 ? `+${z.toFixed(2)}` : z.toFixed(2)})
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 pt-3 border-t border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <span className="text-rose-400 font-bold flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>ACTIVE BREACH: Westgard 2_2s & Tabular CUSUM (h = 4.2 &gt; 4.0)</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRecalibration('ANZ-BIO-01')}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>Schedule 3-Point Recalibration</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Interactive Clinical Graphs Studio */}
                        <AdvancedClinicalGraphs
                            analyteCode="K_SERUM"
                            targetMean={4.20}
                            targetSd={0.12}
                            initialTab="LEVEY_JENNINGS_CUSUM"
                        />
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 3.2 HIL INTERFERENCE (CLSI EP07-A2 SPECTROPHOTOMETRIC RADAR) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'HIL_RADAR' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Flame className="w-5 h-5 text-amber-400" />
                                        Spectrophotometric HIL Interference Radar (CLSI EP07-A2)
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Real-time Hemolysis, Icterus, and Lipemia index absorption curves with clinical bias gating
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="LIVE" />
                            </div>

                            {/* Top Split: Left Simulator + Right Bias Assessment */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Left 5 Cols: Interactive HIL Gating Simulator */}
                                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Interactive HIL Gating Simulator
                                    </h3>

                                    <div className="space-y-4 text-xs font-mono">
                                        <div>
                                            <label className="text-slate-300 block mb-1">Target Analyte:</label>
                                            <select
                                                value={state.hilSimulator.analyteCode}
                                                onChange={(e) => actions.updateHilSimulator({ analyteCode: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-cyan-300 focus:outline-none"
                                            >
                                                <option value="K_SERUM">Potassium (Serum ISE) [Cutoff: 50 mg/dL]</option>
                                                <option value="TROPONIN_I">High-Sensitivity Troponin-I [Cutoff: 200 mg/dL]</option>
                                                <option value="GLUCOSE">Glucose (Hexokinase) [Cutoff: 500 mg/dL]</option>
                                                <option value="ALT">Alanine Aminotransferase (ALT) [Cutoff: 100 mg/dL]</option>
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-slate-400">
                                                <span>Hemolysis Index (570/600nm):</span>
                                                <strong className={state.hilSimulator.hemolysisMgDl >= 50 ? 'text-rose-400' : 'text-slate-200'}>
                                                    {state.hilSimulator.hemolysisMgDl} mg/dL
                                                </strong>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={500}
                                                value={state.hilSimulator.hemolysisMgDl}
                                                onChange={(e) => actions.updateHilSimulator({ hemolysis: Number(e.target.value) })}
                                                className="w-full accent-rose-500 mt-1 cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-slate-400">
                                                <span>Icterus Index (480/505nm):</span>
                                                <strong className="text-slate-200">{state.hilSimulator.icterusMgDl} mg/dL</strong>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={40}
                                                value={state.hilSimulator.icterusMgDl}
                                                onChange={(e) => actions.updateHilSimulator({ icterus: Number(e.target.value) })}
                                                className="w-full accent-amber-500 mt-1 cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-slate-400">
                                                <span>Lipemia Index (660/700nm):</span>
                                                <strong className="text-slate-200">{state.hilSimulator.lipemiaTurbidity} NTU</strong>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={600}
                                                value={state.hilSimulator.lipemiaTurbidity}
                                                onChange={(e) => actions.updateHilSimulator({ lipemia: Number(e.target.value) })}
                                                className="w-full accent-sky-500 mt-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right 7 Cols: Interference Bias Assessment */}
                                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Interference Bias Assessment
                                        </h3>
                                        <span
                                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                state.hilSimulator.clsiAction === 'AUTOVERIFICATION_BLOCKED_REJECT'
                                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                                    : state.hilSimulator.clsiAction === 'FLAG_INTERPRETIVE_NOTE'
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            }`}
                                        >
                                            {state.hilSimulator.clsiAction}
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Calculated Percentage Bias (Δ%):</span>
                                            <span className={state.hilSimulator.calculatedBiasPct > 5 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                                                +{state.hilSimulator.calculatedBiasPct}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">CLSI EP07-A2 Action:</span>
                                            <span className="text-cyan-300 font-semibold">
                                                {state.hilSimulator.clsiAction}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                                            {state.hilSimulator.clinicalAdvisoryText}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Split: Pre-Analytical HIL Specimen Hold Queue (Eliminating Dead Space!) */}
                            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Pre-Analytical HIL Specimen Hold Queue (Direct Laboratory Interventions)
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">2 Samples On Hold</span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                                            <tr>
                                                <th className="p-3">Sample Barcode</th>
                                                <th className="p-3">Patient UHID</th>
                                                <th className="p-3">Target Analyte</th>
                                                <th className="p-3">HIL Optical Reading</th>
                                                <th className="p-3">Prescribed CLSI Action</th>
                                                <th className="p-3 text-right">Laboratory Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            <tr className="hover:bg-slate-900/40">
                                                <td className="p-3 font-bold text-cyan-300">LC-BC-901844</td>
                                                <td className="p-3 text-white">UHID-DL-2026-4002</td>
                                                <td className="p-3 text-white">Potassium (Serum ISE)</td>
                                                <td className="p-3 text-rose-400 font-semibold">Hemolysis: 180 mg/dL (Cutoff: 50)</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                        REJECT_COLD_REDRAW
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => {
                                                            audioSynth.playTactileClick();
                                                            actions.triggerSpecimenRerun('LC-BC-901844', 'REDRAW');
                                                            setNotification({
                                                                type: 'success',
                                                                message: 'Cold redraw requisition transmitted to ward for LC-BC-901844.',
                                                            });
                                                        }}
                                                        className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                                                    >
                                                        Execute Cold Redraw
                                                    </button>
                                                </td>
                                            </tr>

                                            <tr className="hover:bg-slate-900/40">
                                                <td className="p-3 font-bold text-cyan-300">LC-BC-901847</td>
                                                <td className="p-3 text-white">UHID-DL-2026-4007</td>
                                                <td className="p-3 text-white">Total Bilirubin (Diazo)</td>
                                                <td className="p-3 text-amber-400 font-semibold">Lipemia: 420 NTU (Cutoff: 300)</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                        DILUTE_AND_RERUN
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => {
                                                            audioSynth.playStatChime();
                                                            actions.triggerSpecimenRerun('LC-BC-901847', 'DILUTE_ULTRACENTRIFUGE');
                                                            setNotification({
                                                                type: 'success',
                                                                message: 'Sample LC-BC-901847 routed to high-speed ultracentrifuge (10,000 G, 15m) for lipid clearing.',
                                                            });
                                                        }}
                                                        className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                                                    >
                                                        Dilute & Ultracentrifuge
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 3.3 ARRHENIUS BIO-STABILITY (CHEMICAL KINETICS & THERMAL RADAR) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'STABILITY' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Thermometer className="w-5 h-5 text-cyan-400" />
                                        Arrhenius Chemical Kinetics & Thermal Bio-Stability Radar
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        First-principles degradation rate acceleration under ambient temperature excursions: k(T) = k_ref · exp[(Ea / R) · (1/T_ref - 1/T)]
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Thermal Excursion Simulator
                                    </h3>

                                    <div className="space-y-4 text-xs font-mono">
                                        <div>
                                            <label className="text-slate-300 block mb-1">Target Analyte Matrix:</label>
                                            <select
                                                value={arrheniusAnalyte}
                                                onChange={(e) => setArrheniusAnalyte(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-cyan-300 focus:outline-none"
                                            >
                                                <option value="K_SERUM">Potassium (Whole Blood / Serum) [Ea/R = 4,200 K]</option>
                                                <option value="GLUCOSE">Glucose (Serum without Fluoride) [Ea/R = 5,400 K]</option>
                                                <option value="LACTATE">Lactate (Heparin Plasma) [Ea/R = 6,100 K]</option>
                                                <option value="AMMONIA">Ammonia (EDTA Plasma on Ice) [Ea/R = 6,500 K]</option>
                                                <option value="TROPONIN_I">Cardiac Troponin-I [Ea/R = 3,800 K]</option>
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-slate-400">
                                                <span>Ambient Exposure Temp (T):</span>
                                                <strong className={arrheniusTempC > 25 ? 'text-rose-400' : 'text-white'}>
                                                    {arrheniusTempC}°C ({273.15 + arrheniusTempC} K)
                                                </strong>
                                            </div>
                                            <input
                                                type="range"
                                                min={4}
                                                max={37}
                                                value={arrheniusTempC}
                                                onChange={(e) => setArrheniusTempC(Number(e.target.value))}
                                                className="w-full accent-cyan-500 mt-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Arrhenius Degradation Metrics
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Rate Acceleration</span>
                                            <strong className="text-rose-400 text-base">{arrheniusMetrics.multiplier}x</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Active Rate (k)</span>
                                            <strong className="text-white text-base">{arrheniusMetrics.activeRatePerHour}/h</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Degradation in 4h</span>
                                            <strong className="text-amber-400 text-base">{arrheniusMetrics.lossIn4HoursPct}%</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Half-Life at T</span>
                                            <strong className="text-cyan-300 text-base">{arrheniusMetrics.halfLifeHours}h</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Baseline 4°C Half-Life</span>
                                            <strong className="text-slate-300 text-base">{arrheniusMetrics.halfLifeRefHours}h</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[10px] block">Viability Status</span>
                                            <strong className={Number(arrheniusMetrics.lossIn4HoursPct) > 10 ? 'text-rose-400' : 'text-emerald-400'}>
                                                {Number(arrheniusMetrics.lossIn4HoursPct) > 10 ? 'CRITICAL EXCURSION' : 'STABLE'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shared Advanced Clinical Graphs Studio View */}
                        <AdvancedClinicalGraphs
                            analyteCode={arrheniusAnalyte}
                            targetMean={4.20}
                            targetSd={0.12}
                            initialTab="ARRHENIUS_KINETICS"
                        />
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 4.1 DELTA-CHECK WATCH (LONGITUDINAL ORGAN INJURY RADAR & COMMS LOG) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'DELTA_CHECKS' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <AlertOctagon className="w-5 h-5 text-rose-400" />
                                        Longitudinal Delta-Check & Acute Organ Injury Radar
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Analyte velocity (ΔC / Δt) tracking for KDIGO Acute Kidney Injury and active hemorrhage detection
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            {/* Top: Side-by-Side Critical Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {state.deltaCheckAlerts.map((delta) => (
                                    <div
                                        key={delta.id}
                                        className="p-5 rounded-xl bg-slate-950 border border-rose-900/50 space-y-4 shadow-lg shadow-rose-950/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-white">{delta.analyteName}</h3>
                                                <span className="text-[11px] text-slate-500 font-mono">Alert ID: {delta.id}</span>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                {delta.deltaPct > 0 ? `+${delta.deltaPct}%` : `${delta.deltaPct}%`} In {delta.elapsedHours}h
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-center">
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Baseline</span>
                                                <strong className="text-slate-300">{delta.previousValue} {delta.unit}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Current</span>
                                                <strong className="text-white">{delta.currentValue} {delta.unit}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Velocity</span>
                                                <strong className="text-rose-400">{delta.velocityPerHour > 0 ? `+${delta.velocityPerHour}` : delta.velocityPerHour}/h</strong>
                                            </div>
                                        </div>

                                        <p className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-xs text-rose-200/90 leading-relaxed">
                                            {delta.clinicalInterpretation}
                                        </p>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                            <button
                                                onClick={() => {
                                                    audioSynth.playTactileClick();
                                                    setAcknowledgingDeltaId(delta.id);
                                                }}
                                                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Acknowledge Flag</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom: Patient Longitudinal Biomarker Trajectory & Clinical Communication Log (No Dead Space!) */}
                            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Patient Longitudinal Biomarker Trajectory & Clinical Communication Log
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        Logged Calls: {state.clinicalCommLogs.length}
                                    </span>
                                </div>

                                {state.clinicalCommLogs.length === 0 ? (
                                    <div className="p-6 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                                        No acknowledged alerts yet. Click &quot;Acknowledge Flag&quot; on any active delta alert to record clinician communication notes and log audit sign-off.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                                        <table className="w-full text-left text-xs font-mono">
                                            <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                                                <tr>
                                                    <th className="p-3">Alert ID</th>
                                                    <th className="p-3">Biomarker Analyte</th>
                                                    <th className="p-3">Clinician Communication Note</th>
                                                    <th className="p-3">Sign-off Role</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3 text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60">
                                                {state.clinicalCommLogs.map((log, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-900/40">
                                                        <td className="p-3 font-bold text-cyan-300">{log.alertId}</td>
                                                        <td className="p-3 text-white">{log.analyteName}</td>
                                                        <td className="p-3 text-slate-300 max-w-md">{log.note}</td>
                                                        <td className="p-3 text-cyan-400">{log.clinicianRole}</td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right text-slate-400 text-[11px]">
                                                            {new Date(log.timestamp).toLocaleTimeString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 4.2 CONTROLLED AUTONOMY (FAILOVER ADJUDICATION STUDIO & AUDIT TRAIL) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'AUTONOMY' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <GitBranch className="w-5 h-5 text-purple-400" />
                                        Controlled Autonomy & Failover Adjudication Studio
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Role-gated human-in-the-loop clinical adjudication for failover routing & emergency load shed
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-slate-400">
                                        Active Sign-Off Role: <strong className="text-cyan-300">{state.activeRole}</strong>
                                    </span>
                                    <ProvenanceBadge provenance="CONFIRMED" />
                                </div>
                            </div>

                            {/* Top Proposals Cards */}
                            <div className="space-y-4">
                                {state.proposals.length === 0 ? (
                                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                                        All automated proposals have been adjudicated. No pending clinical gates.
                                    </div>
                                ) : (
                                    state.proposals.map((prop) => {
                                        const isAuthorizedRole =
                                            prop.requiredRole === 'LAB_TECHNICIAN' ||
                                            (prop.requiredRole === 'PATHOLOGIST' && (state.activeRole === 'PATHOLOGIST' || state.activeRole === 'LAB_DIRECTOR')) ||
                                            (prop.requiredRole === 'LAB_DIRECTOR' && state.activeRole === 'LAB_DIRECTOR');

                                        return (
                                            <div
                                                key={prop.id}
                                                className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-sm font-bold text-white">{prop.title}</h3>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                            {prop.riskLevel}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        Proposed at: {prop.proposedAt || 'Recently'}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-300 leading-relaxed">{prop.reason}</p>

                                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                                                    <div>Expected Benefit: <strong className="text-emerald-400">{prop.expectedBenefit}</strong></div>
                                                    <div>Potential Operational Risk: <strong className="text-amber-400">{prop.potentialRisk}</strong></div>
                                                    <div>Action to Execute: <strong className="text-cyan-300">{prop.proposedAction}</strong></div>
                                                </div>

                                                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                                                    <span className="text-xs text-slate-400">
                                                        Required Role Sign-off: <strong className="text-white">{prop.requiredRole}</strong>
                                                        {!isAuthorizedRole && (
                                                            <span className="text-rose-400 ml-2 font-mono text-[11px]">
                                                                (Switch role in top-right to sign)
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleRejectProposal(prop.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                                                        >
                                                            Reject Proposal
                                                        </button>
                                                        <button
                                                            disabled={!isAuthorizedRole}
                                                            onClick={() => handleAuthorizeProposal(prop.id)}
                                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Authorize & Execute Routing</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Bottom: Immutable Adjudication Audit Trail (Eliminating Dead Space!) */}
                            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileCheck2 className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Immutable Adjudication Audit Trail (ISO 15189 §8.4)
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        Audited Decisions: {state.auditTrail.length}
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                                            <tr>
                                                <th className="p-3">Audit ID</th>
                                                <th className="p-3">Action Title</th>
                                                <th className="p-3">Decision</th>
                                                <th className="p-3">Reviewer</th>
                                                <th className="p-3">Digital Signature</th>
                                                <th className="p-3 text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {state.auditTrail.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-slate-900/40">
                                                    <td className="p-3 font-bold text-cyan-300">{entry.id}</td>
                                                    <td className="p-3 text-white">{entry.proposalTitle}</td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                                                entry.decision === 'APPROVED_EXECUTED'
                                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                            }`}
                                                        >
                                                            {entry.decision}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-slate-300">{entry.reviewerName} ({entry.role})</td>
                                                    <td className="p-3 text-slate-400 text-[10px]">{entry.digitalSignature}</td>
                                                    <td className="p-3 text-right text-slate-400 text-[11px]">
                                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 4.3 CAUSAL EVIDENCE GRAPH & ROOT-CAUSE ANALYSIS (RCA) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'INVESTIGATIONS' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Network className="w-5 h-5 text-cyan-400" />
                                        Causal Evidence Graph & Root-Cause Analysis (RCA)
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Case INV-2026-089: Cobas c503 High-Volume ISE Drift & Evening TAT Congestion
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            {/* Directed Node-Link Diagnostic Graph */}
                            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                                    <span className="text-xs font-mono text-cyan-300 font-bold">
                                        Directed Causal Topology: Facts → Association → Hypothesis → Verified Resolution
                                    </span>
                                    <button
                                        onClick={() => {
                                            audioSynth.playStatChime();
                                            handleRecalibration('ANZ-BIO-01');
                                            setNotification({
                                                type: 'success',
                                                message: 'Applied Verified Resolution: Split-rack failover and ISE recalibration executed.',
                                            });
                                        }}
                                        className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Apply Verified Resolution</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                                    {/* Node 1: Observed Fact */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                                    OBSERVED FACT
                                                </span>
                                                <span className="text-[10px] font-mono text-emerald-400">Conf: 100%</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white pt-1">Westgard 2_2s Violation on Level-2 QC</h4>
                                            <p className="text-[11px] text-slate-400">
                                                Cobas c503 #1 triggered 2_2s shift on potassium ISE channel at 17:30 IST.
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                                            Source: Cobas Pro c503 #1
                                        </div>
                                    </div>

                                    {/* Node 2: Quantified Correlation */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                                    CORRELATION
                                                </span>
                                                <span className="text-[10px] font-mono text-indigo-300">r = 0.84</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white pt-1">ISE Electrode Aging vs Thermal Shift</h4>
                                            <p className="text-[11px] text-slate-400">
                                                Ambient temperature fluctuation (24°C → 26.5°C) correlates with +2.8% positive ISE slope shift.
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                                            Telemetry: HVAC Zone 3
                                        </div>
                                    </div>

                                    {/* Node 3: Hypothesis */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                                    HYPOTHESIS
                                                </span>
                                                <span className="text-[10px] font-mono text-amber-300">Conf: 88%</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white pt-1">Reference Electrode Depletion</h4>
                                            <p className="text-[11px] text-slate-400">
                                                Electrolyte reagent lot LOT-K-8842 nearing threshold (340 tests), accentuating drift.
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                                            Module: Reagent Inventory
                                        </div>
                                    </div>

                                    {/* Node 4: Verified Resolution */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/50 space-y-2 flex flex-col justify-between shadow-lg shadow-emerald-950/30">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                    VERIFIED RESOLUTION
                                                </span>
                                                <span className="text-[10px] font-mono text-emerald-400">Conf: 96%</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white pt-1">Split-Rack Failover & Recalibration</h4>
                                            <p className="text-[11px] text-slate-300">
                                                Reroute 42 routine chemistry tubes to Cobas #2 and trigger 3-point ISE recalibration.
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-400">
                                            Verified Action Ready
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 5.1 PARETO FRONTIER (NSGA-II MULTI-OBJECTIVE OPTIMIZATION) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'PARETO' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Scale className="w-5 h-5 text-cyan-400" />
                                        Multi-Objective Pareto Floor Optimization (NSGA-II)
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Non-dominated sorting genetic algorithms balancing Turnaround Time, Thermal Degradation, and Reagent Cost
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            {/* Top 3 Operating Policy Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'BALANCED_CLINICAL', name: 'Balanced Clinical Default', tat: '36.5m', thermal: '1.8%', cost: '$4.20/sample', desc: 'Standard operating policy optimizing clinical safety and patient throughput.' },
                                    { id: 'AGGRESSIVE_STAT', name: 'Aggressive STAT Minimum TAT', tat: '18.2m', thermal: '0.9%', cost: '$6.80/sample', desc: 'Prioritizes immediate dispatch to fastest analyzers regardless of reagent consumption.' },
                                    { id: 'REAGENT_CONSERVATIVE', name: 'Reagent Conservation Policy', tat: '48.0m', thermal: '3.2%', cost: '$2.95/sample', desc: 'Batches routine chemistry to maximize multi-test cartridge utilization.' },
                                ].map((policy) => {
                                    const isSelected = state.paretoPolicy === policy.id;
                                    return (
                                        <div
                                            key={policy.id}
                                            onClick={() => {
                                                audioSynth.playTactileClick();
                                                actions.setParetoPolicy(policy.id as any);
                                            }}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                                                isSelected
                                                    ? 'bg-slate-850 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-white">{policy.name}</h4>
                                                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />}
                                            </div>

                                            <p className="text-xs text-slate-400">{policy.desc}</p>

                                            <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-center">
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">P50 TAT</span>
                                                    <strong className="text-cyan-300">{policy.tat}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">Thermal Drift</span>
                                                    <strong className="text-emerald-400">{policy.thermal}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">Cost/Test</span>
                                                    <strong className="text-slate-200">{policy.cost}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom Split: Pareto Scatter Plot (7 cols) & Department Queue Preview (5 cols) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                            Pareto Optimal Trade-off Frontier (TAT vs. Operating Cost)
                                        </h3>
                                        <span className="text-[10px] font-mono text-cyan-400">
                                            Hypervolume Index: 0.942
                                        </span>
                                    </div>

                                    {/* SVG Scatter Plot */}
                                    <div className="h-60 w-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 relative flex flex-col justify-end">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                                            {/* Axes */}
                                            <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="4" />
                                            <line x1="40" y1="90" x2="380" y2="90" stroke="#1e293b" strokeDasharray="4" />
                                            <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />
                                            <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                                            {/* Axis Labels */}
                                            <text x="320" y="175" fill="#64748b" fontSize="9" fontFamily="monospace">TAT (Minutes) →</text>
                                            <text x="10" y="30" fill="#64748b" fontSize="9" fontFamily="monospace">Cost ($)</text>

                                            {/* Pareto Frontier Curve */}
                                            <path
                                                d="M 80 40 Q 160 85, 240 120 T 360 148"
                                                fill="none"
                                                stroke="#38bdf8"
                                                strokeWidth="2"
                                                strokeDasharray="4"
                                            />

                                            {/* Policy 1: Aggressive STAT (TAT: 18m, Cost: $6.80) */}
                                            <circle cx="80" cy="40" r={state.paretoPolicy === 'AGGRESSIVE_STAT' ? '8' : '5'} fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                                            <text x="92" y="44" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">Aggressive STAT (18.2m, $6.80)</text>

                                            {/* Policy 2: Balanced Default (TAT: 36.5m, Cost: $4.20) */}
                                            <circle cx="210" cy="105" r={state.paretoPolicy === 'BALANCED_CLINICAL' ? '8' : '5'} fill="#06b6d4" stroke="#fff" strokeWidth="2" />
                                            <text x="222" y="108" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace">Balanced Clinical (36.5m, $4.20)</text>

                                            {/* Policy 3: Reagent Conservative (TAT: 48m, Cost: $2.95) */}
                                            <circle cx="340" cy="145" r={state.paretoPolicy === 'REAGENT_CONSERVATIVE' ? '8' : '5'} fill="#10b981" stroke="#fff" strokeWidth="2" />
                                            <text x="250" y="155" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">Reagent Saver (48.0m, $2.95)</text>
                                        </svg>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Departmental Queue Impact Preview
                                    </h3>
                                    <div className="space-y-2 text-xs font-mono">
                                        {state.departmentQueues.map((q) => (
                                            <div key={q.department} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                                                <div>
                                                    <span className="text-white block font-semibold">{q.department}</span>
                                                    <span className="text-[10px] text-slate-500">Wait: {q.meanWaitTimeWqMinutes}m</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-cyan-300 font-bold">{q.meanTotalTatWMinutes} min TAT</span>
                                                    <span className="text-[10px] text-emerald-400 block">{q.bottleneckSeverity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 5.2 HYPERION GOVERNANCE (FDA SaMD / ISO 15189 MODEL REGISTRY) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'MODELS' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-indigo-400" />
                                        Hyperion Machine Learning Model Governance Registry
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        FDA SaMD / ISO 15189 model lineage, training data audit, and drift monitoring
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        id: 'MDL-SURROGATE-TAT-01',
                                        name: 'Neural Surrogate Fast TAT Predictor (MLP)',
                                        version: '2.4.1',
                                        purpose: 'Real-time sub-millisecond P50/P90/P99 turnaround time prediction across 5 lab departments.',
                                        algorithm: 'Multilayer Perceptron (He-initialized, LeakyReLU, Backprop with Adam)',
                                        trainingWindow: 'Trailing 90 days accession-to-verification events',
                                        sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                                        status: 'DEPLOYED_PRODUCTION',
                                        driftIndicatorPct: 1.2,
                                    },
                                    {
                                        id: 'MDL-WEIBULL-PROG-01',
                                        name: 'Weibull Fleet Reliability & RUL Estimator',
                                        version: '1.2.0',
                                        purpose: 'Forecasts Remaining Useful Life and failure hazard rates of optical lamps and mechanical fluidics.',
                                        algorithm: 'Maximum Likelihood Estimation (MLE) 2-Parameter Weibull',
                                        trainingWindow: 'Continuous streaming analyzer maintenance logs',
                                        sha256Checksum: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
                                        status: 'DEPLOYED_PRODUCTION',
                                        driftIndicatorPct: 0.8,
                                    },
                                    {
                                        id: 'MDL-PARETO-ROUTER-01',
                                        name: 'Multi-Objective Pareto Floor Router',
                                        version: '3.1.0',
                                        purpose: 'Real-time automated specimen dispatch balancing TAT vs reagent cost vs thermal excursion risk.',
                                        algorithm: 'Non-dominated Sorting Genetic Algorithm II (NSGA-II)',
                                        trainingWindow: 'Live Conveyor MagneMotion Telemetry',
                                        sha256Checksum: '9a31b40288cd7f1542a1b02948ce7611a43b8110b2efd4051a897210bc931811',
                                        status: 'DEPLOYED_PRODUCTION',
                                        driftIndicatorPct: 0.4,
                                    },
                                ].map((model) => (
                                    <div
                                        key={model.id}
                                        className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-white">{model.name}</h3>
                                                <span className="text-[11px] text-slate-500 font-mono">
                                                    ID: {model.id} • Version: {model.version}
                                                </span>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                {model.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-300">{model.purpose}</p>

                                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                                            <div>Algorithm: <strong className="text-white">{model.algorithm}</strong></div>
                                            <div>Training Window: <span className="text-slate-300">{model.trainingWindow}</span></div>
                                            <div className="truncate">SHA-256: <span className="text-cyan-300 text-[10px]">{model.sha256Checksum}</span></div>
                                            <div>Drift Indicator: <span className="text-emerald-400 font-bold">{model.driftIndicatorPct}% (Within limit &lt;5%)</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* 5.3 MATHEMATICAL SANDBOX (STATISTICS & WEIBULL RELIABILITY) */}
                {/* --------------------------------------------------------------------- */}
                {state.activeTab === 'MATH' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                                        Mathematical Intelligence Workbench & Reliability Calculator
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Auditable scientific calculations: Quantiles, IQR, MAD, and 2-Parameter Weibull equipment failure prognostics
                                    </p>
                                </div>
                                <ProvenanceBadge provenance="CONFIRMED" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Descriptive Stats Calculator */}
                                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <label className="text-xs font-semibold text-slate-200 block">
                                        Time-Series Analytical Series (Comma-Separated):
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={mathInputSeries}
                                        onChange={(e) => setMathInputSeries(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                    />
                                    <button
                                        onClick={handleRunMathCalculation}
                                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
                                    >
                                        Execute Descriptive & Weibull Analysis
                                    </button>

                                    {mathResult && (
                                        <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>Mean (μ): <strong className="text-white">{mathResult.mean}</strong></div>
                                                <div>Median: <strong className="text-white">{mathResult.median}</strong></div>
                                                <div>Variance (s²): <strong className="text-white">{mathResult.variance}</strong></div>
                                                <div>Std Dev (s): <strong className="text-white">{mathResult.stdDev}</strong></div>
                                                <div>IQR: <strong className="text-cyan-300">{mathResult.iqr}</strong></div>
                                                <div>MAD (Robust): <strong className="text-emerald-400">{mathResult.mad}</strong></div>
                                                <div>Outliers Flagged: <strong className="text-rose-400">{mathResult.outliersCount}</strong></div>
                                            </div>
                                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                                                P10: {mathResult.p10} | P25: {mathResult.p25} | P75: {mathResult.p75} | P90: {mathResult.p90} | P99: {mathResult.p99}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Weibull Reliability Simulator */}
                                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <h3 className="text-xs font-semibold text-white flex items-center justify-between">
                                        <span>Weibull Reliability & RUL Simulator</span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            R(t) = exp(-(t/η)^β)
                                        </span>
                                    </h3>

                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <div className="flex justify-between text-slate-400 font-mono">
                                                <span>Operating Hours (t):</span>
                                                <strong className="text-white">{weibullOperatingHours}h</strong>
                                            </div>
                                            <input
                                                type="range"
                                                min={10}
                                                max={800}
                                                step={10}
                                                value={weibullOperatingHours}
                                                onChange={(e) => setWeibullOperatingHours(Number(e.target.value))}
                                                className="w-full accent-cyan-500 cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-slate-400 font-mono">
                                                <span>Characteristic Life Scale (η):</span>
                                                <strong className="text-white">{weibullEta}h</strong>
                                            </div>
                                            <input
                                                type="range"
                                                min={200}
                                                max={1000}
                                                step={20}
                                                value={weibullEta}
                                                onChange={(e) => setWeibullEta(Number(e.target.value))}
                                                className="w-full accent-cyan-500 cursor-pointer"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                                            <div>Survival Prob R(t): <strong className="text-emerald-400">{weibullMetrics.survivalPct}%</strong></div>
                                            <div>Hazard h(t): <strong className="text-white">{weibullMetrics.hazardRate}/h</strong></div>
                                            <div>Fail Risk in 24h: <strong className={Number(weibullMetrics.failure24hPct) > 15 ? 'text-rose-400' : 'text-slate-300'}>{weibullMetrics.failure24hPct}%</strong></div>
                                            <div>Predicted RUL: <strong className="text-cyan-300">{weibullMetrics.rulHours}h</strong></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive First-Principles Clinical Mathematical Studio */}
                        <AdvancedClinicalGraphs
                            analyteCode="K_SERUM"
                            targetMean={4.20}
                            targetSd={0.12}
                            initialTab="SIX_SIGMA_OPSPECS"
                        />
                    </div>
                )}
            </main>

            {/* ========================================================================= */}
            {/* MODAL 1: ANALYZER SUBSYSTEM TELEMETRY & ASTM/HL7 FRAME INSPECTOR */}
            {/* ========================================================================= */}
            {inspectedAnalyzer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <span>{inspectedAnalyzer.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                            inspectedAnalyzer.status === 'ONLINE'
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'bg-rose-500/20 text-rose-300'
                                        }`}>
                                            {inspectedAnalyzer.status}
                                        </span>
                                    </h3>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {inspectedAnalyzer.manufacturer} • SN: {inspectedAnalyzer.serialNumber}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setInspectedAnalyzer(null)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Engineering Hardware Diagnostics */}
                        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block">Photometer Lamp</span>
                                <strong className="text-white text-sm">{inspectedAnalyzer.opticalLampHours}h</strong>
                                <span className="text-[10px] text-emerald-400 block">Within 2,000h rating</span>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block">Incubator Well</span>
                                <strong className="text-emerald-400 text-sm">{inspectedAnalyzer.chamberTemperatureCelsius}°C</strong>
                                <span className="text-[10px] text-slate-400 block">37.0°C ± 0.1°C</span>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block">Fluidics Vacuum</span>
                                <strong className="text-cyan-300 text-sm">{inspectedAnalyzer.vacuumPressureKpa} kPa</strong>
                                <span className="text-[10px] text-slate-400 block">Nominal -85.0 kPa</span>
                            </div>
                        </div>

                        {/* ASTM E1394-97 Live Frame Stream */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white font-mono flex items-center gap-2">
                                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                    <span>Live ASTM E1394-97 Frame Stream</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">Baud: 115200 • COM4 TCP/IP</span>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-emerald-400/90 space-y-1 overflow-x-auto max-h-36">
                                <div>[14:38:12] H|\^&amp;|||RocheCobas^503|||||||P|1|20261016143812</div>
                                <div>[14:38:13] P|1||UHID-DL-2026-4001||DOE^JOHN||19840512|M</div>
                                <div>[14:38:14] O|1|SMP-2026-9001||^^^K_SERUM\^^^CREAT|||20261016141000|||||A</div>
                                <div>[14:38:15] R|1|^^^K_SERUM^Potassium|4.20|mmol/L|3.5-5.1|N||F||||20261016143815</div>
                                <div>[14:38:16] L|1|N</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setInspectedAnalyzer(null)}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                            >
                                Close Diagnostics
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: CLINICIAN DELTA-CHECK ACKNOWLEDGMENT DIALOG */}
            {/* ========================================================================= */}
            {acknowledgingDeltaId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <AlertOctagon className="w-4 h-4 text-rose-400" />
                                <span>Sign-off Delta-Check Alert ({acknowledgingDeltaId})</span>
                            </h3>
                            <button
                                onClick={() => setAcknowledgingDeltaId(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <label className="text-slate-300 block font-semibold">
                                Clinician Communication & Action Note:
                            </label>
                            <textarea
                                rows={3}
                                value={deltaNoteInput}
                                onChange={(e) => setDeltaNoteInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                                placeholder="Enter clinical action taken (e.g., attending physician contacted, repeat drawn)..."
                            />
                            <div className="text-[11px] text-slate-400">
                                Signing Role: <strong className="text-cyan-300">{state.activeRole}</strong>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setAcknowledgingDeltaId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDeltaAcknowledgment}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Record Sign-off</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: CAP / NABL AUDIT DOSSIER GENERATOR */}
            {/* ========================================================================= */}
            {state.isAuditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                    <FileCheck2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <span>CAP LAP / ISO 15189:2022 Regulatory Inspection Dossier</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            CERTIFIED AUDIT
                                        </span>
                                    </h3>
                                    <span className="text-xs text-slate-400 font-mono">
                                        Facility: {state.activeFacility} • Generated: {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => actions.setIsAuditModalOpen(false)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Audit Summary Grid */}
                        <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Total Specimen Intake</span>
                                <strong className="text-white text-sm">{state.kpis.dailyAccessions} tubes</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Active Analyzer Fleet</span>
                                <strong className="text-emerald-400 text-sm">{state.kpis.activeAnalyzersCount} / {state.kpis.totalAnalyzersCount} Online</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">QC Westgard Breaches</span>
                                <strong className={state.kpis.westgardViolationsCount > 0 ? 'text-rose-400 text-sm' : 'text-emerald-400 text-sm'}>
                                    {state.kpis.westgardViolationsCount} active
                                </strong>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Adjudicated Sign-offs</span>
                                <strong className="text-cyan-300 text-sm">{state.auditTrail.length} records</strong>
                            </div>
                        </div>

                        {/* Regulatory Compliance Clauses */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
                            <div className="text-white font-bold border-b border-slate-800 pb-1">
                                Verified Compliance Clauses:
                            </div>
                            <div>✓ ISO 15189:2022 §7.3: Pre-analytical HIL optical gating active on all primary tubes</div>
                            <div>✓ ISO 15189:2022 §7.4: Two-sided tabular CUSUM & Westgard multirule statistical QC</div>
                            <div>✓ CAP LAP COM.01250: Automated delta-check velocity tracking & clinician acknowledgment log</div>
                            <div>✓ CLSI EP07-A2: Interference testing protocol verified with bias calculations</div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="text-xs text-slate-500 font-mono">
                                Digitally Signed by {state.activeRole}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print A4 Dossier</span>
                                </button>
                                <button
                                    onClick={() => {
                                        audioSynth.playTactileClick();
                                        const jsonStr = JSON.stringify(state, null, 2);
                                        const blob = new Blob([jsonStr], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `LABCORE_NEXUS_AUDIT_${new Date().toISOString().split('T')[0]}.json`;
                                        a.click();
                                    }}
                                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Export JSON Evidence</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: REAL-TIME HOSPITAL HL7 v2.8 / FHIR R5 CLINICAL EVENT BUS CONSOLE */}
            {/* ========================================================================= */}
            {isHl7ModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl max-w-5xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                    <Radio className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-white">
                                            Enterprise HL7 v2.8 / FHIR R5 Bi-Directional Clinical Event Bus
                                        </h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            MLLP / REST SOCKET LIVE
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">
                                        Integrated with Epic Beaker, Cerner Millennium, Sunquest & Roche Cobas IT Middleware
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsHl7ModalOpen(false)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Health System Interoperability Metrics */}
                        <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Parser Latency</span>
                                <strong className="text-emerald-400 text-sm">11.4 ms (Zero Dropped)</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Throughput</span>
                                <strong className="text-white text-sm">3,280 msgs / hr</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Dead Letter Queue (DLQ)</span>
                                <strong className="text-cyan-300 text-sm">0 Errors (Nominal)</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Security Hash</span>
                                <strong className="text-slate-300 text-[10px] truncate block">SHA-256 HMAC-Verified</strong>
                            </div>
                        </div>

                        {/* Live Message Packet Inspector */}
                        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 font-mono text-xs max-h-[380px]">
                            {hl7Messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedHl7Msg(msg)}
                                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                        selectedHl7Msg?.messageControlId === msg.messageControlId
                                            ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                msg.eventCode === 'ORM^O01'
                                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                    : msg.eventCode === 'ORU^R01'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            }`}>
                                                {msg.eventCode}
                                            </span>
                                            <span className="font-bold text-white">{msg.messageControlId}</span>
                                            <span className="text-slate-500">[{msg.sendingFacility}]</span>
                                        </div>
                                        <span className="text-slate-400">{msg.timestamp}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-300 flex items-center justify-between">
                                        <span>Patient: <strong className="text-cyan-300">{msg.patientUhid}</strong> | Accession: <strong className="text-white">{msg.accessionBarcode}</strong></span>
                                        <span className={msg.priority === 'STAT' ? 'text-rose-400 font-bold' : 'text-slate-400'}>Priority: {msg.priority}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Tests: {msg.orderedTests.join(', ')} • Latency: {msg.parserLatencyMs}ms
                                    </div>
                                    {selectedHl7Msg?.messageControlId === msg.messageControlId && (
                                        <div className="mt-2.5 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto whitespace-pre font-mono">
                                            {msg.rawHl7Payload}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="text-xs text-slate-400 font-mono">
                                Protocol: MLLP over TLS 1.3 • HL7 Version 2.8 / HL7 FHIR US-Core v4.0.0
                            </span>
                            <button
                                onClick={() => {
                                    audioSynth.playStatChime();
                                    setNotification({
                                        type: 'success',
                                        message: 'Simulated STAT Emergency HL7 ORM^O01 injected into TLA message queue.',
                                    });
                                }}
                                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Inject Simulated STAT ORM^O01</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =========================================================================
// DEFAULT EXPORT WRAPPED IN NEXUS_STORE_PROVIDER
// =========================================================================

export default function OmniscientNexusDeck() {
    return (
        <NexusStoreProvider>
            <OmniscientNexusDeckInner />
        </NexusStoreProvider>
    );
}
