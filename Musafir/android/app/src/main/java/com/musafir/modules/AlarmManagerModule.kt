package com.musafir.modules

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import com.musafir.services.TimerExpiryHandler

/**
 * Native module to schedule exact alarms for timer expiry
 */
class AlarmManagerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AlarmManagerModule"
    }

    /**
     * Schedule an exact alarm for timer expiry
     * @param timestampMs - Unix timestamp in milliseconds when timer expires
     */
    @ReactMethod
    fun scheduleTimerExpiry(timestampMs: Double, promise: Promise) {
        try {
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactContext, TimerExpiryReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                ALARM_REQUEST_CODE,
                intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                else
                    PendingIntent.FLAG_UPDATE_CURRENT
            )

            // Use setExactAndAllowWhileIdle for precise timing even in Doze mode
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timestampMs.toLong(),
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timestampMs.toLong(),
                    pendingIntent
                )
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SCHEDULE_ALARM_ERROR", "Failed to schedule alarm: ${e.message}", e)
        }
    }

    /**
     * Cancel the scheduled timer expiry alarm
     */
    @ReactMethod
    fun cancelTimerAlarm(promise: Promise) {
        try {
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactContext, TimerExpiryReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                ALARM_REQUEST_CODE,
                intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_NO_CREATE
                else
                    PendingIntent.FLAG_NO_CREATE
            )

            pendingIntent?.let {
                alarmManager.cancel(it)
                it.cancel()
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CANCEL_ALARM_ERROR", "Failed to cancel alarm: ${e.message}", e)
        }
    }

    companion object {
        private const val ALARM_REQUEST_CODE = 2001
    }
}

/**
 * Broadcast receiver for timer expiry alarm
 */
class TimerExpiryReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Handle timer expiry
        TimerExpiryHandler.handleExpiry(context)
    }
}
