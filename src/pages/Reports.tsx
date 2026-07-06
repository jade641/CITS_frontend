import { useEffect, useMemo, useState } from "react";
import { FileText, Download, Filter, ChevronDown, BarChart2, CheckCircle2, Calendar, Shield } from "lucide-react";
import { severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { listIncidents } from "../services/incidentService";
import { getLookups } from "../services/lookupService";
import type { Incident, IncidentStatus, SeverityLevel } from "../interfaces/incident";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const REPORT_TYPES = [
  { id: "incident", label: "Incident Report", icon: Shield, color: "#3b82f6", desc: "Full details of all incidents within the selected period" },
  { id: "severity", label: "Severity Report", icon: Filter, color: "#ef4444", desc: "Breakdown of incidents by severity level" },
  { id: "monthly", label: "Monthly Summary", icon: Calendar, color: "#8b5cf6", desc: "Monthly overview of incidents, trends, and KPIs" },
  { id: "resolution", label: "Resolution Report", icon: CheckCircle2, color: "#10b981", desc: "Analysis of resolution times and outcomes" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("incident");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | "all">("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [reportIncidents, setReportIncidents] = useState<Incident[]>([]);
  const [incidentStatuses, setIncidentStatuses] = useState<IncidentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getLookups().then((data) => {
      if (!active) return;
      setIncidentStatuses(data.incidentStatuses);
    }).catch(() => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedStatusId = incidentStatuses.find((status) => status.slug === filterStatus)?.id ?? "";

  const reportRows = useMemo(() => reportIncidents.map((incident) => ({
    id: incident.id,
    ticketNumber: incident.ticket_number,
    title: incident.title,
    category: incident.category?.name ?? "—",
    severity: incident.severity,
    statusSlug: incident.status?.slug ?? "unknown",
    statusLabel: incident.status?.name ?? statusLabel(incident.status?.slug ?? "unknown"),
    reportedAt: incident.reported_at ? new Date(incident.reported_at).toLocaleString() : "—",
    assignedTo: incident.current_assignee?.name ?? "—",
    resolvedAt: incident.resolved_at,
    reportedAtIso: incident.reported_at,
  })), [reportIncidents]);

  const handleExport = (format: string) => {
    setExporting(format);
    setTimeout(() => setExporting(null), 1500);
  };

  const resolved = reportRows.filter((t) => t.statusSlug === "resolved" || t.statusSlug === "closed");
  const avgResolution = useMemo(() => {
    const durations = reportIncidents
      .filter((t) => t.resolved_at && t.reported_at)
      .map((t) => new Date(t.resolved_at!).getTime() - new Date(t.reported_at).getTime());

    if (!durations.length) {
      return "—";
    }

    const avgMs = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    const hours = Math.round(avgMs / (1000 * 60 * 60));
    return `${hours}h`;
  }, [reportIncidents]);

  const avgResponse = "—";

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listIncidents({
        page: 1,
        per_page: 100,
        severity: filterSeverity === "all" ? "" : filterSeverity,
        status_id: filterStatus === "all" ? "" : selectedStatusId,
      });

      const incidents = response.data.filter((incident) => {
        if (dateFrom && new Date(incident.reported_at) < new Date(dateFrom)) {
          return false;
        }

        if (dateTo && new Date(incident.reported_at) > new Date(dateTo)) {
          return false;
        }

        return true;
      });

      setReportIncidents(incidents);
      setGenerated(true);
    } catch (err: unknown) {
      console.error("Failed to generate report:", err);
      setError("Unable to generate report. Please try again.");
      setReportIncidents([]);
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Generate and export comprehensive security incident reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report builder */}
        <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
            <BarChart2 className="h-4 w-4 text-blue-400" />
            <h2 className="text-white font-semibold text-sm">Report Builder</h2>
          </div>
          <div className="p-5 space-y-5">
            {/* Report type */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Report Type</p>
              <div className="space-y-2">
                {REPORT_TYPES.map(r => {
                  const Icon = r.icon;
                  return (
                    <button key={r.id} onClick={() => setReportType(r.id)}
                      className="w-full p-3 rounded-xl text-left transition-all"
                      style={{
                        border: `1px solid ${reportType === r.id ? r.color + "40" : BORDER}`,
                        background: reportType === r.id ? `${r.color}10` : "rgba(255,255,255,0.02)"
                      }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="h-4 w-4" style={{ color: r.color }} />
                        <span className="text-sm font-semibold" style={{ color: reportType === r.id ? r.color : "#e2e8f0" }}>{r.label}</span>
                      </div>
                      <p className="text-slate-500 text-xs pl-6">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Date Range</p>
              <div className="space-y-2">
                {[{ label: "From", value: dateFrom, set: setDateFrom }, { label: "To", value: dateTo, set: setDateTo }].map(d => (
                  <div key={d.label}>
                    <label className="text-slate-500 text-xs mb-1 block">{d.label}</label>
                    <input type="date" value={d.value} onChange={e => d.set(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}`, colorScheme: "dark" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Filters</p>
              {[
                { label: "Severity", value: filterSeverity, set: setFilterSeverity, opts: [["all", "All Severities"], ["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]] },
                { label: "Status", value: filterStatus, set: setFilterStatus, opts: [["all", "All Statuses"], ["open", "Open"], ["assigned", "Assigned"], ["in_progress", "In Progress"], ["resolved", "Resolved"], ["closed", "Closed"]] },
              ].map(f => (
                <div key={f.label} className="mb-2">
                  <label className="text-slate-500 text-xs mb-1 block">{f.label}</label>
                  <div className="relative">
                    <select value={f.value} onChange={e => f.set(e.target.value as SeverityLevel | "all")}
                      className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none"
                      style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
                      {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleGenerateReport}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              disabled={loading}
              style={{
                background: loading ? "rgba(59,130,246,0.6)" : "linear-gradient(135deg,#1d4ed8,#2563eb)",
                opacity: loading ? 0.75 : 1,
              }}>
              {loading ? "Generating report..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Report preview */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <h2 className="text-white font-semibold text-sm">Report Preview</h2>
              {generated && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20">Generated</span>
              )}
            </div>
            {generated && (
              <div className="flex gap-2">
                {["PDF", "CSV"].map(fmt => (
                  <button key={fmt} onClick={() => handleExport(fmt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: exporting === fmt ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${exporting === fmt ? "rgba(16,185,129,0.3)" : BORDER}`,
                      color: exporting === fmt ? "#34d399" : "#94a3b8"
                    }}>
                    <Download className="h-3 w-3" />
                    {exporting === fmt ? "Exporting..." : `Export ${fmt}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {generated ? (
            <div className="p-5 space-y-5">
              {/* Report header */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold">{REPORT_TYPES.find(r => r.id === reportType)?.label}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Period: {dateFrom} to {dateTo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">Generated</p>
                    <p className="text-slate-300 text-xs">2024-06-22 14:30</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Incidents", value: reportRows.length, color: "#3b82f6" },
                    { label: "Resolved", value: resolved.length, color: "#10b981" },
                    { label: "Avg Response", value: avgResponse, color: "#f59e0b" },
                    { label: "Avg Resolution", value: avgResolution, color: "#8b5cf6" },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-slate-500 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl">
                  {error}
                </div>
              )}

              {/* Ticket table */}
              <div>
                <h3 className="text-slate-300 text-sm font-semibold mb-3">Incident List ({reportRows.length} records)</h3>
                <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
                        {["ID", "Title", "Category", "Severity", "Status", "Date", "Assigned To"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-10 text-center text-slate-500 text-sm">No report data available.</td>
                        </tr>
                      ) : reportRows.map((t, i) => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors"
                          style={{ borderBottom: i < reportRows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <td className="px-3 py-2.5 font-mono text-blue-400">{t.id}</td>
                          <td className="px-3 py-2.5 text-slate-300 max-w-[160px] truncate">{t.title}</td>
                          <td className="px-3 py-2.5 text-slate-400">{t.category}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${severityColor(t.severity)}`}>{t.severity.toUpperCase()}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${statusColor(t.statusSlug)}`}>{t.statusLabel}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{t.reportedAt.split(" ")[0]}</td>
                          <td className="px-3 py-2.5 text-slate-400">{t.assignedTo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Configure your report settings and click Generate Report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
