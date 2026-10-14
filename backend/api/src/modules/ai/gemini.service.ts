import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { generateSmartReport } from "./ai.service";

interface GeminiClinicalAnalysis {
  orderId: string;
  orderNumber: string;
  patientName: string;
  patientUhid: string;
  summary: string;
  differentialDiagnosis: string[];
  clinicalCorrelations: string[];
  riskCategory: "NORMAL" | "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK" | "CRITICAL_EMERGENCY";
  recommendedActions: string[];
  icd10Suggestions: Array<{ code: string; title: string }>;
  source: "GEMINI_LIVE_AI" | "CLINICAL_RULE_FALLBACK";
  generatedAt: string;
}

export async function interpretOrderWithGemini(orderId: string): Promise<GeminiClinicalAnalysis> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      patient: true,
      doctor: true,
      items: {
        include: {
          test: {
            include: {
              category: true,
              parameters: {
                include: {
                  referenceRanges: true,
                },
              },
            },
          },
        },
      },
      results: {
        include: {
          test: true,
          values: {
            include: {
              parameter: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new HttpError("Order not found", 404);
  }

  const patient = order.patient;
  const age = (patient as any).age || (patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : 35);
  const gender = patient.gender || "UNKNOWN";

  // Build parameter summary
  const paramSummaries: string[] = [];
  const testResultsForFallback: any[] = [];

  for (const r of order.results) {
    for (const v of r.values) {
      const pName = v.parameter?.parameterName || "Parameter";
      const unit = v.parameter?.unit || "";
      const val = v.value || "—";
      const flag = v.flag || "NORMAL";
      paramSummaries.push(`- ${pName}: ${val} ${unit} [Flag: ${flag}]`);
      testResultsForFallback.push({
        testName: pName,
        value: val,
        unit,
        flag,
        referenceRange: "Standard reference range",
      });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.length > 10 && !apiKey.startsWith("YOUR_")) {
    try {
      const prompt = `You are a Board-Certified Consultant Pathologist AI assistant in an ISO 15189 NABL accredited diagnostic healthcare laboratory in India.
Analyze the following clinical diagnostic test results for this patient:
Patient Demographics:
- Age: ${age} years
- Gender: ${gender}

Analyzed Laboratory Parameters:
${paramSummaries.join("\n")}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Concise 2-3 sentence clinical diagnostic summary of findings",
  "differentialDiagnosis": ["Condition A", "Condition B", "Condition C"],
  "clinicalCorrelations": ["Clinical correlation note 1", "Clinical correlation note 2"],
  "riskCategory": "NORMAL" | "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK" | "CRITICAL_EMERGENCY",
  "recommendedActions": ["Immediate action or follow-up 1", "Action 2"],
  "icd10Suggestions": [{"code": "ICD Code", "title": "Condition Description"}]
}`;

      // Call Google Gemini REST API (v1beta)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          const parsed = JSON.parse(candidateText);
          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientUhid: patient.uhid,
            summary: parsed.summary || "Clinical diagnostic analysis completed.",
            differentialDiagnosis: parsed.differentialDiagnosis || [],
            clinicalCorrelations: parsed.clinicalCorrelations || [],
            riskCategory: parsed.riskCategory || "MODERATE_RISK",
            recommendedActions: parsed.recommendedActions || [],
            icd10Suggestions: parsed.icd10Suggestions || [],
            source: "GEMINI_LIVE_AI",
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (geminiErr: any) {
      console.warn("[GeminiService] Live Gemini API call fallback to rule engine:", geminiErr?.message);
    }
  }

  // Clinical Rule-Based Fallback
  const smartReport = await generateSmartReport({
    uhid: patient.uhid,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientAge: age,
    patientGender: gender === "FEMALE" ? "FEMALE" : "MALE",
    department: "Clinical Pathology & Biochemistry",
    testResults: testResultsForFallback,
    clinicalHistory: "General diagnostic workup",
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientUhid: patient.uhid,
    summary: smartReport.narrativeSummary,
    differentialDiagnosis: smartReport.criticalFindings.length > 0 ? ["Acute Critical Investigation Required", "Metabolic Anomaly"] : ["Normal Physiological Function"],
    clinicalCorrelations: [smartReport.clinicalImpression],
    riskCategory: smartReport.reportGrade === "CRITICAL" ? "CRITICAL_EMERGENCY" : smartReport.reportGrade === "SIGNIFICANT_ABNORMAL" ? "HIGH_RISK" : "NORMAL",
    recommendedActions: smartReport.recommendations,
    icd10Suggestions: smartReport.autoIcd10Codes.map((c) => ({ code: c.code, title: c.description })),
    source: "CLINICAL_RULE_FALLBACK",
    generatedAt: new Date().toISOString(),
  };
}
