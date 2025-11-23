# Python script to update breweries.json with detailed information

import json
import requests
from bs4 import BeautifulSoup
import time # Added for potential delays later

SOURCE_URL = "https://ohiocraftbeer.org/ohio-breweries/"
OUTPUT_FILE = "breweries.json"

def fetch_base_brewery_list():
    """Fetches the initial list of breweries (name, detail_url) from the source."""
    print(f"Fetching base list from {SOURCE_URL}...")
    base_list = []
    try:
        # Added user-agent header
        response = requests.get(SOURCE_URL, timeout=15, headers={'User-Agent': 'OhioBrewPathUpdater/1.0'})
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        soup = BeautifulSoup(response.text, 'html.parser')

        # --- Find ALL links matching the brewery detail page pattern --- 
        # Pattern: https://ohiocraftbeer.org/breweries/{brewery-slug}/
        all_matching_links = soup.find_all('a', href=lambda href: href and 
                                          href.startswith('https://ohiocraftbeer.org/breweries/') and 
                                          len(href) > len('https://ohiocraftbeer.org/breweries/'))
        
        if not all_matching_links:
            print("Error: Could not find any links matching the brewery URL pattern on the page.")
            return []

        # --- Filter out non-brewery links (like regions, categories) --- 
        excluded_link_texts = { # Use a set for efficient lookup
            'show all', 'breweries-in-planning', 'cidery/meadery', 
            'greater cincinnati', 'greater cleveland', 'greater columbus', 
            'north central', 'northeast', 'northwest', 'southeast', 
            'southwest', 'state line', 'west central',
            'breweries' # Exclude the main brewery link itself if it matches href pattern
        }

        for link in all_matching_links:
            name = link.get_text(strip=True)
            detail_url = link.get('href')

            # Check if the link text indicates it's a category/filter link
            if name and name.lower() not in excluded_link_texts:
                # Determine status (active or planning)
                status = "active"
                if "(In Planning)" in name:
                    name = name.replace("(In Planning)", "").strip() # Clean name
                    status = "planning"
                
                # Add to list if name is still valid after cleaning
                if name:
                    base_list.append({
                        'name': name,
                        'detail_url': detail_url,
                        'status': status
                    })

    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL {SOURCE_URL}: {e}")
        return []
    except Exception as e:
        print(f"An error occurred during scraping: {e}")
        return []

    # Remove potential duplicates (based on detail_url, which should be unique)
    seen_urls = set()
    unique_list = []
    for item in base_list:
        if item['detail_url'] not in seen_urls:
            unique_list.append(item)
            seen_urls.add(item['detail_url'])
            
    print(f"Found {len(unique_list)} unique breweries in base list.")
    return unique_list

def enrich_brewery_data(brewery):
    """Enriches a single brewery dict with more details by scraping its detail_url."""
    print(f"Enriching data for: {brewery['name']} ({brewery.get('status', 'active')})...")
    enriched = brewery.copy() # Start with base info (name, detail_url, status)
    
    # Initialize fields to ensure they exist even if scraping fails
    enriched.setdefault('city', "Unknown")
    enriched.setdefault('address', "Unknown")
    enriched.setdefault('state', "OH")
    enriched.setdefault('zip', "Unknown")
    enriched.setdefault('latitude', None)
    enriched.setdefault('longitude', None)
    enriched.setdefault('phone', None)
    enriched.setdefault('website', None)
    enriched.setdefault('brewery_type', None) # Could potentially scrape this too
    enriched.setdefault('region', None) # May need separate logic or mapping
    enriched.setdefault('amenities', []) # Could potentially scrape this
    enriched.setdefault('hours', {}) # Could potentially scrape this
    enriched.setdefault('description', None) # Could potentially scrape this
    enriched.setdefault('image_url', None) # Could potentially scrape this
    enriched['id'] = abs(hash(brewery['detail_url'])) # Ensure ID is set

    detail_url = brewery.get('detail_url')
    if not detail_url:
        print(f"  - Skipping enrichment for {brewery['name']} due to missing detail_url.")
        return enriched

    try:
        # Be polite - add a small delay
        time.sleep(0.5) 
        
        response = requests.get(detail_url, timeout=15, headers={'User-Agent': 'OhioBrewPathUpdater/1.0'})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # --- Find the 'Details' section --- 
        details_header = soup.find(['h2', 'h3', 'h4'], string=lambda text: text and 'Details' in text)
        details_container = None
        if details_header:
            # Try finding a logical parent or sibling container holding the details
            # Common patterns: next sibling div, parent div
            details_container = details_header.find_parent()
            # Sometimes details might be directly after the header without a specific container
            if not details_container:
                 details_container = details_header # Use header as starting point if no parent found

        if details_container: 
            # --- Extract Address --- 
            # Look for <h5> containing street address
            street_h5 = details_container.find('h5')
            if street_h5:
                enriched['address'] = street_h5.get_text(strip=True)
                # Find the text node likely containing City, State Zip near the h5
                # It often follows the h5 directly or its parent
                parent_tag = street_h5.find_parent()
                sibling_text_node = None
                if parent_tag:
                    sibling_text_node = parent_tag.find_next_sibling(string=True) 
                if not sibling_text_node: # Fallback if not a sibling
                     sibling_text_node = street_h5.find_next(string=True)
                     
                if sibling_text_node and 'Ohio' in sibling_text_node:
                    city_state_zip_text = sibling_text_node.strip()
                    parts = city_state_zip_text.split(',')
                    if len(parts) >= 2:
                        enriched['city'] = parts[0].strip()
                        state_zip_parts = parts[1].strip().split()
                        if len(state_zip_parts) >= 2 and state_zip_parts[0] == 'Ohio':
                            enriched['state'] = 'OH'
                            enriched['zip'] = state_zip_parts[-1] # Get last part as zip
            
            # --- Extract Website --- 
            # Find link that is likely the website (not google maps, not mailto, not 'map it')
            website_link_tag = None
            for link in details_container.find_all('a', href=True):
                 href = link.get('href')
                 link_text = link.get_text(strip=True)
                 if href and 'google.com/maps' not in href and 'mailto:' not in href and link_text != '(map it)':
                     website_link_tag = link
                     break # Assume first valid link is the website
            if website_link_tag:
                 enriched['website'] = website_link_tag.get('href')
            else:
                 # Fallback check if preceded by 'Website:' text
                 website_label = details_container.find(string=lambda text: text and 'Website:' in text)
                 if website_label:
                     next_a = website_label.find_next('a')
                     if next_a:
                          enriched['website'] = next_a.get('href')

            # --- Extract Phone --- 
            phone_text_found = None
            phone_label = details_container.find(string=lambda text: text and 'Phone:' in text)
            if phone_label:
                 # Try finding the number directly after 'Phone:' within the same element's text
                 raw_text = phone_label.strip()
                 if 'Phone:' in raw_text:
                     potential_phone = raw_text.split('Phone:')[1].strip()
                     if potential_phone and any(c.isdigit() for c in potential_phone):
                         phone_text_found = potential_phone
                 
                 # If not found in the same element, check the next text node or sibling
                 if not phone_text_found:
                    next_text_node = phone_label.find_next(string=True)
                    if next_text_node and any(c.isdigit() for c in next_text_node):
                        phone_text_found = next_text_node.strip()
            
            if phone_text_found:
                 enriched['phone'] = phone_text_found

        else:
             print(f"  - Warning: Could not find 'Details' section container for {brewery['name']}. Scraping might be incomplete.")

    except requests.exceptions.RequestException as e:
        print(f"  - Error fetching detail URL {detail_url} for {brewery['name']}: {e}")
    except Exception as e:
        print(f"  - Error parsing detail page for {brewery['name']}: {e}")

    return enriched

def main():
    """Main function to fetch, enrich, and save brewery data."""
    base_breweries = fetch_base_brewery_list()

    if not base_breweries:
        print("No base breweries found. Exiting.")
        return
    
    all_brewery_data = []
    print("\nStarting data enrichment...")
    for i, brewery in enumerate(base_breweries):
        enriched = enrich_brewery_data(brewery)
        all_brewery_data.append(enriched)
        # Add a progress indicator for large lists
        if (i + 1) % 25 == 0 or (i + 1) == len(base_breweries):
             print(f"Processed {i + 1}/{len(base_breweries)}...")

    print(f"\nFinished enriching data for {len(all_brewery_data)} breweries.")

    # Write the data to the JSON file
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_brewery_data, f, indent=4, ensure_ascii=False)
        print(f"Successfully wrote updated brewery data to {OUTPUT_FILE}")
    except IOError as e:
        print(f"Error writing to file {OUTPUT_FILE}: {e}")

if __name__ == "__main__":
    main()
