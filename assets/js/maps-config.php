<?php
require_once('../../config.php');
header('Content-Type: application/javascript');
?>

// Google Maps configuration and initialization
const GOOGLE_MAPS_API_KEY = '<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>';

// Optional: Add any other map-related configuration here
const mapStyles = {
    // Custom map styles can go here
};