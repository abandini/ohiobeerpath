/**
 * Ohio Beer Path - Progressive Web App
 * 
 * This file handles service worker registration, installation prompts,
 * and other PWA-related functionality.
 */

// Initialize the PWA functionality
document.addEventListener('DOMContentLoaded', () => {
    // Register service worker
    registerServiceWorker();
    
    // Initialize "Add to Home Screen" functionality
    initInstallPrompt();
    
    // Initialize push notifications
    initPushNotifications();
});

/**
 * Register the service worker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('Service Worker update found!');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
                
            // Handle service worker updates
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        });
    }
}

// Flag to prevent multiple refreshes
let refreshing = false;

/**
 * Show notification when a service worker update is available
 */
function showUpdateNotification() {
    // Create update notification element
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
        <div class="update-notification-content">
            <p><i class="bi bi-arrow-clockwise me-2"></i> A new version is available!</p>
            <button id="updateButton" class="btn btn-sm btn-primary">Update Now</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(updateNotification);
    
    // Show notification
    setTimeout(() => {
        updateNotification.classList.add('show');
    }, 100);
    
    // Add event listener to update button
    document.getElementById('updateButton').addEventListener('click', () => {
        window.location.reload();
    });
}

/**
 * Initialize "Add to Home Screen" functionality
 */
function initInstallPrompt() {
    let deferredPrompt;
    const installButton = document.getElementById('installPwaButton');
    
    // Hide install button initially
    if (installButton) {
        installButton.style.display = 'none';
    }
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Show the install button
        if (installButton) {
            installButton.style.display = 'block';
            
            // Add click event to install button
            installButton.addEventListener('click', () => {
                // Hide install button
                installButton.style.display = 'none';
                
                // Show the install prompt
                deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                        
                        // Show success message
                        showInstallSuccess();
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    
                    // Clear the deferred prompt
                    deferredPrompt = null;
                });
            });
        }
    });
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', (e) => {
        console.log('App was installed', e);
        
        // Hide install button
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // Show success message
        showInstallSuccess();
        
        // Track install event with analytics
        if (typeof OhioBeerPath !== 'undefined' && OhioBeerPath.analytics) {
            OhioBeerPath.analytics.trackEvent('pwa', 'installed');
        }
    });
}

/**
 * Show success message after app installation
 */
function showInstallSuccess() {
    // Create success notification
    const successNotification = document.createElement('div');
    successNotification.className = 'install-success-notification';
    successNotification.innerHTML = `
        <div class="install-success-content">
            <p><i class="bi bi-check-circle-fill me-2"></i> Ohio Beer Path was added to your home screen!</p>
            <button class="btn-close" aria-label="Close"></button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(successNotification);
    
    // Show notification
    setTimeout(() => {
        successNotification.classList.add('show');
    }, 100);
    
    // Add event listener to close button
    successNotification.querySelector('.btn-close').addEventListener('click', () => {
        successNotification.classList.remove('show');
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(successNotification);
        }, 300);
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successNotification.classList.remove('show');
        
        // Remove after animation
        setTimeout(() => {
            if (document.body.contains(successNotification)) {
                document.body.removeChild(successNotification);
            }
        }, 300);
    }, 5000);
}

/**
 * Initialize push notifications
 */
function initPushNotifications() {
    const enableNotificationsButton = document.getElementById('enableNotificationsButton');
    
    // Check if push notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        // Hide notification button if not supported
        if (enableNotificationsButton) {
            enableNotificationsButton.style.display = 'none';
        }
        return;
    }
    
    // Check notification permission
    if (Notification.permission === 'granted') {
        // Already granted, update UI
        if (enableNotificationsButton) {
            enableNotificationsButton.textContent = 'Notifications Enabled';
            enableNotificationsButton.disabled = true;
        }
    } else if (Notification.permission === 'denied') {
        // Permission denied, update UI
        if (enableNotificationsButton) {
            enableNotificationsButton.textContent = 'Notifications Blocked';
            enableNotificationsButton.disabled = true;
        }
    } else {
        // Permission not determined, add click event
        if (enableNotificationsButton) {
            enableNotificationsButton.addEventListener('click', requestNotificationPermission);
        }
    }
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        const enableNotificationsButton = document.getElementById('enableNotificationsButton');
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            
            // Update button
            if (enableNotificationsButton) {
                enableNotificationsButton.textContent = 'Notifications Enabled';
                enableNotificationsButton.disabled = true;
            }
            
            // Subscribe to push notifications
            subscribeToPushNotifications();
            
            // Show a test notification
            showWelcomeNotification();
        } else {
            console.log('Notification permission denied');
            
            // Update button
            if (enableNotificationsButton) {
                enableNotificationsButton.textContent = 'Notifications Blocked';
                enableNotificationsButton.disabled = true;
            }
        }
    });
}

/**
 * Subscribe to push notifications
 */
function subscribeToPushNotifications() {
    navigator.serviceWorker.ready.then(registration => {
        // Check if already subscribed
        registration.pushManager.getSubscription().then(subscription => {
            if (subscription) {
                // Already subscribed
                console.log('User is already subscribed to push notifications');
                return subscription;
            }
            
            // Get server's public key
            return fetch('/api/push-public-key.php')
                .then(response => response.json())
                .then(data => {
                    // Convert public key to Uint8Array
                    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
                    
                    // Subscribe
                    return registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey
                    });
                })
                .then(newSubscription => {
                    // Send subscription to server
                    return sendSubscriptionToServer(newSubscription);
                })
                .catch(error => {
                    console.error('Failed to subscribe to push notifications:', error);
                });
        });
    });
}

/**
 * Send push subscription to server
 */
function sendSubscriptionToServer(subscription) {
    return fetch('/api/save-subscription.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Push subscription saved on server:', data);
        return subscription;
    })
    .catch(error => {
        console.error('Failed to save push subscription on server:', error);
        throw error;
    });
}

/**
 * Show welcome notification
 */
function showWelcomeNotification() {
    navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Welcome to Ohio Beer Path!', {
            body: 'You will now receive updates about new breweries and events.',
            icon: '/assets/images/favicon/android-chrome-192x192.png',
            badge: '/assets/images/favicon/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                url: '/'
            }
        });
    });
}

/**
 * Convert base64 to Uint8Array for push notification
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}
