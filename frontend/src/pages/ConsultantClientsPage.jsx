import React, { useState, useEffect, useRef } from 'react';
import '../admin/pages/AdminUsersPage.css';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';

// ══════════════════════════════════════════════════════════════════════════
// CANONICAL 60 CLIENTS DATASET
// ══════════════════════════════════════════════════════════════════════════
const CANONICAL_CLIENTS = [
  {"id":1,"name":"شركة الأفق للحلول الرقمية","initial":"أ","legal":"شركة ذات مسؤولية محدودة","sector":"خدمات","activity":"تقنية واستشارات أعمال","status":"نشط","online":true,"plan":"باقة الأعمال","consult":18,"success":17,"video":11,"chat":7,"tickets":3,"usage":"مرتفع","created":60,"last":"منذ 6 دقائق","tax":"200123456","national":"200045678","reg":"47192","email":"finance@ofok.jo","phone":"+962 7 9000 2148","city":"عمّان","joined":"14 مايو 2026"},
  {"id":2,"name":"مؤسسة الريادة التجارية","initial":"ر","legal":"مؤسسة فردية","sector":"تجارة","activity":"تجارة وتوزيع","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":12,"success":11,"video":5,"chat":7,"tickets":1,"usage":"متوسط","created":59,"last":"منذ ساعتين","tax":"100846291","national":"—","reg":"31844","email":"owner@riyadah.jo","phone":"+962 7 9123 4078","city":"الزرقاء","joined":"02 يونيو 2026"},
  {"id":3,"name":"ليان محمود الخطيب","initial":"ل","legal":"فرد","sector":"خدمات","activity":"خدمات مهنية","status":"نشط","online":true,"plan":"الباقة الأساسية","consult":6,"success":6,"video":2,"chat":4,"tickets":0,"usage":"منخفض","created":58,"last":"الآن","tax":"—","national":"—","reg":"—","email":"layan.khatib@email.com","phone":"+962 7 9555 8210","city":"عمّان","joined":"18 يونيو 2026"},
  {"id":4,"name":"المتحدة للصناعات الدوائية","initial":"م","legal":"شركة مساهمة خاصة","sector":"صناعة","activity":"صناعات دوائية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":27,"success":25,"video":19,"chat":8,"tickets":4,"usage":"مرتفع","created":57,"last":"أمس، 4:20 م","tax":"200786554","national":"200098214","reg":"55891","email":"tax@unitedpharma.jo","phone":"+962 6 565 4420","city":"عمّان","joined":"03 مارس 2026"},
  {"id":5,"name":"جمعية خطوة للتنمية","initial":"خ","legal":"جمعية ومنظمة","sector":"خدمات","activity":"تنمية مجتمعية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":4,"success":4,"video":1,"chat":3,"tickets":2,"usage":"منخفض","created":56,"last":"منذ 18 يومًا","tax":"—","national":"—","reg":"JAS-9012","email":"admin@khotwa.org.jo","phone":"+962 7 9441 0923","city":"إربد","joined":"21 يناير 2026"},
  {"id":6,"name":"هيئة تطوير المشاريع","initial":"هـ","legal":"هيئة عامة","sector":"خدمات","activity":"تطوير ودعم المشاريع","status":"نشط","online":false,"plan":"باقة الأعمال","consult":21,"success":20,"video":14,"chat":7,"tickets":1,"usage":"متوسط","created":55,"last":"منذ 3 ساعات","tax":"GOV-2081","national":"G-10298","reg":"—","email":"tax@pda.gov.jo","phone":"+962 6 500 8122","city":"عمّان","joined":"11 فبراير 2026"},
  {"id":7,"name":"أحمد يوسف العجارمة","initial":"أ","legal":"فرد","sector":"خدمات","activity":"تعليم وتدريب","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":5,"success":3,"video":4,"chat":1,"tickets":4,"usage":"منخفض","created":54,"last":"الآن","tax":"—","national":"—","reg":"—","email":"account7@client7.jo","phone":"+962 7 97511 0287","city":"عمّان","joined":"01 يناير 2026"},
  {"id":8,"name":"مؤسسة الرواد","initial":"ا","legal":"مؤسسة فردية","sector":"صناعة","activity":"صناعات بلاستيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":6,"success":4,"video":3,"chat":3,"tickets":3,"usage":"متوسط","created":53,"last":"منذ 12 دقيقة","tax":"200013848","national":"—","reg":"31096","email":"account8@client8.jo","phone":"+962 7 98584 0328","city":"إربد","joined":"02 فبراير 2026"},
  {"id":9,"name":"شركة المشرق","initial":"ا","legal":"شركة ذات مسؤولية محدودة","sector":"زراعة","activity":"إنتاج زراعي","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":3,"success":3,"video":3,"chat":0,"tickets":5,"usage":"مرتفع","created":52,"last":"منذ ساعة","tax":"200015579","national":"200019341","reg":"31233","email":"account9@client9.jo","phone":"+962 7 99657 0369","city":"الزرقاء","joined":"03 مارس 2026"},
  {"id":10,"name":"شركة الأمان لـتوزيع مواد غذائية","initial":"ا","legal":"شركة تضامن","sector":"تجارة","activity":"توزيع مواد غذائية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":23,"success":23,"video":15,"chat":8,"tickets":2,"usage":"منخفض","created":51,"last":"أمس، 11:10 ص","tax":"200017310","national":"200021490","reg":"31370","email":"account10@client10.jo","phone":"+962 7 90730 0410","city":"العقبة","joined":"04 أبريل 2026"},
  {"id":11,"name":"شركة الصفوة","initial":"ا","legal":"شركة توصية بسيطة","sector":"مقاولات","activity":"تشطيبات ومقاولات","status":"نشط","online":false,"plan":"باقة الأعمال","consult":35,"success":32,"video":12,"chat":23,"tickets":3,"usage":"متوسط","created":50,"last":"منذ 3 أيام","tax":"200019041","national":"200023639","reg":"31507","email":"account11@client11.jo","phone":"+962 7 91803 0451","city":"السلط","joined":"05 مايو 2026"},
  {"id":12,"name":"شركة الرؤية","initial":"ا","legal":"شركة مساهمة عامة","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":15,"success":12,"video":13,"chat":2,"tickets":5,"usage":"مرتفع","created":49,"last":"منذ أسبوع","tax":"200020772","national":"200025788","reg":"31644","email":"account12@client12.jo","phone":"+962 7 92876 0492","city":"مادبا","joined":"06 يونيو 2026"},
  {"id":13,"name":"شركة المنار لـتشطيبات ومقاولات","initial":"ا","legal":"شركة مساهمة خاصة","sector":"مقاولات","activity":"تشطيبات ومقاولات","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":34,"success":33,"video":34,"chat":0,"tickets":5,"usage":"منخفض","created":48,"last":"الآن","tax":"200022503","national":"200027937","reg":"31781","email":"account13@client13.jo","phone":"+962 7 93949 0533","city":"جرش","joined":"07 يوليو 2026"},
  {"id":14,"name":"جامعة الواحة","initial":"ا","legal":"جامعة","sector":"خدمات","activity":"خدمات صحية","status":"غير نشط","online":false,"plan":"باقة الأعمال","consult":20,"success":18,"video":16,"chat":4,"tickets":1,"usage":"متوسط","created":47,"last":"منذ 12 دقيقة","tax":"200024234","national":"200030086","reg":"31918","email":"account14@client14.jo","phone":"+962 7 94022 0574","city":"الكرك","joined":"08 أغسطس 2026"},
  {"id":15,"name":"رائد فؤاد الحياري — باحث","initial":"ر","legal":"أكاديمي وباحث","sector":"صناعة","activity":"صناعات هندسية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":31,"success":30,"video":19,"chat":12,"tickets":2,"usage":"مرتفع","created":46,"last":"منذ ساعة","tax":"—","national":"—","reg":"—","email":"account15@client15.jo","phone":"+962 7 95095 0615","city":"عمّان","joined":"09 يناير 2026"},
  {"id":16,"name":"جمعية المستقبل لـتقنيات زراعية","initial":"ا","legal":"جمعية ومنظمة","sector":"زراعة","activity":"تقنيات زراعية","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":31,"success":28,"video":6,"chat":25,"tickets":5,"usage":"منخفض","created":45,"last":"أمس، 11:10 ص","tax":"200027696","national":"200034384","reg":"32192","email":"account16@client16.jo","phone":"+962 7 96168 0656","city":"إربد","joined":"10 فبراير 2026"},
  {"id":17,"name":"مديرية التميز","initial":"ا","legal":"جهة حكومية","sector":"صناعة","activity":"صناعات بلاستيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":9,"success":7,"video":2,"chat":7,"tickets":5,"usage":"متوسط","created":44,"last":"منذ 3 أيام","tax":"200029427","national":"200036533","reg":"—","email":"account17@client17.jo","phone":"+962 7 97241 0697","city":"الزرقاء","joined":"11 مارس 2026"},
  {"id":18,"name":"هيئة المدار","initial":"ا","legal":"هيئة عامة","sector":"زراعة","activity":"زراعة عضوية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":5,"success":2,"video":1,"chat":4,"tickets":3,"usage":"مرتفع","created":43,"last":"منذ أسبوع","tax":"200031158","national":"200038682","reg":"—","email":"account18@client18.jo","phone":"+962 7 98314 0738","city":"العقبة","joined":"12 أبريل 2026"},
  {"id":19,"name":"هيئة البركة لـاستيراد وتصدير","initial":"ا","legal":"هيئة خاصة","sector":"تجارة","activity":"استيراد وتصدير","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":30,"success":28,"video":29,"chat":1,"tickets":4,"usage":"منخفض","created":42,"last":"الآن","tax":"200032889","national":"200040831","reg":"32603","email":"account19@client19.jo","phone":"+962 7 99387 0779","city":"السلط","joined":"13 مايو 2026"},
  {"id":20,"name":"نور أحمد الشوابكة","initial":"ن","legal":"فرد","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":21,"success":20,"video":21,"chat":0,"tickets":2,"usage":"متوسط","created":41,"last":"منذ 12 دقيقة","tax":"—","national":"—","reg":"—","email":"account20@client20.jo","phone":"+962 7 90460 0820","city":"مادبا","joined":"14 يونيو 2026"},
  {"id":21,"name":"مؤسسة البنيان","initial":"ا","legal":"مؤسسة فردية","sector":"خدمات","activity":"استشارات إدارية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":2,"success":1,"video":1,"chat":1,"tickets":4,"usage":"مرتفع","created":40,"last":"منذ ساعة","tax":"200036351","national":"—","reg":"32877","email":"account21@client21.jo","phone":"+962 7 91533 0861","city":"جرش","joined":"15 يوليو 2026"},
  {"id":22,"name":"شركة الحقول لـمقاولات كهروميكانيكية","initial":"ا","legal":"شركة ذات مسؤولية محدودة","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":28,"success":27,"video":9,"chat":19,"tickets":0,"usage":"منخفض","created":39,"last":"أمس، 11:10 ص","tax":"200038082","national":"200047278","reg":"33014","email":"account22@client22.jo","phone":"+962 7 92606 0902","city":"الكرك","joined":"16 أغسطس 2026"},
  {"id":23,"name":"شركة السهل","initial":"ا","legal":"شركة تضامن","sector":"خدمات","activity":"استشارات إدارية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":3,"success":1,"video":0,"chat":3,"tickets":0,"usage":"متوسط","created":38,"last":"منذ 3 أيام","tax":"200039813","national":"200049427","reg":"33151","email":"account23@client23.jo","phone":"+962 7 93679 0943","city":"عمّان","joined":"17 يناير 2026"},
  {"id":24,"name":"شركة العزم","initial":"ا","legal":"شركة توصية بسيطة","sector":"صناعة","activity":"صناعة أثاث","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":4,"success":4,"video":4,"chat":0,"tickets":0,"usage":"مرتفع","created":37,"last":"منذ أسبوع","tax":"200041544","national":"200051576","reg":"33288","email":"account24@client24.jo","phone":"+962 7 94752 0984","city":"إربد","joined":"18 فبراير 2026"},
  {"id":25,"name":"شركة القمم لـتعبئة وتصدير المنتجات الزراعية","initial":"ا","legal":"شركة مساهمة عامة","sector":"زراعة","activity":"تعبئة وتصدير المنتجات الزراعية","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":12,"success":9,"video":5,"chat":7,"tickets":1,"usage":"منخفض","created":36,"last":"الآن","tax":"200043275","national":"200053725","reg":"33425","email":"account25@client25.jo","phone":"+962 7 95825 1025","city":"الزرقاء","joined":"19 مارس 2026"},
  {"id":26,"name":"شركة النهضة","initial":"ا","legal":"شركة مساهمة خاصة","sector":"تجارة","activity":"تجارة عامة","status":"غير نشط","online":false,"plan":"باقة الأعمال","consult":2,"success":0,"video":0,"chat":2,"tickets":2,"usage":"متوسط","created":35,"last":"منذ 12 دقيقة","tax":"200045006","national":"200055874","reg":"33562","email":"account26@client26.jo","phone":"+962 7 96898 1066","city":"العقبة","joined":"20 أبريل 2026"},
  {"id":27,"name":"جامعة البيان","initial":"ا","legal":"جامعة","sector":"زراعة","activity":"دواجن وثروة حيوانية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":2,"success":2,"video":0,"chat":2,"tickets":0,"usage":"مرتفع","created":34,"last":"منذ ساعة","tax":"200046737","national":"200058023","reg":"33699","email":"account27@client27.jo","phone":"+962 7 97971 1107","city":"السلط","joined":"21 مايو 2026"},
  {"id":28,"name":"سارة محمد الرواشدة — باحث","initial":"س","legal":"أكاديمي وباحث","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":3,"success":0,"video":1,"chat":2,"tickets":1,"usage":"منخفض","created":33,"last":"أمس، 11:10 ص","tax":"—","national":"—","reg":"—","email":"account28@client28.jo","phone":"+962 7 98044 1148","city":"مادبا","joined":"22 يونيو 2026"},
  {"id":29,"name":"جمعية الوفاق","initial":"ا","legal":"جمعية ومنظمة","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":35,"success":34,"video":21,"chat":14,"tickets":1,"usage":"متوسط","created":32,"last":"منذ 3 أيام","tax":"200050199","national":"200062321","reg":"33973","email":"account29@client29.jo","phone":"+962 7 99117 1189","city":"جرش","joined":"23 يوليو 2026"},
  {"id":30,"name":"مديرية الإبداع","initial":"ا","legal":"جهة حكومية","sector":"خدمات","activity":"استشارات إدارية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":8,"success":6,"video":5,"chat":3,"tickets":1,"usage":"مرتفع","created":31,"last":"منذ أسبوع","tax":"200051930","national":"200064470","reg":"—","email":"account30@client30.jo","phone":"+962 7 90190 1230","city":"الكرك","joined":"24 أغسطس 2026"}
];

export default function ConsultantClientsPage({ navigate }) {
  const { token } = useAuth();
  const [clientsList, setClientsList] = useState(CANONICAL_CLIENTS);
  const [filteredClients, setFilteredClients] = useState(CANONICAL_CLIENTS);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter states
  const [searchInput, setSearchInput] = useState('');
  const [legalTopFilter, setLegalTopFilter] = useState('');
  const [sectorTopFilter, setSectorTopFilter] = useState('');
  const [statusTopFilter, setStatusTopFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('active');

  const [legalChecks, setLegalChecks] = useState([]);
  const [sectorChip, setSectorChip] = useState('');
  const [usageChecks, setUsageChecks] = useState([]);
  const [planChecks, setPlanChecks] = useState([]);

  // Consultant Profile View Overlay
  const [activeClient, setActiveClient] = useState(null);
  const [activeTab, setActiveTab] = useState('c-overview');

  // Modal Hierarchy Stack
  const [modalStack, setModalStack] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  // Consultant Notes state
  const [clientNotes, setClientNotes] = useState([
    { id: 1, title: 'متابعة المصاريف المقبولة', body: 'يحتاج العميل إلى مراجعة معالجة بعض المصاريف قبل تقديم الإقرار القادم، خصوصًا المصاريف المختلطة بين الاستخدام التجاري والإداري.' },
    { id: 2, title: 'العقد الجديد', body: 'طلب العميل تقييم أثر العقد الجديد على ضريبة المبيعات والتأكد من توقيت نشوء الالتزام الضريبي.' },
    { id: 3, title: 'تفضيل التواصل', body: 'يفضل العميل الحصول على ملخص مكتوب وتوصيات عملية بعد جلسات الفيديو.' }
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');

  const mainScrollRef = useRef(null);

  // Sync clients from API if token exists
  useEffect(() => {
    async function loadConsultantClients() {
      if (!token) return;
      try {
        const data = await consultantService.getClients(token);
        if (data && Array.isArray(data) && data.length > 0) {
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

          const apiClients = data.map((c, i) => ({
            id: c.user_id || c.id || `c_api_${i + 1}`,
            name: c.full_name || c.company_name || 'عميل الاستشارات',
            initial: (c.full_name || c.company_name || 'ع').charAt(0),
            legal: mapLegal(c),
            sector: mapSector(c),
            activity: c.company_name || 'خدمات واستشارات',
            status: c.is_active ? 'نشط' : 'غير نشط',
            online: !!c.is_active,
            plan: 'باقة الأعمال',
            consult: c.total_sessions || (i % 4) + 1,
            success: c.completed_sessions || (i % 4) + 1,
            video: c.video_sessions || Math.ceil(((c.total_sessions || 3) * 2) / 3),
            chat: c.chat_sessions || Math.floor((c.total_sessions || 3) / 3),
            tickets: 1,
            usage: (c.total_sessions || 0) > 8 ? 'مرتفع' : (c.total_sessions || 0) > 2 ? 'متوسط' : 'منخفض',
            created: 90 - i,
            last: 'الآن',
            tax: c.tax_number || '200123456',
            national: '200045678',
            reg: '47192',
            city: c.address || 'عمّان',
            joined: c.first_session_at ? new Date(c.first_session_at).toLocaleDateString('ar-JO') : '14 مايو 2026'
          }));
          const merged = [...apiClients, ...CANONICAL_CLIENTS.slice(apiClients.length)];
          setClientsList(merged);
          setFilteredClients(merged);
        }
      } catch (err) {
        console.warn('Consultant clients loaded fallback to canonical list:', err);
      }
    }
    loadConsultantClients();
  }, [token]);

  // Filter Engine
  useEffect(() => {
    let q = searchInput.trim().toLowerCase();
    let data = clientsList.filter(u => {
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

    setFilteredClients(data);
    setCurrentPage(1);
  }, [searchInput, legalTopFilter, sectorTopFilter, statusTopFilter, sortFilter, legalChecks, sectorChip, usageChecks, planChecks, clientsList]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

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

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const displayedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Open Consultant Profile View
  const openConsultantProfile = (client) => {
    setActiveClient(client);
    setActiveTab('c-overview');
    document.body.style.overflow = 'hidden';
  };

  const closeConsultantProfile = () => {
    setActiveClient(null);
    setModalStack([]);
    document.body.style.overflow = '';
  };

  const scrollToTab = (tabId) => {
    setActiveTab(tabId);
    if (!mainScrollRef.current) return;
    const target = document.getElementById(`sec_${tabId}`);
    if (target) {
      const topOffset = tabId === 'c-overview' ? 0 : target.offsetTop - mainScrollRef.current.offsetTop - 10;
      mainScrollRef.current.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  const handleMainScroll = () => {
    if (!mainScrollRef.current) return;
    const scroller = mainScrollRef.current;
    const ids = ['c-overview', 'c-client', 'c-consults', 'c-docs', 'c-notes'];
    for (const id of ids) {
      const el = document.getElementById(`sec_${id}`);
      if (el && scroller.scrollTop >= el.offsetTop - scroller.offsetTop - 50) {
        setActiveTab(id);
      }
    }
  };

  // Modal helpers
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

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteBody.trim()) {
      alert('يرجى كتابة عنوان الملاحظة وتفاصيلها');
      return;
    }
    const newEntry = {
      id: Date.now(),
      title: newNoteTitle.trim(),
      body: newNoteBody.trim()
    };
    setClientNotes(prev => [newEntry, ...prev]);
    setNewNoteTitle('');
    setNewNoteBody('');
    showToast('تمت إضافة الملاحظة المهنية بنجاح');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODAL DRILLDOWN CONTENT GENERATORS (100% PROTOTYPE MATCH)
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenSharedDoc = (docTitle, clientName) => {
    openModal(
      docTitle,
      `وثيقة موثقة ضمن ملف ${clientName}`,
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
          <button className="primary" onClick={() => handleDownloadDoc(docTitle, clientName)}>
            تنزيل الوثيقة
          </button>
          <button onClick={() => showToast('تم فتح المعاينة الكاملة')}>فتح المعاينة الكاملة</button>
        </div>
      </div>,
      false,
      'تفاصيل الحساب'
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

  const handleOpenConsultantSession = (title, date) => {
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

  return (
    <div className="users-page-root">

      {/* ══════════════════════════════════════════════════════════════════
          HERO HEADER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="users-hero">
        <div>
          <h1>المستخدمون <em>والعملاء</em></h1>
        </div>
        <p>
          ملف موحّد لفهم العميل، صفته القانونية، قطاعه، نشاطه على المنصة، استهلاك الباقة، الاستشارات، أعضاء الحساب وسجل التفاعل.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SEARCHBAR & TOP FILTERS
          ══════════════════════════════════════════════════════════════════ */}
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
          <select value={legalTopFilter} onChange={(e) => setLegalTopFilter(e.target.value)}>
            <option value="">الصفة القانونية</option>
            <option value="فرد">فرد</option>
            <option value="مؤسسة فردية">مؤسسة فردية</option>
            <option value="شركة ذات مسؤولية محدودة">شركة ذات مسؤولية محدودة</option>
            <option value="شركة تضامن">شركة تضامن</option>
            <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
            <option value="شركة مساهمة عامة">شركة مساهمة عامة</option>
            <option value="شركة مساهمة خاصة">شركة مساهمة خاصة</option>
            <option value="جامعة">جامعة</option>
            <option value="أكاديمي وباحث">أكاديمي وباحث</option>
            <option value="جمعية ومنظمة">جمعية ومنظمة</option>
            <option value="جهة حكومية">جهة حكومية</option>
            <option value="هيئة عامة">هيئة عامة</option>
            <option value="هيئة خاصة">هيئة خاصة</option>
          </select>
        </div>

        <div className="users-top-filter">
          <select value={sectorTopFilter} onChange={(e) => setSectorTopFilter(e.target.value)}>
            <option value="">القطاع</option>
            <option value="خدمات">خدمات</option>
            <option value="تجارة">تجارة</option>
            <option value="صناعة">صناعة</option>
            <option value="مقاولات">مقاولات</option>
            <option value="زراعة">زراعة</option>
          </select>
        </div>

        <div className="users-top-filter">
          <select value={statusTopFilter} onChange={(e) => setStatusTopFilter(e.target.value)}>
            <option value="">حالة الحساب</option>
            <option value="نشط">نشط</option>
            <option value="غير نشط">غير نشط</option>
          </select>
        </div>

        <button className="users-search-btn" onClick={() => showToast(`تم العثور على ${filteredClients.length} عميل`)}>
          بحث العملاء
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT WITH SIDEBAR & CLIENT CARDS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="users-content">
        
        {/* Sticky Filters Sidebar */}
        <aside className="users-filters">
          <div className="users-filter-head">
            <h2>التصفية</h2>
            <button className="users-clear-btn" onClick={handleClearFilters}>
              مسح الكل
            </button>
          </div>

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

        {/* Client Cards Grid */}
        <main>
          <div className="users-results-tools">
            <div className="users-count">
              <b>{filteredClients.length}</b> مستخدمين
            </div>
            <div className="users-toolset">
              <div className="users-sort">
                <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
                  <option value="active">الأكثر نشاطًا</option>
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="consult">الأكثر استشارات</option>
                  <option value="name">الاسم أ–ي</option>
                </select>
              </div>
            </div>
          </div>

          {displayedClients.length > 0 ? (
            <div className="users-cards-grid">
              {displayedClients.map((c) => (
                <article key={c.id} className="user-card-item">
                  <div className="user-card-top">
                    <div className="user-avatar-box">
                      {c.initial}
                      {c.online && <i className="user-online-dot"></i>}
                    </div>
                    <div className="user-card-name">
                      <h3>{c.name}</h3>
                      <small>{c.legal} · {c.sector}</small>
                    </div>
                    <span className={`user-status-badge ${c.status === 'نشط' ? '' : 'inactive'}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="user-card-badges">
                    <span className="user-badge">{c.activity}</span>
                    <span className="user-badge orange">{c.plan}</span>
                  </div>

                  <div className="user-mini-stats">
                    <div className="user-mini-stat">
                      <b>{c.consult}</b>
                      <span>استشارة</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{c.video}</b>
                      <span>فيديو</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{c.chat}</b>
                      <span>محادثة</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{c.tickets}</b>
                      <span>تذاكر دعم</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button onClick={() => openConsultantProfile(c)}>
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

      {/* ══════════════════════════════════════════════════════════════════
          CONSULTANT PROFILE VIEW OVERLAY (PHASE 3)
          ══════════════════════════════════════════════════════════════════ */}
      {activeClient && (
        <div className="profile-overlay-wrapper">
          
          {/* Return bar tailored for Consultant */}
          <div className="profile-return-bar">
            <button onClick={closeConsultantProfile}>
              ← العودة إلى المستخدمين
            </button>
            <b>ملف المستخدم — عرض المستشار</b>
          </div>

          <div className="profile-viewport-shell">
            <div className="profile-shell-grid">
              
              {/* Consultant Header Card */}
              <section className="profile-card-header">
                <div className="profile-hero-band"></div>
                <div className="profile-top-info">
                  <div className="profile-avatar-large">
                    {activeClient.initial}
                    {activeClient.online && <i className="user-online-dot" style={{ width: 16, height: 16, border: '3px solid #fff' }}></i>}
                  </div>
                  <div className="profile-main-title">
                    <h1>{activeClient.name}</h1>
                    <div className="profile-tagline">{activeClient.legal} · {activeClient.activity}</div>
                    <div className="profile-meta-line">
                      <span>💼 {activeClient.sector}</span>
                      <span>🛡️ عميل موثّق</span>
                      <span>⏱️ آخر جلسة معك: 28 أغسطس 2026</span>
                    </div>
                  </div>
                  <div className="profile-right-meta">
                    <span className="account-id">العلاقة الاستشارية</span>
                    <strong>5 جلسات معك</strong>
                    <span className="consultant-context-pill" style={{ marginTop: 6, display: 'inline-block' }}>
                      {activeClient.online ? 'متصل الآن' : 'عميل نشط'}
                    </span>
                  </div>
                </div>

                <nav className="profile-nav-tabs">
                  {[
                    { id: 'c-overview', label: 'نظرة عامة' },
                    { id: 'c-client', label: 'بيانات العميل' },
                    { id: 'c-consults', label: 'الاستشارات' },
                    { id: 'c-docs', label: 'المستندات المشتركة' },
                    { id: 'c-notes', label: 'الملاحظات' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => scrollToTab(tab.id)}
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
                  
                  {/* Tab 1: Overview */}
                  <section className="profile-section-card" id="sec_c-overview">
                    <h2>نظرة عامة على العميل</h2>
                    <div className="profile-section-sub">المعلومات المهنية التي يحتاجها المستشار لفهم سياق العميل</div>
                    <div className="profile-info-grid">
                      <div className="profile-info-box"><small>الاسم / اسم المنشأة</small><b>{activeClient.name}</b></div>
                      <div className="profile-info-box"><small>الصفة القانونية</small><b>{activeClient.legal}</b></div>
                      <div className="profile-info-box"><small>القطاع</small><b>{activeClient.sector}</b></div>
                      <div className="profile-info-box"><small>النشاط الرئيسي</small><b>{activeClient.activity}</b></div>
                      <div className="profile-info-box"><small>الدولة</small><b>الأردن</b></div>
                      <div className="profile-info-box"><small>المدينة</small><b>{activeClient.city}</b></div>
                    </div>
                  </section>

                  {/* Tab 2: Tax Context */}
                  <section className="profile-section-card" id="sec_c-client">
                    <h2>السياق الضريبي للعميل</h2>
                    <div className="profile-section-sub">بيانات مختصرة ذات صلة مباشرة بالعمل الاستشاري</div>
                    <div className="profile-info-grid">
                      <div className="profile-info-box"><small>مسجل في ضريبة المبيعات</small><b>{activeClient.tax && activeClient.tax !== '—' ? 'نعم' : 'قيد التسجيل'}</b></div>
                      <div className="profile-info-box"><small>نوع المكلف</small><b>{activeClient.legal}</b></div>
                      <div className="profile-info-box"><small>النشاط الخاضع</small><b>{activeClient.activity}</b></div>
                      <div className="profile-info-box"><small>الرقم الضريبي</small><b>{activeClient.tax || '—'}</b></div>
                      <div className="profile-info-box"><small>آخر إقرار تمت مناقشته</small><b>{activeClient.sector === 'خدمات' ? 'إقرار ضريبة الدخل 2025' : 'إقرار ضريبة المبيعات والدخل'}</b></div>
                      <div className="profile-info-box"><small>حالة المتابعة</small><b>{activeClient.status === 'نشط' ? 'متابعة مفتوحة' : 'متابعة مكتملة'}</b></div>
                    </div>
                  </section>

                  {/* Tab 3: Consultations with this consultant */}
                  <section className="profile-section-card" id="sec_c-consults">
                    <h2>الاستشارات معك ({activeClient.consult || 0})</h2>
                    <div className="profile-section-sub">الجلسات التي تمت بين {activeClient.name} والمستشار الحالي فقط</div>
                    <div className="profile-activity-list">
                      {[
                        { title: `جلسة استشارة فيديو — ${activeClient.activity || 'المصاريف المقبولة ضريبيًا'}`, type: 'video', dur: '48 دقيقة', date: activeClient.last || '28 أغسطس' },
                        { title: `محادثة استشارية — الفوترة الإلكترونية والامتثال`, type: 'chat', dur: '18 رسالة', date: '12 أغسطس' },
                        { title: `جلسة استشارة فيديو — إقرار ضريبة الدخل`, type: 'video', dur: '55 دقيقة', date: '03 أغسطس' },
                        { title: `محادثة استشارية — ضريبة المبيعات ومعالجة الفواتير`, type: 'chat', dur: '11 رسالة', date: '22 يوليو' },
                        { title: `جلسة أولية — مراجعة الوضع الضريبي لـ ${activeClient.name}`, type: 'video', dur: '42 دقيقة', date: '08 يوليو' }
                      ].slice(0, Math.max(1, Math.min(5, activeClient.consult || 3))).map((sess, i) => (
                        <div
                          key={i}
                          className="profile-activity-item clickable-card"
                          onClick={() => handleOpenConsultantSession(sess.title, sess.date)}
                        >
                          <div className="profile-activity-ico">{sess.type === 'video' ? '📹' : '💬'}</div>
                          <div>
                            <b>{sess.title}</b>
                            <small>{sess.type === 'video' ? 'فيديو' : 'محادثة'} · {sess.dur} · مكتملة</small>
                          </div>
                          <time>{sess.date}</time>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tab 4: Shared Documents */}
                  <section className="profile-section-card" id="sec_c-docs">
                    <h2>المستندات المشتركة معك</h2>
                    <div className="profile-section-sub">لا تظهر هنا إلا المستندات التي شاركها {activeClient.name} مع هذا المستشار أو ارتبطت بجلساته</div>
                    <div className="profile-doc-list">
                      {[
                        { title: `إقرار ضريبة الدخل 2025 — ${activeClient.name}`, meta: 'PDF · مرتبط بآخر جلسة' },
                        { title: `كشف المصروفات والمدخلات (${activeClient.activity})`, meta: 'XLSX · مرتبط بالاستشارة' },
                        { title: 'إشعار تدقيق والبيانات المؤيدة', meta: 'PDF · تمت مشاركته حديثًا' },
                        { title: `شهادة التسجيل الضريبي (${activeClient.tax || '200123456'})`, meta: 'PDF · مرجع للملف الاستشاري' }
                      ].map((doc, i) => (
                        <div
                          key={i}
                          className="profile-doc-item clickable-card"
                          onClick={() => handleOpenSharedDoc(doc.title, activeClient.name)}
                        >
                          <div className="profile-doc-ico">📄</div>
                          <div>
                            <strong>{doc.title}</strong>
                            <small>{doc.meta}</small>
                          </div>
                          <span className="profile-verified-tag">مشترك</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tab 5: Consultant Private Notes */}
                  <section className="profile-section-card" id="sec_c-notes">
                    <h2>ملاحظات المستشار حول ({activeClient.name})</h2>
                    <div className="profile-section-sub">ملاحظات مهنية خاصة بك مرتبطة بعلاقتك الاستشارية مع هذا العميل</div>
                    
                    {/* Add note composer */}
                    <div style={{ background: '#F8FAFB', border: '1px solid var(--admin-line)', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
                      <b style={{ color: 'var(--admin-navy)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>إضافة ملاحظة جديدة حول {activeClient.name}:</b>
                      <input
                        type="text"
                        placeholder="عنوان الملاحظة..."
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--admin-line)', marginBottom: '8px', fontSize: '11px', outline: 0 }}
                      />
                      <textarea
                        placeholder="اكتب الملاحظة والتوصيات المهنية..."
                        value={newNoteBody}
                        onChange={(e) => setNewNoteBody(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--admin-line)', marginBottom: '10px', fontSize: '11px', outline: 0, resize: 'vertical' }}
                      />
                      <button
                        onClick={handleAddNote}
                        style={{ background: 'var(--admin-navy)', color: '#FFFFFF', border: 0, borderRadius: '999px', padding: '8px 16px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
                      >
                        + حفظ الملاحظة
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {clientNotes.map((note) => (
                        <div key={note.id} style={{ border: '1px solid #E1E8EC', borderRadius: '15px', padding: '14px 15px', background: '#FBFCFD' }}>
                          <b style={{ display: 'block', color: 'var(--admin-navy)', fontSize: '11px', marginBottom: '5px' }}>{note.title}</b>
                          <p style={{ margin: 0, color: 'var(--admin-muted)', fontSize: '10px', lineHeight: '1.85' }}>{note.body}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              </main>

              {/* Side Scroll Rail for Consultant */}
              <aside className="profile-side-scroll">
                
                {/* 1. Consultant Relationship KPIs */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>العلاقة الاستشارية</h3>
                    <span className="profile-live-tag">
                      {activeClient.online ? 'متصل الآن' : 'نشط'}
                    </span>
                  </div>
                  <div className="profile-kpi-grid">
                    <div className="profile-kpi-box clickable-card" onClick={() => scrollToTab('c-consults')}>
                      <small>استشارات معك</small>
                      <b>{activeClient.consult || 0}</b>
                      <span>{activeClient.joined || 'منذ الانضمام'}</span>
                    </div>
                    <div className="profile-kpi-box clickable-card" onClick={() => scrollToTab('c-consults')}>
                      <small>جلسات مكتملة</small>
                      <b>{activeClient.success || activeClient.consult || 0}</b>
                      <span>100% مكتملة</span>
                    </div>
                    <div className="profile-kpi-box clickable-card" onClick={() => scrollToTab('c-consults')}>
                      <small>مكالمات فيديو</small>
                      <b>{activeClient.video || 0}</b>
                      <span>ضمن علاقتك فقط</span>
                    </div>
                    <div className="profile-kpi-box clickable-card" onClick={() => scrollToTab('c-consults')}>
                      <small>محادثات</small>
                      <b>{activeClient.chat || 0}</b>
                      <span>ضمن علاقتك فقط</span>
                    </div>
                  </div>
                </section>

                {/* 2. Next Session */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>الجلسة القادمة</h3>
                    <span className="user-badge orange">مؤكدة</span>
                  </div>
                  <div className="next-session-card clickable-card" onClick={() => handleOpenConsultantSession(`الجلسة القادمة — ${activeClient.activity || 'ضريبة الدخل'}`, '1 سبتمبر')}>
                    <div className="date" style={{ color: 'var(--admin-orange)', fontSize: '9px', fontWeight: '900', marginBottom: '5px' }}>
                      الثلاثاء، 1 سبتمبر · 10:30 صباحًا
                    </div>
                    <b style={{ color: 'var(--admin-navy)', fontSize: '13px' }}>{activeClient.activity || 'ضريبة الدخل — المصاريف المقبولة'}</b>
                    <small style={{ display: 'block', color: 'var(--admin-muted)', fontSize: '9px', marginTop: '5px' }}>
                      جلسة فيديو · 60 دقيقة
                    </small>
                  </div>
                </section>

                {/* 3. Last Consultation */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>آخر استشارة</h3>
                    <small style={{ color: 'var(--admin-muted)' }}>{activeClient.last || '28 أغسطس'}</small>
                  </div>
                  <div className="next-session-card clickable-card" onClick={() => handleOpenConsultantSession(`استشارة ${activeClient.activity || 'المصاريف المقبولة'}`, activeClient.last || '28 أغسطس')}>
                    <div className="date" style={{ color: 'var(--admin-navy)', fontSize: '9px', fontWeight: '900', marginBottom: '5px' }}>
                      فيديو · 48 دقيقة
                    </div>
                    <b style={{ color: 'var(--admin-navy)', fontSize: '13px' }}>{activeClient.activity || 'المصاريف المقبولة ضريبيًا'}</b>
                    <small style={{ display: 'block', color: 'var(--admin-muted)', fontSize: '9px', marginTop: '5px' }}>
                      تم إعداد الملخص · 3 توصيات · مستندان مرفقان
                    </small>
                  </div>
                </section>

                {/* 4. Topics Worked On */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>مواضيع عملنا عليها</h3>
                    <small style={{ color: 'var(--admin-muted)' }}>مع {activeClient.name}</small>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { topic: 'ضريبة الدخل', count: Math.max(1, Math.ceil((activeClient.consult || 4) / 2)) },
                      { topic: 'ضريبة المبيعات', count: Math.max(1, Math.floor((activeClient.consult || 4) / 3)) },
                      { topic: 'الفوترة الإلكترونية', count: 2 },
                      { topic: 'الاعتراضات الضريبية', count: 1 }
                    ].map((item, i) => (
                      <div key={i} className="profile-ticket-item clickable-card" onClick={() => showToast(`الموضوع: ${item.topic} (تمت مناقشته ${item.count} مرات)`)}>
                        <b style={{ fontSize: '10px' }}>{item.topic}</b>
                        <span style={{ minWidth: '30px', height: '25px', display: 'grid', placeItems: 'center', borderRadius: '999px', background: '#EEF3F6', color: '#164D70', fontSize: '9px', fontWeight: '900' }}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 5. Recent Shared Documents */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>مستندات حديثة</h3>
                    <small style={{ color: 'var(--admin-muted)' }}>مشتركة معك</small>
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div className="profile-ticket-item clickable-card" onClick={() => handleOpenSharedDoc(`إقرار ضريبة الدخل 2025 — ${activeClient.name}`, activeClient.name)}>
                      <b>إقرار ضريبة الدخل 2025</b>
                      <span className="done">PDF</span>
                    </div>
                    <div className="profile-ticket-item clickable-card" onClick={() => handleOpenSharedDoc(`كشف المصروفات (${activeClient.activity})`, activeClient.name)}>
                      <b>كشف المصروفات</b>
                      <span className="done">XLSX</span>
                    </div>
                    <div className="profile-ticket-item clickable-card" onClick={() => handleOpenSharedDoc(`شهادة التسجيل الضريبي (${activeClient.tax || '200123456'})`, activeClient.name)}>
                      <b>شهادة التسجيل الضريبي</b>
                      <span className="done">PDF</span>
                    </div>
                  </div>
                </section>

              </aside>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODALS HIERARCHY
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

      {/* Toast Notification */}
      {toastMsg && (
        <div className="drill-toast-box">
          {toastMsg}
        </div>
      )}

    </div>
  );
}
