// Store the brewery data globally
let breweriesData = [];
let map;
let markers = [];

// Load brewery data from JSON file
async function loadBreweryData() {
    try {
        const response = await fetch('assets/data/breweries.json');
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        breweriesData = await response.json();
        console.log('Loaded', breweriesData.length, 'breweries');
        initializeCarousel();
    } catch (error) {
        console.error('Detailed error loading brewery data:', error);
        alert(`Error loading brewery data: ${error.message}`);
    }
}

// Initialize the carousel with some featured breweries
function initializeCarousel() {
    const carousel = document.querySelector('.carousel-inner');
    if (!carousel) return; // Skip if not on a page with carousel
    
    const featuredBreweries = breweriesData
        .filter(brewery => brewery.amenities && brewery.amenities.length > 0)
        .slice(0, 5);

    featuredBreweries.forEach((brewery, index) => {
        const slide = document.createElement('div');
        slide.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        
        slide.innerHTML = `
            <img src="/api/placeholder/800/400" class="d-block w-100" alt="${brewery.name}">
            <div class="carousel-caption">
                <h3>${brewery.name}</h3>
                <p>${brewery.city}, ${brewery.state}</p>
                ${brewery.description ? `<p class="brewery-description">${brewery.description}</p>` : ''}
            </div>
        `;
        
        carousel.appendChild(slide);
    });
}

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.4173, lng: -82.9071 }, // Center of Ohio
        zoom: 7,
        styles: [
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }]
            }
        ]
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI/180);
}

// Get coordinates from zipcode or address
async function getCoordinatesFromZipcode(address) {
    try {
        const geocoder = new google.maps.Geocoder();
        const response = await new Promise((resolve, reject) => {
            geocoder.geocode({ 
                address: address + ', Ohio, USA',
                region: 'US'
            }, (results, status) => {
                if (status === 'OK') {
                    resolve(results[0].geometry.location);
                } else {
                    reject(new Error('Geocoding failed: ' + status));
                }
            });
        });
        return response;
    } catch (error) {
        console.error('Error geocoding:', error);
        return null;
    }
}

// Find nearby breweries
async function findBreweries() {
    const zipcode = document.getElementById('zipcode').value;
    const distanceSelect = document.getElementById('distance');
    const maxDistance = distanceSelect ? parseInt(distanceSelect.value) : 50;

    if (!zipcode) {
        alert('Please enter a ZIP code or city');
        return;
    }

    showLoading(true);
    const resultsDiv = document.getElementById('searchResults');
    const breweriesList = document.getElementById('breweriesList');

    try {
        // Get coordinates for the entered location
        const userLocation = await getCoordinatesFromZipcode(zipcode);
        if (!userLocation) {
            throw new Error('Could not find location. Please check your input and try again.');
        }

        // Process each brewery
        const promises = breweriesData
            .filter(brewery => brewery.address && brewery.address !== 'N/A')
            .map(async brewery => {
                try {
                    const coords = await getCoordinatesFromZipcode(brewery.address);
                    if (!coords) return null;

                    const distance = calculateDistance(
                        userLocation.lat(),
                        userLocation.lng(),
                        coords.lat(),
                        coords.lng()
                    );

                    return {
                        ...brewery,
                        distance,
                        coordinates: coords
                    };
                } catch (error) {
                    console.error(`Error processing brewery ${brewery.name}:`, error);
                    return null;
                }
            });

        // Wait for all geocoding to complete
        const results = (await Promise.all(promises))
            .filter(brewery => brewery !== null && brewery.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance);

        // Display results
        breweriesList.innerHTML = '';
        
        if (results.length === 0) {
            breweriesList.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        No breweries found within ${maxDistance} miles of ${zipcode}.
                    </div>
                </div>
            `;
        } else {
            // Add results counter
            breweriesList.innerHTML = `
                <div class="col-12">
                    <div class="results-counter mb-4">
                        Found ${results.length} breweries within ${maxDistance} miles of ${zipcode}
                    </div>
                </div>
            `;

            // Add brewery cards
            results.forEach(brewery => {
                const card = document.createElement('div');
                card.className = 'col-md-6 col-lg-12 mb-4';

                const amenitiesList = brewery.amenities && brewery.amenities.length > 0
                    ? brewery.amenities
                        .filter(amenity => amenity !== 'N/A' && amenity !== 'TBD')
                        .slice(0, 3)
                        .map(amenity => `<span class="badge bg-light text-dark me-1">${amenity}</span>`)
                        .join('')
                    : '<span class="text-muted">No amenities listed</span>';

                const hours = brewery.hours && Object.keys(brewery.hours).length > 0
                    ? Object.entries(brewery.hours)
                        .map(([day, time]) => `<div class="hours-row"><small>${day}: ${time}</small></div>`)
                        .join('')
                    : '<div class="text-muted"><small>Hours not listed</small></div>';

                card.innerHTML = `
                    <div class="card h-100 brewery-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title mb-3">${brewery.name}</h5>
                                <span class="badge bg-primary">${brewery.distance.toFixed(1)} miles</span>
                            </div>
                            <p class="card-text mb-2">
                                <i class="bi bi-geo-alt"></i> ${brewery.address}
                            </p>
                            ${brewery.phone ? `
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone"></i> ${brewery.phone}
                                </p>
                            ` : ''}
                            <div class="mb-3">
                                <h6 class="mb-2">Amenities:</h6>
                                <div class="amenities-badges">
                                    ${amenitiesList}
                                </div>
                            </div>
                            <div class="mb-3">
                                <h6 class="mb-2">Hours:</h6>
                                <div class="hours-container">
                                    ${hours}
                                </div>
                            </div>
                            <div class="mt-3 d-flex gap-2">
                                <button onclick="showDirections('${brewery.address.replace(/'/g, "\\'")}')" 
                                        class="btn btn-sm btn-outline-primary">
                                    <i class="bi bi-map"></i> Directions
                                </button>
                                ${brewery.website2 ? `
                                    <a href="${brewery.website2}" 
                                       target="_blank" 
                                       class="btn btn-sm btn-outline-secondary">
                                        <i class="bi bi-globe"></i> Website
                                    </a>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-success" onclick='addToItinerary(${JSON.stringify(brewery)})'>
                                    <i class="bi bi-plus"></i> Add to Itinerary
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                breweriesList.appendChild(card);
            });
        }

        // Update map
        updateMap(userLocation, results);
        resultsDiv.classList.remove('d-none');

    } catch (error) {
        console.error('Error finding breweries:', error);
        breweriesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Error: ${error.message}
                </div>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Update map with markers
function updateMap(userLocation, breweries) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Set map center to user location
    map.setCenter(userLocation);
    map.setZoom(10);

    // Add user location marker
    markers.push(new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        title: 'Your Location'
    }));

    // Add brewery markers
    breweries.forEach(brewery => {
        const marker = new google.maps.Marker({
            position: brewery.coordinates,
            map: map,
            title: brewery.name
        });

        const infowindow = new google.maps.InfoWindow({
            content: `
                <div class="marker-info">
                    <h6>${brewery.name}</h6>
                    <p>${brewery.address}</p>
                    <p>${brewery.distance.toFixed(1)} miles away</p>
                    ${brewery.phone ? `<p>Phone: ${brewery.phone}</p>` : ''}
                    ${brewery.website2 ? `<p><a href="${brewery.website2}" target="_blank">Visit Website</a></p>` : ''}
                </div>
            `
        });

        marker.addListener('click', () => {
            infowindow.open(map, marker);
        });

        markers.push(marker);
    });

    // Fit map bounds to show all markers
    if (markers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
    }
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }
}

// Show directions
function showDirections(destinationAddress) {
    const zipcode = document.getElementById('zipcode').value;
    if (!zipcode) {
        alert('Please enter your location first');
        return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(zipcode)}&destination=${encodeURIComponent(destinationAddress)}`;
    window.open(url, '_blank');
}

// Itinerary management functions
let itinerary = [];

function addToItinerary(brewery) {
    itinerary.push(brewery);
    updateItineraryDisplay();
}

function updateItineraryDisplay() {
    const itineraryList = document.getElementById('itineraryList');
    if (!itineraryList) return;
    itineraryList.innerHTML = "";
    itinerary.forEach((brewery) => {
         const item = document.createElement('a');
         item.className = "list-group-item list-group-item-action";
         item.innerHTML = `<strong>${brewery.name}</strong> - ${brewery.city}`;
         itineraryList.appendChild(item);
    });
}

function saveItinerary() {
    if (itinerary.length === 0) {
         alert("No breweries selected for itinerary.");
         return;
    }
    let itineraryNames = itinerary.map(b => b.name).join(", ");
    alert("Itinerary saved with breweries: " + itineraryNames);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadBreweryData();
    initMap();
});