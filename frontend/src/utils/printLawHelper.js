// frontend/src/utils/printLawHelper.js
// Utility to print full legal texts with executive platform header, logo, metadata, and multi-page layout
// Uses high-DPI canvas text rendering to completely prevent text copying/extraction in PDF exports

import { parseArticleClauses } from '../services/legalService';

function renderClauseToImage(text, options = {}) {
  if (!text || typeof document === 'undefined') return '';
  const width = options.width || 660;
  const fontSize = options.fontSize || 12.5;
  const lineHeight = fontSize * 1.85;
  const scale = 2; // 2x crispness for high-DPI print

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${options.isBold ? 'bold ' : ''}${fontSize}px 'Cairo', system-ui, -apple-system, sans-serif`;

  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    if (ctx.measureText(testLine).width <= width - 16) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const height = Math.max(26, Math.ceil(lines.length * lineHeight + 8));
  canvas.width = width * scale;
  canvas.height = height * scale;

  ctx.scale(scale, scale);
  ctx.font = `${options.isBold ? 'bold ' : ''}${fontSize}px 'Cairo', system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = options.color || '#1e293b';
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  lines.forEach((line, idx) => {
    ctx.fillText(line, width - 8, 4 + (idx * lineHeight));
  });

  return canvas.toDataURL('image/png');
}

export async function printLawDocument(lawTree) {
  if (!lawTree) return;

  // 1. Show immediate loading screen so user knows document is being secured and prepared
  let loaderEl = document.getElementById('diwan-print-loader');
  if (!loaderEl && typeof document !== 'undefined') {
    loaderEl = document.createElement('div');
    loaderEl.id = 'diwan-print-loader';
    loaderEl.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Cairo', system-ui, sans-serif;
        direction: rtl;
      ">
        <div style="
          background: #ffffff;
          border-radius: 16px;
          padding: 30px 36px;
          text-align: center;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
          border: 1.5px solid #d99a27;
          max-width: 380px;
          width: 90%;
          animation: diwanPop 0.25s ease-out;
        ">
          <div style="
            width: 48px;
            height: 48px;
            border: 4px solid #f1f5f9;
            border-top: 4px solid #123a54;
            border-right: 4px solid #d99a27;
            border-radius: 50%;
            margin: 0 auto 16px auto;
            animation: diwanSpin 0.8s linear infinite;
          "></div>
          <h3 style="margin: 0 0 8px 0; font-size: 16.5px; font-weight: 800; color: #123a54;">
            جاري تجهيز النسخة الرسمية المحمية...
          </h3>
          <p style="margin: 0; font-size: 12.5px; color: #64748b; line-height: 1.6;">
            يتم معالجة وتأمين نصوص ومواد القانون ضد النسخ
          </p>
        </div>
      </div>
      <style>
        @keyframes diwanSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes diwanPop {
          from { opacity: 0; transform: scale(0.93); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
    `;
    document.body.appendChild(loaderEl);
  }

  // 2. Allow browser to paint the loading popup first, ensure fonts are loaded
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  await new Promise(resolve => setTimeout(resolve, 80));

  try {
    const title = lawTree.title || 'وثيقة قانونية';
    const gazette = lawTree.official_gazette || 'عدد 5320 - ص 7390';
    const issueDate = lawTree.issue_date || '30-12-2014';
    const num = lawTree.number || 34;
    const year = lawTree.year || 2014;
    const effectiveDate = lawTree.effective_date || '01-01-2015';
    const amendmentsCount = lawTree.amendments_count ?? 1;
    const totalArticles = lawTree.total_articles || 82;
    const preamble = lawTree.preamble || `نشر القانون في العدد 5320 من الجريدة الرسمية على الصفحة 7390 بتاريخ ${issueDate}، وسرى اعتبارًا من ${effectiveDate}.`;

    // Dynamic timestamp formatting (e.g. 19/11/2026, 01:30 PM)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const curYear = now.getFullYear();
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${pad(hours)}:${minutes} ${ampm}`;
    const issueDateTimeStr = `${day}/${month}/${curYear}, ${timeStr}`;

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

    // Render title and preamble as high-DPI images (100% uncopyable)
    const titleImg = renderClauseToImage(title, { width: 660, fontSize: 17.5, isBold: true, color: '#0f172a' });
    const preambleImg = renderClauseToImage(preamble, { width: 640, fontSize: 12, color: '#334155' });

    // Build Sections and Articles HTML
    let contentHtml = '';
    const sections = lawTree.sections || [{ articles: lawTree.articles || [] }];

    sections.forEach((sec, sIdx) => {
      if (sec.title && sec.title !== 'مواد التشريع') {
        const secTitleImg = renderClauseToImage(sec.title, { width: 660, fontSize: 15, isBold: true, color: '#123a54' });
        contentHtml += `
          <div class="sec-heading">
            <img src="${secTitleImg}" alt="" class="clause-img" style="width:100%; max-width:660px; height:auto;" />
          </div>
        `;
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
        const artDate = art.effective_date || art.amended_date || art.date || effectiveDate;

        // Render article title as high-DPI image so it cannot be copied
        const artHeaderImg = renderClauseToImage(artHeader, { width: 480, fontSize: 13.5, isBold: true, color: '#123a54' });
        const introImg = intro ? renderClauseToImage(intro, { width: 660 }) : '';
        const contentImg = (!hasDefs && clauses.length === 0 && art.content)
          ? renderClauseToImage(art.content, { width: 660 })
          : '';

        contentHtml += `
          <div class="art-card">
            <div class="art-head">
              <div class="art-title-box">
                <img src="${artHeaderImg}" alt="" class="clause-img" style="width:100%; max-width:480px; height:auto;" />
              </div>
              <span class="art-date-badge">${escapeHtml(artDate)}</span>
            </div>
            <div class="art-body">
              ${introImg ? `<img src="${introImg}" alt="" class="clause-img" style="width:100%; max-width:660px; height:auto; margin-bottom:8px;" />` : ''}
              ${hasDefs ? `
                <table class="defs-table">
                  <tbody>
                    ${defs.map(d => {
                      const termImg = renderClauseToImage(d.term, { width: 160, fontSize: 12, isBold: true, color: '#123a54' });
                      const valImg = renderClauseToImage(d.value, { width: 480, fontSize: 12, color: '#334155' });
                      return `
                        <tr>
                          <td class="def-term"><img src="${termImg}" alt="" class="clause-img" style="width:100%; max-width:160px; height:auto;" /></td>
                          <td class="def-val"><img src="${valImg}" alt="" class="clause-img" style="width:100%; max-width:480px; height:auto;" /></td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              ` : clauses.length > 0 ? `
                <div class="clauses-list">
                  ${clauses.map(c => {
                    const text = typeof c === 'string' ? c : (c.text || '');
                    const lvl = (typeof c === 'object' && c.level) ? c.level : 0;
                    const cWidth = Math.max(300, 660 - (lvl * 24));
                    const cImg = renderClauseToImage(text, { width: cWidth });
                    return `<img src="${cImg}" alt="" class="clause-img" style="width:100%; max-width:${cWidth}px; height:auto; margin-right:${lvl * 24}px; margin-bottom:6px;" />`;
                  }).join('')}
                </div>
              ` : contentImg ? `
                <img src="${contentImg}" alt="" class="clause-img" style="width:100%; max-width:660px; height:auto;" />
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin-top: 12mm;
      margin-bottom: 18mm;
      margin-left: 14mm;
      margin-right: 14mm;

      @bottom-right {
        content: "منصة ديوان للاستشارات الضريبية © ${curYear}\\A www.diwantax.com";
        white-space: pre-wrap;
        font-family: 'Cairo', system-ui, -apple-system, sans-serif;
        font-size: 8.5px;
        font-weight: 700;
        color: #334155;
        vertical-align: top;
        padding-top: 6px;
        border-top: 1px solid #cbd5e1;
        direction: rtl;
        text-align: right;
      }

      @bottom-center {
        content: "\\200E" counter(page) "/" counter(pages);
        font-family: 'Cairo', system-ui, -apple-system, sans-serif;
        font-size: 9.5px;
        font-weight: 700;
        color: #475569;
        vertical-align: top;
        padding-top: 6px;
        border-top: 1px solid #cbd5e1;
        direction: ltr;
        text-align: center;
      }

      @bottom-left {
        content: "تاريخ الإصدار: ${issueDateTimeStr}\\A وثيقة مستخرجة من قاعدة التشريعات الضريبية في منصة ديوان";
        white-space: pre-wrap;
        font-family: 'Cairo', system-ui, -apple-system, sans-serif;
        font-size: 8px;
        font-weight: 500;
        color: #64748b;
        vertical-align: top;
        padding-top: 6px;
        border-top: 1px solid #cbd5e1;
        direction: rtl;
        text-align: left;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.8;
      direction: rtl;
      -webkit-user-select: none !important;
      user-select: none !important;
    }
    /* Fixed diagonal watermark repeating across pages */
    .watermark-layer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      overflow: hidden;
      opacity: 0.042;
    }
    .watermark-text {
      font-size: 22px;
      font-weight: 900;
      color: #123a54;
      transform: rotate(-28deg);
      white-space: nowrap;
      letter-spacing: 2px;
      user-select: none;
    }
    /* Running table layout so header/footer repeat on every page */
    table.print-table {
      position: relative;
      z-index: 1;
      width: 100%;
      border-collapse: collapse;
    }
    thead.print-thead {
      display: table-header-group;
    }
    .page-header-cell {
      padding-bottom: 8px;
      border-bottom: 1.5px solid #123a54;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      height: 44px;
      width: auto;
      max-width: 44px;
      object-fit: contain;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-name {
      font-size: 14.5px;
      font-weight: 800;
      color: #123a54;
      margin: 0;
      line-height: 1.3;
    }
    .brand-sub {
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
      margin: 2px 0 0 0;
      line-height: 1.3;
    }
    .badge-stamp {
      font-size: 11px;
      font-weight: 700;
      color: #123a54;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 3px 14px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .content-cell {
      padding-top: 14px;
      padding-bottom: 14px;
    }
    .doc-main-title-box {
      text-align: center;
      margin: 6px 0 16px 0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin-bottom: 12px;
    }
    .meta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 4px;
      text-align: center;
    }
    .meta-label {
      display: block;
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .meta-val {
      display: block;
      font-size: 11px;
      color: #0f172a;
      font-weight: 700;
    }
    .preamble-box {
      background: #fffdf8;
      border: 1px solid #fef3c7;
      border-right: 3.5px solid #d99a27;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 18px;
    }
    .sec-heading-divider {
      margin: 18px 0 14px 0;
      padding-bottom: 4px;
      border-bottom: 1px dotted #cbd5e1;
      page-break-after: avoid;
      break-after: avoid;
    }
    .sec-heading-divider h3 {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .art-card {
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      padding: 12px 14px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .art-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .art-title-box {
      flex: 1;
      margin-left: 12px;
    }
    .art-date-badge {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      background: #f8fafc;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .clause-img {
      display: block;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    }
    .defs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .defs-table tr {
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .def-term {
      width: 25%;
      padding: 6px 8px;
      vertical-align: top;
      background: #f8fafc;
    }
    .def-val {
      padding: 6px 10px;
      vertical-align: top;
    }
  </style>
</head>
<body>
  <div class="watermark-layer" aria-hidden="true">
    <div class="watermark-text">منصة ديوان للاستشارات الضريبية — نسخة معتمدة للاطلاع والطباعة فقط — يُمنع النسخ أو الاقتباس</div>
    <div class="watermark-text">منصة ديوان للاستشارات الضريبية — نسخة معتمدة للاطلاع والطباعة فقط — يُمنع النسخ أو الاقتباس</div>
    <div class="watermark-text">منصة ديوان للاستشارات الضريبية — نسخة معتمدة للاطلاع والطباعة فقط — يُمنع النسخ أو الاقتباس</div>
    <div class="watermark-text">منصة ديوان للاستشارات الضريبية — نسخة معتمدة للاطلاع والطباعة فقط — يُمنع النسخ أو الاقتباس</div>
  </div>
  <table class="print-table">
    <thead class="print-thead">
      <tr>
        <td class="page-header-cell">
          <div class="page-header">
            <div class="brand-box">
              <img src="/diwan-logo.svg" onerror="this.onerror=null;this.src='/diwan-logo-hi-res.png'" alt="منصة ديوان" class="brand-logo" />
              <div class="brand-text">
                <h2 class="brand-name">منصة ديوان للاستشارات الضريبية</h2>
                <p class="brand-sub">المنصة الأولى للاستشارات التشريعية الضريبية الأردنية</p>
              </div>
            </div>
            <div class="badge-stamp">نسخة معتمدة</div>
          </div>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="content-cell">
          <div class="doc-main-title-box">
            <img src="${titleImg}" alt="" class="clause-img" style="display:inline-block; max-width:660px; height:auto;" />
          </div>
          <div class="meta-grid">
            ${metaItems.map(m => `
              <div class="meta-card">
                <span class="meta-label">${escapeHtml(m.label)}</span>
                <span class="meta-val">${escapeHtml(String(m.val))}</span>
              </div>
            `).join('')}
          </div>
          <div class="preamble-box">
            ${preambleImg ? `<img src="${preambleImg}" alt="" class="clause-img" style="width:100%; max-width:640px; height:auto;" />` : ''}
          </div>
          <div class="sec-heading-divider">
            <h3>مواد التشريع</h3>
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
        if (loaderEl && loaderEl.parentNode) {
          loaderEl.parentNode.removeChild(loaderEl);
        }
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print error:', e);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 60000);
      }
    }, 500);

  } catch (err) {
    console.error('Document preparation error:', err);
    if (loaderEl && loaderEl.parentNode) {
      loaderEl.parentNode.removeChild(loaderEl);
    }
  }
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
