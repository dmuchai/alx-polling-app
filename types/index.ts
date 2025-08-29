// Re-export database types for convenience
export type { 
  Profile as User, 
  Poll, 
  PollOption, 
  Vote, 
  PollView,
  ProfileInsert,
  PollInsert,
  PollOptionInsert,
  VoteInsert,
  PollViewInsert,
  ProfileUpdate,
  PollUpdate,
  PollOptionUpdate,
  VoteUpdate,
  PollViewUpdate
} from './database';

// User and Authentication Types (keeping for backward compatibility)
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Poll Types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  pollId: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  creatorId: string;
  creator?: User;
  isActive: boolean;
  allowMultipleVotes: boolean;
  requireAuth: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  totalVotes: number;
  category?: string;
  tags?: string[];
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  allowMultipleVotes?: boolean;
  requireAuth?: boolean;
  expiresAt?: Date;
  category?: string;
  tags?: string[];
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: Date;
  category?: string;
  tags?: string[];
}

// Vote Types
export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface VoteData {
  pollId: string;
  optionIds: string[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  success: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  totalViews: number;
}

export interface PollAnalytics {
  pollId: string;
  views: number;
  uniqueVoters: number;
  votingActivity: {
    date: string;
    votes: number;
  }[];
  optionPerformance: {
    optionId: string;
    optionText: string;
    votes: number;
    percentage: number;
  }[];
}

// Filter and Search Types
export interface PollFilters {
  category?: string;
  isActive?: boolean;
  creatorId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "createdAt" | "updatedAt" | "totalVotes" | "title";
  sortOrder?: "asc" | "desc";
}

export interface SearchParams {
  q?: string;
  filters?: PollFilters;
  page?: number;
  limit?: number;
}

// Component Props Types
export interface PollCardProps {
  poll: Poll;
  showActions?: boolean;
  onVote?: (pollId: string, optionIds: string[]) => void;
  onEdit?: (poll: Poll) => void;
  onDelete?: (pollId: string) => void;
}

export interface VotingFormProps {
  poll: Poll;
  onVote: (optionIds: string[]) => void;
  isSubmitting?: boolean;
  hasVoted?: boolean;
}

// Utility Types
export type PollStatus = "active" | "expired" | "draft" | "archived";

export type UserRole = "user" | "admin" | "moderator";

export type VoteType = "single" | "multiple";

export type PollCategory =
  | "general"
  | "politics"
  | "sports"
  | "entertainment"
  | "technology"
  | "business"
  | "education"
  | "health"
  | "lifestyle"
  | "other";
