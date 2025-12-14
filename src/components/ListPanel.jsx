// ListPanel.jsx
import { CATEGORY_MAP } from "../constants/categories"; // <- updated import
import "./ListPanel.css";

export default function ListPanel({ amenities }) {
  if (!amenities || amenities.length === 0) {
    return (
      <div className="list-panel">
        <h3>List of Points of Interest</h3>
        <p>No POIs available.</p>
      </div>
    );
  }

  // Amenity → category lookup
  const amenityToCategory = {};
  Object.entries(CATEGORY_MAP).forEach(([category, list]) => {
    list.forEach((a) => {
      amenityToCategory[a] = category;
    });
  });

  // Group POIs by category
  const grouped = {};
  amenities.forEach((poi) => {
    const amenity = poi.tags?.amenity;
    const category = amenityToCategory[amenity] || "Other";

    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(poi);
  });

  // Sort POIs by distance (nearest first)
  Object.values(grouped).forEach((list) =>
    list.sort((a, b) => a.distance - b.distance)
  );

  // Sort categories alphabetically
  const sortedCategories = Object.entries(grouped).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const formatDistance = (d) =>
    d < 1000 ? `${d.toFixed(0)} m` : `${(d / 1000).toFixed(2)} km`;

  return (
    <div className="list-panel">
      <div className="category-grid">
        {sortedCategories.map(([category, list]) => (
          <div key={category} className="category-group">
            <h4>{category} ({list.length})</h4>

            <ul>
              {list.map((poi) => (
                <li key={poi.id}>
                  <span className="poi-main">
                    <strong>{poi.tags?.name || "Unnamed"}</strong>
                    <span className="poi-amenity">
                      {" "}({poi.tags?.amenity})
                    </span>
                  </span>

                  <span className="poi-distance">
                    {formatDistance(poi.distance)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
