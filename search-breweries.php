<?php
require_once('config.php');
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

function getLocationCoordinates($location) {
    $geocodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" . urlencode($location) . ",OH&key=" . GOOGLE_MAPS_API_KEY;
    $response = file_get_contents($geocodeUrl);
    $data = json_decode($response, true);
    
    if ($data['status'] === 'OK') {
        return $data['results'][0]['geometry']['location'];
    }
    return null;
}

function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 3959;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return $R * $c;
}

try {
    $location = $_GET['location'] ?? '';
    $radius = intval($_GET['radius'] ?? 25);
    
    if (empty($location)) {
        throw new Exception('Location is required');
    }

    $coordinates = getLocationCoordinates($location);
    if (!$coordinates) {
        throw new Exception('Could not geocode location');
    }

    // Read breweries from JSON file
    $jsonPath = __DIR__ . '/assets/data/breweries.json';
    
    if (!file_exists($jsonPath)) {
        throw new Exception('Breweries data file not found: ' . $jsonPath);
    }

    $breweriesJson = file_get_contents($jsonPath);
    if ($breweriesJson === false) {
        throw new Exception('Failed to read breweries data');
    }

    $allBreweries = json_decode($breweriesJson, true);
    if ($allBreweries === null) {
        throw new Exception('Invalid JSON data in breweries file');
    }

    $nearbyBreweries = [];
    foreach ($allBreweries as $brewery) {
        if (!isset($brewery['latitude']) || !isset($brewery['longitude'])) {
            continue;
        }
        
        $distance = calculateDistance(
            $coordinates['lat'],
            $coordinates['lng'],
            floatval($brewery['latitude']),
            floatval($brewery['longitude'])
        );
        
        if ($distance <= $radius) {
            $brewery['distance'] = $distance;
            $nearbyBreweries[] = $brewery;
        }
    }

    usort($nearbyBreweries, function($a, $b) {
        return $a['distance'] <=> $b['distance'];
    });

    echo json_encode(['status' => 'success', 'data' => $nearbyBreweries]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}