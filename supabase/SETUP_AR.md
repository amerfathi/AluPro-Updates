# إعداد Supabase لمشروع Ultra Frame

هذا الدليل ينفذ الربط الفعلي للمشروع خلال دقائق.

## 1) إنشاء مشروع Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard).
2. أنشئ Project جديد.
3. انتظر حتى يكتمل الإنشاء.

## 2) تعبئة متغيرات البيئة

افتح الملف:

- `C:\Users\IMDAD\Desktop\ULTRA FRAME SITE\.env.local`

ثم أضف القيم التالية من **Project Settings > API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (مهم جدًا للعمليات الخلفية ورفع الملفات)

## 3) تنفيذ SQL في Supabase

من **SQL Editor** نفّذ بالترتيب:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_helpers.sql`
3. `supabase/seed.sql`
4. `supabase/migrations/003_fix_client_project_rls.sql`
5. `supabase/migrations/004_fix_rls_helper_functions.sql`

## 4) إنشاء مستخدمي الدخول

من **Authentication > Users**:

1. أنشئ مستخدم Admin (Email + Password).
2. أنشئ مستخدم Client (Email + Password).

> بعد `002_auth_helpers.sql` سيتم إنشاء `profiles` تلقائيًا كمستخدم `client`.

## 5) ترقية مستخدم الأدمن إلى admin

نفذ SQL التالي (بدّل الإيميل):

```sql
update public.profiles
set role = 'admin'
where email = 'admin@ultraframe.sa';
```

## 6) إنشاء سجل عميل وربطه بمشروع (اختياري للاختبار الكامل)

```sql
insert into public.clients (profile_id, company_name)
select id, 'Demo Client Company'
from public.profiles
where email = 'client@ultraframe.sa'
on conflict do nothing;
```

## 7) تشغيل الموقع

من نفس مجلد المشروع:

```bash
npm run dev
```

## 8) اختبار المسارات

- Admin: `/admin`
- Client Portal: `/portal`
- Quote Form: `/quote-request`
- Field Visit: `/field-visit`
- Maintenance: `/maintenance-request`

## 9) ملاحظات مهمة

- لا تشارك `SUPABASE_SERVICE_ROLE_KEY`.
- أي تعديل على `.env.local` يتطلب إعادة تشغيل السيرفر.
- إذا ظهرت بيانات تجريبية فقط، تحقق من صحة مفاتيح Supabase في `.env.local`.
