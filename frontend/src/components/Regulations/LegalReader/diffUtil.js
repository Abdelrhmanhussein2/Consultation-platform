// frontend/src/components/Regulations/LegalReader/diffUtil.js

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function computeArticleDiff(oldText, newText) {
  if (!oldText && !newText) return { oldHtml: '', newHtml: '', hasDiff: false };
  if (!oldText) {
    const safe = escapeHtml(newText).replace(/\n/g, '<br/>');
    return { oldHtml: '<div class="diff-empty">لا يتوفر نص سابق</div>', newHtml: `<span class="added">${safe}</span>`, hasDiff: true };
  }
  if (!newText) {
    const safe = escapeHtml(oldText).replace(/\n/g, '<br/>');
    return { oldHtml: `<span class="deleted">${safe}</span>`, newHtml: '<div class="diff-empty">تم إلغاء المادة في هذه النسخة</div>', hasDiff: true };
  }
  if (oldText.trim() === newText.trim()) {
    const safe = escapeHtml(oldText).replace(/\n/g, '<br/>');
    return { oldHtml: safe, newHtml: safe, hasDiff: false };
  }

  const regex = /([^\s\n\r]+|[\s\n\r]+)/g;
  const a = (oldText || '').match(regex) || [];
  const b = (newText || '').match(regex) || [];
  const n = a.length, m = b.length;

  if (n > 2500 || m > 2500) {
    return {
      oldHtml: escapeHtml(oldText).replace(/\n/g, '<br/>'),
      newHtml: escapeHtml(newText).replace(/\n/g, '<br/>'),
      hasDiff: true
    };
  }

  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      dp[i + 1][j + 1] = a[i] === b[j] ? dp[i][j] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = n, j = m;
  const oldTokens = [], newTokens = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      oldTokens.unshift({ type: 'same', text: a[i - 1] });
      newTokens.unshift({ type: 'same', text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      newTokens.unshift({ type: 'added', text: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      oldTokens.unshift({ type: 'deleted', text: a[i - 1] });
      i--;
    }
  }

  const render = (tokens, changeType, cssClass) => tokens.map(t => {
    const s = escapeHtml(t.text).replace(/\n/g, '<br/>');
    return t.type === changeType && !/^\s+$/.test(t.text) ? `<span class="${cssClass}">${s}</span>` : s;
  }).join('');

  return {
    oldHtml: render(oldTokens, 'deleted', 'deleted'),
    newHtml: render(newTokens, 'added', 'added'),
    hasDiff: true
  };
}

