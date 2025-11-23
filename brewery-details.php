<?php
// Include configuration
require_once('config.php');
require_once('includes/image-utils.php');

// Get brewery ID from URL
$brewery_id = isset($_GET['id']) ? $_GET['id'] : null;

// Initialize brewery data
$brewery = null;
$related_breweries = [];

// Load brewery data from JSON file
$json_file = 'breweries.json';
if (file_exists($json_file)) {
    $breweries_data = json_decode(file_get_contents($json_file), true);
    
    // Find the brewery by ID
    if ($brewery_id) {
        foreach ($breweries_data as $b) {
            if (isset($b['id']) && $b['id'] == $brewery_id) {
                $brewery = $b;
                break;
            }
        }
    }
    
    // Get related breweries in the same region
    if ($brewery && isset($brewery['region'])) {
        $region = $brewery['region'];
        $related = array_filter($breweries_data, function($b) use ($brewery_id, $region) {
            return isset($b['region']) && $b['region'] == $region && $b['id'] != $brewery_id;
        });
        
        // Get random 3 related breweries
        shuffle($related);
        $related_breweries = array_slice($related, 0, 3);
    }
}

// If brewery not found, redirect to breweries page
if (!$brewery) {
    // Try to find by name in URL
    $brewery_name = isset($_GET['name']) ? $_GET['name'] : null;
    
    if ($brewery_name) {
        foreach ($breweries_data as $b) {
            if (isset($b['name']) && strtolower($b['name']) == strtolower($brewery_name)) {
                $brewery = $b;
                break;
            }
        }
    }
    
    // If still not found, redirect
    if (!$brewery) {
        header('Location: breweries.php');
        exit;
    }
}

// Helper function to get current URL
function get_current_url() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    return $protocol . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($brewery['name']); ?> - Ohio Beer Path</title>
    
    <!-- Meta tags -->
    <meta name="description" content="Visit <?php echo htmlspecialchars($brewery['name']); ?> in <?php echo htmlspecialchars($brewery['city']); ?>, Ohio. Discover craft beers, brewery details, and plan your visit with Ohio Beer Path.">
    <meta name="keywords" content="<?php echo htmlspecialchars($brewery['name']); ?>, brewery, craft beer, <?php echo htmlspecialchars($brewery['city']); ?> ohio, <?php echo htmlspecialchars($brewery['region'] ?? ''); ?> breweries, ohio beer path">
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="<?php echo htmlspecialchars($brewery['name']); ?> - Ohio Beer Path">
    <meta property="og:description" content="Visit <?php echo htmlspecialchars($brewery['name']); ?> in <?php echo htmlspecialchars($brewery['city']); ?>, Ohio. Discover craft beers, brewery details, and plan your visit with Ohio Beer Path.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo htmlspecialchars(get_current_url()); ?>">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/mobile.css">
    
    <!-- Favicon -->
    <link rel="icon" href="assets/images/favicon.ico">
</head>
<body>
    <?php 
    $active_page = 'breweries';
    include('includes/navigation.php'); 
    ?>

    <div class="container mt-5 mb-5">
        <div class="row">
            <div class="col-md-8">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="index.php">Home</a></li>
                        <li class="breadcrumb-item"><a href="breweries.php">Breweries</a></li>
                        <?php if (isset($brewery['region']) && !empty($brewery['region'])): ?>
                        <li class="breadcrumb-item"><a href="breweries.php?region=<?php echo urlencode($brewery['region']); ?>"><?php echo htmlspecialchars($brewery['region']); ?></a></li>
                        <?php endif; ?>
                        <li class="breadcrumb-item active" aria-current="page"><?php echo htmlspecialchars($brewery['name']); ?></li>
                    </ol>
                </nav>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h1 class="card-title h2"><?php echo htmlspecialchars($brewery['name']); ?></h1>
                        
                        <div class="d-flex align-items-center mb-3">
                            <i class="bi bi-geo-alt me-2" aria-hidden="true"></i>
                            <span><?php echo htmlspecialchars($brewery['city'] ?? ''); ?>, OH</span>
                        </div>
                        
                        <?php if (isset($brewery['region']) && !empty($brewery['region'])): ?>
                        <div class="mb-3">
                            <span class="badge bg-primary"><?php echo htmlspecialchars($brewery['region']); ?></span>
                            <?php if (isset($brewery['brewery_type']) && !empty($brewery['brewery_type'])): ?>
                            <span class="badge bg-secondary ms-2"><?php echo htmlspecialchars($brewery['brewery_type']); ?></span>
                            <?php endif; ?>
                        </div>
                        <?php endif; ?>
                        
                        <div class="brewery-image mb-4">
                            <?php 
                            if (function_exists('responsive_brewery_image')) {
                                echo responsive_brewery_image($brewery['name'], "{$brewery['name']} brewery in {$brewery['city']}, Ohio", ['img-fluid', 'rounded']);
                            } else {
                                echo '<img src="assets/images/breweries/placeholder.jpg" alt="' . htmlspecialchars($brewery['name']) . '" class="img-fluid rounded">';
                            }
                            ?>
                        </div>
                        
                        <?php if (isset($brewery['description']) && !empty($brewery['description'])): ?>
                        <div class="mb-4">
                            <h2 class="h4">About</h2>
                            <p><?php echo nl2br(htmlspecialchars($brewery['description'])); ?></p>
                        </div>
                        <?php endif; ?>
                        
                        <div class="d-flex flex-wrap gap-2 mt-4">
                            <button class="btn btn-primary add-to-itinerary" data-brewery-id="<?php echo htmlspecialchars($brewery['id'] ?? ''); ?>">
                                <i class="bi bi-plus-circle me-2" aria-hidden="true"></i> Add to Tour
                            </button>
                            
                            <?php if (isset($brewery['website']) && !empty($brewery['website']) && strpos($brewery['website'], 'http') === 0): ?>
                            <a href="<?php echo htmlspecialchars($brewery['website']); ?>" class="btn btn-outline-primary" target="_blank" rel="noopener">
                                <i class="bi bi-globe me-2" aria-hidden="true"></i> Visit Website
                            </a>
                            <?php endif; ?>
                            
                            <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
                            <a href="https://www.google.com/maps/dir/?api=1&destination=<?php echo urlencode($brewery['latitude'] . ',' . $brewery['longitude']); ?>" 
                               class="btn btn-outline-primary" target="_blank" rel="noopener">
                                <i class="bi bi-map me-2" aria-hidden="true"></i> Get Directions
                            </a>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <?php if (isset($brewery['hours']) && is_array($brewery['hours']) && !empty($brewery['hours'])): ?>
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Hours of Operation</h2>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <?php 
                            $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                            foreach ($days as $day): 
                                $hours = isset($brewery['hours'][ucfirst($day)]) ? $brewery['hours'][ucfirst($day)] : 
                                       (isset($brewery['hours'][$day]) ? $brewery['hours'][$day] : 'Closed');
                            ?>
                            <li class="list-group-item d-flex justify-content-between px-0">
                                <span class="text-capitalize"><?php echo $day; ?></span>
                                <span><?php echo htmlspecialchars($hours); ?></span>
                            </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
                <?php endif; ?>
                
                <?php if (!empty($related_breweries)): ?>
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">More Breweries in <?php echo htmlspecialchars($brewery['region']); ?></h2>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <?php foreach ($related_breweries as $related): ?>
                            <div class="col-md-4 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h3 class="h5 card-title"><?php echo htmlspecialchars($related['name']); ?></h3>
                                        <p class="text-muted mb-2">
                                            <i class="bi bi-geo-alt" aria-hidden="true"></i>
                                            <span><?php echo htmlspecialchars($related['city']); ?>, OH</span>
                                        </p>
                                        <a href="brewery-details.php?id=<?php echo htmlspecialchars($related['id'] ?? ''); ?>" class="btn btn-sm btn-outline-primary mt-2">
                                            View Details
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
            
            <div class="col-md-4">
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Contact Information</h2>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <?php if (isset($brewery['address']) && !empty($brewery['address'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-geo-alt text-primary me-2" aria-hidden="true"></i>
                                <span><?php echo htmlspecialchars($brewery['address']); ?></span>
                            </li>
                            <?php elseif (isset($brewery['street_address']) && !empty($brewery['street_address'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-geo-alt text-primary me-2" aria-hidden="true"></i>
                                <span>
                                    <?php 
                                    echo htmlspecialchars($brewery['street_address']);
                                    if (isset($brewery['city']) && !empty($brewery['city'])) {
                                        echo ', ' . htmlspecialchars($brewery['city']);
                                    }
                                    echo ', OH';
                                    if (isset($brewery['zipcode']) && !empty($brewery['zipcode'])) {
                                        echo ' ' . htmlspecialchars($brewery['zipcode']);
                                    }
                                    ?>
                                </span>
                            </li>
                            <?php endif; ?>
                            
                            <?php if (isset($brewery['phone']) && !empty($brewery['phone'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-telephone text-primary me-2" aria-hidden="true"></i>
                                <a href="tel:<?php echo htmlspecialchars($brewery['phone']); ?>"><?php echo htmlspecialchars($brewery['phone']); ?></a>
                            </li>
                            <?php endif; ?>
                            
                            <?php if (isset($brewery['email']) && !empty($brewery['email'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-envelope text-primary me-2" aria-hidden="true"></i>
                                <a href="mailto:<?php echo htmlspecialchars($brewery['email']); ?>"><?php echo htmlspecialchars($brewery['email']); ?></a>
                            </li>
                            <?php endif; ?>
                            
                            <?php if (isset($brewery['website']) && !empty($brewery['website']) && strpos($brewery['website'], 'http') === 0): ?>
                            <li class="mb-3">
                                <i class="bi bi-globe text-primary me-2" aria-hidden="true"></i>
                                <a href="<?php echo htmlspecialchars($brewery['website']); ?>" target="_blank" rel="noopener"><?php echo htmlspecialchars(preg_replace('#^https?://#', '', $brewery['website'])); ?></a>
                            </li>
                            <?php endif; ?>
                        </ul>
                    </div>
                </div>
                
                <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Location</h2>
                    </div>
                    <div class="card-body p-0">
                        <div id="breweryMap" style="height: 300px; width: 100%;"></div>
                    </div>
                </div>
                <?php endif; ?>
                
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Share</h2>
                    </div>
                    <div class="card-body">
                        <div class="d-flex gap-2">
                            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(get_current_url()); ?>" 
                               class="btn btn-outline-primary" target="_blank" rel="noopener">
                                <i class="bi bi-facebook" aria-hidden="true"></i>
                            </a>
                            <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode('Check out ' . $brewery['name'] . ' on Ohio Beer Path!'); ?>&url=<?php echo urlencode(get_current_url()); ?>" 
                               class="btn btn-outline-primary" target="_blank" rel="noopener">
                                <i class="bi bi-twitter" aria-hidden="true"></i>
                            </a>
                            <a href="mailto:?subject=<?php echo urlencode('Check out this brewery on Ohio Beer Path'); ?>&body=<?php echo urlencode('I thought you might be interested in ' . $brewery['name'] . ': ' . get_current_url()); ?>" 
                               class="btn btn-outline-primary">
                                <i class="bi bi-envelope" aria-hidden="true"></i>
                            </a>
                            <button class="btn btn-outline-primary" id="copyLinkBtn">
                                <i class="bi bi-link-45deg" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include('includes/footer.php'); ?>
    
    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    
    <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
    <!-- Google Maps API -->
    <script>
    function initMap() {
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
    }
    </script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY ?? ''); ?>&callback=initMap">
    </script>
    <?php endif; ?>
    
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Copy link button functionality
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(window.location.href).then(function() {
                    // Show success tooltip
                    copyLinkBtn.innerHTML = '<i class="bi bi-check"></i>';
                    
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
                
                // Add to itinerary using localStorage
                let itinerary = JSON.parse(localStorage.getItem('breweryItinerary') || '[]');
                
                // Check if already in itinerary
                if (!itinerary.includes(breweryId)) {
                    itinerary.push(breweryId);
                    localStorage.setItem('breweryItinerary', JSON.stringify(itinerary));
                    
                    // Update button text
                    this.innerHTML = '<i class="bi bi-check-circle me-2" aria-hidden="true"></i> Added to Tour';
                    this.classList.remove('btn-primary');
                    this.classList.add('btn-success');
                    
                    // Show success message
                    alert('Brewery added to your tour itinerary!');
                } else {
                    alert('This brewery is already in your tour itinerary.');
                }
            });
        });
    });
    </script>
</body>
</html>
