"use client"

import { useState, useEffect } from "react"
import { PollCard } from "@/components/polls/poll-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Poll, PollFilters } from "@/types"
import { Plus, Search, Filter, Grid, List, TrendingUp, Clock, Users } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const mockPolls: Poll[] = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Help us understand the preferences of developers in our community",
    options: [
      { id: "1a", text: "JavaScript", votes: 45, pollId: "1" },
      { id: "1b", text: "Python", votes: 38, pollId: "1" },
      { id: "1c", text: "TypeScript", votes: 32, pollId: "1" },
      { id: "1d", text: "Go", votes: 15, pollId: "1" },
    ],
    creatorId: "user1",
    creator: { id: "user1", email: "john@example.com", username: "johndoe", createdAt: new Date(), updatedAt: new Date() },
    isActive: true,
    allowMultipleVotes: false,
    requireAuth: true,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
    totalVotes: 130,
    category: "Technology",
    tags: ["programming", "development", "languages"]
  },
  {
    id: "2",
    title: "Best time for team meetings?",
    description: "Let's find a time that works for everyone on the team",
    options: [
      { id: "2a", text: "9:00 AM", votes: 12, pollId: "2" },
      { id: "2b", text: "11:00 AM", votes: 24, pollId: "2" },
      { id: "2c", text: "2:00 PM", votes: 18, pollId: "2" },
      { id: "2d", text: "4:00 PM", votes: 8, pollId: "2" },
    ],
    creatorId: "user2",
    creator: { id: "user2", email: "jane@example.com", username: "janesmith", createdAt: new Date(), updatedAt: new Date() },
    isActive: true,
    allowMultipleVotes: true,
    requireAuth: false,
    expiresAt: new Date(Date.now() + 604800000), // 7 days from now
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000),
    totalVotes: 62,
    category: "Business",
    tags: ["meetings", "scheduling", "team"]
  },
  {
    id: "3",
    title: "Which feature should we prioritize next?",
    description: "Help us decide what to work on in the next sprint",
    options: [
      { id: "3a", text: "Dark mode", votes: 89, pollId: "3" },
      { id: "3b", text: "Mobile app", votes: 67, pollId: "3" },
      { id: "3c", text: "Analytics dashboard", votes: 45, pollId: "3" },
      { id: "3d", text: "API improvements", votes: 23, pollId: "3" },
    ],
    creatorId: "user3",
    creator: { id: "user3", email: "admin@example.com", username: "admin", createdAt: new Date(), updatedAt: new Date() },
    isActive: true,
    allowMultipleVotes: false,
    requireAuth: true,
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 86400000), // Updated 1 day ago
    totalVotes: 224,
    category: "Product",
    tags: ["features", "roadmap", "development"]
  }
]

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>(mockPolls)
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>(mockPolls)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'ending'>('recent')
  const [filters, setFilters] = useState<PollFilters>({})
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)
    try {
      // TODO: Replace with actual vote API call
      console.log(`Voting on poll ${pollId} with options:`, optionIds)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Update local state (in real app, this would come from the API response)
      setPolls(prevPolls => prevPolls.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option =>
            optionIds.includes(option.id)
              ? { ...option, votes: option.votes + 1 }
              : option
          )
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + optionIds.length
          }
        }
        return poll
      }))
    } catch (error) {
      console.error("Voting error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const categories = Array.from(new Set(polls.map(poll => poll.category).filter(Boolean)))

  return (
    <div className="container mx-auto py-8 px-4">
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
