package com.musafir.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receives BOOT_COMPLETED broadcast to restart services after reboot
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed, checking timer state")
            
            // Timer state restoration is handled by React Native on app startup
            // This receiver just ensures the app is aware of the reboot
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
