// Beer Blog templates
import { layout } from './layout';

// Safe date formatter that handles epoch dates and invalid strings
function formatDate(dateStr: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  // Guard against epoch dates (before 2000) and invalid dates
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return '';
  }
  return date.toLocaleDateString('en-US', options);
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  author?: string;
  category?: string;
  tags?: string;
  published: number;
  created_at: string;
  updated_at?: string;
}

export function blogListPage(posts: BlogPost[], category?: string): string {
  const categories = ['News', 'Guides', 'Reviews', 'Events', 'Culture'];

  const content = `
  <main class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 fw-bold">
        <i class="bi bi-newspaper text-warning"></i> Ohio Beer Blog
      </h1>
      <p class="lead text-muted">Stories, guides, and news from Ohio's craft beer scene</p>
    </div>

    <!-- Category Filter -->
    <div class="d-flex flex-wrap justify-content-center gap-2 mb-5">
      <a href="/blog" class="btn ${!category ? 'btn-warning' : 'btn-outline-warning'}">
        All Posts
      </a>
      ${categories.map(cat => `
        <a href="/blog?category=${cat.toLowerCase()}" class="btn ${category?.toLowerCase() === cat.toLowerCase() ? 'btn-warning' : 'btn-outline-warning'}">
          ${cat}
        </a>
      `).join('')}
    </div>

    ${posts.length === 0 ? `
      <div class="text-center py-5">
        <i class="bi bi-journal-x fs-1 text-muted mb-3 d-block"></i>
        <h3>No Posts Yet</h3>
        <p class="text-muted">Check back soon for stories about Ohio's craft beer scene!</p>
      </div>
    ` : `
      <div class="row g-4">
        ${posts.map((post, index) => `
          <div class="${index === 0 ? 'col-12' : 'col-md-6 col-lg-4'}">
            <article class="card h-100 border-0 shadow-sm ${index === 0 ? 'featured-post' : ''}">
              ${post.featured_image ? `
                <img src="${post.featured_image}" class="card-img-top" alt="${post.title}" style="height: ${index === 0 ? '300px' : '200px'}; object-fit: cover;">
              ` : `
                <div class="card-img-top bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style="height: ${index === 0 ? '300px' : '200px'};">
                  <i class="bi bi-newspaper fs-1 text-warning"></i>
                </div>
              `}
              <div class="card-body">
                ${post.category ? `
                  <span class="badge bg-warning text-dark mb-2">${post.category}</span>
                ` : ''}
                <h${index === 0 ? '2' : '5'} class="card-title">
                  <a href="/blog/${post.slug}" class="text-decoration-none text-dark stretched-link">
                    ${post.title}
                  </a>
                </h${index === 0 ? '2' : '5'}>
                <p class="card-text text-muted">
                  ${post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : '')}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                  <small class="text-muted">
                    <i class="bi bi-calendar"></i> ${formatDate(post.created_at)}
                  </small>
                  ${post.author ? `
                    <small class="text-muted">
                      <i class="bi bi-person"></i> ${post.author}
                    </small>
                  ` : ''}
                </div>
              </div>
            </article>
          </div>
        `).join('')}
      </div>
    `}
  </main>

  `;

  return layout('Beer Blog', content, {
    description: 'Stories, guides, and news from Ohio\'s craft beer scene. Discover new breweries, read reviews, and stay updated on beer events.'
  });
}

export function blogPostPage(post: BlogPost, relatedPosts: BlogPost[] = []): string {
  const content = `
  <article class="blog-post">
    <!-- Hero -->
    <header class="blog-hero position-relative mb-5">
      ${post.featured_image ? `
        <div class="hero-image" style="background-image: url('${post.featured_image}'); height: 400px; background-size: cover; background-position: center;">
          <div class="hero-overlay position-absolute w-100 h-100" style="background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)); top: 0;"></div>
        </div>
      ` : `
        <div class="hero-image bg-dark" style="height: 300px;">
          <div class="hero-overlay position-absolute w-100 h-100" style="background: linear-gradient(135deg, #1a1a2e, #16213e); top: 0;"></div>
        </div>
      `}
      <div class="container position-relative" style="margin-top: -100px;">
        <div class="bg-white rounded-4 shadow p-4 p-md-5 mx-auto" style="max-width: 800px;">
          ${post.category ? `
            <span class="badge bg-warning text-dark mb-3">${post.category}</span>
          ` : ''}
          <h1 class="display-5 fw-bold mb-3">${post.title}</h1>
          <div class="d-flex flex-wrap gap-3 text-muted">
            <span><i class="bi bi-calendar"></i> ${formatDate(post.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            ${post.author ? `<span><i class="bi bi-person"></i> ${post.author}</span>` : ''}
            <span><i class="bi bi-clock"></i> ${Math.ceil((post.content?.length || 0) / 1000)} min read</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="blog-content mb-5">
            ${formatBlogContent(post.content)}
          </div>

          <!-- Tags -->
          ${post.tags ? `
            <div class="mb-5">
              <strong>Tags:</strong>
              ${post.tags.split(',').map(tag => `
                <a href="/blog?tag=${tag.trim().toLowerCase()}" class="badge bg-secondary text-decoration-none me-1">${tag.trim()}</a>
              `).join('')}
            </div>
          ` : ''}

          <!-- Share -->
          <div class="card bg-light border-0 p-4 mb-5">
            <h5><i class="bi bi-share"></i> Share This Post</h5>
            <div class="d-flex gap-2 mt-2">
              <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent('https://ohio-beer-path.bill-burkey.workers.dev/blog/' + post.slug)}" target="_blank" class="btn btn-outline-dark btn-sm">
                <i class="bi bi-twitter-x"></i> Twitter
              </a>
              <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://ohio-beer-path.bill-burkey.workers.dev/blog/' + post.slug)}" target="_blank" class="btn btn-outline-dark btn-sm">
                <i class="bi bi-facebook"></i> Facebook
              </a>
              <button onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied!')" class="btn btn-outline-dark btn-sm">
                <i class="bi bi-link-45deg"></i> Copy Link
              </button>
            </div>
          </div>

          <!-- Related Posts -->
          ${relatedPosts.length > 0 ? `
            <div class="mb-5">
              <h4 class="mb-4">Related Posts</h4>
              <div class="row g-3">
                ${relatedPosts.map(rp => `
                  <div class="col-md-6">
                    <a href="/blog/${rp.slug}" class="card text-decoration-none h-100 border-0 shadow-sm">
                      <div class="card-body">
                        <h6 class="text-dark">${rp.title}</h6>
                        <small class="text-muted">
                          ${formatDate(rp.created_at, { month: 'short', day: 'numeric' })}
                        </small>
                      </div>
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="text-center">
            <a href="/blog" class="btn btn-outline-warning">
              <i class="bi bi-arrow-left"></i> Back to Blog
            </a>
          </div>
        </div>
      </div>
    </div>
  </article>

  `;

  return layout(post.title, content, {
    description: post.excerpt || post.content?.substring(0, 160),
    image: post.featured_image
  });
}

function formatBlogContent(content: string): string {
  if (!content) return '<p>Content coming soon...</p>';

  // Convert markdown-like formatting to HTML
  let html = content
    // Paragraphs
    .split('\n\n')
    .map(para => {
      // Headers
      if (para.startsWith('## ')) {
        return `<h2>${para.substring(3)}</h2>`;
      }
      if (para.startsWith('### ')) {
        return `<h3>${para.substring(4)}</h3>`;
      }
      // Blockquotes
      if (para.startsWith('> ')) {
        return `<blockquote>${para.substring(2)}</blockquote>`;
      }
      // Regular paragraphs
      return `<p>${para}</p>`;
    })
    .join('\n');

  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  return html;
}

// Sample blog posts for seeding
export const sampleBlogPosts: Omit<BlogPost, 'id'>[] = [
  {
    slug: 'best-ohio-ipa-breweries-2024',
    title: 'The 10 Best Ohio Breweries for IPA Lovers in 2024',
    excerpt: 'From hazy New England-style to crisp West Coast IPAs, these Ohio breweries are pushing the boundaries of hop-forward brewing.',
    content: `Ohio has quietly become one of the best states in the Midwest for craft beer, and IPA lovers have plenty of reasons to celebrate. From Cleveland to Cincinnati, breweries are crafting everything from hazy juice bombs to classic West Coast bitters.

## What Makes Ohio IPAs Special?

Ohio brewers benefit from access to fresh Great Lakes water and a growing community of hop suppliers. Many breweries have established relationships with farms in the Pacific Northwest, ensuring they get the freshest hops for their brews.

### Our Top Picks

**1. Great Lakes Brewing Company** - Cleveland's legendary brewery has been perfecting their hop game since 1988. Their Commodore Perry IPA remains a benchmark for the style.

**2. Fat Head's Brewery** - Known for Head Hunter IPA, which has won numerous awards and is considered one of the best IPAs in the country.

**3. Platform Beer Co.** - Their rotating IPA series showcases the latest hop varieties and brewing techniques.

> "Ohio's craft beer scene has exploded in the last decade, and our IPAs can compete with anyone in the country." - Local brewer

### The Hazy Revolution

Northeast Ohio has embraced the hazy IPA trend, with breweries like Masthead and Noble Beast creating silky, juicy interpretations that rival the best from New England.

## Plan Your IPA Tour

Use Ohio Beer Path to create your perfect IPA-focused brewery tour. Filter by region and add your favorites to your itinerary for an unforgettable hop-filled adventure.`,
    featured_image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=1200',
    author: 'Ohio Beer Path',
    category: 'Guides',
    tags: 'IPA, Best Of, 2024, Craft Beer',
    published: 1,
    created_at: new Date().toISOString()
  },
  {
    slug: 'cleveland-craft-beer-weekend-guide',
    title: 'The Ultimate Cleveland Craft Beer Weekend Guide',
    excerpt: 'Spend 48 hours exploring Cleveland\'s thriving craft beer scene, from Ohio City to Tremont and beyond.',
    content: `Cleveland's craft beer scene is one of the most exciting in the Midwest. With over 40 breweries in the greater Cleveland area, planning a beer-focused weekend can feel overwhelming. Here's our guide to making the most of 48 hours in the Forest City.

## Day 1: Ohio City

Start your morning with coffee at Rising Star before diving into Ohio City's brewery row.

### Must-Visit Spots

**Great Lakes Brewing Company** - Start at the godfather of Cleveland craft beer. Tour the brewery, then grab lunch at their brewpub.

**Market Garden Brewery** - Just across the street, Market Garden offers a more modern vibe with excellent food pairings.

**Hansa Brewery** - For something different, check out Hansa's German-style lagers and traditional recipes.

## Day 1 Evening: Downtown & Flats

As night falls, head downtown to Platform Beer Co. for their innovative brews, then explore the revitalized Flats district.

## Day 2: Tremont & Beyond

**Tremont Taphouse** - Not a brewery, but one of the best beer bars in the state with 100+ taps.

**Bookhouse Brewing** - A cozy neighborhood spot with excellent IPAs and a welcoming atmosphere.

### Pro Tips

- Use rideshare services or designate a driver
- Many breweries offer flights - great for sampling
- Check for live music on weekends
- Book brewery tours in advance during peak season

Make sure to check each brewery's hours before visiting, and use Ohio Beer Path to plan your route!`,
    featured_image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=1200',
    author: 'Ohio Beer Path',
    category: 'Guides',
    tags: 'Cleveland, Weekend Guide, Itinerary',
    published: 1,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    slug: 'ohio-beer-week-2024-preview',
    title: 'Ohio Beer Week 2024: What to Expect',
    excerpt: 'Get ready for the biggest celebration of Ohio craft beer with events happening across the state.',
    content: `Ohio Beer Week is back and bigger than ever! This annual celebration of Ohio craft beer brings together breweries, bars, and beer lovers from across the state for a week of special releases, tap takeovers, and collaborative events.

## When Is Ohio Beer Week?

Mark your calendars for the third week of July. Events will be happening throughout the week, with the biggest celebrations on Friday and Saturday.

## Featured Events

### Kickoff Party
The week starts with a massive kickoff party featuring 50+ Ohio breweries pouring their best. Location to be announced.

### Collaboration Brew Day
Watch as rival breweries come together to create special one-off beers. Past collaborations have produced some incredible results.

### Beer and Food Pairings
Participating restaurants will offer special menus designed to pair with local craft beers.

> "Ohio Beer Week is the highlight of our year. The collaboration between breweries shows what makes our state's beer scene so special." - Ohio Craft Brewers Association

## How to Participate

- Follow your favorite Ohio breweries on social media for announcements
- Sign up for brewery newsletters for early access to special releases
- Plan your route using Ohio Beer Path
- Consider booking accommodations near brewery districts

Stay tuned for the full event schedule coming soon!`,
    featured_image: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?w=1200',
    author: 'Ohio Beer Path',
    category: 'Events',
    tags: 'Events, Ohio Beer Week, 2024',
    published: 1,
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    slug: 'dog-friendly-ohio-breweries',
    title: '15 Dog-Friendly Ohio Breweries Where Your Pup Is Welcome',
    excerpt: 'Bring your four-legged friend along for brewery hopping at these pet-friendly Ohio spots.',
    content: `Who says you can't enjoy craft beer with your best friend? Ohio has dozens of dog-friendly breweries where your pup can join you for a pint. Here are our favorites.

## Cleveland Area

**1. Bookhouse Brewing** - Cozy patio perfect for dogs and their humans
**2. Collision Bend Brewing** - Spacious outdoor area with river views
**3. Terrestrial Brewing** - Dog-friendly taproom with a relaxed vibe

## Columbus Area

**4. Land-Grant Brewing** - Large outdoor space, often hosts dog-themed events
**5. Seventh Son Brewing** - Italian Village location welcomes well-behaved dogs
**6. Hoof Hearted Brewery** - Their Marengo location has plenty of space

## Cincinnati Area

**7. MadTree Brewing** - Expansive outdoor area, dog water bowls provided
**8. Rhinegeist** - Dog-friendly taproom in historic brewery building
**9. Fifty West Brewing** - Beautiful outdoor seating by the river

## Tips for Brewery Hopping with Dogs

- Always call ahead to confirm dog policies
- Bring water and a bowl for your pup
- Keep your dog on a leash
- Be mindful of other patrons
- Clean up after your dog
- Know your dog's limits in social situations

Many of these breweries even have special dog treats available. Use the Ohio Beer Path amenity filter to find more dog-friendly spots near you!`,
    featured_image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200',
    author: 'Ohio Beer Path',
    category: 'Guides',
    tags: 'Dog Friendly, Guides, Pet Friendly',
    published: 1,
    created_at: new Date(Date.now() - 259200000).toISOString()
  }
];
