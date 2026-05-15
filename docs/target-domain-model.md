# Target Domain Model (Phased Migration)

## 1) الهدف
هذه الوثيقة تحدد **نموذج المجال المستهدف** للمشروع الحالي (بدون إعادة كتابة كاملة)، بحيث يصبح نفس مصدر الحقيقة قادرًا على دعم:
- المعاينة (Preview)
- قائمة المواد (BOM)
- قائمة القص (Cut List)
- عمليات التصنيع (Machining)
- التحقق من التوافق (Compatibility)

المرجع الحالي في الكود قبل الهجرة:
- `src/renderer/src/data/defaults.js`
- `src/renderer/src/utils/technicalSystem.js`
- `src/renderer/src/utils/assemblyLayout.js`
- `src/renderer/src/utils/facadeDesigner.js`
- `src/renderer/src/utils/productionFlow.js`
- `src/renderer/src/utils/productionOrder.js`
- `src/renderer/src/VisualDesigner.jsx`
- `src/renderer/src/components/production/SmartAssemblyBuilder.jsx`
- `src/renderer/src/App.jsx`

## 2) مواصفات مفاهيم المجال المستهدفة

| المفهوم | Purpose (الغرض) | هل موجود حاليًا؟ | إدخاله الآن أم لاحقًا؟ | مكانه المقترح في الكود | الدمج مع الكود الحالي |
|---|---|---|---|---|---|
| **System** | يمثل النظام الفني كاملًا (هوية النظام + قواعده + القيم الافتراضية). | **جزئيًا**: موجود كموديل `profile` داخل `defaults.js` مع `physics/structuredFormulas/...` | **الآن (Phase 1)** كغلاف Domain واضح فوق موديل profile الحالي. | `src/renderer/src/domain/system/System.js` | يقرأ من `normalizeTechnicalSystem` ويغذي `compileTechnicalSystemWindow/Layout`. |
| **ProfileFamily** | تجميع variants تحت عائلة (مثل: Sliding/Fixed/Casement) بدل الاعتماد على نصوص مبعثرة. | **جزئيًا جدًا**: `systemType` فقط. | **لاحقًا (Phase 2)** بعد تثبيت System. | `src/renderer/src/domain/profile/ProfileFamily.js` | يبدأ بربط `systemType` الحالي من `defaults.js` ثم يستخدمه في الفلاتر والـ UI. |
| **ProfileVariant** | تعريف القطاع/النسخة القابلة للاستخدام في مشروع (ألوان/خصائص/معادلات). | **نعم جزئيًا**: كيان profile الحالي هو Variant فعليًا. | **الآن (Phase 1)** عبر تسمية صريحة وتحويلات Adapter. | `src/renderer/src/domain/profile/ProfileVariant.js` | Adapter من profile الحالي ثم استخدامه داخل `compileTechnicalSystemLayout`. |
| **ProfileGeometry** | وصف هندسي للقطاع (أبعاد/مقاطع/خصائص هندسية) بدل الاعتماد فقط على معادلات طول. | **جزئيًا**: `physics` + `mullionThicknessCm` + أدوار `physicalRole` بدون كيان هندسي مستقل. | **لاحقًا (Phase 3)**. | `src/renderer/src/domain/profile/ProfileGeometry.js` | في البداية يُستنتج من `physics`، ثم يستهلكه `AssemblyLivePreview` ومحرك القص. |
| **SemanticZone** | تمثيل مناطق وظيفية داخل القطاع/العنصر (frame/sash/bead/glass zone...) كمفاهيم ثابتة. | **جزئيًا**: موجود ضمنيًا في `physicalRole` و`sectionType`. | **الآن (Phase 1)** كقاموس موحد + Mapper. | `src/renderer/src/domain/profile/SemanticZone.js` | استبدال التحقق النصي في `roleMatchesSection` تدريجيًا بـ zone mapping. |
| **InterfaceDefinition** | تعريف واجهات التركيب بين القطاعات/الاكسسوارات/الزجاج (ما يركب مع ماذا). | **غير موجود صريحًا**. | **لاحقًا (Phase 3)** بعد تثبيت zones/families. | `src/renderer/src/domain/profile/InterfaceDefinition.js` | يدمج مع `validateTechnicalSystem` لمنع التركيبات غير الصحيحة مسبقًا. |
| **Accessory** | كيان اكسسوار مستقل بقاعدة حساب واضحة وربط مخزون. | **نعم جزئيًا**: `accessories` داخل profile + normalize/calc في `technicalSystem.js`. | **الآن (Phase 1)** (استخراج Domain Object بدون كسر الواجهة). | `src/renderer/src/domain/materials/Accessory.js` | يقرأ من نفس البيانات ويغذي `calculateAccessoryBaseMeasure` ثم `productionFlow`. |
| **CompatibilityRule** | قواعد توافق الأنظمة والقطاعات والاكسسوارات والزجاج (Valid combinations). | **ضمني محدود**: تحقق فئات المخزون وبعض `physicalRole` فقط. | **لاحقًا (Phase 2/3)**. | `src/renderer/src/domain/rules/CompatibilityRule.js` | يندمج داخل `validateTechnicalSystem` ومرحلة حفظ النظام الفني. |
| **AssemblyRule** | قواعد تكوين التجميعة (ثابت/متحرك/شبكة/تقسيمات/حدود). | **نعم جزئيًا**: `assemblyTemplates` و`compileAssemblyGrid` + grid/free في facadeDesigner. | **الآن (Phase 1/2)** كبنية Rule موحدة للتجميع. | `src/renderer/src/domain/rules/AssemblyRule.js` | توحيد منطق `assemblyLayout.js` و`facadeDesigner.js` تحت نفس القاعدة. |
| **CutRule** | قواعد القص الفنية (نوع القص 45/90، سماكة السكينة، هالك فني، طول الخام). | **نعم جزئيًا**: `optimizeCutting` + `miterWasteCm` + `bladeThickness`. | **الآن (Phase 2)** مع إبقاء نفس الخوارزمية أولًا. | `src/renderer/src/domain/rules/CutRule.js` | Adapter فوق `optimizeCutting` ودمج تدريجي مع `buildProductionNeedsModel`. |
| **GlazingRule** | قواعد الزجاج (تقسيمات/خصومات/كميات/أنواع). | **نعم جزئيًا**: `glassFormulas` واحتسابها في compilers. | **الآن (Phase 2)**. | `src/renderer/src/domain/rules/GlazingRule.js` | استخراج من `normalizeGlassFormula` و`compileTechnicalSystemWindow/Layout`. |
| **MachiningTemplate** | قوالب عمليات تصنيع قابلة لإعادة الاستخدام (ثقوب/فتحات/تجهيزات) مع معايير تشغيل. | **جزئي محدود**: `workshopOperations` تعبر عن تكلفة/كمية فقط وليست machining تفصيلية. | **لاحقًا (Phase 4)**. | `src/renderer/src/domain/machining/MachiningTemplate.js` | تبدأ من `workshopOperations` ثم توسعة تدريجية بلا كسر التقارير الحالية. |
| **BOMItem / BOMRule** | BOMItem: سطر مادة قياسي. BOMRule: كيف يتحول العنصر إلى مواد. | **جزئيًا قويًا**: نواتج `pieces/glass/accessories/operations` + merge/normalize في `productionFlow.js`. | **الآن (Phase 2)** كواجهة موحدة للنواتج. | `src/renderer/src/domain/bom/BOMItem.js` و`src/renderer/src/domain/bom/BOMRule.js` | يستخدم مخرجات `compileTechnicalSystem*` ثم يغذي `buildProductionNeedsModel` بدون تغيير UI مباشر. |
| **ConfiguredElement / AssemblyTree** | تمثيل العنصر المُكوَّن النهائي كشجرة تركيب موحدة (بدل تعدد نماذج grid/free/modules). | **جزئيًا**: `gridTree`, `freeCells`, `modules` نماذج منفصلة. | **الآن (Phase 2)** كنموذج وسيط موحد مع Adapters. | `src/renderer/src/domain/configuration/ConfiguredElement.js` و`AssemblyTree.js` | Adapters من `facadeDesigner` و`assemblyLayout` ثم تمرير موحد إلى compilers. |

## 3) خريطة طبقات المجال المستهدفة (بدون كسر)

```text
src/renderer/src/domain/
  system/
    System.js
  profile/
    ProfileFamily.js
    ProfileVariant.js
    ProfileGeometry.js
    SemanticZone.js
    InterfaceDefinition.js
  materials/
    Accessory.js
  rules/
    CompatibilityRule.js
    AssemblyRule.js
    CutRule.js
    GlazingRule.js
  machining/
    MachiningTemplate.js
  bom/
    BOMItem.js
    BOMRule.js
  configuration/
    ConfiguredElement.js
    AssemblyTree.js
  adapters/
    fromLegacyProfile.js
    fromGridTree.js
    fromFreeCells.js
    fromAssemblyModules.js
```

> ملاحظة تنفيذية: في المرحلة الأولى، تبقى ملفات `utils/*` هي نقطة التنفيذ الفعلية، وتعمل طبقة `domain/adapters` كجسر لتقليل المخاطر.

## 4) تسلسل هجرة مرحلي (Minimal Risk)

### Phase 1 (Foundation Without Breakage)
- إدخال: `System`, `ProfileVariant`, `SemanticZone`, `Accessory`.
- إنشاء Adapters من موديل profile الحالي إلى domain model.
- إبقاء `compileTechnicalSystemWindow/Layout` كما هي، مع تمرير المدخل عبر adapter فقط.

### Phase 2 (Rule Extraction + Unified Configuration)
- إدخال: `AssemblyRule`, `CutRule`, `GlazingRule`, `BOMItem/BOMRule`, `ConfiguredElement/AssemblyTree`.
- توحيد مداخل `grid/free/modules` إلى `AssemblyTree` قبل التحويل إلى layout.
- جعل مخرجات الـ BOM موحدة قبل `productionFlow`.

### Phase 3 (Deeper Semantics)
- إدخال: `ProfileFamily`, `ProfileGeometry`, `InterfaceDefinition`, `CompatibilityRule`.
- نقل التوافق من تحقق نصي إلى قواعد صريحة قابلة للاختبار.

### Phase 4 (Manufacturing Depth)
- إدخال: `MachiningTemplate`.
- ربط عمليات الورشة الحالية بتفاصيل تشغيل أدق دون كسر التقارير الموجودة.

## 5) حدود هذه الوثيقة
- هذه الوثيقة **تصميم فقط** (لا تنفيذ).
- لا يوجد أي حذف أو إعادة كتابة كاملة.
- الهجرة المقترحة متوافقة مع `docs/refactor-guardrails.md` (تدريجية وقابلة للمراجعة).

