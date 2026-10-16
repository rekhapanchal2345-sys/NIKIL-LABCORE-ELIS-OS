"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { patientApi } from "@/lib/api";
import { showSuccess, showError } from "@/lib/notifications";
import {
  formatPatientFullName,
  calculateClinicalAge,
  formatIndianPhone,
  formatBloodGroup,
  formatAbhaNumber,
  sanitizeMedicalConditions,
} from "@/lib/patient-utils";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  HeartPulse,
  Shield,
  ShieldCheck,
  AlertCircle,
  Save,
  ArrowLeft,
  RefreshCw,
  Droplets,
  CheckCircle2,
  FileText,
  CreditCard,
  Building2,
} from "lucide-react";

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [patientUhid, setPatientUhid] = useState("");
  const [patientDbId, setPatientDbId] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    age: "",
    gender: "MALE",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    bloodGroup: "A_POSITIVE",
    patientType: "GENERAL",
    maritalStatus: "SINGLE",
    nationality: "Indian",
    nationalId: "", // ABHA / National ID
    aadhaarNumber: "",
    panNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "FAMILY",
    insuranceProvider: "",
    policyNumber: "",
    allergies: "",
    chronicDiseases: "",
    notes: "",
  });

  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientApi.getById(id);
      const p = (response.data?.patient || response.data || response) as any;

      if (!p || (!p.id && !p.uhid)) {
        throw new Error("Patient not found");
      }

      setPatientUhid(p.uhid || id);
      setPatientDbId(p.id || id);

      const allergiesStr = Array.isArray(p.allergies)
        ? p.allergies.join(", ")
        : typeof p.allergies === "string"
        ? p.allergies
        : "";

      const chronicStr = Array.isArray(p.chronicDiseases)
        ? p.chronicDiseases.join(", ")
        : Array.isArray(p.medicalConditions)
        ? p.medicalConditions.join(", ")
        : typeof p.chronicDiseases === "string"
        ? p.chronicDiseases
        : "";

      setFormData({
        firstName: p.firstName || "",
        middleName: p.middleName || "",
        lastName: p.lastName || "",
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
        age: p.age !== null && p.age !== undefined ? String(p.age) : "",
        gender: p.gender || "MALE",
        phone: p.phone || "",
        email: p.email || "",
        address: p.address || "",
        city: p.city || "",
        state: p.state || "",
        postalCode: p.postalCode || p.pincode || "",
        bloodGroup: p.bloodGroup || "A_POSITIVE",
        patientType: p.patientType || "GENERAL",
        maritalStatus: p.maritalStatus || "SINGLE",
        nationality: p.nationality || "Indian",
        nationalId: p.nationalId || p.abhaNumber || "",
        aadhaarNumber: p.aadhaarNumber || "",
        panNumber: p.panNumber || "",
        emergencyContactName: p.emergencyContactName || "",
        emergencyContactPhone: p.emergencyContactPhone || p.emergencyContact || "",
        emergencyContactRelationship: p.emergencyContactRelationship || "FAMILY",
        insuranceProvider: p.insuranceProvider || "",
        policyNumber: p.policyNumber || p.insuranceNumber || "",
        allergies: allergiesStr,
        chronicDiseases: chronicStr,
        notes: p.notes || p.additionalInformation || "",
      });

      document.title = `Edit Patient | ${p.uhid || id} | LabCore ELIS`;
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to load patient details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const handleDobChange = (dobStr: string) => {
    setFormData((prev) => {
      const calculated = dobStr ? calculateClinicalAge(dobStr).years : "";
      return {
        ...prev,
        dateOfBirth: dobStr,
        age: calculated !== null && calculated !== undefined ? String(calculated) : prev.age,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!formData.firstName.trim()) throw new Error("First Name is required");
      if (!formData.lastName.trim()) throw new Error("Last Name is required");

      const allergiesList = formData.allergies
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const chronicList = formData.chronicDiseases
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const updateData = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender.toUpperCase(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postalCode: formData.postalCode.trim() || null,
        bloodGroup: formData.bloodGroup,
        patientType: formData.patientType,
        maritalStatus: formData.maritalStatus,
        nationality: formData.nationality,
        nationalId: formData.nationalId.trim() || null,
        aadhaarNumber: formData.aadhaarNumber.replace(/\D/g, "") || null,
        panNumber: formData.panNumber.trim().toUpperCase() || null,
        emergencyContactName: formData.emergencyContactName.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        insuranceProvider: formData.insuranceProvider.trim() || null,
        policyNumber: formData.policyNumber.trim() || null,
        allergies: allergiesList,
        chronicDiseases: chronicList,
        notes: formData.notes.trim() || null,
      };

      const targetId = patientDbId || id;
      await patientApi.update(targetId, updateData);

      showSuccess(`Patient record ${patientUhid || targetId} updated successfully!`);
      router.push(`/patients/${patientUhid || targetId}`);
    } catch (err: any) {
      console.error("Update error:", err);
      const errMsg = err?.response?.data?.error || err?.message || "Failed to update patient record";
      setError(errMsg);
      showError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Patient Record">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-slate-600 font-medium">Loading patient record...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Patient Record">
      <div className="max-w-4xl space-y-6 pb-12">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/patients" className="hover:text-indigo-600 transition-colors">
            Patients
          </Link>
          <span>/</span>
          <Link href={`/patients/${patientUhid || id}`} className="hover:text-indigo-600 transition-colors font-mono">
            {patientUhid || id}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Edit Profile</span>
        </div>

        {/* Header Title Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                Edit Patient Record
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                UHID: <span className="font-bold text-indigo-600">{patientUhid || id}</span>
              </p>
            </div>
          </div>

          <Link
            href={`/patients/${patientUhid || id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Demographics & Identity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              <span>1. Demographics & Identity</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Ramesh"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Patel"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dateOfBirth}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 42"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="A_POSITIVE">A+ (A Positive)</option>
                  <option value="A_NEGATIVE">A- (A Negative)</option>
                  <option value="B_POSITIVE">B+ (B Positive)</option>
                  <option value="B_NEGATIVE">B- (B Negative)</option>
                  <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                  <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                  <option value="O_POSITIVE">O+ (O Positive)</option>
                  <option value="O_NEGATIVE">O- (O Negative)</option>
                  <option value="BOMBAY">Bombay (hh)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Category
                </label>
                <select
                  value={formData.patientType}
                  onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="GENERAL">General OPD</option>
                  <option value="VIP">VIP Patient</option>
                  <option value="SENIOR_CITIZEN">Senior Citizen</option>
                  <option value="STAFF">Hospital / Lab Staff</option>
                  <option value="EMERGENCY">Emergency / STAT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nationality
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Indian">Indian</option>
                  <option value="NRI / OCI">NRI / OCI</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Canadian">Canadian</option>
                  <option value="Emirati">Emirati</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>2. Contact & Residential Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone (+91)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. patient@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 102, Shanti Heights, Ring Road"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Ahmedabad"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State / Postal Pincode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Gujarat"
                  />
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                    placeholder="380015"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: ABDM, Govt IDs & Medical Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>3. Health IDs & Clinical Sensitivities</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ABDM / ABHA ID Number
                </label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="14-digit ABHA ID"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhaar Number (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={formData.aadhaarNumber}
                  onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="•••• •••• ••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono uppercase"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Known Drug / Food Allergies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Penicillin, Sulfa, Peanuts (leave blank if NKDA)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chronic Conditions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.chronicDiseases}
                    onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Contact & Insurance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
              <HeartPulse className="w-4 h-4 text-indigo-600" />
              <span>4. Emergency Contact & Insurance (TPA)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Priya Patel (Spouse)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="e.g. 9876543211"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Insurance Provider / TPA
                </label>
                <input
                  type="text"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Star Health / ICICI Lombard / Cash"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy / Member ID
                </label>
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="e.g. POL-99281-2024"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Clinical Notes & Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Special instructions, phlebotomy precautions, fasting notes..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/patients/${patientUhid || id}`}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Patient Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}