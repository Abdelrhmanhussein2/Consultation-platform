import React, { useMemo } from 'react';
import PreviewArticleCard from '../PreviewArticleCard';

// Utility to parse text into articles if docFullText is a law text
function parseTextToArticles(text) {
  if (!text) return [];
  const parts = text.split(/(?=المادة\s*\(?\d+\)?[\:\-\s])/g).map(p => p.trim()).filter(Boolean);
  const result = [];

  for (const part of parts) {
    const numMatch = part.match(/المادة\s*\(?(\d+)\)?/);
    if (!numMatch) continue;
    const num = numMatch[1];
    const lines = part.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || `المادة ${num}`;
    const restLines = lines.slice(1);

    const defs = [];
    const regularLines = [];
    let hasDefinitions = false;

    for (const line of restLines) {
      const defMatch = line.match(/^([^:\-]{2,30})\s*[:\-]\s*(.+)$/);
      if (defMatch && !/^(المادة|الفقرة|البند)/.test(line)) {
        hasDefinitions = true;
        defs.push({ term: defMatch[1].trim(), value: defMatch[2].trim() });
      } else {
        regularLines.push(line);
      }
    }

    result.push({
      num: parseInt(num, 10) || num,
      number: parseInt(num, 10) || num,
      title: firstLine,
      intro_text: regularLines[0] && hasDefinitions ? regularLines[0] : '',
      content: restLines.join('\n'),
      has_definitions: hasDefinitions,
      definitions: defs,
      clauses: hasDefinitions ? regularLines.slice(1) : regularLines
    });
  }

  return result;
}

// Utility to parse and sanitize judicial rulings into structured cards & clean content
function parseRulingDetails(text, meta = {}) {
  if (!text) {
    return {
      bench: '',
      claimant: '',
      defendant: '',
      subject: meta?.subject || '',
      claimVal: '',
      contentParagraphs: [],
      verdictParagraphs: []
    };
  }

  // 1. Clean dot sequences, underscores, and normalize whitespace
  const rawLines = text
    .split('\n')
    .map(l => l.replace(/[\.\_]{2,}/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);

  let bench = '';
  let claimant = '';
  let defendant = '';
  let subject = meta?.subject || '';
  let claimVal = '';
  const contentParagraphs = [];
  const verdictParagraphs = [];
  let inVerdict = false;

  // Header boilerplate patterns to suppress (already displayed in meta table)
  const headerPatterns = [
    /^الحكم رقم\s*\d+/i,
    /^تاريخ الفصل\s*:/i,
    /^محكمة\s*(البداية|التمييز|الاستئناف|الإدارية)/i,
    /^المملكة الأردنية الهاشمية/i,
    /^وزارة العدل/i,
    /^السلطة القضائية/i,
    /^رقم (الدعوى|القضية)\s*[:\/0-9\s]+/i,
    /^بصفتها\s*:/i,
    /^رقم القرار\s*\(?\d+\)?/i,
    /اسم المدعي.*القرار الصادر/i,
    /المأذون بإجراء المحاكمة وإصدار الحكم/i,
    /^(اسم المدعي|أسم المدعي|أسم المدعى عليه|اسم المدعى عليه)$/i
  ];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lineWithoutTatweel = line.replace(/\u0640/g, '');

    // Check bench
    if (!bench) {
      if (lineWithoutTatweel.includes('الهيئة الحاكمة')) {
        let b = line;
        if (i + 1 < rawLines.length && rawLines[i + 1].includes('وعضوية')) {
          b += ' ' + rawLines[i + 1];
          i++;
        }
        bench = b;
        continue;
      }
      if (lineWithoutTatweel.includes('السيد حسام محمد عليان')) {
        bench = 'القاضي السيد حسام محمد عليان';
        continue;
      }
    }

    // Check claimant
    if (!claimant) {
      if (lineWithoutTatweel.includes('الشركة المتحدة لصناعة الادوية') || lineWithoutTatweel.includes('الشركة المتحدة لصناعة الأدوية')) {
        claimant = line;
        continue;
      }
      if (/^(?:أقامت المدعية|المدعية?|الطاعن|المميزة?)\s*[:\-]/i.test(lineWithoutTatweel)) {
        let c = line;
        if (i + 1 < rawLines.length && !/^(?:المدعى|المطعون|المميز ضده|موضوع|قيمة|الرقم الضريبي)/i.test(rawLines[i + 1])) {
          c += ' ' + rawLines[i + 1];
          i++;
        }
        claimant = c;
        continue;
      }
    }

    // Check defendant
    if (!defendant) {
      if (lineWithoutTatweel.includes('هيئة الاعتراض')) {
        defendant = 'هيئة الاعتراض ومدير عام دائرة ضريبة الدخل والمبيعات';
        continue;
      }
      if (/^(?:بمواجهة المدعى عليه|المدعى عليه|المطعون ضدهما?|المميز ضدهم?)\s*[:\-]/i.test(lineWithoutTatweel)) {
        let d = line;
        if (i + 1 < rawLines.length && !/^(?:موضوع|قيمة|الرقم الضريبي|السنوات المالية)/i.test(rawLines[i + 1])) {
          d += ' ' + rawLines[i + 1];
          i++;
        }
        defendant = d;
        continue;
      }
    }

    // Check subject
    if (!subject && /موضوع\s*(?:الدعوى|الطعن|القضية|التمييز)\s*[:\-]/i.test(lineWithoutTatweel)) {
      subject = line.replace(/^موضوع\s*(?:الدعوى|الطعن|القضية|التمييز)\s*[:\-]\s*/i, '').trim();
      continue;
    }

    // Check claim value
    if (!claimVal && /قيمة الدعوى\s*[:\-]/i.test(lineWithoutTatweel)) {
      claimVal = line.replace(/^قيمة الدعوى\s*[:\-]\s*/i, '').replace(/[\"\']/g, '').trim();
      continue;
    }

    // Check verdict trigger
    if (/(?:تقرر المحكمة ما يلي|لذلك نقرر|لهذا نقرر|فلهذه الأسباب|وبالنتيجة تقرر|حكمت المحكمة)/i.test(lineWithoutTatweel)) {
      inVerdict = true;
      verdictParagraphs.push(line);
      continue;
    }

    if (inVerdict) {
      // Filter ending administrative sign-offs
      if (/(?:القاضي المترئس|رئيس الديوان|الطابعة القاضي|دقق \/|طباعة:)/i.test(lineWithoutTatweel)) {
        continue;
      }
      verdictParagraphs.push(line);
      continue;
    }

    // Skip pure header boilerplate
    const isHeader = headerPatterns.some(pat => pat.test(lineWithoutTatweel));
    if (isHeader && line.length < 90) {
      continue;
    }

    contentParagraphs.push(line);
  }

  // Fallback verdict if outcome provided in meta
  if (verdictParagraphs.length === 0 && meta?.outcome) {
    verdictParagraphs.push(meta.outcome);
  }

  return {
    bench,
    claimant,
    defendant,
    subject: subject || meta?.subject || '',
    claimVal,
    contentParagraphs,
    verdictParagraphs
  };
}

export default function LegalStageMetaTable({
  isRelated,
  isRuling,
  meta,
  docType,
  docNum,
  docDate,
  docCourt,
  title,
  docFullText,
  articles = [],
  lawTree = null,
  copied,
  handleCopyFullText,
  readerFontSize,
  setReaderFontSize
}) {
  // Parse judicial ruling data if ruling
  const rulingData = useMemo(() => {
    if (!isRuling) return null;
    return parseRulingDetails(docFullText, meta);
  }, [isRuling, docFullText, meta]);

  // Determine articles for law preview (نفس طريقة نص القانون اللي برا)
  const lawPreviewArticles = useMemo(() => {
    if (isRuling) return [];

    // 1. Articles passed directly
    if (articles && articles.length > 0) {
      return articles.slice(0, 3);
    }

    // 2. Articles from lawTree
    if (lawTree) {
      const secs = lawTree.sections || [];
      if (secs.length > 0) {
        const flat = secs.flatMap(s => s.articles || []);
        if (flat.length > 0) return flat.slice(0, 3);
      }
      if (lawTree.articles && lawTree.articles.length > 0) {
        return lawTree.articles.slice(0, 3);
      }
    }

    // 3. Parse from docFullText if it has articles
    if (docFullText && /المادة\s*\(?\d+\)?/i.test(docFullText)) {
      const parsed = parseTextToArticles(docFullText);
      if (parsed.length > 0) return parsed.slice(0, 3);
    }

    return [];
  }, [isRuling, articles, lawTree, docFullText]);

  return (
    <div className="side-reader-tab-page">
      <table
        className="side-reader-meta-table"
        style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}
      >
        <colgroup>
          <col style={{ width: '125px', minWidth: '125px', maxWidth: '125px' }} />
          <col style={{ width: 'calc(100% - 125px)' }} />
        </colgroup>
        <tbody>
          {isRelated ? (
            <>
              <tr>
                <td className="meta-label">النوع</td>
                <td className="meta-value">{docType || (isRuling ? 'حكم قضائي' : 'تشريع')}</td>
              </tr>
              <tr>
                <td className="meta-label">{isRuling ? 'رقم الحكم' : (meta?.numberLabel || 'رقم الوثيقة')}</td>
                <td className="meta-value">{docNum}</td>
              </tr>
              <tr>
                <td className="meta-label">التاريخ</td>
                <td className="meta-value">{docDate}</td>
              </tr>
              <tr>
                <td className="meta-label">المصدر</td>
                <td className="meta-value">{docCourt}</td>
              </tr>
              {(meta?.subject || rulingData?.subject) && (
                <tr>
                  <td className="meta-label">موضوع الدعوى</td>
                  <td className="meta-value">{meta?.subject || rulingData?.subject}</td>
                </tr>
              )}
              {(meta?.outcome || (rulingData?.verdictParagraphs?.length > 0 ? rulingData.verdictParagraphs.slice(0, 2).join(' ') : '')) && (
                <tr>
                  <td className="meta-label">منطوق القرار</td>
                  <td className="meta-value">
                    {meta?.outcome || (rulingData?.verdictParagraphs ? rulingData.verdictParagraphs.slice(0, 2).join(' ') : '')}
                  </td>
                </tr>
              )}
            </>
          ) : (
            <>
              <tr>
                <td className="meta-label">النوع</td>
                <td className="meta-value">{meta?.type || 'قانون'}</td>
              </tr>
              <tr>
                <td className="meta-label">الرقم</td>
                <td className="meta-value">{meta?.number || docNum || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">تاريخ الصدور</td>
                <td className="meta-value">{meta?.issueDate || meta?.issue_date || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">تاريخ السريان</td>
                <td className="meta-value">{meta?.effectiveDate || meta?.effective_date || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">الجريدة الرسمية</td>
                <td className="meta-value">{meta?.gazette || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">الحالة</td>
                <td className="meta-value">{meta?.status || 'ساري'}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {isRelated && (
        <>
          <div className="side-reader-title-card">{title}</div>
          <div className="side-reader-content-block full-text-view">
            <div className="side-reader-content-toolbar">
              <div className="toolbar-right">
                <span className="doc-content-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  {isRuling ? 'نبذة عن الحكم القضائي' : 'نبذة عن القانون'}
                </span>
              </div>
              <div className="toolbar-left">
                <button
                  type="button"
                  className={`doc-tool-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyFullText}
                  title="نسخ النبذة"
                >
                  <span>{copied ? 'تم النسخ' : 'نسخ النبذة'}</span>
                </button>
                <div className="font-size-group">
                  <button type="button" className="doc-tool-btn" onClick={() => setReaderFontSize(f => Math.min(f + 1, 22))} title="تكبير الخط">A+</button>
                  <button type="button" className="doc-tool-btn" onClick={() => setReaderFontSize(f => Math.max(f - 1, 12))} title="تصغير الخط">A-</button>
                </div>
              </div>
            </div>

            <div className="side-reader-ruling-body" style={{ fontSize: `${readerFontSize}px` }}>
              {isRuling ? (
                // أحكام قضائية: بطاقات الأطراف، وقائع النزاع، ومنطوق الحكم المنسق
                rulingData ? (
                  <div className="ruling-structured-container">
                    {/* بطاقة أطراف الدعوى والهيئة القضائية */}
                    {(rulingData.bench || rulingData.claimant || rulingData.defendant || rulingData.claimVal) && (
                      <div className="ruling-parties-box">
                        <div className="ruling-parties-header">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          <span>أطراف الدعوى والهيئة القضائية</span>
                        </div>
                        <div className="ruling-parties-grid">
                          {rulingData.bench && (
                            <div className="ruling-party-item">
                              <span className="party-role">الهيئة الحاكمة:</span>
                              <span className="party-name">{rulingData.bench}</span>
                            </div>
                          )}
                          {rulingData.claimant && (
                            <div className="ruling-party-item">
                              <span className="party-role">الجهة المدعية / الطاعنة:</span>
                              <span className="party-name">{rulingData.claimant}</span>
                            </div>
                          )}
                          {rulingData.defendant && (
                            <div className="ruling-party-item">
                              <span className="party-role">الجهة المدعى عليها / المطعون ضدها:</span>
                              <span className="party-name">{rulingData.defendant}</span>
                            </div>
                          )}
                          {rulingData.claimVal && (
                            <div className="ruling-party-item">
                              <span className="party-role">قيمة الدعوى:</span>
                              <span className="party-name party-val">{rulingData.claimVal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* وقائع النزاع وأسباب الطعن */}
                    {rulingData.contentParagraphs.length > 0 && (
                      <div className="ruling-facts-section">
                        <div className="ruling-section-badge">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          <span>وقائع النزاع وتطبيق القانون</span>
                        </div>
                        <div className="ruling-facts-body">
                          {rulingData.contentParagraphs.slice(0, 35).map((para, idx) => {
                            const isHead = /^(?:أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|وقائع|وبالمحاكمة|بالتدقيق|هذه الوقائع|وعن أسباب|وعليه)/i.test(para.replace(/\u0640/g, ''));
                            const isNumItem = /^\d+[\-\.\)]\s*/.test(para);
                            return (
                              <p
                                key={idx}
                                className={`ruling-paragraph ${isHead ? 'is-section-head' : ''} ${isNumItem ? 'is-num-point' : ''}`}
                              >
                                {para}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* منطوق القرار والنتيجة النهائية */}
                    {rulingData.verdictParagraphs.length > 0 && (
                      <div className="ruling-verdict-card">
                        <div className="ruling-verdict-head">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"></path>
                            <path d="m16 16 6-6"></path>
                            <path d="m8 8 6-6"></path>
                            <path d="m9 7 8 8"></path>
                            <path d="m21 11-8-8"></path>
                          </svg>
                          <span>منطوق القرار والنتيجة النهائية</span>
                        </div>
                        <div className="ruling-verdict-body">
                          {rulingData.verdictParagraphs.map((vPara, vIdx) => (
                            <p key={vIdx} className="ruling-verdict-para">
                              {vPara}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ lineHeight: 1.9, color: '#334155', margin: 0 }}>{title}</p>
                )
              ) : (
                // تشريع / قانون: عرض بطاقات المواد المنسقة مثل معاينة نص القانون تماماً
                lawPreviewArticles.length > 0 ? (
                  <div className="side-reader-law-articles">
                    {lawPreviewArticles.map((article, aIdx) => (
                      <PreviewArticleCard key={article.num || article.number || aIdx} article={article} />
                    ))}
                    <div className="preview-end-gate" style={{ marginTop: '16px' }}>
                      <div>
                        <strong>هذه معاينة مختصرة من نصوص ومواد القانون</strong>
                        <small>للإطلاع على جميع المواد والتفاصيل يمكنك الانتقال إلى شاشة القراءة الكاملة.</small>
                      </div>
                    </div>
                  </div>
                ) : (
                  docFullText ? (
                    docFullText.split('\n').map(p => p.trim()).filter(Boolean).slice(0, 20).map((paragraph, pIdx) => (
                      <p key={pIdx} className="ruling-paragraph">{paragraph}</p>
                    ))
                  ) : (
                    <p style={{ lineHeight: 1.9, color: '#334155', margin: 0 }}>{title}</p>
                  )
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
