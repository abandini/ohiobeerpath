<?php
/**
 * Shared navigation component for Ohio Beer Path
 * 
 * @param string $active_page The current active page
 */

// Default active page if not specified
$active_page = isset($active_page) ? $active_page : '';
?>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top" role="navigation" aria-label="Main Navigation">
    <div class="container">
        <a class="navbar-brand" href="index.php">Ohio Beer Path</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link <?php echo ($active_page === 'home') ? 'active' : ''; ?>" href="index.php">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($active_page === 'nearby') ? 'active' : ''; ?>" href="nearby.php">Find Nearby</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($active_page === 'breweries') ? 'active' : ''; ?>" href="breweries.php">All Breweries</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($active_page === 'regions') ? 'active' : ''; ?>" href="regions.php">Regions</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($active_page === 'itinerary') ? 'active' : ''; ?>" href="itinerary.php">Itinerary</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($active_page === 'blog') ? 'active' : ''; ?>" href="blog.php">Beer Blog</a>
                </li>
            </ul>
        </div>
    </div>
</nav>
