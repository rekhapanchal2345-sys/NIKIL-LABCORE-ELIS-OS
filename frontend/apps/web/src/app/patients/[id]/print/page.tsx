"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { patientApi } from "@/lib/api";
import PatientRegistrationPrintForm from "@/components/patients/PatientRegistrationPrintForm";

type Patient = {
  id?: string;
  uhid?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  age?: number | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  bloodGroup?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactAddress?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  patientType?: string | null;
  additionalInformation?: string | null;
  allergies?: string | null;
  medicalConditions?: string | null;
  currentMedications?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  insuranceGroupNumber?: string | null;
  insuranceExpiryDate?: string | null;
  preferredLanguage?: string | null;
  preferredCommunicationMethod?: string | null;
  notificationPreferences?: string[];
  privacyConsent?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function PatientPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    const patientId = id;
    if (!patientId) {
      setError('Patient ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await patientApi.getById(patientId);
      console.log('Patient API Response for print:', response);
      
      if (response && response.data) {
        const patientData = response.data as Patient;
        console.log('Patient data:', patientData);
        console.log('notificationPreferences:', patientData.notificationPreferences);
        setPatient(patientData);
      } else if (response) {
        const patientData = response as Patient;
        console.log('Patient data (direct):', patientData);
        console.log('notificationPreferences (direct):', patientData.notificationPreferences);
        setPatient(patientData);
      } else {
        setError('No patient data received from server');
      }
    } catch (err) {
      console.error('Error fetching patient for print:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id, fetchPatient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-500">{error || 'Patient not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const safeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      return val.name || val.label || val.title || val.code || '';
    }
    return '';
  };

  // Transform patient data to match the form structure safely
  const formData = {
    // Basic Information
    firstName: safeStr(patient.firstName),
    middleName: safeStr(patient.middleName),
    lastName: safeStr(patient.lastName),
    dateOfBirth: safeStr(patient.dateOfBirth),
    gender: safeStr(patient.gender),
    bloodGroup: safeStr(patient.bloodGroup),
    maritalStatus: safeStr(patient.maritalStatus),
    nationality: safeStr(patient.nationality),
    patientType: safeStr(patient.patientType),
    additionalInformation: safeStr(patient.additionalInformation),

    // Address Information
    phone: safeStr(patient.phone),
    email: safeStr(patient.email),
    address: safeStr(patient.address),
    city: safeStr(patient.city),
    state: safeStr(patient.state),
    postalCode: safeStr(patient.postalCode),
    country: safeStr(patient.country),

    // Emergency Contact
    emergencyContactName: safeStr(patient.emergencyContactName),
    emergencyContactPhone: safeStr(patient.emergencyContactPhone || (patient as any).emergencyContact),
    emergencyContactRelationship: safeStr(patient.emergencyContactRelationship),
    emergencyContactAddress: safeStr(patient.emergencyContactAddress),

    // Medical Information
    allergies: safeStr(patient.allergies),
    medicalConditions: safeStr(patient.medicalConditions),
    currentMedications: safeStr(patient.currentMedications),
    insuranceProvider: safeStr(patient.insuranceProvider),
    insuranceNumber: safeStr(patient.insuranceNumber),
    insuranceGroupNumber: safeStr(patient.insuranceGroupNumber),
    insuranceExpiryDate: safeStr(patient.insuranceExpiryDate),

    // Communication Preferences
    preferredLanguage: safeStr(patient.preferredLanguage),
    preferredCommunicationMethod: safeStr(patient.preferredCommunicationMethod),
    notificationPreferences: Array.isArray(patient.notificationPreferences)
      ? patient.notificationPreferences.map(safeStr).filter(Boolean)
      : [],
    privacyConsent: Boolean(patient.privacyConsent),
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-4 sm:py-6">
      <PatientRegistrationPrintForm
        patientData={formData}
        patientId={patient.id}
        onClose={() => router.back()}
      />
    </div>
  );
}