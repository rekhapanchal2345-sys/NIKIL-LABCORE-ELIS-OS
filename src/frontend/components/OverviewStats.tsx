import React from 'react';
import { ReportVerificationItem } from '../types/doctor.types';

interface Props {
  stats: {
    pendingReports: number;
    panicReports: number;
    totalDoctors: number;
    totalReferralPayout: number;
  };
  recentReports: ReportVerificationItem[];
  onNavigate: (tab: any) => void;
  onReviewReport: (report: ReportVerificationItem) => void;
}

export const OverviewStats: React.FC<Props> = ({
  stats,
  recentReports,
  onNavigate,
  onReviewReport
}) => {
  return (
    <div className="space-y-5">
      {/* 4 Metric Cards (Ultra Light White Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reports In Queue</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <i className="fa-solid fa-flask-vial"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {stats.pendingReports}
          </div>
          <div className="text-xs text-sky-700 mt-1 font-semibold flex items-center gap-1">
            <i className="fa-solid fa-clock"></i> Requires Pathologist Sign-Off
          </div>
        </div>

        <div className="p-5 bg-white border border-rose-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical Panic Values</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2 font-mono">
            {stats.panicReports}
          </div>
          <div className="text-xs text-rose-600 mt-1 font-semibold flex items-center gap-1">
            <i className="fa-solid fa-bell"></i> Immediate ER/Doctor Alert
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Doctors</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {stats.totalDoctors}
          </div>
          <div className="text-xs text-teal-700 mt-1 font-semibold flex items-center gap-1">
            <i className="fa-solid fa-check-double"></i> In-House & Referring Partners
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Referral Incentives</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2 font-mono">
            ₹{stats.totalReferralPayout.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <i className="fa-solid fa-receipt"></i> Monthly Ledger (10% TDS)
          </div>
        </div>

      </div>

      {/* Quick Actions Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-bolt text-amber-500"></i>
          <span>Quick Clinical Actions</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('verification')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-microscope"></i> Verify Pending Reports
          </button>
          <button
            onClick={() => onNavigate('prescriptions')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-plus text-sky-600"></i> New E-Prescription (Rx)
          </button>
          <button
            onClick={() => onNavigate('emr')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-chart-line text-teal-600"></i> Patient Longitudinal EMR
          </button>
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <i className="fa-solid fa-list-check text-sky-600"></i> Recent Diagnostic Reports Awaiting Authorization
            </h3>
            <button
              onClick={() => onNavigate('verification')}
              className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2.5">
            {recentReports.slice(0, 4).map(report => (
              <div
                key={report.reportId}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-sky-50/50 border border-slate-200 rounded-xl transition cursor-pointer"
                onClick={() => onReviewReport(report)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      report.panicAlertAudit?.isPanicReport
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        report.panicAlertAudit?.isPanicReport ? 'fa-triangle-exclamation' : 'fa-flask-vial'
                      }`}
                    ></i>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {report.patientName}{' '}
                      <span className="text-xs text-slate-500 font-mono font-medium">({report.uhid})</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {report.testPanelName} • Ref: {report.referredByDoctor.doctorName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      report.status.includes('Panic')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : report.status.includes('Approved')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {report.status.split('-')[0]}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    {new Date(report.analyzerProcessedTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Quality & Accreditations Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <i className="fa-solid fa-shield-halved text-teal-600"></i> Clinical Quality & Compliance
            </h3>
            <ul className="text-xs text-slate-700 space-y-3 font-medium">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
                <span><strong>Delta Check Engine:</strong> Automatic flag if result deviates &gt;30% from patient baseline.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
                <span><strong>Panic Telemetry:</strong> Instant SMS/WhatsApp trigger to referring physician.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
                <span><strong>Encrypted Signature:</strong> Cryptographic token on authenticated report printouts.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
                <span><strong>TDS Accounting:</strong> Section 194J 10% tax deduction on doctor referral incentives.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
            LabCore ELIS Engine • ISO 15189:2022 Compliant
          </div>
        </div>

      </div>
    </div>
  );
};
