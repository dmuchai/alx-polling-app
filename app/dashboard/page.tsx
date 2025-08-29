"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Poll, DashboardStats, User } from "@/types"
import {
  Plus,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Eye,
  Edit,
  Trash2,
  Share2,
  MoreHorizontal,
  Calendar,
  Filter,
  Search
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { getUserPolls, deletePoll } from "@/lib/actions/polls.actions"

// Mock data for demonstration
const mockUser: User = {
  id: "user1",
  email: "john.doe@example.com",
  username: "johndoe",
  firstName: "John",
  lastName: "Doe",
  avatar: "/avatars/john.jpg",
  createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
  updatedAt: new Date()
}

const mockStats: DashboardStats = {
  totalPolls: 12,
  activePolls: 8,
  totalVotes: 1247,
  totalViews: 5432
}

const mockUserPolls: Poll[] = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Help us understand developer preferences",
    options: [
      { id: "1a", text: "JavaScript", votes: 45, pollId: "1" },
      { id: "1b", text: "Python", votes: 38, pollId: "1" },
      { id: "1c", text: "TypeScript", votes: 32, pollId: "1" },
    ],
    creatorId: "user1",
    creator: mockUser,
    isActive: true,
    allowMultipleVotes: false,
    requireAuth: true,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
    totalVotes: 115,
    category: "Technology",
    tags: ["programming", "development"]
  },
  {
    id: "2",
    title: "Best meeting time for the team?",
    description: "Let's coordinate our schedules",
    options: [
      { id: "2a", text: "9:00 AM", votes: 12, pollId: "2" },
      { id: "2b", text: "11:00 AM", votes: 24, pollId: "2" },
      { id: "2c", text: "2:00 PM", votes: 18, pollId: "2" },
    ],
    creatorId: "user1",
    creator: mockUser,
    isActive: true,
    allowMultipleVotes: true,
    requireAuth: false,
    expiresAt: new Date(Date.now() + 604800000), // 7 days from now
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000),
    totalVotes: 54,
    category: "Business"
  },
  {
    id: "3",
    title: "Which UI framework should we use?",
    description: "For our next project",
    options: [
      { id: "3a", text: "React", votes: 67, pollId: "3" },
      { id: "3b", text: "Vue", votes: 43, pollId: "3" },
      { id: "3c", text: "Angular", votes: 28, pollId: "3" },
    ],
    creatorId: "user1",
    creator: mockUser,
    isActive: false,
    allowMultipleVotes: false,
    requireAuth: true,
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 86400000),
    totalVotes: 138,
    category: "Technology",
    tags: ["ui", "framework", "frontend"]
  }
]

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [polls, setPolls] = useState<Poll[]>([])
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // Redirect to login if not authenticated
          window.location.href = '/login'
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError || !profile) {
          throw new Error("User profile not found")
        }

        // Transform profile to User interface
        const userData: User = {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
          avatar: profile.avatar || undefined,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        }

        setUser(userData)

        // Get user's polls
        const userPollsData = await getUserPolls(user.id)
        
        // Transform polls data
        const transformedPolls: Poll[] = userPollsData.map(pollData => ({
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
          creator: userData,
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
        setFilteredPolls(transformedPolls)

        // Calculate stats
        const stats: DashboardStats = {
          totalPolls: transformedPolls.length,
          activePolls: transformedPolls.filter(poll => poll.isActive).length,
          totalVotes: transformedPolls.reduce((sum, poll) => sum + poll.totalVotes, 0),
          totalViews: transformedPolls.reduce((sum, poll) => sum + (poll.totalVotes * 3), 0) // Rough estimate
        }

        setStats(stats)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    let filtered = [...polls]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(poll => poll.isActive)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(poll => !poll.isActive)
    }

    setFilteredPolls(filtered)
  }, [polls, searchQuery, filterStatus])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getTimeLeft = (expiresAt?: Date) => {
    if (!expiresAt) return null

    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const timeLeft = expiry - now

    if (timeLeft <= 0) return "Expired"

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days}d left`

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    return `${hours}h left`
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return
    }

    try {
      await deletePoll(pollId)

      // Update local state
      setPolls(prev => prev.filter(poll => poll.id !== pollId))
      setFilteredPolls(prev => prev.filter(poll => poll.id !== pollId))
    } catch (error) {
      console.error("Error deleting poll:", error)
    }
  }

  const handleTogglePollStatus = async (pollId: string) => {
    try {
      // TODO: Replace with actual API call
      console.log("Toggling poll status:", pollId)

      // Update local state
      setPolls(prev => prev.map(poll =>
        poll.id === pollId ? { ...poll, isActive: !poll.isActive } : poll
      ))
    } catch (error) {
      console.error("Error toggling poll status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || user?.username}!
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your polls and track their performance
            </p>
          </div>
          <Button asChild>
            <Link href="/polls/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Poll
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPolls}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activePolls}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activePolls}/{stats?.totalPolls} polls active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                +89 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                +234 from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Polls Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl">Your Polls</CardTitle>
                <CardDescription>
                  Manage and monitor your created polls
                </CardDescription>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search your polls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                className="px-3 py-2 border rounded-md text-sm bg-background"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Polls</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {filteredPolls.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {polls.length === 0 ? "No polls yet" : "No polls match your search"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {polls.length === 0
                    ? "Create your first poll to start collecting opinions and insights."
                    : "Try adjusting your search terms or filters."
                  }
                </p>
                {polls.length === 0 && (
                  <Button asChild>
                    <Link href="/polls/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Poll
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPolls.map((poll) => (
                  <div
                    key={poll.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/polls/${poll.id}`}
                            className="text-lg font-medium hover:text-primary transition-colors"
                          >
                            {poll.title}
                          </Link>
                          <div className="flex items-center gap-2">
                            {poll.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Inactive
                              </span>
                            )}
                            {poll.category && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                {poll.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {poll.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {poll.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{poll.totalVotes} votes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(poll.createdAt)}</span>
                          </div>
                          {poll.expiresAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{getTimeLeft(poll.expiresAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/polls/${poll.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>

                        <Button variant="ghost" size="sm">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/polls/${poll.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePollStatus(poll.id)}
                        >
                          {poll.isActive ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePoll(poll.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {filteredPolls.length > 0 && (
            <CardFooter className="border-t bg-gray-50">
              <div className="flex items-center justify-between w-full">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPolls.length} of {polls.length} polls
                </p>
                <Button variant="outline" size="sm">
                  View All Analytics
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>New vote on "Programming Language"</span>
                  <span className="text-muted-foreground">2m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Poll "Meeting Time" created</span>
                  <span className="text-muted-foreground">1h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>5 new votes on "UI Framework"</span>
                  <span className="text-muted-foreground">3h ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Programming Language</span>
                  <span className="font-medium">115 votes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>UI Framework</span>
                  <span className="font-medium">138 votes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Meeting Time</span>
                  <span className="font-medium">54 votes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/polls/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Poll
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/polls">
                  <Search className="mr-2 h-4 w-4" />
                  Browse All Polls
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
