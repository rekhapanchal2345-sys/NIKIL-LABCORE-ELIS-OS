"use client";

import React from "react";
import { SheetSection, TickLine } from "./PatientSheetParts";
import type { SheetData } from "./patient-sheet-data";

const sigBox: React.CSSProperties = {
  border: "0.25mm solid #cbd5e1",
  borderRadius: "1mm",
  padding: "5.5mm 2.2mm 1.5mm",
  background: "#f8fafc",
  textAlign: "center",
};

const sigLine: React.CSSProperties = {
  borderTop: "0.35mm solid #475569",
  paddingTop: "1mm",
  fontSize: "6.8pt",
  fontWeight: 700,
  color: "#1e293b",
};

export default function PatientSheetConsent({ data }: { data: SheetData }) {
  return (
    <>
      <SheetSection
        index="06"
        title="Statutory Clinical Consent, NABH Patient Charter & DPDP Act 2023 Declaration"
        subtitle="Medical Ethics, NABL ISO 15189:2022 & National Health Authority (ABDM)"
      >
        <p style={{ margin: "0 0 1.4mm", fontSize: "7.2pt", color: "#334155", lineHeight: 1.35 }}>
          I hereby solemnly confirm that the demographic, identification, clinical history and insurance details furnished
          above are true and authentic. I authorize the hospital / clinical laboratory healthcare personnel to carry out
          requisite phlebotomy, diagnostic investigations, specimen collection and inpatient/outpatient clinical care.
        </p>
        <div style={{ display: "grid", rowGap: "1.1mm" }}>
          <TickLine checked={data.consents.treatment}>
            <strong>Clinical Investigation &amp; Specimen Collection:</strong> I consent to clinical examination, specimen collection (blood, urine, swabs) and diagnostic testing as ordered by the treating doctor.
          </TickLine>
          <TickLine checked={data.consents.digitalComm}>
            <strong>Digital Dispatch &amp; Critical Value Alerting:</strong> I consent to secure transmission of diagnostic reports, critical panic alerts, invoices and appointments via WhatsApp, SMS and Email.
          </TickLine>
          <TickLine checked={data.consents.abhaExchange}>
            <strong>ABDM / ABHA Longitudinal Record Exchange:</strong> I consent to linking and federating my diagnostic records with my 14-digit ABHA ID under the Ayushman Bharat Digital Mission (ABDM) framework.
          </TickLine>
        </div>
      </SheetSection>

      {/* Formal 3-Column Hospital Stamping & Verification Block */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.1fr 0.9fr",
          columnGap: "4.5mm",
          marginTop: "3.5mm",
        }}
      >
        <div style={sigBox}>
          <div style={sigLine}>Patient / Authorized Legal Guardian Signature</div>
          <div style={{ fontSize: "5.8pt", color: "#64748b", marginTop: "0.5mm" }}>Name, Relation &amp; Date</div>
        </div>
        <div style={sigBox}>
          <div style={sigLine}>Registered Medical Practitioner / Clinician Stamp</div>
          <div style={{ fontSize: "5.8pt", color: "#64748b", marginTop: "0.5mm" }}>Reg. Medical Council No. &amp; Signature</div>
        </div>
        <div style={sigBox}>
          <div style={sigLine}>Phlebotomist / Registration Desk Officer</div>
          <div style={{ fontSize: "5.8pt", color: "#64748b", marginTop: "0.5mm" }}>Desk ID, Specimen Timestamp &amp; Initial</div>
        </div>
      </div>
    </>
  );
}

export function PatientSheetFooter({ facilityName, printedOn }: { facilityName: string; printedOn: string }) {
  const displayFacility = facilityName || "LabCore Multi-Specialty Hospital & Research Institute";
  return (
    <footer
      style={{
        position: "absolute",
        left: "12mm",
        right: "12mm",
        bottom: "5.5mm",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "4mm",
        borderTop: "0.3mm solid #94a3b8",
        paddingTop: "1.2mm",
        fontSize: "6.5pt",
        color: "#475569",
      }}
    >
      <span>
        <strong>{displayFacility}</strong> &bull; Confidential Clinical Medical Record &bull; Subject to Indian DPDP Act 2023 &amp; NABH Charter &bull; Generated: {printedOn}
      </span>
      <span style={{ fontWeight: 800, color: "#0f172a" }}>
        Form A4-CLIN-01 &bull; Single-Sheet A4 Portrait &bull; Page 1 of 1
      </span>
    </footer>
  );
}
