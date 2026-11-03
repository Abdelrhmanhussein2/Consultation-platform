// frontend/src/components/AiAssistant/AiRichMessage.jsx
import React, { useState } from 'react';

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
              ⚖️ {sub.trim()}
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

  const handleShare = (type) => {
    const text = 'استشارة ضريبية من ديوان:\n\n' + content;
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (type === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('استشارة من ديوان')}&body=${encodeURIComponent(text)}`;
    }
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
              <span style={{ fontSize: '18px' }}>⚖️</span>
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
              <span>🔹</span>
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
                <span>💡</span>
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
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 800, marginBottom: '6px' }}>
            📚 نصوص وسوابق مستند إليها:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {citations.map((c, cIdx) => (
              <span
                key={cIdx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F1F5F9',
                  color: '#334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: '1px solid #CBD5E1'
                }}
              >
                📌 {c.article || c.ruling || c.law || 'مرجع قانوني'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* تنبيه قانوني */}
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
        <span>⚠️</span>
        <span>
          هذه الإجابة استرشادية مبنية على النصوص المسجلة بالنظام. للمسائل الجوهرية والقرارات الملزمة، يُنصح بحجز استشارة معتمدة.
        </span>
      </div>

      {/* شريط الأدوات أسفل الرسالة (نسخ، طباعة، مشاركة) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '14px',
          paddingTop: '10px',
          borderTop: '1px solid #F1F5F9'
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            background: copied ? '#ECFDF5' : '#FFFFFF',
            color: copied ? '#059669' : '#64748B',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>{copied ? '✓' : '📋'}</span>
          <span>{copied ? 'تم النسخ' : 'نسخ الإجابة'}</span>
        </button>

        <button
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#64748B',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>🖨️</span>
          <span>طباعة</span>
        </button>

        <button
          onClick={() => handleShare('whatsapp')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#16A34A',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>💬</span>
          <span>واتساب</span>
        </button>
      </div>
    </div>
  );
}
