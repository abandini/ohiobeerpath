/**
 * Session management using Cloudflare KV
 */
import type { Env, UserSession, User } from '../types';
import { getUserById } from '../db/users';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_COOKIE_NAME = 'bt_session';

interface SessionData {
  userId: string;
  untappdToken?: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createSession(
  env: Env,
  user: User,
  untappdToken?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ sessionId: string; cookie: string }> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  const sessionData: SessionData = {
    userId: user.id,
    untappdToken,
    expiresAt,
    ipAddress,
    userAgent
  };

  // Store in KV
  await env.SESSIONS.put(
    `session:${sessionId}`,
    JSON.stringify(sessionData),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  // Also store in D1 for audit trail
  await env.DB.prepare(`
    INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sessionId, user.id, expiresAt, ipAddress || null, userAgent || null).run();

  // Generate secure cookie
  const cookie = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');

  return { sessionId, cookie };
}

export async function getSession(
  env: Env,
  sessionId: string
): Promise<UserSession | null> {
  const data = await env.SESSIONS.get(`session:${sessionId}`);
  if (!data) return null;

  const session: SessionData = JSON.parse(data);

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    await destroySession(env, sessionId);
    return null;
  }

  return {
    id: sessionId,
    user_id: session.userId,
    untappd_token: session.untappdToken,
    expires_at: session.expiresAt,
    ip_address: session.ipAddress,
    user_agent: session.userAgent
  };
}

export async function getSessionFromCookie(
  env: Env,
  cookieHeader: string | null | undefined
): Promise<UserSession | null> {
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;

  return getSession(env, sessionId);
}

export async function getUserFromSession(
  env: Env,
  session: UserSession
): Promise<User | null> {
  return getUserById(env.DB, session.user_id);
}

export async function destroySession(env: Env, sessionId: string): Promise<void> {
  await env.SESSIONS.delete(`session:${sessionId}`);
  await env.DB.prepare(
    'DELETE FROM user_sessions WHERE id = ?'
  ).bind(sessionId).run();
}

export function getLogoutCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');
}

export async function extendSession(
  env: Env,
  sessionId: string
): Promise<void> {
  const data = await env.SESSIONS.get(`session:${sessionId}`);
  if (!data) return;

  const session: SessionData = JSON.parse(data);
  session.expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  await env.SESSIONS.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  await env.DB.prepare(
    'UPDATE user_sessions SET expires_at = ? WHERE id = ?'
  ).bind(session.expiresAt, sessionId).run();
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(part => {
    const [key, value] = part.trim().split('=');
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
}
