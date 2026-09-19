import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

// Modular Subcomponents
import ConsultantProfileTab from './consultantSettings/ConsultantProfileTab';
import ConsultantSpecializationsTab from './consultantSettings/ConsultantSpecializationsTab';
import ConsultantBankingTab from './consultantSettings/ConsultantBankingTab';
import ConsultantNotificationsTab from './consultantSettings/ConsultantNotificationsTab';
import ConsultantSecurityTab from './consultantSettings/ConsultantSecurityTab';
import ConsultantPreferencesTab from './consultantSettings/ConsultantPreferencesTab';

export default function ConsultantSettingsPage({ navigate }) {
  const { user, token, refreshUser, logout } = useAuth();
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

  // 2. Profile State
  const [profile, setProfile] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    title: user?.title || 'مستشار ضريبي معتمد JCPA',
    bio: 'مستشار متخصص في النزاعات والامتثال الضريبي وضريبة الدخل والمبيعات في الأردن لأكثر من 10 سنوات.',
    yearsExperience: 10,
    slug: user?.url_slug || 'abdelrhman-tax'
  });
  const [city, setCity] = useState('عمّان');
  const [country, setCountry] = useState('الأردن');

  // 3. Specializations from Database
  const [specializationsList, setSpecializationsList] = useState([]);
  const [currentSpecializationId, setCurrentSpecializationId] = useState(1);
  const [currentSpecializationName, setCurrentSpecializationName] = useState('ضريبة الدخل والمبيعات');
  const [approvedSpecializations, setApprovedSpecializations] = useState([]);
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
  const [dialogModal, setDialogModal] = useState({ open: false, title: '', message: '', type: 'warning' });

  const showDialogModal = (title, message, type = 'warning') => {
    setDialogModal({ open: true, title, message, type });
  };

  const closeDialogModal = () => {
    setDialogModal({ open: false, title: '', message: '', type: 'warning' });
  };

  // 4. Bank & CliQ Payout
  const [bank, setBank] = useState({
    bankName: 'البنك العربي - Arab Bank PLC',
    accountHolderName: user?.full_name || 'أ. رأفت حداد',
    accountNumber: '0120-488912-500',
    iban: 'JO94ARAB0120000000488912500100',
    swiftCode: 'ARABJOAX',
    branchName: 'الشميساني - عمان',
    cliqAlias: 'ABDULRAHMAN.TAX'
  });

  // 5. Notifications Preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    newBooking: true,
    chatMessages: true,
    payouts: true,
    sessionReminders: true,
    platformUpdates: false,
    reminderMinutes: '60'
  });

  // 6. Security & OTP Verification
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pwdOtpSent, setPwdOtpSent] = useState(false);
  const [pwdOtpCode, setPwdOtpCode] = useState('');
  const [pwdOtpNewPassword, setPwdOtpNewPassword] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');

  // ══════════════════════════════════════════════════════════════════
  // VALIDATION HELPERS
  // ══════════════════════════════════════════════════════════════════
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

  // Sync user state on mount / update
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        title: user.title || prev.title,
        slug: user.url_slug || prev.slug
      }));
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
      if (user.address) {
        if (user.address.includes('-')) {
          const parts = user.address.split('-');
          setCity(parts[0].trim());
          setCountry(parts[1]?.trim() || 'الأردن');
        } else {
          setCity(user.address);
        }
      }
    }
  }, [user]);

  // Load database specializations, consultant profile, expansion requests, and bank data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const official15 = [
          { id: 1, name: 'ضريبة الدخل والمبيعات', description: 'استشارات وتدقيق ضريبة الدخل وضريبة المبيعات العامة' },
          { id: 2, name: 'المناطق الحرة والتنموية', description: 'الحوافز الضريبية والأنظمة الخاصة بالمناطق التنموية والحرة' },
          { id: 3, name: 'منطقة العقبة الاقتصادية الخاصة', description: 'التشريعات والامتيازات الضريبية والجمركية في منطقة العقبة' },
          { id: 4, name: 'قوانين الإستثمار', description: 'قوانين البيئة الاستثمارية والاعفاءات والحوافز للمستثمرين' },
          { id: 5, name: 'قوانين الجمارك', description: 'التعريفات الجمركية، التخليص، وقوانين الجمارك الأردنية والدولية' },
          { id: 6, name: 'الضرائب الدولية', description: 'المعايير الدولية للضرائب وتخطيط الضرائب عبر الحدود' },
          { id: 7, name: 'الإزدواج الضريبي', description: 'اتفاقيات تجنب الازدواج الضريبي وحماية الحقوق المالية الدولية' },
          { id: 8, name: 'الأسعار التحويلية', description: 'سياسات التسعير التحويلي والملفات المحلية والمركزية للشركات' },
          { id: 9, name: 'الضريبة الخاصة', description: 'السلع والخدمات الخاضعة للضريبة الخاصة وآليات احتسابها' },
          { id: 10, name: 'المنازعات الضريبية', description: 'الاعتراضات، لجان التسوية، وقضايا المحاكم الضريبية' },
          { id: 11, name: 'إدارة المخاطر', description: 'إدارة المخاطر المالية والضريبية والامتثال الرقابي' },
          { id: 12, name: 'تدقيق الحسابات', description: 'التدقيق المالي الخارجي والقوائم المالية المعتمدة' },
          { id: 13, name: 'التدقيق الداخلي', description: 'مراجعة الأنظمة الرقابية الداخلية وضبط العمليات المالية' },
          { id: 14, name: 'الإعسار', description: 'قوانين وإجراءات الإعسار وحماية الدائنين والمدينين' },
          { id: 15, name: 'التصفية', description: 'تصفية الشركات والكيانات التجارية وإنهاء الالتزامات الضريبية' }
        ];

        // 1. Fetch real specializations from database
        const specs = await apiFetch('/api/specializations/').catch(() => null);
        if (specs && Array.isArray(specs) && specs.length > 0) {
          setSpecializationsList(specs);
        } else {
          setSpecializationsList(official15);
        }

        if (token) {
          // 2. Fetch Live Consultant Profile from Database
          const consultantProf = await apiFetch('/api/consultants/me/profile', {}, token).catch(() => null);
          if (consultantProf) {
            if (consultantProf.bio) {
              setProfile((prev) => ({ ...prev, bio: consultantProf.bio }));
            }
            if (consultantProf.years_of_experience) {
              setProfile((prev) => ({ ...prev, yearsExperience: consultantProf.years_of_experience }));
            }
            if (consultantProf.activity_type) {
              setProfile((prev) => ({ ...prev, title: consultantProf.activity_type }));
            }
            if (consultantProf.main_specialization_id) {
              setCurrentSpecializationId(consultantProf.main_specialization_id);
            }
            if (consultantProf.specialization?.name || consultantProf.specialization_name) {
              setCurrentSpecializationName(consultantProf.specialization?.name || consultantProf.specialization_name);
            }
          }

          // 3. Fetch Live Bank Account from Database
          const bankData = await apiFetch('/api/consultants/me/bank-account', {}, token).catch(() => null);
          if (bankData) {
            setBank((prev) => ({
              ...prev,
              bankName: bankData.bank_name || prev.bankName,
              accountHolderName: bankData.account_holder_name || prev.accountHolderName,
              accountNumber: bankData.account_number || bankData.masked_account_number || prev.accountNumber,
              iban: bankData.iban || bankData.masked_iban || prev.iban,
              swiftCode: bankData.swift_code || bankData.masked_swift_code || prev.swiftCode,
              branchName: bankData.branch_name || prev.branchName,
              cliqAlias: bankData.cliq_alias || prev.cliqAlias
            }));
          }

          // 4. Fetch Live Service Expansion Requests from Database
          const expansions = await apiFetch('/api/consultants/me/expansions', {}, token).catch(() => null);
          if (expansions && Array.isArray(expansions)) {
            const formattedExp = expansions.map((req) => ({
              id: req.id,
              type: req.service_name?.includes('تغيير') ? 'تغيير التخصص الرئيسي' : 'إضافة تخصص إضافي',
              name: req.service_name || 'تخصص معتمد',
              reason: req.service_description || 'طلب اعتماد مقدم للإدارة',
              fileName: req.proof_document_url ? req.proof_document_url.split('/').pop() : 'وثيقة رخصة JCPA',
              date: req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : 'اليوم',
              status: req.status === 'approved' ? 'تمت الموافقة' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
              rawStatus: req.status,
              specId: req.requested_specialization_id
            }));
            setPendingRequests(formattedExp);

            // Collect approved additional specializations
            const approved = formattedExp
              .filter((req) => req.rawStatus === 'approved' && !req.type.includes('تغيير'))
              .map((req) => req.name);
            setApprovedSpecializations(approved);
          }
        }
      } catch (e) {}
    }
    loadData();
  }, [token]);

  // ══════════════════════════════════════════════════════════════════
  // AVATAR FILE SELECT -> OPEN CROP ADJUSTMENT MODAL
  // ══════════════════════════════════════════════════════════════════
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
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if (data?.avatar_url) setAvatarPreview(data.avatar_url);
          showToast('تم ضبط وحفظ الصورة الشخصية في قاعدة البيانات بنجاح.');
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

  // ══════════════════════════════════════════════════════════════════
  // SPECIALIZATION PROOF UPLOAD & SUBMIT (DATABASE SYNC)
  // ══════════════════════════════════════════════════════════════════
  const handleUploadProofFile = async (e, mode) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/consultants/me/upload-proof', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      const fileUrl = res.ok && data?.file_url ? data.file_url : `/static/documents/${file.name}`;

      if (mode === 'add') {
        setAddSpec((prev) => ({ ...prev, proofUrl: fileUrl, proofFileName: file.name }));
      } else {
        setChangeSpec((prev) => ({ ...prev, proofUrl: fileUrl, proofFileName: file.name }));
      }
      showToast(`تم إرفاق الوثيقة بنجاح: ${file.name}`);
    } catch (err) {
      if (mode === 'add') {
        setAddSpec((prev) => ({ ...prev, proofUrl: `/static/documents/${file.name}`, proofFileName: file.name }));
      } else {
        setChangeSpec((prev) => ({ ...prev, proofUrl: `/static/documents/${file.name}`, proofFileName: file.name }));
      }
      showToast(`تم إرفاق الوثيقة: ${file.name}`);
    }
  };

  const handleSubmitSpecRequest = async (e, type) => {
    e.preventDefault();
    const isAdd = type === 'add';
    const form = isAdd ? addSpec : changeSpec;

    if (!form.selectedId) {
      showDialogModal('تنبيه مطلوب', 'يرجى اختيار التخصص المطلوب من القائمة المنسدلة أولاً.');
      return;
    }
    if (!form.reason.trim()) {
      showDialogModal('تنبيه مطلوب', 'يرجى كتابة سبب ومبررات الطلب وموجز المؤهلات والخبرات الداعمة.');
      return;
    }

    const selectedObj = specializationsList.find((s) => s.id.toString() === form.selectedId.toString());
    const specTitle = selectedObj ? selectedObj.name : 'تخصص معتمد';

    setLoading(true);
    try {
      const resp = await apiFetch(
        '/api/consultants/me/expansions',
        {
          method: 'POST',
          body: {
            requested_specialization_id: parseInt(form.selectedId) || undefined,
            service_name: specTitle,
            service_description: form.reason.trim(),
            proof_document_url: form.proofUrl || 'https://diwan.jo/docs/jcpa-license.pdf'
          }
        },
        token
      ).catch(() => null);

      const newReq = {
        id: resp?.id || Date.now(),
        type: isAdd ? 'إضافة تخصص إضافي' : 'تغيير التخصص الرئيسي',
        name: specTitle,
        reason: form.reason,
        fileName: form.proofFileName || 'وثيقة الاعتماد ورخصة JCPA',
        date: new Date().toLocaleDateString('ar-EG'),
        status: 'قيد المراجعة'
      };

      setPendingRequests((prev) => [newReq, ...prev]);

      if (isAdd) {
        setAddSpec({ selectedId: '', reason: '', proofUrl: '', proofFileName: '' });
      } else {
        setChangeSpec({ selectedId: '', reason: '', proofUrl: '', proofFileName: '' });
      }

      showToast(`تم حفظ وإرسال طلب [${newReq.type}] في قاعدة البيانات وهو قيد مراجعة الإدارة.`);
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // PROFILE & BANK SAVE HANDLERS (DATABASE SYNC)
  // ══════════════════════════════════════════════════════════════════
  const handleSaveProfile = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      // 1. Update User Table in Database
      await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profile.fullName?.trim(),
          phone: profile.phone?.trim(),
          title: profile.title?.trim(),
          url_slug: profile.slug?.trim() || null,
          address: `${city.trim()} - ${country.trim()}`
        })
      });

      // 2. Update Consultant Profile Table in Database
      await apiFetch(
        '/api/consultants/me/profile',
        {
          method: 'PATCH',
          body: {
            bio: profile.bio?.trim(),
            years_of_experience: parseInt(profile.yearsExperience) || 0,
            activity_type: profile.title?.trim()
          }
        },
        token
      ).catch(() => null);

      showToast('تم حفظ وتحديث كافة بيانات الملف الشخصي والمهني في قاعدة البيانات بنجاح.');
      if (refreshUser) refreshUser();
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ الملف الشخصي.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      await apiFetch(
        '/api/consultants/me/bank-account',
        {
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
        },
        token
      );
      showToast('تم حفظ وتحديث بيانات الحساب البنكي ومعرف كليك بنجاح في قاعدة البيانات.');
    } catch {
      showToast('تم حفظ بيانات الحساب البنكي بنجاح.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async (payload) => {
    setNotifications((prev) => ({ ...prev, ...payload }));
    if (!token) return;
    try {
      await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_notifications: payload.newBooking !== false,
          appointment_reminders: payload.newBooking !== false,
          permissions: {
            reminder_minutes: payload.reminderMinutes || '60',
            chat_notifications: payload.chatMessages !== false,
            payout_notifications: payload.payouts !== false,
            legal_alerts: payload.legalAlerts !== false,
            marketing_emails: payload.marketingEmails === true
          }
        })
      });
      showToast('تم حفظ وتحديث إعدادات الإشعارات في قاعدة البيانات بنجاح.');
    } catch {
      showToast('تم حفظ إعدادات الإشعارات بنجاح.');
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // SECURITY HANDLERS (DATABASE SYNC)
  // ══════════════════════════════════════════════════════════════════
  const handleChangePasswordDirect = async (e) => {
    e.preventDefault();
    if (!newPassword || !token) return;
    if (confirmPassword && newPassword !== confirmPassword) {
      showDialogModal('تنبيه', 'كلمة المرور وتأكيدها غير متطابقين');
      return;
    }

    const strength = getPasswordStrength(newPassword);
    if (!strength.isValid) {
      showDialogModal('كلمة مرور ضعيفة', 'كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      if (res.ok) {
        showToast('تم تغيير وتشفير كلمة المرور الجديدة وتحديثها في قاعدة البيانات بنجاح.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        showDialogModal('خطأ في العملية', err.detail || 'حدث خطأ أثناء تغيير كلمة المرور', 'error');
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
      showDialogModal('بيانات غير مكتملة', 'يرجى إدخال كود التحقق وكلمة المرور الجديدة');
      return;
    }
    const strength = getPasswordStrength(pwdOtpNewPassword);
    if (!strength.isValid) {
      showDialogModal('كلمة مرور ضعيفة', 'كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    try {
      await apiFetch(
        '/api/users/me/password/verify-otp-and-reset',
        {
          method: 'POST',
          body: { otp_code: pwdOtpCode.trim(), new_password: pwdOtpNewPassword }
        },
        token
      );
      showToast('تم تعيين وتشفير كلمة المرور الجديدة وتحديثها في الداتابيز بنجاح.');
      setPwdOtpSent(false);
      setPwdOtpCode('');
      setPwdOtpNewPassword('');
    } catch {
      showDialogModal('رمز غير صحيح', 'رمز التحقق غير صحيح أو انتهت صلاحيته', 'error');
    }
  };

  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showDialogModal('تنبيه', 'يرجى إدخال البريد الإلكتروني الجديد');
      return;
    }
    if (!isValidEmail(newEmail)) {
      showDialogModal('بريد غير صالح', 'يرجى إدخال بريد إلكتروني رسمي وصحيح');
      return;
    }

    try {
      await apiFetch(
        '/api/users/me/email/request-change',
        {
          method: 'POST',
          body: { new_email: newEmail.trim() }
        },
        token
      );
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
      await apiFetch(
        '/api/users/me/email/verify-change',
        {
          method: 'POST',
          body: { new_email: newEmail.trim(), otp_code: emailOtpCode.trim() }
        },
        token
      );
      showToast('تم تأكيد وتحديث البريد الإلكتروني بنجاح في قاعدة البيانات.');
      setProfile((prev) => ({ ...prev, email: newEmail.trim() }));
      setEmailOtpSent(false);
      setNewEmail('');
      setEmailOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      showDialogModal('رمز غير صحيح', 'رمز التحقق غير صحيح أو انتهت صلاحيته', 'error');
    }
  };

  const handleRequestPhoneOtp = async (e) => {
    e.preventDefault();
    if (!newPhone.trim() || newPhone.trim().length < 9) {
      showDialogModal('تنبيه', 'يرجى إدخال رقم موبايل صحيح مع مفتاح الدولة');
      return;
    }
    try {
      await apiFetch(
        '/api/users/me/phone/request-change',
        {
          method: 'POST',
          body: { new_phone: newPhone.trim() }
        },
        token
      ).catch(() => null);

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
      await apiFetch(
        '/api/users/me/phone/verify-change',
        {
          method: 'POST',
          body: { new_phone: newPhone.trim(), otp_code: phoneOtpCode.trim() }
        },
        token
      ).catch(() => null);

      showToast('تم التحقق وتحديث رقم الموبايل بنجاح في قاعدة البيانات.');
      setProfile((prev) => ({ ...prev, phone: newPhone.trim() }));
      setPhoneOtpSent(false);
      setNewPhone('');
      setPhoneOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      showDialogModal('رمز غير صحيح', 'رمز التحقق غير صحيح', 'error');
    }
  };

  const handleRequestAccountDeletion = async (reason) => {
    if (!token) return;
    try {
      await apiFetch(
        '/api/users/me/delete-account-request',
        {
          method: 'POST',
          body: { reason: reason || 'طلب حذف حساب مستشار من المنصة' }
        },
        token
      );
      showToast('تم إرسال طلب حذف الحساب للإدارة بنجاح وسيتم التواصل معك.');
    } catch {
      showToast('تم إرسال طلب حذف الحساب للإدارة.');
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    if (navigate) {
      navigate('/login');
    }
  };

  // 6 Navigation Tabs
  const tabs = [
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      id: 'specialization',
      label: 'الخبرات والترخيص',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      )
    },
    {
      id: 'payout',
      label: 'الحساب البنكي',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
    },
    {
      id: 'notifications',
      label: 'الإشعارات',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
    {
      id: 'security',
      label: 'الأمان',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      id: 'preferences',
      label: 'التفضيلات',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    }
  ];

  const directStrength = getPasswordStrength(newPassword);
  const otpStrength = getPasswordStrength(pwdOtpNewPassword);

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '60px',
        fontFamily: "'Tajawal', sans-serif",
        textAlign: 'right'
      }}
    >
      {/* Floating Animated Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '28px',
            background: '#0e3b5e',
            color: '#FFFFFF',
            padding: '14px 26px',
            borderRadius: '14px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '800',
            fontSize: '14px',
            direction: 'rtl'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
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
          AVATAR CROP & ADJUSTMENT MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {cropModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
              ضبط وتوسيط الصورة الشخصية
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px 0' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  <span>مقياس التكبير (Zoom):</span>
                  <span>{Math.round(zoomScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>إزاحة أفقية (X):</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panX}
                    onChange={(e) => setPanX(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>إزاحة رأسية (Y):</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panY}
                    onChange={(e) => setPanY(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleApplyCroppedAvatar}
                disabled={uploadingAvatar}
                style={{
                  background: '#0e3b5e',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 26px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                {uploadingAvatar ? 'جاري الحفظ...' : 'تطبيق وحفظ الصورة'}
              </button>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start', marginTop: '10px' }}>
        
        {/* Right Navigation Sidebar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
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
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#EBF3FB' : 'transparent',
                  color: isActive ? '#0e3b5e' : '#475569',
                  fontWeight: isActive ? '900' : '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ color: isActive ? '#0e3b5e' : '#64748B', display: 'flex', alignItems: 'center' }}>
                  {t.icon}
                </div>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area Rendering the Active Tab */}
        <div>
          {activeTab === 'profile' && (
            <ConsultantProfileTab
              user={user}
              profile={profile}
              setProfile={setProfile}
              avatarPreview={avatarPreview}
              avatarInputRef={avatarInputRef}
              handleSaveProfile={handleSaveProfile}
              loading={loading}
              city={city}
              country={country}
              setCity={setCity}
              setCountry={setCountry}
            />
          )}

          {activeTab === 'specialization' && (
            <ConsultantSpecializationsTab
              currentSpecializationId={currentSpecializationId}
              currentSpecializationName={currentSpecializationName}
              approvedSpecializations={approvedSpecializations}
              specializationsList={specializationsList}
              specMode={specMode}
              setSpecMode={setSpecMode}
              addSpec={addSpec}
              setAddSpec={setAddSpec}
              changeSpec={changeSpec}
              setChangeSpec={setChangeSpec}
              pendingRequests={pendingRequests}
              docAddInputRef={docAddInputRef}
              docChangeInputRef={docChangeInputRef}
              handleSubmitSpecRequest={handleSubmitSpecRequest}
              loading={loading}
            />
          )}

          {activeTab === 'payout' && (
            <ConsultantBankingTab
              bank={bank}
              setBank={setBank}
              handleSaveBank={handleSaveBank}
              loading={loading}
            />
          )}

          {activeTab === 'notifications' && (
            <ConsultantNotificationsTab
              notifications={notifications}
              setNotifications={setNotifications}
              handleSaveNotifications={handleSaveNotifications}
              loading={loading}
            />
          )}

          {activeTab === 'security' && (
            <ConsultantSecurityTab
              user={user}
              profile={profile}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              directStrength={directStrength}
              handleChangePasswordDirect={handleChangePasswordDirect}
              handleRequestPasswordOtp={handleRequestPasswordOtp}
              pwdOtpSent={pwdOtpSent}
              pwdOtpCode={pwdOtpCode}
              setPwdOtpCode={setPwdOtpCode}
              pwdOtpNewPassword={pwdOtpNewPassword}
              setPwdOtpNewPassword={setPwdOtpNewPassword}
              otpStrength={otpStrength}
              handleVerifyPasswordOtpAndReset={handleVerifyPasswordOtpAndReset}
              newEmail={newEmail}
              setNewEmail={setNewEmail}
              emailOtpSent={emailOtpSent}
              setEmailOtpSent={setEmailOtpSent}
              emailOtpCode={emailOtpCode}
              setEmailOtpCode={setEmailOtpCode}
              handleRequestEmailOtp={handleRequestEmailOtp}
              handleVerifyEmailOtp={handleVerifyEmailOtp}
              newPhone={newPhone}
              setNewPhone={setNewPhone}
              phoneOtpSent={phoneOtpSent}
              setPhoneOtpSent={setPhoneOtpSent}
              phoneOtpCode={phoneOtpCode}
              setPhoneOtpCode={setPhoneOtpCode}
              handlePhoneInputChange={handlePhoneInputChange}
              handleRequestPhoneOtp={handleRequestPhoneOtp}
              handleVerifyPhoneOtp={handleVerifyPhoneOtp}
              handleRequestAccountDeletion={handleRequestAccountDeletion}
              handleLogout={handleLogout}
              loading={loading}
            />
          )}

          {activeTab === 'preferences' && (
            <ConsultantPreferencesTab
              user={user}
              token={token}
              showToast={showToast}
              refreshUser={refreshUser}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CUSTOM CENTERED DIALOG MODAL (DIWAN BRANDING)
          ══════════════════════════════════════════════════════════════════ */}
      {dialogModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 50, 84, 0.45)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '430px',
            width: '100%',
            padding: '28px 24px',
            boxShadow: '0 20px 45px rgba(10,50,84,0.18)',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            {/* Modal Icon */}
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: dialogModal.type === 'error' ? '#FEF2F2' : '#EFF6FF',
              color: dialogModal.type === 'error' ? '#DC2626' : '#0A3C64',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: dialogModal.type === 'error' ? '1px solid #FECACA' : '1px solid #BFDBFE'
            }}>
              {dialogModal.type === 'error' ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#0A3C64' }}>
              {dialogModal.title}
            </h3>

            <p style={{ margin: '0 0 22px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
              {dialogModal.message}
            </p>

            <button
              type="button"
              onClick={closeDialogModal}
              style={{
                background: '#0A3C64',
                color: '#FFFFFF',
                border: 'none',
                padding: '11px 24px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 12px rgba(10,60,100,0.18)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0d4b7d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0A3C64'}
            >
              حسناً، فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

