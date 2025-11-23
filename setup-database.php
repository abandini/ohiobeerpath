<?php
/**
 * Database Setup Script
 * 
 * This script creates the necessary database tables and imports brewery data from JSON
 */

// Include configuration and database
require_once('config.php');
require_once('includes/db.php');

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Ohio Beer Path - Database Setup</h1>";

// Step 1: Create database tables
echo "<h2>Step 1: Creating Database Tables</h2>";
if (create_database_tables()) {
    echo "<p class='success'>✅ Database tables created successfully</p>";
} else {
    echo "<p class='error'>❌ Error creating database tables</p>";
    echo "<p>Check your database configuration in config.php and ensure MySQL is running.</p>";
    exit;
}

// Step 2: Import brewery data from JSON
echo "<h2>Step 2: Importing Brewery Data</h2>";
if (import_breweries_from_json()) {
    echo "<p class='success'>✅ Brewery data imported successfully</p>";
} else {
    echo "<p class='error'>❌ Error importing brewery data</p>";
    echo "<p>Make sure breweries.json exists and is valid.</p>";
}

// Step 3: Verify data
echo "<h2>Step 3: Verifying Data</h2>";
$breweries = get_breweries();
if (!empty($breweries)) {
    echo "<p class='success'>✅ Successfully retrieved " . count($breweries) . " breweries from database</p>";
} else {
    echo "<p class='error'>❌ No breweries found in database</p>";
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
