/**
 * AutoPin Pro - Firebase App Check Infrastructure
 *
 * Configures:
 * 1. Production Android Native: In native Android (MainActivity), App Check is registered via Firebase Android SDK (PlayIntegrity).
 * 2. Web / Dev Preview: ReCaptcha V3 (if siteKey is provided) or Debug Provider in local dev.
 * 3. Security Boundary: License verification is cryptographically independent of App Check.
 *    Any App Check state/error does NOT bypass or alter ECDSA license and hardware Keystore validation.
 */

import { initializeAppCheck, CustomProvider, AppCheck } from 'firebase/app-check';
import { getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

let appCheckInstance: AppCheck | null = null;

export async function initAppCheck(): Promise<AppCheck | null> {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  try {
    const app = !getApps().length ? undefined : getApp();
    if (!app) return null;

    const isNativeAndroid = Boolean(window.AndroidSecurityBridge);

    // In native Android wrapper, native layer manages Play Integrity.
    // The web layer passes requests through the local WebViewAssetLoader domain (appassets.androidplatform.net)
    if (isNativeAndroid) {
      // In native Android APK, requests from local origin are trusted by local WebView.
      // If native bridge provides a genuine Play Integrity token, it can be passed here.
      return null;
    }

    // Web Production Mode (ReCaptcha V3)
    if (firebaseConfig.recaptchaSiteKey && firebaseConfig.recaptchaSiteKey.trim().length > 0) {
      const { ReCaptchaV3Provider } = await import('firebase/app-check');
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      return appCheckInstance;
    }

    // Development / Local preview only (Strictly gated by import.meta.env.DEV)
    if (import.meta.env.DEV) {
      const devProvider = new CustomProvider({
        getToken: async () => ({
          token: 'app_check_local_dev_token',
          expireTimeMillis: Date.now() + (60 * 60 * 1000)
        })
      });
      appCheckInstance = initializeAppCheck(app, {
        provider: devProvider,
        isTokenAutoRefreshEnabled: true
      });
      return appCheckInstance;
    }

    return null;
  } catch (err) {
    // Non-fatal: Sideloaded APK or missing Play Services should not prevent local operation
    console.warn('Firebase App Check initialization was skipped or deferred:', err);
    return null;
  }
}
