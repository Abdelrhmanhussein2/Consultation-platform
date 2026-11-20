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

const COURT_DISPLAY_MAP = {
  tax_first_instance: 'بداية حقوق',
  cassation_rights: 'تمييز حقوق',
  cassation_penal: 'تمييز جزاء',
  administrative_high: 'قضاء إداري',
  constitutional: 'قضاء دستوري'
};

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
  return data.items.map((s) => {
    const rawType = s.doc_type || (s.source_type === 'judgment' ? s.court || 'حكم قضائي' : 'قانون');
    const cleanDocType = COURT_DISPLAY_MAP[rawType] || rawType;
    return {
      id: s.id,
      source_type: s.source_type,
      title: s.title,
      kind: s.source_type === 'judgment' ? 'precedent' : 'law',
      code: s.number ? `رقم ${s.number}` : s.id,
      number: s.number,
      year: s.year,
      court: COURT_DISPLAY_MAP[s.court] || s.court,
      is_active: s.is_active,
      status: s.status || (s.is_active ? 'ساري' : 'ملغي'),
      body: s.body || '',
      articles_count: s.articles_count,
      citations_count: s.citations_count,
      doc_type: cleanDocType,
      tags: [cleanDocType]
    };
  });
}

export async function fetchKnowledgeSourceDetail(sourceId, sourceType) {
  const res = await fetch(
    `/api/legal/sources/${encodePathId(sourceId)}?source_type=${encodeURIComponent(sourceType)}`,
    { headers: getAuthHeaders(), credentials: 'include' }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchDocumentRelations(sourceId) {
  try {
    const res = await fetch(`/api/legal/document-relations/${encodePathId(sourceId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchLawTaxonomyTree(lawId) {
  try {
    const res = await fetch(`/api/legal/relations/${encodePathId(lawId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || json;
  } catch {
    return null;
  }
}

export async function syncKnowledgeCore() {
  return fetch('/api/legal/sync-core', { method: 'POST', headers: jsonHeaders(), credentials: 'include' });
}

export async function fetchParentLaws({ q = '', limit = 20, skip = 0 } = {}) {
  try {
    const params = new URLSearchParams();
    if (q && q.trim()) params.set('q', q.trim());
    if (limit) params.set('limit', String(limit));
    if (skip) params.set('skip', String(skip));
    const url = `/api/legal/parent-laws${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  } catch {
    return [];
  }
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
    if (res.ok && formData.related_laws?.length > 0) {
      for (const pid of formData.related_laws) {
        await fetch('/api/legal/relations', {
          method: 'POST',
          headers: jsonHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            parent_law_id: pid,
            target_document_id: lawId,
            target_title: formData.title,
            relation_domain: 'legislative',
            relation_type: formData.relation_type || 'issued_under',
            sub_category: formData.sub_category || 'الأنظمة',
            document_status: formData.document_status || 'ساري',
            notes: formData.notes || ''
          })
        }).catch(() => {});
      }
    }
    return res;
  }
  return fetch('/api/legal/sources/manual-law', {
    method: 'POST', headers: jsonHeaders(), credentials: 'include', body: JSON.stringify({ ...formData, tags })
  });
}

export async function saveRulingSource(rulingFormData) {
  const tags = parseTags(rulingFormData.tags);
  const rulingId = rulingFormData.caseNumber || `jdg_${Date.now()}`;
  if (rulingFormData.file?.name?.toLowerCase().endsWith('.docx')) {
    const fd = new FormData();
    fd.append('file', rulingFormData.file);
    fd.append('case_number', rulingId);
    fd.append('title', rulingFormData.title);
    fd.append('court', rulingFormData.court || 'تمييز حقوق');
    fd.append('ruling_year', String(rulingFormData.year || new Date().getFullYear()));
    const res = await fetch('/api/legal/upload-judgment', { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: fd });
    if (res.ok && rulingFormData.related_laws?.length > 0) {
      for (const pid of rulingFormData.related_laws) {
        await fetch('/api/legal/relations', {
          method: 'POST',
          headers: jsonHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            parent_law_id: pid,
            target_document_id: rulingId,
            target_title: rulingFormData.title,
            relation_domain: 'judicial',
            relation_type: 'cites_law',
            sub_category: rulingFormData.court_category || 'تمييز حقوق',
            document_status: rulingFormData.document_status || 'ساري',
            notes: rulingFormData.notes || ''
          })
        }).catch(() => {});
      }
    }
    return res;
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

export async function fetchRepealPreview(sourceId) {
  const res = await fetch(`/api/legal/${encodePathId(sourceId)}/repeal-preview`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'تعذر تحميل معاينة الإلغاء');
  }
  return res.json();
}

export async function submitRepeal(sourceId, payload) {
  const res = await fetch(`/api/legal/${encodePathId(sourceId)}/repeal`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'تعذر تنفيذ عملية الإلغاء');
  }
  return res.json();
}

export async function submitRestore(sourceId) {
  const res = await fetch(`/api/legal/${encodePathId(sourceId)}/restore`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'تعذر إعادة تفعيل المصدر');
  }
  return res.json();
}

export async function deleteKnowledgeSource(sourceId, sourceType) {
  return fetch(
    `/api/legal/sources/${encodePathId(sourceId)}?source_type=${encodeURIComponent(sourceType)}&force=true&permanent=true`,
    { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' }
  );
}

export async function previewKnowledgeBroadcast({ targetGroup = 'all', userFilters = {}, consultantFilters = {} }) {
  const res = await fetch('/api/notifications/broadcasts/preview', {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      target_group: targetGroup,
      user_filters: userFilters,
      consultant_filters: consultantFilters
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `فشلت معاينة الجمهور (${res.status})`);
  }
  return res.json();
}

export async function sendKnowledgeBroadcast({ title, message, targetGroup = 'all', userFilters = {}, consultantFilters = {}, sourceId, sourceTitle }) {
  return fetch('/api/notifications/admin-broadcast', {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      title,
      message,
      target_group: targetGroup,
      user_filters: userFilters,
      consultant_filters: consultantFilters,
      source_id: sourceId || undefined,
      source_title: sourceTitle || undefined
    })
  });
}

