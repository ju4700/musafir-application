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
import com.musafir.modules.SharedPrefsModule
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

/**
 * VPN Service that acts as a DNS Proxy to block harmful content.
 * It intercepts DNS queries sent to the virtual DNS server (10.0.0.2).
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

        // Load blocklist from intent (or SharedPrefs in future)
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
            // We configure it to intercept ONLY traffic to our virtual DNS IP
            val builder = Builder()
                .setSession("HaramBlocker VPN")
                .addAddress("10.0.0.2", 32)
                .addDnsServer("10.0.0.2")
                .addRoute("10.0.0.2", 32)
                // We do NOT add default route (0.0.0.0/0) so normal traffic bypasses VPN
                // This ensures internet works, but DNS is filtered

            // Exclude our app
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                try {
                    builder.addDisallowedApplication(packageName)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to exclude app", e)
                }
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
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing VPN interface", e)
        }
        vpnThread?.interrupt()
        vpnThread = null
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

            // Extract Domain
            val domain = extractDomain(packet, dnsPayloadOffset + 12) // Skip DNS Header (12 bytes)
            
            if (isDomainBlocked(domain)) {
                Log.d(TAG, "Blocking domain: $domain")
                // Send NXDOMAIN response? 
                // For simplicity, we just drop the packet. 
                // The client will timeout and retry, eventually failing.
                // A better UX is to send a response, but constructing it is complex.
                return 
            }

            // Forward to Real DNS (8.8.8.8)
            forwardDnsQuery(packet, dnsPayloadOffset, dnsPayloadLength, srcIp, srcPort, outputStream)

        } catch (e: Exception) {
            Log.e(TAG, "Error handling packet", e)
        }
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

            val dnsServer = InetAddress.getByName("8.8.8.8")
            val outPacket = DatagramPacket(dnsQuery, payloadLength, dnsServer, 53)
            socket.send(outPacket)

            // Receive response
            val responseBuffer = ByteArray(4096)
            val inPacket = DatagramPacket(responseBuffer, responseBuffer.size)
            socket.soTimeout = 2000 // 2s timeout
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
                    // Pointer (compression) - not handled for simplicity, but common in responses, less in queries
                    return sb.toString() 
                }
                pos++
                for (i in 0 until len) {
                    sb.append(packet.get(pos).toChar())
                    pos++
                }
                sb.append('.')
            }
        } catch (e: Exception) { }
        return sb.toString().trimEnd('.')
    }

    private fun isDomainBlocked(domain: String): Boolean {
        if (domain.isEmpty()) return false
        val lower = domain.lowercase()
        if (blocklist.contains(lower)) return true
        for (blocked in blocklist) {
            if (lower.endsWith(".$blocked")) return true
        }
        return false
    }

    private fun createNotification(): Notification {
        val channelId = "haramBlocker_vpn"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "VPN Service", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
        
        // Intent to open app via DeepLinkActivity (which is always enabled)
        // This ensures we can re-open the app even if MainActivity is disabled (hidden)
        val intent = Intent(this, com.musafir.DeepLinkActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("HaramBlocker Active")
            .setContentText("Blocking harmful content")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val TAG = "HaramBlockerVPN"
        private const val VPN_NOTIFICATION_ID = 1001
        var isRunning = false
    }
}
