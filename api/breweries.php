<?php
/**
 * Breweries API Endpoint
 * 
 * Provides JSON data for breweries with optional filtering
 */

// Include configuration and database
require_once('../config.php');
require_once('../includes/db.php');

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get query parameters for filtering
$filters = [];

if (!empty($_GET['region'])) {
    $filters['region'] = $_GET['region'];
}

if (!empty($_GET['city'])) {
    $filters['city'] = $_GET['city'];
}

if (!empty($_GET['type'])) {
    $filters['type'] = $_GET['type'];
}

if (!empty($_GET['search'])) {
    $filters['search'] = $_GET['search'];
}

// Get a single brewery by ID
if (!empty($_GET['id'])) {
    $brewery = get_brewery((int)$_GET['id']);
    
    if ($brewery) {
        echo json_encode($brewery);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Brewery not found']);
    }
    exit;
}

// Get all breweries with optional filters
$breweries = get_breweries($filters);

// Return JSON response
echo json_encode($breweries);
