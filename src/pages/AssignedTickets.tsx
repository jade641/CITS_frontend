import { useEffect, useState } from "react";
import { Eye, Filter, Search, Calendar, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

export default function AssignedTickets() {
  const { currentUser, navigate } = useCITS();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Incident[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await listIncidents({ assigned_to_me: true });
        if (!active) {
          return;
        }

        setAssignedTickets(response.data || []);
      } catch (err: any) {
        if (!active) {
          return;
        }

        setAssignedTickets([]);
        setError(err?.response?.data?.message || "Failed to load assigned tickets");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (currentUser) {
      loadTickets();
    } else {
      setAssignedTickets([]);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [currentUser]);

  const filteredTickets = assignedTickets.filter((t: Incident) => {
    const statusSlug = t.status?.slug ?? "";
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "" || t.severity === filterSeverity;
    const matchesStatus = filterStatus === "" || statusSlug === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const getPriorityFromSeverity = (severity: string) => {
    if (severity === "critical") return "High";
    if (severity === "high") return "High";
    if (severity === "medium") return "Medium";
    return "Low";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "High") return "text-red-400";
    if (priority === "Medium") return "text-yellow-400";
    return "text-green-400";
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="rounded-xl p-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-400 text-sm">Loading assigned tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          {error}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Assigned Tickets</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Incidents assigned to {currentUser?.name ?? "you"} for investigation
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Assigned",
            value: assignedTickets.length,
            color: "#3b82f6",
            icon: AlertTriangle,
          },
          {
            label: "In Progress",
            value: assignedTickets.filter((t: Incident) => t.status?.slug === "in_progress").length,
            color: "#8b5cf6",
            icon: Calendar,
          },
          {
            label: "Pending Review",
            value: assignedTickets.filter((t: Incident) => t.status?.slug === "pending").length,
            color: "#f59e0b",
            icon: AlertTriangle,
          },
          {
            label: "Critical Priority",
            value: assignedTickets.filter((t: Incident) => t.severity === "critical").length,
            color: "#ef4444",
            icon: AlertTriangle,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}
              >
                <Icon className="h-6 w-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket ID or title..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-slate-200 outline-none"
              style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-slate-300 outline-none cursor-pointer"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-slate-300 outline-none cursor-pointer"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
          >
            <option value="">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setFilterSeverity("");
              setFilterStatus("");
              setCurrentPage(1);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-300"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}
          >
            <Filter className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {[
                  "Ticket ID",
                  "Incident Title",
                  "Category",
                  "Severity",
                  "Status",
                  "Assigned Date",
                  "Priority",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-10 w-10 text-slate-600" />
                      <p className="text-slate-400 text-sm">No tickets found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket: Incident, i: number) => {
                  const statusSlug = ticket.status?.slug ?? "";
                  const priority = getPriorityFromSeverity(ticket.severity);
                  const priorityColor = getPriorityColor(priority);
                  const assignedAt = ticket.assignments?.find((assignment) => assignment.is_active)?.assigned_at ?? ticket.reported_at;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-white/5 transition-colors"
                      style={{
                        borderBottom: i < paginatedTickets.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-blue-400 text-xs">#{ticket.ticket_number}</td>
                      <td className="px-4 py-3 text-slate-200 text-sm max-w-[200px] truncate">
                        {ticket.title}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{ticket.category?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(ticket.severity)}`}
                        >
                          {ticket.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(statusSlug)}`}
                        >
                          {statusLabel(statusSlug)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(assignedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${priorityColor}`}>{priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate("investigation", ticket.id.toString())}
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <Eye className="h-3 w-3" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <p className="text-slate-400 text-xs">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-slate-400 text-xs px-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
