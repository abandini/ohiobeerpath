/**
 * Brewery Details Handler
 * Manages the brewery details popup and data loading
 */

// Removed event delegation for .view-details to allow default navigation to brewery-view.html
// If modal logic is needed elsewhere, keep those functions separately.

/**
 * Load brewery details from the data source
 * @param {string|number} breweryId The ID of the brewery to load
 */
async function loadBreweryDetails(breweryId) {
    console.log(`Loading details for brewery ID: ${breweryId}`);
    
    try {
        // Show loading spinner
        showBreweryDetailsModal('Loading...', `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading brewery details...</span>
                </div>
                <p class="mt-3">Loading brewery details...</p>
            </div>
        `);
        
        // Attempt to load brewery data
        const breweries = await fetchBreweries();
        const brewery = breweries.find(b => b.id == breweryId);
        
        if (!brewery) {
            throw new Error(`Brewery with ID ${breweryId} not found`);
        }
        
        // Render the brewery details in the modal
        renderBreweryDetails(brewery);
        
    } catch (error) {
        console.error("Error loading brewery details:", error);
        
        // Show error in modal
        showBreweryDetailsModal('Error', `
            <div class="alert alert-danger">
                <p>Sorry, we couldn't load the brewery details. Please try again later.</p>
                <p class="small text-muted">${error.message}</p>
            </div>
        `);
    }
}

/**
 * Fetch brewery data from available sources
 * @returns {Promise<Array>} Promise resolving to brewery data array
 */
async function fetchBreweries() {
    try {
        // Try root path first
        const response = await fetch('breweries.json');
        if (response.ok) {
            return await response.json();
        }
        
        // Try data folder next
        const altResponse = await fetch('assets/data/breweries.json');
        if (altResponse.ok) {
            return await altResponse.json();
        }
        
        throw new Error("Could not load brewery data from any source");
    } catch (error) {
        console.error("Error fetching brewery data:", error);
        throw error;
    }
}

/**
 * Display the brewery details modal with title and content
 * @param {string} title The modal title
 * @param {string} content The HTML content for the modal body
 */
function showBreweryDetailsModal(title, content) {
    // Check if modal already exists
    let modal = document.getElementById('breweryDetailsModal');
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'breweryDetailsModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'breweryDetailsModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="breweryDetailsModalLabel"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Update modal content
    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-body').innerHTML = content;
    
    // Initialize and show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

/**
 * Render brewery details in the modal
 * @param {Object} brewery The brewery data object
 */
function renderBreweryDetails(brewery) {
    // Prepare contact information section
    const contactInfo = [];
    
    if (brewery.phone) {
        const formattedPhone = formatPhoneNumber(brewery.phone);
        contactInfo.push(`
            <div class="mb-2">
                <i class="bi bi-telephone me-2"></i>
                <a href="tel:${brewery.phone}">${formattedPhone}</a>
            </div>
        `);
    }
    
    if (brewery.website_url) {
        contactInfo.push(`
            <div class="mb-2">
                <i class="bi bi-globe me-2"></i>
                <a href="${brewery.website_url}" target="_blank" rel="noopener">
                    ${formatWebsiteUrl(brewery.website_url)}
                </a>
            </div>
        `);
    }
    
    if (brewery.address) {
        contactInfo.push(`
            <div class="mb-2">
                <i class="bi bi-geo-alt me-2"></i>
                <a href="https://maps.google.com/?q=${encodeURIComponent(brewery.address)}" target="_blank">
                    ${brewery.address}
                </a>
            </div>
        `);
    } else if (brewery.city) {
        contactInfo.push(`
            <div class="mb-2">
                <i class="bi bi-geo-alt me-2"></i>
                ${brewery.city}, OH
            </div>
        `);
    }
    
    // Prepare operating hours section if available
    let hoursSection = '';
    if (brewery.hours) {
        hoursSection = `
            <div class="col-md-6">
                <h5 class="border-bottom pb-2">Operating Hours</h5>
                <ul class="list-unstyled">
                    ${Object.entries(brewery.hours)
                        .map(([day, hours]) => `<li><strong>${day}:</strong> ${hours}</li>`)
                        .join('')}
                </ul>
            </div>
        `;
    }
    
    // Prepare beers section if available
    let beersSection = '';
    if (brewery.beers && brewery.beers.length > 0) {
        beersSection = `
            <h5 class="border-bottom pb-2 mt-4">Notable Beers</h5>
            <div class="row">
                ${brewery.beers.map(beer => `
                    <div class="col-md-6 mb-2">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body">
                                <h6 class="card-title">${beer.name}</h6>
                                <p class="card-text small">${beer.style || 'Craft Beer'}</p>
                                ${beer.abv ? `<span class="badge bg-info">ABV: ${beer.abv}%</span>` : ''}
                                ${beer.ibu ? `<span class="badge bg-secondary ms-1">IBU: ${beer.ibu}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Build the complete details content
    const detailsContent = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-8">
                    <h4>${brewery.name}</h4>
                    <p class="text-muted">
                        ${brewery.brewery_type ? `<span class="badge bg-secondary">${brewery.brewery_type}</span>` : ''}
                        ${brewery.region ? `<span class="badge bg-primary ms-1">${brewery.region}</span>` : ''}
                    </p>
                    <p>${brewery.description || 'No description available.'}</p>
                </div>
                <div class="col-md-4">
                    <h5 class="border-bottom pb-2">Contact Info</h5>
                    ${contactInfo.length > 0 ? contactInfo.join('') : '<p>No contact information available.</p>'}
                </div>
            </div>
            
            <div class="row mt-4">
                ${hoursSection}
                <div class="${brewery.hours ? 'col-md-6' : 'col-12'}">
                    ${brewery.founded ? `
                        <h5 class="border-bottom pb-2">About</h5>
                        <p><strong>Founded:</strong> ${brewery.founded}</p>
                    ` : ''}
                    ${brewery.features && brewery.features.length > 0 ? `
                        <h5 class="border-bottom pb-2">Features</h5>
                        <div class="d-flex flex-wrap gap-1 mb-3">
                            ${brewery.features.map(feature => 
                                `<span class="badge bg-success">${feature}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${beersSection}
        </div>
    `;
    
    // Update the modal
    showBreweryDetailsModal(brewery.name, detailsContent);
}

/**
 * Format a phone number for display
 * @param {string} phone The phone number to format
 * @return {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    // Remove non-numeric characters
    const cleaned = ('' + phone).replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }
    
    // Return original if we can't format
    return phone;
}

/**
 * Format a website URL for display
 * @param {string} url The URL to format
 * @return {string} Formatted URL for display
 */
function formatWebsiteUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
}

/**
 * Function that can be called directly to show brewery details
 * @param {string|number} breweryId The ID of the brewery to display
 */
function showBreweryDetails(breweryId) {
    loadBreweryDetails(breweryId);
}
