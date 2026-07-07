import { useEffect, useState } from "react";
import { Ticket, Search, ChevronDown, Eye, Plus } from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

export default function MyTickets() {
  const { navigate } = useCITS();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [tickets, setTickets] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await listIncidents({ mine: true });
        if (!active) {
          return;
        }

        setTickets(response.data || []);
      } catch (err: any) {
        if (!active) {
          return;
        }

        setTickets([]);
        setError(err?.response?.data?.message || "Failed to load your incidents");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const statusSlug = ticket.status?.slug ?? "";
    const matchSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.category?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || statusSlug === filterStatus;
    const matchSeverity = filterSeverity === "all" || ticket.severity === filterSeverity;
    return matchSearch && matchStatus && matchSeverity;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="rounded-xl p-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-slate-400 text-sm">Loading your incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tickets</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found</p>
        </div>
        <button onClick={() => navigate("report-incident")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
          <Plus className="h-4 w-4" />
          New Incident
        </button>
      </div>

      <div className="rounded-xl p-4 flex flex-col sm:flex-row gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, or category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }} />
        </div>
        <div className="flex gap-2">
          {[
            { label: "Status", value: filterStatus, set: setFilterStatus, options: ["all", "new", "investigating", "contained", "eradicated", "recovering", "pending_review", "closed"] },
            { label: "Severity", value: filterSeverity, set: setFilterSeverity, options: ["all", "critical", "high", "medium", "low"] },
          ].map((filter) => (
            <div key={filter.label} className="relative">
              <select value={filter.value} onChange={(e) => filter.set(e.target.value)}
                className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
                {filter.options.map((option) => (
                  <option key={option} value={option}>{option === "all" ? `All ${filter.label}s` : statusLabel(option)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
          <Ticket className="h-4 w-4 text-blue-400" />
          <h2 className="text-white font-semibold text-sm">Incident Tickets</h2>
          <span className="ml-auto px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-400 text-xs font-semibold border border-blue-400/20">
            {filteredTickets.length} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Ticket ID", "Title", "Category", "Severity", "Status", "Date Submitted", "Actions"].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">No tickets match your search</td>
                </tr>
              ) : (
                filteredTickets.map((ticket, index) => {
                  const statusSlug = ticket.status?.slug ?? "";

                  return (
                    <tr key={ticket.id} className="hover:bg-white/5 transition-colors"
                      style={{ borderBottom: index < filteredTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td className="px-5 py-4 font-mono text-blue-400 text-xs whitespace-nowrap">{ticket.ticket_number}</td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-slate-200 text-xs font-medium max-w-[200px] truncate">{ticket.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{ticket.description.substring(0, 50)}…</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{ticket.category?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${severityColor(ticket.severity)}`}>
                          {ticket.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor(statusSlug)}`}>
                          {statusLabel(statusSlug)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{new Date(ticket.reported_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => navigate("ticket-details", ticket.id.toString())}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:text-white transition-colors"
                          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
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
      </div>
    </div>
  );
}
