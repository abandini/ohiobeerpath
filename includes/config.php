<?php
/**
 * Main configuration file for Ohio Beer Path
 * This file should be included from the public config.php
 */

// API Keys - MUST be set via environment variables
// Set GOOGLE_MAPS_API_KEY in your environment before running the application
define('GOOGLE_MAPS_API_KEY', getenv('GOOGLE_MAPS_API_KEY'));

// Database configuration - MUST be set via environment variables
// Required environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASS
define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));

// Site configuration
define('SITE_URL', getenv('SITE_URL') ?: 'https://ohiobeerpath.com');
define('DEFAULT_REGION', 'central');

// Cache settings
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 3600); // 1 hour in seconds
