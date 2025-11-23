<?php
/**
 * Search API Endpoint
 * 
 * Provides server-side search functionality for breweries
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

// Get search query
$query = $_GET['q'] ?? '';
$type = $_GET['type'] ?? 'all'; // all, brewery, city, region
$limit = (int)($_GET['limit'] ?? 10);

// Validate limit
if ($limit < 1 || $limit > 50) {
    $limit = 10;
}

// Return empty results if query is too short
if (strlen($query) < 2) {
    echo json_encode([
        'query' => $query,
        'results' => []
    ]);
    exit;
}

// Connect to database
$db = db_connect();

if (!$db) {
    // Fallback to JSON search if database connection fails
    $results = search_breweries_json($query, $type, $limit);
    echo json_encode([
        'query' => $query,
        'results' => $results,
        'source' => 'json'
    ]);
    exit;
}

try {
    // Build query based on search type
    $sql_parts = [];
    $params = [];
    
    switch ($type) {
        case 'brewery':
            $sql_parts[] = "name LIKE :query";
            $params[':query'] = "%$query%";
            break;
            
        case 'city':
            $sql_parts[] = "city LIKE :query";
            $params[':query'] = "%$query%";
            break;
            
        case 'region':
            $sql_parts[] = "region LIKE :query";
            $params[':query'] = "%$query%";
            break;
            
        default: // 'all'
            $sql_parts[] = "name LIKE :query1 OR city LIKE :query2 OR region LIKE :query3 OR description LIKE :query4";
            $params[':query1'] = "%$query%";
            $params[':query2'] = "%$query%";
            $params[':query3'] = "%$query%";
            $params[':query4'] = "%$query%";
            break;
    }
    
    // Build the complete SQL query
    $sql = "SELECT id, name, city, state, region, brewery_type, latitude, longitude FROM breweries";
    
    if (!empty($sql_parts)) {
        $sql .= " WHERE " . implode(" AND ", $sql_parts);
    }
    
    // Add ordering and limit
    $sql .= " ORDER BY name ASC LIMIT :limit";
    $params[':limit'] = $limit;
    
    // Prepare and execute the query
    $stmt = $db->prepare($sql);
    
    // Bind parameters
    foreach ($params as $key => $value) {
        if ($key === ':limit') {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
    }
    
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return search results
    echo json_encode([
        'query' => $query,
        'results' => $results,
        'source' => 'database'
    ]);
    
} catch (PDOException $e) {
    // Log error and fallback to JSON search
    error_log('Database search error: ' . $e->getMessage());
    
    $results = search_breweries_json($query, $type, $limit);
    echo json_encode([
        'query' => $query,
        'results' => $results,
        'source' => 'json',
        'error' => 'Database search failed, using JSON fallback'
    ]);
}

/**
 * Search breweries in JSON file
 * 
 * @param string $query Search query
 * @param string $type Search type (all, brewery, city, region)
 * @param int $limit Result limit
 * @return array Search results
 */
function search_breweries_json($query, $type, $limit) {
    // Get breweries from JSON
    $breweries = get_breweries_from_json();
    
    // Filter breweries based on search query
    $results = array_filter($breweries, function($brewery) use ($query, $type) {
        $query = strtolower($query);
        
        switch ($type) {
            case 'brewery':
                return strpos(strtolower($brewery['name'] ?? ''), $query) !== false;
                
            case 'city':
                return strpos(strtolower($brewery['city'] ?? ''), $query) !== false;
                
            case 'region':
                return strpos(strtolower($brewery['region'] ?? ''), $query) !== false;
                
            default: // 'all'
                return 
                    strpos(strtolower($brewery['name'] ?? ''), $query) !== false ||
                    strpos(strtolower($brewery['city'] ?? ''), $query) !== false ||
                    strpos(strtolower($brewery['region'] ?? ''), $query) !== false ||
                    strpos(strtolower($brewery['description'] ?? ''), $query) !== false;
        }
    });
    
    // Limit results
    $results = array_slice($results, 0, $limit);
    
    // Map results to consistent format
    return array_map(function($brewery) {
        return [
            'id' => $brewery['id'] ?? null,
            'name' => $brewery['name'] ?? '',
            'city' => $brewery['city'] ?? '',
            'state' => $brewery['state'] ?? '',
            'region' => $brewery['region'] ?? '',
            'brewery_type' => $brewery['brewery_type'] ?? '',
            'latitude' => $brewery['latitude'] ?? null,
            'longitude' => $brewery['longitude'] ?? null
        ];
    }, $results);
}
