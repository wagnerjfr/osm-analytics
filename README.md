# OSM Analytics

A lightweight React + Leaflet web app to visualize **OpenStreetMap (OSM) Points of Interest (POIs)** in any city. It allows users to explore amenities nearby, view a heatmap, and see analytics with interactive charts.

---

## Demo

Live demo available on GitHub Pages:
[https://wagnerjfr.github.io/osm-analytics](https://wagnerjfr.github.io/osm-analytics)

---

## Features

* Interactive map with **Leaflet** and OSM tiles
* Clickable draggable marker to select any location
* Heatmap visualization of nearby POIs using **Leaflet.heat**
* Category selection for common POIs:

  * 🚗 Mobility (fuel, charging stations, bicycle rentals)
  * 🍔 Food (restaurants, fast food, cafes, pubs)
  * 🛒 Commerce (supermarkets, convenience stores, marketplaces)
  * 🏫 Education (schools, universities, kindergartens)
  * 🏥 Health (clinics, hospitals, pharmacies)
* Quick access to popular sightseeing spots
* Analytics panel:

  * Bar chart of amenities by type (using **Chart.js**)
  * List of all nearby POIs
* Dark/light themed panels for better readability

---

## Installation

Clone the repository:

```bash
git clone https://github.com/wagnerjfr/osm-analytics.git
cd osm-analytics
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (default Vite port).

---

## Build & Deploy

### Build for production:

```bash
npm run build
```

### Deploy to GitHub Pages:

```bash
npm run deploy
```

This uses the `gh-pages` package and the `homepage` property in `package.json` for deployment.

---

## Technologies

* **React 19**
* **Vite** for development & build
* **Leaflet** & **react-leaflet** for maps
* **Leaflet.heat** for heatmaps
* **Chart.js** & **react-chartjs-2** for analytics charts
* **GitHub Pages** for hosting

---

## Notes

* Default category on load is **Food**
* Default map location is **Paris, France** (Eiffel Tower)
* Data is fetched from **Overpass API** (OpenStreetMap)
* All markers include name and amenity type, with fallback to "Unnamed POI"

---

## License

This project is licensed under MIT.
Data courtesy of [OpenStreetMap](https://www.openstreetmap.org/).

---

## Screenshots

![Map view](screenshots/mainpage.png)
