import { useEffect, useState } from "react";
import { BookOpen, Search, Download, ChevronDown, Shield, AlertCircle } from "lucide-react";
import { listAuditLogs } from "../services/auditLogService";
import type { AuditEntry } from "../contexts/CITSContext";
import type { AuditLog } from "../interfaces/auditLog";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const activityColor = (type: string) => {
  if (type === "Security Alert") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (type === "Authentication") return "text-blue-400 bg-blue-400/10 border-blue-400/30";
  if (type === "User Management") return "text-purple-400 bg-purple-400/10 border-purple-400/30";
  if (type === "Ticket Update" || type === "Ticket Resolution" || type === "Ticket Assignment") return "text-cyan-400 bg-cyan-400/10 border-cyan-400/30";
  if (type === "Investigation") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  if (type === "Incident Report") return "text-orange-400 bg-orange-400/10 border-orange-400/30";
  return "text-slate-400 bg-slate-400/10 border-slate-400/30";
};

const activityTypes = ["Security Alert", "Authentication", "User Management", "Ticket Update", "Ticket Resolution", "Ticket Assignment", "Investigation", "Incident Report", "Report Export"];

type ApiAuditEntry = AuditLog & { user?: { email: string } | null };

function getActivityType(action: string, entityType: string | null): string {
  if (action.startsWith("auth.")) return "Authentication";
  if (action.startsWith("user.")) return "User Management";
  if (action.startsWith("incident.")) return "Incident Report";
  if (action.startsWith("report.")) return "Report Export";
  if (action.startsWith("profile.")) return "User Management";
  if (action.includes("failed") || action.includes("lock")) return "Security Alert";
  return entityType === "audit_log" ? "Audit Event" : "Security Alert";
}

function formatAuditDetails(log: AuditLog): string {
  if (log.metadata && Object.keys(log.metadata).length > 0) {
    return Object.entries(log.metadata)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
      .join(" · ");
  }

  if (log.entity_type || log.entity_id) {
    return `${log.entity_type ?? ""}${log.entity_id ? ` #${log.entity_id}` : ""}`.trim();
  }

  return "";
}

function mapAuditLog(log: ApiAuditEntry): AuditEntry {
  return {
    id: String(log.id),
    user: log.user?.email ?? "system",
    action: log.action,
    activityType: getActivityType(log.action, log.entity_type),
    timestamp: log.created_at ? new Date(log.created_at).toLocaleString() : "Unknown",
    ipAddress: log.ip_address ?? "N/A",
    details: formatAuditDetails(log),
  };
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await listAuditLogs({ page, per_page: 10 });
        if (!active) return;

        setLogs(response.data.map(mapAuditLog));
        setLastPage(response.last_page);
        setTotalEvents(response.total);
      } catch (err: unknown) {
        if (!active) return;
        console.error("Failed to load audit logs:", err);
        setError("Unable to load audit logs from the database.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      active = false;
    };
  }, [page]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (
      (l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.ipAddress.includes(q)) &&
      (filterType === "all" || l.activityType === filterType)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 text-sm mt-0.5">Immutable activity log · All actions recorded for compliance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}>
          <Download className="h-4 w-4" /> Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: totalEvents, color: "#3b82f6" },
          { label: "Security Alerts", value: logs.filter(l => l.activityType === "Security Alert").length, color: "#ef4444" },
          { label: "Auth Events", value: logs.filter(l => l.activityType === "Authentication").length, color: "#10b981" },
          { label: "Today's Events", value: 4, color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 flex flex-col sm:flex-row gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, action, or IP address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }} />
        </div>
        <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
            <option value="all">All Activity Types</option>
            {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Security alert banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-red-300 font-semibold text-sm">Security Alert Detected</p>
          <p className="text-slate-400 text-xs mt-0.5">5 failed login attempts from IP 203.0.113.99 detected at 03:12. Account temporarily locked. Investigation recommended.</p>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
          <BookOpen className="h-4 w-4 text-blue-400" />
          <h2 className="text-white font-semibold text-sm">Activity Log</h2>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live · {filtered.length} entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["#", "User", "Action", "Activity Type", "Timestamp", "IP Address"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">Loading audit logs...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-400 text-sm">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">No audit events available.</td>
                </tr>
              ) : filtered.map((l, i) => (
                <tr key={l.id} className="hover:bg-white/5 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">{l.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: l.user === "unknown" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)" }}>
                        <Shield className="h-3 w-3" style={{ color: l.user === "unknown" ? "#ef4444" : "#3b82f6" }} />
                      </div>
                      <span className={`text-xs font-mono ${l.user === "unknown" ? "text-red-400" : "text-slate-300"}`}>{l.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-[260px]">
                    <p className="truncate">{l.action}</p>
                    {l.details && <p className="text-slate-500 text-xs mt-0.5 font-mono truncate">{l.details}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap ${activityColor(l.activityType)}`}>
                      {l.activityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">{l.timestamp}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: `1px solid ${BORDER}`, background: CARD }}>
          <div className="text-slate-400 text-xs">
            Showing {logs.length} entries on this page · {totalEvents} total events
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", color: "#ffffff", border: `1px solid ${BORDER}` }}>
              Previous
            </button>
            <span className="text-slate-300 text-xs">Page {page} of {lastPage}</span>
            <button
              type="button"
              onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
              disabled={page === lastPage || loading}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", color: "#ffffff", border: `1px solid ${BORDER}` }}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
