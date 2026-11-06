package ir.autopin.pro.security

import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.PublicKey
import java.security.Signature
import java.security.spec.ECGenParameterSpec

/**
 * AutoPin Pro - Hardware Keystore Device Identity & Anti-Cloning Engine
 *
 * Security Architecture:
 * 1. Generates and secures an Elliptic Curve (secp256r1) key pair strictly inside AndroidKeyStore (Hardware TEE / StrongBox).
 * 2. The private key NEVER leaves the secure hardware element and cannot be extracted, backed up, or cloned.
 * 3. The device identity (deviceId) is derived deterministically from the SHA-256 fingerprint of the public key.
 * 4. Resists IMEI spoofing, MAC spoofing, root cloaking, and app-cloning tools.
 * 5. Supports ECDSA SHA-256 challenge signing for cryptographic zero-trust handshake with Firebase Cloud Functions.
 */
class DeviceKeystoreSecurity(private val context: Context) {

    companion object {
        private const val ANDROID_KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALIAS = "AutoPinPro_Hardware_Device_Key_v1"
        private const val SIGNING_ALGORITHM = "SHA256withECDSA"
    }

    private val keyStore: KeyStore = KeyStore.getInstance(ANDROID_KEYSTORE_PROVIDER).apply {
        load(null)
    }

    init {
        ensureDeviceKeyExists()
    }

    /**
     * Ensures an immutable EC KeyPair exists inside AndroidKeyStore.
     * Uses StrongBox when available on supported hardware.
     */
    @Synchronized
    private fun ensureDeviceKeyExists() {
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            generateHardwareKeyPair()
        }
    }

    private fun generateHardwareKeyPair() {
        val keyPairGenerator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            ANDROID_KEYSTORE_PROVIDER
        )

        val builder = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
            .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
            .setUserAuthenticationRequired(false) // Allows background license validation without biometric prompt

        // If running on Android 9+ (API 28) and device supports StrongBox Keymaster, enable it
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                builder.setIsStrongBoxBacked(true)
            } catch (_: Throwable) {
                // StrongBox not available on this chipset; standard TEE Keystore will be used automatically
            }
        }

        try {
            keyPairGenerator.initialize(builder.build())
            keyPairGenerator.generateKeyPair()
        } catch (e: Exception) {
            // Fallback for older devices if StrongBox flag failed
            val fallbackBuilder = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
                .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
                .setDigests(KeyProperties.DIGEST_SHA256)
            keyPairGenerator.initialize(fallbackBuilder.build())
            keyPairGenerator.generateKeyPair()
        }
    }

    /**
     * Returns the Public Key in standard Base64 DER encoding.
     */
    fun getDevicePublicKeyBase64(): String {
        ensureDeviceKeyExists()
        val cert = keyStore.getCertificate(KEY_ALIAS)
            ?: throw IllegalStateException("Certificate for $KEY_ALIAS not found")
        val publicKey: PublicKey = cert.publicKey
        return Base64.encodeToString(publicKey.encoded, Base64.NO_WRAP)
    }

    /**
     * Computes the deterministic SHA-256 fingerprint of the Hardware Public Key.
     * Format: "dev_hw_" + 32-character hex string.
     * This forms the immutable, non-forgeable device identifier.
     */
    fun getDeterministicDeviceId(): String {
        ensureDeviceKeyExists()
        val cert = keyStore.getCertificate(KEY_ALIAS)
            ?: throw IllegalStateException("Certificate for $KEY_ALIAS not found")
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(cert.publicKey.encoded)
        val hexString = digest.joinToString("") { "%02x".format(it) }
        return "dev_hw_${hexString.substring(0, 32)}"
    }

    /**
     * Cryptographically signs a challenge string sent by Firebase Cloud Functions.
     * Proves device ownership in zero-trust handshake.
     */
    fun signChallenge(challenge: String): String {
        ensureDeviceKeyExists()
        val privateKeyEntry = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.PrivateKeyEntry
            ?: throw IllegalStateException("Private key not found in AndroidKeyStore")
        val privateKey: PrivateKey = privateKeyEntry.privateKey

        val signer = Signature.getInstance(SIGNING_ALGORITHM).apply {
            initSign(privateKey)
            update(challenge.toByteArray(Charsets.UTF_8))
        }

        val signatureBytes = signer.sign()
        return Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
    }

    /**
     * Returns device model and manufacturer info for administrative logging.
     */
    fun getDeviceModelInfo(): String {
        return "${Build.MANUFACTURER} ${Build.MODEL} (Android ${Build.VERSION.RELEASE}, API ${Build.VERSION.SDK_INT})"
    }
}
