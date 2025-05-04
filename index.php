<?php
require_once('../config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ohio Beer Path</title>
    <!-- Keep all your original CSS references -->
    <link href="assets/css/styles.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <div class="container">
        <a class="navbar-brand" href="index.php">Ohio Beer Path</a>
        <span class="navbar-toggler-icon"></span>
        <div id="navbarNav" class="collapse navbar-collapse">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link active" href="index.php">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="nearby.php">Find Nearby</a>
                </li>
            </ul>
        </div>
    </div>

    <!-- Hero Section -->
    <div class="hero-section bg-dark text-white text-center py-5">
        <div class="container">
            <h1 class="display-4">Discover Ohio's Finest Breweries</h1>
            <p>Plan Your Ultimate Brewery Tour</p>
            <div class="mt-4">
                Find Breweries Near You
            </div>
        </div>
    </div>

    <!-- Regions Section -->
    <div class="section container my-5">
        <h2 class="text-center mb-4">Explore Ohio's Brewing Regions</h2>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="/api/placeholder/400/200" class="card-img-top" alt="Northeast Ohio">
                    <div class="card-body">
                        <h3 class="card-title h5">Northeast Ohio</h3>
                        <p>Discover the rich brewing traditions of Cleveland, Akron, and surrounding areas.</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="/api/placeholder/400/200" class="card-img-top" alt="Central Ohio">
                    <div class="card-body">
                        <h3 class="card-title h5">Central Ohio</h3>
                        <p>Explore Columbus's vibrant craft beer scene and surrounding communities.</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 region-card">
                    <img src="/api/placeholder/400/200" class="card-img-top" alt="Southwest Ohio">
                    <div class="card-body">
                        <h3 class="card-title h5">Southwest Ohio</h3>
                        <p>Experience Cincinnati's historic brewing heritage and modern craft scene.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Map Section -->
    <div class="section container-fluid bg-light py-5">
        <div class="container">
            <h2 class="text-center mb-4">Explore Ohio Breweries</h2>
            <div class="row">
                <div class="col-md-4">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5>Find Breweries Near You</h5>
                            <div class="mb-3">Enter your location</div>
                            <button class="btn btn-primary">Search</button>
                        </div>
                    </div>
                    <div id="searchResults" class="d-none">
                        <h6 class="mb-3">Search Results</h6>
                        <div id="breweriesList"></div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div id="map" class="rounded shadow" style="height: 500px;"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Spinner -->
    <div id="loadingSpinner" class="d-none">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <h5>Ohio Beer Path</h5>
                    <p>Discovering Ohio's finest craft breweries.</p>
                </div>
                <div class="col-md-4">
                    <h5>Quick Links</h5>
                    <ul class="list-unstyled">
                        <li><a href="index.php" class="text-white">Home</a></li>
                        <li><a href="nearby.php" class="text-white">Find Breweries</a></li>
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5>Connect With Us</h5>
                    <div class="social-icons">
                        <a href="#" class="text-white me-3"></a>
                        <a href="#" class="text-white me-3"></a>
                        <a href="#" class="text-white"></a>
                    </div>
                </div>
            </div>
            <div class="text-center mt-4">
                © 2024 Ohio Beer Path. All Rights Reserved.
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script>
        function initMap() {
            const map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 40.4173, lng: -82.9071 }, // Ohio coordinates
                zoom: 7
            });
        }
    </script>
    <!-- Add the Google Maps API script with the PHP variable -->
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>&callback=initMap">
    </script>
</body>
</html>