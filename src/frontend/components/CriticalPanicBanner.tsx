import React from 'react';
import { ReportVerificationItem } from '../types/doctor.types';

interface Props {
  panicReports: ReportVerificationItem[];
  onReviewReport: (report: ReportVerificationItem) => void;
}

export const CriticalPanicBanner: React.FC<Props> = ({ panicReports, onReviewReport }) => {
  if (panicReports.length === 0) return null;

  const firstPanic = panicReports[0];

  return (
    <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-rose-900 text-xs shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
          <span>
            <strong className="text-rose-950 font-black">CRITICAL PANIC VALUE ALERT:</strong> Patient{' '}
            <strong className="text-rose-900 font-bold">{firstPanic.patientName} ({firstPanic.uhid})</strong> has severe panic readings in{' '}
            <span className="font-semibold">{firstPanic.testPanelName}</span>.
          </span>
        </div>
        <button
          onClick={() => onReviewReport(firstPanic)}
          className="font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 transition cursor-pointer"
        >
          Review & Sign-Off Immediately <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};
