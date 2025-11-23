// Global variables
let breweries = [];
let itinerary = [];

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load brewery data
    loadBreweryData();
    
    // Load any existing itinerary from localStorage
    loadSavedItinerary();
});

// Load brewery data from JSON file
async function loadBreweryData() {
    try {
        const response = await fetch('breweries.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        breweries = await response.json();
        console.log('Loaded', breweries.length, 'breweries');
        
        // Initialize "Added" buttons
        updateAddButtons();
    } catch (error) {
        console.error('Error loading brewery data:', error);
    }
}

// Load saved itinerary from localStorage
function loadSavedItinerary() {
    const savedItinerary = localStorage.getItem('ohioBeerPathItinerary');
    if (savedItinerary) {
        itinerary = JSON.parse(savedItinerary);
        console.log('Loaded saved itinerary with', itinerary.length, 'breweries');
    }
}

// Update all "Add" buttons based on current itinerary
function updateAddButtons() {
    // Find all add buttons
    const addButtons = document.querySelectorAll('[data-action="add-to-itinerary"]');
    
    addButtons.forEach(button => {
        const breweryId = button.getAttribute('data-brewery-id');
        const isInItinerary = itinerary.some(item => item.id == breweryId);
        
        if (isInItinerary) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-success');
            button.innerHTML = '<i class="bi bi-check"></i> Added';
        } else {
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-primary');
            button.innerHTML = '<i class="bi bi-plus"></i> Add to Tour';
        }
    });
}

// Add a brewery to the itinerary
function addToItinerary(breweryId) {
    // Find the brewery in our data
    const brewery = breweries.find(b => b.id == breweryId);
    if (!brewery) {
        console.error('Brewery not found:', breweryId);
        return;
    }

    // Data validation: must have name, city, latitude, longitude
    if (!brewery.name || !brewery.city || !brewery.latitude || !brewery.longitude) {
        alert('This brewery is missing location or city information and cannot be added to your itinerary.');
        return;
    }

    // Check if already in itinerary
    const isInItinerary = itinerary.some(item => item.id == breweryId);
    if (isInItinerary) {
        console.log('Brewery already in itinerary');
        return;
    }

    // Add to itinerary
    itinerary.push(brewery);

    // Save to localStorage
    localStorage.setItem('ohioBeerPathItinerary', JSON.stringify(itinerary));

    // Update UI
    updateAddButtons();

    // Show success message
    alert(`${brewery.name} has been added to your itinerary. View your itinerary on the Itinerary page.`);
}

// Load saved itinerary from localStorage
function loadSavedItinerary() {
    const savedItinerary = localStorage.getItem('ohioBeerPathItinerary');
    if (savedItinerary) {
        let parsed = JSON.parse(savedItinerary);
        // Rehydrate with latest brewery data
        itinerary = parsed.map(item => {
            const brewery = breweries.find(b => b.id == item.id);
            return brewery ? brewery : item;
        });
        console.log('Loaded saved itinerary with', itinerary.length, 'breweries');
    }
}

// Event delegation for add buttons
document.addEventListener('click', function(event) {
    // Check if the clicked element is an add button or a child of it
    const addButton = event.target.closest('[data-action="add-to-itinerary"]');
    if (addButton) {
        const breweryId = addButton.getAttribute('data-brewery-id');
        addToItinerary(breweryId);
        event.preventDefault(); // Prevent default link behavior for add buttons only
    }
    
    // Do not interfere with other buttons like "View Details"
});
