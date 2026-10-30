"use client";

import PatientRegistrationSheet, {
  FacilityHeaderType,
  FacilityProfile,
  FACILITY_PRESETS,
  PatientFormData,
  PatientRegistrationPrintFormProps,
} from "./PatientRegistrationSheet";

export type FacilityType = FacilityHeaderType;
export type {
  FacilityHeaderType,
  FacilityProfile,
  PatientFormData,
  PatientRegistrationPrintFormProps,
};
export { FACILITY_PRESETS, PatientRegistrationSheet };

export default PatientRegistrationSheet;
export { PatientRegistrationSheet as PatientRegistrationPrintForm };
