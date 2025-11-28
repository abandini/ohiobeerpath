#!/usr/bin/env python3
"""
Comprehensive QA Test Suite for Brewery Trip Multi-Domain Platform
Tests: brewerytrip.com, ohio.brewerytrip.com, michigan.brewerytrip.com
"""

from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime

# Test configuration
DOMAINS = {
    'multi-state': 'https://brewerytrip.com',
    'ohio': 'https://ohio.brewerytrip.com',
    'michigan': 'https://michigan.brewerytrip.com'
}

PAGES_TO_TEST = [
    '/',
    '/breweries',
    '/regions',
    '/events',
    '/trails',
    '/nearby',
    '/blog',
    '/itinerary',
    '/about',
    '/privacy',
    '/terms'
]

class QATestSuite:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'domains': {},
            'summary': {'passed': 0, 'failed': 0, 'warnings': 0}
        }
        self.issues = []

    def log_result(self, domain, test_name, passed, message="", warning=False):
        if domain not in self.results['domains']:
            self.results['domains'][domain] = {'tests': [], 'passed': 0, 'failed': 0, 'warnings': 0}

        status = 'PASS' if passed else ('WARN' if warning else 'FAIL')
        self.results['domains'][domain]['tests'].append({
            'test': test_name,
            'status': status,
            'message': message
        })

        if passed:
            self.results['domains'][domain]['passed'] += 1
            self.results['summary']['passed'] += 1
        elif warning:
            self.results['domains'][domain]['warnings'] += 1
            self.results['summary']['warnings'] += 1
        else:
            self.results['domains'][domain]['failed'] += 1
            self.results['summary']['failed'] += 1
            self.issues.append({'domain': domain, 'test': test_name, 'message': message})

        icon = '✅' if passed else ('⚠️' if warning else '❌')
        print(f"  {icon} {test_name}: {message if message else 'OK'}")

    def run_all_tests(self):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            for domain_name, base_url in DOMAINS.items():
                print(f"\n{'='*60}")
                print(f"Testing: {domain_name} ({base_url})")
                print('='*60)

                context = browser.new_context(
                    viewport={'width': 1920, 'height': 1080},
                    user_agent='QA-Bot/1.0 Playwright'
                )
                page = context.new_page()

                # Collect console errors
                console_errors = []
                page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

                # Run test suites
                self.test_branding(page, domain_name, base_url)
                self.test_navigation(page, domain_name, base_url)
                self.test_pages_load(page, domain_name, base_url)
                self.test_interactive_features(page, domain_name, base_url)
                self.test_seo_elements(page, domain_name, base_url)
                self.test_responsive(page, context, domain_name, base_url)
                self.test_api_endpoints(page, domain_name, base_url)

                # Report console errors
                if console_errors:
                    self.log_result(domain_name, 'Console Errors', False,
                                   f"Found {len(console_errors)} JS errors: {console_errors[:3]}")
                else:
                    self.log_result(domain_name, 'Console Errors', True, "No JS errors")

                context.close()

            browser.close()

        self.print_summary()
        return self.results

    def test_branding(self, page, domain_name, base_url):
        """Test dynamic branding based on domain"""
        print("\n📋 Branding Tests:")

        page.goto(base_url)
        page.wait_for_load_state('networkidle')

        # Check page title
        title = page.title()
        if domain_name == 'multi-state':
            expected = 'Brewery Trip'
        elif domain_name == 'ohio':
            expected = 'Ohio Brewery Trip'
        elif domain_name == 'michigan':
            expected = 'Michigan Brewery Trip'

        self.log_result(domain_name, 'Page Title Branding',
                       expected in title, f"Title: '{title}'")

        # Check hero heading
        hero_h1 = page.locator('h1').first.text_content()
        if domain_name == 'multi-state':
            expected_hero = "America's"
        else:
            expected_hero = domain_name.title()

        self.log_result(domain_name, 'Hero Heading',
                       expected_hero in hero_h1, f"H1: '{hero_h1}'")

        # Check navigation brand (includes state badge for state subdomains)
        nav_brand = page.locator('.navbar-brand').text_content()
        nav_brand_clean = ' '.join(nav_brand.split())  # Normalize whitespace
        if domain_name == 'multi-state':
            brand_ok = 'Brewery Trip' in nav_brand_clean
        else:
            # State subdomains have "State Brewery Trip STATE" format
            brand_ok = domain_name.title() in nav_brand_clean and 'Brewery Trip' in nav_brand_clean
        self.log_result(domain_name, 'Nav Brand', brand_ok,
                       f"Nav: '{nav_brand_clean}'")

        # Check state badge (only for state subdomains)
        if domain_name != 'multi-state':
            state_badge = page.locator('.state-badge')
            has_badge = state_badge.count() > 0
            self.log_result(domain_name, 'State Badge', has_badge,
                           f"Badge present: {has_badge}")

    def test_navigation(self, page, domain_name, base_url):
        """Test navigation links work correctly"""
        print("\n🔗 Navigation Tests:")

        page.goto(base_url)
        page.wait_for_load_state('networkidle')

        nav_links = page.locator('nav a').all()
        nav_count = len(nav_links)
        self.log_result(domain_name, 'Nav Links Present', nav_count >= 5,
                       f"Found {nav_count} nav links")

        # Test key navigation links
        key_pages = ['/breweries', '/regions', '/nearby', '/itinerary']
        for nav_page in key_pages:
            link = page.locator(f'nav a[href="{nav_page}"]')
            exists = link.count() > 0
            self.log_result(domain_name, f'Nav Link {nav_page}', exists)

    def test_pages_load(self, page, domain_name, base_url):
        """Test all pages load without errors"""
        print("\n📄 Page Load Tests:")

        for test_page in PAGES_TO_TEST:
            url = f"{base_url}{test_page}"
            try:
                response = page.goto(url)
                page.wait_for_load_state('networkidle', timeout=10000)

                status = response.status if response else 0
                passed = 200 <= status < 400
                self.log_result(domain_name, f'Page Load {test_page}', passed,
                               f"Status: {status}")
            except Exception as e:
                self.log_result(domain_name, f'Page Load {test_page}', False,
                               f"Error: {str(e)[:50]}")

    def test_interactive_features(self, page, domain_name, base_url):
        """Test interactive features like search and tour functionality"""
        print("\n⚡ Interactive Feature Tests:")

        page.goto(base_url)
        page.wait_for_load_state('networkidle')

        # Test search input exists
        search_input = page.locator('#searchInput')
        self.log_result(domain_name, 'Search Input', search_input.count() > 0)

        # Test search functionality
        if search_input.count() > 0:
            search_input.fill('Great Lakes')
            page.wait_for_timeout(500)  # Wait for debounce
            search_results = page.locator('#searchResults')
            # Check if results container exists (may or may not have results)
            self.log_result(domain_name, 'Search Results Container',
                           search_results.count() > 0)

        # Test brewery cards on homepage
        brewery_cards = page.locator('.brewery-card')
        card_count = brewery_cards.count()
        self.log_result(domain_name, 'Brewery Cards', card_count > 0,
                       f"Found {card_count} cards")

        # Test "Add to Tour" buttons
        add_buttons = page.locator('button:has-text("Add to Tour")')
        self.log_result(domain_name, 'Add to Tour Buttons', add_buttons.count() > 0,
                       f"Found {add_buttons.count()} buttons")

        # Test region/state filters based on domain
        if domain_name == 'multi-state':
            state_selector = page.locator('.state-selector-cta')
            self.log_result(domain_name, 'State Selector (Multi-state)',
                           state_selector.count() > 0)
        else:
            region_chips = page.locator('.region-chip')
            self.log_result(domain_name, 'Region Chips', region_chips.count() >= 5,
                           f"Found {region_chips.count()} chips")

    def test_seo_elements(self, page, domain_name, base_url):
        """Test SEO meta tags and structured data"""
        print("\n🔍 SEO Tests:")

        page.goto(base_url)
        page.wait_for_load_state('networkidle')

        # Check meta description
        meta_desc = page.locator('meta[name="description"]')
        self.log_result(domain_name, 'Meta Description', meta_desc.count() > 0)

        # Check Open Graph tags
        og_title = page.locator('meta[property="og:title"]')
        og_desc = page.locator('meta[property="og:description"]')
        self.log_result(domain_name, 'Open Graph Tags',
                       og_title.count() > 0 and og_desc.count() > 0)

        # Check Twitter cards
        twitter_card = page.locator('meta[name="twitter:card"]')
        self.log_result(domain_name, 'Twitter Cards', twitter_card.count() > 0)

        # Check canonical URL
        canonical = page.locator('link[rel="canonical"]')
        self.log_result(domain_name, 'Canonical URL', canonical.count() > 0)

        # Check structured data (JSON-LD)
        json_ld = page.locator('script[type="application/ld+json"]')
        self.log_result(domain_name, 'Structured Data (JSON-LD)', json_ld.count() > 0)

        # Check robots.txt
        response = page.goto(f"{base_url}/robots.txt")
        self.log_result(domain_name, 'robots.txt',
                       response.status == 200 if response else False)

        # Check sitemap.xml
        response = page.goto(f"{base_url}/sitemap.xml")
        self.log_result(domain_name, 'sitemap.xml',
                       response.status == 200 if response else False)

    def test_responsive(self, page, context, domain_name, base_url):
        """Test responsive design on different viewports"""
        print("\n📱 Responsive Tests:")

        viewports = [
            {'name': 'Mobile', 'width': 375, 'height': 667},
            {'name': 'Tablet', 'width': 768, 'height': 1024},
            {'name': 'Desktop', 'width': 1920, 'height': 1080}
        ]

        for vp in viewports:
            page.set_viewport_size({'width': vp['width'], 'height': vp['height']})
            page.goto(base_url)
            page.wait_for_load_state('networkidle')

            # Check hero is visible
            hero = page.locator('.hero-section')
            visible = hero.is_visible() if hero.count() > 0 else False
            self.log_result(domain_name, f"Responsive {vp['name']} ({vp['width']}px)",
                           visible)

        # Reset viewport
        page.set_viewport_size({'width': 1920, 'height': 1080})

    def test_api_endpoints(self, page, domain_name, base_url):
        """Test API endpoints"""
        print("\n🔌 API Tests:")

        api_endpoints = [
            '/api/breweries',
            '/api/breweries?limit=5',
            '/api/regions',
            '/health'
        ]

        for endpoint in api_endpoints:
            url = f"{base_url}{endpoint}"
            try:
                response = page.goto(url)
                status = response.status if response else 0

                if status == 200:
                    content = page.content()
                    # Check if response is JSON
                    is_json = '"' in content and ('{' in content or '[' in content)
                    self.log_result(domain_name, f'API {endpoint}', is_json,
                                   f"Status: {status}, JSON: {is_json}")
                else:
                    self.log_result(domain_name, f'API {endpoint}', False,
                                   f"Status: {status}")
            except Exception as e:
                self.log_result(domain_name, f'API {endpoint}', False,
                               f"Error: {str(e)[:50]}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 QA TEST SUMMARY")
        print("="*60)

        total = self.results['summary']
        print(f"\n✅ Passed: {total['passed']}")
        print(f"❌ Failed: {total['failed']}")
        print(f"⚠️  Warnings: {total['warnings']}")

        if self.issues:
            print(f"\n🔴 ISSUES FOUND ({len(self.issues)}):")
            for issue in self.issues:
                print(f"  - [{issue['domain']}] {issue['test']}: {issue['message']}")
        else:
            print("\n🎉 All tests passed!")

        # Per-domain summary
        print("\n📈 Per-Domain Results:")
        for domain, data in self.results['domains'].items():
            print(f"  {domain}: {data['passed']} passed, {data['failed']} failed, {data['warnings']} warnings")


if __name__ == '__main__':
    print("🧪 Brewery Trip Multi-Domain QA Test Suite")
    print("="*60)

    suite = QATestSuite()
    results = suite.run_all_tests()

    # Save results to file
    with open('/tmp/qa-results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n📁 Results saved to /tmp/qa-results.json")

    # Exit with error code if failures found
    exit(1 if results['summary']['failed'] > 0 else 0)
