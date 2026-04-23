-- Ultra Frame seed content

delete from public.portfolio_images
where portfolio_project_id in (
  select id
  from public.portfolio_projects
  where slug in ('riyadh-villa-thermal-series', 'industrial-plant-steel-gates', 'commercial-tower-curtain-wall')
);

delete from public.portfolio_projects
where slug in ('riyadh-villa-thermal-series', 'industrial-plant-steel-gates', 'commercial-tower-curtain-wall');

delete from public.technical_library_entries
where slug in ('uf-75-thermal', 'double-glazed-low-e', 'powder-coated-matte-black');

insert into public.portfolio_projects (slug, title_ar, title_en, category, summary_ar, summary_en, location, completion_year, featured, published)
values
  (
    'elite-business-park-facade-riyadh',
    'واجهة مجمع النخبة للأعمال - الرياض',
    'Elite Business Park Facade - Riyadh',
    'Commercial',
    'تنفيذ واجهات ألمنيوم وزجاج عالية الأداء لمجمع أعمال متعدد المباني مع متطلبات عزل حراري وصوتي دقيقة.',
    'Execution of high-performance aluminum and glass facades for a multi-building business park with strict thermal and acoustic targets.',
    'Riyadh',
    2025,
    true,
    true
  ),
  (
    'logistics-hub-steel-gates-dammam',
    'بوابات المجمع اللوجستي - الدمام',
    'Logistics Hub Steel Gates - Dammam',
    'Industrial',
    'تصنيع وتركيب بوابات حديدية ثقيلة وأنظمة حماية محيطية لمجمع لوجستي يعمل بنظام تشغيل عالي الكثافة.',
    'Fabrication and installation of heavy-duty steel gates and perimeter protection systems for a high-throughput logistics hub.',
    'Dammam',
    2024,
    true,
    true
  ),
  (
    'private-villa-thermal-systems-jeddah',
    'فيلا خاصة بأنظمة حرارية - جدة',
    'Private Villa Thermal Systems - Jeddah',
    'Residential',
    'توريد وتركيب نوافذ وأبواب ألمنيوم حرارية بزجاج مزدوج مع تفاصيل تنفيذ تحافظ على الهوية المعمارية للمشروع.',
    'Supply and installation of thermal aluminum windows and doors with double glazing while preserving the project’s architectural identity.',
    'Jeddah',
    2026,
    true,
    true
  )
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  category = excluded.category,
  summary_ar = excluded.summary_ar,
  summary_en = excluded.summary_en,
  location = excluded.location,
  completion_year = excluded.completion_year,
  featured = excluded.featured,
  published = excluded.published;

insert into public.technical_library_entries (entry_type, slug, title_ar, title_en, summary_ar, summary_en, specs_json, published)
values
  (
    'profiles',
    'uf-90-thermal-hi',
    'UF-90 نظام حراري عالي العزل',
    'UF-90 High Insulation Thermal System',
    'نظام واجهات ونوافذ للمشاريع التي تتطلب كفاءة طاقة أعلى ومقاومة مناخية قوية.',
    'Facade and window system for projects requiring elevated energy efficiency and weather resistance.',
    '{"Depth":"90 mm","Glazing":"28-52 mm","Air Tightness":"Class 4","Water Tightness":"E1200"}',
    true
  ),
  (
    'glass',
    'triple-silver-low-e-laminated',
    'زجاج Low-E ثلاثي الفضة مع طبقة أمان',
    'Triple Silver Low-E Laminated Glass',
    'خيار متقدم لتقليل الكسب الحراري الشمسي ورفع الأمان الصوتي والإنشائي.',
    'Advanced option to reduce solar heat gain and improve acoustic and safety performance.',
    '{"Thickness":"8+16+8 mm","U-Value":"1.2 W/m²K","SHGC":"0.28","Acoustic":"40 dB"}',
    true
  ),
  (
    'finishes',
    'marine-grade-powder-coat',
    'دهان بودرة بدرجة حماية بحرية',
    'Marine Grade Powder Coating',
    'تشطيب معدني مخصص للبيئات الرطبة والساحلية مع مقاومة تآكل طويلة الأمد.',
    'Metal finish engineered for humid and coastal environments with long-term corrosion resistance.',
    '{"Coating":"80-100 µm","Standard":"Qualicoat Seaside","Salt Spray":"1500h"}',
    true
  )
on conflict (slug) do update set
  entry_type = excluded.entry_type,
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  summary_ar = excluded.summary_ar,
  summary_en = excluded.summary_en,
  specs_json = excluded.specs_json,
  published = excluded.published;

insert into public.site_settings (key, value_json)
values
  (
    'general',
    '{
      "brand":"Ultra Frame",
      "defaultLanguage":"ar",
      "secondaryLanguage":"en",
      "taglineAr":"حلول هندسية دقيقة في الألمنيوم والحديد والزجاج",
      "taglineEn":"Precision engineering solutions in aluminum, steel, and glass"
    }'::jsonb
  ),
  (
    'contact',
    '{
      "city":"Riyadh",
      "country":"Saudi Arabia",
      "addressAr":"الرياض، المملكة العربية السعودية",
      "addressEn":"Riyadh, Saudi Arabia",
      "phone":"+966 55 000 0000",
      "whatsapp":"+966 55 000 0000",
      "email":"hello@ultraframe.sa",
      "workingHoursAr":"الأحد - الخميس، 8:00 ص - 6:00 م",
      "workingHoursEn":"Sun - Thu, 8:00 AM - 6:00 PM",
      "mapLabelAr":"موقع الشركة على الخريطة",
      "mapLabelEn":"Company location on map"
    }'::jsonb
  )
on conflict (key) do update set
  value_json = excluded.value_json,
  updated_at = now();
