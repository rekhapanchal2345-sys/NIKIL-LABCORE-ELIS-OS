const fs = require('fs');

const content = fs.readFileSync('src/services/ai/clinicalNlpEngine.js', 'utf8');

const searchBlock = `  // 7. REAL-WORLD CLINICAL RISK & REGRESSION SCORING SUITE
  // ──────────────────────────────────────────────────────────────────────────
  static computeClinicalRiskScores(textLower, entities, loincMatches) {
    // 1. Charlson Comorbidity Index (CCI)
    let cci = 0;
    if (textLower.includes("myocardial infarction") || textLower.includes("heart attack") || textLower.includes("stemi")) cci += 1;
    if (textLower.includes("heart failure") || textLower.includes("chf")) cci += 1;
    if (textLower.includes("peripheral vascular") || textLower.includes("peripheral neuropathy")) cci += 1;
    if (textLower.includes("stroke") || textLower.includes("cerebrovascular") || textLower.includes("hemiparesis")) cci += 1;
    if (textLower.includes("diabetes") && !textLower.includes("neuropathy") && !textLower.includes("nephropathy")) cci += 1;
    if (textLower.includes("diabetes") && (textLower.includes("neuropathy") || textLower.includes("nephropathy"))) cci += 2;
    if (textLower.includes("ckd") || textLower.includes("renal disease") || textLower.includes("creatinine")) cci += 2;
    if (textLower.includes("metastatic") || textLower.includes("lymph node")) cci += 6;

    const estimated10YrSurvival = Math.max(12, Math.round(100 - cci * 11.5));

    // 2. TIMI Risk Score (for STEMI and NSTEMI)
    let timiScore = 0;
    if (textLower.includes("chest pain") || textLower.includes("angina")) timiScore += 1;
    if (loincMatches.some(l => l.code === "10839-9" && (l.isPanic || l.extractedValue > 0.04))) timiScore += 1;
    if (textLower.includes("aspirin")) timiScore += 1;
    if (textLower.includes("st elevation") || textLower.includes("stemi")) timiScore += 1;
    if (textLower.includes("hypertension") || textLower.includes("diabetes")) timiScore += 1;

    // 3. KDIGO CKD Staging & eGFR Evaluation
    let kdigoStage = "G1 (Normal / High eGFR >= 90 mL/min)";
    let egfrValue = 95;
    const creatMatch = loincMatches.find(l => l.code === "2160-0");
    if (creatMatch && creatMatch.extractedValue) {
      const cr = creatMatch.extractedValue;
      if (cr >= 3.0) {
        kdigoStage = "G4-G5 (Severe CKD / Kidney Failure, eGFR < 20)";
        egfrValue = 18;
      } else if (cr >= 2.0) {
        kdigoStage = "G3b-G4 (Moderate to Severe CKD, eGFR 20-35)";
        egfrValue = 28;
      } else if (cr >= 1.4) {
        kdigoStage = "G3a (Mild to Moderate CKD, eGFR 36-59)";
        egfrValue = 48;
      } else {
        kdigoStage = "G1-G2 (Normal to Mild CKD, eGFR >= 60)";
        egfrValue = 82;
      }
    } else if (textLower.includes("stage 4")) {
      kdigoStage = "G4 (Severe CKD, eGFR 15-29)";
      egfrValue = 22;
    } else if (textLower.includes("stage 3")) {
      kdigoStage = "G3 (Moderate CKD, eGFR 30-59)";
      egfrValue = 45;
    }

    // 4. Sepsis-3 SOFA & qSOFA Score
    let sofaScore = 0;
    let qSofaScore = 0;
    if (textLower.includes("septic shock") || textLower.includes("noradrenaline") || textLower.includes("norepinephrine")) sofaScore += 8;
    else if (textLower.includes("sepsis") || textLower.includes("procalcitonin")) sofaScore += 4;
    else sofaScore = 1;

    if (textLower.includes("tachypne") || textLower.includes("rr 2") || textLower.includes("rr 3")) qSofaScore += 1;
    if (textLower.includes("hypotension") || textLower.includes("78/") || textLower.includes("80/")) qSofaScore += 1;
    if (textLower.includes("altered mental") || textLower.includes("sensorium") || textLower.includes("toxic")) qSofaScore += 1;

    // 5. CHA2DS2-VASc Atrial Fibrillation Stroke Risk (ESC / AHA Guidelines)
    let cha2ds2Vasc = 0;
    // Age detection
    const ageMatch = /(\d{1,2})\s*(?:yo|y\/o|-year-old|year old|years old)/i.exec(textLower);
    const parsedAge = ageMatch ? parseInt(ageMatch[1], 10) : 60;
    if (parsedAge >= 75) cha2ds2Vasc += 2;
    else if (parsedAge >= 65) cha2ds2Vasc += 1;

    if (textLower.includes("heart failure") || textLower.includes("chf")) cha2ds2Vasc += 1;
    if (textLower.includes("hypertension") || textLower.includes("htn")) cha2ds2Vasc += 1;
    if (textLower.includes("diabetes") || textLower.includes("t2d")) cha2ds2Vasc += 1;
    if (textLower.includes("stroke") || textLower.includes("cerebral infarction") || textLower.includes("hemiparesis")) cha2ds2Vasc += 2;
    if (textLower.includes("stemi") || textLower.includes("myocardial infarction") || textLower.includes("vascular")) cha2ds2Vasc += 1;
    if (textLower.includes("female") || textLower.includes("woman")) cha2ds2Vasc += 1;

    // 6. HAS-BLED Bleeding Risk Score
    let hasBled = 0;
    if (textLower.includes("hypertension") || textLower.includes("bp 17") || textLower.includes("bp 18")) hasBled += 1;
    if (textLower.includes("ckd") || textLower.includes("creatinine") || textLower.includes("kidney injury")) hasBled += 1;
    if (textLower.includes("stroke") || textLower.includes("cerebrovascular")) hasBled += 1;
    if (textLower.includes("aspirin") || textLower.includes("clopidogrel") || textLower.includes("antiplatelet") || textLower.includes("nsaid")) hasBled += 1;
    if (parsedAge > 65) hasBled += 1;

    // 7. CURB-65 Pneumonia Severity Score
    let curb65 = 0;
    if (textLower.includes("altered") || textLower.includes("confusion")) curb65 += 1;
    if (textLower.includes("creatinine") || textLower.includes("bun")) curb65 += 1;
    if (textLower.includes("tachypne") || textLower.includes("rr ") || textLower.includes("58/min")) curb65 += 1;
    if (textLower.includes("hypotension") || textLower.includes("78/")) curb65 += 1;

    return {`;

const replaceBlock = `  // 7. REAL-WORLD CLINICAL RISK & REGRESSION SCORING SUITE
  // ──────────────────────────────────────────────────────────────────────────
  static _computeCCI(textLower) {
    let cci = 0;
    if (textLower.includes("myocardial infarction") || textLower.includes("heart attack") || textLower.includes("stemi")) cci += 1;
    if (textLower.includes("heart failure") || textLower.includes("chf")) cci += 1;
    if (textLower.includes("peripheral vascular") || textLower.includes("peripheral neuropathy")) cci += 1;
    if (textLower.includes("stroke") || textLower.includes("cerebrovascular") || textLower.includes("hemiparesis")) cci += 1;
    if (textLower.includes("diabetes") && !textLower.includes("neuropathy") && !textLower.includes("nephropathy")) cci += 1;
    if (textLower.includes("diabetes") && (textLower.includes("neuropathy") || textLower.includes("nephropathy"))) cci += 2;
    if (textLower.includes("ckd") || textLower.includes("renal disease") || textLower.includes("creatinine")) cci += 2;
    if (textLower.includes("metastatic") || textLower.includes("lymph node")) cci += 6;
    return cci;
  }

  static _computeTIMIScore(textLower, loincMatches) {
    let timiScore = 0;
    if (textLower.includes("chest pain") || textLower.includes("angina")) timiScore += 1;
    if (loincMatches.some(l => l.code === "10839-9" && (l.isPanic || l.extractedValue > 0.04))) timiScore += 1;
    if (textLower.includes("aspirin")) timiScore += 1;
    if (textLower.includes("st elevation") || textLower.includes("stemi")) timiScore += 1;
    if (textLower.includes("hypertension") || textLower.includes("diabetes")) timiScore += 1;
    return timiScore;
  }

  static _computeKDIGO(textLower, loincMatches) {
    let kdigoStage = "G1 (Normal / High eGFR >= 90 mL/min)";
    let egfrValue = 95;
    const creatMatch = loincMatches.find(l => l.code === "2160-0");
    if (creatMatch && creatMatch.extractedValue) {
      const cr = creatMatch.extractedValue;
      if (cr >= 3.0) {
        kdigoStage = "G4-G5 (Severe CKD / Kidney Failure, eGFR < 20)";
        egfrValue = 18;
      } else if (cr >= 2.0) {
        kdigoStage = "G3b-G4 (Moderate to Severe CKD, eGFR 20-35)";
        egfrValue = 28;
      } else if (cr >= 1.4) {
        kdigoStage = "G3a (Mild to Moderate CKD, eGFR 36-59)";
        egfrValue = 48;
      } else {
        kdigoStage = "G1-G2 (Normal to Mild CKD, eGFR >= 60)";
        egfrValue = 82;
      }
    } else if (textLower.includes("stage 4")) {
      kdigoStage = "G4 (Severe CKD, eGFR 15-29)";
      egfrValue = 22;
    } else if (textLower.includes("stage 3")) {
      kdigoStage = "G3 (Moderate CKD, eGFR 30-59)";
      egfrValue = 45;
    }
    return { kdigoStage, egfrValue };
  }

  static _computeSOFA(textLower) {
    let sofaScore = 0;
    let qSofaScore = 0;
    if (textLower.includes("septic shock") || textLower.includes("noradrenaline") || textLower.includes("norepinephrine")) sofaScore += 8;
    else if (textLower.includes("sepsis") || textLower.includes("procalcitonin")) sofaScore += 4;
    else sofaScore = 1;

    if (textLower.includes("tachypne") || textLower.includes("rr 2") || textLower.includes("rr 3")) qSofaScore += 1;
    if (textLower.includes("hypotension") || textLower.includes("78/") || textLower.includes("80/")) qSofaScore += 1;
    if (textLower.includes("altered mental") || textLower.includes("sensorium") || textLower.includes("toxic")) qSofaScore += 1;
    return { sofaScore, qSofaScore };
  }

  static _parseAge(textLower) {
    const ageMatch = /(\d{1,2})\s*(?:yo|y\/o|-year-old|year old|years old)/i.exec(textLower);
    return ageMatch ? parseInt(ageMatch[1], 10) : 60;
  }

  static _computeCHA2DS2VASc(textLower, parsedAge) {
    let cha2ds2Vasc = 0;
    if (parsedAge >= 75) cha2ds2Vasc += 2;
    else if (parsedAge >= 65) cha2ds2Vasc += 1;

    if (textLower.includes("heart failure") || textLower.includes("chf")) cha2ds2Vasc += 1;
    if (textLower.includes("hypertension") || textLower.includes("htn")) cha2ds2Vasc += 1;
    if (textLower.includes("diabetes") || textLower.includes("t2d")) cha2ds2Vasc += 1;
    if (textLower.includes("stroke") || textLower.includes("cerebral infarction") || textLower.includes("hemiparesis")) cha2ds2Vasc += 2;
    if (textLower.includes("stemi") || textLower.includes("myocardial infarction") || textLower.includes("vascular")) cha2ds2Vasc += 1;
    if (textLower.includes("female") || textLower.includes("woman")) cha2ds2Vasc += 1;
    return cha2ds2Vasc;
  }

  static _computeHASBLED(textLower, parsedAge) {
    let hasBled = 0;
    if (textLower.includes("hypertension") || textLower.includes("bp 17") || textLower.includes("bp 18")) hasBled += 1;
    if (textLower.includes("ckd") || textLower.includes("creatinine") || textLower.includes("kidney injury")) hasBled += 1;
    if (textLower.includes("stroke") || textLower.includes("cerebrovascular")) hasBled += 1;
    if (textLower.includes("aspirin") || textLower.includes("clopidogrel") || textLower.includes("antiplatelet") || textLower.includes("nsaid")) hasBled += 1;
    if (parsedAge > 65) hasBled += 1;
    return hasBled;
  }

  static _computeCURB65(textLower) {
    let curb65 = 0;
    if (textLower.includes("altered") || textLower.includes("confusion")) curb65 += 1;
    if (textLower.includes("creatinine") || textLower.includes("bun")) curb65 += 1;
    if (textLower.includes("tachypne") || textLower.includes("rr ") || textLower.includes("58/min")) curb65 += 1;
    if (textLower.includes("hypotension") || textLower.includes("78/")) curb65 += 1;
    return curb65;
  }

  static computeClinicalRiskScores(textLower, entities, loincMatches) {
    const cci = this._computeCCI(textLower);
    const estimated10YrSurvival = Math.max(12, Math.round(100 - cci * 11.5));

    const timiScore = this._computeTIMIScore(textLower, loincMatches);
    const { kdigoStage, egfrValue } = this._computeKDIGO(textLower, loincMatches);
    const { sofaScore, qSofaScore } = this._computeSOFA(textLower);

    const parsedAge = this._parseAge(textLower);
    const cha2ds2Vasc = this._computeCHA2DS2VASc(textLower, parsedAge);
    const hasBled = this._computeHASBLED(textLower, parsedAge);

    const curb65 = this._computeCURB65(textLower);

    return {`;

const newContent = content.replace(searchBlock, replaceBlock);
fs.writeFileSync('src/services/ai/clinicalNlpEngine.js', newContent, 'utf8');
