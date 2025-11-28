import { MiddlewareHandler } from 'hono';
import type { Env } from '../types';

// Valid US state subdomains with name and abbreviation
interface StateInfo {
  name: string;
  abbreviation: string;
}

export const VALID_STATES: Record<string, StateInfo> = {
  'ohio': { name: 'Ohio', abbreviation: 'OH' },
  'michigan': { name: 'Michigan', abbreviation: 'MI' },
  'indiana': { name: 'Indiana', abbreviation: 'IN' },
  'kentucky': { name: 'Kentucky', abbreviation: 'KY' },
  'pennsylvania': { name: 'Pennsylvania', abbreviation: 'PA' },
  'west-virginia': { name: 'West Virginia', abbreviation: 'WV' },
  'new-york': { name: 'New York', abbreviation: 'NY' },
  'illinois': { name: 'Illinois', abbreviation: 'IL' },
  'wisconsin': { name: 'Wisconsin', abbreviation: 'WI' },
  'minnesota': { name: 'Minnesota', abbreviation: 'MN' },
  'iowa': { name: 'Iowa', abbreviation: 'IA' },
  'missouri': { name: 'Missouri', abbreviation: 'MO' },
  'tennessee': { name: 'Tennessee', abbreviation: 'TN' },
  'north-carolina': { name: 'North Carolina', abbreviation: 'NC' },
  'virginia': { name: 'Virginia', abbreviation: 'VA' },
  'maryland': { name: 'Maryland', abbreviation: 'MD' },
  'california': { name: 'California', abbreviation: 'CA' },
  'colorado': { name: 'Colorado', abbreviation: 'CO' },
  'oregon': { name: 'Oregon', abbreviation: 'OR' },
  'washington': { name: 'Washington', abbreviation: 'WA' },
  'texas': { name: 'Texas', abbreviation: 'TX' },
  'florida': { name: 'Florida', abbreviation: 'FL' },
  'georgia': { name: 'Georgia', abbreviation: 'GA' },
  'arizona': { name: 'Arizona', abbreviation: 'AZ' },
  'nevada': { name: 'Nevada', abbreviation: 'NV' },
};

export interface SubdomainContext {
  stateSubdomain: string | null;  // e.g., "ohio" or null for main domain
  stateName: string | null;       // e.g., "Ohio" or null for multi-state
  stateAbbreviation: string | null; // e.g., "OH" or null for multi-state
  isMultiState: boolean;          // true if on main brewerytrip.com
  baseUrl: string;                // The full base URL for links
}

export const subdomainMiddleware = (): MiddlewareHandler<{ Bindings: Env; Variables: { subdomain: SubdomainContext } }> => {
  return async (c, next) => {
    const host = c.req.header('host') || '';

    // Parse subdomain from host
    // e.g., "ohio.brewerytrip.com" -> "ohio"
    // e.g., "brewerytrip.com" -> null
    // e.g., "localhost:8787" -> null (dev mode)

    let stateSubdomain: string | null = null;
    let stateName: string | null = null;
    let stateAbbreviation: string | null = null;
    let isMultiState = true;
    let baseUrl = `https://${host}`;

    // Check if we're on a subdomain
    const parts = host.split('.');

    if (parts.length >= 3 && host.includes('brewerytrip.com')) {
      // We have a subdomain like ohio.brewerytrip.com
      const subdomain = parts[0].toLowerCase();

      if (VALID_STATES[subdomain]) {
        stateSubdomain = subdomain;
        stateName = VALID_STATES[subdomain].name;
        stateAbbreviation = VALID_STATES[subdomain].abbreviation;
        isMultiState = false;
      }
    }

    // For local development, check query param for testing
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const testState = c.req.query('state');
      if (testState && VALID_STATES[testState.toLowerCase()]) {
        stateSubdomain = testState.toLowerCase();
        stateName = VALID_STATES[testState.toLowerCase()].name;
        stateAbbreviation = VALID_STATES[testState.toLowerCase()].abbreviation;
        isMultiState = false;
      }
      baseUrl = `http://${host}`;
    }

    // Set context for use in routes
    c.set('subdomain', {
      stateSubdomain,
      stateName,
      stateAbbreviation,
      isMultiState,
      baseUrl
    });

    await next();
  };
};

// Helper to get all valid states (for multi-state selector)
export function getValidStates(): { subdomain: string; name: string; abbreviation: string }[] {
  return Object.entries(VALID_STATES).map(([subdomain, info]) => ({
    subdomain,
    name: info.name,
    abbreviation: info.abbreviation
  }));
}

// Helper to get state abbreviation from subdomain
export function getStateAbbreviation(subdomain: string): string | null {
  return VALID_STATES[subdomain]?.abbreviation || null;
}

// Helper to get all state abbreviations
export function getAllStateAbbreviations(): string[] {
  return Object.values(VALID_STATES).map(info => info.abbreviation);
}
