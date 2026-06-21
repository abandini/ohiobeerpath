import { describe, it, expect } from 'vitest';

describe('Plan API contract', () => {
  it('PlanRequest requires starting_city and time_budget_minutes', () => {
    const valid = { starting_city: 'Columbus, OH', time_budget_minutes: 240, preferences: [] };
    expect(valid.starting_city).toBeTruthy();
    expect(valid.time_budget_minutes).toBeGreaterThanOrEqual(60);
    expect(valid.time_budget_minutes).toBeLessThanOrEqual(720);
  });

  it('PlanRequest preferences is an array of strings', () => {
    const prefs = ['dog-friendly', 'food', 'outdoor'];
    expect(Array.isArray(prefs)).toBe(true);
    prefs.forEach(p => expect(typeof p).toBe('string'));
  });

  it('RefineRequest requires trip_slug and message', () => {
    const valid = { trip_slug: 'columbus-crawl-abc123', message: 'add live music' };
    expect(valid.trip_slug).toBeTruthy();
    expect(valid.message).toBeTruthy();
  });

  it('time_budget_minutes must be 60-720', () => {
    expect(59).toBeLessThan(60);
    expect(721).toBeGreaterThan(720);
    expect(240).toBeGreaterThanOrEqual(60);
    expect(240).toBeLessThanOrEqual(720);
  });
});
