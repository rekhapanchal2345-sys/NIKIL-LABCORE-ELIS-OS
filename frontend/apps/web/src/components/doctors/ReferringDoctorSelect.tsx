'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserCheck,
  Plus,
  Building,
  Check,
  ChevronDown,
  X,
  Phone,
  Percent,
  Sparkles,
  MessageSquare,
  Mail,
  Hospital,
} from 'lucide-react';
import { doctorApi } from '@/lib/api';
import RegisterDoctorWizard from './RegisterDoctorWizard';
import { DoctorProfile } from './doctorTypes';

export interface DoctorOption {
  id: string;
  doctorCode?: string;
  fullName: string;
  title?: string;
  specialization?: string;
  qualification?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  clinicName?: string;
  doctorType?: string;
  commissionType?: string;
  commissionRate?: number | string;
  commissionFlatAmount?: number | string;
  reportDeliveryWhatsApp?: boolean;
  reportDeliveryEmail?: boolean;
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface ReferringDoctorSelectProps {
  value?: string | null;
  selectedDoctor?: DoctorOption | null;
  onChange: (doctorId: string | null, doctor?: DoctorOption | null) => void;
  required?: boolean;
  label?: string;
  error?: string;
  className?: string;
  placeholder?: string;
}

export default function ReferringDoctorSelect({
  value,
  selectedDoctor,
  onChange,
  required = false,
  label = 'Referring Doctor / Consultant',
  error,
  className = '',
  placeholder = 'Search doctor by name, DOC-ID, specialization, or clinic...',
}: ReferringDoctorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch doctors on search
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await doctorApi.getAll({
          search: search.trim() || undefined,
          isActive: true,
          limit: 15,
        });
        if (active && res && res.success !== false) {
          const list = res.data?.doctors || res.data || [];
          setDoctors(list);
        }
      } catch (err) {
        console.error('Error searching doctors:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  // Current active doctor object
  const currentDoctor =
    selectedDoctor || doctors.find((d) => String(d.id) === String(value));

  const isSelf = value === 'SELF' || value === '' || (!value && !selectedDoctor);

  const handleSelect = (doc: DoctorOption | null) => {
    if (!doc) {
      onChange('SELF', null);
    } else {
      onChange(doc.id, doc);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Quick Add Doctor
        </button>
      </div>

      {/* Selector Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[46px] p-2.5 rounded-xl border bg-white cursor-pointer transition-all flex items-center justify-between gap-2 shadow-sm ${
          error
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-sky-600 ring-2 ring-sky-100'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {isSelf ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Self / Direct Walk-In</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/60 text-emerald-700">
                  No Referral
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Patient presented directly without doctor prescription</p>
            </div>
          </div>
        ) : currentDoctor ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center font-black text-xs border border-sky-100 flex-shrink-0">
              {(currentDoctor.fullName || 'Dr').slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                <span>{currentDoctor.fullName}</span>
                {currentDoctor.doctorCode && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                    {currentDoctor.doctorCode}
                  </span>
                )}
                {currentDoctor.organization && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-0.5">
                    <Building className="w-2.5 h-2.5" />
                    {currentDoctor.organization.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                <span>{currentDoctor.specialization || currentDoctor.qualification || 'General Practice'}</span>
                {currentDoctor.clinicName && (
                  <>
                    <span>•</span>
                    <span className="truncate">{currentDoctor.clinicName}</span>
                  </>
                )}
                {currentDoctor.phone && (
                  <>
                    <span>•</span>
                    <span>{currentDoctor.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 pl-1">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
          {!isSelf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition"
              title="Reset to Self / Direct"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type name, doctor ID, hospital, specialization..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {/* Quick Option: Self / Direct Walk-In */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full p-3 text-left flex items-center justify-between hover:bg-emerald-50/50 transition-colors ${
                isSelf ? 'bg-emerald-50/80' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Self / Direct Walk-In</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      DEFAULT
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Direct patient request without referring prescriber</p>
                </div>
              </div>
              {isSelf && <Check className="w-4 h-4 text-emerald-600" />}
            </button>

            {/* Doctor rows */}
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                Searching clinical directory...
              </div>
            ) : doctors.length > 0 ? (
              doctors.map((doc) => {
                const isSelected = String(value) === String(doc.id);
                const comm =
                  doc.commissionType === 'PERCENTAGE' && Number(doc.commissionRate) > 0
                    ? `${doc.commissionRate}%`
                    : doc.commissionType === 'FLAT_PER_PATIENT' && Number(doc.commissionFlatAmount) > 0
                    ? `₹${doc.commissionFlatAmount}/pt`
                    : null;

                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleSelect(doc)}
                    className={`w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-sky-50/70 border-l-2 border-sky-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                        {(doc.fullName || 'Dr').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{doc.fullName}</span>
                          {doc.doctorCode && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                              {doc.doctorCode}
                            </span>
                          )}
                          {comm && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-0.5">
                              <Percent className="w-2.5 h-2.5" /> {comm}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="text-slate-700 font-medium">
                            {doc.specialization || doc.qualification || 'Doctor'}
                          </span>
                          {doc.clinicName && (
                            <>
                              <span>•</span>
                              <span className="truncate text-slate-500">{doc.clinicName}</span>
                            </>
                          )}
                          {doc.organization && (
                            <>
                              <span>•</span>
                              <span className="text-teal-700 font-medium truncate flex items-center gap-0.5">
                                <Hospital className="w-3 h-3" />
                                {doc.organization.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {doc.reportDeliveryWhatsApp && (
                        <span title="Automated WhatsApp PDF Report Enabled" className="text-emerald-600">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {doc.reportDeliveryEmail && (
                        <span title="Automated Email Report Enabled" className="text-blue-500">
                          <Mail className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-sky-600 font-bold" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                <p>No doctors found matching &ldquo;{search}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Register &ldquo;{search}&rdquo; as New Doctor
                </button>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              {doctors.length} doctors available
            </span>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="font-bold text-sky-700 hover:text-sky-900 transition inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Register New Doctor
            </button>
          </div>
        </div>
      )}

      {/* Quick Add Doctor Wizard Modal */}
      <RegisterDoctorWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={() => {
          setShowWizard(false);
          // Refresh list and pick up latest registered doctor
          doctorApi.getAll({ limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }).then((res: any) => {
            const latest = res?.data?.doctors?.[0] || res?.data?.[0];
            if (latest) {
              handleSelect(latest);
            }
          });
        }}
      />
    </div>
  );
}
