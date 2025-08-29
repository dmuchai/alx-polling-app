"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { VoteData, VoteInsert } from "@/types"
import { headers } from "next/headers"

export async function submitVote(voteData: VoteData) {
  const supabase = createClient()
  const headersList = await headers()
  
  try {
    // Get the current user (if authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get IP address and user agent
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, is_active, expires_at, require_auth, allow_multiple_votes")
      .eq("id", voteData.pollId)
      .single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    if (!poll.is_active) {
      throw new Error("This poll is not active")
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new Error("This poll has expired")
    }

    if (poll.require_auth && !user) {
      throw new Error("Authentication required to vote on this poll")
    }

    // Check if user has already voted (for single vote polls)
    if (!poll.allow_multiple_votes && user) {
      const { data: existingVote, error: voteCheckError } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", voteData.pollId)
        .eq("user_id", user.id)
        .single()

      if (existingVote) {
        throw new Error("You have already voted on this poll")
      }
    }

    // For anonymous votes, check IP-based voting
    if (!user && !poll.allow_multiple_votes) {
      const { data: existingVote, error: voteCheckError } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", voteData.pollId)
        .eq("ip_address", ipAddress)
        .single()

      if (existingVote) {
        throw new Error("You have already voted on this poll")
      }
    }

    // Insert votes
    const votesToInsert: VoteInsert[] = voteData.optionIds.map(optionId => ({
      poll_id: voteData.pollId,
      option_id: optionId,
      user_id: user?.id || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    }))

    const { error: insertError } = await supabase
      .from("votes")
      .insert(votesToInsert)

    if (insertError) {
      console.error("Vote insertion error:", insertError)
      throw new Error("Failed to submit vote")
    }

    // Revalidate the poll page
    revalidatePath(`/polls/${voteData.pollId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Submit vote error:", error)
    throw error
  }
}

export async function getPollResults(pollId: string) {
  const supabase = createClient()
  
  try {
    // Get poll with options and vote counts
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (
          id,
          text,
          votes
        )
      `)
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    return {
      poll,
      totalVotes: poll.total_votes,
      options: poll.poll_options
    }
  } catch (error) {
    console.error("Get poll results error:", error)
    throw error
  }
}

export async function hasUserVoted(pollId: string, userId?: string, ipAddress?: string) {
  const supabase = createClient()
  
  try {
    if (userId) {
      // Check for authenticated user vote
      const { data: vote, error } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("user_id", userId)
        .single()

      return { hasVoted: !!vote, error: null }
    } else if (ipAddress) {
      // Check for anonymous user vote
      const { data: vote, error } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("ip_address", ipAddress)
        .single()

      return { hasVoted: !!vote, error: null }
    }

    return { hasVoted: false, error: null }
  } catch (error) {
    // If no vote found, error will be thrown, so user hasn't voted
    return { hasVoted: false, error: null }
  }
}
