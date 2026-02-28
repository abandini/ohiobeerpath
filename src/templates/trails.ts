import { layout } from './layout';
import type { Brewery, SubdomainContext } from '../types';

export interface Trail {
  id: number;
  slug: string;
  name: string;
  description?: string;
  region?: string;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  estimated_hours?: number;
  brewery_ids: string; // JSON array
  image_url?: string;
  featured?: number;
}

export function trailsPage(trails: Trail[], subdomain?: SubdomainContext): string {
  const featuredTrails = trails.filter(t => t.featured);
  const otherTrails = trails.filter(t => !t.featured);

  const content = `

  <div class="trails-hero">
    <div class="container">
      <h1><i class="bi bi-signpost-2"></i> Brewery Trails</h1>
      <p>Curated routes through Ohio's best breweries. Pick a trail and start your adventure!</p>
    </div>
  </div>

  <div class="container my-5">
    ${featuredTrails.length > 0 ? `
    <h2 class="mb-4" style="font-weight: 700;"><i class="bi bi-star-fill text-warning"></i> Featured Trails</h2>
    <div class="row g-4 mb-5">
      ${featuredTrails.map(trail => trailCard(trail, true)).join('')}
    </div>
    ` : ''}

    ${otherTrails.length > 0 ? `
    <h2 class="mb-4" style="font-weight: 700;">All Trails</h2>
    <div class="row g-4">
      ${otherTrails.map(trail => trailCard(trail, false)).join('')}
    </div>
    ` : ''}

    <div class="text-center mt-5 p-4 bg-light rounded-3">
      <h4>Create Your Own Trail</h4>
      <p class="text-muted">Build a custom brewery tour and share it with friends!</p>
      <a href="/itinerary" class="btn btn-outline-primary">
        <i class="bi bi-plus-circle"></i> Build Custom Tour
      </a>
    </div>
  </div>`;

  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';
  return layout('Brewery Trails & Bar Crawls', content, {
    description: 'Discover curated brewery trails and bar crawls. Follow themed routes through craft beer hotspots or build your own custom brewery tour.',
    url: `${baseUrl}/trails`,
    subdomain,
  });
}

function trailCard(trail: Trail, featured: boolean): string {
  const breweryCount = JSON.parse(trail.brewery_ids || '[]').length;
  const gradients: Record<string, string> = {
    'northeast': 'linear-gradient(135deg, #667eea, #764ba2)',
    'southwest': 'linear-gradient(135deg, #f093fb, #f5576c)',
    'central': 'linear-gradient(135deg, #4facfe, #00f2fe)',
    'northwest': 'linear-gradient(135deg, #43e97b, #38f9d7)',
    'southeast': 'linear-gradient(135deg, #fa709a, #fee140)',
    'eastcentral': 'linear-gradient(135deg, #a8edea, #fed6e3)',
  };
  const gradient = gradients[trail.region || 'northeast'] || gradients['northeast'];

  return `
  <div class="${featured ? 'col-md-6 col-lg-4' : 'col-md-6 col-lg-4'}">
    <div class="trail-card">
      <div class="trail-card-header ${featured ? 'featured' : ''}" style="background: ${gradient};">
        <span class="trail-icon">${getTrailEmoji(trail.difficulty)}</span>
        ${trail.difficulty ? `<span class="trail-badge badge-${trail.difficulty}">${trail.difficulty}</span>` : ''}
        ${featured ? '<span class="featured-badge"><i class="bi bi-star-fill"></i> Featured</span>' : ''}
      </div>
      <div class="trail-card-body">
        <h3>${trail.name}</h3>
        <div class="trail-meta">
          <span><i class="bi bi-building"></i> ${breweryCount} breweries</span>
          ${trail.estimated_hours ? `<span><i class="bi bi-clock"></i> ~${trail.estimated_hours}h</span>` : ''}
          ${trail.region ? `<span><i class="bi bi-geo-alt"></i> ${trail.region}</span>` : ''}
        </div>
        <p class="trail-description">${trail.description || 'Explore this curated brewery trail.'}</p>
        <a href="/trails/${trail.slug}" class="start-trail-btn">
          <i class="bi bi-play-circle"></i> Start Trail
        </a>
      </div>
    </div>
  </div>`;
}

function getTrailEmoji(difficulty?: string): string {
  switch (difficulty) {
    case 'easy': return '🚶';
    case 'moderate': return '🚴';
    case 'challenging': return '🏃';
    default: return '🍺';
  }
}

export function trailDetailPage(trail: Trail, breweries: Brewery[], subdomain?: SubdomainContext): string {
  const content = `

  <div class="trail-hero">
    <div class="container">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-3">
          <li class="breadcrumb-item"><a href="/trails" class="text-white-50">Trails</a></li>
          <li class="breadcrumb-item active text-white">${trail.name}</li>
        </ol>
      </nav>
      <h1>${trail.name}</h1>
      <p style="opacity: 0.9; max-width: 600px;">${trail.description || ''}</p>

      <div class="trail-stats">
        <div class="trail-stat">
          <div class="trail-stat-value">${breweries.length}</div>
          <div class="trail-stat-label">Breweries</div>
        </div>
        ${trail.estimated_hours ? `
        <div class="trail-stat">
          <div class="trail-stat-value">${trail.estimated_hours}h</div>
          <div class="trail-stat-label">Est. Time</div>
        </div>
        ` : ''}
        <div class="trail-stat">
          <div class="trail-stat-value">${getDifficultyIcon(trail.difficulty)}</div>
          <div class="trail-stat-label">${trail.difficulty || 'Moderate'}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="container my-5">
    <div class="row">
      <div class="col-lg-8">
        <h3 class="mb-4"><i class="bi bi-geo-alt"></i> Trail Stops</h3>
        ${breweries.map((brewery, index) => `
          <div class="trail-stop">
            <div class="stop-number">${index + 1}</div>
            <div class="stop-info">
              <h4><a href="/brewery/${brewery.id}" class="text-dark">${brewery.name}</a></h4>
              <p class="stop-meta">
                <i class="bi bi-geo-alt"></i> ${brewery.city || 'Ohio'}
                ${brewery.brewery_type ? ` • ${brewery.brewery_type}` : ''}
              </p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="col-lg-4">
        <div class="sticky-top" style="top: 100px;">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Ready to start?</h5>
              <p class="text-muted">Add all ${breweries.length} breweries to your tour with one click!</p>
              <button class="start-tour-btn w-100" onclick="startTrail([${breweries.map(b => b.id).join(',')}])">
                <i class="bi bi-play-fill"></i> Start This Trail
              </button>
              <a href="/itinerary" class="btn btn-outline-secondary w-100 mt-2">
                <i class="bi bi-journal-text"></i> View My Tour
              </a>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-share"></i> Share This Trail</h6>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-fill" onclick="shareTrail('twitter')">
                  <i class="bi bi-twitter"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary flex-fill" onclick="shareTrail('facebook')">
                  <i class="bi bi-facebook"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary flex-fill" onclick="copyTrailLink()">
                  <i class="bi bi-link-45deg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function startTrail(breweryIds) {
      let tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
      breweryIds.forEach(id => {
        if (!tour.includes(id)) {
          tour.push(id);
        }
      });
      localStorage.setItem('brewery_tour', JSON.stringify(tour));
      updateTourBadge();
      alert('Added ' + breweryIds.length + ' breweries to your tour!');
    }

    function shareTrail(platform) {
      const url = window.location.href;
      const text = 'Check out this brewery trail: ${trail.name}';

      if (platform === 'twitter') {
        window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text));
      } else if (platform === 'facebook') {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url));
      }
    }

    function copyTrailLink() {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  </script>`;

  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';
  return layout(trail.name, content, {
    url: `${baseUrl}/trails/${trail.slug}`,
    subdomain,
  });
}

function getDifficultyIcon(difficulty?: string): string {
  switch (difficulty) {
    case 'easy': return '🟢';
    case 'moderate': return '🟡';
    case 'challenging': return '🔴';
    default: return '🟡';
  }
}
