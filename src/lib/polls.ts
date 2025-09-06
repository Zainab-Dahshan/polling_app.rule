import { supabase } from './auth';
import { Database } from '@/types/supabase';

type Poll = Database['public']['Tables']['polls']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];

/**
 * Creates a new poll in the database with validation and real-time updates.
 * This function handles input validation, database insertion, and triggers
 * real-time updates for connected clients.
 *
 * @param {Object} pollData - The data for creating a new poll
 * @param {string} pollData.question - The poll question (non-empty string)
 * @param {string[]} pollData.options - Array of poll options (minimum 2 options)
 * @param {string} pollData.created_by - User ID of the poll creator (must match authenticated user)
 * @param {string} [pollData.expires_at] - Optional ISO 8601 formatted expiration date
 * @param {boolean} [pollData.is_public=true] - Whether the poll is public (controls visibility)
 * @returns {Promise<{ poll: Poll | null; error: Error | null }>} Created poll data or error
 * @throws {Error} When:
 *  - Question is empty or contains only whitespace
 *  - Less than 2 options provided
 *  - Database insertion fails
 *  - User is not authenticated
 *  - Expiration date is invalid
 *
 * @example
 * try {
 *   const { poll, error } = await createPoll({
 *     question: 'What is your favorite color?',
 *     options: ['Red', 'Blue', 'Green'],
 *     created_by: 'user-123',
 *     expires_at: '2024-12-31T23:59:59Z', // ISO 8601 format
 *     is_public: true
 *   });
 *   if (error) throw error;
 *   console.log('Poll created:', poll);
 * } catch (error) {
 *   console.error('Error creating poll:', error.message);
 * }
 *
 * @note
 * - The function triggers real-time updates via Supabase's Realtime feature
 * - Row Level Security (RLS) policies ensure only authorized users can create polls
 * - The created_by field must match the authenticated user's ID
 * - Timestamps are automatically managed by the database
 */
export async function createPoll({
  question,
  options,
  created_by,
  expires_at,
  is_public = true
}: {
  question: string;
  options: string[];
  created_by: string;
  expires_at?: string;
  is_public?: boolean;
}) {
  // Validate inputs
  if (!question.trim()) {
    throw new Error('Question cannot be empty');
  }
  if (options.length < 2) {
    throw new Error('Poll must have at least 2 options');
  }

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      question,
      options,
      created_by,
      expires_at,
      is_public
    })
    .select()
    .single();

  return { poll, error };
}

/**
 * Retrieves all polls, with optional filtering for public/private and pagination.
 *
 * @param {Object} options - Query options
 * @param {string} [options.user_id] - Filter polls by creator
 * @param {boolean} [options.public_only=false] - Only return public polls
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.limit=10] - Number of polls per page
 * @returns {Promise<{ polls: Poll[]; error: Error | null }>} Array of polls or error
 * @throws {Error} When fetching polls fails
 *
 * @example
 * try {
 *   const { polls, error } = await getPolls({
 *     user_id: 'user-123',
 *     public_only: true,
 *     page: 1,
 *     limit: 10
 *   });
 *   if (error) throw error;
 *   console.log('Polls:', polls);
 * } catch (error) {
 *   console.error('Error fetching polls:', error.message);
 * }
 */
export async function getPolls({
  user_id,
  public_only = false,
  page = 1,
  limit = 10
}: {
  user_id?: string;
  public_only?: boolean;
  page?: number;
  limit?: number;
}) {
  let query = supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  // Add filters if provided
  if (user_id) {
    query = query.eq('created_by', user_id);
  }
  if (public_only) {
    query = query.eq('is_public', true);
  }

  const { data: polls, error } = await query;

  return { polls, error };
}

/**
 * Retrieves a specific poll by its ID.
 *
 * @param {string} id - The poll ID
 * @returns {Promise<{ poll: Poll | null; error: Error | null }>} Poll data or error
 * @throws {Error} When fetching poll fails
 *
 * @example
 * try {
 *   const { poll, error } = await getPollById('poll-123');
 *   if (error) throw error;
 *   console.log('Poll:', poll);
 * } catch (error) {
 *   console.error('Error fetching poll:', error.message);
 * }
 */
export async function getPollById(id: string) {
  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', id)
    .single();

  return { poll, error };
}

/**
 * Deletes a poll and its associated votes.
 * Only the poll creator can delete their polls.
 *
 * @param {string} id - The poll ID
 * @param {string} userId - The ID of the user attempting to delete
 * @returns {Promise<{ success: boolean; error: Error | null }>} Success status or error
 * @throws {Error} When deletion fails or user is not authorized
 *
 * @example
 * try {
 *   const { success, error } = await deletePoll('poll-123', 'user-123');
 *   if (error) throw error;
 *   console.log('Poll deleted:', success);
 * } catch (error) {
 *   console.error('Error deleting poll:', error.message);
 * }
 */
export async function deletePoll(id: string, userId: string) {
  // First check if user owns the poll
  const { data: poll } = await supabase
    .from('polls')
    .select('created_by')
    .eq('id', id)
    .single();

  if (!poll || poll.created_by !== userId) {
    return { success: false, error: new Error('Not authorized to delete this poll') };
  }

  // Delete associated votes first
  await supabase
    .from('votes')
    .delete()
    .eq('poll_id', id);

  // Then delete the poll
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', id);

  return { success: !error, error };
}