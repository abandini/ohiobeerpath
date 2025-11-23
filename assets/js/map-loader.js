/**
 * Map Loader for Ohio Beer Path
 * Handles map initialization and error recovery
 */

const OhioBeerPathMap = {
    mapInstance: null,
    markers: [],
    bounds: null,
    
    /**
     * Initialize the map with error handling
     */
    init: function(elementId, options = {}) {
        // Default map options
        const defaultOptions = {
            center: { lat: 40.4173, lng: -82.9071 }, // Center of Ohio
            zoom: 7,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false
        };
        
        // Merge options
        const mapOptions = { ...defaultOptions, ...options };
        
        try {
            // Check if map element exists
            const mapElement = document.getElementById(elementId);
            if (!mapElement) {
                console.error('Map element not found:', elementId);
                this.showMapError('Map container not found');
                return false;
            }
            
            // Initialize the map
            this.mapInstance = new google.maps.Map(mapElement, mapOptions);
            this.bounds = new google.maps.LatLngBounds();
            
            // Add event listener for when the map is idle (fully loaded)
            google.maps.event.addListenerOnce(this.mapInstance, 'idle', () => {
                console.log('Map fully loaded');
                // Hide any loading indicators
                const loadingElement = document.getElementById('mapLoading');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapError('Could not initialize map: ' + error.message);
            return false;
        }
    },
    
    /**
     * Add a marker to the map
     */
    addMarker: function(position, title, content, options = {}) {
        if (!this.mapInstance) {
            console.error('Map not initialized');
            return null;
        }
        
        try {
            const marker = new google.maps.Marker({
                position: position,
                map: this.mapInstance,
                title: title,
                animation: options.animation || null,
                icon: options.icon || null
            });
            
            // Add to markers array
            this.markers.push(marker);
            
            // Extend bounds to include this marker
            this.bounds.extend(position);
            
            // Add info window if content provided
            if (content) {
                const infoWindow = new google.maps.InfoWindow({
                    content: content
                });
                
                marker.addListener('click', () => {
                    infoWindow.open(this.mapInstance, marker);
                });
                
                // Auto-open if specified
                if (options.openInfoWindow) {
                    infoWindow.open(this.mapInstance, marker);
                }
            }
            
            return marker;
        } catch (error) {
            console.error('Error adding marker:', error);
            return null;
        }
    },
    
    /**
     * Fit map to show all markers
     */
    fitBounds: function() {
        if (!this.mapInstance || this.markers.length === 0) {
            return;
        }
        
        this.mapInstance.fitBounds(this.bounds);
        
        // If only one marker, zoom out a bit
        if (this.markers.length === 1) {
            this.mapInstance.setZoom(14);
        }
    },
    
    /**
     * Clear all markers from the map
     */
    clearMarkers: function() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
        this.bounds = new google.maps.LatLngBounds();
    },
    
    /**
     * Show error message in the map container
     */
    showMapError: function(message) {
        const mapContainers = document.querySelectorAll('.map-container');
        mapContainers.forEach(container => {
            container.innerHTML = `
                <div class="map-error-container">
                    <div class="alert alert-warning text-center">
                        <i class="bi bi-exclamation-triangle-fill fs-3 mb-2"></i>
                        <h5>Map Unavailable</h5>
                        <p>${message || "We're having trouble loading the map. You can still browse breweries below."}</p>
                        <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">Retry</button>
                    </div>
                </div>
            `;
        });
    },
    
    /**
     * Load Google Maps API dynamically
     */
    loadGoogleMapsAPI: function(apiKey, callback) {
        // Check if API is already loaded
        if (window.google && window.google.maps) {
            if (callback) callback();
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=OhioBeerPathMap.mapsCallback`;
        script.async = true;
        script.defer = true;
        
        // Add callback to window
        window.OhioBeerPathMap = this;
        this.mapsCallback = function() {
            console.log('Google Maps API loaded');
            if (callback) callback();
        };
        
        // Handle errors
        script.onerror = function() {
            console.error('Failed to load Google Maps API');
            OhioBeerPathMap.showMapError('Failed to load Google Maps API');
        };
        
        // Add to document
        document.head.appendChild(script);
    }
};

// Make available globally
window.OhioBeerPathMap = OhioBeerPathMap;
