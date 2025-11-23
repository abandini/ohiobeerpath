<?php
/**
 * Search Component
 * 
 * This file provides a reusable search component with autocomplete
 * 
 * @param string $id Optional ID for the search component (default: mainSearch)
 * @param string $placeholder Optional placeholder text (default: Search for breweries...)
 * @param bool $showFilters Optional flag to show filters (default: true)
 */

// Default values
$id = $id ?? 'mainSearch';
$placeholder = $placeholder ?? 'Search for breweries...';
$showFilters = $showFilters ?? true;
?>
<div class="search-component">
    <div class="card shadow-sm">
        <div class="card-body">
            <form id="<?php echo htmlspecialchars($id); ?>Form" class="search-form">
                <div class="input-group mb-3">
                    <span class="input-group-text" id="<?php echo htmlspecialchars($id); ?>Label">
                        <i class="bi bi-search" aria-hidden="true"></i>
                    </span>
                    <input type="text" 
                           class="form-control search-autocomplete" 
                           id="<?php echo htmlspecialchars($id); ?>Input" 
                           placeholder="<?php echo htmlspecialchars($placeholder); ?>" 
                           aria-label="<?php echo htmlspecialchars($placeholder); ?>"
                           aria-describedby="<?php echo htmlspecialchars($id); ?>Label"
                           autocomplete="off">
                    <button class="btn btn-primary" type="submit" id="<?php echo htmlspecialchars($id); ?>Button">
                        Search
                    </button>
                </div>
                
                <?php if ($showFilters): ?>
                <div class="search-filters collapse" id="<?php echo htmlspecialchars($id); ?>Filters">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="<?php echo htmlspecialchars($id); ?>Region" class="form-label">Region</label>
                            <select class="form-select" id="<?php echo htmlspecialchars($id); ?>Region">
                                <option value="">All Regions</option>
                                <option value="northeast">Northeast Ohio</option>
                                <option value="northwest">Northwest Ohio</option>
                                <option value="central">Central Ohio</option>
                                <option value="southeast">Southeast Ohio</option>
                                <option value="southwest">Southwest Ohio</option>
                                <option value="eastcentral">East Central Ohio</option>
                                <option value="westcentral">West Central Ohio</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="<?php echo htmlspecialchars($id); ?>Type" class="form-label">Brewery Type</label>
                            <select class="form-select" id="<?php echo htmlspecialchars($id); ?>Type">
                                <option value="">All Types</option>
                                <option value="micro">Microbrewery</option>
                                <option value="brewpub">Brewpub</option>
                                <option value="regional">Regional Brewery</option>
                                <option value="large">Large Brewery</option>
                                <option value="contract">Contract Brewery</option>
                                <option value="proprietor">Proprietor Brewery</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="<?php echo htmlspecialchars($id); ?>Sort" class="form-label">Sort By</label>
                            <select class="form-select" id="<?php echo htmlspecialchars($id); ?>Sort">
                                <option value="name">Name</option>
                                <option value="city">City</option>
                                <option value="region">Region</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <label class="form-label d-block">Features</label>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="<?php echo htmlspecialchars($id); ?>FeatureFood" value="food">
                                <label class="form-check-label" for="<?php echo htmlspecialchars($id); ?>FeatureFood">Food Menu</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="<?php echo htmlspecialchars($id); ?>FeatureOutdoor" value="outdoor">
                                <label class="form-check-label" for="<?php echo htmlspecialchars($id); ?>FeatureOutdoor">Outdoor Seating</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="<?php echo htmlspecialchars($id); ?>FeatureTours" value="tours">
                                <label class="form-check-label" for="<?php echo htmlspecialchars($id); ?>FeatureTours">Brewery Tours</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="<?php echo htmlspecialchars($id); ?>FeaturePet" value="pet_friendly">
                                <label class="form-check-label" for="<?php echo htmlspecialchars($id); ?>FeaturePet">Pet Friendly</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="d-flex justify-content-end">
                    <button class="btn btn-link btn-sm text-decoration-none" type="button" data-bs-toggle="collapse" data-bs-target="#<?php echo htmlspecialchars($id); ?>Filters" aria-expanded="false" aria-controls="<?php echo htmlspecialchars($id); ?>Filters">
                        <i class="bi bi-sliders" aria-hidden="true"></i> 
                        <span class="filter-toggle-text">Show Filters</span>
                    </button>
                </div>
                <?php endif; ?>
            </form>
        </div>
    </div>
    
    <!-- Autocomplete Results -->
    <div class="autocomplete-results d-none" id="<?php echo htmlspecialchars($id); ?>Results" aria-live="polite">
        <!-- Results will be added here -->
    </div>
</div>
