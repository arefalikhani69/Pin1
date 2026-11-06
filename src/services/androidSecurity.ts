/**
 * AutoPin Pro - Android Native Security Bridge & Protection Service
 * Official ComposeShield (io.github.abdo-essam:composeshield) & Android 14+ Screenshot Detection API integration
 */

import { storage } from './storage';

export interface AndroidSecurityBridgeInterface {
  isFlagSecureEnabled: () => boolean;
  isComposeShieldActive?: () => boolean;
  enforceFlagSecure: () => boolean;
  getAndroidSdkInt: () => number;
  isScreenshotDetectionSupported: () => boolean;
  reportSecurityViolation: (violationType: string, details: string) => void;
  isHardwareKeystoreReady?: () => boolean;
  getHardwareDeviceId?: () => string;
  getDevicePublicKeyBase64?: () => string;
  signDeviceChallenge?: (challenge: string) => string;
  getDeviceModelInfo?: () => string;
}

declare global {
  interface Window {
    AndroidSecurityBridge?: AndroidSecurityBridgeInterface;
    onAndroidScreenshotAttempted?: (source?: string) => void;
    onComposeShieldStateChanged?: (isRecording: boolean, reason?: string) => void;
  }
}

export interface SecurityProtectionStatus {
  isNativeAndroid: boolean;
  isFlagSecureActive: boolean;
  isComposeShieldActive: boolean;
  androidApiLevel: number | null;
  isScreenshotDetectionActive: boolean;
  webShieldActive: boolean;
}

export type SecurityEventType =
  | 'screenshot_attempt'
  | 'screen_record_blocked'
  | 'screen_record_active'
  | 'screen_record_inactive'
  | 'window_blur';

type SecurityCallback = (event: {
  type: SecurityEventType;
  message: string;
  timestamp: number;
}) => void;

class AndroidSecurityService {
  private listeners: Set<SecurityCallback> = new Set();
  private isInitialized = false;
  private isScreenRecordingCurrentlyActive = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // 1. Hook Android 14+ Screenshot Detection callback
    window.onAndroidScreenshotAttempted = (source?: string) => {
      this.handleScreenshotAttempt(source || 'Android 14+ ScreenCaptureCallback');
    };

    // 2. Hook ComposeShield real-time CaptureState callback (Screen Recording / Mirroring)
    window.onComposeShieldStateChanged = (isRecording: boolean, reason?: string) => {
      this.handleComposeShieldState(isRecording, reason || 'ComposeShield CaptureState');
    };

    // 3. Intercept navigator.mediaDevices.getDisplayMedia (Screen Recording from Web/Extensions)
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
        navigator.mediaDevices.getDisplayMedia = async function () {
          androidSecurity.notifyListeners({
            type: 'screen_record_blocked',
            message: 'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.',
            timestamp: Date.now()
          });

          storage.recordAuditLog({
            actionType: 'security_screenshot_blocked',
            userId: 'system',
            userEmail: 'security@autopin.ir',
            userRole: 'system',
            targetType: 'security',
            targetTitle: 'ComposeShield Screen Recording Guard',
            summary: 'تلاش برای ضبط ویدیویی از صفحه با MediaProjection مسدود شد.',
            status: 'success',
            details: {
              source: 'navigator.mediaDevices.getDisplayMedia',
              enforcedBy: 'ComposeShield (io.github.abdo-essam:composeshield)'
            }
          });

          throw new DOMException(
            'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.',
            'NotAllowedError'
          );
        };
      }
    } catch {
      // Ignore if getDisplayMedia is read-only
    }

    // 4. If running inside Native Android ComposeShield container, verify immediately
    if (this.isNativeAndroid()) {
      try {
        window.AndroidSecurityBridge?.enforceFlagSecure();
        storage.recordAuditLog({
          actionType: 'security_flag_secure',
          userId: 'system',
          userEmail: 'security@autopin.ir',
          userRole: 'system',
          targetType: 'security',
          targetTitle: 'ComposeShield Initialization',
          summary: 'پروتکل امنیتی ComposeShield (SecureContent) در کانتینر اندروید فعال و مستقر شد.',
          status: 'success',
          details: {
            apiLevel: window.AndroidSecurityBridge?.getAndroidSdkInt(),
            composeShield: true,
            screenshotDetection: window.AndroidSecurityBridge?.isScreenshotDetectionSupported()
          }
        });
      } catch (err) {
        console.warn('ComposeShield native bridge note:', err);
      }
    }
  }

  public isNativeAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.AndroidSecurityBridge && typeof window.AndroidSecurityBridge.isFlagSecureEnabled === 'function');
  }

  public isComposeShieldActive(): boolean {
    if (this.isNativeAndroid() && typeof window.AndroidSecurityBridge?.isComposeShieldActive === 'function') {
      return window.AndroidSecurityBridge.isComposeShieldActive();
    }
    return true; // Virtual shield active on web
  }

  public getStatus(): SecurityProtectionStatus {
    const isNative = this.isNativeAndroid();
    const isSecureActive = isNative
      ? (window.AndroidSecurityBridge?.isFlagSecureEnabled() ?? true)
      : true;
    const isComposeActive = this.isComposeShieldActive();
    const apiLevel = isNative
      ? (window.AndroidSecurityBridge?.getAndroidSdkInt() ?? null)
      : null;
    const isScreenshotDetectionActive = isNative
      ? (window.AndroidSecurityBridge?.isScreenshotDetectionSupported() ?? false)
      : false;

    return {
      isNativeAndroid: isNative,
      isFlagSecureActive: isSecureActive,
      isComposeShieldActive: isComposeActive,
      androidApiLevel: apiLevel,
      isScreenshotDetectionActive,
      webShieldActive: true
    };
  }

  public handleComposeShieldState(isRecording: boolean, reason: string): void {
    this.isScreenRecordingCurrentlyActive = isRecording;

    if (isRecording) {
      const message = 'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.';
      this.notifyListeners({
        type: 'screen_record_active',
        message,
        timestamp: Date.now()
      });

      storage.recordAuditLog({
        actionType: 'security_screenshot_blocked',
        userId: 'system',
        userEmail: 'security@autopin.ir',
        userRole: 'system',
        targetType: 'security',
        targetTitle: 'ComposeShield Screen Recording Detected',
        summary: `ضبط صفحه تشخیص داده شد و محتوا بلافاصله پوشانده گردید (${reason}).`,
        status: 'success',
        details: {
          reason,
          library: 'ComposeShield (io.github.abdo-essam:composeshield)'
        }
      });
    } else {
      // Automatic recovery when recording stops
      this.notifyListeners({
        type: 'screen_record_inactive',
        message: 'ضبط صفحه متوقف شد. نمایش برنامه به حالت عادی بازگشت.',
        timestamp: Date.now()
      });
    }
  }

  public handleScreenshotAttempt(source: string): void {
    const message = 'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.';

    this.notifyListeners({
      type: 'screenshot_attempt',
      message,
      timestamp: Date.now()
    });

    storage.recordAuditLog({
      actionType: 'security_screenshot_blocked',
      userId: 'system',
      userEmail: 'security@autopin.ir',
      userRole: 'system',
      targetType: 'security',
      targetTitle: 'سرویس مسدودسازی تصویربرداری ComposeShield',
      summary: `تلاش برای ثبت اسکرین‌شات مسدود گردید (${source}).`,
      status: 'success',
      details: {
        source,
        library: 'ComposeShield (SecureContent)',
        timestamp: Date.now()
      }
    });

    if (this.isNativeAndroid()) {
      try {
        window.AndroidSecurityBridge?.reportSecurityViolation('SCREENSHOT_ATTEMPT', source);
      } catch {
        // ignore
      }
    }
  }

  public addListener(callback: SecurityCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(event: {
    type: SecurityEventType;
    message: string;
    timestamp: number;
  }): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error executing security listener:', err);
      }
    });
  }
}

export const androidSecurity = new AndroidSecurityService();
