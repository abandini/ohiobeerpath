// Script to check for East Central Ohio breweries
console.log("Checking for East Central breweries...");

async function checkEastCentralBreweries() {
    try {
        // Try to load breweries from root path
        const response = await fetch('breweries.json');
        if (!response.ok) {
            throw new Error("Could not load breweries from root path");
        }
        
        const breweries = await response.json();
        console.log(`Loaded ${breweries.length} total breweries`);
        
        // Check for east central breweries
        const eastCentralBreweries = breweries.filter(b => 
            b.region && b.region.toLowerCase() === 'eastcentral'
        );
        
        console.log(`Found ${eastCentralBreweries.length} East Central breweries`);
        
        if (eastCentralBreweries.length > 0) {
            console.log("East Central Breweries:");
            eastCentralBreweries.forEach(b => {
                console.log(`- ${b.name} (${b.city}, OH)`);
            });
        } else {
            console.log("No East Central breweries found in the data");
            
            // Look for breweries in cities that should be in East Central
            const eastCentralCities = ['New Philadelphia', 'Dover', 'Cambridge', 'Zanesville', 'Coshocton', 'Millersburg'];
            
            const potentialEastCentralBreweries = breweries.filter(b => 
                b.city && eastCentralCities.some(city => b.city.includes(city))
            );
            
            console.log(`Found ${potentialEastCentralBreweries.length} breweries in East Central cities`);
            if (potentialEastCentralBreweries.length > 0) {
                console.log("Potential East Central Breweries:");
                potentialEastCentralBreweries.forEach(b => {
                    console.log(`- ${b.name} (${b.city}, OH) - Currently in region: ${b.region || 'none'}`);
                });
            }
        }
        
        // Count breweries by region
        const regionCounts = {};
        breweries.forEach(b => {
            if (b.region) {
                const region = b.region.toLowerCase();
                regionCounts[region] = (regionCounts[region] || 0) + 1;
            } else {
                regionCounts['unassigned'] = (regionCounts['unassigned'] || 0) + 1;
            }
        });
        
        console.log("Brewery counts by region:", regionCounts);
        
    } catch (error) {
        console.error('Error checking East Central breweries:', error);
    }
}

checkEastCentralBreweries();
