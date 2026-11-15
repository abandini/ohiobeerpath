// "On tap" lists for brewery pages.
//
// The lists live in the beerthirty-intake Worker (breweries text a photo of their board; the owner
// approves the reading). This module fetches a brewery's current approved list server-side, so the
// browser never calls the intake API and no CORS is involved.
//
// Rules: a short timeout, a short in-memory cache, and every failure means "no list" - a slow or
// broken intake API must never break or noticeably slow a brewery page. The answer is treated as
// untrusted data: shapes, lengths and counts are checked here and everything is escaped at render.
// Nothing here depends on who is asking, so nothing user-specific is cached.

import type { Env } from '../types';

export const DEFAULT_TAPLIST_API_URL = 'https://beerthirty-intake.bill-burkey.workers.dev';
export const TAPLIST_TIMEOUT_MS = 1200;
export const TAPLIST_CACHE_MS = 5 * 60 * 1000;      // a good answer (a list, or "none") is reused this long
export const TAPLIST_FAILURE_CACHE_MS = 60 * 1000;  // after a failure, do not ask again for this long
export const DEFAULT_STALE_AFTER_DAYS = 21;
const MAX_BEERS = 60;
const MAX_BODY_CHARS = 100_000;
const DEFAULT_SOURCE = "From a photo of the brewery's board, texted by the brewery";

export interface TapBeer {
  name: string;
  style: string | null;
  abv: number | null;
  notes: string | null;
}

export interface TapList {
  beers: TapBeer[];
  updatedAt: string; // ISO time the photo arrived
  stale: boolean;    // older than the intake's stale_after_days: label it, do not present it as current
  source: string;
}

interface Cached<T> { value: T; until: number }
let indexCache: Cached<Map<string, string> | null> | null = null;
const listCache = new Map<string, Cached<TapList | null>>();

/** Test hook: forget everything cached in this isolate. */
export function resetTapListCache(): void {
  indexCache = null;
  listCache.clear();
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const s = value.replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}]/gu, ' ').replace(/\s+/g, ' ').trim();
  const cut = [...s].slice(0, max).join('').trim();
  return cut === '' ? null : cut;
}

/** Check one intake answer. Returns null for anything that is not a usable list. */
export function parseTapList(raw: unknown, now: number = Date.now()): TapList | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.updated_at !== 'string' || r.updated_at.length > 40) return null;
  const updated = Date.parse(r.updated_at);
  if (!Number.isFinite(updated) || updated > now + 86_400_000) return null;
  if (!Array.isArray(r.beers)) return null;

  const beers: TapBeer[] = [];
  for (const item of r.beers.slice(0, MAX_BEERS)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const b = item as Record<string, unknown>;
    const name = text(b.name, 80);
    if (!name) continue;
    const abv = typeof b.abv === 'number' && Number.isFinite(b.abv) && b.abv >= 0 && b.abv <= 30 ? Math.round(b.abv * 100) / 100 : null;
    beers.push({ name, style: text(b.style, 80), abv, notes: text(b.notes, 120) });
  }
  if (beers.length === 0) return null;

  const days = typeof r.stale_after_days === 'number' && r.stale_after_days >= 1 && r.stale_after_days <= 365 ? r.stale_after_days : DEFAULT_STALE_AFTER_DAYS;
  // Stale if the intake says so, or if our own clock says so (a cached answer can cross the line).
  const stale = r.stale === true || now - updated > days * 86_400_000;
  return { beers, updatedAt: new Date(updated).toISOString(), stale, source: text(r.source, 160) ?? DEFAULT_SOURCE };
}

function baseUrl(env: Env): string | null {
  try {
    const u = new URL((env.TAPLIST_API_URL || DEFAULT_TAPLIST_API_URL).trim());
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    return u.origin;
  } catch {
    return null;
  }
}

/** GET one intake path. Returns the parsed JSON, 'none' for a 404, or 'failed'. Never throws. */
async function getJson(env: Env, path: string): Promise<unknown | 'none' | 'failed'> {
  const base = baseUrl(env);
  if (!base) return 'failed';
  try {
    const init: RequestInit = { method: 'GET', redirect: 'manual', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TAPLIST_TIMEOUT_MS) };
    // Optional service binding (TAPLIST_API) for the case where Worker-to-Worker fetches by URL are not routed.
    const res = env.TAPLIST_API ? await env.TAPLIST_API.fetch(`${base}${path}`, init) : await fetch(`${base}${path}`, init);
    if (res.status === 404) return 'none';
    if (res.status !== 200) return 'failed';
    const body = await res.text();
    if (body.length > MAX_BODY_CHARS) return 'failed';
    return JSON.parse(body);
  } catch {
    return 'failed';
  }
}

/** Brewery ids that have a current list. Null when the intake could not be reached. */
async function getIndex(env: Env, now: number): Promise<Map<string, string> | null> {
  if (indexCache && indexCache.until > now) return indexCache.value;
  const raw = await getJson(env, '/api/taplists');
  let value: Map<string, string> | null = null;
  if (raw !== 'failed' && raw !== 'none' && raw && typeof raw === 'object' && Array.isArray((raw as { taplists?: unknown }).taplists)) {
    value = new Map();
    for (const row of ((raw as { taplists: unknown[] }).taplists).slice(0, 5000)) {
      const r = row as { brewery_key?: unknown; updated_at?: unknown } | null;
      if (r && typeof r.brewery_key === 'string' && /^[1-9][0-9]{0,8}$/.test(r.brewery_key)) value.set(r.brewery_key, String(r.updated_at ?? ''));
    }
  }
  indexCache = { value, until: now + (value ? TAPLIST_CACHE_MS : TAPLIST_FAILURE_CACHE_MS) };
  return value;
}

/**
 * The breweries that have a current list, newest first. Null when the intake could not be reached,
 * so a caller can tell "no lists" (an empty array) from "could not ask". Uses the same cached index
 * as getTapList. Never throws.
 */
export async function listTapLists(env: Env, now: number = Date.now()): Promise<{ breweryId: number; updatedAt: string | null }[] | null> {
  try {
    const index = await getIndex(env, now);
    if (!index) return null;
    const rows = [...index].map(([key, updated]) => {
      const t = updated.length <= 40 ? Date.parse(updated) : NaN;
      return { breweryId: Number(key), updatedAt: Number.isFinite(t) && t <= now + 86_400_000 ? new Date(t).toISOString() : null };
    });
    return rows.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.breweryId - b.breweryId);
  } catch {
    return null;
  }
}

/**
 * The current approved tap list for a brewery, or null (none, not reachable, too slow, malformed).
 * Never throws. Most breweries have no list, and for them this costs no request at all: the index of
 * breweries that do have one is fetched once and reused for five minutes.
 */
export async function getTapList(env: Env, breweryId: number, now: number = Date.now()): Promise<TapList | null> {
  try {
    if (!Number.isInteger(breweryId) || breweryId < 1) return null;
    const key = String(breweryId);
    const index = await getIndex(env, now);
    if (!index || !index.has(key)) return null;

    const hit = listCache.get(key);
    if (hit && hit.until > now) return hit.value;
    const raw = await getJson(env, `/api/taplist/${key}`);
    const value = raw === 'failed' || raw === 'none' ? null : parseTapList(raw, now);
    if (listCache.size > 500) listCache.clear();
    listCache.set(key, { value, until: now + (raw === 'failed' ? TAPLIST_FAILURE_CACHE_MS : TAPLIST_CACHE_MS) });
    return value;
  } catch {
    return null;
  }
}
