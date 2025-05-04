<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once('../config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Map API Debug Test</title>
    <style>
        #map { height: 400px; width: 100%; border: 1px solid #ccc; margin: 20px 0; }
        .debug-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .error { color: #721c24; background: #f8d7da; padding: 10px; border-radius: 4px; }
        .success { color: #155724; background: #d4edda; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Map API Debug Test</h1>
    
    <div class="debug-info">
        <h3>Debug Information:</h3>
        <ul>
            <li>Domain: <?php echo $_SERVER['HTTP_HOST']; ?></li>
            <li>Full URL: <?php echo (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"; ?></li>
            <li>API Key (first 6 chars): <?php echo defined('GOOGLE_MAPS_API_KEY') ? substr(GOOGLE_MAPS_API_KEY, 0, 6) . '...' : 'Not found'; ?></li>
        </ul>
    </div>

    <div id="map"></div>
    <div id="map-status"></div>

    <script>
        // Log any errors that occur during map initialization
        window.onerror = function(msg, url, line) {
            console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + line);
            document.getElementById('map-status').innerHTML += 
                '<div class="error">JavaScript Error: ' + msg + '</div>';
            return false;
        };

        function initMap() {
            console.log('Initializing map...');
            try {
                const map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: 40.4173, lng: -82.9071 },
                    zoom: 7
                });
                console.log('Map initialized successfully');
                document.getElementById('map-status').innerHTML += 
                    '<div class="success">Map initialized successfully!</div>';
            } catch (error) {
                console.error('Map initialization error:', error);
                document.getElementById('map-status').innerHTML += 
                    '<div class="error">Error initializing map: ' + error.message + '</div>';
            }
        }

        // Log when the Google Maps script starts loading
        console.log('Loading Google Maps script...');
    </script>

    <?php
    if (defined('GOOGLE_MAPS_API_KEY')) {
        $apiUrl = 'https://maps.googleapis.com/maps/api/js?key=' . 
            htmlspecialchars(GOOGLE_MAPS_API_KEY) . '&callback=initMap';
        echo "<script>\n";
        echo "console.log('API URL (partially hidden): " . 
            preg_replace('/key=([^&]{6}).*?&/', 'key=\\1...&', $apiUrl) . "');\n";
        echo "</script>\n";
        echo '<script async defer src="' . $apiUrl . '"></script>';
    }
    ?>

    <div class="debug-info">
        <h3>Troubleshooting Steps:</h3>
        <ol>
            <li>Check browser console (F12) for detailed error messages</li>
            <li>Verify API key is enabled for Maps JavaScript API</li>
            <li>Check API key restrictions in Google Cloud Console</li>
            <li>Verify domain is added to allowed referrers</li>
        </ol>
    </div>
</body>
</html>