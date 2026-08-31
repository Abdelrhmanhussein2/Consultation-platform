import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from './supportFormConfig';

export default function SupportNewTicketPage({ navigate }) {
  const { token } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const queryCat = searchParams.get('category');
  const validQueryCat = CATEGORIES[queryCat] ? queryCat : '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);

  // Form states
  const [category, setCategory] = useState(validQueryCat);
  const [subCategory, setSubCategory] = useState('');
  const [priority, setPriority] = useState('متوسطة');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [extraFieldsData, setExtraFieldsData] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [agreeConfirm, setAgreeConfirm] = useState(false);

  // Get active configurations based on category & subcategory selection
  const activeCategoryConfig = CATEGORIES[category] || null;
  const activeSubConfig = (category && subCategory && CATEGORIES[category].subs[subCategory]) 
    ? CATEGORIES[category].subs[subCategory] 
    : null;
  
  const fieldsToRender = activeSubConfig ? activeSubConfig.fields : [];

  // Step names
  const stepsList = [
    { num: 1, label: 'تفاصيل الطلب' },
    { num: 2, label: 'تفاصيل إضافية' },
    { num: 3, label: 'المرفقات' },
    { num: 4, label: 'مراجعة الطلب' },
    { num: 5, label: 'تم الإرسال' }
  ];

  // Auto-priority mapping helper
  const handleSubCategoryChange = (val) => {
    setSubCategory(val);
    setExtraFieldsData({});
    if (category && val && CATEGORIES[category].subs[val]) {
      const autoPrio = CATEGORIES[category].subs[val].priority;
      setPriority(autoPrio || 'متوسطة');
    } else {
      setPriority('متوسطة');
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!category) return 'يرجى اختيار الفئة الرئيسية';
    if (!subCategory) return 'يرجى اختيار الفئة الفرعية';
    if (!subject.trim()) return 'موضوع الطلب مطلوب';
    if (!description.trim()) return 'وصف المشكلة مطلوب';
    return '';
  };

  // Step 2 Validation
  const validateStep2 = () => {
    for (const f of fieldsToRender) {
      if (f.required) {
        const val = extraFieldsData[f.id];
        if (f.type === 'checkbox') {
          if (!val || val.length === 0) return `حقل "${f.label}" مطلوب`;
        } else {
          if (!val || (typeof val === 'string' && !val.trim())) {
            return `حقل "${f.label}" مطلوب`;
          }
        }
      }
    }
    return '';
  };

  const handleNext = () => {
    setValidationError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setValidationError(err); return; }
      if (fieldsToRender.length > 0) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setValidationError(err); return; }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrev = () => {
    setValidationError('');
    if (step === 3) {
      if (fieldsToRender.length > 0) {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 2) {
      setStep(1);
    } else if (step === 4) {
      setStep(3);
    }
  };

  // Files handling
  const handleFileChange = (e) => {
    setValidationError('');
    const files = Array.from(e.target.files);
    const validFiles = [];
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc'];

    for (const f of files) {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        setValidationError(`الملف ${f.name} بصيغة غير مسموح بها. الصيغ المسموحة: PDF, PNG, JPG, DOCX.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setValidationError(`الملف ${f.name} يتجاوز الحد الأقصى للمرفقات (10 ميجابايت).`);
        return;
      }
      validFiles.push({
        file: f,
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(1) + ' MB'
      });
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Submit Ticket to Backend
  const handleSubmitTicket = async () => {
    if (!token) return;
    if (!agreeConfirm) {
      alert('يرجى التأكد من صحة المعلومات وتأكيد الإقرار أسفل شاشة المراجعة.');
      return;
    }

    setLoading(true);
    setValidationError('');

    try {
      // Map priority to English value for backend enum
      const backendPriority = priority === 'عالية' ? 'high' : priority === 'منخفضة' ? 'low' : 'medium';
      
      const ticketPayload = {
        subject: subject.trim(),
        description: description.trim(),
        category: category,
        priority: backendPriority,
        sub_category: subCategory,
        extra_fields: extraFieldsData
      };

      const res = await fetch('/api/tickets/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketPayload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'فشل إرسال التذكرة');
      }

      const ticket = await res.json();

      // Upload attachments sequentially
      if (selectedFiles.length > 0) {
        for (const fileObj of selectedFiles) {
          const formData = new FormData();
          formData.append('file', fileObj.file);

          const uploadRes = await fetch(`/api/tickets/${ticket.id}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!uploadRes.ok) {
            console.error(`Failed to upload ${fileObj.name}`);
          }
        }
      }

      setSuccessTicket(ticket);
      setStep(5);
    } catch (e) {
      setValidationError(e.message || 'حدث خطأ غير متوقع أثناء إرسال تذكرتك. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto p-4 md:p-6" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Visual Step Progress Line */}
      <div className="relative flex items-center justify-between mb-10 w-full px-4">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0"></div>
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#0e7490] z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        ></div>

        {stepsList.map((s) => {
          const isCompleted = step > s.num;
          const isActive = step === s.num;
          return (
            <div key={s.num} className="z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#0e7490] text-white'
                    : isActive
                    ? 'bg-[#0e3b5e] text-white ring-4 ring-[#0e3b5e]/15'
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}
              >
                {isCompleted ? <i className="fa fa-check text-[10px]"></i> : s.num}
              </div>
              <span className={`text-[10px] md:text-xs font-semibold mt-2 ${isActive ? 'text-[#0e3b5e]' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Errors display */}
      {validationError && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-xs md:text-sm mb-6 flex items-start gap-2">
          <i className="fa fa-exclamation-triangle mt-0.5"></i>
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: Basic details */}
      {step === 1 && (
        <div className="card p-8 border border-gray-100">
          <h3 className="text-lg font-bold text-[#0e3b5e] mb-6">تفاصيل الطلب</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Category */}
            <div>
              <label className="form-label">الفئة الرئيسية <span className="req">*</span></label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubCategory(''); setExtraFieldsData({}); }}
                className="input-field"
              >
                <option value="">اختر الفئة الرئيسية</option>
                {Object.keys(CATEGORIES).map((key) => (
                  <option key={key} value={key}>{CATEGORIES[key].label}</option>
                ))}
              </select>
            </div>

            {/* Sub category */}
            <div>
              <label className="form-label">الفئة الفرعية <span className="req">*</span></label>
              <select
                value={subCategory}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                disabled={!category}
                className="input-field"
              >
                <option value="">اختر الفئة الفرعية</option>
                {category && Object.keys(CATEGORIES[category].subs).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="form-label">الأولوية <span className="text-[10px] text-gray-400 mr-2">(تُحدد تلقائياً ويمكن تعديلها)</span></label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
              >
                <option value="منخفضة">منخفضة</option>
                <option value="متوسطة">متوسطة</option>
                <option value="عالية">عالية</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="form-label">الموضوع <span className="req">*</span></label>
              <input
                type="text"
                placeholder="اكتب موضوعًا مختصرًا لطلبك"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="form-label">وصف المشكلة <span className="req">*</span></label>
            <textarea
              placeholder="يرجى وصف المشكلة بالتفصيل، وما الذي كنت تحاول القيام به، وما الذي حدث بالفعل..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ minHeight: '140px' }}
            />
            <div className="flex justify-between mt-1.5 text-xs text-gray-400 font-medium">
              <span></span>
              <span>{description.length} / 2000</span>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex justify-between items-center pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/support')}
              className="btn-secondary text-sm py-2.5 px-5"
            >
              إلغاء والعودة
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-navy text-sm py-2.5 px-6"
            >
              التالي <i className="fa fa-arrow-left mr-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Extra dynamic fields */}
      {step === 2 && activeSubConfig && (
        <div className="card p-8 border border-gray-100">
          <h3 className="text-lg font-bold text-[#0e3b5e] mb-2">تفاصيل إضافية</h3>
          <p className="text-gray-500 text-sm mb-6">أسئلة مخصصة لـ <span className="font-bold text-[#0e7490]">{subCategory}</span></p>

          <div className="space-y-5 text-right">
            {fieldsToRender.map((f) => {
              const val = extraFieldsData[f.id] || '';
              const setVal = (newVal) => setExtraFieldsData({ ...extraFieldsData, [f.id]: newVal });

              return (
                <div key={f.id} className="fade-in">
                  <label className="form-label">
                    {f.label} {f.required && <span className="req">*</span>}
                  </label>

                  {/* text & url */}
                  {(f.type === 'text' || f.type === 'url') && (
                    <input
                      type={f.type}
                      placeholder={f.placeholder || ''}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                      className="input-field"
                    />
                  )}

                  {/* textarea */}
                  {f.type === 'textarea' && (
                    <textarea
                      rows={3}
                      placeholder={f.placeholder || ''}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                      className="input-field"
                    />
                  )}

                  {/* select */}
                  {f.type === 'select' && (
                    <select
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                      className="input-field"
                    >
                      <option value="">اختر...</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* radio */}
                  {f.type === 'radio' && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      {f.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={f.id}
                            value={opt}
                            checked={val === opt}
                            onChange={() => setVal(opt)}
                            className="w-4 h-4 text-[#0e3b5e] border-gray-300 focus:ring-[#0e3b5e]"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* checkbox */}
                  {f.type === 'checkbox' && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      {f.options.map((opt) => {
                        const list = Array.isArray(val) ? val : [];
                        const checked = list.includes(opt);
                        const toggle = () => {
                          if (checked) {
                            setVal(list.filter(x => x !== opt));
                          } else {
                            setVal([...list, opt]);
                          }
                        };
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={toggle}
                              className="w-4 h-4 text-[#0e3b5e] rounded border-gray-300 focus:ring-[#0e3b5e]"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 2 Actions */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary text-sm py-2.5 px-5"
              >
                <i className="fa fa-arrow-right ml-2"></i> السابق
              </button>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="btn-navy text-sm py-2.5 px-6"
            >
              التالي <i className="fa fa-arrow-left mr-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Attachments */}
      {step === 3 && (
        <div className="card p-8 border border-gray-100">
          <h3 className="text-lg font-bold text-[#0e3b5e] mb-2">المرفقات</h3>
          <p className="text-gray-500 text-sm mb-6">أرفق أي ملفات تساعدنا على فهم المشكلة بشكل أفضل.</p>

          {/* Drag & drop box */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#0e7490] hover:bg-[#0e7490]/5 transition cursor-pointer mb-6 relative">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 bg-[#0e7490]/10 text-[#0e7490] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa fa-cloud-upload-alt text-2xl"></i>
            </div>
            <p className="font-bold text-[#0e3b5e] mb-1">اسحب الملفات هنا أو اضغط للرفع</p>
            <p className="text-sm text-gray-400">PDF, PNG, JPG, JPEG, DOCX (الحد الأقصى 10MB)</p>
          </div>

          {/* Selected files log */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-bold text-sm text-[#0e3b5e]">الملفات المرفقة ({selectedFiles.length})</h4>
              {selectedFiles.map((fileObj, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0e7490] border border-gray-200 shadow-sm">
                      <i className="fa fa-file"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-700">{fileObj.name}</div>
                      <div className="text-xs text-gray-400">{fileObj.size}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="text-red-400 hover:text-red-600 p-2 transition"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary text-sm py-2.5 px-5"
              >
                <i className="fa fa-arrow-right ml-2"></i> السابق
              </button>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="btn-navy text-sm py-2.5 px-6"
            >
              التالي <i className="fa fa-arrow-left mr-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review Summary */}
      {step === 4 && (
        <div className="card p-8 border border-gray-100">
          <h3 className="text-lg font-bold text-[#0e3b5e] mb-6">مراجعة الطلب</h3>

          <div className="space-y-5">
            {/* Box 1: basic */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#0e3b5e]">تفاصيل الطلب</h4>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-[#0e7490] hover:text-orange-500 font-bold transition">تعديل</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                <div><span className="text-gray-500">الفئة:</span> <span className="font-semibold text-gray-700">{CATEGORIES[category]?.label || category}</span></div>
                <div><span className="text-gray-500">الفئة الفرعية:</span> <span className="font-semibold text-gray-700">{subCategory}</span></div>
                <div><span className="text-gray-500">الأولوية:</span> <span className="badge bg-yellow-50 text-yellow-700 border border-yellow-300 text-[10px] px-2 py-0.5">{priority}</span></div>
                <div><span className="text-gray-500">الموضوع:</span> <span className="font-semibold text-gray-700">{subject}</span></div>
                <div className="col-span-1 md:col-span-2"><span className="text-gray-500">الوصف:</span> <span className="font-semibold text-gray-700 whitespace-pre-line leading-relaxed">{description}</span></div>
              </div>
            </div>

            {/* Box 2: dynamic */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#0e3b5e]">التفاصيل الإضافية</h4>
                {fieldsToRender.length > 0 && (
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-[#0e7490] hover:text-orange-500 font-bold transition">تعديل</button>
                )}
              </div>
              <div className="space-y-2 text-right">
                {fieldsToRender.map((f) => {
                  const val = extraFieldsData[f.id];
                  if (!val) return null;
                  return (
                    <div key={f.id}>
                      <span className="text-gray-500">{f.label}:</span>{' '}
                      <span className="font-semibold text-gray-700">
                        {Array.isArray(val) ? val.join('، ') : val.toString()}
                      </span>
                    </div>
                  );
                })}
                {fieldsToRender.length === 0 && (
                  <div className="text-gray-400">لا توجد تفاصيل إضافية</div>
                )}
              </div>
            </div>

            {/* Box 3: files */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#0e3b5e]">المرفقات</h4>
                <button type="button" onClick={() => setStep(3)} className="text-xs text-[#0e7490] hover:text-orange-500 font-bold transition">تعديل</button>
              </div>
              {selectedFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((fileObj, idx) => (
                    <span key={idx} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2 shadow-sm">
                      <i className="fa fa-file text-[#0e7490]"></i> {fileObj.name}{' '}
                      <span className="text-gray-400 text-xs">({fileObj.size})</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">لا توجد مرفقات</div>
              )}
            </div>
          </div>

          {/* Confirm Checkbox */}
          <div className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              id="confirm-check"
              checked={agreeConfirm}
              onChange={(e) => setAgreeConfirm(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#0e3b5e] rounded border-gray-300 focus:ring-[#0e3b5e]"
            />
            <label htmlFor="confirm-check" className="text-sm text-gray-600 select-none cursor-pointer">
              أؤكد أن المعلومات الواردة أعلاه صحيحة حسب علمي.
            </label>
          </div>

          {/* Step 4 Actions */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary text-sm py-2.5 px-5"
              >
                <i className="fa fa-arrow-right ml-2"></i> السابق
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmitTicket}
              disabled={loading}
              className="btn-primary text-sm py-2.5 px-6 shadow-lg shadow-orange-200 flex items-center gap-2"
            >
              {loading && <i className="fa fa-spinner fa-spin"></i>}
              إرسال الطلب <i className="fa fa-paper-plane mr-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Success screen */}
      {step === 5 && successTicket && (
        <div className="card p-8 border border-gray-100 text-center py-10 space-y-4">
          <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6 text-2xl border border-emerald-200">
            <i className="fa fa-check"></i>
          </span>
          <h3 className="text-lg md:text-xl font-extrabold text-[#0e3b5e]">تم إرسال طلب الدعم بنجاح!</h3>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            تم استلام تذكرتك بنجاح برقم{' '}
            <span className="font-mono font-bold text-[#0e7490] bg-[#0e7490]/5 px-2 py-0.5 rounded border border-[#0e7490]/15">
              {successTicket.ticket_number || `#${successTicket.id.slice(0, 8)}`}
            </span>
            . سيتواصل معك فريق الدعم الفني قريباً.
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => navigate(`/support/tickets/${successTicket.id}`)}
              className="btn-navy text-xs px-5 py-3"
            >
              عرض تفاصيل التذكرة والشات
            </button>
            <button
              onClick={() => navigate('/support')}
              className="btn-secondary text-xs px-5 py-3"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
