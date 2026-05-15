import { MachiningTemplate } from './MachiningTemplate.js'

export const createDefaultMachiningTemplates = () => [
  new MachiningTemplate({
    id: 'mach-lock-case-pocket',
    name: 'Lock-case machining',
    operationCode: 'LOCK_CASE_POCKET',
    targetType: 'accessory_kind',
    targetValues: ['lock'],
    targetMatchMode: 'exact',
    sectionTypes: ['sash'],
    referencePoint: {
      xAnchor: 'right',
      yAnchor: 'center',
      xOffsetMm: -80,
      yOffsetMm: 0
    },
    quantityModel: {
      mode: 'per_source_quantity',
      multiplier: 1
    },
    holePattern: {
      holesPerOperation: 1,
      spacingMm: 0
    }
  }),
  new MachiningTemplate({
    id: 'mach-hinge-hole-pattern',
    name: 'Hinge hole pattern',
    operationCode: 'HINGE_HOLE_PATTERN',
    targetType: 'accessory_kind',
    targetValues: ['hinge'],
    targetMatchMode: 'exact',
    sectionTypes: ['sash'],
    referencePoint: {
      xAnchor: 'left',
      yAnchor: 'top',
      xOffsetMm: 35,
      yOffsetMm: {
        metric: 'section_height_mm',
        operator: 'multiply',
        value: 0.15
      }
    },
    quantityModel: {
      mode: 'per_source_quantity',
      multiplier: 1
    },
    holePattern: {
      holesPerOperation: 4,
      spacingMm: 32
    }
  }),
  new MachiningTemplate({
    id: 'mach-handle-spindle',
    name: 'Handle spindle holes',
    operationCode: 'HANDLE_SPINDLE_HOLES',
    targetType: 'accessory_kind',
    targetValues: ['lock'],
    targetMatchMode: 'exact',
    sectionTypes: ['sash'],
    referencePoint: {
      xAnchor: 'right',
      yAnchor: 'center',
      xOffsetMm: -55,
      yOffsetMm: 0
    },
    quantityModel: {
      mode: 'per_source_quantity',
      multiplier: 1
    },
    holePattern: {
      holesPerOperation: 2,
      spacingMm: 43
    }
  }),
  new MachiningTemplate({
    id: 'mach-sash-drain-slots',
    name: 'Sash drain slots',
    operationCode: 'SASH_DRAIN_SLOTS',
    targetType: 'profile_role',
    targetValues: ['sash_'],
    targetMatchMode: 'prefix',
    sectionTypes: ['sash'],
    referencePoint: {
      xAnchor: 'left',
      yAnchor: 'bottom',
      xOffsetMm: 120,
      yOffsetMm: -20
    },
    quantityModel: {
      mode: 'per_source_quantity',
      multiplier: 1
    },
    holePattern: {
      holesPerOperation: 2,
      spacingMm: 250
    }
  })
]
