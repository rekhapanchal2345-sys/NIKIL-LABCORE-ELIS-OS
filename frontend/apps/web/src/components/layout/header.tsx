"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building2,
  Activity,
  Sparkles,
  MessageSquare,
  Volume2,
  VolumeX,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/lib/auth";
import NotificationCenter from "./NotificationCenter";
import GlobalSearchModal from "./GlobalSearchModal";
import LogoutModal from "@/components/auth/LogoutModal";
import QuickCommunicationSlideover from "@/components/communication/QuickCommunicationSlideover";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import ThemeToggle from "./ThemeToggle";
import { useAudioAlerts } from "@/hooks/useAudioAlerts";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export default function Header({
  onMenuClick,
  title = "LabCore ELIS",
}: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { isMuted, toggleMute, testAudio } = useAudioAlerts();
  const [unreadCount, setUnreadCount] = useState(3);
  const [hasCriticalAlert, setHasCriticalAlert] = useState(true);
  const [userInitials, setUserInitials] = useState('JA');
  const [userName, setUserName] = useState('Jaya Ashapurama');
  const [userRole, setUserRole] = useState('ADMIN');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [showQuickComms, setShowQuickComms] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string; isMainBranch: boolean }>>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_branch_id');
      setSelectedBranchId(stored);
      fetch('/api/branches')
        .then(res => res.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            setBranches(json.data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSelectBranch = (bId: string | null) => {
    if (bId) {
      localStorage.setItem('active_branch_id', bId);
    } else {
      localStorage.removeItem('active_branch_id');
    }
    setSelectedBranchId(bId);
    setShowBranchMenu(false);
    window.location.reload();
  };

  // Global Ctrl+K (Search), Ctrl+M (Quick Comms) & Alt+ Quick Action Shortcuts
  useGlobalKeyboardShortcuts({
    onToggleSearch: () => setShowSearchModal((prev) => !prev),
    onOpenQuickComms: () => setShowQuickComms((prev) => !prev),
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Check local profile settings
    try {
      const raw = localStorage.getItem("labcore_settings_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.firstName || parsed.lastName) {
          const fn = `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim();
          if (fn) {
            setUserName(fn);
            const names = fn.split(" ");
            setUserInitials(names.length > 1 ? names[0][0] + names[names.length - 1][0] : names[0][0]);
          }
        }
        if (parsed.profileImage) {
          setUserAvatar(parsed.profileImage);
        }
      }
    } catch (e) {
      // ignore
    }

    if (user?.fullName) {
      const names = user.fullName.split(' ');
      setUserInitials(names.length > 1 
        ? names[0][0] + names[names.length - 1][0]
        : names[0][0]);
      setUserName(user.fullName);
    } else if (user?.email) {
      setUserInitials(user.email[0].toUpperCase());
      setUserName(user.email);
    }
    if (user?.avatar) {
      setUserAvatar(user.avatar as string);
    }
    setUserRole(getRoleLabel(user?.role, "ADMIN"));

    const handleProfileUpdated = (e: any) => {
      const updated = e.detail;
      if (updated?.fullName) {
        setUserName(updated.fullName);
        const names = updated.fullName.split(" ");
        setUserInitials(names.length > 1 ? names[0][0] + names[names.length - 1][0] : names[0][0]);
      }
      if (updated?.avatar || updated?.profileImage) {
        setUserAvatar(updated.avatar || updated.profileImage);
      }
    };

    window.addEventListener("labcore:profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("labcore:profile-updated", handleProfileUpdated);
  }, [user]);

  const handleProfileClick = () => {
    setShowProfile(false);
    router.push("/settings");
  };

  const handleSettingsClick = () => {
    setShowProfile(false);
    router.push("/settings");
  };

  const handleLogout = () => {
    setShowProfile(false);
    setIsLogoutModalOpen(true);
  };

  const executeLogout = async () => {
    if (logout) await logout();
    router.push("/login");
  };

  return (
    <>
      <header className="h-[64px] bg-white border-b border-slate-200/90 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* LEFT: Hospital / Branch & Title */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="w-9 h-9 lg:w-10 lg:h-10 border border-slate-200 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-sm lg:text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
              NABL ISO 15189
            </span>
          </div>

          <div className="text-[11px] text-[#475569] hidden sm:block">
            Clinical Diagnostic Laboratory Information System • Central Facility
          </div>
        </div>
      </div>

      {/* RIGHT: Global Search, Quick Hospital Badges, Notifications & Profile */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Live NABL Critical Panic Alert Ticker */}
        <div
          onClick={() => setShowQuickComms(true)}
          className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold cursor-pointer hover:bg-rose-100 transition-colors shadow-2xs select-none"
          title="Click to view & verbally confirm NABL Critical Panic Values (Ctrl+M)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <span className="text-rose-900 font-extrabold uppercase tracking-tight">🚨 Critical Panic SLA:</span>
          <span>Serum K+ = 6.8 mmol/L (UHID: 88399)</span>
          <span className="rounded bg-rose-200/90 px-1.5 py-0.2 text-[9px] font-mono font-extrabold text-rose-950">6m SLA</span>
        </div>

        {/* Hospital Facility / Multi-Branch Dropdown Selector */}
        <div className="relative hidden xl:block">
          <button
            type="button"
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-slate-200/80 text-[11px] text-[#475569] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Click to switch branch context"
          >
            <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
            <span className="font-semibold text-[#0F172A]">
              {selectedBranchId
                ? branches.find(b => b.id === selectedBranchId)?.name || 'Branch: ' + selectedBranchId.slice(0, 8)
                : 'Central Diagnostics Hub (HQ)'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBranchMenu && (
            <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Laboratory Branch
              </div>
              <button
                type="button"
                onClick={() => handleSelectBranch(null)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${!selectedBranchId ? 'bg-teal-50/50 text-[#0F766E] font-bold' : 'text-slate-700'}`}
              >
                <span>🏢 Central Diagnostics Hub (All Branches)</span>
                {!selectedBranchId && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />}
              </button>
              {branches.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBranch(b.id)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedBranchId === b.id ? 'bg-teal-50/50 text-[#0F766E] font-bold' : 'text-slate-700'}`}
                >
                  <div>
                    <div>{b.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Code: {b.code} {b.isMainBranch ? '(Main Hub)' : ''}</div>
                  </div>
                  {selectedBranchId === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Spotlight Search Trigger */}
        <button
          type="button"
          onClick={() => {
            setShowSearchModal(true);
            setShowNotifications(false);
            setShowProfile(false);
          }}
          aria-label="Search Clinical System"
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-[#F8FAFC] text-slate-500 hover:bg-white hover:border-[#0F766E] hover:text-[#0F172A] transition-all shadow-2xs group cursor-pointer"
          title="Search Patients, Tests, UHID, Orders... (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F766E] transition-colors" />
          <span className="text-xs font-medium pr-1">Search records, tests, UHID...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 group-hover:text-[#0F766E] group-hover:border-teal-300">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={() => {
            setShowSearchModal(true);
            setShowNotifications(false);
            setShowProfile(false);
          }}
          aria-label="Search"
          className="md:hidden w-9 h-9 border border-slate-200 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-slate-600 hover:bg-white hover:text-[#0F172A] hover:border-[#0F766E] transition-colors cursor-pointer"
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Communication Desk Trigger */}
        <button
          type="button"
          onClick={() => {
            setShowQuickComms(true);
            setShowNotifications(false);
            setShowProfile(false);
          }}
          aria-label="Quick Clinical Communication Desk"
          className={`w-9 h-9 lg:w-10 lg:h-10 border rounded-lg flex items-center justify-center relative transition-all duration-200 ${
            showQuickComms
              ? "bg-teal-50 border-teal-300 text-[#0F766E]"
              : "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-white hover:text-[#0F766E] hover:border-teal-300"
          }`}
          title="Quick Clinical Communication & Panic Desk (Ctrl+M)"
        >
          <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[9px] font-extrabold text-white bg-[#0F766E] shadow-2xs">
            2
          </span>
        </button>

        {/* Sound / Panic Alarm Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          onDoubleClick={testAudio}
          className={`w-9 h-9 lg:w-10 lg:h-10 border rounded-lg flex items-center justify-center relative transition-all duration-200 ${
            isMuted
              ? "border-slate-200 bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700"
              : "border-slate-200 bg-[#F8FAFC] text-indigo-600 hover:bg-white hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-indigo-400"
          }`}
          title={isMuted ? "Audio Panic Alerts Muted (Click to Unmute)" : "Audio Panic Alerts Active (Double-click to test alarm)"}
          aria-label={isMuted ? "Unmute audio alerts" : "Mute audio alerts"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" /> : <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />}
        </button>

        {/* Visual Theme Selector (Dark/Light/System) */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className={`w-9 h-9 lg:w-10 lg:h-10 border rounded-lg flex items-center justify-center relative transition-all duration-200 ${
              showNotifications
                ? "bg-teal-50 border-teal-300 text-[#0F766E]"
                : "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-white hover:text-[#0F172A]"
            }`}
          >
            <Bell className={`w-4 h-4 lg:w-5 lg:h-5 ${hasCriticalAlert && unreadCount > 0 ? "text-[#DC2626] animate-bounce" : ""}`} />

            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[9px] font-extrabold text-white ${
                hasCriticalAlert ? "bg-[#DC2626] animate-pulse" : "bg-[#0284C7]"
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onUnreadCountChange={(cnt, crit) => {
              setUnreadCount(cnt);
              setHasCriticalAlert(crit);
            }}
          />
        </div>

        {/* Professional Executive User Profile Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              showProfile
                ? "bg-teal-50 border-[#0F766E] shadow-2xs"
                : "border-slate-200 bg-[#F8FAFC] hover:bg-white hover:border-[#0F766E]/50"
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-xs font-bold text-white shadow-2xs overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  isMounted ? userInitials : 'JA'
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-[#059669]">
              </span>
            </div>

            {/* Name and Designation */}
            <div className="hidden sm:flex flex-col items-start leading-tight text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#0F172A]">
                  {isMounted ? userName : 'Jaya Ashapurama'}
                </span>
                <span title="NABL Verified Authorized Signatory" className="inline-flex shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded bg-white px-1.5 py-0.2 text-[9px] font-bold text-slate-600 border border-slate-200">
                  {isMounted ? userRole : 'ADMIN'}
                </span>
                <span className="rounded bg-teal-50 px-1.5 py-0.2 text-[9px] font-bold text-[#0F766E] border border-teal-200 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#0F766E]" />
                  Verified
                </span>
              </div>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfile ? "rotate-180 text-[#0F766E]" : ""}`} />
          </button>

          {/* Professional Executive Popover Control Center */}
          {showProfile && (
            <div className="absolute right-0 top-12 w-84 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[1000] animate-in zoom-in-95 duration-150">
              {/* Executive Header Banner */}
              <div className="bg-[#F8FAFC] p-4 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-lg bg-[#0F766E] flex items-center justify-center text-sm font-bold text-white shadow-2xs overflow-hidden">
                      {userAvatar ? (
                        <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        isMounted ? userInitials : 'JA'
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#059669]"></span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-[#0F172A] truncate">
                        {isMounted ? userName : 'Jaya Ashapurama'}
                      </h4>
                      <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                    </div>
                    <p className="text-[11px] text-[#475569] truncate mt-0.5">
                      Chief Administrator &amp; Pathologist
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-700 border border-slate-200">
                        {isMounted ? userRole : 'ADMIN'}
                      </span>
                      <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-[#0F766E] border border-teal-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
                        NABL Authorized
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Clinical Credentials & License Card */}
              <div className="p-3 bg-white text-xs space-y-1.5 border-b border-slate-100">
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="font-medium text-[11px]">Accreditation ID:</span>
                  <span className="font-mono font-bold text-[#0F172A] text-[11px]">MED-DIR-2026-9182</span>
                </div>
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="font-medium text-[11px]">Digital Signature:</span>
                  <span className="font-bold text-[#059669] text-[11px] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                    Cryptographically Bound
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="font-medium text-[11px]">Lab Facility:</span>
                  <span className="font-bold text-[#0F172A] text-[11px]">Central Diagnostics Hub</span>
                </div>
              </div>

              {/* Quick Actions Menu */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#0F172A] hover:bg-teal-50 hover:text-[#0F766E] transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0F766E]" />
                  <span>Executive Profile &amp; Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    router.push("/approvals");
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#0F172A] hover:bg-teal-50 hover:text-[#0F766E] transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-[#059669]" />
                  <span>Medical Sign-off &amp; Verifications</span>
                </button>

                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#0F172A] hover:bg-slate-100 transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>LIS Configurations &amp; Security</span>
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-1.5 bg-[#F8FAFC] border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#DC2626]" />
                  <span>Secure Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Global Clinical Spotlight Command Palette */}
    <GlobalSearchModal
      isOpen={showSearchModal}
      onClose={() => setShowSearchModal(false)}
    />

    <LogoutModal
      isOpen={isLogoutModalOpen}
      onClose={() => setIsLogoutModalOpen(false)}
      onConfirmLogout={executeLogout}
    />

    {/* Universal Quick Clinical Communication Slide-over Desk */}
    <QuickCommunicationSlideover
      isOpen={showQuickComms}
      onClose={() => setShowQuickComms(false)}
    />
    </>
  );
}
