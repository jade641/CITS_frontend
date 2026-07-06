import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Calendar, User, Paperclip, Clock, CheckCircle2, Tag, ShieldAlert, FileText, MessageSquare } from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { getIncident } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const LIFECYCLE = ["open", "assigned", "in_progress", "pending", "resolved", "closed"] as const;
const LIFECYCLE_LABELS: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

export default function TicketDetails() {
  const { selectedTicketId, navigate } = useCITS();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadIncident = async () => {
      setLoading(true);
      setError(null);

      if (!selectedTicketId) {
        setIncident(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getIncident(Number(selectedTicketId));
        if (!active) {
          return;
        }

        setIncident(response.incident || null);
      } catch (err: any) {
        if (!active) {
          return;
        }

        setIncident(null);
        setError(err?.response?.data?.message || "Failed to load incident details");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadIncident();

    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  const ticket = useMemo(() => {
    if (!incident) {
      return null;
    }

    const updates = (incident.history ?? []).map((entry) => ({
      id: String(entry.id),
      author: entry.user?.name ?? "System",
      role: entry.user?.roles?.[0]?.name ?? "Security Analyst",
      timestamp: new Date(entry.created_at).toLocaleString(),
      message: entry.description,
      type:
        entry.event_type === "assigned"
          ? "assignment"
          : entry.event_type === "status_changed"
            ? "status"
            : entry.event_type === "resolved"
              ? "resolution"
              : "note",
    }));

    return {
      id: incident.ticket_number,
      title: incident.title,
      category: incident.category?.name ?? "Uncategorized",
      severity: incident.severity,
      status: incident.status?.slug ?? "open",
      description: incident.description,
      submittedBy: incident.reporter?.name ?? "Unknown",
      assignedTo: incident.current_assignee?.name ?? "",
      dateSubmitted: new Date(incident.reported_at).toLocaleString(),
      lastUpdated: new Date(incident.updated_at ?? incident.reported_at).toLocaleString(),
      location: incident.location ?? "Unknown",
      attachments: incident.attachments?.length ?? 0,
      updates,
    };
  }, [incident]);

  const statusIdx = ticket ? LIFECYCLE.indexOf(ticket.status as any) : -1;

  const typeIcon = (type: string) => {
    if (type === "status") return <Clock className="h-3 w-3 text-blue-400" />;
    if (type === "assignment") return <User className="h-3 w-3 text-cyan-400" />;
    if (type === "resolution") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    return <MessageSquare className="h-3 w-3 text-purple-400" />;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <button onClick={() => navigate("my-tickets")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to My Tickets
        </button>
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">Unable to load incident.</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <button onClick={() => navigate("my-tickets")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to My Tickets
        </button>
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">No ticket selected.</p>
          <p className="text-slate-500 text-sm mt-1">Create or select an incident to view its details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate("my-tickets")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to My Tickets
      </button>

      <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-blue-400 text-sm">{ticket.id}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${severityColor(ticket.severity)}`}>
                {ticket.severity.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor(ticket.status)}`}>
                {statusLabel(ticket.status)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{ticket.title}</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-slate-500 text-xs">Last updated</p>
            <p className="text-slate-300 text-sm">{ticket.lastUpdated}</p>
          </div>
        </div>

        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Ticket Lifecycle</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {LIFECYCLE.map((s, i) => {
              const done = i <= statusIdx;
              const current = i === statusIdx;
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: current ? "#3b82f6" : done ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                        border: current ? "2px solid #3b82f6" : done ? "2px solid rgba(59,130,246,0.4)" : "2px solid rgba(255,255,255,0.1)",
                        color: done ? "#93c5fd" : "#475569",
                        boxShadow: current ? "0 0 12px rgba(59,130,246,0.4)" : "none"
                      }}>
                      {done && !current ? "✓" : i + 1}
                    </div>
                    <span className="text-xs whitespace-nowrap" style={{ color: current ? "#93c5fd" : done ? "#64748b" : "#374151" }}>
                      {LIFECYCLE_LABELS[s]}
                    </span>
                  </div>
                  {i < LIFECYCLE.length - 1 && (
                    <div className="w-8 h-0.5 mb-4 mx-0.5 rounded"
                      style={{ background: i < statusIdx ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-400" /> Incident Information
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { icon: Tag, label: "Category", value: ticket.category },
                { icon: MapPin, label: "Location", value: ticket.location },
                { icon: Calendar, label: "Reported", value: ticket.dateSubmitted },
                { icon: User, label: "Reported By", value: ticket.submittedBy },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3 w-3 text-slate-500" />
                    <p className="text-slate-500 text-xs">{label}</p>
                  </div>
                  <p className="text-slate-200 text-sm">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-2">Description</p>
              <p className="text-slate-300 text-sm leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" /> Ticket Timeline & Investigation Updates
            </h2>

            <div className="relative pl-8 pb-5" style={{ borderLeft: "1px solid rgba(30,60,100,0.5)" }}>
              <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-500 border-2" style={{ borderColor: "#060c1a" }} />
              <p className="text-xs text-slate-500 mb-1 font-mono">{ticket.dateSubmitted}</p>
              <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3 w-3 text-blue-400" />
                  <span className="text-blue-400 text-xs font-semibold">{ticket.submittedBy}</span>
                  <span className="text-slate-600 text-xs">· Employee</span>
                </div>
                <p className="text-slate-300 text-xs">Incident reported and ticket created.</p>
              </div>
            </div>

            {ticket.updates.map((u, i) => (
              <div key={u.id} className="relative pl-8 pb-5" style={{ borderLeft: i < ticket.updates.length - 1 ? "1px solid rgba(30,60,100,0.5)" : "none" }}>
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2"
                  style={{
                    background: u.type === "resolution" ? "#10b981" : u.type === "assignment" ? "#06b6d4" : u.type === "status" ? "#3b82f6" : "#8b5cf6",
                    borderColor: "#060c1a"
                  }} />
                <p className="text-xs text-slate-500 mb-1 font-mono">{u.timestamp}</p>
                <div className="p-3 rounded-lg" style={{
                  background: u.type === "resolution" ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${u.type === "resolution" ? "rgba(16,185,129,0.2)" : BORDER}`
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcon(u.type)}
                    <span className="text-xs font-semibold" style={{ color: u.type === "resolution" ? "#34d399" : u.type === "assignment" ? "#22d3ee" : "#93c5fd" }}>
                      {u.author}
                    </span>
                    <span className="text-slate-600 text-xs">· {u.role}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded capitalize" style={{
                      background: u.type === "resolution" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                      color: u.type === "resolution" ? "#34d399" : "#64748b"
                    }}>{u.type}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{u.message}</p>
                </div>
              </div>
            ))}

            {ticket.updates.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">
                No investigation updates yet. Awaiting analyst assignment.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" /> Assigned Analyst
            </h3>
            {ticket.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}>
                  {ticket.assignedTo.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{ticket.assignedTo}</p>
                  <p className="text-cyan-400 text-xs">Security Analyst · SOC</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400 text-xs">Online</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-2">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-slate-400 text-xs">Pending assignment</p>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-blue-400" /> Attachments
              <span className="ml-auto text-xs text-slate-500">{ticket.attachments} file{ticket.attachments !== 1 ? "s" : ""}</span>
            </h3>
            {ticket.attachments > 0 ? (
              <div className="space-y-2">
                {Array.from({ length: ticket.attachments }, (_, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                    <FileText className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-slate-300 text-xs truncate">
                      {ticket.attachments > 0 ? `attachment_${i + 1}.file` : "attachment.file"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-3">No attachments</p>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="text-white font-semibold text-sm mb-3">Ticket Metadata</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Ticket ID", value: ticket.id },
                { label: "Category", value: ticket.category },
                { label: "Severity", value: ticket.severity.toUpperCase() },
                { label: "Submitted", value: ticket.dateSubmitted },
                { label: "Last Updated", value: ticket.lastUpdated },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid rgba(30,60,100,0.2)` }}>
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
