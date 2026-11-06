# AutoPin Pro - ProGuard / R8 Rules

# Preserve JavaScript Interface methods on AutoPinProSecurityBridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class ir.autopin.pro.security.AutoPinProSecurityBridge {
    public *;
}

# Preserve Hardware Keystore classes
-keep class ir.autopin.pro.security.DeviceKeystoreSecurity {
    public *;
}

-keep class ir.autopin.pro.security.BaseSecureActivity {
    public *;
}

# Preserve ComposeShield public APIs and state
-keep class com.abdoessam.composeshield.** { *; }

# WebKit AssetLoader
-keep class androidx.webkit.** { *; }
