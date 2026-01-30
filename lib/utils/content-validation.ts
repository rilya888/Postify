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

  // Safety validation
  const safetyValidation = validateContentSafety(content);
  if (!safetyValidation.isValid && safetyValidation.message) {
    messages.push(safetyValidation.message);
    isValid = false;
  }

  return { isValid, messages };
}