"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { showSuccess, showInfo } from "@/lib/notifications";

export interface DoctorRosterEntry {
  id: string;
  doctorName: string;
  specialization: string;
  department: string;
  chamberNumber: string;
  days: string[];
  morningShift: string;
  eveningShift: string;
  nightOnCall: boolean;
  status: "ON_DUTY" | "IN_CONSULTATION" | "BREAK" | "OFF_DUTY";
  contactExt: string;
}

const INITIAL_ROSTER: DoctorRosterEntry[] = [
  {
    id: "rst-1",
    doctorName: "Dr. Rajesh Sharma, MD",
    specialization: "Cardiology & Internal Medicine",
    department: "Cardiology",
    chamberNumber: "Chamber 102 (OPD Block A)",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    morningShift: "09:00 AM - 01:00 PM",
    eveningShift: "05:00 PM - 08:00 PM",
    nightOnCall: true,
    status: "IN_CONSULTATION",
    contactExt: "Ext. 201 / +91 98231 00101",
  },
  {
    id: "rst-2",
    doctorName: "Dr. Vikram Seth, MD, DM",
    specialization: "Pulmonology & Critical Care / ICU",
    department: "Critical Care",
    chamberNumber: "ICU Duty Desk & Chamber 101",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"],
    morningShift: "08:30 AM - 02:00 PM",
    eveningShift: "06:00 PM - 09:00 PM",
    nightOnCall: true,
    status: "ON_DUTY",
    contactExt: "Ext. 102 / +91 94120 00102",
  },
  {
    id: "rst-3",
    doctorName: "Dr. Ananya Sen, MD",
    specialization: "Endocrinology & Diabetology",
    department: "Endocrinology",
    chamberNumber: "Chamber 105 (OPD Block B)",
    days: ["Monday", "Wednesday", "Friday"],
    morningShift: "10:00 AM - 02:00 PM",
    eveningShift: "05:00 PM - 07:30 PM",
    nightOnCall: false,
    status: "ON_DUTY",
    contactExt: "Ext. 205 / +91 98110 00103",
  },
  {
    id: "rst-4",
    doctorName: "Dr. Priyanka Gupta, MD",
    specialization: "Pediatrics & Neonatology",
    department: "Pediatrics",
    chamberNumber: "Chamber 108 (Child Health Wing)",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    morningShift: "09:30 AM - 01:30 PM",
    eveningShift: "05:30 PM - 08:30 PM",
    nightOnCall: false,
    status: "BREAK",
    contactExt: "Ext. 208 / +91 98990 00104",
  },
  {
    id: "rst-5",
    doctorName: "Dr. Hitesh Patel, MD (Path)",
    specialization: "Chief Pathologist & NABL Signatory",
    department: "Pathology & Diagnostics",
    chamberNumber: "Central Lab Review Desk L-1",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    morningShift: "08:00 AM - 04:00 PM",
    eveningShift: "On-Call Emergency Digital Sign-off",
    nightOnCall: true,
    status: "ON_DUTY",
    contactExt: "Ext. 301 / +91 98251 00105",
  },
];

const DAYS_OF_WEEK = ["All Days", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DoctorDutyRosterView() {
  const [roster, setRoster] = useState<DoctorRosterEntry[]>(INITIAL_ROSTER);
  const [selectedDay, setSelectedDay] = useState("All Days");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoster = roster.filter((r) => {
    const matchesDay = selectedDay === "All Days" || r.days.includes(selectedDay);
    const matchesSearch =
      !searchQuery ||
      r.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.chamberNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDay && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* ── Day Selector & Search Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search schedule by doctor name, specialty, department, or chamber..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Day:</span>
            <div className="flex flex-wrap items-center gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    selectedDay === day
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {day === "All Days" ? "All" : day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Weekly Duty Roster Grid ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Doctor & Department</th>
                <th className="py-3 px-4">Assigned Chamber / Location</th>
                <th className="py-3 px-4">Available Days</th>
                <th className="py-3 px-4">Morning Shift</th>
                <th className="py-3 px-4">Evening Shift</th>
                <th className="py-3 px-4">Live Duty Status</th>
                <th className="py-3 px-4 text-right">Emergency Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No doctors scheduled on {selectedDay}.</p>
                  </td>
                </tr>
              ) : (
                filteredRoster.map((r) => {
                  const isOnDuty = r.status === "ON_DUTY";
                  const isInConsultation = r.status === "IN_CONSULTATION";
                  const isBreak = r.status === "BREAK";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.doctorName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {r.specialization}
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 inline-block">
                          {r.department}
                        </span>
                      </td>

                      {/* Chamber */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sky-800">{r.chamberNumber}</div>
                        {r.nightOnCall && (
                          <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 mt-1 inline-block">
                            🌙 Night On-Call Cover
                          </span>
                        )}
                      </td>

                      {/* Days */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {r.days.map((d) => (
                            <span
                              key={d}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                selectedDay === d
                                  ? "bg-sky-600 text-white font-bold"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {d.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Shifts */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold">{r.morningShift}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold">{r.eveningShift}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isInConsultation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                            In Consultation
                          </span>
                        ) : isOnDuty ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                            On Duty (Chamber Open)
                          </span>
                        ) : isBreak ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            On Break
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Off Duty
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-700 text-xs">{r.contactExt}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
