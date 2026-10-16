"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { testApi } from "@/lib/api";
import { SampleType, TestFormData, TestCategory } from "@/types";
import CloneTestModal from "@/components/tests/CloneTestModal";
import QuickOrderRequisitionModal from "@/components/tests/QuickOrderRequisitionModal";
import {
  FlaskConical,
  Edit,
  Trash2,
  ChevronLeft,
  DollarSign,
  Clock3,
  TestTube2,
  Building2,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Receipt,
  Barcode,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Tag,
  Percent,
  TrendingUp,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Zap,
  Brain
} from "lucide-react";

const TUBE_PALETTE: { [key: string]: { label: string; color: string; bg: string; border: string } } = {
  "EDTA vial (purple)": { label: "K2/K3 EDTA (Purple)", color: "#9333ea", bg: "bg-purple-50", border: "border-purple-200" },
  "SST Gel (gold/yellow)": { label: "Serum Clot Activator / SST (Gold)", color: "#d97706", bg: "bg-amber-50", border: "border-amber-200" },
  "Fluoride Oxalate (grey)": { label: "Sodium Fluoride / Oxalate (Grey)", color: "#64748b", bg: "bg-slate-100", border: "border-slate-300" },
  "Plain vial (red top)": { label: "Plain Clot Activator (Red)", color: "#e11d48", bg: "bg-rose-50", border: "border-rose-200" },
  "Sodium Citrate (light blue)": { label: "Sodium Citrate 3.2% (Light Blue)", color: "#0284c7", bg: "bg-sky-50", border: "border-sky-200" },
  "Lithium Heparin (green)": { label: "Lithium Heparin (Green)", color: "#16a34a", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Sterile Universal Container": { label: "Sterile Universal Cup", color: "#ca8a04", bg: "bg-yellow-50", border: "border-yellow-200" },
};

export default function TestDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams ? searchParams.get("edit") === "true" : false;
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : String(params.id)) : "";

  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [test, setTest] = useState<any>(null);
  const [formData, setFormData] = useState<TestFormData>({
    testCode: "",
    testName: "",
    shortName: "",
    categoryId: "",
    sampleType: "BLOOD",
    sampleContainer: "",
    sampleVolume: "",
    processingDepartment: "",
    method: "",
    description: "",
    clinicalSignificance: "",
    patientPreparation: "",
    price: 0,
    offerPrice: 0,
    b2bRate: 0,
    gstPercentage: 0,
    tatHours: 24,
    tatDisplay: "",
    displayOrder: 0,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [requisitionModalOpen, setRequisitionModalOpen] = useState(false);

  useEffect(() => {
    fetchTest();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await testApi.getById(id);
      if (response.success && response.data) {
        const testData = response.data;
        setTest(testData);
        setFormData({
          testCode: testData.testCode || testData.code || "",
          testName: testData.testName || testData.name || "",
          shortName: testData.shortName || "",
          categoryId: testData.categoryId || testData.category?.id || "",
          sampleType: testData.sampleType || "BLOOD",
          sampleContainer: testData.sampleContainer || "EDTA vial (purple)",
          sampleVolume: testData.sampleVolume || "2.0 mL",
          processingDepartment: testData.processingDepartment || "Central Hematology",
          method: testData.method || "Automated",
          description: testData.description || "",
          clinicalSignificance: testData.clinicalSignificance || "",
          patientPreparation: testData.patientPreparation || "",
          price: testData.price || 0,
          offerPrice: testData.offerPrice || 0,
          b2bRate: testData.b2bRate || 0,
          gstPercentage: testData.gstPercentage || 0,
          tatHours: testData.tatHours || 24,
          tatDisplay: testData.tatDisplay || "",
          displayOrder: testData.displayOrder || 0,
          isActive: testData.isActive !== false,
        });
      } else {
        setError(response.message || "Failed to fetch test dossier");
      }
    } catch (err) {
      console.error("Error fetching test:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch test dossier");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await testApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const testData: any = {
        testCode: formData.testCode.trim().toUpperCase(),
        testName: formData.testName.trim(),
        sampleType: formData.sampleType,
        price: Number(formData.price) || 0,
      };

      if (formData.shortName) testData.shortName = formData.shortName.trim();
      if (formData.categoryId) testData.categoryId = formData.categoryId;
      if (formData.sampleContainer) testData.sampleContainer = formData.sampleContainer;
      if (formData.sampleVolume) testData.sampleVolume = formData.sampleVolume;
      if (formData.processingDepartment) testData.processingDepartment = formData.processingDepartment;
      if (formData.method) testData.method = formData.method;
      if (formData.description) testData.description = formData.description;
      if (formData.clinicalSignificance) testData.clinicalSignificance = formData.clinicalSignificance;
      if (formData.patientPreparation) testData.patientPreparation = formData.patientPreparation;
      if (formData.offerPrice !== undefined) testData.offerPrice = Number(formData.offerPrice);
      if (formData.b2bRate !== undefined) testData.b2bRate = Number(formData.b2bRate);
      if (formData.gstPercentage !== undefined) testData.gstPercentage = Number(formData.gstPercentage);
      if (formData.tatHours !== undefined) testData.tatHours = Number(formData.tatHours);
      if (formData.tatDisplay) testData.tatDisplay = formData.tatDisplay;
      if (formData.displayOrder !== undefined) testData.displayOrder = Number(formData.displayOrder);
      if (formData.isActive !== undefined) testData.isActive = formData.isActive;

      const response = await testApi.update(id, testData);

      if (response.success) {
        showNotification("Test investigation properties updated successfully!");
        router.push(`/tests/${id}`);
        fetchTest();
      } else {
        setError(response.message || "Failed to update test");
      }
    } catch (err) {
      console.error("Error updating test:", err);
      setError(err instanceof Error ? err.message : "Failed to update test");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${test?.testName || test?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await testApi.delete(id);
      router.push("/tests");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete test");
    }
  };

  // Tube visual helper
  const tubeInfo = TUBE_PALETTE[test?.sampleContainer || formData.sampleContainer] || {
    label: test?.sampleContainer || "Standard Specimen Tube",
    color: "#2563eb",
    bg: "bg-blue-50",
    border: "border-blue-200"
  };

  // Live calculations
  const price = Number(test?.price || 0);
  const offerPrice = Number(test?.offerPrice || 0);
  const b2bRate = Number(test?.b2bRate || 0);
  const hasDiscount = offerPrice > 0 && offerPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - offerPrice) / price) * 100) : 0;
  const b2bMargin = b2bRate > 0 && offerPrice > b2bRate ? offerPrice - b2bRate : 0;
  const b2bMarginPercent = b2bRate > 0 && offerPrice > b2bRate ? Math.round((b2bMargin / offerPrice) * 100) : 0;

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <div className="text-xs font-bold text-slate-500">Loading Clinical Diagnostic Investigation Dossier...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !test) {
    return (
      <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
        <div className="max-w-4xl mx-auto space-y-4 p-6">
          <Link
            href="/tests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Master Test Directory</span>
          </Link>
          <div className="rounded-2xl bg-rose-50 border border-rose-300 p-6 text-rose-800 font-semibold text-xs shadow-xs">
            <div className="font-bold text-sm mb-1">Failed to Load Investigation</div>
            {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
      <div className="max-w-7xl mx-auto space-y-6 pb-24">
        {/* Floating Success Notification */}
        {successToast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-xs font-bold text-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Master Header Breadcrumbs & Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
          <div>
            <Link
              href="/tests"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition mb-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Diagnostic Directory / Master Investigations</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {test?.testName || test?.name}
              </h1>

              <span className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-mono font-black text-blue-700 shadow-xs">
                {test?.testCode || test?.code}
              </span>

              {test?.shortName && (
                <span className="text-xs font-bold text-slate-500">
                  ({test.shortName})
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  test?.isActive !== false
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                {test?.isActive !== false ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                <span>{test?.isActive !== false ? "Active in Catalog" : "Inactive / Archived"}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>NABL ISO 15189 Ready</span>
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {!editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setRequisitionModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition shadow-xs cursor-pointer"
                >
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Requisition Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCloneModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition shadow-xs cursor-pointer"
                >
                  <Copy className="h-4 w-4 text-indigo-600" />
                  <span>Clone Test</span>
                </button>

                <Link
                  href={`/tests/${id}?edit=true`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Properties</span>
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <Link
                href={`/tests/${id}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                Cancel Editing
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-300 p-4 text-xs font-bold text-rose-800 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-black">Error: </span>
              {error}
            </div>
          </div>
        )}

        {editMode ? (
          /* =========================================================================
             LIGHT WHITE EDIT FORM
             ========================================================================= */
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-blue-800 flex items-center gap-2">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>Modify Test Investigation Dossier</span>
                </h2>
                <span className="text-xs font-semibold text-slate-400">ID: {id}</span>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Investigation Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Test Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold uppercase text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Clinical Short Name / Abbreviation</label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                    placeholder="e.g., CBC, LFT, Lipid"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pathology Department</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                  >
                    <option value="">Select Department</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Sample Specimen *</label>
                  <select
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value as SampleType })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                  >
                    <option value="BLOOD">Whole Blood</option>
                    <option value="SERUM">Serum</option>
                    <option value="PLASMA">Plasma</option>
                    <option value="URINE">Urine</option>
                    <option value="STOOL">Stool</option>
                    <option value="SWAB">Swab</option>
                    <option value="SPUTUM">Sputum</option>
                    <option value="CSF">CSF</option>
                    <option value="TISSUE">Tissue</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Specimen & Laboratory Execution Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vacutainer Tube / Container</label>
                  <input
                    type="text"
                    value={formData.sampleContainer}
                    onChange={(e) => setFormData({ ...formData, sampleContainer: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                    placeholder="e.g., EDTA vial (purple), Plain Red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Required Sample Volume</label>
                  <input
                    type="text"
                    value={formData.sampleVolume}
                    onChange={(e) => setFormData({ ...formData, sampleVolume: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                    placeholder="e.g., 2.0 mL"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Diagnostic Method / Analyzer Technology</label>
                  <input
                    type="text"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                    placeholder="e.g., Flow Cytometry, Spectrophotometry"
                  />
                </div>
              </div>

              {/* Pricing & TAT Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">MRP / Standard Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Patient Offer Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.offerPrice}
                    onChange={(e) => setFormData({ ...formData, offerPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">B2B / Referral Base Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.b2bRate}
                    onChange={(e) => setFormData({ ...formData, b2bRate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Turnaround Time (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.tatHours}
                    onChange={(e) => setFormData({ ...formData, tatHours: parseInt(e.target.value) || 24 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                  />
                </div>
              </div>

              {/* Clinical Notes & Fasting Preparation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Clinical Significance & Diagnostic Utility</label>
                  <textarea
                    rows={3}
                    value={formData.clinicalSignificance}
                    onChange={(e) => setFormData({ ...formData, clinicalSignificance: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                    placeholder="Medical indications, clinical utility, differential diagnosis rationale..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Patient Fasting & Phlebotomy Preparation</label>
                  <textarea
                    rows={3}
                    value={formData.patientPreparation}
                    onChange={(e) => setFormData({ ...formData, patientPreparation: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-xs"
                    placeholder="e.g., Overnight 10-12 hr fasting required. Water permitted. Early morning sample."
                  />
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Investigation is Active and selectable in front-desk billing and phlebotomy order entry
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                  href={`/tests/${id}`}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Investigation Changes"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* =========================================================================
             LIGHT WHITE VIEW MODE DOSSIER
             ========================================================================= */
          <div className="space-y-6">
            {/* 4 Clinical Metric Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Tariff Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                  <span>Patient Tariff (MRP)</span>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{price}
                </div>
                {hasDiscount ? (
                  <div className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <span>Offer: ₹{offerPrice}</span>
                    <span className="rounded bg-emerald-100 px-1 py-0.2 text-[10px]">-{discountPercent}%</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-medium text-slate-400 mt-1">Standard tariff</div>
                )}
                {b2bRate > 0 && (
                  <div className="text-[10px] font-semibold text-indigo-700 mt-1">
                    B2B Base: ₹{b2bRate} ({b2bMarginPercent}% margin)
                  </div>
                )}
              </div>

              {/* TAT Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                  <span>Turnaround Time (TAT)</span>
                  <Clock3 className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {test?.tatHours ? `${test.tatHours} Hours` : "Same Day"}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1">
                  {test?.tatDisplay || "Standard routine clinical queue"}
                </div>
                <div className="text-[10px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>STAT Priority Supported</span>
                </div>
              </div>

              {/* Specimen Tube Card */}
              <div className={`rounded-2xl border ${tubeInfo.border} ${tubeInfo.bg} p-4.5 shadow-xs`}>
                <div className="flex items-center justify-between text-slate-600 text-xs font-semibold mb-1">
                  <span>Specimen Vacutainer</span>
                  <TestTube2 className="h-4 w-4" style={{ color: tubeInfo.color }} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: tubeInfo.color }}
                  />
                  <div className="text-sm font-black text-slate-900 truncate">
                    {test?.sampleContainer || test?.sampleType || "Standard Tube"}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-1">
                  Vol: {test?.sampleVolume || "2.0 mL"} ({test?.sampleType || "BLOOD"})
                </div>
              </div>

              {/* Lab Department Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                  <span>Processing Section</span>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-base font-black text-slate-900 truncate">
                  {test?.processingDepartment || test?.category?.name || "Central Lab"}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
                  Method: {test?.method || "Automated Platform"}
                </div>
                <div className="text-[10px] font-bold text-blue-700 mt-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Analyzer Auto-Routing</span>
                </div>
              </div>
            </div>

            {/* Main Clinical Dossier Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 cols): Clinical Utility, Parameters & Reference Ranges */}
              <div className="lg:col-span-8 space-y-6">
                {/* Clinical Significance & Preparation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>Clinical Significance & Pathology Indication</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {test?.clinicalSignificance || test?.description || "Diagnostic screening, biological monitoring, and differential clinical pathology investigation."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span>Patient Preparation & Venipuncture Protocol</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {test?.patientPreparation || "No special fasting requirements. Follow aseptic venipuncture SOP and tube inversion protocols."}
                    </p>
                  </div>
                </div>

                {/* Analyte Parameters Matrix */}
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-blue-600" />
                        <span>Configured Analyte Parameters ({test?.parameters?.length || 0})</span>
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        Discrete laboratory analytes, reporting units, and biological reference intervals
                      </p>
                    </div>

                    <Link
                      href="/tests/parameters"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                      <span>Manage Parameters Master</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {test?.parameters && test.parameters.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Analyte Parameter</th>
                            <th className="px-4 py-3">Reporting Unit</th>
                            <th className="px-4 py-3">Data Type</th>
                            <th className="px-4 py-3">Biological Reference (Adult)</th>
                            <th className="px-4 py-3 text-right">Requirement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {test.parameters.map((p: any, idx: number) => {
                            const maleRange = p.referenceRanges?.find((r: any) => r.gender === "MALE" || r.gender === "ALL");
                            const femaleRange = p.referenceRanges?.find((r: any) => r.gender === "FEMALE");

                            return (
                              <tr key={p.id || idx} className="hover:bg-slate-50/70 transition">
                                <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="px-4 py-3.5">
                                  <div className="font-bold text-slate-900">{p.parameterName}</div>
                                  {p.shortName && (
                                    <div className="text-[10px] font-mono text-slate-500">{p.shortName}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-blue-700 font-bold">
                                  {p.unit || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-slate-600">
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                    {p.dataType || "NUMERIC"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  {maleRange || femaleRange ? (
                                    <div className="space-y-0.5 text-[11px]">
                                      {maleRange && (
                                        <div className="text-slate-700 font-semibold">
                                          <span className="text-slate-400 text-[10px]">M:</span> {maleRange.normalLow ?? "—"} - {maleRange.normalHigh ?? "—"} {p.unit}
                                        </div>
                                      )}
                                      {femaleRange && (
                                        <div className="text-slate-700 font-semibold">
                                          <span className="text-slate-400 text-[10px]">F:</span> {femaleRange.normalLow ?? "—"} - {femaleRange.normalHigh ?? "—"} {p.unit}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Standard normative interval</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      p.isRequired !== false
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {p.isRequired !== false ? "MANDATORY" : "OPTIONAL"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                      <Sliders className="h-8 w-8 text-slate-300 mx-auto" />
                      <div className="font-semibold text-slate-700">No Discrete Sub-Analytes Configured</div>
                      <p className="max-w-md mx-auto text-slate-500">
                        This investigation reports a single overall diagnostic result or qualitative impression. You can add multi-analyte sub-parameters anytime.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (4 cols): Phlebotomy Sticker, Quality Standards & Fast Actions */}
              <div className="lg:col-span-4 space-y-6">
                {/* Physical Barcode Thermal Sticker Label Preview */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                      <Barcode className="h-4 w-4" />
                      <span>Phlebotomy Barcode Label</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">2.0" × 1.0" Standard</span>
                  </div>

                  {/* Realistic White Barcode Sticker */}
                  <div className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: tubeInfo.color }}
                        />
                        <span className="font-mono text-blue-700">{test?.testCode || "TEST"}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-600">{test?.sampleType || "BLOOD"}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-800">
                      <span className="truncate max-w-[150px]">{test?.testName || test?.name}</span>
                      <span>{test?.sampleVolume || "2.0 mL"}</span>
                    </div>

                    {/* Faux Barcode Lines */}
                    <div className="py-1 flex flex-col items-center justify-center">
                      <div className="h-8 w-full flex items-center justify-center gap-0.5 px-2 bg-slate-50 rounded border border-slate-200">
                        {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 1, 3].map((w, i) => (
                          <div key={i} className="h-full bg-slate-900" style={{ width: `${w * 1.5}px` }} />
                        ))}
                      </div>
                      <span className="text-[8px] font-mono tracking-widest text-slate-500 mt-1">
                        *{test?.testCode || "LAB"}-PATIENT*
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-500 flex justify-between border-t border-slate-200 pt-1 font-medium">
                      <span>Store: 2°C - 8°C</span>
                      <span>{tubeInfo.label.split("(")[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Quality & Accreditation Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Quality & Compliance</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ISO 15189
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 text-slate-600 border-b border-slate-50">
                      <span>Internal Quality Control (IQC):</span>
                      <span className="font-bold text-slate-900">Westgard 1:3s &amp; 2:2s</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-slate-600 border-b border-slate-50">
                      <span>EQAS Program:</span>
                      <span className="font-bold text-slate-900">Bio-Rad / CMC Vellore</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-slate-600 border-b border-slate-50">
                      <span>Delta-Check Variance Limit:</span>
                      <span className="font-bold text-slate-900">± 15% Max Shift</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-slate-600">
                      <span>Critical Result Panic Callout:</span>
                      <span className="font-bold text-rose-600">&lt; 30 Minutes</span>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>Quick Lab Operations</span>
                  </span>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setRequisitionModalOpen(true)}
                      className="w-full flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2.5 text-xs font-bold text-blue-800 hover:bg-blue-100/70 transition shadow-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span>Print Requisition Order Slip</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCloneModalOpen(true)}
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition shadow-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-indigo-600" />
                        <span>Clone into New Investigation</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <Link
                      href="/tests/training"
                      className="w-full flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100/70 transition shadow-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        <span>Clinical AI Diagnostic Training</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clone Test Modal */}
        {test && (
          <CloneTestModal
            isOpen={cloneModalOpen}
            onClose={() => setCloneModalOpen(false)}
            test={test}
            onSuccess={() => {
              showNotification("Test duplicated successfully!");
              router.push("/tests");
            }}
          />
        )}

        {/* Quick Order Requisition Slip Modal */}
        {test && (
          <QuickOrderRequisitionModal
            isOpen={requisitionModalOpen}
            onClose={() => setRequisitionModalOpen(false)}
            selectedTests={[test]}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}