import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Authentication service for handling user authentication operations using Supabase.
 * This service provides methods for user registration, login, logout, and session management.
 *
 * @module AuthService
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the Supabase client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Signs up a new user with email and password.
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's chosen password
 * @returns {Promise<{ user: User | null; error: Error | null }>} Object containing user data or error
 * @throws {Error} When signup fails due to invalid credentials or network issues
 *
 * @example
 * try {
 *   const { user, error } = await signUp('user@example.com', 'password123');
 *   if (error) throw error;
 *   console.log('Signed up successfully:', user);
 * } catch (error) {
 *   console.error('Error signing up:', error.message);
 * }
 */
export async function signUp(email: string, password: string) {
  // Validate email format before attempting signup
  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { user: data.user, error };
}

/**
 * Signs in an existing user with email and password.
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<{ user: User | null; error: Error | null }>} Object containing user data or error
 * @throws {Error} When login fails due to invalid credentials or network issues
 *
 * @example
 * try {
 *   const { user, error } = await signIn('user@example.com', 'password123');
 *   if (error) throw error;
 *   console.log('Signed in successfully:', user);
 * } catch (error) {
 *   console.error('Error signing in:', error.message);
 * }
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, error };
}

/**
 * Signs out the currently authenticated user.
 *
 * @returns {Promise<{ error: Error | null }>} Object containing any error that occurred
 * @throws {Error} When signout fails due to network issues or invalid session
 *
 * @example
 * try {
 *   const { error } = await signOut();
 *   if (error) throw error;
 *   console.log('Signed out successfully');
 * } catch (error) {
 *   console.error('Error signing out:', error.message);
 * }
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Gets the current session if it exists.
 * This is useful for checking if a user is authenticated and getting their data.
 *
 * @returns {Promise<{ session: Session | null; error: Error | null }>} Object containing session data or error
 * @throws {Error} When session retrieval fails due to network issues
 *
 * @example
 * try {
 *   const { session, error } = await getSession();
 *   if (error) throw error;
 *   if (session) {
 *     console.log('Current user:', session.user);
 *   } else {
 *     console.log('No active session');
 *   }
 * } catch (error) {
 *   console.error('Error getting session:', error.message);
 * }
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}