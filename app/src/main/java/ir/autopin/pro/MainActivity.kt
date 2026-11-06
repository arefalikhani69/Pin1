package ir.autopin.pro

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import com.abdoessam.composeshield.CaptureState
import com.abdoessam.composeshield.ComposeShield
import com.abdoessam.composeshield.SecureContent
import ir.autopin.pro.security.AutoPinProSecurityBridge
import ir.autopin.pro.security.BaseSecureActivity

/**
 * MainActivity for AutoPin Pro
 * Powered by ComposeShield (io.github.abdo-essam:composeshield) and BaseSecureActivity
 *
 * Implemented Features:
 * 1. BaseSecureActivity: Guaranteed FLAG_SECURE before window attachment.
 * 2. SecureContent Composable: Hierarchy-wide screenshot & screen recording blocking.
 * 3. Real-time screen recording & mirroring detection via ComposeShield.captureState.
 * 4. Automatic obscuration overlay with exact message:
 *    "به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست."
 * 5. Automatic unmasking when screen recording stops.
 * 6. Local offline execution from APK assets (assets/www/index.html) via WebViewAssetLoader.
 * 7. Native photo gallery & camera picker for wiring diagrams and ECU photos.
 * 8. Android 14+ (API 34) Screenshot Detection Callback.
 */
class MainActivity : BaseSecureActivity() {

    private var webViewInstance: WebView? = null
    private var screenCaptureCallback: Activity.ScreenCaptureCallback? = null
    private var uploadMessageCallback: ValueCallback<Array<Uri>>? = null

    // Native ActivityResult launcher for photo gallery & camera file chooser in WebView
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val intent = result.data
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, intent)
        uploadMessageCallback?.onReceiveValue(uris)
        uploadMessageCallback = null
    }

    fun openFileChooser(
        callback: ValueCallback<Array<Uri>>?,
        params: WebChromeClient.FileChooserParams?
    ): Boolean {
        uploadMessageCallback?.onReceiveValue(null)
        uploadMessageCallback = callback
        val intent = params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        return try {
            fileChooserLauncher.launch(intent)
            true
        } catch (_: Exception) {
            uploadMessageCallback?.onReceiveValue(null)
            uploadMessageCallback = null
            false
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Initialize ComposeShield app-wide hardware protection
        ComposeShield.protect()

        // 2. Android 14+ (API 34) Screenshot Detection Callback
        registerAndroid14ScreenshotDetector()

        // 3. Compose UI with SecureContent & Real-time Capture State
        setContent {
            AutoPinProSecureApp(
                activity = this,
                onWebViewCreated = { webView ->
                    webViewInstance = webView
                }
            )
        }
    }

    private fun registerAndroid14ScreenshotDetector() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            screenCaptureCallback = Activity.ScreenCaptureCallback {
                runOnUiThread {
                    Toast.makeText(
                        applicationContext,
                        "به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.",
                        Toast.LENGTH_SHORT
                    ).show()

                    webViewInstance?.evaluateJavascript(
                        "window.onAndroidScreenshotAttempted?.('Android 14+ Screenshot Detection');",
                        null
                    )
                }
            }
            registerScreenCaptureCallback(mainExecutor, screenCaptureCallback!!)
        }
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            screenCaptureCallback?.let {
                unregisterScreenCaptureCallback(it)
            }
        }
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webViewInstance?.canGoBack() == true) {
            webViewInstance?.goBack()
        } else {
            super.onBackPressed()
        }
    }
}

/**
 * Root Composable wrapped strictly in ComposeShield's SecureContent.
 */
@Composable
fun AutoPinProSecureApp(
    activity: MainActivity,
    onWebViewCreated: (WebView) -> Unit
) {
    // 1. Observe real-time capture state from ComposeShield
    val captureState by ComposeShield.captureState.collectAsState()
    val isRecordingOrMirroring = captureState == CaptureState.Active
    var localWebView by remember { mutableStateOf<WebView?>(null) }

    // Intercept hardware and gesture back navigation: go back in WebView history or exit
    BackHandler(enabled = true) {
        if (localWebView?.canGoBack() == true) {
            localWebView?.goBack()
        } else {
            activity.finish()
        }
    }

    // 2. Notify web application whenever ComposeShield detects active recording / stops recording
    LaunchedEffect(captureState) {
        val active = captureState == CaptureState.Active
        localWebView?.evaluateJavascript(
            "window.onComposeShieldStateChanged?.($active, 'ComposeShield CaptureState');",
            null
        )
    }

    // 3. Wrap entire application root in ComposeShield SecureContent
    // This blocks screenshots, screen recording, recent apps preview, and protects Dialogs & Popups
    SecureContent {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF09090B)) // Dark automotive workshop theme
        ) {
            // Main Web Layer: Loads AutoPin Pro React Application locally from internal APK assets
            AndroidView(
                factory = { context ->
                    createAutoPinWebView(context, activity).also { wv ->
                        localWebView = wv
                        onWebViewCreated(wv)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Real-time Screen Recording & Mirroring Detection Overlay
            // Automatically triggered when ComposeShield detects active recording
            // Automatically unmasks when recording stops
            if (isRecordingOrMirroring) {
                ScreenRecordingBlockedOverlay()
            }
        }
    }
}

/**
 * Overlay displayed immediately when ComposeShield detects screen recording or screen mirroring.
 */
@Composable
fun ScreenRecordingBlockedOverlay() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF09090B)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B)),
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF450A0A),
                    modifier = Modifier.size(64.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Warning",
                            tint = Color(0xFFF87171),
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Exact prompt requirement:
                Text(
                    text = "به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "سرویس ضبط تصویر یا اشتراک‌گذاری صفحه تشخیص داده شد. لطفاً ضبط صفحه را متوقف کنید تا محتوای برنامه مجدداً نمایش داده شود.",
                    color = Color(0xFFA1A1AA),
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF27272A),
                    modifier = Modifier.padding(horizontal = 8.dp)
                ) {
                    Text(
                        text = "محافظت هوشمند ComposeShield فعال است",
                        color = Color(0xFF34D399),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
fun createAutoPinWebView(context: android.content.Context, activity: MainActivity): WebView {
    val assetLoader = WebViewAssetLoader.Builder()
        .setDomain("appassets.androidplatform.net")
        .addPathHandler("/assets/www/", WebViewAssetLoader.AssetsPathHandler(context))
        .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
        .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(context))
        .build()

    return WebView(context).apply {
        layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )

        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            // Insecure file access disabled; assets served exclusively via WebViewAssetLoader
            allowFileAccess = false
            allowContentAccess = true
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
            setGeolocationEnabled(false)
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        // Add JavaScript bridge for communication with ComposeShield & Hardware Keystore
        addJavascriptInterface(
            AutoPinProSecurityBridge(activity, this),
            "AndroidSecurityBridge"
        )

        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url
                // Allow internal local app assets
                if (url.host == "appassets.androidplatform.net") {
                    return false
                }
                // Safely open external URLs in external browser
                return try {
                    val browserIntent = Intent(Intent.ACTION_VIEW, url)
                    activity.startActivity(browserIntent)
                    true
                } catch (_: Exception) {
                    true
                }
            }

            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                // Intercept and serve bundled web assets completely offline from assets/www inside APK
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                view?.evaluateJavascript(
                    "console.log('AutoPin Pro: ComposeShield & Keystore bridge active across composition hierarchy.');",
                    null
                )
            }
        }

        webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                return activity.openFileChooser(filePathCallback, fileChooserParams)
            }
        }

        // Load offline AutoPin Pro UI from internal APK assets:
        loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }
}
