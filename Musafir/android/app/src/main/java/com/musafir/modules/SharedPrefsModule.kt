package com.musafir.modules

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*

class SharedPrefsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val sharedPrefs: SharedPreferences =
        reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    override fun getName(): String {
        return "SharedPrefsModule"
    }

    @ReactMethod
    fun saveTimerState(endTime: Double, durationMinutes: Double, promise: Promise) {
        try {
            with(sharedPrefs.edit()) {
                putLong(KEY_END_TIME, endTime.toLong())
                putInt(KEY_DURATION, durationMinutes.toInt())
                putBoolean(KEY_IS_ACTIVE, true)
                apply()
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SAVE_ERROR", e)
        }
    }

    @ReactMethod
    fun clearTimerState(promise: Promise) {
        try {
            with(sharedPrefs.edit()) {
                remove(KEY_END_TIME)
                remove(KEY_DURATION)
                putBoolean(KEY_IS_ACTIVE, false)
                apply()
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e)
        }
    }

    companion object {
        const val PREFS_NAME = "HaramBlockerPrefs"
        const val KEY_END_TIME = "endTime"
        const val KEY_DURATION = "duration"
        const val KEY_IS_ACTIVE = "isActive"
    }
}
