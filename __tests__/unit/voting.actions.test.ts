import {
  submitVote,
  getPollResults,
  hasUserVoted,
} from '@/lib/actions/voting.actions';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('next/headers');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(),
  })),
};

const mockHeaders = {
  get: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(headers as jest.Mock).mockResolvedValue(mockHeaders);

describe('Voting Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock headers
    mockHeaders.get.mockImplementation((header) => {
      const headerMap = {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 (Test Browser)',
      };
      return headerMap[header] || null;
    });
  });

  describe('submitVote', () => {
    const mockVoteData = {
      pollId: 'poll123',
      optionIds: ['option1', 'option2'],
    };

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
    };

    const mockActivePoll = {
      id: 'poll123',
      is_active: true,
      expires_at: null,
      require_auth: false,
      allow_multiple_votes: true,
    };

    it('should submit vote successfully for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock poll fetch
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockActivePoll,
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === 'votes') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // No existing vote
                }),
              })),
            })),
            insert: jest.fn().mockResolvedValue({
              data: [{ id: 'vote1' }, { id: 'vote2' }],
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await submitVote(mockVoteData);

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith(`/polls/${mockVoteData.pollId}`);
    });

    it('should submit vote successfully for anonymous user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock poll fetch
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockActivePoll,
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === 'votes') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // No existing vote
                }),
              })),
            })),
            insert: jest.fn().mockResolvedValue({
              data: [{ id: 'vote1' }],
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await submitVote(mockVoteData);

      expect(result.success).toBe(true);
    });

    it('should throw error when poll not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Poll not found' },
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow('Poll not found');
    });

    it('should throw error when poll is not active', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockActivePoll, is_active: false },
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow('This poll is not active');
    });

    it('should throw error when poll has expired', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const expiredDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockActivePoll, expires_at: expiredDate },
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow('This poll has expired');
    });

    it('should throw error when authentication required but user not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockActivePoll, require_auth: true },
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow(
        'Authentication required to vote on this poll'
      );
    });

    it('should throw error when user has already voted on single-vote poll', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockActivePoll, allow_multiple_votes: false },
            error: null,
          }),
        })),
      };

      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'existing-vote' },
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow(
        'You have already voted on this poll'
      );
    });

    it('should throw error when anonymous user has already voted on single-vote poll', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockActivePoll, allow_multiple_votes: false },
            error: null,
          }),
        })),
      };

      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'existing-vote' },
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow(
        'You have already voted on this poll'
      );
    });

    it('should handle vote insertion failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockActivePoll,
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === 'votes') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              })),
            })),
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          };
        }
        return {};
      });

      await expect(submitVote(mockVoteData)).rejects.toThrow('Failed to submit vote');
    });

    it('should extract client info from headers correctly', async () => {
      mockHeaders.get.mockImplementation((header) => {
        const headerMap = {
          'x-forwarded-for': '10.0.0.1, 192.168.1.1',
          'user-agent': 'Custom Test Agent',
        };
        return headerMap[header] || null;
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockActivePoll,
            error: null,
          }),
        })),
      };

      const insertSpy = jest.fn().mockResolvedValue({
        data: [{ id: 'vote1' }],
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === 'votes') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              })),
            })),
            insert: insertSpy,
          };
        }
        return {};
      });

      await submitVote({ pollId: 'poll123', optionIds: ['option1'] });

      expect(insertSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ip_address: '10.0.0.1', // First IP from forwarded-for
            user_agent: 'Custom Test Agent',
          }),
        ])
      );
    });
  });

  describe('getPollResults', () => {
    const mockPollResults = {
      id: 'poll123',
      title: 'Test Poll',
      total_votes: 10,
      poll_options: [
        { id: 'option1', text: 'Option 1', votes: 6 },
        { id: 'option2', text: 'Option 2', votes: 4 },
      ],
    };

    it('should fetch poll results successfully', async () => {
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollResults,
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      const result = await getPollResults('poll123');

      expect(result.poll).toEqual(mockPollResults);
      expect(result.totalVotes).toBe(10);
      expect(result.options).toEqual(mockPollResults.poll_options);
    });

    it('should throw error when poll not found', async () => {
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Poll not found' },
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      await expect(getPollResults('nonexistent')).rejects.toThrow('Poll not found');
    });
  });

  describe('hasUserVoted', () => {
    it('should return true when authenticated user has voted', async () => {
      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'vote123' },
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      const result = await hasUserVoted('poll123', 'user123');

      expect(result.hasVoted).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should return false when authenticated user has not voted', async () => {
      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // No rows found
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      const result = await hasUserVoted('poll123', 'user123');

      expect(result.hasVoted).toBe(false);
      expect(result.error).toBe(null);
    });

    it('should return true when anonymous user (by IP) has voted', async () => {
      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'vote123' },
            error: null,
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      const result = await hasUserVoted('poll123', undefined, '192.168.1.1');

      expect(result.hasVoted).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should return false when anonymous user (by IP) has not voted', async () => {
      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      const result = await hasUserVoted('poll123', undefined, '192.168.1.1');

      expect(result.hasVoted).toBe(false);
      expect(result.error).toBe(null);
    });

    it('should return false when no userId or ipAddress provided', async () => {
      const result = await hasUserVoted('poll123');

      expect(result.hasVoted).toBe(false);
      expect(result.error).toBe(null);
    });

    it('should handle database errors gracefully', async () => {
      const voteQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        })),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'votes') {
          return {
            select: jest.fn(() => voteQuery),
          };
        }
        return {};
      });

      const result = await hasUserVoted('poll123', 'user123');

      expect(result.hasVoted).toBe(false);
      expect(result.error).toBe(null);
    });
  });
});
