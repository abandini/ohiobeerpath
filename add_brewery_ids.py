import json
import os

# Path to breweries.json
BREWERIES_JSON = os.path.join(os.path.dirname(__file__), 'assets/data/breweries.json')


def main():
    with open(BREWERIES_JSON, 'r', encoding='utf-8') as f:
        breweries = json.load(f)

    # Assign a unique integer ID to each brewery
    for idx, brewery in enumerate(breweries, start=1):
        brewery['id'] = idx

    with open(BREWERIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(breweries, f, indent=2, ensure_ascii=False)
    print(f"Assigned unique IDs to {len(breweries)} breweries.")

if __name__ == '__main__':
    main()
