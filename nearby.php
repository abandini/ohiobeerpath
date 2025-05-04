<?php
require_once('../config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Breweries Near You - Ohio Beer Path</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <script src="assets/js/maps-config.php"></script>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="index.html">Ohio Beer Path</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="index.html">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="nearby.html">Find Nearby</a>
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

        function searchBreweries() {
            const location = document.getElementById('locationInput').value;
            const radius = document.getElementById('radiusSelect').value;
            const loadingSpinner = document.getElementById('loadingSpinner');
            const searchResults = document.getElementById('searchResults');
            
            if (!location.trim()) {
                alert('Please enter a location');
                return;
            }

            loadingSpinner.classList.remove('d-none');
            clearMarkers();

            fetch('search-breweries.php?location=${encodeURIComponent(location)}&radius=${radius}')
                .then(response => response.text())  // Get raw response text
                .then(text => {
                    console.log('Raw response:', text);  // Log the raw response
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('JSON parse error:', e);
                        throw new Error('Invalid response format');
                    }
                })
                .then(data => {
                    if (data.status === 'error') {
                        throw new Error(data.message);
                    }
                    loadingSpinner.classList.add('d-none');
                    searchResults.classList.remove('d-none');
                    displayResults(data.data);
                })
                .catch(error => {
                    console.error('Error details:', error);
                    loadingSpinner.classList.add('d-none');
                    alert('Error searching for breweries: ' + error.message);
                });

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

            breweries.forEach(brewery => {
                const marker = new google.maps.Marker({
                    position: { lat: parseFloat(brewery.latitude), lng: parseFloat(brewery.longitude) },
                    map: map,
                    title: brewery.name
                });
                markers.push(marker);

                const breweryCard = document.createElement('div');
                breweryCard.className = 'col-md-6';
                breweryCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${brewery.name}</h5>
                            <p class="card-text">${brewery.address}</p>
                            <p class="card-text">
                                <small class="text-muted">${brewery.distance.toFixed(1)} miles away</small>
                            </p>
                            ${brewery.website ? `<a href="${brewery.website}" class="btn btn-sm btn-primary" target="_blank">Visit Website</a>` : ''}
                        </div>
                    </div>
                `;
                breweriesList.appendChild(breweryCard);
            });

            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);
        }
    </script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(GOOGLE_MAPS_API_KEY); ?>&callback=initMap">
    </script>
</body>
</html>