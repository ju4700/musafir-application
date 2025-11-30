package com.musafir.modules

import android.app.Activity
import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.*

/**
 * Device Admin Receiver
 */
class HaramBlockerDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        // Device admin enabled
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        // Device admin disabled
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

            currentActivity?.startActivityForResult(intent, REQUEST_CODE_ENABLE_ADMIN)
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
        activity: Activity?,
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

    override fun onNewIntent(intent: Intent?) {
        // Not needed
    }

    companion object {
        private const val REQUEST_CODE_ENABLE_ADMIN = 1001
    }
}
