/**
 * Untappd OAuth integration
 *
 * OAuth Flow:
 * 1. Redirect user to Untappd authorization URL
 * 2. User authorizes and Untappd redirects back with code
 * 3. Exchange code for access token
 * 4. Use access token to get user info
 */
import type { Env } from '../types';

const UNTAPPD_AUTH_URL = 'https://untappd.com/oauth/authenticate';
const UNTAPPD_TOKEN_URL = 'https://untappd.com/oauth/authorize';
const UNTAPPD_API_BASE = 'https://api.untappd.com/v4';

interface UntappdUser {
  uid: number;
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  user_avatar: string;
  user_avatar_hd?: string;
  location?: string;
  bio?: string;
  stats?: {
    total_badges: number;
    total_friends: number;
    total_checkins: number;
    total_beers: number;
  };
}

interface UntappdTokenResponse {
  meta: {
    http_code: number;
    error_detail?: string;
  };
  response: {
    access_token: string;
  };
}

interface UntappdUserResponse {
  meta: {
    http_code: number;
    error_detail?: string;
  };
  response: {
    user: UntappdUser;
  };
}

export function getAuthorizationUrl(env: Env, state?: string): string {
  const params = new URLSearchParams({
    client_id: env.UNTAPPD_CLIENT_ID || '',
    response_type: 'code',
    redirect_url: env.UNTAPPD_REDIRECT_URI || ''
  });

  if (state) {
    params.set('state', state);
  }

  return `${UNTAPPD_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  env: Env,
  code: string
): Promise<{ accessToken: string } | { error: string }> {
  const params = new URLSearchParams({
    client_id: env.UNTAPPD_CLIENT_ID || '',
    client_secret: env.UNTAPPD_CLIENT_SECRET || '',
    response_type: 'code',
    redirect_url: env.UNTAPPD_REDIRECT_URI || '',
    code
  });

  try {
    const response = await fetch(`${UNTAPPD_TOKEN_URL}?${params.toString()}`);
    const data = await response.json() as UntappdTokenResponse;

    if (data.meta.http_code !== 200 || !data.response?.access_token) {
      return { error: data.meta.error_detail || 'Failed to get access token' };
    }

    return { accessToken: data.response.access_token };
  } catch (error) {
    console.error('Untappd token exchange error:', error);
    return { error: 'Failed to communicate with Untappd' };
  }
}

export async function getUserInfo(
  accessToken: string
): Promise<{ user: UntappdUser } | { error: string }> {
  try {
    const response = await fetch(
      `${UNTAPPD_API_BASE}/user/info?access_token=${accessToken}`
    );
    const data = await response.json() as UntappdUserResponse;

    if (data.meta.http_code !== 200 || !data.response?.user) {
      return { error: data.meta.error_detail || 'Failed to get user info' };
    }

    return { user: data.response.user };
  } catch (error) {
    console.error('Untappd user info error:', error);
    return { error: 'Failed to get user info from Untappd' };
  }
}

// Convert Untappd user to our format
export function normalizeUntappdUser(user: UntappdUser) {
  return {
    id: String(user.uid),
    user_name: user.user_name,
    first_name: user.first_name,
    last_name: user.last_name,
    user_avatar: user.user_avatar_hd || user.user_avatar
  };
}

// Generate state token for CSRF protection
export function generateState(): string {
  return crypto.randomUUID();
}

// Validate state token
export async function validateState(
  env: Env,
  state: string,
  storedState: string | null
): Promise<boolean> {
  return state === storedState;
}
