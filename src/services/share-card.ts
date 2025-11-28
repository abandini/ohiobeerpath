/**
 * Share card generation service
 *
 * Creates shareable rating cards for social media with proper metadata
 */
import type { BeerRating } from '../types';

interface ShareCardData {
  rating: BeerRating;
  baseUrl: string;
}

/**
 * Generate Open Graph meta tags for a rating share
 */
export function generateShareMeta(data: ShareCardData): {
  title: string;
  description: string;
  image: string;
  url: string;
} {
  const { rating, baseUrl } = data;
  const stars = '\u2605'.repeat(rating.stars) + '\u2606'.repeat(5 - rating.stars);

  return {
    title: `${rating.beer_name} ${stars}`,
    description: `Rated at ${rating.brewery?.name || 'a brewery'} | ${rating.beer_style || 'Beer'} ${rating.abv ? `${rating.abv}% ABV` : ''} | ${rating.notes?.slice(0, 100) || 'Check out this great beer!'}`,
    image: rating.photos?.[0]?.photo_url || `${baseUrl}/assets/images/share-default.png`,
    url: `${baseUrl}/rating/${rating.id}`
  };
}

/**
 * Generate share URLs for various platforms
 */
export function generateShareLinks(data: ShareCardData): {
  twitter: string;
  facebook: string;
  untappd: string;
  ratebeer: string;
  copy: string;
} {
  const { rating, baseUrl } = data;
  const ratingUrl = `${baseUrl}/rating/${rating.id}`;
  const stars = '\u2605'.repeat(rating.stars);

  // Prepare text for sharing
  const shareText = `${stars} ${rating.beer_name} at ${rating.brewery?.name || 'Brewery Trip'} - ${rating.notes?.slice(0, 100) || 'Great beer!'}`;

  // URL encode for safety
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(ratingUrl);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=CraftBeer,BreweryTrip`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    untappd: `https://untappd.com/search?q=${encodeURIComponent(rating.beer_name)}`,
    ratebeer: `https://www.ratebeer.com/search?q=${encodeURIComponent(rating.beer_name)}`,
    copy: ratingUrl
  };
}

/**
 * Generate HTML for a shareable rating card (for screenshots/preview)
 */
export function generateShareCardHtml(data: ShareCardData): string {
  const { rating, baseUrl } = data;
  const photo = rating.photos?.[0];
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < rating.stars ? '\u2605' : '\u2606'
  ).join('');

  const date = new Date(rating.created_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${rating.beer_name} Rating | Brewery Trip</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .share-card {
      width: 100%;
      max-width: 500px;
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
    }
    .card-photo {
      width: 100%;
      aspect-ratio: 4/3;
      object-fit: cover;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
    .card-photo-placeholder {
      width: 100%;
      aspect-ratio: 4/3;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 80px;
    }
    .card-content {
      padding: 24px;
    }
    .card-beer-name {
      font-size: 28px;
      font-weight: 700;
      color: #111;
      margin-bottom: 4px;
    }
    .card-brewery {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .card-stars {
      font-size: 32px;
      color: #f59e0b;
      letter-spacing: 4px;
      margin-bottom: 16px;
    }
    .card-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .card-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 14px;
      color: #374151;
    }
    .card-notes {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .card-date {
      font-size: 13px;
      color: #9ca3af;
    }
    .card-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #d97706;
    }
    .card-brand svg {
      width: 20px;
      height: 20px;
    }
  </style>
</head>
<body>
  <div class="share-card">
    ${photo
      ? `<img src="${photo.photo_url}" alt="${rating.beer_name}" class="card-photo">`
      : `<div class="card-photo-placeholder">\u{1F37A}</div>`
    }
    <div class="card-content">
      <h1 class="card-beer-name">${escapeHtml(rating.beer_name)}</h1>
      <p class="card-brewery">at ${escapeHtml(rating.brewery?.name || 'Unknown Brewery')}${rating.brewery?.city ? `, ${escapeHtml(rating.brewery.city)}` : ''}</p>
      <div class="card-stars">${stars}</div>
      <div class="card-meta">
        ${rating.beer_style ? `<span class="card-badge">${escapeHtml(rating.beer_style)}</span>` : ''}
        ${rating.abv ? `<span class="card-badge">${rating.abv}% ABV</span>` : ''}
      </div>
      ${rating.notes ? `<p class="card-notes">${escapeHtml(rating.notes)}</p>` : ''}
    </div>
    <div class="card-footer">
      <span class="card-date">${formattedDate}</span>
      <span class="card-brand">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/></svg>
        Brewery Trip
      </span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate structured data for rating (JSON-LD)
 */
export function generateStructuredData(data: ShareCardData): string {
  const { rating, baseUrl } = data;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'itemReviewed': {
      '@type': 'Product',
      'name': rating.beer_name,
      'category': rating.beer_style || 'Beer',
      'brand': {
        '@type': 'Organization',
        'name': rating.brewery?.name || 'Unknown Brewery'
      }
    },
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': rating.stars,
      'bestRating': 5
    },
    'reviewBody': rating.notes || '',
    'datePublished': rating.created_at,
    'publisher': {
      '@type': 'Organization',
      'name': 'Brewery Trip',
      'url': baseUrl
    }
  };

  return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
