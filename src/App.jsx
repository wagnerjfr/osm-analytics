// App.jsx
import { useEffect, useState, useRef } from "react";
import MapView from "./components/MapView";
import { CATEGORY_MAP } from "./constants/categories";
import AnalyticsPanel from "./components/AnalyticsPanel";
import ListPanel from "./components/ListPanel";
import "./App.css";
import L from "leaflet";

export default function App() {
  // --- Saved Places ---
  const savedPlaces = [
    { name: "Berlin - TV Tower", lat: 52.5208, lon: 13.4095 },
    { name: "Bangalore - Brigade Road", lat: 12.9719, lon: 77.6086 },
    { name: "Dubai - Burj Khalifa", lat: 25.1972, lon: 55.2744 },
    { name: "Los Angeles - Downtown", lat: 34.0522, lon: -118.2437 },
    { name: "New York - Lower Manhattan", lat: 40.7075, lon: -74.0113 },
    { name: "Paris - Eiffel Tower", lat: 48.8584, lon: 2.2945 },
    { name: "Rome - Colosseum", lat: 41.8902, lon: 12.4922 },
    { name: "Tokyo - Tokyo Tower", lat: 35.6586, lon: 139.7454 },
    { name: "São Paulo - Downtown", lat: -23.5505, lon: -46.6333 },
    { name: "Sydney - Downtown", lat: -33.8688, lon: 151.2093 },
  ];

  // --- Default saved place: NYC ---
  const defaultPlace = savedPlaces.find(p => p.name.includes("New York - Lower Manhattan"));

  // --- central state ---
  const [allAmenities, setAllAmenities] = useState([]); // full API results
  const [amenities, setAmenities] = useState([]); // filtered POIs
  const [lat, setLat] = useState(defaultPlace.lat);
  const [lon, setLon] = useState(defaultPlace.lon);
  const [savedPlace, setSavedPlace] = useState(`${defaultPlace.lat},${defaultPlace.lon}`);
  const [radius, setRadius] = useState(500);

  // --- all categories selected by default ---
  const allCategories = Object.keys(CATEGORY_MAP);
  const [selectedCategories, setSelectedCategories] = useState(allCategories);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("map"); // map, analytics, list
  const debounceRef = useRef(null);

  // --- Fetch POIs from Overpass ---
  const runQuery = (latParam = null, lonParam = null, radiusParam = null) => {
    const qLat = latParam ?? lat;
    const qLon = lonParam ?? lon;
    const qRadius = radiusParam ?? radius;

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const query = `
      [out:json][timeout:25];
      node
        (around:${qRadius}, ${qLat}, ${qLon})
        ["amenity"];
      out;
    `;

    fetch(
      "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query),
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const elements = data.elements || [];
        const enriched = elements.map((n) => ({
          ...n,
          distance: L.latLng(qLat, qLon).distanceTo(L.latLng(n.lat, n.lon)),
        }));
        setAllAmenities(enriched);
        filterAmenities(enriched, selectedCategories); // filter locally
      })
      .catch((err) => {
        if (err.name === "AbortError") setError("Request timed out. Try again.");
        else setError("Error fetching data: " + err.message);
        setAllAmenities([]);
        setAmenities([]);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  };

  // --- Local filtering by category ---
  const filterAmenities = (list, categories) => {
    if (!list || !categories?.length) {
      setAmenities([]);
      return;
    }

    const filtered = list.filter((poi) => {
      const amenity = poi.tags?.amenity;
      for (const cat of categories) {
        if (CATEGORY_MAP[cat]?.includes(amenity)) return true;
      }
      return false;
    });

    setAmenities(filtered);
  };

  // --- Set coords from Saved Places ---
  const handleSetCoordsAndQuery = (newLat, newLon) => {
    setLat(newLat);
    setLon(newLon);
    setTimeout(() => runQuery(newLat, newLon), 0);
  };

  // --- Run initial query on mount ---
  useEffect(() => {
    handleSetCoordsAndQuery(defaultPlace.lat, defaultPlace.lon);
  }, []);

  // --- Clamp radius input ---
  const handleRadiusChange = (value) => {
    const clamped = Math.min(Math.max(value, 50), 1500); // min 50, max 1500
    setRadius(clamped);
  };

  // --- Input Panel ---
  function InputPanel() {
    const [catOpen, setCatOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setCatOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const allLabels = Object.keys(CATEGORY_MAP);

    const toggleCategory = (label) => {
      const updated = selectedCategories.includes(label)
        ? selectedCategories.filter((l) => l !== label)
        : [...selectedCategories, label];

      setSelectedCategories(updated);
      filterAmenities(allAmenities, updated); // local filtering
    };

    const applySelection = (list) => {
      setSelectedCategories(list);
      filterAmenities(allAmenities, list); // local filtering
    };

    const selectAll = () => applySelection(allLabels);
    const clearAll = () => applySelection([]);

    const buttonText =
      selectedCategories.length === 0 ? "Filter Categories ▾" : `${selectedCategories.length} selected ▾`;

    return (
      <div className="input-panel">
        <div className="input-row">
          <label className="input-field-label">
            Lat:
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              step="0.000001"
            />
          </label>

          <label className="input-field-label">
            Lon:
            <input
              type="number"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
              step="0.000001"
            />
          </label>

          <label className="input-field-label saved-place">
            Saved Places:
            <select
              value={savedPlace}
              onChange={(e) => {
                if (!e.target.value) return;
                setSavedPlace(e.target.value);
                const [sLat, sLon] = e.target.value.split(",").map(Number);
                handleSetCoordsAndQuery(sLat, sLon);
                setActiveTab("map");
              }}
            >
              <option value="">-- Select a Place --</option>
              {savedPlaces.map((p) => (
                <option key={p.name} value={`${p.lat},${p.lon}`}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="input-field-label">
            Radius (m):
            <div className="radius-input-wrapper">
              <button
                type="button"
                className="radius-btn"
                onClick={() => handleRadiusChange(radius - 50)}
              >
                -
              </button>
              <input
                type="number"
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                step={50}
              />
              <button
                type="button"
                className="radius-btn"
                onClick={() => handleRadiusChange(radius + 50)}
              >
                +
              </button>
            </div>
          </label>

          <div className="catbox-wrapper" ref={ref}>
            <button
              type="button"
              onClick={() => setCatOpen(!catOpen)}
              className="button-primary catbox-button"
            >
              {buttonText}
            </button>

            {catOpen && (
              <div className="catbox-dropdown">
                <div className="catbox-controls">
                  <button className="catbox-control-btn" onClick={selectAll}>Select All</button>
                  <button className="catbox-control-btn" onClick={clearAll}>Clear</button>
                </div>

                <div className="catbox-divider" />

                {allLabels.map((label) => (
                  <label key={label} className="catbox-item">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(label)}
                      onChange={() => toggleCategory(label)}
                    />
                    <span className="catbox-label">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => runQuery()}
            disabled={loading}
            className="button-update"
          >
            Update Map
          </button>

          <div
            className={`status-message ${
              loading ? "loading" : error ? "error" : !loading && amenities.length === 0 && selectedCategories.length ? "no-poi" : ""
            }`}
          >
            {loading ? "Loading POIs..." : error ? error : !loading && amenities.length === 0 && selectedCategories.length ? "No POIs found." : ""}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <header className="app-header">
        <h1>
          <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer noopener">
            OSM
          </a>{" "}
          Analytics Dashboard
        </h1>
      </header>

      <InputPanel />

      {/* Tabs */}
      <div className="selector-panel">
        <button
          className={activeTab === "map" ? "button-primary" : "button-secondary"}
          onClick={() => setActiveTab("map")}
        >
          Map
        </button>

        <button
          className={activeTab === "analytics" ? "button-primary" : "button-secondary"}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>

        <button
          className={activeTab === "list" ? "button-primary" : "button-secondary"}
          onClick={() => setActiveTab("list")}
        >
          List
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === "map" && (
          <div className="map-panel">
            <MapView
              lat={lat}
              lon={lon}
              setLat={setLat}
              setLon={setLon}
              radius={radius}
              amenities={amenities}
              categoryLabels={selectedCategories}
              runQuery={runQuery}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics-panel">
            <AnalyticsPanel amenities={amenities} />
          </div>
        )}

        {activeTab === "list" && (
          <div className="analytics-panel">
            <ListPanel amenities={amenities} />
          </div>
        )}
      </div>
    </div>
  );
}
