import React from 'react';

export default function RegistryDetailDrawer({
  drawerOpen,
  closeDrawer,
  currentRecord,
  currentDrawerTab,
  setCurrentDrawerTab,
  statusesState,
  notesState,
  conversationsState,
  chatInput,
  setChatInput,
  handleSendMessage,
  noteInput,
  setNoteInput,
  handleSaveNote,
  openStatusModal,
  setSelectedModule,
  setCurrentPage,
  showToastMsg
}) {
  return (
    <>
      <div
        className={`drawer-overlay ${drawerOpen ? 'show' : ''}`}
        onClick={closeDrawer}
      />
      <aside className={`drawer ${drawerOpen ? 'show' : ''}`}>
        {currentRecord && (
          <>
            <div className="drawer-head">
              <div>
                <div className="drawer-title">{currentRecord.title}</div>
                <div className="drawer-sub">
                  {currentRecord.type} · {currentRecord.ref} · {currentRecord.owner}
                </div>
              </div>
              <button className="drawer-close-btn" onClick={closeDrawer}>×</button>
            </div>

            <div className="drawer-summary">
              <div className="ds">
                <span>الحالة</span>
                <b>{statusesState[currentRecord.id] || currentRecord.status}</b>
              </div>
              <div className="ds">
                <span>الأولوية</span>
                <b>{currentRecord.priority}</b>
              </div>
              <div className="ds">
                <span>آخر نشاط</span>
                <b>{currentRecord.last}</b>
              </div>
              <div className="ds">
                <span>التاريخ</span>
                <b dir="ltr">{currentRecord.date}</b>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="drawer-tabs">
              {[
                ['overview', 'نظرة عامة'],
                ['log', 'السجل'],
                ['chat', 'المحادثات'],
                ['finance', 'المدفوعات والفواتير'],
                ['tickets', 'تذاكر الدعم'],
                ['ai', 'الاستخدام الذكي'],
                ['notes', 'الملاحظات']
              ].map(([tKey, tLabel]) => (
                <button
                  key={tKey}
                  className={`drawer-tab ${currentDrawerTab === tKey ? 'active' : ''}`}
                  onClick={() => setCurrentDrawerTab(tKey)}
                >
                  {tLabel}
                </button>
              ))}
            </div>

            {/* Drawer Body Content */}
            <div className="drawer-body">
              {/* Tab 1: Overview */}
              {currentDrawerTab === 'overview' && (
                <>
                  <div className="section-box">
                    <div className="section-head">بيانات السجل</div>
                    <div className="detail-grid">
                      <div className="detail-row"><span>نوع السجل</span><b>{currentRecord.type}</b></div>
                      <div className="detail-row"><span>المرجع</span><b dir="ltr">{currentRecord.ref}</b></div>
                      <div className="detail-row"><span>صاحب العلاقة</span><b>{currentRecord.owner}</b></div>
                      <div className="detail-row"><span>القيمة</span><b>{currentRecord.amount || '—'}</b></div>
                      <div className="detail-row"><span>الحالة</span><b>{statusesState[currentRecord.id] || currentRecord.status}</b></div>
                      <div className="detail-row"><span>الأولوية</span><b>{currentRecord.priority}</b></div>
                      <div className="detail-row"><span>آخر نشاط</span><b>{currentRecord.last}</b></div>
                      <div className="detail-row"><span>التقييم</span><b>{currentRecord.rating}</b></div>
                    </div>
                  </div>

                  <div className="section-box">
                    <div className="section-head">العلاقات المرتبطة</div>
                    <div style={{ padding: '10px' }}>
                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>الاستشارات</b>
                            <p>{currentRecord.consultations || 0} سجل مرتبط</p>
                          </div>
                          <button
                            className="mini"
                            onClick={() => {
                              closeDrawer();
                              setSelectedModule('استشارة');
                              setCurrentPage(1);
                              showToastMsg('تم عرض الاستشارات المرتبطة');
                            }}
                          >
                            استعراض
                          </button>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>المحادثات</b>
                            <p>{(conversationsState[currentRecord.id] || []).length} رسائل مسجلة</p>
                          </div>
                          <button className="mini" onClick={() => setCurrentDrawerTab('chat')}>
                            فتح
                          </button>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>تذاكر الدعم</b>
                            <p>{currentRecord.tickets || 0} تذكرة مرتبطة</p>
                          </div>
                          <button className="mini" onClick={() => setCurrentDrawerTab('tickets')}>
                            استعراض
                          </button>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>الاستخدام الذكي</b>
                            <p>{currentRecord.ai || 'متاح'}</p>
                          </div>
                          <button className="mini" onClick={() => setCurrentDrawerTab('ai')}>
                            التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Log / Activity Timeline */}
              {currentDrawerTab === 'log' && (
                <div className="timeline">
                  {[
                    ['10:42', 'تحديث على السجل', 'تم تسجيل وتحديث النشاط في قاعدة البيانات.'],
                    ['10:21', 'محادثة مرتبطة', 'تم إرسال رسالة ومتابعة متعلقة بالسجل.'],
                    ['09:54', 'تحديث مالي', 'تم التحقق من الحساب والعمليات المالية.'],
                    ['أمس', 'مراجعة إدارية', 'تمت مراجعة السجل من الإدارة العامة للمنصة.']
                  ].map((x, idx) => (
                    <div className="timeline-item" key={idx}>
                      <span className="tl-time">{x[0]}</span>
                      <div className="tl-line"><div className="tl-dot"></div></div>
                      <div>
                        <div className="tl-title">{x[1]}</div>
                        <div className="tl-desc">{x[2]}</div>
                      </div>
                      <span className="tag" style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>
                        سجل
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Chat Shell */}
              {currentDrawerTab === 'chat' && (
                <div className="chat-shell">
                  <div className="chat-people">
                    <div className="chat-person active">
                      <b>{currentRecord.owner}</b>
                      <span>محادثة مباشرة</span>
                    </div>
                    <div className="chat-person">
                      <b>فريق الدعم والعمليات</b>
                      <span>متابعة إدارية</span>
                    </div>
                  </div>

                  <div className="chat-main">
                    <div className="chat-head">المحادثة المرتبطة بالسجل</div>
                    <div className="messages">
                      {(conversationsState[currentRecord.id] && conversationsState[currentRecord.id].length > 0 ? (
                        conversationsState[currentRecord.id]
                      ) : (
                        [['نظام ديوان', 'لا توجد رسائل سابقة مسجلة لهذا الحساب.', '—']]
                      )).map(([sender, text, time], idx) => (
                        <div key={idx} className={`msg ${sender === 'إدارة المنصة' ? 'me' : 'them'}`}>
                          <b>{sender}</b>
                          <div>{text}</div>
                          <time>{time}</time>
                        </div>
                      ))}
                    </div>
                    <div className="composer">
                      <input
                        placeholder="اكتب الرسالة..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                      />
                      <button className="btn primary" onClick={handleSendMessage}>
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Finance */}
              {currentDrawerTab === 'finance' && (
                <>
                  <div className="section-box">
                    <div className="section-head">المدفوعات والفواتير المرتبطة</div>
                    <div style={{ padding: '10px' }}>
                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>الفاتورة الضريبية {currentRecord.ref}</b>
                            <p>{currentRecord.amount || '—'} · سداد إلكتروني معتمد</p>
                          </div>
                          <span className="status s-green">مدفوعة</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-box">
                    <div className="section-head">الملخص المالي</div>
                    <div className="detail-grid">
                      <div className="detail-row"><span>المدفوع</span><b>{currentRecord.amount || '—'}</b></div>
                      <div className="detail-row"><span>المستحق</span><b>0 د.أ</b></div>
                      <div className="detail-row"><span>عمليات مرفوضة</span><b>0</b></div>
                      <div className="detail-row"><span>آخر عملية</span><b>{currentRecord.date}</b></div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 5: Tickets */}
              {currentDrawerTab === 'tickets' && (
                <div>
                  <div className="mini-card">
                    <div className="row">
                      <div>
                        <b>تذكرة الدعم {currentRecord.ref}</b>
                        <p>{currentRecord.title} · {statusesState[currentRecord.id] || currentRecord.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: AI Usage */}
              {currentDrawerTab === 'ai' && (
                <div className="section-box">
                  <div className="section-head">الاستخدام والتحليل الذكي</div>
                  <div className="detail-grid">
                    <div className="detail-row"><span>الاستخدام</span><b>{currentRecord.ai || 'متاح'}</b></div>
                    <div className="detail-row"><span>تقييم الأداء</span><b>{currentRecord.rating || '—'}</b></div>
                  </div>
                </div>
              )}

              {/* Tab 7: Notes */}
              {currentDrawerTab === 'notes' && (
                <>
                  <div className="section-box">
                    <div className="section-head">إضافة ملاحظة</div>
                    <div style={{ padding: '11px' }}>
                      <textarea
                        className="note-input"
                        placeholder="اكتب ملاحظة مرتبطة بهذا السجل..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                      />
                      <div className="inline-actions" style={{ marginTop: '8px' }}>
                        <button className="btn primary" onClick={handleSaveNote}>
                          حفظ الملاحظة
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="section-box">
                    <div className="section-head">الملاحظات السابقة</div>
                    <div style={{ padding: '10px' }}>
                      {(notesState[currentRecord.id] && notesState[currentRecord.id].length > 0) ? (
                        notesState[currentRecord.id].map((n, i) => (
                          <div className="mini-card" key={i}>
                            <b>{n.text}</b>
                            <p>{n.date} · {n.author}</p>
                          </div>
                        ))
                      ) : (
                        <div className="empty">لا توجد ملاحظات مسجلة حتى الآن</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="drawer-footer">
              <button
                className="btn primary"
                onClick={openStatusModal}
              >
                تغيير الحالة
              </button>
              <button className="btn light" onClick={() => setCurrentDrawerTab('chat')}>
                مراسلة
              </button>
              <button className="btn light" onClick={() => setCurrentDrawerTab('notes')}>
                إضافة ملاحظة
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
