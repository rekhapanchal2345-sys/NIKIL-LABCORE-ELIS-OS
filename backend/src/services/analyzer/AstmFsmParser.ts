import { EventEmitter } from 'events';

// ============================================================================
// ASCII & MLLP CONTROL BYTE CONSTANTS (ASTM E1381 & HL7 v2.5.1 MLLP)
// ============================================================================
export const ASCII_CONTROL = {
  STX: 0x02, // Start of Text <STX>
  ETX: 0x03, // End of Text <ETX>
  EOT: 0x04, // End of Transmission <EOT>
  ENQ: 0x05, // Enquiry <ENQ>
  ACK: 0x06, // Acknowledge <ACK>
  LF: 0x0a,  // Line Feed <LF>
  VT: 0x0b,  // Vertical Tab <VT> (MLLP Start Block)
  CR: 0x0d,  // Carriage Return <CR>
  NAK: 0x15, // Negative Acknowledge <NAK>
  ETB: 0x17, // End of Transmission Block <ETB> (Intermediate Frame)
  FS: 0x1c,  // File Separator <FS> (MLLP End Block Byte 1)
} as const;

export type AstmConnectionState =
  | 'IDLE'
  | 'RECEIVING'
  | 'WAITING_FRAME'
  | 'TRANSMITTING'
  | 'AWAITING_ACK'
  | 'CONTENTION_BACKOFF'
  | 'ERROR_RECOVERY';

export type AbnormalFlag = 'N' | 'L' | 'H' | 'LL' | 'HH' | 'A' | 'AA';
export type ResultStatusFlag = 'F' | 'C' | 'P' | 'X' | 'I';

// ============================================================================
// CLINICAL DATA CONTRACTS
// ============================================================================
export interface SerumIndices {
  hemolysisIndex: number; // mg/dL Free Hemoglobin equivalent
  icterusIndex: number;   // mg/dL Bilirubin equivalent
  lipemiaIndex: number;   // mg/dL Intralipid / Turbidity equivalent
}

export interface InterferenceRule {
  parameterCode: string;
  parameterName: string;
  maxHemolysisMgDl: number;
  maxIcterusMgDl: number;
  maxLipemiaMgDl: number;
  clinicalMechanism: string;
  recommendedAction:
    | 'SAMPLE_HEMOLYZED_RECOLLECT'
    | 'SAMPLE_ICTERIC_DILUTE_OR_SUPPRESS'
    | 'SAMPLE_LIPEMIC_ULTRACENTRIFUGE';
}

export interface ParsedClinicalResult {
  sequenceNumber: number;
  universalTestId: string;
  parameterCode: string;
  parameterName: string;
  value: string;
  numericValue: number | null;
  valueType: 'NM' | 'ST' | 'CE';
  units: string;
  referenceRange: string;
  abnormalFlag: AbnormalFlag;
  resultStatus: ResultStatusFlag;
  completedAt: string;
  instrumentId: string;
  operatorId: string;
  dilutionFactor: number;
  interferenceFlag?: {
    suppressed: boolean;
    statusFlag: string;
    violatedIndex: 'HEMOLYSIS' | 'ICTERUS' | 'LIPEMIA';
    measuredIndexValue: number;
    thresholdLimit: number;
    clinicalNotice: string;
  };
}

export interface ParsedPatientRecord {
  sequenceNumber: number;
  practicePatientId: string;
  labPatientId: string;
  patientName: string;
  birthDate: string;
  sex: 'M' | 'F' | 'U';
  attendingPhysician: string;
  wardOrLocation: string;
}

export interface ParsedOrderRecord {
  sequenceNumber: number;
  specimenBarcode: string;
  instrumentSpecimenId: string;
  rackId: string;
  positionNumber: string;
  requestedTestCodes: string[];
  priority: 'S' | 'R' | 'A'; // STAT, Routine, ASAP
  collectedAt: string;
  actionCode: string;
  specimenDescriptor: string;
  dilutionFactor: number;
}

export interface ParsedQueryRecord {
  sequenceNumber: number;
  startingRangeId: string;
  specimenBarcode: string;
  requestedTestCodes: string[];
  statusCode: string;
}

export interface ReflexRuleDefinition {
  ruleId: string;
  triggerParameterCode: string;
  conditionOperator: '>' | '>=' | '<' | '<=' | '==' | 'IN_SET';
  thresholdNumeric?: number;
  thresholdSet?: string[];
  reflexTestsToOrder: Array<{
    testCode: string;
    testName: string;
    specimenType: string;
    dilutionFactor: number;
  }>;
  derivedCalculation?: {
    derivedParameterCode: string;
    derivedParameterName: string;
    units: string;
    formulaDescription: string;
    evaluate: (triggerValue: number, secondaryValue: number) => number;
  };
  clinicalRationale: string;
}

export interface GeneratedReflexOrder {
  reflexRuleId: string;
  specimenBarcode: string;
  patientId: string;
  triggeredByParameter: string;
  triggeredByValue: string;
  reflexTests: Array<{
    testCode: string;
    testName: string;
    specimenType: string;
    dilutionFactor: number;
  }>;
  clinicalRationale: string;
  createdAt: string;
}

export interface PendingWorklistOrder {
  specimenBarcode: string;
  patientId: string;
  patientName: string;
  birthDate: string;
  sex: 'M' | 'F' | 'U';
  priority: 'S' | 'R';
  rackId: string;
  positionNumber: string;
  specimenDescriptor: string;
  tests: Array<{
    testCode: string;
    dilutionFactor: number;
  }>;
}

export interface RawTelemetryFrameEvent {
  frameId: string;
  analyzerId: string;
  protocol: 'ASTM_E1381' | 'HL7_MLLP';
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'VALID' | 'ERROR_CHECKSUM' | 'ERROR_PARITY_NAK' | 'QUERY_RESPONSE';
  rawBytesHex: string;
  rawAsciiReadable: string;
  expectedChecksum?: string;
  calculatedChecksum?: string;
  timestamp: string;
  decodedSummary: string;
}

// ============================================================================
// CLSI EP07-A2 PRE-ANALYTICAL INTERFERENCE MATRIX
// ============================================================================
export const CLSI_EP07_INTERFERENCE_MATRIX: Record<string, InterferenceRule> = {
  K: {
    parameterCode: 'K',
    parameterName: 'Potassium (Serum)',
    maxHemolysisMgDl: 100, // Strict threshold: intracellular K+ release falsifies serum K+
    maxIcterusMgDl: 40,
    maxLipemiaMgDl: 1000,
    clinicalMechanism: 'Erythrocyte lysis releases intracellular K+ (40x plasma concentration), causing pseudohyperkalemia.',
    recommendedAction: 'SAMPLE_HEMOLYZED_RECOLLECT',
  },
  LDH: {
    parameterCode: 'LDH',
    parameterName: 'Lactate Dehydrogenase',
    maxHemolysisMgDl: 50,
    maxIcterusMgDl: 60,
    maxLipemiaMgDl: 800,
    clinicalMechanism: 'RBCs contain 160x higher LDH activity than serum; trace hemolysis invalidates assay.',
    recommendedAction: 'SAMPLE_HEMOLYZED_RECOLLECT',
  },
  AST: {
    parameterCode: 'AST',
    parameterName: 'Aspartate Aminotransferase (SGOT)',
    maxHemolysisMgDl: 150,
    maxIcterusMgDl: 50,
    maxLipemiaMgDl: 750,
    clinicalMechanism: 'Intra-erythrocytic AST release and spectral hemoglobin absorbance at 340 nm.',
    recommendedAction: 'SAMPLE_HEMOLYZED_RECOLLECT',
  },
  CREA: {
    parameterCode: 'CREA',
    parameterName: 'Creatinine (Jaffe Kinetic)',
    maxHemolysisMgDl: 500,
    maxIcterusMgDl: 15, // Bilirubin interferes with alkaline picrate Jaffe reaction
    maxLipemiaMgDl: 600,
    clinicalMechanism: 'High bilirubin oxidizes under alkaline Jaffe conditions causing false-negative/pseudohypocreatininemia.',
    recommendedAction: 'SAMPLE_ICTERIC_DILUTE_OR_SUPPRESS',
  },
  NA: {
    parameterCode: 'NA',
    parameterName: 'Sodium (Indirect ISE)',
    maxHemolysisMgDl: 500,
    maxIcterusMgDl: 60,
    maxLipemiaMgDl: 500, // Lipemia causes electrolyte exclusion effect in indirect ISE
    clinicalMechanism: 'Severe hyperlipidemia displaces aqueous plasma phase, causing pseudohyponatremia on indirect ISE.',
    recommendedAction: 'SAMPLE_LIPEMIC_ULTRACENTRIFUGE',
  },
  TBIL: {
    parameterCode: 'TBIL',
    parameterName: 'Total Bilirubin',
    maxHemolysisMgDl: 200,
    maxIcterusMgDl: 9999,
    maxLipemiaMgDl: 400,
    clinicalMechanism: 'Oxyhemoglobin interferes with diazo coupling spectrophotometric reading.',
    recommendedAction: 'SAMPLE_HEMOLYZED_RECOLLECT',
  },
};

// ============================================================================
// CLINICAL REFLEX & CASCADE RULE DEFINITIONS
// ============================================================================
export const DEFAULT_REFLEX_RULES: ReflexRuleDefinition[] = [
  {
    ruleId: 'REFLEX-PSA-FREE',
    triggerParameterCode: 'PSA_TOTAL',
    conditionOperator: '>',
    thresholdNumeric: 4.0,
    reflexTestsToOrder: [
      {
        testCode: 'PSA_FREE',
        testName: 'Free Prostate-Specific Antigen (fPSA)',
        specimenType: 'SERUM',
        dilutionFactor: 1.0,
      },
    ],
    derivedCalculation: {
      derivedParameterCode: 'PSA_RATIO',
      derivedParameterName: 'Free / Total PSA Ratio (%)',
      units: '%',
      formulaDescription: '(Free PSA / Total PSA) * 100',
      evaluate: (totalPsa: number, freePsa: number) =>
        totalPsa > 0 ? Number(((freePsa / totalPsa) * 100).toFixed(2)) : 0,
    },
    clinicalRationale: 'Total PSA > 4.0 ng/mL in diagnostic gray zone; Free/Total PSA ratio differentiates BPH from prostatic adenocarcinoma.',
  },
  {
    ruleId: 'REFLEX-URINE-CULTURE',
    triggerParameterCode: 'UA_NITRITE',
    conditionOperator: 'IN_SET',
    thresholdSet: ['POS', 'POSITIVE', '1+', '2+', '3+', 'REACTIVE'],
    reflexTestsToOrder: [
      {
        testCode: 'MICRO_UCULT',
        testName: 'Urine Aerobic Culture & AST Susceptibility',
        specimenType: 'URINE',
        dilutionFactor: 1.0,
      },
    ],
    clinicalRationale: 'Positive urinary nitrite indicates Enterobacteriaceae bacteriuria requiring quantitative culture and antimicrobial susceptibility testing.',
  },
  {
    ruleId: 'REFLEX-THYROID-CASCADE',
    triggerParameterCode: 'TSH',
    conditionOperator: '>',
    thresholdNumeric: 4.5,
    reflexTestsToOrder: [
      {
        testCode: 'FT4',
        testName: 'Free Thyroxine (fT4)',
        specimenType: 'SERUM',
        dilutionFactor: 1.0,
      },
      {
        testCode: 'ANTI_TPO',
        testName: 'Anti-Thyroid Peroxidase Antibody',
        specimenType: 'SERUM',
        dilutionFactor: 1.0,
      },
    ],
    clinicalRationale: 'Elevated TSH > 4.5 mIU/L triggers Free T4 and Anti-TPO to classify overt vs. subclinical hypothyroidism.',
  },
];

// ============================================================================
// MAIN ASTM E1381/E1394 & HL7 v2.5.1 MLLP BIDIRECTIONAL ENGINE
// ============================================================================
export class AstmFsmParser extends EventEmitter {
  private readonly analyzerId: string;
  private state: AstmConnectionState = 'IDLE';
  private expectedFrameNumber: number = 1;
  private inboundFrameBuffer: number[] = [];
  private multiFrameRecordBuffer: string = '';
  private outboundFramesQueue: Buffer[] = [];
  private currentOutboundIndex: number = 0;
  private nakRetryCount: number = 0;
  private readonly maxNakRetries: number = 6;

  // Session state for current ASTM message assembly
  private currentPatient: ParsedPatientRecord | null = null;
  private currentOrder: ParsedOrderRecord | null = null;
  private currentResults: ParsedClinicalResult[] = [];
  private currentQueries: ParsedQueryRecord[] = [];
  private currentSerumIndices: SerumIndices = {
    hemolysisIndex: 0,
    icterusIndex: 0,
    lipemiaIndex: 0,
  };

  // In-memory worklist lookup callback for Host Query Mode
  private readonly worklistResolver?: (
    barcode: string
  ) => Promise<PendingWorklistOrder | null> | PendingWorklistOrder | null;

  constructor(
    analyzerId: string,
    worklistResolver?: (
      barcode: string
    ) => Promise<PendingWorklistOrder | null> | PendingWorklistOrder | null
  ) {
    super();
    this.analyzerId = analyzerId;
    this.worklistResolver = worklistResolver;
  }

  public getState(): AstmConnectionState {
    return this.state;
  }

  // --------------------------------------------------------------------------
  // 1. MODULO 256 CHECKSUM CALCULATOR (ASTM E1381 SECTION 6.3.3)
  // Sums all bytes after <STX> up to and including <ETX> or <ETB>, modulo 256
  // --------------------------------------------------------------------------
  public static calculateAstmChecksum(framePayloadWithEtxOrEtb: Buffer | Uint8Array): string {
    let sum = 0;
    for (let i = 0; i < framePayloadWithEtxOrEtb.length; i++) {
      const byte = framePayloadWithEtxOrEtb[i];
      if (byte === ASCII_CONTROL.STX) {
        continue;
      }
      sum = (sum + byte) & 0xff;
      if (byte === ASCII_CONTROL.ETX || byte === ASCII_CONTROL.ETB) {
        break;
      }
    }
    return sum.toString(16).toUpperCase().padStart(2, '0');
  }

  // --------------------------------------------------------------------------
  // 2. DETERMINISTIC FINITE STATE MACHINE: INBOUND BYTE STREAM PROCESSOR
  // --------------------------------------------------------------------------
  public async ingestRawBytes(chunk: Buffer): Promise<Buffer[]> {
    const outboundResponses: Buffer[] = [];

    // Check if frame is HL7 v2.5.1 MLLP wrapped (Starts with 0x0B <VT>)
    if (chunk.length > 0 && chunk[0] === ASCII_CONTROL.VT) {
      const hl7Ack = this.processHl7MllpBuffer(chunk);
      if (hl7Ack) {
        outboundResponses.push(hl7Ack);
      }
      return outboundResponses;
    }

    for (let i = 0; i < chunk.length; i++) {
      const byte = chunk[i];

      switch (this.state) {
        case 'IDLE': {
          if (byte === ASCII_CONTROL.ENQ) {
            this.state = 'WAITING_FRAME';
            this.expectedFrameNumber = 1;
            this.multiFrameRecordBuffer = '';
            this.resetSessionRecords();

            const ackBuf = Buffer.from([ASCII_CONTROL.ACK]);
            outboundResponses.push(ackBuf);
            this.emitTelemetry('INBOUND', 'VALID', Buffer.from([byte]), 'Rx <ENQ> — Line Establishment Request');
            this.emitTelemetry('OUTBOUND', 'VALID', ackBuf, 'Tx <ACK> — Ready to Receive Frames');
          }
          break;
        }

        case 'WAITING_FRAME': {
          if (byte === ASCII_CONTROL.STX) {
            this.state = 'RECEIVING';
            this.inboundFrameBuffer = [ASCII_CONTROL.STX];
          } else if (byte === ASCII_CONTROL.EOT) {
            this.state = 'IDLE';
            this.emitTelemetry('INBOUND', 'VALID', Buffer.from([byte]), 'Rx <EOT> — Transmission Completed');
            await this.finalizeAstmSession(outboundResponses);
          }
          break;
        }

        case 'RECEIVING': {
          this.inboundFrameBuffer.push(byte);
          if (byte === ASCII_CONTROL.LF) {
            const rawFrame = Buffer.from(this.inboundFrameBuffer);
            const validation = this.validateAndExtractAstmFrame(rawFrame);

            if (validation.valid) {
              this.emitTelemetry(
                'INBOUND',
                'VALID',
                rawFrame,
                `Rx Frame #${validation.frameNumber} (${validation.isIntermediate ? 'ETB Intermediate' : 'ETX Final'}): ${validation.dataContent.slice(0, 60)}`,
                validation.receivedChecksum,
                validation.calculatedChecksum
              );

              this.multiFrameRecordBuffer += validation.dataContent;

              if (!validation.isIntermediate) {
                this.parseAstmRecordString(this.multiFrameRecordBuffer);
                this.multiFrameRecordBuffer = '';
              }

              this.expectedFrameNumber = (this.expectedFrameNumber + 1) % 8;
              this.state = 'WAITING_FRAME';

              const ackBuf = Buffer.from([ASCII_CONTROL.ACK]);
              outboundResponses.push(ackBuf);
              this.emitTelemetry('OUTBOUND', 'VALID', ackBuf, `Tx <ACK> — Confirmed Frame #${validation.frameNumber}`);
            } else {
              this.emitTelemetry(
                'INBOUND',
                'ERROR_CHECKSUM',
                rawFrame,
                `Frame Checksum/Seq Error: Expected CS=${validation.calculatedChecksum}, Got=${validation.receivedChecksum}`,
                validation.receivedChecksum,
                validation.calculatedChecksum
              );

              this.state = 'WAITING_FRAME';
              const nakBuf = Buffer.from([ASCII_CONTROL.NAK]);
              outboundResponses.push(nakBuf);
              this.emitTelemetry('OUTBOUND', 'ERROR_PARITY_NAK', nakBuf, 'Tx <NAK> — Requesting Frame Retransmission');
            }
          }
          break;
        }

        case 'AWAITING_ACK': {
          if (byte === ASCII_CONTROL.ACK) {
            this.nakRetryCount = 0;
            this.emitTelemetry('INBOUND', 'VALID', Buffer.from([byte]), 'Rx <ACK> from Analyzer');

            if (this.currentOutboundIndex < this.outboundFramesQueue.length) {
              const nextFrame = this.outboundFramesQueue[this.currentOutboundIndex++];
              outboundResponses.push(nextFrame);
              this.emitTelemetry('OUTBOUND', 'QUERY_RESPONSE', nextFrame, `Tx Host Order Frame #${this.currentOutboundIndex}`);
            } else {
              const eotBuf = Buffer.from([ASCII_CONTROL.EOT]);
              outboundResponses.push(eotBuf);
              this.outboundFramesQueue = [];
              this.currentOutboundIndex = 0;
              this.state = 'IDLE';
              this.emitTelemetry('OUTBOUND', 'QUERY_RESPONSE', eotBuf, 'Tx <EOT> — Host Order Download Complete');
            }
          } else if (byte === ASCII_CONTROL.NAK) {
            this.nakRetryCount++;
            this.emitTelemetry('INBOUND', 'ERROR_PARITY_NAK', Buffer.from([byte]), `Rx <NAK> from Analyzer (Retry ${this.nakRetryCount}/${this.maxNakRetries})`);

            if (this.nakRetryCount >= this.maxNakRetries) {
              const eotBuf = Buffer.from([ASCII_CONTROL.EOT]);
              outboundResponses.push(eotBuf);
              this.state = 'ERROR_RECOVERY';
              this.emit('error', new Error(`Analyzer ${this.analyzerId} exceeded maximum NAK retries (${this.maxNakRetries}).`));
            } else if (this.currentOutboundIndex > 0) {
              const retryFrame = this.outboundFramesQueue[this.currentOutboundIndex - 1];
              outboundResponses.push(retryFrame);
              this.emitTelemetry('OUTBOUND', 'QUERY_RESPONSE', retryFrame, `Retransmitting Frame #${this.currentOutboundIndex}`);
            }
          } else if (byte === ASCII_CONTROL.ENQ) {
            // Line contention: Instrument has priority per ASTM E1381 Section 6.2.2
            this.state = 'CONTENTION_BACKOFF';
            this.emitTelemetry('INBOUND', 'ERROR_PARITY_NAK', Buffer.from([byte]), 'Line Contention Detected — Instrument Priority Backoff');
          }
          break;
        }

        default:
          break;
      }
    }

    return outboundResponses;
  }

  // --------------------------------------------------------------------------
  // 3. ASTM E1381 FRAME VALIDATOR & EXTRACTOR
  // Frame Structure: <STX>[Frame#][Data][<ETB>|<ETX>][C1][C2]<CR><LF>
  // --------------------------------------------------------------------------
  private validateAndExtractAstmFrame(frame: Buffer): {
    valid: boolean;
    frameNumber: number;
    isIntermediate: boolean;
    dataContent: string;
    receivedChecksum: string;
    calculatedChecksum: string;
  } {
    if (frame.length < 7 || frame[0] !== ASCII_CONTROL.STX) {
      return {
        valid: false,
        frameNumber: -1,
        isIntermediate: false,
        dataContent: '',
        receivedChecksum: 'NONE',
        calculatedChecksum: '00',
      };
    }

    let terminatorIndex = -1;
    let isIntermediate = false;

    for (let i = frame.length - 1; i >= 1; i--) {
      if (frame[i] === ASCII_CONTROL.ETX) {
        terminatorIndex = i;
        isIntermediate = false;
        break;
      }
      if (frame[i] === ASCII_CONTROL.ETB) {
        terminatorIndex = i;
        isIntermediate = true;
        break;
      }
    }

    if (terminatorIndex === -1 || terminatorIndex + 2 >= frame.length) {
      return {
        valid: false,
        frameNumber: -1,
        isIntermediate: false,
        dataContent: '',
        receivedChecksum: 'INVALID',
        calculatedChecksum: '00',
      };
    }

    const frameNumberChar = String.fromCharCode(frame[1]);
    const frameNumber = parseInt(frameNumberChar, 10);
    const payloadToChecksum = frame.subarray(1, terminatorIndex + 1);
    const calculatedChecksum = AstmFsmParser.calculateAstmChecksum(payloadToChecksum);
    const receivedChecksum = frame
      .subarray(terminatorIndex + 1, terminatorIndex + 3)
      .toString('ascii')
      .toUpperCase();

    const frameNumValid = !Number.isNaN(frameNumber) && frameNumber >= 0 && frameNumber <= 7;
    const checksumValid = calculatedChecksum === receivedChecksum;

    const dataContent = frame.subarray(2, terminatorIndex).toString('ascii');

    return {
      valid: frameNumValid && checksumValid,
      frameNumber,
      isIntermediate,
      dataContent,
      receivedChecksum,
      calculatedChecksum,
    };
  }

  // --------------------------------------------------------------------------
  // 4. ASTM E1394 RECORD PARSER (H, P, O, R, C, Q, L)
  // --------------------------------------------------------------------------
  private parseAstmRecordString(rawBlock: string): void {
    const records = rawBlock
      .split(/\r\n|\r|\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const record of records) {
      const recordType = record.charAt(0).toUpperCase();
      const fields = record.split('|');

      switch (recordType) {
        case 'H': {
          // Header Record: H|\^&|||CobasPro^1|||||Host||P|1|20261020234000
          const senderInfo = (fields[4] || '').split('^');
          this.emit('header', {
            analyzerId: this.analyzerId,
            instrumentName: senderInfo[0] || this.analyzerId,
            protocolVersion: fields[12] || 'E1394-97',
            timestamp: fields[13] || new Date().toISOString(),
          });
          break;
        }

        case 'P': {
          // Patient Record: P|1|MRN-90210|LAB-1002||SHARMA^RAJESH||19780514|M|||||DR. VERMA|ICU-BED-04
          const nameParts = (fields[5] || '').split('^');
          const formattedName = [nameParts[1], nameParts[0]].filter(Boolean).join(' ') || fields[5] || 'UNKNOWN';
          const sexRaw = (fields[8] || 'U').toUpperCase();

          this.currentPatient = {
            sequenceNumber: parseInt(fields[1] || '1', 10),
            practicePatientId: fields[2] || '',
            labPatientId: fields[3] || '',
            patientName: formattedName,
            birthDate: fields[7] || '',
            sex: sexRaw === 'M' || sexRaw === 'F' ? sexRaw : 'U',
            attendingPhysician: fields[13] || '',
            wardOrLocation: fields[14] || '',
          };
          break;
        }

        case 'O': {
          // Order Record: O|1|SMP-1092|0012^RACK-A^04|^^^NA^1\^^^K^1|S||20261020230000||||N||||SERUM
          const specimenComponents = (fields[2] || '').split('^');
          const barcode = specimenComponents[0] || '';
          const carrierComponents = (fields[3] || '').split('^');
          const instrumentSpecId = carrierComponents[0] || '';
          const rackId = carrierComponents[1] || 'RACK-01';
          const positionNumber = carrierComponents[2] || '01';

          const rawTests = (fields[4] || '').split('\\');
          const requestedTestCodes: string[] = [];
          let dilutionFactor = 1.0;

          for (const testToken of rawTests) {
            const parts = testToken.split('^');
            const code = parts[3] || parts[0] || '';
            if (code) {
              requestedTestCodes.push(code);
            }
            if (parts[4] && !Number.isNaN(parseFloat(parts[4]))) {
              dilutionFactor = parseFloat(parts[4]);
            }
          }

          const priorityRaw = (fields[5] || 'R').toUpperCase();
          this.currentOrder = {
            sequenceNumber: parseInt(fields[1] || '1', 10),
            specimenBarcode: barcode,
            instrumentSpecimenId: instrumentSpecId,
            rackId,
            positionNumber,
            requestedTestCodes,
            priority: priorityRaw === 'S' || priorityRaw === 'A' ? priorityRaw : 'R',
            collectedAt: fields[7] || '',
            actionCode: fields[11] || 'N',
            specimenDescriptor: fields[15] || 'SERUM',
            dilutionFactor,
          };
          break;
        }

        case 'R': {
          // Result Record: R|1|^^^K^Potassium^1|5.8|mmol/L|3.5-5.1|H||F|||20261020234112|COBAS-6000
          const testIdParts = (fields[2] || '').split('^');
          const paramCode = (testIdParts[3] || testIdParts[0] || 'UNKNOWN').toUpperCase();
          const paramName = testIdParts[4] || paramCode;
          const dilution = testIdParts[5] ? parseFloat(testIdParts[5]) || 1.0 : 1.0;
          const rawVal = (fields[3] || '').trim();
          const numericVal = /^-?\d+(\.\d+)?$/.test(rawVal) ? parseFloat(rawVal) : null;

          // Check if this R record is a pre-analytical Serum Index (H, I, L)
          if (paramCode === 'H_INDEX' || paramCode === 'HEMOLYSIS' || paramCode === 'IND_H') {
            this.currentSerumIndices.hemolysisIndex = numericVal ?? 0;
            break;
          }
          if (paramCode === 'I_INDEX' || paramCode === 'ICTERUS' || paramCode === 'IND_I') {
            this.currentSerumIndices.icterusIndex = numericVal ?? 0;
            break;
          }
          if (paramCode === 'L_INDEX' || paramCode === 'LIPEMIA' || paramCode === 'IND_L') {
            this.currentSerumIndices.lipemiaIndex = numericVal ?? 0;
            break;
          }

          const rawAbnormal = (fields[6] || 'N').toUpperCase();
          const abnormalFlag: AbnormalFlag =
            rawAbnormal === 'L' ||
            rawAbnormal === 'H' ||
            rawAbnormal === 'LL' ||
            rawAbnormal === 'HH' ||
            rawAbnormal === 'A' ||
            rawAbnormal === 'AA'
              ? rawAbnormal
              : 'N';

          const rawStatus = (fields[8] || 'F').toUpperCase();
          const resultStatus: ResultStatusFlag =
            rawStatus === 'F' || rawStatus === 'C' || rawStatus === 'P' || rawStatus === 'X' || rawStatus === 'I'
              ? rawStatus
              : 'F';

          const resultObj: ParsedClinicalResult = {
            sequenceNumber: parseInt(fields[1] || '1', 10),
            universalTestId: fields[2] || '',
            parameterCode: paramCode,
            parameterName: paramName,
            value: rawVal,
            numericValue: numericVal,
            valueType: numericVal !== null ? 'NM' : 'ST',
            units: fields[4] || '',
            referenceRange: fields[5] || '',
            abnormalFlag,
            resultStatus,
            completedAt: fields[12] || new Date().toISOString(),
            instrumentId: fields[13] || this.analyzerId,
            operatorId: fields[10] || 'AUTO-INSTRUMENT',
            dilutionFactor: dilution,
          };

          this.currentResults.push(resultObj);
          break;
        }

        case 'Q': {
          // Query Record: Q|1|^SMP-1092||^^^ALL||||||||O
          const rangeParts = (fields[2] || '').split('^');
          const barcode = rangeParts[1] || rangeParts[0] || '';
          const testTokens = (fields[4] || '').split('\\');
          const requestedCodes = testTokens
            .map((t) => {
              const p = t.split('^');
              return p[3] || p[0] || 'ALL';
            })
            .filter(Boolean);

          this.currentQueries.push({
            sequenceNumber: parseInt(fields[1] || '1', 10),
            startingRangeId: fields[2] || '',
            specimenBarcode: barcode,
            requestedTestCodes: requestedCodes,
            statusCode: fields[12] || 'O',
          });
          break;
        }

        case 'C': {
          // Comment Record: C|1|I|SERUM_INDEX^H:185^I:1.2^L:45|G
          const commentText = fields[3] || '';
          const hMatch = commentText.match(/H[:=](\d+(\.\d+)?)/i);
          const iMatch = commentText.match(/I[:=](\d+(\.\d+)?)/i);
          const lMatch = commentText.match(/L[:=](\d+(\.\d+)?)/i);
          if (hMatch) this.currentSerumIndices.hemolysisIndex = parseFloat(hMatch[1]);
          if (iMatch) this.currentSerumIndices.icterusIndex = parseFloat(iMatch[1]);
          if (lMatch) this.currentSerumIndices.lipemiaIndex = parseFloat(lMatch[1]);
          break;
        }

        case 'L': {
          // Terminator Record: L|1|N
          this.emit('terminator', {
            sequenceNumber: parseInt(fields[1] || '1', 10),
            terminationCode: fields[2] || 'N',
          });
          break;
        }

        default:
          break;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. PRE-ANALYTICAL INTERFERENCE EVALUATION (CLSI EP07-A2) & REFLEX INJECTION
  // --------------------------------------------------------------------------
  private evaluateInterferenceAndReflexes(
    results: ParsedClinicalResult[],
    indices: SerumIndices,
    specimenBarcode: string,
    patientId: string
  ): {
    processedResults: ParsedClinicalResult[];
    reflexOrders: GeneratedReflexOrder[];
  } {
    const processedResults: ParsedClinicalResult[] = [];
    const reflexOrders: GeneratedReflexOrder[] = [];

    for (const res of results) {
      const cloned: ParsedClinicalResult = { ...res };
      const rule = CLSI_EP07_INTERFERENCE_MATRIX[cloned.parameterCode];

      if (rule) {
        if (indices.hemolysisIndex > rule.maxHemolysisMgDl) {
          cloned.resultStatus = 'X'; // Suppress automated release
          cloned.interferenceFlag = {
            suppressed: true,
            statusFlag: 'SAMPLE_HEMOLYZED_RECOLLECT',
            violatedIndex: 'HEMOLYSIS',
            measuredIndexValue: indices.hemolysisIndex,
            thresholdLimit: rule.maxHemolysisMgDl,
            clinicalNotice: `CLSI EP07-A2 Alert: Hemolysis Index (${indices.hemolysisIndex} mg/dL) exceeds ${cloned.parameterCode} threshold (${rule.maxHemolysisMgDl} mg/dL). ${rule.clinicalMechanism}`,
          };
          this.emit('interferenceAlert', {
            analyzerId: this.analyzerId,
            specimenBarcode,
            patientId,
            parameterCode: cloned.parameterCode,
            flag: cloned.interferenceFlag,
          });
        } else if (indices.icterusIndex > rule.maxIcterusMgDl) {
          cloned.resultStatus = 'X';
          cloned.interferenceFlag = {
            suppressed: true,
            statusFlag: 'SAMPLE_ICTERIC_DILUTE_OR_SUPPRESS',
            violatedIndex: 'ICTERUS',
            measuredIndexValue: indices.icterusIndex,
            thresholdLimit: rule.maxIcterusMgDl,
            clinicalNotice: `CLSI EP07-A2 Alert: Icterus Index (${indices.icterusIndex} mg/dL) exceeds ${cloned.parameterCode} threshold (${rule.maxIcterusMgDl} mg/dL). ${rule.clinicalMechanism}`,
          };
          this.emit('interferenceAlert', {
            analyzerId: this.analyzerId,
            specimenBarcode,
            patientId,
            parameterCode: cloned.parameterCode,
            flag: cloned.interferenceFlag,
          });
        } else if (indices.lipemiaIndex > rule.maxLipemiaMgDl) {
          cloned.resultStatus = 'X';
          cloned.interferenceFlag = {
            suppressed: true,
            statusFlag: 'SAMPLE_LIPEMIC_ULTRACENTRIFUGE',
            violatedIndex: 'LIPEMIA',
            measuredIndexValue: indices.lipemiaIndex,
            thresholdLimit: rule.maxLipemiaMgDl,
            clinicalNotice: `CLSI EP07-A2 Alert: Lipemia Index (${indices.lipemiaIndex} mg/dL) exceeds ${cloned.parameterCode} threshold (${rule.maxLipemiaMgDl} mg/dL). ${rule.clinicalMechanism}`,
          };
          this.emit('interferenceAlert', {
            analyzerId: this.analyzerId,
            specimenBarcode,
            patientId,
            parameterCode: cloned.parameterCode,
            flag: cloned.interferenceFlag,
          });
        }
      }

      // Evaluate Reflex Rules only if the result is not suppressed by pre-analytical interference
      if (!cloned.interferenceFlag?.suppressed) {
        for (const reflexRule of DEFAULT_REFLEX_RULES) {
          if (reflexRule.triggerParameterCode === cloned.parameterCode) {
            let triggered = false;
            if (
              reflexRule.conditionOperator === '>' &&
              cloned.numericValue !== null &&
              reflexRule.thresholdNumeric !== undefined
            ) {
              triggered = cloned.numericValue > reflexRule.thresholdNumeric;
            } else if (
              reflexRule.conditionOperator === '>=' &&
              cloned.numericValue !== null &&
              reflexRule.thresholdNumeric !== undefined
            ) {
              triggered = cloned.numericValue >= reflexRule.thresholdNumeric;
            } else if (
              reflexRule.conditionOperator === '<' &&
              cloned.numericValue !== null &&
              reflexRule.thresholdNumeric !== undefined
            ) {
              triggered = cloned.numericValue < reflexRule.thresholdNumeric;
            } else if (
              reflexRule.conditionOperator === 'IN_SET' &&
              reflexRule.thresholdSet !== undefined
            ) {
              triggered = reflexRule.thresholdSet.includes(cloned.value.toUpperCase());
            }

            if (triggered) {
              const reflexOrder: GeneratedReflexOrder = {
                reflexRuleId: reflexRule.ruleId,
                specimenBarcode,
                patientId,
                triggeredByParameter: cloned.parameterCode,
                triggeredByValue: cloned.value,
                reflexTests: reflexRule.reflexTestsToOrder,
                clinicalRationale: reflexRule.clinicalRationale,
                createdAt: new Date().toISOString(),
              };
              reflexOrders.push(reflexOrder);
              this.emit('reflexOrderTriggered', reflexOrder);
            }
          }
        }
      }

      processedResults.push(cloned);
    }

    // Check if any derived ratio calculations can be completed (e.g., Free/Total PSA Ratio)
    for (const reflexRule of DEFAULT_REFLEX_RULES) {
      if (reflexRule.derivedCalculation) {
        const primary = processedResults.find(
          (r) => r.parameterCode === reflexRule.triggerParameterCode && r.numericValue !== null
        );
        const secondaryCode = reflexRule.reflexTestsToOrder[0]?.testCode;
        const secondary = processedResults.find(
          (r) => r.parameterCode === secondaryCode && r.numericValue !== null
        );

        if (primary && secondary && primary.numericValue !== null && secondary.numericValue !== null) {
          const derivedVal = reflexRule.derivedCalculation.evaluate(
            primary.numericValue,
            secondary.numericValue
          );
          processedResults.push({
            sequenceNumber: processedResults.length + 1,
            universalTestId: `^^^${reflexRule.derivedCalculation.derivedParameterCode}`,
            parameterCode: reflexRule.derivedCalculation.derivedParameterCode,
            parameterName: reflexRule.derivedCalculation.derivedParameterName,
            value: derivedVal.toFixed(2),
            numericValue: derivedVal,
            valueType: 'NM',
            units: reflexRule.derivedCalculation.units,
            referenceRange: '>25.0',
            abnormalFlag: derivedVal < 15.0 ? 'L' : 'N',
            resultStatus: 'F',
            completedAt: new Date().toISOString(),
            instrumentId: this.analyzerId,
            operatorId: 'CALC-ENGINE',
            dilutionFactor: 1.0,
          });
        }
      }
    }

    return { processedResults, reflexOrders };
  }

  // --------------------------------------------------------------------------
  // 6. HOST QUERY MODE (`Q` RECORD) RESPONSE GENERATOR
  // Generates ASTM E1394 H, P, O, L packets framed with E1381 STX/ETX/Checksum
  // --------------------------------------------------------------------------
  public buildHostQueryOrderFrames(worklistOrder: PendingWorklistOrder): Buffer[] {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);

    const testFieldString = worklistOrder.tests
      .map((t) => `^^^${t.testCode}^${t.dilutionFactor}`)
      .join('\\');

    const headerRecord = `H|\\^&|||NIKIL-LABCORE-ELIS^2.5.0|||||${this.analyzerId}||P|1|${timestamp}\r`;
    const patientRecord = `P|1|${worklistOrder.patientId}|${worklistOrder.patientId}||${worklistOrder.patientName.replace(/\s+/g, '^')}||${worklistOrder.birthDate}|${worklistOrder.sex}\r`;
    const orderRecord = `O|1|${worklistOrder.specimenBarcode}|${worklistOrder.specimenBarcode}^${worklistOrder.rackId}^${worklistOrder.positionNumber}|${testFieldString}|${worklistOrder.priority}|${timestamp}|||||A||||${worklistOrder.specimenDescriptor}\r`;
    const terminatorRecord = `L|1|N\r`;

    const records = [headerRecord, patientRecord, orderRecord, terminatorRecord];
    const frames: Buffer[] = [];

    let frameSeq = 1;
    for (const rec of records) {
      const frameBody = Buffer.from(`${frameSeq}${rec}`, 'ascii');
      const bodyWithEtx = Buffer.concat([frameBody, Buffer.from([ASCII_CONTROL.ETX])]);
      const checksum = AstmFsmParser.calculateAstmChecksum(bodyWithEtx);

      const fullFrame = Buffer.concat([
        Buffer.from([ASCII_CONTROL.STX]),
        bodyWithEtx,
        Buffer.from(`${checksum}\r\n`, 'ascii'),
      ]);

      frames.push(fullFrame);
      frameSeq = (frameSeq + 1) % 8;
    }

    return frames;
  }

  private async finalizeAstmSession(outboundResponses: Buffer[]): Promise<void> {
    if (this.currentResults.length > 0 && this.currentOrder) {
      const { processedResults, reflexOrders } = this.evaluateInterferenceAndReflexes(
        this.currentResults,
        this.currentSerumIndices,
        this.currentOrder.specimenBarcode,
        this.currentPatient?.practicePatientId || 'UNKNOWN'
      );

      this.emit('clinicalResultsPackage', {
        analyzerId: this.analyzerId,
        patient: this.currentPatient,
        order: this.currentOrder,
        serumIndices: { ...this.currentSerumIndices },
        results: processedResults,
        reflexOrders,
        receivedAt: new Date().toISOString(),
      });
    }

    // If the Analyzer sent a Host Query (`Q` record), resolve pending tests and initiate transmission
    if (this.currentQueries.length > 0 && this.worklistResolver) {
      for (const query of this.currentQueries) {
        const pendingOrder = await this.worklistResolver(query.specimenBarcode);
        if (pendingOrder) {
          this.outboundFramesQueue = this.buildHostQueryOrderFrames(pendingOrder);
          this.currentOutboundIndex = 0;
          this.state = 'AWAITING_ACK';

          const enqBuf = Buffer.from([ASCII_CONTROL.ENQ]);
          outboundResponses.push(enqBuf);
          this.emitTelemetry(
            'OUTBOUND',
            'QUERY_RESPONSE',
            enqBuf,
            `Tx <ENQ> — Initiating Host Query Order Download for Barcode ${query.specimenBarcode} (Rack ${pendingOrder.rackId}:${pendingOrder.positionNumber})`
          );
        } else {
          this.emit('unmatchedQueryBarcode', {
            analyzerId: this.analyzerId,
            specimenBarcode: query.specimenBarcode,
            queriedAt: new Date().toISOString(),
          });
        }
      }
    }

    this.resetSessionRecords();
  }

  // --------------------------------------------------------------------------
  // 7. HL7 v2.5.1 MLLP FRAMER & ORU^R01 / ACK^R01 ENGINE
  // Start Byte: 0x0B <VT>, End Bytes: 0x1C 0x0D <FS><CR>
  // --------------------------------------------------------------------------
  public processHl7MllpBuffer(buffer: Buffer): Buffer | null {
    const startIdx = buffer.indexOf(ASCII_CONTROL.VT);
    let endIdx = -1;

    for (let i = startIdx + 1; i < buffer.length - 1; i++) {
      if (buffer[i] === ASCII_CONTROL.FS && buffer[i + 1] === ASCII_CONTROL.CR) {
        endIdx = i;
        break;
      }
    }

    if (startIdx === -1 || endIdx === -1) {
      this.emitTelemetry('INBOUND', 'ERROR_CHECKSUM', buffer, 'HL7 MLLP Framing Error: Missing 0x0B or 0x1C 0x0D envelope');
      return null;
    }

    const hl7Message = buffer.subarray(startIdx + 1, endIdx).toString('utf8');
    this.emitTelemetry('INBOUND', 'VALID', buffer, `Rx HL7 v2.5.1 MLLP Message (${endIdx - startIdx} bytes)`);

    const parsed = this.parseHl7OruR01(hl7Message);
    const ackMessage = this.buildHl7AckR01(parsed.messageControlId, parsed.sendingApplication, parsed.sendingFacility, 'AA');

    this.emitTelemetry('OUTBOUND', 'VALID', ackMessage, `Tx HL7 ACK^R01 (MSA|AA|${parsed.messageControlId})`);
    return ackMessage;
  }

  public parseHl7OruR01(hl7Text: string): {
    messageControlId: string;
    sendingApplication: string;
    sendingFacility: string;
    patient: ParsedPatientRecord;
    order: ParsedOrderRecord;
    results: ParsedClinicalResult[];
    serumIndices: SerumIndices;
  } {
    const segments = hl7Text
      .split(/\r\n|\r|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    let messageControlId = `MSG-${Date.now()}`;
    let sendingApplication = this.analyzerId;
    let sendingFacility = 'LABCORE-DIAGNOSTICS';

    const patient: ParsedPatientRecord = {
      sequenceNumber: 1,
      practicePatientId: '',
      labPatientId: '',
      patientName: 'UNKNOWN',
      birthDate: '',
      sex: 'U',
      attendingPhysician: '',
      wardOrLocation: '',
    };

    const order: ParsedOrderRecord = {
      sequenceNumber: 1,
      specimenBarcode: '',
      instrumentSpecimenId: '',
      rackId: 'HL7-RACK',
      positionNumber: '01',
      requestedTestCodes: [],
      priority: 'R',
      collectedAt: '',
      actionCode: 'N',
      specimenDescriptor: 'SERUM',
      dilutionFactor: 1.0,
    };

    const results: ParsedClinicalResult[] = [];
    const serumIndices: SerumIndices = {
      hemolysisIndex: 0,
      icterusIndex: 0,
      lipemiaIndex: 0,
    };

    for (const seg of segments) {
      const fields = seg.split('|');
      const segType = fields[0];

      if (segType === 'MSH') {
        sendingApplication = fields[2] || this.analyzerId;
        sendingFacility = fields[3] || 'LABCORE';
        messageControlId = fields[9] || messageControlId;
      } else if (segType === 'PID') {
        patient.practicePatientId = (fields[3] || '').split('^')[0] || '';
        patient.labPatientId = fields[2] || patient.practicePatientId;
        const nameComponents = (fields[5] || '').split('^');
        patient.patientName = [nameComponents[1], nameComponents[0]].filter(Boolean).join(' ') || fields[5] || 'UNKNOWN';
        patient.birthDate = fields[7] || '';
        const sexRaw = (fields[8] || 'U').toUpperCase();
        patient.sex = sexRaw === 'M' || sexRaw === 'F' ? sexRaw : 'U';
      } else if (segType === 'OBR') {
        order.specimenBarcode = (fields[2] || fields[3] || '').split('^')[0];
        order.instrumentSpecimenId = (fields[3] || '').split('^')[0];
        const universalService = (fields[4] || '').split('^');
        if (universalService[0]) {
          order.requestedTestCodes.push(universalService[0]);
        }
        order.collectedAt = fields[7] || '';
        order.specimenDescriptor = (fields[15] || 'SERUM').split('^')[0];
      } else if (segType === 'OBX') {
        // OBX|1|NM|K^Potassium^LN||6.4|mmol/L|3.5-5.1|HH|||F|||20261020234200||COBAS
        const seqNum = parseInt(fields[1] || '1', 10);
        const valTypeRaw = (fields[2] || 'NM').toUpperCase();
        const valueType: 'NM' | 'ST' | 'CE' =
          valTypeRaw === 'NM' || valTypeRaw === 'ST' || valTypeRaw === 'CE' ? valTypeRaw : 'ST';

        const obsIdParts = (fields[3] || '').split('^');
        const paramCode = (obsIdParts[0] || 'UNKNOWN').toUpperCase();
        const paramName = obsIdParts[1] || paramCode;
        const rawValue = (fields[5] || '').trim();
        const numericVal = /^-?\d+(\.\d+)?$/.test(rawValue) ? parseFloat(rawValue) : null;

        if (paramCode === 'H_INDEX' || paramCode === 'HEMOLYSIS') {
          serumIndices.hemolysisIndex = numericVal ?? 0;
          continue;
        }
        if (paramCode === 'I_INDEX' || paramCode === 'ICTERUS') {
          serumIndices.icterusIndex = numericVal ?? 0;
          continue;
        }
        if (paramCode === 'L_INDEX' || paramCode === 'LIPEMIA') {
          serumIndices.lipemiaIndex = numericVal ?? 0;
          continue;
        }

        const units = (fields[6] || '').split('^')[0];
        const referenceRange = fields[7] || '';
        const flagRaw = (fields[8] || 'N').toUpperCase();
        const abnormalFlag: AbnormalFlag =
          flagRaw === 'L' ||
          flagRaw === 'H' ||
          flagRaw === 'LL' ||
          flagRaw === 'HH' ||
          flagRaw === 'A' ||
          flagRaw === 'AA'
            ? flagRaw
            : 'N';

        const statusRaw = (fields[11] || 'F').toUpperCase();
        const resultStatus: ResultStatusFlag =
          statusRaw === 'F' || statusRaw === 'C' || statusRaw === 'P' || statusRaw === 'X' || statusRaw === 'I'
            ? statusRaw
            : 'F';

        results.push({
          sequenceNumber: seqNum,
          universalTestId: fields[3] || '',
          parameterCode: paramCode,
          parameterName: paramName,
          value: rawValue,
          numericValue: numericVal,
          valueType,
          units,
          referenceRange,
          abnormalFlag,
          resultStatus,
          completedAt: fields[14] || new Date().toISOString(),
          instrumentId: fields[15] || this.analyzerId,
          operatorId: fields[16] || 'HL7-AUTO',
          dilutionFactor: 1.0,
        });
      }
    }

    const { processedResults, reflexOrders } = this.evaluateInterferenceAndReflexes(
      results,
      serumIndices,
      order.specimenBarcode,
      patient.practicePatientId
    );

    this.emit('clinicalResultsPackage', {
      analyzerId: this.analyzerId,
      patient,
      order,
      serumIndices,
      results: processedResults,
      reflexOrders,
      receivedAt: new Date().toISOString(),
    });

    return {
      messageControlId,
      sendingApplication,
      sendingFacility,
      patient,
      order,
      results: processedResults,
      serumIndices,
    };
  }

  public buildHl7AckR01(
    originalMessageControlId: string,
    receivingApp: string,
    receivingFacility: string,
    ackCode: 'AA' | 'AE' | 'AR' = 'AA',
    textMessage: string = 'Message accepted and processed by NIKIL-LABCORE-ELIS-OS'
  ): Buffer {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const ackControlId = `ACK-${Date.now()}`;

    const msh = `MSH|^~\\&|NIKIL-LABCORE-ELIS|LABCORE-HUB|${receivingApp}|${receivingFacility}|${timestamp}||ACK^R01^ACK|${ackControlId}|P|2.5.1\r`;
    const msa = `MSA|${ackCode}|${originalMessageControlId}|${textMessage}\r`;

    const payload = Buffer.from(`${msh}${msa}`, 'utf8');
    return Buffer.concat([
      Buffer.from([ASCII_CONTROL.VT]),
      payload,
      Buffer.from([ASCII_CONTROL.FS, ASCII_CONTROL.CR]),
    ]);
  }

  private resetSessionRecords(): void {
    this.currentPatient = null;
    this.currentOrder = null;
    this.currentResults = [];
    this.currentQueries = [];
    this.currentSerumIndices = {
      hemolysisIndex: 0,
      icterusIndex: 0,
      lipemiaIndex: 0,
    };
  }

  private emitTelemetry(
    direction: 'INBOUND' | 'OUTBOUND',
    status: 'VALID' | 'ERROR_CHECKSUM' | 'ERROR_PARITY_NAK' | 'QUERY_RESPONSE',
    rawBuffer: Buffer,
    decodedSummary: string,
    expectedChecksum?: string,
    calculatedChecksum?: string
  ): void {
    const hexString = Array.from(rawBuffer)
      .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    const asciiReadable = Array.from(rawBuffer)
      .map((b) => {
        switch (b) {
          case ASCII_CONTROL.STX:
            return '<STX>';
          case ASCII_CONTROL.ETX:
            return '<ETX>';
          case ASCII_CONTROL.ETB:
            return '<ETB>';
          case ASCII_CONTROL.EOT:
            return '<EOT>';
          case ASCII_CONTROL.ENQ:
            return '<ENQ>';
          case ASCII_CONTROL.ACK:
            return '<ACK>';
          case ASCII_CONTROL.NAK:
            return '<NAK>';
          case ASCII_CONTROL.CR:
            return '<CR>';
          case ASCII_CONTROL.LF:
            return '<LF>';
          case ASCII_CONTROL.VT:
            return '<VT>';
          case ASCII_CONTROL.FS:
            return '<FS>';
          default:
            return b >= 32 && b <= 126 ? String.fromCharCode(b) : `.`;
        }
      })
      .join('');

    const eventPayload: RawTelemetryFrameEvent = {
      frameId: `FRM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      analyzerId: this.analyzerId,
      protocol: rawBuffer[0] === ASCII_CONTROL.VT ? 'HL7_MLLP' : 'ASTM_E1381',
      direction,
      status,
      rawBytesHex: hexString,
      rawAsciiReadable: asciiReadable,
      expectedChecksum,
      calculatedChecksum,
      timestamp: new Date().toISOString(),
      decodedSummary,
    };

    this.emit('telemetryFrame', eventPayload);
  }
}
