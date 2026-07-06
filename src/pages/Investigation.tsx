import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Shield, CheckCircle2, Save, Trash2, Upload, User, MapPin, Calendar, Paperclip, MessageSquare, Search } from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { getIncident, listIncidents, changeIncidentStatus, updateIncident, addComment, addAttachment } from "../services/incidentService";
import { getLookups } from "../services/lookupService";
import type { Incident, IncidentStatus } from "../interfaces/incident";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

export default function Investigation() {
  const { selectedTicketId, navigate, currentUser } = useCITS();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"details" | "notes" | "evidence" | "findings">("details");
  const [notes, setNotes] = useState("");
  const [findings, setFindings] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [status, setStatus] = useState("open");
  const [incidentStatuses, setIncidentStatuses] = useState<IncidentStatus[]>([]);
  const [saved, setSaved] = useState(false);
  const [lastSavedNotes, setLastSavedNotes] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidence, setEvidence] = useState<Array<{ name: string; size: string; type: string; added: string }>>([]);

  useEffect(() => {
    let active = true;

    const loadIncident = async () => {
      setLoading(true);
      setError(null);

      try {
        if (selectedTicketId) {
          const response = await getIncident(Number(selectedTicketId));
          if (!active) {
            return;
          }

          const loaded = response.incident || null;
          setIncident(loaded);

          // Auto-transition: if current user is the assigned analyst and ticket is 'assigned', move to 'in_progress'
          try {
            if (
              loaded &&
              currentUser?.role === 'analyst' &&
              loaded.current_assignee &&
              String(loaded.current_assignee.id) === String(currentUser.id) &&
              loaded.status?.slug === 'assigned'
            ) {
              // Ensure we have lookup statuses
              let lookups = null;
              if (!incidentStatuses.length) {
                lookups = await getLookups();
                if (active) setIncidentStatuses(lookups.incidentStatuses);
              }

              const statusList = incidentStatuses.length ? incidentStatuses : (lookups?.incidentStatuses ?? []);
              const inProgressRecord = statusList.find((s) => s.slug === 'in_progress');
              if (inProgressRecord) {
                const res = await changeIncidentStatus(loaded.id, inProgressRecord.id, '');
                if (active) {
                  setIncident(res.incident);
                  setStatus(res.incident.status?.slug ?? 'in_progress');
                }
              }
            }
          } catch (err: any) {
            console.error('Failed to auto-transition to in_progress', err);
          }

          return;
        }

        const response = await listIncidents({ assigned_to_me: true, page: 1, per_page: 50 });
        if (!active) {
          return;
        }

        setAssignedTickets(response.data);

        if (response.data.length === 1) {
          setIncident(response.data[0] ?? null);
        } else {
          setIncident(null);
        }
      } catch (err: any) {
        if (!active) {
          return;
        }

        setIncident(null);
        setError(err?.response?.data?.message || "Failed to load investigation ticket");
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
      updates: (incident.history ?? []).map((entry) => ({
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
      })),
    };
  }, [incident]);

  const effectiveStatus = incident?.status?.slug ?? (assignedTickets.length > 0 ? "assigned" : status);
  const isClosed = effectiveStatus === "closed";

  const statusLabelValue = statusLabel(status);

  const sortedAssignedTickets = useMemo(() => {
    const severityRank: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...assignedTickets].sort((a, b) => {
      const aRank = severityRank[a.severity] ?? 4;
      const bRank = severityRank[b.severity] ?? 4;

      if (aRank !== bRank) {
        return aRank - bRank;
      }

      return new Date(a.reported_at).getTime() - new Date(b.reported_at).getTime();
    });
  }, [assignedTickets]);

  const parseResolutionNotes = (text: string) => {
    const cleaned = (text ?? "").toString().trim();
    if (!cleaned) {
      return { findings: "", rootCause: "", resolution: "" };
    }

    const parts = cleaned.split(/\n\nRoot cause:\s*/i);
    const findingsText = parts[0] ?? "";
    const remainder = parts[1] ?? "";
    let rootCauseText = "";
    let resolutionText = "";

    if (remainder) {
      const [rootText, resolutionPart] = remainder.split(/\n\nResolution:\s*/i);
      rootCauseText = (rootText ?? "").toString().trim();
      resolutionText = (resolutionPart ?? "").toString().trim();
    }

    return {
      findings: findingsText.toString().trim(),
      rootCause: rootCauseText,
      resolution: resolutionText,
    };
  };

  useEffect(() => {
    if (incident) {
      setStatus(incident.status?.slug ?? "open");
      setNotes("");
      setLastSavedNotes("");
      const { findings: savedFindings, rootCause: savedRootCause, resolution: savedResolution } = parseResolutionNotes(incident.resolution_notes ?? "");
      setFindings(savedFindings);
      setRootCause(savedRootCause);
      setResolution(savedResolution);
      setEvidence(
        (incident.attachments ?? []).map((attachment) => ({
          name: attachment.original_name,
          size: `${(attachment.size_bytes / 1024).toFixed(2)} KB`,
          type: attachment.mime_type.split("/")[1]?.toUpperCase() || "File",
          added: new Date(attachment.created_at).toLocaleDateString(),
        })),
      );
    } else {
      setStatus("open");
      setNotes("");
      setLastSavedNotes("");
      setFindings("");
      setRootCause("");
      setResolution("");
      setEvidence([]);
    }
  }, [incident]);

  useEffect(() => {
    let active = true;

    getLookups().then((data) => {
      if (!active) return;
      setIncidentStatuses(data.incidentStatuses);
    }).catch(() => {
      // ignore lookup failures for now
    });

    return () => {
      active = false;
    };
  }, []);

  const persistStatusChange = async (newStatusSlug: string) => {
    if (!incident || !incidentStatuses.length) {
      return;
    }

    const statusRecord = incidentStatuses.find((s) => s.slug === newStatusSlug);
    if (!statusRecord || statusRecord.id === incident.status?.id) {
      return;
    }

    try {
      const response = await changeIncidentStatus(incident.id, statusRecord.id, newStatusSlug === "resolved" ? resolution.trim() : "");
      setIncident(response.incident);
      setStatus(response.incident.status?.slug ?? newStatusSlug);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!incident) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    const currentSlug = incident.status?.slug ?? "open";
    if (status !== currentSlug) {
      await persistStatusChange(status);
      return;
    }

    if (tab === "notes") {
      if (!notes.trim() || notes.trim() === lastSavedNotes) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        return;
      }

      try {
        await addComment(incident.id, notes.trim(), false);
        setLastSavedNotes(notes.trim());
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err: any) {
        console.error(err);
      }

      return;
    }

    if (tab === "findings") {
      const trimmedNotes = `${findings.trim()}\n\nRoot cause: ${rootCause.trim()}\n\nResolution: ${resolution.trim()}`.trim();
      if (!trimmedNotes || trimmedNotes === (incident.resolution_notes ?? '').trim()) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        return;
      }

      try {
        const response = await updateIncident(incident.id, { resolution_notes: trimmedNotes });
        setIncident(response.incident);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err: any) {
        console.error(err);
      }

      return;
    }

    if (tab === "evidence") {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !incident) {
      return;
    }

    const uploadFiles = Array.from(files);
    setUploadingEvidence(true);

    try {
      for (const file of uploadFiles) {
        await addAttachment(incident.id, file);
      }

      const response = await getIncident(incident.id);
      setIncident(response.incident);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setUploadingEvidence(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleDeleteEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const TABS = [
    { id: "details", label: "Incident Details", icon: Shield },
    { id: "notes", label: "Investigation Notes", icon: FileText },
    { id: "evidence", label: "Evidence", icon: Search },
    { id: "findings", label: "Findings & Resolution", icon: CheckCircle2 },
  ] as const;

  const LIFECYCLE = ["open", "assigned", "in_progress", "pending", "resolved", "failed", "closed"] as const;
  const LIFECYCLE_LABELS: Record<string, string> = {
    open: "Open",
    assigned: "Assigned",
    in_progress: "In Progress",
    pending: "Pending",
    resolved: "Resolved",
    failed: "Failed",
    closed: "Closed",
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">Loading investigation workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <button onClick={() => navigate("assigned-tickets")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Assigned Tickets
        </button>
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">Unable to load investigation ticket.</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
  if (assignedTickets.length > 0) {
        return (
          <div className="p-6 max-w-7xl mx-auto space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">Investigate Assigned Tickets</h1>
                <p className="text-slate-400 text-sm mt-0.5">Multiple tickets are assigned to you. Choose the one to investigate first.</p>
              </div>
              <button onClick={() => navigate("assigned-tickets")}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                Back to Assigned Tickets
              </button>
            </div>

            <div className="overflow-hidden rounded-xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
                      {[
                        "Ticket",
                        "Title",
                        "Severity",
                        "Status",
                        "Reported",
                        "Action",
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssignedTickets.map((ticket, index) => {
                      const ticketStatus = ticket.status?.slug ?? "open";
                      return (
                        <tr key={ticket.id} className="hover:bg-white/5 transition-colors"
                          style={{ borderBottom: index < sortedAssignedTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <td className="px-4 py-3 font-mono text-blue-400 text-xs">#{ticket.ticket_number}</td>
                          <td className="px-4 py-3 text-slate-200 text-sm max-w-[280px] truncate">{ticket.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(ticket.severity)}`}>
                              {ticket.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(ticketStatus)}`}>
                              {statusLabel(ticketStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {new Date(ticket.reported_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={async () => {
                              setLoading(true);
                              setError(null);
                              try {
                                const response = await getIncident(ticket.id);
                                setIncident(response.incident);
                              } catch (err: any) {
                                setError(err?.response?.data?.message || "Failed to load selected ticket.");
                              } finally {
                                setLoading(false);
                              }
                            }}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-400/5 border border-cyan-400/20 hover:bg-cyan-400/10 transition-colors">
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-white">Investigation Workspace</h1>
          <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-slate-300 font-semibold">No active investigation is available.</p>
            <p className="text-slate-500 text-sm mt-1">Select an assigned ticket to begin your investigation.</p>
          </div>
        </div>
      );
    }

  const handleSubmitResolution = async () => {
    if (!incidentStatuses.length || !incident) {
      return;
    }

    const resolvedStatus = incidentStatuses.find((s) => s.slug === "resolved");
    if (!resolvedStatus) {
      return;
    }

    try {
      const response = await changeIncidentStatus(incident.id, resolvedStatus.id, `${findings.trim()}\n\nRoot cause: ${rootCause.trim()}\n\nResolution: ${resolution.trim()}`);
      setIncident(response.incident);
      setStatus(response.incident.status?.slug ?? "resolved");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Investigation Workspace</h1>
          {ticket && (
            <p className="text-slate-400 text-sm mt-0.5 font-mono">{ticket.id} · {ticket.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-green-400 text-xs"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <CheckCircle2 className="h-3 w-3" /> Saved
            </div>
          )}
          <div className="relative">
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={isClosed}
              className="pl-3 pr-8 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
              style={{ background: isClosed ? "rgba(255,255,255,0.02)" : "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
              {(incidentStatuses.length ? incidentStatuses : [
                { id: 0, slug: 'open', name: 'Open', description: '', sort_order: 1, is_closed: false },
                { id: 0, slug: 'assigned', name: 'Assigned', description: '', sort_order: 2, is_closed: false },
                { id: 0, slug: 'in_progress', name: 'In Progress', description: '', sort_order: 3, is_closed: false },
                { id: 0, slug: 'pending', name: 'Pending', description: '', sort_order: 4, is_closed: false },
                { id: 0, slug: 'resolved', name: 'Resolved', description: '', sort_order: 5, is_closed: false },
                { id: 0, slug: 'failed', name: 'Failed', description: '', sort_order: 6, is_closed: true },
                { id: 0, slug: 'closed', name: 'Closed', description: '', sort_order: 7, is_closed: true },
              ]).map((s) => (
                <option key={s.slug} value={s.slug}>{statusLabel(s.slug)}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSave} disabled={isClosed}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: isClosed ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            <Save className="h-4 w-4" /> Save Progress
          </button>
          <button
            onClick={handleSubmitResolution}
            disabled={isClosed || !findings || !rootCause || !resolution}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isClosed ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg,#065f46,#059669)" }}>
            <CheckCircle2 className="h-4 w-4" /> Submit Resolution
          </button>
          <button
            onClick={async () => {
              if (!incident) return;
              const ok = window.confirm('Are you sure you want to close this ticket? This will set status to Closed.');
              if (!ok) return;
              try {
                await persistStatusChange('closed');
              } catch (err) {
                console.error(err);
              }
            }}
            disabled={isClosed}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isClosed ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg,#374151,#6b7280)" }}>
            Close Ticket
          </button>
        </div>
      </div>

      <div className="rounded-xl p-4 flex flex-wrap items-center gap-4"
        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono text-blue-400 text-sm whitespace-nowrap">{ticket.id}</span>
          <span className="text-white font-semibold truncate">{ticket.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(ticket.severity)}`}>{ticket.severity.toUpperCase()}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(status)}`}>{statusLabelValue}</span>
          <span className="text-slate-400 text-xs">{ticket.category}</span>
          <span className="text-slate-400 text-xs">· {ticket.location}</span>
        </div>
      </div>

      <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Ticket Lifecycle</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {LIFECYCLE.map((s, i) => {
            const statusIdx = LIFECYCLE.indexOf(effectiveStatus as any);
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

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? "#0d1e35" : "transparent",
                color: tab === t.id ? "#93c5fd" : "#64748b",
                border: tab === t.id ? `1px solid rgba(59,130,246,0.2)` : "1px solid transparent",
              }}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:block">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {tab === "details" && (
          <div className="p-6 space-y-5">
            <h2 className="text-white font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-blue-400" /> Incident Details</h2>

            <div className="rounded-lg p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                Reporter Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Reported By</p>
                  <p className="text-slate-200 text-sm font-medium">{ticket.submittedBy}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Location</p>
                  <p className="text-slate-200 text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {ticket.location}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Date Reported</p>
                  <p className="text-slate-200 text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {ticket.dateSubmitted}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Ticket ID", value: ticket.id, icon: Paperclip },
                { label: "Category", value: ticket.category, icon: Shield },
                { label: "Last Updated", value: ticket.lastUpdated, icon: Calendar },
                { label: "Attachments", value: `${ticket.attachments} files`, icon: Paperclip },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                  <p className="text-slate-500 text-xs mb-1.5 flex items-center gap-1.5">
                    <Icon className="h-3 w-3" />
                    {label}
                  </p>
                  <p className="text-slate-200 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-slate-500 text-xs mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Incident Description
              </p>
              <div className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                <p className="text-slate-300 text-sm leading-relaxed">{ticket.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-slate-400 text-xs mb-2">Severity Level</p>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${severityColor(ticket.severity)}`}>
                  {ticket.severity.toUpperCase()}
                </span>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-slate-400 text-xs mb-2">Current Status</p>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${statusColor(status)}`}>
                  {statusLabel(status)}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-blue-400" /> Investigation Notes</h2>
              <span className="text-slate-500 text-xs">Auto-saved · {notes.length} chars</span>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-lg text-sm text-slate-200 outline-none resize-none font-mono"
              style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}`, lineHeight: "1.7" }}
              placeholder="Document your investigation notes, IoCs, timeline, affected systems..." />
            <div className="flex gap-3">
              <button onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                <Save className="h-4 w-4" /> Save Notes
              </button>
            </div>
          </div>
        )}

        {tab === "evidence" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-400" /> Evidence Attachments
              </h2>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                <Upload className="h-3.5 w-3.5" /> Upload Investigation Evidence
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {evidence.length === 0 ? (
              <div className="py-12 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                <Upload className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No evidence files uploaded yet.</p>
                <p className="text-slate-500 text-xs mt-1">Upload screenshots, logs, or other investigation artifacts.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {evidence.map((file, i) => (
                  <div key={i} className="p-3 rounded-lg flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <Paperclip className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 text-sm font-medium truncate">{file.name}</p>
                      <p className="text-slate-500 text-xs">{file.type} · {file.size} · {file.added}</p>
                    </div>
                    <button onClick={() => handleDeleteEvidence(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "findings" && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Findings</label>
                <textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={5}
                  className="w-full px-4 py-3 rounded-lg text-sm text-slate-200 outline-none resize-none"
                  style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
                  placeholder="Summarize your investigation findings..." />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Root Cause</label>
                <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={5}
                  className="w-full px-4 py-3 rounded-lg text-sm text-slate-200 outline-none resize-none"
                  style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
                  placeholder="Describe the root cause..." />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Resolution</label>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={6}
                className="w-full px-4 py-3 rounded-lg text-sm text-slate-200 outline-none resize-none"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
                placeholder="Describe the resolution steps and prevention measures..." />
            </div>
            <button onClick={handleSubmitResolution}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}>
              <CheckCircle2 className="h-4 w-4" /> Submit Resolution
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
