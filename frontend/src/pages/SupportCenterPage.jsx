import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from './supportFormConfig';

export default function SupportCenterPage({ navigate }) {
  const { token } = useAuth();
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRecentTickets = async () => {
      try {
        const data = await apiFetch('/api/tickets/my?limit=5', {}, token);
        setRecentTickets(data || []);
      } catch (e) {
        console.error('Error fetching tickets:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentTickets();
  }, [token]);

  const filteredCategories = Object.keys(CATEGORIES).filter(key =>
    CATEGORIES[key].label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    CATEGORIES[key].description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in max-w-6xl mx-auto p-4 md:p-6" dir="rtl">
      {/* Hero section */}
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0e3b5e] flex items-center justify-center gap-2">
          مركز الدعم والمساعدة <span className="text-orange-500 text-xl md:text-2xl">⚙</span>
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
          كيف يمكننا مساعدتك اليوم؟ تصفّح مركز الدعم والمساعدة، أو قم بتقديم طلب دعم جديد لمتابعة استفسارك مع فريق الدعم الفني.
        </p>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/support/new-ticket')}
            className="flex items-center gap-2 bg-[#0e3b5e] hover:bg-[#082a44] text-white font-bold text-sm px-6 py-3 rounded-xl transition duration-200 shadow-md shadow-[#0e3b5e]/10"
          >
            <i className="fa fa-plus"></i>
            تقديم طلب دعم جديد
          </button>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto relative mt-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 flex items-center">
            <input
              type="text"
              placeholder="ابحث في فئات الدعم والمساعدة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none px-4 py-2.5 text-sm text-gray-600 bg-transparent text-right"
            />
            <span className="w-10 h-10 flex items-center justify-center text-gray-400">
              <i className="fa fa-search"></i>
            </span>
          </div>
        </div>
      </div>

      {/* Grid Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {filteredCategories.map((key) => {
          const cat = CATEGORIES[key];
          return (
            <div
              key={key}
              onClick={() => navigate(`/support/new-ticket?category=${key}`)}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group flex flex-col items-start text-right"
            >
              <div className="w-12 h-12 bg-[#0e7490]/10 text-[#0e7490] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0e7490] group-hover:text-white transition duration-200">
                <i className={`fa ${cat.icon} text-lg`}></i>
              </div>
              <h3 className="font-bold text-[#0e3b5e] text-sm md:text-base mb-2">{cat.label}</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-1">{cat.description}</p>
              <button className="text-[#0e7490] group-hover:text-orange-500 font-bold text-xs transition duration-200 flex items-center gap-1 mt-auto">
                فتح تذكرة <i className="fa fa-arrow-left text-[9px] mr-1"></i>
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent Tickets Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-[#0e3b5e]">طلباتي الأخيرة</h3>
            <p className="text-gray-400 text-xs mt-1">تتبع آخر طلبات الدعم التي قمت بتقديمها وحالتها الحالية.</p>
          </div>
          <button
            onClick={() => navigate('/support/tickets')}
            className="text-[#0e7490] hover:text-orange-500 font-bold text-xs transition duration-200 flex items-center gap-1"
          >
            عرض جميع الطلبات <i className="fa fa-arrow-left text-[10px] mr-1"></i>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#0e3b5e] flex items-center justify-center gap-2">
            <i className="fa fa-spinner fa-spin"></i>
            <span>جاري تحميل طلباتك الأخيرة...</span>
          </div>
        ) : recentTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold text-right">رقم الطلب</th>
                  <th className="pb-3 font-semibold text-right">الموضوع</th>
                  <th className="pb-3 font-semibold text-right">الفئة</th>
                  <th className="pb-3 font-semibold text-right">الحالة</th>
                  <th className="pb-3 font-semibold text-right">الأولوية</th>
                  <th className="pb-3 font-semibold text-right">تاريخ الإنشاء</th>
                  <th className="pb-3 font-semibold text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.slice(0, 5).map((t) => {
                  const stat = STATUS_CONFIG[t.status] || { label: t.status, color: 'bg-gray-50 text-gray-500' };
                  const prio = PRIORITY_CONFIG[t.priority] || { label: t.priority, color: 'bg-gray-50 text-gray-500' };
                  const catLabel = CATEGORIES[t.category]?.label || t.category;
                  const formattedDate = new Date(t.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition duration-150">
                      <td className="py-4 font-mono font-bold text-[#0e3b5e]">{t.ticket_number || `#${t.id.slice(0, 8)}`}</td>
                      <td className="py-4 font-semibold text-gray-700 max-w-xs truncate">{t.subject}</td>
                      <td className="py-4 text-gray-500">{catLabel}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${stat.color}`}>
                          <i className={`fa ${stat.icon} text-[8px]`}></i>
                          {stat.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${prio.color}`}>
                          {prio.label}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">{formattedDate}</td>
                      <td className="py-4">
                        <button
                          onClick={() => navigate(`/support/tickets/${t.id}`)}
                          className="text-[#0e7490] hover:text-orange-500 font-bold transition duration-150"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <span className="text-3xl">🎧</span>
            <h4 className="mt-3 font-semibold text-gray-700">لا توجد طلبات دعم حالياً</h4>
            <p className="text-xs text-gray-400 mt-1">تظهر هنا طلبات الدعم التي قمت بتقديمها.</p>
          </div>
        )}
      </div>
    </div>
  );
}
