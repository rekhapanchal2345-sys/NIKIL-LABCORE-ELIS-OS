"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { doctorApi } from "@/lib/api";
import type { Doctor } from "@/components/doctors/DoctorTable";

export default function DoctorDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    specialization: "",
    qualification: "",
    phone: "",
    email: "",
    registrationNumber: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    // New fields
    photoUrl: "",
    signatureUrl: "",
    licenseNumber: "",
    licenseExpiry: "",
    experience: "",
    consultationFee: "",
    availableDays: [] as string[],
    availableTimeStart: "",
    availableTimeEnd: "",
    department: "",
    designation: "",
  });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [sealSvg, setSealSvg] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Signature image must be under 500 KB (PNG/JPEG format)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setSignaturePreview(dataUrl);
        setFormData(prev => ({ ...prev, signatureUrl: dataUrl }));

        if (doctor?.id) {
          try {
            const res = await doctorApi.uploadSignature(String(doctor.id), { signatureData: dataUrl });
            if (res?.data?.seal?.sealSvg) {
              setSealSvg(res.data.seal.sealSvg);
            }
          } catch (uploadErr) {
            console.warn("Direct signature sync non-fatal:", uploadErr);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const id = window.location.pathname.split("/").pop();
        if (!id) return;

        setLoading(true);
        const response = await doctorApi.getById(id);
        if (response.success && response.data) {
          const doctorData = response.data;
          setDoctor(doctorData);
          setFormData({
            firstName: doctorData.firstName || "",
            lastName: doctorData.lastName || "",
            middleName: doctorData.middleName || "",
            specialization: doctorData.specialization || "",
            qualification: doctorData.qualification || "",
            phone: doctorData.phone || "",
            email: doctorData.email || "",
            registrationNumber: doctorData.registrationNumber || "",
            address: doctorData.address || "",
            city: doctorData.city || "",
            state: doctorData.state || "",
            postalCode: doctorData.postalCode || "",
            photoUrl: doctorData.photoUrl || "",
            signatureUrl: doctorData.signatureUrl || "",
            licenseNumber: doctorData.licenseNumber || "",
            licenseExpiry: doctorData.licenseExpiry ? new Date(doctorData.licenseExpiry).toISOString().split('T')[0] : "",
            experience: doctorData.experience ? doctorData.experience.toString() : "",
            consultationFee: doctorData.consultationFee ? doctorData.consultationFee.toString() : "",
            department: doctorData.department || "",
            designation: doctorData.designation || "",
            availableDays: doctorData.availableDays || [],
            availableTimeStart: doctorData.availableTimeStart || "",
            availableTimeEnd: doctorData.availableTimeEnd || "",
          });

          // Set photo and signature previews
          if (doctorData.photoUrl) {
            setPhotoPreview(doctorData.photoUrl);
          }
          if (doctorData.signatureUrl) {
            setSignaturePreview(doctorData.signatureUrl);
          }

          // Fetch doctor electronic seal
          try {
            const sealResponse = await doctorApi.getSeal(id);
            if (sealResponse?.data?.sealSvg) {
              setSealSvg(sealResponse.data.sealSvg);
            }
          } catch (sealErr) {
            console.warn("Doctor seal fetch non-fatal:", sealErr);
          }

          // Fetch statistics for view mode
          if (!isEditMode) {
            try {
              const statsResponse = await doctorApi.getStatistics(id);
              if (statsResponse.success) {
                setStatistics(statsResponse.data);
              }
            } catch (statsError) {
              console.error("Failed to fetch statistics:", statsError);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch doctor");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctor();
  }, [isEditMode]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const id = window.location.pathname.split("/").pop();
      if (!id) return;

      const submitData = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
        availableDays: JSON.stringify(formData.availableDays),
        availableTime: formData.availableTimeStart && formData.availableTimeEnd 
          ? JSON.stringify({ start: formData.availableTimeStart, end: formData.availableTimeEnd })
          : undefined,
      };

      const response = await doctorApi.update(id, submitData);
      if (response.success) {
        alert("Doctor updated successfully!");
        router.push(`/doctors/${id}`);
      } else {
        setError(response.message || "Failed to update doctor");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update doctor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doctor) return;
    if (!confirm(`Are you sure you want to delete ${doctor.name || doctor.firstName || doctor.lastName || 'this doctor'}?`)) {
      return;
    }

    try {
      const id = window.location.pathname.split("/").pop();
      if (!id) return;

      await doctorApi.delete(id);
      alert("Doctor deleted successfully!");
      router.push("/doctors");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete doctor");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Doctor Details">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <div className="text-gray-500">Loading doctor details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !doctor) {
    return (
      <DashboardLayout title="Doctor Details">
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <Link href="/doctors" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                ← Back to Doctors
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout title="Doctor Details">
        <div className="text-center py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
            👨‍⚕️
          </div>
          <p className="text-gray-500">Doctor not found</p>
          <Link href="/doctors" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to Doctors
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getDoctorName = () => {
    if (doctor.fullName) return doctor.fullName;
    if (doctor.name) return doctor.name;
    return [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ") || "Unknown Doctor";
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors";

  return (
    <DashboardLayout title={isEditMode ? "Edit Doctor" : "Doctor Details"}>
      <div className="max-w-6xl">
        <div className="mb-6">
          <Link
            href="/doctors"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Doctors
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {doctor.photoUrl ? (
                  <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img src={doctor.photoUrl} alt={getDoctorName()} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-semibold text-white shadow-md">
                    {getDoctorName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? "Edit Doctor" : getDoctorName()}
                  </h1>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {doctor.doctorCode || doctor.doctorId || doctor.registrationNumber || `Doctor #${doctor.id}`}
                    </span>
                    {doctor.qualification && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        {doctor.qualification}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!isEditMode && (
                <div className="flex gap-2">
                  <Link
                    href={`/doctors/${doctor.id}?edit=true`}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {isEditMode ? (
              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Personal Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) =>
                          setFormData({ ...formData, middleName: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Professional Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Specialization *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.specialization}
                        onChange={(e) =>
                          setFormData({ ...formData, specialization: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Qualification *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.qualification}
                        onChange={(e) =>
                          setFormData({ ...formData, qualification: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData({ ...formData, designation: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Registration Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationNumber: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) =>
                          setFormData({ ...formData, postalCode: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Professional Details */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Additional Details
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseNumber: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        License Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseExpiry: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.experience}
                        onChange={(e) =>
                          setFormData({ ...formData, experience: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.consultationFee}
                        onChange={(e) =>
                          setFormData({ ...formData, consultationFee: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Photo and Signature */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Photo & Signature
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Doctor Photo
                      </label>
                      <div className="mt-1 flex items-center gap-4">
                        {photoPreview && (
                          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-300 shadow-sm">
                            <img src={photoPreview} alt="Doctor preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Doctor Signature
                      </label>
                      <div className="mt-1 flex items-center gap-4">
                        {signaturePreview && (
                          <div className="h-20 w-40 rounded border border-gray-300 overflow-hidden bg-white shadow-sm">
                            <img src={signaturePreview} alt="Signature preview" className="h-full w-full object-contain" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureChange}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Accepted formats: PNG, JPEG (max 500 KB). Transparency recommended.</p>
                      {sealSvg && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                          <p className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🛡️</span> Live NABL ISO 15189:2022 Electronic Seal Preview
                          </p>
                          <div
                            className="max-w-md mx-auto"
                            dangerouslySetInnerHTML={{ __html: sealSvg }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-md"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                {/* Photo, Signature and Electronic Seal Section */}
                {(doctor.photoUrl || doctor.signatureUrl || sealSvg) && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {doctor.photoUrl && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-sm font-medium text-gray-600 mb-3">Official Photograph</p>
                        <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto">
                          <img src={doctor.photoUrl} alt="Doctor photo" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    )}
                    {doctor.signatureUrl && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-sm font-medium text-gray-600 mb-3">Registered Digital Signature</p>
                        <div className="h-40 w-64 rounded border border-gray-300 overflow-hidden bg-white shadow-md mx-auto flex items-center justify-center p-2">
                          <img src={doctor.signatureUrl} alt="Doctor signature" className="h-full w-full object-contain" />
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500">Stored securely in /uploads/signatures/</p>
                      </div>
                    )}
                    {sealSvg && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 text-center">
                        <p className="text-sm font-bold text-blue-900 mb-3 flex items-center justify-center gap-1.5">
                          <span>🛡️</span> NABL ISO 15189:2022 Electronic Seal
                        </p>
                        <div
                          className="w-full flex justify-center"
                          dangerouslySetInnerHTML={{ __html: sealSvg }}
                        />
                        <p className="mt-2 text-[11px] text-emerald-700 font-semibold">
                          ✓ Certified for diagnostic sign-off
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Basic Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Doctor ID</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {doctor.doctorId || doctor.registrationNumber || `Doctor #${doctor.id}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Specialization</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.specialization || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Qualification</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.qualification || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Department</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.department || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Designation</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.designation || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        doctor.isActive !== false 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <span className={`mr-1.5 h-2 w-2 rounded-full ${
                          doctor.isActive !== false ? "bg-green-500" : "bg-gray-400"
                        }`} />
                        {doctor.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.phone || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.email || "—"}</p>
                    </div>

                    {doctor.address && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-sm text-gray-500 mb-1">Address</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {[doctor.address, doctor.city, doctor.state, doctor.postalCode]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Details */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Professional Details
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">License Number</p>
                      <p className="text-sm font-semibold text-gray-900">{doctor.licenseNumber || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">License Expiry</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {doctor.licenseExpiry ? new Date(doctor.licenseExpiry).toLocaleDateString() : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Experience</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {doctor.experience ? `${doctor.experience} years` : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Consultation Fee</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {doctor.consultationFee ? `₹${doctor.consultationFee}` : "—"}
                      </p>
                    </div>

                    {doctor.createdAt && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Registered On</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(doctor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics Section */}
                {statistics && (
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Performance Statistics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Total Patients</p>
                        <p className="text-2xl font-bold text-blue-600">{statistics.statistics.totalPatients}</p>
                      </div>
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-green-600">{statistics.statistics.totalOrders}</p>
                      </div>
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Completed Orders</p>
                        <p className="text-2xl font-bold text-purple-600">{statistics.statistics.completedOrders}</p>
                      </div>
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-orange-600">₹{statistics.statistics.totalRevenue.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-xl font-bold text-gray-700">{statistics.statistics.completionRate.toFixed(1)}%</p>
                      </div>
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Avg Order Value</p>
                        <p className="text-xl font-bold text-gray-700">₹{statistics.statistics.averageOrderValue.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Pending Orders</p>
                        <p className="text-xl font-bold text-gray-700">{statistics.statistics.pendingOrders}</p>
                      </div>
                    </div>

                    {statistics.recentOrders && statistics.recentOrders.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Orders</h3>
                        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Order #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Patient</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {statistics.recentOrders.slice(0, 5).map((order: any) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {order.patient?.firstName} {order.patient?.lastName}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      order.orderStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      order.orderStatus === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.orderStatus}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleDateString()}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}