# AGENTS

## Mission
هذا المشروع هو نظام تشغيل إنتاج لمصانع الألومنيوم (نوافذ/أبواب/واجهات)، وليس أداة رسم فقط.

الحقيقة الأساسية للدومين:
- `Profile = Geometry + Semantic Zones + Interfaces + Constraints + Manufacturing Knowledge`

يجب أن يدعم نفس مصدر الحقيقة:
- Preview
- BOM
- Cut List
- Machining
- Compatibility Validation

## Project Status
- المشروع **قائم بالفعل** وليس Greenfield.
- أي تطوير يجب أن يكون تدريجيًا، قابلًا للمراجعة، وبدون كسر السلوكات العاملة.

## Mandatory Rules
1. لا تعيد كتابة المشروع من الصفر.
2. لا تكسر الميزات العاملة إلا إذا كانت ضمن نطاق المهمة.
3. افصل منطق الدومين عن الواجهة تدريجيًا.
4. وثّق الافتراضات قبل التنفيذ.
5. عدّل بأصغر تغيير ممكن، ثم اختبر، ثم لخّص.
6. لا تغيّر قاعدة البيانات إلا عند الضرورة الصريحة للمهمة.

## Operational Truth (Business Mode)
- **Measurement-only (بدون عقد):**
- لا خصم مخزون.
- لا شراء نواقص.
- لا تحميل دفعات/تتبّع عقد.

- **Contract-linked (بعقد):**
- تشغيل سلسلة الإنتاج كاملة.
- مقارنة الاحتياج بالمخزون.
- استهلاك/عجز/أمر شراء.
- ربط التكلفة الداخلية مع قيمة العقد والمدفوعات.

## Current Architecture Anchors
- Domain data seeds: `src/renderer/src/data/defaults.js`
- Technical compiler: `src/renderer/src/utils/technicalSystem.js`
- Assembly compiler: `src/renderer/src/utils/assemblyLayout.js`
- Facade compiler: `src/renderer/src/utils/facadeDesigner.js`
- Material flow and stock impact: `src/renderer/src/utils/productionFlow.js`
- Production order snapshot: `src/renderer/src/utils/productionOrder.js`
- Main orchestration/UI: `src/renderer/src/App.jsx`

## Required Workflow Per Task
1. اقرأ أولًا:
- `docs/refactor-guardrails.md`
- `docs/target-domain-model.md`
- `docs/window-factory-domain.md`
- `docs/domain-glossary.md`
- `docs/migration-strategy.md`
2. حدّد النطاق والافتراضات.
3. نفّذ أقل تعديل ممكن.
4. اختبر الجزء المتأثر.
5. توقف وقدّم ملخصًا واضحًا لما تغيّر وما لم يتغيّر.

## Definition of Done
- السلوكات الحالية محفوظة.
- التعديل يخدم خط الهجرة المرحلية.
- لا يوجد خلط إضافي بين UI وBusiness Logic.
- تم توثيق القرار التنفيذي المختار بوضوح.

