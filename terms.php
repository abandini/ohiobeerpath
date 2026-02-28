<?php
require_once('config.php');
require_once('includes/seo-utils.php');

// Define page-specific metadata
$meta = [
    'title' => 'Terms of Use - Ohio Beer Path',
    'description' => 'Terms of Use for Ohio Beer Path. Please read these terms carefully before using our services.',
    'keywords' => 'terms of use, terms of service, ohio beer path, user agreement'
];

$og = [
    'title' => 'Terms of Use - Ohio Beer Path',
    'description' => 'Terms of Use for Ohio Beer Path.',
    'type' => 'website'
];

$twitter = [
    'card' => 'summary',
    'title' => 'Terms of Use - Ohio Beer Path',
    'description' => 'Terms of Use for Ohio Beer Path.'
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
    $active_page = 'terms';
    include('includes/navigation.php');
    ?>

    <main class="container my-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <h1 class="mb-4">Terms of Use</h1>
                <p class="text-muted">Last updated: <?php echo date('F j, Y'); ?></p>

                <section class="mb-5">
                    <h2 class="h4">Acceptance of Terms</h2>
                    <p>By accessing and using Ohio Beer Path, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.</p>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Use of Service</h2>
                    <p>Ohio Beer Path provides information about breweries in Ohio to help users plan brewery visits. Our service is intended for:</p>
                    <ul>
                        <li>Adults of legal drinking age (21+ in Ohio)</li>
                        <li>Personal, non-commercial use</li>
                        <li>Planning brewery visits and tours</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Responsible Drinking</h2>
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Important:</strong> Always drink responsibly. Never drink and drive. Use a designated driver or rideshare service when visiting breweries.
                    </div>
                    <p>Ohio Beer Path promotes responsible alcohol consumption. We encourage all users to:</p>
                    <ul>
                        <li>Plan for safe transportation before visiting breweries</li>
                        <li>Know your limits and drink responsibly</li>
                        <li>Never operate a vehicle under the influence of alcohol</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Accuracy of Information</h2>
                    <p>While we strive to provide accurate and up-to-date information about breweries, we cannot guarantee that all information (including hours, addresses, and amenities) is current. We recommend:</p>
                    <ul>
                        <li>Verifying brewery hours before visiting</li>
                        <li>Contacting breweries directly for the most current information</li>
                        <li>Checking brewery websites and social media for updates</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">User Conduct</h2>
                    <p>Users agree not to:</p>
                    <ul>
                        <li>Use the service for any unlawful purpose</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Interfere with or disrupt the service</li>
                        <li>Scrape or collect data from the service without permission</li>
                    </ul>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Disclaimer of Warranties</h2>
                    <p>Ohio Beer Path is provided "as is" without warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or completely secure.</p>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Limitation of Liability</h2>
                    <p>Ohio Beer Path shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Changes to Terms</h2>
                    <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
                </section>

                <section class="mb-5">
                    <h2 class="h4">Contact</h2>
                    <p>For questions about these Terms of Use, please visit our <a href="about.php">About page</a>.</p>
                </section>
            </div>
        </div>
    </main>

    <?php include('includes/footer.php'); ?>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/core.js"></script>
</body>
</html>
