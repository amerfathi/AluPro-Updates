import { CompatibilityConstraintRule } from '../compatibility/CompatibilityConstraintRule.js'
import { CompatibilityRulesEngine } from '../compatibility/CompatibilityRulesEngine.js'

export const createDefaultCompatibilityRules = () => [
  new CompatibilityConstraintRule({
    id: 'frame-sliding-sash-compatibility',
    name: 'Sliding frame accepts only sliding/mixed sash modes',
    target: 'system',
    severity: 'error',
    priority: 10,
    when: {
      frameProfileType: 'sliding'
    },
    assertions: [
      {
        field: 'sashType',
        operator: 'in',
        value: ['sliding', 'mixed'],
        message: 'نظام الإطار السحاب يقبل الضلفة السحاب فقط (أو المختلط)، ولا يقبل الضلفة المفصلية.'
      }
    ]
  }),
  new CompatibilityConstraintRule({
    id: 'frame-fixed-sash-compatibility',
    name: 'Fixed frame accepts only fixed sash mode',
    target: 'system',
    severity: 'error',
    priority: 11,
    when: {
      frameProfileType: 'fixed'
    },
    assertions: [
      {
        field: 'sashType',
        operator: 'in',
        value: ['fixed'],
        message: 'النظام الثابت لا يقبل أقسام متحركة، يرجى اختيار تقسيم ثابت.'
      }
    ]
  }),
  new CompatibilityConstraintRule({
    id: 'glass-thickness-range-sliding',
    name: 'Sliding family glass thickness range',
    target: 'glass',
    severity: 'error',
    priority: 20,
    when: {
      profileFamily: 'sliding'
    },
    assertions: [
      {
        field: 'thicknessMm',
        operator: 'between',
        min: 4,
        max: 22,
        message: 'سمك الزجاج غير متوافق مع أنظمة السحاب (المسموح من 4 مم إلى 22 مم).'
      }
    ]
  }),
  new CompatibilityConstraintRule({
    id: 'accessory-roller-family',
    name: 'Roller accessories valid only for sliding family',
    target: 'accessory',
    severity: 'error',
    priority: 30,
    when: {
      accessoryType: 'roller'
    },
    assertions: [
      {
        field: 'profileFamily',
        operator: 'in',
        value: ['sliding'],
        message: 'الإكسسوار من نوع بكرة/كفرات سحاب لا يعمل إلا مع عائلة قطاعات السحاب.'
      }
    ]
  }),
  new CompatibilityConstraintRule({
    id: 'hardware-opening-direction',
    name: 'Opening direction must match hardware option',
    target: 'hardware',
    severity: 'error',
    priority: 40,
    when: {
      openingDirection: ['left', 'right']
    },
    assertions: [
      {
        field: 'openingDirection',
        operator: 'inFieldArray',
        fieldRef: 'supportedOpeningDirections',
        message: 'اتجاه الفتح المختار غير متوافق مع خيار الهاردوير المحدد.'
      }
    ]
  })
]

export const createDefaultCompatibilityRulesEngine = () =>
  new CompatibilityRulesEngine({
    rules: createDefaultCompatibilityRules()
  })
