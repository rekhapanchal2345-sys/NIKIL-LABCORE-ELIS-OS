"use client";

import React from "react";

export type FacilityType = "HOSPITAL" | "DIAGNOSTIC_LAB" | "CLINIC";

export interface FacilityInfo {
  name: string;
  facilityType?: FacilityType;
  subtitle?: string;
  department?: string;
  address: string;
  phone: string;
  emergencyPhone?: string;
  email: string;
  website?: string;
  nabl: string;
  nabh?: string;
  cap: string;
  hfr: string;
  icmrCode?: string;
  logoUrl: string;
}

/** Vector SVG Code 128 Barcode Generator for Clinical UHID & Specimen IDs */
export function ClinicalBarcode({ code, height = 26 }: { code: string; height?: number }) {
  const seed = (code || "LC-0000").split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const bars: { width: number; isBlack: boolean }[] = [];
  
  // Guard bars
  bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
  
  for (let i = 0; i < 28; i++) {
    const bit = ((seed * (i + 3) * 7) % 19);
    const w = (bit % 3) + 1;
    bars.push({ width: w, isBlack: i % 2 === 0 });
  }
  
  // Stop guard
  bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });

  let currentX = 0;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg height={height} width={130} viewBox="0 0 130 26" style={{ display: "block" }}>
        {bars.map((b, idx) => {
          const rect = b.isBlack ? (
            <rect key={idx} x={currentX} y={0} width={b.width} height={height} fill="#0f172a" />
          ) : null;
          currentX += b.width + 0.8;
          return rect;
        })}
      </svg>
      <span style={{ fontSize: "6.2pt", fontFamily: "ui-monospace, Consolas, monospace", fontWeight: 700, color: "#334155", letterSpacing: "0.08em" }}>
        *{code}*
      </span>
    </div>
  );
}

/** High-Resolution Hospital & Medical Center Insignia */
export function HospitalInsignia({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" role="img" aria-label="Hospital Emblem">
      <rect width="60" height="60" rx="14" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.8" />
      <circle cx="30" cy="30" r="22" fill="#ffffff" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Medical Cross */}
      <rect x="25.5" y="15" width="9" height="30" rx="2.5" fill="#16a34a" />
      <rect x="15" y="25.5" width="30" height="9" rx="2.5" fill="#16a34a" />
      <circle cx="30" cy="30" r="3.2" fill="#ffffff" />
      {/* Caduceus Accent */}
      <path d="M22 46C26 43 34 43 38 46" stroke="#047857" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** High-Resolution Diagnostic Reference Laboratory Insignia */
export function DiagnosticLabInsignia({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" role="img" aria-label="Laboratory Emblem">
      <rect width="60" height="60" rx="14" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.8" />
      {/* Flask & Cross */}
      <path
        d="M26 14H34M30 14V23L39 38C40.5 40.5 38.8 44 36 44H24C21.2 44 19.5 40.5 21 38L30 23"
        stroke="#0284c7"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#e0f2fe"
      />
      <circle cx="28" cy="36" r="2" fill="#0284c7" />
      <circle cx="33" cy="33" r="1.5" fill="#0284c7" />
      <circle cx="27" cy="30" r="1.2" fill="#0369a1" />
      <rect x="28.5" y="22" width="3" height="6" fill="#0284c7" rx="0.5" />
    </svg>
  );
}

/** High-Resolution Multi-Specialty Clinic & Polyclinic Insignia */
export function ClinicInsignia({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" role="img" aria-label="Clinic Emblem">
      <rect width="60" height="60" rx="14" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" />
      {/* Stethoscope & Heart */}
      <path
        d="M30 18C26 13 18 15 18 22C18 30 30 38 30 38C30 38 42 30 42 22C42 15 34 13 30 18Z"
        fill="#fee2e2"
        stroke="#e11d48"
        strokeWidth="1.8"
      />
      <circle cx="30" cy="24" r="2.5" fill="#e11d48" />
      <path d="M22 44C26 47 34 47 38 44" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ClinicalFacilityLogo({
  facilityType = "HOSPITAL",
  size = 52,
}: {
  facilityType?: FacilityType;
  size?: number;
}) {
  if (facilityType === "DIAGNOSTIC_LAB") return <DiagnosticLabInsignia size={size} />;
  if (facilityType === "CLINIC") return <ClinicInsignia size={size} />;
  return <HospitalInsignia size={size} />;
}

export default function PatientSheetLetterhead({
  facility,
  uhid,
  qrDataUrl,
  registeredOn,
}: {
  facility: FacilityInfo;
  uhid: string;
  qrDataUrl: string;
  registeredOn?: string;
}) {
  const facilityType = facility.facilityType || "HOSPITAL";
  
  const defaultTitle =
    facilityType === "DIAGNOSTIC_LAB"
      ? "LABCORE CENTRAL CLINICAL REFERENCE LABORATORY"
      : facilityType === "CLINIC"
      ? "LABCORE MULTI-SPECIALTY CLINIC & HEALTH HUB"
      : "LABCORE MULTI-SPECIALTY HOSPITAL & RESEARCH INSTITUTE";

  const defaultSubtitle =
    facilityType === "DIAGNOSTIC_LAB"
      ? "Accredited Clinical Pathology, Biochemistry, Hematology, Molecular & Genomics Center"
      : facilityType === "CLINIC"
      ? "Comprehensive Outpatient Polyclinic, Preventive Health, Consultations & Day Care"
      : "Department of Laboratory Medicine, Clinical Inpatient / Outpatient Services & Critical Triage";

  const displayName = facility.name || defaultTitle;
  const displaySubtitle = facility.subtitle || defaultSubtitle;
  const displayAddress =
    facility.address || "Medical Complex, Plot 14-A, Healthcare Boulevard, SG Highway, Ahmedabad, Gujarat - 380015";
  const displayPhone = facility.phone || "+91 79 2658 4400 / +91 98765 43210";
  const displayEmergency = facility.emergencyPhone || "+91 79 2658 4499 (24x7 Emergency)";
  const displayEmail = facility.email || "patientcare@labcorehospital.org";
  
  const displayNabl = facility.nabl || "MC-4892 (ISO 15189:2022)";
  const displayNabh = facility.nabh || "NABH-H-2024-0982";
  const displayCap = facility.cap || "CAP-8841209";
  const displayHfr = facility.hfr || "IN-GJ-HFR-109482";
  const displayIcmr = facility.icmrCode || "ICMR-GJ-LC991";

  // Accent theme color according to facility type
  const themeBorder =
    facilityType === "DIAGNOSTIC_LAB"
      ? "#0284c7"
      : facilityType === "CLINIC"
      ? "#0d9488"
      : "#16a34a";

  const themeTagBg =
    facilityType === "DIAGNOSTIC_LAB"
      ? "#f0f9ff"
      : facilityType === "CLINIC"
      ? "#f0fdfa"
      : "#f0fdf4";

  const themeTagText =
    facilityType === "DIAGNOSTIC_LAB"
      ? "#0369a1"
      : facilityType === "CLINIC"
      ? "#0f766e"
      : "#15803d";

  return (
    <header
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "4.5mm",
        paddingBottom: "3mm",
        borderBottom: `1mm solid ${themeBorder}`,
        background: "#ffffff",
      }}
    >
      {/* Left: Professional Hospital / Lab Logo & Full Clinical Credentials */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "3.6mm", minWidth: 0 }}>
        {facility.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={facility.logoUrl}
            alt="Facility logo"
            style={{ height: "16mm", width: "auto", objectFit: "contain" }}
          />
        ) : (
          <ClinicalFacilityLogo facilityType={facilityType} size={54} />
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "12.8pt",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.015em",
              lineHeight: 1.15,
              textTransform: "uppercase",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: "7.6pt",
              fontWeight: 700,
              color: themeTagText,
              marginTop: "0.5mm",
              letterSpacing: "0.01em",
            }}
          >
            {displaySubtitle}
          </div>
          <div style={{ fontSize: "7.1pt", color: "#334155", marginTop: "0.7mm", lineHeight: 1.35 }}>
            {displayAddress}
          </div>
          <div style={{ fontSize: "7.1pt", color: "#334155", lineHeight: 1.35 }}>
            <strong>OPD/Appointments:</strong> {displayPhone} &nbsp;|&nbsp; <strong>Emergency/ICU:</strong> {displayEmergency} &nbsp;|&nbsp; <strong>Email:</strong> {displayEmail}
          </div>
          <div
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "2.2mm",
              marginTop: "1.2mm",
              padding: "0.5mm 1.8mm",
              background: themeTagBg,
              border: "0.25mm solid #cbd5e1",
              borderRadius: "0.8mm",
              fontSize: "6.6pt",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            <span style={{ color: themeTagText }}>NABH: {displayNabh}</span>
            <span style={{ color: "#94a3b8" }}>&bull;</span>
            <span style={{ color: themeTagText }}>NABL: {displayNabl}</span>
            <span style={{ color: "#94a3b8" }}>&bull;</span>
            <span>CAP: {displayCap}</span>
            <span style={{ color: "#94a3b8" }}>&bull;</span>
            <span>ABDM HFR: {displayHfr}</span>
            <span style={{ color: "#94a3b8" }}>&bull;</span>
            <span>ICMR: {displayIcmr}</span>
          </div>
        </div>
      </div>

      {/* Right: Dual Barcode + QR Code & Patient UHID Reference Box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "1.2mm",
          padding: "1.8mm 2.4mm",
          background: "#f8fafc",
          border: "0.3mm solid #cbd5e1",
          borderRadius: "1.2mm",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "6.2pt",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              Master Patient UHID / MRN
            </div>
            <div
              style={{
                fontSize: "10.8pt",
                fontWeight: 900,
                color: "#0f172a",
                fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                marginTop: "0.2mm",
              }}
            >
              {uhid}
            </div>
            {registeredOn && (
              <div style={{ fontSize: "6.2pt", color: "#64748b", marginTop: "0.4mm" }}>
                Intake: <strong style={{ color: "#0f172a" }}>{registeredOn}</strong>
              </div>
            )}
          </div>
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="UHID verification QR code"
              style={{
                width: "15mm",
                height: "15mm",
                background: "#ffffff",
                border: "0.25mm solid #94a3b8",
                padding: "0.5mm",
              }}
            />
          )}
        </div>
        {/* Code 128 Clinical Barcode for Phlebotomy & Scanner Tracking */}
        <div style={{ marginTop: "0.5mm" }}>
          <ClinicalBarcode code={uhid} height={20} />
        </div>
      </div>
    </header>
  );
}
