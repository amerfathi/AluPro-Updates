export const FEATURE_CATALOG = [
  { id: 'dashboard', label: 'لوحة اليوم', description: 'عرض مؤشرات التشغيل الرئيسية.' },
  { id: 'contracts', label: 'ملف العقد', description: 'إدارة بيانات العقد والعميل.' },
  { id: 'quotation', label: 'عرض العميل', description: 'عروض الأسعار والطباعة.' },
  { id: 'production', label: 'أمر الإنتاج', description: 'إدخال المقاسات وأمر التصنيع.' },
  { id: 'reports', label: 'تقارير الورشة', description: 'تقارير التقطيع والتكلفة.' },
  { id: 'glass', label: 'قص الزجاج', description: 'خريطة قص الزجاج والألواح.' },
  { id: 'inventory', label: 'المخزون', description: 'متابعة رصيد الخامات.' },
  { id: 'procurement', label: 'المشتريات', description: 'إدارة نواقص المواد.' },
  { id: 'archive', label: 'العقود والتنفيذ', description: 'أرشيف العقود وحالات التنفيذ.' },
  { id: 'technical_catalog', label: 'الأنظمة الفنية', description: 'تعريف القطاعات والقواعد.' },
  { id: 'admin_settings', label: 'الإعدادات', description: 'إعدادات المؤسسة والنسخ.' }
]

export const DEFAULT_LICENSE_FEATURES = FEATURE_CATALOG.map((feature) => feature.id)
