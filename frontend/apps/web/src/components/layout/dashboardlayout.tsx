
"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Header from "./header";
import NotificationToast from "@/components/common/NotificationToast";
import OmniCommandPalette from "@/components/navigation/OmniCommandPalette";
  
interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Start collapsed on narrow viewports: the sidebar renders as a fixed 260px
  // overlay there, so opening it by default covers the page content on load.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === "undefined") return;
    // Desktop keeps the rail permanently visible.
    if (window.innerWidth > 900) {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    // Professional light theme
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.documentElement.removeAttribute('data-theme');
      }
    };
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background-primary)] relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div
        className={`flex flex-col h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[260px]' : 'ml-0'} dashboard-main`}
      >
        {/* Persistent Pipeline Telemetry & Universal Clinical Cockpit */}
        <OmniCommandPalette
          activeRoute={pathname || "/dashboard"}
          onNavigate={(path) => router.push(path)}
        />

        {/* Header */}
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-auto page-container">
          {children}
        </main>
      </div>

      {/* Global Notification Toast */}
      <NotificationToast />

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 900px) {
          .dashboard-main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
