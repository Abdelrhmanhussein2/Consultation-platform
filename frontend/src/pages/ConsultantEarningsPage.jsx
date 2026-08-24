import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';

export default function ConsultantEarningsPage({ navigate }) {
  const { token } = useAuth();
  
  // State
  const [wallet, setWallet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Payout / Bank Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('payout'); // 'payout' or 'bank'
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // Bank Form States
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [currency, setCurrency] = useState('JOD');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        const [walletData, apptsData, clientsData, servicesData] = await Promise.all([
          consultantService.getWallet(token).catch(() => null),
          consultantService.getIncomingAppointments(token).catch(() => []),
          consultantService.getClients(token).catch(() => []),
          consultantService.getMyServices(token).catch(() => [])
        ]);

        if (walletData) {
          setWallet(walletData);
          if (walletData.bank_account) {
            setBankName(walletData.bank_account.bank_name || '');
            setAccountHolderName(walletData.bank_account.account_holder_name || '');
            setAccountNumber(walletData.bank_account.account_number || '');
            setIban(walletData.bank_account.iban || '');
            setSwiftCode(walletData.bank_account.swift_code || '');
            setBranchName(walletData.bank_account.branch_name || '');
            setCurrency(walletData.bank_account.currency || 'JOD');
          }
        }
        setAppointments(apptsData);
        setClients(clientsData);
        setServices(servicesData);
      } catch (err) {
        console.error('Error fetching wallet/earnings data:', err);
        setError('فشل تحميل البيانات المالية. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Compute month's total earnings (completed sessions in the current calendar month)
  const getMonthTotal = () => {
    if (!appointments) return 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const completedThisMonth = appointments.filter(appt => {
      if (appt.status !== 'completed' || !appt.scheduled_at) return false;
      const apptDate = new Date(appt.scheduled_at);
      return apptDate.getFullYear() === currentYear && apptDate.getMonth() === currentMonth;
    });

    return completedThisMonth.reduce((sum, appt) => sum + (parseFloat(appt.price) || 0), 0);
  };

  // Filter completed appointments to show in the transactions table
  const completedAppointments = appointments.filter(appt => appt.status === 'completed');

  // Submit bank details
  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!token) return;
    setBankLoading(true);
    setBankError('');

    try {
      const payload = {
        bank_name: bankName.trim(),
        account_holder_name: accountHolderName.trim(),
        account_number: accountNumber.trim(),
        iban: iban.trim() || null,
        swift_code: swiftCode.trim() || null,
        branch_name: branchName.trim() || null,
        currency
      };

      const updatedBank = await consultantService.saveBankAccount(payload, token);
      if (updatedBank) {
        // Refetch wallet to update state
        const freshWallet = await consultantService.getWallet(token).catch(() => null);
        if (freshWallet) setWallet(freshWallet);
        
        setSuccessMessage('تم حفظ تفاصيل الحساب البنكي بنجاح!');
        setModalType('payout'); // Switch back to payout modal type
      }
    } catch (err) {
      console.error('Error saving bank account:', err);
      setBankError(err.message || 'فشل حفظ بيانات البنك. يرجى التحقق من المدخلات.');
    } finally {
      setBankLoading(false);
    }
  };

  // Submit payout request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!token) return;
    setPayoutLoading(true);
    setPayoutError('');

    try {
      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      }

      const payoutRes = await consultantService.requestPayout(amount, token);
      if (payoutRes) {
        // Refetch wallet to get fresh balances
        const freshWallet = await consultantService.getWallet(token).catch(() => null);
        if (freshWallet) setWallet(freshWallet);

        setSuccessMessage('تم تقديم طلب السحب بنجاح وهو قيد المراجعة الآن!');
        setIsModalOpen(false);
        setPayoutAmount('');
      }
    } catch (err) {
      console.error('Error requesting payout:', err);
      setPayoutError(err.message || 'فشل تقديم طلب السحب.');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Map user_id to client full_name
  const getClientName = (userId) => {
    const client = clients.find(c => c.user_id === userId);
    return client ? client.full_name : 'عميل';
  };

  // Map service_id to service name
  const getServiceName = (serviceId) => {
    const srv = services.find(s => s.id === serviceId);
    return srv ? srv.name : 'جلسة تجريبية - اختبار الفيديو والملخص الذكي';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#005D9C', fontWeight: '700' }}>
        جاري تحميل البيانات المالية والعمليات...
      </div>
    );
  }

  const currencyStr = wallet?.currency || 'د.أ';
  const availableBal = parseFloat(wallet?.available_balance) || 0;
  const totalEarned = parseFloat(wallet?.total_earned) || 0;
  const totalWithdrawn = parseFloat(wallet?.total_withdrawn) || 0;
  
  // Limit of 50 JOD for withdrawal request
  const isWithdrawalEnabled = availableBal >= 50 && wallet?.has_bank_account;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/consultant/dashboard')} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          border: 'none', 
          background: 'none', 
          color: '#64748B', 
          cursor: 'pointer', 
          fontSize: '14px', 
          fontWeight: '700', 
          marginBottom: '16px',
          padding: 0
        }}
      >
        <span style={{ fontSize: '18px' }}>→</span>
        <span>رجوع</span>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <div style={{ fontSize: '24px' }}>💳</div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>الأرباح والمسحوبات</h1>
      </div>
      <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 24px 0' }}>
        عمولة المنصة: 15% - الحد الأدنى للسحب: 50 د.أ
      </p>

      {/* Alert message */}
      {(successMessage || error) && (
        <div 
          onClick={() => { setSuccessMessage(''); setError(''); }}
          style={{ 
            background: error ? '#FEE2E2' : '#E5EFF5', 
            color: error ? '#991B1B' : '#005D9C', 
            padding: '14px 18px', 
            borderRadius: '12px', 
            marginBottom: '20px', 
            fontSize: '13px', 
            fontWeight: '700', 
            border: error ? '1px solid #FCA5A5' : '1px solid #BAE6FD',
            cursor: 'pointer'
          }}
        >
          {successMessage || error}
        </div>
      )}

      {/* 3 cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Card 1: Available balance with action */}
        <div style={{ 
          background: 'linear-gradient(135deg, #FF8A00, #FF5C00)', 
          color: '#FFFFFF', 
          padding: '24px', 
          borderRadius: '20px',
          boxShadow: '0 8px 16px rgba(255, 92, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '160px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', opacity: 0.9 }}>الرصيد المتاح للسحب</span>
            <div style={{ fontSize: '20px' }}>👛</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', margin: '12px 0' }}>
            {availableBal.toFixed(2)} <span style={{ fontSize: '16px', fontWeight: '600' }}>{currencyStr}</span>
          </div>
          
          <button
            onClick={() => {
              if (!wallet?.has_bank_account) {
                setModalType('bank');
              } else {
                setModalType('payout');
              }
              setIsModalOpen(true);
            }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px 0',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            {!wallet?.has_bank_account ? 'ربط الحساب البنكي' : 'طلب سحب'}
          </button>
        </div>

        {/* Card 2: Month's total */}
        <div style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          padding: '24px', 
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(13, 60, 92, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '160px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>إجمالي الشهر</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: '#D1FAE5', 
              color: '#065F46', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px' 
            }}>↗</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0D3C5C', margin: '12px 0' }}>
            {getMonthTotal().toFixed(2)} <span style={{ fontSize: '16px', fontWeight: '600' }}>{currencyStr}</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>قبل العمولة</span>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          padding: '24px', 
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(13, 60, 92, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '160px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>إجمالي مسحوب</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: '#DBEAFE', 
              color: '#1E40AF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px' 
            }}>📥</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0D3C5C', margin: '12px 0' }}>
            {totalWithdrawn.toFixed(2)} <span style={{ fontSize: '16px', fontWeight: '600' }}>{currencyStr}</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>منذ بداية الحساب</span>
        </div>

      </div>

      {/* Transactions Section */}
      <div style={{ 
        background: '#FFFFFF', 
        borderRadius: '20px', 
        border: '1px solid #E2E8F0', 
        padding: '24px',
        boxShadow: '0 4px 12px rgba(13, 60, 92, 0.02)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', marginBottom: '20px' }}>آخر المعاملات</h3>
        
        {completedAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📊</span>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>لا توجد معاملات مكتملة في رصيدك حتى الآن.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'right', color: '#64748B' }}>
                  <th style={{ padding: '12px 8px' }}>التاريخ</th>
                  <th style={{ padding: '12px 8px' }}>العميل</th>
                  <th style={{ padding: '12px 8px' }}>الجلسة</th>
                  <th style={{ padding: '12px 8px' }}>القيمة</th>
                  <th style={{ padding: '12px 8px' }}>العمولة</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>الصافي</th>
                </tr>
              </thead>
              <tbody>
                {completedAppointments.map((appt) => {
                  const dateStr = appt.scheduled_at 
                    ? new Date(appt.scheduled_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })
                    : '';
                  
                  const priceVal = parseFloat(appt.price) || 0;
                  const commissionVal = priceVal * 0.15;
                  const netVal = priceVal * 0.85;

                  return (
                    <tr key={appt.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 8px', color: '#64748B' }}>{dateStr}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '600', color: '#334155' }}>
                        {getClientName(appt.user_id)}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#005D9C' }}>
                        {getServiceName(appt.service_id)}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '700', color: '#334155' }}>
                        {priceVal.toFixed(2)} {currencyStr}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#EF4444', fontWeight: '600' }}>
                        {commissionVal > 0 ? `-${commissionVal.toFixed(2)}` : '0.00'} {currencyStr}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '800', color: '#10B981', textAlign: 'left' }}>
                        {netVal.toFixed(2)} {currencyStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal dialog */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setPayoutError('');
                setBankError('');
              }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700'
              }}
            >
              ✕
            </button>

            {modalType === 'payout' ? (
              /* Payout Request Form */
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', marginTop: 0, marginBottom: '8px' }}>
                  تقديم طلب سحب الأرباح
                </h3>
                <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>
                  سيتم تحويل المبلغ إلى حسابك البنكي المسجل: **{wallet?.bank_account?.bank_name}**
                </p>

                {payoutError && (
                  <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', fontWeight: '700' }}>
                    {payoutError}
                  </div>
                )}

                <form onSubmit={handleRequestPayout}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                      مبلغ السحب المطلوب ({currencyStr})
                    </label>
                    <input 
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`أدخل القيمة (مثال: 50)`}
                      min="10"
                      max={availableBal}
                      step="0.01"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>
                      الرصيد الأقصى المتاح حالياً: {availableBal.toFixed(2)} {currencyStr}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
                    <button 
                      type="submit"
                      disabled={payoutLoading || availableBal < 10}
                      style={{
                        background: '#003C62',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '25px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {payoutLoading ? 'جاري تقديم الطلب...' : 'تأكيد السحب'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setModalType('bank')}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#003C62',
                        padding: '12px 20px',
                        borderRadius: '25px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      تعديل بيانات البنك
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Register Bank Form */
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', marginTop: 0, marginBottom: '8px' }}>
                  ربط الحساب البنكي
                </h3>
                <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>
                  أدخل تفاصيل حسابك البنكي لتلقي التحويلات المالية عند السحب.
                </p>

                {bankError && (
                  <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', fontWeight: '700' }}>
                    {bankError}
                  </div>
                )}

                <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>اسم البنك</label>
                    <input 
                      type="text" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="مثال: البنك العربي"
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>اسم صاحب الحساب</label>
                    <input 
                      type="text" 
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="الاسم الكامل كما في البنك"
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>رقم الحساب البنكي</label>
                    <input 
                      type="text" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="أدخل رقم الحساب"
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>رقم الآيبان (IBAN)</label>
                      <input 
                        type="text" 
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        placeholder="اختياري"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>رمز السويفت (SWIFT)</label>
                      <input 
                        type="text" 
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value)}
                        placeholder="اختياري"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>اسم الفرع</label>
                      <input 
                        type="text" 
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="مثال: الفرع الرئيسي"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>عملة الحساب</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      >
                        <option value="JOD">دينار أردني (JOD)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-start' }}>
                    <button 
                      type="submit"
                      disabled={bankLoading}
                      style={{
                        background: '#003C62',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '25px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {bankLoading ? 'جاري الحفظ...' : 'حفظ بيانات البنك'}
                    </button>
                    
                    {wallet?.has_bank_account && (
                      <button 
                        type="button"
                        onClick={() => setModalType('payout')}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#64748B',
                          padding: '12px 20px',
                          borderRadius: '25px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                </form>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
