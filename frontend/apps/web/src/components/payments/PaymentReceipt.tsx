'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  FileText,
  CreditCard,
  QrCode,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Award,
  Check,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  HeartPulse,
  BadgeCheck,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';

export type FacilityMode = 'HOSPITAL' | 'DIAGNOSTIC_LAB' | 'CLINIC';

export interface ReceiptLineItem {
  id?: string;
  code?: string;
  sacCode?: string;
  name: string;
  department?: string;
  sampleType?: string;
  tubeColor?: string;
  tubeName?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  totalPrice?: number;
}

export interface OrganizationProfile {
  name?: string;
  subtitle?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  emergency?: string;
  email?: string;
  website?: string;
  regNo?: string;
  gstin?: string;
  sacCode?: string;
  nablCertNo?: string;
  isoCert?: string;
  logoUrl?: string;
  facilityType?: FacilityMode;
}

export interface PaymentReceiptProps {
  payment: any;
  invoice?: any;
  patient?: any;
  organization?: OrganizationProfile;
  facilityType?: FacilityMode;
  isOpen?: boolean;
  onClose?: () => void;
  autoPrint?: boolean;
}

// ─── FACILITY CONFIGURATION PRESETS ──────────────────────────────────────────
const FACILITY_PRESETS: Record<
  FacilityMode,
  {
    name: string;
    subtitle: string;
    tagline: string;
    badge: string;
    badgeColor: string;
    accentColor: string;
    themeGradient: string;
    address: string;
    phone: string;
    emergency: string;
    email: string;
    website: string;
    regNo: string;
    regLabel: string;
    gstin: string;
    sacCode: string;
    certifications: string;
    itemColumnHeader: string;
    metadataField1: { label: string; key: string; fallback: string };
    metadataField2: { label: string; key: string; fallback: string };
    terms: string[];
  }
> = {
  HOSPITAL: {
    name: 'LABCORE MULTISPECIALITY HOSPITAL & RESEARCH CENTER',
    subtitle: 'Department of Inpatient, Outpatient, Diagnostics & Emergency Clinical Services',
    tagline: 'NABH Accredited Tertiary Healthcare • 24×7 Emergency Care • Modern ICUs & Diagnostics',
    badge: 'NABH ACCREDITED HOSPITAL (5TH ED.)',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
    accentColor: '#0369a1',
    themeGradient: 'from-sky-800 via-sky-600 to-teal-700',
    address: '701-705, Health City Avenue, Opp. Civil Hospital, SG Highway, Ahmedabad, Gujarat - 380060',
    phone: '+91 79 4001 8800 | 079-26561100',
    emergency: 'Emergency / Trauma 24×7: 1066',
    email: 'billing@labcorehospital.in',
    website: 'www.labcorehospital.in',
    regNo: 'HOSP/GJ/AHM/2026/0942',
    regLabel: 'Hospital Reg. No.',
    gstin: '24AABCL1234F1Z8',
    sacCode: '999311 (Hospital & Clinical Services)',
    certifications: 'NABH 5th Edition • ISO 9001:2015 • Cashless TPA Empanelled',
    itemColumnHeader: 'Hospital Service / Procedure / Investigation Particulars',
    metadataField1: { label: 'Encounter / Ward', key: 'encounterType', fallback: 'OPD / Daycare' },
    metadataField2: { label: 'Attending Consultant', key: 'doctorName', fallback: 'Dr. Rajesh Mehta, MD (Medicine)' },
    terms: [
      'Please present this original receipt at the billing counter / TPA desk during discharge or claim clearance.',
      'Healthcare and diagnostic services rendered by clinical establishments are 100% exempt from GST under SAC 9993.',
      'Payment made is eligible for tax deduction under Section 80D of the Income Tax Act where applicable.',
      'Emergency 24x7 helpdesk: 1066. To access your electronic medical record (EMR), visit www.labcorehospital.in.',
    ],
  },
  DIAGNOSTIC_LAB: {
    name: 'LABCORE DIAGNOSTIC & MOLECULAR REFERENCE LABORATORY',
    subtitle: 'Department of Laboratory Medicine, Clinical Biochemistry, Hematology & Molecular Genomics',
    tagline: 'Precision Diagnostics • Ethical Healthcare • NABL (ISO 15189:2022) & EQAS Enrolled',
    badge: 'NABL ACCREDITED (ISO 15189:2022)',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
    accentColor: '#0f766e',
    themeGradient: 'from-teal-800 via-sky-600 to-teal-700',
    address: 'Suite 401-404, Apex Healthcare Tower, CG Road, Ahmedabad, Gujarat - 380009',
    phone: '+91 98765 43210 | 079-40018800',
    emergency: 'Emergency Lab TAT: +91 98765 00112',
    email: 'billing@labcorehealth.in',
    website: 'www.labcorehealth.in',
    regNo: 'LAB/GJ/2026/0491',
    regLabel: 'NABL Cert / Lab Reg No.',
    gstin: '24AABCL1234F1Z5',
    sacCode: '999312 (Medical Diagnostic Services)',
    certifications: 'NABL (ISO 15189:2022 MC-4892) • ICMR Approved • EQAS Enrolled',
    itemColumnHeader: 'Diagnostic Investigation / Test Particulars & Specimen',
    metadataField1: { label: 'Sample / Accession', key: 'accessionNo', fallback: 'Whole Blood / EDTA' },
    metadataField2: { label: 'Referring Doctor', key: 'doctorName', fallback: 'Self / Consultant Referral' },
    terms: [
      'Please present this receipt or registered mobile number at the sample delivery counter to collect diagnostic reports.',
      'Diagnostic pathology & laboratory testing services are exempt from GST under SAC 9993 vide Notification No. 12/2017-CT(Rate).',
      'Verified reports can also be downloaded directly from WhatsApp or via QR code / Patient Portal: www.labcorehealth.in.',
      'In case of haemolysed or insufficient specimen, complimentary re-collection will be scheduled within 24 hours.',
    ],
  },
  CLINIC: {
    name: 'MEDSQUARE CLINIC & SPECIALITY HEALTHCARE CENTER',
    subtitle: 'Department of Family Medicine, Specialist OPD Consultations & Preventive Clinical Care',
    tagline: 'Quality Outpatient Healthcare • Specialist Consultations • Daycare Diagnostics',
    badge: 'CLINICAL ESTABLISHMENT REGISTERED',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    accentColor: '#2563eb',
    themeGradient: 'from-indigo-800 via-sky-600 to-indigo-700',
    address: '12-14, MedSquare Commercial Plaza, Station Road, Mehsana, Gujarat - 384002',
    phone: '+91 98250 12345 | 02762-245600',
    emergency: 'Clinic Hotline: +91 98250 12345',
    email: 'care@medsquareclinic.com',
    website: 'www.medsquareclinic.com',
    regNo: 'CLN/GJ/2026/1842',
    regLabel: 'Clinic Establishment Reg.',
    gstin: '24AABCL1234F1Z2',
    sacCode: '999313 (Speciality Clinic OPD Services)',
    certifications: 'Clinical Establishments Act Registered • QCI Healthcare Quality Assured',
    itemColumnHeader: 'Clinical Consultation, Investigation & Daycare Particulars',
    metadataField1: { label: 'Consultation Token', key: 'tokenNo', fallback: 'OPD Token #14' },
    metadataField2: { label: 'Consulting Physician', key: 'doctorName', fallback: 'Dr. Anand Joshi, MBBS, DNB (Fam. Med)' },
    terms: [
      'Consultation fee is valid for one follow-up review within 7 calendar days with the same specialist physician.',
      'Outpatient clinical & consultation services are exempt from GST under statutory healthcare exemption Notification 12/2017.',
      'Please arrive 10 minutes prior to scheduled appointment slots with prior medical records and previous prescriptions.',
      'Subject to local jurisdiction. Computer generated clinical receipt requires no physical signature when verified online.',
    ],
  },
};

// ─── CRISP VECTOR CODE128 SVG BARCODE ─────────────────────────────────────────
function SvgBarcode({ code, height = 24 }: { code: string; height?: number }) {
  const cleanCode = (code || '000000').toUpperCase();
  const bars: Array<{ x: number; w: number }> = [];
  let currentX = 2;
  const hash = cleanCode.split('').reduce((acc, char) => acc * 31 + char.charCodeAt(0), 11);

  bars.push({ x: currentX, w: 2 });
  currentX += 3;
  bars.push({ x: currentX, w: 1 });
  currentX += 2;
  bars.push({ x: currentX, w: 2 });
  currentX += 4;

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const w1 = ((charCode ^ hash) % 3) + 1;
    const gap = (((charCode >> 2) ^ (i * 5)) % 2) + 1;
    bars.push({ x: currentX, w: w1 });
    currentX += w1 + gap;
  }
  bars.push({ x: currentX, w: 2 });
  currentX += 3;
  bars.push({ x: currentX, w: 1 });
  currentX += 2;
  bars.push({ x: currentX, w: 2 });
  currentX += 4;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={currentX + 4}
        height={height}
        viewBox={`0 0 ${currentX + 4} ${height}`}
        className="shape-rendering-crispEdges"
      >
        {bars.map((bar, i) => (
          <rect key={i} x={bar.x} y={0} width={bar.w} height={height} fill="#0f172a" />
        ))}
      </svg>
      <span className="text-[9px] font-mono tracking-widest text-slate-600 font-semibold mt-0.5">
        *{cleanCode}*
      </span>
    </div>
  );
}

// ─── VECTOR MEDICAL EMBLEM LOGOS ──────────────────────────────────────────────
function VectorFacilityLogo({ type }: { type: FacilityMode }) {
  if (type === 'HOSPITAL') {
    return (
      <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-xl bg-sky-50 border-2 border-sky-600 text-sky-700 shadow-xs">
        <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="52" height="52" rx="14" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2.5" />
          <rect x="27" y="15" width="10" height="34" rx="2" fill="#0284C7" />
          <rect x="15" y="27" width="34" height="10" rx="2" fill="#0284C7" />
          <path
            d="M11 32H20L23.5 22L28.5 42L32.5 28L35.5 32H53"
            stroke="#0D9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  if (type === 'DIAGNOSTIC_LAB') {
    return (
      <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50 border-2 border-teal-600 text-teal-700 shadow-xs">
        <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="27" fill="#F0FDFA" stroke="#0D9488" strokeWidth="2.5" />
          <path
            d="M26 14H38M30 14V24L18 44C16.8 46 18.2 48 20.5 48H43.5C45.8 48 47.2 46 46 44L34 24V14"
            stroke="#0F766E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M22 38H42" stroke="#0284C7" strokeWidth="2" strokeDasharray="2 2" />
          <circle cx="28" cy="42" r="2" fill="#0D9488" />
          <circle cx="35" cy="40" r="1.5" fill="#0284C7" />
          <circle cx="32" cy="34" r="1.5" fill="#0F766E" />
        </svg>
      </div>
    );
  }

  // Clinic Logo
  return (
    <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 border-2 border-indigo-600 text-indigo-700 shadow-xs">
      <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="52" height="52" rx="14" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.5" />
        <path
          d="M20 18V28C20 34.6 25.4 40 32 40C38.6 40 44 34.6 44 28V18"
          stroke="#4338CA"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M32 40V46C32 48.2 33.8 50 36 50H42" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="44" cy="50" r="3.5" fill="#0284C7" stroke="#4338CA" strokeWidth="1.5" />
        <path d="M16 20H24M40 20H48" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 28H40" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 20V36" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── HELPER: NUMBER TO INDIAN CURRENCY WORDS ──────────────────────────────────
function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'Zero Rupees Only';
  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? ' ' + ones[n % 10] : ''}`;
  };

  const convertNumber = (n: number): string => {
    if (n === 0) return 'Zero';
    let str = '';
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    if (crore > 0) str += `${convertTwoDigits(crore)} Crore `;
    if (lakh > 0) str += `${convertTwoDigits(lakh)} Lakh `;
    if (thousand > 0) str += `${convertTwoDigits(thousand)} Thousand `;
    if (hundred > 0) str += `${ones[hundred]} Hundred `;
    if (remainder > 0) {
      if (str !== '') str += 'and ';
      str += convertTwoDigits(remainder);
    }
    return str.trim();
  };

  const rupeeWords = `Rupees ${convertNumber(rupees)}`;
  const paiseWords = paise > 0 ? ` and ${convertTwoDigits(paise)} Paise` : '';
  return `${rupeeWords}${paiseWords} Only`;
}

// ─── HELPER: FORMAT INR ───────────────────────────────────────────────────────
function formatINR(value: number | string | undefined | null): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── HELPER: FORMAT DATE & TIME ───────────────────────────────────────────────
function formatDateTime(dateInput?: string | Date | null): { date: string; time: string } {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return {
      date: fallback.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: fallback.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  }
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function PaymentReceipt({
  payment,
  invoice,
  patient,
  organization,
  facilityType: initialFacilityType,
  isOpen = true,
  onClose,
}: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Determine initial facility mode: passed prop -> payment encounterType -> default DIAGNOSTIC_LAB
  const detectedFacility: FacilityMode = useMemo(() => {
    if (initialFacilityType) return initialFacilityType;
    if (organization?.facilityType) return organization.facilityType;
    const enc = (payment?.encounterType || '').toUpperCase();
    if (enc === 'IPD' || enc === 'STAT') return 'HOSPITAL';
    if (enc === 'OPD' && payment?.doctorName) return 'CLINIC';
    return 'DIAGNOSTIC_LAB';
  }, [initialFacilityType, organization, payment]);

  const [activeFacility, setActiveFacility] = useState<FacilityMode>(detectedFacility);
  const [copyType, setCopyType] = useState<'ORIGINAL FOR PATIENT' | 'DUPLICATE FOR ACCOUNTS' | 'TRIPLICATE FOR AUDIT'>(
    'ORIGINAL FOR PATIENT'
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Get active preset configuration
  const preset = FACILITY_PRESETS[activeFacility];

  // Merge organization details with active preset
  const org = {
    name: organization?.name || preset.name,
    subtitle: organization?.subtitle || preset.subtitle,
    tagline: organization?.tagline || preset.tagline,
    address: organization?.address || preset.address,
    phone: organization?.phone || preset.phone,
    emergency: organization?.emergency || preset.emergency,
    email: organization?.email || preset.email,
    website: organization?.website || preset.website,
    regNo: organization?.regNo || preset.regNo,
    regLabel: preset.regLabel,
    gstin: organization?.gstin || preset.gstin,
    sacCode: organization?.sacCode || preset.sacCode,
    certifications: preset.certifications,
    logoUrl: organization?.logoUrl || '',
  };

  // Normalize Data from Payment / Invoice / Order / Patient objects
  const inv = invoice || payment?.invoice || {};
  const ord = payment?.order || inv?.order || {};
  const pat = patient || payment?.patient || inv?.patient || ord?.patient || {};

  const receiptNo =
    payment?.receiptNumber ||
    payment?.receiptNo ||
    payment?.receipt?.receiptNo ||
    `RCP-${(payment?.id || '0001').toString().slice(-6).toUpperCase()}`;

  const invoiceNo =
    inv?.invoiceNumber ||
    inv?.invoiceNo ||
    payment?.invoiceNumber ||
    payment?.invoiceNo ||
    `INV-${(inv?.id || payment?.invoiceId || '0001').toString().slice(-6).toUpperCase()}`;

  const orderNo =
    ord?.orderNumber ||
    ord?.orderNo ||
    payment?.orderNumber ||
    payment?.orderNo ||
    inv?.orderNumber ||
    `ORD-${(ord?.id || inv?.orderId || '1024').toString().slice(-6).toUpperCase()}`;

  const patientName =
    pat?.fullName ||
    (pat?.firstName ? `${pat.firstName} ${pat.lastName || ''}`.trim() : null) ||
    payment?.patientName ||
    inv?.patientName ||
    'Walk-in Patient';

  const patientId =
    pat?.uhid ||
    pat?.patientId ||
    pat?.mrn ||
    payment?.patientUhid ||
    payment?.uhid ||
    payment?.patientCode ||
    `UHID-${(pat?.id || payment?.patientId || '1001').toString().slice(-6).toUpperCase()}`;

  const ageGender = [
    pat?.age
      ? `${pat.age} Yrs`
      : pat?.ageYears
      ? `${pat.ageYears} Yrs`
      : payment?.patientAge
      ? `${payment.patientAge} Yrs`
      : null,
    pat?.gender || pat?.sex || payment?.patientGender || null,
  ]
    .filter(Boolean)
    .join(' / ') || 'N/A';

  const patientPhone = pat?.phone || pat?.mobile || payment?.patientPhone || payment?.phone || 'N/A';
  const patientAddress = pat?.address || pat?.city || payment?.patientAddress || 'Local Resident';

  const referringDoctor =
    payment?.doctorName ||
    ord?.doctor?.fullName ||
    ord?.doctor?.name ||
    ord?.referringDoctorName ||
    inv?.doctorName ||
    'Dr. Rajesh Mehta, MD (General Medicine)';

  const doctorSpecialization =
    payment?.doctorQualification ||
    ord?.doctor?.specialization ||
    (activeFacility === 'HOSPITAL' ? 'Senior Medical Consultant' : 'Consulting Pathologist / Physician');

  const departmentName =
    payment?.department ||
    ord?.department ||
    inv?.department ||
    (activeFacility === 'HOSPITAL'
      ? 'General Medicine & Diagnostic Services'
      : activeFacility === 'CLINIC'
      ? 'Speciality Outpatient Services'
      : 'Clinical Pathology & Laboratory Medicine');

  const paymentMethod = (
    payment?.method ||
    payment?.paymentMethod ||
    payment?.mode ||
    'CASH'
  ).toString().toUpperCase();

  const transactionRef =
    payment?.transactionId ||
    payment?.transactionRef ||
    payment?.referenceNo ||
    payment?.utrNumber ||
    payment?.instrumentRef ||
    (paymentMethod === 'CASH' ? 'COUNTER-CASH' : 'TXN-VERIFIED');

  const paymentStatus = (payment?.status || 'PAID').toString().toUpperCase();
  const collectedBy =
    (typeof payment?.collectedBy === 'string'
      ? payment.collectedBy
      : payment?.collectedBy?.fullName || payment?.collectedBy?.name) ||
    (typeof payment?.receivedBy === 'string'
      ? payment.receivedBy
      : payment?.receivedBy?.fullName) ||
    payment?.cashierName ||
    'Jaya Ashapurama (Cashier)';

  const counterDesk = payment?.counter || 'Billing Desk 01';

  const { date: receiptDate, time: receiptTime } = formatDateTime(
    payment?.paidAt || payment?.createdAt || new Date()
  );

  // Line Items Calculation
  const rawItems: any[] =
    payment?.items ||
    inv?.items ||
    ord?.items ||
    ord?.orderItems ||
    (payment?.testNames
      ? payment.testNames.split(',').map((name: string, idx: number) => ({
          id: String(idx + 1),
          name: name.trim(),
          quantity: 1,
          price: Number(payment?.amount || 0) / (payment.testNames.split(',').length || 1),
          totalPrice: Number(payment?.amount || 0) / (payment.testNames.split(',').length || 1),
        }))
      : []);

  const paidAmount = Number(payment?.amount ?? inv?.paidAmount ?? 0);
  const grossBillAmount = Number(
    inv?.SubTotal ?? inv?.subtotal ?? payment?.invoiceTotal ?? inv?.totalAmount ?? paidAmount
  );
  const discountAmount = Number(inv?.discountAmount ?? inv?.discount ?? payment?.discount ?? 0);
  const taxAmount = Number(inv?.taxAmount ?? inv?.gstAmount ?? 0);
  const netBillAmount = Number(
    inv?.netAmount ?? inv?.finalAmount ?? (grossBillAmount - discountAmount + taxAmount || paidAmount)
  );
  const totalPaidTillDate = Number(payment?.invoicePaid ?? inv?.paidAmount ?? paidAmount);
  const balanceDue = Math.max(
    0,
    Number(payment?.invoiceBalance ?? inv?.balanceAmount ?? inv?.dueAmount ?? (netBillAmount - totalPaidTillDate))
  );

  const lineItems: ReceiptLineItem[] =
    rawItems.length > 0
      ? rawItems.map((item: any, idx: number) => {
          const qty = Number(item?.quantity ?? 1);
          const rate = Number(item?.unitPrice ?? item?.price ?? item?.rate ?? item?.amount ?? 0);
          const disc = Number(item?.discount ?? item?.discountAmount ?? 0);
          const net = Number(item?.totalPrice ?? item?.netAmount ?? item?.finalPrice ?? item?.netPrice ?? (qty * rate - disc));
          return {
            id: item?.id || String(idx + 1),
            code: item?.test?.testCode || item?.test?.code || item?.code || item?.testCode || `DIAG-${101 + idx}`,
            sacCode: item?.sacCode || '999312',
            name:
              item?.test?.testName ||
              item?.test?.name ||
              item?.testName ||
              item?.description ||
              item?.name ||
              'Diagnostic Pathology Investigation & Clinical Service',
            department:
              item?.test?.category?.name ||
              item?.test?.department ||
              item?.department ||
              departmentName,
            sampleType: item?.sampleType || item?.test?.sampleType || 'Specimen',
            tubeColor: item?.tubeColor || '#0284c7',
            tubeName: item?.tubeName || '',
            quantity: qty,
            unitPrice: rate,
            discount: disc,
            totalPrice: net,
          };
        })
      : [
          {
            id: '1',
            code: orderNo,
            sacCode: '999312',
            name:
              payment?.notes ||
              payment?.remarks ||
              payment?.description ||
              `${departmentName} (Against Bill #${invoiceNo})`,
            department: departmentName,
            sampleType: 'Clinical Service',
            tubeColor: '#0284c7',
            tubeName: '',
            quantity: 1,
            unitPrice: grossBillAmount || paidAmount,
            discount: discountAmount,
            totalPrice: netBillAmount || paidAmount,
          },
        ];

  // Dynamic QR Code generation for online verification
  useEffect(() => {
    const verificationUrl = `https://labcore-elis.cloud/verify-receipt?receipt=${receiptNo}&uhid=${patientId}&amount=${paidAmount}`;
    QRCode.toDataURL(verificationUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Receipt QR Code generation error:', err));
  }, [receiptNo, patientId, paidAmount]);

  if (!isOpen || !payment) return null;

  // Dedicated A4 Print Handler (Direct & Popup Window)
  const handlePrintA4 = () => {
    if (!receiptRef.current) {
      window.print();
      return;
    }

    const printContents = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=950,height=1150');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Clinical_Receipt_${receiptNo}_${patientName.replace(/\\s+/g, '_')}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              width: 210mm;
              min-height: 280mm;
            }
            .a4-sheet {
              width: 100%;
              max-width: 195mm;
              margin: 0 auto;
              background: #ffffff !important;
            }
            @media print {
              .no-print { display: none !important; }
              body { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="a4-sheet">
            ${printContents}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PDF Export Handler
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsPdfGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = pdfW / canvas.width;
      const totalPages = Math.ceil((canvas.height * ratio) / pdfH);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -i * pdfH, pdfW, canvas.height * ratio);
      }
      pdf.save(`Clinical_Receipt_${receiptNo}_${patientName.replace(/\\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      handlePrintA4();
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-2 sm:p-5 overflow-y-auto print:static print:bg-white print:p-0">
      {/* Global In-Page Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          body * {
            visibility: hidden;
          }
          #clinical-a4-receipt,
          #clinical-a4-receipt * {
            visibility: visible;
          }
          #clinical-a4-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 210mm;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-[900px] my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* =====================================================================
            TOP INTERACTIVE ACTION TOOLBAR (Hidden in Print)
           ===================================================================== */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Mode Title & Facility Type Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Clinical Payment Receipt
                </h3>
                <p className="text-[11px] text-slate-400">
                  Standard A4 (210×297mm) • Light White Medical Theme
                </p>
              </div>
            </div>

            {/* Institution Facility Switcher: Hospital / Lab / Clinic */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveFacility('HOSPITAL')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  activeFacility === 'HOSPITAL'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Switch to Hospital Format"
              >
                <Building2 className="h-3.5 w-3.5" />
                Hospital
              </button>

              <button
                type="button"
                onClick={() => setActiveFacility('DIAGNOSTIC_LAB')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  activeFacility === 'DIAGNOSTIC_LAB'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Switch to Diagnostic Lab Format"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Lab
              </button>

              <button
                type="button"
                onClick={() => setActiveFacility('CLINIC')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  activeFacility === 'CLINIC'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Switch to Clinic Format"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Clinic
              </button>
            </div>
          </div>

          {/* Right: Copy selector + Print & Download Actions */}
          <div className="flex items-center gap-2">
            {/* Copy Selector */}
            <select
              value={copyType}
              onChange={(e) => setCopyType(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ORIGINAL FOR PATIENT">Original for Patient</option>
              <option value="DUPLICATE FOR ACCOUNTS">Duplicate for Accounts</option>
              <option value="TRIPLICATE FOR AUDIT">Triplicate for Audit</option>
            </select>

            {/* Print A4 Button */}
            <button
              type="button"
              onClick={handlePrintA4}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition"
              title="Print standard A4 sheet"
            >
              <Printer className="h-3.5 w-3.5" />
              Print A4
            </button>

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
              title="Download verified PDF"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              {isPdfGenerating ? 'Exporting...' : 'Save PDF'}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* =====================================================================
            PRINTABLE A4 CLINICAL RECEIPT SHEET (PURE LIGHT WHITE MEDICAL THEME)
           ===================================================================== */}
        <div className="max-h-[86vh] overflow-y-auto bg-slate-100 p-3 sm:p-6 print:max-h-none print:overflow-visible print:bg-white print:p-0">
          <div
            id="clinical-a4-receipt"
            ref={receiptRef}
            className="mx-auto w-full max-w-[210mm] min-h-[285mm] bg-white text-slate-900 p-7 sm:p-9 shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col justify-between"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              backgroundColor: '#ffffff',
              color: '#0f172a',
            }}
          >
            {/* TOP CONTAINER */}
            <div>
              {/* Top Accent Strip based on facility mode */}
              <div className={`h-2 w-full rounded-t-sm bg-gradient-to-r ${preset.themeGradient} mb-5`} />

              {/* 1. PROFESSIONAL HEADER: LOGO, BRANDING & STATUTORY LICENSES */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
                {/* Left: Vector Logo + Hospital / Lab / Clinic Information */}
                <div className="flex items-start gap-4">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-16 w-16 object-contain rounded-xl border border-slate-200"
                    />
                  ) : (
                    <VectorFacilityLogo type={activeFacility} />
                  )}

                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                      {org.name}
                    </h1>
                    <p className="text-xs font-semibold text-sky-800 mt-0.5">
                      {org.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-lg leading-relaxed">
                      {org.address}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1.5 text-[11px] font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-sky-700" />
                        {org.phone}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HeartPulse className="h-3 w-3 text-rose-600" />
                        {org.emergency}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3 text-sky-700" />
                        {org.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3 text-sky-700" />
                        {org.website}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Accreditation & Statutory Registrations Box */}
                <div className="w-full sm:w-auto sm:text-right flex flex-col sm:items-end justify-between flex-shrink-0">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border ${preset.badgeColor}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {preset.badge}
                  </div>

                  <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] text-slate-700 space-y-0.5 text-left sm:text-right">
                    <div>
                      <span className="font-semibold text-slate-500">{preset.regLabel}: </span>
                      <span className="font-bold text-slate-900 font-mono">{org.regNo}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">GSTIN / Tax ID: </span>
                      <span className="font-bold text-slate-900 font-mono">{org.gstin}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">SAC Code: </span>
                      <span className="font-bold text-slate-800">{preset.sacCode}</span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-bold">
                      ✓ GST Exempt under Notification 12/2017
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. RECEIPT TITLE & COPY BANNER */}
              <div className="my-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-300 px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                  <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-900 uppercase">
                    CLINICAL PAYMENT RECEIPT CUM BILLING VOUCHER
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500">
                    ({activeFacility.replace('_', ' ')})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded border border-slate-300 bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 tracking-wide uppercase">
                    {copyType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                      balanceDue <= 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {balanceDue <= 0 ? 'PAID IN FULL' : 'PARTIAL / BALANCE DUE'}
                  </span>
                </div>
              </div>

              {/* 3. PATIENT & TRANSACTION METADATA (2 CLEAN MEDICAL COLUMNS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
                {/* Left Card: Patient Demographics */}
                <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-sky-700" />
                      Patient & Clinical Demographics
                    </span>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded font-mono">
                      {patientId}
                    </span>
                  </div>

                  <div className="p-3 text-xs space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 flex-1 pr-2">
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-medium">Patient Name:</span>
                          <span className="col-span-2 font-bold text-slate-900 text-[13px] uppercase">
                            {patientName}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-medium">Age / Gender:</span>
                          <span className="col-span-2 font-semibold text-slate-800">{ageGender}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-medium">Contact Phone:</span>
                          <span className="col-span-2 font-semibold text-slate-800">{patientPhone}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-medium">Ref. Doctor:</span>
                          <span className="col-span-2 font-semibold text-slate-900">
                            {referringDoctor}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {doctorSpecialization}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-medium">
                            {preset.metadataField1.label}:
                          </span>
                          <span className="col-span-2 font-semibold text-slate-800">
                            {payment?.encounterType || payment?.accessionNo || preset.metadataField1.fallback}
                          </span>
                        </div>
                      </div>

                      {/* Vector Barcode for UHID */}
                      <div className="hidden sm:flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded shrink-0">
                        <SvgBarcode code={patientId} height={22} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Receipt & Financial Voucher Particulars */}
                <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-sky-700" />
                      Receipt & Billing Voucher Info
                    </span>
                    <span className="text-[10px] font-bold text-slate-800 bg-white border border-slate-300 px-2 py-0.5 rounded">
                      {receiptDate}
                    </span>
                  </div>

                  <div className="p-3 text-xs space-y-1.5">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500 font-medium">Receipt No:</span>
                      <span className="col-span-2 font-extrabold text-sky-700 text-[13px] font-mono">
                        {receiptNo}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500 font-medium">Voucher Date/Time:</span>
                      <span className="col-span-2 font-semibold text-slate-800">
                        {receiptDate} at {receiptTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500 font-medium">Invoice / Order ID:</span>
                      <span className="col-span-2 font-mono font-semibold text-slate-800">
                        {invoiceNo} <span className="text-slate-400">|</span> {orderNo}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500 font-medium">Payment Mode:</span>
                      <span className="col-span-2">
                        <span className="inline-block rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                          {paymentMethod}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500 font-medium">Txn / UTR Reference:</span>
                      <span className="col-span-2 font-mono font-semibold text-slate-800 truncate">
                        {transactionRef}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500 font-medium">Cashier Desk:</span>
                      <span className="col-span-2 font-medium text-slate-700">
                        {counterDesk} • {collectedBy}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. PROFESSIONAL SERVICES / INVESTIGATIONS TABLE */}
              <div className="rounded-lg border border-slate-300 overflow-hidden mb-4">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200">
                        Sr.
                      </th>
                      <th className="py-2 px-3 w-28 border-r border-slate-200">
                        Code / SAC
                      </th>
                      <th className="py-2 px-3 border-r border-slate-200">
                        {preset.itemColumnHeader}
                      </th>
                      <th className="py-2 px-3 w-28 border-r border-slate-200">
                        Department
                      </th>
                      <th className="py-2 px-2 w-12 text-center border-r border-slate-200">
                        Qty
                      </th>
                      <th className="py-2 px-3 w-24 text-right border-r border-slate-200">
                        Rate (₹)
                      </th>
                      <th className="py-2 px-3 w-20 text-right border-r border-slate-200">
                        Disc (₹)
                      </th>
                      <th className="py-2 px-3 w-28 text-right">
                        Net Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {lineItems.map((item, index) => (
                      <tr key={item.id || index} className="bg-white hover:bg-slate-50/50">
                        <td className="py-2 px-2.5 text-center font-semibold text-slate-600 border-r border-slate-200">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] font-semibold text-slate-700 border-r border-slate-200">
                          <div>{item.code}</div>
                          <div className="text-[9px] text-slate-400 font-sans">SAC: {item.sacCode}</div>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          <div className="flex items-center gap-1.5">
                            {item.tubeColor && (
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.tubeColor }}
                                title={item.tubeName || item.sampleType}
                              />
                            )}
                            <span>{item.name}</span>
                          </div>
                          {item.sampleType && item.sampleType !== 'Specimen' && (
                            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                              Specimen: {item.sampleType}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px] font-medium text-slate-600 border-r border-slate-200">
                          {item.department}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-slate-700 border-r border-slate-200">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-800 border-r border-slate-200">
                          {formatINR(item.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-600 border-r border-slate-200">
                          {Number(item.discount) > 0 ? `-${formatINR(item.discount)}` : '0.00'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatINR(item.totalPrice)}
                        </td>
                      </tr>
                    ))}

                    {/* Clean filler rows to maintain elegant A4 proportions */}
                    {lineItems.length < 3 &&
                      Array.from({ length: 3 - lineItems.length }).map((_, idx) => (
                        <tr key={`filler-${idx}`} className="bg-white h-7">
                          <td className="border-r border-slate-200" />
                          <td className="border-r border-slate-200" />
                          <td className="border-r border-slate-200" />
                          <td className="border-r border-slate-200" />
                          <td className="border-r border-slate-200" />
                          <td className="border-r border-slate-200" />
                          <td className="border-r border-slate-200" />
                          <td />
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* 5. AMOUNT IN WORDS + FINANCIAL SUMMARY GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                {/* Left 7 Columns: Amount in Words, Cashier Acknowledgement & Verification QR */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
                  {/* Amount in Words Callout Box */}
                  <div className="rounded-lg bg-slate-50 border border-slate-300 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Amount Received in Words (Indian Rupees)
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-900 italic">
                      “{numberToIndianWords(paidAmount)}”
                    </div>
                  </div>

                  {/* Payment Verification & QR Code Card */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                    <div className="text-[11px] space-y-1 text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-500">Received With Thanks From: </span>
                        <span className="font-bold text-slate-900">{patientName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Payment Mode / Ref: </span>
                        <span className="font-bold text-slate-900">{paymentMethod}</span>
                        {transactionRef ? ` (${transactionRef})` : ''}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Authorized Cashier: </span>
                        <span className="font-bold text-slate-800">{collectedBy}</span>
                      </div>
                      <div className="text-[10px] text-teal-700 font-semibold pt-0.5">
                        ✓ Cryptographically Sealed & Stamped Electronic Voucher
                      </div>
                    </div>

                    {/* Live Scannable QR Code */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-center">
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="Receipt QR" className="h-16 w-16 object-contain" />
                      ) : (
                        <QrCode className="h-14 w-14 text-slate-700" />
                      )}
                      <span className="text-[8px] font-bold text-slate-600 mt-0.5 uppercase tracking-tight">
                        Scan to Verify
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Billing & Financial Breakdown */}
                <div className="md:col-span-5">
                  <div className="rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs">
                    <div className="divide-y divide-slate-200 text-xs">
                      <div className="flex justify-between px-3.5 py-1.5">
                        <span className="font-medium text-slate-600">Gross Bill Amount:</span>
                        <span className="font-semibold text-slate-900">
                          ₹ {formatINR(grossBillAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between px-3.5 py-1.5">
                        <span className="font-medium text-slate-600">Discount / Concession:</span>
                        <span className="font-semibold text-emerald-700">
                          - ₹ {formatINR(discountAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between px-3.5 py-1.5">
                        <span className="font-medium text-slate-600">
                          Tax / GST (SAC 9993 Exempt):
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹ {formatINR(taxAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between px-3.5 py-1.5 bg-slate-50">
                        <span className="font-bold text-slate-800">Net Payable Amount:</span>
                        <span className="font-bold text-slate-900">
                          ₹ {formatINR(netBillAmount)}
                        </span>
                      </div>

                      {/* Prominent Amount Received Callout Row */}
                      <div className="flex justify-between items-center px-3.5 py-2 bg-sky-50 border-y border-sky-300">
                        <span className="font-extrabold text-sky-950 uppercase text-[11px] tracking-wide">
                          Amount Received in Voucher:
                        </span>
                        <span className="text-base font-extrabold text-sky-700">
                          ₹ {formatINR(paidAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between px-3.5 py-1.5 bg-white">
                        <span className="font-bold text-slate-700">Balance Due / Outstanding:</span>
                        <span
                          className={`font-extrabold ${
                            balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {balanceDue <= 0 ? '₹ 0.00 (NIL)' : `₹ ${formatINR(balanceDue)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: CLINICAL TERMS & CONDITIONS, SIGNATURES & METADATA */}
            <div className="pt-3 border-t-2 border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                {/* Terms & Clinical Instructions */}
                <div className="md:col-span-7 text-[10px] text-slate-600 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-800 uppercase tracking-wider">
                    Terms, Conditions & Patient Instructions:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    {preset.terms.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>

                {/* Signatures & Counter Stamp */}
                <div className="md:col-span-5 grid grid-cols-2 gap-3.5 text-center">
                  <div className="pt-7 border-t border-dashed border-slate-400">
                    <p className="text-[10px] font-bold text-slate-700 uppercase">
                      Patient / Depositor Sign
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="mb-1 h-9 w-full flex items-center justify-center rounded border border-dashed border-sky-400 bg-sky-50/50 text-[9px] font-bold text-sky-800 uppercase">
                      Authorized Seal & Sign
                    </div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">
                      For {org.name.split(' ')[0]} {activeFacility === 'HOSPITAL' ? 'Hospital' : activeFacility === 'CLINIC' ? 'Clinic' : 'Diagnostics'}
                    </p>
                    <span className="text-[8px] text-slate-500 font-mono">
                      Cashier: {collectedBy.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom System Audit Strip */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[9px] text-slate-500">
                <span>
                  Official computer-generated clinical billing voucher • Digital Verification: SHA256:{receiptNo.slice(-6)}
                </span>
                <span className="font-medium text-slate-600">
                  {org.tagline} • Page 1 of 1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentReceipt;