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
import ModernSelect from '../../components/ModernSelect';
import { applyFilters, applySorting, buildPageNums, CITIES, COMM, CHIPS, PAGE_SIZE } from './consultantFilterUtils';

/* ── CSS ──────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

  :root {
    --admin-navy: #0B2E4B;
    --admin-navy2: #164D70;
    --admin-navy3: #071F33;
    --admin-orange: #F59A23;
    --admin-orange2: #DF820F;
    --admin-orangeSoft: #FFF3E3;
    --admin-bg: #F3F6F8;
    --admin-card: #FFFFFF;
    --admin-surface: #EEF3F6;
    --admin-line: #D9E2E8;
    --admin-muted: #6E8190;
    --admin-text: #10263A;
    --admin-green: #16845A;
    --admin-greenSoft: #E8F6EF;
    --admin-shadow: 0 12px 28px rgba(11, 46, 75, 0.08);
  }

  *, *::before, *::after { box-sizing: border-box; }
  .cp-root {
    font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
    direction: rtl;
    background: var(--admin-bg);
    min-height: 100vh;
    color: var(--admin-text);
  }

  @keyframes profileFadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Hero with Admin Geometric Grid Pattern */
  .cp-hero {
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.045) 25%, transparent 25%) -12px 0/28px 28px,
      linear-gradient(135deg, transparent 75%, rgba(255, 255, 255, 0.045) 75%) -12px 0/28px 28px,
      linear-gradient(115deg, var(--admin-navy2) 0%, var(--admin-navy) 58%, var(--admin-navy3) 100%);
    color: #fff;
    padding: 44px 36px 36px;
    border-radius: 0 0 24px 24px;
    box-shadow: 0 8px 24px rgba(11, 46, 75, 0.12);
  }
  .cp-hero h1 { margin: 0; font-size: clamp(24px, 3.2vw, 36px); font-weight: 850; line-height: 1.3; color: #FFFFFF; }
  .cp-hero h1 em { color: var(--admin-orange); font-style: normal; }
  .cp-hero p { margin: 12px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.82); max-width: 650px; line-height: 1.8; }

  /* Search bar */
  .cp-searchbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 18px 36px;
    background: #FFFFFF;
    border-bottom: 1px solid var(--admin-line);
    box-shadow: 0 4px 14px rgba(11, 46, 75, 0.03);
    align-items: center;
  }
  .cp-search-input {
    flex: 1;
    min-width: 240px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 999px;
    padding: 9px 18px;
    transition: all 0.2s ease;
  }
  .cp-search-input:focus-within {
    border-color: var(--admin-navy);
    background: #FFFFFF;
    box-shadow: 0 0 0 3px rgba(11, 46, 75, 0.08);
  }
  .cp-search-input input {
    flex: 1;
    border: 0;
    background: transparent;
    outline: 0;
    font-family: inherit;
    font-size: 13.5px;
    color: var(--admin-navy);
  }
  .cp-search-input input::placeholder { color: var(--admin-muted); }
  .cp-top-filter { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--admin-muted); }
  .cp-top-select { border: 1px solid var(--admin-line); border-radius: 999px; padding: 7px 14px; font-family: inherit; font-size: 13px; color: var(--admin-navy); background: #fff; cursor: pointer; outline: none; }
  .cp-search-btn {
    background: var(--admin-navy);
    color: #fff;
    border: 0;
    border-radius: 999px;
    padding: 10px 24px;
    font-family: inherit;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: all .2s;
    box-shadow: 0 2px 8px rgba(11, 46, 75, 0.18);
  }
  .cp-search-btn:hover { background: var(--admin-navy2); transform: translateY(-1px); }

  /* Content grid */
  .cp-content {
    display: grid;
    grid-template-columns: 270px 1fr;
    gap: 26px;
    padding: 28px 36px;
    max-width: 1400px;
    margin: 0 auto;
    align-items: start;
  }

  /* Sidebar filters */
  .cp-filters {
    background: #FFFFFF;
    border-radius: 22px;
    padding: 22px;
    border: 1px solid var(--admin-line);
    box-shadow: 0 8px 20px rgba(11, 46, 75, 0.04);
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }
  .cp-filter-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .cp-filter-top h2 { margin: 0; font-size: 18px; font-weight: 850; color: var(--admin-navy); }
  .cp-clear-btn { border: 0; background: transparent; color: var(--admin-orange2); font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
  .cp-filter-group { margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--admin-surface); }
  .cp-filter-group:last-child { border-bottom: none; margin-bottom: 0; }
  .cp-filter-label { font-size: 12px; font-weight: 800; color: var(--admin-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
  .cp-checks { display: flex; flex-direction: column; gap: 9px; }
  .cp-checks label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--admin-text); cursor: pointer; font-weight: 600; }
  .cp-checks input { accent-color: var(--admin-navy); width: 16px; height: 16px; cursor: pointer; }
  .cp-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .cp-chip { border: 1px solid var(--admin-line); background: var(--admin-surface); color: var(--admin-text); border-radius: 999px; padding: 5px 13px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; font-family: inherit; }
  .cp-chip.active, .cp-chip:hover { background: var(--admin-orangeSoft); border-color: var(--admin-orange); color: var(--admin-orange2); }

  /* Results area */
  .cp-main-area { min-height: 400px; }
  .cp-results-tools { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .cp-count { font-size: 14px; color: var(--admin-muted); font-weight: 600; }
  .cp-count b { color: var(--admin-navy); font-weight: 850; font-size: 17px; }
  .cp-view-sort { display: flex; align-items: center; gap: 16px; }
  .cp-view-toggle { display: flex; border: 1px solid var(--admin-line); border-radius: 12px; overflow: hidden; background: #fff; }
  .cp-view-toggle button { border: 0; background: #fff; padding: 8px 13px; cursor: pointer; font-size: 14px; color: var(--admin-muted); transition: all .15s; }
  .cp-view-toggle button.active { background: var(--admin-navy); color: #fff; }
  .cp-sort { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--admin-muted); font-weight: 600; }
  .cp-sort select { border: 1px solid var(--admin-line); border-radius: 999px; padding: 6px 14px; font-family: inherit; font-size: 13px; color: var(--admin-navy); background: #fff; cursor: pointer; outline: none; }

  /* Cards grid/list */
  .cp-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 22px; }
  .cp-cards-list { display: flex; flex-direction: column; gap: 16px; }

  /* Consultant card */
  .cp-card {
    background: #FFFFFF;
    border-radius: 22px;
    border: 1px solid var(--admin-line);
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(11, 46, 75, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cp-card:hover {
    box-shadow: 0 16px 36px rgba(11, 46, 75, 0.11);
    transform: translateY(-4px);
    border-color: #CBD5E1;
  }
  .cp-card.is-me-card { border: 2px solid var(--admin-navy); background: #FAFBFD; }
  .cp-photo-wrap {
    position: relative;
    height: 125px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.045) 25%, transparent 25%) -12px 0/28px 28px,
      linear-gradient(135deg, transparent 75%, rgba(255, 255, 255, 0.045) 75%) -12px 0/28px 28px,
      linear-gradient(115deg, var(--admin-navy2) 0%, var(--admin-navy) 58%, var(--admin-navy3) 100%);
    overflow: hidden;
  }
  .cp-photo-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .cp-avatar-initials { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 900; color: #fff; }
  .cp-topic-pill { position: absolute; top: 10px; right: 10px; background: rgba(11, 46, 75, 0.88); color: #fff; font-size: 10.5px; font-weight: 700; padding: 3px 12px; border-radius: 999px; backdrop-filter: blur(4px); }
  .cp-rating-pill { position: absolute; top: 10px; left: 10px; background: rgba(245, 154, 35, 0.95); color: #fff; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px; backdrop-filter: blur(4px); }
  .cp-available-dot { position: absolute; bottom: 10px; right: 10px; background: var(--admin-green); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
  .cp-card-body { padding: 18px; }
  .cp-name-price { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
  .cp-name-price h3 { margin: 0; font-size: 16px; font-weight: 850; color: var(--admin-navy); line-height: 1.3; }
  .cp-price { font-size: 16px; font-weight: 900; color: var(--admin-navy); white-space: nowrap; }
  .cp-price span { font-size: 11px; color: var(--admin-muted); font-weight: 600; }
  .cp-meta { font-size: 11.5px; color: var(--admin-muted); margin-bottom: 8px; font-weight: 600; }
  .cp-tier { display: inline-block; background: var(--admin-greenSoft); color: var(--admin-green); border: 1px solid #A7F3D0; border-radius: 999px; padding: 2px 10px; font-size: 10px; font-weight: 800; margin-bottom: 8px; }
  .cp-desc { font-size: 12.5px; color: #475569; line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cp-card-actions { display: flex; gap: 8px; }
  .cp-view-btn { flex: 1; border: 1px solid var(--admin-line); background: #fff; color: var(--admin-navy); border-radius: 999px; padding: 8px; font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: all .15s; }
  .cp-view-btn:hover { background: var(--admin-surface); }
  .cp-book-btn { flex: 1; border: 0; background: var(--admin-navy); color: #fff; border-radius: 999px; padding: 8px; font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: all .18s; box-shadow: 0 2px 6px rgba(11, 46, 75, 0.18); }
  .cp-book-btn:hover { background: var(--admin-navy2); }

  /* Loading / Empty */
  .cp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 20px; color: var(--admin-muted); }
  .cp-spinner { width: 40px; height: 40px; border: 3px solid var(--admin-line); border-top-color: var(--admin-orange); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cp-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 80px 20px; color: var(--admin-muted); }
  .cp-empty-icon { font-size: 52px; margin-bottom: 16px; }
  .cp-empty h3 { margin: 0 0 8px; color: var(--admin-navy); font-size: 20px; font-weight: 850; }
  .cp-empty p { margin: 0; font-size: 14px; }

  /* Pagination */
  .cp-pagination { display: flex; justify-content: center; gap: 6px; margin-top: 28px; align-items: center; }
  .cp-pagination button { border: 1px solid var(--admin-line); background: #fff; color: var(--admin-navy); border-radius: 12px; width: 38px; height: 38px; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer; transition: all .15s; }
  .cp-pagination button.active { background: var(--admin-navy); color: #fff; border-color: var(--admin-navy); }
  .cp-pagination button:hover:not(.active) { background: var(--admin-surface); }

  /* Toast */
  .cp-toast-backdrop { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }
  .cp-toast { display: flex; align-items: center; gap: 12px; background: var(--admin-navy); color: #fff; padding: 14px 22px; border-radius: 16px; font-size: 13px; font-weight: 700; box-shadow: 0 8px 24px rgba(11, 46, 75, 0.2); animation: slideUp .3s ease; }
  .cp-toast-icon { color: #16A36D; flex-shrink: 0; }

  /* ── Full Profile View (Exact match to Admin Profile aesthetic) ──── */
  .profile-spa-view {
    background: var(--admin-bg);
    min-height: 100vh;
    padding-bottom: 60px;
    animation: profileFadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .profile-spa-topbar {
    height: 54px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 32px;
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid var(--admin-line);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 4px 14px rgba(11, 46, 75, 0.05);
  }
  .profile-spa-back-btn {
    border: 1px solid var(--admin-line);
    background: #fff;
    color: var(--admin-navy);
    border-radius: 999px;
    padding: 8px 18px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: all .15s;
  }
  .profile-spa-back-btn:hover { background: var(--admin-surface); }

  /* Profile Hero Card */
  .profile-hero-card {
    background: #fff;
    border: 1px solid var(--admin-line);
    border-radius: 24px;
    box-shadow: var(--admin-shadow);
    overflow: hidden;
    margin: 20px auto 0;
    max-width: 1350px;
    width: calc(100% - 48px);
  }
  .profile-cover-bg {
    height: 145px;
    border-radius: 24px 24px 0 0;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.045) 25%, transparent 25%) -12px 0/28px 28px,
      linear-gradient(135deg, transparent 75%, rgba(255, 255, 255, 0.045) 75%) -12px 0/28px 28px,
      linear-gradient(115deg, var(--admin-navy2) 0%, var(--admin-navy) 58%, var(--admin-navy3) 100%);
  }
  .profile-main-info {
    display: grid;
    grid-template-columns: 130px minmax(0, 1fr) auto;
    gap: 20px;
    padding: 0 28px 22px;
    align-items: start;
    margin-top: 0;
  }
  .profile-avatar-box {
    width: 112px;
    height: 112px;
    border-radius: 22px;
    margin-top: -47px;
    border: 4px solid #FFFFFF;
    background: linear-gradient(135deg, #E7EEF2, #D7E4EA);
    display: grid;
    place-items: center;
    font-size: 36px;
    font-weight: 900;
    color: var(--admin-navy);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.13);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .profile-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
  .profile-details-head { padding-top: 20px; }
  .profile-details-head h1 { margin: 0; font-size: 26px; font-weight: 850; color: var(--admin-navy); line-height: 1.3; }
  .profile-tagline-text { font-size: 13.5px; color: #2D5978; line-height: 1.6; margin: 6px 0 0; font-weight: 600; max-width: 620px; }
  .profile-meta-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 8px; font-size: 12px; color: var(--admin-muted); font-weight: 600; }
  .profile-price-action { padding-top: 20px; text-align: left; min-width: 140px; }
  .profile-price-val { font-size: 26px; font-weight: 900; color: var(--admin-navy); line-height: 1; margin: 4px 0 8px; }
  .profile-book-now-btn {
    background: var(--admin-navy);
    color: #fff;
    border: 0;
    border-radius: 999px;
    padding: 10px 22px;
    font-family: inherit;
    font-weight: 800;
    font-size: 12.5px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(11, 46, 75, 0.2);
    transition: all .2s;
  }
  .profile-book-now-btn:hover { background: var(--admin-navy2); transform: translateY(-1px); }

  /* Nav Tabs matching Admin */
  .profile-nav-tabs {
    border-top: 1px solid var(--admin-line);
    padding: 10px 24px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    background: #FAFCFD;
  }
  .profile-nav-tabs button {
    border: 1px solid transparent;
    background: #FFFFFF;
    color: var(--admin-navy);
    padding: 9px 18px;
    border-radius: 999px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  .profile-nav-tabs button:hover {
    background: var(--admin-surface);
    color: var(--admin-navy);
    transform: translateY(-1px);
  }
  .profile-nav-tabs button.active {
    background: var(--admin-navy);
    color: #FFFFFF;
    border-color: var(--admin-navy);
    box-shadow: 0 4px 12px rgba(11, 46, 75, 0.18);
    transform: translateY(-1px);
  }

  /* Two Column Layout */
  .profile-grid-layout {
    display: grid;
    grid-template-columns: 1fr 370px;
    gap: 24px;
    padding: 24px 0;
    max-width: 1350px;
    width: calc(100% - 48px);
    margin: 0 auto;
    align-items: start;
  }
  .profile-main-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .left-sidebar-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 74px;
  }

  /* Section Cards */
  .profile-section-card {
    background: #FFFFFF;
    border: 1px solid var(--admin-line);
    border-radius: 24px;
    padding: 28px 32px;
    box-shadow: 0 8px 20px rgba(11, 46, 75, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .profile-section-card:hover {
    box-shadow: 0 12px 28px rgba(11, 46, 75, 0.07);
  }
  .profile-section-card h2 {
    margin: 0 0 16px;
    font-size: 20px;
    font-weight: 850;
    color: var(--admin-navy);
    border-bottom: none;
    padding-bottom: 0;
  }
  .profile-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 20px;
  }
  .profile-stat-box {
    background: #F7F9FA;
    border: 1px solid #E7EDF1;
    border-radius: 18px;
    padding: 18px 16px;
    text-align: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .profile-stat-box:hover {
    transform: translateY(-2px);
    border-color: #CBD5E1;
    box-shadow: 0 6px 16px rgba(11, 46, 75, 0.06);
    background: #FFFFFF;
  }
  .profile-stat-box small {
    display: block;
    color: var(--admin-muted);
    font-size: 11.5px;
    font-weight: 700;
  }
  .profile-stat-box b {
    display: block;
    margin-top: 6px;
    font-size: 17px;
    color: var(--admin-navy);
    font-weight: 850;
  }

  /* Booking widget */
  .booking-widget-card {
    background: #FFFFFF;
    border: 1px solid var(--admin-line);
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 8px 20px rgba(11, 46, 75, 0.04);
  }
  @keyframes widgetPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 154, 35, 0); }
    50% { box-shadow: 0 0 0 10px rgba(245, 154, 35, 0.25); }
  }
  .widget-pulse { animation: widgetPulse .6s ease 2; }
  .booking-durations { display: grid; gap: 8px; margin: 14px 0; }
  .booking-dur-item { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--admin-line); border-radius: 14px; cursor: pointer; transition: all .15s; background: var(--admin-surface); font-size: 13px; font-weight: 700; color: var(--admin-navy); }
  .booking-dur-item.active { background: var(--admin-orangeSoft); border-color: var(--admin-orange); color: var(--admin-orange2); }
  .booking-dur-item small { font-size: 10px; color: var(--admin-muted); }
  .booking-days-row { display: flex; gap: 6px; margin: 14px 0; overflow-x: auto; padding-bottom: 4px; }
  .booking-day-btn { flex-shrink: 0; border: 1px solid var(--admin-line); background: var(--admin-surface); border-radius: 14px; padding: 9px 12px; font-family: inherit; font-size: 11.5px; cursor: pointer; text-align: center; transition: all .15s; color: var(--admin-muted); font-weight: 700; }
  .booking-day-btn.available { background: var(--admin-greenSoft); border-color: #BBF7D0; color: var(--admin-green); }
  .booking-day-btn.active { background: var(--admin-navy); border-color: var(--admin-navy); color: #fff; }
  .booking-slots-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 14px; }
  .booking-slot-btn { border: 1px solid var(--admin-line); background: var(--admin-surface); border-radius: 10px; padding: 8px 4px; font-family: inherit; font-size: 12px; font-weight: 700; color: var(--admin-navy); cursor: pointer; transition: all .15s; }
  .booking-slot-btn.active { background: var(--admin-navy); border-color: var(--admin-navy); color: #fff; }
  .booking-slot-btn:hover:not(.active) { background: var(--admin-orangeSoft); border-color: var(--admin-orange); }

  /* Quick overview */
  .quick-overview-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--admin-surface); font-size: 13px; }
  .quick-overview-row:last-child { border-bottom: none; }
  .quick-overview-label { color: var(--admin-muted); font-weight: 600; }
  .quick-overview-val { color: var(--admin-navy); font-weight: 800; }

  /* Ask Question */
  .ask-question-card {
    background: linear-gradient(135deg, var(--admin-navy2) 0%, var(--admin-navy) 100%);
    color: #fff;
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(11, 46, 75, 0.15);
  }
  .ask-question-input-wrap { display: flex; background: rgba(255, 255, 255, 0.12); border-radius: 999px; padding: 4px 6px; margin-top: 14px; border: 1px solid rgba(255, 255, 255, 0.2); }
  .ask-question-input-wrap input { flex: 1; background: transparent; border: 0; outline: 0; color: #fff; font-family: inherit; padding: 0 14px; font-size: 12.5px; }
  .ask-question-input-wrap input::placeholder { color: #94A3B8; }
  .ask-question-btn { border: 0; background: var(--admin-orange); color: #fff; border-radius: 999px; padding: 8px 18px; font-weight: 800; font-size: 12px; cursor: pointer; font-family: inherit; }

  /* Reviews */
  .cp-review-box { background: #FAFBFD; border: 1px solid var(--admin-line); border-radius: 18px; padding: 18px; }
  .cp-review-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .cp-reviewer-info { display: flex; align-items: center; gap: 12px; }
  .cp-reviewer-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--admin-navy2), var(--admin-navy)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; }
  .cp-reviewer-name { font-weight: 800; font-size: 14px; color: var(--admin-navy); }
  .cp-reviewer-tag { font-size: 11px; color: var(--admin-green); font-weight: 700; }
  .cp-review-date { font-size: 12px; color: var(--admin-muted); }
  .cp-review-stars { font-size: 14px; margin-bottom: 8px; }
  .cp-review-body { margin: 0; font-size: 13px; color: #475569; line-height: 1.7; }

  @media(max-width: 900px) {
    .cp-content { grid-template-columns: 1fr; }
    .cp-filters { position: static; }
    .cp-cards-grid { grid-template-columns: 1fr !important; }
    .profile-main-info { grid-template-columns: 1fr; }
    .profile-price-action { text-align: right; }
    .profile-grid-layout { grid-template-columns: 1fr; }
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
      // Backend يستثني المستشار الحالي تلقائياً من النتائج
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
  const isColleaguesMode = typeof window !== 'undefined' && window.location.pathname.includes('colleagues');

  if (viewProfile) {
    return (
      <>
        <style>{CSS}</style>
        <div className="cp-root">
          <ConsultantFullProfile
            consultant={viewProfile}
            isColleagues={isColleaguesMode}
            onClose={() => {
              const backPath = isColleaguesMode ? '/consultant/colleagues' : '/consultants';
              window.history.replaceState({}, '', backPath);
              setViewProfile(null);
              setScrollToBooking(false);
            }}
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
          <div>
            <h1>
              {isColleaguesMode ? (
                <>زملاء المنصة — <em>شبكة الخبراء والمستشارين</em></>
              ) : (
                <>اعثر على <em>المستشار المناسب</em><br/>بسهولة وسرعة.</>
              )}
            </h1>
          </div>
          <p>
            {isColleaguesMode
              ? 'تصفح ملفات زملائك من المستشارين المعتمدين على منصة ديوان، واطلع على مجالات تخصصهم وخبراتهم وساعات توفرهم.'
              : 'جميع المستشارين المعروضين موثّقون ومعتمدون. استخدم الفلاتر حسب التخصص، السعر، التقييم والتوفر للوصول إلى المستشار الأنسب لك.'}
          </p>
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
          <div className="cp-top-filter" style={{ minWidth: '130px' }}>
            <ModernSelect
              value={availF ? 'now' : ''}
              onChange={val => { setAvailF(val === 'now'); setPage(1); }}
              options={[
                { value: '', label: 'أي وقت' },
                { value: 'now', label: 'متاح الآن' }
              ]}
              placeholder="التوفر"
            />
          </div>
          <div className="cp-top-filter" style={{ minWidth: '140px' }}>
            <ModernSelect
              value={cityF}
              onChange={val => { setCityF(val); setPage(1); }}
              options={[
                { value: '', label: 'أي مكان' },
                ...CITIES.map(c => ({ value: c, label: c }))
              ]}
              placeholder="المدينة"
            />
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
                <div className="cp-sort" style={{ minWidth: '160px' }}>
                  <ModernSelect
                    value={sort}
                    onChange={setSort}
                    options={[
                      { value: 'best', label: 'الأفضل تطابقاً' },
                      { value: 'rating', label: 'الأعلى تقييماً' },
                      { value: 'priceLow', label: 'السعر الأقل' },
                      { value: 'priceHigh', label: 'السعر الأعلى' }
                    ]}
                    placeholder="ترتيب حسب"
                  />
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
