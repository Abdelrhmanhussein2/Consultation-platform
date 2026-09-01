import React, { useState, useEffect, useRef } from 'react';
import './AdminUsersPage.css';
import { getAdminUsers } from '../services/adminApi';

// ══════════════════════════════════════════════════════════════════════════
// CANONICAL 60 CLIENTS DATASET
// ══════════════════════════════════════════════════════════════════════════
const CANONICAL_USERS = [
  {"id":1,"name":"شركة الأفق للحلول الرقمية","initial":"أ","legal":"شركة ذات مسؤولية محدودة","sector":"خدمات","activity":"تقنية واستشارات أعمال","status":"نشط","online":true,"plan":"باقة الأعمال","consult":18,"success":17,"video":11,"chat":7,"tickets":3,"usage":"مرتفع","created":60,"last":"منذ 6 دقائق","tax":"200123456","national":"200045678","reg":"47192","email":"finance@ofok.jo","phone":"+962 7 9000 2148","city":"عمّان","joined":"14 مايو 2026"},
  {"id":2,"name":"مؤسسة الريادة التجارية","initial":"ر","legal":"مؤسسة فردية","sector":"تجارة","activity":"تجارة وتوزيع","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":12,"success":11,"video":5,"chat":7,"tickets":1,"usage":"متوسط","created":59,"last":"منذ ساعتين","tax":"100846291","national":"—","reg":"31844","email":"owner@riyadah.jo","phone":"+962 7 9123 4078","city":"الزرقاء","joined":"02 يونيو 2026"},
  {"id":3,"name":"ليان محمود الخطيب","initial":"ل","legal":"فرد","sector":"خدمات","activity":"خدمات مهنية","status":"نشط","online":true,"plan":"الباقة الأساسية","consult":6,"success":6,"video":2,"chat":4,"tickets":0,"usage":"منخفض","created":58,"last":"الآن","tax":"—","national":"—","reg":"—","email":"layan.khatib@email.com","phone":"+962 7 9555 8210","city":"عمّان","joined":"18 يونيو 2026"},
  {"id":4,"name":"المتحدة للصناعات الدوائية","initial":"م","legal":"شركة مساهمة خاصة","sector":"صناعة","activity":"صناعات دوائية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":27,"success":25,"video":19,"chat":8,"tickets":4,"usage":"مرتفع","created":57,"last":"أمس، 4:20 م","tax":"200786554","national":"200098214","reg":"55891","email":"tax@unitedpharma.jo","phone":"+962 6 565 4420","city":"عمّان","joined":"03 مارس 2026"},
  {"id":5,"name":"جمعية خطوة للتنمية","initial":"خ","legal":"جمعية ومنظمة","sector":"خدمات","activity":"تنمية مجتمعية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":4,"success":4,"video":1,"chat":3,"tickets":2,"usage":"منخفض","created":56,"last":"منذ 18 يومًا","tax":"—","national":"—","reg":"JAS-9012","email":"admin@khotwa.org.jo","phone":"+962 7 9441 0923","city":"إربد","joined":"21 يناير 2026"},
  {"id":6,"name":"هيئة تطوير المشاريع","initial":"هـ","legal":"هيئة عامة","sector":"خدمات","activity":"تطوير ودعم المشاريع","status":"نشط","online":false,"plan":"باقة الأعمال","consult":21,"success":20,"video":14,"chat":7,"tickets":1,"usage":"متوسط","created":55,"last":"منذ 3 ساعات","tax":"GOV-2081","national":"G-10298","reg":"—","email":"tax@pda.gov.jo","phone":"+962 6 500 8122","city":"عمّان","joined":"11 فبراير 2026"},
  {"id":7,"name":"أحمد يوسف العجارمة","initial":"أ","legal":"فرد","sector":"خدمات","activity":"تعليم وتدريب","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":5,"success":3,"video":4,"chat":1,"tickets":4,"usage":"منخفض","created":54,"last":"الآن","tax":"—","national":"—","reg":"—","email":"account7@client7.jo","phone":"+962 7 97511 0287","city":"عمّان","joined":"01 يناير 2026"},
  {"id":8,"name":"مؤسسة الرواد","initial":"ا","legal":"مؤسسة فردية","sector":"صناعة","activity":"صناعات بلاستيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":6,"success":4,"video":3,"chat":3,"tickets":3,"usage":"متوسط","created":53,"last":"منذ 12 دقيقة","tax":"200013848","national":"—","reg":"31096","email":"account8@client8.jo","phone":"+962 7 98584 0328","city":"إربد","joined":"02 فبراير 2026"},
  {"id":9,"name":"شركة المشرق","initial":"ا","legal":"شركة ذات مسؤولية محدودة","sector":"زراعة","activity":"إنتاج زراعي","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":3,"success":3,"video":3,"chat":0,"tickets":5,"usage":"مرتفع","created":52,"last":"منذ ساعة","tax":"200015579","national":"200019341","reg":"31233","email":"account9@client9.jo","phone":"+962 7 99657 0369","city":"الزرقاء","joined":"03 مارس 2026"},
  {"id":10,"name":"شركة الأمان لـتوزيع مواد غذائية","initial":"ا","legal":"شركة تضامن","sector":"تجارة","activity":"توزيع مواد غذائية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":23,"success":23,"video":15,"chat":8,"tickets":2,"usage":"منخفض","created":51,"last":"أمس، 11:10 ص","tax":"200017310","national":"200021490","reg":"31370","email":"account10@client10.jo","phone":"+962 7 90730 0410","city":"العقبة","joined":"04 أبريل 2026"},
  {"id":11,"name":"شركة الصفوة","initial":"ا","legal":"شركة توصية بسيطة","sector":"مقاولات","activity":"تشطيبات ومقاولات","status":"نشط","online":false,"plan":"باقة الأعمال","consult":35,"success":32,"video":12,"chat":23,"tickets":3,"usage":"متوسط","created":50,"last":"منذ 3 أيام","tax":"200019041","national":"200023639","reg":"31507","email":"account11@client11.jo","phone":"+962 7 91803 0451","city":"السلط","joined":"05 مايو 2026"},
  {"id":12,"name":"شركة الرؤية","initial":"ا","legal":"شركة مساهمة عامة","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":15,"success":12,"video":13,"chat":2,"tickets":5,"usage":"مرتفع","created":49,"last":"منذ أسبوع","tax":"200020772","national":"200025788","reg":"31644","email":"account12@client12.jo","phone":"+962 7 92876 0492","city":"مادبا","joined":"06 يونيو 2026"},
  {"id":13,"name":"شركة المنار لـتشطيبات ومقاولات","initial":"ا","legal":"شركة مساهمة خاصة","sector":"مقاولات","activity":"تشطيبات ومقاولات","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":34,"success":33,"video":34,"chat":0,"tickets":5,"usage":"منخفض","created":48,"last":"الآن","tax":"200022503","national":"200027937","reg":"31781","email":"account13@client13.jo","phone":"+962 7 93949 0533","city":"جرش","joined":"07 يوليو 2026"},
  {"id":14,"name":"جامعة الواحة","initial":"ا","legal":"جامعة","sector":"خدمات","activity":"خدمات صحية","status":"غير نشط","online":false,"plan":"باقة الأعمال","consult":20,"success":18,"video":16,"chat":4,"tickets":1,"usage":"متوسط","created":47,"last":"منذ 12 دقيقة","tax":"200024234","national":"200030086","reg":"31918","email":"account14@client14.jo","phone":"+962 7 94022 0574","city":"الكرك","joined":"08 أغسطس 2026"},
  {"id":15,"name":"رائد فؤاد الحياري — باحث","initial":"ر","legal":"أكاديمي وباحث","sector":"صناعة","activity":"صناعات هندسية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":31,"success":30,"video":19,"chat":12,"tickets":2,"usage":"مرتفع","created":46,"last":"منذ ساعة","tax":"—","national":"—","reg":"—","email":"account15@client15.jo","phone":"+962 7 95095 0615","city":"عمّان","joined":"09 يناير 2026"},
  {"id":16,"name":"جمعية المستقبل لـتقنيات زراعية","initial":"ا","legal":"جمعية ومنظمة","sector":"زراعة","activity":"تقنيات زراعية","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":31,"success":28,"video":6,"chat":25,"tickets":5,"usage":"منخفض","created":45,"last":"أمس، 11:10 ص","tax":"200027696","national":"200034384","reg":"32192","email":"account16@client16.jo","phone":"+962 7 96168 0656","city":"إربد","joined":"10 فبراير 2026"},
  {"id":17,"name":"مديرية التميز","initial":"ا","legal":"جهة حكومية","sector":"صناعة","activity":"صناعات بلاستيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":9,"success":7,"video":2,"chat":7,"tickets":5,"usage":"متوسط","created":44,"last":"منذ 3 أيام","tax":"200029427","national":"200036533","reg":"—","email":"account17@client17.jo","phone":"+962 7 97241 0697","city":"الزرقاء","joined":"11 مارس 2026"},
  {"id":18,"name":"هيئة المدار","initial":"ا","legal":"هيئة عامة","sector":"زراعة","activity":"زراعة عضوية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":5,"success":2,"video":1,"chat":4,"tickets":3,"usage":"مرتفع","created":43,"last":"منذ أسبوع","tax":"200031158","national":"200038682","reg":"—","email":"account18@client18.jo","phone":"+962 7 98314 0738","city":"العقبة","joined":"12 أبريل 2026"},
  {"id":19,"name":"هيئة البركة لـاستيراد وتصدير","initial":"ا","legal":"هيئة خاصة","sector":"تجارة","activity":"استيراد وتصدير","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":30,"success":28,"video":29,"chat":1,"tickets":4,"usage":"منخفض","created":42,"last":"الآن","tax":"200032889","national":"200040831","reg":"32603","email":"account19@client19.jo","phone":"+962 7 99387 0779","city":"السلط","joined":"13 مايو 2026"},
  {"id":20,"name":"نور أحمد الشوابكة","initial":"ن","legal":"فرد","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":21,"success":20,"video":21,"chat":0,"tickets":2,"usage":"متوسط","created":41,"last":"منذ 12 دقيقة","tax":"—","national":"—","reg":"—","email":"account20@client20.jo","phone":"+962 7 90460 0820","city":"مادبا","joined":"14 يونيو 2026"},
  {"id":21,"name":"مؤسسة البنيان","initial":"ا","legal":"مؤسسة فردية","sector":"خدمات","activity":"استشارات إدارية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":2,"success":1,"video":1,"chat":1,"tickets":4,"usage":"مرتفع","created":40,"last":"منذ ساعة","tax":"200036351","national":"—","reg":"32877","email":"account21@client21.jo","phone":"+962 7 91533 0861","city":"جرش","joined":"15 يوليو 2026"},
  {"id":22,"name":"شركة الحقول لـمقاولات كهروميكانيكية","initial":"ا","legal":"شركة ذات مسؤولية محدودة","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":28,"success":27,"video":9,"chat":19,"tickets":0,"usage":"منخفض","created":39,"last":"أمس، 11:10 ص","tax":"200038082","national":"200047278","reg":"33014","email":"account22@client22.jo","phone":"+962 7 92606 0902","city":"الكرك","joined":"16 أغسطس 2026"},
  {"id":23,"name":"شركة السهل","initial":"ا","legal":"شركة تضامن","sector":"خدمات","activity":"استشارات إدارية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":3,"success":1,"video":0,"chat":3,"tickets":0,"usage":"متوسط","created":38,"last":"منذ 3 أيام","tax":"200039813","national":"200049427","reg":"33151","email":"account23@client23.jo","phone":"+962 7 93679 0943","city":"عمّان","joined":"17 يناير 2026"},
  {"id":24,"name":"شركة العزم","initial":"ا","legal":"شركة توصية بسيطة","sector":"صناعة","activity":"صناعة أثاث","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":4,"success":4,"video":4,"chat":0,"tickets":0,"usage":"مرتفع","created":37,"last":"منذ أسبوع","tax":"200041544","national":"200051576","reg":"33288","email":"account24@client24.jo","phone":"+962 7 94752 0984","city":"إربد","joined":"18 فبراير 2026"},
  {"id":25,"name":"شركة القمم لـتعبئة وتصدير المنتجات الزراعية","initial":"ا","legal":"شركة مساهمة عامة","sector":"زراعة","activity":"تعبئة وتصدير المنتجات الزراعية","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":12,"success":9,"video":5,"chat":7,"tickets":1,"usage":"منخفض","created":36,"last":"الآن","tax":"200043275","national":"200053725","reg":"33425","email":"account25@client25.jo","phone":"+962 7 95825 1025","city":"الزرقاء","joined":"19 مارس 2026"},
  {"id":26,"name":"شركة النهضة","initial":"ا","legal":"شركة مساهمة خاصة","sector":"تجارة","activity":"تجارة عامة","status":"غير نشط","online":false,"plan":"باقة الأعمال","consult":2,"success":0,"video":0,"chat":2,"tickets":2,"usage":"متوسط","created":35,"last":"منذ 12 دقيقة","tax":"200045006","national":"200055874","reg":"33562","email":"account26@client26.jo","phone":"+962 7 96898 1066","city":"العقبة","joined":"20 أبريل 2026"},
  {"id":27,"name":"جامعة البيان","initial":"ا","legal":"جامعة","sector":"زراعة","activity":"دواجن وثروة حيوانية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":2,"success":2,"video":0,"chat":2,"tickets":0,"usage":"مرتفع","created":34,"last":"منذ ساعة","tax":"200046737","national":"200058023","reg":"33699","email":"account27@client27.jo","phone":"+962 7 97971 1107","city":"السلط","joined":"21 مايو 2026"},
  {"id":28,"name":"سارة محمد الرواشدة — باحث","initial":"س","legal":"أكاديمي وباحث","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":3,"success":0,"video":1,"chat":2,"tickets":1,"usage":"منخفض","created":33,"last":"أمس، 11:10 ص","tax":"—","national":"—","reg":"—","email":"account28@client28.jo","phone":"+962 7 98044 1148","city":"مادبا","joined":"22 يونيو 2026"},
  {"id":29,"name":"جمعية الوفاق","initial":"ا","legal":"جمعية ومنظمة","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":35,"success":34,"video":21,"chat":14,"tickets":1,"usage":"متوسط","created":32,"last":"منذ 3 أيام","tax":"200050199","national":"200062321","reg":"33973","email":"account29@client29.jo","phone":"+962 7 99117 1189","city":"جرش","joined":"23 يوليو 2026"},
  {"id":30,"name":"مديرية الإبداع","initial":"ا","legal":"جهة حكومية","sector":"خدمات","activity":"استشارات إدارية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":8,"success":6,"video":5,"chat":3,"tickets":1,"usage":"مرتفع","created":31,"last":"منذ أسبوع","tax":"200051930","national":"200064470","reg":"—","email":"account30@client30.jo","phone":"+962 7 90190 1230","city":"الكرك","joined":"24 أغسطس 2026"},
  {"id":31,"name":"هيئة الريادة لـصناعات هندسية","initial":"ا","legal":"هيئة عامة","sector":"صناعة","activity":"صناعات هندسية","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":4,"success":2,"video":3,"chat":1,"tickets":2,"usage":"منخفض","created":30,"last":"الآن","tax":"200053661","national":"200066619","reg":"—","email":"account31@client31.jo","phone":"+962 7 91263 1271","city":"عمّان","joined":"25 يناير 2026"},
  {"id":32,"name":"هيئة الاستقرار","initial":"ا","legal":"هيئة خاصة","sector":"خدمات","activity":"تعليم وتدريب","status":"نشط","online":false,"plan":"باقة الأعمال","consult":11,"success":9,"video":6,"chat":5,"tickets":5,"usage":"متوسط","created":29,"last":"منذ 12 دقيقة","tax":"200055392","national":"200068768","reg":"34384","email":"account32@client32.jo","phone":"+962 7 92336 1312","city":"إربد","joined":"26 فبراير 2026"},
  {"id":33,"name":"خالد أمين الطراونة","initial":"خ","legal":"فرد","sector":"صناعة","activity":"صناعات غذائية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":28,"success":28,"video":12,"chat":16,"tickets":3,"usage":"مرتفع","created":28,"last":"منذ ساعة","tax":"—","national":"—","reg":"—","email":"account33@client33.jo","phone":"+962 7 93409 1353","city":"الزرقاء","joined":"27 مارس 2026"},
  {"id":34,"name":"مؤسسة العربية لـدواجن وثروة حيوانية","initial":"ا","legal":"مؤسسة فردية","sector":"زراعة","activity":"دواجن وثروة حيوانية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":2,"success":0,"video":1,"chat":1,"tickets":3,"usage":"منخفض","created":27,"last":"أمس، 11:10 ص","tax":"200058854","national":"—","reg":"34658","email":"account34@client34.jo","phone":"+962 7 94482 1394","city":"العقبة","joined":"01 أبريل 2026"},
  {"id":35,"name":"شركة المتكاملة","initial":"ا","legal":"شركة ذات مسؤولية محدودة","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":10,"success":9,"video":5,"chat":5,"tickets":4,"usage":"متوسط","created":26,"last":"منذ 3 أيام","tax":"200060585","national":"200075215","reg":"34795","email":"account35@client35.jo","phone":"+962 7 95555 1435","city":"السلط","joined":"02 مايو 2026"},
  {"id":36,"name":"شركة المتقدمة","initial":"ا","legal":"شركة تضامن","sector":"مقاولات","activity":"بنية تحتية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":26,"success":26,"video":10,"chat":16,"tickets":1,"usage":"مرتفع","created":25,"last":"منذ أسبوع","tax":"200062316","national":"200077364","reg":"34932","email":"account36@client36.jo","phone":"+962 7 96628 1476","city":"مادبا","joined":"03 يونيو 2026"},
  {"id":37,"name":"شركة النخبة لـاستيراد وتصدير","initial":"ا","legal":"شركة توصية بسيطة","sector":"تجارة","activity":"استيراد وتصدير","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":3,"success":0,"video":1,"chat":2,"tickets":4,"usage":"منخفض","created":24,"last":"الآن","tax":"200064047","national":"200079513","reg":"35069","email":"account37@client37.jo","phone":"+962 7 97701 1517","city":"جرش","joined":"04 يوليو 2026"},
  {"id":38,"name":"شركة الرواد","initial":"ا","legal":"شركة مساهمة عامة","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"غير نشط","online":false,"plan":"باقة الأعمال","consult":29,"success":28,"video":27,"chat":2,"tickets":5,"usage":"متوسط","created":23,"last":"منذ 12 دقيقة","tax":"200065778","national":"200081662","reg":"35206","email":"account38@client38.jo","phone":"+962 7 98774 1558","city":"الكرك","joined":"05 أغسطس 2026"},
  {"id":39,"name":"شركة المشرق","initial":"ا","legal":"شركة مساهمة خاصة","sector":"خدمات","activity":"تعليم وتدريب","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":22,"success":21,"video":5,"chat":17,"tickets":0,"usage":"مرتفع","created":22,"last":"منذ ساعة","tax":"200067509","national":"200083811","reg":"35343","email":"account39@client39.jo","phone":"+962 7 99847 1599","city":"عمّان","joined":"06 يناير 2026"},
  {"id":40,"name":"جامعة الأمان","initial":"ا","legal":"جامعة","sector":"صناعة","activity":"صناعات هندسية","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":4,"success":1,"video":2,"chat":2,"tickets":0,"usage":"منخفض","created":21,"last":"أمس، 11:10 ص","tax":"200069240","national":"200085960","reg":"35480","email":"account40@client40.jo","phone":"+962 7 90920 1640","city":"إربد","joined":"07 فبراير 2026"},
  {"id":41,"name":"يزن محمود الزعبي — باحث","initial":"ي","legal":"أكاديمي وباحث","sector":"زراعة","activity":"إنتاج زراعي","status":"نشط","online":false,"plan":"باقة الأعمال","consult":20,"success":19,"video":10,"chat":10,"tickets":1,"usage":"متوسط","created":20,"last":"منذ 3 أيام","tax":"—","national":"—","reg":"—","email":"account41@client41.jo","phone":"+962 7 91993 1681","city":"الزرقاء","joined":"08 مارس 2026"},
  {"id":42,"name":"جمعية الرؤية","initial":"ا","legal":"جمعية ومنظمة","sector":"صناعة","activity":"صناعات غذائية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":13,"success":12,"video":11,"chat":2,"tickets":1,"usage":"مرتفع","created":19,"last":"منذ أسبوع","tax":"200072702","national":"200090258","reg":"35754","email":"account42@client42.jo","phone":"+962 7 92066 1722","city":"العقبة","joined":"09 أبريل 2026"},
  {"id":43,"name":"مديرية المنار لـإنتاج زراعي","initial":"ا","legal":"جهة حكومية","sector":"زراعة","activity":"إنتاج زراعي","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":17,"success":15,"video":11,"chat":6,"tickets":0,"usage":"منخفض","created":18,"last":"الآن","tax":"200074433","national":"200092407","reg":"—","email":"account43@client43.jo","phone":"+962 7 93139 1763","city":"السلط","joined":"10 مايو 2026"},
  {"id":44,"name":"هيئة الواحة","initial":"ا","legal":"هيئة عامة","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":24,"success":23,"video":7,"chat":17,"tickets":3,"usage":"متوسط","created":17,"last":"منذ 12 دقيقة","tax":"200076164","national":"200094556","reg":"—","email":"account44@client44.jo","phone":"+962 7 94212 1804","city":"مادبا","joined":"11 يونيو 2026"},
  {"id":45,"name":"هيئة الشرق","initial":"ا","legal":"هيئة خاصة","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":17,"success":15,"video":17,"chat":0,"tickets":2,"usage":"مرتفع","created":16,"last":"منذ ساعة","tax":"200077895","national":"200096705","reg":"36165","email":"account45@client45.jo","phone":"+962 7 95285 1845","city":"جرش","joined":"12 يوليو 2026"},
  {"id":46,"name":"هبة جمال القضاة","initial":"ه","legal":"فرد","sector":"خدمات","activity":"خدمات قانونية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":26,"success":23,"video":9,"chat":17,"tickets":1,"usage":"منخفض","created":15,"last":"أمس، 11:10 ص","tax":"—","national":"—","reg":"—","email":"account46@client46.jo","phone":"+962 7 96358 1886","city":"الكرك","joined":"13 أغسطس 2026"},
  {"id":47,"name":"مؤسسة التميز","initial":"ا","legal":"مؤسسة فردية","sector":"مقاولات","activity":"مقاولات إنشائية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":11,"success":11,"video":10,"chat":1,"tickets":2,"usage":"متوسط","created":14,"last":"منذ 3 أيام","tax":"200081357","national":"—","reg":"36439","email":"account47@client47.jo","phone":"+962 7 97431 1927","city":"عمّان","joined":"14 يناير 2026"},
  {"id":48,"name":"شركة المدار","initial":"ا","legal":"شركة ذات مسؤولية محدودة","sector":"خدمات","activity":"استشارات إدارية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":7,"success":6,"video":3,"chat":4,"tickets":1,"usage":"مرتفع","created":13,"last":"منذ أسبوع","tax":"200083088","national":"200103152","reg":"36576","email":"account48@client48.jo","phone":"+962 7 98504 1968","city":"إربد","joined":"15 فبراير 2026"},
  {"id":49,"name":"شركة البركة لـصناعات غذائية","initial":"ا","legal":"شركة تضامن","sector":"صناعة","activity":"صناعات غذائية","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":18,"success":16,"video":10,"chat":8,"tickets":5,"usage":"منخفض","created":12,"last":"الآن","tax":"200084819","national":"200105301","reg":"36713","email":"account49@client49.jo","phone":"+962 7 99577 2009","city":"الزرقاء","joined":"16 مارس 2026"},
  {"id":50,"name":"شركة الإنجاز","initial":"ا","legal":"شركة توصية بسيطة","sector":"زراعة","activity":"إنتاج زراعي","status":"غير نشط","online":false,"plan":"باقة الأعمال","consult":19,"success":19,"video":10,"chat":9,"tickets":5,"usage":"متوسط","created":11,"last":"منذ 12 دقيقة","tax":"200086550","national":"200107450","reg":"36850","email":"account50@client50.jo","phone":"+962 7 90650 2050","city":"العقبة","joined":"17 أبريل 2026"},
  {"id":51,"name":"شركة البنيان","initial":"ا","legal":"شركة مساهمة عامة","sector":"تجارة","activity":"استيراد وتصدير","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":24,"success":24,"video":20,"chat":4,"tickets":5,"usage":"مرتفع","created":10,"last":"منذ ساعة","tax":"200088281","national":"200109599","reg":"36987","email":"account51@client51.jo","phone":"+962 7 91723 2091","city":"السلط","joined":"18 مايو 2026"},
  {"id":52,"name":"شركة الحقول لـزراعة عضوية","initial":"ا","legal":"شركة مساهمة خاصة","sector":"زراعة","activity":"زراعة عضوية","status":"نشط","online":true,"plan":"الباقة الاحترافية","consult":19,"success":19,"video":19,"chat":0,"tickets":5,"usage":"منخفض","created":9,"last":"أمس، 11:10 ص","tax":"200090012","national":"200111748","reg":"37124","email":"account52@client52.jo","phone":"+962 7 92796 2132","city":"مادبا","joined":"19 يونيو 2026"},
  {"id":53,"name":"جامعة السهل","initial":"ا","legal":"جامعة","sector":"تجارة","activity":"تجارة أجهزة ومعدات","status":"نشط","online":false,"plan":"باقة الأعمال","consult":23,"success":22,"video":16,"chat":7,"tickets":5,"usage":"متوسط","created":8,"last":"منذ 3 أيام","tax":"200091743","national":"200113897","reg":"37261","email":"account53@client53.jo","phone":"+962 7 93869 2173","city":"جرش","joined":"20 يوليو 2026"},
  {"id":54,"name":"ميساء علي البطاينة — باحث","initial":"م","legal":"أكاديمي وباحث","sector":"مقاولات","activity":"مقاولات كهروميكانيكية","status":"غير نشط","online":false,"plan":"الباقة الأساسية","consult":33,"success":33,"video":28,"chat":5,"tickets":1,"usage":"مرتفع","created":7,"last":"منذ أسبوع","tax":"—","national":"—","reg":"—","email":"account54@client54.jo","phone":"+962 7 94942 2214","city":"الكرك","joined":"21 أغسطس 2026"},
  {"id":55,"name":"جمعية القمم لـخدمات قانونية","initial":"ا","legal":"جمعية ومنظمة","sector":"خدمات","activity":"خدمات قانونية","status":"نشط","online":false,"plan":"الباقة الاحترافية","consult":14,"success":11,"video":11,"chat":3,"tickets":1,"usage":"منخفض","created":6,"last":"الآن","tax":"200095205","national":"200118195","reg":"37535","email":"account55@client55.jo","phone":"+962 7 95015 2255","city":"عمّان","joined":"22 يناير 2026"},
  {"id":56,"name":"مديرية النهضة","initial":"ا","legal":"جهة حكومية","sector":"صناعة","activity":"صناعات دوائية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":26,"success":23,"video":12,"chat":14,"tickets":4,"usage":"متوسط","created":5,"last":"منذ 12 دقيقة","tax":"200096936","national":"200120344","reg":"—","email":"account56@client56.jo","phone":"+962 7 96088 2296","city":"إربد","joined":"23 فبراير 2026"},
  {"id":57,"name":"هيئة البيان","initial":"ا","legal":"هيئة عامة","sector":"خدمات","activity":"تعليم وتدريب","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":4,"success":3,"video":1,"chat":3,"tickets":3,"usage":"مرتفع","created":4,"last":"منذ ساعة","tax":"200098667","national":"200122493","reg":"—","email":"account57@client57.jo","phone":"+962 7 97161 2337","city":"الزرقاء","joined":"24 مارس 2026"},
  {"id":58,"name":"هيئة الرسالة لـصناعات بلاستيكية","initial":"ا","legal":"هيئة خاصة","sector":"صناعة","activity":"صناعات بلاستيكية","status":"غير نشط","online":false,"plan":"الباقة الاحترافية","consult":21,"success":19,"video":16,"chat":5,"tickets":4,"usage":"منخفض","created":3,"last":"أمس، 11:10 ص","tax":"200100398","national":"200124642","reg":"37946","email":"account58@client58.jo","phone":"+962 7 98234 2378","city":"العقبة","joined":"25 أبريل 2026"},
  {"id":59,"name":"عمر خالد حداد","initial":"ع","legal":"فرد","sector":"زراعة","activity":"تعبئة وتصدير المنتجات الزراعية","status":"نشط","online":false,"plan":"باقة الأعمال","consult":17,"success":16,"video":7,"chat":10,"tickets":5,"usage":"متوسط","created":2,"last":"منذ 3 أيام","tax":"—","national":"—","reg":"—","email":"account59@client59.jo","phone":"+962 7 99307 2419","city":"السلط","joined":"26 مايو 2026"},
  {"id":60,"name":"مؤسسة الإبداع","initial":"ا","legal":"مؤسسة فردية","sector":"تجارة","activity":"توزيع مواد غذائية","status":"نشط","online":false,"plan":"الباقة الأساسية","consult":16,"success":15,"video":6,"chat":10,"tickets":3,"usage":"مرتفع","created":1,"last":"منذ أسبوع","tax":"200103860","national":"—","reg":"38220","email":"account60@client60.jo","phone":"+962 7 90380 2460","city":"مادبا","joined":"27 يونيو 2026"}
];

// ══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE TOPIC QUESTIONS DICTIONARY
// ══════════════════════════════════════════════════════════════════════════
const TOPIC_DATA = {
  'ضريبة الدخل': ['الإقرارات الضريبية السنوية', 'المصاريف المقبولة ضريبيًا', 'اقتطاعات الموظفين', 'الخسائر المدورة'],
  'ضريبة المبيعات': ['التسجيل في ضريبة المبيعات', 'الإعفاءات', 'رد الضريبة', 'فواتير المبيعات'],
  'الفوترة الإلكترونية': ['ربط نظام الفوترة', 'الفواتير المرتجعة', 'تصحيح الفاتورة', 'متطلبات رقم الفاتورة'],
  'الاعتراضات الضريبية': ['مدة الاعتراض', 'إجراءات التسوية', 'الوثائق المؤيدة', 'طلبات إعادة النظر']
};

const TOPIC_QUESTIONS = {
  'الإقرارات الضريبية السنوية': ['ما آخر موعد لتقديم الإقرار؟', 'كيف يتم تعديل إقرار سبق تقديمه؟', 'ما المستندات الواجب الاحتفاظ بها؟'],
  'المصاريف المقبولة ضريبيًا': ['هل مصاريف السفر مقبولة ضريبيًا؟', 'ما شروط قبول مصروف التسويق؟', 'كيف أوثق مصاريف السيارة؟', 'هل المخصصات تعتبر مصروفًا مقبولًا؟', 'ما معالجة المصاريف المدفوعة مقدمًا؟'],
  'اقتطاعات الموظفين': ['كيف يتم احتساب الاقتطاع الشهري؟', 'متى يتم توريد اقتطاعات الرواتب؟', 'كيف تعالج مكافآت الموظفين؟'],
  'الخسائر المدورة': ['كم سنة يمكن تدوير الخسائر؟', 'هل تنتقل الخسائر عند إعادة الهيكلة؟', 'ما المستندات المؤيدة للخسارة؟'],
  'التسجيل في ضريبة المبيعات': ['متى يصبح التسجيل إلزاميًا؟', 'كيف يحتسب حد التسجيل؟', 'هل يجوز التسجيل الاختياري؟'],
  'الإعفاءات': ['ما السلع والخدمات المعفاة؟', 'كيف أوثق معاملة معفاة؟', 'هل الإعفاء يشمل المدخلات؟'],
  'رد الضريبة': ['متى يحق طلب الرد؟', 'ما الوثائق المطلوبة لرد الضريبة؟', 'كم تستغرق إجراءات الرد؟'],
  'فواتير المبيعات': ['ما البيانات الإلزامية في الفاتورة؟', 'كيف تعالج فاتورة مرتجعة؟', 'ما الفرق بين الفاتورة الضريبية والمبسطة؟'],
  'ربط نظام الفوترة': ['ما متطلبات الربط؟', 'هل أحتاج API خاص؟', 'كيف أختبر الفواتير قبل الإرسال؟'],
  'الفواتير المرتجعة': ['كيف أصدر إشعار دائن؟', 'هل يلزم ربطه بالفاتورة الأصلية؟', 'ما أثر المرتجع على الضريبة؟'],
  'تصحيح الفاتورة': ['هل يجوز تعديل فاتورة بعد إصدارها؟', 'متى أستخدم إشعار دائن؟', 'كيف أوثق سبب التصحيح؟'],
  'متطلبات رقم الفاتورة': ['هل يجب أن يكون الرقم متسلسلًا؟', 'هل يمكن وجود أكثر من سلسلة؟', 'ماذا يحدث عند فقدان رقم؟'],
  'مدة الاعتراض': ['من أي تاريخ تبدأ مدة الاعتراض؟', 'ماذا يحدث إذا انتهت المدة؟', 'هل تقبل الأعذار؟'],
  'إجراءات التسوية': ['ما مراحل التسوية؟', 'من يملك صلاحية التوقيع؟', 'هل التسوية توقف إجراءات التحصيل؟'],
  'الوثائق المؤيدة': ['ما الوثائق الأساسية للاعتراض؟', 'هل تقبل النسخ الإلكترونية؟', 'كيف يتم ترتيب المرفقات؟'],
  'طلبات إعادة النظر': ['متى يمكن تقديم طلب إعادة نظر؟', 'ما الفرق عن الاعتراض؟', 'ما المدة المتوقعة للبت؟']
};

export default function AdminUsersPage({ navigate }) {
  // Master users list
  const [usersList, setUsersList] = useState(CANONICAL_USERS);
  const [filteredUsers, setFilteredUsers] = useState(CANONICAL_USERS);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [legalTopFilter, setLegalTopFilter] = useState('');
  const [sectorTopFilter, setSectorTopFilter] = useState('');
  const [statusTopFilter, setStatusTopFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('active');

  const [legalChecks, setLegalChecks] = useState([]);
  const [sectorChip, setSectorChip] = useState('');
  const [usageChecks, setUsageChecks] = useState([]);
  const [planChecks, setPlanChecks] = useState([]);

  // Profile overlay state
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState('overview');

  // Interactive Chart Tooltip State
  const [chartTooltip, setChartTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Modal Hierarchy Stack
  const [modalStack, setModalStack] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  const mainScrollRef = useRef(null);

  // Sync users with backend API on mount
  useEffect(() => {
    async function loadBackendUsers() {
      try {
        const data = await getAdminUsers();
        if (data && Array.isArray(data) && data.length > 0) {
          const mapLegal = (u) => {
            if (u.legal_form) {
              const map = {
                individual: 'فرد',
                sole_proprietorship: 'مؤسسة فردية',
                llc: 'شركة ذات مسؤولية محدودة',
                general_partnership: 'شركة تضامن',
                limited_partnership: 'شركة توصية بسيطة',
                public_joint_stock: 'شركة مساهمة عامة',
                private_joint_stock: 'شركة مساهمة خاصة',
                university: 'جامعة',
                researcher: 'أكاديمي وباحث',
                ngo: 'جمعية ومنظمة',
                government: 'جهة حكومية',
                public_authority: 'هيئة عامة',
                private_authority: 'هيئة خاصة'
              };
              if (map[u.legal_form]) return map[u.legal_form];
            }
            if (u.entity_type === 'company') return 'شركة ذات مسؤولية محدودة';
            if (u.entity_type === 'researcher') return 'أكاديمي وباحث';
            return 'فرد';
          };

          const mapSector = (u) => {
            const map = {
              services: 'خدمات',
              trade: 'تجارة',
              industry: 'صناعة',
              contracting: 'مقاولات',
              agriculture: 'زراعة'
            };
            return map[u.sector] || u.sector || 'خدمات';
          };

          // Merge API users with canonical data
          const apiFormatted = data.map((u, i) => ({
            id: u.id || `u_api_${i + 1}`,
            name: u.full_name || u.company_name || 'مستخدم المنصة',
            initial: (u.full_name || u.company_name || 'م').charAt(0),
            legal: mapLegal(u),
            sector: mapSector(u),
            activity: u.company_name || u.bio || 'خدمات مهنية واستشارات',
            status: u.is_active ? 'نشط' : 'غير نشط',
            online: !!u.is_active,
            plan: 'باقة الأعمال',
            consult: u.total_consultations || (i % 5) + 1,
            success: u.completed_consultations || (i % 5) + 1,
            video: Math.ceil(((u.total_consultations || 4) * 2) / 3),
            chat: Math.floor((u.total_consultations || 4) / 3),
            tickets: u.tickets_count || 1,
            usage: u.total_consultations > 10 ? 'مرتفع' : u.total_consultations > 3 ? 'متوسط' : 'منخفض',
            created: 100 - i,
            last: 'الآن',
            tax: u.tax_number || '200123456',
            national: u.national_id || '200045678',
            reg: '47192',
            email: u.email || 'user@diwan.jo',
            phone: u.phone || '+962 7 9000 0000',
            city: u.address || 'عمّان',
            joined: u.created_at ? new Date(u.created_at).toLocaleDateString('ar-JO') : '01 يناير 2026'
          }));
          const merged = [...apiFormatted, ...CANONICAL_USERS.slice(apiFormatted.length)];
          setUsersList(merged);
          setFilteredUsers(merged);
        }
      } catch (err) {
        console.warn('Backend users loaded fallback to rich dataset:', err);
      }
    }
    loadBackendUsers();
  }, []);

  // Filter Engine
  useEffect(() => {
    let q = searchInput.trim().toLowerCase();
    let data = usersList.filter(u => {
      const str = (u.name + (u.tax || '') + (u.national || '') + (u.reg || '') + (u.activity || '') + (u.email || '')).toLowerCase();
      const matchSearch = !q || str.includes(q);

      const matchLegalTop = !legalTopFilter || u.legal === legalTopFilter;
      const matchSectorTop = !sectorTopFilter || u.sector === sectorTopFilter;
      const matchStatusTop = !statusTopFilter || u.status === statusTopFilter;

      const matchLegalSide = legalChecks.length === 0 || legalChecks.some(pattern => {
        return pattern.split('|').some(part => u.legal.includes(part));
      });

      const matchSectorSide = !sectorChip || u.sector === sectorChip;
      const matchUsageSide = usageChecks.length === 0 || usageChecks.includes(u.usage);
      const matchPlanSide = planChecks.length === 0 || planChecks.includes(u.plan);

      return matchSearch && matchLegalTop && matchSectorTop && matchStatusTop && matchLegalSide && matchSectorSide && matchUsageSide && matchPlanSide;
    });

    data = [...data].sort((a, b) => {
      if (sortFilter === 'consult') return b.consult - a.consult;
      if (sortFilter === 'newest') return b.created - a.created;
      if (sortFilter === 'oldest') return a.created - b.created;
      if (sortFilter === 'name') return a.name.localeCompare(b.name, 'ar');
      return (Number(b.online) - Number(a.online)) || (b.consult - a.consult);
    });

    setFilteredUsers(data);
    setCurrentPage(1);
  }, [searchInput, legalTopFilter, sectorTopFilter, statusTopFilter, sortFilter, legalChecks, sectorChip, usageChecks, planChecks, usersList]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setLegalTopFilter('');
    setSectorTopFilter('');
    setStatusTopFilter('');
    setSortFilter('active');
    setLegalChecks([]);
    setSectorChip('');
    setUsageChecks([]);
    setPlanChecks([]);
    setCurrentPage(1);
    showToast('تم مسح جميع الفلاتر');
  };

  const handleLegalCheckbox = (val) => {
    setLegalChecks(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const handleUsageCheckbox = (val) => {
    setUsageChecks(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const handlePlanCheckbox = (val) => {
    setPlanChecks(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const displayedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Open Profile
  const openProfile = (user) => {
    setActiveProfile(user);
    setActiveProfileTab('overview');
    document.body.style.overflow = 'hidden';
  };

  const closeProfile = () => {
    setActiveProfile(null);
    setModalStack([]);
    document.body.style.overflow = '';
  };

  // Profile Scroll Tab Jump
  const scrollToSection = (secId) => {
    setActiveProfileTab(secId);
    if (!mainScrollRef.current) return;
    const target = document.getElementById(`sec_${secId}`);
    if (target) {
      const topOffset = secId === 'overview' ? 0 : target.offsetTop - mainScrollRef.current.offsetTop - 10;
      mainScrollRef.current.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  // Scroll spy
  const handleMainScroll = () => {
    if (!mainScrollRef.current) return;
    const scroller = mainScrollRef.current;
    const secIds = ['overview', 'legal', 'docs', 'members', 'interests', 'activity'];
    for (const id of secIds) {
      const el = document.getElementById(`sec_${id}`);
      if (el && scroller.scrollTop >= el.offsetTop - scroller.offsetTop - 50) {
        setActiveProfileTab(id);
      }
    }
  };

  // Modal Stack Helpers
  const openModal = (title, subtitle, body, wide = false, eyebrow = 'تفاصيل الحساب') => {
    setModalStack([{ title, subtitle, body, wide, eyebrow }]);
  };

  const pushModal = (title, subtitle, body, wide = false, eyebrow = 'تفاصيل إضافية') => {
    setModalStack(prev => [...prev, { title, subtitle, body, wide, eyebrow }]);
  };

  const modalGoBack = () => {
    setModalStack(prev => prev.length > 1 ? prev.slice(0, prev.length - 1) : []);
  };

  const closeModal = () => {
    setModalStack([]);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODAL DRILLDOWN CONTENT GENERATORS (100% PROTOTYPE SPEC)
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenLegalDetail = (type, u) => {
    const map = {
      national: ['الرقم الوطني للمنشأة', 'تفاصيل بيانات التعريف القانونية'],
      register: ['السجل التجاري', 'بيانات السجل التجاري والوثيقة المرفقة'],
      tax: ['التسجيل الضريبي', 'الرقم الضريبي وشهادة التسجيل']
    };
    const meta = map[type] || ['البيانات القانونية', 'بيانات المنشأة المعتمدة'];

    openModal(
      meta[0],
      meta[1],
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>الاسم</small><b>{u.name}</b></div>
          <div className="modal-box"><small>الصفة القانونية</small><b>{u.legal}</b></div>
          <div className="modal-box"><small>الرقم الوطني</small><b>{u.national}</b></div>
          <div className="modal-box"><small>السجل التجاري</small><b>{u.reg}</b></div>
          <div className="modal-box"><small>الرقم الضريبي</small><b>{u.tax}</b></div>
          <div className="modal-box"><small>حالة التحقق</small><b style={{ color: 'var(--admin-green)' }}>موثّق</b></div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenDocument(type === 'tax' ? 'شهادة التسجيل الضريبي' : 'السجل التجاري', u, type)}>
            عرض الوثيقة
          </button>
        </div>
      </div>,
      false,
      'البيانات القانونية'
    );
  };

  const handleOpenDocument = (docTitle, u, docType) => {
    openModal(
      docTitle,
      `وثيقة موثقة ضمن ملف ${u.name}`,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>نوع الوثيقة</small><b>{docTitle}</b></div>
          <div className="modal-box"><small>حالة التحقق</small><b style={{ color: 'var(--admin-green)' }}>موثّقة</b></div>
          <div className="modal-box"><small>آخر تحديث</small><b>14 مايو 2026</b></div>
          <div className="modal-box"><small>الملف</small><b>PDF · 1.8 MB</b></div>
        </div>
        <div style={{ marginTop: '16px', border: '1px dashed var(--admin-line)', borderRadius: '16px', padding: '28px', textAlign: 'center', background: '#F8FAFB', color: 'var(--admin-muted)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
          <b style={{ display: 'block', color: 'var(--admin-navy)', fontSize: '13px' }}>معاينة الوثيقة داخل المنصة</b>
          <small style={{ display: 'block', marginTop: '4px' }}>هذه معاينة نموذجية للوثيقة المرفقة.</small>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleDownloadDoc(docTitle, u.name)}>تنزيل الوثيقة</button>
          <button onClick={() => showToast('تم فتح المعاينة الكاملة')}>فتح المعاينة الكاملة</button>
        </div>
      </div>,
      true,
      'الوثائق والتحقق'
    );
  };

  const handleDownloadDoc = (title, clientName) => {
    const blob = new Blob([`${title}\n${clientName}\nنسخة نموذجية من الوثيقة ضمن Prototype ديوان.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('بدأ تنزيل الوثيقة');
  };

  const handleOpenMember = (name, email, role) => {
    openModal(
      name,
      `${role} · ${email}`,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>البريد الإلكتروني</small><b>{email}</b></div>
          <div className="modal-box"><small>الدور</small><b>{role}</b></div>
          <div className="modal-box"><small>آخر دخول</small><b>{name === 'محمد العلي' ? 'منذ 6 دقائق' : name === 'سارة الخطيب' ? 'أمس' : 'منذ 3 أيام'}</b></div>
          <div className="modal-box"><small>حالة الحساب</small><b style={{ color: 'var(--admin-green)' }}>نشط</b></div>
        </div>
        <div className="modal-section">
          <h4>الصلاحيات الفعلية — للعرض فقط</h4>
          <div className="permission-grid">
            {[
              { label: 'عرض الاستشارات', active: true },
              { label: 'حجز استشارة', active: true },
              { label: 'الفوترة والمدفوعات', active: role !== 'عرض فقط' },
              { label: 'إدارة المستخدمين', active: role === 'مدير الحساب' },
              { label: 'تحميل الوثائق', active: true },
              { label: 'تعديل بيانات المنشأة', active: role === 'مدير الحساب' }
            ].map((p, i) => (
              <div key={i} className="permission">
                <span>{p.label}</span>
                <b className={p.active ? 'perm-on' : 'perm-off'}>{p.active ? 'مفعلة' : 'غير مفعلة'}</b>
              </div>
            ))}
          </div>
        </div>
      </div>,
      false,
      'عضو الحساب'
    );
  };

  const handleOpenTopic = (topic) => {
    const subtopics = TOPIC_DATA[topic] || [];
    openModal(
      topic,
      'الموضوعات الفرعية واهتمامات العميل داخل هذا المجال',
      <div className="modal-list">
        {subtopics.map((sub, i) => {
          const qs = TOPIC_QUESTIONS[sub] || [];
          return (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenTopicDetail(topic, sub, i)}>
              <div className="mi">📄</div>
              <div>
                <b>{sub}</b>
                <small>{qs.length} عمليات بحث · {i + 1} استشارات مرتبطة</small>
              </div>
              <span className="tag">عرض السجل</span>
            </div>
          );
        })}
      </div>,
      true,
      'الاهتمامات'
    );
  };

  const handleOpenTopicDetail = (topic, subtopic, index) => {
    const qs = TOPIC_QUESTIONS[subtopic] || ['سؤال مسجل داخل هذا الموضوع'];
    pushModal(
      subtopic,
      `${topic} · سجل البحث والأسئلة`,
      <div className="modal-list">
        {qs.map((q, i) => (
          <div key={i} className="modal-row clickable" onClick={() => handleOpenQuestionRecord(subtopic, q, i)}>
            <div className="mi">{i + 1}</div>
            <div>
              <b>{q}</b>
              <small>{i % 2 ? 'بحث داخل قاعدة المعرفة' : 'سؤال للمساعد الذكي'} · {24 - i * 3} أغسطس 2026</small>
            </div>
            <span className="tag">فتح السجل</span>
          </div>
        ))}
      </div>,
      true,
      'سجل الاهتمامات'
    );
  };

  const handleOpenQuestionRecord = (subtopic, question, index) => {
    pushModal(
      'سجل السؤال',
      subtopic,
      <div>
        <div className="modal-section">
          <h4>{question}</h4>
          <p>تم تسجيل هذا الاستعلام ضمن نشاط الحساب، مع حفظ مصدر البحث والنتيجة التي تم فتحها والوقت المرتبط به.</p>
        </div>
        <div className="modal-grid" style={{ marginTop: '12px' }}>
          <div className="modal-box"><small>نوع النشاط</small><b>{index % 2 ? 'بحث في المنصة' : 'سؤال للمساعد الذكي'}</b></div>
          <div className="modal-box"><small>التاريخ</small><b>{24 - index * 3} أغسطس 2026</b></div>
          <div className="modal-box"><small>النتائج المفتوحة</small><b>{2 + index}</b></div>
          <div className="modal-box"><small>الاستشارة المرتبطة</small><b>{index % 2 ? 'لا يوجد' : 'ضريبة الدخل'}</b></div>
        </div>
      </div>,
      false,
      'تفاصيل السجل'
    );
  };

  const handleOpenConsultations = (u, type) => {
    const count = type === 'all' ? u.consult : type === 'success' ? u.success : type === 'video' ? u.video : u.chat;
    const label = { all: 'جميع الاستشارات', success: 'الاستشارات الناجحة', video: 'مكالمات الفيديو', chat: 'المحادثات' }[type] || 'الاستشارات';
    const topics = ['ضريبة الدخل', 'الفوترة الإلكترونية', 'الاعتراضات الضريبية', 'ضريبة المبيعات', 'الاقتطاعات الضريبية', 'التسجيل الضريبي'];

    openModal(
      label,
      `${count} سجلًا مرتبطًا بـ ${u.name}`,
      <div className="modal-list">
        {Array.from({ length: count }, (_, i) => {
          const isVideo = type === 'video' ? true : type === 'chat' ? false : (i % 2 === 0);
          const failed = type === 'all' && i === count - 1 && u.success < u.consult;
          return (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenSession(`${topics[i % topics.length]}`, `${28 - (i % 24)} أغسطس`)}>
              <div className="mi">{isVideo ? '📹' : '💬'}</div>
              <div>
                <b>{topics[i % topics.length]}</b>
                <small>{isVideo ? 'فيديو' : 'محادثة'} · {failed ? 'غير مكتملة' : 'مكتملة بنجاح'}</small>
              </div>
              <span className="tag" style={{ background: failed ? 'var(--admin-redSoft)' : '', color: failed ? 'var(--admin-red)' : '' }}>
                {failed ? 'غير مكتملة' : 'فتح'}
              </span>
            </div>
          );
        })}
      </div>,
      true,
      'الاستشارات'
    );
  };

  const handleOpenSession = (title, date) => {
    openModal(
      title,
      `${date} · نشاط مرتبط بحساب العميل`,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>الحالة</small><b style={{ color: 'var(--admin-green)' }}>مكتملة</b></div>
          <div className="modal-box"><small>المدة</small><b>42 دقيقة</b></div>
          <div className="modal-box"><small>المستشار</small><b>أحمد العواملة</b></div>
          <div className="modal-box"><small>الموضوع</small><b>الالتزامات الضريبية</b></div>
        </div>
        <div className="modal-section" style={{ marginTop: '12px' }}>
          <h4>ملخص الجلسة</h4>
          <p>
            تمت مناقشة الأسئلة الرئيسية للعميل، الوثائق المطلوبة، والخطوات العملية التالية. يمكن فتح الملخص الكامل والتوصيات من داخل هذه النافذة.
          </p>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenSessionSummary(title, date)}>عرض الملخص الكامل</button>
          <button onClick={() => handleOpenRecommendations(title)}>التوصيات</button>
          <button onClick={() => handleOpenConversation(title)}>سجل المحادثة</button>
        </div>
      </div>,
      false,
      'تفاصيل الحساب'
    );
  };

  const handleOpenSessionSummary = (title, date) => {
    pushModal(
      'ملخص الجلسة الكامل',
      `${title} · ${date}`,
      <div>
        <div className="modal-section">
          <h4>ملخص تنفيذي</h4>
          <p>ناقش العميل الالتزامات الضريبية المرتبطة بالنشاط، آلية التوثيق، والمواعيد التي يجب الالتزام بها. تم تحديد الوثائق الناقصة والخطوات العملية المطلوبة بعد الجلسة.</p>
        </div>
        <div className="modal-section">
          <h4>النقاط الرئيسية</h4>
          <div className="timeline">
            <div className="timeline-item"><b>تحديد المعالجة الضريبية</b><small>تم توضيح الأساس النظامي والخيار الأنسب للحالة.</small></div>
            <div className="timeline-item"><b>الوثائق المطلوبة</b><small>السجل التجاري، شهادة التسجيل الضريبي، ومستندات العملية ذات الصلة.</small></div>
            <div className="timeline-item"><b>الخطوة التالية</b><small>استكمال الوثائق ثم مراجعة التطبيق قبل الإقرار.</small></div>
          </div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenRecommendations(title)}>عرض التوصيات</button>
          <button onClick={() => handleOpenConversation(title)}>سجل المحادثة</button>
        </div>
      </div>,
      true,
      'الاستشارة'
    );
  };

  const handleOpenRecommendations = (title) => {
    pushModal(
      'التوصيات',
      title,
      <div className="modal-list">
        <div className="modal-row">
          <div className="mi">1</div>
          <div><b>استكمال المستندات الناقصة</b><small>أولوية مرتفعة · قبل الإجراء التالي</small></div>
          <span className="tag">مطلوب</span>
        </div>
        <div className="modal-row">
          <div className="mi">2</div>
          <div><b>مراجعة المعالجة الضريبية</b><small>التأكد من التطبيق على الفترات المفتوحة</small></div>
          <span className="tag">متابعة</span>
        </div>
        <div className="modal-row">
          <div className="mi">3</div>
          <div><b>حفظ نسخة من الرأي والملخص</b><small>ضمن ملفات الحساب للاستفادة منها مستقبلًا</small></div>
          <span className="tag">موصى به</span>
        </div>
      </div>,
      true,
      'مخرجات الاستشارة'
    );
  };

  const handleOpenConversation = (title) => {
    pushModal(
      'سجل المحادثة',
      title,
      <div>
        <div className="modal-section">
          <h4>المحادثة المرتبطة</h4>
          <div className="timeline">
            <div className="timeline-item"><b>العميل</b><small>أرسل تفاصيل الحالة والوثائق الأولية.</small></div>
            <div className="timeline-item"><b>المستشار</b><small>طلب توضيحًا حول تاريخ التسجيل وطبيعة المعاملة.</small></div>
            <div className="timeline-item"><b>العميل</b><small>أرفق المستند المطلوب وتم استكمال المناقشة.</small></div>
          </div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => showToast('تم تجهيز السجل للتصدير')}>تصدير السجل</button>
        </div>
      </div>,
      true,
      'المحادثات'
    );
  };

  const handleOpenPlanUsage = (u) => {
    openModal(
      'تفاصيل الباقة والاستهلاك',
      u.plan,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>استهلاك النقاط</small><b>680 / 1000</b></div>
          <div className="modal-box"><small>تحميل الوثائق</small><b>24 / 40</b></div>
          <div className="modal-box"><small>طباعة الوثائق</small><b>13 / 25</b></div>
          <div className="modal-box"><small>الجلسات المجانية</small><b>2 / 3</b></div>
          <div className="modal-box"><small>بداية الدورة</small><b>14 أغسطس 2026</b></div>
          <div className="modal-box"><small>التجديد</small><b>14 سبتمبر 2026</b></div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={handleOpenPlanDetails}>إدارة الباقة</button>
          <button onClick={handleOpenUsageHistory}>سجل الاستهلاك</button>
        </div>
      </div>,
      false,
      'الاشتراك'
    );
  };

  const handleOpenPlanDetails = () => {
    pushModal(
      'إدارة الباقة',
      'باقة الأعمال · الدورة الحالية',
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>نوع الباقة</small><b>أعمال</b></div>
          <div className="modal-box"><small>الدورة</small><b>شهرية</b></div>
          <div className="modal-box"><small>بداية الدورة</small><b>14 أغسطس 2026</b></div>
          <div className="modal-box"><small>التجديد</small><b>14 سبتمبر 2026</b></div>
        </div>
        <div className="modal-section">
          <h4>الحصص الحالية</h4>
          <table className="mini-table">
            <thead>
              <tr><th>البند</th><th>المستخدم</th><th>الإجمالي</th><th>المتبقي</th></tr>
            </thead>
            <tbody>
              <tr><td>النقاط</td><td>680</td><td>1000</td><td>320</td></tr>
              <tr><td>تحميل الوثائق</td><td>24</td><td>40</td><td>16</td></tr>
              <tr><td>طباعة الوثائق</td><td>13</td><td>25</td><td>12</td></tr>
              <tr><td>جلسات مجانية</td><td>2</td><td>3</td><td>1</td></tr>
            </tbody>
          </table>
        </div>
      </div>,
      true,
      'الاشتراك'
    );
  };

  const handleOpenUsageHistory = () => {
    pushModal(
      'سجل الاستهلاك',
      'العمليات المحتسبة خلال دورة الباقة الحالية',
      <div>
        <div className="detail-tabs">
          <button className="active">الكل</button>
          <button>النقاط</button>
          <button>التحميل</button>
          <button>الطباعة</button>
          <button>الجلسات المجانية</button>
        </div>
        <table className="mini-table">
          <thead>
            <tr><th>التاريخ</th><th>النوع</th><th>العملية</th><th>الاستهلاك</th></tr>
          </thead>
          <tbody>
            <tr><td>29 أغسطس</td><td>نقاط</td><td>سؤال ضريبي للمساعد</td><td>12 نقطة</td></tr>
            <tr><td>28 أغسطس</td><td>تحميل</td><td>تعليمات ضريبية PDF</td><td>1 تحميل</td></tr>
            <tr><td>27 أغسطس</td><td>طباعة</td><td>صفحتان من تشريع</td><td>2 طباعة</td></tr>
            <tr><td>25 أغسطس</td><td>جلسة مجانية</td><td>استشارة فيديو</td><td>1 جلسة</td></tr>
          </tbody>
        </table>
      </div>,
      true,
      'الاستهلاك'
    );
  };

  const handleOpenUsage = (title, value) => {
    const key = title.includes('النقاط') ? 'points' : title.includes('تحميل') ? 'download' : title.includes('طباعة') ? 'print' : 'free';
    openModal(
      title,
      'تفاصيل الاستخدام خلال دورة الباقة الحالية',
      <div>
        <div className="modal-box"><small>الاستهلاك الحالي</small><b>{value}</b></div>
        <div className="modal-list" style={{ marginTop: '12px' }}>
          <div className="modal-row clickable" onClick={() => handleOpenUsagePeriod(key, 'week', title)}>
            <div className="mi">⏱️</div>
            <div><b>هذا الأسبوع</b><small>آخر تحديث اليوم، 12:42 م</small></div>
            <span className="tag">عرض التفاصيل</span>
          </div>
          <div className="modal-row clickable" onClick={() => handleOpenUsagePeriod(key, 'all', title)}>
            <div className="mi">📄</div>
            <div><b>السجل الكامل</b><small>جميع العمليات المرتبطة بهذا النوع من الاستخدام</small></div>
            <span className="tag">فتح</span>
          </div>
        </div>
      </div>,
      false,
      'الاستهلاك'
    );
  };

  const handleOpenUsagePeriod = (key, period, title) => {
    const samples = {
      points: ['سؤال للمساعد الذكي — معالجة مصروف مهني', 'تحليل مادة تشريعية — ضريبة الدخل', 'إنشاء ملخص استشارة', 'بحث متقدم في التشريعات', 'مقارنة نصين تشريعيين'],
      download: ['قانون ضريبة الدخل رقم 34 لسنة 2014', 'تعليمات الفوترة الإلكترونية', 'ملخص استشارة 28 أغسطس', 'قرار لجنة الاعتراضات', 'دليل التسجيل الضريبي'],
      print: ['المادة 12 — قانون ضريبة الدخل', 'ملخص استشارة الفيديو', 'تقرير النشاط الشهري', 'مقتطف تشريعي — الإعفاءات', 'كشف الاستهلاك'],
      free: ['جلسة مع أحمد العواملة — ضريبة الدخل', 'جلسة مع رنا الخطيب — الفوترة الإلكترونية']
    };
    const arr = samples[key] || [];
    const rows = (period === 'week' ? arr.slice(0, 3) : arr);

    pushModal(
      period === 'week' ? `استخدام هذا الأسبوع — ${title}` : `السجل الكامل — ${title}`,
      `${rows.length} عمليات نموذجية`,
      <div className="modal-list">
        {rows.map((x, i) => (
          <div key={i} className="modal-row clickable" onClick={() => handleOpenUsageRecord(key, i, x)}>
            <div className="mi">{i + 1}</div>
            <div>
              <b>{x}</b>
              <small>{28 - i * 2} أغسطس 2026 · {key === 'points' ? `${35 + i * 10} نقطة` : key === 'free' ? '45 دقيقة' : 'عملية مكتملة'}</small>
            </div>
            <span className="tag">تفاصيل</span>
          </div>
        ))}
      </div>,
      true,
      'الاستهلاك'
    );
  };

  const handleOpenUsageRecord = (key, index, title) => {
    pushModal(
      title,
      'تفاصيل عملية الاستخدام',
      <div className="modal-grid">
        <div className="modal-box"><small>التاريخ والوقت</small><b>{28 - index * 2} أغسطس 2026 · 10:{20 + index * 7}</b></div>
        <div className="modal-box"><small>النوع</small><b>{key === 'points' ? 'استهلاك نقاط' : key === 'download' ? 'تحميل وثيقة' : key === 'print' ? 'طباعة وثيقة' : 'جلسة مجانية'}</b></div>
        <div className="modal-box"><small>المنفذ</small><b>محمد العلي</b></div>
        <div className="modal-box"><small>الحالة</small><b style={{ color: 'var(--admin-green)' }}>مكتملة</b></div>
      </div>,
      false,
      'سجل العملية'
    );
  };

  const handleOpenChartMonth = (month, count) => {
    openModal(
      `نشاط ${month}`,
      `${count} جلسات / نشاطات مسجلة`,
      <div className="modal-list">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <div key={i} className="modal-row clickable" onClick={() => handleOpenSession(`جلسة ${i + 1} — ${i % 2 ? 'الفوترة الإلكترونية' : 'ضريبة الدخل'}`, `${month}`)}>
            <div className="mi">{i % 2 ? '💬' : '📹'}</div>
            <div>
              <b>{i % 2 ? 'محادثة استشارية' : 'جلسة فيديو'} — {i % 2 ? 'الفوترة الإلكترونية' : 'ضريبة الدخل'}</b>
              <small>مكتملة · {35 + i * 4} دقيقة</small>
            </div>
            <span className="tag">فتح</span>
          </div>
        ))}
      </div>,
      true,
      'النشاط الشهري'
    );
  };

  const handleOpenTickets = (u) => {
    const n = Math.max(0, u.tickets);
    const titles = ['مشكلة فاتورة', 'تحديث بيانات', 'استفسار عن الباقة', 'مشكلة تحميل وثيقة', 'استفسار عن جلسة'];
    openModal(
      'تذاكر الدعم',
      `${n} تذاكر مرتبطة بالحساب`,
      n > 0 ? (
        <div className="modal-list">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenTicketDetail(`#SUP-${1082 - i * 7}`, titles[i % titles.length], i === 0 ? 'قيد المتابعة' : 'مغلقة')}>
              <div className="mi">💬</div>
              <div>
                <b>#SUP-${1082 - i * 7} · {titles[i % titles.length]}</b>
                <small>آخر تحديث {i === 0 ? 'اليوم' : `${20 - i} أغسطس`}</small>
              </div>
              <span className="tag" style={{ background: i === 0 ? '' : 'var(--admin-greenSoft)', color: i === 0 ? '' : 'var(--admin-green)' }}>
                {i === 0 ? 'قيد المتابعة' : 'مغلقة'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="modal-section"><p>لا توجد تذاكر دعم مسجلة لهذا الحساب.</p></div>
      ),
      true,
      'الدعم الفني'
    );
  };

  const handleOpenTicketDetail = (id, title, status) => {
    openModal(
      `${id} · ${title}`,
      status,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>الحالة</small><b>{status}</b></div>
          <div className="modal-box"><small>الأولوية</small><b>متوسطة</b></div>
          <div className="modal-box"><small>تاريخ الفتح</small><b>26 أغسطس 2026</b></div>
          <div className="modal-box"><small>المسؤول</small><b>فريق دعم ديوان</b></div>
        </div>
        <div className="modal-section" style={{ marginTop: '14px' }}>
          <p>تفاصيل التذكرة والمراسلات والإجراءات المتخذة تظهر هنا داخل المنصة، دون الانتقال إلى صفحة خارجية.</p>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenTicketConversation(id)}>عرض المراسلات</button>
        </div>
      </div>,
      false,
      'الدعم الفني'
    );
  };

  const handleOpenTicketConversation = (id) => {
    pushModal(
      'مراسلات التذكرة',
      id,
      <div>
        <div className="timeline">
          <div className="timeline-item"><b>العميل · 26 أغسطس 09:18 ص</b><small>أواجه اختلافًا في قيمة الفاتورة الظاهرة في الحساب.</small></div>
          <div className="timeline-item"><b>الدعم · 26 أغسطس 10:02 ص</b><small>تم استلام الطلب والتحقق من تفاصيل الدفع.</small></div>
          <div className="timeline-item"><b>الدعم · اليوم 11:35 ص</b><small>التذكرة قيد المتابعة مع الفريق المالي.</small></div>
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => showToast('تمت إضافة رد تجريبي')}>إضافة رد</button>
        </div>
      </div>,
      true,
      'الدعم الفني'
    );
  };

  const handleOpenRatings = () => {
    openModal(
      'تقييم العميل للمنصة',
      'متوسط 4.8 من 5 عبر 6 تقييمات',
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>متوسط التقييم</small><b>4.8 / 5</b></div>
          <div className="modal-box"><small>عدد التقييمات</small><b>6</b></div>
        </div>
        <div className="modal-list" style={{ marginTop: '14px' }}>
          <div className="modal-row">
            <div className="mi">★</div>
            <div><b>5 / 5 — تجربة الاستشارة</b><small>“الخدمة واضحة وسريعة.”</small></div>
            <span className="tag">28 أغسطس</span>
          </div>
          <div className="modal-row">
            <div className="mi">★</div>
            <div><b>4 / 5 — تجربة المنصة</b><small>“سهولة جيدة في الوصول للوثائق.”</small></div>
            <span className="tag">19 أغسطس</span>
          </div>
        </div>
      </div>,
      false,
      'التقييمات'
    );
  };

  const handleOpenMembersSummary = () => {
    const members = [
      ['محمد العلي', 'm.ali@client.jo', 'مدير الحساب'],
      ['سارة الخطيب', 's.khatib@client.jo', 'استشارات وفوترة'],
      ['عمر النجار', 'o.najjar@client.jo', 'عرض فقط']
    ];
    openModal(
      'أعضاء الحساب',
      '3 مستخدمين مرتبطين بالحساب',
      <div>
        <div className="modal-list">
          {members.map((m, i) => (
            <div key={i} className="modal-row clickable" onClick={() => handleOpenMember(m[0], m[1], m[2])}>
              <div className="mi">{m[0].split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div><b>{m[0]}</b><small>{m[1]} · {m[2]}</small></div>
              <span className="tag">عرض</span>
            </div>
          ))}
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => { closeModal(); scrollToSection('members'); }}>
            الانتقال إلى المستخدمين والصلاحيات
          </button>
        </div>
      </div>,
      true,
      'أعضاء الحساب'
    );
  };

  const handleOpenLastSeen = (u) => {
    openModal(
      'تفاصيل آخر ظهور',
      u.last,
      <div className="modal-grid">
        <div className="modal-box"><small>آخر تسجيل دخول</small><b>{u.last}</b></div>
        <div className="modal-box"><small>الجهاز</small><b>Windows · Chrome</b></div>
        <div className="modal-box"><small>الموقع التقريبي</small><b>عمّان، الأردن</b></div>
        <div className="modal-box"><small>حالة الجلسة</small><b style={{ color: 'var(--admin-green)' }}>{u.online ? 'متصل الآن' : 'غير متصل'}</b></div>
      </div>,
      false,
      'تفاصيل الدخول'
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN ACTIONS (100% PROTOTYPE MATCH)
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenAdminAction = (type, u) => {
    if (type === 'account') {
      openModal(
        'إدارة الحساب',
        u.name,
        <div>
          <div className="modal-section">
            <h4>لوحة إدارة الحساب</h4>
            <p>جميع إعدادات الحساب متاحة من هنا داخل المنصة.</p>
          </div>
          <div className="drill-modal-actions">
            <button className="primary" onClick={() => handleOpenAccountManagement(u)}>فتح الإدارة الكاملة</button>
          </div>
        </div>,
        true,
        'إدارة المستخدم'
      );
    } else if (type === 'audit') {
      openModal(
        'سجل النشاط',
        'السجل الإداري الكامل',
        <div className="drill-modal-actions">
          <button className="primary" onClick={handleOpenAuditLog}>فتح سجل النشاط</button>
        </div>,
        true,
        'Audit Log'
      );
    } else if (type === 'permissions') {
      openModal(
        'الصلاحيات',
        'صلاحيات أعضاء الحساب',
        <div className="drill-modal-actions">
          <button className="primary" onClick={handleOpenAllPermissions}>عرض جميع الأعضاء والصلاحيات</button>
        </div>,
        true,
        'الصلاحيات'
      );
    } else if (type === 'message') {
      openModal(
        'مراسلة العميل',
        u.name,
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => handleOpenMessageComposer(u)}>إنشاء رسالة داخلية</button>
        </div>,
        true,
        'المراسلات'
      );
    }
  };

  const handleOpenAccountManagement = (u) => {
    pushModal(
      'إدارة الحساب',
      u.name,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>حالة الحساب</small><b style={{ color: 'var(--admin-green)' }}>نشط</b></div>
          <div className="modal-box"><small>التحقق</small><b>موثّق</b></div>
          <div className="modal-box"><small>الباقة</small><b>{u.plan}</b></div>
          <div className="modal-box"><small>آخر ظهور</small><b>{u.last}</b></div>
        </div>
        <div className="modal-section">
          <h4>إجراءات الحساب</h4>
          <div className="modal-list">
            <div className="modal-row clickable" onClick={handleOpenPlanDetails}>
              <div className="mi">$</div>
              <div><b>إدارة الاشتراك والباقة</b><small>عرض الدورة والحصص والاستهلاك</small></div>
              <span className="tag">فتح</span>
            </div>
            <div className="modal-row clickable" onClick={() => pushModal('بيانات الحساب', 'تعديل البيانات الأساسية', (
              <div className="modal-grid">
                <div className="modal-box"><small>الاسم</small><b>{u.name}</b></div>
                <div className="modal-box"><small>الحالة</small><b>{u.status}</b></div>
              </div>
            ), true, 'تعديل الحساب')}>
              <div className="mi">✎</div>
              <div><b>البيانات الأساسية</b><small>الاسم، الحالة، معلومات التواصل</small></div>
              <span className="tag">تعديل</span>
            </div>
          </div>
        </div>
      </div>,
      true,
      'إدارة المستخدم'
    );
  };

  const handleOpenAuditLog = () => {
    pushModal(
      'سجل النشاط',
      'التغييرات والإجراءات الإدارية على الحساب',
      <div className="timeline">
        <div className="timeline-item"><b>تعديل صلاحيات سارة الخطيب</b><small>29 أغسطس 2026 · بواسطة مدير الحساب</small></div>
        <div className="timeline-item"><b>تحديث شهادة التسجيل الضريبي</b><small>22 أغسطس 2026 · بواسطة محمد العلي</small></div>
        <div className="timeline-item"><b>ترقية الباقة إلى أعمال</b><small>14 أغسطس 2026 · بواسطة مدير المنصة</small></div>
        <div className="timeline-item"><b>إضافة عمر النجار للحساب</b><small>07 أغسطس 2026 · بواسطة مدير الحساب</small></div>
      </div>,
      true,
      'Audit Log'
    );
  };

  const handleOpenAllPermissions = () => {
    pushModal(
      'صلاحيات أعضاء الحساب',
      'إجمالي 3 أعضاء',
      <div className="modal-list">
        <div className="modal-row clickable" onClick={() => handleOpenMember('محمد العلي', 'm.ali@client.jo', 'مدير الحساب')}>
          <div className="mi">م ع</div>
          <div><b>محمد العلي</b><small>مدير الحساب · صلاحيات كاملة</small></div>
          <span className="tag">عرض</span>
        </div>
        <div className="modal-row clickable" onClick={() => handleOpenMember('سارة الخطيب', 's.khatib@client.jo', 'استشارات وفوترة')}>
          <div className="mi">س خ</div>
          <div><b>سارة الخطيب</b><small>استشارات وفوترة</small></div>
          <span className="tag">عرض</span>
        </div>
        <div className="modal-row clickable" onClick={() => handleOpenMember('عمر النجار', 'o.najjar@client.jo', 'عرض فقط')}>
          <div className="mi">ع ن</div>
          <div><b>عمر النجار</b><small>عرض فقط</small></div>
          <span className="tag">عرض</span>
        </div>
      </div>,
      true,
      'الصلاحيات'
    );
  };

  const handleOpenMessageComposer = (u) => {
    pushModal(
      'مراسلة العميل',
      u.name,
      <div>
        <div className="modal-grid">
          <div className="modal-box"><small>إلى</small><b>{u.name}</b></div>
          <div className="modal-box"><small>القناة</small><b>رسالة داخل المنصة</b></div>
        </div>
        <div className="modal-section">
          <h4>الرسالة</h4>
          <textarea
            style={{ width: '100%', minHeight: '150px', border: '1px solid var(--admin-line)', borderRadius: '14px', padding: '13px', resize: 'vertical', outline: 0, fontFamily: 'inherit', fontSize: '13px' }}
            placeholder="اكتب رسالتك للعميل..."
          />
        </div>
        <div className="drill-modal-actions">
          <button className="primary" onClick={() => showToast('تم إرسال الرسالة داخليًا')}>إرسال</button>
          <button onClick={() => showToast('تم حفظ المسودة')}>حفظ كمسودة</button>
        </div>
      </div>,
      true,
      'المراسلات'
    );
  };

  return (
    <div className="users-page-root">
      
      {/* ══════════════════════════════════════════════════════════════════
          HERO HEADER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="users-hero">
        <div>
          <h1>المستخدمون <em>والعملاء</em></h1>
        </div>
        <p>
          ملف موحّد لفهم العميل، صفته القانونية، قطاعه، نشاطه على المنصة، استهلاك الباقة، الاستشارات، أعضاء الحساب وسجل التفاعل.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TOP SEARCHBAR & QUICK FILTERS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="users-searchbar">
        <div className="users-search-input">
          <svg className="icon" style={{ width: 18, height: 18, fill: 'none', stroke: '#0B2E4B', strokeWidth: 1.8 }} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="ابحث بالاسم، الرقم الوطني، الرقم الضريبي أو البريد..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="users-top-filter">
          <select value={legalTopFilter} onChange={(e) => setLegalTopFilter(e.target.value)}>
            <option value="">الصفة القانونية</option>
            <option value="فرد">فرد</option>
            <option value="مؤسسة فردية">مؤسسة فردية</option>
            <option value="شركة ذات مسؤولية محدودة">شركة ذات مسؤولية محدودة</option>
            <option value="شركة تضامن">شركة تضامن</option>
            <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
            <option value="شركة مساهمة عامة">شركة مساهمة عامة</option>
            <option value="شركة مساهمة خاصة">شركة مساهمة خاصة</option>
            <option value="جامعة">جامعة</option>
            <option value="أكاديمي وباحث">أكاديمي وباحث</option>
            <option value="جمعية ومنظمة">جمعية ومنظمة</option>
            <option value="جهة حكومية">جهة حكومية</option>
            <option value="هيئة عامة">هيئة عامة</option>
            <option value="هيئة خاصة">هيئة خاصة</option>
          </select>
        </div>

        <div className="users-top-filter">
          <select value={sectorTopFilter} onChange={(e) => setSectorTopFilter(e.target.value)}>
            <option value="">القطاع</option>
            <option value="خدمات">خدمات</option>
            <option value="تجارة">تجارة</option>
            <option value="صناعة">صناعة</option>
            <option value="مقاولات">مقاولات</option>
            <option value="زراعة">زراعة</option>
          </select>
        </div>

        <div className="users-top-filter">
          <select value={statusTopFilter} onChange={(e) => setStatusTopFilter(e.target.value)}>
            <option value="">حالة الحساب</option>
            <option value="نشط">نشط</option>
            <option value="غير نشط">غير نشط</option>
          </select>
        </div>

        <button className="users-search-btn" onClick={() => showToast(`تم العثور على ${filteredUsers.length} نتيجة`)}>
          بحث المستخدمين
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT WITH SIDEBAR FILTERS AND CARDS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="users-content">
        
        {/* Sticky Filters Sidebar */}
        <aside className="users-filters">
          <div className="users-filter-head">
            <h2>التصفية</h2>
            <button className="users-clear-btn" onClick={handleClearFilters}>
              مسح الكل
            </button>
          </div>

          {/* Legal Form Checks */}
          <div className="users-filter-group">
            <div className="users-filter-label">الصفة القانونية</div>
            <div className="users-checks">
              {[
                { label: 'أفراد', val: 'فرد' },
                { label: 'مؤسسة فردية', val: 'مؤسسة فردية' },
                { label: 'ذات مسؤولية محدودة', val: 'شركة ذات مسؤولية محدودة' },
                { label: 'تضامن / توصية بسيطة', val: 'تضامن|توصية' },
                { label: 'مساهمة عامة / خاصة', val: 'مساهمة' },
                { label: 'جامعات / أكاديميون / باحثون', val: 'جامعة|أكاديمي|باحث' },
                { label: 'جمعيات ومنظمات', val: 'جمعية|منظمة' },
                { label: 'حكومي / هيئات', val: 'حكومي|هيئة' }
              ].map((item, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={legalChecks.includes(item.val)}
                    onChange={() => handleLegalCheckbox(item.val)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sector Chips */}
          <div className="users-filter-group">
            <div className="users-filter-label">القطاع</div>
            <div className="users-chips">
              {[
                { label: 'الكل', val: '' },
                { label: 'خدمات', val: 'خدمات' },
                { label: 'تجارة', val: 'تجارة' },
                { label: 'صناعة', val: 'صناعة' },
                { label: 'مقاولات', val: 'مقاولات' },
                { label: 'زراعة', val: 'زراعة' }
              ].map((chip, i) => (
                <button
                  key={i}
                  className={`users-chip ${sectorChip === chip.val ? 'active' : ''}`}
                  onClick={() => setSectorChip(chip.val)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Usage Level Checks */}
          <div className="users-filter-group">
            <div className="users-filter-label">مستوى الاستخدام</div>
            <div className="users-checks">
              {['مرتفع', 'متوسط', 'منخفض', 'لم يستخدم بعد'].map((uLevel, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={usageChecks.includes(uLevel)}
                    onChange={() => handleUsageCheckbox(uLevel)}
                  />
                  <span>{uLevel}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Plan Checks */}
          <div className="users-filter-group">
            <div className="users-filter-label">الباقة</div>
            <div className="users-checks">
              {['باقة الأعمال', 'الباقة الاحترافية', 'الباقة الأساسية'].map((plan, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={planChecks.includes(plan)}
                    onChange={() => handlePlanCheckbox(plan)}
                  />
                  <span>{plan}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Main Area */}
        <main>
          <div className="users-results-tools">
            <div className="users-count">
              <b>{filteredUsers.length}</b> مستخدمين
            </div>
            <div className="users-toolset">
              <div className="users-sort">
                <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
                  <option value="active">الأكثر نشاطًا</option>
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="consult">الأكثر استشارات</option>
                  <option value="name">الاسم أ–ي</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Cards Grid */}
          {displayedUsers.length > 0 ? (
            <div className="users-cards-grid">
              {displayedUsers.map((u) => (
                <article key={u.id} className="user-card-item">
                  <div className="user-card-top">
                    <div className="user-avatar-box">
                      {u.initial}
                      {u.online && <i className="user-online-dot"></i>}
                    </div>
                    <div className="user-card-name">
                      <h3>{u.name}</h3>
                      <small>{u.legal} · {u.sector}</small>
                    </div>
                    <span className={`user-status-badge ${u.status === 'نشط' ? '' : 'inactive'}`}>
                      {u.status}
                    </span>
                  </div>

                  <div className="user-card-badges">
                    <span className="user-badge">{u.activity}</span>
                    <span className="user-badge orange">{u.plan}</span>
                  </div>

                  <div className="user-mini-stats">
                    <div className="user-mini-stat">
                      <b>{u.consult}</b>
                      <span>استشارة</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{u.video}</b>
                      <span>فيديو</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{u.chat}</b>
                      <span>محادثة</span>
                    </div>
                    <div className="user-mini-stat">
                      <b>{u.tickets}</b>
                      <span>تذاكر دعم</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button onClick={() => openProfile(u)}>
                      عرض الملف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="users-empty-state">
              لا توجد نتائج مطابقة للفلاتر الحالية.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="users-pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === currentPage ? 'active' : ''}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PROFILE OVERLAY (FULL SCREEN VIEW)
          ══════════════════════════════════════════════════════════════════ */}
      {activeProfile && (
        <div className="profile-overlay-wrapper">
          
          {/* Top Return Bar */}
          <div className="profile-return-bar">
            <button onClick={closeProfile}>
              ← العودة إلى المستخدمين
            </button>
            <b>ملف المستخدم — عرض الأدمن</b>
          </div>

          <div className="profile-viewport-shell">
            <div className="profile-shell-grid">
              
              {/* Profile Card Header (Full Width Span) */}
              <section className="profile-card-header">
                <div className="profile-hero-band"></div>
                <div className="profile-top-info">
                  <div className="profile-avatar-large">
                    {activeProfile.initial}
                    {activeProfile.online && <i className="user-online-dot" style={{ width: 16, height: 16, border: '3px solid #fff' }}></i>}
                  </div>
                  <div className="profile-main-title">
                    <h1>{activeProfile.name}</h1>
                    <div className="profile-tagline">{activeProfile.legal} · {activeProfile.activity}</div>
                    <div className="profile-meta-line">
                      <span>💼 {activeProfile.sector}</span>
                      <span>⏱️ آخر ظهور: {activeProfile.last}</span>
                      <span>🛡️ حساب موثّق</span>
                    </div>
                  </div>
                  <div className="profile-right-meta">
                    <span className="account-id">رقم الحساب</span>
                    <strong>CUS-{String(1048 + Number(activeProfile.id || 1)).padStart(6, '0')}</strong>
                    <span className={`user-status-badge ${activeProfile.status === 'نشط' ? '' : 'inactive'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                      {activeProfile.status}
                    </span>
                  </div>
                </div>

                <nav className="profile-nav-tabs">
                  {[
                    { id: 'overview', label: 'نظرة عامة' },
                    { id: 'legal', label: 'البيانات القانونية' },
                    { id: 'docs', label: 'الوثائق' },
                    { id: 'members', label: 'المستخدمون والصلاحيات' },
                    { id: 'interests', label: 'الاهتمامات' },
                    { id: 'activity', label: 'النشاط' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={activeProfileTab === tab.id ? 'active' : ''}
                      onClick={() => scrollToSection(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </section>

              {/* Main Scroll Content (Left Column in LTR, Right visually in RTL) */}
              <main
                className="profile-main-scroll"
                ref={mainScrollRef}
                onScroll={handleMainScroll}
              >
                <div>
                  
                  {/* Section 1: Overview */}
                  <section className="profile-section-card" id="sec_overview">
                    <h2>نظرة عامة على العميل</h2>
                    <div className="profile-section-sub">المعلومات الأساسية المسجلة في الحساب</div>
                    <div className="profile-info-grid">
                      <div className="profile-info-box"><small>الاسم / اسم المنشأة</small><b>{activeProfile.name}</b></div>
                      <div className="profile-info-box"><small>الصفة القانونية</small><b>{activeProfile.legal}</b></div>
                      <div className="profile-info-box"><small>القطاع</small><b>{activeProfile.sector}</b></div>
                      <div className="profile-info-box"><small>النشاط الرئيسي</small><b>{activeProfile.activity}</b></div>
                      <div className="profile-info-box"><small>البريد الإلكتروني</small><b>{activeProfile.email}</b></div>
                      <div className="profile-info-box"><small>رقم التواصل</small><b dir="ltr">{activeProfile.phone}</b></div>
                    </div>
                  </section>

                  {/* Section 2: Legal Details */}
                  <section className="profile-section-card" id="sec_legal">
                    <h2>البيانات القانونية والتسجيلية</h2>
                    <div className="profile-section-sub">بيانات المنشأة كما تم إدخالها والتحقق منها</div>
                    <div className="profile-info-grid">
                      <div className="profile-info-box clickable-card" onClick={() => handleOpenLegalDetail('national', activeProfile)}>
                        <small>الرقم الوطني للمنشأة</small>
                        <b>{activeProfile.national}</b>
                      </div>
                      <div className="profile-info-box clickable-card" onClick={() => handleOpenLegalDetail('register', activeProfile)}>
                        <small>رقم السجل التجاري</small>
                        <b>{activeProfile.reg}</b>
                      </div>
                      <div className="profile-info-box clickable-card" onClick={() => handleOpenLegalDetail('tax', activeProfile)}>
                        <small>الرقم الضريبي</small>
                        <b>{activeProfile.tax}</b>
                      </div>
                      <div className="profile-info-box"><small>الدولة</small><b>الأردن</b></div>
                      <div className="profile-info-box"><small>المدينة</small><b>{activeProfile.city}</b></div>
                      <div className="profile-info-box"><small>تاريخ إنشاء الحساب</small><b>{activeProfile.joined}</b></div>
                    </div>
                  </section>

                  {/* Section 3: Documents */}
                  <section className="profile-section-card" id="sec_docs">
                    <h2>الوثائق والتحقق</h2>
                    <div className="profile-section-sub">الوثائق المرفقة بالحساب وحالة التحقق منها</div>
                    <div className="profile-doc-list">
                      {[
                        { title: 'السجل التجاري', type: 'commercial', date: 'تم الرفع 14/05/2026' },
                        { title: 'شهادة التسجيل الضريبي', type: 'tax', date: 'تم الرفع 14/05/2026' },
                        { title: 'هوية المفوض بالتوقيع', type: 'authorized', date: 'آخر تحديث 22/06/2026' },
                        { title: 'تفويض إدارة الحساب', type: 'delegation', date: 'صالح' }
                      ].map((doc, i) => (
                        <div
                          key={i}
                          className="profile-doc-item clickable-card"
                          onClick={() => handleOpenDocument(doc.title, activeProfile, doc.type)}
                        >
                          <div className="profile-doc-ico">📄</div>
                          <div>
                            <strong>{doc.title}</strong>
                            <small>PDF · {doc.date}</small>
                          </div>
                          <span className="profile-verified-tag">موثّق</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 4: Members */}
                  <section className="profile-section-card" id="sec_members">
                    <h2>المستخدمون والصلاحيات</h2>
                    <div className="profile-section-sub">الأعضاء المرتبطون بنفس حساب المنشأة</div>
                    <div className="profile-members-list">
                      {[
                        { name: 'محمد العلي', email: 'm.ali@client.jo', role: 'مدير الحساب', initials: 'م ع', seen: 'منذ 6 دقائق' },
                        { name: 'سارة الخطيب', email: 's.khatib@client.jo', role: 'استشارات وفوترة', initials: 'س خ', seen: 'أمس' },
                        { name: 'عمر النجار', email: 'o.najjar@client.jo', role: 'عرض فقط', initials: 'ع ن', seen: 'منذ 3 أيام' }
                      ].map((member, i) => (
                        <div
                          key={i}
                          className="profile-member-item clickable-card"
                          onClick={() => handleOpenMember(member.name, member.email, member.role)}
                        >
                          <div className="profile-member-av">{member.initials}</div>
                          <div>
                            <b>{member.name}</b>
                            <small>{member.email} · آخر دخول {member.seen}</small>
                          </div>
                          <span className="profile-role-tag">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 5: Topic Interests */}
                  <section className="profile-section-card" id="sec_interests">
                    <h2>المواضيع الأكثر اهتمامًا</h2>
                    <div className="profile-section-sub">مبنية على الاستشارات والأسئلة والتفاعل داخل المنصة</div>
                    <div className="profile-topic-bars">
                      {[
                        { topic: 'ضريبة الدخل', pct: 88 },
                        { topic: 'ضريبة المبيعات', pct: 74 },
                        { topic: 'الفوترة الإلكترونية', pct: 63 },
                        { topic: 'الاعتراضات الضريبية', pct: 41 }
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="profile-topic-line clickable-card"
                          onClick={() => handleOpenTopic(item.topic)}
                        >
                          <b>{item.topic}</b>
                          <div className="profile-topic-track">
                            <i style={{ width: `${item.pct}%` }}></i>
                          </div>
                          <span>{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 6: Activity */}
                  <section className="profile-section-card" id="sec_activity">
                    <h2>آخر نشاط على المنصة</h2>
                    <div className="profile-activity-list">
                      <div
                        className="profile-activity-item clickable-card"
                        onClick={() => handleOpenSession('جلسة استشارة فيديو — ضريبة الدخل', '28 أغسطس')}
                      >
                        <div className="profile-activity-ico">📹</div>
                        <div>
                          <b>جلسة استشارة فيديو — ضريبة الدخل</b>
                          <small>مع المستشار أحمد العواملة · مكتملة بنجاح</small>
                        </div>
                        <time>28 أغسطس</time>
                      </div>

                      <div
                        className="profile-activity-item clickable-card"
                        onClick={() => handleOpenSession('محادثة استشارية — الفوترة الإلكترونية', '25 أغسطس')}
                      >
                        <div className="profile-activity-ico">💬</div>
                        <div>
                          <b>محادثة استشارية — الفوترة الإلكترونية</b>
                          <small>14 رسالة · تم إغلاق الجلسة</small>
                        </div>
                        <time>25 أغسطس</time>
                      </div>

                      <div
                        className="profile-activity-item clickable-card"
                        onClick={() => handleOpenSession('ملخص الاستشارة', '24 أغسطس')}
                      >
                        <div className="profile-activity-ico">📑</div>
                        <div>
                          <b>تحميل ملخص الاستشارة</b>
                          <small>Tax-session-summary-0824.pdf</small>
                        </div>
                        <time>24 أغسطس</time>
                      </div>

                      <div
                        className="profile-activity-item clickable-card"
                        onClick={() => {
                          openModal(
                            'تحديث صلاحية عضو',
                            '21 أغسطس · سجل النشاط الإداري',
                            <div className="modal-list">
                              <div className="modal-row">
                                <div className="mi">🛡️</div>
                                <div><b>تم تعديل صلاحيات سارة الخطيب</b><small>أضيفت صلاحية الفوترة وتم الإبقاء على صلاحية الاستشارات.</small></div>
                                <span className="tag">بواسطة مدير الحساب</span>
                              </div>
                            </div>,
                            false,
                            'سجل النشاط'
                          );
                        }}
                      >
                        <div className="profile-activity-ico">🛡️</div>
                        <div>
                          <b>تحديث صلاحية عضو في الحساب</b>
                          <small>تم تعديل صلاحيات سارة الخطيب</small>
                        </div>
                        <time>21 أغسطس</time>
                      </div>
                    </div>
                  </section>

                </div>
              </main>

              {/* Side Scroll Rail (Right Column visually in RTL) */}
              <aside className="profile-side-scroll">
                
                {/* 1. Account Summary KPIs */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>ملخص الحساب</h3>
                    <span className="profile-live-tag">
                      {activeProfile.online ? 'متصل الآن' : 'نشط'}
                    </span>
                  </div>
                  <div className="profile-kpi-grid">
                    <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'all')}>
                      <small>إجمالي الاستشارات</small>
                      <b>{activeProfile.consult}</b>
                      <span>+3 هذا الشهر</span>
                    </div>
                    <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'success')}>
                      <small>استشارات ناجحة</small>
                      <b>{activeProfile.success}</b>
                      <span>{Math.round((activeProfile.success / (activeProfile.consult || 1)) * 100)}% نجاح</span>
                    </div>
                    <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'video')}>
                      <small>مكالمات فيديو</small>
                      <b>{activeProfile.video}</b>
                      <span>{Math.round((activeProfile.video / (activeProfile.consult || 1)) * 100)}% من الجلسات</span>
                    </div>
                    <div className="profile-kpi-box clickable-card" onClick={() => handleOpenConsultations(activeProfile, 'chat')}>
                      <small>محادثات</small>
                      <b>{activeProfile.chat}</b>
                      <span>{Math.round((activeProfile.chat / (activeProfile.consult || 1)) * 100)}% من الجلسات</span>
                    </div>
                  </div>
                </section>

                {/* 2. Plan & Usage */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>الباقة والاستهلاك</h3>
                    <span className="user-badge orange">{activeProfile.plan}</span>
                  </div>
                  <div className="profile-plan-row clickable-card" onClick={() => handleOpenPlanUsage(activeProfile)}>
                    <div className="profile-donut-chart"></div>
                    <div className="profile-plan-copy">
                      <b>68% مستخدم</b>
                      <small>متبقي 32% من رصيد الباقة الحالية<br />التجديد: 14 سبتمبر 2026</small>
                    </div>
                  </div>
                  <div className="profile-usage-list">
                    {[
                      { title: 'استهلاك النقاط', value: '680 / 1000 نقطة', displayVal: '680 / 1000', pct: 68 },
                      { title: 'تحميل الوثائق', value: '24 / 40 عملية', displayVal: '24 / 40', pct: 60 },
                      { title: 'طباعة الوثائق', value: '13 / 25 عملية', displayVal: '13 / 25', pct: 52 },
                      { title: 'الجلسات الاستشارية المجانية', value: '2 / 3 جلسات', displayVal: '2 / 3', pct: 67 }
                    ].map((usage, i) => (
                      <div key={i} className="profile-usage-row clickable-card" onClick={() => handleOpenUsage(usage.title, usage.value)}>
                        <span>{usage.title.includes('المجانية') ? 'جلسات مجانية' : usage.title}</span>
                        <div className="track">
                          <i style={{ width: `${usage.pct}%` }}></i>
                        </div>
                        <b>{usage.displayVal}</b>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. 6-Months Activity Chart */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>النشاط خلال 6 أشهر</h3>
                    <small style={{ color: 'var(--admin-muted)' }}>جلسات</small>
                  </div>
                  <div className="profile-activity-chart-box clickable-card">
                    
                    {/* Hover Tooltip */}
                    <div
                      className={`profile-chart-tooltip ${chartTooltip.show ? 'show' : ''}`}
                      style={{ left: chartTooltip.x, top: chartTooltip.y }}
                    >
                      {chartTooltip.text}
                    </div>

                    <svg viewBox="0 0 320 110" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <linearGradient id="userActivityArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59A23" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#F59A23" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 91 L48 75 L98 82 L150 51 L204 60 L260 30 L320 42 L320 110 L0 110 Z" fill="url(#userActivityArea)" />
                      <polyline points="0,91 48,75 98,82 150,51 204,60 260,30 320,42" fill="none" stroke="#F59A23" strokeWidth="3" />
                      <g fill="#0B2E4B">
                        {[
                          { cx: 8, cy: 91, m: 'مارس', count: 2 },
                          { cx: 48, cy: 75, m: 'أبريل', count: 4 },
                          { cx: 98, cy: 82, m: 'مايو', count: 3 },
                          { cx: 150, cy: 51, m: 'يونيو', count: 7 },
                          { cx: 204, cy: 60, m: 'يوليو', count: 6 },
                          { cx: 260, cy: 30, m: 'أغسطس', count: 10 },
                          { cx: 312, cy: 42, m: 'الحالي', count: 8 }
                        ].map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.cx}
                            cy={pt.cy}
                            r={4}
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.parentElement.parentElement.parentElement.getBoundingClientRect();
                              setChartTooltip({
                                show: true,
                                text: `${pt.m}: ${pt.count} جلسات — اضغط للتفاصيل`,
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top
                              });
                            }}
                            onMouseLeave={() => setChartTooltip(prev => ({ ...prev, show: false }))}
                            onClick={() => handleOpenChartMonth(pt.m, pt.count)}
                          />
                        ))}
                      </g>
                    </svg>
                  </div>
                  <div className="profile-chart-labels">
                    <span>مارس</span>
                    <span>أبريل</span>
                    <span>مايو</span>
                    <span>يونيو</span>
                    <span>يوليو</span>
                    <span>أغسطس</span>
                  </div>
                  <div className="profile-click-hint">
                    مرّر على النقاط واضغط لعرض تفاصيل الشهر
                  </div>
                </section>

                {/* 4. Support & Interaction */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>الدعم والتفاعل</h3>
                  </div>
                  <div className="profile-split-metrics">
                    <div className="profile-metric-box clickable-card" onClick={() => handleOpenTickets(activeProfile)}>
                      <small>تذاكر الدعم</small>
                      <b>{activeProfile.tickets}</b>
                      <span className="profile-click-hint">عرض القائمة</span>
                    </div>
                    <div className="profile-metric-box clickable-card" onClick={handleOpenRatings}>
                      <small>متوسط تقييمه للمنصة</small>
                      <b>4.8 / 5</b>
                      <span className="profile-click-hint">6 تقييمات</span>
                    </div>
                    <div className="profile-metric-box clickable-card" onClick={handleOpenMembersSummary}>
                      <small>أعضاء الحساب</small>
                      <b>3</b>
                      <span className="profile-click-hint">عرض الأعضاء</span>
                    </div>
                    <div className="profile-metric-box clickable-card" onClick={() => handleOpenLastSeen(activeProfile)}>
                      <small>آخر ظهور</small>
                      <b style={{ fontSize: '11px' }}>{activeProfile.last}</b>
                      <span className="profile-click-hint">تفاصيل الدخول</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div className="profile-ticket-item clickable-card" onClick={() => handleOpenTicketDetail('#SUP-1082', 'مشكلة فاتورة', 'قيد المتابعة')}>
                      <b>#SUP-1082 · مشكلة فاتورة</b>
                      <span>قيد المتابعة</span>
                    </div>
                    <div className="profile-ticket-item clickable-card" onClick={() => handleOpenTicketDetail('#SUP-1041', 'تحديث بيانات', 'مغلقة')}>
                      <b>#SUP-1041 · تحديث بيانات</b>
                      <span className="done">مغلقة</span>
                    </div>
                  </div>
                </section>

                {/* 5. Admin Actions */}
                <section className="profile-side-card">
                  <div className="profile-side-head">
                    <h3>إجراءات الإدارة</h3>
                  </div>
                  <div className="profile-admin-actions">
                    <button className="primary-act" onClick={() => handleOpenAdminAction('account', activeProfile)}>
                      إدارة الحساب
                    </button>
                    <button onClick={() => handleOpenAdminAction('audit', activeProfile)}>
                      سجل النشاط
                    </button>
                    <button onClick={() => handleOpenAdminAction('permissions', activeProfile)}>
                      الصلاحيات
                    </button>
                    <button onClick={() => handleOpenAdminAction('message', activeProfile)}>
                      مراسلة العميل
                    </button>
                  </div>
                </section>

              </aside>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HIERARCHICAL MODAL ENGINE (DRILLDOWN POPUPS)
          ══════════════════════════════════════════════════════════════════ */}
      {modalStack.length > 0 && (
        <div
          className="drill-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className={`drill-modal-panel ${modalStack[modalStack.length - 1].wide ? 'wide' : ''}`}>
            <div className="drill-modal-accent"></div>

            {/* Modal Header with Back and Close buttons */}
            <div className="drill-modal-head">
              <div className="drill-modal-head-main">
                {modalStack.length > 1 && (
                  <button className="drill-modal-back" onClick={modalGoBack} title="رجوع">
                    →
                  </button>
                )}
                <div>
                  <div className="drill-modal-eyebrow">
                    {modalStack[modalStack.length - 1].eyebrow || 'تفاصيل الحساب'}
                  </div>
                  <h3>{modalStack[modalStack.length - 1].title}</h3>
                  <p>{modalStack[modalStack.length - 1].subtitle}</p>
                </div>
              </div>

              <button className="drill-modal-close" onClick={closeModal} title="إغلاق">
                ×
              </button>
            </div>

            <div className="drill-modal-progress"></div>

            <div className="drill-modal-body">
              {modalStack[modalStack.length - 1].body}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="drill-toast-box">
          {toastMsg}
        </div>
      )}

    </div>
  );
}
