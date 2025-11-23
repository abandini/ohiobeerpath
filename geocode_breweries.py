import json
import requests
import time
import os

# CONFIGURATION
BREWERIES_JSON = os.path.join(os.path.dirname(__file__), 'assets/data/breweries.json')
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')  # Set this in your environment
GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
RATE_LIMIT_DELAY = 0.2  # seconds between API calls to avoid hitting rate limits

# Updated to match the fields in breweries.json
# Uses 'address', 'city', 'state', 'zip' for geocoding

def get_address(brewery):
    parts = []
    for k in ['address', 'city', 'state', 'zip']:
        val = brewery.get(k)
        if val and val != 'N/A' and val != 'Unknown':
            parts.append(val)
    return ', '.join(parts)

def geocode_address(address):
    if not GOOGLE_MAPS_API_KEY:
        raise RuntimeError('GOOGLE_MAPS_API_KEY environment variable not set')
    params = {'address': address, 'key': GOOGLE_MAPS_API_KEY}
    response = requests.get(GEOCODE_URL, params=params)
    data = response.json()
    if data['status'] == 'OK' and data['results']:
        loc = data['results'][0]['geometry']['location']
        return loc['lat'], loc['lng']
    return None, None

def main():
    with open(BREWERIES_JSON, 'r', encoding='utf-8') as f:
        breweries = json.load(f)

    updated = False
    for brewery in breweries:
        lat = brewery.get('latitude')
        lng = brewery.get('longitude')
        if lat is not None and lng is not None:
            continue  # Already has coordinates
        address = get_address(brewery)
        if not address:
            print(f"Skipping {brewery.get('name', 'Unknown')} (no address)")
            continue
        print(f"Geocoding: {brewery.get('name', 'Unknown')} - {address}")
        try:
            lat, lng = geocode_address(address)
            if lat is not None and lng is not None:
                brewery['latitude'] = lat
                brewery['longitude'] = lng
                print(f"  -> Success: ({lat}, {lng})")
                updated = True
            else:
                print(f"  -> Failed to geocode.")
        except Exception as e:
            print(f"  -> Error: {e}")
        time.sleep(RATE_LIMIT_DELAY)

    if updated:
        with open(BREWERIES_JSON, 'w', encoding='utf-8') as f:
            json.dump(breweries, f, indent=2, ensure_ascii=False)
        print("\nUpdated breweries.json with new coordinates.")
    else:
        print("\nNo updates made to breweries.json.")

if __name__ == '__main__':
    main()
