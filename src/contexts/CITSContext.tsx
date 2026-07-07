import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../services/authService";
import type { User } from "../interfaces";

export type UserRole = "admin" | "analyst" | "user";

export interface CITSUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rawRole: 'Admin' | 'Analyst';
  avatar: string;
  department: string;
  lastLogin: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "pending" | "resolved" | "closed";
  description: string;
  submittedBy: string;
  assignedTo?: string;
  dateSubmitted: string;
  lastUpdated: string;
  location: string;
  attachments: number;
  updates: TicketUpdate[];
}

export interface TicketUpdate {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  message: string;
  type: "note" | "status" | "assignment" | "resolution";
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  activityType: string;
  details: string;
}

export const MOCK_TICKETS: Ticket[] = [];

export const MOCK_USERS: ManagedUser[] = [];

export const MOCK_AUDIT: AuditEntry[] = [];

interface CITSContextType {
  currentUser: CITSUser | null;
  currentPage: string;
  selectedTicketId: string | null;
  notifications: number;
  login: (email: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  navigate: (page: string, ticketId?: string) => void;
}

export const CITSContext = createContext<CITSContextType | null>(null);

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "U";
}

function mapRole(primaryRole: User["primary_role"]): UserRole {
  // primaryRole is the slug from roles table: "administrator", "security-analyst", or "user"
  if (primaryRole === "administrator") return "admin";
  if (primaryRole === "security-analyst") return "analyst";
  if (primaryRole === "user") return "user";
  
  // Default to user for safety
  return "user";
}

function mapUser(user: any): CITSUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: mapRole(user.primary_role),
    rawRole: user.roles?.[0]?.name ?? "User",
    avatar: getInitials(user.name),
    department: user.department ?? "Unassigned",
    lastLogin: user.last_login_at ?? "Never",
  };
}

export function CITSProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CITSUser | null>(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [notifications] = useState(0);

  useEffect(() => {
    let mounted = true;

    // Only attempt to fetch the current user if we have a stored auth token.
    const token = localStorage.getItem('cits_auth_token');
    if (!token) {
      return () => {
        mounted = false;
      };
    }

    getCurrentUser()
      .then(({ user }) => {
        if (!mounted) {
          return;
        }

        const mappedUser = mapUser(user);
        setCurrentUser(mappedUser);
        setCurrentPage(
          mappedUser.role === "admin"
            ? "admin-dashboard"
            : mappedUser.role === "analyst"
              ? "analyst-dashboard"
              : "user-dashboard",
        );
      })
      .catch(() => {
        // Token is invalid/expired, remove it
        localStorage.removeItem('cits_auth_token');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string, remember: boolean): Promise<boolean> => {
    try {
      const { user } = await apiLogin({ email, password, remember });
      const mappedUser = mapUser(user);
      setCurrentUser(mappedUser);
      if (mappedUser.role === "admin") setCurrentPage("admin-dashboard");
      else if (mappedUser.role === "analyst") setCurrentPage("analyst-dashboard");
      else setCurrentPage("user-dashboard");
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout failures and clear local state.
    }

    setCurrentUser(null);
    setCurrentPage("login");
  };

  const navigate = (page: string, ticketId?: string) => {
    setCurrentPage(page);
    if (ticketId) setSelectedTicketId(ticketId);
  };

  return (
    <CITSContext.Provider value={{ currentUser, currentPage, selectedTicketId, notifications, login, logout, navigate }}>
      {children}
    </CITSContext.Provider>
  );
}

export function useCITS() {
  const ctx = useContext(CITSContext);
  if (!ctx) throw new Error("useCITS must be used within CITSProvider");
  return ctx;
}

export const severityColor = (s: string) => {
  if (s === "critical") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (s === "high") return "text-orange-400 bg-orange-400/10 border-orange-400/30";
  if (s === "medium") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  return "text-green-400 bg-green-400/10 border-green-400/30";
};

export const statusColor = (s: string) => {
  if (s === "new") return "text-blue-400 bg-blue-400/10 border-blue-400/30";
  if (s === "investigating") return "text-purple-400 bg-purple-400/10 border-purple-400/30";
  if (s === "contained") return "text-cyan-400 bg-cyan-400/10 border-cyan-400/30";
  if (s === "eradicated") return "text-orange-400 bg-orange-400/10 border-orange-400/30";
  if (s === "recovering") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  if (s === "closed") return "text-green-400 bg-green-400/10 border-green-400/30";
  return "text-slate-400 bg-slate-400/10 border-slate-400/30";
};

export const statusLabel = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
