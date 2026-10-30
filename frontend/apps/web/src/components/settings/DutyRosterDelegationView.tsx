"use client";

import React, { useState } from "react";
import {
  Clock,
  Calendar,
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Laptop,
  Building,
  RefreshCw,
  Plus,
  History,
  Lock,
  Unlock,
  Check
} from "lucide-react";

interface ActiveShiftStaff {
  id: string;
  name: string;
  role: string;
  shiftName: "Morning" | "General" | "Evening" | "Night Emergency" | "On-Call";
  shiftTiming: string;
  department: string;
  assignedTerminal: string;
  terminalIp: string;
  checkInTime: string;
  status: "ON_DUTY" | "ON_BREAK" | "HANDOVER_PENDING";
  isNablSignatory: boolean;
}

interface ActiveDelegation {
  id: string;
  fromDoctor: string;
  toDoctor: string;
  reason: string;
  scope: string;
  validFrom: string;
  validUntil: string;
  remainingMinutes: number;
  approvedBy: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}

const CURRENT_ROSTER: ActiveShiftStaff[] = [
  {
    id: "rst-001",
    name: "Dr. Vikramaditya Sharma",
    role: "Senior Consultant Pathologist",
    shiftName: "Morning",
    shiftTiming: "8:00 AM - 4:00 PM",
    department: "Histopathology & Core Lab",
    assignedTerminal: "Terminal A-04 (Sign-Off Station)",
    terminalIp: "192.168.1.14",
    checkInTime: "07:55 AM",
    status: "ON_DUTY",
    isNablSignatory: true,
  },
  {
    id: "rst-002",
    name: "Rajesh K. Patel",
    role: "Medical Lab Technologist",
    shiftName: "Morning",
    shiftTiming: "6:00 AM - 2:00 PM",
    department: "Hematology (Sysmex Analyzer)",
    assignedTerminal: "Terminal B-02 (Hematology)",
    terminalIp: "192.168.1.35",
    checkInTime: "05:52 AM",
    status: "ON_DUTY",
    isNablSignatory: false,
  },
  {
    id: "rst-003",
    name: "Amit Verma",
    role: "Phlebotomist & Accessioning",
    shiftName: "Morning",
    shiftTiming: "6:00 AM - 2:00 PM",
    department: "OPD Sample Collection Chair 1",
    assignedTerminal: "Terminal C-01 (Phlebotomy)",
    terminalIp: "192.168.1.42",
    checkInTime: "05:58 AM",
    status: "ON_DUTY",
    isNablSignatory: false,
  },
  {
    id: "rst-004",
    name: "Neha Gupta",
    role: "Front Desk & POS Cashier",
    shiftName: "General",
    shiftTiming: "9:00 AM - 6:00 PM",
    department: "Central Patient Reception",
    assignedTerminal: "Cash Register Terminal 1",
    terminalIp: "192.168.1.50",
    checkInTime: "08:50 AM",
    status: "ON_DUTY",
    isNablSignatory: false,
  },
  {
    id: "rst-005",
    name: "Dr. Jaya Ashapurama",
    role: "Lab Director / Primary Signatory",
    shiftName: "On-Call",
    shiftTiming: "24x7 Critical Panic Coverage",
    department: "Directorate & Molecular",
    assignedTerminal: "Executive Portal (Remote/VPN)",
    terminalIp: "192.168.1.10",
    checkInTime: "08:30 AM",
    status: "ON_DUTY",
    isNablSignatory: true,
  },
];

const INITIAL_DELEGATIONS: ActiveDelegation[] = [
  {
    id: "del-001",
    fromDoctor: "Dr. Ananya Deshmukh (Microbiology)",
    toDoctor: "Dr. Vikramaditya Sharma (Pathology)",
    reason: "Attending Indian Association of Medical Microbiologists CME",
    scope: "All Microbiology Cultures & PCR Verification",
    validFrom: "Today, 09:00 AM",
    validUntil: "Today, 06:00 PM",
    remainingMinutes: 380,
    approvedBy: "Dr. Jaya Ashapurama (Director)",
    status: "ACTIVE",
  },
];

export default function DutyRosterDelegationView() {
  const [rosterStaff, setRosterStaff] = useState<ActiveShiftStaff[]>(CURRENT_ROSTER);
  const [delegations, setDelegations] = useState<ActiveDelegation[]>(INITIAL_DELEGATIONS);
  const [newDelegationModal, setNewDelegationModal] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRevokeDelegation = (id: string) => {
    setDelegations(delegations.filter((d) => d.id !== id));
    showToast("Delegation Revoked", "Signatory authority has reverted back to the primary pathologist.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl text-slate-800 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
            <p className="text-xs text-slate-600">{toast.desc}</p>
          </div>
        </div>
      )}

      {/* Hospital Light Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md shadow-amber-500/20 text-white">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
                  24x7 Clinical Duty Roster & Emergency Signatory Delegation
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Break-Glass Handover Protocol
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Workstation terminal binding, real-time shift personnel tracking, and audit-logged report signing handovers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setNewDelegationModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-orange-700 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              Emergency Signatory Handover
            </button>
          </div>
        </div>

        {/* 4 Shift KPI Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Active Shift Now</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1.5">
              <div className="text-sm font-bold text-slate-900">Morning Shift A</div>
              <div className="text-[11px] text-slate-500">6:00 AM – 2:00 PM</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Staff On Duty</span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">5 Personnel</span>
              <span className="text-[11px] text-emerald-600 font-medium">100% Covered</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Panic Escalation Lead</span>
              <Stethoscope className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-1.5">
              <div className="text-xs font-bold text-slate-900 truncate">Dr. Vikramaditya Sharma</div>
              <div className="text-[11px] text-emerald-600 font-semibold">Active at Terminal A-04</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Active Delegations</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">{delegations.length}</span>
              <span className="text-[11px] text-slate-500 font-medium">Temporary Handovers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Delegation Section (If Active) */}
      {delegations.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-700" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide m-0">
                Active Break-Glass Emergency Signatory Handovers
              </h3>
            </div>
            <span className="rounded-md bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 font-mono">
              AUDITED ISO 15189
            </span>
          </div>

          <div className="space-y-3">
            {delegations.map((del) => (
              <div
                key={del.id}
                className="rounded-xl border border-amber-200 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">{del.fromDoctor}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Delegated to: {del.toDoctor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 m-0">
                    <span className="font-semibold text-slate-800">Reason:</span> {del.reason} • <span className="font-semibold text-slate-800">Scope:</span> {del.scope}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Valid: {del.validFrom} – {del.validUntil}</span>
                    <span>•</span>
                    <span className="font-medium text-amber-700">Remaining: {Math.floor(del.remainingMinutes / 60)}h {del.remainingMinutes % 60}m</span>
                    <span>•</span>
                    <span>Authorized by: {del.approvedBy}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeDelegation(del.id)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer flex-shrink-0"
                >
                  Revoke Handover Early
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Roster Table (Clinical White Table) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 m-0">Live Shift Roster & Terminal Binding</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Real-Time Workstation Synchronization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Staff Member & Role</th>
                <th className="py-3 px-4">Current Shift</th>
                <th className="py-3 px-4">Department / Lab Wing</th>
                <th className="py-3 px-4">Assigned Workstation & IP</th>
                <th className="py-3 px-4">Check-in Time</th>
                <th className="py-3 px-4">NABL Signatory</th>
                <th className="py-3 px-4 text-right">Duty Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rosterStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{staff.name}</div>
                    <div className="text-[11px] text-slate-500">{staff.role}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-200">
                      {staff.shiftName}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{staff.shiftTiming}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {staff.department}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5 text-slate-500" />
                      {staff.assignedTerminal}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">{staff.terminalIp}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {staff.checkInTime}
                  </td>
                  <td className="py-3 px-4">
                    {staff.isNablSignatory ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Authorized
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      On Duty
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Emergency Delegation */}
      {newDelegationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 m-0">Initiate Break-Glass Signatory Handover</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewDelegationModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>
                Temporarily delegate NABL report authorization powers to a qualified peer pathologist.
                Every released report under delegation is stamped with an immutable forensic audit trail.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Pathologist on Leave</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800">
                  <option>Dr. Jaya Ashapurama (Chief Pathologist)</option>
                  <option>Dr. Vikramaditya Sharma (Senior Pathologist)</option>
                  <option>Dr. Ananya Deshmukh (Microbiologist)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Delegate Signing Authority To</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800">
                  <option>Dr. Vikramaditya Sharma, MD (Histopathologist)</option>
                  <option>Dr. Suresh K. Nair, MD (Consultant)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Delegation Scope</label>
                <input
                  type="text"
                  defaultValue="All Routine Hematology, Biochemistry & Emergency Stat Assays"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Handover Duration</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800">
                  <option>4 Hours (Single Shift Window)</option>
                  <option>8 Hours (Full Day Shift)</option>
                  <option>24 Hours (Full Day-Night Handover)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Justification / Leave Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Attending National Pathology Conference / Medical Emergency..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewDelegationModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewDelegationModal(false);
                  showToast("Emergency Handover Active", "Signatory delegation registered in audit log.");
                }}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
              >
                Authorize & Activate Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
