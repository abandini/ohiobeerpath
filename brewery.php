<?php
require_once('config.php');
require_once('includes/seo-utils.php');
require_once('includes/db.php');
require_once('includes/image-utils.php');

// Get brewery ID from URL
$brewery_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Initialize brewery data
$brewery = null;
$related_breweries = [];
$brewery_beers = [];

// Fetch brewery data from database
try {
    if ($brewery_id > 0) {
        $stmt = $pdo->prepare("SELECT * FROM breweries WHERE id = :id");
        $stmt->bindParam(':id', $brewery_id, PDO::PARAM_INT);
        $stmt->execute();
        $brewery = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Fetch related breweries in the same region
        if ($brewery && isset($brewery['region'])) {
            $region = $brewery['region'];
            $stmt = $pdo->prepare("
                SELECT * FROM breweries 
                WHERE region = :region AND id != :id 
                ORDER BY RAND() LIMIT 3
            ");
            $stmt->bindParam(':region', $region);
            $stmt->bindParam(':id', $brewery_id, PDO::PARAM_INT);
            $stmt->execute();
            $related_breweries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Fetch brewery beers if available
        $stmt = $pdo->prepare("
            SELECT * FROM beers 
            WHERE brewery_id = :brewery_id 
            ORDER BY name
        ");
        $stmt->bindParam(':brewery_id', $brewery_id, PDO::PARAM_INT);
        $stmt->execute();
        $brewery_beers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
} catch (PDOException $e) {
    // If database error, try to load from JSON file
    $json_file = 'assets/data/breweries.json';
    if (file_exists($json_file)) {
        $breweries_data = json_decode(file_get_contents($json_file), true);
        
        foreach ($breweries_data as $b) {
            if (isset($b['id']) && $b['id'] == $brewery_id) {
                $brewery = $b;
                break;
            }
        }
        
        // Get related breweries
        if ($brewery && isset($brewery['region'])) {
            $region = $brewery['region'];
            $related = array_filter($breweries_data, function($b) use ($brewery_id, $region) {
                return isset($b['region']) && $b['region'] == $region && $b['id'] != $brewery_id;
            });
            
            // Get random 3 related breweries
            $related_breweries = array_slice($related, 0, 3);
        }
    }
}

// If brewery not found, redirect to breweries page
if (!$brewery) {
    header('Location: breweries.php');
    exit;
}

// Prepare SEO metadata
$meta = [
    'title' => htmlspecialchars($brewery['name']) . ' - Ohio Beer Path',
    'description' => isset($brewery['description']) && !empty($brewery['description']) 
        ? htmlspecialchars(substr($brewery['description'], 0, 160)) 
        : 'Visit ' . htmlspecialchars($brewery['name']) . ' in ' . htmlspecialchars($brewery['city']) . ', Ohio. Discover craft beers, brewery details, and plan your visit with Ohio Beer Path.',
    'keywords' => htmlspecialchars($brewery['name']) . ', brewery, craft beer, ' . htmlspecialchars($brewery['city']) . ' ohio, ' . ($brewery['region'] ?? '') . ' breweries, ohio beer path'
];

// Prepare Open Graph data
$og = [
    'title' => htmlspecialchars($brewery['name']) . ' - Ohio Beer Path',
    'description' => isset($brewery['description']) && !empty($brewery['description']) 
        ? htmlspecialchars(substr($brewery['description'], 0, 160)) 
        : 'Visit ' . htmlspecialchars($brewery['name']) . ' in ' . htmlspecialchars($brewery['city']) . ', Ohio. Discover craft beers, brewery details, and plan your visit with Ohio Beer Path.',
    'type' => 'business.business',
    'image' => get_brewery_image_url($brewery['name'], 'large'),
    'image:width' => '1200',
    'image:height' => '630'
];

// Prepare Twitter Card data
$twitter = [
    'card' => 'summary_large_image',
    'title' => htmlspecialchars($brewery['name']) . ' - Ohio Beer Path',
    'description' => isset($brewery['description']) && !empty($brewery['description']) 
        ? htmlspecialchars(substr($brewery['description'], 0, 160)) 
        : 'Visit ' . htmlspecialchars($brewery['name']) . ' in ' . htmlspecialchars($brewery['city']) . ', Ohio. Discover craft beers, brewery details, and plan your visit with Ohio Beer Path.',
    'image' => get_brewery_image_url($brewery['name'], 'large')
];

// Prepare breadcrumbs
$breadcrumbs = [
    ['name' => 'Home', 'url' => '/'],
    ['name' => 'Breweries', 'url' => '/breweries.php'],
];

if (isset($brewery['region']) && !empty($brewery['region'])) {
    $breadcrumbs[] = [
        'name' => $brewery['region'], 
        'url' => '/breweries.php?region=' . urlencode($brewery['region'])
    ];
}

$breadcrumbs[] = ['name' => $brewery['name'], 'url' => '/brewery.php?id=' . $brewery_id];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <?php
    // Output meta tags
    echo generate_meta_tags($meta);
    echo generate_open_graph_tags($og);
    echo generate_twitter_card_tags($twitter);
    
    // Output brewery schema
    echo generate_brewery_schema($brewery);
    
    // Output breadcrumb schema
    echo generate_breadcrumb_schema($breadcrumbs);
    ?>
    
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
        $message = 'Loading Brewery Details...';
        include('includes/loading-spinner.php'); 
        ?>
    </div>
    
    <?php 
    $active_page = 'breweries';
    include('includes/navigation.php'); 
    ?>

    <!-- Brewery Hero Section -->
    <header class="brewery-hero py-5" style="background-color: #343a40;">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h1 class="display-4 text-white mb-3"><?php echo htmlspecialchars($brewery['name']); ?></h1>
                    
                    <div class="d-flex align-items-center text-white mb-3">
                        <i class="bi bi-geo-alt me-2" aria-hidden="true"></i>
                        <span><?php echo htmlspecialchars($brewery['city']); ?>, OH</span>
                    </div>
                    
                    <?php if (isset($brewery['region']) && !empty($brewery['region'])): ?>
                    <div class="mb-3">
                        <span class="badge bg-primary"><?php echo htmlspecialchars($brewery['region']); ?></span>
                        <?php if (isset($brewery['brewery_type']) && !empty($brewery['brewery_type'])): ?>
                        <span class="badge bg-secondary ms-2"><?php echo htmlspecialchars($brewery['brewery_type']); ?></span>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                    
                    <div class="d-flex flex-wrap gap-2 mt-4">
                        <button class="btn btn-primary add-to-itinerary" data-brewery-id="<?php echo $brewery_id; ?>">
                            <i class="bi bi-plus-circle me-2" aria-hidden="true"></i> Add to Tour
                        </button>
                        
                        <?php if (isset($brewery['website']) && !empty($brewery['website'])): ?>
                        <a href="<?php echo htmlspecialchars($brewery['website']); ?>" class="btn btn-outline-light" target="_blank" rel="noopener" data-track="brewery:website">
                            <i class="bi bi-globe me-2" aria-hidden="true"></i> Visit Website
                        </a>
                        <?php endif; ?>
                        
                        <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=<?php echo urlencode($brewery['latitude'] . ',' . $brewery['longitude']); ?>" 
                           class="btn btn-outline-light" target="_blank" rel="noopener" data-track="brewery:directions">
                            <i class="bi bi-map me-2" aria-hidden="true"></i> Get Directions
                        </a>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="col-lg-6 mt-4 mt-lg-0">
                    <div class="brewery-image-container rounded shadow overflow-hidden">
                        <?php echo responsive_brewery_image($brewery['name'], "{$brewery['name']} brewery in {$brewery['city']}, Ohio", ['img-fluid']); ?>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Breadcrumb -->
    <div class="bg-light py-2">
        <div class="container">
            <?php echo generate_breadcrumb_html($breadcrumbs); ?>
        </div>
    </div>

    <!-- Brewery Details Section -->
    <section class="py-5">
        <div class="container">
            <div class="row">
                <div class="col-lg-8">
                    <!-- About Section -->
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h2 class="h4 mb-0">About <?php echo htmlspecialchars($brewery['name']); ?></h2>
                        </div>
                        <div class="card-body">
                            <?php if (isset($brewery['description']) && !empty($brewery['description'])): ?>
                                <p><?php echo nl2br(htmlspecialchars($brewery['description'])); ?></p>
                            <?php else: ?>
                                <p><?php echo htmlspecialchars($brewery['name']); ?> is a brewery located in <?php echo htmlspecialchars($brewery['city']); ?>, Ohio. 
                                Visit this brewery to explore their unique craft beers and brewery experience.</p>
                            <?php endif; ?>
                            
                            <?php if (isset($brewery['year_established'])): ?>
                                <p><strong>Established:</strong> <?php echo htmlspecialchars($brewery['year_established']); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <!-- Beer List Section -->
                    <?php if (!empty($brewery_beers)): ?>
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h2 class="h4 mb-0">Featured Beers</h2>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Beer</th>
                                            <th>Style</th>
                                            <th>ABV</th>
                                            <th>IBU</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($brewery_beers as $beer): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($beer['name']); ?></td>
                                            <td><?php echo htmlspecialchars($beer['style'] ?? 'N/A'); ?></td>
                                            <td><?php echo isset($beer['abv']) ? htmlspecialchars($beer['abv']) . '%' : 'N/A'; ?></td>
                                            <td><?php echo htmlspecialchars($beer['ibu'] ?? 'N/A'); ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Reviews Section (Placeholder) -->
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h2 class="h4 mb-0">Reviews</h2>
                            <button class="btn btn-sm btn-outline-primary" id="writeReviewBtn">
                                <i class="bi bi-pencil me-1" aria-hidden="true"></i> Write a Review
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="text-center py-4">
                                <i class="bi bi-star text-muted" style="font-size: 2rem;"></i>
                                <p class="mt-3">Be the first to review this brewery!</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <!-- Contact & Hours -->
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h3 class="h5 mb-0">Contact & Hours</h3>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <?php if (isset($brewery['address']) && !empty($brewery['address'])): ?>
                                <li class="mb-3">
                                    <i class="bi bi-geo-alt text-primary me-2" aria-hidden="true"></i>
                                    <span><?php echo htmlspecialchars($brewery['address']); ?>, <?php echo htmlspecialchars($brewery['city']); ?>, OH <?php echo htmlspecialchars($brewery['postal_code'] ?? ''); ?></span>
                                </li>
                                <?php endif; ?>
                                
                                <?php if (isset($brewery['phone']) && !empty($brewery['phone'])): ?>
                                <li class="mb-3">
                                    <i class="bi bi-telephone text-primary me-2" aria-hidden="true"></i>
                                    <a href="tel:<?php echo htmlspecialchars($brewery['phone']); ?>" data-track="brewery:phone"><?php echo htmlspecialchars($brewery['phone']); ?></a>
                                </li>
                                <?php endif; ?>
                                
                                <?php if (isset($brewery['email']) && !empty($brewery['email'])): ?>
                                <li class="mb-3">
                                    <i class="bi bi-envelope text-primary me-2" aria-hidden="true"></i>
                                    <a href="mailto:<?php echo htmlspecialchars($brewery['email']); ?>" data-track="brewery:email"><?php echo htmlspecialchars($brewery['email']); ?></a>
                                </li>
                                <?php endif; ?>
                            </ul>
                            
                            <hr>
                            
                            <h4 class="h6 mb-3">Hours of Operation</h4>
                            <?php if (isset($brewery['hours']) && is_array($brewery['hours']) && !empty($brewery['hours'])): ?>
                                <ul class="list-group list-group-flush">
                                    <?php 
                                    $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                    foreach ($days as $day): 
                                        $hours = $brewery['hours'][$day] ?? 'Closed';
                                    ?>
                                    <li class="list-group-item d-flex justify-content-between px-0">
                                        <span class="text-capitalize"><?php echo $day; ?></span>
                                        <span><?php echo htmlspecialchars($hours); ?></span>
                                    </li>
                                    <?php endforeach; ?>
                                </ul>
                            <?php else: ?>
                                <p class="text-muted">Hours not available. Please check the brewery's website for current hours.</p>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <!-- Map -->
                    <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h3 class="h5 mb-0">Location</h3>
                        </div>
                        <div class="card-body p-0">
                            <div id="breweryMap" style="height: 300px; width: 100%;"></div>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Social Sharing -->
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h3 class="h5 mb-0">Share</h3>
                        </div>
                        <div class="card-body">
                            <div class="d-flex gap-2">
                                <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(get_current_url()); ?>" 
                                   class="btn btn-outline-primary" target="_blank" rel="noopener" data-track="share:facebook">
                                    <i class="bi bi-facebook" aria-hidden="true"></i>
                                </a>
                                <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode('Check out ' . $brewery['name'] . ' on Ohio Beer Path!'); ?>&url=<?php echo urlencode(get_current_url()); ?>" 
                                   class="btn btn-outline-primary" target="_blank" rel="noopener" data-track="share:twitter">
                                    <i class="bi bi-twitter" aria-hidden="true"></i>
                                </a>
                                <a href="mailto:?subject=<?php echo urlencode('Check out this brewery on Ohio Beer Path'); ?>&body=<?php echo urlencode('I thought you might be interested in ' . $brewery['name'] . ': ' . get_current_url()); ?>" 
                                   class="btn btn-outline-primary" data-track="share:email">
                                    <i class="bi bi-envelope" aria-hidden="true"></i>
                                </a>
                                <button class="btn btn-outline-primary" id="copyLinkBtn" data-track="share:copy">
                                    <i class="bi bi-link-45deg" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Related Breweries -->
            <?php if (!empty($related_breweries)): ?>
            <div class="row mt-5">
                <div class="col-12">
                    <h2 class="h3 mb-4">More Breweries in <?php echo htmlspecialchars($brewery['region']); ?></h2>
                </div>
                
                <?php foreach ($related_breweries as $related_brewery): ?>
                    <?php 
                    $featured = false;
                    include('includes/brewery-card.php'); 
                    ?>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </section>

    <?php include('includes/footer.php'); ?>
    
    <!-- Mobile Bottom Navigation -->
    <div class="mobile-bottom-nav d-lg-none">
        <a href="index.php" class="mobile-nav-item" aria-label="Home">
            <i class="bi bi-house-door" aria-hidden="true"></i>
            <span>Home</span>
        </a>
        <a href="breweries.php" class="mobile-nav-item active" aria-label="Breweries">
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
    <script src="assets/js/analytics.js"></script>
    <script src="assets/js/pwa.js"></script>
    
    <!-- Google Maps API -->
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>&libraries=places&callback=initBreweryMap">
    </script>
    
    <!-- Page-specific JavaScript -->
    <script>
    // Initialize brewery map
    function initBreweryMap() {
        <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
        const breweryLocation = {
            lat: <?php echo floatval($brewery['latitude']); ?>,
            lng: <?php echo floatval($brewery['longitude']); ?>
        };
        
        const map = new google.maps.Map(document.getElementById('breweryMap'), {
            center: breweryLocation,
            zoom: 15,
            mapTypeControl: false,
            fullscreenControl: false
        });
        
        const marker = new google.maps.Marker({
            position: breweryLocation,
            map: map,
            title: '<?php echo addslashes($brewery['name']); ?>'
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <h6><?php echo addslashes($brewery['name']); ?></h6>
                    <p class="text-muted small"><?php echo addslashes($brewery['city']); ?>, OH</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=<?php echo urlencode($brewery['latitude'] . ',' . $brewery['longitude']); ?>" 
                       class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener">
                        Get Directions
                    </a>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        // Open info window by default
        infoWindow.open(map, marker);
        <?php endif; ?>
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize page loading progress
        const progressBar = document.getElementById('pageLoadingProgress');
        if (progressBar) {
            progressBar.style.width = '30%';
            setTimeout(() => { progressBar.style.width = '60%'; }, 200);
            setTimeout(() => { progressBar.style.width = '90%'; }, 400);
            setTimeout(() => { 
                progressBar.style.width = '100%';
                setTimeout(() => { progressBar.style.opacity = '0'; }, 200);
            }, 600);
        }
        
        // Copy link button functionality
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(window.location.href).then(function() {
                    // Show success tooltip
                    copyLinkBtn.setAttribute('data-original-title', 'Link copied!');
                    copyLinkBtn.innerHTML = '<i class="bi bi-check2"></i>';
                    
                    // Reset after 2 seconds
                    setTimeout(function() {
                        copyLinkBtn.innerHTML = '<i class="bi bi-link-45deg"></i>';
                    }, 2000);
                });
            });
        }
        
        // Add to itinerary functionality
        const addToItineraryBtns = document.querySelectorAll('.add-to-itinerary');
        addToItineraryBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const breweryId = this.getAttribute('data-brewery-id');
                
                // Add to itinerary using the itinerary module
                if (window.OhioBeerPath && OhioBeerPath.itinerary) {
                    // Find brewery data
                    const breweryData = {
                        id: <?php echo $brewery_id; ?>,
                        name: '<?php echo addslashes($brewery['name']); ?>',
                        city: '<?php echo addslashes($brewery['city']); ?>',
                        latitude: <?php echo isset($brewery['latitude']) ? floatval($brewery['latitude']) : 'null'; ?>,
                        longitude: <?php echo isset($brewery['longitude']) ? floatval($brewery['longitude']) : 'null'; ?>
                    };
                    
                    OhioBeerPath.itinerary.addBrewery(breweryData);
                    
                    // Update button text
                    this.innerHTML = '<i class="bi bi-check-circle me-2" aria-hidden="true"></i> Added to Tour';
                    this.classList.remove('btn-primary');
                    this.classList.add('btn-success');
                    
                    // Track analytics
                    if (window.OhioBeerPath && OhioBeerPath.analytics) {
                        OhioBeerPath.analytics.trackBrewery(breweryId, 'save', {
                            breweryName: '<?php echo addslashes($brewery['name']); ?>',
                            breweryCity: '<?php echo addslashes($brewery['city']); ?>'
                        });
                    }
                    
                    // Show itinerary modal
                    const itineraryModal = new bootstrap.Modal(document.getElementById('itineraryModal'));
                    setTimeout(() => {
                        itineraryModal.show();
                    }, 500);
                }
            });
        });
        
        // Track page view with analytics
        if (window.OhioBeerPath && OhioBeerPath.analytics) {
            OhioBeerPath.analytics.trackPageView(null, {
                pageType: 'brewery',
                breweryId: <?php echo $brewery_id; ?>,
                breweryName: '<?php echo addslashes($brewery['name']); ?>',
                breweryCity: '<?php echo addslashes($brewery['city']); ?>',
                breweryRegion: '<?php echo addslashes($brewery['region'] ?? ''); ?>'
            });
            
            // Track brewery view
            OhioBeerPath.analytics.trackBrewery(<?php echo $brewery_id; ?>, 'view', {
                breweryName: '<?php echo addslashes($brewery['name']); ?>',
                breweryCity: '<?php echo addslashes($brewery['city']); ?>',
                breweryRegion: '<?php echo addslashes($brewery['region'] ?? ''); ?>'
            });
        }
    });
    </script>
    
    <?php include('includes/itinerary-modal.php'); ?>
</body>
</html>
