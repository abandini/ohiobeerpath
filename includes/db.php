<?php
/**
 * Database connection and helper functions
 */

// Initialize database connection
function db_connect() {
    static $conn;
    
    if (!isset($conn)) {
        try {
            $conn = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log('Database connection error: ' . $e->getMessage());
            return false;
        }
    }
    
    return $conn;
}

/**
 * Get all breweries from the database
 * 
 * @param array $filters Optional filters
 * @return array Array of brewery data
 */
function get_breweries($filters = []) {
    $db = db_connect();
    if (!$db) {
        return get_breweries_from_json(); // Fallback to JSON if DB fails
    }
    
    try {
        $sql = "SELECT * FROM breweries";
        $where = [];
        $params = [];
        
        // Apply filters if provided
        if (!empty($filters['region'])) {
            $where[] = "region = :region";
            $params[':region'] = $filters['region'];
        }
        
        if (!empty($filters['city'])) {
            $where[] = "city = :city";
            $params[':city'] = $filters['city'];
        }
        
        if (!empty($filters['type'])) {
            $where[] = "brewery_type = :type";
            $params[':type'] = $filters['type'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE :search OR city LIKE :search OR description LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }
        
        // Add WHERE clause if filters exist
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        
        // Add ordering
        $sql .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('Database query error: ' . $e->getMessage());
        return get_breweries_from_json(); // Fallback to JSON if query fails
    }
}

/**
 * Get a single brewery by ID
 * 
 * @param int $id Brewery ID
 * @return array|false Brewery data or false if not found
 */
function get_brewery($id) {
    $db = db_connect();
    if (!$db) {
        return false;
    }
    
    try {
        $stmt = $db->prepare("SELECT * FROM breweries WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        
        $brewery = $stmt->fetch();
        if ($brewery) {
            // Get features for this brewery
            $stmt = $db->prepare("
                SELECT f.name 
                FROM brewery_features bf
                JOIN features f ON bf.feature_id = f.id
                WHERE bf.brewery_id = :brewery_id
            ");
            $stmt->execute([':brewery_id' => $id]);
            $brewery['features'] = array_column($stmt->fetchAll(), 'name');
            
            // Get hours for this brewery
            $stmt = $db->prepare("SELECT day, hours FROM brewery_hours WHERE brewery_id = :brewery_id");
            $stmt->execute([':brewery_id' => $id]);
            $hours = $stmt->fetchAll();
            
            $brewery['hours'] = [];
            foreach ($hours as $hour) {
                $brewery['hours'][$hour['day']] = $hour['hours'];
            }
        }
        
        return $brewery;
    } catch (PDOException $e) {
        error_log('Database query error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Fallback function to get breweries from JSON file
 * 
 * @return array Array of brewery data
 */
function get_breweries_from_json() {
    // Standardized to use only breweries.json at project root
    $json_file = __DIR__ . '/../breweries.json';
    
    if (file_exists($json_file)) {
        $json = file_get_contents($json_file);
        $data = json_decode($json, true);
        if (is_array($data)) {
            // Normalize: ensure both 'features' and 'amenities' fields exist for each brewery
            foreach ($data as &$brewery) {
                if (!isset($brewery['features']) && isset($brewery['amenities'])) {
                    $brewery['features'] = $brewery['amenities'];
                }
                if (!isset($brewery['amenities']) && isset($brewery['features'])) {
                    $brewery['amenities'] = $brewery['features'];
                }
            }
            return $data;
        } else {
            error_log('Malformed breweries.json: unable to decode JSON');
        }
    } else {
        error_log('Missing breweries.json: ' . $json_file);
    }
    return [];
}

/**
 * Create SQL tables for the database if they don't exist
 * This is used for initial setup
 */
function create_database_tables() {
    $db = db_connect();
    if (!$db) {
        return false;
    }
    
    try {
        // Create breweries table
        $db->exec("
            CREATE TABLE IF NOT EXISTS breweries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                brewery_type VARCHAR(50),
                street VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(50),
                postal_code VARCHAR(20),
                country VARCHAR(50),
                phone VARCHAR(20),
                website_url VARCHAR(255),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                region VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        
        // Create features table
        $db->exec("
            CREATE TABLE IF NOT EXISTS features (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                UNIQUE KEY (name)
            )
        ");
        
        // Create brewery_features junction table
        $db->exec("
            CREATE TABLE IF NOT EXISTS brewery_features (
                brewery_id INT NOT NULL,
                feature_id INT NOT NULL,
                PRIMARY KEY (brewery_id, feature_id),
                FOREIGN KEY (brewery_id) REFERENCES breweries(id) ON DELETE CASCADE,
                FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
            )
        ");
        
        // Create hours table
        $db->exec("
            CREATE TABLE IF NOT EXISTS brewery_hours (
                id INT AUTO_INCREMENT PRIMARY KEY,
                brewery_id INT NOT NULL,
                day VARCHAR(20) NOT NULL,
                hours VARCHAR(50),
                FOREIGN KEY (brewery_id) REFERENCES breweries(id) ON DELETE CASCADE
            )
        ");
        
        return true;
    } catch (PDOException $e) {
        error_log('Database setup error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Import brewery data from JSON to database
 * 
 * @return boolean Success status
 */
function import_breweries_from_json() {
    $breweries = get_breweries_from_json();
    if (empty($breweries)) {
        return false;
    }
    
    $db = db_connect();
    if (!$db) {
        return false;
    }
    
    try {
        $db->beginTransaction();
        
        // Prepare statements
        $brewery_stmt = $db->prepare("
            INSERT INTO breweries (
                name, brewery_type, street, city, state, postal_code, 
                country, phone, website_url, latitude, longitude, 
                region, description
            ) VALUES (
                :name, :brewery_type, :street, :city, :state, :postal_code,
                :country, :phone, :website_url, :latitude, :longitude,
                :region, :description
            )
        ");
        
        $feature_stmt = $db->prepare("
            INSERT IGNORE INTO features (name) VALUES (:name)
        ");
        
        $get_feature_stmt = $db->prepare("
            SELECT id FROM features WHERE name = :name
        ");
        
        $brewery_feature_stmt = $db->prepare("
            INSERT INTO brewery_features (brewery_id, feature_id) VALUES (:brewery_id, :feature_id)
        ");
        
        $hours_stmt = $db->prepare("
            INSERT INTO brewery_hours (brewery_id, day, hours) VALUES (:brewery_id, :day, :hours)
        ");
        
        foreach ($breweries as $brewery) {
            // Insert brewery
            $brewery_stmt->execute([
                ':name' => $brewery['name'] ?? '',
                ':brewery_type' => $brewery['brewery_type'] ?? '',
                ':street' => $brewery['street'] ?? '',
                ':city' => $brewery['city'] ?? '',
                ':state' => $brewery['state'] ?? '',
                ':postal_code' => $brewery['postal_code'] ?? '',
                ':country' => $brewery['country'] ?? 'United States',
                ':phone' => $brewery['phone'] ?? '',
                ':website_url' => $brewery['website_url'] ?? '',
                ':latitude' => $brewery['latitude'] ?? null,
                ':longitude' => $brewery['longitude'] ?? null,
                ':region' => $brewery['region'] ?? '',
                ':description' => $brewery['description'] ?? ''
            ]);
            
            $brewery_id = $db->lastInsertId();
            
            // Insert features
            if (!empty($brewery['features'])) {
                foreach ($brewery['features'] as $feature) {
                    // Add feature if it doesn't exist
                    $feature_stmt->execute([':name' => $feature]);
                    
                    // Get feature ID
                    $get_feature_stmt->execute([':name' => $feature]);
                    $feature_id = $get_feature_stmt->fetchColumn();
                    
                    // Link feature to brewery
                    $brewery_feature_stmt->execute([
                        ':brewery_id' => $brewery_id,
                        ':feature_id' => $feature_id
                    ]);
                }
            }
            
            // Insert hours
            if (!empty($brewery['hours']) && is_array($brewery['hours'])) {
                foreach ($brewery['hours'] as $day => $hours) {
                    $hours_stmt->execute([
                        ':brewery_id' => $brewery_id,
                        ':day' => $day,
                        ':hours' => $hours
                    ]);
                }
            }
        }
        
        $db->commit();
        return true;
    } catch (PDOException $e) {
        $db->rollBack();
        error_log('Database import error: ' . $e->getMessage());
        return false;
    }
}
