'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  PhoneCall,
  Mail,
  FileText,
  ShieldCheck,
  Activity,
  Users,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  BellRing,
  CheckCheck,
  UserCheck,
  Truck,
  Calendar,
  Settings,
  Radio,
  ArrowUpRight,
  Lock,
  Smartphone,
  Server,
  Zap,
  AlertOctagon,
  Download,
  CreditCard,
  Paperclip,
  Plus,
  Check,
  X,
  Volume2,
  MapPin,
  Hash,
  Eye,
  Stethoscope,
  Building2,
} from 'lucide-react';
import DoctorConsultationDesk from '@/components/communication/DoctorConsultationDesk';
import EmergencyBroadcastCenter from '@/components/communication/EmergencyBroadcastCenter';
import ShiftHandoverHuddle from '@/components/communication/ShiftHandoverHuddle';

// ============================================================================
// TYPES & INTERFACES (LABCORE ELIS CLINICAL COMMUNICATION ENGINE)
// ============================================================================

type ChannelType = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'VOICE_IVR';
type DeliveryStatus = 'DELIVERED' | 'READ' | 'IN_FLIGHT' | 'FAILED' | 'FALLBACK_SMS';
type HubTab = 'feed' | 'panic' | 'consultation' | 'inbox' | 'broadcast' | 'handover' | 'dispatch' | 'campaign' | 'gateway';

interface CommunicationLogItem {
  id: string;
  timestamp: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  recipientMobile: string;
  recipientRole: 'PATIENT' | 'DOCTOR';
  referringDoctor: string;
  orderNumber: string;
  testName: string;
  channel: ChannelType;
  category: 'REPORT_DISPATCH' | 'PANIC_ALERT' | 'SAMPLE_TRACKING' | 'INVOICE_LINK' | 'RECALL_CAMPAIGN';
  status: DeliveryStatus;
  statusDetail: string;
  messagePreview: string;
  fullMessage: string;
  sha256Hash?: string;
  pdfUrl?: string;
  phlebotomistName?: string;
  collectionOtp?: string;
  trackingUrl?: string;
  dltTemplateId?: string;
  timeline: {
    queuedAt: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    fallbackTriggeredAt?: string;
  };
}

interface PanicEscalationItem {
  id: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  patientMobile: string;
  orderNumber: string;
  referringDoctor: string;
  doctorMobile: string;
  department: string;
  parameterName: string;
  criticalValue: string;
  referenceRange: string;
  unit: string;
  detectedAt: string;
  elapsedMinutes: number;
  slaLimitMinutes: number;
  currentStep: 1 | 2 | 3;
  stepStatus: {
    whatsappSent: boolean;
    smsPrioritySent: boolean;
    ivrCallPlaced: boolean;
  };
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  readBackNote?: string;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'STAFF' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  attachment?: {
    type: 'PDF_REPORT' | 'GST_RECEIPT' | 'PAYMENT_LINK';
    title: string;
    code: string;
  };
}

interface InboxThread {
  id: string;
  contactName: string;
  contactRole: 'PATIENT' | 'DOCTOR';
  uhid: string;
  ageGender: string;
  mobile: string;
  channel: 'WHATSAPP' | 'SMS';
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: string;
  sentimentTag: 'URGENT' | 'REPORT_QUERY' | 'HOME_PICKUP' | 'DOCTOR_DESK';
  activeOrder: {
    orderId: string;
    tests: string[];
    status: string;
    fastingRequired: boolean;
    totalAmount: number;
    dueAmount: number;
    phlebotomist?: string;
  };
  messages: ChatMessage[];
}

interface ClinicalCampaign {
  id: string;
  title: string;
  clinicalCategory: string;
  frequencyRule: string;
  channelMix: ChannelType[];
  dltTemplateId: string;
  targetAudienceCount: number;
  deliveredCount: number;
  readRate: number;
  ctrPercentage: number;
  bookedAppointments: number;
  revenueGenerated: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'PAUSED';
  lastExecuted: string;
}

interface DltTemplateItem {
  id: string;
  templateName: string;
  dltTemplateId: string;
  senderHeader: string;
  channel: 'SMS_DLT' | 'WHATSAPP_META';
  category: 'TRANSACTIONAL' | 'SERVICE_IMPLICIT' | 'UTILITY';
  qualityRating: 'GREEN_HIGH' | 'VERIFIED' | 'PENDING';
  sampleContent: string;
}

// ============================================================================
// REALISTIC HOSPITAL & DIAGNOSTIC LAB MOCK DATA
// ============================================================================

const INITIAL_COMM_LOGS: CommunicationLogItem[] = [
  {
    id: 'MSG-2026-9841',
    timestamp: '2 मिनट पहले (11:30 PM)',
    uhid: 'LC-UHID-88412',
    patientName: 'राजेश कुमार वर्मा (Rajesh Kumar Verma)',
    ageGender: '54Y / Male',
    recipientMobile: '+91 98201 44510',
    recipientRole: 'PATIENT',
    referringDoctor: 'Dr. Ananya Sharma (MD, Cardiology)',
    orderNumber: 'ORD-2026-7741',
    testName: 'High-Sensitivity Troponin-I & Lipid Profile',
    channel: 'WHATSAPP',
    category: 'REPORT_DISPATCH',
    status: 'READ',
    statusDetail: 'Read by Patient • Tamper-Proof PDF Verified',
    messagePreview: 'नमस्ते राजेश जी, आपकी LabCore फाइनल डायग्नोस्टिक रिपोर्ट तैयार है और डॉक्टर द्वारा अप्रूव कर दी गई है...',
    fullMessage:
      'नमस्ते राजेश कुमार वर्मा जी (UHID: LC-UHID-88412), आपकी LabCore ELIS डायग्नोस्टिक रिपोर्ट (Order: ORD-2026-7741 - hs-Troponin-I & Lipid Profile) पैथोलॉजिस्ट द्वारा डिजिटल रूप से हस्ताक्षरित और सत्यापित कर दी गई है। सुरक्षित PDF डाउनलोड लिंक नीचे संलग्न है।',
    sha256Hash: '8f9d2a4b7c1e6f3a9d8b5c2e1f4a7d6c9b8e2a1f4d7c6b5a',
    pdfUrl: '/reports/order/ORD-2026-7741',
    dltTemplateId: '1107168945201948211',
    timeline: {
      queuedAt: '11:29:40 PM',
      sentAt: '11:29:42 PM',
      deliveredAt: '11:29:45 PM',
      readAt: '11:30:12 PM',
    },
  },
  {
    id: 'MSG-2026-9840',
    timestamp: '6 मिनट पहले (11:26 PM)',
    uhid: 'LC-UHID-88399',
    patientName: 'सुनीता देवी (Sunita Devi)',
    ageGender: '62Y / Female',
    recipientMobile: '+91 98114 77820',
    recipientRole: 'DOCTOR',
    referringDoctor: 'Dr. Vikramaditya Nair (Nephrology)',
    orderNumber: 'ORD-2026-7739',
    testName: 'Serum Electrolytes & Renal Function Panel (K+ Critical)',
    channel: 'VOICE_IVR',
    category: 'PANIC_ALERT',
    status: 'DELIVERED',
    statusDetail: 'Panic Value Escalation • Step 3 IVR Call Connected',
    messagePreview: '[CRITICAL NABL ALERT] UHID LC-UHID-88399 Serum Potassium (K+) = 6.8 mmol/L. Immediate clinical attention required.',
    fullMessage:
      'CRITICAL PANIC VALUE ALERT (NABL ISO-15189 PROTOCOL): Patient Sunita Devi (62Y/F, UHID: LC-UHID-88399) has a Critical Hyperkalemia result: Serum Potassium = 6.8 mmol/L (Ref: 3.5 - 5.1). Automated IVR Call & WhatsApp dispatched to Dr. Vikramaditya Nair.',
    dltTemplateId: '1107168945209911004',
    timeline: {
      queuedAt: '11:25:50 PM',
      sentAt: '11:25:52 PM',
      deliveredAt: '11:26:05 PM',
    },
  },
  {
    id: 'MSG-2026-9839',
    timestamp: '11 मिनट पहले (11:21 PM)',
    uhid: 'LC-UHID-88405',
    patientName: 'अमित सिंघानिया (Amit Singhania)',
    ageGender: '39Y / Male',
    recipientMobile: '+91 97172 33901',
    recipientRole: 'PATIENT',
    referringDoctor: 'Self / Preventive OPD',
    orderNumber: 'ORD-2026-7744',
    testName: 'HbA1c, Fasting Blood Sugar & Vitamin D3',
    channel: 'WHATSAPP',
    category: 'SAMPLE_TRACKING',
    status: 'DELIVERED',
    statusDetail: 'Phlebotomist Dispatched • Live GPS & OTP Active',
    messagePreview: 'होम सैंपल कलेक्शन अपडेट: हमारे फ्लेबोटोमिस्ट राहुल शर्मा आपके पते के लिए निकल चुके हैं। OTP: 4829',
    fullMessage:
      'नमस्ते अमित जी, आपके होम सैंपल कलेक्शन (Order: ORD-2026-7744) के लिए हमारे प्रमाणित फ्लेबोटोमिस्ट राहुल शर्मा (+91 99102 11455) निकल चुके हैं। सैंपल हैंडओवर सत्यापन के लिए आपका सुरक्षा OTP 4829 है। लाइव GPS ट्रैकिंग लिंक सक्रिय है।',
    phlebotomistName: 'राहुल शर्मा (Rahul Sharma - ID: PHL-104)',
    collectionOtp: '4829',
    trackingUrl: 'https://track.labcore.in/live/ORD-2026-7744',
    dltTemplateId: '1107168945207732190',
    timeline: {
      queuedAt: '11:20:45 PM',
      sentAt: '11:20:47 PM',
      deliveredAt: '11:20:51 PM',
    },
  },
  {
    id: 'MSG-2026-9838',
    timestamp: '18 मिनट पहले (11:14 PM)',
    uhid: 'LC-UHID-88370',
    patientName: 'मोहम्मद इरफ़ान (Mohd. Irfan)',
    ageGender: '47Y / Male',
    recipientMobile: '+91 94150 88219',
    recipientRole: 'PATIENT',
    referringDoctor: 'Dr. R. K. अग्रवाल (Internal Medicine)',
    orderNumber: 'ORD-2026-7728',
    testName: 'Complete Blood Count (CBC) & Dengue NS1 Antigen',
    channel: 'SMS',
    category: 'REPORT_DISPATCH',
    status: 'FALLBACK_SMS',
    statusDetail: 'Patient Unreachable on WhatsApp — Auto Fallback to DLT SMS Triggered',
    messagePreview: 'LabCore Report Ready: UHID LC-UHID-88370 CBC & Dengue NS1 report is verified. View PDF: https://labcore.in/r/7728',
    fullMessage:
      'LabCore Diagnostics: Dear Mohd. Irfan, your test report for Order ORD-2026-7728 (CBC & Dengue NS1) is ready. Download tamper-proof PDF: https://labcore.in/r/7728 - LABCOR',
    sha256Hash: '3c7e9b1a5d2f8e4c6a1b9d7e3f5a2c8b4d6e1f9a3c7b5d2e',
    pdfUrl: '/reports/order/ORD-2026-7728',
    dltTemplateId: '1107168945201122334',
    timeline: {
      queuedAt: '11:11:30 PM',
      sentAt: '11:11:35 PM',
      fallbackTriggeredAt: '11:13:35 PM (WhatsApp Timeout -> SMS Gateway)',
      deliveredAt: '11:13:41 PM',
    },
  },
  {
    id: 'MSG-2026-9837',
    timestamp: '27 मिनट पहले (11:05 PM)',
    uhid: 'LC-UHID-88351',
    patientName: 'प्रिया नायर (Priya Nair)',
    ageGender: '31Y / Female',
    recipientMobile: '+91 98450 11923',
    recipientRole: 'PATIENT',
    referringDoctor: 'Dr. Meera Krishnan (OB-GYN)',
    orderNumber: 'ORD-2026-7715',
    testName: 'Thyroid Profile Total (T3, T4, Ultra-TSH) & Ferritin',
    channel: 'EMAIL',
    category: 'INVOICE_LINK',
    status: 'FAILED',
    statusDetail: 'SMTP Mailbox Quota Full • Ready for Instant Retry via WhatsApp/SMS',
    messagePreview: 'GST Tax Invoice & Report Copy for Order ORD-2026-7715 (Amount Paid: ₹1,850)...',
    fullMessage:
      'Dear Priya Nair, thank you for visiting LabCore Diagnostics. Please find attached your GST Tax Invoice (INV-2026-4410) and diagnostic test summary for Order ORD-2026-7715.',
    sha256Hash: '9a1c4e7b2d8f3a6c5e9b1d4f7a2c8e5b3d9f1a4c7e2b8d5f',
    pdfUrl: '/invoices/INV-2026-4410',
    timeline: {
      queuedAt: '11:04:50 PM',
      sentAt: '11:04:55 PM',
    },
  },
];

const INITIAL_PANIC_LIST: PanicEscalationItem[] = [
  {
    id: 'PANIC-2026-101',
    uhid: 'LC-UHID-88399',
    patientName: 'सुनीता देवी (Sunita Devi)',
    ageGender: '62Y / Female',
    patientMobile: '+91 98114 77820',
    orderNumber: 'ORD-2026-7739',
    referringDoctor: 'Dr. Vikramaditya Nair',
    doctorMobile: '+91 98209 33100',
    department: 'Biochemistry / Stat Nephrology',
    parameterName: 'Serum Potassium (K+)',
    criticalValue: '6.8',
    referenceRange: '3.5 – 5.1',
    unit: 'mmol/L',
    detectedAt: '11:14 PM (आज)',
    elapsedMinutes: 18,
    slaLimitMinutes: 15,
    currentStep: 3,
    stepStatus: {
      whatsappSent: true,
      smsPrioritySent: true,
      ivrCallPlaced: true,
    },
    acknowledged: false,
  },
  {
    id: 'PANIC-2026-102',
    uhid: 'LC-UHID-88409',
    patientName: 'देवेन्द्र प्रताप सिंह (Devendra Pratap Singh)',
    ageGender: '58Y / Male',
    patientMobile: '+91 99100 54122',
    orderNumber: 'ORD-2026-7742',
    referringDoctor: 'Dr. Ananya Sharma',
    doctorMobile: '+91 98111 22094',
    department: 'Immunoassay / Cardiac ICU',
    parameterName: 'High-Sensitivity Troponin-I',
    criticalValue: '2.45',
    referenceRange: '< 0.04',
    unit: 'ng/mL',
    detectedAt: '11:23 PM (आज)',
    elapsedMinutes: 9,
    slaLimitMinutes: 15,
    currentStep: 2,
    stepStatus: {
      whatsappSent: true,
      smsPrioritySent: true,
      ivrCallPlaced: false,
    },
    acknowledged: false,
  },
  {
    id: 'PANIC-2026-103',
    uhid: 'LC-UHID-88362',
    patientName: 'आर्यन गुप्ता (Aryan Gupta)',
    ageGender: '24Y / Male',
    patientMobile: '+91 98731 66019',
    orderNumber: 'ORD-2026-7721',
    referringDoctor: 'Dr. R. K. अग्रवाल',
    doctorMobile: '+91 94152 00911',
    department: 'Hematology / Emergency Triage',
    parameterName: 'Platelet Count (Automated + Smear Confirmed)',
    criticalValue: '16,000',
    referenceRange: '1,50,000 – 4,10,000',
    unit: '/µL',
    detectedAt: '10:42 PM (आज)',
    elapsedMinutes: 7,
    slaLimitMinutes: 15,
    currentStep: 3,
    stepStatus: {
      whatsappSent: true,
      smsPrioritySent: true,
      ivrCallPlaced: true,
    },
    acknowledged: true,
    acknowledgedBy: 'Dr. R. K. अग्रवाल (Reg: MCI-44912)',
    acknowledgedAt: '10:49 PM (7 मिनट के भीतर SLA पूर्ण)',
    readBackNote:
      'डॉ. आर. के. अग्रवाल ने टेलीफोनिक रीड-बैक की पुष्टि की: Platelet Count 16,000 /µL नोट किया गया। पेशेंट को आपातकालीन वार्ड में भर्ती करने का निर्देश दिया गया।',
  },
];

const INITIAL_INBOX_THREADS: InboxThread[] = [
  {
    id: 'THR-101',
    contactName: 'राजेश कुमार वर्मा (Rajesh Kumar Verma)',
    contactRole: 'PATIENT',
    uhid: 'LC-UHID-88412',
    ageGender: '54Y / Male',
    mobile: '+91 98201 44510',
    channel: 'WHATSAPP',
    unreadCount: 2,
    lastMessage: 'सर, मेरी Lipid Profile और Troponin रिपोर्ट कब तक मिलेगी? डॉक्टर को दिखाना है।',
    lastTimestamp: '11:28 PM',
    sentimentTag: 'REPORT_QUERY',
    activeOrder: {
      orderId: 'ORD-2026-7741',
      tests: ['hs-Troponin-I', 'Complete Lipid Profile', 'ECG Screening'],
      status: 'APPROVED & READY',
      fastingRequired: true,
      totalAmount: 2450,
      dueAmount: 450,
    },
    messages: [
      {
        id: 'm1',
        sender: 'SYSTEM',
        senderName: 'LabCore Auto-Bot',
        text: 'नमस्ते राजेश जी, आपका सैंपल (Barcode: SMP-88412) लैब एनालाइज़र पर प्रोसेस हो रहा है।',
        timestamp: '09:45 PM',
        status: 'READ',
      },
      {
        id: 'm2',
        sender: 'USER',
        senderName: 'राजेश कुमार वर्मा',
        text: 'सर, मेरी Lipid Profile और Troponin रिपोर्ट कब तक मिलेगी? डॉक्टर को दिखाना है।',
        timestamp: '11:28 PM',
      },
      {
        id: 'm3',
        sender: 'STAFF',
        senderName: 'Clinical Desk (Priyanka)',
        text: 'नमस्ते राजेश जी! आपकी रिपोर्ट पैथोलॉजिस्ट द्वारा अप्रूव कर दी गई है। मैंने नीचे सुरक्षित PDF रिपोर्ट लिंक साझा कर दिया है।',
        timestamp: '11:30 PM',
        status: 'READ',
        attachment: {
          type: 'PDF_REPORT',
          title: 'Final_Diagnostic_Report_ORD-2026-7741.pdf',
          code: 'SHA-256 Verified',
        },
      },
    ],
  },
  {
    id: 'THR-102',
    contactName: 'अमित सिंघानिया (Amit Singhania)',
    contactRole: 'PATIENT',
    uhid: 'LC-UHID-88405',
    ageGender: '39Y / Male',
    mobile: '+91 97172 33901',
    channel: 'WHATSAPP',
    unreadCount: 1,
    lastMessage: 'Home sample pickup कितने बजे तक पहुंचेगा? मैं फास्टिंग पर हूँ।',
    lastTimestamp: '11:19 PM',
    sentimentTag: 'HOME_PICKUP',
    activeOrder: {
      orderId: 'ORD-2026-7744',
      tests: ['HbA1c (Glycosylated Hb)', 'Fasting Blood Glucose', '25-OH Vitamin D3'],
      status: 'PHLEBOTOMIST EN-ROUTE',
      fastingRequired: true,
      totalAmount: 1699,
      dueAmount: 0,
      phlebotomist: 'राहुल शर्मा (ID: PHL-104)',
    },
    messages: [
      {
        id: 'm201',
        sender: 'USER',
        senderName: 'अमित सिंघानिया',
        text: 'Home sample pickup कितने बजे तक पहुंचेगा? मैं फास्टिंग पर हूँ।',
        timestamp: '11:19 PM',
      },
      {
        id: 'm202',
        sender: 'STAFF',
        senderName: 'Dispatch Desk',
        text: 'अमित जी, हमारे फ्लेबोटोमिस्ट राहुल शर्मा आपके लोकेशन से मात्र 8 मिनट की दूरी पर हैं। आपका कलेक्शन OTP 4829 है।',
        timestamp: '11:21 PM',
        status: 'DELIVERED',
      },
    ],
  },
  {
    id: 'THR-103',
    contactName: 'Dr. Ananya Sharma (MD, Cardiology)',
    contactRole: 'DOCTOR',
    uhid: 'DOC-REF-402',
    ageGender: 'Senior Consultant',
    mobile: '+91 98111 22094',
    channel: 'WHATSAPP',
    unreadCount: 0,
    lastMessage: 'Please send the delta trend graph for Patient Devendra Pratap Singh (ORD-2026-7742).',
    lastTimestamp: '11:25 PM',
    sentimentTag: 'DOCTOR_DESK',
    activeOrder: {
      orderId: 'ORD-2026-7742',
      tests: ['hs-Troponin-I (STAT)', 'NT-proBNP', 'D-Dimer'],
      status: 'CRITICAL ESCALATION',
      fastingRequired: false,
      totalAmount: 3800,
      dueAmount: 0,
    },
    messages: [
      {
        id: 'm301',
        sender: 'USER',
        senderName: 'Dr. Ananya Sharma',
        text: 'Please send the delta trend graph for Patient Devendra Pratap Singh (ORD-2026-7742).',
        timestamp: '11:25 PM',
      },
      {
        id: 'm302',
        sender: 'STAFF',
        senderName: 'Chief Pathologist Desk',
        text: 'Good evening Dr. Sharma, hs-Troponin-I is 2.45 ng/mL (previous baseline 0.18 ng/mL 6 hrs ago). Sending verified PDF chart immediately.',
        timestamp: '11:26 PM',
        status: 'READ',
      },
    ],
  },
];

const INITIAL_CAMPAIGNS: ClinicalCampaign[] = [
  {
    id: 'CMP-2026-01',
    title: 'Diabetic HbA1c 90-Day Periodic Screening Reminder',
    clinicalCategory: 'Diabetology & Endocrinology Follow-up',
    frequencyRule: 'अंतिम HbA1c टेस्ट के 90 दिन पूर्ण होने पर ऑटो-ट्रिगर',
    channelMix: ['WHATSAPP', 'SMS'],
    dltTemplateId: '1107168945208812301',
    targetAudienceCount: 1420,
    deliveredCount: 1398,
    readRate: 89.4,
    ctrPercentage: 26.8,
    bookedAppointments: 312,
    revenueGenerated: 249600,
    status: 'ACTIVE',
    lastExecuted: 'आज, सुबह 08:00 AM',
  },
  {
    id: 'CMP-2026-02',
    title: 'Thyroid Profile Follow-Up (6-Month Clinical Re-check)',
    clinicalCategory: 'Preventive Endocrinology',
    frequencyRule: 'असामान्य TSH वाले मरीजों को 180 दिन बाद रिमाइंडर',
    channelMix: ['WHATSAPP', 'EMAIL'],
    dltTemplateId: '1107168945208812309',
    targetAudienceCount: 860,
    deliveredCount: 845,
    readRate: 84.2,
    ctrPercentage: 21.5,
    bookedAppointments: 164,
    revenueGenerated: 147600,
    status: 'ACTIVE',
    lastExecuted: 'कल, सुबह 09:30 AM',
  },
  {
    id: 'CMP-2026-03',
    title: 'Comprehensive Executive Full Body Checkup & Doctor Referral Coupon',
    clinicalCategory: 'Annual Wellness & Preventive Care',
    frequencyRule: 'वार्षिक स्वास्थ्य जांच + 20% विशेष पारिवारिक छूट कूपन',
    channelMix: ['WHATSAPP', 'SMS', 'EMAIL'],
    dltTemplateId: '1107168945208812415',
    targetAudienceCount: 3250,
    deliveredCount: 3190,
    readRate: 78.6,
    ctrPercentage: 18.2,
    bookedAppointments: 428,
    revenueGenerated: 1069572,
    status: 'ACTIVE',
    lastExecuted: '20 अक्टूबर 2026',
  },
  {
    id: 'CMP-2026-04',
    title: 'Post-Consultation Fasting & Pre-Analytical Sample Advisory',
    clinicalCategory: 'Pre-Analytical Quality Assurance (NABL)',
    frequencyRule: 'होम कलेक्शन से 10 घंटे पूर्व रात्रि 10:00 बजे फास्टिंग अलर्ट',
    channelMix: ['WHATSAPP', 'SMS'],
    dltTemplateId: '1107168945208812599',
    targetAudienceCount: 640,
    deliveredCount: 638,
    readRate: 96.1,
    ctrPercentage: 42.0,
    bookedAppointments: 615,
    revenueGenerated: 0,
    status: 'ACTIVE',
    lastExecuted: 'प्रतिदिन रात्रि 10:00 PM',
  },
];

const DLT_TEMPLATES_REGISTRY: DltTemplateItem[] = [
  {
    id: 'TPL-01',
    templateName: 'LabCore Final PDF Report Dispatch (Tamper-Proof)',
    dltTemplateId: '1107168945201948211',
    senderHeader: 'LABCOR',
    channel: 'WHATSAPP_META',
    category: 'UTILITY',
    qualityRating: 'GREEN_HIGH',
    sampleContent:
      'नमस्ते {{1}}, आपकी LabCore फाइनल रिपोर्ट (Order: {{2}}) तैयार है। सुरक्षित PDF लिंक: {{3}} (SHA-256 Verified) - LABCOR',
  },
  {
    id: 'TPL-02',
    templateName: 'Critical / Panic Value Escalation Alert (NABL / CAP)',
    dltTemplateId: '1107168945209911004',
    senderHeader: 'LABCOR',
    channel: 'SMS_DLT',
    category: 'TRANSACTIONAL',
    qualityRating: 'VERIFIED',
    sampleContent:
      'URGENT PANIC ALERT: Patient {#var#} (UHID {#var#}) has Critical {#var#} = {#var#}. Please acknowledge immediately: {#var#} - LABCOR',
  },
  {
    id: 'TPL-03',
    templateName: 'Home Phlebotomist Live Tracking & OTP Verification',
    dltTemplateId: '1107168945207732190',
    senderHeader: 'LABCOR',
    channel: 'WHATSAPP_META',
    category: 'UTILITY',
    qualityRating: 'GREEN_HIGH',
    sampleContent:
      'होम सैंपल कलेक्शन: फ्लेबोटोमिस्ट {{1}} आपके पते पर पहुंच रहे हैं। सत्यापन OTP: {{2}}। लाइव ट्रैक करें: {{3}} - LABCOR',
  },
  {
    id: 'TPL-04',
    templateName: 'Chronic Care HbA1c 90-Day Preventive Recall',
    dltTemplateId: '1107168945208812301',
    senderHeader: 'DRNIKL',
    channel: 'WHATSAPP_META',
    category: 'SERVICE_IMPLICIT',
    qualityRating: 'GREEN_HIGH',
    sampleContent:
      'नमस्ते {{1}}, आपके पिछले HbA1c टेस्ट को 90 दिन पूरे हो गए हैं। बेहतर डायबिटीज़ नियंत्रण के लिए आज ही स्लॉट बुक करें: {{2}} - DRNIKL',
  },
];

const QUICK_MEDICAL_REPLIES = [
  'नमस्ते! आपकी फाइनल लैब रिपोर्ट तैयार है और सुरक्षित PDF लिंक भेज दिया गया है।',
  'हमारे प्रमाणित फ्लेबोटोमिस्ट आपके पते के लिए निकल चुके हैं और 10 मिनट में पहुंचेंगे।',
  'कृपया लिपिड प्रोफाइल और फास्टिंग शुगर सैंपल के लिए 10-12 घंटे का उपवास (सिर्फ सादा पानी) रखें।',
  'डॉक्टर के परामर्श हेतु क्रिटिकल वैल्यू को पैथोलॉजिस्ट द्वारा पुनः सत्यापित (Double-Checked) किया गया है।',
];

// ============================================================================
// INNER COMPONENT (HANDLES URL SEARCH PARAMS & STATE)
// ============================================================================

function ClinicalCommunicationHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Sync active tab with URL query param (?tab=inbox | panic | dispatch | campaign | gateway)
  const tabParam = searchParams.get('tab') as HubTab | null;
  const [activeTab, setActiveTab] = useState<HubTab>(tabParam || 'feed');

  useEffect(() => {
    if (
      tabParam &&
      [
        'feed',
        'panic',
        'consultation',
        'inbox',
        'broadcast',
        'handover',
        'dispatch',
        'campaign',
        'gateway',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('feed');
    }
  }, [tabParam]);

  const handleTabChange = (newTab: HubTab) => {
    setActiveTab(newTab);
    if (newTab === 'feed') {
      router.push('/communication', { scroll: false });
    } else {
      router.push(`/communication?tab=${newTab}`, { scroll: false });
    }
  };

  // Interactive States
  const [logs, setLogs] = useState<CommunicationLogItem[]>(INITIAL_COMM_LOGS);
  const [panicList, setPanicList] = useState<PanicEscalationItem[]>(INITIAL_PANIC_LIST);
  const [threads, setThreads] = useState<InboxThread[]>(INITIAL_INBOX_THREADS);
  const [campaigns, setCampaigns] = useState<ClinicalCampaign[]>(INITIAL_CAMPAIGNS);

  // Filters & Search
  const [channelFilter, setChannelFilter] = useState<'ALL' | ChannelType | 'CRITICAL_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>('MSG-2026-9841');

  // Inbox States
  const [selectedThreadId, setSelectedThreadId] = useState<string>('THR-101');
  const [chatInput, setChatInput] = useState('');

  // Panic Read-back Modal State
  const [activePanicModal, setActivePanicModal] = useState<PanicEscalationItem | null>(null);
  const [doctorAckName, setDoctorAckName] = useState('');
  const [readBackNoteInput, setReadBackNoteInput] = useState('');

  // Failover Simulation / Toast Banner
  const [toastBanner, setToastBanner] = useState<{
    message: string;
    type: 'teal' | 'emerald' | 'crimson' | 'amber';
  } | null>(null);

  const showToast = (message: string, type: 'teal' | 'emerald' | 'crimson' | 'amber' = 'teal') => {
    setToastBanner({ message, type });
    setTimeout(() => {
      setToastBanner(null);
    }, 4500);
  };

  // Filtered Omnichannel Feed
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (activeTab === 'dispatch' && item.category !== 'REPORT_DISPATCH' && item.category !== 'SAMPLE_TRACKING') {
        return false;
      }
      if (channelFilter === 'CRITICAL_ONLY' && item.category !== 'PANIC_ALERT') {
        return false;
      }
      if (channelFilter !== 'ALL' && channelFilter !== 'CRITICAL_ONLY' && item.channel !== channelFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          item.patientName.toLowerCase().includes(q) ||
          item.uhid.toLowerCase().includes(q) ||
          item.referringDoctor.toLowerCase().includes(q) ||
          item.recipientMobile.toLowerCase().includes(q) ||
          item.testName.toLowerCase().includes(q) ||
          item.orderNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, channelFilter, searchQuery, activeTab]);

  // Selected Inbox Thread
  const activeThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) || threads[0],
    [threads, selectedThreadId]
  );

  // Actions
  const handleRetryDispatch = (id: string) => {
    setLogs((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'DELIVERED',
              channel: 'WHATSAPP',
              statusDetail: 'Auto-Failover Retry Successful via WhatsApp Cloud API',
              timeline: {
                ...item.timeline,
                deliveredAt: 'अभी (Just Now)',
              },
            }
          : item
      )
    );
    showToast(`संदेश ${id} को मल्टी-चैनल फेलओवर के माध्यम से सफलतापूर्वक पुनः भेजा गया!`, 'emerald');
  };

  const handleLaunchWhatsAppWeb = (mobile: string, text: string) => {
    const cleanPhone = mobile.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`WhatsApp Web कंसोल (+${cleanPhone}) नया टैब में खोला गया।`, 'teal');
  };

  const handleSendChatMessage = (customText?: string) => {
    const textToSend = (customText ?? chatInput).trim();
    if (!textToSend || !activeThread) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'STAFF',
      senderName: 'Clinical Desk (You)',
      text: textToSend,
      timestamp: 'अभी (Just Now)',
      status: 'DELIVERED',
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              unreadCount: 0,
              lastMessage: textToSend,
              lastTimestamp: 'अभी',
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
    if (!customText) setChatInput('');
    showToast(`${activeThread.contactName} को आधिकारिक WhatsApp संदेश भेजा गया।`, 'emerald');
  };

  const handleRecordPanicAck = () => {
    if (!activePanicModal) return;
    const docName = doctorAckName.trim() || activePanicModal.referringDoctor;
    const note =
      readBackNoteInput.trim() ||
      `${docName} द्वारा क्रिटिकल वैल्यू (${activePanicModal.parameterName}: ${activePanicModal.criticalValue} ${activePanicModal.unit}) की टेलीफोनिक रीड-बैक पुष्टि की गई।`;

    setPanicList((prev) =>
      prev.map((p) =>
        p.id === activePanicModal.id
          ? {
              ...p,
              acknowledged: true,
              acknowledgedBy: docName,
              acknowledgedAt: 'अभी (NABL ऑडिट लॉग में लॉक किया गया)',
              readBackNote: note,
            }
          : p
      )
    );
    setActivePanicModal(null);
    setDoctorAckName('');
    setReadBackNoteInput('');
    showToast('NABL / CAP पैनिक रीड-बैक एक्नॉलेजमेंट सफलतापूर्वक लॉक कर दिया गया!', 'emerald');
  };

  const handleTriggerIvrEscalation = (panicItem: PanicEscalationItem) => {
    setPanicList((prev) =>
      prev.map((p) =>
        p.id === panicItem.id
          ? {
              ...p,
              currentStep: 3,
              stepStatus: { whatsappSent: true, smsPrioritySent: true, ivrCallPlaced: true },
            }
          : p
      )
    );
    showToast(
      `डॉ. ${panicItem.referringDoctor} (${panicItem.doctorMobile}) को ऑटोमेटेड Exotel IVR वॉयस कॉल और प्रायोरिटी SMS ट्रिगर किया गया!`,
      'crimson'
    );
  };

  // Helper UI Renderers
  const renderStatusChip = (status: DeliveryStatus) => {
    switch (status) {
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
            Read Receipt Verified
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
            Delivered OK
          </span>
        );
      case 'FALLBACK_SMS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <RefreshCw className="h-3 w-3 text-amber-600" />
            Patient Unreachable - Auto Fallback to SMS Triggered
          </span>
        );
      case 'IN_FLIGHT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
            <Clock className="h-3 w-3 animate-spin text-sky-600" />
            In-Flight Queue
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            Delivery Failed • Retry Ready
          </span>
        );
    }
  };

  const renderChannelBadge = (channel: ChannelType) => {
    switch (channel) {
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <MessageSquare className="h-3 w-3 text-emerald-600" />
            WhatsApp Cloud
          </span>
        );
      case 'SMS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
            <Smartphone className="h-3 w-3 text-sky-600" />
            TRAI DLT SMS
          </span>
        );
      case 'VOICE_IVR':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
            <PhoneCall className="h-3 w-3 text-rose-600 animate-pulse" />
            Panic Voice IVR
          </span>
        );
      case 'EMAIL':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
            <Mail className="h-3 w-3 text-slate-600" />
            Clinical SMTP
          </span>
        );
    }
  };

  const unacknowledgedPanicCount = panicList.filter((p) => !p.acknowledged).length;
  const totalUnreadInbox = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-14">
      {/* FLOATING TOAST NOTIFICATION */}
      {toastBanner && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              toastBanner.type === 'emerald'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : toastBanner.type === 'crimson'
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-teal-50 text-[#0F766E] border border-teal-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">{toastBanner.message}</p>
            <p className="text-[11px] text-slate-500">LabCore ELIS Omnichannel Engine • NABL Audit Synced</p>
          </div>
          <button
            onClick={() => setToastBanner(null)}
            className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          TOP CLINICAL COMMAND HEADER (STERILE ULTRA-LIGHT WHITE)
      ===================================================================== */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-[1600px] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-[#0F766E] shadow-sm">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  Omnichannel Clinical Communication Command Hub
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  LIVE GATEWAY ACTIVE
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0F766E]" />
                  NABL ISO-15189 & DPDP 2023 Compliant
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Unified 2-Way Patient & Doctor Inbox • Automated Critical Panic Value Escalation • SHA-256 PDF Report Dispatch • TRAI DLT & Meta Cloud API
              </p>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleTabChange('panic')}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm"
            >
              <AlertOctagon className="h-4 w-4 text-rose-600 animate-bounce" />
              Critical Panic Desk ({unacknowledgedPanicCount} Pending)
            </button>

            <button
              onClick={() => handleTabChange('inbox')}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3.5 py-2 text-xs font-bold text-[#0284C7] border border-sky-200 hover:bg-sky-100 transition-colors shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              2-Way Patient Inbox ({totalUnreadInbox} New)
            </button>

            <button
              onClick={() => {
                showToast('सभी पेंडिंग अप्रूव्ड रिपोर्ट्स के लिए ऑटो-डिस्पैच क्यू सिंक किया गया!', 'teal');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D9488] transition-colors shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Instant Report Dispatch
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN CONTAINER
      ===================================================================== */}
      <div className="mx-auto max-w-[1600px] px-6 pt-6 space-y-6">
        {/* 1. TOP METRIC TELEMETRY CARDS (6 ULTRA-CLEAN HOSPITAL CARDS) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Card 1: Total Dispatches */}
          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Dispatches</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] border border-teal-100">
                <Send className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">1,48,920</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                +1,284 Today
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">Auto-triggered via LIS Approval Hook</p>
          </div>

          {/* Card 2: Delivery SLA Rate */}
          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery SLA Rate</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-emerald-700">98.7%</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                &lt; 4.2s Latency
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">Multi-channel failover cascade active</p>
          </div>

          {/* Card 3: WhatsApp Read Receipts */}
          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp Read Rate</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">91.4%</span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                34.2% Re-book CTR
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">Official Meta Cloud Green Tick API</p>
          </div>

          {/* Card 4: Critical Panic Value Escalations */}
          <div
            onClick={() => handleTabChange('panic')}
            className="cursor-pointer rounded-2xl bg-rose-50/50 p-4 border border-rose-200 shadow-sm hover:bg-rose-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical Panic SLA</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
                <BellRing className="h-4 w-4 animate-pulse" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-rose-700">
                {unacknowledgedPanicCount} Urgent
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                15m NABL Rule
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-rose-600">
              14/16 Acknowledged &lt;15m • Click to Escalate
            </p>
          </div>

          {/* Card 5: SMS DLT Delivery Health */}
          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TRAI DLT SMS Health</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#0284C7] border border-sky-100">
                <Smartphone className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">LABCOR</span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0284C7] border border-sky-200">
                18 Templates OK
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">Entity ID: 110154892000142 • 99.2% Up</p>
          </div>

          {/* Card 6: Gateway Health Cascade */}
          <div
            onClick={() => handleTabChange('gateway')}
            className="cursor-pointer rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm hover:border-teal-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gateway Cascade</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Server className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Meta API: OK
              </span>
              <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                Twilio: OK
              </span>
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                Exotel IVR: OK
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500">WA (2m) → SMS → IVR Call Failover</p>
          </div>
        </div>

        {/* =====================================================================
            UNIFIED NAVIGATION TABS BAR
        ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-2 border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleTabChange('feed')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'feed'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Radio className="h-4 w-4" />
              📡 Live Omnichannel Feed
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'feed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {logs.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('panic')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'panic'
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              🚨 Critical / Panic Escalations
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'panic' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                }`}
              >
                {unacknowledgedPanicCount} Urgent
              </span>
            </button>

            <button
              onClick={() => handleTabChange('consultation')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'consultation'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-4 w-4 text-[#0284C7]" />
              🩺 Doctor Consultation Desk
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'consultation' ? 'bg-white text-[#0F766E]' : 'bg-purple-100 text-purple-700'
                }`}
              >
                STAT
              </span>
            </button>

            <button
              onClick={() => handleTabChange('inbox')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'inbox'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              💬 2-Way Patient Inbox
              {totalUnreadInbox > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    activeTab === 'inbox' ? 'bg-white text-[#0F766E]' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {totalUnreadInbox} New
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('broadcast')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'broadcast'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="h-4 w-4 text-rose-500" />
              📢 Emergency Paging
            </button>

            <button
              onClick={() => handleTabChange('handover')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'handover'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              🤝 Shift Huddle
            </button>

            <button
              onClick={() => handleTabChange('dispatch')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'dispatch'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              📄 Report & Sample Dispatch
            </button>

            <button
              onClick={() => handleTabChange('campaign')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'campaign'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              🎯 Preventive Re-call Campaigns
            </button>

            <button
              onClick={() => handleTabChange('gateway')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'gateway'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="h-4 w-4" />
              ⚙️ Telecom DLT & Gateway
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-2 pr-2 text-xs font-medium text-slate-500">
            <Lock className="h-3.5 w-3.5 text-[#0F766E]" />
            <span>End-to-End SHA-256 Report Integrity Active</span>
          </div>
        </div>

        {/* =====================================================================
            TAB 1 & DISPATCH TAB: LIVE OMNICHANNEL FEED & DISPATCH LOGS
        ===================================================================== */}
        {(activeTab === 'feed' || activeTab === 'dispatch') && (
          <div className="space-y-4">
            {/* Search & Quick Channel Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              {/* Channel Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  Channel:
                </span>
                {(
                  [
                    { key: 'ALL', label: 'All Channels' },
                    { key: 'WHATSAPP', label: 'WhatsApp Official' },
                    { key: 'SMS', label: 'TRAI DLT SMS' },
                    { key: 'EMAIL', label: 'Clinical Email' },
                    { key: 'VOICE_IVR', label: 'Panic Voice IVR' },
                    { key: 'CRITICAL_ONLY', label: '🚨 Critical Panic Only' },
                  ] as const
                ).map((ch) => (
                  <button
                    key={ch.key}
                    onClick={() => setChannelFilter(ch.key)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all border ${
                      channelFilter === ch.key
                        ? ch.key === 'CRITICAL_ONLY'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-[#0F766E] text-white border-[#0F766E]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {/* Real-time Search Box */}
              <div className="relative w-full lg:w-96">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search UHID, Patient, Doctor, Mobile, Test..."
                  className="w-full rounded-xl bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 border border-slate-200 focus:bg-white focus:border-[#0F766E] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Phlebotomist / Home Collection Live Dispatch Banner (When on Dispatch Tab) */}
            {activeTab === 'dispatch' && (
              <div className="rounded-2xl bg-teal-50/70 p-4 border border-teal-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F766E] border border-teal-200 shadow-sm">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Phlebotomist Home Collection Live Dispatch & Tamper-Proof PDF Engine
                    </h3>
                    <p className="text-xs font-medium text-slate-600">
                      प्रत्येक होम सैंपल कलेक्शन पर पेशेंट को लाइव GPS ट्रैकिंग लिंक और 4-अंकीय सुरक्षा OTP स्वचालित रूप से WhatsApp व SMS पर भेजा जाता है।
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0F766E] border border-teal-200">
                  <MapPin className="h-3.5 w-3.5" />4 Active Home Pickups En-Route
                </span>
              </div>
            )}

            {/* Feed Cards List */}
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className={`rounded-2xl bg-white border transition-all shadow-sm ${
                      log.category === 'PANIC_ALERT'
                        ? 'border-rose-200 bg-rose-50/10'
                        : log.status === 'FAILED'
                        ? 'border-amber-200'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Main Summary Row */}
                    <div className="p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{log.patientName}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                            {log.uhid}
                          </span>
                          <span className="text-xs font-medium text-slate-500">({log.ageGender})</span>
                          {renderChannelBadge(log.channel)}
                          {renderStatusChip(log.status)}
                          <span className="text-[11px] font-medium text-slate-400 ml-auto lg:ml-2">{log.timestamp}</span>
                        </div>

                        <p className="text-xs font-medium text-slate-700 line-clamp-1">{log.messagePreview}</p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3 text-slate-400" />
                            Order: <strong className="text-slate-700">{log.orderNumber}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3 w-3 text-slate-400" />
                            Test: <strong className="text-slate-700">{log.testName}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-slate-400" />
                            Doctor: <strong className="text-slate-700">{log.referringDoctor}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="h-3 w-3 text-slate-400" />
                            Mobile: <strong className="text-slate-700">{log.recipientMobile}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryDispatch(log.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            1-Click Retry (Failover)
                          </button>
                        )}

                        <button
                          onClick={() => handleLaunchWhatsAppWeb(log.recipientMobile, log.fullMessage)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          WhatsApp Web
                        </button>

                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              Hide Details <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              Inspect Audit <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Clinical Audit & Delivery Timeline Drawer */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 rounded-b-2xl space-y-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                          {/* Column 1: Full Message Payload */}
                          <div className="lg:col-span-2 rounded-xl bg-white p-4 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                Dispatched Clinical Payload
                              </span>
                              {log.dltTemplateId && (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  TRAI DLT ID: {log.dltTemplateId}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-800 leading-relaxed">{log.fullMessage}</p>

                            {/* SHA-256 Integrity & PDF Download */}
                            {log.sha256Hash && (
                              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#0F766E]" />
                                  <span className="text-[11px] font-bold text-slate-700">
                                    SHA-256 Tamper-Proof Hash:
                                  </span>
                                  <code className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                                    {log.sha256Hash.slice(0, 28)}...
                                  </code>
                                </div>
                                <a
                                  href={log.pdfUrl || '#'}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-[#0F766E] border border-teal-200 hover:bg-teal-100"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download Verified PDF Report
                                </a>
                              </div>
                            )}

                            {/* Phlebotomist Live Tracking Details */}
                            {log.phlebotomistName && (
                              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <Truck className="h-4 w-4 text-[#0284C7]" />
                                  <span>Phlebotomist: {log.phlebotomistName}</span>
                                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                                    Collection OTP: {log.collectionOtp}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-[#0284C7]">{log.trackingUrl}</span>
                              </div>
                            )}
                          </div>

                          {/* Column 2: Delivery Telemetry Timeline */}
                          <div className="rounded-xl bg-white p-4 border border-slate-200/80 space-y-2.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              NABL Delivery Telemetry Timeline
                            </span>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">1. Queued in LIS Engine:</span>
                                <span className="font-bold text-slate-800">{log.timeline.queuedAt}</span>
                              </div>
                              {log.timeline.sentAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">2. Dispatched to Gateway:</span>
                                  <span className="font-bold text-slate-800">{log.timeline.sentAt}</span>
                                </div>
                              )}
                              {log.timeline.fallbackTriggeredAt && (
                                <div className="flex items-center justify-between text-amber-700">
                                  <span>⚡ Auto-Failover Cascade:</span>
                                  <span className="font-bold">{log.timeline.fallbackTriggeredAt}</span>
                                </div>
                              )}
                              {log.timeline.deliveredAt && (
                                <div className="flex items-center justify-between text-teal-700">
                                  <span>3. Handset Delivered:</span>
                                  <span className="font-bold">{log.timeline.deliveredAt}</span>
                                </div>
                              )}
                              {log.timeline.readAt && (
                                <div className="flex items-center justify-between text-emerald-700">
                                  <span>4. Patient/Doctor Read:</span>
                                  <span className="font-bold">{log.timeline.readAt}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                              <button
                                onClick={() => handleRetryDispatch(log.id)}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                              >
                                <Smartphone className="h-3.5 w-3.5" />
                                Resend via SMS
                              </button>
                              <button
                                onClick={() =>
                                  showToast(`ऑडिट ट्रेल #${log.id} को NABL लॉगबुक में सत्यापित किया गया।`, 'teal')
                                }
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0F766E] border border-teal-200 hover:bg-teal-100"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Audit Log
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: CRITICAL / PANIC VALUE ESCALATION MATRIX (NABL / CAP)
        ===================================================================== */}
        {activeTab === 'panic' && (
          <div className="space-y-4">
            {/* NABL Protocol Header Banner */}
            <div className="rounded-2xl bg-rose-50 p-5 border border-rose-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                  <AlertOctagon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-rose-950">
                      NABL ISO-15189 & CAP Critical / Panic Value Auto-Escalation Matrix
                    </h2>
                    <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                      MANDATORY 15-MIN SLA
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-rose-800">
                    जैसे ही कोई पैथोलॉजी परिणाम पैनिक लिमिट (जैसे K+ &gt; 6.5, Platelets &lt; 20,000, Troponin-I &gt; 1.5) में अप्रूव होता है, सिस्टम स्वचालित रूप से <strong>Step 1: WhatsApp</strong> → <strong>Step 2: High-Priority SMS</strong> → <strong>Step 3: Automated IVR Voice Call</strong> ट्रिगर करता है और डॉक्टर का रीड-बैक कन्फर्मेशन लॉक करता है।
                  </p>
                </div>
              </div>
            </div>

            {/* Panic Escalation Cards */}
            <div className="space-y-3.5">
              {panicList.map((panic) => {
                const isOverdue = !panic.acknowledged && panic.elapsedMinutes > panic.slaLimitMinutes;
                return (
                  <div
                    key={panic.id}
                    className={`rounded-2xl bg-white p-5 border transition-all shadow-sm ${
                      panic.acknowledged
                        ? 'border-emerald-200'
                        : isOverdue
                        ? 'border-rose-400 ring-2 ring-rose-100'
                        : 'border-rose-200'
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      {/* Left: Patient & Critical Parameter Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {panic.acknowledged ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              DOCTOR ACKNOWLEDGED (NABL LOCKED)
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-extrabold text-white animate-pulse">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              SLA OVERDUE ({panic.elapsedMinutes}m / {panic.slaLimitMinutes}m Limit)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 border border-amber-300">
                              <Clock className="h-3.5 w-3.5 animate-spin" />
                              ESCALATION IN PROGRESS ({panic.elapsedMinutes}m elapsed)
                            </span>
                          )}

                          <span className="text-sm font-extrabold text-slate-900">{panic.patientName}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                            {panic.uhid}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {panic.ageGender} • {panic.department}
                          </span>
                        </div>

                        {/* Parameter & Critical Value Highlight Box */}
                        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-rose-50/70 px-4 py-2.5 border border-rose-200/80">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-rose-700 block">
                              Critical Parameter
                            </span>
                            <span className="text-sm font-extrabold text-slate-900">{panic.parameterName}</span>
                          </div>
                          <div className="h-7 w-px bg-rose-200" />
                          <div>
                            <span className="text-[11px] font-bold uppercase text-rose-700 block">Panic Result</span>
                            <span className="text-base font-extrabold text-rose-700">
                              {panic.criticalValue} {panic.unit}
                            </span>
                          </div>
                          <div className="h-7 w-px bg-rose-200" />
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-500 block">Normal Reference</span>
                            <span className="text-xs font-bold text-slate-700">
                              {panic.referenceRange} {panic.unit}
                            </span>
                          </div>
                          <div className="h-7 w-px bg-rose-200" />
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-500 block">
                              Referring Doctor
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {panic.referringDoctor} ({panic.doctorMobile})
                            </span>
                          </div>
                        </div>

                        {/* 3-Step Escalation Pipeline Visualizer */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                              panic.stepStatus.whatsappSent
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Step 1: Auto-WhatsApp Sent
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                              panic.stepStatus.smsPrioritySent
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Step 2: High-Priority SMS Sent
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                              panic.stepStatus.ivrCallPlaced
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            Step 3: Automated IVR Voice Call {panic.stepStatus.ivrCallPlaced ? '(Connected)' : '(Pending)'}
                          </span>
                        </div>

                        {/* Read-back Confirmation Audit Note if Acknowledged */}
                        {panic.acknowledged && panic.readBackNote && (
                          <div className="mt-2 rounded-xl bg-emerald-50/70 p-3 border border-emerald-200 text-xs">
                            <p className="font-extrabold text-emerald-900">
                              ✓ NABL Read-Back Audit Recorded ({panic.acknowledgedAt}):
                            </p>
                            <p className="mt-0.5 font-medium text-emerald-800">{panic.readBackNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Escalation & Read-Back Action Buttons */}
                      <div className="flex flex-wrap xl:flex-col items-stretch gap-2 shrink-0">
                        {!panic.acknowledged && (
                          <>
                            <button
                              onClick={() => {
                                setActivePanicModal(panic);
                                setDoctorAckName(panic.referringDoctor);
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D9488] shadow-sm transition-all"
                            >
                              <UserCheck className="h-4 w-4" />
                              Record Doctor Read-Back Note
                            </button>

                            <button
                              onClick={() => handleTriggerIvrEscalation(panic)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                              Trigger Step-3 IVR Call Now
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: DOCTOR CONSULTATION & STAT HANDOFF DESK
        ===================================================================== */}
        {activeTab === 'consultation' && (
          <div className="space-y-4">
            <DoctorConsultationDesk />
          </div>
        )}

        {/* =====================================================================
            TAB 3: 2-WAY PATIENT & DOCTOR LIVE CONSOLE (OMNICHANNEL INBOX)
        ===================================================================== */}
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 min-h-[640px]">
            {/* LEFT PANE: ACTIVE CONVERSATION THREADS (3 COLS) */}
            <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Active Patient & Doctor Threads
                  </h3>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#0F766E] border border-teal-200">
                    {threads.length} Live
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {threads.map((thread) => {
                  const isSelected = thread.id === activeThread.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`cursor-pointer p-4 transition-all ${
                        isSelected ? 'bg-teal-50/60 border-l-4 border-l-[#0F766E]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">{thread.contactName}</span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {thread.uhid} • {thread.ageGender}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">{thread.lastTimestamp}</span>
                      </div>

                      <p className="mt-2 text-xs font-medium text-slate-600 line-clamp-2">{thread.lastMessage}</p>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            thread.sentimentTag === 'DOCTOR_DESK'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : thread.sentimentTag === 'HOME_PICKUP'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {thread.sentimentTag.replace('_', ' ')}
                        </span>

                        {thread.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CENTER PANE: LIVE CONVERSATION STREAM (6 COLS) */}
            <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] font-extrabold text-sm border border-teal-200">
                    {activeThread.contactName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{activeThread.contactName}</h3>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        WhatsApp Official Session
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {activeThread.mobile} • {activeThread.uhid}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchWhatsAppWeb(activeThread.mobile, '')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open WA Web
                </button>
              </div>

              {/* Message Bubble Stream */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-[#F8FAFC]">
                {activeThread.messages.map((msg) => {
                  const isStaff = msg.sender === 'STAFF' || msg.sender === 'SYSTEM';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl p-3.5 text-xs shadow-sm border ${
                          msg.sender === 'SYSTEM'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : isStaff
                            ? 'bg-teal-50/90 text-slate-900 border-teal-200'
                            : 'bg-white text-slate-900 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-[10px] font-extrabold text-[#0F766E]">{msg.senderName}</span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="font-medium leading-relaxed">{msg.text}</p>

                        {msg.attachment && (
                          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-teal-200">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#0F766E]" />
                              <div>
                                <p className="text-[11px] font-bold text-slate-900">{msg.attachment.title}</p>
                                <p className="text-[10px] font-semibold text-emerald-700">{msg.attachment.code}</p>
                              </div>
                            </div>
                            <Download className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pre-approved Medical Quick Replies */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  1-Click Approved Clinical Templates:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {QUICK_MEDICAL_REPLIES.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendChatMessage(tpl)}
                      className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors"
                    >
                      + {tpl.slice(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Composer Input */}
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="पेशेंट या डॉक्टर के लिए क्लिनिकल रिप्लाई टाइप करें..."
                  className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 border border-slate-200 focus:bg-white focus:border-[#0F766E] focus:outline-none"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D9488] transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Reply
                </button>
              </div>
            </div>

            {/* RIGHT DRAWER: PATIENT CLINICAL SNAPSHOT (3 COLS) */}
            <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Patient Clinical Snapshot
                </h3>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#0F766E] border border-teal-200">
                  Live LIS Sync
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">UHID:</span>
                  <span className="font-extrabold text-slate-900">{activeThread.uhid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age / Gender:</span>
                  <span className="font-bold text-slate-800">{activeThread.ageGender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Order:</span>
                  <span className="font-extrabold text-[#0F766E]">{activeThread.activeOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fasting Status:</span>
                  <span className="font-bold text-slate-800">
                    {activeThread.activeOrder.fastingRequired ? 'Yes (10-12 Hrs)' : 'Non-Fasting'}
                  </span>
                </div>
              </div>

              {/* Ordered Tests */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Ordered Investigations
                </span>
                <div className="space-y-1">
                  {activeThread.activeOrder.tests.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200/60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E]" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Bill Amount:</span>
                  <span className="font-bold text-slate-900">₹{activeThread.activeOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance Due:</span>
                  <span
                    className={`font-extrabold ${
                      activeThread.activeOrder.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    ₹{activeThread.activeOrder.dueAmount}
                  </span>
                </div>
              </div>

              {/* 1-Click Clinical Dispatch Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() =>
                    handleSendChatMessage(
                      `आपकी सत्यापित PDF रिपोर्ट (${activeThread.activeOrder.orderId}) यहाँ से डाउनलोड करें: https://labcore.in/r/${activeThread.activeOrder.orderId}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D9488] transition-all shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  Dispatch Verified PDF Report
                </button>

                <button
                  onClick={() =>
                    handleSendChatMessage(
                      `नमस्ते, आपके ऑर्डर ${activeThread.activeOrder.orderId} की बकाया राशि ₹${activeThread.activeOrder.dueAmount} के भुगतान हेतु सुरक्षित UPI लिंक: https://pay.labcore.in/${activeThread.activeOrder.orderId}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-xs font-bold text-[#0284C7] border border-sky-200 hover:bg-sky-100 transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  Send UPI Payment Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: HOSPITAL EMERGENCY PAGING & CODE BROADCAST
        ===================================================================== */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4">
            <EmergencyBroadcastCenter />
          </div>
        )}

        {/* =====================================================================
            TAB: CLINICAL SHIFT HANDOVER HUDDLE
        ===================================================================== */}
        {activeTab === 'handover' && (
          <div className="space-y-4">
            <ShiftHandoverHuddle />
          </div>
        )}

        {/* =====================================================================
            TAB 4: CLINICAL CAMPAIGNS & PREVENTIVE HEALTH RE-CALL
        ===================================================================== */}
        {activeTab === 'campaign' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Automated Preventive Care & Chronic Disease Re-call Engine
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  मरीजों के पिछले टेस्ट इतिहास के आधार पर डायबिटीज़ (HbA1c 90-दिन), थायरॉइड (180-दिन) और वार्षिक हेल्थ चेकअप के ऑटोमैटिक रिमाइंडर।
                </p>
              </div>
              <button
                onClick={() =>
                  showToast('नया क्लिनिकल री-कॉल कैंपेन बैच (HbA1c Follow-up) सफलतापूर्वक शेड्यूल किया गया!', 'emerald')
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D9488] shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Launch Preventive Batch
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {campaigns.map((cmp) => (
                <div
                  key={cmp.id}
                  className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0F766E] border border-teal-200">
                        {cmp.clinicalCategory}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        ● {cmp.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900">{cmp.title}</h3>
                    <p className="text-xs font-medium text-slate-500">Rule: {cmp.frequencyRule}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      TRAI DLT Template ID: {cmp.dltTemplateId} • Last Run: {cmp.lastExecuted}
                    </p>
                  </div>

                  {/* Campaign Telemetry Metrics */}
                  <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/70 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Target</span>
                      <span className="text-sm font-extrabold text-slate-900">{cmp.targetAudienceCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivered</span>
                      <span className="text-sm font-extrabold text-teal-700">{cmp.deliveredCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">CTR %</span>
                      <span className="text-sm font-extrabold text-sky-700">{cmp.ctrPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Booked</span>
                      <span className="text-sm font-extrabold text-emerald-700">{cmp.bookedAppointments}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {cmp.channelMix.map((ch) => (
                        <span key={ch}>{renderChannelBadge(ch)}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => showToast(`कैंपेन "${cmp.title}" का इंस्टेंट ट्रिगर बैच प्रारंभ किया गया।`, 'teal')}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-teal-50 hover:text-[#0F766E] transition-colors"
                    >
                      Run Batch Now <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: TELECOMMUNICATIONS & DLT COMPLIANCE GATEWAY
        ===================================================================== */}
        {activeTab === 'gateway' && (
          <div className="space-y-6">
            {/* Gateway Health Cards */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Meta WhatsApp Cloud API */}
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    Meta WhatsApp Cloud API
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                    QUALITY: GREEN (HIGH)
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Verified WABA ID:</span>
                    <strong className="text-slate-900">104982319481029</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Official Display Name:</span>
                    <strong className="text-emerald-700">LabCore Diagnostics Official ✓</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Messaging Tier Limit:</span>
                    <strong className="text-slate-900">1,00,000 Unique / 24h</strong>
                  </div>
                </div>
              </div>

              {/* TRAI DLT Telecom Registry */}
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <Smartphone className="h-5 w-5 text-[#0284C7]" />
                    TRAI DLT Principal Entity
                  </span>
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0284C7] border border-sky-200">
                    ACTIVE & COMPLIANT
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Principal Entity ID:</span>
                    <strong className="text-slate-900">1101548920001428910</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved Sender Headers:</span>
                    <strong className="text-[#0284C7]">LABCOR, DRNIKL</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>DPDP Act 2023 Consent Ledger:</span>
                    <strong className="text-emerald-700">Enforced (100% Opt-in)</strong>
                  </div>
                </div>
              </div>

              {/* Multi-Channel Failover Cascade */}
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Failover Cascade & SMTP Relay
                  </span>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0F766E] border border-teal-200">
                    AUTO-ROUTING ON
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Primary → Secondary Rule:</span>
                    <strong className="text-slate-900">WA Fail (120s) → DLT SMS</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Panic Value Rule:</span>
                    <strong className="text-rose-700">WA + SMS + Exotel IVR Call</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>AWS SES / SMTP Relay Latency:</span>
                    <strong className="text-emerald-700">184 ms (Healthy)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved DLT & WhatsApp Template Studio Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Approved TRAI DLT & Meta WhatsApp Interactive Template Registry
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    सभी क्लिनिकल अलर्ट और रिपोर्ट डिस्पैच के लिए प्री-अप्रूव्ड सरकारी DLT व Meta टेम्पलेट्स।
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Template Name</th>
                      <th className="py-3 px-4">DLT / Meta ID</th>
                      <th className="py-3 px-4">Header</th>
                      <th className="py-3 px-4">Channel & Category</th>
                      <th className="py-3 px-4">Quality Status</th>
                      <th className="py-3 px-4">Approved Payload Structure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {DLT_TEMPLATES_REGISTRY.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{tpl.templateName}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{tpl.dltTemplateId}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-extrabold text-slate-800 border border-slate-200">
                            {tpl.senderHeader}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {tpl.channel} • {tpl.category}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            {tpl.qualityRating}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-md">{tpl.sampleContent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL: DOCTOR PANIC VALUE READ-BACK CONFIRMATION RECORDER
      ===================================================================== */}
      {activePanicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-extrabold text-rose-950">
                  Record NABL / CAP Critical Value Read-Back Confirmation
                </h3>
              </div>
              <button
                onClick={() => setActivePanicModal(null)}
                className="rounded-lg p-1 text-rose-700 hover:bg-rose-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">
                  Patient: {activePanicModal.patientName} ({activePanicModal.uhid})
                </p>
                <p className="font-extrabold text-rose-700">
                  Critical Parameter: {activePanicModal.parameterName} = {activePanicModal.criticalValue}{' '}
                  {activePanicModal.unit} (Normal: {activePanicModal.referenceRange})
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Acknowledging Doctor / Clinical Recipient Name:
                </label>
                <input
                  type="text"
                  value={doctorAckName}
                  onChange={(e) => setDoctorAckName(e.target.value)}
                  className="w-full rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 border border-slate-300 focus:border-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor Read-Back Confirmation Note (NABL ISO-15189 Audit Log):
                </label>
                <textarea
                  rows={3}
                  value={readBackNoteInput}
                  onChange={(e) => setReadBackNoteInput(e.target.value)}
                  placeholder="उदा: डॉ. विक्रमादित्य नायर ने फोन पर Serum K+ = 6.8 mmol/L को दोहराया (Read-back verified) और तत्काल डायलिसिस/इंसुलिन प्रोटोकॉल शुरू करने की पुष्टि की..."
                  className="w-full rounded-xl bg-white p-3.5 text-xs font-medium text-slate-900 border border-slate-300 focus:border-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActivePanicModal(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPanicAck}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Lock Read-Back Audit Trail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTED PAGE WRAPPED IN PROTECTEDROUTE, DASHBOARDLAYOUT & SUSPENSE
// ============================================================================

export default function ClinicalCommunicationPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="p-8 bg-white text-slate-600 text-xs font-bold">
              Loading LabCore Clinical Communication Engine...
            </div>
          }
        >
          <ClinicalCommunicationHubContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
