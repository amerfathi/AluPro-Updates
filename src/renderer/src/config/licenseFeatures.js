export const APP_FEATURE_CATALOG = [
  { id: 'dashboard', label: 'لوحة اليوم', description: 'عرض المؤشرات الرئيسية.' },
  { id: 'contracts', label: 'ملف العقد', description: 'إدارة بيانات العقد والعميل.' },
  { id: 'quotation', label: 'عرض العميل', description: 'العرض والطباعة للعميل.' },
  { id: 'production', label: 'أمر الإنتاج', description: 'إدخال المقاسات والإنتاج.' },
  { id: 'reports', label: 'تقارير الورشة', description: 'تقارير التشغيل والقص.' },
  { id: 'glass', label: 'قص الزجاج', description: 'خرائط قص الزجاج والألواح.' },
  { id: 'inventory', label: 'المخزون', description: 'إدارة رصيد الخامات.' },
  { id: 'procurement', label: 'المشتريات', description: 'نواقص المواد وأوامر الشراء.' },
  { id: 'archive', label: 'العقود والتنفيذ', description: 'أرشيف العقود وتتبع الحالات.' },
  { id: 'technical_catalog', label: 'الأنظمة الفنية', description: 'تعريف الأنظمة والقطاعات.' },
  { id: 'admin_settings', label: 'الإعدادات', description: 'إعدادات المؤسسة والنسخ.' }
]

export const APP_FEATURE_IDS = APP_FEATURE_CATALOG.map((feature) => feature.id)

const LEGACY_MANUFACTURING_FEATURES = ['bom', 'cut', 'machining']

const normalizeFeatureId = (value) => String(value || '').trim().toLowerCase()

export const buildLicenseFeatureAccess = (rawFeatures) => {
  const normalized = Array.isArray(rawFeatures)
    ? rawFeatures.map(normalizeFeatureId).filter(Boolean)
    : []
  const featureSet = new Set(normalized)

  const hasKnownUiFeature = APP_FEATURE_IDS.some((featureId) => featureSet.has(featureId))
  const hasLegacyFeatureOnly =
    !hasKnownUiFeature &&
    normalized.length > 0 &&
    normalized.some((featureId) => LEGACY_MANUFACTURING_FEATURES.includes(featureId))

  const unrestricted = normalized.length === 0 || hasLegacyFeatureOnly || !hasKnownUiFeature
  const hasAll = featureSet.has('all')

  const has = (featureId) => {
    const normalizedId = normalizeFeatureId(featureId)
    if (!normalizedId) return true
    if (hasAll) return true
    if (unrestricted) return true
    return featureSet.has(normalizedId)
  }

  return {
    enabledFeatures: normalized,
    unrestricted,
    has
  }
}
