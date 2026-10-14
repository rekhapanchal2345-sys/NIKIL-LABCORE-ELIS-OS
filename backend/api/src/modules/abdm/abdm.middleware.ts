import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { abdmConfig } from "./abdm.config";
import { HttpError } from "../../utils/http-error";

// In-memory cache for the ABDM Gateway public key/certs
import crypto from "crypto";
let gatewayCerts: any = null;
let certsExpiry = 0;

async function getGatewayCerts() {
  if (gatewayCerts && Date.now() < certsExpiry) {
    return gatewayCerts;
  }
  
  const certsUrl = `${abdmConfig.gatewayBaseUrl}/v0.5/certs`;
  try {
    const response = await fetch(certsUrl);
    if (!response.ok) throw new Error(`Failed to fetch certs: ${response.status}`);
    gatewayCerts = await response.json();
    // Cache for 24 hours
    certsExpiry = Date.now() + 24 * 60 * 60 * 1000;
    return gatewayCerts;
  } catch (error) {
    console.error("Error fetching ABDM Gateway Certs:", error);
    throw new HttpError("Gateway Signature Verification Failed", 401, "GATEWAY_CERTS_FAILED");
  }
}

/**
 * Middleware to verify signatures on incoming ABDM Gateway webhooks (v0.5).
 * The gateway sends a Bearer token in the Authorization header.
 * We must verify this JWT using the public certificates published by the gateway.
 */
export const verifyAbdmGatewaySignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (abdmConfig.mockMode) {
    return next();
  }

  const authHeader = req.headers.authorization || (req.headers["x-gateway-authorization"] as string);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new HttpError(
        "Missing or invalid Authorization header from ABDM Gateway",
        401,
        "MISSING_GATEWAY_AUTH"
      )
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const certs = await getGatewayCerts();
    
    // In a full implementation, we'd match the 'kid' from the token header 
    // against the certs array, extract the public key, and verify the signature.
    // For now, we perform a structural verification or use a known public key from certs.
    // Assuming the first key for simplicity, or ideally using a library like jwks-rsa.
    
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header) {
      throw new Error("Invalid token format");
    }
    
    const kid = decodedHeader.header.kid;
    const key = certs.keys?.find((k: any) => k.kid === kid);
    
    if (!key) {
      throw new Error("Matching public key not found in Gateway certs");
    }

    // Convert JWK to PEM to verify
    const publicKeyPem = crypto
      .createPublicKey({ key: key, format: "jwk" })
      .export({ type: "spki", format: "pem" });
    
    // Actually verify the signature
    const decoded = jwt.verify(token, publicKeyPem, { algorithms: ["RS256"] });
    if (!decoded) throw new Error("Verification failed");

    // Success
    next();
  } catch (error: any) {
    console.error("Gateway Signature Verification error:", error);
    next(new HttpError(`Gateway Signature Invalid: ${error.message}`, 401, "INVALID_GATEWAY_SIGNATURE"));
  }
};
