import { AssemblyRule } from '../AssemblyRule.js'

export const createDefaultAssemblyRules = () => [
  new AssemblyRule({
    id: 'frame-formulas',
    name: 'Frame and mullion profile pieces',
    source: 'structuredFormulas',
    attachTo: 'frame',
    nodeType: 'profile_piece',
    priority: 10,
    match: {
      physicalRolePrefixes: ['frame', 'mullion']
    }
  }),
  new AssemblyRule({
    id: 'sash-formulas',
    name: 'Sash profile pieces',
    source: 'structuredFormulas',
    attachTo: 'sash',
    nodeType: 'profile_piece',
    priority: 20,
    match: {
      physicalRolePrefixes: ['sash', 'bead_sash']
    }
  }),
  new AssemblyRule({
    id: 'fixed-formulas',
    name: 'Fixed panel profile pieces',
    source: 'structuredFormulas',
    attachTo: 'fixed_panel',
    nodeType: 'profile_piece',
    priority: 21,
    match: {
      physicalRolePrefixes: ['bead_fixed']
    }
  }),
  new AssemblyRule({
    id: 'glass-sash',
    name: 'Sash glazing',
    source: 'glassFormulas',
    attachTo: 'sash',
    nodeType: 'glass',
    priority: 30,
    match: {
      physicalRolePrefixes: ['glass_sash']
    }
  }),
  new AssemblyRule({
    id: 'glass-fixed',
    name: 'Fixed glazing',
    source: 'glassFormulas',
    attachTo: 'fixed_panel',
    nodeType: 'glass',
    priority: 31,
    match: {
      physicalRolePrefixes: ['glass_fixed']
    }
  }),
  new AssemblyRule({
    id: 'accessory-gasket',
    name: 'Gasket mapping',
    source: 'accessories',
    attachTo: 'section',
    nodeType: 'gasket',
    priority: 40,
    match: {
      accessoryKinds: ['gasket'],
      accessorySectionTypes: ['all', 'sash', 'fixed']
    }
  }),
  new AssemblyRule({
    id: 'accessory-hinge',
    name: 'Hinge mapping',
    source: 'accessories',
    attachTo: 'sash',
    nodeType: 'hinge',
    priority: 41,
    match: {
      accessoryKinds: ['hinge'],
      accessorySectionTypes: ['all', 'sash']
    }
  }),
  new AssemblyRule({
    id: 'accessory-lock',
    name: 'Lock mapping',
    source: 'accessories',
    attachTo: 'sash',
    nodeType: 'lock',
    priority: 42,
    match: {
      accessoryKinds: ['lock', 'handle'],
      accessorySectionTypes: ['all', 'sash']
    }
  }),
  new AssemblyRule({
    id: 'accessory-generic',
    name: 'Related accessories mapping',
    source: 'accessories',
    attachTo: 'section',
    nodeType: 'accessory',
    priority: 99,
    match: {
      accessorySectionTypes: ['all', 'sash', 'fixed']
    }
  })
]
