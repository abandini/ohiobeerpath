<?php
/**
 * Main configuration file for Ohio Beer Path
 * This file should be included from the public config.php
 */

// API Keys - These should be stored in environment variables in production
define('GOOGLE_MAPS_API_KEY', getenv('GOOGLE_MAPS_API_KEY') ?: 'AIzaSyDR0jIaHjbCl7IRIwKEySe8sM8Qp4zmK8Y');

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'ohiobrewpath');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Site configuration
define('SITE_URL', getenv('SITE_URL') ?: 'https://ohiobeerpath.com');
define('DEFAULT_REGION', 'central');

// Cache settings
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 3600); // 1 hour in seconds
