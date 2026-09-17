/**
 * DIWAN TAX PLATFORM - FORMATTING UTILITIES
 * Dynamic Currency, Date & Time formatting according to user preferences
 */

export const JOD_TO_USD_RATE = 1.4104; // Official Central Bank of Jordan Peg: 1 JOD ≈ 1.41 USD

/**
 * Get current stored currency code ('JOD' | 'USD')
 */
export function getAppCurrency() {
  return localStorage.getItem('app_currency') || 'JOD';
}

/**
 * Get current stored timezone
 */
export function getAppTimezone() {
  return localStorage.getItem('app_timezone') || 'Asia/Amman';
}

/**
 * Get current stored date format ('DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMMM YYYY')
 */
export function getAppDateFormat() {
  return localStorage.getItem('app_date_format') || 'DD/MM/YYYY';
}

/**
 * Format monetary price dynamically based on active currency or override
 * @param {number|string} amountInJod - Price in Jordanian Dinars
 * @param {string} [currencyOverride] - Optional override 'JOD' | 'USD'
 * @returns {string} Formatted price with symbol (e.g., "50 د.أ" or "$70.50")
 */
export function formatPrice(amountInJod, currencyOverride) {
  const num = Number(amountInJod);
  if (isNaN(num)) return '0 د.أ';

  const currency = currencyOverride || getAppCurrency();

  if (currency === 'USD') {
    const inUsd = num * JOD_TO_USD_RATE;
    return `$${inUsd.toFixed(2)}`;
  }

  // JOD default
  const formattedJod = num % 1 === 0 ? num.toString() : num.toFixed(2);
  return `${formattedJod} د.أ`;
}

/**
 * Format a Date object or date string according to preferred format and timezone
 * @param {Date|string|number} dateInput 
 * @param {string} [formatOverride] 
 * @param {string} [timezoneOverride] 
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput, formatOverride, timezoneOverride) {
  if (!dateInput) return '—';
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const format = formatOverride || getAppDateFormat();
  const timeZone = timezoneOverride || getAppTimezone();

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // en-CA gives YYYY-MM-DD
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';

    if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }

    if (format === 'DD MMMM YYYY') {
      const monthNamesAr = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const mIdx = Math.max(0, Math.min(11, parseInt(month, 10) - 1));
      return `${parseInt(day, 10)} ${monthNamesAr[mIdx]} ${year}`;
    }

    // Default DD/MM/YYYY
    return `${day}/${month}/${year}`;
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/**
 * Format time in preferred timezone
 * @param {Date|string|number} dateInput 
 * @param {string} [timezoneOverride] 
 * @returns {string} Formatted time (e.g., "02:30 م")
 */
export function formatTime(dateInput, timezoneOverride) {
  if (!dateInput) return '—';
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const timeZone = timezoneOverride || getAppTimezone();

  try {
    return new Intl.DateTimeFormat('ar-JO', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return d.toLocaleTimeString('ar-JO');
  }
}

/**
 * Format combined date and time
 */
export function formatDateTime(dateInput, formatOverride, timezoneOverride) {
  if (!dateInput) return '—';
  const datePart = formatDate(dateInput, formatOverride, timezoneOverride);
  const timePart = formatTime(dateInput, timezoneOverride);
  return `${datePart} ${timePart}`;
}
