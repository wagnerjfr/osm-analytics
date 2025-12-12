// MapView.jsx
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import "./MapView.css";

/* CATEGORY MAP (exported so App/InputPanel can use it) */
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

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapView({ lat, lon, setLat, setLon, radius = 500, amenities = [], categoryLabels = [], runQuery }) {
  // keep map center in sync with lat/lon changes
  const mapCenter = [lat, lon];

  return (
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

        <Heatmap points={amenities} />

        {amenities.map((n) => {
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
                fillOpacity: 0.6,
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
  );
}

/* helpers */
function findCategoryForAmenity(amenity, selected) {
  for (const cat of selected) {
    if (CATEGORY_MAP[cat]?.includes(amenity)) return cat;
  }
  return null;
}

function DraggableMarker({ lat, lon, setLat, setLon, runQuery }) {
  const position = [lat, lon];

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
          // trigger a query after dragging
          runQuery && runQuery(newPos.lat, newPos.lng);
        },
      }}
    />
  );
}

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

function Heatmap({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;
    const heatData = points.map((n) => [n.lat, n.lon, 0.7]);
    const heat = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 18 }).addTo(map);
    return () => {
      if (map && heat) map.removeLayer(heat);
    };
  }, [points, map]);
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setView(position);
  }, [position, map]);
  return null;
}
