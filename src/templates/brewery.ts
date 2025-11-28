import { layout } from './layout';
import type { Brewery } from '../types';

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

export function breweryPage(brewery: Brewery, googleMapsApiKey?: string, nearbyBreweries?: Brewery[], reviews?: Review[]): string {
  // Generate a consistent color based on brewery name for placeholder
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const hue = Math.abs(hashCode(brewery.name)) % 360;
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
    'OH',
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
        <span class="region-pill">${(brewery.region || 'Ohio').toUpperCase()}</span>
        <h1 class="hero-title">${brewery.name}</h1>
        <p class="hero-location">
          <i class="bi bi-geo-alt-fill"></i> ${brewery.city}, Ohio
          ${brewery.brewery_type ? `<span class="mx-2">|</span><i class="bi bi-cup-straw"></i> ${brewery.brewery_type}` : ''}
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
          ${brewery.latitude && brewery.longitude ? `
            <a href="https://www.google.com/maps/dir/?api=1&destination=${brewery.latitude},${brewery.longitude}"
               target="_blank" rel="noopener" class="btn btn-outline-light btn-lg">
              <i class="bi bi-signpost-2"></i> Directions
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
                : `${brewery.name} is a craft brewery located in ${brewery.city}, Ohio. Visit their taproom to experience their unique selection of handcrafted beers and enjoy the local brewery atmosphere.`}
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
                ${brewery.city}, OH ${brewery.postal_code || ''}
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
            <p class="text-muted">Discover other breweries in the ${brewery.region || 'Ohio'} region.</p>
            <a href="/regions/${(brewery.region || 'central').toLowerCase()}" class="btn btn-warning w-100">
              <i class="bi bi-compass"></i> Explore ${brewery.region || 'Ohio'} Region
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
        <h2><i class="bi bi-geo-alt text-warning"></i> More Breweries in ${brewery.region || 'Ohio'}</h2>
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
    <div class="claim-modal-overlay" id="claim-modal">
      <div class="claim-modal">
        <div class="claim-modal-header">
          <h3><i class="bi bi-shield-check text-warning"></i> Claim ${brewery.name}</h3>
          <button class="claim-modal-close" onclick="hideClaimModal()">&times;</button>
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

    <style>
      /* Hero Section */
      .brewery-hero {
        position: relative;
        padding: 80px 0 60px;
        color: white;
        margin-top: -1rem;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg,
          rgba(0,0,0,0.4) 0%,
          rgba(0,0,0,0.5) 50%,
          rgba(0,0,0,0.7) 100%);
      }

      .hero-content {
        position: relative;
        z-index: 1;
      }

      .breadcrumb-light {
        background: transparent;
        padding: 0;
        margin-bottom: 1rem;
      }

      .breadcrumb-light .breadcrumb-item a {
        color: rgba(255,255,255,0.8);
        text-decoration: none;
      }

      .breadcrumb-light .breadcrumb-item.active {
        color: rgba(255,255,255,0.6);
      }

      .breadcrumb-light .breadcrumb-item + .breadcrumb-item::before {
        color: rgba(255,255,255,0.5);
      }

      .region-pill {
        display: inline-block;
        background: rgba(217, 119, 6, 0.9);
        backdrop-filter: blur(10px);
        padding: 8px 18px;
        border-radius: 25px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        margin-bottom: 1rem;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }

      .hero-title {
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: #ffffff !important;
        text-shadow:
          0 2px 4px rgba(0,0,0,0.5),
          0 4px 16px rgba(0,0,0,0.4),
          0 0 40px rgba(0,0,0,0.3);
        letter-spacing: -0.02em;
        line-height: 1.1;
        font-family: 'Outfit', -apple-system, sans-serif;
      }

      .hero-location {
        font-size: 1.25rem;
        color: rgba(255,255,255,0.95);
        margin-bottom: 1.5rem;
        font-weight: 500;
        text-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }

      .hero-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .hero-actions .btn {
        font-weight: 600;
        padding: 0.875rem 1.5rem;
        border-radius: 12px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .hero-actions .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }

      .hero-actions .btn-warning {
        background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
        border-color: #d97706;
      }

      .hero-actions .btn-light {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
      }

      .hero-actions .btn-outline-light {
        border-width: 2px;
        backdrop-filter: blur(10px);
      }

      .hero-actions .btn-outline-light:hover {
        background: rgba(255,255,255,0.2);
      }

      /* Main Content */
      .brewery-content {
        padding: 3rem 0;
      }

      .content-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.08);
        border: 1px solid rgba(0,0,0,0.04);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }

      .content-card:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1);
      }

      .content-card h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .about-text {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #444;
      }

      .contact-info {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #eee;
      }

      .contact-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #d97706;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.1rem;
      }

      .contact-link:hover {
        color: #b45309;
      }

      /* Amenities */
      .amenities-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .amenity-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #92400e;
        padding: 0.6rem 1rem;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .amenity-tag i {
        font-size: 1rem;
      }

      /* Hours */
      .hours-container {
        background: #f8fafc;
        border-radius: 12px;
        max-height: 280px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #d1d5db #f1f5f9;
      }

      .hours-container::-webkit-scrollbar {
        width: 6px;
      }

      .hours-container::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }

      .hours-container::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }

      .hours-container::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      .hours-row {
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .hours-row:last-child {
        border-bottom: none;
      }

      .hours-row.today {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        font-weight: 600;
      }

      .hours-row .day {
        font-weight: 600;
        color: #374151;
      }

      .hours-row .time {
        color: #6b7280;
      }

      .hours-note {
        font-size: 0.85rem;
        color: #9ca3af;
        margin-top: 1rem;
        margin-bottom: 0;
      }

      /* Sidebar */
      .sidebar-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.08);
        border: 1px solid rgba(0,0,0,0.04);
        transition: box-shadow 0.2s ease;
      }

      .sidebar-card:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1);
      }

      .sidebar-card h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .map-container {
        margin-bottom: 1rem;
        border-radius: 12px;
        overflow: hidden;
      }

      .map-placeholder {
        height: 200px;
        background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
      }

      .map-placeholder i {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }

      .brewery-address {
        font-style: normal;
        color: #6b7280;
        margin-bottom: 1rem;
        line-height: 1.6;
      }

      /* Quick Actions */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        color: #374151;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #fef3c7;
        border-color: #d97706;
        color: #92400e;
      }

      .action-btn i {
        font-size: 1.5rem;
      }

      /* Nearby Breweries */
      .nearby-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .nearby-section h2 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .nearby-card {
        display: block;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .nearby-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      }

      .nearby-img {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
      }

      .nearby-info {
        padding: 1rem;
      }

      .nearby-info h4 {
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 0.25rem 0;
        color: #1f2937;
      }

      .nearby-info p {
        font-size: 0.85rem;
        color: #6b7280;
        margin: 0;
      }

      /* Back Link */
      .back-link {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .back-link a {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
      }

      .back-link a:hover {
        color: #d97706;
      }

      /* AI Recommendations */
      .ai-recs-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .ai-recs-section h2 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .rec-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .rec-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 30px;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s;
      }

      .rec-btn:hover {
        border-color: #d97706;
        color: #d97706;
      }

      .rec-btn.active {
        background: linear-gradient(135deg, #d97706, #b45309);
        border-color: #d97706;
        color: white;
      }

      .rec-card {
        display: block;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s;
      }

      .rec-card:hover {
        transform: translateY(-4px);
      }

      .rec-card-img {
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
      }

      .rec-card-body {
        padding: 1rem;
      }

      .rec-card-body h5 {
        font-size: 0.95rem;
        font-weight: 700;
        margin: 0 0 0.25rem;
      }

      .rec-card-body p {
        font-size: 0.8rem;
        color: #6b7280;
        margin: 0;
      }

      /* Reviews Section */
      .reviews-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .reviews-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .reviews-header h2 {
        font-size: 1.5rem;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .rating-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #fef3c7;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
      }

      .avg-rating {
        font-size: 2rem;
        font-weight: 700;
        color: #92400e;
      }

      .rating-summary .stars {
        color: #d97706;
        font-size: 1.1rem;
      }

      .review-count {
        color: #78350f;
        font-size: 0.9rem;
      }

      .write-review-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        border: 2px dashed #e5e7eb;
      }

      .write-review-card h3 {
        font-size: 1.25rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .rating-input {
        margin-bottom: 1.5rem;
      }

      .rating-input label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .star-rating {
        display: flex;
        flex-direction: row-reverse;
        justify-content: flex-end;
        gap: 0.25rem;
      }

      .star-rating input {
        display: none;
      }

      .star-rating label {
        cursor: pointer;
        font-size: 2rem;
        color: #d1d5db;
        transition: color 0.15s;
      }

      .star-rating label:hover,
      .star-rating label:hover ~ label,
      .star-rating input:checked ~ label {
        color: #d97706;
      }

      .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .review-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border: 1px solid #e5e7eb;
      }

      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .reviewer-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .reviewer-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 1.1rem;
      }

      .reviewer-name {
        display: block;
        font-weight: 600;
        color: #1f2937;
      }

      .review-date {
        display: block;
        font-size: 0.85rem;
        color: #9ca3af;
      }

      .review-rating {
        color: #d97706;
        font-size: 1rem;
      }

      .review-title {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #1f2937;
      }

      .review-content {
        color: #4b5563;
        line-height: 1.7;
        margin-bottom: 1rem;
      }

      .visit-date {
        font-size: 0.85rem;
        color: #9ca3af;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }

      .review-actions {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f3f4f6;
      }

      .helpful-btn {
        background: none;
        border: 1px solid #e5e7eb;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
      }

      .helpful-btn:hover {
        border-color: #d97706;
        color: #d97706;
        background: #fef3c7;
      }

      .no-reviews {
        text-align: center;
        padding: 3rem 2rem;
        background: #f9fafb;
        border-radius: 16px;
      }

      .no-reviews i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .no-reviews h4 {
        color: #6b7280;
        margin-bottom: 0.5rem;
      }

      .no-reviews p {
        color: #9ca3af;
        margin: 0;
      }

      /* Claim Brewery CTA */
      .claim-brewery-card {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px dashed #d97706;
        text-align: center;
      }

      .claim-brewery-card .claim-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #d97706, #b45309);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
      }

      .claim-brewery-card .claim-icon i {
        font-size: 1.75rem;
        color: white;
      }

      .claim-brewery-card h3 {
        color: #92400e;
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
      }

      .claim-brewery-card p {
        color: #78350f;
        font-size: 0.9rem;
        line-height: 1.5;
        margin-bottom: 1rem;
      }

      /* Claim Modal */
      .claim-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
      }

      .claim-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .claim-modal {
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        transform: translateY(20px);
        transition: transform 0.3s;
      }

      .claim-modal-overlay.active .claim-modal {
        transform: translateY(0);
      }

      .claim-modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .claim-modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .claim-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
        padding: 0.25rem;
      }

      .claim-modal-close:hover {
        color: #1f2937;
      }

      .claim-modal-body {
        padding: 1.5rem;
      }

      .claim-modal-body .form-label {
        font-weight: 600;
        color: #374151;
      }

      .claim-modal-body .form-text {
        font-size: 0.85rem;
        color: #6b7280;
      }

      .claim-benefits {
        background: #f0fdf4;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .claim-benefits h4 {
        font-size: 0.9rem;
        color: #166534;
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .claim-benefits ul {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.85rem;
        color: #15803d;
      }

      .claim-benefits li {
        margin-bottom: 0.25rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .hero-title {
          font-size: 2rem;
        }

        .hero-actions {
          flex-direction: column;
        }

        .hero-actions .btn {
          width: 100%;
        }

        .content-card {
          padding: 1.5rem;
        }
      }
    </style>

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
            text: 'Check out ${brewery.name.replace(/'/g, "\\'")} in ${brewery.city}, Ohio!',
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

    <!-- JSON-LD Structured Data for SEO -->
    <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Brewery",
      "name": brewery.name,
      "description": brewery.description || `Craft brewery in ${brewery.city}, Ohio`,
      "url": `https://ohio-beer-path.bill-burkey.workers.dev/brewery/${brewery.id}`,
      "image": `https://ohio-beer-path.bill-burkey.workers.dev/api/og/${brewery.id}`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": brewery.street || "",
        "addressLocality": brewery.city || "",
        "addressRegion": "OH",
        "postalCode": brewery.postal_code || "",
        "addressCountry": "US"
      },
      ...(brewery.latitude && brewery.longitude ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": brewery.latitude,
          "longitude": brewery.longitude
        }
      } : {}),
      ...(brewery.phone ? { "telephone": brewery.phone } : {}),
      ...(brewery.website_url ? { "sameAs": brewery.website_url } : {}),
      "priceRange": "$$",
      "servesCuisine": "Craft Beer",
      ...(reviews && reviews.length > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
          "reviewCount": reviews.length,
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": reviews.slice(0, 3).map(review => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": review.user_id
          },
          "datePublished": review.created_at.split(' ')[0],
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": review.rating,
            "bestRating": "5",
            "worstRating": "1"
          },
          ...(review.content ? { "reviewBody": review.content } : {})
        }))
      } : {})
    }, null, 2)}
    </script>
  `;

  const seoDescription = brewery.description && brewery.description !== 'N/A'
    ? brewery.description
    : `Visit ${brewery.name} in ${brewery.city}, Ohio. Discover craft beers and plan your brewery tour.`;

  // Dynamic OG image for this brewery
  const ogImage = `https://ohio-beer-path.bill-burkey.workers.dev/api/og/${brewery.id}`;

  return layout(`${brewery.name}`, content, {
    description: seoDescription,
    image: ogImage,
    url: `https://ohio-beer-path.bill-burkey.workers.dev/brewery/${brewery.id}`
  });
}
