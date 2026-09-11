import React from 'react';
import { createPortal } from 'react-dom';
import { cls } from '../utils/controlCenterHelpers';

export default function Profile360Modal({
  modalOpen,
  setModalOpen,
  modalSize,
  modalTitle,
  modalTabs,
  activeModalTab,
  setActiveModalTab,
  selectedEntity,
  entityDetails,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  setViewingTicket,
  showToastMsg
}) {
  if (!modalOpen || !selectedEntity) return null;

  return createPortal(
    <div className="overlay show" onClick={() => setModalOpen(false)}>
      <div
        className={`modal ${modalSize || ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '1120px', maxWidth: '96vw', maxHeight: '92vh' }}
      >
        <div className="modal-head">
          <div className="modal-title">{modalTitle}</div>
          <button className="close" onClick={() => setModalOpen(false)}>
            ×
          </button>
        </div>

        {modalTabs.length > 0 && (
          <div className="modal-tabs">
            {modalTabs.map((t) => (
              <button
                key={t}
                className={`modal-tab ${activeModalTab === t ? 'active' : ''}`}
                onClick={() => setActiveModalTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body">
          <div className="profile-shell">
            <aside className="profile-side">
              <div className="profile-avatar-lg">
                {(entityDetails?.full_name || selectedEntity.title)?.slice(0, 2) || '360'}
              </div>
              <div className="profile-name">
                {entityDetails?.full_name || selectedEntity.title}
              </div>
              <div className="profile-meta">
                {entityDetails?.email || selectedEntity.subtitle}
                <br />
                {entityDetails?.company_name && entityDetails.company_name !== '—'
                  ? entityDetails.company_name
                  : selectedEntity.company && selectedEntity.company !== '—'
                  ? selectedEntity.company
                  : (selectedEntity.type === 'مستشار' ? 'مستشار ضريبي معتمد' : selectedEntity.desc || 'حساب فردي')}
                <br />
                {entityDetails?.account_id || selectedEntity.id}
              </div>
              <div className="quick-grid">
                <div className="quick-stat">
                  <span>الاستشارات</span>
                  <b>
                    {entityDetails?.appointments?.length ??
                      (selectedEntity.consultations || 0)}
                  </b>
                </div>
                <div className="quick-stat">
                  <span>الحجوزات</span>
                  <b>{entityDetails?.appointments?.length ?? 0}</b>
                </div>
                <div className="quick-stat">
                  <span>التذاكر</span>
                  <b>
                    {entityDetails?.tickets?.length ?? (selectedEntity.tickets || 0)}
                  </b>
                </div>
                <div className="quick-stat">
                  <span>التقييمات</span>
                  <b>
                    {entityDetails?.stats?.avg_rating
                      ? `${entityDetails.stats.avg_rating}/5`
                      : selectedEntity.rating && selectedEntity.rating !== '—'
                      ? `${selectedEntity.rating}/5`
                      : '—'}
                  </b>
                </div>
              </div>
              <div className="side-actions">
                <button
                  type="button"
                  className="side-action"
                  onClick={() => setActiveModalTab('المحادثات')}
                >
                  فتح المحادثات
                </button>
                <button
                  type="button"
                  className="side-action"
                  onClick={() => setActiveModalTab('التنبيهات')}
                >
                  إرسال / عرض التنبيهات
                </button>
                <button
                  type="button"
                  className="side-action"
                  onClick={() => setActiveModalTab('المدفوعات')}
                >
                  عرض المدفوعات
                </button>
                <button
                  type="button"
                  className="side-action"
                  onClick={() => setActiveModalTab('النشاط')}
                >
                  سجل النشاط
                </button>
              </div>
            </aside>

            <div className="profile-main">
              {/* 1. Overview Tab */}
              {activeModalTab === 'نظرة عامة' && (
                <>
                  <div className="profile-card">
                    <div className="profile-card-head">
                      <span>
                        {selectedEntity.type === 'مستشار'
                          ? 'ملخص المستشار'
                          : selectedEntity.type === 'استشارة'
                          ? 'ملخص الاستشارة'
                          : selectedEntity.type === 'مدير منصة'
                          ? 'بيانات إدارة المنصة'
                          : 'الملف الأساسي'}
                      </span>
                      <span className={`status ${cls(selectedEntity.status)}`}>
                        {selectedEntity.status}
                      </span>
                    </div>
                    <div className="profile-card-body">
                      {selectedEntity.type === 'مدير منصة' ? (
                        <div className="detail-grid">
                          <div className="detail">
                            <span>تاريخ التسجيل</span>
                            <b>
                              {entityDetails?.created_at && entityDetails.created_at !== '—'
                                ? entityDetails.created_at
                                : selectedEntity.registered || '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الاسم الكامل</span>
                            <b>
                              {entityDetails?.full_name || selectedEntity.title || '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الدور الإداري</span>
                            <b>
                              {entityDetails?.legal_form && entityDetails.legal_form !== '—'
                                ? entityDetails.legal_form
                                : 'إدارة النظام والتحكم (سوبر أدمن)'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>البريد الإلكتروني</span>
                            <b>
                              {entityDetails?.email || selectedEntity.subtitle || '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>مستوى الصلاحيات</span>
                            <b>صلاحيات إدارية كاملة (Super Admin)</b>
                          </div>
                          <div className="detail">
                            <span>حالة الحساب</span>
                            <b>موثق ونشط في المنصة</b>
                          </div>
                        </div>
                      ) : selectedEntity.type === 'مستشار' ? (
                        <div className="detail-grid">
                          <div className="detail">
                            <span>تاريخ التسجيل</span>
                            <b>
                              {entityDetails?.created_at && entityDetails.created_at !== '—'
                                ? entityDetails.created_at
                                : selectedEntity.registered || '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الاسم الكامل</span>
                            <b>
                              {entityDetails?.full_name || selectedEntity.title || '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الصفة المهنية</span>
                            <b>
                              {entityDetails?.legal_form && entityDetails.legal_form !== '—'
                                ? entityDetails.legal_form
                                : entityDetails?.consultant_profile?.activity_type || 'مستشار ضريبي معتمد'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>التخصص الرئيسي</span>
                            <b>
                              {entityDetails?.consultant_profile?.specialization && entityDetails.consultant_profile.specialization !== '—'
                                ? entityDetails.consultant_profile.specialization
                                : 'ضريبة الدخل والمبيعات'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>رقم الرخصة / القيد المهني</span>
                            <b>
                              {entityDetails?.consultant_profile?.license_number && entityDetails.consultant_profile.license_number !== '—'
                                ? entityDetails.consultant_profile.license_number
                                : entityDetails?.commercial_register && entityDetails.commercial_register !== '—'
                                ? entityDetails.commercial_register
                                : selectedEntity.license && selectedEntity.license !== '—'
                                ? selectedEntity.license
                                : '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الرقم الضريبي</span>
                            <b>
                              {entityDetails?.tax_number && entityDetails.tax_number !== '—'
                                ? entityDetails.tax_number
                                : selectedEntity.taxNo && selectedEntity.taxNo !== '—'
                                ? selectedEntity.taxNo
                                : '—'}
                            </b>
                          </div>
                        </div>
                      ) : (
                        <div className="detail-grid">
                          <div className="detail">
                            <span>تاريخ التسجيل</span>
                            <b>
                              {entityDetails?.created_at && entityDetails.created_at !== '—'
                                ? entityDetails.created_at
                                : selectedEntity.registered || '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>اسم المنشأة / الاسم</span>
                            <b>
                              {entityDetails?.company_name && entityDetails.company_name !== '—'
                                ? entityDetails.company_name
                                : entityDetails?.full_name ||
                                  (selectedEntity.company && selectedEntity.company !== '—' ? selectedEntity.company : selectedEntity.title)}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الصفة القانونية</span>
                            <b>
                              {entityDetails?.legal_form && entityDetails.legal_form !== '—'
                                ? entityDetails.legal_form
                                : (selectedEntity.company && selectedEntity.company !== '—' && !selectedEntity.company.includes('فردي')
                                    ? 'شركة تجارية'
                                    : 'حساب فردي')}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الرقم الضريبي</span>
                            <b>
                              {entityDetails?.tax_number && entityDetails.tax_number !== '—'
                                ? entityDetails.tax_number
                                : selectedEntity.taxNo && selectedEntity.taxNo !== '—'
                                ? selectedEntity.taxNo
                                : '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>رقم المنشأة / السجل</span>
                            <b>
                              {entityDetails?.commercial_register && entityDetails.commercial_register !== '—'
                                ? entityDetails.commercial_register
                                : selectedEntity.entityNo && selectedEntity.entityNo !== '—'
                                ? selectedEntity.entityNo
                                : '—'}
                            </b>
                          </div>
                          <div className="detail">
                            <span>الرقم الوطني للمنشأة</span>
                            <b>
                              {entityDetails?.national_id && entityDetails.national_id !== '—'
                                ? entityDetails.national_id
                                : selectedEntity.nationalNo && selectedEntity.nationalNo !== '—'
                                ? selectedEntity.nationalNo
                                : '—'}
                            </b>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-head">
                      <span>العلاقات والأنشطة المترابطة</span>
                      <span>كل عنصر قابل للفتح</span>
                    </div>
                    <div className="profile-card-body">
                      {selectedEntity.type === 'مستشار' ? (
                        <div className="link-grid">
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الاستشارات')}
                          >
                            <span>الاستشارات</span>
                            <b>
                              {entityDetails?.appointments?.length ??
                                selectedEntity.consultations ??
                                0}{' '}
                              استشارة
                            </b>
                            <small>كل الجلسات المسجلة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الحجوزات')}
                          >
                            <span>الحجوزات</span>
                            <b>{entityDetails?.appointments?.length ?? 0} حجز</b>
                            <small>الحالية والسابقة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('العملاء')}
                          >
                            <span>العملاء</span>
                            <b>{entityDetails?.partners?.length ?? 0} عميل</b>
                            <small>فتح ملفاتهم 360°</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المحادثات')}
                          >
                            <span>المحادثات</span>
                            <b>{entityDetails?.appointments?.length ?? 0} محادثة</b>
                            <small>مفتوحة ومؤرشفة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التذاكر')}
                          >
                            <span>التذاكر</span>
                            <b>
                              {entityDetails?.tickets?.length ??
                                selectedEntity.tickets ??
                                0}{' '}
                              تذكرة
                            </b>
                            <small>فتح سجل التذاكر</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المستحقات')}
                          >
                            <span>المستحقات</span>
                            <b>
                              {entityDetails?.consultant_profile?.hourly_rate
                                ? `${entityDetails.consultant_profile.hourly_rate} د.أ / ساعة`
                                : 'حساب معتمد'}
                            </b>
                            <small>الحالية والسابقة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التقييمات')}
                          >
                            <span>التقييمات</span>
                            <b>
                              {entityDetails?.stats?.avg_rating
                                ? `${entityDetails.stats.avg_rating}/5 ⭐`
                                : selectedEntity.rating && selectedEntity.rating !== '—'
                                ? `${selectedEntity.rating}/5 ⭐`
                                : 'لا يوجد تقييم'}
                            </b>
                            <small>فتح كل التقييمات</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('سجل الجودة')}
                          >
                            <span>سجل الجودة</span>
                            <b>
                              {entityDetails?.quality_record?.avg_rating
                                ? `متوسط ${entityDetails.quality_record.avg_rating}/5`
                                : entityDetails?.stats?.avg_rating
                                ? `${entityDetails.stats.avg_rating}/5`
                                : 'معتمد'}
                            </b>
                            <small>المراجعات والملاحظات</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الوثائق')}
                          >
                            <span>الوثائق</span>
                            <b>
                              {entityDetails?.documents?.length ||
                                entityDetails?.consultant_profile?.credentials?.length ||
                                0}{' '}
                              وثيقة
                            </b>
                            <small>الشهادات والاعتمادات</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التنبيهات')}
                          >
                            <span>التنبيهات</span>
                            <b>
                              {entityDetails?.notifications?.length ?? 0} تنبيه
                            </b>
                            <small>إرسال تنبيه جديد</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('النشاط')}
                          >
                            <span>النشاط</span>
                            <b>{entityDetails?.logs?.length ?? 0} حدث مسجل</b>
                            <small>سجل التغييرات</small>
                          </div>
                        </div>
                      ) : selectedEntity.type === 'استشارة' ? (
                        <div className="link-grid">
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الحجز')}
                          >
                            <span>الحجز</span>
                            <b>{selectedEntity.entityNo || 'BK-2041'}</b>
                            <small>تفاصيل الحجز</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المحادثات')}
                          >
                            <span>المحادثات</span>
                            <b>محادثة فورية</b>
                            <small>فتح المراسلة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المستندات')}
                          >
                            <span>المستندات</span>
                            <b>المرفقات الرسمية</b>
                            <small>معاينة وتحميل</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الدفع')}
                          >
                            <span>الدفع</span>
                            <b>{selectedEntity.desc || '—'}</b>
                            <small>العملية المرتبطة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الفاتورة')}
                          >
                            <span>الفاتورة</span>
                            <b>{selectedEntity.nationalNo || 'INV-8892'}</b>
                            <small>فتح الفاتورة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('ملخص الذكاء الاصطناعي')}
                          >
                            <span>ملخص الذكاء الاصطناعي</span>
                            <b>متاح</b>
                            <small>فتح التوصيات</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التقييم')}
                          >
                            <span>التقييم</span>
                            <b>
                              {selectedEntity.rating && selectedEntity.rating !== '—'
                                ? `${selectedEntity.rating}/5 ⭐`
                                : 'لا يوجد تقييم'}
                            </b>
                            <small>تفاصيل التقييم</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('النشاط')}
                          >
                            <span>النشاط</span>
                            <b>الجدول الزمني</b>
                            <small>سجل الأحداث</small>
                          </div>
                        </div>
                      ) : (
                        <div className="link-grid">
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الباقة')}
                          >
                            <span>الباقة</span>
                            <b>
                              {entityDetails?.subscription?.plan_name ||
                                (selectedEntity.type === 'مدير منصة'
                                  ? 'إدارة النظام والتحكم'
                                  : selectedEntity.desc || 'الباقة الأساسية')}
                            </b>
                            <small>
                              {entityDetails?.subscription?.end_date
                                ? `تنتهي ${entityDetails.subscription.end_date}`
                                : selectedEntity.type === 'مدير منصة'
                                ? 'صلاحيات كاملة'
                                : 'نشطة'}
                            </small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الاستشارات')}
                          >
                            <span>الاستشارات</span>
                            <b>
                              {entityDetails?.appointments?.length ||
                                selectedEntity.consultations ||
                                0}{' '}
                              استشارة
                            </b>
                            <small>فتح السجل الكامل</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الحجوزات')}
                          >
                            <span>الحجوزات</span>
                            <b>
                              {entityDetails?.appointments?.length || 0} حجز
                            </b>
                            <small>الحالية والسابقة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المستشارون')}
                          >
                            <span>المستشارون</span>
                            <b>
                              {entityDetails?.partners?.length || 0} مستشار
                            </b>
                            <small>تعامل معهم المستخدم</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المحادثات')}
                          >
                            <span>المحادثات</span>
                            <b>
                              {entityDetails?.appointments?.length || 0} محادثة
                            </b>
                            <small>مستخدم / مستشار / دعم</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التذاكر')}
                          >
                            <span>التذاكر</span>
                            <b>
                              {entityDetails?.tickets?.length ||
                                selectedEntity.tickets ||
                                0}{' '}
                              تذكرة
                            </b>
                            <small>نشطة ومغلقة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('المدفوعات')}
                          >
                            <span>المدفوعات</span>
                            <b>
                              {entityDetails?.payments?.length || 0} عملية
                            </b>
                            <small>فتح سجل العمليات</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الفواتير')}
                          >
                            <span>الفواتير</span>
                            <b>
                              {entityDetails?.invoices?.length || 0} فاتورة
                            </b>
                            <small>مدفوعة ومفتوحة</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('الاستخدام الذكي')}
                          >
                            <span>استخدام الذكاء الاصطناعي</span>
                            <b>
                              {selectedEntity.type === 'مدير منصة'
                                ? 'غير محدود'
                                : entityDetails?.ai_usage?.tokens_used ||
                                  entityDetails?.subscription?.points_used ||
                                  selectedEntity.ai ||
                                  '0 توكن'}
                            </b>
                            <small>إحصاءات التوكن</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التنبيهات')}
                          >
                            <span>التنبيهات</span>
                            <b>
                              {entityDetails?.notifications?.length || 0} تنبيه
                            </b>
                            <small>إرسال تنبيه جديد</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('التقييمات')}
                          >
                            <span>التقييمات</span>
                            <b>
                              {entityDetails?.stats?.avg_rating
                                ? `${entityDetails.stats.avg_rating}/5 ⭐`
                                : selectedEntity.rating && selectedEntity.rating !== '—'
                                ? `${selectedEntity.rating}/5 ⭐`
                                : 'لا يوجد تقييم'}
                            </b>
                            <small>منصة / خدمة / مستشار</small>
                          </div>
                          <div
                            className="link-card"
                            onClick={() => setActiveModalTab('النشاط')}
                          >
                            <span>النشاط</span>
                            <b>{entityDetails?.logs?.length || 0} حدث مسجل</b>
                            <small>سجل التغييرات</small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* 2. Account Details Tab */}
              {activeModalTab === 'الحساب' && (
                <div className="profile-card">
                  <div className="profile-card-head">بيانات الحساب الأساسية</div>
                  <div className="profile-card-body">
                    <div className="detail-grid">
                      <div className="detail">
                        <span>الاسم</span>
                        <b>
                          {entityDetails?.full_name || selectedEntity.title}
                        </b>
                      </div>
                      <div className="detail">
                        <span>الشركة / المنشأة</span>
                        <b>
                          {entityDetails?.company_name ||
                            selectedEntity.company ||
                            selectedEntity.title}
                        </b>
                      </div>
                      <div className="detail">
                        <span>البريد الإلكتروني</span>
                        <b>
                          {entityDetails?.email || selectedEntity.subtitle}
                        </b>
                      </div>
                      <div className="detail">
                        <span>رقم الهاتف</span>
                        <b>{entityDetails?.phone || '—'}</b>
                      </div>
                      <div className="detail">
                        <span>الرقم الضريبي</span>
                        <b>
                          {entityDetails?.tax_number || selectedEntity.taxNo || '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>رقم المنشأة / السجل</span>
                        <b>
                          {entityDetails?.commercial_register ||
                            selectedEntity.entityNo ||
                            '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>الرقم الوطني للمنشأة</span>
                        <b>
                          {entityDetails?.national_id ||
                            selectedEntity.nationalNo ||
                            '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>الصفة القانونية</span>
                        <b>
                          {entityDetails?.legal_form ||
                            (selectedEntity.type === 'مدير منصة'
                              ? 'إدارة النظام والتحكم'
                              : 'شركة تجارية')}
                        </b>
                      </div>
                      <div className="detail">
                        <span>تاريخ التسجيل</span>
                        <b>
                          {entityDetails?.created_at ||
                            selectedEntity.registered ||
                            '—'}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Subscription & Plan Tab */}
              {activeModalTab === 'الباقة' && (
                <div className="profile-card">
                  <div className="profile-card-head">تفاصيل الباقة والاستهلاك</div>
                  <div className="profile-card-body">
                    <div className="detail-grid">
                      <div className="detail">
                        <span>الباقة الحالية</span>
                        <b>
                          {entityDetails?.subscription?.plan_name ||
                            (selectedEntity.type === 'مدير منصة'
                              ? 'إدارة النظام والتحكم'
                              : 'الحساب الأساسي (مجاني)')}
                        </b>
                      </div>
                      <div className="detail">
                        <span>تاريخ التجديد والانتهاء</span>
                        <b>
                          {entityDetails?.subscription?.end_date && entityDetails.subscription.end_date !== '—'
                            ? entityDetails.subscription.end_date
                            : 'حساب مستمر'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>حصة التوكن الشهرية</span>
                        <b>{entityDetails?.subscription?.points_total || '500,000 توكن'}</b>
                      </div>
                      <div className="detail">
                        <span>المستهلك الحالي</span>
                        <b>{entityDetails?.subscription?.points_used || '0 توكن'}</b>
                      </div>
                      <div className="detail">
                        <span>نسبة الاستهلاك</span>
                        <b>{entityDetails?.subscription?.usage_percentage || '0%'}</b>
                      </div>
                      <div className="detail">
                        <span>الرصيد المتبقي</span>
                        <b>
                          {entityDetails?.subscription?.points_balance || '500,000 نقطة'}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Consultations Tab */}
              {activeModalTab === 'الاستشارات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>سجل الاستشارات</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('تم إنشاء طلب استشارة جديدة')}
                    >
                      طلب استشارة جديدة
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>المرجع</th>
                            <th>موضوع الاستشارة</th>
                            <th>المستشار / الطرف الآخر</th>
                            <th>الحالة</th>
                            <th>القيمة</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.appointments &&
                          entityDetails.appointments.length > 0 ? (
                            entityDetails.appointments.map((appt) => (
                              <tr key={appt.id}>
                                <td>
                                  <span className="record-link">
                                    {appt.ref_no || appt.appointment_number}
                                  </span>
                                </td>
                                <td>{appt.title}</td>
                                <td>
                                  {selectedEntity.type === 'مستشار'
                                    ? appt.client_name
                                    : appt.consultant_name}
                                </td>
                                <td>
                                  <span
                                    className={`status ${
                                      appt.status === 'مؤكدة'
                                        ? 's-green'
                                        : 's-orange'
                                    }`}
                                  >
                                    {appt.status}
                                  </span>
                                </td>
                                <td>{appt.price}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(
                                        `فتح تفاصيل استشارة ${
                                          appt.ref_no || appt.appointment_number
                                        }`
                                      )
                                    }
                                  >
                                    فتح
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="6"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد استشارات مسجلة لهذا الحساب حالياً في قاعدة
                                البيانات
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Bookings Tab */}
              {activeModalTab === 'الحجوزات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>سجل الحجوزات والمواعيد</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('تم فتح نافذة حجز موعد جديد')}
                    >
                      حجز موعد
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رقم الحجز</th>
                            <th>التاريخ</th>
                            <th>الطرف المعني</th>
                            <th>الوقت</th>
                            <th>الحالة</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.appointments &&
                          entityDetails.appointments.length > 0 ? (
                            entityDetails.appointments.map((appt) => (
                              <tr key={appt.id}>
                                <td>
                                  <span className="record-link">
                                    {appt.appointment_number}
                                  </span>
                                </td>
                                <td>{appt.scheduled_start}</td>
                                <td>
                                  {selectedEntity.type === 'مستشار'
                                    ? appt.client_name
                                    : appt.consultant_name}
                                </td>
                                <td>{appt.time}</td>
                                <td>
                                  <span
                                    className={`status ${
                                      appt.status === 'مؤكدة'
                                        ? 's-green'
                                        : 's-orange'
                                    }`}
                                  >
                                    {appt.status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(
                                        `فتح تفاصيل الحجز ${appt.appointment_number}`
                                      )
                                    }
                                  >
                                    فتح
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="6"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد مواعيد أو حجوزات مسجلة لهذا الحساب حالياً
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Consultants / Clients List Tab */}
              {(activeModalTab === 'المستشارون' || activeModalTab === 'العملاء') && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>
                      {activeModalTab === 'العملاء'
                        ? 'قائمة العملاء المتعامل معهم'
                        : 'المستشارون المعتمدون'}
                    </span>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>المعرف</th>
                            <th>الاسم</th>
                            <th>التقييم</th>
                            <th>عدد الجلسات</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.partners &&
                          entityDetails.partners.length > 0 ? (
                            entityDetails.partners.map((partner) => (
                              <tr key={partner.id}>
                                <td>
                                  <span className="record-link">{partner.id}</span>
                                </td>
                                <td>{partner.name}</td>
                                <td>{partner.rating}</td>
                                <td>{partner.count} استشارة</td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(`فتح ملف ${partner.name}`)
                                    }
                                  >
                                    فتح الملف 360°
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد أطراف مسجلة تعاملت مع هذا الحساب بعد
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Live Chat Tab */}
              {activeModalTab === 'المحادثات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>المحادثة المباشرة الفورية</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('تم بدء محادثة جديدة')}
                    >
                      محادثة جديدة
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="chat-shell">
                      <div className="chat-list">
                        <div className="chat-item active">
                          <b>
                            {entityDetails?.full_name || selectedEntity.title}
                          </b>
                          <p>المحادثة المباشرة مع الحساب.</p>
                        </div>
                        <div className="chat-item">
                          <b>فريق الدعم الفني</b>
                          <p>خدمة الدعم المباشر متوفرة على مدار الساعة.</p>
                        </div>
                      </div>
                      <div className="chat-thread">
                        <div className="chat-messages">
                          {chatMessages.length > 0 ? (
                            chatMessages.map((m, i) => (
                              <div
                                key={m.id || i}
                                className={`bubble ${m.sender}`}
                              >
                                <div
                                  style={{
                                    fontSize: '10px',
                                    opacity: 0.7,
                                    marginBottom: '2px'
                                  }}
                                >
                                  {m.sender_name ||
                                    (m.sender === 'me'
                                      ? 'الإدارة'
                                      : selectedEntity.title)}
                                </div>
                                <div>{m.text}</div>
                                <small
                                  style={{
                                    fontSize: '9px',
                                    opacity: 0.6,
                                    display: 'block',
                                    textAlign: 'left',
                                    marginTop: '3px'
                                  }}
                                >
                                  {m.time}
                                </small>
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#64748b'
                              }}
                            >
                              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                💬
                              </div>
                              <b style={{ fontSize: '14px', color: '#334155' }}>
                                لا توجد رسائل محادثة سابقة مسجلة
                              </b>
                              <p
                                style={{
                                  fontSize: '12px',
                                  margin: '6px 0 0',
                                  color: '#94a3b8'
                                }}
                              >
                                يمكنك كتابة رسالة أدناه لبدء المراسلة والتواصل
                                المباشر مع هذا الحساب.
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="chat-compose">
                          <input
                            placeholder="اكتب رسالة مباشرة..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && chatInput.trim()) {
                                setChatMessages([
                                  ...chatMessages,
                                  {
                                    sender: 'me',
                                    sender_name: 'إدارة المنصة',
                                    text: chatInput.trim(),
                                    time: 'الآن'
                                  }
                                ]);
                                setChatInput('');
                                showToastMsg('تم إرسال الرسالة');
                              }
                            }}
                          />
                          <button
                            className="btn green"
                            onClick={() => {
                              if (chatInput.trim()) {
                                setChatMessages([
                                  ...chatMessages,
                                  {
                                    sender: 'me',
                                    sender_name: 'إدارة المنصة',
                                    text: chatInput.trim(),
                                    time: 'الآن'
                                  }
                                ]);
                                setChatInput('');
                                showToastMsg('تم إرسال الرسالة');
                              }
                            }}
                          >
                            إرسال
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Tickets Tab */}
              {activeModalTab === 'التذاكر' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>تذاكر الدعم الفني</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('تم فتح تذكرة دعم فني جديدة')}
                    >
                      تذكرة جديدة
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رقم التذكرة</th>
                            <th>الموضوع</th>
                            <th>التصنيف</th>
                            <th>الأولوية</th>
                            <th>الحالة</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.tickets &&
                          entityDetails.tickets.length > 0 ? (
                            entityDetails.tickets.map((t) => (
                              <tr key={t.id}>
                                <td>
                                  <span
                                    className="record-link"
                                    onClick={() => setViewingTicket(t)}
                                  >
                                    {t.ticket_number}
                                  </span>
                                </td>
                                <td>
                                  <b>{t.subject}</b>
                                </td>
                                <td>
                                  <span
                                    style={{ fontSize: '11px', color: '#475569' }}
                                  >
                                    {t.category}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`tag ${
                                      t.priority === 'مرتفعة' ||
                                      t.priority === 'عاجلة'
                                        ? 't-pink'
                                        : 't-slate'
                                    }`}
                                  >
                                    {t.priority}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`status ${
                                      t.status === 'تم الحل' ||
                                      t.status === 'مكتملة' ||
                                      t.status === 'مغلقة'
                                        ? 's-green'
                                        : t.status === 'قيد المعالجة'
                                        ? 's-orange'
                                        : 's-pink'
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() => setViewingTicket(t)}
                                  >
                                    عرض
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="6"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد تذاكر دعم فني مسجلة لهذا الحساب
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. Payments Tab */}
              {activeModalTab === 'المدفوعات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>سجل المدفوعات والعمليات</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('تصدير كشف المدفوعات')}
                    >
                      تصدير الكشف
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رقم العملية</th>
                            <th>المبلغ</th>
                            <th>طريقة الدفع</th>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.payments &&
                          entityDetails.payments.length > 0 ? (
                            entityDetails.payments.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <span className="record-link">
                                    {p.payment_number}
                                  </span>
                                </td>
                                <td>{p.amount}</td>
                                <td>{p.method}</td>
                                <td>{p.date}</td>
                                <td>
                                  <span className="status s-green">{p.status}</span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(`عرض عملية ${p.payment_number}`)
                                    }
                                  >
                                    عرض
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="6"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد عمليات دفع مسجلة لهذا الحساب حالياً
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. Invoices Tab */}
              {activeModalTab === 'الفواتير' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>الفواتير الضريبية المعتمدة</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('إنشاء فاتورة ضريبية')}
                    >
                      فاتورة جديدة
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رقم الفاتورة</th>
                            <th>المبلغ الإجمالي</th>
                            <th>التاريخ</th>
                            <th>حالة السداد</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.invoices &&
                          entityDetails.invoices.length > 0 ? (
                            entityDetails.invoices.map((inv) => (
                              <tr key={inv.id}>
                                <td>
                                  <span className="record-link">
                                    {inv.invoice_number}
                                  </span>
                                </td>
                                <td>{inv.amount}</td>
                                <td>{inv.date}</td>
                                <td>
                                  <span
                                    className={`status ${
                                      inv.status === 'مدفوعة'
                                        ? 's-green'
                                        : 's-orange'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(
                                        `تحميل فاتورة ${inv.invoice_number}`
                                      )
                                    }
                                  >
                                    معاينة / PDF
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد فواتير ضريبية صادرة لهذا الحساب في قاعدة
                                البيانات
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. AI Usage Tab */}
              {activeModalTab === 'الاستخدام الذكي' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>استخدام وتحليلات الذكاء الاصطناعي</span>
                    <span className="status s-green">
                      {selectedEntity.type === 'مدير منصة'
                        ? 'إدارة النظام والتحكم'
                        : 'مفعل بالنظام'}
                    </span>
                  </div>
                  <div className="profile-card-body">
                    {selectedEntity.type === 'مدير منصة' ? (
                      <div className="detail-grid">
                        <div className="detail">
                          <span>نوع الحساب</span>
                          <b>إدارة النظام والتحكم (Super Admin)</b>
                        </div>
                        <div className="detail">
                          <span>صلاحيات الذكاء الاصطناعي</span>
                          <b>وصول كامل وغير محدود (Full Access)</b>
                        </div>
                        <div className="detail">
                          <span>التحكم في النماذج</span>
                          <b>متاح عبر قسم التحكم بالذكاء الاصطناعي</b>
                        </div>
                        <div className="detail">
                          <span>استهلاك التوكن الشهري</span>
                          <b>غير محدود</b>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="kpi-grid">
                          <div className="kpi">
                            <span>استهلاك التوكن</span>
                            <b>
                              {entityDetails?.ai_usage?.tokens_used ||
                                entityDetails?.subscription?.points_used ||
                                '0 توكن'}
                            </b>
                          </div>
                          <div className="kpi">
                            <span>نسبة الحصة المستهلكة</span>
                            <b>
                              {entityDetails?.ai_usage?.usage_percentage ||
                                entityDetails?.subscription?.usage_percentage ||
                                '0%'}
                            </b>
                          </div>
                          <div className="kpi">
                            <span>عدد الأسئلة والاستفسارات</span>
                            <b>
                              {entityDetails?.ai_usage?.questions_count ?? 0} سؤال
                            </b>
                          </div>
                          <div className="kpi">
                            <span>أكثر موضوع استفساراً</span>
                            <b>
                              {entityDetails?.ai_usage?.top_topic ||
                                'لا توجد استفسارات مسجلة'}
                            </b>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: '14px',
                            padding: '16px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '13px'
                          }}
                        >
                          {entityDetails?.ai_usage?.has_data ? (
                            <div>
                              <b style={{ color: '#0f766e', display: 'block', marginBottom: '4px' }}>
                                نشاط الذكاء الاصطناعي نشط
                              </b>
                              يتم تسجيل استهلاك التوكن والاستفسارات الضريبية تلقائياً في قاعدة البيانات.
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>
                                🤖
                              </span>
                              <b>لا يوجد استهلاك توكن مسجل لهذا الحساب حالياً</b>
                              <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                                سيبدأ تسجيل واحتساب التوكن فور بدء المستخدم في طرح الأسئلة الضريبية الذكية.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 12. Alerts Tab */}
              {activeModalTab === 'التنبيهات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>سجل التنبيهات والإشعارات</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('تم فتح نافذة إرسال تنبيه جديد')}
                    >
                      إرسال تنبيه
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رمز التنبيه</th>
                            <th>نص التنبيه</th>
                            <th>الحالة</th>
                            <th>التوقيت</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.notifications &&
                          entityDetails.notifications.length > 0 ? (
                            entityDetails.notifications.map((n) => (
                              <tr key={n.id}>
                                <td>
                                  <span className="record-link">{n.code}</span>
                                </td>
                                <td>{n.text}</td>
                                <td>
                                  <span className="status s-green">{n.status}</span>
                                </td>
                                <td>{n.time}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(
                                        `عرض تفاصيل التنبيه ${n.code}`
                                      )
                                    }
                                  >
                                    عرض
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد تنبيهات جديدة مسجلة لهذا الحساب
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 13. Ratings Tab */}
              {activeModalTab === 'التقييمات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>سجل التقييمات والآراء</span>
                  </div>
                  <div className="profile-card-body">
                    <div className="rating-list">
                      {entityDetails?.ratings && entityDetails.ratings.length > 0 ? (
                        entityDetails.ratings.map((r) => (
                          <div key={r.id} className="rating-card">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <b>{r.title}</b>
                              <span
                                className="rating-stars"
                                style={{ color: '#eab308' }}
                              >
                                {r.stars}
                              </span>
                            </div>
                            <p className="rating-comment">{r.comment}</p>
                            <small
                              style={{ fontSize: '8px', color: '#94a3b8' }}
                            >
                              {r.date} · تقييم معتمد
                            </small>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '30px',
                            color: '#64748b'
                          }}
                        >
                          لا توجد تقييمات مسجلة لهذا الحساب في قاعدة البيانات
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 14. Activity Timeline Tab */}
              {activeModalTab === 'النشاط' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    سجل النشاط والأحداث الحديثة
                  </div>
                  <div className="profile-card-body">
                    <div className="timeline-v6">
                      {entityDetails?.logs && entityDetails.logs.length > 0 ? (
                        entityDetails.logs.map((x, idx) => (
                          <div key={x.id || idx} className="trow">
                            <div className="time">{x.time || x.date}</div>
                            <div className="line">
                              <div className="dot"></div>
                            </div>
                            <div className="event">
                              <b>{x.title}</b>
                              <p>{x.sub}</p>
                            </div>
                            <button
                              type="button"
                              className="record-action"
                              onClick={() =>
                                showToastMsg(`فتح تفاصيل: ${x.title}`)
                              }
                            >
                              فتح
                            </button>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '30px',
                            color: '#64748b'
                          }}
                        >
                          لا يوجد سجل نشاط مسجل لهذا الحساب حالياً
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 15. Consultant Professional Profile Tab */}
              {activeModalTab === 'الملف المهني' && (
                <div className="profile-card">
                  <div className="profile-card-head">الملف المهني والخبرات</div>
                  <div className="profile-card-body">
                    <div className="detail-grid">
                      <div className="detail">
                        <span>المؤهل الأكاديمي</span>
                        <b>
                          {entityDetails?.consultant_profile?.academic_degree &&
                          entityDetails.consultant_profile.academic_degree !== '—'
                            ? entityDetails.consultant_profile.academic_degree
                            : selectedEntity.degree && selectedEntity.degree !== '—'
                            ? selectedEntity.degree
                            : '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>الشهادات والاعتمادات</span>
                        <b>
                          {entityDetails?.consultant_profile?.credentials?.length >
                          0
                            ? entityDetails.consultant_profile.credentials
                                .map((c) => c.title)
                                .join('، ')
                            : entityDetails?.consultant_profile
                                ?.certificates_licenses &&
                              entityDetails.consultant_profile
                                .certificates_licenses !== '—'
                            ? entityDetails.consultant_profile
                                .certificates_licenses
                            : '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>سنوات الخبرة</span>
                        <b>
                          {entityDetails?.consultant_profile?.years_of_experience
                            ? `${entityDetails.consultant_profile.years_of_experience} سنوات`
                            : selectedEntity.years
                            ? `${selectedEntity.years} سنوات`
                            : '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>التخصص الرئيسي</span>
                        <b>
                          {entityDetails?.consultant_profile?.specialization || '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>رقم الرخصة / القيد المهني</span>
                        <b>
                          {entityDetails?.consultant_profile?.license_number &&
                          entityDetails.consultant_profile.license_number !== '—'
                            ? entityDetails.consultant_profile.license_number
                            : selectedEntity.license &&
                              selectedEntity.license !== '—'
                            ? selectedEntity.license
                            : '—'}
                        </b>
                      </div>
                      <div className="detail">
                        <span>سعر الاستشارة المعتمد</span>
                        <b>
                          {entityDetails?.consultant_profile?.hourly_rate &&
                          entityDetails.consultant_profile.hourly_rate !== '—'
                            ? `${entityDetails.consultant_profile.hourly_rate} / ساعة`
                            : '—'}
                        </b>
                      </div>
                      <div className="detail" style={{ gridColumn: 'span 2' }}>
                        <span>النبذة التعريفية</span>
                        <b>
                          {entityDetails?.consultant_profile?.bio &&
                          entityDetails.consultant_profile.bio !== '—'
                            ? entityDetails.consultant_profile.bio
                            : '—'}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 16. Consultant Quality Record Tab */}
              {activeModalTab === 'سجل الجودة' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>مؤشرات وسجل الجودة</span>
                    <span className="status s-green">
                      {entityDetails?.quality_record?.avg_rating
                        ? `متوسط ${entityDetails.quality_record.avg_rating}/5`
                        : 'معتمد'}
                    </span>
                  </div>
                  <div className="profile-card-body">
                    <div className="kpi-grid">
                      <div className="kpi">
                        <span>الالتزام بالمواعيد</span>
                        <b>{entityDetails?.quality_record?.on_time_rate || '100%'}</b>
                      </div>
                      <div className="kpi">
                        <span>زمن الاستجابة</span>
                        <b>{entityDetails?.quality_record?.response_time || '15 دقيقة'}</b>
                      </div>
                      <div className="kpi">
                        <span>متوسط التقييم</span>
                        <b>
                          {entityDetails?.stats?.avg_rating
                            ? `${entityDetails.stats.avg_rating}/5 ⭐`
                            : selectedEntity.rating && selectedEntity.rating !== '—'
                            ? `${selectedEntity.rating}/5 ⭐`
                            : 'لا يوجد تقييم'}
                        </b>
                      </div>
                      <div className="kpi">
                        <span>نسبة الرضا العامة</span>
                        <b>{entityDetails?.quality_record?.satisfaction_rate || '98%'}</b>
                      </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <div className="record-table-wrap">
                        <table className="record-table">
                          <thead>
                            <tr>
                              <th>رمز المراجعة</th>
                              <th>النوع</th>
                              <th>النتيجة</th>
                              <th>التاريخ</th>
                              <th>الإجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entityDetails?.ratings && entityDetails.ratings.length > 0 ? (
                              entityDetails.ratings.map((r, idx) => (
                                <tr key={r.id || idx}>
                                  <td>
                                    <span className="record-link">
                                      QA-{String(r.id).slice(0, 4).toUpperCase()}
                                    </span>
                                  </td>
                                  <td>{r.title || 'تقييم جودة الخدمة والجلسات'}</td>
                                  <td>
                                    <span className="status s-green">
                                      {r.stars} ({r.stars >= 4 ? 'ممتاز' : 'جيد'})
                                    </span>
                                  </td>
                                  <td>{r.date}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="record-action"
                                      onClick={() =>
                                        showToastMsg(`عرض تقييم ${r.stars}`)
                                      }
                                    >
                                      عرض
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="5"
                                  style={{
                                    textAlign: 'center',
                                    padding: '30px',
                                    color: '#64748b'
                                  }}
                                >
                                  لا توجد مراجعات أو تقارير جودة مسجلة لهذا الحساب في قاعدة البيانات
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 17. Consultant Documents Tab */}
              {activeModalTab === 'الوثائق' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    الوثائق والشهادات الرسمية
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رقم الوثيقة</th>
                            <th>اسم المستند</th>
                            <th>الحالة</th>
                            <th>معاينة</th>
                            <th>تحميل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(entityDetails?.documents &&
                            entityDetails.documents.length > 0) ||
                          (entityDetails?.consultant_profile?.credentials &&
                            entityDetails.consultant_profile.credentials.length >
                              0) ? (
                            [
                              ...(entityDetails?.documents || []),
                              ...(entityDetails?.consultant_profile?.credentials ||
                                [])
                            ].map((doc, idx) => (
                              <tr key={doc.id || idx}>
                                <td>
                                  <span className="record-link">
                                    {doc.id?.slice(0, 8) || `DOC-0${idx + 1}`}
                                  </span>
                                </td>
                                <td>
                                  {doc.filename ||
                                    doc.title ||
                                    'مستند رسمي معتمد'}
                                </td>
                                <td>
                                  <span className="status s-green">
                                    {doc.status || 'موثق'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(
                                        `معاينة مستند ${doc.filename || doc.title}`
                                      )
                                    }
                                  >
                                    معاينة
                                  </button>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(
                                        `تحميل مستند ${doc.filename || doc.title}`
                                      )
                                    }
                                  >
                                    تحميل PDF
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد وثائق مرفوعة مسجلة لهذا الحساب
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 18. Consultant Payouts Tab */}
              {activeModalTab === 'المستحقات' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    <span>المستحقات والتسويات المالية</span>
                    <button
                      type="button"
                      className="record-action"
                      onClick={() => showToastMsg('طلب تحويل المستحقات')}
                    >
                      طلب تسوية
                    </button>
                  </div>
                  <div className="profile-card-body">
                    <div className="record-table-wrap">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>رقم التسوية</th>
                            <th>المبلغ الصافي</th>
                            <th>حالة الدفعة</th>
                            <th>تاريخ الطلب</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entityDetails?.consultant_profile?.payouts &&
                          entityDetails.consultant_profile.payouts.length > 0 ? (
                            entityDetails.consultant_profile.payouts.map((po) => (
                              <tr key={po.id}>
                                <td>
                                  <span className="record-link">
                                    {po.payout_number}
                                  </span>
                                </td>
                                <td>{po.amount}</td>
                                <td>
                                  <span className="status s-green">
                                    {po.status}
                                  </span>
                                </td>
                                <td>{po.date}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="record-action"
                                    onClick={() =>
                                      showToastMsg(`عرض تفاصيل ${po.payout_number}`)
                                    }
                                  >
                                    عرض
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: 'center',
                                  padding: '30px',
                                  color: '#64748b'
                                }}
                              >
                                لا توجد طلبات تسوية أو مستحقات سابقة مسجلة
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 19. Consultation Parties Tab */}
              {activeModalTab === 'الأطراف' && (
                <div className="profile-card">
                  <div className="profile-card-head">أطراف الاستشارة</div>
                  <div className="profile-card-body">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                      }}
                    >
                      <div
                        className="link-card"
                        onClick={() => showToastMsg('فتح ملف العميل')}
                      >
                        <span>العميل / المستفيد</span>
                        <b>{selectedEntity.title || 'العميل'}</b>
                        <small>{selectedEntity.subtitle} · فتح ملف 360°</small>
                      </div>
                      <div
                        className="link-card"
                        onClick={() => showToastMsg('فتح ملف المستشار')}
                      >
                        <span>المستشار المعين</span>
                        <b>{selectedEntity.company || 'المستشار الضريبي'}</b>
                        <small>خبير ضرائب معتمد · فتح ملف 360°</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 20. Consultation AI Summary Tab */}
              {activeModalTab === 'ملخص الذكاء الاصطناعي' && (
                <div className="profile-card">
                  <div className="profile-card-head">
                    ملخص وتوصيات الذكاء الاصطناعي للجلسة
                  </div>
                  <div
                    className="profile-card-body"
                    style={{
                      fontSize: '11px',
                      lineHeight: 1.9,
                      color: '#334155'
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <b
                        style={{
                          color: '#0f766e',
                          display: 'block',
                          marginBottom: '3px'
                        }}
                      >
                        موضوع الجلسة الأساسي:
                      </b>
                      مراجعة معالجة ضريبة المبيعات وتدقيق الفواتير الإلكترونية
                      الصادرة والواردة.
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <b
                        style={{
                          color: '#0f766e',
                          display: 'block',
                          marginBottom: '3px'
                        }}
                      >
                        النقاط والتوصيات الرئيسية:
                      </b>
                      تحديد المعاملة الصحيحة للخدمات المقدمة لغير المقيمين،
                      واستكمال مستندات التصدير، وتوثيق أرقام الإشعارات الدائنة
                      والمدينة.
                    </div>
                    <div>
                      <b
                        style={{
                          color: '#0f766e',
                          display: 'block',
                          marginBottom: '3px'
                        }}
                      >
                        الإجراءات اللاحقة والمتابعة:
                      </b>
                      متابعة رفع الإقرار الضريبي قبل نهاية المهلة القانونية،
                      وإشعار المحاسب القانوني بأي تعديلات في كشوف الفواتير.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn green"
            onClick={() => {
              showToastMsg('تم حفظ التغييرات');
              setModalOpen(false);
            }}
          >
            حفظ
          </button>
          <button className="btn ghost" onClick={() => setModalOpen(false)}>
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
