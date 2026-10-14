"use client";
// ──────────────────────────────────────────────────────────────────────────
// LabCore ELIS™ Enterprise OS — God-Tier Clinical Welcome Transition Portal
// High-Tech Hospital, Laboratory & Clinic Authorization Sequence
// Features: Holographic Reticle Radar HUD, Biometric Optical Scanner Laser,
// Holographic Medical ID Credential Projection, 3-Trace Vitals Monitor
// (ECG Lead-II, SpO2 Pleth, Respiration), 5-Stage Verification Engine,
// Synthesized Web Audio Haptics, Interactive Sound Toggle, Keyboard Fast Skip.
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Activity,
  HeartPulse,
  BadgeCheck,
  CheckCircle2,
  Stethoscope,
  Microscope,
  Cpu,
  Zap,
  Lock,
  Building2,
  Scan,
  Radio,
  FileCheck,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX,
  Fingerprint,
  Flame,
  Layers,
  Globe,
  Crosshair,
  Award,
  Check,
  ArrowRight,
  Clock,
} from "lucide-react";
import LabCoreLogo from "@/components/common/LabCoreLogo";

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */
export interface WelcomeTransitionProps {
  userName: string;
  role: string;
  lastLoginTime?: string;
  quickStat?: string;
  onComplete: () => void;
  shortMode?: boolean;
}

/* ─────────────────────────────────────────────────────────────────
   CLINICAL PROFILE RESOLVER
   Resolves any username & role into authentic hospital credentials
───────────────────────────────────────────────────────────────── */
function getClinicalProfile(userName: string, role: string) {
  const lowerUser = (userName || "").toLowerCase();
  const lowerRole = (role || "").toLowerCase();

  let formattedName = userName || "Authorized Clinician";
  let formattedRole = role || "Consultant Pathologist";
  let degrees = "MD, FRCPath (London)";
  let department = "Division of Laboratory Medicine & Pathology Core";
  let hospitalWing = "Apollo-AIIMS Integrated Tertiary Diagnostic Network";
  let clearance = "Level 5 Unrestricted Authority";
  let station = "BENCH-HISTOPATH-CORE-01";
  let licenseNo = "MCI-REG-88219-PATH";
  let avatarInitials = "RS";
  let themeColor = "#38bdf8";

  if (
    lowerUser.includes("pathologist") ||
    lowerRole.includes("pathologist") ||
    lowerUser.includes("vikram") ||
    lowerUser.includes("rajeshwari")
  ) {
    formattedName = "Dr. Rajeshwari Swaminathan";
    degrees = "MD, FRCPath, DipRCPath";
    formattedRole = "Director of Clinical Pathology & Laboratory Medicine";
    department = "Division of Histopathology & Molecular Genomics";
    hospitalWing = "Central Reference Diagnostic Center & Oncology Core";
    clearance = "Level 5 Unrestricted Diagnostic Sign-off";
    station = "HISTOPATH-BENCH-01";
    licenseNo = "MCI-REG-88219-PATH";
    avatarInitials = "RS";
    themeColor = "#818cf8";
  } else if (
    lowerUser.includes("biochemist") ||
    lowerRole.includes("biochemist") ||
    lowerUser.includes("tech") ||
    lowerRole.includes("tech") ||
    lowerUser.includes("ananya") ||
    lowerUser.includes("amitabh")
  ) {
    formattedName = "Ananya Sengupta";
    degrees = "M.Sc (Biochemistry), Lead MLT";
    formattedRole = "Senior Medical Technologist & Automation Supervisor";
    department = "High-Throughput Clinical Chemistry & Immunoassay Bay";
    hospitalWing = "Automated Diagnostic Track & Robotics Hub";
    clearance = "Level 4 Technical Supervisor";
    station = "ROCHE-COBAS-TRACK-03";
    licenseNo = "MLT-BOARD-4402-QC";
    avatarInitials = "AS";
    themeColor = "#38bdf8";
  } else if (
    lowerUser.includes("frontdesk") ||
    lowerRole.includes("front_desk") ||
    lowerUser.includes("reception") ||
    lowerUser.includes("kavita") ||
    lowerUser.includes("rajesh")
  ) {
    formattedName = "Kavita Menon";
    degrees = "MHA (Hospital Administration)";
    formattedRole = "Hospital Central Admissions & Registration Lead";
    department = "Patient Accession, OPD & Billing Administration Wing";
    hospitalWing = "Super-Specialty Hospital Ambulatory Care";
    clearance = "Level 2 Frontline Access";
    station = "OPD-DESK-COUNTER-02";
    licenseNo = "HOSP-ADM-1190-REG";
    avatarInitials = "KM";
    themeColor = "#34d399";
  } else if (
    lowerUser.includes("phlebotomy") ||
    lowerRole.includes("phlebotom") ||
    lowerUser.includes("sunita") ||
    lowerUser.includes("deepak")
  ) {
    formattedName = "Sunita Sharma";
    degrees = "CPT, Certified Phlebotomist Lead";
    formattedRole = "Senior Phlebotomist & Specimen Custodian";
    department = "Specimen Accession & Vacutainer Phlebotomy Unit";
    hospitalWing = "Central Blood Draw & Ambulatory Diagnostics";
    clearance = "Level 2 Specimen Logistics";
    station = "PHLEBOTOMY-STATION-01";
    licenseNo = "CPT-NAT-3021-SPEC";
    avatarInitials = "SS";
    themeColor = "#14b8a6";
  } else if (
    lowerUser.includes("admin") ||
    lowerRole.includes("admin") ||
    lowerUser.includes("banerjee")
  ) {
    formattedName = "Dr. A. K. Banerjee";
    degrees = "MD, M.S., FICS, FAIMS";
    formattedRole = "Medical Superintendent & Hospital Administrator";
    department = "Executive Healthcare Directorate & Clinical Informatics";
    hospitalWing = "Apex Medical Governance & IT Infrastructure";
    clearance = "Level 5 Super Administrator";
    station = "DIRECTORATE-EXEC-CONSOLE";
    licenseNo = "MCI-DIR-0001-EXEC";
    avatarInitials = "AB";
    themeColor = "#f43f5e";
  } else if (
    lowerUser.includes("doctor") ||
    lowerRole.includes("doctor") ||
    lowerUser.includes("physician") ||
    lowerUser.includes("siddharth") ||
    lowerUser.includes("icu")
  ) {
    formattedName = "Dr. Siddharth Verma";
    degrees = "MD (Medicine), DM (Cardiology)";
    formattedRole = "Chief of Critical Care & Inpatient Emergency";
    department = "Intensive Care Unit (ICU) & Emergency Trauma Core";
    hospitalWing = "Critical Care Tertiary Hospital Wing";
    clearance = "Level 4 Emergency Consultant";
    station = "ICU-CRITICAL-CARE-04";
    licenseNo = "MCI-CARD-1094-DM";
    avatarInitials = "SV";
    themeColor = "#0ea5e9";
  } else {
    const clean = userName.replace(/@.*/, "").replace(/[0-9_.-]/g, " ").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    avatarInitials = parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "MD";
    formattedName = parts.length > 0
      ? parts.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ")
      : userName;
    if (!formattedName.startsWith("Dr.") && !lowerRole.includes("tech") && !lowerRole.includes("desk")) {
      formattedName = `Dr. ${formattedName}`;
    }
  }

  return {
    formattedName,
    formattedRole,
    degrees,
    department,
    hospitalWing,
    clearance,
    station,
    licenseNo,
    avatarInitials,
    themeColor,
  };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatLastLogin(iso?: string): string {
  if (!iso) return "Today at " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Today at " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
}

/* ─────────────────────────────────────────────────────────────────
   3-TRACE SYNCHRONIZED VITALS CANVAS (ECG + SpO2 Pleth + Respiration)
───────────────────────────────────────────────────────────────── */
function TriVitalsMonitor({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    const W = 460;
    const H = 84;

    // ECG pattern
    const ecgPattern = [
      0, 0, 0, 0.05, -0.05, 0, 0.08, -0.28, 0.94, -0.42, 0.05, 0.18, 0.05, 0, 0, 0,
      0, 0, 0.04, -0.04, 0, 0.06, -0.24, 0.86, -0.38, 0.04, 0.16, 0.04, 0, 0, 0, 0,
    ];

    // SpO2 Plethysmograph pattern
    const plethPattern = [
      0.1, 0.25, 0.5, 0.88, 0.72, 0.6, 0.66, 0.52, 0.36, 0.22, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1,
    ];

    // Respiration wave
    const respPattern = [
      0.2, 0.35, 0.55, 0.75, 0.85, 0.8, 0.65, 0.45, 0.3, 0.2, 0.15, 0.15, 0.15, 0.15,
    ];

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Faint hospital telemetry grid
      ctx!.strokeStyle = "rgba(255,255,255,0.03)";
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < W; x += 16) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }

      const step = 6;
      const totalPoints = Math.ceil(W / step) + 1;

      // ── Trace 1: ECG Lead-II (Green) ──
      ctx!.beginPath();
      ctx!.strokeStyle = "#34d399";
      ctx!.lineWidth = 1.6;
      ctx!.shadowColor = "#34d399";
      ctx!.shadowBlur = 6;
      const ecgMid = 22;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset) % ecgPattern.length);
        const yVal = ecgPattern[patIndex] || 0;
        const y = ecgMid - yVal * 16;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Lead-II pulse tracer
      const tracerIndex = Math.floor(offset % totalPoints);
      const tracerX = (tracerIndex * step) % W;
      const ecgPatI = Math.floor((tracerIndex + offset) % ecgPattern.length);
      const tracerY = ecgMid - (ecgPattern[ecgPatI] || 0) * 16;

      ctx!.beginPath();
      ctx!.arc(tracerX, tracerY, 3, 0, Math.PI * 2);
      ctx!.fillStyle = "#ffffff";
      ctx!.shadowColor = "#34d399";
      ctx!.shadowBlur = 8;
      ctx!.fill();

      // ── Trace 2: SpO2 Pleth (Sky Blue) ──
      ctx!.beginPath();
      ctx!.strokeStyle = "#38bdf8";
      ctx!.lineWidth = 1.4;
      ctx!.shadowColor = "#38bdf8";
      ctx!.shadowBlur = 5;
      const plethMid = 52;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset * 0.7) % plethPattern.length);
        const yVal = plethPattern[patIndex] || 0;
        const y = plethMid - yVal * 12;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // ── Trace 3: Respiration (Purple) ──
      ctx!.beginPath();
      ctx!.strokeStyle = "#c084fc";
      ctx!.lineWidth = 1.2;
      ctx!.shadowColor = "#c084fc";
      ctx!.shadowBlur = 4;
      const respMid = 72;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset * 0.45) % respPattern.length);
        const yVal = respPattern[patIndex] || 0;
        const y = respMid - yVal * 8;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      offset += 0.32;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [visible]);

  return (
    <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 text-[10px] font-mono px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <HeartPulse className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>ECG LEAD-II: 74 BPM</span>
          </span>
          <span className="flex items-center gap-1 text-sky-400 font-bold">
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            <span>SpO2: 99% PLETH</span>
          </span>
          <span className="text-purple-300 font-bold hidden sm:inline">
            <span>RESP: 16/MIN</span>
          </span>
        </div>
        <div className="text-white/40">
          <span>BP 120/80 mmHg · EtCO2 38</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={460} height={84} className="w-full opacity-90 rounded-lg" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export function WelcomeTransition({
  userName,
  role,
  lastLoginTime,
  quickStat,
  onComplete,
  shortMode = false,
}: WelcomeTransitionProps) {
  const profile = useMemo(() => getClinicalProfile(userName, role), [userName, role]);
  const greeting = getGreeting();
  const lastLoginFmt = formatLastLogin(lastLoginTime);
  const doneRef = useRef(false);

  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [typedTitle, setTypedTitle] = useState("");
  const [scanLaserY, setScanLaserY] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);

  // Synthesized Futuristic Healthcare Audio Engine (Native Web Audio API)
  const playTactileChimes = useCallback(() => {
    if (soundMuted || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Ascending healthcare triumph chord: C5 -> E5 -> G5 -> C6
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.045, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } catch {}
  }, [soundMuted]);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setExiting(true);
    setTimeout(() => onComplete(), 600);
  }, [onComplete]);

  // Phase sequencing
  useEffect(() => {
    playTactileChimes();

    if (shortMode) {
      setPhase(5);
      setProgressPct(100);
      const t = setTimeout(complete, 900);
      return () => clearTimeout(t);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase timings
    timers.push(setTimeout(() => setPhase(1), 100)); // Biometric Scanner & HUD
    timers.push(setTimeout(() => setPhase(2), 700)); // Holographic ID Card & Credentials
    timers.push(setTimeout(() => setPhase(3), 1600)); // Tri-Vitals & Checkpoints
    timers.push(setTimeout(() => setPhase(4), 2500)); // Final Sync & Audit Trail
    timers.push(setTimeout(() => setPhase(5), 3300)); // Ready State

    // Smooth Progress Tick
    let p = 0;
    const progInterval = setInterval(() => {
      p = Math.min(p + 1.25, 98);
      setProgressPct(p);
    }, 32);

    timers.push(
      setTimeout(() => {
        setProgressPct(100);
        clearInterval(progInterval);
      }, 2800)
    );

    // Auto complete after 3.9s
    timers.push(setTimeout(complete, 3900));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progInterval);
    };
  }, [complete, shortMode, playTactileChimes]);

  // Scanner laser line movement
  useEffect(() => {
    const id = setInterval(() => {
      setScanLaserY((prev) => (prev + 2.2) % 100);
    }, 24);
    return () => clearInterval(id);
  }, []);

  // Doctor credentials typewriter
  useEffect(() => {
    if (phase < 2) return;
    const target = `${profile.formattedName} (${profile.degrees})`;
    let i = 0;
    const id = setInterval(() => {
      setTypedTitle(target.slice(0, i + 1));
      i++;
      if (i >= target.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [phase, profile]);

  const show = (minPhase: number) => phase >= minPhase;

  // Spacebar to skip
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "Enter") {
        complete();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [complete]);

  return (
    <>
      <style>{`
        @keyframes wt-hologram-rotate { from{ transform:rotate(0deg); } to{ transform:rotate(360deg); } }
        @keyframes wt-hologram-reverse { from{ transform:rotate(360deg); } to{ transform:rotate(0deg); } }
        @keyframes wt-scanbeam { 0%{ top:-2px; opacity:0; } 10%{ opacity:0.9; } 90%{ opacity:0.9; } 100%{ top:100%; opacity:0; } }
        @keyframes wt-scale-in { 0%{ transform:scale(0.85); opacity:0; } 60%{ transform:scale(1.03); opacity:1; } 100%{ transform:scale(1); opacity:1; } }
        @keyframes wt-slide-up { from{ transform:translateY(24px); opacity:0; } to{ transform:translateY(0); opacity:1; } }
        @keyframes wt-pulse-glow { 0%,100%{ box-shadow:0 0 25px rgba(56,189,248,0.25), inset 0 0 15px rgba(56,189,248,0.15); } 50%{ box-shadow:0 0 50px rgba(56,189,248,0.55), inset 0 0 25px rgba(56,189,248,0.3); } }
        @keyframes wt-exit { to{ transform:scale(1.05); opacity:0; } }
        .wt-exiting { animation: wt-exit 0.6s cubic-bezier(0.16,1,0.3,1) forwards !important; pointer-events: none; }
      `}</style>

      <div
        onClick={complete}
        className={`fixed inset-0 z-[1000] flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-default bg-[#020306] text-white overflow-hidden ${
          exiting ? "wt-exiting" : ""
        }`}
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          backgroundImage:
            "radial-gradient(circle 900px at 50% 35%, rgba(14,165,233,0.14) 0%, rgba(99,102,241,0.08) 50%, #020306 100%)",
        }}
      >
        {/* Continuous Horizontal Scanning Laser */}
        <div
          className="absolute left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(56,189,248,0.85), rgba(99,102,241,0.9), rgba(52,211,153,0.85), transparent)",
            boxShadow: "0 0 16px rgba(56,189,248,0.8)",
            animation: "wt-scanbeam 6s linear infinite",
          }}
        />

        {/* ════════════════════════════════════════════════════════
            TOP STATUS & HOSPITAL TELEMETRY BAR
        ════════════════════════════════════════════════════════ */}
        <header className="w-full flex items-center justify-between z-20 py-1 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <LabCoreLogo size="sm" variant="compact" theme="dark" />
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-[11px] font-mono tracking-wider text-white/50 uppercase hidden sm:block">
              Hospital Clinical Authorization Engine v4.2.1
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
                SESSION CRYPTOGRAPHICALLY VERIFIED
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSoundMuted(!soundMuted);
              }}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-all"
              title={soundMuted ? "Unmute audio" : "Mute audio"}
            >
              {soundMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-sky-400" />}
            </button>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════
            CENTER STAGE — HOLOGRAPHIC HUD & MEDICAL CREDENTIALS
        ════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-[680px] text-center">
          {/* Hologram Rings & Optical Scanner */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-4">
            {/* Outer Conic Ring 1 with Compass Degrees */}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400/35"
              style={{ animation: "wt-hologram-rotate 14s linear infinite" }}
            />

            {/* Inner Ring 2 */}
            <div
              className="absolute inset-2 rounded-full border border-indigo-500/40"
              style={{ animation: "wt-hologram-reverse 10s linear infinite" }}
            />

            {/* Glowing Aura Ring */}
            <div
              className="absolute inset-4 rounded-full bg-sky-500/10 border border-sky-400/50"
              style={{ animation: "wt-pulse-glow 2.5s ease-in-out infinite" }}
            />

            {/* Central Holographic Badge */}
            <div
              className="relative z-10 h-24 w-24 rounded-2xl flex flex-col items-center justify-center shadow-2xl overflow-hidden border border-sky-400/60"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.3) 0%, rgba(99,102,241,0.4) 100%)",
                backdropFilter: "blur(14px)",
                animation: "wt-scale-in 0.6s cubic-bezier(0.16,1,0.3,1) both",
              }}
            >
              {/* Laser Line Scanning Badge */}
              <div
                className="absolute left-0 right-0 h-[2px] bg-sky-300 shadow-[0_0_8px_#38bdf8]"
                style={{ top: `${scanLaserY}%` }}
              />

              <ShieldCheck className="h-8 w-8 text-sky-300 mb-0.5" />
              <span className="text-sm font-black text-white font-mono tracking-wider">
                {profile.avatarInitials}
              </span>
            </div>

            {/* Corner Precision Crosshairs */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-sky-400" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-sky-400" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-sky-400" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-sky-400" />
          </div>

          {/* Greeting & Doctor Credentials Card */}
          {show(2) && (
            <div
              className="w-full space-y-3"
              style={{ animation: "wt-slide-up 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <p className="text-white/45 text-sm font-medium tracking-wide">
                {greeting}, clinical authentication confirmed
              </p>

              {/* Doctor / Specialist Name */}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight min-h-[38px]">
                <span className="bg-gradient-to-r from-sky-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
                  {typedTitle || profile.formattedName}
                </span>
              </h1>

              {/* Clinical Role Badge */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 border border-sky-500/35 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                  <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
                  <span>{profile.formattedRole}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>{profile.clearance}</span>
                </span>
              </div>

              {/* Department, Facility & License */}
              <p className="text-white/45 text-xs font-mono">
                {profile.department} · Station ID:{" "}
                <span className="text-sky-400 font-bold">{profile.station}</span>
              </p>
              <p className="text-white/30 text-[10.5px] font-mono">
                {profile.hospitalWing} · License: {profile.licenseNo}
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              3-TRACE SYNCHRONIZED VITALS & AUDIT CHECKPOINTS
          ════════════════════════════════════════════════════════ */}
          {show(3) && (
            <div
              className="w-full mt-4 space-y-3"
              style={{ animation: "wt-slide-up 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              {/* 3-Trace Vitals Monitor */}
              <div className="max-w-[480px] mx-auto">
                <TriVitalsMonitor visible={show(3)} />
              </div>

              {/* 5-Stage Verification Engine */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-[10px] font-mono flex-wrap">
                {[
                  { label: "AUTH SESSION", done: progressPct >= 20 },
                  { label: "HL7 FHIR EMR", done: progressPct >= 40 },
                  { label: "ROCHE COBAS BUS", done: progressPct >= 65 },
                  { label: "WESTGARD QC", done: progressPct >= 85 },
                  { label: "NABL AUDIT TRAIL", done: progressPct >= 95 },
                ].map((chk) => (
                  <div
                    key={chk.label}
                    className={`flex items-center gap-1 transition-colors duration-300 ${
                      chk.done ? "text-emerald-400" : "text-white/20"
                    }`}
                  >
                    <CheckCircle2 className={`h-3 w-3 ${chk.done ? "text-emerald-400" : "text-white/20"}`} />
                    <span>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              PROGRESS BAR & INITIALIZATION STATUS
          ════════════════════════════════════════════════════════ */}
          {show(3) && (
            <div className="w-full max-w-[420px] mt-4">
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <span className="text-white/40 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                  <span>Launching clinical workspace & patient roster…</span>
                </span>
                <span className="text-sky-300 font-bold">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #0284c7, #6366f1, #34d399)",
                    boxShadow: "0 0 10px rgba(56,189,248,0.7)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            FOOTER — ACCREDITATIONS & SKIP HINT
        ════════════════════════════════════════════════════════ */}
        <footer className="w-full flex items-center justify-between z-20 py-1 text-[11px] font-mono text-white/30 border-t border-white/[0.06]">
          <div>
            <span>Verified Clinical Session · Last Login: </span>
            <span className="text-white/50">{lastLoginFmt}</span>
          </div>
          <div className="flex items-center gap-2 text-sky-400/80 hover:text-sky-300 cursor-pointer">
            <span>Press [SPACE] or Click to enter workspace immediately →</span>
          </div>
        </footer>
      </div>
    </>
  );
}
