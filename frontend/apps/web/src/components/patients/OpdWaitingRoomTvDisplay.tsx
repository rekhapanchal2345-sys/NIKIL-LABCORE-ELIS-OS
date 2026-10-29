'use client';

import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  Activity,
  Flame,
  Shield,
  Stethoscope,
  FlaskConical,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Tv,
} from 'lucide-react';
import { QueueToken } from './OpdLiveQueue';
import { queueAudio } from '@/lib/queue-chime';

interface OpdWaitingRoomTvDisplayProps {
  tokens: QueueToken[];
  currentlyServing: QueueToken | null;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function OpdWaitingRoomTvDisplay({
  tokens,
  currentlyServing,
  onClose,
  soundEnabled,
  onToggleSound,
}: OpdWaitingRoomTvDisplayProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDaylightMode, setIsDaylightMode] = useState<boolean>(false); // Daylight White vs Dark Theater

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Station groups
  const stationGroups = [
    {
      id: 'PHLEBOTOMY',
      name: 'Phlebotomy Sample Collection',
      icon: FlaskConical,
      badgeColor: isDaylightMode
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      activeTokens: tokens.filter(
        (t) => (t.status === 'CALLED' || t.status === 'IN_SERVICE') && t.stage === 'PHLEBOTOMY'
      ),
    },
    {
      id: 'CONSULTATION',
      name: 'Doctor OPD Consultations',
      icon: Stethoscope,
      badgeColor: isDaylightMode
        ? 'bg-sky-50 text-sky-800 border-sky-200'
        : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      activeTokens: tokens.filter(
        (t) => (t.status === 'CALLED' || t.status === 'IN_SERVICE') && t.stage === 'CONSULTATION'
      ),
    },
    {
      id: 'VITALS',
      name: 'Triage & Vital Signs Desk',
      icon: Flame,
      badgeColor: isDaylightMode
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      activeTokens: tokens.filter(
        (t) => (t.status === 'CALLED' || t.status === 'IN_SERVICE') && t.stage === 'WAITING_VITALS'
      ),
    },
    {
      id: 'BILLING',
      name: 'Billing & Report Dispatch',
      icon: Activity,
      badgeColor: isDaylightMode
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeTokens: tokens.filter(
        (t) => (t.status === 'CALLED' || t.status === 'IN_SERVICE') && t.stage === 'BILLING_DISPATCH'
      ),
    },
  ];

  const upcomingQueue = tokens
    .filter((t) => t.status === 'WAITING')
    .slice(0, 8);

  const emergencyTokens = tokens.filter(
    (t) => t.priority === 'EMERGENCY' && t.status !== 'COMPLETED'
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none font-sans transition-colors duration-300 ${
        isDaylightMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'
      }`}
    >
      {/* ── Top Hospital Bar ────────────────────────────────────────── */}
      <header
        className={`px-6 py-4 flex items-center justify-between border-b shadow-md transition-colors ${
          isDaylightMode
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Medical Cross Vector Emblem */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center font-black text-white shadow-md shadow-teal-600/30">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 10.5h-5.5V5a1.5 1.5 0 0 0-3 0v5.5H5a1.5 1.5 0 0 0 0 3h5.5V19a1.5 1.5 0 0 0 3 0v-5.5H19a1.5 1.5 0 0 0 0-3z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>LABCORE MEDICAL LIS & HOSPITAL</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Display
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              ISO 15189 Certified · Ambulatory Care & OPD Flow Orchestrator
            </p>
          </div>
        </div>

        {/* Live Clock & Control Tray */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div
              className={`text-2xl font-black tracking-wider font-mono ${
                isDaylightMode ? 'text-teal-700' : 'text-teal-400'
              }`}
            >
              {time}
            </div>
            <div className="text-xs text-slate-400 font-medium">{date}</div>
          </div>

          <div
            className={`flex items-center gap-2 pl-4 border-l ${
              isDaylightMode ? 'border-slate-200' : 'border-slate-800'
            }`}
          >
            {/* Daylight vs Dark Mode */}
            <button
              type="button"
              onClick={() => setIsDaylightMode(!isDaylightMode)}
              className={`p-2.5 rounded-xl border transition ${
                isDaylightMode
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-amber-400'
              }`}
              title={isDaylightMode ? 'Switch to Dark Theater' : 'Switch to Daylight Medical White'}
            >
              {isDaylightMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2.5 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-teal-600/20 border-teal-500/40 text-teal-600'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Chime ON' : 'Chime Muted'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2.5 rounded-xl border transition ${
                isDaylightMode
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 transition"
              title="Close Kiosk"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Emergency STAT Alert Ticker (if any) ───────────────────── */}
      {emergencyTokens.length > 0 && (
        <div className="bg-rose-600 text-white px-6 py-2 flex items-center justify-between text-xs font-black uppercase tracking-wider shadow-inner animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>CRITICAL STAT ALERT: {emergencyTokens.length} Emergency Patient(s) In Priority Care</span>
          </div>
          <span className="text-[11px] font-mono">Immediate Lab Triage Protocol Active</span>
        </div>
      )}

      {/* ── Main Split Board ──────────────────────────────────────── */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Active Now Serving Stations (8 cols) */}
        <section className="col-span-8 flex flex-col gap-5 overflow-y-auto pr-2">
          {/* Main Hero Callout: Currently Called Token */}
          {currentlyServing ? (
            <div
              className={`p-6 rounded-3xl border-2 flex items-center justify-between relative overflow-hidden transition-all shadow-xl ${
                isDaylightMode
                  ? 'bg-gradient-to-r from-teal-50 via-white to-sky-50 border-teal-500 shadow-teal-500/10'
                  : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-teal-500/70 shadow-2xl'
              }`}
            >
              <div className="flex items-center gap-6 relative z-10">
                <div
                  className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center font-black shadow-2xl shrink-0 ring-4 ${
                    isDaylightMode
                      ? 'bg-slate-900 text-white ring-teal-500'
                      : 'bg-white text-slate-950 ring-teal-400'
                  }`}
                >
                  <span
                    className={`text-[11px] uppercase font-black tracking-widest ${
                      isDaylightMode ? 'text-teal-400' : 'text-teal-700'
                    }`}
                  >
                    NOW CALLING
                  </span>
                  <span className="text-4xl tracking-tight leading-none mt-1 font-mono">
                    {currentlyServing.tokenNumber}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2
                      className={`text-3xl font-black tracking-tight ${
                        isDaylightMode ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {currentlyServing.patientName}
                    </h2>
                    {currentlyServing.priority === 'EMERGENCY' && (
                      <span className="px-3 py-1 rounded-md text-xs font-black bg-rose-600 text-white uppercase tracking-wider animate-bounce">
                        STAT EMERGENCY
                      </span>
                    )}
                    {currentlyServing.priority === 'VIP' && (
                      <span className="px-3 py-1 rounded-md text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                        VIP
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-sm mt-1 font-medium ${
                      isDaylightMode ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    UHID:{' '}
                    <span className="font-mono font-bold text-teal-600">{currentlyServing.uhid}</span> ·{' '}
                    {currentlyServing.gender} · {currentlyServing.age} yrs
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isDaylightMode ? 'text-slate-500' : 'text-teal-300'
                      }`}
                    >
                      Proceed To:
                    </span>
                    <span className="px-4 py-1.5 rounded-xl bg-teal-600 text-white font-black text-base tracking-wide shadow-md">
                      {currentlyServing.counterName}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => queueAudio.announceToken(currentlyServing)}
                className={`px-4 py-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2 shrink-0 relative z-10 ${
                  isDaylightMode
                    ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <Volume2 size={18} />
                <span>Re-Announce</span>
              </button>
            </div>
          ) : (
            <div
              className={`p-8 rounded-3xl border text-center ${
                isDaylightMode
                  ? 'bg-white border-slate-200 text-slate-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold text-slate-700">Hospital Queue Active</h3>
              <p className="text-xs text-slate-400 mt-1">Tokens will be announced automatically upon call.</p>
            </div>
          )}

          {/* Department Stations Grid */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {stationGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.id}
                  className={`p-4 rounded-3xl border flex flex-col justify-between transition-colors ${
                    isDaylightMode
                      ? 'bg-white border-slate-200/90 shadow-xs'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/40">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-xl border ${group.badgeColor}`}>
                        <Icon size={16} />
                      </div>
                      <h4
                        className={`text-xs font-extrabold tracking-wide uppercase ${
                          isDaylightMode ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        {group.name}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isDaylightMode
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {group.activeTokens.length} Active
                    </span>
                  </div>

                  <div className="py-3 flex-1 flex flex-col gap-2 justify-center">
                    {group.activeTokens.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 italic">
                        No patient currently serving at counter
                      </div>
                    ) : (
                      group.activeTokens.map((tok) => (
                        <div
                          key={tok.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between ${
                            isDaylightMode
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-slate-800/80 border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xl font-black font-mono tracking-tight ${
                                isDaylightMode ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              {tok.tokenNumber}
                            </span>
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  isDaylightMode ? 'text-slate-800' : 'text-slate-200'
                                }`}
                              >
                                {tok.patientName}
                              </div>
                              <div className="text-[10px] text-slate-400">{tok.counterName}</div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              tok.status === 'CALLED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {tok.status === 'CALLED' ? 'CALLED' : 'IN SERVICE'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Next Up Queue Ticker (4 cols) */}
        <section
          className={`col-span-4 rounded-3xl border p-5 flex flex-col justify-between shadow-xl ${
            isDaylightMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3
                  className={`font-black text-sm uppercase tracking-wider ${
                    isDaylightMode ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Upcoming Waiting Queue
                </h3>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {upcomingQueue.length} In Line
              </span>
            </div>

            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              {upcomingQueue.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  All registered patients have been attended.
                </div>
              ) : (
                upcomingQueue.map((tok, idx) => (
                  <div
                    key={tok.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      isDaylightMode
                        ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        : 'bg-slate-950/70 hover:border-slate-700 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black font-mono text-xs ${
                          isDaylightMode
                            ? 'bg-white border-slate-300 text-slate-700'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-black font-mono ${
                              isDaylightMode ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {tok.tokenNumber}
                          </span>
                          {tok.priority === 'EMERGENCY' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                              STAT
                            </span>
                          )}
                          {tok.priority === 'VIP' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                          {tok.patientName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-bold text-teal-700">{tok.counterName}</div>
                      <div className="text-[10px] text-slate-400">
                        ~{Math.max(2, (idx + 1) * 3.5)}m wait
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Please keep your token receipt ready. Scan QR code on your slip to view live status on phone.
            </p>
          </div>
        </section>
      </main>

      {/* ── Bottom Announcement Ticker ────────────────────────────── */}
      <footer
        className={`px-6 py-2.5 border-t flex items-center gap-4 text-xs font-medium overflow-hidden shadow-inner ${
          isDaylightMode
            ? 'bg-slate-50 border-slate-200 text-slate-600'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <span className="px-2.5 py-0.5 rounded font-black text-[10px] uppercase tracking-wider bg-teal-600 text-white shrink-0">
          CLINICAL NOTICE / सूचना
        </span>
        <div className="whitespace-nowrap overflow-hidden text-slate-600 dark:text-slate-300">
          Senior citizens and fasting diabetic patients please proceed directly to Phlebotomy Booth 2 for priority blood collection · Results are automatically dispatched to your registered WhatsApp
        </div>
      </footer>
    </div>
  );
}
