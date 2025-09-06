import { supabase } from './auth';
import { Database } from '@/types/supabase';

type Vote = Database['public']['Tables']['votes']['Row'];

/**
 * Submits a vote for a specific poll option.
 * Includes validation to prevent duplicate votes and handles real-time updates.
 *
 * @param {Object} voteData - The vote data
 * @param {string} voteData.pollId - ID of the poll being voted on
 * @param {string} voteData.userId - ID of the user voting
 * @param {number} voteData.optionIndex - Index of the selected option
 * @returns {Promise<{ vote: Vote | null; error: Error | null }>} Created vote data or error
 * @throws {Error} When vote submission fails or validation fails
 *
 * @example
 * try {
 *   const { vote, error } = await submitVote({
 *     pollId: 'poll-123',
 *     userId: 'user-123',
 *     optionIndex: 1
 *   });
 *   if (error) throw error;
 *   console.log('Vote submitted:', vote);
 * } catch (error) {
 *   console.error('Error submitting vote:', error.message);
 * }
 */
export async function submitVote({
  pollId,
  userId,
  optionIndex
}: {
  pollId: string;
  userId: string;
  optionIndex: number;
}) {
  // Check if user has already voted on this poll using a separate function
  // This prevents race conditions by using Supabase's built-in unique constraint
  // The unique constraint (poll_id, user_id) ensures one vote per user per poll
  // even if multiple votes are submitted simultaneously
  const existingVote = await hasUserVoted(pollId, userId);
  if (existingVote) {
    return { vote: null, error: new Error('User has already voted on this poll') };
  }

  // Check if poll exists and hasn't expired
  const { data: poll } = await supabase
    .from('polls')
    .select('expires_at, options')
    .eq('id', pollId)
    .single();

  if (!poll) {
    return { vote: null, error: new Error('Poll not found') };
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return { vote: null, error: new Error('Poll has expired') };
  }

  // Validate option index
  const options = poll.options as string[];
  if (optionIndex < 0 || optionIndex >= options.length) {
    return { vote: null, error: new Error('Invalid option index') };
  }

  // Submit the vote using a single atomic transaction
  // The SQL unique constraint (poll_id, user_id) provides a second layer of protection
  // If two votes are submitted simultaneously, one will fail due to the unique constraint
  // The .select().single() chain returns the inserted vote data for confirmation
  const { data: vote, error } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      user_id: userId,
      option_index: optionIndex
    })
    .select()
    .single();

  return { vote, error };
}

/**
 * Checks if a user has already voted on a specific poll.
 *
 * @param {string} pollId - ID of the poll
 * @param {string} userId - ID of the user
 * @returns {Promise<boolean>} True if user has voted, false otherwise
 * @throws {Error} When checking vote status fails
 *
 * @example
 * try {
 *   const hasVoted = await hasUserVoted('poll-123', 'user-123');
 *   console.log('User has voted:', hasVoted);
 * } catch (error) {
 *   console.error('Error checking vote status:', error.message);
 * }
 */
export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  const { data: vote, error } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return false;
  }

  return !!vote;
}

/**
 * Gets the vote results for a specific poll.
 * Returns the count of votes for each option.
 *
 * @param {string} pollId - ID of the poll
 * @returns {Promise<{ results: number[]; error: Error | null }>} Array of vote counts per option
 * @throws {Error} When fetching results fails
 *
 * @example
 * try {
 *   const { results, error } = await getPollResults('poll-123');
 *   if (error) throw error;
 *   console.log('Vote distribution:', results);
 * } catch (error) {
 *   console.error('Error fetching results:', error.message);
 * }
 */
export async function getPollResults(pollId: string) {
  const { data: votes, error } = await supabase
    .from('votes')
    .select('option_index')
    .eq('poll_id', pollId);

  if (error) {
    return { results: [], error };
  }

  // Get the poll to determine number of options
  const { data: poll } = await supabase
    .from('polls')
    .select('options')
    .eq('id', pollId)
    .single();

  if (!poll) {
    return { results: [], error: new Error('Poll not found') };
  }

  const options = poll.options as string[];
  const results = new Array(options.length).fill(0);

  // Count votes for each option
  votes?.forEach((vote) => {
    results[vote.option_index]++;
  });

  return { results, error: null };
}

/**
 * Sets up a real-time subscription to poll results.
 * Updates are received whenever a new vote is cast.
 *
 * @param {string} pollId - ID of the poll to subscribe to
 * @param {function} onUpdate - Callback function to handle updates
 * @returns {Promise<{ subscription: RealtimeSubscription | null; error: Error | null }>}
 * @throws {Error} When subscription setup fails
 *
 * @example
 * try {
 *   const { subscription, error } = await subscribeToResults('poll-123', (results) => {
 *     console.log('Updated results:', results);
 *   });
 *   if (error) throw error;
 * } catch (error) {
 *   console.error('Error setting up subscription:', error.message);
 * }
 */
export async function subscribeToResults(
  pollId: string,
  onUpdate: (results: number[]) => void
) {
  const subscription = supabase
    .channel(`poll_${pollId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `poll_id=eq.${pollId}`
      },
      async () => {
        // Fetch and send updated results
        const { results } = await getPollResults(pollId);
        onUpdate(results);
      }
    )
    .subscribe();

  return { subscription, error: null };
}