/**
 * Ohio Beer Path - Search Functionality
 * 
 * This file contains the search functionality with autocomplete
 */

// Search component class
class BrewerySearch {
    constructor(elementId, options = {}) {
        // Default options
        this.options = {
            minChars: 2,
            maxResults: 10,
            searchDelay: 300,
            apiEndpoint: '/api/search.php',
            searchType: 'all',
            ...options
        };
        
        // Elements
        this.componentId = elementId;
        this.component = document.getElementById(`${elementId}Form`).closest('.search-component');
        this.form = document.getElementById(`${elementId}Form`);
        this.input = document.getElementById(`${elementId}Input`);
        this.button = document.getElementById(`${elementId}Button`);
        this.resultsContainer = document.getElementById(`${elementId}Results`);
        
        // Optional filter elements
        this.regionFilter = document.getElementById(`${elementId}Region`);
        this.typeFilter = document.getElementById(`${elementId}Type`);
        this.sortFilter = document.getElementById(`${elementId}Sort`);
        this.filtersToggle = this.form.querySelector('[data-bs-toggle="collapse"]');
        
        // State
        this.searchTimeout = null;
        this.currentQuery = '';
        this.selectedIndex = -1;
        this.results = [];
        this.recentSearches = this.loadRecentSearches();
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the search component
     */
    init() {
        // Input event listeners
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
        
        // Form submit
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Filter change events
        if (this.regionFilter) {
            this.regionFilter.addEventListener('change', this.handleFilterChange.bind(this));
        }
        if (this.typeFilter) {
            this.typeFilter.addEventListener('change', this.handleFilterChange.bind(this));
        }
        if (this.sortFilter) {
            this.sortFilter.addEventListener('change', this.handleFilterChange.bind(this));
        }
        
        // Toggle filters text
        if (this.filtersToggle) {
            this.filtersToggle.addEventListener('click', this.handleFiltersToggle.bind(this));
        }
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.component.contains(e.target)) {
                this.hideResults();
            }
        });
        
        // Add sticky behavior on scroll for mobile
        this.addStickyBehavior();
        
        // Initialize voice search if supported
        this.initVoiceSearch();
    }
    
    /**
     * Handle input changes
     */
    handleInput() {
        const query = this.input.value.trim();
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Hide results if query is too short
        if (query.length < this.options.minChars) {
            this.hideResults();
            return;
        }
        
        // Set timeout for search
        this.searchTimeout = setTimeout(() => {
            this.search(query);
        }, this.options.searchDelay);
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeydown(e) {
        // If results are not visible, do nothing
        if (this.resultsContainer.classList.contains('d-none')) {
            return;
        }
        
        const resultItems = this.resultsContainer.querySelectorAll('.autocomplete-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, resultItems.length - 1);
                this.highlightResult();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.highlightResult();
                break;
                
            case 'Enter':
                if (this.selectedIndex >= 0 && this.selectedIndex < resultItems.length) {
                    e.preventDefault();
                    this.selectResult(this.selectedIndex);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideResults();
                break;
        }
    }
    
    /**
     * Handle input focus
     */
    handleFocus() {
        const query = this.input.value.trim();
        
        if (query.length >= this.options.minChars) {
            this.search(query);
        } else if (this.recentSearches.length > 0) {
            this.showRecentSearches();
        }
    }
    
    /**
     * Handle input blur
     */
    handleBlur(e) {
        // Don't hide if clicking on results
        if (e.relatedTarget && this.resultsContainer.contains(e.relatedTarget)) {
            return;
        }
        
        // Delay hiding to allow for clicks
        setTimeout(() => {
            if (!this.resultsContainer.contains(document.activeElement)) {
                this.hideResults();
            }
        }, 200);
    }
    
    /**
     * Handle form submission
     */
    handleSubmit(e) {
        e.preventDefault();
        
        const query = this.input.value.trim();
        if (query.length < this.options.minChars) {
            return;
        }
        
        // Add to recent searches
        this.addRecentSearch(query);
        
        // Redirect to search results page
        const params = new URLSearchParams();
        params.append('q', query);
        
        if (this.regionFilter && this.regionFilter.value) {
            params.append('region', this.regionFilter.value);
        }
        
        if (this.typeFilter && this.typeFilter.value) {
            params.append('type', this.typeFilter.value);
        }
        
        if (this.sortFilter && this.sortFilter.value) {
            params.append('sort', this.sortFilter.value);
        }
        
        window.location.href = `breweries.php?${params.toString()}`;
    }
    
    /**
     * Handle filter changes
     */
    handleFilterChange() {
        const query = this.input.value.trim();
        
        if (query.length >= this.options.minChars) {
            this.search(query);
        }
    }
    
    /**
     * Handle filters toggle
     */
    handleFiltersToggle() {
        const toggleText = this.filtersToggle.querySelector('.filter-toggle-text');
        if (!toggleText) return;
        
        const isCollapsed = this.filtersToggle.getAttribute('aria-expanded') === 'false';
        toggleText.textContent = isCollapsed ? 'Hide Filters' : 'Show Filters';
    }
    
    /**
     * Perform search
     */
    async search(query) {
        if (query === this.currentQuery) {
            return;
        }
        
        this.currentQuery = query;
        this.selectedIndex = -1;
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('q', query);
            params.append('type', this.options.searchType);
            params.append('limit', this.options.maxResults);
            
            if (this.regionFilter && this.regionFilter.value) {
                params.append('region', this.regionFilter.value);
            }
            
            if (this.typeFilter && this.typeFilter.value) {
                params.append('type', this.typeFilter.value);
            }
            
            // Fetch results
            const response = await fetch(`${this.options.apiEndpoint}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`Search request failed: ${response.status}`);
            }
            
            const data = await response.json();
            this.results = data.results || [];
            
            // Display results
            this.displayResults();
        } catch (error) {
            console.error('Search error:', error);
            this.showError('An error occurred while searching. Please try again.');
        }
    }
    
    /**
     * Display search results
     */
    displayResults() {
        // Clear previous results
        this.resultsContainer.innerHTML = '';
        
        // Show results container
        this.resultsContainer.classList.remove('d-none');
        
        // No results
        if (this.results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="autocomplete-no-results">
                    <p>No results found for "${this.currentQuery}"</p>
                    <p class="small text-muted">Try a different search term or browse all breweries</p>
                </div>
            `;
            return;
        }
        
        // Create result items
        this.results.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.setAttribute('role', 'option');
            item.setAttribute('tabindex', '0');
            item.setAttribute('data-index', index);
            
            // Highlight matching text
            const highlightedName = this.highlightMatch(result.name, this.currentQuery);
            const highlightedCity = this.highlightMatch(result.city, this.currentQuery);
            
            item.innerHTML = `
                <div class="autocomplete-item-content">
                    <div class="autocomplete-item-left">
                        <div class="fw-bold">${highlightedName}</div>
                        <div class="small">${highlightedCity}, OH</div>
                    </div>
                    <div class="autocomplete-item-right">
                        ${result.region ? `<span class="badge bg-light text-dark">${result.region}</span>` : ''}
                    </div>
                </div>
            `;
            
            // Add event listeners
            item.addEventListener('click', () => this.selectResult(index));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectResult(index);
                }
            });
            
            this.resultsContainer.appendChild(item);
        });
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="autocomplete-no-results text-danger">
                <p><i class="bi bi-exclamation-triangle-fill me-2"></i>${message}</p>
            </div>
        `;
        this.resultsContainer.classList.remove('d-none');
    }
    
    /**
     * Show recent searches
     */
    showRecentSearches() {
        if (this.recentSearches.length === 0) {
            return;
        }
        
        this.resultsContainer.innerHTML = `
            <div class="p-3">
                <div class="recent-searches">
                    <div class="recent-searches-title">Recent Searches</div>
                    <div class="recent-search-tags">
                        ${this.recentSearches.slice(0, 5).map(search => `
                            <div class="recent-search-tag" data-query="${search}">
                                <i class="bi bi-clock-history"></i> ${search}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="search-suggestions mt-3">
                    <div class="search-suggestions-title">Popular Searches</div>
                    <div class="search-suggestion">Columbus Breweries</div>
                    <div class="search-suggestion">Craft Beer Cleveland</div>
                    <div class="search-suggestion">Cincinnati Brewpubs</div>
                    <div class="search-suggestion">Ohio IPA</div>
                </div>
            </div>
        `;
        
        this.resultsContainer.classList.remove('d-none');
        
        // Add event listeners to recent search tags
        const tags = this.resultsContainer.querySelectorAll('.recent-search-tag');
        tags.forEach(tag => {
            tag.addEventListener('click', () => {
                const query = tag.getAttribute('data-query');
                this.input.value = query;
                this.search(query);
            });
        });
        
        // Add event listeners to search suggestions
        const suggestions = this.resultsContainer.querySelectorAll('.search-suggestion');
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const query = suggestion.textContent;
                this.input.value = query;
                this.search(query);
            });
        });
    }
    
    /**
     * Hide results
     */
    hideResults() {
        this.resultsContainer.classList.add('d-none');
        this.selectedIndex = -1;
    }
    
    /**
     * Highlight selected result
     */
    highlightResult() {
        const items = this.resultsContainer.querySelectorAll('.autocomplete-item');
        
        // Remove highlight from all items
        items.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add highlight to selected item
        if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
            items[this.selectedIndex].classList.add('active');
            items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    /**
     * Select a result
     */
    selectResult(index) {
        const result = this.results[index];
        if (!result) return;
        
        // Add to recent searches
        this.addRecentSearch(result.name);
        
        // Navigate to brewery page
        window.location.href = `breweries.php?id=${result.id}`;
    }
    
    /**
     * Highlight matching text
     */
    highlightMatch(text, query) {
        if (!text) return '';
        
        const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="autocomplete-highlight">$1</span>');
    }
    
    /**
     * Add to recent searches
     */
    addRecentSearch(query) {
        // Don't add empty queries
        if (!query) return;
        
        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(search => search.toLowerCase() !== query.toLowerCase());
        
        // Add to beginning
        this.recentSearches.unshift(query);
        
        // Limit to 10 recent searches
        if (this.recentSearches.length > 10) {
            this.recentSearches.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    }
    
    /**
     * Load recent searches from localStorage
     */
    loadRecentSearches() {
        try {
            const saved = localStorage.getItem('recentSearches');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading recent searches:', error);
            return [];
        }
    }
    
    /**
     * Add sticky behavior on scroll for mobile
     */
    addStickyBehavior() {
        if (window.innerWidth > 991) return;
        
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        const navbarHeight = navbar.offsetHeight;
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > heroSection.offsetHeight - navbarHeight) {
                this.component.classList.add('sticky');
            } else {
                this.component.classList.remove('sticky');
            }
        });
    }
    
    /**
     * Initialize voice search if supported
     */
    initVoiceSearch() {
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return;
        }
        
        // Create voice search button
        const voiceButton = document.createElement('button');
        voiceButton.type = 'button';
        voiceButton.className = 'voice-search-btn';
        voiceButton.innerHTML = '<i class="bi bi-mic"></i>';
        voiceButton.setAttribute('aria-label', 'Search by voice');
        
        // Add button to search input group
        const inputGroup = this.input.parentNode;
        inputGroup.insertBefore(voiceButton, this.button);
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Handle recognition results
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.input.value = transcript;
            this.search(transcript);
            voiceButton.classList.remove('listening');
        };
        
        // Handle errors
        recognition.onerror = () => {
            voiceButton.classList.remove('listening');
        };
        
        // Handle end
        recognition.onend = () => {
            voiceButton.classList.remove('listening');
        };
        
        // Start recognition on button click
        voiceButton.addEventListener('click', () => {
            if (voiceButton.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
                voiceButton.classList.add('listening');
            }
        });
    }
}

// Initialize search components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize hero search
    const heroSearch = document.getElementById('heroSearchForm');
    if (heroSearch) {
        new BrewerySearch('heroSearch', {
            maxResults: 5,
            searchType: 'all'
        });
    }
    
    // Initialize main search if exists
    const mainSearch = document.getElementById('mainSearchForm');
    if (mainSearch) {
        new BrewerySearch('mainSearch', {
            maxResults: 10,
            searchType: 'all'
        });
    }
    
    // Initialize mobile search button
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            const heroSearch = document.getElementById('heroSearchInput');
            if (heroSearch) {
                heroSearch.focus();
                // Scroll to search
                const searchComponent = heroSearch.closest('.search-component');
                if (searchComponent) {
                    window.scrollTo({
                        top: searchComponent.offsetTop - 60,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }
    
    // Initialize create tour button
    const createTourBtn = document.getElementById('createTourBtn');
    if (createTourBtn) {
        createTourBtn.addEventListener('click', () => {
            window.location.href = 'itinerary.php';
        });
    }
});

// Initialize drag and drop for itinerary
document.addEventListener('DOMContentLoaded', () => {
    const itineraryList = document.getElementById('itineraryList');
    if (!itineraryList) return;
    
    // Check if Sortable is available
    if (typeof Sortable !== 'undefined') {
        new Sortable(itineraryList, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: function() {
                // Update itinerary order in storage
                const items = itineraryList.querySelectorAll('[data-brewery-id]');
                const newOrder = Array.from(items).map(item => item.getAttribute('data-brewery-id'));
                
                // Dispatch custom event for order change
                document.dispatchEvent(new CustomEvent('itineraryReordered', {
                    detail: { order: newOrder }
                }));
            }
        });
    }
});
