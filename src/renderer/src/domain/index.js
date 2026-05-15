export { DomainValidationError } from './shared/DomainValidationError.js'

export { semanticZoneCatalog, semanticZoneIds, SemanticZone } from './profile/SemanticZone.js'
export { InterfaceDefinition, interfaceJoinTypes } from './profile/InterfaceDefinition.js'
export { ProfileGeometry } from './profile/ProfileGeometry.js'
export { ProfileFamily, profileFamilyIds } from './profile/ProfileFamily.js'
export { ProfileVariant } from './profile/ProfileVariant.js'

export { Accessory, accessoryCalcModes, accessorySectionTypes } from './materials/Accessory.js'

export {
  CompatibilityRule,
  compatibilityEffects,
  compatibilityScopes
} from './rules/CompatibilityRule.js'
export {
  AssemblyRule,
  assemblyRuleAttachTargets,
  assemblyRuleSources
} from './rules/AssemblyRule.js'
export {
  CutRule,
  cutJointAssumptions,
  cutRuleBaseDimensions,
  cutRuleScopes
} from './rules/CutRule.js'
export {
  CompatibilityConstraintRule,
  compatibilityAssertionOperators,
  compatibilityRuleSeverities,
  compatibilityRuleTargets
} from './rules/compatibility/CompatibilityConstraintRule.js'
export { ProfileCutRulesEngine } from './rules/cutting/ProfileCutRulesEngine.js'
export { CompatibilityRulesEngine } from './rules/compatibility/CompatibilityRulesEngine.js'
export { buildCompatibilityValidationContext } from './rules/compatibility/contextBuilders.js'
export {
  inferOpeningDemand,
  inferProfileCapabilities,
  assessProfileCompatibility,
  buildProfileSelectionPlan
} from './rules/compatibility/profileSelectionAdvisor.js'
export {
  createDefaultCompatibilityRules,
  createDefaultCompatibilityRulesEngine
} from './rules/fixtures/defaultCompatibilityRules.js'
export { createDefaultAssemblyRules } from './rules/fixtures/defaultAssemblyRules.js'
export { createDefaultProfileCutRules } from './rules/fixtures/defaultCutRules.js'

export { ConfiguredElement, configuredSectionTypes } from './configuration/ConfiguredElement.js'
export { AssemblyPartNode, AssemblyTree, assemblyPartTypes } from './configuration/AssemblyTree.js'
export { generateAssemblyTreeForTechnicalWindow } from './configuration/generateAssemblyTree.js'
export { BOMItem, bomItemKinds } from './bom/BOMItem.js'
export { generateBOMFromAssemblyTree } from './bom/generateBOMFromAssemblyTree.js'
export {
  adapt2DPreviewModelToLegacyVisualModel,
  generate2DPreviewModelFromAssemblyTree
} from './preview/generate2DPreviewModelFromAssemblyTree.js'
export {
  createProfileGeometryCatalog,
  createProfileGeometryFromLegacyProfile
} from './preview/profileGeometryCatalog.js'
export {
  MachiningTemplate,
  machiningAnchorsX,
  machiningAnchorsY,
  machiningQuantityModes,
  machiningTargetMatchModes,
  machiningTemplateTargetTypes
} from './machining/MachiningTemplate.js'
export { createDefaultMachiningTemplates } from './machining/defaultMachiningTemplates.js'
export { generateMachiningOperations } from './machining/generateMachiningOperations.js'
export {
  MVP_DEMO_SEED_ID,
  mvpDemoDataNotice,
  createMvpDemoInventory,
  createMvpDemoFrameFamily,
  createMvpDemoSashFamily,
  createMvpDemoProfileGeometry,
  createMvpDemoAccessories,
  createMvpDemoDomainSystem,
  createMvpDemoLegacySystem,
  createMvpDemoOpening,
  createMvpDemoGlazingRule,
  isMvpDemoGlassThicknessAllowed,
  createMvpDemoCompatibilityRules,
  createMvpDemoCompatibilityEngine,
  createMvpDemoCutRules,
  createMvpDemoMachiningTemplates
} from './seeds/mvpHingedDoorDemoSeed.js'

export { System } from './system/System.js'

export {
  createDefaultCompatibilityRulesForFamily,
  createProfileVariantFromLegacy,
  createSystemsFromLegacyProfiles
} from './adapters/fromLegacyProfile.js'
export { createConfiguredElementFromTechnicalInput } from './adapters/fromTechnicalSystemConfig.js'
export { evaluateProductionInputReadiness } from './configuration/productionInputAdvisor.js'
