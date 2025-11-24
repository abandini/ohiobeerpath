// Base HTML layout using template literals

export function layout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Discover craft breweries across Ohio. Plan your ultimate brewery tour.">
  <meta name="theme-color" content="#d97706">
  <title>${title} | Ohio Beer Path</title>

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

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/assets/images/favicon.png">
</head>
<body>
  ${navigation()}

  ${content}

  ${footer()}

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Service Worker -->
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  </script>
</body>
</html>`;
}

function navigation(): string {
  return `
  <nav class="navbar navbar-expand-lg sticky-top">
    <div class="container">
      <a class="navbar-brand" href="/">
        <i class="bi bi-cup-straw"></i> Ohio Beer Path
        <span class="state-badge">OHIO</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link" href="/">
              <i class="bi bi-house"></i> Home
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
            <a class="nav-link" href="/itinerary">
              <i class="bi bi-journal-text"></i> My Tour
              <span class="badge">0</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>`;
}

function footer(): string {
  return `
  <footer class="bg-dark text-white py-5 mt-5">
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <h5><i class="bi bi-cup-straw"></i> Ohio Beer Path</h5>
          <p>Discover craft breweries across Ohio. Plan your ultimate brewery tour.</p>
        </div>
        <div class="col-md-4">
          <h5>Quick Links</h5>
          <ul class="list-unstyled">
            <li><a href="/breweries" class="text-white-50">Breweries</a></li>
            <li><a href="/regions" class="text-white-50">Regions</a></li>
            <li><a href="/about" class="text-white-50">About</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h5>Connect</h5>
          <p class="text-white-50">
            Built with love on Cloudflare Workers<br>
            Powered by D1, R2, KV, Workers AI
          </p>
        </div>
      </div>
      <div class="text-center mt-4 text-white-50">
        <small>2025 Ohio Beer Path. All rights reserved.</small>
      </div>
    </div>
  </footer>`;
}
