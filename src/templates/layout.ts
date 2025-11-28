// Base HTML layout using template literals
import type { SubdomainContext } from '../types';

interface LayoutOptions {
  description?: string;
  image?: string;
  url?: string;
  subdomain?: SubdomainContext;
}

// Site branding based on subdomain - exported for use by other templates
export function getSiteBranding(subdomain?: SubdomainContext) {
  if (!subdomain || subdomain.isMultiState) {
    return {
      siteName: 'Brewery Trip',
      tagline: 'Plan Your Ultimate Brewery Tour',
      heroTitle: "Discover America's Craft Beer Scene",
      stateBadge: null,
      geoRegion: 'US',
      geoPlace: 'United States'
    };
  }
  return {
    siteName: `${subdomain.stateName} Brewery Trip`,
    tagline: `Explore ${subdomain.stateName}'s Best Craft Breweries`,
    heroTitle: `Discover ${subdomain.stateName}'s Craft Beer Scene`,
    stateBadge: subdomain.stateName?.toUpperCase() || null,
    geoRegion: `US-${getStateAbbr(subdomain.stateName || '')}`,
    geoPlace: subdomain.stateName || ''
  };
}

// State name to abbreviation
function getStateAbbr(state: string): string {
  const abbrs: Record<string, string> = {
    'Ohio': 'OH', 'Michigan': 'MI', 'Indiana': 'IN', 'Kentucky': 'KY',
    'Pennsylvania': 'PA', 'West Virginia': 'WV', 'New York': 'NY',
    'Illinois': 'IL', 'Wisconsin': 'WI', 'Minnesota': 'MN', 'Iowa': 'IA',
    'Missouri': 'MO', 'Tennessee': 'TN', 'North Carolina': 'NC',
    'Virginia': 'VA', 'Maryland': 'MD', 'California': 'CA', 'Colorado': 'CO',
    'Oregon': 'OR', 'Washington': 'WA', 'Texas': 'TX', 'Florida': 'FL',
    'Georgia': 'GA', 'Arizona': 'AZ', 'Nevada': 'NV'
  };
  return abbrs[state] || 'US';
}

export function layout(title: string, content: string, options: LayoutOptions = {}): string {
  const subdomain = options.subdomain;
  const branding = getSiteBranding(subdomain);
  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';

  const description = options.description || `Discover craft breweries across ${subdomain?.stateName || 'America'}. Plan your ultimate brewery tour with AI-powered recommendations.`;
  const image = options.image || `${baseUrl}/assets/images/og-image.png`;
  const url = options.url || baseUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#d97706">
  <title>${title} | ${branding.siteName}</title>

  <!-- SEO Meta Tags -->
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="${branding.siteName}">
  <meta name="geo.region" content="${branding.geoRegion}">
  <meta name="geo.placename" content="${branding.geoPlace}">
  <link rel="canonical" href="${url}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${branding.siteName}">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title} | ${branding.siteName}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${title} | ${branding.siteName}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">

  <!-- Schema.org WebSite Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "${branding.siteName}",
    "alternateName": "${branding.geoPlace} Brewery Guide",
    "url": "${baseUrl}",
    "description": "${description}",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "${baseUrl}/breweries?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>

  <!-- Google Fonts: Outfit (headings) + Inter (body) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">

  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

  <!-- Custom CSS -->
  <link rel="stylesheet" href="/assets/css/styles.css">
  <link rel="stylesheet" href="/assets/css/mobile.css">

  <!-- PWA Manifest -->
  <link rel="manifest" href="/site.webmanifest">

  <!-- Favicon (inline base64 for instant load) -->
  <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAw0lEQVRYhe2XQRKCMAxFU4eRm9Qj4hHgiHgT2OiqjtW2Jk3SFMe/67TwH/kMJADGcjUXrdP5ntu7LDvpnujDJVMODAqgxhwLUdzkGGNBsgCS5iWIJICGeQ7iA0DTPAVx0jb7pqgCLZ4+KFThCdDS/BXCPIKBctjPW7S+XUc2gAPAl9/PW2T6vq7RsSIAiGOQiIAM8HMRmAOYvwP/L6E5QD9/w5YQ/TYkQaY9oSYEuivWgCDPBVIgrMmICyE2G1JgqNPxAxe0XeKSPO89AAAAAElFTkSuQmCC">
  <link rel="apple-touch-icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAw0lEQVRYhe2XQRKCMAxFU4eRm9Qj4hHgiHgT2OiqjtW2Jk3SFMe/67TwH/kMJADGcjUXrdP5ntu7LDvpnujDJVMODAqgxhwLUdzkGGNBsgCS5iWIJICGeQ7iA0DTPAVx0jb7pqgCLZ4+KFThCdDS/BXCPIKBctjPW7S+XUc2gAPAl9/PW2T6vq7RsSIAiGOQiIAM8HMRmAOYvwP/L6E5QD9/w5YQ/TYkQaY9oSYEuivWgCDPBVIgrMmICyE2G1JgqNPxAxe0XeKSPO89AAAAAElFTkSuQmCC">
</head>
<body>
  ${navigation(branding)}

  ${content}

  ${footer(branding)}

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Global Tour & Utilities -->
  <script>
    // Update tour badge count
    function updateTourBadge() {
      const tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
      const badge = document.getElementById('tour-badge');
      if (badge) {
        badge.textContent = tour.length;
        badge.style.display = tour.length > 0 ? 'inline-block' : 'none';
      }
    }

    // Add to tour function (global)
    window.addToTour = function(breweryId) {
      let tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
      if (!tour.includes(breweryId)) {
        tour.push(breweryId);
        localStorage.setItem('brewery_tour', JSON.stringify(tour));
        updateTourBadge();
        return true;
      }
      return false;
    };

    // Remove from tour function (global)
    window.removeFromTour = function(breweryId) {
      let tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
      tour = tour.filter(id => id !== breweryId);
      localStorage.setItem('brewery_tour', JSON.stringify(tour));
      updateTourBadge();
    };

    // Check if brewery is in tour
    window.isInTour = function(breweryId) {
      const tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
      return tour.includes(breweryId);
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', updateTourBadge);

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  </script>
</body>
</html>`;
}

interface Branding {
  siteName: string;
  tagline: string;
  heroTitle: string;
  stateBadge: string | null;
  geoRegion: string;
  geoPlace: string;
}

// Custom pint glass SVG icon
const pintGlassIcon = `<svg class="pint-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
  <path d="M5 2C4.45 2 4 2.45 4 3v1.5c0 .28.11.53.29.71L6 7v12c0 1.66 1.34 3 3 3h6c1.66 0 3-1.34 3-3V7l1.71-1.79c.18-.18.29-.43.29-.71V3c0-.55-.45-1-1-1H5zm1 2h12v.5l-2 2.1V19c0 .55-.45 1-1 1H9c-.55 0-1-.45-1-1V6.6L6 4.5V4zm2 3v2h8V7H8zm0 4v1.5h8V11H8z" opacity="0.9"/>
  <path d="M8 7h8v2H8zM8 11h8v1.5H8z" fill="#fbbf24" opacity="0.6"/>
</svg>`;

function navigation(branding: Branding): string {
  const stateBadgeHtml = branding.stateBadge
    ? `<span class="state-badge">${branding.stateBadge}</span>`
    : '';

  return `
  <style>
    .navbar {
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.97) 0%, rgba(22, 33, 62, 0.97) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(251, 191, 36, 0.1);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1.35rem;
      color: #fff !important;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    .navbar-brand:hover {
      color: #fbbf24 !important;
      transform: translateY(-1px);
    }
    .navbar-brand .pint-icon {
      filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
      transition: transform 0.3s ease;
    }
    .navbar-brand:hover .pint-icon {
      transform: rotate(-10deg) scale(1.1);
    }
    .state-badge {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
    }
    .navbar-nav {
      gap: 0.25rem;
    }
    .navbar-nav .nav-link {
      color: rgba(255, 255, 255, 0.85) !important;
      font-weight: 500;
      font-size: 0.9rem;
      padding: 0.5rem 0.9rem !important;
      border-radius: 8px;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .navbar-nav .nav-link:hover {
      color: #fbbf24 !important;
      background: rgba(251, 191, 36, 0.1);
      transform: translateY(-2px);
    }
    .navbar-nav .nav-link i {
      font-size: 1rem;
      opacity: 0.8;
    }
    .navbar-nav .nav-link:hover i {
      opacity: 1;
    }
    .navbar-toggler {
      border: 1px solid rgba(251, 191, 36, 0.3);
      padding: 0.4rem 0.6rem;
    }
    .navbar-toggler:focus {
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.25);
    }
    .navbar-toggler-icon {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28251, 191, 36, 0.9%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
    }
    #tour-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.45rem;
      margin-left: 0.25rem;
      background: linear-gradient(135deg, #22c55e, #16a34a) !important;
      box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
    }
    @media (max-width: 991px) {
      .navbar-collapse {
        background: rgba(26, 26, 46, 0.98);
        margin-top: 0.75rem;
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid rgba(251, 191, 36, 0.1);
      }
      .navbar-nav .nav-link {
        padding: 0.75rem 1rem !important;
      }
    }
  </style>
  <nav class="navbar navbar-expand-lg sticky-top">
    <div class="container">
      <a class="navbar-brand" href="/">
        ${pintGlassIcon} ${branding.siteName}
        ${stateBadgeHtml}
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link" href="/">
              <i class="bi bi-house-door"></i> Home
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/breweries">
              <i class="bi bi-building"></i> Breweries
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/regions">
              <i class="bi bi-map"></i> Regions
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/nearby">
              <i class="bi bi-geo-alt"></i> Nearby
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/trails">
              <i class="bi bi-signpost-2"></i> Trails
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/events">
              <i class="bi bi-calendar-event"></i> Events
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/blog">
              <i class="bi bi-newspaper"></i> Blog
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/itinerary">
              <i class="bi bi-compass"></i> My Tour
              <span id="tour-badge" class="badge" style="display: none;">0</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>`;
}

function footer(branding: Branding): string {
  return `
  <!-- PWA Install Banner -->
  <div id="pwa-install-banner" class="pwa-banner d-none">
    <div class="container d-flex align-items-center justify-content-between">
      <div>
        <strong><i class="bi bi-phone"></i> Install ${branding.siteName}</strong>
        <span class="d-none d-md-inline"> - Quick access to brewery tours!</span>
      </div>
      <div>
        <button id="pwa-install-btn" class="btn btn-warning btn-sm me-2">Install</button>
        <button id="pwa-dismiss-btn" class="btn btn-outline-light btn-sm">Not Now</button>
      </div>
    </div>
  </div>

  <!-- Email Signup Banner -->
  <div class="email-signup-section py-5" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6 text-center">
          <h4 class="text-white mb-3"><i class="bi bi-envelope-heart"></i> Get ${branding.geoPlace} Beer News</h4>
          <p class="text-white-50 mb-4">New breweries, events, and exclusive tour recommendations</p>
          <form id="email-signup-form" class="d-flex gap-2 justify-content-center">
            <input type="email" id="signup-email" class="form-control" placeholder="your@email.com" style="max-width: 300px;" required>
            <button type="submit" class="btn btn-warning">
              <i class="bi bi-send"></i> Subscribe
            </button>
          </form>
          <div id="signup-message" class="mt-2"></div>
        </div>
      </div>
    </div>
  </div>

  <footer class="site-footer">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-4">
          <h5 class="footer-heading">${pintGlassIcon} ${branding.siteName}</h5>
          <p class="footer-text">Discover craft breweries across ${branding.geoPlace}. Plan your ultimate brewery tour.</p>
        </div>
        <div class="col-md-4">
          <h5 class="footer-heading">Quick Links</h5>
          <ul class="footer-links">
            <li><a href="/breweries">Breweries</a></li>
            <li><a href="/regions">Regions</a></li>
            <li><a href="/trails">Trails</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h5 class="footer-heading">Connect</h5>
          <p class="footer-text">
            Built with love on Cloudflare Workers<br>
            Powered by D1, R2, KV, Workers AI
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <small>&copy; 2025 ${branding.siteName}. All rights reserved.</small>
      </div>
    </div>
  </footer>

  <style>
    .site-footer {
      background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
      color: white;
      padding: 3rem 0 1.5rem;
    }

    .footer-heading {
      color: #fbbf24;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .footer-heading .pint-icon {
      width: 22px;
      height: 22px;
    }

    .footer-text {
      color: rgba(255,255,255,0.7);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 0.5rem;
    }

    .footer-links a {
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      transition: color 0.2s ease;
      font-size: 0.95rem;
    }

    .footer-links a:hover {
      color: #fbbf24;
    }

    .footer-bottom {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
    }
  </style>

  <style>
    .pwa-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #D97706, #B45309);
      color: white;
      padding: 1rem 0;
      z-index: 1050;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
    }
  </style>

  <script>
    // PWA Install Prompt
    let deferredPrompt;
    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaDismissBtn = document.getElementById('pwa-dismiss-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!localStorage.getItem('pwa-dismissed')) {
        pwaBanner.classList.remove('d-none');
      }
    });

    pwaInstallBtn?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        pwaBanner.classList.add('d-none');
      }
    });

    pwaDismissBtn?.addEventListener('click', () => {
      pwaBanner.classList.add('d-none');
      localStorage.setItem('pwa-dismissed', 'true');
    });

    // Email Signup
    document.getElementById('email-signup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const messageDiv = document.getElementById('signup-message');

      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (data.success) {
          messageDiv.innerHTML = '<span class="text-success">Thanks for subscribing!</span>';
          document.getElementById('signup-email').value = '';
        } else {
          messageDiv.innerHTML = '<span class="text-warning">' + (data.error || 'Error subscribing') + '</span>';
        }
      } catch (err) {
        messageDiv.innerHTML = '<span class="text-warning">Error. Please try again.</span>';
      }
    });
  </script>`;
}
