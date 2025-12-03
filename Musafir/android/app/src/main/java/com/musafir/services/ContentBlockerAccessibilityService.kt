package com.musafir.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.musafir.modules.SharedPrefsModule

/**
 * Accessibility Service for Content Blocking
 * 
 * This service monitors browser URL bars and search fields to detect
 * and block harmful content that DNS filtering cannot catch.
 * 
 * It works by:
 * 1. Monitoring accessibility events from browsers
 * 2. Reading URL bar content and search queries
 * 3. Analyzing content with AI filter
 * 4. Pressing back or going home when harmful content detected
 */
class ContentBlockerAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ContentBlocker"
        var isRunning = false
        
        // Browser package names to monitor
        private val BROWSER_PACKAGES = setOf(
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.chrome.canary",
            "org.mozilla.firefox",
            "org.mozilla.firefox_beta",
            "com.opera.browser",
            "com.opera.mini.native",
            "com.microsoft.emmx",
            "com.brave.browser",
            "com.duckduckgo.mobile.android",
            "com.samsung.android.app.sbrowser",
            "com.sec.android.app.sbrowser",
            "com.UCMobile.intl",
            "com.kiwibrowser.browser",
            "com.vivaldi.browser",
        )
        
        // Additional apps to monitor (social media, etc.)
        private val MONITORED_APPS = setOf(
            "com.google.android.youtube",
            "com.twitter.android",
            "com.instagram.android",
            "com.reddit.frontpage",
            "com.tumblr",
        )
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "ContentBlocker Accessibility Service connected")
        
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
                        AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                        AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                   AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }
        serviceInfo = info
        isRunning = true
        Log.d(TAG, "Accessibility service configured and running")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        
        // Check if timer is active
        if (!isTimerActive()) return
        
        val packageName = event.packageName?.toString() ?: return
        
        // Only monitor browsers and specific apps
        if (packageName !in BROWSER_PACKAGES && packageName !in MONITORED_APPS) return
        
        try {
            when (event.eventType) {
                AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
                AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                    checkWindowContent(event, packageName)
                }
                AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                    checkTextInput(event, packageName)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing accessibility event", e)
        }
    }

    private fun checkWindowContent(event: AccessibilityEvent, packageName: String) {
        val rootNode = rootInActiveWindow ?: return
        
        try {
            // Find URL bar or search field
            val urlText = findUrlBarText(rootNode, packageName)
            if (urlText.isNotEmpty()) {
                analyzeAndBlock(urlText, "URL")
            }
            
            // Also check page title
            val titleText = findPageTitle(rootNode)
            if (titleText.isNotEmpty()) {
                analyzeAndBlock(titleText, "Title")
            }
        } finally {
            rootNode.recycle()
        }
    }

    private fun checkTextInput(event: AccessibilityEvent, packageName: String) {
        val text = event.text?.joinToString(" ") ?: return
        if (text.length > 3) {
            analyzeAndBlock(text, "Input")
        }
    }

    private fun findUrlBarText(root: AccessibilityNodeInfo, packageName: String): String {
        // Common URL bar IDs across browsers
        val urlBarIds = listOf(
            "url_bar",
            "url_field", 
            "search_box_text",
            "mozac_browser_toolbar_url_view",
            "address_bar",
            "search_edit_frame",
            "search_src_text",
            "omnibox_text",
        )
        
        for (id in urlBarIds) {
            try {
                val nodes = root.findAccessibilityNodeInfosByViewId("$packageName:id/$id")
                if (nodes != null && nodes.isNotEmpty()) {
                    val text = nodes[0].text?.toString() ?: ""
                    nodes.forEach { it.recycle() }
                    if (text.isNotEmpty()) return text
                }
            } catch (e: Exception) {
                // Continue to next ID
            }
        }
        
        // Fallback: search for EditText with URL-like content
        return findTextInNode(root, 0)
    }

    private fun findTextInNode(node: AccessibilityNodeInfo, depth: Int): String {
        if (depth > 10) return "" // Limit recursion
        
        val text = node.text?.toString() ?: ""
        
        // Check if this looks like a URL or search query
        if (text.length > 5 && (text.contains("http") || text.contains("www") || 
            text.contains(".com") || text.contains("search") || text.contains("q="))) {
            return text
        }
        
        // Check children
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val childText = findTextInNode(child, depth + 1)
            child.recycle()
            if (childText.isNotEmpty()) return childText
        }
        
        return ""
    }

    private fun findPageTitle(root: AccessibilityNodeInfo): String {
        // Try to find page title
        try {
            val contentDesc = root.contentDescription?.toString() ?: ""
            if (contentDesc.length > 3) return contentDesc
        } catch (e: Exception) {}
        return ""
    }

    private fun analyzeAndBlock(text: String, source: String) {
        val result = AIContentFilterNative.analyzeText(text)
        
        if (result.isBlocked) {
            Log.d(TAG, "🚫 BLOCKED [$source]: '$text' - Category: ${result.category}")
            blockContent()
        }
    }

    private fun blockContent() {
        // Method 1: Press BACK to go away from harmful content
        performGlobalAction(GLOBAL_ACTION_BACK)
        
        // Small delay then go HOME if still in browser
        android.os.Handler(mainLooper).postDelayed({
            performGlobalAction(GLOBAL_ACTION_HOME)
        }, 300)
        
        Log.d(TAG, "Blocked harmful content - navigated away")
    }

    private fun isTimerActive(): Boolean {
        return try {
            val prefs = getSharedPreferences(SharedPrefsModule.PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(SharedPrefsModule.KEY_IS_ACTIVE, false)
            val endTime = prefs.getLong(SharedPrefsModule.KEY_END_TIME, 0)
            isActive && endTime > System.currentTimeMillis()
        } catch (e: Exception) {
            false
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted")
        isRunning = false
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Accessibility service destroyed")
        isRunning = false
    }
}
