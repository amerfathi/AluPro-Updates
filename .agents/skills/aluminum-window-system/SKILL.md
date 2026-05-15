# Aluminum Window System Skill

## Purpose
يوجه أي Agent/Developer للعمل الصحيح داخل مشروع تصنيع الألومنيوم الحالي بدون كسر السلوك الإنتاجي.

## Use This Skill When
- المهمة تخص: أنظمة فنية، قص، BOM، مخزون، تجميع، زجاج، إكسسوارات.
- هناك تعديل في منطق الإنتاج أو التقارير المعتمدة علىه.
- نريد تطوير تدريجي بدل إعادة كتابة كاملة.

## Mandatory Inputs (Read First)
1. `AGENTS.md`
2. `docs/refactor-guardrails.md`
3. `docs/window-factory-domain.md`
4. `docs/domain-glossary.md`
5. `docs/target-domain-model.md`
6. `docs/migration-strategy.md`

## Core Rules
1. لا تعيد كتابة المشروع من الصفر.
2. لا تغيّر سلوكًا قائمًا إلا إذا كان داخل نطاق المهمة.
3. افصل الدومين عن UI تدريجيًا فقط.
4. استخدم تغييرات صغيرة ومراجعة.
5. أضف/حدّث اختبارات عند لمس منطق الأعمال.
6. لخص ما تم تغييره بعد كل مهمة.

## Domain Constraints
- Measurement-only:
- لا خصم مخزون ولا أوامر شراء.
- Contract-linked:
- يفعّل مقارنة المخزون، الاستهلاك، العجز، والشراء.
- نفس تعريف العنصر يجب أن ينتج:
- Preview
- BOM
- Cut List
- Operations

## Execution Workflow
1. استخرج النطاق والافتراضات.
2. حدد الملفات المتأثرة فعليًا.
3. نفّذ أقل تعديل ممكن.
4. شغّل التحقق/الاختبارات المتاحة.
5. قدّم ملخصًا قصيرًا:
- ما تم
- ما لم يتم
- المخاطر المتبقية

## Preferred Technical Direction
- توحيد input models إلى `ConfiguredElement/AssemblyTree`.
- تحويل `physicalRole` النصي تدريجيًا إلى `SemanticZone`.
- استخدام adapters فوق `utils/*` الحالية قبل أي إعادة تنظيم كبيرة.

## Anti-Patterns (Do Not Do)
- نسخ منطق الحساب نفسه في أكثر من ملف جديد.
- ربط قواعد الدومين مباشرة بمكونات العرض.
- تغيير schema أو data shape العام بدون حاجة حقيقية للمهمة.
- إزالة أجزاء عاملة فقط لأنها “قديمة”.

