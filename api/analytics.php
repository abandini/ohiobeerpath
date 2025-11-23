<?php
/**
 * Ohio Beer Path - Analytics API
 * 
 * This file handles receiving and storing analytics data from the client-side
 * analytics module. It processes events, stores them in the database, and
 * provides real-time metrics.
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Include database connection
require_once '../includes/db.php';

// Get the raw POST data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

// Validate data
if (!$data || !isset($data['events']) || !is_array($data['events'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data format']);
    exit;
}

// Process events
$processedCount = 0;
$errors = [];

try {
    // Begin transaction
    $pdo->beginTransaction();
    
    // Prepare statement for inserting events
    $stmt = $pdo->prepare("
        INSERT INTO analytics_events (
            event_type,
            category,
            action,
            label,
            value,
            user_id,
            session_id,
            url,
            referrer,
            user_agent,
            screen_width,
            screen_height,
            viewport_width,
            viewport_height,
            timestamp,
            ip_address,
            additional_data
        ) VALUES (
            :event_type,
            :category,
            :action,
            :label,
            :value,
            :user_id,
            :session_id,
            :url,
            :referrer,
            :user_agent,
            :screen_width,
            :screen_height,
            :viewport_width,
            :viewport_height,
            :timestamp,
            :ip_address,
            :additional_data
        )
    ");
    
    // Get client IP address
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    
    // Process each event
    foreach ($data['events'] as $event) {
        // Skip if missing required fields
        if (!isset($event['type']) || !isset($event['timestamp']) || !isset($event['userId']) || !isset($event['sessionId'])) {
            $errors[] = 'Event missing required fields';
            continue;
        }
        
        // Extract common fields
        $eventType = $event['type'];
        $category = isset($event['category']) ? $event['category'] : null;
        $action = isset($event['action']) ? $event['action'] : null;
        $label = isset($event['label']) ? $event['label'] : null;
        $value = isset($event['value']) ? $event['value'] : null;
        
        // For conversion events, use conversionType as category
        if ($eventType === 'conversion' && isset($event['conversionType'])) {
            $category = $event['conversionType'];
            $action = 'conversion';
        }
        
        // Remove common fields from additional data
        $additionalData = $event;
        unset(
            $additionalData['type'],
            $additionalData['category'],
            $additionalData['action'],
            $additionalData['label'],
            $additionalData['value'],
            $additionalData['userId'],
            $additionalData['sessionId'],
            $additionalData['url'],
            $additionalData['referrer'],
            $additionalData['userAgent'],
            $additionalData['screenWidth'],
            $additionalData['screenHeight'],
            $additionalData['viewportWidth'],
            $additionalData['viewportHeight'],
            $additionalData['timestamp']
        );
        
        // Bind parameters
        $stmt->bindParam(':event_type', $eventType);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':label', $label);
        $stmt->bindParam(':value', $value);
        $stmt->bindParam(':user_id', $event['userId']);
        $stmt->bindParam(':session_id', $event['sessionId']);
        $stmt->bindParam(':url', $event['url']);
        $stmt->bindParam(':referrer', $event['referrer']);
        $stmt->bindParam(':user_agent', $event['userAgent']);
        $stmt->bindParam(':screen_width', $event['screenWidth']);
        $stmt->bindParam(':screen_height', $event['screenHeight']);
        $stmt->bindParam(':viewport_width', $event['viewportWidth']);
        $stmt->bindParam(':viewport_height', $event['viewportHeight']);
        $stmt->bindParam(':timestamp', date('Y-m-d H:i:s', $event['timestamp'] / 1000));
        $stmt->bindParam(':ip_address', $ipAddress);
        $stmt->bindParam(':additional_data', json_encode($additionalData));
        
        // Execute statement
        $stmt->execute();
        $processedCount++;
        
        // Process specific event types
        switch ($eventType) {
            case 'pageview':
                updatePageStats($pdo, $event);
                break;
                
            case 'event':
                if ($category === 'brewery' && $action) {
                    updateBreweryStats($pdo, $event);
                }
                break;
                
            case 'conversion':
                trackConversion($pdo, $event);
                break;
                
            case 'performance':
                storePerformanceData($pdo, $event);
                break;
        }
    }
    
    // Commit transaction
    $pdo->commit();
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'processed' => $processedCount,
        'errors' => $errors
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log error
    error_log('Analytics API error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
}

/**
 * Update page view statistics
 * 
 * @param PDO $pdo Database connection
 * @param array $event Event data
 */
function updatePageStats($pdo, $event) {
    try {
        // Extract URL path without query string
        $url = parse_url($event['url'], PHP_URL_PATH);
        
        // Check if page exists in stats table
        $stmt = $pdo->prepare("
            SELECT id FROM page_stats 
            WHERE page_url = :url
        ");
        $stmt->bindParam(':url', $url);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            // Update existing page stats
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $pageId = $row['id'];
            
            $updateStmt = $pdo->prepare("
                UPDATE page_stats SET
                    view_count = view_count + 1,
                    last_viewed = NOW()
                WHERE id = :id
            ");
            $updateStmt->bindParam(':id', $pageId);
            $updateStmt->execute();
        } else {
            // Insert new page stats
            $insertStmt = $pdo->prepare("
                INSERT INTO page_stats (
                    page_url,
                    page_title,
                    view_count,
                    first_viewed,
                    last_viewed
                ) VALUES (
                    :url,
                    :title,
                    1,
                    NOW(),
                    NOW()
                )
            ");
            $insertStmt->bindParam(':url', $url);
            $insertStmt->bindParam(':title', $event['title']);
            $insertStmt->execute();
        }
    } catch (PDOException $e) {
        // Log error but don't fail the whole request
        error_log('Error updating page stats: ' . $e->getMessage());
    }
}

/**
 * Update brewery statistics
 * 
 * @param PDO $pdo Database connection
 * @param array $event Event data
 */
function updateBreweryStats($pdo, $event) {
    try {
        // Only process if breweryId is present
        if (!isset($event['breweryId'])) {
            return;
        }
        
        $breweryId = $event['breweryId'];
        $action = $event['action'];
        
        // Check if brewery exists in stats table
        $stmt = $pdo->prepare("
            SELECT id FROM brewery_stats 
            WHERE brewery_id = :brewery_id
        ");
        $stmt->bindParam(':brewery_id', $breweryId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            // Update existing brewery stats
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $statsId = $row['id'];
            
            // Determine which counter to increment
            $counterField = 'view_count'; // Default
            switch ($action) {
                case 'view':
                    $counterField = 'view_count';
                    break;
                case 'save':
                    $counterField = 'save_count';
                    break;
                case 'directions':
                    $counterField = 'directions_count';
                    break;
                case 'website':
                    $counterField = 'website_clicks';
                    break;
                case 'phone':
                    $counterField = 'phone_clicks';
                    break;
                case 'share':
                    $counterField = 'share_count';
                    break;
            }
            
            $updateStmt = $pdo->prepare("
                UPDATE brewery_stats SET
                    $counterField = $counterField + 1,
                    last_interaction = NOW()
                WHERE id = :id
            ");
            $updateStmt->bindParam(':id', $statsId);
            $updateStmt->execute();
        } else {
            // Initialize counters
            $viewCount = $action === 'view' ? 1 : 0;
            $saveCount = $action === 'save' ? 1 : 0;
            $directionsCount = $action === 'directions' ? 1 : 0;
            $websiteClicks = $action === 'website' ? 1 : 0;
            $phoneClicks = $action === 'phone' ? 1 : 0;
            $shareCount = $action === 'share' ? 1 : 0;
            
            // Insert new brewery stats
            $insertStmt = $pdo->prepare("
                INSERT INTO brewery_stats (
                    brewery_id,
                    view_count,
                    save_count,
                    directions_count,
                    website_clicks,
                    phone_clicks,
                    share_count,
                    first_interaction,
                    last_interaction
                ) VALUES (
                    :brewery_id,
                    :view_count,
                    :save_count,
                    :directions_count,
                    :website_clicks,
                    :phone_clicks,
                    :share_count,
                    NOW(),
                    NOW()
                )
            ");
            $insertStmt->bindParam(':brewery_id', $breweryId);
            $insertStmt->bindParam(':view_count', $viewCount);
            $insertStmt->bindParam(':save_count', $saveCount);
            $insertStmt->bindParam(':directions_count', $directionsCount);
            $insertStmt->bindParam(':website_clicks', $websiteClicks);
            $insertStmt->bindParam(':phone_clicks', $phoneClicks);
            $insertStmt->bindParam(':share_count', $shareCount);
            $insertStmt->execute();
        }
    } catch (PDOException $e) {
        // Log error but don't fail the whole request
        error_log('Error updating brewery stats: ' . $e->getMessage());
    }
}

/**
 * Track conversion events
 * 
 * @param PDO $pdo Database connection
 * @param array $event Event data
 */
function trackConversion($pdo, $event) {
    try {
        // Extract conversion type
        $conversionType = isset($event['conversionType']) ? $event['conversionType'] : 'unknown';
        
        // Insert conversion record
        $stmt = $pdo->prepare("
            INSERT INTO conversions (
                conversion_type,
                user_id,
                session_id,
                url,
                referrer,
                timestamp,
                additional_data
            ) VALUES (
                :conversion_type,
                :user_id,
                :session_id,
                :url,
                :referrer,
                :timestamp,
                :additional_data
            )
        ");
        
        // Remove common fields from additional data
        $additionalData = $event;
        unset(
            $additionalData['type'],
            $additionalData['conversionType'],
            $additionalData['userId'],
            $additionalData['sessionId'],
            $additionalData['url'],
            $additionalData['referrer'],
            $additionalData['timestamp']
        );
        
        $stmt->bindParam(':conversion_type', $conversionType);
        $stmt->bindParam(':user_id', $event['userId']);
        $stmt->bindParam(':session_id', $event['sessionId']);
        $stmt->bindParam(':url', $event['url']);
        $stmt->bindParam(':referrer', $event['referrer']);
        $stmt->bindParam(':timestamp', date('Y-m-d H:i:s', $event['timestamp'] / 1000));
        $stmt->bindParam(':additional_data', json_encode($additionalData));
        
        $stmt->execute();
    } catch (PDOException $e) {
        // Log error but don't fail the whole request
        error_log('Error tracking conversion: ' . $e->getMessage());
    }
}

/**
 * Store performance data
 * 
 * @param PDO $pdo Database connection
 * @param array $event Event data
 */
function storePerformanceData($pdo, $event) {
    try {
        // Only process if metrics are present
        if (!isset($event['metrics'])) {
            return;
        }
        
        $metrics = $event['metrics'];
        
        // Insert performance record
        $stmt = $pdo->prepare("
            INSERT INTO performance_metrics (
                page_url,
                user_id,
                session_id,
                dns_time,
                connect_time,
                ttfb,
                dom_load,
                page_load,
                total_time,
                resource_count,
                resource_size,
                timestamp,
                user_agent,
                additional_data
            ) VALUES (
                :page_url,
                :user_id,
                :session_id,
                :dns_time,
                :connect_time,
                :ttfb,
                :dom_load,
                :page_load,
                :total_time,
                :resource_count,
                :resource_size,
                :timestamp,
                :user_agent,
                :additional_data
            )
        ");
        
        // Extract resource data
        $resourceCount = 0;
        $resourceSize = 0;
        
        if (isset($event['resources'])) {
            $resourceCount = $event['resources']['count'];
            $resourceSize = $event['resources']['totalSize'];
        }
        
        $stmt->bindParam(':page_url', $event['page']);
        $stmt->bindParam(':user_id', $event['userId']);
        $stmt->bindParam(':session_id', $event['sessionId']);
        $stmt->bindParam(':dns_time', $metrics['dnsTime']);
        $stmt->bindParam(':connect_time', $metrics['connectTime']);
        $stmt->bindParam(':ttfb', $metrics['ttfb']);
        $stmt->bindParam(':dom_load', $metrics['domLoad']);
        $stmt->bindParam(':page_load', $metrics['pageLoad']);
        $stmt->bindParam(':total_time', $metrics['totalTime']);
        $stmt->bindParam(':resource_count', $resourceCount);
        $stmt->bindParam(':resource_size', $resourceSize);
        $stmt->bindParam(':timestamp', date('Y-m-d H:i:s', $event['timestamp'] / 1000));
        $stmt->bindParam(':user_agent', $event['userAgent']);
        $stmt->bindParam(':additional_data', json_encode($event['resources'] ?? []));
        
        $stmt->execute();
    } catch (PDOException $e) {
        // Log error but don't fail the whole request
        error_log('Error storing performance data: ' . $e->getMessage());
    }
}
