"use client";

import React, { useState } from "react";
import RegisterPatientWizard from "./RegisterPatientWizard";

interface PixelPerfectPatientRegistrationProps {
  onSubmit?: (formData: any) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

/**
 * PixelPerfectPatientRegistration:
 * Wrapped multi-step registration wizard matching "Register New Doctor" exactly.
 * Retains backward compatibility with existing props while delivering the unified
 * dr-overlay / dr-panel / dr-step / dr-grid theme.
 */
export default function PixelPerfectPatientRegistration({
  onSubmit,
  onCancel,
  loading = false,
}: PixelPerfectPatientRegistrationProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <RegisterPatientWizard
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        onCancel?.();
      }}
      onSuccess={async (patient) => {
        if (onSubmit) {
          await onSubmit(patient);
        } else {
          onCancel?.();
        }
      }}
    />
  );
}