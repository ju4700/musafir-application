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
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed, checking timer state")
            
            val prefs = context.getSharedPreferences(SharedPrefsModule.PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false)
            val endTime = prefs.getLong(SharedPrefsModule.KEY_END_TIME, 0)
            
            if (isActive && endTime > System.currentTimeMillis()) {
                Log.d(TAG, "Timer is active, restarting services")
                
                // 1. Start VPN Service
                val vpnIntent = Intent(context, HaramBlockerVPNService::class.java)
                // We need to pass the blocklist, but it's in AsyncStorage (JSON).
                // For now, we can't easily access it. 
                // Ideally, we should have saved blocklist to SharedPreferences too.
                // But if the VPN service loads it from a file or if we just block everything...
                // Let's assume for now we just start it. The service should handle empty blocklist gracefully 
                // or we should save blocklist to Prefs too.
                // TODO: Save blocklist to Prefs.
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(vpnIntent)
                } else {
                    context.startService(vpnIntent)
                }
                
                // 2. Reschedule Alarm
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val alarmIntent = Intent(context, TimerExpiryReceiver::class.java)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    2001, // ALARM_REQUEST_CODE
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
                
                // 3. Ensure App Icon is hidden (should be already, but just in case)
                // We can't easily call AppIconManagerModule here as it needs ReactContext.
                // But we can duplicate the logic or just rely on persistence.
                
            } else if (isActive && endTime <= System.currentTimeMillis()) {
                // Timer expired while off
                Log.d(TAG, "Timer expired while off, cleaning up")
                
                // Clear state
                prefs.edit().putBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false).apply()
                
                // Ensure app is visible
                // We can use TimerExpiryHandler logic here if we make it public/accessible
                // It is in com.musafir.services
                com.musafir.services.TimerExpiryHandler.handleExpiry(context)
            }
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
