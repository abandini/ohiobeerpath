<?php
// Simple brewery details page with direct JSON access
$brewery_id = isset($_GET['id']) ? $_GET['id'] : null;
$brewery_name = isset($_GET['name']) ? $_GET['name'] : null;

// Initialize brewery data
$brewery = null;
$breweries_data = [];

// Load brewery data from JSON file
$json_file = 'breweries.json';
if (file_exists($json_file)) {
    $breweries_data = json_decode(file_get_contents($json_file), true);
    
    // Find the brewery by ID or name
    if ($brewery_id || $brewery_name) {
        foreach ($breweries_data as $index => $b) {
            // Add index as ID if not present
            if (!isset($b['id'])) {
                $breweries_data[$index]['id'] = $index + 1;
                $b['id'] = $index + 1;
            }
            
            if (($brewery_id && isset($b['id']) && $b['id'] == $brewery_id) || 
                ($brewery_name && isset($b['name']) && strtolower($b['name']) == strtolower($brewery_name))) {
                $brewery = $b;
                break;
            }
        }
    }
}

// If brewery not found, show error
if (!$brewery) {
    echo '<div class="alert alert-danger">Brewery not found</div>';
    exit;
}

// Helper function to get current URL
function get_current_url() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    return $protocol . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
}

// Helper function to get brewery image URL
function get_brewery_image($name) {
    $name = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    $image_path = "assets/images/breweries/{$name}.jpg";
    
    if (file_exists($image_path)) {
        return $image_path;
    } else {
        return "assets/images/breweries/placeholder.jpg";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($brewery['name']); ?> - Ohio Beer Path</title>
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    
    <style>
        .brewery-header {
            background-color: #343a40;
            color: white;
            padding: 2rem 0;
        }
        .brewery-image {
            max-height: 300px;
            object-fit: cover;
            width: 100%;
            border-radius: 0.25rem;
        }
        .map-container {
            height: 300px;
            width: 100%;
            border-radius: 0.25rem;
        }
        .hours-list {
            list-style: none;
            padding-left: 0;
        }
        .hours-list li {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        .hours-list li:last-child {
            border-bottom: none;
        }
        .brewery-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="index.php">Ohio Beer Path</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="breweries.php">Breweries</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="regions.php">Regions</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="itinerary.php">My Tour</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <header class="brewery-header">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1><?php echo htmlspecialchars($brewery['name']); ?></h1>
                    <p class="lead mb-0">
                        <i class="bi bi-geo-alt me-2"></i>
                        <?php echo htmlspecialchars($brewery['city'] ?? ''); ?>, OH
                    </p>
                    
                    <?php if (isset($brewery['region']) && !empty($brewery['region'])): ?>
                    <div class="mt-3">
                        <span class="badge bg-primary"><?php echo htmlspecialchars($brewery['region']); ?></span>
                        <?php if (isset($brewery['brewery_type']) && !empty($brewery['brewery_type'])): ?>
                        <span class="badge bg-secondary ms-2"><?php echo htmlspecialchars($brewery['brewery_type']); ?></span>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                    
                    <div class="brewery-actions mt-4">
                        <button class="btn btn-light" id="addToTourBtn">
                            <i class="bi bi-plus-circle me-2"></i> Add to Tour
                        </button>
                        
                        <?php if (isset($brewery['website']) && !empty($brewery['website']) && strpos($brewery['website'], 'http') === 0): ?>
                        <a href="<?php echo htmlspecialchars($brewery['website']); ?>" class="btn btn-outline-light" target="_blank">
                            <i class="bi bi-globe me-2"></i> Visit Website
                        </a>
                        <?php endif; ?>
                        
                        <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=<?php echo urlencode($brewery['latitude'] . ',' . $brewery['longitude']); ?>" 
                           class="btn btn-outline-light" target="_blank">
                            <i class="bi bi-map me-2"></i> Get Directions
                        </a>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="col-md-4 mt-4 mt-md-0">
                    <img src="<?php echo get_brewery_image($brewery['name']); ?>" alt="<?php echo htmlspecialchars($brewery['name']); ?>" class="brewery-image">
                </div>
            </div>
        </div>
    </header>

    <div class="container my-5">
        <div class="row">
            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">About</h2>
                    </div>
                    <div class="card-body">
                        <?php if (isset($brewery['description']) && !empty($brewery['description'])): ?>
                        <p><?php echo nl2br(htmlspecialchars($brewery['description'])); ?></p>
                        <?php else: ?>
                        <p><?php echo htmlspecialchars($brewery['name']); ?> is a brewery located in <?php echo htmlspecialchars($brewery['city']); ?>, Ohio. 
                        Visit this brewery to explore their unique craft beers and brewery experience.</p>
                        <?php endif; ?>
                    </div>
                </div>
                
                <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Location</h2>
                    </div>
                    <div class="card-body p-0">
                        <div id="breweryMap" class="map-container"></div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
            
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Contact Information</h2>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <?php if (isset($brewery['address']) && !empty($brewery['address'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-geo-alt text-primary me-2"></i>
                                <span><?php echo htmlspecialchars($brewery['address']); ?></span>
                            </li>
                            <?php elseif (isset($brewery['street_address']) && !empty($brewery['street_address'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-geo-alt text-primary me-2"></i>
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
                                <i class="bi bi-telephone text-primary me-2"></i>
                                <a href="tel:<?php echo htmlspecialchars($brewery['phone']); ?>"><?php echo htmlspecialchars($brewery['phone']); ?></a>
                            </li>
                            <?php endif; ?>
                            
                            <?php if (isset($brewery['email']) && !empty($brewery['email'])): ?>
                            <li class="mb-3">
                                <i class="bi bi-envelope text-primary me-2"></i>
                                <a href="mailto:<?php echo htmlspecialchars($brewery['email']); ?>"><?php echo htmlspecialchars($brewery['email']); ?></a>
                            </li>
                            <?php endif; ?>
                        </ul>
                    </div>
                </div>
                
                <?php if (isset($brewery['hours']) && is_array($brewery['hours']) && !empty($brewery['hours'])): ?>
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h4 mb-0">Hours</h2>
                    </div>
                    <div class="card-body">
                        <ul class="hours-list">
                            <?php 
                            $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                            foreach ($days as $day): 
                                $hours = isset($brewery['hours'][$day]) ? $brewery['hours'][$day] : 'Closed';
                            ?>
                            <li>
                                <strong><?php echo $day; ?></strong>
                                <span><?php echo htmlspecialchars($hours); ?></span>
                            </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <footer class="bg-dark text-white py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h3 class="h5">Ohio Beer Path</h3>
                    <p>Discover Ohio's finest breweries and plan your ultimate brewery tour.</p>
                </div>
                <div class="col-md-3">
                    <h4 class="h6">Quick Links</h4>
                    <ul class="list-unstyled">
                        <li><a href="index.php" class="text-white">Home</a></li>
                        <li><a href="breweries.php" class="text-white">Breweries</a></li>
                        <li><a href="regions.php" class="text-white">Regions</a></li>
                        <li><a href="itinerary.php" class="text-white">My Tour</a></li>
                    </ul>
                </div>
                <div class="col-md-3">
                    <h4 class="h6">Connect</h4>
                    <div class="d-flex gap-2">
                        <a href="#" class="text-white"><i class="bi bi-facebook"></i></a>
                        <a href="#" class="text-white"><i class="bi bi-twitter"></i></a>
                        <a href="#" class="text-white"><i class="bi bi-instagram"></i></a>
                    </div>
                </div>
            </div>
            <hr class="mt-4">
            <div class="text-center">
                <p class="mb-0">&copy; <?php echo date('Y'); ?> Ohio Beer Path. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    
    <?php if (isset($brewery['latitude']) && isset($brewery['longitude'])): ?>
    <script>
    // Store brewery data for use in map
    const breweryData = {
        id: <?php echo json_encode($brewery['id'] ?? ''); ?>,
        name: <?php echo json_encode($brewery['name']); ?>,
        latitude: <?php echo isset($brewery['latitude']) ? floatval($brewery['latitude']) : 'null'; ?>,
        longitude: <?php echo isset($brewery['longitude']) ? floatval($brewery['longitude']) : 'null'; ?>,
        city: <?php echo json_encode($brewery['city'] ?? ''); ?>
    };
    
    // Initialize map when Google Maps API loads
    function initMap() {
        if (!breweryData.latitude || !breweryData.longitude) {
            document.getElementById('breweryMap').innerHTML = '<div class="alert alert-warning m-3">Location coordinates not available</div>';
            return;
        }
        
        const breweryLocation = {
            lat: breweryData.latitude,
            lng: breweryData.longitude
        };
        
        const map = new google.maps.Map(document.getElementById('breweryMap'), {
            center: breweryLocation,
            zoom: 15,
            mapTypeControl: false,
            fullscreenControl: true
        });
        
        const marker = new google.maps.Marker({
            position: breweryLocation,
            map: map,
            title: breweryData.name
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="max-width: 200px;">
                    <h6 style="margin-bottom: 5px;">${breweryData.name}</h6>
                    <p style="margin-bottom: 5px; color: #666;">${breweryData.city}, OH</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${breweryData.latitude},${breweryData.longitude}" 
                       target="_blank" style="font-size: 0.9rem;">Get Directions</a>
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
    
    <!-- Load Google Maps API with callback -->
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDR0jIaHjbCl7IRIwKEySe8sM8Qp4zmK8Y&callback=initMap">
    </script>
    <?php endif; ?>
    
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Add to tour functionality
        const addToTourBtn = document.getElementById('addToTourBtn');
        if (addToTourBtn) {
            addToTourBtn.addEventListener('click', function() {
                // Get brewery data
                const brewery = {
                    id: <?php echo json_encode($brewery['id'] ?? ''); ?>,
                    name: <?php echo json_encode($brewery['name']); ?>,
                    city: <?php echo json_encode($brewery['city'] ?? ''); ?>
                };
                
                // Get existing tour from localStorage
                let tour = JSON.parse(localStorage.getItem('breweryTour') || '[]');
                
                // Check if brewery is already in tour
                const exists = tour.some(item => item.id === brewery.id);
                
                if (!exists) {
                    // Add brewery to tour
                    tour.push(brewery);
                    localStorage.setItem('breweryTour', JSON.stringify(tour));
                    
                    // Update button
                    addToTourBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Added to Tour';
                    addToTourBtn.classList.remove('btn-light');
                    addToTourBtn.classList.add('btn-success');
                    
                    // Show success message
                    alert(`${brewery.name} has been added to your tour!`);
                } else {
                    // Already in tour
                    alert(`${brewery.name} is already in your tour.`);
                }
            });
            
            // Check if brewery is already in tour
            const tour = JSON.parse(localStorage.getItem('breweryTour') || '[]');
            const breweryId = <?php echo json_encode($brewery['id'] ?? ''); ?>;
            const exists = tour.some(item => item.id === breweryId);
            
            if (exists) {
                addToTourBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Added to Tour';
                addToTourBtn.classList.remove('btn-light');
                addToTourBtn.classList.add('btn-success');
            }
        }
    });
    </script>
</body>
</html>
