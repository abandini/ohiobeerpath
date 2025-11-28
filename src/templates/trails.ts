import { layout } from './layout';
import type { Brewery } from '../types';

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

export function trailsPage(trails: Trail[]): string {
  const featuredTrails = trails.filter(t => t.featured);
  const otherTrails = trails.filter(t => !t.featured);

  const content = `
  <style>
    .trails-hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 4rem 0;
      color: white;
      text-align: center;
    }
    .trails-hero h1 {
      font-weight: 800;
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .trails-hero p {
      font-size: 1.1rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }
    .trail-card {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      background: white;
      transition: all 0.3s ease;
      height: 100%;
    }
    .trail-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    .trail-card-header {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .trail-card-header.featured {
      height: 200px;
    }
    .trail-card-header .trail-icon {
      font-size: 4rem;
    }
    .trail-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-easy { background: #10b981; color: white; }
    .badge-moderate { background: #f59e0b; color: white; }
    .badge-challenging { background: #ef4444; color: white; }
    .featured-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #D97706;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .trail-card-body {
      padding: 1.5rem;
    }
    .trail-card-body h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 0.5rem;
    }
    .trail-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 1rem;
    }
    .trail-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .trail-description {
      font-size: 0.9rem;
      color: #555;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .start-trail-btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #D97706, #B45309);
      color: white;
      text-decoration: none;
      text-align: center;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .start-trail-btn:hover {
      background: linear-gradient(135deg, #B45309, #92400E);
      color: white;
    }
  </style>

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

  return layout('Brewery Trails', content);
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

export function trailDetailPage(trail: Trail, breweries: Brewery[]): string {
  const content = `
  <style>
    .trail-hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 3rem 0;
      color: white;
    }
    .trail-hero h1 {
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .trail-stats {
      display: flex;
      gap: 2rem;
      margin-top: 1.5rem;
    }
    .trail-stat {
      text-align: center;
    }
    .trail-stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #D97706;
    }
    .trail-stat-label {
      font-size: 0.85rem;
      opacity: 0.8;
    }
    .trail-stop {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      margin-bottom: 1rem;
      position: relative;
    }
    .trail-stop::before {
      content: '';
      position: absolute;
      left: 35px;
      top: 100%;
      width: 3px;
      height: 1rem;
      background: #D97706;
    }
    .trail-stop:last-child::before {
      display: none;
    }
    .stop-number {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #D97706, #B45309);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .stop-info h4 {
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .stop-meta {
      font-size: 0.85rem;
      color: #666;
    }
    .start-tour-btn {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #D97706, #B45309);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .start-tour-btn:hover {
      background: linear-gradient(135deg, #B45309, #92400E);
    }
  </style>

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

  return layout(trail.name, content);
}

function getDifficultyIcon(difficulty?: string): string {
  switch (difficulty) {
    case 'easy': return '🟢';
    case 'moderate': return '🟡';
    case 'challenging': return '🔴';
    default: return '🟡';
  }
}
