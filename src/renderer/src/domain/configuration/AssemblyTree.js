import { asArray, assertNonEmptyString, assertPositiveNumber } from '../shared/guards.js'
import { ConfiguredElement } from './ConfiguredElement.js'

export const assemblyPartTypes = Object.freeze([
  'element',
  'frame',
  'sash',
  'fixed_panel',
  'profile_piece',
  'glass',
  'gasket',
  'hinge',
  'lock',
  'accessory'
])

const normalizePartType = (value) => {
  const token = String(value || '')
    .trim()
    .toLowerCase()
  return assemblyPartTypes.includes(token) ? token : 'accessory'
}

export class AssemblyPartNode {
  constructor({
    id,
    partType,
    label = '',
    quantity = 1,
    sourceRef = {},
    metadata = {},
    children = []
  }) {
    this.id = assertNonEmptyString(String(id), 'assemblyNode.id')
    this.partType = normalizePartType(partType)
    this.label = typeof label === 'string' ? label.trim() : ''
    this.quantity = assertPositiveNumber(quantity, 'assemblyNode.quantity')
    this.sourceRef = Object.freeze({ ...(sourceRef || {}) })
    this.metadata = Object.freeze({ ...(metadata || {}) })
    this.children = Object.freeze(
      asArray(children).map((child, index) =>
        child instanceof AssemblyPartNode
          ? child
          : new AssemblyPartNode({
              id: child?.id || `${this.id}-child-${index + 1}`,
              ...child
            })
      )
    )

    Object.freeze(this)
  }

  toJSON() {
    return {
      id: this.id,
      partType: this.partType,
      label: this.label,
      quantity: this.quantity,
      sourceRef: { ...this.sourceRef },
      metadata: { ...this.metadata },
      children: this.children.map((child) => child.toJSON())
    }
  }
}

const flattenNodes = (node, collector = []) => {
  collector.push(node)
  node.children.forEach((child) => flattenNodes(child, collector))
  return collector
}

export class AssemblyTree {
  constructor({ id, configuredElement, root, metadata = {} }) {
    this.id = assertNonEmptyString(String(id), 'assemblyTree.id')
    this.configuredElement =
      configuredElement instanceof ConfiguredElement
        ? configuredElement
        : new ConfiguredElement(configuredElement || {})
    this.root =
      root instanceof AssemblyPartNode
        ? root
        : new AssemblyPartNode({
            id: root?.id || `${this.id}-root`,
            partType: root?.partType || 'element',
            ...root
          })
    this.metadata = Object.freeze({ ...(metadata || {}) })

    Object.freeze(this)
  }

  flatten() {
    return flattenNodes(this.root, [])
  }

  findByPartType(partType) {
    const requested = normalizePartType(partType)
    return this.flatten().filter((node) => node.partType === requested)
  }

  toJSON() {
    return {
      id: this.id,
      configuredElement: this.configuredElement.toJSON(),
      root: this.root.toJSON(),
      metadata: { ...this.metadata }
    }
  }
}
