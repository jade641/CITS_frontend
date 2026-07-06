import { useState, useEffect } from "react";
import { ClipboardList, Search, Eye, UserPlus, AlertTriangle, ChevronDown, X, Loader2 } from "lucide-react";
import { useCITS } from "../contexts/CITSContext";
import { listIncidents, assignIncident, updateIncident } from "../services/incidentService";
import { listUsers } from "../services/userService";
import type { Incident, SeverityLevel } from "../interfaces/incident";
import type { User } from "../interfaces/user";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

// Helper functions for UI styling
const severityColor = (severity: SeverityLevel) => {
  switch(severity) {
    case "critical": return "bg-red-500/10 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    case "low": return "bg-green-500/10 text-green-400 border-green-500/30";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/30";
  }
};

const statusColor = (slug: string) => {
  switch(slug) {
    case "open": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "assigned": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    case "in_progress": return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    case "resolved": return "bg-green-500/10 text-green-400 border-green-500/30";
    case "closed": return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  }
};

const statusLabel = (slug: string) => {
  switch(slug) {
    case "open": return "Open";
    case "assigned": return "Assigned";
    case "in_progress": return "In Progress";
    case "pending": return "Pending";
    case "resolved": return "Resolved";
    case "closed": return "Closed";
    default: return slug;
  }
};

export default function TicketManagement() {
  const { navigate } = useCITS();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [assignModal, setAssignModal] = useState<Incident | null>(null);
  const [priorityModal, setPriorityModal] = useState<Incident | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<number | null>(null);
  const [newPriority, setNewPriority] = useState<SeverityLevel | "">("");
  const [assignNote, setAssignNote] = useState("");

  // Fetch incidents and analysts on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch incidents
        const incidentsResponse = await listIncidents({ page: 1 });
        setIncidents(incidentsResponse.data);
        
        // Extract unique categories and statuses
        const uniqueCategories = [...new Set(incidentsResponse.data.map(i => i.category?.name).filter(Boolean))] as string[];
        const uniqueStatuses = [...new Set(incidentsResponse.data.map(i => i.status?.slug).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
        setStatuses(uniqueStatuses);
        
        // Fetch all active users to filter analysts
        const usersResponse = await listUsers({ status: 'active' });
        // Filter users with "Security Analyst" role
        const analystUsers = usersResponse.data.filter(u => 
          u.roles.some(r => r.slug === "security-analyst")
        );
        setAnalysts(analystUsers);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = (
      i.ticket_number.toLowerCase().includes(q) || 
      i.title.toLowerCase().includes(q) || 
      (i.category?.name ?? "").toLowerCase().includes(q) ||
      (i.current_assignee?.name ?? "").toLowerCase().includes(q)
    );
    const matchStatus = filterStatus === "all" || i.status?.slug === filterStatus;
    const matchSeverity = filterSeverity === "all" || i.severity === filterSeverity;
    const matchCategory = filterCategory === "all" || i.category?.name === filterCategory;
    
    return matchSearch && matchStatus && matchSeverity && matchCategory;
  });

  const doAssign = async () => {
    if (!assignModal || !selectedAnalyst) return;
    
    try {
      setAssignLoading(true);
      setError(null);
      
      // Call the assignment API
      await assignIncident(assignModal.id, selectedAnalyst, assignNote || "Assigned by Administrator");
      
      // Refresh incidents list
      const incidentsResponse = await listIncidents({ page: 1 });
      setIncidents(incidentsResponse.data);
      
      setSuccessMessage(`Ticket ${assignModal.ticket_number} assigned successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setAssignModal(null);
      setSelectedAnalyst(null);
      setAssignNote("");
      setAssignLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign ticket");
      setAssignLoading(false);
    }
  };

  const doChangePriority = async () => {
    if (!priorityModal || !newPriority) return;
    
    try {
      setPriorityLoading(true);
      setError(null);
      
      // Call the update incident API to change severity
      await updateIncident(priorityModal.id, { severity: newPriority });
      
      // Refresh incidents list
      const incidentsResponse = await listIncidents({ page: 1 });
      setIncidents(incidentsResponse.data);
      
      setSuccessMessage(`Priority updated for ticket ${priorityModal.ticket_number}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setPriorityModal(null);
      setNewPriority("");
      setPriorityLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update priority");
      setPriorityLoading(false);
    }
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status?.slug === "open").length,
    unassigned: incidents.filter(i => !i.current_assignee_id).length,
    critical: incidents.filter(i => i.severity === "critical").length,
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading ticket data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5 text-red-400" /></button>
        </div>
      )}
      
      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-cyan-400" />
                <h2 className="text-white font-semibold text-sm">Assign Security Analyst</h2>
              </div>
              <button onClick={() => { setAssignModal(null); setSelectedAnalyst(null); setAssignNote(""); }} disabled={assignLoading}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <p className="text-blue-400 text-xs font-mono">{assignModal.ticket_number}</p>
                <p className="text-white text-sm mt-0.5">{assignModal.title}</p>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Select Security Analyst</label>
                <div className="relative">
                  <select 
                    value={selectedAnalyst ?? ""} 
                    onChange={e => setSelectedAnalyst(Number(e.target.value))}
                    disabled={assignLoading}
                    className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none appearance-none disabled:opacity-50"
                    style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
                    <option value="">Choose an analyst...</option>
                    {analysts.length === 0 ? (
                      <option value="" disabled>No analysts available</option>
                    ) : (
                      analysts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Assignment Note (Optional)</label>
                <textarea 
                  value={assignNote}
                  onChange={e => setAssignNote(e.target.value)}
                  disabled={assignLoading}
                  placeholder="Add notes about this assignment..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none disabled:opacity-50 resize-none"
                  style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setAssignModal(null); setSelectedAnalyst(null); setAssignNote(""); }} 
                  disabled={assignLoading}
                  className="flex-1 py-2 rounded-lg text-sm text-slate-400 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                  Cancel
                </button>
                <button 
                  onClick={doAssign} 
                  disabled={!selectedAnalyst || assignLoading} 
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#0e7490,#0891b2)" }}>
                  {assignLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority modal */}
      {priorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <h2 className="text-white font-semibold text-sm">Change Priority</h2>
              </div>
              <button onClick={() => { setPriorityModal(null); setNewPriority(""); }} disabled={priorityLoading}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-400 text-xs">
                Current: <span className={`font-semibold ${
                  priorityModal.severity === "critical" ? "text-red-400" : 
                  priorityModal.severity === "high" ? "text-orange-400" : 
                  priorityModal.severity === "medium" ? "text-yellow-400" : 
                  "text-green-400"
                }`}>
                  {priorityModal.severity.toUpperCase()}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["low","medium","high","critical"] as SeverityLevel[]).map(s => {
                  const c = s === "critical" ? "#ef4444" : s === "high" ? "#f97316" : s === "medium" ? "#eab308" : "#22c55e";
                  return (
                    <button 
                      key={s} 
                      onClick={() => setNewPriority(s)}
                      disabled={priorityLoading}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                      style={{
                        border: `2px solid ${newPriority === s ? c : BORDER}`,
                        background: newPriority === s ? `${c}18` : "transparent",
                        color: newPriority === s ? c : "#94a3b8"
                      }}>
                      {s.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setPriorityModal(null); setNewPriority(""); }} 
                  disabled={priorityLoading}
                  className="flex-1 py-2 rounded-lg text-sm text-slate-400 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                  Cancel
                </button>
                <button 
                  onClick={doChangePriority} 
                  disabled={!newPriority || priorityLoading} 
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#b45309,#d97706)" }}>
                  {priorityLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ticket Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage, assign, and prioritize all incident tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: stats.total, color: "#3b82f6" },
          { label: "Open", value: stats.open, color: "#f59e0b" },
          { label: "Unassigned", value: stats.unassigned, color: "#ef4444" },
          { label: "Critical", value: stats.critical, color: "#dc2626" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 flex flex-wrap gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }} />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
            <option value="all">All Status</option>
            {statuses.map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
          <ClipboardList className="h-4 w-4 text-blue-400" />
          <h2 className="text-white font-semibold text-sm">All Incidents</h2>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} of {incidents.length} tickets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["ID","Title","Category","Severity","Status","Assigned To","Date","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500 text-sm">
                    {incidents.length === 0 ? "No incidents available." : "No incidents match your filters."}
                  </td>
                </tr>
              ) : filtered.map((incident, i) => {
                const isUnassigned = !incident.current_assignee_id;
                const canAssign = incident.status?.slug === "open" || isUnassigned;
                
                return (
                  <tr key={incident.id} className="hover:bg-white/5 transition-colors"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td className="px-4 py-3 font-mono text-blue-400 text-xs whitespace-nowrap">{incident.ticket_number}</td>
                    <td className="px-4 py-3 text-slate-200 text-xs max-w-[160px] truncate">{incident.title}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{incident.category?.name ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(incident.status?.slug ?? "")}`}>
                        {statusLabel(incident.status?.slug ?? "")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {incident.current_assignee?.name ?? <span className="text-red-400/70">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(incident.reported_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => navigate("ticket-details", incident.id.toString())}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" 
                          title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canAssign && (
                          <button 
                            onClick={() => setAssignModal(incident)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors" 
                            title="Assign Analyst">
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => { setPriorityModal(incident); setNewPriority(incident.severity); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors" 
                          title="Change Priority">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
