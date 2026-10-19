'use client';

import React, { useState, useMemo } from 'react';
import {
  TestTube2,
  Barcode,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  GitFork,
  Gauge,
  Printer,
  ShieldAlert,
  Droplets,
  Layers,
} from 'lucide-react';

type VacutainerTubeType =
  | 'LAVENDER_EDTA'
  | 'GOLD_SST'
  | 'GREY_FLUORIDE'
  | 'BLUE_CITRATE'
  | 'YELLOW_URINE';

interface SecondaryAliquot {
  id: string;
  aliquotBarcode: string;
  aliquotSuffix: string;
  targetDepartment: 'BIOCHEMISTRY' | 'IMMUNOLOGY';
  targetAnalyzerCode: string;
  allocatedVolumeMl: number;
  assignedTestCodes: string[];
}

interface PhysicalTubeRecord {
  id: string;
  orderNumber: string;
  patientName: string;
  patientUhid: string;
  primaryBarcode: string;
  tubeType: VacutainerTubeType;
  additiveName: string;
  capColorHex: string;
  orderOfDrawRank: number;
  requiredVolumeMl: number;
  collectedVolumeMl: number | null;
  isQnsFlagged: boolean;
  status:
    | 'PENDING_COLLECTION'
    | 'COLLECTED'
    | 'CENTRIFUGED_DECAPPED'
    | 'ALIQUOTED'
    | 'REJECTED_QNS';
  centrifugeSpeedRpm: number | null;
  centrifugeDurationMin: number | null;
  isDecapped: boolean;
  consolidatedTestCodes: string[];
  aliquots: SecondaryAliquot[];
}

const INITIAL_DEMO_TUBES: PhysicalTubeRecord[] = [
  {
    id: 'tube-101',
    orderNumber: 'ORD-20261019-0881',
    patientName: 'Rajeshwari Devi Sharma (64F)',
    patientUhid: 'UHID-ELIS-90412',
    primaryBarcode: 'SMP-20261019-00041',
    tubeType: 'BLUE_CITRATE',
    additiveName: '3.2% Buffered Sodium Citrate (9:1 Ratio)',
    capColorHex: '#38BDF8',
    orderOfDrawRank: 1,
    requiredVolumeMl: 2.7,
    collectedVolumeMl: 2.7,
    isQnsFlagged: false,
    status: 'COLLECTED',
    centrifugeSpeedRpm: null,
    centrifugeDurationMin: null,
    isDecapped: false,
    consolidatedTestCodes: ['PT-INR', 'APTT'],
    aliquots: [],
  },
  {
    id: 'tube-102',
    orderNumber: 'ORD-20261019-0881',
    patientName: 'Rajeshwari Devi Sharma (64F)',
    patientUhid: 'UHID-ELIS-90412',
    primaryBarcode: 'SMP-20261019-00042',
    tubeType: 'GOLD_SST',
    additiveName: 'Clot Activator + Polymer Gel (SST II Advance)',
    capColorHex: '#FACC15',
    orderOfDrawRank: 2,
    requiredVolumeMl: 3.5,
    collectedVolumeMl: 4.0,
    isQnsFlagged: false,
    status: 'CENTRIFUGED_DECAPPED',
    centrifugeSpeedRpm: 3500,
    centrifugeDurationMin: 12,
    isDecapped: true,
    consolidatedTestCodes: ['LIPID', 'LFT', 'KFT', 'ELECTROLYTES', 'TSH', 'FT4', 'TROP-I'],
    aliquots: [],
  },
  {
    id: 'tube-103',
    orderNumber: 'ORD-20261019-0881',
    patientName: 'Rajeshwari Devi Sharma (64F)',
    patientUhid: 'UHID-ELIS-90412',
    primaryBarcode: 'SMP-20261019-00043',
    tubeType: 'LAVENDER_EDTA',
    additiveName: 'Spray-Coated K2-EDTA',
    capColorHex: '#A855F7',
    orderOfDrawRank: 5,
    requiredVolumeMl: 2.4,
    collectedVolumeMl: null,
    isQnsFlagged: false,
    status: 'PENDING_COLLECTION',
    centrifugeSpeedRpm: null,
    centrifugeDurationMin: null,
    isDecapped: false,
    consolidatedTestCodes: ['CBC', 'HBA1C', 'ESR'],
    aliquots: [],
  },
  {
    id: 'tube-104',
    orderNumber: 'ORD-20261019-0881',
    patientName: 'Rajeshwari Devi Sharma (64F)',
    patientUhid: 'UHID-ELIS-90412',
    primaryBarcode: 'SMP-20261019-00044',
    tubeType: 'GREY_FLUORIDE',
    additiveName: 'Sodium Fluoride + Potassium Oxalate',
    capColorHex: '#94A3B8',
    orderOfDrawRank: 6,
    requiredVolumeMl: 2.0,
    collectedVolumeMl: null,
    isQnsFlagged: false,
    status: 'PENDING_COLLECTION',
    centrifugeSpeedRpm: null,
    centrifugeDurationMin: null,
    isDecapped: false,
    consolidatedTestCodes: ['FBS', 'PPBS'],
    aliquots: [],
  },
  {
    id: 'tube-105',
    orderNumber: 'ORD-20261019-0881',
    patientName: 'Rajeshwari Devi Sharma (64F)',
    patientUhid: 'UHID-ELIS-90412',
    primaryBarcode: 'SMP-20261019-00045',
    tubeType: 'YELLOW_URINE',
    additiveName: 'Sterile Conical Urine Container',
    capColorHex: '#FDE047',
    orderOfDrawRank: 8,
    requiredVolumeMl: 15.0,
    collectedVolumeMl: 20.0,
    isQnsFlagged: false,
    status: 'COLLECTED',
    centrifugeSpeedRpm: null,
    centrifugeDurationMin: null,
    isDecapped: false,
    consolidatedTestCodes: ['URINE-RM'],
    aliquots: [],
  },
];

export default function TubeAccessioningWorkstationPage() {
  const [tubes, setTubes] = useState<PhysicalTubeRecord[]>(INITIAL_DEMO_TUBES);
  const [selectedTubeId, setSelectedTubeId] = useState<string>('tube-102');
  const [volumeInput, setVolumeInput] = useState<string>('2.4');
  const [rpmInput, setRpmInput] = useState<number>(3500);
  const [durationInput, setDurationInput] = useState<number>(12);
  const [decappedInput, setDecappedInput] = useState<boolean>(true);
  const [qnsAlertMessage, setQnsAlertMessage] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const selectedTube = useMemo(
    () => tubes.find((t) => t.id === selectedTubeId) || tubes[0],
    [tubes, selectedTubeId]
  );

  const totalTestsConsolidated = useMemo(
    () => tubes.reduce((acc, t) => acc + t.consolidatedTestCodes.length, 0),
    [tubes]
  );

  const handleCollectWithQnsGuard = () => {
    setQnsAlertMessage(null);
    setActionBanner(null);

    const vol = parseFloat(volumeInput);
    if (Number.isNaN(vol) || vol <= 0) {
      setQnsAlertMessage('Enter a valid positive volume in mL.');
      return;
    }

    const minAllowed =
      selectedTube.tubeType === 'BLUE_CITRATE'
        ? Number((selectedTube.requiredVolumeMl * 0.9).toFixed(2))
        : selectedTube.requiredVolumeMl;

    if (vol < minAllowed) {
      setTubes((prev) =>
        prev.map((t) =>
          t.id === selectedTube.id
            ? {
                ...t,
                collectedVolumeMl: vol,
                isQnsFlagged: true,
                status: 'REJECTED_QNS',
              }
            : t
        )
      );
      setQnsAlertMessage(
        `QNS GUARD TRIGGERED: Collected volume (${vol} mL) is below minimum required ${minAllowed} mL for ${selectedTube.tubeType} [${selectedTube.primaryBarcode}]. Specimen rejected as Quantity Not Sufficient.`
      );
      return;
    }

    setTubes((prev) =>
      prev.map((t) =>
        t.id === selectedTube.id
          ? {
              ...t,
              collectedVolumeMl: vol,
              isQnsFlagged: false,
              status: 'COLLECTED',
            }
          : t
      )
    );
    setActionBanner(
      `Primary Vacutainer ${selectedTube.primaryBarcode} collected (${vol} mL) — QNS Guard Passed.`
    );
  };

  const handleRecordCentrifuge = () => {
    setQnsAlertMessage(null);
    setTubes((prev) =>
      prev.map((t) =>
        t.id === selectedTube.id
          ? {
              ...t,
              centrifugeSpeedRpm: rpmInput,
              centrifugeDurationMin: durationInput,
              isDecapped: decappedInput,
              status: 'CENTRIFUGED_DECAPPED',
            }
          : t
      )
    );
    setActionBanner(
      `Centrifugation logged for ${selectedTube.primaryBarcode}: ${rpmInput} RPM for ${durationInput} mins (${decappedInput ? 'Decapped' : 'Capped'}).`
    );
  };

  const handleSplitSecondaryAliquots = () => {
    setQnsAlertMessage(null);
    if (!selectedTube.isDecapped && selectedTube.tubeType !== 'YELLOW_URINE') {
      setQnsAlertMessage(
        `Tube ${selectedTube.primaryBarcode} must be centrifuged and marked Decapped before generating secondary aliquots.`
      );
      return;
    }

    const biochemTests = selectedTube.consolidatedTestCodes.filter(
      (c) => !['TSH', 'FT4', 'TROP-I', 'VIT-D', 'FERRITIN'].includes(c)
    );
    const immunoTests = selectedTube.consolidatedTestCodes.filter((c) =>
      ['TSH', 'FT4', 'TROP-I', 'VIT-D', 'FERRITIN'].includes(c)
    );

    const newAliquots: SecondaryAliquot[] = [];
    if (biochemTests.length > 0) {
      newAliquots.push({
        id: `${selectedTube.id}-a1`,
        aliquotBarcode: `${selectedTube.primaryBarcode}-A1`,
        aliquotSuffix: 'A1',
        targetDepartment: 'BIOCHEMISTRY',
        targetAnalyzerCode: 'AU480-BIOCHEM',
        allocatedVolumeMl: 1.2,
        assignedTestCodes: biochemTests,
      });
    }
    if (immunoTests.length > 0) {
      newAliquots.push({
        id: `${selectedTube.id}-a2`,
        aliquotBarcode: `${selectedTube.primaryBarcode}-A2`,
        aliquotSuffix: 'A2',
        targetDepartment: 'IMMUNOLOGY',
        targetAnalyzerCode: 'COBAS-E411-IMMUNO',
        allocatedVolumeMl: 1.0,
        assignedTestCodes: immunoTests,
      });
    }

    setTubes((prev) =>
      prev.map((t) =>
        t.id === selectedTube.id
          ? {
              ...t,
              status: 'ALIQUOTED',
              aliquots: newAliquots,
            }
          : t
      )
    );

    setActionBanner(
      `Generated ${newAliquots.length} Secondary Aliquots (${newAliquots.map((a) => a.aliquotBarcode).join(', ')}) for Biochemistry & Immunology analyzers.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <TestTube2 className="w-4 h-4" />
            CLSI GP41 Order of Draw &middot; NABL ISO 15189 Pre-Analytical Engine
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Primary Vacutainer Consolidation &amp; Secondary Aliquot Workstation
          </h1>
          <p className="text-sm text-slate-400">
            Consolidates multi-test orders into physical specimen tubes with QNS volume guards, centrifuge telemetry, and analyzer-specific secondary aliquot barcoding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-right">
            <div className="text-xs text-slate-400">Order Consolidation Ratio</div>
            <div className="text-lg font-bold text-emerald-400">
              {totalTestsConsolidated} Tests &rarr; {tubes.length} Physical Tubes
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {qnsAlertMessage && (
        <div className="bg-red-950/80 border border-red-500/60 rounded-xl p-4 flex items-start gap-3 text-red-200">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{qnsAlertMessage}</div>
        </div>
      )}

      {actionBanner && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3 text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm font-medium">{actionBanner}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Vacutainer Tubes Ordered by CLSI Draw Rank */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Consolidated Physical Vacutainers (CLSI Order of Draw)
            </h2>
            <span className="text-xs text-slate-400">
              Order: <strong className="text-slate-200">ORD-20261019-0881</strong>
            </span>
          </div>

          <div className="space-y-3">
            {tubes.map((tube) => {
              const isSelected = tube.id === selectedTube.id;
              return (
                <div
                  key={tube.id}
                  onClick={() => {
                    setSelectedTubeId(tube.id);
                    setVolumeInput(String(tube.collectedVolumeMl ?? tube.requiredVolumeMl));
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Cap Color Indicator */}
                      <div
                        className="w-4 h-12 rounded-md shrink-0 border border-white/20"
                        style={{ backgroundColor: tube.capColorHex }}
                        title={tube.tubeType}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                            Draw #{tube.orderOfDrawRank}
                          </span>
                          <span className="font-bold text-white">{tube.tubeType}</span>
                          <span className="font-mono text-xs bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-amber-300 flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5" />
                            {tube.primaryBarcode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{tube.additiveName}</p>

                        {/* Consolidated Tests */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {tube.consolidatedTestCodes.map((code) => (
                            <span
                              key={code}
                              className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                          tube.status === 'REJECTED_QNS'
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : tube.status === 'ALIQUOTED'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                            : tube.status === 'CENTRIFUGED_DECAPPED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : tube.status === 'COLLECTED'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {tube.status.replace(/_/g, ' ')}
                      </span>
                      <div className="text-xs text-slate-400 mt-2">
                        Min Vol: <strong className="text-white">{tube.requiredVolumeMl} mL</strong>
                        {tube.collectedVolumeMl !== null && (
                          <span className="ml-2 text-emerald-400">
                            (Drawn: {tube.collectedVolumeMl} mL)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Aliquots Sub-tree */}
                  {tube.aliquots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 pl-6 space-y-2">
                      <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5" />
                        Secondary Analyzer Aliquots Split from {tube.primaryBarcode}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tube.aliquots.map((aliq) => (
                          <div
                            key={aliq.id}
                            className="bg-slate-950 border border-purple-500/30 rounded-lg p-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between font-mono font-bold text-purple-200">
                              <span>{aliq.aliquotBarcode}</span>
                              <span>{aliq.allocatedVolumeMl} mL</span>
                            </div>
                            <div className="text-slate-400 mt-1">
                              {aliq.targetDepartment} &rarr;{' '}
                              <span className="text-slate-200">{aliq.targetAnalyzerCode}</span>
                            </div>
                            <div className="text-cyan-300 font-medium mt-1">
                              Tests: {aliq.assignedTestCodes.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Action Controls for Selected Tube */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: QNS Guard & Collection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                1. Phlebotomy Draw &amp; QNS Volume Guard
              </h3>
              <span className="font-mono text-xs text-amber-300">
                {selectedTube.primaryBarcode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Selected Tube:</span>
                <div className="font-bold text-white mt-0.5">{selectedTube.tubeType}</div>
              </div>
              <div>
                <span className="text-slate-400">Minimum Required Volume:</span>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {selectedTube.requiredVolumeMl} mL
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Actual Drawn Specimen Volume (mL)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={volumeInput}
                  onChange={(e) => setVolumeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleCollectWithQnsGuard}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg text-xs shrink-0 transition"
                >
                  Verify QNS &amp; Collect
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Entering less than {selectedTube.requiredVolumeMl} mL triggers automatic QNS specimen rejection.
              </p>
            </div>
          </div>

          {/* Card 2: Centrifuge & Decapping Tracking */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              2. Centrifuge Telemetry &amp; Decapping Log
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Speed (RPM)</label>
                <input
                  type="number"
                  value={rpmInput}
                  onChange={(e) => setRpmInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={decappedInput}
                onChange={(e) => setDecappedInput(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500"
              />
              Mark primary Vacutainer as Decapped &amp; Ready for Robotic Pipetting
            </label>

            <button
              type="button"
              onClick={handleRecordCentrifuge}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Log Centrifugation ({rpmInput} RPM / {durationInput}m)
            </button>
          </div>

          {/* Card 3: Secondary Aliquot Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitFork className="w-4 h-4 text-purple-400" />
              3. Secondary Aliquot Splitter (-A1, -A2)
            </h3>
            <p className="text-xs text-slate-400">
              Splits serum from <strong className="text-white">{selectedTube.primaryBarcode}</strong> into dedicated daughter barcodes for simultaneous Biochemistry (`AU480`) and Immunology (`Cobas e411`) analysis.
            </p>

            <button
              type="button"
              onClick={handleSplitSecondaryAliquots}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Generate &amp; Print Secondary Aliquot Barcodes (-A1 / -A2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
