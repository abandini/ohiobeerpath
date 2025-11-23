// This is a direct debugging script to check what's happening with brewery regions
console.log("Starting direct region debug script");

// Try to load brewery data from all possible locations
async function debugBreweryData() {
    let breweries = [];
    
    try {
        // Root path
        console.log("Attempting to load breweries.json from root path");
        const response = await fetch('breweries.json');
        if (response.ok) {
            breweries = await response.json();
            console.log(`Successfully loaded ${breweries.length} breweries from root path`);
            console.log("First brewery:", breweries[0]);
        }
    } catch (e) {
        console.error("Error loading breweries from root:", e);
    }
    
    if (breweries.length === 0) {
        try {
            console.log("Attempting to load breweries.json from assets/data path");
            const response = await fetch('assets/data/breweries.json');
            if (response.ok) {
                breweries = await response.json();
                console.log(`Successfully loaded ${breweries.length} breweries from assets/data path`);
                console.log("First brewery:", breweries[0]);
            }
        } catch (e) {
            console.error("Error loading breweries from assets/data:", e);
        }
    }
    
    if (breweries.length > 0) {
        // Count breweries by region
        const regionCounts = {};
        
        breweries.forEach(brewery => {
            const region = brewery.region?.toLowerCase() || "unknown";
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });
        
        console.log("Breweries by region:", regionCounts);
        
        // Check specifically for northwest breweries
        const northwestBreweries = breweries.filter(b => b.region?.toLowerCase() === "northwest");
        console.log(`Found ${northwestBreweries.length} Northwest breweries`);
        
        if (northwestBreweries.length > 0) {
            console.log("First 3 Northwest breweries:", northwestBreweries.slice(0, 3));
        }
    } else {
        console.error("CRITICAL: Could not load brewery data from any location");
    }
}

debugBreweryData();
