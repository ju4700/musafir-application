package com.musafir.receivers

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.musafir.modules.SharedPrefsModule
import com.musafir.modules.TimerExpiryReceiver
import com.musafir.services.HaramBlockerVPNService

/**
 * Receives BOOT_COMPLETED broadcast to restart services after reboot
 * Ensures protection continues even after device restart
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed, checking timer state")
            
            val prefs = context.getSharedPreferences(SharedPrefsModule.PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false)
            val endTime = prefs.getLong(SharedPrefsModule.KEY_END_TIME, 0)
            
            if (isActive && endTime > System.currentTimeMillis()) {
                Log.d(TAG, "Timer is active, restarting AI-powered VPN service")
                
                // 1. Start VPN Service with AI filtering
                val vpnIntent = Intent(context, HaramBlockerVPNService::class.java)
                // No blocklist needed - VPN uses AI filter
                
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(vpnIntent)
                    } else {
                        context.startService(vpnIntent)
                    }
                    Log.d(TAG, "VPN service started successfully")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to start VPN service", e)
                }
                
                // 2. Reschedule Alarm for timer expiry
                try {
                    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                    val alarmIntent = Intent(context, TimerExpiryReceiver::class.java)
                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        ALARM_REQUEST_CODE,
                        alarmIntent,
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                        else
                            PendingIntent.FLAG_UPDATE_CURRENT
                    )
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            endTime,
                            pendingIntent
                        )
                    } else {
                        alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            endTime,
                            pendingIntent
                        )
                    }
                    Log.d(TAG, "Alarm rescheduled for timer expiry at $endTime")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to reschedule alarm", e)
                }
                
                // 3. App Icon should remain hidden (persistence handled by PackageManager)
                Log.d(TAG, "Protection restored after boot")
                
            } else if (isActive && endTime <= System.currentTimeMillis()) {
                // Timer expired while device was off
                Log.d(TAG, "Timer expired while device was off, cleaning up")
                
                // Clear state
                prefs.edit().putBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false).apply()
                
                // Ensure app is visible and VPN is stopped
                com.musafir.services.TimerExpiryHandler.handleExpiry(context)
            } else {
                Log.d(TAG, "No active timer found")
            }
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
        private const val ALARM_REQUEST_CODE = 2001
    }
}
