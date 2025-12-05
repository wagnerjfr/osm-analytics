import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AnalyticsPanel({ amenities }) {
  const counts = {};
  amenities.forEach((a) => {
    const type = a.tags?.amenity;
    if (type) counts[type] = (counts[type] || 0) + 1;
  });

  const data = {
    labels: Object.keys(counts),
    datasets: [
      {
        label: "Amenities in 500m",
        data: Object.values(counts),
        backgroundColor: "rgba(0, 90, 200, 0.7)",
      },
    ],
  };

  return (
    <div
      className="sidebar"
      style={{
        backgroundColor: "#d3d3d3",
        color: "#1b1b1d",
        borderRadius: "12px",
        padding: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
      }}
    >
      {/* Title Box */}
      <div
        style={{
          textAlign: "center",
          backgroundColor: "rgba(0, 90, 200, 0.8)",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "20px",
          padding: "10px 15px",
          borderRadius: "10px",
          textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
          marginBottom: "15px",
        }}
      >
        <a
          href="https://www.openstreetmap.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#fff", textDecoration: "underline" }}
        >
          OSM
        </a>{" "}
        Analytics Dashboard
      </div>

      {/* Chart */}
      {amenities.length === 0 ? (
        <p></p>
      ) : (
        <Bar data={data} />
      )}

      <hr style={{ borderColor: "#aaa", margin: "15px 0" }} />

      {/* POI List */}
      <h3>List of Points of Interest</h3>
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
