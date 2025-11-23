// Direct simplification & fix for brewery loading
document.addEventListener('DOMContentLoaded', function() {
    console.log("Direct fix script loaded, starting brewery data load");
    
    // Immediately load brewery data
    loadBreweryData();
});

async function loadBreweryData() {
    try {
        console.log("Starting simplified brewery data loading");
        
        // Try to load from root path first (most reliable)
        const response = await fetch('breweries.json');
        if (!response.ok) {
            throw new Error("Could not load breweries from root path");
        }
        
        const breweries = await response.json();
        console.log(`Successfully loaded ${breweries.length} breweries`);
        
        // Apply URL parameters immediately if present
        const urlParams = new URLSearchParams(window.location.search);
        const regionParam = urlParams.get('region');
        if (regionParam) {
            console.log(`Found region parameter in URL: ${regionParam}`);
            
            // Set dropdown to match region parameter
            const regionSelect = document.getElementById('regionFilter');
            if (regionSelect) {
                regionSelect.value = regionParam;
                console.log(`Set region dropdown to: ${regionParam}`);
            }
            
            // Filter and display breweries immediately
            displayRegionalBreweries(breweries, regionParam);
        } else {
            // No region parameter, show all breweries
            displayBreweries(breweries);
        }
        
    } catch (error) {
        console.error('Error loading brewery data:', error);
        showError("Could not load brewery data. Please try refreshing the page.");
    }
}

function displayRegionalBreweries(breweries, region) {
    console.log(`Filtering breweries for region: ${region}`);
    
    // Case-insensitive region comparison
    const filteredBreweries = breweries.filter(brewery => {
        // Debug for this specific brewery
        if (brewery.region) {
            console.log(`Brewery ${brewery.name} has region: ${brewery.region}`);
        }
        
        return brewery.region && brewery.region.toLowerCase() === region.toLowerCase();
    });
    
    console.log(`Found ${filteredBreweries.length} breweries in the ${region} region`);
    
    if (filteredBreweries.length > 0) {
        displayBreweries(filteredBreweries);
    } else {
        const allRegions = [...new Set(breweries.filter(b => b.region).map(b => b.region.toLowerCase()))];
        console.log("Available regions in data:", allRegions);
        
        showError(`No breweries found in the ${region} region. Available regions: ${allRegions.join(', ')}`);
    }
}

function displayBreweries(breweries) {
    const breweriesList = document.getElementById('breweriesList');
    if (!breweriesList) {
        console.error('Breweries list container not found');
        return;
    }
    
    // Clear loading message
    breweriesList.innerHTML = '';
    
    if (breweries.length === 0) {
        breweriesList.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="alert alert-info">
                    No breweries found matching your criteria. Try adjusting your filters.
                </div>
            </div>
        `;
        return;
    }
    
    // Update count display
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = breweries.length;
    }
    
    // Create HTML for each brewery
    breweries.forEach(brewery => {
        const breweryCard = document.createElement('div');
        breweryCard.className = 'col-md-6 col-lg-4 mb-4';
        
        breweryCard.innerHTML = `
            <div class="card h-100 brewery-card">
                <div class="card-body">
                    <h3 class="card-title h5">${brewery.name}</h3>
                    <p class="card-text text-muted">
                        ${brewery.city ? brewery.city + ', ' : ''}OH
                    </p>
                    <ul class="brewery-features list-unstyled mb-3">
                        ${brewery.brewery_type ? `<li><span class="badge bg-secondary">${brewery.brewery_type}</span></li>` : ''}
                        ${brewery.region ? `<li><span class="badge bg-primary">${brewery.region}</span></li>` : ''}
                    </ul>
                    <a href="view-brewery-simple.html?id=${brewery.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-info-circle"></i> View Details
                    </a>
                </div>
            </div>
        `;
        
        breweriesList.appendChild(breweryCard);
    });
}

function showError(message) {
    const breweriesList = document.getElementById('breweriesList');
    if (breweriesList) {
        breweriesList.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="alert alert-danger">
                    ${message}
                </div>
            </div>
        `;
    }
    
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = '0';
    }
}
