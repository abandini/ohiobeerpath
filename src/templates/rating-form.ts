/**
 * Beer rating form template
 *
 * Mobile-first, camera-forward rating experience
 */
import type { Brewery, User, BeerStyleSimple } from '../types';
import { BEER_STYLES_SIMPLE } from '../types';

interface RatingFormProps {
  brewery: Brewery;
  user: User | null;
  itineraryId?: string;
  baseUrl: string;
}

export function renderRatingForm({ brewery, user, itineraryId, baseUrl }: RatingFormProps): string {
  const isLoggedIn = !!user;
  const styleOptions = renderStyleOptions(user?.style_preference || 'simple');
  const photoMode = user?.photo_mode || 'single';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Rate a Beer at ${brewery.name} | Brewery Trip</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* Header */
    .header {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .back-btn:hover {
      background: rgba(255,255,255,0.2);
    }

    .brewery-info {
      flex: 1;
    }

    .brewery-name {
      font-size: 16px;
      font-weight: 600;
    }

    .brewery-location {
      font-size: 12px;
      opacity: 0.7;
    }

    /* Camera Section */
    .camera-section {
      position: relative;
      background: #000;
      aspect-ratio: 4/3;
      max-height: 50vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .camera-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-preview {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    .camera-placeholder {
      text-align: center;
      color: rgba(255,255,255,0.5);
    }

    .camera-placeholder i {
      font-size: 64px;
      margin-bottom: 12px;
    }

    .camera-controls {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 32px;
    }

    .capture-btn {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #fff;
      border: 4px solid rgba(255,255,255,0.3);
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.2s;
      position: relative;
    }

    .capture-btn::after {
      content: '';
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: #fff;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(0.95); opacity: 0.8; }
    }

    .capture-btn:active {
      transform: scale(0.95);
    }

    .camera-action-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .skip-photo {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.5);
      border: none;
      color: #fff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
    }

    .photo-mode-toggle {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(0,0,0,0.5);
      border: none;
      color: #fff;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Form Section */
    .form-section {
      padding: 24px 16px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: rgba(255,255,255,0.8);
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      color: #fff;
      font-size: 16px;
      transition: border-color 0.2s, background 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #fbbf24;
      background: rgba(255,255,255,0.15);
    }

    .form-input::placeholder {
      color: rgba(255,255,255,0.4);
    }

    .form-select {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      color: #fff;
      font-size: 16px;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
    }

    .form-select:focus {
      outline: none;
      border-color: #fbbf24;
    }

    /* Star Rating */
    .star-rating {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin: 16px 0;
    }

    .star {
      font-size: 40px;
      color: rgba(255,255,255,0.3);
      cursor: pointer;
      transition: color 0.15s, transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }

    .star:hover,
    .star.active {
      color: #fbbf24;
      transform: scale(1.1);
    }

    .star.active {
      animation: star-pop 0.3s ease;
    }

    @keyframes star-pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1.1); }
    }

    .rating-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      padding: 0 8px;
    }

    /* Textarea */
    .form-textarea {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      color: #fff;
      font-size: 16px;
      resize: none;
      min-height: 100px;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #fbbf24;
      background: rgba(255,255,255,0.15);
    }

    /* Privacy Toggle */
    .privacy-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }

    .toggle-switch {
      width: 48px;
      height: 28px;
      background: rgba(255,255,255,0.2);
      border-radius: 14px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-switch.active {
      background: #10b981;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 24px;
      background: #fff;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
    }

    .toggle-switch.active::after {
      transform: translateX(20px);
    }

    .toggle-label {
      flex: 1;
    }

    .toggle-label-title {
      font-weight: 500;
    }

    .toggle-label-desc {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: none;
      border-radius: 16px;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
    }

    .submit-btn:active {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Login Required */
    .login-required {
      text-align: center;
      padding: 48px 24px;
    }

    .login-required i {
      font-size: 64px;
      color: #fbbf24;
      margin-bottom: 16px;
    }

    .login-required h2 {
      margin-bottom: 8px;
    }

    .login-required p {
      color: rgba(255,255,255,0.6);
      margin-bottom: 24px;
    }

    .login-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: #ffc107;
      color: #000;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }

    /* Success Animation */
    .success-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      flex-direction: column;
    }

    .success-overlay.show {
      display: flex;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .success-icon {
      font-size: 80px;
      color: #10b981;
      animation: bounceIn 0.5s ease;
    }

    @keyframes bounceIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .success-text {
      font-size: 24px;
      font-weight: 600;
      margin-top: 16px;
    }

    .share-buttons {
      display: flex;
      gap: 12px;
      margin-top: 32px;
    }

    .share-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s;
    }

    .share-btn:hover {
      transform: scale(1.05);
    }

    .share-btn.untappd {
      background: #ffc107;
      color: #000;
    }

    .share-btn.ratebeer {
      background: #c0392b;
      color: #fff;
    }

    .share-btn.more {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }

    .close-success {
      margin-top: 24px;
      color: rgba(255,255,255,0.6);
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
    }

    /* File input hidden */
    .file-input {
      display: none;
    }
  </style>
</head>
<body>
  <header class="header">
    <button class="back-btn" onclick="history.back()">
      <i class="bi bi-arrow-left"></i>
    </button>
    <div class="brewery-info">
      <div class="brewery-name">${brewery.name}</div>
      <div class="brewery-location">${brewery.city}, ${brewery.state || 'OH'}</div>
    </div>
  </header>

  ${isLoggedIn ? renderRatingFormContent(brewery, user!, itineraryId, styleOptions, photoMode, baseUrl) : renderLoginRequired(baseUrl, brewery.id)}

  <div class="success-overlay" id="successOverlay">
    <i class="bi bi-check-circle-fill success-icon"></i>
    <div class="success-text">Cheers!</div>
    <p style="color: rgba(255,255,255,0.6); margin-top: 8px;">Rating saved</p>
    <div class="share-buttons">
      <button class="share-btn untappd" onclick="shareToUntappd()">
        <i class="bi bi-share"></i> Untappd
      </button>
      <button class="share-btn ratebeer" onclick="shareToRateBeer()">
        <i class="bi bi-share"></i> RateBeer
      </button>
      <button class="share-btn more" onclick="shareMore()">
        <i class="bi bi-three-dots"></i> More
      </button>
    </div>
    <div style="display: flex; gap: 12px; margin-top: 20px;">
      <button class="share-btn more" onclick="viewRating()" style="background: #10b981;">
        <i class="bi bi-eye"></i> View Rating
      </button>
      <button class="close-success" onclick="closeSuccess()" style="margin: 0;">Done</button>
    </div>
  </div>

  <input type="file" accept="image/*" capture="environment" class="file-input" id="cameraInput">
  <input type="file" accept="image/*" multiple class="file-input" id="galleryInput">

  <script>
    // State
    let photoFile = null;
    let photoMode = '${photoMode}';
    let selectedStars = 0;
    let ratingId = null;

    // Camera handling
    const cameraInput = document.getElementById('cameraInput');
    const galleryInput = document.getElementById('galleryInput');

    function openCamera() {
      cameraInput.click();
    }

    function openGallery() {
      galleryInput.click();
    }

    cameraInput.addEventListener('change', handlePhotoCapture);
    galleryInput.addEventListener('change', handlePhotoCapture);

    function handlePhotoCapture(e) {
      const file = e.target.files[0];
      if (!file) return;

      photoFile = file;

      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.getElementById('photoPreview');
        if (preview) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        }
        document.querySelector('.camera-placeholder')?.remove();
        document.querySelector('.capture-btn')?.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }

    function retakePhoto() {
      photoFile = null;
      const preview = document.getElementById('photoPreview');
      if (preview) {
        preview.style.display = 'none';
        preview.src = '';
      }
      // Recreate placeholder
      const cameraSection = document.querySelector('.camera-section');
      if (!document.querySelector('.camera-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'camera-placeholder';
        placeholder.innerHTML = '<i class="bi bi-camera"></i><p>Tap to take a photo</p>';
        cameraSection.insertBefore(placeholder, cameraSection.firstChild);
      }
    }

    function skipPhoto() {
      document.querySelector('.camera-section').style.display = 'none';
    }

    // Star rating
    function setRating(stars) {
      selectedStars = stars;
      document.querySelectorAll('.star').forEach((star, index) => {
        star.classList.toggle('active', index < stars);
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      document.getElementById('starsInput').value = stars;
    }

    // Privacy toggle
    function togglePrivacy() {
      const toggle = document.querySelector('.toggle-switch');
      const input = document.getElementById('isPublic');
      toggle.classList.toggle('active');
      input.value = toggle.classList.contains('active') ? '1' : '0';
    }

    // Form submission
    async function submitRating(e) {
      e.preventDefault();

      const form = e.target;
      const submitBtn = form.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        // Create rating
        const response = await fetch('${baseUrl}/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            brewery_id: ${brewery.id},
            beer_name: form.beer_name.value,
            stars: parseInt(form.stars.value),
            beer_style: form.beer_style.value || null,
            notes: form.notes.value || null,
            abv: form.abv.value ? parseFloat(form.abv.value) : null,
            is_public: form.is_public.value === '1',
            itinerary_id: '${itineraryId || ''}'
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to save rating');
        }

        ratingId = data.rating.id;

        // Upload photo if we have one
        if (photoFile) {
          const photoFormData = new FormData();
          photoFormData.append('photos', photoFile);

          await fetch(\`${baseUrl}/api/ratings/\${ratingId}/photos\`, {
            method: 'POST',
            body: photoFormData
          });
        }

        // Show success
        showSuccess();

      } catch (error) {
        alert(error.message || 'Something went wrong');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Rating';
      }
    }

    function showSuccess() {
      document.getElementById('successOverlay').classList.add('show');

      // Confetti effect
      createConfetti();
    }

    function createConfetti() {
      const colors = ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = \`
          position: fixed;
          width: 10px;
          height: 10px;
          background: \${colors[Math.floor(Math.random() * colors.length)]};
          left: \${Math.random() * 100}vw;
          top: -10px;
          border-radius: 50%;
          z-index: 999;
          animation: fall \${1 + Math.random() * 2}s linear forwards;
        \`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
      }

      // Add falling animation
      if (!document.getElementById('confettiStyles')) {
        const style = document.createElement('style');
        style.id = 'confettiStyles';
        style.textContent = \`
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        \`;
        document.head.appendChild(style);
      }
    }

    function closeSuccess() {
      window.location.href = '${baseUrl}/brewery/${brewery.id}';
    }

    function shareToUntappd() {
      // Record share
      fetch(\`${baseUrl}/api/ratings/\${ratingId}/share\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'untappd' })
      });

      // Open Untappd (deep link or web)
      const breweryName = encodeURIComponent('${brewery.name}');
      window.open(\`https://untappd.com/search?q=\${breweryName}\`, '_blank');
    }

    function shareToRateBeer() {
      fetch(\`${baseUrl}/api/ratings/\${ratingId}/share\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'ratebeer' })
      });

      const breweryName = encodeURIComponent('${brewery.name}');
      window.open(\`https://www.ratebeer.com/search?q=\${breweryName}\`, '_blank');
    }

    function shareMore() {
      const shareUrl = ratingId ? \`${baseUrl}/rating/\${ratingId}\` : \`${baseUrl}/brewery/${brewery.id}\`;

      if (navigator.share) {
        navigator.share({
          title: 'Check out my beer rating!',
          text: \`I just rated a beer at ${brewery.name} on Brewery Trip!\`,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
          const btn = document.querySelector('.share-btn.more');
          const originalHtml = btn.innerHTML;
          btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
          setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
        });
      }
    }

    function viewRating() {
      if (ratingId) {
        window.location.href = \`${baseUrl}/rating/\${ratingId}\`;
      }
    }
  </script>
</body>
</html>
`;
}

function renderRatingFormContent(
  brewery: Brewery,
  user: User,
  itineraryId: string | undefined,
  styleOptions: string,
  photoMode: string,
  baseUrl: string
): string {
  return `
  <section class="camera-section" onclick="openCamera()">
    <img id="photoPreview" class="photo-preview" style="display: none;">
    <div class="camera-placeholder">
      <i class="bi bi-camera"></i>
      <p>Tap to take a photo</p>
    </div>
    <button class="skip-photo" onclick="event.stopPropagation(); skipPhoto()">Skip photo</button>
    <button class="photo-mode-toggle" onclick="event.stopPropagation(); openGallery()">
      <i class="bi bi-images"></i> Gallery
    </button>
    <div class="camera-controls" onclick="event.stopPropagation()">
      <button class="camera-action-btn" onclick="retakePhoto()">
        <i class="bi bi-arrow-counterclockwise"></i>
      </button>
      <button class="capture-btn" onclick="openCamera()"></button>
      <button class="camera-action-btn" onclick="openGallery()">
        <i class="bi bi-image"></i>
      </button>
    </div>
  </section>

  <form class="form-section" onsubmit="submitRating(event)">
    <input type="hidden" name="brewery_id" value="${brewery.id}">
    <input type="hidden" name="itinerary_id" value="${itineraryId || ''}">
    <input type="hidden" id="starsInput" name="stars" value="0" required>
    <input type="hidden" id="isPublic" name="is_public" value="${user.privacy_default === 'public' ? '1' : '0'}">

    <div class="form-group">
      <label class="form-label">Beer Name *</label>
      <input type="text" name="beer_name" class="form-input" placeholder="What are you drinking?" required autocomplete="off">
    </div>

    <div class="form-group">
      <label class="form-label">Your Rating *</label>
      <div class="star-rating">
        ${[1, 2, 3, 4, 5].map(n => `<i class="bi bi-star-fill star" onclick="setRating(${n})"></i>`).join('')}
      </div>
      <div class="rating-labels">
        <span>Meh</span>
        <span>OK</span>
        <span>Amazing!</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Style (optional)</label>
      <select name="beer_style" class="form-select">
        <option value="">Select a style...</option>
        ${styleOptions}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">ABV % (optional)</label>
      <input type="number" name="abv" class="form-input" placeholder="e.g., 5.5" step="0.1" min="0" max="100">
    </div>

    <div class="form-group">
      <label class="form-label">Tasting Notes (optional)</label>
      <textarea name="notes" class="form-textarea" placeholder="What did you think?"></textarea>
    </div>

    <div class="form-group">
      <div class="privacy-toggle" onclick="togglePrivacy()">
        <div class="toggle-switch ${user.privacy_default === 'public' ? 'active' : ''}"></div>
        <div class="toggle-label">
          <div class="toggle-label-title">Share publicly</div>
          <div class="toggle-label-desc">Other users can see your rating</div>
        </div>
      </div>
    </div>

    <button type="submit" class="submit-btn">Save Rating</button>
  </form>
  `;
}

function renderLoginRequired(baseUrl: string, breweryId: number): string {
  return `
  <div class="login-required">
    <i class="bi bi-person-circle"></i>
    <h2>Sign in to rate beers</h2>
    <p>Connect with Untappd to save your ratings and share with friends</p>
    <a href="${baseUrl}/api/auth/untappd?return=${encodeURIComponent(`${baseUrl}/brewery/${breweryId}/rate`)}" class="login-btn">
      <i class="bi bi-box-arrow-in-right"></i>
      Sign in with Untappd
    </a>
  </div>
  `;
}

function renderStyleOptions(preference: 'simple' | 'comprehensive'): string {
  return BEER_STYLES_SIMPLE.map(style =>
    `<option value="${style}">${style}</option>`
  ).join('');
}
