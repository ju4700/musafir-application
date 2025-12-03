package com.musafir.services

import android.util.Log

/**
 * AI-based Content Filter for detecting haram/adult content
 * Uses multi-layer filtering: keywords, patterns, and heuristics
 */
object AIContentFilterNative {
    private const val TAG = "AIContentFilter"

    // ========================================================================
    // BLOCKED KEYWORD CATEGORIES
    // ========================================================================

    private val ADULT_KEYWORDS = setOf(
        "porn", "xxx", "sex", "nude", "naked", "erotic", "adult", "nsfw",
        "hentai", "milf", "teen", "lesbian", "gay", "anal", "oral", "blowjob",
        "handjob", "masturbat", "orgasm", "fetish", "bdsm", "bondage", "dildo",
        "vibrator", "stripper", "escort", "prostitut", "hooker", "whore",
        "slut", "camgirl", "onlyfans", "fansly", "chaturbate", "livejasmin",
        "pornhub", "xvideos", "xnxx", "redtube", "youporn", "xhamster",
        "brazzers", "bangbros", "realitykings", "naughtyamerica",
        "playboy", "penthouse", "hustler", "boobs", "tits", "pussy", "cock",
        "dick", "penis", "vagina", "breasts", "buttocks", "genitals",
        "intercourse", "fornication", "adultery", "threesome", "orgy",
        "swinger", "cuckold", "incest", "rape", "molest", "spankbang",
        "eporner", "tube8", "motherless", "keezmovies", "extremetube",
        "youjizz", "cam4", "stripchat", "myfreecams", "bongacams",
        "adultfriendfinder", "fling", "casual sex"
    )

    private val GAMBLING_KEYWORDS = setOf(
        "casino", "poker", "blackjack", "roulette", "slots", "betting",
        "gamble", "gambling", "bet365", "betway", "pokerstars", "888casino",
        "unibet", "bwin", "draftkings", "fanduel", "sportsbook", "bookie",
        "wager", "jackpot", "lottery", "lotto", "scratch", "keno",
        "baccarat", "craps", "sportsbetting", "odds", "parlay"
    )

    private val ALCOHOL_KEYWORDS = setOf(
        "alcohol", "beer", "wine", "whiskey", "vodka", "rum", "gin", "tequila",
        "brandy", "cognac", "liquor", "spirits", "cocktail", "bartender",
        "brewery", "distillery", "winery", "pub", "bar", "tavern",
        "drunk", "intoxicated", "booze", "drinking", "champagne"
    )

    private val DRUG_KEYWORDS = setOf(
        "cocaine", "heroin", "meth", "marijuana", "cannabis", "weed",
        "hash", "hashish", "ecstasy", "mdma", "lsd", "mushroom", "psilocybin",
        "ketamine", "fentanyl", "opioid", "narcotic", "dealer", "trafficking",
        "overdose", "inject", "snort"
    )

    private val VIOLENCE_KEYWORDS = setOf(
        "gore", "murder", "torture", "mutilat", "beheading", "decapitat",
        "dismember", "bloodbath", "massacre", "slaughter", "execution",
        "suicide", "self-harm", "cutting"
    )

    private val DATING_KEYWORDS = setOf(
        "tinder", "bumble", "hinge", "grindr", "hookup", "one night stand",
        "fling", "friends with benefits", "fwb", "sugar daddy",
        "sugar baby", "seeking arrangement", "ashley madison"
    )

    // ========================================================================
    // BLOCKED DOMAIN PATTERNS (Regex)
    // ========================================================================

    private val BLOCKED_DOMAIN_PATTERNS = listOf(
        Regex("porn", RegexOption.IGNORE_CASE),
        Regex("xxx", RegexOption.IGNORE_CASE),
        Regex("sex(?!pert|ton)", RegexOption.IGNORE_CASE),
        Regex("nude", RegexOption.IGNORE_CASE),
        Regex("adult(?!swim)", RegexOption.IGNORE_CASE),
        Regex("nsfw", RegexOption.IGNORE_CASE),
        Regex("hentai", RegexOption.IGNORE_CASE),
        Regex("erotic", RegexOption.IGNORE_CASE),
        Regex("fetish", RegexOption.IGNORE_CASE),
        Regex("cam(?:girl|model|site)", RegexOption.IGNORE_CASE),
        Regex("escort", RegexOption.IGNORE_CASE),
        Regex("strip(?:per|club)", RegexOption.IGNORE_CASE),
        Regex("xvideos", RegexOption.IGNORE_CASE),
        Regex("xnxx", RegexOption.IGNORE_CASE),
        Regex("pornhub", RegexOption.IGNORE_CASE),
        Regex("redtube", RegexOption.IGNORE_CASE),
        Regex("youporn", RegexOption.IGNORE_CASE),
        Regex("xhamster", RegexOption.IGNORE_CASE),
        Regex("spankbang", RegexOption.IGNORE_CASE),
        Regex("eporner", RegexOption.IGNORE_CASE),
        Regex("tube8", RegexOption.IGNORE_CASE),
        Regex("brazzers", RegexOption.IGNORE_CASE),
        Regex("bangbros", RegexOption.IGNORE_CASE),
        Regex("onlyfans", RegexOption.IGNORE_CASE),
        Regex("fansly", RegexOption.IGNORE_CASE),
        Regex("chaturbate", RegexOption.IGNORE_CASE),
        Regex("livejasmin", RegexOption.IGNORE_CASE),
        Regex("stripchat", RegexOption.IGNORE_CASE),
        Regex("cam4", RegexOption.IGNORE_CASE),
        Regex("myfreecams", RegexOption.IGNORE_CASE),
        Regex("bongacams", RegexOption.IGNORE_CASE),
        Regex("casino", RegexOption.IGNORE_CASE),
        Regex("poker(?!mon)", RegexOption.IGNORE_CASE),
        Regex("bet365", RegexOption.IGNORE_CASE),
        Regex("betway", RegexOption.IGNORE_CASE),
        Regex("pokerstars", RegexOption.IGNORE_CASE),
        Regex("888(?:casino|poker|sport)", RegexOption.IGNORE_CASE),
        Regex("unibet", RegexOption.IGNORE_CASE),
        Regex("bwin", RegexOption.IGNORE_CASE),
        Regex("draftkings", RegexOption.IGNORE_CASE),
        Regex("fanduel", RegexOption.IGNORE_CASE),
        Regex("sportsbook", RegexOption.IGNORE_CASE),
        Regex("gambling", RegexOption.IGNORE_CASE),
        Regex("tinder", RegexOption.IGNORE_CASE),
        Regex("grindr", RegexOption.IGNORE_CASE),
        Regex("ashleymadison", RegexOption.IGNORE_CASE),
        Regex("seekingarrangement", RegexOption.IGNORE_CASE),
        Regex("adultfriendfinder", RegexOption.IGNORE_CASE)
    )

    // ========================================================================
    // SAFE DOMAINS (Whitelist) - More comprehensive
    // ========================================================================

    private val SAFE_DOMAINS = setOf(
        // Google
        "google.com", "google.co", "google.co.uk", "google.ca", "google.com.au",
        "google.de", "google.fr", "google.es", "google.it", "google.nl",
        "google.pl", "google.ru", "google.com.br", "google.co.in", "google.co.jp",
        "googleapis.com", "gstatic.com", "googleusercontent.com", "googlevideo.com",
        "googleadservices.com", "google-analytics.com", "googletagmanager.com",
        "googlesyndication.com", "googledomains.com", "goo.gl",
        // YouTube
        "youtube.com", "youtu.be", "ytimg.com", "yt.be", "youtube-nocookie.com",
        // Facebook/Meta
        "facebook.com", "fbcdn.net", "fb.com", "facebook.net", "fbsbx.com",
        "instagram.com", "cdninstagram.com",
        // Twitter/X
        "twitter.com", "x.com", "twimg.com", "t.co",
        // Microsoft
        "microsoft.com", "msn.com", "bing.com", "live.com", "outlook.com",
        "office.com", "office365.com", "azure.com", "windows.com", "windowsupdate.com",
        "xbox.com", "skype.com", "linkedin.com", "github.com", "githubusercontent.com",
        // Apple
        "apple.com", "icloud.com", "apple-dns.net", "mzstatic.com",
        // Amazon
        "amazon.com", "amazonaws.com", "amazonws.com", "cloudfront.net",
        // Other tech
        "stackoverflow.com", "stackexchange.com",
        "wikipedia.org", "wikimedia.org",
        "reddit.com", "redd.it", "redditmedia.com", "redditstatic.com",
        "quora.com",
        "medium.com",
        // News
        "bbc.com", "bbc.co.uk",
        "cnn.com",
        "nytimes.com",
        "theguardian.com",
        "reuters.com",
        // Islamic
        "aljazeera.com", "aljazeera.net",
        "islamqa.info",
        "islamweb.net",
        "quran.com",
        "sunnah.com",
        // CDNs and infrastructure
        "cloudflare.com", "cloudflare-dns.com", "cloudflareinsights.com",
        "akamai.com", "akamaized.net", "akamaitech.net",
        "fastly.net", "fastlylb.net",
        "edgecastcdn.net", "edgesuite.net",
        "llnwd.net",
        // Messaging
        "whatsapp.com", "whatsapp.net",
        "telegram.org", "t.me",
        "signal.org",
        // Common utilities
        "w3.org",
        "jquery.com",
        "jsdelivr.net",
        "unpkg.com",
        "cdnjs.com", "cdnjs.cloudflare.com",
        "bootstrapcdn.com",
        // Android/Mobile
        "android.com",
        "play.google.com",
        "firebase.google.com",
        "firebaseio.com",
        "crashlytics.com"
    )

    // ========================================================================
    // CONTENT ANALYSIS
    // ========================================================================

    data class FilterResult(
        val isBlocked: Boolean,
        val category: String,
        val confidence: Float,
        val matchedKeywords: List<String>,
        val reason: String
    )

    /**
     * Analyze domain for harmful content
     * Returns true if domain should be blocked
     */
    fun isDomainBlocked(domain: String): Boolean {
        val result = analyzeDomain(domain)
        if (result.isBlocked) {
            Log.d(TAG, "🚫 BLOCKED: $domain -> category=${result.category}, reason=${result.reason}")
        } else {
            Log.d(TAG, "✓ ALLOWED: $domain")
        }
        return result.isBlocked
    }

    /**
     * Check if domain is in whitelist (including subdomains)
     */
    private fun isWhitelisted(domain: String): Boolean {
        val normalizedDomain = domain.lowercase().trim()
        
        for (safe in SAFE_DOMAINS) {
            // Exact match
            if (normalizedDomain == safe) return true
            // Subdomain match (e.g., "www.google.com" matches "google.com")
            if (normalizedDomain.endsWith(".$safe")) return true
        }
        return false
    }

    /**
     * Full domain analysis with details
     */
    fun analyzeDomain(domain: String): FilterResult {
        val normalizedDomain = domain.lowercase().trim()
        
        // Skip empty domains
        if (normalizedDomain.isEmpty()) {
            return FilterResult(false, "empty", 0f, emptyList(), "Empty domain")
        }

        // Check whitelist first - this is the most important check
        if (isWhitelisted(normalizedDomain)) {
            return FilterResult(
                isBlocked = false,
                category = "safe",
                confidence = 1f,
                matchedKeywords = emptyList(),
                reason = "Whitelisted domain"
            )
        }

        // Check blocked domain patterns (regex) - only explicit bad domains
        for (pattern in BLOCKED_DOMAIN_PATTERNS) {
            if (pattern.containsMatchIn(normalizedDomain)) {
                val category = categorizePattern(pattern.pattern)
                return FilterResult(
                    isBlocked = true,
                    category = category,
                    confidence = 0.95f,
                    matchedKeywords = listOf(pattern.pattern),
                    reason = "Domain matches $category pattern"
                )
            }
        }

        // For unknown domains, ONLY block if domain name itself contains harmful keywords
        // Be conservative - don't block generic domains
        val domainParts = normalizedDomain.replace(Regex("[.-]"), " ")
        
        // Only check against adult keywords for domain names (most critical)
        for (keyword in ADULT_KEYWORDS) {
            if (domainParts.contains(keyword) && keyword.length >= 4) {
                return FilterResult(
                    isBlocked = true,
                    category = "adult",
                    confidence = 0.8f,
                    matchedKeywords = listOf(keyword),
                    reason = "Domain contains adult keyword: $keyword"
                )
            }
        }

        // Default: ALLOW unknown domains (be permissive)
        return FilterResult(
            isBlocked = false,
            category = "unknown",
            confidence = 0.5f,
            matchedKeywords = emptyList(),
            reason = "No harmful patterns detected - allowing"
        )
    }

    /**
     * Analyze text content for harmful keywords
     */
    fun analyzeText(text: String): FilterResult {
        val normalizedText = text.lowercase().trim()
        val matchedKeywords = mutableListOf<String>()
        var category = "safe"
        var confidence = 0f

        // Check adult keywords (highest priority)
        for (keyword in ADULT_KEYWORDS) {
            if (normalizedText.contains(keyword)) {
                matchedKeywords.add(keyword)
                category = "adult"
                confidence = minOf(1f, confidence + 0.3f)
            }
        }

        // Check gambling keywords
        if (category == "safe") {
            for (keyword in GAMBLING_KEYWORDS) {
                if (normalizedText.contains(keyword)) {
                    matchedKeywords.add(keyword)
                    category = "gambling"
                    confidence = minOf(1f, confidence + 0.25f)
                }
            }
        }

        // Check alcohol keywords
        if (category == "safe") {
            for (keyword in ALCOHOL_KEYWORDS) {
                if (normalizedText.contains(keyword)) {
                    matchedKeywords.add(keyword)
                    category = "alcohol"
                    confidence = minOf(1f, confidence + 0.2f)
                }
            }
        }

        // Check drug keywords
        if (category == "safe") {
            for (keyword in DRUG_KEYWORDS) {
                if (normalizedText.contains(keyword)) {
                    matchedKeywords.add(keyword)
                    category = "drugs"
                    confidence = minOf(1f, confidence + 0.25f)
                }
            }
        }

        // Check violence keywords
        if (category == "safe") {
            for (keyword in VIOLENCE_KEYWORDS) {
                if (normalizedText.contains(keyword)) {
                    matchedKeywords.add(keyword)
                    category = "violence"
                    confidence = minOf(1f, confidence + 0.2f)
                }
            }
        }

        // Check dating keywords
        if (category == "safe") {
            for (keyword in DATING_KEYWORDS) {
                if (normalizedText.contains(keyword)) {
                    matchedKeywords.add(keyword)
                    category = "dating"
                    confidence = minOf(1f, confidence + 0.2f)
                }
            }
        }

        val isBlocked = confidence >= 0.3f
        val reason = if (isBlocked) {
            "Detected $category content: ${matchedKeywords.take(3).joinToString(", ")}"
        } else {
            "Content appears safe"
        }

        return FilterResult(
            isBlocked = isBlocked,
            category = category,
            confidence = confidence,
            matchedKeywords = matchedKeywords,
            reason = reason
        )
    }

    /**
     * Get all blocked keywords (for external use)
     */
    fun getAllBlockedKeywords(): Set<String> {
        return ADULT_KEYWORDS + GAMBLING_KEYWORDS + ALCOHOL_KEYWORDS + 
               DRUG_KEYWORDS + VIOLENCE_KEYWORDS + DATING_KEYWORDS
    }

    /**
     * Helper to categorize a pattern
     */
    private fun categorizePattern(pattern: String): String {
        val lower = pattern.lowercase()
        return when {
            Regex("porn|xxx|sex|nude|adult|nsfw|hentai|erotic|fetish|cam|escort|strip|xvideos|xnxx|pornhub|redtube|youporn|xhamster|brazzers|onlyfans|chaturbate", RegexOption.IGNORE_CASE).containsMatchIn(lower) -> "adult"
            Regex("casino|poker|bet|gambling|sportsbook|draftkings|fanduel", RegexOption.IGNORE_CASE).containsMatchIn(lower) -> "gambling"
            Regex("tinder|grindr|ashley|dating|hookup", RegexOption.IGNORE_CASE).containsMatchIn(lower) -> "dating"
            else -> "adult"
        }
    }
}
