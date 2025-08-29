import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateVoterFingerprint,
  validateVotePermissions,
  VoteRateLimiter,
  sanitizeVoteData,
  validateVotePayload,
  extractClientInfo
} from '@/lib/utils/voting';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const pollId = params.id;
    const body = await request.json();

    // Validate request payload
    const validation = validateVotePayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid vote data', details: validation.errors },
        { status: 400 }
      );
    }

    // Extract client information
    const { ipAddress, userAgent } = extractClientInfo(request.headers);

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Generate voter fingerprint
    const voterFingerprint = generateVoterFingerprint({
      ipAddress,
      userAgent,
      userId,
      pollId,
    });

    // Check rate limiting
    if (!VoteRateLimiter.isAllowed(voterFingerprint)) {
      return NextResponse.json(
        { error: 'Too many vote attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Fetch poll details with options
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          text,
          position
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Validate selected options exist
    const validOptionIds = poll.poll_options.map((opt: any) => opt.id);
    const invalidOptions = body.optionIds.filter((id: string) => !validOptionIds.includes(id));

    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Check for existing votes by this fingerprint
    const { data: existingVotes, error: voteCheckError } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('voter_fingerprint', voterFingerprint);

    if (voteCheckError) {
      console.error('Error checking existing votes:', voteCheckError);
      return NextResponse.json(
        { error: 'Failed to validate vote' },
        { status: 500 }
      );
    }

    // Validate vote permissions
    const permissionCheck = validateVotePermissions({
      poll,
      userId,
      existingVotes: existingVotes || [],
    });

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.reason },
        { status: 403 }
      );
    }

    // Handle multiple votes policy
    if (!poll.allow_multiple_votes && existingVotes && existingVotes.length > 0) {
      // If single vote only, delete existing votes first
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('voter_fingerprint', voterFingerprint);

      if (deleteError) {
        console.error('Error deleting existing votes:', deleteError);
        return NextResponse.json(
          { error: 'Failed to update vote' },
          { status: 500 }
        );
      }
    }

    // Prepare vote data
    const votesToInsert = body.optionIds.map((optionId: string) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId || null,
      voter_fingerprint: voterFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent.slice(0, 500),
    }));

    // Insert new votes
    const { data: newVotes, error: insertError } = await supabase
      .from('votes')
      .insert(votesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting votes:', insertError);

      // Handle duplicate vote error specifically
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Vote already recorded' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    // Get updated poll results
    const { data: results, error: resultsError } = await supabase
      .rpc('get_poll_results', { poll_uuid: pollId });

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
    }

    // Record analytics event
    await supabase
      .from('poll_analytics')
      .insert({
        poll_id: pollId,
        event_type: 'vote',
        metadata: {
          options_selected: body.optionIds.length,
          user_authenticated: !!userId,
          ip_hash: generateVoterFingerprint({
            ipAddress,
            userAgent: 'masked',
            pollId,
            userId: 'masked'
          }),
        },
      });

    // Reset rate limiter on successful vote
    VoteRateLimiter.reset(voterFingerprint);

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        voteCount: newVotes?.length || 0,
        results: results || [],
      },
    });

  } catch (error) {
    console.error('Unexpected error in vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const pollId = params.id;

    // Get poll results
    const { data: results, error } = await supabase
      .rpc('get_poll_results', { poll_uuid: pollId });

    if (error) {
      console.error('Error fetching poll results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results || [],
    });

  } catch (error) {
    console.error('Unexpected error in results API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
