package com.musafir.services

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log

/**
 * Handler for timer expiry alarm
 * Re-enables app icon and stops VPN
 */
object TimerExpiryHandler {
    private const val TAG = "TimerExpiryHandler"

    fun handleExpiry(context: Context) {
        Log.d(TAG, "Timer expired")

        try {
            // Stop VPN service
            stopVPN(context)

            // Re-enable app icon
            showAppIcon(context)

            // TODO: Send notification to user
            // (handled by React Native side when app reopens)

        } catch (e: Exception) {
            Log.e(TAG, "Error handling timer expiry", e)
        }
    }

    private fun stopVPN(context: Context) {
        try {
            val intent = Intent(context, HaramBlockerVPNService::class.java)
            context.stopService(intent)
            Log.d(TAG, "VPN stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping VPN", e)
        }
    }

    private fun showAppIcon(context: Context) {
        try {
            val packageManager = context.packageManager
            val componentName = ComponentName(context, "com.musafir.MainActivity")

            packageManager.setComponentEnabledSetting(
                componentName,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            Log.d(TAG, "App icon re-enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Error showing app icon", e)
        }
    }
}
