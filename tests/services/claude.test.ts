import { describe, it, expect } from 'vitest';
import { buildTripPrompt, buildRefinePrompt } from '../../src/services/claude';

describe('buildTripPrompt', () => {
  it('includes starting city and budget', () => {
    const prompt = buildTripPrompt(
      { starting_city: 'Columbus, OH', time_budget_minutes: 240, preferences: [] },
      [{ id: 1, name: 'Test Brewery', city: 'Columbus', state: 'OH', latitude: 40, longitude: -83, amenities: [] }]
    );
    expect(prompt).toContain('Columbus, OH');
    expect(prompt).toContain('240 minutes');
  });

  it('includes preferences and amenities', () => {
    const prompt = buildTripPrompt(
      { starting_city: 'Columbus, OH', time_budget_minutes: 240, preferences: ['dog-friendly', 'food'] },
      [{ id: 1, name: 'Test Brewery', city: 'Columbus', state: 'OH', latitude: 40, longitude: -83, amenities: ['dog-friendly', 'food'] }]
    );
    expect(prompt).toContain('dog-friendly, food');
    expect(prompt).toContain('amenities: dog-friendly, food');
  });
});

describe('buildRefinePrompt', () => {
  it('includes current route and user message', () => {
    const prompt = buildRefinePrompt(
      {
        stops: [{
          brewery_id: 1, name: 'Test', city: 'Columbus', state: 'OH',
          latitude: 40, longitude: -83, amenities: [],
          drive_minutes_from_prev: 0, drive_miles_from_prev: 0, stop_duration_minutes: 45,
        }],
        total_drive_minutes: 0, total_drive_miles: 0, total_brewery_time_minutes: 45,
      },
      'add live music',
      []
    );
    expect(prompt).toContain('Test, Columbus');
    expect(prompt).toContain('add live music');
  });
});
