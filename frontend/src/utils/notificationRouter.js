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

  // 1. Explicit target_url provided by backend
  if (notif.target_url) {
    return { url: notif.target_url, label: 'الانتقال إلى الصفحة المعنية' };
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
    type === 'maintenance' || 
    type === 'system_alert' || 
    type === 'broadcast' || 
    type === 'announcement' ||
    (title.includes('صيانة') && !title.includes('طلب')) ||
    (title.includes('إعلان عام') && !title.includes('حجز')) ||
    (title.includes('ترحيب') && !title.includes('طلب'));

  // ══════════════════════════════════════════════════════════════════
  // ADMIN PORTAL ROUTING
  // ══════════════════════════════════════════════════════════════════
  if (isAdmin) {
    // 1. Subscriptions / Requests / Plans
    if (
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
        title.includes('طلب') || 
        title.includes('إيصال') || 
        title.includes('تحويل') || 
        title.includes('ترقية') || 
        title.includes('تجديد') ||
        type.includes('request') ||
        type.includes('receipt')
      ) {
        return { url: '/admin/subscriptions?tab=requests', label: 'الانتقال لطلبات الاشتراك والإيصالات' };
      }
      if (title.includes('باقة') || title.includes('باقات') || type.includes('plan')) {
        return { url: '/admin/subscriptions?tab=plans', label: 'الانتقال إلى إدارة الباقات' };
      }
      return { url: '/admin/subscriptions?tab=subscribers', label: 'الانتقال لسجل المشتركين' };
    }

    // 2. Consultant Applications / Verification
    if (
      type.includes('consultant_app') ||
      type.includes('consultant_review') ||
      title.includes('انضمام مستشار') ||
      title.includes('طلب مستشار') ||
      title.includes('مستشار جديد') ||
      msg.includes('طلب انضمام مستشار') ||
      msg.includes('مراجعة حساب المستشار')
    ) {
      return { url: '/admin/consultant-applications', label: 'الانتقال لمراجعة طلبات المستشارين' };
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

    // 5. Invoices / Payments / Refunds
    if (
      type.includes('invoice') ||
      type.includes('payment') ||
      type.includes('refund') ||
      title.includes('فاتورة') ||
      title.includes('دفع') ||
      title.includes('استرداد') ||
      msg.includes('فاتورة')
    ) {
      if (title.includes('استرداد') || type.includes('refund')) {
        return { url: '/admin/invoices/refunds', label: 'الانتقال لطلبات الاسترداد' };
      }
      return { url: '/admin/invoices', label: 'الانتقال للفواتير والمدفوعات' };
    }

    // 6. User Accounts & Registrations
    if (
      type.includes('user_reg') ||
      type.includes('new_user') ||
      title.includes('مستخدم جديد') ||
      title.includes('تسجيل جديد') ||
      msg.includes('قام بإنشاء حساب')
    ) {
      return { url: '/admin/users', label: 'الانتقال لإدارة المستخدمين' };
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
