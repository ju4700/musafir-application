/**
 * AI Content Filter Service
 * Autonomous content detection for haram/adult content
 * Uses multi-layer filtering: keywords, patterns, domain classification, and heuristics
 */

// ============================================================================
// BLOCKED KEYWORD CATEGORIES
// ============================================================================

/**
 * Adult/Pornographic keywords (explicit)
 */
const ADULT_KEYWORDS: string[] = [
  'porn', 'xxx', 'sex', 'nude', 'naked', 'erotic', 'adult', 'nsfw',
  'hentai', 'milf', 'teen', 'lesbian', 'gay', 'anal', 'oral', 'blowjob',
  'handjob', 'masturbat', 'orgasm', 'fetish', 'bdsm', 'bondage', 'dildo',
  'vibrator', 'stripper', 'escort', 'prostitut', 'hooker', 'whore',
  'slut', 'camgirl', 'onlyfans', 'fansly', 'chaturbate', 'livejasmin',
  'pornhub', 'xvideos', 'xnxx', 'redtube', 'youporn', 'xhamster',
  'brazzers', 'bangbros', 'realitykings', 'naughtyamerica',
  'playboy', 'penthouse', 'hustler', 'boobs', 'tits', 'pussy', 'cock',
  'dick', 'penis', 'vagina', 'breasts', 'buttocks', 'genitals',
  'intercourse', 'fornication', 'adultery', 'threesome', 'orgy',
  'swinger', 'cuckold', 'incest', 'rape', 'molest',
];

/**
 * Gambling keywords
 */
const GAMBLING_KEYWORDS: string[] = [
  'casino', 'poker', 'blackjack', 'roulette', 'slots', 'betting',
  'gamble', 'gambling', 'bet365', 'betway', 'pokerstars', '888casino',
  'unibet', 'bwin', 'draftkings', 'fanduel', 'sportsbook', 'bookie',
  'wager', 'jackpot', 'lottery', 'lotto', 'scratch', 'keno',
  'baccarat', 'craps', 'sportsbetting', 'odds', 'parlay',
];

/**
 * Alcohol keywords
 */
const ALCOHOL_KEYWORDS: string[] = [
  'alcohol', 'beer', 'wine', 'whiskey', 'vodka', 'rum', 'gin', 'tequila',
  'brandy', 'cognac', 'liquor', 'spirits', 'cocktail', 'bartender',
  'brewery', 'distillery', 'winery', 'pub', 'bar', 'tavern',
  'drunk', 'intoxicated', 'booze', 'drinking', 'champagne',
];

/**
 * Drug keywords
 */
const DRUG_KEYWORDS: string[] = [
  'drug', 'cocaine', 'heroin', 'meth', 'marijuana', 'cannabis', 'weed',
  'hash', 'hashish', 'ecstasy', 'mdma', 'lsd', 'mushroom', 'psilocybin',
  'ketamine', 'fentanyl', 'opioid', 'narcotic', 'dealer', 'trafficking',
  'high', 'stoned', 'overdose', 'inject', 'snort', 'smoke weed',
];

/**
 * Violence/Gore keywords
 */
const VIOLENCE_KEYWORDS: string[] = [
  'gore', 'murder', 'kill', 'torture', 'mutilat', 'beheading', 'decapitat',
  'dismember', 'bloodbath', 'massacre', 'slaughter', 'execution',
  'suicide', 'self-harm', 'cutting', 'hanging',
];

/**
 * Dating/Hookup keywords
 */
const DATING_KEYWORDS: string[] = [
  'tinder', 'bumble', 'hinge', 'grindr', 'hookup', 'one night stand',
  'fling', 'casual sex', 'friends with benefits', 'fwb', 'sugar daddy',
  'sugar baby', 'arrangement', 'seeking arrangement', 'ashley madison',
];

/**
 * Haram financial keywords (interest/usury)
 */
const RIBA_KEYWORDS: string[] = [
  'interest rate', 'usury', 'loan shark', 'payday loan', 'high interest',
];

// ============================================================================
// BLOCKED DOMAIN PATTERNS
// ============================================================================

/**
 * Known adult domains and patterns
 */
const BLOCKED_DOMAIN_PATTERNS: RegExp[] = [
  // Explicit adult sites
  /porn/i,
  /xxx/i,
  /sex(?!pert|ton)/i, // sex but not sexpert, sexton
  /nude/i,
  /adult(?!swim)/i, // adult but not adultswim
  /nsfw/i,
  /hentai/i,
  /erotic/i,
  /fetish/i,
  /cam(?:girl|model|site)/i,
  /escort/i,
  /strip(?:per|club)/i,
  
  // Known adult domains
  /xvideos/i,
  /xnxx/i,
  /pornhub/i,
  /redtube/i,
  /youporn/i,
  /xhamster/i,
  /spankbang/i,
  /eporner/i,
  /tube8/i,
  /brazzers/i,
  /bangbros/i,
  /onlyfans/i,
  /fansly/i,
  /chaturbate/i,
  /livejasmin/i,
  /stripchat/i,
  /cam4/i,
  /myfreecams/i,
  /bongacams/i,
  
  // Gambling
  /casino/i,
  /poker(?!mon)/i, // poker but not pokemon
  /bet365/i,
  /betway/i,
  /pokerstars/i,
  /888(?:casino|poker|sport)/i,
  /unibet/i,
  /bwin/i,
  /draftkings/i,
  /fanduel/i,
  /sportsbook/i,
  /gambling/i,
  
  // Dating/Hookup
  /tinder/i,
  /grindr/i,
  /ashleymadison/i,
  /seekingarrangement/i,
  /adultfriendfinder/i,
];

/**
 * Safe domains that should never be blocked (whitelist)
 */
const SAFE_DOMAINS: string[] = [
  'google.com',
  'youtube.com', // Will filter search queries instead
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'github.com',
  'stackoverflow.com',
  'wikipedia.org',
  'amazon.com',
  'microsoft.com',
  'apple.com',
  'reddit.com', // Will filter specific subreddits
  'quora.com',
  'medium.com',
  'bbc.com',
  'cnn.com',
  'nytimes.com',
  'theguardian.com',
  'reuters.com',
  'aljazeera.com',
  'islamqa.info',
  'islamweb.net',
  'quran.com',
  'sunnah.com',
];

// ============================================================================
// SEARCH QUERY PATTERNS
// ============================================================================

/**
 * Patterns that indicate harmful search intent
 */
const HARMFUL_SEARCH_PATTERNS: RegExp[] = [
  // Adult content searches
  /\b(hot|sexy|naked|nude)\s+(girl|woman|women|man|men|teen|model)/i,
  /\b(free|watch|download)\s+(porn|xxx|sex|adult)/i,
  /\b(porn|xxx|sex)\s+(video|movie|clip|tube|site)/i,
  /\bhow\s+to\s+(watch|find|get)\s+(porn|xxx)/i,
  /\b(leaked|private)\s+(nude|photo|video)/i,
  /\bcelebrity\s+(nude|naked|sex)/i,
  
  // Gambling searches
  /\b(online|free|best)\s+(casino|poker|gambling|betting)/i,
  /\bhow\s+to\s+(gamble|bet|win)\s+(online|money)/i,
  
  // Alcohol searches
  /\b(buy|order|get)\s+(alcohol|beer|wine|liquor)/i,
  /\b(best|cheap)\s+(alcohol|beer|wine|whiskey)/i,
  
  // Drug searches
  /\b(buy|get|find)\s+(drug|weed|marijuana|cocaine)/i,
  /\bhow\s+to\s+(get|make|grow)\s+(drug|weed|high)/i,
];

// ============================================================================
// AI CONTENT FILTER CLASS
// ============================================================================

export type ContentCategory = 
  | 'adult'
  | 'gambling'
  | 'alcohol'
  | 'drugs'
  | 'violence'
  | 'dating'
  | 'riba'
  | 'safe';

export interface FilterResult {
  isBlocked: boolean;
  category: ContentCategory;
  confidence: number; // 0-1
  matchedKeywords: string[];
  reason: string;
}

export class AIContentFilter {
  
  /**
   * Analyze text content for harmful material
   */
  static analyzeText(text: string): FilterResult {
    const normalizedText = text.toLowerCase().trim();
    const matchedKeywords: string[] = [];
    let category: ContentCategory = 'safe';
    let confidence = 0;
    let reason = '';

    // Check adult keywords (highest priority)
    for (const keyword of ADULT_KEYWORDS) {
      if (normalizedText.includes(keyword)) {
        matchedKeywords.push(keyword);
        category = 'adult';
        confidence = Math.min(1, confidence + 0.3);
      }
    }

    // Check gambling keywords
    if (category === 'safe') {
      for (const keyword of GAMBLING_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
          matchedKeywords.push(keyword);
          category = 'gambling';
          confidence = Math.min(1, confidence + 0.25);
        }
      }
    }

    // Check alcohol keywords
    if (category === 'safe') {
      for (const keyword of ALCOHOL_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
          matchedKeywords.push(keyword);
          category = 'alcohol';
          confidence = Math.min(1, confidence + 0.2);
        }
      }
    }

    // Check drug keywords
    if (category === 'safe') {
      for (const keyword of DRUG_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
          matchedKeywords.push(keyword);
          category = 'drugs';
          confidence = Math.min(1, confidence + 0.25);
        }
      }
    }

    // Check violence keywords
    if (category === 'safe') {
      for (const keyword of VIOLENCE_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
          matchedKeywords.push(keyword);
          category = 'violence';
          confidence = Math.min(1, confidence + 0.2);
        }
      }
    }

    // Check dating keywords
    if (category === 'safe') {
      for (const keyword of DATING_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
          matchedKeywords.push(keyword);
          category = 'dating';
          confidence = Math.min(1, confidence + 0.2);
        }
      }
    }

    // Check harmful search patterns (boost confidence)
    for (const pattern of HARMFUL_SEARCH_PATTERNS) {
      if (pattern.test(normalizedText)) {
        confidence = Math.min(1, confidence + 0.4);
        if (category === 'safe') {
          category = 'adult'; // Default to adult for pattern matches
        }
      }
    }

    const isBlocked = confidence >= 0.3;
    
    if (isBlocked) {
      reason = `Detected ${category} content: ${matchedKeywords.slice(0, 3).join(', ')}`;
    }

    return {
      isBlocked,
      category,
      confidence,
      matchedKeywords,
      reason,
    };
  }

  /**
   * Analyze domain for harmful content
   */
  static analyzeDomain(domain: string): FilterResult {
    const normalizedDomain = domain.toLowerCase().trim();
    
    // Check whitelist first
    for (const safe of SAFE_DOMAINS) {
      if (normalizedDomain === safe || normalizedDomain.endsWith('.' + safe)) {
        return {
          isBlocked: false,
          category: 'safe',
          confidence: 1,
          matchedKeywords: [],
          reason: 'Whitelisted domain',
        };
      }
    }

    // Check blocked domain patterns
    for (const pattern of BLOCKED_DOMAIN_PATTERNS) {
      if (pattern.test(normalizedDomain)) {
        const category = this.categorizePattern(pattern);
        return {
          isBlocked: true,
          category,
          confidence: 0.9,
          matchedKeywords: [pattern.source],
          reason: `Domain matches ${category} pattern`,
        };
      }
    }

    // Analyze domain name as text
    const textAnalysis = this.analyzeText(normalizedDomain.replace(/[.-]/g, ' '));
    if (textAnalysis.isBlocked) {
      return {
        ...textAnalysis,
        reason: `Domain name contains ${textAnalysis.category} keywords`,
      };
    }

    return {
      isBlocked: false,
      category: 'safe',
      confidence: 0.5, // Medium confidence for unknown domains
      matchedKeywords: [],
      reason: 'No harmful patterns detected',
    };
  }

  /**
   * Analyze URL for harmful content (domain + path + query)
   */
  static analyzeURL(url: string): FilterResult {
    try {
      // Extract components
      let domain = url;
      let path = '';
      let query = '';

      // Remove protocol
      domain = domain.replace(/^https?:\/\//, '');
      
      // Extract path
      const pathIndex = domain.indexOf('/');
      if (pathIndex !== -1) {
        path = domain.substring(pathIndex);
        domain = domain.substring(0, pathIndex);
      }

      // Extract query
      const queryIndex = path.indexOf('?');
      if (queryIndex !== -1) {
        query = path.substring(queryIndex + 1);
        path = path.substring(0, queryIndex);
      }

      // Analyze domain
      const domainResult = this.analyzeDomain(domain);
      if (domainResult.isBlocked) {
        return domainResult;
      }

      // Analyze path
      const pathResult = this.analyzeText(decodeURIComponent(path));
      if (pathResult.isBlocked) {
        return {
          ...pathResult,
          reason: `URL path contains ${pathResult.category} content`,
        };
      }

      // Analyze query parameters
      if (query) {
        const queryResult = this.analyzeText(decodeURIComponent(query));
        if (queryResult.isBlocked) {
          return {
            ...queryResult,
            reason: `URL query contains ${queryResult.category} content`,
          };
        }
      }

      return {
        isBlocked: false,
        category: 'safe',
        confidence: 0.7,
        matchedKeywords: [],
        reason: 'URL appears safe',
      };
    } catch (error) {
      // If we can't parse URL, analyze as text
      return this.analyzeText(url);
    }
  }

  /**
   * Get all blocked keywords for VPN service
   */
  static getBlockedKeywords(): string[] {
    return [
      ...ADULT_KEYWORDS,
      ...GAMBLING_KEYWORDS,
      ...ALCOHOL_KEYWORDS,
      ...DRUG_KEYWORDS,
      ...VIOLENCE_KEYWORDS,
      ...DATING_KEYWORDS,
      ...RIBA_KEYWORDS,
    ];
  }

  /**
   * Get blocked domain patterns as strings for VPN service
   */
  static getBlockedDomainPatterns(): string[] {
    return BLOCKED_DOMAIN_PATTERNS.map(p => p.source);
  }

  /**
   * Helper to categorize pattern
   */
  private static categorizePattern(pattern: RegExp): ContentCategory {
    const source = pattern.source.toLowerCase();
    
    if (/porn|xxx|sex|nude|adult|nsfw|hentai|erotic|fetish|cam|escort|strip|xvideos|xnxx|pornhub|redtube|youporn|xhamster|brazzers|onlyfans|chaturbate/i.test(source)) {
      return 'adult';
    }
    if (/casino|poker|bet|gambling|sportsbook|draftkings|fanduel/i.test(source)) {
      return 'gambling';
    }
    if (/tinder|grindr|ashley|dating|hookup/i.test(source)) {
      return 'dating';
    }
    
    return 'adult'; // Default
  }
}

// Export keywords for native module
export const BLOCKED_KEYWORDS = AIContentFilter.getBlockedKeywords();
export const BLOCKED_PATTERNS = AIContentFilter.getBlockedDomainPatterns();
