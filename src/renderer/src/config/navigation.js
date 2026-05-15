import { Boxes, FileSignature, History, LayoutDashboard, Package, Scissors } from 'lucide-react'

export const appNavigation = [
  {
    title: 'لوحة اليوم',
    items: [
      {
        id: 'dashboard',
        label: 'لوحة اليوم',
        icon: LayoutDashboard,
        description: 'المهام الحالية، جاهزية الورشة، وما يحتاج قرارًا اليوم.'
      }
    ]
  },
  {
    title: 'دورة العمل',
    items: [
      {
        id: 'contracts_hub',
        label: 'ملف العقد',
        icon: FileSignature,
        description: 'العميل، البنود، التسعير، الدفعات، والعرض النهائي للعميل.'
      },
      {
        id: 'production_hub',
        label: 'أمر الإنتاج',
        icon: Scissors,
        description: 'المقاسات، التجميع الذكي، المواد، التقارير، والزجاج في مكان واحد.'
      },
      {
        id: 'execution_hub',
        label: 'العقود والتنفيذ',
        icon: History,
        description: 'متابعة العقود تحت التشغيل والمكتملة وسير الإنجاز الفعلي.'
      }
    ]
  },
  {
    title: 'المواد والإدارة',
    items: [
      {
        id: 'materials_hub',
        label: 'المواد والمشتريات',
        icon: Boxes,
        description: 'المخزون الفعلي، البواقي، ومركز نواقص الشراء للمورد.'
      },
      {
        id: 'admin_hub',
        label: 'الإدارة الفنية',
        icon: Package,
        description: 'الأنظمة الفنية، قاعدة البيانات، وإعدادات المؤسسة.'
      }
    ]
  }
]

export const flatNavigationItems = appNavigation.flatMap((section) => section.items)
