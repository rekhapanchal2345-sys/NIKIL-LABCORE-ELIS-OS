/**
 * LABCORE AETHER-GENOMICS™ v7.0.0-SOVEREIGN
 * Sub-Engine 7: GA4GH Phenopackets v2 & Rare Disease HPO Semantic Graph DAG Solver
 * 
 * Biophysical Mathematics:
 * - Directed Acyclic Graph (DAG) Taxonomic Hierarchy of Human Phenotype Ontology (HPO)
 * - Resnik Information Content IC(c) = -ln(p(c))
 * - Lin Semantic Similarity Sim_Lin(t1, t2) = [2 * IC(MICA)] / [IC(t1) + IC(t2)]
 * - Bayesian Phenotype-Genotype Fusion: P(Causal | Var, HPO) ~ P_ACMG * exp(gamma * Sim_HPO)
 * - Standardized GA4GH Phenopackets v2 Schema Emission
 */

import {
    GenomicVariantInput,
    HpoTermAnnotation,
    PhenopacketsHpoInput,
    PhenopacketsHpoResult,
    RankedDiseaseGeneResult
} from '../types/aether-genomics.types';

export class PhenopacketsHpoDagEngine {

    // Human Phenotype Ontology terms graph with Resnik Information Content (IC) and ancestor links
    private static readonly HPO_DAG: Record<string, HpoTermAnnotation> = {
        'HP:0000118': { hpoId: 'HP:0000118', label: 'Phenotypic abnormality', informationContentIc: 0.1, parentIds: [] },
        'HP:0000707': { hpoId: 'HP:0000707', label: 'Abnormality of the nervous system', informationContentIc: 1.8, parentIds: ['HP:0000118'] },
        'HP:0001250': { hpoId: 'HP:0001250', label: 'Seizures', informationContentIc: 4.8, parentIds: ['HP:0000707'] },
        'HP:0001263': { hpoId: 'HP:0001263', label: 'Global developmental delay', informationContentIc: 4.2, parentIds: ['HP:0000707'] },
        'HP:0000252': { hpoId: 'HP:0000252', label: 'Microcephaly', informationContentIc: 5.1, parentIds: ['HP:0000118'] },
        'HP:0001249': { hpoId: 'HP:0001249', label: 'Intellectual disability', informationContentIc: 4.5, parentIds: ['HP:0000707'] },
        'HP:0002069': { hpoId: 'HP:0002069', label: 'Bilateral tonic-clonic seizures', informationContentIc: 6.8, parentIds: ['HP:0001250'] },
        'HP:0001332': { hpoId: 'HP:0001332', label: 'Dystonia', informationContentIc: 5.6, parentIds: ['HP:0000707'] },
        'HP:0002138': { hpoId: 'HP:0002138', label: 'Subarachnoid hemorrhage', informationContentIc: 7.2, parentIds: ['HP:0000707'] },
        'HP:0002011': { hpoId: 'HP:0002011', label: 'Morphological abnormality of the central nervous system', informationContentIc: 3.4, parentIds: ['HP:0000707'] }
    };

    // Disease gene annotations mapping to typical HPO phenotype profiles
    private static readonly GENE_DISEASE_CATALOG: Record<string, { disease: string; omim: string; terms: string[] }> = {
        'SCN1A': {
            disease: 'Dravet Syndrome / Severe Myoclonic Epilepsy of Infancy',
            omim: 'OMIM:607208',
            terms: ['HP:0001250', 'HP:0002069', 'HP:0001263']
        },
        'MECP2': {
            disease: 'Rett Syndrome',
            omim: 'OMIM:312750',
            terms: ['HP:0001263', 'HP:0000252', 'HP:0001249', 'HP:0001250']
        },
        'KCNQ2': {
            disease: 'Early Infantile Epileptic Encephalopathy 7',
            omim: 'OMIM:613720',
            terms: ['HP:0001250', 'HP:0002069', 'HP:0001263']
        },
        'GABRG2': {
            disease: 'Familial Febrile Seizures 8',
            omim: 'OMIM:607681',
            terms: ['HP:0001250']
        },
        'BRCA1': {
            disease: 'Hereditary Breast and Ovarian Cancer Syndrome',
            omim: 'OMIM:604370',
            terms: ['HP:0000118']
        }
    };

    /**
     * Lin Semantic Similarity between two HPO terms on the DAG
     */
    public static computeLinSimilarity(term1Id: string, term2Id: string): number {
        if (term1Id === term2Id) return 1.0;

        const node1 = this.HPO_DAG[term1Id];
        const node2 = this.HPO_DAG[term2Id];

        if (!node1 || !node2) return 0.20; // default baseline similarity

        // Find Most Informative Common Ancestor (MICA)
        let micaIc = 0.1;
        if (node1.parentIds.some(p => node2.parentIds.includes(p))) {
            const sharedParent = node1.parentIds.find(p => node2.parentIds.includes(p))!;
            micaIc = this.HPO_DAG[sharedParent]?.informationContentIc ?? 1.8;
        } else if (node1.parentIds.includes(term2Id)) {
            micaIc = node2.informationContentIc;
        } else if (node2.parentIds.includes(term1Id)) {
            micaIc = node1.informationContentIc;
        }

        const linSim = (2.0 * micaIc) / (node1.informationContentIc + node2.informationContentIc);
        return Math.min(1.0, Math.max(0.05, Math.round(linSim * 100) / 100));
    }

    /**
     * Solve Rare Disease Phenotype-to-Genotype Diagnostic Rank
     */
    public static solveRareDisease(input: PhenopacketsHpoInput): PhenopacketsHpoResult {
        const patientHpoIds = input.clinicalHpoSymptoms.map(s => s.hpoId);
        const rankedCandidates: RankedDiseaseGeneResult[] = [];

        for (const variant of input.candidateGenomicVariants) {
            const geneUpper = variant.gene.toUpperCase();
            const diseaseInfo = this.GENE_DISEASE_CATALOG[geneUpper] || {
                disease: `Undifferentiated ${variant.gene}-associated Rare Disorder`,
                omim: 'OMIM:UNKNOWN',
                terms: ['HP:0000118']
            };

            // Semantic matching between patient symptoms and disease known terms
            let totalSim = 0.0;
            const matchedPhenotypes: string[] = [];

            for (const pSym of input.clinicalHpoSymptoms) {
                let maxTermSim = 0.0;
                for (const dTerm of diseaseInfo.terms) {
                    const sim = this.computeLinSimilarity(pSym.hpoId, dTerm);
                    if (sim > maxTermSim) maxTermSim = sim;
                }
                totalSim += maxTermSim;
                if (maxTermSim >= 0.65) {
                    matchedPhenotypes.push(pSym.label);
                }
            }

            const hpoSimScore = Math.round((totalSim / Math.max(1, patientHpoIds.length)) * 1000) / 1000;

            // ACMG prior probability approximation
            let acmgPrior = 0.20; // default VUS
            if (variant.variantType === 'FRAMESHIFT' || variant.variantType === 'NONSENSE') acmgPrior = 0.95;
            else if (variant.variantType === 'MISSENSE') acmgPrior = 0.60;
            else if (variant.variantType === 'SYNONYMOUS') acmgPrior = 0.05;

            // Bayesian Fusion: P(Causal | Var, HPO) ~ ACMG_Prior * exp(2.5 * HPO_Sim)
            const fusionNumerator = acmgPrior * Math.exp(2.5 * hpoSimScore);
            const fusedProbability = Math.min(0.999, Math.max(0.01, fusionNumerator / (1.0 + fusionNumerator)));

            rankedCandidates.push({
                rank: 0,
                gene: variant.gene,
                diseaseName: diseaseInfo.disease,
                omimOrOrphaId: diseaseInfo.omim,
                variantId: variant.variantId,
                hgvsCdna: variant.hgvsCdna,
                hgvsProtein: variant.hgvsProtein,
                hpoSemanticSimilarityScore: hpoSimScore,
                acmgPriorPosterior: acmgPrior,
                fusedBayesianPosteriorProbability: Math.round(fusedProbability * 1000) / 1000,
                matchedPhenotypes,
                isDiagnosticMatch: false
            });
        }

        // Rank descending by fused probability
        rankedCandidates.sort((a, b) => b.fusedBayesianPosteriorProbability - a.fusedBayesianPosteriorProbability);
        rankedCandidates.forEach((item, index) => {
            item.rank = index + 1;
        });

        const topCandidate = rankedCandidates[0];
        if (topCandidate && topCandidate.fusedBayesianPosteriorProbability >= 0.85) {
            topCandidate.isDiagnosticMatch = true;
        }

        let confidenceVerdict: 'DEFINITIVE_MOLECULAR_DIAGNOSIS' | 'PROBABLE_DIAGNOSIS' | 'INCONCLUSIVE' = 'INCONCLUSIVE';
        if (topCandidate && topCandidate.fusedBayesianPosteriorProbability >= 0.90) {
            confidenceVerdict = 'DEFINITIVE_MOLECULAR_DIAGNOSIS';
        } else if (topCandidate && topCandidate.fusedBayesianPosteriorProbability >= 0.70) {
            confidenceVerdict = 'PROBABLE_DIAGNOSIS';
        }

        // Standardized GA4GH Phenopackets v2 JSON
        const phenopacketV2 = {
            id: `PHENOPACKET-${input.patientId}`,
            subject: {
                id: input.patientId,
                alternateIds: [input.uhid],
                sex: input.gender,
                age: { age: `P${input.ageYears}Y` }
            },
            phenotypicFeatures: input.clinicalHpoSymptoms.map(s => ({
                type: { id: s.hpoId, label: s.label },
                onset: s.onsetAgeYears !== undefined ? { age: `P${s.onsetAgeYears}Y` } : undefined,
                evidence: [{
                    evidenceCode: { id: 'ECO:0000033', label: 'author statement supported by clinical evaluation' }
                }]
            })),
            interpretations: rankedCandidates.map(c => ({
                id: `INTERP-${c.gene}-${c.rank}`,
                progressStatus: 'COMPLETED',
                diagnosis: {
                    disease: { id: c.omimOrOrphaId, label: c.diseaseName },
                    genomicInterpretations: [{
                        subjectOrBiosampleId: input.patientId,
                        interpretationStatus: c.isDiagnosticMatch ? 'CONTRIBUTORY' : 'CANDIDATE',
                        variantInterpretation: {
                            acmgPathogenicityClassification: c.acmgPriorPosterior >= 0.9 ? 'PATHOGENIC' : 'UNCERTAIN_SIGNIFICANCE',
                            variationDescriptor: {
                                id: c.variantId,
                                geneContext: { valueId: c.gene },
                                expressions: [
                                    { syntax: 'hgvs.c', value: c.hgvsCdna },
                                    { syntax: 'hgvs.p', value: c.hgvsProtein }
                                ]
                            }
                        }
                    }]
                }
            })),
            metaData: {
                created: new Date().toISOString(),
                createdBy: 'LABCORE AETHER-GENOMICS v7.0.0-SOVEREIGN',
                submittedBy: 'Autonomous Rare Disease Diagnostic Agent',
                phenopacketSchemaVersion: '2.0',
                resources: [
                    { id: 'hp', name: 'Human Phenotype Ontology', url: 'http://purl.obolibrary.org/obo/hp.owl', version: '2026-08' },
                    { id: 'omim', name: 'Online Mendelian Inheritance in Man', url: 'https://www.omim.org' }
                ]
            }
        };

        return {
            patientId: input.patientId,
            symptomsEvaluatedCount: input.clinicalHpoSymptoms.length,
            topRankedCandidate: topCandidate,
            rankedCandidateGenes: rankedCandidates,
            diagnosticConfidenceVerdict: confidenceVerdict,
            ga4ghPhenopacketV2Json: phenopacketV2
        };
    }
}
