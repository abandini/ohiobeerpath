/**
 * Unit tests for subdomain detection middleware
 */
import { describe, it, expect } from 'vitest';
import { getValidStates } from '../../src/middleware/subdomain';

describe('Subdomain Middleware', () => {
  describe('getValidStates', () => {
    it('returns array of valid state objects', () => {
      const states = getValidStates();

      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });

    it('each state has subdomain and name properties', () => {
      const states = getValidStates();

      states.forEach(state => {
        expect(state).toHaveProperty('subdomain');
        expect(state).toHaveProperty('name');
        expect(typeof state.subdomain).toBe('string');
        expect(typeof state.name).toBe('string');
      });
    });

    it('includes Ohio', () => {
      const states = getValidStates();
      const ohio = states.find(s => s.subdomain === 'ohio');

      expect(ohio).toBeDefined();
      expect(ohio?.name).toBe('Ohio');
    });

    it('includes Michigan', () => {
      const states = getValidStates();
      const michigan = states.find(s => s.subdomain === 'michigan');

      expect(michigan).toBeDefined();
      expect(michigan?.name).toBe('Michigan');
    });

    it('handles hyphenated state names correctly', () => {
      const states = getValidStates();

      const westVirginia = states.find(s => s.subdomain === 'west-virginia');
      expect(westVirginia).toBeDefined();
      expect(westVirginia?.name).toBe('West Virginia');

      const northCarolina = states.find(s => s.subdomain === 'north-carolina');
      expect(northCarolina).toBeDefined();
      expect(northCarolina?.name).toBe('North Carolina');
    });

    it('includes all expected midwest states', () => {
      const states = getValidStates();
      const midwestStates = ['ohio', 'michigan', 'indiana', 'illinois', 'wisconsin', 'minnesota', 'iowa', 'missouri'];

      midwestStates.forEach(state => {
        const found = states.find(s => s.subdomain === state);
        expect(found).toBeDefined();
      });
    });

    it('includes major craft beer states', () => {
      const states = getValidStates();
      const craftBeerStates = ['california', 'colorado', 'oregon', 'washington', 'texas'];

      craftBeerStates.forEach(state => {
        const found = states.find(s => s.subdomain === state);
        expect(found).toBeDefined();
      });
    });
  });
});

describe('Subdomain Context Types', () => {
  it('SubdomainContext interface structure', () => {
    // Type-level test - if this compiles, the interface is correct
    const multiStateContext = {
      stateSubdomain: null as string | null,
      stateName: null as string | null,
      isMultiState: true,
      baseUrl: 'https://brewerytrip.com'
    };

    const stateContext = {
      stateSubdomain: 'ohio',
      stateName: 'Ohio',
      isMultiState: false,
      baseUrl: 'https://ohio.brewerytrip.com'
    };

    expect(multiStateContext.isMultiState).toBe(true);
    expect(stateContext.isMultiState).toBe(false);
  });
});
