/**
 * Media URL Validation Utility
 *
 * Validates and sanitizes media URLs to prevent XSS and security vulnerabilities.
 */

/**
 * Allowed URL protocols for media
 */
const ALLOWED_PROTOCOLS = ["http:", "https:", "data:"];

/**
 * Allowed domains for media hosting (add your trusted domains here)
 * In production, you should restrict this to your own domain/CDN
 */
const ALLOWED_DOMAINS = [
  "kubi.com",
  "api.kubi.com",
  "cdn.kubi.com",
  "storage.googleapis.com",
  "s3.amazonaws.com",
  "cloudinary.com",
  "imgur.com", // Common image hosting
];

/**
 * Check if URL is safe
 * @param url - URL to validate
 * @returns true if safe, false otherwise
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }

    // For data: URLs, additional validation
    if (parsedUrl.protocol === "data:") {
      // Only allow image data URLs
      const mimeType = url.substring(5, url.indexOf(";") || url.indexOf(","));
      if (!mimeType.startsWith("image/")) {
        return false;
      }
      return true;
    }

    // Check domain (optional - remove if you want to allow any domain)
    // For now, we'll allow any HTTPS domain for flexibility
    // In production, you should restrict to your trusted domains
    if (parsedUrl.protocol === "https:") {
      return true;
    }

    // For HTTP, check if it's in allowed domains
    if (parsedUrl.protocol === "http:") {
      return ALLOWED_DOMAINS.some((domain) =>
        parsedUrl.hostname.endsWith(domain)
      );
    }

    return false;
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitize media URL - return safe URL or empty string
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeMediaUrl(url: string | undefined | null): string {
  if (!url) return "";

  if (isValidMediaUrl(url)) {
    return url;
  }

  // Return empty string if invalid
  console.warn(`[Media Validation] Invalid media URL: ${url}`);
  return "";
}

/**
 * Validate YouTube URL
 * @param url - URL to validate
 * @returns YouTube video ID or null if invalid
 */
export function validateYouTubeUrl(url: string): string | null {
  if (!url) return null;

  // YouTube ID regex pattern
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  // Return ID if valid (should be 11 characters)
  return match && match[2].length === 11 ? match[2] : null;
}
