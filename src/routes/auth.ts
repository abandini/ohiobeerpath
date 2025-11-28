/**
 * Authentication routes
 *
 * Handles Untappd OAuth flow and session management
 */
import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo,
  normalizeUntappdUser,
  generateState
} from '../services/untappd';
import { createSession, destroySession, getLogoutCookie, getSessionFromCookie } from '../services/session';
import { upsertFromUntappd } from '../db/users';
import { requireAuth, getCurrentUser } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/**
 * GET /api/auth/untappd
 * Initiates Untappd OAuth flow
 */
auth.get('/untappd', async (c) => {
  // Check if Untappd credentials are configured
  if (!c.env.UNTAPPD_CLIENT_ID || !c.env.UNTAPPD_CLIENT_SECRET) {
    return c.json({
      success: false,
      error: 'Untappd authentication not configured'
    }, 503);
  }

  // Generate state for CSRF protection
  const state = generateState();

  // Store state in KV with short TTL
  await c.env.CACHE.put(`oauth_state:${state}`, '1', { expirationTtl: 600 }); // 10 minutes

  // Get redirect URL from query or default to home
  const returnUrl = c.req.query('return') || '/';
  await c.env.CACHE.put(`oauth_return:${state}`, returnUrl, { expirationTtl: 600 });

  const authUrl = getAuthorizationUrl(c.env, state);
  return c.redirect(authUrl);
});

/**
 * GET /api/auth/untappd/callback
 * Handles Untappd OAuth callback
 */
auth.get('/untappd/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  // Handle user denial
  if (error) {
    return c.redirect('/?auth_error=denied');
  }

  if (!code) {
    return c.redirect('/?auth_error=no_code');
  }

  // Validate state
  if (state) {
    const storedState = await c.env.CACHE.get(`oauth_state:${state}`);
    if (!storedState) {
      return c.redirect('/?auth_error=invalid_state');
    }
    await c.env.CACHE.delete(`oauth_state:${state}`);
  }

  // Exchange code for token
  const tokenResult = await exchangeCodeForToken(c.env, code);
  if ('error' in tokenResult) {
    console.error('Token exchange error:', tokenResult.error);
    return c.redirect('/?auth_error=token_failed');
  }

  // Get user info
  const userResult = await getUserInfo(tokenResult.accessToken);
  if ('error' in userResult) {
    console.error('User info error:', userResult.error);
    return c.redirect('/?auth_error=user_failed');
  }

  // Upsert user in our database
  const untappdUser = normalizeUntappdUser(userResult.user);
  const user = await upsertFromUntappd(c.env.DB, untappdUser);

  // Create session
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
  const userAgent = c.req.header('User-Agent');
  const { cookie } = await createSession(
    c.env,
    user,
    tokenResult.accessToken,
    ipAddress,
    userAgent
  );

  // Get return URL
  let returnUrl = '/';
  if (state) {
    returnUrl = await c.env.CACHE.get(`oauth_return:${state}`) || '/';
    await c.env.CACHE.delete(`oauth_return:${state}`);
  }

  // Redirect with session cookie
  return new Response(null, {
    status: 302,
    headers: {
      'Location': returnUrl,
      'Set-Cookie': cookie
    }
  });
});

/**
 * POST /api/auth/logout
 * Destroys the current session
 */
auth.post('/logout', async (c) => {
  const session = await getSessionFromCookie(c.env, c.req.header('Cookie'));

  if (session) {
    await destroySession(c.env, session.id);
  }

  // For API requests, return JSON
  if (c.req.header('Accept')?.includes('application/json')) {
    return c.json({ success: true }, 200, {
      'Set-Cookie': getLogoutCookie()
    });
  }

  // For browser requests, redirect to home
  const returnUrl = c.req.query('return') || '/';
  return new Response(null, {
    status: 302,
    headers: {
      'Location': returnUrl,
      'Set-Cookie': getLogoutCookie()
    }
  });
});

/**
 * GET /api/auth/logout
 * Alternative logout endpoint for browser links
 */
auth.get('/logout', async (c) => {
  const session = await getSessionFromCookie(c.env, c.req.header('Cookie'));

  if (session) {
    await destroySession(c.env, session.id);
  }

  const returnUrl = c.req.query('return') || '/';
  return new Response(null, {
    status: 302,
    headers: {
      'Location': returnUrl,
      'Set-Cookie': getLogoutCookie()
    }
  });
});

/**
 * GET /api/auth/me
 * Returns current user info
 */
auth.get('/me', requireAuth, async (c) => {
  const user = getCurrentUser(c);

  return c.json({
    success: true,
    user: {
      id: user!.id,
      display_name: user!.display_name,
      avatar_url: user!.avatar_url,
      untappd_username: user!.untappd_username,
      privacy_default: user!.privacy_default,
      style_preference: user!.style_preference,
      photo_mode: user!.photo_mode
    }
  });
});

/**
 * GET /api/auth/status
 * Returns authentication status (works even if not logged in)
 */
auth.get('/status', async (c) => {
  const session = await getSessionFromCookie(c.env, c.req.header('Cookie'));

  if (!session) {
    return c.json({
      success: true,
      authenticated: false
    });
  }

  return c.json({
    success: true,
    authenticated: true,
    user_id: session.user_id
  });
});

export default auth;
