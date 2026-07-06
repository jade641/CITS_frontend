import { useEffect, useState } from "react";
import { Bell, CheckCheck, Ticket, UserRound, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import type { Notification } from "../interfaces";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function notificationIcon(type: string) {
  if (type === "incident.created") return <Ticket className="h-4 w-4 text-blue-400" />;
  if (type === "incident.assigned") return <UserRound className="h-4 w-4 text-cyan-400" />;
  if (type === "incident.resolved") return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  if (type === "incident.closed") return <CheckCheck className="h-4 w-4 text-slate-300" />;
  if (type === "incident.status_changed") return <RefreshCw className="h-4 w-4 text-amber-400" />;
  return <AlertTriangle className="h-4 w-4 text-slate-400" />;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.notifications.data);
      setUnreadCount(response.unreadCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await refresh();
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    await refresh();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">Ticket submitted, assigned, updated, resolved, and closed events.</p>
        </div>
        <button onClick={handleMarkAllRead}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
          Mark all read
        </button>
      </div>

      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-400" />
          <p className="text-slate-200 text-sm font-medium">Unread notifications</p>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-400 text-xs font-semibold border border-blue-400/20">
          {unreadCount}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {loading ? (
          <div className="p-6 text-slate-400 text-sm">Loading notifications...</div>
        ) : !notifications.length ? (
          <div className="p-6 text-slate-500 text-sm">No notifications available yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => void handleMarkRead(notification.id)}
                className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors"
                style={{ opacity: notification.read_at ? 0.7 : 1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{notificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-slate-100 text-sm font-medium">{notification.title}</p>
                      <span className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(notification.created_at)}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{notification.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}