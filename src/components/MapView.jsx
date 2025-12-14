import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, useMap, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import { CATEGORY_MAP, CATEGORY_COLORS } from "../constants/categories";
import "./MapView.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapView({ lat, lon, setLat, setLon, setSavedPlace, radius = 500, amenities = [], categoryLabels = [], runQuery }) {
  const mapCenter = [lat, lon];
  const [stickyPoiId, setStickyPoiId] = useState(null);

  return (
    <div className="map-container">
      <MapContainer center={mapCenter} zoom={16} style={{ width: "100%", height: "100%" }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Topographic">
            <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" attribution="&copy; OSM" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OSM Standard">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapClickHandler setLat={setLat} setLon={setLon} setSavedPlace={setSavedPlace} runQuery={runQuery} />
        <DraggableMarker lat={lat} lon={lon} setLat={setLat} setLon={setLon} setSavedPlace={setSavedPlace} runQuery={runQuery} />
        <Heatmap points={amenities} />

        {amenities.map((n) => {
          const cat = findCategoryForAmenity(n.tags?.amenity, categoryLabels);
          const color = CATEGORY_COLORS[cat] || "#888";
          const isSticky = stickyPoiId === n.id;

          return (
            <CircleMarker
              key={n.id}
              center={[n.lat, n.lon]}
              radius={6}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 1 }}
              eventHandlers={{ click: () => setStickyPoiId(isSticky ? null : n.id) }}
            >
              {!isSticky && (
                <Tooltip direction="top" offset={[0, -10]} className="fade-tooltip">
                  <span>
                    <b>{n.tags?.name || "Unnamed POI"}</b><br />
                    {n.tags?.amenity}<br />
                    <span className="distance">{n.distance?.toFixed(0)} m away</span>
                  </span>
                </Tooltip>
              )}
              {isSticky && (
                <Tooltip direction="top" offset={[0, -10]} className="fade-tooltip" permanent interactive>
                  <span>
                    <b>{n.tags?.name || "Unnamed POI"}</b><br />
                    {n.tags?.amenity}<br />
                    <span className="distance">{n.distance?.toFixed(0)} m away</span>
                  </span>
                </Tooltip>
              )}
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

function DraggableMarker({ lat, lon, setLat, setLon, setSavedPlace, runQuery }) {
  return (
    <Marker
      position={[lat, lon]}
      icon={defaultIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setLat(lat);
          setLon(lng);
          setSavedPlace("");
          runQuery?.(lat, lng);
        },
      }}
    />
  );
}

function MapClickHandler({ setLat, setLon, setSavedPlace, runQuery }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLat(lat);
      setLon(lng);
      setSavedPlace("");
      runQuery?.(lat, lng);
    },
  });
  return null;
}

function Heatmap({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const heatData = points.map((n) => [n.lat, n.lon, 0.7]);
    const heat = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 18 }).addTo(map);
    return () => map.removeLayer(heat);
  }, [points, map]);
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => { map?.setView(position); }, [position, map]);
  return null;
}
