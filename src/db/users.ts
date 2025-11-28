/**
 * User database operations
 */
import type { User } from '../types';

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(id).first<User>();
  return result || null;
}

export async function getUserByUntappdId(db: D1Database, untappdId: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT * FROM users WHERE untappd_id = ?'
  ).bind(untappdId).first<User>();
  return result || null;
}

export async function createUser(db: D1Database, user: Partial<User> & { id: string }): Promise<User> {
  await db.prepare(`
    INSERT INTO users (id, untappd_id, untappd_username, display_name, avatar_url, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    user.untappd_id || null,
    user.untappd_username || null,
    user.display_name || null,
    user.avatar_url || null,
    user.email || null
  ).run();

  return (await getUserById(db, user.id))!;
}

export async function updateUser(
  db: D1Database,
  id: string,
  updates: Partial<Pick<User, 'display_name' | 'avatar_url' | 'email' | 'privacy_default' | 'style_preference' | 'photo_mode'>>
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.display_name);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatar_url);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.privacy_default !== undefined) {
    fields.push('privacy_default = ?');
    values.push(updates.privacy_default);
  }
  if (updates.style_preference !== undefined) {
    fields.push('style_preference = ?');
    values.push(updates.style_preference);
  }
  if (updates.photo_mode !== undefined) {
    fields.push('photo_mode = ?');
    values.push(updates.photo_mode);
  }

  if (fields.length === 0) return getUserById(db, id);

  values.push(id);
  await db.prepare(`
    UPDATE users SET ${fields.join(', ')} WHERE id = ?
  `).bind(...values).run();

  return getUserById(db, id);
}

export async function updateLastLogin(db: D1Database, id: string): Promise<void> {
  await db.prepare(
    "UPDATE users SET last_login = datetime('now') WHERE id = ?"
  ).bind(id).run();
}

export async function upsertFromUntappd(
  db: D1Database,
  untappdUser: {
    id: string;
    user_name: string;
    first_name?: string;
    last_name?: string;
    user_avatar?: string;
  }
): Promise<User> {
  const existing = await getUserByUntappdId(db, untappdUser.id);

  if (existing) {
    // Update last login and any changed fields
    await db.prepare(`
      UPDATE users SET
        untappd_username = ?,
        display_name = COALESCE(?, display_name),
        avatar_url = COALESCE(?, avatar_url),
        last_login = datetime('now')
      WHERE untappd_id = ?
    `).bind(
      untappdUser.user_name,
      untappdUser.first_name ? `${untappdUser.first_name} ${untappdUser.last_name || ''}`.trim() : null,
      untappdUser.user_avatar,
      untappdUser.id
    ).run();

    return (await getUserByUntappdId(db, untappdUser.id))!;
  }

  // Create new user
  const userId = crypto.randomUUID();
  const displayName = untappdUser.first_name
    ? `${untappdUser.first_name} ${untappdUser.last_name || ''}`.trim()
    : untappdUser.user_name;

  return createUser(db, {
    id: userId,
    untappd_id: untappdUser.id,
    untappd_username: untappdUser.user_name,
    display_name: displayName,
    avatar_url: untappdUser.user_avatar
  });
}
