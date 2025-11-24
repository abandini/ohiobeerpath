<?php
require_once('config.php');
?>
<?php
// Include SEO utilities
require_once 'includes/seo-utils.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <?php
    // Define page-specific metadata
    $meta = [
        'title' => 'Ohio Beer Path - Discover Ohio\'s Finest Breweries',
        'description' => 'Plan your ultimate Ohio brewery tour with Ohio Beer Path. Discover craft breweries, create custom beer trails, and explore Ohio\'s vibrant beer scene.',
        'keywords' => 'ohio breweries, craft beer ohio, brewery tour, beer trail, ohio beer path, craft beer, brewery map, ohio craft beer'
    ];
    
    // Define Open Graph data
    $og = [
        'title' => 'Ohio Beer Path - Discover Ohio\'s Finest Breweries',
        'description' => 'Plan your ultimate Ohio brewery tour with Ohio Beer Path. Discover craft breweries, create custom beer trails, and explore Ohio\'s vibrant beer scene.',
        'type' => 'website',
        'image' => get_site_url() . '/assets/images/og-image.jpg',
        'image:width' => '1200',
        'image:height' => '630'
    ];
    
    // Define Twitter Card data
    $twitter = [
        'card' => 'summary_large_image',
        'title' => 'Ohio Beer Path - Discover Ohio\'s Finest Breweries',
        'description' => 'Plan your ultimate Ohio brewery tour with Ohio Beer Path. Discover craft breweries, create custom beer trails, and explore Ohio\'s vibrant beer scene.',
        'image' => get_site_url() . '/assets/images/twitter-image.jpg'
    ];
    
    // Output meta tags
    echo generate_meta_tags($meta);
    echo generate_open_graph_tags($og);
    echo generate_twitter_card_tags($twitter);
    ?>

    <!-- Google Fonts: Outfit (headings) + Inter (body) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">

    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/mobile.css">
    <link rel="stylesheet" href="assets/css/loading.css">
    <link rel="stylesheet" href="assets/css/search.css">
    <link rel="stylesheet" href="assets/css/itinerary.css">
    
    <!-- Ensure proper mobile rendering and touch zooming -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    
    <!-- Theme color for browser UI -->
    <meta name="theme-color" content="#007bff">
    
    <!-- Favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/favicon/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    
    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://maps.googleapis.com">
    
    <!-- Website Schema -->
    <?php echo generate_website_schema(); ?>
    
    <!-- Preload critical resources -->
    <link rel="preload" href="assets/css/styles.css" as="style">
    <link rel="preload" href="assets/js/core.js" as="script">
    
    <!-- Pass Google Maps API key from PHP to JavaScript -->
    <script>
        // Store API key from PHP configuration
        const PHP_GOOGLE_MAPS_API_KEY = '<?php echo GOOGLE_MAPS_API_KEY; ?>';
    </script>
    <!-- Direct map fix script that will definitely work -->
    <script src="assets/js/map-direct-fix.js"></script>
</head>
<body>
    <!-- Page Loading Progress Bar -->
    <div class="page-loading-progress-container">
        <div id="pageLoadingProgress" class="page-loading-progress"></div>
    </div>
    
    <!-- Main Loading Spinner -->
    <div id="mainLoadingSpinner" class="main-loading-spinner d-none">
        <?php 
        $id = 'loadingSpinner';
        $message = 'Loading Ohio Beer Path...';
        include('includes/loading-spinner.php'); 
        ?>
    </div>
    
    <?php 
    $active_page = 'home';
    include('includes/navigation.php'); 
    ?>

    <!-- Hero Section -->
    <header class="hero-section bg-dark text-white text-center py-5">
        <div class="container">
            <h1 class="display-4">Discover Ohio's Finest Breweries</h1>
            <p class="lead">Plan Your Ultimate Brewery Tour</p>
            
            <div class="row justify-content-center mt-4">
                <div class="col-lg-8">
                    <?php
                    // Include search component
                    $id = 'heroSearch';
                    $placeholder = 'Search for breweries, cities, or regions...';
                    $showFilters = false;
                    include('includes/search-component.php');
                    ?>
                </div>
            </div>
            
            <div class="mt-4">
                <button class="btn btn-primary btn-lg" id="createTourBtn" aria-label="Start creating your brewery tour">
                    <i class="bi bi-map" aria-hidden="true"></i> Create Brewery Tour
                </button>
            </div>
        </div>
    </header>

    <!-- Featured Regions Section -->
    <section class="container my-5">
        <h2 class="text-center mb-4">Explore Ohio's Brewing Regions</h2>
        <div class="row g-4">
            <!-- Northeast -->
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="assets/images/breweries/great_lakes.jpg" class="card-img-top" alt="Northeast Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="card-title h5">Northeast Ohio</h3>
                        <p class="card-text">Explore Cleveland's rich brewing history and award-winning craft beer scene.</p>
                        <a href="regions.php#northeast" class="btn btn-sm btn-outline-primary">Explore Region</a>
                    </div>
                </div>
            </div>
            <!-- East Central -->
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="assets/images/breweries/weasel_boy.jpg" class="card-img-top" alt="East Central Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="card-title h5">East Central Ohio</h3>
                        <p class="card-text">Discover German-inspired beers and craft offerings in New Philadelphia and Zanesville.</p>
                        <a href="regions.php#eastcentral" class="btn btn-sm btn-outline-primary">Explore Region</a>
                    </div>
                </div>
            </div>
            <!-- Central -->
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="assets/images/breweries/land_grant.jpg" class="card-img-top" alt="Central Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="card-title h5">Central Ohio</h3>
                        <p class="card-text">Explore Columbus's vibrant craft beer scene and surrounding communities.</p>
                        <a href="regions.php#central" class="btn btn-sm btn-outline-primary">Explore Region</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-4 mt-2">
            <!-- Northwest -->
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="assets/images/breweries/maumee_bay.jpg" class="card-img-top" alt="Northwest Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="card-title h5">Northwest Ohio</h3>
                        <p class="card-text">Visit Toledo's community-focused breweries and lakeside brewing spots.</p>
                        <a href="regions.php#northwest" class="btn btn-sm btn-outline-primary">Explore Region</a>
                    </div>
                </div>
            </div>
            <!-- West Central -->
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="assets/images/breweries/mother_stewarts.jpg" class="card-img-top" alt="West Central Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="card-title h5">West Central Ohio</h3>
                        <p class="card-text">Discover Springfield's emerging craft beer culture and Lima's unique breweries.</p>
                        <a href="regions.php#westcentral" class="btn btn-sm btn-outline-primary">Explore Region</a>
                    </div>
                </div>
            </div>
            <!-- Southwest -->
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="assets/images/breweries/rhinegeist.jpg" class="card-img-top" alt="Southwest Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="card-title h5">Southwest Ohio</h3>
                        <p class="card-text">Experience Cincinnati's historic brewing heritage and modern craft scene.</p>
                        <a href="regions.php#southwest" class="btn btn-sm btn-outline-primary">Explore Region</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Breweries Section -->
    <section class="container my-5">
        <h2 class="text-center mb-4" id="featuredBreweriesHeading">Featured Breweries</h2>
        <div class="row" id="featuredBreweries" aria-labelledby="featuredBreweriesHeading">
            <?php
            // Include required utilities
            require_once('includes/image-utils.php');
            require_once('includes/db.php');
            
            // Get featured breweries (either from database or JSON)
            $breweries = get_breweries(['featured' => true]);
            
            // Limit to 3 featured breweries
            $featured = array_slice($breweries, 0, 3);
            
            // Display featured breweries using the accessible component
            foreach ($featured as $brewery) {
                // Set featured flag to true
                $featured = true;
                include('includes/brewery-card.php');
            }
            
            // Show message if no featured breweries
            if (empty($featured)): 
            ?>
            <div class="col-12 text-center">
                <div class="alert alert-info" role="status">
                    <p>Featured breweries will appear here soon!</p>
                </div>
            </div>
            <?php endif; ?>
        </div>
        <div class="text-center mt-4">
            <a href="breweries.php" class="btn btn-outline-primary" aria-label="Browse all Ohio breweries">
                <i class="bi bi-grid-3x3-gap" aria-hidden="true"></i> View All Breweries
            </a>
        </div>
    </section>

    <!-- Interactive Map Preview -->
    <section class="container-fluid bg-light py-5">
        <div class="container">
            <h2 class="text-center mb-4" id="exploreMapHeading">Explore Ohio Breweries</h2>
            <div class="row">
                <div class="col-md-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h3 class="h5 mb-3" id="findBreweriesHeading">Find Breweries Near You</h3>
                            <form id="brewerySearchForm" aria-labelledby="findBreweriesHeading">
                                <div class="mb-3">
                                    <label for="zipcode" class="form-label">Enter ZIP Code or City</label>
                                    <input type="text" class="form-control" id="zipcode" 
                                           placeholder="e.g., Columbus or 43215"
                                           aria-describedby="zipcodeHelp">
                                    <div id="zipcodeHelp" class="form-text">Enter a city name or ZIP code in Ohio</div>
                                </div>
                                <div class="mb-3">
                                    <label for="distance" class="form-label">Distance</label>
                                    <select class="form-select" id="distance" aria-describedby="distanceHelp">
                                        <option value="10">10 miles</option>
                                        <option value="25" selected>25 miles</option>
                                        <option value="50">50 miles</option>
                                        <option value="100">100 miles</option>
                                    </select>
                                    <div id="distanceHelp" class="form-text">Maximum distance from your location</div>
                                </div>
                                <button type="submit" class="btn btn-primary w-100" id="searchButton"
                                        aria-label="Search for breweries near your location">
                                    <i class="bi bi-search" aria-hidden="true"></i>
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>
                    <div id="searchResults" class="d-none" aria-live="polite">
                        <h4 class="h6 mb-3" id="searchResultsHeading">Search Results</h4>
                        <div id="breweriesList" aria-labelledby="searchResultsHeading">
                            <!-- Results will be added here -->
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div id="map" style="height: 500px;" class="rounded shadow map-container" 
                         aria-label="Interactive map of Ohio breweries" 
                         role="application"
                         tabindex="0">
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Itinerary Builder Section -->
    <section class="container my-5">
        <h2 class="text-center mb-4" id="itineraryHeading">Create Your Brewery Tour</h2>
        
        <div class="card shadow-sm mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="h5 mb-0">Your Selected Breweries</h3>
                    <button class="btn btn-sm btn-outline-primary" id="viewFullItineraryBtn" data-bs-toggle="modal" data-bs-target="#itineraryModal" aria-label="View and edit your full brewery tour itinerary">
                        <i class="bi bi-map" aria-hidden="true"></i> View Full Itinerary
                    </button>
                </div>
                
                <div id="itineraryList" class="list-group mb-3" aria-labelledby="itineraryHeading">
                    <!-- Selected breweries will appear here -->
                    <div class="alert alert-info" id="emptyItineraryAlert">
                        <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                        <span>Your itinerary is empty. Add breweries from the list to create your tour!</span>
                    </div>
                </div>
                
                <div class="d-flex flex-wrap gap-2 justify-content-center">
                    <button class="btn btn-outline-primary" id="optimizeRouteBtn" aria-label="Optimize your brewery tour route for the shortest distance">
                        <i class="bi bi-shuffle" aria-hidden="true"></i> Optimize Route
                    </button>
                    <button class="btn btn-outline-primary" id="viewMapBtn" aria-label="View your brewery tour on a map">
                        <i class="bi bi-map" aria-hidden="true"></i> View on Map
                    </button>
                    <button class="btn btn-primary" id="saveItineraryBtn" data-bs-toggle="modal" data-bs-target="#itineraryModal" aria-label="Save your brewery tour itinerary">
                        <i class="bi bi-save" aria-hidden="true"></i> Save Itinerary
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card bg-light border-0">
            <div class="card-body text-center">
                <h3 class="h5 mb-3">Tips for Planning Your Brewery Tour</h3>
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-geo-alt fs-4 me-2 text-primary" aria-hidden="true"></i>
                            <h4 class="h6 mb-0">Choose Your Region</h4>
                        </div>
                        <p class="small text-muted">Start by selecting breweries in the same region to minimize travel time.</p>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-clock fs-4 me-2 text-primary" aria-hidden="true"></i>
                            <h4 class="h6 mb-0">Check Opening Hours</h4>
                        </div>
                        <p class="small text-muted">Verify brewery hours before finalizing your tour to ensure they'll be open.</p>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-shield-check fs-4 me-2 text-primary" aria-hidden="true"></i>
                            <h4 class="h6 mb-0">Drink Responsibly</h4>
                        </div>
                        <p class="small text-muted">Always have a designated driver or use rideshare services when touring breweries.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <?php include('includes/itinerary-modal.php'); ?>

    <!-- Loading Spinner -->
    <div id="loadingSpinner" class="d-none">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <h5>Ohio Beer Path</h5>
                    <p>Discovering Ohio's finest craft breweries.</p>
                    <p><small>© 2025 Ohio Beer Path. All Rights Reserved.</small></p>
                </div>
                <div class="col-md-4">
                    <h5>Quick Links</h5>
                    <ul class="list-unstyled">
                        <li><a href="index.html" class="text-white">Home</a></li>
                        <li><a href="nearby.php" class="text-white">Find Breweries</a></li>
                        <li><a href="breweries.php" class="text-white">All Breweries</a></li>
                        <li><a href="regions.php" class="text-white">Regions</a></li>
                        <li><a href="itinerary.php" class="text-white">Plan Your Tour</a></li>
                        <li><a href="blog.php" class="text-white">Beer Blog</a></li>
                        <li><a href="about.php" class="text-white">About Us</a></li>
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5>Connect With Us</h5>
                    <div class="social-icons">
                        <a href="#" class="text-white me-3"><i class="bi bi-facebook"></i></a>
                        <a href="#" class="text-white me-3"><i class="bi bi-twitter"></i></a>
                        <a href="#" class="text-white me-3"><i class="bi bi-instagram"></i></a>
                        <a href="#" class="text-white"><i class="bi bi-youtube"></i></a>
                    </div>
                    <div class="mt-3">
                        <a href="privacy.php" class="text-white me-3"><small>Privacy Policy</small></a>
                        <a href="terms.php" class="text-white"><small>Terms of Use</small></a>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    
    <!-- Mobile Bottom Navigation -->
    <div class="mobile-bottom-nav d-lg-none">
        <a href="index.php" class="mobile-nav-item active" aria-label="Home">
            <i class="bi bi-house-door" aria-hidden="true"></i>
            <span>Home</span>
        </a>
        <a href="breweries.php" class="mobile-nav-item" aria-label="Breweries">
            <i class="bi bi-building" aria-hidden="true"></i>
            <span>Breweries</span>
        </a>
        <a href="#" id="mobileSearchBtn" class="mobile-nav-item" aria-label="Search">
            <i class="bi bi-search" aria-hidden="true"></i>
            <span>Search</span>
        </a>
        <a href="itinerary.php" class="mobile-nav-item" aria-label="Itinerary">
            <i class="bi bi-map" aria-hidden="true"></i>
            <span>Itinerary</span>
        </a>
        <a href="account.php" class="mobile-nav-item" aria-label="Account">
            <i class="bi bi-person" aria-hidden="true"></i>
            <span>Account</span>
        </a>
    </div>
    
    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    
    <!-- Sortable.js for drag-and-drop functionality -->
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    
    <!-- Core JavaScript -->
    <script src="assets/js/core.js"></script>
    
    <!-- Feature JavaScript -->
    <script src="assets/js/search.js"></script>
    <script src="assets/js/itinerary.js"></script>
    
    <!-- Map is now loaded via map-direct-fix.js -->
    
    <!-- Page-specific JavaScript -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize page loading progress
        const progressBar = document.getElementById('pageLoadingProgress');
        if (progressBar) {
            // Animate progress bar
            progressBar.style.width = '30%';
            setTimeout(() => { progressBar.style.width = '60%'; }, 200);
            setTimeout(() => { progressBar.style.width = '90%'; }, 400);
            setTimeout(() => { 
                progressBar.style.width = '100%';
                setTimeout(() => { progressBar.style.opacity = '0'; }, 200);
            }, 600);
        }
        
        // Show loading spinner initially
        const spinner = document.getElementById('mainLoadingSpinner');
        if (spinner) {
            spinner.classList.remove('d-none');
            // Hide spinner after content loads
            window.addEventListener('load', () => {
                spinner.classList.add('d-none');
            });
            // Fallback to hide spinner after 3 seconds
            setTimeout(() => {
                spinner.classList.add('d-none');
            }, 3000);
        }
        
        // Load featured breweries
        fetch('/api/breweries.php?featured=true&limit=3')
            .then(response => response.ok ? response.json() : [])
            .then(breweries => {
                // If no breweries from API, try fallback to static data
                if (breweries.length === 0) {
                    const featuredContainer = document.getElementById('featuredBreweries');
                    if (featuredContainer && featuredContainer.children.length === 0) {
                        console.log('No featured breweries from API, using static content');
                    }
                }
            })
            .catch(error => console.error('Error loading featured breweries:', error));
            
        // Initialize itinerary drag-and-drop
        const itineraryList = document.getElementById('itineraryList');
        if (itineraryList && typeof Sortable !== 'undefined') {
            new Sortable(itineraryList, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    // Update itinerary order
                    OhioBeerPath.itinerary.updateOrder();
                }
            });
        }
        
        // Initialize itinerary modal map
        document.getElementById('itineraryModal')?.addEventListener('shown.bs.modal', function () {
            const mapElement = document.getElementById('itineraryMapPreview');
            if (mapElement && typeof google !== 'undefined' && google.maps) {
                const map = new google.maps.Map(mapElement, {
                    center: { lat: 40.4173, lng: -82.9071 },
                    zoom: 7
                });
                
                // Add markers for itinerary breweries
                OhioBeerPath.itinerary.displayOnMap(map);
            }
        });
    });
    </script>
    
    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-bottom-nav">
        <a href="index.php" class="active">
            <i class="bi bi-house-fill"></i>
            <span>Home</span>
        </a>
        <a href="nearby.php">
            <i class="bi bi-geo-alt"></i>
            <span>Nearby</span>
        </a>
        <a href="breweries.php">
            <i class="bi bi-cup-straw"></i>
            <span>Breweries</span>
        </a>
        <a href="itinerary.php">
            <i class="bi bi-map"></i>
            <span>Tour</span>
        </a>
        <a href="#" id="mobileSearchBtn">
            <i class="bi bi-search"></i>
            <span>Search</span>
        </a>
    </nav>
</body>
</html>