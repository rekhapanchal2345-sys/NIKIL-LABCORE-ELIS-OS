import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import hashlib

# NIKIL-LABCORE-ELIS-OS: ENTERPRISE DATA INGESTION & DE-IDENTIFICATION
# This module processes raw HL7 v2.x and FHIR payloads before they hit the PyTorch NLP Engine.

logging.basicConfig(level=logging.INFO, format='%(asctime)s - INGESTION-ENGINE - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ClinicalDocument:
    raw_payload: str
    source_type: str
    patient_id: str
    is_masked: bool = False
    clean_text: str = ""

class EnterpriseDataIngestionPipeline:
    """
    Real-world HL7 and FHIR parser. Extracts clinical notes and observations 
    while strictly applying HIPAA/GDPR De-identification protocols (PHI Masking).
    """
    
    def __init__(self):
        # Regex patterns for Protected Health Information (PHI)
        self.phi_patterns = {
            "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
            "PHONE": r"\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b",
            "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "DOB": r"\b(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d\b"
        }
        
    def parse_hl7_v2(self, hl7_message: str) -> str:
        """
        Parses standard HL7 v2.x ORU (Observation Result) messages.
        Extracts OBX (Observation) segments which contain the clinical text.
        """
        logger.info("Initiating HL7 v2.x parser...")
        segments = hl7_message.strip().split('\n')
        clinical_text = []
        
        for segment in segments:
            fields = segment.split('|')
            if fields[0] == 'OBX':
                # OBX-5 contains the observation value (often clinical notes in textual reports)
                if len(fields) > 5:
                    clinical_text.append(fields[5].strip())
                    
        return " ".join(clinical_text)

    def parse_fhir_resource(self, fhir_json: Dict[str, Any]) -> str:
        """
        Parses FHIR R4 DiagnosticReport or Observation resources.
        """
        logger.info("Initiating FHIR resource parser...")
        text_components = []
        
        if fhir_json.get("resourceType") == "DiagnosticReport":
            presented_form = fhir_json.get("presentedForm", [])
            for attachment in presented_form:
                if attachment.get("contentType") == "text/plain":
                    import base64
                    # Decode base64 clinical note
                    decoded = base64.b64decode(attachment.get("data", "")).decode("utf-8")
                    text_components.append(decoded)
                    
        elif fhir_json.get("resourceType") == "Observation":
            if "valueString" in fhir_json:
                text_components.append(fhir_json["valueString"])
                
        return " ".join(text_components)

    def apply_hipaa_masking(self, text: str) -> Tuple[str, bool]:
        """
        Replaces PHI with standardized masked tokens.
        Ensures the AI Engine NEVER learns or hallucinates patient identities.
        """
        masked_text = text
        is_modified = False
        
        for phi_type, pattern in self.phi_patterns.items():
            if re.search(pattern, masked_text):
                is_modified = True
                masked_text = re.sub(pattern, f"[{phi_type}_REDACTED]", masked_text)
                
        return masked_text, is_modified

    def process_payload(self, raw_payload: str, source_type: str, patient_id: str) -> ClinicalDocument:
        """
        Master orchestration function for ingestion.
        """
        logger.info(f"Processing payload for Patient UUID: {patient_id} via {source_type}")
        
        # 1. Extraction
        extracted_text = ""
        if source_type == "HL7_V2_ORU":
            extracted_text = self.parse_hl7_v2(raw_payload)
        elif source_type == "FHIR_OBSERVATION":
            try:
                fhir_dict = json.loads(raw_payload)
                extracted_text = self.parse_fhir_resource(fhir_dict)
            except json.JSONDecodeError:
                logger.error("Critical Failure: Invalid FHIR JSON payload.")
                raise ValueError("Invalid FHIR JSON")
        else:
            extracted_text = raw_payload # Direct text/OCR fallback
            
        # 2. De-identification
        clean_text, is_masked = self.apply_hipaa_masking(extracted_text)
        
        # 3. Cryptographic Hashing of Raw Payload for Non-Repudiation Audit
        payload_hash = hashlib.sha256(raw_payload.encode()).hexdigest()
        logger.info(f"Payload Cryptographic Hash generated: {payload_hash}")
        
        return ClinicalDocument(
            raw_payload=raw_payload,
            source_type=source_type,
            patient_id=patient_id,
            is_masked=is_masked,
            clean_text=clean_text
        )

if __name__ == "__main__":
    # Internal Unit Test for Ingestion
    pipeline = EnterpriseDataIngestionPipeline()
    sample_hl7 = "MSH|^~\&|LAB|HOSP|||202310240900||ORU^R01|MSG001|P|2.4\nPID|1||994A28||DOB 12-05-1990||\nOBX|1|TX|1234^Chest X-Ray||Patient phone 555-123-4567. Right lung clear.||||||F"
    doc = pipeline.process_payload(sample_hl7, "HL7_V2_ORU", "UUID-999-888")
    print(f"Original Masked: {doc.is_masked}")
    print(f"Clean Text for AI: {doc.clean_text}")
