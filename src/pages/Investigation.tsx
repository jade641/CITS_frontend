import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { 
  ArrowLeft, FileText, Shield, CheckCircle2, Save, Trash2, Upload, 
  Paperclip, Search, 
  Plus, Clock, Lock, Eye
} from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { 
  getIncident, listIncidents, changeIncidentStatus, 
  updateIncidentStatus, saveIncidentTimeline, saveIncidentIocs, 
  saveIncidentAffectedSystems, saveIncidentActionsTaken, saveIncidentSeverity, 
  uploadEvidenceFile, saveIncidentFindings, saveIncidentRemediationActions, 
  submitIncidentResolution, getIncidentAuditLog 
} from "../services/incidentService";
import { listUsers } from "../services/userService";
import { getLookups } from "../services/lookupService";
import type { Incident, IncidentStatus, IncidentTimelineEntry, IncidentIocEntry, IncidentAffectedSystemEntry, IncidentActionTakenEntry, IncidentRemediationActionEntry } from "../interfaces/incident";
import type { User as AppUser } from "../interfaces/user";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

export default function Investigation() {
  const { selectedTicketId, navigate, currentUser } = useCITS();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"details" | "notes" | "evidence" | "findings" | "audit">("details");
  const [incidentStatuses, setIncidentStatuses] = useState<IncidentStatus[]>([]);
  const [activeUsers, setActiveUsers] = useState<AppUser[]>([]);
  
  // Status indicator
  const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // 1. Severity Scoring Form State
  const [confidentiality, setConfidentiality] = useState("None");
  const [integrity, setIntegrity] = useState("None");
  const [availability, setAvailability] = useState("None");
  const [affectedSystemsCount, setAffectedSystemsCount] = useState(0);
  const [dataSensitivity, setDataSensitivity] = useState("Public");
  const [severityOverride, setSeverityOverride] = useState(false);
  const [severityManual, setSeverityManual] = useState("low");
  const [severityJustification, setSeverityJustification] = useState("");

  // 2. Structured Notes State
  const [timeline, setTimeline] = useState<IncidentTimelineEntry[]>([]);
  const [iocs, setIocs] = useState<IncidentIocEntry[]>([]);
  const [affectedSystems, setAffectedSystems] = useState<IncidentAffectedSystemEntry[]>([]);
  const [actionsTaken, setActionsTaken] = useState<IncidentActionTakenEntry[]>([]);

  // 3. Evidence Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 4. Findings & Resolution State
  const [rootCauseCategory, setRootCauseCategory] = useState("Human Error");
  const [rootCauseExplanation, setRootCauseExplanation] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [remediationActions, setRemediationActions] = useState<IncidentRemediationActionEntry[]>([]);



  // Auto-calculated Severity client-side
  const calculatedSeverity = useMemo(() => {
    const impactMap: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
    const sensitivityMap: Record<string, number> = { public: 1, internal: 2, confidential: 3, restricted: 4 };

    const confScore = impactMap[confidentiality.toLowerCase()] ?? 0;
    const intScore = impactMap[integrity.toLowerCase()] ?? 0;
    const availScore = impactMap[availability.toLowerCase()] ?? 0;
    const sensitivityScore = sensitivityMap[dataSensitivity.toLowerCase()] ?? 1;

    let systemsScore = 0;
    if (affectedSystemsCount > 20) {
      systemsScore = 3;
    } else if (affectedSystemsCount > 5) {
      systemsScore = 2;
    } else if (affectedSystemsCount >= 1) {
      systemsScore = 1;
    }

    const total = confScore + intScore + availScore + sensitivityScore + systemsScore;

    if (total >= 13 || (confScore === 3 && sensitivityScore === 4)) {
      return "critical";
    } else if (total >= 9) {
      return "high";
    } else if (total >= 5) {
      return "medium";
    } else {
      return "low";
    }
  }, [confidentiality, integrity, availability, affectedSystemsCount, dataSensitivity]);


  // Load ticket & configurations
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch active users for remediation owners
        const usersRes = await listUsers({ status: "active" });
        if (active) setActiveUsers(usersRes.data);

        // Fetch lookups
        const lookups = await getLookups();
        if (active) setIncidentStatuses(lookups.incidentStatuses);

        if (selectedTicketId) {
          const response = await getIncident(Number(selectedTicketId));
          if (!active) return;

          const loaded = response.incident || null;
          setIncident(loaded);

          // Auto-transition to Investigating if status is 'new' and user is analyst
          if (
            loaded &&
            currentUser?.role === 'analyst' &&
            loaded.status?.slug === 'new'
          ) {
            const investigatingStatus = lookups.incidentStatuses.find((s: any) => s.slug === 'investigating');
            if (investigatingStatus) {
              const res = await updateIncidentStatus(loaded.id, 'investigating');
              if (active) setIncident(res.incident);
            }
          }
        } else {
          // No selected ticket, list assigned ones
          const response = await listIncidents({ assigned_to_me: true, page: 1, per_page: 50 });
          if (!active) return;

          if (response.data.length === 1) {
            setIncident(response.data[0] ?? null);
          } else {
            setIncident(null);
          }
        }
      } catch (err: any) {
        if (!active) return;
        setIncident(null);
        setError(err?.response?.data?.message || "Failed to load investigation data");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [selectedTicketId, currentUser?.role]);

  // Load specific incident data into local states when selected ticket changes
  useEffect(() => {
    if (incident) {
      // 1. Severity
      setConfidentiality(incident.confidentiality_impact ?? "None");
      setIntegrity(incident.integrity_impact ?? "None");
      setAvailability(incident.availability_impact ?? "None");
      setAffectedSystemsCount(incident.affected_systems_count ?? 0);
      setDataSensitivity(incident.data_sensitivity ?? "Public");
      setSeverityOverride(Boolean(incident.severity_override));
      setSeverityManual(incident.severity ?? "low");
      setSeverityJustification(incident.severity_override_justification ?? "");

      // 2. Structured Notes
      setTimeline(incident.timelines ?? []);
      setIocs(incident.iocs ?? []);
      setAffectedSystems(incident.affected_systems ?? []);
      setActionsTaken(incident.actions_taken ?? []);

      // 3. Findings
      setRootCauseCategory(incident.root_cause_category ?? "Human Error");
      setRootCauseExplanation(incident.root_cause_explanation ?? "");
      setLessonsLearned(incident.lessons_learned ?? "");
      setRemediationActions(incident.remediation_actions ?? []);

      // Reset Save Status
      setSaveStatus({});
    } else {
      setConfidentiality("None");
      setIntegrity("None");
      setAvailability("None");
      setAffectedSystemsCount(0);
      setDataSensitivity("Public");
      setSeverityOverride(false);
      setSeverityManual("low");
      setSeverityJustification("");

      setTimeline([]);
      setIocs([]);
      setAffectedSystems([]);
      setActionsTaken([]);

      setRootCauseCategory("Human Error");
      setRootCauseExplanation("");
      setLessonsLearned("");
      setRemediationActions([]);
      setSaveStatus({});
    }
  }, [incident]);

  // Fetch Audit Logs when entering audit tab
  useEffect(() => {
    if (tab === "audit" && incident) {
      setLoadingAudit(true);
      getIncidentAuditLog(incident.id)
        .then((res) => {
          setAuditLogs(res.audit_logs);
        })
        .catch((err) => {
          console.error("Failed to load audit logs", err);
        })
        .finally(() => {
          setLoadingAudit(false);
        });
    }
  }, [tab, incident]);

  const ticket = useMemo(() => {
    if (!incident) return null;

    return {
      id: incident.ticket_number,
      title: incident.title,
      category: incident.category?.name ?? "Uncategorized",
      severity: incident.severity,
      status: incident.status?.slug ?? "new",
      description: incident.description,
      submittedBy: incident.reporter?.name ?? "Unknown",
      assignedTo: incident.current_assignee?.name ?? "Unassigned",
      dateSubmitted: new Date(incident.reported_at).toLocaleString(),
      lastUpdated: new Date(incident.updated_at ?? incident.reported_at).toLocaleString(),
      location: incident.location ?? "Unknown",
      attachments: incident.attachments ?? [],
    };
  }, [incident]);

  const effectiveStatus = incident?.status?.slug ?? "new";
  
  // Checking workflow locks
  const isClosed = effectiveStatus === "closed";
  const isLocked = isClosed; // Locked from Analyst modifications

  const triggerSaveNotification = (section: string, status: "saving" | "saved" | "error") => {
    setSaveStatus(prev => ({ ...prev, [section]: status }));
    if (status === "saved") {
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: "idle" }));
      }, 2500);
    }
  };

  // Independent field group saves
  const handleSaveSeverityScore = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("severity", "saving");
    try {
      const res = await saveIncidentSeverity(incident.id, {
        confidentiality_impact: confidentiality,
        integrity_impact: integrity,
        availability_impact: availability,
        affected_systems_count: affectedSystemsCount,
        data_sensitivity: dataSensitivity,
        severity_override: severityOverride,
        severity: severityManual,
        severity_override_justification: severityOverride ? severityJustification : undefined
      });
      setIncident(res.incident);
      triggerSaveNotification("severity", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("severity", "error");
    }
  };

  const handleSaveTimeline = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("timeline", "saving");
    try {
      const res = await saveIncidentTimeline(incident.id, timeline);
      setIncident(res.incident);
      triggerSaveNotification("timeline", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("timeline", "error");
    }
  };

  const handleSaveIocs = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("iocs", "saving");
    try {
      const res = await saveIncidentIocs(incident.id, iocs);
      setIncident(res.incident);
      triggerSaveNotification("iocs", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("iocs", "error");
    }
  };

  const handleSaveAffectedSystems = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("affectedSystems", "saving");
    try {
      const res = await saveIncidentAffectedSystems(incident.id, affectedSystems);
      setIncident(res.incident);
      triggerSaveNotification("affectedSystems", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("affectedSystems", "error");
    }
  };

  const handleSaveActionsTaken = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("actionsTaken", "saving");
    try {
      const res = await saveIncidentActionsTaken(incident.id, actionsTaken);
      setIncident(res.incident);
      triggerSaveNotification("actionsTaken", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("actionsTaken", "error");
    }
  };

  const handleSaveFindings = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("findings", "saving");
    try {
      const res = await saveIncidentFindings(incident.id, {
        root_cause_category: rootCauseCategory,
        root_cause_explanation: rootCauseExplanation,
        lessons_learned: lessonsLearned,
      });
      setIncident(res.incident);
      triggerSaveNotification("findings", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("findings", "error");
    }
  };

  const handleSaveRemediationActions = async () => {
    if (!incident || isLocked) return;
    triggerSaveNotification("remediation", "saving");
    try {
      const res = await saveIncidentRemediationActions(incident.id, remediationActions);
      setIncident(res.incident);
      triggerSaveNotification("remediation", "saved");
    } catch (err) {
      console.error(err);
      triggerSaveNotification("remediation", "error");
    }
  };

  // Upload Evidence gate
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setEvidenceDescription("");
      setShowUploadModal(true);
    }
  };

  const handleEvidenceUploadFinalize = async () => {
    if (!incident || !uploadFile || !evidenceDescription.trim()) return;
    setUploading(true);
    try {
      const res = await uploadEvidenceFile(incident.id, uploadFile, evidenceDescription.trim());
      setIncident(res.incident);
      setShowUploadModal(false);
      setUploadFile(null);
      setEvidenceDescription("");
      triggerSaveNotification("evidence", "saved");
    } catch (err) {
      console.error(err);
      alert("Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  };

  // Submit resolution gate
  const handleSubmitResolutionFlow = async () => {
    if (!incident || isLocked) return;
    try {
      const res = await submitIncidentResolution(incident.id);
      setIncident(res.incident);
      setTab("details");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Validation failed: Check that findings are completed and evidence exists.");
    }
  };

  // Submit findings checklist validator
  const canSubmitResolution = useMemo(() => {
    const hasFindings = rootCauseCategory.trim() !== "" && 
                        rootCauseExplanation.trim() !== "" && 
                        lessonsLearned.trim() !== "";
    const hasEvidence = (incident?.attachments?.length ?? 0) > 0;
    return hasFindings && hasEvidence;
  }, [rootCauseCategory, rootCauseExplanation, lessonsLearned, incident]);

  const TABS = [
    { id: "details", label: "Incident Details & Severity", icon: Shield },
    { id: "notes", label: "Investigation Notes", icon: FileText },
    { id: "evidence", label: "Evidence Chain", icon: Search },
    { id: "findings", label: "Findings & Resolution", icon: CheckCircle2 },
    { id: "audit", label: "Audit Logs", icon: Clock },
  ] as const;

  const LIFECYCLE = ["new", "investigating", "contained", "eradicated", "recovering", "closed"] as const;
  const LIFECYCLE_LABELS: Record<string, string> = {
    new: "New",
    investigating: "Investigating",
    contained: "Contained",
    eradicated: "Eradicated",
    recovering: "Recovering",
    closed: "Closed",
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">Loading SOC Incident Workspace...</p>
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
          <p className="text-slate-300 font-semibold">Unable to load incident record.</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!ticket || !incident) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-white">Investigation Workspace</h1>
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-300 font-semibold">No active incident selected.</p>
          <p className="text-slate-500 text-sm mt-1">Please select an assigned incident from the dashboard to investigate.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      
      {/* 1. Back button & Workspace header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate("assigned-tickets")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            SOC Incident Workspace 
            {isLocked && <Lock className="h-5 w-5 text-slate-500" />}
          </h1>
          <p className="text-slate-400 text-sm font-mono mt-0.5">{ticket.id} · {ticket.title}</p>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick status transition dropdown for Analysts */}
          {!isLocked && (
            <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border" style={{ borderColor: BORDER }}>
              <span className="text-xs text-slate-400 px-1 font-semibold">Lifecycle Status:</span>
              <select 
                value={effectiveStatus}
                onChange={async (e) => {
                  const newSlug = e.target.value;
                  const targetStatus = incidentStatuses.find(s => s.slug === newSlug);
                  if (targetStatus) {
                    try {
                      const res = await changeIncidentStatus(incident.id, targetStatus.id, "");
                      setIncident(res.incident);
                    } catch (err: any) {
                      alert(err?.response?.data?.message || "Failed to update status");
                    }
                  }
                }}
                className="bg-[#080d1a] text-xs text-slate-200 outline-none rounded p-1 border cursor-pointer border-slate-700/60"
              >
                {incidentStatuses
                  .filter(s => s.slug !== "closed") // Cannot jump directly here
                  .map(s => (
                    <option key={s.id} value={s.slug}>{s.name}</option>
                  ))
                }
              </select>
            </div>
          )}
        </div>
      </div>



      {/* 4. Closed Lock Banner */}
      {isClosed && (
        <div className="rounded-xl p-4 flex gap-3 border"
          style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)" }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-emerald-300 text-sm font-semibold">Incident Closed</h4>
            <p className="text-slate-300 text-xs mt-1">
              This cyber incident is resolved and fully closed. Editing is permanently locked.
            </p>
          </div>
        </div>
      )}

      {/* 5. Summary Info Strip */}
      <div className="rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm"
        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono text-blue-400 text-sm whitespace-nowrap">{ticket.id}</span>
          <span className="text-white font-semibold truncate">{ticket.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severityColor(ticket.severity)}`}>
            {ticket.severity.toUpperCase()}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor(effectiveStatus)}`}>
            {statusLabel(effectiveStatus)}
          </span>
          <span className="text-slate-400 text-xs">{ticket.category}</span>
          <span className="text-slate-400 text-xs">· Assignee: {ticket.assignedTo}</span>
        </div>
      </div>

      {/* 6. Lifecycle Timeline Visualizer */}
      <div className="mt-4 pt-4 pb-1 border-t" style={{ borderColor: BORDER }}>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> NIST SP 800-61 Incident Lifecycle Stages
        </p>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {LIFECYCLE.map((s, idx) => {
            const statusIdx = LIFECYCLE.indexOf(effectiveStatus as any);
            const done = idx <= statusIdx;
            const current = idx === statusIdx;
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: current ? "#3b82f6" : done ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                      border: current ? "2px solid #3b82f6" : done ? "2px solid rgba(59,130,246,0.4)" : "2px solid rgba(255,255,255,0.1)",
                      color: done ? "#93c5fd" : "#475569",
                      boxShadow: current ? "0 0 12px rgba(59,130,246,0.4)" : "none"
                    }}>
                    {done && !current ? "✓" : idx + 1}
                  </div>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: current ? "#93c5fd" : done ? "#64748b" : "#374151" }}>
                    {LIFECYCLE_LABELS[s]}
                  </span>
                </div>
                {idx < LIFECYCLE.length - 1 && (
                  <div className="w-10 h-0.5 mb-5 mx-1 rounded"
                    style={{ background: idx < statusIdx ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Tabs Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? "#0d1e35" : "transparent",
                color: tab === t.id ? "#93c5fd" : "#64748b",
                border: tab === t.id ? `1px solid rgba(59,130,246,0.2)` : "1px solid transparent",
              }}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden md:block">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 8. Active Tab Content Window */}
      <div className="rounded-xl overflow-hidden shadow-md" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        
        {/* Tab 1: Details & Severity */}
        {tab === "details" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Basic Details */}
              <div className="space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wider pb-2 border-b border-slate-700/50">
                  <Shield className="h-4 w-4 text-blue-400" /> Basic Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Reporter Name", value: ticket.submittedBy },
                    { label: "Asset Location", value: ticket.location },
                    { label: "Date Reported", value: ticket.dateSubmitted },
                    { label: "Last System Update", value: ticket.lastUpdated },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                      <p className="text-slate-500 text-[11px] font-semibold uppercase">{label}</p>
                      <p className="text-slate-200 text-sm mt-1">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-semibold uppercase">Reporter Narrative Description</p>
                  <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Severity Scoring Assessment Form */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                  <h2 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Shield className="h-4 w-4 text-red-400" /> Severity Scoring Form (SOC Matrix)
                  </h2>
                  {saveStatus["severity"] === "saved" && (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/20">
                      ✓ Saved
                    </span>
                  )}
                </div>

                <div className="p-5 rounded-lg bg-slate-900/40 border border-slate-800/60 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5">Confidentiality Impact</label>
                      <select 
                        value={confidentiality} 
                        onChange={(e) => setConfidentiality(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5">Integrity Impact</label>
                      <select 
                        value={integrity} 
                        onChange={(e) => setIntegrity(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5">Availability Impact</label>
                      <select 
                        value={availability} 
                        onChange={(e) => setAvailability(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5">Affected Systems Count</label>
                      <input 
                        type="number" 
                        min="0"
                        value={affectedSystemsCount}
                        onChange={(e) => setAffectedSystemsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={isLocked}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5">Data Sensitivity Level</label>
                      <select 
                        value={dataSensitivity} 
                        onChange={(e) => setDataSensitivity(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="Public">Public</option>
                        <option value="Internal">Internal</option>
                        <option value="Confidential">Confidential</option>
                        <option value="Restricted">Restricted</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg flex items-center justify-between border border-slate-800">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">Matrix Calculation</p>
                      <p className="text-slate-300 text-xs mt-0.5">Calculated Severity:</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-bold border uppercase ${severityColor(calculatedSeverity)}`}>
                      {calculatedSeverity}
                    </span>
                  </div>

                  {/* Analyst Override Section */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={severityOverride}
                        onChange={(e) => setSeverityOverride(e.target.checked)}
                        disabled={isLocked}
                        className="rounded bg-slate-950 border-slate-700 text-blue-500"
                      />
                      Enable Manual Analyst Severity Override
                    </label>

                    {severityOverride && (
                      <div className="space-y-3 bg-[#080d1a]/55 p-3 rounded-lg border border-yellow-500/20">
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Manual Severity Level</label>
                          <select 
                            value={severityManual} 
                            onChange={(e) => setSeverityManual(e.target.value)}
                            disabled={isLocked}
                            className="bg-[#080d1a] border border-slate-750 rounded p-1.5 text-xs text-slate-200 outline-none"
                          >
                            <option value="low">LOW</option>
                            <option value="medium">MEDIUM</option>
                            <option value="high">HIGH</option>
                            <option value="critical">CRITICAL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Required Override Justification Note:</label>
                          <textarea 
                            value={severityJustification}
                            onChange={(e) => setSeverityJustification(e.target.value)}
                            disabled={isLocked}
                            rows={3}
                            placeholder="Provide security context/justification for overriding the calculated matrix..."
                            className="w-full text-xs p-2 rounded text-slate-200 bg-slate-950 outline-none border resize-none"
                            style={{ borderColor: BORDER }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!isLocked && (
                    <button 
                      onClick={handleSaveSeverityScore}
                      disabled={severityOverride && !severityJustification.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors shadow-sm"
                    >
                      <Save className="h-4 w-4" /> Save Severity Assessment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Structured Notes */}
        {tab === "notes" && (
          <div className="p-6 space-y-8">
            
            {/* Notes Lock Info */}
            {isLocked && (
              <div className="p-3 rounded-lg bg-slate-900 border flex gap-2 text-slate-400 text-xs" style={{ borderColor: BORDER }}>
                <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                <span>Notes are locked from editing while the ticket is under review or closed.</span>
              </div>
            )}

            {/* 2a. Timeline of Events */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" /> Timeline of Incident Events
                  </h3>
                  <p className="text-[11px] text-slate-500">Document the chronological order of suspicious events.</p>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus["timeline"] === "saved" && (
                    <span className="text-emerald-400 text-xs font-semibold">✓ Saved</span>
                  )}
                  {!isLocked && (
                    <>
                      <button 
                        onClick={() => {
                          const nowStr = new Date().toISOString().slice(0, 16);
                          setTimeline([...timeline, { occurred_at: nowStr, description: "" }]);
                        }}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 text-blue-400" /> Add Event
                      </button>
                      <button 
                        onClick={handleSaveTimeline}
                        className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Timeline
                      </button>
                    </>
                  )}
                </div>
              </div>

              {timeline.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-2">No timeline events documented.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-900/20 p-3 rounded-lg border border-slate-800/80">
                      <div className="w-1/4 min-w-[170px]">
                        <input 
                          type="datetime-local"
                          value={entry.occurred_at.slice(0, 16)}
                          onChange={(e) => {
                            setTimeline(timeline.map((item, i) => i === idx ? { ...item, occurred_at: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <textarea 
                          rows={2}
                          value={entry.description}
                          onChange={(e) => {
                            setTimeline(timeline.map((item, i) => i === idx ? { ...item, description: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="Describe the event activity..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full resize-none outline-none"
                        />
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => setTimeline(timeline.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1.5 mt-0.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2b. Indicators of Compromise (IOCs) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Search className="h-4 w-4 text-purple-400" /> Indicators of Compromise (IOCs)
                  </h3>
                  <p className="text-[11px] text-slate-500">Log IP addresses, domain names, hashes, or emails linked to threat actors.</p>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus["iocs"] === "saved" && (
                    <span className="text-emerald-400 text-xs font-semibold">✓ Saved</span>
                  )}
                  {!isLocked && (
                    <>
                      <button 
                        onClick={() => setIocs([...iocs, { type: "IP", value: "", description: "" }])}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 text-purple-400" /> Add IOC
                      </button>
                      <button 
                        onClick={handleSaveIocs}
                        className="flex items-center gap-1 text-[11px] bg-[#6366f1] hover:bg-[#4f46e5] text-white px-2.5 py-1.5 rounded-lg"
                      >
                        <Save className="h-3.5 w-3.5" /> Save IOCs
                      </button>
                    </>
                  )}
                </div>
              </div>

              {iocs.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-2">No Indicators of Compromise recorded.</p>
              ) : (
                <div className="space-y-3">
                  {iocs.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-900/20 p-3 rounded-lg border border-slate-800/80">
                      <div className="w-[120px] shrink-0">
                        <select 
                          value={entry.type}
                          onChange={(e) => {
                            setIocs(iocs.map((item, i) => i === idx ? { ...item, type: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        >
                          <option value="IP">IP Address</option>
                          <option value="Domain">Domain</option>
                          <option value="Hash">Hash (SHA-256)</option>
                          <option value="Email">Email Address</option>
                        </select>
                      </div>
                      <div className="w-1/3 min-w-[200px]">
                        <input 
                          type="text"
                          value={entry.value}
                          onChange={(e) => {
                            setIocs(iocs.map((item, i) => i === idx ? { ...item, value: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="IOC value..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={entry.description ?? ""}
                          onChange={(e) => {
                            setIocs(iocs.map((item, i) => i === idx ? { ...item, description: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="Relevance / context..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => setIocs(iocs.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2c. Affected Systems/Assets */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-400" /> Affected Systems / Critical Assets
                  </h3>
                  <p className="text-[11px] text-slate-500">Record hosts, servers, database engines, or subnets impacted.</p>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus["affectedSystems"] === "saved" && (
                    <span className="text-emerald-400 text-xs font-semibold">✓ Saved</span>
                  )}
                  {!isLocked && (
                    <>
                      <button 
                        onClick={() => setAffectedSystems([...affectedSystems, { asset_name: "", asset_type: "Workstation", impact_level: "Low" }])}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 text-cyan-400" /> Add Asset
                      </button>
                      <button 
                        onClick={handleSaveAffectedSystems}
                        className="flex items-center gap-1 text-[11px] bg-[#06b6d4] hover:bg-[#0891b2] text-white px-2.5 py-1.5 rounded-lg"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Systems
                      </button>
                    </>
                  )}
                </div>
              </div>

              {affectedSystems.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-2">No affected systems recorded.</p>
              ) : (
                <div className="space-y-3">
                  {affectedSystems.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-900/20 p-3 rounded-lg border border-slate-800/80">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 mb-1">Asset Hostname/Name</label>
                        <input 
                          type="text"
                          value={entry.asset_name}
                          onChange={(e) => {
                            setAffectedSystems(affectedSystems.map((item, i) => i === idx ? { ...item, asset_name: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="e.g. DC-PROD-01..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="w-[150px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Asset Type</label>
                        <input 
                          type="text"
                          value={entry.asset_type}
                          onChange={(e) => {
                            setAffectedSystems(affectedSystems.map((item, i) => i === idx ? { ...item, asset_type: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="e.g. Active Directory..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="w-[120px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Impact Level</label>
                        <select 
                          value={entry.impact_level}
                          onChange={(e) => {
                            setAffectedSystems(affectedSystems.map((item, i) => i === idx ? { ...item, impact_level: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        >
                          <option value="None">None</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => setAffectedSystems(affectedSystems.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1.5 mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2d. Actions Taken / Containment Steps */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Containment Actions & Containment Steps
                  </h3>
                  <p className="text-[11px] text-slate-500">Log immediate actions executed to contain and eradicate the event threat.</p>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus["actionsTaken"] === "saved" && (
                    <span className="text-emerald-400 text-xs font-semibold">✓ Saved</span>
                  )}
                  {!isLocked && (
                    <>
                      <button 
                        onClick={() => {
                          const nowStr = new Date().toISOString().slice(0, 16);
                          setActionsTaken([...actionsTaken, { occurred_at: nowStr, action: "", performed_by: currentUser?.name ?? "" }]);
                        }}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 text-emerald-400" /> Add Step
                      </button>
                      <button 
                        onClick={handleSaveActionsTaken}
                        className="flex items-center gap-1 text-[11px] bg-[#10b981] hover:bg-[#059669] text-white px-2.5 py-1.5 rounded-lg"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Containment Steps
                      </button>
                    </>
                  )}
                </div>
              </div>

              {actionsTaken.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-2">No containment steps recorded.</p>
              ) : (
                <div className="space-y-3">
                  {actionsTaken.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-900/20 p-3 rounded-lg border border-slate-800/80">
                      <div className="w-[170px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Execution Time</label>
                        <input 
                          type="datetime-local"
                          value={entry.occurred_at.slice(0, 16)}
                          onChange={(e) => {
                            setActionsTaken(actionsTaken.map((item, i) => i === idx ? { ...item, occurred_at: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 mb-1">Mitigation Action Taken</label>
                        <input 
                          type="text"
                          value={entry.action}
                          onChange={(e) => {
                            setActionsTaken(actionsTaken.map((item, i) => i === idx ? { ...item, action: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="e.g. Blocked external IP on firewall..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="w-[140px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Performed By</label>
                        <input 
                          type="text"
                          value={entry.performed_by}
                          onChange={(e) => {
                            setActionsTaken(actionsTaken.map((item, i) => i === idx ? { ...item, performed_by: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => setActionsTaken(actionsTaken.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1.5 mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Evidence Chain of Custody */}
        {tab === "evidence" && (
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
              <div>
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-400" /> Evidence Chain of Custody Files
                </h2>
                <p className="text-[11px] text-slate-500">Legally track uploaded forensic images, log captures, and files.</p>
              </div>
              
              {!isLocked && (
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm">
                  <Upload className="h-3.5 w-3.5" /> Upload Forensic Evidence
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {ticket.attachments.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-slate-900/20 border border-slate-850">
                <Upload className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No evidence attachments uploaded.</p>
                <p className="text-slate-500 text-xs mt-1">Forensic logs and files are required before resolution can be submitted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ticket.attachments.map((file) => (
                  <div key={file.id} className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-200 text-sm font-semibold truncate max-w-[280px]">{file.original_name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{(file.size_bytes / 1024).toFixed(2)} KB</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-400">
                        <div>
                          <strong>Uploaded By:</strong> {file.user?.name || "System Analyst"}
                        </div>
                        <div>
                          <strong>Timestamp:</strong> {new Date(file.created_at).toLocaleString()}
                        </div>
                        <div className="md:col-span-2 font-mono text-[10px] text-slate-400/90 break-all bg-slate-950/60 p-1.5 rounded mt-1 border border-slate-800/70">
                          <strong>SHA-256 File Hash:</strong> {file.file_hash || "No Hash Available"}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[11px] text-slate-300 leading-relaxed italic">
                        <strong>Evidence Relevance:</strong> {file.description ?? "No description provided."}
                      </div>
                    </div>

                    <a 
                      href={`/storage/${file.file_path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded border border-slate-750 shrink-0 align-self-end sm:align-self-center"
                    >
                      <Eye className="h-3.5 w-3.5" /> View File
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence Relevance Modal */}
            {showUploadModal && uploadFile && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-[#0d1e35] border border-slate-850 p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl">
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-400" /> Finalize Evidence Upload
                  </h3>
                  
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-800">
                    <p className="text-slate-400 text-xs">File selected:</p>
                    <p className="text-slate-200 text-xs font-mono font-semibold mt-0.5">{uploadFile.name}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-300 text-xs font-medium">
                      Evidence Description / SOC Relevance <span className="text-rose-400">*</span>
                    </label>
                    <textarea 
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      rows={4}
                      placeholder="Explain how this file relates to the incident, what it contains, and its role in the investigation..."
                      className="w-full text-xs p-2.5 rounded bg-slate-950 border text-slate-200 outline-none resize-none"
                      style={{ borderColor: BORDER }}
                    />
                    <p className="text-[10px] text-slate-500">This description acts as chain of custody documentation and is required.</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleEvidenceUploadFinalize}
                      disabled={!evidenceDescription.trim() || uploading}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-40"
                    >
                      {uploading ? "Uploading & Hashing..." : "Finalize & Upload"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Findings & Resolution */}
        {tab === "findings" && (
          <div className="p-6 space-y-6">
            
            {/* Resolution Checklist Status */}
            {!isLocked && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <h4 className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Resolution Submission Checklist</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      rootCauseCategory.trim() && rootCauseExplanation.trim() && lessonsLearned.trim()
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}>✓</div>
                    <span className="text-slate-400">Root Cause Analysis & Lessons Learned completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      (incident?.attachments?.length ?? 0) > 0
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}>✓</div>
                    <span className="text-slate-400">Evidence files uploaded ({(incident?.attachments?.length ?? 0)} attached)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[11px] text-slate-500">All checklist requirements must be met before resolving and closing the incident.</span>
                  
                  <button 
                    onClick={handleSubmitResolutionFlow}
                    disabled={!canSubmitResolution}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Resolve & Close Incident
                  </button>
                </div>
              </div>
            )}

            {/* 4a. Root Cause Analysis Category */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" /> Root Cause Analysis
                </h3>
                {saveStatus["findings"] === "saved" && (
                  <span className="text-emerald-400 text-xs font-semibold">✓ Saved</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">Root Cause Category</label>
                  <select 
                    value={rootCauseCategory} 
                    onChange={(e) => setRootCauseCategory(e.target.value)}
                    disabled={isLocked}
                    className="w-full bg-[#080d1a] border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="Human Error">Human Error</option>
                    <option value="System Vulnerability">System Vulnerability</option>
                    <option value="Third-Party">Third-Party Partner</option>
                    <option value="Malicious Insider">Malicious Insider</option>
                    <option value="External Attack">External Threat Actor</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-xs mb-1.5">Detailed Root Cause Explanation</label>
                  <textarea 
                    value={rootCauseExplanation} 
                    onChange={(e) => setRootCauseExplanation(e.target.value)}
                    disabled={isLocked}
                    rows={4}
                    placeholder="Provide technical investigation details on why the compromise happened..."
                    className="w-full text-xs p-2.5 rounded bg-slate-950 border text-slate-200 outline-none resize-none"
                    style={{ borderColor: BORDER }}
                  />
                </div>
              </div>
            </div>

            {/* 4b. Remediation Actions */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Long-Term Remediation Actions
                  </h3>
                  <p className="text-[11px] text-slate-500">Document system patches, audits, or credential rotations assigned to users.</p>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus["remediation"] === "saved" && (
                    <span className="text-emerald-400 text-xs font-semibold">✓ Saved</span>
                  )}
                  {!isLocked && (
                    <>
                      <button 
                        onClick={() => setRemediationActions([...remediationActions, { 
                          description: "", 
                          owner_id: activeUsers[0]?.id ?? 0, 
                          due_date: new Date().toISOString().slice(0, 10), 
                          status: "Pending" 
                        }])}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 text-emerald-400" /> Add Remediation
                      </button>
                      <button 
                        onClick={handleSaveRemediationActions}
                        className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Actions
                      </button>
                    </>
                  )}
                </div>
              </div>

              {remediationActions.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-2">No remediation actions defined.</p>
              ) : (
                <div className="space-y-3">
                  {remediationActions.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-900/20 p-3 rounded-lg border border-slate-800/80">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 mb-1">Action Description</label>
                        <input 
                          type="text"
                          value={entry.description}
                          onChange={(e) => {
                            setRemediationActions(remediationActions.map((item, i) => i === idx ? { ...item, description: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          placeholder="e.g. Patch DC-PROD-01 to version..."
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="w-[180px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Action Owner</label>
                        <select 
                          value={entry.owner_id}
                          onChange={(e) => {
                            setRemediationActions(remediationActions.map((item, i) => i === idx ? { ...item, owner_id: parseInt(e.target.value) } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        >
                          {activeUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.job_title ?? "Analyst"})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-[130px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Due Date</label>
                        <input 
                          type="date"
                          value={entry.due_date ? String(entry.due_date).slice(0, 10) : ""}
                          onChange={(e) => {
                            setRemediationActions(remediationActions.map((item, i) => i === idx ? { ...item, due_date: e.target.value } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        />
                      </div>
                      <div className="w-[110px] shrink-0">
                        <label className="block text-[10px] text-slate-500 mb-1">Status</label>
                        <select 
                          value={entry.status}
                          onChange={(e) => {
                            setRemediationActions(remediationActions.map((item, i) => i === idx ? { ...item, status: e.target.value as any } : item));
                          }}
                          disabled={isLocked}
                          className="bg-[#080d1a] border border-slate-800 text-xs text-slate-300 rounded p-1.5 w-full outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => setRemediationActions(remediationActions.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1.5 mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4c. Lessons Learned */}
            <div className="space-y-3">
              <label className="block text-slate-300 text-xs font-semibold">Lessons Learned & Recommendations</label>
              <textarea 
                value={lessonsLearned} 
                onChange={(e) => setLessonsLearned(e.target.value)}
                disabled={isLocked}
                rows={5}
                placeholder="What did the SOC learn? How can we prevent similar compromise events from repeating..."
                className="w-full text-xs p-2.5 rounded bg-slate-950 border text-slate-200 outline-none resize-none"
                style={{ borderColor: BORDER }}
              />
            </div>

            {!isLocked && (
              <button 
                onClick={handleSaveFindings}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Save className="h-4 w-4" /> Save Findings & Root Cause
              </button>
            )}
          </div>
        )}

        {/* Tab 5: Audit Log Trail */}
        {tab === "audit" && (
          <div className="p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2 pb-2 border-b border-slate-700/50">
              <Clock className="h-4 w-4 text-blue-400" /> Incident Audit Log Trail
            </h2>

            {loadingAudit ? (
              <p className="text-slate-400 text-xs">Loading incident activities trail...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No audit trail logs recorded for this incident.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-850 font-semibold">
                      <th className="p-3">User</th>
                      <th className="p-3">Action Type</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Logged Date / Time</th>
                      <th className="p-3">Changes Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 border-b border-slate-850 transition-all">
                        <td className="p-3 text-slate-200 font-semibold">{log.user?.name || "System Task"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {log.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{log.ip_address || "Internal"}</td>
                        <td className="p-3 text-slate-300">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3 text-slate-400 text-[11px] truncate max-w-[280px]">
                          {log.metadata ? JSON.stringify(log.metadata) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
