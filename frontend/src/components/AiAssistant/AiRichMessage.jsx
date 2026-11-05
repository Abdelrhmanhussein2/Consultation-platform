// frontend/src/components/AiAssistant/AiRichMessage.jsx
import React, { useState } from 'react';
import { ModeIcon } from './AiModeSelector';

/**
 * دالة مساعدة لتحويل النصوص العريضة والروابط القانونية إلى عناصر React
 */
function renderInlineFormatting(text) {
  if (!text) return null;

  // إزالة أي علامات هاشتاغ في البداية إن وجدت بالخطأ
  let cleanText = text.replace(/^#+\s*/, '');

  // تقسيم النص حسب **النص العريض**
  const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={i} style={{ color: '#0F172A', fontWeight: 800 }}>
          {boldContent}
        </strong>
      );
    }

    // إبراز أرقام المواد والقوانين تلقائياً (مثل: المادة 12، قانون رقم 34، إلخ)
    const lawParts = part.split(/((?:المادة|مادة)\s*\d+(?:\s*(?:من|في)\s*قانون\s*[^\s,.]+)?|(?:قانون|القانون)\s*رقم\s*\d+|(?:الحكم|قرار)\s*رقم\s*\d+)/g);
    if (lawParts.length > 1) {
      return lawParts.map((sub, j) => {
        if (/^(?:المادة|مادة|قانون|القانون|الحكم|قرار)\s*\d+/.test(sub.trim())) {
          return (
            <span
              key={`${i}-${j}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: '#FEF3C7',
                color: '#92400E',
                padding: '1px 8px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 700,
                margin: '0 3px',
                border: '1px solid #FDE68A',
                whiteSpace: 'nowrap'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
              <span>{sub.trim()}</span>
            </span>
          );
        }
        return sub;
      });
    }

    return part;
  });
}

/**
 * مكوّن عرض الجداول بصيغة Markdown
 */
function MarkdownTable({ lines }) {
  if (lines.length < 2) return null;

  const parseRow = (line) =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  const headerCells = parseRow(lines[0]);
  const bodyRows = lines
    .slice(2)
    .filter((l) => l.trim().startsWith('|'))
    .map(parseRow);

  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          textAlign: 'right',
          background: '#FFFFFF',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        <thead>
          <tr style={{ background: '#0D3C5C', color: '#FFFFFF' }}>
            {headerCells.map((h, i) => (
              <th key={i} style={{ padding: '10px 14px', fontWeight: 800 }}>
                {renderInlineFormatting(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              style={{
                borderBottom: '1px solid #F1F5F9',
                background: rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
              }}
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} style={{ padding: '10px 14px', color: '#334155' }}>
                  {renderInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * مكوّن الذكاء الاصطناعي الرئيسي لعرض الإجابة بتصميم أنيق وجذاب
 */
export default function AiRichMessage({ content, citations = [], onFollowUp }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) return null;

  // تقسيم محتوى الرسالة إلى كتل هيكلية
  const rawLines = content.split('\n');
  const blocks = [];
  let currentList = [];
  let currentTable = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      blocks.push({ type: 'table', lines: [...currentTable] });
      currentTable = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();

    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // جدول Markdown
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      currentTable.push(line);
      continue;
    } else {
      flushTable();
    }

    // 1. عنوان رئيسي معزول (مثل: **تحليل قانوني تفصيلي...** أو # تحليل قانوني)
    const isIsolatedMainHeader =
      (line.startsWith('**') && line.endsWith('**') && !line.includes(':') && line.length < 100) ||
      (line.startsWith('# ') && !/^\#+\s*\d/.test(line));

    if (isIsolatedMainHeader) {
      flushList();
      const cleanHeader = line.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      blocks.push({ type: 'main_header', text: cleanHeader });
      continue;
    }

    // 2. كشف العناوين والأقسام بجميع أشكالها (### 1. عنوان أو 1. **عنوان** أو **استنتاج:**)
    const isHeadingSyntax = /^#{1,4}\s+/.test(line);
    const lineWithoutHashes = line.replace(/^#{1,4}\s+/, '').trim();

    // فحص إذا كان السطر قسماً مرقماً مثل: "1. عنوان" أو "1) عنوان" أو "**1. عنوان:**"
    const numberedMatch = lineWithoutHashes.match(/^(?:\*\*|\b)?(\d+)[\.\)]\s*(?:\*\*)?(.*?)(?:\*\*)?$/);

    // فحص الاستنتاج / التوصية / الخلاصة
    const isCalloutMatch = lineWithoutHashes.match(/^(?:\*\*)?(استنتاج|الخلاصة|توصية|التوصية|ملاحظة هامة|تنبيه)(?:\*\*)?[:：]\s*(.*)$/);

    if (isCalloutMatch) {
      flushList();
      const title = isCalloutMatch[1];
      const rest = isCalloutMatch[2];
      blocks.push({
        type: 'callout',
        title: title,
        rest: rest
      });
      continue;
    }

    if (isHeadingSyntax || numberedMatch) {
      flushList();
      let num = null;
      let title = lineWithoutHashes;
      let rest = '';

      if (numberedMatch) {
        num = numberedMatch[1];
        title = numberedMatch[2].replace(/^[:\s\-]+/, '').replace(/[:\s\-]+$/, '');
      } else if (isHeadingSyntax) {
        // سطر بدأ بـ ### لكن بدون رقم في البداية
        title = lineWithoutHashes.replace(/^[:\s\-]+/, '').replace(/[:\s\-]+$/, '');
      }

      // تنظيف علامات ** من العنوان
      title = title.replace(/\*\*/g, '').trim();

      blocks.push({
        type: 'section_header',
        num: num,
        title: title,
        rest: rest
      });
      continue;
    }

    // 3. كشف العناوين الفرعية (مثل: "التكييف الضريبي:" أو "البدائل المتاحة:" أو "تطبيق الاقتطاع الصحيح:")
    const subHeadMatch = line.match(/^(?:\*\*)?([\u0600-\u06FF\s]{3,35})(?:\*\*)?[:：]$/);
    if (subHeadMatch && !line.includes('.') && line.length < 40) {
      flushList();
      blocks.push({
        type: 'sub_heading',
        title: subHeadMatch[1].replace(/\*\*/g, '').trim()
      });
      continue;
    }

    // 4. عنصر قائمة نقطية (مثل: - أو * )
    if (/^[-*•]\s+/.test(line)) {
      currentList.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    }

    // 5. فقرة عادية
    flushList();
    blocks.push({ type: 'paragraph', text: line });
  }

  flushList();
  flushTable();

  return (
    <div
      className="ai-assistant-card"
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        direction: 'rtl',
        fontFamily: "'Cairo', sans-serif"
      }}
    >
      {/* عرض الكتل المنظمة */}
      {blocks.map((b, idx) => {
        if (b.type === 'main_header') {
          return (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(135deg, #0D3C5C 0%, #174E75 100%)',
                color: '#FFFFFF',
                padding: '12px 18px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 800,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(13, 60, 92, 0.15)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
              <span>{b.text}</span>
            </div>
          );
        }

        if (b.type === 'section_header') {
          return (
            <div key={idx} style={{ marginTop: idx === 0 ? '0' : '22px', marginBottom: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRight: '4px solid #0D3C5C',
                  padding: '10px 14px',
                  borderRadius: '8px'
                }}
              >
                {b.num && (
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#0D3C5C',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {b.num}
                  </span>
                )}
                <h4
                  style={{
                    margin: 0,
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: '#0D3C5C'
                  }}
                >
                  {b.title}
                </h4>
              </div>
              {b.rest && (
                <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: '#334155', lineHeight: '1.8' }}>
                  {renderInlineFormatting(b.rest)}
                </p>
              )}
            </div>
          );
        }

        if (b.type === 'sub_heading') {
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                margin: '12px 0 6px',
                padding: '4px 10px',
                background: '#F1F5F9',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#0D3C5C'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D3C5C', display: 'inline-block' }} />
              <span>{b.title}</span>
            </div>
          );
        }

        if (b.type === 'callout') {
          return (
            <div
              key={idx}
              style={{
                marginTop: '20px',
                marginBottom: '12px',
                padding: '14px 18px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRight: '4px solid #16A34A',
                borderRadius: '8px',
                color: '#166534'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                <span>{b.title}</span>
              </div>
              {b.rest && (
                <div style={{ fontSize: '13px', lineHeight: '1.75', color: '#14532D' }}>
                  {renderInlineFormatting(b.rest)}
                </div>
              )}
            </div>
          );
        }

        if (b.type === 'list') {
          return (
            <ul
              key={idx}
              style={{
                margin: '6px 0 12px',
                paddingRight: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {b.items.map((it, itIdx) => (
                <li
                  key={itIdx}
                  style={{
                    fontSize: '13.5px',
                    lineHeight: '1.75',
                    color: '#334155'
                  }}
                >
                  {renderInlineFormatting(it)}
                </li>
              ))}
            </ul>
          );
        }

        if (b.type === 'table') {
          return <MarkdownTable key={idx} lines={b.lines} />;
        }

        // Paragraph
        return (
          <p
            key={idx}
            style={{
              margin: '6px 0 10px',
              fontSize: '13.5px',
              lineHeight: '1.8',
              color: '#334155'
            }}
          >
            {renderInlineFormatting(b.text)}
          </p>
        );
      })}

      {/* المراجع المستند إليها إن وجدت */}
      {citations && citations.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
            <span>نصوص وسوابق مستند إليها:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {citations.map((c, cIdx) => (
              <span
                key={cIdx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#F1F5F9',
                  color: '#334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: '1px solid #CBD5E1'
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                <span>{c.article || c.ruling || c.law || 'مرجع قانوني'}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* مسارات التحليل المتقدم التفاعلية السريعة */}
      {content && (content.includes('مسارات التحليل المتقدم') || content.includes('التحليل المتقدم')) && onFollowUp && (
        <div
          style={{
            marginTop: '18px',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F0F9FF 100%)',
            border: '1.5px dashed #BAE6FD',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>انقر على أحد المسارات لتفعيل البحث والتحليل التشريعي المعمق فوراً:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              onClick={() => onFollowUp('أريد إجراء تحليل تشريعي عميق حول هذا الموضوع')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1.5px solid #0284C7',
                color: '#0369A1',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.08)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#0369A1'; }}
            >
              <ModeIcon id="deep" size={14} />
              <span>تحليل تشريعي عميق</span>
            </button>

            <button
              type="button"
              onClick={() => onFollowUp('أريد مقارنة تشريعية حول هذا الموضوع')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1.5px solid #0D3C5C',
                color: '#0D3C5C',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 4px rgba(13, 60, 92, 0.08)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0D3C5C'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#0D3C5C'; }}
            >
              <ModeIcon id="compare" size={14} />
              <span>مقارنة تشريعية</span>
            </button>

            <button
              type="button"
              onClick={() => onFollowUp('أريد فحص متطلبات الالتزام والامتثال لهذا الموضوع')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1.5px solid #16A34A',
                color: '#15803D',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.08)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#15803D'; }}
            >
              <ModeIcon id="compliance" size={14} />
              <span>الالتزام والامتثال</span>
            </button>
          </div>
        </div>
      )}

      {/* تنبيه استرشادي */}
      <div
        style={{
          marginTop: '16px',
          padding: '8px 14px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          fontSize: '11.5px',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>
          هذه الإجابة استرشادية مبنية على النصوص المسجلة بالنظام. للمسائل الجوهرية والقرارات الملزمة، يُنصح بحجز استشارة معتمدة.
        </span>
      </div>

      {/* شريط الأدوات أسفل الرسالة (أيقونة نسخ الإجابة فقط بتنسيق SVG بدون نصوص وبدون أزرار أخرى) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #F1F5F9'
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? 'تم النسخ' : 'نسخ الإجابة'}
          aria-label="نسخ الإجابة"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: copied ? '#A7F3D0' : '#E2E8F0',
            background: copied ? '#ECFDF5' : '#FFFFFF',
            color: copied ? '#059669' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#0D3C5C';
              e.currentTarget.style.background = '#F8FAFC';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.background = '#FFFFFF';
            }
          }}
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
