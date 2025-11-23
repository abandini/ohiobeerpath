// JavaScript for Ohio regions map functionality

// Define the regions with their coordinates (approximate centroids)
const ohioRegions = {
    'northeast': {
        name: 'Northeast Ohio',
        center: { lat: 41.4, lng: -81.0 },
        polygonCoords: [
            { lat: 41.9, lng: -80.5 }, // Northeast corner
            { lat: 41.9, lng: -81.5 },
            { lat: 40.5, lng: -81.5 },
            { lat: 40.5, lng: -80.5 }  // Southeast corner
        ],
        color: '#0d6efd', // primary
        description: 'Cleveland, Akron, Canton, Youngstown'
    },
    'eastcentral': {
        name: 'East Central Ohio',
        center: { lat: 40.5, lng: -81.8 },
        polygonCoords: [
            { lat: 41.5, lng: -81.5 }, // Northeast corner
            { lat: 41.5, lng: -82.5 },
            { lat: 39.8, lng: -82.5 },
            { lat: 39.8, lng: -81.5 }  // Southeast corner
        ],
        color: '#fd7e14', // orange
        description: 'New Philadelphia, Dover, Zanesville, Cambridge'
    },
    'northwest': {
        name: 'Northwest Ohio',
        center: { lat: 41.4, lng: -83.8 },
        polygonCoords: [
            { lat: 41.9, lng: -82.5 }, // Northeast corner
            { lat: 41.9, lng: -84.8 },
            { lat: 40.5, lng: -84.8 },
            { lat: 40.5, lng: -82.5 }  // Southeast corner
        ],
        color: '#0dcaf0', // info
        description: 'Toledo, Findlay, Bowling Green, Sandusky'
    },
    'central': {
        name: 'Central Ohio',
        center: { lat: 40.0, lng: -82.8 },
        polygonCoords: [
            { lat: 40.5, lng: -82.5 }, // Northeast corner
            { lat: 40.5, lng: -83.2 },
            { lat: 39.5, lng: -83.2 },
            { lat: 39.5, lng: -82.5 }  // Southeast corner
        ],
        color: '#198754', // success
        description: 'Columbus, Delaware, Lancaster, Newark'
    },
    'westcentral': {
        name: 'West Central Ohio',
        center: { lat: 40.0, lng: -84.0 },
        polygonCoords: [
            { lat: 40.5, lng: -83.2 }, // Northeast corner
            { lat: 40.5, lng: -84.8 },
            { lat: 39.5, lng: -84.8 },
            { lat: 39.5, lng: -83.2 }  // Southeast corner
        ],
        color: '#6c757d', // secondary
        description: 'Springfield, Lima, Troy, Bellefontaine'
    },
    'southwest': {
        name: 'Southwest Ohio',
        center: { lat: 39.1, lng: -84.5 },
        polygonCoords: [
            { lat: 39.5, lng: -83.2 }, // Northeast corner
            { lat: 39.5, lng: -84.8 },
            { lat: 38.4, lng: -84.8 },
            { lat: 38.4, lng: -83.2 }  // Southeast corner
        ],
        color: '#dc3545', // danger
        description: 'Cincinnati, Dayton, Hamilton, Oxford'
    },
    'southeast': {
        name: 'Southeast Ohio',
        center: { lat: 39.1, lng: -81.5 },
        polygonCoords: [
            { lat: 39.5, lng: -81.5 }, // Northeast corner
            { lat: 39.5, lng: -83.2 },
            { lat: 38.4, lng: -83.2 },
            { lat: 38.4, lng: -81.5 },
            { lat: 38.4, lng: -80.5 },
            { lat: 39.5, lng: -80.5 }  // Southeast extended corner
        ],
        color: '#ffc107', // warning
        description: 'Athens, Marietta, Portsmouth, McConnelsville'
    }
};

// Initialize the map
function initMap() {
    // Ohio centered map
    const map = new google.maps.Map(document.getElementById('ohioMap'), {
        center: { lat: 40.4, lng: -82.5 },
        zoom: 7,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_LEFT
        }
    });
    
    // Add polygons for each region
    for (const [regionId, region] of Object.entries(ohioRegions)) {
        const regionPolygon = new google.maps.Polygon({
            paths: region.polygonCoords,
            strokeColor: region.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: region.color,
            fillOpacity: 0.35,
        });
        
        regionPolygon.setMap(map);
        
        // Add click event to polygon
        regionPolygon.addListener('click', function() {
            document.location.hash = regionId;
            document.getElementById(regionId).scrollIntoView({ behavior: 'smooth' });
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="text-align:center">
                        <strong>${region.name}</strong><br>
                        <small>${region.description}</small><br>
                        <a href="#${regionId}" class="btn btn-sm btn-outline-primary mt-2">View Breweries</a>
                      </div>`
        });
        
        // Add a marker at the center of each region
        const marker = new google.maps.Marker({
            position: region.center,
            map: map,
            title: region.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
            }
        });
        
        // Open info window on marker click
        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        });
        
        // Open info window on polygon click
        regionPolygon.addListener('click', function(event) {
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        });
    }
}

// Make sure the map is initialized when the page loads
window.initMap = initMap;
