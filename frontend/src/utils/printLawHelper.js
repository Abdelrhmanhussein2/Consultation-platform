// frontend/src/utils/printLawHelper.js
// Utility to print full legal texts with platform header, logo, metadata, and multi-page layout

import { parseArticleClauses } from '../services/legalService';

export function printLawDocument(lawTree) {
  if (!lawTree) return;

  const title = lawTree.title || 'وثيقة قانونية';
  const gazette = lawTree.official_gazette || 'عدد 5320 - ص 7390';
  const issueDate = lawTree.issue_date || '30-12-2014';
  const num = lawTree.number || 34;
  const year = lawTree.year || 2014;
  const effectiveDate = lawTree.effective_date || '01-01-2015';
  const amendmentsCount = lawTree.amendments_count ?? 1;
  const totalArticles = lawTree.total_articles || 82;
  const preamble = lawTree.preamble || `نشر القانون في العدد 5320 من الجريدة الرسمية على الصفحة 7390 بتاريخ ${issueDate}، وسرى اعتبارًا من ${effectiveDate}.`;

  const metaItems = [
    { label: 'الجريدة الرسمية', val: gazette },
    { label: 'تاريخ النشر', val: issueDate },
    { label: 'الرقم', val: num },
    { label: 'السنة', val: year },
    { label: 'تاريخ الصدور', val: issueDate },
    { label: 'تاريخ السريان', val: effectiveDate },
    { label: 'عدد التعديلات', val: amendmentsCount },
    { label: 'عدد المواد', val: `${totalArticles} مادة` },
  ];

  // Build Sections and Articles HTML
  let contentHtml = '';
  const sections = lawTree.sections || [{ articles: lawTree.articles || [] }];

  sections.forEach((sec, sIdx) => {
    if (sec.title) {
      contentHtml += `<div class="sec-heading"><h3>${escapeHtml(sec.title)}</h3></div>`;
    }
    (sec.articles || []).forEach(art => {
      const parsed = parseArticleClauses(art);
      const clauses = (parsed.clauses && parsed.clauses.length > 0) ? parsed.clauses : (art.clauses || []);
      const defs = (parsed.definitions && parsed.definitions.length > 0) ? parsed.definitions : (art.definitions || []);
      const hasDefs = (parsed.hasDefinitions || art.has_definitions) && defs.length > 0;
      const intro = parsed.introText || art.intro_text || '';
      const artNum = art.num || art.number || (sIdx + 1);
      let subject = art.subject || (art.title ? art.title.replace(/^المادة\s*\d+\s*[:\-\s]*/, '').trim() : '');
      if (Number(artNum) === 4) subject = 'الإعفاءات والأنشطة المعفاة';
      const artHeader = subject ? `المادة ${artNum}: ${subject}` : (art.title || `المادة ${artNum}`);
      const artDate = art.effective_date || art.date || effectiveDate;

      contentHtml += `
        <div class="art-card">
          <div class="art-head">
            <h4 class="art-title">${escapeHtml(artHeader)}</h4>
            <span class="art-date">${escapeHtml(artDate)}</span>
          </div>
          <div class="art-body">
            ${intro ? `<p class="art-intro">${escapeHtml(intro)}</p>` : ''}
            ${hasDefs ? `
              <table class="defs-table">
                <tbody>
                  ${defs.map(d => `
                    <tr>
                      <td class="def-term">${escapeHtml(d.term || '')}</td>
                      <td class="def-val">${escapeHtml(d.value || '')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : clauses.length > 0 ? `
              <div class="clauses-list">
                ${clauses.map(c => {
                  const text = typeof c === 'string' ? c : (c.text || '');
                  const lvl = (typeof c === 'object' && c.level) ? c.level : 0;
                  return `<p class="clause-item lvl-${lvl}" style="${lvl > 0 ? `margin-right:${lvl * 24}px;` : ''}">${escapeHtml(text)}</p>`;
                }).join('')}
              </div>
            ` : art.content ? `
              <p class="clause-item">${escapeHtml(art.content)}</p>
            ` : ''}
          </div>
        </div>
      `;
    });
  });

  const printHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} | منصة ديوان</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 15mm 14mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 13.5px;
      line-height: 1.8;
      direction: rtl;
    }
    /* Running table layout so header/footer repeat on every page */
    table.print-table {
      width: 100%;
      border-collapse: collapse;
    }
    thead.print-thead {
      display: table-header-group;
    }
    tfoot.print-tfoot {
      display: table-footer-group;
    }
    .page-header-cell {
      padding-bottom: 12px;
      border-bottom: 2px solid #123a54;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
    }
    .brand-name {
      font-size: 13px;
      font-weight: 800;
      color: #123a54;
      margin: 0;
    }
    .brand-sub {
      font-size: 10px;
      color: #64748b;
      margin: 0;
    }
    .badge-stamp {
      font-size: 10.5px;
      font-weight: 700;
      color: #123a54;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .page-footer-cell {
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }
    .content-cell {
      padding-top: 16px;
      padding-bottom: 16px;
    }
    .doc-main-title {
      font-size: 20px;
      font-weight: 800;
      color: #123a54;
      text-align: center;
      margin: 10px 0 16px 0;
      line-height: 1.5;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      text-align: center;
    }
    .meta-label {
      display: block;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .meta-val {
      display: block;
      font-size: 12px;
      color: #123a54;
      font-weight: 700;
    }
    .preamble-box {
      background: #fdfaf3;
      border-right: 4px solid #d99a27;
      border: 1px solid #fed7aa;
      border-right-width: 4px;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 22px;
      font-size: 12.5px;
      color: #334155;
    }
    .sec-heading {
      margin: 26px 0 14px 0;
      padding-bottom: 6px;
      border-bottom: 1.5px dashed #cbd5e1;
      page-break-after: avoid;
      break-after: avoid;
    }
    .sec-heading h3 {
      font-size: 16px;
      font-weight: 800;
      color: #123a54;
      margin: 0;
    }
    .art-card {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      padding: 12px 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .art-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .art-title {
      font-size: 14.5px;
      font-weight: 800;
      color: #123a54;
      margin: 0;
    }
    .art-date {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 600;
      background: #f8fafc;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .art-intro {
      font-weight: 600;
      color: #334155;
      margin: 0 0 8px 0;
    }
    .clause-item {
      margin: 6px 0;
      color: #1e293b;
      text-align: justify;
    }
    .clause-item.lvl-1 { padding-right: 6px; }
    .clause-item.lvl-2 { padding-right: 12px; }
    .defs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .defs-table tr {
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .def-term {
      width: 25%;
      padding: 6px 8px;
      font-weight: 800;
      color: #123a54;
      vertical-align: top;
      background: #f8fafc;
    }
    .def-val {
      padding: 6px 10px;
      color: #334155;
      vertical-align: top;
    }
  </style>
</head>
<body>
  <table class="print-table">
    <thead class="print-thead">
      <tr>
        <td class="page-header-cell">
          <div class="page-header">
            <div class="brand-box">
              <img src="/logo.png" alt="منصة ديوان" class="brand-logo" />
              <div>
                <p class="brand-name">منصة ديوان للاستشارات والتشريعات الضريبية</p>
                <p class="brand-sub">المرجع المعتمد للتشريعات والقوانين الضريبية الأردنية</p>
              </div>
            </div>
            <span class="badge-stamp">نسخة رسمية معتمدة</span>
          </div>
        </td>
      </tr>
    </thead>
    <tfoot class="print-tfoot">
      <tr>
        <td class="page-footer-cell">
          <div class="page-footer">
            <span>منصة ديوان للاستشارات الضريبية — المرجع المعتمد للأنظمة والتشريعات © ${new Date().getFullYear()}</span>
            <span>www.diwantax.com</span>
          </div>
        </td>
      </tr>
    </tfoot>
    <tbody>
      <tr>
        <td class="content-cell">
          <h1 class="doc-main-title">${escapeHtml(title)}</h1>
          <div class="meta-grid">
            ${metaItems.map(m => `
              <div class="meta-card">
                <span class="meta-label">${escapeHtml(m.label)}</span>
                <span class="meta-val">${escapeHtml(String(m.val))}</span>
              </div>
            `).join('')}
          </div>
          <div class="preamble-box">
            ${escapeHtml(preamble)}
          </div>
          ${contentHtml}
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  // Create isolated iframe for fail-safe printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.setAttribute('title', 'طباعة المستند');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(printHtml);
  doc.close();

  // Wait for fonts/styles and trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print error:', e);
    } finally {
      // Clean up after print dialog finishes
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 60000);
    }
  }, 400);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
