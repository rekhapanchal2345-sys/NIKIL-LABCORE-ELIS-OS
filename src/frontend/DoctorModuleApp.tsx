import React, { useState } from 'react';
import { useDoctorModule } from './hooks/useDoctorModule';
import { DoctorNavigation } from './components/DoctorNavigation';
import { CriticalPanicBanner } from './components/CriticalPanicBanner';
import { OverviewStats } from './components/OverviewStats';
import { VerificationQueue } from './components/PathologistVerification/VerificationQueue';
import { ParameterReviewModal } from './components/PathologistVerification/ParameterReviewModal';
import { PrescriptionBuilderModal } from './components/EPrescriptionCPOE/PrescriptionBuilderModal';
import { ReferralLedgerView } from './components/ReferralAccounting/ReferralLedgerView';
import { PatientEMRView } from './components/PatientEMR/PatientEMRView';
import { DoctorRosterView } from './components/DoctorRoster/DoctorRosterView';

export const DoctorModuleApp: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    doctors,
    reports,
    prescriptions,
    referrals,
    emrs,
    selectedReport,
    setSelectedReport,
    selectedEMR,
    setSelectedEMR,
    loading,
    error,
    currentDoctor,
    stats,
    handleSignOffReport,
    handleOrderReRun,
    handleCreatePrescription,
    handleSettlePayout
  } = useDoctorModule();

  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  const panicReports = reports.filter(r => r.panicAlertAudit?.isPanicReport);

  const handlePrintReport = (reportId: string) => {
    window.open(`/api/v1/doctor-module/reports/${reportId}/print`, '_blank');
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans">
      
      {/* Top Navigation */}
      <DoctorNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        panicCount={panicReports.length}
        currentDoctor={currentDoctor}
      />

      {/* Panic Alert Banner */}
      <CriticalPanicBanner
        panicReports={panicReports}
        onReviewReport={(rep) => setSelectedReport(rep)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-5">
        
        {loading && (
          <div className="text-center py-12 text-slate-500">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-sky-600 mb-2"></i>
            <div className="font-semibold text-xs">Syncing Doctor & Laboratory Systems...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl mb-4 text-xs font-semibold">
            <strong>System Notice:</strong> {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Overview / Command Center */}
            {activeTab === 'overview' && (
              <OverviewStats
                stats={stats}
                recentReports={reports}
                onNavigate={setActiveTab}
                onReviewReport={(rep) => setSelectedReport(rep)}
              />
            )}

            {/* Pathologist Verification Station */}
            {activeTab === 'verification' && (
              <VerificationQueue
                reports={reports}
                onSelectReport={(rep) => setSelectedReport(rep)}
                onPrintReport={handlePrintReport}
              />
            )}

            {/* E-Prescriptions & CPOE List */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4 text-xs">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div>
                    <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <i className="fa-solid fa-file-prescription text-teal-600"></i>
                      <span>Smart E-Prescription & CPOE Station</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                      Prescribe medications and directly issue computerized diagnostic orders with automated LIS barcode sync.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRxModalOpen(true)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Create New Prescription
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Rx Number / Barcode</th>
                          <th className="py-3 px-4">Patient Details</th>
                          <th className="py-3 px-4">Attending Doctor</th>
                          <th className="py-3 px-4">Diagnosis (ICD-10)</th>
                          <th className="py-3 px-4">Lab Tests Ordered</th>
                          <th className="py-3 px-4">Medications</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prescriptions.map(p => (
                          <tr key={p.prescriptionNumber} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-sky-700 font-bold">{p.prescriptionNumber}</div>
                              <div className="text-[11px] text-slate-400">Barcode: {p.barcode}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{p.patient.fullName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {p.patient.age}y / {p.patient.gender} • <span>{p.patient.uhid}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-slate-800 font-semibold">{p.doctor.doctorName}</div>
                              <div className="text-[11px] text-slate-500">{p.doctor.specialization}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-slate-900 font-bold">{p.clinicalSummary.provisionalDiagnosis}</div>
                              <div className="text-[11px] text-sky-700 font-mono">
                                {p.clinicalSummary.icd10Codes?.[0]?.code} {p.clinicalSummary.icd10Codes?.[0]?.description}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {p.labOrders.map(o => (
                                  <span key={o.testCode} className="bg-sky-50 border border-sky-200 text-sky-800 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                                    {o.testName}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              {p.medications.length} Medications Prescribed
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Referral Accounting */}
            {activeTab === 'referrals' && (
              <ReferralLedgerView
                referrals={referrals}
                stats={stats}
                onSettlePayout={handleSettlePayout}
              />
            )}

            {/* Patient EMR Trends */}
            {activeTab === 'emr' && (
              <PatientEMRView
                emrs={emrs}
                selectedEMR={selectedEMR}
                onSelectPatient={(p) => setSelectedEMR(p)}
                onOpenRx={() => {
                  setActiveTab('prescriptions');
                  setIsRxModalOpen(true);
                }}
              />
            )}

            {/* Doctor Directory Roster */}
            {activeTab === 'doctors' && (
              <DoctorRosterView doctors={doctors} />
            )}
          </>
        )}

      </main>

      {/* Pathologist Parameter Review Modal */}
      {selectedReport && (
        <ParameterReviewModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onSignOff={handleSignOffReport}
          onOrderReRun={handleOrderReRun}
        />
      )}

      {/* Prescription Creation Modal */}
      <PrescriptionBuilderModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        onSubmitPrescription={handleCreatePrescription}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        LabCore ELIS & Hospital Information System • Real-World Clinical Doctor & Diagnostic Suite
      </footer>

    </div>
  );
};

export default DoctorModuleApp;
