import json
import requests
from bs4 import BeautifulSoup
import time
import os

BREWERIES_JSON = os.path.join(os.path.dirname(__file__), 'breweries.json')
USER_AGENT = 'Mozilla/5.0 (compatible; AddressScraper/1.0)'

# Helper to extract address from ohiocraftbeer.org brewery detail page
# This is a best-effort and may need adjustment if page structure changes

def extract_address_from_page(url):
    try:
        headers = {'User-Agent': USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            print(f"Failed to fetch {url}: {resp.status_code}")
            return None
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Look for address in the main content section
        address_tag = soup.find('div', class_='brewery-address')
        if address_tag:
            address = address_tag.get_text(separator=' ', strip=True)
            return address
        # Fallback: look for any <address> tag
        address_tag = soup.find('address')
        if address_tag:
            address = address_tag.get_text(separator=' ', strip=True)
            return address
        # Fallback: try to find address-like text
        for tag in soup.find_all(['p', 'div', 'span']):
            txt = tag.get_text(separator=' ', strip=True)
            if 'Ohio' in txt and any(char.isdigit() for char in txt):
                return txt
        return None
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def main():
    with open(BREWERIES_JSON, 'r', encoding='utf-8') as f:
        breweries = json.load(f)

    updated = False
    for brewery in breweries:
        if brewery.get('latitude') is not None and brewery.get('longitude') is not None:
            continue
        url = brewery.get('detail_url')
        if not url:
            print(f"No detail_url for {brewery.get('name', 'Unknown')}")
            continue
        print(f"Scraping address for {brewery['name']}...")
        address = extract_address_from_page(url)
        if address:
            print(f"  -> Found address: {address}")
            brewery['address'] = address
            updated = True
        else:
            print(f"  -> Address not found on page.")
        time.sleep(1)  # Be polite to the server
    if updated:
        with open(BREWERIES_JSON, 'w', encoding='utf-8') as f:
            json.dump(breweries, f, indent=2, ensure_ascii=False)
        print("Updated breweries.json with new addresses.")
    else:
        print("No addresses updated.")

if __name__ == '__main__':
    main()
