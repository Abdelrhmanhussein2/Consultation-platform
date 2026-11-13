import { getAuthHeaders, parseTags } from './knowledgeData';

const encodePathId = (id) =>
  String(id || '').split('/').map((seg) => encodeURIComponent(seg)).join('/');

const jsonHeaders = () => ({ ...getAuthHeaders(), 'Content-Type': 'application/json' });

export async function fetchKnowledgeStats() {
  const res = await fetch('/api/legal/stats', { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) return null;
  const d = await res.json();
  return {
    sources_count: d.sources_count ?? 0,
    active_count: d.active_count ?? 0,
    chunks_count: d.chunks_count ?? 0,
    relations_count: d.relations_count ?? 0
  };
}

export async function fetchKnowledgeSources({ kindFilter, statusFilter, yearFilter, search }) {
  const typeParam = kindFilter === 'precedent' ? 'judgment' : kindFilter === 'law' ? 'law' : 'all';
  const params = new URLSearchParams({ source_type: typeParam, page: '1', page_size: '50' });
  if (statusFilter === 'active') params.set('is_active', 'true');
  else if (statusFilter === 'inactive') params.set('is_active', 'false');
  if (yearFilter) params.set('year', yearFilter);
  if (search.trim()) params.set('q', search.trim());

  const res = await fetch(`/api/legal/sources?${params.toString()}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data.items)) return [];
  return data.items.map((s) => ({
    id: s.id,
    source_type: s.source_type,
    title: s.title,
    kind: s.source_type === 'judgment' ? 'precedent' : 'law',
    code: s.number ? `رقم ${s.number}` : s.id,
    number: s.number,
    year: s.year,
    court: s.court,
    is_active: s.is_active,
    body: s.body || '',
    articles_count: s.articles_count,
    citations_count: s.citations_count,
    tags: s.source_type === 'judgment' ? [s.court || 'حكم قضائي'] : ['تشريع']
  }));
}

export async function fetchKnowledgeSourceDetail(sourceId, sourceType) {
  const res = await fetch(
    `/api/legal/sources/${encodePathId(sourceId)}?source_type=${encodeURIComponent(sourceType)}`,
    { headers: getAuthHeaders(), credentials: 'include' }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function syncKnowledgeCore() {
  return fetch('/api/legal/sync-core', { method: 'POST', headers: jsonHeaders(), credentials: 'include' });
}

export async function saveLawSource(formData) {
  const tags = parseTags(formData.tags);
  if (formData.file?.name?.toLowerCase().endsWith('.docx')) {
    const cleanNum = String(formData.code || '').split('/')[0].replace(/\D/g, '') || '1';
    const lawId = formData.code || `law_${Date.now()}`;
    const yr = String(formData.year || new Date().getFullYear());
    const fd = new FormData();
    fd.append('file', formData.file);
    fd.append('law_id', lawId);
    fd.append('title', formData.title);
    fd.append('number', cleanNum);
    fd.append('year', yr);
    fd.append('version_name', 'الأصلية');
    fd.append('effective_from', `${yr}-01-01`);
    const res = await fetch('/api/legal/upload-law', { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: fd });
    if (res.ok && formData.body?.trim()) {
      await updateKnowledgeSource(lawId, 'law', {
        title: formData.title, year: Number(yr), number: cleanNum, body: formData.body, is_active: true
      }).catch(() => {});
    }
    return res;
  }
  return fetch('/api/legal/sources/manual-law', {
    method: 'POST', headers: jsonHeaders(), credentials: 'include', body: JSON.stringify({ ...formData, tags })
  });
}

export async function saveRulingSource(rulingFormData) {
  const tags = parseTags(rulingFormData.tags);
  if (rulingFormData.file?.name?.toLowerCase().endsWith('.docx')) {
    const fd = new FormData();
    fd.append('file', rulingFormData.file);
    fd.append('case_number', rulingFormData.caseNumber || `jdg_${Date.now()}`);
    fd.append('title', rulingFormData.title);
    fd.append('court', rulingFormData.court || 'تمييز حقوق');
    fd.append('ruling_year', String(rulingFormData.year || new Date().getFullYear()));
    return fetch('/api/legal/upload-judgment', { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: fd });
  }
  return fetch('/api/legal/sources/manual-judgment', {
    method: 'POST', headers: jsonHeaders(), credentials: 'include', body: JSON.stringify({ ...rulingFormData, tags })
  });
}

export async function updateKnowledgeSource(sourceId, sourceType, updatedData) {
  return fetch(`/api/legal/sources/${encodePathId(sourceId)}?source_type=${encodeURIComponent(sourceType)}`, {
    method: 'PUT', headers: jsonHeaders(), credentials: 'include', body: JSON.stringify(updatedData)
  });
}

export async function toggleKnowledgeSourceActive(sourceId, sourceType) {
  return fetch(
    `/api/legal/sources/${encodePathId(sourceId)}/toggle-active?source_type=${encodeURIComponent(sourceType)}`,
    { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include' }
  );
}

export async function deleteKnowledgeSource(sourceId, sourceType) {
  return fetch(
    `/api/legal/sources/${encodePathId(sourceId)}?source_type=${encodeURIComponent(sourceType)}&force=true&permanent=true`,
    { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' }
  );
}

export async function sendKnowledgeBroadcast({ title, message, audience }) {
  return fetch('/api/notifications/admin-broadcast', {
    method: 'POST', headers: jsonHeaders(), credentials: 'include', body: JSON.stringify({ title, message, audience })
  });
}

