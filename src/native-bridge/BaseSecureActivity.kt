package ir.autopin.pro.security

import android.app.Activity
import android.app.Dialog
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity

/**
 * BaseSecureActivity
 * Guarantees that ALL Activities and Dialogs in AutoPin Pro strictly enforce FLAG_SECURE
 * before any layout or view hierarchy is attached or rendered.
 */
abstract class BaseSecureActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Enforce FLAG_SECURE BEFORE super.onCreate and before setContentView
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        super.onCreate(savedInstanceState)
    }

    override fun onResume() {
        super.onResume()
        // Re-verify that FLAG_SECURE is still active upon returning from background/recents
        ensureFlagSecureActive()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            ensureFlagSecureActive()
        }
    }

    /**
     * Helper to secure custom Android Dialogs, AlertPanels, or BottomSheets.
     */
    fun secureDialog(dialog: Dialog) {
        dialog.window?.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
    }

    private fun ensureFlagSecureActive() {
        val flags = window.attributes.flags
        if ((flags and WindowManager.LayoutParams.FLAG_SECURE) == 0) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }
}
