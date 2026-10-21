import net from "net";
import prisma from "../../../config/database";
import { createAnalyzerLog } from "./analyzer.service";
import {
  AstmFsmParser,
  PendingWorklistOrder,
  ParsedClinicalResult,
  RawTelemetryFrameEvent,
} from "../../../../src/services/analyzer/AstmFsmParser";
import {
  WestgardQcEngine,
  QcLotTargetConfig,
  QcLevel,
} from "../../../../src/services/analyzer/WestgardQcEngine";
import {
  DeltaCheckEngine,
  HistoricalPatientResult,
  CurrentSamplePanelResult,
  PanelDeltaCheckReport,
} from "../../../../src/services/analyzer/DeltaCheckEngine";
import { nexusBioTensorService } from "../nexus/nexus-bio-tensor.service";

/**
 * ============================================================================
 * PRODUCTION PHYSICAL HARDWARE ANALYZER TCP / MLLP SOCKET SERVICE
 * ============================================================================
 * Compliant with:
 *  - ASTM E1381-02 (Low-Level Serial/TCP Transport & Modulo-256 Checksums)
 *  - ASTM E1394-97 (Clinical Data Representation: H, P, O, R, C, Q, L)
 *  - HL7 v2.5.1 MLLP (Minimal Lower Layer Protocol Framing & ORU^R01 / ACK^R01)
 *  - CLSI EP07-A2 (Serum Index Interference Suppression: Hemolysis, Icterus, Lipemia)
 *  - CLSI C24-A4 (Westgard Multi-Rule Quality Control & Parameter Circuit Breaker)
 *  - CLSI EP33 / EFLM (72-Hour Longitudinal Kinetic Delta-Checks & RCV 99%)
 *  - OMNI-SENTINEL™ // NEXUS-BIO-TENSOR™ (High-Dimensional Biophysical Manifold Audit)
 * ============================================================================
 */

export const defaultWestgardQcEngine = new WestgardQcEngine();
export const defaultDeltaCheckEngine = new DeltaCheckEngine(72);

// Pre-register standard QC lot target configurations for core biochemistry parameters
function initializeDefaultQcTargets(qcEngine: WestgardQcEngine) {
  const defaultTargets: QcLotTargetConfig[] = [
    {
      analyzerId: "TCP_ANALYZER_01",
      parameterCode: "K",
      parameterName: "Potassium (Serum)",
      qcLotNumber: "LOT-BIO-K-2026",
      level: "LEVEL_2_NORMAL",
      targetMean: 4.2,
      targetSd: 0.12,
      units: "mmol/L",
      expirationDate: "2027-12-31",
    },
    {
      analyzerId: "TCP_ANALYZER_01",
      parameterCode: "NA",
      parameterName: "Sodium (Serum)",
      qcLotNumber: "LOT-BIO-NA-2026",
      level: "LEVEL_2_NORMAL",
      targetMean: 140.0,
      targetSd: 1.5,
      units: "mmol/L",
      expirationDate: "2027-12-31",
    },
    {
      analyzerId: "TCP_ANALYZER_01",
      parameterCode: "CREA",
      parameterName: "Creatinine (Jaffe)",
      qcLotNumber: "LOT-BIO-CR-2026",
      level: "LEVEL_2_NORMAL",
      targetMean: 1.05,
      targetSd: 0.05,
      units: "mg/dL",
      expirationDate: "2027-12-31",
    },
    {
      analyzerId: "TCP_ANALYZER_01",
      parameterCode: "HGB",
      parameterName: "Hemoglobin",
      qcLotNumber: "LOT-HEM-HGB-2026",
      level: "LEVEL_2_NORMAL",
      targetMean: 13.8,
      targetSd: 0.35,
      units: "g/dL",
      expirationDate: "2027-12-31",
    },
  ];

  for (const cfg of defaultTargets) {
    try {
      qcEngine.registerQcLotTarget(cfg);
    } catch {
      // Ignore duplicate registration errors on service reload
    }
  }
}

initializeDefaultQcTargets(defaultWestgardQcEngine);

/**
 * Resolves pending clinical orders from the database when an analyzer issues
 * an ASTM Host Query (`Q` record) requesting worklist items by specimen barcode.
 */
async function resolveWorklistFromDatabase(barcode: string): Promise<PendingWorklistOrder | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  try {
    const db: any = prisma;
    const sample = await db.sample.findFirst({
      where: {
        OR: [
          { barcode: cleanBarcode },
          { sampleNumber: cleanBarcode },
        ],
      },
    }).catch(() => null);

    if (!sample) return null;

    let patient: any = null;
    if (sample.patientId) {
      patient = await db.patient.findUnique({
        where: { id: sample.patientId },
      }).catch(() => null);
    }

    let order: any = null;
    if (sample.orderId) {
      order = await db.order.findUnique({
        where: { id: sample.orderId },
        include: {
          test: true,
          items: true,
        },
      }).catch(() => null);
    }

    const testCodes: Array<{ testCode: string; dilutionFactor: number }> = [];

    if (order?.test?.code || order?.test?.name) {
      testCodes.push({ testCode: order.test.code || order.test.name, dilutionFactor: 1.0 });
    } else {
      testCodes.push({ testCode: "ROUTINE_CHEM", dilutionFactor: 1.0 });
    }

    const priority: "S" | "R" = order?.priority === "STAT" ? "S" : "R";
    const birthDate = patient?.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().slice(0, 10).replace(/-/g, "")
      : "19800101";

    const sex: "M" | "F" | "U" =
      patient?.gender === "MALE"
        ? "M"
        : patient?.gender === "FEMALE"
        ? "F"
        : "U";

    const lastName = patient?.lastName || "";
    const firstName = patient?.firstName || "";
    const formattedName = [lastName, firstName].filter(Boolean).join("^") || "PATIENT";

    return {
      specimenBarcode: cleanBarcode,
      patientId: patient?.mrn || patient?.id || "UNKNOWN_ID",
      patientName: formattedName,
      birthDate,
      sex,
      priority,
      rackId: "RACK-01",
      positionNumber: "01",
      specimenDescriptor: sample.sampleType || "SERUM",
      tests: testCodes,
    };
  } catch (err: any) {
    console.warn(`[Analyzer TCP] Worklist resolution error for barcode ${barcode}:`, err?.message);
    return null;
  }
}

export class AnalyzerTcpService {
  private server: net.Server | null = null;
  private port: number;
  private activeClients: Map<string, { socket: net.Socket; fsm: AstmFsmParser }> = new Map();

  constructor(port: number = Number(process.env.ANALYZER_TCP_PORT) || 5005) {
    this.port = port;
  }

  public getWestgardEngine(): WestgardQcEngine {
    return defaultWestgardQcEngine;
  }

  public getDeltaCheckEngine(): DeltaCheckEngine {
    return defaultDeltaCheckEngine;
  }

  public start(): net.Server {
    if (this.server) return this.server;

    this.server = net.createServer((socket: net.Socket) => {
      const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
      const analyzerId = `TCP_ANALYZER_${socket.remotePort || "01"}`;
      console.log(`[Analyzer TCP] Instrument connected: ${clientAddress} (Assigned ID: ${analyzerId})`);

      // Initialize bidirectional ASTM E1381/E1394 & HL7 MLLP FSM for this physical socket
      const fsm = new AstmFsmParser(analyzerId, resolveWorklistFromDatabase);
      this.activeClients.set(clientAddress, { socket, fsm });

      // Handle raw telemetry frames for real-time live packet sniffer
      fsm.on("telemetryFrame", (event: RawTelemetryFrameEvent) => {
        if (event.status !== "VALID") {
          console.warn(`[Analyzer TCP Telemetry] ${event.analyzerId} [${event.status}] ${event.decodedSummary}`);
        }
      });

      // Handle pre-analytical interference suppression alerts (CLSI EP07-A2)
      fsm.on("interferenceAlert", (alert) => {
        console.warn(
          `[Analyzer TCP CLSI EP07-A2 Alert] Barcode ${alert.specimenBarcode} - ${alert.parameterCode}: ${alert.flag?.clinicalNotice}`
        );
      });

      // Handle dynamically generated reflex & cascade test orders
      fsm.on("reflexOrderTriggered", (reflex) => {
        console.log(
          `[Analyzer TCP Reflex Order] Rule ${reflex.reflexRuleId} triggered for Barcode ${reflex.specimenBarcode}: Ordering ${reflex.reflexTests
            .map((t: { testCode: string }) => t.testCode)
            .join(", ")}`
        );
      });

      // Handle complete validated clinical results package
      fsm.on("clinicalResultsPackage", async (pkg) => {
        console.log(
          `[Analyzer TCP] Received Clinical Results Package from ${pkg.analyzerId}: Barcode ${pkg.order?.specimenBarcode || "UNKNOWN"} (${pkg.results.length} parameters)`
        );

        // 1. Check Westgard QC Circuit Breaker for each parameter
        for (const res of pkg.results) {
          const qcCheck = defaultWestgardQcEngine.canReleasePatientResult(pkg.analyzerId, res.parameterCode);
          if (!qcCheck.allowed) {
            res.resultStatus = "X"; // Quarantine result from auto-release
            console.warn(`[Analyzer TCP] ${qcCheck.reason}`);
          }
        }

        // 2. Perform 72-Hour Kinetic Delta-Check & Mislabeling Detection
        let deltaReport: PanelDeltaCheckReport | null = null;
        try {
          const barcode = pkg.order?.specimenBarcode;
          const currentPanel: CurrentSamplePanelResult[] = pkg.results
            .filter((r: ParsedClinicalResult) => r.numericValue !== null)
            .map((r: ParsedClinicalResult) => ({
              parameterCode: r.parameterCode,
              parameterName: r.parameterName,
              numericValue: r.numericValue!,
              units: r.units,
              collectedAt: r.completedAt,
              specimenBarcode: barcode || "",
            }));

          // Query previous patient results within 72h
          const historicalRecords: HistoricalPatientResult[] = [];
          if (barcode) {
            const db: any = prisma;
            const sample = await db.sample.findFirst({
              where: {
                OR: [{ barcode }, { sampleNumber: barcode }],
              },
            }).catch(() => null);

            const patientId = sample?.patientId;
            if (patientId) {
              const lookbackDate = new Date(Date.now() - 72 * 3600 * 1000);
              const pastValues: any[] = await db.resultValue.findMany({
                where: {
                  result: {
                    order: { patientId },
                    createdAt: { gte: lookbackDate },
                  },
                },
                include: { parameter: true, result: true },
                orderBy: { createdAt: "desc" },
                take: 50,
              }).catch(() => []);

              for (const pv of pastValues) {
                const num = Number(pv.value);
                const paramCode = (pv.parameter?.shortName || pv.parameter?.parameterName || "").toUpperCase();
                if (Number.isFinite(num) && paramCode) {
                  historicalRecords.push({
                    resultId: pv.id,
                    parameterCode: paramCode,
                    numericValue: num,
                    units: pv.parameter?.unit || "",
                    collectedAt: pv.result?.createdAt instanceof Date ? pv.result.createdAt.toISOString() : new Date().toISOString(),
                    specimenBarcode: barcode,
                  });
                }
              }
            }
          }

          if (currentPanel.length > 0) {
            deltaReport = defaultDeltaCheckEngine.evaluatePatientPanel({
              patientId: pkg.patient?.practicePatientId || "UNKNOWN",
              specimenBarcode: barcode || "UNKNOWN",
              currentPanel,
              historicalRecords,
            });

            if (deltaReport.holdAutoverification) {
              console.warn(
                `[Analyzer TCP Delta-Check ALERT] Classification: ${deltaReport.overallClassification}. Action: ${deltaReport.recommendedClinicalAction}`
              );
            }
          }
        } catch (deltaErr: any) {
          console.warn("[Analyzer TCP] Delta-check evaluation note:", deltaErr?.message);
        }

        // 3. Trigger OMNI-SENTINEL™ // NEXUS-BIO-TENSOR™ Biophysical Manifold Audit
        if (pkg.order?.specimenBarcode) {
          try {
            await nexusBioTensorService.performBioTensorAudit(pkg.order.specimenBarcode);
            console.log(
              `[Analyzer TCP] NEXUS-BIO-TENSOR™ biophysical audit evaluated for specimen ${pkg.order.specimenBarcode}`
            );
          } catch (nexusErr: any) {
            console.warn(
              `[Analyzer TCP] NEXUS-BIO-TENSOR™ audit note for ${pkg.order.specimenBarcode}:`,
              nexusErr?.message
            );
          }
        }

        // 4. Persist structured record into AnalyzerLog audit trail
        try {
          await createAnalyzerLog({
            machineName: pkg.analyzerId,
            machineCode: pkg.analyzerId,
            protocol: "ASTM",
            barcode: pkg.order?.specimenBarcode,
            orderNumber: pkg.order?.instrumentSpecimenId || pkg.order?.specimenBarcode,
            rawMessage: `ASTM E1394 Parsed Package: ${pkg.results.length} results, ${pkg.reflexOrders.length} reflex orders`,
            parsedJson: {
              patient: pkg.patient,
              order: pkg.order,
              serumIndices: pkg.serumIndices,
              results: pkg.results,
              reflexOrders: pkg.reflexOrders,
              deltaCheck: deltaReport,
              receivedAt: pkg.receivedAt,
            },
          });
        } catch (logErr: any) {
          console.error("[Analyzer TCP] Failed to write AnalyzerLog record:", logErr?.message);
        }
      });

      // Ingest inbound stream through deterministic state machine
      socket.on("data", async (chunk: Buffer) => {
        try {
          const outboundResponses = await fsm.ingestRawBytes(chunk);
          for (const responseBuf of outboundResponses) {
            socket.write(responseBuf);
          }
        } catch (parseErr: any) {
          console.error(`[Analyzer TCP] Protocol parse exception (${clientAddress}):`, parseErr?.message);
        }
      });

      socket.on("error", (err: any) => {
        console.warn(`[Analyzer TCP] Socket error (${clientAddress}):`, err?.message);
      });

      socket.on("close", () => {
        console.log(`[Analyzer TCP] Disconnected: ${clientAddress}`);
        this.activeClients.delete(clientAddress);
      });
    });

    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(
        `[Analyzer TCP] Physical Hardware Listener active on port ${this.port} (ASTM E1381/E1394 & HL7 MLLP FSM ready)`
      );
    });

    this.server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(
          `[Analyzer TCP] Port ${this.port} is already bound. TCP hardware bridge will reuse existing instance.`
        );
      } else {
        console.error("[Analyzer TCP] Server error:", err);
      }
    });

    return this.server;
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.activeClients.values()) {
        try {
          client.socket.destroy();
        } catch {
          // Ignore close errors
        }
      }
      this.activeClients.clear();

      if (!this.server) return resolve();
      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }
}

export const defaultAnalyzerTcpService = new AnalyzerTcpService();
export const startAnalyzerTcpServer = (port?: number) => {
  const service = port ? new AnalyzerTcpService(port) : defaultAnalyzerTcpService;
  return service.start();
};
