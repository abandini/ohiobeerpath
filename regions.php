<?php
require_once('config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ohio Brewing Regions - Ohio Beer Path</title>
    <meta name="description" content="Explore Ohio's diverse brewing regions from Cleveland's historic beer scene to Cincinnati's German heritage. Discover regional beer styles and brewing traditions.">
    <meta name="keywords" content="Ohio beer regions, Cleveland breweries, Cincinnati beer, Columbus craft beer, Ohio brewing history">
    <link rel="canonical" href="https://ohiobeerpath.com/regions.php">
    <link rel="icon" href="assets/images/favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <!-- Navigation -->
    <!-- Shared Navigation: sticky, mobile-friendly, accessible -->
<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top" role="navigation" aria-label="Main Navigation">
    <div class="container">
        <a class="navbar-brand" href="index.html">Ohio Beer Path</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavRegions" aria-controls="navbarNavRegions" aria-expanded="false" aria-label="Toggle navigation" style="padding: 0.75rem 1rem; font-size: 1.5rem;">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavRegions">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="breweries.php">All Breweries</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link active" href="regions.php">Regions</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="itinerary.php">Itinerary</a>
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
            <h1 class="display-4">Ohio's Brewing Regions</h1>
            <p class="lead">Discover the unique beer cultures across the Buckeye State</p>
        </div>
    </div>

    <!-- Ohio Map Section -->
    <section class="container my-5">
        <div class="row">
            <div class="col-lg-10 mx-auto">
                <div class="card shadow-sm">
                    <div class="card-header bg-dark text-white">
                        <h3 class="h5 mb-0">Interactive Ohio Brewing Regions Map</h3>
                    </div>
                    <div class="card-body p-0">
                        <div id="ohioMap" style="height: 500px;"></div>
                    </div>
                </div>
                <div class="text-center mt-3">
                    <p class="text-muted">Click on a colored region to explore its breweries</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Regions Section -->
    <section class="container my-5" id="region-tiles">
        <h2 class="text-center mb-4">Explore Ohio's Brewing Regions</h2>
        <div class="row g-4">
            <!-- Northeast Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="northeast">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/great_lakes.jpg" class="card-img-top" alt="Great Lakes Brewing Company - Northeast Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-primary text-white">
                        <h2 class="h4 mb-0">Northeast Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>Northeast Ohio has a rich brewing heritage dating back to the 19th century, with Cleveland as its hub of craft beer innovation.</p>
                        <h3 class="h5 mt-3">Major Cities & Zip Codes</h3>
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Cleveland
                                <span class="badge bg-primary rounded-pill">44113</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Akron
                                <span class="badge bg-primary rounded-pill">44308</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Canton
                                <span class="badge bg-primary rounded-pill">44702</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Youngstown
                                <span class="badge bg-primary rounded-pill">44503</span>
                            </li>
                        </ul>
                        <p><strong>Known for:</strong> Great Lakes IPAs, robust porters, and experimental sours</p>
                        <div class="d-grid gap-2 mt-3">
                            <a href="breweries.php?region=northeast" class="btn btn-outline-primary">View Northeast Breweries</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- East Central Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="eastcentral">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/weasel_boy.jpg" class="card-img-top" alt="Weasel Boy Brewing - East Central Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-warning text-white">
                        <h2 class="h4 mb-0">East Central Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>East Central Ohio offers a mix of urban and rural brewing experiences with a focus on German-inspired beers and innovative craft offerings.</p>
                        
                        <h3 class="h5 mt-4 border-bottom pb-2">Major Cities & Zip Codes</h3>
                        <div class="row">
                            <div class="col-sm-6 mb-2">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>New Philadelphia</strong>
                                    <span class="badge bg-secondary">44663</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Dover</strong>
                                    <span class="badge bg-secondary">44622</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Cambridge</strong>
                                    <span class="badge bg-secondary">43725</span>
                                </div>
                            </div>
                            <div class="col-sm-6 mb-2">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Zanesville</strong>
                                    <span class="badge bg-secondary">43701</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Coshocton</strong>
                                    <span class="badge bg-secondary">43812</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Millersburg</strong>
                                    <span class="badge bg-secondary">44654</span>
                                </div>
                            </div>
                        </div>
                        
                        <h3 class="h5 mt-4 border-bottom pb-2">Notable Breweries</h3>
                        <ul>
                            <li>Weasel Boy Brewing Company (Zanesville)</li>
                            <li>Hoodletown Brewing Company (Dover)</li>
                            <li>Lockport Brewery (Bolivar)</li>
                        </ul>
                        
                        <div class="text-center mt-4">
                            <a href="breweries.php?region=eastcentral" class="btn btn-outline-primary">Explore East Central Breweries</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Northwest Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="northwest">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/maumee_bay.jpg" class="card-img-top" alt="Maumee Bay Brewing Company - Northwest Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-info text-white">
                        <h2 class="h4 mb-0">Northwest Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>Northwest Ohio's brewing scene features community-focused breweries across the northwestern part of the state, from Toledo to the state border.</p>
                        <h3 class="h5 mt-3">Major Cities & Zip Codes</h3>
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Toledo
                                <span class="badge bg-info rounded-pill">43604</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Findlay
                                <span class="badge bg-info rounded-pill">45840</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Bowling Green
                                <span class="badge bg-info rounded-pill">43402</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Sandusky
                                <span class="badge bg-info rounded-pill">44870</span>
                            </li>
                        </ul>
                        <p><strong>Known for:</strong> Farmhouse ales, session beers, and agricultural ingredients</p>
                        <div class="d-grid gap-2 mt-3">
                            <a href="breweries.php?region=northwest" class="btn btn-outline-info">View Northwest Breweries</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Central Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="central">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/land_grant.jpg" class="card-img-top" alt="Land-Grant Brewing Company - Central Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-success text-white">
                        <h2 class="h4 mb-0">Central Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>Central Ohio, anchored by Columbus, has become one of the fastest-growing craft beer scenes in the Midwest.</p>
                        <h3 class="h5 mt-3">Major Cities & Zip Codes</h3>
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Columbus
                                <span class="badge bg-success rounded-pill">43215</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Delaware
                                <span class="badge bg-success rounded-pill">43015</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Lancaster
                                <span class="badge bg-success rounded-pill">43130</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Newark
                                <span class="badge bg-success rounded-pill">43055</span>
                            </li>
                        </ul>
                        <p><strong>Known for:</strong> Creative pale ales, German lagers, and barrel-aged specialty beers</p>
                        <div class="d-grid gap-2 mt-3">
                            <a href="breweries.php?region=central" class="btn btn-outline-success">View Central Breweries</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- West Central Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="westcentral">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/mother_stewarts.jpg" class="card-img-top" alt="Mother Stewart's Brewing Company - West Central Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-secondary text-white">
                        <h2 class="h4 mb-0">West Central Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>West Central Ohio bridges the rural areas west of Columbus to the Indiana border, with craft breweries that blend innovative approaches with traditional techniques.</p>
                        <h3 class="h5 mt-3">Major Cities & Zip Codes</h3>
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Springfield
                                <span class="badge bg-secondary rounded-pill">45504</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Lima
                                <span class="badge bg-secondary rounded-pill">45801</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Troy
                                <span class="badge bg-secondary rounded-pill">45373</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Bellefontaine
                                <span class="badge bg-secondary rounded-pill">43311</span>
                            </li>
                        </ul>
                        <p><strong>Known for:</strong> Small-batch brewing, wheat beers, and regional interpretations of classic styles</p>
                        <div class="d-grid gap-2 mt-3">
                            <a href="breweries.php?region=westcentral" class="btn btn-outline-secondary">View West Central Breweries</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Southwest Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="southwest">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/rhinegeist.jpg" class="card-img-top" alt="Rhinegeist Brewery - Southwest Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-danger text-white">
                        <h2 class="h4 mb-0">Southwest Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>Southwest Ohio encompasses Cincinnati and the entire southwest corner of the state to the Indiana and Kentucky borders, with deep German brewing traditions.</p>
                        <h3 class="h5 mt-3">Major Cities & Zip Codes</h3>
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Cincinnati
                                <span class="badge bg-danger rounded-pill">45202</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Dayton
                                <span class="badge bg-danger rounded-pill">45402</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Hamilton
                                <span class="badge bg-danger rounded-pill">45011</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Oxford
                                <span class="badge bg-danger rounded-pill">45056</span>
                            </li>
                        </ul>
                        <p><strong>Known for:</strong> German lagers, traditional ales, and the Cincinnati "grain to glass" approach</p>
                        <div class="d-grid gap-2 mt-3">
                            <a href="breweries.php?region=southwest" class="btn btn-outline-danger">View Southwest Breweries</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Southeast Ohio -->
            <div class="col-md-6 col-lg-4 mb-4" id="southeast">
                <div class="card h-100 shadow-sm region-card">
                    <img src="assets/images/breweries/jackie_os.jpg" class="card-img-top" alt="Jackie O's Brewery - Southeast Ohio" style="height: 200px; object-fit: cover;">
                    <div class="card-header bg-warning text-dark">
                        <h2 class="h4 mb-0">Southeast Ohio</h2>
                    </div>
                    <div class="card-body">
                        <p>Southeast Ohio's brewing scene reflects the region's Appalachian heritage with small-batch breweries focused on environmental connection.</p>
                        <h3 class="h5 mt-3">Major Cities & Zip Codes</h3>
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Athens
                                <span class="badge bg-warning text-dark rounded-pill">45701</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Marietta
                                <span class="badge bg-warning text-dark rounded-pill">45750</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Portsmouth
                                <span class="badge bg-warning text-dark rounded-pill">45662</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Zanesville
                                <span class="badge bg-warning text-dark rounded-pill">43701</span>
                            </li>
                        </ul>
                        <p><strong>Known for:</strong> Rustic ales, wood-aged beers, and local ingredient specialties</p>
                        <div class="d-grid gap-2 mt-3">
                            <a href="breweries.php?region=southeast" class="btn btn-outline-warning">View Southeast Breweries</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Regional Beer Trails Section -->
    <section class="container my-5">
        <h2 class="text-center mb-4">Ohio Beer Trails</h2>
        <div class="row">
            <div class="col-lg-8 mx-auto">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <p class="lead text-center mb-4">Explore Ohio's official and unofficial beer trails</p>
                        
                        <div class="accordion" id="beerTrailsAccordion">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="clevelandTrailHeading">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#clevelandTrailCollapse" aria-expanded="true" aria-controls="clevelandTrailCollapse">
                                        Cleveland Brewery Trail
                                    </button>
                                </h2>
                                <div id="clevelandTrailCollapse" class="accordion-collapse collapse show" aria-labelledby="clevelandTrailHeading" data-bs-parent="#beerTrailsAccordion">
                                    <div class="accordion-body">
                                        <p>Explore Cleveland's rich brewing history and vibrant craft beer scene with this self-guided tour of over 30 breweries across the city and surrounding suburbs.</p>
                                        <a href="itinerary.php?trail=cleveland" class="btn btn-sm btn-outline-primary">View Trail Map</a>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="columbusTrailHeading">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#columbusTrailCollapse" aria-expanded="false" aria-controls="columbusTrailCollapse">
                                        Columbus Ale Trail
                                    </button>
                                </h2>
                                <div id="columbusTrailCollapse" class="accordion-collapse collapse" aria-labelledby="columbusTrailHeading" data-bs-parent="#beerTrailsAccordion">
                                    <div class="accordion-body">
                                        <p>The official Columbus Ale Trail features over 50 craft breweries throughout Central Ohio. Collect stamps at each location for exclusive merchandise.</p>
                                        <a href="itinerary.php?trail=columbus" class="btn btn-sm btn-outline-primary">View Trail Map</a>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="cincinnatiTrailHeading">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cincinnatiTrailCollapse" aria-expanded="false" aria-controls="cincinnatiTrailCollapse">
                                        Cincinnati Brewery Heritage Trail
                                    </button>
                                </h2>
                                <div id="cincinnatiTrailCollapse" class="accordion-collapse collapse" aria-labelledby="cincinnatiTrailHeading" data-bs-parent="#beerTrailsAccordion">
                                    <div class="accordion-body">
                                        <p>This trail combines history and beer, taking you through Cincinnati's historic Over-the-Rhine district where pre-Prohibition breweries once thrived alongside modern craft breweries.</p>
                                        <a href="itinerary.php?trail=cincinnati" class="btn btn-sm btn-outline-primary">View Trail Map</a>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="summitTrailHeading">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#summitTrailCollapse" aria-expanded="false" aria-controls="summitTrailCollapse">
                                        Summit Brew Path
                                    </button>
                                </h2>
                                <div id="summitTrailCollapse" class="accordion-collapse collapse" aria-labelledby="summitTrailHeading" data-bs-parent="#beerTrailsAccordion">
                                    <div class="accordion-body">
                                        <p>Explore the diverse breweries of Summit County and surrounding areas, including Akron's growing craft beer scene.</p>
                                        <a href="itinerary.php?trail=summit" class="btn btn-sm btn-outline-primary">View Trail Map</a>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="daytonTrailHeading">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#daytonTrailCollapse" aria-expanded="false" aria-controls="daytonTrailCollapse">
                                        Dayton Ale Trail
                                    </button>
                                </h2>
                                <div id="daytonTrailCollapse" class="accordion-collapse collapse" aria-labelledby="daytonTrailHeading" data-bs-parent="#beerTrailsAccordion">
                                    <div class="accordion-body">
                                        <p>Discover Dayton's innovative breweries with this trail that highlights the city's growing craft beer culture.</p>
                                        <a href="itinerary.php?trail=dayton" class="btn btn-sm btn-outline-primary">View Trail Map</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

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
    <!-- Include our custom map regions JS file -->
    <script src="assets/js/map_regions.js"></script>
    <!-- Add the Google Maps API script with the PHP variable -->
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>&callback=initMap">
    </script>
</body>
</html>
