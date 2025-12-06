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
        label: "Amenities in Radius",
        data: Object.values(counts),
        backgroundColor: "rgba(0, 90, 200, 0.7)",
      },
    ],
  };

  return (
    <div className="sidebar">
      {/* Removed title — now in header */}

      {amenities.length > 0 && <Bar data={data} />}

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
