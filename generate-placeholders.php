<?php
/**
 * Generate placeholder images for breweries
 */

// Include configuration and image utilities
require_once('config.php');
require_once('includes/image-utils.php');

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Ohio Beer Path - Generate Placeholder Images</h1>";

// Check if GD library is available
if (!extension_loaded('gd')) {
    echo "<p class='error'>❌ GD library is not available. Please install the PHP GD extension.</p>";
    exit;
}

// Create placeholder images
echo "<h2>Creating Placeholder Images</h2>";
if (create_placeholder_images()) {
    echo "<p class='success'>✅ Placeholder images created successfully</p>";
} else {
    echo "<p class='error'>❌ Error creating placeholder images</p>";
}

// Add some basic styling
echo "
<style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 30px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    p { line-height: 1.5; }
</style>
";

echo "<p><a href='index.php'>Return to homepage</a></p>";
?>
