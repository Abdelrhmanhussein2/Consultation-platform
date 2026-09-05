/**
 * ConsultantsPage.jsx — صفحة تصفح المستشارين
 *
 * مُقسَّم إلى ملفات منفصلة:
 *  - consultantFilterUtils.js  → منطق الفلترة والفرز
 *  - ConsultantListCard.jsx    → بطاقة المستشار
 *  - ConsultantFullProfile.jsx → صفحة الملف الكامل
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { consultantService } from '../../services/consultantService';
import { appointmentService } from '../../services/appointmentService';
import BookingModal  from '../../components/Consultants/BookingModal';
import PaymentModal  from '../../components/Consultants/PaymentModal';
import ConsultantListCard    from './ConsultantListCard';
import ConsultantFullProfile from './ConsultantFullProfile';
import { applyFilters, applySorting, buildPageNums, CITIES, COMM, CHIPS, PAGE_SIZE } from './consultantFilterUtils';

/* ── CSS ──────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  .cp-root { font-family: 'Cairo', sans-serif; direction: rtl; background: #F8FAFC; min-height: 100vh; color: #0B2E4B; }

  /* Hero */
  .cp-hero { background: linear-gradient(135deg,#0B2E4B,#164D70); color:#fff; padding:40px 32px 32px; }
  .cp-hero h1 { margin:0; font-size:clamp(22px,3vw,34px); font-weight:900; line-height:1.3; }
  .cp-hero h1 em { color:#F59A23; font-style:normal; }
  .cp-hero p  { margin:12px 0 0; font-size:14px; color:rgba(255,255,255,0.75); max-width:600px; line-height:1.7; }

  /* Search bar */
  .cp-searchbar { display:flex; flex-wrap:wrap; gap:10px; padding:18px 32px; background:#fff; border-bottom:1px solid #E2E8F0; align-items:center; }
  .cp-search-input { flex:1; min-width:220px; display:flex; align-items:center; gap:8px; background:#F1F5F9; border:1px solid #E2E8F0; border-radius:30px; padding:8px 16px; }
  .cp-search-input input { flex:1; border:0; background:transparent; outline:0; font-family:inherit; font-size:14px; color:#0B2E4B; }
  .cp-search-input input::placeholder { color:#94A3B8; }
  .cp-top-filter { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:#64748B; }
  .cp-top-select { border:1px solid #E2E8F0; border-radius:20px; padding:7px 12px; font-family:inherit; font-size:13px; color:#0B2E4B; background:#fff; cursor:pointer; outline:none; }
  .cp-search-btn { background:#F59A23; color:#fff; border:0; border-radius:30px; padding:10px 22px; font-family:inherit; font-weight:800; font-size:13px; cursor:pointer; transition:background .15s; }
  .cp-search-btn:hover { background:#DF820F; }

  /* Content grid */
  .cp-content { display:grid; grid-template-columns:260px 1fr; gap:24px; padding:24px 32px; max-width:1400px; margin:0 auto; align-items:start; }

  /* Sidebar filters */
  .cp-filters { background:#fff; border-radius:18px; padding:20px; border:1px solid #E2E8F0; position:sticky; top:20px; max-height:calc(100vh - 40px); overflow-y:auto; }
  .cp-filter-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
  .cp-filter-top h2 { margin:0; font-size:17px; font-weight:900; color:#0B2E4B; }
  .cp-clear-btn { border:0; background:transparent; color:#F59A23; font-family:inherit; font-size:12px; font-weight:800; cursor:pointer; }
  .cp-filter-group { margin-bottom:18px; padding-bottom:18px; border-bottom:1px solid #F1F5F9; }
  .cp-filter-group:last-child { border-bottom:none; margin-bottom:0; }
  .cp-filter-label { font-size:12px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:.05em; margin-bottom:10px; }
  .cp-checks { display:flex; flex-direction:column; gap:8px; }
  .cp-checks label { display:flex; align-items:center; gap:8px; font-size:13px; color:#334155; cursor:pointer; font-weight:600; }
  .cp-checks input { accent-color:#F59A23; width:15px; height:15px; cursor:pointer; }
  .cp-chip-row { display:flex; flex-wrap:wrap; gap:6px; }
  .cp-chip { border:1px solid #E2E8F0; background:#F8FAFC; color:#334155; border-radius:20px; padding:5px 12px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
  .cp-chip.active,.cp-chip:hover { background:#FFF3DC; border-color:#F59A23; color:#C97D00; }

  /* Results area */
  .cp-main-area { min-height:400px; }
  .cp-results-tools { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
  .cp-count { font-size:14px; color:#64748B; font-weight:600; }
  .cp-count b { color:#0B2E4B; font-weight:900; font-size:16px; }
  .cp-view-sort { display:flex; align-items:center; gap:16px; }
  .cp-view-toggle { display:flex; border:1px solid #E2E8F0; border-radius:10px; overflow:hidden; }
  .cp-view-toggle button { border:0; background:#fff; padding:7px 12px; cursor:pointer; font-size:14px; color:#94A3B8; transition:all .15s; }
  .cp-view-toggle button.active { background:#0B2E4B; color:#fff; }
  .cp-sort { display:flex; align-items:center; gap:8px; font-size:13px; color:#64748B; font-weight:600; }
  .cp-sort select { border:1px solid #E2E8F0; border-radius:20px; padding:6px 12px; font-family:inherit; font-size:13px; color:#0B2E4B; background:#fff; cursor:pointer; outline:none; }

  /* Cards grid/list */
  .cp-cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
  .cp-cards-list { display:flex; flex-direction:column; gap:16px; }

  /* Consultant card */
  .cp-card { background:#fff; border-radius:20px; border:1px solid #E2E8F0; overflow:hidden; cursor:pointer; transition:box-shadow .2s,transform .2s; }
  .cp-card:hover { box-shadow:0 12px 40px rgba(11,46,75,0.12); transform:translateY(-2px); }
  .cp-card.is-me-card { border:2px solid #005D9C; background:#F0F9FF; }
  .cp-photo-wrap { position:relative; height:120px; background:linear-gradient(135deg,#0B2E4B,#164D70); overflow:hidden; }
  .cp-photo-wrap img { width:100%; height:100%; object-fit:cover; }
  .cp-avatar-initials { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:900; color:#fff; }
  .cp-topic-pill { position:absolute; top:10px; right:10px; background:rgba(11,46,75,0.85); color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; }
  .cp-rating-pill { position:absolute; top:10px; left:10px; background:rgba(245,154,35,0.92); color:#fff; font-size:11px; font-weight:800; padding:3px 10px; border-radius:20px; }
  .cp-available-dot { position:absolute; bottom:10px; right:10px; background:#16A36D; color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; }
  .cp-card-body { padding:16px; }
  .cp-name-price { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px; }
  .cp-name-price h3 { margin:0; font-size:15px; font-weight:800; color:#0B2E4B; line-height:1.3; }
  .cp-price { font-size:15px; font-weight:900; color:#F59A23; white-space:nowrap; }
  .cp-price span { font-size:10px; color:#94A3B8; font-weight:600; }
  .cp-meta { font-size:11px; color:#64748B; margin-bottom:6px; font-weight:600; }
  .cp-tier { display:inline-block; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; border-radius:20px; padding:2px 10px; font-size:10px; font-weight:800; margin-bottom:8px; }
  .cp-desc { font-size:12px; color:#475569; line-height:1.6; margin:0 0 14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .cp-card-actions { display:flex; gap:8px; }
  .cp-view-btn { flex:1; border:1px solid #0B2E4B; background:#fff; color:#0B2E4B; border-radius:20px; padding:8px; font-family:inherit; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; }
  .cp-view-btn:hover { background:#0B2E4B; color:#fff; }
  .cp-book-btn { flex:1; border:0; background:linear-gradient(135deg,#F59A23,#DF820F); color:#fff; border-radius:20px; padding:8px; font-family:inherit; font-size:12px; font-weight:800; cursor:pointer; transition:opacity .15s; }
  .cp-book-btn:hover { opacity:0.88; }

  /* Loading / Empty */
  .cp-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:80px 20px; color:#64748B; }
  .cp-spinner { width:40px; height:40px; border:3px solid #E2E8F0; border-top-color:#F59A23; border-radius:50%; animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .cp-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:80px 20px; color:#64748B; }
  .cp-empty-icon { font-size:52px; margin-bottom:16px; }
  .cp-empty h3 { margin:0 0 8px; color:#0B2E4B; font-size:20px; }
  .cp-empty p { margin:0; font-size:14px; }

  /* Pagination */
  .cp-pagination { display:flex; justify-content:center; gap:6px; margin-top:28px; align-items:center; }
  .cp-pagination button { border:1px solid #E2E8F0; background:#fff; color:#0B2E4B; border-radius:10px; width:36px; height:36px; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; }
  .cp-pagination button.active { background:#0B2E4B; color:#fff; border-color:#0B2E4B; }
  .cp-pagination button:hover:not(.active) { background:#F1F5F9; }

  /* Toast */
  .cp-toast-backdrop { position:fixed; bottom:24px; right:24px; z-index:9999; }
  .cp-toast { display:flex; align-items:center; gap:12px; background:#0B2E4B; color:#fff; padding:14px 20px; border-radius:14px; font-size:13px; font-weight:700; box-shadow:0 8px 24px rgba(0,0,0,0.15); animation:slideUp .3s ease; }
  .cp-toast-icon { color:#16A36D; flex-shrink:0; }
  @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

  /* ── Full Profile View ──────────────────────────────────────────── */
  .profile-spa-view { background:#F8FAFC; min-height:100vh; }
  .profile-spa-topbar { display:flex; justify-content:space-between; align-items:center; padding:12px 28px; background:#fff; border-bottom:1px solid #E2E8F0; position:sticky; top:0; z-index:50; }
  .profile-spa-back-btn { border:1px solid #E2E8F0; background:#fff; color:#0B2E4B; border-radius:20px; padding:8px 18px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer; transition:all .15s; }
  .profile-spa-back-btn:hover { background:#0B2E4B; color:#fff; }
  .profile-hero-card { background:#fff; border-bottom:1px solid #E2E8F0; padding:0 28px 0; }
  .profile-cover-bg { height:90px; background:linear-gradient(135deg,#0B2E4B,#164D70); margin:0 -28px; }
  .profile-main-info { display:grid; grid-template-columns:auto 1fr auto; gap:20px; align-items:flex-start; padding:0 0 16px; margin-top:-40px; }
  .profile-avatar-box { width:80px; height:80px; border-radius:50%; border:4px solid #fff; background:linear-gradient(135deg,#F59A23,#DF820F); color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.15); flex-shrink:0; }
  .profile-avatar-box img { width:100%; height:100%; object-fit:cover; }
  .profile-details-head { padding-top:46px; }
  .profile-tagline-text { font-size:13px; color:#475569; line-height:1.6; margin:6px 0 0; max-width:560px; }
  .profile-meta-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:6px; font-size:13px; color:#64748B; }
  .profile-price-action { padding-top:46px; text-align:left; min-width:120px; }
  .profile-price-val { font-size:28px; font-weight:900; color:#0B2E4B; }
  .profile-book-now-btn { background:linear-gradient(135deg,#F59A23,#DF820F); color:#fff; border:0; border-radius:25px; padding:10px 20px; font-family:inherit; font-weight:800; font-size:13px; cursor:pointer; margin-top:8px; white-space:nowrap; box-shadow:0 4px 14px rgba(245,154,35,0.3); }
  .profile-nav-tabs { display:flex; gap:0; border-top:1px solid #F1F5F9; overflow-x:auto; }
  .profile-nav-tabs button { border:0; background:transparent; color:#64748B; padding:14px 18px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; border-bottom:3px solid transparent; transition:all .15s; white-space:nowrap; }
  .profile-nav-tabs button.active,.profile-nav-tabs button:hover { color:#F59A23; border-bottom-color:#F59A23; }
  .profile-grid-layout { display:grid; grid-template-columns:1fr 360px; gap:24px; padding:24px 28px; max-width:1300px; margin:0 auto; align-items:start; }
  .profile-main-column { display:flex; flex-direction:column; gap:20px; max-height:calc(100vh - 200px); overflow-y:auto; padding-left:4px; }
  .left-sidebar-stack { display:flex; flex-direction:column; gap:16px; position:sticky; top:20px; max-height:calc(100vh - 80px); overflow-y:auto; }
  .profile-section-card { background:#fff; border:1px solid #E2E8F0; border-radius:18px; padding:24px; }
  .profile-section-card h2 { margin:0 0 14px; font-size:20px; font-weight:900; color:#0B2E4B; padding-bottom:14px; border-bottom:1px solid #F1F5F9; }
  .profile-stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:20px; }
  .profile-stat-box { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:16px; text-align:center; }
  .profile-stat-box small { display:block; color:#64748B; font-size:12px; font-weight:600; }
  .profile-stat-box b { display:block; margin-top:6px; font-size:17px; color:#0B2E4B; font-weight:800; }

  /* Booking widget */
  .booking-widget-card { background:#fff; border:1px solid #E2E8F0; border-radius:20px; padding:20px; }
  @keyframes widgetPulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,154,35,0)} 50%{box-shadow:0 0 0 10px rgba(245,154,35,0.25)} }
  .widget-pulse { animation:widgetPulse .6s ease 2; }
  .booking-durations { display:grid; gap:8px; margin:14px 0; }
  .booking-dur-item { display:flex; align-items:center; gap:8px; padding:10px 14px; border:1px solid #E2E8F0; border-radius:14px; cursor:pointer; transition:all .15s; background:#F8FAFC; font-size:13px; font-weight:700; color:#0B2E4B; }
  .booking-dur-item.active { background:#FFF3DC; border-color:#F59A23; color:#C97D00; }
  .booking-dur-item small { font-size:10px; color:#94A3B8; }
  .booking-days-row { display:flex; gap:6px; margin:14px 0; overflow-x:auto; padding-bottom:4px; }
  .booking-day-btn { flex-shrink:0; border:1px solid #E2E8F0; background:#F8FAFC; border-radius:12px; padding:8px 10px; font-family:inherit; font-size:11px; cursor:pointer; text-align:center; transition:all .15s; color:#64748B; font-weight:700; }
  .booking-day-btn.available { background:#F0FDF4; border-color:#BBF7D0; color:#166534; }
  .booking-day-btn.active { background:#0B2E4B; border-color:#0B2E4B; color:#fff; }
  .booking-slots-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:14px; }
  .booking-slot-btn { border:1px solid #E2E8F0; background:#F8FAFC; border-radius:10px; padding:8px 4px; font-family:inherit; font-size:12px; font-weight:700; color:#0B2E4B; cursor:pointer; transition:all .15s; }
  .booking-slot-btn.active { background:#F59A23; border-color:#F59A23; color:#fff; }
  .booking-slot-btn:hover:not(.active) { background:#FFF3DC; border-color:#F59A23; }

  /* Quick overview */
  .quick-overview-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #F1F5F9; font-size:13px; }
  .quick-overview-row:last-child { border-bottom:none; }
  .quick-overview-label { color:#64748B; font-weight:600; }
  .quick-overview-val { color:#0B2E4B; font-weight:800; }

  /* Ask Question */
  .ask-question-card { background:#0B2E4B; color:#fff; border-radius:20px; padding:22px; box-shadow:0 6px 20px rgba(11,46,75,0.15); }
  .ask-question-input-wrap { display:flex; background:rgba(255,255,255,0.12); border-radius:30px; padding:4px 6px; margin-top:14px; border:1px solid rgba(255,255,255,0.2); }
  .ask-question-input-wrap input { flex:1; background:transparent; border:0; outline:0; color:#fff; font-family:inherit; padding:0 14px; font-size:12.5px; }
  .ask-question-input-wrap input::placeholder { color:#94A3B8; }
  .ask-question-btn { border:0; background:#F59A23; color:#fff; border-radius:25px; padding:8px 18px; font-weight:800; font-size:12px; cursor:pointer; font-family:inherit; }

  /* Reviews */
  .cp-review-box { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:18px; }
  .cp-review-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  .cp-reviewer-info { display:flex; align-items:center; gap:12px; }
  .cp-reviewer-avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#0B2E4B,#164D70); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; }
  .cp-reviewer-name { font-weight:800; font-size:14px; color:#0B2E4B; }
  .cp-reviewer-tag { font-size:11px; color:#16A36D; font-weight:700; }
  .cp-review-date { font-size:12px; color:#94A3B8; }
  .cp-review-stars { font-size:14px; margin-bottom:8px; }
  .cp-review-body { margin:0; font-size:13px; color:#475569; line-height:1.7; }

  /* Topic card */
  .topic-card-item { border-radius:14px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:transform .15s; margin-bottom:10px; }
  .topic-card-item:hover { transform:translateX(-4px); }

  @media(max-width:900px) {
    .cp-content { grid-template-columns:1fr; }
    .cp-filters { position:static; }
    .cp-cards-grid { grid-template-columns:1fr !important; }
    .profile-main-info { grid-template-columns:1fr; }
    .profile-price-action { text-align:right; }
    .profile-grid-layout { grid-template-columns:1fr; }
    .profile-main-column,.left-sidebar-stack { max-height:none; overflow-y:visible; }
  }
`;

/* ── Main component ───────────────────────────────────────────────── */
export default function ConsultantsPage({ navigate }) {
  const { token, user } = useAuth();

  // Data
  const [all, setAll]       = useState([]);
  const [specs, setSpecs]   = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selected, setSelected]         = useState(null);
  const [viewProfile, setViewProfile]   = useState(null);
  const [scrollToBooking, setScrollToBooking] = useState(false);
  const [toast, setToast]               = useState('');
  const [paymentData, setPaymentData]   = useState(null);
  const [errorModal, setErrorModal]     = useState('');
  const [view, setView]                 = useState('grid');
  const [sort, setSort]                 = useState('best');
  const [page, setPage]                 = useState(1);

  // Filter state
  const [search, setSearch]   = useState('');
  const [cityF, setCityF]     = useState('');
  const [availF, setAvailF]   = useState(false);
  const [selSpecs, setSelSpecs] = useState([]);
  const [selComms, setSelComms] = useState([]);
  const [chip, setChip]       = useState(null);   // price chip index
  const [minRat, setMinRat]   = useState('');

  // ── Helpers ────────────────────────────────────────────────────────
  const isConsultantMe = useCallback(c => {
    if (!user) return false;
    if (user.id && (c.user_id === user.id || c.profile_id === user.id)) return true;
    if (user.email && c.email && user.email.toLowerCase() === c.email.toLowerCase()) return true;
    return false;
  }, [user]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Fetch from backend ─────────────────────────────────────────────
  // Backend handles: min_rating + price chip (min_price/max_price)
  // All other filters are applied client-side
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const f = {};
      if (minRat) f.min_rating = parseFloat(minRat);
      if (chip !== null) {
        const c = CHIPS[chip];
        if (c.max) f.max_price = c.max;
        if (c.min) f.min_price = c.min;
      }
      const [cd, sd] = await Promise.all([
        consultantService.getConsultants(f, token),
        consultantService.getSpecializations()
      ]);
      setAll(Array.isArray(cd) ? cd : []);
      setSpecs(Array.isArray(sd) ? sd : []);
    } catch (e) {
      console.error('fetchData error:', e);
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, [minRat, chip, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Client-side filter + sort ──────────────────────────────────────
  const filtered = applyFilters(all, { search, selSpecs, selComms, cityF, availF });
  const sorted   = applySorting(filtered, sort);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged    = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNums = buildPageNums(totalPages, page);

  // ── Filter actions ─────────────────────────────────────────────────
  const reset = () => { setSelSpecs([]); setSelComms([]); setChip(null); setMinRat(''); setCityF(''); setAvailF(false); setSearch(''); setPage(1); };
  const toggleSpec = id => { const s = String(id); setSelSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); setPage(1); };
  const toggleComm = v  => { setSelComms(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]); setPage(1); };

  // ── Navigation ─────────────────────────────────────────────────────
  const handleBookNowFromCatalog = c => {
    const id = c?.profile_id || c?.id;
    if (id) window.history.pushState({ consultantId: id }, '', `/consultants/${id}`);
    setViewProfile(c); setScrollToBooking(true);
  };
  const handleViewProfileFromCatalog = c => {
    const id = c?.profile_id || c?.id;
    if (id) window.history.pushState({ consultantId: id }, '', `/consultants/${id}`);
    setViewProfile(c); setScrollToBooking(false);
  };

  // ── Booking ────────────────────────────────────────────────────────
  const handleBookRequest = async pData => {
    showToast('جاري تسجيل طلب الحجز...');
    try {
      const getCookie = name => { try { const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)')); return m ? decodeURIComponent(m[2]) : null; } catch { return null; } };
      const activeToken = token || getCookie('token');
      const isUuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const consultantId = isUuid(pData?.consultant_id) ? pData.consultant_id : 'c2264e0d-7229-481a-9718-8657077c42fe';

      await appointmentService.bookAppointment({
        consultant_id: consultantId,
        service_id:    isUuid(pData?.service_id) ? pData.service_id : null,
        scheduled_at:  pData?.scheduled_at || new Date().toISOString(),
        notes:         pData?.serviceName || 'طلب حجز استشارة'
      }, activeToken);

      setToast('');
      showToast('تم إرسال طلب الحجز بنجاح. الاستشارة الآن قيد انتظار موافقة المستشار.');
      setTimeout(() => { if (typeof navigate === 'function') navigate('/my-appointments'); else window.location.href = '/my-appointments'; }, 1200);
    } catch (err) {
      setToast('');
      setErrorModal(err?.detail || err?.message || 'حدث خطأ أثناء الحجز');
    }
  };

  // ── Full Profile View ──────────────────────────────────────────────
  if (viewProfile) {
    return (
      <>
        <style>{CSS}</style>
        <div className="cp-root">
          <ConsultantFullProfile
            consultant={viewProfile}
            onClose={() => { window.history.replaceState({}, '', '/consultants'); setViewProfile(null); setScrollToBooking(false); }}
            onBook={c => setSelected(c)}
            onBookRequest={handleBookRequest}
            scrollToBookingOnMount={scrollToBooking}
          />
          <BookingModal consultant={selected} isOpen={!!selected} onClose={() => setSelected(null)}
            onSuccess={() => { setSelected(null); showToast('تم حجز الاستشارة بنجاح'); navigate && navigate('/my-appointments'); }} />
          <PaymentModal isOpen={!!paymentData} onClose={() => setPaymentData(null)}
            onSuccess={() => { setPaymentData(null); showToast('تم دفع الاستشارة بنجاح وتأكيد الحجز'); if (navigate) navigate('/my-appointments'); }}
            price={paymentData?.price || 42.50} consultantName={paymentData?.consultantName || 'مستشار'} serviceName={paymentData?.serviceName || 'استشارة'} isMock={true} />
          {toast && <div className="cp-toast-backdrop"><div className="cp-toast"><div className="cp-toast-icon">✓</div><div>{toast}</div></div></div>}
          {errorModal && (
            <div onClick={() => setErrorModal('')} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(13,60,92,0.5)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <div onClick={e => e.stopPropagation()} style={{ background:'#fff',borderRadius:'18px',padding:'36px 32px',maxWidth:'400px',width:'90%',textAlign:'center',direction:'rtl' }}>
                <div style={{ width:'64px',height:'64px',borderRadius:'50%',background:'#FEE2E2',border:'3px solid #FECACA',margin:'0 auto 18px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <h3 style={{ fontSize:'18px',fontWeight:'800',color:'#0D3C5C',margin:'0 0 10px' }}>فشل الحجز</h3>
                <p style={{ fontSize:'14px',color:'#64748B',margin:'0 0 24px',lineHeight:1.7 }}>{errorModal}</p>
                <button onClick={() => setErrorModal('')} style={{ width:'100%',padding:'12px 0',borderRadius:'10px',border:'none',background:'#EF4444',color:'#fff',fontWeight:'700',fontSize:'14px',cursor:'pointer' }}>
                  حسناً، سأختار وقتاً آخر
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Listing View ───────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="cp-root">

        {/* Hero */}
        <section className="cp-hero">
          <div><h1>اعثر على <em>المستشار المناسب</em><br/>بسهولة وسرعة.</h1></div>
          <p>جميع المستشارين المعروضين موثّقون ومعتمدون. استخدم الفلاتر حسب التخصص، السعر، التقييم والتوفر للوصول إلى المستشار الأنسب لك.</p>
        </section>

        {/* Search bar */}
        <div className="cp-searchbar">
          <div className="cp-search-input">
            <span style={{ color:'#94A3B8',fontSize:'18px' }}>⌕</span>
            <input
              placeholder="ابحث باسم المستشار أو المجال الضريبي..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setPage(1); }}
            />
          </div>
          <div className="cp-top-filter">
            <label>التوفر:</label>
            <select className="cp-top-select" value={availF ? 'now' : ''} onChange={e => { setAvailF(e.target.value === 'now'); setPage(1); }}>
              <option value="">أي وقت</option>
              <option value="now">متاح الآن</option>
            </select>
          </div>
          <div className="cp-top-filter">
            <label>المدينة:</label>
            <select className="cp-top-select" value={cityF} onChange={e => { setCityF(e.target.value); setPage(1); }}>
              <option value="">أي مكان</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button className="cp-search-btn" onClick={() => setPage(1)}>ابحث الآن ←</button>
        </div>

        {/* Content grid */}
        <div className="cp-content">

          {/* Sidebar */}
          <aside className="cp-filters">
            <div className="cp-filter-top">
              <h2>الفلاتر</h2>
              <button className="cp-clear-btn" onClick={reset}>مسح الكل</button>
            </div>

            {/* Specialization */}
            <div className="cp-filter-group">
              <div className="cp-filter-label">المجال</div>
              <div className="cp-checks">
                {specs.slice(0, 8).map(s => (
                  <label key={s.id}>
                    <input type="checkbox" checked={selSpecs.includes(String(s.id))} onChange={() => toggleSpec(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            {/* City */}
            <div className="cp-filter-group">
              <div className="cp-filter-label">المدينة</div>
              <div className="cp-checks">
                {CITIES.map(c => (
                  <label key={c}>
                    <input type="checkbox" checked={cityF === c} onChange={() => { setCityF(cityF === c ? '' : c); setPage(1); }} />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            {/* Service type */}
            <div className="cp-filter-group">
              <div className="cp-filter-label">نوع الخدمة</div>
              <div className="cp-checks">
                {COMM.map(m => (
                  <label key={m.v}>
                    <input type="checkbox" checked={selComms.includes(m.v)} onChange={() => toggleComm(m.v)} />
                    {m.l}
                  </label>
                ))}
              </div>
            </div>

            {/* Price chip */}
            <div className="cp-filter-group">
              <div className="cp-filter-label">السعر / الجلسة</div>
              <div className="cp-chip-row">
                {CHIPS.map((c, i) => (
                  <button key={i} className={`cp-chip${chip === i ? ' active' : ''}`}
                    onClick={() => { setChip(chip === i ? null : i); setPage(1); }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="cp-filter-group">
              <div className="cp-filter-label">التقييم</div>
              <div className="cp-checks">
                {[{v:'4.7',l:'4.7 فأعلى'},{v:'4.5',l:'4.5 فأعلى'},{v:'4.0',l:'4.0 فأعلى'}].map(r => (
                  <label key={r.v}>
                    <input type="radio" name="cpRating" checked={minRat === r.v} onChange={() => { setMinRat(minRat === r.v ? '' : r.v); setPage(1); }} />
                    {r.l}
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="cp-filter-group">
              <div className="cp-filter-label">التوفر</div>
              <div className="cp-checks">
                <label>
                  <input type="checkbox" checked={availF} onChange={() => { setAvailF(v => !v); setPage(1); }} />
                  متاح الآن
                </label>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="cp-main-area">
            <div className="cp-results-tools">
              <div className="cp-count">
                {loading ? '...' : <><b>{sorted.length}</b> مستشار مطابق</>}
              </div>
              <div className="cp-view-sort">
                <div className="cp-view-toggle">
                  <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="شبكي">▦</button>
                  <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="قائمة">☰</button>
                </div>
                <div className="cp-sort">
                  <span>ترتيب حسب:</span>
                  <select value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="best">الأفضل تطابقاً</option>
                    <option value="rating">الأعلى تقييماً</option>
                    <option value="priceLow">السعر الأقل</option>
                    <option value="priceHigh">السعر الأعلى</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="cp-loading"><div className="cp-spinner"/><p>جاري تحميل دليل المستشارين...</p></div>
            ) : paged.length === 0 ? (
              <div className="cp-empty">
                <div className="cp-empty-icon">🔍</div>
                <h3>لا يوجد مستشارون مطابقون</h3>
                <p>جرّب تغيير معايير البحث أو إزالة بعض الفلاتر.</p>
                <button style={{ marginTop:'16px',background:'#F59A23',color:'#fff',border:'none',borderRadius:'999px',padding:'10px 24px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit' }} onClick={reset}>
                  مسح جميع الفلاتر
                </button>
              </div>
            ) : (
              <div className="cp-cards-container">
                <div className={view === 'list' ? 'cp-cards-list' : 'cp-cards-grid'}>
                  {paged.map((c, i) => (
                    <ConsultantListCard
                      key={c.profile_id || c.id || i}
                      c={c} idx={(page - 1) * PAGE_SIZE + i}
                      onBook={handleBookNowFromCatalog}
                      onView={handleViewProfileFromCatalog}
                      list={view === 'list'}
                      isMe={isConsultantMe(c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="cp-pagination">
                {page > 1 && <button onClick={() => setPage(p => p - 1)}>‹</button>}
                {pageNums.map((p, i) =>
                  p === '…'
                    ? <span key={`d${i}`} style={{ padding:'0 4px',color:'#667A8A' }}>…</span>
                    : <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                )}
                {page < totalPages && <button onClick={() => setPage(p => p + 1)}>›</button>}
              </div>
            )}
          </main>
        </div>

        <BookingModal consultant={selected} isOpen={!!selected} onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); showToast('تم حجز الاستشارة بنجاح'); navigate && navigate('/my-appointments'); }} />

        <PaymentModal isOpen={!!paymentData} onClose={() => setPaymentData(null)}
          onSuccess={() => { setPaymentData(null); showToast('تم دفع الاستشارة بنجاح وتأكيد الحجز'); if (navigate) navigate('/my-appointments'); }}
          price={paymentData?.price || 42.50} consultantName={paymentData?.consultantName || 'مستشار'} serviceName={paymentData?.serviceName || 'استشارة'} isMock={true} />

        {toast && (
          <div className="cp-toast-backdrop">
            <div className="cp-toast">
              <div className="cp-toast-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>{toast}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
