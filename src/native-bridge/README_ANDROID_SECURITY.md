# مستندات پیاده‌سازی رسمی کتابخانه ComposeShield در AutoPin Pro

این سند نحوه پیاده‌سازی و عملکرد کتابخانه رسمی **ComposeShield** (توسعه‌داده شده توسط Abdo Essam - [گیت‌هاب](https://github.com/abdo-essam/ComposeShield)) را در اپلیکیشن **AutoPin Pro** توضیح می‌دهد.

---

## ۱. مشخصات کتابخانه و وابستگی Gradle

* **نام کتابخانه:** `ComposeShield`
* **آدرس مخزن رسمی:** [https://github.com/abdo-essam/ComposeShield](https://github.com/abdo-essam/ComposeShield)
* **شناسه گروه و پکیج Maven Central:**
  ```kotlin
  dependencies {
      implementation("io.github.abdo-essam:composeshield:0.1.0")
      implementation("androidx.activity:activity-compose:1.9.1")
      implementation(platform("androidx.compose:compose-bom:2024.06.00"))
      implementation("androidx.compose.ui:ui")
      implementation("androidx.compose.material3:material3")
  }
  ```

---

## ۲. قابلیت‌های پیاده‌سازی‌شده با ComposeShield

### ۱. جلوگیری از اسکرین‌شات در تمام صفحات
با قرار دادن کل سلسله‌مراتب رابط کاربری در کامپوزبل `SecureContent { ... }`، قابلیت اسکرین‌شات با کلیدهای فیزیکی گوشی به طور خودکار مسدود می‌شود.

### ۲. مسدودسازی ضبط صفحه (Screen Recording)
هنگام فعال بودن ابزارهای ضبط صفحه یا برنامه‌های جانبی (مانند AZ Screen Recorder، ضبط‌کننده داخلی اندروید یا ابزارهای MediaProjection)، محتوای برنامه به صورت کادر سیاه یا مسدود ضبط می‌گردد.

### ۳. تشخیص آنی ضبط صفحه و Screen Mirroring
با استفاده از جریان واکنشی `ComposeShield.captureState`:
```kotlin
val captureState by ComposeShield.captureState.collectAsState()
val isRecordingOrMirroring = captureState == CaptureState.Active
```
سیستم‌عامل و کتابخانه فوراً متوجه آغاز فیلم‌برداری یا کست صفحه می‌شوند.

### ۴. پوشاندن فوری محتوا با پیام رسمی
به محض تشخیص وضعیت `CaptureState.Active`، محتوای برنامه فوراً با یک کادر امنیتی پوشانده شده و پیام زیر نمایش داده می‌شود:
> **«به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.»**

### ۵. بازگشت خودکار به حالت عادی پس از توقف ضبط
به محض متوقف شدن ضبط صفحه توسط کاربر، وضعیت به `CaptureState.Inactive` تغییر یافته و صفحه پوشش‌دهنده فوراً محو می‌شود و برنامه بدون نیاز به راه‌اندازی مجدد، به فعالیت عادی خود ادامه می‌دهد.

### ۶. ارث‌بری خودکار در Dialogها و Popupها
تمامی دیالوگ‌های Compose (`Dialog`, `Popup`, `ModalBottomSheet`) به صورت خودکار محافظت امنیتی را از `SecureContent` به ارث می‌برند.

### ۷. مخفی‌سازی محتوا در Recent Apps
هنگام جابه‌جایی بین برنامه‌ها (Task Switcher)، پیش‌نمایش تصویر پنجره در منوی برنامه‌های اخیر پنهان شده و محتوای فنی افشا نمی‌گردد.

---

## ۳. معماری فایل‌ها در پروژه

1. **`src/native-bridge/build.gradle.kts`**:
   تعریف پیکربندی Gradle، وابستگی رسمی `io.github.abdo-essam:composeshield:0.1.0` و Jetpack Compose.
2. **`src/native-bridge/MainActivity.kt`**:
   اکتیویتی اصلی با استفاده از `ComponentActivity` و پیاده‌سازی کامپوزبل `SecureContent` و شنونده زنده `captureState`.
3. **`src/native-bridge/AutoPinProSecurityBridge.kt`**:
   پل ارتباطی `@JavascriptInterface` برای تبادل وضعیت با لایه وب‌ویو.
4. **`src/services/androidSecurity.ts`**:
   سرویس وب برای شنیدن رویداد `window.onComposeShieldStateChanged` و مسدودسازی وب `getDisplayMedia`.
5. **`src/components/ScreenSecurityShield.tsx`**:
   کامپوننت محافظت بصری و پوشش امنیتی با نمایش پیام مورد نظر کاربر در تمام صفحات.
