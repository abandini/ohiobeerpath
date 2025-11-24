<?php
/**
 * Export MySQL data to JSON for D1 import
 * This script connects to the existing MySQL database and exports all brewery data
 */

require_once __DIR__ . '/../includes/config.php';

// Create database connection
function getDBConnection() {
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
        return $conn;
    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage() . "\n");
    }
}

$pdo = getDBConnection();

// Export breweries
echo "Exporting breweries from MySQL...\n";
$stmt = $pdo->query("SELECT * FROM breweries ORDER BY id");
$breweries = $stmt->fetchAll();

echo "Found " . count($breweries) . " breweries\n";

// Process each brewery to format data properly
foreach ($breweries as &$brewery) {
    // If amenities/features exist, ensure they're in the right format
    // In the MySQL schema, features are in a junction table, so we need to fetch them separately
    if (isset($brewery['id'])) {
        $featureStmt = $pdo->prepare("
            SELECT f.name
            FROM brewery_features bf
            JOIN features f ON bf.feature_id = f.id
            WHERE bf.brewery_id = ?
        ");
        $featureStmt->execute([$brewery['id']]);
        $features = $featureStmt->fetchAll(PDO::FETCH_COLUMN);

        // Store as JSON array string for D1
        $brewery['amenities'] = json_encode($features);

        // Get hours
        $hoursStmt = $pdo->prepare("
            SELECT day, hours
            FROM brewery_hours
            WHERE brewery_id = ?
        ");
        $hoursStmt->execute([$brewery['id']]);
        $hoursData = $hoursStmt->fetchAll();

        $hours = [];
        foreach ($hoursData as $hour) {
            $hours[$hour['day']] = $hour['hours'];
        }

        // Store as JSON object string for D1
        $brewery['hours'] = json_encode($hours);
    }
}

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Write to JSON file
$outputFile = $dataDir . '/breweries-export.json';
$result = file_put_contents(
    $outputFile,
    json_encode($breweries, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

if ($result === false) {
    die("Failed to write to $outputFile\n");
}

echo "✅ Exported " . count($breweries) . " breweries to data/breweries-export.json\n";
echo "File size: " . number_format(filesize($outputFile) / 1024, 2) . " KB\n";
