import { useEffect, useState } from "react";
import { Users, Plus, Search, Edit3, Trash2, UserCheck, UserX, ChevronDown, X, Shield } from "lucide-react";
import { listUsers } from "../services/userService";
import type { ManagedUser, UserRole } from "../contexts/CITSContext";
import type { User as ApiUser } from "../interfaces/user";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const roleColor = (r: string) => r === "admin" ? "#ef4444" : r === "analyst" ? "#06b6d4" : "#3b82f6";
const roleLabel = (r: string) => r === "admin" ? "Administrator" : r === "analyst" ? "Security Analyst" : "Employee";

type User = ManagedUser;

function UserModal({ user, onClose, onSave }: { user?: User | null; onClose: () => void; onSave: (u: Partial<User>) => void }) {
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", role: user?.role ?? "user" as UserRole, department: user?.department ?? "" });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: `1px solid ${BORDER}`, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <h2 className="text-white font-semibold">{user ? "Edit User" : "Add New User"}</h2>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "Enter full name" },
            { label: "Email Address", key: "email", type: "email", placeholder: "Enter email address" },
            { label: "Department", key: "department", type: "text", placeholder: "Enter department" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }} />
            </div>
          ))}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Role</label>
            <div className="relative">
              <select value={form.role} onChange={e => update("role", e.target.value as UserRole)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none appearance-none"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
                <option value="user">Employee</option>
                <option value="analyst">Security Analyst</option>
                <option value="admin">Administrator</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          {!user && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Temporary Password</label>
              <input type="password" placeholder="Min. 12 characters"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }} />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            {user ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mapApiUser = (user: ApiUser): ManagedUser => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.primary_role === "administrator" ? "admin" : user.primary_role === "security-analyst" ? "analyst" : "user",
    department: user.department ?? "Unassigned",
    status: user.status === "suspended" ? "inactive" : user.status,
    lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never",
    createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
  });

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await listUsers({ page: 1 });
        if (!active) {
          return;
        }

        setUsers(response.data.map(mapApiUser));
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        console.error("Failed to load users:", err);
        setError("Unable to load users from the database.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)) &&
      (filterRole === "all" || u.role === filterRole) &&
      (filterStatus === "all" || u.status === filterStatus)
    );
  });

  const toggleStatus = (id: string) => setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
  const saveUser = (data: Partial<User>) => {
    if (modal === "edit" && editUser) {
      setUsers(p => p.map(u => u.id === editUser.id ? { ...u, ...data } : u));
    } else {
      const newUser: User = { id: `U00${users.length + 1}`, name: data.name ?? "", email: data.email ?? "", role: data.role ?? "user", department: data.department ?? "", status: "active", lastLogin: "Never", createdAt: new Date().toISOString().split("T")[0] ?? "" };
      setUsers(p => [...p, newUser]);
    }
  };
  const removeUser = (id: string) => { setUsers(p => p.filter(u => u.id !== id)); setDeleteUser(null); };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {modal && (
        <UserModal
          user={modal === "edit" ? editUser : null}
          onClose={() => { setModal(null); setEditUser(null); }}
          onSave={saveUser}
        />
      )}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "#0a1628", border: `1px solid rgba(239,68,68,0.3)` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Delete User?</h3>
            <p className="text-slate-400 text-sm mb-5">Permanently remove <strong className="text-white">{deleteUser.name}</strong>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-400"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>Cancel</button>
              <button onClick={() => removeUser(deleteUser.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#b91c1c,#dc2626)" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} registered users · Role-based access control</p>
        </div>
        <button onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, color: "#3b82f6" },
          { label: "Active", value: users.filter(u => u.status === "active").length, color: "#10b981" },
          { label: "Inactive", value: users.filter(u => u.status === "inactive").length, color: "#ef4444" },
          { label: "Analysts", value: users.filter(u => u.role === "analyst").length, color: "#06b6d4" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 flex flex-col sm:flex-row gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }} />
        </div>
        {[
          { label: "Role", value: filterRole, set: setFilterRole, options: [["all", "All Roles"], ["admin", "Administrator"], ["analyst", "Analyst"], ["user", "Employee"]] },
          { label: "Status", value: filterStatus, set: setFilterStatus, options: [["all", "All Status"], ["active", "Active"], ["inactive", "Inactive"]] },
        ].map(f => (
          <div key={f.label} className="relative">
            <select value={f.value} onChange={e => f.set(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-slate-300 outline-none appearance-none cursor-pointer"
              style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
          <Users className="h-4 w-4 text-blue-400" />
          <h2 className="text-white font-semibold text-sm">System Users</h2>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} of {users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["User", "Email", "Role", "Department", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">Loading users...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-red-400 text-sm">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">No users available.</td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${roleColor(u.role)}18`, border: `1px solid ${roleColor(u.role)}30`, color: roleColor(u.role) }}>
                        {u.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-slate-200 text-sm font-medium whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap"
                      style={{ color: roleColor(u.role), background: `${roleColor(u.role)}15`, borderColor: `${roleColor(u.role)}30` }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${u.status === "active" ? "text-green-400 bg-green-400/10 border-green-400/30" : "text-slate-400 bg-slate-400/10 border-slate-400/30"}`}>
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{u.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditUser(u); setModal("edit"); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Edit">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleStatus(u.id)}
                        className={`p-1.5 rounded-lg transition-colors ${u.status === "active" ? "text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10" : "text-slate-400 hover:text-green-400 hover:bg-green-400/10"}`}
                        title={u.status === "active" ? "Deactivate" : "Activate"}>
                        {u.status === "active" ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setDeleteUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
