import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { getAnalytics } from "../services/analyticsService";
import type { AnalyticsPayload } from "../interfaces";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const STATUS_ORDER = ["new", "investigating", "contained", "eradicated", "recovering", "closed"] as const;
const STATUS_LABELS: Record<string, string> = {
  new: "New",
  investigating: "Investigating",
  contained: "Contained",
  eradicated: "Eradicated",
  recovering: "Recovering",
  closed: "Closed",
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

function formatHours(hours: number): string {
  if (hours <= 0) return "0h";
  return `${hours.toFixed(1)}h`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "#0a1628", border: `1px solid ${BORDER}` }}>
      <p className="text-slate-400 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.stroke }}>{p.name}: <span className="text-white font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    getAnalytics()
      .then(payload => {
        if (!active) return;
        setData(payload);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load analytics from the server.");
        setData(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const overview = data?.overview;
  const analytics = data?.incidentAnalytics;

  const trendData = useMemo(
    () => analytics?.monthlyTrend ?? [],
    [analytics],
  );

  const responseTimeData = useMemo(
    () => analytics?.performanceTrend.map(point => ({
      month: point.month,
      response: point.responseMinutes,
      resolution: point.resolutionHours,
    })) ?? [],
    [analytics],
  );

  const severityDist = useMemo(
    () => Object.entries(analytics?.bySeverity ?? {}).map(([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[normalizeKey(name)] ?? "#64748b",
    })),
    [analytics],
  );

  const categoryData = useMemo(
    () => Object.entries(analytics?.byCategory ?? {}).map(([name, count], index) => ({
      name,
      count,
      color: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#64748b"][index % 7],
    })),
    [analytics],
  );

  const lifecycleCounts = useMemo(
    () => STATUS_ORDER.map(status => {
      const label = STATUS_LABELS[status] ?? status;
      return analytics?.byStatus[label] ?? analytics?.byStatus[status] ?? 0;
    }),
    [analytics],
  );

  const maxLifecycleCount = Math.max(...lifecycleCounts, 1);
  const maxSeverityCount = Math.max(...severityDist.map(item => item.value), 1);

  const cards = [
    { icon: AlertTriangle, label: "Total Incidents YTD", value: String(overview?.totalIncidents ?? 0), sub: `${overview?.criticalIncidents ?? 0} critical`, color: "#f59e0b" },
    { icon: Clock, label: "Avg Response Time", value: formatMinutes(overview?.averageResponseMinutes ?? 0), sub: "From report to first assignment", color: "#3b82f6" },
    { icon: TrendingUp, label: "Avg Resolution Time", value: formatHours(overview?.averageResolutionHours ?? 0), sub: "From report to resolution", color: "#8b5cf6" },
    { icon: CheckCircle2, label: "Resolution Rate", value: `${(overview?.resolutionRate ?? 0).toFixed(1)}%`, sub: `${overview?.resolvedIncidents ?? 0} resolved incidents`, color: "#10b981" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Security metrics, trends, and performance KPIs</p>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm text-red-200" style={{ background: "rgba(127,29,29,0.35)", border: "1px solid rgba(239,68,68,0.35)" }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-xl p-5 text-slate-400 text-sm" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          Loading real analytics from the database...
        </div>
      ) : null}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl p-5 relative overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10" style={{ background: k.color }} />
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${k.color}18`, border: `1px solid ${k.color}30` }}>
                <Icon className="h-4 w-4" style={{ color: k.color }} />
              </div>
              <p className="text-3xl font-bold text-white">{k.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{k.label}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: k.color }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Incident Trend */}
      <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <h2 className="text-white font-semibold text-sm mb-1">Incident Trends</h2>
        <p className="text-slate-400 text-xs mb-5">Monthly incident volume, resolved cases, and critical incidents</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              {[{ id: "inc", color: "#3b82f6" }, { id: "res", color: "#10b981" }].map(g => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={g.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,60,100,0.25)" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "12px" }} />
            <Area type="monotone" dataKey="incidents" name="Total Incidents" stroke="#3b82f6" fill="url(#inc)" strokeWidth={2} />
            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#res)" strokeWidth={2} />
            <Line type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "#ef4444", r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row: Severity + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity */}
        <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h2 className="text-white font-semibold text-sm mb-1">Severity Breakdown</h2>
          <p className="text-slate-400 text-xs mb-4">Distribution of all incidents by severity</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={severityDist} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {severityDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {severityDist.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-300 text-xs">{s.name}</span>
                    </div>
                    <span className="text-white text-xs font-bold">{s.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((s.value / maxSeverityCount) * 100, 6)}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h2 className="text-white font-semibold text-sm mb-1">Category Breakdown</h2>
          <p className="text-slate-400 text-xs mb-4">Incidents by attack type</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={categoryData} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,60,100,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response + Resolution Time */}
      <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <h2 className="text-white font-semibold text-sm mb-1">Response & Resolution Performance</h2>
        <p className="text-slate-400 text-xs mb-5">Average response time (minutes) and resolution time (hours)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={responseTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,60,100,0.25)" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "12px" }} />
            <Line yAxisId="left" type="monotone" dataKey="response" name="Avg Response (min)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="resolution" name="Avg Resolution (hrs)" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ticket Lifecycle */}
      <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <h2 className="text-white font-semibold text-sm mb-1">Ticket Lifecycle Distribution</h2>
        <p className="text-slate-400 text-xs mb-5">Current ticket count at each lifecycle stage</p>
        <div className="flex items-end justify-between gap-4">
          {STATUS_ORDER.map((s, i) => {
            const count = lifecycleCounts[i] ?? 0;
            const colors = ["#3b82f6", "#06b6d4", "#8b5cf6", "#eab308", "#10b981", "#64748b"];
            const color = colors[i] ?? "#64748b";
            const pct = Math.max((count / maxLifecycleCount) * 100, 10);
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-white font-bold text-sm">{count}</span>
                <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}px`, background: `${color}`, minHeight: "10px", maxHeight: "80px" }} />
                <div className="flex flex-col items-center">
                  {i < STATUS_ORDER.length - 1 && (
                    <div className="text-slate-600 text-xs mb-1">→</div>
                  )}
                  <span className="text-xs text-center whitespace-nowrap" style={{ color }}>{STATUS_LABELS[s]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
