import { describe, it, expect } from './framework';
import { AstmFsmParser, ASCII_CONTROL, ParsedClinicalResult } from '../src/services/analyzer/AstmFsmParser';

// Helper to build frame
const buildFrame = (seq: number, data: string, isIntermediate = false, overrideChecksum?: string) => {
  const frameBody = Buffer.from(`${seq}${data}`, 'ascii');
  const terminatorByte = isIntermediate ? ASCII_CONTROL.ETB : ASCII_CONTROL.ETX;
  const bodyWithTerminator = Buffer.concat([frameBody, Buffer.from([terminatorByte])]);
  const checksum = overrideChecksum || AstmFsmParser.calculateAstmChecksum(bodyWithTerminator);
  return Buffer.concat([
    Buffer.from([ASCII_CONTROL.STX]),
    bodyWithTerminator,
    Buffer.from(`${checksum}\r\n`, 'ascii')
  ]);
};

describe('AstmFsmParser', () => {
  it('calculateAstmChecksum - Validates correctly', () => {
    const frameBody = Buffer.from('1H|\\^&|||LabCore^Host|||||||P|1|20261026', 'ascii');
    const bodyWithEtx = Buffer.concat([frameBody, Buffer.from([ASCII_CONTROL.ETX])]);
    const checksum = AstmFsmParser.calculateAstmChecksum(bodyWithEtx);
    expect(typeof checksum).toBe('string');
    expect(checksum.length).toBe(2);
  });

  it('ingestRawBytes - ENQ transition', async () => {
    const parser = new AstmFsmParser("TEST_ANALYZER");
    expect(parser.getState()).toBe('IDLE');
    const response = await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));
    expect(parser.getState()).toBe('WAITING_FRAME');
    expect(response.length).toBe(1);
    expect(response[0][0]).toBe(ASCII_CONTROL.ACK);
  });

  it('ingestRawBytes - Full session parses patient and result', async () => {
    const parser = new AstmFsmParser("TEST_ANALYZER");
    let resultPackage: any = null;
    parser.on('clinicalResultsPackage', (pkg) => {
      resultPackage = pkg;
    });

    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));
    await parser.ingestRawBytes(buildFrame(1, 'H|\\^&|||LabCore^Host|||||||P|1|20261026'));
    await parser.ingestRawBytes(buildFrame(2, 'P|1||UHID-TEST-001||Verma^Aditya||19880415|M'));
    await parser.ingestRawBytes(buildFrame(3, 'O|1|SMP-CBC-001||^^^CBC|R|20261026100000'));
    await parser.ingestRawBytes(buildFrame(4, 'R|1|^^^HGB|14.5|g/dL|13.0-17.0|N||F'));
    await parser.ingestRawBytes(buildFrame(5, 'L|1|N'));
    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.EOT]));

    expect(resultPackage).toBeTruthy();
    expect(resultPackage.results.length).toBe(1);
    expect(resultPackage.results[0].parameterCode).toBe('HGB');
    expect(resultPackage.results[0].numericValue).toBe(14.5);
    expect(resultPackage.patient.patientName).toBe('Aditya Verma');
  });

  it('ingestRawBytes - Invalid checksum responds with NAK', async () => {
    const parser = new AstmFsmParser("TEST_ANALYZER");
    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));

    // Provide a purposely invalid checksum "FF"
    const badFrame = buildFrame(1, 'H|\\^&|||LabCore^Host|||||||P|1|20261026', false, 'FF');
    const response = await parser.ingestRawBytes(badFrame);

    expect(response.length).toBe(1);
    expect(response[0][0]).toBe(ASCII_CONTROL.NAK);
  });

  it('ingestRawBytes - Interference suppression (Hemolysis)', async () => {
    const parser = new AstmFsmParser("TEST_ANALYZER");
    let resultPackage: any = null;
    let alertPackage: any = null;
    parser.on('clinicalResultsPackage', (pkg) => {
      resultPackage = pkg;
    });
    parser.on('interferenceAlert', (alert) => {
      alertPackage = alert;
    });

    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));
    await parser.ingestRawBytes(buildFrame(1, 'H|\\^&|||LabCore^Host|||||||P|1|20261026'));
    await parser.ingestRawBytes(buildFrame(2, 'P|1||UHID-TEST-002||Smith^John||19800101|M'));
    await parser.ingestRawBytes(buildFrame(3, 'O|1|SMP-CHEM-002||^^^CHEM|R|20261026100000'));
    // Send high potassium result
    await parser.ingestRawBytes(buildFrame(4, 'R|1|^^^K|6.5|mmol/L|3.5-5.1|H||F'));
    // Send Hemolysis index result (250 is > 100 max threshold for Potassium)
    await parser.ingestRawBytes(buildFrame(5, 'R|2|^^^HEMOLYSIS|250|mg/dL||N||F'));
    await parser.ingestRawBytes(buildFrame(6, 'L|1|N'));
    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.EOT]));

    expect(resultPackage).toBeTruthy();
    expect(alertPackage).toBeTruthy();

    const kResult = resultPackage.results.find((r: ParsedClinicalResult) => r.parameterCode === 'K');
    expect(kResult).toBeTruthy();
    expect(kResult.resultStatus).toBe('X');
    expect(kResult.interferenceFlag).toBeTruthy();
    expect(kResult.interferenceFlag.suppressed).toBe(true);
    expect(kResult.interferenceFlag.violatedIndex).toBe('HEMOLYSIS');
  });

  it('ingestRawBytes - Reflex Order Generation (TSH Cascade)', async () => {
    const parser = new AstmFsmParser("TEST_ANALYZER");
    let resultPackage: any = null;
    let reflexPackage: any = null;

    parser.on('clinicalResultsPackage', (pkg) => {
      resultPackage = pkg;
    });
    parser.on('reflexOrderTriggered', (reflex) => {
      reflexPackage = reflex;
    });

    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));
    await parser.ingestRawBytes(buildFrame(1, 'H|\\^&|||LabCore^Host|||||||P|1|20261026'));
    await parser.ingestRawBytes(buildFrame(2, 'P|1||UHID-TEST-003||Doe^Jane||19750505|F'));
    await parser.ingestRawBytes(buildFrame(3, 'O|1|SMP-THY-003||^^^THYROID|R|20261026100000'));
    // Send high TSH result (Threshold for reflex is > 4.5)
    await parser.ingestRawBytes(buildFrame(4, 'R|1|^^^TSH|5.2|mIU/L|0.4-4.0|H||F'));
    await parser.ingestRawBytes(buildFrame(5, 'L|1|N'));
    await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.EOT]));

    expect(resultPackage).toBeTruthy();
    expect(reflexPackage).toBeTruthy();
    expect(reflexPackage.reflexRuleId).toBe('REFLEX-THYROID-CASCADE');
    expect(reflexPackage.reflexTests.length).toBe(2);
  });
});
