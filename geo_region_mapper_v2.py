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
    "Alliance": "Stark",
    "Amherst": "Lorain",
    "Ashland": "Ashland",
    "Auburn Twp.": "Geauga",
    "Austintown": "Mahoning",
    "Avon": "Lorain",
    "Avon Lake": "Lorain",
    "Barberton": "Summit",
    "Berea": "Cuyahoga",
    "Bolivar": "Tuscarawas",
    "Broadview Heights": "Cuyahoga",
    "Canton": "Stark",
    "Carroll": "Fairfield",
    "Chardon": "Geauga",
    "Chagrin Falls": "Cuyahoga",
    "Cleveland": "Cuyahoga",
    "Cleveland Heights": "Cuyahoga",
    "Columbiana": "Columbiana",
    "Columbia Station": "Lorain",
    "Cuyahoga Falls": "Summit",
    "Dennison": "Tuscarawas",
    "Dover": "Tuscarawas",
    "Euclid": "Cuyahoga",
    "Geneva": "Ashtabula",
    "Hartville": "Stark",
    "Hinckley": "Medina",
    "Hudson": "Summit",
    "Kent": "Portage",
    "Lake Milton": "Mahoning",
    "Lakewood": "Cuyahoga",
    "Madison": "Lake",
    "Mantua": "Portage",
    "Massillon": "Stark",
    "Medina": "Medina",
    "Mentor": "Lake",
    "Middleburg Heights": "Cuyahoga",
    "Millersburg": "Holmes",
    "Minerva": "Stark",
    "Navarre": "Stark",
    "North Canton": "Stark",
    "North Olmsted": "Cuyahoga",
    "North Ridgeville": "Lorain",
    "North Royalton": "Cuyahoga",
    "Oberlin": "Lorain",
    "Orange Village": "Cuyahoga",
    "Parma": "Cuyahoga",
    "Rocky River": "Cuyahoga",
    "Rootstown": "Portage",
    "Shaker Heights": "Cuyahoga",
    "Toronto": "Jefferson",
    "Wadsworth": "Medina",
    "Warren": "Trumbull",
    "Westlake": "Cuyahoga",
    "Willoughby": "Lake",
    "Wooster": "Wayne",
    "Youngstown": "Mahoning",
    
    # Northwest Ohio cities
    "Ada": "Hardin",
    "Bowling Green": "Wood",
    "Bucyrus": "Crawford",
    "Carey": "Wyandot",
    "Celina": "Mercer",
    "Coldwater": "Mercer",
    "Defiance": "Defiance",
    "Findlay": "Hancock",
    "Fostoria": "Seneca",
    "Fremont": "Sandusky",
    "Grand Rapids": "Wood",
    "Hicksville": "Defiance",
    "Holland": "Lucas",
    "Lima": "Allen",
    "Lorain": "Lorain",
    "Mansfield": "Richland",
    "Maria Stein": "Mercer",
    "Montpelier": "Williams",
    "New Bremen": "Auglaize",
    "Norwalk": "Huron",
    "Oregon": "Lucas",
    "Ottawa": "Putnam",
    "Perrysburg": "Wood",
    "Port Clinton": "Ottawa",
    "Ridgeway": "Hardin",
    "Sandusky": "Erie",
    "Shelby": "Richland",
    "Swanton": "Fulton",
    "Sylvania": "Lucas",
    "Tiffin": "Seneca",
    "Toledo": "Lucas",
    "Upper Sandusky": "Wyandot",
    "Van Wert": "Van Wert",
    "Wakeman": "Huron",
    "Waterville": "Lucas",
    
    # Central Ohio cities
    "Buckeye Lake": "Licking",
    "Canal Winchester": "Franklin",
    "Columbus": "Franklin",
    "Delaware": "Delaware",
    "Dublin": "Franklin",
    "Gahanna": "Franklin",
    "Granville": "Licking",
    "Grove City": "Franklin",
    "Heath": "Licking",
    "Lancaster": "Fairfield",
    "Lewis Center": "Delaware",
    "Marion": "Marion",
    "Marengo": "Morrow",
    "Marysville": "Union",
    "New Albany": "Franklin",
    "Newark": "Licking",
    "Pickerington": "Fairfield",
    "Powell": "Delaware",
    "Reynoldsburg": "Franklin",
    "Richwood": "Union",
    "Shawnee Hills": "Delaware",
    "Westerville": "Franklin",
    "Whitehall": "Franklin",
    "Worthington": "Franklin",
    
    # Southwest Ohio cities
    "Beavercreek": "Greene",
    "Bellbrook": "Greene",
    "Bellefontaine": "Logan",
    "Blue Ash": "Hamilton",
    "Centerville": "Montgomery",
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
    "Logan": "Hocking",  # This actually belongs to Southeast
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
    "Albany": "Athens",
    "Athens": "Athens",
    "Caldwell": "Noble",
    "Cambridge": "Guernsey",
    "Chauncey": "Athens",
    "Chillicothe": "Ross",
    "Frankfort": "Ross",
    "Fresno": "Coshocton",
    "Jackson": "Jackson",
    "Logan": "Hocking",
    "Marietta": "Washington",
    "Minford": "Scioto",
    "Nelsonville": "Athens",
    "Portsmouth": "Scioto",
    "Zanesville": "Muskingum"
}

# Special case region overrides - for any cities that need to be assigned to a different region
# than what their county would suggest (e.g. edge cases, border cities)
region_overrides = {
    "Logan": "southeast"  # Despite being in Hocking County which is southwest, Logan is generally grouped with Southeast Ohio
}

# Function to determine region based on city
def get_region_by_city(city):
    if not city or city == "N/A":
        return None
    
    # Check region overrides first
    if city in region_overrides:
        return region_overrides[city]
    
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
