<?php
require_once('config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Your Brewery Tour - Ohio Beer Path</title>
    <meta name="description" content="Plan your perfect brewery tour across Ohio. Select breweries, optimize your route, and save your itinerary.">
    <link rel="canonical" href="https://ohiobeerpath.com/itinerary.php">
    <link rel="icon" href="assets/images/favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <script src="assets/js/maps-config.php"></script>
</head>
<body>
    <!-- Navigation -->
    <!-- Shared Navigation: sticky, mobile-friendly, accessible -->
<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top" role="navigation" aria-label="Main Navigation">
    <div class="container">
        <a class="navbar-brand" href="index.html">Ohio Beer Path</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavItinerary" aria-controls="navbarNavItinerary" aria-expanded="false" aria-label="Toggle navigation" style="padding: 0.75rem 1rem; font-size: 1.5rem;">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavItinerary">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="breweries.php">All Breweries</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="regions.php">Regions</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link active" href="itinerary.php">Itinerary</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="blog.php">Beer Blog</a>
                </li>
            </ul>
        </div>
    </div>
</nav>
        <div class="container">
            <a class="navbar-brand" href="index.html">Ohio Beer Path</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="index.html">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="nearby.php">Find Nearby</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="breweries.php">All Breweries</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="regions.php">Regions</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="itinerary.php">Itinerary</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="blog.php">Beer Blog</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-dark text-white text-center py-4">
        <div class="container">
            <h1 class="display-4">Create Your Brewery Tour</h1>
            <p class="lead">Plan the perfect craft beer adventure across Ohio</p>
        </div>
    </div>

    <!-- Itinerary Builder Section -->
    <section class="container my-5">
        <div class="row">
            <div class="col-lg-4 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-primary text-white">
                        <h3 class="h5 mb-0">Your Itinerary</h3>
                    </div>
                    <div class="card-body">
                        <div id="itineraryList" class="list-group mb-3">
                            <!-- Selected breweries will appear here -->
                            <div class="text-center py-4 text-muted">
                                <i class="bi bi-map fs-1"></i>
                                <p>No breweries added yet</p>
                            </div>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-success" onclick="saveItinerary()" id="saveButton" disabled>
                                <i class="bi bi-save"></i> Save Itinerary
                            </button>
                            <button class="btn btn-primary" onclick="optimizeRoute()" id="optimizeButton" disabled>
                                <i class="bi bi-arrow-repeat"></i> Optimize Route
                            </button>
                            <button class="btn btn-outline-danger" onclick="clearItinerary()" id="clearButton" disabled>
                                <i class="bi bi-trash"></i> Clear All
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card shadow-sm mt-4">
                    <div class="card-header bg-secondary text-white">
                        <h3 class="h5 mb-0">Starting Point</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="startingPoint" class="form-label">Your Location</label>
                            <input type="text" class="form-control" id="startingPoint" placeholder="Enter city or ZIP code">
                        </div>
                        <button class="btn btn-secondary w-100" onclick="setStartingPoint()">
                            <i class="bi bi-geo-alt"></i> Set Starting Point
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-8">
                <div class="card shadow-sm mb-4">
                    <div class="card-header">
                        <h3 class="h5 mb-0">Route Map</h3>
                    </div>
                    <div class="card-body p-0">
                        <div id="itineraryMap" style="height: 400px;"></div>
                    </div>
                </div>
                
                <div class="card shadow-sm">
                    <div class="card-header">
                        <h3 class="h5 mb-0">Find Breweries to Add</h3>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <input type="text" class="form-control" id="brewerySearch" placeholder="Search breweries...">
                            </div>
                            <div class="col-md-4">
                                <select class="form-select" id="regionFilter">
                                    <option value="">All Regions</option>
                                    <option value="northeast">Northeast Ohio</option>
                                    <option value="central">Central Ohio</option>
                                    <option value="southwest">Southwest Ohio</option>
                                    <option value="northwest">Northwest Ohio</option>
                                    <option value="southeast">Southeast Ohio</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-primary w-100" onclick="filterBreweries()">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div id="breweriesList" class="row g-3">
                            <!-- Breweries will be loaded here -->
                            <div class="text-center py-4 col-12 text-muted">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2">Loading breweries...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Save Itinerary Modal -->
    <div class="modal fade" id="saveItineraryModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Save Your Brewery Tour</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="itineraryName" class="form-label">Name Your Tour</label>
                        <input type="text" class="form-control" id="itineraryName" placeholder="Weekend Beer Adventure">
                    </div>
                    <div class="mb-3">
                        <label for="itineraryEmail" class="form-label">Email (to receive your itinerary)</label>
                        <input type="email" class="form-control" id="itineraryEmail" placeholder="your@email.com">
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="shareItinerary">
                        <label class="form-check-label" for="shareItinerary">
                            Share this itinerary publicly
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="finalizeItinerary()">Save Itinerary</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <h5>Ohio Beer Path</h5>
                    <p>Discovering Ohio's finest craft breweries.</p>
                    <p><small> 2025 Ohio Beer Path. All Rights Reserved.</small></p>
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

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/itinerary.js"></script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>&libraries=places&callback=initMap">
    </script>
</body>
</html>
