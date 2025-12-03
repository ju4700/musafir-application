package com.musafir.modules

import android.app.Activity
import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.*

/**
 * Device Admin Receiver
 * Prevents uninstallation while timer is active
 */
class HaramBlockerDeviceAdminReceiver : DeviceAdminReceiver() {
    
    companion object {
        private const val TAG = "DeviceAdminReceiver"
    }
    
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device admin enabled")
        Toast.makeText(context, "Musafir: Uninstall protection enabled", Toast.LENGTH_SHORT).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device admin disabled")
    }
    
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // Check if timer is active
        val prefs = context.getSharedPreferences(SharedPrefsModule.PREFS_NAME, Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false)
        val endTime = prefs.getLong(SharedPrefsModule.KEY_END_TIME, 0)
        
        if (isActive && endTime > System.currentTimeMillis()) {
            // Timer is still active - warn user
            val remainingMinutes = ((endTime - System.currentTimeMillis()) / 60000).toInt()
            return "⚠️ Musafir protection is active!\n\n" +
                   "Time remaining: ${formatTime(remainingMinutes)}\n\n" +
                   "\"Indeed, Allah is ever, over you, an Observer.\" (4:1)\n\n" +
                   "Disabling protection now will remove all safeguards. " +
                   "Are you absolutely sure you want to do this?"
        }
        
        return "Musafir: Are you sure you want to disable uninstall protection?"
    }
    
    private fun formatTime(minutes: Int): String {
        return when {
            minutes < 60 -> "$minutes minutes"
            minutes < 1440 -> "${minutes / 60} hours ${minutes % 60} minutes"
            else -> "${minutes / 1440} days"
        }
    }
}

/**
 * Native module to manage device admin privileges
 * Allows the app to prevent easy uninstallation while timer is active
 */
class DeviceAdminModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var deviceAdminPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "DeviceAdminModule"
    }

    /**
     * Request device admin privileges
     * Shows system dialog to user
     */
    @ReactMethod
    fun requestDeviceAdmin(promise: Promise) {
        try {
            val devicePolicyManager =
                reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(reactContext, HaramBlockerDeviceAdminReceiver::class.java)

            if (devicePolicyManager.isAdminActive(componentName)) {
                promise.resolve(true)
                return
            }

            deviceAdminPromise = promise

            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
            intent.putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "HaramBlocker needs device admin to prevent uninstallation during timer"
            )

            getCurrentActivity()?.startActivityForResult(intent, REQUEST_CODE_ENABLE_ADMIN)
                ?: promise.reject("NO_ACTIVITY", "No current activity available")
        } catch (e: Exception) {
            promise.reject("DEVICE_ADMIN_ERROR", "Failed to request device admin: ${e.message}", e)
        }
    }

    /**
     * Check if device admin is currently active
     */
    @ReactMethod
    fun isDeviceAdmin(promise: Promise) {
        try {
            val devicePolicyManager =
                reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(reactContext, HaramBlockerDeviceAdminReceiver::class.java)

            val isAdmin = devicePolicyManager.isAdminActive(componentName)
            promise.resolve(isAdmin)
        } catch (e: Exception) {
            promise.reject("CHECK_ADMIN_ERROR", "Failed to check device admin: ${e.message}", e)
        }
    }

    /**
     * Remove device admin privileges
     */
    @ReactMethod
    fun removeDeviceAdmin(promise: Promise) {
        try {
            val devicePolicyManager =
                reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(reactContext, HaramBlockerDeviceAdminReceiver::class.java)

            if (devicePolicyManager.isAdminActive(componentName)) {
                devicePolicyManager.removeActiveAdmin(componentName)
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("REMOVE_ADMIN_ERROR", "Failed to remove device admin: ${e.message}", e)
        }
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == REQUEST_CODE_ENABLE_ADMIN) {
            deviceAdminPromise?.let { promise ->
                if (resultCode == Activity.RESULT_OK) {
                    promise.resolve(true)
                } else {
                    promise.resolve(false)
                }
                deviceAdminPromise = null
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        // Not needed
    }

    companion object {
        private const val REQUEST_CODE_ENABLE_ADMIN = 1001
    }
}
