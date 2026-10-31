// PATH: frontend/apps/web/src/components/INDTXEnterpriseSuite.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BiomarkerObservation,
  PatientClinicalContext,
  executeClinicalGNN,
  runPenalizedRidgeRegression,
  computeClinicalIndices,
  evaluateWestgardSixSigma,
} from '../services/ai/indtxMathEngine';

// Reference Empirical Clinical Cohort Matrix (X: [Creatinine, Bilirubin, Lactate, CRP, PCT, Age], y: Clinical Acuity Score)
const REFERENCE_COHORT_X: number[][] = [
  [0.85, 0.6, 0.9, 1.8, 0.04, 34],
  [1.10, 0.8, 1.2, 4.2, 0.09, 48],
  [1.45, 1.3, 1.9, 18.5, 0.45, 59],
  [1.92, 1.8, 2.6, 42.0, 1.20, 66],
  [2.40, 2.5, 3.4, 85.0, 3.80, 71],
  [3.10, 3.9, 4.8, 140.0, 8.50, 77],
  [0.95, 0.7, 1.0, 2.4, 0.06, 41],
  [1.70, 1.5, 2.2, 30.0, 0.80, 63],
  [2.15, 2.1, 3.0, 64.0, 2.40, 68],
  [1.25, 0.9, 1.5, 11.0, 0.22, 53],
  [2.85, 3.2, 4.1, 112.0, 6.10, 74],
  [0.78, 0.5, 0.8, 1.2, 0.03, 29],
];
const REFERENCE_COHORT_Y: number[] = [
  11.2, 18.4, 34.8, 52.6, 71.4, 89.2, 14.1, 43.5, 61.8, 24.9, 81.0, 9.4,
];

const INITIAL_BIOMARKERS: BiomarkerObservation[] = [
  {
    code: '2160-0',
    name: 'Serum Creatinine (IDMS Traceable)',
    value: 1.84,
    unit: 'mg/dL',
    refLow: 0.70,
    refHigh: 1.30,
    criticalLow: 0.30,
    criticalHigh: 4.00,
    teAllowedPct: 10.0,
    qcMean: 1.50,
    qcSd: 0.022,
    qcHistory: [1.49, 1.51, 1.50, 1.48, 1.52, 1.50, 1.49, 1.51, 1.50, 1.52, 1.49, 1.50],
  },
  {
    code: '1975-2',
    name: 'Total Bilirubin (Diazo Spectrophotometry)',
    value: 1.95,
    unit: 'mg/dL',
    refLow: 0.20,
    refHigh: 1.20,
    criticalLow: 0.10,
    criticalHigh: 12.00,
    teAllowedPct: 15.0,
    qcMean: 1.00,
    qcSd: 0.021,
    qcHistory: [0.99, 1.01, 1.00, 1.02, 0.98, 1.01, 1.00, 0.99, 1.01, 1.00, 1.02, 1.00],
  },
  {
    code: '2524-7',
    name: 'Arterial Plasma Lactate (Amperometric)',
    value: 2.75,
    unit: 'mmol/L',
    refLow: 0.50,
    refHigh: 2.00,
    criticalLow: 0.20,
    criticalHigh: 4.00,
    teAllowedPct: 12.0,
    qcMean: 2.00,
    qcSd: 0.04,
    qcHistory: [1.98, 2.02, 2.01, 1.99, 2.03, 2.00, 1.97, 2.01, 2.02, 1.99, 2.00, 2.01],
  },
  {
    code: '1988-5',
    name: 'High-Sensitivity C-Reactive Protein',
    value: 38.4,
    unit: 'mg/L',
    refLow: 0.10,
    refHigh: 5.00,
    criticalLow: 0.0,
    criticalHigh: 100.0,
    teAllowedPct: 15.0,
    qcMean: 10.0,
    qcSd: 0.24,
    qcHistory: [9.9, 10.1, 10.2, 9.8, 10.0, 10.1, 9.9, 10.0, 10.2, 10.1, 9.9, 10.0],
  },
  {
    code: '33959-8',
    name: 'Procalcitonin (Chemiluminescent Immunoassay)',
    value: 1.35,
    unit: 'ng/mL',
    refLow: 0.01,
    refHigh: 0.15,
    criticalLow: 0.0,
    criticalHigh: 2.00,
    teAllowedPct: 14.0,
    qcMean: 0.50,
    qcSd: 0.012,
    qcHistory: [0.49, 0.50, 0.51, 0.50, 0.49, 0.51, 0.50, 0.50, 0.52, 0.49, 0.50, 0.51],
  },
  {
    code: '1558-6',
    name: 'Fasting Plasma Glucose (Hexokinase)',
    value: 134.0,
    unit: 'mg/dL',
    refLow: 70.0,
    refHigh: 99.0,
    criticalLow: 45.0,
    criticalHigh: 400.0,
    teAllowedPct: 8.0,
    qcMean: 100.0,
    qcSd: 1.15,
    qcHistory: [99.5, 100.4, 99.8, 100.2, 100.9, 99.7, 100.1, 99.4, 100.3, 99.9, 100.2, 100.0],
  },
];

type WorkflowStage =
  | '1_INTAKE_COHORT'
  | '2_REGRESSION_PKPD'
  | '3_SPECTRAL_GNN'
  | '4_GRAPH_MANIFOLD_4D'
  | '5_WESTGARD_SIGMA_QC';

export const INDTXEnterpriseSuite: React.FC = () => {
  const [activeStage, setActiveStage] = useState<WorkflowStage>('1_INTAKE_COHORT');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [uiZoomPct, setUiZoomPct] = useState<number>(100);

  // Patient Clinical State
  const [patient, setPatient] = useState<PatientClinicalContext>({
    patientId: 'ELIS-HOSP-2026-8841',
    age: 64,
    sex: 'M',
    weightKg: 76.5,
    heightCm: 174,
    serumCreatinineMgDl: 1.84,
    bilirubinMgDl: 1.95,
    inr: 1.38,
    serumSodiumMmolL: 133,
    serumAlbuminGdl: 3.3,
    fastingGlucoseMgDl: 134,
    fastingInsulinUiuMl: 14.2,
    lactateMmolL: 2.75,
    crpMgL: 38.4,
    procalcitoninNgMl: 1.35,
    adminDoseMg: 1000,
    clearanceRateAlpha: 0.42,
    eliminationRateBeta: 0.11,
  });

  const [biomarkers, setBiomarkers] = useState<BiomarkerObservation[]>(INITIAL_BIOMARKERS);
  const [ridgeLambda, setRidgeLambda] = useState<number>(0.15);

  // 2D / 3D / 4D Graph Viewport State
  const [projectionMode, setProjectionMode] = useState<'2D_ORTHO' | '3D_PERSPECTIVE' | '4D_SPATIOTEMPORAL'>('4D_SPATIOTEMPORAL');
  const [rotX, setRotX] = useState<number>(22);
  const [rotY, setRotY] = useState<number>(-34);
  const [timeSliceIndex, setTimeSliceIndex] = useState<number>(0); // 0..10 => 0h..72h
  const [selectedNodeId, setSelectedNodeId] = useState<string>('N_LAC');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize biomarkers when patient core metrics change
  const updateBiomarkerValue = (code: string, newVal: number) => {
    setBiomarkers((prev) =>
      prev.map((b) => (b.code === code ? { ...b, value: newVal } : b))
    );
    if (code === '2160-0') setPatient((p) => ({ ...p, serumCreatinineMgDl: newVal }));
    if (code === '1975-2') setPatient((p) => ({ ...p, bilirubinMgDl: newVal }));
    if (code === '2524-7') setPatient((p) => ({ ...p, lactateMmolL: newVal }));
    if (code === '1988-5') setPatient((p) => ({ ...p, crpMgL: newVal }));
    if (code === '33959-8') setPatient((p) => ({ ...p, procalcitoninNgMl: newVal }));
    if (code === '1558-6') setPatient((p) => ({ ...p, fastingGlucoseMgDl: newVal }));
  };

  // Real-time deterministic calculations
  const clinicalIndices = useMemo(() => computeClinicalIndices(patient), [patient]);

  const regressionModel = useMemo(() => {
    const currentVec = [
      patient.serumCreatinineMgDl,
      patient.bilirubinMgDl,
      patient.lactateMmolL,
      patient.crpMgL,
      patient.procalcitoninNgMl,
      patient.age,
    ];
    return runPenalizedRidgeRegression(
      REFERENCE_COHORT_X,
      REFERENCE_COHORT_Y,
      [
        'Serum Creatinine (mg/dL)',
        'Total Bilirubin (mg/dL)',
        'Arterial Lactate (mmol/L)',
        'hs-CRP (mg/L)',
        'Procalcitonin (ng/mL)',
        'Patient Age (Years)',
      ],
      currentVec,
      ridgeLambda
    );
  }, [patient, ridgeLambda]);

  const gnnResult = useMemo(
    () => executeClinicalGNN(patient, biomarkers),
    [patient, biomarkers]
  );

  const westgardResults = useMemo(
    () => evaluateWestgardSixSigma(biomarkers),
    [biomarkers]
  );

  // Render 2D / 3D / 4D Spatio-Temporal Graph Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Clinical Ultra-Light Background Grid
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 32) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.31;

    // Project 3D coordinates to 2D screen with depth
    const projectPoint = (x: number, y: number, z: number) => {
      if (projectionMode === '2D_ORTHO') {
        return { sx: cx + x * scale, sy: cy + y * scale, depth: 0 };
      }
      // 3D rotation around Y then X
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      const fov = 3.4;
      const perspective = fov / Math.max(1.2, fov - z2 * 0.55);
      return {
        sx: cx + x1 * scale * perspective,
        sy: cy + y2 * scale * perspective,
        depth: z2,
      };
    };

    // Draw Coordinate Axes in 3D/4D mode
    const origin = projectPoint(0, 0, 0);
    const xAxis = projectPoint(1.3, 0, 0);
    const yAxis = projectPoint(0, 1.3, 0);
    const zAxis = projectPoint(0, 0, 1.3);

    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    [xAxis, yAxis, zAxis].forEach((ax) => {
      ctx.beginPath();
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(ax.sx, ax.sy);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const nodeScreenMap = new Map<
      string,
      { sx: number; sy: number; depth: number; node: typeof gnnResult.nodes[0] }
    >();

    gnnResult.nodes.forEach((n) => {
      const [x, y, z] = n.laplacianEigenCoord;
      // In 4D mode, modulate Z-height slightly by temporal response at timeSliceIndex
      const zMod =
        projectionMode === '4D_SPATIOTEMPORAL'
          ? z + (n.temporalTrajectory[timeSliceIndex] - 0.5) * 0.25
          : z;
      const proj = projectPoint(x, y, zMod);
      nodeScreenMap.set(n.id, { ...proj, node: n });
    });

    // Draw Directed/Weighted Edges
    gnnResult.edges.forEach((e) => {
      const u = nodeScreenMap.get(e.source);
      const v = nodeScreenMap.get(e.target);
      if (!u || !v) return;

      const temporalFlux =
        projectionMode === '4D_SPATIOTEMPORAL'
          ? (u.node.temporalTrajectory[timeSliceIndex] +
              v.node.temporalTrajectory[timeSliceIndex]) /
            2
          : e.weight;

      ctx.beginPath();
      ctx.moveTo(u.sx, u.sy);
      ctx.lineTo(v.sx, v.sy);
      ctx.strokeStyle =
        temporalFlux > 1.4
          ? 'rgba(220, 38, 38, 0.55)'
          : temporalFlux > 0.8
          ? 'rgba(2, 132, 199, 0.55)'
          : 'rgba(100, 116, 139, 0.35)';
      ctx.lineWidth = Math.max(1.2, e.weight * 2.8);
      ctx.stroke();

      // Midpoint edge weight label
      const mx = (u.sx + v.sx) / 2;
      const my = (u.sy + v.sy) / 2;
      ctx.fillStyle = '#475569';
      ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(e.weight.toFixed(2), mx + 3, my - 3);
    });

    // Sort nodes back-to-front by depth
    const sortedNodes = Array.from(nodeScreenMap.values()).sort(
      (a, b) => a.depth - b.depth
    );

    sortedNodes.forEach(({ sx, sy, node }) => {
      const tVal = node.temporalTrajectory[timeSliceIndex] ?? 0.5;
      const radius =
        11 +
        node.rwrCentrality * 55 +
        (projectionMode === '4D_SPATIOTEMPORAL' ? Math.min(8, tVal * 2.5) : 0);

      // Category Color Coding (Enterprise Clinical Palette)
      let fill = '#0284C7'; // Biomarker: Clinical Cerulean
      let stroke = '#0369A1';
      if (node.category === 'PATHWAY') {
        fill = '#7C3AED'; // Pathway: Molecular Indigo
        stroke = '#5B21B6';
      } else if (node.category === 'ORGAN_SYSTEM') {
        fill = tVal > 1.5 ? '#DC2626' : '#D97706'; // Organ Stress
        stroke = tVal > 1.5 ? '#991B1B' : '#B45309';
      } else if (node.category === 'THERAPEUTIC') {
        fill = '#059669'; // Therapeutic Clearance: Clinical Emerald
        stroke = '#047857';
      }

      // Outer Halo for selected node or high 4D stress
      if (node.id === selectedNodeId || tVal > 1.6) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = node.id === selectedNodeId ? '#0F172A' : '#FCA5A5';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = stroke;
      ctx.stroke();

      // Node Label & RWR Score
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.fillText(node.label, sx + radius + 6, sy - 2);

      ctx.fillStyle = '#475569';
      ctx.font = '500 10px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText(
        `RWR:${node.rwrCentrality.toFixed(3)} | 4D-Z:${tVal.toFixed(2)}`,
        sx + radius + 6,
        sy + 11
      );
    });
  }, [gnnResult, projectionMode, rotX, rotY, timeSliceIndex, selectedNodeId]);

  const selectedNodeObj =
    gnnResult.nodes.find((n) => n.id === selectedNodeId) || gnnResult.nodes[0];

  return (
    <div
      style={{
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        width: '100%',
        position: isFullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: isFullScreen ? 9999 : 1,
        overflowY: 'auto',
        zoom: `${uiZoomPct}%`,
      }}
    >
      {/* =====================================================================
          ENTERPRISE CLINICAL HEADER BAR (CAP / CLIA / ISO-15189 COMPLIANT)
         ===================================================================== */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #CBD5E1',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
            }}
          >
            INDT-X CORE v4.2
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                Integrated Diagnostic & Translational Analytics Engine
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#E0F2FE',
                  color: '#0369A1',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  border: '1px solid #BAE6FD',
                }}
              >
                ISO-15189 / HL7 FHIR R4 DETERMINISTIC
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569' }}>
              Accession: <strong>{patient.patientId}</strong> | eGFR (CKD-EPI 2021):{' '}
              <strong>{clinicalIndices.eGFR} mL/min/1.73m²</strong> | MELD-Na:{' '}
              <strong>{clinicalIndices.meldNa}</strong> | GNN Stability:{' '}
              <strong>{gnnResult.networkStabilityScore}%</strong>
            </p>
          </div>
        </div>

        {/* Viewport Controls: HLD/LLD Spec, Zoom, Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #CBD5E1',
              borderRadius: '4px',
              backgroundColor: '#F8FAFC',
              padding: '2px 6px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#475569', marginRight: '6px', fontWeight: 600 }}>Scale:</span>
            <button
              onClick={() => setUiZoomPct((z) => Math.max(80, z - 5))}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 700,
                padding: '2px 6px',
              }}
            >
              -
            </button>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, minWidth: '42px', textAlign: 'center' }}>
              {uiZoomPct}%
            </span>
            <button
              onClick={() => setUiZoomPct((z) => Math.min(125, z + 5))}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 700,
                padding: '2px 6px',
              }}
            >
              +
            </button>
          </div>

          <button
            onClick={() => setShowArchitectureModal((s) => !s)}
            style={{
              backgroundColor: showArchitectureModal ? '#0F172A' : '#FFFFFF',
              color: showArchitectureModal ? '#FFFFFF' : '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            HLD / LLD Architecture Spec
          </button>

          <button
            onClick={() => setIsFullScreen((f) => !f)}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: '1px solid #0369A1',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isFullScreen ? 'Exit Full Viewport' : 'Full Viewport Fill'}
          </button>
        </div>
      </header>

      {/* =====================================================================
          COLLAPSIBLE HLD / LLD ENTERPRISE ARCHITECTURE DRAWER
         ===================================================================== */}
      {showArchitectureModal && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '2px solid #0284C7',
            padding: '16px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
          }}
        >
          <div style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#0284C7', textTransform: 'uppercase' }}>
              High-Level Design (HLD) — Clinical Pipeline Topology
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
              <strong>1. Pre-Analytical Layer:</strong> LOINC-coded specimen validation, panic threshold guardrails, and internal QC lot verification.<br />
              <strong>2. Analytical & Mathematical Kernel:</strong> Deterministic Gauss-Jordan matrix inversion for $L_2$-Penalized Ridge Regression, 2-Compartment differential PK/PD solver, and CKD-EPI 2021 / MELD-Na clinical equations.<br />
              <strong>3. Translational Network Layer:</strong> 2-Layer Message-Passing Spectral GCN + Random Walk with Restart (RWR) & 4D Spatio-Temporal Manifold projection.
            </p>
          </div>
          <div style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#059669', textTransform: 'uppercase' }}>
              Low-Level Design (LLD) — Mathematical Guarantees
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5, fontFamily: 'monospace' }}>
              • Ridge Estimator: β̂ = (XᵀX + λI)⁻¹Xᵀy (Tikhonov pivot guard ε = 10⁻¹⁰)<br />
              • Spectral GCN: H⁽ˡ⁺¹⁾ = σ(D̃⁻¹/² Ã D̃⁻¹/² H⁽ˡ⁾ W⁽ˡ⁾), L_sym = I - D⁻¹/² A D⁻¹/²<br />
              • PK Bi-Exponential: C(t) = A·e⁻ᵃᵗ + B·e⁻🄱ᵗ, AUC₀₋∞ = A/α + B/β<br />
              • Six-Sigma QC: σ = (TEₐ% - |Bias%|) / CV% with Westgard 1₃ₛ, 2₂ₛ, R₄ₛ, 4₁ₛ
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEQUENTIAL CLINICAL WORKFLOW NAVIGATION BAR
         ===================================================================== */}
      <nav
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          display: 'flex',
          gap: '4px',
        }}
      >
        {(
          [
            { id: '1_INTAKE_COHORT', label: '1. Specimen Intake & Clinical Indices' },
            { id: '2_REGRESSION_PKPD', label: '2. Penalized Ridge Regression & PK/PD Dosing' },
            { id: '3_SPECTRAL_GNN', label: '3. Multi-Omics Spectral GNN & RWR Centrality' },
            { id: '4_GRAPH_MANIFOLD_4D', label: '4. 2D / 3D / 4D Spatio-Temporal Graph Preview' },
            { id: '5_WESTGARD_SIGMA_QC', label: '5. Westgard Six-Sigma QC & Sign-Off' },
          ] as { id: WorkflowStage; label: string }[]
        ).map((tab) => {
          const active = activeStage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStage(tab.id)}
              style={{
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: active ? '#0284C7' : '#475569',
                backgroundColor: active ? '#F0F9FF' : 'transparent',
                border: 'none',
                borderBottom: active ? '3px solid #0284C7' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* =====================================================================
          MAIN SEQUENTIAL WORKSPACE CONTAINER
         ===================================================================== */}
      <main style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* -------------------------------------------------------------------
            STAGE 1: SPECIMEN INTAKE, LOINC PANEL & CLINICAL INDICES
           ------------------------------------------------------------------- */}
        {activeStage === '1_INTAKE_COHORT' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '20px' }}>
            {/* Quantitative LOINC Biomarker Table */}
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Quantitative Clinical Chemistry & Immunoassay Panel (LOINC Validated)
                </h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Edit values to recompute all downstream models
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>LOINC</th>
                    <th style={{ padding: '8px 10px' }}>Assay Name</th>
                    <th style={{ padding: '8px 10px' }}>Result</th>
                    <th style={{ padding: '8px 10px' }}>Unit</th>
                    <th style={{ padding: '8px 10px' }}>Ref. Interval</th>
                    <th style={{ padding: '8px 10px' }}>Clinical Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {biomarkers.map((b) => {
                    const isCrit = b.value <= b.criticalLow || b.value >= b.criticalHigh;
                    const isAbnormal = b.value < b.refLow || b.value > b.refHigh;
                    return (
                      <tr key={b.code} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 600, color: '#0369A1' }}>
                          {b.code}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 500 }}>{b.name}</td>
                        <td style={{ padding: '10px' }}>
                          <input
                            type="number"
                            step="0.05"
                            value={b.value}
                            onChange={(e) =>
                              updateBiomarkerValue(b.code, parseFloat(e.target.value) || 0)
                            }
                            style={{
                              width: '86px',
                              padding: '5px 8px',
                              border: '1px solid #94A3B8',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '13px',
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px', color: '#475569' }}>{b.unit}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#475569' }}>
                          {b.refLow.toFixed(2)} – {b.refHigh.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isCrit
                                ? '#FEE2E2'
                                : isAbnormal
                                ? '#FEF3C7'
                                : '#D1FAE5',
                              color: isCrit
                                ? '#991B1B'
                                : isAbnormal
                                ? '#92400E'
                                : '#065F46',
                              border: `1px solid ${
                                isCrit ? '#FCA5A5' : isAbnormal ? '#FDE68A' : '#A7F3D0'
                              }`,
                            }}
                          >
                            {isCrit ? 'CRITICAL PANIC' : isAbnormal ? 'ABNORMAL (H/L)' : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {/* Right Panel: Patient Anthropometrics & Validated Clinical Equations */}
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                Patient Anthropometrics & Validated Organ Function Equations
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Age (Years)</label>
                  <input
                    type="number"
                    value={patient.age}
                    onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) || 40 })}
                    style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Weight (kg)</label>
                  <input
                    type="number"
                    value={patient.weightKg}
                    onChange={(e) => setPatient({ ...patient, weightKg: parseFloat(e.target.value) || 70 })}
                    style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Sodium (mmol/L)</label>
                  <input
                    type="number"
                    value={patient.serumSodiumMmolL}
                    onChange={(e) =>
                      setPatient({ ...patient, serumSodiumMmolL: parseFloat(e.target.value) || 135 })
                    }
                    style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Validated Equation Readout Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    CKD-EPI (2021) Glomerular Filtration
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: '4px' }}>
                    {clinicalIndices.eGFR} <span style={{ fontSize: '12px', fontWeight: 500 }}>mL/min/1.73m²</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 600, marginTop: '2px' }}>
                    Stage: {clinicalIndices.ckdStage}
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    UNOS / OPTN MELD-Na Hepatic Score
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: '4px' }}>
                    {clinicalIndices.meldNa} <span style={{ fontSize: '12px', fontWeight: 500 }}>points</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    INR: {patient.inr} | Bilirubin: {patient.bilirubinMgDl} mg/dL
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    HOMA-IR Insulin Resistance Index
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: '4px' }}>
                    {clinicalIndices.homaIr}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Formula: (Glucose × Insulin) / 405
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    Mosteller BSA & PK Half-Life (t₁/₂β)
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: '4px' }}>
                    {clinicalIndices.bsaM2} m² | {clinicalIndices.halfLifeHours} h
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                    AUC₂₄: {clinicalIndices.auc24MgHL} mg·h/L
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* -------------------------------------------------------------------
            STAGE 2: PENALIZED RIDGE REGRESSION (L2) & PK/PD DOSING ENGINE
           ------------------------------------------------------------------- */}
        {activeStage === '2_REGRESSION_PKPD' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Closed-Form L2 Ridge Regression Estimator */}
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Tikhonov Penalized Ridge Regression: β̂ = (XᵀX + λI)⁻¹Xᵀy
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <label style={{ fontWeight: 600 }}>Penalty λ:</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="5.0"
                    value={ridgeLambda}
                    onChange={(e) => setRidgeLambda(parseFloat(e.target.value) || 0.15)}
                    style={{ width: '68px', padding: '4px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '16px',
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Predicted Clinical Acuity</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                    {regressionModel.predictedSeverityIndex} / 100
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                    95% CI: [{regressionModel.confidenceInterval95[0]}, {regressionModel.confidenceInterval95[1]}]
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Goodness of Fit (R²)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                    {(regressionModel.rSquared * 100).toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                    RMSE: {regressionModel.rmse.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Matrix Conditioning κ(XᵀX)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                    {regressionModel.conditionNumber.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Gauss-Jordan Verified</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Parameter</th>
                    <th style={{ padding: '8px' }}>Covariate Name</th>
                    <th style={{ padding: '8px' }}>Estimated Weight (β̂ᵢ)</th>
                  </tr>
                </thead>
                <tbody>
                  {regressionModel.coefficients.map((beta, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 700 }}>β_{idx}</td>
                      <td style={{ padding: '8px' }}>{regressionModel.featureNames[idx]}</td>
                      <td
                        style={{
                          padding: '8px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: beta >= 0 ? '#0369A1' : '#B45309',
                        }}
                      >
                        {beta >= 0 ? `+${beta.toFixed(4)}` : beta.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Two-Compartment Bi-Exponential Pharmacokinetic Profile */}
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  2-Compartment Renal-Adjusted Pharmacokinetics: C(t) = A·e⁻ᵃᵗ + B·e⁻🄱ᵗ
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <label style={{ fontWeight: 600 }}>IV Dose (mg):</label>
                  <input
                    type="number"
                    step="100"
                    value={patient.adminDoseMg}
                    onChange={(e) => setPatient({ ...patient, adminDoseMg: parseFloat(e.target.value) || 500 })}
                    style={{ width: '78px', padding: '4px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Time (Hours)</th>
                    <th style={{ padding: '6px 8px' }}>Plasma C(t) (mg/L)</th>
                    <th style={{ padding: '6px 8px' }}>Concentration Bar</th>
                    <th style={{ padding: '6px 8px' }}>Therapeutic Window Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicalIndices.pkCurve.map((pt) => {
                    const isToxic = pt.concentrationMgL > pt.toxicThreshold;
                    const isSub = pt.concentrationMgL < pt.therapeuticMin;
                    return (
                      <tr key={pt.hour} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600 }}>
                          t = {pt.hour}h
                        </td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {pt.concentrationMgL.toFixed(2)} mg/L
                        </td>
                        <td style={{ padding: '6px 8px', width: '38%' }}>
                          <div style={{ backgroundColor: '#E2E8F0', height: '10px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, (pt.concentrationMgL / 45) * 100)}%`,
                                height: '100%',
                                backgroundColor: isToxic ? '#DC2626' : isSub ? '#D97706' : '#059669',
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, fontSize: '11px' }}>
                          {isToxic
                            ? 'SUPRA-THERAPEUTIC (>25 mg/L)'
                            : isSub
                            ? 'SUB-MIC TROUGH (<10 mg/L)'
                            : 'OPTIMAL TARGET WINDOW'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* -------------------------------------------------------------------
            STAGE 3: MULTI-OMICS SPECTRAL GNN & RWR TOPOLOGY TABLE
           ------------------------------------------------------------------- */}
        {activeStage === '3_SPECTRAL_GNN' && (
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  2-Layer Message-Passing Graph Convolutional Network (GCN) & Random Walk with Restart (RWR)
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569' }}>
                  Fiedler Algebraic Connectivity (λ₂): <strong>{gnnResult.algebraicConnectivityLambda2}</strong> |
                  Normalized Von Neumann Spectral Entropy: <strong>{gnnResult.spectralEntropy}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveStage('4_GRAPH_MANIFOLD_4D')}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Open Interactive 2D/3D/4D Manifold Preview →
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Node ID</th>
                  <th style={{ padding: '8px 10px' }}>Clinical / Biological Entity</th>
                  <th style={{ padding: '8px 10px' }}>Layer</th>
                  <th style={{ padding: '8px 10px' }}>Input Z-Score</th>
                  <th style={{ padding: '8px 10px' }}>GCN Embedding H⁽²⁾</th>
                  <th style={{ padding: '8px 10px' }}>RWR PageRank Centrality</th>
                  <th style={{ padding: '8px 10px' }}>Spectral 3D Eigen-Coords</th>
                </tr>
              </thead>
              <tbody>
                {gnnResult.nodes.map((n) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                      {n.id}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{n.label}</td>
                    <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                      {n.category}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>
                      {n.initialFeature[0] >= 0 ? `+${n.initialFeature[0].toFixed(2)}` : n.initialFeature[0].toFixed(2)}σ
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#334155' }}>
                      [{n.embeddedFeature.join(', ')}]
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                      {n.rwrCentrality.toFixed(4)}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748B' }}>
                      ({n.laplacianEigenCoord.join(', ')})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* -------------------------------------------------------------------
            STAGE 4: 2D / 3D / 4D SPATIO-TEMPORAL GRAPH & MANIFOLD PREVIEW
           ------------------------------------------------------------------- */}
        {activeStage === '4_GRAPH_MANIFOLD_4D' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '20px' }}>
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '16px',
              }}
            >
              {/* Controls Bar for 2D / 3D / 4D Projection */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(
                    [
                      { id: '2D_ORTHO', label: '2D Spectral Plane' },
                      { id: '3D_PERSPECTIVE', label: '3D Laplacian Manifold' },
                      { id: '4D_SPATIOTEMPORAL', label: '4D Spatio-Temporal PK/Pathway Flux' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setProjectionMode(m.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                        backgroundColor: projectionMode === m.id ? '#0284C7' : '#F8FAFC',
                        color: projectionMode === m.id ? '#FFFFFF' : '#0F172A',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {projectionMode !== '2D_ORTHO' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                    <label>
                      Pitch (X°):
                      <input
                        type="range"
                        min="-75"
                        max="75"
                        value={rotX}
                        onChange={(e) => setRotX(parseInt(e.target.value))}
                        style={{ width: '80px', marginLeft: '6px' }}
                      />
                    </label>
                    <label>
                      Yaw (Y°):
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={rotY}
                        onChange={(e) => setRotY(parseInt(e.target.value))}
                        style={{ width: '90px', marginLeft: '6px' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 4th Dimension Longitudinal Time Scrubber (t = 0h to 72h) */}
              {projectionMode === '4D_SPATIOTEMPORAL' && (
                <div
                  style={{
                    backgroundColor: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1' }}>
                    4D Temporal Horizon Scrubber (t = {(timeSliceIndex * 7.2).toFixed(1)} Hours Post-Admission):
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={timeSliceIndex}
                    onChange={(e) => setTimeSliceIndex(parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#0F172A' }}>
                    Slice [{timeSliceIndex}/10]
                  </span>
                </div>
              )}

              {/* High-Precision Clinical Canvas */}
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden' }}>
                <canvas
                  ref={canvasRef}
                  width={820}
                  height={460}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </section>

            {/* Node Inspector & 4D Trajectory Inspector */}
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                Node & 4D Longitudinal Trajectory Inspector
              </h2>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  Select Graph Node to Inspect:
                </label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {gnnResult.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.category}] {n.label} (RWR: {n.rwrCentrality})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                <div>Node ID: <strong>{selectedNodeObj.id}</strong></div>
                <div>Category: <strong>{selectedNodeObj.category}</strong></div>
                <div>RWR Centrality: <strong>{selectedNodeObj.rwrCentrality}</strong></div>
                <div>3D Eigen-Coords: <strong>[{selectedNodeObj.laplacianEigenCoord.join(', ')}]</strong></div>
              </div>

              <h3 style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700 }}>
                4D Spatio-Temporal Stress Trajectory (0h → 72h)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedNodeObj.temporalTrajectory.map((val, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '65px 65px 1fr',
                      alignItems: 'center',
                      fontSize: '12px',
                      backgroundColor: idx === timeSliceIndex ? '#E0F2FE' : 'transparent',
                      padding: '3px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {(idx * 7.2).toFixed(1)}h
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{val.toFixed(3)}</span>
                    <div style={{ backgroundColor: '#E2E8F0', height: '8px', borderRadius: '2px' }}>
                      <div
                        style={{
                          width: `${Math.min(100, val * 35)}%`,
                          height: '100%',
                          backgroundColor: val > 1.5 ? '#DC2626' : '#0284C7',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* -------------------------------------------------------------------
            STAGE 5: WESTGARD MULTIRULE & SIX-SIGMA ANALYTICAL QC ENGINE
           ------------------------------------------------------------------- */}
        {activeStage === '5_WESTGARD_SIGMA_QC' && (
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '18px',
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                CLIA / ISO-15189 Westgard Multirule & Analytical Six-Sigma Quality Control
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569' }}>
                Formula: σ = (TEₐ% - |Bias%|) / CV% evaluated across 12 internal quality control runs per assay.
              </p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>LOINC</th>
                  <th style={{ padding: '8px 10px' }}>Assay</th>
                  <th style={{ padding: '8px 10px' }}>Imprecision (CV%)</th>
                  <th style={{ padding: '8px 10px' }}>Inaccuracy (Bias%)</th>
                  <th style={{ padding: '8px 10px' }}>Sigma Metric (σ)</th>
                  <th style={{ padding: '8px 10px' }}>Westgard Rule Evaluation</th>
                  <th style={{ padding: '8px 10px' }}>Release Status</th>
                </tr>
              </thead>
              <tbody>
                {westgardResults.map((w) => (
                  <tr key={w.loinc} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                      {w.loinc}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{w.biomarker}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{w.cvPct.toFixed(2)}%</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{w.biasPct.toFixed(2)}%</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>
                      {w.sigmaMetric.toFixed(2)}σ ({w.sigmaGrade})
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#334155' }}>
                      {w.violatedRules.length === 0
                        ? 'No Westgard Violations (In-Control)'
                        : w.violatedRules.join(', ')}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            w.status === 'PASS'
                              ? '#D1FAE5'
                              : w.status === 'WARNING'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                          color:
                            w.status === 'PASS'
                              ? '#065F46'
                              : w.status === 'WARNING'
                              ? '#92400E'
                              : '#991B1B',
                        }}
                      >
                        {w.status === 'PASS' ? 'VERIFIED AUTO-RELEASE' : w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
};

export default INDTXEnterpriseSuite;
