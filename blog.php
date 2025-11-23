<?php
require_once('../config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ohio Beer Blog - News, Events & Brewery Insights | Ohio Beer Path</title>
    <meta name="description" content="Stay updated with the latest Ohio craft beer news, brewery openings, beer festivals, and expert insights on the Ohio Beer Path blog.">
    <meta name="keywords" content="Ohio beer blog, craft beer news, brewery events, Ohio beer festivals, beer reviews">
    <link rel="canonical" href="https://ohiobeerpath.com/blog.php">
    <link rel="icon" href="assets/images/favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
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
                        <a class="nav-link" href="itinerary.php">Itinerary</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="blog.php">Beer Blog</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-dark text-white text-center py-4">
        <div class="container">
            <h1 class="display-4">Ohio Beer Blog</h1>
            <p class="lead">News, Events, and Insights from Ohio's Craft Beer Scene</p>
        </div>
    </div>

    <!-- Blog Content Section -->
    <section class="container my-5">
        <div class="row">
            <!-- Main Content -->
            <div class="col-lg-8">
                <!-- Featured Article -->
                <article class="card mb-4 shadow-sm">
                    <img src="/api/placeholder/800/400" class="card-img-top" alt="Ohio Summer Beer Festivals">
                    <div class="card-body">
                        <div class="small text-muted mb-1">May 4, 2025</div>
                        <h2 class="card-title h3">The Ultimate Guide to Ohio Summer Beer Festivals 2025</h2>
                        <p class="card-text">Summer is just around the corner, and that means Ohio's beer festival season is about to kick into high gear. From Cleveland to Cincinnati, breweries across the state are preparing to showcase their latest and greatest creations.</p>
                        <p>This comprehensive guide covers all the must-attend beer festivals happening across Ohio this summer, including ticket information, featured breweries, and insider tips to make the most of your experience.</p>
                        <a href="blog-post.php?id=1" class="btn btn-primary">Read More →</a>
                    </div>
                </article>

                <!-- Regular Articles -->
                <div class="row">
                    <div class="col-md-6">
                        <article class="card mb-4 shadow-sm h-100">
                            <img src="/api/placeholder/400/200" class="card-img-top" alt="New Breweries in Ohio">
                            <div class="card-body">
                                <div class="small text-muted mb-1">April 28, 2025</div>
                                <h2 class="card-title h5">10 New Breweries Opening in Ohio This Year</h2>
                                <p class="card-text">Ohio's craft beer scene continues to grow with these exciting new breweries planning to open their doors in 2025. From urban taprooms to rural farm breweries, here's what to expect.</p>
                                <a href="blog-post.php?id=2" class="btn btn-sm btn-outline-primary">Read More →</a>
                            </div>
                        </article>
                    </div>
                    <div class="col-md-6">
                        <article class="card mb-4 shadow-sm h-100">
                            <img src="/api/placeholder/400/200" class="card-img-top" alt="Ohio IPAs">
                            <div class="card-body">
                                <div class="small text-muted mb-1">April 21, 2025</div>
                                <h2 class="card-title h5">The Evolution of Ohio IPAs: From West Coast to Hazy and Beyond</h2>
                                <p class="card-text">How Ohio brewers have put their unique stamp on the IPA style, creating distinctive regional variations that beer enthusiasts seek out from across the country.</p>
                                <a href="blog-post.php?id=3" class="btn btn-sm btn-outline-primary">Read More →</a>
                            </div>
                        </article>
                    </div>
                    <div class="col-md-6">
                        <article class="card mb-4 shadow-sm h-100">
                            <img src="/api/placeholder/400/200" class="card-img-top" alt="Brewery Tour Tips">
                            <div class="card-body">
                                <div class="small text-muted mb-1">April 14, 2025</div>
                                <h2 class="card-title h5">Planning the Perfect Brewery Tour: Tips from Ohio Beer Experts</h2>
                                <p class="card-text">Expert advice on creating memorable brewery tours, including transportation options, tasting strategies, and how to discover hidden gems along the way.</p>
                                <a href="blog-post.php?id=4" class="btn btn-sm btn-outline-primary">Read More →</a>
                            </div>
                        </article>
                    </div>
                    <div class="col-md-6">
                        <article class="card mb-4 shadow-sm h-100">
                            <img src="/api/placeholder/400/200" class="card-img-top" alt="Ohio Beer History">
                            <div class="card-body">
                                <div class="small text-muted mb-1">April 7, 2025</div>
                                <h2 class="card-title h5">The Rich History of Ohio Brewing: From German Immigrants to Craft Revolution</h2>
                                <p class="card-text">Explore Ohio's deep brewing roots dating back to the 19th century and how that heritage influences today's thriving craft beer scene.</p>
                                <a href="blog-post.php?id=5" class="btn btn-sm btn-outline-primary">Read More →</a>
                            </div>
                        </article>
                    </div>
                </div>

                <!-- Pagination -->
                <nav aria-label="Pagination">
                    <ul class="pagination justify-content-center my-4">
                        <li class="page-item disabled"><a class="page-link" href="#" tabindex="-1" aria-disabled="true">Newer</a></li>
                        <li class="page-item active" aria-current="page"><a class="page-link" href="#">1</a></li>
                        <li class="page-item"><a class="page-link" href="#">2</a></li>
                        <li class="page-item"><a class="page-link" href="#">3</a></li>
                        <li class="page-item"><a class="page-link" href="#">Older</a></li>
                    </ul>
                </nav>
            </div>

            <!-- Sidebar -->
            <div class="col-lg-4">
                <!-- Search Widget -->
                <div class="card mb-4 shadow-sm">
                    <div class="card-header">Search</div>
                    <div class="card-body">
                        <div class="input-group">
                            <input class="form-control" type="text" placeholder="Search for...">
                            <button class="btn btn-primary" type="button">Go!</button>
                        </div>
                    </div>
                </div>

                <!-- Categories Widget -->
                <div class="card mb-4 shadow-sm">
                    <div class="card-header">Categories</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-sm-6">
                                <ul class="list-unstyled mb-0">
                                    <li><a href="#" class="text-decoration-none">News</a></li>
                                    <li><a href="#" class="text-decoration-none">Events</a></li>
                                    <li><a href="#" class="text-decoration-none">Reviews</a></li>
                                </ul>
                            </div>
                            <div class="col-sm-6">
                                <ul class="list-unstyled mb-0">
                                    <li><a href="#" class="text-decoration-none">Interviews</a></li>
                                    <li><a href="#" class="text-decoration-none">Brewery Spotlights</a></li>
                                    <li><a href="#" class="text-decoration-none">Beer Education</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Upcoming Events Widget -->
                <div class="card mb-4 shadow-sm">
                    <div class="card-header">Upcoming Events</div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">
                                <div class="small text-muted">May 15-16, 2025</div>
                                <a href="#" class="text-decoration-none">Cleveland Craft Beer Festival</a>
                            </li>
                            <li class="list-group-item">
                                <div class="small text-muted">June 5-7, 2025</div>
                                <a href="#" class="text-decoration-none">Columbus Ale Festival</a>
                            </li>
                            <li class="list-group-item">
                                <div class="small text-muted">June 19-20, 2025</div>
                                <a href="#" class="text-decoration-none">Cincinnati Beer Week</a>
                            </li>
                            <li class="list-group-item">
                                <div class="small text-muted">July 11, 2025</div>
                                <a href="#" class="text-decoration-none">Ohio Brewers Guild Summer Gathering</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Newsletter Signup -->
                <div class="card mb-4 shadow-sm">
                    <div class="card-header">Subscribe to Our Newsletter</div>
                    <div class="card-body">
                        <p>Get the latest Ohio beer news and events delivered to your inbox monthly.</p>
                        <div class="input-group">
                            <input class="form-control" type="email" placeholder="Enter your email...">
                            <button class="btn btn-primary" type="button">Subscribe</button>
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

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
</body>
</html>
