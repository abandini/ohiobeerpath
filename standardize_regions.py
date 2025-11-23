import json
import os

# Define the mapping (case-insensitive keys handled by lowercasing input)
region_map = {
    "northeast": "northeast",
    "northwest": "northwest",
    "southeast": "southeast",
    "southwest": "southwest",
    "central": "central",
    "greater cincinnati": "southwest",
    "greater columbus": "central"
    # Add any other observed mappings if needed
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
    # Update the region field
    for brewery in breweries:
        original_region = brewery.get('region')
        if isinstance(original_region, str) and original_region.strip():
            original_region_lower = original_region.strip().lower()
            # Map to lowercase standard region
            standard_region = region_map.get(original_region_lower, original_region_lower)
            
            # Only update if the standardized value is different from the original
            if brewery['region'] != standard_region:
                 brewery['region'] = standard_region
                 updated_count += 1
        elif not original_region:
             # Optionally handle missing or empty regions, e.g., assign a default or log
             # print(f"Warning: Brewery '{brewery.get('name', 'N/A')}' has missing or empty region.")
             pass # Keep original value (None or empty string)

    # Write the updated data back
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(breweries, f, indent=2) # Use indent=2 for readability
        print(f"Successfully updated regions in '{os.path.basename(json_file_path)}'.")
        print(f"Total breweries processed: {len(breweries)}")
        print(f"Breweries with updated regions: {updated_count}")
    except Exception as e:
        print(f"An unexpected error occurred during writing: {e}")

if __name__ == "__main__":
    standardize_regions()

