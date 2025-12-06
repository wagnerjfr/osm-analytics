import { useState } from "react";
import MapView from "./components/MapView";
import AnalyticsPanel from "./components/AnalyticsPanel";
import "./App.css";

export default function App() {
  const [amenities, setAmenities] = useState([]);

  return (
    <div className="app-page">
      {/* NEW: Top title bar */}
      <header className="app-header">
        <h1>
          <a
            href="https://www.openstreetmap.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            OSM
          </a>{" "}
          Analytics Dashboard
        </h1>
      </header>

      {/* Map + Sidebar layout */}
      <div className="app-layout">
        <MapView onDataLoaded={setAmenities} />
        <AnalyticsPanel amenities={amenities} />
      </div>
    </div>
  );
}
