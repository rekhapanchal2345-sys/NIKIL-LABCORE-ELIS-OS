"use client";

import React from "react";

/** Structured Clinical Section Header & Bordered Box */
export function SheetSection({
  index,
  title,
  subtitle,
  children,
}: {
  index?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="sheet-section"
      style={{
        marginTop: "2.4mm",
        breakInside: "avoid",
        border: "0.3mm solid #cbd5e1",
        borderRadius: "1mm",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1mm 2.2mm",
          background: "#f1f5f9",
          borderBottom: "0.3mm solid #cbd5e1",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "7.8pt",
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#0f172a",
            display: "flex",
            alignItems: "center",
            gap: "1.8mm",
          }}
        >
          {index && (
            <span
              style={{
                display: "inline-block",
                padding: "0.2mm 1.4mm",
                background: "#0369a1",
                color: "#ffffff",
                borderRadius: "0.6mm",
                fontSize: "6.8pt",
                fontWeight: 800,
              }}
            >
              {index}
            </span>
          )}
          <span>{title}</span>
        </h3>
        {subtitle && (
          <span style={{ fontSize: "6.4pt", fontWeight: 700, color: "#475569" }}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{ padding: "1.6mm 2.2mm" }}>{children}</div>
    </section>
  );
}

/** Structured Clinical Multi-Column Grid */
export function FieldGrid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        columnGap: "3.5mm",
        rowGap: "1.6mm",
      }}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  value,
  mono = false,
  span = 1,
  highlight = false,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  span?: number;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      style={{
        gridColumn: `span ${span}`,
        minWidth: 0,
        padding: "0.6mm 1.4mm",
        background: highlight ? "#f0f9ff" : "#ffffff",
        borderBottom: "0.25mm solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1mm",
        }}
      >
        <span
          style={{
            fontSize: "6.2pt",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </span>
        {badge && (
          <span
            style={{
              fontSize: "5.8pt",
              fontWeight: 800,
              color: "#0369a1",
              background: "#e0f2fe",
              padding: "0.1mm 1mm",
              borderRadius: "0.4mm",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "8.6pt",
          fontWeight: highlight ? 700 : 600,
          color: "#0f172a",
          paddingTop: "0.2mm",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Consolas, monospace" : "inherit",
          overflowWrap: "anywhere",
          minHeight: "3.6mm",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/** Clinical Vital Signs Metric Cell */
export function VitalSignCell({
  name,
  value,
  unit,
  status = "NORMAL",
}: {
  name: string;
  value: string;
  unit: string;
  status?: "NORMAL" | "ALERT" | "ATTENTION";
}) {
  const isAlert = status === "ALERT";
  return (
    <div
      style={{
        padding: "1mm 1.6mm",
        background: isAlert ? "#fff1f2" : "#f8fafc",
        border: isAlert ? "0.3mm solid #f43f5e" : "0.25mm solid #cbd5e1",
        borderRadius: "0.8mm",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "5.8pt", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
        {name}
      </div>
      <div style={{ fontSize: "8.8pt", fontWeight: 800, color: isAlert ? "#e11d48" : "#0f172a", fontFamily: "ui-monospace, Consolas, monospace" }}>
        {value} <span style={{ fontSize: "6pt", fontWeight: 600, color: "#64748b" }}>{unit}</span>
      </div>
    </div>
  );
}

/** Printable tick box: filled when consent is already on record, empty when it must be ticked by hand. */
export function TickLine({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2mm",
        alignItems: "flex-start",
        fontSize: "7.6pt",
        color: "#0f172a",
        lineHeight: 1.35,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "0 0 3.2mm",
          height: "3.2mm",
          marginTop: "0.35mm",
          border: "0.35mm solid #0369a1",
          borderRadius: "0.5mm",
          background: checked ? "#0284c7" : "#ffffff",
          boxShadow: checked ? "inset 0 0 0 0.55mm #ffffff" : "none",
        }}
      />
      <span>{children}</span>
    </div>
  );
}
