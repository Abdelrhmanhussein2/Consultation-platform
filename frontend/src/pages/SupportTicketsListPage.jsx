import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from './supportFormConfig';

export default function SupportTicketsListPage({ navigate }) {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let url = `/api/tickets/my?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data || []);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token, page, statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="fade-in max-w-6xl mx-auto p-4 md:p-6" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0e3b5e] mb-2">طلبات الدعم والمساعدة 🎧</h1>
          <p className="text-gray-500 text-xs md:text-sm">تابع طلبات الدعم المفتوحة والسابقة الخاصة بك، وتواصل مع فريق الدعم الفني.</p>
        </div>
        <button
          onClick={() => navigate('/support/new-ticket')}
          className="btn-primary text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
        >
          <i className="fa fa-plus-circle"></i>
          تقديم طلب دعم جديد
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-5 mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Query Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث برقم الطلب أو الموضوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field"
          >
            <option value="">كل الحالات</option>
            {Object.keys(STATUS_CONFIG).map(k => (
              <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="input-field"
          >
            <option value="">كل الفئات الرئيسية</option>
            {Object.keys(CATEGORIES).map(k => (
              <option key={k} value={k}>{CATEGORIES[k].label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="input-field"
          >
            <option value="">كل الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>

          {/* Filter Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-navy flex-1 text-xs py-2.5 px-0"
              style={{ minWidth: '70px' }}
            >
              بحث
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-secondary px-4 py-2.5"
              title="مسح الفلاتر"
            >
              <i className="fa fa-rotate-left"></i>
            </button>
          </div>
        </form>
      </div>

      {/* Tickets Log Table */}
      <div className="card p-6">
        {loading ? (
          <div className="py-20 text-center text-[#0e3b5e] flex items-center justify-center gap-2">
            <i className="fa fa-spinner fa-spin text-xl"></i>
            <span className="font-semibold text-sm">جاري تحميل طلبات الدعم...</span>
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold text-right">رقم الطلب</th>
                  <th className="pb-3 font-semibold text-right">الموضوع</th>
                  <th className="pb-3 font-semibold text-right">الفئة</th>
                  <th className="pb-3 font-semibold text-center">الحالة</th>
                  <th className="pb-3 font-semibold text-center">الأولوية</th>
                  <th className="pb-3 font-semibold text-center">تاريخ الإنشاء</th>
                  <th className="pb-3 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const stat = STATUS_CONFIG[t.status] || { label: t.status, color: 'bg-gray-50 text-gray-500' };
                  
                  // Map priority label in Arabic for list UI
                  const prioLabel = t.priority === 'high' ? 'عالية' : t.priority === 'low' ? 'منخفضة' : 'متوسطة';
                  const prio = PRIORITY_CONFIG[t.priority] || { label: prioLabel, color: 'bg-gray-50 text-gray-500' };
                  
                  const catLabel = CATEGORIES[t.category]?.label || t.category;
                  const formattedDate = new Date(t.created_at).toLocaleDateString('zh-Hans-CN', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                  });

                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition duration-150">
                      <td className="py-4 font-mono font-bold text-[#0e3b5e]">{t.ticket_number || `#${t.id.slice(0, 8)}`}</td>
                      <td className="py-4 font-semibold text-gray-700 max-w-sm truncate">{t.subject}</td>
                      <td className="py-4 text-gray-500">{catLabel}</td>
                      <td className="py-4 text-center">
                        <span className={`badge ${stat.color} text-[10px] px-2.5 py-0.5`}>
                          <i className={`fa ${stat.icon} ml-1 text-[8px]`}></i>
                          {stat.label}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`badge ${prio.color} text-[10px] px-2.5 py-0.5`}>
                          {prio.label}
                        </span>
                      </td>
                      <td className="py-4 text-center text-gray-400">{formattedDate}</td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => navigate(`/support/tickets/${t.id}`)}
                          className="btn-secondary text-[11px] py-1.5 px-3"
                          style={{ minHeight: 'auto', borderRadius: '8px' }}
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-150">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn-secondary text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-xs text-gray-500">الصفحة {page}</span>
              <button
                disabled={tickets.length < limit}
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <span className="text-5xl">🎟️</span>
            <h4 className="mt-4 font-bold text-gray-700 text-sm md:text-base">لم يتم العثور على طلبات دعم فني</h4>
            <p className="text-xs text-gray-400 mt-1.5">جرب تعديل خيارات البحث أو قم بإنشاء طلب دعم جديد.</p>
          </div>
        )}
      </div>
    </div>
  );
}
