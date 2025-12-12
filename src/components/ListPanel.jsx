// ListPanel.jsx
export default function ListPanel({ amenities }) {
  return (
    <div className="sidebar">
      <h3>List of Points of Interest</h3>

      {amenities.length === 0 && <p>No POIs available.</p>}

      <ul>
        {amenities.map((a) => (
          <li key={a.id}>
            {a.tags?.name || "Unnamed"} ({a.tags?.amenity})
          </li>
        ))}
      </ul>
    </div>
  );
}
