import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  useMap,
  useMapEvents,
  LayersControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import "./MapView.css";

// -----------------------------------------------
//  SHARED CATEGORY → AMENITIES MAP (ONE SOURCE)
// -----------------------------------------------
export const CATEGORY_MAP = {
  "🚗 Transport": ["charging_station", "bicycle_rental", "bus_station", "parking", "taxi"],
  "🍔 Food": ["restaurant", "fast_food"],
  "☕ Café": ["cafe", "pub"],
  "🛒 Commerce": ["supermarket", "convenience", "marketplace", "fuel"],
  "🏫 Education": ["school", "kindergarten", "university"],
  "🏥 Health": ["clinic", "hospital", "pharmacy"],
  "🏛️ Public Services": ["police", "fire_station", "post_office", "bank"],
  "🎭 Recreation": ["theatre", "cinema", "sports_centre"],
  "🕍 Religious": ["place_of_worship", "church", "mosque", "temple"],
};

// Category → colors
const categoryColors = {
  "🚗 Transport": "#1f77b4",
  "🍔 Food": "#d62728",
  "☕ Café": "#8c564b",
  "🛒 Commerce": "#2ca02c",
  "🏫 Education": "#9467bd",
  "🏥 Health": "#424ea1ff",
  "🏛️ Public Services": "#37a589ff",
  "🎭 Recreation": "#b3e423ff",
  "🕍 Religious": "#d222a6ff",
};

// Default draggable marker icon
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Predefined sightseeing places
const sightseeingPlaces = {
  "Berlin - TV Tower": [52.5208, 13.4095],
  "Bangalore - Brigade Road": [12.9719, 77.6086],
  "Dubai - Burj Khalifa": [25.1972, 55.2744],
  "Los Angeles - Downtown": [34.0522, -118.2437],
  "New York - Lower Manhattan": [40.7075, -74.0113],
  "Paris - Eiffel Tower": [48.8584, 2.2945],
  "Rome - Colosseum": [41.8902, 12.4922],
  "Tokyo - Tokyo Tower": [35.6586, 139.7454],
  "São Paulo - Downtown": [-23.5505, -46.6333],
  "Sydney - Sydney Opera House": [-33.8568, 151.2153],
};

export default function MapView({ onDataLoaded }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lat, setLat] = useState(48.8588443);
  const [lon, setLon] = useState(2.2943506);
  const [radius, setRadius] = useState(500);

  // MULTI CATEGORY SELECTION STATE
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [poiTypes, setPoiTypes] = useState("");
  const [categoryLabels, setCategoryLabels] = useState([]);

  const [mapCenter, setMapCenter] = useState([lat, lon]);

  // -------------------
  // RUN OVERPASS QUERY
  // -------------------
  const runQuery = (latParam = null, lonParam = null, radiusParam = null) => {
    if (!poiTypes) return;

    const qLat = latParam ?? lat;
    const qLon = lonParam ?? lon;
    const qRadius = radiusParam ?? radius;

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const query = `
      [out:json];
      node
        (around:${qRadius}, ${qLat}, ${qLon})
        ["amenity"~"${poiTypes}"];
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
        setNodes(elements);
        onDataLoaded?.(elements || []);
        setMapCenter([qLat, qLon]);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else {
          setError("Error fetching data: " + err.message);
        }
        setNodes([]);
        onDataLoaded?.([]);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  };

  // DEBOUNCE API calls when categories change
  useEffect(() => {
    if (!poiTypes) return;

    const timeoutId = setTimeout(() => {
      runQuery();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [poiTypes]);

  return (
    <div className="map-view-wrapper">

      {/* INPUT PANEL */}
      <div className="input-panel">
        <div className="input-row">
          <InputField label="Lat" value={lat} onChange={setLat} />
          <InputField label="Lon" value={lon} onChange={setLon} />

          <div className="sightseeing-select">
            <SightseeingSelector
              setLat={setLat}
              setLon={setLon}
              setMapCenter={setMapCenter}
              runQuery={runQuery}
            />
          </div>

          <InputField
            label="Radius (m)"
            value={radius}
            onChange={setRadius}
            type="number"
            min={50}
            max={20000}
            step={50}
          />

          <IconCheckboxCategories
            setPoiTypes={setPoiTypes}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            setCategoryLabels={setCategoryLabels}
          />

          <button onClick={() => runQuery()} disabled={!poiTypes} className="button-update">
            Update Map
          </button>

          <div
            className={`status-message ${
              loading ? "loading" : error ? "error" : !loading && nodes.length === 0 && poiTypes ? "no-poi" : ""
            }`}
          >
            {loading
              ? "Loading POIs..."
              : error
              ? error
              : !loading && nodes.length === 0 && poiTypes
              ? "No POIs found."
              : ""}
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="map-container">
        <MapContainer center={mapCenter} zoom={16} style={{ width: "100%", height: "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Topographic">
              <TileLayer
                url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                attribution="&copy; OSM"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OSM Standard">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OSM"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <MapClickHandler setLat={setLat} setLon={setLon} />
          <DraggableMarker lat={lat} lon={lon} setLat={setLat} setLon={setLon} runQuery={runQuery} />

          <Heatmap points={nodes} />

          {nodes.map((n) => {
            const cat = findCategoryForAmenity(n.tags?.amenity, categoryLabels);
            const color = categoryColors[cat] || "#888";

            return (
              <CircleMarker
                key={n.id}
                center={[n.lat, n.lon]}
                radius={6}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.4,
                  weight: 1,
                }}
              >
                <Popup>
                  <b>{n.tags?.name || "Unnamed POI"}</b>
                  <br />
                  {n.tags?.amenity}
                </Popup>
              </CircleMarker>
            );
          })}

          <Recenter position={mapCenter} />
        </MapContainer>
      </div>
    </div>
  );
}

/* FIND CATEGORY FOR AMENITY */
function findCategoryForAmenity(amenity, selected) {
  for (const cat of selected) {
    if (CATEGORY_MAP[cat]?.includes(amenity)) return cat;
  }
  return null;
}

/* INPUT FIELD */
function InputField({ label, value, onChange, type = "number", min, max, step }) {
  return (
    <label className="input-field-label">
      {label}:
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) : e.target.value)}
        step={step}
        min={min}
        max={max}
      />
    </label>
  );
}

/* ICON CHECKBOX CATEGORY SELECTOR */
function IconCheckboxCategories({ setPoiTypes, selectedCategories, setSelectedCategories, setCategoryLabels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const allLabels = Object.keys(CATEGORY_MAP);

  const toggle = (label) => {
    const updated = selectedCategories.includes(label)
      ? selectedCategories.filter((l) => l !== label)
      : [...selectedCategories, label];
    applySelection(updated);
  };

  const applySelection = (list) => {
    setSelectedCategories(list);
    setCategoryLabels(list);
    const merged = list.flatMap((l) => CATEGORY_MAP[l]);
    setPoiTypes(merged.join("|"));
  };

  const selectAll = () => applySelection(allLabels);
  const clearAll = () => applySelection([]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buttonText = selectedCategories.length === 0 ? "Filter Categories ▾" : `${selectedCategories.length} selected ▾`;

  return (
    <div className="catbox-wrapper" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="button-primary catbox-button">
        {buttonText}
      </button>

      {open && (
        <div className="catbox-dropdown">
          <div className="catbox-controls">
            <button className="catbox-control-btn" onClick={selectAll}>Select All</button>
            <button className="catbox-control-btn" onClick={clearAll}>Clear</button>
          </div>

          <div className="catbox-divider" />

          {allLabels.map((label) => (
            <label key={label} className="catbox-item">
              <input type="checkbox" checked={selectedCategories.includes(label)} onChange={() => toggle(label)} />
              <span className="catbox-label">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* SIGHTSEEING SELECTOR */
function SightseeingSelector({ setLat, setLon, setMapCenter, runQuery }) {
  const handleChange = (e) => {
    if (!e.target.value) return;
    const [sLat, sLon] = e.target.value.split(",").map(Number);
    setLat(sLat);
    setLon(sLon);
    setMapCenter([sLat, sLon]);
    runQuery(sLat, sLon);
  };

  return (
    <label className="input-field-label">
      Saved Places:
      <select onChange={handleChange}>
        <option value="">-- Select a Place --</option>
        {Object.entries(sightseeingPlaces).map(([label, coords]) => (
          <option key={label} value={coords.join(",")}>{label}</option>
        ))}
      </select>
    </label>
  );
}

/* DRAGGABLE MARKER */
function DraggableMarker({ lat, lon, setLat, setLon, runQuery }) {
  const [position, setPosition] = useState([lat, lon]);
  useEffect(() => setPosition([lat, lon]), [lat, lon]);

  return (
    <Marker
      position={position}
      icon={defaultIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPos = e.target.getLatLng();
          setLat(newPos.lat);
          setLon(newPos.lng);
          runQuery();
        },
      }}
    />
  );
}

/* MAP CLICK HANDLER */
function MapClickHandler({ setLat, setLon }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLat(lat);
      setLon(lng);
    },
  });
  return null;
}

/* HEATMAP */
function Heatmap({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;
    const heatData = points.map((n) => [n.lat, n.lon, 0.7]);
    const heat = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 18 }).addTo(map);
    return () => map.removeLayer(heat);
  }, [points]);
  return null;
}

/* RECENTER */
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => { map.setView(position); }, [position]);
  return null;
}
