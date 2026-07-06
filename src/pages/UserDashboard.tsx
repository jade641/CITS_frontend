import { useEffect, useState } from "react";
import { Ticket, Plus, ChevronRight, Bell } from "lucide-react";
import { useCITS, severityColor, statusColor, statusLabel } from "../contexts/CITSContext";
import type { Incident, Notification } from "../interfaces";
import { listIncidents } from "../services/incidentService";
import { getNotifications } from "../services/notificationService";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function UserDashboard() {
  const { currentUser, navigate } = useCITS();
  const [tickets, setTickets] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    Promise.all([listIncidents({ mine: true, page: 1 }), getNotifications()])
      .then(([incidentResponse, notificationResponse]) => {
        if (!active) return;
        setTickets(incidentResponse.data);
        setNotifications(notificationResponse.notifications.data);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load your recent tickets and notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recentTickets = tickets.slice(0, 4);
  const recentNotifications = notifications.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {currentUser?.name.split(" ")[0]}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Report incidents, track progress, and review updates in one place.</p>
        </div>
        <button
          onClick={() => navigate("report-incident")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
        >
          <Plus className="h-4 w-4" />
          Report Incident
        </button>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm text-red-200" style={{ background: "rgba(127,29,29,0.35)", border: "1px solid rgba(239,68,68,0.35)" }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl p-4 text-sm text-slate-400" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          Loading your recent incidents and notifications...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-blue-400" />
              <h2 className="text-white font-semibold text-sm">Recent Ticket Status</h2>
            </div>
            <button onClick={() => navigate("my-tickets")} className="text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Ticket ID", "Title", "Severity", "Status", "Submitted"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!recentTickets.length ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">
                      No incident tickets submitted yet.
                    </td>
                  </tr>
                ) : recentTickets.map((t, i) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors cursor-pointer" style={{ borderBottom: i < recentTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}
                    onClick={() => navigate("ticket-details", String(t.id))}>
                    <td className="px-5 py-3 font-mono text-blue-400 text-xs whitespace-nowrap">{t.ticket_number}</td>
                    <td className="px-5 py-3 text-slate-200 max-w-[180px] truncate">{t.title}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${severityColor(t.severity)}`}>
                        {t.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor(t.status?.slug ?? "")}`}>
                        {statusLabel(t.status?.name ?? "Unknown")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDateTime(t.reported_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400" />
              <h2 className="text-white font-semibold text-sm">Recent Notifications</h2>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-400 text-xs font-semibold border border-blue-400/20">
              {recentNotifications.length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {!recentNotifications.length ? (
              <div className="p-3 rounded-lg text-center text-slate-500 text-xs" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                No notifications yet.
              </div>
            ) : recentNotifications.map(n => (
              <div key={n.id} className="p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === "ticket.assigned" ? "bg-cyan-400" : n.type === "incident.created" ? "bg-blue-400" : n.type === "incident.status_changed" ? "bg-amber-400" : "bg-purple-400"
                    }`} />
                  <div>
                    <p className="text-slate-300 text-xs leading-relaxed">{n.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
