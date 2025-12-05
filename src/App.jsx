import { useState } from "react";
import MapView from "./components/MapView";
import AnalyticsPanel from "./components/AnalyticsPanel";

export default function App() {
  const [amenities, setAmenities] = useState([]);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <MapView onDataLoaded={setAmenities} />
      <AnalyticsPanel amenities={amenities} />
    </div>
  );
}
