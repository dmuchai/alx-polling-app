import {
  generateVoterFingerprint,
  validateVotePermissions,
  VoteRateLimiter,
  sanitizeVoteData,
  validateVotePayload,
  generateAnonymousVoterId,
  areFingerprintsSimilar,
  extractClientInfo,
} from '@/lib/utils/voting';

describe('Voting Utilities', () => {
  beforeEach(() => {
    // Clear rate limiter state between tests
    VoteRateLimiter.reset('test-fingerprint');
  });

  describe('generateVoterFingerprint', () => {
    it('should generate a consistent fingerprint for same inputs', () => {
      const params = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userId: 'user123',
        pollId: 'poll123',
        timestamp: 1640995200000, // Fixed timestamp
      };

      const fingerprint1 = generateVoterFingerprint(params);
      const fingerprint2 = generateVoterFingerprint(params);

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // SHA-256 hash length
    });

    it('should generate different fingerprints for different users', () => {
      const baseParams = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        pollId: 'poll123',
        timestamp: 1640995200000,
      };

      const fingerprint1 = generateVoterFingerprint({
        ...baseParams,
        userId: 'user1',
      });

      const fingerprint2 = generateVoterFingerprint({
        ...baseParams,
        userId: 'user2',
      });

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should handle anonymous users consistently', () => {
      const params = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        pollId: 'poll123',
        timestamp: 1640995200000,
      };

      const fingerprint1 = generateVoterFingerprint(params);
      const fingerprint2 = generateVoterFingerprint({
        ...params,
        userId: undefined,
      });

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different days', () => {
      const baseParams = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userId: 'user123',
        pollId: 'poll123',
      };

      const day1 = generateVoterFingerprint({
        ...baseParams,
        timestamp: 1640995200000, // Jan 1, 2022
      });

      const day2 = generateVoterFingerprint({
        ...baseParams,
        timestamp: 1641081600000, // Jan 2, 2022
      });

      expect(day1).not.toBe(day2);
    });
  });

  describe('validateVotePermissions', () => {
    const mockPoll = {
      is_active: true,
      expires_at: null,
      require_auth: false,
      allow_multiple_votes: false,
    };

    it('should allow voting on active poll with no restrictions', () => {
      const result = validateVotePermissions({
        poll: mockPoll,
        userId: 'user123',
        existingVotes: [],
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject voting on inactive poll', () => {
      const result = validateVotePermissions({
        poll: { ...mockPoll, is_active: false },
        userId: 'user123',
        existingVotes: [],
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Poll is not active');
    });

    it('should reject voting on expired poll', () => {
      const expiredDate = new Date(Date.now() - 1000).toISOString();
      const result = validateVotePermissions({
        poll: { ...mockPoll, expires_at: expiredDate },
        userId: 'user123',
        existingVotes: [],
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Poll has expired');
    });

    it('should allow voting on poll that expires in future', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // +1 day
      const result = validateVotePermissions({
        poll: { ...mockPoll, expires_at: futureDate },
        userId: 'user123',
        existingVotes: [],
      });

      expect(result.allowed).toBe(true);
    });

    it('should reject anonymous voting when auth is required', () => {
      const result = validateVotePermissions({
        poll: { ...mockPoll, require_auth: true },
        userId: undefined,
        existingVotes: [],
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Authentication required to vote');
    });

    it('should allow authenticated voting when auth is required', () => {
      const result = validateVotePermissions({
        poll: { ...mockPoll, require_auth: true },
        userId: 'user123',
        existingVotes: [],
      });

      expect(result.allowed).toBe(true);
    });

    it('should reject duplicate voting when multiple votes not allowed', () => {
      const result = validateVotePermissions({
        poll: mockPoll,
        userId: 'user123',
        existingVotes: [{ option_id: 'option1' }],
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('You have already voted on this poll');
    });

    it('should allow multiple voting when enabled', () => {
      const result = validateVotePermissions({
        poll: { ...mockPoll, allow_multiple_votes: true },
        userId: 'user123',
        existingVotes: [{ option_id: 'option1' }],
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('VoteRateLimiter', () => {
    it('should allow voting within rate limits', () => {
      const fingerprint = 'test-fingerprint-1';

      expect(VoteRateLimiter.isAllowed(fingerprint)).toBe(true);
      expect(VoteRateLimiter.isAllowed(fingerprint)).toBe(true);
    });

    it('should block voting after exceeding rate limits', () => {
      const fingerprint = 'test-fingerprint-2';
      const maxAttempts = 3;

      // Make allowed attempts
      for (let i = 0; i < maxAttempts; i++) {
        expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, 60000)).toBe(true);
      }

      // Next attempt should be blocked
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, 60000)).toBe(false);
    });

    it('should reset rate limits after time window', () => {
      const fingerprint = 'test-fingerprint-3';
      const maxAttempts = 2;
      const windowMs = 100; // 100ms window

      // Exhaust rate limit
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, windowMs)).toBe(true);
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, windowMs)).toBe(true);
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, windowMs)).toBe(false);

      // Wait for window to pass
      return new Promise(resolve => {
        setTimeout(() => {
          expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, windowMs)).toBe(true);
          resolve(undefined);
        }, windowMs + 10);
      });
    });

    it('should reset rate limits manually', () => {
      const fingerprint = 'test-fingerprint-4';
      const maxAttempts = 1;

      // Exhaust rate limit
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, 60000)).toBe(true);
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, 60000)).toBe(false);

      // Reset and try again
      VoteRateLimiter.reset(fingerprint);
      expect(VoteRateLimiter.isAllowed(fingerprint, maxAttempts, 60000)).toBe(true);
    });
  });

  describe('sanitizeVoteData', () => {
    it('should sanitize vote data correctly', () => {
      const inputData = {
        pollId: 'poll123',
        optionId: 'option456',
        userId: 'user789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };

      const sanitized = sanitizeVoteData(inputData);

      expect(sanitized.poll_id).toBe('poll123');
      expect(sanitized.option_id).toBe('option456');
      expect(sanitized.user_id).toBe('user789');
      expect(sanitized.ip_address).toBe('192.168.1.1');
      expect(sanitized.user_agent).toBe(inputData.userAgent);
      expect(sanitized.voter_fingerprint).toBeDefined();
      expect(typeof sanitized.voter_fingerprint).toBe('string');
    });

    it('should handle null userId', () => {
      const inputData = {
        pollId: 'poll123',
        optionId: 'option456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const sanitized = sanitizeVoteData(inputData);

      expect(sanitized.user_id).toBe(null);
      expect(sanitized.voter_fingerprint).toBeDefined();
    });

    it('should truncate long user agent strings', () => {
      const longUserAgent = 'A'.repeat(600); // 600 characters
      const inputData = {
        pollId: 'poll123',
        optionId: 'option456',
        userId: 'user789',
        ipAddress: '192.168.1.1',
        userAgent: longUserAgent,
      };

      const sanitized = sanitizeVoteData(inputData);

      expect(sanitized.user_agent).toHaveLength(500);
      expect(sanitized.user_agent).toBe('A'.repeat(500));
    });
  });

  describe('validateVotePayload', () => {
    it('should validate correct payload', () => {
      const payload = {
        pollId: 'poll123',
        optionId: 'option456',
        optionIds: ['option456'],
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject payload without pollId', () => {
      const payload = {
        optionId: 'option456',
        optionIds: ['option456'],
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid poll ID is required');
    });

    it('should reject payload without optionId', () => {
      const payload = {
        pollId: 'poll123',
        optionIds: ['option456'],
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid option ID is required');
    });

    it('should reject payload without optionIds', () => {
      const payload = {
        pollId: 'poll123',
        optionId: 'option456',
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one option must be selected');
    });

    it('should reject payload with empty optionIds array', () => {
      const payload = {
        pollId: 'poll123',
        optionId: 'option456',
        optionIds: [],
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one option must be selected');
    });

    it('should reject payload with too many options', () => {
      const payload = {
        pollId: 'poll123',
        optionId: 'option456',
        optionIds: Array.from({ length: 11 }, (_, i) => `option${i}`),
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Too many options selected');
    });

    it('should reject payload with invalid data types', () => {
      const payload = {
        pollId: 123, // should be string
        optionId: null, // should be string
        optionIds: 'not-array', // should be array
      };

      const result = validateVotePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generateAnonymousVoterId', () => {
    it('should generate unique anonymous voter IDs', () => {
      const id1 = generateAnonymousVoterId();
      const id2 = generateAnonymousVoterId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^anon_[a-z0-9]+_[a-z0-9]+$/);
      expect(id2).toMatch(/^anon_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should generate IDs with correct prefix', () => {
      const id = generateAnonymousVoterId();
      expect(id).toMatch(/^anon_/);
    });
  });

  describe('areFingerprintsSimilar', () => {
    it('should return true for identical fingerprints', () => {
      const fp = 'abc123def456';
      expect(areFingerprintsSimilar(fp, fp)).toBe(true);
    });

    it('should return true for similar fingerprints above threshold', () => {
      const fp1 = 'abcdef123456';
      const fp2 = 'abcdef123789'; // 75% similar
      expect(areFingerprintsSimilar(fp1, fp2, 0.7)).toBe(true);
    });

    it('should return false for dissimilar fingerprints below threshold', () => {
      const fp1 = 'abcdef123456';
      const fp2 = 'xyz789uvw012'; // Very different
      expect(areFingerprintsSimilar(fp1, fp2, 0.8)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(areFingerprintsSimilar('', '')).toBe(true);
      expect(areFingerprintsSimilar('abc', '')).toBe(false);
      expect(areFingerprintsSimilar('', 'abc')).toBe(false);
    });
  });

  describe('extractClientInfo', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockHeaders = new Headers();
      mockHeaders.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
      mockHeaders.set('user-agent', 'Test Browser');

      const { ipAddress, userAgent } = extractClientInfo(mockHeaders);

      expect(ipAddress).toBe('192.168.1.1');
      expect(userAgent).toBe('Test Browser');
    });

    it('should extract IP from x-real-ip when forwarded-for not available', () => {
      const mockHeaders = new Headers();
      mockHeaders.set('x-real-ip', '192.168.1.2');
      mockHeaders.set('user-agent', 'Test Browser');

      const { ipAddress, userAgent } = extractClientInfo(mockHeaders);

      expect(ipAddress).toBe('192.168.1.2');
      expect(userAgent).toBe('Test Browser');
    });

    it('should return unknown for missing headers', () => {
      const mockHeaders = new Headers();

      const { ipAddress, userAgent } = extractClientInfo(mockHeaders);

      expect(ipAddress).toBe('unknown');
      expect(userAgent).toBe('unknown');
    });

    it('should handle multiple IPs in forwarded-for header', () => {
      const mockHeaders = new Headers();
      mockHeaders.set('x-forwarded-for', '  192.168.1.1  ,  10.0.0.1  ,  172.16.0.1  ');

      const { ipAddress } = extractClientInfo(mockHeaders);

      expect(ipAddress).toBe('192.168.1.1');
    });
  });
});
