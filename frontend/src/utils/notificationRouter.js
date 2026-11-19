/**
 * Notification Routing Utility
 * Intelligently maps notifications across Admin, Consultant, and User portals
 * to their exact target pages and tabs.
 *
 * If a notification is purely informational (broadcast, maintenance, etc.) without
 * an associated actionable entity/page, it returns null so the UI marks it read
 * without performing an unnecessary page redirection.
 */

export function getNotificationTarget(notif, role) {
  if (!notif) return null;

  const meta = notif.extra_metadata || notif.metadata || {};

  // 1. Explicit target_url provided by backend metadata or object
  // (Except for law targets where destination page depends on consultant vs user role)
  if (meta.target_type !== 'law' && notif.related_entity_type !== 'legal_source') {
    if (meta.target_url) {
      return { url: meta.target_url, label: 'الانتقال إلى الصفحة المعنية' };
    }
    if (notif.target_url) {
      return { url: notif.target_url, label: 'الانتقال إلى الصفحة المعنية' };
    }
  }

  const rawTitle = notif.title || '';
  const rawMsg = notif.message || '';
  const title = rawTitle.toLowerCase();
  const msg = rawMsg.toLowerCase();
  const type = (notif.type || notif.notification_type || notif.related_entity_type || '').toLowerCase();
  const entityId = notif.related_entity_id || '';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isConsultant = role === 'consultant' || role === 'platform_consultant';

  // Check if it's explicitly general / broadcast / maintenance without action
  const isBroadcastOrMaintenance = 
    (type === 'maintenance' || 
    type === 'system_alert' || 
    type === 'broadcast' || 
    type === 'announcement' ||
    (title.includes('صيانة') && !title.includes('طلب')) ||
    (title.includes('إعلان عام') && !title.includes('حجز')) ||
    (title.includes('ترحيب') && !title.includes('طلب'))) &&
    !meta.target_type;

  // ══════════════════════════════════════════════════════════════════
  // ADMIN PORTAL ROUTING
  // ══════════════════════════════════════════════════════════════════
  if (isAdmin) {
    // 1. Subscriptions / Requests / Plans
    if (
      meta.target_type === 'subscription_request' ||
      type.includes('subscri') || 
      type.includes('plan') || 
      type.includes('receipt') ||
      title.includes('اشتراك') || 
      title.includes('باقة') || 
      title.includes('باقات') || 
      title.includes('إيصال') ||
      title.includes('تحويل بنكي') ||
      msg.includes('اشتراك') || 
      msg.includes('إيصال الدفع')
    ) {
      if (
        meta.target_type === 'subscription_request' ||
        title.includes('طلب') || 
        title.includes('إيصال') || 
        title.includes('تحويل') || 
        title.includes('ترقية') || 
        title.includes('تجديد') ||
        type.includes('request') ||
        type.includes('receipt')
      ) {
        let searchParam = meta.user_name || '';
        let reqIdParam = meta.target_id || meta.request_no || '';
        if (!searchParam && rawMsg) {
          const match = rawMsg.match(/\[(.*?)\]/);
          if (match) searchParam = match[1];
        }
        const qParams = new URLSearchParams();
        qParams.set('tab', 'requests');
        if (searchParam) qParams.set('search', searchParam);
        if (reqIdParam) qParams.set('reqId', reqIdParam);

        return { url: `/admin/subscriptions?${qParams.toString()}`, label: 'الانتقال لطلب الاشتراك' };
      }
      if (title.includes('باقة') || title.includes('باقات') || type.includes('plan')) {
        return { url: '/admin/subscriptions?tab=plans', label: 'الانتقال إلى إدارة الباقات' };
      }
      return { url: '/admin/subscriptions?tab=subscribers', label: 'الانتقال لسجل المشتركين' };
    }

    // 2. Consultant Applications / Verification
    if (
      meta.target_type === 'consultant_application' ||
      type.includes('consultant_app') ||
      type.includes('consultant_review') ||
      title.includes('انضمام مستشار') ||
      title.includes('طلب تسجيل مستشار') ||
      title.includes('طلب مستشار') ||
      title.includes('مستشار جديد') ||
      msg.includes('طلب انضمام مستشار') ||
      msg.includes('مراجعة حساب المستشار')
    ) {
      let searchParam = meta.user_name || '';
      let applicantIdParam = meta.target_id || meta.applicant_id || entityId || '';
      if (!searchParam && rawMsg) {
        const match = rawMsg.match(/المستشار \((.*?)\)/);
        if (match) searchParam = match[1];
      }
      const qParams = new URLSearchParams();
      if (searchParam) qParams.set('search', searchParam);
      if (applicantIdParam) qParams.set('applicantId', applicantIdParam);
      const qStr = qParams.toString();

      return {
        url: qStr ? `/admin/consultant-applications?${qStr}` : '/admin/consultant-applications',
        label: 'الانتقال لمراجعة طلب المستشار'
      };
    }

    // 3. Support Tickets
    if (
      type.includes('ticket') ||
      title.includes('تذكرة') ||
      msg.includes('تذكرة') ||
      title.includes('الدعم') ||
      msg.includes('الدعم الفني')
    ) {
      const ticketUrl = entityId ? `/admin/tickets?id=${entityId}` : '/admin/tickets';
      return { url: ticketUrl, label: 'الانتقال للتذكرة والمحادثة' };
    }

    // 4. Appointments / Sessions / Bookings
    if (
      type.includes('appointment') ||
      type.includes('session') ||
      type.includes('booking') ||
      title.includes('حجز') ||
      title.includes('جلسة') ||
      title.includes('موعد') ||
      title.includes('استشارة')
    ) {
      return { url: '/admin/calendar', label: 'الانتقال لجدول المواعيد والاستشارات' };
    }

    // 5. Invoices / Payments / Refunds / Payouts
    if (
      meta.target_type === 'payment' ||
      meta.target_type === 'payout_request' ||
      type.includes('invoice') ||
      type.includes('payment') ||
      type.includes('payout') ||
      type.includes('refund') ||
      title.includes('فاتورة') ||
      title.includes('دفع') ||
      title.includes('سحب') ||
      title.includes('استرداد') ||
      msg.includes('فاتورة') ||
      msg.includes('سحب أرباح') ||
      msg.includes('سداد')
    ) {
      if (title.includes('استرداد') || type.includes('refund')) {
        return { url: '/admin/invoices/refunds', label: 'الانتقال لطلبات الاسترداد' };
      }
      
      let searchParam = meta.user_name || '';
      let invoiceIdParam = meta.target_type === 'payment' ? (meta.target_id || '') : '';
      let payoutIdParam = meta.target_type === 'payout_request' ? (meta.target_id || '') : '';
      
      if (!searchParam && rawMsg) {
        const clientMatch = rawMsg.match(/قام العميل\s+(.*?)\s+بسداد/);
        const consultantMatch = rawMsg.match(/قام المستشار\s+(.*?)\s+بتقديم/);
        if (clientMatch) searchParam = clientMatch[1].trim();
        else if (consultantMatch) searchParam = consultantMatch[1].trim();
      }

      const qParams = new URLSearchParams();
      if (searchParam) qParams.set('search', searchParam);
      if (invoiceIdParam) qParams.set('invoiceId', invoiceIdParam);
      if (payoutIdParam) qParams.set('payoutId', payoutIdParam);
      const qStr = qParams.toString();

      return { 
        url: qStr ? `/admin/payments?${qStr}` : '/admin/payments', 
        label: 'الانتقال لعمليات الدفع والتحويل' 
      };
    }

    // 6. User Accounts & Registrations (Informational only: no navigation required)
    if (
      meta.target_type === 'new_user_registration' ||
      type.includes('user_reg') ||
      type.includes('new_user') ||
      title.includes('مستخدم جديد') ||
      title.includes('تسجيل مستخدم جديد') ||
      title.includes('تسجيل جديد') ||
      msg.includes('قام بإنشاء حساب جديد')
    ) {
      return null;
    }

    // 7. AI Monitoring / Prompts
    if (
      type.includes('ai') ||
      title.includes('ذكاء اصطناعي') ||
      title.includes('مساعد ذكي') ||
      title.includes('برومبت')
    ) {
      return { url: '/admin/ai-monitoring', label: 'الانتقال لمراقبة الذكاء الاصطناعي' };
    }

    // 8. General informational broadcast -> purely informational
    if (isBroadcastOrMaintenance) {
      return null;
    }

    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  // USER & CONSULTANT PORTAL ROUTING
  // ══════════════════════════════════════════════════════════════════

  // 0. Laws & Legal Sources (New or Amended Law Notifications)
  const isLawNotification = 
    meta.target_type === 'law' || 
    type === 'legal_source' || 
    type.includes('law') ||
    title.includes('قانون') || 
    title.includes('تشريع') || 
    title.includes('تعديل في') || 
    msg.includes('قانون ضريبة') ||
    msg.includes('تعديل تشريعي');

  if (isLawNotification) {
    const lawId = meta.target_id || entityId || '';
    const queryPart = lawId ? `?lawId=${encodeURIComponent(lawId)}&strict=true` : '';
    if (isConsultant) {
      return {
        url: `/consultant/semantic-search${queryPart}`,
        label: 'عرض نص القانون'
      };
    } else {
      return {
        url: `/regulations${queryPart}`,
        label: 'عرض نص القانون'
      };
    }
  }

  // 1. Appointments & Sessions
  if (
    type.includes('session') ||
    type.includes('appointment') ||
    type.includes('booking') ||
    title.includes('رابط') ||
    title.includes('جلسة') ||
    title.includes('موعد') ||
    title.includes('حجز') ||
    msg.includes('جلسة') ||
    msg.includes('موعد')
  ) {
    let apptId = entityId;
    if (!apptId && notif.message) {
      const match = notif.message.match(/consultation-([a-f0-9-]+)/i);
      if (match) apptId = match[1];
    }
    if (isConsultant) {
      return { 
        url: apptId ? `/consultant/sessions?openApptId=${apptId}` : '/consultant/sessions', 
        label: 'الانتقال إلى الجلسات والمواعيد' 
      };
    } else {
      return { 
        url: apptId ? `/my-appointments?openApptId=${apptId}` : '/my-appointments', 
        label: 'الانتقال إلى حجوزاتي ومواعيدي' 
      };
    }
  }

  // 2. Subscriptions & Plans
  if (
    type.includes('subscri') ||
    type.includes('plan') ||
    title.includes('اشتراك') ||
    title.includes('باقة') ||
    title.includes('باقات') ||
    msg.includes('باقتك') ||
    msg.includes('اشتراكك')
  ) {
    if (isConsultant) {
      return { url: '/consultant/subscriptions', label: 'الانتقال إلى باقات الاشتراك' };
    } else {
      return { url: '/subscriptions', label: 'الانتقال إلى باقات الاشتراك' };
    }
  }

  // 3. Support Tickets
  if (
    type.includes('ticket') ||
    title.includes('تذكرة') ||
    msg.includes('تذكرتك') ||
    title.includes('الدعم') ||
    msg.includes('الدعم الفني')
  ) {
    if (entityId && String(entityId).length > 10) {
      return { url: `/support/tickets/${entityId}`, label: 'الانتقال لتفاصيل التذكرة' };
    }
    return { url: '/support/tickets', label: 'الانتقال لتذاكر الدعم الفني' };
  }

  // 4. Consultation Chat
  if (
    type.includes('chat') ||
    type.includes('message') ||
    title.includes('رسالة') ||
    title.includes('محادثة') ||
    msg.includes('رسالة جديدة')
  ) {
    let senderName = '';
    if (rawTitle.includes('من ')) {
      senderName = rawTitle.split('من ')[1]?.trim() || '';
    } else if (rawMsg.includes('من ')) {
      senderName = rawMsg.split('من ')[1]?.trim() || '';
    }
    const params = new URLSearchParams();
    if (entityId) params.append('apptId', entityId);
    if (senderName) params.append('user', senderName);
    const paramStr = params.toString();
    return { url: paramStr ? `/chat?${paramStr}` : '/chat', label: 'الانتقال إلى المحادثة' };
  }

  // 5. Invoices, Payments, Earnings
  if (
    type.includes('payment') ||
    type.includes('payout') ||
    type.includes('invoice') ||
    title.includes('تحويل') ||
    title.includes('دفع') ||
    title.includes('فاتورة') ||
    msg.includes('أرباح') ||
    msg.includes('مستحقات')
  ) {
    if (isConsultant) {
      return { url: '/consultant/earnings', label: 'الانتقال إلى الأرباح والمستحقات' };
    } else {
      return { url: '/invoices', label: 'الانتقال إلى سجل الفواتير' };
    }
  }

  // 6. Consultant Services / Schedule
  if (isConsultant) {
    if (title.includes('جدول') || title.includes('أوقات العمل') || type.includes('schedule')) {
      return { url: '/consultant/schedule', label: 'الانتقال لجدول المواعيد' };
    }
    if (title.includes('خدمة') || title.includes('خدمات') || type.includes('services')) {
      return { url: '/consultant/services', label: 'الانتقال إلى الخدمات المقدمة' };
    }
    if (title.includes('تحليل') || title.includes('مستند') || type.includes('document')) {
      return { url: '/consultant/document-analysis', label: 'الانتقال لتحليل المستندات' };
    }
  }

  // 7. General Broadcasts / Informational Announcements
  if (isBroadcastOrMaintenance) {
    return null;
  }

  return null;
}
