import { useState } from "react";
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, Wifi } from "lucide-react";
import InfoSecLogo from "../../Logo/InfoSec_Logo.png";
import { useCITS } from "../contexts/CITSContext";

export default function CITSLogin() {
  const { login } = useCITS();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const ok = await login(email, password, remember);
    if (!ok) setError("Invalid credentials. Use a registered account.");
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 600));
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #020714 0%, #050d1f 40%, #071528 100%)" }}>
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-b border-[#1e2d4a]" style={{ background: "rgba(8,13,26,0.8)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-mono">SYSTEM STATUS: OPERATIONAL</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> SECURE CONNECTION</span>
          <span>TLS 1.3 ENCRYPTED</span>
        </div>
      </div>

      <div className="w-full max-w-md px-6 z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f, #0d2444)", border: "1px solid rgba(59,130,246,0.3)", boxShadow: "0 0 40px rgba(59,130,246,0.2)", marginTop: '18px' }}>
            <img src={InfoSecLogo} alt="Cyber Incident Logo" className="w-full h-full object-contain" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#050d1f]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Cyber Incident Ticketing</h1>
          <p className="text-blue-400 font-mono text-sm mt-1 tracking-widest">SYSTEM · CITS v2.4</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "rgba(13,20,36,0.95)", border: "1px solid rgba(30,45,74,0.8)", backdropFilter: "blur(12px)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
          {!showForgot ? (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Secure Login</h2>
              <p className="text-slate-400 text-sm mb-6">Authentication required. All access is monitored and logged.</p>

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-lg mb-5 border border-red-500/20 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-slate-300 text-sm mb-2 font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
                      style={{ background: "rgba(8,13,26,0.8)", border: "1px solid rgba(30,45,74,0.8)" }}
                      placeholder="user@corporation.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2 font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
                      style={{ background: "rgba(8,13,26,0.8)", border: "1px solid rgba(30,45,74,0.8)" }}
                      placeholder="••••••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                    <span className="text-slate-400 text-sm">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">Forgot password?</button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{ background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #1d4ed8, #2563eb)", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Secure Login
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#1e2d4a]" />
            </>
          ) : (
            <>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 text-sm transition-colors">
                ← Back to login
              </button>
              {!forgotSent ? (
                <>
                  <h2 className="text-white font-semibold text-lg mb-1">Reset Password</h2>
                  <p className="text-slate-400 text-sm mb-6">Enter your email to receive a secure reset link.</p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                        style={{ background: "rgba(8,13,26,0.8)", border: "1px solid rgba(30,45,74,0.8)" }}
                        placeholder="Your email address" required />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-lg font-semibold text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}>
                      Send Reset Link
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-7 w-7 text-green-400" />
                  </div>
                  <h2 className="text-white font-semibold text-lg mb-2">Reset Link Sent</h2>
                  <p className="text-slate-400 text-sm">Check your email for the secure password reset link. It expires in 15 minutes.</p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Unauthorized access is prohibited and subject to prosecution.<br />
          All sessions are recorded and monitored.
        </p>
      </div>
    </div>
  );
}
