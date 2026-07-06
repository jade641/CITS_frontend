import { useState } from "react";
import { User, Lock, Shield, Save, Eye, EyeOff } from "lucide-react";
import { useCITS } from "../contexts/CITSContext";
import { updateProfile } from "../services/authService";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

export default function Settings() {
  const { currentUser, logout } = useCITS();
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: "",
    department: currentUser?.department ?? "",
    job_title: "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile(profile);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your account information and password.</p>
        </div>
        <button onClick={logout} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-300"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
          Logout
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-green-400 text-sm"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <Shield className="h-4 w-4" /> Changes saved
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-sm text-red-200" style={{ background: "rgba(127,29,29,0.35)", border: "1px solid rgba(239,68,68,0.35)" }}>
          {error}
        </div>
      )}

      <div className="rounded-xl p-6 space-y-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <h2 className="text-white font-semibold flex items-center gap-2"><User className="h-4 w-4 text-blue-400" /> Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Full Name", key: "name", type: "text" },
            { label: "Email Address", key: "email", type: "email" },
            { label: "Phone", key: "phone", type: "text" },
            { label: "Department", key: "department", type: "text" },
            { label: "Job Title", key: "job_title", type: "text" },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">{field.label}</label>
              <input
                type={field.type}
                value={profile[field.key as keyof typeof profile]}
                onChange={event => setProfile(prev => ({ ...prev, [field.key]: event.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
              />
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}` }} className="pt-5 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-blue-400" /> Change Password</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Current Password", key: "current_password" },
              { label: "New Password", key: "password" },
              { label: "Confirm New Password", key: "password_confirmation" },
            ].map(field => (
              <div key={field.label} className="md:col-span-1">
                <label className="block text-slate-400 text-xs mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={profile[field.key as keyof typeof profile]}
                    onChange={event => setProfile(prev => ({ ...prev, [field.key]: event.target.value }))}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm text-white outline-none placeholder-slate-600"
                    style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${BORDER}` }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}