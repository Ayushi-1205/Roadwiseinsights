// Mock analytics dataset for the Accident Analytics workspace.
// Shape mirrors the eventual API response so it can be swapped 1:1 later.

export type Granularity = "daily" | "monthly" | "yearly";

export type TrendPoint = {
  period: string;
  accidents: number;
  injuries: number;
  fatalities: number;
};

export const trendSeries: Record<Granularity, TrendPoint[]> = {
  daily: [
    { period: "01 Aug", accidents: 148, injuries: 112, fatalities: 9 },
    { period: "02 Aug", accidents: 162, injuries: 124, fatalities: 11 },
    { period: "03 Aug", accidents: 139, injuries: 101, fatalities: 8 },
    { period: "04 Aug", accidents: 171, injuries: 133, fatalities: 12 },
    { period: "05 Aug", accidents: 158, injuries: 119, fatalities: 10 },
    { period: "06 Aug", accidents: 184, injuries: 146, fatalities: 14 },
    { period: "07 Aug", accidents: 196, injuries: 158, fatalities: 15 },
    { period: "08 Aug", accidents: 176, injuries: 138, fatalities: 12 },
    { period: "09 Aug", accidents: 151, injuries: 114, fatalities: 9 },
    { period: "10 Aug", accidents: 143, injuries: 106, fatalities: 8 },
    { period: "11 Aug", accidents: 167, injuries: 128, fatalities: 11 },
    { period: "12 Aug", accidents: 181, injuries: 142, fatalities: 13 },
    { period: "13 Aug", accidents: 189, injuries: 151, fatalities: 14 },
    { period: "14 Aug", accidents: 203, injuries: 164, fatalities: 16 },
  ],
  monthly: [
    { period: "Jan", accidents: 3620, injuries: 2810, fatalities: 258 },
    { period: "Feb", accidents: 3310, injuries: 2560, fatalities: 231 },
    { period: "Mar", accidents: 3980, injuries: 3050, fatalities: 274 },
    { period: "Apr", accidents: 4210, injuries: 3320, fatalities: 289 },
    { period: "May", accidents: 4460, injuries: 3510, fatalities: 301 },
    { period: "Jun", accidents: 4180, injuries: 3260, fatalities: 282 },
    { period: "Jul", accidents: 4540, injuries: 3620, fatalities: 312 },
    { period: "Aug", accidents: 4390, injuries: 3480, fatalities: 296 },
    { period: "Sep", accidents: 4020, injuries: 3140, fatalities: 268 },
    { period: "Oct", accidents: 4310, injuries: 3390, fatalities: 285 },
    { period: "Nov", accidents: 4680, injuries: 3720, fatalities: 318 },
    { period: "Dec", accidents: 4980, injuries: 3910, fatalities: 344 },
  ],
  yearly: [
    { period: "2019", accidents: 51240, injuries: 39810, fatalities: 3612 },
    { period: "2020", accidents: 38960, injuries: 29740, fatalities: 2711 },
    { period: "2021", accidents: 44180, injuries: 34120, fatalities: 3104 },
    { period: "2022", accidents: 49870, injuries: 38660, fatalities: 3428 },
    { period: "2023", accidents: 52310, injuries: 40910, fatalities: 3519 },
    { period: "2024", accidents: 50480, injuries: 39420, fatalities: 3287 },
    { period: "2025", accidents: 48392, injuries: 37860, fatalities: 3118 },
  ],
};

export type DistrictRow = {
  district: string;
  accidents: number;
  share: number;
  change: number;
};

export const districtRanking: DistrictRow[] = [
  { district: "North Gurgaon", accidents: 7420, share: 15.3, change: 6.2 },
  { district: "Central Delhi", accidents: 6810, share: 14.1, change: 3.4 },
  { district: "Noida Sector Belt", accidents: 5940, share: 12.3, change: -2.1 },
  { district: "Port & Freight Zone", accidents: 5210, share: 10.8, change: 4.8 },
  { district: "Lakeview District", accidents: 4380, share: 9.1, change: -1.6 },
  { district: "Airport Link Region", accidents: 3760, share: 7.8, change: 2.2 },
  { district: "Old City West", accidents: 3120, share: 6.4, change: -3.9 },
  { district: "Industrial East", accidents: 2740, share: 5.7, change: 1.1 },
];

export type SeverityRow = {
  name: string;
  incidents: number;
  share: number;
  fatalityRate: number;
  injuryRate: number;
  color: string;
};

export const severityBreakdown: SeverityRow[] = [
  {
    name: "Minor",
    incidents: 25164,
    share: 52.0,
    fatalityRate: 0.2,
    injuryRate: 41.6,
    color: "var(--color-chart-5)",
  },
  {
    name: "Serious",
    incidents: 15002,
    share: 31.0,
    fatalityRate: 3.8,
    injuryRate: 88.4,
    color: "var(--color-chart-1)",
  },
  {
    name: "Fatal",
    incidents: 5323,
    share: 11.0,
    fatalityRate: 100,
    injuryRate: 64.2,
    color: "var(--color-chart-3)",
  },
  {
    name: "Unclassified",
    incidents: 2903,
    share: 6.0,
    fatalityRate: 1.1,
    injuryRate: 22.8,
    color: "var(--color-chart-2)",
  },
];

export type HourRow = { hour: string; accidents: number };

export const hourlyPattern: HourRow[] = [
  { hour: "00:00", accidents: 820 },
  { hour: "01:00", accidents: 690 },
  { hour: "02:00", accidents: 640 },
  { hour: "03:00", accidents: 560 },
  { hour: "04:00", accidents: 510 },
  { hour: "05:00", accidents: 720 },
  { hour: "06:00", accidents: 1180 },
  { hour: "07:00", accidents: 1860 },
  { hour: "08:00", accidents: 2460 },
  { hour: "09:00", accidents: 2210 },
  { hour: "10:00", accidents: 1840 },
  { hour: "11:00", accidents: 1780 },
  { hour: "12:00", accidents: 2020 },
  { hour: "13:00", accidents: 1940 },
  { hour: "14:00", accidents: 1960 },
  { hour: "15:00", accidents: 2080 },
  { hour: "16:00", accidents: 2380 },
  { hour: "17:00", accidents: 2860 },
  { hour: "18:00", accidents: 3120 },
  { hour: "19:00", accidents: 2980 },
  { hour: "20:00", accidents: 2540 },
  { hour: "21:00", accidents: 2110 },
  { hour: "22:00", accidents: 1480 },
  { hour: "23:00", accidents: 1090 },
];

export const HIGH_RISK_HOUR_THRESHOLD = 2400;

export type WeekdayRow = { day: string; short: string; accidents: number; fatalities: number };

export const weekdayPattern: WeekdayRow[] = [
  { day: "Monday", short: "Mon", accidents: 6420, fatalities: 398 },
  { day: "Tuesday", short: "Tue", accidents: 6180, fatalities: 372 },
  { day: "Wednesday", short: "Wed", accidents: 6340, fatalities: 386 },
  { day: "Thursday", short: "Thu", accidents: 6710, fatalities: 411 },
  { day: "Friday", short: "Fri", accidents: 7590, fatalities: 486 },
  { day: "Saturday", short: "Sat", accidents: 8240, fatalities: 552 },
  { day: "Sunday", short: "Sun", accidents: 6912, fatalities: 463 },
];

export type AccidentTypeRow = {
  type: string;
  incidents: number;
  share: number;
  color: string;
};

export const accidentTypes: AccidentTypeRow[] = [
  { type: "Collision", incidents: 17420, share: 36.0, color: "var(--color-chart-1)" },
  { type: "Rear-end collision", incidents: 9680, share: 20.0, color: "var(--color-chart-2)" },
  { type: "Pedestrian accident", incidents: 7742, share: 16.0, color: "var(--color-chart-3)" },
  { type: "Roadside collision", incidents: 5807, share: 12.0, color: "var(--color-chart-4)" },
  { type: "Vehicle rollover", incidents: 4839, share: 10.0, color: "var(--color-chart-5)" },
  { type: "Other", incidents: 2904, share: 6.0, color: "var(--color-muted-foreground)" },
];

export type Insight = {
  id: string;
  tone: "critical" | "warning" | "info" | "positive";
  headline: string;
  detail: string;
  metric: string;
};

export const keyInsights: Insight[] = [
  {
    id: "I-1",
    tone: "critical",
    headline: "Evening hours carry the highest accident exposure",
    detail:
      "17:00–20:00 concentrates 18.6% of all reported incidents, driven by peak commuter density and falling light levels.",
    metric: "+38% vs daily mean",
  },
  {
    id: "I-2",
    tone: "warning",
    headline: "North Gurgaon contributes the largest district share",
    detail:
      "7,420 incidents (15.3% of the network total), with high-speed merges on NH-48 accounting for most serious outcomes.",
    metric: "15.3% share",
  },
  {
    id: "I-3",
    tone: "info",
    headline: "Fatal incidents are rare but disproportionately severe",
    detail:
      "Fatal cases represent only 11% of volume yet drive the majority of the severity index across every monitored corridor.",
    metric: "11% of volume",
  },
  {
    id: "I-4",
    tone: "warning",
    headline: "Weekend risk peaks on Saturday",
    detail:
      "Saturday records 8,240 incidents — 18.3% above the weekday average — with a higher fatality ratio per incident.",
    metric: "8,240 incidents",
  },
  {
    id: "I-5",
    tone: "positive",
    headline: "Overall accident volume is trending down",
    detail:
      "Reported accidents fell 6.4% year-on-year, the third consecutive annual decline since enforcement retiming began.",
    metric: "-6.4% YoY",
  },
];

export const filterOptions = {
  dateRanges: ["Last 30 days", "Last 90 days", "Last 12 months", "Year to date", "All time"],
  districts: ["All districts", ...districtRanking.map((d) => d.district)],
  severities: ["All severities", "Minor", "Serious", "Fatal", "Unclassified"],
  accidentTypes: ["All types", ...accidentTypes.map((t) => t.type)],
};

export const filterDefaults = {
  dateRange: "Last 12 months",
  district: "All districts",
  severity: "All severities",
  accidentType: "All types",
};
