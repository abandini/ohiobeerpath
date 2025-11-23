<?php
/**
 * Image utility functions for Ohio Beer Path
 */

/**
 * Get the URL for a brewery image
 * 
 * @param string $brewery_name The name of the brewery
 * @param string $size Size of image ('thumbnail', 'medium', 'large')
 * @return string URL to the brewery image or placeholder
 */
function get_brewery_image_url($brewery_name, $size = 'medium') {
    // Convert brewery name to a filename-friendly format
    $filename = strtolower(preg_replace('/[^a-zA-Z0-9]/', '-', $brewery_name));
    $filename = preg_replace('/-+/', '-', $filename); // Replace multiple hyphens with single
    $filename = trim($filename, '-'); // Trim hyphens from beginning and end
    
    // Define image paths based on size
    $sizes = [
        'thumbnail' => '200x150',
        'medium' => '400x300',
        'large' => '800x600'
    ];
    
    $size_dir = $sizes[$size] ?? $sizes['medium'];
    
    // Check if brewery image exists
    $image_path = "assets/images/breweries/{$size_dir}/{$filename}.jpg";
    $full_path = __DIR__ . "/../{$image_path}";
    
    if (file_exists($full_path)) {
        return $image_path;
    }
    
    // Check for alternative extensions
    foreach (['png', 'webp'] as $ext) {
        $alt_path = "assets/images/breweries/{$size_dir}/{$filename}.{$ext}";
        $full_alt_path = __DIR__ . "/../{$alt_path}";
        
        if (file_exists($full_alt_path)) {
            return $alt_path;
        }
    }
    
    // Return placeholder if no image found
    return "assets/images/breweries/{$size_dir}/placeholder.jpg";
}

/**
 * Generate responsive image HTML
 * 
 * @param string $brewery_name The name of the brewery
 * @param string $alt Alt text for the image
 * @param array $classes Additional CSS classes
 * @return string HTML for responsive image
 */
function responsive_brewery_image($brewery_name, $alt = '', $classes = []) {
    $alt = htmlspecialchars($alt ?: $brewery_name);
    $class_attr = !empty($classes) ? ' class="' . implode(' ', $classes) . '"' : '';
    
    $thumb_url = get_brewery_image_url($brewery_name, 'thumbnail');
    $medium_url = get_brewery_image_url($brewery_name, 'medium');
    $large_url = get_brewery_image_url($brewery_name, 'large');
    
    return <<<HTML
    <picture>
        <source srcset="{$large_url}" media="(min-width: 1200px)">
        <source srcset="{$medium_url}" media="(min-width: 768px)">
        <img src="{$thumb_url}" alt="{$alt}"{$class_attr} loading="lazy">
    </picture>
HTML;
}

/**
 * Create placeholder images for breweries
 * 
 * @param string $size Size of image ('thumbnail', 'medium', 'large')
 * @return boolean Success status
 */
function create_placeholder_images() {
    $sizes = [
        'thumbnail' => [200, 150],
        'medium' => [400, 300],
        'large' => [800, 600]
    ];
    
    foreach ($sizes as $size_name => $dimensions) {
        $dir = __DIR__ . "/../assets/images/breweries/{$dimensions[0]}x{$dimensions[1]}";
        
        // Create directory if it doesn't exist
        if (!file_exists($dir)) {
            if (!mkdir($dir, 0755, true)) {
                error_log("Failed to create directory: {$dir}");
                return false;
            }
        }
        
        // Create placeholder image if it doesn't exist
        $placeholder_path = "{$dir}/placeholder.jpg";
        if (!file_exists($placeholder_path)) {
            // Create a simple placeholder image
            $image = imagecreatetruecolor($dimensions[0], $dimensions[1]);
            
            // Set background color (light gray)
            $bg_color = imagecolorallocate($image, 240, 240, 240);
            imagefill($image, 0, 0, $bg_color);
            
            // Add text
            $text_color = imagecolorallocate($image, 120, 120, 120);
            $text = "Ohio Beer Path";
            
            // Calculate text position
            $font_size = min($dimensions) / 10;
            $font_path = __DIR__ . "/../assets/fonts/OpenSans-Regular.ttf";
            
            // Use default font if custom font not available
            if (!file_exists($font_path)) {
                // Draw text with built-in font
                $font_width = imagefontwidth(5) * strlen($text);
                $font_height = imagefontheight(5);
                
                imagestring(
                    $image,
                    5,
                    ($dimensions[0] - $font_width) / 2,
                    ($dimensions[1] - $font_height) / 2,
                    $text,
                    $text_color
                );
            } else {
                // Draw text with TrueType font
                $box = imagettfbbox($font_size, 0, $font_path, $text);
                $text_width = abs($box[4] - $box[0]);
                $text_height = abs($box[5] - $box[1]);
                
                imagettftext(
                    $image,
                    $font_size,
                    0,
                    ($dimensions[0] - $text_width) / 2,
                    ($dimensions[1] - $text_height) / 2 + $text_height,
                    $text_color,
                    $font_path,
                    $text
                );
            }
            
            // Save the image
            imagejpeg($image, $placeholder_path, 90);
            imagedestroy($image);
        }
    }
    
    return true;
}
