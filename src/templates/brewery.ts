import { layout } from './layout';
import type { Brewery } from '../types';
import { hashCode } from './utils';

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

// Determine if brewery is currently open based on hours data
function getOpenStatus(hours?: Record<string, string>): { isOpen: boolean; label: string; cssClass: string } | null {
  if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const todayName = dayNames[now.getDay()];
  const todayHours = hours[todayName];

  if (!todayHours) return null;

  const trimmed = todayHours.trim();
  if (trimmed.toLowerCase() === 'closed') {
    return { isOpen: false, label: 'Closed Today', cssClass: 'status-closed' };
  }

  // Parse time range like "11:00 AM - 10:00 PM"
  const parts = trimmed.split(/\s*[-\u2013]\s*/);
  if (parts.length !== 2) return null;

  const parseTime = (timeStr: string): number | null => {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'AM' && hour === 12) hour = 0;
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    return hour * 60 + minute;
  };

  const openTime = parseTime(parts[0]);
  const closeTime = parseTime(parts[1]);
  if (openTime === null || closeTime === null) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let isOpen: boolean;
  if (closeTime > openTime) {
    isOpen = currentMinutes >= openTime && currentMinutes < closeTime;
  } else {
    // Overnight: open if after open OR before close
    isOpen = currentMinutes >= openTime || currentMinutes < closeTime;
  }

  return {
    isOpen,
    label: isOpen ? 'Open Now' : 'Closed',
    cssClass: isOpen ? 'status-open' : 'status-closed'
  };
}

export function breweryPage(brewery: Brewery, googleMapsApiKey?: string, nearbyBreweries?: Brewery[], reviews?: Review[]): string {
  const stateAbbrevToName: Record<string, string> = {
    OH: 'Ohio', MI: 'Michigan', PA: 'Pennsylvania',
    IN: 'Indiana', KY: 'Kentucky', WV: 'West Virginia'
  };
  const breweryStateName = stateAbbrevToName[brewery.state || ''] || 'Ohio';
  const breweryStateAbbr = brewery.state || 'OH';

  const hue = Math.abs(hashCode(brewery.name)) % 360;
  const openStatus = getOpenStatus(brewery.hours);
  const gradientColors = `hsl(${hue}, 70%, 35%), hsl(${(hue + 40) % 360}, 60%, 25%)`;

  // Support real brewery photos when available, fallback to gradient
  const heroBackground = brewery.image_url
    ? `background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${brewery.image_url}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, ${gradientColors});`;

  const amenitiesList = brewery.amenities && Array.isArray(brewery.amenities) && brewery.amenities.length > 0
    ? brewery.amenities.map(amenity => {
        const iconMap: Record<string, string> = {
          'tap room': 'bi-cup-straw',
          'taproom': 'bi-cup-straw',
          'brewery tours': 'bi-building',
          'beer to go': 'bi-bag',
          'beer to-go': 'bi-bag',
          'food truck': 'bi-truck',
          'food trucks': 'bi-truck',
          'outdoor seating': 'bi-sun',
          'dog friendly': 'bi-heart',
          'child friendly': 'bi-people',
          'live music': 'bi-music-note-beamed',
          'restaurant': 'bi-fork-knife',
          'full-service bar': 'bi-cup-hot',
          'full service bar': 'bi-cup-hot',
          'reservations': 'bi-calendar-check',
          'merchandise': 'bi-shop',
        };
        const lowerAmenity = amenity.toLowerCase();
        const icon = Object.entries(iconMap).find(([key]) => lowerAmenity.includes(key))?.[1] || 'bi-check-circle';
        return `<span class="amenity-tag"><i class="${icon}"></i> ${amenity}</span>`;
      }).join('')
    : '<p class="text-muted mb-0">No amenities listed</p>';

  const hoursOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hoursList = brewery.hours && typeof brewery.hours === 'object' && Object.keys(brewery.hours).length > 0
    ? hoursOrder.filter(day => brewery.hours![day]).map(day => {
        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
        return `
          <div class="hours-row ${isToday ? 'today' : ''}">
            <span class="day">${day}</span>
            <span class="time">${brewery.hours![day]}</span>
          </div>
        `;
      }).join('')
    : '<p class="text-muted mb-0">Hours not available</p>';

  // Build the address string
  const addressParts = [
    brewery.street,
    brewery.city,
    breweryStateAbbr,
    brewery.postal_code
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');
  const encodedAddress = encodeURIComponent(fullAddress || `${brewery.latitude},${brewery.longitude}`);

  // Map embed - use OpenStreetMap (no API key needed)
  const mapSection = brewery.latitude && brewery.longitude ? `
    <div class="map-container">
      <iframe
        width="100%"
        height="250"
        style="border:0; border-radius: 12px;"
        loading="lazy"
        src="https://www.openstreetmap.org/export/embed.html?bbox=${brewery.longitude - 0.01},${brewery.latitude - 0.008},${brewery.longitude + 0.01},${brewery.latitude + 0.008}&layer=mapnik&marker=${brewery.latitude},${brewery.longitude}">
      </iframe>
    </div>
  ` : '';

  const content = `
    <!-- Hero Section -->
    <div class="brewery-hero" style="${heroBackground}">
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb breadcrumb-light">
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item"><a href="/breweries">Breweries</a></li>
            <li class="breadcrumb-item active">${brewery.name}</li>
          </ol>
        </nav>
        <span class="region-pill">${(brewery.region || breweryStateName).toUpperCase()}</span>
        <h1 class="hero-title">${brewery.name}</h1>
        <p class="hero-location">
          <i class="bi bi-geo-alt-fill"></i> ${brewery.city || breweryStateName}, ${breweryStateName}
          ${brewery.brewery_type ? `<span class="mx-2">|</span><i class="bi bi-cup-straw"></i> ${brewery.brewery_type}` : ''}
          ${openStatus ? `<span class="mx-2">|</span><span class="open-status ${openStatus.cssClass}"><i class="bi ${openStatus.isOpen ? 'bi-clock' : 'bi-clock-history'}"></i> ${openStatus.label}</span>` : ''}
        </p>
        <div class="hero-actions">
          ${brewery.website_url ? `
            <a href="${brewery.website_url}" target="_blank" rel="noopener" class="btn btn-light btn-lg">
              <i class="bi bi-globe"></i> Visit Website
            </a>
          ` : ''}
          <button class="btn btn-warning btn-lg" onclick="addToTour(${brewery.id})">
            <i class="bi bi-plus-circle"></i> Add to Tour
          </button>
          <a href="/brewery/${brewery.id}/rate" class="btn btn-success btn-lg">
            <i class="bi bi-star-fill"></i> Rate a Beer
          </a>
          ${brewery.latitude && brewery.longitude ? `
            <a href="https://www.google.com/maps/dir/?api=1&destination=${brewery.latitude},${brewery.longitude}"
               target="_blank" rel="noopener" class="btn btn-outline-light btn-lg">
              <i class="bi bi-signpost-2"></i> Directions
            </a>
            <a href="https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${brewery.latitude}&dropoff[longitude]=${brewery.longitude}&dropoff[nickname]=${encodeURIComponent(brewery.name)}"
               target="_blank" rel="noopener" class="btn btn-outline-light btn-lg">
              <i class="bi bi-car-front"></i> Uber
            </a>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container brewery-content">
      <div class="row g-4">
        <!-- Left Column -->
        <div class="col-lg-8">
          <!-- About Section -->
          <div class="content-card">
            <h2><i class="bi bi-info-circle-fill text-warning"></i> About ${brewery.name}</h2>
            <p class="about-text">
              ${brewery.description && brewery.description !== 'N/A'
                ? brewery.description
                : `${brewery.name} is a craft brewery located in ${brewery.city}, ${breweryStateName}. Visit their taproom to experience their unique selection of handcrafted beers and enjoy the local brewery atmosphere.`}
            </p>
            ${brewery.phone ? `
              <div class="contact-info">
                <a href="tel:${brewery.phone.replace(/[^0-9]/g, '')}" class="contact-link">
                  <i class="bi bi-telephone-fill"></i> ${brewery.phone}
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Amenities Section -->
          <div class="content-card">
            <h2><i class="bi bi-stars text-warning"></i> Amenities & Features</h2>
            <div class="amenities-container">
              ${amenitiesList}
            </div>
          </div>

          <!-- Hours Section -->
          <div class="content-card">
            <h2><i class="bi bi-clock-fill text-warning"></i> Hours of Operation</h2>
            <div class="hours-container">
              ${hoursList}
            </div>
            <p class="hours-note">
              <i class="bi bi-info-circle"></i> Hours may vary. Please call ahead or check their website to confirm.
            </p>
          </div>
        </div>

        <!-- Right Column -->
        <div class="col-lg-4">
          <!-- Map Card -->
          <div class="sidebar-card">
            <h3><i class="bi bi-map-fill text-warning"></i> Location</h3>
            ${mapSection || `
              <div class="map-placeholder">
                <i class="bi bi-geo-alt"></i>
                <p>Map not available</p>
              </div>
            `}
            ${brewery.street || brewery.city ? `
              <address class="brewery-address">
                ${brewery.street ? `${brewery.street}<br>` : ''}
                ${brewery.city}, ${breweryStateAbbr} ${brewery.postal_code || ''}
              </address>
            ` : ''}
            ${brewery.latitude && brewery.longitude ? `
              <a href="https://www.google.com/maps/search/?api=1&query=${brewery.latitude},${brewery.longitude}"
                 target="_blank" rel="noopener" class="btn btn-outline-warning w-100">
                <i class="bi bi-box-arrow-up-right"></i> Open in Google Maps
              </a>
            ` : ''}
          </div>

          <!-- Quick Actions Card -->
          <div class="sidebar-card">
            <h3><i class="bi bi-lightning-fill text-warning"></i> Quick Actions</h3>
            <div class="quick-actions">
              <button class="action-btn" onclick="addToTour(${brewery.id})">
                <i class="bi bi-journal-plus"></i>
                <span>Add to Tour</span>
              </button>
              <button class="action-btn" onclick="shareBrewery()">
                <i class="bi bi-share-fill"></i>
                <span>Share</span>
              </button>
              <button class="action-btn" onclick="copyLink()">
                <i class="bi bi-link-45deg"></i>
                <span>Copy Link</span>
              </button>
              ${brewery.website_url ? `
                <a href="${brewery.website_url}" target="_blank" rel="noopener" class="action-btn">
                  <i class="bi bi-globe2"></i>
                  <span>Website</span>
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Nearby Breweries Teaser -->
          <div class="sidebar-card">
            <h3><i class="bi bi-geo text-warning"></i> Explore More</h3>
            <p class="text-muted">Discover other breweries in the ${brewery.region || breweryStateName} region.</p>
            <a href="/regions/${(brewery.region || 'central').toLowerCase()}" class="btn btn-warning w-100">
              <i class="bi bi-compass"></i> Explore ${brewery.region || breweryStateName} Region
            </a>
          </div>

          <!-- Claim Your Brewery CTA -->
          <div class="sidebar-card claim-brewery-card">
            <div class="claim-icon">
              <i class="bi bi-shield-check"></i>
            </div>
            <h3>Own This Brewery?</h3>
            <p>Claim your listing to update hours, add events, showcase your beers, and connect with customers.</p>
            <button class="btn btn-outline-warning w-100" onclick="showClaimModal()">
              <i class="bi bi-pencil-square"></i> Claim This Listing
            </button>
          </div>
        </div>
      </div>

      ${nearbyBreweries && nearbyBreweries.length > 0 ? `
      <!-- Nearby Breweries Section -->
      <div class="nearby-section">
        <h2><i class="bi bi-geo-alt text-warning"></i> More Breweries in ${brewery.region || breweryStateName}</h2>
        <div class="row g-3">
          ${nearbyBreweries.map(nb => {
            const nbHue = Math.abs(hashCode(nb.name)) % 360;
            return `
              <div class="col-md-6 col-lg-3">
                <a href="/brewery/${nb.id}" class="nearby-card">
                  <div class="nearby-img" style="background: linear-gradient(135deg, hsl(${nbHue}, 70%, 40%) 0%, hsl(${(nbHue + 40) % 360}, 60%, 30%) 100%);">
                    <i class="bi bi-cup-straw"></i>
                  </div>
                  <div class="nearby-info">
                    <h4>${nb.name}</h4>
                    <p>${nb.city}</p>
                  </div>
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Reviews Section -->
      <div class="reviews-section">
        <div class="reviews-header">
          <h2><i class="bi bi-star-fill text-warning"></i> Reviews & Ratings</h2>
          ${reviews && reviews.length > 0 ? `
            <div class="rating-summary">
              <span class="avg-rating">${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}</span>
              <div class="stars">
                ${[1,2,3,4,5].map(i => `<i class="bi bi-star${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) >= i ? '-fill' : ''}"></i>`).join('')}
              </div>
              <span class="review-count">${reviews.length} review${reviews.length !== 1 ? 's' : ''}</span>
            </div>
          ` : ''}
        </div>

        <!-- Write Review Form -->
        <div class="write-review-card">
          <h3><i class="bi bi-pencil-square"></i> Write a Review</h3>
          <form id="review-form" onsubmit="submitReview(event)">
            <div class="rating-input">
              <label>Your Rating</label>
              <div class="star-rating">
                ${[1,2,3,4,5].map(i => `
                  <input type="radio" id="star${i}" name="rating" value="${i}" required>
                  <label for="star${i}"><i class="bi bi-star-fill"></i></label>
                `).join('')}
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Title (optional)</label>
              <input type="text" class="form-control" name="title" placeholder="Summarize your experience">
            </div>
            <div class="mb-3">
              <label class="form-label">Your Review</label>
              <textarea class="form-control" name="content" rows="4" placeholder="Tell us about your visit..." required></textarea>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Your Name</label>
                <input type="text" class="form-control" name="username" placeholder="How should we display your name?" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Visit Date (optional)</label>
                <input type="date" class="form-control" name="visit_date">
              </div>
            </div>
            <button type="submit" class="btn btn-warning">
              <i class="bi bi-send"></i> Submit Review
            </button>
          </form>
        </div>

        <!-- Existing Reviews -->
        <div class="reviews-list">
          ${reviews && reviews.length > 0 ? reviews.map(review => `
            <div class="review-card">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-avatar" style="background: linear-gradient(135deg, hsl(${Math.abs(hashCode(review.user_id)) % 360}, 70%, 45%), hsl(${(Math.abs(hashCode(review.user_id)) + 40) % 360}, 60%, 35%));">
                    ${review.user_id.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span class="reviewer-name">${review.user_id}</span>
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                <div class="review-rating">
                  ${[1,2,3,4,5].map(i => `<i class="bi bi-star${review.rating >= i ? '-fill' : ''}"></i>`).join('')}
                </div>
              </div>
              ${review.title ? `<h4 class="review-title">${review.title}</h4>` : ''}
              ${review.content ? `<p class="review-content">${review.content}</p>` : ''}
              ${review.visit_date ? `<span class="visit-date"><i class="bi bi-calendar3"></i> Visited ${new Date(review.visit_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>` : ''}
              <div class="review-actions">
                <button class="helpful-btn" onclick="markHelpful(${review.id})">
                  <i class="bi bi-hand-thumbs-up"></i> Helpful ${review.helpful_count > 0 ? `(${review.helpful_count})` : ''}
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="no-reviews">
              <i class="bi bi-chat-quote"></i>
              <h4>No reviews yet</h4>
              <p>Be the first to share your experience at ${brewery.name}!</p>
            </div>
          `}
        </div>
      </div>

      <!-- AI Recommendations Section -->
      <div class="ai-recs-section">
        <h2><i class="bi bi-magic text-warning"></i> AI-Powered Recommendations</h2>
        <p class="text-muted mb-3">Find breweries with a similar vibe</p>
        <div class="rec-buttons mb-4">
          <button class="rec-btn" onclick="getRecommendations('cozy', null, event)">
            <i class="bi bi-lamp"></i> Cozy Vibes
          </button>
          <button class="rec-btn" onclick="getRecommendations('lively', null, event)">
            <i class="bi bi-music-note-beamed"></i> Lively Scene
          </button>
          <button class="rec-btn" onclick="getRecommendations('family', null, event)">
            <i class="bi bi-people"></i> Family Friendly
          </button>
          <button class="rec-btn active" onclick="getRecommendations('similar', ${brewery.id}, event)">
            <i class="bi bi-stars"></i> Similar to This
          </button>
        </div>
        <div id="ai-recs-loading" class="text-center d-none">
          <div class="spinner-border text-warning" role="status"></div>
          <p class="text-muted mt-2">Finding recommendations...</p>
        </div>
        <div id="ai-recs-results" class="row g-3"></div>
      </div>

      <!-- Back Link -->
      <div class="back-link">
        <a href="/breweries">
          <i class="bi bi-arrow-left"></i> Back to All Breweries
        </a>
      </div>
    </div>

    <!-- Claim Brewery Modal -->
    <div class="claim-modal-overlay" id="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claim-modal-title">
      <div class="claim-modal">
        <div class="claim-modal-header">
          <h3 id="claim-modal-title"><i class="bi bi-shield-check text-warning"></i> Claim ${brewery.name}</h3>
          <button class="claim-modal-close" onclick="hideClaimModal()" aria-label="Close">&times;</button>
        </div>
        <div class="claim-modal-body">
          <div class="claim-benefits">
            <h4><i class="bi bi-check-circle-fill"></i> Benefits of Claiming</h4>
            <ul>
              <li>Update business hours and contact info</li>
              <li>Add events and live music schedules</li>
              <li>Showcase your beer menu</li>
              <li>Respond to customer reviews</li>
              <li>Upload photos of your brewery</li>
            </ul>
          </div>
          <form id="claim-form" onsubmit="submitClaimRequest(event)">
            <div class="mb-3">
              <label class="form-label">Your Name *</label>
              <input type="text" class="form-control" name="name" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Your Role *</label>
              <select class="form-select" name="role" required>
                <option value="">Select your role...</option>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="marketing">Marketing/Social Media</option>
                <option value="staff">Staff Member</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-control" name="email" required>
              <div class="form-text">We'll use this to verify your claim and send login details.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-control" name="phone">
            </div>
            <div class="mb-3">
              <label class="form-label">Additional Notes</label>
              <textarea class="form-control" name="notes" rows="3" placeholder="Tell us anything else that might help verify your claim..."></textarea>
            </div>
            <input type="hidden" name="brewery_id" value="${brewery.id}">
            <input type="hidden" name="brewery_name" value="${brewery.name}">
            <button type="submit" class="btn btn-warning w-100">
              <i class="bi bi-send"></i> Submit Claim Request
            </button>
          </form>
        </div>
      </div>
    </div>


    <script>
      function addToTour(breweryId) {
        try {
          const tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
          if (!tour.includes(breweryId)) {
            tour.push(breweryId);
            localStorage.setItem('brewery_tour', JSON.stringify(tour));
            showToast('Added to your tour!', 'success');
            updateTourBadge();
          } else {
            showToast('Already in your tour', 'info');
          }
        } catch (error) {
          console.error('Error adding to tour:', error);
        }
      }

      function updateTourBadge() {
        try {
          const tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
          document.querySelectorAll('.badge').forEach(badge => {
            if (badge.closest('.nav-item') || badge.closest('a[href="/itinerary"]')) {
              badge.textContent = tour.length;
            }
          });
        } catch (error) {}
      }

      function shareBrewery() {
        if (navigator.share) {
          navigator.share({
            title: '${brewery.name.replace(/'/g, "\\'")}',
            text: 'Check out ${brewery.name.replace(/'/g, "\\'")} in ${brewery.city}, ${breweryStateName}!',
            url: window.location.href
          }).catch(() => {});
        } else {
          copyLink();
        }
      }

      function copyLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Link copied!', 'success');
        }).catch(() => {
          showToast('Failed to copy', 'error');
        });
      }

      function showToast(message, type = 'info') {
        const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
        const toast = document.createElement('div');
        toast.style.cssText = \`
          position: fixed; bottom: 20px; right: 20px; z-index: 9999;
          background: \${colors[type] || colors.info}; color: white;
          padding: 1rem 1.5rem; border-radius: 8px; font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease;
        \`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }

      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      \`;
      document.head.appendChild(style);

      document.addEventListener('DOMContentLoaded', updateTourBadge);

      // AI Recommendations
      async function getRecommendations(type, breweryId, evt) {
        const loading = document.getElementById('ai-recs-loading');
        const results = document.getElementById('ai-recs-results');

        // Update active button
        document.querySelectorAll('.rec-btn').forEach(btn => btn.classList.remove('active'));
        if (evt && evt.target) {
          evt.target.closest('.rec-btn').classList.add('active');
        } else {
          // Auto-load case: highlight "Similar to This" button
          document.querySelector('.rec-btn:last-child')?.classList.add('active');
        }

        loading.classList.remove('d-none');
        results.innerHTML = '';

        try {
          let url;
          if (type === 'similar' && breweryId) {
            url = '/api/ai/recommend?brewery_id=' + breweryId;
          } else {
            url = '/api/ai/recommend?mood=' + type;
          }

          const response = await fetch(url);
          const data = await response.json();

          if (data.success && data.recommendations) {
            results.innerHTML = data.recommendations.map(b => {
              const hue = Math.abs(hashCode(b.name)) % 360;
              return \`
                <div class="col-6 col-md-4 col-lg-2">
                  <a href="/brewery/\${b.id}" class="rec-card">
                    <div class="rec-card-img" style="background: linear-gradient(135deg, hsl(\${hue}, 70%, 40%), hsl(\${(hue + 40) % 360}, 60%, 30%));">
                      <i class="bi bi-cup-straw"></i>
                    </div>
                    <div class="rec-card-body">
                      <h5>\${b.name}</h5>
                      <p>\${b.city}</p>
                    </div>
                  </a>
                </div>
              \`;
            }).join('');

            if (data.reason) {
              results.innerHTML += '<div class="col-12 mt-2"><small class="text-muted"><i class="bi bi-lightbulb"></i> ' + data.reason + '</small></div>';
            }
          }
        } catch (err) {
          results.innerHTML = '<div class="col-12 text-center text-muted">Unable to load recommendations</div>';
        } finally {
          loading.classList.add('d-none');
        }
      }

      function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
      }

      // Auto-load similar recommendations on page load
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => getRecommendations('similar', ${brewery.id}), 500);
      });

      // Review submission
      async function submitReview(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
          brewery_id: ${brewery.id},
          rating: parseInt(formData.get('rating')),
          title: formData.get('title') || null,
          content: formData.get('content'),
          user_id: formData.get('username'),
          visit_date: formData.get('visit_date') || null
        };

        try {
          const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            showToast('Review submitted! Thank you for sharing.', 'success');
            setTimeout(() => location.reload(), 1500);
          } else {
            const error = await response.json();
            showToast(error.message || 'Failed to submit review', 'error');
          }
        } catch (err) {
          showToast('Network error. Please try again.', 'error');
        }
      }

      // Mark review helpful
      async function markHelpful(reviewId) {
        try {
          const response = await fetch('/api/reviews/' + reviewId + '/helpful', {
            method: 'POST'
          });
          if (response.ok) {
            showToast('Thanks for your feedback!', 'success');
            setTimeout(() => location.reload(), 1000);
          }
        } catch (err) {
          // Silent fail
        }
      }

      // Claim brewery modal functions
      function showClaimModal() {
        document.getElementById('claim-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      function hideClaimModal() {
        document.getElementById('claim-modal').classList.remove('active');
        document.body.style.overflow = '';
      }

      // Close modal on overlay click
      document.getElementById('claim-modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('claim-modal-overlay')) {
          hideClaimModal();
        }
      });

      // Close modal on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideClaimModal();
      });

      // Submit claim request
      async function submitClaimRequest(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
          brewery_id: formData.get('brewery_id'),
          brewery_name: formData.get('brewery_name'),
          name: formData.get('name'),
          role: formData.get('role'),
          email: formData.get('email'),
          phone: formData.get('phone') || null,
          notes: formData.get('notes') || null
        };

        try {
          const response = await fetch('/api/brewery-claims', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            hideClaimModal();
            showToast('Claim request submitted! We will contact you soon.', 'success');
            form.reset();
          } else {
            const error = await response.json();
            showToast(error.message || 'Failed to submit claim', 'error');
          }
        } catch (err) {
          showToast('Network error. Please try again.', 'error');
        }
      }
    </script>

    <!-- Schema injected via contentWithSchema below -->
  `;

  const baseUrl = 'https://brewerytrip.com';
  const pageUrl = `${baseUrl}/brewery/${brewery.id}`;

  const seoDescription = brewery.description && brewery.description !== 'N/A'
    ? brewery.description
    : `Visit ${brewery.name} in ${brewery.city || breweryStateName}, ${breweryStateName}. Discover craft beers and plan your brewery tour.`;

  // Dynamic OG image for this brewery
  const ogImage = `${baseUrl}/api/og/${brewery.id}`;

  // Build enhanced schema properties
  const schemaAmenities = (brewery.amenities || []).map(a => ({
    '@type': 'LocationFeatureSpecification',
    name: a,
    value: true
  }));

  // Parse hours into structured format
  const hoursSpecs: any[] = [];
  if (brewery.hours && typeof brewery.hours === 'object') {
    const dayMap: Record<string, string> = {
      Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday',
      Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday'
    };
    for (const [day, timeStr] of Object.entries(brewery.hours)) {
      if (typeof timeStr !== 'string' || !dayMap[day]) continue;
      const trimmed = timeStr.trim();
      if (trimmed.toLowerCase() === 'closed') continue;
      const parts = trimmed.split(/\s*[-\u2013]\s*/);
      if (parts.length === 2) {
        hoursSpecs.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: dayMap[day],
          opens: parts[0].trim(),
          closes: parts[1].trim()
        });
      }
    }
  }

  // Build aggregate rating from reviews
  const reviewSchemas: any[] = [];
  let aggregateRating: any = undefined;
  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      ratingCount: reviews.length,
      bestRating: '5',
      worstRating: '1'
    };
    reviewSchemas.push(...reviews.slice(0, 5).map(r => ({
      '@type': 'Review',
      ...(r.title && { name: r.title }),
      ...(r.content && { reviewBody: r.content }),
      datePublished: r.created_at,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating.toString(),
        bestRating: '5',
        worstRating: '1'
      },
      author: { '@type': 'Person', name: 'Beer Enthusiast' }
    })));
  }

  // Schema.org Brewery structured data for SEO + AEO
  const schemaJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Brewery',
    name: brewery.name,
    description: seoDescription,
    url: pageUrl,
    ...(brewery.website_url && { sameAs: brewery.website_url }),
    address: {
      '@type': 'PostalAddress',
      ...(brewery.street && { streetAddress: brewery.street }),
      addressLocality: brewery.city || breweryStateName,
      addressRegion: breweryStateAbbr,
      ...(brewery.postal_code && { postalCode: brewery.postal_code }),
      addressCountry: 'US'
    },
    ...(brewery.latitude && brewery.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: brewery.latitude,
        longitude: brewery.longitude
      }
    }),
    ...(brewery.phone && { telephone: brewery.phone }),
    ...(brewery.brewery_type && { additionalType: brewery.brewery_type }),
    servesCuisine: 'Beer',
    priceRange: '$$',
    isAccessibleForFree: true,
    ...(hoursSpecs.length > 0 && { openingHoursSpecification: hoursSpecs }),
    ...(schemaAmenities.length > 0 && { amenityFeature: schemaAmenities }),
    ...(aggregateRating && { aggregateRating }),
    ...(reviewSchemas.length > 0 && { review: reviewSchemas })
  });

  // BreadcrumbList schema for navigation context
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Breweries', item: `${baseUrl}/breweries` },
      { '@type': 'ListItem', position: 3, name: brewery.name }
    ]
  });

  const contentWithSchema = content + `
    <script type="application/ld+json">${schemaJsonLd}</script>
    <script type="application/ld+json">${breadcrumbJsonLd}</script>
  `;

  return layout(`${brewery.name}`, contentWithSchema, {
    description: seoDescription,
    image: ogImage,
    url: pageUrl,
    extraCss: ['/assets/css/pages/brewery.css'],
  });
}
