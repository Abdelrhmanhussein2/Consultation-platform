import React, { useState, useEffect, useRef } from 'react';
import './AdminUsersPage.css';
import { getAdminUsers, createAdminUser, getPendingUsers, handleUserAction, getUserFullProfile } from '../services/adminApi';
import ModernSelect from '../../components/ModernSelect';

const LEGAL_OPTIONS = [
  { value: '', label: 'الصفة القانونية' },
  { value: 'فرد', label: 'فرد' },
  { value: 'مؤسسة فردية', label: 'مؤسسة فردية' },
  { value: 'شركة ذات مسؤولية محدودة', label: 'شركة ذات مسؤولية محدودة' },
  { value: 'شركة تضامن', label: 'شركة تضامن' },
  { value: 'شركة توصية بسيطة', label: 'شركة توصية بسيطة' },
  { value: 'شركة مساهمة عامة', label: 'شركة مساهمة عامة' },
  { value: 'شركة مساهمة خاصة', label: 'شركة مساهمة خاصة' },
  { value: 'جامعة', label: 'جامعة' },
  { value: 'أكاديمي وباحث', label: 'أكاديمي وباحث' },
  { value: 'جمعية ومنظمة', label: 'جمعية ومنظمة' },
  { value: 'جهة حكومية', label: 'جهة حكومية' },
  { value: 'هيئة عامة', label: 'هيئة عامة' },
  { value: 'هيئة خاصة', label: 'هيئة خاصة' }
];

const SECTOR_OPTIONS = [
  { value: '', label: 'القطاع' },
  { value: 'خدمات', label: 'خدمات' },
  { value: 'تجارة', label: 'تجارة' },
  { value: 'صناعة', label: 'صناعة' },
  { value: 'مقاولات', label: 'مقاولات' },
  { value: 'زراعة', label: 'زراعة' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'حالة الحساب' },
  { value: 'نشط', label: 'نشط' },
  { value: 'غير نشط', label: 'غير نشط' }
];

const SORT_OPTIONS = [
  { value: 'active', label: 'الأكثر نشاطًا' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'consult', label: 'الأكثر استشارات' },
  { value: 'name', label: 'الاسم أ–ي' }
];

// ══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE TOPIC QUESTIONS DICTIONARY
// ══════════════════════════════════════════════════════════════════════════
const TOPIC_DATA = {
  'ضريبة الدخل': ['الإقرارات الضريبية السنوية', 'المصاريف المقبولة ضريبيًا', 'اقتطاعات الموظفين', 'الخسائر المدورة'],
  'ضريبة المبيعات': ['التسجيل في ضريبة المبيعات', 'الإعفاءات', 'رد الضريبة', 'فواتير المبيعات'],
  'الفوترة الإلكترونية': ['ربط نظام الفوترة', 'الفواتير المرتجعة', 'تصحيح الفاتورة', 'متطلبات رقم الفاتورة'],
  'الاعتراضات الضريبية': ['مدة الاعتراض', 'إجراءات التسوية', 'الوثائق المؤيدة', 'طلبات إعادة النظر']
};

const TOPIC_QUESTIONS = {
  'الإقرارات الضريبية السنوية': ['ما آخر موعد لتقديم الإقرار؟', 'كيف يتم تعديل إقرار سبق تقديمه؟', 'ما المستندات الواجب الاحتفاظ بها؟'],
  'المصاريف المقبولة ضريبيًا': ['هل مصاريف السفر مقبولة ضريبيًا؟', 'ما شروط قبول مصروف التسويق؟', 'كيف أوثق مصاريف السيارة؟', 'هل المخصصات تعتبر مصروفًا مقبولًا؟', 'ما معالجة المصاريف المدفوعة مقدمًا؟'],
  'اقتطاعات الموظفين': ['كيف يتم احتساب الاقتطاع الشهري؟', 'متى يتم توريد اقتطاعات الرواتب؟', 'كيف تعالج مكافآت الموظفين؟'],
  'الخسائر المدورة': ['كم سنة يمكن تدوير الخسائر؟', 'هل تنتقل الخسائر عند إعادة الهيكلة؟', 'ما المستندات المؤيدة للخسارة؟'],
  'التسجيل في ضريبة المبيعات': ['متى يصبح التسجيل إلزاميًا؟', 'كيف يحتسب حد التسجيل؟', 'هل يجوز التسجيل الاختياري؟'],
  'الإعفاءات': ['ما السلع والخدمات المعفاة؟', 'كيف أوثق معاملة معفاة؟', 'هل الإعفاء يشمل المدخلات؟'],
  'رد الضريبة': ['متى يحق طلب الرد؟', 'ما الوثائق المطلوبة لرد الضريبة؟', 'كم تستغرق إجراءات الرد؟'],
  'فواتير المبيعات': ['ما البيانات الإلزامية في الفاتورة؟', 'كيف تعالج فاتورة مرتجعة؟', 'ما الفرق بين الفاتورة الضريبية والمبسطة؟'],
  'ربط نظام الفوترة': ['ما متطلبات الربط؟', 'هل أحتاج API خاص؟', 'كيف أختبر الفواتير قبل الإرسال؟'],
  'الفواتير المرتجعة': ['كيف أصدر إشعار دائن؟', 'هل يلزم ربطه بالفاتورة الأصلية؟', 'ما أثر المرتجع على الضريبة؟'],
  'تصحيح الفاتورة': ['هل يجوز تعديل فاتورة بعد إصدارها؟', 'متى أستخدم إشعار دائن؟', 'كيف أوثق سبب التصحيح؟'],
  'متطلبات رقم الفاتورة': ['هل يجب أن يكون الرقم متسلسلًا؟', 'هل يمكن وجود أكثر من سلسلة؟', 'ماذا يحدث عند فقدان رقم؟'],
  'مدة الاعتراض': ['من أي تاريخ تبدأ مدة الاعتراض؟', 'ماذا يحدث إذا انتهت المدة؟', 'هل تقبل الأعذار؟'],
  'إجراءات التسوية': ['ما مراحل التسوية؟', 'من يملك صلاحية التوقيع؟', 'هل التسوية توقف إجراءات التحصيل؟'],
  'الوثائق المؤيدة': ['ما الوثائق الأساسية للاعتراض؟', 'هل تقبل النسخ الإلكترونية؟', 'كيف يتم ترتيب المرفقات؟'],
  'طلبات إعادة النظر': ['متى يمكن تقديم طلب إعادة نظر؟', 'ما الفرق عن الاعتراض؟', 'ما المدة المتوقعة للبت؟']
};

export default function AdminUsersPage({ navigate, currentPath, initialTab }) {
  // Navigation & Tab state
  const isPendingUrl = (currentPath && (currentPath.includes('tab=pending') || currentPath.includes('/pending'))) || (typeof window !== 'undefined' && window.location.search.includes('tab=pending'));
  const [activeTab, setActiveTab] = useState(initialTab === 'pending' || isPendingUrl ? 'pending' : 'approved');

  // Master users list (Approved & Active)
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Pending verification users list (100% Real PostgreSQL Data)
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('يرجى استكمال الوثائق والبيانات الرسمية المطلوبة لتفعيل الحساب.');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [legalTopFilter, setLegalTopFilter] = useState('');
  const [sectorTopFilter, setSectorTopFilter] = useState('');
  const [statusTopFilter, setStatusTopFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('active');

  const [legalChecks, setLegalChecks] = useState([]);
  const [sectorChip, setSectorChip] = useState('');
  const [usageChecks, setUsageChecks] = useState([]);
  const [planChecks, setPlanChecks] = useState([]);

  // Profile overlay state
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState('overview');

  // Interactive Chart Tooltip State
  const [chartTooltip, setChartTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Modal Hierarchy Stack
  const [modalStack, setModalStack] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [loadingAddUser, setLoadingAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    legal: 'شركة ذات مسؤولية محدودة',
    entityType: 'company',
    companyName: '',
    taxNumber: '',
    sector: 'services'
  });

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.fullName.trim() || !newUserForm.email.trim() || !newUserForm.password) {
      alert('يرجى ملء الاسم الكامل، البريد الإلكتروني، وكلمة المرور.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newUserForm.email.trim())) {
      alert('يرجى إدخال بريد إلكتروني صحيح بالصيغة القياسية (مثال: name@company.jo).');
      return;
    }

    if (newUserForm.phone && newUserForm.phone.trim()) {
      const cleanDigits = newUserForm.phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 8 || cleanDigits.length > 15) {
        alert('يرجى إدخال رقم هاتف صحيح بالصيغة المعتمدة (مثال: 962795552140+ أو 0795552140).');
        return;
      }
    }

    const isStrong = newUserForm.password.length >= 8 &&
      /[A-Z]/.test(newUserForm.password) &&
      /[a-z]/.test(newUserForm.password) &&
      /[0-9]/.test(newUserForm.password) &&
      /[!@#$%^&*()_+\-=[\]{}|;:',.<>?~`]/.test(newUserForm.password);

    if (!isStrong) {
      alert('كلمة المرور يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    setLoadingAddUser(true);
    try {
      const payload = {
        full_name: newUserForm.fullName.trim(),
        email: newUserForm.email.trim().toLowerCase(),
        password: newUserForm.password,
        phone: newUserForm.phone.trim() || undefined,
        role: 'user',
        entity_type: newUserForm.entityType,
        company_name: newUserForm.companyName.trim() || undefined,
        tax_number: newUserForm.taxNumber.trim() || undefined,
        sector: newUserForm.sector
      };

      const res = await createAdminUser(payload);
      if (res && (res.id || res.email)) {
        const newCard = {
          id: res.id || `u_${Date.now()}`,
          name: res.full_name || res.company_name || payload.full_name,
          initial: (res.full_name || payload.full_name).charAt(0),
          legal: newUserForm.legal,
          sector: newUserForm.sector === 'services' ? 'خدمات' : newUserForm.sector === 'trade' ? 'تجارة' : newUserForm.sector === 'industry' ? 'صناعة' : newUserForm.sector === 'contracting' ? 'مقاولات' : 'زراعة',
          activity: newUserForm.companyName || 'استشارات أعمال وخدمات مهنية',
          status: 'نشط',
          online: false,
          plan: 'الباقة الأساسية',
          consult: 0,
          success: 0,
          video: 0,
          chat: 0,
          tickets: 0,
          usage: 'منخفض',
          created: 100,
          last: 'الآن',
          tax: newUserForm.taxNumber || '—',
          national: '—',
          reg: '—',
          email: res.email || payload.email,
          phone: res.phone || payload.phone || '—',
          city: 'عمّان',
          joined: 'اليوم'
        };

        setUsersList(prev => [newCard, ...prev]);
        setSuccessModal({
          title: 'تمت إضافة وتفعيل المستخدم بنجاح!',
          name: payload.full_name,
          email: payload.email,
          role: 'عميل / مستخدم جديد'
        });
        setAddUserModalOpen(false);
        setNewUserForm({
          fullName: '',
          email: '',
          password: '',
          phone: '',
          legal: 'شركة ذات مسؤولية محدودة',
          entityType: 'company',
          companyName: '',
          taxNumber: '',
          sector: 'services'
        });
      } else {
        alert(res?.detail || 'حدث خطأ أثناء إضافة المستخدم');
      }
    } catch (err) {
      alert(err.message || 'خطأ في الاتصال بالخادم أثناء إضافة المستخدم.');
    } finally {
      setLoadingAddUser(false);
    }
  };

  const mainScrollRef = useRef(null);

  // Load Approved / Active Platform Users
  const loadBackendUsers = async () => {
    try {
      const data = await getAdminUsers({ role: 'user', limit: 100 });
      if (data && Array.isArray(data)) {
        const mapLegal = (u) => {
          if (u.legal_form) {
            const map = {
              individual: 'فرد',
              sole_proprietorship: 'مؤسسة فردية',
              llc: 'شركة ذات مسؤولية محدودة',
              general_partnership: 'شركة تضامن',
              limited_partnership: 'شركة توصية بسيطة',
              public_joint_stock: 'شركة مساهمة عامة',
              private_joint_stock: 'شركة مساهمة خاصة',
              university: 'جامعة',
              researcher: 'أكاديمي وباحث',
              ngo: 'جمعية ومنظمة',
              government: 'جهة حكومية',
              public_authority: 'هيئة عامة',
              private_authority: 'هيئة خاصة'
            };
            if (map[u.legal_form]) return map[u.legal_form];
          }
          if (u.entity_type === 'company') return 'شركة ذات مسؤولية محدودة';
          if (u.entity_type === 'researcher') return 'أكاديمي وباحث';
          return 'فرد';
        };

        const mapSector = (u) => {
          const map = {
            services: 'خدمات',
            trade: 'تجارة',
            industry: 'صناعة',
            contracting: 'مقاولات',
            agriculture: 'زراعة'
          };
          return map[u.sector] || u.sector || 'خدمات';
        };

        const apiFormatted = data.map((u, i) => ({
          id: u.id || `u_api_${i + 1}`,
          name: u.full_name || u.company_name || 'مستخدم المنصة',
          initial: (u.full_name || u.company_name || 'م').charAt(0),
          legal: mapLegal(u),
          sector: mapSector(u),
          status: u.is_active ? 'نشط' : 'معطّل',
          online: false,
          plan: 'الباقة الأساسية',
          consult: Number(u.sessions_count ?? u.total_consultations ?? u.total_sessions ?? 0),
          success: Number(u.completed_consultations ?? u.completed_sessions ?? u.sessions_count ?? 0),
          video: Number(u.video_sessions ?? 0),
          chat: Number(u.chat_sessions ?? 0),
          tickets: Number(u.tickets_count ?? 0),
          usage: (u.sessions_count || u.total_consultations || 0) > 10 ? 'مرتفع' : (u.sessions_count || u.total_consultations || 0) > 3 ? 'متوسط' : (u.sessions_count || u.total_consultations || 0) > 0 ? 'منخفض' : 'لم يستخدم بعد',
          created: 100 - i,
          last: u.last_login || (u.created_at ? new Date(u.created_at).toLocaleDateString('ar-JO') : '—'),
          tax: u.tax_number || '—',
          national: u.national_id || '—',
          reg: u.commercial_register || '—',
          email: u.email || '—',
          phone: u.phone || '—',
          city: u.address || 'عمّان',
          joined: u.created_at ? new Date(u.created_at).toLocaleDateString('ar-JO') : '—',
          raw: u
        }));
        setUsersList(apiFormatted);
        setFilteredUsers(apiFormatted);
      }
    } catch (err) {
      console.warn('Backend users load error:', err);
    }
  };

  // Load Pending Client Verification Requests (100% Real from PostgreSQL)
  const loadPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const data = await getPendingUsers();
      if (Array.isArray(data)) {
        setPendingUsers(data);
      }
    } catch (err) {
      console.warn('Pending users load error:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Sync users with backend API on mount + reactive auto-refresh
  useEffect(() => {
    loadBackendUsers();
    loadPendingUsers();

    const handleDataUpdate = () => {
      loadBackendUsers();
      loadPendingUsers();
    };

    window.addEventListener('admin_data_updated', handleDataUpdate);
    return () => window.removeEventListener('admin_data_updated', handleDataUpdate);
  }, []);

  // Update tab if currentPath changes
  useEffect(() => {
    if (currentPath && (currentPath.includes('tab=pending') || currentPath.includes('/pending'))) {
      setActiveTab('pending');
    }
  }, [currentPath]);

  // Handle Approve User Action
  const handleApproveUser = async (u) => {
    const confirmName = u.full_name || u.company_name || u.email;
    if (!window.confirm(`هل أنت متأكد من رغبتك في اعتماد وتفعيل حساب "${confirmName}"؟`)) {
      return;
    }
    setActionLoadingId(u.id);
    try {
      await handleUserAction(u.id, 'approve');
      showToast(`تم اعتماد وتفعيل حساب ${confirmName} بنجاح! 🎉`);
      await Promise.all([loadPendingUsers(), loadBackendUsers()]);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء اعتماد الحساب');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject User Action
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    setActionLoadingId(rejectingUser.id);
    try {
      await handleUserAction(rejectingUser.id, 'reject', rejectReason);
      showToast(`تم رفض طلب انضمام ${rejectingUser.full_name || rejectingUser.email}`);
      setRejectingUser(null);
      await Promise.all([loadPendingUsers(), loadBackendUsers()]);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء رفض الطلب');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Engine
  useEffect(() => {
    let q = searchInput.trim().toLowerCase();
    let data = usersList.filter(u => {
      const str = (u.name + (u.tax || '') + (u.national || '') + (u.reg || '') + (u.activity || '') + (u.email || '')).toLowerCase();
      const matchSearch = !q || str.includes(q);

      const matchLegalTop = !legalTopFilter || u.legal === legalTopFilter;
      const matchSectorTop = !sectorTopFilter || u.sector === sectorTopFilter;
      const matchStatusTop = !statusTopFilter || u.status === statusTopFilter;

      const matchLegalSide = legalChecks.length === 0 || legalChecks.some(pattern => {
        return pattern.split('|').some(part => u.legal.includes(part));
      });

      const matchSectorSide = !sectorChip || u.sector === sectorChip;
      const matchUsageSide = usageChecks.length === 0 || usageChecks.includes(u.usage);
      const matchPlanSide = planChecks.length === 0 || planChecks.includes(u.plan);

      return matchSearch && matchLegalTop && matchSectorTop && matchStatusTop && matchLegalSide && matchSectorSide && matchUsageSide && matchPlanSide;
    });

    data = [...data].sort((a, b) => {
      if (sortFilter === 'consult') return b.consult - a.consult;
      if (sortFilter === 'newest') return b.created - a.created;
      if (sortFilter === 'oldest') return a.created - b.created;
      if (sortFilter === 'name') return a.name.localeCompare(b.name, 'ar');
      return (Number(b.online) - Number(a.online)) || (b.consult - a.consult);
    });

    setFilteredUsers(data);
    setCurrentPage(1);
  }, [searchInput, legalTopFilter, sectorTopFilter, statusTopFilter, sortFilter, legalChecks, sectorChip, usageChecks, planChecks, usersList]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setLegalTopFilter('');
    setSectorTopFilter('');
    setStatusTopFilter('');
    setSortFilter('active');
    setLegalChecks([]);
    setSectorChip('');
    setUsageChecks([]);
    setPlanChecks([]);
    setCurrentPage(1);
    showToast('تم مسح جميع الفلاتر');
  };

  const handleLegalCheckbox = (val) => {
    setLegalChecks(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const handleUsageCheckbox = (val) => {
    setUsageChecks(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const handlePlanCheckbox = (val) => {
    setPlanChecks(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const displayedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Open Profile (Loads 100% Real Live Database Data)
  const openProfile = async (user) => {
    setActiveProfile(user);
    setActiveProfileTab('overview');
    document.body.style.overflow = 'hidden';

    try {
      if (user.id && !String(user.id).startsWith('u_api_') && !String(user.id).startsWith('u_')) {
        const fullData = await getUserFullProfile(user.id);
        if (fullData) {
          setActiveProfile(prev => ({
            ...prev,
            ...fullData,
            name: fullData.full_name || fullData.company_name || prev.name,
            tax: fullData.tax_number || prev.tax,
            national: fullData.national_id || prev.national,
            consult: fullData.stats?.total_consultations ?? 0,
            success: fullData.stats?.completed_consultations ?? 0,
            video: fullData.stats?.video_sessions ?? 0,
            chat: fullData.stats?.chat_sessions ?? 0,
            tickets: fullData.stats?.tickets_count ?? 0,
            topics: fullData.topics || [],
            total_topic_signals: fullData.total_topic_signals || 0,
            stats: fullData.stats || null,
            documents: fullData.documents || [],
            appointments: fullData.appointments || [],
            subscription: fullData.subscription || null,
            ticketsList: fullData.tickets || [],
            logsList: fullData.logs || [],
            online: fullData.is_online ?? false,
            last: fullData.last_login || prev.last
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch full user profile details:', err);
    }
  };

  const closeProfile = () => {
    setActiveProfile(null);
    setModalStack([]);
    document.body.style.overflow = '';
  };

  // Profile Scroll Tab Jump
  const scrollToSection = (secId) => {
    setActiveProfileTab(secId);
    if (!mainScrollRef.current) return;
    const target = document.getElementById(`sec_${secId}`);
    if (target) {
      const topOffset = secId === 'overview' ? 0 : target.offsetTop - mainScrollRef.current.offsetTop - 10;
      mainScrollRef.current.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  // Scroll spy
  const handleMainScroll = () => {
    if (!mainScrollRef.current) return;
    const scroller = mainScrollRef.current;
    const secIds = ['overview', 'legal', 'docs', 'members', 'interests', 'activity'];
    for (const id of secIds) {
      const el = document.getElementById(`sec_${id}`);
      if (el && scroller.scrollTop >= el.offsetTop - scroller.offsetTop - 50) {
        setActiveProfileTab(id);
      }
    }
  };

  // Modal Stack Helpers
  const openModal = (title, subtitle, body, wide = false, eyebrow = 'تفاصيل الحساب') => {
    setModalStack([{ title, subtitle, body, wide, eyebrow }]);
  };

  const pushModal = (title, subtitle, body, wide = false, eyebrow = 'تفاصيل إضافية') => {
    setModalStack(prev => [...prev, { title, subtitle, body, wide, eyebrow }]);
  };

  const modalGoBack = () => {
    setModalStack(prev => prev.length > 1 ? prev.slice(0, prev.length - 1) : []);
  };

  const closeModal = () => {
    setModalStack([]);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODAL DRILLDOWN CONTENT GENERATORS (100% PROTOTYPE SPEC)
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenLegalDetail = (type, u) => {
    const map = {
      national: ['الرقم الوطني للمنشأة', 'تفاصيل بيانات التعريف القانونية'],
      register: ['السجل التجاري', 'بيانات السجل التجاري والوثيقة المرفقة'],
      tax: ['التسجيل الضريبي', 'الرقم الضريبي وشهادة التسجيل']
    };
    const meta = map[type] || ['البيانات القانونية', 'بيانات المنشأة المعتمدة'];

    openModal(
      meta[0],
      meta[1],
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>الاسم</small><b>{u.name}</b></div>
          <div className="modal-box"><small>الصفة القانونية</small><b>{u.legal}</b></div>
          <div className="modal-box"><small>الرقم الوطني</small><b>{u.national}</b></div>
          <div className="modal-box"><small>السجل التجاري</small><b>{u.reg}</b></div>
          <div className="modal-box"><small>الرقم الضريبي</small><b>{u.tax}</b></div>
          <div className="modal-box"><small>حالة التحقق</small><b style={{ color: 'var(--admin-green)' }}>موثّق</b></div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenDocument(type === 'tax' ? 'شهادة التسجيل الضريبي' : 'السجل التجاري', u, type)}>
            عرض الوثيقة
          </button>
        </div>
      </div>,
      false,
      'البيانات القانونية'
    );
  };

  const handleOpenDocument = (docTitle, u, docType) => {
    openModal(
      docTitle,
      `وثيقة موثقة ضمن ملف ${u.name}`,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>نوع الوثيقة</small><b>{docTitle}</b></div>
          <div className="modal-box"><small>حالة التحقق</small><b style={{ color: 'var(--admin-green)' }}>موثّقة</b></div>
          <div className="modal-box"><small>آخر تحديث</small><b>14 مايو 2026</b></div>
          <div className="modal-box"><small>الملف</small><b>PDF · 1.8 MB</b></div>
        </div>
        <div style={{ marginTop: '16px', border: '1px dashed var(--admin-line)', borderRadius: '16px', padding: '28px', textAlign: 'center', background: '#F8FAFB', color: 'var(--admin-muted)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
          <b style={{ display: 'block', color: 'var(--admin-navy)', fontSize: '13px' }}>معاينة الوثيقة داخل المنصة</b>
          <small style={{ display: 'block', marginTop: '4px' }}>هذه معاينة نموذجية للوثيقة المرفقة.</small>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleDownloadDoc(docTitle, u.name)}>تنزيل الوثيقة</button>
          <button onClick={() => showToast('تم فتح المعاينة الكاملة')}>فتح المعاينة الكاملة</button>
        </div>
      </div>,
      true,
      'الوثائق والتحقق'
    );
  };

  const handleDownloadDoc = (title, clientName) => {
    const blob = new Blob([`${title}\n${clientName}\nنسخة نموذجية من الوثيقة ضمن Prototype ديوان.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('بدأ تنزيل الوثيقة');
  };

  const handleOpenMember = (name, email, role) => {
    openModal(
      name,
      `${role} · ${email}`,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>البريد الإلكتروني</small><b>{email}</b></div>
          <div className="modal-box"><small>الدور</small><b>{role}</b></div>
          <div className="modal-box"><small>آخر دخول</small><b>{name === 'محمد العلي' ? 'منذ 6 دقائق' : name === 'سارة الخطيب' ? 'أمس' : 'منذ 3 أيام'}</b></div>
          <div className="modal-box"><small>حالة الحساب</small><b style={{ color: 'var(--admin-green)' }}>نشط</b></div>
        </div>
        <div className="modal-section">
          <h4>الصلاحيات الفعلية — للعرض فقط</h4>
          <div className="permission-grid">
            {[
              { label: 'عرض الاستشارات', active: true },
              { label: 'حجز استشارة', active: true },
              { label: 'الفوترة والمدفوعات', active: role !== 'عرض فقط' },
              { label: 'إدارة المستخدمين', active: role === 'مدير الحساب' },
              { label: 'تحميل الوثائق', active: true },
              { label: 'تعديل بيانات المنشأة', active: role === 'مدير الحساب' }
            ].map((p, i) => (
              <div key={i} className="permission">
                <span>{p.label}</span>
                <b className={p.active ? 'perm-on' : 'perm-off'}>{p.active ? 'مفعلة' : 'غير مفعلة'}</b>
              </div>
            ))}
          </div>
        </div>
      </div>,
      false,
      'عضو الحساب'
    );
  };

  const handleOpenTopic = (topic) => {
    const subtopics = TOPIC_DATA[topic] || [];
    openModal(
      topic,
      'الموضوعات الفرعية واهتمامات العميل داخل هذا المجال',
      <div className="modal-list">
        {subtopics.map((sub, i) => {
          const qs = TOPIC_QUESTIONS[sub] || [];
          return (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenTopicDetail(topic, sub, i)}>
              <div className="mi">📄</div>
              <div>
                <b>{sub}</b>
                <small>{qs.length} عمليات بحث · {i + 1} استشارات مرتبطة</small>
              </div>
              <span className="tag">عرض السجل</span>
            </div>
          );
        })}
      </div>,
      true,
      'الاهتمامات'
    );
  };

  const handleOpenTopicDetail = (topic, subtopic, index) => {
    const qs = TOPIC_QUESTIONS[subtopic] || ['سؤال مسجل داخل هذا الموضوع'];
    pushModal(
      subtopic,
      `${topic} · سجل البحث والأسئلة`,
      <div className="modal-list">
        {qs.map((q, i) => (
          <div key={i} className="modal-row clickable" onClick={() => handleOpenQuestionRecord(subtopic, q, i)}>
            <div className="mi">{i + 1}</div>
            <div>
              <b>{q}</b>
              <small>{i % 2 ? 'بحث داخل قاعدة المعرفة' : 'سؤال للمساعد الذكي'} · {24 - i * 3} أغسطس 2026</small>
            </div>
            <span className="tag">فتح السجل</span>
          </div>
        ))}
      </div>,
      true,
      'سجل الاهتمامات'
    );
  };

  const handleOpenQuestionRecord = (subtopic, question, index) => {
    pushModal(
      'سجل السؤال',
      subtopic,
      <div>
        <div className="modal-section">
          <h4>{question}</h4>
          <p>تم تسجيل هذا الاستعلام ضمن نشاط الحساب، مع حفظ مصدر البحث والنتيجة التي تم فتحها والوقت المرتبط به.</p>
        </div>
        <div className="modal-grid" style={{ marginTop: '12px' }}>
          <div className="modal-box"><small>نوع النشاط</small><b>{index % 2 ? 'بحث في المنصة' : 'سؤال للمساعد الذكي'}</b></div>
          <div className="modal-box"><small>التاريخ</small><b>{24 - index * 3} أغسطس 2026</b></div>
          <div className="modal-box"><small>النتائج المفتوحة</small><b>{2 + index}</b></div>
          <div className="modal-box"><small>الاستشارة المرتبطة</small><b>{index % 2 ? 'لا يوجد' : 'ضريبة الدخل'}</b></div>
        </div>
      </div>,
      false,
      'تفاصيل السجل'
    );
  };

  const handleOpenConsultations = (u, type) => {
    const count = type === 'all' ? u.consult : type === 'success' ? u.success : type === 'video' ? u.video : u.chat;
    const label = { all: 'جميع الاستشارات', success: 'الاستشارات الناجحة', video: 'مكالمات الفيديو', chat: 'المحادثات' }[type] || 'الاستشارات';
    const topics = ['ضريبة الدخل', 'الفوترة الإلكترونية', 'الاعتراضات الضريبية', 'ضريبة المبيعات', 'الاقتطاعات الضريبية', 'التسجيل الضريبي'];

    openModal(
      label,
      `${count} سجلًا مرتبطًا بـ ${u.name}`,
      <div className="modal-list">
        {Array.from({ length: count }, (_, i) => {
          const isVideo = type === 'video' ? true : type === 'chat' ? false : (i % 2 === 0);
          const failed = type === 'all' && i === count - 1 && u.success < u.consult;
          return (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenSession(`${topics[i % topics.length]}`, `${28 - (i % 24)} أغسطس`)}>
              <div className="mi">{isVideo ? '📹' : '💬'}</div>
              <div>
                <b>{topics[i % topics.length]}</b>
                <small>{isVideo ? 'فيديو' : 'محادثة'} · {failed ? 'غير مكتملة' : 'مكتملة بنجاح'}</small>
              </div>
              <span className="tag" style={{ background: failed ? 'var(--admin-redSoft)' : '', color: failed ? 'var(--admin-red)' : '' }}>
                {failed ? 'غير مكتملة' : 'فتح'}
              </span>
            </div>
          );
        })}
      </div>,
      true,
      'الاستشارات'
    );
  };

  const handleOpenSession = (title, date) => {
    openModal(
      title,
      `${date} · نشاط مرتبط بحساب العميل`,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>الحالة</small><b style={{ color: 'var(--admin-green)' }}>مكتملة</b></div>
          <div className="modal-box"><small>المدة</small><b>42 دقيقة</b></div>
          <div className="modal-box"><small>المستشار</small><b>أحمد العواملة</b></div>
          <div className="modal-box"><small>الموضوع</small><b>الالتزامات الضريبية</b></div>
        </div>
        <div className="modal-section" style={{ marginTop: '12px' }}>
          <h4>ملخص الجلسة</h4>
          <p>
            تمت مناقشة الأسئلة الرئيسية للعميل، الوثائق المطلوبة، والخطوات العملية التالية. يمكن فتح الملخص الكامل والتوصيات من داخل هذه النافذة.
          </p>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenSessionSummary(title, date)}>عرض الملخص الكامل</button>
          <button onClick={() => handleOpenRecommendations(title)}>التوصيات</button>
          <button onClick={() => handleOpenConversation(title)}>سجل المحادثة</button>
        </div>
      </div>,
      false,
      'تفاصيل الحساب'
    );
  };

  const handleOpenSessionSummary = (title, date) => {
    pushModal(
      'ملخص الجلسة الكامل',
      `${title} · ${date}`,
      <div>
        <div className="modal-section">
          <h4>ملخص تنفيذي</h4>
          <p>ناقش العميل الالتزامات الضريبية المرتبطة بالنشاط، آلية التوثيق، والمواعيد التي يجب الالتزام بها. تم تحديد الوثائق الناقصة والخطوات العملية المطلوبة بعد الجلسة.</p>
        </div>
        <div className="modal-section">
          <h4>النقاط الرئيسية</h4>
          <div className="timeline">
            <div className="timeline-item"><b>تحديد المعالجة الضريبية</b><small>تم توضيح الأساس النظامي والخيار الأنسب للحالة.</small></div>
            <div className="timeline-item"><b>الوثائق المطلوبة</b><small>السجل التجاري، شهادة التسجيل الضريبي، ومستندات العملية ذات الصلة.</small></div>
            <div className="timeline-item"><b>الخطوة التالية</b><small>استكمال الوثائق ثم مراجعة التطبيق قبل الإقرار.</small></div>
          </div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenRecommendations(title)}>عرض التوصيات</button>
          <button onClick={() => handleOpenConversation(title)}>سجل المحادثة</button>
        </div>
      </div>,
      true,
      'الاستشارة'
    );
  };

  const handleOpenRecommendations = (title) => {
    pushModal(
      'التوصيات',
      title,
      <div className="modal-list">
        <div className="modal-row">
          <div className="mi">1</div>
          <div><b>استكمال المستندات الناقصة</b><small>أولوية مرتفعة · قبل الإجراء التالي</small></div>
          <span className="tag">مطلوب</span>
        </div>
        <div className="modal-row">
          <div className="mi">2</div>
          <div><b>مراجعة المعالجة الضريبية</b><small>التأكد من التطبيق على الفترات المفتوحة</small></div>
          <span className="tag">متابعة</span>
        </div>
        <div className="modal-row">
          <div className="mi">3</div>
          <div><b>حفظ نسخة من الرأي والملخص</b><small>ضمن ملفات الحساب للاستفادة منها مستقبلًا</small></div>
          <span className="tag">موصى به</span>
        </div>
      </div>,
      true,
      'مخرجات الاستشارة'
    );
  };

  const handleOpenConversation = (title) => {
    pushModal(
      'سجل المحادثة',
      title,
      <div>
        <div className="modal-section">
          <h4>المحادثة المرتبطة</h4>
          <div className="timeline">
            <div className="timeline-item"><b>العميل</b><small>أرسل تفاصيل الحالة والوثائق الأولية.</small></div>
            <div className="timeline-item"><b>المستشار</b><small>طلب توضيحًا حول تاريخ التسجيل وطبيعة المعاملة.</small></div>
            <div className="timeline-item"><b>العميل</b><small>أرفق المستند المطلوب وتم استكمال المناقشة.</small></div>
          </div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => showToast('تم تجهيز السجل للتصدير')}>تصدير السجل</button>
        </div>
      </div>,
      true,
      'المحادثات'
    );
  };

  const handleOpenPlanUsage = (u) => {
    openModal(
      'تفاصيل الباقة والاستهلاك',
      u.plan,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>استهلاك النقاط</small><b>680 / 1000</b></div>
          <div className="modal-box"><small>تحميل الوثائق</small><b>24 / 40</b></div>
          <div className="modal-box"><small>طباعة الوثائق</small><b>13 / 25</b></div>
          <div className="modal-box"><small>الجلسات المجانية</small><b>2 / 3</b></div>
          <div className="modal-box"><small>بداية الدورة</small><b>14 أغسطس 2026</b></div>
          <div className="modal-box"><small>التجديد</small><b>14 سبتمبر 2026</b></div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={handleOpenPlanDetails}>إدارة الباقة</button>
          <button onClick={handleOpenUsageHistory}>سجل الاستهلاك</button>
        </div>
      </div>,
      false,
      'الاشتراك'
    );
  };

  const handleOpenPlanDetails = () => {
    pushModal(
      'إدارة الباقة',
      'باقة الأعمال · الدورة الحالية',
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>نوع الباقة</small><b>أعمال</b></div>
          <div className="modal-box"><small>الدورة</small><b>شهرية</b></div>
          <div className="modal-box"><small>بداية الدورة</small><b>14 أغسطس 2026</b></div>
          <div className="modal-box"><small>التجديد</small><b>14 سبتمبر 2026</b></div>
        </div>
        <div className="modal-section">
          <h4>الحصص الحالية</h4>
          <table className="mini-table">
            <thead>
              <tr><th>البند</th><th>المستخدم</th><th>الإجمالي</th><th>المتبقي</th></tr>
            </thead>
            <tbody>
              <tr><td>النقاط</td><td>680</td><td>1000</td><td>320</td></tr>
              <tr><td>تحميل الوثائق</td><td>24</td><td>40</td><td>16</td></tr>
              <tr><td>طباعة الوثائق</td><td>13</td><td>25</td><td>12</td></tr>
              <tr><td>جلسات مجانية</td><td>2</td><td>3</td><td>1</td></tr>
            </tbody>
          </table>
        </div>
      </div>,
      true,
      'الاشتراك'
    );
  };

  const handleOpenUsageHistory = () => {
    pushModal(
      'سجل الاستهلاك',
      'العمليات المحتسبة خلال دورة الباقة الحالية',
      <div>
        <div className="detail-tabs">
          <button className="active">الكل</button>
          <button>النقاط</button>
          <button>التحميل</button>
          <button>الطباعة</button>
          <button>الجلسات المجانية</button>
        </div>
        <table className="mini-table">
          <thead>
            <tr><th>التاريخ</th><th>النوع</th><th>العملية</th><th>الاستهلاك</th></tr>
          </thead>
          <tbody>
            <tr><td>29 أغسطس</td><td>نقاط</td><td>سؤال ضريبي للمساعد</td><td>12 نقطة</td></tr>
            <tr><td>28 أغسطس</td><td>تحميل</td><td>تعليمات ضريبية PDF</td><td>1 تحميل</td></tr>
            <tr><td>27 أغسطس</td><td>طباعة</td><td>صفحتان من تشريع</td><td>2 طباعة</td></tr>
            <tr><td>25 أغسطس</td><td>جلسة مجانية</td><td>استشارة فيديو</td><td>1 جلسة</td></tr>
          </tbody>
        </table>
      </div>,
      true,
      'الاستهلاك'
    );
  };

  const handleOpenUsage = (title, value) => {
    const key = title.includes('النقاط') ? 'points' : title.includes('تحميل') ? 'download' : title.includes('طباعة') ? 'print' : 'free';
    openModal(
      title,
      'تفاصيل الاستخدام خلال دورة الباقة الحالية',
      <div>
        <div className="modal-box"><small>الاستهلاك الحالي</small><b>{value}</b></div>
        <div className="modal-list" style={{ marginTop: '12px' }}>
          <div className="modal-row clickable" onClick={() => handleOpenUsagePeriod(key, 'week', title)}>
            <div className="mi">⏱️</div>
            <div><b>هذا الأسبوع</b><small>آخر تحديث اليوم، 12:42 م</small></div>
            <span className="tag">عرض التفاصيل</span>
          </div>
          <div className="modal-row clickable" onClick={() => handleOpenUsagePeriod(key, 'all', title)}>
            <div className="mi">📄</div>
            <div><b>السجل الكامل</b><small>جميع العمليات المرتبطة بهذا النوع من الاستخدام</small></div>
            <span className="tag">فتح</span>
          </div>
        </div>
      </div>,
      false,
      'الاستهلاك'
    );
  };

  const handleOpenUsagePeriod = (key, period, title) => {
    const samples = {
      points: ['سؤال للمساعد الذكي — معالجة مصروف مهني', 'تحليل مادة تشريعية — ضريبة الدخل', 'إنشاء ملخص استشارة', 'بحث متقدم في التشريعات', 'مقارنة نصين تشريعيين'],
      download: ['قانون ضريبة الدخل رقم 34 لسنة 2014', 'تعليمات الفوترة الإلكترونية', 'ملخص استشارة 28 أغسطس', 'قرار لجنة الاعتراضات', 'دليل التسجيل الضريبي'],
      print: ['المادة 12 — قانون ضريبة الدخل', 'ملخص استشارة الفيديو', 'تقرير النشاط الشهري', 'مقتطف تشريعي — الإعفاءات', 'كشف الاستهلاك'],
      free: ['جلسة مع أحمد العواملة — ضريبة الدخل', 'جلسة مع رنا الخطيب — الفوترة الإلكترونية']
    };
    const arr = samples[key] || [];
    const rows = (period === 'week' ? arr.slice(0, 3) : arr);

    pushModal(
      period === 'week' ? `استخدام هذا الأسبوع — ${title}` : `السجل الكامل — ${title}`,
      `${rows.length} عمليات نموذجية`,
      <div className="modal-list">
        {rows.map((x, i) => (
          <div key={i} className="modal-row clickable" onClick={() => handleOpenUsageRecord(key, i, x)}>
            <div className="mi">{i + 1}</div>
            <div>
              <b>{x}</b>
              <small>{28 - i * 2} أغسطس 2026 · {key === 'points' ? `${35 + i * 10} نقطة` : key === 'free' ? '45 دقيقة' : 'عملية مكتملة'}</small>
            </div>
            <span className="tag">تفاصيل</span>
          </div>
        ))}
      </div>,
      true,
      'الاستهلاك'
    );
  };

  const handleOpenUsageRecord = (key, index, title) => {
    pushModal(
      title,
      'تفاصيل عملية الاستخدام',
      <div className="modal-grid">
        <div className="modal-box"><small>التاريخ والوقت</small><b>{28 - index * 2} أغسطس 2026 · 10:{20 + index * 7}</b></div>
        <div className="modal-box"><small>النوع</small><b>{key === 'points' ? 'استهلاك نقاط' : key === 'download' ? 'تحميل وثيقة' : key === 'print' ? 'طباعة وثيقة' : 'جلسة مجانية'}</b></div>
        <div className="modal-box"><small>المنفذ</small><b>محمد العلي</b></div>
        <div className="modal-box"><small>الحالة</small><b style={{ color: 'var(--admin-green)' }}>مكتملة</b></div>
      </div>,
      false,
      'سجل العملية'
    );
  };

  const handleOpenChartMonth = (month, count) => {
    openModal(
      `نشاط ${month}`,
      `${count} جلسات / نشاطات مسجلة`,
      <div className="modal-list">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <div key={i} className="modal-row clickable" onClick={() => handleOpenSession(`جلسة ${i + 1} — ${i % 2 ? 'الفوترة الإلكترونية' : 'ضريبة الدخل'}`, `${month}`)}>
            <div className="mi">{i % 2 ? '💬' : '📹'}</div>
            <div>
              <b>{i % 2 ? 'محادثة استشارية' : 'جلسة فيديو'} — {i % 2 ? 'الفوترة الإلكترونية' : 'ضريبة الدخل'}</b>
              <small>مكتملة · {35 + i * 4} دقيقة</small>
            </div>
            <span className="tag">فتح</span>
          </div>
        ))}
      </div>,
      true,
      'النشاط الشهري'
    );
  };

  const handleOpenTickets = (u) => {
    const n = Math.max(0, u.tickets);
    const titles = ['مشكلة فاتورة', 'تحديث بيانات', 'استفسار عن الباقة', 'مشكلة تحميل وثيقة', 'استفسار عن جلسة'];
    openModal(
      'تذاكر الدعم',
      `${n} تذاكر مرتبطة بالحساب`,
      n > 0 ? (
        <div className="modal-list">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenTicketDetail(`#SUP-${1082 - i * 7}`, titles[i % titles.length], i === 0 ? 'قيد المتابعة' : 'مغلقة')}>
              <div className="mi">💬</div>
              <div>
                <b>#SUP-${1082 - i * 7} · {titles[i % titles.length]}</b>
                <small>آخر تحديث {i === 0 ? 'اليوم' : `${20 - i} أغسطس`}</small>
              </div>
              <span className="tag" style={{ background: i === 0 ? '' : 'var(--admin-greenSoft)', color: i === 0 ? '' : 'var(--admin-green)' }}>
                {i === 0 ? 'قيد المتابعة' : 'مغلقة'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="modal-section"><p>لا توجد تذاكر دعم مسجلة لهذا الحساب.</p></div>
      ),
      true,
      'الدعم الفني'
    );
  };

  const handleOpenTicketDetail = (id, title, status) => {
    openModal(
      `${id} · ${title}`,
      status,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>الحالة</small><b>{status}</b></div>
          <div className="modal-box"><small>الأولوية</small><b>متوسطة</b></div>
          <div className="modal-box"><small>تاريخ الفتح</small><b>26 أغسطس 2026</b></div>
          <div className="modal-box"><small>المسؤول</small><b>فريق دعم ديوان</b></div>
        </div>
        <div className="modal-section" style={{ marginTop: '14px' }}>
          <p>تفاصيل التذكرة والمراسلات والإجراءات المتخذة تظهر هنا داخل المنصة، دون الانتقال إلى صفحة خارجية.</p>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenTicketConversation(id)}>عرض المراسلات</button>
        </div>
      </div>,
      false,
      'الدعم الفني'
    );
  };

  const handleOpenTicketConversation = (id) => {
    pushModal(
      'مراسلات التذكرة',
      id,
      <div>
        <div className="timeline">
          <div className="timeline-item"><b>العميل · 26 أغسطس 09:18 ص</b><small>أواجه اختلافًا في قيمة الفاتورة الظاهرة في الحساب.</small></div>
          <div className="timeline-item"><b>الدعم · 26 أغسطس 10:02 ص</b><small>تم استلام الطلب والتحقق من تفاصيل الدفع.</small></div>
          <div className="timeline-item"><b>الدعم · اليوم 11:35 ص</b><small>التذكرة قيد المتابعة مع الفريق المالي.</small></div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => showToast('تمت إضافة رد تجريبي')}>إضافة رد</button>
        </div>
      </div>,
      true,
      'الدعم الفني'
    );
  };

  const handleOpenRatings = () => {
    openModal(
      'تقييم العميل للمنصة',
      'متوسط 4.8 من 5 عبر 6 تقييمات',
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>متوسط التقييم</small><b>4.8 / 5</b></div>
          <div className="modal-box"><small>عدد التقييمات</small><b>6</b></div>
        </div>
        <div className="modal-list" style={{ marginTop: '14px' }}>
          <div className="modal-row">
            <div className="mi">★</div>
            <div><b>5 / 5 — تجربة الاستشارة</b><small>“الخدمة واضحة وسريعة.”</small></div>
            <span className="tag">28 أغسطس</span>
          </div>
          <div className="modal-row">
            <div className="mi">★</div>
            <div><b>4 / 5 — تجربة المنصة</b><small>“سهولة جيدة في الوصول للوثائق.”</small></div>
            <span className="tag">19 أغسطس</span>
          </div>
        </div>
      </div>,
      false,
      'التقييمات'
    );
  };

  const handleOpenMembersSummary = () => {
    const members = [
      ['محمد العلي', 'm.ali@client.jo', 'مدير الحساب'],
      ['سارة الخطيب', 's.khatib@client.jo', 'استشارات وفوترة'],
      ['عمر النجار', 'o.najjar@client.jo', 'عرض فقط']
    ];
    openModal(
      'أعضاء الحساب',
      '3 مستخدمين مرتبطين بالحساب',
      <div>
        <div className="modal-list">
          {members.map((m, i) => (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenMember(m[0], m[1], m[2])}>
              <div className="mi">{m[0].split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div><b>{m[0]}</b><small>{m[1]} · {m[2]}</small></div>
              <span className="tag">عرض</span>
            </div>
          ))}
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => { closeModal(); scrollToSection('members'); }}>
            الانتقال إلى المستخدمين والصلاحيات
          </button>
        </div>
      </div>,
      true,
      'أعضاء الحساب'
    );
  };

  const handleOpenLastSeen = (u) => {
    openModal(
      'تفاصيل آخر ظهور',
      u.last,
      <div className="modal-grid">
        <div className="modal-box"><small>آخر تسجيل دخول</small><b>{u.last}</b></div>
        <div className="modal-box"><small>الجهاز</small><b>Windows · Chrome</b></div>
        <div className="modal-box"><small>الموقع التقريبي</small><b>عمّان، الأردن</b></div>
        <div className="modal-box"><small>حالة الجلسة</small><b style={{ color: 'var(--admin-green)' }}>{u.online ? 'متصل الآن' : 'غير متصل'}</b></div>
      </div>,
      false,
      'تفاصيل الدخول'
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN ACTIONS (100% PROTOTYPE MATCH)
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenAdminAction = (type, u) => {
    if (type === 'account') {
      openModal(
        'إدارة الحساب',
        u.name,
        <div>
          <div className="modal-section">
            <h4>لوحة إدارة الحساب</h4>
            <p>جميع إعدادات الحساب متاحة من هنا داخل المنصة.</p>
          </div>
          <div className="drill-modal-actions">
            <button className="primary" onClick={() => handleOpenAccountManagement(u)}>فتح الإدارة الكاملة</button>
          </div>
        </div>,
        true,
        'إدارة المستخدم'
      );
    } else if (type === 'audit') {
      openModal(
        'سجل النشاط',
        'السجل الإداري الكامل',
        <div className="drill-modal-actions">
          <button className="primary" onClick={handleOpenAuditLog}>فتح سجل النشاط</button>
        </div>,
        true,
        'Audit Log'
      );
    } else if (type === 'permissions') {
      openModal(
        'الصلاحيات',
        'صلاحيات أعضاء الحساب',
        <div className="drill-modal-actions">
          <button className="primary" onClick={handleOpenAllPermissions}>عرض جميع الأعضاء والصلاحيات</button>
        </div>,
        true,
        'الصلاحيات'
      );
    } else if (type === 'message') {
      openModal(
        'مراسلة العميل',
        u.name,
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenMessageComposer(u)}>إنشاء رسالة داخلية</button>
        </div>,
        true,
        'المراسلات'
      );
    }
  };

  const handleOpenAccountManagement = (u) => {
    pushModal(
      'إدارة الحساب',
      u.name,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>حالة الحساب</small><b style={{ color: 'var(--admin-green)' }}>نشط</b></div>
          <div className="modal-box"><small>التحقق</small><b>موثّق</b></div>
          <div className="modal-box"><small>الباقة</small><b>{u.plan}</b></div>
          <div className="modal-box"><small>آخر ظهور</small><b>{u.last}</b></div>
        </div>
        <div className="modal-section">
          <h4>إجراءات الحساب</h4>
          <div className="modal-list">
            <div className="modal-row clickable" onClick={handleOpenPlanDetails}>
              <div className="mi">$</div>
              <div><b>إدارة الاشتراك والباقة</b><small>عرض الدورة والحصص والاستهلاك</small></div>
              <span className="tag">فتح</span>
            </div>
            <div className="modal-row clickable" onClick={() => pushModal('بيانات الحساب', 'تعديل البيانات الأساسية', (
              <div className="modal-grid">
                <div className="modal-box"><small>الاسم</small><b>{u.name}</b></div>
                <div className="modal-box"><small>الحالة</small><b>{u.status}</b></div>
              </div>
            ), true, 'تعديل الحساب')}>
              <div className="mi">✎</div>
              <div><b>البيانات الأساسية</b><small>الاسم، الحالة، معلومات التواصل</small></div>
              <span className="tag">تعديل</span>
            </div>
          </div>
        </div>
      </div>,
      true,
      'إدارة المستخدم'
    );
  };

  const handleOpenAuditLog = () => {
    pushModal(
      'سجل النشاط',
      'التغييرات والإجراءات الإدارية على الحساب',
      <div className="timeline">
        <div className="timeline-item"><b>تعديل صلاحيات سارة الخطيب</b><small>29 أغسطس 2026 · بواسطة مدير الحساب</small></div>
        <div className="timeline-item"><b>تحديث شهادة التسجيل الضريبي</b><small>22 أغسطس 2026 · بواسطة محمد العلي</small></div>
        <div className="timeline-item"><b>ترقية الباقة إلى أعمال</b><small>14 أغسطس 2026 · بواسطة مدير المنصة</small></div>
        <div className="timeline-item"><b>إضافة عمر النجار للحساب</b><small>07 أغسطس 2026 · بواسطة مدير الحساب</small></div>
      </div>,
      true,
      'Audit Log'
    );
  };

  const handleOpenAllPermissions = () => {
    pushModal(
      'صلاحيات أعضاء الحساب',
      'إجمالي 3 أعضاء',
      <div className="modal-list">
        <div className="modal-row clickable" onClick={() => handleOpenMember('محمد العلي', 'm.ali@client.jo', 'مدير الحساب')}>
          <div className="mi">م ع</div>
          <div><b>محمد العلي</b><small>مدير الحساب · صلاحيات كاملة</small></div>
          <span className="tag">عرض</span>
        </div>
        <div className="modal-row clickable" onClick={() => handleOpenMember('سارة الخطيب', 's.khatib@client.jo', 'استشارات وفوترة')}>
          <div className="mi">س خ</div>
          <div><b>سارة الخطيب</b><small>استشارات وفوترة</small></div>
          <span className="tag">عرض</span>
        </div>
        <div className="modal-row clickable" onClick={() => handleOpenMember('عمر النجار', 'o.najjar@client.jo', 'عرض فقط')}>
          <div className="mi">ع ن</div>
          <div><b>عمر النجار</b><small>عرض فقط</small></div>
          <span className="tag">عرض</span>
        </div>
      </div>,
      true,
      'الصلاحيات'
    );
  };

  const handleOpenMessageComposer = (u) => {
    pushModal(
      'مراسلة العميل',
      u.name,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>إلى</small><b>{u.name}</b></div>
          <div className="modal-box"><small>القناة</small><b>رسالة داخل المنصة</b></div>
        </div>
        <div className="modal-section">
          <h4>الرسالة</h4>
          <textarea
            style={{ width: '100%', minHeight: '150px', border: '1px solid var(--admin-line)', borderRadius: '14px', padding: '13px', resize: 'vertical', outline: 0, fontFamily: 'inherit', fontSize: '13px' }}
            placeholder="اكتب رسالتك للعميل..."
          />
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => showToast('تم إرسال الرسالة داخليًا')}>إرسال</button>
          <button onClick={() => showToast('تم حفظ المسودة')}>حفظ كمسودة</button>
        </div>
      </div>,
      true,
      'المراسلات'
    );
  };

  return (
    <div className="users-page-root">

      {/* ══════════════════════════════════════════════════════════════════
          HERO HEADER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="users-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>المستخدمون <em>والعملاء</em></h1>
          <p style={{ margin: '6px 0 0 0' }}>
            ملف موحّد لفهم العميل، صفته القانونية، قطاعه، نشاطه على المنصة، استهلاك الباقة، الاستشارات، أعضاء الحساب وسجل التفاعل.
          </p>
        </div>
        <button
          className="admin-btn-action-primary"
          style={{ background: '#0e3b5e', color: '#FFFFFF', padding: '10px 22px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none' }}
          onClick={() => setAddUserModalOpen(true)}
        >
          + إضافة مستخدم / عميل
        </button>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRIMARY SUB-NAVIGATION TABS (APPROVED USERS vs PENDING REQUESTS)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '14px 0 24px 0', borderBottom: '2px solid #E2E8F0', paddingBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            style={{
              background: activeTab === 'approved' ? '#0e3b5e' : '#F1F5F9',
              color: activeTab === 'approved' ? '#FFFFFF' : '#475569',
              border: activeTab === 'approved' ? 'none' : '1px solid #CBD5E1',
              padding: '10px 22px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: activeTab === 'approved' ? '0 4px 14px rgba(14,59,94,0.18)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>👥 المستخدمون المعتمدون</span>
            <span style={{
              background: activeTab === 'approved' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
              color: activeTab === 'approved' ? '#FFFFFF' : '#0F172A',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '900'
            }}>
              {usersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              background: activeTab === 'pending' ? '#D97706' : '#FEF3C7',
              color: activeTab === 'pending' ? '#FFFFFF' : '#92400E',
              border: activeTab === 'pending' ? 'none' : '1px solid #FCD34D',
              padding: '10px 22px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: activeTab === 'pending' ? '0 4px 14px rgba(217,119,6,0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>⏳ طلبات الانضمام قيد المراجعة</span>
            <span style={{
              background: activeTab === 'pending' ? '#FFFFFF' : '#D97706',
              color: activeTab === 'pending' ? '#D97706' : '#FFFFFF',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '900'
            }}>
              {pendingUsers.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => { loadBackendUsers(); loadPendingUsers(); showToast('تم تحديث البيانات مباشرة من الداتا بيز 🔄'); }}
          style={{
            background: '#FFFFFF',
            color: '#0e3b5e',
            border: '1px solid #CBD5E1',
            padding: '8px 18px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          تحديث مباشر
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 1: PENDING REGISTRATION REQUESTS (100% POSTGRESQL DATA)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pending' ? (
        <div className="users-pending-container" style={{ marginBottom: '40px' }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                ⏳
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#92400E' }}>
                  طلبات تسجيل المستخدمين والشركات بانتظار اعتماد الإدارة
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#B45309' }}>
                  يتم سحب هذه الطلبات مباشرة من جدول `users` في قاعدة البيانات حيث `verification_status = pending`.
                </p>
              </div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #FCD34D', borderRadius: '10px', padding: '6px 14px', fontSize: '13px', fontWeight: '800', color: '#92400E' }}>
              إجمالي المعلقين: {pendingUsers.length}
            </div>
          </div>

          {loadingPending ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0e3b5e' }}>جاري استرجاع طلبات الانضمام المعلقة من الداتا بيز...</div>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                ✓
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>لا توجد طلبات انضمام معلقة حالياً</h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0 }}>
                جميع حسابات المستخدمين والعملاء مفعلة ومعتمدة في النظام بنسبة 100%.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {pendingUsers.map((u) => {
                const mapEntity = {
                  individual: 'حساب فردي',
                  company: 'منشأة / شركة',
                  researcher: 'باحث / أكاديمي'
                };
                const entityLabel = mapEntity[u.entity_type] || u.entity_type || 'عميل جديد';
                const displayName = u.full_name || u.company_name || u.email;

                return (
                  <div
                    key={u.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '20px',
                      padding: '24px',
                      boxShadow: '0 8px 24px rgba(11,46,75,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900' }}>
                            {displayName.charAt(0)}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0e3b5e' }}>
                              {displayName}
                            </h4>
                            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                              {u.email}
                            </span>
                          </div>
                        </div>
                        <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800' }}>
                          ⏳ قيد المراجعة
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>نوع الكيان:</span>
                          <b style={{ color: '#0e3b5e' }}>{entityLabel}</b>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>الهاتف:</span>
                          <b style={{ color: '#0e3b5e', direction: 'ltr', display: 'inline-block' }}>{u.phone || '—'}</b>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>الرقم الضريبي:</span>
                          <b style={{ color: '#0e3b5e' }}>{u.tax_number || '—'}</b>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block' }}>المدينة / العنوان:</span>
                          <b style={{ color: '#0e3b5e' }}>{u.address || 'عمّان'}</b>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                        📅 تاريخ التسجيل: <b>{u.created_at ? new Date(u.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'اليوم'}</b>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <button
                        type="button"
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleApproveUser(u)}
                        style={{
                          background: '#16A34A',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 3px 10px rgba(22,163,74,0.2)'
                        }}
                      >
                        ✓ اعتماد وتفعيل
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === u.id}
                        onClick={() => setRejectingUser(u)}
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '10px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        ✕ رفض الطلب
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
            VIEW 2: APPROVED USERS DIRECTORY (DEFAULT)
            ══════════════════════════════════════════════════════════════════ */
        <>
          <div className="users-searchbar">
            <div className="users-search-input">
              <svg className="icon" style={{ width: 18, height: 18, fill: 'none', stroke: '#0B2E4B', strokeWidth: 1.8 }} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="ابحث بالاسم، الرقم الوطني، الرقم الضريبي أو البريد..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="users-top-filter">
              <ModernSelect
                options={LEGAL_OPTIONS}
                value={legalTopFilter}
                onChange={(val) => setLegalTopFilter(val)}
                placeholder="الصفة القانونية"
                dropdownWidth="220px"
              />
            </div>

            <div className="users-top-filter">
              <ModernSelect
                options={SECTOR_OPTIONS}
                value={sectorTopFilter}
                onChange={(val) => setSectorTopFilter(val)}
                placeholder="القطاع"
                dropdownWidth="160px"
              />
            </div>

            <div className="users-top-filter">
              <ModernSelect
                options={STATUS_OPTIONS}
                value={statusTopFilter}
                onChange={(val) => setStatusTopFilter(val)}
                placeholder="حالة الحساب"
                dropdownWidth="150px"
              />
            </div>

            <button className="users-search-btn" onClick={() => showToast(`تم العثور على ${filteredUsers.length} نتيجة`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              بحث المستخدمين
            </button>
          </div>

          <div className="users-content">

        {/* Sticky Filters Sidebar */}
        <aside className="users-filters">
          <div className="users-filter-head">
            <h2>التصفية</h2>
            <button className="users-clear-btn" onClick={handleClearFilters}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4 }}>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              مسح الكل
            </button>
          </div>

          {/* Legal Form Checks */}
          <div className="users-filter-group">
            <div className="users-filter-label">الصفة القانونية</div>
            <div className="users-checks">
              {[
                { label: 'أفراد', val: 'فرد' },
                { label: 'مؤسسة فردية', val: 'مؤسسة فردية' },
                { label: 'ذات مسؤولية محدودة', val: 'شركة ذات مسؤولية محدودة' },
                { label: 'تضامن / توصية بسيطة', val: 'تضامن|توصية' },
                { label: 'مساهمة عامة / خاصة', val: 'مساهمة' },
                { label: 'جامعات / أكاديميون / باحثون', val: 'جامعة|أكاديمي|باحث' },
                { label: 'جمعيات ومنظمات', val: 'جمعية|منظمة' },
                { label: 'حكومي / هيئات', val: 'حكومي|هيئة' }
              ].map((item, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={legalChecks.includes(item.val)}
                    onChange={() => handleLegalCheckbox(item.val)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sector Chips */}
          <div className="users-filter-group">
            <div className="users-filter-label">القطاع</div>
            <div className="users-chips">
              {[
                { label: 'الكل', val: '' },
                { label: 'خدمات', val: 'خدمات' },
                { label: 'تجارة', val: 'تجارة' },
                { label: 'صناعة', val: 'صناعة' },
                { label: 'مقاولات', val: 'مقاولات' },
                { label: 'زراعة', val: 'زراعة' }
              ].map((chip, i) => (
                <button
                  key={i}
                  className={`users-chip ${sectorChip === chip.val ? 'active' : ''}`}
                  onClick={() => setSectorChip(chip.val)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Usage Level Checks */}
          <div className="users-filter-group">
            <div className="users-filter-label">مستوى الاستخدام</div>
            <div className="users-checks">
              {['مرتفع', 'متوسط', 'منخفض', 'لم يستخدم بعد'].map((uLevel, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={usageChecks.includes(uLevel)}
                    onChange={() => handleUsageCheckbox(uLevel)}
                  />
                  <span>{uLevel}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Plan Checks */}
          <div className="users-filter-group">
            <div className="users-filter-label">الباقة</div>
            <div className="users-checks">
              {['باقة الأعمال', 'الباقة الاحترافية', 'الباقة الأساسية'].map((plan, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={planChecks.includes(plan)}
                    onChange={() => handlePlanCheckbox(plan)}
                  />
                  <span>{plan}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Main Area */}
        <main>
          <div className="users-results-tools">
            <div className="users-count">
              <b>{filteredUsers.length}</b> مستخدمين
            </div>
            <div className="users-toolset">
              <div className="users-sort">
                <ModernSelect
                  options={SORT_OPTIONS}
                  value={sortFilter}
                  onChange={(val) => setSortFilter(val)}
                  placeholder="ترتيب حسب"
                  dropdownWidth="175px"
                  align="left"
                  prefixIcon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                      <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {/* User Cards Grid */}
          {displayedUsers.length > 0 ? (
            <div className="users-cards-grid">
              {displayedUsers.map((u) => (
                <article key={u.id} className="user-card-item">
                  <div className="user-card-top">
                    <div className="user-avatar-box">
                      {u.initial}
                      {u.online && <i className="user-online-dot"></i>}
                    </div>
                    <div className="user-card-name">
                      <h3>{u.name}</h3>
                      <small>{u.legal} · {u.sector}</small>
                    </div>
                    <span className={`user-status-badge ${u.status === 'نشط' ? '' : 'inactive'}`}>
                      {u.status}
                    </span>
                  </div>

                  <div className="user-card-badges">
                    <span className="user-badge">{u.activity}</span>
                    <span className="user-badge orange">{u.plan}</span>
                  </div>

                  <div className="user-mini-stats">
                    <div className="user-mini-stat">
                      <b>{u.consult}</b>
                      <span>استشارة</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{u.video}</b>
                      <span>فيديو</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{u.chat}</b>
                      <span>محادثة</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{u.tickets}</b>
                      <span>تذاكر دعم</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button onClick={() => openProfile(u)}>
                      عرض الملف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="users-empty-state">
              لا توجد نتائج مطابقة للفلاتر الحالية.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="users-pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === currentPage ? 'active' : ''}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
      </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PROFILE OVERLAY (FULL SCREEN VIEW)
          ══════════════════════════════════════════════════════════════════ */}
      {activeProfile && (
        <div className="profile-overlay-wrapper">

          {/* Top Return Bar */}
          <div className="profile-return-bar">
            <button onClick={closeProfile}>
              ← العودة إلى المستخدمين
            </button>
            <b>ملف المستخدم — عرض الأدمن</b>
          </div>

          <div className="profile-viewport-shell">
            <div className="profile-shell-grid">

              {/* Profile Card Header (Full Width Span) */}
              <section className="profile-card-header">
                <div className="profile-hero-band"></div>
                <div className="profile-top-info">
                  <div className="profile-avatar-large">
                    {activeProfile.initial}
                    {activeProfile.online && <i className="user-online-dot" style={{ width: 16, height: 16, border: '3px solid #fff' }}></i>}
                  </div>
                  <div className="profile-main-title">
                    <h1>{activeProfile.name}</h1>
                    <div className="profile-tagline">{activeProfile.legal} · {activeProfile.activity}</div>
                    <div className="profile-meta-line">
                      <span>💼 {activeProfile.sector}</span>
                      <span>⏱️ آخر ظهور: {activeProfile.last}</span>
                      <span>🛡️ حساب موثّق</span>
                    </div>
                  </div>
                  <div className="profile-right-meta">
                    <span className="account-id">رقم الحساب</span>
                    <strong>CUS-{String(activeProfile.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '000001'}</strong>
                    <span className={`user-status-badge ${activeProfile.status === 'نشط' ? '' : 'inactive'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                      {activeProfile.status}
                    </span>
                  </div>
                </div>

                <nav className="profile-nav-tabs">
                  {[
                    { id: 'overview', label: 'نظرة عامة' },
                    { id: 'legal', label: 'البيانات القانونية' },
                    { id: 'docs', label: 'الوثائق' },
                    { id: 'members', label: 'المستخدمون والصلاحيات' },
                    { id: 'interests', label: 'الاهتمامات' },
                    { id: 'activity', label: 'النشاط' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={activeProfileTab === tab.id ? 'active' : ''}
                      onClick={() => scrollToSection(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </section>

              {/* Main Scroll Content (Left Column in LTR, Right visually in RTL) */}
              <main
                className="profile-main-scroll"
                ref={mainScrollRef}
                onScroll={handleMainScroll}
              >
                <div>

                  {/* Section 1: Overview */}
                  <section className="profile-section-card" id="sec_overview">
                    <h2>نظرة عامة على العميل</h2>
                    <div className="profile-section-sub">المعلومات الأساسية المسجلة في الحساب</div>
                    <div className="profile-info-grid">
                      <div className="profile-info-box"><small>الاسم / اسم المنشأة</small><b>{activeProfile.name}</b></div>
                      <div className="profile-info-box"><small>الصفة القانونية</small><b>{activeProfile.legal}</b></div>
                      <div className="profile-info-box"><small>القطاع</small><b>{activeProfile.sector}</b></div>
                      <div className="profile-info-box"><small>النشاط الرئيسي</small><b>{activeProfile.activity}</b></div>
                      <div className="profile-info-box"><small>البريد الإلكتروني</small><b>{activeProfile.email}</b></div>
                      <div className="profile-info-box"><small>رقم التواصل</small><b dir="ltr">{activeProfile.phone}</b></div>
                    </div>
                  </section>

                  {/* Section 2: Legal Details */}
                  <section className="profile-section-card" id="sec_legal">
                    <h2>البيانات القانونية والتسجيلية</h2>
                    <div className="profile-section-sub">بيانات المنشأة كما تم إدخالها والتحقق منها</div>
                    <div className="profile-info-grid">
                      <div className="profile-info-box clickable-card" onClick={() => handleOpenLegalDetail('national', activeProfile)}>
                        <small>الرقم الوطني للمنشأة</small>
                        <b>{activeProfile.national}</b>
                      </div>
                      <div className="profile-info-box clickable-card" onClick={() => handleOpenLegalDetail('register', activeProfile)}>
                        <small>رقم السجل التجاري</small>
                        <b>{activeProfile.reg}</b>
                      </div>
                      <div className="profile-info-box clickable-card" onClick={() => handleOpenLegalDetail('tax', activeProfile)}>
                        <small>الرقم الضريبي</small>
                        <b>{activeProfile.tax}</b>
                      </div>
                      <div className="profile-info-box"><small>الدولة</small><b>الأردن</b></div>
                      <div className="profile-info-box"><small>المدينة</small><b>{activeProfile.city}</b></div>
                      <div className="profile-info-box"><small>تاريخ إنشاء الحساب</small><b>{activeProfile.joined}</b></div>
                    </div>
                  </section>

                  {/* Section 3: Documents */}
                  <section className="profile-section-card" id="sec_docs">
                    <h2>الوثائق والتحقق</h2>
                    <div className="profile-section-sub">الوثائق المرفقة بالحساب في قاعدة البيانات</div>
                    {activeProfile.documents && activeProfile.documents.length > 0 ? (
                      <div className="profile-doc-list">
                        {activeProfile.documents.map((doc, i) => (
                          <div
                            key={i}
                            className="profile-doc-item clickable-card"
                            onClick={() => handleOpenDocument(doc.filename, activeProfile, 'custom')}
                          >
                            <div className="profile-doc-ico">📄</div>
                            <div>
                              <strong>{doc.filename}</strong>
                              <small>{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'PDF'} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ar-JO') : 'مرفوع'}</small>
                            </div>
                            <span className="profile-verified-tag">موثّق</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                        <b style={{ color: '#0e3b5e' }}>لا توجد وثائق رسمية مرفوعة حالياً</b>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>لم يقم العميل برفع أي ملفات أو وثائق سجل تجاري في حسابه حتى الآن.</p>
                      </div>
                    )}
                  </section>

                  {/* Section 4: Members */}
                  <section className="profile-section-card" id="sec_members">
                    <h2>المستخدمون والصلاحيات</h2>
                    <div className="profile-section-sub">الأعضاء المرتبطون بنفس الحساب</div>
                    <div className="profile-members-list">
                      <div
                        className="profile-member-item clickable-card"
                        onClick={() => handleOpenMember(activeProfile.name, activeProfile.email, 'المالك الرئيسي للحساب')}
                      >
                        <div className="profile-member-av">{activeProfile.initial}</div>
                        <div>
                          <b>{activeProfile.name}</b>
                          <small>{activeProfile.email} · {activeProfile.phone}</small>
                        </div>
                        <span className="profile-role-tag">المالك الرئيسي</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#94A3B8' }}>
                      ℹ️ هذا الحساب مسجل كـ ({activeProfile.legal}) مفرد، ولا توجد حسابات فرعية إضافية مرتبطة به.
                    </div>
                  </section>

                  {/* Section 5: Topic Interests */}
                  <section className="profile-section-card" id="sec_interests">
                    <h2>المواضيع والاهتمامات الضريبية</h2>
                    <div className="profile-section-sub">مبنية على نشاط العميل وتخصصه ({activeProfile.sector})</div>
                    {activeProfile.total_topic_signals > 0 && activeProfile.topics?.length > 0 ? (
                      <div className="profile-topic-bars">
                        {activeProfile.topics.map((item, i) => (
                          <div
                            key={i}
                            className="profile-topic-line clickable-card"
                            onClick={() => handleOpenTopic(item.topic)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                              <b>{item.topic}</b>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>{item.count > 0 ? `${item.count} طلبات/جلسات` : 'لا توجد طلبات'}</small>
                            </div>
                            <div className="profile-topic-track">
                              <i style={{ width: `${item.pct}%` }}></i>
                            </div>
                            <span>{item.pct}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                        <b style={{ color: '#0e3b5e' }}>لا توجد اهتمامات ضريبية مسجلة بعد</b>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>
                          لم يقم هذا الحساب بحجز استشارات أو رفع تذاكر استفسار ضريبية حتى الآن. يتم احتساب نسب الاهتمامات تلقائياً وفورياً من نشاط العميل الفعلي في المنصة.
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Section 6: Activity */}
                  <section className="profile-section-card" id="sec_activity">
                    <h2>سجل النشاط والاستشارات</h2>
                    <div className="profile-section-sub">الاستشارات والعمليات الفعلية المسجلة في الداتا بيز</div>
                    {activeProfile.appointments && activeProfile.appointments.length > 0 ? (
                      <div className="profile-activity-list">
                        {activeProfile.appointments.map((a, i) => (
                          <div
                            key={i}
                            className="profile-activity-item clickable-card"
                            onClick={() => handleOpenSession(a.title || 'استشارة ضريبية', a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString('ar-JO') : 'مكتملة')}
                          >
                            <div className="profile-activity-ico">{a.type?.includes('video') ? '📹' : '💬'}</div>
                            <div>
                              <b>{a.title || 'استشارة ضريبية'}</b>
                              <small>مع المستشار: {a.consultant_name} · الحالة: {a.status === 'completed' ? 'مكتملة بنجاح' : a.status}</small>
                            </div>
                            <time>{a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString('ar-JO') : '—'}</time>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                        <b style={{ color: '#0e3b5e' }}>لا توجد استشارات أو جلسات سابقة مسجلة</b>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>لم يقم هذا الحساب بحجز جلسات استشارية بعد.</p>
                      </div>
                    )}
                  </section>

                </div>
              </main>

              {/* Side Scroll Rail (Right Column visually in RTL) */}
              <aside className="profile-side-scroll">

                {/* 1. Account Summary KPIs */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>ملخص الحساب</h3>
                    <span className="profile-live-tag" style={{
                      background: activeProfile.online ? 'rgba(34, 197, 94, 0.12)' : (activeProfile.is_active ? 'rgba(14, 165, 233, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                      color: activeProfile.online ? '#15803d' : (activeProfile.is_active ? '#0369a1' : '#b91c1c'),
                      borderColor: activeProfile.online ? '#86efac' : (activeProfile.is_active ? '#7dd3fc' : '#fca5a5')
                    }}>
                      {activeProfile.online ? '● متصل الآن' : (activeProfile.is_active ? 'حساب مفعّل' : 'حساب معطّل')}
                    </span>
                  </div>
                  {(() => {
                    const apptsList = activeProfile.appointments || [];
                    const hasApptsData = activeProfile.appointments !== undefined;
                    const totalConsultCount = hasApptsData ? apptsList.length : (activeProfile.consult || 0);
                    const completedConsultCount = hasApptsData ? apptsList.filter(a => ['completed', 'confirmed'].includes(String(a.status).toLowerCase())).length : (activeProfile.success || 0);
                    const videoConsultCount = hasApptsData ? apptsList.filter(a => String(a.type).toLowerCase().includes('video')).length : (activeProfile.video || 0);
                    const chatConsultCount = hasApptsData ? apptsList.filter(a => String(a.type).toLowerCase().includes('chat') || String(a.type).toLowerCase().includes('messaging')).length : (activeProfile.chat || 0);

                    return (
                      <div className="profile-kpi-grid">
                        <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'all')}>
                          <small>إجمالي الاستشارات</small>
                          <b>{totalConsultCount}</b>
                          <span>{totalConsultCount > 0 ? `${totalConsultCount} جلسات` : 'لا يوجد'}</span>
                        </div>
                        <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'success')}>
                          <small>استشارات ناجحة</small>
                          <b>{completedConsultCount}</b>
                          <span>{totalConsultCount > 0 ? `${Math.round((completedConsultCount / totalConsultCount) * 100)}% نجاح` : '0%'}</span>
                        </div>
                        <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'video')}>
                          <small>مكالمات فيديو</small>
                          <b>{videoConsultCount}</b>
                          <span>{totalConsultCount > 0 ? `${Math.round((videoConsultCount / totalConsultCount) * 100)}% من الجلسات` : '0%'}</span>
                        </div>
                        <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'chat')}>
                          <small>محادثات</small>
                          <b>{chatConsultCount}</b>
                          <span>{totalConsultCount > 0 ? `${Math.round((chatConsultCount / totalConsultCount) * 100)}% من الجلسات` : '0%'}</span>
                        </div>
                      </div>
                    );
                  })()}
                </section>

                {/* 2. Plan & Usage */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>الباقة والاستهلاك</h3>
                    <span className="user-badge orange">{activeProfile.subscription?.plan_name || activeProfile.plan || 'الباقة الأساسية'}</span>
                  </div>
                  <div className="profile-plan-row clickable-card" onClick={() => handleOpenPlanUsage(activeProfile)}>
                    <div className="profile-donut-chart"></div>
                    <div className="profile-plan-copy">
                      <b>{activeProfile.subscription?.status === 'active' ? 'اشتراك نشط' : 'الباقة القياسية'}</b>
                      <small>{activeProfile.subscription?.points_balance !== undefined ? `الرصيد: ${activeProfile.subscription.points_balance} نقطة` : 'لا يوجد استهلاك للباقة حالياً'}</small>
                    </div>
                  </div>
                  <div className="profile-usage-list">
                    {[
                      { title: 'استهلاك النقاط', displayVal: activeProfile.subscription?.points_balance ? `${activeProfile.subscription.points_balance} نقطة` : '0 نقطة', pct: 0 },
                      { title: 'تحميل الوثائق', displayVal: activeProfile.documents ? `${activeProfile.documents.length} ملفات` : '0 ملفات', pct: 0 },
                      { title: 'الجلسات الاستشارية', displayVal: `${(activeProfile.appointments ? activeProfile.appointments.length : (activeProfile.consult || 0))} جلسة`, pct: (activeProfile.appointments ? activeProfile.appointments.length : (activeProfile.consult || 0)) ? Math.min(100, (activeProfile.appointments ? activeProfile.appointments.length : (activeProfile.consult || 0)) * 10) : 0 }
                    ].map((usage, i) => (
                      <div key={i} className="profile-usage-row clickable-card" onClick={() => handleOpenUsage(usage.title, usage.displayVal)}>
                        <span>{usage.title}</span>
                        <div className="track">
                          <i style={{ width: `${usage.pct}%` }}></i>
                        </div>
                        <b>{usage.displayVal}</b>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Support & Interaction */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>الدعم والتفاعل</h3>
                  </div>
                  <div className="profile-split-metrics">
                    <div className="profile-metric-box clickable-card" onClick={() => handleOpenTickets(activeProfile)}>
                      <small>تذاكر الدعم</small>
                      <b>{activeProfile.ticketsList?.length ?? activeProfile.tickets ?? 0}</b>
                      <span className="profile-click-hint">عرض القائمة</span>
                    </div>
                    <div className="profile-metric-box clickable-card" onClick={handleOpenRatings}>
                      <small>متوسط التقييم</small>
                      <b>{activeProfile.stats?.avg_rating ? `${activeProfile.stats.avg_rating} / 5` : '—'}</b>
                      <span className="profile-click-hint">
                        {activeProfile.stats?.ratings_count > 0 ? `${activeProfile.stats.ratings_count} تقييمات` : 'لا يوجد تقييم بعد'}
                      </span>
                    </div>
                    <div className="profile-metric-box clickable-card" onClick={handleOpenMembersSummary}>
                      <small>أعضاء الحساب</small>
                      <b>1</b>
                      <span className="profile-click-hint">المالك</span>
                    </div>
                    <div className="profile-metric-box clickable-card" onClick={() => handleOpenLastSeen(activeProfile)}>
                      <small>آخر ظهور</small>
                      <b style={{ fontSize: '11px' }}>{activeProfile.last || 'الآن'}</b>
                      <span className="profile-click-hint">تفاصيل الدخول</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    {activeProfile.ticketsList && activeProfile.ticketsList.length > 0 ? (
                      activeProfile.ticketsList.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="profile-ticket-item clickable-card" onClick={() => handleOpenTicketDetail(t.ticket_number, t.subject, t.status)}>
                          <b>#{t.ticket_number} · {t.subject}</b>
                          <span className={t.status === 'closed' ? 'done' : ''}>{t.status}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12.5px', color: '#94A3B8', textAlign: 'center', padding: '8px 0' }}>
                        لا توجد تذاكر دعم مسجلة
                      </div>
                    )}
                  </div>
                </section>

                {/* 5. Admin Actions */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>إجراءات الإدارة</h3>
                  </div>
                  <div className="profile-admin-actions">
                    <button className="primary-act" onClick={() => handleOpenAdminAction('account', activeProfile)}>
                      إدارة الحساب
                    </button>
                    <button onClick={() => handleOpenAdminAction('audit', activeProfile)}>
                      سجل النشاط
                    </button>
                    <button onClick={() => handleOpenAdminAction('permissions', activeProfile)}>
                      الصلاحيات
                    </button>
                    <button onClick={() => handleOpenAdminAction('message', activeProfile)}>
                      مراسلة العميل
                    </button>
                  </div>
                </section>

              </aside>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HIERARCHICAL MODAL ENGINE (DRILLDOWN POPUPS)
          ══════════════════════════════════════════════════════════════════ */}
      {modalStack.length > 0 && (
        <div
          className="drill-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className={`drill-modal-panel ${modalStack[modalStack.length - 1].wide ? 'wide' : ''}`}>
            <div className="drill-modal-accent"></div>

            {/* Modal Header with Back and Close buttons */}
            <div className="drill-modal-head">
              <div className="drill-modal-head-main">
                {modalStack.length > 1 && (
                  <button className="drill-modal-back" onClick={modalGoBack} title="رجوع">
                    →
                  </button>
                )}
                <div>
                  <div className="drill-modal-eyebrow">
                    {modalStack[modalStack.length - 1].eyebrow || 'تفاصيل الحساب'}
                  </div>
                  <h3>{modalStack[modalStack.length - 1].title}</h3>
                  <p>{modalStack[modalStack.length - 1].subtitle}</p>
                </div>
              </div>

              <button className="drill-modal-close" onClick={closeModal} title="إغلاق">
                ×
              </button>
            </div>

            <div className="drill-modal-progress"></div>

            <div className="drill-modal-body">
              {modalStack[modalStack.length - 1].body}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADD USER / CLIENT MODAL (DIRECT DB REGISTRATION)
          ══════════════════════════════════════════════════════════════════ */}
      {addUserModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setAddUserModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: '900', color: '#0e3b5e' }}>
              + إضافة مستخدم / عميل جديد
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
              سيتم إنشاء الحساب واعتماده مباشرة في قاعدة البيانات، ليتمكن العميل من الدخول فورا باستخدام البريد وكلمة المرور.
            </p>

            <form onSubmit={handleCreateUserSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>اسم العميل / المسؤول *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: م. معاذ الشامي"
                    value={newUserForm.fullName}
                    onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>كلمة المرور الابتدائية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Test@123456"
                    value={newUserForm.password}
                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                  />
                  <small style={{ fontSize: '10.5px', color: '#64748B' }}>
                    8 أحرف + حرف كبير + صغير + رقم + رمز
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>رقم الهاتف / الموبايل</label>
                  <input
                    type="text"
                    placeholder="+962 7 9000 0000"
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>الصفة القانونية</label>
                  <select
                    value={newUserForm.legal}
                    onChange={e => {
                      const val = e.target.value;
                      let entityType = 'individual';
                      if (val.includes('شركة') || val.includes('مؤسسة')) entityType = 'company';
                      if (val.includes('باحث') || val.includes('جامعة')) entityType = 'researcher';
                      setNewUserForm({ ...newUserForm, legal: val, entityType });
                    }}
                    className="admin-select-input"
                    style={{ width: '100%' }}
                  >
                    <option value="فرد">فرد</option>
                    <option value="مؤسسة فردية">مؤسسة فردية</option>
                    <option value="شركة ذات مسؤولية محدودة">شركة ذات مسؤولية محدودة</option>
                    <option value="شركة تضامن">شركة تضامن</option>
                    <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
                    <option value="شركة مساهمة عامة">شركة مساهمة عامة</option>
                    <option value="شركة مساهمة خاصة">شركة مساهمة خاصة</option>
                    <option value="أكاديمي وباحث">أكاديمي وباحث</option>
                    <option value="جمعية ومنظمة">جمعية ومنظمة</option>
                    <option value="جهة حكومية">جهة حكومية</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>القطاع</label>
                  <select
                    value={newUserForm.sector}
                    onChange={e => setNewUserForm({ ...newUserForm, sector: e.target.value })}
                    className="admin-select-input"
                    style={{ width: '100%' }}
                  >
                    <option value="services">خدمات</option>
                    <option value="trade">تجارة</option>
                    <option value="industry">صناعة</option>
                    <option value="contracting">مقاولات</option>
                    <option value="agriculture">زراعة</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>اسم المنشأة / الشركة (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة الرؤية للمقاولات"
                    value={newUserForm.companyName}
                    onChange={e => setNewUserForm({ ...newUserForm, companyName: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>الرقم الضريبي (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="مثال: 200192841"
                    value={newUserForm.taxNumber}
                    onChange={e => setNewUserForm({ ...newUserForm, taxNumber: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loadingAddUser}
                  className="admin-btn-action-primary"
                  style={{ padding: '10px 24px', fontWeight: '800', cursor: 'pointer' }}
                >
                  {loadingAddUser ? 'جاري الحفظ في الداتابيز...' : 'حفظ وإنشاء الحساب فوراً'}
                </button>
                <button
                  type="button"
                  className="admin-btn-action-outline"
                  onClick={() => setAddUserModalOpen(false)}
                  style={{ padding: '10px 18px', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="drill-toast-box">
          {toastMsg}
        </div>
      )}

      {/* Modern Luxury Success Popup Modal */}
      {successModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px 28px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
            textAlign: 'center',
            direction: 'rtl'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ECFDF5',
              border: '2px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#059669'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' }}>
              {successModal.title || 'تمت العملية بنجاح!'}
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', marginBottom: '20px' }}>
              تم تسجيل وتفعيل حساب <strong style={{ color: '#0F172A' }}>[{successModal.name}]</strong> في قاعدة البيانات مباشرة.
            </p>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '24px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginBottom: '4px' }}>البريد الإلكتروني لتسجيل الدخول:</div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#005D9C', direction: 'ltr', textAlign: 'left', wordBreak: 'break-all' }}>
                {successModal.email}
              </div>
            </div>

            <button
              onClick={() => setSuccessModal(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #E58A13 0%, #D47700 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(229, 138, 19, 0.3)'
              }}
            >
              تم، موافق
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal with Reason */}
      {rejectingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            direction: 'rtl'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px auto'
            }}>
              ✕
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', textAlign: 'center', margin: '0 0 8px 0' }}>
              رفض طلب تسجيل العميل
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', textAlign: 'center', margin: '0 0 20px 0' }}>
              أنت على وشك رفض طلب تسجيل <b>{rejectingUser.full_name || rejectingUser.company_name || rejectingUser.email}</b>. يرجى تحديد سبب الرفض لإشعار العميل به:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0e3b5e', marginBottom: '8px' }}>
                سبب الرفض:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="اكتب سبب الرفض بالتفصيل..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                disabled={actionLoadingId === rejectingUser.id}
                onClick={handleConfirmReject}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                {actionLoadingId === rejectingUser.id ? 'جاري الرفض...' : 'تأكيد الرفض'}
              </button>

              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '12px',
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

    </div>
  );
}
