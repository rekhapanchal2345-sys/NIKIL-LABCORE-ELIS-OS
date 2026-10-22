'use client';

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  PhoneCall,
  AlertOctagon,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Search,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface QuickCommunicationSlideoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCommunicationSlideover({
  isOpen,
  onClose,
}: QuickCommunicationSlideoverProps) {
  const [activeTab, setActiveTab] = useState<'quick_send' | 'panic_alerts' | 'unread'>('panic_alerts');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleQuickSend = () => {
    if (!recipientNumber.trim()) return;
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setRecipientNumber('');
      setQuickMessage('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">Quick Communication Desk</h3>
              <p className="text-[10px] text-slate-500">Universal Clinical Messaging Overlay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-2 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-xl">
            {[
              { id: 'panic_alerts', label: '🚨 Panic (2)' },
              { id: 'unread', label: '💬 Inquiries (4)' },
              { id: 'quick_send', label: '⚡ Quick Send' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0F766E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'panic_alerts' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">
                    SLA: 6 min remaining
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                </div>
                <h4 className="font-extrabold text-xs text-rose-950 mt-1">
                  Sunita Devi (62Y/F) - UHID: 88399
                </h4>
                <p className="text-xs text-rose-800 font-semibold mt-0.5">
                  Serum Potassium (K+) = 6.8 mmol/L (Severe Hyperkalemia)
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-rose-200/80">
                  <span className="text-[11px] text-rose-700 font-medium">Dr. V. Nair</span>
                  <a
                    href="tel:+919811477820"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-700 shadow-2xs"
                  >
                    <PhoneCall className="w-3 h-3" /> Call Doctor
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                    SLA: 12 min remaining
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-amber-600" />
                </div>
                <h4 className="font-extrabold text-xs text-amber-950 mt-1">
                  Devendra Singh (48Y/M) - UHID: 88402
                </h4>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  Platelets = 21,000 /uL (Stat Verification)
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-200/80">
                  <span className="text-[11px] text-amber-800 font-medium">Dr. Ananya Sharma</span>
                  <a
                    href="tel:+919811122094"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-600 px-2.5 py-1 rounded-lg hover:bg-amber-700 shadow-2xs"
                  >
                    <PhoneCall className="w-3 h-3" /> Call Doctor
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'unread' && (
            <div className="space-y-2.5">
              {[
                {
                  name: 'Rajesh Verma',
                  msg: 'Is my lipid profile report approved by doctor?',
                  time: '2m ago',
                  tag: 'REPORT_QUERY',
                },
                {
                  name: 'Dr. Ananya Sharma',
                  msg: 'Send troponin delta chart for bed 04',
                  time: '5m ago',
                  tag: 'DOCTOR_DESK',
                },
                {
                  name: 'Kavita Patel',
                  msg: 'What is the fasting time required for Vitamin D?',
                  time: '18m ago',
                  tag: 'FASTING_QUERY',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F172A]">{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.msg}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quick_send' && (
            <div className="space-y-3">
              {isSent ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-extrabold text-emerald-900">Message Dispatched!</p>
                  <p className="text-xs text-emerald-700">Delivered via Meta WhatsApp Cloud API</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Recipient Mobile (with Country Code)
                    </label>
                    <input
                      type="text"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(e.target.value)}
                      placeholder="+91 98201 XXXXX"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                    <textarea
                      rows={4}
                      value={quickMessage}
                      onChange={(e) => setQuickMessage(e.target.value)}
                      placeholder="Dear Patient/Doctor, regarding your LabCore diagnostic sample..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Clinical Templates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Fasting Instructions Reminder',
                        'Sample Redraw Requested',
                        'Report Verified & Dispatched',
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuickMessage(preset + ': Please find the details attached.')}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleQuickSend}
                    disabled={!recipientNumber.trim()}
                    className="w-full mt-2 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0D9488] transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Transmit Clinical Message
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" /> NABL ISO-15189
          </span>
          <a
            href="/communication"
            onClick={onClose}
            className="font-bold text-[#0F766E] hover:underline flex items-center gap-0.5"
          >
            Open Full Command Hub <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
