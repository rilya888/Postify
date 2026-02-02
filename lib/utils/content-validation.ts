/**
 * Content validation and sanitization utilities
 */

/**
 * Validates content length based on platform requirements
 */
export function validateContentLength(content: string, platform: string): { isValid: boolean; message?: string } {
  // Get platform config
  const platformConfigs: Record<string, { min?: number; max: number }> = {
    linkedin: { min: 1200, max: 2500 },
    twitter: { max: 280 },
    email: { min: 500, max: 10000 }, // Assuming max 10k characters for emails
    instagram: { min: 500, max: 2200 },
    facebook: { min: 50, max: 5000 },
    tiktok: { min: 10, max: 150 },
    youtube: { min: 100, max: 5000 },
  };

  const config = platformConfigs[platform];
  if (!config) {
    return { isValid: true }; // Unknown platform, assume valid
  }

  const length = content.length;

  if (config.min !== undefined && length < config.min) {
    return {
      isValid: false,
      message: `Content too short for ${platform}. Minimum ${config.min} characters required.`,
    };
  }

  if (config.max !== undefined && length > config.max) {
    return {
      isValid: false,
      message: `Content too long for ${platform}. Maximum ${config.max} characters allowed.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates platform-specific elements
 */
export function validatePlatformSpecificElements(content: string, platform: string): { isValid: boolean; message?: string } {
  // Check for platform-specific requirements
  switch (platform) {
    case 'linkedin':
      // Check for hashtags (should have 3-5)
      const linkedinHashtags = (content.match(/#[a-zA-Zа-яёА-ЯЁ0-9_]+/g) || []).length;
      if (linkedinHashtags < 3) {
        return {
          isValid: false,
          message: `LinkedIn content should include 3-5 hashtags, found ${linkedinHashtags}.`
        };
      }
      if (linkedinHashtags > 5) {
        return {
          isValid: false,
          message: `LinkedIn content should include 3-5 hashtags, found ${linkedinHashtags}.`
        };
      }

      // Check for professional tone indicators
      const hookPattern = /^(Why|How|What|When|Where|Who|Did you know|Have you ever|Imagine|Consider)/i;
      if (!hookPattern.test(content.trim())) {
        return {
          isValid: false,
          message: "LinkedIn content should start with a hook (question or provocation)."
        };
      }
      break;

    case 'twitter':
      // Check for hashtags (should have 1-3)
      const twitterHashtags = (content.match(/#[a-zA-Zа-яёА-ЯЁ0-9_]+/g) || []).length;
      if (twitterHashtags > 3) {
        return {
          isValid: false,
          message: `Twitter content should include 1-3 hashtags, found ${twitterHashtags}.`
        };
      }

      // Check for mentions
      const mentions = (content.match(/@[a-zA-Z0-9_]+/g) || []).length;
      if (mentions > 10) { // Twitter has a limit on mentions
        return {
          isValid: false,
          message: `Twitter content should include fewer than 10 mentions, found ${mentions}.`
        };
      }
      break;

    case 'email':
      // Check for subject line indicator
      if (!content.includes('\n') && content.length > 50) {
        return {
          isValid: false,
          message: "Email content should include a clear subject line followed by body content."
        };
      }

      // Check for call-to-action indicators
      const ctaPhrases = ['click here', 'sign up', 'learn more', 'register', 'subscribe', 'download', 'get started'];
      const hasCTA = ctaPhrases.some(phrase => content.toLowerCase().includes(phrase));
      if (!hasCTA) {
        return {
          isValid: false,
          message: "Email content should include a clear call-to-action."
        };
      }
      break;

    case 'instagram':
      // Check for hashtags (should have 15-25)
      const instagramHashtags = (content.match(/#[a-zA-Zа-яёА-ЯЁ0-9_]+/g) || []).length;
      if (instagramHashtags < 15) {
        return {
          isValid: false,
          message: `Instagram content should include 15-25 hashtags, found ${instagramHashtags}.`
        };
      }
      if (instagramHashtags > 25) {
        return {
          isValid: false,
          message: `Instagram content should include 15-25 hashtags, found ${instagramHashtags}.`
        };
      }

      // Check for mentions
      const instaMentions = (content.match(/@[a-zA-Z0-9_.]+/g) || []).length;
      if (instaMentions > 20) { // Instagram allows up to 20 mentions per post
        return {
          isValid: false,
          message: `Instagram content should include fewer than 20 mentions, found ${instaMentions}.`
        };
      }
      break;

    case 'facebook':
      // Check for hashtags (should have 1-5)
      const facebookHashtags = (content.match(/#[a-zA-Zа-яёА-ЯЁ0-9_]+/g) || []).length;
      if (facebookHashtags > 5) {
        return {
          isValid: false,
          message: `Facebook content should include 1-5 hashtags, found ${facebookHashtags}.`
        };
      }

      // Check for engagement prompts
      const engagementPhrases = ['comment below', 'share this', 'what do you think', 'tell us', 'let us know', 'drop a comment'];
      const hasEngagement = engagementPhrases.some(phrase => content.toLowerCase().includes(phrase));
      if (!hasEngagement) {
        return {
          isValid: false,
          message: "Facebook content should include an engagement prompt."
        };
      }
      break;

    case 'tiktok':
      // Check for hashtags (should have 3-5 trending)
      const tiktokHashtags = (content.match(/#[a-zA-Zа-яёА-ЯЁ0-9_]+/g) || []).length;
      if (tiktokHashtags < 3) {
        return {
          isValid: false,
          message: `TikTok content should include 3-5 hashtags, found ${tiktokHashtags}.`
        };
      }
      if (tiktokHashtags > 5) {
        return {
          isValid: false,
          message: `TikTok content should include 3-5 hashtags, found ${tiktokHashtags}.`
        };
      }

      // Check for engagement prompts
      const tiktokEngagementPhrases = ['follow for more', 'duet this', 'stitch this', 'comment below', 'double tap'];
      const hasTikTokEngagement = tiktokEngagementPhrases.some(phrase => content.toLowerCase().includes(phrase));
      if (!hasTikTokEngagement) {
        return {
          isValid: false,
          message: "TikTok content should include an engagement prompt."
        };
      }
      break;

    case 'youtube':
      // Check for timestamps indicator
      const hasTimestamps = /\d+:\d+/.test(content) || /timestamps/i.test(content);
      if (!hasTimestamps) {
        return {
          isValid: false,
          message: "YouTube content should include timestamps for better viewer experience."
        };
      }

      // Check for call-to-action indicators
      const youtubeCTAPhrases = ['subscribe', 'like this video', 'hit subscribe', 'comment below', 'share this video'];
      const hasYouTubeCTA = youtubeCTAPhrases.some(phrase => content.toLowerCase().includes(phrase));
      if (!hasYouTubeCTA) {
        return {
          isValid: false,
          message: "YouTube content should include a clear call-to-action."
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validates content quality
 */
export function validateContentQuality(content: string, platform: string): { isValid: boolean; message?: string } {
  // Check for spam indicators
  const spamIndicators = [
    /free\s+money/i,
    /click\s+here\s+now/i,
    /urgent\s+action\s+required/i,
    /congratulations,\s+you\s+won/i,
    /viagra|casino|lottery|singles/i
  ];

  for (const indicator of spamIndicators) {
    if (indicator.test(content)) {
      return {
        isValid: false,
        message: `Content contains potential spam indicators.`
      };
    }
  }

  // Check for excessive punctuation
  const exclamationCount = (content.match(/!/g) || []).length;
  const questionCount = (content.match(/\?/g) || []).length;

  if (platform === 'linkedin' && exclamationCount > 3) {
    return {
      isValid: false,
      message: `LinkedIn content should use fewer than 3 exclamation marks for a professional tone.`
    };
  }

  if (platform === 'twitter' && exclamationCount > 2) {
    return {
      isValid: false,
      message: `Twitter content should use fewer than 2 exclamation marks.`
    };
  }

  // Check for excessive capitalization
  const words = content.split(/\s+/);
  const capitalizedWords = words.filter(word =>
    word.length > 3 && word === word.toUpperCase()
  );

  if (capitalizedWords.length / words.length > 0.3) { // More than 30% capitalized
    return {
      isValid: false,
      message: `Content contains excessive capitalization.`
    };
  }

  return { isValid: true };
}

/**
 * Validates content for different languages
 */
export function validateLanguageSpecificContent(content: string, platform: string): { isValid: boolean; message?: string } {
  // Check for language-specific character counts
  // For languages like Chinese, Japanese, Korean where characters are denser
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const japaneseChars = (content.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const koreanChars = (content.match(/[\uac00-\ud7af]/g) || []).length;

  if (chineseChars > 0 || japaneseChars > 0 || koreanChars > 0) {
    // Adjust validation for dense character languages
    const adjustedLength = content.length * 0.6; // Approximate adjustment

    // Get platform config
    const platformConfigs: Record<string, { min?: number; max: number }> = {
      linkedin: { min: 720, max: 1500 }, // Reduced for dense chars
      twitter: { max: 168 }, // Reduced for dense chars
      email: { min: 300, max: 6000 }, // Reduced for dense chars
      instagram: { min: 300, max: 1320 }, // Reduced for dense chars
      facebook: { min: 30, max: 3000 }, // Reduced for dense chars
      tiktok: { min: 6, max: 90 }, // Reduced for dense chars
      youtube: { min: 60, max: 3000 }, // Reduced for dense chars
    };

    const config = platformConfigs[platform];
    if (config) {
      if (config.min !== undefined && adjustedLength < config.min) {
        return {
          isValid: false,
          message: `Content too short for ${platform} in dense character languages. Minimum approximately ${config.min} characters required.`,
        };
      }

      if (config.max !== undefined && adjustedLength > config.max) {
        return {
          isValid: false,
          message: `Content too long for ${platform} in dense character languages. Maximum approximately ${config.max} characters allowed.`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes content to remove potentially harmful elements
 */
export function sanitizeContent(content: string): string {
  // Remove potentially dangerous script tags and attributes
  const sanitized = content
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: hrefs
    .replace(/href\s*=\s*["']javascript:/gi, 'href="#"')
    .replace(/href\s*=\s*["']vbscript:/gi, 'href="#"')
    // Remove on-event handlers
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}

/**
 * Validates that content doesn't contain prohibited elements
 */
export function validateContentSafety(content: string): { isValid: boolean; message?: string } {
  // Check for prohibited patterns
  const prohibitedPatterns = [
    /<script\b/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        message: "Content contains prohibited elements for security reasons.",
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates content for a specific platform
 */
export function validatePlatformContent(content: string, platform: string): { isValid: boolean; messages: string[] } {
  const messages: string[] = [];
  let isValid = true;

  // Length validation
  const lengthValidation = validateContentLength(content, platform);
  if (!lengthValidation.isValid && lengthValidation.message) {
    messages.push(lengthValidation.message);
    isValid = false;
  }

  // Platform-specific elements validation
  const elementsValidation = validatePlatformSpecificElements(content, platform);
  if (!elementsValidation.isValid && elementsValidation.message) {
    messages.push(elementsValidation.message);
    isValid = false;
  }

  // Content quality validation
  const qualityValidation = validateContentQuality(content, platform);
  if (!qualityValidation.isValid && qualityValidation.message) {
    messages.push(qualityValidation.message);
    isValid = false;
  }

  // Language-specific validation
  const languageValidation = validateLanguageSpecificContent(content, platform);
  if (!languageValidation.isValid && languageValidation.message) {
    messages.push(languageValidation.message);
    isValid = false;
  }

  // Safety validation
  const safetyValidation = validateContentSafety(content);
  if (!safetyValidation.isValid && safetyValidation.message) {
    messages.push(safetyValidation.message);
    isValid = false;
  }

  return { isValid, messages };
}