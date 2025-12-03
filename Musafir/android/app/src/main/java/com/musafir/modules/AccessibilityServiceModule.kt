package com.musafir.modules

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import com.facebook.react.bridge.*
import com.musafir.services.ContentBlockerAccessibilityService

/**
 * Native module to manage the Accessibility Service
 */
class AccessibilityServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AccessibilityModule"
    }

    override fun getName(): String {
        return "AccessibilityServiceModule"
    }

    /**
     * Check if accessibility service is enabled
     */
    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val enabled = isAccessibilityServiceEnabled()
            Log.d(TAG, "Accessibility service enabled: $enabled")
            promise.resolve(enabled)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking accessibility service", e)
            promise.reject("ERROR", "Failed to check accessibility service: ${e.message}", e)
        }
    }

    /**
     * Open accessibility settings for user to enable the service
     */
    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening accessibility settings", e)
            promise.reject("ERROR", "Failed to open accessibility settings: ${e.message}", e)
        }
    }

    /**
     * Check if the accessibility service is currently running
     */
    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            val running = ContentBlockerAccessibilityService.isRunning
            promise.resolve(running)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check service status: ${e.message}", e)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val serviceName = ComponentName(
            reactContext.packageName,
            ContentBlockerAccessibilityService::class.java.name
        ).flattenToString()

        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServices)

        while (colonSplitter.hasNext()) {
            val componentNameString = colonSplitter.next()
            if (componentNameString.equals(serviceName, ignoreCase = true)) {
                return true
            }
        }

        return false
    }
}
