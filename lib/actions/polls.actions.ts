"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { CreatePollData, PollInsert, PollOptionInsert } from "@/types"

export async function createPoll(data: CreatePollData) {
  const supabase = createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("You must be logged in to create a poll")
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      throw new Error("User profile not found")
    }

    // Prepare poll data
    const pollData: PollInsert = {
      title: data.title,
      description: data.description || null,
      creator_id: profile.id,
      is_active: true,
      allow_multiple_votes: data.allowMultipleVotes || false,
      require_auth: data.requireAuth || false,
      expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      category: (data.category as any) || "general",
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
    }

    // Insert poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert(pollData)
      .select()
      .single()

    if (pollError) {
      console.error("Poll creation error:", pollError)
      throw new Error("Failed to create poll")
    }

    // Insert poll options
    const pollOptions: PollOptionInsert[] = data.options.map(option => ({
      poll_id: poll.id,
      text: option.trim(),
    }))

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(pollOptions)

    if (optionsError) {
      console.error("Poll options creation error:", optionsError)
      // Clean up the poll if options creation fails
      await supabase.from("polls").delete().eq("id", poll.id)
      throw new Error("Failed to create poll options")
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/polls")
    
    return { success: true, pollId: poll.id }
  } catch (error) {
    console.error("Create poll error:", error)
    throw error
  }
}

export async function getPoll(pollId: string) {
  const supabase = createClient()
  
  try {
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`
        *,
        profiles!polls_creator_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq("id", pollId)
      .single()

    if (pollError) {
      throw new Error("Poll not found")
    }

    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("*")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: true })

    if (optionsError) {
      throw new Error("Failed to fetch poll options")
    }

    return {
      ...poll,
      options,
      creator: poll.profiles
    }
  } catch (error) {
    console.error("Get poll error:", error)
    throw error
  }
}

export async function getUserPolls(userId: string) {
  const supabase = createClient()
  
  try {
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (
          id,
          text,
          votes
        )
      `)
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error("Failed to fetch user polls")
    }

    return polls
  } catch (error) {
    console.error("Get user polls error:", error)
    throw error
  }
}

export async function getActivePolls(limit = 20, offset = 0) {
  const supabase = createClient()
  
  try {
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`
        *,
        profiles!polls_creator_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar
        ),
        poll_options (
          id,
          text,
          votes
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error("Failed to fetch active polls")
    }

    return polls
  } catch (error) {
    console.error("Get active polls error:", error)
    throw error
  }
}

export async function updatePoll(pollId: string, updateData: Partial<PollUpdate>) {
  const supabase = createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("You must be logged in to update a poll")
    }

    // Check if user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("creator_id")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    if (poll.creator_id !== user.id) {
      throw new Error("You can only update your own polls")
    }

    // Update the poll
    const { error: updateError } = await supabase
      .from("polls")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", pollId)

    if (updateError) {
      throw new Error("Failed to update poll")
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/polls")
    revalidatePath(`/polls/${pollId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Update poll error:", error)
    throw error
  }
}

export async function deletePoll(pollId: string) {
  const supabase = createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("You must be logged in to delete a poll")
    }

    // Check if user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("creator_id")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    if (poll.creator_id !== user.id) {
      throw new Error("You can only delete your own polls")
    }

    // Delete the poll (cascade will handle options and votes)
    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId)

    if (deleteError) {
      throw new Error("Failed to delete poll")
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/polls")
    
    return { success: true }
  } catch (error) {
    console.error("Delete poll error:", error)
    throw error
  }
}
