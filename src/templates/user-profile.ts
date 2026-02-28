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
