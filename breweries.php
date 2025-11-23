<?php
require_once('config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ohio Breweries Directory - Ohio Beer Path</title>
    <meta name="description" content="Comprehensive directory of craft breweries across Ohio. Filter by region, brewery type, and amenities to find your perfect brewery experience.">
    <meta name="keywords" content="Ohio breweries, craft beer, microbreweries, brewpubs, Ohio beer directory">
    <link rel="canonical" href="https://ohiobeerpath.com/breweries.php">
    <link rel="icon" href="assets/images/favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <!-- Bootstrap Icons for our detail view -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
</head>
<body>
    <!-- Navigation -->
<?php 
    $active_page = 'breweries';
    include('includes/navigation.php'); 
?>

    <!-- Hero Section -->
    <div class="bg-dark text-white text-center py-4">
        <div class="container">
            <h1 class="display-4">Ohio Breweries Directory</h1>
            <p class="lead">Discover all craft breweries across the Buckeye State</p>
        </div>
    </div>

    <!-- Filter Section -->
    <section class="container my-4">
        <div class="card shadow-sm">
            <div class="card-body">
                <h2 class="h4 mb-3">Filter Breweries</h2>
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" id="searchInput" class="form-control" placeholder="Search by name or city...">
                    </div>
                    <div class="col-md-3">
                        <select id="regionFilter" class="form-select">
                            <option value="">All Regions</option>
                            <option value="northeast">Northeast Ohio</option>
                            <option value="eastcentral">East Central Ohio</option>
                            <option value="central">Central Ohio</option>
                            <option value="westcentral">West Central Ohio</option>
                            <option value="southwest">Southwest Ohio</option>
                            <option value="northwest">Northwest Ohio</option>
                            <option value="southeast">Southeast Ohio</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="typeFilter" class="form-select">
                            <option value="">All Types</option>
                            <option value="micro">Microbrewery</option>
                            <option value="brewpub">Brewpub</option>
                            <option value="regional">Regional Brewery</option>
                            <option value="large">Large Brewery</option>
                            <option value="contract">Contract Brewery</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button id="filterButton" class="btn btn-primary w-100">
                            <i class="bi bi-filter"></i> Filter
                        </button>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="d-flex flex-wrap gap-2" id="amenityFilters">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="foodFilter" value="food">
                                <label class="form-check-label" for="foodFilter">Food Available</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="outdoorFilter" value="outdoor">
                                <label class="form-check-label" for="outdoorFilter">Outdoor Seating</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="toursFilter" value="tours">
                                <label class="form-check-label" for="toursFilter">Tours Available</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="dogFriendlyFilter" value="dog_friendly">
                                <label class="form-check-label" for="dogFriendlyFilter">Dog Friendly</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="familyFriendlyFilter" value="family_friendly">
                                <label class="form-check-label" for="familyFriendlyFilter">Family Friendly</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Results Section -->
    <section class="container my-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h3 mb-0">Breweries in Ohio</h2>
            <div class="results-counter px-3 py-1 bg-light rounded">
                <span id="resultCount">0</span> breweries found
            </div>
        </div>
        
        <div class="row g-4" id="breweriesList">
            <!-- Breweries will be loaded here -->
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading breweries...</p>
            </div>
        </div>
        
        <div class="text-center mt-4">
            <button id="loadMoreButton" class="btn btn-outline-primary d-none">
                Load More Breweries
            </button>
        </div>
    </section>

    <!-- Brewery Detail Modal -->
    <div class="modal fade" id="breweryDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="breweryName">Brewery Name</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="breweryDetails">
                    <!-- Brewery details will be loaded here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="addToItineraryButton">
                        <i class="bi bi-plus"></i> Add to Itinerary
                    </button>
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
    <!-- Our brewery details script for handling View Details button clicks -->
    <script src="assets/js/brewery-details.js"></script>
    <!-- Our region data fix script that repairs data and handles region filtering properly -->
    <script src="region-data-fix.js"></script>
    <!-- Direct fix script as fallback -->
    <script src="direct-fix.js"></script>
    <!-- Original scripts for fallback -->
    <script src="assets/js/breweries.js"></script>
    <script src="assets/js/brewery-list.js"></script>
    
    <script>
    // Immediate fix for region filtering - overrides other methods
    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const regionParam = urlParams.get('region');
        
        if (regionParam) {
            console.log('Fixing region filter for: ' + regionParam);
            
            // Show loading spinner while we fix things
            document.getElementById('breweriesList').innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading ${regionParam} breweries...</span>
                    </div>
                    <p class="mt-3">Loading ${regionParam} breweries...</p>
                </div>
            `;
            
            // Use direct fetch with minimal dependencies
            fetch('breweries.json')
                .then(response => response.ok ? response.json() : fetch('assets/data/breweries.json').then(r => r.json()))
                .then(breweries => {
                    const filtered = breweries.filter(b => b.region && b.region.toLowerCase() === regionParam.toLowerCase());
                    console.log(`Found ${filtered.length} breweries for ${regionParam} region`);
                    
                    if (filtered.length > 0) {
                        // Clear and rebuild list
                        const list = document.getElementById('breweriesList');
                        list.innerHTML = '';
                        
                        filtered.forEach(brewery => {
                            const el = document.createElement('div');
                            el.className = 'col-md-6 col-lg-4 mb-4';
                            el.innerHTML = `
                                <div class="card h-100 shadow-sm">
                                    <div class="card-body">
                                        <h3 class="h5">${brewery.name}</h3>
                                        <p class="text-muted">${brewery.city || ''}, OH</p>
                                        <div class="d-flex gap-2 mb-3">
                                            <span class="badge bg-primary">${brewery.region}</span>
                                        </div>
                                        <button class="btn btn-sm btn-outline-primary">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            `;
                            list.appendChild(el);
                        });
                        
                        // Update count
                        document.getElementById('resultCount').textContent = filtered.length;
                    }
                })
                .catch(error => console.error('Error loading breweries:', error));
        }
    });
    </script>
</body>
</html>
