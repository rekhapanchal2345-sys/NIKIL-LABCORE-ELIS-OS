"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { patientApi } from "@/lib/api";
import PatientRegistrationPrintForm from "@/components/patients/PatientRegistrationPrintForm";

export default function PatientPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPatient = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await patientApi.getById(id);
      const data = (response && (response as any).data) ? (response as any).data : response;
      if (data) {
        setPatient(data as Record<string, any>);
      } else {
        setPatient({ id, uhid: id });
      }
    } catch {
      setPatient({ id, uhid: id });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f1f5f9] py-5 px-3 sm:px-6 flex flex-col items-center">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0284c7]" />
          </div>
        ) : (
          <PatientRegistrationPrintForm
            isModal={false}
            patientData={patient || {}}
            patientId={patient?.uhid || patient?.id || id}
            onClose={() => router.back()}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
