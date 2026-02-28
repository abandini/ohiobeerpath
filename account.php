<?php
require_once('config.php');
require_once('includes/seo-utils.php');

// Define page-specific metadata
$meta = [
    'title' => 'My Account - Ohio Beer Path',
    'description' => 'Manage your Ohio Beer Path account, saved itineraries, and preferences.',
    'keywords' => 'account, ohio beer path, saved tours, brewery itinerary'
];

$og = [
    'title' => 'My Account - Ohio Beer Path',
    'description' => 'Manage your Ohio Beer Path account and saved brewery tours.',
    'type' => 'website'
];

$twitter = [
    'card' => 'summary',
    'title' => 'My Account - Ohio Beer Path',
    'description' => 'Manage your Ohio Beer Path account.'
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <?php
    echo generate_meta_tags($meta);
    echo generate_open_graph_tags($og);
    echo generate_twitter_card_tags($twitter);
    ?>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/mobile.css">

    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="theme-color" content="#007bff">
    <link rel="manifest" href="/site.webmanifest">
</head>
<body>
    <?php
    $active_page = 'account';
    include('includes/navigation.php');
    ?>

    <main class="container my-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <h1 class="mb-4">My Account</h1>

                <!-- Local Storage Based Account -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header">
                        <h2 class="h5 mb-0"><i class="bi bi-map me-2"></i>My Saved Itinerary</h2>
                    </div>
                    <div class="card-body">
                        <div id="savedItinerary">
                            <div class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-outline-primary me-2" id="viewItineraryBtn">
                                <i class="bi bi-eye me-1"></i> View Full Itinerary
                            </button>
                            <button class="btn btn-outline-danger" id="clearItineraryBtn">
                                <i class="bi bi-trash me-1"></i> Clear Itinerary
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Preferences -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header">
                        <h2 class="h5 mb-0"><i class="bi bi-gear me-2"></i>Preferences</h2>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Default Distance</label>
                            <select class="form-select" id="defaultDistance">
                                <option value="10">10 miles</option>
                                <option value="25" selected>25 miles</option>
                                <option value="50">50 miles</option>
                                <option value="100">100 miles</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Region</label>
                            <select class="form-select" id="defaultRegion">
                                <option value="">All Regions</option>
                                <option value="northeast">Northeast Ohio</option>
                                <option value="northwest">Northwest Ohio</option>
                                <option value="central">Central Ohio</option>
                                <option value="eastcentral">East Central Ohio</option>
                                <option value="westcentral">West Central Ohio</option>
                                <option value="southwest">Southwest Ohio</option>
                                <option value="southeast">Southeast Ohio</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="savePreferencesBtn">
                            <i class="bi bi-save me-1"></i> Save Preferences
                        </button>
                    </div>
                </div>

                <!-- Data Management -->
                <div class="card shadow-sm">
                    <div class="card-header">
                        <h2 class="h5 mb-0"><i class="bi bi-database me-2"></i>Data Management</h2>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">Your data is stored locally in your browser. No account registration is required.</p>
                        <div class="d-flex flex-wrap gap-2">
                            <button class="btn btn-outline-secondary" id="exportDataBtn">
                                <i class="bi bi-download me-1"></i> Export My Data
                            </button>
                            <button class="btn btn-outline-danger" id="clearAllDataBtn">
                                <i class="bi bi-trash me-1"></i> Clear All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <?php include('includes/footer.php'); ?>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/core.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load saved itinerary
        const savedItineraryContainer = document.getElementById('savedItinerary');
        const itinerary = JSON.parse(localStorage.getItem('ohioBeerPathItinerary') || '[]');

        if (itinerary.length === 0) {
            savedItineraryContainer.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="bi bi-info-circle me-2"></i>
                    You haven't saved any breweries to your itinerary yet.
                    <a href="breweries.php">Browse breweries</a> to get started!
                </div>
            `;
        } else {
            let html = '<ul class="list-group">';
            itinerary.forEach((brewery, index) => {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${index + 1}. ${brewery.name || 'Unknown Brewery'}</strong>
                            <br><small class="text-muted">${brewery.city || ''}, OH</small>
                        </div>
                        <a href="brewery.php?id=${brewery.id}" class="btn btn-sm btn-outline-primary">View</a>
                    </li>
                `;
            });
            html += '</ul>';
            html += `<p class="mt-2 text-muted"><small>${itinerary.length} breweries in your tour</small></p>`;
            savedItineraryContainer.innerHTML = html;
        }

        // View itinerary button
        document.getElementById('viewItineraryBtn').addEventListener('click', function() {
            window.location.href = 'itinerary.php';
        });

        // Clear itinerary button
        document.getElementById('clearItineraryBtn').addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your itinerary?')) {
                localStorage.removeItem('ohioBeerPathItinerary');
                location.reload();
            }
        });

        // Load preferences
        const savedPrefs = JSON.parse(localStorage.getItem('ohioBeerPathPreferences') || '{}');
        if (savedPrefs.defaultDistance) {
            document.getElementById('defaultDistance').value = savedPrefs.defaultDistance;
        }
        if (savedPrefs.defaultRegion) {
            document.getElementById('defaultRegion').value = savedPrefs.defaultRegion;
        }

        // Save preferences
        document.getElementById('savePreferencesBtn').addEventListener('click', function() {
            const prefs = {
                defaultDistance: document.getElementById('defaultDistance').value,
                defaultRegion: document.getElementById('defaultRegion').value
            };
            localStorage.setItem('ohioBeerPathPreferences', JSON.stringify(prefs));
            alert('Preferences saved!');
        });

        // Export data
        document.getElementById('exportDataBtn').addEventListener('click', function() {
            const data = {
                itinerary: JSON.parse(localStorage.getItem('ohioBeerPathItinerary') || '[]'),
                preferences: JSON.parse(localStorage.getItem('ohioBeerPathPreferences') || '{}'),
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ohio-beer-path-data.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Clear all data
        document.getElementById('clearAllDataBtn').addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
                localStorage.removeItem('ohioBeerPathItinerary');
                localStorage.removeItem('ohioBeerPathPreferences');
                location.reload();
            }
        });
    });
    </script>
</body>
</html>
