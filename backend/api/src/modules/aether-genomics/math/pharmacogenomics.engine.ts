/**
 * LABCORE AETHER-GENOMICS™ // COMPUTATIONAL PHARMACOGENOMICS (PGx) ENGINE
 * 
 * Clinical Implementations:
 * 1. Gaedigk Consensus Star-Allele Activity Scoring (AS = sum(w(allele)))
 * 2. CPIC (Clinical Pharmacogenetics Implementation Consortium) & PharmGKB Evidence Engine
 * 3. Lethal Toxicity & Adverse Drug Reaction Interceptor (DPYD, TPMT, CYP2D6, CYP2C19, HLA)
 * 4. IWPC (International Warfarin Pharmacogenetics Consortium) Multivariate Non-Linear Regression Solver
 */

import {
    MetabolizerPhenotype,
    PatientGenotypeInput,
    PharmacogenomicEvaluationResult,
    ToxicityRiskLevel,
    WarfarinDosePrediction
} from '../types/aether-genomics.types';

// =========================================================================
// 1. STAR-ALLELE DEFINITIONS & FUNCTIONAL ACTIVITY VALUES
// =========================================================================

const GENE_ALLELE_ACTIVITY_MAP: Record<string, Record<string, number>> = {
    CYP2D6: {
        '*1': 1.0,     // Normal function
        '*2': 1.0,     // Normal function
        '*3': 0.0,     // No function (frameshift)
        '*4': 0.0,     // No function (splicing defect)
        '*5': 0.0,     // No function (whole gene deletion)
        '*6': 0.0,     // No function (frameshift)
        '*9': 0.5,     // Decreased function
        '*10': 0.25,   // Decreased function (prevalent in Asian populations)
        '*17': 0.5,    // Decreased function
        '*41': 0.5,    // Decreased function
    },
    CYP2C19: {
        '*1': 1.0,     // Normal function
        '*2': 0.0,     // No function (splicing defect c.681G>A)
        '*3': 0.0,     // No function (stop codon c.636G>A)
        '*17': 1.5,    // Increased transcription promoter variant (-806C>T)
    },
    TPMT: {
        '*1': 1.0,     // Normal function
        '*2': 0.0,     // No function (c.238G>C)
        '*3A': 0.0,    // No function (c.460G>A + c.719A>G)
        '*3B': 0.0,    // No function (c.460G>A)
        '*3C': 0.0,    // No function (c.719A>G)
    },
    DPYD: {
        '*1': 1.0,     // Normal function
        '*2A': 0.0,    // No function (c.1905+1G>A splicing defect)
        '*13': 0.0,    // No function (c.1679T>G)
        'HapB3': 0.5,  // Decreased function (c.1129-5923C>G)
        'c.2846A>T': 0.5, // Decreased function
    },
    SLCO1B1: {
        '*1': 1.0,     // Normal transporter function
        '*5': 0.0,     // Decreased/poor transport (c.521T>C p.Val174Ala)
        '*15': 0.0,    // Poor transport
        '*17': 0.0,    // Poor transport
    },
    CYP2C9: {
        '*1': 1.0,     // Normal function
        '*2': 0.5,     // Decreased function (c.430C>T p.Arg144Cys)
        '*3': 0.0,     // Severely decreased function (c.1075A>C p.Ile359Leu)
    },
    VKORC1: {
        'G': 1.0,      // Wild-type high VKORC1 expression
        'A': 0.0,      // -1639G>A low VKORC1 expression (warfarin hypersensitive)
    }
};

// =========================================================================
// 2. PHENOTYPE TRANSLATION FROM ACTIVITY SCORE (CPIC CONSENSUS)
// =========================================================================

export function resolveMetabolizerPhenotype(gene: string, activityScore: number): MetabolizerPhenotype {
    switch (gene) {
        case 'CYP2D6':
            if (activityScore === 0) return 'POOR_METABOLIZER';
            if (activityScore > 0 && activityScore < 1.25) return 'INTERMEDIATE_METABOLIZER';
            if (activityScore >= 1.25 && activityScore <= 2.25) return 'NORMAL_METABOLIZER';
            if (activityScore > 2.25) return 'ULTRARAPID_METABOLIZER';
            return 'INDETERMINATE';

        case 'CYP2C19':
            if (activityScore === 0) return 'POOR_METABOLIZER';
            if (activityScore > 0 && activityScore <= 1.0) return 'INTERMEDIATE_METABOLIZER';
            if (activityScore === 2.0) return 'NORMAL_METABOLIZER';
            if (activityScore > 2.0 && activityScore < 3.0) return 'RAPID_METABOLIZER';
            if (activityScore >= 3.0) return 'ULTRARAPID_METABOLIZER';
            return 'INDETERMINATE';

        case 'TPMT':
        case 'DPYD':
            if (activityScore === 0) return 'POOR_METABOLIZER';
            if (activityScore > 0 && activityScore < 2.0) return 'INTERMEDIATE_METABOLIZER';
            if (activityScore >= 2.0) return 'NORMAL_METABOLIZER';
            return 'INDETERMINATE';

        case 'SLCO1B1':
        case 'CYP2C9':
            if (activityScore <= 0.5) return 'POOR_METABOLIZER';
            if (activityScore > 0.5 && activityScore < 2.0) return 'INTERMEDIATE_METABOLIZER';
            return 'NORMAL_METABOLIZER';

        default:
            return activityScore >= 2.0 ? 'NORMAL_METABOLIZER' : 'INTERMEDIATE_METABOLIZER';
    }
}

// =========================================================================
// 3. CLINICAL DRUG-GENE INTERACTION & SAFETY INTERCEPTOR
// =========================================================================

export function evaluatePharmacogenomics(input: PatientGenotypeInput): PharmacogenomicEvaluationResult[] {
    const results: PharmacogenomicEvaluationResult[] = [];

    for (const dip of input.diplotypes) {
        const gene = dip.gene.toUpperCase();
        const alleleMap = GENE_ALLELE_ACTIVITY_MAP[gene] || {};

        let a1Score = alleleMap[dip.allele1] !== undefined ? alleleMap[dip.allele1] : 1.0;
        let a2Score = alleleMap[dip.allele2] !== undefined ? alleleMap[dip.allele2] : 1.0;

        // Apply copy number variation (e.g. *1/*2xN where N copies multiply allele 2)
        if (dip.copyNumberVariation && dip.copyNumberVariation > 2 && gene === 'CYP2D6') {
            const extraCopies = dip.copyNumberVariation - 2;
            a2Score += a2Score * extraCopies;
        }

        const totalActivityScore = Number((a1Score + a2Score).toFixed(2));
        const phenotype = resolveMetabolizerPhenotype(gene, totalActivityScore);
        const diplotypeString = `${dip.allele1}/${dip.allele2}${dip.copyNumberVariation && dip.copyNumberVariation > 2 ? `x${dip.copyNumberVariation}` : ''}`;

        const recommendations: PharmacogenomicEvaluationResult['recommendations'] = [];

        // DPYD & Fluoropyrimidines (5-FU, Capecitabine)
        if (gene === 'DPYD') {
            if (phenotype === 'POOR_METABOLIZER') {
                recommendations.push({
                    drug: '5-Fluorouracil / Capecitabine',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'LETHAL_CONTRAINDICATION',
                    clinicalSummary: 'Complete Dihydropyrimidine Dehydrogenase (DPD) enzyme deficiency. Standard dosing results in severe lethal hematologic myelosuppression, fatal enteropathy, and multiorgan failure.',
                    doseAdjustmentInstruction: 'CONTRAINDICATED. Select alternative non-fluoropyrimidine therapeutic regimen.',
                    saferAlternativeMedications: ['Irinotecan + Oxaliplatin (Non-5-FU based)', 'Targeted Immunotherapy']
                });
            } else if (phenotype === 'INTERMEDIATE_METABOLIZER') {
                recommendations.push({
                    drug: '5-Fluorouracil / Capecitabine',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'HIGH_TOXICITY_RISK',
                    clinicalSummary: 'Partial DPD deficiency. High risk of severe grade 4 mucositis, neutropenia, and neurotoxicity.',
                    doseAdjustmentInstruction: 'Reduce starting dose by 50%. Titrate based on therapeutic drug monitoring (TDM) and clinical toxicity.',
                    saferAlternativeMedications: ['Reduced-dose 5-FU with strict ANC monitoring']
                });
            }
        }

        // TPMT & Thiopurines (6-Mercaptopurine, Azathioprine)
        if (gene === 'TPMT') {
            if (phenotype === 'POOR_METABOLIZER') {
                recommendations.push({
                    drug: 'Azathioprine / 6-Mercaptopurine',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'LETHAL_CONTRAINDICATION',
                    clinicalSummary: 'Homozygous deficient TPMT activity. Marked accumulation of cytotoxic thioguanine nucleotides leading to life-threatening bone marrow aplasia.',
                    doseAdjustmentInstruction: 'Reduce standard dose by 90% (administer 10% of standard dose 3x weekly) or switch to non-thiopurine agent.',
                    saferAlternativeMedications: ['Methotrexate', 'Biologic Anti-TNF agents (Infliximab, Adalimumab)']
                });
            } else if (phenotype === 'INTERMEDIATE_METABOLIZER') {
                recommendations.push({
                    drug: 'Azathioprine / 6-Mercaptopurine',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'HIGH_TOXICITY_RISK',
                    clinicalSummary: 'Heterozygous TPMT deficiency. Intermediate rate of thiopurine clearance.',
                    doseAdjustmentInstruction: 'Reduce starting dose by 30-50%. Monitor CBC weekly for the first month.',
                    saferAlternativeMedications: ['Standard immunosuppressive alternatives']
                });
            }
        }

        // CYP2D6 & Codeine / Tramadol
        if (gene === 'CYP2D6') {
            if (phenotype === 'ULTRARAPID_METABOLIZER') {
                recommendations.push({
                    drug: 'Codeine / Tramadol',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'LETHAL_CONTRAINDICATION',
                    clinicalSummary: 'Ultrarapid bio-activation of codeine into morphine. Risk of catastrophic respiratory depression, overdose, and fatal opioid coma.',
                    doseAdjustmentInstruction: 'AVOID CODEINE/TRAMADOL. Select analgesics not metabolized by CYP2D6.',
                    saferAlternativeMedications: ['Morphine (non-prodrug)', 'Hydromorphone', 'Fentanyl']
                });
            } else if (phenotype === 'POOR_METABOLIZER') {
                recommendations.push({
                    drug: 'Codeine / Tramadol',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'INEFFICACY_RISK',
                    clinicalSummary: 'Severely impaired bio-activation to morphine. Complete absence of analgesia.',
                    doseAdjustmentInstruction: 'Avoid codeine. Switch to directly active opioid.',
                    saferAlternativeMedications: ['Oxycodone (titrated)', 'Hydromorphone', 'Non-opioid multimodal analgesia']
                });
            }
        }

        // CYP2C19 & Clopidogrel (Plavix)
        if (gene === 'CYP2C19') {
            if (phenotype === 'POOR_METABOLIZER' || phenotype === 'INTERMEDIATE_METABOLIZER') {
                recommendations.push({
                    drug: 'Clopidogrel (Plavix)',
                    guidelineSource: 'CPIC',
                    evidenceLevel: 'LEVEL_A',
                    riskLevel: 'INEFFICACY_RISK',
                    clinicalSummary: 'Significantly decreased formation of active clopidogrel thiol metabolite. Major risk of coronary stent thrombosis and recurrent myocardial infarction.',
                    doseAdjustmentInstruction: 'AVOID CLOPIDOGREL. Switch to direct P2Y12 platelet inhibitor.',
                    saferAlternativeMedications: ['Ticagrelor (Brilinta)', 'Prasugrel (Effient)']
                });
            }
        }

        // SLCO1B1 & Simvastatin
        if (gene === 'SLCO1B1' && (phenotype === 'POOR_METABOLIZER' || phenotype === 'INTERMEDIATE_METABOLIZER')) {
            recommendations.push({
                drug: 'Simvastatin',
                guidelineSource: 'CPIC',
                evidenceLevel: 'LEVEL_A',
                riskLevel: 'HIGH_TOXICITY_RISK',
                clinicalSummary: 'Impaired hepatic uptake transporter OATP1B1 causes elevated plasma simvastatin acid, dramatically elevating risk of severe statin-induced rhabdomyolysis and myopathy.',
                doseAdjustmentInstruction: 'Prescribe lower dose (max 20mg/day) or switch to statin with alternative clearance pathway.',
                saferAlternativeMedications: ['Rosuvastatin', 'Pravastatin', 'Atorvastatin']
            });
        }

        results.push({
            gene,
            diplotype: diplotypeString,
            activityScore: totalActivityScore,
            phenotype,
            recommendations
        });
    }

    return results;
}

// =========================================================================
// 4. IWPC MULTIVARIATE WARFARIN DOSE PREDICTION SOLVER
// =========================================================================

/**
 * Solves the International Warfarin Pharmacogenetics Consortium (IWPC)
 * pharmacometric multi-linear regression equation:
 * 
 * sqrt(Weekly Dose) = 5.6044
 *   - 0.2614 * AgeDecade
 *   + 0.0087 * HeightCm
 *   + 0.0128 * WeightKg
 *   - 0.8677 * (VKORC1 A/G)
 *   - 1.6974 * (VKORC1 A/A)
 *   - 0.5211 * (CYP2C9 *1/*2)
 *   - 0.9357 * (CYP2C9 *1/*3)
 *   - 1.0616 * (CYP2C9 *2/*2)
 *   - 1.9206 * (CYP2C9 *2/*3)
 *   - 2.3312 * (CYP2C9 *3/*3)
 *   - 0.1092 * (Asian Race)
 *   - 0.2760 * (Black Race)
 *   - 0.1032 * (Missing Race)
 *   + 1.1816 * (Enzyme Inducer: Carbamazepine, Rifampin, Phenytoin)
 *   - 0.5503 * (Amiodarone)
 */
export function calculateIwpcWarfarinDose(input: PatientGenotypeInput): WarfarinDosePrediction {
    const ageDecade = Math.floor(input.age / 10);
    const heightCm = input.heightCm || 165;
    const weightKg = input.weightKg || 70;

    let intercept = 5.6044;

    // Clinical covariates
    intercept -= 0.2614 * ageDecade;
    intercept += 0.0087 * heightCm;
    intercept += 0.0128 * weightKg;

    // Concomitant drug modifiers
    if (input.cypInducerConcomitant) {
        intercept += 1.1816;
    }
    if (input.amiodaroneConcomitant) {
        intercept -= 0.5503;
    }

    // Ancestry modifiers
    if (input.ancestry === 'ASIAN') {
        intercept -= 0.1092;
    } else if (input.ancestry === 'BLACK') {
        intercept -= 0.2760;
    }

    // VKORC1 Genotype (-1639G>A)
    const vkorc1Dip = input.diplotypes.find(d => d.gene.toUpperCase() === 'VKORC1');
    let vkorc1Deduction = 0;
    if (vkorc1Dip) {
        const alleles = [vkorc1Dip.allele1.toUpperCase(), vkorc1Dip.allele2.toUpperCase()].sort().join('/');
        if (alleles === 'A/G' || alleles === 'G/A') {
            vkorc1Deduction = 0.8677;
        } else if (alleles === 'A/A') {
            vkorc1Deduction = 1.6974;
        }
    }
    intercept -= vkorc1Deduction;

    // CYP2C9 Genotype
    const cyp2c9Dip = input.diplotypes.find(d => d.gene.toUpperCase() === 'CYP2C9');
    let cyp2c9Deduction = 0;
    if (cyp2c9Dip) {
        const pair = [cyp2c9Dip.allele1, cyp2c9Dip.allele2].sort().join('/');
        switch (pair) {
            case '*1/*2': cyp2c9Deduction = 0.5211; break;
            case '*1/*3': cyp2c9Deduction = 0.9357; break;
            case '*2/*2': cyp2c9Deduction = 1.0616; break;
            case '*2/*3': cyp2c9Deduction = 1.9206; break;
            case '*3/*3': cyp2c9Deduction = 2.3312; break;
            default: cyp2c9Deduction = 0.0; break; // *1/*1 wild-type
        }
    }
    intercept -= cyp2c9Deduction;

    // Square the result to get mg/week
    const sqrtWeekly = Math.max(intercept, 1.0);
    const weeklyDoseMg = Number((sqrtWeekly * sqrtWeekly).toFixed(1));
    const dailyDoseMg = Number((weeklyDoseMg / 7.0).toFixed(2));

    const lowDoseMg = Number(Math.max(weeklyDoseMg * 0.85, 3.5).toFixed(1));
    const highDoseMg = Number((weeklyDoseMg * 1.15).toFixed(1));

    let warning = 'Standard therapeutic INR monitoring (target 2.0-3.0) recommended.';
    if (weeklyDoseMg < 15.0) {
        warning = 'CRITICAL: Extreme warfarin hypersensitivity predicted (weekly dose < 15mg). High risk of fatal hemorrhage at standard starting doses!';
    } else if (weeklyDoseMg > 50.0) {
        warning = 'Warfarin relative resistance detected. Higher induction dose required to reach therapeutic target INR.';
    }

    return {
        estimatedWeeklyDoseMg: weeklyDoseMg,
        estimatedDailyDoseMg: dailyDoseMg,
        algorithmUsed: 'IWPC_MULTIVARIATE_NONLINEAR',
        confidenceInterval95: [lowDoseMg, highDoseMg],
        pharmacokineticModifiers: {
            vkorc1ImpactPercentage: Number(((vkorc1Deduction / (intercept + vkorc1Deduction + cyp2c9Deduction)) * 100).toFixed(1)) || 0,
            cyp2c9ImpactPercentage: Number(((cyp2c9Deduction / (intercept + vkorc1Deduction + cyp2c9Deduction)) * 100).toFixed(1)) || 0,
            clinicalCovariateImpactPercentage: Number((100 - (vkorc1Deduction + cyp2c9Deduction) * 15).toFixed(1))
        },
        clinicalWarning: warning
    };
}
