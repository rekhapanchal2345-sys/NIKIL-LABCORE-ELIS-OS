"use client";

import React, { useEffect, useMemo, useState, Fragment } from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import {
  paymentApi,
  orderApi,
  patientApi,
  refundsApi,
  advancesApi,
  cashCounterApi,
  settlementsApi,
} from "@/lib/api";
import PaymentReceipt from "@/components/payments/PaymentReceipt";
import PaymentDetailModal from "@/components/payments/PaymentDetailModal";
import CollectPaymentModal from "@/components/payments/CollectPaymentModal";
import FinancialReportModal from "@/components/payments/FinancialReportModal";
import ShiftHandoverModal from "@/components/payments/ShiftHandoverModal";
import AdvanceDepositModal from "@/components/payments/AdvanceDepositModal";
import RefundRequestModal from "@/components/payments/RefundRequestModal";
import WhatsAppReceiptModal from "@/components/payments/WhatsAppReceiptModal";
import NotificationDispatchModal, { NotificationPayload } from "@/components/common/NotificationDispatchModal";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  DollarSign,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  RotateCcw,
  Check,
  Building2,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpDown,
  Coins,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Sparkles,
  Tag,
  Activity,
  Receipt,
  Barcode,
  PenLine,
  Filter,
  FileSpreadsheet,
  Scale,
  Lock,
  ShieldAlert,
  CheckSquare,
  Stethoscope,
  Landmark,
  BookOpen,
  FileCheck,
  CircleSlash,
  ArrowRight,
} from "lucide-react";

type PaymentStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "FAILED"
  | "REFUND_PENDING"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELLED"
  | "VOID"
  | "CREDIT"
  | "ADVANCE";

type PaymentMethod = "CASH" | "CARD" | "UPI" | "NET_BANKING" | "CHEQUE" | "OTHER";

type Payment = {
  id: string;
  receiptNumber: string;
  transactionId: string;
  invoiceNumber?: string;
  invoiceId?: string;
  orderNumber?: string;
  orderId?: string;
  patientId?: string;
  patientName: string;
  patientUhid?: string;
  phone?: string;
  patientEmail?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  createdAt?: string;
  collectedBy?: string;
  counter?: string;
  settlement?: string;
  remarks?: string | null;
  invoiceTotal?: number;
  invoicePaid?: number;
  invoiceBalance?: number;
  // Enterprise Clinical Healthcare Context
  encounterType?: "OPD" | "IPD" | "STAT" | "HOME" | "CORP";
  doctorName?: string;
  department?: string;
  testCount?: number;
  testNames?: string;
  instrumentRef?: string;
  terminalId?: string;
  bankName?: string;
  abhaId?: string;
};

type SummaryStats = {
  totalCollection: number;
  todayCollection: number;
  cashInHand: number;
  digitalPayments: number;
  pendingSettlements: number;
  outstandingReceivables: number;
  cashDrawer: number;
};

const paymentTabs = [
  "Overview",
  "Transactions",
  "Cash Counter",
  "Advances & Wallet",
  "Refunds",
  "Settlements",
  "Reconciliation",
  "Reports",
  "Audit Log",
] as const;

type PaymentTab = (typeof paymentTabs)[number];

const TAB_SLUG_MAP: Record<string, PaymentTab> = {
  overview: "Overview",
  transactions: "Transactions",
  "cash-counter": "Cash Counter",
  cashcounter: "Cash Counter",
  counter: "Cash Counter",
  till: "Cash Counter",
  advances: "Advances & Wallet",
  wallet: "Advances & Wallet",
  refunds: "Refunds",
  settlements: "Settlements",
  reconciliation: "Reconciliation",
  reconcile: "Reconciliation",
  reports: "Reports",
  "audit-log": "Audit Log",
  audit: "Audit Log",
};

const TAB_TO_SLUG: Record<PaymentTab, string> = {
  Overview: "",
  Transactions: "transactions",
  "Cash Counter": "cash-counter",
  "Advances & Wallet": "advances",
  Refunds: "refunds",
  Settlements: "settlements",
  Reconciliation: "reconciliation",
  Reports: "reports",
  "Audit Log": "audit-log",
};

const demoPayments: Payment[] = [
  {
    id: "txn-1001",
    receiptNumber: "REC-2026-1001",
    transactionId: "TXN-363",
    invoiceNumber: "INV-178904",
    orderNumber: "ORD-2026-8636",
    patientName: "Panchal Ashokkumar",
    patientUhid: "UHID-24811",
    phone: "+91 98765 43210",
    patientAge: 48,
    patientGender: "Male",
    amount: 5040,
    method: "CARD",
    status: "PAID",
    paidAt: "2026-09-26T17:55:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Rajesh Dave",
    department: "Clinical Pathology",
    testCount: 3,
    testNames: "Comprehensive Metabolic Panel, Lipid Profile",
    instrumentRef: "RRN-948201",
    terminalId: "PINE-TID-884",
    bankName: "HDFC Bank",
    invoiceTotal: 5040,
    invoicePaid: 5040,
    invoiceBalance: 0,
  },
  {
    id: "txn-1002",
    receiptNumber: "REC-2026-1002",
    transactionId: "TXN-364",
    invoiceNumber: "INV-178905",
    orderNumber: "ORD-2026-8640",
    patientName: "Seema Shah",
    patientUhid: "UHID-24812",
    phone: "+91 99887 66112",
    patientAge: 34,
    patientGender: "Female",
    amount: 2780,
    method: "UPI",
    status: "PARTIALLY_PAID",
    paidAt: "2026-09-26T09:30:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Priya Sharma",
    department: "Biochemistry",
    testCount: 2,
    testNames: "Thyroid Profile Total, 25-OH Vitamin D",
    instrumentRef: "UPIPAY42819201928",
    terminalId: "RAZOR-QR-001",
    invoiceTotal: 3980,
    invoicePaid: 2780,
    invoiceBalance: 1200,
  },
  {
    id: "txn-1003",
    receiptNumber: "REC-2026-1003",
    transactionId: "TXN-365",
    invoiceNumber: "INV-178906",
    orderNumber: "ORD-2026-8645",
    patientName: "Nirav Joshi",
    patientUhid: "UHID-24815",
    phone: "+91 91234 56789",
    patientAge: 52,
    patientGender: "Male",
    amount: 15400,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-26T12:15:00",
    collectedBy: "Prakash Mehta",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "STAT",
    doctorName: "Dr. Vikram Shah",
    department: "Emergency Cardiology",
    testCount: 4,
    testNames: "Cardiac Troponin-I (High Sensitivity), CK-MB, D-Dimer, ABG",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 15400,
    invoicePaid: 15400,
    invoiceBalance: 0,
  },
  {
    id: "txn-1004",
    receiptNumber: "REC-2026-1004",
    transactionId: "TXN-366",
    invoiceNumber: "INV-178907",
    orderNumber: "ORD-2026-8651",
    patientName: "Anita Verma",
    patientUhid: "UHID-24816",
    phone: "+91 98700 11223",
    patientAge: 29,
    patientGender: "Female",
    amount: 6350,
    method: "NET_BANKING",
    status: "REFUND_PENDING",
    paidAt: "2026-09-25T18:05:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 03",
    settlement: "RECONCILE",
    encounterType: "OPD",
    doctorName: "Dr. Anita Desai",
    department: "Endocrinology",
    testCount: 3,
    testNames: "HbA1c Glycated Hemoglobin, Fasting Insulin, C-Peptide",
    instrumentRef: "NEFT202609254410",
    bankName: "HDFC Bank",
    invoiceTotal: 6350,
    invoicePaid: 6350,
    invoiceBalance: 0,
  },
  {
    id: "txn-1005",
    receiptNumber: "REC-2026-1005",
    transactionId: "TXN-367",
    invoiceNumber: "INV-178908",
    orderNumber: "ORD-2026-8654",
    patientName: "Harshad Shah",
    patientUhid: "UHID-24819",
    phone: "+91 98980 12345",
    patientAge: 61,
    patientGender: "Male",
    amount: 9200,
    method: "CHEQUE",
    status: "PENDING",
    paidAt: "2026-09-26T08:00:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "PENDING",
    encounterType: "IPD",
    doctorName: "Dr. S. K. Rao",
    department: "Histopathology",
    testCount: 2,
    testNames: "Punch Biopsy Special Staining & IHC Estrogen Receptor",
    instrumentRef: "CHQ-884019",
    bankName: "HDFC Bank",
    invoiceTotal: 9200,
    invoicePaid: 0,
    invoiceBalance: 9200,
  },
  {
    id: "txn-1006",
    receiptNumber: "REC-2026-1006",
    transactionId: "TXN-368",
    invoiceNumber: "INV-178909",
    orderNumber: "ORD-2026-8658",
    patientName: "Rajeshwari Dave",
    patientUhid: "UHID-24822",
    phone: "+91 99250 88771",
    patientAge: 45,
    patientGender: "Female",
    amount: 3450,
    method: "UPI",
    status: "PAID",
    paidAt: "2026-09-26T10:15:00",
    collectedBy: "Sunita Sen",
    counter: "Counter 04",
    settlement: "SETTLED",
    encounterType: "HOME",
    doctorName: "Dr. Rajesh Dave",
    department: "Hematology",
    testCount: 3,
    testNames: "Complete Hemogram (CBC), Serum Ferritin, Iron Profile",
    instrumentRef: "GPAY992018274",
    terminalId: "MOB-PHLEB-01",
    invoiceTotal: 3450,
    invoicePaid: 3450,
    invoiceBalance: 0,
  },
  {
    id: "txn-1007",
    receiptNumber: "REC-2026-1007",
    transactionId: "TXN-369",
    invoiceNumber: "INV-178910",
    orderNumber: "ORD-2026-8662",
    patientName: "Deepak Choksi",
    patientUhid: "UHID-24825",
    phone: "+91 98240 55123",
    patientAge: 57,
    patientGender: "Male",
    amount: 4100,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-26T11:45:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Vikram Shah",
    department: "Biochemistry",
    testCount: 2,
    testNames: "Renal Function Test (RFT), Urine Microalbumin / Creatinine Ratio",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 4100,
    invoicePaid: 4100,
    invoiceBalance: 0,
  },
  {
    id: "txn-1008",
    receiptNumber: "REC-2026-1008",
    transactionId: "TXN-370",
    invoiceNumber: "INV-178911",
    orderNumber: "ORD-2026-8665",
    patientName: "Kavita Pillai",
    patientUhid: "UHID-24827",
    phone: "+91 97230 44990",
    patientAge: 38,
    patientGender: "Female",
    amount: 7800,
    method: "CARD",
    status: "PAID",
    paidAt: "2026-09-26T13:20:00",
    collectedBy: "Prakash Mehta",
    counter: "Counter 03",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Priya Sharma",
    department: "Clinical Immunology",
    testCount: 2,
    testNames: "Autoimmune ANA Blot Profile (17 Antigens), High Sensitivity CRP",
    instrumentRef: "RRN-491028",
    terminalId: "ICICI-EDC-338",
    bankName: "ICICI Bank",
    invoiceTotal: 7800,
    invoicePaid: 7800,
    invoiceBalance: 0,
  },
  {
    id: "txn-1009",
    receiptNumber: "REC-2026-1009",
    transactionId: "TXN-371",
    invoiceNumber: "INV-178912",
    orderNumber: "ORD-2026-8670",
    patientName: "Vipul Rawal",
    patientUhid: "UHID-24828",
    phone: "+91 94260 11772",
    patientAge: 50,
    patientGender: "Male",
    amount: 3400,
    method: "CARD",
    status: "PAID",
    paidAt: "2026-09-26T14:40:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "SETTLED",
    encounterType: "IPD",
    doctorName: "Dr. S. K. Rao",
    department: "Microbiology",
    testCount: 2,
    testNames: "Aerobic Blood Culture & Automated MIC Susceptibility (VITEK-2)",
    instrumentRef: "HDFC-RRN-99201",
    terminalId: "HDFC-POS-029",
    bankName: "HDFC Bank",
    invoiceTotal: 3400,
    invoicePaid: 3400,
    invoiceBalance: 0,
  },
  {
    id: "txn-1010",
    receiptNumber: "REC-2026-1010",
    transactionId: "TXN-372",
    invoiceNumber: "INV-178913",
    orderNumber: "ORD-2026-8674",
    patientName: "Bhavna Soni",
    patientUhid: "UHID-24831",
    phone: "+91 98255 66778",
    patientAge: 63,
    patientGender: "Female",
    amount: 12500,
    method: "NET_BANKING",
    status: "PAID",
    paidAt: "2026-09-26T15:10:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "CORP",
    doctorName: "Dr. Anita Desai",
    department: "Preventive Healthcare",
    testCount: 6,
    testNames: "Executive Platinum Health Checkup, Bilateral Mammogram, Pap Smear",
    instrumentRef: "CORPNEFT8839201",
    bankName: "State Bank of India",
    invoiceTotal: 12500,
    invoicePaid: 12500,
    invoiceBalance: 0,
  },
  {
    id: "txn-1011",
    receiptNumber: "REC-2026-1011",
    transactionId: "TXN-373",
    invoiceNumber: "INV-178914",
    orderNumber: "ORD-2026-8678",
    patientName: "Arvind Gadhvi",
    patientUhid: "UHID-24833",
    phone: "+91 99090 33441",
    patientAge: 42,
    patientGender: "Male",
    amount: 1850,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-26T15:50:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Rajesh Dave",
    department: "Clinical Pathology",
    testCount: 1,
    testNames: "Complete Liver Function Profile (LFT with GGT)",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 1850,
    invoicePaid: 1850,
    invoiceBalance: 0,
  },
  {
    id: "txn-1012",
    receiptNumber: "REC-2026-1012",
    transactionId: "TXN-374",
    invoiceNumber: "INV-178915",
    orderNumber: "ORD-2026-8681",
    patientName: "Farzana Mansuri",
    patientUhid: "UHID-24835",
    phone: "+91 97120 77889",
    patientAge: 31,
    patientGender: "Female",
    amount: 2200,
    method: "UPI",
    status: "PAID",
    paidAt: "2026-09-26T16:15:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "SETTLED",
    encounterType: "STAT",
    doctorName: "Dr. Vikram Shah",
    department: "Emergency Biochemistry",
    testCount: 2,
    testNames: "Arterial Blood Gas Analysis (ABG), Serum Electrolytes (Na/K/Cl)",
    instrumentRef: "PAYTM849201991",
    terminalId: "RAZOR-QR-001",
    invoiceTotal: 2200,
    invoicePaid: 2200,
    invoiceBalance: 0,
  },
  {
    id: "txn-1013",
    receiptNumber: "REC-2026-1013",
    transactionId: "TXN-375",
    invoiceNumber: "INV-178916",
    orderNumber: "ORD-2026-8488",
    patientName: "Suresh Mehta",
    patientUhid: "UHID-24820",
    phone: "+91 94280 12345",
    patientAge: 62,
    patientGender: "Male",
    amount: 4800,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-24T16:40:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "IPD",
    doctorName: "Dr. Priya Sharma",
    department: "Hematology & Coagulation",
    testCount: 3,
    testNames: "Prothrombin Time with INR (PT/INR), Serum Creatinine, Serum Sodium",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 4800,
    invoicePaid: 4800,
    invoiceBalance: 0,
  },
  {
    id: "txn-1014",
    receiptNumber: "REC-2026-1014",
    transactionId: "TXN-376",
    invoiceNumber: "INV-178917",
    orderNumber: "ORD-2026-8550",
    patientName: "Rina Patel",
    patientUhid: "UHID-24813",
    phone: "+91 98251 44552",
    patientAge: 36,
    patientGender: "Female",
    amount: 3600,
    method: "UPI",
    status: "PAID",
    paidAt: "2026-09-25T11:20:00",
    collectedBy: "Prakash Mehta",
    counter: "Counter 03",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. S. K. Rao",
    department: "Histopathology",
    testCount: 1,
    testNames: "Punch Biopsy Special Staining",
    instrumentRef: "PHONEPE9201844",
    terminalId: "RAZOR-QR-001",
    invoiceTotal: 3600,
    invoicePaid: 3600,
    invoiceBalance: 0,
  },
  {
    id: "txn-1015",
    receiptNumber: "REC-2026-1015",
    transactionId: "TXN-377",
    invoiceNumber: "INV-178918",
    orderNumber: "ORD-2026-8401",
    patientName: "Girish Patel",
    patientUhid: "UHID-24740",
    phone: "+91 99099 12344",
    patientAge: 55,
    patientGender: "Male",
    amount: 4500,
    method: "CASH",
    status: "REFUNDED",
    paidAt: "2026-09-24T10:15:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Anita Desai",
    department: "Immunology",
    testCount: 1,
    testNames: "Autoimmune ANA Immunofluorescence (Reagent Stockout Reversal)",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 4500,
    invoicePaid: 0,
    invoiceBalance: 0,
  },
  {
    id: "txn-1016",
    receiptNumber: "REC-2026-1016",
    transactionId: "TXN-378",
    invoiceNumber: "INV-178919",
    orderNumber: "ORD-2026-8410",
    patientName: "Meena Chawla",
    patientUhid: "UHID-24824",
    phone: "+91 97245 99881",
    patientAge: 52,
    patientGender: "Female",
    amount: 1650,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-23T15:10:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Priya Sharma",
    department: "Biochemistry",
    testCount: 2,
    testNames: "Thyroid Stimulating Hormone (TSH), Fasting Plasma Glucose",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 1650,
    invoicePaid: 1650,
    invoiceBalance: 0,
  },
  {
    id: "txn-1017",
    receiptNumber: "REC-2026-1017",
    transactionId: "TXN-379",
    invoiceNumber: "INV-178920",
    orderNumber: "ORD-2026-8685",
    patientName: "Tarun Kothari",
    patientUhid: "UHID-24838",
    phone: "+91 98254 33119",
    patientAge: 27,
    patientGender: "Male",
    amount: 2100,
    method: "UPI",
    status: "PAID",
    paidAt: "2026-09-26T16:45:00",
    collectedBy: "Sunita Sen",
    counter: "Counter 04",
    settlement: "SETTLED",
    encounterType: "HOME",
    doctorName: "Dr. Rajesh Dave",
    department: "Microbiology",
    testCount: 2,
    testNames: "Dengue NS1 Antigen Rapid & Platelet Count",
    instrumentRef: "BHARATQR994821",
    terminalId: "MOB-PHLEB-01",
    invoiceTotal: 2100,
    invoicePaid: 2100,
    invoiceBalance: 0,
  },
  {
    id: "txn-1018",
    receiptNumber: "REC-2026-1018",
    transactionId: "TXN-380",
    invoiceNumber: "INV-178921",
    orderNumber: "ORD-2026-8689",
    patientName: "Jayesh Trivedi",
    patientUhid: "UHID-24840",
    phone: "+91 99790 44221",
    patientAge: 68,
    patientGender: "Male",
    amount: 5600,
    method: "CARD",
    status: "PAID",
    paidAt: "2026-09-26T17:10:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "IPD",
    doctorName: "Dr. Vikram Shah",
    department: "Cardiology",
    testCount: 2,
    testNames: "Post-PTCA Cardiac Panel, Serum Electrolytes",
    instrumentRef: "RRN-771920",
    terminalId: "PINE-TID-884",
    bankName: "HDFC Bank",
    invoiceTotal: 5600,
    invoicePaid: 5600,
    invoiceBalance: 0,
  },
  {
    id: "txn-1019",
    receiptNumber: "REC-2026-1019",
    transactionId: "TXN-381",
    invoiceNumber: "INV-178922",
    orderNumber: "ORD-2026-8692",
    patientName: "Shobha Rane",
    patientUhid: "UHID-24842",
    phone: "+91 98242 11993",
    patientAge: 59,
    patientGender: "Female",
    amount: 2400,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-26T17:30:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
    encounterType: "OPD",
    doctorName: "Dr. Anita Desai",
    department: "Clinical Pathology",
    testCount: 2,
    testNames: "HbA1c Glycated Hemoglobin by HPLC & Fasting Glucose",
    terminalId: "CASH-TILL-01",
    invoiceTotal: 2400,
    invoicePaid: 2400,
    invoiceBalance: 0,
  },
  {
    id: "txn-1020",
    receiptNumber: "REC-2026-1020",
    transactionId: "TXN-382",
    invoiceNumber: "INV-178923",
    orderNumber: "ORD-2026-8695",
    patientName: "Mohsin Khan",
    patientUhid: "UHID-24845",
    phone: "+91 97260 88114",
    patientAge: 33,
    patientGender: "Male",
    amount: 4200,
    method: "UPI",
    status: "PAID",
    paidAt: "2026-09-26T17:45:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "SETTLED",
    encounterType: "STAT",
    doctorName: "Dr. Vikram Shah",
    department: "Emergency Care",
    testCount: 2,
    testNames: "Serum Procalcitonin (PCT Quantitative) & Blood Lactate",
    instrumentRef: "PAYTM382019284",
    terminalId: "RAZOR-QR-001",
    invoiceTotal: 4200,
    invoicePaid: 4200,
    invoiceBalance: 0,
  },
];

import { formatIndianRupees, maskPhoneNumber, roundHalfUp } from "@/lib/money";

const defaultSummary: SummaryStats = {
  totalCollection: 148500,
  todayCollection: 46250,
  cashInHand: 18450,
  digitalPayments: 27800,
  pendingSettlements: 21262.5,
  outstandingReceivables: 34500,
  cashDrawer: 40850,
};

function formatCurrency(value: number) {
  return formatIndianRupees(value || 0);
}

function formatDate(date: string | number) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | number) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodBadge(method: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    CASH: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    CARD: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    UPI: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    NET_BANKING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    CHEQUE: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
    OTHER: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  return map[method] ?? map.OTHER;
}

function getStatusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    PARTIALLY_PAID: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    REFUND_PENDING: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    PARTIALLY_REFUNDED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    REFUNDED: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",
    CANCELLED: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    VOID: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
    CREDIT: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
    ADVANCE: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
}

function getMethodIcon(method: PaymentMethod) {
  const icons: Record<PaymentMethod, string> = {
    CASH: "💵",
    CARD: "💳",
    UPI: "📱",
    NET_BANKING: "🏦",
    CHEQUE: "🧾",
    OTHER: "💰",
  };
  return icons[method] ?? icons.OTHER;
}

function getStatusLabel(status: PaymentStatus) {
  return status.replace(/_/g, " ");
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("Overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [summary, setSummary] = useState<SummaryStats>(defaultSummary);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<"paidAt" | "amount" | "patientName">("paidAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Receivables Aging Filter
  const [agingFilter, setAgingFilter] = useState<"ALL" | "CURRENT" | "8-15" | "16-30" | "30+">("ALL");

  // Clinical Facility Context Switcher (Hospital / Lab / Clinic)
  const [facilityType, setFacilityType] = useState<"HOSPITAL" | "LAB" | "CLINIC">("HOSPITAL");

  // Transactions Tab Extra Filters & Drawer State
  const [txnCounterFilter, setTxnCounterFilter] = useState("All");
  const [txnDeptFilter, setTxnDeptFilter] = useState("All");
  const [encounterFilter, setEncounterFilter] = useState("All");
  const [selectedTxnDrawer, setSelectedTxnDrawer] = useState<Payment | null>(null);
  const [thermalSlipPayment, setThermalSlipPayment] = useState<any | null>(null);

  // Bank Statement Import & Reconciliation Engine State
  const [isBankImportOpen, setIsBankImportOpen] = useState(false);
  const [selectedBankProvider, setSelectedBankProvider] = useState<"HDFC" | "ICICI" | "SBI">("HDFC");
  const [isChequeClearOpen, setIsChequeClearOpen] = useState(false);
  const [chequeClearingItem, setChequeClearingItem] = useState<any | null>(null);
  const [isEodBatchOpen, setIsEodBatchOpen] = useState(false);

  // Multi-counter Till State & Indian Currency Denominations
  const [activeCounter, setActiveCounter] = useState("Counter 01 (Main OPD)");
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    500: 58,
    200: 34,
    100: 32,
    50: 16,
    20: 25,
    10: 20,
    5: 18,
    coins: 170,
  });
  const [cashierNotes, setCashierNotes] = useState("");
  const [isDenominationSaved, setIsDenominationSaved] = useState(false);

  const [pettyCashMovements, setPettyCashMovements] = useState<
    Array<{ id: string; time: string; type: "IN" | "OUT"; amount: number; reason: string; voucherNo?: string; authorizedBy?: string; department?: string }>
  >([
    { id: "mov-1", time: "11:30 AM", type: "OUT", amount: 250, reason: "Phlebotomy Ice Pack & Dry Ice Supplies", voucherNo: "PV-2026-081", authorizedBy: "Dr. S. K. Rao", department: "Central Phlebotomy" },
    { id: "mov-2", time: "02:15 PM", type: "OUT", amount: 180, reason: "Urgent Biopsy Specimen Courier to Histopathology", voucherNo: "PV-2026-082", authorizedBy: "Jaya Ashapurama", department: "Histopathology" },
    { id: "mov-3", time: "09:00 AM", type: "IN", amount: 26250, reason: "Shift Opening Float Till Allocation", voucherNo: "FLOAT-ALLOC-01", authorizedBy: "Cash Office", department: "Central Cashier Desk" },
  ]);
  const [pettyAmount, setPettyAmount] = useState("");
  const [pettyType, setPettyType] = useState<"IN" | "OUT">("OUT");
  const [pettyReason, setPettyReason] = useState("");
  const [isPettyModalOpen, setIsPettyModalOpen] = useState(false);

  // Advances & Wallet Tab State
  const [advancesSearch, setAdvancesSearch] = useState("");
  const [advancesCategoryFilter, setAdvancesCategoryFilter] = useState("ALL");
  const [selectedPatientLedger, setSelectedPatientLedger] = useState<any | null>(null);
  const [patientAdvanceAccounts, setPatientAdvanceAccounts] = useState<any[]>([
    {
      id: "adv-1",
      patientName: "Panchal Ashokkumar",
      uhid: "UHID-24811",
      phone: "+91 98765 43210",
      age: 48,
      gender: "Male",
      category: "HEALTH_PACKAGE",
      categoryLabel: "Annual Health Checkup Advance",
      totalDeposited: 12500,
      totalUtilized: 7500,
      availableBalance: 5000,
      lastActivityDate: "2026-09-26T17:55:00",
      lastActivityRef: "REC-2026-1001",
      status: "ACTIVE",
      history: [
        { id: "h-1", date: "2026-09-26T17:55:00", type: "UTILIZED", amount: 5040, reference: "ORD-2026-8636", description: "Comprehensive Metabolic Panel & Lipid Profile", balanceAfter: 5000 },
        { id: "h-2", date: "2026-09-20T10:00:00", type: "UTILIZED", amount: 2460, reference: "ORD-2026-8102", description: "Thyroid & Glycated Hemoglobin (HbA1c)", balanceAfter: 10040 },
        { id: "h-3", date: "2026-09-15T09:30:00", type: "DEPOSIT", amount: 12500, reference: "ADV-2026-0034", description: "Executive Preventive Health Package Advance Deposit", balanceAfter: 12500 },
      ],
    },
    {
      id: "adv-2",
      patientName: "Rina Patel",
      uhid: "UHID-24813",
      phone: "+91 98251 44552",
      age: 36,
      gender: "Female",
      category: "OPD_WALLET",
      categoryLabel: "Biopsy Histopathology Deposit",
      totalDeposited: 6000,
      totalUtilized: 3600,
      availableBalance: 2400,
      lastActivityDate: "2026-09-25T11:20:00",
      lastActivityRef: "REC-2026-0982",
      status: "ACTIVE",
      history: [
        { id: "h-4", date: "2026-09-25T11:20:00", type: "UTILIZED", amount: 3600, reference: "ORD-2026-8550", description: "Punch Biopsy Special Staining", balanceAfter: 2400 },
        { id: "h-5", date: "2026-09-22T14:15:00", type: "DEPOSIT", amount: 6000, reference: "ADV-2026-0029", description: "Histopathology Advanced Processing Advance", balanceAfter: 6000 },
      ],
    },
    {
      id: "adv-3",
      patientName: "Suresh Mehta",
      uhid: "UHID-24820",
      phone: "+91 94280 12345",
      age: 62,
      gender: "Male",
      category: "IPD_DEPOSIT",
      categoryLabel: "Inpatient Admission Advance",
      totalDeposited: 25000,
      totalUtilized: 14500,
      availableBalance: 10500,
      lastActivityDate: "2026-09-24T16:40:00",
      lastActivityRef: "REC-2026-0941",
      status: "ACTIVE",
      history: [
        { id: "h-6", date: "2026-09-24T16:40:00", type: "UTILIZED", amount: 14500, reference: "ORD-2026-8488", description: "Cardiac Biomarkers & Daily Ward Blood Tests", balanceAfter: 10500 },
        { id: "h-7", date: "2026-09-23T08:00:00", type: "DEPOSIT", amount: 25000, reference: "ADV-2026-0021", description: "Inpatient Daycare Diagnostic Float Deposit", balanceAfter: 25000 },
      ],
    },
    {
      id: "adv-4",
      patientName: "Meena Chawla",
      uhid: "UHID-24824",
      phone: "+91 97245 99881",
      age: 52,
      gender: "Female",
      category: "OPD_WALLET",
      categoryLabel: "Routine Outpatient Wallet",
      totalDeposited: 5000,
      totalUtilized: 3200,
      availableBalance: 1800,
      lastActivityDate: "2026-09-23T15:10:00",
      lastActivityRef: "REC-2026-0925",
      status: "ACTIVE",
      history: [
        { id: "h-8", date: "2026-09-23T15:10:00", type: "UTILIZED", amount: 3200, reference: "ORD-2026-8410", description: "Thyroid & Lipid Profile Pre-payment", balanceAfter: 1800 },
        { id: "h-9", date: "2026-09-18T10:30:00", type: "DEPOSIT", amount: 5000, reference: "ADV-2026-0017", description: "Family Diagnostic Wallet Top-up", balanceAfter: 5000 },
      ],
    },
    {
      id: "adv-5",
      patientName: "Vikram Singhania",
      uhid: "UHID-24830",
      phone: "+91 98112 33445",
      age: 41,
      gender: "Male",
      category: "CORPORATE_COPAY",
      categoryLabel: "Corporate Health Screening Deposit",
      totalDeposited: 15000,
      totalUtilized: 15000,
      availableBalance: 0,
      lastActivityDate: "2026-09-22T17:00:00",
      lastActivityRef: "REC-2026-0899",
      status: "EXHAUSTED",
      history: [
        { id: "h-10", date: "2026-09-22T17:00:00", type: "UTILIZED", amount: 15000, reference: "ORD-2026-8340", description: "Executive Full Body Wellness Screening Panel", balanceAfter: 0 },
        { id: "h-11", date: "2026-09-10T12:00:00", type: "DEPOSIT", amount: 15000, reference: "ADV-2026-0008", description: "Corporate Employee Medical Scheme Deposit", balanceAfter: 15000 },
      ],
    },
  ]);

  // Refunds Tab State
  const [refundStatusFilter, setRefundStatusFilter] = useState("ALL");
  const [refundSearch, setRefundSearch] = useState("");
  const [refundsList, setRefundsList] = useState<any[]>([
    {
      id: "REF-2026-091",
      creditNoteNumber: "CN-2026-0041",
      transactionId: "TXN-366",
      receiptNumber: "REC-2026-1004",
      orderNumber: "ORD-2026-8651",
      patientName: "Anita Verma",
      patientUhid: "UHID-24816",
      phone: "+91 98700 11223",
      originalAmount: 6350,
      refundAmount: 6350,
      refundMode: "NET_BANKING",
      reasonCode: "CLINICAL_CANCEL",
      reasonTitle: "Test Cancelled by Treating Physician",
      reasonDescription: "Treating consultant cancelled clinical request prior to sample phlebotomy. Patient given 100% reversal.",
      status: "PENDING_APPROVAL",
      requestedBy: "Jaya Ashapurama (Cashier)",
      authorizedBy: "Dr. K. S. Trivedi (Medical Supdt)",
      requestedAt: "2026-09-26T14:10:00",
      utr: "NEFT2026092688219",
    },
    {
      id: "REF-2026-088",
      creditNoteNumber: "CN-2026-0038",
      transactionId: "TXN-290",
      receiptNumber: "REC-2026-0945",
      orderNumber: "ORD-2026-8512",
      patientName: "Dhaval Shah",
      patientUhid: "UHID-24790",
      phone: "+91 98980 55667",
      originalAmount: 1200,
      refundAmount: 1200,
      refundMode: "CASH",
      reasonCode: "DUPLICATE_SWIPE",
      reasonTitle: "Duplicate EDC Card Terminal Charge",
      reasonDescription: "Duplicate swipe authorization on Counter 02 POS machine during network glitch.",
      status: "PROCESSED",
      requestedBy: "Riya Patel (Cashier)",
      authorizedBy: "Sunita Deshmukh (Accounts Head)",
      requestedAt: "2026-09-25T16:30:00",
      processedAt: "2026-09-25T16:45:00",
      utr: "CASH-TILL-VCH-88",
    },
    {
      id: "REF-2026-085",
      creditNoteNumber: "CN-2026-0035",
      transactionId: "TXN-244",
      receiptNumber: "REC-2026-0902",
      orderNumber: "ORD-2026-8460",
      patientName: "Kiran Bala",
      patientUhid: "UHID-24765",
      phone: "+91 94140 88221",
      originalAmount: 2000,
      refundAmount: 2000,
      refundMode: "UPI",
      reasonCode: "SAMPLE_REJECTED",
      reasonTitle: "Severe Haemolysis - Patient Refused Redraw",
      reasonDescription: "Gross haemolysis on lithium heparin tube. Patient unable to return for repeat sample redraw.",
      status: "PROCESSED",
      requestedBy: "Prakash Mehta (Phlebotomy)",
      authorizedBy: "Dr. S. K. Rao (Lab Director)",
      requestedAt: "2026-09-24T18:00:00",
      processedAt: "2026-09-24T18:15:00",
      utr: "UPIPAY20260924102",
    },
    {
      id: "REF-2026-082",
      creditNoteNumber: "CN-2026-0032",
      transactionId: "TXN-211",
      receiptNumber: "REC-2026-0870",
      orderNumber: "ORD-2026-8401",
      patientName: "Girish Patel",
      patientUhid: "UHID-24740",
      phone: "+91 99099 12344",
      originalAmount: 4500,
      refundAmount: 4500,
      refundMode: "PATIENT_WALLET",
      reasonCode: "OUT_OF_STOCK",
      reasonTitle: "Analyzer Reagent Lot Stockout",
      reasonDescription: "Specialized autoimmune ANA immunofluorescence kit reagent delay from supplier.",
      status: "APPROVED",
      requestedBy: "Jaya Ashapurama (Cashier)",
      authorizedBy: "Dr. K. S. Trivedi (Medical Supdt)",
      requestedAt: "2026-09-24T10:15:00",
      processedAt: "2026-09-24T11:00:00",
      utr: "WALLET-CR-24811",
    },
  ]);

  // Settlements Table State with EDC Terminal identifiers
  const [settlementProviderFilter, setSettlementProviderFilter] = useState("ALL");
  const [settlementBatches, setSettlementBatches] = useState<any[]>([
    {
      id: "SET-2026-441",
      terminalId: "PINE-TID-884",
      counter: "Counter 01 (Main OPD)",
      provider: "PineLabs Card POS Terminal",
      txnCount: 24,
      gross: 34500,
      fees: 517.5,
      net: 33982.5,
      utr: "UTRIB20260926041",
      status: "SETTLED",
      date: "2026-09-26",
      closedBy: "Jaya Ashapurama",
    },
    {
      id: "SET-2026-442",
      terminalId: "RAZOR-QR-001",
      counter: "Counter 01 & 02",
      provider: "Razorpay Dynamic BharatQR",
      txnCount: 19,
      gross: 21800,
      fees: 0,
      net: 21800,
      utr: "UPIPAY20260926992",
      status: "SETTLED",
      date: "2026-09-26",
      closedBy: "Auto Gateway Reconcile",
    },
    {
      id: "SET-2026-443",
      terminalId: "HDFC-POS-029",
      counter: "Counter 02 (Stat Emergency)",
      provider: "HDFC Card Terminal 02",
      txnCount: 8,
      gross: 12500,
      fees: 187.5,
      net: 12312.5,
      utr: "PENDING_CREDIT",
      status: "PENDING",
      date: "2026-09-26",
      closedBy: "Riya Patel",
    },
    {
      id: "SET-2026-444",
      terminalId: "ICICI-EDC-338",
      counter: "Counter 03 (Collection Center)",
      provider: "ICICI POS Terminal 03",
      txnCount: 5,
      gross: 8900,
      fees: 133.5,
      net: 8766.5,
      utr: "PENDING_CREDIT",
      status: "PENDING",
      date: "2026-09-25",
      closedBy: "Prakash Mehta",
    },
  ]);
  const [selectedSettlementSlip, setSelectedSettlementSlip] = useState<any | null>(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState<any | null>(null);
  const [isDenominationPrintOpen, setIsDenominationPrintOpen] = useState(false);

  // Reconciliation Table State
  const [reconcileTab, setReconcileTab] = useState<"ALL" | "MATCHED" | "PENDING" | "DISCREPANCY">("ALL");
  const [reconcileFilter, setReconcileFilter] = useState<"ALL" | "MATCHED" | "PENDING">("ALL");
  const [reconcileSearch, setReconcileSearch] = useState("");
  const [reconcileList, setReconcileList] = useState<any[]>([
    {
      id: "REC-RC-01",
      date: "2026-09-26T17:55:00",
      receiptNumber: "REC-2026-1001",
      uhid: "UHID-24811",
      patientName: "Panchal Ashokkumar",
      channel: "CARD_PINELABS",
      channelLabel: "PineLabs Card POS (Terminal 01)",
      systemAmount: 5040,
      bankFeedAmount: 5040,
      bankRef: "UTRIB20260926041",
      variance: 0,
      matchStatus: "MATCHED",
      notes: "Auto-reconciled with PineLabs settlement batch",
    },
    {
      id: "REC-RC-02",
      date: "2026-09-26T09:30:00",
      receiptNumber: "REC-2026-1002",
      uhid: "UHID-24812",
      patientName: "Seema Shah",
      channel: "UPI_DYNAMIC_QR",
      channelLabel: "Razorpay Dynamic BharatQR",
      systemAmount: 2780,
      bankFeedAmount: 2780,
      bankRef: "UPIPAY20260926992",
      variance: 0,
      matchStatus: "MATCHED",
      notes: "Instant UPI webhook verified",
    },
    {
      id: "REC-RC-03",
      date: "2026-09-26T12:15:00",
      receiptNumber: "REC-2026-1003",
      uhid: "UHID-24815",
      patientName: "Nirav Joshi",
      channel: "CASH_TILL",
      channelLabel: "Physical Cash Register 01",
      systemAmount: 15400,
      bankFeedAmount: 15400,
      bankRef: "CASH-VAULT-2609",
      variance: 0,
      matchStatus: "MATCHED",
      notes: "Tally matched with shift opening float & drawer",
    },
    {
      id: "REC-RC-04",
      date: "2026-09-25T18:05:00",
      receiptNumber: "REC-2026-1004",
      uhid: "UHID-24816",
      patientName: "Anita Verma",
      channel: "NEFT_IMPS",
      channelLabel: "Bank NEFT Direct Transfer",
      systemAmount: 6350,
      bankFeedAmount: 6350,
      bankRef: "NEFT202609254410",
      variance: 0,
      matchStatus: "MATCHED",
      notes: "Hospital Current Account statement verified",
    },
    {
      id: "REC-RC-05",
      date: "2026-09-26T08:00:00",
      receiptNumber: "REC-2026-1005",
      uhid: "UHID-24819",
      patientName: "Harshad Shah",
      channel: "CHEQUE",
      channelLabel: "Cheque Clearance (HDFC Bank)",
      systemAmount: 9200,
      bankFeedAmount: 0,
      bankRef: "CHQ-884019",
      variance: 9200,
      matchStatus: "PENDING_BANK",
      notes: "Cheque deposited in bank clearing drop box; clearing pending (T+2)",
    },
    {
      id: "REC-RC-06",
      date: "2026-09-26T14:40:00",
      receiptNumber: "REC-2026-1009",
      uhid: "UHID-24828",
      patientName: "Vipul Rawal",
      channel: "CARD_HDFC",
      channelLabel: "HDFC Card Terminal 02",
      systemAmount: 3400,
      bankFeedAmount: 3400,
      bankRef: "HDFC-RRN-99201",
      variance: 0,
      matchStatus: "MATCHED",
      notes: "Settled in batch SET-2026-443",
    },
  ]);

  // Reports Tab State
  const [activeReportView, setActiveReportView] = useState<
    "DAY_BOOK" | "MODE_WISE" | "CASHIER_TALLY" | "GST_SAC" | "DEPARTMENT" | "DOCTOR_REFERRAL"
  >("DAY_BOOK");
  const [reportDateRange, setReportDateRange] = useState("Today");

  // Audit Log Tab State
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLogsList, setAuditLogsList] = useState<any[]>([
    {
      id: "AUD-2026-9041",
      timestamp: "2026-09-26T17:55:12",
      category: "PAYMENT",
      categoryLabel: "Payment Collected",
      actor: "Jaya Ashapurama",
      actorEmpCode: "EMP-104",
      counter: "Counter 01",
      terminalIp: "192.168.1.45 (POS-01)",
      action: "Card Tender Verified & Receipt Generated",
      description: "Collected ₹5,040.00 via CARD for ORD-2026-8636 (REC-2026-1001)",
      entityRef: "REC-2026-1001",
      patientUhid: "UHID-24811",
      severity: "INFO",
    },
    {
      id: "AUD-2026-9038",
      timestamp: "2026-09-26T16:20:45",
      category: "DISCOUNT_OVERRIDE",
      categoryLabel: "Special Billing Waiver",
      actor: "Dr. K. S. Trivedi",
      actorEmpCode: "EMP-012",
      counter: "Admin Office",
      terminalIp: "192.168.1.10 (MS-DESK)",
      action: "Authorised 15% Compassionate Concession",
      description: "Applied ₹750.00 institutional discount on Histopathology order ORD-2026-8640",
      entityRef: "ORD-2026-8640",
      patientUhid: "UHID-24812",
      severity: "SUPERVISOR_OVERRIDE",
    },
    {
      id: "AUD-2026-9034",
      timestamp: "2026-09-26T14:10:00",
      category: "REFUND",
      categoryLabel: "Refund Initiated",
      actor: "Jaya Ashapurama",
      actorEmpCode: "EMP-104",
      counter: "Counter 01",
      terminalIp: "192.168.1.45 (POS-01)",
      action: "Refund Request Logged & Routed to Supdt",
      description: "Initiated ₹6,350.00 refund request for Anita Verma (Test cancelled before phlebotomy)",
      entityRef: "REF-2026-091",
      patientUhid: "UHID-24816",
      severity: "FINANCIAL_IMPACT",
    },
    {
      id: "AUD-2026-9029",
      timestamp: "2026-09-26T12:15:30",
      category: "PAYMENT",
      categoryLabel: "Payment Collected",
      actor: "Prakash Mehta",
      actorEmpCode: "EMP-108",
      counter: "Counter 01",
      terminalIp: "192.168.1.45 (POS-01)",
      action: "Cash Tender Registered",
      description: "Collected ₹15,400.00 in physical cash for ORD-2026-8645 (REC-2026-1003)",
      entityRef: "REC-2026-1003",
      patientUhid: "UHID-24815",
      severity: "INFO",
    },
    {
      id: "AUD-2026-9021",
      timestamp: "2026-09-26T11:30:15",
      category: "TILL_FLOAT",
      categoryLabel: "Petty Cash Outflow",
      actor: "Jaya Ashapurama",
      actorEmpCode: "EMP-104",
      counter: "Counter 01",
      terminalIp: "192.168.1.45 (POS-01)",
      action: "Disbursed Emergency Phlebotomy Supplies Expense",
      description: "Petty voucher ₹250.00 for Phlebotomy Ice Pack & Dry Ice",
      entityRef: "VCH-2026-0081",
      severity: "FINANCIAL_IMPACT",
    },
    {
      id: "AUD-2026-9015",
      timestamp: "2026-09-26T08:30:00",
      category: "TILL_FLOAT",
      categoryLabel: "Till Register Opened",
      actor: "Jaya Ashapurama",
      actorEmpCode: "EMP-104",
      counter: "Counter 01",
      terminalIp: "192.168.1.45 (POS-01)",
      action: "Opening Float Verified & Till Locked",
      description: "Opening cash float verified at ₹26,250.00 across 7 physical denominations",
      entityRef: "SHIFT-2026-0926-A1",
      severity: "INFO",
    },
  ]);

  // Modals
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<any | null>(null);
  const [selectedDetailPaymentId, setSelectedDetailPaymentId] = useState<string | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [initialCollectOrderId, setInitialCollectOrderId] = useState("");
  const [initialCollectAmount, setInitialCollectAmount] = useState("");

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [initialAdvancePatientId, setInitialAdvancePatientId] = useState("");

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [initialRefundPaymentId, setInitialRefundPaymentId] = useState("");
  const [initialRefundAmount, setInitialRefundAmount] = useState("");

  const [isShiftHandoverOpen, setIsShiftHandoverOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // WhatsApp Modal
  const [whatsAppModalData, setWhatsAppModalData] = useState<any | null>(null);

  // Notification Dispatch Modal
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyPayload, setNotifyPayload] = useState<NotificationPayload | null>(null);

  // URL State Synchronization (Level 4)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab')?.toLowerCase();
      if (tabParam && TAB_SLUG_MAP[tabParam]) {
        setActiveTab(TAB_SLUG_MAP[tabParam]);
      } else if (urlParams.has('tab') && paymentTabs.includes(urlParams.get('tab') as any)) {
        setActiveTab(urlParams.get('tab') as any);
      }
      if (urlParams.has('status')) setStatusFilter(urlParams.get('status') || "All");
      if (urlParams.has('method')) setMethodFilter(urlParams.get('method') || "All");
      if (urlParams.has('date')) setDateFilter(urlParams.get('date') || "All");
      if (urlParams.has('search')) setSearch(urlParams.get('search') || "");
      if (urlParams.has('aging')) setAgingFilter(urlParams.get('aging') as any);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const slug = TAB_TO_SLUG[activeTab];
      if (slug) url.searchParams.set("tab", slug);
      else url.searchParams.delete("tab");

      if (statusFilter !== "All") url.searchParams.set("status", statusFilter);
      else url.searchParams.delete("status");

      if (methodFilter !== "All") url.searchParams.set("method", methodFilter);
      else url.searchParams.delete("method");

      if (dateFilter !== "All") url.searchParams.set("date", dateFilter);
      else url.searchParams.delete("date");

      if (search) url.searchParams.set("search", search);
      else url.searchParams.delete("search");

      window.history.replaceState(null, '', url.toString());
    }
  }, [activeTab, statusFilter, methodFilter, dateFilter, search]);

  const handleNotifyPayment = (payment: Payment) => {
    setNotifyPayload({
      patientId: payment.patientId,
      patientName: payment.patientName,
      phone: payment.phone,
      email: payment.patientEmail || undefined,
      uhid: payment.patientUhid,
      context: "PAYMENT",
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      dueBalance: payment.invoiceBalance,
      orderNumber: payment.orderNumber,
      date: payment.paidAt,
    });
    setNotifyModalOpen(true);
  };

  // Recent Payment Ledger Advanced State
  const [expandedLedgerRowId, setExpandedLedgerRowId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [ledgerQuickFilter, setLedgerQuickFilter] = useState<
    "ALL" | "CASH" | "UPI" | "CARD" | "NET_BANKING" | "CHEQUE" | "REFUNDED"
  >("ALL");

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedText(text);
    showNotification(`${label} copied: ${text}`, "info");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  useEffect(() => {
    fetchMetrics();
    fetchPayments();
    fetchOrdersAndPatients();

    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlOrderId = params.get("orderId");
        const urlPatientId = params.get("patientId");
        const urlAmount = params.get("amount");
        const urlTab = params.get("tab");

        if (urlTab) {
          const lower = urlTab.toLowerCase();
          if (TAB_SLUG_MAP[lower]) {
            setActiveTab(TAB_SLUG_MAP[lower]);
          } else if (paymentTabs.includes(urlTab as PaymentTab)) {
            setActiveTab(urlTab as PaymentTab);
          }
        }

        if (urlOrderId) {
          setInitialCollectOrderId(urlOrderId);
          if (urlAmount) setInitialCollectAmount(urlAmount);
          setIsCollectModalOpen(true);
        } else if (urlPatientId) {
          setInitialAdvancePatientId(urlPatientId);
          if (urlAmount) {
            setInitialCollectAmount(urlAmount);
            setIsCollectModalOpen(true);
          }
        }
      } catch (e) {
        console.error("Error reading URL search params:", e);
      }
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await paymentApi.getMetrics();
      if (response?.success && response?.data) {
        const data = response.data as Partial<SummaryStats>;
        setSummary({
          totalCollection: data.totalCollection ?? 0,
          todayCollection: data.todayCollection ?? 0,
          cashInHand: data.cashInHand ?? 0,
          digitalPayments: data.digitalPayments ?? 0,
          pendingSettlements: data.pendingSettlements ?? 0,
          outstandingReceivables: data.outstandingReceivables ?? 0,
          cashDrawer: data.cashDrawer ?? 0,
        });
      }
    } catch (err) {
      console.error("Payment metrics load error:", err);
    }
  };

  const fetchOrdersAndPatients = async () => {
    try {
      const [ordersRes, patientsRes] = await Promise.all([
        orderApi.getAll("limit=100").catch(() => null),
        patientApi.getAll("limit=100").catch(() => null),
      ]);

      if (ordersRes?.data) {
        const orderList = ordersRes.data.orders || ordersRes.data || [];
        setOrders(Array.isArray(orderList) ? orderList : []);
      }
      if (patientsRes?.data) {
        const patientList = patientsRes.data.patients || patientsRes.data || [];
        setPatients(Array.isArray(patientList) ? patientList : []);
      }
    } catch (err) {
      console.error("Error fetching orders & patients:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getAll("page=1&limit=100");
      if (response?.success && response?.data) {
        const payload = response.data as any;
        const rawPayments =
          payload.payments || payload.transactions || payload.items || payload.data || [];

        if (Array.isArray(rawPayments) && rawPayments.length > 0) {
          const mapped: Payment[] = rawPayments.map((item: any) => {
            const linkedOrder = item.order || {};
            const linkedPatient = linkedOrder.patient || {};
            const linkedInvoice = linkedOrder.invoice || {};

            return {
              id: item.id || `txn-${Math.random()}`,
              receiptNumber: item.receiptNumber || `REC-${item.id || "001"}`,
              transactionId: item.transactionId || `TXN-${item.id?.slice(-4) || "000"}`,
              invoiceNumber: linkedInvoice.invoiceNumber || item.invoiceNumber,
              invoiceId: linkedInvoice.id || item.invoiceId,
              orderNumber: linkedOrder.orderNumber || item.orderNumber,
              orderId: item.orderId || linkedOrder.id,
              patientId: linkedPatient.id || item.patientId,
              patientName:
                item.patientName ||
                (linkedPatient.firstName
                  ? `${linkedPatient.firstName} ${linkedPatient.lastName || ""}`.trim()
                  : "Patient"),
              patientUhid: item.patientUhid || linkedPatient.uhid,
              phone: item.phone || linkedPatient.phone || "No phone",
              patientEmail: item.patientEmail || linkedPatient.email,
              patientAge: item.patientAge || linkedPatient.age,
              patientGender: item.patientGender || linkedPatient.gender,
              amount: Number(item.amount || 0),
              method: (item.method || "CASH") as PaymentMethod,
              status: (item.status || "PAID") as PaymentStatus,
              paidAt: item.paidAt || item.createdAt || new Date().toISOString(),
              createdAt: item.createdAt || item.paidAt || new Date().toISOString(),
              collectedBy: item.receivedBy?.fullName || item.collectedBy || "Front Desk Cashier",
              counter: item.counter || "Counter 01",
              settlement: item.settlement || "SETTLED",
              remarks: item.remarks,
              invoiceTotal: linkedInvoice.grandTotal ? Number(linkedInvoice.grandTotal) : undefined,
              invoicePaid: linkedInvoice.paidAmount ? Number(linkedInvoice.paidAmount) : undefined,
              invoiceBalance: linkedInvoice.dueAmount ? Number(linkedInvoice.dueAmount) : undefined,
            };
          });

          setPayments(mapped);
        } else {
          setPayments(demoPayments);
        }
      } else {
        setPayments(demoPayments);
      }
    } catch (err) {
      console.error("Payment data load error:", err);
      setError("Unable to reach payment service. Showing current ledger.");
      setPayments(demoPayments);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMetrics(), fetchPayments(), fetchOrdersAndPatients()]);
    setIsRefreshing(false);
    showNotification("Payments dashboard refreshed successfully!", "info");
  };

  // Open Receipt
  const handleOpenReceipt = (payment: any) => {
    const linkedOrder = orders.find(
      (o) => o.id === payment.orderId || o.orderNumber === payment.orderNumber
    );

    const invTotal =
      payment.invoiceTotal ||
      (linkedOrder?.grandTotal ? Number(linkedOrder.grandTotal) : Number(payment.amount || 0));
    const isPaidInFull =
      (payment.status || "PAID") === "PAID" || Number(payment.amount || 0) >= invTotal;
    const computedBalance = isPaidInFull
      ? 0
      : payment.invoiceBalance !== undefined
      ? Number(payment.invoiceBalance)
      : linkedOrder?.dueAmount !== undefined
      ? Number(linkedOrder.dueAmount)
      : Math.max(0, invTotal - Number(payment.amount || 0));

    // Enrich items with clinical specimen tube colors & SAC codes
    const items = linkedOrder?.items?.map((item: any, idx: number) => {
      const name = item.test?.testName || item.testName || "Diagnostic Pathology Investigation";
      const sample = item.test?.sampleType || item.test?.department || "Whole Blood";
      const sLower = (sample + " " + name).toLowerCase();

      let tubeColor = "#8b5cf6";
      let tubeName = "Lavender EDTA";
      if (
        sLower.includes("serum") ||
        sLower.includes("sst") ||
        sLower.includes("lipid") ||
        sLower.includes("lft") ||
        sLower.includes("kft") ||
        sLower.includes("biochemistry")
      ) {
        tubeColor = "#eab308";
        tubeName = "Gold Gel SST";
      } else if (
        sLower.includes("fluoride") ||
        sLower.includes("glucose") ||
        sLower.includes("sugar") ||
        sLower.includes("hba1c")
      ) {
        tubeColor = "#64748b";
        tubeName = "Grey Fluoride";
      } else if (sLower.includes("citrate") || sLower.includes("coag") || sLower.includes("pt/inr")) {
        tubeColor = "#3b82f6";
        tubeName = "Light Blue Citrate";
      } else if (sLower.includes("urine")) {
        tubeColor = "#f59e0b";
        tubeName = "Sterile Container";
      }

      const itemPrice = Number(item.price || item.finalPrice || payment.amount);
      return {
        name,
        code: item.test?.testCode || item.testCode || `DIAG-${idx + 1}`,
        department: item.test?.department || "Clinical Pathology",
        sampleType: sample,
        tubeColor,
        tubeName,
        sacCode: "999312",
        price: itemPrice,
        discount: 0,
        netPrice: itemPrice,
      };
    });

    setSelectedReceiptPayment({
      id: payment.id,
      receiptNumber: payment.receiptNumber || `REC-${payment.id}`,
      orderId: payment.orderId || linkedOrder?.id || "",
      orderNumber: payment.orderNumber || linkedOrder?.orderNumber || "—",
      patientId: payment.patientId || linkedOrder?.patient?.id || "",
      patientName:
        payment.patientName ||
        (linkedOrder?.patient
          ? `${linkedOrder.patient.firstName || ""} ${linkedOrder.patient.lastName || ""}`.trim()
          : "Patient"),
      patientUhid: payment.patientUhid || linkedOrder?.patient?.uhid,
      patientPhone: payment.phone || linkedOrder?.patient?.phone || null,
      patientEmail: payment.patientEmail || linkedOrder?.patient?.email || null,
      patientAge: payment.patientAge || linkedOrder?.patient?.age || null,
      patientGender: payment.patientGender || linkedOrder?.patient?.gender || null,
      patientAddress: linkedOrder?.patient?.address || null,
      doctorName: linkedOrder?.doctor?.fullName || linkedOrder?.doctorName || null,
      doctorQualification: linkedOrder?.doctor?.specialization || null,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoiceNumber,
      invoiceTotal: invTotal,
      invoicePaid:
        payment.invoicePaid || (linkedOrder?.paidAmount ? Number(linkedOrder.paidAmount) : Number(payment.amount || 0)),
      invoiceBalance: computedBalance,
      amount: Number(payment.amount || 0),
      method: payment.method || "CASH",
      status: payment.status || "PAID",
      transactionId: payment.transactionId || null,
      remarks: payment.remarks || null,
      paidAt: payment.paidAt || new Date().toISOString(),
      createdAt: payment.createdAt || payment.paidAt || new Date().toISOString(),
      collectedBy: payment.collectedBy || "Jaya Ashapurama",
      counter: payment.counter || "Counter 01",
      settlement: payment.settlement || "SETTLED",
      items: items && items.length > 0 ? items : undefined,
      receivedBy: {
        id: "emp-104",
        fullName: payment.collectedBy || "Jaya Ashapurama",
        employeeCode: "EMP-104",
        role: "Senior Billing Cashier",
      },
    });
  };

  // Add Petty Cash Movement
  const handleAddPettyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(pettyAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const newMovement = {
      id: `mov-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: pettyType,
      amount: amt,
      reason: pettyReason || (pettyType === "OUT" ? "Petty Cash Outflow" : "Till Cash Top-up"),
    };

    setPettyCashMovements([newMovement, ...pettyCashMovements]);
    setSummary((prev) => ({
      ...prev,
      cashDrawer: pettyType === "IN" ? prev.cashDrawer + amt : prev.cashDrawer - amt,
      cashInHand: pettyType === "IN" ? prev.cashInHand + amt : prev.cashInHand - amt,
    }));

    showNotification(
      `Petty Cash ${pettyType === "IN" ? "Added" : "Deducted"}: ${formatCurrency(amt)}`,
      "info"
    );
    setPettyAmount("");
    setPettyReason("");
    setIsPettyModalOpen(false);
  };

  // Mark Settlement Reconciled
  const handleReconcileSettlement = (batchId: string) => {
    const promptUtr = prompt("Enter Bank Credit UTR / Confirmation Reference #:", `UTRIB${Date.now().toString().slice(-8)}`);
    if (!promptUtr) return;

    setSettlementBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, status: "SETTLED", utr: promptUtr }
          : b
      )
    );
    showNotification(`Batch ${batchId} reconciled with Bank UTR: ${promptUtr}!`, "success");
  };

  // Verify & Match Bank Reconciliation Item
  const handleVerifyReconciliationItem = (itemId: string) => {
    setReconcileList((prev) =>
      prev.map((r) =>
        r.id === itemId
          ? {
              ...r,
              matchStatus: "MATCHED",
              variance: 0,
              bankFeedAmount: r.systemAmount,
              notes: "Manually verified & cleared by Accounts Supervisor",
            }
          : r
      )
    );
    showNotification(`Reconciliation item ${itemId} manually cleared & matched!`, "success");
  };

  // Filtered & Sorted Payments for Transactions Table
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.receiptNumber.toLowerCase().includes(query) ||
        payment.transactionId.toLowerCase().includes(query) ||
        payment.patientName.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.orderNumber?.toLowerCase().includes(query) ||
        payment.patientUhid?.toLowerCase().includes(query) ||
        payment.phone?.toLowerCase().includes(query) ||
        payment.doctorName?.toLowerCase().includes(query) ||
        payment.department?.toLowerCase().includes(query) ||
        payment.instrumentRef?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
      const matchesMethod = methodFilter === "All" || payment.method === methodFilter;
      const matchesCounter =
        txnCounterFilter === "All" || (payment.counter || "Counter 01") === txnCounterFilter;
      const matchesEncounter =
        encounterFilter === "All" || (payment.encounterType || "OPD") === encounterFilter;

      const matchesDate = (() => {
        if (dateFilter === "All") return true;
        const date = new Date(payment.paidAt);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const yesterday = new Date(startOfToday);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7 = new Date(startOfToday);
        last7.setDate(last7.getDate() - 6);
        const last30 = new Date(startOfToday);
        last30.setDate(last30.getDate() - 29);

        switch (dateFilter) {
          case "Today":
            return date >= startOfToday;
          case "Yesterday":
            return date >= yesterday && date < startOfToday;
          case "7 Days":
            return date >= last7;
          case "30 Days":
            return date >= last30;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesMethod && matchesDate && matchesCounter && matchesEncounter;
    });

    result.sort((a, b) => {
      if (sortField === "paidAt") {
        const timeA = new Date(a.paidAt).getTime();
        const timeB = new Date(b.paidAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "amount") {
        return sortAsc ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortField === "patientName") {
        return sortAsc
          ? a.patientName.localeCompare(b.patientName)
          : b.patientName.localeCompare(a.patientName);
      }
      return 0;
    });

    return result;
  }, [payments, search, statusFilter, methodFilter, dateFilter, sortField, sortAsc, txnCounterFilter, encounterFilter]);

  // Paginated Payments
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Recent Payment Ledger Filtered List (for Overview tab)
  const displayedLedgerPayments = useMemo(() => {
    let list = filteredPayments;
    if (ledgerQuickFilter === "CASH") list = list.filter((p) => p.method === "CASH");
    else if (ledgerQuickFilter === "UPI") list = list.filter((p) => p.method === "UPI");
    else if (ledgerQuickFilter === "CARD") list = list.filter((p) => p.method === "CARD");
    else if (ledgerQuickFilter === "NET_BANKING") list = list.filter((p) => p.method === "NET_BANKING");
    else if (ledgerQuickFilter === "CHEQUE") list = list.filter((p) => p.method === "CHEQUE");
    else if (ledgerQuickFilter === "REFUNDED")
      list = list.filter((p) => p.status === "REFUNDED" || p.status === "REFUND_PENDING" || p.status === "PARTIALLY_REFUNDED");
    return list.slice(0, 15);
  }, [filteredPayments, ledgerQuickFilter]);

  // Payment Mix Distribution
  const paymentMix = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      UPI: 0,
      NET_BANKING: 0,
      CHEQUE: 0,
      OTHER: 0,
    };
    payments.forEach((payment) => {
      if (totals[payment.method] !== undefined) {
        totals[payment.method] += payment.amount;
      }
    });
    const overallSum = payments.reduce((sum, item) => sum + item.amount, 0) || 1;
    return Object.entries(totals).map(([method, amount]) => ({
      method: method as PaymentMethod,
      amount,
      share: (amount / overallSum) * 100,
    }));
  }, [payments]);

  // Receivables list & aging buckets
  const receivablesOrders = useMemo(() => {
    return orders
      .filter((o) => o.paymentStatus !== "PAID")
      .map((o) => {
        const grandTotal = Number(o.grandTotal || o.invoice?.grandTotal || 0);
        const paidAmount = Number(o.paidAmount || o.invoice?.paidAmount || 0);
        const dueAmount = Math.max(0, grandTotal - paidAmount);
        const createdDate = new Date(o.createdAt || Date.now());
        const daysDiff = Math.max(
          0,
          Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        let bucket: "CURRENT" | "8-15" | "16-30" | "30+" = "CURRENT";
        if (daysDiff > 30) bucket = "30+";
        else if (daysDiff >= 16) bucket = "16-30";
        else if (daysDiff >= 8) bucket = "8-15";

        return {
          ...o,
          computedDue: dueAmount,
          computedTotal: grandTotal,
          daysDiff,
          agingBucket: bucket,
        };
      })
      .filter((o) => {
        if (agingFilter === "ALL") return true;
        return o.agingBucket === agingFilter;
      });
  }, [orders, agingFilter]);

  // Export to CSV with Formula Injection Protection (CWE-1236)
  const handleExportCSV = () => {
    const sanitizeCsvCell = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r%]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = [
      "Receipt Number",
      "Transaction ID",
      "Patient Name",
      "UHID",
      "Phone",
      "Order Number",
      "Invoice Number",
      "Amount (INR)",
      "Payment Method",
      "Status",
      "Paid At",
      "Collected By",
      "Counter",
    ];

    const rows = filteredPayments.map((p) => [
      sanitizeCsvCell(p.receiptNumber),
      sanitizeCsvCell(p.transactionId),
      sanitizeCsvCell(p.patientName),
      sanitizeCsvCell(p.patientUhid || ""),
      sanitizeCsvCell(p.phone || ""),
      sanitizeCsvCell(p.orderNumber || ""),
      sanitizeCsvCell(p.invoiceNumber || ""),
      sanitizeCsvCell(p.amount),
      sanitizeCsvCell(p.method),
      sanitizeCsvCell(p.status),
      sanitizeCsvCell(formatDateTime(p.paidAt)),
      sanitizeCsvCell(p.collectedBy || ""),
      sanitizeCsvCell(p.counter || ""),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabCore_Payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Transactions exported to CSV securely!", "success");
  };

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6 pb-12">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
              notification.type === "success"
                ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                : notification.type === "error"
                ? "border border-rose-300 bg-rose-50 text-rose-900"
                : "border border-sky-300 bg-sky-50 text-sky-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : notification.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-rose-600" />
              ) : (
                <HelpCircle className="h-5 w-5 text-sky-600" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Hospital Header Banner - Clean Light-White Clinical Command Center */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  <Building2 className="h-3 w-3 text-blue-700" />
                  ELIS Clinical Hospital & Diagnostic Billing Desk
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  NABL ISO 15189:2022
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                  SAC 999312 (Nil GST)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Counter 01 Active
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f2d52] tracking-tight">
                Healthcare Billing & Financial Revenue Operations
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
                Multi-counter cash registers, EDC card settlements, advance wallets, clinical refund approvals, bank reconciliation & statutory audit reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInitialCollectOrderId("");
                  setInitialCollectAmount("");
                  setIsCollectModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Collect Bill Payment
              </button>

              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 shadow-2xs"
              >
                <Wallet className="h-4 w-4 text-blue-600" />
                + Patient Advance
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialRefundPaymentId("");
                  setInitialRefundAmount("");
                  setIsRefundModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/60 px-3.5 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100/60 active:scale-95"
              >
                <RotateCcw className="h-4 w-4 text-rose-600" />
                Refund / Credit Note
              </button>

              <button
                type="button"
                onClick={() => setIsShiftHandoverOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-2xs transition hover:bg-amber-300 active:scale-95"
              >
                <Clock className="h-4 w-4" />
                Close Till
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-600" />
                Report Studio
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 shadow-2xs"
                title="Refresh Live Financial Ledger"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar with Clinical Icons & Live Badges */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {paymentTabs.map((tab) => {
            const getTabIcon = () => {
              switch (tab) {
                case "Overview":
                  return <Layers className="h-3.5 w-3.5" />;
                case "Transactions":
                  return <Receipt className="h-3.5 w-3.5" />;
                case "Cash Counter":
                  return <Coins className="h-3.5 w-3.5" />;
                case "Advances & Wallet":
                  return <Wallet className="h-3.5 w-3.5" />;
                case "Refunds":
                  return <RotateCcw className="h-3.5 w-3.5" />;
                case "Settlements":
                  return <CreditCard className="h-3.5 w-3.5" />;
                case "Reconciliation":
                  return <Scale className="h-3.5 w-3.5" />;
                case "Reports":
                  return <FileSpreadsheet className="h-3.5 w-3.5" />;
                case "Audit Log":
                  return <ShieldCheck className="h-3.5 w-3.5" />;
                default:
                  return null;
              }
            };

            const getBadge = () => {
              if (tab === "Transactions") return filteredPayments.length;
              if (tab === "Cash Counter") return pettyCashMovements.length;
              if (tab === "Advances & Wallet") return patientAdvanceAccounts.length;
              if (tab === "Refunds") return refundsList.filter((r) => r.status === "PENDING_APPROVAL").length;
              if (tab === "Settlements") return settlementBatches.filter((b) => b.status === "PENDING").length;
              if (tab === "Reconciliation") return reconcileList.filter((r) => r.matchStatus !== "MATCHED").length;
              if (tab === "Audit Log") return auditLogsList.length;
              return null;
            };

            const badge = getBadge();
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-[#0f2d52] text-white shadow-xs ring-1 ring-[#0f2d52]"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span className={isActive ? "text-blue-200" : "text-slate-500"}>
                  {getTabIcon()}
                </span>
                <span>{tab}</span>
                {badge !== null && badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : tab === "Refunds"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : tab === "Settlements" || tab === "Reconciliation"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4 Core Financial KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Today's Collections"
            value={formatCurrency(summary.todayCollection)}
            note="Gross receipts verified today"
            accent="from-blue-600 to-indigo-600"
            meta="Cash + Digital Combined"
            icon="₹"
          />
          <StatCard
            title="Cash Drawer (Till)"
            value={formatCurrency(summary.cashDrawer)}
            note={`Active: ${activeCounter}`}
            accent="from-emerald-600 to-teal-600"
            meta="Expected cash in register"
            icon="💵"
          />
          <StatCard
            title="Outstanding Receivables"
            value={formatCurrency(summary.outstandingReceivables)}
            note={`${orders.filter((o) => o.paymentStatus !== "PAID").length} pending test orders`}
            accent="from-amber-500 to-orange-600"
            meta="Aging: 0 to 30+ days"
            icon="⏳"
          />
          <StatCard
            title="Pending Settlements"
            value={formatCurrency(summary.pendingSettlements)}
            note={`${settlementBatches.filter((b) => b.status === "PENDING").length} terminal batches`}
            accent="from-violet-600 to-purple-600"
            meta="PineLabs / Razorpay / UPI"
            icon="🏦"
          />
        </div>

        {/* TAB 1: OVERVIEW TAB CONTENT */}
        {activeTab === "Overview" && (
          <div className="grid gap-6 xl:grid-cols-[1.75fr_0.95fr]">
            {/* Left: Advanced Recent Payment Ledger (Hospital Light-White Clinical Desk) */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition">
              {/* Operations Command Bar Header */}
              <div className="border-b border-slate-100 bg-white px-6 py-5 text-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold tracking-tight text-slate-900">
                            Recent Cashier Tender Ledger
                          </h2>
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                            {filteredPayments.length} Active Stream
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Real-time counter collections, POS authorizations, fiscal receipts & shift reconciliation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Till Counter Active
                    </span>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search patient, receipt, UHID..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-7 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 sm:w-56"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                      title="Export CSV"
                    >
                      <Download className="h-3.5 w-3.5 text-sky-600" />
                      CSV
                    </button>

                    <button
                      onClick={() => {
                        setInitialCollectOrderId("");
                        setInitialCollectAmount("");
                        setIsCollectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-600 active:scale-95 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Collect
                    </button>
                  </div>
                </div>

                {/* View Switchers & High-Yield Metric Counters */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                      Tender View:
                    </span>
                    {[
                      { id: "ALL", label: `All (${filteredPayments.length})` },
                      {
                        id: "CASH",
                        label: `💵 Cash (${filteredPayments.filter((p) => p.method === "CASH").length})`,
                      },
                      {
                        id: "UPI",
                        label: `📱 UPI / QR (${filteredPayments.filter((p) => p.method === "UPI").length})`,
                      },
                      {
                        id: "CARD",
                        label: `💳 Card POS (${filteredPayments.filter((p) => p.method === "CARD").length})`,
                      },
                      {
                        id: "NET_BANKING",
                        label: `🏦 Net Banking (${filteredPayments.filter((p) => p.method === "NET_BANKING").length})`,
                      },
                      {
                        id: "CHEQUE",
                        label: `🧾 Cheque (${filteredPayments.filter((p) => p.method === "CHEQUE").length})`,
                      },
                      {
                        id: "REFUNDED",
                        label: `↩ Refunded (${
                          filteredPayments.filter(
                            (p) =>
                              p.status === "REFUNDED" ||
                              p.status === "REFUND_PENDING" ||
                              p.status === "PARTIALLY_REFUNDED"
                          ).length
                        })`,
                      },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => setLedgerQuickFilter(chip.id as any)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          ledgerQuickFilter === chip.id
                            ? "bg-[#0f2d52] text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">
                      Cash: {formatCurrency(filteredPayments.filter((p) => p.method === "CASH").reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                    <span className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-800">
                      Digital: {formatCurrency(filteredPayments.filter((p) => p.method !== "CASH").reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <tr>
                      {/* 1. TRANSACTION */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="h-3.5 w-3.5 text-sky-600" />
                          <span>Transaction</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Txn ID • Receipt • Till
                        </span>
                      </th>

                      {/* 2. PATIENT */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Patient Info</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Name • UHID • Phone
                        </span>
                      </th>

                      {/* 3. ORDER / INVOICE */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Order / Invoice</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Order # • Invoice Link
                        </span>
                      </th>

                      {/* 4. AMOUNT */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                          <span>Tender Amount</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Gross Collected
                        </span>
                      </th>

                      {/* 5. METHOD */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-sky-600" />
                          <span>Payment Method</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Tender Channel
                        </span>
                      </th>

                      {/* 6. STATUS */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-teal-600" />
                          <span>Status</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Settlement State
                        </span>
                      </th>

                      {/* 7. DATE & TIME */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Date & Time</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Timestamp • Cashier
                        </span>
                      </th>

                      {/* 8. ACTIONS */}
                      <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        <div className="flex items-center justify-end gap-1.5">
                          <PenLine className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Actions</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Receipt & Controls
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedLedgerPayments.length > 0 ? (
                      displayedLedgerPayments.map((payment) => {
                        const isExpanded = expandedLedgerRowId === payment.id;
                        const linkedOrder = orders.find(
                          (o) => o.id === payment.orderId || o.orderNumber === payment.orderNumber
                        );
                        const testsList = linkedOrder?.items || [];
                        const doctorName = linkedOrder?.doctor?.fullName || linkedOrder?.doctorName || "OPD Consultant";

                        return (
                          <React.Fragment key={payment.id}>
                            <tr
                              className={`group cursor-pointer transition-colors duration-150 ${
                                payment.status === "REFUNDED" || payment.status === "REFUND_PENDING"
                                  ? "bg-rose-50/60 hover:bg-rose-100/60 border-l-4 border-l-rose-500"
                                  : payment.status === "PAID"
                                  ? isExpanded
                                    ? "bg-emerald-50/50 border-l-4 border-l-emerald-600"
                                    : "bg-white hover:bg-slate-50 border-l-4 border-l-emerald-500"
                                  : "bg-white hover:bg-slate-50 border-l-4 border-l-amber-500"
                              }`}
                              onClick={() => setExpandedLedgerRowId(isExpanded ? null : payment.id)}
                            >
                              {/* 1. TRANSACTION */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm shrink-0 border shadow-xs ${
                                      payment.method === "CASH"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : payment.method === "UPI"
                                        ? "bg-violet-50 border-violet-200 text-violet-700"
                                        : payment.method === "CARD"
                                        ? "bg-sky-50 border-sky-200 text-sky-700"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                    }`}
                                  >
                                    {getMethodIcon(payment.method)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-slate-900 text-xs tracking-tight">
                                        {payment.transactionId}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(payment.transactionId, "Txn ID");
                                        }}
                                        className="text-slate-400 hover:text-emerald-600 transition"
                                        title="Copy Transaction ID"
                                      >
                                        {copiedText === payment.transactionId ? (
                                          <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                      {payment.receiptNumber}
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-400">
                                      {payment.counter || "Counter 01"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. PATIENT */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-sky-100">
                                    {payment.patientName
                                      ? payment.patientName
                                          .split(" ")
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join("")
                                          .toUpperCase()
                                      : "PT"}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition text-xs">
                                      {payment.patientName}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                      <span>{payment.patientUhid || "UHID-—"}</span>
                                      {payment.phone && payment.phone !== "No phone" && (
                                        <>
                                          <span className="text-slate-300">•</span>
                                          <span className="text-slate-500" title="Masked for DPDP Act 2023 compliance">
                                            {maskPhoneNumber(payment.phone)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {doctorName && (
                                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                        Ref: {doctorName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 3. ORDER / INVOICE */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                                    {payment.orderNumber || "ORD-—"}
                                  </span>
                                  <div className="mt-0.5 text-[11px] font-mono text-slate-500">
                                    {payment.invoiceNumber || "INV-Pending"}
                                  </div>
                                  {testsList.length > 0 && (
                                    <div className="mt-0.5 text-[10px] text-blue-700 font-semibold truncate max-w-[160px]">
                                      {testsList.length} test{testsList.length > 1 ? "s" : ""}:{" "}
                                      {testsList.map((t: any) => t.test?.testName || t.testName || "Test").slice(0, 2).join(", ")}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* 4. AMOUNT */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <div className="text-sm font-mono font-extrabold text-slate-900">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                  <div className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>Settled Full</span>
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    Inc. 18% GST (₹{Math.round(payment.amount * 0.1525)})
                                  </div>
                                </div>
                              </td>

                              {/* 5. METHOD */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                                      payment.method === "CASH"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : payment.method === "CARD"
                                        ? "bg-sky-50 border-sky-200 text-sky-700"
                                        : payment.method === "UPI"
                                        ? "bg-violet-50 border-violet-200 text-violet-700"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                    }`}
                                  >
                                    <span>{getMethodIcon(payment.method)}</span>
                                    <span>{payment.method.replace("_", " ")}</span>
                                  </span>
                                  <div className="mt-0.5 text-[10px] font-mono text-slate-500 pl-1">
                                    {payment.method === "UPI"
                                      ? "Dynamic QR • Instant"
                                      : payment.method === "CARD"
                                      ? "PineLabs POS Swipe"
                                      : "Front Desk Cash"}
                                  </div>
                                </div>
                              </td>

                              {/* 6. STATUS */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                      payment.status === "PAID"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : payment.status === "REFUNDED"
                                        ? "bg-rose-50 border-rose-200 text-rose-700"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        payment.status === "PAID"
                                          ? "bg-emerald-500"
                                          : payment.status === "REFUNDED"
                                          ? "bg-rose-500"
                                          : "bg-amber-500"
                                      }`}
                                    />
                                    {getStatusLabel(payment.status)}
                                  </span>
                                  <div className="mt-0.5 text-[10px] text-slate-400 pl-0.5">
                                    {payment.settlement || "Bank Settled"}
                                  </div>
                                </div>
                              </td>

                              {/* 7. DATE & TIME */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {new Date(payment.paidAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {formatDate(payment.paidAt)}
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-400">
                                    👤 {payment.collectedBy ? payment.collectedBy.split(" ")[0] : "Cashier"}
                                  </div>
                                </div>
                              </td>

                              {/* 8. ACTIONS */}
                              <td className="px-4 py-3.5 text-right">
                                <div
                                  className="flex items-center justify-end gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceipt(payment)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
                                    title="Print A4 Clinical Receipt"
                                  >
                                    <Printer className="h-3.5 w-3.5 text-sky-600" />
                                    Print Receipt
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWhatsAppModalData({
                                        type: "RECEIPT",
                                        patientName: payment.patientName,
                                        phone: payment.phone,
                                        uhid: payment.patientUhid,
                                        orderNumber: payment.orderNumber,
                                        receiptNumber: payment.receiptNumber,
                                        amount: payment.amount,
                                        method: payment.method,
                                        date: formatDate(payment.paidAt),
                                      })
                                    }
                                    className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-1.5 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 transition shadow-xs"
                                    title="Send Receipt via WhatsApp"
                                    aria-label="Send Receipt via WhatsApp"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailPaymentId(payment.id)}
                                    className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
                                    title="Inspect Full Payment Detail"
                                    aria-label="Inspect Full Payment Detail"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInitialRefundPaymentId(payment.id);
                                      setInitialRefundAmount(String(payment.amount));
                                      setIsRefundModalOpen(true);
                                    }}
                                    className="rounded-xl border border-rose-200 bg-rose-50/60 p-1.5 text-rose-600 hover:border-rose-300 hover:bg-rose-100 transition shadow-xs"
                                    title="Issue Refund / Credit Note"
                                    aria-label="Issue Refund or Credit Note"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedLedgerRowId(isExpanded ? null : payment.id)}
                                    className={`rounded-xl border p-1.5 transition ${
                                      isExpanded
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                    title={isExpanded ? "Collapse details" : "Expand itemized tests"}
                                    aria-label={isExpanded ? "Collapse test items" : "Expand itemized test breakdown"}
                                    aria-expanded={isExpanded}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* INLINE EXPANDABLE SUB-DRAWER */}
                            {isExpanded && (
                              <tr className="bg-slate-50/70">
                                <td colSpan={8} className="p-4 border-b border-slate-200">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800">
                                          CLINICAL & FINANCIAL SPECIFICATION
                                        </span>
                                        <span className="text-xs font-bold text-slate-900">
                                          {payment.receiptNumber} • Order: {payment.orderNumber || "—"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500">Collected By:</span>
                                        <strong className="text-slate-800 font-semibold">{payment.collectedBy || "Cashier"}</strong>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500">Terminal:</span>
                                        <strong className="text-slate-800 font-semibold">{payment.counter || "Counter 01"}</strong>
                                      </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                      {/* Ordered Tests List */}
                                      <div className="md:col-span-2 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                                          <span>Included Diagnostic Investigations</span>
                                          <span className="font-mono text-emerald-700 font-bold">{testsList.length || 1} Item(s)</span>
                                        </div>
                                        {testsList.length > 0 ? (
                                          <div className="space-y-1.5 text-xs">
                                            {testsList.map((item: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-2xs"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="h-5 w-5 rounded bg-sky-50 border border-sky-200 text-sky-700 font-bold text-[10px] flex items-center justify-center">
                                                    {idx + 1}
                                                  </span>
                                                  <div>
                                                    <span className="font-bold text-slate-900">
                                                      {item.test?.testName || item.testName || "Diagnostic Investigation"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                                                      ({item.test?.testCode || "TEST"})
                                                    </span>
                                                  </div>
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">
                                                  {formatCurrency(Number(item.price || item.finalPrice || payment.amount))}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-700">
                                              Laboratory Diagnostic Pathology Test Panel
                                            </span>
                                            <span className="font-mono font-bold text-slate-900">
                                              {formatCurrency(payment.amount)}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Tax & Reconciliation Card */}
                                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-2 flex flex-col justify-between">
                                        <div>
                                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                                            Tax & Accounting Breakdown
                                          </div>
                                          <div className="space-y-1.5 text-[11px]">
                                            <div className="flex justify-between text-slate-500">
                                              <span>Taxable Turnover:</span>
                                              <span className="font-mono font-bold text-slate-800">
                                                {formatCurrency(Math.round((payment.amount / 1.18) * 100) / 100)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                              <span>CGST (9%):</span>
                                              <span className="font-mono text-slate-700">
                                                {formatCurrency(Math.round(((payment.amount - payment.amount / 1.18) / 2) * 100) / 100)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                              <span>SGST (9%):</span>
                                              <span className="font-mono text-slate-700">
                                                {formatCurrency(Math.round(((payment.amount - payment.amount / 1.18) / 2) * 100) / 100)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-xs">
                                              <span>Total Paid:</span>
                                              <span className="font-mono text-emerald-700 font-extrabold">
                                                {formatCurrency(payment.amount)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200 flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReceipt(payment)}
                                            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 py-1.5 text-center text-[11px] font-bold text-white shadow-xs hover:from-emerald-500 hover:to-teal-600 transition"
                                          >
                                            Print 80mm Slip
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedDetailPaymentId(payment.id)}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                                          >
                                            Full Audit
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                          No transactions found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-600 font-medium">
                <span>
                  Showing latest {Math.min(displayedLedgerPayments.length, 10)} of {filteredPayments.length} transactions
                </span>
                <button
                  onClick={() => setActiveTab("Transactions")}
                  className="font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1"
                >
                  View Full Transactions Ledger ({payments.length}) →
                </button>
              </div>
            </div>

            {/* Right: Payment Method Mix & Cash Drawer Snapshot (Light Medical Design) */}
            <div className="space-y-5">
              {/* Payment Mix Widget */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Payment Tender Mix</h3>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Live Breakdown
                  </span>
                </div>
                <div className="space-y-3.5">
                  {paymentMix.map(({ method, amount, share }) => (
                    <div key={method}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                          <span>{getMethodIcon(method)}</span>
                          {method.replace("_", " ")}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all shadow-2xs"
                          style={{ width: `${Math.max(share, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Counter Till Status */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Till Register Snapshot</h3>
                    <p className="text-[11px] text-slate-500">{activeCounter}</p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-slate-700">
                    <span>Shift Opening Float</span>
                    <strong className="font-mono text-slate-900 font-bold">{formatCurrency(26250)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 text-emerald-800">
                    <span>Cash Collections (Today)</span>
                    <strong className="font-mono text-emerald-700 font-bold">+{formatCurrency(summary.cashInHand || 17800)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-rose-50/80 border border-rose-200/80 p-2.5 text-rose-800">
                    <span>Cash Refunds / Payouts</span>
                    <strong className="font-mono text-rose-700 font-bold">-{formatCurrency(3200)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-emerald-900">
                    <span className="font-bold">Expected in Drawer:</span>
                    <strong className="font-mono text-base font-extrabold text-emerald-800">
                      {formatCurrency(summary.cashDrawer || 40850)}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPettyModalOpen(true)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-100 shadow-2xs"
                  >
                    + Petty Movement
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShiftHandoverOpen(true)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-2 text-center text-xs font-bold text-white shadow-xs transition hover:from-amber-500 hover:to-amber-600"
                  >
                    Close Till & Handover
                  </button>
                </div>
              </div>

              {/* Operational Audit Highlights */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Compliance & Alerts</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-600 font-bold">✔</span>
                    <span>PineLabs Card POS terminal settlement completed for previous shift.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-600 font-bold">⚠️</span>
                    <span>1 pending refund authorization awaiting Accounts review.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-blue-600 font-bold">ℹ</span>
                    <span>UPI QR instant reconciliation active on Counter 01 and Counter 02.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS TAB */}
        {activeTab === "Transactions" && (
          <div className="space-y-4">
            {/* KPI Summary Header Strip for Filtered Stream */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Filtered Receipts</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-slate-900">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    {filteredPayments.length} receipts
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">Total patient billing realized</div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Physical Cash Inflow</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-emerald-950">
                    {formatCurrency(filteredPayments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0))}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {filteredPayments.filter((p) => p.method === "CASH").length} cash bills
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-emerald-700">In physical counter drawers</div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Digital (EDC Card & UPI)</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-sky-950">
                    {formatCurrency(filteredPayments.filter((p) => p.method === "UPI" || p.method === "CARD" || p.method === "NET_BANKING").reduce((s, p) => s + p.amount, 0))}
                  </span>
                  <span className="text-xs font-bold text-sky-700 font-mono">
                    {filteredPayments.filter((p) => p.method !== "CASH").length} digital txns
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-sky-700">Bank gateway & POS settlement</div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Outstanding Balance Due</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-amber-950">
                    {formatCurrency(filteredPayments.filter((p) => p.status === "PENDING" || p.status === "PARTIALLY_PAID").reduce((s, p) => s + (p.invoiceBalance || 0), 0))}
                  </span>
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    {filteredPayments.filter((p) => p.status === "PENDING" || p.status === "PARTIALLY_PAID").length} due
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-amber-700">Awaiting discharge / report pickup</div>
              </div>
            </div>

            {/* Filter & Operations Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search receipt #, Txn ID, patient name, UHID, doctor..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-8 text-xs outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Encounter Type Filter */}
                  <select
                    value={encounterFilter}
                    onChange={(e) => {
                      setEncounterFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Encounters</option>
                    <option value="OPD">OPD (Outpatient)</option>
                    <option value="IPD">IPD (Inpatient)</option>
                    <option value="STAT">STAT (Emergency / ICU)</option>
                    <option value="HOME">Home Phlebotomy Hub</option>
                    <option value="CORP">Corporate / Health Checkup</option>
                  </select>

                  <select
                    value={txnCounterFilter}
                    onChange={(e) => {
                      setTxnCounterFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Counters</option>
                    <option value="Counter 01">Counter 01 (Main OPD)</option>
                    <option value="Counter 02">Counter 02 (Stat / Emergency)</option>
                    <option value="Counter 03">Counter 03 (Collection Center)</option>
                    <option value="Counter 04">Counter 04 (Home Collection Hub)</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Statuses</option>
                    <option value="PAID">PAID IN FULL</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID / DUE</option>
                    <option value="PENDING">PENDING CLEARANCE</option>
                    <option value="REFUNDED">REFUNDED / CREDIT NOTE</option>
                  </select>

                  <select
                    value={methodFilter}
                    onChange={(e) => {
                      setMethodFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Methods</option>
                    <option value="CASH">💵 Cash Tender</option>
                    <option value="CARD">💳 Card POS (EDC)</option>
                    <option value="UPI">📱 BharatQR / UPI</option>
                    <option value="NET_BANKING">🏦 Net Banking / NEFT</option>
                    <option value="CHEQUE">🧾 Cheque Clearance</option>
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="7 Days">Last 7 Days</option>
                    <option value="30 Days">Last 30 Days</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                    title="Export GST SAC 999312 Schedule to CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-sky-600" />
                    CSV
                  </button>

                  <button
                    onClick={() => {
                      setInitialCollectOrderId("");
                      setInitialCollectAmount("");
                      setIsCollectModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-900 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Collect Bill
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Master Clinical Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px] text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="h-3.5 w-3.5 text-sky-600" />
                          <span>Txn & Receipt #</span>
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-slate-900 border-r border-slate-100"
                        onClick={() => {
                          setSortField("patientName");
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Patient Demographics</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                          <span>Consultant & Specimen</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-600" />
                          <span>Order & SAC Code</span>
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-slate-900 border-r border-slate-100"
                        onClick={() => {
                          setSortField("amount");
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                          <span>Amount Paid / Due</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-sky-600" />
                          <span>Tender & Instrument</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Settlement Status</span>
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-slate-900 border-r border-slate-100"
                        onClick={() => {
                          setSortField("paidAt");
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Timestamp & Till</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedPayments.length > 0 ? (
                      paginatedPayments.map((p) => {
                        const linkedOrder = orders.find(
                          (o) => o.id === p.orderId || o.orderNumber === p.orderNumber
                        );
                        const doctorName = p.doctorName || linkedOrder?.doctor?.fullName || linkedOrder?.doctorName || "OPD Consultant";
                        const itemCount = p.testCount || linkedOrder?.items?.length || 1;
                        const encType = p.encounterType || "OPD";

                        const getEncounterBadge = (enc: string) => {
                          switch (enc) {
                            case "IPD":
                              return "bg-purple-50 text-purple-700 border-purple-200";
                            case "STAT":
                              return "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
                            case "HOME":
                              return "bg-teal-50 text-teal-700 border-teal-200";
                            case "CORP":
                              return "bg-amber-50 text-amber-700 border-amber-200";
                            default:
                              return "bg-blue-50 text-blue-700 border-blue-200";
                          }
                        };

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-50/80 transition cursor-pointer"
                            onClick={() => setSelectedTxnDrawer(p)}
                          >
                            {/* 1. TXN & RECEIPT */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {p.transactionId}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(p.transactionId, "Txn ID");
                                  }}
                                  className="text-slate-400 hover:text-emerald-600 transition"
                                  title="Copy Txn ID"
                                >
                                  {copiedText === p.transactionId ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="font-mono text-[11px] text-slate-600 font-semibold mt-0.5">
                                {p.receiptNumber}
                              </div>
                              <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {p.counter || "Counter 01"}
                              </span>
                            </td>

                            {/* 2. PATIENT */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold border ${getEncounterBadge(encType)}`}>
                                  {encType}
                                </span>
                                <div className="font-bold text-slate-900 text-xs hover:text-blue-700 transition">
                                  {p.patientName}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                <span className="font-semibold text-slate-700">{p.patientUhid || "UHID-—"}</span>
                                {p.patientAge && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>{p.patientAge}y/{p.patientGender ? p.patientGender[0] : "—"}</span>
                                  </>
                                )}
                              </div>
                              {p.phone && p.phone !== "No phone" && (
                                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                  📞 {maskPhoneNumber(p.phone)}
                                </div>
                              )}
                            </td>

                            {/* 3. CONSULTANT & SPECIMEN */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div className="text-xs font-semibold text-slate-800">
                                {doctorName}
                              </div>
                              <div className="text-[11px] text-teal-700 font-medium mt-0.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                {itemCount} Test Item{itemCount > 1 ? "s" : ""}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {p.department || "Clinical Pathology"}
                              </span>
                            </td>

                            {/* 4. ORDER & BILL LINK */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div className="font-mono text-xs font-semibold text-slate-800">
                                {p.orderNumber || "ORD-—"}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                                {p.invoiceNumber || "INV-Pending"}
                              </div>
                              <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                SAC 999312 (Nil GST)
                              </span>
                            </td>

                            {/* 5. AMOUNT */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div className="font-mono text-sm font-extrabold text-slate-900">
                                {formatCurrency(p.amount)}
                              </div>
                              {p.invoiceBalance !== undefined && p.invoiceBalance > 0 ? (
                                <div className="text-[10px] font-mono text-amber-700 font-bold mt-0.5 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 inline-block">
                                  Due: {formatCurrency(p.invoiceBalance)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-0.5">
                                  <Check className="h-3 w-3 text-emerald-600" /> Paid in Full
                                </div>
                              )}
                            </td>

                            {/* 6. METHOD & INSTRUMENT */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getMethodBadge(
                                  p.method
                                )}`}
                              >
                                <span>{getMethodIcon(p.method)}</span>
                                {p.method.replace("_", " ")}
                              </span>
                              {p.instrumentRef && (
                                <div className="font-mono text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                                  Ref: {p.instrumentRef}
                                </div>
                              )}
                              {p.terminalId && (
                                <div className="text-[9px] text-slate-400 font-mono">
                                  TID: {p.terminalId}
                                </div>
                              )}
                            </td>

                            {/* 7. STATUS & SETTLEMENT */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${getStatusBadge(
                                    p.status
                                  )}`}
                                >
                                  {getStatusLabel(p.status)}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {p.settlement || "SETTLED"}
                                </span>
                              </div>
                            </td>

                            {/* 8. TIMESTAMP & CASHIER */}
                            <td className="px-4 py-3 border-r border-slate-100">
                              <div className="font-mono text-xs text-slate-700">
                                {formatDateTime(p.paidAt)}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                                {p.collectedBy || "Front Desk Cashier"}
                              </div>
                            </td>

                            {/* 9. ACTIONS */}
                            <td className="px-4 py-3 text-right">
                              <div
                                className="flex items-center justify-end gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(p)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
                                  title="Print A4 Clinical Receipt"
                                >
                                  <Printer className="h-3.5 w-3.5 text-sky-600" />
                                  Print Receipt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setThermalSlipPayment(p)}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                                  title="Thermal 3-Inch POS Slip"
                                >
                                  3" Slip
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWhatsAppModalData({
                                      type: "RECEIPT",
                                      patientName: p.patientName,
                                      phone: p.phone,
                                      uhid: p.patientUhid,
                                      orderNumber: p.orderNumber,
                                      receiptNumber: p.receiptNumber,
                                      amount: p.amount,
                                      method: p.method,
                                      date: formatDate(p.paidAt),
                                    })
                                  }
                                  className="rounded-lg border border-slate-200 bg-white p-1 text-emerald-600 hover:bg-emerald-50 shadow-2xs transition"
                                  title="Send via WhatsApp"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailPaymentId(p.id)}
                                  className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 shadow-2xs transition"
                                  title="Audit Record"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInitialRefundPaymentId(p.id);
                                    setInitialRefundAmount(String(p.amount));
                                    setIsRefundModalOpen(true);
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 shadow-2xs transition"
                                  title="Issue Refund / Credit Note"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                          <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <div className="font-semibold text-slate-700">No payment transactions match this filter.</div>
                          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or adjusting the date/counter filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100/90 text-xs font-bold text-slate-800 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-slate-600 font-bold border-r border-slate-200">
                        Page Aggregate ({paginatedPayments.length} of {filteredPayments.length} transactions)
                      </td>
                      <td className="px-4 py-3 font-mono border-r border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Page Collected</div>
                        <div className="text-sm font-extrabold text-emerald-800">
                          {formatCurrency(paginatedPayments.reduce((s, p) => s + p.amount, 0))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs border-r border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Tender Split</div>
                        <div className="font-semibold text-slate-700 text-[11px] mt-0.5">
                          💵 ₹{paginatedPayments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")} • 💳 ₹{paginatedPayments.filter((p) => p.method === "CARD").reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Realized
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {activeCounter}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] text-slate-500 font-mono">SAC 999312</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-3 text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>records per page • Total {filteredPayments.length} entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-slate-800">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Inspection Drawer for Selected Transaction */}
            {selectedTxnDrawer && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-600" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      Clinical Receipt Inspection: {selectedTxnDrawer.transactionId} ({selectedTxnDrawer.receiptNumber})
                    </h4>
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                      {selectedTxnDrawer.patientName} • {selectedTxnDrawer.patientUhid}
                    </span>
                    <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Encounter: {selectedTxnDrawer.encounterType || "OPD"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(selectedTxnDrawer)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
                      title="Print A4 Clinical Receipt"
                    >
                      <Printer className="h-3.5 w-3.5 text-sky-600" />
                      Print Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => setThermalSlipPayment(selectedTxnDrawer)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      3" Thermal Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTxnDrawer(null)}
                      className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Order & Clinical Tests</span>
                    <div className="mt-1 font-semibold text-slate-900">{selectedTxnDrawer.orderNumber || "—"}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{selectedTxnDrawer.testNames || "Diagnostic Pathology Profile"}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedTxnDrawer.invoiceNumber || "—"}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Tender Collected</span>
                    <div className="mt-1 font-mono font-extrabold text-emerald-700 text-sm">{formatCurrency(selectedTxnDrawer.amount)}</div>
                    <div className="text-[11px] text-slate-500">{selectedTxnDrawer.method} • {selectedTxnDrawer.counter}</div>
                    {selectedTxnDrawer.instrumentRef && (
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">Ref: {selectedTxnDrawer.instrumentRef}</div>
                    )}
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Tax & Accreditation</span>
                    <div className="mt-1 font-semibold text-slate-800">SAC 999312 (Nil GST)</div>
                    <div className="text-[10px] text-slate-500">NABL ISO 15189:2022 Certified</div>
                    <div className="text-[10px] text-teal-700 font-semibold mt-0.5">Dept: {selectedTxnDrawer.department || "Clinical Pathology"}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Cashier Verification</span>
                    <div className="mt-1 font-semibold text-slate-800">{selectedTxnDrawer.collectedBy}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatDateTime(selectedTxnDrawer.paidAt)}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref Doctor: {selectedTxnDrawer.doctorName || "OPD Consultant"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADVANCES & WALLET TAB */}
        {activeTab === "Advances & Wallet" && (
          <div className="space-y-4">
            {/* Header Action Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Patient Advance Deposits & Clinical Prepaid Wallets
                  </h3>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Trust Accounting Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-authorized deposits, routine diagnostic wallets, IPD admission floats, and automated test invoice deductions
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInitialAdvancePatientId("");
                  setIsAdvanceModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-emerald-500 hover:to-teal-600 transition"
              >
                <Plus className="h-4 w-4" />
                + Add Patient Advance Deposit
              </button>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Active Advance Balances
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-extrabold text-slate-900">
                    {formatCurrency(patientAdvanceAccounts.reduce((sum, a) => sum + a.availableBalance, 0))}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {patientAdvanceAccounts.filter((a) => a.availableBalance > 0).length} Patients
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Held in fiduciary trust for upcoming lab tests</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Utilized in Diagnostic Orders
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-extrabold text-sky-900">
                    {formatCurrency(patientAdvanceAccounts.reduce((sum, a) => sum + a.totalUtilized, 0))}
                  </span>
                  <span className="text-xs font-bold text-sky-700 font-mono">
                    {patientAdvanceAccounts.reduce((sum, a) => sum + a.totalDeposited, 0) > 0
                      ? `${Math.round((patientAdvanceAccounts.reduce((sum, a) => sum + a.totalUtilized, 0) / patientAdvanceAccounts.reduce((sum, a) => sum + a.totalDeposited, 0)) * 100)}% Consumed`
                      : "—"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Automated offset against OPD & IPD order invoices</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Advance Refunds Disbursed
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-extrabold text-slate-900">
                    {formatCurrency(4500)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    100% Settled
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Unspent balance returned upon order completion</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={advancesSearch}
                  onChange={(e) => setAdvancesSearch(e.target.value)}
                  placeholder="Search patient, UHID, phone number..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-7 text-xs outline-none focus:border-sky-500 focus:bg-white"
                />
                {advancesSearch && (
                  <button
                    onClick={() => setAdvancesSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: "All Accounts" },
                  { id: "HEALTH_PACKAGE", label: "Health Packages" },
                  { id: "OPD_WALLET", label: "OPD Wallet" },
                  { id: "IPD_DEPOSIT", label: "Inpatient Advance" },
                  { id: "CORPORATE_COPAY", label: "Corporate Tie-up" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setAdvancesCategoryFilter(chip.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      advancesCategoryFilter === chip.id
                        ? "bg-[#0f2d52] text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advance Accounts Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm border-collapse">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Patient & Demographics</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Deposit Purpose / Type</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Lifetime Deposited</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Total Utilized</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Available Balance</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Last Activity</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Status</th>
                      <th className="px-4 py-3 font-bold text-right text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {patientAdvanceAccounts
                      .filter((a) => {
                        const q = advancesSearch.trim().toLowerCase();
                        const matchQ =
                          !q ||
                          a.patientName.toLowerCase().includes(q) ||
                          a.uhid.toLowerCase().includes(q) ||
                          a.phone.toLowerCase().includes(q);
                        const matchCat =
                          advancesCategoryFilter === "ALL" || a.category === advancesCategoryFilter;
                        return matchQ && matchCat;
                      })
                      .map((account) => (
                        <tr
                          key={account.id}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                          onClick={() => setSelectedPatientLedger(account)}
                        >
                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="font-bold text-slate-900 text-xs">
                              {account.patientName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span className="font-semibold text-slate-700">{account.uhid}</span>
                              <span className="text-slate-300">•</span>
                              <span>{account.age}y/{account.gender ? account.gender[0] : "—"}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              📞 {maskPhoneNumber(account.phone)}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <span className="font-medium text-slate-800 text-xs block">
                              {account.categoryLabel}
                            </span>
                            <span className="inline-block mt-1 rounded px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {account.category.replace(/_/g, " ")}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-mono font-semibold text-slate-800 border-r border-slate-100">
                            {formatCurrency(account.totalDeposited)}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-slate-600 border-r border-slate-100">
                            {formatCurrency(account.totalUtilized)}
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="font-mono text-base font-extrabold text-emerald-700">
                              {formatCurrency(account.availableBalance)}
                            </div>
                            {account.availableBalance > 0 && (
                              <span className="text-[10px] text-emerald-600 font-semibold">Ready for billing</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="text-xs text-slate-700 font-mono">
                              {formatDate(account.lastActivityDate)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Ref: {account.lastActivityRef}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                account.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {account.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setInitialAdvancePatientId(account.uhid);
                                  setIsAdvanceModalOpen(true);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 shadow-2xs transition"
                              >
                                + Top Up
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPatientLedger(account)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                              >
                                Statement
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-slate-100/90 text-xs font-bold text-slate-800 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-slate-600 font-bold border-r border-slate-200">
                        Total Trust Portfolio ({patientAdvanceAccounts.length} Patient Accounts)
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Total Deposited</div>
                        <div>{formatCurrency(patientAdvanceAccounts.reduce((s, a) => s + a.totalDeposited, 0))}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 border-r border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Total Utilized</div>
                        <div>{formatCurrency(patientAdvanceAccounts.reduce((s, a) => s + a.totalUtilized, 0))}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-emerald-800 border-r border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-emerald-700">Net Trust Balance</div>
                        <div className="text-sm">{formatCurrency(patientAdvanceAccounts.reduce((s, a) => s + a.availableBalance, 0))}</div>
                      </td>
                      <td colSpan={3} className="px-4 py-3 text-slate-500 text-[11px] font-normal">
                        Fiduciary Medical Trust • SAC 999312 Nil GST
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Patient Advance Statement of Account Drawer */}
            {selectedPatientLedger && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2.5 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">
                        Advance Account Statement: {selectedPatientLedger.patientName} ({selectedPatientLedger.uhid})
                      </h4>
                      <span className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Current Balance: {formatCurrency(selectedPatientLedger.availableBalance)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chronological ledger showing deposits, bill deductions, and balances
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedPatientLedger.availableBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInitialAdvancePatientId(selectedPatientLedger.uhid);
                          setIsAdvanceModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 shadow-2xs transition"
                      >
                        <Plus className="h-3 w-3" />
                        Top-up Advance
                      </button>
                    )}
                    {selectedPatientLedger.availableBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInitialRefundPaymentId(selectedPatientLedger.lastActivityRef || "ADV-CLOSE");
                          setInitialRefundAmount(String(selectedPatientLedger.availableBalance));
                          setIsRefundModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-2xs transition"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Refund Unspent Deposit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <Printer className="h-3 w-3 text-slate-500" />
                      Print Passbook
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientLedger(null)}
                      className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Date & Time</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Reference #</th>
                        <th className="px-3 py-2">Description / Test Panel</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPatientLedger.history?.map((h: any) => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-slate-600">{formatDateTime(h.date)}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                h.type === "DEPOSIT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : h.type === "UTILIZED"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {h.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-slate-800">{h.reference}</td>
                          <td className="px-3 py-2 text-slate-700">{h.description}</td>
                          <td
                            className={`px-3 py-2 font-mono font-bold text-right ${
                              h.type === "DEPOSIT" ? "text-emerald-700" : "text-slate-800"
                            }`}
                          >
                            {h.type === "DEPOSIT" ? `+${formatCurrency(h.amount)}` : `-${formatCurrency(h.amount)}`}
                          </td>
                          <td className="px-3 py-2 font-mono font-extrabold text-slate-900 text-right">
                            {formatCurrency(h.balanceAfter)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-blue-100 pt-2 font-sans">
                  <span>* Monies held in fiduciary medical trust for upcoming diagnostic investigations. Non-interest bearing escrow ledger.</span>
                  <span className="font-mono font-semibold text-blue-800">SAC 999312 • NABL ISO 15189:2022</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REFUNDS TAB */}
        {activeTab === "Refunds" && (
          <div className="space-y-4">
            {/* Header Action Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Clinical Refunds, Sample Rejection Waivers & GST Credit Notes
                  </h3>
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                    NABL Audit Compliant
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-analytical specimen rejection reversals, physician cancellation credit notes, POS duplicate swipe chargebacks & patient payout vouchers
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInitialRefundPaymentId("");
                  setInitialRefundAmount("");
                  setIsRefundModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-rose-500 hover:to-rose-600 transition"
              >
                <RotateCcw className="h-4 w-4" />
                + Issue Refund / Credit Note
              </button>
            </div>

            {/* 4 Quality & Financial KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Refunds Processed (Month)</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-slate-900">
                    {formatCurrency(14050)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">8 vouchers</span>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pending Approval</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-amber-900">
                    {formatCurrency(refundsList.filter((r) => r.status === "PENDING_APPROVAL").reduce((s, r) => s + r.refundAmount, 0))}
                  </span>
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    {refundsList.filter((r) => r.status === "PENDING_APPROVAL").length} Request(s)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Disbursed Today</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-emerald-900">
                    {formatCurrency(3200)}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">Cash + UPI</span>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Quality Benchmark</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-extrabold text-sky-900">0.8%</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">Within 1.5% Limit</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={refundSearch}
                  onChange={(e) => setRefundSearch(e.target.value)}
                  placeholder="Search credit note #, patient name, UHID, Txn ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-7 text-xs outline-none focus:border-rose-500 focus:bg-white"
                />
                {refundSearch && (
                  <button
                    onClick={() => setRefundSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: `All (${refundsList.length})` },
                  { id: "PENDING_APPROVAL", label: `Pending Approval (${refundsList.filter((r) => r.status === "PENDING_APPROVAL").length})` },
                  { id: "APPROVED", label: "Approved" },
                  { id: "PROCESSED", label: "Processed" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setRefundStatusFilter(chip.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      refundStatusFilter === chip.id
                        ? "bg-[#0f2d52] text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Refunds Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-left text-sm border-collapse">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Credit Note & Voucher</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Original Txn & Receipt</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Patient Demographics</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Clinical Justification</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Refund Amount</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Payout Mode</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Authorization Trail</th>
                      <th className="px-4 py-3 font-bold border-r border-slate-100">Status</th>
                      <th className="px-4 py-3 font-bold text-right text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {refundsList
                      .filter((r) => {
                        const q = refundSearch.trim().toLowerCase();
                        const matchQ =
                          !q ||
                          r.creditNoteNumber.toLowerCase().includes(q) ||
                          r.transactionId.toLowerCase().includes(q) ||
                          r.patientName.toLowerCase().includes(q) ||
                          r.patientUhid.toLowerCase().includes(q);
                        const matchStatus =
                          refundStatusFilter === "ALL" || r.status === refundStatusFilter;
                        return matchQ && matchStatus;
                      })
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs">
                              <span>{r.creditNoteNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(r.creditNoteNumber, "Credit Note #")}
                                className="text-slate-400 hover:text-emerald-600"
                                title="Copy Credit Note #"
                              >
                                {copiedText === r.creditNoteNumber ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">{r.id}</div>
                            <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              GST Reversal Note
                            </span>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="font-mono text-xs font-semibold text-slate-800">{r.transactionId}</div>
                            <div className="font-mono text-[11px] text-slate-500 mt-0.5">{r.receiptNumber}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.orderNumber}</div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="font-bold text-slate-900 text-xs">{r.patientName}</div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">{r.patientUhid}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">📞 {maskPhoneNumber(r.phone)}</div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100 max-w-xs">
                            <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {r.reasonTitle}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {r.reasonDescription}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <div className="font-mono text-sm font-extrabold text-rose-700">
                              {formatCurrency(r.refundAmount)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Orig: {formatCurrency(r.originalAmount)}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                              {r.refundMode.replace(/_/g, " ")}
                            </span>
                            {r.utr && (
                              <div className="font-mono text-[10px] text-slate-500 mt-1 truncate max-w-[120px]">
                                Ref: {r.utr}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100 text-xs">
                            <div className="font-semibold text-slate-800">{r.authorizedBy}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Req by: {r.requestedBy}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(r.requestedAt)}</div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-100">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                r.status === "PROCESSED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : r.status === "APPROVED"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : r.status === "PENDING_APPROVAL"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {r.status.replace(/_/g, " ")}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === "PENDING_APPROVAL" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRefundsList((prev) =>
                                        prev.map((item) =>
                                          item.id === r.id ? { ...item, status: "APPROVED" } : item
                                        )
                                      );
                                      showNotification(`Refund ${r.creditNoteNumber} approved by Medical Supdt!`, "success");
                                    }}
                                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 shadow-2xs transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRefundsList((prev) =>
                                        prev.map((item) =>
                                          item.id === r.id ? { ...item, status: "REJECTED" } : item
                                        )
                                      );
                                      showNotification(`Refund ${r.creditNoteNumber} rejected.`, "error");
                                    }}
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 shadow-2xs transition"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : r.status === "APPROVED" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const utr = prompt("Enter Payout Bank UTR / Cash Voucher Ref:", `VCH-PAY-${Date.now().toString().slice(-6)}`);
                                    if (utr) {
                                      setRefundsList((prev) =>
                                        prev.map((item) =>
                                          item.id === r.id ? { ...item, status: "PROCESSED", utr, processedAt: new Date().toISOString() } : item
                                        )
                                      );
                                      showNotification(`Payout of ${formatCurrency(r.refundAmount)} processed with Ref ${utr}!`, "success");
                                    }
                                  }}
                                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-500 shadow-2xs transition"
                                >
                                  Disburse Payout
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCreditNote(r)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                                >
                                  <Printer className="h-3 w-3 text-slate-500" />
                                  Credit Note
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CASH COUNTER TAB */}
        {activeTab === "Cash Counter" && (
          <div className="space-y-4">
            {/* Header Control Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Hospital Cash Counter Register & Shift Till Management
                  </h3>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Shift Active: SH-2026-0926-A1
                  </span>
                  <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
                    Dual-Sign Handover
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Physical Indian currency denomination counting, shift float tally, petty expenses, and safe vault transfers
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeCounter}
                  onChange={(e) => setActiveCounter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300"
                >
                  <option value="Counter 01 (Main OPD)">Counter 01 (Main OPD Diagnostic Billing)</option>
                  <option value="Counter 02 (Stat / Emergency)">Counter 02 (Emergency & STAT 24x7 Desk)</option>
                  <option value="Counter 03 (Collection Center)">Counter 03 (Inpatient IPD Billing & Cash)</option>
                  <option value="Counter 04 (Corporate & TPA)">Counter 04 (Corporate TPA & Executive Health)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsDenominationPrintOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Till Slip
                </button>

                <button
                  type="button"
                  onClick={() => setIsShiftHandoverOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-amber-500 hover:to-amber-600 transition"
                >
                  <Clock className="h-4 w-4" />
                  Close Till & Shift Handover
                </button>
              </div>
            </div>

            {/* Split Grid: Denomination Counter on Left, Till Float on Right */}
            <div className="grid gap-4 lg:grid-cols-12">
              {/* LEFT: Indian Currency Denomination Calculator (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-600" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Physical Cash Denomination Counter
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter physical note counts in drawer to reconcile against expected register balance
                    </p>
                  </div>

                  {(() => {
                    const counted =
                      (denominations[500] || 0) * 500 +
                      (denominations[200] || 0) * 200 +
                      (denominations[100] || 0) * 100 +
                      (denominations[50] || 0) * 50 +
                      (denominations[20] || 0) * 20 +
                      (denominations[10] || 0) * 10 +
                      (denominations[5] || 0) * 5 +
                      (denominations.coins || 0);
                    const expected = summary.cashDrawer || 40850;
                    const diff = counted - expected;

                    if (diff === 0) {
                      return (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1 shrink-0">
                          <Check className="h-3 w-3 text-emerald-600" /> Till Balanced
                        </span>
                      );
                    } else if (diff > 0) {
                      return (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800 shrink-0">
                          Surplus: +{formatCurrency(diff)}
                        </span>
                      );
                    } else {
                      return (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-800 shrink-0">
                          Shortage: {formatCurrency(diff)}
                        </span>
                      );
                    }
                  })()}
                </div>

                {/* Quick Presets Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDenominations({ 500: 58, 200: 34, 100: 32, 50: 16, 20: 25, 10: 20, 5: 18, coins: 170 });
                      setIsDenominationSaved(false);
                      showNotification("Auto-tallied denomination counts to expected cash (₹40,850)", "info");
                    }}
                    className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    Auto-Match Expected (₹40,850)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDenominations({ 500: 6, 200: 5, 100: 8, 50: 4, 20: 0, 10: 0, 5: 0, coins: 0 });
                      setIsDenominationSaved(false);
                      showNotification("Set to Standard ₹5,000 Morning Float", "info");
                    }}
                    className="rounded-lg bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-100 transition"
                  >
                    Morning Float (₹5,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDenominations({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 });
                      setIsDenominationSaved(false);
                      showNotification("Cleared all note and coin counts", "info");
                    }}
                    className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Reset (Zero Till)
                  </button>
                </div>

                {/* Denomination Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Currency Note</th>
                        <th className="px-3 py-2 text-center">Physical Count</th>
                        <th className="px-3 py-2 text-right">Subtotal (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {[
                        { denom: 500, label: "₹500 Note", key: "500", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                        { denom: 200, label: "₹200 Note", key: "200", bg: "bg-amber-50 text-amber-800 border-amber-200" },
                        { denom: 100, label: "₹100 Note", key: "100", bg: "bg-sky-50 text-sky-800 border-sky-200" },
                        { denom: 50, label: "₹50 Note", key: "50", bg: "bg-indigo-50 text-indigo-800 border-indigo-200" },
                        { denom: 20, label: "₹20 Note", key: "20", bg: "bg-teal-50 text-teal-800 border-teal-200" },
                        { denom: 10, label: "₹10 Note", key: "10", bg: "bg-slate-100 text-slate-800 border-slate-300" },
                        { denom: 5, label: "₹5 Note / Coin", key: "5", bg: "bg-orange-50 text-orange-800 border-orange-200" },
                      ].map((item) => {
                        const count = denominations[item.key] || 0;
                        const subtotal = count * item.denom;
                        return (
                          <tr key={item.key} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2 font-semibold">
                              <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold border ${item.bg}`}>
                                {item.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                value={count === 0 ? "" : count}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setDenominations((prev) => ({ ...prev, [item.key]: Math.max(0, val) }));
                                  setIsDenominationSaved(false);
                                }}
                                placeholder="0"
                                className="w-20 rounded-lg border border-slate-200 bg-slate-50/80 py-1 text-center font-mono font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-semibold">
                          <span className="inline-block rounded px-2 py-0.5 text-[11px] font-bold border bg-gray-100 text-gray-800 border-gray-300">
                            Fractional Coins (₹1, ₹2)
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={denominations.coins === 0 ? "" : denominations.coins}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setDenominations((prev) => ({ ...prev, coins: Math.max(0, val) }));
                              setIsDenominationSaved(false);
                            }}
                            placeholder="0"
                            className="w-20 rounded-lg border border-slate-200 bg-slate-50/80 py-1 text-center font-mono font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {formatCurrency(denominations.coins || 0)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-mono text-xs">
                      <tr>
                        <td colSpan={2} className="px-3 py-2.5 font-bold text-slate-800 uppercase tracking-wider">
                          Total Physical Cash Counted
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-emerald-800 text-sm">
                          {formatCurrency(
                            (denominations[500] || 0) * 500 +
                            (denominations[200] || 0) * 200 +
                            (denominations[100] || 0) * 100 +
                            (denominations[50] || 0) * 50 +
                            (denominations[20] || 0) * 20 +
                            (denominations[10] || 0) * 10 +
                            (denominations[5] || 0) * 5 +
                            (denominations.coins || 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Supervisor Remarks & Save */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={cashierNotes}
                    onChange={(e) => setCashierNotes(e.target.value)}
                    placeholder="Cashier verification note / Safe bag seal #..."
                    className="flex-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-sky-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDenominationSaved(true);
                      showNotification("Physical cash denomination count verified & saved!", "success");
                    }}
                    className="w-full sm:w-auto rounded-xl bg-[#0f2d52] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-900 transition"
                  >
                    {isDenominationSaved ? "Count Verified ✔" : "Save Tally"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDenominationPrintOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    Print Handover Slip
                  </button>
                </div>
              </div>

              {/* RIGHT: Shift Float Summary & Petty Register (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Active Register Summary Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Active Till Register Session</h4>
                      <div className="text-[10px] text-slate-400 font-mono">Terminal IP: 192.168.1.45 (POS-01)</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      OPEN & ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Cashier Operator:</span>
                      <strong className="text-slate-900">Jaya Ashapurama (EMP-104)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Shift Started:</span>
                      <strong className="text-slate-900">Today, 08:30 AM (Morning OPD)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Opening Float Till Allocation:</span>
                      <strong className="font-mono text-slate-900">{formatCurrency(26250)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Gross Cash Collections (+):</span>
                      <strong className="font-mono text-emerald-700 font-bold">
                        +{formatCurrency(summary.cashInHand || 17800)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Cash Refunds / Voids (-):</span>
                      <strong className="font-mono text-rose-700 font-bold">-{formatCurrency(3200)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>Petty Outflows Disbursed (-):</span>
                      <strong className="font-mono text-amber-700 font-bold">-{formatCurrency(430)}</strong>
                    </div>
                    <div className="flex justify-between items-center rounded-xl bg-slate-50 border border-slate-200 p-3 mt-1">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">System Expected in Drawer:</span>
                        <span className="text-[10px] text-slate-500">Opening + Collections - Payouts</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-[#0f2d52]">
                        {formatCurrency(summary.cashDrawer || 40850)}
                      </span>
                    </div>

                    {/* Safe Vault Drop Recommendation */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-blue-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold block text-[11px]">Safe Vault Drop Reqd:</span>
                        <span className="text-[10px] text-blue-700">Retain ₹5,000 float for evening shift</span>
                      </div>
                      <span className="font-mono font-extrabold text-blue-950 text-sm">
                        {formatCurrency(Math.max(0, (summary.cashDrawer || 40850) - 5000))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Petty Cash Outflow Register */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Petty Cash Vouchers</h4>
                      <p className="text-[10px] text-slate-500">Phlebotomy logistics, ice packs & specimen courier</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPettyModalOpen(true)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    >
                      + Log Voucher
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {pettyCashMovements.map((mov) => (
                      <div
                        key={mov.id}
                        className={`flex items-center justify-between rounded-xl p-2.5 border ${
                          mov.type === "IN"
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{mov.reason}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{mov.time}</span>
                            <span>•</span>
                            <span className="font-mono">{mov.voucherNo || "VCH-—"}</span>
                            {mov.department && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600">{mov.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <strong className={`font-mono text-xs font-bold ${mov.type === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                          {mov.type === "IN" ? `+₹${mov.amount}` : `-₹${mov.amount}`}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTLEMENTS TAB */}
        {activeTab === "Settlements" && (
          <div className="space-y-6">
            {/* KPI Header Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Swiped & Online</span>
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-slate-900">
                  {formatCurrency(settlementBatches.reduce((acc, s) => acc + s.gross, 0))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {settlementBatches.reduce((acc, s) => acc + s.txnCount, 0)} Total EDC swipes & BharatQR
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">MDR & Gateway Fees</span>
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-700">
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-rose-600">
                  -{formatCurrency(settlementBatches.reduce((acc, s) => acc + s.fees, 0))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  ~1.5% Merchant Interchange + 18% GST
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Bank Realized</span>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                    <Landmark className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-emerald-700">
                  {formatCurrency(
                    settlementBatches
                      .filter((s) => s.status === "SETTLED")
                      .reduce((acc, s) => acc + s.net, 0)
                  )}
                </div>
                <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                  Credited to Hospital Current Account
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Settlement</span>
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-amber-700">
                  {formatCurrency(
                    settlementBatches
                      .filter((s) => s.status !== "SETTLED")
                      .reduce((acc, s) => acc + s.net, 0)
                  )}
                </div>
                <p className="mt-1 text-[11px] text-amber-600">
                  {settlementBatches.filter((s) => s.status !== "SETTLED").length} Batches awaiting T+1 bank credit
                </p>
              </div>
            </div>

            {/* Filter Bar & Action Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Provider:</span>
                {[
                  { id: "ALL", label: "All Providers" },
                  { id: "PineLabs", label: "PineLabs EDC" },
                  { id: "Razorpay", label: "Razorpay QR" },
                  { id: "HDFC", label: "HDFC EDC" },
                  { id: "ICICI", label: "ICICI EDC" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSettlementProviderFilter(p.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      settlementProviderFilter === p.id
                        ? "bg-[#0f2d52] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() =>
                    showNotification(
                      "Settlement statement exported in Excel/CSV format for Tally / SAP ERP",
                      "info"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Sheet
                </button>
                <button
                  onClick={() => setIsEodBatchOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-900 shadow-xs transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Trigger POS Batch Close
                </button>
              </div>
            </div>

            {/* Settlements Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Card POS Machine & Payment Gateway Settlement Register</h4>
                  <p className="text-xs text-slate-500">Daily reconciliation of EDC batch closures, interchange MDR cuts, and bank account credit vouchers</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                  {settlementBatches.filter(
                    (s) =>
                      settlementProviderFilter === "ALL" ||
                      s.provider.toLowerCase().includes(settlementProviderFilter.toLowerCase()) ||
                      s.terminalId.toLowerCase().includes(settlementProviderFilter.toLowerCase())
                  ).length} Batches
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Batch ID & Date</th>
                      <th className="px-4 py-3">Terminal / Counter</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3 text-center">Swipes</th>
                      <th className="px-4 py-3 text-right">Gross Swiped</th>
                      <th className="px-4 py-3 text-right">MDR Fees (1.5%)</th>
                      <th className="px-4 py-3 text-right">Net Bank Credit</th>
                      <th className="px-4 py-3">Bank UTR Ref #</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settlementBatches
                      .filter(
                        (s) =>
                          settlementProviderFilter === "ALL" ||
                          s.provider.toLowerCase().includes(settlementProviderFilter.toLowerCase()) ||
                          s.terminalId.toLowerCase().includes(settlementProviderFilter.toLowerCase())
                      )
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-bold text-slate-900">{s.id}</div>
                            <div className="text-[11px] text-slate-500">{s.date} • {s.closedBy}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">{s.counter}</div>
                            <div className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-0.5">
                              <Barcode className="h-3 w-3" />
                              {s.terminalId}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-slate-800">{s.provider}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-700">
                              {s.txnCount}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(s.gross)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-rose-600 font-semibold">
                            -{formatCurrency(s.fees)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(s.net)}
                          </td>
                          <td className="px-4 py-3.5">
                            {s.utr === "PENDING_CREDIT" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                                <Clock className="h-3 w-3" />
                                Awaiting Bank Credit
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(s.utr);
                                  showNotification(`Copied UTR: ${s.utr}`, "info");
                                }}
                                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
                                title="Click to copy UTR"
                              >
                                <span>{s.utr}</span>
                                <Copy className="h-3 w-3 text-slate-400" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                s.status === "SETTLED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {s.status === "SETTLED" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-amber-600" />
                              )}
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {s.status !== "SETTLED" ? (
                                <button
                                  onClick={() => handleReconcileSettlement(s.id)}
                                  className="rounded-xl bg-[#0f2d52] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs"
                                >
                                  Reconcile UTR
                                </button>
                              ) : null}
                              <button
                                onClick={() => setSelectedSettlementSlip(s)}
                                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-1"
                                title="View & Print Batch Slip"
                              >
                                <Printer className="h-3.5 w-3.5 text-slate-500" />
                                Slip
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: RECONCILIATION TAB */}
        {activeTab === "Reconciliation" && (
          <div className="space-y-6">
            {/* Header & Reconcile Engine Stats Banner */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-700 border border-blue-100">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Hospital Bank Statement & Gateway Reconciliation
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automated two-way cross verification of LIS billing receipts against hospital current account feeds & UTR references
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => setIsBankImportOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Import Bank Feed
                  </button>
                  <button
                    onClick={() =>
                      showNotification(
                        "Reconciliation Engine run complete! 148 of 150 transactions matched directly with bank credits.",
                        "success"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Run Reconcile Engine
                  </button>
                </div>
              </div>

              {/* 3 Status KPI Indicators */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Matched & Cleared
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-1 text-2xl font-mono font-bold text-emerald-950">
                    {reconcileList.filter((r) => r.matchStatus === "MATCHED").length} (98.6%)
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Total {formatCurrency(reconcileList.filter((r) => r.matchStatus === "MATCHED").reduce((acc, r) => acc + r.systemAmount, 0))} verified with bank UTRs
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Pending Clearance
                    </span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-1 text-2xl font-mono font-bold text-amber-950">
                    {reconcileList.filter((r) => r.matchStatus !== "MATCHED").length} (1.4%)
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {formatCurrency(reconcileList.filter((r) => r.matchStatus !== "MATCHED").reduce((acc, r) => acc + r.variance, 0))} Inward cheque deposited in clearing (T+2)
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      Discrepancy / Chargebacks
                    </span>
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="mt-1 text-2xl font-mono font-bold text-blue-950">
                    0
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Zero cashier till or gateway reconciliation variances
                  </p>
                </div>
              </div>
            </div>

            {/* Reconciliation Filters Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "ALL", label: `All Records (${reconcileList.length})` },
                  { id: "MATCHED", label: `Matched & Cleared (${reconcileList.filter((r) => r.matchStatus === "MATCHED").length})` },
                  { id: "PENDING", label: `Pending Clearing (${reconcileList.filter((r) => r.matchStatus !== "MATCHED").length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setReconcileTab(t.id as any)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      reconcileTab === t.id
                        ? "bg-[#0f2d52] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search UHID, Receipt, UTR..."
                  value={reconcileSearch}
                  onChange={(e) => setReconcileSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Side-by-Side Dual Ledger Reconciliation Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Patient Billing vs Bank Feed Comparison Ledger</h4>
                  <p className="text-xs text-slate-500">Side-by-side reconciliation of hospital POS receipts and bank credit statements</p>
                </div>
                <button
                  onClick={() =>
                    showNotification("Exporting reconciliation statement to Excel format...", "info")
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Export Reconciliation Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Receipt # & Patient</th>
                      <th className="px-4 py-3">Channel / Gateway</th>
                      <th className="px-4 py-3 text-right">Hospital LIS Amount</th>
                      <th className="px-4 py-3 text-right">Bank Statement Feed</th>
                      <th className="px-4 py-3">Bank UTR / Ref</th>
                      <th className="px-4 py-3 text-center">Variance</th>
                      <th className="px-4 py-3 text-center">Match Status</th>
                      <th className="px-4 py-3 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reconcileList
                      .filter((r) => {
                        if (reconcileTab === "MATCHED") return r.matchStatus === "MATCHED";
                        if (reconcileTab === "PENDING") return r.matchStatus !== "MATCHED";
                        return true;
                      })
                      .filter((r) => {
                        if (!reconcileSearch.trim()) return true;
                        const q = reconcileSearch.toLowerCase();
                        return (
                          r.receiptNumber.toLowerCase().includes(q) ||
                          r.uhid.toLowerCase().includes(q) ||
                          r.patientName.toLowerCase().includes(q) ||
                          r.bankRef.toLowerCase().includes(q)
                        );
                      })
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-bold text-slate-900">{r.receiptNumber}</div>
                            <div className="text-slate-800 font-medium">{r.patientName}</div>
                            <div className="text-[11px] text-blue-700 font-mono">{r.uhid}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-slate-800">{r.channelLabel}</span>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {new Date(r.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(r.systemAmount)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                            {r.bankFeedAmount > 0 ? (
                              <span className="text-emerald-700">{formatCurrency(r.bankFeedAmount)}</span>
                            ) : (
                              <span className="text-amber-600 italic">Pending Bank Inflow</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-mono text-xs text-slate-700 flex items-center gap-1">
                              <span>{r.bankRef}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(r.bankRef);
                                  showNotification(`Copied Reference: ${r.bankRef}`, "info");
                                }}
                                title="Copy bank reference"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{r.notes}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {r.variance === 0 ? (
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                ₹0.00
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-700 border border-amber-200">
                                +{formatCurrency(r.variance)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {r.matchStatus === "MATCHED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Verified Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Clearing (T+2)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {r.matchStatus !== "MATCHED" ? (
                              r.channel === "CHEQUE" ? (
                                <button
                                  onClick={() => {
                                    setChequeClearingItem(r);
                                    setIsChequeClearOpen(true);
                                  }}
                                  className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow-xs inline-flex items-center gap-1"
                                >
                                  <Clock className="h-3 w-3" /> Clear Cheque
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyReconciliationItem(r.id)}
                                  className="rounded-xl bg-[#0f2d52] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs"
                                >
                                  Clear & Match
                                </button>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <Check className="h-3 w-3" /> Reconciled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: REPORTS TAB */}
        {activeTab === "Reports" && (
          <div className="space-y-6">
            {/* Header & Sub-Tab Navigation Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Hospital & Clinical Financial Reporting Center
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standardized day books, tender registers, cashier performance sheets, and healthcare GST exemption filings
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
                    {["Today", "Yesterday", "Last 7 Days", "This Month"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setReportDateRange(range)}
                        className={`rounded-lg px-2.5 py-1 font-bold transition ${
                          reportDateRange === range
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Official PDF
                  </button>
                </div>
              </div>

              {/* 5 Report Sub-Tabs Switcher */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[
                  { id: "DAY_BOOK", label: "Daily Cash Book (Day Book)", icon: FileText },
                  { id: "MODE_WISE", label: "Tender Mix & MDR Analysis", icon: CreditCard },
                  { id: "CASHIER_TALLY", label: "Cashier Shift Performance", icon: User },
                  { id: "GST_SAC", label: "GST & SAC 999312 Exemption", icon: Landmark },
                  { id: "DEPARTMENT", label: "Department Revenue Breakdown", icon: Stethoscope },
                  { id: "DOCTOR_REFERRAL", label: "Referring Doctor Referral MIS", icon: User },
                ].map((rep) => {
                  const IconComp = rep.icon;
                  const isActive = activeReportView === rep.id;
                  return (
                    <button
                      key={rep.id}
                      onClick={() => setActiveReportView(rep.id as any)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        isActive
                          ? "bg-blue-50 text-blue-800 border border-blue-200 shadow-xs"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <IconComp className={`h-3.5 w-3.5 ${isActive ? "text-blue-700" : "text-slate-500"}`} />
                      {rep.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic View 1: DAILY CASH BOOK (DAY BOOK) */}
            {activeReportView === "DAY_BOOK" && (
              <div className="space-y-4">
                {/* Cash Day Book Balance Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Opening Till Float</span>
                    <div className="text-lg font-mono font-bold text-slate-900 mt-1">{formatCurrency(26250)}</div>
                    <span className="text-[10px] text-slate-400">Verified at 08:30 AM</span>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Total Cash Inflow</span>
                    <div className="text-lg font-mono font-bold text-emerald-700 mt-1">+{formatCurrency(17800)}</div>
                    <span className="text-[10px] text-emerald-600">Patient OPD receipts</span>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-rose-800">Petty Cash Vouchers</span>
                    <div className="text-lg font-mono font-bold text-rose-600 mt-1">-{formatCurrency(430)}</div>
                    <span className="text-[10px] text-rose-600">Courier & lab supplies</span>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-blue-800">Vault Bank Transfer</span>
                    <div className="text-lg font-mono font-bold text-blue-700 mt-1">-{formatCurrency(20000)}</div>
                    <span className="text-[10px] text-blue-600">Deposited to HDFC Current A/c</span>
                  </div>
                  <div className="rounded-xl border border-slate-300 bg-slate-900 p-3.5 text-white shadow-xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Closing Cash in Hand</span>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{formatCurrency(23620)}</div>
                    <span className="text-[10px] text-slate-300">Physical till verified</span>
                  </div>
                </div>

                {/* Day Book Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Chronological Cash Drawer Register</span>
                    <span className="font-mono text-xs text-slate-500">Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Time</th>
                        <th className="px-4 py-2.5">Voucher / Receipt #</th>
                        <th className="px-4 py-2.5">Particulars / Transaction Narrative</th>
                        <th className="px-4 py-2.5 text-right">Cash Received (₹)</th>
                        <th className="px-4 py-2.5 text-right">Cash Paid (₹)</th>
                        <th className="px-4 py-2.5 text-right">Cumulative Till Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr className="bg-slate-50/40">
                        <td className="px-4 py-2.5 text-slate-500">08:30 AM</td>
                        <td className="px-4 py-2.5 text-slate-700 font-bold">FLOAT-ALLOC-01</td>
                        <td className="px-4 py-2.5 font-sans text-slate-800">Opening Till Float Allocation (Jaya Ashapurama)</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(26250)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(26250)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-500">11:30 AM</td>
                        <td className="px-4 py-2.5 text-slate-700 font-bold">PV-2026-081</td>
                        <td className="px-4 py-2.5 font-sans text-slate-800">Petty Cash: Phlebotomy Ice Pack & Dry Ice Supplies</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-4 py-2.5 text-right text-rose-600 font-bold">{formatCurrency(250)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(26000)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-500">12:15 PM</td>
                        <td className="px-4 py-2.5 text-slate-700 font-bold">REC-2026-1003</td>
                        <td className="px-4 py-2.5 font-sans text-slate-800">Cash OPD Bill: Nirav Joshi (UHID-24815)</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{formatCurrency(15400)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(41400)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-500">02:15 PM</td>
                        <td className="px-4 py-2.5 text-slate-700 font-bold">PV-2026-082</td>
                        <td className="px-4 py-2.5 font-sans text-slate-800">Petty Cash: Urgent Biopsy Specimen Courier Disbursal</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-4 py-2.5 text-right text-rose-600 font-bold">{formatCurrency(180)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(41220)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-500">03:45 PM</td>
                        <td className="px-4 py-2.5 text-slate-700 font-bold">REC-2026-1007</td>
                        <td className="px-4 py-2.5 font-sans text-slate-800">Cash Advance Deposit: Rina Patel (UHID-24813)</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{formatCurrency(2400)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(43620)}</td>
                      </tr>
                      <tr className="bg-blue-50/40">
                        <td className="px-4 py-2.5 text-slate-500">05:00 PM</td>
                        <td className="px-4 py-2.5 text-slate-700 font-bold">BNK-DEP-0926</td>
                        <td className="px-4 py-2.5 font-sans text-slate-800">Mid-day Bank Deposit to HDFC Hospital Current A/c</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-4 py-2.5 text-right text-blue-700 font-bold">{formatCurrency(20000)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{formatCurrency(23620)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dynamic View 2: TENDER MIX & MDR ANALYSIS */}
            {activeReportView === "MODE_WISE" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { mode: "Physical Cash", share: "38%", amount: 48900, count: 28, color: "text-slate-800", bg: "bg-slate-100" },
                    { mode: "EDC Card Swipes", share: "30%", amount: 38650, count: 24, color: "text-blue-700", bg: "bg-blue-50" },
                    { mode: "Dynamic BharatQR / UPI", share: "27%", amount: 34740, count: 32, color: "text-emerald-700", bg: "bg-emerald-50" },
                    { mode: "Cheques & Bank NEFT", share: "5%", amount: 6440, count: 2, color: "text-purple-700", bg: "bg-purple-50" },
                  ].map((m, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{m.mode}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${m.bg} ${m.color}`}>{m.share}</span>
                      </div>
                      <div className="mt-2 text-xl font-mono font-bold text-slate-900">{formatCurrency(m.amount)}</div>
                      <div className="mt-1 text-xs text-slate-500">{m.count} Bills Processed</div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Payment Channel & Merchant Interchange Reconciliation</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Tender Channel</th>
                        <th className="px-4 py-3 text-center">Receipt Count</th>
                        <th className="px-4 py-3 text-right">Gross Volume</th>
                        <th className="px-4 py-3 text-right">MDR / Gateway Fee</th>
                        <th className="px-4 py-3 text-right">Net Hospital Inflow</th>
                        <th className="px-4 py-3 text-center">Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Physical Cash (OPD & Emergency Counters)</td>
                        <td className="px-4 py-3 text-center font-mono">28</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(48900)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">₹0.00 (Nil)</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(48900)}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">38.0%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">PineLabs & HDFC EDC Card Terminals</td>
                        <td className="px-4 py-3 text-center font-mono">24</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(38650)}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">-₹579.75</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(38070.25)}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">30.0%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Razorpay Dynamic BharatQR / UPI</td>
                        <td className="px-4 py-3 text-center font-mono">32</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(34740)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">₹0.00 (Zero MDR)</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(34740)}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">27.0%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Cheque Deposits & Bank NEFT/IMPS</td>
                        <td className="px-4 py-3 text-center font-mono">2</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(6440)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">₹0.00 (Nil)</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(6440)}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">5.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dynamic View 3: CASHIER SHIFT PERFORMANCE */}
            {activeReportView === "CASHIER_TALLY" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "Jaya Ashapurama", role: "Sr. Billing Cashier", counter: "Counter 01 (Main OPD)", bills: 48, total: 62450, variance: 0, status: "TALLY_MATCHED" },
                    { name: "Riya Patel", role: "Junior Cashier", counter: "Counter 02 (Stat Emergency)", bills: 22, total: 28900, variance: 0, status: "TALLY_MATCHED" },
                    { name: "Prakash Mehta", role: "Phlebotomist / Cashier", counter: "Counter 03 (Collection Center)", bills: 16, total: 18400, variance: 0, status: "TALLY_MATCHED" },
                  ].map((c, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.role} • {c.counter}</div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Zero Variance
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Receipts</span>
                          <div className="font-mono font-bold text-slate-800 text-sm">{c.bills} Bills</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Total Turned Over</span>
                          <div className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(c.total)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic View 4: GST & SAC 999312 EXEMPTION REGISTER */}
            {activeReportView === "GST_SAC" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <Landmark className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                        Statutory GST Exemption for Healthcare & Diagnostic Services (SAC 999312)
                      </h4>
                      <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                        Under Ministry of Finance <strong>Notification No. 12/2017 - Central Tax (Rate) dated 28th June 2017, Serial No. 74</strong>, healthcare diagnostic, pathological, biochemical, and radiological investigations provided by an authorized clinical establishment are <strong>NIL-RATED / EXEMPT</strong> from CGST, SGST, and IGST.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">SAC / HSN Code</th>
                        <th className="px-4 py-3">Service Classification</th>
                        <th className="px-4 py-3 text-right">Taxable Turnover</th>
                        <th className="px-4 py-3 text-center">CGST (0%)</th>
                        <th className="px-4 py-3 text-center">SGST (0%)</th>
                        <th className="px-4 py-3 text-center">Tax Payable</th>
                        <th className="px-4 py-3">Exemption Citation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="px-4 py-3 font-bold text-blue-700">SAC 999312</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-900">Pathology & Clinical Laboratory Blood Tests</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(78500)}</td>
                        <td className="px-4 py-3 text-center text-slate-500">0.00</td>
                        <td className="px-4 py-3 text-center text-slate-500">0.00</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-bold">₹0.00 (NIL)</td>
                        <td className="px-4 py-3 font-sans text-xs text-slate-500">Notif 12/2017-CT(R) Sl.74</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-blue-700">SAC 999312</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-900">Histopathology & Cytopathology Biopsy Studies</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(24800)}</td>
                        <td className="px-4 py-3 text-center text-slate-500">0.00</td>
                        <td className="px-4 py-3 text-center text-slate-500">0.00</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-bold">₹0.00 (NIL)</td>
                        <td className="px-4 py-3 font-sans text-xs text-slate-500">Notif 12/2017-CT(R) Sl.74</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-blue-700">SAC 999312</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-900">Microbiology Culture & Sensitivity Panels</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(19400)}</td>
                        <td className="px-4 py-3 text-center text-slate-500">0.00</td>
                        <td className="px-4 py-3 text-center text-slate-500">0.00</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-bold">₹0.00 (NIL)</td>
                        <td className="px-4 py-3 font-sans text-xs text-slate-500">Notif 12/2017-CT(R) Sl.74</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dynamic View 5: DEPARTMENT REVENUE BREAKDOWN */}
            {activeReportView === "DEPARTMENT" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Laboratory Section & Sub-Specialty Contribution</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Laboratory Department</th>
                        <th className="px-4 py-3 text-center">Specimen Count</th>
                        <th className="px-4 py-3 text-right">Revenue Billed</th>
                        <th className="px-4 py-3 text-center">Section Share</th>
                        <th className="px-4 py-3">Chief Pathologist / In-Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Biochemistry & Immunoassays</td>
                        <td className="px-4 py-3 text-center font-mono">54 Samples</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(48600)}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">38.5%</td>
                        <td className="px-4 py-3 text-slate-600">Dr. S. K. Rao (MD Biochem)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Hematology & Coagulation</td>
                        <td className="px-4 py-3 text-center font-mono">38 Samples</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(31200)}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">24.7%</td>
                        <td className="px-4 py-3 text-slate-600">Dr. Ananya Sen (MD Path)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Microbiology & Molecular RT-PCR</td>
                        <td className="px-4 py-3 text-center font-mono">22 Samples</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(22500)}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">17.8%</td>
                        <td className="px-4 py-3 text-slate-600">Dr. K. S. Trivedi (MD Micro)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Histopathology & Surgical Biopsy</td>
                        <td className="px-4 py-3 text-center font-mono">12 Samples</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(16800)}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">13.3%</td>
                        <td className="px-4 py-3 text-slate-600">Dr. Rajesh Varma (MD Path)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Clinical Sonography & ECG</td>
                        <td className="px-4 py-3 text-center font-mono">6 Patients</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(7150)}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">5.7%</td>
                        <td className="px-4 py-3 text-slate-600">Dr. Neha Shah (DMRD)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dynamic View 6: REFERRING DOCTOR REFERRAL MIS */}
            {activeReportView === "DOCTOR_REFERRAL" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Active Referring Clinicians</span>
                    <div className="text-xl font-mono font-bold text-slate-900 mt-1">28 Doctors</div>
                    <span className="text-[10px] text-slate-400">Attached OPD & Clinics</span>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Total Patient Referrals</span>
                    <div className="text-xl font-mono font-bold text-emerald-700 mt-1">114 Orders</div>
                    <span className="text-[10px] text-emerald-600">This Month</span>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-blue-800">Billed Diagnostic Value</span>
                    <div className="text-xl font-mono font-bold text-blue-700 mt-1">{formatCurrency(128450)}</div>
                    <span className="text-[10px] text-blue-600">Diagnostic Revenue Yield</span>
                  </div>
                  <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-purple-800">Average Yield Per Order</span>
                    <div className="text-xl font-mono font-bold text-purple-700 mt-1">{formatCurrency(1126.75)}</div>
                    <span className="text-[10px] text-purple-600">Prescription Basket Size</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Referring Physician Volume & Diagnostic Yield MIS</h4>
                      <p className="text-[11px] text-slate-500">Compliant clinician attribution register and test prescription breakdown</p>
                    </div>
                    <button
                      onClick={() => showNotification("Exporting Referring Doctor MIS statement to Excel...", "info")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Export Clinician MIS
                    </button>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Clinician Name & Medical Reg #</th>
                        <th className="px-4 py-3">Clinic / Hospital Attachment</th>
                        <th className="px-4 py-3">Specialty</th>
                        <th className="px-4 py-3 text-center">Patients Referred</th>
                        <th className="px-4 py-3 text-center">Tests Prescribed</th>
                        <th className="px-4 py-3 text-right">Billed Revenue (₹)</th>
                        <th className="px-4 py-3 text-center">Share</th>
                        <th className="px-4 py-3 text-right">Attribution Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: "Dr. Rajesh Dave", reg: "GMC-39201", clinic: "Dave Heart Clinic, Navrangpura", spec: "Cardiology & Internal Med", patients: 34, tests: 92, revenue: 42800, share: "33.3%" },
                        { name: "Dr. Priya Sharma", reg: "GMC-44102", clinic: "Shreeji Endocrine Centre", spec: "Diabetology & Endocrinology", patients: 28, tests: 76, revenue: 31400, share: "24.4%" },
                        { name: "Dr. Animesh Roy", reg: "GMC-19402", clinic: "Lifecare Multi-Specialty Clinic", spec: "General Medicine", patients: 22, tests: 48, revenue: 22150, share: "17.2%" },
                        { name: "Dr. Meera Desai", reg: "GMC-51029", clinic: "Mother & Child Maternity Clinic", spec: "OBGYN & Fetal Medicine", patients: 18, tests: 42, revenue: 19800, share: "15.4%" },
                        { name: "Dr. K. S. Trivedi", reg: "GMC-22810", clinic: "Sterling Kidney Care Hospital", spec: "Nephrology & Urology", patients: 12, tests: 28, revenue: 12300, share: "9.6%" },
                      ].map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{doc.name}</div>
                            <div className="font-mono text-[10px] text-blue-700 mt-0.5">{doc.reg}</div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">{doc.clinic}</td>
                          <td className="px-4 py-3.5 text-slate-600">{doc.spec}</td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">{doc.patients}</td>
                          <td className="px-4 py-3.5 text-center font-mono text-slate-700">{doc.tests}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatCurrency(doc.revenue)}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{doc.share}</td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => showNotification(`Generating referral breakdown report for ${doc.name}...`, "info")}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                            >
                              Prescriptions
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: AUDIT LOG TAB */}
        {activeTab === "Audit Log" && (
          <div className="space-y-6">
            {/* KPI Header Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Audited Events</span>
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-slate-900">{auditLogsList.length}</div>
                <p className="mt-1 text-[11px] text-slate-500">Immutable, tamper-evident log records</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Till & Float Movements</span>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-emerald-700">
                  {auditLogsList.filter((a) => a.category === "TILL_FLOAT").length}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Physical drawer opens & petty disbursements</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supervisory Overrides</span>
                  <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-purple-700">
                  {auditLogsList.filter((a) => a.category === "DISCOUNT_OVERRIDE").length}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Medical Superintendent signed concessions</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Refunds & Reversals</span>
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-700">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-rose-700">
                  {auditLogsList.filter((a) => a.category === "REFUND").length}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Linked to clinical sample cancellations</p>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "ALL", label: "All Events" },
                  { id: "PAYMENT", label: "Payments" },
                  { id: "TILL_FLOAT", label: "Till & Petty Cash" },
                  { id: "REFUND", label: "Refunds" },
                  { id: "DISCOUNT_OVERRIDE", label: "Overrides" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAuditCategoryFilter(c.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      auditCategoryFilter === c.id
                        ? "bg-[#0f2d52] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff, UHID, receipt, IP..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  onClick={() =>
                    showNotification("Exporting ISO 15189 compliance audit log to CSV...", "info")
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Trail
                </button>
              </div>
            </div>

            {/* Audit Trail Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hospital Billing Security & Compliance Audit Trail</h4>
                  <p className="text-xs text-slate-500">Tamper-evident log of all collections, cash till operations, refunds, and supervisory concessions</p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Immutable Ledger
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Operator / Cashier</th>
                      <th className="px-4 py-3">Terminal & IP</th>
                      <th className="px-4 py-3">Action & Financial Details</th>
                      <th className="px-4 py-3">Entity Ref</th>
                      <th className="px-4 py-3 text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogsList
                      .filter((a) => {
                        if (auditCategoryFilter !== "ALL" && a.category !== auditCategoryFilter) return false;
                        if (!auditSearch.trim()) return true;
                        const q = auditSearch.toLowerCase();
                        return (
                          a.actor.toLowerCase().includes(q) ||
                          a.actorEmpCode.toLowerCase().includes(q) ||
                          a.entityRef.toLowerCase().includes(q) ||
                          a.patientUhid?.toLowerCase().includes(q) ||
                          a.description.toLowerCase().includes(q) ||
                          a.terminalIp.toLowerCase().includes(q)
                        );
                      })
                      .map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 font-mono text-slate-600">
                            <div>
                              {new Date(a.timestamp).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(a.timestamp).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                a.category === "PAYMENT"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : a.category === "TILL_FLOAT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : a.category === "REFUND"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {a.categoryLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{a.actor}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {a.actorEmpCode} • {a.counter}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-mono text-xs text-slate-700 flex items-center gap-1">
                              <Lock className="h-3 w-3 text-slate-400" />
                              {a.terminalIp}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-sm">
                            <div className="font-semibold text-slate-900">{a.action}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{a.description}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono">
                            <div className="font-bold text-blue-700 flex items-center gap-1">
                              <span>{a.entityRef}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(a.entityRef);
                                  showNotification(`Copied Reference: ${a.entityRef}`, "info");
                                }}
                                title="Copy reference"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                              </button>
                            </div>
                            {a.patientUhid && (
                              <div className="text-[10px] text-slate-500 mt-0.5">{a.patientUhid}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                a.severity === "SUPERVISOR_OVERRIDE"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : a.severity === "FINANCIAL_IMPACT"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {a.severity === "SUPERVISOR_OVERRIDE"
                                ? "Supervisor Signoff"
                                : a.severity === "FINANCIAL_IMPACT"
                                ? "Financial Impact"
                                : "Standard Info"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: POS EDC BATCH SETTLEMENT SLIP */}
        {selectedSettlementSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-blue-700" />
                  <h3 className="text-base font-bold text-slate-900">POS EDC Terminal Batch Settlement Slip</h3>
                </div>
                <button
                  onClick={() => setSelectedSettlementSlip(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Slip Content */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 font-mono text-xs text-slate-800 space-y-3">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <div className="font-bold text-sm tracking-wider text-slate-900">ELIS CLINICAL DIAGNOSTICS & HOSPITAL</div>
                  <div className="text-[11px] text-slate-500 font-sans">Electronic Draft Capture (EDC) Batch Settlement Summary</div>
                  <div className="text-[11px] text-slate-500 font-sans">GSTIN: 24AAACG0123M1Z9 • SAC: 999312</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">BATCH NO:</span> <strong className="text-slate-900">{selectedSettlementSlip.id}</strong></div>
                  <div><span className="text-slate-500">DATE:</span> <strong className="text-slate-900">{selectedSettlementSlip.date}</strong></div>
                  <div><span className="text-slate-500">TERMINAL TID:</span> <strong className="text-slate-900">{selectedSettlementSlip.terminalId}</strong></div>
                  <div><span className="text-slate-500">COUNTER:</span> <strong className="text-slate-900">{selectedSettlementSlip.counter}</strong></div>
                  <div><span className="text-slate-500">PROVIDER:</span> <strong className="text-slate-900">{selectedSettlementSlip.provider}</strong></div>
                  <div><span className="text-slate-500">OPERATOR:</span> <strong className="text-slate-900">{selectedSettlementSlip.closedBy}</strong></div>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>TOTAL TRANSACTIONS:</span>
                    <strong>{selectedSettlementSlip.txnCount} Swipes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>GROSS AMOUNT SWIPED:</span>
                    <strong>{formatCurrency(selectedSettlementSlip.gross)}</strong>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>MDR DEDUCTION (1.5% + GST):</span>
                    <strong>-{formatCurrency(selectedSettlementSlip.fees)}</strong>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-emerald-700 border-t border-slate-200 pt-1.5">
                    <span>NET BANK DEPOSIT:</span>
                    <span>{formatCurrency(selectedSettlementSlip.net)}</span>
                  </div>
                </div>

                <div className="text-[11px] space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">BANK UTR REFERENCE:</span>
                    <strong className="text-blue-700">{selectedSettlementSlip.utr}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SETTLEMENT STATUS:</span>
                    <strong className="text-emerald-700">{selectedSettlementSlip.status}</strong>
                  </div>
                </div>

                <div className="pt-4 text-center text-[10px] text-slate-400 font-sans border-t border-dashed border-slate-300">
                  *** END OF SETTLEMENT BATCH REPORT ***
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedSettlementSlip(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Slip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PHYSICAL TILL HANDOVER & DENOMINATION SLIP */}
        {isDenominationPrintOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Physical Till Handover & Denomination Statement</h3>
                    <p className="text-[11px] text-slate-500">Official Shift End Cash Reconciliation & Safe Vault Handover</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDenominationPrintOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Cash Till Slip Body */}
              <div id="denomination-handover-slip" className="mt-4 rounded-xl border border-slate-200 bg-white p-5 font-mono text-xs text-slate-800 space-y-4">
                {/* Hospital Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3 font-sans">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-[#0f2d52]">
                    <Building2 className="h-4 w-4 text-sky-600" />
                    ELIS CLINICAL HOSPITAL & DIAGNOSTIC BILLING DESK
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    NABL ISO 15189:2022 Certified • Medical Diagnostic Center & Cash Office
                  </div>
                  <div className="mt-2 inline-block rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                    PHYSICAL CASH DENOMINATION STATEMENT
                  </div>
                </div>

                {/* Session Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans border-b border-dashed border-slate-300 pb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TILL / COUNTER</span>
                    <span className="font-bold text-slate-800">{activeCounter}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CASHIER IN-CHARGE</span>
                    <span className="font-bold text-slate-800">Jaya Ashapurama (EMP-104)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">HANDOVER DATE & TIME</span>
                    <span className="font-semibold text-slate-700">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">STATUS / AUDIT HASH</span>
                    <span className="font-bold text-emerald-700">VERIFIED • #TL-9921</span>
                  </div>
                </div>

                {/* Currency Denominations Tally Table */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-sans">
                    Physical Currency Count (Indian Rupee ₹)
                  </div>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 font-sans">
                      <tr>
                        <th className="px-3 py-1.5">Denomination</th>
                        <th className="px-3 py-1.5 text-center">Physical Count</th>
                        <th className="px-3 py-1.5 text-right">Computed Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {[
                        { note: 500, label: "₹500 Currency Note" },
                        { note: 200, label: "₹200 Currency Note" },
                        { note: 100, label: "₹100 Currency Note" },
                        { note: 50, label: "₹50 Currency Note" },
                        { note: 20, label: "₹20 Currency Note" },
                        { note: 10, label: "₹10 Currency Note" },
                      ].map((d) => {
                        const count = denominations[d.note] || 0;
                        const subtotal = count * d.note;
                        return (
                          <tr key={d.note} className="hover:bg-slate-50/50">
                            <td className="px-3 py-1 font-semibold text-slate-700">{d.label}</td>
                            <td className="px-3 py-1 text-center font-bold text-slate-900">{count}</td>
                            <td className="px-3 py-1 text-right font-bold text-slate-900">{formatCurrency(subtotal)}</td>
                          </tr>
                        );
                      })}
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-3 py-1 font-semibold text-slate-700">Coins & Fractional Change</td>
                        <td className="px-3 py-1 text-center font-bold text-slate-900">—</td>
                        <td className="px-3 py-1 text-right font-bold text-slate-900">{formatCurrency(denominations.coins || 0)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 uppercase text-[10px] text-slate-700 font-sans">
                          Total Physical Cash in Till
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold text-emerald-800 text-sm">
                          {formatCurrency(
                            (denominations[500] || 0) * 500 +
                            (denominations[200] || 0) * 200 +
                            (denominations[100] || 0) * 100 +
                            (denominations[50] || 0) * 50 +
                            (denominations[20] || 0) * 20 +
                            (denominations[10] || 0) * 10 +
                            (denominations.coins || 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Shift Till Balance Reconciliation */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-sans space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Shift Opening Float Allocation:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(5000)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Collections (Shift Bill Receipts):</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +{formatCurrency(payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0) || 36280)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Petty Cash Disbursed (Courier/Dry Ice):</span>
                    <span className="font-mono font-bold text-rose-700">
                      -{formatCurrency(pettyCashMovements.filter((m) => m.type === "OUT").reduce((s, m) => s + m.amount, 0))}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                    <span>System Expected Balance:</span>
                    <span className="font-mono">{formatCurrency(40850)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-emerald-800">Reconciliation Variance:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 border border-emerald-300 rounded px-2 py-0.5 text-[11px] font-mono">
                      <CheckCircle2 className="h-3 w-3" /> ₹0.00 (EXACTLY BALANCED)
                    </span>
                  </div>
                </div>

                {/* Cashier Notes if any */}
                {cashierNotes && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs font-sans text-amber-900">
                    <span className="font-bold block text-[10px] uppercase text-amber-700">Cashier / Seal Remarks:</span>
                    {cashierNotes}
                  </div>
                )}

                {/* Dual Sign-off Boxes */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-slate-300 font-sans text-xs">
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-white text-center">
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-[11px] text-slate-500 font-mono">
                      Jaya Ashapurama
                    </div>
                    <div className="pt-1.5 font-bold text-slate-800 text-[11px]">Relieving Cashier</div>
                    <div className="text-[10px] text-slate-400">Cash Counter Operator (EMP-104)</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-white text-center">
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-[11px] text-slate-500 font-mono">
                      Sunita Deshmukh
                    </div>
                    <div className="pt-1.5 font-bold text-slate-800 text-[11px]">Accounts Supervisor</div>
                    <div className="text-[10px] text-slate-400">Central Cash Office Verifier</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDenominationPrintOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0f2d52] px-5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Denomination Slip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: STATUTORY GST CREDIT NOTE A4 SLIP */}
        {selectedCreditNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Statutory GST Credit Note & Reversal Voucher</h3>
                    <p className="text-[11px] text-slate-500">Section 34 of Central Goods & Services Tax (CGST) Act, 2017</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCreditNote(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Credit Note Body */}
              <div id="gst-credit-note-slip" className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-xs text-slate-800 space-y-4 font-sans">
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-base font-extrabold text-[#0f2d52] tracking-tight">
                        ELIS CLINICAL HOSPITAL & DIAGNOSTIC CENTRE
                      </h2>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Central Laboratory & Multispeciality Clinical Hospital
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Opp. Civil Hospital Road, Navrangpura, Ahmedabad - 380009 | Tel: +91 79 4000 8800
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
                        <span className="font-bold text-slate-800">GSTIN:</span> 27AABCE1234F1Z5
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-slate-800">PAN:</span> AABCE1234F
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-teal-700">NABL ISO 15189:2022</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-md bg-rose-50 border border-rose-300 px-2.5 py-1 text-[11px] font-extrabold text-rose-800 uppercase tracking-wide">
                        CREDIT NOTE
                      </span>
                      <div className="font-mono font-bold text-xs text-slate-900 mt-1.5">
                        {selectedCreditNote.creditNoteNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Date: {formatDate(selectedCreditNote.requestedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Reference & Patient Box */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Patient Details (Recipient)
                    </span>
                    <div className="font-bold text-slate-900 text-xs">{selectedCreditNote.patientName}</div>
                    <div className="font-mono text-[11px] text-slate-700 mt-0.5">
                      UHID: <span className="font-bold">{selectedCreditNote.patientUhid}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Phone: {maskPhoneNumber(selectedCreditNote.phone)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Original Tax Invoice / Bill Reference
                    </span>
                    <div className="text-[11px] font-mono text-slate-800">
                      Txn Ref: <span className="font-bold">{selectedCreditNote.transactionId}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-800 mt-0.5">
                      Receipt #: <span className="font-bold">{selectedCreditNote.receiptNumber}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-800 mt-0.5">
                      Order #: <span className="font-bold">{selectedCreditNote.orderNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Reason & Diagnostic Justification */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Reason Code: {selectedCreditNote.reasonCode || "CLINICAL_REV"}
                    </span>
                    <span className="font-bold text-xs text-amber-950">{selectedCreditNote.reasonTitle}</span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                    {selectedCreditNote.reasonDescription}
                  </p>
                </div>

                {/* Credit Note Tax & Financial Breakdown Table */}
                <div>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Service Description / SAC Code</th>
                        <th className="px-3 py-2 text-right">Original Invoiced (₹)</th>
                        <th className="px-3 py-2 text-right">GST Rate</th>
                        <th className="px-3 py-2 text-right">Tax Reversal (₹)</th>
                        <th className="px-3 py-2 text-right">Credit Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-800">Clinical Diagnostic & Pathological Investigation</div>
                          <div className="text-[10px] text-slate-500 font-mono">SAC 999312 • Health Care Services</div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                          {formatCurrency(selectedCreditNote.originalAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                          0% (Exempt)
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                          ₹0.00
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-extrabold text-rose-700">
                          {formatCurrency(selectedCreditNote.refundAmount)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right uppercase text-[10px] text-slate-600">
                          Total Credit Note Value (Refund Payable to Patient):
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-extrabold text-rose-700 text-sm">
                          {formatCurrency(selectedCreditNote.refundAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="text-[10px] text-slate-500 italic mt-1">
                    * Healthcare services by clinical establishments are exempt under Sl. No. 74 of Notification No. 12/2017-Central Tax (Rate).
                  </div>
                </div>

                {/* Settlement & Payout Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Payout Mode:</span>
                    <span className="font-semibold text-slate-800">{selectedCreditNote.refundMode.replace(/_/g, " ")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Bank UTR / Cash Voucher #:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCreditNote.utr || "VCH-PENDING"}</span>
                  </div>
                </div>

                {/* Authorization Signatures */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-dashed border-slate-300 text-center text-[11px]">
                  <div className="border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="h-8 border-b border-dashed border-slate-200 flex items-end justify-center pb-1 text-slate-500 font-mono text-[10px]">
                      {selectedCreditNote.requestedBy}
                    </div>
                    <div className="pt-1 font-semibold text-slate-700">Prepared By</div>
                    <div className="text-[9px] text-slate-400">Cashier / Billing Clerk</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="h-8 border-b border-dashed border-slate-200 flex items-end justify-center pb-1 text-slate-500 font-mono text-[10px]">
                      Sunita Deshmukh
                    </div>
                    <div className="pt-1 font-semibold text-slate-700">Verified By</div>
                    <div className="text-[9px] text-slate-400">Finance & Accounts</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="h-8 border-b border-dashed border-slate-200 flex items-end justify-center pb-1 text-slate-500 font-mono text-[10px]">
                      {selectedCreditNote.authorizedBy}
                    </div>
                    <div className="pt-1 font-semibold text-slate-700">Authorized By</div>
                    <div className="text-[9px] text-slate-400">Medical Superintendent</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCreditNote(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0f2d52] px-5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Statutory Credit Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: COLLECT PAYMENT MODAL */}
        <CollectPaymentModal
          isOpen={isCollectModalOpen}
          onClose={() => setIsCollectModalOpen(false)}
          orders={orders}
          patients={patients}
          initialOrderId={initialCollectOrderId}
          initialAmount={initialCollectAmount}
          onPaymentSuccess={(createdPayment) => {
            fetchPayments();
            fetchMetrics();
            if (createdPayment) {
              handleOpenReceipt(createdPayment);
            }
          }}
          showNotification={showNotification}
        />

        {/* MODAL 2: SHIFT HANDOVER / TILL CLOSE MODAL */}
        <ShiftHandoverModal
          isOpen={isShiftHandoverOpen}
          onClose={() => setIsShiftHandoverOpen(false)}
          expectedCash={summary.cashDrawer || 40850}
          counterName={activeCounter}
          cashierName="Jaya Ashapurama"
          onShiftClosed={(closingData) => {
            showNotification(
              `Counter shift closed! Physical Till: ${formatCurrency(closingData.physicalCash)}`,
              "success"
            );
          }}
          showNotification={showNotification}
        />

        {/* MODAL 3: PATIENT ADVANCE MODAL */}
        <AdvanceDepositModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          patients={patients}
          initialPatientId={initialAdvancePatientId}
          onAdvanceSuccess={() => {
            fetchMetrics();
            fetchPayments();
          }}
          showNotification={showNotification}
        />

        {/* MODAL 4: REFUND REQUEST MODAL */}
        <RefundRequestModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          payments={payments}
          initialPaymentId={initialRefundPaymentId}
          initialAmount={initialRefundAmount}
          onRefundSuccess={() => {
            fetchPayments();
            fetchMetrics();
          }}
          showNotification={showNotification}
        />

        {/* MODAL 5: FINANCIAL REPORTS MODAL */}
        <FinancialReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          payments={payments}
          orders={orders}
          summary={summary}
        />

        {/* MODAL 6: WHATSAPP RECEIPT MODAL */}
        {whatsAppModalData && (
          <WhatsAppReceiptModal
            isOpen={Boolean(whatsAppModalData)}
            onClose={() => setWhatsAppModalData(null)}
            data={whatsAppModalData}
            showNotification={showNotification}
          />
        )}

        {/* MODAL 7: PETTY CASH LOG MODAL */}
        {isPettyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Log Petty Cash Movement</h3>
                <button
                  onClick={() => setIsPettyModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddPettyMovement} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Movement Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPettyType("OUT")}
                      className={`rounded-xl py-2 text-xs font-bold transition ${
                        pettyType === "OUT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Cash Out (Expense)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPettyType("IN")}
                      className={`rounded-xl py-2 text-xs font-bold transition ${
                        pettyType === "IN"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Cash In (Top-up)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pettyAmount}
                    onChange={(e) => setPettyAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-base font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Description / Voucher Reason *
                  </label>
                  <input
                    type="text"
                    value={pettyReason}
                    onChange={(e) => setPettyReason(e.target.value)}
                    placeholder="e.g. Courier charges, Tea, Dry ice"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPettyModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 active:scale-95 transition shadow-xs"
                  >
                    Save Movement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECEIPT PRINT & PDF PREVIEW MODAL */}
        {selectedReceiptPayment && (
          <PaymentReceipt
            payment={selectedReceiptPayment}
            isOpen={!!selectedReceiptPayment}
            onClose={() => setSelectedReceiptPayment(null)}
          />
        )}

        {/* PAYMENT DETAIL INSPECTION MODAL */}
        {selectedDetailPaymentId && (
          <PaymentDetailModal
            paymentId={selectedDetailPaymentId}
            onClose={() => setSelectedDetailPaymentId(null)}
            onOpenReceipt={(payment) => {
              setSelectedDetailPaymentId(null);
              handleOpenReceipt(payment);
            }}
            onInitiateRefund={(pId, amt) => {
              setSelectedDetailPaymentId(null);
              setInitialRefundPaymentId(pId);
              setInitialRefundAmount(String(amt));
              setIsRefundModalOpen(true);
            }}
          />
        )}

        {/* NOTIFICATION DISPATCH MODAL */}
        {notifyModalOpen && notifyPayload && (
          <NotificationDispatchModal
            isOpen={notifyModalOpen}
            onClose={() => setNotifyModalOpen(false)}
            payload={notifyPayload}
          />
        )}

        {/* MODAL 8: 3-INCH (80mm) THERMAL POS RECEIPT PREVIEW */}
        {thermalSlipPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    3-Inch (80mm) Thermal POS Slip
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setThermalSlipPayment(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thermal Slip Body */}
              <div
                id="thermal-pos-slip"
                className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4 font-mono text-xs text-slate-800 space-y-2.5 leading-tight"
              >
                {/* Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-2 font-sans">
                  <div className="font-extrabold text-xs text-[#0f2d52]">
                    ELIS CLINICAL HOSPITAL & LABS
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    NABL ISO 15189:2022 Certified Lab
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    GSTIN: 24AAACG0123M1Z9 • SAC: 999312
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Tel: +91 79 4000 8800 • Ahmedabad
                  </div>
                </div>

                {/* Patient & Txn Meta */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">RECEIPT #:</span>
                    <strong className="text-slate-900">{thermalSlipPayment.receiptNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TXN ID:</span>
                    <strong className="text-slate-900">{thermalSlipPayment.transactionId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DATE & TIME:</span>
                    <span>{formatDateTime(thermalSlipPayment.paidAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PATIENT:</span>
                    <strong className="text-slate-900">{thermalSlipPayment.patientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">UHID:</span>
                    <strong className="text-slate-800">{thermalSlipPayment.patientUhid}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ENCOUNTER:</span>
                    <strong className="text-blue-700">{thermalSlipPayment.encounterType || "OPD"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">REF DOCTOR:</span>
                    <span className="truncate max-w-[140px]">{thermalSlipPayment.doctorName || "OPD Consultant"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">COUNTER:</span>
                    <span>{thermalSlipPayment.counter || "Counter 01"}</span>
                  </div>
                </div>

                {/* Investigations List */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                  <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                    <span>Investigation / SAC 999312</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="pr-2">
                      <span className="block font-semibold text-slate-900">
                        {thermalSlipPayment.testNames || "Comprehensive Metabolic Profile"}
                      </span>
                      <span className="text-[9px] text-slate-400">SAC 999312 • Nil GST Healthcare</span>
                    </div>
                    <span className="font-bold text-slate-900 text-right shrink-0">
                      {formatCurrency(thermalSlipPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Gross Invoiced:</span>
                    <strong>{formatCurrency(thermalSlipPayment.invoiceTotal || thermalSlipPayment.amount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 0% Exempt):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-emerald-700 pt-0.5">
                    <span>AMOUNT PAID:</span>
                    <span>{formatCurrency(thermalSlipPayment.amount)}</span>
                  </div>
                  {Number(thermalSlipPayment.invoiceBalance || 0) > 0 && (
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>DUE BALANCE:</span>
                      <span>{formatCurrency(thermalSlipPayment.invoiceBalance)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                    <span>TENDER MODE:</span>
                    <strong>{thermalSlipPayment.method}</strong>
                  </div>
                  {thermalSlipPayment.instrumentRef && (
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>INSTRUMENT REF:</span>
                      <span>{thermalSlipPayment.instrumentRef}</span>
                    </div>
                  )}
                </div>

                {/* Cashier Footer & Barcode */}
                <div className="text-center space-y-1.5 pt-1">
                  <div className="text-[10px] text-slate-500">
                    CASHIER: <strong className="text-slate-800">{thermalSlipPayment.collectedBy}</strong>
                  </div>
                  <div className="font-mono text-[10px] tracking-widest text-slate-600 py-1 bg-white border border-slate-200 rounded">
                    *{thermalSlipPayment.receiptNumber}*
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans">
                    Get report on WhatsApp • Wish you good health!
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setThermalSlipPayment(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0f2d52] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print 80mm Slip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 9: BANK STATEMENT FEED IMPORT DIALOG */}
        {isBankImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Import Bank Account Credit Feed</h3>
                    <p className="text-[11px] text-slate-500">Upload e-statement or connect live banking API for automated reconciliation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBankImportOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Bank Account Preset Tabs */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Hospital Bank Account
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "HDFC", name: "HDFC Bank", desc: "A/c: 50200084920192 (Current)" },
                      { id: "ICICI", name: "ICICI Bank", desc: "A/c: 002405018291 (Ops)" },
                      { id: "SBI", name: "State Bank of India", desc: "A/c: 38291048291 (Treasury)" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBankProvider(b.id as any)}
                        className={`rounded-xl p-2.5 text-left border transition ${
                          selectedBankProvider === b.id
                            ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-300"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{b.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Area */}
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                  <Download className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-bold text-xs text-slate-800">
                    Drag and drop your bank e-statement (.CSV, .XLSX, or .OFX)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Exported directly from HDFC Corporate Netbanking or ICICI Corporate Portal
                  </div>
                  <div className="mt-3">
                    <span className="inline-block rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                      Browse File on Computer
                    </span>
                  </div>
                </div>

                {/* Sample Preloaded Feed Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Sample Inflows Ready for Import ({selectedBankProvider} Bank)
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">3 Credit Records</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <div className="bg-slate-50 p-2 font-mono text-[11px] flex justify-between border-b border-slate-200 text-slate-600 font-bold">
                      <span>Date / UTR Reference</span>
                      <span>Credited Amount</span>
                    </div>
                    <div className="p-2 space-y-1.5 divide-y divide-slate-100 font-mono text-[11px]">
                      <div className="flex justify-between pt-1">
                        <div>
                          <div className="font-bold text-slate-800">PineLabs Settlement • UTRIB20260926041</div>
                          <div className="text-[10px] text-slate-400">Card swipes batch SET-2026-441</div>
                        </div>
                        <span className="font-bold text-emerald-700">+₹33,982.50</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <div>
                          <div className="font-bold text-slate-800">Razorpay BharatQR • UPIPAY20260926992</div>
                          <div className="text-[10px] text-slate-400">UPI collections batch SET-2026-442</div>
                        </div>
                        <span className="font-bold text-emerald-700">+₹21,800.00</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <div>
                          <div className="font-bold text-slate-800">HDFC Card Terminal • PENDING_CREDIT</div>
                          <div className="text-[10px] text-slate-400">Emergency Desk batch SET-2026-443</div>
                        </div>
                        <span className="font-bold text-slate-800">+₹12,312.50</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBankImportOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBankImportOpen(false);
                      showNotification(`Successfully imported bank feed from ${selectedBankProvider} Bank! 3 credit entries matched with billing vouchers.`, "success");
                    }}
                    className="rounded-xl bg-[#0f2d52] px-5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Import & Run Auto-Match
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 10: INWARD CHEQUE CLEARANCE DIALOG */}
        {isChequeClearOpen && chequeClearingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Inward Cheque Clearing Confirmation</h3>
                    <p className="text-[11px] text-slate-500">CTS Cheque Realization & Bank Settlement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChequeClearOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {/* Cheque Info Box */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1 font-mono">
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-500">Patient:</span>
                    <strong className="text-slate-900 font-bold">{chequeClearingItem.patientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">UHID / Receipt:</span>
                    <span className="text-slate-800">{chequeClearingItem.uhid} • {chequeClearingItem.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Cheque Number:</span>
                    <strong className="text-blue-700">{chequeClearingItem.bankRef}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                    <span className="text-slate-700 font-sans">Cheque Amount:</span>
                    <span className="text-emerald-700">{formatCurrency(chequeClearingItem.systemAmount)}</span>
                  </div>
                </div>

                {/* Input Fields */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Bank Clearing Date *
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Bank Realization UTR / Clearance Reference *
                  </label>
                  <input
                    type="text"
                    defaultValue={`CTS-HDFC-${Date.now().toString().slice(-6)}`}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Clearing House / Bank Branch
                  </label>
                  <input
                    type="text"
                    defaultValue="Ahmedabad CTS Clearing House (HDFC Bank)"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsChequeClearOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReconcileList((prev) =>
                        prev.map((item) =>
                          item.id === chequeClearingItem.id
                            ? {
                                ...item,
                                matchStatus: "MATCHED",
                                variance: 0,
                                bankFeedAmount: item.systemAmount,
                                notes: "Cheque realized through CTS clearing; verified by Accounts",
                              }
                            : item
                        )
                      );
                      setIsChequeClearOpen(false);
                      showNotification(`Cheque ${chequeClearingItem.bankRef} for ${formatCurrency(chequeClearingItem.systemAmount)} confirmed & matched with bank credit!`, "success");
                    }}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Confirm Realization & Clear Variance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 11: POS EDC TERMINAL EOD BATCH SETTLEMENT DIALOG */}
        {isEodBatchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">POS EDC Terminal End-of-Day (EOD) Batch Settlement</h3>
                    <p className="text-[11px] text-slate-500">Initiate terminal settlement command across hospital card machines & BharatQR</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEodBatchOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Active Terminals Summary */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Active Terminals in Current Shift
                  </span>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 font-mono text-[11px] overflow-hidden">
                    <div className="p-3 bg-slate-50 flex justify-between font-bold font-sans text-slate-700">
                      <span>Terminal / Provider</span>
                      <span>Swipes • Gross Amount</span>
                    </div>
                    {settlementBatches.map((b) => (
                      <div key={b.id} className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <div className="font-bold text-slate-900 font-sans">{b.provider}</div>
                          <div className="text-[10px] text-slate-500">{b.terminalId} • {b.counter}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatCurrency(b.gross)}</div>
                          <div className="text-[10px] text-slate-400">{b.txnCount} Transactions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Grid */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Gross Volume:</span>
                    <strong className="text-sm font-mono text-slate-900">
                      {formatCurrency(settlementBatches.reduce((a, b) => a + b.gross, 0))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Estimated MDR (1.5%):</span>
                    <strong className="text-sm font-mono text-rose-600">
                      -{formatCurrency(settlementBatches.reduce((a, b) => a + b.fees, 0))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Net Expected Deposit:</span>
                    <strong className="text-sm font-mono text-emerald-700">
                      {formatCurrency(settlementBatches.reduce((a, b) => a + b.net, 0))}
                    </strong>
                  </div>
                </div>

                {/* Supervisor Verification Checkbox */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="eod-confirm"
                    defaultChecked
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="eod-confirm" className="text-[11px] text-blue-900 font-sans leading-relaxed">
                    I confirm that all physical card charge slips and BharatQR receipts have been tallied with cashier till records. Transmit settlement packet to PineLabs, HDFC & ICICI merchant gateways.
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEodBatchOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementBatches((prev) =>
                        prev.map((b) => ({
                          ...b,
                          status: "SETTLED",
                          utr: b.utr === "PENDING_CREDIT" ? `UTRIB${Date.now().toString().slice(-8)}` : b.utr,
                        }))
                      );
                      setIsEodBatchOpen(false);
                      showNotification("EOD Batch Settlement executed across all EDC terminals! Batch summary slips printed.", "success");
                    }}
                    className="rounded-xl bg-[#0f2d52] px-5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Execute Batch Settlement & Generate UTRs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  note,
  accent,
  meta,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  accent: string;
  meta: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div
        className={`mb-3.5 h-11 w-11 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-lg text-white shadow-md shadow-blue-500/10`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1.5 text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-600">{note}</p>
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        {meta}
      </div>
    </div>
  );
}
