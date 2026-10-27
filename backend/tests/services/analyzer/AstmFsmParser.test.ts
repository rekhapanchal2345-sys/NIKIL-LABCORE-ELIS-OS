import { AstmFsmParser, ASCII_CONTROL } from '../../../src/services/analyzer/AstmFsmParser';
import { describe, it, expect, runner } from '../../framework';

describe('AstmFsmParser', () => {
    it('initializes in IDLE state', () => {
        const parser = new AstmFsmParser('TEST_ANALYZER');
        expect(parser.getState()).toBe('IDLE');
    });

    it('calculates correct ASTM checksum', () => {
        // Frame starting after STX (omitted) and ending with ETX or ETB
        // Example: '1H|\^&|||TEST_ANALYZER||||||||1\r<ETX>'
        const content = '1H|\\^&|||TEST_ANALYZER||||||||1\r';
        const payload = Buffer.concat([Buffer.from(content, 'ascii'), Buffer.from([ASCII_CONTROL.ETX])]);

        // Let's compute manually: sum of bytes in payload
        let sum = 0;
        for(let i=0; i<payload.length; i++) {
            sum = (sum + payload[i]) & 0xFF;
        }
        const expectedChecksum = sum.toString(16).toUpperCase().padStart(2, '0');

        const checksum = AstmFsmParser.calculateAstmChecksum(payload);
        expect(checksum).toBe(expectedChecksum);
    });

    it('ingests ENQ and transitions to WAITING_FRAME', async () => {
        const parser = new AstmFsmParser('TEST_ANALYZER');
        const responses = await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));
        expect(parser.getState()).toBe('WAITING_FRAME');
        expect(responses.length).toBe(1);
        expect(responses[0][0]).toBe(ASCII_CONTROL.ACK);
    });

    it('processes HL7 MLLP message', async () => {
        const parser = new AstmFsmParser('TEST_ANALYZER');
        const hl7Message = 'MSH|^~\\&|SENDING_APP|SENDING_FAC|REC_APP|REC_FAC|20231027120000||ORU^R01|MSG12345|P|2.5.1\rPID|1||PAT123||DOE^JOHN||19800101|M\r';
        const buffer = Buffer.concat([
            Buffer.from([ASCII_CONTROL.VT]),
            Buffer.from(hl7Message, 'utf8'),
            Buffer.from([ASCII_CONTROL.FS, ASCII_CONTROL.CR])
        ]);

        const responses = await parser.ingestRawBytes(buffer);
        expect(responses.length).toBe(1);
        const ackBuffer = responses[0];

        expect(ackBuffer[0]).toBe(ASCII_CONTROL.VT);
        expect(ackBuffer[ackBuffer.length - 2]).toBe(ASCII_CONTROL.FS);
        expect(ackBuffer[ackBuffer.length - 1]).toBe(ASCII_CONTROL.CR);

        const ackString = ackBuffer.toString('utf8');
        // MSA segment should contain AA and the original message ID
        expect(ackString.includes('MSA|AA|MSG12345')).toBe(true);
    });

    it('ingests EOT and transitions back to IDLE', async () => {
        const parser = new AstmFsmParser('TEST_ANALYZER');

        // Put it in WAITING_FRAME state first
        await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));
        expect(parser.getState()).toBe('WAITING_FRAME');

        // Then send EOT
        const responses = await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.EOT]));
        expect(parser.getState()).toBe('IDLE');
        // EOT finalize session might not output response unless query orders are resolved
        expect(responses.length).toBe(0);
    });

    it('ingests full valid frame and transitions back to WAITING_FRAME', async () => {
        const parser = new AstmFsmParser('TEST_ANALYZER');
        await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));

        const content = '1H|\\^&|||TEST_ANALYZER||||||||1\r';
        const payload = Buffer.concat([Buffer.from(content, 'ascii'), Buffer.from([ASCII_CONTROL.ETX])]);
        const checksum = AstmFsmParser.calculateAstmChecksum(payload);

        const frameBuffer = Buffer.concat([
            Buffer.from([ASCII_CONTROL.STX]),
            payload,
            Buffer.from(checksum, 'ascii'),
            Buffer.from([ASCII_CONTROL.CR, ASCII_CONTROL.LF])
        ]);

        const responses = await parser.ingestRawBytes(frameBuffer);

        expect(parser.getState()).toBe('WAITING_FRAME'); // Sent ACK and ready for next frame
        expect(responses.length).toBe(1);
        expect(responses[0][0]).toBe(ASCII_CONTROL.ACK);
    });

    it('rejects frame with invalid checksum', async () => {
        const parser = new AstmFsmParser('TEST_ANALYZER');
        await parser.ingestRawBytes(Buffer.from([ASCII_CONTROL.ENQ]));

        const content = '1H|\\^&|||TEST_ANALYZER||||||||1\r';
        const payload = Buffer.concat([Buffer.from(content, 'ascii'), Buffer.from([ASCII_CONTROL.ETX])]);

        // Deliberately incorrect checksum
        const frameBuffer = Buffer.concat([
            Buffer.from([ASCII_CONTROL.STX]),
            payload,
            Buffer.from('00', 'ascii'), // wrong checksum
            Buffer.from([ASCII_CONTROL.CR, ASCII_CONTROL.LF])
        ]);

        const responses = await parser.ingestRawBytes(frameBuffer);

        // Wait for next attempt, outputs NAK
        expect(parser.getState()).toBe('WAITING_FRAME');
        expect(responses.length).toBe(1);
        expect(responses[0][0]).toBe(ASCII_CONTROL.NAK);
    });
});

runner.run().then((res) => {
    if (!res.success) { process.exit(1); }
});
