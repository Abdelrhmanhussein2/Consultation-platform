// frontend/src/pages/TaxFormsPage.jsx
import React, { useState, useMemo } from 'react';
import './../components/TaxForms/taxForms.css';
import { INITIAL_TAX_FORMS } from '../components/TaxForms/taxFormsData';
import TaxFormsHeader from '../components/TaxForms/TaxFormsHeader';
import TaxFormsFilterBar from '../components/TaxForms/TaxFormsFilterBar';
import TaxFormsGrid from '../components/TaxForms/TaxFormsGrid';
import AddTaxFormModal from '../components/TaxForms/AddTaxFormModal';

export default function TaxFormsPage({ isAdmin = false }) {
  // Effective admin check: either prop or admin route path
  const isEffectiveAdmin =
    isAdmin || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const [formsList, setFormsList] = useState(INITIAL_TAX_FORMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('diwan_tax_forms_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const handleToggleFavorite = (form) => {
    const formId = form.id || form.code;
    setFavorites((prev) => {
      let next;
      if (prev.includes(formId)) {
        next = prev.filter((id) => id !== formId);
      } else {
        next = [...prev, formId];
      }
      try {
        localStorage.setItem('diwan_tax_forms_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDownload = (form) => {
    if (form.file_url) {
      const link = document.createElement('a');
      link.href = form.file_url;
      link.download = form.file_name || `${form.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (form.signed_url) {
      window.open(form.signed_url, '_blank', 'noopener,noreferrer');
      return;
    }
    const content = [
      `المملكة الأردنية الهاشمية — منصة ديوان للاستشارات الضريبية`,
      `============================================================`,
      `النموذج: ${form.title}`,
      `الرمز المعتمد: ${form.code}`,
      `التصنيف: ${form.cat}`,
      `اللغة: ${form.lang}`,
      `الصيغة المعتمدة: ${form.format}`,
      `الوصف والتعليمات:`,
      `${form.desc}`,
      `============================================================`,
      `تاريخ التنزيل: ${new Date().toLocaleDateString('ar-JO')}`
    ].join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.code}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddForm = (newForm) => {
    setFormsList((prev) => [newForm, ...prev]);
    showToast('تمت إضافة النموذج الضريبي بنجاح');
  };

  const handleDeleteForm = (form) => {
    const targetId = form.id || form.code;
    setFormsList((prev) => prev.filter((item) => (item.id || item.code) !== targetId));
    showToast('تم مسح النموذج بنجاح');
  };

  const filteredForms = useMemo(() => {
    const qClean = searchQuery.trim().toLowerCase();
    return formsList.filter((form) => {
      const matchesCategory =
        selectedCategory === 'الكل' || form.cat === selectedCategory;

      const matchesSearch =
        !qClean ||
        form.title.toLowerCase().includes(qClean) ||
        form.code.toLowerCase().includes(qClean) ||
        form.desc.toLowerCase().includes(qClean);

      return matchesCategory && matchesSearch;
    });
  }, [formsList, searchQuery, selectedCategory]);

  return (
    <div className="tax-forms-container">
      <TaxFormsHeader
        isAdmin={isEffectiveAdmin}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <TaxFormsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <TaxFormsGrid
        forms={filteredForms}
        favoritesSet={favoritesSet}
        isAdmin={isEffectiveAdmin}
        onDownload={handleDownload}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteForm}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedCategory('الكل');
        }}
      />

      {isEffectiveAdmin && (
        <AddTaxFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddForm={handleAddForm}
        />
      )}

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0D3C5C',
            color: '#FFFFFF',
            padding: '10px 22px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(13,60,92,0.25)',
            zIndex: 1100
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
