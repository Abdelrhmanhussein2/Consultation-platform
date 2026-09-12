import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import CreateRefundInvoiceModal from "../components/CreateRefundInvoiceModal";
import ModernSelect from "../../components/ModernSelect";

const SORT_OPTIONS = [
  { value: "date_desc", label: "الأحدث" },
  { value: "date_asc", label: "الأقدم" },
  { value: "amount_desc", label: "الأعلى قيمة" },
  { value: "amount_asc", label: "الأقل قيمة" }
];

const REFUND_STATUS_OPTIONS = [
  { value: "الكل", label: "كل الحالات" },
  { value: "pending", label: "بانتظار الموافقة" },
  { value: "processing", label: "قيد المعالجة" },
  { value: "completed", label: "مكتمل" },
  { value: "rejected", label: "مرفوض" }
];

const fmt = (n) => Number(n || 0).toLocaleString("ar-JO", { minimumFractionDigits: 3 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("zh-Hans-CN") : "-";

const STATUS_LABELS = {
  pending:    { label: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629", bg: "#FEF9C3", color: "#B45309" },
  processing: { label: "\u0642\u064a\u062f \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629",    bg: "#E0F2FE", color: "#0369A1" },
  completed:  { label: "\u0645\u0643\u062a\u0645\u0644",           bg: "#D1FAE5", color: "#065F46" },
  rejected:   { label: "\u0645\u0631\u0641\u0648\u0636",           bg: "#FEE2E2", color: "#991B1B" },
};
const si = (s) => STATUS_LABELS[s] || { label: s || "-", bg: "#F1F5F9", color: "#475569" };

const Chip = ({ status }) => {
  const { label, bg, color } = si(status);
  return <span style={{ background: bg, color, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>{label}</span>;
};

const Avatar = ({ name, id }) => {
  const colors = ["#0D3C5C","#0891B2","#7C3AED","#059669","#DC2626","#D97706","#0E7490","#4F46E5"];
  const bg = colors[(id || name || "").charCodeAt(0) % colors.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
      {(name || "\u061f").substring(0, 2)}
    </div>
  );
};

const Th = ({ ch }) => <th style={{ padding: "12px 14px", color: "#64748B", fontWeight: 800, fontSize: 12, textAlign: "right", whiteSpace: "nowrap" }}>{ch}</th>;

const REASON_CATEGORIES = [
  "\u062c\u0648\u062f\u0629 \u0627\u0644\u062e\u062f\u0645\u0629 \u0627\u0644\u0645\u0642\u062f\u0645\u0629",
  "\u0645\u0634\u0643\u0644\u0629 \u062a\u0642\u0646\u064a\u0629 \u0641\u064a \u0627\u0644\u0645\u0646\u0635\u0629",
  "\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062c\u0644\u0633\u0629 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0645\u0633\u062a\u0634\u0627\u0631",
  "\u0639\u062f\u0645 \u0627\u0643\u062a\u0645\u0627\u0644 \u0627\u0644\u062e\u062f\u0645\u0629",
  "\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0641\u0648\u062a\u0631\u0629 \u0623\u0648 \u0627\u0644\u0645\u0628\u0644\u063a",
  "\u0637\u0644\u0628 \u0627\u0644\u0639\u0645\u064a\u0644 (\u062a\u0631\u0627\u062c\u0639)",
  "\u0642\u0631\u0627\u0631 \u0625\u062f\u0627\u0631\u064a",
  "\u0623\u062e\u0631\u0649",
];

const INITIAL_FORM = {
  invoice_number: "",
  user_name: "",
  user_email: "",
  user_phone: "",
  service_name: "",
  refund_type: "full",
  currency: "JOD",
  original_amount: "",
  refund_amount: "",
  bearer: "\u0627\u0644\u0645\u0646\u0635\u0629",
  payout_method: "\u0628\u0637\u0627\u0642\u0629 \u0628\u0646\u0643\u064a\u0629",
  transaction_ref: "",
  status: "pending",
  reason_category: "",
  reason: "",
  notes: "",
};

const PAYOUT_METHODS = [
  { value: "\u0628\u0637\u0627\u0642\u0629 \u0628\u0646\u0643\u064a\u0629",         icon: "fa-credit-card",       label: "\u0628\u0637\u0627\u0642\u0629 \u0628\u0646\u0643\u064a\u0629" },
  { value: "\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a / CliQ",    icon: "fa-building-columns",  label: "\u062a\u062d\u0648\u064a\u0644 / CliQ" },
  { value: "\u0631\u0635\u064a\u062f \u0645\u062d\u0641\u0638\u0629 \u0628\u0627\u0644\u0645\u0646\u0635\u0629",   icon: "fa-wallet",            label: "\u0631\u0635\u064a\u062f \u0645\u062d\u0641\u0638\u0629" },
  { value: "\u062a\u0633\u0648\u064a\u0629 \u0636\u0631\u064a\u0628\u064a\u0629",        icon: "fa-scale-balanced",    label: "\u062a\u0633\u0648\u064a\u0629 \u0636\u0631\u064a\u0628\u064a\u0629" },
];

export default function AdminRefundedInvoicesPage({ navigate }) {
  const { token } = useAuth();
  const [refInvoices, setRefInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("\u0627\u0644\u0643\u0644");
  const [sortBy, setSortBy] = useState("date_desc");
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchRefunds = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/refunded-invoices/all?limit=200", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setRefInvoices(Array.isArray(d) ? d : []); }
      else { setRefInvoices([]); }
    } catch { setRefInvoices([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const rf = refundForm;
  const orig = parseFloat(rf.original_amount) || 0;
  const refd = parseFloat(rf.refund_amount) || 0;
  const upd = (k, v) => setRefundForm(p => ({ ...p, [k]: v }));

  const filtRef = refInvoices
    .filter(r => {
      const ms = !search || String(r.refund_number || r.id || "").toLowerCase().includes(search.toLowerCase()) || (r.user_name || "").toLowerCase().includes(search.toLowerCase()) || (r.invoice_number || r.invoice_id || "").toLowerCase().includes(search.toLowerCase());
      const st = filterStatus === "\u0627\u0644\u0643\u0644" || r.status === filterStatus;
      const amt = parseFloat(r.refund_amount || 0);
      return ms && st && (!filterMinAmount || amt >= parseFloat(filterMinAmount)) && (!filterMaxAmount || amt <= parseFloat(filterMaxAmount));
    })
    .sort((a, b) => {
      if (sortBy === "date_desc")   return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "date_asc")    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "amount_desc") return parseFloat(b.refund_amount || 0) - parseFloat(a.refund_amount || 0);
      if (sortBy === "amount_asc")  return parseFloat(a.refund_amount || 0) - parseFloat(b.refund_amount || 0);
      return 0;
    });

  const refTotal       = refInvoices.reduce((a, r) => a + Number(r.refund_amount || 0), 0);
  const completedCount = refInvoices.filter(r => r.status === "completed").length;
  const pendingCount   = refInvoices.filter(r => r.status === "processing" || r.status === "pending").length;
  const rejectedCount  = refInvoices.filter(r => r.status === "rejected").length;

  const handleDeleteRefund = async (item) => {
    setActiveMenuId(null);
    if (!window.confirm("\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0637\u0644\u0628 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0647\u0630\u0627\u061f")) return;
    try {
      await fetch(`/api/refunded-invoices/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setRefInvoices(p => p.filter(i => i.id !== item.id));
      alert("\u062a\u0645 \u0627\u0644\u062d\u0630\u0641 \u0628\u0646\u062c\u0627\u062d");
    } catch { setRefInvoices(p => p.filter(i => i.id !== item.id)); alert("\u062a\u0645 \u0627\u0644\u062d\u0630\u0641 \u0628\u0646\u062c\u0627\u062d"); }
  };

  const handleCreateRefund = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...refundForm, original_amount: orig, refund_amount: refd };
      const res = await fetch("/api/refunded-invoices/", { method: "POST", headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f"); }
      setShowRefundModal(false);
      setRefundForm(INITIAL_FORM);
      fetchRefunds();
    } catch (err) { alert(`\u062e\u0637\u0623: ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleExportCSV = () => {
    if (filtRef.length === 0) { alert("\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0644\u0644\u062a\u0635\u062f\u064a\u0631."); return; }
    const headers = ["\u0631\u0642\u0645 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f","\u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629","\u0627\u0644\u0639\u0645\u064a\u0644","\u0627\u0644\u062e\u062f\u0645\u0629","\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0623\u0635\u0644\u064a","\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0633\u062a\u0631\u062f","\u0627\u0644\u062c\u0647\u0629 \u0627\u0644\u0645\u062a\u062d\u0645\u0644\u0629","\u0627\u0644\u062d\u0627\u0644\u0629","\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0637\u0644\u0628"];
    const rows = filtRef.map(r => [r.refund_number||r.id, r.invoice_number||r.invoice_id||"-", r.user_name||"-", r.service_name||r.service||"-", r.original_amount||0, r.refund_amount||0, r.bearer||"\u0627\u0644\u0645\u0646\u0635\u0629", si(r.status).label, fmtDate(r.created_at)]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(","))].join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })), download: `diwan-refunded-${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const renderRowActions = (item, idx, total) => {
    const isOpen = activeMenuId === item.id;
    const up = total > 2 && idx >= Math.max(1, total - 3);
    return (
      <td style={{ padding: "13px 14px", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button type="button" style={{ background: isOpen ? "#F1F5F9" : "none", border: "none", cursor: "pointer", color: isOpen ? "#0D3C5C" : "#94A3B8", fontSize: 18, fontWeight: 900, padding: "4px 8px", borderRadius: 6 }} onClick={() => setActiveMenuId(isOpen ? null : item.id)}>\u00b7\u00b7\u00b7</button>
        {isOpen && (<>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setActiveMenuId(null)} />
          <div style={{ position: "absolute", left: 10, ...(up ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% - 4px)" }), zIndex: 99999, background: "#fff", borderRadius: 12, boxShadow: "0 12px 32px rgba(15,23,42,0.2)", border: "1.5px solid #E2E8F0", minWidth: 180, padding: "6px 0", direction: "rtl", fontSize: 12, fontWeight: 800, textAlign: "right" }}>
            <div onClick={() => handleDeleteRefund(item)} style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#DC2626" }} onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <i className="fa-regular fa-trash-can" style={{ color: "#DC2626", width: 16 }}></i><span>\u062d\u0630\u0641</span>
            </div>
          </div>
        </>)}
      </td>
    );
  };

  const STATS = [
    { icon: "\u21a9\ufe0f", label: "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f\u0627\u062a", value: `${fmt(refTotal)} \u062f.\u0623`, sub: "\u0625\u062c\u0645\u0627\u0644\u064a \u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0628\u0627\u0644\u063a \u0627\u0644\u0645\u0633\u062a\u0631\u062f\u0629", c: "#94A3B8", a: "#0D3C5C" },
    { icon: "\u2705", label: "\u0627\u0633\u062a\u0631\u062f\u0627\u062f\u0627\u062a \u0645\u0643\u062a\u0645\u0644\u0629", value: completedCount, sub: "\u062a\u0645 \u062a\u0646\u0641\u064a\u0630\u0647\u0627 \u0628\u0646\u062c\u0627\u062d", c: "#16A34A", a: "#16A34A" },
    { icon: "\u23f3", label: "\u0642\u064a\u062f \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629", value: pendingCount, sub: "\u0637\u0644\u0628\u0627\u062a \u062a\u062d\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629", c: "#D97706", a: "#D97706" },
    { icon: "\u274c", label: "\u0637\u0644\u0628\u0627\u062a \u0645\u0631\u0641\u0648\u0636\u0629", value: rejectedCount, sub: "\u0644\u0645 \u062a\u0633\u062a\u0648\u0641\u0650 \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f", c: "#DC2626", a: "#DC2626" },
  ];

  const STATUS_TABS = ["\u0627\u0644\u0643\u0644","pending","processing","completed","rejected"];
  const HEADERS = ["\u0631\u0642\u0645 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f","\u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629","\u0627\u0644\u0639\u0645\u064a\u0644","\u0627\u0644\u062e\u062f\u0645\u0629 / \u0627\u0644\u0639\u0645\u0644\u064a\u0629","\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0623\u0635\u0644\u064a","\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0633\u062a\u0631\u062f","\u0627\u0644\u062c\u0647\u0629 \u0627\u0644\u0645\u062a\u062d\u0645\u0644\u0629","\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0635\u0631\u0641","\u0627\u0644\u062d\u0627\u0644\u0629","\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0637\u0644\u0628",""];

  const CSS = `
    @keyframes sp{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
    .rr:hover td{background:#F8FAFC!important;cursor:pointer}
    .ab{border:1.5px solid #E2E8F0;background:#fff;border-radius:9px;padding:7px 16px;font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;color:#0D3C5C;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
    .ab:hover{background:#0D3C5C;color:#fff;border-color:#0D3C5C}
    .pt{background:#0D3C5C;color:#fff;border:none;border-radius:9px;padding:8px 18px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-family:inherit}
    .pt:hover{background:#0B2E4B}
    .gb{background:#fff;border:1.5px solid #CBD5E1;border-radius:9px;padding:8px 16px;font-weight:700;color:#475569;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-family:inherit}
    .gb:hover{background:#F1F5F9;color:#0D3C5C}
    select,input.inp,textarea.ta{border:1.5px solid #CBD5E1;border-radius:9px;padding:9px 12px;font-family:inherit;font-size:13px;color:#0D3C5C;background:#fff;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.2s}
    select:focus,input.inp:focus,textarea.ta:focus{border-color:#0D3C5C;box-shadow:0 0 0 3px rgba(13,60,92,0.08)}
    .rl{display:block;font-size:12px;font-weight:800;color:#475569;margin-bottom:5px}
    .tt{display:flex;border:1.5px solid #E2E8F0;border-radius:10px;overflow:hidden;background:#F8FAFC}
    .to{flex:1;padding:9px 0;text-align:center;cursor:pointer;font-size:13px;font-weight:700;color:#64748B;transition:all .15s;border:none;background:transparent;font-family:inherit}
    .to.a{background:#0D3C5C;color:#fff;font-weight:800}
    .bc{border:1.5px solid #E2E8F0;border-radius:10px;padding:10px 14px;text-align:center;cursor:pointer;font-size:12px;font-weight:700;color:#475569;transition:all .15s;flex:1}
    .bc.a{border-color:#0D3C5C;background:#EFF6FF;color:#0D3C5C;font-weight:800}
    .pc{border:1.5px solid #E2E8F0;border-radius:12px;padding:14px 12px;text-align:center;background:#fff;cursor:pointer;transition:all .2s;flex:1}
    .pc.a{border-color:#0D3C5C;background:#EFF6FF;box-shadow:0 0 0 2px rgba(13,60,92,0.12)}
    .sh{font-size:13px;font-weight:900;color:#0D3C5C;margin:0 0 14px;padding-bottom:8px;border-bottom:1.5px solid #F1F5F9;display:flex;align-items:center;gap:8px}
  `;

  return (
    <div style={{ direction: "rtl", fontFamily: "var(--font-main)", color: "#1E293B", minHeight: "100vh", background: "#F8FAFC" }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{CSS}</style>

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E2E8F0", padding: "22px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0D3C5C" }}>\u21a9\ufe0f \u0641\u0648\u0627\u062a\u064a\u0631 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f</h1>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>\u0625\u062f\u0627\u0631\u0629 \u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0642\u064a\u0645\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u062a\u062a\u0628\u0639 \u062d\u0627\u0644\u062a\u0647\u0627</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="ab" type="button" onClick={handleExportCSV}><i className="fa-solid fa-file-csv"></i> \u062a\u0635\u062f\u064a\u0631 CSV</button>
          <button className="pt" type="button" onClick={() => { setRefundForm(INITIAL_FORM); setShowRefundModal(true); }}><i className="fa-solid fa-plus"></i> \u0625\u0646\u0634\u0627\u0621 \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0633\u062a\u0631\u062f\u0627\u062f</button>
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {STATS.map((card, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "20px 22px", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 4, background: card.a }} />
              <div style={{ fontSize: 22, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0D3C5C" }}>{card.value}</div>
              <div style={{ fontSize: 11, color: card.c, fontWeight: 700, marginTop: 6 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "12px 18px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 280 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 13 }}></i>
              <input className="inp" type="text" placeholder="\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f\u060c \u0627\u0644\u0639\u0645\u064a\u0644\u060c \u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 36 }} />
            </div>
            <button className="ab" type="button" onClick={() => setShowFilterBar(!showFilterBar)} style={{ background: showFilterBar ? "#0D3C5C" : "#fff", color: showFilterBar ? "#fff" : "#0D3C5C" }}>
              <i className="fa-solid fa-filter"></i> \u0641\u0644\u062a\u0631\u0629
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_TABS.map(s => (
              <button key={s} type="button" className="ab" style={{ fontSize: 11, padding: "5px 12px", background: filterStatus === s ? "#0D3C5C" : "#fff", color: filterStatus === s ? "#fff" : "#0D3C5C", borderColor: filterStatus === s ? "#0D3C5C" : "#E2E8F0" }} onClick={() => setFilterStatus(s)}>
                {s === "الكل" ? "الكل" : si(s).label}
              </button>
            ))}
          </div>
          <div style={{ minWidth: 140 }}>
            <ModernSelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              placeholder="الترتيب..."
            />
          </div>
        </div>

        {/* FILTER BAR */}
        {showFilterBar && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "16px 22px", marginBottom: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "flex-end" }}>
              <div>
                <label className="rl">الحالة</label>
                <ModernSelect
                  options={REFUND_STATUS_OPTIONS}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="كل الحالات"
                />
              </div>
              <div><label className="rl">من مبلغ</label><input className="inp" type="number" step="0.001" placeholder="0.000" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} /></div>
              <div><label className="rl">إلى مبلغ</label><input className="inp" type="number" step="0.001" placeholder="999999" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} /></div>
              <button className="gb" type="button" onClick={() => { setSearch(""); setFilterStatus("الكل"); setFilterMinAmount(""); setFilterMaxAmount(""); }}>إعادة تعيين</button>
            </div>
          </div>
        )}

        {/* TABLE */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
            <div style={{ width: 28, height: 28, border: "3px solid #E2E8F0", borderTopColor: "#0D3C5C", borderRadius: "50%", animation: "sp .8s linear infinite", margin: "0 auto 14px" }} />
            <div style={{ color: "#64748B", fontSize: 13 }}>\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...</div>
          </div>
        ) : filtRef.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", color: "#64748B" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>\u21a9\ufe0f</div>
            <h3 style={{ color: "#0D3C5C", margin: "0 0 6px" }}>\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0627\u0633\u062a\u0631\u062f\u0627\u062f</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13 }}>\u0642\u0645 \u0628\u0625\u0646\u0634\u0627\u0621 \u0623\u0648\u0644 \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0628\u0627\u0644\u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u0639\u0644\u0627\u0647</p>
            <button className="pt" type="button" onClick={() => { setRefundForm(INITIAL_FORM); setShowRefundModal(true); }}><i className="fa-solid fa-plus"></i> \u0625\u0646\u0634\u0627\u0621 \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0633\u062a\u0631\u062f\u0627\u062f</button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 16px", width: 40 }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></th>
                  {HEADERS.map((h,i) => <Th key={i} ch={h} />)}
                </tr>
              </thead>
              <tbody>
                {filtRef.map((r, idx) => (
                  <tr key={r.id} className="rr" style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "13px 16px" }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></td>
                    <td style={{ padding: "13px 14px", fontWeight: 800, color: "#0D3C5C" }}>{r.refund_number || r.id}</td>
                    <td style={{ padding: "13px 14px", fontWeight: 700, color: "#4F46E5" }}>{r.invoice_number || r.invoice_id || "-"}</td>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={r.user_name} id={r.id} />
                        <div><div style={{ fontWeight: 700, color: "#0D3C5C", fontSize: 13 }}>{r.user_name || "-"}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{r.user_email || ""}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", color: "#475569", maxWidth: 200 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.service_name || r.service}>{r.service_name || r.service || "-"}</div></td>
                    <td style={{ padding: "13px 14px", fontWeight: 700, color: "#0D3C5C" }}>\u062f.\u0623 {fmt(r.original_amount)}</td>
                    <td style={{ padding: "13px 14px", fontWeight: 700, color: r.refund_amount > 0 ? "#16A34A" : "#94A3B8" }}>\u062f.\u0623 {fmt(r.refund_amount)}</td>
                    <td style={{ padding: "13px 14px", color: "#64748B" }}>{r.bearer || "\u0627\u0644\u0645\u0646\u0635\u0629"}</td>
                    <td style={{ padding: "13px 14px", color: "#475569", fontSize: 12 }}>{r.payout_method || r.payment_method || "-"}</td>
                    <td style={{ padding: "13px 14px" }}><Chip status={r.status} /></td>
                    <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(r.created_at)}</td>
                    {renderRowActions(r, idx, filtRef.length)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, color: "#94A3B8" }}>\u0639\u0631\u0636 {filtRef.length} \u0637\u0644\u0628 \u0645\u0646 \u0623\u0635\u0644 {refInvoices.length}</div>
      </div>

      {/* CREATE REFUND MODAL */}
      <CreateRefundInvoiceModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSuccess={fetchRefunds}
      />
    </div>
  );
}
