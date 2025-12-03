package com.musafir.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.musafir.R
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.ConcurrentHashMap

/**
 * Enhanced VPN Service with AI-based Content Filtering
 * 
 * Features:
 * - AI-powered domain analysis (not just static blocklist)
 * - Keyword-based content detection
 * - Pattern matching for known harmful sites
 * - DNS query interception and filtering
 * - Caching for performance
 */
class HaramBlockerVPNService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    private val isRunning = AtomicBoolean(false)
    
    // Cache for domain analysis results (performance optimization)
    private val domainCache = ConcurrentHashMap<String, Boolean>()
    private val CACHE_MAX_SIZE = 1000
    
    // Statistics
    private var totalQueries = 0L
    private var blockedQueries = 0L

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "VPN Service created with AI Content Filter")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "VPN Service started with AI filtering enabled")

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
        Log.d(TAG, "VPN Service destroyed. Stats: Total=$totalQueries, Blocked=$blockedQueries")
        stopVPN()
        Companion.isRunning = false
    }

    private fun startVPN() {
        try {
            // Build VPN interface
            val builder = Builder()
                .setSession("Musafir AI Filter")
                .addAddress("10.0.0.2", 32)
                .addDnsServer("10.0.0.2")
                .addRoute("10.0.0.2", 32)
                // Only intercept DNS traffic, let everything else pass through
                .setMtu(1500)

            // Exclude our app from VPN
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                try {
                    builder.addDisallowedApplication(packageName)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to exclude app from VPN", e)
                }
            }

            vpnInterface = builder.establish()

            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface")
                stopSelf()
                return
            }

            // Start packet processing thread
            vpnThread = Thread(this::processPackets, "AIFilterVPNThread")
            vpnThread?.start()

            Log.d(TAG, "VPN started successfully with AI filtering")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN", e)
            stopSelf()
        }
    }

    private fun stopVPN() {
        isRunning.set(false)
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing VPN interface", e)
        }
        vpnThread?.interrupt()
        vpnThread = null
        domainCache.clear()
    }

    private fun processPackets() {
        val vpnFd = vpnInterface ?: return
        val inputStream = FileInputStream(vpnFd.fileDescriptor)
        val outputStream = FileOutputStream(vpnFd.fileDescriptor)
        val buffer = ByteBuffer.allocate(32767)

        try {
            while (isRunning.get() && !Thread.interrupted()) {
                val length = inputStream.read(buffer.array())
                if (length > 0) {
                    buffer.limit(length)
                    // We only expect IPv4 UDP packets to 10.0.0.2:53
                    handlePacket(buffer, length, outputStream)
                    buffer.clear()
                }
            }
        } catch (e: Exception) {
            if (isRunning.get()) Log.e(TAG, "Error processing packets", e)
        }
    }

    private fun handlePacket(packet: ByteBuffer, length: Int, outputStream: FileOutputStream) {
        try {
            val version = (packet.get(0).toInt() shr 4) and 0x0F
            if (version != 4) return // IPv4 only

            val protocol = packet.get(9).toInt() and 0xFF
            if (protocol != 17) return // UDP only

            // Parse IP Header
            val headerLength = (packet.get(0).toInt() and 0x0F) * 4
            val srcIp = ByteArray(4)
            val destIp = ByteArray(4)
            packet.position(12)
            packet.get(srcIp)
            packet.get(destIp)

            // Parse UDP Header
            packet.position(headerLength)
            val srcPort = packet.short.toInt() and 0xFFFF
            val destPort = packet.short.toInt() and 0xFFFF
            val udpLength = packet.short.toInt() and 0xFFFF

            if (destPort != 53) return // DNS only

            // DNS Payload
            val dnsPayloadOffset = headerLength + 8
            val dnsPayloadLength = udpLength - 8
            
            if (dnsPayloadLength <= 0 || dnsPayloadOffset + dnsPayloadLength > length) return

            // Extract Domain from DNS query
            val domain = extractDomain(packet, dnsPayloadOffset + 12) // Skip DNS Header (12 bytes)
            
            totalQueries++
            
            // Use AI Content Filter to analyze domain
            if (shouldBlockDomain(domain)) {
                blockedQueries++
                Log.d(TAG, "🚫 BLOCKED: $domain (Total blocked: $blockedQueries)")
                // Don't forward the query - it will timeout on client
                // This effectively blocks the domain
                return 
            }

            // Forward to Real DNS (using Cloudflare for privacy)
            forwardDnsQuery(packet, dnsPayloadOffset, dnsPayloadLength, srcIp, srcPort, outputStream)

        } catch (e: Exception) {
            Log.e(TAG, "Error handling packet", e)
        }
    }

    /**
     * AI-powered domain analysis
     * Uses caching for performance
     */
    private fun shouldBlockDomain(domain: String): Boolean {
        if (domain.isEmpty()) return false
        
        val normalizedDomain = domain.lowercase()
        
        // Check cache first
        domainCache[normalizedDomain]?.let { return it }
        
        // Use AI Content Filter for analysis
        val isBlocked = AIContentFilterNative.isDomainBlocked(normalizedDomain)
        
        // Cache result (with size limit)
        if (domainCache.size < CACHE_MAX_SIZE) {
            domainCache[normalizedDomain] = isBlocked
        }
        
        return isBlocked
    }

    private fun forwardDnsQuery(
        packet: ByteBuffer, 
        payloadOffset: Int, 
        payloadLength: Int, 
        clientIp: ByteArray, 
        clientPort: Int,
        outputStream: FileOutputStream
    ) {
        try {
            val dnsQuery = ByteArray(payloadLength)
            packet.position(payloadOffset)
            packet.get(dnsQuery)

            val socket = DatagramSocket()
            protect(socket) // CRITICAL: Protect socket so it bypasses VPN

            // Use Cloudflare DNS for better privacy
            val dnsServer = InetAddress.getByName("1.1.1.1")
            val outPacket = DatagramPacket(dnsQuery, payloadLength, dnsServer, 53)
            socket.send(outPacket)

            // Receive response
            val responseBuffer = ByteArray(4096)
            val inPacket = DatagramPacket(responseBuffer, responseBuffer.size)
            socket.soTimeout = 3000 // 3s timeout
            socket.receive(inPacket)

            // Construct response IP packet
            // We need to swap src/dest IP and ports
            // Src IP = 10.0.0.2, Dest IP = clientIp
            // Src Port = 53, Dest Port = clientPort
            
            val responseData = inPacket.data.copyOf(inPacket.length)
            val ipPacket = buildUdpPacket(
                responseData, 
                byteArrayOf(10, 0, 0, 2), 
                clientIp, 
                53, 
                clientPort
            )
            
            outputStream.write(ipPacket)
            socket.close()

        } catch (e: Exception) {
            Log.e(TAG, "DNS Forward error: ${e.message}")
        }
    }

    private fun buildUdpPacket(
        payload: ByteArray, 
        srcIp: ByteArray, 
        destIp: ByteArray, 
        srcPort: Int, 
        destPort: Int
    ): ByteArray {
        val ipHeaderLen = 20
        val udpHeaderLen = 8
        val totalLen = ipHeaderLen + udpHeaderLen + payload.size
        
        val buffer = ByteBuffer.allocate(totalLen)
        
        // IP Header
        buffer.put(0x45.toByte()) // Version 4, Header Len 5
        buffer.put(0x00.toByte()) // TOS
        buffer.putShort(totalLen.toShort()) // Total Len
        buffer.putShort(0.toShort()) // ID
        buffer.putShort(0x4000.toShort()) // Flags (Don't Fragment)
        buffer.put(64.toByte()) // TTL
        buffer.put(17.toByte()) // Protocol UDP
        buffer.putShort(0.toShort()) // Checksum (0 for now)
        buffer.put(srcIp)
        buffer.put(destIp)
        
        // Calculate IP Checksum
        val ipChecksum = calculateChecksum(buffer.array(), 0, ipHeaderLen)
        buffer.putShort(10, ipChecksum.toShort())
        
        // UDP Header
        buffer.putShort(srcPort.toShort())
        buffer.putShort(destPort.toShort())
        buffer.putShort((udpHeaderLen + payload.size).toShort())
        buffer.putShort(0.toShort()) // UDP Checksum (optional, 0)
        
        // Payload
        buffer.put(payload)
        
        return buffer.array()
    }

    private fun calculateChecksum(data: ByteArray, offset: Int, length: Int): Int {
        var sum = 0
        var i = offset
        while (i < offset + length - 1) {
            sum += (data[i].toInt() and 0xFF) shl 8 or (data[i + 1].toInt() and 0xFF)
            i += 2
        }
        if (i < offset + length) {
            sum += (data[i].toInt() and 0xFF) shl 8
        }
        while (sum > 0xFFFF) {
            sum = (sum and 0xFFFF) + (sum ushr 16)
        }
        return sum.inv() and 0xFFFF
    }

    private fun extractDomain(packet: ByteBuffer, offset: Int): String {
        val sb = StringBuilder()
        var pos = offset
        try {
            while (pos < packet.limit()) {
                val len = packet.get(pos).toInt() and 0xFF
                if (len == 0) break
                if ((len and 0xC0) == 0xC0) {
                    // DNS compression pointer - skip for now
                    return sb.toString() 
                }
                pos++
                for (i in 0 until len) {
                    sb.append(packet.get(pos).toChar())
                    pos++
                }
                sb.append('.')
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting domain", e)
        }
        return sb.toString().trimEnd('.')
    }

    private fun createNotification(): Notification {
        val channelId = "musafir_vpn"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, 
                "Musafir Protection", 
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Content filtering active"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
        
        // Intent to open app via DeepLinkActivity
        val intent = Intent(this, com.musafir.DeepLinkActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("مسافر - Protection Active")
            .setContentText("AI-powered content filtering enabled")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        private const val TAG = "MusafirVPN"
        private const val VPN_NOTIFICATION_ID = 1001
        var isRunning = false
    }
}
