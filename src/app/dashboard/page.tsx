'use client';import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPolls, deletePoll } from '@/lib/polls';
import { getPollResults, subscribeToResults } from '@/lib/votes';
type Database = {
  id: string;
  user_id: string;
  question: string;
  options: string[];
  created_at: string;
  results?: number[];
}

type Poll = {
  id: string;
  user_id: string;
  question: string;
  options: string[];
  created_at: string;
};

interface PollWithResults extends Poll {
  results?: number[];
}

/**
 * UserDashboard Component
 * Displays a user's created polls and voting history.
 * Includes real-time updates and poll management features.
 *
 * @component
 * @example
 * return (
 *   <UserDashboard />
 * )
 */
export default function UserDashboard() {
  const router = useRouter();
  const [polls, setPolls] = useState<PollWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Fetches user's polls from the database.
   * Updates the polls state with the fetched data.
   *
   * @async
   * @function fetchUserPolls
   * @throws {Error} When fetching polls fails
   */
  const fetchUserPolls = useCallback(async () => {
    try {
      if (!userId) return;

      const { polls: userPolls, error } = await getPolls({
        user_id: userId,
        page: 1,
        limit: 10
      });

      if (error) throw error;
      
      // Fetch results for each poll
      const pollsWithResults = await Promise.all(
        (userPolls || []).map(async (poll: Database) => {
          const { results } = await getPollResults(poll.id);
          return { ...poll, results };
        })
      );      
      setPolls(pollsWithResults);
    } catch (err) {
      setError('Failed to fetch polls');
      console.error('Error fetching polls:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Handles poll deletion.
   * Removes the poll from the database and updates the UI.
   *
   * @async
   * @function handleDeletePoll
   * @param {string} pollId - ID of the poll to delete
   * @throws {Error} When poll deletion fails
   */
  const handleDeletePoll = async (pollId: string) => {
    try {
      if (!userId) return;

      const { success, error } = await deletePoll(pollId, userId);
      if (error) throw error;

      if (success) {
        // Remove the deleted poll from state
        setPolls(polls.filter(poll => poll.id !== pollId));
      }
    } catch (err) {
      setError('Failed to delete poll');
      console.error('Error deleting poll:', err);
    }
  };

  // Check authentication and fetch polls on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { session, error } = await getSession();
      
      if (error || !session) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
    };

    checkAuth();
  }, [router]);

  // Fetch polls when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserPolls();
    }
  }, [userId, fetchUserPolls]);

  // Set up real-time vote updates for each poll
  useEffect(() => {
    const subscriptions = polls.map(async (poll) => {
      const { subscription } = await subscribeToResults(poll.id, (results) => {
        setPolls(currentPolls => 
          currentPolls.map(p => 
            p.id === poll.id ? { ...p, results } : p
          )
        );
      });
      return subscription;
    });

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(async (subscriptionPromise) => {
        const subscription = await subscriptionPromise;
        if (subscription) {
          subscription.unsubscribe();
        }
      });
    };
  }, [polls]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Polls</h1>
      
      {polls.length === 0 ? (
        <p className="text-gray-500">
          You haven&apos;t created any polls yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-4">{poll.question}</h2>
              
              <div className="space-y-2 mb-4">
                {(poll.options as string[]).map((option, index) => {
                  const votes = poll.results?.[index] || 0;
                  const totalVotes = poll.results?.reduce((sum, count) => sum + count, 0) || 0;
                  const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(1) : '0';
                  
                  return (
                    <div key={index} className="flex justify-between items-center text-gray-600">
                      <span>{option}</span>
                      <span className="text-sm">
                        {votes} votes ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  Created: {new Date(poll.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDeletePoll(poll.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/polls/new')}
        className="mt-8 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
      >
        Create New Poll
      </button>
    </div>
  );
}
