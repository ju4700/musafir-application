package com.musafir

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log

/**
 * Activity to handle deep links and notification clicks.
 * This activity remains enabled even when MainActivity is disabled (hidden).
 */
class DeepLinkActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "DeepLinkActivity started")
        
        // Check if we need to re-enable MainActivity
        // For now, we just re-enable it so the user can see the app
        // In a stricter version, we might check timer state first
        
        enableMainActivity()
        
        // Launch MainActivity
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(launchIntent)
        } else {
            // Should not happen if we just enabled it, but might take a moment
            Log.e(TAG, "Could not get launch intent for MainActivity")
        }
        
        finish()
    }
    
    private fun enableMainActivity() {
        try {
            val componentName = ComponentName(this, MainActivity::class.java)
            packageManager.setComponentEnabledSetting(
                componentName,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            Log.d(TAG, "MainActivity enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Error enabling MainActivity", e)
        }
    }
    
    companion object {
        private const val TAG = "DeepLinkActivity"
    }
}
