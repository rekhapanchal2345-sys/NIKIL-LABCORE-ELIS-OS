import net from "net";
import { parseASTMMessage, parseHL7Message, createAnalyzerLog } from "./analyzer.service";

/**
 * ISS-011: Physical Hardware Analyzer TCP / MLLP Socket Service
 * Supports bidirectional communication with laboratory instruments using:
 *  1. HL7 v2.x over MLLP (Minimal Lower Layer Protocol) framing: <VT> (0x0B) ... <FS><CR> (0x1C, 0x0D)
 *  2. ASTM E1381 framing: <ENQ>, <STX>...<ETX>[checksum]<CR><LF>, <EOT>, <ACK>, <NAK>
 */

const VT = 0x0b;
const FS = 0x1c;
const CR = 0x0d;
const LF = 0x0a;
const ENQ = 0x05;
const ACK = 0x06;
const NAK = 0x15;
const EOT = 0x04;
const STX = 0x02;
const ETX = 0x03;
const ETB = 0x17;

export class AnalyzerTcpService {
  private server: net.Server | null = null;
  private port: number;

  constructor(port: number = Number(process.env.ANALYZER_TCP_PORT) || 5005) {
    this.port = port;
  }

  public start(): net.Server {
    if (this.server) return this.server;

    this.server = net.createServer((socket: net.Socket) => {
      const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`[Analyzer TCP] Connected: ${clientAddress}`);

      let buffer = Buffer.alloc(0);
      let astmAccumulator = "";

      socket.on("data", async (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);

        // Check for ASTM E1381 Control characters
        if (chunk.length === 1 && chunk[0] === ENQ) {
          // Analyzer requests line access -> respond with ACK
          socket.write(Buffer.from([ACK]));
          buffer = Buffer.alloc(0);
          astmAccumulator = "";
          return;
        }

        if (chunk.length === 1 && chunk[0] === EOT) {
          // Analyzer finished transmission -> process accumulated ASTM message
          if (astmAccumulator.trim()) {
            try {
              const parsed: any = parseASTMMessage(astmAccumulator);
              console.log(`[Analyzer TCP] ASTM E1381 Message received from ${clientAddress}`);
              await createAnalyzerLog({
                machineName: "TCP Hardware Analyzer",
                machineCode: "TCP_ANALYZER_01",
                protocol: "ASTM",
                rawMessage: astmAccumulator,
                parsedJson: parsed?.success && parsed?.message ? parsed.message : undefined,
              }).catch(() => {});
            } catch (err: any) {
              console.error("[Analyzer TCP] Failed to parse ASTM payload:", err?.message);
            }
          }
          buffer = Buffer.alloc(0);
          astmAccumulator = "";
          return;
        }

        // Process ASTM frame: STX ... (ETX|ETB) [chk] CR LF
        if (buffer[0] === STX) {
          const etxIdx = buffer.indexOf(ETX);
          const etbIdx = buffer.indexOf(ETB);
          const endIdx = etxIdx !== -1 ? etxIdx : etbIdx;

          if (endIdx !== -1 && buffer.length >= endIdx + 5) {
            // Frame is complete
            const frameContent = buffer.subarray(1, endIdx).toString("utf8");
            astmAccumulator += frameContent + "\n";
            buffer = buffer.subarray(endIdx + 5);
            socket.write(Buffer.from([ACK]));
            return;
          }
        }

        // Process HL7 MLLP: <VT> payload <FS><CR>
        const vtIdx = buffer.indexOf(VT);
        if (vtIdx !== -1) {
          const fsIdx = buffer.indexOf(FS, vtIdx);
          if (fsIdx !== -1 && buffer.length > fsIdx + 1 && buffer[fsIdx + 1] === CR) {
            const hl7Payload = buffer.subarray(vtIdx + 1, fsIdx).toString("utf8");
            buffer = buffer.subarray(fsIdx + 2);

            try {
              const parsed: any = parseHL7Message(hl7Payload);
              console.log(`[Analyzer TCP] HL7 MLLP Message received from ${clientAddress}`);

              // Extract MSH-10 Message Control ID
              let controlId = "1";
              const mshMatch = hl7Payload.match(/^MSH\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([^|\r\n]+)/m);
              if (mshMatch && mshMatch[1]) {
                controlId = mshMatch[1];
              }

              // Build MLLP ACK response: MSA|AA|<controlId>
              const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
              const ackHl7 = `MSH|^~\\&|LABCORE_ELIS|LAB|ANALYZER|INSTRUMENT|${timestamp}||ACK|${Date.now()}|P|2.5\rMSA|AA|${controlId}\r`;
              const ackBuffer = Buffer.concat([
                Buffer.from([VT]),
                Buffer.from(ackHl7, "utf8"),
                Buffer.from([FS, CR]),
              ]);

              socket.write(ackBuffer);

              await createAnalyzerLog({
                machineName: "TCP Hardware Analyzer",
                machineCode: "TCP_ANALYZER_01",
                protocol: "HL7",
                rawMessage: hl7Payload,
                parsedJson: parsed?.success && parsed?.message ? parsed.message : undefined,
              }).catch(() => {});
            } catch (err: any) {
              console.error("[Analyzer TCP] Failed to parse HL7 MLLP:", err?.message);
              // Send NACK
              const nackHl7 = `MSH|^~\\&|LABCORE_ELIS|LAB|||${Date.now()}||ACK|${Date.now()}|P|2.5\rMSA|AE|0|${err?.message || "Parsing error"}\r`;
              const nackBuffer = Buffer.concat([
                Buffer.from([VT]),
                Buffer.from(nackHl7, "utf8"),
                Buffer.from([FS, CR]),
              ]);
              socket.write(nackBuffer);
            }
          }
        }
      });

      socket.on("error", (err) => {
        console.warn(`[Analyzer TCP] Socket error (${clientAddress}):`, err.message);
      });

      socket.on("close", () => {
        console.log(`[Analyzer TCP] Disconnected: ${clientAddress}`);
      });
    });

    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(`[Analyzer TCP] Hardware listener active on port ${this.port} (HL7 MLLP & ASTM E1381 ready)`);
    });

    this.server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`[Analyzer TCP] Port ${this.port} is already bound. TCP hardware bridge will reuse existing instance.`);
      } else {
        console.error("[Analyzer TCP] Server error:", err);
      }
    });

    return this.server;
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
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
