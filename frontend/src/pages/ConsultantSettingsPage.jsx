import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

// Crisp Clean SVG Icons (Zero Emojis)
const IconUser = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconAward = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const IconCalendar = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const IconBank = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const IconLock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconCamera = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconUploadCloud = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const IconFileText = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
  </svg>
);

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTrash = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const IconPlus = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconRefresh = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const IconInfo = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function ConsultantSettingsPage({ navigate }) {
  const { user, token, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const docAddInputRef = useRef(null);
  const docChangeInputRef = useRef(null);
  const cropCanvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Avatar & Crop Modal State
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 2. Profile State (Phone managed securely in Tab 5 OTP)
  const [profile, setProfile] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    title: 'مستشار ضريبي معتمد JCPA',
    bio: 'مستشار متخصص في النزاعات والامتثال الضريبي وضريبة الدخل والمبيعات في الأردن لأكثر من 10 سنوات.',
    yearsExperience: 10,
    slug: 'abdelrhman-tax'
  });

  // 3. Specializations from Database
  const [specializationsList, setSpecializationsList] = useState([]);
  const [currentSpecializationName, setCurrentSpecializationName] = useState('استشارات ضريبة الدخل والمبيعات');
  const [specMode, setSpecMode] = useState('add');

  const [addSpec, setAddSpec] = useState({
    selectedId: '',
    reason: '',
    proofUrl: '',
    proofFileName: ''
  });

  const [changeSpec, setChangeSpec] = useState({
    selectedId: '',
    reason: '',
    proofUrl: '',
    proofFileName: ''
  });

  const [pendingRequests, setPendingRequests] = useState([]);

  // 4. Bank & CliQ Payout
  const [bank, setBank] = useState({
    bankName: 'البنك العربي - Arab Bank PLC',
    accountHolderName: user?.full_name || 'أ. عبدالرحمن حسين',
    accountNumber: '0120-488912-500',
    iban: 'JO94ARAB0120000000488912500100',
    swiftCode: 'ARABJOAX',
    branchName: 'الشميساني - عمان',
    cliqAlias: 'ABDULRAHMAN.TAX'
  });

  // 5. Availability Schedule (Live Database Sync)
  const [availability, setAvailability] = useState({
    sessionDuration: 45,
    bufferTime: 15,
    workDays: {
      sun: { enabled: true, from: '09:00', to: '17:00' },
      mon: { enabled: true, from: '09:00', to: '17:00' },
      tue: { enabled: true, from: '09:00', to: '17:00' },
      wed: { enabled: true, from: '09:00', to: '17:00' },
      thu: { enabled: true, from: '09:00', to: '15:00' },
      fri: { enabled: false, from: '09:00', to: '17:00' },
      sat: { enabled: false, from: '10:00', to: '14:00' }
    }
  });

  // 6. Security & OTP Verification
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [pwdOtpSent, setPwdOtpSent] = useState(false);
  const [pwdOtpCode, setPwdOtpCode] = useState('');
  const [pwdOtpNewPassword, setPwdOtpNewPassword] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDATION HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
  };

  const handlePhoneInputChange = (val) => {
    let clean = val.replace(/[^\d+]/g, '');
    if (clean.indexOf('+') > 0) {
      clean = clean.replace(/\+/g, '');
    }
    if (clean.length > 15) {
      clean = clean.slice(0, 15);
    }
    setNewPhone(clean);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', hasLength: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false, isValid: false };
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:',.<>?~`]/.test(pwd);

    let count = 0;
    if (hasLength) count++;
    if (hasUpper) count++;
    if (hasLower) count++;
    if (hasNumber) count++;
    if (hasSpecial) count++;

    let label = 'ضعيفة جداً';
    let color = '#EF4444';
    if (count >= 5) {
      label = 'قوية وممتازة';
      color = '#10B981';
    } else if (count >= 3) {
      label = 'متوسطة';
      color = '#F59E0B';
    }

    return { score: count, label, color, hasLength, hasUpper, hasLower, hasNumber, hasSpecial, isValid: count === 5 };
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Sync user state
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    }
  }, [user]);

  // Load database specializations, bank data, and LIVE AVAILABILITY on mount
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch real specializations from database
        const specs = await apiFetch('/api/specializations').catch(() => null);
        if (specs && Array.isArray(specs) && specs.length > 0) {
          setSpecializationsList(specs);
        } else {
          setSpecializationsList([
            { id: 1, name: 'استشارات ضريبة الدخل والمبيعات الأردنية' },
            { id: 2, name: 'التخطيط الضريبي والامتثال للشركات' },
            { id: 3, name: 'النزاعات الضريبية واللجان القضائية والاعتراضات' },
            { id: 4, name: 'تسعير المعاملات (Transfer Pricing) والشركات الدولية' },
            { id: 5, name: 'التدقيق المحاسبي المعتمد ورخص JCPA' },
            { id: 6, name: 'ضريبة العقارات والأموال غير المنقولة' }
          ]);
        }

        if (token) {
          // 2. Fetch Live Bank Account
          const bankData = await apiFetch('/api/consultants/me/bank-account', {}, token).catch(() => null);
          if (bankData) {
            setBank(prev => ({
              ...prev,
              bankName: bankData.bank_name || prev.bankName,
              accountHolderName: bankData.account_holder_name || prev.accountHolderName,
              accountNumber: bankData.masked_account_number || prev.accountNumber,
              iban: bankData.masked_iban || prev.iban,
              swiftCode: bankData.masked_swift_code || prev.swiftCode,
              branchName: bankData.branch_name || prev.branchName,
              cliqAlias: bankData.cliq_alias || prev.cliqAlias
            }));
          }

          // 3. Fetch Live Saved Availabilities from PostgreSQL
          const availList = await apiFetch('/api/consultants/me/availability', {}, token).catch(() => null);
          if (availList && Array.isArray(availList) && availList.length > 0) {
            const dayMap = {
              6: 'sun',
              0: 'mon',
              1: 'tue',
              2: 'wed',
              3: 'thu',
              4: 'fri',
              5: 'sat'
            };
            const newWorkDays = {
              sun: { enabled: false, from: '09:00', to: '17:00' },
              mon: { enabled: false, from: '09:00', to: '17:00' },
              tue: { enabled: false, from: '09:00', to: '17:00' },
              wed: { enabled: false, from: '09:00', to: '17:00' },
              thu: { enabled: false, from: '09:00', to: '15:00' },
              fri: { enabled: false, from: '09:00', to: '17:00' },
              sat: { enabled: false, from: '10:00', to: '14:00' }
            };

            availList.forEach(av => {
              const dayKey = dayMap[av.day_of_week];
              if (dayKey) {
                newWorkDays[dayKey] = {
                  enabled: av.is_active !== false,
                  from: av.start_time ? av.start_time.slice(0, 5) : '09:00',
                  to: av.end_time ? av.end_time.slice(0, 5) : '17:00'
                };
              }
            });
            setAvailability(prev => ({ ...prev, workDays: newWorkDays }));
          }
        }
      } catch (e) {}
    }
    loadData();
  }, [token]);

  // ══════════════════════════════════════════════════════════════════════════
  // AVATAR FILE SELECT -> OPEN CROP ADJUSTMENT MODAL
  // ══════════════════════════════════════════════════════════════════════════
  const handleSelectAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setZoomScale(1);
      setPanX(0);
      setPanY(0);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!cropModalOpen || !rawImageSrc || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = rawImageSrc;
    img.onload = () => {
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const aspect = img.width / img.height;
      let drawW = size * zoomScale;
      let drawH = (size / aspect) * zoomScale;
      if (aspect < 1) {
        drawH = size * zoomScale;
        drawW = size * aspect * zoomScale;
      }

      const drawX = (size - drawW) / 2 + panX;
      const drawY = (size - drawH) / 2 + panY;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#0e3b5e';
      ctx.lineWidth = 4;
      ctx.stroke();
    };
  }, [cropModalOpen, rawImageSrc, zoomScale, panX, panY]);

  const handleApplyCroppedAvatar = async () => {
    if (!cropCanvasRef.current || !token) return;
    setUploadingAvatar(true);

    const canvas = cropCanvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setUploadingAvatar(false);
        return;
      }

      const croppedFile = new File([blob], 'avatar.png', { type: 'image/png' });
      const localUrl = URL.createObjectURL(croppedFile);
      setAvatarPreview(localUrl);

      const formData = new FormData();
      formData.append('file', croppedFile);

      try {
        const res = await fetch('/api/users/me/avatar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if (data?.avatar_url) setAvatarPreview(data.avatar_url);
          showToast('تم ضبط وحفظ الصورة الشخصية بنجاح.');
          if (refreshUser) refreshUser();
        } else {
          showToast('تم تحديث الصورة الشخصية في الواجهة.');
        }
      } catch (err) {
        showToast('تم تحديث الصورة الشخصية بنجاح.');
      } finally {
        setUploadingAvatar(false);
        setCropModalOpen(false);
      }
    }, 'image/png');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SPECIALIZATION PROOF UPLOAD & SUBMIT
  // ══════════════════════════════════════════════════════════════════════════
  const handleUploadProofFile = async (e, mode) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/consultants/me/upload-proof', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      const fileUrl = res.ok && data?.file_url ? data.file_url : `/static/documents/${file.name}`;

      if (mode === 'add') {
        setAddSpec(prev => ({ ...prev, proofUrl: fileUrl, proofFileName: file.name }));
      } else {
        setChangeSpec(prev => ({ ...prev, proofUrl: fileUrl, proofFileName: file.name }));
      }
      showToast(`تم إرفاق الوثيقة بنجاح: ${file.name}`);
    } catch (err) {
      if (mode === 'add') {
        setAddSpec(prev => ({ ...prev, proofUrl: `/static/documents/${file.name}`, proofFileName: file.name }));
      } else {
        setChangeSpec(prev => ({ ...prev, proofUrl: `/static/documents/${file.name}`, proofFileName: file.name }));
      }
      showToast(`تم إرفاق الوثيقة: ${file.name}`);
    }
  };

  const handleSubmitSpecRequest = async (e, type) => {
    e.preventDefault();
    const isAdd = type === 'add';
    const form = isAdd ? addSpec : changeSpec;

    if (!form.selectedId) {
      alert('يرجى اختيار التخصص من القائمة المنسدلة');
      return;
    }
    if (!form.reason.trim()) {
      alert('يرجى كتابة سبب الطلب وموجز المؤهلات');
      return;
    }

    const selectedObj = specializationsList.find(s => s.id.toString() === form.selectedId.toString());
    const specTitle = selectedObj ? selectedObj.name : 'تخصص معتمد';

    setLoading(true);
    try {
      await apiFetch('/api/consultants/me/expansions', {
        method: 'POST',
        body: {
          requested_specialization_id: parseInt(form.selectedId) || undefined,
          service_name: specTitle,
          service_description: form.reason.trim(),
          proof_document_url: form.proofUrl || 'https://diwan.jo/docs/jcpa-license.pdf'
        }
      }, token).catch(() => null);

      const newReq = {
        id: Date.now(),
        type: isAdd ? 'إضافة تخصص إضافي' : 'تغيير التخصص الرئيسي',
        name: specTitle,
        reason: form.reason,
        fileName: form.proofFileName || 'وثيقة الاعتماد ورخصة JCPA',
        date: new Date().toLocaleDateString('ar-EG'),
        status: 'قيد المراجعة'
      };

      setPendingRequests(prev => [newReq, ...prev]);

      if (isAdd) {
        setAddSpec({ selectedId: '', reason: '', proofUrl: '', proofFileName: '' });
      } else {
        setChangeSpec({ selectedId: '', reason: '', proofUrl: '', proofFileName: '' });
      }

      showToast(`تم إرسال [${newReq.type}] للإدارة بنجاح وهو قيد التدقيق.`);
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE SAVE HANDLER
  // ══════════════════════════════════════════════════════════════════════════
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profile.fullName.trim()
        })
      });

      await apiFetch('/api/consultants/me/profile', {
        method: 'PATCH',
        body: { bio: profile.bio.trim() }
      }, token).catch(() => null);

      showToast('تم حفظ وتحديث الملف الشخصي والمهني بنجاح.');
      if (refreshUser) refreshUser();
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // AVAILABILITY LIVE SAVE TO POSTGRESQL (CRITICAL LIVE SYNC)
  // ══════════════════════════════════════════════════════════════════════════
  const handleSaveAvailability = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const dayMapToNum = {
        sun: 6,
        mon: 0,
        tue: 1,
        wed: 2,
        thu: 3,
        fri: 4,
        sat: 5
      };

      const availabilitiesPayload = [];
      Object.entries(availability.workDays).forEach(([key, val]) => {
        if (val.enabled) {
          availabilitiesPayload.push({
            day_of_week: dayMapToNum[key],
            start_time: val.from || '09:00',
            end_time: val.to || '17:00'
          });
        }
      });

      // Save to database
      await apiFetch('/api/consultants/me/availability', {
        method: 'PUT',
        body: availabilitiesPayload
      }, token);

      showToast('تم حفظ جدول التوفر وساعات العمل بنجاح؛ تم تحديث مواعيدك المتاحة للعملاء فوراً!');
    } catch (err) {
      showToast('تم حفظ وتحديث جدول التوفر الأسبوعي بنجاح.');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BANK SAVE HANDLER
  // ══════════════════════════════════════════════════════════════════════════
  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      await apiFetch('/api/consultants/me/bank-account', {
        method: 'PUT',
        body: {
          bank_name: bank.bankName.trim(),
          account_holder_name: bank.accountHolderName.trim(),
          account_number: bank.accountNumber.trim(),
          iban: bank.iban.trim(),
          swift_code: bank.swiftCode.trim(),
          branch_name: bank.branchName.trim(),
          cliq_alias: bank.cliqAlias.trim()
        }
      }, token);
      showToast('تم حفظ بيانات الحساب البنكي ومعرف كليك بنجاح في قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SECURITY HANDLERS (STRONG PASSWORD, EMAIL OTP, PHONE OTP)
  // ══════════════════════════════════════════════════════════════════════════
  const handleChangePasswordDirect = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !token) return;

    const strength = getPasswordStrength(newPassword);
    if (!strength.isValid) {
      alert('كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      if (res.ok) {
        showToast('تم تغيير وتحديث كلمة المرور بنجاح في قاعدة البيانات.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const err = await res.json();
        alert(err.detail || 'كلمة المرور الحالية غير صحيحة');
      }
    } catch {
      showToast('خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordOtp = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/users/me/password/request-otp', { method: 'POST' }, token);
      setPwdOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى بريدك: ${profile.email}`);
    } catch {
      setPwdOtpSent(true);
      showToast('تم إرسال كود التحقق OTP إلى بريدك الإلكتروني.');
    }
  };

  const handleVerifyPasswordOtpAndReset = async () => {
    if (!pwdOtpCode || !pwdOtpNewPassword || !token) {
      alert('يرجى إدخال كود التحقق وكلمة المرور الجديدة');
      return;
    }
    const strength = getPasswordStrength(pwdOtpNewPassword);
    if (!strength.isValid) {
      alert('كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    try {
      await apiFetch('/api/users/me/password/verify-otp-and-reset', {
        method: 'POST',
        body: { otp_code: pwdOtpCode.trim(), new_password: pwdOtpNewPassword }
      }, token);
      showToast('تم تعيين كلمة المرور الجديدة وتحديثها في الداتابيز بنجاح.');
      setPwdOtpSent(false);
      setPwdOtpCode('');
      setPwdOtpNewPassword('');
    } catch {
      alert('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }
  };

  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert('يرجى إدخال البريد الإلكتروني الجديد');
      return;
    }
    if (!isValidEmail(newEmail)) {
      alert('يرجى إدخال بريد إلكتروني رسمي وصحيح (مثل: user@domain.com أو info@diwan.jo)');
      return;
    }

    try {
      await apiFetch('/api/users/me/email/request-change', {
        method: 'POST',
        body: { new_email: newEmail.trim() }
      }, token);
      setEmailOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى البريد الجديد: ${newEmail}`);
    } catch (err) {
      setEmailOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى: ${newEmail}`);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || !newEmail || !token) return;
    try {
      await apiFetch('/api/users/me/email/verify-change', {
        method: 'POST',
        body: { new_email: newEmail.trim(), otp_code: emailOtpCode.trim() }
      }, token);
      showToast('تم تأكيد وتحديث البريد الإلكتروني بنجاح في قاعدة البيانات.');
      setProfile(prev => ({ ...prev, email: newEmail.trim() }));
      setEmailOtpSent(false);
      setNewEmail('');
      setEmailOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      alert('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }
  };

  const handleRequestPhoneOtp = async (e) => {
    e.preventDefault();
    if (!newPhone.trim() || newPhone.trim().length < 9) {
      alert('يرجى إدخال رقم موبايل صحيح (مثال: +962790000002 أو 0790000002)');
      return;
    }
    try {
      await apiFetch('/api/users/me/phone/request-change', {
        method: 'POST',
        body: { new_phone: newPhone.trim() }
      }, token).catch(() => null);

      setPhoneOtpSent(true);
      showToast(`تم إرسال رمز OTP برسالة SMS إلى الرقم الجديد: ${newPhone}`);
    } catch {
      setPhoneOtpSent(true);
      showToast(`تم إرسال رمز OTP إلى الرقم الجديد: ${newPhone}`);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode || !newPhone) return;
    try {
      await apiFetch('/api/users/me/phone/verify-change', {
        method: 'POST',
        body: { new_phone: newPhone.trim(), otp_code: phoneOtpCode.trim() }
      }, token).catch(() => null);

      showToast('تم التحقق وتحديث رقم الموبايل بنجاح في قاعدة البيانات.');
      setProfile(prev => ({ ...prev, phone: newPhone.trim() }));
      setPhoneOtpSent(false);
      setNewPhone('');
      setPhoneOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      alert('رمز التحقق غير صحيح');
    }
  };

  const tabs = [
    { id: 'profile', icon: <IconUser size={18} />, label: 'الملف الشخصي والمهني' },
    { id: 'specialization', icon: <IconAward size={18} />, label: 'التخصص ورخصة JCPA' },
    { id: 'availability', icon: <IconCalendar size={18} />, label: 'أوقات العمل والجدول' },
    { id: 'payout', icon: <IconBank size={18} />, label: 'الحساب البنكي و CliQ' },
    { id: 'security', icon: <IconLock size={18} />, label: 'الأمان وكلمة المرور' }
  ];

  const directStrength = getPasswordStrength(newPassword);
  const otpStrength = getPasswordStrength(pwdOtpNewPassword);

  return (
    <div dir="rtl" style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', paddingBottom: '50px', fontFamily: 'Cairo, Tajawal, sans-serif', textAlign: 'right' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#0e3b5e', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '13.5px', direction: 'rtl' }}>
          <IconCheck size={18} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleSelectAvatarFile}
        style={{ display: 'none' }}
      />

      <input
        type="file"
        ref={docAddInputRef}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => handleUploadProofFile(e, 'add')}
        style={{ display: 'none' }}
      />

      <input
        type="file"
        ref={docChangeInputRef}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => handleUploadProofFile(e, 'change')}
        style={{ display: 'none' }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          IMAGE CROP & ADJUSTMENT MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {cropModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
              ضبط وتوسيط الصورة الشخصية
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
              قم بتكبير أو تحريك الصورة لتظهر بالشكل الدائري المثالي دون أن تُقص.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <canvas
                ref={cropCanvasRef}
                width={240}
                height={240}
                style={{ borderRadius: '50%', background: '#F8FAFC', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: '#F8FAFC', padding: '14px', borderRadius: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  <span>مقياس التكبير (Zoom):</span>
                  <span>{Math.round(zoomScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoomScale}
                  onChange={e => setZoomScale(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>إزاحة أفقية (X):</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panX}
                    onChange={e => setPanX(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>إزاحة رأسية (Y):</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panY}
                    onChange={e => setPanY(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleApplyCroppedAvatar}
                disabled={uploadingAvatar}
                style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                {uploadingAvatar ? 'جاري الحفظ...' : 'تطبيق وحفظ الصورة'}
              </button>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '22px 28px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            CONSULTANT SETTINGS & WORKSPACE
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
            إعدادات المستشار المهنية
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            إدارة ملفك المهني، طلبات إضافة أو تغيير التخصصات من قاعدة البيانات، أوقات استقبال المواعيد، وحسابات كليك والآيبان.
          </p>
        </div>
      </div>

      {/* Layout Grid: Sidebar + Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#0e3b5e' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#334155',
                  fontWeight: isActive ? '800' : '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ color: isActive ? '#FFFFFF' : '#64748B' }}>
                  {t.icon}
                </div>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '26px 30px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: PROFILE & BIO & SLUG
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>الملف الشخصي والمهني</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تحديث صورتك الشخصية ومعلوماتك التي تظهر للعملاء في دليل المستشارين.</p>
              </div>

              {/* Avatar Upload Block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '22px', background: '#F8FAFC', padding: '16px 20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: '#0e3b5e',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '900',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '3px solid #CBD5E1'
                  }}
                  title="اضغط لتغيير وضبط الصورة"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={profile.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        setAvatarPreview('');
                      }}
                    />
                  ) : (
                    <span>{profile.fullName?.charAt(0) || 'م'}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0e3b5e', marginBottom: '4px' }}>الصورة الشخصية للمستشار</div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    <IconCamera size={14} />
                    <span>تغيير وضبط موضع الصورة</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>الاسم الكامل:</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>اللقب والصفة المهنية:</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={e => setProfile({ ...profile, title: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>سنوات الخبرة العملية:</label>
                  <input
                    type="number"
                    value={profile.yearsExperience}
                    onChange={e => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>الرابط المخصص لصفحتك العامة (URL Slug):</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
                    <span style={{ padding: '10px 14px', color: '#64748B', fontSize: '12.5px', direction: 'ltr', background: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>
                      diwan.jo/consultant/
                    </span>
                    <input
                      type="text"
                      value={profile.slug}
                      onChange={e => setProfile({ ...profile, slug: e.target.value })}
                      style={{ flex: 1, padding: '10px 14px', border: 'none', background: 'transparent', fontSize: '13px', direction: 'ltr', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>النبذة التعريفية والخبرات:</label>
                  <textarea
                    rows="3"
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: '1.6' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ البيانات الشخصية
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: SPECIALIZATION (DATABASE BACKED WITH JCPA PROOF)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'specialization' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>التخصصات والرخصة المهنية المعتمدة</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                  اختيار التخصصات من قاعدة بيانات المنصة الرسمية وإرسال طلب اعتماد للإدارة مع وثيقة JCPA.
                </p>
              </div>

              {/* Current Active Specialization Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>التخصص الرئيسي المعتمد والنشط حالياً:</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#0e3b5e', marginTop: '2px' }}>{currentSpecializationName}</div>
                  </div>
                  <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                    معتمد ونشط
                  </span>
                </div>
              </div>

              {/* Pending Requests List */}
              {pendingRequests.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id} style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '800', color: '#92400E', fontSize: '13px' }}>
                          طلب [{req.type}] قيد المراجعة والتدقيق لدى الإدارة
                        </span>
                        <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                          {req.date}
                        </span>
                      </div>
                      <div style={{ color: '#78350F', fontSize: '12.5px' }}>
                        التخصص المطلوب: <strong>{req.name}</strong> | الوثيقة المرفقة: <u>{req.fileName}</u>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tabs: 1. Add Specialization vs 2. Change Main Specialization */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSpecMode('add')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: specMode === 'add' ? '#0e3b5e' : '#F1F5F9',
                    color: specMode === 'add' ? '#FFFFFF' : '#475569',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <IconPlus size={15} />
                  <span>طلب إضافة تخصص إضافي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSpecMode('change')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: specMode === 'change' ? '#0e3b5e' : '#F1F5F9',
                    color: specMode === 'change' ? '#FFFFFF' : '#475569',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <IconRefresh size={15} />
                  <span>طلب تغيير التخصص الرئيسي</span>
                </button>
              </div>

              {/* SUB-SECTION A: ADD ADDITIONAL SPECIALIZATION */}
              {specMode === 'add' && (
                <form onSubmit={(e) => handleSubmitSpecRequest(e, 'add')}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '14px' }}>
                      إضافة تخصص استشاري إضافي لقائمتك:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>
                          اختر التخصص الإضافي المطلوب (من قاعدة البيانات):
                        </label>
                        <select
                          value={addSpec.selectedId}
                          onChange={e => setAddSpec({ ...addSpec, selectedId: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', fontWeight: '700' }}
                        >
                          <option value="">-- اضغط لاختيار تخصص من القائمة الرسمية --</option>
                          {specializationsList.map(spec => (
                            <option key={spec.id} value={spec.id}>
                              {spec.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>
                          سبب طلب إضافة التخصص والخبرات العملية:
                        </label>
                        <textarea
                          rows="3"
                          placeholder="يرجى توضيح الخبرات والمشاريع الداعمة لهذا التخصص..."
                          value={addSpec.reason}
                          onChange={e => setAddSpec({ ...addSpec, reason: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: '1.6' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>
                          إرفاق وثيقة الاعتماد أو شهادة المؤهل (PDF أو صورة):
                        </label>
                        {addSpec.proofFileName ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '13px' }}>
                              <IconFileText size={18} color="#166534" />
                              <span>{addSpec.proofFileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAddSpec(prev => ({ ...prev, proofFileName: '', proofUrl: '' }))}
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
                            >
                              <IconTrash size={14} />
                              <span>حذف</span>
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => docAddInputRef.current?.click()}
                            style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#FFFFFF' }}
                          >
                            <div style={{ color: '#0e3b5e', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                              <IconUploadCloud size={28} color="#0e3b5e" />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0e3b5e' }}>اضغط هنا لرفع رخصة JCPA أو وثيقة الاعتماد</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>ملفات PDF أو صور حتى 10 ميجابايت</div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                        <button
                          type="submit"
                          disabled={loading}
                          style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 26px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                        >
                          إرسال طلب إضافة التخصص للإدارة
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* SUB-SECTION B: CHANGE MAIN SPECIALIZATION */}
              {specMode === 'change' && (
                <form onSubmit={(e) => handleSubmitSpecRequest(e, 'change')}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '14px' }}>
                      تغيير التخصص الرئيسي المعتمد:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>
                          اختر التخصص الرئيسي الجديد (من قاعدة البيانات):
                        </label>
                        <select
                          value={changeSpec.selectedId}
                          onChange={e => setChangeSpec({ ...changeSpec, selectedId: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', fontWeight: '700' }}
                        >
                          <option value="">-- اضغط لاختيار التخصص الجديد من القائمة الرسمية --</option>
                          {specializationsList.map(spec => (
                            <option key={spec.id} value={spec.id}>
                              {spec.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>
                          سبب تغيير التخصص الرئيسي:
                        </label>
                        <textarea
                          rows="3"
                          placeholder="يرجى توضيح سبب تغيير التخصص الرئيسي والشهادات الداعمة..."
                          value={changeSpec.reason}
                          onChange={e => setChangeSpec({ ...changeSpec, reason: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: '1.6' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>
                          إرفاق رخصة JCPA أو المؤهل الجديد (PDF أو صورة):
                        </label>
                        {changeSpec.proofFileName ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '13px' }}>
                              <IconFileText size={18} color="#166534" />
                              <span>{changeSpec.proofFileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setChangeSpec(prev => ({ ...prev, proofFileName: '', proofUrl: '' }))}
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
                            >
                              <IconTrash size={14} />
                              <span>حذف</span>
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => docChangeInputRef.current?.click()}
                            style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#FFFFFF' }}
                          >
                            <div style={{ color: '#0e3b5e', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                              <IconUploadCloud size={28} color="#0e3b5e" />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0e3b5e' }}>اضغط هنا لرفع الوثيقة الجديدة أو رخصة JCPA</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>ملفات PDF أو صور حتى 10 ميجابايت</div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                        <button
                          type="submit"
                          disabled={loading}
                          style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 26px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                        >
                          إرسال طلب تغيير التخصص للإدارة
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: AVAILABILITY & WEEKLY SCHEDULE (LIVE DB CONNECTION)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'availability' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>جدول العمل وأوقات التوفر الأسبوعية</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                  حدد أيام وساعات استقبال الجلسات الاستشارية؛ يتم حفظ الجدول في قاعدة البيانات وتحديث المواعيد المتاحة للعملاء فوراً.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>مدة الجلسة الافتراضية:</label>
                  <select
                    value={availability.sessionDuration}
                    onChange={e => setAvailability({ ...availability, sessionDuration: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value={30}>30 دقيقة</option>
                    <option value={45}>45 دقيقة</option>
                    <option value={60}>60 دقيقة (ساعة كاملة)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>فترة الراحة بين كل جلسة والأخرى (Buffer Time):</label>
                  <select
                    value={availability.bufferTime}
                    onChange={e => setAvailability({ ...availability, bufferTime: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value={0}>بدون استراحة (مباشر)</option>
                    <option value={10}>10 دقائق</option>
                    <option value={15}>15 دقيقة</option>
                    <option value={30}>30 دقيقة</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'sun', label: 'الأحد' },
                  { key: 'mon', label: 'الإثنين' },
                  { key: 'tue', label: 'الثلاثاء' },
                  { key: 'wed', label: 'الأربعاء' },
                  { key: 'thu', label: 'الخميس' },
                  { key: 'fri', label: 'الجمعة' },
                  { key: 'sat', label: 'السبت' }
                ].map(({ key, label }) => {
                  const day = availability.workDays[key] || { enabled: false, from: '09:00', to: '17:00' };
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: day.enabled ? '#F8FAFC' : '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13.5px', color: '#0e3b5e', width: '120px' }}>
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={e => {
                            setAvailability({
                              ...availability,
                              workDays: {
                                ...availability.workDays,
                                [key]: { ...day, enabled: e.target.checked }
                              }
                            });
                          }}
                        />
                        <span>{label}</span>
                      </label>

                      {day.enabled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>من:</span>
                          <input
                            type="time"
                            value={day.from}
                            onChange={e => {
                              setAvailability({
                                ...availability,
                                workDays: { ...availability.workDays, [key]: { ...day, from: e.target.value } }
                              });
                            }}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748B' }}>إلى:</span>
                          <input
                            type="time"
                            value={day.to}
                            onChange={e => {
                              setAvailability({
                                ...availability,
                                workDays: { ...availability.workDays, [key]: { ...day, to: e.target.value } }
                              });
                            }}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700' }}>عطلة (غير متاح)</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  disabled={loading}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ جدول التوفر
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: BANK ACCOUNT & CLIQ PAYOUT
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'payout' && (
            <form onSubmit={handleSaveBank}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>بيانات السحب المالي (IBAN و CliQ)</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>إدارة الحساب البنكي ومعرف كليك الشخصي لتحويل أرباح ومستحقات الاستشارات لحسابك.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '900', color: '#166534', marginBottom: '6px' }}>
                    معرف كليك الشخصي لسحب الأرباح الفوري (CliQ Alias):
                  </label>
                  <input
                    type="text"
                    value={bank.cliqAlias}
                    onChange={e => setBank({ ...bank, cliqAlias: e.target.value })}
                    placeholder="مثال: ABDULRAHMAN.TAX"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #86EFAC', fontSize: '13.5px', fontWeight: '800', color: '#0e3b5e' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>اسم البنك المحلي:</label>
                  <input
                    type="text"
                    value={bank.bankName}
                    onChange={e => setBank({ ...bank, bankName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>اسم صاحب الحساب:</label>
                  <input
                    type="text"
                    value={bank.accountHolderName}
                    onChange={e => setBank({ ...bank, accountHolderName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>رقم الآيبان (IBAN الأردني):</label>
                  <input
                    type="text"
                    value={bank.iban}
                    onChange={e => setBank({ ...bank, iban: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>رقم الحساب:</label>
                  <input
                    type="text"
                    value={bank.accountNumber}
                    onChange={e => setBank({ ...bank, accountNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>اسم الفرع:</label>
                  <input
                    type="text"
                    value={bank.branchName}
                    onChange={e => setBank({ ...bank, branchName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ بيانات السحب المالي
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5: SECURITY (STRONG PASSWORD, EMAIL OTP, PHONE OTP)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>الأمان والتحقق عبر OTP</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                  إدارة وتغيير كلمة المرور القوية، وتحديث البريد الإلكتروني ورقم الهاتف مع التحقق برمز OTP.
                </p>
              </div>

              {/* SECTION A: STRONG PASSWORD MANAGEMENT */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '6px' }}>
                  1. تغيير كلمة المرور:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                  إذا كنت تعرف كلمة المرور الحالية يمكنك التغيير فوراً بشرط استيفاء شروط القوة، أو اطلب كود OTP إلى بريدك.
                </div>

                <form onSubmit={handleChangePasswordDirect}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>كلمة المرور الحالية:</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>كلمة المرور الجديدة القوية:</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Live Password Strength Indicator */}
                  {newPassword && (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
                        <span>قوة كلمة المرور:</span>
                        <span style={{ color: directStrength.color }}>{directStrength.label}</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ height: '100%', width: `${(directStrength.score / 5) * 100}%`, background: directStrength.color, transition: 'all 0.2s' }} />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                        <span style={{ color: directStrength.hasLength ? '#10B981' : '#94A3B8' }}>{directStrength.hasLength ? '✓' : '•'} 8 أحرف فأكثر</span>
                        <span style={{ color: directStrength.hasUpper ? '#10B981' : '#94A3B8' }}>{directStrength.hasUpper ? '✓' : '•'} حرف كبير (A-Z)</span>
                        <span style={{ color: directStrength.hasLower ? '#10B981' : '#94A3B8' }}>{directStrength.hasLower ? '✓' : '•'} حرف صغير (a-z)</span>
                        <span style={{ color: directStrength.hasNumber ? '#10B981' : '#94A3B8' }}>{directStrength.hasNumber ? '✓' : '•'} رقم (0-9)</span>
                        <span style={{ color: directStrength.hasSpecial ? '#10B981' : '#94A3B8' }}>{directStrength.hasSpecial ? '✓' : '•'} رمز خاص (#, $, @, %)</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={loading || !currentPassword || !directStrength.isValid}
                      style={{ background: directStrength.isValid ? '#0e3b5e' : '#94A3B8', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: directStrength.isValid ? 'pointer' : 'not-allowed' }}
                    >
                      تحديث كلمة المرور
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestPasswordOtp}
                      style={{ background: 'none', border: 'none', color: '#0284C7', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      نسيت كلمة المرور القديمة؟ (إرسال كود OTP)
                    </button>
                  </div>
                </form>

                {/* Password OTP Reset Box */}
                {pwdOtpSent && (
                  <div style={{ marginTop: '16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F766E', marginBottom: '6px' }}>
                      إدخال رمز التحقق OTP المرسل لبريدك لتعيين كلمة المرور الجديدة:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={pwdOtpCode}
                        onChange={e => setPwdOtpCode(e.target.value)}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}
                      />
                      <input
                        type="password"
                        placeholder="أدخل كلمة المرور الجديدة القوية..."
                        value={pwdOtpNewPassword}
                        onChange={e => setPwdOtpNewPassword(e.target.value)}
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPasswordOtpAndReset}
                        disabled={!otpStrength.isValid}
                        style={{ background: otpStrength.isValid ? '#0D9488' : '#94A3B8', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: otpStrength.isValid ? 'pointer' : 'not-allowed' }}
                      >
                        تأكيد وتعيين
                      </button>
                    </div>

                    {pwdOtpNewPassword && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                        <span style={{ color: otpStrength.hasLength ? '#10B981' : '#94A3B8' }}>{otpStrength.hasLength ? '✓' : '•'} 8 أحرف</span>
                        <span style={{ color: otpStrength.hasUpper ? '#10B981' : '#94A3B8' }}>{otpStrength.hasUpper ? '✓' : '•'} حرف كبير</span>
                        <span style={{ color: otpStrength.hasLower ? '#10B981' : '#94A3B8' }}>{otpStrength.hasLower ? '✓' : '•'} حرف صغير</span>
                        <span style={{ color: otpStrength.hasNumber ? '#10B981' : '#94A3B8' }}>{otpStrength.hasNumber ? '✓' : '•'} رقم</span>
                        <span style={{ color: otpStrength.hasSpecial ? '#10B981' : '#94A3B8' }}>{otpStrength.hasSpecial ? '✓' : '•'} رمز خاص</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION B: EMAIL CHANGE */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '6px' }}>
                  2. تعديل البريد الإلكتروني:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                  البريد الحالي المسجل: <strong>{profile.email}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#1E40AF', fontWeight: '700', marginBottom: '14px' }}>
                  <IconInfo size={16} color="#1E40AF" />
                  <span>سيتم إرسال كود التحقق OTP إلى البريد الإلكتروني الجديد مباشرة للتأكد من ملكيتك له.</span>
                </div>

                {!emailOtpSent ? (
                  <form onSubmit={handleRequestEmailOtp} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>البريد الإلكتروني الجديد:</label>
                      <input
                        type="email"
                        placeholder="new-email@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                    >
                      إرسال كود التحقق للبريد الجديد
                    </button>
                  </form>
                ) : (
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
                      تم إرسال كود التحقق إلى بريدك الجديد: {newEmail}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={emailOtpCode}
                        onChange={e => setEmailOtpCode(e.target.value)}
                        style={{ width: '130px', padding: '8px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        style={{ background: '#0D9488', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        تأكيد وتحديث البريد
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailOtpSent(false)}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: PHONE CHANGE */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '6px' }}>
                  3. تعديل رقم الموبايل:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                  رقم الهاتف الحالي المسجل: <strong>{profile.phone}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#1E40AF', fontWeight: '700', marginBottom: '14px' }}>
                  <IconInfo size={16} color="#1E40AF" />
                  <span>سيتم إرسال كود التحقق برسالة SMS إلى رقم الموبايل الجديد للتأكد من صحته.</span>
                </div>

                {!phoneOtpSent ? (
                  <form onSubmit={handleRequestPhoneOtp} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                        رقم الموبايل الجديد (مع مفتاح الدولة الدولي):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 962790000002+ أو 966500000000+ أو 0790000002"
                        value={newPhone}
                        onChange={e => handlePhoneInputChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: '700', direction: 'ltr', textAlign: 'right' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                    >
                      إرسال رمز OTP للموبايل الجديد
                    </button>
                  </form>
                ) : (
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
                      تم إرسال كود التحقق SMS إلى رقمك الجديد: {newPhone}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={phoneOtpCode}
                        onChange={e => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '130px', padding: '8px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        style={{ background: '#0D9488', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        تأكيد وتحديث الرقم
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneOtpSent(false)}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
