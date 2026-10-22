'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  FileText,
  Image as ImageIcon,
  Mic,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Activity,
  Lock,
} from 'lucide-react';

export interface DoctorConsultationThread {
  id: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  bedWard?: string;
  orderNumber: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorHospital: string;
  doctorMobile: string;
  department: string;
  criticalParameter: string;
  resultValue: string;
  previousValue?: string;
  referenceRange: string;
  status: 'PENDING_CONSULT' | 'DOCTOR_REPLIED' | 'RESOLVED_LOCKED';
  urgency: 'STAT_CRITICAL' | 'URGENT' | 'ROUTINE';
  lastActivity: string;
  unreadByLab: boolean;
  messages: {
    id: string;
    sender: 'PATHOLOGIST' | 'DOCTOR' | 'SYSTEM';
    senderName: string;
    text: string;
    timestamp: string;
    attachment?: {
      type: 'PBS_IMAGE' | 'DELTA_CHART' | 'REQUISITION_SLIP';
      title: string;
      url: string;
    };
  }[];
}

const INITIAL_CONSULTATIONS: DoctorConsultationThread[] = [
  {
    id: 'CONS-901',
    uhid: 'LC-UHID-88412',
    patientName: 'Rajesh Kumar Verma',
    ageGender: '54Y / Male',
    bedWard: 'ICU Bed 04 (Cardiac Care)',
    orderNumber: 'ORD-2026-7741',
    doctorName: 'Dr. Ananya Sharma',
    doctorSpecialty: 'Senior Interventional Cardiologist',
    doctorHospital: 'Max Super Speciality Hospital',
    doctorMobile: '+91 98111 22094',
    department: 'Clinical Biochemistry & Immunoassay',
    criticalParameter: 'High-Sensitivity Troponin-I',
    resultValue: '2.45 ng/mL (STAT CRITICAL)',
    previousValue: '0.18 ng/mL (6 hrs ago)',
    referenceRange: '< 0.04 ng/mL',
    status: 'DOCTOR_REPLIED',
    urgency: 'STAT_CRITICAL',
    lastActivity: '3 min ago',
    unreadByLab: true,
    messages: [
      {
        id: 'cm-1',
        sender: 'SYSTEM',
        senderName: 'LabCore Delta Engine',
        text: '⚠️ DELTA ALERT TRIGGERED: hs-Troponin-I has increased by 1,261% in 6 hours (0.18 -> 2.45 ng/mL). NABL Panic Value Protocol initiated.',
        timestamp: '11:22 PM',
      },
      {
        id: 'cm-2',
        sender: 'PATHOLOGIST',
        senderName: 'Dr. Sameer Sen (MD, Pathologist)',
        text: 'Good evening Dr. Sharma. hs-Troponin-I value re-tested on secondary Cobas e411 analyzer to rule out heterophilic antibodies; both runs confirm >2.40 ng/mL. Delta velocity suggests acute myocardial injury. Please see the attached trend graph.',
        timestamp: '11:24 PM',
        attachment: {
          type: 'DELTA_CHART',
          title: 'Troponin-I 6-Hour Delta Trend.pdf',
          url: '#',
        },
      },
      {
        id: 'cm-3',
        sender: 'DOCTOR',
        senderName: 'Dr. Ananya Sharma',
        text: 'Thank you Dr. Sen for the prompt re-run and call. Patient is experiencing acute chest tightness with ST-elevation in V2-V5. We are wheeling him to the Cath Lab for primary PCI right away. Please fast-track the PT/INR and Platelet count.',
        timestamp: '11:28 PM',
      },
    ],
  },
  {
    id: 'CONS-902',
    uhid: 'LC-UHID-88399',
    patientName: 'Sunita Devi',
    ageGender: '62Y / Female',
    bedWard: 'Dialysis Unit - Bed 02',
    orderNumber: 'ORD-2026-7739',
    doctorName: 'Dr. Vikramaditya Nair',
    doctorSpecialty: 'Senior Nephrologist',
    doctorHospital: 'Metro Heart & Renal Institute',
    doctorMobile: '+91 98114 77820',
    department: 'Electrolytes & Renal Panel',
    criticalParameter: 'Serum Potassium (K+)',
    resultValue: '6.8 mmol/L (Hyperkalemia)',
    previousValue: '5.2 mmol/L (Yesterday)',
    referenceRange: '3.5 - 5.1 mmol/L',
    status: 'PENDING_CONSULT',
    urgency: 'STAT_CRITICAL',
    lastActivity: '8 min ago',
    unreadByLab: false,
    messages: [
      {
        id: 'cm-201',
        sender: 'SYSTEM',
        senderName: 'LabCore Automated Escalation',
        text: '🚨 NABL Panic Value Alert dispatched via WhatsApp & Priority DLT SMS to Dr. Vikramaditya Nair at 11:26 PM.',
        timestamp: '11:26 PM',
      },
      {
        id: 'cm-202',
        sender: 'PATHOLOGIST',
        senderName: 'Dr. Kavita Rao (Chief Biochemist)',
        text: 'Dear Dr. Nair, Serum Potassium is 6.8 mmol/L. Sample inspected under spectrophotometer: Zero hemolysis index (Hemolysis = Negative). True hyperkalemia. Please advise if hemodialysis is being scheduled.',
        timestamp: '11:27 PM',
      },
    ],
  },
  {
    id: 'CONS-903',
    uhid: 'LC-UHID-88370',
    patientName: 'Mohd. Irfan',
    ageGender: '47Y / Male',
    bedWard: 'Day Care OPD',
    orderNumber: 'ORD-2026-7728',
    doctorName: 'Dr. R. K. Agarwal',
    doctorSpecialty: 'Internal Medicine',
    doctorHospital: 'Agarwal PolyClinic & Diagnostic',
    doctorMobile: '+91 94150 88219',
    department: 'Hematology',
    criticalParameter: 'Platelet Count (Severe Thrombocytopenia)',
    resultValue: '18,000 /uL (STAT)',
    previousValue: '1,45,000 /uL (3 days ago)',
    referenceRange: '1,50,000 - 4,50,000 /uL',
    status: 'RESOLVED_LOCKED',
    urgency: 'STAT_CRITICAL',
    lastActivity: '24 min ago',
    unreadByLab: false,
    messages: [
      {
        id: 'cm-301',
        sender: 'PATHOLOGIST',
        senderName: 'Dr. Sameer Sen (MD, Pathologist)',
        text: 'Dr. Agarwal, Platelet count on Sysmex XN-550 is 18,000/uL. Manual peripheral blood smear examination confirmed severe thrombocytopenia with giant platelets, no EDTA-clumping observed. Dengue NS1 is Positive.',
        timestamp: '11:05 PM',
        attachment: {
          type: 'PBS_IMAGE',
          title: 'Peripheral_Blood_Smear_100x_OilImmersion.jpg',
          url: '#',
        },
      },
      {
        id: 'cm-302',
        sender: 'DOCTOR',
        senderName: 'Dr. R. K. Agarwal',
        text: 'Noted with thanks. Patient advised immediate admission to High Dependency Unit for platelet transfusion protocol. Read-back recorded.',
        timestamp: '11:12 PM',
      },
      {
        id: 'cm-303',
        sender: 'SYSTEM',
        senderName: 'NABL Audit Engine',
        text: '🔒 Consult completed & telephonic read-back confirmed. Audit lock applied by Dr. Sameer Sen at 11:14 PM.',
        timestamp: '11:14 PM',
      },
    ],
  },
];

export default function DoctorConsultationDesk() {
  const [consultations, setConsultations] = useState<DoctorConsultationThread[]>(INITIAL_CONSULTATIONS);
  const [selectedConsultId, setSelectedConsultId] = useState<string>('CONS-901');
  const [inputText, setInputText] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'STAT_CRITICAL' | 'PENDING'>('ALL');

  const selectedThread = consultations.find((c) => c.id === selectedConsultId) || consultations[0];

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedThread) return;

    const newMsg = {
      id: `cm-${Date.now()}`,
      sender: 'PATHOLOGIST' as const,
      senderName: 'Pathologist On Duty (You)',
      text: inputText.trim(),
      timestamp: 'Just Now',
    };

    setConsultations((prev) =>
      prev.map((c) =>
        c.id === selectedThread.id
          ? {
              ...c,
              status: 'PENDING_CONSULT',
              lastActivity: 'Just Now',
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setInputText('');
  };

  const handleResolveConsult = (id: string) => {
    const lockMsg = {
      id: `cm-lock-${Date.now()}`,
      sender: 'SYSTEM' as const,
      senderName: 'NABL Compliance Desk',
      text: '🔒 Clinical consensus locked. Telephonic confirmation stamped into laboratory permanent electronic health record (EHR).',
      timestamp: 'Just Now',
    };

    setConsultations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'RESOLVED_LOCKED',
              messages: [...c.messages, lockMsg],
            }
          : c
      )
    );
  };

  const filteredThreads = consultations.filter((c) => {
    if (filterUrgency === 'STAT_CRITICAL') return c.urgency === 'STAT_CRITICAL';
    if (filterUrgency === 'PENDING') return c.status !== 'RESOLVED_LOCKED';
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[720px] bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* =====================================================================
          LEFT COLUMN: ACTIVE DOCTOR CONSULTATION QUEUE (4 COLS)
      ===================================================================== */}
      <div className="lg:col-span-4 border-r border-slate-200/90 flex flex-col bg-[#F8FAFC]/50">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200">
                <Stethoscope className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">Doctor STAT Desk</h3>
                <p className="text-[10px] font-semibold text-slate-500">Pathologist & Clinician Direct Handoff</p>
              </div>
            </div>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 animate-pulse">
              {consultations.filter((c) => c.status !== 'RESOLVED_LOCKED').length} Active
            </span>
          </div>

          {/* Quick Filter Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['ALL', 'STAT_CRITICAL', 'PENDING'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterUrgency(filter)}
                className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                  filterUrgency === filter
                    ? 'bg-white text-[#0F766E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'ALL' ? 'All (3)' : filter === 'STAT_CRITICAL' ? '🚨 STAT (3)' : 'Pending'}
              </button>
            ))}
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
          {filteredThreads.map((thread) => {
            const isSelected = thread.id === selectedThread.id;
            return (
              <div
                key={thread.id}
                onClick={() => setSelectedConsultId(thread.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                    : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-[#0F172A]">{thread.doctorName}</span>
                    {thread.unreadByLab && (
                      <span className="h-2 w-2 rounded-full bg-teal-600 animate-ping" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{thread.lastActivity}</span>
                </div>

                <p className="text-[11px] font-medium text-slate-600 mt-0.5">{thread.doctorSpecialty}</p>

                {/* Patient & Value Alert Pill */}
                <div className="mt-2 p-2 rounded-lg bg-rose-50/60 border border-rose-200/70">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-900 truncate max-w-[130px]">{thread.patientName}</span>
                    <span className="text-rose-700 font-mono">{thread.criticalParameter}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-rose-800 font-extrabold">{thread.resultValue}</span>
                    <span className="text-slate-500 font-mono text-[9px]">{thread.uhid}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-slate-500">{thread.bedWard || 'OPD'}</span>
                  {thread.status === 'RESOLVED_LOCKED' ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Lock className="w-2.5 h-2.5" /> NABL Locked
                    </span>
                  ) : thread.status === 'DOCTOR_REPLIED' ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      Doctor Replied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Awaiting Read-Back
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          RIGHT COLUMN: CLINICAL CHAT & MEDICAL CONTEXT DECK (8 COLS)
      ===================================================================== */}
      <div className="lg:col-span-8 flex flex-col bg-white">
        {/* Clinician & Patient Medical Banner */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] font-bold shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-[#0F172A]">{selectedThread.doctorName}</h4>
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 border border-slate-200">
                    {selectedThread.doctorSpecialty}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{selectedThread.doctorHospital}</span>
                  <span>•</span>
                  <span className="text-[#0284C7] font-semibold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedThread.doctorMobile}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {selectedThread.status !== 'RESOLVED_LOCKED' && (
                <button
                  onClick={() => handleResolveConsult(selectedThread.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lock Read-Back Audit
                </button>
              )}
              <a
                href={`tel:${selectedThread.doctorMobile}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0D9488] transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" /> Direct Call
              </a>
            </div>
          </div>

          {/* Critical Parameter Bar */}
          <div className="mt-3 p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-rose-900">
                  {selectedThread.criticalParameter}: <span className="font-mono text-sm underline">{selectedThread.resultValue}</span>
                </p>
                <p className="text-[10px] font-medium text-rose-700">
                  Ref Range: {selectedThread.referenceRange} {selectedThread.previousValue && `• Baseline: ${selectedThread.previousValue}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-[10px] font-bold text-slate-800">{selectedThread.patientName} ({selectedThread.ageGender})</p>
                <p className="text-[9px] font-mono text-slate-500">{selectedThread.uhid} • {selectedThread.bedWard}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]/40">
          {selectedThread.messages.map((msg) => {
            if (msg.sender === 'SYSTEM') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200/80 max-w-lg text-center flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isPathologist = msg.sender === 'PATHOLOGIST';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPathologist ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                  {msg.senderName} • {msg.timestamp}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs border ${
                    isPathologist
                      ? 'bg-[#0F766E] text-white border-teal-700 rounded-tr-none'
                      : 'bg-white text-slate-900 border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Attachment Card if present */}
                  {msg.attachment && (
                    <div
                      className={`mt-2.5 p-2 rounded-xl flex items-center justify-between gap-3 border ${
                        isPathologist
                          ? 'bg-teal-800/60 border-teal-600 text-teal-100'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {msg.attachment.type === 'PBS_IMAGE' ? (
                          <ImageIcon className="w-4 h-4 text-sky-300" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-300" />
                        )}
                        <span className="text-[11px] font-bold underline cursor-pointer truncate max-w-[200px]">
                          {msg.attachment.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/20">
                        View
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Clinical Canned Quick-Replies */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center gap-1.5 overflow-x-auto text-[10px]">
          <span className="font-bold text-slate-400 uppercase text-[9px] shrink-0">Pathology Presets:</span>
          {[
            'Sample verified with zero hemolysis',
            'Correlate with clinical ECG/Symptoms',
            'Repeat sample requested (stat re-draw)',
            'Telephonic read-back successfully recorded',
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(preset)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-[#0F766E] transition-all font-medium"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              title="Attach Peripheral Blood Smear Image or Delta PDF"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0F766E] hover:border-teal-300 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type clinical observation, morphologic finding or read-back confirmation..."
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder-slate-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D9488] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" /> Send to Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
