/**
 * Ohio Beer Path - Itinerary Module
 * 
 * This module handles all itinerary-related functionality including:
 * - Adding/removing breweries from the itinerary
 * - Drag and drop reordering
 * - Route optimization
 * - Map visualization
 * - Saving/loading itineraries
 */

// Add to OhioBeerPath namespace
if (!window.OhioBeerPath) {
    window.OhioBeerPath = {};
}

// Itinerary module
OhioBeerPath.itinerary = (function() {
    // Private variables
    let _breweries = [];
    let _itinerary = [];
    let _startingPoint = null;
    let _markers = [];
    let _directionsService = null;
    let _directionsRenderer = null;
    let _routePolyline = null;
    let _mapInstance = null;

    /**
     * Initialize the itinerary map
     * @param {Object} mapInstance - Google Maps instance
     */
    function _initializeMap(mapInstance) {
        _mapInstance = mapInstance;
        
        // Initialize directions service if Google Maps API is loaded
        if (typeof google !== 'undefined' && google.maps) {
            _directionsService = new google.maps.DirectionsService();
            _directionsRenderer = new google.maps.DirectionsRenderer({
                map: _mapInstance,
                suppressMarkers: true, // We'll add custom markers
                polylineOptions: {
                    strokeColor: '#007bff',
                    strokeWeight: 5,
                    strokeOpacity: 0.7
                }
            });
        }
        
        // Load saved itinerary from localStorage
        _loadSavedItinerary();
        
        // Update the map with the itinerary
        _updateMapMarkers();
    }

    /**
     * Set brewery data for the itinerary
     * @param {Array} breweries - Array of brewery objects
     */
    function _setBreweryData(breweries) {
        _breweries = breweries || [];
    }
    
    /**
     * Load saved itinerary from localStorage
     */
    function _loadSavedItinerary() {
        try {
            // Load itinerary
            const savedItineraryJSON = localStorage.getItem('ohioBeerPathItinerary');
            if (savedItineraryJSON) {
                const parsed = JSON.parse(savedItineraryJSON);
                // Validate and set itinerary
                if (Array.isArray(parsed)) {
                    _itinerary = parsed;
                }
            }
            
            // Load starting point
            const startingPointJSON = localStorage.getItem('ohioBeerPathStartingPoint');
            if (startingPointJSON) {
                _startingPoint = JSON.parse(startingPointJSON);
            }
            
            // Update UI if there's a saved itinerary
            if (_itinerary.length > 0) {
                _updateItineraryDisplay();
            }
        } catch (error) {
            console.error('Error loading saved itinerary:', error);
        }
    }

// Display breweries in the selection list
function displayBreweries(breweries) {
    const breweriesList = document.getElementById('breweriesList');
    breweriesList.innerHTML = '';
    
    if (breweries.length === 0) {
        breweriesList.innerHTML = '<div class="col-12 text-center">No breweries found.</div>';
        return;
    }
    
    breweries.forEach(brewery => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        
        // Check if brewery is already in itinerary
        const isInItinerary = itinerary.some(item => item.id === brewery.id);
        
        card.innerHTML = `
            <div class="card h-100 brewery-card">
                <div class="card-body">
                    <h5 class="card-title">${brewery.name}</h5>
                    <p class="card-text text-muted">${brewery.city}, OH</p>
                    <p class="card-text small">${brewery.brewery_type || 'Craft Brewery'}</p>
                    <button class="btn btn-sm ${isInItinerary ? 'btn-success' : 'btn-outline-primary'}" 
                            onclick="toggleBreweryInItinerary(${brewery.id})" 
                            ${isInItinerary ? 'disabled' : ''}>
                        ${isInItinerary ? '<i class="bi bi-check"></i> Added' : '<i class="bi bi-plus"></i> Add to Tour'}
                    </button>
                </div>
            </div>
        `;
        
        breweriesList.appendChild(card);
    });
}

// Filter breweries based on search and region
function filterBreweries() {
    const searchTerm = document.getElementById('brewerySearch').value.toLowerCase();
    const regionFilter = document.getElementById('regionFilter').value.toLowerCase();
    
    const filteredBreweries = breweriesData.filter(brewery => {
        const matchesSearch = searchTerm === '' || 
            brewery.name.toLowerCase().includes(searchTerm) || 
            brewery.city.toLowerCase().includes(searchTerm);
            
        const matchesRegion = regionFilter === '' || 
            (brewery.region && brewery.region.toLowerCase() === regionFilter);
            
        return matchesSearch && (regionFilter === '' || matchesRegion);
    });
    
    displayBreweries(filteredBreweries);
}

// Add or remove brewery from itinerary
function toggleBreweryInItinerary(breweryId) {
    const brewery = breweriesData.find(b => b.id === breweryId);
    if (!brewery) return;
    
    // Check if brewery is already in itinerary
    const index = itinerary.findIndex(item => item.id === breweryId);
    
    if (index === -1) {
        // Add to itinerary
        itinerary.push(brewery);
    } else {
        // Remove from itinerary
        itinerary.splice(index, 1);
    }
    
    // Update UI
    updateItineraryDisplay();
    displayBreweries(breweriesData); // Refresh brewery list to update buttons
    
    // Save to localStorage
    localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(itinerary));
}

// Update the itinerary display
function updateItineraryDisplay() {
    const itineraryList = document.getElementById('itineraryList');
    const saveButton = document.getElementById('saveButton');
    const optimizeButton = document.getElementById('optimizeButton');
    const clearButton = document.getElementById('clearButton');
    
    if (itinerary.length === 0) {
        itineraryList.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-map fs-1"></i>
                <p>No breweries added yet</p>
            </div>
        `;
        saveButton.disabled = true;
        optimizeButton.disabled = true;
        clearButton.disabled = true;
    } else {
        itineraryList.innerHTML = '';
        
        itinerary.forEach((brewery, index) => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <span class="badge bg-primary rounded-pill me-2">${index + 1}</span>
                    <span>${brewery.name}</span>
                    <div class="small text-muted">${brewery.city}, OH</div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromItinerary(${brewery.id})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            itineraryList.appendChild(item);
        });
        
        saveButton.disabled = false;
        optimizeButton.disabled = itinerary.length < 2;
        clearButton.disabled = false;
    }
    
    // Update the map with the itinerary
    updateItineraryMap();
}

// Remove a brewery from the itinerary
function removeFromItinerary(breweryId) {
    const index = itinerary.findIndex(item => item.id === breweryId);
    if (index !== -1) {
        itinerary.splice(index, 1);
        updateItineraryDisplay();
        displayBreweries(breweriesData); // Refresh brewery list to update buttons
        
        // Save to localStorage
        localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(itinerary));
    }
}

// Clear the entire itinerary
function clearItinerary() {
    if (confirm('Are you sure you want to clear your entire itinerary?')) {
        itinerary = [];
        updateItineraryDisplay();
        displayBreweries(breweriesData); // Refresh brewery list to update buttons
        
        // Clear from localStorage
        localStorage.removeItem('ohioBeerPathItinerary');
    }
}

// Set the starting point for the itinerary
function setStartingPoint() {
    const startingPointInput = document.getElementById('startingPoint').value;
    if (!startingPointInput) {
        alert('Please enter a starting location');
        return;
    }
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 
        address: startingPointInput + ', Ohio, USA',
        region: 'US'
    }, (results, status) => {
        if (status === 'OK') {
            startingPoint = {
                name: startingPointInput,
                location: results[0].geometry.location,
                address: results[0].formatted_address
            };
            
            // Update the map
            updateItineraryMap();
            
            // Save to localStorage
            localStorage.setItem('ohioBeerPathStartingPoint', JSON.stringify(startingPoint));
            
            // Show success message
            alert(`Starting point set to: ${startingPoint.address}`);
        } else {
            alert('Could not find that location. Please try a different address or ZIP code.');
        }
    });
}

// Update the map with the itinerary
function updateItineraryMap() {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    if (itinerary.length === 0) {
        // If no breweries in itinerary, just center the map on Ohio
        map.setCenter({ lat: 40.4173, lng: -82.9071 });
        map.setZoom(7);
        return;
    }
    
    // Add markers for each brewery in the itinerary
    itinerary.forEach((brewery, index) => {
        const position = { 
            lat: parseFloat(brewery.latitude), 
            lng: parseFloat(brewery.longitude) 
        };
        
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: brewery.name,
            label: {
                text: (index + 1).toString(),
                color: 'white'
            }
        });
        
        const infowindow = new google.maps.InfoWindow({
            content: `
                <div class="marker-info">
                    <h6>${brewery.name}</h6>
                    <p>${brewery.address || brewery.city + ', OH'}</p>
                    ${brewery.phone ? `<p>Phone: ${brewery.phone}</p>` : ''}
                    ${brewery.website ? `<p><a href="${brewery.website}" target="_blank">Visit Website</a></p>` : ''}
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infowindow.open(map, marker);
        });
        
        markers.push(marker);
    });
    
    // Add starting point marker if set
    if (startingPoint) {
        const startMarker = new google.maps.Marker({
            position: startingPoint.location,
            map: map,
            title: 'Starting Point',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });
        
        const infowindow = new google.maps.InfoWindow({
            content: `
                <div class="marker-info">
                    <h6>Starting Point</h6>
                    <p>${startingPoint.address}</p>
                </div>
            `
        });
        
        startMarker.addListener('click', () => {
            infowindow.open(map, startMarker);
        });
        
        markers.push(startMarker);
    }
    
    // Fit map to show all markers
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
        
        // If there's a starting point and at least one brewery, calculate route
        if (startingPoint && itinerary.length > 0) {
            calculateAndDisplayRoute();
        }
    }
}

// Calculate and display the route
function calculateAndDisplayRoute() {
    if (!startingPoint || itinerary.length === 0) return;
    
    // Create waypoints array from itinerary
    const waypoints = itinerary.map(brewery => {
        return {
            location: new google.maps.LatLng(
                parseFloat(brewery.latitude),
                parseFloat(brewery.longitude)
            ),
            stopover: true
        };
    });
    
    // If only one brewery, no need for waypoints
    if (itinerary.length === 1) {
        directionsService.route({
            origin: startingPoint.location,
            destination: new google.maps.LatLng(
                parseFloat(itinerary[0].latitude),
                parseFloat(itinerary[0].longitude)
            ),
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    } else {
        // For multiple breweries, use waypoints
        // The last brewery is the destination
        const lastBrewery = itinerary[itinerary.length - 1];
        const waypointsWithoutLast = waypoints.slice(0, -1);
        
        directionsService.route({
            origin: startingPoint.location,
            destination: new google.maps.LatLng(
                parseFloat(lastBrewery.latitude),
                parseFloat(lastBrewery.longitude)
            ),
            waypoints: waypointsWithoutLast,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    }
}

// Optimize the route order
function optimizeRoute() {
    if (!startingPoint) {
        alert('Please set a starting point first.');
        return;
    }

    if (itinerary.length < 2) {
        alert('Add at least two breweries to optimize the route.');
        return;
    }

    // Prepare waypoints: all breweries except the last one
    const waypoints = itinerary.slice(0, -1).map(brewery => ({
        location: new google.maps.LatLng(parseFloat(brewery.latitude), parseFloat(brewery.longitude)),
        stopover: true
    }));

    // Define the request for the Directions Service
    const request = {
        origin: startingPoint.location, // User's starting location
        destination: new google.maps.LatLng(parseFloat(itinerary[itinerary.length - 1].latitude), parseFloat(itinerary[itinerary.length - 1].longitude)), // Last brewery is the final destination
        waypoints: waypoints, // Intermediate breweries to visit
        optimizeWaypoints: true, // <<< Key setting for optimization
        travelMode: google.maps.TravelMode.DRIVING
    };

    // Send the request to the Directions Service
    directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
            
            // Reorder the itinerary based on the optimized waypoint order
            // The response.routes[0].waypoint_order gives the optimized order of the 'waypoints' array.
            // We need to reconstruct the full itinerary: Start -> optimized waypoints -> Destination
            const optimizedWaypoints = response.routes[0].waypoint_order.map(index => itinerary[index]); // Get optimized intermediate breweries
            const finalDestination = itinerary[itinerary.length - 1]; // Get the last brewery (destination)
            
            // Construct the new itinerary order: Start (implied) -> Optimized Intermediate -> Final Destination
            itinerary = [...optimizedWaypoints, finalDestination];
            
            updateItineraryDisplay();
            updateItineraryMap(); // Update map markers and route polyline
            
            // Save to localStorage
            localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(itinerary));
            
            alert('Route optimized! The brewery order has been updated for the most efficient route.');
        } else {
            console.error('Directions request failed due to ' + status);
            alert('Could not optimize route. Error: ' + status);
        }
    });
}

// Save the itinerary
function saveItinerary() {
    if (itinerary.length === 0) {
        alert('Please add at least one brewery to your itinerary before saving.');
        return;
    }
    
    // Show the save modal
    const saveModal = new bootstrap.Modal(document.getElementById('saveItineraryModal'));
    saveModal.show();
}

// Finalize and save the itinerary
function finalizeItinerary() {
    const itineraryName = document.getElementById('itineraryName').value;
    const itineraryEmail = document.getElementById('itineraryEmail').value;
    const shareItinerary = document.getElementById('shareItinerary').checked;
    
    if (!itineraryName) {
        alert('Please name your itinerary.');
        return;
    }
    
    if (!itineraryEmail) {
        alert('Please enter your email to receive the itinerary.');
        return;
    }
    
    // In a real application, this would send the data to the server
    // For now, we'll just show a success message
    alert(`Itinerary "${itineraryName}" saved! A copy has been sent to ${itineraryEmail}.`);
    
    // Close the modal
    const saveModal = bootstrap.Modal.getInstance(document.getElementById('saveItineraryModal'));
    saveModal.hide();
    
    // Save to localStorage
    const savedItinerary = {
        name: itineraryName,
        email: itineraryEmail,
        shared: shareItinerary,
        breweries: itinerary,
        startingPoint: startingPoint,
        date: new Date().toISOString()
    };
    
    localStorage.setItem('ohioBeerPathSavedItinerary', JSON.stringify(savedItinerary));
}

// Load saved itinerary from localStorage
function loadSavedItinerary() {
    // Load itinerary
    const savedItineraryJSON = localStorage.getItem('ohioBeerPathItinerary');
    if (savedItineraryJSON) {
        try {
            let parsed = JSON.parse(savedItineraryJSON);
            // Rehydrate with latest brewery data
            itinerary = parsed.map(item => {
                const brewery = breweriesData.find(b => b.id == item.id);
                return brewery ? brewery : item;
            });
        } catch (e) {
            console.error('Error parsing saved itinerary:', e);
            itinerary = [];
        }
    }
    
    // Load starting point
    const startingPointJSON = localStorage.getItem('ohioBeerPathStartingPoint');
    if (startingPointJSON) {
        try {
            startingPoint = JSON.parse(startingPointJSON);
            document.getElementById('startingPoint').value = startingPoint.name;
        } catch (e) {
            console.error('Error parsing starting point:', e);
            startingPoint = null;
        }
    }
    
    // Update UI if there's a saved itinerary
    if (itinerary.length > 0) {
        updateItineraryDisplay();
    }
}

    /**
     * Add a brewery to the itinerary
     * @param {Object} brewery - Brewery object to add
     * @returns {Boolean} - Success status
     */
    function _addBrewery(brewery) {
        if (!brewery || !brewery.id) return false;
        
        // Check if already in itinerary
        if (_itinerary.some(item => item.id === brewery.id)) {
            return false;
        }
        
        // Add to itinerary
        _itinerary.push(brewery);
        
        // Save to localStorage
        localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(_itinerary));
        
        // Update UI
        _updateItineraryDisplay();
        
        return true;
    }
    
    /**
     * Remove a brewery from the itinerary
     * @param {Number} breweryId - ID of brewery to remove
     * @returns {Boolean} - Success status
     */
    function _removeBrewery(breweryId) {
        const initialLength = _itinerary.length;
        _itinerary = _itinerary.filter(item => item.id !== breweryId);
        
        if (_itinerary.length !== initialLength) {
            // Save to localStorage
            localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(_itinerary));
            
            // Update UI
            _updateItineraryDisplay();
            return true;
        }
        
        return false;
    }
    
    /**
     * Clear the entire itinerary
     */
    function _clearItinerary() {
        _itinerary = [];
        localStorage.removeItem('ohioBeerPathItinerary');
        _updateItineraryDisplay();
    }
    
    /**
     * Update the itinerary order after drag-and-drop
     */
    function _updateOrder() {
        const itineraryList = document.getElementById('itineraryList');
        if (!itineraryList) return;
        
        // Get all brewery items in the list
        const items = itineraryList.querySelectorAll('[data-brewery-id]');
        if (items.length === 0) return;
        
        // Create new ordered array based on DOM order
        const newOrder = [];
        items.forEach(item => {
            const breweryId = parseInt(item.getAttribute('data-brewery-id'), 10);
            const brewery = _itinerary.find(b => b.id === breweryId);
            if (brewery) {
                newOrder.push(brewery);
            }
        });
        
        // Update itinerary array
        if (newOrder.length === _itinerary.length) {
            _itinerary = newOrder;
            
            // Save to localStorage
            localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(_itinerary));
            
            // Update order numbers in UI
            _updateItineraryNumbers();
            
            // Update map if available
            if (_mapInstance) {
                _updateMapMarkers();
            }
        }
    }
    
    /**
     * Update the itinerary display in the UI
     */
    function _updateItineraryDisplay() {
        const itineraryList = document.getElementById('itineraryList');
        const emptyMessage = document.getElementById('emptyItineraryMessage');
        const itinerarySummary = document.getElementById('itinerarySummary');
        
        if (!itineraryList) return;
        
        // Clear current list
        itineraryList.innerHTML = '';
        
        // Show/hide empty message
        if (emptyMessage) {
            emptyMessage.classList.toggle('d-none', _itinerary.length > 0);
        }
        
        // Show/hide summary
        if (itinerarySummary) {
            itinerarySummary.classList.toggle('d-none', _itinerary.length === 0);
        }
        
        // If empty, return
        if (_itinerary.length === 0) {
            return;
        }
        
        // Get the template
        const template = document.getElementById('itineraryItemTemplate');
        if (!template) return;
        
        // Add each brewery to the list
        _itinerary.forEach((brewery, index) => {
            // Clone the template
            const item = document.importNode(template.content, true).querySelector('.itinerary-list-item');
            
            // Set brewery ID
            item.setAttribute('data-brewery-id', brewery.id);
            
            // Set order number
            item.querySelector('.itinerary-item-order').textContent = index + 1;
            
            // Set brewery details
            item.querySelector('.itinerary-item-name').textContent = brewery.name;
            item.querySelector('.itinerary-item-location').textContent = `${brewery.city}, OH`;
            
            // Set hours if available
            const hoursElement = item.querySelector('.itinerary-item-hours');
            if (hoursElement && brewery.hours) {
                hoursElement.textContent = brewery.hours;
            } else if (hoursElement) {
                hoursElement.textContent = 'Hours not available';
            }
            
            // Add event listeners
            const viewBtn = item.querySelector('.view-brewery-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    window.location.href = `brewery.php?id=${brewery.id}`;
                });
            }
            
            const removeBtn = item.querySelector('.remove-brewery-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    _removeBrewery(brewery.id);
                });
            }
            
            // Add to list
            itineraryList.appendChild(item);
        });
        
        // Update summary if available
        _updateSummary();
        
        // Update map if available
        if (_mapInstance) {
            _updateMapMarkers();
        }
    }
    
    /**
     * Update the itinerary order numbers in the UI
     */
    function _updateItineraryNumbers() {
        const items = document.querySelectorAll('.itinerary-list-item');
        items.forEach((item, index) => {
            const orderElement = item.querySelector('.itinerary-item-order');
            if (orderElement) {
                orderElement.textContent = index + 1;
            }
        });
    }
    
    /**
     * Update the itinerary summary
     */
    function _updateSummary() {
        const breweryCount = document.getElementById('summaryBreweryCount');
        const distance = document.getElementById('summaryDistance');
        const time = document.getElementById('summaryTime');
        
        if (breweryCount) {
            breweryCount.textContent = _itinerary.length;
        }
        
        if (distance && time) {
            // If we have directions, use actual values
            if (_directionsRenderer && _directionsRenderer.getDirections()) {
                const route = _directionsRenderer.getDirections().routes[0];
                if (route) {
                    // Calculate total distance
                    let totalDistance = 0;
                    let totalDuration = 0;
                    
                    route.legs.forEach(leg => {
                        totalDistance += leg.distance.value;
                        totalDuration += leg.duration.value;
                    });
                    
                    // Convert to miles (from meters)
                    const miles = Math.round(totalDistance / 1609.34);
                    distance.textContent = `${miles} mi`;
                    
                    // Convert to hours (from seconds)
                    const hours = Math.round(totalDuration / 3600 * 10) / 10;
                    time.textContent = `${hours} hrs`;
                    return;
                }
            }
            
            // Fallback to estimates
            if (_itinerary.length > 1) {
                // Estimate 20 miles between breweries on average
                const estimatedMiles = (_itinerary.length - 1) * 20;
                distance.textContent = `~${estimatedMiles} mi`;
                
                // Estimate 30 minutes per brewery + 30 minutes travel between
                const visitDuration = parseInt(document.getElementById('visitDuration')?.value || 60, 10);
                const travelTime = (_itinerary.length - 1) * 0.5; // 30 minutes in hours
                const visitTime = (_itinerary.length * visitDuration) / 60; // convert minutes to hours
                const totalHours = Math.round((travelTime + visitTime) * 10) / 10;
                time.textContent = `~${totalHours} hrs`;
            } else {
                distance.textContent = 'N/A';
                time.textContent = 'N/A';
            }
        }
    }
    
    /**
     * Update map markers for the itinerary
     */
    function _updateMapMarkers() {
        if (!_mapInstance || !google || !google.maps) return;
        
        // Clear existing markers
        _markers.forEach(marker => marker.setMap(null));
        _markers = [];
        
        // If no breweries, return
        if (_itinerary.length === 0) {
            // Hide empty map message if it exists
            const emptyMapMessage = document.getElementById('emptyMapMessage');
            if (emptyMapMessage) {
                emptyMapMessage.classList.remove('d-none');
            }
            return;
        }
        
        // Hide empty map message if it exists
        const emptyMapMessage = document.getElementById('emptyMapMessage');
        if (emptyMapMessage) {
            emptyMapMessage.classList.add('d-none');
        }
        
        // Add markers for each brewery
        const bounds = new google.maps.LatLngBounds();
        
        _itinerary.forEach((brewery, index) => {
            if (!brewery.latitude || !brewery.longitude) return;
            
            const position = {
                lat: parseFloat(brewery.latitude),
                lng: parseFloat(brewery.longitude)
            };
            
            // Create marker
            const marker = new google.maps.Marker({
                position: position,
                map: _mapInstance,
                title: brewery.name,
                label: {
                    text: (index + 1).toString(),
                    color: '#ffffff'
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#007bff',
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 12
                },
                zIndex: 10
            });
            
            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="map-info-window">
                        <h6>${brewery.name}</h6>
                        <p class="text-muted small">${brewery.city}, OH</p>
                        <a href="brewery.php?id=${brewery.id}" class="btn btn-sm btn-outline-primary">View Details</a>
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(_mapInstance, marker);
            });
            
            _markers.push(marker);
            bounds.extend(position);
        });
        
        // Fit map to bounds if we have markers
        if (_markers.length > 0) {
            _mapInstance.fitBounds(bounds);
            
            // Don't zoom in too far on small routes
            const listener = google.maps.event.addListener(_mapInstance, 'idle', () => {
                if (_mapInstance.getZoom() > 12) {
                    _mapInstance.setZoom(12);
                }
                google.maps.event.removeListener(listener);
            });
        }
        
        // Calculate and display route if we have more than one brewery
        if (_itinerary.length > 1) {
            _calculateRoute();
        } else if (_directionsRenderer) {
            _directionsRenderer.setDirections({routes: []});
        }
    }
    
    /**
     * Calculate and display the route between breweries
     */
    function _calculateRoute() {
        if (!_directionsService || !_directionsRenderer || _itinerary.length < 2) return;
        
        // Get waypoints
        const waypoints = _itinerary.slice(1, -1).map(brewery => ({
            location: new google.maps.LatLng(
                parseFloat(brewery.latitude),
                parseFloat(brewery.longitude)
            ),
            stopover: true
        }));
        
        // Get origin and destination
        const origin = new google.maps.LatLng(
            parseFloat(_itinerary[0].latitude),
            parseFloat(_itinerary[0].longitude)
        );
        
        const destination = new google.maps.LatLng(
            parseFloat(_itinerary[_itinerary.length - 1].latitude),
            parseFloat(_itinerary[_itinerary.length - 1].longitude)
        );
        
        // Check if we should return to start
        const returnToStart = document.getElementById('returnToStart')?.checked;
        const actualDestination = returnToStart ? origin : destination;
        
        // Calculate route
        _directionsService.route({
            origin: origin,
            destination: actualDestination,
            waypoints: waypoints,
            optimizeWaypoints: document.getElementById('optimizeRoute')?.checked || false,
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                _directionsRenderer.setDirections(response);
                _updateSummary();
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    }
    
    /**
     * Display the itinerary on a map
     * @param {Object} mapInstance - Google Maps instance
     */
    function _displayOnMap(mapInstance) {
        if (!mapInstance) return;
        
        // Initialize map
        _initializeMap(mapInstance);
        
        // Update markers
        _updateMapMarkers();
    }
    
    /**
     * Get the current itinerary
     * @returns {Array} - Current itinerary
     */
    function _getItinerary() {
        return [..._itinerary];
    }
    
    /**
     * Get the count of breweries in the itinerary
     * @returns {Number} - Number of breweries
     */
    function _getCount() {
        return _itinerary.length;
    }
    
    // Public API
    return {
        // Core functions
        addBrewery: _addBrewery,
        removeBrewery: _removeBrewery,
        clearItinerary: _clearItinerary,
        updateOrder: _updateOrder,
        displayOnMap: _displayOnMap,
        
        // Getters
        getItinerary: _getItinerary,
        getCount: _getCount,
        
        // Setup
        setBreweryData: _setBreweryData,
        initialize: function() {
            _loadSavedItinerary();
            _updateItineraryDisplay();
        }
    };
})();
