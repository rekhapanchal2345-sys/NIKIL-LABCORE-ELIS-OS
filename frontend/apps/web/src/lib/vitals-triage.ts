/**
 * LabCore ELIS LIS - Clinical Vitals & Triage Engine
 * Standardized according to:
 * - AHA / ACC 2017 & JNC 8 Blood Pressure Guidelines
 * - Royal College of Physicians NEWS2 (National Early Warning Score)
 * - WHO Anthropometric & BMI Standards
 * - ADA 2024 Standards of Care for Blood Glucose
 * - CLSI Pre-Analytical Phlebotomy Safety Protocols
 */

export interface VitalsData {
  bpSys: number;
  bpDia: number;
  pulse: number;
  spo2: number;
  temp: number; // in Fahrenheit
  respRate?: number;
  fbs?: number;
  glucoseType?: "FASTING" | "POST_PRANDIAL" | "RANDOM";
  height?: number | null; // cm
  weight?: number | null; // kg
  bmi?: number | null;
  bsa?: number | null; // Body surface area (m²)
  fastingStatus?: "FASTING_12H" | "POST_PRANDIAL" | "RANDOM" | string;
  avpu?: "ALERT" | "VOICE" | "PAIN" | "UNRESPONSIVE";
  painScore?: number; // 0 - 10
  triageLevel?: "ROUTINE" | "PRIORITY" | "URGENT" | "CRITICAL";
  phlebotomySafety?: {
    syncopeRisk?: boolean; // History of fainting during blood draw
    anticoagulantTherapy?: boolean; // Warfarin, Heparin, NOAC, Aspirin
    difficultVeins?: boolean; // Fragile, deep, or collapsed veins
    restrictedLimb?: "NONE" | "LEFT_ARM" | "RIGHT_ARM" | "BOTH_ARMS"; // Fistula, mastectomy
    pediatricNeedleRecommended?: boolean;
    fastingVerified?: boolean;
  };
  vitalsNotes?: string;
  recordedAt?: string;
  recordedBy?: string;
}

export function parsePatientVitals(patient?: any | null): VitalsData {
  const defaultVitals: VitalsData = {
    bpSys: 120,
    bpDia: 80,
    pulse: 74,
    spo2: 98,
    temp: 98.4,
    respRate: 16,
    fbs: 95,
    glucoseType: "FASTING",
    height: patient?.height ?? 170,
    weight: patient?.weight ?? 68,
    bmi: patient?.bmi ?? 23.5,
    bsa: 1.79,
    fastingStatus: patient?.fastingStatus || "FASTING_12H",
    avpu: "ALERT",
    painScore: 0,
    triageLevel: "ROUTINE",
    phlebotomySafety: {
      syncopeRisk: false,
      anticoagulantTherapy: false,
      difficultVeins: false,
      restrictedLimb: "NONE",
      pediatricNeedleRecommended: false,
      fastingVerified: true,
    },
    vitalsNotes: "",
    recordedAt: patient?.updatedAt || new Date().toISOString(),
    recordedBy: "Triage Phlebotomist",
  };

  if (patient?.notes) {
    try {
      const parsed = JSON.parse(patient.notes);
      if (parsed && typeof parsed === "object") {
        const height = patient.height || parsed.height || defaultVitals.height;
        const weight = patient.weight || parsed.weight || defaultVitals.weight;
        const bmi = patient.bmi || parsed.bmi || (height && weight ? calculateBmi(height, weight) : defaultVitals.bmi);
        const bsa = height && weight ? calculateBsa(height, weight) : defaultVitals.bsa;

        return {
          ...defaultVitals,
          ...parsed,
          height,
          weight,
          bmi,
          bsa,
          fastingStatus: patient.fastingStatus || parsed.fastingStatus || defaultVitals.fastingStatus,
          phlebotomySafety: {
            ...defaultVitals.phlebotomySafety,
            ...(parsed.phlebotomySafety || {}),
          },
        };
      }
    } catch {
      // notes is simple text
      return {
        ...defaultVitals,
        vitalsNotes: patient.notes,
      };
    }
  }

  return defaultVitals;
}

// 1. AHA / ACC Blood Pressure Classification
export function getBpClassification(sys: number, dia: number) {
  if (sys < 90 || dia < 60) {
    return {
      stage: "HYPOTENSION",
      label: "Hypotension",
      color: "text-cyan-700 bg-cyan-50 border-cyan-300",
      isCritical: false,
      badge: "Low BP",
      action: "Check hydration & postural changes. Avoid rapid standing.",
    };
  }
  if (sys > 180 || dia > 120) {
    return {
      stage: "HYPERTENSIVE_CRISIS",
      label: "Hypertensive Crisis (STAT)",
      color: "text-rose-800 bg-rose-100 border-rose-400 animate-pulse",
      isCritical: true,
      badge: "Crisis STAT",
      action: "IMMEDIATE medical officer notification required. Do not dismiss patient.",
    };
  }
  if (sys >= 140 || dia >= 90) {
    return {
      stage: "STAGE_2_HTN",
      label: "Stage 2 Hypertension",
      color: "text-amber-800 bg-amber-50 border-amber-300",
      isCritical: false,
      badge: "Stage 2 HTN",
      action: "Significant blood pressure elevation. Recommend physician evaluation.",
    };
  }
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
    return {
      stage: "STAGE_1_HTN",
      label: "Stage 1 Hypertension",
      color: "text-amber-700 bg-amber-50/70 border-amber-200",
      isCritical: false,
      badge: "Stage 1 HTN",
      action: "Mild elevation. Clinical lifestyle & repeat measurement recommended.",
    };
  }
  if (sys >= 120 && sys <= 129 && dia < 80) {
    return {
      stage: "ELEVATED",
      label: "Elevated BP",
      color: "text-yellow-800 bg-yellow-50 border-yellow-200",
      isCritical: false,
      badge: "Elevated",
      action: "Systolic borderline elevated with normal diastolic.",
    };
  }
  return {
    stage: "NORMAL",
    label: "Normal Blood Pressure",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    isCritical: false,
    badge: "Normal BP",
    action: "Optimal cardiovascular hemodynamics.",
  };
}

// 2. Pulse / Heart Rate Classification
export function getPulseClassification(pulse: number) {
  if (pulse < 50) {
    return {
      stage: "SEVERE_BRADYCARDIA",
      label: "Severe Bradycardia",
      color: "text-indigo-800 bg-indigo-50 border-indigo-300",
      isCritical: true,
    };
  }
  if (pulse < 60) {
    return {
      stage: "BRADYCARDIA",
      label: "Bradycardia",
      color: "text-blue-700 bg-blue-50 border-blue-200",
      isCritical: false,
    };
  }
  if (pulse > 130) {
    return {
      stage: "SEVERE_TACHYCARDIA",
      label: "Critical Tachycardia",
      color: "text-rose-800 bg-rose-50 border-rose-300 animate-pulse",
      isCritical: true,
    };
  }
  if (pulse > 100) {
    return {
      stage: "TACHYCARDIA",
      label: "Tachycardia",
      color: "text-amber-800 bg-amber-50 border-amber-200",
      isCritical: false,
    };
  }
  return {
    stage: "NORMAL",
    label: "Normal Resting Rhythm",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    isCritical: false,
  };
}

// 3. SpO2 Oxygen Saturation Classification
export function getSpo2Classification(spo2: number) {
  if (spo2 <= 90) {
    return {
      stage: "SEVERE_HYPOXIA",
      label: "Critical Hypoxia (<91%)",
      color: "text-rose-800 bg-rose-100 border-rose-400 animate-pulse",
      isCritical: true,
      action: "Administer supplemental O2 immediately. Escalate to clinical team.",
    };
  }
  if (spo2 <= 94) {
    return {
      stage: "MILD_HYPOXIA",
      label: "Mild Hypoxia (91-94%)",
      color: "text-amber-800 bg-amber-50 border-amber-300",
      isCritical: false,
      action: "Monitor respiration. Assess for underlying respiratory conditions (COPD/Asthma).",
    };
  }
  return {
    stage: "OPTIMAL",
    label: "Optimal Oxygenation (≥95%)",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    isCritical: false,
    action: "Normal peripheral oxygen perfusion on room air.",
  };
}

// 4. Body Temperature Classification
export function getTempClassification(tempF: number) {
  if (tempF < 95.0) {
    return {
      stage: "HYPOTHERMIA",
      label: "Hypothermia (<95°F)",
      color: "text-cyan-800 bg-cyan-50 border-cyan-300",
      isCritical: true,
    };
  }
  if (tempF > 103.0) {
    return {
      stage: "HIGH_FEVER",
      label: "High Pyrexia (>103°F)",
      color: "text-rose-800 bg-rose-100 border-rose-400 animate-pulse",
      isCritical: true,
    };
  }
  if (tempF > 100.4) {
    return {
      stage: "FEVER",
      label: "Pyrexia / Fever (>100.4°F)",
      color: "text-amber-800 bg-amber-50 border-amber-300",
      isCritical: false,
    };
  }
  if (tempF > 99.0) {
    return {
      stage: "LOW_GRADE_FEVER",
      label: "Low-Grade Fever",
      color: "text-yellow-800 bg-yellow-50 border-yellow-200",
      isCritical: false,
    };
  }
  return {
    stage: "AFEBRILE",
    label: "Afebrile / Normothermic",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    isCritical: false,
  };
}

// 5. Respiratory Rate Classification
export function getRespRateClassification(rr: number) {
  if (rr < 12) {
    return {
      stage: "BRADYPNEA",
      label: "Bradypnea (<12 bpm)",
      color: "text-blue-800 bg-blue-50 border-blue-200",
      isCritical: false,
    };
  }
  if (rr > 24) {
    return {
      stage: "TACHYPNEA",
      label: "Tachypnea (>24 bpm)",
      color: "text-rose-800 bg-rose-50 border-rose-300",
      isCritical: true,
    };
  }
  return {
    stage: "NORMAL",
    label: "Normal (12-20 bpm)",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    isCritical: false,
  };
}

// 6. Blood Sugar Classification
export function getGlucoseClassification(fbs: number, type: "FASTING" | "POST_PRANDIAL" | "RANDOM" = "FASTING") {
  if (fbs < 70) {
    return {
      stage: "HYPOGLYCEMIA",
      label: "Hypoglycemia (<70 mg/dL)",
      color: "text-rose-800 bg-rose-100 border-rose-400 animate-pulse",
      isCritical: true,
      action: "CRITICAL: Risk of neuroglycopenia. Provide rapid-acting oral glucose/snack immediately if conscious.",
    };
  }

  if (type === "FASTING") {
    if (fbs >= 126) {
      return {
        stage: "DIABETIC",
        label: "Diabetic Range (≥126 mg/dL)",
        color: "text-rose-700 bg-rose-50 border-rose-200",
        isCritical: false,
        action: "Fasting hyperglycemia. Recommend HbA1c confirmatory testing.",
      };
    }
    if (fbs >= 100) {
      return {
        stage: "PRE_DIABETIC",
        label: "Impaired Fasting Glucose (100-125)",
        color: "text-amber-800 bg-amber-50 border-amber-200",
        isCritical: false,
        action: "Pre-diabetic metabolic range.",
      };
    }
    return {
      stage: "NORMAL",
      label: "Normal Fasting (70-99 mg/dL)",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      isCritical: false,
      action: "Optimal fasting glucose regulation.",
    };
  }

  // Random or Post-Prandial
  if (fbs >= 200) {
    return {
      stage: "DIABETIC",
      label: "Hyperglycemia (≥200 mg/dL)",
      color: "text-rose-700 bg-rose-50 border-rose-200",
      isCritical: false,
      action: "Significant post-load elevation. Correlate with HbA1c.",
    };
  }
  if (fbs >= 140) {
    return {
      stage: "PRE_DIABETIC",
      label: "Impaired Glucose Tolerance (140-199)",
      color: "text-amber-800 bg-amber-50 border-amber-200",
      isCritical: false,
      action: "Elevated post-meal blood sugar.",
    };
  }
  return {
    stage: "NORMAL",
    label: "Normal Post-Meal (<140 mg/dL)",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    isCritical: false,
    action: "Normal post-prandial glycemic clearance.",
  };
}

// 7. BMI & Anthropometrics
export function calculateBmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0) return 22.0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function calculateBsa(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0) return 1.73;
  // Mosteller formula: BSA = sqrt((height * weight) / 3600)
  return parseFloat(Math.sqrt((heightCm * weightKg) / 3600).toFixed(2));
}

export function getBmiClassification(bmi: number) {
  if (bmi < 18.5) {
    return {
      stage: "UNDERWEIGHT",
      label: "Underweight (<18.5)",
      color: "text-cyan-800 bg-cyan-50 border-cyan-200",
    };
  }
  if (bmi >= 30.0) {
    return {
      stage: "OBESE",
      label: "Obese Range (≥30.0)",
      color: "text-rose-800 bg-rose-50 border-rose-200",
    };
  }
  if (bmi >= 25.0) {
    return {
      stage: "OVERWEIGHT",
      label: "Overweight (25.0 - 29.9)",
      color: "text-amber-800 bg-amber-50 border-amber-200",
    };
  }
  return {
    stage: "NORMAL",
    label: "Healthy Weight (18.5 - 24.9)",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
}

// 8. Royal College of Physicians NEWS2 (National Early Warning Score)
export function calculateNews2Score(v: VitalsData): {
  score: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  label: string;
  color: string;
  badgeBg: string;
  recommendation: string;
} {
  let score = 0;

  // Respiration Rate (bpm)
  const rr = v.respRate || 16;
  if (rr <= 8) score += 3;
  else if (rr >= 9 && rr <= 11) score += 1;
  else if (rr >= 12 && rr <= 20) score += 0;
  else if (rr >= 21 && rr <= 24) score += 2;
  else if (rr >= 25) score += 3;

  // SpO2 Scale 1 (%)
  const sp = v.spo2 || 98;
  if (sp <= 91) score += 3;
  else if (sp >= 92 && sp <= 93) score += 2;
  else if (sp >= 94 && sp <= 95) score += 1;
  else score += 0;

  // Systolic Blood Pressure (mmHg)
  const sys = v.bpSys || 120;
  if (sys <= 90) score += 3;
  else if (sys >= 91 && sys <= 100) score += 2;
  else if (sys >= 101 && sys <= 110) score += 1;
  else if (sys >= 111 && sys <= 219) score += 0;
  else if (sys >= 220) score += 3;

  // Pulse (bpm)
  const p = v.pulse || 72;
  if (p <= 40) score += 3;
  else if (p >= 41 && p <= 50) score += 1;
  else if (p >= 51 && p <= 90) score += 0;
  else if (p >= 91 && p <= 110) score += 1;
  else if (p >= 111 && p <= 130) score += 2;
  else if (p >= 131) score += 3;

  // Consciousness / AVPU
  const avpu = v.avpu || "ALERT";
  if (avpu !== "ALERT") score += 3;

  // Temperature (°F)
  const temp = v.temp || 98.4;
  if (temp <= 95.0) score += 3;
  else if (temp > 95.0 && temp <= 96.8) score += 1;
  else if (temp > 96.8 && temp <= 100.4) score += 0;
  else if (temp > 100.4 && temp <= 102.2) score += 1;
  else if (temp > 102.2) score += 2;

  if (score >= 7) {
    return {
      score,
      risk: "HIGH",
      label: "High Clinical Risk (NEWS2 ≥ 7)",
      color: "text-rose-900 bg-rose-100 border-rose-400",
      badgeBg: "bg-rose-600 text-white",
      recommendation: "Emergency clinical escalation. Immediate physician bedside evaluation required.",
    };
  }
  if (score >= 5) {
    return {
      score,
      risk: "MEDIUM",
      label: "Medium Clinical Risk (NEWS2 5-6)",
      color: "text-amber-900 bg-amber-100 border-amber-300",
      badgeBg: "bg-amber-600 text-white",
      recommendation: "Urgent review by Registered Medical Officer. Enhanced vital signs monitoring.",
    };
  }
  return {
    score,
    risk: "LOW",
    label: "Low Clinical Risk (NEWS2 0-4)",
    color: "text-emerald-900 bg-emerald-50 border-emerald-200",
    badgeBg: "bg-emerald-600 text-white",
    recommendation: "Standard diagnostic routine. Suitable for regular OPD phlebotomy collection.",
  };
}
