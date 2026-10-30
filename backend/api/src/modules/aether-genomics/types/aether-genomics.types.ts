/**
 * LABCORE AETHER-GENOMICS & NEURO-PATHOMICS NEXUS™
 * Core TypeScript Type Definitions & Clinical Genomics Data Structures
 * 
 * Standards Compliance:
 * - ACMG/AMP 2015 Standards and Guidelines for the Interpretation of Sequence Variants
 * - CPIC (Clinical Pharmacogenetics Implementation Consortium) & PharmGKB Guidelines
 * - DICOM Supplement 145 / Part 10 Whole Slide Microscopy (WSI)
 * - NABL ISO 15189:2022 & CAP LAP Molecular Pathology & Cytogenetics Standards
 * - GA4GH Phenopackets v2 & HL7 FHIR Genomics R4 Specification
 */

// =========================================================================
// 1. PHARMACOGENOMICS (PGx) TYPES & STAR-ALLELE DEFINITIONS
// =========================================================================

export type MetabolizerPhenotype =
    | 'POOR_METABOLIZER'          // PM
    | 'INTERMEDIATE_METABOLIZER'  // IM
    | 'NORMAL_METABOLIZER'        // NM (Extensive)
    | 'RAPID_METABOLIZER'         // RM
    | 'ULTRARAPID_METABOLIZER'    // UM
    | 'INDETERMINATE';

export type ToxicityRiskLevel =
    | 'LETHAL_CONTRAINDICATION'   // Critical safety gate: Drug administration must be blocked
    | 'HIGH_TOXICITY_RISK'        // Substantial adverse drug reaction / severe toxicity expected
    | 'MODERATE_ADJUSTMENT'       // Dose reduction or therapeutic drug monitoring required
    | 'STANDARD_DOSING'           // Normal population therapeutic index
    | 'INEFFICACY_RISK';          // Prodrug not activated or target receptor resistant

export interface StarAlleleDefinition {
    gene: string;
    allele: string;
    activityValue: number;
    definingVariants: string[];
    clinicalFunction: 'NORMAL_FUNCTION' | 'DECREASED_FUNCTION' | 'NO_FUNCTION' | 'INCREASED_FUNCTION' | 'UNKNOWN';
}

export interface PatientGenotypeInput {
    patientId: string;
    uhid: string;
    age: number;
    weightKg: number;
    heightCm: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    ancestry?: 'ASIAN' | 'BLACK' | 'CAUCASIAN' | 'OTHER';
    targetMedications: string[];
    amiodaroneConcomitant?: boolean;
    cypInducerConcomitant?: boolean;
    diplotypes: {
        gene: string;
        allele1: string;
        allele2: string;
        copyNumberVariation?: number; // E.g., for CYP2D6 gene duplications *1/*2xN (CNV = 3+)
    }[];
}

export interface PharmacogenomicEvaluationResult {
    gene: string;
    diplotype: string;
    activityScore: number;
    phenotype: MetabolizerPhenotype;
    recommendations: {
        drug: string;
        guidelineSource: 'CPIC' | 'PharmGKB' | 'DPWG' | 'FDA';
        evidenceLevel: 'LEVEL_A' | 'LEVEL_B' | 'LEVEL_C';
        riskLevel: ToxicityRiskLevel;
        clinicalSummary: string;
        doseAdjustmentInstruction: string;
        saferAlternativeMedications: string[];
    }[];
}

export interface WarfarinDosePrediction {
    estimatedWeeklyDoseMg: number;
    estimatedDailyDoseMg: number;
    algorithmUsed: 'IWPC_MULTIVARIATE_NONLINEAR' | 'GAGE_REGRESSION';
    confidenceInterval95: [number, number];
    pharmacokineticModifiers: {
        vkorc1ImpactPercentage: number;
        cyp2c9ImpactPercentage: number;
        clinicalCovariateImpactPercentage: number;
    };
    clinicalWarning: string;
}

// =========================================================================
// 2. ACMG/AMP 2015 28-RULE BAYESIAN VARIANT CLASSIFICATION TYPES
// =========================================================================

export type AcmgCriteriaCode =
    // Pathogenic Very Strong
    | 'PVS1'
    // Pathogenic Strong
    | 'PS1' | 'PS2' | 'PS3' | 'PS4'
    // Pathogenic Moderate
    | 'PM1' | 'PM2' | 'PM3' | 'PM4' | 'PM5' | 'PM6'
    // Pathogenic Supporting
    | 'PP1' | 'PP2' | 'PP3' | 'PP4' | 'PP5'
    // Benign Stand-Alone
    | 'BA1'
    // Benign Strong
    | 'BS1' | 'BS2' | 'BS3' | 'BS4'
    // Benign Supporting
    | 'BP1' | 'BP2' | 'BP3' | 'BP4' | 'BP5' | 'BP6' | 'BP7';

export type AcmgStrengthLevel =
    | 'VERY_STRONG'
    | 'STRONG'
    | 'MODERATE'
    | 'SUPPORTING'
    | 'STAND_ALONE';

export type AcmgClassificationVerdict =
    | 'PATHOGENIC'
    | 'LIKELY_PATHOGENIC'
    | 'UNCERTAIN_SIGNIFICANCE'  // VUS
    | 'LIKELY_BENIGN'
    | 'BENIGN';

export interface AcmgCriteriaEvaluation {
    code: AcmgCriteriaCode;
    direction: 'PATHOGENIC' | 'BENIGN';
    strength: AcmgStrengthLevel;
    likelihoodRatio: number;
    satisfied: boolean;
    evidenceNotes: string;
}

export interface GenomicVariantInput {
    variantId: string;
    gene: string;
    chromosome: string;
    position: number;
    refAllele: string;
    altAllele: string;
    hgvsCdna: string;     // E.g., c.1905+1G>A, c.2573T>G
    hgvsProtein: string;  // E.g., p.Leu858Arg, p.Val600Glu
    transcript: string;
    variantType: 'SNV' | 'INDEL' | 'SPLICING' | 'FRAMESHIFT' | 'NONSENSE' | 'MISSENSE' | 'SYNONYMOUS';
    populationAlleleFrequencyGnomAd?: number;
    inSilicoPathogenicityScores?: {
        caddPhred?: number;
        revel?: number;
        alphamissense?: number;
        sift?: number;
        polyphen2?: number;
    };
    functionalEvidenceAvailable?: boolean;
    deNovoConfirmed?: boolean;
    cosmicId?: string;
    clinVarReviewStatus?: string;
    manuallyAssertedCriteria?: AcmgCriteriaCode[];
}

export interface AcmgBayesianClassificationResult {
    variantId: string;
    hgvsCdna: string;
    hgvsProtein: string;
    gene: string;
    priorOdds: number;
    combinedLikelihoodRatio: number;
    posteriorOdds: number;
    posteriorProbability: number;
    verdict: AcmgClassificationVerdict;
    criteriaEvidenceSummary: {
        pathogenicCriteriaMet: AcmgCriteriaCode[];
        benignCriteriaMet: AcmgCriteriaCode[];
    };
    classicalRuleMatch: {
        ruleSatisfied: string;
        isConsistentWithBayesian: boolean;
    };
    clinicalInterpretationText: string;
}

// =========================================================================
// 3. WHOLE SLIDE IMAGING (WSI) & SPATIAL PATHOMICS TYPES
// =========================================================================

export interface WsiSlidePyramidMetadata {
    slideId: string;
    patientId: string;
    specimenBarcode: string;
    tissueOrigin: string;
    stainingType: 'HEMATOXYLIN_EOSIN' | 'IMMUNOHISTOCHEMISTRY_KI67' | 'HER2_NEU' | 'PD_L1';
    scanMagnification: '40X' | '20X';
    micronsPerPixel: number; // E.g., 0.25 um/px at 40X
    dimensions: {
        widthPixels: number;
        heightPixels: number;
    };
    pyramidLevels: {
        level: number;
        downsampleFactor: number;
        width: number;
        height: number;
        tileWidth: number;
        tileHeight: number;
    }[];
}

export interface SpatialPathomicsFeatureVector {
    slideId: string;
    totalTissueAreaMm2: number;
    tumorCellularityPercentage: number;
    mitoticCountPer10Hpf: number;
    mitoticDensityPerMm2: number;
    ki67ProliferationIndex: number; // 0 to 100%
    ki67HotspotDensityPerMm2: number;
    nottinghamHistologicScore: {
        tubuleFormationScore: 1 | 2 | 3;
        nuclearPleomorphismScore: 1 | 2 | 3;
        mitoticCountScore: 1 | 2 | 3;
        totalScore: number; // 3 to 9
        histologicGrade: 'GRADE_I_WELL_DIFFERENTIATED' | 'GRADE_II_MODERATELY_DIFFERENTIATED' | 'GRADE_III_POORLY_DIFFERENTIATED';
    };
    surgicalMarginClearanceMicrons: number;
    spatialDensityHeatmap: {
        gridX: number;
        gridY: number;
        cellDensity: number;
        ki67PositivityFraction: number;
        isHotspot: boolean;
    }[];
}

export interface WsiTileRenderRequest {
    slideId: string;
    level: number;
    tileX: number;
    tileY: number;
}

export interface WsiTileRenderResponse {
    slideId: string;
    level: number;
    tileX: number;
    tileY: number;
    pixelBounds: { x: number; y: number; width: number; height: number };
    segmentedObjects: {
        id: string;
        type: 'NEOPLASTIC_NUCLEUS' | 'MITOTIC_FIGURE' | 'STROMA' | 'LYMPHOCYTE';
        confidence: number;
        centroid: [number, number];
        isKi67Positive: boolean;
    }[];
    heatIntensity: number;
}

// =========================================================================
// 4. MOLECULAR TUMOR BOARD (MTB) & ONCOLOGY ACTIONABILITY TYPES
// =========================================================================

export type AmpAscoTier =
    | 'TIER_I_STRONG_CLINICAL_SIGNIFICANCE'       // FDA approved therapies for this indication
    | 'TIER_II_POTENTIAL_CLINICAL_SIGNIFICANCE'   // Off-label or investigational trials
    | 'TIER_III_UNCERTAIN_SIGNIFICANCE'           // Unknown or conflicting evidence
    | 'TIER_IV_BENIGN_LIKELY_BENIGN';

export interface TargetedTherapyMatch {
    biomarker: string;
    drugName: string;
    drugClass: string;
    indication: string;
    tier: AmpAscoTier;
    regulatoryApprovalStatus: 'FDA_EMA_APPROVED' | 'NCCN_RECOMMENDED' | 'CLINICAL_TRIAL_PHASE_3' | 'CLINICAL_TRIAL_PHASE_2';
    efficacySummary: string;
    resistanceAlterations: string[];
    resistanceDetectedInPatient: boolean;
    ongoingTrialNctIds: string[];
}

export interface MolecularTumorBoardConsensus {
    patientId: string;
    tumorPrimarySite: string;
    histologicSubtype: string;
    tumorMutationalBurdenMutMb: number; // TMB
    microsatelliteInstabilityStatus: 'MSI_HIGH' | 'MSS_STABLE' | 'MSI_INDETERMINATE';
    actionableAlterations: TargetedTherapyMatch[];
    contraindicatedTherapies: {
        drug: string;
        reason: string;
        resistanceMechanism: string;
    }[];
    pathologistClinicalImpression: string;
    recommendedNextGenerationTesting?: string[];
}

// =========================================================================
// 5. COMPREHENSIVE MULTI-OMICS DOSSIER & FHIR R4 EXPORT
// =========================================================================

export interface MultiOmicsDiagnosticDossier {
    dossierId: string;
    patientUhid: string;
    specimenBarcode: string;
    signedAt: string;
    pathologistLicenseNumber: string;
    digitalSignatureSha256: string;
    tamperEvidentSeal: string;
    pharmacogenomics: PharmacogenomicEvaluationResult[];
    warfarinPrescriptionModel?: WarfarinDosePrediction;
    genomicVariantsAcmg: AcmgBayesianClassificationResult[];
    pathomicsHistology: SpatialPathomicsFeatureVector;
    molecularTumorBoard: MolecularTumorBoardConsensus;
    fhirGenomicsR4Json: Record<string, any>;
    // Sovereign v7.0 Sub-Engine Outputs
    sovereignExtensions?: {
        phenoconversionPbpk?: PhenoconversionPbpkResult;
        autonomousBiophysics?: AutonomousBiophysicsResult[];
        wsiMicroenvironment?: WsiMicroenvironmentResult;
        subclonalEvolution?: SubclonalEvolutionResult;
        neoantigenVaccine?: MrnaVaccineDesignResult;
        ctdnaMrdKinetics?: CtdnaMrdKineticsResult;
        phenopacketsHpo?: PhenopacketsHpoResult;
    };
}

// =========================================================================
// 6. PHASE 1: PHENOCONVERSION & 7-ORGAN PBPK ODE SIMULATOR TYPES
// =========================================================================

export interface ConcomitantInhibitorInput {
    drugName: string;
    targetGene: string; // CYP2D6, CYP3A4, CYP2C19, DPYD
    plasmaConcentrationUm: number; // [I]
    inhibitionConstantKiUm: number; // Ki
    inhibitionType: 'COMPETITIVE' | 'NON_COMPETITIVE' | 'MECHANISM_BASED';
}

export interface PhenoconversionPbpkInput {
    patientId: string;
    uhid: string;
    targetDrug: string;
    targetGene: string;
    geneticActivityScore: number;
    concomitantMedications: ConcomitantInhibitorInput[];
    hepaticFibrosisGradeIshak?: number; // 0-6
    childPughClass?: 'A' | 'B' | 'C' | 'NONE';
    doseMg: number;
    infusionDurationHours?: number;
    simulationHours?: number;
}

export interface OrganConcentrationPoint {
    timeHours: number;
    plasmaConcentrationMgL: number;
    liverConcentrationMgL: number;
    kidneyConcentrationMgL: number;
    brainConcentrationMgL: number;
    tumorConcentrationMgL: number;
    activeToxicMetaboliteMgL: number;
}

export interface PhenoconversionPbpkResult {
    patientId: string;
    targetDrug: string;
    targetGene: string;
    geneticActivityScore: number;
    effectiveActivityScore: number;
    geneticPhenotype: MetabolizerPhenotype;
    effectivePhenotype: MetabolizerPhenotype;
    isPhenoconverted: boolean;
    phenoconversionSeverity: 'CRITICAL_LETHAL' | 'SIGNIFICANT_ADJUSTMENT' | 'MILD' | 'NONE';
    warningAlert: string;
    pbpkKinetics: {
        peakPlasmaConcentrationCmaxMgL: number;
        timeToCmaxTmaxHours: number;
        areaUnderCurveAuc48MgHL: number;
        tumorAccumulationAucRatio: number;
        activeMetaboliteAucRatio: number;
        toxicityThresholdMgL: number;
        isToxicityThresholdExceeded: boolean;
        timeAboveToxicThresholdHours: number;
        simulatedOrganProfiles: OrganConcentrationPoint[];
    };
    clinicalRecommendation: string;
}

// =========================================================================
// 7. PHASE 2: AUTONOMOUS VUS ELIMINATOR & BIOPHYSICAL STABILITY TYPES
// =========================================================================

export interface BiophysicalVariantInput {
    variantId: string;
    gene: string;
    chromosome: string;
    position: number;
    refAllele: string;
    altAllele: string;
    hgvsProtein: string;
    wildTypeAminoAcid?: string;
    mutantAminoAcid?: string;
    codonPosition?: number;
    isSpliceRegion?: boolean;
    spliceMotifDistance?: number;
    canonicalSpliceSequence?: string;
    mutantSpliceSequence?: string;
    baselinePriorOdds?: number;
    baselineLikelihoodRatio?: number;
}

export interface AutonomousBiophysicsResult {
    variantId: string;
    gene: string;
    hgvsProtein: string;
    granthamDistance: {
        score: number;
        category: 'CONSERVATIVE' | 'MODERATELY_RADICAL' | 'RADICAL';
        likelihoodRatio: number;
        satisfiesCriterion: 'BP4' | 'PP3' | 'NEUTRAL';
    };
    proteinFoldingDeltaDeltaG: {
        deltaDeltaGKcalMol: number;
        stabilityVerdict: 'HIGHLY_DESTABILIZING' | 'MODERATELY_DESTABILIZING' | 'NEUTRAL' | 'HYPER_STABILIZING';
        likelihoodRatio: number;
        structuralMechanism: string;
    };
    maxEntScanSpliceEntropy?: {
        wildTypeBitScore: number;
        mutantBitScore: number;
        deltaBitScore: number;
        crypticSpliceExonSkippingPredicted: boolean;
        likelihoodRatio: number;
    };
    bayesianResolution: {
        originalPosteriorProbability: number;
        originalVerdict: AcmgClassificationVerdict;
        autonomousBiophysicalLikelihoodRatio: number;
        resolvedPosteriorProbability: number;
        resolvedVerdict: AcmgClassificationVerdict;
        isVusEliminated: boolean;
        clinicalImpactVerdict: string;
    };
}

// =========================================================================
// 8. PHASE 3: RUIFROK DECONVOLUTION & DELAUNAY CELL GRAPH TYPES
// =========================================================================

export interface SpatialCellCentroid {
    id: string;
    xUm: number;
    yUm: number;
    cellType: 'TUMOR' | 'TIL_CD8' | 'STROMA' | 'MACROPHAGE';
    isPdL1Positive: boolean;
    stainOpticalDensity: {
        hematoxylin: number;
        eosin: number;
        dab: number;
    };
}

export interface WsiMicroenvironmentInput {
    slideId: string;
    patientId: string;
    tissueOrigin: string;
    roiDimensionsUm: { widthUm: number; heightUm: number };
    cells?: SpatialCellCentroid[];
    numSimulatedCellsIfEmpty?: number;
}

export interface DelaunayGraphEdge {
    sourceCellId: string;
    targetCellId: string;
    distanceUm: number;
    edgeType: 'TUMOR_TUMOR' | 'TIL_TIL' | 'TUMOR_TIL_INFILTRATION' | 'STROMA_BARRIER';
}

export interface WsiMicroenvironmentResult {
    slideId: string;
    totalCellsAnalyzed: number;
    ruifrokStainDeconvolution: {
        meanHematoxylinIntensity: number;
        meanEosinIntensity: number;
        meanDabIntensity: number;
        dabPositiveCellCount: number;
    };
    cellComposition: {
        tumorCount: number;
        tilCount: number;
        stromalCount: number;
        macrophageCount: number;
    };
    pdL1Scoring: {
        tumorProportionScoreTpsPercentage: number;
        combinedPositiveScoreCps: number;
        clinicalImmunoCheckpointEligibility: 'HIGH_RESPONSE_ELIGIBLE' | 'INTERMEDIATE_ELIGIBLE' | 'INELIGIBLE';
    };
    spatialTopologicalGraph: {
        delaunayEdgesCount: number;
        medianTumorToTilDistanceUm: number;
        meanMinimumDistanceUm: number;
        tmeArchitectureVerdict: 'IMMUNE_INFLAMED_HOT' | 'IMMUNE_EXCLUDED_PERITUMORAL' | 'IMMUNE_DESERT_COLD';
        ripleysKClusterMetric: number;
        stromalBarrierThicknessEstimateUm: number;
    };
    graphVisualizationSample: {
        nodes: SpatialCellCentroid[];
        edges: DelaunayGraphEdge[];
    };
}

// =========================================================================
// 9. PHASE 4: SUBCLONAL CLONALITY, HRD SCAR & LOTKA-VOLTERRA DYNAMICS TYPES
// =========================================================================

export interface MutationClonalityInput {
    gene: string;
    alteration: string;
    variantAlleleFrequencyVaf: number;
    localCopyNumber?: number;
    isTargetableDriver?: boolean;
    isKnownResistanceMutation?: boolean;
}

export interface SubclonalEvolutionInput {
    patientId: string;
    primaryDiagnosis: string;
    tumorPurity: number;
    overallPloidy?: number;
    mutations: MutationClonalityInput[];
    lossOfHeterozygosityLohCount?: number;
    telomericAllelicImbalanceTaiCount?: number;
    largeScaleStateTransitionsLstCount?: number;
    treatmentRegimen?: string;
    simulationDays?: number;
}

export interface LotkaVolterraTrajectoryPoint {
    day: number;
    sensitiveCloneFraction: number;
    resistantCloneFraction: number;
    totalTumorBurden: number;
    activeDrugConcentration: number;
}

export interface SubclonalEvolutionResult {
    patientId: string;
    tumorPurity: number;
    mutationsWithCcf: {
        gene: string;
        alteration: string;
        vaf: number;
        cancerCellFractionCcf: number;
        clonalityStatus: 'TRUNCAL_CLONAL' | 'SUBCLONAL_BRANCH';
        isTargetable: boolean;
        isResistanceDriver: boolean;
    }[];
    hrdGenomicScar: {
        lohCount: number;
        taiCount: number;
        lstCount: number;
        totalHrdScore: number;
        isHrdPositiveBrcaness: boolean;
        parpInhibitorEligibility: 'HIGH_SENSITIVITY_RECOMMENDED' | 'INTERMEDIATE' | 'NOT_INDICATED';
    };
    cosmicSignatureContributions: {
        signatureId: string;
        etiology: string;
        relativeContributionPercentage: number;
    }[];
    lotkaVolterraDynamics: {
        continuousMtdTimeToProgressionDays: number;
        adaptiveMetronomicTimeToProgressionDays: number;
        projectedProgressionFreeSurvivalGainDays: number;
        trajectory365Days: LotkaVolterraTrajectoryPoint[];
        evolutionaryRiskVerdict: string;
    };
}

// =========================================================================
// 10. PHASE 5: NEOANTIGEN MHC BINDING & mRNA VACCINE DESIGNER TYPES
// =========================================================================

export interface SomaticNeoantigenMutationInput {
    gene: string;
    mutation: string;
    wildTypePeptide: string;
    mutantPeptide: string;
    tpmExpression: number;
}

export interface NeoantigenVaccineInput {
    patientId: string;
    hlaClassIAlleles: string[];
    somaticMutations: SomaticNeoantigenMutationInput[];
    maxVaccineNeoantigens?: number;
}

export interface NeoantigenCandidate {
    gene: string;
    mutation: string;
    epitopeLength: number;
    mutantEpitopeSequence: string;
    wildTypeEpitopeSequence: string;
    bestBindingHlaAllele: string;
    mutantIc50Nm: number;
    wildTypeIc50Nm: number;
    differentialAgretopicityIndexDai: number;
    bindingAffinityCategory: 'STRONG_BINDER' | 'INTERMEDIATE_BINDER' | 'NON_BINDER';
    immunogenicityScore: number;
    selectedForVaccine: boolean;
}

export interface MrnaVaccineDesignResult {
    patientId: string;
    rankedNeoantigens: NeoantigenCandidate[];
    selectedEpitopesCount: number;
    engineeredMrnaConstruct: {
        constructId: string;
        totalNucleotideLength: number;
        codonAdaptationIndexCai: number;
        gcContentPercentage: number;
        cleavageLinkerUsed: string;
        fullCodonOptimizedMrnaSequence: string;
        domainArchitecture: {
            fivePrimeCapAndUtr: string;
            kozakSequence: string;
            signalPeptideLeader: string;
            concatenatedEpitopes: string;
            mitdTraffickingDomain: string;
            threePrimeUtrAndPolyA: string;
        };
    };
    manufacturabilityScore: number;
    stabilityNotes: string;
}

// =========================================================================
// 11. PHASE 6: SERIAL ctDNA LIQUID BIOPSY MRD & RELAPSE PREDICTOR TYPES
// =========================================================================

export interface CtdnaTimepointInput {
    timepointLabel: string;
    daysSinceSurgery: number;
    duplexSequencingDepth: number;
    mutantDuplexReadCount: number;
    plasmaVolumeMl: number;
}

export interface CtdnaMrdKineticsInput {
    patientId: string;
    tumorPrimarySite: string;
    baselineTumorDiameterCm?: number;
    timepoints: CtdnaTimepointInput[];
    backgroundErrorRate?: number;
}

export interface GompertzianTrajectoryPoint {
    day: number;
    projectedCtdnaCopiesPerMl: number;
    projectedTumorCellCount: number;
    isAboveRadiologicalThreshold: boolean;
}

export interface CtdnaMrdKineticsResult {
    patientId: string;
    currentMrdStatus: 'MRD_POSITIVE_RELAPSE_RISK' | 'MRD_NEGATIVE_MOLECULAR_REMISSION' | 'INDETERMINATE_LOW_DEPTH';
    pValPoissonBinomialSuppression: number;
    instantaneousGrowthRatePerDay: number;
    tumorDoublingTimeDays: number;
    predictedRadiologicalRelapseDays: number;
    clinicalLeadTimeAdvantageDays: number;
    projectedRelapseDateIso: string;
    gompertzianKinetics: {
        initialTumorCells: number;
        asymptoticCarryingCapacityCells: number;
        growthDecelerationAlpha: number;
        radiologicalDetectionCellThreshold: number;
        trajectoryProjectedDays: GompertzianTrajectoryPoint[];
    };
    clinicalOncologyAction: string;
}

// =========================================================================
// 12. PHASE 7: GA4GH PHENOPACKETS v2 & RARE DISEASE HPO DAG SOLVER TYPES
// =========================================================================

export interface PhenopacketsHpoInput {
    patientId: string;
    uhid: string;
    ageYears: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    clinicalHpoSymptoms: {
        hpoId: string;
        label: string;
        onsetAgeYears?: number;
    }[];
    candidateGenomicVariants: GenomicVariantInput[];
}

export interface HpoTermAnnotation {
    hpoId: string;
    label: string;
    informationContentIc: number;
    parentIds: string[];
}

export interface RankedDiseaseGeneResult {
    rank: number;
    gene: string;
    diseaseName: string;
    omimOrOrphaId: string;
    variantId: string;
    hgvsCdna: string;
    hgvsProtein: string;
    hpoSemanticSimilarityScore: number;
    acmgPriorPosterior: number;
    fusedBayesianPosteriorProbability: number;
    matchedPhenotypes: string[];
    isDiagnosticMatch: boolean;
}

export interface PhenopacketsHpoResult {
    patientId: string;
    symptomsEvaluatedCount: number;
    topRankedCandidate: RankedDiseaseGeneResult;
    rankedCandidateGenes: RankedDiseaseGeneResult[];
    diagnosticConfidenceVerdict: 'DEFINITIVE_MOLECULAR_DIAGNOSIS' | 'PROBABLE_DIAGNOSIS' | 'INCONCLUSIVE';
    ga4ghPhenopacketV2Json: Record<string, any>;
}

