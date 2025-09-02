import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((name) => {
      const mockHeaders = {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Mozilla/5.0 (Test Browser)',
      }
      return mockHeaders[name] || null
    }),
  })),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(),
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
      })),
    })),
    rpc: jest.fn(),
  })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

// Global test helpers
global.mockSupabaseResponse = (data, error = null) => ({
  data,
  error,
})

global.mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    username: 'testuser',
  },
}

global.mockPoll = {
  id: 'test-poll-id',
  title: 'Test Poll',
  description: 'A test poll',
  creator_id: 'test-user-id',
  is_active: true,
  allow_multiple_votes: false,
  require_auth: false,
  expires_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  total_votes: 0,
  poll_options: [
    { id: 'option-1', text: 'Option 1', votes: 0 },
    { id: 'option-2', text: 'Option 2', votes: 0 },
  ],
}

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
