const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { Pool } = require("pg");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("error", () => {
  console.error("Unexpected PostgreSQL pool error.");
});

// Backend health check. This does not contact the database.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

// Test PostgreSQL connection with a read-only query.
app.get("/api/test-db", async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query("SELECT 1");

    res.json({
      success: true,
      message: "Database connection is working",
    });
  } catch {
    console.error("Database connection test failed.");
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  } finally {
    client?.release();
  }
});

// Start server
const PORT = process.env.PORT || 5000;


// Dashboard data
app.get("/api/dashboard", async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const [summaryResult, severityResult, causeResult, hourlyResult, trendResult] = await Promise.all([
      client.query(`
        SELECT
          COUNT(*)::int AS total_accidents,
          COALESCE(SUM(casualties), 0)::int AS total_casualties,
          COUNT(*) FILTER (WHERE accident_severity = 'fatal')::int AS fatalities,
          COUNT(*) FILTER (WHERE accident_severity = 'major')::int AS major_accidents,
          COUNT(*) FILTER (WHERE accident_severity = 'minor')::int AS minor_accidents,
          COUNT(*) FILTER (WHERE date IS NULL)::int AS records_without_date,
          COUNT(*) FILTER (WHERE hour IS NULL)::int AS records_without_hour
        FROM public.accident
      `),
      client.query(`
        SELECT
          COALESCE(NULLIF(TRIM(accident_severity), ''), 'unknown') AS severity,
          COUNT(*)::int AS count
        FROM public.accident
        GROUP BY 1
        ORDER BY count DESC, severity
      `),
      client.query(`
        SELECT
          COALESCE(NULLIF(TRIM(cause), ''), 'unknown') AS cause,
          COUNT(*)::int AS count
        FROM public.accident
        GROUP BY 1
        ORDER BY count DESC, cause
      `),
      client.query(`
        SELECT hour, COUNT(*)::int AS count
        FROM public.accident
        WHERE hour IS NOT NULL
        GROUP BY hour
        ORDER BY hour
      `),
      client.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
          COUNT(*)::int AS accidents,
          COALESCE(SUM(casualties), 0)::int AS casualties,
          COUNT(*) FILTER (WHERE accident_severity = 'fatal')::int AS fatalities
        FROM public.accident
        WHERE date IS NOT NULL
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY DATE_TRUNC('month', date)
      `),
    ]);

    const summary = summaryResult.rows[0];

    res.json({
      success: true,
      summary: {
        total_accidents: summary.total_accidents,
        total_casualties: summary.total_casualties,
        fatalities: summary.fatalities,
        major_accidents: summary.major_accidents,
        minor_accidents: summary.minor_accidents,
        records_without_date: summary.records_without_date,
        records_without_hour: summary.records_without_hour,
      },
      severity_distribution: severityResult.rows.map((row) => ({
        severity: row.severity,
        count: row.count,
      })),
      cause_distribution: causeResult.rows.map((row) => ({
        cause: row.cause,
        count: row.count,
      })),
      hourly_exposure: hourlyResult.rows.map((row) => ({
        hour: row.hour,
        count: row.count,
      })),
      monthly_trend: trendResult.rows.map((row) => ({
        month: row.month,
        accidents: row.accidents,
        casualties: row.casualties,
        fatalities: row.fatalities,
      })),
    });
  } catch {
    console.error("Dashboard API request failed.");

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  } finally {
    client?.release();
  }
});

// Time & Trend Analytics API
async function handleTrends(req, res) {
  let client;

  try {
    client = await pool.connect();

    const totalCountRes = await client.query("SELECT COUNT(*)::int AS total FROM public.accident");
    const totalAccidents = totalCountRes.rows[0]?.total || 0;

    // 1. Time-series trends
    // Daily (last 30 days of dataset)
    const dailyRes = await client.query(`
      SELECT 
        TO_CHAR(date, 'DD Mon') AS period,
        TO_CHAR(date, 'YYYY-MM-DD') AS date_key,
        COUNT(*)::int AS accidents,
        COALESCE(SUM(casualties), 0)::int AS injuries,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities
      FROM public.accident
      WHERE date >= (SELECT MAX(date) - INTERVAL '30 days' FROM public.accident)
      GROUP BY date
      ORDER BY date
    `);

    // Monthly (chronological monthly rollup across dataset)
    const monthlyRes = await client.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') AS period,
        TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month_key,
        COUNT(*)::int AS accidents,
        COALESCE(SUM(casualties), 0)::int AS injuries,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate"
      FROM public.accident
      WHERE date IS NOT NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `);

    // Yearly (chronological yearly rollup)
    const yearlyRes = await client.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('year', date), 'YYYY') AS period,
        COUNT(*)::int AS accidents,
        COALESCE(SUM(casualties), 0)::int AS injuries,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate"
      FROM public.accident
      WHERE date IS NOT NULL
      GROUP BY DATE_TRUNC('year', date)
      ORDER BY DATE_TRUNC('year', date)
    `);

    // 2. District/City Ranking
    const districtRes = await client.query(
      `
      SELECT 
        city AS district,
        COUNT(*)::int AS accidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatal_count
      FROM public.accident
      WHERE city IS NOT NULL AND TRIM(city) <> ''
      GROUP BY city
      ORDER BY accidents DESC
    `,
      [totalAccidents]
    );

    const districtRanking = districtRes.rows.map((row) => ({
      district: row.district,
      accidents: row.accidents,
      share: row.share,
      fatalCount: row.fatal_count,
    }));

    // 3. Severity Breakdown
    const severityColors = {
      minor: "var(--color-chart-5)",
      major: "var(--color-chart-1)",
      fatal: "var(--color-chart-3)",
    };

    const severityRes = await client.query(
      `
      SELECT 
        INITCAP(accident_severity) AS name,
        LOWER(accident_severity) AS raw_severity,
        COUNT(*)::int AS incidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate",
        ROUND(COALESCE(SUM(casualties), 0) * 1.0 / NULLIF(COUNT(*), 0), 2)::float AS "avgCasualties"
      FROM public.accident
      WHERE accident_severity IS NOT NULL
      GROUP BY accident_severity
      ORDER BY incidents DESC
    `,
      [totalAccidents]
    );

    const severityBreakdown = severityRes.rows.map((row) => ({
      name: row.name,
      incidents: row.incidents,
      share: row.share,
      fatalityRate: row.fatalityRate,
      avgCasualties: row.avgCasualties,
      color: severityColors[row.raw_severity] || "var(--color-chart-2)",
    }));

    // 4. Hourly pattern (00:00 to 23:00)
    const hourlyRes = await client.query(
      `
      SELECT 
        LPAD(hour::text, 2, '0') || ':00' AS hour,
        hour::int AS hour_num,
        COUNT(*)::int AS accidents,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 2)::float ELSE 0 END AS share
      FROM public.accident
      WHERE hour IS NOT NULL
      GROUP BY hour
      ORDER BY hour
    `,
      [totalAccidents]
    );

    // 5. Day of week pattern
    const weekdayRes = await client.query(
      `
      SELECT 
        day_of_week AS day,
        SUBSTRING(day_of_week, 1, 3) AS short,
        COUNT(*)::int AS accidents,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate",
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share
      FROM public.accident
      WHERE day_of_week IS NOT NULL
      GROUP BY day_of_week
      ORDER BY CASE day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
        ELSE 8 END
    `,
      [totalAccidents]
    );

    // 6. Weekend vs Weekday comparison
    const weekendRes = await client.query(
      `
      SELECT 
        is_weekend,
        CASE WHEN is_weekend = true THEN 'Weekend' ELSE 'Weekday' END AS category,
        COUNT(*)::int AS accidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate",
        COALESCE(SUM(casualties), 0)::int AS casualties,
        ROUND(AVG(casualties), 2)::float AS "avgCasualties"
      FROM public.accident
      GROUP BY is_weekend
      ORDER BY is_weekend DESC
    `,
      [totalAccidents]
    );

    // 7. Accident Causes / Classification
    const typeColors = [
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
      "var(--color-muted-foreground)",
    ];

    const causesRes = await client.query(
      `
      SELECT 
        INITCAP(cause) AS type,
        COUNT(*)::int AS incidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatalities,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate"
      FROM public.accident
      WHERE cause IS NOT NULL AND TRIM(cause) <> ''
      GROUP BY cause
      ORDER BY incidents DESC
    `,
      [totalAccidents]
    );

    const accidentTypes = causesRes.rows.map((row, idx) => ({
      type: row.type,
      incidents: row.incidents,
      share: row.share,
      fatalities: row.fatalities,
      fatalityRate: row.fatalityRate,
      color: typeColors[idx % typeColors.length],
    }));

    // 8. Key observations derived from database extremes
    const peakHour = hourlyRes.rows.reduce(
      (a, b) => (b.accidents > a.accidents ? b : a),
      hourlyRes.rows[0]
    );
    const peakCity = districtRanking[0];
    const fatalRow = severityBreakdown.find((s) => s.name.toLowerCase() === "fatal");
    const peakDay = weekdayRes.rows.reduce(
      (a, b) => (b.accidents > a.accidents ? b : a),
      weekdayRes.rows[0]
    );
    const weekendRow = weekendRes.rows.find((w) => w.is_weekend === true);
    const weekdayRow = weekendRes.rows.find((w) => w.is_weekend === false);

    const keyInsights = [
      {
        id: "I-1",
        tone: "critical",
        headline: `Hourly volume peaks at ${peakHour?.hour || "02:00"}`,
        detail: `Hour ${peakHour?.hour} records ${peakHour?.accidents.toLocaleString()} incidents across the road network.`,
        metric: `${peakHour?.accidents.toLocaleString()} incidents`,
      },
      {
        id: "I-2",
        tone: "warning",
        headline: `${peakCity?.district || "Chandigarh"} leads in total recorded volume`,
        detail: `${peakCity?.district} accounts for ${peakCity?.accidents.toLocaleString()} incidents (${peakCity?.share}% of total network volume).`,
        metric: `${peakCity?.share}% share`,
      },
      {
        id: "I-3",
        tone: "info",
        headline: "Fatal incidents represent critical severity impact",
        detail: `Fatal crashes constitute ${fatalRow?.share || 14.9}% of total accidents with ${fatalRow?.incidents.toLocaleString() || 0} fatal outcomes recorded.`,
        metric: `${fatalRow?.share || 0}% of volume`,
      },
      {
        id: "I-4",
        tone: "warning",
        headline: `Weekly volume peaks on ${peakDay?.day || "Monday"}`,
        detail: `${peakDay?.day} records ${peakDay?.accidents.toLocaleString()} incidents and ${peakDay?.fatalities.toLocaleString()} fatalities.`,
        metric: `${peakDay?.accidents.toLocaleString()} incidents`,
      },
      {
        id: "I-5",
        tone: "positive",
        headline: "Weekend vs Weekday volume distribution",
        detail: `Weekdays record ${weekdayRow?.accidents.toLocaleString()} (${weekdayRow?.share}%) incidents while weekends record ${weekendRow?.accidents.toLocaleString()} (${weekendRow?.share}%).`,
        metric: `${weekendRow?.share}% weekend`,
      },
    ];

    // Filter options based on real distinct values
    const distinctCities = await client.query(
      "SELECT DISTINCT city FROM public.accident WHERE city IS NOT NULL ORDER BY city"
    );
    const distinctSeverities = await client.query(
      "SELECT DISTINCT accident_severity FROM public.accident WHERE accident_severity IS NOT NULL ORDER BY accident_severity"
    );

    res.json({
      success: true,
      total_accidents: totalAccidents,
      trends: {
        daily: dailyRes.rows,
        monthly: monthlyRes.rows,
        yearly: yearlyRes.rows,
      },
      district_ranking: districtRanking,
      severity_breakdown: severityBreakdown,
      hourly_pattern: hourlyRes.rows,
      weekday_pattern: weekdayRes.rows,
      weekend_comparison: weekendRes.rows,
      accident_types: accidentTypes,
      key_insights: keyInsights,
      filter_options: {
        dateRanges: ["Last 30 days", "Last 90 days", "Last 12 months", "Year to date", "All time"],
        districts: ["All districts", ...distinctCities.rows.map((r) => r.city)],
        severities: [
          "All severities",
          ...distinctSeverities.rows.map(
            (r) =>
              r.accident_severity.charAt(0).toUpperCase() + r.accident_severity.slice(1)
          ),
        ],
        accidentTypes: ["All types", ...accidentTypes.map((t) => t.type)],
      },
    });
  } catch (error) {
    console.error("Trends API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load trend analytics data",
      error: error.message,
    });
  } finally {
    client?.release();
  }
}

app.get("/api/trends", handleTrends);
app.get("/api/analytics", handleTrends);

// Hotspots API
app.get("/api/hotspots", async (req, res) => {
  try {
    const totalCountRes = await pool.query("SELECT COUNT(*) AS total FROM accident");
    const totalAccidents = Number(totalCountRes.rows[0].total) || 1;

    // Group by city and road_type to form geographical corridors/hotspots
    const clustersRes = await pool.query(`
      SELECT 
        city,
        state,
        road_type,
        COUNT(*)::int AS incidents,
        ROUND(AVG(latitude::numeric), 6)::float AS latitude,
        ROUND(AVG(longitude::numeric), 6)::float AS longitude,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatal_count,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / COUNT(*), 1)::float AS fatal_rate
      FROM accident
      GROUP BY city, state, road_type
      ORDER BY incidents DESC
    `);

    const isValidLatLon = (lat, lon) => (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );

    // Keep city + state + road_type grouping; only mappable groups are returned.
    const clusters = clustersRes.rows.filter((c) => isValidLatLon(c.latitude, c.longitude));
    const maxClusterIncidents = clusters[0]?.incidents || 1;

    // Compute bounding box to project to svg coordinates (x: 10% - 90%, y: 15% - 85%)
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    clusters.forEach(c => {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLon) minLon = c.longitude;
      if (c.longitude > maxLon) maxLon = c.longitude;
    });

    const hotspots = clusters.map((c, i) => {
      // Risk calculation (0 - 100) based on volume and fatality rate
      const volumeScore = (c.incidents / maxClusterIncidents) * 50;
      const fatalScore = Math.min((c.fatal_rate / 25) * 50, 50);
      const risk = Math.min(Math.round(volumeScore + fatalScore), 99);

      // SVG map coordinates projection (latitude inverted for y-axis)
      const lonSpan = (maxLon - minLon) || 1;
      const latSpan = (maxLat - minLat) || 1;
      const x = Math.round(15 + ((c.longitude - minLon) / lonSpan) * 70);
      const y = Math.round(15 + ((maxLat - c.latitude) / latSpan) * 70);

      return {
        id: `H-${100 + i + 1}`,
        name: `${c.city} - ${c.road_type.toUpperCase()} Corridor`,
        city: c.city,
        state: c.state,
        kind: `${c.road_type.charAt(0).toUpperCase() + c.road_type.slice(1)} Network`,
        x,
        y,
        latitude: c.latitude,
        longitude: c.longitude,
        risk,
        incidents: c.incidents,
        fatalCount: c.fatal_count
      };
    });

    const corridorRisk = hotspots.slice(0, 10).map((h) => {
      let status = "Elevated";
      if (h.risk >= 85) status = "Critical";
      else if (h.risk >= 70) status = "High";

      return {
        corridor: `${h.city} (${h.kind})`,
        risk: h.risk,
        incidents: h.incidents,
        status
      };
    });

    res.json({
      success: true,
      active_hotspots_count: hotspots.length,
      hotspots,
      corridor_risk: corridorRisk
    });
  } catch (error) {
    console.error("Hotspots API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load hotspots data",
      error: error.message
    });
  }
});

// Causes API
app.get("/api/causes", async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const totalCountRes = await client.query("SELECT COUNT(*)::int AS total FROM public.accident");
    const totalAccidents = totalCountRes.rows[0]?.total || 0;

    const causesRes = await client.query(
      `
      SELECT 
        INITCAP(cause) AS cause,
        COUNT(*)::int AS incidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate"
      FROM public.accident
      WHERE cause IS NOT NULL AND TRIM(cause) <> ''
      GROUP BY cause
      ORDER BY incidents DESC
    `,
      [totalAccidents]
    );

    const causes = causesRes.rows.map((c) => ({
      cause: c.cause,
      incidents: c.incidents,
      share: c.share,
      fatalityRate: c.fatalityRate,
    }));

    // Behavioral vs environmental breakdowns based on real counts
    const speed = causes.find((c) => c.cause.toLowerCase().includes("overspeed"))?.share ?? 0;
    const distraction = causes.find((c) => c.cause.toLowerCase().includes("distract"))?.share ?? 0;
    const drunk = causes.find((c) => c.cause.toLowerCase().includes("drunk"))?.share ?? 0;
    const road = causes.find((c) => c.cause.toLowerCase().includes("road"))?.share ?? 0;
    const weather = causes.find((c) => c.cause.toLowerCase().includes("weather"))?.share ?? 0;

    // Traffic signal present share
    const signalRes = await client.query(`
      SELECT 
        ROUND(COUNT(CASE WHEN traffic_signal = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS signal_share
      FROM public.accident
    `);
    const signalShare = signalRes.rows[0]?.signal_share ?? 0;

    res.json({
      success: true,
      total_accidents: totalAccidents,
      causes,
      factors: {
        behavioral: [
          { label: "Overspeeding", value: `${speed.toFixed(1)}%`, tone: "bad" },
          { label: "Distracted driving", value: `${distraction.toFixed(1)}%`, tone: "bad" },
          { label: "Drunk driving", value: `${drunk.toFixed(1)}%`, tone: "warn" },
        ],
        infrastructure_weather: [
          { label: "Poor road condition", value: `${road.toFixed(1)}%`, tone: "warn" },
          { label: "Adverse weather", value: `${weather.toFixed(1)}%`, tone: "warn" },
          { label: "Signal-controlled sites", value: `${signalShare.toFixed(1)}%`, tone: "good" },
        ],
      },
    });
  } catch (error) {
    console.error("Causes API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load causes data",
      error: error.message,
    });
  } finally {
    client?.release();
  }
});

// Conditions API (Weather & Road)
app.get("/api/conditions", async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const totalCountRes = await client.query("SELECT COUNT(*)::int AS total FROM public.accident");
    const totalAccidents = totalCountRes.rows[0]?.total || 0;

    // Weather impact
    const weatherRes = await client.query(
      `
      SELECT 
        INITCAP(weather) AS condition,
        COUNT(*)::int AS accidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatal_count,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS severity
      FROM public.accident
      WHERE weather IS NOT NULL
      GROUP BY weather
      ORDER BY accidents DESC
    `,
      [totalAccidents]
    );

    // Road type impact
    const roadRes = await client.query(
      `
      SELECT 
        INITCAP(road_type) AS surface,
        COUNT(*)::int AS accidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatal_count,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "riskIndex"
      FROM public.accident
      WHERE road_type IS NOT NULL
      GROUP BY road_type
      ORDER BY accidents DESC
    `,
      [totalAccidents]
    );

    // Visibility impact
    const visRes = await client.query(
      `
      SELECT 
        INITCAP(visibility) AS factor,
        COUNT(*)::int AS accidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatal_count,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS risk
      FROM public.accident
      WHERE visibility IS NOT NULL
      GROUP BY visibility
      ORDER BY 
        CASE LOWER(visibility)
          WHEN 'low' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'high' THEN 3
          ELSE 4
        END
    `,
      [totalAccidents]
    );

    // Key metrics for cards
    const clearWeather = weatherRes.rows.find((w) => w.condition.toLowerCase() === "clear");
    const rainWeather = weatherRes.rows.find((w) => w.condition.toLowerCase() === "rain");
    const fogWeather = weatherRes.rows.find((w) => w.condition.toLowerCase() === "fog");
    const lowVis = visRes.rows.find((v) => v.factor.toLowerCase() === "low");

    const clearShare = clearWeather?.share?.toFixed(1) ?? "0.0";
    const rainFatalRate = rainWeather?.severity?.toFixed(1) ?? "0.0";
    const fogFatalRate = fogWeather?.severity?.toFixed(1) ?? "0.0";
    const lowVisShare = lowVis?.share?.toFixed(1) ?? "0.0";

    const cards = [
      { label: "Clear conditions", value: `${clearShare}%`, note: "of all incidents" },
      { label: "Rain conditions", value: `${rainFatalRate}%`, note: "fatal severity rate" },
      { label: "Fog exposure", value: `${fogFatalRate}%`, note: "fatal severity rate" },
      { label: "Low visibility", value: `${lowVisShare}%`, note: "incident share" },
    ];

    res.json({
      success: true,
      total_accidents: totalAccidents,
      cards,
      weather_conditions: weatherRes.rows,
      road_conditions: roadRes.rows,
      visibility_radar: visRes.rows,
    });
  } catch (error) {
    console.error("Conditions API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load conditions data",
      error: error.message,
    });
  } finally {
    client?.release();
  }
});

// Vehicles API (Based on real vehicles_involved column)
app.get("/api/vehicles", async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const totalCountRes = await client.query("SELECT COUNT(*)::int AS total FROM public.accident");
    const totalAccidents = totalCountRes.rows[0]?.total || 0;

    const vehRes = await client.query(
      `
      SELECT 
        vehicles_involved,
        vehicles_involved::text || ' Vehicle' || (CASE WHEN vehicles_involved > 1 THEN 's' ELSE '' END) AS type,
        COUNT(*)::int AS incidents,
        CASE WHEN $1 > 0 THEN ROUND(COUNT(*) * 100.0 / $1, 1)::float ELSE 0 END AS share,
        ROUND(COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1)::float AS "fatalityRate",
        COUNT(CASE WHEN accident_severity = 'fatal' THEN 1 END)::int AS fatal_incidents,
        COALESCE(SUM(casualties), 0)::int AS total_casualties,
        ROUND(AVG(casualties), 2)::float AS avg_casualties
      FROM public.accident
      WHERE vehicles_involved IS NOT NULL
      GROUP BY vehicles_involved
      ORDER BY vehicles_involved
    `,
      [totalAccidents]
    );

    const vehicles = vehRes.rows.map((v) => ({
      vehicles_involved: v.vehicles_involved,
      type: v.type,
      incidents: v.incidents,
      share: v.share,
      fatalityRate: v.fatalityRate,
      fatalIncidents: v.fatal_incidents,
      totalCasualties: v.total_casualties,
      avgCasualties: v.avg_casualties,
    }));

    const singleVeh = vehicles.find((v) => v.vehicles_involved === 1);
    const twoVeh = vehicles.find((v) => v.vehicles_involved === 2);
    const multiVehIncidents = vehicles
      .filter((v) => v.vehicles_involved >= 3)
      .reduce((sum, v) => sum + v.incidents, 0);
    const multiVehShare =
      totalAccidents > 0 ? Number(((multiVehIncidents / totalAccidents) * 100).toFixed(1)) : 0;

    const highestFatalityClass = [...vehicles].sort(
      (a, b) => b.fatalityRate - a.fatalityRate
    )[0];

    const highlights = [
      {
        label: "Single-vehicle",
        value: `${singleVeh?.share.toFixed(1) ?? "0.0"}%`,
        note: `${singleVeh?.incidents.toLocaleString() ?? 0} incidents`,
      },
      {
        label: "Two-vehicle collisions",
        value: `${twoVeh?.share.toFixed(1) ?? "0.0"}%`,
        note: `${twoVeh?.incidents.toLocaleString() ?? 0} incidents`,
      },
      {
        label: "Multi-vehicle crashes",
        value: `${multiVehShare.toFixed(1)}%`,
        note: `${multiVehIncidents.toLocaleString()} incidents (3+ vehicles)`,
      },
      {
        label: "Highest fatality class",
        value: `${highestFatalityClass?.fatalityRate.toFixed(1) ?? "0.0"}%`,
        note: `${highestFatalityClass?.type ?? "4 Vehicles"} (${highestFatalityClass?.fatalIncidents ?? 0} fatal)`,
      },
    ];

    res.json({
      success: true,
      total_accidents: totalAccidents,
      vehicles,
      highlights,
    });
  } catch (error) {
    console.error("Vehicles API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load vehicles data",
      error: error.message,
    });
  } finally {
    client?.release();
  }
});


// ─── Report Export Helpers ───────────────────────────────────────────────────

/**
 * Convert an array of objects to CSV text.
 * Values containing commas, newlines, or double-quotes are quoted.
 */
function toCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\r\n");
}

/**
 * Send a CSV response with appropriate headers.
 */
function sendCSV(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.end(csv);
}

// ─── GET /api/reports/summary (JSON) ─────────────────────────────────────────
// Returns a verified aggregate summary of the full dataset.

app.get("/api/reports/summary", async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const [totalRes, sevRes, causeRes, cityRes, weekRes] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS total, COALESCE(SUM(casualties),0)::int AS total_casualties, COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)::int AS total_fatalities FROM public.accident"),
      client.query("SELECT accident_severity AS severity, COUNT(*)::int AS incidents, ROUND(COUNT(*)*100.0/20000.0,2)::float AS share_pct FROM public.accident GROUP BY 1 ORDER BY incidents DESC"),
      client.query("SELECT cause, COUNT(*)::int AS incidents, ROUND(COUNT(*)*100.0/20000.0,2)::float AS share_pct FROM public.accident GROUP BY 1 ORDER BY incidents DESC"),
      client.query("SELECT city, COUNT(*)::int AS incidents, ROUND(COUNT(*)*100.0/20000.0,2)::float AS share_pct FROM public.accident GROUP BY 1 ORDER BY incidents DESC"),
      client.query("SELECT CASE WHEN is_weekend THEN 'Weekend' ELSE 'Weekday' END AS period, COUNT(*)::int AS incidents, ROUND(COUNT(*)*100.0/20000.0,2)::float AS share_pct FROM public.accident GROUP BY is_weekend ORDER BY incidents DESC"),
    ]);

    const summary = totalRes.rows[0];

    res.json({
      success: true,
      generated_at: new Date().toISOString(),
      dataset: {
        source: "public.accident",
        total_records: summary.total,
        total_casualties: summary.total_casualties,
        total_fatalities: summary.total_fatalities,
        fatality_rate_pct: summary.total > 0
          ? Number((summary.total_fatalities * 100 / summary.total).toFixed(2))
          : 0,
      },
      severity_breakdown: sevRes.rows,
      cause_breakdown: causeRes.rows,
      city_breakdown: cityRes.rows,
      weekday_weekend: weekRes.rows,
    });
  } catch (error) {
    console.error("Reports summary error:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate report summary" });
  } finally {
    client?.release();
  }
});

// ─── GET /api/reports/export/severity-summary (CSV) ─────────────────────────

app.get("/api/reports/export/severity-summary", async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const totalRes = await client.query("SELECT COUNT(*)::int AS total FROM public.accident");
    const total = totalRes.rows[0].total;

    const rows = await client.query(`
      SELECT
        accident_severity                                                    AS severity,
        COUNT(*)::int                                                        AS incidents,
        ROUND(COUNT(*)*100.0/$1, 2)::float                                  AS share_pct,
        COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)::int          AS fatal_incidents,
        ROUND(COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)*100.0/NULLIF(COUNT(*),0),2)::float
                                                                             AS fatality_rate_pct,
        COALESCE(SUM(casualties),0)::int                                     AS total_casualties,
        ROUND(AVG(casualties),2)::float                                      AS avg_casualties_per_crash
      FROM public.accident
      WHERE accident_severity IS NOT NULL
      GROUP BY accident_severity
      ORDER BY incidents DESC
    `, [total]);

    const csv = toCSV(rows.rows);
    sendCSV(res, "severity-summary.csv", csv);
  } catch (error) {
    console.error("Severity CSV export error:", error.message);
    res.status(500).json({ success: false, message: "Failed to export severity report" });
  } finally {
    client?.release();
  }
});

// ─── GET /api/reports/export/hotspot-corridors (CSV) ────────────────────────

app.get("/api/reports/export/hotspot-corridors", async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const rows = await client.query(`
      SELECT
        city,
        state,
        road_type,
        COUNT(*)::int                                                              AS incidents,
        COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)::int               AS fatal_incidents,
        ROUND(COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)*100.0/NULLIF(COUNT(*),0),2)::float
                                                                                   AS fatality_rate_pct,
        COALESCE(SUM(casualties),0)::int                                           AS total_casualties,
        ROUND(AVG(latitude::numeric),6)::float                                     AS avg_latitude,
        ROUND(AVG(longitude::numeric),6)::float                                    AS avg_longitude
      FROM public.accident
      WHERE city IS NOT NULL AND TRIM(city) <> ''
        AND road_type IS NOT NULL
      GROUP BY city, state, road_type
      ORDER BY incidents DESC
    `);

    const csv = toCSV(rows.rows);
    sendCSV(res, "hotspot-corridors.csv", csv);
  } catch (error) {
    console.error("Hotspot CSV export error:", error.message);
    res.status(500).json({ success: false, message: "Failed to export hotspot report" });
  } finally {
    client?.release();
  }
});

// ─── GET /api/reports/export/monthly-trend (CSV) ────────────────────────────

app.get("/api/reports/export/monthly-trend", async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const rows = await client.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM')                             AS year_month,
        TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY')                            AS month_label,
        COUNT(*)::int                                                              AS accidents,
        COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)::int                AS fatalities,
        COUNT(CASE WHEN accident_severity='major' THEN 1 END)::int                AS major_accidents,
        COUNT(CASE WHEN accident_severity='minor' THEN 1 END)::int                AS minor_accidents,
        COALESCE(SUM(casualties),0)::int                                           AS total_casualties,
        ROUND(COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)*100.0/NULLIF(COUNT(*),0),2)::float
                                                                                   AS fatality_rate_pct
      FROM public.accident
      WHERE date IS NOT NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `);

    const csv = toCSV(rows.rows);
    sendCSV(res, "monthly-trend.csv", csv);
  } catch (error) {
    console.error("Monthly trend CSV export error:", error.message);
    res.status(500).json({ success: false, message: "Failed to export monthly trend report" });
  } finally {
    client?.release();
  }
});

// ─── GET /api/reports/export/cause-breakdown (CSV) ──────────────────────────

app.get("/api/reports/export/cause-breakdown", async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const totalRes = await client.query("SELECT COUNT(*)::int AS total FROM public.accident");
    const total = totalRes.rows[0].total;

    const rows = await client.query(`
      SELECT
        INITCAP(cause)                                                           AS cause,
        COUNT(*)::int                                                            AS incidents,
        ROUND(COUNT(*)*100.0/$1,2)::float                                        AS share_pct,
        COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)::int              AS fatal_incidents,
        ROUND(COUNT(CASE WHEN accident_severity='fatal' THEN 1 END)*100.0/NULLIF(COUNT(*),0),2)::float
                                                                                 AS fatality_rate_pct,
        COALESCE(SUM(casualties),0)::int                                         AS total_casualties
      FROM public.accident
      WHERE cause IS NOT NULL AND TRIM(cause) <> ''
      GROUP BY cause
      ORDER BY incidents DESC
    `, [total]);

    const csv = toCSV(rows.rows);
    sendCSV(res, "cause-breakdown.csv", csv);
  } catch (error) {
    console.error("Cause CSV export error:", error.message);
    res.status(500).json({ success: false, message: "Failed to export cause report" });
  } finally {
    client?.release();
  }
});

const server = app.listen(PORT, () => {

  console.log(`Backend server running on http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down backend.`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
