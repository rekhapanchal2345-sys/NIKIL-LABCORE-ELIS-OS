'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Binary,
  CheckCircle2,
  Cpu,
  Database,
  Droplets,
  Flame,
  FlaskConical,
  Gauge,
  HeartPulse,
  Lock,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Syringe,
  Terminal,
  ThermometerSnowflake,
  Unlock,
  Volume2,
  VolumeX,
  Waves,
  Zap,
  Compass,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useOptionalNexusStore } from '@/components/nexus/useNexusStore';
import {
  AnalyzerId,
  ArrheniusStabilityMetrics,
  BullsAlgorithmState,
  HilIndices,
  ScattergramPoint,
  WeibullWearMetrics,
  WestgardEvaluation,
  calculateArrheniusStability,
  calculateWeibullHardwareHazard,
  evaluateWestgardMultiRules,
  generateSysmexScattergram,
  updateBullsAlgorithmXb,
} from './virtualAnalyzerMath';
import {
  AstmFsmPhase,
  ENTERPRISE_ANALYZER_PROFILES,
  SIMULATED_LIS_PATIENT_ORDERS,
  SimulatedLisOrder,
  TelemetryFramePacket,
  buildBidirectionalAstmExchange,
  createHl7MllpResultPacket,
  evaluateAnalyzerSampleRun,
  EvaluatedResultItem,
} from './virtualAnalyzerProtocols';

/**
 * Web Audio API Acoustic Telemetry Synthesizer
 * Provides zero-dependency tactile audio clicks for ASTM packet frames and panic threshold chirps
 */
class ClinicalSoundSynthesizer {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playPacketClick(isOutgoing = true): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOutgoing ? 1480 : 1120, ctx.currentTime);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.028);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  public playPanicChirp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.08, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.085);
    });
  }

  public playClotAlarmBeep(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }
}

export interface CarouselSlot {
  slotNumber: number;
  barcode: string | null;
  status: 'EMPTY' | 'QUEUED' | 'SCANNING' | 'ASPIRATING' | 'COMPLETED' | 'STAT_EMERGENCY' | 'REJECTED_HIL';
}

const FSM_STEPS: Array<{ phase: AstmFsmPhase; label: string; shortCode: string }> = [
  { phase: 'PHASE_1_ENQ_HANDSHAKE', label: '1. [ENQ] -> [ACK]', shortCode: 'ENQ/ACK' },
  { phase: 'PHASE_2_HOST_QUERY_Q', label: '2. Host Query Q|1|', shortCode: 'QUERY Q' },
  { phase: 'PHASE_3_LIS_MRN_MATCH', label: '3. LIS MRN Match', shortCode: 'MRN MATCH' },
  { phase: 'PHASE_4_ORDER_DOWNLOAD_P_O', label: '4. Order P|1 + O|1', shortCode: 'P/O ORDER' },
  { phase: 'PHASE_5_ROBOTIC_ASPIRATION', label: '5. Fluidic Aspiration', shortCode: 'ASPIRATE' },
  { phase: 'PHASE_6_RESULT_EMISSION_R', label: '6. Result R|1|^^^', shortCode: 'EMIT R|' },
  { phase: 'PHASE_7_CHECKSUM_VERIFICATION', label: '7. Mod-256 Checksum', shortCode: 'MOD-256' },
  { phase: 'PHASE_8_TERMINATION_EOT', label: '8. L|1|N & [EOT]', shortCode: 'L|1/EOT' },
];

export const VirtualAnalyzerMasterDeck: React.FC = () => {
  // Optional Omniscient Nexus Store Binding
  const nexusStore = useOptionalNexusStore();

  // Active Analyzer Selection
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<AnalyzerId>('ROCHE_COBAS_C503');
  const activeAnalyzer = useMemo(
    () => ENTERPRISE_ANALYZER_PROFILES[selectedAnalyzerId],
    [selectedAnalyzerId]
  );

  // Audio Synthesizer & Mute Control
  const soundEngineRef = useRef<ClinicalSoundSynthesizer | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  useEffect(() => {
    soundEngineRef.current = new ClinicalSoundSynthesizer();
  }, []);

  // Digital Twin Mechanical & Fluidic State
  const [carouselAngleDeg, setCarouselAngleDeg] = useState<number>(0);
  const [cuvetteWheelAngleDeg, setCuvetteWheelAngleDeg] = useState<number>(0);
  const [activeWavelengthNm, setActiveWavelengthNm] = useState<number>(340);
  const [sampleProbeDipPct, setSampleProbeDipPct] = useState<number>(0); // 0 = home, 100 = bottom of tube
  const [reagentProbeDipPct, setReagentProbeDipPct] = useState<number>(0);
  const [lldCapacitanceTriggered, setLldCapacitanceTriggered] = useState<boolean>(false);
  const [aspirationPressureKpa, setAspirationPressureKpa] = useState<number>(98.4);
  const [clotDetectedLock, setClotDetectedLock] = useState<boolean>(false);
  const [probeWashActive, setProbeWashActive] = useState<boolean>(false);
  const [compartmentTempC, setCompartmentTempC] = useState<number>(5.4);
  const [pipetteCyclesExecuted, setPipetteCyclesExecuted] = useState<number>(18420);

  // HIL & Chaos State
  const [hilIndices, setHilIndices] = useState<HilIndices>({
    hemolysisMgDl: 8,
    icterusMgDl: 0.6,
    lipemiaIndex: 14,
  });
  const [activeChaosBanner, setActiveChaosBanner] = useState<string | null>(null);

  // ASTM State Machine & Telemetry Terminal State
  const [fsmPhase, setFsmPhase] = useState<AstmFsmPhase>('IDLE');
  const [isRunningCycle, setIsRunningCycle] = useState<boolean>(false);
  const [telemetryPackets, setTelemetryPackets] = useState<TelemetryFramePacket[]>([]);
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null);
  const [wireProtocolMode, setWireProtocolMode] = useState<'ASTM_E1394' | 'HL7_MLLP'>('ASTM_E1394');
  const [evaluatedResults, setEvaluatedResults] = useState<EvaluatedResultItem[]>([]);
  const [runCounter, setRunCounter] = useState<number>(1);

  // Westgard Multi-Rule QC History (Z-score / raw value history for primary analyte)
  const [qcRawHistory, setQcRawHistory] = useState<number[]>([
    93.8, 94.5, 92.9, 95.1, 93.4, 94.2, 93.9, 94.8, 93.1, 94.0, 94.4, 93.7,
  ]);

  // Bull's Algorithm (X_B, N=20) Moving Average State for Sysmex XN-1000
  const [bullsState, setBullsState] = useState<BullsAlgorithmState>(() =>
    updateBullsAlgorithmXb(
      89.2,
      [88.9, 89.4, 89.1, 89.8, 88.7, 89.3, 89.0, 89.5, 89.2, 88.8, 89.6, 89.1, 89.3, 88.9, 89.4, 89.0, 89.2, 89.5, 88.9, 89.1],
      89.0,
      [89.0, 89.1, 88.9, 89.2, 89.0, 89.1, 89.3, 89.1]
    )
  );

  // Sample Carousel Slots (12 positions)
  const [carouselSlots, setCarouselSlots] = useState<CarouselSlot[]>(() =>
    Array.from({ length: 12 }, (_, idx) => ({
      slotNumber: idx + 1,
      barcode: idx === 0 ? 'LAB-TUBE-8841' : idx === 1 ? 'LAB-TUBE-8842' : idx === 2 ? 'LAB-TUBE-9104' : null,
      status: idx === 0 ? 'QUEUED' : idx === 1 ? 'QUEUED' : idx === 2 ? 'QUEUED' : 'EMPTY',
    }))
  );

  // Derived Mathematical Evaluations
  const primaryParam = activeAnalyzer.parameters[0];

  const westgardEvaluation: WestgardEvaluation = useMemo(
    () => evaluateWestgardMultiRules(qcRawHistory, primaryParam.nominalMean, primaryParam.nominalSd),
    [qcRawHistory, primaryParam]
  );

  const arrheniusMetrics: ArrheniusStabilityMetrics = useMemo(
    () => calculateArrheniusStability(compartmentTempC, 720),
    [compartmentTempC]
  );

  const weibullMetrics: WeibullWearMetrics = useMemo(
    () => calculateWeibullHardwareHazard(pipetteCyclesExecuted, 2.6, 50000),
    [pipetteCyclesExecuted]
  );

  const scattergramPoints: ScattergramPoint[] = useMemo(
    () => generateSysmexScattergram(runCounter, activeChaosBanner !== null),
    [runCounter, activeChaosBanner]
  );

  const inspectedPacket: TelemetryFramePacket | null = useMemo(() => {
    if (telemetryPackets.length === 0) return null;
    if (selectedPacketId) {
      const found = telemetryPackets.find((p) => p.id === selectedPacketId);
      if (found) return found;
    }
    return telemetryPackets[telemetryPackets.length - 1];
  }, [telemetryPackets, selectedPacketId]);

  // Continuous Optical Photometer & Cuvette Wheel Rotation
  useEffect(() => {
    const wavelengths = [340, 405, 450, 510, 546, 570, 600, 660, 700, 800];
    let wIdx = 0;
    const timer = setInterval(() => {
      setCuvetteWheelAngleDeg((prev) => (prev + 10) % 360);
      wIdx = (wIdx + 1) % wavelengths.length;
      setActiveWavelengthNm(wavelengths[wIdx]);
    }, 320);
    return () => clearInterval(timer);
  }, []);

  // Reset QC baseline when switching analyzers so mean/SD align with primary parameter
  const handleSelectAnalyzer = useCallback((nextId: AnalyzerId) => {
    setSelectedAnalyzerId(nextId);
    const nextPrimary = ENTERPRISE_ANALYZER_PROFILES[nextId].parameters[0];
    const m = nextPrimary.nominalMean;
    const s = nextPrimary.nominalSd;
    setQcRawHistory([
      Number((m - 0.3 * s).toFixed(3)),
      Number((m + 0.4 * s).toFixed(3)),
      Number((m - 0.5 * s).toFixed(3)),
      Number((m + 0.2 * s).toFixed(3)),
      Number((m + 0.6 * s).toFixed(3)),
      Number((m - 0.2 * s).toFixed(3)),
      Number((m + 0.1 * s).toFixed(3)),
      Number((m - 0.4 * s).toFixed(3)),
      Number((m + 0.3 * s).toFixed(3)),
      Number((m - 0.1 * s).toFixed(3)),
    ]);
    setHilIndices({ hemolysisMgDl: 8, icterusMgDl: 0.6, lipemiaIndex: 14 });
    setActiveChaosBanner(null);
  }, []);

  // Execute Full Bidirectional ASTM E1381/E1394 State Machine Cycle
  const executeAnalyzerCycle = useCallback(
    (
      chaosOverride: 'NONE' | 'HEMOLYZED_SERUM' | 'CARDIAC_STAT_PANIC' | 'COLD_CHAIN_DEGRADED' = 'NONE',
      customHil?: HilIndices
    ) => {
      if (westgardEvaluation.isLocked) {
        if (!audioMuted) soundEngineRef.current?.playClotAlarmBeep();
        return;
      }
      if (clotDetectedLock) {
        if (!audioMuted) soundEngineRef.current?.playClotAlarmBeep();
        return;
      }
      if (isRunningCycle) return;

      const activeHil = customHil ?? hilIndices;
      const orders = SIMULATED_LIS_PATIENT_ORDERS[selectedAnalyzerId];
      const baseOrder: SimulatedLisOrder = orders[0];
      const effectiveOrder: SimulatedLisOrder =
        chaosOverride === 'CARDIAC_STAT_PANIC'
          ? {
              ...baseOrder,
              barcode: `STAT-CARD-${8900 + runCounter}`,
              priority: 'STAT',
              ward: 'CCU-EMERGENCY-STAT-LANE',
            }
          : baseOrder;

      const results = evaluateAnalyzerSampleRun(
        activeAnalyzer,
        activeHil,
        chaosOverride,
        runCounter
      );

      const astmPackets = buildBidirectionalAstmExchange(
        activeAnalyzer,
        effectiveOrder,
        results
      );
      const hl7Packet = createHl7MllpResultPacket(activeAnalyzer, effectiveOrder, results);
      const fullStream =
        wireProtocolMode === 'HL7_MLLP' ? [...astmPackets.slice(0, 6), hl7Packet] : astmPackets;

      setIsRunningCycle(true);
      setTelemetryPackets([]);
      setSelectedPacketId(null);
      setCarouselAngleDeg((prev) => (prev + 30) % 360);
      setPipetteCyclesExecuted((prev) => prev + 1);
      setRunCounter((prev) => prev + 1);

      // Update carousel slot visual status
      setCarouselSlots((prev) =>
        prev.map((slot, idx) =>
          idx === 0
            ? {
                ...slot,
                barcode: effectiveOrder.barcode,
                status:
                  chaosOverride === 'CARDIAC_STAT_PANIC'
                    ? 'STAT_EMERGENCY'
                    : 'SCANNING',
              }
            : slot
        )
      );

      // Bi-Directional Sync: Inject into Omniscient Nexus Live TLA Track
      if (nexusStore) {
        nexusStore.actions.injectStatSpecimen({
          barcode: effectiveOrder.barcode,
          patientUhid: effectiveOrder.mrn,
          tubeLabel: `${effectiveOrder.priority === 'STAT' ? 'STAT' : 'ROUTINE'} ${activeAnalyzer.name.split(' ')[0]} Tube`,
          tests: effectiveOrder.orderedTestCodes,
          department: activeAnalyzer.department,
          priority: chaosOverride === 'CARDIAC_STAT_PANIC' || effectiveOrder.priority === 'STAT' ? 'STAT_EMERGENCY' : 'ROUTINE',
          status: 'ASPIRATING',
        });
        if (chaosOverride === 'CARDIAC_STAT_PANIC') {
          nexusStore.actions.setEmergencyCode('CODE_STROKE');
        }
      }

      // Step through packets with realistic embedded timing & robotic arm choreography
      fullStream.forEach((pkt, index) => {
        setTimeout(() => {
          setFsmPhase(pkt.fsmPhase);
          setTelemetryPackets((prev) => [...prev, pkt]);

          // Mechanical arm choreography
          if (pkt.fsmPhase === 'PHASE_4_ORDER_DOWNLOAD_P_O') {
            setSampleProbeDipPct(45);
            setReagentProbeDipPct(65);
          } else if (pkt.fsmPhase === 'PHASE_5_ROBOTIC_ASPIRATION') {
            setSampleProbeDipPct(95);
            setReagentProbeDipPct(90);
            setLldCapacitanceTriggered(true);
            setAspirationPressureKpa(
              chaosOverride === 'HEMOLYZED_SERUM' ? 114.2 : 101.6
            );
            setCarouselSlots((prev) =>
              prev.map((s, idx) => (idx === 0 ? { ...s, status: 'ASPIRATING' } : s))
            );
          } else if (pkt.fsmPhase === 'PHASE_6_RESULT_EMISSION_R') {
            setSampleProbeDipPct(0);
            setReagentProbeDipPct(0);
            setLldCapacitanceTriggered(false);
            setEvaluatedResults(results);
          }

          // Acoustic feedback
          if (!audioMuted) {
            if (pkt.isPanicAlert) {
              soundEngineRef.current?.playPanicChirp();
            } else {
              soundEngineRef.current?.playPacketClick(
                pkt.direction === 'ANALYZER_TO_LIS'
              );
            }
          }

          // Final packet cleanup
          if (index === fullStream.length - 1) {
            setIsRunningCycle(false);
            const anyHilReject = results.some((r) => r.gatedRejected);
            setCarouselSlots((prev) =>
              prev.map((s, idx) =>
                idx === 0
                  ? {
                      ...s,
                      status: anyHilReject
                        ? 'REJECTED_HIL'
                        : chaosOverride === 'CARDIAC_STAT_PANIC'
                        ? 'STAT_EMERGENCY'
                        : 'COMPLETED',
                    }
                  : s
              )
            );

            // Update Bull's X_B if Sysmex XN-1000
            if (selectedAnalyzerId === 'SYSMEX_XN_1000') {
              const syntheticMcvBatch = Array.from(
                { length: 20 },
                (_, bIdx) => 89.0 + Math.sin(runCounter + bIdx) * 1.4
              );
              setBullsState((prevBulls) =>
                updateBullsAlgorithmXb(
                  prevBulls.latestXb,
                  syntheticMcvBatch,
                  89.0,
                  prevBulls.historicalBatchesXb
                )
              );
            }
          }
        }, index * 190);
      });
    },
    [
      activeAnalyzer,
      audioMuted,
      clotDetectedLock,
      hilIndices,
      isRunningCycle,
      runCounter,
      selectedAnalyzerId,
      westgardEvaluation.isLocked,
      wireProtocolMode,
    ]
  );

  // Initial auto-run on mount so the deck is live immediately
  useEffect(() => {
    const initialResults = evaluateAnalyzerSampleRun(
      ENTERPRISE_ANALYZER_PROFILES.ROCHE_COBAS_C503,
      { hemolysisMgDl: 8, icterusMgDl: 0.6, lipemiaIndex: 14 },
      'NONE',
      1
    );
    setEvaluatedResults(initialResults);
    const initialPackets = buildBidirectionalAstmExchange(
      ENTERPRISE_ANALYZER_PROFILES.ROCHE_COBAS_C503,
      SIMULATED_LIS_PATIENT_ORDERS.ROCHE_COBAS_C503[0],
      initialResults
    );
    setTelemetryPackets(initialPackets);
    setFsmPhase('PHASE_8_TERMINATION_EOT');
  }, []);

  // Chaos Button 1: Inject Hemolyzed Sample (CLSI EP07 Gate)
  const handleInjectHemolyzedSample = () => {
    const severeHil: HilIndices = {
      hemolysisMgDl: 420, // Severe RBC lysis (> 60 mg/dL K+ & > 80 mg/dL AST gates)
      icterusMgDl: 1.4,
      lipemiaIndex: 35,
    };
    setHilIndices(severeHil);
    setActiveChaosBanner(
      'CLSI EP07 HEMOLYSIS INTERFERENCE INJECTED (H-Index = 420 mg/dL): Intracellular K+ & AST spectral/chemical bias gated.'
    );
    executeAnalyzerCycle('HEMOLYZED_SERUM', severeHil);
  };

  // Chaos Button 2: Cardiac STAT Emergency
  const handleCardiacStatEmergency = () => {
    setSelectedAnalyzerId('ABBOTT_ARCHITECT_I2000SR');
    const cleanHil: HilIndices = { hemolysisMgDl: 12, icterusMgDl: 0.5, lipemiaIndex: 18 };
    setHilIndices(cleanHil);
    setActiveChaosBanner(
      'CARDIAC STAT EMERGENCY PREEMPTION: Critical Troponin-I (> 0.040 ng/mL) routed to STAT Emergency Carousel Lane.'
    );
    setTimeout(() => {
      const abbott = ENTERPRISE_ANALYZER_PROFILES.ABBOTT_ARCHITECT_I2000SR;
      const statOrder: SimulatedLisOrder = {
        ...SIMULATED_LIS_PATIENT_ORDERS.ABBOTT_ARCHITECT_I2000SR[0],
        barcode: `STAT-TROP-${990 + runCounter}`,
        priority: 'STAT',
      };
      const results = evaluateAnalyzerSampleRun(abbott, cleanHil, 'CARDIAC_STAT_PANIC', runCounter);
      const packets = buildBidirectionalAstmExchange(abbott, statOrder, results);
      setEvaluatedResults(results);
      setTelemetryPackets(packets);
      setFsmPhase('PHASE_8_TERMINATION_EOT');
      if (!audioMuted) soundEngineRef.current?.playPanicChirp();
    }, 120);
  };

  // Chaos Button 3: Fluidic Clot Detection & Probe Wash Cycle
  const handleFluidicClotDetection = () => {
    setClotDetectedLock(true);
    setSampleProbeDipPct(88);
    setAspirationPressureKpa(248.6); // Pressure transducer spike > 200 kPa
    setActiveChaosBanner(
      'FLUIDIC FIBRIN CLOT DETECTED (Aspiration Transducer = 248.6 kPa): S1 Sample Probe obstructed. Initiating high-pressure NaOH wash cycle.'
    );
    if (!audioMuted) soundEngineRef.current?.playClotAlarmBeep();
  };

  const handleTriggerProbeWashRecovery = () => {
    setProbeWashActive(true);
    setTimeout(() => {
      setClotDetectedLock(false);
      setProbeWashActive(false);
      setSampleProbeDipPct(0);
      setAspirationPressureKpa(98.4);
      setActiveChaosBanner(null);
    }, 900);
  };

  // Chaos Button 4: Cold-Chain Breach (Arrhenius Thermal Degradation)
  const handleColdChainBreach = () => {
    setCompartmentTempC(28.4); // Exceeds 25°C ambient breach threshold
    setActiveChaosBanner(
      'COLD-CHAIN BREACH DETECTED (T = 28.4°C > 25.0°C): Arrhenius kinetic rate constant accelerated 11.4x. Reagent bio-stability compromised.'
    );
    if (!audioMuted) soundEngineRef.current?.playPanicChirp();
  };

  const handleRestorePeltierCooling = () => {
    setCompartmentTempC(5.2);
    setActiveChaosBanner(null);
  };

  // Westgard QC Failure Injectors
  const handleInjectWestgardFailure = (ruleType: '1_3s' | '2_2s' | 'R_4s') => {
    const m = primaryParam.nominalMean;
    const s = primaryParam.nominalSd;
    if (ruleType === '1_3s') {
      setQcRawHistory((prev) => [...prev.slice(-11), Number((m + 3.45 * s).toFixed(3))]);
    } else if (ruleType === '2_2s') {
      setQcRawHistory((prev) => [
        ...prev.slice(-10),
        Number((m + 2.35 * s).toFixed(3)),
        Number((m + 2.48 * s).toFixed(3)),
      ]);
    } else {
      setQcRawHistory((prev) => [
        ...prev.slice(-10),
        Number((m - 2.3 * s).toFixed(3)),
        Number((m + 2.4 * s).toFixed(3)),
      ]);
    }
    if (!audioMuted) soundEngineRef.current?.playClotAlarmBeep();
  };

  const handleRecalibrateWestgardUnlock = () => {
    const m = primaryParam.nominalMean;
    const s = primaryParam.nominalSd;
    setQcRawHistory([
      Number((m - 0.2 * s).toFixed(3)),
      Number((m + 0.3 * s).toFixed(3)),
      Number((m - 0.1 * s).toFixed(3)),
      Number((m + 0.2 * s).toFixed(3)),
      Number((m - 0.3 * s).toFixed(3)),
      Number((m + 0.1 * s).toFixed(3)),
      Number((m + 0.25 * s).toFixed(3)),
      Number((m - 0.15 * s).toFixed(3)),
      Number((m + 0.05 * s).toFixed(3)),
      Number(m.toFixed(3)),
    ]);
    setActiveChaosBanner(null);
  };

  /**
   * Syntax Highlighter for Decoded ASTM E1394 / HL7 v2.5.1 Frame Delimiters (|, \, ^, &)
   */
  const renderHighlightedFrameText = (text: string) => {
    const tokens = text.split(/([|\\^&])/g);
    return tokens.map((tok, i) => {
      if (tok === '|') {
        return (
          <span key={i} className="text-cyan-400 font-bold px-0.5">
            |
          </span>
        );
      }
      if (tok === '^') {
        return (
          <span key={i} className="text-purple-400 font-bold">
            ^
          </span>
        );
      }
      if (tok === '\\' || tok === '&') {
        return (
          <span key={i} className="text-amber-400 font-bold">
            {tok}
          </span>
        );
      }
      return <span key={i}>{tok}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* TOP MISSION-CRITICAL COMMAND HEADER */}
      <header className="backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 mb-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.25)]">
              <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  NIKIL-LABCORE-ELIS-OS // OMNISCIENT NEXUS
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-ping" /> ASTM E1381/E1394 BI-DIRECTIONAL LIVE
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                Virtual Laboratory Analyzer &amp; Hardware Digital Twin Simulator
              </h1>
            </div>
          </div>

          {/* ANALYZER SELECTOR TABS & AUDIO MUTE */}
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(ENTERPRISE_ANALYZER_PROFILES) as AnalyzerId[]).map((id) => {
              const prof = ENTERPRISE_ANALYZER_PROFILES[id];
              const isSelected = id === selectedAnalyzerId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectAnalyzer(id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-slate-800/90 text-white border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: prof.accentColorHex }}
                  />
                  <span>{prof.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setAudioMuted((m) => !m)}
              className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                audioMuted
                  ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              }`}
              title="Toggle Web Audio API Telemetry Clicks & Panic Chirps"
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{audioMuted ? 'MUTED' : 'AUDIO ON'}</span>
            </button>

            {/* Omniscient Nexus Live Sync Navigation Link */}
            <Link
              href="/nexus"
              className="px-3 py-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 hover:border-cyan-400 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              title="Open Omniscient Nexus Command Center & 3D Digital Twin"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>Omniscient Nexus</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </Link>
          </div>
        </div>

        {/* HARDWARE STATUS & SERIAL LINK METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2">
            <span className="text-slate-500 block text-[10px]">INSTRUMENT SERIAL</span>
            <span className="text-cyan-300 font-semibold">{activeAnalyzer.serialNumber}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2">
            <span className="text-slate-500 block text-[10px]">SOCKET / BAUD RATE</span>
            <span className="text-slate-200">
              {activeAnalyzer.ipEndpoint}:{activeAnalyzer.tcpPort} ({activeAnalyzer.baudRate} bps)
            </span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2">
            <span className="text-slate-500 block text-[10px]">HARDWARE LOCK STATE</span>
            <span
              className={`font-bold ${
                westgardEvaluation.isLocked || clotDetectedLock
                  ? 'text-rose-400'
                  : westgardEvaluation.lockState === 'QC_WARNING_1_2S'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {clotDetectedLock
                ? 'PROBE_CLOT_LOCKED'
                : westgardEvaluation.lockState}
            </span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2">
            <span className="text-slate-500 block text-[10px]">REAGENT PELTIER TEMP</span>
            <span
              className={`font-bold ${
                arrheniusMetrics.coldChainBreached ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {arrheniusMetrics.temperatureCelsius}°C ({arrheniusMetrics.temperatureKelvin} K)
            </span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2">
            <span className="text-slate-500 block text-[10px]">OPTICAL MONOCHROMATOR</span>
            <span className="text-purple-300 font-semibold">{activeWavelengthNm} nm LED ACTIVE</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2">
            <span className="text-slate-500 block text-[10px]">WEIBULL PROBE SURVIVAL</span>
            <span className="text-cyan-300 font-semibold">
              {weibullMetrics.survivalProbabilityPct}% (λ={weibullMetrics.instantaneousHazardRate})
            </span>
          </div>
        </div>
      </header>

      {/* ACTIVE CHAOS / LOCKOUT ALERT BANNER */}
      {(activeChaosBanner || westgardEvaluation.isLocked || clotDetectedLock) && (
        <div className="mb-5 rounded-2xl border border-rose-500/60 bg-rose-950/40 backdrop-blur-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-rose-300 font-bold">
                {westgardEvaluation.isLocked
                  ? `HARDWARE INTERLOCK ENGAGED // ${westgardEvaluation.violatedRule}`
                  : clotDetectedLock
                  ? 'FLUIDIC PRESSURE SPIKE INTERLOCK // SAMPLE PROBE S1 OBSTRUCTED'
                  : 'CLINICAL CHAOS INJECTION ACTIVE'}
              </div>
              <p className="text-sm text-rose-100 mt-0.5">
                {westgardEvaluation.isLocked
                  ? westgardEvaluation.clinicalInterpretation
                  : activeChaosBanner}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {westgardEvaluation.isLocked && (
              <button
                type="button"
                onClick={handleRecalibrateWestgardUnlock}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono hover:bg-emerald-500/30 flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" /> Recalibrate &amp; Clear Lockout
              </button>
            )}
            {clotDetectedLock && (
              <button
                type="button"
                onClick={handleTriggerProbeWashRecovery}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 flex items-center gap-1.5"
              >
                <Droplets className="w-3.5 h-3.5" />
                {probeWashActive ? 'Washing Probe (NaOH)...' : 'Execute Probe Wash Recovery'}
              </button>
            )}
            {arrheniusMetrics.coldChainBreached && (
              <button
                type="button"
                onClick={handleRestorePeltierCooling}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 flex items-center gap-1.5"
              >
                <ThermometerSnowflake className="w-3.5 h-3.5" /> Restore 5.2°C Peltier Cooling
              </button>
            )}
          </div>
        </div>
      )}

      {/* CLINICAL CHAOS & STRESS TESTING CONTROLS DECK */}
      <section className="backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Clinical Chaos &amp; Stress Testing Controls
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isRunningCycle || westgardEvaluation.isLocked || clotDetectedLock}
              onClick={() => {
                setHilIndices({ hemolysisMgDl: 8, icterusMgDl: 0.6, lipemiaIndex: 14 });
                setActiveChaosBanner(null);
                executeAnalyzerCycle('NONE', {
                  hemolysisMgDl: 8,
                  icterusMgDl: 0.6,
                  lipemiaIndex: 14,
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunningCycle ? 'Running ASTM Cycle...' : '[Execute Nominal ASTM Cycle]'}
            </button>

            <button
              type="button"
              onClick={handleInjectHemolyzedSample}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              [Inject Hemolyzed Sample]
            </button>

            <button
              type="button"
              onClick={handleCardiacStatEmergency}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              [Cardiac STAT Emergency]
            </button>

            <button
              type="button"
              onClick={handleFluidicClotDetection}
              className="px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <Syringe className="w-3.5 h-3.5" />
              [Fluidic Clot Detection]
            </button>

            <button
              type="button"
              onClick={handleColdChainBreach}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <ThermometerSnowflake className="w-3.5 h-3.5" />
              [Cold-Chain Breach &gt;25°C]
            </button>
          </div>
        </div>

        {/* ASTM E1381/E1394 8-STAGE STATE MACHINE PIPELINE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          {FSM_STEPS.map((step, idx) => {
            const currentIdx = FSM_STEPS.findIndex((s) => s.phase === fsmPhase);
            const isCompleted = currentIdx > idx;
            const isCurrent = currentIdx === idx;
            return (
              <div
                key={step.phase}
                className={`rounded-lg px-2.5 py-1.5 border text-[11px] font-mono transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{step.shortCode}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {isCurrent && <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />}
                </div>
                <div className="text-[10px] truncate opacity-80 mt-0.5">{step.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MAIN OPERATIONS GRID: INTERACTIVE HARDWARE CHASSIS + WESTGARD & ARRHENIUS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        {/* LEFT 7 COLS: INTERACTIVE HARDWARE CHASSIS & ANIMATED SVG DIGITAL TWIN */}
        <div className="xl:col-span-7 backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                INTERACTIVE HARDWARE CHASSIS // DIGITAL TWIN INTERIOR
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {activeAnalyzer.name} — Electro-Optical &amp; Fluidic Deck
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`px-2.5 py-1 rounded-md border ${
                  lldCapacitanceTriggered
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                LLD CAPACITANCE: {lldCapacitanceTriggered ? 'FLUID CONTACT' : 'STANDBY'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md border ${
                  clotDetectedLock
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                    : 'bg-slate-950/80 border-slate-800 text-emerald-300'
                }`}
              >
                PRESSURE: {aspirationPressureKpa.toFixed(1)} kPa
              </span>
            </div>
          </div>

          {/* ANIMATED SVG HARDWARE CHASSIS */}
          <div className="relative bg-[#02050e] border border-slate-800/90 rounded-xl p-3 overflow-hidden">
            <svg
              viewBox="0 0 860 390"
              className="w-full h-auto select-none"
              role="img"
              aria-label="Virtual Analyzer Hardware Digital Twin"
            >
              <defs>
                <radialGradient id="cuvetteGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="probeMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>

              {/* Background Technical Grid */}
              <g stroke="#0f172a" strokeWidth="1">
                {Array.from({ length: 18 }, (_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={390} />
                ))}
                {Array.from({ length: 9 }, (_, i) => (
                  <line key={`h-${i}`} x1={0} y1={i * 50} x2={860} y2={i * 50} />
                ))}
              </g>

              {/* ZONE 1: SAMPLE CAROUSEL & LASER BARCODE READER (LEFT) */}
              <g transform="translate(150, 195)">
                <circle
                  r="118"
                  fill="#090d16"
                  stroke="#1e293b"
                  strokeWidth="3"
                />
                <circle
                  r="92"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.45"
                />

                {/* Rotating 12-Slot Sample Carousel */}
                <g
                  style={{
                    transform: `rotate(${carouselAngleDeg}deg)`,
                    transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {carouselSlots.map((slot, idx) => {
                    const angleRad = (idx * 30 * Math.PI) / 180;
                    const cx = Math.cos(angleRad) * 88;
                    const cy = Math.sin(angleRad) * 88;
                    const slotColor =
                      slot.status === 'STAT_EMERGENCY'
                        ? '#f43f5e'
                        : slot.status === 'REJECTED_HIL'
                        ? '#f59e0b'
                        : slot.status === 'ASPIRATING' || slot.status === 'SCANNING'
                        ? '#06b6d4'
                        : slot.status === 'COMPLETED'
                        ? '#10b981'
                        : slot.status === 'QUEUED'
                        ? '#a855f7'
                        : '#1e293b';

                    return (
                      <g key={slot.slotNumber} transform={`translate(${cx}, ${cy})`}>
                        <circle
                          r="13"
                          fill="#030712"
                          stroke={slotColor}
                          strokeWidth="2.5"
                        />
                        <circle r="5" fill={slotColor} opacity="0.85" />
                        <text
                          y="23"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          S{slot.slotNumber}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Center Hub */}
                <circle r="38" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <text
                  y="-4"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  SAMPLE
                </text>
                <text
                  y="8"
                  textAnchor="middle"
                  fill="#06b6d4"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  RACK CAROUSEL
                </text>

                {/* Barcode Laser Scanner Beam */}
                <g transform="translate(-138, -18)">
                  <rect
                    x="0"
                    y="0"
                    width="24"
                    height="36"
                    rx="4"
                    fill="#1e293b"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="24"
                    y1="18"
                    x2="52"
                    y2="18"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                  <text x="2" y="-6" fill="#f43f5e" fontSize="8" fontFamily="monospace">
                    LASER SCAN
                  </text>
                </g>
              </g>

              {/* ZONE 2: OPTICAL CUVETTE PHOTOMETER WHEEL (CENTER) */}
              <g transform="translate(435, 205)">
                <circle r="115" fill="url(#cuvetteGlow)" />
                <circle r="108" fill="#070b14" stroke="#1e293b" strokeWidth="2.5" />

                {/* Rotating 24-Cuvette Reaction Ring */}
                <g
                  style={{
                    transform: `rotate(${cuvetteWheelAngleDeg}deg)`,
                    transition: 'transform 300ms linear',
                  }}
                >
                  {Array.from({ length: 24 }, (_, idx) => {
                    const angle = (idx * 15 * Math.PI) / 180;
                    const x = Math.cos(angle) * 86;
                    const y = Math.sin(angle) * 86;
                    const isFiring = idx % 6 === 0;
                    return (
                      <rect
                        key={idx}
                        x={x - 4}
                        y={y - 7}
                        width="8"
                        height="14"
                        rx="2"
                        transform={`rotate(${idx * 15 + 90}, ${x}, ${y})`}
                        fill={isFiring ? '#06b6d4' : '#0f172a'}
                        stroke={isFiring ? '#67e8f9' : '#334155'}
                        strokeWidth="1.2"
                      />
                    );
                  })}
                </g>

                {/* Polychromatic Spectrophotometer LED Firing Beam (340nm - 800nm) */}
                <line
                  x1="-70"
                  y1="0"
                  x2="70"
                  y2="0"
                  stroke={
                    activeWavelengthNm <= 405
                      ? '#a855f7'
                      : activeWavelengthNm <= 546
                      ? '#06b6d4'
                      : activeWavelengthNm <= 600
                      ? '#10b981'
                      : '#f43f5e'
                  }
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />
                <circle r="34" fill="#090d16" stroke="#06b6d4" strokeWidth="1.5" />
                <text
                  y="-6"
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {activeWavelengthNm} nm
                </text>
                <text
                  y="7"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  PHOTOMETER
                </text>
                <text
                  y="18"
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  37.0°C BATH
                </text>
              </g>

              {/* ZONE 3: REFRIGERATED REAGENT COMPARTMENT (RIGHT) */}
              <g transform="translate(715, 205)">
                <circle
                  r="102"
                  fill="#070d19"
                  stroke={arrheniusMetrics.coldChainBreached ? '#f43f5e' : '#06b6d4'}
                  strokeWidth="2.5"
                />
                {activeAnalyzer.parameters.slice(0, 8).map((param, idx) => {
                  const angle = (idx * 45 * Math.PI) / 180;
                  const rx = Math.cos(angle) * 68;
                  const ry = Math.sin(angle) * 68;
                  return (
                    <g key={param.code} transform={`translate(${rx}, ${ry})`}>
                      <rect
                        x="-18"
                        y="-11"
                        width="36"
                        height="22"
                        rx="4"
                        fill="#0f172a"
                        stroke="#06b6d4"
                        strokeWidth="1.2"
                      />
                      <text
                        y="3"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {param.code}
                      </text>
                    </g>
                  );
                })}
                <circle r="32" fill="#030712" stroke="#334155" strokeWidth="1.5" />
                <text
                  y="-4"
                  textAnchor="middle"
                  fill={arrheniusMetrics.coldChainBreached ? '#f43f5e' : '#10b981'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {arrheniusMetrics.temperatureCelsius}°C
                </text>
                <text
                  y="8"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  REAGENT R1/R2
                </text>
              </g>

              {/* ZONE 4: DUAL ROBOTIC PIPETTING ARMS (TOP GANTRY BRIDGE) */}
              <rect
                x="40"
                y="18"
                width="780"
                height="12"
                rx="4"
                fill="#1e293b"
                stroke="#334155"
              />

              {/* S1 Sample Probe Arm */}
              <g
                transform={`translate(${sampleProbeDipPct > 0 ? 238 : 205}, 14)`}
                style={{ transition: 'transform 350ms ease-in-out' }}
              >
                <rect
                  x="-18"
                  y="0"
                  width="36"
                  height="20"
                  rx="4"
                  fill="#0f172a"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="13"
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ARM-S1
                </text>
                {/* Vertical Z-Axis Needle */}
                <rect
                  x="-2.5"
                  y="20"
                  width="5"
                  height={42 + sampleProbeDipPct * 0.65}
                  fill="url(#probeMetallic)"
                />
                {/* LLD Tip */}
                <circle
                  cx="0"
                  cy={62 + sampleProbeDipPct * 0.65}
                  r="4.5"
                  fill={
                    clotDetectedLock
                      ? '#f43f5e'
                      : lldCapacitanceTriggered
                      ? '#06b6d4'
                      : '#10b981'
                  }
                />
              </g>

              {/* R1 Reagent Probe Arm */}
              <g
                transform={`translate(${reagentProbeDipPct > 0 ? 565 : 610}, 14)`}
                style={{ transition: 'transform 350ms ease-in-out' }}
              >
                <rect
                  x="-18"
                  y="0"
                  width="36"
                  height="20"
                  rx="4"
                  fill="#0f172a"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="13"
                  textAnchor="middle"
                  fill="#d8b4fe"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ARM-R1
                </text>
                <rect
                  x="-2.5"
                  y="20"
                  width="5"
                  height={42 + reagentProbeDipPct * 0.65}
                  fill="url(#probeMetallic)"
                />
                <circle
                  cx="0"
                  cy={62 + reagentProbeDipPct * 0.65}
                  r="4.5"
                  fill="#a855f7"
                />
              </g>

              {/* Status Overlay Captions */}
              <text x="18" y="376" fill="#64748b" fontSize="9" fontFamily="monospace">
                GANTRY Z-AXIS S1: {sampleProbeDipPct}% | R1: {reagentProbeDipPct}% | WEIBULL CYCLES: {pipetteCyclesExecuted}
              </text>
            </svg>
          </div>

          {/* HIL SPECTRAL INTERFERENCE SLIDERS & SYSMEX SCATTERGRAM ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* CLSI EP07 HIL Interference Live Controls */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" /> CLSI EP07 3rd Ed. HIL Indices
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  570/600nm &amp; 660/700nm Bichromatic
                </span>
              </div>
              <div className="space-y-2.5 text-xs font-mono">
                <div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hemolysis (H-Index)</span>
                    <span
                      className={
                        hilIndices.hemolysisMgDl > 60
                          ? 'text-rose-400 font-bold'
                          : 'text-emerald-400'
                      }
                    >
                      {hilIndices.hemolysisMgDl} mg/dL Hb
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={hilIndices.hemolysisMgDl}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const nextHil = {
                        ...hilIndices,
                        hemolysisMgDl: val,
                      };
                      setHilIndices(nextHil);
                      setEvaluatedResults(
                        evaluateAnalyzerSampleRun(activeAnalyzer, nextHil, 'NONE', runCounter)
                      );
                      nexusStore?.actions.updateHilSimulator({ hemolysis: val });
                    }}
                    className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Icterus (I-Index)</span>
                    <span
                      className={
                        hilIndices.icterusMgDl > 15
                          ? 'text-amber-400 font-bold'
                          : 'text-emerald-400'
                      }
                    >
                      {hilIndices.icterusMgDl} mg/dL Bilirubin
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={0.5}
                    value={hilIndices.icterusMgDl}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const nextHil = {
                        ...hilIndices,
                        icterusMgDl: val,
                      };
                      setHilIndices(nextHil);
                      setEvaluatedResults(
                        evaluateAnalyzerSampleRun(activeAnalyzer, nextHil, 'NONE', runCounter)
                      );
                      nexusStore?.actions.updateHilSimulator({ icterus: val });
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lipemia (L-Index)</span>
                    <span
                      className={
                        hilIndices.lipemiaIndex > 150
                          ? 'text-purple-400 font-bold'
                          : 'text-emerald-400'
                      }
                    >
                      {hilIndices.lipemiaIndex} Intralipid Units
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={400}
                    value={hilIndices.lipemiaIndex}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const nextHil = {
                        ...hilIndices,
                        lipemiaIndex: val,
                      };
                      setHilIndices(nextHil);
                      setEvaluatedResults(
                        evaluateAnalyzerSampleRun(activeAnalyzer, nextHil, 'NONE', runCounter)
                      );
                      nexusStore?.actions.updateHilSimulator({ lipemia: val });
                    }}
                    className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SYSMEX XN-1000 5-PART DIFF SCATTERGRAM & BULL'S X_B MONITOR */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Sysmex WDF 5-Part Scattergram &amp; Bull&apos;s X_B
                </span>
                <span className="text-[11px] font-mono text-cyan-300">
                  X_B(N=20): {bullsState.latestXb} fL ({bullsState.driftPct >= 0 ? '+' : ''}
                  {bullsState.driftPct}%)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <svg
                  viewBox="0 0 250 135"
                  className="w-44 h-28 bg-[#030712] border border-slate-800 rounded-lg shrink-0"
                >
                  <line x1="20" y1="115" x2="240" y2="115" stroke="#334155" strokeWidth="1" />
                  <line x1="20" y1="10" x2="20" y2="115" stroke="#334155" strokeWidth="1" />
                  <text x="125" y="129" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                    SSC (Internal Complexity)
                  </text>
                  <text
                    x="10"
                    y="65"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="7"
                    fontFamily="monospace"
                    transform="rotate(-90, 10, 65)"
                  >
                    SFL / FSC
                  </text>
                  {scattergramPoints.map((pt) => (
                    <circle
                      key={pt.id}
                      cx={20 + (pt.ssc / 250) * 215}
                      cy={115 - (pt.fsc / 250) * 100}
                      r="2"
                      fill={pt.colorHex}
                      opacity="0.85"
                    />
                  ))}
                </svg>

                <div className="text-[11px] font-mono space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400">● NEUT</span>
                    <span>58.4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400">● LYMPH</span>
                    <span>31.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">● MONO</span>
                    <span>6.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400">● EO</span>
                    <span>2.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400">● BASO</span>
                    <span>0.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: WESTGARD MULTI-RULE MATRIX & ARRHENIUS SHELF-LIFE CURVE */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* WESTGARD MULTI-RULE EVALUATION MATRIX */}
          <div className="backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                  REAL-TIME STATISTICAL QC ENGINE
                </span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Westgard Multi-Rule Evaluation Matrix ({primaryParam.code})
                </h2>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                  westgardEvaluation.isLocked
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : westgardEvaluation.violatedRule === '1_2s_WARNING'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {westgardEvaluation.violatedRule}
              </span>
            </div>

            {/* LEVEY-JENNINGS SVG CHART */}
            <div className="bg-[#02050e] border border-slate-800 rounded-xl p-2.5 mb-3">
              <svg viewBox="0 0 460 140" className="w-full h-auto">
                {/* SD Reference Lines (+3SD, +2SD, Mean, -2SD, -3SD) */}
                <line x1="32" y1="15" x2="445" y2="15" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="32" y1="36" x2="445" y2="36" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="32" y1="70" x2="445" y2="70" stroke="#10b981" strokeWidth="1.2" />
                <line x1="32" y1="104" x2="445" y2="104" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="32" y1="125" x2="445" y2="125" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />

                <text x="4" y="18" fill="#f43f5e" fontSize="8" fontFamily="monospace">+3s</text>
                <text x="4" y="39" fill="#f59e0b" fontSize="8" fontFamily="monospace">+2s</text>
                <text x="4" y="73" fill="#10b981" fontSize="8" fontFamily="monospace">Mean</text>
                <text x="4" y="107" fill="#f59e0b" fontSize="8" fontFamily="monospace">-2s</text>
                <text x="4" y="128" fill="#f43f5e" fontSize="8" fontFamily="monospace">-3s</text>

                {/* Polyline connecting Z-Scores */}
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  points={westgardEvaluation.zScoreHistory
                    .map((z, idx) => {
                      const x =
                        45 +
                        (idx / Math.max(1, westgardEvaluation.zScoreHistory.length - 1)) * 390;
                      const clampedZ = Math.max(-3.6, Math.min(3.6, z));
                      const y = 70 - (clampedZ / 3.0) * 55;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {westgardEvaluation.zScoreHistory.map((z, idx) => {
                  const x =
                    45 +
                    (idx / Math.max(1, westgardEvaluation.zScoreHistory.length - 1)) * 390;
                  const clampedZ = Math.max(-3.6, Math.min(3.6, z));
                  const y = 70 - (clampedZ / 3.0) * 55;
                  const ptColor =
                    Math.abs(z) > 3.0
                      ? '#f43f5e'
                      : Math.abs(z) > 2.0
                      ? '#f59e0b'
                      : '#10b981';
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={ptColor}
                      stroke="#030712"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            </div>

            {/* WESTGARD RULE BADGES */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3 text-[11px] font-mono">
              {[
                { label: '1_2s', rule: '1_2s_WARNING' },
                { label: '1_3s', rule: '1_3s_RANDOM_REJECT' },
                { label: '2_2s', rule: '2_2s_SYSTEMATIC_LOCK' },
                { label: 'R_4s', rule: 'R_4s_RANGE_REJECT' },
                { label: '4_1s', rule: '4_1s_DRIFT_LOCK' },
                { label: '10_x', rule: '10_x_BIAS_LOCK' },
              ].map((item) => {
                const isTriggered = westgardEvaluation.violatedRule === item.rule;
                return (
                  <div
                    key={item.label}
                    className={`rounded-lg py-1.5 px-2 text-center border ${
                      isTriggered
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>

            {/* INTERACTIVE QC FAILURE INJECTORS */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleInjectWestgardFailure('1_3s')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 text-xs font-mono"
              >
                Inject 1_3s Random Error
              </button>
              <button
                type="button"
                onClick={() => handleInjectWestgardFailure('2_2s')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-mono"
              >
                Inject 2_2s Systematic Drift
              </button>
              <button
                type="button"
                onClick={() => handleInjectWestgardFailure('R_4s')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 text-xs font-mono"
              >
                Inject R_4s Dispersion
              </button>
              <button
                type="button"
                onClick={handleRecalibrateWestgardUnlock}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-xs font-mono ml-auto flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset QC
              </button>
            </div>
          </div>

          {/* ARRHENIUS REAGENT THERMAL DEGRADATION & COLD-CHAIN MONITOR */}
          <div className="backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                  ARRHENIUS CHEMICAL KINETICS // k = A·exp(-Ea/RT)
                </span>
                <h3 className="text-sm font-bold text-white">
                  Reagent Compartment Bio-Stability Curve
                </h3>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                  arrheniusMetrics.coldChainBreached
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}
              >
                Shelf Life: {arrheniusMetrics.remainingShelfLifeHours} hrs
              </span>
            </div>

            <div className="bg-[#02050e] border border-slate-800 rounded-xl p-2.5">
              <svg viewBox="0 0 440 95" className="w-full h-auto">
                <line x1="30" y1="80" x2="425" y2="80" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="10" x2="30" y2="80" stroke="#334155" strokeWidth="1" />
                <text x="4" y="16" fill="#94a3b8" fontSize="8" fontFamily="monospace">100%</text>
                <text x="4" y="80" fill="#94a3b8" fontSize="8" fontFamily="monospace">50%</text>
                <polyline
                  fill="none"
                  stroke={arrheniusMetrics.coldChainBreached ? '#f43f5e' : '#10b981'}
                  strokeWidth="2.5"
                  points={arrheniusMetrics.degradationCurvePoints
                    .map((pt, idx) => {
                      const x =
                        32 +
                        (idx /
                          Math.max(1, arrheniusMetrics.degradationCurvePoints.length - 1)) *
                          390;
                      const y = 80 - ((Math.max(50, pt.potencyPct) - 50) / 50) * 66;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
              <span>Rate Constant k: {arrheniusMetrics.rateConstantK} s⁻¹</span>
              <span>Thermal Acceleration vs 4°C: {arrheniusMetrics.accelerationFactorVs4C}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* PARAMETER METROLOGY GRID (CLSI EP07 BIAS + PANIC FLAGS) */}
      <section className="backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
              QUANTITATIVE ANALYTE MATRIX // LOINC &amp; CLSI EP07 VERIFIED
            </span>
            <h2 className="text-base font-bold text-white">
              Real-Time Photometric &amp; Chemiluminescent Assay Readouts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Active Specimen: {SIMULATED_LIS_PATIENT_ORDERS[selectedAnalyzerId][0].barcode} (
            {SIMULATED_LIS_PATIENT_ORDERS[selectedAnalyzerId][0].patientName})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">ASSAY CODE</th>
                <th className="py-2.5 px-3">PARAMETER NAME</th>
                <th className="py-2.5 px-3">LOINC</th>
                <th className="py-2.5 px-3">WAVELENGTH</th>
                <th className="py-2.5 px-3">TRUE VALUE</th>
                <th className="py-2.5 px-3">OBSERVED RESULT</th>
                <th className="py-2.5 px-3">HIL BIAS</th>
                <th className="py-2.5 px-3">REF RANGE</th>
                <th className="py-2.5 px-3">STATUS FLAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {evaluatedResults.map((item) => {
                const isPanic = item.flag === 'HH' || item.flag === 'LL';
                const isHil = item.gatedRejected;
                return (
                  <tr
                    key={item.code}
                    className={`transition-colors ${
                      isPanic
                        ? 'bg-rose-950/30 hover:bg-rose-950/50'
                        : isHil
                        ? 'bg-amber-950/25 hover:bg-amber-950/40'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-cyan-300">{item.code}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans">{item.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.loinc}</td>
                    <td className="py-2.5 px-3 text-purple-300">{item.wavelengthNm} nm</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {item.trueUnbiasedValue} {item.units}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {isHil ? (
                        <span className="text-amber-400">GATED (HIL_REJECT)</span>
                      ) : (
                        `${item.value} ${item.units}`
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 ${
                        Math.abs(item.hilBiasPct) > 5
                          ? 'text-amber-400 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.hilBiasPct >= 0 ? '+' : ''}
                      {item.hilBiasPct}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {item.referenceRange} {item.units}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isPanic
                            ? 'bg-rose-500/25 border-rose-500 text-rose-300'
                            : isHil
                            ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                            : item.flag === 'H' || item.flag === 'L'
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {item.flag}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* BI-DIRECTIONAL TELEMETRY TERMINAL & HEX OSCILLOSCOPE (DUAL-PANE) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PANE A: DECODED ASTM E1394 / HL7 v2.5.1 FRAME STREAM (7 COLS) */}
        <div className="lg:col-span-7 backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                  PANE A // BI-DIRECTIONAL ASTM E1381/E1394 &amp; HL7 MLLP STREAM
                </span>
                <h3 className="text-sm font-bold text-white">
                  Decoded Frame Terminal (Click any frame to inspect raw hex bytes)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setWireProtocolMode('ASTM_E1394')}
                className={`px-2.5 py-1 rounded-lg border ${
                  wireProtocolMode === 'ASTM_E1394'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                ASTM E1394
              </button>
              <button
                type="button"
                onClick={() => setWireProtocolMode('HL7_MLLP')}
                className={`px-2.5 py-1 rounded-lg border ${
                  wireProtocolMode === 'HL7_MLLP'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                HL7 v2.5.1 MLLP
              </button>
            </div>
          </div>

          <div className="bg-[#02050e] border border-slate-800/90 rounded-xl p-3 font-mono text-xs space-y-1.5 max-h-[380px] overflow-y-auto">
            {telemetryPackets.map((pkt) => {
              const isSelected = inspectedPacket?.id === pkt.id;
              const badgeColor =
                pkt.recordType === 'ENQ' || pkt.recordType === 'ACK' || pkt.recordType === 'EOT'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : pkt.recordType === 'Q'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : pkt.recordType === 'P' || pkt.recordType === 'O'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : pkt.recordType === 'R'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div
                  key={pkt.id}
                  onClick={() => setSelectedPacketId(pkt.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900/95 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.18)]'
                      : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {pkt.recordType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {pkt.direction === 'ANALYZER_TO_LIS' ? 'ANALYZER ➔ LIS' : 'LIS ➔ ANALYZER'}
                      </span>
                      {pkt.frameSequenceNumber !== undefined && (
                        <span className="text-[10px] text-cyan-400">
                          FRAME #{pkt.frameSequenceNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {pkt.checksumHex && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                          CS: 0x{pkt.checksumHex} ✓
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {pkt.timestampIso.slice(11, 23)}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-200 break-all whitespace-pre-wrap leading-relaxed">
                    {renderHighlightedFrameText(pkt.decodedText)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANE B: RAW BYTE HEX INSPECTOR & MLLP/ASTM FRAMING OSCILLOSCOPE (5 COLS) */}
        <div className="lg:col-span-5 backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 block">
                  PANE B // WIRE-LEVEL BYTE &amp; CHECKSUM INSPECTOR
                </span>
                <h3 className="text-sm font-bold text-white">
                  Raw Hex Oscilloscope (&lt;STX&gt; 0x02 ... &lt;ETX&gt; 0x03)
                </h3>
              </div>
            </div>
            {inspectedPacket?.checksumHex && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                MOD-256: 0x{inspectedPacket.checksumHex}
              </span>
            )}
          </div>

          <div className="bg-[#02050e] border border-slate-800/90 rounded-xl p-3 font-mono text-xs flex-1 max-h-[380px] overflow-y-auto">
            {inspectedPacket ? (
              <>
                <div className="mb-3 pb-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>PACKET ID: {inspectedPacket.id}</span>
                  <span>BYTES: {inspectedPacket.rawBytes.length}</span>
                </div>

                {/* Wire Control Token Strip */}
                <div className="flex flex-wrap gap-1.5">
                  {inspectedPacket.hexInspectorRows.map((tok, i) => (
                    <div
                      key={`${tok.offsetHex}-${i}`}
                      className={`px-1.5 py-1 rounded border text-center min-w-[38px] ${
                        tok.isControlChar
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] text-cyan-400">0x{tok.byteHex}</div>
                      <div className="text-[10px] mt-0.5">{tok.asciiDisplay}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-12">
                Select or execute an ASTM/MLLP cycle to inspect wire-level bytes.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VirtualAnalyzerMasterDeck;
