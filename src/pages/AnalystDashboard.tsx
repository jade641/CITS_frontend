import { useEffect, useState } from "react";
import { Eye, CheckCircle2, Activity, AlertTriangle, ChevronRight, Target, Zap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "#0a1628", border: `1px solid ${BORDER}` }}>
      <p className="text-slate-400 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="text-white">{p.value}</span></p>
      ))}
    </div>
  );
};

function generateWeeklyActivity(incidents: Incident[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const now = new Date();
  
  // Get start of current week (Monday)
  const currentDay = now.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // adjust when day is Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return days.map((day, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
    const nextDay = new Date(dayDate);
    nextDay.setDate(dayDate.getDate() + 1);

    const dayIncidents = incidents.filter((inc) => {
      const resolvedDate = inc.resolved_at ? new Date(inc.resolved_at) : null;
      const updatedDate = new Date(inc.updated_at ?? inc.reported_at);
      const statusSlug = inc.status?.slug ?? "";
      
      return (
        (resolvedDate && resolvedDate >= dayDate && resolvedDate < nextDay) ||
        (updatedDate >= dayDate && updatedDate < nextDay && statusSlug === "in_progress")
      );
    });

    return {
      day,
      resolved: dayIncidents.filter((inc) => inc.status?.slug === "resolved").length,
      reviewed: dayIncidents.filter((inc) => inc.status?.slug === "in_progress" || inc.status?.slug === "pending").length,
    };
  });
}

export default function AnalystDashboard() {
  const { currentUser, navigate } = useCITS();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const response = await listIncidents({ assigned_to_me: true });
        
        if (!active) return;
        
        setIncidents(response.data || []);
      } catch (err) {
        if (!active) return;
        setIncidents([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const assignedTickets = incidents;
  const activeInvestigations = assignedTickets.filter((t: Incident) => t.status?.slug === "in_progress" || t.status?.slug === "assigned");
  
  // Calculate resolved this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const resolved = assignedTickets.filter((t: any) => {
    const resolvedAt = t.resolved_at ? new Date(t.resolved_at) : null;
    const statusSlug = t.status?.slug ?? "";
    return (statusSlug === "resolved" || statusSlug === "closed") && resolvedAt && resolvedAt >= firstDayOfMonth;
  });
  
  const criticals = assignedTickets.filter((t: Incident) => t.severity === "critical");
  
  const workloadData = generateWeeklyActivity(assignedTickets);
  const hasWorkloadData = workloadData.some((d) => d.resolved > 0 || d.reviewed > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Analyst Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">{currentUser?.name ?? "Analyst"} · SOC Level 2 · Active Session</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-semibold">ON DUTY</span>
          </div>
          <button onClick={() => navigate("assigned-tickets")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#0e7490,#0891b2)" }}>
            <Eye className="h-4 w-4" />
            View Assigned Tickets
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl p-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-400 text-sm">Loading your assignments...</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Target, label: "Assigned Tickets", value: assignedTickets.length, color: "#3b82f6" },
            { icon: Activity, label: "Active Investigations", value: activeInvestigations.length, color: "#8b5cf6" },
            { icon: CheckCircle2, label: "Resolved This Month", value: resolved.length, color: "#10b981" },
            { icon: AlertTriangle, label: "Critical Incidents", value: criticals.length, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10" style={{ background: s.color }} />
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-slate-400 text-sm mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned tickets */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <h2 className="text-white font-semibold text-sm">My Assigned Tickets</h2>
              </div>
              <button onClick={() => navigate("assigned-tickets")} className="text-blue-400 text-xs flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Ticket ID", "Title", "Category", "Severity", "Priority", "Status", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">No assigned tickets yet</td>
                    </tr>
                  ) : assignedTickets.slice(0, 5).map((t: Incident, i: number) => {
                    const priority = t.severity === "critical" ? "High" : t.severity === "high" ? "High" : t.severity === "medium" ? "Medium" : "Low";
                    const priorityColor = priority === "High" ? "text-red-400" : priority === "Medium" ? "text-yellow-400" : "text-green-400";
                    const statusSlug = t.status?.slug ?? "";
                    
                    return (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors"
                        style={{ borderBottom: i < assignedTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <td className="px-4 py-3 font-mono text-blue-400 text-xs">#{t.id}</td>
                        <td className="px-4 py-3 text-slate-200 text-xs max-w-[140px] truncate">{t.title}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{t.category?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(t.severity)}`}>
                            {t.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${priorityColor}`}>
                            {priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(statusSlug)}`}>
                            {statusLabel(statusSlug)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigate("investigation")}
                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
                            <Eye className="h-3 w-3" /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Workload chart */}
            <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="text-white font-semibold text-sm mb-1">Weekly Activity</h3>
              <p className="text-slate-400 text-xs mb-3">Resolved vs Reviewed</p>
              {!hasWorkloadData ? (
                <div className="h-[110px] flex items-center justify-center">
                  <p className="text-slate-500 text-xs">No investigation data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={workloadData} barSize={8}>
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="reviewed" name="Reviewed" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Skill radar - placeholder */}
            <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="text-white font-semibold text-sm mb-1">Investigation Skills</h3>
              <p className="text-slate-400 text-xs mb-3">Proficiency radar</p>
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-slate-500 text-xs text-center">Skills tracked after investigations</p>
              </div>
            </div>

            {/* SLA status */}
            <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-400" />
                <h3 className="text-white font-semibold text-sm">SLA Status</h3>
              </div>
              {assignedTickets.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No active tickets</p>
              ) : (
                assignedTickets.slice(0, 3).map((t: Incident) => {
                  // Calculate time-based SLA (mock calculation)
                  const createdDate = new Date(t.created_at ?? t.reported_at);
                  const now = new Date();
                  const hoursPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
                  const slaHours = t.severity === "critical" ? 4 : t.severity === "high" ? 8 : t.severity === "medium" ? 24 : 48;
                  const pct = Math.min((hoursPassed / slaHours) * 100, 100);
                  const remaining = Math.max(slaHours - hoursPassed, 0);
                  const color = pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#10b981";
                  const label = pct >= 100 ? "URGENT" : `${remaining}h remaining`;

                  return (
                    <div key={t.id} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-blue-400">#{t.id}</span>
                        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
