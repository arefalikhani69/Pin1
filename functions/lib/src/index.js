"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferLicenseDevice = exports.revokeLicense = exports.renewLicense = exports.verifyLicense = exports.activateLicense = exports.issueLicense = exports.requestDeviceChallenge = void 0;
exports.normalizeActivationKey = normalizeActivationKey;
exports.hashActivationKey = hashActivationKey;
exports.deriveDeviceIdFromPublicKey = deriveDeviceIdFromPublicKey;
exports.formatSpkiToPem = formatSpkiToPem;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
admin.initializeApp();
const db = admin.firestore();
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const BOOTSTRAP_ADMIN_EMAIL = 'arefalikhani69@gmail.com';
/**
 * Normalizes an activation key string (removes hyphens, spaces, uppercase).
 */
function normalizeActivationKey(rawKey) {
    return rawKey.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
/**
 * Computes SHA-256 hash of an activation key.
 */
function hashActivationKey(rawKey) {
    const normalized = normalizeActivationKey(rawKey);
    return crypto.createHash('sha256').update(normalized).digest('hex');
}
/**
 * Computes deterministic device ID from public key DER bytes.
 */
function deriveDeviceIdFromPublicKey(publicKeyBase64, isWebClient = false) {
    const derBuffer = Buffer.from(publicKeyBase64, 'base64');
    const hashHex = crypto.createHash('sha256').update(derBuffer).digest('hex');
    const prefix = isWebClient ? 'dev_web_' : 'dev_hw_';
    return `${prefix}${hashHex.substring(0, 32)}`;
}
/**
 * Wraps Base64 SPKI public key in PEM headers.
 */
function formatSpkiToPem(base64Spki) {
    const clean = base64Spki.replace(/\s+/g, '');
    return `-----BEGIN PUBLIC KEY-----\n${clean.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
}
/**
 * Retrieves the ECDSA private key from Firebase Secret Manager.
 * Safely halts if secret is unconfigured (NO hardcoded fallback!).
 */
function getLicenseSigningPrivateKey() {
    const key = process.env.LICENSE_ECDSA_PRIVATE_KEY_PEM;
    if (!key || key.trim().length === 0) {
        throw new functions.https.HttpsError('failed-precondition', 'Server signing private key is missing from Secret Manager. All license signing operations are safely halted.');
    }
    return key.trim();
}
/**
 * Asymmetrically signs an offline lease payload using server ECDSA P-256 private key.
 */
function signLeasePayloadEcdsa(licenseId, deviceId, issuedAt, validUntil, expiresAt) {
    const privateKeyPem = getLicenseSigningPrivateKey();
    const canonical = `${licenseId}|${deviceId}|${issuedAt}|${validUntil}|${expiresAt}`;
    const signer = crypto.createSign('SHA256');
    signer.update(Buffer.from(canonical, 'utf8'));
    return signer.sign(privateKeyPem, 'base64');
}
/**
 * Helper: Validates administrator identity and verified email.
 */
async function assertAdmin(request) {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    // Strict email verification enforcement
    if (request.auth.token.email_verified !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Admin email must be verified.');
    }
    const email = request.auth.token.email;
    if (email === BOOTSTRAP_ADMIN_EMAIL) {
        return;
    }
    const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can perform this operation.');
    }
}
/**
 * 1. requestDeviceChallenge
 * Generates a cryptographically random, single-use nonce for device identity proof.
 */
exports.requestDeviceChallenge = functions.https.onCall(async (request) => {
    const { devicePublicKey } = request.data;
    if (!devicePublicKey || typeof devicePublicKey !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'devicePublicKey is required.');
    }
    const challenge = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const challengeRef = db.collection('deviceChallenges').doc(challenge);
    await challengeRef.set({
        challenge,
        devicePublicKey,
        createdAt: now,
        expiresAt: now + CHALLENGE_TTL_MS
    });
    return { challenge, ttlSeconds: CHALLENGE_TTL_MS / 1000 };
});
/**
 * 2. issueLicense (Admin Only)
 * Creates a new license. The activation code is returned ONCE and stored as SHA-256 hash.
 */
exports.issueLicense = functions.https.onCall(async (request) => {
    await assertAdmin(request);
    const duration = request.data.duration || '1y';
    const targetUserId = request.data.userId;
    const targetUserEmail = request.data.userEmail;
    // Generate formatted 16-char code: APRO-XXXX-XXXX-1Y
    const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
    const plainActivationKey = `APRO-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}-${duration.toUpperCase()}`;
    const activationKeyHash = hashActivationKey(plainActivationKey);
    const keyHint = `APRO-****-****-${duration.toUpperCase()}`;
    const licenseId = `lic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();
    const newLicense = {
        id: licenseId,
        activationKeyHash,
        keyHint,
        userId: targetUserId,
        userEmail: targetUserEmail,
        boundDeviceId: '', // Empty until activated
        issuedAt: now,
        startsAt: 0,
        expiresAt: 0,
        duration,
        status: 'active',
        lastOnlineCheckAt: 0,
        isBlocked: false,
        maxOfflineDays: 7
    };
    await db.collection('licenses').doc(licenseId).set(newLicense);
    // Audit log
    await db.collection('licenseAuditLogs').add({
        action: 'issue',
        adminId: request.auth?.uid,
        adminEmail: request.auth?.token.email,
        targetId: licenseId,
        details: `Issued license [${keyHint}] for ${targetUserEmail || 'unassigned'}`,
        timestamp: now
    });
    // Plain key returned once to admin
    return {
        success: true,
        licenseId,
        activationKey: plainActivationKey,
        keyHint,
        duration
    };
});
/**
 * 3. activateLicense (Atomic Firestore Transaction)
 * Binds a license to an authenticated device after verifying hardware signature.
 */
exports.activateLicense = functions.https.onCall({ secrets: ['LICENSE_ECDSA_PRIVATE_KEY_PEM'] }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be signed in to activate license.');
    }
    const { activationKey, devicePublicKey, challenge, signature, deviceModel, isWebClient = false } = request.data;
    if (!activationKey || !devicePublicKey || !challenge || !signature) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: activationKey, devicePublicKey, challenge, signature.');
    }
    // 1. Verify single-use Challenge
    const challengeRef = db.collection('deviceChallenges').doc(challenge);
    const challengeSnap = await challengeRef.get();
    if (!challengeSnap.exists) {
        throw new functions.https.HttpsError('permission-denied', 'کد چالش امنیتی منقضی یا نامعتبر است.');
    }
    const challengeData = challengeSnap.data();
    if (challengeData?.devicePublicKey !== devicePublicKey || Date.now() > challengeData?.expiresAt) {
        await challengeRef.delete();
        throw new functions.https.HttpsError('permission-denied', 'چالش امنیتی دستگاه نامعتبر است.');
    }
    // Consume challenge immediately (anti-replay)
    await challengeRef.delete();
    // 2. Cryptographic Proof of Private Key Custody (ECDSA Verify)
    const publicKeyPem = formatSpkiToPem(devicePublicKey);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(Buffer.from(challenge, 'utf8'));
    const isSignatureValid = verifier.verify(publicKeyPem, signature, 'base64');
    if (!isSignatureValid) {
        throw new functions.https.HttpsError('permission-denied', 'امضای دیجیتال سخت‌افزاری دستگاه تایید نشد.');
    }
    // 3. Compute deterministic deviceId server-side from public key
    const derivedDeviceId = deriveDeviceIdFromPublicKey(devicePublicKey, Boolean(isWebClient));
    // 4. Query license by activationKeyHash
    const targetHash = hashActivationKey(activationKey);
    const querySnap = await db.collection('licenses')
        .where('activationKeyHash', '==', targetHash)
        .limit(1)
        .get();
    if (querySnap.empty) {
        throw new functions.https.HttpsError('not-found', 'کد فعال‌سازی وارد شده معتبر نمی‌باشد.');
    }
    const licenseDocRef = querySnap.docs[0].ref;
    const now = Date.now();
    let updatedLicense;
    // 5. Atomic Transaction: Guarantees no two devices can activate the same key simultaneously
    await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(licenseDocRef);
        if (!docSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'لایسنس یافت نشد.');
        }
        const current = docSnap.data();
        if (current.isBlocked || current.status === 'revoked') {
            throw new functions.https.HttpsError('failed-precondition', current.blockReason || 'این لایسنس مسدود شده است.');
        }
        // Atomic race condition guard: If already bound to another hardware device, reject!
        if (current.boundDeviceId && current.boundDeviceId !== derivedDeviceId) {
            throw new functions.https.HttpsError('already-exists', 'این کد فعال‌سازی قبلاً روی دستگاه دیگری ثبت شده است و امکان استفاده مجدد وجود ندارد.');
        }
        const startsAt = current.startsAt > 0 ? current.startsAt : now;
        const expiresAt = startsAt + ONE_YEAR_MS;
        updatedLicense = {
            ...current,
            boundDeviceId: derivedDeviceId,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || current.userEmail,
            startsAt,
            expiresAt,
            lastOnlineCheckAt: now,
            status: 'active'
        };
        // Update license document
        transaction.update(licenseDocRef, {
            boundDeviceId: derivedDeviceId,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || current.userEmail,
            startsAt,
            expiresAt,
            lastOnlineCheckAt: now,
            status: 'active'
        });
        // Upsert device record
        const deviceDocRef = db.collection('devices').doc(derivedDeviceId);
        transaction.set(deviceDocRef, {
            deviceId: derivedDeviceId,
            devicePublicKey,
            firstBoundAt: now,
            licenseId: docSnap.id,
            status: 'trusted',
            deviceModel: deviceModel || 'Android',
            lastHandshakeAt: now,
            isWebClient: Boolean(isWebClient)
        }, { merge: true });
        // Append audit log
        const auditRef = db.collection('licenseAuditLogs').doc();
        transaction.set(auditRef, {
            action: 'activate',
            userId: request.auth.uid,
            targetId: docSnap.id,
            details: `Bound license to hardware device ${derivedDeviceId} [${current.keyHint}]`,
            timestamp: now
        });
    });
    // 6. Generate Asymmetrically-Signed 7-Day Offline Lease Token
    const validUntilServer = now + SEVEN_DAYS_MS;
    const signatureToken = signLeasePayloadEcdsa(updatedLicense.id, derivedDeviceId, now, validUntilServer, updatedLicense.expiresAt);
    const leaseToken = {
        licenseId: updatedLicense.id,
        deviceId: derivedDeviceId,
        userId: request.auth.uid,
        issuedAtServer: now,
        validUntilServer,
        licenseExpiresAt: updatedLicense.expiresAt,
        signature: signatureToken
    };
    return {
        success: true,
        license: {
            id: updatedLicense.id,
            boundDeviceId: derivedDeviceId,
            startsAt: updatedLicense.startsAt,
            expiresAt: updatedLicense.expiresAt,
            lastOnlineCheckAt: now,
            status: 'active',
            duration: updatedLicense.duration
        },
        leaseToken
    };
});
/**
 * 4. verifyLicense
 * Validates active status and issues a fresh ECDSA-signed offline lease.
 */
exports.verifyLicense = functions.https.onCall({ secrets: ['LICENSE_ECDSA_PRIVATE_KEY_PEM'] }, async (request) => {
    const { licenseId, deviceId } = request.data;
    if (!licenseId || !deviceId) {
        throw new functions.https.HttpsError('invalid-argument', 'licenseId and deviceId are required.');
    }
    const docRef = db.collection('licenses').doc(licenseId);
    const snap = await docRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'لایسنس مورد نظر یافت نشد.');
    }
    const license = snap.data();
    const now = Date.now();
    // Hardware binding check
    if (license.boundDeviceId !== deviceId) {
        throw new functions.https.HttpsError('permission-denied', 'شناسه دستگاه با اطلاعات لایسنس مطابقت ندارد.');
    }
    // Blocked / Revoked check
    if (license.isBlocked || license.status === 'revoked') {
        throw new functions.https.HttpsError('permission-denied', license.blockReason || 'لایسنس مسدود شده است.');
    }
    // Expiration check
    if (now >= license.expiresAt) {
        await docRef.update({ status: 'expired' });
        throw new functions.https.HttpsError('deadline-exceeded', 'اعتبار لایسنس به پایان رسیده است.');
    }
    await docRef.update({ lastOnlineCheckAt: now });
    // Issue 7-day cryptographic offline lease signed with ECDSA
    const validUntilServer = now + SEVEN_DAYS_MS;
    const signature = signLeasePayloadEcdsa(licenseId, deviceId, now, validUntilServer, license.expiresAt);
    const leaseToken = {
        licenseId,
        deviceId,
        userId: license.userId,
        issuedAtServer: now,
        validUntilServer,
        licenseExpiresAt: license.expiresAt,
        signature
    };
    return {
        isValid: true,
        serverTime: now,
        expiresAt: license.expiresAt,
        daysRemaining: Math.ceil((license.expiresAt - now) / (24 * 60 * 60 * 1000)),
        leaseToken
    };
});
/**
 * 5. renewLicense (Admin Only)
 */
exports.renewLicense = functions.https.onCall(async (request) => {
    await assertAdmin(request);
    const { licenseId, additionalYears = 1 } = request.data;
    if (!licenseId) {
        throw new functions.https.HttpsError('invalid-argument', 'licenseId is required.');
    }
    const docRef = db.collection('licenses').doc(licenseId);
    const snap = await docRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'لایسنس یافت نشد.');
    }
    const license = snap.data();
    const now = Date.now();
    const currentExpiry = Math.max(license.expiresAt, now);
    const newExpiry = currentExpiry + (additionalYears * ONE_YEAR_MS);
    await docRef.update({
        expiresAt: newExpiry,
        status: 'active',
        isBlocked: false,
        blockReason: admin.firestore.FieldValue.delete()
    });
    await db.collection('licenseAuditLogs').add({
        action: 'renew',
        adminId: request.auth?.uid,
        adminEmail: request.auth?.token.email,
        targetId: licenseId,
        details: `Extended license expiry by ${additionalYears} year(s) to ${new Date(newExpiry).toISOString()}`,
        timestamp: now
    });
    return { success: true, newExpiry };
});
/**
 * 6. revokeLicense (Admin Only)
 */
exports.revokeLicense = functions.https.onCall(async (request) => {
    await assertAdmin(request);
    const { licenseId, blockReason = 'توسط مدیر سامانه مسدود شد', blacklistDevice = false } = request.data;
    if (!licenseId) {
        throw new functions.https.HttpsError('invalid-argument', 'licenseId is required.');
    }
    const docRef = db.collection('licenses').doc(licenseId);
    const snap = await docRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'لایسنس یافت نشد.');
    }
    const license = snap.data();
    const now = Date.now();
    await docRef.update({
        isBlocked: true,
        status: 'revoked',
        blockReason
    });
    if (blacklistDevice && license.boundDeviceId) {
        await db.collection('devices').doc(license.boundDeviceId).update({
            status: 'blacklisted'
        });
    }
    await db.collection('licenseAuditLogs').add({
        action: 'revoke',
        adminId: request.auth?.uid,
        adminEmail: request.auth?.token.email,
        targetId: licenseId,
        details: `Revoked license: ${blockReason}. Device blacklisted: ${blacklistDevice}`,
        timestamp: now
    });
    return { success: true };
});
/**
 * 7. transferLicenseDevice (Admin Only)
 */
exports.transferLicenseDevice = functions.https.onCall(async (request) => {
    await assertAdmin(request);
    const { licenseId, newDeviceId, newDevicePublicKey, newDeviceModel, reason } = request.data;
    if (!licenseId || !newDeviceId || !newDevicePublicKey) {
        throw new functions.https.HttpsError('invalid-argument', 'licenseId, newDeviceId, and newDevicePublicKey are required.');
    }
    const docRef = db.collection('licenses').doc(licenseId);
    const snap = await docRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'لایسنس یافت نشد.');
    }
    const license = snap.data();
    const oldDeviceId = license.boundDeviceId;
    const now = Date.now();
    await docRef.update({
        boundDeviceId: newDeviceId,
        lastOnlineCheckAt: now
    });
    await db.collection('devices').doc(newDeviceId).set({
        deviceId: newDeviceId,
        devicePublicKey: newDevicePublicKey,
        firstBoundAt: now,
        licenseId,
        status: 'trusted',
        deviceModel: newDeviceModel,
        lastHandshakeAt: now
    }, { merge: true });
    await db.collection('licenseAuditLogs').add({
        action: 'transfer',
        adminId: request.auth?.uid,
        adminEmail: request.auth?.token.email,
        targetId: licenseId,
        details: `Transferred license from device ${oldDeviceId} to new hardware ${newDeviceId}. Reason: ${reason || 'N/A'}`,
        timestamp: now
    });
    return { success: true, newDeviceId };
});
//# sourceMappingURL=index.js.map