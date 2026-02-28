<?php
require_once('config.php');
require_once('includes/seo-utils.php');

// Define page-specific metadata
$meta = [
    'title' => 'Privacy Policy - Ohio Beer Path',
    'description' => 'Privacy Policy for Ohio Beer Path. Learn how we collect, use, and protect your information.',
    'keywords' => 'privacy policy, ohio beer path, data protection, user privacy'
];

$og = [
    'title' => 'Privacy Policy - Ohio Beer Path',
    'description' => 'Privacy Policy for Ohio Beer Path. Learn how we collect, use, and protect your information.',
    'type' => 'website'
];

$twitter = [
    'card' => 'summary',
    'title' => 'Privacy Policy - Ohio Beer Path',
    'description' => 'Privacy Policy for Ohio Beer Path.'
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <?php
    echo generate_meta_tags($meta);
    echo generate_open_graph_tags($og);
    echo generate_twitter_card_tags($twitter);
    ?>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/mobile.css">

    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="theme-color" content="#007bff">
    <link rel="manifest" href="/site.webmanifest">
</head>
<body>
    <?php
    $active_page = 'privacy';
    include('includes/navigation.php');
    ?>

    <main class="container my-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <h1 class="mb-4">Privacy Policy</h1>
                <p class="text-muted">Last updated: <?php echo date('F j, Y'); ?></p>

                <section class="mb-5">
                    <h2 class="h4">Information We Collect</h2>
                    <p>Ohio Beer Path collects information to provide better services to our users. We collect information in the following ways:</p>
                    <ul>
                        <li><strong>Information you provide:</strong> When you create an itinerary or use our services, we may collect your location data (with your permission) to show nearby breweries.</li>
                        <li><strong>Automatically collected information:</strong> We collect information about your device and how you interact with our services, including browser type, pages visited, and time spent on pages.</li>
                        <li><strong>Cookies and local storage:</strong> We use cookies and browser local storage to save your itinerary and preferences.</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">How We Use Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Provide, maintain, and improve our services</li>
                        <li>Show you breweries near your location</li>
                        <li>Save your brewery tour itinerary</li>
                        <li>Analyze usage patterns to improve user experience</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Data Storage</h2>
                    <p>Your itinerary data is stored locally in your browser using localStorage. This data remains on your device and is not transmitted to our servers unless you explicitly choose to share or save it.</p>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Google Maps:</strong> To display brewery locations and provide directions. Google's privacy policy applies to their services.</li>
                        <li><strong>Analytics:</strong> We may use analytics services to understand how users interact with our site.</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Clear your local data at any time through your browser settings</li>
                        <li>Disable location services for this site</li>
                        <li>Request information about data we have collected</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Contact Us</h2>
                    <p>If you have questions about this Privacy Policy, please contact us through our <a href="about.php">About page</a>.</p>
                </section>
            </div>
        </div>
    </main>

    <?php include('includes/footer.php'); ?>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/core.js"></script>
</body>
</html>
