"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

export interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string | number; // e.g. "800px" or 900
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  density?: "compact" | "normal";
  onDensityChange?: (density: "compact" | "normal") => void;
  showScrollHint?: boolean;
}

export default function ResponsiveTable({
  children,
  className = "",
  minWidth = "750px",
  title,
  subtitle,
  actions,
  density: propDensity,
  onDensityChange,
  showScrollHint = true,
}: ResponsiveTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [localDensity, setLocalDensity] = useState<"compact" | "normal">("normal");

  const density = propDensity || localDensity;

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollByAmount = (amount: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const toggleDensity = () => {
    const next = density === "compact" ? "normal" : "compact";
    if (onDensityChange) {
      onDensityChange(next);
    } else {
      setLocalDensity(next);
    }
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header bar if title or actions provided */}
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 bg-slate-950/40">
          <div>
            {title && <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* Table Scroll Buttons for Desktop Trackpads / Keyboards */}
            {(canScrollLeft || canScrollRight) && (
              <div className="hidden sm:flex items-center gap-1 border border-slate-700/70 rounded-lg p-0.5 bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => scrollByAmount(-200)}
                  disabled={!canScrollLeft}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  title="Scroll left"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByAmount(200)}
                  disabled={!canScrollRight}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  title="Scroll right"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Density Toggle */}
            <button
              type="button"
              onClick={toggleDensity}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                density === "compact"
                  ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white"
              }`}
              title={`Switch row density (current: ${density})`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span className="capitalize">{density}</span>
            </button>

            {actions}
          </div>
        </div>
      )}

      {/* Table Container with Horizontal Scroll & Shadow Indicators */}
      <div className="relative w-full overflow-hidden">
        {/* Left Scroll Gradient Shadow */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950/90 to-transparent z-20 transition-opacity" />
        )}

        {/* Right Scroll Gradient Shadow */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950/90 to-transparent z-20 transition-opacity" />
        )}

        <div
          ref={containerRef}
          className={`w-full overflow-x-auto ${
            density === "compact" ? "[&_td]:py-2 [&_th]:py-2 text-xs" : "[&_td]:py-3.5 [&_th]:py-3 text-sm"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div style={{ minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Swipe Guidance Footer */}
      {showScrollHint && canScrollRight && (
        <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 bg-slate-950/60 text-[10px] font-medium text-slate-400 border-t border-slate-800/60">
          <span>Swipe horizontally to view full clinical details</span>
          <ChevronRight className="h-3 w-3 animate-pulse text-indigo-400" />
        </div>
      )}
    </div>
  );
}
