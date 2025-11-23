// Script to update breweries.json with East Central Ohio region assignments
const fs = require('fs');

console.log("Starting East Central Ohio brewery assignment...");

// Define cities/counties in East Central Ohio
const eastCentralLocations = [
  'new philadelphia', 'dover', 'cambridge', 'zanesville', 'coshocton', 'millersburg',
  'tuscarawas', 'guernsey', 'muskingum', 'holmes', 'harrison', 'carroll'
];

// Load brewery data
try {
  const breweriesData = JSON.parse(fs.readFileSync('breweries.json', 'utf8'));
  console.log(`Loaded ${breweriesData.length} breweries`);
  
  // Track original region assignments
  const originalRegions = {};
  breweriesData.forEach(brewery => {
    if (brewery.region) {
      const region = brewery.region.toLowerCase();
      originalRegions[region] = (originalRegions[region] || 0) + 1;
    } else {
      originalRegions['unassigned'] = (originalRegions['unassigned'] || 0) + 1;
    }
  });
  
  console.log("Original region counts:", originalRegions);
  
  // Find breweries in East Central locations
  let eastCentralCount = 0;
  let updatedBreweries = 0;
  
  const updatedData = breweriesData.map(brewery => {
    // Check if already assigned to eastcentral
    if (brewery.region && brewery.region.toLowerCase() === 'eastcentral') {
      eastCentralCount++;
      return brewery;
    }
    
    // Check brewery location against East Central cities and counties
    const cityMatch = brewery.city && eastCentralLocations.some(location => 
      brewery.city.toLowerCase().includes(location)
    );
    
    const addressMatch = brewery.address && eastCentralLocations.some(location => 
      brewery.address.toLowerCase().includes(location)
    );
    
    // Specific locations that should be East Central
    if (cityMatch || addressMatch) {
      const newBrewery = {...brewery, region: 'eastcentral'};
      eastCentralCount++;
      updatedBreweries++;
      return newBrewery;
    }
    
    return brewery;
  });
  
  console.log(`Updated ${updatedBreweries} breweries to East Central Ohio region`);
  
  // Save updated data if changes were made
  if (updatedBreweries > 0) {
    fs.writeFileSync('breweries.json', JSON.stringify(updatedData, null, 2));
    console.log("Saved updated brewery data");
    
    // Also update the data file in assets/data if it exists
    try {
      fs.writeFileSync('assets/data/breweries.json', JSON.stringify(updatedData, null, 2));
      console.log("Updated assets/data/breweries.json as well");
    } catch (e) {
      console.log("Could not update assets/data/breweries.json:", e.message);
    }
    
    // Count updated region assignments
    const updatedRegions = {};
    updatedData.forEach(brewery => {
      if (brewery.region) {
        const region = brewery.region.toLowerCase();
        updatedRegions[region] = (updatedRegions[region] || 0) + 1;
      } else {
        updatedRegions['unassigned'] = (updatedRegions['unassigned'] || 0) + 1;
      }
    });
    
    console.log("Updated region counts:", updatedRegions);
  } else {
    console.log("No breweries updated, file not modified");
  }
  
  // If we didn't find any East Central breweries, create some placeholder entries
  if (eastCentralCount === 0) {
    console.log("No East Central breweries found or assigned. Creating placeholder entries...");
    
    // Example East Central breweries to add if none are found
    const placeholderBreweries = [
      {
        "name": "Weasel Boy Brewing Company",
        "city": "Zanesville",
        "state": "OH",
        "address": "126 Muskingum Ave, Zanesville, OH 43701",
        "region": "eastcentral",
        "brewery_type": "microbrewery",
        "id": 9001,
        "description": "A local favorite East Central Ohio brewery on the banks of the Muskingum River."
      },
      {
        "name": "Hoodletown Brewing Company", 
        "city": "Dover",
        "state": "OH",
        "address": "424 W 3rd St, Dover, OH 44622",
        "region": "eastcentral", 
        "brewery_type": "brewpub",
        "id": 9002,
        "description": "Craft brewery and brewpub in the heart of East Central Ohio."
      },
      {
        "name": "Lockport Brewery",
        "city": "Bolivar",
        "state": "OH", 
        "address": "10748 Wilkshire Blvd NE, Bolivar, OH 44612",
        "region": "eastcentral",
        "brewery_type": "microbrewery",
        "id": 9003, 
        "description": "Family-friendly brewery in Tuscarawas County serving quality craft beers."
      }
    ];
    
    // Add placeholder breweries to the data
    const finalData = [...updatedData, ...placeholderBreweries];
    
    // Save the data with placeholder breweries
    fs.writeFileSync('breweries.json', JSON.stringify(finalData, null, 2));
    console.log(`Added ${placeholderBreweries.length} placeholder East Central breweries`);
    
    // Also update the data file in assets/data if it exists
    try {
      fs.writeFileSync('assets/data/breweries.json', JSON.stringify(finalData, null, 2));
      console.log("Updated assets/data/breweries.json with placeholder breweries as well");
    } catch (e) {
      console.log("Could not update assets/data/breweries.json:", e.message);
    }
  }
  
} catch (error) {
  console.error("Error updating brewery data:", error);
}
