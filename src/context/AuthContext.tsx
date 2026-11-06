import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  verifyUserAdminRole,
  validateFirestoreConnection,
  BOOTSTRAP_ADMIN_EMAIL,
  AdminVerificationStatus,
  AdminVerificationResult
} from '../services/firebase';
import { AppUserProfile, AppUserRole } from '../types';
import { storage } from '../services/storage';
import { onlineStorage } from '../services/onlineStorage';

export type { AdminVerificationStatus, AdminVerificationResult };

interface AuthContextType {
  currentUser: User | null;
  userProfile: AppUserProfile | null;
  role: AppUserRole;
  isAdmin: boolean;
  adminRole: 'super_admin' | 'admin' | 'support' | null;
  adminVerificationStatus: AdminVerificationStatus;
  adminVerificationError: string | null;
  isAdminLoading: boolean;
  isTechnician: boolean;
  isStandardUser: boolean;
  isActive: boolean;
  isLoading: boolean;
  isOnlineDbConnected: boolean;
  accountDisabledError: string | null;
  clearAccountError: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  recheckAdminRole: () => Promise<AdminVerificationResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [role, setRole] = useState<AppUserRole>('user');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<'super_admin' | 'admin' | 'support' | null>(null);
  const [adminVerificationStatus, setAdminVerificationStatus] = useState<AdminVerificationStatus>('unauthenticated');
  const [adminVerificationError, setAdminVerificationError] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isTechnician, setIsTechnician] = useState<boolean>(false);
  const [isStandardUser, setIsStandardUser] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnlineDbConnected, setIsOnlineDbConnected] = useState<boolean>(false);
  const [accountDisabledError, setAccountDisabledError] = useState<string | null>(null);

  const applyProfile = useCallback((profile: AppUserProfile | null) => {
    setUserProfile(profile);
    if (!profile) {
      setRole('user');
      setIsAdmin(false);
      setAdminRole(null);
      setAdminVerificationStatus('unauthenticated');
      setAdminVerificationError(null);
      setIsAdminLoading(false);
      setIsTechnician(false);
      setIsStandardUser(true);
      setIsActive(true);
      return;
    }

    const currentRole = profile.role || 'user';
    setRole(currentRole);
    setIsAdmin(currentRole === 'admin');
    setIsTechnician(currentRole === 'technician');
    setIsStandardUser(currentRole === 'user');
    setIsActive(profile.isActive ?? true);
  }, []);

  const syncUserAndPermissions = useCallback(async (user: User) => {
    setIsAdminLoading(true);

    // 1. Sync in local storage
    const localProfile = storage.syncUserOnAuth({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    // 2. If online, sync to Firestore
    try {
      await onlineStorage.saveUser(localProfile);
    } catch {
      // ignore
    }

    // 3. Verify Admin role strictly with authoritative Firebase check
    const adminResult = await verifyUserAdminRole(user);

    // Guard against race conditions if user switched or signed out during async check
    if (auth.currentUser?.uid !== user.uid) {
      return;
    }

    // Check if the admin document is explicitly deactivated
    const isExplicitlyInactive = adminResult.status === 'inactive';

    // Master admin fallback is only allowed when document is not explicitly inactive
    const isMasterEmail =
      !isExplicitlyInactive &&
      (user.email?.toLowerCase() === 'arefalikhani69@gmail.com' ||
        (BOOTSTRAP_ADMIN_EMAIL && user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()));

    const isAuthorizedAdmin = !isExplicitlyInactive && (adminResult.isAdmin || isMasterEmail);

    if (isExplicitlyInactive) {
      setAdminVerificationStatus('inactive');
      setAdminRole(null);
      setAdminVerificationError(adminResult.errorMessage || 'دسترسی مدیریتی این حساب کاربری غیرفعال یا به حالت تعلیق درآمده است.');
    } else if (isMasterEmail && !adminResult.isAdmin) {
      setAdminVerificationStatus('verified');
      setAdminRole('super_admin');
      setAdminVerificationError(null);
    } else {
      setAdminVerificationStatus(adminResult.status);
      setAdminRole(adminResult.role || (isMasterEmail ? 'super_admin' : null));
      setAdminVerificationError(adminResult.errorMessage || null);
    }
    setIsAdminLoading(false);

    const finalRole: AppUserRole = isAuthorizedAdmin
      ? 'admin'
      : (localProfile.role === 'technician' ? 'technician' : 'user');

    const consolidatedProfile: AppUserProfile = {
      ...localProfile,
      role: finalRole
    };

    // Check account status
    if (consolidatedProfile.isActive === false) {
      setAccountDisabledError('حساب کاربری شما توسط مدیر سیستم به حالت تعلیق درآمده است. لطفاً جهت بررسی با مدیر تماس حاصل فرمایید.');
      await signOut(auth);
      setCurrentUser(null);
      applyProfile(null);
      return;
    }

    setAccountDisabledError(null);
    setCurrentUser(user);
    applyProfile(consolidatedProfile);
  }, [applyProfile]);

  useEffect(() => {
    // Initialize storage seed database on startup
    storage.initDatabase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.getIdToken();
          await syncUserAndPermissions(user);
        } catch (tokenErr: unknown) {
          console.warn('Auth token verification notice:', tokenErr);
          const msg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
          if (msg.includes('token-service-api') || msg.includes('auth/') || msg.includes('Fetching auth token failed')) {
            try {
              await signOut(auth);
            } catch {
              // ignore
            }
            setCurrentUser(null);
            applyProfile(null);
          } else {
            setCurrentUser(user);
            await syncUserAndPermissions(user);
          }
        }
      } else {
        setCurrentUser(null);
        applyProfile(null);
      }
      setIsLoading(false);

      validateFirestoreConnection()
        .then(res => setIsOnlineDbConnected(res.isConnected))
        .catch(() => setIsOnlineDbConnected(false));
    });

    return () => unsubscribe();
  }, [applyProfile, syncUserAndPermissions]);

  const refreshProfile = async () => {
    if (currentUser) {
      await syncUserAndPermissions(currentUser);
    }
  };

  const clearAccountError = () => {
    setAccountDisabledError(null);
  };

  const loginWithGoogle = async () => {
    try {
      setAccountDisabledError(null);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        await syncUserAndPermissions(res.user);
        storage.recordAuditLog({
          actionType: 'auth_login',
          userId: res.user.uid,
          userEmail: res.user.email || 'google-user',
          userRole: res.user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
          targetType: 'auth',
          targetTitle: 'ورود با حساب گوگل',
          status: 'success',
          summary: `ورود موفق کاربر «${res.user.email}» با حساب گوگل`
        });
      }
    } catch (err) {
      storage.recordAuditLog({
        actionType: 'auth_login',
        userId: 'anonymous',
        userEmail: 'google-auth',
        userRole: 'user',
        targetType: 'auth',
        targetTitle: 'ورود با گوگل',
        status: 'failure',
        summary: 'تلاش ناموفق برای ورود با حساب گوگل'
      });
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setAccountDisabledError(null);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await syncUserAndPermissions(res.user);
        storage.recordAuditLog({
          actionType: 'auth_login',
          userId: res.user.uid,
          userEmail: res.user.email || email,
          userRole: res.user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
          targetType: 'auth',
          targetTitle: 'ورود با ایمیل و رمز عبور',
          status: 'success',
          summary: `ورود موفق کاربر با ایمیل «${res.user.email || email}»`
        });
      }
    } catch (err) {
      storage.recordAuditLog({
        actionType: 'auth_login',
        userId: 'anonymous',
        userEmail: email,
        userRole: 'user',
        targetType: 'auth',
        targetTitle: 'ورود با ایمیل',
        status: 'failure',
        summary: `تلاش ناموفق برای ورود به سیستم با ایمیل «${email}»`
      });
      console.error('Email Sign-In failed:', err);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      setAccountDisabledError(null);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        if (displayName) {
          storage.saveUser({
            id: res.user.uid,
            email: res.user.email || email,
            displayName,
            role: 'user',
            isActive: true,
            createdAt: Date.now(),
            lastLoginAt: Date.now()
          });
        }
        await syncUserAndPermissions(res.user);
        storage.recordAuditLog({
          actionType: 'auth_login',
          userId: res.user.uid,
          userEmail: res.user.email || email,
          userRole: 'user',
          targetType: 'auth',
          targetTitle: 'ثبت‌نام کاربر جدید',
          status: 'success',
          summary: `ثبت‌نام و ورود کاربر جدید با ایمیل «${email}»`
        });
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  };

  const recheckAdminRole = async (): Promise<AdminVerificationResult> => {
    if (!currentUser) {
      const res: AdminVerificationResult = {
        isAdmin: false,
        role: null,
        status: 'unauthenticated',
        errorMessage: 'کاربر وارد سیستم نشده است.'
      };
      setAdminVerificationStatus('unauthenticated');
      setAdminRole(null);
      setIsAdmin(false);
      return res;
    }
    setIsAdminLoading(true);
    const res = await verifyUserAdminRole(currentUser);

    const isExplicitlyInactive = res.status === 'inactive';

    const isMasterEmail =
      !isExplicitlyInactive &&
      (currentUser.email?.toLowerCase() === 'arefalikhani69@gmail.com' ||
        (BOOTSTRAP_ADMIN_EMAIL && currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()));

    const isAuthorized = !isExplicitlyInactive && (res.isAdmin || isMasterEmail);

    if (isExplicitlyInactive) {
      setAdminVerificationStatus('inactive');
      setAdminRole(null);
      setAdminVerificationError(res.errorMessage || 'دسترسی مدیریتی این حساب کاربری غیرفعال یا به حالت تعلیق درآمده است.');
    } else if (isMasterEmail && !res.isAdmin) {
      setAdminVerificationStatus('verified');
      setAdminRole('super_admin');
      setAdminVerificationError(null);
    } else {
      setAdminVerificationStatus(res.status);
      setAdminRole(res.role || (isMasterEmail ? 'super_admin' : null));
      setAdminVerificationError(res.errorMessage || null);
    }
    setIsAdminLoading(false);

    if (isAuthorized) {
      setIsAdmin(true);
      setRole('admin');
      if (userProfile) {
        setUserProfile({ ...userProfile, role: 'admin' });
      }
    } else {
      setIsAdmin(false);
      setRole(userProfile?.role === 'technician' ? 'technician' : 'user');
    }
    return res;
  };

  const logout = async () => {
    if (currentUser) {
      storage.recordAuditLog({
        actionType: 'auth_logout',
        userId: currentUser.uid,
        userEmail: currentUser.email || 'unknown',
        userRole: role,
        targetType: 'auth',
        targetTitle: 'خروج از حساب کاربری',
        status: 'success',
        summary: `خروج کاربر «${currentUser.email || currentUser.uid}» از سامانه`
      });
    }
    setCurrentUser(null);
    applyProfile(null);
    setAdminRole(null);
    setAdminVerificationStatus('unauthenticated');
    setAdminVerificationError(null);
    setIsAdmin(false);
    setAccountDisabledError(null);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        isAdmin,
        adminRole,
        adminVerificationStatus,
        adminVerificationError,
        isAdminLoading,
        isTechnician,
        isStandardUser,
        isActive,
        isLoading,
        isOnlineDbConnected,
        accountDisabledError,
        clearAccountError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
        recheckAdminRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
