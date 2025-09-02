/**
 * Test helper utilities for the Polling App test suite
 */

import { createClient } from '@/lib/supabase/server';
import type { Poll, PollOption, Vote, User } from '@/types';

// Mock data generators
export const generateMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const generateMockPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 'poll-123',
  title: 'Test Poll',
  description: 'A test poll for testing purposes',
  creatorId: 'user-123',
  isActive: true,
  allowMultipleVotes: false,
  requireAuth: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  totalVotes: 0,
  category: 'general',
  tags: ['test'],
  options: [
    { id: 'option-1', text: 'Option 1', votes: 0, pollId: 'poll-123' },
    { id: 'option-2', text: 'Option 2', votes: 0, pollId: 'poll-123' },
  ],
  ...overrides,
});

export const generateMockPollOption = (overrides: Partial<PollOption> = {}): PollOption => ({
  id: 'option-123',
  text: 'Test Option',
  votes: 0,
  pollId: 'poll-123',
  ...overrides,
});

export const generateMockVote = (overrides: Partial<Vote> = {}): Vote => ({
  id: 'vote-123',
  pollId: 'poll-123',
  optionId: 'option-123',
  userId: 'user-123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

// Supabase mock helpers
export const createMockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(),
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
    })),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
      })),
    },
  };

  (createClient as jest.Mock).mockReturnValue(mockClient);
  return mockClient;
};

// Database response helpers
export const mockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
});

export const mockSupabaseAuthResponse = (user: any = null, session: any = null, error: any = null) => ({
  data: { user, session },
  error,
});

// Query builder helpers
export const createMockQueryBuilder = (mockData: any, mockError: any = null) => {
  const queryBuilder = {
    select: jest.fn(() => queryBuilder),
    insert: jest.fn(() => queryBuilder),
    update: jest.fn(() => queryBuilder),
    delete: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    neq: jest.fn(() => queryBuilder),
    gt: jest.fn(() => queryBuilder),
    gte: jest.fn(() => queryBuilder),
    lt: jest.fn(() => queryBuilder),
    lte: jest.fn(() => queryBuilder),
    like: jest.fn(() => queryBuilder),
    ilike: jest.fn(() => queryBuilder),
    is: jest.fn(() => queryBuilder),
    in: jest.fn(() => queryBuilder),
    contains: jest.fn(() => queryBuilder),
    order: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    range: jest.fn(() => queryBuilder),
    single: jest.fn().mockResolvedValue(mockSupabaseResponse(mockData, mockError)),
    maybeSingle: jest.fn().mockResolvedValue(mockSupabaseResponse(mockData, mockError)),
    then: jest.fn((callback) => callback(mockSupabaseResponse(mockData, mockError))),
  };

  // Make the query builder thenable so it can be awaited
  queryBuilder.then = jest.fn((resolve) =>
    Promise.resolve(mockSupabaseResponse(mockData, mockError)).then(resolve)
  );

  return queryBuilder;
};

// API request helpers
export const createMockRequest = (
  body: any = {},
  method: string = 'POST',
  headers: Record<string, string> = {}
) => {
  const mockHeaders = new Headers({
    'content-type': 'application/json',
    'x-forwarded-for': '192.168.1.1',
    'user-agent': 'Test User Agent',
    ...headers,
  });

  return {
    method,
    json: jest.fn().mockResolvedValue(body),
    headers: mockHeaders,
    url: 'http://localhost:3000/api/test',
    nextUrl: new URL('http://localhost:3000/api/test'),
  };
};

export const createMockResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
};

// Form data helpers
export const createMockFormData = (data: Record<string, string | File>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Date helpers
export const createMockDate = (dateString: string = '2024-01-01T00:00:00Z') => {
  return new Date(dateString);
};

export const getExpiredDate = () => {
  return new Date(Date.now() - 86400000).toISOString(); // Yesterday
};

export const getFutureDate = () => {
  return new Date(Date.now() + 86400000).toISOString(); // Tomorrow
};

// Validation helpers
export const expectValidationError = (result: any, expectedError: string) => {
  expect(result.valid).toBe(false);
  expect(result.errors).toContain(expectedError);
};

export const expectValidationSuccess = (result: any) => {
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
};

// Async helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Error simulation helpers
export const simulateNetworkError = () => ({
  data: null,
  error: { message: 'Network error', code: 'NETWORK_ERROR' },
});

export const simulateTimeoutError = () => ({
  data: null,
  error: { message: 'Request timeout', code: 'TIMEOUT' },
});

export const simulatePermissionError = () => ({
  data: null,
  error: { message: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
});

export const simulateNotFoundError = () => ({
  data: null,
  error: { message: 'Resource not found', code: 'NOT_FOUND' },
});

// Test environment helpers
export const setupTestEnvironment = () => {
  // Set up environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

  // Mock console methods to reduce noise in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
};

export const cleanupTestEnvironment = () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
};

// Snapshot helpers
export const createPollSnapshot = (poll: Poll) => ({
  id: poll.id,
  title: poll.title,
  isActive: poll.isActive,
  optionCount: poll.options.length,
  totalVotes: poll.totalVotes,
  createdAt: expect.any(Date),
});

export const createVoteSnapshot = (vote: Vote) => ({
  id: vote.id,
  pollId: vote.pollId,
  optionId: vote.optionId,
  userId: vote.userId,
  createdAt: expect.any(Date),
});

// Custom matchers
export const expectToBeValidUUID = (value: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
};

export const expectToBeValidEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(value).toMatch(emailRegex);
};

export const expectToBeRecentDate = (value: Date | string, withinMs: number = 5000) => {
  const date = new Date(value);
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime());
  expect(diff).toBeLessThan(withinMs);
};

// Performance testing helpers
export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

export const expectExecutionTimeUnder = async <T>(
  fn: () => Promise<T>,
  maxMs: number
): Promise<T> => {
  const { result, duration } = await measureExecutionTime(fn);
  expect(duration).toBeLessThan(maxMs);
  return result;
};

// Rate limiting helpers
export const simulateRateLimitHit = (fingerprint: string) => {
  const { VoteRateLimiter } = require('@/lib/utils/voting');
  VoteRateLimiter.isAllowed = jest.fn().mockImplementation((fp) => fp !== fingerprint);
};

export const resetRateLimiter = () => {
  const { VoteRateLimiter } = require('@/lib/utils/voting');
  VoteRateLimiter.isAllowed = jest.fn(() => true);
  VoteRateLimiter.reset = jest.fn();
};

// Database transaction helpers
export const mockDatabaseTransaction = (operations: Array<() => Promise<any>>) => {
  return Promise.all(operations.map(op => op()));
};

export const simulateTransactionRollback = () => {
  throw new Error('Transaction rolled back');
};

// Component testing helpers
export const createMockProps = <T>(overrides: Partial<T> = {}): T => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onChange: jest.fn(),
    onClick: jest.fn(),
    onError: jest.fn(),
    onSuccess: jest.fn(),
  };

  return { ...defaultProps, ...overrides } as T;
};

// Export all helpers as default for easier importing
export default {
  generateMockUser,
  generateMockPoll,
  generateMockPollOption,
  generateMockVote,
  createMockSupabaseClient,
  mockSupabaseResponse,
  mockSupabaseAuthResponse,
  createMockQueryBuilder,
  createMockRequest,
  createMockResponse,
  createMockFormData,
  createMockDate,
  getExpiredDate,
  getFutureDate,
  expectValidationError,
  expectValidationSuccess,
  waitFor,
  flushPromises,
  simulateNetworkError,
  simulateTimeoutError,
  simulatePermissionError,
  simulateNotFoundError,
  setupTestEnvironment,
  cleanupTestEnvironment,
  createPollSnapshot,
  createVoteSnapshot,
  expectToBeValidUUID,
  expectToBeValidEmail,
  expectToBeRecentDate,
  measureExecutionTime,
  expectExecutionTimeUnder,
  simulateRateLimitHit,
  resetRateLimiter,
  mockDatabaseTransaction,
  simulateTransactionRollback,
  createMockProps,
};
