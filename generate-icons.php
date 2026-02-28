<?php
/**
 * PWA Icon Generator for Ohio Beer Path
 *
 * Run this script once to generate all required PWA icons.
 * Requires GD library.
 *
 * Usage: php generate-icons.php
 */

// Icon sizes needed for PWA
$iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
$faviconSizes = [16, 32, 180]; // favicon-16x16, favicon-32x32, apple-touch-icon

// Colors
$bgColor = [217, 119, 6]; // #d97706 (amber/beer color)
$textColor = [255, 255, 255]; // white

// Output directories
$iconsDir = __DIR__ . '/assets/images/icons';
$faviconDir = __DIR__ . '/assets/images/favicon';

// Ensure directories exist
if (!is_dir($iconsDir)) {
    mkdir($iconsDir, 0755, true);
}
if (!is_dir($faviconDir)) {
    mkdir($faviconDir, 0755, true);
}

/**
 * Generate a simple beer mug icon
 */
function generateIcon($size, $bgColor, $textColor, $maskable = false) {
    // Create image
    $image = imagecreatetruecolor($size, $size);

    // Enable anti-aliasing
    imageantialias($image, true);

    // Allocate colors
    $bg = imagecolorallocate($image, $bgColor[0], $bgColor[1], $bgColor[2]);
    $white = imagecolorallocate($image, $textColor[0], $textColor[1], $textColor[2]);
    $darkBg = imagecolorallocate($image,
        max(0, $bgColor[0] - 30),
        max(0, $bgColor[1] - 30),
        max(0, $bgColor[2] - 30)
    );

    // Fill background
    imagefill($image, 0, 0, $bg);

    // For maskable icons, we need safe zone (center 80%)
    $padding = $maskable ? $size * 0.1 : $size * 0.15;
    $innerSize = $size - ($padding * 2);

    // Draw a simple beer mug shape
    $mugWidth = $innerSize * 0.6;
    $mugHeight = $innerSize * 0.7;
    $mugX = $padding + ($innerSize - $mugWidth) / 2;
    $mugY = $padding + ($innerSize - $mugHeight) / 2;

    // Mug body (rounded rectangle)
    $cornerRadius = $size * 0.05;

    // Draw mug body
    imagefilledrectangle($image,
        (int)$mugX,
        (int)($mugY + $cornerRadius),
        (int)($mugX + $mugWidth),
        (int)($mugY + $mugHeight - $cornerRadius),
        $white
    );
    imagefilledrectangle($image,
        (int)($mugX + $cornerRadius),
        (int)$mugY,
        (int)($mugX + $mugWidth - $cornerRadius),
        (int)($mugY + $mugHeight),
        $white
    );

    // Draw handle
    $handleWidth = $mugWidth * 0.25;
    $handleHeight = $mugHeight * 0.5;
    $handleX = $mugX + $mugWidth;
    $handleY = $mugY + ($mugHeight - $handleHeight) / 2;

    imagefilledrectangle($image,
        (int)$handleX,
        (int)$handleY,
        (int)($handleX + $handleWidth),
        (int)($handleY + $handleHeight),
        $white
    );

    // Draw foam (top of mug)
    $foamHeight = $mugHeight * 0.2;
    imagefilledellipse($image,
        (int)($mugX + $mugWidth / 2),
        (int)($mugY + $foamHeight / 2),
        (int)$mugWidth,
        (int)$foamHeight,
        $white
    );

    // Draw "OBP" text if size is large enough
    if ($size >= 128) {
        $fontSize = $size * 0.12;
        $fontFile = null; // Use built-in font

        // Use imagestring for simple text (no TTF required)
        $text = "OBP";
        $textX = (int)($mugX + $mugWidth * 0.15);
        $textY = (int)($mugY + $mugHeight * 0.4);

        // Scale font based on size
        $font = min(5, max(1, (int)($size / 100)));
        imagestring($image, $font, $textX, $textY, $text, $darkBg);
    }

    return $image;
}

/**
 * Generate simple placeholder icon (circle with beer color)
 */
function generateSimpleIcon($size, $bgColor, $textColor) {
    $image = imagecreatetruecolor($size, $size);
    imageantialias($image, true);

    // Transparent background for favicon
    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
    imagefill($image, 0, 0, $transparent);
    imagesavealpha($image, true);

    // Draw colored circle
    $bg = imagecolorallocate($image, $bgColor[0], $bgColor[1], $bgColor[2]);
    $white = imagecolorallocate($image, $textColor[0], $textColor[1], $textColor[2]);

    $centerX = $size / 2;
    $centerY = $size / 2;
    $radius = ($size / 2) - 1;

    imagefilledellipse($image, (int)$centerX, (int)$centerY, (int)($radius * 2), (int)($radius * 2), $bg);

    // Add "B" letter for beer
    if ($size >= 32) {
        $font = min(5, max(2, (int)($size / 20)));
        $textX = (int)($centerX - ($size * 0.15));
        $textY = (int)($centerY - ($size * 0.2));
        imagestring($image, $font, $textX, $textY, "B", $white);
    }

    return $image;
}

echo "Generating PWA icons for Ohio Beer Path...\n\n";

// Generate standard icons
foreach ($iconSizes as $size) {
    $filename = $iconsDir . "/icon-{$size}.png";
    $image = generateIcon($size, $bgColor, $textColor, false);
    imagepng($image, $filename);
    imagedestroy($image);
    echo "Created: icon-{$size}.png\n";
}

// Generate maskable icons (192 and 512)
foreach ([192, 512] as $size) {
    $filename = $iconsDir . "/maskable-icon-{$size}.png";
    $image = generateIcon($size, $bgColor, $textColor, true);
    imagepng($image, $filename);
    imagedestroy($image);
    echo "Created: maskable-icon-{$size}.png\n";
}

// Generate favicons
$faviconFiles = [
    16 => 'favicon-16x16.png',
    32 => 'favicon-32x32.png',
    180 => 'apple-touch-icon.png'
];

foreach ($faviconFiles as $size => $filename) {
    $filepath = $faviconDir . '/' . $filename;
    $image = generateSimpleIcon($size, $bgColor, $textColor);
    imagepng($image, $filepath);
    imagedestroy($image);
    echo "Created: favicon/{$filename}\n";
}

// Generate OG and Twitter images (1200x630 for OG, 1200x600 for Twitter)
$ogSizes = [
    'og-image.jpg' => [1200, 630],
    'og-default.jpg' => [1200, 630],
    'twitter-image.jpg' => [1200, 600],
    'twitter-default.jpg' => [1200, 600]
];

foreach ($ogSizes as $filename => $dimensions) {
    $width = $dimensions[0];
    $height = $dimensions[1];

    $image = imagecreatetruecolor($width, $height);
    $bg = imagecolorallocate($image, $bgColor[0], $bgColor[1], $bgColor[2]);
    $white = imagecolorallocate($image, 255, 255, 255);
    $darkText = imagecolorallocate($image, 50, 50, 50);

    imagefill($image, 0, 0, $bg);

    // Add text
    $font = 5;
    $title = "Ohio Beer Path";
    $subtitle = "Discover Ohio's Finest Breweries";

    // Center the text
    $titleX = ($width - strlen($title) * imagefontwidth($font)) / 2;
    $subtitleX = ($width - strlen($subtitle) * imagefontwidth($font)) / 2;

    imagestring($image, $font, (int)$titleX, (int)($height / 2 - 20), $title, $white);
    imagestring($image, $font, (int)$subtitleX, (int)($height / 2 + 10), $subtitle, $white);

    $filepath = __DIR__ . '/assets/images/' . $filename;
    imagejpeg($image, $filepath, 90);
    imagedestroy($image);
    echo "Created: {$filename}\n";
}

// Create logo.png
$logoSize = 200;
$logo = generateIcon($logoSize, $bgColor, $textColor, false);
imagepng($logo, __DIR__ . '/assets/images/logo.png');
imagedestroy($logo);
echo "Created: logo.png\n";

echo "\nAll icons generated successfully!\n";
echo "\nNote: For production, replace these generated icons with properly designed graphics.\n";
