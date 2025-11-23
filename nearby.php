<?php
require_once('config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Breweries Near You - Ohio Beer Path</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <script src="assets/js/maps-config.php"></script>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="index.php">Ohio Beer Path</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="nearby.php">Find Nearby</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="breweries.php">All Breweries</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="regions.php">Regions</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="itinerary.php">Itinerary</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="blog.php">Beer Blog</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>



    <div class="bg-dark text-white text-center py-4">
        <div class="container">
            <h1 class="display-4">Find Breweries Near You</h1>
            <p>Discover local craft breweries in Ohio</p>
        </div>
    </div>

    <div class="section container my-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-body">
                        <h3 class="card-title text-center mb-4">Search Breweries</h3>
                        <div class="mb-3">
                            <input type="text" id="locationInput" class="form-control" placeholder="Enter ZIP Code or City">
                        </div>
                        <div class="mb-3">
                            <select id="radiusSelect" class="form-select">
                                <option value="25">25 miles</option>
                                <option value="50">50 miles</option>
                                <option value="100">100 miles</option>
                            </select>
                        </div>
                        <button class="btn btn-primary w-100" onclick="searchBreweries()">Find Breweries</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="searchResults" class="section container my-5 d-none">
        <h2 class="text-center mb-4">Nearby Breweries</h2>
        <div class="row">
            <div class="col-md-8">
                <div id="breweriesList" class="row g-4"></div>
            </div>
            <div class="col-md-4">
                <div id="map" class="sticky-top" style="height: 400px; top: 2rem;"></div>
            </div>
        </div>
    </div>

    <div id="loadingSpinner" class="d-none position-fixed top-50 start-50 translate-middle">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <script src="assets/js/geo-utils.js"></script>
    <script>
        let map;
        let markers = [];
        const ohioBounds = {
            north: 42.327,
            south: 38.403,
            west: -84.820,
            east: -80.518
        };

        function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 40.4173, lng: -82.9071 },
                zoom: 7,
                restriction: {
                    latLngBounds: ohioBounds,
                    strictBounds: false
                }
            });
        }

        // Load brewery data from JSON file
        let breweries = [];
        let itinerary = [];
        
        // Fetch brewery data when the page loads
        fetch('breweries.json')
            .then(response => response.json())
            .then(data => {
                breweries = data;
                console.log('Loaded', breweries.length, 'breweries');
            })
            .catch(error => console.error('Error loading brewery data:', error));
            
        // Load any existing itinerary from localStorage
        document.addEventListener('DOMContentLoaded', function() {
            const savedItinerary = localStorage.getItem('ohioBeerPathItinerary');
            if (savedItinerary) {
                itinerary = JSON.parse(savedItinerary);
                console.log('Loaded saved itinerary with', itinerary.length, 'breweries');
            }
        });
        
        async function searchBreweries() {
            const location = document.getElementById('locationInput').value;
            const radius = parseInt(document.getElementById('radiusSelect').value);
            const loadingSpinner = document.getElementById('loadingSpinner');
            const searchResults = document.getElementById('searchResults');
            
            if (!location.trim()) {
                alert('Please enter a location');
                return;
            }

            loadingSpinner.classList.remove('d-none');
            clearMarkers();

            // Geocode the location input using Google Maps Geocoding API
            try {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: location + ', Ohio, USA', region: 'US' }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const searchLat = results[0].geometry.location.lat();
                        const searchLng = results[0].geometry.location.lng();
                        // Filter breweries by Haversine distance
                        const filteredBreweries = breweries.filter(brewery => {
                            if (brewery.latitude && brewery.longitude) {
                                const dist = haversineDistance(searchLat, searchLng, parseFloat(brewery.latitude), parseFloat(brewery.longitude));
                                return dist <= radius;
                            }
                            return false;
                        });
                        filteredBreweries.sort((a, b) => {
                            if (a.name && b.name) {
                                return a.name.localeCompare(b.name);
                            }
                            return 0;
                        });
                        loadingSpinner.classList.add('d-none');
                        searchResults.classList.remove('d-none');
                        displayResults(filteredBreweries);
                    } else {
                        // Fallback to substring search if geocoding fails
                        let filteredBreweries = filterBreweriesByLocation(location);
                        filteredBreweries.sort((a, b) => {
                            if (a.name && b.name) {
                                return a.name.localeCompare(b.name);
                            }
                            return 0;
                        });
                        loadingSpinner.classList.add('d-none');
                        searchResults.classList.remove('d-none');
                        displayResults(filteredBreweries);
                    }
                });
            } catch (err) {
                // Fallback to substring search if geocoding throws
                let filteredBreweries = filterBreweriesByLocation(location);
                filteredBreweries.sort((a, b) => {
                    if (a.name && b.name) {
                        return a.name.localeCompare(b.name);
                    }
                    return 0;
                });
                loadingSpinner.classList.add('d-none');
                searchResults.classList.remove('d-none');
                displayResults(filteredBreweries);
            }
        }
        
        function filterBreweriesByLocation(location) {
            // First, try to find exact matches
            const exactMatches = breweries.filter(brewery => {
                // Check if location matches city exactly
                if (brewery.city && brewery.city.toLowerCase() === location.toLowerCase()) {
                    return true;
                }
                
                // Check if location matches zip code in address field exactly
                if (brewery.address && brewery.address.includes(location)) {
                    return true;
                }
                
                return false;
            });
            
            // If we have enough exact matches, return those
            if (exactMatches.length >= 5) {
                return exactMatches;
            }
            
            // Otherwise, do a broader search
            return breweries.filter(brewery => {
                // Check if location is part of city name
                if (brewery.city && brewery.city.toLowerCase().includes(location.toLowerCase())) {
                    return true;
                }
                
                // Check if location matches zip code in address field
                if (brewery.address && brewery.address.includes(location)) {
                    return true;
                }
                
                // Check for Cleveland area codes (for 44144)
                if (location === '44144' && brewery.address && 
                    (brewery.address.includes('Cleveland') || 
                     brewery.city === 'Cleveland' || 
                     brewery.address.includes('44'))) {
                    return true;
                }
                
                // For zip codes, try to match the first 3 digits (area)
                if (location.match(/^\d{5}$/) && brewery.address) {
                    const zipPrefix = location.substring(0, 3);
                    const addressZips = brewery.address.match(/\b(\d{5})\b/g);
                    if (addressZips && addressZips.some(zip => zip.startsWith(zipPrefix))) {
                        return true;
                    }
                }
                
                return false;
            });
        }

        function clearMarkers() {
            markers.forEach(marker => marker.setMap(null));
            markers = [];
        }

        function displayResults(breweries) {
            const breweriesList = document.getElementById('breweriesList');
            breweriesList.innerHTML = '';
            
            if (breweries.length === 0) {
                breweriesList.innerHTML = '<div class="col-12 text-center">No breweries found in this area.</div>';
                return;
            }

            // Default center for Ohio
            const ohioCenter = { lat: 40.4173, lng: -82.9071 };
            let hasValidCoordinates = false;

            breweries.forEach(brewery => {
                // Only create markers for breweries with valid coordinates
                if (brewery.latitude && brewery.longitude) {
                    const position = { 
                        lat: parseFloat(brewery.latitude), 
                        lng: parseFloat(brewery.longitude) 
                    };
                    
                    // Skip if coordinates are invalid
                    if (isNaN(position.lat) || isNaN(position.lng)) {
                        return;
                    }
                    
                    hasValidCoordinates = true;
                    
                    const marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: brewery.name
                    });
                    
                    // Add info window
                    const infowindow = new google.maps.InfoWindow({
                        content: `
                            <div style="max-width: 200px;">
                                <h6>${brewery.name}</h6>
                                <p>${brewery.address || brewery.city + ', OH'}</p>
                                ${brewery.website ? `<a href="${brewery.website}" target="_blank">Visit Website</a>` : ''}
                            </div>
                        `
                    });
                    
                    marker.addListener('click', () => {
                        infowindow.open(map, marker);
                    });
                    
                    markers.push(marker);
                }

                // Extract city and state from address if not available
                let city = brewery.city || 'Unknown';
                let state = brewery.state || 'OH';
                
                if (city === 'Unknown' && brewery.address) {
                    // Try to extract city from address
                    const cityMatch = brewery.address.match(/([A-Za-z\s]+),\s*Ohio/i);
                    if (cityMatch && cityMatch[1]) {
                        city = cityMatch[1].trim();
                    }
                }
                
                // Check if brewery is in itinerary
                const isInItinerary = itinerary.some(item => item.id == brewery.id);
                const addButtonClass = isInItinerary ? 'btn-success' : 'btn-outline-primary';
                const addButtonText = isInItinerary ? '<i class="bi bi-check"></i> Added' : '<i class="bi bi-plus"></i> Add to Tour';
                const addButtonDisabled = isInItinerary ? 'disabled' : '';

                const breweryCard = document.createElement('div');
                breweryCard.className = 'col-md-6 mb-4';
                breweryCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${brewery.name}</h5>
                            <p class="card-text">${brewery.address || `${city}, ${state}`}</p>
                            <div class="mt-3 d-flex justify-content-between">
                                ${brewery.website ? 
                                    `<a href="${brewery.website}" class="btn btn-sm btn-outline-secondary" target="_blank">Website</a>` : 
                                    `<span></span>`
                                }
                                <button class="btn btn-sm ${addButtonClass}" 
                                        onclick="addToItinerary(${brewery.id})" 
                                        ${addButtonDisabled}>
                                    ${addButtonText}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                breweriesList.appendChild(breweryCard);
            });

            // Update map view
            if (markers.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                markers.forEach(marker => bounds.extend(marker.getPosition()));
                map.fitBounds(bounds);
            } else {
                // If no valid coordinates, center on Ohio
                map.setCenter({ lat: 40.4173, lng: -82.9071 });
                map.setZoom(7);
            }
        }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>&callback=initMap">
    </script>
    
    <script>
        // Add brewery to itinerary
        function addToItinerary(breweryId) {
            // Find the brewery in our data
            const brewery = breweries.find(b => b.id == breweryId);
            if (!brewery) {
                console.error('Brewery not found:', breweryId);
                return;
            }
            
            // Check if already in itinerary
            const isInItinerary = itinerary.some(item => item.id == breweryId);
            if (isInItinerary) {
                console.log('Brewery already in itinerary');
                return;
            }
            
            // Add to itinerary
            itinerary.push(brewery);
            
            // Save to localStorage
            localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(itinerary));
            
            // Update UI - find the button and update it
            const button = document.querySelector(`button[onclick="addToItinerary(${breweryId})"]`);
            if (button) {
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-success');
                button.innerHTML = '<i class="bi bi-check"></i> Added';
                button.disabled = true;
            }
            
            // Show success message
            alert(`${brewery.name} has been added to your itinerary. Visit the Itinerary page to view your tour.`);
        }
    </script>
</body>
</html>