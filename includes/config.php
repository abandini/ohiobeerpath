<?php
/**
 * Main configuration file for Ohio Beer Path
 * This file should be included from the public config.php
 */

// Load environment variables from .env file
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Existing config with fallbacks to environment variables
define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'ohiobrewpath');
define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '');
define('GOOGLE_MAPS_API_KEY', $_ENV['GOOGLE_MAPS_API_KEY'] ?? getenv('GOOGLE_MAPS_API_KEY') ?: 'AIzaSyBr7c_NnuwqNW3-dMPCNJAVTpKBQ2RULqI');
define('SITE_URL', $_ENV['SITE_URL'] ?? getenv('SITE_URL') ?: 'https://ohiobeerpath.com');
define('DEFAULT_REGION', $_ENV['DEFAULT_REGION'] ?? getenv('DEFAULT_REGION') ?: 'central');
define('CACHE_ENABLED', filter_var($_ENV['CACHE_ENABLED'] ?? getenv('CACHE_ENABLED') ?: 'true', FILTER_VALIDATE_BOOLEAN));
define('CACHE_DURATION', (int)($_ENV['CACHE_DURATION'] ?? getenv('CACHE_DURATION') ?: 3600));
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production');
define('DEBUG', filter_var($_ENV['DEBUG'] ?? getenv('DEBUG') ?: 'false', FILTER_VALIDATE_BOOLEAN));
