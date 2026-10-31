import { Hono } from 'hono';
import type { Env, Region, AppVariables, SubdomainContext } from '../types';
import * as breweriesDB from '../db/breweries';
import type { StateFilter } from '../db/breweries';
import { homePage } from '../templates/home';
import { breweriesPage } from '../templates/breweries';
import { breweryPage } from '../templates/brewery';
import { regionsPage, regionDetailPage } from '../templates/regions';
import { nearbyPage } from '../templates/nearby';
import { itineraryPage } from '../templates/itinerary';
import { trailsPage, trailDetailPage, Trail } from '../templates/trails';
import { downtownTourPage } from '../templates/downtown-tour';
import { beerOfTheMonthPage } from '../templates/beer-of-the-month';
import { ipaGuidePage } from '../templates/ipa-guide';
import { IPA_GUIDE } from '../data/ipa-guide';
import { christmasAlesPage } from '../templates/christmas-ales';
import { CHRISTMAS_ALES } from '../data/christmas-ales';
import { dogGuidePage } from '../templates/dog-guide';
import { DOG_GUIDE } from '../data/dog-guide';
import { aboutPage, privacyPage, termsPage } from '../templates/static';
import { blogListPage, blogPostPage, BlogPost, sampleBlogPosts } from '../templates/blog';
import { eventsPage } from '../templates/events';
import { renderRatingForm } from '../templates/rating-form';
import { userProfilePage, settingsPage } from '../templates/user-profile';
import { getUserById } from '../db/users';
import { getUserRatings, getUserStats } from '../db/ratings';
import { getCurrentUser, requireAuth } from '../middleware/auth';

const pages = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Helper to get state filter from subdomain context
function getStateFilter(subdomain: SubdomainContext): StateFilter {
  return {
    stateAbbreviation: subdomain.stateAbbreviation,
    isMultiState: subdomain.isMultiState
  };
}

// Home page
pages.get('/', async (c) => {
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);
  const allBreweries = await breweriesDB.getAllBreweries(c.env, stateFilter);
  const featured = allBreweries.slice(0, 6); // First 6 as featured

  const regions = new Set(allBreweries.map(b => b.region).filter(Boolean));
  const stateNames: Record<string, string> = {
    OH: 'Ohio', MI: 'Michigan', PA: 'Pennsylvania', IN: 'Indiana', KY: 'Kentucky', WV: 'West Virginia'
  };
  const stateCounts = new Map<string, number>();
  for (const b of allBreweries) if (b.state) stateCounts.set(b.state, (stateCounts.get(b.state) || 0) + 1);
  const states = [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).map(([abbr]) => stateNames[abbr] || abbr);
  const updatedAt = allBreweries.reduce<string | undefined>((max, b) => (b.updated_at && (!max || b.updated_at > max) ? b.updated_at : max), undefined);

  const html = homePage(featured, {
    total: allBreweries.length,
    regions: regions.size,
    states,
    updatedAt: updatedAt?.slice(0, 10)
  }, { subdomain });

  return c.html(html);
});

// Breweries page
pages.get('/breweries', async (c) => {
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);
  const region = c.req.query('region');
  const search = c.req.query('search');
  const amenity = c.req.query('amenity');

  let breweries = await breweriesDB.getAllBreweries(c.env, stateFilter);

  // Apply region filter
  if (region) {
    breweries = breweries.filter(b => b.region?.toLowerCase() === region.toLowerCase());
  }

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    breweries = breweries.filter(b =>
      b.name.toLowerCase().includes(searchLower) ||
      b.city?.toLowerCase().includes(searchLower) ||
      b.description?.toLowerCase().includes(searchLower)
    );
  }

  // Apply amenity filter
  if (amenity) {
    const amenityMap: Record<string, string[]> = {
      'dog-friendly': ['Dog Friendly'],
      'child-friendly': ['Child Friendly'],
      'food': ['Food Truck', 'Restaurant', 'Full-service'],
      'live-music': ['Live Music'],
      'outdoor': ['Outdoor Seating', 'Outdoor'],
      'tours': ['Brewery Tours', 'Tours'],
    };
    const searchTerms = amenityMap[amenity] || [amenity];

    breweries = breweries.filter(b => {
      if (!b.amenities) return false;
      const amenitiesStr = typeof b.amenities === 'string' ? b.amenities : JSON.stringify(b.amenities);
      return searchTerms.some(term => amenitiesStr.toLowerCase().includes(term.toLowerCase()));
    });
  }

  // Pagination: 24 breweries per page
  const BREWERIES_PER_PAGE = 24;
  const totalItems = breweries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / BREWERIES_PER_PAGE));
  let page = parseInt(c.req.query('page') || '1', 10);
  if (isNaN(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const startIndex = (page - 1) * BREWERIES_PER_PAGE;
  const paginatedBreweries = breweries.slice(startIndex, startIndex + BREWERIES_PER_PAGE);

  const html = breweriesPage(paginatedBreweries, { region, amenity, search, subdomain }, {
    page,
    totalPages,
    totalItems,
    perPage: BREWERIES_PER_PAGE
  });
  return c.html(html);
});

// Review interface
interface Review {
  id: number;
  user_id: string;
  brewery_id: number;
  rating: number;
  title: string | null;
  content: string | null;
  visit_date: string | null;
  helpful_count: number;
  created_at: string;
}

// Single brewery page
pages.get('/brewery/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const brewery = await breweriesDB.getBreweryById(c.env, id);

  if (!brewery) {
    return c.html('<h1>Brewery not found</h1>', 404);
  }

  // Fetch nearby breweries in the same region
  let nearbyBreweries: typeof brewery[] = [];
  if (brewery.region) {
    const regionBreweries = await breweriesDB.getBreweriesByRegion(c.env, brewery.region);
    nearbyBreweries = regionBreweries
      .filter(b => b.id !== brewery.id)
      .slice(0, 4);
  }

  // Fetch reviews for this brewery
  let reviews: Review[] = [];
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM reviews
      WHERE brewery_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(id).all<Review>();
    reviews = results || [];
  } catch (err) {
    // Reviews table might not exist yet
  }

  const html = breweryPage(brewery, c.env.GOOGLE_MAPS_API_KEY, nearbyBreweries, reviews);
  return c.html(html);
});

// Rate a beer at a brewery
pages.get('/brewery/:id/rate', async (c) => {
  const subdomain = c.get('subdomain');
  const id = parseInt(c.req.param('id'));
  const brewery = await breweriesDB.getBreweryById(c.env, id);

  if (!brewery) {
    return c.html('<h1>Brewery not found</h1>', 404);
  }

  // Get itinerary ID from query if present
  const itineraryId = c.req.query('itinerary');

  // Get current user from context (set by auth middleware)
  const user = c.get('user') || null;

  const html = renderRatingForm({
    brewery,
    user,
    itineraryId,
    baseUrl: subdomain.baseUrl
  });

  return c.html(html);
});

// Regions list page
pages.get('/regions', async (c) => {
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);
  const allBreweries = await breweriesDB.getAllBreweries(c.env, stateFilter);

  // Group by region and count
  const regionCounts = new Map<string, number>();
  allBreweries.forEach(b => {
    if (b.region) {
      regionCounts.set(b.region, (regionCounts.get(b.region) || 0) + 1);
    }
  });

  const regions: Region[] = Array.from(regionCounts.entries()).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    slug: name.toLowerCase(),
    brewery_count: count
  })).sort((a, b) => b.brewery_count - a.brewery_count);

  const html = regionsPage(regions, { subdomain });
  return c.html(html);
});

// Single region page
pages.get('/regions/:region', async (c) => {
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);
  const region = c.req.param('region').toLowerCase();
  const breweries = await breweriesDB.getBreweriesByRegion(c.env, region, stateFilter);

  const html = regionDetailPage(region, breweries, { subdomain });
  return c.html(html);
});

// Nearby page
pages.get('/nearby', (c) => {
  const html = nearbyPage();
  return c.html(html);
});

// Itinerary/Tour page
pages.get('/itinerary', (c) => {
  const subdomain = c.get('subdomain');
  const html = itineraryPage(subdomain);
  return c.html(html);
});

// Trails list page
pages.get('/trails', async (c) => {
  const subdomain = c.get('subdomain');
  const { results: trails } = await c.env.DB.prepare(
    'SELECT * FROM trails ORDER BY featured DESC, name ASC'
  ).all<Trail>();

  const html = trailsPage(trails || [], subdomain);
  return c.html(html);
});

// Code-defined, sourced walking tour (registered before the D1-backed /trails/:slug)
pages.get('/trails/downtown-cleveland', (c) => c.html(downtownTourPage(c.get('subdomain'))));
pages.get('/cleveland-beer-of-the-month', (c) => c.html(beerOfTheMonthPage(c.get('subdomain'))));

// Single trail page
pages.get('/trails/:slug', async (c) => {
  const subdomain = c.get('subdomain');
  const slug = c.req.param('slug');

  const trail = await c.env.DB.prepare(
    'SELECT * FROM trails WHERE slug = ?'
  ).bind(slug).first<Trail>();

  if (!trail) {
    return c.html('<h1>Trail not found</h1>', 404);
  }

  // Parse brewery IDs and fetch brewery details
  const breweryIds = JSON.parse(trail.brewery_ids || '[]') as number[];
  const breweries = [];

  for (const id of breweryIds) {
    const brewery = await breweriesDB.getBreweryById(c.env, id);
    if (brewery) {
      breweries.push(brewery);
    }
  }

  const html = trailDetailPage(trail, breweries, subdomain);
  return c.html(html);
});

// Shared tour view page
pages.get('/tour/:id', async (c) => {
  const id = c.req.param('id');

  const tour = await c.env.DB.prepare(
    'SELECT * FROM shared_tours WHERE id = ?'
  ).bind(id).first<any>();

  if (!tour) {
    return c.redirect('/itinerary');
  }

  // Increment view count
  await c.env.DB.prepare(
    'UPDATE shared_tours SET view_count = view_count + 1 WHERE id = ?'
  ).bind(id).run();

  // Redirect to itinerary with tour data
  const breweryIds = JSON.parse(tour.brewery_ids || '[]');
  return c.redirect('/itinerary?tour=' + breweryIds.join(','));
});

// The sourced Ohio IPA guide replaces the unsourced 2024 post, whose row is still in D1: the old URL 301s here, and
// the blog list shows the old row under the guide's slug and title. Both routes come before /blog/:slug.
// The sourced dog-friendly guide keeps the old post's slug (it already ranks) and replaces what it renders; its D1 row
// (blog_posts id 20) is listed with the guide's excerpt and date until migrations/0023_dog_guide_blog_row.sql is applied.
const withIpaGuide = (posts: BlogPost[]): BlogPost[] => posts.map((p) => p.slug === IPA_GUIDE.oldSlug
  ? { ...p, slug: IPA_GUIDE.slug, title: IPA_GUIDE.title, excerpt: IPA_GUIDE.excerpt, tags: 'IPA, Guides, Craft Beer', updated_at: IPA_GUIDE.dateModified }
  : p.slug === DOG_GUIDE.slug
    ? { ...p, title: DOG_GUIDE.title, excerpt: DOG_GUIDE.excerpt, updated_at: DOG_GUIDE.dateModified }
    : p);
pages.get(`/blog/${IPA_GUIDE.slug}`, (c) => c.html(ipaGuidePage(c.get('subdomain'))));
pages.get(`/blog/${IPA_GUIDE.oldSlug}`, (c) => c.redirect(`/blog/${IPA_GUIDE.slug}`, 301));
// The sourced Ohio Christmas ales guide. Its /blog listing comes from a blog_posts row (migrations/0022) or the
// sample fallback; this route comes before /blog/:slug, so the row's content is never rendered.
pages.get(`/blog/${CHRISTMAS_ALES.slug}`, (c) => c.html(christmasAlesPage(c.get('subdomain'))));
pages.get(`/blog/${DOG_GUIDE.slug}`, (c) => c.html(dogGuidePage(c.get('subdomain'))));

// Blog list page
pages.get('/blog', async (c) => {
  const category = c.req.query('category');

  // Helper to filter sample posts
  const getSamplePosts = () => {
    let samples = withIpaGuide(sampleBlogPosts.map((p, i) => ({ ...p, id: i + 1 })) as BlogPost[]);
    if (category) {
      samples = samples.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }
    return samples;
  };

  try {
    const { results: posts } = await c.env.DB.prepare(
      'SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT 20'
    ).all<BlogPost>();

    // If no posts from DB, use sample posts
    if (!posts || posts.length === 0) {
      return c.html(blogListPage(getSamplePosts(), category));
    }

    // Apply category filter if provided
    let filteredPosts = withIpaGuide(posts);
    if (category) {
      filteredPosts = filteredPosts.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      if (filteredPosts.length === 0) {
        return c.html(blogListPage(getSamplePosts(), category));
      }
    }

    return c.html(blogListPage(filteredPosts, category));
  } catch (err) {
    // If table doesn't exist, show sample posts
    return c.html(blogListPage(getSamplePosts(), category));
  }
});

// Single blog post page
// 2024 event preview, retired 2026-10-31 (thin, out of date; Bill's call).
export const RETIRED_BLOG_SLUGS = new Set(['ohio-beer-week-2024-preview']);

pages.get('/blog/:slug', async (c) => {
  const slug = c.req.param('slug');
  // Retired posts answer 410 Gone so search engines drop them (the D1 row is unpublished too).
  if (RETIRED_BLOG_SLUGS.has(slug)) return c.html('<h1>This post has been retired</h1><p><a href="/blog">See current guides</a></p>', 410);

  try {
    const post = await c.env.DB.prepare(
      'SELECT * FROM blog_posts WHERE slug = ? AND published = 1'
    ).bind(slug).first<BlogPost>();

    if (!post) {
      // Check sample posts
      const samplePost = sampleBlogPosts.find(p => p.slug === slug);
      if (samplePost) {
        const html = blogPostPage(samplePost as BlogPost, []);
        return c.html(html);
      }
      return c.html('<h1>Post not found</h1>', 404);
    }

    // Get related posts in same category
    const { results: relatedPosts } = await c.env.DB.prepare(
      'SELECT * FROM blog_posts WHERE category = ? AND slug != ? AND published = 1 ORDER BY created_at DESC LIMIT 2'
    ).bind(post.category || '', slug).all<BlogPost>();

    const html = blogPostPage(post, withIpaGuide(relatedPosts || []));
    return c.html(html);
  } catch (err) {
    // Check sample posts if DB fails
    const samplePost = sampleBlogPosts.find(p => p.slug === slug);
    if (samplePost) {
      const html = blogPostPage(samplePost as BlogPost, []);
      return c.html(html);
    }
    return c.html('<h1>Post not found</h1>', 404);
  }
});

// Events page
pages.get('/events', async (c) => {
  interface Event {
    id: number;
    brewery_id: number;
    title: string;
    description: string | null;
    event_type: string | null;
    start_datetime: string;
    end_datetime: string | null;
    recurring: string | null;
    image_url: string | null;
    external_url: string | null;
    brewery_name?: string;
    city?: string;
  }

  try {
    // Get upcoming events with brewery info
    const { results: events } = await c.env.DB.prepare(`
      SELECT e.*, b.name as brewery_name, b.city
      FROM events e
      LEFT JOIN breweries b ON e.brewery_id = b.id
      WHERE e.start_datetime >= datetime('now')
      ORDER BY e.start_datetime ASC
      LIMIT 100
    `).all<Event>();

    const html = eventsPage(events || []);
    return c.html(html);
  } catch (err) {
    // If table doesn't exist or error, show empty events
    const html = eventsPage([]);
    return c.html(html);
  }
});

// User profile page (own profile)
pages.get('/profile', async (c) => {
  const subdomain = c.get('subdomain');
  const user = getCurrentUser(c);

  if (!user) {
    return c.redirect('/api/auth/untappd');
  }

  try {
    const [ratings, stats] = await Promise.all([
      getUserRatings(c.env.DB, user.id, 20, 0),
      getUserStats(c.env.DB, user.id)
    ]);

    const html = userProfilePage({
      user,
      stats,
      ratings,
      isOwnProfile: true,
      subdomain: { baseUrl: subdomain.baseUrl, stateName: subdomain.stateName }
    });

    return c.html(html);
  } catch (error) {
    console.error('Profile page error:', error);
    return c.html('<h1>Error loading profile</h1>', 500);
  }
});

// Public user profile
pages.get('/user/:id', async (c) => {
  const subdomain = c.get('subdomain');
  const userId = c.req.param('id');
  const currentUser = getCurrentUser(c);

  try {
    const profileUser = await getUserById(c.env.DB, userId);

    if (!profileUser) {
      return c.html('<h1>User not found</h1>', 404);
    }

    const [ratings, stats] = await Promise.all([
      getUserRatings(c.env.DB, userId, 20, 0, true), // publicOnly = true
      getUserStats(c.env.DB, userId)
    ]);

    const html = userProfilePage({
      user: profileUser,
      stats,
      ratings,
      isOwnProfile: currentUser?.id === userId,
      subdomain: { baseUrl: subdomain.baseUrl, stateName: subdomain.stateName }
    });

    return c.html(html);
  } catch (error) {
    console.error('User profile page error:', error);
    return c.html('<h1>Error loading profile</h1>', 500);
  }
});

// Settings page
pages.get('/settings', async (c) => {
  const subdomain = c.get('subdomain');
  const user = getCurrentUser(c);

  if (!user) {
    return c.redirect('/api/auth/untappd');
  }

  const html = settingsPage(user, {
    baseUrl: subdomain.baseUrl,
    stateName: subdomain.stateName
  });

  return c.html(html);
});

// Static pages
pages.get('/about', (c) => {
  const html = aboutPage();
  return c.html(html);
});

pages.get('/privacy', (c) => {
  const html = privacyPage();
  return c.html(html);
});

pages.get('/terms', (c) => {
  const html = termsPage();
  return c.html(html);
});

// SEO: Dynamic XML Sitemap
// IndexNow site-verification key (Bing/Yandex). Not a secret; the file proves we control the host.
const INDEXNOW_KEY = 'a7c3e1f0b9d24c5e8f6a1b2c3d4e5f60';
pages.get(`/${INDEXNOW_KEY}.txt`, (c) => c.text(INDEXNOW_KEY, 200, { 'Cache-Control': 'public, max-age=86400' }));

pages.get('/sitemap.xml', async (c) => {
  const baseUrl = 'https://brewerytrip.com';
  const today = new Date().toISOString().split('T')[0];

  // Get all breweries
  const allBreweries = await breweriesDB.getAllBreweries(c.env);

  // Get all regions
  const regions = [...new Set(allBreweries.map(b => b.region).filter(Boolean))];

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/breweries', priority: '0.9', changefreq: 'daily' },
    { url: '/regions', priority: '0.8', changefreq: 'weekly' },
    { url: '/events', priority: '0.8', changefreq: 'daily' },
    { url: '/trails', priority: '0.7', changefreq: 'weekly' },
    { url: '/trails/downtown-cleveland', priority: '0.7', changefreq: 'monthly' },
    { url: '/cleveland-beer-of-the-month', priority: '0.7', changefreq: 'weekly' },
    { url: '/nearby', priority: '0.7', changefreq: 'weekly' },
    { url: '/blog', priority: '0.6', changefreq: 'weekly' },
    { url: '/itinerary', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Add brewery pages
  for (const brewery of allBreweries) {
    xml += `  <url>
    <loc>${baseUrl}/brewery/${brewery.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Add region pages
  for (const region of regions) {
    xml += `  <url>
    <loc>${baseUrl}/regions/${region?.toLowerCase()}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
});

export default pages;
