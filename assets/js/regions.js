// Global variables
let map;
let regionPolygons = [];

// Initialize the map when the page loads
function initMap() {
    // Create the map centered on Ohio
    map = new google.maps.Map(document.getElementById('ohioMap'), {
        center: { lat: 40.4173, lng: -82.9071 }, // Center of Ohio
        zoom: 7,
        mapTypeId: 'terrain',
        styles: [
            {
                featureType: "administrative.locality",
                elementType: "labels",
                stylers: [{ visibility: "on" }]
            },
            {
                featureType: "administrative.neighborhood",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    // Add region polygons
    addRegionPolygons();
}

// Add polygons for each Ohio brewing region
function addRegionPolygons() {
    // Define region coordinates (simplified for demonstration)
    const regions = {
        northeast: [
            { lat: 41.5, lng: -81.7 }, // Cleveland area
            { lat: 41.5, lng: -80.6 }, // Eastern border
            { lat: 40.8, lng: -80.6 }, // Youngstown area
            { lat: 40.8, lng: -81.7 }, // Canton/Akron area
        ],
        central: [
            { lat: 40.8, lng: -83.0 }, // Northwest corner
            { lat: 40.8, lng: -81.7 }, // Northeast corner
            { lat: 39.8, lng: -81.7 }, // Southeast corner
            { lat: 39.8, lng: -83.0 }, // Southwest corner
        ],
        southwest: [
            { lat: 39.8, lng: -84.5 }, // Northwest corner
            { lat: 39.8, lng: -83.0 }, // Northeast corner
            { lat: 38.8, lng: -83.0 }, // Southeast corner
            { lat: 38.8, lng: -84.5 }, // Southwest corner
        ],
        northwest: [
            { lat: 41.7, lng: -84.8 }, // Northwest corner
            { lat: 41.7, lng: -83.0 }, // Northeast corner
            { lat: 40.8, lng: -83.0 }, // Southeast corner
            { lat: 40.8, lng: -84.8 }, // Southwest corner
        ],
        southeast: [
            { lat: 40.8, lng: -81.7 }, // Northwest corner
            { lat: 40.8, lng: -80.6 }, // Northeast corner
            { lat: 38.8, lng: -80.6 }, // Southeast corner
            { lat: 38.8, lng: -83.0 }, // Southwest corner
            { lat: 39.8, lng: -83.0 }, // Central west
            { lat: 39.8, lng: -81.7 }, // Central east
        ]
    };

    // Define colors for each region
    const regionColors = {
        northeast: '#0d6efd', // primary
        central: '#198754',   // success
        southwest: '#dc3545', // danger
        northwest: '#0dcaf0', // info
        southeast: '#ffc107'  // warning
    };

    // Create polygons for each region
    Object.keys(regions).forEach(regionName => {
        const polygon = new google.maps.Polygon({
            paths: regions[regionName],
            strokeColor: regionColors[regionName],
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: regionColors[regionName],
            fillOpacity: 0.35,
            map: map
        });

        // Add click event to navigate to region section
        polygon.addListener('click', () => {
            // Scroll to the region section
            document.getElementById(regionName).scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            // Highlight the region card
            highlightRegionCard(regionName);
        });

        // Add mouseover event to highlight region
        polygon.addListener('mouseover', () => {
            polygon.setOptions({
                fillOpacity: 0.6,
                strokeWeight: 3
            });
        });

        // Add mouseout event to reset highlight
        polygon.addListener('mouseout', () => {
            polygon.setOptions({
                fillOpacity: 0.35,
                strokeWeight: 2
            });
        });

        regionPolygons.push(polygon);
    });

    // Add region labels
    addRegionLabels();
}

// Add labels for each region
function addRegionLabels() {
    const regionCenters = {
        northeast: { lat: 41.1, lng: -81.2, label: 'Northeast Ohio' },
        central: { lat: 40.3, lng: -82.4, label: 'Central Ohio' },
        southwest: { lat: 39.3, lng: -83.8, label: 'Southwest Ohio' },
        northwest: { lat: 41.2, lng: -83.9, label: 'Northwest Ohio' },
        southeast: { lat: 39.6, lng: -81.2, label: 'Southeast Ohio' }
    };

    Object.keys(regionCenters).forEach(regionName => {
        const center = regionCenters[regionName];
        
        // Create marker for region label
        new google.maps.Marker({
            position: { lat: center.lat, lng: center.lng },
            map: map,
            label: {
                text: center.label,
                color: '#000000',
                fontSize: '12px',
                fontWeight: 'bold'
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
            }
        });
    });
}

// Highlight the selected region card
function highlightRegionCard(regionName) {
    // Remove highlight from all cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('border-primary', 'border-3');
    });
    
    // Add highlight to selected card
    const card = document.getElementById(regionName).querySelector('.card');
    card.classList.add('border-primary', 'border-3');
    
    // Scroll effect
    setTimeout(() => {
        card.classList.remove('border-primary', 'border-3');
    }, 2000);
}

// Handle click on region links
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to region links
    const regionLinks = document.querySelectorAll('a[href^="breweries.php?region="]');
    regionLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // Extract region name from href
            const regionName = link.href.split('=')[1];
            
            // Store region filter in localStorage for breweries page
            localStorage.setItem('ohioBeerPathRegionFilter', regionName);
        });
    });
    
    // Add event listeners to trail links
    const trailLinks = document.querySelectorAll('a[href^="itinerary.php?trail="]');
    trailLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // Extract trail name from href
            const trailName = link.href.split('=')[1];
            
            // Store trail name in localStorage for itinerary page
            localStorage.setItem('ohioBeerPathSelectedTrail', trailName);
        });
    });
});
