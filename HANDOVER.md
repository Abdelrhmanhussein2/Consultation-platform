# وثيقة تسليم المشروع الشاملة: العلاقات التشريعية والقضائية ونظام الإلغاء
# Comprehensive Handover Document: Legal Relations, Taxonomy & Repeal System

تاريخ التحديث الأخير: **15 نوفمبر 2026**  
بيئة العمل: **منصة ديوان للاستشارات القانونية والضريبية**  
حالة الفروع والمايجريشن: **Single Head `c3d4e5f6a7b8` | 28/28 Pytest Tests Passing | Vite Build Clean (0 Errors)**

---

## 1. القرارات المعمارية الأساسية (Architecture Decisions)

1. **المزامنة الثنائية (PostgreSQL + Neo4j)**:
   - **PostgreSQL (`legal_relations`, `legal_document_metadata`)**: المصدر المرجعي الأول (Single Source of Truth) لحفظ العلاقات التشريعية والقضائية، وحالة نفاذ الوثائق (`ساري` / `ملغي` / `مؤقت`)، وسجلات التدقيق الكاملة، ومتابعة حالة المزامنة (`pending` -> `synced` / `failed`).
   - **Neo4j**: شبكة العلاقات البيانية للبحث الدلالي والاجتياز السريع واسترجاع الـ RAG:
     - `ISSUED_UNDER`: ما صدر بموجب القانون (الأنظمة، القرارات، التعليمات، القوانين، أحكام ملزمة، جداول، ملاحق).
     - `REPEALED_BY`: التشريعات والأنظمة الملغاة بموجب قانون آخر.
     - `CITES_LAW`: استناد الأحكام القضائية للقانون (مع تصنيف المحكمة والمادة).
2. **منع الحذف الفعلي نهائياً (Zero Hard Delete)**:
   - تم تعطيل مسار `DELETE /api/legal/sources/{id}` نهائياً، ويرجع كود `405 Method Not Allowed` برسالة: `"لا يمكن حذف القوانين، استخدم الإلغاء"`.
   - فك الارتباط عند التعديل يتم عبر **الحذف الناعم (Soft Delete)**: `is_active = False`، وحفظ `unlinked_at` و `unlinked_by` في PostgreSQL، مع حذف حافة العلاقة فقط في Neo4j دون لمس أيٍّ من العقدتين، وتوثيق العملية في جدول التدقيق `legal_relation_audits`.
3. **حالة الوثيقة خاصية على الوثيقة نفسها**:
   - مصدر الحقيقة لحالة الوثيقة هو جدول `legal_document_metadata`.
   - القوانين والوثائق السابقة تعتبر سارية افتراضياً في حال عدم وجود سجل لها عبر `COALESCE(meta.status, 'ساري')`.
4. **عزل الأحكام القضائية التاريخية**:
   - عند إلغاء قانون، تظل الأحكام القضائية المرتبطة به سارية كاجتهاد قضائي تاريخي مستقل لا يجوز إلغاؤه بالتبعية؛ وأي محاولة لإلغاء حكم قضائي تابع لقانون ملغى تُرفض بكود `400`.
5. **حماية خطوط الأنابيب (Pipeline Safety Safeguard)**:
   - في `scripts/run_pipeline.py:253`: تم تعطيل `clear_database()` افتراضياً لمنع المسح الكارثي (`DETACH DELETE n`)؛ وتتطلب صراحة ضبط المتغير البيئي `ALLOW_DESTRUCTIVE_DB_CLEAR=1`، وإلا ترمي `RuntimeError` فوري.

---

## 2. سلسلة مايجريشن قاعدة البيانات (Alembic Chain)

قاعدة البيانات منتظمة تحت **Head واحد فقط**:
```text
<base> -> ... -> ea8941e7a0c8 -> d1e2f3a4b5c6 -> e1f2a3b4c5d6
  -> f8b7c6d5e4a3 (standardize_8_specializations)
  -> 9c8d7e6f5a4b (create_legal_relations_table)
  -> a1b2c3d4e5f7 (create_legal_metadata_and_repeal_audits)
  -> c3d4e5f6a7b8 (add_soft_delete_and_audits_to_legal_relations) [HEAD الحالية]
```

* **ملحوظة تصحيحية هامة**: تم استبدال المعرّف المكرر `f1a2b3c4d5e6` بالمعرّف الفريد `f8b7c6d5e4a3` لأن المعرّف الأول كان مستخدماً بالفعل في مايجريشن فواتير قديم يعود لعام 2026-09، مما أصلح التضارب تماماً.

---

## 3. نقاط النهاية المتاحة (API Endpoints & Responses)

### أ. البحث المخدمي في القوانين الأب (Parent Laws Search)
- **Endpoint**: `GET /api/legal/parent-laws?q={term}&limit={num}&skip={num}`
- **Response**:
```json
[
  { "id": "45/2008", "title": "قانون رقم 45 لسنة 2008 (قانون التأجير التمويلي)", "year": "2008", "number": "45" },
  { "id": "قانون_34_2014_وتعديلاته", "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته", "year": "2014", "number": "34" }
]
```

### ب. شجرة الارتباطات التشريعية والقضائية لقانون
- **Endpoint**: `GET /api/legal/relations/{law_id}`
- **Response**:
```json
{
  "code": 200,
  "status": "success",
  "message": "success",
  "data": {
    "legislative": {
      "issued_under": {
        "الأنظمة": [
          { "id": "reg_01", "title": "نظام رقم 1 لسنة 2015", "status": "ساري", "document_type": "regulation" }
        ],
        "التعليمات": [
          { "id": "inst_01", "title": "تعليمات التطبيق 2020", "status": "ساري", "document_type": "instructions" }
        ]
      },
      "repealed_by": {
        "القوانين": [
          { "id": "old_law_99", "title": "قانون قديم ملغي", "status": "ملغي", "document_type": "law" }
        ]
      }
    },
    "judicial": {
      "تمييز حقوق": [
        { "id": "jdg_101", "title": "قرار تمييز حقوق 101/2024", "status": "ساري", "document_type": "judgment" }
      ]
    }
  }
}
```

### ج. جلب الارتباطات الحالية لوثيقة لغايات التعديل
- **Endpoint**: `GET /api/legal/document-relations/{source_id}` (أو `/sources/{source_id}/relations`)
- **Response**:
```json
{
  "status": "success",
  "document_id": "reg_01",
  "parent_law_ids": ["law_34_2014"],
  "relations": [
    {
      "id": "rel_uuid",
      "parent_law_id": "law_34_2014",
      "target_document_id": "reg_01",
      "relation_type": "issued_under",
      "sub_category": "الأنظمة",
      "document_status": "ساري",
      "is_active": true
    }
  ]
}
```

### د. معاينة الإلغاء الذري والتوابع (Repeal Preview)
- **Endpoint**: `GET /api/legal/{id}/repeal-preview`
- **Response**:
```json
{
  "status": "success",
  "document_id": "law_34_2014",
  "title": "قانون ضريبة الدخل",
  "document_status": "ساري",
  "dependents": [
    {
      "id": "reg_01",
      "title": "نظام الفوترة",
      "document_type": "regulation",
      "status": "ساري",
      "has_other_parents": false,
      "other_parents": []
    }
  ],
  "judicial_rulings": [
    {
      "id": "jdg_101",
      "title": "حكم تمييز 101",
      "court": "تمييز حقوق",
      "status": "ساري",
      "note": "يظل سارياً كاجتهاد قضائي تاريخي"
    }
  ]
}
```

### هـ. تنفيذ الإلغاء والاسترجاع
- **Endpoint الإلغاء**: `POST /api/legal/{id}/repeal`
- **Payload**:
```json
{
  "repeal_reason": "صدور تشريع لاحق ناسخ",
  "repealed_by_document_id": "law_01_2026",
  "dependents_actions": [
    { "document_id": "reg_01", "action": "repeal" }
  ]
}
```
- **Endpoint الاسترجاع**: `POST /api/legal/{id}/restore`
- **Response**: `{ "status": "success", "message": "تم استرجاع المصدر القانوني بنجاح", "id": "law_34_2014" }`

---

## 4. المكونات المنفذة في المراحل الخمس (Implemented Features)

### المرحلة 1: إنشاء الارتباطات والمزامنة البيانية (Phase 1)
* جداول ونماذج `LegalRelation` و `LegalRelationAudit`.
* دعم الربط المتعدد (M:N) للأصل والتوابع.
* فحص وجود العقد مسبقاً في Neo4j قبل إنشاء الحواف.
* سكربت المطابقة والإصلاح `scripts/reconcile_legal_relations.py --fix`.

### المرحلة 2: نظام الإلغاء ثلاثي الخطوات (Phase 2 Repeal System)
* استبدال زر الحذف بزر تحذيري هادئ (`إلغاء القانون` / `إلغاء الحكم`).
* معالج إلغاء على 3 خطوات (`RepealLawModal.jsx`):
  1. `RepealStep1Preview.jsx`: سبب الإلغاء والقانون الناسخ.
  2. `RepealStep2Dependents.jsx`: تحديد قرارات التوابع مع عزل الأحكام القضائية.
  3. `RepealStep3Confirm.jsx`: تأكيد كتابي بكتابة اسم أو رقم القانون لمنع الأخطاء.
* نافذة استرجاع تفاعلية `RestoreLawModal.jsx`.

### المرحلة 3: البحث المخدمي في القوانين الأب (`ParentLawSelect.jsx`)
* بحث ديناميكي من الخادم مع Debounce مدته 300ms وميزة Load More.
* حفظ القوانين المختارة في حالة منفصلة كشارات قابلة للإزالة حتى لو اختفت من نتائج البحث.
* تمييز النسخ (نسخة أصلية vs نسخة وتعديلاته).
* أيقونات SVG بدون أي إيموجي.

### المرحلة 4: شاشة تعديل بيانات القانون والارتباطات (`KnowledgeEditModal.jsx`)
* قراءة الارتباطات الحالية من PostgreSQL بطلب واحد عبر `GET /api/legal/document-relations/{id}`.
* حساب الفروق (Diff) عند الحفظ:
  * جديد: يُضاف عبر `sync_relation` وينشئ حافة في Neo4j.
  * متغير: تُحدّث خصائصه في القاعدتين.
  * محذوف من الاختيار: لا يُحذف صفه، بل يُوسم بـ `is_active = False` وتُحذف الحافة في Neo4j وتُسجل في جدول التدقيق.
* إظهار حالة الوثيقة للقراءة فقط في التعديل مع توجيه صريح: *"للتعديل استخدم زر الإلغاء"*.

### المرحلة 5: قسم القراءة فقط لكافة ارتباطات القانون (`LawDependentsSummary.jsx`)
* عرض مختصر افتراضي بعدادات لكل مجموعة من المجموعات الثلاث:
  1. **ما صدر بموجبه**: الأنظمة، القرارات، التعليمات، القوانين، أحكام ملزمة، جداول، ملاحق.
  2. **ما أُلغي بموجبه**: نفس الأقسام مع تلميح صريح: `(وثائق ألغاها هذا القانون)`.
  3. **الارتباطات القضائية**: تمييز حقوق، تمييز جزاء، إلخ.
* دالة الـ Parser المستقلة [taxonomyParser.js](file:///d:/work/Consultation-platform/frontend/src/admin/components/knowledge/taxonomyParser.js):
  * توحد وتدمج مسميات الفئات مثل `"تعليمات"` و `"التعليمات"`.
  * تدعم فك الـ Envelope التلقائي (`res.data` أو الكائن المباشر).
* إخفاء أي قسم أو مجموعة عددها صفر، وإخفاء المكون كاملاً (`return null`) إن لم تكن هناك ارتباطات.
* يظهر للقوانين فقط ويختفي تلقائياً عند فتح الأحكام القضائية (`!isJudgment`).
* تفصيل قابل للطي للقراءة فقط مع عرض تدريجي (+ عرض المزيد) للفئات الكبيرة.

---

## 5. سلوك محرك البحث الذكي (RAG) والتعديل المستقبلي المقترح

1. **الوضع الفعلي الحالي**:
   - فلتر البحث في `services/ai/hybrid_search_service.py` يعتمد على `is_active != False`.
   - لذلك، فالوثائق الملغاة قانونياً تظل قابلة للاسترجاع ما لم يتم تعطيلها يدوياً بـ `is_active = False`.
   - هذا السلوك مقصود ومطلوب لخدمة الاستشارات الضريبية والقضائية التي تحكمها وقائع نشأت في ظل قوانين سابقة (كالتدقيق على سنوات ضريبية ماضية).
2. **التعديل المقترح للمرحلة التالية في RAG**:
   - **حقن وسم الحالة في سياق النموذج (Prompt Enrichment)**:
     `[المصدر: {title} | الحالة القانونية: ملغي بموجب {repealed_by} بتاريخ {repealed_at}]`
   - **توسيع حمولة Qdrant (Payload Enrichment)**: إضافة حقل `status` في نقاط المتجهات لتسهيل الفلترة المباشرة `include_repealed=false` عند رغبة المستخدم.

---

## 6. أوامر التشغيل والتحقق (Run Commands)

### تشغيل كافة اختبارات الـ Pytest (28 اختبار ناجح):
```bash
python -m pytest tests/test_document_relations_edit.py tests/test_parent_laws_search.py tests/test_legal_repeal_api.py tests/test_legal_repeal_service.py tests/test_legal_relations_phase1.py -v
```

### تشغيل اختبارات الواجهة المستقلة (Node Test Runner):
```bash
node --test frontend/test_taxonomy_parser.mjs
node --test frontend/test_fetch_parent_laws.mjs
```

### بناء الفرونت إند والتأكد من سلامة الحزم:
```bash
npm run build --prefix frontend
```

### تطبيق مايجريشن قاعدة البيانات:
```bash
python -m alembic upgrade head
```

### فحص ومطابقة بيانات PostgreSQL و Neo4j:
```bash
python scripts/reconcile_legal_relations.py --batch-size 200 --fix
```

---

## 7. فهرس الملفات المحدثة والجديدة (File Catalog)

| المسار | الحالة | الوصف |
| :--- | :--- | :--- |
| `models/ai/legal_relation.py` | جديد | نماذج `LegalRelation` و `LegalRelationAudit` مع دعم الحذف الناعم |
| `models/ai/legal_document_metadata.py` | جديد | نماذج `LegalDocumentMetadata` و `LegalRepealAudit` |
| `alembic/versions/9c8d7e6f5a4b_...` | جديد | مايجريشن إنشاء جدول العلاقات التشريعية والقضائية |
| `alembic/versions/a1b2c3d4e5f7_...` | جديد | مايجريشن إنشاء جدول الميتاداتا وسجل الإلغاء |
| `alembic/versions/c3d4e5f6a7b8_...` | جديد | مايجريشن إضافة أعمدة `is_active` و `unlinked` وسجل تدقيق العلاقات |
| `alembic/versions/f8b7c6d5e4a3_...` | جديد | مايجريشن توحيد التخصصات الثمانية وتصحيح معرّف Alembic |
| `routes/ai/legal_sources_routes.py` | معدل | إضافة مسارات الإلغاء، المعاينة، الاسترجاع، الارتباطات، وبحث القوانين الأب |
| `services/ai/legal_relation_service.py` | جديد | خدمة بناء الشجرة والمزامنة الموثوقة والمطابقة |
| `services/ai/legal_relation_edit_helper.py` | جديد | منطق حساب الفروق (Diff) وتحديث العلاقات عند التعديل |
| `services/ai/legal_relation_graph_sync.py` | جديد | مزامنة الحواف البيانية مع Neo4j بدون لمس العقد |
| `services/ai/legal_repeal_service.py` | جديد | خدمة المعاينة والتنفيذ الذري للإلغاء والاسترجاع |
| `services/ai/legal_repeal_helper.py` | جديد | معالجة الرسم البياني وتدقيق قرارات التوابع |
| `services/ai/legal_manual_helper.py` | معدل | مزامنة الارتباطات عند إنشاء قانون أو حكم يدوياً |
| `services/ai/legal_sources_service.py` | معدل | إثراء المصادر بالحالة من `legal_document_metadata` وحماية التعديل |
| `scripts/reconcile_legal_relations.py` | جديد | سكربت المطابقة الدفعي بين PostgreSQL و Neo4j |
| `scripts/run_pipeline.py` | معدل | حماية مسار `clear_database()` بمنع المسح التلقائي |
| `frontend/src/admin/components/knowledge/ParentLawSelect.jsx` | جديد | اختيار القوانين الأب مع بحث مخدمي وحفظ الشارات |
| `frontend/src/admin/components/knowledge/KnowledgeRelationSection.jsx` | جديد | قسم اختيار الارتباطات والتصنيف التشريعي والقضائي |
| `frontend/src/admin/components/knowledge/LawDependentsSummary.jsx` | جديد | ملخص القراءة فقط للارتباطات بمجموعاتها الثلاث |
| `frontend/src/admin/components/knowledge/taxonomyParser.js` | جديد | دالة معالجة شجرة الارتباطات وتوحيد المفاتيح |
| `frontend/src/admin/components/knowledge/RepealLawModal.jsx` | جديد | نافذة الإلغاء ثلاثية المراحل |
| `frontend/src/admin/components/knowledge/RepealStep1Preview.jsx` | جديد | الخطوة الأولى: المعاينة وتحديد السبب والناسخ |
| `frontend/src/admin/components/knowledge/RepealStep2Dependents.jsx` | جديد | الخطوة الثانية: خيارات التوابع وعزل الأحكام |
| `frontend/src/admin/components/knowledge/RepealStep3Confirm.jsx` | جديد | الخطوة الثالثة: التأكيد الكتابي |
| `frontend/src/admin/components/knowledge/RestoreLawModal.jsx` | جديد | نافذة استرجاع الوثيقة الملغاة |
| `frontend/src/admin/components/knowledge/KnowledgeEditModal.jsx` | معدل | دمج تعديل الارتباطات، والحذف الناعم، وملخص التوابع |
| `frontend/src/admin/components/knowledge/KnowledgeSourceList.jsx` | معدل | أزرار الإلغاء والاسترجاع وشارات الحالة |
| `frontend/src/admin/components/knowledge/knowledgeApi.js` | معدل | دوال استدعاء الـ APIs الجديدة وفك الـ Envelopes |
| `frontend/src/admin/components/knowledge/knowledgeData.js` | معدل | ثوابت وخيارات التصنيفات التشريعية والقضائية |
| `tests/test_document_relations_edit.py` | جديد | 7 اختبارات لتعديل الارتباطات والحذف الناعم |
| `tests/test_parent_laws_search.py` | جديد | 3 اختبارات للبحث المخدمي والـ pagination |
| `tests/test_legal_repeal_api.py` | جديد | 5 اختبارات لمسارات الإلغاء والاسترجاع ومنع الحذف |
| `tests/test_legal_repeal_service.py` | جديد | 7 اختبارات لخدمة الإلغاء وخيارات التوابع |
| `tests/test_legal_relations_phase1.py` | جديد | 6 اختبارات للمزامنة المزدوجة والمطابقة |
| `services/communication/admin_broadcast_service.py` | معدل | ربط فلاتر المستشارين المهنية والتخصصية في البث الإداري ودالة المعاينة والتحقق |
| `routes/communication/notification_routes.py` | معدل | إضافة endpoint المعاينة `/broadcasts/preview` ومنع الإرسال لـ 0 مستلمين |
| `frontend/src/admin/components/notifications/BroadcastModal.jsx` | معدل | إضافة شارة معاينة عدد المستلمين ومنع الإرسال عند 0 مستلم |
| `frontend/src/admin/components/notifications/broadcastApi.js` | معدل | إضافة استدعاء API المعاينة `previewBroadcastAudienceApi` |
| `frontend/src/admin/components/notifications/broadcastConstants.js` | معدل | إضافة خيار المستشار المستقل `independent_consultant` |
| `frontend/src/pages/ConsultantDashboard.jsx` | معدل | ربط التنبيهات الحقيقية والإشعارات والعدّادات الديناميكية من الـ API |
| `tests/test_consultant_broadcast_filters.py` | جديد | 9 اختبارات لاستهداف المستشارين، المعاينة، ومنع الإرسال غير الصالح |

---

## 8. نظام إشعارات وبث الإدارة وتنبيهات لوحة تحكم المستشار (Consultant Broadcast & Dashboard Alerts System)

### أ. البث الإداري الموجه للمستشارين (Backend Broadcast Targeting & Validation)
- **الملفات**: `services/communication/admin_broadcast_service.py` و `routes/communication/notification_routes.py`
- **آلية العمل**:
  - عند اختيار مجموعة المستهدفين `consultants`، يتم تطبيق فلاتر `consultant_filters` المهنية (`activity`) والتخصصية (`specialization`).
  - يتم الربط الداخلي الذكي مع جدول `consultant_profiles` وجدول `specializations`.
  - **التخصص الرئيسي فقط (`main_specialization_id`)**: التصفية التخصصية تطابق حصراً التخصص الرئيسي للمستشار في `consultant_profiles.main_specialization_id` ولا تمس بيانات الخدمات الفرعية أو الشهادات الإضافية.
  - **التحقق الصارم والرفض بـ 400**: أي قيمة نشاط مهني أو تخصص غير معروفة ترفض مباشرة بخطأ `400 Bad Request` مع رسالة عربية واضحة تفيد بعدم صلاحية القيمة بدلاً من تجاهلها بصمت.
  - دعم الأكواد الإنجليزية والأسماء العربية للمهن (`tax_consultant`, `auditor`, `chartered_accountant`, `legal_consultant`, `tax_expert`, `independent_consultant` وما يقابلها بالعربية: `مستشار ضريبي`, `مستشار ضريبي معتمد JCPA`, `مدقق حسابات`, `مستشار مستقل`).
  - دعم الأكواد الإنجليزية ومعرّفات التخصصات الثمانية الرسمية (1 إلى 8) وما يقابلها بالعربية (`ضريبي`, `ضريبة الدخل`, `ضريبة المبيعات`, `جمارك`, `مناطق حرة`, `تسعير تحويلي`, `قانوني`, `تدقيق ومراجعة`).
  - **مسار المعاينة وحظر الإرسال الصفري (Read-only Preview & Zero-Send Protection)**:
    - مسار قراءة فقط `POST /api/notifications/broadcasts/preview` يرجع عدد المستلمين المطابقين لحظياً.
    - مسار الإرسال `POST /api/notifications/admin-broadcast` يرفض بكود `400` في حال كان عدد المستلمين المطابقين للفلاتر المحددة صفراً لمنع إرسال إذاعات خالية أو بلا أثر.
  - منع أخطاء PostgreSQL مع حقول الـ JSON بعدم استخدام `DISTINCT` المباشر على كامل جدول المستخدمين والاعتماد على قيد الفردية `unique=True` لحقل `user_id` في جدول `consultant_profiles`.

### ب. واجهة الإدارة ولوحة تحكم المستشار (Frontend UI)
- **الملفات**: `BroadcastModal.jsx` و `ConsultantDashboard.jsx`
- **آلية العمل**:
  - **في BroadcastModal**: شارة ديناميكية حية تعرض عدد المستلمين المطابقين أثناء تغيير الفلاتر، مع تعطيل زر الإرسال تماماً (`disabled`) إذا كان العدد صفراً.
  - **في ConsultantDashboard**: استدعاء إشعارات المستشار الحقيقية من الخادم عبر `notificationService.getMyNotifications(token)` بدعم مباشر لشكلي الاستجابة (Array مباشر أو كائن يحتوي على `items`).
  - دمج تنبيهات المواعيد التي تتطلب إجراءً (بانتظار الموافقة، بانتظار الدفع، مؤكدة اليوم) مع إشعارات النظام وتنبيهات الإدارة الواردة.
  - إزالة كافة البيانات المصطنعة (Mock Data) والافتراضية (`def-1`, `def-2`).
  - تحويل جميع عدّادات وبطاقات المودال وشريط التنبيهات الجانبي إلى عدّادات ديناميكية 100% محسوبة من البيانات الحقيقية.
  - عند النقر على التنبيه: تحديث حالة الإشعار إلى مقروء في الخادم وفي الـ State المحلي فورياً، والتوجيه الذكي للمسار المعني عبر `notificationRouter.js`.

### ج. نتائج التحقق والاختبار (Verification Results)
- **اختبارات Pytest**:
  ```bash
  python -m pytest tests/test_consultant_broadcast_filters.py -v
  # 9 passed in 6.44s (100% Passing)
  ```
- **بناء الفرونت إند**:
  ```bash
  npm run build --prefix frontend
  # built in 1.48s (0 Errors, 0 Warnings)
  ```

---

## 8. توحيد وتطوير مودال "تنبيه المتأثرين" في إدارة المعرفة (KnowledgeBroadcastModal)

### أ. نظرة عامة والهدف
تحديث مودال تنبيه المتأثرين بالقوانين (`KnowledgeBroadcastModal.jsx`) المفتوح من جدول القوانين (`KnowledgeSourceList.jsx`) ليتطابق مع معايير وإمكانيات نظام الإذاعات المركزي (`BroadcastModal.jsx`) ولكن بتصميم مدمج ومختصر داخل المودال:
- توحيد منطق الإرسال والمعاينة عبر `services/communication/admin_broadcast_service.py` بدون أي تكرار للكود.
- التحقق الإلزامي من فلاتر المستشارين (النشاط والتخصص) في الباك إند، ورفض أي قيمة غير معروفة برمز HTTP 400.
- إضافة استدعاء معاينة حي لقراءة عدد المستلمين المتطابقين (`POST /api/notifications/broadcasts/preview`) قبل الإرسال.
- منع الإرسال تماماً برمز HTTP 400 عند وجود 0 مستلمين.
- تسجيل معرّف القانون المصدر واسمه داخل بيانات الإذاعة (`AdminBroadcast.user_filters`) وسجل الإشعار (`Notification.related_entity_id` / `related_entity_type="legal_source"`).

### ب. التعديلات المنفذة

#### 1. الباك إند:
- `services/communication/admin_broadcast_service.py` (< 200 سطر):
  - دعم دمج الفئات العامة (`audience: ["user", "consultant", "company"]`) مع فلاتر المستشارين المخصصة (`consultant_filters`).
  - دعم تسجيل `source_id` و `source_title` مع معالجة آمنة لـ UUID لعمود `related_entity_id`.
  - دالة `count_broadcast_recipients` لمعاينة عدد المستلمين دون إنشاء سجلات.
- `routes/communication/notification_routes.py` (< 200 سطر):
  - إضافة endpoint المعاينة للقراءة فقط: `POST /api/notifications/broadcasts/preview` (للأدمن فقط).
  - منع الإرسال عند مطابقة صفر مستخدمين بـ HTTP 400.
  - تخزين `source_id` و `source_title` في بيانات الإذاعة.

#### 2. الواجهة الأمامية:
- `frontend/src/admin/components/knowledge/KnowledgeBroadcastModal.jsx` (195 سطر، أقل من 200 سطر):
  - الإبقاء على التبويبين الافتراضيين ("إضافة جديدة" و"تعديل في القانون").
  - إظهار صف فلاتر مختصر للمستشارين (النشاط والتخصص عبر `ModernSelect`) فقط عند تحديد فئة "المستشارين" حصراً.
  - شريط معاينة ديناميكي حي: "سيصل الإشعار إلى X مستخدم مطابق" مع مؤشر تحميل.
  - تعطيل زر الإرسال عند كون العدد 0 أو أثناء التحميل/الإرسال.
  - عرض رسالة النجاح بعدد المستلمين الفعلي، وعرض رسائل الخطأ داخل المودال دون إغلاقه عند الفشل.
  - التزام كامل بهوية ديوان وألوانها (`#0D3C5C`, `#0A3C64`, `#F8FAFC`, `#E2E8F0`, `#E58A13`) وخلوه من أي إيموجي.
- `frontend/src/admin/components/knowledge/knowledgeApi.js`:
  - إضافة دالة `previewKnowledgeBroadcast` وتحديث `sendKnowledgeBroadcast` لتمرير الفلاتر والمعرّف المصدري.

### ج. الاختبارات والتحقق
- **اختبارات Pytest**:
  ```bash
  python -m pytest tests/test_knowledge_broadcast.py tests/test_consultant_broadcast_filters.py
  # 17 passed in 7.07s (100% Passing)
  ```
- **اختبارات Node (Pure Logic)**:
  ```bash
  node --test frontend/src/admin/components/knowledge/test_broadcast_payload.js
  # 4 passed (100% Passing)
  ```
- **بناء الفرونت إند**:
  ```bash
  npm run build --prefix frontend
  # built in 1.19s (0 Errors)
  ```


