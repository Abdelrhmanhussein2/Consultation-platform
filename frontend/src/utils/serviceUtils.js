/**
 * Service Utilities
 * Robust helpers to sanitize embedded metadata from descriptions,
 * parse tier/type JSON, and provide clean human-readable text fallbacks.
 */

/**
 * Strips all embedded metadata comments and formatting artifacts from description text.
 * @param {string} desc - Raw description string
 * @param {string} serviceName - Optional service name for intelligent fallback
 * @returns {string} Sanitized description
 */
export const cleanServiceDescription = (desc, serviceName = '') => {
  if (!desc || typeof desc !== 'string') {
    return getFallbackDescription(serviceName);
  }

  // 1. Strip all variations of metadata comments and HTML tags:
  // <!--meta:...--> | <--meta:...--> | <-meta:...--!> | < - meta:... !> | <meta:...> | meta:{...}
  let clean = desc
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/<--[\s\S]*?-->/gi, '')
    .replace(/<\s*-*\s*meta[\s\S]*?-*-?!?>(?:-->)?/gi, '')
    .replace(/<[\s\S]*?--!>/gi, '')
    .replace(/<[\s\S]*?!>/gi, '')
    .replace(/meta\s*:\s*\{[\s\S]*?\}/gi, '')
    .replace(/<!--[\s\S]*/gi, '')
    .replace(/<-[\s\S]*/gi, '')
    .replace(/-->/gi, '')
    .replace(/--!>/gi, '')
    .replace(/!>/gi, '')
    .trim();

  // 2. Remove any remaining raw JSON fragments or metadata residue
  if (clean.includes('meta:') || clean.includes('tiers') || clean.includes('service_type')) {
    clean = clean.replace(/\{[\s\S]*?\}/g, '').replace(/meta\s*:?/gi, '').trim();
  }

  // 3. Remove leading/trailing dashes, colons, brackets left over
  clean = clean.replace(/^[<>\-:\s]+|[<>\-:\s]+$/g, '').trim();

  // 4. Return clean text if substantial, else return fallback
  if (clean && clean.length > 2) {
    return clean;
  }

  return getFallbackDescription(serviceName);
};

/**
 * Returns a contextual clean description based on service name
 */
export const getFallbackDescription = (serviceName = '') => {
  const sName = (serviceName || '').toLowerCase();
  if (sName.includes('تقرير') || sName.includes('مكتوب')) {
    return 'تقرير مكتوب مفصل لتحليل المعاملات والمخاطر الضريبية وتقديم التوصيات المهنية.';
  }
  if (sName.includes('إقرار') || sName.includes('اقرار') || sName.includes('تدقيق') || sName.includes('فحص')) {
    return 'فحص وتدقيق الإقرارات الضريبية والمستندات المؤيدة وتحديد مدى الامتثال والالتزامات.';
  }
  if (sName.includes('فوترة') || sName.includes('الكترونية') || sName.includes('إلكترونية')) {
    return 'ربط تقني وإعداد أنظمة الفوترة الإلكترونية الوطنية والامتثال للمتطلبات الضريبية.';
  }
  if (sName.includes('محادثة') || sName.includes('شات') || sName.includes('اعتراض')) {
    return 'جلسة محادثة مباشرة لمناقشة التفاصيل والإجراءات الضريبية اللازمة وصياغة المذكرات.';
  }
  if (sName.includes('دخل') || sName.includes('مبيعات') || sName.includes('ضريبة')) {
    return 'مراجعة شاملة للوضع الضريبي وتحديد الالتزامات والمخاطر الضريبية وتقديم المشورة.';
  }
  return 'جلسة استشارة ومراجعة مهنية متخصصة ومباشرة لدراسة حالتك وتقديم الحلول.';
};

/**
 * Parses embedded JSON metadata from a service description.
 * Supports both valid JSON and relaxed single-quoted JSON variations.
 * @param {object} service - Service object with description and name
 * @returns {{ meta: object|null, cleanDesc: string }}
 */
export const parseServiceMeta = (service) => {
  if (!service) return { meta: null, cleanDesc: '' };
  const rawDesc = service.description || '';
  let meta = null;

  // Search for anything looking like meta: { ... } or <!--meta:...-->
  const metaRegex = /(?:<!--)?\s*<?\s*-*\s*meta\s*:\s*(\{[\s\S]*?\})\s*-*-?!?>(?:-->)?/i;
  const match = rawDesc.match(metaRegex) || rawDesc.match(/meta\s*:\s*(\{[\s\S]*?\})/i);

  if (match && match[1]) {
    try {
      let jsonStr = match[1].trim();
      if (!jsonStr.startsWith('{')) {
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }
      }
      // Replace single quotes with double quotes for JSON parsing
      const sanitizedJson = jsonStr.replace(/'/g, '"');
      meta = JSON.parse(sanitizedJson);
    } catch (e) {
      try {
        meta = JSON.parse(match[1]);
      } catch {}
    }
  }

  const cleanDesc = cleanServiceDescription(rawDesc, service.name);
  return { meta, cleanDesc };
};

/**
 * Helper to get clean sanitized description for direct display
 */
export const getServiceCleanDescription = (service) => {
  if (!service) return getFallbackDescription();
  return cleanServiceDescription(service.description, service.name);
};
