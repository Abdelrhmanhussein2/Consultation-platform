/**
 * Pure helper formatters for Admin Consultant Applications.
 * Strictly 0 emojis, English numerals for dates, Diwan theme formatting.
 */

export function formatApplicationDate(dateVal) {
  if (!dateVal) return { date: '—', time: '' };
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return { date: String(dateVal), time: '' };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hoursStr}:${minutesStr} ${ampm}`;

    return { date: dateStr, time: timeStr };
  } catch {
    return { date: String(dateVal), time: '' };
  }
}

export function formatConsultationPrice(priceVal) {
  if (priceVal === null || priceVal === undefined || priceVal === '') {
    return 'لم يحدده بعد';
  }
  const num = Number(priceVal);
  if (isNaN(num)) return 'لم يحدده بعد';
  return `$${num} / ساعة`;
}

export function formatExperienceYears(yearsVal) {
  if (yearsVal === null || yearsVal === undefined || yearsVal === '') {
    return 'غير مذكور';
  }
  const num = Number(yearsVal);
  if (isNaN(num)) return 'غير مذكور';
  return `${num} سنوات`;
}

export function truncateFileName(name, maxLen = 25) {
  if (!name) return '';
  if (name.length <= maxLen) return name;
  const extIndex = name.lastIndexOf('.');
  if (extIndex !== -1 && name.length - extIndex <= 5) {
    const ext = name.slice(extIndex);
    const base = name.slice(0, extIndex);
    const keepLen = maxLen - ext.length - 3;
    if (keepLen > 0) {
      return base.slice(0, keepLen) + '...' + ext;
    }
  }
  return name.slice(0, maxLen - 3) + '...';
}
