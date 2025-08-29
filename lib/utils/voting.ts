import { createHash } from 'crypto';

/**
 * Generate a unique fingerprint for a voter to prevent duplicate votes
 * Combines multiple factors to create a reasonably unique identifier
 * while maintaining some level of anonymity
 */
export function generateVoterFingerprint({
  ipAddress,
  userAgent,
  userId,
  pollId,
  timestamp = Date.now(),
}: {
  ipAddress: string;
  userAgent: string;
  userId?: string;
  pollId: string;
  timestamp?: number;
}): string {
  // Create a hash based on multiple factors
  const components = [
    ipAddress,
    userAgent,
    userId || 'anonymous',
    pollId,
    // Add date to allow one vote per day if needed
    Math.floor(timestamp / (1000 * 60 * 60 * 24)).toString(),
  ];

  const combined = components.join('|');

  // Use SHA-256 to create a consistent hash
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Enhanced fingerprinting with browser-based factors
 * This should be used on the client side to gather more data
 */
export function generateClientFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.platform,
    navigator.cookieEnabled.toString(),
  ];

  return createHash('sha256').update(factors.join('|')).digest('hex');
}

/**
 * Validate if a vote is allowed based on poll settings
 */
export function validateVotePermissions({
  poll,
  userId,
  existingVotes,
}: {
  poll: {
    is_active: boolean;
    expires_at?: string | null;
    require_auth: boolean;
    allow_multiple_votes: boolean;
  };
  userId?: string;
  existingVotes: Array<{ option_id: string }>;
}): { allowed: boolean; reason?: string } {
  // Check if poll is active
  if (!poll.is_active) {
    return { allowed: false, reason: 'Poll is not active' };
  }

  // Check if poll has expired
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return { allowed: false, reason: 'Poll has expired' };
  }

  // Check authentication requirement
  if (poll.require_auth && !userId) {
    return { allowed: false, reason: 'Authentication required to vote' };
  }

  // Check multiple votes policy
  if (!poll.allow_multiple_votes && existingVotes.length > 0) {
    return { allowed: false, reason: 'You have already voted on this poll' };
  }

  return { allowed: true };
}

/**
 * Rate limiting utility to prevent spam voting
 */
export class VoteRateLimiter {
  private static attempts: Map<string, number[]> = new Map();

  static isAllowed(fingerprint: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(fingerprint) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(fingerprint, recentAttempts);

    return true;
  }

  static reset(fingerprint: string): void {
    this.attempts.delete(fingerprint);
  }
}

/**
 * Sanitize vote data before storing
 */
export function sanitizeVoteData(data: {
  pollId: string;
  optionId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
}) {
  return {
    poll_id: data.pollId,
    option_id: data.optionId,
    user_id: data.userId || null,
    ip_address: data.ipAddress,
    user_agent: data.userAgent.slice(0, 500), // Limit user agent length
    voter_fingerprint: generateVoterFingerprint({
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      userId: data.userId,
      pollId: data.pollId,
    }),
  };
}

/**
 * Validate vote payload
 */
export function validateVotePayload(payload: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload.pollId || typeof payload.pollId !== 'string') {
    errors.push('Valid poll ID is required');
  }

  if (!payload.optionId || typeof payload.optionId !== 'string') {
    errors.push('Valid option ID is required');
  }

  if (!payload.optionIds || !Array.isArray(payload.optionIds) || payload.optionIds.length === 0) {
    errors.push('At least one option must be selected');
  }

  if (payload.optionIds && payload.optionIds.length > 10) {
    errors.push('Too many options selected');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate anonymous voter ID for tracking without identification
 */
export function generateAnonymousVoterId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2);
  return `anon_${timestamp}_${randomPart}`;
}

/**
 * Check if two fingerprints are similar (for detecting circumvention attempts)
 */
export function areFingerprintsSimilar(fp1: string, fp2: string, threshold = 0.8): boolean {
  if (fp1 === fp2) return true;

  // Simple similarity check based on common characters
  const common = [...fp1].filter(char => fp2.includes(char)).length;
  const similarity = common / Math.max(fp1.length, fp2.length);

  return similarity >= threshold;
}

/**
 * Extract safe client info from headers
 */
export function extractClientInfo(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const userAgent = headers.get('user-agent') || 'unknown';

  // Get the real IP address, considering proxies
  const ipAddress = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : realIp || 'unknown';

  return {
    ipAddress,
    userAgent,
  };
}
