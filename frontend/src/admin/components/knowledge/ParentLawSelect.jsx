import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchParentLaws } from './knowledgeApi';

export default function ParentLawSelect({
  value = [],
  onChange,
  placeholder = 'ابحث عن القوانين الأصلية لربطها...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [laws, setLaws] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedMap, setSelectedMap] = useState({});

  const containerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const loadLaws = useCallback(async (query, offset, append = false) => {
    if (append) setIsLoadingMore(true); else setIsLoading(true);
    setFetchError(null);
    try {
      const items = await fetchParentLaws({ q: query, limit: 20, skip: offset });
      setLaws((prev) => (append ? [...prev, ...items] : items));
      setHasMore(items.length === 20);
      setSkip(offset + items.length);
      setSelectedMap((prev) => {
        const next = { ...prev };
        for (const it of items) if (value.includes(it.id)) next[it.id] = it;
        return next;
      });
    } catch {
      setFetchError('تعذر جلب القوانين من الخادم');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && laws.length === 0 && !isLoading) loadLaws('', 0, false);
  }, [isOpen, laws.length, isLoading, loadLaws]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => loadLaws(val, 0, false), 300);
  };

  const handleToggle = (law) => {
    const isSelected = value.includes(law.id);
    const next = isSelected ? value.filter((id) => id !== law.id) : [...value, law.id];
    if (!isSelected) setSelectedMap((prev) => ({ ...prev, [law.id]: law }));
    onChange?.(next);
  };

  const isAmended = (title) => /وتعديلاته|معدل|تعديل/.test(title || '');

  return (
    <div className="relative text-right" dir="rtl" ref={containerRef}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((id) => {
            const item = selectedMap[id] || { id, title: id };
            const amended = isAmended(item.title);
            return (
              <span key={id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-[#F0F7FD] text-[#0A3C64] border border-[#BAE6FD]">
                <span className="truncate max-w-[200px]" title={item.title}>{item.title}</span>
                <span className={`text-[10px] px-1 rounded ${amended ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                  {amended ? 'وتعديلاته' : 'أصلية'}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(value.filter((x) => x !== id)); }} className="text-slate-400 hover:text-red-600">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-300 bg-white text-xs hover:border-[#005D9C] focus:outline-none transition-colors">
        <span className={value.length ? 'text-[#0A3C64] font-medium' : 'text-slate-400'}>
          {value.length ? `تم اختيار (${value.length}) قانون - انقر للتعديل` : placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="ابحث في الخادم برقم القانون أو اسمه..." className="w-full bg-transparent text-xs focus:outline-none" autoFocus />
          </div>

          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">جاري البحث في القوانين...</div>
            ) : fetchError ? (
              <div className="p-3 text-center text-xs text-red-600">
                <span>{fetchError}</span>
                <button type="button" onClick={() => loadLaws(searchTerm, 0, false)} className="block mx-auto mt-1 text-[11px] underline text-[#005D9C]">إعادة المحاولة</button>
              </div>
            ) : laws.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">لا توجد نتائج مطابقة للبحث</div>
            ) : (
              laws.map((law) => {
                const selected = value.includes(law.id);
                const amended = isAmended(law.title);
                return (
                  <div key={law.id} onClick={() => handleToggle(law)} className={`p-2 rounded cursor-pointer text-xs flex items-center justify-between gap-2 hover:bg-[#F0F7FD] transition-colors ${selected ? 'bg-[#F0F7FD] text-[#0A3C64]' : 'text-slate-700'}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#0D3C5C] truncate">{law.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${amended ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{amended ? 'نسخة وتعديلاته' : 'نسخة أصلية'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{law.number && law.number !== '-' ? `رقم ${law.number}` : ''} {law.year && law.year !== '-' ? `لسنة ${law.year}` : ''}</span>
                    </div>
                    <div className="shrink-0 w-4 h-4 rounded border border-slate-300 flex items-center justify-center bg-white">
                      {selected && <svg className="w-3 h-3 text-[#005D9C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                  </div>
                );
              })
            )}

            {hasMore && !isLoading && (
              <div className="p-1.5 text-center">
                <button type="button" onClick={() => loadLaws(searchTerm, skip, true)} disabled={isLoadingMore} className="text-[11px] text-[#005D9C] hover:underline font-medium">
                  {isLoadingMore ? 'جاري تحميل المزيد...' : 'تحميل المزيد من القوانين'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
