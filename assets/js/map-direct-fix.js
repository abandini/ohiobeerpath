/**
 * Direct fix for Google Maps integration
 * This script provides a simple, reliable way to load Google Maps on the home page
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Map direct fix script loaded');
    
    // Find the map container
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('No map element found on this page');
        return;
    }
    
    // Get API key - either from PHP variable or use the hardcoded one
    const apiKey = typeof PHP_GOOGLE_MAPS_API_KEY !== 'undefined' 
        ? PHP_GOOGLE_MAPS_API_KEY 
        : 'AIzaSyDR0jIaHjbCl7IRIwKEySe8sM8Qp4zmK8Y';
    
    console.log('Loading Google Maps with API key');
    
    // Create and append the Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initHomePageMap`;
    script.async = true;
    script.defer = true;
    
    // Add error handling
    script.onerror = function() {
        console.error('Failed to load Google Maps API');
        showMapError('Failed to load Google Maps API. Please check your internet connection or contact the site administrator if the problem persists.');
        alert('Map could not be loaded. Please check your internet connection or contact support.');
    };
    
    // Define the callback function
    window.initHomePageMap = function() {
        console.log('Google Maps API loaded, initializing map');
        
        try {
            // Default center of Ohio
            const ohioCenter = { lat: 40.4173, lng: -82.9071 };
            
            // Create the map
            const map = new google.maps.Map(mapElement, {
                center: ohioCenter,
                zoom: 7,
                mapTypeControl: true,
                fullscreenControl: true,
                streetViewControl: false
            });
            
            // Add a marker for the center of Ohio
            new google.maps.Marker({
                position: ohioCenter,
                map: map,
                title: 'Center of Ohio'
            });
            
            console.log('Map initialized successfully');
            
            // Try to load brewery data and add markers
            loadBreweryMarkers(map);
            
        } catch (error) {
            console.error('Error initializing map:', error);
            showMapError('Error initializing map: ' + error.message);
        }
    };
    
    // Add the script to the document
    document.head.appendChild(script);
});

// Load brewery data and add markers to the map
function loadBreweryMarkers(map) {
    fetch('breweries.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load brewery data');
            }
            return response.json();
        })
        .then(breweries => {
            console.log(`Adding ${breweries.length} brewery markers to map`);
            
            // Add markers for each brewery with valid coordinates
            breweries.forEach(brewery => {
                if (brewery.latitude && brewery.longitude) {
                    const position = {
                        lat: parseFloat(brewery.latitude),
                        lng: parseFloat(brewery.longitude)
                    };
                    
                    // Skip if coordinates are invalid
                    if (isNaN(position.lat) || isNaN(position.lng)) {
                        return;
                    }
                    
                    // Create marker
                    const marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: brewery.name
                    });
                    
                    // Create info window
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="max-width: 200px;">
                                <h6 style="margin-bottom: 5px;">${brewery.name}</h6>
                                <p style="margin-bottom: 5px; color: #666;">${brewery.city || ''}, OH</p>
                                <a href="view-brewery-simple.html?id=${brewery.id}" 
                                   style="font-size: 0.9rem;">View Details</a>
                            </div>
                        `
                    });
                    
                    // Add click listener to open info window
                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error loading brewery data for map:', error);
            showMapError('We could not load brewery locations. Please try again later or contact support.');
            alert('Brewery data could not be loaded. Please try again later.');
        });
}

// Show error message in map container
function showMapError(message) {
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.innerHTML = `
            <div class="alert alert-warning m-3 text-center">
                <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
                <h5>Map Unavailable</h5>
                <p>${message || "We're having trouble loading the map. You can still browse breweries below."}</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}
