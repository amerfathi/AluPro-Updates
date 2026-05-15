# Migration Strategy (Incremental, Low Risk)

## 1) Strategy Principles
1. لا إعادة كتابة كاملة للمشروع.
2. الحفاظ على السلوكات العاملة.
3. التغييرات تكون صغيرة وقابلة للمراجعة.
4. فصل الدومين عن الـ UI تدريجيًا.
5. أي تعديل في منطق جوهري يسبقه/يصاحبه اختبار.

مرجع إلزامي:
- `docs/refactor-guardrails.md`
- `docs/target-domain-model.md`

## 2) Current -> Target Module Map

| الحالي | الهدف | أسلوب النقل |
|---|---|---|
| `data/defaults.js` (profile seeds) | `domain/system`, `domain/profile` | Adapters أولًا ثم تفكيك تدريجي |
| `utils/technicalSystem.js` | `domain/rules/*` + services compile | احتواء (wrap) ثم استخراج rule-by-rule |
| `utils/assemblyLayout.js` | `domain/configuration` + `AssemblyRule` | توحيد تمثيل modules ضمن AssemblyTree |
| `utils/facadeDesigner.js` | `domain/configuration` + `AssemblyRule` | تحويل grid/free إلى ConfiguredElement موحد |
| `utils/productionFlow.js` | `domain/bom` + material-flow service | تثبيت BOMItem أولًا ثم إعادة تنظيم |
| `utils/productionOrder.js` | application service (read model) | إبقاءه كواجهة قراءة مع ربط الموديل الجديد |
| `App.jsx` (orchestration كبير) | app-layer orchestrators أصغر | نقل المنطق تدريجيًا من UI إلى services |

## 3) Keep / Refactor / Replace

### Keep (حالياً)
- `utils/aluCalculations.js` (خوارزمية القص الحالية).
- `utils/productionOrder.js` كـ read-model builder.
- `components/production/AssemblyLivePreview.jsx` كواجهة عرض.

### Refactor (تدريجي)
- `utils/technicalSystem.js` (تحويله إلى Rules + Compiler service).
- `utils/assemblyLayout.js` (فصل model عن UI concerns).
- `utils/facadeDesigner.js` (توحيد نموذج الإدخال).
- `utils/productionFlow.js` (ربط BOM موحد وmaterial state أنظف).
- `App.jsx` (تقليل الاقتران ورفع المنطق لخدمات).

### Replace (بعد اكتمال البديل)
- أي منطق تكراري بين `assemblyLayout` و`facadeDesigner` يجب استبداله بنواة `AssemblyTree` موحدة.
- التحقق النصي المعتمد على `physicalRole` فقط يستبدل تدريجيًا بقواعد `SemanticZone + CompatibilityRule`.

## 4) Phased Execution Plan

### Phase A: Foundation Adapters
- إدخال طبقة `domain/` بدون تعطيل `utils/` الحالية.
- إنشاء:
- `System`, `ProfileVariant`, `SemanticZone`, `Accessory`.
- `fromLegacyProfile` adapter.
- مخرج المرحلة:
- المسار الحالي يعمل كما هو.
- الدومين الجديد يقرأ نفس البيانات.

### Phase B: Unified Configuration
- إدخال:
- `ConfiguredElement`, `AssemblyTree`, `AssemblyRule`.
- بناء محول من:
- `gridTree` (facadeDesigner)
- `freeCells` (facadeDesigner)
- `modules` (assemblyLayout)
- مخرج المرحلة:
- مصدر تمثيل واحد قبل أي compilation.

### Phase C: Rules Extraction
- إدخال:
- `GlazingRule`, `CutRule`, `BOMRule/BOMItem`.
- لف (wrap) الدوال الحالية ثم استخراجها تدريجيًا.
- مخرج المرحلة:
- BOM وCut pipelines أوضح وقابلة للاختبار.

### Phase D: Compatibility & Geometry
- إدخال:
- `ProfileFamily`, `ProfileGeometry`, `InterfaceDefinition`, `CompatibilityRule`.
- مخرج المرحلة:
- منع حالات تركيب غير صالحة مبكرًا.

### Phase E: Machining Depth
- إدخال:
- `MachiningTemplate`.
- ربط `workshopOperations` الحالي بقوالب تشغيل أدق.

## 5) MVP Migration Sequence (Recommended)
1. إضافة domain skeleton + adapters.
2. تحويل نقطة إدخال واحدة فقط (مثل SmartAssemblyBuilder) لاستخدام adapter.
3. إضافة اختبارات snapshot لمخرجات pieces/glass/accessories/operations.
4. توحيد config model (AssemblyTree) مع الحفاظ على UI الحالي.
5. نقل قاعدة واحدة في كل مرة (Glazing ثم Cut ثم Compatibility).

## 6) Exit Criteria Per Phase
- لا Regression في:
- عدد القطع
- أطوال القص
- كميات الزجاج
- كميات الإكسسوارات
- حالة النواقص مقارنة بالمخزون
- وجود test coverage على النواة المتأثرة.
- وجود ملخص تغيير واضح بعد كل مهمة.

