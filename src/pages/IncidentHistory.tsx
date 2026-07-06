import { useEffect, useState } from "react";
import { Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

export default function IncidentHistory() {
  const { currentUser, navigate } = useCITS();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load incidents from API (assigned to current user) and show resolved/closed
  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        const resp = await listIncidents({ per_page: 200, assigned_to_me: true });
        if (!active) return;

        // resp.data is the array in PaginatedResponse
        setIncidents(resp.data || []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.response?.data?.message || String(err) || "Failed to load incidents");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [currentUser]);

  // Get all historical incidents (resolved or closed) assigned to current user
  const historicalIncidents = incidents.filter((i) => {
    const slug = i.status?.slug ?? "";
    return slug === "resolved" || slug === "closed" || Boolean(i.status?.is_closed);
  });

  // No extra filters: show all historical incidents
  const filteredIncidents = historicalIncidents;

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Stats removed — table only view with pagination

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Incident History</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Historical record of resolved and failed incidents
        </p>
      </div>

      {/* Table-only view: no stats or filters */}

      {/* History Table */}
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
                  "Submitted",
                  "Resolved",
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <p className="text-slate-400 text-sm">Loading historical incidents...</p>
                    </td>
                  </tr>
                ) : paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-10 w-10 text-slate-600" />
                      <p className="text-slate-400 text-sm">No historical incidents found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((incident: any, i: number) => {
                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-white/5 transition-colors"
                      style={{
                        borderBottom: i < paginatedIncidents.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-blue-400 text-xs">{incident.ticket_number ?? incident.id}</td>
                      <td className="px-4 py-3 text-slate-200 text-sm max-w-[200px] truncate">
                        {incident.title}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{incident.category?.name ?? "Uncategorized"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(
                            incident.severity
                          )}`}
                        >
                          {incident.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(
                            incident.status?.slug ?? ""
                          )}`}
                        >
                          {statusLabel(incident.status?.slug ?? "")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{incident.reported_at ? new Date(incident.reported_at).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{(incident.resolved_at || incident.closed_at || incident.updated_at) ? new Date(incident.resolved_at || incident.closed_at || incident.updated_at).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate("investigation", String(incident.id))}
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

        {/* Pagination */}
        {filteredIncidents.length > itemsPerPage && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <p className="text-slate-400 text-xs">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of{" "}
              {filteredIncidents.length} incidents
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-slate-300 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ border: `1px solid ${BORDER}` }}
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
