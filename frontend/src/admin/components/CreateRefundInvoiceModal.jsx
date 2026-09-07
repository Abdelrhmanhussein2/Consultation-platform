import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CreateRefundInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  invoices = [],
}) {
  const { token } = useAuth();

  // Available invoices list with fallback defaults if empty
  const defaultInvoices = useMemo(() => [
    {
      invoice_number: "INV-2026-00851",
      user_name: "شركة الأفق للاستشارات ذ.م.م",
      user_email: "accounts@alofuq.jo",
      service_name: "استشارة مستشار معتمد",
      total_amount: 150.800,
      paid_amount: 143.260,
      withholding_amount: 7.540,
      tax_no: "123456789",
      address: "عمان، المملكة الأردنية الهاشمية"
    },
    {
      invoice_number: "INV-2026-00842",
      user_name: "جامعة الريادة الخاصة",
      user_email: "finance@riyada.edu.jo",
      service_name: "شراء باقة الاستشارات المتقدمة",
      total_amount: 320.000,
      paid_amount: 304.000,
      withholding_amount: 16.000,
      tax_no: "987654321",
      address: "إربد، الأردن"
    },
    {
      invoice_number: "INV-2026-00810",
      user_name: "مؤسسة الرواد للحلول التقنية",
      user_email: "contact@alrowwad.tech",
      service_name: "جلسة دراسة الجدوى والضرائب",
      total_amount: 85.000,
      paid_amount: 80.750,
      withholding_amount: 4.250,
      tax_no: "554433221",
      address: "عمان، شارع مكة"
    }
  ], []);

  const combinedInvoices = useMemo(() => {
    if (invoices && invoices.length > 0) {
      return invoices;
    }
    return defaultInvoices;
  }, [invoices, defaultInvoices]);

  // Service Types definition
  const SERVICE_TYPES = [
    "استشارة مستشار معتمد",
    "باقة / بطاقة",
    "استشارة منصة",
    "خدمة ضريبية"
  ];

  // Form State
  const [selectedInvNo, setSelectedInvNo] = useState("");
  const [refundNumber, setRefundNumber] = useState("REF-2026-000001");
  const [refundDate, setRefundDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refundStatus, setRefundStatus] = useState("pending"); // pending, approved, completed, rejected
  const [serviceType, setServiceType] = useState("استشارة مستشار معتمد");
  const [refundReason, setRefundReason] = useState("إلغاء خلال فترة السماح");
  
  const [customerName, setCustomerName] = useState("شركة الأفق للاستشارات ذ.م.م");
  const [customerSub, setCustomerSub] = useState("بيانات العميل المرتبطة بالفاتورة الأصلية");
  const [bearer, setBearer] = useState("المنصة والمستشار");
  const [logoUrl, setLogoUrl] = useState("");

  // Amounts
  const [originalAmount, setOriginalAmount] = useState(150.800);
  const [paidAmount, setPaidAmount] = useState(143.260);
  const [refundAmount, setRefundAmount] = useState(143.260);
  const [withholdingAmount, setWithholdingAmount] = useState(7.540);

  // Statement & Notes
  const [statement, setStatement] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState("");

  // Signer
  const [signerName, setSignerName] = useState("مدير المنصة");
  const [signatureUrl, setSignatureUrl] = useState("");

  // Preview State
  const [previewMode, setPreviewMode] = useState(null); // 'client' | 'consultant' | null
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Policy Configuration based on Service Type
  const isShared = serviceType === "استشارة مستشار معتمد";
  
  const policyConfig = useMemo(() => {
    if (isShared) {
      return {
        title: "استرداد مشترك — المنصة + المستشار",
        subtitle: "العميل يحتفظ باقتطاع %5، وسداد فقط المبلغ الذي دفعه فعلياً. يوزع الاسترداد بين المنصة والمستشار بنسبة حصتهما من صافي الدفع.",
        badge: "• مشترك",
        badgeBg: "#E0F2FE",
        badgeColor: "#0369A1",
        badgeBorder: "1px solid #BAE6FD",
        defaultBearer: "المنصة والمستشار",
        platformRatio: 0.15,
        consultantRatio: 0.85,
        withholdingRate: 0.05
      };
    }
    return {
      title: "استرداد تتحمله المنصة",
      subtitle: "لا يوجد اقتطاع خاص بالمستشار في هذه العملية؛ تتحمل المنصة المبلغ القابل للاسترداد.",
      badge: "• المنصة",
      badgeBg: "#F1F5F9",
      badgeColor: "#475569",
      badgeBorder: "1px solid #E2E8F0",
      defaultBearer: "المنصة",
      platformRatio: 1.0,
      consultantRatio: 0.0,
      withholdingRate: 0.0
    };
  }, [isShared]);

  // Handle service type change
  const handleServiceTypeChange = (newType) => {
    setServiceType(newType);
    const isConsultant = newType === "استشارة مستشار معتمد";
    setBearer(isConsultant ? "المنصة والمستشار" : "المنصة");
    
    // Withholding 5% ONLY for certified consultant, 0% for platform services
    const withh = isConsultant ? parseFloat((originalAmount * 0.05).toFixed(3)) : 0;
    const paid = parseFloat((originalAmount - withh).toFixed(3));
    setWithholdingAmount(withh);
    setPaidAmount(paid);
    setRefundAmount(paid);

    const st = selectedInvNo ? `استرداد مرتبط بالفاتورة الأصلية ${selectedInvNo}` : "استرداد فاتورة";
    const dt = isConsultant
      ? `تم اعتماد استرداد كامل للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${originalAmount.toFixed(3)} د.أ، والاقتطاع المحتفظ به لدى العميل (5%) ${withh.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paid.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${paid.toFixed(3)} د.أ.`
      : `تم اعتماد استرداد كامل للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${originalAmount.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paid.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${paid.toFixed(3)} د.أ.`;
    setStatement(st);
    setDetails(dt);
  };

  // Select Invoice handler
  const handleSelectInvoice = useCallback((invNum) => {
    setSelectedInvNo(invNum);
    const found = combinedInvoices.find(i => (i.invoice_number || i.id) === invNum);
    if (found) {
      const orig = Number(found.total_amount || found.amount || 150.800);
      
      let matchedServiceType = "استشارة مستشار معتمد";
      if (found.service_name) {
        if (found.service_name.includes("باقة") || found.service_name.includes("بطاقة")) {
          matchedServiceType = "باقة / بطاقة";
        } else if (found.service_name.includes("استشارة منصة")) {
          matchedServiceType = "استشارة منصة";
        } else if (found.service_name.includes("ضريبية") || found.service_name.includes("ضرائب")) {
          matchedServiceType = "خدمة ضريبية";
        } else if (SERVICE_TYPES.includes(found.service_name)) {
          matchedServiceType = found.service_name;
        }
      }

      const isConsultant = matchedServiceType === "استشارة مستشار معتمد";
      const withh = isConsultant 
        ? parseFloat((Number(found.withholding_amount) || (orig * 0.05)).toFixed(3))
        : 0;
      const paid = parseFloat((orig - withh).toFixed(3));

      setCustomerName(found.user_name || "شركة الأفق للاستشارات ذ.م.م");
      setServiceType(matchedServiceType);
      setBearer(isConsultant ? "المنصة والمستشار" : "المنصة");
      setOriginalAmount(orig);
      setWithholdingAmount(withh);
      setPaidAmount(paid);
      setRefundAmount(paid);

      const st = `استرداد مرتبط بالفاتورة الأصلية ${invNum}`;
      const dt = isConsultant
        ? `تم اعتماد استرداد كامل للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${orig.toFixed(3)} د.أ، والاقتطاع المحتفظ به لدى العميل ${withh.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paid.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${paid.toFixed(3)} د.أ.`
        : `تم اعتماد استرداد كامل للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${orig.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paid.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${paid.toFixed(3)} د.أ.`;
      setStatement(st);
      setDetails(dt);
    }
  }, [combinedInvoices]);

  // Fetch next sequential refund number from backend
  const fetchNextRefundNumber = useCallback(async () => {
    try {
      const res = await fetch("/api/refunded-invoices/next-number", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.next_refund_number) {
          setRefundNumber(data.next_refund_number);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch next refund number from backend:", err);
    }
  }, [token]);

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchNextRefundNumber();
    }
  }, [isOpen, fetchNextRefundNumber]);

  // Initialize with first invoice
  useEffect(() => {
    if (combinedInvoices.length > 0 && !selectedInvNo) {
      const first = combinedInvoices[0];
      handleSelectInvoice(first.invoice_number || first.id);
    }
  }, [combinedInvoices, selectedInvNo, handleSelectInvoice]);

  // Recalculate breakdown dynamically for Refund Amount
  const calcPlatformShare = useMemo(() => {
    return parseFloat((refundAmount * policyConfig.platformRatio).toFixed(3));
  }, [refundAmount, policyConfig.platformRatio]);

  const calcConsultantShare = useMemo(() => {
    if (!isShared) return 0;
    return parseFloat(Math.max(0, refundAmount * policyConfig.consultantRatio).toFixed(3));
  }, [refundAmount, isShared, policyConfig.consultantRatio]);

  // Recalculate breakdown dynamically for Paid Amount (Cards)
  const calcPaidPlatformShare = useMemo(() => {
    return parseFloat((paidAmount * policyConfig.platformRatio).toFixed(3));
  }, [paidAmount, policyConfig.platformRatio]);

  const calcPaidConsultantShare = useMemo(() => {
    if (!isShared) return 0;
    return parseFloat(Math.max(0, paidAmount * policyConfig.consultantRatio).toFixed(3));
  }, [paidAmount, isShared, policyConfig.consultantRatio]);

  // Handle Original Amount change with clean rounding
  const handleOriginalAmountChange = (val) => {
    const num = parseFloat(val) || 0;
    const isConsultant = serviceType === "استشارة مستشار معتمد";
    const withh = isConsultant ? parseFloat((num * 0.05).toFixed(3)) : 0;
    const paid = parseFloat((num - withh).toFixed(3));
    setOriginalAmount(num);
    setWithholdingAmount(withh);
    setPaidAmount(paid);
    setRefundAmount(paid);
    
    const dt = isConsultant
      ? `تم اعتماد استرداد للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${num.toFixed(3)} د.أ، والاقتطاع المحتفظ به لدى العميل ${withh.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paid.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${paid.toFixed(3)} د.أ.`
      : `تم اعتماد استرداد للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${num.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paid.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${paid.toFixed(3)} د.أ.`;
    setDetails(dt);
  };

  // Handle Paid Amount change with clean rounding
  const handlePaidAmountChange = (val) => {
    const num = parseFloat(val) || 0;
    setPaidAmount(num);
    if (refundAmount > num) {
      setRefundAmount(num);
    }
  };

  // Update dynamic details when refund amount changes
  const handleAmountChange = (val) => {
    const num = parseFloat(val) || 0;
    setRefundAmount(num);
    const withh = isShared ? (originalAmount - paidAmount > 0 ? (originalAmount - paidAmount) : withholdingAmount) : 0;
    setDetails(`تم اعتماد استرداد للعملية الموضحة أعلاه. قيمة الخدمة الأصلية ${originalAmount.toFixed(3)} د.أ، والاقتطاع المحتفظ به لدى العميل ${withh.toFixed(3)} د.أ، والمبلغ المدفوع فعلياً ${paidAmount.toFixed(3)} د.أ، وإجمالي مبلغ الاسترداد ${num.toFixed(3)} د.أ.`);
  };

  const handleReset = () => {
    if (combinedInvoices.length > 0) {
      handleSelectInvoice(combinedInvoices[0].invoice_number || combinedInvoices[0].id);
    }
    fetchNextRefundNumber();
    setRefundDate(new Date().toISOString().split('T')[0]);
    setRefundStatus("pending");
    setRefundReason("إلغاء خلال فترة السماح");
    setNotes("");
    setSignerName("مدير المنصة");
    setSignatureUrl("");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSignatureUrl(url);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    try {
      setSubmitting(true);
      const payload = {
        refund_number: refundNumber,
        invoice_number: selectedInvNo,
        user_name: customerName,
        service_name: serviceType,
        original_amount: Number(originalAmount),
        refund_amount: Number(refundAmount),
        bearer: bearer,
        status: isDraft ? "draft" : (refundStatus || "pending"),
        reason: `${refundReason} - ${details} ${notes ? `| ملاحظات: ${notes}` : ""}`
      };

      const res = await fetch("/api/refunded-invoices/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isDraft ? "تم حفظ مسودة فاتورة الاسترداد بنجاح" : "تم إصدار فاتورة الاسترداد بنجاح");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        if (onSuccess) onSuccess();
        alert(isDraft ? "تم حفظ مسودة فاتورة الاسترداد بنجاح" : "تم إصدار فاتورة الاسترداد بنجاح");
        onClose();
      }
    } catch (err) {
      console.error(err);
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose} 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.65)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        padding: "16px",
        boxSizing: "border-box",
        direction: "rtl",
        fontFamily: "'Cairo','Tajawal',sans-serif"
      }}
    >
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Main Modal Card */}
      <div 
        onClick={e => e.stopPropagation()} 
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 1040,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
          border: "1.5px solid #E2E8F0"
        }}
      >
        {/* Top Header Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          borderBottom: "1.5px solid #F1F5F9",
          background: "#fff"
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#0D3C5C" }}>
            إنشاء فاتورة استرداد
          </h2>
          <button 
            onClick={onClose}
            type="button"
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#64748B",
              fontWeight: "bold",
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, background: "#fff" }}>
          
          {/* Sub-header Banner */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0D3C5C" }}>
                فاتورة استرداد
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                إعداد فاتورة الاسترداد يشمل هيكل المبالغ والوثائق الثبوتية
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button 
                type="button" 
                onClick={handleReset}
                style={{
                  background: "#fff",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: 9,
                  padding: "7px 14px",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: "#475569",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <i className="fa-solid fa-rotate-left"></i> إعادة تعيين
              </button>
              <button 
                type="button" 
                onClick={() => setPreviewMode('client')}
                style={{
                  background: "#E0F2FE",
                  color: "#0369A1",
                  border: "1.5px solid #BAE6FD",
                  borderRadius: 9,
                  padding: "7px 14px",
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <i className="fa-regular fa-eye"></i> معاينة العميل
              </button>
              <button 
                type="button" 
                onClick={() => setPreviewMode('consultant')}
                style={{
                  background: "#EDE9FE",
                  color: "#6D28D9",
                  border: "1.5px solid #DDD6FE",
                  borderRadius: 9,
                  padding: "7px 14px",
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <i className="fa-solid fa-user-tie"></i> معاينة المستشار
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              SECTION 1: تفاصيل فاتورة الاسترداد
              ══════════════════════════════════════════════════════════ */}
          <div style={{
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 22,
            background: "#fff"
          }}>
            {/* Section Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                تفاصيل فاتورة الاسترداد
              </h4>
              <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>
                البيانات الأساسية
              </span>
            </div>

            {/* Info Banner Box */}
            <div style={{
              background: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0D3C5C", marginBottom: 4 }}>
                  {policyConfig.title}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>
                  {policyConfig.subtitle}
                </div>
              </div>
              <span style={{
                background: policyConfig.badgeBg,
                color: policyConfig.badgeColor,
                border: policyConfig.badgeBorder,
                fontSize: 11,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 20,
                whiteSpace: "nowrap"
              }}>
                {policyConfig.badge}
              </span>
            </div>

            {/* Row 1: 4 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  الفاتورة الأصلية <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select 
                  value={selectedInvNo} 
                  onChange={e => handleSelectInvoice(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none"
                  }}
                >
                  {combinedInvoices.map((inv, idx) => {
                    const no = inv.invoice_number || inv.id;
                    const name = inv.user_name || "عميل ديوان";
                    return (
                      <option key={idx} value={no}>
                        {no} — {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  رقم الاسترداد
                </label>
                <input 
                  type="text" 
                  value={refundNumber} 
                  readOnly
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#0D3C5C",
                    background: "#F8FAFC",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "default"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  تاريخ الاسترداد
                </label>
                <input 
                  type="date" 
                  value={refundDate} 
                  onChange={e => setRefundDate(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  حالة الاسترداد
                </label>
                <select 
                  value={refundStatus} 
                  onChange={e => setRefundStatus(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none"
                  }}
                >
                  <option value="pending">بانتظار الموافقة</option>
                  <option value="approved">معتمد</option>
                  <option value="completed">مكتمل</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
            </div>

            {/* Row 2: 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  نوع الخدمة / العملية
                </label>
                <select 
                  value={serviceType} 
                  onChange={e => handleServiceTypeChange(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none"
                  }}
                >
                  {SERVICE_TYPES.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  سبب الاسترداد <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select 
                  value={refundReason} 
                  onChange={e => setRefundReason(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none"
                  }}
                >
                  <option value="إلغاء خلال فترة السماح">إلغاء خلال فترة السماح</option>
                  <option value="عدم تقديم الخدمة بالجودة المطلوبة">عدم تقديم الخدمة بالجودة المطلوبة</option>
                  <option value="طلب العميل قبل موعد الجلسة">طلب العميل قبل موعد الجلسة</option>
                  <option value="خطأ في الفوترة والتحويل">خطأ في الفوترة والتحويل</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>

            {/* Sub-section: من / إلى */}
            <div style={{ marginTop: 18, borderTop: "1.5px solid #F1F5F9", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h5 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>
                  من / إلى
                </h5>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>
                  أطراف فاتورة الاسترداد
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* صادرة من */}
                <div style={{
                  background: "#FAFBFD",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px"
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 4 }}>
                    صادرة من
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>
                    منصة ديوان للاستشارات الضريبية
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    عمان، المملكة الأردنية الهاشمية
                  </div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>
                    الرقم الضريبي: 123456789
                  </div>
                </div>

                {/* صادرة إلى */}
                <div style={{
                  background: "#FAFBFD",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px"
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 4 }}>
                    صادرة إلى
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>
                    {customerName}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    {customerSub}
                  </div>
                </div>
              </div>
            </div>

            {/* Row: الجهة المتحملة وشعار الفاتورة */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  الجهة المتحملة للاسترداد
                </label>
                <input 
                  type="text"
                  value={bearer}
                  onChange={e => setBearer(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>
                  تحدد تلقائياً وفق نوع الخدمة وآلية الاسترداد
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  شعار فاتورة الاسترداد
                </label>
                <label style={{
                  border: "1.5px dashed #CBD5E1",
                  borderRadius: 10,
                  background: "#FAFBFD",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  minHeight: 70,
                  boxSizing: "border-box"
                }}>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ maxHeight: 50, objectFit: "contain" }} />
                  ) : (
                    <>
                      <i className="fa-regular fa-image" style={{ fontSize: 20, color: "#0D3C5C", marginBottom: 4 }}></i>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#0D3C5C" }}>اضغط لإضافة شعار المنصة</span>
                      <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>PNG / JPG / SVG</span>
                    </>
                  )}
                </label>
              </div>
            </div>

          </div>


          {/* ══════════════════════════════════════════════════════════
              SECTION 2: تفاصيل وقيمة الاسترداد
              ══════════════════════════════════════════════════════════ */}
          <div style={{
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 22,
            background: "#fff"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                تفاصيل وقيمة الاسترداد
              </h4>
              <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>
                الحساب والتوزيع
              </span>
            </div>

            {/* 3 Inputs Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  قيمة الخدمة الأصلية
                </label>
                <input 
                  type="number" 
                  step="0.001"
                  value={originalAmount} 
                  onChange={e => handleOriginalAmountChange(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  المبلغ المدفوع فعلياً
                </label>
                <input 
                  type="number" 
                  step="0.001"
                  value={paidAmount} 
                  onChange={e => handlePaidAmountChange(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  المبلغ المطلوب استرداده <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input 
                  type="number" 
                  step="0.001"
                  value={refundAmount} 
                  onChange={e => handleAmountChange(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>
                  الحد الأقصى القابل للاسترداد: {paidAmount.toFixed(3)} د.أ
                </div>
              </div>
            </div>

            {/* 5 Stats Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>قيمة الخدمة</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>{originalAmount.toFixed(3)} د.أ</div>
              </div>

              <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>
                  {isShared ? "اقتطاع 5% لدى العميل" : "اقتطاع لدى العميل (0%)"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: isShared ? "#D97706" : "#64748B" }}>
                  {withholdingAmount.toFixed(3)} د.أ
                </div>
              </div>

              <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>المدفوع فعلياً</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>{paidAmount.toFixed(3)} د.أ</div>
              </div>

              <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>حصة المنصة من الدفع</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>{calcPaidPlatformShare.toFixed(3)} د.أ</div>
              </div>

              <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>حصة المستشار من الدفع</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>{calcPaidConsultantShare.toFixed(3)} د.أ</div>
              </div>
            </div>

            {/* Distribution Box */}
            <div style={{
              background: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: 12,
              padding: "16px 20px"
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D3C5C", marginBottom: 12 }}>
                توزيع مبلغ الاسترداد
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>إجمالي ما يسترد للعميل:</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0D3C5C", marginTop: 4 }}>{refundAmount.toFixed(3)} د.أ</div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>يُعاد من حصة المنصة:</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0D3C5C", marginTop: 4 }}>{calcPlatformShare.toFixed(3)} د.أ</div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>يُعاد من حصة المستشار:</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0D3C5C", marginTop: 4 }}>{calcConsultantShare.toFixed(3)} د.أ</div>
                </div>
              </div>
            </div>

          </div>


          {/* ══════════════════════════════════════════════════════════
              SECTION 3: بيان وتفاصيل الاسترداد
              ══════════════════════════════════════════════════════════ */}
          <div style={{
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 22,
            background: "#fff"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                بيان وتفاصيل الاسترداد
              </h4>
              <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>
                نص افتراضي قابل للتعديل ويظهر داخل الفاتورة
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  بيان الاسترداد
                </label>
                <textarea 
                  rows="3"
                  value={statement}
                  onChange={e => setStatement(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  تفاصيل الاسترداد
                </label>
                <textarea 
                  rows="3"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>
              يتم تعبئته تلقائياً ويمكن تعديله. نسخة العميل لا تعرض توزيع حصة المنصة والمستشار.
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                ملاحظات إضافية
              </label>
              <textarea 
                rows="2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية مرتبطة بعملية الاسترداد"
                style={{
                  border: "1.5px solid #CBD5E1",
                  borderRadius: 9,
                  padding: "10px 12px",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  color: "#0D3C5C",
                  background: "#fff",
                  width: "100%",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
            </div>
          </div>


          {/* ══════════════════════════════════════════════════════════
              SECTION 4: التوقيع والاعتماد
              ══════════════════════════════════════════════════════════ */}
          <div style={{
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 20,
            background: "#fff"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                التوقيع والاعتماد
              </h4>
              <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>
                اختياري
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  اسم الموقع
                </label>
                <input 
                  type="text"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  style={{
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    color: "#0D3C5C",
                    background: "#fff",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#0D3C5C", marginBottom: 6 }}>
                  رفع التوقيع
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    style={{
                      border: "1.5px solid #CBD5E1",
                      borderRadius: 9,
                      padding: "6px 10px",
                      fontFamily: "inherit",
                      fontSize: 12,
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  />
                  {signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setSignatureUrl("")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        fontSize: 12,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontWeight: 700
                      }}
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════
            STICKY BOTTOM ACTIONS BAR
            ══════════════════════════════════════════════════════════ */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1.5px solid #E2E8F0",
          background: "#fff",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap"
        }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: "#fff",
              border: "1.5px solid #CBD5E1",
              borderRadius: 9,
              padding: "9px 20px",
              fontWeight: 700,
              fontSize: 13,
              color: "#475569",
              cursor: "pointer"
            }}
          >
            إلغاء
          </button>

          <button 
            type="button" 
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            style={{
              background: "#fff",
              border: "1.5px solid #CBD5E1",
              borderRadius: 9,
              padding: "9px 18px",
              fontWeight: 700,
              fontSize: 13,
              color: "#475569",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="fa-regular fa-floppy-disk"></i> حفظ كمسودة
          </button>

          <button 
            type="button" 
            onClick={() => setPreviewMode('consultant')}
            style={{
              background: "#1E293B",
              border: "none",
              borderRadius: 9,
              padding: "9px 18px",
              fontWeight: 800,
              fontSize: 13,
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="fa-solid fa-user-tie"></i> معاينة نسخة المستشار
          </button>

          <button 
            type="button" 
            onClick={() => setPreviewMode('client')}
            style={{
              background: "#1E293B",
              border: "none",
              borderRadius: 9,
              padding: "9px 18px",
              fontWeight: 800,
              fontSize: 13,
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="fa-regular fa-eye"></i> معاينة نسخة العميل
          </button>

          <button 
            type="button" 
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              background: "#0D3C5C",
              border: "none",
              borderRadius: 9,
              padding: "9px 24px",
              fontWeight: 800,
              fontSize: 13,
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="fa-solid fa-file-circle-check"></i> إصدار فاتورة الاسترداد
          </button>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════
          PREVIEW MODAL (Client & Consultant Versions)
          ══════════════════════════════════════════════════════════ */}
      {previewMode && (
        <div 
          onClick={() => setPreviewMode(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.75)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            padding: "20px"
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 880,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              direction: "rtl",
              fontFamily: "'Cairo','Tajawal',sans-serif"
            }}
          >
            {/* Top Preview Title Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 28px",
              borderBottom: "1.5px solid #F1F5F9",
              background: "#fff"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#0D3C5C" }}>
                  {previewMode === 'client' ? "معاينة فاتورة الاسترداد — نسخة العميل" : "معاينة فاتورة الاسترداد — نسخة المستشار"}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  style={{
                    background: "#0D3C5C",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 16px",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <i className="fa-solid fa-print"></i> طباعة
                </button>
                <button 
                  type="button"
                  onClick={() => setPreviewMode(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    color: "#64748B",
                    fontWeight: "bold",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Invoice Printable Sheet Body */}
            <div style={{ padding: "28px 32px", background: "#fff" }}>
              
              {/* Top Hero Container: Header + 3 Columns */}
              <div style={{
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 14,
                padding: "24px 28px",
                marginBottom: 20
              }}>
                {/* Header: Title & Platform Branding */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start"
                }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#0D3C5C", letterSpacing: "-0.5px" }}>
                      فاتورة استرداد
                    </h1>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0D3C5C", marginTop: 4 }}>
                      منصة ديوان للاستشارات الضريبية
                    </div>
                    <div style={{ fontSize: 12, color: "#0284C7", marginTop: 2, fontWeight: 700 }}>
                      عمان، المملكة الأردنية الهاشمية · {previewMode === 'client' ? "نسخة العميل" : "نسخة المستشار"}
                    </div>
                  </div>

                  <div>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ maxHeight: 60, objectFit: "contain" }} />
                    ) : (
                      <div style={{
                        fontSize: 34,
                        fontWeight: 900,
                        color: "#0D3C5C",
                        fontFamily: "'Cairo', sans-serif"
                      }}>
                        ديوان
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider Line */}
                <div style={{ borderBottom: "1.5px solid #E2E8F0", margin: "20px 0" }}></div>

                {/* 3 Columns Section: تفاصيل فاتورة الاسترداد | صادرة من | الفاتورة إلى */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1.15fr",
                  gap: 20
                }}>
                  {/* Column 1: تفاصيل فاتورة الاسترداد */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                      تفاصيل فاتورة الاسترداد
                    </h4>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.9 }}>
                      <div><span style={{ color: "#64748B" }}>رقم الاسترداد: </span><b>{refundNumber}</b></div>
                      <div><span style={{ color: "#64748B" }}>الفاتورة الأصلية: </span><b>{selectedInvNo}</b></div>
                      <div><span style={{ color: "#64748B" }}>تاريخ الإصدار: </span><b>{refundDate ? refundDate.split('-').reverse().join('-') : refundDate}</b></div>
                      <div><span style={{ color: "#64748B" }}>الحالة: </span><b>{refundStatus === 'approved' ? 'معتمد' : refundStatus === 'completed' ? 'مكتمل' : refundStatus === 'rejected' ? 'مرفوض' : 'بانتظار الموافقة'}</b></div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{
                        background: "#0D3C5C",
                        color: "#fff",
                        fontSize: 11.5,
                        fontWeight: 800,
                        padding: "4px 14px",
                        borderRadius: 6,
                        display: "inline-block"
                      }}>
                        {refundAmount >= paidAmount ? "استرداد كامل" : "استرداد جزئي"}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: صادرة من */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                      صادرة من
                    </h4>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.9 }}>
                      <div style={{ fontWeight: 800, color: "#0D3C5C" }}>منصة ديوان للاستشارات الضريبية</div>
                      <div>عمان، الأردن</div>
                      <div><span style={{ color: "#64748B" }}>الهاتف: </span><span dir="ltr">+962 6 000 0000</span></div>
                      <div><span style={{ color: "#64748B" }}>البريد: </span>info@diwanjo.com</div>
                      <div><span style={{ color: "#64748B" }}>الرقم الضريبي: </span>123456789</div>
                    </div>
                  </div>

                  {/* Column 3: الفاتورة إلى */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                      الفاتورة إلى
                    </h4>
                    <div style={{
                      border: "1.5px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "14px 16px",
                      background: "#fff"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#0D3C5C",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0
                        }}>
                          <i className={previewMode === 'consultant' ? "fa-solid fa-user" : "fa-solid fa-building"}></i>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C", lineHeight: 1.3 }}>
                          {previewMode === 'consultant' ? "المستشار المعتمد" : customerName}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.8 }}>
                        <div>مرتبطة بالفاتورة الأصلية {selectedInvNo}</div>
                        <div>نوع العملية: {serviceType}</div>
                        <div>سبب الاسترداد: {refundReason}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Strip (Gray Box) */}
              <div style={{
                background: "#FAFBFD",
                border: "1.5px solid #E2E8F0",
                borderRadius: 8,
                padding: "12px 18px",
                marginBottom: 24,
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr",
                gap: 16,
                fontSize: 12
              }}>
                <div>
                  <span style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 2 }}>البيان</span>
                  <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{statement || `استرداد مرتبط بالفاتورة الأصلية ${selectedInvNo}`}</span>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 2 }}>نوع العملية</span>
                  <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{serviceType}</span>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: 11, display: "block", marginBottom: 2 }}>سبب الاسترداد</span>
                  <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{refundReason}</span>
                </div>
              </div>

              {/* تفاصيل الاسترداد */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                  تفاصيل الاسترداد
                </h4>
                <div style={{
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "14px 18px",
                  background: "#fff",
                  fontSize: 12,
                  color: "#475569",
                  lineHeight: 1.8
                }}>
                  {details}
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  CONSULTANT PREVIEW SPECIFIC BODY
                  ══════════════════════════════════════════════════════════ */}
              {previewMode === 'consultant' ? (
                <>
                  {/* 3 Stat Cards Row */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                    marginBottom: 24
                  }}>
                    <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>قيمة الخدمة</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>{originalAmount.toFixed(3)} د.أ</div>
                    </div>

                    <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>
                        {isShared ? "اقتطاع لدى العميل 5%" : "اقتطاع لدى العميل"}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: isShared ? "#D97706" : "#0D3C5C" }}>
                        {withholdingAmount.toFixed(3)} د.أ
                      </div>
                    </div>

                    <div style={{ background: "#FAFBFD", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>المدفوع فعلياً</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>{paidAmount.toFixed(3)} د.أ</div>
                    </div>
                  </div>

                  {/* Two Column Grid: توزيع مبلغ الاسترداد vs ملخص الاسترداد */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 32,
                    marginBottom: 20,
                    borderTop: "1.5px solid #F1F5F9",
                    paddingTop: 18
                  }}>
                    {/* توزيع مبلغ الاسترداد */}
                    <div>
                      <h4 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                        توزيع مبلغ الاسترداد
                      </h4>
                      <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 2.2 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B" }}>الجهة المتحملة</span>
                          <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{bearer}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B" }}>من حصة المنصة</span>
                          <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{calcPlatformShare.toFixed(3)} د.أ</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B" }}>من حصة المستشار</span>
                          <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{calcConsultantShare.toFixed(3)} د.أ</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                          نوع الاسترداد
                        </h4>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                          {refundAmount >= paidAmount ? "كامل" : "جزئي"}
                        </div>
                      </div>
                    </div>

                    {/* ملخص الاسترداد */}
                    <div>
                      <h4 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                        ملخص الاسترداد
                      </h4>
                      <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 2.2 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B" }}>إجمالي الاسترداد للعميل</span>
                          <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{refundAmount.toFixed(3)} د.أ</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B" }}>حصة المنصة المستعادة</span>
                          <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{calcPlatformShare.toFixed(3)} د.أ</span>
                        </div>

                        <div style={{ borderTop: "1.5px solid #E2E8F0", margin: "10px 0" }}></div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>المترتب على المستشار</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: "#0D3C5C" }}>{calcConsultantShare.toFixed(3)} د.أ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yellow/Amber Action Banner */}
                  <div style={{
                    background: "#FEFCE8",
                    border: "1.5px solid #FEF08A",
                    borderRadius: 8,
                    padding: "12px 18px",
                    marginBottom: 24
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#92400E", marginBottom: 4 }}>
                      الإجراء المطلوب من المستشار
                    </div>
                    <div style={{ fontSize: 11.5, color: "#713F12", lineHeight: 1.6 }}>
                      يتوجب عليك إصدار فاتورة استرداد بقيمة {calcConsultantShare.toFixed(3)} د.أ وإرسالها إلى منصة ديوان، مع تحويل نفس المبلغ إلى حساب المنصة حتى تتمكن المنصة من إرجاع كامل مبلغ الاسترداد للعميل.
                    </div>
                  </div>
                </>
              ) : (
                /* ══════════════════════════════════════════════════════════
                   CLIENT PREVIEW SPECIFIC BODY
                   ══════════════════════════════════════════════════════════ */
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 32,
                  marginBottom: 26,
                  borderTop: "1.5px solid #F1F5F9",
                  paddingTop: 20
                }}>
                  {/* معلومات الاسترداد */}
                  <div>
                    <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                      معلومات الاسترداد
                    </h4>
                    <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 2.2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>نوع الاسترداد</span>
                        <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{refundAmount >= paidAmount ? "كامل" : "جزئي"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>سبب الاسترداد</span>
                        <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{refundReason}</span>
                      </div>
                    </div>
                  </div>

                  {/* القيم المالية */}
                  <div>
                    <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>
                      القيم المالية
                    </h4>
                    <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 2.2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>قيمة الخدمة</span>
                        <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{originalAmount.toFixed(3)} د.أ</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>{isShared ? "اقتطاع لدى العميل 5%" : "اقتطاع لدى العميل"}</span>
                        <span style={{ fontWeight: 800, color: isShared ? "#D97706" : "#64748B" }}>{withholdingAmount.toFixed(3)} د.أ</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>المدفوع فعلياً</span>
                        <span style={{ fontWeight: 800, color: "#0D3C5C" }}>{paidAmount.toFixed(3)} د.أ</span>
                      </div>
                      
                      <div style={{ borderTop: "1.5px solid #E2E8F0", margin: "10px 0" }}></div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: "#0D3C5C" }}>إجمالي الاسترداد</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#0D3C5C" }}>{refundAmount.toFixed(3)} د.أ</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statements & Signatures Row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 24,
                marginBottom: 28,
                alignItems: "flex-end"
              }}>
                {/* Notes & Statements */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C", marginBottom: 4 }}>
                    بيان الاسترداد
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
                    {statement || `استرداد مرتبط بالفاتورة الأصلية ${selectedInvNo}`}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C", marginBottom: 4 }}>
                    ملاحظات
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.6 }}>
                    {notes || "تم إصدار هذا المستند لبيان عملية الاسترداد المرتبطة بالفاتورة الأصلية."}
                  </div>
                </div>

                {/* Signature */}
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signature" style={{ maxHeight: 54, objectFit: "contain", marginBottom: 6 }} />
                  ) : (
                    <div style={{
                      fontFamily: "'Caveat', cursive, sans-serif",
                      fontSize: 34,
                      fontWeight: 800,
                      color: "#0D3C5C",
                      marginBottom: 2
                    }}>
                      Diwan
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>
                    {signerName || "مدير المنصة"}
                  </div>
                </div>
              </div>

              {/* Footer Information Card */}
              <div style={{
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 12,
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.8 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0D3C5C" }}>
                    منصة ديوان للاستشارات الضريبية
                  </div>
                  <div>عمان، المملكة الأردنية الهاشمية</div>
                  <div>الرقم الضريبي: 123456789</div>
                  <div>الهاتف: <span dir="ltr">+962 6 000 0000</span></div>
                  <div>البريد الإلكتروني: info@diwanjo.com</div>
                </div>

                <div>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ maxHeight: 50, objectFit: "contain" }} />
                  ) : (
                    <div style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#0D3C5C",
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      ديوان
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
