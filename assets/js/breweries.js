// Global variables
let breweriesData = [];
let filteredBreweries = [];
let currentPage = 1;
let breweriesPerPage = 12;
let selectedBrewery = null;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Load brewery data
    await loadBreweryData();
    
    // Set up event listeners
    setupEventListeners();
});

// Assign regions to breweries based on city or county
function assignRegionsToBreweries() {
    // Define cities/counties for each region
    const regionMap = {
        // Northeast Ohio
        northeast: ['Cleveland', 'Akron', 'Canton', 'Youngstown', 'Cuyahoga', 'Summit', 'Portage', 'Stark', 'Mahoning', 'Trumbull', 'Ashtabula', 'Lake', 'Geauga', 'Medina', 'Wayne', 'Lorain'],
        
        // East Central Ohio
        eastcentral: ['New Philadelphia', 'Dover', 'Cambridge', 'Zanesville', 'Coshocton', 'Millersburg', 'Tuscarawas', 'Coshocton', 'Holmes', 'Harrison', 'Carroll', 'Guernsey', 'Muskingum'],
        
        // Northwest Ohio
        northwest: ['Toledo', 'Findlay', 'Bowling Green', 'Sandusky', 'Lucas', 'Wood', 'Hancock', 'Erie', 'Huron', 'Ottawa', 'Seneca', 'Sandusky', 'Williams', 'Fulton', 'Henry', 'Defiance', 'Paulding', 'Putnam', 'Van Wert'],
        
        // Central Ohio
        central: ['Columbus', 'Delaware', 'Lancaster', 'Newark', 'Franklin', 'Delaware', 'Licking', 'Fairfield', 'Pickaway', 'Madison', 'Union', 'Marion', 'Morrow', 'Knox', 'Crawford'],
        
        // West Central Ohio
        westcentral: ['Springfield', 'Lima', 'Troy', 'Bellefontaine', 'Clark', 'Miami', 'Shelby', 'Auglaize', 'Mercer', 'Darke', 'Logan', 'Champaign', 'Hardin', 'Allen'],
        
        // Southwest Ohio
        southwest: ['Cincinnati', 'Dayton', 'Hamilton', 'Oxford', 'Hamilton', 'Butler', 'Warren', 'Clermont', 'Brown', 'Clinton', 'Greene', 'Montgomery', 'Preble'],
        
        // Southeast Ohio
        southeast: ['Athens', 'Marietta', 'Portsmouth', 'Chillicothe', 'Athens', 'Washington', 'Scioto', 'Ross', 'Pike', 'Jackson', 'Gallia', 'Meigs', 'Vinton', 'Hocking', 'Perry', 'Morgan', 'Noble', 'Monroe', 'Belmont', 'Jefferson', 'Highland', 'Adams', 'Lawrence']
    };
    
    // Assign region to each brewery
    breweriesData.forEach(brewery => {
        if (!brewery.region) {
            const city = brewery.city ? brewery.city.toLowerCase() : '';
            const address = brewery.address ? brewery.address.toLowerCase() : '';
            
            // Check each region
            for (const [region, locations] of Object.entries(regionMap)) {
                // Check if the brewery's city or address contains any of the region's locations
                if (locations.some(location => 
                    city.includes(location.toLowerCase()) || 
                    address.includes(location.toLowerCase())
                )) {
                    brewery.region = region;
                    break;
                }
            }
        }
    });
}

// Load brewery data from JSON file
async function loadBreweryData() {
    try {
        // Try multiple possible locations for the breweries.json file
        let response;
        let jsonData;
        
        try {
            // Try root path first
            response = await fetch('breweries.json');
            if (response.ok) {
                jsonData = await response.json();
                console.log('Loaded breweries from root path');
            }
        } catch (e) {
            console.log('Failed to load from root path:', e);
        }
        
        if (!jsonData) {
            try {
                // Try data directory path
                response = await fetch('assets/data/breweries.json');
                if (response.ok) {
                    jsonData = await response.json();
                    console.log('Loaded breweries from assets/data path');
                }
            } catch (e) {
                console.log('Failed to load from assets/data path:', e);
            }
        }
        
        if (!jsonData) {
            try {
                // Try relative path for deeper pages
                response = await fetch('../breweries.json');
                if (response.ok) {
                    jsonData = await response.json();
                    console.log('Loaded breweries from relative root path');
                }
            } catch (e) {
                console.log('Failed to load from relative root path:', e);
            }
        }
        
        if (!jsonData) {
            throw new Error('Could not load brewery data from any location');
        }
        
        breweriesData = jsonData;
        console.log('Successfully loaded', breweriesData.length, 'breweries');
        
        // Set regions for breweries based on city
        assignRegionsToBreweries();
        
        // Check if there's a region parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const regionParam = urlParams.get('region');
        if (regionParam) {
            console.log('Found region parameter in URL:', regionParam);
            document.getElementById('regionFilter').value = regionParam;
        }
        
        // Apply initial filtering
        filterBreweries();
    } catch (error) {
        console.error('Error loading brewery data:', error);
        document.getElementById('breweriesList').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Error loading brewery data. Please try refreshing the page.
                </div>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Filter button click
    document.getElementById('filterButton').addEventListener('click', filterBreweries);
    
    // Search input (filter as you type)
    document.getElementById('searchInput').addEventListener('input', debounce(filterBreweries, 300));
    
    // Region and type filters
    document.getElementById('regionFilter').addEventListener('change', filterBreweries);
    document.getElementById('typeFilter').addEventListener('change', filterBreweries);
    
    // Amenity checkboxes
    const amenityCheckboxes = document.querySelectorAll('#amenityFilters input[type="checkbox"]');
    amenityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterBreweries);
    });
    
    // Load more button
    document.getElementById('loadMoreButton').addEventListener('click', loadMoreBreweries);
}

// Debounce function to limit how often a function is called
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Filter breweries based on user selections
function filterBreweries() {
    // Get filter values
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let regionFilter = document.getElementById('regionFilter').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value.toLowerCase();
    
    // Check URL parameters for region filter
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region');
    if (regionParam && regionFilter === '') {
        regionFilter = regionParam.toLowerCase();
        console.log('Setting region filter from URL parameter:', regionFilter);
        // Update the select element to match the URL parameter
        document.getElementById('regionFilter').value = regionFilter;
    }
    
    // Debug logging
    console.log('Active filters - Region:', regionFilter, 'Type:', typeFilter, 'Search:', searchTerm);
    
    // Count breweries per region for debugging
    const regionCounts = {};
    breweriesData.forEach(brewery => {
        if (brewery.region) {
            const region = brewery.region.toLowerCase();
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        } else {
            regionCounts['unassigned'] = (regionCounts['unassigned'] || 0) + 1;
        }
    });
    console.log('Breweries per region:', regionCounts);
    
    // Get selected amenities
    const selectedAmenities = [];
    const amenityCheckboxes = document.querySelectorAll('#amenityFilters input[type="checkbox"]:checked');
    amenityCheckboxes.forEach(checkbox => {
        selectedAmenities.push(checkbox.value);
    });
    
    // Apply filters
    filteredBreweries = breweriesData.filter(brewery => {
        // Search term filter (name or city)
        const matchesSearch = searchTerm === '' || 
            (brewery.name && brewery.name.toLowerCase().includes(searchTerm)) || 
            (brewery.city && brewery.city.toLowerCase().includes(searchTerm));
            
        // Region filter
        const matchesRegion = regionFilter === '' || 
            (brewery.region && brewery.region.toLowerCase() === regionFilter);
        
        // Debug output if we're filtering by region but not matching
        if (regionFilter !== '' && brewery.region && brewery.region.toLowerCase() !== regionFilter) {
            console.log(`Brewery ${brewery.name} has region ${brewery.region} which doesn't match filter ${regionFilter}`);
        }
            
        // Type filter
        const matchesType = typeFilter === '' || 
            (brewery.brewery_type && brewery.brewery_type.toLowerCase() === typeFilter);
            
        // Amenities filter
        let matchesAmenities = true;
        if (selectedAmenities.length > 0) {
            matchesAmenities = selectedAmenities.every(amenity => 
                brewery.amenities && brewery.amenities.includes(amenity)
            );
        }
            
        return matchesSearch && matchesRegion && matchesType && matchesAmenities;
    });
    
    console.log(`Filtered breweries: ${filteredBreweries.length} out of ${breweriesData.length} total`);
    
    // Reset pagination
    currentPage = 1;
    
    // Display breweries
    displayBreweries();
    
    // Update the result count
    document.getElementById('resultCount').textContent = filteredBreweries.length;
}

// Display breweries with pagination
function displayBreweries() {
    const breweriesList = document.getElementById('breweriesList');
    const loadMoreButton = document.getElementById('loadMoreButton');
    
    // Clear the list if this is the first page
    if (currentPage === 1) {
        breweriesList.innerHTML = '';
    }
    
    // Calculate start and end indices for the current page
    const startIndex = (currentPage - 1) * breweriesPerPage;
    const endIndex = Math.min(startIndex + breweriesPerPage, filteredBreweries.length);
    
    // Get breweries for the current page
    const breweriesForPage = filteredBreweries.slice(startIndex, endIndex);
    
    if (filteredBreweries.length === 0) {
        breweriesList.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="alert alert-info">
                    No breweries found matching your criteria. Try adjusting your filters.
                </div>
            </div>
        `;
        loadMoreButton.classList.add('d-none');
        return;
    }
    
    // Add each brewery to the list
    breweriesForPage.forEach(brewery => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        
        // Determine brewery type display name
        let breweryTypeDisplay = 'Craft Brewery';
        if (brewery.brewery_type) {
            switch(brewery.brewery_type.toLowerCase()) {
                case 'micro':
                    breweryTypeDisplay = 'Microbrewery';
                    break;
                case 'brewpub':
                    breweryTypeDisplay = 'Brewpub';
                    break;
                case 'regional':
                    breweryTypeDisplay = 'Regional Brewery';
                    break;
                case 'large':
                    breweryTypeDisplay = 'Large Brewery';
                    break;
                case 'contract':
                    breweryTypeDisplay = 'Contract Brewery';
                    break;
                default:
                    breweryTypeDisplay = 'Craft Brewery';
            }
        }
        
        // Create amenities badges if available
        let amenitiesBadges = '';
        if (brewery.amenities && brewery.amenities.length > 0) {
            const amenityIcons = {
                'food': '<i class="bi bi-cup-hot"></i> Food',
                'outdoor': '<i class="bi bi-tree"></i> Outdoor',
                'tours': '<i class="bi bi-people"></i> Tours',
                'dog_friendly': '<i class="bi bi-emoji-smile"></i> Dog Friendly',
                'family_friendly': '<i class="bi bi-people-fill"></i> Family Friendly'
            };
            
            amenitiesBadges = '<div class="mt-2">';
            brewery.amenities.forEach(amenity => {
                if (amenityIcons[amenity]) {
                    amenitiesBadges += `<span class="badge bg-light text-dark me-1 mb-1">${amenityIcons[amenity]}</span>`;
                }
            });
            amenitiesBadges += '</div>';
        }
        
        card.innerHTML = `
            <div class="card h-100 brewery-card">
                <div class="card-body">
                    <h3 class="card-title h5">${brewery.name}</h3>
                    <p class="card-text text-muted">${brewery.city}, OH</p>
                    <p class="card-text small">${breweryTypeDisplay}</p>
                    ${amenitiesBadges}
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="showBreweryDetails(${brewery.id})">
                            View Details
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="addToItinerary(${brewery.id})">
                            <i class="bi bi-plus"></i> Add to Tour
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        breweriesList.appendChild(card);
    });
    
    // Show/hide load more button based on whether there are more results
    if (endIndex < filteredBreweries.length) {
        loadMoreButton.classList.remove('d-none');
    } else {
        loadMoreButton.classList.add('d-none');
    }
}

// Load more breweries (next page)
function loadMoreBreweries() {
    currentPage++;
    displayBreweries();
}

// Show brewery details in modal
function showBreweryDetails(breweryId) {
    // Find the brewery in the data
    const brewery = breweriesData.find(b => b.id === breweryId);
    if (!brewery) return;
    
    // Store the selected brewery for the Add to Itinerary button
    selectedBrewery = brewery;
    
    // Update modal title
    document.getElementById('breweryName').textContent = brewery.name;
    
    // Determine brewery type display name
    let breweryTypeDisplay = 'Craft Brewery';
    if (brewery.brewery_type) {
        switch(brewery.brewery_type.toLowerCase()) {
            case 'micro':
                breweryTypeDisplay = 'Microbrewery';
                break;
            case 'brewpub':
                breweryTypeDisplay = 'Brewpub';
                break;
            case 'regional':
                breweryTypeDisplay = 'Regional Brewery';
                break;
            case 'large':
                breweryTypeDisplay = 'Large Brewery';
                break;
            case 'contract':
                breweryTypeDisplay = 'Contract Brewery';
                break;
            default:
                breweryTypeDisplay = 'Craft Brewery';
        }
    }
    
    // Create amenities badges if available
    let amenitiesBadges = '<p>No amenities information available</p>';
    if (brewery.amenities && brewery.amenities.length > 0) {
        const amenityLabels = {
            'food': 'Food Service',
            'outdoor': 'Outdoor Seating',
            'tours': 'Brewery Tours',
            'dog_friendly': 'Dog Friendly',
            'family_friendly': 'Family Friendly',
            'live_music': 'Live Music',
            'merchandise': 'Merchandise Shop',
            'private_events': 'Private Events',
            'wifi': 'Free WiFi'
        };
        
        amenitiesBadges = '<div class="d-flex flex-wrap gap-2 mb-3">';
        brewery.amenities.forEach(amenity => {
            const label = amenityLabels[amenity] || amenity;
            amenitiesBadges += `<span class="badge bg-success">${label}</span>`;
        });
        amenitiesBadges += '</div>';
    }
    
    // Format hours if available
    let hoursHtml = '<p>Hours information not available</p>';
    if (brewery.hours && Object.keys(brewery.hours).length > 0) {
        hoursHtml = '<table class="table table-sm"><tbody>';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        days.forEach(day => {
            const hours = brewery.hours[day.toLowerCase()] || 'Closed';
            hoursHtml += `
                <tr>
                    <td><strong>${day}</strong></td>
                    <td>${hours}</td>
                </tr>
            `;
        });
        
        hoursHtml += '</tbody></table>';
    }
    
    // Build the details HTML
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <h4 class="h6">Location</h4>
                <p>${brewery.address || 'Address not available'}</p>
                <p>${brewery.city}, OH ${brewery.postal_code || ''}</p>
                
                <h4 class="h6 mt-4">Contact</h4>
                <p>${brewery.phone ? `Phone: ${brewery.phone}` : 'Phone not available'}</p>
                ${brewery.website ? `<p><a href="${brewery.website}" target="_blank">Visit Website</a></p>` : ''}
                
                <h4 class="h6 mt-4">Type</h4>
                <p>${breweryTypeDisplay}</p>
            </div>
            <div class="col-md-6">
                <h4 class="h6">Hours</h4>
                ${hoursHtml}
                
                <h4 class="h6 mt-4">Amenities</h4>
                ${amenitiesBadges}
            </div>
        </div>
        
        ${brewery.description ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h4 class="h6">About</h4>
                    <p>${brewery.description}</p>
                </div>
            </div>
        ` : ''}
        
        <div class="row mt-3">
            <div class="col-12">
                <div id="breweryMap" style="height: 300px;"></div>
            </div>
        </div>
    `;
    
    // Update modal content
    document.getElementById('breweryDetails').innerHTML = detailsHtml;
    
    // Initialize map if coordinates are available
    if (brewery.latitude && brewery.longitude) {
        setTimeout(() => {
            initBreweryMap(brewery);
        }, 500);
    }
    
    // Update the Add to Itinerary button
    const addToItineraryButton = document.getElementById('addToItineraryButton');
    addToItineraryButton.onclick = () => addToItinerary(brewery.id);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('breweryDetailModal'));
    modal.show();
}

// Initialize the map in the brewery details modal
function initBreweryMap(brewery) {
    const mapElement = document.getElementById('breweryMap');
    if (!mapElement) return;
    
    const position = { 
        lat: parseFloat(brewery.latitude), 
        lng: parseFloat(brewery.longitude) 
    };
    
    const map = new google.maps.Map(mapElement, {
        center: position,
        zoom: 15
    });
    
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: brewery.name
    });
    
    const infowindow = new google.maps.InfoWindow({
        content: `
            <div class="marker-info">
                <h6>${brewery.name}</h6>
                <p>${brewery.address || brewery.city + ', OH'}</p>
            </div>
        `
    });
    
    marker.addListener('click', () => {
        infowindow.open(map, marker);
    });
    
    // Open info window by default
    infowindow.open(map, marker);
}

// Add brewery to itinerary
function addToItinerary(breweryId) {
    const brewery = breweriesData.find(b => b.id === breweryId);
    if (!brewery) return;
    
    // Get existing itinerary from localStorage or initialize empty array
    let itinerary = [];
    const savedItineraryJSON = localStorage.getItem('ohioBeerPathItinerary');
    if (savedItineraryJSON) {
        try {
            itinerary = JSON.parse(savedItineraryJSON);
        } catch (e) {
            console.error('Error parsing saved itinerary:', e);
            itinerary = [];
        }
    }
    
    // Check if brewery is already in itinerary
    const isInItinerary = itinerary.some(item => item.id == breweryId);
    if (isInItinerary) {
        alert(`${brewery.name} is already in your itinerary.`);
        return;
    }
    
    // Add brewery to itinerary
    itinerary.push(brewery);
    
    // Save updated itinerary to localStorage
    localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(itinerary));
    
    // Update all Add buttons in the UI
    updateAddButtonsForBrewery(breweryId);
    
    // Show success message
    alert(`${brewery.name} has been added to your itinerary!`);
    
    // If modal is open, close it
    const modal = bootstrap.Modal.getInstance(document.getElementById('breweryDetailModal'));
    if (modal) {
        modal.hide();
    }
    
    // Ask if user wants to view itinerary or continue browsing
    if (confirm('Would you like to view your itinerary now?')) {
        window.location.href = 'itinerary.php';
    }
}

// Update all Add buttons for a specific brewery
function updateAddButtonsForBrewery(breweryId) {
    // Find all add buttons for this brewery
    const addButtons = document.querySelectorAll(`button[onclick="addToItinerary(${breweryId})"]`);
    
    addButtons.forEach(button => {
        // Update button appearance
        button.classList.remove('btn-outline-success', 'btn-outline-primary');
        button.classList.add('btn-success');
        button.innerHTML = '<i class="bi bi-check"></i> Added';
        button.disabled = true;
    });
}
