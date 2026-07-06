import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, BookOpen, ClipboardList, FileWarning, FileText, LayoutDashboard, Lock, LogOut, Menu, Search, Settings, Ticket, UserCog, Users, X, BarChart2 } from "lucide-react";
import InfoSecLogo from "../../Logo/InfoSec_Logo.png";
import { useCITS } from "../contexts/CITSContext";

const BG = "#060c1a";
const SIDEBAR = "#080f1e";
const BORDER = "rgba(30,60,100,0.35)";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV: NavItem[] = [
  { id: "user-dashboard", label: "Home", icon: LayoutDashboard, roles: ["user"] },
  { id: "report-incident", label: "Report Incident", icon: FileWarning, roles: ["user"] },
  { id: "my-tickets", label: "My Tickets", icon: Ticket, roles: ["user"] },
  { id: "notifications", label: "Notifications", icon: Bell, roles: ["user"] },
  { id: "profile", label: "Profile", icon: UserCog, roles: ["user"] },
  { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { id: "analyst-dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["analyst"] },
  { id: "assigned-tickets", label: "Assigned Tickets", icon: ClipboardList, roles: ["analyst"] },
  { id: "investigation", label: "Investigations", icon: Search, roles: ["analyst"] },
  { id: "incident-history", label: "Incident History", icon: BookOpen, roles: ["analyst"] },
  { id: "reports", label: "Reports", icon: FileText, roles: ["analyst"] },
  { id: "settings", label: "Settings", icon: Settings, roles: ["analyst"] },
  { id: "ticket-management", label: "Ticket Management", icon: ClipboardList, roles: ["admin"] },
  { id: "user-management", label: "User Management", icon: Users, roles: ["admin"] },
  { id: "audit-logs", label: "Audit Logs", icon: BookOpen, roles: ["admin"] },
  { id: "analytics", label: "Analytics", icon: BarChart2, roles: ["admin"] },
  { id: "admin-reports", label: "Reports", icon: FileText, roles: ["admin"] },
  { id: "admin-settings", label: "Settings", icon: Settings, roles: ["admin", "user"] },
];

export default function CITSLayout({ children }: { children?: React.ReactNode }) {
  const { currentUser, currentPage, notifications, navigate, logout } = useCITS();
  const [collapsed, setCollapsed] = useState(false);

  const role = currentUser?.role ?? "user";
  const visibleNav = NAV.filter(item => item.roles.includes(role));
  const roleColor = role === "admin" ? "#ef4444" : role === "analyst" ? "#06b6d4" : "#3b82f6";
  const roleLabel = role === "admin" ? "Administrator" : role === "analyst" ? "Security Analyst" : "Employee";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#e2e8f0", fontFamily: "var(--font-body)" }}>
      <aside className="flex flex-col shrink-0 transition-all duration-300 relative z-20"
        style={{ width: collapsed ? "64px" : "240px", background: SIDEBAR, borderRight: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 px-4 py-5 shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1d3a6b,#0d2044)", border: "1px solid rgba(59,130,246,0.3)", boxShadow: "0 0 28px rgba(59,130,246,0.18)" }}>
            <img src={InfoSecLogo} alt="CITS" className="w-full h-full object-contain" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: "2px solid #080f1e" }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight">CITS</p>
              <p className="text-slate-500 text-xs font-mono">Employee Portal</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mx-3 my-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: roleColor }} />
            <span className="text-xs font-medium truncate" style={{ color: roleColor }}>{roleLabel}</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative"
                style={{
                  background: active ? "rgba(59,130,246,0.15)" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                  color: active ? "#93c5fd" : "#94a3b8",
                }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "#3b82f6" : undefined }} />
                {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                {!collapsed && item.id === "notifications" && notifications > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{notifications}</span>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-3 w-3 text-green-400" />
              <span className="text-green-400 text-xs font-semibold">Secure Session</span>
            </div>
            <p className="text-slate-500 text-xs font-mono">TLS 1.3 · AES-256</p>
          </div>
        )}

        <div className="px-2 pb-2 space-y-2">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-red-300 hover:text-white"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>

          <button onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 w-full rounded-lg text-slate-500 hover:text-white transition-colors"
            style={{ border: `1px solid ${BORDER}` }}>
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 flex items-center justify-between px-6 h-14"
          style={{ background: "rgba(8,15,30,0.95)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-500 font-mono hidden sm:block">INCIDENT PORTAL</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 text-sm font-medium capitalize hidden md:block">
              {visibleNav.find(item => item.id === currentPage)?.label ?? "Home"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${roleColor}44, ${roleColor}22)`, border: `1px solid ${roleColor}44` }}>
                {currentUser?.avatar}
              </div>
              <span className="text-slate-300 text-sm hidden md:block">{currentUser?.name.split(" ")[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: BG }}>
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}