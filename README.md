# Ohio Beer Path 🍺

Discover Ohio's craft breweries and plan your perfect brewery tour.

**Live Site:** [ohiobeerpath.com](https://ohiobeerpath.com) *(pending deployment)*

## Features

- **351 Ohio Breweries** - Comprehensive database of Ohio craft breweries
- **Interactive Maps** - Google Maps integration with brewery locations
- **Regional Browsing** - Explore breweries by Ohio region
- **Search** - Find breweries by name, city, or ZIP code
- **Itinerary Builder** - Create custom brewery tour routes
- **Nearby Search** - Find breweries near your current location
- **PWA Support** - Install as a mobile app, works offline
- **Mobile Optimized** - Responsive design for all devices

## Screenshots

*(Screenshots to be added after deployment)*

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend:** PHP 7.4+, MySQL 5.7+
- **APIs:** Google Maps API (Maps, Geocoding, Directions)
- **PWA:** Service Worker, Web App Manifest
- **Data Processing:** Python 3.7+

## Getting Started

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Google Maps API key
- Python 3.7+ (optional, for data processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abandini/ohiobeerpath.git
   cd ohiobeerpath
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Google Maps API key:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. Set up the database:
   ```bash
   php setup-database.php
   ```

4. Start the development server:
   ```bash
   php -S localhost:8000
   ```

5. Open http://localhost:8000 in your browser

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Testing Guide](docs/TESTING.md) - QA checklist
- [Contributing](CONTRIBUTING.md) - How to contribute

## Project Structure

```
ohiobeerpath/
├── index.php                # Homepage
├── breweries.php            # All breweries listing
├── regions.php              # Regional brewery view
├── nearby.php               # Find nearby breweries
├── itinerary.php            # Brewery tour builder
├── api/                     # REST API endpoints
├── includes/                # Reusable PHP components
├── assets/                  # Static files (CSS, JS, images)
├── breweries.json           # Brewery database (351 breweries)
└── docs/                    # Documentation
```

## API Endpoints

### GET /api/breweries.php
Get all breweries or filter by region.
```bash
curl "http://localhost:8000/api/breweries.php?region=central"
```

### GET /api/search.php
Search breweries by name, city, or ZIP code.
```bash
curl "http://localhost:8000/api/search.php?q=Cleveland"
```

### POST /api/analytics.php
Track user interactions (for analytics).

## Data

The brewery dataset includes:
- 351 Ohio craft breweries
- Complete address information
- Business hours
- Phone numbers and websites
- Geographic coordinates
- Regional classifications
- Amenities (tap rooms, tours, etc.)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Roadmap

- [ ] User accounts and saved itineraries
- [ ] Brewery reviews and ratings
- [ ] Events calendar
- [ ] Beer style filtering
- [ ] Brewery check-ins
- [ ] Social sharing features
- [ ] Mobile app (iOS/Android)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Brewery data sourced from public directories and brewery websites
- Google Maps Platform for mapping and directions
- Bootstrap team for the UI framework
- Ohio craft brewery community

## Contact

- **Website:** [ohiobeerpath.com](https://ohiobeerpath.com)
- **GitHub:** [github.com/abandini/ohiobeerpath](https://github.com/abandini/ohiobeerpath)
- **Issues:** [Report a bug or request a feature](https://github.com/abandini/ohiobeerpath/issues)

---

**Drink responsibly. Never drink and drive. Always have a designated driver or use rideshare services.**
