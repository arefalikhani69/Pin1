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
exports.reviewLicenseRequest = exports.setAdminRole = exports.revokeLicense = exports.renewLicense = exports.transferLicenseDevice = exports.verifyLicense = exports.activateLicense = exports.issueLicense = exports.requestDeviceChallenge = exports.ROLE_PERMISSIONS = exports.RATE_LIMITS = void 0;
exports.generateHighEntropyActivationKey = generateHighEntropyActivationKey;
exports.normalizeActivationKey = normalizeActivationKey;
exports.hashActivationKey = hashActivationKey;
exports.deriveDeviceIdFromPublicKey = deriveDeviceIdFromPublicKey;
exports.formatSpkiToPem = formatSpkiToPem;
exports.validateEcPublicKey = validateEcPublicKey;
exports.hasPermission = hasPermission;
exports.assertAdminRole = assertAdminRole;
exports.assertAdminPermission = assertAdminPermission;
exports.assertAdmin = assertAdmin;
exports.sanitizeAuditMetadata = sanitizeAuditMetadata;
exports.recordSecurityAuditLog = recordSecurityAuditLog;
exports.sanitizeDocKey = sanitizeDocKey;
exports.checkActivationRateLimits = checkActivationRateLimits;
exports.recordActivationFailure = recordActivationFailure;
exports.clearActivationFailures = clearActivationFailures;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const crypto = __importStar(require("crypto"));
const app = admin.initializeApp();
const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID ||
    'ai-studio-autopinpro-6597dde9-59f0-4a2e-90e5-55436f30fb2d';
const db = (0, firestore_1.getFirestore)(app, firestoreDatabaseId);
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
exports.RATE_LIMITS = {
    IP_MAX_FAILURES: 15,
    DEVICE_MAX_FAILURES: 5,
    USER_MAX_FAILURES: 5,
    KEY_MAX_FAILURES: 5,
    LOCK_DURATION_MS: 15 * 60 * 1000 // 15 minutes
};
// Crockford Base32 alphabet for human-readable high-entropy activation keys (avoids 0/O, 1/I/L)
const CROCKFORD_BASE32 = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
/**
 * Generates an activation key with at least 128 bits of true cryptographic entropy.
 * 16 bytes = 128 bits of entropy generated strictly via crypto.randomBytes.
 * Formatted cleanly into 5 blocks of 5 chars + duration suffix:
 * e.g., APRO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-1Y
 */
function generateHighEntropyActivationKey(duration = '1y') {
    const entropyBytes = crypto.randomBytes(16); // 128 bits of true cryptographic randomness
    let binaryString = '';
    for (const byte of entropyBytes) {
        binaryString += byte.toString(2).padStart(8, '0');
    }
    // 128 bits converted into 26 Crockford Base32 characters (each 5 bits)
    let base32 = '';
    for (let i = 0; i < 25; i++) {
        const chunk = binaryString.substring(i * 5, (i + 1) * 5).padEnd(5, '0');
        base32 += CROCKFORD_BASE32[parseInt(chunk, 2)];
    }
    const blocks = [
        base32.substring(0, 5),
        base32.substring(5, 10),
        base32.substring(10, 15),
        base32.substring(15, 20),
        base32.substring(20, 25)
    ];
    const plainKey = `APRO-${blocks.join('-')}-${duration.toUpperCase()}`;
    const activationKeyHash = hashActivationKey(plainKey);
    const keyHint = `APRO-*****-*****-*****-*****-${blocks[4]}-${duration.toUpperCase()}`;
    return { plainKey, keyHint, activationKeyHash };
}
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
 * Validates that an incoming public key string is well-formed Base64 SPKI EC key.
 */
function validateEcPublicKey(publicKeyBase64) {
    if (!publicKeyBase64 || typeof publicKeyBase64 !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'کلید عمومی دستگاه نامعتبر است.');
    }
    const clean = publicKeyBase64.replace(/\s+/g, '');
    if (clean.length < 60 || clean.length > 512 || !/^[A-Za-z0-9+/=]+$/.test(clean)) {
        throw new functions.https.HttpsError('invalid-argument', 'قالب کلید عمومی نامعتبر است.');
    }
    try {
        const pem = formatSpkiToPem(clean);
        const pubKey = crypto.createPublicKey(pem);
        if (pubKey.asymmetricKeyType !== 'ec') {
            throw new functions.https.HttpsError('invalid-argument', 'کلید باید از نوع منحنی بیضوی (EC) باشد.');
        }
    }
    catch (err) {
        throw new functions.https.HttpsError('invalid-argument', `کلید عمومی SPKI نامعتبر است: ${err.message}`);
    }
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
 * Role Permission Mapping (Authoritative Server-Side RBAC Matrix for Phase 2):
 *
 * 1. Super Admin:
 *    - Full access to all operations
 *    - Sole authority to manage administrators (setAdminRole: promote, change role, deactivate)
 *    - Issue, renew, revoke/block, transfer licenses
 *    - Review and manage activation requests
 *    - Access security audit logs and administrative telemetry
 *
 * 2. Admin:
 *    - Issue new licenses
 *    - Renew existing licenses
 *    - Revoke / block licenses
 *    - Transfer licenses between verified devices
 *    - Review activation requests
 *    - View licenses, devices, non-sensitive audit logs
 *    - STRICTLY FORBIDDEN from managing other administrators (cannot call setAdminRole)
 *
 * 3. Support:
 *    - Read-only visibility: view licenses, view devices, view activation requests
 *    - View general reports and non-sensitive logs
 *    - STRICTLY FORBIDDEN from issuing, renewing, revoking, or transferring licenses
 *    - STRICTLY FORBIDDEN from managing administrators
 */
exports.ROLE_PERMISSIONS = {
    super_admin: new Set([
        'manage_admins',
        'issue_license',
        'renew_license',
        'revoke_license',
        'transfer_license',
        'review_requests',
        'view_requests',
        'view_audit_logs',
        'view_licenses',
        'view_devices'
    ]),
    admin: new Set([
        'issue_license',
        'renew_license',
        'revoke_license',
        'transfer_license',
        'review_requests',
        'view_requests',
        'view_audit_logs',
        'view_licenses',
        'view_devices'
    ]),
    support: new Set([
        'view_requests',
        'view_licenses',
        'view_devices'
    ])
};
/**
 * Validates whether a specific role possesses the requested permission.
 */
function hasPermission(role, permission) {
    const allowed = exports.ROLE_PERMISSIONS[role];
    return Boolean(allowed && allowed.has(permission));
}
/**
 * Authoritative Single Source of Truth for Administrator Verification & RBAC.
 *
 * Rules:
 * 1. An administrator MUST have an active document in `/admins/{uid}` with `active === true`.
 * 2. Stale or forged Custom Claims (admin=true) alone CANNOT bypass an absent or inactive database record.
 * 3. Specific operational permissions are strictly validated against `allowedRoles`.
 * 4. Supports safe one-time initial bootstrap for the first administrator.
 */
async function assertAdminRole(request, allowedRoles = ['super_admin', 'admin']) {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    // Query database-backed admin record (Single Source of Truth)
    const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
    if (adminDoc.exists) {
        const adminData = adminDoc.data();
        if (adminData?.active !== true) {
            throw new functions.https.HttpsError('permission-denied', 'دسترسی مدیریتی این حساب کاربری غیرفعال یا لغو شده است.');
        }
        const currentRole = (adminData.role || 'admin');
        if (!allowedRoles.includes(currentRole)) {
            throw new functions.https.HttpsError('permission-denied', `نقش کاربری شما (${currentRole}) مجوز اجرای این عملیات را ندارد. نقش‌های مجاز: ${allowedRoles.join(', ')}`);
        }
        return {
            uid: request.auth.uid,
            email: request.auth.token.email || adminData.email || '',
            role: currentRole
        };
    }
    // If no database record exists, check for secure one-time initial bootstrap
    if (process.env.DISABLE_BOOTSTRAP === 'true') {
        throw new functions.https.HttpsError('permission-denied', 'Bootstrap initialization has been permanently disabled.');
    }
    const configuredAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    if (!configuredAdminEmail || typeof configuredAdminEmail !== 'string' || !configuredAdminEmail.trim()) {
        throw new functions.https.HttpsError('permission-denied', 'کاربر فاقد سند معتبر و فعال در فهرست مدیران سیستم می‌باشد.');
    }
    const userEmail = request.auth.token.email;
    if (!userEmail || userEmail.toLowerCase() !== configuredAdminEmail.trim().toLowerCase()) {
        throw new functions.https.HttpsError('permission-denied', 'کاربر فاقد سند معتبر و فعال در فهرست مدیران سیستم می‌باشد.');
    }
    // Verify that bootstrap has NOT been locked/completed before
    const bootstrapDocRef = db.collection('system_config').doc('bootstrap');
    const bootstrapSnap = await bootstrapDocRef.get();
    if (bootstrapSnap.exists && bootstrapSnap.data()?.completed === true) {
        throw new functions.https.HttpsError('permission-denied', 'سیستم قبلاً راه‌اندازی شده است و امکان اجرای مجدد Bootstrap وجود ندارد.');
    }
    // Verify that no other active admin exists in the database
    const activeAdminsSnap = await db.collection('admins').where('active', '==', true).limit(1).get();
    if (!activeAdminsSnap.empty) {
        await bootstrapDocRef.set({
            completed: true,
            lockedAt: Date.now(),
            reason: 'Active admin already present'
        }, { merge: true });
        throw new functions.https.HttpsError('permission-denied', 'یک مدیر فعال در سیستم شناسایی شد. امکان ارتقای خودکار از طریق Bootstrap بسته شده است.');
    }
    // Execute initial one-time bootstrap granting super_admin role
    const now = Date.now();
    await db.collection('admins').doc(request.auth.uid).set({
        uid: request.auth.uid,
        email: userEmail,
        role: 'super_admin',
        active: true,
        migratedAt: now,
        method: 'one_time_secure_bootstrap'
    }, { merge: true });
    await bootstrapDocRef.set({
        completed: true,
        completedAt: now,
        initialAdminUid: request.auth.uid,
        initialAdminEmail: userEmail,
        method: 'env_bootstrap'
    });
    try {
        await admin.auth().setCustomUserClaims(request.auth.uid, { admin: true, role: 'super_admin' });
    }
    catch (e) {
        console.warn('Could not set custom claim during one-time bootstrap:', e);
    }
    if (!allowedRoles.includes('super_admin')) {
        throw new functions.https.HttpsError('permission-denied', 'سطح دسترسی نامعتبر است.');
    }
    return {
        uid: request.auth.uid,
        email: userEmail,
        role: 'super_admin'
    };
}
/**
 * Checks that the caller is an active administrator possessing the exact requested permission.
 */
async function assertAdminPermission(request, permission) {
    const adminContext = await assertAdminRole(request, ['super_admin', 'admin', 'support']);
    if (!hasPermission(adminContext.role, permission)) {
        throw new functions.https.HttpsError('permission-denied', `نقش مدیریتی شما (${adminContext.role}) دسترسی لازم برای عملیات '${permission}' را ندارد.`);
    }
    return adminContext;
}
/**
 * Standard admin assert (requires super_admin or admin role).
 */
async function assertAdmin(request) {
    return assertAdminRole(request, ['super_admin', 'admin']);
}
/**
 * Sanitizes metadata for security audit logs.
 * Strictly redacts private keys, raw tokens, plain activation codes, and secrets.
 */
function sanitizeAuditMetadata(raw) {
    if (!raw || typeof raw !== 'object')
        return {};
    const sanitized = {};
    const forbiddenPatterns = /secret|private|token|plain|password|key|spki|pem|signature|seed/i;
    for (const [key, value] of Object.entries(raw)) {
        if (forbiddenPatterns.test(key)) {
            sanitized[key] = '[REDACTED_SENSITIVE]';
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeAuditMetadata(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
/**
 * Appends a tamper-evident record to `licenseAuditLogs` with sanitized metadata.
 */
async function recordSecurityAuditLog(payload) {
    const now = Date.now();
    const safeMetadata = sanitizeAuditMetadata(payload.metadata);
    await db.collection('licenseAuditLogs').add({
        actorUid: payload.actorUid,
        actorRole: payload.actorRole,
        actorEmail: payload.actorEmail || '',
        action: payload.action,
        targetId: payload.targetId,
        timestamp: now,
        result: payload.result,
        details: payload.details || '',
        metadata: safeMetadata,
        // Backward compatibility for Phase 1 UI:
        adminId: payload.actorUid,
        adminEmail: payload.actorEmail || ''
    });
}
/**
 * Sanitizes keys for Firestore document IDs.
 */
function sanitizeDocKey(raw) {
    return raw.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 120);
}
/**
 * Multi-Dimensional Rate Limiting for License Activation:
 * Enforces limits across IP, Hardware Device ID, User UID, and Target Key Hash.
 * Resistant to attackers switching UID or Device ID.
 */
async function checkActivationRateLimits(scope) {
    const now = Date.now();
    const keysToCheck = [
        `ip_${sanitizeDocKey(scope.clientIp)}`,
        `dev_${sanitizeDocKey(scope.deviceId)}`,
        ...(scope.userId ? [`user_${sanitizeDocKey(scope.userId)}`] : []),
        ...(scope.activationKeyHash ? [`key_${sanitizeDocKey(scope.activationKeyHash)}`] : [])
    ];
    const snaps = await Promise.all(keysToCheck.map(k => db.collection('rateLimits').doc(k).get()));
    for (const snap of snaps) {
        if (snap.exists) {
            const data = snap.data();
            if (data?.lockedUntil && now < data.lockedUntil) {
                const waitMinutes = Math.ceil((data.lockedUntil - now) / 60000);
                throw new functions.https.HttpsError('resource-exhausted', `تعداد تلاش‌های ناموفق فعال‌سازی بیش از حد مجاز است. لطفاً ${waitMinutes} دقیقه دیگر مجدداً تلاش فرمایید.`);
            }
        }
    }
}
/**
 * Records failed activation attempt atomically across all relevant dimensions.
 */
async function recordActivationFailure(scope) {
    const now = Date.now();
    const targets = [
        { id: `ip_${sanitizeDocKey(scope.clientIp)}`, max: exports.RATE_LIMITS.IP_MAX_FAILURES },
        { id: `dev_${sanitizeDocKey(scope.deviceId)}`, max: exports.RATE_LIMITS.DEVICE_MAX_FAILURES },
        ...(scope.userId ? [{ id: `user_${sanitizeDocKey(scope.userId)}`, max: exports.RATE_LIMITS.USER_MAX_FAILURES }] : []),
        ...(scope.activationKeyHash ? [{ id: `key_${sanitizeDocKey(scope.activationKeyHash)}`, max: exports.RATE_LIMITS.KEY_MAX_FAILURES }] : [])
    ];
    await db.runTransaction(async (tx) => {
        // 1. ALL READS FIRST
        const snaps = await Promise.all(targets.map(t => tx.get(db.collection('rateLimits').doc(t.id))));
        // 2. ALL WRITES AFTER ALL READS
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const snap = snaps[i];
            const docRef = db.collection('rateLimits').doc(target.id);
            if (!snap.exists) {
                tx.set(docRef, {
                    targetId: target.id,
                    failures: 1,
                    firstFailureAt: now,
                    lastFailureAt: now,
                    lockedUntil: 0
                });
            }
            else {
                const data = snap.data();
                const isExpiredWindow = !data?.lockedUntil && (now - (data?.lastFailureAt || 0) > exports.RATE_LIMITS.LOCK_DURATION_MS);
                const currentFailures = isExpiredWindow ? 1 : ((data?.failures || 0) + 1);
                const shouldLock = currentFailures >= target.max;
                const lockedUntil = shouldLock ? (now + exports.RATE_LIMITS.LOCK_DURATION_MS) : (data?.lockedUntil || 0);
                tx.update(docRef, {
                    failures: currentFailures,
                    lastFailureAt: now,
                    lockedUntil
                });
            }
        }
    });
}
/**
 * Clears failed attempt counts for successful device activation.
 */
async function clearActivationFailures(scope) {
    try {
        const batch = db.batch();
        batch.delete(db.collection('rateLimits').doc(`dev_${sanitizeDocKey(scope.deviceId)}`));
        if (scope.userId) {
            batch.delete(db.collection('rateLimits').doc(`user_${sanitizeDocKey(scope.userId)}`));
        }
        if (scope.activationKeyHash) {
            batch.delete(db.collection('rateLimits').doc(`key_${sanitizeDocKey(scope.activationKeyHash)}`));
        }
        await batch.commit();
    }
    catch (err) {
        console.warn('Could not clear rate limits after activation:', err);
    }
}
/**
 * 1. requestDeviceChallenge
 * Generates a cryptographically random, single-use 32-byte nonce for zero-trust device proof.
 * Requires Firebase Auth & validates public key.
 */
exports.requestDeviceChallenge = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'برای دریافت چالش امنیتی ورود به حساب کاربری الزامی است.');
    }
    const { devicePublicKey } = request.data;
    validateEcPublicKey(devicePublicKey);
    // Rate limit: max 10 challenge requests per minute per user
    const userRateLimitRef = db.collection('rateLimits').doc(`chal_${request.auth.uid}`);
    const now = Date.now();
    const rateSnap = await userRateLimitRef.get();
    if (rateSnap.exists) {
        const rData = rateSnap.data();
        if (rData && now - rData.windowStart < 60000) {
            if (rData.count >= 10) {
                throw new functions.https.HttpsError('resource-exhausted', 'تعداد درخواست چالش بیش از حد مجاز است.');
            }
            await userRateLimitRef.update({ count: admin.firestore.FieldValue.increment(1) });
        }
        else {
            await userRateLimitRef.set({ windowStart: now, count: 1 });
        }
    }
    else {
        await userRateLimitRef.set({ windowStart: now, count: 1 });
    }
    // 32-byte cryptographically random challenge (256-bit entropy)
    const challenge = crypto.randomBytes(32).toString('hex');
    const challengeRef = db.collection('deviceChallenges').doc(challenge);
    await challengeRef.set({
        challenge,
        devicePublicKey,
        userId: request.auth.uid,
        createdAt: now,
        expiresAt: now + CHALLENGE_TTL_MS
    });
    return { challenge, ttlSeconds: CHALLENGE_TTL_MS / 1000 };
});
/**
 * 2. issueLicense (Admin Only)
 * Creates a new license with >= 128-bit cryptographic entropy.
 * Plain key is returned ONCE to the administrator and NEVER logged in plain text.
 */
exports.issueLicense = functions.https.onCall(async (request) => {
    const adminContext = await assertAdminPermission(request, 'issue_license');
    const duration = request.data.duration || '1y';
    const targetUserId = request.data.userId;
    const targetUserEmail = request.data.userEmail;
    // 128-bit true entropy activation code
    const { plainKey, keyHint, activationKeyHash } = generateHighEntropyActivationKey(duration);
    const licenseId = `lic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();
    const newLicense = {
        id: licenseId,
        activationKeyHash,
        keyHint,
        userId: targetUserId,
        userEmail: targetUserEmail,
        boundDeviceId: '', // Empty until hardware activation
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
    // Security audit log NEVER stores the plain activation key!
    await recordSecurityAuditLog({
        actorUid: adminContext.uid,
        actorRole: adminContext.role,
        actorEmail: adminContext.email,
        action: 'issue',
        targetId: licenseId,
        result: 'success',
        details: `Issued license [${keyHint}] for ${targetUserEmail || 'unassigned'}`,
        metadata: {
            duration,
            targetUserId,
            targetUserEmail,
            keyHint
        }
    });
    // Plain activation key is returned ONLY ONCE in the response to admin
    return {
        success: true,
        licenseId,
        activationKey: plainKey,
        keyHint,
        duration
    };
});
/**
 * 3. activateLicense (Atomic Firestore Transaction with Strict Read-Before-Write)
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
    validateEcPublicKey(devicePublicKey);
    // Multi-Dimensional Rate Limiting across IP, Hardware Device ID, User UID, and Target Key Hash
    const clientIp = request.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || request.rawRequest?.ip || 'unknown';
    const targetHash = hashActivationKey(activationKey);
    const derivedDeviceId = deriveDeviceIdFromPublicKey(devicePublicKey, Boolean(isWebClient));
    const rateLimitScope = {
        clientIp,
        deviceId: derivedDeviceId,
        userId: request.auth.uid,
        activationKeyHash: targetHash
    };
    await checkActivationRateLimits(rateLimitScope);
    // 1. Cryptographic Proof of Private Key Custody (ECDSA Verify)
    const publicKeyPem = formatSpkiToPem(devicePublicKey);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(Buffer.from(challenge, 'utf8'));
    const isSignatureValid = verifier.verify(publicKeyPem, signature, 'base64');
    if (!isSignatureValid) {
        await recordActivationFailure(rateLimitScope);
        throw new functions.https.HttpsError('permission-denied', 'امضای دیجیتال سخت‌افزاری دستگاه تایید نشد.');
    }
    // 2. Pre-query license by activationKeyHash
    const querySnap = await db.collection('licenses')
        .where('activationKeyHash', '==', targetHash)
        .limit(1)
        .get();
    if (querySnap.empty) {
        await recordActivationFailure(rateLimitScope);
        throw new functions.https.HttpsError('not-found', 'کد فعال‌سازی وارد شده معتبر نمی‌باشد.');
    }
    const licenseDocRef = querySnap.docs[0].ref;
    const challengeRef = db.collection('deviceChallenges').doc(challenge);
    const deviceDocRef = db.collection('devices').doc(derivedDeviceId);
    const auditDocRef = db.collection('licenseAuditLogs').doc();
    const now = Date.now();
    let updatedLicense;
    // 4. Strict Read-Before-Write Atomic Transaction
    await db.runTransaction(async (transaction) => {
        // --- ALL READS FIRST ---
        const challengeSnap = await transaction.get(challengeRef);
        const licenseSnap = await transaction.get(licenseDocRef);
        const deviceSnap = await transaction.get(deviceDocRef);
        // --- IN-MEMORY VALIDATION ---
        if (!challengeSnap.exists) {
            throw new functions.https.HttpsError('permission-denied', 'کد چالش امنیتی منقضی یا نامعتبر است.');
        }
        const challengeData = challengeSnap.data();
        if (challengeData?.devicePublicKey !== devicePublicKey || now > (challengeData?.expiresAt || 0)) {
            throw new functions.https.HttpsError('permission-denied', 'چالش امنیتی دستگاه منقضی یا نامعتبر است.');
        }
        if (!licenseSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'لایسنس یافت نشد.');
        }
        const current = licenseSnap.data();
        if (current.isBlocked || current.status === 'revoked') {
            throw new functions.https.HttpsError('failed-precondition', current.blockReason || 'این لایسنس مسدود شده است.');
        }
        // Atomic Binding Guard: Cannot bind to a different device!
        if (current.boundDeviceId && current.boundDeviceId !== derivedDeviceId) {
            throw new functions.https.HttpsError('already-exists', 'این کد فعال‌سازی قبلاً روی دستگاه دیگری ثبت شده است و امکان استفاده مجدد وجود ندارد.');
        }
        // Re-activation on the SAME device preserves original dates!
        const isReactivation = current.boundDeviceId === derivedDeviceId && current.startsAt > 0;
        const startsAt = isReactivation ? current.startsAt : now;
        const expiresAt = isReactivation ? current.expiresAt : (now + ONE_YEAR_MS);
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
        // --- ALL WRITES AFTER ALL READS ---
        // 1. Consume challenge atomically (anti-replay)
        transaction.delete(challengeRef);
        // 2. Update license
        transaction.update(licenseDocRef, {
            boundDeviceId: derivedDeviceId,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || current.userEmail,
            startsAt,
            expiresAt,
            lastOnlineCheckAt: now,
            status: 'active'
        });
        // 3. Upsert device
        transaction.set(deviceDocRef, {
            deviceId: derivedDeviceId,
            devicePublicKey,
            firstBoundAt: deviceSnap.exists ? (deviceSnap.data()?.firstBoundAt || now) : now,
            licenseId: licenseSnap.id,
            status: 'trusted',
            deviceModel: deviceModel || 'Android Device',
            lastHandshakeAt: now,
            isWebClient: Boolean(isWebClient)
        }, { merge: true });
        // 4. Audit log (no plain activation code!)
        transaction.set(auditDocRef, {
            action: 'activate',
            userId: request.auth.uid,
            targetId: licenseSnap.id,
            details: `Bound license to hardware device ${derivedDeviceId} [${current.keyHint}]`,
            timestamp: now
        });
    });
    // 5. Clear rate limit failures across scope upon success
    await clearActivationFailures(rateLimitScope);
    // 5. Generate Asymmetrically-Signed 7-Day Offline Lease Token
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
 * 4. verifyLicense (Requires Auth & Hardware Challenge Verification)
 * Validates active status and issues a fresh ECDSA-signed offline lease.
 */
exports.verifyLicense = functions.https.onCall({ secrets: ['LICENSE_ECDSA_PRIVATE_KEY_PEM'] }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'ورود به حساب کاربری برای اعتبارسنجی لایسنس الزامی است.');
    }
    const { licenseId, deviceId, devicePublicKey, challenge, signature, isWebClient = false } = request.data;
    if (!licenseId || !deviceId || !devicePublicKey || !challenge || !signature) {
        throw new functions.https.HttpsError('invalid-argument', 'پارامترهای اعتبارسنجی سخت‌افزاری ناقص است (licenseId, deviceId, devicePublicKey, challenge, signature).');
    }
    validateEcPublicKey(devicePublicKey);
    // 1. Verify digital signature of challenge using device public key
    const publicKeyPem = formatSpkiToPem(devicePublicKey);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(Buffer.from(challenge, 'utf8'));
    const isSignatureValid = verifier.verify(publicKeyPem, signature, 'base64');
    if (!isSignatureValid) {
        throw new functions.https.HttpsError('permission-denied', 'امضای دیجیتال سخت‌افزاری دستگاه تایید نشد.');
    }
    // 2. Hardware binding consistency
    const derivedDeviceId = deriveDeviceIdFromPublicKey(devicePublicKey, Boolean(isWebClient));
    if (derivedDeviceId !== deviceId) {
        throw new functions.https.HttpsError('permission-denied', 'شناسه دستگاه با کلید عمومی سخت‌افزاری مطابقت ندارد.');
    }
    const licenseDocRef = db.collection('licenses').doc(licenseId);
    const challengeRef = db.collection('deviceChallenges').doc(challenge);
    const now = Date.now();
    let verifiedLicense;
    // 3. Strict Read-Before-Write Atomic Transaction
    await db.runTransaction(async (transaction) => {
        // --- ALL READS FIRST ---
        const challengeSnap = await transaction.get(challengeRef);
        const licenseSnap = await transaction.get(licenseDocRef);
        // --- IN-MEMORY VALIDATION ---
        if (!challengeSnap.exists) {
            throw new functions.https.HttpsError('permission-denied', 'چالش امنیتی منقضی شده یا قبلاً مصرف شده است.');
        }
        const challengeData = challengeSnap.data();
        if (challengeData?.devicePublicKey !== devicePublicKey || now > (challengeData?.expiresAt || 0)) {
            throw new functions.https.HttpsError('permission-denied', 'چالش امنیتی دستگاه معتبر نمی‌باشد.');
        }
        if (!licenseSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'لایسنس مورد نظر یافت نشد.');
        }
        verifiedLicense = licenseSnap.data();
        // Ownership verification
        if (verifiedLicense.userId && verifiedLicense.userId !== request.auth.uid) {
            // Allow admin override or reject
            const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
            if (!adminDoc.exists || adminDoc.data()?.active !== true) {
                throw new functions.https.HttpsError('permission-denied', 'شما مالک این لایسنس نیستید.');
            }
        }
        // Hardware binding check
        if (verifiedLicense.boundDeviceId !== derivedDeviceId) {
            throw new functions.https.HttpsError('permission-denied', 'این لایسنس برای دستگاه دیگری صادر شده است.');
        }
        // Status checks
        if (verifiedLicense.isBlocked || verifiedLicense.status === 'revoked') {
            throw new functions.https.HttpsError('permission-denied', verifiedLicense.blockReason || 'لایسنس مسدود شده است.');
        }
        if (now >= verifiedLicense.expiresAt) {
            transaction.update(licenseDocRef, { status: 'expired' });
            throw new functions.https.HttpsError('deadline-exceeded', 'اعتبار لایسنس به پایان رسیده است.');
        }
        // --- ALL WRITES AFTER ALL READS ---
        // Consume challenge atomically (single-use)
        transaction.delete(challengeRef);
        transaction.update(licenseDocRef, { lastOnlineCheckAt: now });
    });
    // 4. Issue 7-day cryptographic offline lease signed with server ECDSA
    const validUntilServer = now + SEVEN_DAYS_MS;
    const signatureToken = signLeasePayloadEcdsa(licenseId, derivedDeviceId, now, validUntilServer, verifiedLicense.expiresAt);
    const leaseToken = {
        licenseId,
        deviceId: derivedDeviceId,
        userId: verifiedLicense.userId,
        issuedAtServer: now,
        validUntilServer,
        licenseExpiresAt: verifiedLicense.expiresAt,
        signature: signatureToken
    };
    return {
        isValid: true,
        serverTime: now,
        expiresAt: verifiedLicense.expiresAt,
        daysRemaining: Math.ceil((verifiedLicense.expiresAt - now) / (24 * 60 * 60 * 1000)),
        leaseToken
    };
});
/**
 * 5. transferLicenseDevice (Admin Only - Requires Cryptographic Proof of New Device)
 * Transfers a license to a new hardware device.
 * Admin CANNOT register arbitrary deviceId; deviceId is strictly derived from verified newDevicePublicKey.
 */
exports.transferLicenseDevice = functions.https.onCall(async (request) => {
    const adminContext = await assertAdminPermission(request, 'transfer_license');
    const { licenseId, newDevicePublicKey, challenge, signature, newDeviceModel, reason, isWebClient = false } = request.data;
    if (!licenseId || !newDevicePublicKey || !challenge || !signature) {
        throw new functions.https.HttpsError('invalid-argument', 'پارامترهای انتقال ناقص است (licenseId, newDevicePublicKey, challenge, signature).');
    }
    validateEcPublicKey(newDevicePublicKey);
    // 1. Verify that new device actually owns the corresponding private key
    const publicKeyPem = formatSpkiToPem(newDevicePublicKey);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(Buffer.from(challenge, 'utf8'));
    const isSignatureValid = verifier.verify(publicKeyPem, signature, 'base64');
    if (!isSignatureValid) {
        throw new functions.https.HttpsError('permission-denied', 'امضای دیجیتال دستگاه جدید تایید نشد.');
    }
    // 2. Server derives newDeviceId strictly from verified public key
    const newDeviceId = deriveDeviceIdFromPublicKey(newDevicePublicKey, Boolean(isWebClient));
    const licenseDocRef = db.collection('licenses').doc(licenseId);
    const challengeRef = db.collection('deviceChallenges').doc(challenge);
    const newDeviceDocRef = db.collection('devices').doc(newDeviceId);
    const auditDocRef = db.collection('licenseAuditLogs').doc();
    const now = Date.now();
    let oldDeviceId = '';
    // 3. Strict Read-Before-Write Transaction
    await db.runTransaction(async (transaction) => {
        // --- ALL READS FIRST ---
        const challengeSnap = await transaction.get(challengeRef);
        const licenseSnap = await transaction.get(licenseDocRef);
        const newDeviceSnap = await transaction.get(newDeviceDocRef);
        if (!challengeSnap.exists) {
            throw new functions.https.HttpsError('permission-denied', 'کد چالش امنیتی منقضی یا نامعتبر است.');
        }
        const challengeData = challengeSnap.data();
        if (challengeData?.devicePublicKey !== newDevicePublicKey || now > (challengeData?.expiresAt || 0)) {
            throw new functions.https.HttpsError('permission-denied', 'چالش امنیتی دستگاه جدید معتبر نمی‌باشد.');
        }
        if (!licenseSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'لایسنس یافت نشد.');
        }
        const license = licenseSnap.data();
        if (license.isBlocked || license.status === 'revoked') {
            throw new functions.https.HttpsError('failed-precondition', 'لایسنس مسدود یا باطل شده قابل انتقال نیست.');
        }
        oldDeviceId = license.boundDeviceId;
        let oldDeviceSnap = null;
        let oldDeviceRef = null;
        if (oldDeviceId) {
            oldDeviceRef = db.collection('devices').doc(oldDeviceId);
            oldDeviceSnap = await transaction.get(oldDeviceRef);
        }
        // --- ALL WRITES AFTER ALL READS ---
        // 1. Consume challenge atomically
        transaction.delete(challengeRef);
        // 2. Revoke old device in database
        if (oldDeviceRef && oldDeviceSnap && oldDeviceSnap.exists) {
            transaction.update(oldDeviceRef, {
                status: 'unbound_transfer',
                transferredAt: now,
                transferReason: reason || 'Transferred by Admin'
            });
        }
        // 3. Update license (Keep startsAt and expiresAt intact!)
        transaction.update(licenseDocRef, {
            boundDeviceId: newDeviceId,
            lastOnlineCheckAt: now
        });
        // 4. Register new hardware device
        transaction.set(newDeviceDocRef, {
            deviceId: newDeviceId,
            devicePublicKey: newDevicePublicKey,
            firstBoundAt: newDeviceSnap.exists ? (newDeviceSnap.data()?.firstBoundAt || now) : now,
            licenseId,
            status: 'trusted',
            deviceModel: newDeviceModel || 'Android Device',
            lastHandshakeAt: now,
            isWebClient: Boolean(isWebClient)
        }, { merge: true });
        // 5. Append structured security audit log
        transaction.set(auditDocRef, {
            actorUid: adminContext.uid,
            actorRole: adminContext.role,
            actorEmail: adminContext.email,
            action: 'transfer',
            targetId: licenseId,
            timestamp: now,
            result: 'success',
            details: `Transferred license from hardware ${oldDeviceId || 'none'} to verified device ${newDeviceId}. Reason: ${reason || 'N/A'}`,
            metadata: {
                oldDeviceId,
                newDeviceId,
                newDeviceModel: newDeviceModel || 'Android Device',
                reason: reason || 'N/A'
            },
            // Backward compatibility:
            adminId: adminContext.uid,
            adminEmail: adminContext.email
        });
    });
    return {
        success: true,
        licenseId,
        oldDeviceId,
        newDeviceId,
        message: 'انتقال لایسنس به دستگاه جدید با موفقیت انجام شد. توجه: در صورت آفلاین بودن دستگاه قبلی، دسترسی آن حداکثر تا پایان اعتبار توکن آفلاین فعلی (حداکثر ۷ روز) معتبر خواهد بود.'
    };
});
/**
 * 6. renewLicense (Admin & Super Admin Only)
 */
exports.renewLicense = functions.https.onCall(async (request) => {
    const adminContext = await assertAdminPermission(request, 'renew_license');
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
    await recordSecurityAuditLog({
        actorUid: adminContext.uid,
        actorRole: adminContext.role,
        actorEmail: adminContext.email,
        action: 'renew',
        targetId: licenseId,
        result: 'success',
        details: `Extended license expiry by ${additionalYears} year(s) to ${new Date(newExpiry).toISOString()}`,
        metadata: {
            additionalYears,
            newExpiry
        }
    });
    return { success: true, newExpiry };
});
/**
 * 7. revokeLicense (Admin & Super Admin Only)
 */
exports.revokeLicense = functions.https.onCall(async (request) => {
    const adminContext = await assertAdminPermission(request, 'revoke_license');
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
    await recordSecurityAuditLog({
        actorUid: adminContext.uid,
        actorRole: adminContext.role,
        actorEmail: adminContext.email,
        action: 'revoke',
        targetId: licenseId,
        result: 'success',
        details: `Revoked license: ${blockReason}. Device blacklisted: ${blacklistDevice}`,
        metadata: {
            blockReason,
            blacklistDevice
        }
    });
    return { success: true };
});
/**
 * 8. setAdminRole (Super Admin Only)
 * Securely grants, changes, or revokes administrator privileges in Firestore & Firebase Auth Custom Claims.
 *
 * Rules:
 * - Invokable STRICTLY by authenticated Super Admin ('manage_admins' permission).
 * - Admin or Support callers are permanently rejected with permission-denied.
 * - Callers cannot modify their own status or self-promote.
 * - The last remaining active Super Admin cannot be removed, deactivated, or demoted.
 * - When an admin is deactivated, their Firebase Auth refresh tokens are immediately revoked.
 */
exports.setAdminRole = functions.https.onCall(async (request) => {
    const caller = await assertAdminPermission(request, 'manage_admins');
    const { targetUid, targetEmail, role = 'admin', active = true } = request.data;
    if (!targetUid || typeof targetUid !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid is required and must be a string.');
    }
    // Caller cannot modify own account (prevents self-promotion and accidental self-lockout)
    if (targetUid === caller.uid) {
        throw new functions.https.HttpsError('permission-denied', 'مدیر سیستم مجاز به تغییر سطح دسترسی یا وضعیت حساب کاربری خود نمی‌باشد.');
    }
    const validRoles = ['super_admin', 'admin', 'support'];
    if (!validRoles.includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', `نقش درخواستی (${role}) نامعتبر است. نقش‌های مجاز: ${validRoles.join(', ')}`);
    }
    const targetDocRef = db.collection('admins').doc(targetUid);
    const targetSnap = await targetDocRef.get();
    // Guard against removing or demoting the last active Super Admin
    if (targetSnap.exists) {
        const existingData = targetSnap.data();
        if (existingData?.role === 'super_admin' && (active === false || role !== 'super_admin')) {
            const activeSuperAdminsSnap = await db.collection('admins')
                .where('role', '==', 'super_admin')
                .where('active', '==', true)
                .get();
            const remainingSuperAdmins = activeSuperAdminsSnap.docs.filter((d) => d.id !== targetUid);
            if (remainingSuperAdmins.length === 0) {
                throw new functions.https.HttpsError('failed-precondition', 'امکان حذف، غیرفعال‌سازی یا تنزل درجه آخرین مدیر ارشد (Super Admin) سامانه وجود ندارد.');
            }
        }
    }
    const now = Date.now();
    await targetDocRef.set({
        uid: targetUid,
        email: targetEmail || (targetSnap.exists ? targetSnap.data()?.email : '') || '',
        role,
        active: Boolean(active),
        updatedAt: now,
        updatedBy: caller.uid,
        updatedByEmail: caller.email
    }, { merge: true });
    // Update Custom Claims and revoke active sessions on deactivation
    try {
        await admin.auth().setCustomUserClaims(targetUid, {
            admin: Boolean(active),
            role: active ? role : 'user'
        });
        if (!active) {
            // Force token refresh invalidation for immediate session cutoff
            await admin.auth().revokeRefreshTokens(targetUid);
        }
    }
    catch (err) {
        console.warn(`Could not update claims/revoke for user ${targetUid}:`, err);
    }
    await recordSecurityAuditLog({
        actorUid: caller.uid,
        actorRole: caller.role,
        actorEmail: caller.email,
        action: 'set_admin_role',
        targetId: targetUid,
        result: 'success',
        details: `Admin role updated by Super Admin ${caller.email} for ${targetEmail || targetUid} -> role=${role}, active=${active}`,
        metadata: {
            targetUid,
            targetEmail,
            role,
            active
        }
    });
    return { success: true, targetUid, role, active };
});
/**
 * 9. reviewLicenseRequest (Admin & Super Admin Only)
 * Approves or rejects a user's license activation or renewal request.
 * Support role CANNOT approve or reject requests.
 */
exports.reviewLicenseRequest = functions.https.onCall(async (request) => {
    const adminContext = await assertAdminPermission(request, 'review_requests');
    const { requestId, status, reviewNotes = '' } = request.data;
    if (!requestId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'requestId and status are required.');
    }
    if (status !== 'approved' && status !== 'rejected') {
        throw new functions.https.HttpsError('invalid-argument', 'وضعیت درخواست باید approved یا rejected باشد.');
    }
    const reqRef = db.collection('licenseRequests').doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'درخواست لایسنس مورد نظر یافت نشد.');
    }
    const now = Date.now();
    await reqRef.update({
        status,
        reviewNotes,
        reviewedAt: now,
        reviewedBy: adminContext.uid,
        reviewedByEmail: adminContext.email
    });
    await recordSecurityAuditLog({
        actorUid: adminContext.uid,
        actorRole: adminContext.role,
        actorEmail: adminContext.email,
        action: 'review_request',
        targetId: requestId,
        result: 'success',
        details: `Request ${status} by ${adminContext.email}. Notes: ${reviewNotes || 'None'}`,
        metadata: {
            requestId,
            status,
            reviewNotes
        }
    });
    return { success: true, requestId, status };
});
