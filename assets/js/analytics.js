/**
 * Ohio Beer Path - Analytics Module
 * 
 * This file provides analytics functionality for tracking user behavior,
 * brewery engagement, and conversion metrics.
 */

// Initialize analytics namespace
if (!window.OhioBeerPath) {
    window.OhioBeerPath = {};
}

// Analytics module
OhioBeerPath.analytics = (function() {
    // Private variables
    let _initialized = false;
    let _userId = null;
    let _sessionId = null;
    let _pageViewCount = 0;
    let _startTime = null;
    let _lastActivity = null;
    let _currentPage = null;
    let _previousPage = null;
    let _queue = [];
    let _config = {
        endpoint: '/api/analytics.php',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        batchSize: 10,
        flushInterval: 10000, // 10 seconds
        samplingRate: 100, // 100%
        trackClicks: true,
        trackForms: true,
        trackPageView: true,
        trackPageTime: true,
        trackErrors: true,
        trackPerformance: true,
        useBeacon: true,
        debug: false
    };
    
    /**
     * Initialize the analytics module
     * @param {Object} config Configuration options
     */
    function init(config = {}) {
        if (_initialized) {
            return;
        }
        
        // Merge config with defaults
        _config = { ..._config, ...config };
        
        // Log initialization in debug mode
        _debug('Analytics initialized with config:', _config);
        
        // Generate or retrieve user ID
        _userId = _getUserId();
        
        // Generate session ID
        _sessionId = _generateId();
        
        // Store session start time
        _startTime = Date.now();
        _lastActivity = _startTime;
        
        // Set current page
        _currentPage = window.location.pathname + window.location.search;
        
        // Setup event listeners
        _setupEventListeners();
        
        // Track initial page view
        if (_config.trackPageView) {
            trackPageView();
        }
        
        // Setup performance tracking
        if (_config.trackPerformance) {
            _trackPerformance();
        }
        
        // Setup error tracking
        if (_config.trackErrors) {
            _setupErrorTracking();
        }
        
        // Setup periodic flush
        setInterval(_flush, _config.flushInterval);
        
        // Setup session timeout check
        setInterval(_checkSessionTimeout, 60000); // Check every minute
        
        // Setup flush on page unload
        window.addEventListener('beforeunload', () => {
            if (_config.trackPageTime) {
                _trackPageTime();
            }
            _flush(true);
        });
        
        _initialized = true;
    }
    
    /**
     * Track a page view
     * @param {string} url Optional URL (defaults to current URL)
     * @param {Object} data Additional data to track
     */
    function trackPageView(url, data = {}) {
        if (!_initialized) {
            _queue.push(['trackPageView', url, data]);
            return;
        }
        
        // Track time spent on previous page
        if (_config.trackPageTime && _previousPage) {
            _trackPageTime();
        }
        
        // Update page tracking
        _previousPage = _currentPage;
        _currentPage = url || window.location.pathname + window.location.search;
        _pageViewCount++;
        
        // Reset activity time
        _lastActivity = Date.now();
        
        // Prepare data
        const eventData = {
            type: 'pageview',
            url: _currentPage,
            referrer: document.referrer || _previousPage,
            title: document.title,
            pageViewCount: _pageViewCount,
            ...data
        };
        
        // Add to queue
        _addToQueue(eventData);
        
        _debug('Page view tracked:', eventData);
        
        // Track performance metrics for the page
        if (_config.trackPerformance) {
            _trackPerformance();
        }
    }
    
    /**
     * Track a user event
     * @param {string} category Event category
     * @param {string} action Event action
     * @param {string} label Optional event label
     * @param {number} value Optional event value
     * @param {Object} data Additional data
     */
    function trackEvent(category, action, label = null, value = null, data = {}) {
        if (!_initialized) {
            _queue.push(['trackEvent', category, action, label, value, data]);
            return;
        }
        
        // Reset activity time
        _lastActivity = Date.now();
        
        // Prepare data
        const eventData = {
            type: 'event',
            category,
            action,
            label,
            value,
            page: _currentPage,
            ...data
        };
        
        // Add to queue
        _addToQueue(eventData);
        
        _debug('Event tracked:', eventData);
    }
    
    /**
     * Track brewery engagement
     * @param {string} breweryId Brewery ID
     * @param {string} action Action (view, save, directions, website, etc.)
     * @param {Object} data Additional data
     */
    function trackBrewery(breweryId, action, data = {}) {
        if (!_initialized || !breweryId) {
            return;
        }
        
        trackEvent('brewery', action, breweryId, null, {
            breweryId,
            ...data
        });
    }
    
    /**
     * Track itinerary actions
     * @param {string} action Action (create, save, share, etc.)
     * @param {Object} data Additional data
     */
    function trackItinerary(action, data = {}) {
        if (!_initialized) {
            return;
        }
        
        trackEvent('itinerary', action, null, null, data);
    }
    
    /**
     * Track search queries
     * @param {string} query Search query
     * @param {number} resultCount Number of results
     * @param {Object} filters Search filters
     */
    function trackSearch(query, resultCount, filters = {}) {
        if (!_initialized || !query) {
            return;
        }
        
        trackEvent('search', 'query', query, resultCount, {
            query,
            resultCount,
            filters
        });
    }
    
    /**
     * Track user conversion (completing a goal)
     * @param {string} type Conversion type
     * @param {Object} data Additional data
     */
    function trackConversion(type, data = {}) {
        if (!_initialized) {
            return;
        }
        
        const eventData = {
            type: 'conversion',
            conversionType: type,
            page: _currentPage,
            ...data
        };
        
        // Add to queue with high priority
        _addToQueue(eventData, true);
        
        _debug('Conversion tracked:', eventData);
    }
    
    /**
     * Track form submissions
     * @param {string} formId Form identifier
     * @param {Object} data Form data (sensitive data should be filtered)
     */
    function trackForm(formId, data = {}) {
        if (!_initialized) {
            return;
        }
        
        trackEvent('form', 'submit', formId, null, {
            formId,
            formData: _sanitizeData(data)
        });
    }
    
    /**
     * Track user feedback
     * @param {number} rating User rating (1-5)
     * @param {string} comment User comment
     * @param {string} category Feedback category
     */
    function trackFeedback(rating, comment = null, category = 'general') {
        if (!_initialized) {
            return;
        }
        
        trackEvent('feedback', category, comment, rating, {
            rating,
            comment,
            category
        });
    }
    
    /**
     * Track error events
     * @param {string} message Error message
     * @param {string} source Error source
     * @param {number} lineno Line number
     * @param {number} colno Column number
     * @param {Error} error Error object
     */
    function trackError(message, source, lineno, colno, error) {
        if (!_initialized) {
            return;
        }
        
        const errorData = {
            type: 'error',
            message,
            source,
            lineno,
            colno,
            stack: error && error.stack,
            page: _currentPage
        };
        
        // Add to queue with high priority
        _addToQueue(errorData, true);
        
        _debug('Error tracked:', errorData);
    }
    
    /**
     * Track time spent on page
     * @private
     */
    function _trackPageTime() {
        if (!_previousPage) {
            return;
        }
        
        const now = Date.now();
        const timeOnPage = now - _lastActivity;
        
        // Only track if time is reasonable (less than session timeout)
        if (timeOnPage > 0 && timeOnPage < _config.sessionTimeout) {
            const eventData = {
                type: 'timing',
                category: 'page',
                action: 'time',
                label: _previousPage,
                value: Math.round(timeOnPage / 1000), // Convert to seconds
                page: _previousPage
            };
            
            _addToQueue(eventData);
            _debug('Page time tracked:', eventData);
        }
    }
    
    /**
     * Track performance metrics
     * @private
     */
    function _trackPerformance() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const now = Date.now();
            
            // Wait for the page to finish loading
            if (timing.loadEventEnd > 0) {
                const perfData = {
                    type: 'performance',
                    page: _currentPage,
                    metrics: {
                        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
                        connectTime: timing.connectEnd - timing.connectStart,
                        ttfb: timing.responseStart - timing.requestStart,
                        domLoad: timing.domComplete - timing.domLoading,
                        pageLoad: timing.loadEventEnd - timing.navigationStart,
                        totalTime: timing.loadEventEnd - timing.navigationStart
                    }
                };
                
                // Add resource timing if available
                if (window.performance.getEntriesByType) {
                    try {
                        const resources = window.performance.getEntriesByType('resource');
                        const resourceStats = {
                            count: resources.length,
                            totalSize: 0,
                            types: {}
                        };
                        
                        resources.forEach(resource => {
                            // Calculate size if available
                            if (resource.transferSize) {
                                resourceStats.totalSize += resource.transferSize;
                            }
                            
                            // Group by resource type
                            const type = resource.initiatorType || 'other';
                            if (!resourceStats.types[type]) {
                                resourceStats.types[type] = {
                                    count: 0,
                                    totalTime: 0
                                };
                            }
                            
                            resourceStats.types[type].count++;
                            resourceStats.types[type].totalTime += resource.responseEnd - resource.startTime;
                        });
                        
                        perfData.resources = resourceStats;
                    } catch (e) {
                        _debug('Error collecting resource timing:', e);
                    }
                }
                
                _addToQueue(perfData);
                _debug('Performance tracked:', perfData);
                
                // Clear the performance data to prepare for next page
                if (window.performance.clearResourceTimings) {
                    window.performance.clearResourceTimings();
                }
            } else {
                // Try again later if page hasn't finished loading
                setTimeout(_trackPerformance, 1000);
            }
        }
    }
    
    /**
     * Set up error tracking
     * @private
     */
    function _setupErrorTracking() {
        window.addEventListener('error', (event) => {
            trackError(
                event.message,
                event.filename,
                event.lineno,
                event.colno,
                event.error
            );
            
            // Don't prevent default error handling
            return false;
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            let message = 'Promise Rejection';
            let stack = null;
            
            if (event.reason) {
                if (typeof event.reason === 'string') {
                    message = event.reason;
                } else if (event.reason.message) {
                    message = event.reason.message;
                    stack = event.reason.stack;
                }
            }
            
            trackError(
                message,
                'unhandledrejection',
                0,
                0,
                { stack }
            );
            
            // Don't prevent default error handling
            return false;
        });
    }
    
    /**
     * Set up event listeners for tracking
     * @private
     */
    function _setupEventListeners() {
        // Track user activity
        ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(eventType => {
            window.addEventListener(eventType, () => {
                _lastActivity = Date.now();
            }, { passive: true });
        });
        
        // Track clicks if enabled
        if (_config.trackClicks) {
            document.addEventListener('click', (event) => {
                // Find the closest element with data-track attribute or a link
                let target = event.target;
                let trackData = null;
                let isLink = false;
                
                // Traverse up to 5 levels up the DOM tree
                for (let i = 0; i < 5 && target && !trackData; i++) {
                    if (target.hasAttribute && target.hasAttribute('data-track')) {
                        trackData = target.getAttribute('data-track');
                    }
                    
                    if (target.tagName === 'A') {
                        isLink = true;
                        break;
                    }
                    
                    target = target.parentNode;
                }
                
                // Track elements with data-track attribute
                if (trackData) {
                    try {
                        const data = JSON.parse(trackData);
                        if (data.category && data.action) {
                            trackEvent(data.category, data.action, data.label, data.value, data);
                        }
                    } catch (e) {
                        // If not valid JSON, use as category/action
                        const parts = trackData.split(':');
                        if (parts.length >= 2) {
                            trackEvent(parts[0], parts[1], parts[2] || null);
                        }
                    }
                }
                // Track link clicks
                else if (isLink && target.href && !target.hasAttribute('data-track-ignore')) {
                    const isExternal = target.hostname !== window.location.hostname;
                    const isDownload = target.hasAttribute('download');
                    const isMailto = target.href.indexOf('mailto:') === 0;
                    const isTel = target.href.indexOf('tel:') === 0;
                    
                    let category = 'link';
                    if (isExternal) category = 'external';
                    if (isDownload) category = 'download';
                    if (isMailto) category = 'mailto';
                    if (isTel) category = 'tel';
                    
                    const action = target.getAttribute('data-track-action') || 'click';
                    const label = target.getAttribute('data-track-label') || 
                                 target.innerText || 
                                 target.href;
                    
                    trackEvent(category, action, label, null, {
                        url: target.href,
                        text: target.innerText?.trim()
                    });
                    
                    // Track as conversion if marked
                    if (target.hasAttribute('data-track-conversion')) {
                        const conversionType = target.getAttribute('data-track-conversion') || category;
                        trackConversion(conversionType, {
                            url: target.href,
                            text: target.innerText?.trim()
                        });
                    }
                }
            }, { passive: true });
        }
        
        // Track form submissions if enabled
        if (_config.trackForms) {
            document.addEventListener('submit', (event) => {
                const form = event.target;
                
                // Skip if form has data-track-ignore attribute
                if (form.hasAttribute('data-track-ignore')) {
                    return;
                }
                
                const formId = form.id || form.getAttribute('name') || 'unknown';
                const formData = {};
                
                // Collect form data (excluding sensitive fields)
                if (form.elements) {
                    Array.from(form.elements).forEach(element => {
                        // Skip password fields and fields marked as sensitive
                        if (element.name && 
                            element.value && 
                            element.type !== 'password' && 
                            !element.name.toLowerCase().includes('password') &&
                            !element.name.toLowerCase().includes('token') &&
                            !element.hasAttribute('data-track-ignore')) {
                            
                            // For checkboxes and radio buttons, only include if checked
                            if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
                                return;
                            }
                            
                            // Truncate long values
                            let value = element.value;
                            if (value.length > 100) {
                                value = value.substring(0, 97) + '...';
                            }
                            
                            formData[element.name] = value;
                        }
                    });
                }
                
                trackForm(formId, formData);
                
                // Track as conversion if marked
                if (form.hasAttribute('data-track-conversion')) {
                    const conversionType = form.getAttribute('data-track-conversion') || 'form';
                    trackConversion(conversionType, {
                        formId,
                        formAction: form.action
                    });
                }
            }, { passive: true });
        }
        
        // Track history changes for SPA
        const originalPushState = history.pushState;
        if (originalPushState) {
            history.pushState = function(state) {
                const result = originalPushState.apply(this, arguments);
                
                // Track as page view if URL changed
                const newUrl = window.location.pathname + window.location.search;
                if (newUrl !== _currentPage && _config.trackPageView) {
                    trackPageView(newUrl);
                }
                
                return result;
            };
            
            window.addEventListener('popstate', () => {
                // Track as page view when navigating with back/forward buttons
                const newUrl = window.location.pathname + window.location.search;
                if (newUrl !== _currentPage && _config.trackPageView) {
                    trackPageView(newUrl);
                }
            });
        }
    }
    
    /**
     * Check if session has timed out
     * @private
     */
    function _checkSessionTimeout() {
        const now = Date.now();
        if (now - _lastActivity > _config.sessionTimeout) {
            // Session timed out, create new session
            _sessionId = _generateId();
            _startTime = now;
            _lastActivity = now;
            _pageViewCount = 0;
            
            // Track new session
            _addToQueue({
                type: 'session',
                action: 'start',
                previous: 'timeout'
            });
            
            _debug('Session timeout, new session created');
            
            // Track current page as new page view
            if (_config.trackPageView) {
                trackPageView();
            }
        }
    }
    
    /**
     * Add event to queue
     * @param {Object} data Event data
     * @param {boolean} highPriority Whether to prioritize this event
     * @private
     */
    function _addToQueue(data, highPriority = false) {
        // Apply sampling if configured
        if (_config.samplingRate < 100 && data.type !== 'conversion' && data.type !== 'error') {
            if (Math.random() * 100 > _config.samplingRate) {
                return;
            }
        }
        
        // Add common data
        const event = {
            ...data,
            timestamp: Date.now(),
            sessionId: _sessionId,
            userId: _userId,
            url: data.url || _currentPage,
            referrer: data.referrer || document.referrer,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            sessionDuration: Date.now() - _startTime
        };
        
        // Add to queue (high priority at beginning, normal at end)
        if (highPriority) {
            _queue.unshift(event);
        } else {
            _queue.push(event);
        }
        
        // Flush queue if it's getting large
        if (_queue.length >= _config.batchSize) {
            _flush();
        }
    }
    
    /**
     * Flush events queue
     * @param {boolean} useBeacon Use sendBeacon API if available (for page unload)
     * @private
     */
    function _flush(useBeacon = false) {
        if (!_initialized || _queue.length === 0) {
            return;
        }
        
        // Take events from queue up to batch size
        const events = _queue.splice(0, _config.batchSize);
        
        // Prepare data
        const data = {
            events,
            metadata: {
                timestamp: Date.now(),
                sessionId: _sessionId,
                userId: _userId,
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            }
        };
        
        // Use sendBeacon for more reliable sending during page unload
        if (useBeacon && _config.useBeacon && navigator.sendBeacon) {
            try {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const sent = navigator.sendBeacon(_config.endpoint, blob);
                
                if (!sent) {
                    // If sendBeacon fails, put events back in queue
                    _queue.unshift(...events);
                    _debug('Failed to send events with sendBeacon');
                } else {
                    _debug('Events sent with sendBeacon:', events.length);
                }
            } catch (e) {
                // If sendBeacon throws, fall back to fetch
                _debug('Error using sendBeacon:', e);
                _sendWithFetch(data, events);
            }
        } else {
            _sendWithFetch(data, events);
        }
    }
    
    /**
     * Send data using fetch API
     * @param {Object} data Data to send
     * @param {Array} events Original events array (for error recovery)
     * @private
     */
    function _sendWithFetch(data, events) {
        fetch(_config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            // Use keepalive for better reliability during page unload
            keepalive: true
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            _debug('Events sent successfully:', events.length);
        })
        .catch(error => {
            // Put events back in queue on error
            _queue.unshift(...events);
            _debug('Error sending events:', error);
        });
    }
    
    /**
     * Get or create user ID
     * @returns {string} User ID
     * @private
     */
    function _getUserId() {
        // Try to get existing user ID from localStorage
        let userId = localStorage.getItem('obp_uid');
        
        if (!userId) {
            // Generate new user ID
            userId = _generateId();
            
            // Store in localStorage
            try {
                localStorage.setItem('obp_uid', userId);
            } catch (e) {
                _debug('Error storing user ID:', e);
            }
        }
        
        return userId;
    }
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     * @private
     */
    function _generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Sanitize data to remove sensitive information
     * @param {Object} data Data to sanitize
     * @returns {Object} Sanitized data
     * @private
     */
    function _sanitizeData(data) {
        const sanitized = {};
        const sensitiveFields = ['password', 'token', 'secret', 'credit', 'card', 'cvv', 'ssn', 'social'];
        
        Object.keys(data).forEach(key => {
            // Skip sensitive fields
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
                return;
            }
            
            // Truncate long values
            if (typeof data[key] === 'string' && data[key].length > 100) {
                sanitized[key] = data[key].substring(0, 97) + '...';
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                sanitized[key] = _sanitizeData(data[key]);
            } else {
                sanitized[key] = data[key];
            }
        });
        
        return sanitized;
    }
    
    /**
     * Debug log if debug mode is enabled
     * @private
     */
    function _debug(...args) {
        if (_config.debug && window.console && console.log) {
            console.log('[Analytics]', ...args);
        }
    }
    
    // Process queued calls if any
    function _processQueue() {
        if (window.OhioBeerPath && window.OhioBeerPath._analyticsQueue) {
            const queue = window.OhioBeerPath._analyticsQueue;
            window.OhioBeerPath._analyticsQueue = [];
            
            queue.forEach(item => {
                const method = item[0];
                const args = item.slice(1);
                
                if (typeof OhioBeerPath.analytics[method] === 'function') {
                    OhioBeerPath.analytics[method](...args);
                }
            });
        }
    }
    
    // Public API
    return {
        init,
        trackPageView,
        trackEvent,
        trackBrewery,
        trackItinerary,
        trackSearch,
        trackConversion,
        trackForm,
        trackFeedback,
        trackError,
        flush: () => _flush(true)
    };
})();

// Handle queued calls before script loaded
if (window.OhioBeerPath && Array.isArray(window.OhioBeerPath._analyticsQueue)) {
    const queue = window.OhioBeerPath._analyticsQueue;
    window.OhioBeerPath._analyticsQueue = [];
    
    queue.forEach(item => {
        const method = item[0];
        const args = item.slice(1);
        
        if (typeof OhioBeerPath.analytics[method] === 'function') {
            OhioBeerPath.analytics[method](...args);
        }
    });
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with default settings
    OhioBeerPath.analytics.init({
        debug: window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1'
    });
});
