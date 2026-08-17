// Static demo telemetry for the UI layer. No backend wired yet.

export const kpis = [
  {
    label: "Total Accidents",
    value: "48,392",
    delta: -6.4,
    hint: "vs previous 90 days",
    series: [42, 46, 39, 51, 44, 38, 35, 33, 31, 29],
    tone: "primary" as const,
  },
  {
    label: "Fatalities",
    value: "3,118",
    delta: -2.1,
    hint: "severity index 0.64",
    series: [22, 25, 21, 28, 24, 23, 21, 20, 19, 19],
    tone: "destructive" as const,
  },
  {
    label: "Active Hotspots",
    value: "127",
    delta: 4.8,
    hint: "corridors above risk 70",
    series: [12, 14, 13, 16, 18, 17, 19, 21, 22, 24],
    tone: "warning" as const,
  },
  {
    label: "Avg. Response Time",
    value: "8m 12s",
    delta: -11.3,
    hint: "emergency dispatch",
    series: [30, 28, 29, 26, 24, 25, 22, 20, 19, 18],
    tone: "accent" as const,
  },
];

export const monthlyTrend = [
  { month: "Jan", accidents: 3620, fatalities: 258, injuries: 2810 },
  { month: "Feb", accidents: 3310, fatalities: 231, injuries: 2560 },
  { month: "Mar", accidents: 3980, fatalities: 274, injuries: 3050 },
  { month: "Apr", accidents: 4210, fatalities: 289, injuries: 3320 },
  { month: "May", accidents: 4460, fatalities: 301, injuries: 3510 },
  { month: "Jun", accidents: 4180, fatalities: 282, injuries: 3260 },
  { month: "Jul", accidents: 4540, fatalities: 312, injuries: 3620 },
  { month: "Aug", accidents: 4390, fatalities: 296, injuries: 3480 },
  { month: "Sep", accidents: 4020, fatalities: 268, injuries: 3140 },
  { month: "Oct", accidents: 4310, fatalities: 285, injuries: 3390 },
  { month: "Nov", accidents: 4680, fatalities: 318, injuries: 3720 },
  { month: "Dec", accidents: 4980, fatalities: 344, injuries: 3910 },
];

export const hourlyDistribution = [
  { hour: "00", count: 820 },
  { hour: "02", count: 640 },
  { hour: "04", count: 510 },
  { hour: "06", count: 1180 },
  { hour: "08", count: 2460 },
  { hour: "10", count: 1840 },
  { hour: "12", count: 2020 },
  { hour: "14", count: 1960 },
  { hour: "16", count: 2380 },
  { hour: "18", count: 3120 },
  { hour: "20", count: 2540 },
  { hour: "22", count: 1480 },
];

export const severitySplit = [
  { name: "Minor", value: 52, color: "var(--color-chart-5)" },
  { name: "Serious", value: 31, color: "var(--color-chart-1)" },
  { name: "Fatal", value: 11, color: "var(--color-chart-3)" },
  { name: "Unclassified", value: 6, color: "var(--color-chart-2)" },
];

export const causes = [
  { cause: "Over-speeding", share: 34.2, incidents: 16552, trend: 2.1 },
  { cause: "Distracted driving", share: 18.6, incidents: 9001, trend: 4.7 },
  { cause: "Drink driving", share: 12.4, incidents: 6001, trend: -3.2 },
  { cause: "Signal jumping", share: 9.8, incidents: 4742, trend: -1.4 },
  { cause: "Wrong-side driving", share: 8.1, incidents: 3920, trend: 1.2 },
  { cause: "Poor road geometry", share: 6.9, incidents: 3339, trend: -0.8 },
  { cause: "Vehicle defect", share: 5.4, incidents: 2613, trend: -2.6 },
  { cause: "Pedestrian error", share: 4.6, incidents: 2226, trend: 0.4 },
];

export const vehicles = [
  { type: "Two-wheeler", incidents: 19420, fatalityRate: 8.4, share: 40.1 },
  { type: "Car / SUV", incidents: 11180, fatalityRate: 4.1, share: 23.1 },
  { type: "Truck / Lorry", incidents: 7320, fatalityRate: 12.8, share: 15.1 },
  { type: "Bus", incidents: 3860, fatalityRate: 6.2, share: 8.0 },
  { type: "Auto rickshaw", incidents: 3410, fatalityRate: 5.5, share: 7.0 },
  { type: "Bicycle", incidents: 2120, fatalityRate: 9.6, share: 4.4 },
  { type: "Other", incidents: 1082, fatalityRate: 3.2, share: 2.3 },
];

export const weatherConditions = [
  { condition: "Clear", accidents: 26400, severity: 42 },
  { condition: "Rain", accidents: 9840, severity: 68 },
  { condition: "Fog / Mist", accidents: 5120, severity: 81 },
  { condition: "Overcast", accidents: 4210, severity: 51 },
  { condition: "Hail / Storm", accidents: 1620, severity: 74 },
  { condition: "Dust / Haze", accidents: 1202, severity: 59 },
];

export const roadConditions = [
  { surface: "Dry", accidents: 28200, riskIndex: 38 },
  { surface: "Wet", accidents: 10400, riskIndex: 66 },
  { surface: "Potholed", accidents: 4980, riskIndex: 79 },
  { surface: "Under repair", accidents: 2860, riskIndex: 72 },
  { surface: "Loose gravel", accidents: 1952, riskIndex: 61 },
];

export const lightRadar = [
  { factor: "Daylight", risk: 44 },
  { factor: "Dusk", risk: 63 },
  { factor: "Night lit", risk: 58 },
  { factor: "Night unlit", risk: 88 },
  { factor: "Dawn", risk: 52 },
  { factor: "Tunnel", risk: 47 },
];

export const hotspots = [
  { id: "H-104", name: "NH-48 Kherki Flyover", x: 22, y: 30, risk: 94, incidents: 412, kind: "Highway merge" },
  { id: "H-217", name: "Ring Road / Sector 18", x: 47, y: 22, risk: 88, incidents: 356, kind: "Signalised junction" },
  { id: "H-330", name: "Old Port Corridor", x: 71, y: 38, risk: 81, incidents: 298, kind: "Freight route" },
  { id: "H-412", name: "Lakeview Curve", x: 34, y: 58, risk: 76, incidents: 241, kind: "Blind curve" },
  { id: "H-509", name: "Central Rail Underpass", x: 58, y: 67, risk: 71, incidents: 203, kind: "Underpass" },
  { id: "H-611", name: "Airport Link Km-14", x: 82, y: 72, risk: 66, incidents: 178, kind: "Expressway" },
  { id: "H-702", name: "Market Street Crossing", x: 14, y: 76, risk: 59, incidents: 154, kind: "Pedestrian zone" },
];

export const corridorRisk = [
  { corridor: "NH-48 (Km 12–29)", risk: 94, change: 6.2, incidents: 412, status: "Critical" },
  { corridor: "Ring Road East", risk: 88, change: 3.1, incidents: 356, status: "Critical" },
  { corridor: "Port Freight Link", risk: 81, change: -1.8, incidents: 298, status: "High" },
  { corridor: "Lakeview Arterial", risk: 76, change: 2.4, incidents: 241, status: "High" },
  { corridor: "Central Underpass", risk: 71, change: -4.6, incidents: 203, status: "Elevated" },
  { corridor: "Airport Link", risk: 66, change: 0.9, incidents: 178, status: "Elevated" },
];

export const reports = [
  {
    id: "RPT-2041",
    title: "Q4 National Severity Review",
    scope: "48 districts · 12 corridors",
    updated: "2 hours ago",
    format: "PDF",
    status: "Ready",
  },
  {
    id: "RPT-2038",
    title: "Monsoon Road Condition Impact",
    scope: "Weather · surface correlation",
    updated: "Yesterday",
    format: "XLSX",
    status: "Ready",
  },
  {
    id: "RPT-2035",
    title: "Two-wheeler Fatality Deep Dive",
    scope: "Vehicle class analysis",
    updated: "3 days ago",
    format: "PDF",
    status: "Ready",
  },
  {
    id: "RPT-2031",
    title: "Night-time Visibility Audit",
    scope: "Lighting · 214 segments",
    updated: "6 days ago",
    format: "CSV",
    status: "Scheduled",
  },
  {
    id: "RPT-2028",
    title: "Freight Corridor Compliance",
    scope: "Truck routes · 9 states",
    updated: "12 days ago",
    format: "PDF",
    status: "Archived",
  },
];

export const alerts = [
  {
    id: "A-1",
    level: "critical" as const,
    title: "Risk spike on NH-48 Kherki Flyover",
    detail: "18 incidents in 72h · +140% above baseline",
    time: "14 min ago",
  },
  {
    id: "A-2",
    level: "warning" as const,
    title: "Dense fog advisory — Northern belt",
    detail: "Visibility under 80m across 6 corridors",
    time: "1 hr ago",
  },
  {
    id: "A-3",
    level: "info" as const,
    title: "Signal retiming completed",
    detail: "Sector 18 junction · monitoring 14 days",
    time: "5 hrs ago",
  },
];