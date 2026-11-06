/**
 * AutoPin Pro - License Digital Signature Public Key & Verifier
 *
 * Security:
 * - Uses asymmetric ECDSA with NIST P-256 (secp256r1) curve and SHA-256.
 * - This file contains ONLY the public verification key (SPKI format).
 * - The private signing key is stored exclusively in Firebase Secret Manager on the server.
 * - Tampering with any field in the offline token invalidates the cryptographic signature.
 */

export const AUTOPIN_LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMWMjMfifbpamgc6e82mXinHyC7Mk
CSLSY8lY58HFJbIjNrVnlbtzK8D2k+Y4o9RF19KwbqOp4fbdFSqE65u3xw==
-----END PUBLIC KEY-----`.trim();

/**
 * Converts a PEM-formatted public key string to an ArrayBuffer (SPKI DER bytes).
 */
export function pemToSpkiBuffer(pem: string): ArrayBuffer {
  const b64Lines = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');
  const binaryString = atob(b64Lines);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

let cachedCryptoPublicKey: CryptoKey | null = null;

/**
 * Imports the public key into the WebCrypto API for local signature verification.
 */
export async function getLicenseVerifierKey(): Promise<CryptoKey> {
  if (cachedCryptoPublicKey) {
    return cachedCryptoPublicKey;
  }

  const spkiBuffer = pemToSpkiBuffer(AUTOPIN_LICENSE_PUBLIC_KEY_PEM);
  cachedCryptoPublicKey = await crypto.subtle.importKey(
    'spki',
    spkiBuffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['verify']
  );

  return cachedCryptoPublicKey;
}

/**
 * Builds the canonical byte payload string for an offline lease.
 * Must match server payload byte-for-byte:
 * ${licenseId}|${deviceId}|${issuedAtServer}|${validUntilServer}|${licenseExpiresAt}
 */
export function buildCanonicalLeasePayload(
  licenseId: string,
  deviceId: string,
  issuedAtServer: number,
  validUntilServer: number,
  licenseExpiresAt: number
): Uint8Array {
  const canonical = `${licenseId}|${deviceId}|${issuedAtServer}|${validUntilServer}|${licenseExpiresAt}`;
  return new TextEncoder().encode(canonical);
}

/**
 * Converts a DER/IEEE P1363 ECDSA signature to IEEE P1363 format (64 bytes: r + s) if needed by WebCrypto.
 */
export function normalizeSignatureToP1363(sigBase64: string): Uint8Array {
  const rawBytes = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0));

  // If already 64 bytes (R (32 bytes) + S (32 bytes)), return directly
  if (rawBytes.length === 64) {
    return rawBytes;
  }

  // If in ASN.1 DER format (0x30 ...), parse R and S
  if (rawBytes[0] === 0x30) {
    let offset = 2;
    if (rawBytes[1] & 0x80) {
      offset += (rawBytes[1] & 0x7f);
    }

    // Read R
    if (rawBytes[offset] !== 0x02) throw new Error('Malformed DER signature');
    const rLen = rawBytes[offset + 1];
    let r = rawBytes.subarray(offset + 2, offset + 2 + rLen);
    offset += 2 + rLen;

    // Read S
    if (rawBytes[offset] !== 0x02) throw new Error('Malformed DER signature');
    const sLen = rawBytes[offset + 1];
    let s = rawBytes.subarray(offset + 2, offset + 2 + sLen);

    // Strip leading zeroes if length > 32
    if (r.length > 32) r = r.subarray(r.length - 32);
    if (s.length > 32) s = s.subarray(s.length - 32);

    const p1363 = new Uint8Array(64);
    p1363.set(r, 32 - r.length);
    p1363.set(s, 64 - s.length);
    return p1363;
  }

  return rawBytes;
}

/**
 * Verifies the ECDSA P-256 signature of an offline lease token.
 */
export async function verifyLeaseTokenSignature(
  licenseId: string,
  deviceId: string,
  issuedAtServer: number,
  validUntilServer: number,
  licenseExpiresAt: number,
  signatureBase64: string
): Promise<boolean> {
  try {
    const key = await getLicenseVerifierKey();
    const data = buildCanonicalLeasePayload(
      licenseId,
      deviceId,
      issuedAtServer,
      validUntilServer,
      licenseExpiresAt
    );
    const signatureBytes = normalizeSignatureToP1363(signatureBase64);

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      key,
      signatureBytes as any,
      data as any
    );
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}
