import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const functionsInstance: Functions = getFunctions(app);
export const storageBucket = getStorage(app);
try {
  storageBucket.maxUploadRetryTime = 3000;
  storageBucket.maxOperationRetryTime = 3000;
} catch {
  // Ignore if property is readonly
}

// Configurable Master Admin email (configured via VITE_ADMIN_EMAIL or Phase 1 master admin email)
export const BOOTSTRAP_ADMIN_EMAIL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAIL) || 'arefalikhani69@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type AdminVerificationStatus =
  | 'verified'
  | 'not_found'
  | 'inactive'
  | 'invalid_role'
  | 'permission_denied'
  | 'network_error'
  | 'unauthenticated';

export interface AdminVerificationResult {
  isAdmin: boolean;
  role: 'super_admin' | 'admin' | 'support' | null;
  status: AdminVerificationStatus;
  errorMessage?: string;
}

// Check if user has admin privileges directly from authoritative server document
export async function verifyUserAdminRole(user: User | null): Promise<AdminVerificationResult> {
  if (!user) {
    return {
      isAdmin: false,
      role: null,
      status: 'unauthenticated',
      errorMessage: 'کاربر به حساب کاربری Firebase وارد نشده است.'
    };
  }

  try {
    // Read directly from server to bypass stale local cache and guarantee real-time verification
    const adminSnap = await getDocFromServer(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      return {
        isAdmin: false,
        role: null,
        status: 'not_found',
        errorMessage: 'سند مدیریت برای این حساب کاربری در پایگاه داده ثبت نشده است.'
      };
    }

    const data = adminSnap.data();
    if (data?.active !== true) {
      return {
        isAdmin: false,
        role: null,
        status: 'inactive',
        errorMessage: 'دسترسی مدیریتی این حساب کاربری غیرفعال یا به حالت تعلیق درآمده است.'
      };
    }

    const docRole = data?.role;
    if (docRole !== 'super_admin' && docRole !== 'admin' && docRole !== 'support') {
      return {
        isAdmin: false,
        role: null,
        status: 'invalid_role',
        errorMessage: `نقش تعریف‌شده در سند (${docRole}) برای پنل مدیریت معتبر نیست.`
      };
    }

    return {
      isAdmin: true,
      role: docRole,
      status: 'verified'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorCode = (err as { code?: string })?.code || '';

    // Check for permission denied
    if (
      errorCode === 'permission-denied' ||
      errorMsg.includes('permission-denied') ||
      errorMsg.includes('insufficient permissions')
    ) {
      return {
        isAdmin: false,
        role: null,
        status: 'permission_denied',
        errorMessage: 'خطای امنیتی پایگاه داده: دسترسی به اسناد مدیریتی توسط قوانین سرور مسدود شد.'
      };
    }

    // Check for offline / network errors
    if (
      errorCode === 'unavailable' ||
      errorMsg.includes('offline') ||
      errorMsg.includes('unavailable') ||
      errorMsg.includes('Failed to get document because the client is offline')
    ) {
      // In case of offline, attempt cached read if previously authenticated, but strictly verify active === true
      try {
        const cachedSnap = await getDoc(doc(db, 'admins', user.uid));
        if (cachedSnap.exists()) {
          const cachedData = cachedSnap.data();
          if (
            cachedData?.active === true &&
            (cachedData.role === 'super_admin' || cachedData.role === 'admin' || cachedData.role === 'support')
          ) {
            return {
              isAdmin: true,
              role: cachedData.role,
              status: 'verified'
            };
          }
        }
      } catch {
        // ignore cache error
      }

      return {
        isAdmin: false,
        role: null,
        status: 'network_error',
        errorMessage: 'عدم برقراری ارتباط با سرور پایگاه داده ابری. لطفاً وضعیت اتصال اینترنت را بررسی کنید.'
      };
    }

    return {
      isAdmin: false,
      role: null,
      status: 'permission_denied',
      errorMessage: `خطا در استعلام سند مدیر: ${errorMsg}`
    };
  }
}

// Test connection on boot
export async function validateFirestoreConnection(): Promise<{ isConnected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { isConnected: true, message: 'اتصال پایگاه داده آنلاین برقرار است' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('token-service-api') ||
      msg.includes('Fetching auth token failed') ||
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('unavailable') ||
      msg.includes('deadline-exceeded')
    ) {
      if (msg.includes('token-service-api') || msg.includes('Fetching auth token failed')) {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
      }
      return { isConnected: false, message: 'کلاینت در حالت آفلاین است' };
    }
    // Only if it's permission-denied without token errors, network handshake succeeded
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return { isConnected: true, message: 'سرویس آنلاین در دسترس است' };
    }
    return { isConnected: false, message: 'سرویس در دسترس نیست' };
  }
}

// Upload file to Cloud Storage with clean path structure and fast fallback timeout
export async function uploadToFirebaseStorage(
  file: File | Blob,
  path: string,
  timeoutMs = 12000
): Promise<string> {
  const uploadTask = async () => {
    const storageRef = ref(storageBucket, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    return await getDownloadURL(snapshot.ref);
  };

  const timeoutTask = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Storage operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([uploadTask(), timeoutTask]);
  } catch (error) {
    console.warn('Cloud Storage upload failed or timed out:', error);
    throw error;
  }
}

export {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export type { User };
