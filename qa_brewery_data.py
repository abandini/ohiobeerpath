import json
import os

# Path to breweries.json
BREWERIES_JSON = os.path.join(os.path.dirname(__file__), 'assets/data/breweries.json')


def is_valid_coordinate(val):
    try:
        f = float(val)
        return -90 <= f <= 90 or -180 <= f <= 180
    except (TypeError, ValueError):
        return False

def main():
    with open(BREWERIES_JSON, 'r', encoding='utf-8') as f:
        breweries = json.load(f)

    missing_coords = []
    invalid_coords = []
    missing_fields = []

    for brewery in breweries:
        name = brewery.get('name', 'Unknown')
        lat = brewery.get('latitude')
        lng = brewery.get('longitude')
        city = brewery.get('city')
        id_ = brewery.get('id', None)
        # Check for missing or invalid coordinates
        if lat is None or lng is None:
            missing_coords.append(name)
        elif not (is_valid_coordinate(lat) and is_valid_coordinate(lng)):
            invalid_coords.append(name)
        # Check for missing essential fields
        if not name or not city or id_ is None:
            missing_fields.append(name)

    print("\n--- QA Report for breweries.json ---")
    print(f"Total breweries: {len(breweries)}")
    print(f"Breweries missing coordinates: {len(missing_coords)}")
    if missing_coords:
        print('  -', '\n  - '.join(missing_coords))
    print(f"Breweries with invalid coordinates: {len(invalid_coords)}")
    if invalid_coords:
        print('  -', '\n  - '.join(invalid_coords))
    print(f"Breweries missing essential fields (name, city, id): {len(missing_fields)}")
    if missing_fields:
        print('  -', '\n  - '.join(missing_fields))
    print("\nQA complete. If all counts are zero, your data is ready!")

if __name__ == '__main__':
    main()
