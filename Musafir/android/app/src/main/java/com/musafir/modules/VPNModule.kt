package com.musafir.modules

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*
import com.musafir.services.HaramBlockerVPNService

/**
 * Native module to control VPN service
 */
class VPNModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var vpnPermissionPromise: Promise? = null

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
                promise.resolve(true)
                return
            }

            vpnPermissionPromise = promise
            getCurrentActivity()?.startActivityForResult(intent, REQUEST_CODE_VPN)
                ?: promise.reject("NO_ACTIVITY", "No current activity available")
        } catch (e: Exception) {
            promise.reject("VPN_PREPARE_ERROR", "Failed to prepare VPN: ${e.message}", e)
        }
    }

    /**
     * Start VPN service with blocklist
     */
    @ReactMethod
    fun startVPN(blocklist: ReadableArray, promise: Promise) {
        try {
            // Convert ReadableArray to ArrayList<String>
            val blocklistArray = ArrayList<String>()
            for (i in 0 until blocklist.size()) {
                blocklist.getString(i)?.let { blocklistArray.add(it) }
            }

            val intent = Intent(reactContext, HaramBlockerVPNService::class.java)
            intent.putStringArrayListExtra("BLOCKLIST", blocklistArray)
            
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("VPN_START_ERROR", "Failed to start VPN: ${e.message}", e)
        }
    }

    /**
     * Stop VPN service
     */
    @ReactMethod
    fun stopVPN(promise: Promise) {
        try {
            val intent = Intent(reactContext, HaramBlockerVPNService::class.java)
            reactContext.stopService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
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
                    promise.resolve(true)
                } else {
                    promise.resolve(false)
                }
                vpnPermissionPromise = null
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        // Not needed
    }

    companion object {
        private const val REQUEST_CODE_VPN = 3001
    }
}
