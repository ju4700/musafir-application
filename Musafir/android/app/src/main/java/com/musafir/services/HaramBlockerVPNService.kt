package com.musafir.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.musafir.R
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

/**
 * VPN Service that intercepts all traffic and blocks domains on the blocklist
 * Runs as a foreground service to maintain persistent connection
 */
class HaramBlockerVPNService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    private val isRunning = AtomicBoolean(false)
    private val blocklist = mutableSetOf<String>()

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "VPN Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "VPN Service started")

        // Load blocklist from intent
        intent?.getStringArrayListExtra("BLOCKLIST")?.let { list ->
            blocklist.clear()
            blocklist.addAll(list)
            Log.d(TAG, "Loaded ${blocklist.size} domains to blocklist")
        }

        // Start foreground service
        startForeground(VPN_NOTIFICATION_ID, createNotification())

        // Start VPN if not already running
        if (isRunning.compareAndSet(false, true)) {
            startVPN()
        }

        Companion.isRunning = true
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "VPN Service destroyed")
        stopVPN()
        Companion.isRunning = false
    }

    private fun startVPN() {
        try {
            // Build VPN interface
            val builder = Builder()
                .setSession("HaramBlocker VPN")
                .addAddress("10.0.0.2", 24) // Virtual IP address
                .addRoute("0.0.0.0", 0) // Route all IPv4 traffic
                .addDnsServer("8.8.8.8") // Google DNS
                .addDnsServer("8.8.4.4") // Google DNS Secondary

            // Exclude our app from VPN to prevent loops
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                builder.addDisallowedApplication(packageName)
            }

            vpnInterface = builder.establish()

            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface")
                stopSelf()
                return
            }

            // Start packet processing thread
            vpnThread = Thread(this::processPackets, "VPNThread")
            vpnThread?.start()

            Log.d(TAG, "VPN started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN", e)
            stopSelf()
        }
    }

    private fun stopVPN() {
        isRunning.set(false)

        // Close VPN interface
        vpnInterface?.let {
            try {
                it.close()
                vpnInterface = null
            } catch (e: Exception) {
                Log.e(TAG, "Error closing VPN interface", e)
            }
        }

        // Stop thread
        vpnThread?.interrupt()
        vpnThread = null

        Log.d(TAG, "VPN stopped")
    }

    private fun processPackets() {
        val vpnFd = vpnInterface ?: return
        val inputStream = FileInputStream(vpnFd.fileDescriptor)
        val outputStream = FileOutputStream(vpnFd.fileDescriptor)
        val buffer = ByteBuffer.allocate(32767)

        try {
            while (isRunning.get() && !Thread.interrupted()) {
                buffer.clear()
                val length = inputStream.read(buffer.array())

                if (length > 0) {
                    // Process packet
                    buffer.limit(length)
                    val shouldBlock = analyzePacket(buffer)

                    if (shouldBlock) {
                        Log.d(TAG, "Blocking packet")
                        // Drop the packet by not forwarding it
                        continue
                    }

                    // Forward allowed packets (in a real implementation)
                    // For simplicity, we're doing basic blocking
                    // A full VPN would need to route packets properly
                    buffer.flip()
                    outputStream.write(buffer.array(), 0, length)
                }
            }
        } catch (e: Exception) {
            if (isRunning.get()) {
                Log.e(TAG, "Error processing packets", e)
            }
        }
    }

    /**
     * Analyze packet and determine if it should be blocked
     * Simplified version - checks for domains in DNS queries and TCP connections
     */
    private fun analyzePacket(packet: ByteBuffer): Boolean {
        try {
            // Get IP version
            val versionAndHeaderLength = packet.get(0).toInt()
            val version = (versionAndHeaderLength shr 4) and 0x0F

            if (version != 4) {
                // Only handle IPv4 for simplicity
                return false
            }

            // Get protocol
            val protocol = packet.get(9).toInt() and 0xFF

            when (protocol) {
                17 -> return analyzeDNSPacket(packet) // UDP (likely DNS)
                6 -> return analyzeTCPPacket(packet) // TCP
                else -> return false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing packet", e)
            return false
        }
    }

    /**
     * Analyze DNS packet for blocked domains
     */
    private fun analyzeDNSPacket(packet: ByteBuffer): Boolean {
        try {
            // Skip IP header (20 bytes) and UDP header (8 bytes)
            val dnsPayloadStart = 28

            if (packet.limit() <= dnsPayloadStart + 12) {
                return false // Packet too small
            }

            // Extract DNS query (simplified)
            val domain = extractDomainFromDNS(packet, dnsPayloadStart + 12)

            return isDomainBlocked(domain)
        } catch (e: Exception) {
            return false
        }
    }

    /**
     * Extract domain name from DNS query
     */
    private fun extractDomainFromDNS(packet: ByteBuffer, offset: Int): String {
        val domainBuilder = StringBuilder()
        var pos = offset

        try {
            while (pos < packet.limit()) {
                val length = packet.get(pos).toInt() and 0xFF
                if (length == 0) break

                pos++
                for (i in 0 until length) {
                    if (pos >= packet.limit()) break
                    domainBuilder.append(packet.get(pos).toChar())
                    pos++
                }
                domainBuilder.append('.')
            }

            return domainBuilder.toString().trimEnd('.')
        } catch (e: Exception) {
            return ""
        }
    }

    /**
     * Analyze TCP packet for blocked destinations
     */
    private fun analyzeTCPPacket(packet: ByteBuffer): Boolean {
        try {
            // Get destination IP
            val destIPBytes = ByteArray(4)
            packet.position(16)
            packet.get(destIPBytes)

            // In a full implementation, would resolve IP to domain
            // For now, return false to allow TCP
            // Real implementation would use SNI (Server Name Indication) from TLS handshake
            return false
        } catch (e: Exception) {
            return false
        }
    }

    /**
     * Check if a domain is on the blocklist
     */
    private fun isDomainBlocked(domain: String): Boolean {
        if (domain.isEmpty()) return false

        val lowerDomain = domain.lowercase()

        // Check exact match
        if (blocklist.contains(lowerDomain)) {
            Log.d(TAG, "Blocking domain: $domain")
            return true
        }

        // Check if any blocklist entry matches as subdomain
        for (blocked in blocklist) {
            if (lowerDomain.endsWith(".$blocked") || lowerDomain == blocked) {
                Log.d(TAG, "Blocking domain: $domain (matches $blocked)")
                return true
            }
        }

        return false
    }

    private fun createNotification(): Notification {
        val channelId = "haramBlocker_vpn"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "VPN Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setContentTitle("HaramBlocker Active")
            .setContentText("Content filtering is active")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)

        return notificationBuilder.build()
    }

    companion object {
        private const val TAG = "HaramBlockerVPN"
        private const val VPN_NOTIFICATION_ID = 1001
        var isRunning = false
    }
}
