import json
import os

# Define standard Ohio regions by county
# Based on Ohio geographic conventions: https://ohiodnr.gov/discover-and-learn/safety-conservation/about-ODNR/regions
ohio_regions = {
    # Northeast Ohio Counties
    "northeast": [
        "Ashland", "Ashtabula", "Carroll", "Columbiana", "Cuyahoga", 
        "Geauga", "Holmes", "Lake", "Lorain", "Mahoning", "Medina", 
        "Portage", "Stark", "Summit", "Trumbull", "Tuscarawas", "Wayne"
    ],
    
    # Northwest Ohio Counties
    "northwest": [
        "Allen", "Auglaize", "Crawford", "Defiance", "Erie", "Fulton", 
        "Hancock", "Hardin", "Henry", "Huron", "Lucas", "Mercer", 
        "Ottawa", "Paulding", "Putnam", "Richland", "Sandusky", "Seneca", 
        "Van Wert", "Williams", "Wood", "Wyandot"
    ],
    
    # Central Ohio Counties
    "central": [
        "Delaware", "Fairfield", "Franklin", "Knox", "Licking", 
        "Madison", "Marion", "Morrow", "Pickaway", "Union"
    ],
    
    # Southwest Ohio Counties
    "southwest": [
        "Adams", "Brown", "Butler", "Champaign", "Clark", "Clermont", 
        "Clinton", "Darke", "Fayette", "Greene", "Hamilton", "Highland", 
        "Logan", "Miami", "Montgomery", "Preble", "Shelby", "Warren"
    ],
    
    # Southeast Ohio Counties
    "southeast": [
        "Athens", "Belmont", "Coshocton", "Gallia", "Guernsey", "Harrison", 
        "Hocking", "Jackson", "Jefferson", "Lawrence", "Meigs", "Monroe", 
        "Morgan", "Muskingum", "Noble", "Perry", "Pike", "Ross", "Scioto", 
        "Vinton", "Washington"
    ]
}

# Ohio city to county mapping
# This maps cities to their counties for accurate region assignment
ohio_cities_to_counties = {
    # Northeast Ohio cities
    "Akron": "Summit",
    "Amherst": "Lorain",
    "Ashland": "Ashland",
    "Avon": "Lorain",
    "Avon Lake": "Lorain",
    "Barberton": "Summit",
    "Berea": "Cuyahoga",
    "Bolivar": "Tuscarawas",
    "Broadview Heights": "Cuyahoga",
    "Canton": "Stark",
    "Carey": "Wyandot",
    "Cleveland": "Cuyahoga",
    "Cleveland Heights": "Cuyahoga",
    "Columbia Station": "Lorain",
    "Cuyahoga Falls": "Summit",
    "Dennison": "Tuscarawas",
    "Dover": "Tuscarawas",
    "Euclid": "Cuyahoga",
    "Fresno": "Coshocton",
    "Hartville": "Stark",
    "Hinckley": "Medina",
    "Hudson": "Summit",
    "Lakewood": "Cuyahoga",
    "Massillon": "Stark",
    "Medina": "Medina",
    "Middleburg Heights": "Cuyahoga",
    "Millersburg": "Holmes",
    "Navarre": "Stark",
    "North Canton": "Stark",
    "North Olmsted": "Cuyahoga",
    "North Ridgeville": "Lorain",
    "North Royalton": "Cuyahoga",
    "Oberlin": "Lorain",
    "Orange Village": "Cuyahoga",
    "Parma": "Cuyahoga",
    "Rocky River": "Cuyahoga",
    "Shaker Heights": "Cuyahoga",
    "Wadsworth": "Medina",
    "Wakeman": "Huron",
    "Westlake": "Cuyahoga",
    "Wooster": "Wayne",
    
    # Northwest Ohio cities
    "Bucyrus": "Crawford",
    "Defiance": "Defiance",
    "Findlay": "Hancock",
    "Fostoria": "Seneca",
    "Fremont": "Sandusky",
    "Lima": "Allen",
    "Lorain": "Lorain",
    "Mansfield": "Richland",
    "Norwalk": "Huron",
    "Port Clinton": "Ottawa",
    "Sandusky": "Erie",
    "Shelby": "Richland",
    "Tiffin": "Seneca",
    "Toledo": "Lucas",
    "Upper Sandusky": "Wyandot",
    
    # Central Ohio cities
    "Columbus": "Franklin",
    "Delaware": "Delaware",
    "Dublin": "Franklin",
    "Granville": "Licking",
    "Heath": "Licking",
    "Lancaster": "Fairfield",
    "Marion": "Marion",
    "Marengo": "Morrow",
    "Marysville": "Union",
    "Newark": "Licking",
    "Powell": "Delaware",
    "Richwood": "Union",
    "Westerville": "Franklin",
    "Worthington": "Franklin",
    
    # Southwest Ohio cities
    "Beavercreek": "Greene",
    "Bellbrook": "Greene",
    "Bellefontaine": "Logan",
    "Blue Ash": "Hamilton",
    "Centerville": "Montgomery",
    "Chillicothe": "Ross",
    "Cincinnati": "Hamilton",
    "Dayton": "Montgomery",
    "Eaton": "Preble",
    "Englewood": "Montgomery",
    "Enon": "Clark",
    "Fairfield": "Butler",
    "Hamilton": "Butler",
    "Harrison": "Hamilton",
    "Huber Heights": "Montgomery",
    "Huntsville": "Logan",
    "Kettering": "Montgomery",
    "Lebanon": "Warren",
    "Loveland": "Hamilton",
    "Maineville": "Warren",
    "Mason": "Warren",
    "Medway": "Clark",
    "Miamisburg": "Montgomery",
    "Middletown": "Butler",
    "Milford": "Clermont",
    "Montgomery": "Hamilton",
    "Morrow": "Warren",
    "Mount Orab": "Brown",
    "Oxford": "Butler",
    "Piqua": "Miami",
    "Russells Point": "Logan",
    "Sharonville": "Hamilton",
    "Springfield": "Clark",
    "Springboro": "Warren",
    "St. Bernard": "Hamilton",
    "Urbana": "Champaign",
    "Vandalia": "Montgomery",
    "West Chester": "Butler",
    "Williamsburg": "Clermont",
    "Wyoming": "Hamilton",
    "Xenia": "Greene",
    "Yellow Springs": "Greene",
    
    # Southeast Ohio cities
    "Athens": "Athens",
    "Cambridge": "Guernsey",
    "Frankfort": "Ross",
    "Jackson": "Jackson",
    "Lancaster": "Fairfield",
    "Marietta": "Washington",
    "Nelsonville": "Athens",
    "Portsmouth": "Scioto",
    "Zanesville": "Muskingum"
}

# Function to determine region based on city
def get_region_by_city(city):
    if not city or city == "N/A":
        return None
    
    # Get county for this city
    county = ohio_cities_to_counties.get(city)
    if not county:
        return None
    
    # Get region for this county
    for region, counties in ohio_regions.items():
        if county in counties:
            return region
            
    return None

# Path to the JSON file relative to the script location
script_dir = os.path.dirname(__file__)
json_file_path = os.path.join(script_dir, 'assets/data/breweries.json')

def update_brewery_regions():
    """Load brewery data, update regions based on city/county mapping, and save changes."""
    try:
        # Read the existing data
        with open(json_file_path, 'r', encoding='utf-8') as f:
            breweries = json.load(f)
        print(f"Read {len(breweries)} breweries from {json_file_path}")

        # Display regions before changes
        region_counts_before = {}
        for brewery in breweries:
            if 'region' in brewery and brewery['region']:
                region = brewery['region'].lower()
                region_counts_before[region] = region_counts_before.get(region, 0) + 1
        
        print("\nREGIONS BEFORE UPDATE:")
        for region, count in sorted(region_counts_before.items()):
            print(f"  {region}: {count} breweries")

    except FileNotFoundError:
        print(f"Error: File not found at '{json_file_path}'")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from '{json_file_path}'. Error: {e}")
        return
    except Exception as e:
        print(f"An unexpected error occurred during reading: {e}")
        return

    updated_count = 0
    corrections = {}
    not_found = {}
    
    # Process each brewery
    for brewery in breweries:
        city = brewery.get('city')
        old_region = brewery.get('region')
        
        # Only process entries with cities
        if city and city != "N/A":
            # Get the region based on city-county mapping
            new_region = get_region_by_city(city)
            
            if new_region:
                # If region is different, update it
                if new_region != old_region:
                    # Track what was changed
                    key = f"{city}: {old_region or 'None'} -> {new_region}"
                    corrections[key] = corrections.get(key, 0) + 1
                    
                    # Update the brewery record
                    brewery['region'] = new_region
                    updated_count += 1
            else:
                # If we couldn't map this city, track it
                not_found[city] = not_found.get(city, 0) + 1
    
    # Write the updated data back
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(breweries, f, indent=2) # Use indent=2 for readability
        
        # Display summary of changes
        print(f"\nSuccessfully updated regions in '{os.path.basename(json_file_path)}'.")
        print(f"Total breweries processed: {len(breweries)}")
        print(f"Breweries with updated regions: {updated_count}")
        
        # Display detailed update information
        if updated_count > 0:
            print("\nREGION CORRECTIONS:")
            for correction, count in sorted(corrections.items()):
                print(f"  {correction}: {count} breweries")
        
        # Display cities we couldn't map
        if not_found:
            print("\nCITIES WITHOUT COUNTY/REGION MAPPING:")
            for city, count in sorted(not_found.items(), key=lambda x: x[1], reverse=True):
                print(f"  {city}: {count} breweries")
        
        # Display final region counts
        region_counts_after = {}
        for brewery in breweries:
            if 'region' in brewery and brewery['region']:
                region = brewery['region'].lower()
                region_counts_after[region] = region_counts_after.get(region, 0) + 1
        
        print("\nREGIONS AFTER UPDATE:")
        for region, count in sorted(region_counts_after.items()):
            print(f"  {region}: {count} breweries")
            
    except Exception as e:
        print(f"An unexpected error occurred during writing: {e}")

if __name__ == "__main__":
    update_brewery_regions()
