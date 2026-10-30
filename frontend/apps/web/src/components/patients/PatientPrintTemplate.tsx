"use client";

import React from "react";
import "./PatientPrintTemplate.css";
import PatientRegistrationPrintForm from "./PatientRegistrationPrintForm";

interface PatientPrintTemplateProps {
  patient: Record<string, any>;
}

export default function PatientPrintTemplate({ patient }: PatientPrintTemplateProps) {
  return (
    <div className="print-template-container">
      <PatientRegistrationPrintForm
        isModal={false}
        patientData={patient || {}}
        patientId={patient?.uhid || patient?.id}
      />
    </div>
  );
}
