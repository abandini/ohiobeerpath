# Development Guide

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Python 3.7+ (for data processing scripts)
- Google Maps API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/abandini/ohiobeerpath.git
   cd ohiobeerpath
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your settings:
   - Set your Google Maps API key
   - Configure database credentials

4. Install Python dependencies (for data scripts):
   ```bash
   pip install -r requirements.txt
   ```

5. Set up the database:
   ```bash
   php setup-database.php
   ```

## Running Locally

Start the PHP development server:

```bash
php -S localhost:8000
```

Visit http://localhost:8000 in your browser.

## Project Structure

```
ohiobrewpath/
├── index.php                    # Homepage
├── brewery.php                  # Individual brewery page
├── regions.php                  # Regional listings
├── breweries.php                # All breweries page
├── nearby.php                   # Find nearby breweries
├── itinerary.php                # Tour builder
├── api/                         # REST API endpoints
│   ├── breweries.php            # Get breweries
│   ├── search.php               # Search breweries
│   └── analytics.php            # Track analytics
├── includes/                    # Reusable components
│   ├── config.php               # Configuration
│   ├── db.php                   # Database utilities
│   └── [components]             # UI components
├── assets/                      # Static files
│   ├── js/                      # JavaScript files
│   ├── css/                     # Stylesheets
│   └── images/                  # Images
└── breweries.json               # Brewery data (351 breweries)
```

## API Endpoints

### GET /api/breweries.php
Get all breweries or filter by region.

Query parameters:
- `region` - Filter by region (central, northeast, etc.)

### GET /api/search.php
Search breweries by name, city, or ZIP code.

Query parameters:
- `q` - Search query

### POST /api/analytics.php
Track user interactions.

## Data Processing

Python scripts for maintaining brewery data:

- `update_breweries.py` - Update brewery information
- `geocode_breweries.py` - Geocode addresses
- `qa_brewery_data.py` - Data quality checks

## Testing

Run data quality checks:

```bash
python qa_brewery_data.py
```

## Google Maps API

The application requires a Google Maps API key with the following APIs enabled:
- Maps JavaScript API
- Geocoding API
- Directions API

Set your key in `.env`:
```
GOOGLE_MAPS_API_KEY=your_key_here
```
