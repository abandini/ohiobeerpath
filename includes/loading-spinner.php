<?php
/**
 * Loading Spinner Component
 * 
 * This file provides a reusable loading spinner component
 * 
 * @param string $id Optional ID for the spinner (default: loadingSpinner)
 * @param string $size Optional size (sm, md, lg) (default: md)
 * @param string $message Optional loading message
 */

// Default values
$id = $id ?? 'loadingSpinner';
$size = $size ?? 'md';
$message = $message ?? 'Loading...';

// Size classes
$size_classes = [
    'sm' => 'spinner-border-sm',
    'md' => '',
    'lg' => 'spinner-border-lg'
];

// Get size class
$size_class = $size_classes[$size] ?? '';
?>
<div id="<?php echo htmlspecialchars($id); ?>" class="loading-spinner-container d-none">
    <div class="loading-spinner-overlay"></div>
    <div class="loading-spinner-content" role="status">
        <div class="spinner-border text-primary <?php echo $size_class; ?>" aria-hidden="true"></div>
        <p class="mt-2"><?php echo htmlspecialchars($message); ?></p>
        <span class="visually-hidden"><?php echo htmlspecialchars($message); ?></span>
    </div>
</div>
