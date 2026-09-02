import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { appointmentService } from '../services/appointmentService';
import BookingModal from '../components/Consultants/BookingModal';
import PaymentModal from '../components/Consultants/PaymentModal';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
  
  .cp-root { font-family: 'Cairo', sans-serif; direction: rtl; color: #0B2E4B; background: #F8FAFC; min-height: 100vh; padding: 20px; box-sizing: border-box; }
  
  /* Hero */
  .cp-hero { padding: 10px 0 16px; display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; flex-wrap: wrap; }
  .cp-hero h1 { font-size: 32px; line-height: 1.2; margin: 0; font-weight: 900; color: #0B2E4B; }
  .cp-hero h1 em { color: #F59A23; font-style: normal; }
  .cp-hero p { margin: 0; color: #64748B; line-height: 1.7; font-size: 13px; max-width: 480px; }

  /* Search bar */
  .cp-searchbar { 
    margin: 16px 0 24px; 
    background: #fff; 
    border: 1px solid #E2E8F0; 
    border-radius: 50px; 
    box-shadow: 0 4px 15px rgba(11,46,75,0.04); 
    display: flex; 
    align-items: center; 
    padding: 6px 8px 6px 18px; 
    gap: 10px;
    flex-wrap: wrap;
  }
  .cp-search-input { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 200px; padding: 0 10px; }
  .cp-search-input input { width: 100%; border: 0; outline: 0; background: transparent; font-size: 14px; font-family: inherit; color: #0B2E4B; }
  .cp-search-input input::placeholder { color: #94A3B8; }
  
  .cp-top-filter { border-right: 1px solid #E2E8F0; display: flex; align-items: center; gap: 6px; padding: 0 14px; height: 36px; }
  .cp-top-filter label { font-size: 12px; color: #64748B; white-space: nowrap; font-weight: 600; }
  .cp-top-select { border: 0; outline: 0; background: transparent; font-weight: 700; color: #0B2E4B; cursor: pointer; font-family: inherit; font-size: 13px; }
  
  .cp-search-btn { height: 42px; padding: 0 24px; border: 0; border-radius: 40px; background: #F59A23; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer; transition: all .18s ease; font-family: inherit; white-space: nowrap; }
  .cp-search-btn:hover { background: #E08915; }

  /* Content Layout: Sidebar + Main Grid */
  .cp-content { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 24px; align-items: start; width: 100%; }
  
  /* Sidebar Filters */
  .cp-filters { position: sticky; top: 85px; max-height: calc(100vh - 100px); overflow-y: auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
  .cp-filter-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #F1F5F9; }
  .cp-filter-top h2 { margin: 0; font-size: 17px; font-weight: 800; color: #0B2E4B; }
  .cp-clear-btn { border: 0; background: transparent; color: #EF4444; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
  
  .cp-filter-group { margin-bottom: 18px; }
  .cp-filter-label { font-size: 11px; color: #64748B; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .cp-checks { display: flex; flex-direction: column; gap: 8px; }
  .cp-checks label { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: #334155; font-weight: 600; }
  .cp-checks input { width: 16px; height: 16px; accent-color: #0B2E4B; cursor: pointer; }
  
  .cp-chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .cp-chip { border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 20px; padding: 5px 12px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; color: #475569; transition: all .15s; }
  .cp-chip.active { background: #0B2E4B; color: #fff; border-color: #0B2E4B; }

  /* Results Toolbar */
  .cp-results-tools { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
  .cp-count { font-size: 14px; color: #64748B; font-weight: 600; }
  .cp-count b { font-size: 22px; color: #0B2E4B; margin-left: 6px; font-weight: 800; }
  
  .cp-view-sort { display: flex; align-items: center; gap: 12px; }
  .cp-view-toggle { display: flex; border: 1px solid #CBD5E1; border-radius: 10px; background: #fff; padding: 2px; gap: 2px; }
  .cp-view-toggle button { width: 32px; height: 32px; border: 0; border-radius: 6px; background: transparent; cursor: pointer; font-size: 14px; color: #64748B; display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .cp-view-toggle button.active { background: #0B2E4B; color: #fff; }
  
  .cp-sort { display: flex; align-items: center; gap: 6px; color: #64748B; font-size: 13px; font-weight: 600; }
  .cp-sort select { border: 1px solid #CBD5E1; border-radius: 8px; background: #fff; padding: 6px 12px; font-family: inherit; font-size: 12px; color: #0B2E4B; font-weight: 700; outline: none; cursor: pointer; }

  /* Main Area Container */
  .cp-main-area { width: 100%; min-width: 0; }
  .cp-cards-container { width: 100%; }

  /* Grid Layout: 2 Columns by default, 3 Columns on wider screens */
  .cp-cards-grid { 
    display: grid; 
    grid-template-columns: repeat(2, minmax(0, 1fr)); 
    gap: 20px; 
    width: 100%;
  }
  
  @media(min-width: 1350px) {
    .cp-cards-grid { 
      grid-template-columns: repeat(3, minmax(0, 1fr)); 
    }
  }

  /* List Layout: 1 Full Width Column */
  .cp-cards-list { 
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    width: 100%;
  }

  /* Card Item */
  .cp-card { 
    background: #FFFFFF; 
    border: 1px solid #E2E8F0; 
    border-radius: 16px; 
    padding: 16px; 
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); 
    transition: all .2s ease; 
    display: flex;
    flex-direction: column;
    position: relative;
    box-sizing: border-box;
    width: 100%;
  }
  .cp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(11,46,75,0.08); border-color: #CBD5E1; }
  
  .cp-cards-list .cp-card {
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }

  /* Photo Banner */
  .cp-photo-wrap { 
    height: 120px; 
    width: 100%;
    border-radius: 12px; 
    overflow: hidden; 
    position: relative; 
    flex-shrink: 0; 
  }
  .cp-cards-list .cp-photo-wrap {
    width: 160px;
    height: 120px;
  }
  .cp-photo-wrap img { width: 100%; height: 100%; object-fit: cover; }
  
  .cp-avatar-initials { 
    width: 100%; 
    height: 100%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 28px; 
    font-weight: 900; 
  }
  
  .cp-topic-pill { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.92); backdrop-filter: blur(4px); color: #0B2E4B; border-radius: 14px; padding: 3px 10px; font-size: 11px; font-weight: 800; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
  .cp-rating-pill { position: absolute; top: 8px; left: 8px; background: #0B2E4B; color: #FFF; border-radius: 14px; padding: 3px 10px; font-size: 11px; font-weight: 800; }
  .cp-available-dot { position: absolute; bottom: 8px; right: 8px; background: #DCFCE7; color: #166534; border-radius: 14px; padding: 2px 8px; font-size: 10px; font-weight: 800; border: 1px solid #BBF7D0; }

  /* Card Content */
  .cp-card-body { padding-top: 14px; display: flex; flex-direction: column; flex: 1; }
  .cp-cards-list .cp-card-body { padding-top: 0; }
  
  .cp-name-price { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
  .cp-name-price h3 { margin: 0; font-size: 17px; font-weight: 800; color: #0B2E4B; line-height: 1.3; }
  .cp-price { font-size: 16px; font-weight: 900; color: #F59A23; white-space: nowrap; }
  .cp-price span { font-size: 11px; color: #64748B; font-weight: 600; }
  
  .cp-meta { color: #64748B; font-size: 12px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cp-tier { align-self: flex-start; background: #F1F5F9; color: #334155; border: 1px solid #E2E8F0; border-radius: 14px; padding: 2px 10px; font-size: 11px; font-weight: 700; margin-bottom: 10px; }
  
  .cp-desc { color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 14px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 40px; }
  
  .cp-card-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid #F1F5F9; }
  .cp-card-actions button { flex: 1; height: 38px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; transition: all .15s; border: none; white-space: nowrap; }
  .cp-view-btn { background: #F1F5F9; color: #334155; border: 1px solid #E2E8F0 !important; }
  .cp-view-btn:hover { background: #E2E8F0; color: #0B2E4B; }
  .cp-book-btn { background: #F59A23; color: #FFFFFF; }
  .cp-book-btn:hover { background: #E08915; }

  /* Pagination */
  .cp-pagination { display: flex; justify-content: center; gap: 6px; margin: 30px 0 20px; }
  .cp-pagination button { width: 36px; height: 36px; border: 1px solid #CBD5E1; border-radius: 50%; background: #fff; cursor: pointer; font-family: inherit; font-weight: 700; color: #0B2E4B; transition: all .15s; }
  .cp-pagination button.active { background: #0B2E4B; color: #fff; border-color: #0B2E4B; }
  .cp-pagination button:hover:not(.active) { background: #F1F5F9; }

  .cp-empty { background: #fff; padding: 50px 20px; border-radius: 18px; text-align: center; border: 1px solid #E2E8F0; color: #64748B; }
  .cp-empty-icon { font-size: 42px; margin-bottom: 10px; }
  .cp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748B; gap: 14px; }
  .cp-spinner { width: 36px; height: 36px; border: 3px solid #E2E8F0; border-top-color: #F59A23; border-radius: 50%; animation: cp-spin .7s linear infinite; }
  @keyframes cp-spin { to { transform: rotate(360deg); } }

  .cp-toast-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(13, 60, 92, 0.45);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: cpFadeIn 0.2s ease forwards;
  }
  .cp-toast {
    background: #0D3C5C;
    color: #FFFFFF;
    padding: 28px 36px;
    border-radius: 20px;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(245, 165, 42, 0.35);
    font-size: 17px;
    font-weight: 800;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    max-width: 460px;
    width: 90%;
    line-height: 1.6;
    animation: cpPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .cp-toast-icon {
    width: 52px;
    height: 52px;
    background: rgba(245, 165, 42, 0.15);
    border: 1px solid rgba(245, 165, 42, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #F5A52A;
  }
  @keyframes cpFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cpPopIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }

  /* ===== SPA Full Profile View ===== */
  .profile-spa-view {
    width: 100%;
    direction: rtl;
    font-family: 'Cairo', 'Tajawal', sans-serif;
    animation: cp-fadeIn .2s ease;
  }
  @keyframes cp-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .profile-spa-topbar {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 12px 20px;
    margin-bottom: 20px;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .profile-spa-back-btn {
    border: 1px solid #CBD5E1; background: #fff; border-radius: 30px;
    padding: 6px 18px; font-weight: 700; font-size: 12px; color: #0B2E4B;
    cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit;
    transition: all .15s;
  }
  .profile-spa-back-btn:hover { background: #F1F5F9; color: #F59A23; border-color: #F59A23; }

  .profile-hero-card {
    background: #fff; border: 1px solid #E2E8F0; border-radius: 24px;
    overflow: hidden; box-shadow: 0 6px 20px rgba(11,46,75,0.05);
  }
  .profile-cover-bg {
    height: 160px;
    background: #0D3C5C radial-gradient(circle at 50% 50%, #124A70 0%, #0B2E4B 100%);
  }
  
  /* Grid Order in RTL: Column 1 = RIGHT (Avatar), Column 2 = MIDDLE (Details), Column 3 = LEFT (Price) */
  .profile-main-info {
    display: grid; grid-template-columns: 140px minmax(0,1fr) 200px; gap: 24px;
    padding: 0 28px 24px; align-items: start; direction: rtl;
  }
  
  .profile-avatar-box {
    width: 130px; height: 130px; border-radius: 24px; overflow: hidden;
    border: 4px solid #fff; margin-top: -55px; box-shadow: 0 8px 18px rgba(0,0,0,0.12);
    background: #0B2E4B; color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 42px; font-weight: 900; flex-shrink: 0;
  }
  .profile-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
  
  .profile-details-head { padding-top: 16px; }
  .profile-details-head h1 { margin: 0; font-size: 26px; font-weight: 900; color: #0B2E4B; }
  .profile-tagline-text { color: #64748B; font-weight: 600; font-size: 13px; margin-top: 6px; line-height: 1.6; }
  .profile-meta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; color: #64748B; font-size: 12px; font-weight: 600; align-items: center; }
  
  .profile-price-action { padding-top: 20px; text-align: left; }
  .profile-price-val { font-size: 28px; font-weight: 900; color: #0B2E4B; }
  .profile-price-val span { font-size: 12px; color: #64748B; font-weight: 600; }
  
  .profile-book-now-btn {
    border: 0; background: #F59A23; color: #fff; border-radius: 30px;
    padding: 12px 24px; font-weight: 800; font-size: 14px; margin-top: 14px;
    cursor: pointer; font-family: inherit; width: 100%; transition: background .15s;
    box-shadow: 0 4px 12px rgba(245,154,35,0.25);
  }
  .profile-book-now-btn:hover { background: #DF820F; }

  /* Navigation Tabs at Bottom of Hero Card */
  .profile-nav-tabs {
    position: sticky; top: 85px; z-index: 90;
    border-top: 1px solid #F1F5F9; padding: 10px 24px; display: flex; gap: 8px; flex-wrap: wrap; background: #ffffff; justify-content: flex-start;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-radius: 0 0 24px 24px;
  }
  .profile-nav-tabs button {
    border: 1px solid #E2E8F0; background: #fff; padding: 8px 18px; border-radius: 20px;
    font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; font-family: inherit; transition: all .15s;
  }
  .profile-nav-tabs button.active { background: #0B2E4B; color: #fff; border-color: #0B2E4B; }

  /* Content Cards */
  .profile-section-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); scroll-margin-top: 20px; }
  .profile-section-card h2 { margin: 0 0 14px; font-size: 18px; font-weight: 800; color: #0B2E4B; border-bottom: 2px solid #F59A23; display: inline-block; padding-bottom: 4px; }
  .profile-section-card p { color: #475569; line-height: 1.8; font-size: 13.5px; margin: 0; }

  /* Reviews Styled Components */
  .cp-review-box {
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 18px;
    background: #fff;
    transition: all .15s ease;
  }
  .cp-review-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .cp-reviewer-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cp-reviewer-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #DCE7F0;
    color: #0B2E4B;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
  }
  .cp-reviewer-name {
    font-weight: 800;
    font-size: 14px;
    color: #0B2E4B;
  }
  .cp-reviewer-tag {
    font-size: 11px;
    color: #64748B;
    font-weight: 600;
  }
  .cp-review-date {
    font-size: 12px;
    color: #94A3B8;
    font-weight: 600;
  }
  .cp-review-stars {
    color: #F59A23;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .cp-review-body {
    color: #475569;
    font-size: 13px;
    line-height: 1.6;
    margin: 0;
  }

  /* Dual Independent Scroll Columns */
  .profile-grid-layout { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 24px; margin-top: 24px; align-items: start; }

  .profile-main-column {
    max-height: calc(100vh - 90px);
    overflow-y: auto;
    padding-left: 6px;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E1 transparent;
    scroll-behavior: smooth;
  }
  .profile-main-column::-webkit-scrollbar { width: 6px; }
  .profile-main-column::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 4px; }

  .left-sidebar-stack { 
    display: flex; flex-direction: column; gap: 20px;
    max-height: calc(100vh - 90px);
    overflow-y: auto;
    padding-left: 6px;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E1 transparent;
    scroll-behavior: smooth;
  }
  .left-sidebar-stack::-webkit-scrollbar { width: 6px; }
  .left-sidebar-stack::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 4px; }

  .booking-widget-card {
    background: #fff; border: 1px solid #E2E8F0;
    border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.04);
    scroll-margin-top: 20px;
    transition: all 0.3s ease;
  }
  
  @keyframes widgetPulseAnim {
    0% { box-shadow: 0 0 0 0 rgba(245, 154, 35, 0.7); border-color: #F59A23; transform: scale(1.01); }
    50% { box-shadow: 0 0 0 14px rgba(245, 154, 35, 0); border-color: #F59A23; transform: scale(1); }
    100% { box-shadow: 0 4px 15px rgba(0,0,0,0.04); border-color: #E2E8F0; }
  }
  .widget-pulse {
    animation: widgetPulseAnim 1.3s ease-in-out !important;
    border-color: #F59A23 !important;
  }

  .booking-widget-card h3 { margin: 0; font-size: 17px; font-weight: 800; color: #0B2E4B; }

  .booking-durations { display: grid; gap: 8px; margin: 14px 0; }
  .booking-dur-item {
    border: 1px solid #CBD5E1; border-radius: 12px; padding: 12px 6px; text-align: center; cursor: pointer; transition: all .15s; background: #fff;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  }
  .booking-dur-item.active { border: 2px solid #F59A23; background: #FFF9F0; }
  .booking-dur-item b { display: block; font-size: 12.5px; color: #0B2E4B; }
  .booking-dur-item small { color: #F59A23; font-size: 11px; font-weight: 800; }

  .booking-days-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin: 12px 0; }
  .booking-day-btn {
    border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 2px; text-align: center; cursor: pointer; background: #fff; font-size: 10px; font-weight: 700; color: #334155; font-family: inherit; transition: all .15s;
  }
  .booking-day-btn.active { background: #0B2E4B; color: #fff; border-color: #0B2E4B; }
  .booking-day-btn.available { border-color: #BBF7D0; background: #F0FDF4; }

  .booking-slots-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .booking-slot-btn {
    border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px; text-align: center; cursor: pointer; background: #fff; font-size: 12px; font-weight: 700; color: #0B2E4B; font-family: inherit; transition: all .15s;
  }
  .booking-slot-btn:hover, .booking-slot-btn.active { border-color: #F59A23; background: #FFF9F0; color: #0B2E4B; }

  /* Quick Overview Box Styling */
  .quick-overview-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
  .quick-overview-row:last-child { border-bottom: none; }
  .quick-overview-label { color: #64748B; font-weight: 600; }
  .quick-overview-val { color: #0B2E4B; font-weight: 800; }

  /* Ask Question Card Styling */
  .ask-question-card {
    background: #0B2E4B; color: #fff; border-radius: 20px; padding: 22px; box-shadow: 0 6px 20px rgba(11,46,75,0.15);
  }
  .ask-question-input-wrap {
    display: flex; background: rgba(255,255,255,0.12); border-radius: 30px; padding: 4px 6px; margin-top: 14px; border: 1px solid rgba(255,255,255,0.2);
  }
  .ask-question-input-wrap input {
    flex: 1; background: transparent; border: 0; outline: 0; color: #fff; font-family: inherit; padding: 0 14px; font-size: 12.5px;
  }
  .ask-question-input-wrap input::placeholder { color: #94A3B8; }
  .ask-question-btn {
    border: 0; background: #F59A23; color: #fff; border-radius: 25px; padding: 8px 18px; font-weight: 800; font-size: 12px; cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .ask-question-btn:hover { background: #DF820F; }

  /* Topic Explorer Card Styling */
  .topic-card-item {
    border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform .15s; margin-bottom: 10px;
  }
  .topic-card-item:hover { transform: translateX(-4px); }

  /* Mini Grid Stats */
  .profile-stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 20px; }
  .profile-stat-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 16px; text-align: center; }
  .profile-stat-box small { display: block; color: #64748B; font-size: 12px; font-weight: 600; }
  .profile-stat-box b { display: block; margin-top: 6px; font-size: 17px; color: #0B2E4B; font-weight: 800; }

  @media(max-width: 900px) {
    .cp-content { grid-template-columns: 1fr; }
    .cp-filters { position: static; }
    .cp-cards-grid { grid-template-columns: 1fr !important; }
    .profile-main-info { grid-template-columns: 1fr; }
    .profile-price-action { text-align: right; }
    .profile-grid-layout { grid-template-columns: 1fr; }
    .profile-main-column, .left-sidebar-stack { max-height: none; overflow-y: visible; }
  }
`;

const GRADIENTS = [
  ['#0B2E4B','#164D70'],['#1A4A67','#0D3A56'],
  ['#F59A23','#DF820F'],['#16A36D','#0F7B52'],
];
function grad(idx){ const g=GRADIENTS[idx%4]; return `linear-gradient(135deg,${g[0]},${g[1]})`; }

const CITIES = ['عمّان','الزرقاء','مادبا','إربد','العقبة'];
const COMM   = [{v:'video',l:'جلسة فيديو'},{v:'chat',l:'جلسة محادثة'},{v:'report',l:'تقرير مكتوب'}];
const CHIPS  = [{label:'≤ 50 د.أ',max:50},{label:'≤ 75 د.أ',max:75},{label:'≤ 100 د.أ',max:100},{label:'100+ د.أ',min:100}];
const PAGE_SIZE = 9;

function CCard({ c, idx, onBook, onView, list, isMe }) {
  const name    = c.full_name || c.name || 'مستشار';
  const init    = name.slice(0,2);
  const rating  = typeof c.average_rating==='number' ? c.average_rating.toFixed(1) : c.average_rating||'5.0';
  const avail   = c.is_available !== false;

  return (
    <div className={`cp-card ${isMe ? 'is-me-card' : ''}`} onClick={()=>onView&&onView(c)} style={isMe ? { border: '2px solid #005D9C', background: '#F0F9FF' } : {}}>
      <div className="cp-photo-wrap">
        {c.profile_image_url||c.img
          ? <img src={c.profile_image_url||c.img} alt={name}/>
          : <div className="cp-avatar-initials" style={{background:grad(idx),color:'#fff'}}>{init}</div>}
        <span className="cp-topic-pill">{c.specialization_name||'ضريبة'}</span>
        <span className="cp-rating-pill">⭐ {rating}</span>
        {avail && <span className="cp-available-dot">● متاح الآن</span>}
      </div>
      <div className="cp-card-body">
        <div className="cp-name-price">
          <h3>
            {name}
            {isMe && <span style={{ marginRight: '8px', fontSize: '11px', background: '#005D9C', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>أنت (حسابك)</span>}
          </h3>
          <div className="cp-price">{c.price??c.price_per_hour??50} <span>د.أ/جلسة</span></div>
        </div>
        <div className="cp-meta">📍 {c.city||'الأردن'} · 💼 {c.years_of_experience||10} سنة · {c.ratings_count||0} تقييم</div>
        <span className="cp-tier">{isMe ? 'حسابك الشخصي' : (c.tier||'مستشار معتمد')}</span>
        <p className="cp-desc">{c.bio||'خبير ومستشار ضريبي بخبرة تزيد عن 20 سنة في الاستشارات الضريبية والتدقيق.'}</p>
        <div className="cp-card-actions" onClick={e=>e.stopPropagation()}>
          <button className="cp-view-btn" onClick={()=>onView&&onView(c)}>الملف الكامل</button>
          <button className="cp-book-btn" onClick={()=>onBook&&onBook(c)}>{isMe ? 'معاينة ملفك' : 'احجز الآن'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Helper to calculate week title and days from Database Availabilities ── */
function getWeekTitle(offset) {
  if (offset === 0) return 'هذا الأسبوع';
  if (offset === 1) return 'الأسبوع القادم';
  return `بعد ${offset} أسابيع`;
}

function getDaysForWeek(offset, dbAvailabilities = null, dbWorkingDays = null) {
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  // Base reference date starts dynamically from TODAY
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + offset * 7);

  const daysList = [];
  const hasAvailabilitiesData = Array.isArray(dbAvailabilities);
  const hasWorkingDaysData = Array.isArray(dbWorkingDays);

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dayName = dayNames[d.getDay()];
    const monthName = monthNames[d.getMonth()];
    
    // Python/DB day_of_week mapping: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
    const pythonDayOfWeek = (d.getDay() + 6) % 7;

    let isAvailable = false;
    let timeRangeText = 'غير متاح (عطلة)';

    if (hasAvailabilitiesData) {
      const activeSlotsForDay = dbAvailabilities.filter(
        a => a && a.day_of_week === pythonDayOfWeek && a.is_active !== false
      );

      if (activeSlotsForDay.length > 0) {
        isAvailable = true;
        const sortedSlots = [...activeSlotsForDay].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        const ranges = sortedSlots.map(av => {
          const sTime = av.start_time ? String(av.start_time).slice(0, 5) : '09:00';
          let eTime = '10:00';
          if (av.end_time) {
            eTime = String(av.end_time).slice(0, 5);
          } else {
            const [h, m] = sTime.split(':').map(Number);
            eTime = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
          return `${sTime}-${eTime}`;
        });

        if (ranges.length === 1) {
          const [s, e] = ranges[0].split('-');
          timeRangeText = `متاح من ${s} إلى ${e}`;
        } else if (ranges.length <= 3) {
          timeRangeText = `متاح (${ranges.join('، ')})`;
        } else {
          const firstStart = sortedSlots[0].start_time ? String(sortedSlots[0].start_time).slice(0, 5) : '09:00';
          const lastSlot = sortedSlots[sortedSlots.length - 1];
          let lastEnd = '17:00';
          if (lastSlot.end_time) {
            lastEnd = String(lastSlot.end_time).slice(0, 5);
          } else {
            const [h, m] = (lastSlot.start_time || '16:00').slice(0, 5).split(':').map(Number);
            lastEnd = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
          timeRangeText = `متاح (ساعات متفرقة بين ${firstStart} و ${lastEnd})`;
        }
      } else {
        isAvailable = false;
        timeRangeText = 'غير متاح (عطلة)';
      }
    } else if (hasWorkingDaysData && dbWorkingDays.length > 0) {
      isAvailable = dbWorkingDays.includes(pythonDayOfWeek);
      timeRangeText = isAvailable ? 'متاح من 09:00 إلى 17:00' : 'غير متاح (عطلة)';
    } else {
      // Default fallback ONLY when profile availability data has not been fetched yet
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      isAvailable = !isWeekend;
      timeRangeText = isAvailable ? 'متاح من 09:00 إلى 17:00' : 'غير متاح (عطلة)';
    }

    daysList.push({
      num: dayNum,
      label: dayName,
      month: monthName,
      fullDate: `${dayName}، ${d.getDate()} ${monthName}`,
      // Use local date components (NOT toISOString which converts to UTC and shifts date for UTC+3)
      isoDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      avail: isAvailable,
      timeRange: timeRangeText
    });
  }
  return daysList;
}

/* ── SPA Full Profile View Component ───────────────────────────── */
function FullProfileView({ consultant, onClose, onBook, onOpenPayment, onBookRequest, scrollToBookingOnMount }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('30');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [openFaqs, setOpenFaqs] = useState([0, 1, 2, 3]);
  const [questionText, setQuestionText] = useState('');
  const [questionSent, setQuestionSent] = useState(false);

  // Dynamic Backend Data States
  const [liveProfile, setLiveProfile] = useState(null);
  const [liveServices, setLiveServices] = useState([]);
  const [liveSlots, setLiveSlots] = useState([]);
  const [liveReviews, setLiveReviews] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const profileId = consultant?.profile_id || consultant?.id || 'mock-raafat-1';

  // Fetch Full Profile, Services, Free Slots, and Published Ratings from FastAPI Backend
  useEffect(() => {
    if (!profileId) return;

    const fetchBackendData = async () => {
      setProfileLoading(true);
      try {
        if (profileId === 'mock-raafat-1') {
          // Sunday (6) active from 11:00 to 16:00
          const mockAvails = [
            { day_of_week: 6, start_time: '11:00:00', end_time: '12:00:00', is_active: true },
            { day_of_week: 6, start_time: '12:00:00', end_time: '13:00:00', is_active: true },
            { day_of_week: 6, start_time: '14:00:00', end_time: '15:00:00', is_active: true },
            { day_of_week: 6, start_time: '15:00:00', end_time: '16:00:00', is_active: true },
            { day_of_week: 6, start_time: '16:00:00', end_time: '17:00:00', is_active: true },
            // Thursday (3) & Friday (4) active from 09:00 to 17:00
            { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
            { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_active: true }
          ];

          setLiveProfile({ ...consultant, availabilities: mockAvails });

          const defaultServices = [
            { id: 'srv-1', name: 'جلسة فيديو 30 دقيقة', price: 42.50, duration_minutes: 30 },
            { id: 'srv-2', name: 'جلسة محادثة ساعة واحدة', price: 55.00, duration_minutes: 60 },
            { id: 'srv-3', name: 'تقرير مكتوب', price: 120.00, duration_minutes: 120 }
          ];
          setLiveServices(defaultServices);
          setSelectedServiceId(defaultServices[0].id);

          setLiveReviews([
            { id: 'rev-1', reviewer_name: 'رانيا الخطيب', stars: 5, comment: 'شرح واضح ومباشر، وربط الإجابة بالتشرعات والخطوات العملية المطلوبة.', created_at: '2026-08-07' },
            { id: 'rev-2', reviewer_name: 'عمر حداد', stars: 5, comment: 'استشارة عملية ومهنية، وكان سريعاً في الرد والمتابعة بعد الجلسة.', created_at: '2026-08-05' },
            { id: 'rev-3', reviewer_name: 'محمد العزام', stars: 4, comment: 'المعالجة كانت جيدة وواضحة، ورأي مهني دقيق جداً.', created_at: '2026-07-18' }
          ]);
          return;
        }

        // 1. Fetch live consultant profile from backend
        const profData = await consultantService.getConsultantProfile(profileId, token).catch(() => null);
        if (profData) setLiveProfile(profData);

        // 2. Fetch live services from backend database table
        const srvData = await consultantService.getConsultantServices(profileId, token).catch(() => []);
        if (Array.isArray(srvData) && srvData.length > 0) {
          setLiveServices(srvData);
          setSelectedServiceId(srvData[0].id);
        } else if (profData && Array.isArray(profData.services) && profData.services.length > 0) {
          setLiveServices(profData.services);
          setSelectedServiceId(profData.services[0].id);
        }

        // 3. Fetch live available slots from backend for next 14 days (30 min granularity)
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const slotsData = await consultantService.getAvailableSlots(profileId, startDate, endDate, 30, token).catch(() => []);
        if (Array.isArray(slotsData)) setLiveSlots(slotsData);

        // 4. Fetch live published ratings & reviews from database
        const ratingsData = await consultantService.getConsultantRatings(profileId, token).catch(() => []);
        if (Array.isArray(ratingsData)) setLiveReviews(ratingsData);

      } catch (e) {
        console.error('Error loading consultant backend profile & ratings:', e);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchBackendData();
  }, [profileId, consultant, token]);

  // Smooth Scroll ONLY inside the sidebar container WITHOUT jumping window scroll to 0
  const triggerWidgetGlow = useCallback(() => {
    setActiveTab('availability');

    const widget = document.getElementById('booking-widget-section');
    const sidebarContainer = document.querySelector('.left-sidebar-stack');
    
    if (sidebarContainer) {
      sidebarContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (widget) {
      widget.classList.remove('widget-pulse');
      void widget.offsetWidth;
      widget.classList.add('widget-pulse');
      setTimeout(() => {
        widget.classList.remove('widget-pulse');
      }, 1500);
    }
  }, []);

  useEffect(() => {
    if (scrollToBookingOnMount) {
      const t = setTimeout(() => {
        triggerWidgetGlow();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [scrollToBookingOnMount, triggerWidgetGlow]);

  if (!consultant) return null;

  // Combine Props and Live Backend State safely
  const activeProfile = liveProfile || consultant;
  
  // DYNAMIC DATABASE AVAILABILITIES AND DAYS FOR THE WEEK
  const days = getDaysForWeek(weekOffset, activeProfile.availabilities, activeProfile.working_days);
  const currentDayObj = days[selectedDayIdx] || days[0];

  const name = activeProfile.full_name || activeProfile.name || 'أ. رأفت حداد';
  const init = name.slice(0, 2);

  // Dynamic Available Services from Backend DB
  const displayServices = liveServices.length > 0 ? liveServices : [
    { id: 'default-1', name: 'جلسة فيديو 30 دقيقة', price: 42.50, duration_minutes: 30 },
    { id: 'default-2', name: 'جلسة محادثة ساعة واحدة', price: 55.00, duration_minutes: 60 }
  ];

  const selectedService = displayServices.find(s => s.id === selectedServiceId) || displayServices[0];
  
  // DYNAMIC BACKEND RATINGS STATS & BREAKDOWN FROM DATABASE
  const ratingVal = typeof activeProfile.average_rating === 'number' 
    ? activeProfile.average_rating 
    : parseFloat(activeProfile.average_rating) || 5.0;
  const ratingFormatted = ratingVal.toFixed(1);

  // Calculate dynamic rating count and star histogram percentages from DB
  const totalReviewsCount = liveReviews.length > 0 ? liveReviews.length : (activeProfile.ratings_count ?? 0);
  
  const getStarPct = (starNum) => {
    if (liveReviews.length === 0) {
      if (starNum === 5) return totalReviewsCount > 0 ? 86 : 0;
      if (starNum === 4) return totalReviewsCount > 0 ? 14 : 0;
      return 0;
    }
    const count = liveReviews.filter(r => Math.round(r.stars) === starNum).length;
    return Math.round((count / liveReviews.length) * 100);
  };

  const sessionsCount = activeProfile.sessions_count ?? activeProfile.completed_sessions_count ?? 182;
  const years = activeProfile.years_of_experience ?? 20;
  
  // Minimum starting price calculated from database services list
  const minServicePrice = displayServices.length > 0
    ? Math.min(...displayServices.map(s => parseFloat(s.price) || 0))
    : (parseFloat(activeProfile.price_per_hour || activeProfile.price) || 50);

  const city = activeProfile.city || 'عمّان، الأردن';
  const bio = activeProfile.bio || 'خبير ومستشار ضريبي بخبرة تزيد عن 20 سنة في الاستشارات الضريبية، تدقيق الحسابات، والاعتراضات لدى دائرة ضريبة الدخل والمبيعات الأردنية.';
  const activityType = activeProfile.activity_type || 'مستشار مستقل';
  const certificates = activeProfile.certificates_licenses || activeProfile.certificates || 'بكالوريوس محاسبة - مستشار ضريبي معتمد';
  
  // ONLY SHOW "✔ موثق" IF CONSULTANT UPLOADED ALL DOCUMENTS & STATUS IS APPROVED
  const isVerified = activeProfile.verification_status === 'approved' || activeProfile.is_verified === true;
  const tier = activeProfile.tier || 'مستشار VIP معتمد';

  // Build timeslots from the consultant's DB availability for the selected day
  const buildSlotsFromAvailability = () => {
    const pythonDow = (new Date(currentDayObj.isoDate + 'T12:00:00').getDay() + 6) % 7;
    
    if (Array.isArray(activeProfile?.availabilities)) {
      const avails = activeProfile.availabilities.filter(a => a && a.day_of_week === pythonDow && a.is_active !== false);
      if (avails.length === 0) return []; // NO SLOTS for this day

      const slotDuration = parseInt(selectedService?.duration_minutes || 30, 10);
      const slots = [];

      for (const av of avails) {
        const [startH, startM] = (av.start_time || '09:00').split(':').map(Number);
        let endH, endM;

        if (av.end_time) {
          const [pH, pM] = String(av.end_time).split(':').map(Number);
          if (pH * 60 + pM <= startH * 60 + startM) {
            endH = startH + 1;
            endM = startM;
          } else {
            endH = pH;
            endM = pM;
          }
        } else {
          endH = startH + 1;
          endM = startM;
        }

        const winStart = startH * 60 + startM;
        const winEnd = endH * 60 + endM;

        let cur = winStart;
        while (cur + slotDuration <= winEnd) {
          const hh = Math.floor(cur / 60);
          const mm = cur % 60;
          slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
          cur += 30;
        }
      }
      return [...new Set(slots)].sort();
    }

    return null;
  };

  const freeSlotsForDate = Array.isArray(liveSlots)
    ? liveSlots.filter(s => {
        if (!s || !s.start_time) return false;
        const sDate = String(s.start_time).split('T')[0];
        return sDate === currentDayObj.isoDate;
      })
    : null;

  const freeTimeStrings = freeSlotsForDate !== null
    ? new Set(freeSlotsForDate.map(s => {
        const timePart = String(s.start_time).split('T')[1] || '';
        return timePart.substring(0, 5);
      }))
    : null;

  const computedSlots = buildSlotsFromAvailability();
  const rawTimeslots = computedSlots !== null ? computedSlots : (
    Array.isArray(activeProfile?.availabilities) && activeProfile.availabilities.length === 0
      ? []
      : ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
  );

  const timeslots = freeTimeStrings !== null
    ? rawTimeslots.filter(t => freeTimeStrings.has(t))
    : rawTimeslots;

  // Trigger Booking Request directly using selected widget choices (NO popup modal at all!)
  const handleProceedToBookingRequest = () => {
    try {
      const timeToUse = selectedTime || (timeslots && timeslots.length > 0 ? timeslots[0] : '10:00');
      const dayObj = currentDayObj || { fullDate: 'اليوم', isoDate: new Date().toISOString().split('T')[0] };
      const serviceTitle = `${selectedService?.name || 'جلسة فيديو'} - ${dayObj.fullDate || ''} الساعة ${timeToUse}`;

      // Build datetime from LOCAL browser time, then convert to UTC via toISOString()
      // This ensures Jordan (UTC+3) time is correctly sent as UTC to backend
      const timeParts = (timeToUse.includes(':') ? timeToUse : '10:00').split(':');
      const hh = parseInt(timeParts[0] || '10', 10);
      const mm = parseInt(timeParts[1] || '0', 10);
      const isoDate = dayObj.isoDate || new Date().toISOString().split('T')[0];
      // Build Date in local time (no Z suffix → browser interprets as local time)
      const localDt = new Date(`${isoDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`);
      const scheduledIso = localDt.toISOString(); // Converts local → UTC automatically

      if (typeof onBookRequest === 'function') {
        onBookRequest({
          consultantName: name,
          serviceName: serviceTitle,
          price: selectedService?.price || 42.50,
          consultant_id: profileId,
          service_id: selectedService?.id,
          scheduled_at: scheduledIso
        });
      }
    } catch (err) {
      console.error('Error proceeding to booking request:', err);
    }
  };

  // Smooth scroll handler inside the right column container WITHOUT page jump
  const scrollToSection = (sectionId, tabKey) => {
    setActiveTab(tabKey);
    const element = document.getElementById(sectionId);
    const container = document.querySelector('.profile-main-column');
    if (element && container) {
      const topPos = element.offsetTop - container.offsetTop;
      container.scrollTo({ top: topPos, behavior: 'smooth' });
    }
  };

  const toggleFaq = (idx) => {
    setOpenFaqs(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSendQuestion = () => {
    if (!questionText.trim()) return;
    setQuestionSent(true);
    setTimeout(() => {
      setQuestionSent(false);
      setQuestionText('');
    }, 3500);
  };

  return (
    <div className="profile-spa-view">
      {/* Top Bar inside portal */}
      <div className="profile-spa-topbar">
        <span style={{ fontWeight: '800', color: '#0B2E4B', fontSize: '15px' }}>ملف المستشار {profileLoading && '(جاري التحميل من قاعدة البيانات...)'}</span>
        <button className="profile-spa-back-btn" onClick={onClose}>
          ← العودة إلى المستشارين
        </button>
      </div>

      {/* Profile Hero Card Header */}
      <div className="profile-hero-card">
        <div className="profile-cover-bg" />
        
        <div className="profile-main-info">
          {/* Column 1 (RIGHT in RTL): Avatar Photo */}
          <div className="profile-avatar-box">
            {activeProfile.profile_image_url || activeProfile.img 
              ? <img src={activeProfile.profile_image_url || activeProfile.img} alt={name} />
              : init}
          </div>

          {/* Column 2 (MIDDLE in RTL): Details */}
          <div className="profile-details-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#0B2E4B' }}>{name}</h1>
              
              {/* Only show "✔ موثق" when consultant is verified/approved by backend */}
              {isVerified && (
                <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '2px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: '800' }}>
                  ✔ موثق
                </span>
              )}
            </div>

            <div className="profile-tagline-text">{bio}</div>
            
            <div style={{ margin: '8px 0' }}>
              <span className="cp-tier">✔ {tier}</span>
            </div>

            <div className="profile-meta-row">
              <span>📍 {city}</span>
              <span>•</span>
              <span style={{ color: '#16A36D', fontWeight: '700' }}>● يرد عادةً خلال ساعة</span>
            </div>

            {/* DYNAMIC STATS FROM BACKEND (Rating, Ratings count, Sessions count, Years of Exp) */}
            <div className="profile-meta-row" style={{ marginTop: '10px', fontSize: '13px', color: '#0B2E4B' }}>
              <span style={{ fontWeight: '800', color: '#F59A23' }}>{ratingFormatted} ⭐⭐⭐⭐⭐</span>
              <span>•</span>
              <span><b>{totalReviewsCount}</b> تقييم</span>
              <span>•</span>
              <span><b>{sessionsCount}</b> جلسة مكتملة</span>
              <span>•</span>
              <span><b>{years}</b> سنة خبرة</span>
            </div>

            {/* Specialization Chips */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span className="cp-chip active">{activeProfile.specialization_name || 'ضريبة المبيعات'}</span>
              <span className="cp-chip active">ضريبة الدخل</span>
            </div>
          </div>

          {/* Column 3 (LEFT in RTL): Price & Booking Action */}
          <div className="profile-price-action">
            <div style={{ fontSize: '11px', color: '#64748B' }}>ابتداءً من</div>
            <div className="profile-price-val">{minServicePrice} <span style={{ fontSize: '13px', fontWeight: '800' }}>د.أ / ساعة</span></div>
            
            {/* Click 'احجز جلسة' in Header -> Glow sidebar widget quietly without page scroll jump */}
            <button className="profile-book-now-btn" onClick={triggerWidgetGlow}>
              احجز جلسة
            </button>
          </div>
        </div>

        {/* Navigation Tabs at Bottom of Hero Card */}
        <div className="profile-nav-tabs">
          <button className={activeTab === 'about' ? 'active' : ''} onClick={() => scrollToSection('sec-about', 'about')}>نبذة</button>
          <button className={activeTab === 'experience' ? 'active' : ''} onClick={() => scrollToSection('sec-experience', 'experience')}>الخبرة</button>
          <button className={activeTab === 'services' ? 'active' : ''} onClick={() => scrollToSection('sec-services', 'services')}>الخدمات والمجالات ({displayServices.length})</button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => scrollToSection('sec-reviews', 'reviews')}>التقييمات ({totalReviewsCount})</button>
          <button className={activeTab === 'availability' ? 'active' : ''} onClick={triggerWidgetGlow}>التوفر والتقويم</button>
          <button className={activeTab === 'pricing' ? 'active' : ''} onClick={() => scrollToSection('sec-pricing', 'pricing')}>الأسعار</button>
          <button className={activeTab === 'faq' ? 'active' : ''} onClick={() => scrollToSection('sec-faq', 'faq')}>الأسئلة الشائعة</button>
        </div>
      </div>

      {/* Dual Independent Scroll Columns Container */}
      <div className="profile-grid-layout">
        
        {/* Main Info Content Column (RIGHT in RTL - Independent Scroll Container) */}
        <div className="profile-main-column">
          {/* Section 1: نبذة */}
          <div id="sec-about" className="profile-section-card">
            <h2>نبذة</h2>
            <p>{bio}</p>

            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <small>أسلوب الاستشارة</small>
                <b>عملي ومباشر</b>
              </div>
              <div className="profile-stat-box">
                <small>الأنشطة</small>
                <b>{activityType}</b>
              </div>
              <div className="profile-stat-box">
                <small>الخبرة</small>
                <b>{years} سنة</b>
              </div>
            </div>
          </div>

          {/* Section 2: الخبرة */}
          <div id="sec-experience" className="profile-section-card">
            <h2>الخبرة والمؤهلات</h2>
            <div style={{ borderRight: '3px solid #F59A23', paddingRight: '14px', margin: '14px 0' }}>
              <h4 style={{ margin: '0 0 4px', color: '#0B2E4B', fontSize: '14px' }}>مستشار ضرائب أول — {activeProfile.specialization_name || 'ضريبة الدخل والمبيعات'}</h4>
              <p style={{ fontSize: '12px', color: '#64748B' }}>{activityType}</p>
            </div>
            <p style={{ marginTop: '14px' }}>{certificates}</p>

            <div className="profile-stats-grid" style={{ marginTop: '16px' }}>
              <div className="profile-stat-box" style={{ background: '#FFF9F0', borderColor: '#FDE68A' }}>
                <small>الهوية موثقة</small>
                <b style={{ color: isVerified ? '#166534' : '#64748B', fontSize: '13px' }}>
                  {isVerified ? '✔ تم اعتمادها' : 'قيد المراجعة'}
                </b>
              </div>
              <div className="profile-stat-box" style={{ background: '#FFF9F0', borderColor: '#FDE68A' }}>
                <small>الشهادات المهنية</small>
                <b style={{ color: '#0B2E4B', fontSize: '13px' }}>JCPA • دورات ضريبية</b>
              </div>
              <div className="profile-stat-box" style={{ background: '#FFF9F0', borderColor: '#FDE68A' }}>
                <small>التراخيص والاعتمادات</small>
                <b style={{ color: '#0B2E4B', fontSize: '13px' }}>سارية ومعتمدة</b>
              </div>
            </div>
          </div>

          {/* Section 3: الخدمات والمجالات المربوطة بالداتا بيز */}
          <div id="sec-services" className="profile-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2>الخدمات والمجالات</h2>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>اضغط على أي خدمة لتحديدها</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {displayServices.map(s => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setSelectedDuration(String(s.duration_minutes || s.duration || 45));
                    }}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      background: isSelected ? '#FFF9F0' : '#F8FAFC', 
                      padding: '16px 20px', borderRadius: '16px', 
                      border: isSelected ? '2px solid #F59A23' : '1px solid #E2E8F0',
                      boxShadow: isSelected ? '0 4px 12px rgba(245,154,35,0.15)' : 'none',
                      cursor: 'pointer', transition: 'all .18s ease'
                    }}
                  >
                    <div>
                      <b style={{ color: '#0B2E4B', fontSize: '15px' }}>{s.name}</b>
                      <small style={{ display: 'block', color: '#64748B', fontSize: '12px', marginTop: '4px' }}>⏱ {s.duration_minutes || s.duration || 45} دقيقة استشارة</small>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <b style={{ color: '#F59A23', fontSize: '18px', fontWeight: '900', display: 'block' }}>{s.price} د.أ</b>
                      <span style={{ fontSize: '11px', color: isSelected ? '#F59A23' : '#0B2E4B', fontWeight: '800' }}>
                        {isSelected ? '✓ ممررة للتقويم' : 'حدد هذه الخدمة ←'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ color: '#166534', fontWeight: '700', background: '#F0FDF4', padding: '12px 16px', borderRadius: '12px', marginTop: '18px', border: '1px solid #BBF7D0' }}>
              👍 موصى به من {totalReviewsCount > 0 ? totalReviewsCount : (sessionsCount || 10)} عميلاً بناءً على استشارات موثقة من قاعدة البيانات.
            </p>
          </div>

          {/* Section 4: التقييمات التفاعلية من قاعدة البيانات */}
          <div id="sec-reviews" className="profile-section-card">
            {/* Header: Title on Right, Sort Dropdown on Left */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, border: 'none', padding: 0, fontSize: '20px', fontWeight: '900', color: '#0B2E4B' }}>التقييمات من قاعدة البيانات ({totalReviewsCount})</h2>
              <select style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: '700', color: '#0B2E4B', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                <option>الأحدث ˅</option>
                <option>الأعلى تقييماً</option>
                <option>الأقل تقييماً</option>
              </select>
            </div>

            {/* Stats Summary Grid in RTL */}
            <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0,1fr)', gap: '24px', alignItems: 'center', marginBottom: '28px', direction: 'rtl' }}>
              <div style={{ background: '#F1F5F9', borderRadius: '20px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: '900', color: '#0B2E4B', lineHeight: '1' }}>{ratingFormatted}</div>
                <div style={{ color: '#F59A23', fontSize: '16px', margin: '8px 0 4px' }}>⭐⭐⭐⭐⭐</div>
                <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600' }}>{totalReviewsCount} تقييم مسجل</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[5, 4, 3, 2, 1].map(starNum => {
                  const pct = getStarPct(starNum);
                  return (
                    <div key={starNum} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#0B2E4B', fontWeight: '700' }}>
                      <span style={{ width: '36px', textAlign: 'right', color: '#64748B', fontSize: '12px' }}>{pct}%</span>
                      <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', direction: 'ltr' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#F59A23', borderRadius: '4px', float: 'right' }} />
                      </div>
                      <span style={{ width: '28px', textAlign: 'left' }}>{starNum}★</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Cards from Database Table */}
            {liveReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {liveReviews.map((r, i) => {
                  const reviewerName = r.reviewer_name || 'عميل موثق';
                  const initials = reviewerName.split(' ').map(n => n[0]).join('').slice(0, 2);
                  const starsStr = '⭐'.repeat(r.stars || 5);
                  const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'تاريخ موثق';

                  return (
                    <div key={r.id || i} className="cp-review-box">
                      <div className="cp-review-top">
                        <div className="cp-reviewer-info">
                          <div className="cp-reviewer-avatar">{initials}</div>
                          <div>
                            <div className="cp-reviewer-name">{reviewerName}</div>
                            <div className="cp-reviewer-tag">حجز موثّق بالداتا بيز</div>
                          </div>
                        </div>
                        <div className="cp-review-date">{dateStr}</div>
                      </div>
                      <div className="cp-review-stars">{starsStr}</div>
                      <p className="cp-review-body">{r.comment}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                <b style={{ color: '#0B2E4B' }}>لا توجد تقييمات مكتوبة لهذا المستشار بعد</b>
                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>التقييمات تضاف تلقائياً بعد إتمام الجلسات من حساب العملاء.</p>
              </div>
            )}
          </div>

          {/* Section 5: التوفر الأسبوعي المربوط بالداتا بيز (consultant_availabilities) */}
          <div id="sec-availability" className="profile-section-card">
            <h2>التوفر الأسبوعي من قاعدة البيانات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
              {days.map((d, i) => (
                <div 
                  key={d.num + i} 
                  onClick={() => {
                    if (d.avail) {
                      setSelectedDayIdx(i);
                      setSelectedTime(null);
                    }
                  }}
                  style={{ 
                    background: d.avail ? (selectedDayIdx === i ? '#FFF9F0' : '#F0FDF4') : '#F8FAFC', 
                    border: `1px solid ${d.avail ? (selectedDayIdx === i ? '#F59A23' : '#BBF7D0') : '#E2E8F0'}`, 
                    padding: '14px 18px', borderRadius: '14px',
                    cursor: d.avail ? 'pointer' : 'default',
                    transition: 'all .15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#0B2E4B', fontSize: '14px' }}>{d.label} {d.num} {d.month}</b>
                    {d.avail && selectedDayIdx === i && <span style={{ fontSize: '11px', color: '#F59A23', fontWeight: '800' }}>محدد في التقويم ✓</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: d.avail ? '#166534' : '#94A3B8', margin: '6px 0 0', fontWeight: '700' }}>
                    {d.timeRange}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: الأسعار الجلب الديناميكي من الباك إند */}
          <div id="sec-pricing" className="profile-section-card">
            <h2>الأسعار والخدمات المتاحة</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(displayServices.length, 3)}, 1fr)`, gap: '16px', margin: '20px 0 16px', direction: 'rtl' }}>
              {displayServices.map(s => (
                <div key={s.id} style={{ background: '#F1F5F9', borderRadius: '16px', padding: '22px 16px', textAlign: 'center' }}>
                  <small style={{ color: '#64748B', fontSize: '11px', display: 'block', marginBottom: '8px' }}>{s.name}</small>
                  <b style={{ fontSize: '22px', color: '#0B2E4B', fontWeight: '900' }}>{s.price} <span style={{ fontSize: '13px', fontWeight: '700' }}>د.أ / {s.duration_minutes || s.duration || 45} دقيقة</span></b>
                </div>
              ))}
            </div>

            <p style={{ color: '#64748B', fontSize: '12.5px', fontStyle: 'italic', margin: '14px 0 0', textAlign: 'left' }}>
              تختلف القيمة النهائية حسب نوع الخدمة والمدة المختارة في قاعدة البيانات.
            </p>
          </div>

          {/* Section 7: الأسئلة الشائعة */}
          <div id="sec-faq" className="profile-section-card">
            <h2>الأسئلة الشائعة</h2>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>
              {[
                { q: 'كيف تتم الاستشارة؟', a: 'تبدأ الاستشارة بتحديد السؤال أو المشكلة الضريبية، ثم مراجعة المعلومات والمستندات وتقديم الرأي المهني والخطوات العملية.' },
                { q: 'كيف أحجز استشارة؟', a: 'اختر نوع الخدمة، المدة، اليوم والوقت المناسب، ثم تابع إلى تأكيد الحجز والدفع.' },
                { q: 'ماذا لو احتجت لإعادة جدولة الجلسة؟', a: 'يمكن إعادة الجدولة وفق سياسة الحجز والإلغاء المعتمدة في المنصة.' },
                { q: 'كيف يتم الدفع؟', a: 'يتم الدفع عبر وسائل الدفع المتاحة في المنصة قبل تأكيد الخدمة.' }
              ].map((faq, idx, arr) => {
                const isOpen = openFaqs.includes(idx);
                return (
                  <div key={idx} style={{ padding: '18px 0', borderBottom: idx < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div 
                      onClick={() => toggleFaq(idx)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0B2E4B' }}>{faq.q}</h4>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#F59A23', userSelect: 'none' }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </div>
                    {isOpen && (
                      <p style={{ margin: '10px 0 0', color: '#64748B', fontSize: '13.5px', lineHeight: '1.7' }}>
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Left Sidebar Column (LEFT in RTL - Dynamic DB Services & Availability Binding) */}
        <div className="left-sidebar-stack">
          
          {/* Card 1: Interactive Booking Widget Section with Live Database Services */}
          <div id="booking-widget-section" className="booking-widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <small style={{ color: '#64748B', fontSize: '11px', fontWeight: '700' }}>حجز جلسة</small>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B2E4B', margin: '2px 0 0' }}>{getWeekTitle(weekOffset)}</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* Left Arrow (‹) -> INCREASES week offset by 1 (الأسبوع القادم) */}
                <button 
                  onClick={() => {
                    setWeekOffset(w => w + 1);
                    setSelectedTime(null);
                  }}
                  title="الأسبوع القادم"
                  style={{ 
                    border: '1px solid #CBD5E1', borderRadius: '50%', width: '30px', height: '30px', 
                    background: '#fff', cursor: 'pointer', fontWeight: '800', color: '#0B2E4B' 
                  }}
                >
                  ‹
                </button>

                {/* Right Arrow (›) -> DECREASES week offset by 1, CANNOT GO BELOW 0 (No past weeks) */}
                <button 
                  onClick={() => {
                    setWeekOffset(w => Math.max(0, w - 1));
                    setSelectedTime(null);
                  }}
                  disabled={weekOffset === 0}
                  title="الأسبوع السابق"
                  style={{ 
                    border: '1px solid #CBD5E1', borderRadius: '50%', width: '30px', height: '30px', 
                    background: weekOffset === 0 ? '#F1F5F9' : '#fff', 
                    cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', 
                    fontWeight: '800', 
                    color: weekOffset === 0 ? '#94A3B8' : '#0B2E4B',
                    opacity: weekOffset === 0 ? 0.4 : 1
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* DYNAMIC DATABASE SERVICES SELECTOR */}
            <div className="booking-durations" style={{ gridTemplateColumns: displayServices.length > 1 ? '1fr 1fr' : '1fr' }}>
              {displayServices.map((srv, idx) => {
                const isSelected = selectedServiceId === srv.id || (!selectedServiceId && idx === 0);
                return (
                  <div 
                    key={srv.id || idx}
                    className={`booking-dur-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setSelectedDuration(String(srv.duration_minutes || srv.duration || 45));
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>⏱</span>
                    <div>
                      <small style={{ display: 'block', color: '#64748B', fontSize: '10px' }}>{srv.name}</small>
                      <b>{srv.duration_minutes || srv.duration || 45} دقيقة</b>
                    </div>
                    <small>{srv.price} د.أ</small>
                  </div>
                );
              })}
            </div>

            {/* Specialization selection */}
            <div style={{ margin: '14px 0' }}>
              <small style={{ color: '#64748B', display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700' }}>مجال الاستشارة</small>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="cp-chip active" style={{ borderRadius: '20px', padding: '6px 14px' }}>{activeProfile.specialization_name || 'ضريبة المبيعات'}</span>
                <span className="cp-chip" style={{ borderRadius: '20px', padding: '6px 14px' }}>ضريبة الدخل</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', lineHeight: '1.4' }}>
                اختر مجال الاستشارة حتى يتمكن المستشار من التحضير للموضوع قبل الموعد.
              </p>
            </div>

            {/* Days Selector Row (Mapped to Database Availabilities) */}
            <div className="booking-days-row">
              {days.map((d, i) => (
                <button 
                  key={d.num + i} 
                  className={`booking-day-btn ${selectedDayIdx === i ? 'active' : d.avail ? 'available' : ''}`}
                  onClick={() => {
                    setSelectedDayIdx(i);
                    setSelectedTime(null);
                  }}
                >
                  <div>{d.label}</div>
                  <b style={{ fontSize: '13px' }}>{d.num}</b>
                </button>
              ))}
            </div>

            {/* Selected Date Header & Time Range */}
            <div style={{ fontSize: '13px', color: '#0B2E4B', fontWeight: '800', marginTop: '12px', textAlign: 'center' }}>
              {currentDayObj.fullDate}
              <small style={{ display: 'block', color: currentDayObj.avail ? '#166534' : '#EF4444', fontSize: '11px', marginTop: '2px' }}>
                {currentDayObj.timeRange}
              </small>
            </div>

            {/* Time Slots Grid OR Weekend Off-Day Card */}
            {!currentDayObj.avail ? (
              <div style={{
                border: '1px dashed #CBD5E1',
                background: '#F8FAFC',
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: '700',
                marginTop: '14px'
              }}>
                لا توجد مواعيد متاحة في هذا اليوم (عطلة رسمية للمستشار).
              </div>
            ) : timeslots.length === 0 ? (
              <div style={{
                border: '1px dashed #FCA5A5',
                background: '#FEF2F2',
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#991B1B',
                fontSize: '13px',
                fontWeight: '700',
                marginTop: '14px'
              }}>
                جميع المواعيد المتاحة في هذا اليوم محجوزة بالكامل.
              </div>
            ) : (
              <div className="booking-slots-grid">
                {timeslots.map(t => (
                  <button 
                    key={t} 
                    className={`booking-slot-btn ${selectedTime === t ? 'active' : ''}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              {/* Primary Action Button: Triggers direct Payment Gateway */}
              <button 
                onClick={handleProceedToBookingRequest}
                style={{
                  width: '100%',
                  background: '#F59A23',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .2s ease',
                  boxShadow: '0 4px 14px rgba(245,154,35,0.35)'
                }}
              >
                إرسال طلب الحجز (بانتظار موافقة المستشار) ←
              </button>

              <button 
                onClick={handleProceedToBookingRequest}
                style={{
                  width: '100%', background: '#fff', color: '#0B2E4B', border: '1px solid #0B2E4B',
                  borderRadius: '30px', padding: '12px', fontWeight: '800',
                  fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '10px'
                }}
              >
                إرسال طلب الحجز • {selectedService?.price || 42.50} د.أ
              </button>

              <p style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '10px', margin: '10px 0 0' }}>
                ✓ إلغاء مجاني حتى 24 ساعة قبل الجلسة
              </p>
            </div>
          </div>

          {/* Card 2: Quick Overview Card (نظرة سريعة) */}
          <div className="booking-widget-card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#64748B', marginBottom: '14px' }}>نظرة سريعة</h3>
            
            <div className="quick-overview-row">
              <span className="quick-overview-label">وقت الاستجابة</span>
              <span className="quick-overview-val">عادةً خلال ساعة</span>
            </div>
            <div className="quick-overview-row">
              <span className="quick-overview-label">الجلسات المكتملة</span>
              <span className="quick-overview-val">{sessionsCount}</span>
            </div>
            <div className="quick-overview-row">
              <span className="quick-overview-label">عضو منذ</span>
              <span className="quick-overview-val">2024</span>
            </div>
            <div className="quick-overview-row">
              <span className="quick-overview-label">الخبرة</span>
              <span className="quick-overview-val">{years} سنة</span>
            </div>
            <div className="quick-overview-row">
              <span className="quick-overview-label">رسوم الجلسات</span>
              <span className="quick-overview-val">{minServicePrice} د.أ</span>
            </div>
            <div className="quick-overview-row">
              <span className="quick-overview-label">الحجز</span>
              <span className="quick-overview-val" style={{ color: '#166534' }}>فوري</span>
            </div>
          </div>

          {/* Card 3: Ask Question Box (لست متأكداً بعد؟) */}
          <div className="ask-question-card">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>لست متأكداً بعد؟</h3>
            <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '4px 0 0' }}>يرد عادةً خلال ساعة في أيام العمل.</p>

            {questionSent ? (
              <div style={{ background: 'rgba(22,163,109,0.2)', border: '1px solid #16A36D', color: '#6EE7B7', padding: '10px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: '700', marginTop: '12px' }}>
                ✅ تم إرسال سؤالك للمستشار بنجاح!
              </div>
            ) : (
              <div className="ask-question-input-wrap">
                <input 
                  placeholder="اكتب سؤالك للمستشار..." 
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendQuestion(); }}
                />
                <button className="ask-question-btn" onClick={handleSendQuestion}>إرسال</button>
              </div>
            )}
          </div>

          {/* Card 4: Specialization Categories Explorer (مجالات الاستشارة) */}
          <div className="booking-widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <small style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>استكشف المزيد</small>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0B2E4B' }}>مجالات الاستشارة</h3>
              </div>
              <button style={{ background: 'transparent', border: 0, color: '#0B2E4B', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>الكل ←</button>
            </div>

            {[
              { title: 'ضريبة المبيعات', count: '14 مستشاراً', bg: '#FFF8EC' },
              { title: 'ضريبة الدخل', count: '12 مستشاراً', bg: '#F3E8FF' },
              { title: 'الاعتراضات', count: '8 مستشارين', bg: '#DCFCE7' },
              { title: 'الفوترة الإلكترونية', count: '7 مستشارين', bg: '#FEF3C7' },
              { title: 'الاقتطاع', count: '6 مستشارين', bg: '#FEE2E2' },
              { title: 'الضرائب الدولية', count: '5 مستشارين', bg: '#F5F5F4' },
              { title: 'التدقيق الضريبي', count: '9 مستشارين', bg: '#EDE9FE' },
              { title: 'الخدمات الرقمية', count: '4 مستشارين', bg: '#E0E7FF' },
            ].map(cat => (
              <div key={cat.title} className="topic-card-item" style={{ background: cat.bg }}>
                <span style={{ fontSize: '14px', color: '#0B2E4B', fontWeight: '900' }}>↗</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0B2E4B' }}>{cat.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{cat.count}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ConsultantsPage({ navigate }) {
  const { token, user } = useAuth();
  const [all,setAll]         = useState([]);
  const [specs,setSpecs]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [selected,setSelected]= useState(null);
  const [viewProfile,setViewProfile] = useState(null);
  const [scrollToBooking,setScrollToBooking] = useState(false);
  const [toast,setToast]     = useState('');
  const [paymentData,setPaymentData] = useState(null);
  const [errorModal,setErrorModal] = useState(''); // booking error modal

  const [search,setSearch]   = useState('');
  const [cityF,setCityF]     = useState('');
  const [availF,setAvailF]   = useState(false);
  const [selSpecs,setSelSpecs]= useState([]);
  const [selComms,setSelComms]= useState([]);
  const [chip,setChip]       = useState(null);
  const [minRat,setMinRat]   = useState('');
  const [view,setView]       = useState('grid');
  const [sort,setSort]       = useState('best');
  const [page,setPage]       = useState(1);

  const isConsultantMe = useCallback((c) => {
    if (!user) return false;
    if (user.id && (c.id === user.id || c.user_id === user.id || c.profile_id === user.id)) return true;
    if (user.email && c.email && user.email.toLowerCase() === c.email.toLowerCase()) return true;
    if (user.full_name && c.full_name && user.full_name.trim() === c.full_name.trim()) return true;
    if (user.name && c.full_name && user.name.trim() === c.full_name.trim()) return true;
    return false;
  }, [user]);

  const fetchData = useCallback(async()=>{
    setLoading(true);
    try {
      const f={};
      if(minRat) f.min_rating=parseFloat(minRat);
      if(chip!==null){ const c=CHIPS[chip]; if(c.max) f.max_price=c.max; if(c.min) f.min_price=c.min; }
      if(search.trim()) f.service_name=search.trim();
      const [cd,sd]=await Promise.all([consultantService.getConsultants(f,token),consultantService.getSpecializations()]);
      setAll(Array.isArray(cd)?cd:[]);
      setSpecs(Array.isArray(sd)?sd:[]);
    } catch(e){ console.error(e); setAll([]); }
    finally { setLoading(false); }
  },[minRat,chip,search,token]);

  useEffect(()=>{ fetchData(); },[fetchData]);

  const filtered = all.filter(c=>{
    if(isConsultantMe(c)) return false; // Don't show current consultant's own card in directory
    if(selSpecs.length>0 && !selSpecs.includes(String(c.specialization_id))) return false;
    if(availF && c.is_available===false) return false;
    if(cityF && c.city!==cityF) return false;
    if(selComms.length>0){ const sv=c.services||[]; if(!selComms.some(m=>sv.includes(m))) return false; }
    return true;
  });

  const sorted=[...filtered].sort((a,b)=>{
    if(sort==='rating') return (b.average_rating||0)-(a.average_rating||0);
    if(sort==='priceLow') return (a.price||0)-(b.price||0);
    if(sort==='priceHigh') return (b.price||0)-(a.price||0);
    return 0;
  });
  const totalPages=Math.ceil(sorted.length/PAGE_SIZE);
  const paged=sorted.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const reset=()=>{ setSelSpecs([]); setSelComms([]); setChip(null); setMinRat(''); setCityF(''); setAvailF(false); setSearch(''); setPage(1); };
  const toggleSpec=id=>{ const s=String(id); setSelSpecs(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]); setPage(1); };
  const toggleComm=v=>{ setSelComms(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]); setPage(1); };
  const showToast=msg=>{ setToast(msg); setTimeout(()=>setToast(''),3000); };

  const handleBookNowFromCatalog = (consultantObj) => {
    const profileId = consultantObj?.profile_id || consultantObj?.id;
    if (profileId) window.history.pushState({ consultantId: profileId }, '', `/consultants/${profileId}`);
    setViewProfile(consultantObj);
    setScrollToBooking(true);
  };

  const handleViewProfileFromCatalog = (consultantObj) => {
    const profileId = consultantObj?.profile_id || consultantObj?.id;
    if (profileId) window.history.pushState({ consultantId: profileId }, '', `/consultants/${profileId}`);
    setViewProfile(consultantObj);
    setScrollToBooking(false);
  };

  const pageNums = Array.from({length:totalPages},(_,i)=>i+1)
    .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
    .reduce((a,p,i,arr)=>{ if(i>0&&arr[i-1]!==p-1) a.push('…'); a.push(p); return a; },[]);

  const handleBookRequest = async (pData) => {
    const getCookie = (name) => {
      try {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      } catch { return null; }
    };

    showToast('جاري تسجيل طلب الحجز...');

    try {
      const activeAuthToken = token || getCookie('token');
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      let targetConsultantId = pData?.consultant_id;
      if (!isUuid(targetConsultantId)) {
        targetConsultantId = 'c2264e0d-7229-481a-9718-8657077c42fe';
      }

      // Timestamp comes as valid UTC ISO string from toISOString() - use as-is
      const scheduledAt = pData?.scheduled_at || new Date().toISOString();

      console.log('[Booking] POST /api/appointments/', {
        consultant_id: targetConsultantId,
        service_id: isUuid(pData?.service_id) ? pData.service_id : null,
        scheduled_at: scheduledAt,
        token_present: !!activeAuthToken
      });

      await appointmentService.bookAppointment({
        consultant_id: targetConsultantId,
        service_id: isUuid(pData?.service_id) ? pData.service_id : null,
        scheduled_at: scheduledAt,
        notes: pData?.serviceName || 'طلب حجز استشارة'
      }, activeAuthToken);

      setToast(''); // clear loading toast immediately on success
      showToast('تم إرسال طلب الحجز بنجاح. الاستشارة الآن قيد انتظار موافقة المستشار.');
      setTimeout(() => {
        if (typeof navigate === 'function') {
          navigate('/my-appointments');
        } else {
          window.location.href = '/my-appointments';
        }
      }, 1200);
    } catch (err) {
      console.error('[Booking] Error:', err);
      const errMsg = err?.detail || err?.message || 'حدث خطأ أثناء الحجز';
      setToast(''); // clear loading toast immediately on error
      setErrorModal(errMsg);
    }
  };

  if (viewProfile) {
    return (
      <>
        <style>{CSS}</style>
        <div className="cp-root">
          <FullProfileView 
            consultant={viewProfile} 
            onClose={() => { window.history.replaceState({}, '', '/consultants'); setViewProfile(null); setScrollToBooking(false); }}
            onBook={(c) => setSelected(c)}
            onBookRequest={handleBookRequest}
            scrollToBookingOnMount={scrollToBooking}
          />
          <BookingModal
            consultant={selected}
            isOpen={!!selected}
            onClose={() => setSelected(null)}
            onSuccess={() => { setSelected(null); showToast('تم حجز الاستشارة بنجاح'); navigate && navigate('/my-appointments'); }}
          />
          <PaymentModal
            isOpen={!!paymentData}
            onClose={() => setPaymentData(null)}
            onSuccess={() => {
              setPaymentData(null);
              showToast('تم دفع الاستشارة بنجاح وتأكيد الحجز');
              if (navigate) navigate('/my-appointments');
            }}
            price={paymentData?.price || 42.50}
            consultantName={paymentData?.consultantName || 'أ. رأفت حداد'}
            serviceName={paymentData?.serviceName || 'استشارة ضريبية'}
            isMock={true}
          />
          {toast && (
            <div className="cp-toast-backdrop">
              <div className="cp-toast">
                <div className="cp-toast-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>{toast}</div>
              </div>
            </div>
          )}

          {/* Booking Error Modal */}
          {errorModal && (
            <div onClick={() => setErrorModal('')} style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(13, 60, 92, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div onClick={e => e.stopPropagation()} style={{
                background: '#FFFFFF', borderRadius: '18px',
                padding: '36px 32px', maxWidth: '400px', width: '90%',
                boxShadow: '0 24px 64px rgba(239,68,68,0.15)',
                textAlign: 'center', direction: 'rtl'
              }}>
                {/* X Icon */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#FEE2E2,#FECACA)',
                  border: '3px solid #FECACA',
                  margin: '0 auto 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 10px' }}>
                  فشل الحجز
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px', lineHeight: 1.7 }}>
                  {errorModal}
                </p>
                <button
                  onClick={() => setErrorModal('')}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: '10px',
                    border: 'none', background: '#EF4444',
                    color: '#FFFFFF', fontWeight: '700', fontSize: '14px',
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
                  }}
                  onMouseOver={e => e.currentTarget.style.background='#DC2626'}
                  onMouseOut={e => e.currentTarget.style.background='#EF4444'}
                >
                  حسناً، سأختار وقتاً آخر
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cp-root">

        {/* Hero */}
        <section className="cp-hero">
          <div>
            <h1>اعثر على <em>المستشار المناسب</em><br/>بسهولة وسرعة.</h1>
          </div>
          <p>جميع المستشارين المعروضين موثّقون ومعتمدون. استخدم الفلاتر حسب التخصص، السعر، التقييم والتوفر للوصول إلى المستشار الأنسب لك.</p>
        </section>

        {/* Search bar */}
        <div className="cp-searchbar">
          <div className="cp-search-input">
            <span style={{color:'#94A3B8',fontSize:'18px'}}>⌕</span>
            <input
              placeholder="ابحث باسم المستشار أو المجال الضريبي..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){ fetchData(); setPage(1); } }}
            />
          </div>
          <div className="cp-top-filter">
            <label>التوفر:</label>
            <select className="cp-top-select" value={availF?'now':''} onChange={e=>{ setAvailF(e.target.value==='now'); setPage(1); }}>
              <option value="">أي وقت</option>
              <option value="now">متاح الآن</option>
            </select>
          </div>
          <div className="cp-top-filter">
            <label>المدينة:</label>
            <select className="cp-top-select" value={cityF} onChange={e=>{ setCityF(e.target.value); setPage(1); }}>
              <option value="">أي مكان</option>
              {CITIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <button className="cp-search-btn" onClick={()=>{ fetchData(); setPage(1); }}>ابحث الآن ←</button>
        </div>

        {/* Content grid */}
        <div className="cp-content">
          {/* Sidebar */}
          <aside className="cp-filters">
            <div className="cp-filter-top">
              <h2>الفلاتر</h2>
              <button className="cp-clear-btn" onClick={reset}>مسح الكل</button>
            </div>

            <div className="cp-filter-group">
              <div className="cp-filter-label">المجال</div>
              <div className="cp-checks">
                {specs.slice(0,7).map(s=>(
                  <label key={s.id}>
                    <input type="checkbox" checked={selSpecs.includes(String(s.id))} onChange={()=>toggleSpec(s.id)}/>
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="cp-filter-group">
              <div className="cp-filter-label">المدينة</div>
              <div className="cp-checks">
                {CITIES.map(c=>(
                  <label key={c}>
                    <input type="checkbox" checked={cityF===c} onChange={()=>{ setCityF(cityF===c?'':c); setPage(1); }}/>
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="cp-filter-group">
              <div className="cp-filter-label">نوع الخدمة</div>
              <div className="cp-checks">
                {COMM.map(m=>(
                  <label key={m.v}>
                    <input type="checkbox" checked={selComms.includes(m.v)} onChange={()=>toggleComm(m.v)}/>
                    {m.l}
                  </label>
                ))}
              </div>
            </div>

            <div className="cp-filter-group">
              <div className="cp-filter-label">السعر / الجلسة</div>
              <div className="cp-chip-row">
                {CHIPS.map((c,i)=>(
                  <button key={i} className={`cp-chip${chip===i?' active':''}`}
                    onClick={()=>{ setChip(chip===i?null:i); setPage(1); setTimeout(fetchData,0); }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cp-filter-group">
              <div className="cp-filter-label">التقييم</div>
              <div className="cp-checks">
                {[{v:'4.7',l:'4.7 فأعلى'},{v:'4.5',l:'4.5 فأعلى'},{v:'4.0',l:'4.0 فأعلى'}].map(r=>(
                  <label key={r.v}>
                    <input type="radio" name="cpRating" checked={minRat===r.v} onChange={()=>{ setMinRat(minRat===r.v?'':r.v); setPage(1); }}/>
                    {r.l}
                  </label>
                ))}
              </div>
            </div>

            <div className="cp-filter-group">
              <div className="cp-filter-label">التوفر</div>
              <div className="cp-checks">
                <label>
                  <input type="checkbox" checked={availF} onChange={()=>{ setAvailF(v=>!v); setPage(1); }}/>
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
                  <button className={view==='grid'?'active':''} onClick={()=>setView('grid')} title="عرض شبكي">▦</button>
                  <button className={view==='list'?'active':''} onClick={()=>setView('list')} title="عرض قائمة">☰</button>
                </div>
                <div className="cp-sort">
                  <span>ترتيب حسب:</span>
                  <select value={sort} onChange={e=>setSort(e.target.value)}>
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
            ) : paged.length===0 ? (
              <div className="cp-empty">
                <div className="cp-empty-icon">🔍</div>
                <h3>لا يوجد مستشارون مطابقون</h3>
                <p>جرّب تغيير معايير البحث أو إزالة بعض الفلاتر.</p>
                <button style={{marginTop:'16px',background:'#F59A23',color:'#fff',border:'none',borderRadius:'999px',padding:'10px 24px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}} onClick={reset}>مسح جميع الفلاتر</button>
              </div>
            ) : (
              <div className="cp-cards-container">
                <div className={view === 'list' ? 'cp-cards-list' : 'cp-cards-grid'}>
                  {paged.map((c,i)=>(
                    <CCard key={c.profile_id||c.id||i} c={c} idx={(page-1)*PAGE_SIZE+i}
                      onBook={handleBookNowFromCatalog} onView={handleViewProfileFromCatalog} list={view==='list'}
                      isMe={isConsultantMe(c)}/>
                  ))}
                </div>
              </div>
            )}

            {totalPages>1 && (
              <div className="cp-pagination">
                {page>1 && <button onClick={()=>setPage(p=>p-1)}>‹</button>}
                {pageNums.map((p,i)=>
                  p==='…' ? <span key={`d${i}`} style={{padding:'0 4px',color:'#667A8A'}}>…</span>
                  : <button key={p} className={page===p?'active':''} onClick={()=>setPage(p)}>{p}</button>
                )}
                {page<totalPages && <button onClick={()=>setPage(p=>p+1)}>›</button>}
              </div>
            )}
          </main>
        </div>

        <BookingModal
          consultant={selected}
          isOpen={!!selected}
          onClose={()=>setSelected(null)}
          onSuccess={()=>{ setSelected(null); showToast('تم حجز الاستشارة بنجاح'); navigate&&navigate('/my-appointments'); }}
        />

        <PaymentModal
          isOpen={!!paymentData}
          onClose={() => setPaymentData(null)}
          onSuccess={() => {
            setPaymentData(null);
            showToast('تم دفع الاستشارة بنجاح وتأكيد الحجز');
            if (navigate) navigate('/my-appointments');
          }}
          price={paymentData?.price || 42.50}
          consultantName={paymentData?.consultantName || 'أ. رأفت حداد'}
          serviceName={paymentData?.serviceName || 'استشارة ضريبية'}
          isMock={true}
        />

        {toast && (
          <div className="cp-toast-backdrop">
            <div className="cp-toast">
              <div className="cp-toast-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
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
