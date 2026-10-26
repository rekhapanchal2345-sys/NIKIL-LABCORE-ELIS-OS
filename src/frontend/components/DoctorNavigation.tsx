import React from 'react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  panicCount: number;
  currentDoctor: {
    name: string;
    title: string;
    department: string;
  };
}

export const DoctorNavigation: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  panicCount,
  currentDoctor
}) => {
  const tabs = [
    { id: 'overview', label: 'Command Center', icon: 'fa-gauge-high' },
    { id: 'verification', label: 'Pathologist Review', icon: 'fa-microscope', badge: panicCount > 0 },
    { id: 'prescriptions', label: 'E-Prescription & CPOE', icon: 'fa-file-prescription' },
    { id: 'referrals', label: 'Referral Accounting', icon: 'fa-hand-holding-dollar' },
    { id: 'emr', label: 'Patient EMR Trends', icon: 'fa-chart-line' },
    { id: 'doctors', label: 'Doctor Roster', icon: 'fa-user-doctor' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand (Clean Ultra Light White Medical Theme) */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-black text-xl shadow-2xs">
            <i className="fa-solid fa-staff-snake"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-900">
                LabCore ELIS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                Doctor & LIMS PRO
              </span>
              {panicCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  🚨 {panicCount} Panic Alert
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium">Enterprise Hospital & Laboratory Information System</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-sky-700 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 border border-transparent'
                }`}
              >
                <i className={`fa-solid ${tab.icon} ${isActive ? 'text-sky-600' : 'text-slate-400'}`}></i>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Doctor Identity */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{currentDoctor.name}</div>
            <div className="text-[11px] text-teal-700 font-semibold">{currentDoctor.title}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm shadow-2xs">
            <i className="fa-solid fa-user-doctor"></i>
          </div>
        </div>

      </div>
    </header>
  );
};
