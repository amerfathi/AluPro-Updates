import {
  Boxes,
  Building2,
  FileSignature,
  History,
  LayoutDashboard,
  Maximize,
  Package,
  Printer,
  Scissors,
  Settings
} from 'lucide-react'

export const appNavigation = [
  {
    title: 'مركز التحكم',
    items: [
      {
        id: 'dashboard',
        label: 'مركز التشغيل',
        icon: LayoutDashboard,
        description: 'ملخص واضح للمشاريع والمواد والجاهزية اليومية.'
      }
    ]
  },
  {
    title: 'سير العمل',
    items: [
      {
        id: 'quotation',
        label: 'التسعير',
        icon: FileSignature,
        description: 'العرض الأولي والتسعير قبل اعتماد التنفيذ.'
      },
      {
        id: 'project',
        label: 'ملف المشروع',
        icon: Building2,
        description: 'العقد وبيانات العميل والعناصر المعتمدة.'
      },
      {
        id: 'cutting',
        label: 'الإنتاج والقص',
        icon: Scissors,
        description: 'إدخال العناصر وتحويلها إلى احتياج إنتاج فعلي.'
      },
      {
        id: 'reports',
        label: 'تقارير الورشة',
        icon: Printer,
        description: 'أوامر الورشة وقوائم المواد وخرائط القص.'
      },
      {
        id: 'glass',
        label: 'قص الزجاج',
        icon: Maximize,
        description: 'تحسين ألواح الزجاج والألواح المسطحة.'
      }
    ]
  },
  {
    title: 'البيانات الفنية',
    items: [
      {
        id: 'inventory',
        label: 'المخزون',
        icon: Boxes,
        description: 'الخامات والبواقي والعجز والحالة الفعلية للمستودع.'
      },
      {
        id: 'profiles',
        label: 'الأنظمة الفنية',
        icon: Package,
        description: 'الكتالوج الفني والمعادلات والإكسسوارات.'
      },
      {
        id: 'history',
        label: 'الأرشيف',
        icon: History,
        description: 'المشاريع السابقة وسجل أوامر الإنتاج.'
      },
      {
        id: 'settings',
        label: 'الإعدادات',
        icon: Settings,
        description: 'بيانات الشركة وتفضيلات العمل العامة.'
      }
    ]
  }
]

export const flatNavigationItems = appNavigation.flatMap((section) => section.items)
