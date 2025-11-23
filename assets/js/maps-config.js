/**
 * Maps Configuration for Ohio Beer Path
 * This file provides configuration and initialization for Google Maps
 */

// Define the Google Maps API Key - use the one from PHP if available, otherwise fallback to hardcoded key
const GOOGLE_MAPS_API_KEY = typeof PHP_GOOGLE_MAPS_API_KEY !== 'undefined' ? PHP_GOOGLE_MAPS_API_KEY : 'AIzaSyDR0jIaHjbCl7IRIwKEySe8sM8Qp4zmK8Y';

// Ohio Beer Path Maps Module
const OhioMaps = {
    mapInstance: null,
    markers: [],
    // Default map center (center of Ohio)
    defaultMapCenter: { lat: 40.4173, lng: -82.9071 },
    
    // Initialize map with error handling
    initMap: function(elementId, options = {}) {
        // Default options for map
        const defaultOptions = {
            center: this.defaultMapCenter, // Use the defined default center
            zoom: 7,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false
        };
        
        // Merge options
        const mapOptions = { ...defaultOptions, ...options };
        
        try {
            // Check if element exists
            const mapElement = document.getElementById(elementId);
            if (!mapElement) {
                console.error('Map element not found:', elementId);
                this.showMapError(elementId, 'Map container not found');
                return false;
            }
            
            // Check if Google Maps API is loaded
            if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                console.error('Google Maps API not loaded');
                this.showMapError(elementId, 'Google Maps API not loaded. Please check your API key or try reloading the page.');
                this.loadGoogleMapsAPI();
                alert('Google Maps could not be loaded. Please check your API key or try reloading the page.');
                return false;
            }
            
            // Initialize map
            this.mapInstance = new google.maps.Map(mapElement, mapOptions);
            console.log('Map initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapError(elementId, 'Error initializing map: ' + error.message);
            return false;
        }
    },
    
    // Show error message in map container
    showMapError: function(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="map-error alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle-fill fs-3 mb-2"></i>
                    <h5>Map Unavailable</h5>
                    <p>${message || "We're having trouble loading the map. You can still browse breweries below."}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    },
    
    // Load Google Maps API dynamically
    loadGoogleMapsAPI: function(callback) {
        // Check if API is already loaded
        if (window.google && window.google.maps) {
            if (callback) callback();
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=OhioMaps.mapsCallback`;
        script.async = true;
        script.defer = true;
        
        // Add callback to window
        window.OhioMaps = this;
        this.mapsCallback = function() {
            console.log('Google Maps API loaded');
            if (callback) callback();
        };
        
        // Handle errors
        script.onerror = function() {
            console.error('Failed to load Google Maps API');
            document.querySelectorAll('.map-container').forEach(container => {
                OhioMaps.showMapError(container.id, 'Failed to load Google Maps API. Please check your internet connection or contact the site administrator.');
            });
            alert('Map could not be loaded. Please check your internet connection or contact support.');
        };
        
        // Add to document
        document.head.appendChild(script);
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Find all map containers and initialize
    const mapContainers = document.querySelectorAll('.map-container');
    if (mapContainers.length > 0) {
        // Load Google Maps API if not already loaded
        if (!window.google || !window.google.maps) {
            OhioMaps.loadGoogleMapsAPI();
        }
    }
});
