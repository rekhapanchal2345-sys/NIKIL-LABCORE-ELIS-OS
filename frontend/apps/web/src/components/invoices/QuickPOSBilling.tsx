"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  User,
  UserPlus,
  Stethoscope,
  FlaskConical,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Building,
  Layers,
  HelpCircle,
  Copy,
  ExternalLink,
  Bed,
  Activity,
  HeartPulse,
  Tag,
  Check,
  Phone,
  Volume2,
  FileText,
  X,
} from "lucide-react";
import { patientApi, doctorApi, testApi, orderApi, invoiceApi, paymentsApi } from "@/lib/api";
import { showInvoiceToast } from "./InvoiceToast";

export interface CatalogItem {
  id: string;
  testCode: string;
  testName: string;
  price: number;
  sampleType?: string;
  tatHours?: number;
  department: "Pathology" | "Radiology" | "Consultation" | "Procedure" | "BedCharges" | "General";
  hsnSacCode: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  uhid: string;
  phone: string;
  gender: string;
  email?: string;
  dateOfBirth?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialization?: string;
  doctorCode?: string;
}

export interface CartItem extends CatalogItem {
  quantity: number;
  discount: number;
  customNotes?: string;
}

interface QuickPOSBillingProps {
  onSuccess?: (createdInvoice: any) => void;
  defaultEncounterType?: "OPD" | "IPD" | "DAYCARE" | "EMERGENCY" | "HOME_COLLECTION";
}

// Pre-configured Clinical Hospital Services (OPD Consultation, Radiology, Procedures, Bed tariffs)
const STANDARD_HOSPITAL_SERVICES: CatalogItem[] = [
  {
    id: "serv_opd_gen",
    testCode: "OPD-GEN-01",
    testName: "General Physician OPD Consultation",
    price: 300,
    department: "Consultation",
    hsnSacCode: "999313",
  },
  {
    id: "serv_opd_spec",
    testCode: "OPD-SPEC-02",
    testName: "Senior Specialist OPD Consultation",
    price: 600,
    department: "Consultation",
    hsnSacCode: "999313",
  },
  {
    id: "serv_opd_sup",
    testCode: "OPD-SUPER-03",
    testName: "Super Specialist / DM Consultant OPD",
    price: 1000,
    department: "Consultation",
    hsnSacCode: "999313",
  },
  {
    id: "serv_rad_xray",
    testCode: "RAD-XRAY-01",
    testName: "Digital X-Ray Chest PA View",
    price: 450,
    department: "Radiology",
    hsnSacCode: "999312",
  },
  {
    id: "serv_rad_usg",
    testCode: "RAD-USG-02",
    testName: "Ultrasound (USG) Whole Abdomen & Pelvis",
    price: 1200,
    department: "Radiology",
    hsnSacCode: "999312",
  },
  {
    id: "serv_rad_ecg",
    testCode: "RAD-ECG-03",
    testName: "12-Lead Electrocardiogram (ECG)",
    price: 250,
    department: "Radiology",
    hsnSacCode: "999312",
  },
  {
    id: "serv_rad_echo",
    testCode: "RAD-ECHO-04",
    testName: "2D Echocardiography & Color Doppler",
    price: 2000,
    department: "Radiology",
    hsnSacCode: "999312",
  },
  {
    id: "serv_proc_iv",
    testCode: "PROC-IV-01",
    testName: "IV Cannulation & Infusion Administration",
    price: 200,
    department: "Procedure",
    hsnSacCode: "999319",
  },
  {
    id: "serv_proc_dress",
    testCode: "PROC-DRESS-02",
    testName: "Surgical Wound Dressing & Aseptic Care",
    price: 250,
    department: "Procedure",
    hsnSacCode: "999319",
  },
  {
    id: "serv_proc_neb",
    testCode: "PROC-NEB-03",
    testName: "Nebulization Therapy (Per Session)",
    price: 150,
    department: "Procedure",
    hsnSacCode: "999319",
  },
  {
    id: "serv_bed_gen",
    testCode: "BED-GEN-01",
    testName: "General Ward Bed Charges (Per Day)",
    price: 1000,
    department: "BedCharges",
    hsnSacCode: "999311",
  },
  {
    id: "serv_bed_semi",
    testCode: "BED-SEMI-02",
    testName: "Semi-Private Room Tariff (Per Day)",
    price: 2200,
    department: "BedCharges",
    hsnSacCode: "999311",
  },
  {
    id: "serv_bed_deluxe",
    testCode: "BED-DLX-03",
    testName: "Private Deluxe Room Tariff (Per Day)",
    price: 3500,
    department: "BedCharges",
    hsnSacCode: "999311",
  },
  {
    id: "serv_bed_icu",
    testCode: "BED-ICU-04",
    testName: "ICU / CCU Monitored Bed & Nursing Tariff",
    price: 6000,
    department: "BedCharges",
    hsnSacCode: "999311",
  },
];

const CONCESSION_SCHEMES = [
  { id: "NONE", label: "No Discount / Standard Tariff", rate: 0 },
  { id: "SENIOR_CITIZEN", label: "Senior Citizen Concession (10%)", rate: 10 },
  { id: "DOCTOR_REFERRAL", label: "Referring Doctor Concession (15%)", rate: 15 },
  { id: "STAFF_DEPENDENT", label: "Hospital Staff & Family (20%)", rate: 20 },
  { id: "MANAGEMENT_WAIVER", label: "Management Hardship Waiver (Approved)", rate: 25 },
  { id: "CHARITY_BPL", label: "Poor Patient Welfare / BPL (50%)", rate: 50 },
];

const TPA_PROVIDERS = [
  "Star Health & Allied Insurance",
  "Medi Assist TPA",
  "Care Health Insurance",
  "HDFC ERGO General Insurance",
  "ICICI Lombard Health Care",
  "Paramount Health Services TPA",
  "Vidal Health TPA",
  "Bajaj Allianz General Insurance",
  "FHPL (Family Health Plan Insurance TPA)",
  "United Healthcare Parekh TPA",
  "National Insurance / Heritage TPA",
];

function formatDoctorName(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/^(dr\.?|dr\b)\s+/i, "").replace(/^(dr\.?|dr\b)\s+/i, "").trim();
  return cleaned ? `Dr. ${cleaned}` : "";
}

export default function QuickPOSBilling({ onSuccess, defaultEncounterType = "OPD" }: QuickPOSBillingProps) {
  const router = useRouter();

  // Patients & Doctors
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Quick Patient Modal
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickForm, setQuickForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "MALE",
    age: "",
  });

  // Clinical Encounter Context
  const [encounterType, setEncounterType] = useState<"OPD" | "IPD" | "DAYCARE" | "EMERGENCY" | "HOME_COLLECTION">(
    defaultEncounterType
  );
  const [patientCategory, setPatientCategory] = useState<
    "GENERAL" | "INSURANCE_TPA" | "CORPORATE" | "GOVT_SCHEME" | "STAFF"
  >("GENERAL");
  const [roomBedNo, setRoomBedNo] = useState<string>("");
  const [tokenNo, setTokenNo] = useState<string>(() => `OPD-${Math.floor(100 + Math.random() * 900)}`);

  // Doctor state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [externalDoctorName, setExternalDoctorName] = useState<string>("");
  const [isExternalDoctor, setIsExternalDoctor] = useState(false);

  // Catalog Category Filters & Tests state
  const [activeCatalogCategory, setActiveCatalogCategory] = useState<
    "ALL" | "Pathology" | "Consultation" | "Radiology" | "Procedure" | "BedCharges"
  >("ALL");
  const [tests, setTests] = useState<CatalogItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Custom Item Modal
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({
    name: "",
    department: "Procedure" as CatalogItem["department"],
    hsnSac: "999319",
    rate: "",
    quantity: "1",
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Concessions & Governance
  const [selectedConcessionScheme, setSelectedConcessionScheme] = useState<string>("NONE");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [flatDiscount, setFlatDiscount] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<"percent" | "flat">("percent");
  const [discountApprovedBy, setDiscountApprovedBy] = useState<string>("Medical Superintendent");
  const [discountReason, setDiscountReason] = useState<string>("");

  // Tax & Place of Supply
  // Healthcare is exempt under SAC 999312 / 999311 (Notification 12/2017)
  const [gstType, setGstType] = useState<"EXEMPT_0" | "INTRA_18" | "INTER_18">("EXEMPT_0");

  // Payment Tender Engine
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "SPLIT" | "TPA">("CASH");
  const [cashTendered, setCashTendered] = useState<number | "">("");

  // Card / POS machine fields
  const [cardTerminalId, setCardTerminalId] = useState("POS-TID-01");
  const [cardNetwork, setCardNetwork] = useState<"VISA" | "MASTERCARD" | "RUPAY" | "AMEX">("VISA");
  const [cardLast4, setCardLast4] = useState("");
  const [cardAuthCode, setCardAuthCode] = useState("");

  // UPI QR Code
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);
  const [upiTransactionRef, setUpiTransactionRef] = useState("");
  const [soundboxConfirmed, setSoundboxConfirmed] = useState(false);

  // Split Tender Inputs
  const [splitCash, setSplitCash] = useState<number | "">("");
  const [splitUpi, setSplitUpi] = useState<number | "">("");
  const [splitCard, setSplitCard] = useState<number | "">("");

  // TPA / Cashless Insurance Inputs
  const [tpaProvider, setTpaProvider] = useState<string>(TPA_PROVIDERS[0]);
  const [tpaPreAuthNo, setTpaPreAuthNo] = useState<string>("");
  const [tpaClaimNo, setTpaClaimNo] = useState<string>("");
  const [tpaApprovedAmount, setTpaApprovedAmount] = useState<number | "">("");
  const [tpaCopayCollected, setTpaCopayCollected] = useState<number | "">("");

  // Print preference upon billing
  const [autoPrintType, setAutoPrintType] = useState<"thermal" | "a4" | "none">("thermal");
  const [shareWhatsApp, setShareWhatsApp] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [patRes, docRes, testRes] = await Promise.all([
        patientApi.getAll("?limit=50"),
        doctorApi.getAll("?limit=50"),
        testApi.getAll("?limit=100"),
      ]);

      if (patRes.success && patRes.data) {
        const pData = Array.isArray(patRes.data) ? patRes.data : patRes.data.patients || [];
        setPatients(pData);
      }
      if (docRes.success && docRes.data) {
        const dData = Array.isArray(docRes.data) ? docRes.data : docRes.data.doctors || [];
        setDoctors(dData);
      }

      const diagnosticItems: CatalogItem[] = [];
      if (testRes.success && testRes.data) {
        const tData = Array.isArray(testRes.data) ? testRes.data : testRes.data.tests || [];
        tData.forEach((t: any) => {
          diagnosticItems.push({
            id: t.id,
            testCode: t.testCode || t.code || "LAB-001",
            testName: t.testName || t.name || "Diagnostic Test",
            price: Number(t.price || 0),
            sampleType: t.sampleType || "Blood",
            tatHours: t.tatHours || 24,
            department: "Pathology",
            hsnSacCode: "999312",
          });
        });
      }

      // Combine standard hospital procedures and diagnostic tests
      setTests([...STANDARD_HOSPITAL_SERVICES, ...diagnosticItems]);
    } catch (err) {
      console.error("Error loading POS initial data:", err);
      // Fallback to standard hospital catalog
      setTests(STANDARD_HOSPITAL_SERVICES);
    }
  };


  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountMode === "percent") {
      return (subtotal * discountPercent) / 100;
    }
    return Math.min(flatDiscount, subtotal);
  }, [subtotal, discountMode, discountPercent, flatDiscount]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstRate = gstType === "EXEMPT_0" ? 0 : 18;
  const isInterState = gstType === "INTER_18";
  const gstAmount = (taxableAmount * gstRate) / 100;
  const grandTotal = Math.round(taxableAmount + gstAmount);

  // Split calculations
  const splitTotalEntered = (Number(splitCash) || 0) + (Number(splitUpi) || 0) + (Number(splitCard) || 0);
  const splitRemaining = Math.max(0, grandTotal - splitTotalEntered);

  // Cash change due
  const changeDue = useMemo(() => {
    if (paymentMode !== "CASH" || typeof cashTendered !== "number") return 0;
    return Math.max(0, cashTendered - grandTotal);
  }, [paymentMode, cashTendered, grandTotal]);

  // Generate UPI QR Code on mount or grandTotal change
  useEffect(() => {
    if (paymentMode === "UPI" || paymentMode === "SPLIT") {
      const amountToPay = paymentMode === "UPI" ? grandTotal : Number(splitUpi) || grandTotal;
      if (amountToPay > 0) {
        const upiString = `upi://pay?pa=hospital.billing@icici&pn=LabCore+Healthcare&am=${amountToPay.toFixed(
          2
        )}&cu=INR&tn=Invoice+Counter+Settlement`;
        QRCode.toDataURL(upiString, { width: 160, margin: 1 })
          .then((url) => setUpiQrDataUrl(url))
          .catch(() => setUpiQrDataUrl(null));
      }
    }
  }, [paymentMode, grandTotal, splitUpi]);

  // Duplicate detection in quick register
  const existingDuplicatePatient = useMemo(() => {
    if (!quickForm.phone.trim() || quickForm.phone.trim().length < 5) return null;
    const cleanPhone = quickForm.phone.replace(/\s+/g, "");
    return patients.find((p) => p.phone && p.phone.replace(/\s+/g, "") === cleanPhone);
  }, [patients, quickForm.phone]);

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 5);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.uhid && p.uhid.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [patients, patientSearch]);

  // Filtered Services Catalog
  const filteredCatalogItems = useMemo(() => {
    let list = tests;
    if (activeCatalogCategory !== "ALL") {
      list = list.filter((t) => t.department === activeCatalogCategory);
    }
    if (!itemSearch.trim()) return list.slice(0, 8);
    const q = itemSearch.toLowerCase();
    return list.filter(
      (t) =>
        t.testName.toLowerCase().includes(q) ||
        t.testCode.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
    );
  }, [tests, itemSearch, activeCatalogCategory]);

  // Handle Concession Scheme Change
  const handleConcessionSchemeChange = (schemeId: string) => {
    setSelectedConcessionScheme(schemeId);
    const found = CONCESSION_SCHEMES.find((s) => s.id === schemeId);
    if (found) {
      setDiscountMode("percent");
      setDiscountPercent(found.rate);
      setDiscountReason(found.rate > 0 ? found.label : "");
    }
  };


  const handleAddToCart = (item: CatalogItem) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, quantity: (c.quantity || 1) + 1 } : c))
      );
      showInvoiceToast("info", `Updated quantity for ${item.testName}`);
    } else {
      setCart((prev) => [...prev, { ...item, quantity: 1, discount: 0 }]);
    }
    setItemSearch("");
    setShowItemDropdown(false);
  };

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item)));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // Add Custom Ad-hoc Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemForm.name.trim() || !customItemForm.rate) {
      showInvoiceToast("error", "Service name and price are required");
      return;
    }

    const newItem: CatalogItem = {
      id: `custom_${Date.now()}`,
      testCode: `ADHOC-${Math.floor(100 + Math.random() * 900)}`,
      testName: customItemForm.name.trim(),
      price: Number(customItemForm.rate),
      department: customItemForm.department,
      hsnSacCode: customItemForm.hsnSac || "999319",
    };

    setCart((prev) => [
      ...prev,
      {
        ...newItem,
        quantity: Number(customItemForm.quantity) || 1,
        discount: 0,
      },
    ]);

    setShowCustomItemModal(false);
    setCustomItemForm({
      name: "",
      department: "Procedure",
      hsnSac: "999319",
      rate: "",
      quantity: "1",
    });
    showInvoiceToast("success", `Added "${newItem.testName}" to invoice`);
  };

  const handleQuickRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.firstName || !quickForm.phone) {
      showInvoiceToast("error", "First name and phone number are required");
      return;
    }

    try {
      const payload = {
        firstName: quickForm.firstName,
        lastName: quickForm.lastName || "Patient",
        phone: quickForm.phone,
        gender: quickForm.gender,
      };

      const res = await patientApi.create(payload);
      if (res.success && res.data) {
        const newPatient = res.data;
        setPatients((prev) => [newPatient, ...prev]);
        setSelectedPatient(newPatient);
        setShowQuickRegister(false);
        showInvoiceToast("success", `Patient ${newPatient.firstName} registered successfully`);
      }
    } catch (err) {
      console.error("Failed to register patient:", err);
      showInvoiceToast("error", "Failed to quick register patient");
    }
  };

  // Submit and Create Invoice with Order and Settlement
  const handleCheckout = async (printFormat: "thermal" | "a4" | "none") => {
    if (!selectedPatient) {
      showInvoiceToast("error", "Please select or register a patient first");
      return;
    }
    if (cart.length === 0) {
      showInvoiceToast("error", "Please add at least one clinical service or test to the invoice");
      return;
    }

    if (paymentMode === "SPLIT" && splitRemaining > 0) {
      showInvoiceToast(
        "error",
        `Split tender incomplete: Remaining balance ₹${splitRemaining.toFixed(2)} must be allocated`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Order
      const firstValidTestId = tests.find((t) => !t.id.startsWith("custom_"))?.id;
      const orderPayload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctorId || undefined,
        items: cart.map((c) => ({
          testId: c.id.startsWith("custom_") || c.id.startsWith("serv_") ? firstValidTestId : c.id,
          quantity: c.quantity || 1,
          price: c.price,
          discount: 0,
          finalPrice: c.price * (c.quantity || 1),
        })),
        priority: encounterType === "EMERGENCY" ? "STAT" : "ROUTINE",
        paymentStatus: paymentMode === "TPA" ? "PENDING" : "PAID",
        notes: `Encounter: ${encounterType} | Category: ${patientCategory} | Token: ${tokenNo} ${
          roomBedNo ? `| Bed: ${roomBedNo}` : ""
        } | Services: ${cart.map((i) => `${i.testName} (x${i.quantity})`).join(", ")} ${
          discountReason ? `| Concession: ${discountReason} (Approved by: ${discountApprovedBy})` : ""
        }`,
      };

      const orderRes = await orderApi.create(orderPayload);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || "Failed to create encounter order");
      }

      const createdOrder = orderRes.data;

      // 2. Create Invoice
      const invoicePayload = {
        orderId: createdOrder.id,
        discount: discountAmount,
        gstPercent: gstRate,
        isInterState: isInterState,
      };

      const invoiceRes = await invoiceApi.create(invoicePayload);
      if (!invoiceRes.success || !invoiceRes.data) {
        throw new Error(invoiceRes.message || "Failed to generate hospital invoice");
      }

      const createdInvoice = invoiceRes.data;

      // 3. Record Payment(s)
      if (paymentMode === "SPLIT") {
        if (Number(splitCash) > 0) {
          await paymentsApi.create({
            orderId: createdOrder.id,
            amount: Number(splitCash),
            method: "CASH",
            remarks: `Counter Split Tender - Cash: ₹${splitCash}`,
          });
        }
        if (Number(splitUpi) > 0) {
          await paymentsApi.create({
            orderId: createdOrder.id,
            amount: Number(splitUpi),
            method: "UPI",
            remarks: `Counter Split Tender - UPI: ₹${splitUpi} (Ref: ${upiTransactionRef || "Direct"})`,
          });
        }
        if (Number(splitCard) > 0) {
          await paymentsApi.create({
            orderId: createdOrder.id,
            amount: Number(splitCard),
            method: "CARD",
            remarks: `Counter Split Tender - Card (${cardNetwork} ...${cardLast4 || "XXXX"}): ₹${splitCard}`,
          });
        }
      } else if (paymentMode === "TPA") {
        const copay = Number(tpaCopayCollected) || 0;
        if (copay > 0) {
          await paymentsApi.create({
            orderId: createdOrder.id,
            amount: copay,
            method: "CASH",
            remarks: `TPA Co-payment from Patient: ₹${copay} | Insurer: ${tpaProvider} | PreAuth: ${tpaPreAuthNo}`,
          });
        }
      } else {
        await paymentsApi.create({
          orderId: createdOrder.id,
          amount: grandTotal,
          method: paymentMode,
          remarks:
            paymentMode === "CASH"
              ? `Cash Counter Tendered ₹${cashTendered || grandTotal} (Change: ₹${changeDue})`
              : paymentMode === "UPI"
              ? `UPI Settlement (Ref/UTR: ${upiTransactionRef || "Confirmed"})`
              : `Card Settlement (${cardNetwork} ...${cardLast4 || "XXXX"}) TID: ${cardTerminalId} Auth: ${cardAuthCode}`,
        });
      }

      showInvoiceToast(
        "success",
        `Invoice #${createdInvoice.invoiceNumber || ""} billed and settled successfully!`
      );

      // WhatsApp bill prompt notification
      if (shareWhatsApp && selectedPatient.phone) {
        showInvoiceToast(
          "info",
          `Digital bill dispatched to WhatsApp (+91 ${selectedPatient.phone})`
        );
      }

      // Reset cart & inputs for next patient
      setCart([]);
      setSelectedPatient(null);
      setPatientSearch("");
      setCashTendered("");
      setSplitCash("");
      setSplitUpi("");
      setSplitCard("");
      setTpaPreAuthNo("");
      setTpaClaimNo("");
      setTpaApprovedAmount("");
      setTpaCopayCollected("");
      setTokenNo(`OPD-${Math.floor(100 + Math.random() * 900)}`);

      if (onSuccess) {
        onSuccess(createdInvoice);
      } else {
        router.push(
          `/invoices/${createdInvoice.id}${printFormat !== "none" ? `?print=true&type=${printFormat}` : ""}`
        );
      }
    } catch (err: any) {
      console.error("Counter checkout error:", err);
      showInvoiceToast("error", err.message || "Checkout failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatINR = (amt: number) => {
    return `₹${Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 text-slate-800">
      {/* LEFT COLUMN: Patient Context & Clinical Services Cart (7 cols) */}
      <div className="space-y-5 lg:col-span-7">
        {/* Step 1: Patient Encounter Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1. Patient & Encounter Details</h3>
                <p className="text-[11px] text-slate-400">Identify patient, visit type, and consulting clinician</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickRegister(true)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Quick Register</span>
            </button>
          </div>

          {/* Encounter Mode & Billing Category Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Encounter / Visit Type
              </label>
              <select
                value={encounterType}
                onChange={(e) => setEncounterType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="OPD">OPD (Outpatient Visit)</option>
                <option value="IPD">IPD (Inpatient Admission)</option>
                <option value="DAYCARE">Day Care / Chemotherapy / Dialysis</option>
                <option value="EMERGENCY">Emergency / Casualty (STAT)</option>
                <option value="HOME_COLLECTION">Home Sample Collection</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Billing Category / Tariff Plan
              </label>
              <select
                value={patientCategory}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPatientCategory(val);
                  if (val === "INSURANCE_TPA") {
                    setPaymentMode("TPA");
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="GENERAL">General / Private (Self Pay)</option>
                <option value="INSURANCE_TPA">Cashless Insurance / TPA</option>
                <option value="CORPORATE">Corporate / B2B Empanelled</option>
                <option value="GOVT_SCHEME">Ayushman PMJAY / CGHS / ECHS</option>
                <option value="STAFF">Hospital Staff / Concession</option>
              </select>
            </div>
          </div>

          {/* IPD Bed or OPD Token Meta Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-[11px]">Token #:</span>
              <input
                type="text"
                value={tokenNo}
                onChange={(e) => setTokenNo(e.target.value)}
                className="w-20 bg-transparent font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            {(encounterType === "IPD" || encounterType === "DAYCARE") && (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                <Bed className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-medium text-[11px]">Ward / Bed:</span>
                <input
                  type="text"
                  placeholder="e.g. Ward-2 / Bed-14"
                  value={roomBedNo}
                  onChange={(e) => setRoomBedNo(e.target.value)}
                  className="w-32 bg-transparent font-medium text-slate-900 outline-none"
                />
              </div>
            )}
          </div>

          {/* Selected Patient or Autocomplete Search */}
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-xl bg-blue-50/60 p-3.5 border border-blue-200/90">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-sm shadow-xs">
                  {selectedPatient.firstName[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono mt-0.5">
                    <span className="text-blue-700 font-semibold">UHID: {selectedPatient.uhid}</span>
                    <span>• {selectedPatient.phone}</span>
                    <span>• {selectedPatient.gender}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
              >
                Change Patient
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Search patient by name, UHID, or mobile number..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/60"
              />

              {showPatientDropdown && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching patients found. Click{" "}
                      <button
                        type="button"
                        onClick={() => setShowQuickRegister(true)}
                        className="text-blue-600 font-bold underline"
                      >
                        + Quick Register
                      </button>{" "}
                      to enroll immediately.
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDropdown(false);
                        }}
                        className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-blue-50/60 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            UHID: {p.uhid} • Phone: {p.phone}
                          </div>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                          {p.gender}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Clinician Selector with Self-Referred & External Doctor Toggle */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Consultant / Referrer:</span>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="">Direct Walk-in / Self-Referred</option>
                {doctors.map((doc) => {
                  const docLabel = formatDoctorName(doc.fullName) || doc.fullName;
                  return (
                    <option key={doc.id} value={doc.id}>
                      {docLabel} {doc.specialization ? `(${doc.specialization})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Clinical Services & Itemized Cart Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. Clinical Services & Bill Items</h3>
                <p className="text-[11px] text-slate-400">Pathology tests, consultations, radiology, and procedures</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                <span>+ Custom Service</span>
              </button>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                {cart.length} in Cart
              </span>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "ALL", label: "All Catalog" },
              { id: "Pathology", label: "Pathology / Lab" },
              { id: "Consultation", label: "OPD Consultation" },
              { id: "Radiology", label: "Radiology & Imaging" },
              { id: "Procedure", label: "Nursing & Procedures" },
              { id: "BedCharges", label: "Room & Bed Tariffs" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCatalogCategory(cat.id as any)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  activeCatalogCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs font-bold"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Autocomplete Service Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={itemSearch}
              onChange={(e) => {
                setItemSearch(e.target.value);
                setShowItemDropdown(true);
              }}
              onFocus={() => setShowItemDropdown(true)}
              placeholder="Search by test name, code, doctor consultation or radiology (e.g. CBC, USG, X-Ray, OPD)..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/60"
            />

            {showItemDropdown && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {filteredCatalogItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching services or tests. Click{" "}
                    <button
                      type="button"
                      onClick={() => setShowCustomItemModal(true)}
                      className="text-blue-600 font-bold underline"
                    >
                      + Custom Service
                    </button>{" "}
                    to add ad-hoc line item.
                  </div>
                ) : (
                  filteredCatalogItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-blue-50/60 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.testName}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-blue-700 font-semibold">{item.testCode}</span>
                          <span>• {item.department}</span>
                          <span>• SAC: {item.hsnSacCode}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-900">{formatINR(item.price)}</span>
                        <span className="ml-2 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          + Add
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart Table */}
          {cart.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center text-slate-400">
              <FlaskConical className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No services or tests added yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Search the hospital catalog above or add custom clinical items</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200/90">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/90">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Service Details</th>
                    <th className="px-3 py-2.5">Dept / SAC</th>
                    <th className="px-3 py-2.5 text-center w-24">Qty</th>
                    <th className="px-3 py-2.5 text-right">Rate</th>
                    <th className="px-3 py-2.5 text-right">Total (₹)</th>
                    <th className="px-3 py-2.5 text-center w-10">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {cart.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">{item.testName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.testCode}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                          {item.department}
                        </span>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">SAC {item.hsnSacCode}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, (item.quantity || 1) - 1)}
                            className="h-5 w-5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold font-mono">{item.quantity || 1}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, (item.quantity || 1) + 1)}
                            className="h-5 w-5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatINR(item.price)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.price * (item.quantity || 1))}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Financial Calculator & Settlement Tender (5 cols) */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <CreditCard className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. Settlement & Tender</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">TILL #1</span>
          </div>

          {/* Subtotal, Concession Schemes & Tax Breakdown */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Services Total ({cart.length} items)</span>
              <span className="font-bold font-mono text-slate-900">{formatINR(subtotal)}</span>
            </div>

            {/* Concession Governance */}
            <div className="rounded-xl bg-slate-50/80 p-3 space-y-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Concession / Discount Governance
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDiscountMode("percent")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      discountMode === "percent"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountMode("flat")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      discountMode === "flat"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    ₹ Flat
                  </button>
                </div>
              </div>

              {/* Concession Schemes Preset Dropdown */}
              <div>
                <select
                  value={selectedConcessionScheme}
                  onChange={(e) => handleConcessionSchemeChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                >
                  {CONCESSION_SCHEMES.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.label}
                    </option>
                  ))}
                </select>
              </div>

              {discountMode === "percent" ? (
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20, 25].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setDiscountPercent(rate);
                        setSelectedConcessionScheme("CUSTOM");
                      }}
                      className={`flex-1 rounded-lg py-1 text-center font-bold text-xs transition-colors ${
                        discountPercent === rate
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  value={flatDiscount || ""}
                  onChange={(e) => {
                    setFlatDiscount(Number(e.target.value) || 0);
                    setSelectedConcessionScheme("CUSTOM");
                  }}
                  placeholder="Enter flat discount in ₹"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
                />
              )}

              {discountAmount > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-200/70">
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Concession Deducted:</span>
                    <span className="font-mono">-{formatINR(discountAmount)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <input
                      type="text"
                      placeholder="Approved By (e.g. Medical Supt.)"
                      value={discountApprovedBy}
                      onChange={(e) => setDiscountApprovedBy(e.target.value)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Concession Justification"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Place of Supply / GST Rate Selector */}
            <div className="space-y-1.5 py-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-[11px]">GST & Regulatory Tax:</span>
                <span className="font-mono font-bold text-blue-700">+{formatINR(gstAmount)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "EXEMPT_0", label: "Healthcare Exempt (0%)" },
                  { id: "INTRA_18", label: "Intra-State (9+9%)" },
                  { id: "INTER_18", label: "Inter-State (18%)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGstType(item.id as any)}
                    className={`rounded-xl py-1.5 px-1 text-[10px] font-bold text-center border transition-all ${
                      gstType === item.id
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ultra-Clean Medical Net Payable Grand Total Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800">
                  Net Payable Amount
                </span>
                <p className="text-2xl font-black font-mono text-blue-900">{formatINR(grandTotal)}</p>
              </div>
              <div className="text-right text-[11px] text-slate-500 font-medium">
                <span>Healthcare Final Bill</span>
                <div className="text-[9px] text-blue-700 font-mono">SAC 999312 / 999311</div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector (Cash, UPI, Card, Split, TPA) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Payment Tender Method
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Immediate Counter Settlement</span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "UPI", label: "UPI / QR", icon: QrCode },
                { id: "CARD", label: "Card / POS", icon: CreditCard },
                { id: "SPLIT", label: "Split", icon: Layers },
                { id: "TPA", label: "TPA Cashless", icon: ShieldCheck },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = paymentMode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPaymentMode(t.id as any)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-300"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] whitespace-nowrap">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 1. CASH Tender Calculator */}
            {paymentMode === "CASH" && (
              <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Tendered by Patient:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    placeholder={String(grandTotal)}
                    onChange={(e) => setCashTendered(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-32 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-right font-bold text-slate-900 focus:border-blue-500 outline-none font-mono text-sm"
                  />
                </div>

                {/* Quick Tender Denomination Buttons */}
                <div className="flex items-center gap-1 text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-1 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Exact
                  </button>
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1 font-mono font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {typeof cashTendered === "number" && (
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <span className="text-slate-600">Balance Return Change:</span>
                    <span className="font-mono text-emerald-700 text-sm font-black">{formatINR(changeDue)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. DYNAMIC UPI QR DISPLAY */}
            {paymentMode === "UPI" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-4">
                  {upiQrDataUrl ? (
                    <img
                      src={upiQrDataUrl}
                      alt="UPI QR Code"
                      className="h-28 w-28 rounded-xl border border-slate-200 shadow-xs bg-white p-1"
                    />
                  ) : (
                    <QrCode className="h-20 w-20 text-blue-600 mx-auto" />
                  )}
                  <div className="text-left text-xs space-y-1">
                    <p className="font-bold text-slate-900">Scan UPI QR to Pay</p>
                    <p className="text-[11px] text-slate-600 font-mono">hospital.billing@icici</p>
                    <p className="text-sm font-black text-blue-700 font-mono">{formatINR(grandTotal)}</p>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                      GPay • PhonePe • Paytm • BHIM
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-left pt-2 border-t border-blue-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Bank UTR / UPI Reference No.
                  </label>
                  <input
                    type="text"
                    value={upiTransactionRef}
                    onChange={(e) => setUpiTransactionRef(e.target.value)}
                    placeholder="e.g. 428819203912 (12-digit UTR)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 3. CARD / EDC POS TERMINAL */}
            {paymentMode === "CARD" && (
              <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">EDC Terminal ID</label>
                    <input
                      type="text"
                      value={cardTerminalId}
                      onChange={(e) => setCardTerminalId(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Card Network</label>
                    <select
                      value={cardNetwork}
                      onChange={(e) => setCardNetwork(e.target.value as any)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="RUPAY">RuPay</option>
                      <option value="AMEX">Amex</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4821"
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Approval / Auth Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 849120"
                      value={cardAuthCode}
                      onChange={(e) => setCardAuthCode(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. SPLIT TENDER ALLOCATION */}
            {paymentMode === "SPLIT" && (
              <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                  <span>Allocate Split Tender</span>
                  <span
                    className={`font-mono text-[11px] ${
                      splitRemaining === 0 ? "text-emerald-700 font-black" : "text-amber-700"
                    }`}
                  >
                    {splitRemaining === 0 ? "✓ 100% Allocated" : `Remaining: ${formatINR(splitRemaining)}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Cash (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">UPI / QR (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Card (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. TPA / CASHLESS INSURANCE DESK */}
            {paymentMode === "TPA" && (
              <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200 space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">TPA / Insurance Provider</label>
                  <select
                    value={tpaProvider}
                    onChange={(e) => setTpaProvider(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                  >
                    {TPA_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Pre-Auth Approval #</label>
                    <input
                      type="text"
                      placeholder="e.g. PA-994182"
                      value={tpaPreAuthNo}
                      onChange={(e) => setTpaPreAuthNo(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Claim / Policy #</label>
                    <input
                      type="text"
                      placeholder="e.g. POL-1002934"
                      value={tpaClaimNo}
                      onChange={(e) => setTpaClaimNo(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Approved by TPA (₹)</label>
                    <input
                      type="number"
                      placeholder={String(grandTotal)}
                      value={tpaApprovedAmount}
                      onChange={(e) =>
                        setTpaApprovedAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Co-Pay Collected Now (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={tpaCopayCollected}
                      onChange={(e) =>
                        setTpaCopayCollected(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Print & Share Options */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shareWhatsApp}
                onChange={(e) => setShareWhatsApp(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
              />
              <span className="text-[11px] font-medium text-slate-600">Send WhatsApp Bill</span>
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAutoPrintType(autoPrintType === "thermal" ? "none" : "thermal")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  autoPrintType === "thermal"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                type="button"
                onClick={() => setAutoPrintType(autoPrintType === "a4" ? "none" : "a4")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  autoPrintType === "a4"
                    ? "bg-blue-50 text-blue-800 border-blue-300"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                A4 Tax Bill
              </button>
            </div>
          </div>

          {/* Action Checkout Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={
                isSubmitting ||
                cart.length === 0 ||
                !selectedPatient ||
                (paymentMode === "SPLIT" && splitRemaining > 0)
              }
              onClick={() => handleCheckout("thermal")}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? "Settling Bill..."
                  : `Settle ${formatINR(grandTotal)} & Print Thermal (80mm)`}
              </span>
            </button>

            <button
              type="button"
              disabled={
                isSubmitting ||
                cart.length === 0 ||
                !selectedPatient ||
                (paymentMode === "SPLIT" && splitRemaining > 0)
              }
              onClick={() => handleCheckout("a4")}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Settle & Open A4 Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Patient Registration Modal with Real-time Duplicate Detection */}
      {showQuickRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                Quick Patient Registration
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickRegister(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickRegisterSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">First Name *</label>
                  <input
                    type="text"
                    required
                    value={quickForm.firstName}
                    onChange={(e) => setQuickForm({ ...quickForm, firstName: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Last Name</label>
                  <input
                    type="text"
                    value={quickForm.lastName}
                    onChange={(e) => setQuickForm({ ...quickForm, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-600">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={quickForm.phone}
                  onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
                />
                {existingDuplicatePatient && (
                  <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span>Patient exists with this phone: </span>
                      <strong className="underline cursor-pointer" onClick={() => {
                        setSelectedPatient(existingDuplicatePatient);
                        setShowQuickRegister(false);
                      }}>
                        {existingDuplicatePatient.firstName} {existingDuplicatePatient.lastName} ({existingDuplicatePatient.uhid})
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Gender</label>
                  <select
                    value={quickForm.gender}
                    onChange={(e) => setQuickForm({ ...quickForm, gender: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Age (Years)</label>
                  <input
                    type="number"
                    value={quickForm.age}
                    onChange={(e) => setQuickForm({ ...quickForm, age: e.target.value })}
                    placeholder="e.g. 45"
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickRegister(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Save & Select Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Service Line Item Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                Add Custom Clinical Service / Item
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Service / Procedure Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Orthopedic Splint / Injection Administration"
                  value={customItemForm.name}
                  onChange={(e) => setCustomItemForm({ ...customItemForm, name: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Clinical Department</label>
                  <select
                    value={customItemForm.department}
                    onChange={(e) => {
                      const dept = e.target.value as CatalogItem["department"];
                      let sac = "999319";
                      if (dept === "Pathology" || dept === "Radiology") sac = "999312";
                      else if (dept === "Consultation") sac = "999313";
                      else if (dept === "BedCharges") sac = "999311";
                      setCustomItemForm({ ...customItemForm, department: dept, hsnSac: sac });
                    }}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="Procedure">Procedures & Nursing</option>
                    <option value="Consultation">OPD Consultation</option>
                    <option value="Radiology">Radiology & Imaging</option>
                    <option value="Pathology">Pathology / Lab</option>
                    <option value="BedCharges">Inpatient / Bed Charges</option>
                    <option value="General">General Medical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={customItemForm.hsnSac}
                    onChange={(e) => setCustomItemForm({ ...customItemForm, hsnSac: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Unit Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 500"
                    value={customItemForm.rate}
                    onChange={(e) => setCustomItemForm({ ...customItemForm, rate: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemForm.quantity}
                    onChange={(e) => setCustomItemForm({ ...customItemForm, quantity: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Add to Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
