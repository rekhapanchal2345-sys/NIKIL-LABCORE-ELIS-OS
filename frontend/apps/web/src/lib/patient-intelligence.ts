/**
 * Clinical Intelligence, AI NLP Query Parsing & Risk Scoring Engine
 * Designed for LabCore Enterprise LIS (NABL ISO 15189:2022 & DPDP Act 2023 Compliant)
 */

export interface PatientRiskProfile {
  score: number; // 0 - 100
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  factors: string[];
  recommendations: string[];
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  nextFollowupWeeks: number;
}

export interface ParsedPatientQuery {
  rawQuery: string;
  textQuery: string;
  filters: {
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    minAge?: number;
    maxAge?: number;
    conditions?: string[];
    isSenior?: boolean;
    isPediatric?: boolean;
    hasAbha?: boolean;
    hasInsurance?: boolean;
    isVip?: boolean;
    bloodGroup?: string;
    city?: string;
    isCritical?: boolean;
  };
  explanation: string;
  activeFilterCount: number;
}

/**
 * Calculates evidence-based clinical risk score (0-100) based on age,
 * chronic comorbidities, drug allergies, and clinical flags.
 */
export function calculatePatientRiskScore(patient: any): PatientRiskProfile {
  if (!patient) {
    return {
      score: 10,
      level: 'LOW',
      factors: ['Baseline routine profile'],
      recommendations: ['Annual preventative wellness checkup'],
      color: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      nextFollowupWeeks: 52,
    };
  }

  let score = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  // 1. Age Factor
  const age = Number(patient.age) || 0;
  if (age >= 80) {
    score += 25;
    factors.push('Geriatric Octogenarian (80+ yrs)');
    recommendations.push('Fall risk assessment, Renal function monitoring (eGFR)');
  } else if (age >= 65) {
    score += 18;
    factors.push('Senior Citizen (65+ yrs)');
    recommendations.push('Comprehensive metabolic panel & bone density screening');
  } else if (age < 2 && age > 0) {
    score += 15;
    factors.push('Neonatal / Infant (High vulnerability)');
    recommendations.push('Pediatric micro-sample collection protocol');
  }

  // 2. Chronic Diseases
  const conditions: string[] = [];
  if (Array.isArray(patient.chronicDiseases)) conditions.push(...patient.chronicDiseases);
  if (Array.isArray(patient.medicalConditions)) conditions.push(...patient.medicalConditions);
  if (typeof patient.medicalConditions === 'string') {
    conditions.push(...patient.medicalConditions.split(/[,;\n]+/).map((s: string) => s.trim()));
  }

  const condText = conditions.join(' ').toLowerCase();

  if (condText.includes('diabet') || condText.includes('sugar') || condText.includes('t2dm') || condText.includes('t1dm')) {
    score += 24;
    factors.push('Type 1 / Type 2 Diabetes Mellitus');
    recommendations.push('Quarterly HbA1c, Urine Microalbumin & Lipid Profile');
  }

  if (condText.includes('hyperten') || condText.includes('bp') || condText.includes('high blood pressure')) {
    score += 18;
    factors.push('Chronic Systemic Hypertension');
    recommendations.push('Serum Electrolytes, Renal Panel & ECG verification');
  }

  if (condText.includes('ckd') || condText.includes('kidney') || condText.includes('renal')) {
    score += 30;
    factors.push('Chronic Kidney Disease (CKD)');
    recommendations.push('Strict eGFR tracking, Creatinine Clearance & Potassium monitoring');
  }

  if (condText.includes('cardiac') || condText.includes('heart') || condText.includes('cad') || condText.includes('coronary')) {
    score += 28;
    factors.push('Cardiovascular Disease / CAD');
    recommendations.push('High-Sensitivity Troponin-I, hs-CRP & Apolipoprotein panel');
  }

  if (condText.includes('cancer') || condText.includes('onco') || condText.includes('tumor')) {
    score += 35;
    factors.push('Oncology History / Active Malignancy');
    recommendations.push('Serial Tumor Markers & CBC with absolute differential');
  }

  if (condText.includes('asthma') || condText.includes('copd') || condText.includes('respiratory')) {
    score += 16;
    factors.push('Chronic Pulmonary Disorder (Asthma/COPD)');
    recommendations.push('Blood Gas Analysis (ABG) & IgE / Allergy panel if triggered');
  }

  if (condText.includes('thyroid') || condText.includes('hypo') || condText.includes('hyper')) {
    score += 12;
    factors.push('Thyroid Dysfunction');
    recommendations.push('Quarterly Free T3, Free T4 & Ultrasensitive TSH');
  }

  // 3. Drug Allergies
  const allergies = Array.isArray(patient.allergies)
    ? patient.allergies
    : typeof patient.allergies === 'string'
    ? patient.allergies.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  if (allergies.length >= 3) {
    score += 16;
    factors.push(`Multiple Drug/Food Allergies (${allergies.length} recorded)`);
    recommendations.push('Red Alert Allergy wristband before phlebotomy & IV administration');
  } else if (allergies.length >= 1) {
    score += 8;
    factors.push(`Documented Allergies: ${allergies.slice(0, 2).join(', ')}`);
  }

  // 4. Critical Flags
  if (patient.isCritical || patient.criticalAlertCount > 0) {
    score += 35;
    factors.push('Active Panic Value / Critical Alert on Laboratory Record');
    recommendations.push('Immediate Clinician notification & Critical Telephonic Read-back');
  }

  if (patient.patientType === 'VIP') {
    factors.push('VIP Patient Protocol (Fast-Track Service)');
  }

  // Normalize score
  score = Math.min(100, Math.max(8, score));

  // Determine Level & Theme
  let level: PatientRiskProfile['level'] = 'LOW';
  let color = {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  let nextFollowupWeeks = 26;

  if (score >= 75) {
    level = 'CRITICAL';
    color = {
      bg: 'bg-rose-500/10',
      text: 'text-rose-600',
      border: 'border-rose-500/30',
      badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    };
    nextFollowupWeeks = 2;
  } else if (score >= 50) {
    level = 'HIGH';
    color = {
      bg: 'bg-orange-500/10',
      text: 'text-orange-600',
      border: 'border-orange-500/30',
      badge: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
    };
    nextFollowupWeeks = 6;
  } else if (score >= 25) {
    level = 'MODERATE';
    color = {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      border: 'border-amber-500/30',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
    };
    nextFollowupWeeks = 12;
  }

  if (recommendations.length === 0) {
    recommendations.push('Annual comprehensive metabolic panel & lipid health check');
  }

  return {
    score,
    level,
    factors: factors.length > 0 ? factors : ['Routine health profile, no elevated risk factors'],
    recommendations,
    color,
    nextFollowupWeeks,
  };
}

/**
 * Intelligent Natural Language Parser for Patient Search Queries.
 * Translates conversational medical text into structured filter parameters:
 * Examples:
 *   "female diabetic above 60 in ahmedabad"
 *   "critical patients with unlinked abha"
 *   "senior citizen blood group o+ with hypertension"
 */
export function parseNaturalLanguagePatientQuery(rawQuery: string): ParsedPatientQuery {
  const query = (rawQuery || '').trim();
  if (!query) {
    return {
      rawQuery: '',
      textQuery: '',
      filters: {},
      explanation: '',
      activeFilterCount: 0,
    };
  }

  const filters: ParsedPatientQuery['filters'] = {};
  const explanations: string[] = [];
  let workingText = query.toLowerCase();

  // 1. Gender extraction
  if (/\b(female|women|woman|girl|mrs|ms)\b/i.test(workingText)) {
    filters.gender = 'FEMALE';
    explanations.push('Female patients');
    workingText = workingText.replace(/\b(female|women|woman|girl|mrs|ms)\b/gi, ' ');
  } else if (/\b(male|man|men|boy|mr)\b/i.test(workingText)) {
    filters.gender = 'MALE';
    explanations.push('Male patients');
    workingText = workingText.replace(/\b(male|man|men|boy|mr)\b/gi, ' ');
  }

  // 2. Age parsing
  // Patterns like "above 60", "> 65", "over 50", "age > 70", "older than 60"
  const overAgeMatch = workingText.match(/\b(?:above|over|older than|>=|>)\s*(\d{1,3})\b/);
  if (overAgeMatch) {
    const minAge = parseInt(overAgeMatch[1]!, 10);
    filters.minAge = minAge;
    explanations.push(`Age ≥ ${minAge}`);
    workingText = workingText.replace(overAgeMatch[0], ' ');
  }

  // Patterns like "under 18", "< 12", "younger than 20", "below 30"
  const underAgeMatch = workingText.match(/\b(?:under|below|younger than|<=|<)\s*(\d{1,3})\b/);
  if (underAgeMatch) {
    const maxAge = parseInt(underAgeMatch[1]!, 10);
    filters.maxAge = maxAge;
    explanations.push(`Age ≤ ${maxAge}`);
    workingText = workingText.replace(underAgeMatch[0], ' ');
  }

  // Senior / Pediatric keywords
  if (/\b(senior|geriatric|elderly|60\+)\b/i.test(workingText)) {
    filters.isSenior = true;
    if (!filters.minAge) filters.minAge = 60;
    explanations.push('Geriatric (60+)');
    workingText = workingText.replace(/\b(senior|geriatric|elderly|60\+)\b/gi, ' ');
  }

  if (/\b(pediatric|child|infant|kid)\b/i.test(workingText)) {
    filters.isPediatric = true;
    if (!filters.maxAge) filters.maxAge = 14;
    explanations.push('Pediatric (≤14)');
    workingText = workingText.replace(/\b(pediatric|child|infant|kid)\b/gi, ' ');
  }

  // 3. Clinical Conditions
  const detectedConditions: string[] = [];
  const conditionKeywords = [
    { key: 'diabetes', pattern: /\b(diabet\w*|sugar|t2dm|t1dm)\b/gi },
    { key: 'hypertension', pattern: /\b(hypertens\w*|high bp|blood pressure)\b/gi },
    { key: 'thyroid', pattern: /\b(thyroid|hypothyroid|hyperthyroid)\b/gi },
    { key: 'cardiac', pattern: /\b(cardiac|heart|cad|angina)\b/gi },
    { key: 'kidney', pattern: /\b(kidney|renal|ckd)\b/gi },
    { key: 'asthma', pattern: /\b(asthma|respiratory|copd)\b/gi },
  ];

  for (const { key, pattern } of conditionKeywords) {
    if (pattern.test(workingText)) {
      detectedConditions.push(key);
      workingText = workingText.replace(pattern, ' ');
    }
  }

  if (detectedConditions.length > 0) {
    filters.conditions = detectedConditions;
    explanations.push(`Condition: ${detectedConditions.join(', ')}`);
  }

  // 4. Critical / High Alert
  if (/\b(critical|urgent|panic|emergency)\b/i.test(workingText)) {
    filters.isCritical = true;
    explanations.push('Critical watch list');
    workingText = workingText.replace(/\b(critical|urgent|panic|emergency)\b/gi, ' ');
  }

  // 5. ABHA Status
  if (/\b(unlinked abha|no abha|without abha)\b/i.test(workingText)) {
    filters.hasAbha = false;
    explanations.push('ABHA Not Linked');
    workingText = workingText.replace(/\b(unlinked abha|no abha|without abha)\b/gi, ' ');
  } else if (/\b(abha|abdm)\b/i.test(workingText)) {
    filters.hasAbha = true;
    explanations.push('ABHA Linked');
    workingText = workingText.replace(/\b(abha|abdm)\b/gi, ' ');
  }

  // 6. VIP
  if (/\b(vip|priority)\b/i.test(workingText)) {
    filters.isVip = true;
    explanations.push('VIP Category');
    workingText = workingText.replace(/\b(vip|priority)\b/gi, ' ');
  }

  // 7. Blood Groups
  const bgMatch = workingText.match(/\b(a\+|a-|b\+|b-|ab\+|ab-|o\+|o-)\b/i);
  if (bgMatch) {
    filters.bloodGroup = bgMatch[1]!.toUpperCase();
    explanations.push(`Blood: ${filters.bloodGroup}`);
    workingText = workingText.replace(bgMatch[0], ' ');
  }

  // 8. Insurance
  if (/\b(insured|insurance|tpa|cashless)\b/i.test(workingText)) {
    filters.hasInsurance = true;
    explanations.push('Has Insurance');
    workingText = workingText.replace(/\b(insured|insurance|tpa|cashless)\b/gi, ' ');
  }

  // Clean remaining text
  const textQuery = workingText
    .replace(/\b(patient|patients|show|list|find|who|are|with|having|in|and|or|the|has)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    rawQuery,
    textQuery,
    filters,
    explanation: explanations.join(' · '),
    activeFilterCount: explanations.length,
  };
}

/**
 * Generates verified statutory communication drafts (WhatsApp / SMS / Email)
 */
export function generatePatientNotification(
  type: 'WHATSAPP_REPORT' | 'CHRONIC_RECALL' | 'CRITICAL_ALERT',
  patient: any,
  options: {
    labName?: string;
    testNames?: string;
    downloadUrl?: string;
    consultingDoctor?: string;
    criticalDetails?: string;
  } = {}
) {
  const labName = options.labName || 'LabCore Diagnostics';
  const patientName = `${patient.title || 'Mr.'} ${patient.firstName} ${patient.lastName}`.trim();
  const uhid = patient.uhid || patient.id?.slice(0, 8);
  const downloadUrl = options.downloadUrl || `https://labcore.health/p/${uhid}/report`;

  switch (type) {
    case 'WHATSAPP_REPORT':
      return {
        subject: `Your Diagnostic Report from ${labName} is Ready`,
        message: `Dear ${patientName},\n\nYour diagnostic laboratory test results for UHID: *${uhid}* have been clinically verified by our pathologist and are ready.\n\n📄 *Tests Completed:* ${options.testNames || 'Laboratory Investigation Panel'}\n🏥 *Laboratory:* ${labName} (NABL Accredited)\n\n⬇️ *Download Encrypted PDF Report:* \n${downloadUrl}\n\n_For any queries or doctor tele-consultation, reply to this WhatsApp or call 1800-LAB-CORE._`,
        channel: 'WhatsApp',
      };

    case 'CHRONIC_RECALL':
      return {
        subject: `Routine Health Reminder - ${labName}`,
        message: `Dear ${patientName},\n\nAs part of your personalized chronic care management, your routine diagnostic monitoring is due this month.\n\n🩺 *Suggested Review:* HbA1c & Fasting Glucose Profile\n📅 *Schedule Free Home Phlebotomy:* ${downloadUrl}/book\n\n_Stay proactive about your wellness!_\n${labName}`,
        channel: 'WhatsApp / SMS',
      };

    case 'CRITICAL_ALERT':
      return {
        subject: `URGENT: Critical Diagnostic Laboratory Alert - ${patientName}`,
        message: `🚨 *CRITICAL LABORATORY ALERT*\n\nPatient: ${patientName} (UHID: ${uhid})\n*Critical Finding:* ${options.criticalDetails || 'Panic reference range exceeded'}\n\nPhysician notified: ${options.consultingDoctor || 'Primary Clinician'}\nPlease contact the treating physician or emergency department immediately.\n\n${labName} Critical Triage Desk`,
        channel: 'High Priority SMS / Call',
      };
  }
}
