/**
 * User API routes
 */
import { Hono } from 'hono';
import type { Env, AppVariables, User } from '../types';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { updateUser } from '../db/users';

const users = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/**
 * GET /api/users/me
 * Get current user info
 */
users.get('/me', requireAuth, (c) => {
  const user = getCurrentUser(c)!;
  return c.json({ success: true, user });
});

/**
 * PUT /api/users/me/settings
 * Update user settings
 */
users.put('/me/settings', requireAuth, async (c) => {
  const user = getCurrentUser(c)!;

  try {
    const body = await c.req.json();
    const updates: Partial<User> = {};

    // Validate and set display name
    if (body.display_name !== undefined) {
      const name = String(body.display_name).trim();
      if (name.length > 100) {
        return c.json({ success: false, error: 'Display name too long' }, 400);
      }
      updates.display_name = name || undefined;
    }

    // Validate and set style preference
    if (body.style_preference !== undefined) {
      const valid = ['simple', 'comprehensive'];
      if (!valid.includes(body.style_preference)) {
        return c.json({ success: false, error: 'Invalid style preference' }, 400);
      }
      updates.style_preference = body.style_preference;
    }

    // Validate and set photo mode
    if (body.photo_mode !== undefined) {
      const valid = ['single', 'multiple'];
      if (!valid.includes(body.photo_mode)) {
        return c.json({ success: false, error: 'Invalid photo mode' }, 400);
      }
      updates.photo_mode = body.photo_mode;
    }

    // Validate and set privacy default
    if (body.privacy_default !== undefined) {
      const valid = ['public', 'private', 'ask'];
      if (!valid.includes(body.privacy_default)) {
        return c.json({ success: false, error: 'Invalid privacy setting' }, 400);
      }
      updates.privacy_default = body.privacy_default;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ success: false, error: 'No valid updates provided' }, 400);
    }

    const updatedUser = await updateUser(c.env.DB, user.id, updates);

    if (!updatedUser) {
      return c.json({ success: false, error: 'Failed to update settings' }, 500);
    }

    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update settings error:', error);
    return c.json({ success: false, error: 'Failed to update settings' }, 500);
  }
});

/**
 * POST /api/users/me/settings (form submit handler)
 * Update user settings from form post
 */
users.post('/me/settings', requireAuth, async (c) => {
  const user = getCurrentUser(c)!;

  try {
    const formData = await c.req.formData();
    const updates: Partial<User> = {};

    // Get form fields
    const displayName = formData.get('display_name');
    const stylePreference = formData.get('style_preference');
    const photoMode = formData.get('photo_mode');
    const privacyDefault = formData.get('privacy_default');

    if (displayName !== null) {
      const name = String(displayName).trim();
      if (name.length > 100) {
        return c.redirect('/settings?error=name_too_long');
      }
      updates.display_name = name || undefined;
    }

    if (stylePreference !== null) {
      const valid = ['simple', 'comprehensive'];
      if (valid.includes(String(stylePreference))) {
        updates.style_preference = String(stylePreference) as 'simple' | 'comprehensive';
      }
    }

    if (photoMode !== null) {
      const valid = ['single', 'multiple'];
      if (valid.includes(String(photoMode))) {
        updates.photo_mode = String(photoMode) as 'single' | 'multiple';
      }
    }

    if (privacyDefault !== null) {
      const valid = ['public', 'private', 'ask'];
      if (valid.includes(String(privacyDefault))) {
        updates.privacy_default = String(privacyDefault) as 'public' | 'private' | 'ask';
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateUser(c.env.DB, user.id, updates);
    }

    return c.redirect('/profile?updated=1');
  } catch (error) {
    console.error('Update settings form error:', error);
    return c.redirect('/settings?error=1');
  }
});

export default users;
