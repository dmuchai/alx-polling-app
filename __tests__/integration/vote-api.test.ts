import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/polls/[id]/vote/route";
import { createClient } from "@/lib/supabase/server";

// Mock Next.js Request/Response objects
global.Request = jest.fn().mockImplementation((url, options = {}) => ({
  url,
  method: options.method || "GET",
  headers: new Headers(options.headers || {}),
  json: jest.fn().mockResolvedValue({}),
  ...options,
}));

global.Response = jest.fn().mockImplementation((body, options = {}) => ({
  body,
  status: options.status || 200,
  headers: new Headers(options.headers || {}),
  json: jest.fn().mockResolvedValue(JSON.parse(body || "{}")),
  ...options,
}));

// Mock fetch for Next.js
global.fetch = jest.fn();

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/utils/voting", () => ({
  generateVoterFingerprint: jest.fn(() => "mock-fingerprint-123"),
  validateVotePermissions: jest.fn(() => ({ allowed: true })),
  VoteRateLimiter: {
    isAllowed: jest.fn(() => true),
    reset: jest.fn(),
  },
  sanitizeVoteData: jest.fn((data) => ({
    poll_id: data.pollId,
    option_id: data.optionId,
    user_id: data.userId || null,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    voter_fingerprint: "mock-fingerprint-123",
  })),
  validateVotePayload: jest.fn(() => ({ valid: true, errors: [] })),
  extractClientInfo: jest.fn(() => ({
    ipAddress: "192.168.1.1",
    userAgent: "Test User Agent",
  })),
}));

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  rpc: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe("Vote API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/polls/[id]/vote", () => {
    const mockPollWithOptions = {
      id: "poll123",
      title: "Test Poll",
      is_active: true,
      expires_at: null,
      require_auth: false,
      allow_multiple_votes: false,
      poll_options: [
        { id: "option1", text: "Option 1", position: 1 },
        { id: "option2", text: "Option 2", position: 2 },
      ],
    };

    const createMockRequest = (
      body: any,
      headers: Record<string, string> = {},
    ) => {
      const mockHeaders = new Headers({
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Test User Agent",
        ...headers,
      });

      return {
        json: jest.fn().mockResolvedValue(body),
        headers: mockHeaders,
      } as unknown as NextRequest;
    };

    it("should successfully record a vote for authenticated user", async () => {
      const request = createMockRequest({
        optionIds: ["option1"],
      });

      const params = { params: { id: "poll123" } };

      // Mock session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: "user123", email: "test@example.com" },
          },
        },
      });

      // Mock poll fetch
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithOptions,
            error: null,
          }),
        })),
      };

      // Mock existing votes check
      const votesQuery = {
        eq: jest.fn(() => mockVotesQuery),
      };
      const mockVotesQuery = {
        select: jest
          .fn(() => votesQuery)
          .mockResolvedValue({
            data: [],
            error: null,
          }),
      };

      // Mock vote insertion
      const insertVotes = {
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "vote1", option_id: "option1" }],
            error: null,
          }),
        })),
      };

      // Mock RPC call for results
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { option_id: "option1", vote_count: 1 },
          { option_id: "option2", vote_count: 0 },
        ],
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === "votes") {
          return {
            ...mockVotesQuery,
            ...insertVotes,
          };
        }
        if (table === "poll_analytics") {
          return {
            insert: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Vote recorded successfully");
      expect(responseData.data.voteCount).toBe(1);
    });

    it("should successfully record a vote for anonymous user", async () => {
      const request = createMockRequest({
        optionIds: ["option2"],
      });

      const params = { params: { id: "poll123" } };

      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      // Mock poll fetch
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithOptions,
            error: null,
          }),
        })),
      };

      // Mock no existing votes
      const votesQuery = {
        eq: jest.fn(() => mockVotesQuery),
      };
      const mockVotesQuery = {
        select: jest
          .fn(() => votesQuery)
          .mockResolvedValue({
            data: [],
            error: null,
          }),
      };

      // Mock vote insertion
      const insertVotes = {
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "vote2", option_id: "option2" }],
            error: null,
          }),
        })),
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { option_id: "option1", vote_count: 0 },
          { option_id: "option2", vote_count: 1 },
        ],
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === "votes") {
          return {
            ...mockVotesQuery,
            ...insertVotes,
          };
        }
        if (table === "poll_analytics") {
          return {
            insert: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.voteCount).toBe(1);
    });

    it("should return 400 for invalid payload", async () => {
      // Mock validateVotePayload to return invalid
      const { validateVotePayload } = require("@/lib/utils/voting");
      validateVotePayload.mockReturnValueOnce({
        valid: false,
        errors: ["Invalid option ID"],
      });

      const request = createMockRequest({
        optionIds: [], // Invalid - empty array
      });

      const params = { params: { id: "poll123" } };

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid vote data");
      expect(responseData.details).toEqual(["Invalid option ID"]);
    });

    it("should return 404 when poll not found", async () => {
      const request = createMockRequest({
        optionIds: ["option1"],
      });

      const params = { params: { id: "nonexistent" } };

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Poll not found" },
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe("Poll not found");
    });

    it("should return 400 for invalid option selection", async () => {
      const request = createMockRequest({
        optionIds: ["invalid-option-id"],
      });

      const params = { params: { id: "poll123" } };

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithOptions,
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        return {};
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid option selected");
    });

    it("should return 403 when vote permissions are denied", async () => {
      // Mock validateVotePermissions to deny
      const { validateVotePermissions } = require("@/lib/utils/voting");
      validateVotePermissions.mockReturnValueOnce({
        allowed: false,
        reason: "Poll has expired",
      });

      const request = createMockRequest({
        optionIds: ["option1"],
      });

      const params = { params: { id: "poll123" } };

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithOptions,
            error: null,
          }),
        })),
      };

      const votesQuery = {
        eq: jest.fn(() => mockVotesQuery),
      };
      const mockVotesQuery = {
        select: jest
          .fn(() => votesQuery)
          .mockResolvedValue({
            data: [],
            error: null,
          }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === "votes") {
          return mockVotesQuery;
        }
        return {};
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe("Poll has expired");
    });

    it("should return 429 when rate limited", async () => {
      // Mock rate limiter to deny
      const { VoteRateLimiter } = require("@/lib/utils/voting");
      VoteRateLimiter.isAllowed.mockReturnValueOnce(false);

      const request = createMockRequest({
        optionIds: ["option1"],
      });

      const params = { params: { id: "poll123" } };

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toBe(
        "Too many vote attempts. Please try again later.",
      );
    });

    it("should handle duplicate votes on single-vote poll by updating", async () => {
      const request = createMockRequest({
        optionIds: ["option2"],
      });

      const params = { params: { id: "poll123" } };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: "user123", email: "test@example.com" },
          },
        },
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockPollWithOptions, allow_multiple_votes: false },
            error: null,
          }),
        })),
      };

      // Mock existing vote
      const votesQuery = {
        eq: jest.fn(() => mockVotesQuery),
      };
      const mockVotesQuery = {
        select: jest
          .fn(() => votesQuery)
          .mockResolvedValue({
            data: [{ option_id: "option1" }],
            error: null,
          }),
      };

      // Mock delete existing votes
      const deleteVotes = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      };

      // Mock insert new vote
      const insertVotes = {
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "vote3", option_id: "option2" }],
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === "votes") {
          return {
            ...mockVotesQuery,
            ...deleteVotes,
            ...insertVotes,
          };
        }
        if (table === "poll_analytics") {
          return {
            insert: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { option_id: "option1", vote_count: 0 },
          { option_id: "option2", vote_count: 1 },
        ],
        error: null,
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(deleteVotes.delete).toHaveBeenCalled();
    });

    it("should return 500 on database insertion error", async () => {
      const request = createMockRequest({
        optionIds: ["option1"],
      });

      const params = { params: { id: "poll123" } };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithOptions,
            error: null,
          }),
        })),
      };

      const votesQuery = {
        eq: jest.fn(() => mockVotesQuery),
      };
      const mockVotesQuery = {
        select: jest
          .fn(() => votesQuery)
          .mockResolvedValue({
            data: [],
            error: null,
          }),
      };

      // Mock insertion failure
      const insertVotes = {
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database insertion failed" },
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            select: jest.fn(() => pollQuery),
          };
        }
        if (table === "votes") {
          return {
            ...mockVotesQuery,
            ...insertVotes,
          };
        }
        return {};
      });

      const response = await POST(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to record vote");
    });
  });

  describe("GET /api/polls/[id]/vote", () => {
    it("should return poll results successfully", async () => {
      const request = {} as NextRequest;
      const params = { params: { id: "poll123" } };

      const mockResults = [
        { option_id: "option1", option_text: "Option 1", vote_count: 5 },
        { option_id: "option2", option_text: "Option 2", vote_count: 3 },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockResults,
        error: null,
      });

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockResults);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_poll_results", {
        poll_uuid: "poll123",
      });
    });

    it("should return 500 on RPC error", async () => {
      const request = {} as NextRequest;
      const params = { params: { id: "poll123" } };

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC function failed" },
      });

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to fetch results");
    });

    it("should handle empty results gracefully", async () => {
      const request = {} as NextRequest;
      const params = { params: { id: "poll123" } };

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await GET(request, params);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual([]);
    });
  });
});
