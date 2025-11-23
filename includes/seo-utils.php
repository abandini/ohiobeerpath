<?php
/**
 * SEO Utilities for Ohio Beer Path
 * 
 * This file contains functions for generating and managing SEO-related elements:
 * - Meta tags (title, description, keywords)
 * - Open Graph tags
 * - Twitter Card tags
 * - JSON-LD structured data
 */

/**
 * Generate standard meta tags for a page
 * 
 * @param array $meta Array containing meta information
 * @return string HTML meta tags
 */
function generate_meta_tags($meta = []) {
    // Default values
    $defaults = [
        'title' => 'Ohio Beer Path - Discover Ohio\'s Finest Breweries',
        'description' => 'Plan your ultimate Ohio brewery tour with Ohio Beer Path. Discover craft breweries, create custom beer trails, and explore Ohio\'s vibrant beer scene.',
        'keywords' => 'ohio breweries, craft beer ohio, brewery tour, beer trail, ohio beer path, craft beer, brewery map',
        'robots' => 'index, follow',
        'canonical' => get_current_url()
    ];
    
    // Merge defaults with provided meta
    $meta = array_merge($defaults, $meta);
    
    // Start building meta tags
    $output = '';
    
    // Basic meta tags
    $output .= '<title>' . htmlspecialchars($meta['title']) . '</title>' . PHP_EOL;
    $output .= '<meta name="description" content="' . htmlspecialchars($meta['description']) . '">' . PHP_EOL;
    $output .= '<meta name="keywords" content="' . htmlspecialchars($meta['keywords']) . '">' . PHP_EOL;
    $output .= '<meta name="robots" content="' . htmlspecialchars($meta['robots']) . '">' . PHP_EOL;
    $output .= '<link rel="canonical" href="' . htmlspecialchars($meta['canonical']) . '">' . PHP_EOL;
    
    return $output;
}

/**
 * Generate Open Graph meta tags
 * 
 * @param array $og Array containing Open Graph information
 * @return string HTML Open Graph meta tags
 */
function generate_open_graph_tags($og = []) {
    // Default values
    $defaults = [
        'title' => 'Ohio Beer Path - Discover Ohio\'s Finest Breweries',
        'description' => 'Plan your ultimate Ohio brewery tour with Ohio Beer Path. Discover craft breweries, create custom beer trails, and explore Ohio\'s vibrant beer scene.',
        'type' => 'website',
        'url' => get_current_url(),
        'image' => get_site_url() . '/assets/images/og-default.jpg',
        'site_name' => 'Ohio Beer Path'
    ];
    
    // Merge defaults with provided OG data
    $og = array_merge($defaults, $og);
    
    // Start building OG tags
    $output = '';
    
    // Basic Open Graph tags
    $output .= '<meta property="og:title" content="' . htmlspecialchars($og['title']) . '">' . PHP_EOL;
    $output .= '<meta property="og:description" content="' . htmlspecialchars($og['description']) . '">' . PHP_EOL;
    $output .= '<meta property="og:type" content="' . htmlspecialchars($og['type']) . '">' . PHP_EOL;
    $output .= '<meta property="og:url" content="' . htmlspecialchars($og['url']) . '">' . PHP_EOL;
    $output .= '<meta property="og:image" content="' . htmlspecialchars($og['image']) . '">' . PHP_EOL;
    $output .= '<meta property="og:site_name" content="' . htmlspecialchars($og['site_name']) . '">' . PHP_EOL;
    
    // Optional Open Graph tags
    if (isset($og['locale'])) {
        $output .= '<meta property="og:locale" content="' . htmlspecialchars($og['locale']) . '">' . PHP_EOL;
    }
    
    if (isset($og['image:width']) && isset($og['image:height'])) {
        $output .= '<meta property="og:image:width" content="' . htmlspecialchars($og['image:width']) . '">' . PHP_EOL;
        $output .= '<meta property="og:image:height" content="' . htmlspecialchars($og['image:height']) . '">' . PHP_EOL;
    }
    
    return $output;
}

/**
 * Generate Twitter Card meta tags
 * 
 * @param array $twitter Array containing Twitter Card information
 * @return string HTML Twitter Card meta tags
 */
function generate_twitter_card_tags($twitter = []) {
    // Default values
    $defaults = [
        'card' => 'summary_large_image',
        'title' => 'Ohio Beer Path - Discover Ohio\'s Finest Breweries',
        'description' => 'Plan your ultimate Ohio brewery tour with Ohio Beer Path. Discover craft breweries, create custom beer trails, and explore Ohio\'s vibrant beer scene.',
        'image' => get_site_url() . '/assets/images/twitter-default.jpg',
        'site' => '@OhioBeerPath'
    ];
    
    // Merge defaults with provided Twitter data
    $twitter = array_merge($defaults, $twitter);
    
    // Start building Twitter Card tags
    $output = '';
    
    // Basic Twitter Card tags
    $output .= '<meta name="twitter:card" content="' . htmlspecialchars($twitter['card']) . '">' . PHP_EOL;
    $output .= '<meta name="twitter:title" content="' . htmlspecialchars($twitter['title']) . '">' . PHP_EOL;
    $output .= '<meta name="twitter:description" content="' . htmlspecialchars($twitter['description']) . '">' . PHP_EOL;
    $output .= '<meta name="twitter:image" content="' . htmlspecialchars($twitter['image']) . '">' . PHP_EOL;
    $output .= '<meta name="twitter:site" content="' . htmlspecialchars($twitter['site']) . '">' . PHP_EOL;
    
    // Optional Twitter Card tags
    if (isset($twitter['creator'])) {
        $output .= '<meta name="twitter:creator" content="' . htmlspecialchars($twitter['creator']) . '">' . PHP_EOL;
    }
    
    return $output;
}

/**
 * Generate JSON-LD structured data for a brewery
 * 
 * @param array $brewery Brewery data
 * @return string JSON-LD script tag
 */
function generate_brewery_schema($brewery) {
    // Ensure required fields are present
    if (!isset($brewery['id']) || !isset($brewery['name'])) {
        return '';
    }
    
    // Build the schema
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'LocalBusiness',
        'subType' => 'Brewery',
        '@id' => get_site_url() . '/brewery.php?id=' . $brewery['id'],
        'name' => $brewery['name'],
        'url' => get_site_url() . '/brewery.php?id=' . $brewery['id'],
        'description' => isset($brewery['description']) ? $brewery['description'] : 'Craft brewery in Ohio',
        'telephone' => isset($brewery['phone']) ? $brewery['phone'] : null,
        'email' => isset($brewery['email']) ? $brewery['email'] : null,
        'sameAs' => []
    ];
    
    // Add social media links if available
    if (isset($brewery['website'])) {
        $schema['sameAs'][] = $brewery['website'];
    }
    
    if (isset($brewery['facebook'])) {
        $schema['sameAs'][] = $brewery['facebook'];
    }
    
    if (isset($brewery['instagram'])) {
        $schema['sameAs'][] = $brewery['instagram'];
    }
    
    if (isset($brewery['twitter'])) {
        $schema['sameAs'][] = $brewery['twitter'];
    }
    
    // Add address if available
    if (isset($brewery['street']) && isset($brewery['city']) && isset($brewery['state']) && isset($brewery['zip'])) {
        $schema['address'] = [
            '@type' => 'PostalAddress',
            'streetAddress' => $brewery['street'],
            'addressLocality' => $brewery['city'],
            'addressRegion' => $brewery['state'],
            'postalCode' => $brewery['zip'],
            'addressCountry' => 'US'
        ];
    }
    
    // Add geo coordinates if available
    if (isset($brewery['latitude']) && isset($brewery['longitude'])) {
        $schema['geo'] = [
            '@type' => 'GeoCoordinates',
            'latitude' => $brewery['latitude'],
            'longitude' => $brewery['longitude']
        ];
    }
    
    // Add opening hours if available
    if (isset($brewery['hours']) && is_array($brewery['hours'])) {
        $schema['openingHoursSpecification'] = [];
        
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        foreach ($days as $day) {
            $dayKey = strtolower($day);
            if (isset($brewery['hours'][$dayKey])) {
                $hours = $brewery['hours'][$dayKey];
                
                if ($hours === 'Closed') {
                    continue;
                }
                
                list($open, $close) = explode('-', $hours);
                
                $schema['openingHoursSpecification'][] = [
                    '@type' => 'OpeningHoursSpecification',
                    'dayOfWeek' => $day,
                    'opens' => trim($open),
                    'closes' => trim($close)
                ];
            }
        }
    }
    
    // Add image if available
    if (isset($brewery['image'])) {
        $schema['image'] = $brewery['image'];
    }
    
    // Convert to JSON and wrap in script tag
    $json = json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    return '<script type="application/ld+json">' . PHP_EOL . $json . PHP_EOL . '</script>';
}

/**
 * Generate JSON-LD structured data for a brewery event
 * 
 * @param array $event Event data
 * @return string JSON-LD script tag
 */
function generate_event_schema($event) {
    // Ensure required fields are present
    if (!isset($event['id']) || !isset($event['name']) || !isset($event['startDate'])) {
        return '';
    }
    
    // Build the schema
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Event',
        '@id' => get_site_url() . '/event.php?id=' . $event['id'],
        'name' => $event['name'],
        'startDate' => $event['startDate'],
        'endDate' => isset($event['endDate']) ? $event['endDate'] : $event['startDate'],
        'description' => isset($event['description']) ? $event['description'] : '',
        'url' => get_site_url() . '/event.php?id=' . $event['id']
    ];
    
    // Add location if available
    if (isset($event['brewery_id'])) {
        $schema['location'] = [
            '@type' => 'Place',
            'name' => isset($event['brewery_name']) ? $event['brewery_name'] : 'Ohio Brewery',
            'url' => get_site_url() . '/brewery.php?id=' . $event['brewery_id']
        ];
        
        // Add address if available
        if (isset($event['brewery_address'])) {
            $schema['location']['address'] = [
                '@type' => 'PostalAddress',
                'streetAddress' => $event['brewery_address']
            ];
            
            if (isset($event['brewery_city'])) {
                $schema['location']['address']['addressLocality'] = $event['brewery_city'];
            }
            
            if (isset($event['brewery_state'])) {
                $schema['location']['address']['addressRegion'] = $event['brewery_state'];
            }
            
            if (isset($event['brewery_zip'])) {
                $schema['location']['address']['postalCode'] = $event['brewery_zip'];
            }
            
            $schema['location']['address']['addressCountry'] = 'US';
        }
    }
    
    // Add image if available
    if (isset($event['image'])) {
        $schema['image'] = $event['image'];
    }
    
    // Add offers if available
    if (isset($event['price'])) {
        $schema['offers'] = [
            '@type' => 'Offer',
            'price' => $event['price'],
            'priceCurrency' => 'USD',
            'availability' => 'https://schema.org/InStock',
            'url' => get_site_url() . '/event.php?id=' . $event['id']
        ];
    }
    
    // Convert to JSON and wrap in script tag
    $json = json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    return '<script type="application/ld+json">' . PHP_EOL . $json . PHP_EOL . '</script>';
}

/**
 * Generate JSON-LD structured data for the website (Organization)
 * 
 * @return string JSON-LD script tag
 */
function generate_website_schema() {
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Organization',
        '@id' => get_site_url() . '#organization',
        'name' => 'Ohio Beer Path',
        'url' => get_site_url(),
        'logo' => get_site_url() . '/assets/images/logo.png',
        'description' => 'Ohio Beer Path helps you discover Ohio\'s finest breweries and plan your ultimate brewery tour.',
        'sameAs' => [
            'https://www.facebook.com/ohiobeerpath',
            'https://www.instagram.com/ohiobeerpath',
            'https://twitter.com/OhioBeerPath'
        ]
    ];
    
    // Convert to JSON and wrap in script tag
    $json = json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    return '<script type="application/ld+json">' . PHP_EOL . $json . PHP_EOL . '</script>';
}

/**
 * Generate JSON-LD structured data for a BreadcrumbList
 * 
 * @param array $breadcrumbs Array of breadcrumb items
 * @return string JSON-LD script tag
 */
function generate_breadcrumb_schema($breadcrumbs) {
    if (empty($breadcrumbs)) {
        return '';
    }
    
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => []
    ];
    
    foreach ($breadcrumbs as $index => $crumb) {
        $schema['itemListElement'][] = [
            '@type' => 'ListItem',
            'position' => $index + 1,
            'name' => $crumb['name'],
            'item' => $crumb['url']
        ];
    }
    
    // Convert to JSON and wrap in script tag
    $json = json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    return '<script type="application/ld+json">' . PHP_EOL . $json . PHP_EOL . '</script>';
}

/**
 * Get the current URL
 * 
 * @return string Current URL
 */
function get_current_url() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $uri = $_SERVER['REQUEST_URI'];
    
    return $protocol . '://' . $host . $uri;
}

/**
 * Get the site URL
 * 
 * @return string Site URL
 */
function get_site_url() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    
    return $protocol . '://' . $host;
}

/**
 * Generate breadcrumb HTML
 * 
 * @param array $breadcrumbs Array of breadcrumb items
 * @return string HTML breadcrumb
 */
function generate_breadcrumb_html($breadcrumbs) {
    if (empty($breadcrumbs)) {
        return '';
    }
    
    $output = '<nav aria-label="breadcrumb">';
    $output .= '<ol class="breadcrumb">';
    
    foreach ($breadcrumbs as $index => $crumb) {
        $isLast = $index === count($breadcrumbs) - 1;
        
        if ($isLast) {
            $output .= '<li class="breadcrumb-item active" aria-current="page">' . htmlspecialchars($crumb['name']) . '</li>';
        } else {
            $output .= '<li class="breadcrumb-item"><a href="' . htmlspecialchars($crumb['url']) . '">' . htmlspecialchars($crumb['name']) . '</a></li>';
        }
    }
    
    $output .= '</ol>';
    $output .= '</nav>';
    
    return $output;
}
