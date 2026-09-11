// Control Center Common Helper Functions

export function cls(st) {
  if (!st) return 's-slate';
  const s = String(st).trim();
  if (['نشط', 'مؤكدة', 'موثق', 'active', 'approved', 'completed', 'مكتمل', 'مكتملة', 'paid', 'مدفوعة'].includes(s)) return 's-green';
  if (['معلقة', 'قيد المعالجة', 'قيد التجديد', 'pending', 'in_progress', 'قيد التوثيق', 'قيد المراجعة', 'waiting_user', 'review'].includes(s)) return 's-orange';
  if (['مرفوض', 'ملغاة', 'متوقف', 'inactive', 'failed', 'rejected', 'danger', 'مخاطرة'].includes(s)) return 's-pink';
  return 's-slate';
}

export function initials(name) {
  if (!name) return '360';
  const clean = String(name).trim();
  return clean.slice(0, 2);
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || amount === '—') return '0.00 د.أ';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return `${amount} د.أ`;
  return `${num.toLocaleString('ar-JO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ`;
}

export function formatDate(dt) {
  if (!dt || dt === '—') return '—';
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt);
    return d.toLocaleDateString('ar-JO');
  } catch {
    return String(dt);
  }
}
