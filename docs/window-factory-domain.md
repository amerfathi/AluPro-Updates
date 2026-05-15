# Window Factory Domain

## 1) Domain Intent
هذا النظام مساعد إنتاج لمصانع الألومنيوم:
- إدخال العناصر (نوافذ/أبواب/واجهات)
- تحويلها إلى احتياج تصنيع فعلي
- إخراج تقارير قص/مواد/تشغيل/شراء
- الربط المباشر مع المخزون وحالة العقد

## 2) Core Business Modes

| الوضع | الوصف | تأثيره على المخزون | التأثير المالي |
|---|---|---|---|
| Measurement-only (مقايسة بدون عقد) | إدخال مقاسات وتقدير إنتاج بدون التزام تنفيذ | لا خصم ولا حجز ولا شراء | لا تحميل عقد/دفعات |
| Contract-linked (مقايسة بعقد) | تنفيذ فعلي مرتبط بعقد عميل | مقارنة/استهلاك/عجز/شراء | مقارنة تكلفة داخلية مع قيمة العقد والمدفوعات |

## 3) Production Pipeline
1. تعريف النظام الفني (System/ProfileVariant).
2. تكوين العنصر (ConfiguredElement/AssemblyTree).
3. استخراج BOM (قطاعات/زجاج/إكسسوارات/عمليات).
4. تطبيق قواعد القص (CutRule) وإنتاج Cutting Maps.
5. مقارنة الاحتياج مع المخزون (Material Flow Snapshot).
6. إخراج نواقص الشراء فقط لما هو غير متوفر.
7. تحديث حالة التنفيذ وتقارير الورشة.

## 4) Domain Objects (Conceptual)
- System
- ProfileFamily
- ProfileVariant
- ProfileGeometry
- SemanticZone
- InterfaceDefinition
- Accessory
- CompatibilityRule
- AssemblyRule
- CutRule
- GlazingRule
- MachiningTemplate
- BOMItem / BOMRule
- ConfiguredElement / AssemblyTree

> التفاصيل التنفيذية لكل كيان موجودة في `docs/target-domain-model.md`.

## 5) Manufacturing Semantics
- النافذة الثابتة: عادةً حلق + بركلوز + زجاج، وقد تشمل قواطع.
- النافذة المتحركة: مفصلي أو سحاب أو تركيب هجين (ثابت/متحرك بنفس العنصر).
- يمكن أن يجتمع أكثر من قطاع داخل نفس العنصر، لذلك لا يجوز اختزال النظام في نموذج رسم مسطح فقط.
- أي عنصر يجب أن يكون قابلًا للتحويل إلى:
- قطع خام
- زجاج
- إكسسوارات
- عمليات ورشة
- خطة قص قابلة للتنفيذ

## 6) Invariants (Do Not Break)
1. نفس المدخل يجب أن ينتج BOM وقص متسقين.
2. Measurement-only لا يخصم مخزون.
3. Contract-linked يفعّل الشراء فقط للنواقص.
4. لا يسمح بنواتج إنتاج بلا نظام فني صالح.
5. أي فجوة توافق يجب اكتشافها قبل اعتماد الإدراج.

## 7) Current Code Anchors
- Technical rules and compilation:
`src/renderer/src/utils/technicalSystem.js`
- Grid assembly:
`src/renderer/src/utils/assemblyLayout.js`
- Facade free/grid compilation:
`src/renderer/src/utils/facadeDesigner.js`
- Material flow and stock impact:
`src/renderer/src/utils/productionFlow.js`
- Order status snapshot:
`src/renderer/src/utils/productionOrder.js`

## 8) Migration Policy
- لا إعادة كتابة كاملة.
- الحفاظ على السلوك التشغيلي الحالي.
- إدخال الكيانات الجديدة تدريجيًا عبر Adapters فوق الموديلات القديمة.
- أي خطوة هجرة يجب أن تكون قابلة للاختبار والمراجعة.

