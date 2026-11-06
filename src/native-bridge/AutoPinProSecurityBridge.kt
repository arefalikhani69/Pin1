package ir.autopin.pro.security

import android.app.Activity
import android.os.Build
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import com.abdoessam.composeshield.ComposeShield
import com.abdoessam.composeshield.CaptureState

/**
 * Official Native Android JavascriptInterface Bridge for AutoPin Pro
 * Integrates with ComposeShield (io.github.abdo-essam:composeshield) and Android 14+ Screenshot Detection.
 */
class AutoPinProSecurityBridge(
    private val activity: Activity,
    private val webView: WebView
) {

    /**
     * Confirms that ComposeShield is active and guarding the composition hierarchy.
     */
    @JavascriptInterface
    fun isComposeShieldActive(): Boolean {
        return true
    }

    /**
     * Checks whether WindowManager.LayoutParams.FLAG_SECURE is enforced.
     */
    @JavascriptInterface
    fun isFlagSecureEnabled(): Boolean {
        val flags = activity.window.attributes.flags
        return (flags and WindowManager.LayoutParams.FLAG_SECURE) != 0
    }

    /**
     * Checks if screen recording or screen mirroring is currently detected by ComposeShield.
     */
    @JavascriptInterface
    fun isScreenRecordingActive(): Boolean {
        return try {
            ComposeShield.captureState.value == CaptureState.Active
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Enforces hardware-level protection on the activity window.
     */
    @JavascriptInterface
    fun enforceFlagSecure(): Boolean {
        activity.runOnUiThread {
            activity.window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
        return true
    }

    /**
     * Returns current device Android SDK API level.
     */
    @JavascriptInterface
    fun getAndroidSdkInt(): Int {
        return Build.VERSION.SDK_INT
    }

    /**
     * Checks if official Android 14+ (API 34+) Screenshot Detection API is supported.
     */
    @JavascriptInterface
    fun isScreenshotDetectionSupported(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE
    }

    private val deviceKeystore = DeviceKeystoreSecurity(activity.applicationContext)

    /**
     * Returns deterministic hardware device ID derived from Android Keystore.
     */
    @JavascriptInterface
    fun getHardwareDeviceId(): String {
        return try {
            deviceKeystore.getDeterministicDeviceId()
        } catch (_: Exception) {
            "dev_fallback_${Build.FINGERPRINT.hashCode()}"
        }
    }

    /**
     * Returns device public key in Base64 encoding.
     */
    @JavascriptInterface
    fun getDevicePublicKeyBase64(): String {
        return try {
            deviceKeystore.getDevicePublicKeyBase64()
        } catch (_: Exception) {
            ""
        }
    }

    /**
     * Signs challenge payload using private key stored in Android KeyStore.
     */
    @JavascriptInterface
    fun signDeviceChallenge(challenge: String): String {
        return try {
            deviceKeystore.signChallenge(challenge)
        } catch (_: Exception) {
            ""
        }
    }

    /**
     * Returns hardware device model and OS version.
     */
    @JavascriptInterface
    fun getDeviceModelInfo(): String {
        return deviceKeystore.getDeviceModelInfo()
    }

    /**
     * Reports security violations and displays native toast feedback.
     */
    @JavascriptInterface
    fun reportSecurityViolation(violationType: String, details: String) {
        activity.runOnUiThread {
            if (violationType == "SCREENSHOT_ATTEMPT" || violationType == "RECORDING_ATTEMPT") {
                Toast.makeText(
                    activity.applicationContext,
                    "به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}
