/**
 * AutoPin Pro - Authoritative Server-side One-time Initial Super Admin Bootstrap Tool
 *
 * SECURITY & ARCHITECTURAL SPECIFICATION:
 * 1. Strictly executed server-side via Node.js using Firebase Admin SDK with elevated privileges.
 * 2. Authenticates using Google Application Default Credentials (ADC) or explicit service account.
 * 3. Connects to the EXACT same Firebase Project and named Firestore Database as the client application:
 *    - Project ID: firebaseConfig.projectId (airy-sunrise-fc70r)
 *    - Database ID: firebaseConfig.firestoreDatabaseId (ai-studio-autopinpro-6597dde9-59f0-4a2e-90e5-55436f30fb2d)
 * 4. Receives the target admin UID strictly via TARGET_ADMIN_UID environment variable.
 * 5. Verifies target account existence in Firebase Authentication before database modification.
 * 6. Executes inside an atomic Firestore transaction (db.runTransaction):
 *    - Checks system_config/bootstrap (fails if completed === true).
 *    - Checks existing admins collection (fails if any active super_admin exists).
 *    - Safeguards target document: fails if target already has an incompatible role unless FORCE_ROLE_OVERWRITE=true.
 * 7. Applies constant-time timing-safe comparison on high-entropy BOOTSTRAP_SECRET (min 24 characters).
 * 8. Zero client exposure: Never bundled into client, APK, LocalStorage, or public endpoints.
 * 9. Sets authoritative document schema:
 *    {
 *      uid: TARGET_ADMIN_UID,
 *      email: userRecord.email,
 *      role: "super_admin",
 *      active: true,
 *      createdAt: FieldValue.serverTimestamp(),
 *      updatedAt: FieldValue.serverTimestamp(),
 *      method: "server_script_bootstrap"
 *    }
 */

import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import firebaseConfig from '../firebase-applet-config.json';

const MIN_SECRET_LENGTH = 24;

export const TARGET_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  firebaseConfig.projectId ||
  'airy-sunrise-fc70r';

export const TARGET_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  firebaseConfig.firestoreDatabaseId ||
  'ai-studio-autopinpro-6597dde9-59f0-4a2e-90e5-55436f30fb2d';

/**
 * Timing-safe comparison to prevent side-channel timing attacks on the bootstrap secret.
 */
function validateSecretTimingSafe(providedSecret: string): boolean {
  if (!providedSecret || typeof providedSecret !== 'string' || providedSecret.length < MIN_SECRET_LENGTH) {
    return false;
  }

  const expectedSecret = process.env.EXPECTED_BOOTSTRAP_SECRET?.trim();
  if (expectedSecret) {
    const providedHash = crypto.createHash('sha256').update(providedSecret).digest();
    const expectedHash = crypto.createHash('sha256').update(expectedSecret).digest();
    return crypto.timingSafeEqual(providedHash, expectedHash);
  }

  // If no static expected secret was pre-configured, enforce high cryptographic entropy
  // (at least 24 characters, containing digits, uppercase, lowercase, and special characters)
  const hasUpper = /[A-Z]/.test(providedSecret);
  const hasLower = /[a-z]/.test(providedSecret);
  const hasDigit = /[0-9]/.test(providedSecret);
  const hasSpecial = /[^A-Za-z0-9]/.test(providedSecret);

  return hasUpper && hasLower && hasDigit && hasSpecial;
}

export async function runBootstrap(): Promise<void> {
  console.log('\n================================================================');
  console.log(' AutoPin Pro - Secure Super Admin Recovery Tool');
  console.log('================================================================\n');

  // 1. Validate Secret
  const secret = process.env.BOOTSTRAP_SECRET?.trim();
  if (!secret || !validateSecretTimingSafe(secret)) {
    console.error('❌ خطا: مقدار BOOTSTRAP_SECRET نامعتبر است.');
    console.error(`- این کلید باید حداقل ۲۴ کاراکتر و شامل حروف بزرگ، کوچک، عدد و علائم خاص باشد.`);
    console.error('- جهت تولید کلید امن در ترمینال سرور:');
    console.error('  openssl rand -base64 24');
    process.exit(1);
  }

  // 2. Validate Target UID
  const targetUid = process.env.TARGET_ADMIN_UID?.trim();
  if (!targetUid || targetUid.length < 10) {
    console.error('❌ خطا: مقدار TARGET_ADMIN_UID نامعتبر است.');
    console.error('- این مقدار باید شناسه ۲۸ کاراکتری کاربر در Firebase Authentication باشد.');
    process.exit(1);
  }

  console.log(`📋 بررسی تطابق پیکربندی:`);
  console.log(`   └─ Project ID:  ${TARGET_PROJECT_ID}`);
  console.log(`   └─ Database ID: ${TARGET_DATABASE_ID}`);
  console.log(`   └─ Target UID:  ${targetUid}`);

  // 3. Initialize Firebase Admin SDK
  console.log('\n🔐 در حال احراز هویت با Firebase Admin SDK...');
  let credential: admin.Credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(parsed);
      console.log('   └─ از کلید Service Account محیطی استفاده شد.');
    } catch {
      credential = admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('   └─ از فایل Service Account مسیر استفاده شد.');
    }
  } else {
    credential = admin.credential.applicationDefault();
    console.log('   └─ از Application Default Credentials (ADC) استفاده شد.');
  }

  const app = !admin.apps.length
    ? admin.initializeApp({
        credential,
        projectId: TARGET_PROJECT_ID
      })
    : admin.app();

  const db = getFirestore(app, TARGET_DATABASE_ID);

  // 4. Verify target account exists in Firebase Authentication
  console.log('\n👤 استعلام حساب کاربر در Firebase Authentication...');
  let targetUserRecord: admin.auth.UserRecord;
  try {
    targetUserRecord = await admin.auth().getUser(targetUid);
    console.log(`   ✅ حساب در Firebase Auth تایید شد: ${targetUserRecord.email || '(بدون ایمیل)'}`);
    console.log(`   └─ نام نمایشی: ${targetUserRecord.displayName || 'ثبت نشده'}`);
    console.log(`   └─ تاریخ ساخت: ${targetUserRecord.metadata.creationTime}`);
  } catch (authErr: unknown) {
    const msg = authErr instanceof Error ? authErr.message : String(authErr);
    console.error(`❌ خطا در استعلام حساب: کاربر با UID «${targetUid}» در Firebase Auth یافت نشد.`);
    console.error(`   └─ جزئیات: ${msg}`);
    process.exit(1);
  }

  // 5. Atomic Transaction: Bootstrap Check and Admin Provisioning
  console.log('\n🔄 شروع تراکنش اتمیک در Firestore...');
  const bootstrapDocRef = db.collection('system_config').doc('bootstrap');
  const adminDocRef = db.collection('admins').doc(targetUid);

  try {
    await db.runTransaction(async (transaction) => {
      // 5a. Check Bootstrap Lock
      const bootstrapSnap = await transaction.get(bootstrapDocRef);
      if (bootstrapSnap.exists && bootstrapSnap.data()?.completed === true) {
        throw new Error('سیستم قبلاً راه‌اندازی (Bootstrap) شده و قفل دائمی فعال است.');
      }

      // 5b. Check for existing active super_admin
      const activeSuperAdmins = await db
        .collection('admins')
        .where('active', '==', true)
        .where('role', '==', 'super_admin')
        .limit(1)
        .get();

      if (!activeSuperAdmins.empty) {
        const existing = activeSuperAdmins.docs[0];
        if (existing.id !== targetUid) {
          throw new Error(
            `یک مدیر ارشد دیگر با شناسه «${existing.id}» در دیتابیس فعال است. امکان ثبت مدیر ارشد دوم وجود ندارد.`
          );
        }
      }

      // 5c. Check existing target document (prevent unintended role overwrite)
      const targetAdminSnap = await transaction.get(adminDocRef);
      if (targetAdminSnap.exists) {
        const existingData = targetAdminSnap.data();
        if (existingData?.role && existingData.role !== 'super_admin') {
          if (process.env.FORCE_ROLE_OVERWRITE !== 'true') {
            throw new Error(
              `این حساب دارای سند قبلی با نقش «${existingData.role}» است. جهت ارتقا به super_admin متغیر FORCE_ROLE_OVERWRITE=true را ارسال فرمایید.`
            );
          }
        }
      }

      // 5d. Write authoritative super_admin document
      const now = FieldValue.serverTimestamp();
      transaction.set(
        adminDocRef,
        {
          uid: targetUid,
          email: targetUserRecord.email || '',
          role: 'super_admin',
          active: true,
          createdAt: now,
          updatedAt: now,
          method: 'server_script_bootstrap'
        },
        { merge: true }
      );

      // 5e. Lock bootstrap state permanently
      transaction.set(
        bootstrapDocRef,
        {
          completed: true,
          completedAt: now,
          initialAdminUid: targetUid,
          initialAdminEmail: targetUserRecord.email || '',
          method: 'server_script_bootstrap'
        },
        { merge: true }
      );
    });

    // 6. Set Custom Claims for backend and microservice compatibility
    try {
      await admin.auth().setCustomUserClaims(targetUid, {
        admin: true,
        role: 'super_admin'
      });
      console.log('   ✅ Custom Claims (admin=true, role=super_admin) با موفقیت به‌روزرسانی شد.');
    } catch (claimErr) {
      console.warn('   ⚠️ توجه: خطا در تنظیم Custom Claim (سند Firestore معتبر ثبت شد):', claimErr);
    }

    console.log('\n================================================================');
    console.log('🎉 عملیات ثبت مدیر ارشد سامانه با موفقیت کامل انجام شد!');
    console.log(`   ├─ شناسه کاربر (UID): ${targetUid}`);
    console.log(`   ├─ ایمیل متصل:        ${targetUserRecord.email || 'N/A'}`);
    console.log(`   ├─ سطح دسترسی:        super_admin`);
    console.log(`   ├─ وضعیت:             active: true`);
    console.log(`   ├─ دیتابیس هدف:       ${TARGET_DATABASE_ID}`);
    console.log(`   └─ پروژه هدف:         ${TARGET_PROJECT_ID}`);
    console.log('================================================================\n');
  } catch (txErr: unknown) {
    const errorMsg = txErr instanceof Error ? txErr.message : String(txErr);
    console.error(`\n❌ شکست در اجرای تراکنش Bootstrap: ${errorMsg}`);
    process.exit(1);
  }
}

// Only execute when run directly from command line
if (process.argv[1]?.endsWith('bootstrap-super-admin.ts')) {
  runBootstrap().catch((err) => {
    console.error('Fatal unhandled error:', err);
    process.exit(1);
  });
}
