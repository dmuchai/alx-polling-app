"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { CreatePollForm } from "@/components/polls/create-poll-form"
import { CreatePollData } from "@/types"
import { getPoll, updatePoll } from "@/lib/actions/polls.actions"
import { createClient } from "@/lib/supabase/client"

export default function EditPollPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [pollData, setPollData] = useState<CreatePollData | null>(null)
  const [userOwnsPoll, setUserOwnsPoll] = useState(false)

  const pollId = params.id as string

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }

        // Get poll data
        const poll = await getPoll(pollId)
        
        // Check if user owns the poll
        if (poll.creator_id !== user.id) {
          setError("You don't have permission to edit this poll")
          setIsLoading(false)
          return
        }

        setUserOwnsPoll(true)

        // Transform poll data to CreatePollData format
        const editData: CreatePollData = {
          title: poll.title,
          description: poll.description || "",
          options: poll.options.map(option => option.text),
          allowMultipleVotes: poll.allow_multiple_votes,
          requireAuth: poll.require_auth,
          expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
          category: poll.category,
          tags: poll.tags || []
        }

        setPollData(editData)
      } catch (error) {
        console.error("Error fetching poll:", error)
        setError("Failed to load poll data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPoll()
  }, [pollId, router])

  const handleUpdatePoll = async (data: CreatePollData) => {
    setIsSaving(true)
    setError("")

    try {
      await updatePoll(pollId, {
        title: data.title,
        description: data.description || null,
        allow_multiple_votes: data.allowMultipleVotes || false,
        require_auth: data.requireAuth || false,
        expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        category: (data.category as any) || "general",
        tags: data.tags && data.tags.length > 0 ? data.tags : null,
      })

      // Redirect to the poll page with success message
      router.push(`/polls/${pollId}?updated=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while updating the poll")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!userOwnsPoll) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-8">
              {error || "You don't have permission to edit this poll."}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!pollData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Poll Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The poll you're trying to edit doesn't exist.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Poll
          </h1>
          <p className="text-gray-600">
            Update your poll settings and options
          </p>
        </div>

        <CreatePollForm
          onSubmit={handleUpdatePoll}
          isLoading={isSaving}
          error={error}
          initialData={pollData}
        />

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Note: Poll Options Cannot Be Modified
            </h3>
            <p className="text-xs text-blue-800">
              For data integrity, poll options cannot be changed after creation. 
              You can modify the title, description, settings, and metadata.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
