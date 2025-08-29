"use client"

import { useState, useEffect } from "react"
import { PollCard } from "@/components/polls/poll-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Poll, PollFilters } from "@/types"
import { Plus, Search, Filter, Grid, List, TrendingUp, Clock, Users } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getActivePolls } from "@/lib/actions/polls.actions"
import { submitVote } from "@/lib/actions/voting.actions"

export default function PollsPage() {
  const searchParams = useSearchParams()
  const [polls, setPolls] = useState<Poll[]>([])
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'ending'>('recent')
  const [filters, setFilters] = useState<PollFilters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [createdPollId, setCreatedPollId] = useState<string | null>(null)

  // Check for success message parameters
  useEffect(() => {
    const wasCreated = searchParams.get('created') === 'true'
    const pollId = searchParams.get('pollId')
    
    if (wasCreated && pollId) {
      setShowSuccessMessage(true)
      setCreatedPollId(pollId)
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
        setCreatedPollId(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Fetch polls on component mount
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const pollsData = await getActivePolls()
        
        // Transform the database data to match our Poll interface
        const transformedPolls: Poll[] = pollsData.map(pollData => ({
          id: pollData.id,
          title: pollData.title,
          description: pollData.description || undefined,
          options: pollData.poll_options.map((option: any) => ({
            id: option.id,
            text: option.text,
            votes: option.votes,
            pollId: option.poll_id
          })),
          creatorId: pollData.creator_id,
          creator: pollData.profiles ? {
            id: pollData.profiles.id,
            email: pollData.profiles.email,
            username: pollData.profiles.username,
            firstName: pollData.profiles.first_name || undefined,
            lastName: pollData.profiles.last_name || undefined,
            avatar: pollData.profiles.avatar || undefined,
            createdAt: new Date(pollData.profiles.created_at),
            updatedAt: new Date(pollData.profiles.updated_at)
          } : undefined,
          isActive: pollData.is_active,
          allowMultipleVotes: pollData.allow_multiple_votes,
          requireAuth: pollData.require_auth,
          expiresAt: pollData.expires_at ? new Date(pollData.expires_at) : undefined,
          createdAt: new Date(pollData.created_at),
          updatedAt: new Date(pollData.updated_at),
          totalVotes: pollData.total_votes,
          category: pollData.category,
          tags: pollData.tags || undefined
        }))
        
        setPolls(transformedPolls)
      } catch (error) {
        console.error("Error fetching polls:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolls()
  }, [])

  // Filter and sort polls
  useEffect(() => {
    let filtered = [...polls]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(poll => poll.category === filters.category)
    }

    // Apply active status filter
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(poll => poll.isActive === filters.isActive)
    }

    // Sort polls
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.totalVotes - a.totalVotes
        case 'ending':
          if (!a.expiresAt && !b.expiresAt) return 0
          if (!a.expiresAt) return 1
          if (!b.expiresAt) return -1
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredPolls(filtered)
  }, [polls, searchQuery, filters, sortBy])

  const handleVote = async (pollId: string, optionIds: string[]) => {
    setIsVoting(true)
    try {
      await submitVote({ pollId, optionIds })

      // Refresh polls data to get updated vote counts
      const updatedPollsData = await getActivePolls()
      
      const updatedPolls: Poll[] = updatedPollsData.map(pollData => ({
        id: pollData.id,
        title: pollData.title,
        description: pollData.description || undefined,
                 options: pollData.poll_options.map((option: any) => ({
           id: option.id,
           text: option.text,
           votes: option.votes,
           pollId: option.poll_id
         })),
        creatorId: pollData.creator_id,
        creator: pollData.profiles ? {
          id: pollData.profiles.id,
          email: pollData.profiles.email,
          username: pollData.profiles.username,
          firstName: pollData.profiles.first_name || undefined,
          lastName: pollData.profiles.last_name || undefined,
          avatar: pollData.profiles.avatar || undefined,
          createdAt: new Date(pollData.profiles.created_at),
          updatedAt: new Date(pollData.profiles.updated_at)
        } : undefined,
        isActive: pollData.is_active,
        allowMultipleVotes: pollData.allow_multiple_votes,
        requireAuth: pollData.require_auth,
        expiresAt: pollData.expires_at ? new Date(pollData.expires_at) : undefined,
        createdAt: new Date(pollData.created_at),
        updatedAt: new Date(pollData.updated_at),
        totalVotes: pollData.total_votes,
        category: pollData.category,
        tags: pollData.tags || undefined
      }))
      
      setPolls(updatedPolls)
    } catch (error) {
      console.error("Voting error:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const categories = Array.from(new Set(polls.map(poll => poll.category).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Poll created successfully!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Your poll is now live and ready to collect votes.
                  {createdPollId && (
                    <Link 
                      href={`/polls/${createdPollId}`}
                      className="text-green-600 hover:text-green-800 underline ml-1"
                    >
                      View your poll
                    </Link>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
          <p className="text-gray-600 mt-1">Discover and participate in community polls</p>
        </div>
        <Button asChild className="whitespace-nowrap">
          <Link href="/polls/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{polls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {polls.filter(poll => poll.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {polls.reduce((sum, poll) => sum + poll.totalVotes, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search polls, tags, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm bg-background"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="ending">Ending Soon</option>
              </select>

              <select
                className="px-3 py-2 border rounded-md text-sm bg-background"
                value={filters.category || ""}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                className="px-3 py-2 border rounded-md text-sm bg-background"
                value={filters.isActive === undefined ? "" : filters.isActive.toString()}
                onChange={(e) => setFilters({
                  ...filters,
                  isActive: e.target.value === "" ? undefined : e.target.value === "true"
                })}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredPolls.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No polls found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || Object.keys(filters).length > 0
                    ? "Try adjusting your search or filters"
                    : "Be the first to create a poll!"
                  }
                </p>
                <Button asChild>
                  <Link href="/polls/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Poll
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={handleVote}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredPolls.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">
            Load More Polls
          </Button>
        </div>
      )}
    </div>
  )
}
