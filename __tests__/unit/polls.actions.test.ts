import {
  createPoll,
  getPoll,
  getUserPolls,
  getActivePolls,
  updatePoll,
  deletePoll,
} from "@/lib/actions/polls.actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("next/cache", () => ({
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
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe("Poll Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPoll", () => {
    const mockCreatePollData = {
      title: "Test Poll",
      description: "A test poll description",
      options: ["Option 1", "Option 2", "Option 3"],
      allowMultipleVotes: false,
      requireAuth: false,
      category: "general",
      tags: ["test", "polling"],
    };

    const mockUser = {
      id: "user123",
      email: "test@example.com",
    };

    const mockProfile = {
      id: "user123",
    };

    const mockPoll = {
      id: "poll123",
      title: "Test Poll",
      creator_id: "user123",
    };

    it("should create a poll successfully", async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock profile fetch
      const profileQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      };
      const profileSelect = {
        select: jest.fn(() => profileQuery),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === "profiles") return profileSelect;
        if (table === "polls") {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockPoll,
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === "poll_options") {
          return {
            insert: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await createPoll(mockCreatePollData);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe("poll123");
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(revalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should throw error when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      await expect(createPoll(mockCreatePollData)).rejects.toThrow(
        "You must be logged in to create a poll",
      );
    });

    it("should throw error when user profile not found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const profileQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Profile not found" },
          }),
        })),
      };
      const profileSelect = {
        select: jest.fn(() => profileQuery),
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === "profiles") return profileSelect;
        return {};
      });

      await expect(createPoll(mockCreatePollData)).rejects.toThrow(
        "User profile not found",
      );
    });

    it("should clean up poll if options creation fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const profileQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      };
      const profileSelect = {
        select: jest.fn(() => profileQuery),
      };

      const pollDelete = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "profiles") return profileSelect;
        if (table === "polls") {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockPoll,
                  error: null,
                }),
              })),
            })),
            ...pollDelete,
          };
        }
        if (table === "poll_options") {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Options creation failed" },
            }),
          };
        }
        return {};
      });

      await expect(createPoll(mockCreatePollData)).rejects.toThrow(
        "Failed to create poll options",
      );

      expect(pollDelete.delete).toHaveBeenCalled();
    });
  });

  describe("getPoll", () => {
    const mockPollWithCreator = {
      id: "poll123",
      title: "Test Poll",
      creator_id: "user123",
      profiles: {
        id: "user123",
        username: "testuser",
        first_name: "Test",
        last_name: "User",
      },
    };

    const mockOptions = [
      { id: "option1", text: "Option 1", poll_id: "poll123" },
      { id: "option2", text: "Option 2", poll_id: "poll123" },
    ];

    it("should fetch poll with creator and options successfully", async () => {
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithCreator,
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      const optionsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockOptions,
            error: null,
          }),
        })),
      };
      const optionsSelect = {
        select: jest.fn(() => optionsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        if (table === "poll_options") return optionsSelect;
        return {};
      });

      const result = await getPoll("poll123");

      expect(result.id).toBe("poll123");
      expect(result.options).toEqual(mockOptions);
      expect(result.creator).toEqual(mockPollWithCreator.profiles);
    });

    it("should throw error when poll not found", async () => {
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Poll not found" },
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        return {};
      });

      await expect(getPoll("nonexistent")).rejects.toThrow("Poll not found");
    });

    it("should throw error when options fetch fails", async () => {
      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPollWithCreator,
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      const optionsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Options fetch failed" },
          }),
        })),
      };
      const optionsSelect = {
        select: jest.fn(() => optionsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        if (table === "poll_options") return optionsSelect;
        return {};
      });

      await expect(getPoll("poll123")).rejects.toThrow(
        "Failed to fetch poll options",
      );
    });
  });

  describe("getUserPolls", () => {
    const mockUserPolls = [
      {
        id: "poll1",
        title: "User Poll 1",
        creator_id: "user123",
        poll_options: [
          { id: "opt1", text: "Option 1", votes: 5 },
          { id: "opt2", text: "Option 2", votes: 3 },
        ],
      },
      {
        id: "poll2",
        title: "User Poll 2",
        creator_id: "user123",
        poll_options: [{ id: "opt3", text: "Option A", votes: 2 }],
      },
    ];

    it("should fetch user polls successfully", async () => {
      const pollsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockUserPolls,
            error: null,
          }),
        })),
      };
      const pollsSelect = {
        select: jest.fn(() => pollsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollsSelect;
        return {};
      });

      const result = await getUserPolls("user123");

      expect(result).toEqual(mockUserPolls);
      expect(pollsQuery.eq).toHaveBeenCalledWith("creator_id", "user123");
    });

    it("should throw error when fetching user polls fails", async () => {
      const pollsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        })),
      };
      const pollsSelect = {
        select: jest.fn(() => pollsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollsSelect;
        return {};
      });

      await expect(getUserPolls("user123")).rejects.toThrow(
        "Failed to fetch user polls",
      );
    });
  });

  describe("getActivePolls", () => {
    const mockActivePolls = [
      {
        id: "poll1",
        title: "Active Poll 1",
        is_active: true,
        profiles: {
          id: "user1",
          username: "user1",
        },
        poll_options: [{ id: "opt1", text: "Option 1", votes: 10 }],
      },
    ];

    it("should fetch active polls with default pagination", async () => {
      const pollsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: mockActivePolls,
              error: null,
            }),
          })),
        })),
      };
      const pollsSelect = {
        select: jest.fn(() => pollsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollsSelect;
        return {};
      });

      const result = await getActivePolls();

      expect(result).toEqual(mockActivePolls);
      expect(pollsQuery.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("should fetch active polls with custom pagination", async () => {
      const rangeSpy = jest.fn().mockResolvedValue({
        data: mockActivePolls,
        error: null,
      });

      const pollsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: rangeSpy,
          })),
        })),
      };
      const pollsSelect = {
        select: jest.fn(() => pollsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollsSelect;
        return {};
      });

      await getActivePolls(10, 5);

      expect(rangeSpy).toHaveBeenCalledWith(5, 14); // offset 5, limit 10 -> range(5, 14)
    });

    it("should throw error when fetching active polls fails", async () => {
      const pollsQuery = {
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          })),
        })),
      };
      const pollsSelect = {
        select: jest.fn(() => pollsQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollsSelect;
        return {};
      });

      await expect(getActivePolls()).rejects.toThrow(
        "Failed to fetch active polls",
      );
    });
  });

  describe("updatePoll", () => {
    const mockUser = {
      id: "user123",
      email: "test@example.com",
    };

    const mockPoll = {
      id: "poll123",
      creator_id: "user123",
    };

    const updateData = {
      title: "Updated Poll Title",
      description: "Updated description",
      is_active: false,
    };

    it("should update poll successfully when user owns it", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPoll,
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      const pollUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            ...pollSelect,
            ...pollUpdate,
          };
        }
        return {};
      });

      const result = await updatePoll("poll123", updateData);

      expect(result.success).toBe(true);
      expect(pollUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String),
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(revalidatePath).toHaveBeenCalledWith("/polls");
      expect(revalidatePath).toHaveBeenCalledWith("/polls/poll123");
    });

    it("should throw error when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      await expect(updatePoll("poll123", updateData)).rejects.toThrow(
        "You must be logged in to update a poll",
      );
    });

    it("should throw error when poll not found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Poll not found" },
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        return {};
      });

      await expect(updatePoll("nonexistent", updateData)).rejects.toThrow(
        "Poll not found",
      );
    });

    it("should throw error when user does not own the poll", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockPoll, creator_id: "different-user" },
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        return {};
      });

      await expect(updatePoll("poll123", updateData)).rejects.toThrow(
        "You can only update your own polls",
      );
    });
  });

  describe("deletePoll", () => {
    const mockUser = {
      id: "user123",
      email: "test@example.com",
    };

    const mockPoll = {
      id: "poll123",
      creator_id: "user123",
    };

    it("should delete poll successfully when user owns it", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPoll,
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      const pollDelete = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            ...pollSelect,
            ...pollDelete,
          };
        }
        return {};
      });

      const result = await deletePoll("poll123");

      expect(result.success).toBe(true);
      expect(pollDelete.delete).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(revalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should throw error when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      await expect(deletePoll("poll123")).rejects.toThrow(
        "You must be logged in to delete a poll",
      );
    });

    it("should throw error when poll not found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Poll not found" },
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        return {};
      });

      await expect(deletePoll("nonexistent")).rejects.toThrow("Poll not found");
    });

    it("should throw error when user does not own the poll", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockPoll, creator_id: "different-user" },
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") return pollSelect;
        return {};
      });

      await expect(deletePoll("poll123")).rejects.toThrow(
        "You can only delete your own polls",
      );
    });

    it("should throw error when delete operation fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pollQuery = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPoll,
            error: null,
          }),
        })),
      };
      const pollSelect = {
        select: jest.fn(() => pollQuery),
      };

      const pollDelete = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Delete failed" },
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "polls") {
          return {
            ...pollSelect,
            ...pollDelete,
          };
        }
        return {};
      });

      await expect(deletePoll("poll123")).rejects.toThrow(
        "Failed to delete poll",
      );
    });
  });
});
