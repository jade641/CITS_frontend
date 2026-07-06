import { useEffect, useState } from "react";
import { FileWarning, Upload, X, CheckCircle2, AlertTriangle, Shield, ChevronDown, Calendar, MapPin, FileText } from "lucide-react";
import { useCITS } from "../contexts/CITSContext";
import { createIncident } from "../services/incidentService";
import { getLookups } from "../services/lookupService";
import type { IncidentCategory, SeverityLevel } from "../interfaces";

const CARD = "#0d1e35";
const BORDER = "rgba(30,60,100,0.35)";

const SEVERITY_OPTIONS = [
  { value: "low",      label: "Low",      color: "#22c55e", desc: "Minor impact, no sensitive data involved" },
  { value: "medium",   label: "Medium",   color: "#eab308", desc: "Moderate impact, limited exposure" },
  { value: "high",     label: "High",     color: "#f97316", desc: "Significant impact, potential data loss" },
  { value: "critical", label: "Critical", color: "#ef4444", desc: "Severe impact, immediate response required" },
];

export default function ReportIncident() {
  const { navigate } = useCITS();
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", category: "", severity: "" as SeverityLevel | "", description: "",
    datetime: "", location: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.category) e.category = "Select a category";
    if (!form.severity) e.severity = "Select severity level";
    if (form.description.trim() && form.description.length < 20) e.description = "Description must be at least 20 characters";
    if (!form.datetime) e.datetime = "Date and time is required";
    if (!form.location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity as SeverityLevel,
        category_id: Number(form.category),
        location: form.location.trim(),
        occurred_at: form.datetime,
      };

      const response = await createIncident(payload);
      setTicketId(response.incident.ticket_number);
      setSubmitted(true);
    } catch (error) {
      setErrors({ form: "Unable to submit incident. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFile = (name: string) => setFiles(p => [...p, name]);
  const removeFile = (i: number) => setFiles(p => p.filter((_, idx) => idx !== i));

  useEffect(() => {
    let isMounted = true;

    getLookups().then((data) => {
      if (!isMounted) return;
      setCategories(data.incidentCategories);
    }).catch(() => {
      setErrors((previous) => ({ ...previous, form: 'Unable to load incident categories. Please refresh.' }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (submitted) return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)", boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}>
        <CheckCircle2 className="h-10 w-10 text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Incident Reported Successfully</h2>
      {ticketId && (
        <div className="my-4 px-6 py-3 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <p className="text-slate-400 text-sm">Ticket ID</p>
          <p className="text-blue-400 font-mono text-2xl font-bold">{ticketId}</p>
        </div>
      )}
      <p className="text-slate-400 mb-1">Your incident has been logged and assigned a ticket ID.</p>
      <p className="text-slate-500 text-sm mb-6">A Security Analyst will review your report within 4 hours. You will receive email notifications on status updates.</p>
      <div className="flex gap-3">
        <button onClick={() => navigate("my-tickets")}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
          View My Tickets
        </button>
        <button onClick={() => { setSubmitted(false); setForm({ title:"",category:"",severity:"",description:"",datetime:"",location:"" }); setFiles([]); }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-300"
          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }}>
          Report Another
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <FileWarning className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Report Security Incident</h1>
          <p className="text-slate-400 text-sm">All reports are encrypted and handled confidentially</p>
        </div>
      </div>

      {/* Notice */}
      <div className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-red-300 font-semibold text-sm">If this is an active emergency</p>
          <p className="text-slate-400 text-xs mt-0.5">Contact the SOC hotline immediately: <span className="font-mono text-red-300">+1-800-SEC-OPS1</span> or raise a Critical alert below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
            <Shield className="h-4 w-4 text-blue-400" />
            <h2 className="text-white font-semibold text-sm">Incident Information</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-sm font-medium mb-2">Incident Title <span className="text-red-400">*</span></label>
              <input value={form.title} onChange={e => update("title", e.target.value)}
                placeholder="Brief descriptive title of the incident"
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${errors.title ? "#ef4444" : BORDER}` }} />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Incident Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={form.category} onChange={e => update("category", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none appearance-none"
                  style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${errors.category ? "#ef4444" : BORDER}`, color: form.category ? "#e2e8f0" : "#64748b" }}>
                  <option value="" disabled>Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
            </div>

            {/* Date/time */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Date & Time of Incident <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="datetime-local" value={form.datetime} onChange={e => update("datetime", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white outline-none"
                  style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${errors.datetime ? "#ef4444" : BORDER}`, colorScheme: "dark" }} />
              </div>
              {errors.datetime && <p className="text-red-400 text-xs mt-1">{errors.datetime}</p>}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-sm font-medium mb-2">Location / Affected System <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input value={form.location} onChange={e => update("location", e.target.value)}
                  placeholder="e.g. Finance Department, Server Room, Remote Workstation, Cloud Environment"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                  style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${errors.location ? "#ef4444" : BORDER}` }} />
              </div>
              {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
            </div>

            {/* Severity */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-sm font-medium mb-3">Severity Level <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEVERITY_OPTIONS.map(s => (
                  <button type="button" key={s.value}
                    onClick={() => update("severity", s.value)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${form.severity === s.value ? s.color : BORDER}`,
                      background: form.severity === s.value ? `${s.color}12` : "rgba(8,13,26,0.5)"
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="text-white font-bold text-sm">{s.label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{s.desc}</p>
                  </button>
                ))}
              </div>
              {errors.severity && <p className="text-red-400 text-xs mt-1">{errors.severity}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Incident Description <span className="text-slate-500 font-normal ml-2">(Optional)</span>
                <span className="text-slate-500 font-normal ml-2">({form.description.length}/2000 chars)</span>
              </label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)}
                placeholder="Provide a detailed description: what happened, how it was discovered, what systems/data were affected, any actions already taken..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none resize-none"
                style={{ background: "rgba(8,13,26,0.8)", border: `1px solid ${errors.description ? "#ef4444" : BORDER}` }} />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Evidence upload */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-sm font-medium mb-2">Upload Evidence</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  Array.from(e.dataTransfer.files).forEach(f => addFile(f.name));
                }}
                className="rounded-xl p-6 text-center cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${dragOver ? "#3b82f6" : BORDER}`,
                  background: dragOver ? "rgba(59,130,246,0.05)" : "rgba(8,13,26,0.4)"
                }}>
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Drag & drop files here, or</p>
                <label className="mt-2 inline-block cursor-pointer text-blue-400 hover:text-blue-300 text-sm font-medium underline">
                  browse files
                  <input type="file" multiple className="hidden" onChange={e => {
                    Array.from(e.target.files ?? []).forEach(f => addFile(f.name));
                  }} />
                </label>
                <p className="text-slate-600 text-xs mt-2">PNG, JPG, PDF, DOCX, PCAP up to 50MB each</p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="text-slate-300 text-sm flex-1 truncate">{f}</span>
                      <button type="button" onClick={() => removeFile(i)}><X className="h-4 w-4 text-slate-500 hover:text-red-400" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
            <p className="text-slate-500 text-xs flex items-center gap-2">
              <Shield className="h-3 w-3" />
              This report is encrypted and logged with your credentials for audit purposes.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({ title:"",category:"",severity:"",description:"",datetime:"",location:"" })}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                Clear Form
              </button>
              <button type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
                {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </div>
          {errors.form && <p className="text-red-400 text-xs mt-3 px-6">{errors.form}</p>}
        </div>
      </form>
    </div>
  );
}
