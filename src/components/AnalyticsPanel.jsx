import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { CATEGORY_MAP, CATEGORY_COLORS } from "../constants/categories";
import "./AnalyticsPanel.css";

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AnalyticsPanel({ amenities }) {
  if (!amenities?.length) return <div className="sidebar">No POIs available</div>;

  const totalPOIs = amenities.length;
  const avgDistance = amenities.reduce((sum, a) => sum + (a.distance || 0), 0) / totalPOIs;

  // Top Category
  const counts = {};
  amenities.forEach((a) => {
    const type = a.tags?.amenity;
    const category = Object.entries(CATEGORY_MAP).find(([cat, types]) => types.includes(type))?.[0] || "Other";
    counts[category] = (counts[category] || 0) + 1;
  });
  const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const uniqueAmenityTypes = new Set(amenities.map((a) => a.tags?.amenity)).size;

  // Amenity Counts
  const amenityCounts = {};
  amenities.forEach((a) => { const type = a.tags?.amenity; if (type) amenityCounts[type] = (amenityCounts[type] || 0) + 1; });
  const amenityLabels = Object.keys(amenityCounts).sort((a, b) => amenityCounts[b] - amenityCounts[a]);
  const amenityData = {
    labels: amenityLabels,
    datasets: [{
      label: "Amenities",
      data: amenityLabels.map((l) => amenityCounts[l]),
      backgroundColor: amenityLabels.map((l) => {
        const cat = Object.entries(CATEGORY_MAP).find(([cat, types]) => types.includes(l))?.[0] || "Other";
        return CATEGORY_COLORS[cat] || "#888";
      }),
    }],
  };

  // Category Counts and Percentage (both Doughnut)
  const categoryData = {
    labels: Object.keys(counts),
    datasets: [
      {
        label: "POIs per Category",
        data: Object.values(counts),
        backgroundColor: Object.keys(counts).map((cat) => CATEGORY_COLORS[cat] || "#888"),
      },
    ],
  };

  const categoryPercentageData = {
    labels: Object.keys(counts),
    datasets: [
      {
        data: Object.values(counts).map((c) => ((c / totalPOIs) * 100).toFixed(2)),
        backgroundColor: Object.keys(counts).map((cat) => CATEGORY_COLORS[cat] || "#888"),
      },
    ],
  };

  // Distance Distribution
  const bins = [0, 100, 200, 300, 500, 1000, 1500];
  const distanceData = {
    labels: bins.map((b, i) => `${b}-${bins[i + 1] ?? "+"} m`),
    datasets: [{
      label: "POIs by Distance",
      data: bins.map((b, i) => {
        const next = bins[i + 1] ?? Infinity;
        return amenities.filter((a) => a.distance >= b && a.distance < next).length;
      }),
      backgroundColor: "rgba(200, 90, 0, 0.7)",
      borderColor: "rgba(150, 50, 0, 0.8)",
      borderWidth: 1,
    }],
  };

  return (
    <div className="analytics-container">
      <div className="kpi-grid">
        <div className="kpi-card"><h5>Total POIs</h5><span>{totalPOIs}</span></div>
        <div className="kpi-card"><h5>Avg. Distance</h5><span>{avgDistance.toFixed(0)} m</span></div>
        <div className="kpi-card"><h5>Top Category</h5><span>{topCategory}</span></div>
        <div className="kpi-card"><h5>Unique Amenity Types</h5><span>{uniqueAmenityTypes}</span></div>
      </div>

      <div className="analytics-grid">
        <div className="chart-panel"><h4>Amenity Types</h4><Bar key="amenity-chart" data={amenityData} options={{ responsive: true, plugins: { legend: { display: false } }, indexAxis: "x" }} /></div>
        <div className="chart-panel"><h4>POIs per Category</h4><Doughnut key="category-chart" data={categoryData} options={{ responsive: true }} /></div>
        <div className="chart-panel"><h4>Distance Distribution</h4><Bar key="distance-chart" data={distanceData} options={{ responsive: true, plugins: { legend: { display: false } }, indexAxis: "x"}} /></div>
        <div className="chart-panel"><h4>Category Percentage</h4><Doughnut key="category-percentage-chart" data={categoryPercentageData} options={{ responsive: true, plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } } } }} /></div>
      </div>
    </div>
  );
}
