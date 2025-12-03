package com.musafir

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import com.musafir.modules.SharedPrefsModule

/**
 * Activity to handle deep links and notification clicks.
 * This activity remains enabled even when MainActivity is disabled (hidden).
 * 
 * IMPORTANT: Only allows access if timer is NOT active or has expired.
 */
class DeepLinkActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "DeepLinkActivity started")
        
        // Check timer state - only allow access if timer is inactive
        val prefs = getSharedPreferences(SharedPrefsModule.PREFS_NAME, Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false)
        val endTime = prefs.getLong(SharedPrefsModule.KEY_END_TIME, 0)
        val now = System.currentTimeMillis()
        
        if (isActive && endTime > now) {
            // Timer is still active - DO NOT re-enable MainActivity
            Log.d(TAG, "Timer active, blocking access. Remaining: ${(endTime - now) / 60000} minutes")
            
            // Show a toast or notification that access is blocked
            android.widget.Toast.makeText(
                this,
                "مسافر Protection active. Please wait for timer to complete.",
                android.widget.Toast.LENGTH_LONG
            ).show()
            
            finish()
            return
        }
        
        // Timer is not active or has expired - allow access
        Log.d(TAG, "Timer inactive, allowing access")
        
        enableMainActivity()
        
        // Launch MainActivity
        val launchIntent = Intent(this, MainActivity::class.java)
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(launchIntent)
        
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
