// Static pages templates (About, Privacy, Terms)
import { layout } from './layout';

export function aboutPage(): string {
  const content = `
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h1 class="display-4 fw-bold mb-4">About Ohio Beer Path</h1>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h4 text-warning">
              <i class="bi bi-cup-straw"></i> Our Mission
            </h2>
            <p>
              Ohio Beer Path is your guide to discovering the incredible craft brewery
              scene across the Buckeye State. From the bustling taprooms of Columbus to
              the historic breweries of Cincinnati, we help you explore Ohio's diverse
              beer culture.
            </p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h4 text-warning">
              <i class="bi bi-lightning"></i> Powered by AI
            </h2>
            <p>
              We use cutting-edge AI technology to enhance your brewery discovery experience:
            </p>
            <ul>
              <li><strong>Smart Search:</strong> Find breweries by vibe, style, or atmosphere</li>
              <li><strong>Route Optimization:</strong> Plan the perfect brewery tour with AI-powered routing</li>
              <li><strong>Personalized Recommendations:</strong> Discover new favorites based on your preferences</li>
            </ul>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h4 text-warning">
              <i class="bi bi-cloud"></i> Built on Cloudflare
            </h2>
            <p>
              Ohio Beer Path is built entirely on Cloudflare's edge platform:
            </p>
            <ul>
              <li><strong>Workers:</strong> Lightning-fast serverless compute</li>
              <li><strong>D1:</strong> SQLite database at the edge</li>
              <li><strong>R2:</strong> Object storage for images</li>
              <li><strong>Workers AI:</strong> On-demand AI inference</li>
              <li><strong>Vectorize:</strong> Semantic search capabilities</li>
            </ul>
            <p class="text-muted small">
              This means fast load times no matter where you are in Ohio (or the world!).
            </p>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h2 class="h4 text-warning">
              <i class="bi bi-heart"></i> Support Local Breweries
            </h2>
            <p>
              Ohio is home to over 400 craft breweries, each with its own unique story
              and flavors. By using Ohio Beer Path, you're supporting local businesses
              and the vibrant craft beer community that makes our state special.
            </p>
            <p class="mb-0">
              <strong>Cheers to Ohio craft beer!</strong> 🍺
            </p>
          </div>
        </div>

        <div class="text-center mt-5">
          <a href="/breweries" class="btn btn-warning btn-lg">
            <i class="bi bi-search"></i> Start Exploring
          </a>
        </div>
      </div>
    </div>
  </main>
  `;

  return layout('About', content);
}

export function privacyPage(): string {
  const content = `
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h1 class="display-4 fw-bold mb-4">Privacy Policy</h1>
        <p class="text-muted">Last updated: November 2025</p>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Information We Collect</h2>
            <p>Ohio Beer Path collects minimal information to provide our services:</p>
            <ul>
              <li><strong>Location Data:</strong> Only when you use the "Nearby" feature, and only temporarily to find breweries near you. We do not store your location.</li>
              <li><strong>Tour Data:</strong> Your saved brewery tour is stored locally in your browser (localStorage). We do not have access to this data.</li>
              <li><strong>Analytics:</strong> Basic, anonymous usage analytics to improve the service.</li>
            </ul>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">How We Use Information</h2>
            <ul>
              <li>To provide brewery search and discovery features</li>
              <li>To optimize routes for your brewery tours</li>
              <li>To improve our service based on anonymous usage patterns</li>
            </ul>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Data Storage</h2>
            <p>
              We use Cloudflare's infrastructure to store brewery information.
              Your personal tour data is stored only in your browser and is never
              transmitted to our servers unless you explicitly share it.
            </p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Cloudflare:</strong> Hosting, database, and AI services</li>
              <li><strong>Google Maps:</strong> Map display and directions (subject to Google's privacy policy)</li>
            </ul>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Cookies</h2>
            <p>
              We use minimal cookies for essential functionality. We do not use
              tracking cookies or sell your data to advertisers.
            </p>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h2 class="h5">Contact</h2>
            <p>
              Questions about this privacy policy? Contact us at
              <a href="mailto:privacy@ohiobeerpath.com">privacy@ohiobeerpath.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
  `;

  return layout('Privacy Policy', content);
}

export function termsPage(): string {
  const content = `
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h1 class="display-4 fw-bold mb-4">Terms of Service</h1>
        <p class="text-muted">Last updated: November 2025</p>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Acceptance of Terms</h2>
            <p>
              By accessing and using Ohio Beer Path, you accept and agree to be bound
              by these Terms of Service. If you do not agree to these terms, please
              do not use our service.
            </p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Use of Service</h2>
            <p>Ohio Beer Path provides:</p>
            <ul>
              <li>Brewery discovery and information</li>
              <li>Tour planning tools</li>
              <li>AI-powered search and recommendations</li>
            </ul>
            <p>
              This service is provided "as is" for informational purposes. We make
              no guarantees about brewery hours, availability, or accuracy of information.
            </p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">User Responsibilities</h2>
            <p>You agree to:</p>
            <ul>
              <li>Use the service responsibly and legally</li>
              <li>Drink responsibly and never drink and drive</li>
              <li>Verify brewery information before visiting</li>
              <li>Not attempt to hack, scrape, or abuse our service</li>
            </ul>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Disclaimer</h2>
            <p>
              Ohio Beer Path is not affiliated with any brewery listed on the site.
              Brewery information is provided for convenience and may not be current.
              Always verify hours, menus, and policies directly with breweries.
            </p>
            <p>
              <strong>Please drink responsibly.</strong> Ohio Beer Path encourages
              the use of designated drivers, ride-sharing services, or public
              transportation when visiting breweries.
            </p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h2 class="h5">Limitation of Liability</h2>
            <p>
              Ohio Beer Path shall not be liable for any damages arising from your
              use of the service, including but not limited to direct, indirect,
              incidental, or consequential damages.
            </p>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h2 class="h5">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use
              of the service after changes constitutes acceptance of the new terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
  `;

  return layout('Terms of Service', content);
}
