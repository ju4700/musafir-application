package com.musafir.modules

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.musafir.services.HaramBlockerVPNService

/**
 * Native module to control VPN service
 */
class VPNModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var vpnPermissionPromise: Promise? = null

    companion object {
        private const val TAG = "VPNModule"
        private const val REQUEST_CODE_VPN = 3001
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "VPNModule"
    }

    /**
     * Prepare VPN - request permission if needed
     */
    @ReactMethod
    fun prepareVPN(promise: Promise) {
        try {
            val intent = VpnService.prepare(reactContext)
            if (intent == null) {
                // Permission already granted
                Log.d(TAG, "VPN permission already granted")
                promise.resolve(true)
                return
            }

            vpnPermissionPromise = promise
            val activity = getCurrentActivity()
            if (activity != null) {
                activity.startActivityForResult(intent, REQUEST_CODE_VPN)
            } else {
                Log.e(TAG, "No current activity for VPN permission")
                promise.reject("NO_ACTIVITY", "No current activity available")
            }
        } catch (e: Exception) {
            Log.e(TAG, "prepareVPN error", e)
            promise.reject("VPN_PREPARE_ERROR", "Failed to prepare VPN: ${e.message}", e)
        }
    }

    /**
     * Start VPN service (blocklist parameter kept for compatibility but not used)
     */
    @ReactMethod
    fun startVPN(blocklist: ReadableArray, promise: Promise) {
        try {
            Log.d(TAG, "Starting VPN service...")
            
            val intent = Intent(reactContext, HaramBlockerVPNService::class.java)
            
            // Use startForegroundService on Android O+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            
            Log.d(TAG, "VPN service start requested")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "startVPN error", e)
            promise.reject("VPN_START_ERROR", "Failed to start VPN: ${e.message}", e)
        }
    }

    /**
     * Stop VPN service
     */
    @ReactMethod
    fun stopVPN(promise: Promise) {
        try {
            Log.d(TAG, "Stopping VPN service...")
            val intent = Intent(reactContext, HaramBlockerVPNService::class.java)
            reactContext.stopService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "stopVPN error", e)
            promise.reject("VPN_STOP_ERROR", "Failed to stop VPN: ${e.message}", e)
        }
    }

    /**
     * Check if VPN is currently active
     */
    @ReactMethod
    fun isVPNActive(promise: Promise) {
        try {
            val isActive = HaramBlockerVPNService.isRunning
            promise.resolve(isActive)
        } catch (e: Exception) {
            Log.e(TAG, "isVPNActive error", e)
            promise.reject("VPN_STATUS_ERROR", "Failed to check VPN status: ${e.message}", e)
        }
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == REQUEST_CODE_VPN) {
            vpnPermissionPromise?.let { promise ->
                if (resultCode == Activity.RESULT_OK) {
                    Log.d(TAG, "VPN permission granted")
                    promise.resolve(true)
                } else {
                    Log.d(TAG, "VPN permission denied")
                    promise.resolve(false)
                }
                vpnPermissionPromise = null
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        // Not needed
    }
}
