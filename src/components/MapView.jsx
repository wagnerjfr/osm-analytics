import { useEffect, useState } from "react";
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
import "./MapView.css"; // styles (dark theme + panels)

// Default draggable marker icon
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Category colors for faint dots
const categoryColors = {
  "🚗 Mobility": "#1f77b4",
  "🍔 Food": "#d62728",
  "🛒 Commerce": "#2ca02c",
  "🏫 Education": "#9467bd",
  "🏥 Health": "#ff7f0e",
};

// Sightseeing places (one per city)
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
  const [poiTypes, setPoiTypes] = useState("restaurant|fast_food|cafe|pub"); // Food default
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("🍔 Food");
  const [mapCenter, setMapCenter] = useState([lat, lon]);

  const runQuery = (latParam = null, lonParam = null, radiusParam = null) => {
    if (!poiTypes) return;

    const qLat = latParam !== null ? latParam : lat;
    const qLon = lonParam !== null ? lonParam : lon;
    const qRadius = radiusParam !== null ? radiusParam : radius;

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
        console.error("Overpass API error:", err);
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else if (err.message.includes("502") || err.message.includes("504")) {
          setError("Server unavailable (Bad Gateway). Try again later.");
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

  // Trigger query on first load (Food)
  useEffect(() => {
    if (poiTypes) runQuery();
  }, []); // initial load only

  // ⭐ NEW: autorun when category changes
  useEffect(() => {
    if (poiTypes) runQuery();
  }, [poiTypes]);

  return (
    <div className="map-view-wrapper">
      {/* Input panel */}
      <div className="input-panel">
        <div className="input-row">
          <InputField label="Lat" value={lat} onChange={(v) => setLat(v)} />
          <InputField label="Lon" value={lon} onChange={(v) => setLon(v)} />

          <div className="sightseeing-select">
            <SightseeingSelector
              setLat={(v) => setLat(v)}
              setLon={(v) => setLon(v)}
              setMapCenter={(c) => setMapCenter(c)}
              runQuery={(a, b) => runQuery(a, b)}
            />
          </div>

          <InputField
            label="Radius (m)"
            value={radius}
            onChange={(v) => setRadius(v)}
            type="number"
            min={50}
            max={20000}
            step={50}
          />

          <CategorySelector
            setPoiTypes={setPoiTypes}
            setSelectedCategoryLabel={setSelectedCategoryLabel}
            defaultValue={poiTypes}
          />

          <button onClick={() => runQuery()} disabled={!poiTypes} className="button-primary">
            Update Map
          </button>

          <div
            className={`status-message ${
              loading ? "loading" : error ? "error" : !loading && nodes.length === 0 && poiTypes ? "no-poi" : ""
            }`}
          >
            {loading ? "Loading POIs..." : error ? error : !loading && nodes.length === 0 && poiTypes ? "No POIs found." : ""}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer center={mapCenter} zoom={16} style={{ width: "100%", height: "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Topographic">
              <TileLayer
                url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>, Tiles style by HOT'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OSM Standard">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <MapClickHandler setLat={setLat} setLon={setLon} />
          <DraggableMarker lat={lat} lon={lon} setLat={setLat} setLon={setLon} runQuery={runQuery} />
          <Heatmap points={nodes} />

          {nodes.map((n) => (
            <CircleMarker
              key={n.id}
              center={[n.lat, n.lon]}
              radius={6}
              pathOptions={{
                color: categoryColors[selectedCategoryLabel] || "#888",
                fillColor: categoryColors[selectedCategoryLabel] || "#888",
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
          ))}

          <Recenter position={mapCenter} />
        </MapContainer>
      </div>
    </div>
  );
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

/* CATEGORY DROPDOWN */
function CategorySelector({ setPoiTypes, setSelectedCategoryLabel, defaultValue }) {
  const categories = {
    "🚗 Mobility": "fuel|charging_station|bicycle_rental",
    "🍔 Food": "restaurant|fast_food|cafe|pub",
    "🛒 Commerce": "supermarket|convenience|marketplace",
    "🏫 Education": "school|kindergarten|university",
    "🏥 Health": "clinic|hospital|pharmacy",
  };

  return (
    <label className="input-field-label">
      Category:
      <select
        value={defaultValue}
        onChange={(e) => {
          setPoiTypes(e.target.value);
        }}
      >
        <option value="">-- Select --</option>
        {Object.entries(categories).map(([label, value]) => (
          <option key={label} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* SIGHTSEEING DROPDOWN */
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
          <option key={label} value={coords.join(",")}>
            {label}
          </option>
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

    const heat = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 18,
    }).addTo(map);

    return () => map.removeLayer(heat);
  }, [points]);

  return null;
}

/* RECENTER */
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position]);
  return null;
}
