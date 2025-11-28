/**
 * Authentication middleware
 *
 * Handles session validation and user context
 */
import type { Context, Next } from 'hono';
import type { Env, AppVariables } from '../types';
import { getSessionFromCookie, getUserFromSession, extendSession } from '../services/session';

/**
 * Optional auth middleware - populates user if logged in, but doesn't require it
 */
export async function optionalAuth(c: Context<{ Bindings: Env; Variables: AppVariables }>, next: Next) {
  const cookieHeader = c.req.header('Cookie');
  const session = await getSessionFromCookie(c.env, cookieHeader);

  if (session) {
    const user = await getUserFromSession(c.env, session);
    if (user) {
      c.set('session', session);
      c.set('user', user);

      // Extend session on activity
      await extendSession(c.env, session.id);
    }
  }

  await next();
}

/**
 * Required auth middleware - returns 401 if not logged in
 */
export async function requireAuth(c: Context<{ Bindings: Env; Variables: AppVariables }>, next: Next) {
  const cookieHeader = c.req.header('Cookie');
  const session = await getSessionFromCookie(c.env, cookieHeader);

  if (!session) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const user = await getUserFromSession(c.env, session);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 401);
  }

  c.set('session', session);
  c.set('user', user);

  // Extend session on activity
  await extendSession(c.env, session.id);

  await next();
}

/**
 * Helper to get the current user (null if not logged in)
 */
export function getCurrentUser(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  return c.get('user') || null;
}

/**
 * Helper to check if user is logged in
 */
export function isAuthenticated(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  return !!c.get('user');
}
