/**
 * Unit tests for dynamic branding functionality
 */
import { describe, it, expect } from 'vitest';
import { getSiteBranding } from '../../src/templates/layout';
import type { SubdomainContext } from '../../src/types';

describe('getSiteBranding', () => {
  describe('multi-state (no subdomain)', () => {
    it('returns default branding when no subdomain provided', () => {
      const branding = getSiteBranding();

      expect(branding.siteName).toBe('Brewery Trip');
      expect(branding.tagline).toBe('Plan Your Ultimate Brewery Tour');
      expect(branding.heroTitle).toBe("Discover America's Craft Beer Scene");
      expect(branding.stateBadge).toBeNull();
      expect(branding.geoRegion).toBe('US');
      expect(branding.geoPlace).toBe('United States');
    });

    it('returns default branding when subdomain is undefined', () => {
      const branding = getSiteBranding(undefined);

      expect(branding.siteName).toBe('Brewery Trip');
      expect(branding.stateBadge).toBeNull();
    });

    it('returns default branding when isMultiState is true', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: null,
        stateName: null,
        isMultiState: true,
        baseUrl: 'https://brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      expect(branding.siteName).toBe('Brewery Trip');
      expect(branding.heroTitle).toBe("Discover America's Craft Beer Scene");
      expect(branding.stateBadge).toBeNull();
    });
  });

  describe('state-specific subdomains', () => {
    it('returns Ohio-specific branding', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: 'ohio',
        stateName: 'Ohio',
        isMultiState: false,
        baseUrl: 'https://ohio.brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      expect(branding.siteName).toBe('Ohio Brewery Trip');
      expect(branding.tagline).toBe("Explore Ohio's Best Craft Breweries");
      expect(branding.heroTitle).toBe("Discover Ohio's Craft Beer Scene");
      expect(branding.stateBadge).toBe('OHIO');
      expect(branding.geoRegion).toBe('US-OH');
      expect(branding.geoPlace).toBe('Ohio');
    });

    it('returns Michigan-specific branding', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: 'michigan',
        stateName: 'Michigan',
        isMultiState: false,
        baseUrl: 'https://michigan.brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      expect(branding.siteName).toBe('Michigan Brewery Trip');
      expect(branding.stateBadge).toBe('MICHIGAN');
      expect(branding.geoRegion).toBe('US-MI');
    });

    it('returns California-specific branding', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: 'california',
        stateName: 'California',
        isMultiState: false,
        baseUrl: 'https://california.brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      expect(branding.siteName).toBe('California Brewery Trip');
      expect(branding.geoRegion).toBe('US-CA');
    });

    it('handles West Virginia (multi-word state)', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: 'west-virginia',
        stateName: 'West Virginia',
        isMultiState: false,
        baseUrl: 'https://west-virginia.brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      expect(branding.siteName).toBe('West Virginia Brewery Trip');
      expect(branding.stateBadge).toBe('WEST VIRGINIA');
      expect(branding.geoRegion).toBe('US-WV');
    });

    it('handles unknown state gracefully', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: 'narnia',
        stateName: 'Narnia',
        isMultiState: false,
        baseUrl: 'https://narnia.brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      expect(branding.siteName).toBe('Narnia Brewery Trip');
      expect(branding.geoRegion).toBe('US-US'); // Falls back to US
    });
  });

  describe('edge cases', () => {
    it('handles null stateName with isMultiState false', () => {
      const subdomain: SubdomainContext = {
        stateSubdomain: 'test',
        stateName: null,
        isMultiState: false,
        baseUrl: 'https://test.brewerytrip.com'
      };

      const branding = getSiteBranding(subdomain);

      // Should still work but with null/empty values
      expect(branding.siteName).toBe('null Brewery Trip');
      expect(branding.stateBadge).toBeNull();
    });
  });
});
