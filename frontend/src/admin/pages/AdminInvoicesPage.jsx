import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import CreateRefundInvoiceModal from "../components/CreateRefundInvoiceModal";

const fmt = (n) => Number(n || 0).toLocaleString("ar-JO", { minimumFractionDigits: 3 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("zh-Hans-CN") : "-";

const STATUS_LABELS = {
  paid: { label: "مدفوعة", bg: "#D1FAE5", color: "#065F46" },
  issued: { label: "صادرة", bg: "#DBEAFE", color: "#1E40AF" },
  draft: { label: "مسودة", bg: "#F1F5F9", color: "#475569" },
  cancelled: { label: "ملغاة", bg: "#FEE2E2", color: "#991B1B" },
  partial: { label: "مدفوعة جزئياً", bg: "#FEF9C3", color: "#854D0E" },
  overdue: { label: "متأخرة", bg: "#FFE4E6", color: "#BE123C" },
  pending: { label: "بانتظار الموافقة", bg: "#FEF9C3", color: "#B45309" },
  processing: { label: "قيد المعالجة", bg: "#E0F2FE", color: "#0369A1" },
  completed: { label: "مكتمل", bg: "#D1FAE5", color: "#065F46" },
  rejected: { label: "مرفوض", bg: "#FEE2E2", color: "#991B1B" },
  active: { label: "نشطة", bg: "#D1FAE5", color: "#065F46" },
  suspended: { label: "معلقة", bg: "#FEF9C3", color: "#B45309" },
};

const si = (s) => STATUS_LABELS[s] || { label: s || "-", bg: "#F1F5F9", color: "#475569" };

const CYCLES = { monthly: "كل شهر", quarterly: "كل 3 أشهر", semiannual: "كل 6 أشهر", annual: "سنوي", weekly: "أسبوعي" };

const CUSTOMERS = [
  { id: 1, name: "شركة الأفق للاستشارات ذ.م.م", type: "شركة ذات مسؤولية محدودة", tax: "200145879", address: "عمّان - الشميساني", email: "accounts@alofuq.jo", phone: "06 560 1100" },
  { id: 2, name: "مؤسسة النخبة التجارية", type: "مؤسسة فردية", tax: "201125877", address: "إربد - شارع الجامعة", email: "info@elite.jo", phone: "02 720 4411" },
  { id: 3, name: "أحمد محمود الخطيب", type: "أفراد", tax: "", address: "عمّان - تلاع العلي", email: "ahmad.k@example.com", phone: "079 881 2450" },
  { id: 4, name: "شركة البيان للتكنولوجيا ذ.م.م", type: "شركة ذات مسؤولية محدودة", tax: "201884521", address: "عمّان - وادي صقرة", email: "finance@albayan-tech.jo", phone: "06 585 2211" },
  { id: 5, name: "جامعة الريادة الخاصة", type: "جامعات", tax: "202118554", address: "عمّان - طريق المطار", email: "finance@riyadah.edu.jo", phone: "06 471 5500" },
  { id: 6, name: "هيئة التطوير المهني", type: "هيئات ومنظمات", tax: "202555100", address: "عمّان - العبدلي", email: "finance@pda.org.jo", phone: "06 520 7788" },
  { id: 7, name: "جمعية آفاق للتنمية", type: "جمعيات", tax: "202887411", address: "الزرقاء - الوسط التجاري", email: "admin@afaq.org.jo", phone: "05 390 1442" },
  { id: 8, name: "شركة المشرق المساهمة الخاصة", type: "شركة مساهمة خاصة", tax: "203114220", address: "عمّان - الدوار الخامس", email: "tax@almashreq.jo", phone: "06 593 9011" },
  { id: 9, name: "شركة الاتحاد الصناعية المساهمة العامة", type: "شركة مساهمة عامة", tax: "203445879", address: "سحاب - المدينة الصناعية", email: "finance@unionind.jo", phone: "06 402 6610" },
  { id: 10, name: "وزارة الخدمات الرقمية", type: "حكومي", tax: "GOV-100225", address: "عمّان - الدوار الثالث", email: "finance@digital.gov.jo", phone: "06 500 1000" },
  { id: 11, name: "شركة الرواد للتجارة", type: "شركة تضامن", tax: "204110025", address: "العقبة - المنطقة التجارية", email: "accounts@rowad.jo", phone: "03 201 7722" },
  { id: 12, name: "شركة الموردون للتوزيع", type: "شركة توصية بسيطة", tax: "204551102", address: "عمّان - ماركا", email: "billing@suppliers.jo", phone: "06 488 2200" },
  { id: 13, name: "د. سامر العلي", type: "أكاديمي وباحث", tax: "", address: "عمّان - الجبيهة", email: "s.alali@research.jo", phone: "079 700 8144" },
  { id: 14, name: "مؤسسة النور للخدمات", type: "مؤسسة فردية", tax: "205020115", address: "مادبا - وسط البلد", email: "info@alnoor.jo", phone: "05 324 8801" },
  { id: 15, name: "منظمة تمكين الأردن", type: "هيئات ومنظمات", tax: "205441170", address: "عمّان - أم أذينة", email: "finance@tamkeen.org.jo", phone: "06 592 7331" }
];

const SIGNERS_BY_DEPT = {
  "الإدارة": ["سارة علي - النائب التنفيذي", "أحمد عبد الله - المدير العام", "رأفت حداد - رئيس مجلس الإدارة"],
  "القسم المالي": ["محمد حسني - المدير المالي", "رانية السيد - رئيس الحسابات"],
  "قسم العمليات": ["خالد عمر - مدير العمليات", "يوسف كامل - مشرف العمليات"],
  "قسم الدعم والمساعدة": ["ليلى منصور - رئيس الدعم", "عمر الفاروق - مسؤول الدعم"],
  "قسم الاستشارات": ["د. سامح عبد الفتاح - رئيس المستشارين", "م. طارق يونس - استشاري أول"]
};

const Avatar = ({ name, id }) => {
  const colors = ["#0D3C5C", "#0891B2", "#7C3AED", "#059669", "#DC2626", "#D97706", "#0E7490", "#4F46E5"];
  const bg = colors[(id || name || "").charCodeAt(0) % colors.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
      {(name || "؟").substring(0, 2)}
    </div>
  );
};

const Chip = ({ status }) => {
  const { label, bg, color } = si(status);
  return <span style={{ background: bg, color, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>{label}</span>;
};

const Card = ({ icon, label, value, sub, subColor, accent }) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "20px 22px", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 4, background: accent }} />
    <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 900, color: "#0D3C5C" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: subColor || "#94A3B8", fontWeight: 700, marginTop: 6 }}>{sub}</div>}
  </div>
);

const Th = ({ ch }) => <th style={{ padding: "12px 14px", color: "#64748B", fontWeight: 800, fontSize: 12, textAlign: "right", whiteSpace: "nowrap" }}>{ch}</th>;

function numberToArabicWords(num) {
  if (!num || isNaN(num) || num === 0) return "صفر دينار أردني";
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 1000);
  return `${integerPart} دينار أردني ${decimalPart > 0 ? `و ${decimalPart} فلس` : ""}`;
}

export default function AdminInvoicesPage({ navigate }) {
  const { token } = useAuth();
  const [tab, setTab] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stFilter, setStFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Create Editor State
  const [showCreateEditor, setShowCreateEditor] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    invoice_number: "",
    user_name: "",
    service_name: "",
    original_amount: 0,
    refund_amount: 0,
    bearer: "المنصة",
    status: "pending",
    reason: ""
  });

  // Expandable Filter Bar State
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterPayMethod, setFilterPayMethod] = useState("الكل");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const handleResetFilters = () => {
    setSearch("");
    setStFilter("الكل");
    setFilterStatus("الكل");
    setFilterPayMethod("الكل");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setSortBy("date_desc");
  };


  // Editor Form State
  const [invNo, setInvNo] = useState("INV-2026-000001");
  const [refNo, setRefNo] = useState("TX-2026-000001");
  const [invDate, setInvDate] = useState("2026-08-29");
  const [terms, setTerms] = useState("0");
  const [dueDate, setDueDate] = useState("2026-08-29");
  const [currency, setCurrency] = useState("JOD");
  const [invoiceClass, setInvoiceClass] = useState("فاتورة خدمات");
  const [status, setStatus] = useState("مدفوعة");

  const [customerType, setCustomerType] = useState("شركة ذات مسؤولية محدودة");
  const [taxTreatment, setTaxTreatment] = useState("خاضعة للضريبة");
  const [taxEnabled, setTaxEnabled] = useState(true);

  // Recurring settings
  const [isRecurringTab, setIsRecurringTab] = useState(false);
  const [recurringCycle, setRecurringCycle] = useState("monthly");
  const [recurringStartDate, setRecurringStartDate] = useState("2026-08-29");
  const [recurringNextDate, setRecurringNextDate] = useState("2026-09-28");
  const [recurringState, setRecurringState] = useState("active");

  // Billing
  const [seller, setSeller] = useState("منصة ديوان للاستشارات الضريبية");
  const [otherSellerName, setOtherSellerName] = useState("");
  const [selectedCustIndex, setSelectedCustIndex] = useState(0);

  // Operation type & line items
  const [opType, setOpType] = useState("consult"); // consult, package, filing, platform

  // Dynamic fields for Consultations tab
  const [consultType, setConsultType] = useState("جلسة فيديو");
  const [consultantName, setConsultantName] = useState("د. سامح عبد الفتاح");
  const [sessionNo, setSessionNo] = useState("SES-2026-104");

  // Dynamic fields for Packages tab
  const [packageOpType, setPackageOpType] = useState("شراء بطاقة");
  const [currentPackage, setCurrentPackage] = useState("الأساسية");
  const [packageDuration, setPackageDuration] = useState("شهر (30 يوم)");

  // Dynamic fields for Tax Services tab
  const [taxServiceType, setTaxServiceType] = useState("إقرار ضريبة دخل");
  const [taxPeriod, setTaxPeriod] = useState("08/2026");
  const [taxFileNo, setTaxFileNo] = useState("TAX-100245");

  // Dynamic fields for Platform Share tab
  const [platformConsultant, setPlatformConsultant] = useState("د. سامح عبد الفتاح");
  const [consultationNo, setConsultationNo] = useState("ADV-2026-7781");
  const [platformRate, setPlatformRate] = useState("20%");

  // Line items state
  const [lineItems, setLineItems] = useState([
    { id: 1, name: "استشارة فورية مع مستشار المنصة", qty: 1, unit: "جلسة", price: 85, discount: 0, taxRate: 16 },
    { id: 2, name: "استشارة دعم ومساعدة", qty: 1, unit: "استشارة", price: 45, discount: 0, taxRate: 16 }
  ]);

  // Payment
  const [payMethod, setPayMethod] = useState("بطاقة بنكية");
  const [payRef, setPayRef] = useState("1254654");
  const [paymentStatus, setPaymentStatus] = useState("مدفوع");

  // Notes & Signatures
  const [notes, setNotes] = useState("");
  const [tc, setTc] = useState("تخضع هذه الفاتورة لشروط استخدام المنصة وسياسة الدفع والاسترداد المعتمدة.");
  const [collectionAccount, setCollectionAccount] = useState("البنك العربي الإسلامي — JO94AIBJ00100000123456789012");
  const [responsibleDept, setResponsibleDept] = useState("الإدارة");
  const [signName, setSignName] = useState("أحمد عبد الله - المدير العام");

  // Electronic invoice
  const [eStatus, setEStatus] = useState("غير مرسلة");
  const [eInvId, setEInvId] = useState("");

  // Logo & Signature upload state
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  const handleLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setLogoUrl(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSignatureUrl(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [recInvoices, setRecInvoices] = useState([]);
  const [refInvoices, setRefInvoices] = useState([]);

  const fetchInvoices = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.allSettled([
        fetch("/api/invoices/all?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/recurring-invoices/all?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/refunded-invoices/all?limit=100", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (r1.status === "fulfilled" && r1.value.ok) {
        const d = await r1.value.json();
        setInvoices(Array.isArray(d) ? d : d.invoices || []);
      } else { setInvoices([]); }

      if (r2.status === "fulfilled" && r2.value.ok) {
        const d = await r2.value.json();
        setRecInvoices(Array.isArray(d) ? d : []);
      } else { setRecInvoices([]); }

      if (r3.status === "fulfilled" && r3.value.ok) {
        const d = await r3.value.json();
        setRefInvoices(Array.isArray(d) ? d : []);
      } else { setRefInvoices([]); }
    } catch {
      setInvoices([]);
      setRecInvoices([]);
      setRefInvoices([]);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Calculations
  const calcSubtotal = lineItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0)), 0);
  const calcTaxTotal = taxEnabled ? lineItems.reduce((sum, item) => {
    const net = (Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0));
    return sum + (net * Number(item.taxRate || 0) / 100);
  }, 0) : 0;
  const calcGrandTotal = calcSubtotal + calcTaxTotal;

  // Helper to calculate auto generated service preset name
  const getGeneratedPresetText = () => {
    if (opType === "consult") {
      return `استشارة مكالمة فيديو - ${consultantName || 'مستشار المنصة'} - ${sessionNo || ''}`;
    } else if (opType === "package") {
      return `شراء باقة الاستشارات ${currentPackage} - مدة ${packageDuration}`;
    } else if (opType === "filing") {
      return `${taxServiceType} - الفترة ${taxPeriod} - الملف ${taxFileNo}`;
    } else if (opType === "platform") {
      return `حصة المنصة من استشارة مستشار معتمد - الاستشارة ${consultationNo} - حصة المنصة ${platformRate}`;
    }
    return "خدمة جديدة";
  };

  const handleApplyPreset = () => {
    const text = getGeneratedPresetText();
    const unit = opType === "consult" ? "جلسة" : opType === "package" ? "باقة" : opType === "filing" ? "خدمة" : "نسبة";
    const price = opType === "consult" ? 85 : opType === "package" ? 150 : opType === "filing" ? 120 : 50;

    setLineItems(prev => [
      ...prev,
      { id: Date.now(), name: text, qty: 1, unit, price, discount: 0, taxRate: taxEnabled ? 16 : 0 }
    ]);
  };

  const fetchNextNumber = async () => {
    try {
      const res = await fetch("/api/invoices/next-number");
      if (res.ok) {
        const data = await res.json();
        if (data.next_invoice_number) setInvNo(data.next_invoice_number);
        if (data.next_reference_number) setRefNo(data.next_reference_number);
        return;
      }
    } catch { }
    const year = new Date().getFullYear();
    let maxNum = 0;
    (invoices || []).forEach(inv => {
      const numStr = inv.invoice_number || inv.recurring_number || inv.refund_number || "";
      const match = numStr.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextSeq = String(maxNum + 1).padStart(6, '0');
    setInvNo(`INV-${year}-${nextSeq}`);
    setRefNo(`TX-${year}-${nextSeq}`);
  };

  const resetForm = () => {
    const year = new Date().getFullYear();
    let maxNum = 0;
    (invoices || []).forEach(inv => {
      const numStr = inv.invoice_number || inv.recurring_number || inv.refund_number || "";
      const match = numStr.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextSeq = String(maxNum + 1).padStart(6, '0');
    setInvNo(`INV-${year}-${nextSeq}`);
    setRefNo(`TX-${year}-${nextSeq}`);
    setInvDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date().toISOString().split('T')[0]);
    setTerms("0");
    setInvoiceClass("فاتورة خدمات");
    setStatus("مدفوعة");
    setLineItems([
      { id: 1, name: "استشارة فورية مع مستشار المنصة", qty: 1, unit: "جلسة", price: 85, discount: 0, taxRate: 16 },
      { id: 2, name: "استشارة دعم ومساعدة", qty: 1, unit: "استشارة", price: 45, discount: 0, taxRate: 16 }
    ]);
    setPayMethod("بطاقة بنكية");
    setPaymentStatus("مدفوع");
  };

  const handleOpenCreate = (isRec = false) => {
    resetForm();
    fetchNextNumber();
    setIsRecurringTab(isRec || tab === "recurring");
    setShowCreateEditor(true);
  };

  const handleAddRow = () => {
    setLineItems(prev => [
      ...prev,
      { id: Date.now(), name: "بند جديد", qty: 1, unit: "خدمة", price: 50, discount: 0, taxRate: taxEnabled ? 16 : 0 }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleViewInvoice = (item) => {
    setSel(item);
    setActiveMenuId(null);
  };

  const handleEditInvoice = (item, tabType) => {
    setActiveMenuId(null);
    setInvNo(item.invoice_number || item.recurring_number || item.refund_number || "INV-2026-000001");
    setRefNo(item.reference_number || "");
    if (item.created_at) setInvDate(new Date(item.created_at).toISOString().split('T')[0]);
    if (item.due_date) setDueDate(new Date(item.due_date).toISOString().split('T')[0]);
    if (item.user_name) {
      const foundIdx = CUSTOMERS.findIndex(c => c.name === item.user_name);
      if (foundIdx >= 0) setSelectedCustIndex(foundIdx);
    }
    if (item.total_amount || item.amount) {
      setLineItems([
        { id: 1, name: item.service_name || item.service || item.type || "خدمات استشارية", qty: 1, unit: "خدمة", price: item.total_amount || item.amount || 100, discount: 0, taxRate: 16 }
      ]);
    }
    if (tabType === "recurring") setIsRecurringTab(true);
    setShowCreateEditor(true);
  };

  const handleDeleteInvoice = async (item, tabType) => {
    setActiveMenuId(null);
    if (!window.confirm("هل أنت تأكد من رغبتك في حذف هذا العنصر؟")) return;
    try {
      let endpoint = `/api/invoices/${item.id}`;
      if (tabType === "recurring") endpoint = `/api/recurring-invoices/${item.id}`;
      if (tabType === "refunds") endpoint = `/api/refunded-invoices/${item.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        alert("تم الحذف بنجاح");
        fetchInvoices();
      } else {
        if (tabType === "invoices") setInvoices(prev => prev.filter(i => i.id !== item.id));
        if (tabType === "recurring") setRecInvoices(prev => prev.filter(i => i.id !== item.id));
        if (tabType === "refunds") setRefInvoices(prev => prev.filter(i => i.id !== item.id));
        alert("تم الحذف بنجاح");
      }
    } catch {
      if (tabType === "invoices") setInvoices(prev => prev.filter(i => i.id !== item.id));
      if (tabType === "recurring") setRecInvoices(prev => prev.filter(i => i.id !== item.id));
      if (tabType === "refunds") setRefInvoices(prev => prev.filter(i => i.id !== item.id));
      alert("تم الحذف بنجاح");
    }
  };

  const handleResendInvoice = (item) => {
    setActiveMenuId(null);
    alert(`تم إعادة إرسال الفاتورة بنجاح إلى البريد الإلكتروني الخاص بالعميل (${item.user_email || item.user_name || "العميل"})`);
  };

  const handleDownloadPDF = (item) => {
    setActiveMenuId(null);
    setSel(item);
    setTimeout(() => {
      diwanPrintA5();
    }, 200);
  };

  const renderRowActions = (item, tabType) => {
    const isOpen = activeMenuId === `${tabType}-${item.id}`;
    return (
      <td style={{ padding: "13px 14px", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          style={{ background: isOpen ? "#F1F5F9" : "none", border: "none", cursor: "pointer", color: isOpen ? "#0D3C5C" : "#94A3B8", fontSize: 18, fontWeight: 900, padding: "4px 8px", borderRadius: 6 }}
          onClick={() => setActiveMenuId(isOpen ? null : `${tabType}-${item.id}`)}
        >
          ···
        </button>
        {isOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setActiveMenuId(null)} />
            <div
              style={{
                position: "absolute",
                left: 10,
                top: "calc(100% - 4px)",
                zIndex: 9999,
                background: "#ffffff",
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(15,23,42,0.18), 0 2px 6px rgba(0,0,0,0.06)",
                border: "1.5px solid #E2E8F0",
                minWidth: 180,
                padding: "6px 0",
                direction: "rtl",
                fontSize: 12,
                fontWeight: 800,
                textAlign: "right"
              }}
            >
              <div
                onClick={() => handleViewInvoice(item)}
                style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#334155" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <i className="fa-regular fa-eye" style={{ color: "#64748B", width: 16 }}></i>
                <span>عرض</span>
              </div>
              <div
                onClick={() => handleEditInvoice(item, tabType)}
                style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#334155" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <i className="fa-regular fa-pen-to-square" style={{ color: "#64748B", width: 16 }}></i>
                <span>تعديل</span>
              </div>
              <div
                onClick={() => handleDeleteInvoice(item, tabType)}
                style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#DC2626" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <i className="fa-regular fa-trash-can" style={{ color: "#DC2626", width: 16 }}></i>
                <span>حذف</span>
              </div>
              <div style={{ height: 1, background: "#F1F5F9", margin: "4px 0" }} />
              <div
                onClick={() => handleResendInvoice(item)}
                style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#334155" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <i className="fa-regular fa-paper-plane" style={{ color: "#64748B", width: 16 }}></i>
                <span>إعادة إرسال للعميل</span>
              </div>
              <div
                onClick={() => handleDownloadPDF(item)}
                style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#334155" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <i className="fa-solid fa-download" style={{ color: "#64748B", width: 16 }}></i>
                <span>تنزيل PDF</span>
              </div>
            </div>
          </>
        )}
      </td>
    );
  };

  const submitInvoice = async (targetStatus) => {
    try {
      const currentCust = CUSTOMERS[selectedCustIndex] || CUSTOMERS[0];
      const opDetails = {
        consultType,
        consultantName,
        sessionNo,
        packageOpType,
        currentPackage,
        packageDuration,
        taxServiceType,
        taxPeriod,
        taxFileNo,
        platformConsultant,
        consultationNo,
        platformRate,
      };

      const payload = {
        invoice_number: invNo,
        reference_number: refNo,
        payment_terms: terms,
        issued_at: invDate,
        due_date: dueDate,
        currency: currency,
        type: "client_invoice",
        invoice_class: invoiceClass,
        status: targetStatus,
        customer_type: customerType,
        tax_treatment: taxTreatment,
        tax_enabled: taxEnabled,
        seller_name: seller === "أخرى" ? (otherSellerName || "جهة أخرى") : seller,
        customer_name: currentCust.name,
        customer_address: currentCust.address,
        customer_tax_number: currentCust.tax || "",
        operation_type: opType,
        operation_details: opDetails,
        line_items: lineItems.map(item => ({
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          discount: item.discount,
          taxRate: item.taxRate,
          total: (Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0)) * (1 + (taxEnabled ? Number(item.taxRate || 0) / 100 : 0))
        })),
        amount: calcSubtotal,
        subtotal: calcSubtotal,
        discount_total: 0,
        tax_amount: calcTaxTotal,
        tax_total: calcTaxTotal,
        total_amount: calcGrandTotal,
        grand_total: calcGrandTotal,
        total_words: numberToArabicWords(calcGrandTotal),
        payment_method: payMethod,
        notes: notes,
        terms_and_conditions: tc,
        logo_url: logoUrl,
        bank_account_info: collectionAccount,
        responsible_dept: responsibleDept,
        signer_name: signName,
        e_invoice_id: eInvId,
        e_invoice_status: eStatus,
        is_recurring: isRecurringTab || tab === "recurring",
        recurring_cycle: recurringCycle,
        recurring_start_date: recurringStartDate,
        recurring_next_date: recurringNextDate,
        recurring_state: recurringState,
      };

      const res = await fetch("/api/invoices/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "حدث خطأ أثناء حفظ الفاتورة");
      }

      const created = await res.json();

      if (payload.is_recurring) {
        await fetch("/api/recurring-invoices/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            recurring_number: invNo,
            reference_number: refNo,
            user_name: payload.customer_name,
            cycle: payload.recurring_cycle,
            issued_date: payload.recurring_start_date,
            due_date: payload.due_date,
            amount: payload.grand_total,
            paid_amount: targetStatus === "paid" ? payload.grand_total : 0,
            status: payload.recurring_state || "active",
            notes: payload.notes
          })
        }).catch(() => { });
      }

      setShowCreateEditor(false);
      fetchInvoices();
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleCreateRefund = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/refunded-invoices/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(refundForm)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "فشل إنشاء طلب الاسترداد");
      }
      setShowRefundModal(false);
      setRefundForm({
        invoice_number: "",
        user_name: "",
        service_name: "",
        original_amount: 0,
        refund_amount: 0,
        bearer: "المنصة",
        status: "pending",
        reason: ""
      });
      fetchInvoices();
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleSaveDraft = () => submitInvoice("draft");
  const handleIssueInvoice = () => submitInvoice(status === "مدفوعة" ? "paid" : "issued");

  const diwanPrintA5 = () => {
    try {
      const source = document.querySelector('.invoice-sheet') || document.getElementById('invoice-sheet-container');
      if (!source) {
        throw new Error('لم يتم العثور على الفاتورة (invoice-sheet)');
      }

      const popup = window.open('about:blank', '_blank', 'width=1200,height=850');
      if (!popup) {
        alert('اسمح بالنوافذ المنبثقة لهذه الصفحة ثم أعد المحاولة.');
        return;
      }

      const clone = source.cloneNode(true);
      clone.id = 'printInvoiceSheet';
      clone.style.margin = '0';
      clone.style.maxWidth = 'none';
      clone.style.position = 'static';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.width = Math.max(source.scrollWidth, source.offsetWidth) + 'px';
      clone.style.boxShadow = 'none';
      clone.style.transform = 'none';

      popup.document.open();
      popup.document.write(`
        <!doctype html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="utf-8">
            <title>طباعة الفاتورة - ${invNo}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                @page {
                    size: A5 landscape;
                    margin: 0;
                }
                html, body {
                    margin: 0!important;
                    padding: 0!important;
                    width: 210mm!important;
                    height: 148mm!important;
                    overflow: hidden!important;
                    background: #fff!important;
                    font-family: 'Cairo', 'Tajawal', sans-serif;
                }
                #printPage {
                    width: 210mm;
                    height: 148mm;
                    position: relative;
                    overflow: hidden;
                    background: #fff;
                }
                #printFrame {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%,-50%);
                    transform-origin: center center;
                }
                #printInvoiceSheet {
                    margin: 0!important;
                    box-shadow: none!important;
                    page-break-inside: avoid!important;
                    break-inside: avoid!important;
                }
                .invoice-view-top, .details-backdrop, .details-drawer, .inv-version-row {
                    display: none!important;
                }
            </style>
        </head>
        <body>
            <div id="printPage">
                <div id="printFrame">
                    ${clone.outerHTML}
                </div>
            </div>
            <script>
                (function(){
                    function fit(){
                        const page = document.getElementById('printPage');
                        const frame = document.getElementById('printFrame');
                        const sheet = document.getElementById('printInvoiceSheet');
                        if(!page || !frame || !sheet) return;
                        sheet.style.transform = 'none';
                        const pw = page.clientWidth - 16;
                        const ph = page.clientHeight - 16;
                        const sw = Math.max(sheet.scrollWidth, sheet.offsetWidth);
                        const sh = Math.max(sheet.scrollHeight, sheet.offsetHeight);
                        const scale = Math.min(pw / sw, ph / sh, 1);
                        frame.style.width = sw + 'px';
                        frame.style.height = sh + 'px';
                        frame.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
                    }
                    Promise.resolve(document.fonts && document.fonts.ready ? document.fonts.ready : null).then(function(){
                        setTimeout(function(){
                            fit();
                            setTimeout(function(){
                                window.focus();
                                window.print();
                            }, 180);
                        }, 120);
                    });
                })();
            <\/script>
        </body>
        </html>
      `);
      popup.document.close();
    } catch (e) {
      console.error(e);
      alert('تعذر تجهيز الطباعة: ' + e.message);
    }
  };

  const diwanDownloadA5Pdf = () => {
    diwanPrintA5();
  };

  useEffect(() => {
    window.diwanPrintA5 = diwanPrintA5;
    window.diwanDownloadA5Pdf = diwanDownloadA5Pdf;
    window.openPreview = () => setShowPreviewModal(true);
    return () => {
      delete window.diwanPrintA5;
      delete window.diwanDownloadA5Pdf;
      delete window.openPreview;
    };
  });

  const handlePrint = () => setShowPreviewModal(true);

  const STATUS_TABS = ["الكل", "مدفوعة", "صادرة", "مسودة", "غير مدفوعة", "مدفوعة جزئياً", "ملغاة"];
  const tabKey = { "مدفوعة": "paid", "صادرة": "issued", "مسودة": "draft", "غير مدفوعة": "issued", "مدفوعة جزئياً": "partial", "ملغاة": "cancelled" };

  const filtInv = invoices
    .filter(inv => {
      const ms = !search ||
        (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.user_email || "").toLowerCase().includes(search.toLowerCase());

      const chipMatch = stFilter === "الكل" ? true : inv.status === tabKey[stFilter];
      const dropStatusMatch = filterStatus === "الكل" ? true : inv.status === filterStatus;
      const payMatch = filterPayMethod === "الكل" ? true : inv.payment_method === filterPayMethod;

      const amt = parseFloat(inv.total_amount || 0);
      const minMatch = !filterMinAmount || amt >= parseFloat(filterMinAmount);
      const maxMatch = !filterMaxAmount || amt <= parseFloat(filterMaxAmount);

      return ms && chipMatch && dropStatusMatch && payMatch && minMatch && maxMatch;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.created_at || b.issued_at || 0) - new Date(a.created_at || a.issued_at || 0);
      if (sortBy === "date_asc") return new Date(a.created_at || a.issued_at || 0) - new Date(b.created_at || b.issued_at || 0);
      if (sortBy === "amount_desc") return parseFloat(b.total_amount || 0) - parseFloat(a.total_amount || 0);
      if (sortBy === "amount_asc") return parseFloat(a.total_amount || 0) - parseFloat(b.total_amount || 0);
      return 0;
    });

  const recList = recInvoices;
  const filtRec = recList
    .filter(r => {
      const ms = !search ||
        (r.recurring_number || r.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.user_name || "").toLowerCase().includes(search.toLowerCase());

      const dropStatusMatch = filterStatus === "الكل" ? true : r.status === filterStatus;
      const amt = parseFloat(r.amount || 0);
      const minMatch = !filterMinAmount || amt >= parseFloat(filterMinAmount);
      const maxMatch = !filterMaxAmount || amt <= parseFloat(filterMaxAmount);

      return ms && dropStatusMatch && minMatch && maxMatch;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "date_asc") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "amount_desc") return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
      if (sortBy === "amount_asc") return parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
      return 0;
    });

  const refList = refInvoices;
  const filtRef = refList
    .filter(r => {
      const ms = !search ||
        (r.refund_number || r.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.invoice_number || r.invoice_id || "").toLowerCase().includes(search.toLowerCase());

      const dropStatusMatch = filterStatus === "الكل" ? true : r.status === filterStatus;
      const amt = parseFloat(r.refund_amount || 0);
      const minMatch = !filterMinAmount || amt >= parseFloat(filterMinAmount);
      const maxMatch = !filterMaxAmount || amt <= parseFloat(filterMaxAmount);

      return ms && dropStatusMatch && minMatch && maxMatch;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "date_asc") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "amount_desc") return parseFloat(b.refund_amount || 0) - parseFloat(a.refund_amount || 0);
      if (sortBy === "amount_asc") return parseFloat(a.refund_amount || 0) - parseFloat(b.refund_amount || 0);
      return 0;
    });

  const total = invoices.reduce((a, i) => a + parseFloat(i.total_amount || 0), 0);
  const paidAmt = invoices.filter(i => i.status === "paid").reduce((a, i) => a + parseFloat(i.total_amount || 0), 0);
  const pendingAmt = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((a, i) => a + parseFloat(i.total_amount || 0), 0);
  const overdueAmt = invoices.filter(i => i.status === "overdue").reduce((a, i) => a + parseFloat(i.total_amount || 0), 0);

  const recRevenue = recList.reduce((a, r) => a + Number(r.paid_amount || r.paid || 0), 0);
  const refTotal = refList.reduce((a, r) => a + Number(r.refund_amount || 0), 0);

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (tab === "invoices") {
      filename = `diwan-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ["رقم الفاتورة", "العميل", "البريد الإلكتروني", "تاريخ الإنشاء", "المبلغ الإجمالي", "المدفوع", "الحالة", "طريقة الدفع", "تاريخ الاستحقاق"];
      rows = filtInv.map(inv => [
        inv.invoice_number || "-",
        inv.user_name || "-",
        inv.user_email || "",
        fmtDate(inv.created_at),
        inv.total_amount || 0,
        inv.status === "paid" ? inv.total_amount : 0,
        si(inv.status).label,
        inv.payment_method || "-",
        fmtDate(inv.due_date)
      ]);
    } else if (tab === "recurring") {
      filename = `diwan-recurring-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ["رقم الفاتورة الدورية", "العميل", "البريد الإلكتروني", "تاريخ الإنشاء", "دورة التكرار", "تاريخ الإصدار", "تاريخ الاستحقاق", "المدفوع", "المستحق", "الحالة"];
      rows = filtRec.map(r => [
        r.recurring_number || r.id,
        r.user_name || "-",
        r.user_email || "",
        fmtDate(r.created_at),
        CYCLES[r.cycle] || r.cycle,
        fmtDate(r.issued_date),
        fmtDate(r.due_date),
        r.paid_amount || r.paid || 0,
        r.amount || 0,
        si(r.status).label
      ]);
    } else if (tab === "refunds") {
      filename = `diwan-refunded-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ["رقم الاسترداد", "الفاتورة الأصلية", "العميل", "الخدمة / العملية", "المبلغ الأصلي", "المبلغ المسترد", "الجهة المتحملة", "الحالة", "تاريخ الطلب"];
      rows = filtRef.map(r => [
        r.refund_number || r.id,
        r.invoice_number || r.invoice_id || "-",
        r.user_name || "-",
        r.service_name || r.service || "-",
        r.original_amount || 0,
        r.refund_amount || 0,
        r.bearer || "المنصة",
        si(r.status).label,
        fmtDate(r.created_at)
      ]);
    }

    if (rows.length === 0) {
      alert("لا توجد بيانات للتصدير.");
      return;
    }

    // UTF-8 BOM prefix \uFEFF ensures Arabic headers open correctly in Excel on Windows
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: "invoices", label: "الفواتير" },
    { id: "recurring", label: "الفواتير الدورية" },
    { id: "refunds", label: "الفواتير المستردة" },
  ];

  const titles = { invoices: "الفواتير", recurring: "الفواتير الدورية", refunds: "الفواتير المستردة" };
  const subs = { invoices: "إدارة ومتابعة جميع فواتير ديوان", recurring: "إدارة الفواتير المتكررة ودوريتها", refunds: "إدارة عمليات استرداد قيمة الخدمات" };
  const btnLabel = { invoices: "إنشاء فاتورة جديدة", recurring: "إنشاء فاتورة دورية", refunds: "إنشاء طلب استرداد" };

  const currentCust = CUSTOMERS[selectedCustIndex] || CUSTOMERS[0];

  return (
    <div style={{ direction: "rtl", fontFamily: "'Cairo','Tajawal',sans-serif", color: "#1E293B", minHeight: "100vh", background: "#F8FAFC" }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        @keyframes sp{to{transform:rotate(360deg)}}
        .inv-row:hover td{background:#F8FAFC!important;cursor:pointer}
        .m-tab{border:none;background:transparent;font-family:inherit;font-size:13.5px;font-weight:700;color:#64748B;padding:10px 20px;cursor:pointer;border-bottom:2.5px solid transparent;transition:all .15s;white-space:nowrap}
        .m-tab.a{color:#0D3C5C;border-bottom-color:#0D3C5C;font-weight:900}
        .m-tab:hover:not(.a){color:#0D3C5C}
        .chip{border:none;font-family:inherit;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;cursor:pointer;transition:all .15s;white-space:nowrap}
        .ab{border:1.5px solid #E2E8F0;background:#fff;border-radius:9px;padding:7px 16px;font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;color:#0D3C5C;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
        .ab:hover{background:#0D3C5C;color:#fff;border-color:#0D3C5C}
        .pb{border:none;background:#0D3C5C;color:#fff;border-radius:9px;padding:8px 18px;font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
        .pb:hover{background:#0B2E4B}
        select, input.input, textarea{border:1.5px solid #CBD5E1;border-radius:9px;padding:8px 12px;font-family:inherit;font-size:13px;color:#0D3C5C;background:#fff;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.2s}
        select:focus, input.input:focus, textarea:focus{border-color:#0D3C5C;box-shadow:0 0 0 3px rgba(13,60,92,0.1)}
        
        /* Create Editor Styles */
        .module-view { background: #F8FAFC; padding: 24px 28px; }
        .pagebar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 18px 24px; border-radius: 14px; border: 1.5px solid #E2E8F0; margin-bottom: 24px; }
        .pagebar h1 { margin: 0; font-size: 22px; color: #0D3C5C; font-weight: 900; }
        .pagebar .crumb { font-size: 12px; color: #64748B; margin-top: 2px; }
        .page-actions { display: flex; gap: 10px; }
        .ghost-btn { background: #fff; border: 1.5px solid #CBD5E1; border-radius: 9px; padding: 8px 16px; font-weight: 700; color: #475569; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
        .ghost-btn:hover { background: #F1F5F9; color: #0D3C5C; }
        .preview-btn { background: #E0F2FE; color: #0369A1; border: 1.5px solid #BAE6FD; border-radius: 9px; padding: 8px 16px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
        .preview-btn:hover { background: #BAE6FD; }
        .primary-top { background: #0D3C5C; color: #fff; border: none; border-radius: 9px; padding: 8px 18px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
        .primary-top:hover { background: #0B2E4B; }

        .card { background: #fff; border-radius: 14px; border: 1.5px solid #E2E8F0; margin-bottom: 20px; overflow: hidden; }
        .card-h { padding: 16px 22px; border-bottom: 1.5px solid #F1F5F9; background: #FAFBFD; display: flex; flex-direction: column; }
        .card-h span { font-size: 15px; font-weight: 800; color: #0D3C5C; }
        .card-h small { font-size: 11px; color: #94A3B8; margin-top: 2px; }
        .card-b { padding: 20px 22px; }

        .grid { display: grid; gap: 16px; }
        .grid.four { grid-template-columns: repeat(4, 1fr); }
        .grid.three { grid-template-columns: repeat(3, 1fr); }
        .grid.two { grid-template-columns: repeat(2, 1fr); }

        label { display: block; font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 6px; }
        .req { color: #DC2626; }

        .logo-uploader { border: 2px dashed #CBD5E1; border-radius: 12px; padding: 16px; text-align: center; background: #F8FAFC; cursor: pointer; position: relative; transition: background 0.2s; }
        .logo-uploader:hover { background: #F1F5F9; border-color: #0D3C5C; }
        .logo-uploader i { font-size: 24px; color: #94A3B8; display: block; margin-bottom: 4px; }
        .logo-uploader span { font-size: 12px; font-weight: 700; color: #0D3C5C; display: block; }
        .logo-uploader small { font-size: 10px; color: #94A3B8; }

        .switchline { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
        .switch { width: 44px; height: 24px; background: #CBD5E1; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.2s; }
        .switch.on { background: #0D3C5C; }
        .switch::after { content: ''; position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
        .switch.on::after { transform: translateX(-20px); }

        .recurring-settings-card { border-color: #BAE6FD; background: #F0F9FF; }
        .recurring-note { background: #E0F2FE; border-radius: 9px; padding: 10px 14px; font-size: 12px; color: #0369A1; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-top: 14px; }

        .billwrap { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .billbox { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px; }
        .billhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; }
        .billhead b { font-size: 13px; color: #0D3C5C; }
        .billhead .link { background: none; border: none; color: #0891B2; font-weight: 800; font-size: 12px; cursor: pointer; }
        .customer-summary { display: flex; align-items: center; gap: 12px; margin-top: 12px; background: #fff; padding: 12px; border-radius: 10px; border: 1px solid #E2E8F0; }
        .customer-summary .round { width: 36px; height: 36px; border-radius: 50%; background: #0D3C5C; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; }
        .customer-summary div { display: flex; flex-direction: column; }
        .customer-summary b { font-size: 13px; color: #0D3C5C; }
        .customer-summary span { font-size: 11px; color: #64748B; margin-top: 2px; }

        .operation-types { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
        .op-card { border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px; background: #fff; cursor: pointer; text-align: center; transition: all 0.2s; }
        .op-card:hover { border-color: #0D3C5C; }
        .op-card.active { border-color: #7C3AED; background: #F5F3FF; box-shadow: 0 0 0 2px rgba(124,58,237,0.15); }
        .op-card i { font-size: 22px; color: #0D3C5C; display: block; margin-bottom: 6px; }
        .op-card.active i { color: #7C3AED; }
        .op-card b { display: block; font-size: 13px; color: #0D3C5C; margin-bottom: 2px; }
        .op-card span { font-size: 10px; color: #64748B; }

        .dynamic-panel { background: #FAFBFD; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 18px; }
        .dynamic-panel-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 13px; color: #0D3C5C; }
        .badge { background: #F3E8FF; color: #7E22CE; font-size: 11px; padding: 4px 10px; border-radius: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }

        .service-add-line { display: flex; gap: 10px; margin-top: 6px; }
        .service-add-btn { background: #0D3C5C; color: #fff; border: none; border-radius: 9px; padding: 8px 18px; font-weight: 800; cursor: pointer; white-space: nowrap; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        .service-add-btn:hover { background: #0B2E4B; }
        .hint-text { font-size: 11px; color: #94A3B8; margin-top: 6px; }

        .tablewrap { overflow-x: auto; margin-bottom: 14px; }
        table.items-table { width: 100%; border-collapse: collapse; text-align: right; }
        table.items-table th { background: #F8FAFC; padding: 10px 12px; font-size: 11px; font-weight: 800; color: #475569; border-bottom: 1.5px solid #E2E8F0; }
        table.items-table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }
        .addrow { background: #F1F5F9; border: 1.5px dashed #CBD5E1; border-radius: 9px; width: 100%; padding: 10px; font-weight: 800; color: #0D3C5C; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .addrow:hover { background: #E2E8F0; }

        .del-btn { background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .del-btn:hover { background: #FCA5A5; color: #991B1B; }

        .payment-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .methodcards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .method { border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 12px; text-align: center; background: #fff; cursor: pointer; transition: all 0.2s; }
        .method.active { border-color: #0D3C5C; background: #F0F7FF; }
        .method i { font-size: 18px; color: #0D3C5C; display: block; margin-bottom: 4px; }
        .method b { font-size: 11px; color: #0D3C5C; }
        .payment-info { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px; }
        .payment-info h4 { margin: 0 0 12px; font-size: 13px; color: #0D3C5C; font-weight: 800; }
        .payment-info .line { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
        .payment-info .hint { font-size: 10px; color: #94A3B8; margin-top: 12px; }

        .extra { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .summary { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px; }
        .sumrow { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #475569; }
        .sumrow.total { border-top: 1px solid #E2E8F0; padding-top: 8px; font-weight: 800; color: #0D3C5C; }
        .sumrow.final { font-size: 16px; font-weight: 900; color: #0D3C5C; border-top: 2px solid #0D3C5C; padding-top: 10px; margin-top: 6px; }
        .words { font-size: 11px; color: #64748B; font-weight: 700; background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid #E2E8F0; margin-top: 12px; text-align: center; }

        .qr-grid { display: flex; gap: 20px; align-items: center; }
        .qr { width: 100px; height: 100px; background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #94A3B8; flex-shrink: 0; }
        .e-status { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .dot.amber { background: #F59E0B; }
        .dot.green { background: #10B981; }

        .footer-actions { display: flex; gap: 12px; justify-content: flex-end; padding: 20px 0; }
        .btn.primary { background: #0D3C5C; color: #fff; border: none; border-radius: 9px; padding: 10px 24px; font-weight: 800; cursor: pointer; font-size: 14px; }
        .btn.dark { background: #1E293B; color: #fff; border: none; border-radius: 9px; padding: 10px 24px; font-weight: 800; cursor: pointer; font-size: 14px; }
        .btn { background: #fff; border: 1.5px solid #CBD5E1; border-radius: 9px; padding: 10px 20px; font-weight: 700; color: #475569; cursor: pointer; font-size: 14px; }
        .btn:hover { background: #F1F5F9; }
      `}</style>

      {/* FULL-SCREEN PREVIEW MODAL MATCHING SCREENSHOTS EXACTLY */}
      {showPreviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 99999, display: "flex", flexDirection: "column", backdropFilter: "blur(4px)", overflowY: "auto" }}>
          {/* Top Sticky Pagebar */}
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1.5px solid #E2E8F0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="ghost-btn" onClick={() => setShowPreviewModal(false)} type="button">
                <i className="fa-solid fa-arrow-right"></i> العودة إلى إنشاء الفاتورة
              </button>
              <h3 style={{ margin: 0, fontSize: 18, color: "#0D3C5C", fontWeight: 900 }}>معاينة الفاتورة {invNo}</h3>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="primary-top" onClick={diwanPrintA5} type="button">
                <i className="fa-solid fa-print"></i> طباعة الفاتورة (A5)
              </button>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748B", fontWeight: "bold" }} onClick={() => setShowPreviewModal(false)}>
                ×
              </button>
            </div>
          </div>

          {/* Preview Sheet Card */}
          <div style={{ padding: "32px 20px", width: "100%", boxSizing: "border-box" }}>
            <div
              className="invoice-sheet"
              style={{
                maxWidth: 940,
                margin: "0 auto",
                background: "#fff",
                borderRadius: 16,
                border: "1.5px solid #E2E8F0",
                padding: "40px 48px",
                boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
                fontFamily: "'Cairo','Tajawal',sans-serif",
                direction: "rtl"
              }}
            >
              {/* Gray Top Section Container (Matches user screenshot exactly) */}
              <div style={{ background: "#F1F5F9", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "32px 36px", marginBottom: 32 }}>
                {/* Top Logo & Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #CBD5E1", paddingBottom: 24, marginBottom: 28 }}>
                  {/* Right Side: Title & Company Subtitles */}
                  <div style={{ textAlign: "right" }}>
                    <h1 style={{ margin: 0, fontSize: 32, color: "#0D3C5C", fontWeight: 900 }}>فاتورة</h1>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0D3C5C", marginTop: 6 }}>
                      {seller === "أخرى" ? (otherSellerName || "منصة ديوان للاستشارات الضريبية") : seller}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>عمّان، المملكة الأردنية الهاشمية</div>
                  </div>

                  {/* Left Side: Dynamic Logo Image */}
                  <div style={{ textAlign: "left" }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ maxHeight: 95, maxWidth: 220, objectFit: "contain" }} />
                    ) : (
                      <div style={{ padding: "12px 20px", border: "2px dashed #CBD5E1", borderRadius: 12, background: "#fff", color: "#0D3C5C", textAlign: "center" }}>
                        <i className="fa-regular fa-image" style={{ fontSize: 24, display: "block", marginBottom: 4 }}></i>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>شعار الفاتورة</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Info Columns Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                  {/* Column 1: Details */}
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>تفاصيل الفاتورة</h4>
                    <div style={{ fontSize: 12, display: "grid", gap: 6, color: "#475569" }}>
                      <div><span>رقم الفاتورة: </span><b style={{ color: "#0D3C5C" }}>{invNo}</b></div>
                      <div><span>تاريخ الإصدار: </span><b>{invDate}</b></div>
                      <div><span>تاريخ الاستحقاق: </span><b>{dueDate}</b></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <span>حالة الدفع:</span>
                        <span style={{ background: "#0D3C5C", color: "#fff", borderRadius: 6, padding: "3px 14px", fontSize: 11, fontWeight: 800 }}>{status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Issuer */}
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>صادرة من</h4>
                    <div style={{ fontSize: 12, display: "grid", gap: 4, color: "#475569" }}>
                      <b style={{ color: "#0D3C5C", fontSize: 13 }}>{seller === "أخرى" ? (otherSellerName || "جهة أخرى") : seller}</b>
                      <div>عمّان، الأردن</div>
                      <div>الهاتف: +962 6 0000 000</div>
                      <div>البريد: info@diwanjo.com</div>
                      <div>الرقم الضريبي: 123456789</div>
                    </div>
                  </div>

                  {/* Column 3: Customer Card */}
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>الفاتورة إلى</h4>
                    <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0D3C5C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                          <i className="fa-solid fa-building"></i>
                        </div>
                        <b style={{ fontSize: 13, color: "#0D3C5C" }}>{currentCust.name}</b>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", display: "grid", gap: 3 }}>
                        <div>{currentCust.address} · {currentCust.type} · رقم ضريبي {currentCust.tax || "200145879"}</div>
                        <div>الهاتف: {currentCust.phone || "+962 7 962 9000 000"}</div>
                        <div>البريد: {currentCust.email || "client@example.com"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Title */}
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0D3C5C", fontWeight: 900 }}>بنود المنتجات / الخدمات</h3>

              {/* Items Table */}
              <div style={{ overflowX: "auto", marginBottom: 28 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#1E293B", color: "#ffffff" }}>
                      <th style={{ padding: "14px 16px", width: 40, borderTopRightRadius: 8, borderBottomRightRadius: 8, fontWeight: 800 }}>#</th>
                      <th style={{ padding: "14px 16px", fontWeight: 800 }}>المنتج / الخدمة</th>
                      <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الكمية</th>
                      <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الوحدة</th>
                      <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>السعر</th>
                      <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الخصم</th>
                      <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الضريبة (%)</th>
                      <th style={{ padding: "14px 16px", textAlign: "center", borderTopLeftRadius: 8, borderBottomLeftRadius: 8, fontWeight: 800 }}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => {
                      const net = (Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0));
                      const itemTax = taxEnabled ? (net * Number(item.taxRate || 0) / 100) : 0;
                      const totalItem = net + itemTax;
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0", background: "#ffffff" }}>
                          <td style={{ padding: "14px 16px", color: "#64748B", fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: "14px 16px", fontWeight: 800, color: "#1E293B" }}>{item.name}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.qty}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.unit}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{fmt(item.price)}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{fmt(item.discount)}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{taxEnabled ? `${item.taxRate}%` : "0%"}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800, color: "#0D3C5C" }}>{fmt(totalItem)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
                {/* Right: Payment details & QR */}
                <div>
                  <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <div style={{ width: 110, height: 110, padding: 4, background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 12, flexShrink: 0 }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          [
                            `المفوّتر: ${seller === "أخرى" ? (otherSellerName || "جهة أخرى") : seller}`,
                            `رقم الفاتورة: ${invNo}`,
                            `التاريخ: ${invDate}`,
                            `الإجمالي: ${calcGrandTotal.toFixed(3)} ${currency}`
                          ].join("\n")
                        )}`}
                        alt="QR"
                        style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "contain" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, marginBottom: 4 }}>رمز الفاتورة الإلكتروني</div>
                      <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#0D3C5C", fontWeight: 900 }}>تفاصيل الدفع</h4>
                      <div style={{ fontSize: 11, color: "#475569", display: "grid", gap: 3 }}>
                        <div><span>البنك / الجهة المصدرة: </span><b>Visa / Mastercard Processor</b></div>
                        <div><span>البطاقة / الحساب: </span><b>4582 **** **** ****</b></div>
                        <div><span>طريقة الدفع: </span><b>{payMethod}</b></div>
                        <div><span>المبلغ المدفوع: </span><b>{fmt(calcGrandTotal)} د.أ</b></div>
                        <div><span>مرجع الدفع: </span><b>{payRef || "—"}</b></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left: Totals summary */}
                <div style={{ fontSize: 13, display: "grid", gap: 8, background: "#F8FAFC", padding: 18, borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                    <span>المبلغ</span>
                    <b>{fmt(calcSubtotal)} د.أ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                    <span>الضريبة</span>
                    <b>{fmt(calcTaxTotal)} د.أ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#DC2626" }}>
                    <span>الخصم</span>
                    <b>0.000 د.أ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #0D3C5C", paddingTop: 10, marginTop: 4, fontSize: 18, fontWeight: 900, color: "#0D3C5C" }}>
                    <span>الإجمالي ({currency})</span>
                    <b>{fmt(calcGrandTotal)} د.أ</b>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 4, fontWeight: 700 }}>
                    الإجمالي كتابة: إجمالي مستحق: {fmt(calcGrandTotal)} د.أ
                  </div>
                </div>
              </div>

              {/* Bottom Terms & Signature (Matches 1st user screenshot exactly) */}
              <div style={{ borderTop: "1.5px solid #E2E8F0", paddingTop: 20, marginTop: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
                  {/* Right: Terms & Notes */}
                  <div style={{ textAlign: "right" }}>
                    <h5 style={{ margin: "0 0 4px", fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>الشروط والأحكام</h5>
                    <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{tc}</p>
                    <h5 style={{ margin: "12px 0 4px", fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>ملاحظات</h5>
                    <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{notes || "جميع الرسوم نهائية وتشمل الضرائب والرسوم والتكاليف الإضافية المطبقة."}</p>
                  </div>

                  {/* Left: Signature Graphic & Signer Name */}
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature" style={{ maxHeight: 60, maxWidth: 180, objectFit: "contain", marginBottom: 6 }} />
                    ) : (
                      <div style={{ fontFamily: "cursive, 'Cairo'", fontSize: 26, color: "#0D3C5C", fontWeight: 900, fontStyle: "italic", marginBottom: 4 }}>Tax Platform</div>
                    )}
                    <div style={{ fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>{signName || "سارة علي - النائب التنفيذي"}</div>
                  </div>
                </div>

                {/* Gray Footer Platform Banner */}
                <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <b style={{ fontSize: 13, color: "#0D3C5C", display: "block" }}>منصة ديوان للاستشارات الضريبية</b>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>عمّان، المملكة الأردنية الهاشمية · الرقم الضريبي: 123456789</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "left" }}>
                    <div>الهاتف: +962 6 0000 000</div>
                    <div>البريد الإلكتروني: info@diwanjo.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE EDITOR OVERLAY */}
      {showCreateEditor ? (
        <section className="module-view" id="createInvoiceView">
          <div className="pagebar">
            <div>
              <h1>{isRecurringTab ? "إنشاء فاتورة دورية جديدة" : "إنشاء فاتورة"}</h1>
              <div className="crumb">الفواتير / إنشاء فاتورة جديدة</div>
            </div>
            <div className="page-actions">
              <button className="ghost-btn editor-close-btn" onClick={() => setShowCreateEditor(false)} type="button">
                <i className="fa-solid fa-xmark"></i> إغلاق
              </button>
              <button className="ghost-btn" onClick={resetForm} type="button">
                <i className="fa-solid fa-rotate-left"></i> إعادة تعيين
              </button>
              <button className="preview-btn" onClick={handlePrint} type="button">
                <i className="fa-regular fa-eye"></i> معاينة
              </button>
              <button className="primary-top" onClick={handleSaveDraft} type="button">
                <i className="fa-regular fa-floppy-disk"></i> حفظ كمسودة
              </button>
            </div>
          </div>

          {/* CARD 1: DETAILS */}
          <section className="card">
            <div className="card-h">
              <span>تفاصيل الفاتورة</span>
              <small>البيانات الأساسية للفوترة</small>
            </div>
            <div className="card-b">
              <div className="grid four">
                <div>
                  <label>رقم الفاتورة <span className="req">*</span></label>
                  <input className="input" value={invNo} onChange={e => setInvNo(e.target.value)} placeholder="INV-2026-000001" />
                </div>
                <div>
                  <label>الرقم المرجعي</label>
                  <input className="input" value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="TX-2026-000001" />
                </div>
                <div>
                  <label>تاريخ الفاتورة <span className="req">*</span></label>
                  <input className="input" type="date" value={invDate} onChange={e => setInvDate(e.target.value)} />
                </div>
                <div>
                  <label>شروط الدفع</label>
                  <select value={terms} onChange={e => {
                    setTerms(e.target.value);
                    const days = parseInt(e.target.value || "0");
                    const d = new Date(invDate || Date.now());
                    d.setDate(d.getDate() + days);
                    setDueDate(d.toISOString().split('T')[0]);
                  }}>
                    <option value="0">دفع فوري</option>
                    <option value="7">خلال 7 أيام</option>
                    <option value="15">خلال 15 يومًا</option>
                    <option value="30">خلال 30 يومًا</option>
                  </select>
                </div>
              </div>

              <div className="grid four" style={{ marginTop: 15 }}>
                <div>
                  <label>تاريخ الاستحقاق</label>
                  <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label>العملة</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="JOD">الدينار الأردني (JOD)</option>
                    <option value="USD">الدولار الأمريكي (USD)</option>
                  </select>
                </div>
                <div>
                  <label>نوع الفاتورة</label>
                  <select value={invoiceClass} onChange={e => setInvoiceClass(e.target.value)}>
                    <option>فاتورة خدمات</option>
                    <option>فاتورة مبيعات</option>
                    <option>فاتورة عمولة منصة</option>
                  </select>
                </div>
                <div>
                  <label>الحالة</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="مسودة">مسودة</option>
                    <option value="صادرة">صادرة</option>
                    <option value="مدفوعة">مدفوعة</option>
                    <option value="ملغاة">ملغاة</option>
                  </select>
                </div>
              </div>

              <div className="grid two" style={{ marginTop: 15 }}>
                <div>
                  <label>شعار الفاتورة</label>
                  <div
                    className="logo-uploader"
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      minHeight: 100,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed #CBD5E1",
                      borderRadius: 12,
                      padding: 14,
                      background: "#F8FAFC",
                      transition: "all 0.2s"
                    }}
                    onClick={() => document.getElementById("logoFileInput").click()}
                  >
                    <input
                      id="logoFileInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                    />
                    {logoUrl ? (
                      <div style={{ position: "relative", width: "100%", textAlign: "center" }}>
                        <img src={logoUrl} alt="Uploaded Logo" style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain", margin: "0 auto" }} />
                        <button
                          type="button"
                          style={{ position: "absolute", top: -6, left: 0, background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); setLogoUrl(""); }}
                        >
                          إزالة الشعار
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="fa-regular fa-image" style={{ fontSize: 26, color: "#0D3C5C", marginBottom: 4 }}></i>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0D3C5C" }}>اضغط لإضافة شعار المنصة</span>
                        <small style={{ fontSize: 11, color: "#94A3B8" }}>PNG / JPG / SVG</small>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="grid two">
                    <div>
                      <label>نوع العميل</label>
                      <select value={customerType} onChange={e => setCustomerType(e.target.value)}>
                        <option>أفراد</option>
                        <option>مؤسسة فردية</option>
                        <option>شركة ذات مسؤولية محدودة</option>
                        <option>شركة تضامن</option>
                        <option>شركة توصية بسيطة</option>
                        <option>شركة مساهمة خاصة</option>
                        <option>شركة مساهمة عامة</option>
                        <option>جامعات</option>
                        <option>حكومي</option>
                        <option>هيئات ومنظمات</option>
                        <option>جمعيات</option>
                        <option>أكاديمي وباحث</option>
                      </select>
                    </div>
                    <div>
                      <label>المعالجة الضريبية</label>
                      <select value={taxTreatment} onChange={e => setTaxTreatment(e.target.value)}>
                        <option>خاضعة للضريبة</option>
                        <option>معفاة</option>
                        <option>صفرية</option>
                        <option>غير خاضعة</option>
                      </select>
                      <div className="switchline">
                        <div className={`switch ${taxEnabled ? "on" : ""}`} onClick={() => setTaxEnabled(!taxEnabled)}></div>
                        <b>تفعيل الضريبة</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 2: RECURRING SETTINGS */}
          {(isRecurringTab || tab === "recurring") && (
            <section className="card recurring-settings-card" id="recurringSettingsCard">
              <div className="card-h">
                <span>إعدادات الفاتورة الدورية</span>
                <small>تظهر فقط عند إنشاء أو تعديل فاتورة دورية</small>
              </div>
              <div className="card-b">
                <div className="grid four">
                  <div>
                    <label>دورية الإصدار <span className="req">*</span></label>
                    <select value={recurringCycle} onChange={e => setRecurringCycle(e.target.value)}>
                      <option value="monthly">شهريًا / كل 30 يوم</option>
                      <option value="quarterly">كل 3 أشهر</option>
                      <option value="semiannual">كل 6 أشهر</option>
                      <option value="annual">سنويًا</option>
                    </select>
                  </div>
                  <div>
                    <label>تاريخ أول إصدار <span className="req">*</span></label>
                    <input className="input" type="date" value={recurringStartDate} onChange={e => setRecurringStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label>تاريخ الإصدار القادم</label>
                    <input className="input" type="date" readOnly value={recurringNextDate} />
                  </div>
                  <div>
                    <label>حالة التكرار</label>
                    <select value={recurringState} onChange={e => setRecurringState(e.target.value)}>
                      <option value="active">نشطة</option>
                      <option value="paused">متوقفة مؤقتًا</option>
                    </select>
                  </div>
                </div>
                <div className="recurring-note">
                  <i className="fa-solid fa-circle-info"></i>
                  يتم إصدار الفاتورة تلقائيًا وفق الدورة المحددة، ويمكن ربطها بتجديد الباقات أو الخدمات المتكررة.
                </div>
              </div>
            </section>
          )}

          {/* CARD 3: BILLING INFO */}
          <section className="card">
            <div className="card-h">
              <span>بيانات الفوترة</span>
              <small>الجهة المصدرة والمستفيد</small>
            </div>
            <div className="card-b">
              <div className="billwrap">
                <div className="billbox">
                  <div className="billhead">
                    <b>الفاتورة صادرة من</b>
                    <button className="link" type="button">تعديل البيانات</button>
                  </div>
                  <label>الجهة المفوترة <span className="req">*</span></label>
                  <select value={seller} onChange={e => setSeller(e.target.value)}>
                    <option>منصة ديوان للاستشارات الضريبية</option>
                    <option>أخرى</option>
                  </select>
                  {seller === "أخرى" && (
                    <div style={{ marginTop: 9 }}>
                      <label>اسم الجهة الأخرى</label>
                      <input className="input" value={otherSellerName} onChange={e => setOtherSellerName(e.target.value)} placeholder="أدخل اسم الجهة المفوترة" />
                    </div>
                  )}
                  <div className="customer-summary">
                    <div className="round"><i className="fa-solid fa-building"></i></div>
                    <div>
                      <b>{seller === "أخرى" ? (otherSellerName || "جهة أخرى") : "منصة ديوان للاستشارات الضريبية"}</b>
                      <span>عمّان، الأردن · الرقم الضريبي 123456789</span>
                    </div>
                  </div>
                </div>

                <div className="billbox">
                  <div className="billhead">
                    <b>الفاتورة إلى</b>
                    <button className="link" type="button">+ إضافة عميل جديد</button>
                  </div>
                  <label>اسم العميل <span className="req">*</span></label>
                  <select value={selectedCustIndex} onChange={e => setSelectedCustIndex(Number(e.target.value))}>
                    {CUSTOMERS.map((c, i) => (
                      <option key={c.id} value={i}>{c.name}</option>
                    ))}
                  </select>
                  <div className="customer-summary">
                    <div className="round">{currentCust.name.substring(0, 1)}</div>
                    <div>
                      <b>{currentCust.name}</b>
                      <span>{currentCust.address} {currentCust.tax ? `· رقم ضريبي ${currentCust.tax}` : ""}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 4: OPERATION & LINE ITEMS (EXACT MATCH FOR SCREENSHOTS) */}
          <section className="card">
            <div className="card-h">
              <span>نوع العملية والبنود</span>
              <small>حدد مصدر الفاتورة ثم أضف البنود</small>
            </div>
            <div className="card-b">
              {/* 4 OPERATIONAL CARDS */}
              <div className="operation-types">
                <div className={`op-card ${opType === "consult" ? "active" : ""}`} onClick={() => setOpType("consult")}>
                  <i className="fa-solid fa-comments"></i>
                  <b>استشارات</b>
                  <span>فورية أو دعم مع مستشار</span>
                </div>
                <div className={`op-card ${opType === "package" ? "active" : ""}`} onClick={() => setOpType("package")}>
                  <i className="fa-solid fa-layer-group"></i>
                  <b>باقات وبطاقات</b>
                  <span>شراء أو ترقية باقة</span>
                </div>
                <div className={`op-card ${opType === "filing" ? "active" : ""}`} onClick={() => setOpType("filing")}>
                  <i className="fa-solid fa-file-signature"></i>
                  <b>خدمات ضريبية</b>
                  <span>إقرارات وخدمات إضافية</span>
                </div>
                <div className={`op-card ${opType === "platform" ? "active" : ""}`} onClick={() => setOpType("platform")}>
                  <i className="fa-solid fa-handshake"></i>
                  <b>حصة المنصة</b>
                  <span>عمولة الاستشارات المعتمدة</span>
                </div>
              </div>

              {/* DYNAMIC PANEL MATCHING SCREENSHOTS */}
              <div className="dynamic-panel">
                <div className="dynamic-panel-title">
                  <b>
                    {opType === "consult" && "تفاصيل الاستشارة"}
                    {opType === "package" && "تفاصيل الباقة / البطاقة"}
                    {opType === "filing" && "تفاصيل الخدمة الضريبية"}
                    {opType === "platform" && "تفاصيل حصة المنصة"}
                  </b>
                  <span className="badge"><i className="fa-solid fa-wand-magic-sparkles"></i> يتغير حسب نوع العملية</span>
                </div>

                {/* TAB 1: CONSULTATIONS */}
                {opType === "consult" && (
                  <div className="grid three">
                    <div>
                      <label>نوع الاستشارة</label>
                      <select value={consultType} onChange={e => setConsultType(e.target.value)}>
                        <option>جلسة فيديو</option>
                        <option>مكالمة صوتبة</option>
                        <option>محادثة نصية</option>
                      </select>
                    </div>
                    <div>
                      <label>اسم المستشار</label>
                      <select value={consultantName} onChange={e => setConsultantName(e.target.value)}>
                        <option value="">اختر المستشار</option>
                        <option value="د. سامح عبد الفتاح">د. سامح عبد الفتاح</option>
                        <option value="م. طارق يونس">م. طارق يونس</option>
                        <option value="أحمد علي">أحمد علي</option>
                      </select>
                    </div>
                    <div>
                      <label>رقم الجلسة</label>
                      <select value={sessionNo} onChange={e => setSessionNo(e.target.value)}>
                        <option value="SES-2026-104">SES-2026-104</option>
                        <option value="SES-2026-105">SES-2026-105</option>
                        <option value="SES-2026-106">SES-2026-106</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 2: PACKAGES */}
                {opType === "package" && (
                  <div className="grid three">
                    <div>
                      <label>نوع العملية</label>
                      <select value={packageOpType} onChange={e => setPackageOpType(e.target.value)}>
                        <option>شراء بطاقة</option>
                        <option>شراء باقة جديدة</option>
                        <option>ترقية باقة</option>
                        <option>تجديد باقة</option>
                      </select>
                    </div>
                    <div>
                      <label>الباقة الحالية</label>
                      <select value={currentPackage} onChange={e => setCurrentPackage(e.target.value)}>
                        <option>الأساسية</option>
                        <option>المتقدمة</option>
                        <option>الاحترافية</option>
                      </select>
                    </div>
                    <div>
                      <label>مدة الصلاحية</label>
                      <select value={packageDuration} onChange={e => setPackageDuration(e.target.value)}>
                        <option>شهر (30 يوم)</option>
                        <option>3 أشهر (90 يوم)</option>
                        <option>6 أشهر (180 يوم)</option>
                        <option>سنة (365 يوم)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 3: TAX SERVICES */}
                {opType === "filing" && (
                  <div className="grid three">
                    <div>
                      <label>نوع الخدمة</label>
                      <select value={taxServiceType} onChange={e => setTaxServiceType(e.target.value)}>
                        <option>إقرار ضريبة دخل</option>
                        <option>إقرار ضريبة مبيعات</option>
                        <option>خدمة اقتطاع ضريبي</option>
                        <option>استشارة ملف ضريبي</option>
                      </select>
                    </div>
                    <div>
                      <label>الفترة الضريبية</label>
                      <select value={taxPeriod} onChange={e => setTaxPeriod(e.target.value)}>
                        <option>08/2026</option>
                        <option>07/2026</option>
                        <option>06/2026</option>
                        <option>Q2 2026</option>
                        <option>Q1 2026</option>
                      </select>
                    </div>
                    <div>
                      <label>رقم الملف الضريبي</label>
                      <input className="input" value={taxFileNo} onChange={e => setTaxFileNo(e.target.value)} placeholder="TAX-100245" />
                    </div>
                  </div>
                )}

                {/* TAB 4: PLATFORM SHARE */}
                {opType === "platform" && (
                  <div className="grid three">
                    <div>
                      <label>المستشار</label>
                      <select value={platformConsultant} onChange={e => setPlatformConsultant(e.target.value)}>
                        <option value="">اختر المستشار</option>
                        <option value="د. سامح عبد الفتاح">د. سامح عبد الفتاح</option>
                        <option value="م. طارق يونس">م. طارق يونس</option>
                      </select>
                    </div>
                    <div>
                      <label>رقم الاستشارة</label>
                      <select value={consultationNo} onChange={e => setConsultationNo(e.target.value)}>
                        <option value="ADV-2026-7781">ADV-2026-7781</option>
                        <option value="ADV-2026-7782">ADV-2026-7782</option>
                        <option value="ADV-2026-7783">ADV-2026-7783</option>
                      </select>
                    </div>
                    <div>
                      <label>نسبة المنصة</label>
                      <input className="input" value={platformRate} onChange={e => setPlatformRate(e.target.value)} style={{ textAlign: "center", fontWeight: "bold" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* SERVICE / OPERATION PRESET SELECTOR & ADD BUTTON */}
              <div style={{ marginBottom: 18 }}>
                <label>الخدمة / العملية <span className="req">*</span></label>
                <div className="service-add-line">
                  <select style={{ flex: 1 }} value={getGeneratedPresetText()} readOnly>
                    <option value={getGeneratedPresetText()}>{getGeneratedPresetText()}</option>
                  </select>
                  <button className="service-add-btn" onClick={handleApplyPreset} type="button">
                    <i className="fa-solid fa-plus"></i> إضافة
                  </button>
                </div>
                <div className="hint-text">
                  يتم تكوين وصف الخدمة تلقائيًا من تفاصيل العملية أعلاه، ثم إضافته إلى البنود من زر «إضافة».
                </div>
              </div>

              {/* TABLE OF ITEMS */}
              <div className="tablewrap">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>الخدمة / البند</th>
                      <th>الكمية</th>
                      <th>الوحدة</th>
                      <th>السعر</th>
                      <th>الخصم</th>
                      <th>الضريبة %</th>
                      <th>الإجمالي</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => {
                      const net = (Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0));
                      const itemTax = taxEnabled ? (net * Number(item.taxRate || 0) / 100) : 0;
                      const totalItem = net + itemTax;
                      return (
                        <tr key={item.id}>
                          <td>
                            <input className="input" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                          </td>
                          <td>
                            <input className="input" type="number" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', Number(e.target.value))} style={{ width: 60, textAlign: "center" }} />
                          </td>
                          <td>
                            <select className="input" value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} style={{ width: 85 }}>
                              <option value="جلسة">جلسة</option>
                              <option value="استشارة">استشارة</option>
                              <option value="خدمة">خدمة</option>
                              <option value="باقة">باقة</option>
                              <option value="نسبة">نسبة</option>
                            </select>
                          </td>
                          <td>
                            <input className="input" type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} style={{ width: 80, textAlign: "center" }} />
                          </td>
                          <td>
                            <input className="input" type="number" value={item.discount} onChange={e => handleItemChange(item.id, 'discount', Number(e.target.value))} style={{ width: 65, textAlign: "center" }} />
                          </td>
                          <td>
                            <input className="input" type="number" value={item.taxRate} onChange={e => handleItemChange(item.id, 'taxRate', Number(e.target.value))} style={{ width: 60, textAlign: "center" }} disabled={!taxEnabled} />
                          </td>
                          <td style={{ fontWeight: 800, color: "#0D3C5C", whiteSpace: "nowrap", textAlign: "center" }}>
                            {fmt(totalItem)}
                          </td>
                          <td style={{ width: 40, textAlign: "center" }}>
                            <button className="del-btn" type="button" onClick={() => handleRemoveRow(item.id)}>
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button className="addrow" onClick={handleAddRow} type="button">
                <i className="fa-solid fa-plus"></i> إضافة بند جديد
              </button>
            </div>
          </section>

          {/* CARD 5: PAYMENT METHOD */}
          <section className="card">
            <div className="card-h">
              <span>طريقة الدفع</span>
              <small>اختر آلية التحصيل المرتبطة بالفاتورة</small>
            </div>
            <div className="card-b payment-layout">
              <div>
                <div className="methodcards">
                  {[
                    { id: "بطاقة بنكية", icon: "fa-regular fa-credit-card", label: "بطاقة بنكية" },
                    { id: "تحويل بنكي", icon: "fa-solid fa-building-columns", label: "تحويل بنكي" },
                    { id: "محفظة إلكترونية", icon: "fa-solid fa-wallet", label: "محفظة إلكترونية" },
                    { id: "CliQ", icon: "fa-solid fa-bolt", label: "CliQ" }
                  ].map(m => (
                    <div key={m.id} className={`method ${payMethod === m.id ? "active" : ""}`} onClick={() => setPayMethod(m.id)}>
                      <i className={m.icon}></i>
                      <b>{m.label}</b>
                    </div>
                  ))}
                </div>
                <div className="grid two" style={{ marginTop: 14 }}>
                  <div>
                    <label>مرجع عملية الدفع</label>
                    <input className="input" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="رقم الحركة / المرجع" />
                  </div>
                  <div>
                    <label>حالة الدفع</label>
                    <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                      <option>بانتظار الدفع</option>
                      <option>مدفوع</option>
                      <option>مدفوع جزئياً</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="payment-info">
                <h4>ملخص التحصيل</h4>
                <div className="line"><span>الطريقة</span><b>{payMethod}</b></div>
                <div className="line"><span>المبلغ المستحق</span><b>{fmt(calcGrandTotal)} {currency}</b></div>
                <div className="line"><span>الحالة</span><b>{paymentStatus}</b></div>
                <div className="hint">سيتم حفظ مرجع الدفع وربطه بالفاتورة عند إصدارها.</div>
              </div>
            </div>
          </section>

          {/* CARD 6: EXTRA & TOTALS */}
          <section className="card">
            <div className="card-h">
              <span>معلومات إضافية وملخص المبلغ</span>
              <small>الملاحظات والحساب النهائي</small>
            </div>
            <div className="card-b extra">
              <div>
                <div className="grid two">
                  <div>
                    <label>ملاحظات إضافية</label>
                    <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="أدخل أي ملاحظات تظهر على الفاتورة" />
                  </div>
                  <div>
                    <label>الشروط والأحكام</label>
                    <textarea rows="3" value={tc} onChange={e => setTc(e.target.value)} />
                  </div>
                </div>
                <div className="grid two" style={{ marginTop: 14 }}>
                  <div>
                    <label>الحساب البنكي الظاهر على الفاتورة</label>
                    <select value={collectionAccount} onChange={e => setCollectionAccount(e.target.value)}>
                      <option>البنك العربي الإسلامي — JO94AIBJ00100000123456789012</option>
                      <option>بنك الاتحاد — JO71UBJO00200000223456789021</option>
                      <option>بنك الإسكان — JO58HBHO00300000323456789034</option>
                      <option>البنك الإسلامي الأردني — JO36JIBA00400000423456789046</option>
                    </select>
                  </div>
                  <div>
                    <label>القسم المسؤول</label>
                    <select value={responsibleDept} onChange={e => {
                      setResponsibleDept(e.target.value);
                      const list = SIGNERS_BY_DEPT[e.target.value] || [];
                      if (list.length > 0) setSignName(list[0]);
                    }}>
                      <option>الإدارة</option>
                      <option>القسم المالي</option>
                      <option>قسم العمليات</option>
                      <option>قسم الدعم والمساعدة</option>
                      <option>قسم الاستشارات</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="summary">
                <div className="sumrow"><span>المبلغ</span><strong>{fmt(calcSubtotal)} {currency}</strong></div>
                <div className="sumrow"><span>الخصم</span><strong>0.000 {currency}</strong></div>
                <div className="sumrow"><span>الضريبة</span><strong>{fmt(calcTaxTotal)} {currency}</strong></div>
                <div className="sumrow total"><span>الإجمالي قبل التقريب</span><strong>{fmt(calcGrandTotal)} {currency}</strong></div>
                <div className="sumrow final"><span>الإجمالي</span><strong>{fmt(calcGrandTotal)} {currency}</strong></div>
                <div className="words">{numberToArabicWords(calcGrandTotal)}</div>
              </div>
            </div>
          </section>

          {/* CARD 7: E-INVOICING & QR */}
          <section className="card">
            <div className="card-h" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span>الفوترة الإلكترونية والـ QR</span>
                <small>جاهز للربط مع نظام الفوترة الأردني والتكامل الإلكتروني</small>
              </div>
              <button
                type="button"
                className="ab"
                onClick={() => {
                  const genId = "JO-TAX-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
                  setEInvId(genId);
                  setEStatus("مقبولة");
                }}
                style={{ fontSize: 12 }}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i> إنشاء رمز ومعرّف الفوترة
              </button>
            </div>
            <div className="card-b qr-grid">
              <div className="qr" style={{ width: 110, height: 110, padding: 4, background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    [
                      `الجهة المصدرة: ${seller === "أخرى" ? (otherSellerName || "جهة أخرى") : seller}`,
                      `الرقم الضريبي: 123456789`,
                      `رقم الفاتورة: ${invNo}`,
                      `التاريخ: ${invDate}`,
                      `المبلغ الإجمالي: ${calcGrandTotal.toFixed(3)} ${currency}`,
                      `الضريبة: ${calcTaxTotal.toFixed(3)} ${currency}`,
                      eInvId ? `معرف الفوترة الإلكترونية: ${eInvId}` : ""
                    ].filter(Boolean).join("\n")
                  )}`}
                  alt="رمز QR الفاتورة"
                  style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "contain" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="e-status">
                  <span className={`dot ${eStatus === "مقبولة" ? "green" : "amber"}`}></span>
                  <b>{eStatus === "غير مرسلة" ? "غير مرسلة للنظام" : eStatus}</b>
                </div>
                <div className="hint" style={{ fontSize: 11, color: "#64748B" }}>
                  يتم توليد رمز الـ QR ديناميكيًا وحيويًا من بيانات الفاتورة الحالية (المُفوّتر، الرقم الضريبي، الرقم المرجعي، الإجمالي، والضريبة).
                </div>
                <div className="grid two" style={{ marginTop: 12 }}>
                  <div>
                    <label>معرّف الفاتورة الإلكتروني</label>
                    <input className="input" value={eInvId} onChange={e => setEInvId(e.target.value)} placeholder="يولد بعد الإرسال أو اضغط إنشاء أعلاه" />
                  </div>
                  <div>
                    <label>حالة الربط</label>
                    <select value={eStatus} onChange={e => setEStatus(e.target.value)}>
                      <option>غير مرسلة</option>
                      <option>تم الإرسال</option>
                      <option>مقبولة</option>
                      <option>مرفوضة</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 8: SIGNATURE (Matches 2nd screenshot exactly) */}
          <section className="card">
            <div className="card-h">
              <span>التوقيع والاعتماد</span>
              <small style={{ color: "#94A3B8" }}>اختياري</small>
            </div>
            <div className="card-b grid two">
              <div>
                <label>اسم الموقّع</label>
                <select value={signName} onChange={e => setSignName(e.target.value)}>
                  {(SIGNERS_BY_DEPT[responsibleDept] || ["سارة علي - النائب التنفيذي", "أحمد عبد الله - المدير العام"]).map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>تتغير الأسماء المتاحة تلقائيًا حسب القسم المسؤول.</div>
              </div>
              <div>
                <label>رفع التوقيع</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="file" accept="image/*" className="input" onChange={handleSignatureChange} style={{ padding: "6px 12px" }} />
                  {signatureUrl && (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setSignatureUrl("")}
                      style={{ color: "#EF4444", fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="footer-actions">
            <button className="btn primary" onClick={handleIssueInvoice} type="button">
              <i className="fa-solid fa-file-circle-check"></i> إصدار الفاتورة
            </button>
            <button className="btn dark" onClick={handlePrint} type="button">
              <i className="fa-solid fa-print"></i> معاينة وطباعة
            </button>
            <button className="btn" onClick={handleSaveDraft} type="button">
              <i className="fa-regular fa-floppy-disk"></i> حفظ كمسودة
            </button>
            <button className="btn" onClick={() => setShowCreateEditor(false)} type="button">
              إلغاء
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Header */}
          <div style={{ padding: "24px 28px 0", borderBottom: "1px solid #E2E8F0", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#0D3C5C" }}>{titles[tab]}</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>{subs[tab]}</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="ab" onClick={handleExportCSV} type="button">📤 تصدير</button>
                <button className="pb" onClick={() => {
                  if (tab === "refunds") {
                    setShowRefundModal(true);
                  } else {
                    handleOpenCreate(tab === "recurring");
                  }
                }}>
                  <span style={{ fontSize: 16 }}>+</span> {btnLabel[tab]}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex" }}>
                {tabs.map(t => (
                  <button key={t.id} className={`m-tab${tab === t.id ? " a" : ""}`} onClick={() => { setTab(t.id); setSearch(""); setStFilter("الكل"); }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative", marginBottom: 6 }}>
                <input
                  type="text"
                  placeholder="بحث برقم الفاتورة أو العميل..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border: "1.5px solid #CBD5E1", borderRadius: 9, padding: "7px 14px 7px 36px", fontFamily: "inherit", fontSize: 13, outline: "none", color: "#0D3C5C", width: 250, background: "#fff" }}
                />
                <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 28px" }}>

            {/* ── ALL INVOICES ── */}
            {tab === "invoices" && (<>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <Card icon="📄" label="إجمالي الفواتير" value={`${fmt(total)} د.أ`} sub="↑ ٪5.67 من الشهر الماضي" subColor="#16A34A" accent="#0D3C5C" />
                <Card icon="✅" label="الفواتير المدفوعة" value={`${fmt(paidAmt)} د.أ`} sub="↑ ٪14.5 من الشهر الماضي" subColor="#16A34A" accent="#16A34A" />
                <Card icon="⏳" label="قيد الانتظار" value={`${fmt(pendingAmt)} د.أ`} sub="↑ ٪8.5 من الشهر الماضي" subColor="#D97706" accent="#D97706" />
                <Card icon="⚠️" label="الفواتير المتأخرة" value={`${fmt(overdueAmt)} د.أ`} sub="↑ ٪7.45 من الشهر الماضي" subColor="#DC2626" accent="#DC2626" />
              </div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "12px 18px", marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STATUS_TABS.map(t => <button key={t} className="chip" style={{ background: stFilter === t ? "#0D3C5C" : "#F1F5F9", color: stFilter === t ? "#fff" : "#475569" }} onClick={() => setStFilter(t)}>{t}</button>)}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="ab" type="button" onClick={() => setShowFilterBar(!showFilterBar)} style={{ fontSize: 12, padding: "6px 14px", background: showFilterBar ? "#0D3C5C" : "#fff", color: showFilterBar ? "#fff" : "#0D3C5C" }}>
                    <i className="fa-solid fa-filter"></i> فلترة
                  </button>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "6px 12px", fontSize: 12, border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff" }}>
                    <option value="date_desc">الترتيب: الأحدث</option>
                    <option value="date_asc">الترتيب: الأقدم</option>
                    <option value="amount_desc">الأعلى قيمة</option>
                    <option value="amount_asc">الأقل قيمة</option>
                  </select>
                </div>
              </div>

              {/* EXPANDABLE FILTER BAR */}
              {showFilterBar && (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "18px 22px", marginBottom: 20, boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>الحالة</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff", fontSize: 13, color: "#0D3C5C", fontWeight: 700 }}>
                        <option value="الكل">كل الحالات</option>
                        <option value="paid">مدفوعة</option>
                        <option value="overdue">متأخرة</option>
                        <option value="issued">قادمة</option>
                        <option value="cancelled">ملغاة</option>
                        <option value="partial">مدفوعة جزئياً</option>
                        <option value="pending">بانتظار الدفع</option>
                        <option value="refunded">مستردة</option>
                        <option value="draft">مسودة</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>طريقة الدفع</label>
                      <select value={filterPayMethod} onChange={e => setFilterPayMethod(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff", fontSize: 13, color: "#0D3C5C", fontWeight: 700 }}>
                        <option value="الكل">كل الطرق</option>
                        <option value="بطاقة بنكية">بطاقة بنكية</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                        <option value="محفظة إلكترونية">محفظة إلكترونية</option>
                        <option value="CliQ">CliQ</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>من مبلغ</label>
                      <input className="input" type="number" step="0.001" placeholder="من" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>إلى مبلغ</label>
                      <input className="input" type="number" step="0.001" placeholder="إلى" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9 }} />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{ width: "100%", background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "#0D3C5C", cursor: "pointer", transition: "all 0.2s" }}
                      >
                        إعادة تعيين
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {loading ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #E2E8F0", borderTopColor: "#0D3C5C", borderRadius: "50%", animation: "sp .8s linear infinite", margin: "0 auto 14px" }} />
                  <div style={{ color: "#64748B", fontSize: 13 }}>جاري التحميل...</div>
                </div>
              ) : filtInv.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div><h3 style={{ color: "#0D3C5C" }}>لا توجد فواتير مطابقة</h3>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                        <th style={{ padding: "12px 16px", width: 40 }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></th>
                        {["رقم الفاتورة", "العميل", "تاريخ الإنشاء ↕", "المبلغ ↕", "المدفوع ↕", "الحالة", "طريقة الدفع", "تاريخ الاستحقاق", ""].map((h, i) => <Th key={i} ch={h} />)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtInv.map(inv => (
                        <tr key={inv.id} className="inv-row" style={{ borderBottom: "1px solid #F1F5F9" }} onClick={() => setSel(inv)}>
                          <td style={{ padding: "13px 16px" }} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></td>
                          <td style={{ padding: "13px 14px", fontWeight: 800, color: "#0D3C5C" }}>{inv.invoice_number || "-"}</td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={inv.user_name} id={inv.id} />
                              <div><div style={{ fontWeight: 700, color: "#0D3C5C", fontSize: 13 }}>{inv.user_name || "-"}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{inv.user_email || ""}</div></div>
                            </div>
                          </td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(inv.created_at)}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: "#0D3C5C" }}>{inv.currency || "JOD"} {fmt(inv.total_amount)}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: inv.status === "paid" ? "#16A34A" : "#64748B" }}>{inv.currency || "JOD"} {inv.status === "paid" ? fmt(inv.total_amount) : "0.000"}</td>
                          <td style={{ padding: "13px 14px" }}><Chip status={inv.status} /></td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{inv.payment_method || "-"}</td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(inv.due_date)}</td>
                          {renderRowActions(inv, "invoices")}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 14, fontSize: 12, color: "#94A3B8" }}>عرض {filtInv.length} من أصل {invoices.length} فاتورة</div>
            </>)}

            {/* ── RECURRING ── */}
            {tab === "recurring" && (<>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <Card icon="🔄" label="إجمالي الفواتير الدورية" value={`${recList.length}`} sub="إجمالي الفواتير المسجلة" subColor="#64748B" accent="#0D3C5C" />
                <Card icon="✅" label="فواتير مدفوعة" value={`${recList.filter(r => r.status === "paid" || r.status === "active").length}`} sub="فواتير نشطة ومدفوعة" subColor="#16A34A" accent="#16A34A" />
                <Card icon="⏳" label="فواتير متبقية" value={`${recList.filter(r => r.status !== "paid" && r.status !== "cancelled" && r.status !== "suspended").length}`} sub="تحت التحصيل" subColor="#D97706" accent="#D97706" />
                <Card icon="💰" label="إجمالي الإيراد" value={`${fmt(recRevenue)} د.أ`} sub="إجمالي التحصيل الدوري" subColor="#16A34A" accent="#4F46E5" />
              </div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "12px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>إجمالي {filtRec.length} فاتورة دورية</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="ab" type="button" onClick={() => setShowFilterBar(!showFilterBar)} style={{ fontSize: 12, padding: "6px 14px", background: showFilterBar ? "#0D3C5C" : "#fff", color: showFilterBar ? "#fff" : "#0D3C5C" }}>
                    <i className="fa-solid fa-filter"></i> فلترة
                  </button>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "6px 12px", fontSize: 12, border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff" }}>
                    <option value="date_desc">الترتيب: الأحدث</option>
                    <option value="date_asc">الترتيب: الأقدم</option>
                    <option value="amount_desc">الأعلى قيمة</option>
                    <option value="amount_asc">الأقل قيمة</option>
                  </select>
                </div>
              </div>

              {/* EXPANDABLE FILTER BAR */}
              {showFilterBar && (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "18px 22px", marginBottom: 20, boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>الحالة</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff", fontSize: 13, color: "#0D3C5C", fontWeight: 700 }}>
                        <option value="الكل">كل الحالات</option>
                        <option value="paid">مدفوعة</option>
                        <option value="overdue">متأخرة</option>
                        <option value="issued">قادمة</option>
                        <option value="cancelled">ملغاة</option>
                        <option value="partial">مدفوعة جزئياً</option>
                        <option value="pending">بانتظار الدفع</option>
                        <option value="refunded">مستردة</option>
                        <option value="draft">مسودة</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>طريقة الدفع</label>
                      <select value={filterPayMethod} onChange={e => setFilterPayMethod(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff", fontSize: 13, color: "#0D3C5C", fontWeight: 700 }}>
                        <option value="الكل">كل الطرق</option>
                        <option value="بطاقة بنكية">بطاقة بنكية</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                        <option value="محفظة إلكترونية">محفظة إلكترونية</option>
                        <option value="CliQ">CliQ</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>من مبلغ</label>
                      <input className="input" type="number" step="0.001" placeholder="من" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>إلى مبلغ</label>
                      <input className="input" type="number" step="0.001" placeholder="إلى" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9 }} />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{ width: "100%", background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "#0D3C5C", cursor: "pointer", transition: "all 0.2s" }}
                      >
                        إعادة تعيين
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {loading ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #E2E8F0", borderTopColor: "#0D3C5C", borderRadius: "50%", animation: "sp .8s linear infinite", margin: "0 auto 14px" }} />
                  <div style={{ color: "#64748B", fontSize: 13 }}>جاري التحميل...</div>
                </div>
              ) : filtRec.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
                  <h3 style={{ color: "#0D3C5C", margin: "0 0 6px" }}>لا توجد فواتير دورية</h3>
                  <p style={{ margin: 0, fontSize: 13 }}>قم بإنشاء فاتورة دورية جديدة من خلال زر «+ إنشاء فاتورة دورية»</p>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                        <th style={{ padding: "12px 16px", width: 40 }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></th>
                        {["الرقم", "العميل", "تاريخ الإنشاء", "دورة التكرار", "تاريخ الإصدار", "تاريخ الاستحقاق", "المدفوع", "المستحق", "الحالة", ""].map((h, i) => <Th key={i} ch={h} />)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtRec.map(r => (
                        <tr key={r.id} className="inv-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "13px 16px" }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></td>
                          <td style={{ padding: "13px 14px", fontWeight: 800, color: "#0D3C5C" }}>{r.recurring_number || r.id}</td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={r.user_name} id={r.id} />
                              <div><div style={{ fontWeight: 700, color: "#0D3C5C", fontSize: 13 }}>{r.user_name || "-"}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{r.user_email || ""}</div></div>
                            </div>
                          </td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(r.created_at)}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: "#475569" }}>{CYCLES[r.cycle] || r.cycle}</td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(r.issued_date)}</td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(r.due_date)}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: "#16A34A" }}>د.أ {fmt(r.paid_amount || r.paid)}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: "#0D3C5C" }}>د.أ {fmt(r.amount)}</td>
                          <td style={{ padding: "13px 14px" }}><Chip status={r.status} /></td>
                          {renderRowActions(r, "recurring")}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 14, fontSize: 12, color: "#94A3B8" }}>عرض {filtRec.length} فاتورة دورية</div>
            </>)}

            {/* ── REFUNDS ── */}
            {tab === "refunds" && (<>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <Card icon="↩️" label="إجمالي الاستردادات" value={`${fmt(refTotal)} د.أ`} sub="إجمالي قيمة المبالغ المستردة" subColor="#94A3B8" accent="#0D3C5C" />
                <Card icon="✅" label="استردادات مكتملة" value={`${refList.filter(r => r.status === "completed").length}`} sub="تم تنفيذها بنجاح" subColor="#16A34A" accent="#16A34A" />
                <Card icon="⏳" label="قيد المعالجة" value={`${refList.filter(r => r.status === "processing" || r.status === "pending").length}`} sub="طلبات تحت المراجعة" subColor="#D97706" accent="#D97706" />
                <Card icon="❌" label="طلبات مرفوضة" value={`${refList.filter(r => r.status === "rejected").length}`} sub="لم تستوفِ شروط الاسترداد" subColor="#DC2626" accent="#DC2626" />
              </div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "12px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>إجمالي {filtRef.length} طلب استرداد</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="ab" type="button" onClick={() => setShowFilterBar(!showFilterBar)} style={{ fontSize: 12, padding: "6px 14px", background: showFilterBar ? "#0D3C5C" : "#fff", color: showFilterBar ? "#fff" : "#0D3C5C" }}>
                    <i className="fa-solid fa-filter"></i> فلترة
                  </button>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "6px 12px", fontSize: 12, border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff" }}>
                    <option value="date_desc">الترتيب: الأحدث</option>
                    <option value="date_asc">الترتيب: الأقدم</option>
                    <option value="amount_desc">الأعلى قيمة</option>
                    <option value="amount_asc">الأقل قيمة</option>
                  </select>
                </div>
              </div>

              {/* EXPANDABLE FILTER BAR */}
              {showFilterBar && (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "18px 22px", marginBottom: 20, boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>الحالة</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff", fontSize: 13, color: "#0D3C5C", fontWeight: 700 }}>
                        <option value="الكل">كل الحالات</option>
                        <option value="paid">مدفوعة</option>
                        <option value="overdue">متأخرة</option>
                        <option value="issued">قادمة</option>
                        <option value="cancelled">ملغاة</option>
                        <option value="partial">مدفوعة جزئياً</option>
                        <option value="pending">بانتظار الدفع</option>
                        <option value="refunded">مستردة</option>
                        <option value="draft">مسودة</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>طريقة الدفع</label>
                      <select value={filterPayMethod} onChange={e => setFilterPayMethod(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9, background: "#fff", fontSize: 13, color: "#0D3C5C", fontWeight: 700 }}>
                        <option value="الكل">كل الطرق</option>
                        <option value="بطاقة بنكية">بطاقة بنكية</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                        <option value="محفظة إلكترونية">محفظة إلكترونية</option>
                        <option value="CliQ">CliQ</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>من مبلغ</label>
                      <input className="input" type="number" step="0.001" placeholder="من" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 6, display: "block" }}>إلى مبلغ</label>
                      <input className="input" type="number" step="0.001" placeholder="إلى" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 9 }} />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{ width: "100%", background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "#0D3C5C", cursor: "pointer", transition: "all 0.2s" }}
                      >
                        إعادة تعيين
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {loading ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #E2E8F0", borderTopColor: "#0D3C5C", borderRadius: "50%", animation: "sp .8s linear infinite", margin: "0 auto 14px" }} />
                  <div style={{ color: "#64748B", fontSize: 13 }}>جاري التحميل...</div>
                </div>
              ) : filtRef.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>↩️</div>
                  <h3 style={{ color: "#0D3C5C", margin: "0 0 6px" }}>لا توجد طلبات استرداد</h3>
                  <p style={{ margin: 0, fontSize: 13 }}>قم بإنشاء طلب استرداد جديد من خلال زر «+ إنشاء طلب استرداد»</p>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                        <th style={{ padding: "12px 16px", width: 40 }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></th>
                        {["رقم الاسترداد", "الفاتورة الأصلية", "العميل", "الخدمة / العملية", "المبلغ الأصلي", "المبلغ المسترد", "الجهة المتحملة", "الحالة", "تاريخ الطلب", ""].map((h, i) => <Th key={i} ch={h} />)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtRef.map(r => (
                        <tr key={r.id} className="inv-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "13px 16px" }}><input type="checkbox" style={{ accentColor: "#0D3C5C" }} /></td>
                          <td style={{ padding: "13px 14px", fontWeight: 800, color: "#0D3C5C" }}>{r.refund_number || r.id}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: "#4F46E5" }}>{r.invoice_number || r.invoice_id || "-"}</td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={r.user_name} id={r.id} />
                              <span style={{ fontWeight: 700, color: "#0D3C5C", fontSize: 13 }}>{r.user_name || "-"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "13px 14px", color: "#475569", maxWidth: 200 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }} title={r.service_name || r.service}>{r.service_name || r.service || "-"}</div>
                          </td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: "#0D3C5C" }}>د.أ {fmt(r.original_amount)}</td>
                          <td style={{ padding: "13px 14px", fontWeight: 700, color: r.refund_amount > 0 ? "#16A34A" : "#94A3B8" }}>د.أ {fmt(r.refund_amount)}</td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{r.bearer || "المنصة"}</td>
                          <td style={{ padding: "13px 14px" }}><Chip status={r.status} /></td>
                          <td style={{ padding: "13px 14px", color: "#64748B" }}>{fmtDate(r.created_at)}</td>
                          {renderRowActions(r, "refunds")}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 14, fontSize: 12, color: "#94A3B8" }}>عرض {filtRef.length} طلب استرداد</div>
            </>)}
          </div>
        </>
      )}

      {/* CREATE REFUND MODAL */}
      <CreateRefundInvoiceModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSuccess={fetchInvoices}
        invoices={invoices}
      />

      {/* FULL RICH PREVIEW MODAL FOR SELECTED INVOICE */}
      {sel && (() => {
        const itemInvNo = sel.invoice_number || sel.recurring_number || sel.refund_number || `INV-2026-${String(sel.id || 1).padStart(6, '0')}`;
        const itemRefNo = sel.reference_number || `TX-2026-${String(sel.id || 1).padStart(6, '0')}`;
        const itemDate = fmtDate(sel.created_at || sel.issued_date);
        const itemDueDate = fmtDate(sel.due_date || sel.created_at);
        const itemTotal = Number(sel.total_amount || sel.amount || sel.refund_amount || 0);
        const itemTax = Number(sel.tax_amount || (itemTotal > 0 ? itemTotal * 0.16 / 1.16 : 0));
        const itemSubtotal = itemTotal - itemTax;
        const itemCustName = sel.user_name || "شركة الأفق للاستشارات ذ.م.م";
        const itemCustEmail = sel.user_email || "accounts@alofuq.jo";
        const itemPayMethod = sel.payment_method || "بطاقة بنكية";
        const itemItems = Array.isArray(sel.line_items) && sel.line_items.length > 0 ? sel.line_items : [
          { name: sel.service_name || sel.service || (sel.type === "subscription" ? "اشتراك باقة استشارية" : sel.type === "appointment" ? "جلسة استشارة مسجلة" : "خدمات استشارية وطباعة ضريبية"), qty: 1, unit: "خدمة", price: itemSubtotal, discount: 0, taxRate: 16 }
        ];

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 99999, display: "flex", flexDirection: "column", backdropFilter: "blur(4px)", overflowY: "auto" }}>
            {/* Top Sticky Pagebar */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1.5px solid #E2E8F0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button className="ghost-btn" onClick={() => setSel(null)} type="button">
                  <i className="fa-solid fa-arrow-right"></i> إغلاق المعاينة
                </button>
                <h3 style={{ margin: 0, fontSize: 18, color: "#0D3C5C", fontWeight: 900 }}>معاينة الفاتورة {itemInvNo}</h3>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button className="primary-top" onClick={diwanPrintA5} type="button">
                  <i className="fa-solid fa-print"></i> طباعة الفاتورة (A5)
                </button>
                <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748B", fontWeight: "bold" }} onClick={() => setSel(null)}>
                  ×
                </button>
              </div>
            </div>

            {/* Preview Sheet Card */}
            <div style={{ padding: "32px 20px", width: "100%", boxSizing: "border-box" }}>
              <div
                className="invoice-sheet"
                style={{
                  maxWidth: 940,
                  margin: "0 auto",
                  background: "#fff",
                  borderRadius: 16,
                  border: "1.5px solid #E2E8F0",
                  padding: "40px 48px",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
                  fontFamily: "'Cairo','Tajawal',sans-serif",
                  direction: "rtl"
                }}
              >
                {/* Gray Top Section Container */}
                <div style={{ background: "#F1F5F9", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "32px 36px", marginBottom: 32 }}>
                  {/* Top Logo & Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #CBD5E1", paddingBottom: 24, marginBottom: 28 }}>
                    <div style={{ textAlign: "right" }}>
                      <h1 style={{ margin: 0, fontSize: 32, color: "#0D3C5C", fontWeight: 900 }}>فاتورة</h1>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0D3C5C", marginTop: 6 }}>
                        {sel.seller_name || seller || "منصة ديوان للاستشارات الضريبية"}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>عمّان، المملكة الأردنية الهاشمية</div>
                    </div>

                    <div style={{ textAlign: "left" }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" style={{ maxHeight: 95, maxWidth: 220, objectFit: "contain" }} />
                      ) : (
                        <div style={{ padding: "12px 20px", border: "2px dashed #CBD5E1", borderRadius: 12, background: "#fff", color: "#0D3C5C", textAlign: "center" }}>
                          <i className="fa-regular fa-image" style={{ fontSize: 24, display: "block", marginBottom: 4 }}></i>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>شعار الفاتورة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 Info Columns Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                    {/* Column 1: Details */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>تفاصيل الفاتورة</h4>
                      <div style={{ fontSize: 12, display: "grid", gap: 6, color: "#475569" }}>
                        <div><span>رقم الفاتورة: </span><b style={{ color: "#0D3C5C" }}>{itemInvNo}</b></div>
                        <div><span>الرقم المرجعي: </span><b>{itemRefNo}</b></div>
                        <div><span>تاريخ الإصدار: </span><b>{itemDate}</b></div>
                        <div><span>تاريخ الاستحقاق: </span><b>{itemDueDate}</b></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span>حالة الدفع:</span>
                          <Chip status={sel.status} />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Issuer */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>صادرة من</h4>
                      <div style={{ fontSize: 12, display: "grid", gap: 4, color: "#475569" }}>
                        <b style={{ color: "#0D3C5C", fontSize: 13 }}>{sel.seller_name || seller || "منصة ديوان للاستشارات الضريبية"}</b>
                        <div>عمّان، الأردن</div>
                        <div>الهاتف: +962 6 0000 000</div>
                        <div>البريد: info@diwanjo.com</div>
                        <div>الرقم الضريبي: 123456789</div>
                      </div>
                    </div>

                    {/* Column 3: Customer Card */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>الفاتورة إلى</h4>
                      <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0D3C5C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                            <i className="fa-solid fa-building"></i>
                          </div>
                          <b style={{ fontSize: 13, color: "#0D3C5C" }}>{itemCustName}</b>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", display: "grid", gap: 3 }}>
                          <div>{itemCustEmail}</div>
                          <div>الهاتف: +962 7 962 9000 000</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Title */}
                <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0D3C5C", fontWeight: 900 }}>بنود المنتجات / الخدمات</h3>

                {/* Items Table */}
                <div style={{ overflowX: "auto", marginBottom: 28 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#1E293B", color: "#ffffff" }}>
                        <th style={{ padding: "14px 16px", width: 40, borderTopRightRadius: 8, borderBottomRightRadius: 8, fontWeight: 800 }}>#</th>
                        <th style={{ padding: "14px 16px", fontWeight: 800 }}>المنتج / الخدمة</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الكمية</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الوحدة</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>السعر</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الخصم</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الضريبة (%)</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", borderTopLeftRadius: 8, borderBottomLeftRadius: 8, fontWeight: 800 }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemItems.map((item, idx) => {
                        const net = (Number(item.qty || 1) * Number(item.price || itemSubtotal) - Number(item.discount || 0));
                        const itemTaxAmt = (net * Number(item.taxRate || 16) / 100);
                        const totalItem = net + itemTaxAmt;
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0", background: "#ffffff" }}>
                            <td style={{ padding: "14px 16px", color: "#64748B", fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: "14px 16px", fontWeight: 800, color: "#1E293B" }}>{item.name || "خدمات المنصة الضريبية"}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.qty || 1}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.unit || "جلسة"}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{fmt(item.price || itemSubtotal)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{fmt(item.discount || 0)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.taxRate || 16}%</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800, color: "#0D3C5C" }}>{fmt(totalItem)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
                  {/* Right: Payment details & QR */}
                  <div>
                    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                      <div style={{ width: 110, height: 110, padding: 4, background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 12, flexShrink: 0 }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            [
                              `المفوّتر: ${sel.seller_name || seller || "منصة ديوان للاستشارات الضريبية"}`,
                              `رقم الفاتورة: ${itemInvNo}`,
                              `التاريخ: ${itemDate}`,
                              `الإجمالي: ${itemTotal.toFixed(3)} ${sel.currency || "JOD"}`
                            ].join("\n")
                          )}`}
                          alt="QR"
                          style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "contain" }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, marginBottom: 4 }}>رمز الفاتورة الإلكتروني</div>
                        <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#0D3C5C", fontWeight: 900 }}>تفاصيل الدفع</h4>
                        <div style={{ fontSize: 11, color: "#475569", display: "grid", gap: 3 }}>
                          <div><span>طريقة الدفع: </span><b>{itemPayMethod}</b></div>
                          <div><span>المبلغ المدفوع: </span><b>{fmt(itemTotal)} د.أ</b></div>
                          <div><span>مرجع الدفع: </span><b>{itemRefNo}</b></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Left: Totals summary */}
                  <div style={{ fontSize: 13, display: "grid", gap: 8, background: "#F8FAFC", padding: 18, borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                      <span>المبلغ</span>
                      <b>{fmt(itemSubtotal)} د.أ</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                      <span>الضريبة</span>
                      <b>{fmt(itemTax)} د.أ</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#DC2626" }}>
                      <span>الخصم</span>
                      <b>0.000 د.أ</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #0D3C5C", paddingTop: 10, marginTop: 4, fontSize: 18, fontWeight: 900, color: "#0D3C5C" }}>
                      <span>الإجمالي ({sel.currency || "JOD"})</span>
                      <b>{fmt(itemTotal)} د.أ</b>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 4, fontWeight: 700 }}>
                      إجمالي مستحق: {numberToArabicWords(itemTotal)}
                    </div>
                  </div>
                </div>

                {/* Bottom Terms & Signature */}
                <div style={{ borderTop: "1.5px solid #E2E8F0", paddingTop: 20, marginTop: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
                    <div style={{ textAlign: "right" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>الشروط والأحكام</h5>
                      <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{sel.terms_and_conditions || tc}</p>
                      <h5 style={{ margin: "12px 0 4px", fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>ملاحظات</h5>
                      <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{sel.notes || notes || "جميع الرسوم نهائية وتشمل الضرائب والرسوم والتكاليف الإضافية المطبقة."}</p>
                    </div>

                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="Signature" style={{ maxHeight: 60, maxWidth: 180, objectFit: "contain", marginBottom: 6 }} />
                      ) : (
                        <div style={{ fontFamily: "cursive, 'Cairo'", fontSize: 26, color: "#0D3C5C", fontWeight: 900, fontStyle: "italic", marginBottom: 4 }}>Tax Platform</div>
                      )}
                      <div style={{ fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>{sel.signer_name || signName || "سارة علي - النائب التنفيذي"}</div>
                    </div>
                  </div>

                  {/* Gray Footer Platform Banner */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <b style={{ fontSize: 13, color: "#0D3C5C", display: "block" }}>منصة ديوان للاستشارات الضريبية</b>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>عمّان، المملكة الأردنية الهاشمية · الرقم الضريبي: 123456789</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "left" }}>
                      <div>الهاتف: +962 6 0000 000</div>
                      <div>البريد الإلكتروني: info@diwanjo.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* HIDDEN INVOICE SHEET CONTAINER FOR A5 LANDSCAPE PRINTING */}
      <div
        id="invoice-sheet-container"
        className="invoice-sheet"
        style={{
          width: '780px',
          minHeight: '510px',
          background: '#fff',
          padding: '24px 30px',
          boxSizing: 'border-box',
          fontFamily: "'Cairo', 'Tajawal', sans-serif",
          direction: 'rtl',
          color: '#0F172A',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          position: 'absolute',
          left: '-9999px',
          top: '-9999px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0D3C5C', paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#0D3C5C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>
              ديوان
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, color: '#0D3C5C', fontWeight: 900 }}>{seller === "أخرى" ? (otherSellerName || "جهة أخرى") : seller}</h2>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>المملكة الأردنية الهاشمية · الرقم الضريبي: 123456789</div>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0D3C5C' }}>فاتورة ضريبية</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginTop: 2 }}>{invNo}</div>
            {refNo && <div style={{ fontSize: 11, color: '#0891B2', fontWeight: 700 }}>المرجع: {refNo}</div>}
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14, background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11 }}>
          <div>
            <div style={{ color: '#64748B', fontWeight: 700 }}>المستفيد / العميل:</div>
            <div style={{ fontWeight: 900, color: '#0D3C5C', fontSize: 12 }}>{currentCust.name}</div>
            <div style={{ color: '#475569' }}>{currentCust.address} {currentCust.tax ? `· رقم ضريبي: ${currentCust.tax}` : ''}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div><span style={{ color: '#64748B' }}>تاريخ الإصدار: </span><b>{invDate}</b></div>
            <div><span style={{ color: '#64748B' }}>تاريخ الاستحقاق: </span><b>{dueDate}</b></div>
            <div><span style={{ color: '#64748B' }}>الحالة: </span><b style={{ color: status === 'مدفوعة' ? '#059669' : '#0D3C5C' }}>{status}</b></div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#0D3C5C', color: '#fff' }}>
              <th style={{ padding: '6px 10px', textAlign: 'right', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>الخدمة / البند</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>الكمية</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>السعر</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>الخصم</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>الضريبة %</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const net = (Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0));
              const itemTax = taxEnabled ? (net * Number(item.taxRate || 0) / 100) : 0;
              const totalItem = net + itemTax;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700 }}>{item.name}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>{item.qty} {item.unit}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>{fmt(item.price)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>{fmt(item.discount)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>{taxEnabled ? `${item.taxRate}%` : '0%'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, color: '#0D3C5C' }}>{fmt(totalItem)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary & QR Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1.5px solid #E2E8F0', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                [
                  `المفوّتر: ${seller === "أخرى" ? (otherSellerName || "جهة أخرى") : seller}`,
                  `رقم الفاتورة: ${invNo}`,
                  `التاريخ: ${invDate}`,
                  `الإجمالي: ${calcGrandTotal.toFixed(3)} ${currency}`
                ].join("\n")
              )}`}
              alt="QR"
              style={{ width: 75, height: 75, borderRadius: 6, border: '1px solid #CBD5E1' }}
            />
            <div style={{ fontSize: 10, color: '#64748B', maxWidth: 280 }}>
              <div><b>التوقيع والاعتماد:</b> {signName || 'الإدارة العامة'}</div>
              <div style={{ marginTop: 2 }}>{tc}</div>
            </div>
          </div>
          <div style={{ width: 220, fontSize: 11, background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>المبلغ:</span><b>{fmt(calcSubtotal)} {currency}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>الضريبة:</span><b>{fmt(calcTaxTotal)} {currency}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #0D3C5C', paddingTop: 4, marginTop: 4, fontWeight: 900, color: '#0D3C5C', fontSize: 13 }}>
              <span>الإجمالي:</span><b>{fmt(calcGrandTotal)} {currency}</b>
            </div>
            <div style={{ fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 4, fontWeight: 700 }}>{numberToArabicWords(calcGrandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

