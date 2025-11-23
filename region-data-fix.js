// Region data fixer that repairs brewery data
document.addEventListener('DOMContentLoaded', function() {
    console.log("Region data fixer loaded");
    
    // Execute immediately when the dropdown changes
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', function() {
            const selectedRegion = this.value;
            console.log("Region selected from dropdown:", selectedRegion);
            
            if (selectedRegion) {
                // Force reload the page with the region parameter
                window.location.href = `breweries.php?region=${selectedRegion}`;
            }
        });
    }
    
    // Fix URL issues for region links
    document.querySelectorAll('a[href*="region="]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = new URL(this.href);
            const region = url.searchParams.get('region');
            console.log("Region link clicked:", region);
            
            if (region) {
                window.location.href = `breweries.php?region=${region}`;
            }
        });
    });
    
    // Attach event listeners to all "Explore Region" buttons
    document.querySelectorAll('a[href*="#"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('region') && href.includes('#')) {
            link.addEventListener('click', function(e) {
                const regionId = href.split('#')[1];
                if (regionId) {
                    console.log("Region section link clicked:", regionId);
                    // Redirect to breweries with region parameter
                    window.location.href = `breweries.php?region=${regionId}`;
                    e.preventDefault();
                }
            });
        }
    });
    
    // Force-load breweries from correct path if URL has region parameter
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region');
    
    if (regionParam) {
        console.log("Found region parameter in URL:", regionParam);
        
        // Set up a spinner
        const breweriesList = document.getElementById('breweriesList');
        if (breweriesList) {
            breweriesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading breweries for ${regionParam}...</span>
                    </div>
                    <p class="mt-3">Loading breweries for ${regionParam}...</p>
                </div>
            `;
        }
        
        // Fetch breweries directly without relying on other scripts
        fetch('breweries.json')
            .then(response => {
                if (!response.ok) {
                    return fetch('assets/data/breweries.json');
                }
                return response;
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not load brewery data");
                }
                return response.json();
            })
            .then(breweries => {
                console.log(`Loaded ${breweries.length} breweries total`);
                
                // Log all existing regions in data
                const allRegions = {};
                breweries.forEach(b => {
                    if (b.region) {
                        const r = b.region.toLowerCase();
                        allRegions[r] = (allRegions[r] || 0) + 1;
                    }
                });
                console.log("Regions in data:", allRegions);
                
                // Filter breweries for the selected region
                // Use exact lowercase comparison to ensure matches
                const filteredBreweries = breweries.filter(b => 
                    b.region && b.region.toLowerCase() === regionParam.toLowerCase()
                );
                
                console.log(`Found ${filteredBreweries.length} breweries for region: ${regionParam}`);
                
                // Force-update UI with filtered breweries
                displayBreweries(filteredBreweries);
                
                // Update region filter dropdown to match URL parameter
                const regionFilter = document.getElementById('regionFilter');
                if (regionFilter) {
                    regionFilter.value = regionParam;
                }
            })
            .catch(error => {
                console.error('Error loading brewery data:', error);
                
                const breweriesList = document.getElementById('breweriesList');
                if (breweriesList) {
                    breweriesList.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-danger">
                                Error loading brewery data: ${error.message || 'Unknown error'}
                            </div>
                        </div>
                    `;
                }
            });
    }
});

// Helper function to display breweries
function displayBreweries(breweries) {
    const breweriesList = document.getElementById('breweriesList');
    if (!breweriesList) return;
    
    // Clear current content
    breweriesList.innerHTML = '';
    
    // Update count
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = breweries.length;
    }
    
    if (breweries.length === 0) {
        breweriesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    No breweries found in this region.
                </div>
            </div>
        `;
        return;
    }
    
    // Create brewery cards
    breweries.forEach(brewery => {
        const breweryCard = document.createElement('div');
        breweryCard.className = 'col-md-6 col-lg-4 mb-4';
        
        const cardHtml = `
            <div class="card h-100 brewery-card shadow-sm">
                <div class="card-body">
                    <h3 class="card-title h5">${brewery.name || 'Unnamed Brewery'}</h3>
                    <p class="card-text text-muted mb-2">
                        ${brewery.city || 'Unknown location'}, OH
                    </p>
                    <div class="d-flex flex-wrap gap-1 mb-3">
                        ${brewery.region ? `<span class="badge bg-primary">${brewery.region}</span>` : ''}
                        ${brewery.brewery_type ? `<span class="badge bg-secondary">${brewery.brewery_type}</span>` : ''}
                    </div>
                    ${brewery.description ? `<p class="small mb-3">${brewery.description.substring(0, 100)}...</p>` : ''}
                    <div class="d-flex mt-auto">
                        <button class="btn btn-sm btn-outline-primary view-details" onclick="showBreweryDetails(${brewery.id})">
                            <i class="bi bi-info-circle"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        breweryCard.innerHTML = cardHtml;
        breweriesList.appendChild(breweryCard);
    });
}
