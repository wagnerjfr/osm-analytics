// AnalyticsPanel.jsx
import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { CATEGORY_MAP } from "./MapView";
import "./AnalyticsPanel.css";

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

// Utility: Shade color (darken/lighten)
function shadeColor(color, percent) {
  const f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = Math.abs(percent) / 100,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

export default function AnalyticsPanel({ amenities }) {
  if (!amenities || amenities.length === 0)
    return <div className="sidebar">No POIs available</div>;

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
    Other: "#888888",
  };

  // ---------------- Amenity Counts ----------------
  const amenityCounts = {};
  amenities.forEach((a) => {
    const type = a.tags?.amenity;
    if (type) amenityCounts[type] = (amenityCounts[type] || 0) + 1;
  });

  const amenityLabels = Object.keys(amenityCounts).sort(
    (a, b) => amenityCounts[b] - amenityCounts[a]
  );
  const amenityDataArray = amenityLabels.map((label) => amenityCounts[label]);
  const amenityColors = amenityLabels.map((label) => {
    const category =
      Object.entries(CATEGORY_MAP).find(([cat, types]) =>
        types.includes(label)
      )?.[0] || "Other";
    return categoryColors[category] || "#888";
  });

  const amenityData = {
    labels: amenityLabels,
    datasets: [
      {
        label: "Amenities",
        data: amenityDataArray,
        backgroundColor: amenityColors,
        borderColor: amenityColors.map((c) => shadeColor(c, -20)),
        borderWidth: 1,
      },
    ],
  };

  // ---------------- Category Counts ----------------
  const categoryCounts = {};
  amenities.forEach((a) => {
    const type = a.tags?.amenity;
    const category =
      Object.entries(CATEGORY_MAP).find(([cat, types]) =>
        types.includes(type)
      )?.[0] || "Other";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const categoryData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        label: "POIs per Category",
        data: Object.values(categoryCounts),
        backgroundColor: Object.keys(categoryCounts).map(
          (cat) => categoryColors[cat] || "#888"
        ),
      },
    ],
  };

  // -------------- Distance Distribution ------------
  const bins = [0, 100, 200, 300, 500, 1000, 1500];
  const binLabels = bins.map((b, i) => `${b}-${bins[i + 1] ?? "+"} m`);
  const distanceCounts = bins.map((b, i) => {
    const next = bins[i + 1] ?? Infinity;
    return amenities.filter((a) => a.distance >= b && a.distance < next).length;
  });

  const distanceData = {
    labels: binLabels,
    datasets: [
      {
        label: "POIs by Distance",
        data: distanceCounts,
        backgroundColor: "rgba(200, 90, 0, 0.7)",
        borderColor: "rgba(150, 50, 0, 0.8)",
        borderWidth: 1,
      },
    ],
  };

  // ---------------- Render ----------------
  return (
    <div className="analytics-grid">
      <div className="chart-panel">
        <h4>Amenity Types</h4>
        <Bar key="amenity-chart" data={amenityData} options={{ responsive: true }} />
      </div>

      <div className="chart-panel">
        <h4>POIs per Category</h4>
        <Pie key="category-chart" data={categoryData} options={{ responsive: true }} />
      </div>

      <div className="chart-panel">
        <h4>Distance Distribution</h4>
        <Bar key="distance-chart" data={distanceData} options={{ responsive: true }} />
      </div>
    </div>
  );
}
