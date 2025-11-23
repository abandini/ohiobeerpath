<?php
/**
 * Brewery Card Component
 * 
 * This file provides a reusable, accessible brewery card component
 * 
 * @param array $brewery The brewery data
 * @param bool $featured Whether this is a featured brewery
 */

// Default values
$brewery = $brewery ?? [];
$featured = $featured ?? false;

// Ensure required data exists
if (empty($brewery)) {
    return;
}

// Get brewery image
require_once(__DIR__ . '/image-utils.php');
$image_size = $featured ? 'medium' : 'thumbnail';
$brewery_id = $brewery['id'] ?? '';
$brewery_name = $brewery['name'] ?? 'Unknown Brewery';
$brewery_city = $brewery['city'] ?? '';
$brewery_region = $brewery['region'] ?? '';
$brewery_type = $brewery['brewery_type'] ?? '';
$brewery_description = $brewery['description'] ?? '';
?>
<div class="col-md-<?php echo $featured ? '4' : '6'; ?> col-lg-<?php echo $featured ? '4' : '4'; ?> mb-4">
    <div class="card h-100 shadow-sm brewery-card" data-brewery-id="<?php echo htmlspecialchars($brewery_id); ?>">
        <div class="card-img-top" style="height: <?php echo $featured ? '200px' : '150px'; ?>; overflow: hidden;">
            <?php echo responsive_brewery_image($brewery_name, "$brewery_name brewery in $brewery_city, Ohio", ['img-fluid']); ?>
        </div>
        <div class="card-body">
            <h3 class="h5 card-title"><?php echo htmlspecialchars($brewery_name); ?></h3>
            <p class="text-muted mb-2">
                <i class="bi bi-geo-alt" aria-hidden="true"></i>
                <span><?php echo htmlspecialchars($brewery_city); ?>, OH</span>
            </p>
            
            <?php if (!empty($brewery_region) || !empty($brewery_type)): ?>
            <div class="d-flex gap-2 mb-3">
                <?php if (!empty($brewery_region)): ?>
                <span class="badge bg-primary" title="Region"><?php echo htmlspecialchars($brewery_region); ?></span>
                <?php endif; ?>
                
                <?php if (!empty($brewery_type)): ?>
                <span class="badge bg-secondary" title="Brewery type"><?php echo htmlspecialchars($brewery_type); ?></span>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($brewery_description) && $featured): ?>
            <p class="card-text small">
                <?php echo htmlspecialchars(substr($brewery_description, 0, 100)); ?>...
            </p>
            <?php endif; ?>
            
            <div class="d-flex justify-content-between align-items-center mt-auto">
                <a href="view-brewery-simple.html?id=<?php echo htmlspecialchars($brewery_id); ?>&name=<?php echo urlencode($brewery_name); ?>" 
                   class="btn btn-sm btn-outline-primary"
                   aria-label="View details for <?php echo htmlspecialchars($brewery_name); ?>">
                    View Details
                </a>
                
                <button type="button" 
                        class="btn btn-sm btn-outline-primary add-to-itinerary" 
                        data-brewery-id="<?php echo htmlspecialchars($brewery_id); ?>"
                        aria-label="Add <?php echo htmlspecialchars($brewery_name); ?> to your tour itinerary">
                    <i class="bi bi-plus" aria-hidden="true"></i> Add to Tour
                </button>
            </div>
        </div>
    </div>
</div>
