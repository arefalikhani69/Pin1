# راهنمای ساخت نسخه اندروید AutoPin Pro در ویندوز (Android Studio & CLI)

این راهنما مراحل کامل ساخت فایل خروجی APK برای پروژه **AutoPin Pro** روی سیستم‌عامل ویندوز با استفاده از **Android Studio** یا خط فرمان (**Command Prompt / PowerShell**) را تشریح می‌کند.

---

## ۱. پیش‌نیازهای سیستمی در ویندوز

1. **سیستم‌عامل**: ویندوز ۱۰ یا ۱۱ (نسخه ۶۴ بیتی)
2. **کیت توسعه جاوا (JDK)**: جاوا ۱۷ (OpenJDK 17 یا Eclipse Temurin 17)
   - متغیر محیطی `JAVA_HOME` را به مسیر نصب JDK (مانند `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`) تنظیم کنید.
3. **Android Studio**: نسخه Ladybug (2024.2.1) یا جدیدتر
4. **Android SDK**:
   - `compileSdk: 35` (Android 15)
   - `minSdk: 24` (Android 7.0 Nougat به بالا)
   - Android SDK Build-Tools 35.0.0
5. **Node.js**: نسخه 18 یا بالاتر و `npm`

---

## ۲. همگام‌سازی دارایی‌های وب آفلاین با پروژه اندروید

قبل از بیلد Gradle، دارایی‌های فرانت‌اند وب با اسکریپت cross-platform سازگار با ویندوز کامپایل و به پوشه دارایی‌های APK منتقل می‌شوند:

در ریشه پروژه در ترمینال ویندوز اجرا کنید:
```powershell
npm run build:android
```
این دستور:
1. پروژه React + Vite را با مسیرهای نسبی بیلد می‌کند.
2. خروجی `dist/` را بدون حذف فایل‌های ضروری به مسیر `app/src/main/assets/www/` کپی می‌کند.

---

## ۳. باز کردن پروژه در Android Studio

1. نرم‌افزار **Android Studio** را باز کنید.
2. گزینه **Open** را انتخاب کنید و پوشه ریشه همین پروژه (`AutoPin Pro`) را انتخاب نمایید.
3. منتظر بمانید تا فرآیند **Gradle Sync** با استفاده از `gradle-wrapper.jar` و نسخه Gradle 8.9 تکمیل شود.

---

## ۴. دستورات ساخت خروجی APK در خط فرمان ویندوز

### الف) ساخت نسخه آزمایشی (Debug APK)
برای نصب و آزمایش برنامه روی گوشی یا شبیه‌ساز، بدون نیاز به کلید اختصاصی:

در PowerShell یا CMD در ریشه پروژه اجرا کنید:
```powershell
.\gradlew.bat assembleDebug
```
یا در خط فرمان ساده:
```cmd
gradlew.bat assembleDebug
```

📍 **مسیر فایل خروجی APK:**
```
app\build\outputs\apk\debug\app-debug.apk
```

---

### ب) ساخت نسخه انتشار نهایی (Release APK)
طبق الزامات امنیتی، نسخه Release هرگز از کلید آزمایشی Debug استفاده نمی‌کند و نیازمند کلید امضای معتبر است.

#### مرحله ۱: ایجاد کلید اختصاصی Keystore (یک‌بار)
اگر کلید انتشار اختصاصی ندارید، در ترمینال اجرا کنید:
```cmd
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias autopin_key
```

#### مرحله ۲: تنظیم متغیرهای محیطی یا پارامترهای بیلد
در PowerShell ویندوز:
```powershell
$env:AUTOPIN_KEYSTORE_FILE="C:\path\to\my-release-key.jks"
$env:AUTOPIN_KEYSTORE_PASSWORD="رمز_عبور_keystore"
$env:AUTOPIN_KEY_ALIAS="autopin_key"
$env:AUTOPIN_KEY_PASSWORD="رمز_عبور_کلید"

.\gradlew.bat assembleRelease
```

یا مستقیماً با آرگومان‌های Gradle:
```cmd
gradlew.bat assembleRelease -PAUTOPIN_KEYSTORE_FILE="C:\path\to\my-release-key.jks" -PAUTOPIN_KEYSTORE_PASSWORD="رمز" -PAUTOPIN_KEY_ALIAS="autopin_key" -PAUTOPIN_KEY_PASSWORD="رمز"
```

📍 **مسیر فایل خروجی APK امضاشده نهایی:**
```
app\build\outputs\apk\release\app-release.apk
```

#### روش گرافیکی در Android Studio:
از منوی بالا:
**Build > Generate Signed Bundle / APK > APK > Next > انتخاب Keystore > انتخاب حالت Release > Finish**

---

## ۵. معماری امنیتی و قابلیت‌های ویژه Native

- **ComposeShield (io.github.abdo-essam:composeshield)**: مسدودسازی اسکرین‌شات و ضبط تصویر در تمام صفحات، دیالوگ‌ها و لایه‌های اپلیکیشن با نمایش پوشش هشدار امنیتی هنگام تلاش برای فیلم‌برداری از صفحه.
- **BaseSecureActivity**: اعمال `FLAG_SECURE` در لایه Window Manager قبل از الصاق ویو و در زمان Focus.
- **AndroidKeyStore Hardware Cryptography**: تولید کلید نامتقارن EC secp256r1 در تراشه سخت‌افزاری امن دستگاه، بدون امکان استخراج کلید خصوصی، و امضای چالش‌های سرور جهت جلوگیری از کلون‌سازی لایسنس.
- **Offline WebView**: اجرای پرسرعت و پایدار دارایی‌ها به صورت کاملاً آفلاین بدون وابستگی به اینترنت، با استفاده از `WebViewAssetLoader` بر روی دامنه مجازی `https://appassets.androidplatform.net`.
