'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, Sliders, Play, Check, Sparkles, BellRing } from 'lucide-react';
import { queueAudio, ChimeStyle, AnnouncementLanguage, ChimeSettings } from '@/lib/queue-chime';

interface ChimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChimeSettingsModal({ isOpen, onClose }: ChimeSettingsModalProps) {
  const [settings, setSettings] = useState<ChimeSettings>(queueAudio.getSettings());
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(queueAudio.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<ChimeSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    queueAudio.updateSettings(partial);
  };

  const handleTestChimeOnly = async (style: ChimeStyle) => {
    setIsPlayingTest(true);
    await queueAudio.playHospitalChime(style);
    setIsPlayingTest(false);
  };

  const handleTestFullAnnouncement = async () => {
    setIsPlayingTest(true);
    await queueAudio.testPreviewAnnouncement();
    setIsPlayingTest(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-cyan-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <BellRing size={20} className="text-teal-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Hospital Chime & Audio Settings</h3>
              <p className="text-xs text-teal-100">Configure acoustic bells, speech language & cadence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Chime Style Selector */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              Acoustic Chime Tone
            </label>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {[
                { id: 'CRYSTAL_BELL', label: 'Crystal Bell (3-Tone)', desc: 'Medical Triad (G5-E5-C5)' },
                { id: 'AIRPORT_DINGDONG', label: 'Classic Ding-Dong', desc: 'Warm 2-Tone (F5-C5)' },
                { id: 'ELEVATED_TRIAD', label: 'Ascending Chime', desc: 'Upward Triad (C5-E5-G5)' },
                { id: 'SUBTLE_PING', label: 'Subtle Medical Ping', desc: 'Soft Pure Tone (A5)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    handleUpdate({ style: c.id as ChimeStyle });
                    handleTestChimeOnly(c.id as ChimeStyle);
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    settings.style === c.id
                      ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-extrabold text-slate-800">{c.label}</span>
                    {settings.style === c.id && <Check size={13} className="text-teal-600 font-bold" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Announcement Language */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              Announcement Voice Language
            </label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { id: 'both', label: 'Bilingual (EN + HI)' },
                { id: 'en', label: 'English Only' },
                { id: 'hi', label: 'Hindi Only (हिंदी)' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleUpdate({ language: l.id as AnnouncementLanguage })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                    settings.language === l.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Master Volume</span>
              <span className="font-mono font-bold text-teal-700">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.volume}
              onChange={(e) => handleUpdate({ volume: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Speech Cadence / Speed</span>
              <span className="font-mono font-bold text-teal-700">{settings.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.15"
              step="0.02"
              value={settings.rate}
              onChange={(e) => handleUpdate({ rate: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Test Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isPlayingTest}
              onClick={handleTestFullAnnouncement}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-800 border border-slate-200 hover:border-teal-300 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" />
              <span>{isPlayingTest ? 'Playing Acoustic Chime...' : 'Test Sample Announcement'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
