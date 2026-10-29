import { webcrypto } from 'crypto';

/**
 * ==============================================================================
 * NIKIL-LABCORE-ELIS-OS: ENTERPRISE CRYPTOGRAPHIC SIGNATURE UTILITY
 * COMPLIANCE: NABL ISO 15189:2022
 * ==============================================================================
 * 
 * In clinical setups, "Approving" an AI output isn't just a boolean flag in a DB.
 * It requires a non-repudiable cryptographic signature using the Pathologist's
 * private key. This module handles the browser/server-side cryptography for that.
 */

export class NablDigitalSigner {
    
    /**
     * Generates a SHA-256 hash of the finalized NLP Clinical Inference data.
     * Any change in the data (even a single character) will completely change the hash.
     */
    static async generatePayloadHash(inferenceData: Record<string, any>): Promise<string> {
        // Deterministic JSON stringify to ensure consistent hashing
        const sortedData = this.sortObjectKeys(inferenceData);
        const payloadString = JSON.stringify(sortedData);
        
        const encoder = new TextEncoder();
        const data = encoder.encode(payloadString);
        
        // Use WebCrypto API (compatible with Edge runtimes and Next.js)
        const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
        
        // Convert Buffer to Hex String
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    /**
     * Signs the generated hash using the Pathologist's securely stored Private Key.
     * Note: In a real-world enterprise app, the private key NEVER leaves the user's secure enclave (e.g. YubiKey/SmartCard)
     * For this frontend simulation, we use an imported CryptoKey.
     */
    static async signHash(hashHex: string, privateKey: webcrypto.CryptoKey): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(hashHex);

        const signatureBuffer = await webcrypto.subtle.sign(
            {
                name: "RSASSA-PKCS1-v1_5",
            },
            privateKey,
            data
        );

        // Convert Signature Buffer to Base64 for HTTP transmission
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));
        
        return signatureBase64;
    }

    /**
     * Helper: Recursively sorts object keys so JSON.stringify is deterministic.
     */
    private static sortObjectKeys(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(NablDigitalSigner.sortObjectKeys);
        }
        return Object.keys(obj)
            .sort()
            .reduce((result: any, key: string) => {
                result[key] = NablDigitalSigner.sortObjectKeys(obj[key]);
                return result;
            }, {});
    }
}
