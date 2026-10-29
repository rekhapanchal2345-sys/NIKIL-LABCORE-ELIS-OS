"use client";

import { useRef, useEffect } from "react";
import QRCode from "qrcode";
import "./PatientPrintTemplate.css";
import {
  formatPatientFullName,
  calculateClinicalAge,
  formatIndianPhone,
  formatBloodGroup,
} from "@/lib/patient-utils";

type Patient = {
  id?: string;
  uhid?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  age?: number | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  bloodGroup?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  referringDoctorId?: string | null;
  nationalId?: string | null;
  insuranceProvider?: string | null;
  policyNumber?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

interface PatientPrintTemplateProps {
  patient: Patient;
}

export default function PatientPrintTemplate({ patient }: PatientPrintTemplateProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (patient?.uhid && qrCanvasRef.current) {
        try {
          await QRCode.toCanvas(qrCanvasRef.current, patient.uhid, {
            width: 120,
            margin: 1,
            color: {
              dark: "#1e3a8a",
              light: "#ffffff",
            },
          });
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };

    generateQRCode();
  }, [patient?.uhid]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    return calculateClinicalAge(dateOfBirth, patient?.age).formatted;
  };

  const formatGender = (gender?: string) => {
    if (!gender) return "N/A";
    if (gender === "MALE") return "Male";
    if (gender === "FEMALE") return "Female";
    if (gender === "OTHER") return "Other";
    return gender;
  };

  const getFullName = () => {
    return formatPatientFullName(patient);
  };

  const getFullAddress = () => {
    const parts = [patient?.address, patient?.city, patient?.state, patient?.postalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  return (
    <div className="print-template">
      {/* Header Section */}
      <div className="print-header">
        <div className="header-left">
          <div className="branding">
            <h1 className="lab-name">LabCore Enterprise LIS</h1>
            <p className="lab-subtitle">Patient Registration Form</p>
            <p className="document-type">Official Medical Record</p>
          </div>
          <div className="contact-info">
            <p>📍 123 Medical Center Drive, Healthcare City, HC 12345</p>
            <p>📞 +91 9723561529 | ✉️ nikilpanchal5@gmail.com</p>
            <p>🌐 www.labcore-lims.com | ⏰ 24/7 Emergency Services</p>
          </div>
        </div>
        <div className="header-right">
          <div className="qr-section">
            <canvas ref={qrCanvasRef} className="qr-code" />
            <div className="qr-info">
              <p className="qr-label">UHID</p>
              <p className="qr-value">{patient?.uhid || "N/A"}</p>
              <p className="qr-sublabel">Scan for patient details</p>
            </div>
          </div>
          <div className="document-meta">
            <div className="meta-item">
              <span className="meta-label">Print Date:</span>
              <span className="meta-value">{formatDateTime(new Date().toISOString())}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Record ID:</span>
              <span className="meta-value">{patient?.id || "N/A"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span className={`meta-value status-${patient?.isActive ? 'active' : 'inactive'}`}>
                {patient?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Divider */}
      <div className="professional-divider"></div>

      {/* Patient Demographic Section */}
      <div className="patient-section">
        <div className="section-header">
          <h2 className="section-title">Patient Demographics</h2>
          <div className="patient-id-badge">
            <span className="badge-label">UHID</span>
            <span className="badge-value">{patient?.uhid || "N/A"}</span>
          </div>
        </div>

        {/* Personal Information */}
        <div className="demographic-section full-width">
          <h3 className="subsection-title">Personal Information</h3>
          <table className="demographic-table">
            <tbody>
              <tr>
                <td className="table-label">Full Name</td>
                <td className="table-value">{getFullName()}</td>
                <td className="table-label">Patient ID</td>
                <td className="table-value">{patient?.id || "N/A"}</td>
              </tr>
              <tr>
                <td className="table-label">Date of Birth</td>
                <td className="table-value">{formatDate(patient?.dateOfBirth)}</td>
                <td className="table-label">Age</td>
                <td className="table-value">
                  {patient?.age ? `${patient.age} years` : calculateAge(patient?.dateOfBirth)}
                </td>
              </tr>
              <tr>
                <td className="table-label">Gender</td>
                <td className="table-value">{formatGender(patient?.gender)}</td>
                <td className="table-label">Blood Group</td>
                <td className="table-value">{formatBloodGroup(patient?.bloodGroup)}</td>
              </tr>
              <tr>
                <td className="table-label">National ID</td>
                <td className="table-value">{patient?.nationalId || "N/A"}</td>
                <td className="table-label">Marital Status</td>
                <td className="table-value">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contact Information */}
        <div className="demographic-section full-width">
          <h3 className="subsection-title">Contact Information</h3>
          <table className="demographic-table">
            <tbody>
              <tr>
                <td className="table-label">Primary Phone</td>
                <td className="table-value">{patient?.phone || "N/A"}</td>
                <td className="table-label">Secondary Phone</td>
                <td className="table-value">N/A</td>
              </tr>
              <tr>
                <td className="table-label">Email Address</td>
                <td className="table-value">{patient?.email || "N/A"}</td>
                <td className="table-label">Preferred Contact</td>
                <td className="table-value">Phone</td>
              </tr>
              <tr>
                <td className="table-label">Full Address</td>
                <td className="table-value" colSpan={3}>{getFullAddress()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Medical & Emergency Information */}
        <div className="demographic-grid">
          <div className="demographic-section">
            <h3 className="subsection-title">Medical Information</h3>
            <table className="demographic-table">
              <tbody>
                <tr>
                  <td className="table-label">Referring Doctor</td>
                  <td className="table-value">{patient?.referringDoctorId || "N/A"}</td>
                </tr>
                <tr>
                  <td className="table-label">Known Allergies</td>
                  <td className="table-value">N/A</td>
                </tr>
                <tr>
                  <td className="table-label">Chronic Conditions</td>
                  <td className="table-value">N/A</td>
                </tr>
                <tr>
                  <td className="table-label">Current Medications</td>
                  <td className="table-value">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="demographic-section">
            <h3 className="subsection-title">Emergency Contact</h3>
            <table className="demographic-table">
              <tbody>
                <tr>
                  <td className="table-label">Contact Name</td>
                  <td className="table-value">{patient?.emergencyContactName || "N/A"}</td>
                </tr>
                <tr>
                  <td className="table-label">Contact Phone</td>
                  <td className="table-value">{patient?.emergencyContactPhone || "N/A"}</td>
                </tr>
                <tr>
                  <td className="table-label">Relationship</td>
                  <td className="table-value">N/A</td>
                </tr>
                <tr>
                  <td className="table-label">Authorization</td>
                  <td className="table-value">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="demographic-section full-width">
          <h3 className="subsection-title">Insurance & Billing Information</h3>
          <table className="demographic-table">
            <tbody>
              <tr>
                <td className="table-label">Insurance Provider</td>
                <td className="table-value">{patient?.insuranceProvider || "N/A"}</td>
                <td className="table-label">Policy Number</td>
                <td className="table-value">{patient?.policyNumber || "N/A"}</td>
              </tr>
              <tr>
                <td className="table-label">Policy Holder Name</td>
                <td className="table-value">N/A</td>
                <td className="table-label">Group Number</td>
                <td className="table-value">N/A</td>
              </tr>
              <tr>
                <td className="table-label">Coverage Type</td>
                <td className="table-value">N/A</td>
                <td className="table-label">Valid Until</td>
                <td className="table-value">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Registration Information */}
        <div className="demographic-section full-width">
          <h3 className="subsection-title">Registration Details</h3>
          <table className="demographic-table">
            <tbody>
              <tr>
                <td className="table-label">Registration Date</td>
                <td className="table-value">{formatDateTime(patient?.createdAt)}</td>
                <td className="table-label">Last Updated</td>
                <td className="table-value">{formatDateTime(patient?.updatedAt)}</td>
              </tr>
              <tr>
                <td className="table-label">Registered By</td>
                <td className="table-value">System Admin</td>
                <td className="table-label">Registration Type</td>
                <td className="table-value">New Patient</td>
              </tr>
              <tr>
                <td className="table-label">Branch</td>
                <td className="table-value">Main Branch</td>
                <td className="table-label">Department</td>
                <td className="table-value">Registration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Section */}
      <div className="print-footer">
        <div className="footer-left">
          <div className="verification-stamp">
            <div className="stamp-circle">
              <span className="stamp-text">VERIFIED</span>
            </div>
            <p className="stamp-date">{formatDate(new Date().toISOString())}</p>
          </div>
          <div className="signature-section">
            <p className="signature-label">Authorized Signature</p>
            <div className="signature-line"></div>
            <p className="signature-name">Medical Records Officer</p>
          </div>
        </div>
        <div className="footer-right">
          <div className="footer-notice">
            <p className="confidentiality">
              ⚠️ CONFIDENTIAL: This document contains sensitive patient information protected by HIPAA regulations.
              Unauthorized access, use, disclosure, or distribution is strictly prohibited and may violate federal law.
            </p>
            <p className="disclaimer">
              This document is for official medical purposes only. Any alterations or modifications without proper authorization
              are illegal and may result in legal action.
            </p>
          </div>
          <div className="footer-info">
            <p>Generated on {formatDateTime(new Date().toISOString())}</p>
            <p>Reference: {patient?.id || "N/A"} | UHID: {patient?.uhid || "N/A"}</p>
            <p>LabCore Enterprise LIS v2.0 | © 2024 All Rights Reserved</p>
          </div>
        </div>
      </div>

      {/* Barcode Section */}
      <div className="barcode-section">
        <div className="barcode-info">
          <p className="barcode-label">PATIENT IDENTIFICATION BARCODE</p>
          <p className="barcode-value">{patient?.uhid || "N/A"}</p>
        </div>
        <div className="barcode-visual">
          <div className="barcode-lines">
            {Array.from({ length: 30 }).map((_, i) => (
              <div 
                key={i} 
                className="barcode-line" 
                style={{ 
                  width: Math.random() > 0.5 ? '2px' : '1px',
                  height: '40px',
                  margin: '0 1px'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
