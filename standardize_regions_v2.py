import json
import os

# Define the comprehensive mapping based on Ohio geography
# All keys should be lowercase for case-insensitive matching
region_map = {
    # Standard regions - to lowercase
    "northeast": "northeast",
    "northwest": "northwest",
    "southeast": "southeast", 
    "southwest": "southwest",
    "central": "central",
    
    # Non-standard regions or regional labels
    "greater cincinnati": "southwest",
    "greater columbus": "central",
    "greater cleveland": "northeast",
    "north central": "northeast", 
    "west central": "southwest",  # Dayton is typically considered southwest Ohio
    "state line": "northwest",    # Most state line breweries are in NW Ohio
    
    # Handle breweries-in-planning with regional tags
    "breweries-in-planning, northeast": "northeast",
    "breweries-in-planning, northwest": "northwest",
    "breweries-in-planning, southeast": "southeast",
    "breweries-in-planning, southwest": "southwest",
    "breweries-in-planning, central": "central",
    "breweries-in-planning, greater cincinnati": "southwest",
    "breweries-in-planning, greater columbus": "central",
    "breweries-in-planning, greater cleveland": "northeast",
    "breweries-in-planning, west central": "southwest",
    "breweries-in-planning, state line": "northwest"
}

# Path to the JSON file relative to the script location
script_dir = os.path.dirname(__file__)
json_file_path = os.path.join(script_dir, 'assets/data/breweries.json')

def standardize_regions():
    """Loads brewery data, standardizes the region field, and saves it back."""
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
        
        print("\nREGIONS BEFORE STANDARDIZATION:")
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
    updated_regions = {}
    
    # Update the region field
    for brewery in breweries:
        original_region = brewery.get('region')
        if isinstance(original_region, str) and original_region.strip():
            original_region_lower = original_region.strip().lower()
            # Map to standard region using our comprehensive mapping
            standard_region = region_map.get(original_region_lower)
            
            if standard_region:
                # Only update if the standardized value is different from the original
                if brewery['region'] != standard_region:
                    # Track what regions were updated
                    key = f"{original_region} -> {standard_region}"
                    updated_regions[key] = updated_regions.get(key, 0) + 1
                    
                    # Update the brewery record
                    brewery['region'] = standard_region
                    updated_count += 1
            else:
                print(f"Warning: No mapping found for region '{original_region}' in brewery '{brewery.get('name')}'")
        elif not original_region:
            # Handle missing or empty regions
            print(f"Warning: Brewery '{brewery.get('name', 'N/A')}' has missing or empty region.")

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
            print("\nREGION UPDATES:")
            for mapping, count in sorted(updated_regions.items()):
                print(f"  {mapping}: {count} breweries")
        
        # Display final region counts
        region_counts_after = {}
        for brewery in breweries:
            if 'region' in brewery and brewery['region']:
                region = brewery['region'].lower()
                region_counts_after[region] = region_counts_after.get(region, 0) + 1
        
        print("\nREGIONS AFTER STANDARDIZATION:")
        for region, count in sorted(region_counts_after.items()):
            print(f"  {region}: {count} breweries")
            
    except Exception as e:
        print(f"An unexpected error occurred during writing: {e}")

if __name__ == "__main__":
    standardize_regions()
