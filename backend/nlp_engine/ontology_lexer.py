import re
from typing import List, Dict, Any, Optional, Tuple
import hashlib
import logging

# ==============================================================================
# NIKIL-LABCORE-ELIS-OS: MODULE 2 - DETERMINISTIC ONTOLOGY LEXER & NEGEX ENGINE
# PRODUCTION IMPLEMENTATION (ZERO SIMULATION / FULL MAX-MUNCH TRIE + HL7 PARSER)
# Standards: SNOMED-CT | LOINC | ICD-10-CM | RxNorm | HL7 v2.5.1 | FHIR R4
# ==============================================================================

logger = logging.getLogger(__name__)


class MedicalOntologyTrie:
    """
    Exact O(L) Prefix-Trie with Max-Munch boundary-aware longest-prefix matching
    across SNOMED-CT, LOINC, ICD-10-CM, and RxNorm clinical vocabularies.
    """
    def __init__(self) -> None:
        self.root: Dict[str, Any] = {}
        self._bootstrap_core_clinical_ontologies()

    def _bootstrap_core_clinical_ontologies(self) -> None:
        catalog = [
            ("substernal chest pain", "29857009", "SNOMED-CT", "SYMPTOM"),
            ("chest pain", "29857009", "SNOMED-CT", "SYMPTOM"),
            ("diaphoresis", "415690000", "SNOMED-CT", "SYMPTOM"),
            ("kussmaul tachypnea", "58849004", "SNOMED-CT", "SYMPTOM"),
            ("polyuria", "28442001", "SNOMED-CT", "SYMPTOM"),
            ("hemoptysis", "66857006", "SNOMED-CT", "SYMPTOM"),
            ("oliguria", "83128009", "SNOMED-CT", "SYMPTOM"),
            ("jaundice", "18165001", "SNOMED-CT", "SYMPTOM"),
            ("petechial rash", "271813007", "SNOMED-CT", "SYMPTOM"),
            ("malar rash", "271767006", "SNOMED-CT", "SYMPTOM"),
            ("macroscopic hematuria", "34436003", "SNOMED-CT", "SYMPTOM"),
            ("dyspnea", "267036007", "SNOMED-CT", "SYMPTOM"),
            ("high-sensitivity cardiac troponin i", "89579-7", "LOINC", "BIOMARKER"),
            ("fasting plasma glucose", "1558-6", "LOINC", "BIOMARKER"),
            ("hemoglobin a1c", "4548-4", "LOINC", "BIOMARKER"),
            ("arterial blood lactate", "2524-7", "LOINC", "BIOMARKER"),
            ("serum potassium", "2823-3", "LOINC", "BIOMARKER"),
            ("serum creatinine", "2160-0", "LOINC", "BIOMARKER"),
            ("estimated gfr", "33914-3", "LOINC", "BIOMARKER"),
            ("nt-probnp", "33762-6", "LOINC", "BIOMARKER"),
            ("serum procalcitonin", "75241-0", "LOINC", "BIOMARKER"),
            ("c-reactive protein", "1988-5", "LOINC", "BIOMARKER"),
            ("white blood cell count", "6690-2", "LOINC", "BIOMARKER"),
            ("platelet count", "777-3", "LOINC", "BIOMARKER"),
            ("plasma d-dimer", "48065-7", "LOINC", "BIOMARKER"),
            ("metformin", "6809", "RxNorm", "MEDICATION"),
            ("lisinopril", "29046", "RxNorm", "MEDICATION"),
            ("vancomycin", "11124", "RxNorm", "MEDICATION"),
            ("piperacillin-tazobactam", "74169", "RxNorm", "MEDICATION"),
            ("methotrexate", "6851", "RxNorm", "MEDICATION"),
            ("spironolactone", "9997", "RxNorm", "MEDICATION"),
            ("st-elevation myocardial infarction", "I21.09", "ICD-10-CM", "PATHOLOGY"),
            ("diabetic ketoacidosis", "E11.10", "ICD-10-CM", "PATHOLOGY"),
            ("acute kidney injury", "N17.9", "ICD-10-CM", "PATHOLOGY"),
            ("septic shock", "R65.21", "ICD-10-CM", "PATHOLOGY"),
            ("disseminated intravascular coagulation", "D65", "ICD-10-CM", "PATHOLOGY"),
        ]
        for term, code, system, category in catalog:
            self.insert(term, code, system, category)

    def insert(self, term: str, ontology_code: str, ontology_type: str, category: str = "CLINICAL") -> None:
        node = self.root
        for char in term.lower():
            if char not in node:
                node[char] = {}
            node = node[char]
        node["__END__"] = {
            "term": term,
            "code": ontology_code,
            "system": ontology_type,
            "category": category,
        }

    def search_longest_prefix(self, text: str, start_idx: int = 0) -> Optional[Tuple[int, Dict[str, str]]]:
        node = self.root
        longest_match: Optional[Tuple[int, Dict[str, str]]] = None
        lower_text = text.lower()
        n = len(lower_text)

        for idx in range(start_idx, n):
            ch = lower_text[idx]
            if ch not in node:
                break
            node = node[ch]
            if "__END__" in node:
                next_ch = lower_text[idx + 1] if idx + 1 < n else " "
                if not next_ch.isalnum():
                    longest_match = (idx + 1, node["__END__"])
        return longest_match

    def scan_document(self, text: str) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        n = len(text)
        i = 0
        while i < n:
            prev_ch = text[i - 1] if i > 0 else " "
            if prev_ch.isalnum():
                i += 1
                continue
            match = self.search_longest_prefix(text, i)
            if match is not None:
                end_idx, payload = match
                results.append({
                    "surface_text": text[i:end_idx],
                    "start_offset": i,
                    "end_offset": end_idx,
                    **payload,
                })
                i = end_idx
            else:
                i += 1
        return results


class NegExAlgorithm:
    """
    Bidirectional ConText / NegEx clinical assertion classifier.
    Determines Polarity (AFFIRMED, NEGATED, HISTORICAL, FAMILY_HISTORY),
    Temporality, and Experiencer within clause boundaries.
    """
    def __init__(self) -> None:
        self.pseudo_negations = ["no increase", "no change", "not significant", "without difficulty"]
        self.pre_negations = [
            "denies", "denied", "no evidence of", "without evidence of",
            "without", "rules out", "ruled out", "negative for", "absence of", "no "
        ]
        self.post_negations = ["unlikely", "is ruled out", "was ruled out", "free"]
        self.historical_triggers = ["history of", "prior", "previous", "chronic"]
        self.family_triggers = ["family history of", "mother had", "father had"]

    def evaluate_assertion(self, sentence: str, entity: str) -> Dict[str, Any]:
        clean = sentence.lower()
        for pseudo in self.pseudo_negations:
            clean = clean.replace(pseudo, " ")

        entity_lower = entity.lower()
        entity_idx = clean.find(entity_lower)
        if entity_idx == -1:
            return {"polarity": "AFFIRMED", "negated": False, "temporality": "CURRENT", "experiencer": "PATIENT"}

        pre_clause = re.split(r"[.;|\n]", clean[:entity_idx])[-1]
        post_clause = re.split(r"[.;|\n]", clean[entity_idx + len(entity_lower):])[0]

        for fam in self.family_triggers:
            if fam in pre_clause:
                return {"polarity": "FAMILY_HISTORY", "negated": False, "trigger": fam, "temporality": "PRIOR", "experiencer": "FAMILY"}

        for neg in self.pre_negations:
            if neg in pre_clause:
                return {"polarity": "NEGATED", "negated": True, "trigger": neg.strip(), "temporality": "CURRENT", "experiencer": "PATIENT"}

        for neg in self.post_negations:
            if neg in post_clause:
                return {"polarity": "NEGATED", "negated": True, "trigger": neg.strip(), "temporality": "CURRENT", "experiencer": "PATIENT"}

        for hist in self.historical_triggers:
            if hist in pre_clause:
                return {"polarity": "HISTORICAL", "negated": False, "trigger": hist, "temporality": "PRIOR", "experiencer": "PATIENT"}

        return {"polarity": "AFFIRMED", "negated": False, "temporality": "CURRENT", "experiencer": "PATIENT"}

    def is_negated(self, sentence: str, entity: str) -> bool:
        return bool(self.evaluate_assertion(sentence, entity)["negated"])


class HL7v2ORUParser:
    """
    Deterministic HL7 v2.5.1 ORU^R01 segment parser for automated LIS analyzers.
    """
    @staticmethod
    def parse_obx_segments(hl7_message: str) -> List[Dict[str, Any]]:
        observations: List[Dict[str, Any]] = []
        for raw_line in hl7_message.splitlines():
            line = raw_line.strip()
            if not line.startswith("OBX|"):
                continue
            fields = line.split("|")
            if len(fields) < 9:
                continue
            code_parts = fields[3].split("^")
            loinc_code = code_parts[0] if len(code_parts) > 0 else "UNKNOWN"
            display_name = code_parts[1] if len(code_parts) > 1 else loinc_code
            try:
                numeric_val = float(fields[5])
            except ValueError:
                continue
            observations.append({
                "sequence_id": fields[1],
                "value_type": fields[2],
                "loinc_code": loinc_code,
                "analyte_name": display_name,
                "value": numeric_val,
                "unit": fields[6],
                "reference_range": fields[7],
                "abnormal_flag": fields[8],
            })
        return observations
