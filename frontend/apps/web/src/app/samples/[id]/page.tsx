"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { sampleApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import SampleDetails from "@/components/samples/SampleDetails";
import { ArrowLeft, FlaskConical, Loader2, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";

export default function SampleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [sample, setSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sampleId = params.id as string;

  const fetchSample = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!sampleId) {
        setError("Invalid sample ID");
        return;
      }

      const response = await sampleApi.getOne(sampleId);

      if (response?.data?.sample) {
        setSample(response.data.sample);
      } else if (response?.data) {
        setSample(response.data);
      } else if (response) {
        setSample(response);
      } else {
        setError("Sample record not found in laboratory database");
      }
    } catch (err) {
      console.error("Error fetching sample:", err);
      setError(err instanceof Error ? err.message : "Failed to load specimen details.");
    } finally {
      setLoading(false);
    }
  }, [sampleId]);

  useEffect(() => {
    if (sampleId) {
      fetchSample();
    }
  }, [sampleId, fetchSample]);

  return (
    <ProtectedRoute>
      <DashboardLayout title={`Specimen ${sample?.sampleNumber || sampleId}`}>
        <div className="space-y-6 pb-12">
          {/* Top Medical Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Link
                href="/samples"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">
                    Clinical Specimen Dossier
                  </h1>
                  <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-black text-sky-800">
                    NABL / ISO 15189
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-analytical verification, tube container handling SOP &amp; immutable audit trail
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Chain-of-Custody Verified
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-72 flex-col items-center justify-center space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <p className="text-sm font-bold text-slate-700">Retrieving laboratory specimen record...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200">
                <FlaskConical className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-black text-rose-900">Error Loading Specimen</h3>
              <p className="mt-2 text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchSample}
                className="mt-6 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors"
              >
                Retry Query
              </button>
            </div>
          ) : sample ? (
            <SampleDetails sample={sample} onRefresh={fetchSample} />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
