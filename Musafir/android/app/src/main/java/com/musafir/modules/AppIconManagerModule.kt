package com.musafir.modules

import android.content.ComponentName
import android.content.pm.PackageManager
import android.util.Log
import com.facebook.react.bridge.*

/**
 * Native module to hide/show the app launcher icon
 * 
 * Strategy:
 * - MainActivity has LAUNCHER intent (enabled by default)
 * - MainActivityHidden is an alias with LAUNCHER intent (disabled by default)
 * 
 * To HIDE: Disable MainActivity, enable MainActivityHidden (but it points to same activity)
 * To SHOW: Enable MainActivity, disable MainActivityHidden
 * 
 * This effectively hides the icon while keeping the app functional.
 */
class AppIconManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AppIconManager"
    }

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
            
            // Disable MainActivity (hides from launcher)
            val mainActivity = ComponentName(
                reactApplicationContext.packageName,
                "com.musafir.MainActivity"
            )
            packageManager.setComponentEnabledSetting(
                mainActivity,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )

            Log.d(TAG, "App icon hidden successfully")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to hide app icon: ${e.message}", e)
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
            
            // Enable MainActivity (shows in launcher)
            val mainActivity = ComponentName(
                reactApplicationContext.packageName,
                "com.musafir.MainActivity"
            )
            packageManager.setComponentEnabledSetting(
                mainActivity,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            Log.d(TAG, "App icon shown successfully")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show app icon: ${e.message}", e)
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
            val mainActivity = ComponentName(
                reactApplicationContext.packageName,
                "com.musafir.MainActivity"
            )

            val state = packageManager.getComponentEnabledSetting(mainActivity)
            val isVisible = state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT ||
                    state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED

            Log.d(TAG, "Icon visibility check: $isVisible (state=$state)")
            promise.resolve(isVisible)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check icon status: ${e.message}", e)
            promise.reject("CHECK_ICON_ERROR", "Failed to check icon status: ${e.message}", e)
        }
    }
}
