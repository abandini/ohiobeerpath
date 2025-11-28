/**
 * Share routes for rating cards
 */
import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';
import { getRatingById } from '../db/ratings';
import { markAsShared } from '../db/ratings';
import { layout } from '../templates/layout';
import {
  generateShareMeta,
  generateShareLinks,
  generateShareCardHtml,
  generateStructuredData
} from '../services/share-card';

const share = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/**
 * GET /rating/:id
 * Public rating page with share metadata
 */
share.get('/rating/:id', async (c) => {
  const subdomain = c.get('subdomain');
  const id = c.req.param('id');

  try {
    const rating = await getRatingById(c.env.DB, id);

    if (!rating) {
      return c.html('<h1>Rating not found</h1>', 404);
    }

    // Only show public ratings
    if (!rating.is_public) {
      return c.html('<h1>This rating is private</h1>', 403);
    }

    const baseUrl = subdomain.baseUrl;
    const meta = generateShareMeta({ rating, baseUrl });
    const shareLinks = generateShareLinks({ rating, baseUrl });
    const structuredData = generateStructuredData({ rating, baseUrl });
    const photo = rating.photos?.[0];

    // Build stars display
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="star ${i < rating.stars ? 'filled' : ''}">\u2605</span>`
    ).join('');

    const date = new Date(rating.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const content = `
      ${structuredData}
      <div class="rating-detail-page">
        <div class="container">
          <div class="rating-card-large">
            ${photo
              ? `<div class="rating-photo-container">
                   <img src="${photo.photo_url}" alt="${rating.beer_name}" class="rating-photo-large">
                 </div>`
              : ''
            }

            <div class="rating-info">
              <h1 class="beer-name">${rating.beer_name}</h1>
              <p class="brewery-name">
                at <a href="/brewery/${rating.brewery_id}">${rating.brewery?.name || 'Unknown Brewery'}</a>
                ${rating.brewery?.city ? `, ${rating.brewery.city}` : ''}
              </p>

              <div class="stars-large">${stars}</div>

              <div class="rating-badges">
                ${rating.beer_style ? `<span class="badge">${rating.beer_style}</span>` : ''}
                ${rating.abv ? `<span class="badge">${rating.abv}% ABV</span>` : ''}
              </div>

              ${rating.notes ? `<p class="rating-notes">${rating.notes}</p>` : ''}

              <div class="rating-meta">
                <span class="date"><i class="bi bi-calendar3"></i> ${formattedDate}</span>
                ${rating.user
                  ? `<a href="/user/${rating.user.id}" class="user">
                       ${rating.user.avatar_url
                         ? `<img src="${rating.user.avatar_url}" alt="" class="user-avatar">`
                         : '<i class="bi bi-person-circle"></i>'
                       }
                       ${rating.user.display_name || 'Anonymous'}
                     </a>`
                  : ''
                }
              </div>
            </div>
          </div>

          <!-- Share Section -->
          <div class="share-section">
            <h3><i class="bi bi-share"></i> Share this rating</h3>
            <div class="share-buttons">
              <a href="${shareLinks.twitter}" target="_blank" rel="noopener" class="share-btn twitter">
                <i class="bi bi-twitter"></i> Twitter
              </a>
              <a href="${shareLinks.facebook}" target="_blank" rel="noopener" class="share-btn facebook">
                <i class="bi bi-facebook"></i> Facebook
              </a>
              <a href="${shareLinks.untappd}" target="_blank" rel="noopener" class="share-btn untappd">
                <i class="bi bi-cup-straw"></i> Find on Untappd
              </a>
              <a href="${shareLinks.ratebeer}" target="_blank" rel="noopener" class="share-btn ratebeer">
                <i class="bi bi-star"></i> Find on RateBeer
              </a>
              <button class="share-btn copy" onclick="copyLink()">
                <i class="bi bi-link-45deg"></i> Copy Link
              </button>
            </div>
          </div>

          <!-- More photos -->
          ${rating.photos && rating.photos.length > 1
            ? `<div class="more-photos">
                 <h3>More Photos</h3>
                 <div class="photo-grid">
                   ${rating.photos.slice(1).map(p => `
                     <img src="${p.photo_url_thumb || p.photo_url}" alt="${rating.beer_name}"
                          class="photo-thumb" onclick="openPhoto('${p.photo_url}')">
                   `).join('')}
                 </div>
               </div>`
            : ''
          }

          <!-- CTA -->
          <div class="cta-section">
            <a href="/brewery/${rating.brewery_id}" class="btn btn-primary btn-lg">
              <i class="bi bi-shop"></i> Visit ${rating.brewery?.name || 'this brewery'}
            </a>
            <a href="/brewery/${rating.brewery_id}/rate" class="btn btn-success btn-lg">
              <i class="bi bi-plus-circle"></i> Rate a beer here
            </a>
          </div>
        </div>
      </div>

      <style>
        .rating-detail-page {
          padding: 32px 0;
        }

        .rating-card-large {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          margin-bottom: 32px;
        }

        .rating-photo-container {
          width: 100%;
          max-height: 400px;
          overflow: hidden;
        }

        .rating-photo-large {
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .rating-info {
          padding: 32px;
        }

        .beer-name {
          font-size: 32px;
          font-weight: 700;
          color: #111;
          margin-bottom: 8px;
        }

        .brewery-name {
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .brewery-name a {
          color: #2563eb;
          text-decoration: none;
        }

        .brewery-name a:hover {
          text-decoration: underline;
        }

        .stars-large {
          font-size: 40px;
          margin-bottom: 20px;
        }

        .stars-large .star {
          color: #e5e7eb;
        }

        .stars-large .star.filled {
          color: #f59e0b;
        }

        .rating-badges {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .rating-badges .badge {
          background: #f3f4f6;
          color: #374151;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .rating-notes {
          font-size: 18px;
          line-height: 1.7;
          color: #374151;
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
        }

        .rating-meta {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .rating-meta .date {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rating-meta .user {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          text-decoration: none;
        }

        .rating-meta .user:hover {
          color: #2563eb;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .share-section {
          background: #f9fafb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .share-section h3 {
          font-size: 18px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .share-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
          cursor: pointer;
        }

        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .share-btn.twitter {
          background: #1da1f2;
          color: #fff;
        }

        .share-btn.facebook {
          background: #1877f2;
          color: #fff;
        }

        .share-btn.untappd {
          background: #ffc000;
          color: #111;
        }

        .share-btn.ratebeer {
          background: #000;
          color: #fff;
        }

        .share-btn.copy {
          background: #6b7280;
          color: #fff;
        }

        .more-photos {
          margin-bottom: 32px;
        }

        .more-photos h3 {
          font-size: 18px;
          margin-bottom: 16px;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .photo-thumb {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .photo-thumb:hover {
          transform: scale(1.05);
        }

        .cta-section {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .beer-name { font-size: 24px; }
          .stars-large { font-size: 32px; }
          .rating-info { padding: 24px; }
          .share-buttons { flex-direction: column; }
          .share-btn { justify-content: center; }
        }
      </style>

      <script>
        function copyLink() {
          navigator.clipboard.writeText('${shareLinks.copy}').then(() => {
            const btn = document.querySelector('.share-btn.copy');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
          });
        }

        function openPhoto(url) {
          window.open(url, '_blank');
        }
      </script>
    `;

    return c.html(layout(meta.title, content, {
      description: meta.description,
      image: meta.image,
      url: meta.url,
      subdomain
    }));
  } catch (error) {
    console.error('Rating page error:', error);
    return c.html('<h1>Error loading rating</h1>', 500);
  }
});

/**
 * GET /rating/:id/card
 * Standalone share card page (for screenshots)
 */
share.get('/rating/:id/card', async (c) => {
  const subdomain = c.get('subdomain');
  const id = c.req.param('id');

  try {
    const rating = await getRatingById(c.env.DB, id);

    if (!rating || !rating.is_public) {
      return c.text('Rating not found', 404);
    }

    const html = generateShareCardHtml({ rating, baseUrl: subdomain.baseUrl });
    return c.html(html);
  } catch (error) {
    console.error('Share card error:', error);
    return c.text('Error generating card', 500);
  }
});

/**
 * POST /rating/:id/track-share
 * Track when a rating is shared to a platform
 */
share.post('/rating/:id/track-share', async (c) => {
  const id = c.req.param('id');

  try {
    const body = await c.req.json<{ platform: string }>();
    const validPlatforms = ['untappd', 'ratebeer', 'twitter', 'facebook'] as const;

    if (!body.platform || !validPlatforms.includes(body.platform as any)) {
      return c.json({ success: false, error: 'Invalid platform' }, 400);
    }

    await markAsShared(c.env.DB, id, body.platform as any);
    return c.json({ success: true });
  } catch (error) {
    console.error('Track share error:', error);
    return c.json({ success: false, error: 'Failed to track share' }, 500);
  }
});

export default share;
