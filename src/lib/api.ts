const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export async function getDashboard() {
  const response = await fetch(`${API_URL}/api/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard data");
  }

  return response.json();
}

export async function getAnalytics(params?: {
  city?: string;
  severity?: string;
  cause?: string;
  dateRange?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.city && params.city !== "All districts") qs.set("city", params.city);
  if (params?.severity && params.severity !== "All severities") qs.set("severity", params.severity);
  if (params?.cause && params.cause !== "All types") qs.set("cause", params.cause);
  if (params?.dateRange && params.dateRange !== "All time") qs.set("dateRange", params.dateRange);

  const url = `${API_URL}/api/analytics${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load analytics data");
  }
  return response.json();
}

export async function getTrends() {
  const response = await fetch(`${API_URL}/api/trends`);
  if (!response.ok) {
    throw new Error("Failed to load trends data");
  }
  return response.json();
}

export async function getHotspots() {
  const response = await fetch(`${API_URL}/api/hotspots`);
  if (!response.ok) {
    throw new Error("Failed to load hotspots data");
  }
  return response.json();
}

export async function getCauses() {
  const response = await fetch(`${API_URL}/api/causes`);
  if (!response.ok) {
    throw new Error("Failed to load causes data");
  }
  return response.json();
}

export async function getConditions() {
  const response = await fetch(`${API_URL}/api/conditions`);
  if (!response.ok) {
    throw new Error("Failed to load conditions data");
  }
  return response.json();
}

export async function getVehicles() {
  const response = await fetch(`${API_URL}/api/vehicles`);
  if (!response.ok) {
    throw new Error("Failed to load vehicles data");
  }
  return response.json();
}

export async function getReportSummary() {
  const response = await fetch(`${API_URL}/api/reports/summary`);
  if (!response.ok) {
    throw new Error("Failed to load report summary");
  }
  return response.json();
}

/**
 * Fetch a CSV export endpoint and trigger a browser download.
 * Returns the number of bytes downloaded on success.
 */
export async function downloadCSVReport(
  endpoint: "severity-summary" | "hotspot-corridors" | "monthly-trend" | "cause-breakdown",
  filename: string,
): Promise<number> {
  const response = await fetch(`${API_URL}/api/reports/export/${endpoint}`);
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error((json as { message?: string }).message || "Export failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return blob.size;
}
