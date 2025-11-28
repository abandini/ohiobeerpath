/**
 * User profile and stats template
 */
import type { User, UserStats, BeerRating, SubdomainContext } from '../types';
import { layout } from './layout';

interface ProfileProps {
  user: User;
  stats: UserStats;
  ratings: BeerRating[];
  isOwnProfile: boolean;
  subdomain: Pick<SubdomainContext, 'baseUrl' | 'stateName'>;
}

export function userProfilePage(props: ProfileProps): string {
  const { user, stats, ratings, isOwnProfile, subdomain } = props;

  const content = `
    <div class="profile-header">
      <div class="container">
        <div class="profile-card">
          <div class="profile-avatar">
            ${user.avatar_url
              ? `<img src="${user.avatar_url}" alt="${user.display_name}" class="avatar-img">`
              : `<div class="avatar-placeholder"><i class="bi bi-person-circle"></i></div>`
            }
          </div>
          <div class="profile-info">
            <h1 class="profile-name">${user.display_name || 'Beer Enthusiast'}</h1>
            ${user.untappd_username
              ? `<a href="https://untappd.com/user/${user.untappd_username}" target="_blank" class="untappd-link">
                  <i class="bi bi-box-arrow-up-right"></i> @${user.untappd_username}
                 </a>`
              : ''
            }
            ${isOwnProfile
              ? `<a href="/settings" class="edit-profile-btn"><i class="bi bi-gear"></i> Settings</a>`
              : ''
            }
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total_ratings}</div>
            <div class="stat-label">Beers Rated</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.total_breweries}</div>
            <div class="stat-label">Breweries Visited</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.average_rating.toFixed(1)}</div>
            <div class="stat-label">Avg Rating</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.total_photos}</div>
            <div class="stat-label">Photos</div>
          </div>
        </div>

        ${stats.favorite_style
          ? `<div class="favorite-style">
              <i class="bi bi-heart-fill"></i> Favorite style: <strong>${stats.favorite_style}</strong>
             </div>`
          : ''
        }
      </div>
    </div>

    <div class="container profile-content">
      <div class="section-header">
        <h2><i class="bi bi-clock-history"></i> Recent Ratings</h2>
        ${stats.ratings_this_month > 0
          ? `<span class="badge">${stats.ratings_this_month} this month</span>`
          : ''
        }
      </div>

      ${ratings.length > 0
        ? `<div class="ratings-feed stagger-children">
            ${ratings.map(rating => renderRatingCard(rating, subdomain.baseUrl)).join('')}
           </div>`
        : `<div class="empty-state">
            <i class="bi bi-cup-straw"></i>
            <h3>No ratings yet</h3>
            <p>${isOwnProfile ? 'Start rating beers at breweries to build your collection!' : 'This user hasn\'t rated any beers yet.'}</p>
            ${isOwnProfile
              ? `<a href="/breweries" class="btn btn-primary">Find Breweries</a>`
              : ''
            }
           </div>`
      }
    </div>
  `;

  const styles = `
    <style>
      .profile-header {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 48px 0 32px;
        color: #fff;
        margin-top: -20px;
      }

      .profile-card {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 32px;
      }

      .profile-avatar {
        flex-shrink: 0;
      }

      .avatar-img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid rgba(255,255,255,0.2);
      }

      .avatar-placeholder {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        color: rgba(255,255,255,0.5);
      }

      .profile-name {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .untappd-link {
        color: #ffc107;
        text-decoration: none;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .untappd-link:hover {
        text-decoration: underline;
      }

      .edit-profile-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        font-size: 14px;
        margin-left: 16px;
        padding: 6px 12px;
        border-radius: 6px;
        background: rgba(255,255,255,0.1);
        transition: background 0.2s;
      }

      .edit-profile-btn:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .profile-card {
          flex-direction: column;
          text-align: center;
        }

        .edit-profile-btn {
          margin-left: 0;
          margin-top: 12px;
        }
      }

      .stat-card {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        backdrop-filter: blur(10px);
        transition: transform 0.2s ease, background 0.2s ease;
      }

      .stat-card:hover {
        transform: scale(1.05);
        background: rgba(255,255,255,0.15);
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #fbbf24;
      }

      .stat-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255,255,255,0.7);
        margin-top: 4px;
      }

      .favorite-style {
        margin-top: 24px;
        padding: 12px 16px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        font-size: 14px;
        color: rgba(255,255,255,0.8);
      }

      .favorite-style i {
        color: #ef4444;
      }

      .profile-content {
        padding: 32px 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .section-header h2 {
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-header .badge {
        background: #10b981;
        color: #fff;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .ratings-feed {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .rating-card {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
      }

      .rating-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      }

      .rating-card:active {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }

      .rating-card-inner {
        display: flex;
        gap: 16px;
        padding: 16px;
      }

      .rating-photo {
        width: 100px;
        height: 100px;
        border-radius: 12px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .rating-photo-placeholder {
        width: 100px;
        height: 100px;
        border-radius: 12px;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 32px;
        flex-shrink: 0;
      }

      .rating-content {
        flex: 1;
        min-width: 0;
      }

      .rating-beer-name {
        font-size: 18px;
        font-weight: 600;
        color: #111;
        margin-bottom: 4px;
      }

      .rating-brewery {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .rating-brewery a {
        color: #2563eb;
        text-decoration: none;
      }

      .rating-brewery a:hover {
        text-decoration: underline;
      }

      .rating-stars {
        display: flex;
        gap: 2px;
        margin-bottom: 8px;
      }

      .rating-stars i {
        color: #fbbf24;
        font-size: 16px;
      }

      .rating-stars i.empty {
        color: #e5e7eb;
      }

      .rating-style {
        display: inline-block;
        background: #f3f4f6;
        color: #374151;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-right: 8px;
      }

      .rating-abv {
        color: #6b7280;
        font-size: 12px;
      }

      .rating-notes {
        color: #4b5563;
        font-size: 14px;
        margin-top: 8px;
        line-height: 1.5;
      }

      .rating-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
        font-size: 12px;
        color: #9ca3af;
      }

      .rating-meta i {
        margin-right: 4px;
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        background: #f9fafb;
        border-radius: 16px;
      }

      .empty-state i {
        font-size: 64px;
        color: #d1d5db;
        margin-bottom: 16px;
      }

      .empty-state h3 {
        font-size: 20px;
        color: #374151;
        margin-bottom: 8px;
      }

      .empty-state p {
        color: #6b7280;
        margin-bottom: 24px;
      }
    </style>
  `;

  return layout(
    user.display_name || 'Profile',
    styles + content,
    {
      description: `Beer ratings and brewery visits by ${user.display_name || 'a beer enthusiast'}`,
      subdomain: subdomain as SubdomainContext
    }
  );
}

function renderRatingCard(rating: BeerRating, baseUrl: string): string {
  const photo = rating.photos?.[0];
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<i class="bi bi-star-fill ${i < rating.stars ? '' : 'empty'}"></i>`
  ).join('');

  const date = new Date(rating.created_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `
    <div class="rating-card">
      <div class="rating-card-inner">
        ${photo
          ? `<img src="${photo.photo_url_thumb || photo.photo_url}" alt="${rating.beer_name}" class="rating-photo">`
          : `<div class="rating-photo-placeholder"><i class="bi bi-cup-hot"></i></div>`
        }
        <div class="rating-content">
          <div class="rating-beer-name">${rating.beer_name}</div>
          <div class="rating-brewery">
            at <a href="${baseUrl}/brewery/${rating.brewery_id}">${rating.brewery?.name || 'Unknown Brewery'}</a>
            ${rating.brewery?.city ? `, ${rating.brewery.city}` : ''}
          </div>
          <div class="rating-stars">${stars}</div>
          ${rating.beer_style ? `<span class="rating-style">${rating.beer_style}</span>` : ''}
          ${rating.abv ? `<span class="rating-abv">${rating.abv}% ABV</span>` : ''}
          ${rating.notes ? `<div class="rating-notes">${escapeHtml(rating.notes)}</div>` : ''}
          <div class="rating-meta">
            <span><i class="bi bi-calendar3"></i> ${formattedDate}</span>
            ${rating.shared_to?.length
              ? `<span><i class="bi bi-share"></i> Shared</span>`
              : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Settings page template
 */
export function settingsPage(user: User, subdomain: Pick<SubdomainContext, 'baseUrl' | 'stateName'>): string {
  const content = `
    <div class="settings-page">
      <div class="container">
        <h1><i class="bi bi-gear"></i> Settings</h1>

        <form class="settings-form" action="/api/users/me/settings" method="POST">
          <div class="settings-section">
            <h2>Profile</h2>
            <div class="form-group">
              <label>Display Name</label>
              <input type="text" name="display_name" value="${user.display_name || ''}" class="form-control">
            </div>
          </div>

          <div class="settings-section">
            <h2>Rating Preferences</h2>

            <div class="form-group">
              <label>Beer Style List</label>
              <select name="style_preference" class="form-control">
                <option value="simple" ${user.style_preference === 'simple' ? 'selected' : ''}>Simple (~30 styles)</option>
                <option value="comprehensive" ${user.style_preference === 'comprehensive' ? 'selected' : ''}>Comprehensive (~150 styles)</option>
              </select>
              <small>Choose how detailed you want the beer style dropdown to be</small>
            </div>

            <div class="form-group">
              <label>Photo Mode</label>
              <select name="photo_mode" class="form-control">
                <option value="single" ${user.photo_mode === 'single' ? 'selected' : ''}>Single photo</option>
                <option value="multiple" ${user.photo_mode === 'multiple' ? 'selected' : ''}>Multiple photos</option>
              </select>
              <small>Choose whether to allow multiple photos per rating</small>
            </div>
          </div>

          <div class="settings-section">
            <h2>Privacy</h2>
            <div class="form-group">
              <label>Default Rating Privacy</label>
              <select name="privacy_default" class="form-control">
                <option value="public" ${user.privacy_default === 'public' ? 'selected' : ''}>Public by default</option>
                <option value="private" ${user.privacy_default === 'private' ? 'selected' : ''}>Private by default</option>
                <option value="ask" ${user.privacy_default === 'ask' ? 'selected' : ''}>Ask each time</option>
              </select>
              <small>Choose the default privacy setting for new ratings</small>
            </div>
          </div>

          <div class="settings-actions">
            <button type="submit" class="btn btn-primary btn-lg">Save Changes</button>
            <a href="/profile" class="btn btn-outline-secondary btn-lg">Cancel</a>
          </div>
        </form>

        <div class="settings-section danger-zone">
          <h2><i class="bi bi-exclamation-triangle"></i> Danger Zone</h2>
          <p>Disconnect your Untappd account or delete your data.</p>
          <a href="/api/auth/logout" class="btn btn-outline-danger">Sign Out</a>
        </div>
      </div>
    </div>

    <style>
      .settings-page {
        padding: 32px 0;
      }

      .settings-page h1 {
        margin-bottom: 32px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .settings-section {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }

      .settings-section h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        font-weight: 500;
        margin-bottom: 8px;
        color: #374151;
      }

      .form-group small {
        display: block;
        margin-top: 6px;
        color: #6b7280;
        font-size: 13px;
      }

      .form-control {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .settings-actions {
        display: flex;
        gap: 12px;
        margin-top: 32px;
      }

      .danger-zone {
        border: 1px solid #fecaca;
        background: #fef2f2;
      }

      .danger-zone h2 {
        color: #dc2626;
        border-bottom-color: #fecaca;
      }

      .danger-zone p {
        color: #991b1b;
        margin-bottom: 16px;
      }
    </style>
  `;

  return layout(
    'Settings',
    content,
    {
      description: 'Manage your Brewery Trip profile and preferences',
      subdomain: subdomain as SubdomainContext
    }
  );
}
