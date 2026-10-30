/**
 * LABCORE AETHER-GENOMICS™ // 28-RULE ACMG/AMP BAYESIAN VARIANT INTERPRETATION ENGINE
 * 
 * Standards Compliance:
 * - Richards et al. 2015 (ACMG/AMP Standards and Guidelines for Sequence Variant Interpretation)
 * - Tavtigian et al. 2018 (Bayesian Formulation of the ACMG/AMP Variant Classification Framework)
 * - ClinGen Sequence Variant Interpretation (SVI) Working Group Refinements
 */

import {
    AcmgBayesianClassificationResult,
    AcmgClassificationVerdict,
    AcmgCriteriaCode,
    GenomicVariantInput
} from '../types/aether-genomics.types';

// =========================================================================
// 1. TAVTIGIAN BAYESIAN LIKELIHOOD RATIOS (LR) FOR ACMG STRENGTH LEVELS
// =========================================================================

// Base Odds Prior: 0.1 (corresponding to prior probability of pathogenicity ~0.0909)
const PRIOR_ODDS = 0.10;

// Standard Tavtigian Likelihood Ratios (exponent power based on strength step)
const CRITERIA_LIKELIHOOD_RATIOS: Record<AcmgCriteriaCode, number> = {
    // Pathogenic Very Strong: (18.7)^2 = ~350.0
    PVS1: 350.0,

    // Pathogenic Strong: 18.7
    PS1: 18.7,
    PS2: 18.7,
    PS3: 18.7,
    PS4: 18.7,

    // Pathogenic Moderate: sqrt(18.7) = 4.33
    PM1: 4.33,
    PM2: 4.33,
    PM3: 4.33,
    PM4: 4.33,
    PM5: 4.33,
    PM6: 4.33,

    // Pathogenic Supporting: (18.7)^0.25 = 2.08
    PP1: 2.08,
    PP2: 2.08,
    PP3: 2.08,
    PP4: 2.08,
    PP5: 2.08,

    // Benign Stand-Alone: Extremely high evidence against pathogenicity
    BA1: 0.0001,

    // Benign Strong: 1 / 18.7 = 0.0535
    BS1: 0.0535,
    BS2: 0.0535,
    BS3: 0.0535,
    BS4: 0.0535,

    // Benign Supporting: 1 / 2.08 = 0.4808
    BP1: 0.4808,
    BP2: 0.4808,
    BP3: 0.4808,
    BP4: 0.4808,
    BP5: 0.4808,
    BP6: 0.4808,
    BP7: 0.4808,
};

// =========================================================================
// 2. AUTOMATED VARIANT FEATURE-BASED CRITERIA DISCOVERY
// =========================================================================

export function autoDiscoverAcmgCriteria(variant: GenomicVariantInput): AcmgCriteriaCode[] {
    const metCriteria: Set<AcmgCriteriaCode> = new Set(variant.manuallyAssertedCriteria || []);

    // BA1: Allele frequency > 5% (0.05) in gnomAD
    if (variant.populationAlleleFrequencyGnomAd !== undefined) {
        if (variant.populationAlleleFrequencyGnomAd >= 0.05) {
            metCriteria.add('BA1');
        } else if (variant.populationAlleleFrequencyGnomAd >= 0.01) {
            metCriteria.add('BS1');
        } else if (variant.populationAlleleFrequencyGnomAd <= 0.00005) {
            // PM2: Absent from or extremely low frequency in controls (gnomAD)
            metCriteria.add('PM2');
        }
    }

    // PVS1: Null variant (nonsense, frameshift, canonical +/-1,2 splice sites, initiation codon)
    if (
        variant.variantType === 'NONSENSE' ||
        variant.variantType === 'FRAMESHIFT' ||
        variant.variantType === 'SPLICING'
    ) {
        metCriteria.add('PVS1');
    }

    // PP3 / BP4: In-silico computational evidence
    if (variant.inSilicoPathogenicityScores) {
        const scores = variant.inSilicoPathogenicityScores;
        let pathogenicVotes = 0;
        let benignVotes = 0;

        if (scores.caddPhred !== undefined) {
            if (scores.caddPhred >= 25.0) pathogenicVotes++;
            else if (scores.caddPhred < 15.0) benignVotes++;
        }
        if (scores.revel !== undefined) {
            if (scores.revel >= 0.75) pathogenicVotes++;
            else if (scores.revel < 0.25) benignVotes++;
        }
        if (scores.alphamissense !== undefined) {
            if (scores.alphamissense >= 0.80) pathogenicVotes++;
            else if (scores.alphamissense < 0.34) benignVotes++;
        }

        if (pathogenicVotes >= 2 && benignVotes === 0) {
            metCriteria.add('PP3');
        } else if (benignVotes >= 2 && pathogenicVotes === 0) {
            metCriteria.add('BP4');
        }
    }

    // PS2 / PM6: De novo confirmed variant
    if (variant.deNovoConfirmed) {
        metCriteria.add('PS2');
    }

    // PS3 / BS3: Well-established functional studies
    if (variant.functionalEvidenceAvailable) {
        // If variant is already known pathogenic in COSMIC or ClinVar
        if (variant.cosmicId || (variant.clinVarReviewStatus && variant.clinVarReviewStatus.includes('pathogenic'))) {
            metCriteria.add('PS3');
        }
    }

    return Array.from(metCriteria);
}

// =========================================================================
// 3. CLASSICAL ACMG RULE EVALUATOR
// =========================================================================

function evaluateClassicalAcmgRules(criteria: AcmgCriteriaCode[]): { rule: string; verdict: AcmgClassificationVerdict } {
    const pvs = criteria.filter(c => c === 'PVS1').length;
    const ps = criteria.filter(c => c.startsWith('PS')).length;
    const pm = criteria.filter(c => c.startsWith('PM')).length;
    const pp = criteria.filter(c => c.startsWith('PP')).length;

    const ba = criteria.filter(c => c === 'BA1').length;
    const bs = criteria.filter(c => c.startsWith('BS')).length;
    const bp = criteria.filter(c => c.startsWith('BP')).length;

    // Stand-alone benign
    if (ba >= 1) {
        return { rule: 'BA1 satisfied (Allele frequency > 5%)', verdict: 'BENIGN' };
    }

    // Classical Benign combinations
    if (bs >= 2 || (bs >= 1 && bp >= 2)) {
        return { rule: '>=2 Strong Benign OR 1 Strong + >=2 Supporting Benign', verdict: 'BENIGN' };
    }

    // Classical Pathogenic combinations
    if (
        (pvs >= 1 && ps >= 1) ||
        (pvs >= 1 && pm >= 2) ||
        (pvs >= 1 && pm >= 1 && pp >= 1) ||
        (pvs >= 1 && pp >= 2) ||
        (ps >= 2) ||
        (ps >= 1 && pm >= 3) ||
        (ps >= 1 && pm >= 2 && pp >= 2) ||
        (ps >= 1 && pm >= 1 && pp >= 4)
    ) {
        return { rule: 'Rigorous ACMG 2015 Pathogenic Combination Satisfied', verdict: 'PATHOGENIC' };
    }

    // Classical Likely Pathogenic combinations
    if (
        (pvs >= 1 && pm >= 1) ||
        (ps >= 1 && pm >= 1) ||
        (ps >= 1 && pp >= 2) ||
        (pm >= 3) ||
        (pm >= 2 && pp >= 2) ||
        (pm >= 1 && pp >= 4)
    ) {
        return { rule: 'ACMG 2015 Likely Pathogenic Combination Satisfied', verdict: 'LIKELY_PATHOGENIC' };
    }

    // Classical Likely Benign
    if ((bs >= 1 && bp >= 1) || (bp >= 2)) {
        return { rule: 'ACMG 2015 Likely Benign Combination Satisfied', verdict: 'LIKELY_BENIGN' };
    }

    return { rule: 'Criteria insufficient for definitive pathogenic or benign category', verdict: 'UNCERTAIN_SIGNIFICANCE' };
}

// =========================================================================
// 4. BAYESIAN POSTERIOR PROBABILITY & FINAL SYNTHESIS
// =========================================================================

export function classifyVariantBayesianAcmg(variant: GenomicVariantInput): AcmgBayesianClassificationResult {
    const satisfiedCriteria = autoDiscoverAcmgCriteria(variant);

    let combinedLikelihoodRatio = 1.0;
    const pathogenicMet: AcmgCriteriaCode[] = [];
    const benignMet: AcmgCriteriaCode[] = [];

    for (const code of satisfiedCriteria) {
        const lr = CRITERIA_LIKELIHOOD_RATIOS[code] || 1.0;
        combinedLikelihoodRatio *= lr;

        if (code.startsWith('P')) {
            pathogenicMet.push(code);
        } else {
            benignMet.push(code);
        }
    }

    // Posterior Odds = Prior Odds * Combined LR
    const posteriorOdds = PRIOR_ODDS * combinedLikelihoodRatio;

    // Posterior Probability P = O_post / (1 + O_post)
    const posteriorProbability = Number((posteriorOdds / (1.0 + posteriorOdds)).toFixed(4));

    // Determine verdict according to Tavtigian thresholds:
    // P >= 0.99 -> Pathogenic
    // 0.90 <= P < 0.99 -> Likely Pathogenic
    // 0.10 < P < 0.90 -> VUS
    // 0.05 <= P <= 0.10 -> Likely Benign
    // P < 0.05 -> Benign
    let bayesianVerdict: AcmgClassificationVerdict = 'UNCERTAIN_SIGNIFICANCE';
    if (posteriorProbability >= 0.99) {
        bayesianVerdict = 'PATHOGENIC';
    } else if (posteriorProbability >= 0.90) {
        bayesianVerdict = 'LIKELY_PATHOGENIC';
    } else if (posteriorProbability <= 0.05) {
        bayesianVerdict = 'BENIGN';
    } else if (posteriorProbability <= 0.10) {
        bayesianVerdict = 'LIKELY_BENIGN';
    } else {
        bayesianVerdict = 'UNCERTAIN_SIGNIFICANCE';
    }

    const classicalMatch = evaluateClassicalAcmgRules(satisfiedCriteria);

    let interpretation = `Genomic variant ${variant.gene} ${variant.hgvsCdna} (${variant.hgvsProtein}) classified as ${bayesianVerdict} with Bayesian posterior probability of ${posteriorProbability}.`;
    if (bayesianVerdict === 'PATHOGENIC' || bayesianVerdict === 'LIKELY_PATHOGENIC') {
        interpretation += ` Critical clinical relevance: Disease-causing variant. Actionable for genetic counseling and targeted therapeutic selection.`;
    } else if (bayesianVerdict === 'UNCERTAIN_SIGNIFICANCE') {
        interpretation += ` Insufficient current evidence to confirm or refute pathogenicity. Periodic reclassification recommended.`;
    }

    return {
        variantId: variant.variantId,
        hgvsCdna: variant.hgvsCdna,
        hgvsProtein: variant.hgvsProtein,
        gene: variant.gene,
        priorOdds: PRIOR_ODDS,
        combinedLikelihoodRatio: Number(combinedLikelihoodRatio.toFixed(3)),
        posteriorOdds: Number(posteriorOdds.toFixed(3)),
        posteriorProbability,
        verdict: bayesianVerdict,
        criteriaEvidenceSummary: {
            pathogenicCriteriaMet: pathogenicMet,
            benignCriteriaMet: benignMet
        },
        classicalRuleMatch: {
            ruleSatisfied: classicalMatch.rule,
            isConsistentWithBayesian: classicalMatch.verdict === bayesianVerdict
        },
        clinicalInterpretationText: interpretation
    };
}
