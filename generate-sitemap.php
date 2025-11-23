<?php
/**
 * Sitemap Generator for Ohio Beer Path
 * 
 * This script generates a sitemap.xml file for the website.
 * It includes:
 * - Static pages
 * - Brewery pages
 * - Region pages
 * - Event pages
 * 
 * Usage: Run this script from the command line or browser to generate the sitemap.
 */

// Include database connection
require_once 'includes/db.php';

// Set content type to XML if viewed in browser
header('Content-Type: text/xml');

// Start XML
echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

// Get base URL
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'ohiobeerpath.com';
$baseUrl = $protocol . '://' . $host;

// Static pages with their change frequency and priority
$staticPages = [
    ['url' => '', 'changefreq' => 'daily', 'priority' => '1.0', 'lastmod' => date('Y-m-d')],
    ['url' => 'breweries.php', 'changefreq' => 'daily', 'priority' => '0.9', 'lastmod' => date('Y-m-d')],
    ['url' => 'regions.php', 'changefreq' => 'weekly', 'priority' => '0.8', 'lastmod' => date('Y-m-d')],
    ['url' => 'events.php', 'changefreq' => 'daily', 'priority' => '0.8', 'lastmod' => date('Y-m-d')],
    ['url' => 'beer-styles.php', 'changefreq' => 'monthly', 'priority' => '0.7', 'lastmod' => date('Y-m-d')],
    ['url' => 'itinerary.php', 'changefreq' => 'weekly', 'priority' => '0.8', 'lastmod' => date('Y-m-d')],
    ['url' => 'about.php', 'changefreq' => 'monthly', 'priority' => '0.6', 'lastmod' => date('Y-m-d')],
    ['url' => 'contact.php', 'changefreq' => 'monthly', 'priority' => '0.6', 'lastmod' => date('Y-m-d')],
    ['url' => 'privacy-policy.php', 'changefreq' => 'yearly', 'priority' => '0.3', 'lastmod' => date('Y-m-d')],
    ['url' => 'terms-of-service.php', 'changefreq' => 'yearly', 'priority' => '0.3', 'lastmod' => date('Y-m-d')]
];

// Add static pages to sitemap
foreach ($staticPages as $page) {
    echo "\t<url>\n";
    echo "\t\t<loc>" . $baseUrl . '/' . $page['url'] . "</loc>\n";
    echo "\t\t<lastmod>" . $page['lastmod'] . "</lastmod>\n";
    echo "\t\t<changefreq>" . $page['changefreq'] . "</changefreq>\n";
    echo "\t\t<priority>" . $page['priority'] . "</priority>\n";
    echo "\t</url>\n";
}

// Try to connect to database
try {
    // Get breweries from database
    $breweriesQuery = "SELECT id, name, updated_at FROM breweries";
    $breweriesStmt = $pdo->prepare($breweriesQuery);
    $breweriesStmt->execute();
    
    // Add brewery pages to sitemap
    while ($brewery = $breweriesStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "\t<url>\n";
        echo "\t\t<loc>" . $baseUrl . '/brewery.php?id=' . $brewery['id'] . "</loc>\n";
        
        // Use updated_at date if available, otherwise use today
        $lastmod = isset($brewery['updated_at']) ? date('Y-m-d', strtotime($brewery['updated_at'])) : date('Y-m-d');
        echo "\t\t<lastmod>" . $lastmod . "</lastmod>\n";
        
        echo "\t\t<changefreq>weekly</changefreq>\n";
        echo "\t\t<priority>0.7</priority>\n";
        echo "\t</url>\n";
    }
    
    // Get regions from database
    $regionsQuery = "SELECT id, name FROM regions";
    $regionsStmt = $pdo->prepare($regionsQuery);
    $regionsStmt->execute();
    
    // Add region pages to sitemap
    while ($region = $regionsStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "\t<url>\n";
        echo "\t\t<loc>" . $baseUrl . '/region.php?id=' . $region['id'] . "</loc>\n";
        echo "\t\t<lastmod>" . date('Y-m-d') . "</lastmod>\n";
        echo "\t\t<changefreq>weekly</changefreq>\n";
        echo "\t\t<priority>0.6</priority>\n";
        echo "\t</url>\n";
    }
    
    // Get events from database
    $eventsQuery = "SELECT id, name, event_date, updated_at FROM events WHERE event_date >= CURDATE() ORDER BY event_date";
    $eventsStmt = $pdo->prepare($eventsQuery);
    $eventsStmt->execute();
    
    // Add event pages to sitemap
    while ($event = $eventsStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "\t<url>\n";
        echo "\t\t<loc>" . $baseUrl . '/event.php?id=' . $event['id'] . "</loc>\n";
        
        // Use updated_at date if available, otherwise use today
        $lastmod = isset($event['updated_at']) ? date('Y-m-d', strtotime($event['updated_at'])) : date('Y-m-d');
        echo "\t\t<lastmod>" . $lastmod . "</lastmod>\n";
        
        echo "\t\t<changefreq>daily</changefreq>\n";
        echo "\t\t<priority>0.8</priority>\n";
        echo "\t</url>\n";
    }
    
    // Get beer styles from database if the table exists
    try {
        $beerStylesQuery = "SELECT id, name FROM beer_styles";
        $beerStylesStmt = $pdo->prepare($beerStylesQuery);
        $beerStylesStmt->execute();
        
        // Add beer style pages to sitemap
        while ($style = $beerStylesStmt->fetch(PDO::FETCH_ASSOC)) {
            echo "\t<url>\n";
            echo "\t\t<loc>" . $baseUrl . '/beer-style.php?id=' . $style['id'] . "</loc>\n";
            echo "\t\t<lastmod>" . date('Y-m-d') . "</lastmod>\n";
            echo "\t\t<changefreq>monthly</changefreq>\n";
            echo "\t\t<priority>0.5</priority>\n";
            echo "\t</url>\n";
        }
    } catch (PDOException $e) {
        // Beer styles table might not exist yet, so we'll just skip it
    }
    
} catch (PDOException $e) {
    // If database connection fails, we'll just include static pages
    error_log('Database error in sitemap generation: ' . $e->getMessage());
}

// End XML
echo '</urlset>';

// Save to file if run from command line
if (php_sapi_name() === 'cli') {
    $content = ob_get_contents();
    file_put_contents('sitemap.xml', $content);
    echo "Sitemap generated successfully.\n";
}
