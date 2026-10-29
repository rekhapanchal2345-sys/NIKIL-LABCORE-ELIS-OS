"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatPatientFullName } from "@/lib/patient-utils";
import { useAuth } from "@/hooks/useAuth";
import { buildTubeGroups, type SpecimenCollectionPayload } from "./phlebotomy-draw-utils";
import { buildStructuredNotes, getFooterHint, initialDetails } from "./phlebotomy-draw-logic";
import PhlebotomyModalHeader from "./PhlebotomyModalHeader";
import PhlebotomyModalFooter from "./PhlebotomyModalFooter";
import PhlebotomyPatientCard from "./PhlebotomyPatientCard";
import PhlebotomyTubeTable from "./PhlebotomyTubeTable";
import PhlebotomyDetailsForm, { type CollectionDetails } from "./PhlebotomyDetailsForm";
import { PhlebotomyBalanceNotice, PhlebotomyErrorBanner } from "./PhlebotomyAlerts";

export type { SpecimenCollectionPayload } from "./phlebotomy-draw-utils";

interface PhlebotomyDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onCollected: (data: SpecimenCollectionPayload) => Promise<void>;
}

export default function PhlebotomyDrawModal({ isOpen, onClose, order, onCollected }: PhlebotomyDrawModalProps) {
  const { user } = useAuth();

  const [details, setDetails] = useState<CollectionDetails>(() => initialDetails(order));
  const [verifiedName, setVerifiedName] = useState(false);
  const [verifiedId, setVerifiedId] = useState(false);
  const [collectedTubes, setCollectedTubes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openedAt, setOpenedAt] = useState<Date>(new Date());

  const tubeGroups = useMemo(() => buildTubeGroups(order?.items), [order?.items]);

  // Reset the form whenever a different order is opened
  useEffect(() => {
    if (!isOpen || !order) return;
    setDetails(initialDetails(order));
    setVerifiedName(false);
    setVerifiedId(false);
    setCollectedTubes(new Set());
    setError("");
    setLoading(false);
    setOpenedAt(new Date());
  }, [isOpen, order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !order) return null;

  const balanceDue = Math.max(0, (Number(order.grandTotal) || 0) - (Number(order.paidAmount) || 0));
  const collectorName =
    user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Logged-in user";

  const identityConfirmed = verifiedName && verifiedId;
  const allTubesConfirmed = tubeGroups.length === 0 || collectedTubes.size === tubeGroups.length;
  const qualityNeedsNote = details.quality !== "Adequate" && details.notes.trim().length === 0;
  const canSubmit = !loading && details.barcode.trim().length > 0 && identityConfirmed && allTubesConfirmed && !qualityNeedsNote;

  const toggleTube = (key: string) => {
    setCollectedTubes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    try {
      await onCollected({
        barcode: details.barcode.trim(),
        notes: buildStructuredNotes(details, tubeGroups),
        collectionType: details.collectionType,
        priority: order.priority || "ROUTINE",
        location: details.location,
        sampleQuality: details.quality,
        sampleVolume: details.volumeMl.trim() ? `${details.volumeMl.trim()} mL` : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Specimen collection could not be recorded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-modal-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <PhlebotomyModalHeader
          orderNumber={order.orderNumber}
          openedAt={openedAt}
          priority={order.priority}
          loading={loading}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <PhlebotomyErrorBanner message={error} />
            <PhlebotomyBalanceNotice balanceDue={balanceDue} />

            <PhlebotomyPatientCard
              patientName={formatPatientFullName(order.patient || {})}
              patient={order.patient}
              doctorName={order.doctor?.fullName}
              verifiedName={verifiedName}
              verifiedId={verifiedId}
              onVerifiedName={setVerifiedName}
              onVerifiedId={setVerifiedId}
            />

            <PhlebotomyTubeTable groups={tubeGroups} collected={collectedTubes} onToggle={toggleTube} />

            <PhlebotomyDetailsForm
              values={details}
              onChange={(patch) => setDetails((prev) => ({ ...prev, ...patch }))}
              autoFocusKey={order.id}
            />
          </div>

          <PhlebotomyModalFooter
            collectorName={collectorName}
            hint={getFooterHint({ identityConfirmed, allTubesConfirmed, qualityNeedsNote })}
            canSubmit={canSubmit}
            loading={loading}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}
