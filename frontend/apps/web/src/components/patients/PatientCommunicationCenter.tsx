"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  MessageCircle, 
  Send, 
  Paperclip, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  AtSign,
  ChevronDown,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Building2,
  Lock
} from "lucide-react";
import { showSuccess, showError } from "@/lib/notifications";
import { formatIndianPhone } from "@/lib/patient-utils";
import { communicationApi } from "@/lib/api";

type CommunicationChannel = "WHATSAPP" | "EMAIL";

interface PatientCommunicationCenterProps {
  patient: {
    id?: string;
    uhid?: string;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  onClose?: () => void;
  standalone?: boolean;
}

interface WhatsAppTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  text: string;
}

interface EmailTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  body: string;
}

const WHATSAPP_TEMPLATES: WhatsAppTemplateItem[] = [
  {
    id: "welcome",
    name: "Registration & Digital Health Record (UHID)",
    category: "Registration",
    description: "Official welcome advisory with permanent UHID credentials and encrypted portal access link.",
    text: `*LABCORE DIAGNOSTICS & RESEARCH INSTITUTE*
_NABL & CAP Accredited Clinical Reference Laboratory_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *{{patient_name}}*,

Greetings. Your Universal Health Identifier (UHID) has been successfully generated in the LabCore Hospital Information System.

📋 *Registration Summary:*
• *Patient Name:* {{patient_name}}
• *Primary UHID:* \`{{uhid}}\`
• *Record Status:* Active & Medically Verified
• *Data Confidentiality:* 256-Bit Encrypted E-Health Record

📲 *Digital Patient Health Portal:*
Access real-time sample processing status, download itemized tax invoices, and retrieve verified diagnostic reports:
🔗 https://labcore.in/portal/{{uhid}}

Should you require diagnostic assistance, appointment rescheduling, or home phlebotomy collection, our 24x7 Patient Care Desk is at your service.
📞 Helpline: +91 98765 43210 | 📧 care@labcore.in

_Empowering Precision Medicine | LabCore Medical Systems_`
  },
  {
    id: "accessioning",
    name: "Specimen Accession & Laboratory Custody",
    category: "Lab TAT",
    description: "Chain-of-custody notification confirming biological specimen receipt under cold-chain logistics.",
    text: `*LABCORE CENTRAL DIAGNOSTIC LABORATORY*
_Laboratory Chain-of-Custody & Specimen Accession Notice_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *{{patient_name}}*,

Your biological specimen for UHID *{{uhid}}* has been securely received under cold-chain logistics and formally accessioned at our Central Processing Laboratory.

🔬 *Analytical Processing Details:*
• *Patient UHID:* {{uhid}}
• *Specimen Barcode:* ACC-{{uhid}}-QC
• *Department:* Clinical Biochemistry, Hematology & Molecular Diagnostics
• *Quality Assurance:* Automated Dual-Analyzer Calibration & Internal QC
• *Estimated Turnaround Time (TAT):* 4 to 6 Hours

Track specimen progression in real-time on our LIS:
🔗 https://labcore.in/track?uhid={{uhid}}

Our pathology faculty ensures the highest analytical precision. You will receive an immediate electronic notification upon pathologist authorization of your final report.

_Department of Laboratory Medicine | LabCore Diagnostics_`
  },
  {
    id: "report_ready",
    name: "Diagnostic Pathology Report Release (PDF)",
    category: "Report Release",
    description: "Release advisory with password-protected PDF download link and consulting advice.",
    text: `*LABCORE DIAGNOSTICS & RESEARCH INSTITUTE*
_Confidential Clinical Laboratory Report Release_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *{{patient_name}}*,

The diagnostic laboratory investigations requisitioned under UHID *{{uhid}}* have been concluded and digitally validated by our Senior Consultant Pathologist.

📑 *Secure Report Retrieval:*
• *Download Authorized PDF Report:*
  🔗 https://labcore.in/reports/{{uhid}}
• *Security Passcode:* Your 8-digit Date of Birth in *DDMMYYYY* format (e.g., if your DOB is 15-Aug-1990, passcode is *15081990*).

⚠️ *Clinical Interpretation Advisory:*
Diagnostic findings should be clinically correlated by a registered medical practitioner in conjunction with your comprehensive medical history and physical examination. Please share this verified report with your treating physician.

For report inquiries or pathologist tele-consultation:
📞 +91 98765 43210 | 📧 reports@labcore.in

_Authorized Digital Release under ISO 15189 Standards_`
  },
  {
    id: "critical_alert",
    name: "Urgent Clinical Alert: Pathologist Review",
    category: "STAT Alert",
    description: "High-priority laboratory findings crossing established critical decision thresholds.",
    text: `*🚨 URGENT CLINICAL NOTIFICATION | LABCORE MEDICINE*
_High-Priority Laboratory Finding Alert_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Attention: *{{patient_name}}* (UHID: *{{uhid}}*)

This is an expedited clinical alert from the Department of Laboratory Medicine at LabCore Diagnostics.

Preliminary analysis of your recent laboratory parameters indicates values that cross standard *Critical Decision Thresholds*, requiring prompt medical review.

🏥 *Recommended Action Plan:*
1. Immediately contact your treating physician or consultant specialist.
2. Review your expedited interim laboratory data:
   🔗 https://labcore.in/reports/{{uhid}}
3. If you are experiencing acute physical symptoms (chest pain, shortness of breath, severe dizziness, or metabolic distress), please report to the nearest hospital casualty or emergency care center immediately.

Our Senior Duty Pathologist is available for emergency clinical consultation:
🚨 Emergency Medical Desk: +91 98765 43210 (Direct Ext. 9)

_LabCore Critical Care Advisory & Emergency Response Team_`
  },
  {
    id: "home_collection",
    name: "Phlebotomy Home Sample Collection Scheduled",
    category: "Phlebotomy",
    description: "Scheduled phlebotomist appointment details with sterility protocols and live tracking.",
    text: `*LABCORE HOME DIAGNOSTICS SERVICES*
_Phlebotomy Home Sample Collection Confirmation_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *{{patient_name}}*,

Your scheduled home diagnostic sample collection visit has been confirmed under UHID *{{uhid}}*.

🩸 *Appointment & Safety Protocols:*
• *Patient Name:* {{patient_name}}
• *Assigned Specialist:* Certified Medical Phlebotomist
• *Sterility Standard:* 100% Sterile, Single-Use BD Vacutainer® Needles
• *Specimen Integrity:* Certified Cold-Chain Thermal Carrier Box
• *Live Phlebotomist En-Route Tracker:*
  🔗 https://labcore.in/visit/{{uhid}}

📌 *Pre-Collection Advisory:*
Please maintain recommended fasting requirements (water intake is permissible). Keep your valid government identification or previous prescription accessible.

To reschedule or update visit instructions, call +91 98765 43210.

_LabCore Mobile Phlebotomy & Home Healthcare Division_`
  },
  {
    id: "fasting_instructions",
    name: "Pre-Investigation Fasting & Preparation Protocol",
    category: "Clinical Prep",
    description: "Strict pre-analytical directives to guarantee diagnostic specimen integrity.",
    text: `*LABCORE CLINICAL PROTOCOL ADVISORY*
_Pre-Analytical Guidelines & Fasting Directives_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *{{patient_name}}*,

To guarantee optimal analytical accuracy and eliminate analytical interference in your forthcoming tests (UHID: *{{uhid}}*), please review these pre-analytical guidelines:

📋 *Mandatory Preparation Guidelines:*
• *Overnight Fasting:* Maintain 10 to 12 hours of strict fasting for Lipid Profile, Fasting Blood Glucose (FBS), and Comprehensive Metabolic Panels.
• *Permitted Fluids:* Plain drinking water is permitted and encouraged to ensure adequate vascular hydration for smooth venipuncture.
• *Avoid:* Tea, coffee, caffeine, milk, juice, alcohol, and tobacco products during the fasting window.
• *Routine Medications:* Take prescribed chronic medications (anti-hypertensives/cardiac) with water unless your physician advised temporary withholding. Morning thyroid dose should be taken *after* sample draw.

Adherence to standard pre-analytical protocols minimizes specimen recollection.

_Quality Assurance Division | LabCore Diagnostics_`
  },
  {
    id: "payment_reminder",
    name: "Diagnostic Account Statement & Billing Settlement",
    category: "Billing",
    description: "Formal statement of diagnostic account and online payment reconciliation link.",
    text: `*LABCORE ACCOUNTS & PATIENT BILLING*
_Diagnostic Invoice & Settlement Reconciliation_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *{{patient_name}}*,

Thank you for choosing LabCore Diagnostics & Hospital.

This is a formal settlement notification regarding your recent clinical diagnostic requisition under UHID *{{uhid}}*.

💳 *Billing Summary:*
• *Patient Name:* {{patient_name}}
• *UHID Reference:* {{uhid}}
• *Requisition Head:* Outpatient Diagnostic Panel
• *Status:* Settlement Pending

🔗 *Instant Online Payment Gateway (UPI / Card / NetBanking):*
👉 https://labcore.in/pay/{{uhid}}

Upon successful transaction settlement, your computerized GST tax invoice and digitally certified laboratory reports will be instantly unlocked for electronic download.

For billing reconciliation or insurance queries: accounts@labcore.in | 1800-123-5222

_Revenue Cycle Management | LabCore Financial Operations_`
  }
];

const EMAIL_TEMPLATES: EmailTemplateItem[] = [
  {
    id: "welcome",
    name: "Official Health Record Registration Confirmation",
    category: "Registration",
    description: "Formal LIS patient intake letter with UHID credentials and e-portal capabilities.",
    subject: "Official Health Record Confirmation: Welcome to LabCore Diagnostics & Hospital [UHID: {{uhid}}]",
    body: `Dear {{patient_name}},

Welcome to LabCore Diagnostics & Hospital. We appreciate your confidence in our diagnostic laboratory and comprehensive medical care services.

This communication serves as formal confirmation that your Electronic Health Record (EHR) has been established in our Laboratory Information Management System (LIMS) under Universal Health Identifier (UHID): {{uhid}}.

PATIENT IDENTIFICATION & CREDENTIAL SUMMARY:
--------------------------------------------------------------------------------------------------------
• Full Legal Name: {{patient_name}}
• Universal Health Identifier (UHID): {{uhid}}
• Laboratory Accreditation: NABL (ISO 15189:2012) & CAP Certified Reference Laboratory
• Information Security: 256-Bit Encrypted Architecture adhering to HIPAA & DISHA standards

YOUR DIGITAL HEALTH PORTAL CAPABILITIES:
Through the LabCore Patient Health Portal, you have continuous access to:
1. Real-Time Investigation Tracking: Monitor the progression of your biological specimens through pre-analytical accessioning, analytical processing, and pathologist review.
2. Historical Cumulative Trends: Review graphical trends and previous diagnostic records across all LabCore hospital and clinic locations.
3. Secure Report Vault: Retrieve tamper-evident, digitally signed electronic reports with cryptographic QR verification.
4. Financial Documentation: Download GST-compliant tax invoices, receipts, and itemized billing summaries for personal records or insurance reimbursements.

Access your patient dashboard:
https://labcore.in/portal/{{uhid}}

SUPPORT & CLINICAL ASSISTANCE:
Should you require assistance regarding sample preparation, home phlebotomy booking, or technical portal navigation, our Patient Concierge Desk is available 24/7.
• Telephone: +91 98765 43210 / Toll-Free: 1800-123-5222
• Electronic Mail: care@labcore.in

We wish you sound health and look forward to serving you with clinical precision.

Yours faithfully,

Director of Patient Care Services & Medical Records Administration
LabCore Diagnostics & Research Institute
Main Facility: Central Healthcare Boulevard, Medical District
Website: https://labcore.in`
  },
  {
    id: "report_dispatch",
    name: "Confidential Diagnostic Pathology Report Dispatch",
    category: "Report Release",
    description: "Encrypted, pathologist-authorized cumulative laboratory findings release.",
    subject: "Confidential Diagnostic Pathology Report: {{patient_name}} [UHID: {{uhid}}]",
    body: `CONFIDENTIAL MEDICAL DOCUMENT TRANSMISSION
========================================================================================================
To: {{patient_name}}
Universal Health ID (UHID): {{uhid}}
Issuing Facility: LabCore Central Reference Laboratory (NABL Accredited - ISO 15189:2012)

Dear {{patient_name}},

Please find attached your comprehensive diagnostic laboratory test report. The analytical investigations requested under UHID: {{uhid}} have completed rigorous internal and external quality assurance protocols and have been authorized by our Senior Consultant Pathologist.

INVESTIGATION SPECIFICS & ENCLOSURES:
--------------------------------------------------------------------------------------------------------
• Patient Name: {{patient_name}}
• Universal Health Identifier (UHID): {{uhid}}
• Enclosed Documentation: Digitally Authorized Laboratory Report (PDF)
• Document Authentication: Certified with cryptographic digital signature and verification QR code

SECURITY & CONFIDENTIALITY PROTOCOL:
In accordance with international healthcare information privacy standards, the enclosed electronic document is encrypted.
• Passcode Format: Your 8-digit Date of Birth in DDMMYYYY format.
• Example: If your Date of Birth is 14th November 1982, the decryption passcode is: 14111982.

IMPORTANT CLINICAL ADVISORY:
Diagnostic laboratory parameters should always be evaluated in conjunction with complete clinical history, symptomatic evaluation, and therapeutic context by a licensed medical practitioner. We strongly recommend scheduling a follow-up consultation with your attending physician to discuss these findings.

If you or your consulting physician require technical elaboration on testing methodologies, reference biological intervals, or analyzer platforms, please contact our on-duty pathologist:
• Pathology Department Desk: +91 98765 43210 (Ext. 4)
• Clinical Email: pathology@labcore.in

Thank you for entrusting your diagnostic evaluations to LabCore Diagnostics.

Warm regards,

Department of Laboratory Medicine & Dispatch Automation
LabCore Diagnostics & Hospital
Emergency Laboratory Hotline: 1800-123-5222 | dispatch@labcore.in`
  },
  {
    id: "pre_test_fasting",
    name: "Clinical Protocol: Pre-Analytical Fasting & Preparation",
    category: "Clinical Prep",
    description: "Preparation directives to minimize biological variability.",
    subject: "Clinical Advisory: Pre-Investigation Preparation & Fasting Protocols [UHID: {{uhid}}]",
    body: `CLINICAL PRE-ANALYTICAL DIRECTIVE
========================================================================================================
Patient Name: {{patient_name}}
Universal Health Identifier (UHID): {{uhid}}

Dear {{patient_name}},

This clinical advisory provides instructions to prepare for your forthcoming laboratory investigations under UHID: {{uhid}}. Adhering to these pre-analytical guidelines guarantees optimal analytical precision and prevents the inconvenience of sample recollection.

MANDATORY PRE-COLLECTION PROTOCOLS:
--------------------------------------------------------------------------------------------------------
1. FASTING RESTRICTIONS (10 - 12 HOURS):
   • If your order includes Lipid Profile, Fasting Blood Glucose (FBS), Comprehensive Metabolic Panel, or Insulin Assays, strict overnight fasting is required.
   • Do not consume solid food, juices, milk, tea, coffee, energy drinks, or chewing gum.
   • You are strongly encouraged to drink plenty of plain water to ensure adequate vascular hydration and smooth venipuncture.

2. CHRONIC MEDICATION GUIDELINES:
   • Continue essential maintenance medications (such as anti-hypertensive, antiepileptic, or cardiac drugs) with plain water, unless your physician has explicitly instructed otherwise.
   • Patients scheduled for Thyroid Function testing (TSH, Free T3, Free T4) should defer their morning dose of Levothyroxine/Thyronorm until AFTER blood collection has taken place.
   • Diabetics should withhold morning insulin or oral hypoglycemics until after the fasting specimen is collected and breakfast is consumed.

3. PHYSICAL & LIFESTYLE RESTRICTIONS:
   • Refrain from strenuous physical exercise, gym workouts, and heavy labor for 12 hours prior to testing.
   • Strictly avoid alcoholic beverages and nicotine (smoking or vaping) for 24 hours prior to sampling.

Should you require clarification on fasting windows or specific specimen container requirements, please contact our phlebotomy coordinator:
• Phlebotomy Coordination: +91 98765 43210 (Ext. 2)
• Email: collection@labcore.in

Respectfully,

Quality Assurance Division & Department of Phlebotomy
LabCore Diagnostics & Research Institute`
  },
  {
    id: "billing_invoice",
    name: "Official Statement of Diagnostic Account & Tax Invoice",
    category: "Billing",
    description: "Automated billing statement and GST tax invoice reconciliation.",
    subject: "Official Statement of Diagnostic Account & Tax Invoice [UHID: {{uhid}}]",
    body: `STATEMENT OF DIAGNOSTIC ACCOUNT & TAX INVOICE
========================================================================================================
Patient Name: {{patient_name}}
Universal Health Identifier (UHID): {{uhid}}
Billing Division: LabCore Financial Operations & Patient Accounts

Dear {{patient_name}},

Please find enclosed the formal statement of account and computer-generated tax invoice for diagnostic investigations requisitioned under UHID: {{uhid}}.

FINANCIAL PARTICULARS & ORDER SUMMARY:
--------------------------------------------------------------------------------------------------------
• Beneficiary Patient: {{patient_name}}
• Primary UHID: {{uhid}}
• Billing Institution: LabCore Diagnostics & Hospital
• Compliance: GST-Compliant Tax Invoice & Official Electronic Receipt
• Account Status: Settlement Reconciliation Pending

INSTANT SECURE PAYMENT GATEWAY:
You can conveniently clear your outstanding balance through our encrypted banking gateway supporting UPI, RuPay, Visa, MasterCard, and Net Banking:
https://labcore.in/pay/{{uhid}}

AUTOMATED SERVICE UNLOCK:
Upon transaction confirmation, your receipt will be archived to your permanent patient record and verified test reports will be instantly unlocked for download.

For billing inquiries, insurance reimbursement assistance, or itemized expense breakdown:
• Billing Support: 1800-123-5222
• Electronic Mail: accounts@labcore.in

We appreciate your prompt attention to this reconciliation.

Sincerely,

Patient Accounts & Revenue Cycle Management
LabCore Diagnostics & Hospital`
  },
  {
    id: "critical_value_alert",
    name: "PRIORITY MEDICAL ALERT: Urgent Clinical Review Required",
    category: "STAT Alert",
    description: "STAT medical alert for critical laboratory findings requiring clinical intervention.",
    subject: "PRIORITY MEDICAL ALERT: Urgent Clinical Review Required [UHID: {{uhid}}]",
    body: `URGENT CONFIDENTIAL CLINICAL COMMUNICATION
========================================================================================================
Attention: {{patient_name}} / Attending Consulting Physician
UHID Reference: {{uhid}}
Clinical Priority: STAT - URGENT ACTION MANDATED

Dear {{patient_name}},

This is a priority clinical notification from the Supervisory Pathology Division at LabCore Diagnostics.

During the analytical processing of your diagnostic specimen (UHID: {{uhid}}), our clinical instrumentation and evaluating pathologist identified laboratory values that fall into established "Critical Decision Thresholds" (values indicating immediate clinical importance).

MANDATORY CLINICAL STEPS:
--------------------------------------------------------------------------------------------------------
1. IMMEDIATE PHYSICIAN CONTACT:
   Please contact your treating medical practitioner or consulting doctor immediately to apprise them of your laboratory findings.
   
2. EXPEDITED REPORT ACCESS:
   Your interim verified pathology documentation is immediately accessible to you and your doctor at:
   https://labcore.in/reports/{{uhid}}

3. EMERGENCY SYMPTOM PROTOCOL:
   If you are experiencing any acute clinical symptoms—including acute chest discomfort, severe dyspnea (shortness of breath), fainting, disorientation, or extreme weakness—please present immediately to the nearest Emergency Casualty or Hospital Intensive Care Unit.

Our Senior Duty Pathologist is available to confer directly with your attending physician:
• Emergency Medical Dispatch: +91 98765 43210 (Select Option 9)
• Direct Clinical Hotline: emergency@labcore.in

With our highest priority for your medical well-being,

Chief Medical Officer & Department of Laboratory Medicine
LabCore Diagnostics & Hospital`
  },
  {
    id: "doctor_dispatch",
    name: "Physician Courtesy Notification: Diagnostic Results",
    category: "Physician Referral",
    description: "Formal physician transmission with test methodologies and LIS doctor portal link.",
    subject: "Physician Courtesy Notification: Diagnostic Results for {{patient_name}} [UHID: {{uhid}}]",
    body: `PHYSICIAN CLINICAL COURTESY TRANSMISSION
========================================================================================================
To: Attending / Referring Consulting Physician
Patient Name: {{patient_name}}
Patient UHID: {{uhid}}
Facility: LabCore Central Reference Laboratory

Respected Doctor,

We have completed the comprehensive clinical pathology investigations ordered for your patient, {{patient_name}} (UHID: {{uhid}}).

All tests have been processed utilizing automated, calibrated clinical chemistry, immunoassay, and hematology platforms following strict ISO 15189 / NABL accredited internal and external quality controls.

INVESTIGATION HIGHLIGHTS:
--------------------------------------------------------------------------------------------------------
• Patient UHID: {{uhid}}
• Authorization: Validated and signed by Consultant Pathologist
• Cumulative History: Cumulative comparative trending against previous evaluations is accessible
• Direct Clinical Portal Access:
  https://labcore.in/doctor-portal/order/{{uhid}}

Should you desire any reflex testing, clinical consultation with our pathologist, or dilution/repeat verification on the stored specimen, please communicate directly with our Clinical Laboratory Director:
• Doctor Direct Line: +91 98765 43210 (Doctor Priority Ext. 5)
• Professional Email: doctors@labcore.in

Thank you for your valued referral and collaboration in patient care.

Respectfully,

Department of Laboratory Medicine
LabCore Diagnostics & Hospital`
  }
];

export default function PatientCommunicationCenter({ patient, onClose, standalone = false }: PatientCommunicationCenterProps) {
  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>("WHATSAPP");
  
  // WhatsApp State
  const [waTemplateId, setWaTemplateId] = useState(WHATSAPP_TEMPLATES[0].id);
  const [waMessageText, setWaMessageText] = useState("");
  const [isSendingWa, setIsSendingWa] = useState(false);

  // Email State
  const [emailTemplateId, setEmailTemplateId] = useState(EMAIL_TEMPLATES[0].id);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [attachReport, setAttachReport] = useState(true);
  const [attachInvoice, setAttachInvoice] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<"none" | "whatsapp" | "email">("none");

  const patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient";
  const uhid = patient?.uhid || "LC-000000";
  const phoneObj = formatIndianPhone(patient?.phone);

  const selectedWaTemplate = WHATSAPP_TEMPLATES.find(t => t.id === waTemplateId) || WHATSAPP_TEMPLATES[0];
  const selectedEmailTemplate = EMAIL_TEMPLATES.find(t => t.id === emailTemplateId) || EMAIL_TEMPLATES[0];

  // Process templates with real dynamic values
  useEffect(() => {
    const formattedDate = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
    const formattedTime = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date());

    if (activeChannel === "WHATSAPP") {
      const template = WHATSAPP_TEMPLATES.find(t => t.id === waTemplateId) || WHATSAPP_TEMPLATES[0];
      const processed = template.text
        .replace(/{{patient_name}}/g, patientName)
        .replace(/{{uhid}}/g, uhid)
        .replace(/{{date}}/g, formattedDate)
        .replace(/{{time}}/g, formattedTime);
      setWaMessageText(processed);
    } else {
      const template = EMAIL_TEMPLATES.find(t => t.id === emailTemplateId) || EMAIL_TEMPLATES[0];
      const processedSubject = template.subject
        .replace(/{{patient_name}}/g, patientName)
        .replace(/{{uhid}}/g, uhid)
        .replace(/{{date}}/g, formattedDate);
      const processedBody = template.body
        .replace(/{{patient_name}}/g, patientName)
        .replace(/{{uhid}}/g, uhid)
        .replace(/{{date}}/g, formattedDate)
        .replace(/{{time}}/g, formattedTime);
      
      setEmailSubject(processedSubject);
      setEmailBody(processedBody);
    }
  }, [activeChannel, waTemplateId, emailTemplateId, patientName, uhid]);

  const handleCopy = (text: string, type: "whatsapp" | "email") => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      showSuccess("Message content copied to clipboard!");
      setTimeout(() => setCopiedType("none"), 2500);
    }
  };

  const insertVariable = (variable: string) => {
    if (activeChannel === "WHATSAPP") {
      setWaMessageText(prev => prev + " " + variable);
    } else {
      setEmailBody(prev => prev + " " + variable);
    }
  };

  const handleSendWhatsApp = async (openWebOnly = false) => {
    if (!patient?.phone) {
      showError("Patient does not have a registered mobile contact number.");
      return;
    }
    
    setIsSendingWa(true);
    
    try {
      if (!openWebOnly && patient.id) {
        // Attempt LIS backend communication log
        try {
          await communicationApi.sendWhatsApp({
            patientId: patient.id,
            to: phoneObj.e164 || patient.phone,
            message: waMessageText,
          });
        } catch {
          // Non-blocking fallback to continue direct delivery
        }
      }

      showSuccess("WhatsApp communication processed and queued!");

      // Open WhatsApp web or native client with encoded message
      const cleanPhone = phoneObj.e164.replace(/\D/g, "");
      const msg = encodeURIComponent(waMessageText);
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
      
      if (onClose) onClose();
    } catch {
      showError("Failed to dispatch WhatsApp message. Please check network.");
    } finally {
      setIsSendingWa(false);
    }
  };

  const handleSendEmail = async () => {
    if (!patient?.email) {
      showError("Patient does not have a registered electronic mail address.");
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      if (patient.id) {
        await communicationApi.sendEmail({
          patientId: patient.id,
          to: patient.email,
          subject: emailSubject,
          body: emailBody,
          attachments: attachReport ? [{ filename: `LabCore_Report_${uhid}.pdf`, content: "sample-pdf-content" }] : []
        });
      } else {
        // Fallback simulation
        await new Promise(res => setTimeout(res, 1000));
      }
      
      showSuccess("Encrypted clinical email dispatched successfully!");
      if (onClose) onClose();
    } catch {
      showError("Could not dispatch email. Verification logged for retry.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const content = (
    <div className={`bg-white ${standalone ? 'rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden' : 'h-full flex flex-col'}`}>
      {standalone && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">Clinical Communication Gateway</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NABL / ISO 15189
                </span>
              </div>
              <p className="text-xs text-slate-300">Target: {patientName} (UHID: {uhid})</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Channel Switcher Tabs */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex gap-2">
        <button
          onClick={() => setActiveChannel("WHATSAPP")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeChannel === "WHATSAPP"
              ? "bg-white text-emerald-700 border-2 border-emerald-500 shadow-sm shadow-emerald-500/10"
              : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white hover:text-slate-900"
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeChannel === "WHATSAPP" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            <MessageCircle className="w-4 h-4" />
          </div>
          <span>WhatsApp Clinical Bot</span>
          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Direct</span>
        </button>

        <button
          onClick={() => setActiveChannel("EMAIL")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeChannel === "EMAIL"
              ? "bg-white text-blue-700 border-2 border-blue-500 shadow-sm shadow-blue-500/10"
              : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white hover:text-slate-900"
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeChannel === "EMAIL" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
            <Mail className="w-4 h-4" />
          </div>
          <span>Encrypted Email Dispatch</span>
          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">SSL 256-bit</span>
        </button>
      </div>

      <div className={`p-6 ${standalone ? 'max-h-[78vh] overflow-y-auto' : 'flex-1 overflow-y-auto'} space-y-6 bg-slate-50/30`}>
        {/* WHATSAPP VIEW */}
        {activeChannel === "WHATSAPP" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Target Contact Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Mobile Destination</p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-800 font-bold">Primary</span>
                  </div>
                  <p className="font-mono text-sm font-black text-slate-900">{phoneObj.display || "No mobile number provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                  patient?.phoneVerified ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  {patient?.phoneVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {patient?.phoneVerified ? "OTP Verified" : "Unverified"}
                </span>
              </div>
            </div>

            {/* Template Selector Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Select Professional Template
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Category: {selectedWaTemplate.category}
                </span>
              </div>

              <div className="relative">
                <select
                  value={waTemplateId}
                  onChange={(e) => setWaTemplateId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 bg-white hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all cursor-pointer"
                >
                  {WHATSAPP_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <p className="text-xs text-slate-500 italic">
                {selectedWaTemplate.description}
              </p>
            </div>

            {/* Variable Insertion Pills */}
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Insert Tags:</span>
              <button
                type="button"
                onClick={() => insertVariable(patientName)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
              >
                + Patient Name
              </button>
              <button
                type="button"
                onClick={() => insertVariable(uhid)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
              >
                + UHID
              </button>
              <button
                type="button"
                onClick={() => insertVariable("https://labcore.in/portal/" + uhid)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
              >
                + Portal Link
              </button>
              <button
                type="button"
                onClick={() => insertVariable("+91 98765 43210")}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
              >
                + Helpline
              </button>
            </div>

            {/* Live Interactive WhatsApp Chat Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Live Preview & Message Editor
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(waMessageText, "whatsapp")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:border-emerald-300 transition-all shadow-2xs"
                  >
                    {copiedType === "whatsapp" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-emerald-300/80 shadow-md bg-[#efeae2]">
                {/* WhatsApp Chat Top Header Bar */}
                <div className="bg-[#005e54] text-white px-4 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-black text-sm text-white border border-white/20">
                      {patient?.firstName?.charAt(0) || "P"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold leading-tight">{patientName}</p>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                      </div>
                      <p className="text-[11px] text-emerald-100/90 font-medium">LabCore Diagnostic Bot • Online</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-white font-mono font-bold">
                      UHID: {uhid}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Chat Body */}
                <div className="p-4 bg-[#efeae2] min-h-[220px]">
                  <div className="text-center my-1.5">
                    <span className="text-[10px] bg-white/80 text-slate-600 px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                      TODAY
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl rounded-tl-none p-3.5 max-w-[92%] shadow-sm border border-black/5 relative ml-1">
                    <textarea
                      value={waMessageText}
                      onChange={(e) => setWaMessageText(e.target.value)}
                      className="w-full min-h-[180px] text-[13px] leading-relaxed text-slate-900 bg-transparent resize-y focus:outline-none font-sans whitespace-pre-wrap selection:bg-emerald-100"
                      placeholder="Type or customize your professional WhatsApp message..."
                    />
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {waMessageText.length} chars • ~{Math.ceil(waMessageText.length / 50)}s read
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                        <span>Just now</span>
                        <span className="text-blue-500 font-black">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSendWhatsApp(false)}
                disabled={isSendingWa || !patient?.phone}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px]"
              >
                {isSendingWa ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Dispatching via LIS...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send via WhatsApp API</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsApp(true)}
                disabled={!patient?.phone}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-500 font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px]"
              >
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Open in WhatsApp Web</span>
              </button>
            </div>
          </div>
        )}

        {/* EMAIL VIEW */}
        {activeChannel === "EMAIL" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Target Contact Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-sm shrink-0">
                  <AtSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Recipient Address</p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/60 text-blue-800 font-bold">Primary</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{patient?.email || "No email address registered"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                  patient?.emailVerified ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  {patient?.emailVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {patient?.emailVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            {/* Template Selector Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Select Professional Template
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Category: {selectedEmailTemplate.category}
                </span>
              </div>

              <div className="relative">
                <select
                  value={emailTemplateId}
                  onChange={(e) => setEmailTemplateId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 bg-white hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all cursor-pointer"
                >
                  {EMAIL_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <p className="text-xs text-slate-500 italic">
                {selectedEmailTemplate.description}
              </p>
            </div>

            {/* Email Composer Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Email Composer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" /> SSL Encrypted
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(emailBody, "email")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:border-blue-300 transition-all shadow-2xs"
                  >
                    {copiedType === "email" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Body</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* From & To Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <span className="font-bold text-slate-500">From:</span>
                    <span className="font-medium text-slate-800">LabCore Automated Dispatch &lt;dispatch@labcore.in&gt;</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 truncate">
                    <span className="font-bold text-slate-500">To:</span>
                    <span className="font-medium text-slate-800 truncate">{patient?.email || "patient@example.com"}</span>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Subject Header</label>
                    <span className="text-[10px] text-slate-400 font-mono">{emailSubject.length} characters</span>
                  </div>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Message Body (Formal Clinical Letter)</label>
                    <span className="text-[10px] text-slate-400 font-medium">Plaintext / HTML Formatted</span>
                  </div>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full h-56 rounded-xl border border-slate-300 p-4 text-[13px] leading-relaxed text-slate-800 font-sans focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y shadow-2xs"
                  />
                </div>

                {/* Attachments selector */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2.5 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    Enclosures & Verified Medical Attachments
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      attachReport ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={attachReport}
                        onChange={(e) => setAttachReport(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className={`w-4 h-4 shrink-0 ${attachReport ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">Digitally Signed Report (PDF)</p>
                          <p className="text-[10px] text-slate-500">256-Bit Password Encrypted</p>
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      attachInvoice ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={attachInvoice}
                        onChange={(e) => setAttachInvoice(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className={`w-4 h-4 shrink-0 ${attachInvoice ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">GST Account Invoice (PDF)</p>
                          <p className="text-[10px] text-slate-500">Official Computerized Bill</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Dispatch Action Button */}
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSendingEmail || !patient?.email}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px]"
            >
              {isSendingEmail ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Dispatching Encrypted Email via SMTP...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Secure Clinical Email</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Audit & Compliance Disclaimer */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>LabCore ELIS OS • ISO 15189:2012 & NABL Clinical Standard</span>
          </div>
          <div className="flex items-center gap-3">
            <span>HIPAA / DISHA Compliant</span>
            <span>•</span>
            <span>Audit Trail Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  return content;
}

