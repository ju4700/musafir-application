package com.musafir.modules

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.*

/**
 * Native module to hide/show the app launcher icon
 * Uses PackageManager to enable/disable the launcher activity component
 */
class AppIconManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppIconManagerModule"
    }

    /**
     * Hide the app icon from launcher
     */
    @ReactMethod
    fun hideIcon(promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val componentName = ComponentName(
                reactApplicationContext,
                "com.musafir.MainActivity"
            )

            packageManager.setComponentEnabledSetting(
                componentName,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("HIDE_ICON_ERROR", "Failed to hide app icon: ${e.message}", e)
        }
    }

    /**
     * Show the app icon in launcher
     */
    @ReactMethod
    fun showIcon(promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val componentName = ComponentName(
                reactApplicationContext,
                "com.musafir.MainActivity"
            )

            packageManager.setComponentEnabledSetting(
                componentName,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SHOW_ICON_ERROR", "Failed to show app icon: ${e.message}", e)
        }
    }

    /**
     * Check if the app icon is currently visible
     */
    @ReactMethod
    fun isIconVisible(promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val componentName = ComponentName(
                reactApplicationContext,
                "com.musafir.MainActivity"
            )

            val state = packageManager.getComponentEnabledSetting(componentName)
            val isVisible = state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT ||
                    state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED

            promise.resolve(isVisible)
        } catch (e: Exception) {
            promise.reject("CHECK_ICON_ERROR", "Failed to check icon status: ${e.message}", e)
        }
    }
}
