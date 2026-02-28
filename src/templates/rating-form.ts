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
  <link rel="stylesheet" href="/assets/css/rating-form.css">
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
