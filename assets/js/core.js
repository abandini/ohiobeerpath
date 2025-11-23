/**
 * Ohio Beer Path - Core JavaScript Module
 * 
 * This module provides core functionality used across the website
 */

// Create namespace to avoid global pollution
const OhioBeerPath = {
    // Configuration
    config: {
        apiEndpoint: '/api/breweries.php',
        defaultMapCenter: { lat: 40.4173, lng: -82.9071 }, // Center of Ohio
        defaultZoom: 7,
        mapStyles: [
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }]
            }
        ]
    },
    
    // Data storage
    data: {
        breweries: [],
        regions: [
            { id: 'northeast', name: 'Northeast Ohio' },
            { id: 'northwest', name: 'Northwest Ohio' },
            { id: 'central', name: 'Central Ohio' },
            { id: 'southeast', name: 'Southeast Ohio' },
            { id: 'southwest', name: 'Southwest Ohio' },
            { id: 'eastcentral', name: 'East Central Ohio' },
            { id: 'westcentral', name: 'West Central Ohio' }
        ],
        breweryTypes: [
            { id: 'micro', name: 'Microbrewery' },
            { id: 'brewpub', name: 'Brewpub' },
            { id: 'regional', name: 'Regional Brewery' },
            { id: 'large', name: 'Large Brewery' },
            { id: 'contract', name: 'Contract Brewery' },
            { id: 'proprietor', name: 'Proprietor Brewery' }
        ],
        itinerary: []
    },
    
    // Map functionality
    map: {
        instance: null,
        markers: [],
        
        /**
         * Initialize Google Map
         * @param {string} elementId - ID of the map container element
         * @param {Object} options - Map options
         * @returns {Object} Google Map instance
         */
        initialize: function(elementId, options = {}) {
            try {
                const mapElement = document.getElementById(elementId);
                
                // Check if map element exists on the page
                if (!mapElement) {
                    console.log('Map element not found, skipping map initialization');
                    return null;
                }
                
                // Check if Google Maps API is loaded
                if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                    throw new Error('Google Maps API not loaded');
                }
                
                // Merge default options with provided options
                const mapOptions = {
                    center: options.center || this.config.defaultMapCenter,
                    zoom: options.zoom || this.config.defaultZoom,
                    styles: options.styles || this.config.mapStyles
                };
                
                // Initialize the map
                this.instance = new google.maps.Map(mapElement, mapOptions);
                
                // Add event listeners
                google.maps.event.addListenerOnce(this.instance, 'idle', () => {
                    console.log('Map loaded successfully');
                });
                
                google.maps.event.addListenerOnce(this.instance, 'error', () => {
                    console.error('Error loading Google Maps');
                    this.handleError('There was an error loading the map');
                });
                
                return this.instance;
            } catch (error) {
                console.error('Error initializing map:', error);
                this.handleError(error.message);
                return null;
            }
        },
        
        /**
         * Handle map errors gracefully
         * @param {string} errorMessage - Error message to display
         */
        handleError: function(errorMessage) {
            const mapElements = document.querySelectorAll('.map-container');
            mapElements.forEach(element => {
                element.innerHTML = `
                    <div class="alert alert-warning text-center p-5">
                        <i class="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
                        <h4>Map Unavailable</h4>
                        <p>We're having trouble loading the map. You can still browse breweries below.</p>
                        <p><small>${errorMessage}</small></p>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">Retry</button>
                    </div>
                `;
                element.style.height = 'auto';
            });
        },
        
        /**
         * Add marker to the map
         * @param {Object} position - Marker position {lat, lng}
         * @param {string} title - Marker title
         * @param {Object} options - Additional marker options
         * @returns {Object} Marker instance
         */
        addMarker: function(position, title, options = {}) {
            if (!this.instance) return null;
            
            const marker = new google.maps.Marker({
                position: position,
                map: this.instance,
                title: title,
                ...options
            });
            
            this.markers.push(marker);
            return marker;
        },
        
        /**
         * Clear all markers from the map
         */
        clearMarkers: function() {
            this.markers.forEach(marker => marker.setMap(null));
            this.markers = [];
        },
        
        /**
         * Fit map bounds to show all markers
         */
        fitBounds: function() {
            if (!this.instance || this.markers.length === 0) return;
            
            const bounds = new google.maps.LatLngBounds();
            this.markers.forEach(marker => bounds.extend(marker.getPosition()));
            this.instance.fitBounds(bounds);
        }
    },
    
    // Brewery functionality
    breweries: {
        /**
         * Load brewery data from API
         * @param {Object} filters - Optional filters for the API
         * @returns {Promise<Array>} Promise resolving to brewery data
         */
        load: async function(filters = {}) {
            try {
                // Show loading indicator
                OhioBeerPath.ui.showLoading(true);
                
                // Build query string from filters
                const queryParams = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) queryParams.append(key, value);
                });
                
                // Fetch data from API
                const url = `${OhioBeerPath.config.apiEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Failed to load brewery data. Status: ${response.status}`);
                }
                
                // Parse response
                const data = await response.json();
                OhioBeerPath.data.breweries = data;
                
                // Dispatch custom event
                document.dispatchEvent(new CustomEvent('breweriesLoaded', { detail: data }));
                
                return data;
            } catch (error) {
                console.error('Error loading brewery data:', error);
                OhioBeerPath.ui.showError('Unable to load brewery data', error.message);
                return [];
            } finally {
                // Hide loading indicator
                OhioBeerPath.ui.showLoading(false);
            }
        },
        
        /**
         * Get a single brewery by ID
         * @param {number} id - Brewery ID
         * @returns {Promise<Object>} Promise resolving to brewery data
         */
        getById: async function(id) {
            try {
                OhioBeerPath.ui.showLoading(true);
                
                const url = `${OhioBeerPath.config.apiEndpoint}?id=${id}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Failed to load brewery. Status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`Error loading brewery #${id}:`, error);
                OhioBeerPath.ui.showError('Unable to load brewery details', error.message);
                return null;
            } finally {
                OhioBeerPath.ui.showLoading(false);
            }
        },
        
        /**
         * Filter breweries based on criteria
         * @param {Array} breweries - Array of breweries to filter
         * @param {Object} filters - Filter criteria
         * @returns {Array} Filtered breweries
         */
        filter: function(breweries, filters = {}) {
            return breweries.filter(brewery => {
                // Filter by region
                if (filters.region && brewery.region !== filters.region) {
                    return false;
                }
                
                // Filter by type
                if (filters.type && brewery.brewery_type !== filters.type) {
                    return false;
                }
                
                // Filter by search term
                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    const nameMatch = brewery.name.toLowerCase().includes(searchTerm);
                    const cityMatch = brewery.city && brewery.city.toLowerCase().includes(searchTerm);
                    const descMatch = brewery.description && brewery.description.toLowerCase().includes(searchTerm);
                    
                    if (!nameMatch && !cityMatch && !descMatch) {
                        return false;
                    }
                }
                
                // Filter by features/amenities
                if (filters.features && filters.features.length > 0) {
                    if (!brewery.features) return false;
                    
                    // Check if brewery has all required features
                    const hasAllFeatures = filters.features.every(feature => 
                        brewery.features.includes(feature)
                    );
                    
                    if (!hasAllFeatures) return false;
                }
                
                return true;
            });
        }
    },
    
    // Itinerary functionality
    itinerary: {
        /**
         * Add brewery to itinerary
         * @param {Object} brewery - Brewery to add
         * @returns {boolean} Success status
         */
        add: function(brewery) {
            // Check if brewery is already in itinerary
            const exists = OhioBeerPath.data.itinerary.some(item => item.id === brewery.id);
            if (exists) return false;
            
            // Add to itinerary
            OhioBeerPath.data.itinerary.push(brewery);
            
            // Save to localStorage
            this.save();
            
            // Update UI
            this.updateDisplay();
            
            return true;
        },
        
        /**
         * Remove brewery from itinerary
         * @param {number} breweryId - ID of brewery to remove
         * @returns {boolean} Success status
         */
        remove: function(breweryId) {
            const initialLength = OhioBeerPath.data.itinerary.length;
            OhioBeerPath.data.itinerary = OhioBeerPath.data.itinerary.filter(item => item.id !== breweryId);
            
            // Save to localStorage
            this.save();
            
            // Update UI
            this.updateDisplay();
            
            return OhioBeerPath.data.itinerary.length < initialLength;
        },
        
        /**
         * Clear entire itinerary
         */
        clear: function() {
            OhioBeerPath.data.itinerary = [];
            
            // Save to localStorage
            this.save();
            
            // Update UI
            this.updateDisplay();
        },
        
        /**
         * Save itinerary to localStorage
         */
        save: function() {
            try {
                localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(OhioBeerPath.data.itinerary));
            } catch (error) {
                console.error('Error saving itinerary to localStorage:', error);
            }
        },
        
        /**
         * Load itinerary from localStorage
         */
        load: function() {
            try {
                const saved = localStorage.getItem('ohioBeerPathItinerary');
                if (saved) {
                    OhioBeerPath.data.itinerary = JSON.parse(saved);
                    this.updateDisplay();
                }
            } catch (error) {
                console.error('Error loading itinerary from localStorage:', error);
            }
        },
        
        /**
         * Update itinerary display in the UI
         */
        updateDisplay: function() {
            const itineraryList = document.getElementById('itineraryList');
            if (!itineraryList) return;
            
            // Clear current list
            itineraryList.innerHTML = '';
            
            if (OhioBeerPath.data.itinerary.length === 0) {
                itineraryList.innerHTML = '<div class="alert alert-info">Your brewery tour itinerary is empty. Add breweries from the list.</div>';
                return;
            }
            
            // Add each brewery to the list
            OhioBeerPath.data.itinerary.forEach(brewery => {
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    <div>
                        <strong>${brewery.name}</strong>
                        <p class="mb-0 text-muted small">${brewery.city || ''}, OH</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger remove-brewery" data-brewery-id="${brewery.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                `;
                
                // Add event listener for remove button
                const removeButton = item.querySelector('.remove-brewery');
                if (removeButton) {
                    removeButton.addEventListener('click', function() {
                        const breweryId = this.getAttribute('data-brewery-id');
                        OhioBeerPath.itinerary.remove(breweryId);
                    });
                }
                
                itineraryList.appendChild(item);
            });
            
            // Update any "Add to Itinerary" buttons
            this.updateAddButtons();
        },
        
        /**
         * Update "Add to Itinerary" buttons based on current itinerary
         */
        updateAddButtons: function() {
            const addButtons = document.querySelectorAll('.add-to-itinerary');
            
            addButtons.forEach(button => {
                const breweryId = button.getAttribute('data-brewery-id');
                const isInItinerary = OhioBeerPath.data.itinerary.some(item => item.id === breweryId);
                
                if (isInItinerary) {
                    button.classList.add('btn-success');
                    button.classList.remove('btn-outline-primary');
                    button.innerHTML = '<i class="bi bi-check"></i> Added';
                    button.disabled = true;
                } else {
                    button.classList.remove('btn-success');
                    button.classList.add('btn-outline-primary');
                    button.innerHTML = '<i class="bi bi-plus"></i> Add to Tour';
                    button.disabled = false;
                }
            });
        }
    },
    
    // UI utilities
    ui: {
        /**
         * Show or hide loading spinner
         * @param {boolean} show - Whether to show or hide the spinner
         */
        showLoading: function(show) {
            const spinner = document.getElementById('loadingSpinner');
            if (!spinner) return;
            
            if (show) {
                spinner.classList.remove('d-none');
            } else {
                spinner.classList.add('d-none');
            }
        },
        
        /**
         * Show error message
         * @param {string} title - Error title
         * @param {string} message - Error message
         * @param {string} containerId - ID of container to show error in
         */
        showError: function(title, message, containerId = null) {
            const errorHtml = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">${title}</h4>
                    <p>${message}</p>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">Retry</button>
                </div>
            `;
            
            // If container ID provided, show error there
            if (containerId) {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = errorHtml;
                    return;
                }
            }
            
            // Otherwise find a suitable container
            const containers = [
                document.getElementById('breweriesList'),
                document.getElementById('featuredBreweries'),
                document.querySelector('.container')
            ];
            
            for (const container of containers) {
                if (container) {
                    container.innerHTML = errorHtml;
                    break;
                }
            }
        },
        
        /**
         * Format phone number for display
         * @param {string} phone - Raw phone number
         * @returns {string} Formatted phone number
         */
        formatPhone: function(phone) {
            if (!phone) return '';
            
            // Strip non-numeric characters
            const cleaned = phone.replace(/\D/g, '');
            
            // Format as (XXX) XXX-XXXX
            if (cleaned.length === 10) {
                return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
            }
            
            return phone;
        }
    },
    
    // Geolocation utilities
    geo: {
        /**
         * Get user's current location
         * @returns {Promise<Object>} Promise resolving to location {lat, lng}
         */
        getCurrentLocation: function() {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation is not supported by your browser'));
                    return;
                }
                
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    error => {
                        reject(new Error(`Unable to retrieve your location: ${error.message}`));
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            });
        },
        
        /**
         * Calculate distance between two points using Haversine formula
         * @param {number} lat1 - Latitude of first point
         * @param {number} lon1 - Longitude of first point
         * @param {number} lat2 - Latitude of second point
         * @param {number} lon2 - Longitude of second point
         * @returns {number} Distance in miles
         */
        calculateDistance: function(lat1, lon1, lat2, lon2) {
            const R = 3959; // Earth's radius in miles
            const dLat = this.toRad(lat2 - lat1);
            const dLon = this.toRad(lon2 - lon1);
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        },
        
        /**
         * Convert degrees to radians
         * @param {number} degrees - Angle in degrees
         * @returns {number} Angle in radians
         */
        toRad: function(degrees) {
            return degrees * (Math.PI/180);
        },
        
        /**
         * Get coordinates from address using Google Geocoding API
         * @param {string} address - Address to geocode
         * @returns {Promise<Object>} Promise resolving to location {lat, lng}
         */
        getCoordinates: function(address) {
            return new Promise((resolve, reject) => {
                if (!address) {
                    reject(new Error('Address is required'));
                    return;
                }
                
                if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                    reject(new Error('Google Maps API not loaded'));
                    return;
                }
                
                const geocoder = new google.maps.Geocoder();
                
                geocoder.geocode(
                    { 
                        address: address + ', Ohio, USA',
                        region: 'US'
                    }, 
                    (results, status) => {
                        if (status === 'OK' && results[0]) {
                            const location = results[0].geometry.location;
                            resolve({
                                lat: location.lat(),
                                lng: location.lng()
                            });
                        } else {
                            reject(new Error(`Geocoding failed: ${status}`));
                        }
                    }
                );
            });
        }
    },
    
    // Initialize the application
    init: function() {
        // Load itinerary from localStorage
        this.itinerary.load();
        
        // Add event listeners
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Ohio Beer Path initialized');
            
            // Initialize map if element exists
            const mapElement = document.getElementById('map');
            if (mapElement) {
                this.map.initialize('map');
            }
        });
    }
};

// Initialize the application
OhioBeerPath.init();
