<<<<<<< HEAD
# Ultra Frame Platform

Production-grade full-stack website and operations platform for **Ultra Frame** (Metal Industries), built with **Next.js + TypeScript + Tailwind + Supabase**.

## 1) Overview

The platform contains 4 layers:

1. Public marketing website (Arabic-first, bilingual)
2. Client portal (**Ultra-Track**) for project progress visibility
3. Internal admin workspace for operations
4. Internal estimator workspace with PDF proposal generation

## 2) Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn-style reusable UI components
- Framer Motion
- Lucide React
- Supabase (PostgreSQL, Auth, Storage, RLS)
- React Hook Form + Zod
- @react-pdf/renderer for proposal PDFs

## 3) Key Routes

### Public
- `/`
- `/about`
- `/services`
- `/services/aluminum`
- `/services/steel`
- `/services/glass`
- `/portfolio`
- `/portfolio/[slug]`
- `/technical-library`
- `/technical-library/profiles`
- `/technical-library/glass`
- `/technical-library/finishes`
- `/quote-request`
- `/field-visit`
- `/maintenance-request`
- `/contact`
- `/login`

### Client Portal
- `/portal`
- `/portal/projects`
- `/portal/projects/[projectId]`
- `/portal/documents`
- `/portal/schedule`
- `/portal/warranty`
- `/portal/maintenance`
- `/portal/profile`

### Admin
- `/admin`
- `/admin/leads`
- `/admin/quotes`
- `/admin/projects`
- `/admin/projects/[projectId]`
- `/admin/clients`
- `/admin/portfolio`
- `/admin/technical-library`
- `/admin/maintenance`
- `/admin/settings`
- `/admin/estimator`

## 4) Project Structure

```text
app/
  api/
  admin/
  portal/
  ...public pages
components/
  admin/
  forms/
  layout/
  portal/
  sections/
  ui/
lib/
  auth/
  i18n/
  pdf/
  permissions/
  services/
  supabase/
  utils/
  validations/
messages/
  ar.json
  en.json
supabase/
  migrations/
  seed.sql
types/
```

## 5) Local Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env.local
```

3. Fill required Supabase variables in `.env.local`

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Run development server

```bash
npm run dev
```

## 6) Database Setup (Supabase)

1. Open Supabase SQL Editor.
2. Run migration files in order:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_auth_helpers.sql`
- `supabase/migrations/003_fix_client_project_rls.sql`
- `supabase/migrations/004_fix_rls_helper_functions.sql`

3. Run demo seed:

- `supabase/seed.sql`

4. Arabic guided setup:

- `supabase/SETUP_AR.md`

5. Optional live verification scripts:

```bash
npm run verify:supabase
npm run check:supabase-live
npm run seed:supabase-live
```

## 7) Auth Setup

- Authentication uses Supabase Auth email/password.
- Create users from Supabase Auth dashboard.
- Add matching rows in `public.profiles` with roles:
  - `admin`
  - `staff`
  - `client`

## 8) Storage Setup

Buckets are provisioned in migration SQL:

- `lead-attachments`
- `field-visit-attachments`
- `project-documents`
- `maintenance-uploads`
- `portfolio-images`
- `technical-library-files`
- `proposal-pdfs`

Adjust bucket names via environment variables if required.

## 9) Notifications

Notification architecture lives in:

- `lib/services/notifications.ts`

Current implementation supports real providers:

- WhatsApp via Twilio
- SMS via Twilio
- Email via Resend

If provider credentials are missing, the system falls back safely to mock mode.

Required environment variables for real providers:

- `NOTIFY_WHATSAPP_ENABLED=true`
- `WHATSAPP_TWILIO_ACCOUNT_SID`
- `WHATSAPP_TWILIO_AUTH_TOKEN`
- `WHATSAPP_PROVIDER_SENDER`
- `NOTIFY_SMS_ENABLED=true`
- `SMS_TWILIO_ACCOUNT_SID`
- `SMS_TWILIO_AUTH_TOKEN`
- `SMS_PROVIDER_SENDER`
- `NOTIFY_EMAIL_ENABLED=true`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## 10) PDF Proposal Generator

- API endpoint: `POST /api/proposals/generate`
- PDF template: `lib/pdf/proposal-document.tsx`
- Used by admin estimator page (`/admin/estimator`)

## 11) i18n

- Arabic is default
- English is secondary
- Locale is cookie-based (`ultra_locale`)
- Translation files:
  - `messages/ar.json`
  - `messages/en.json`

## 12) Demo Data

Demo content is available in:

- `lib/services/demo-data.ts`

Fallback mode is used automatically if Supabase environment variables are missing.

### Import Real Company Data

1. Export current live content to editable file:

```bash
npm run export:company-content
```

2. Edit `data/company-content.json`.
3. Import to Supabase:

```bash
npm run import:company-content
```

Alternative (first-time template):

1. Copy:

```bash
copy data\\company-content.template.json data\\company-content.json
```

4. Edit `data/company-content.json` with real company content (contact, portfolio, technical library).
5. Run:

```bash
npm run import:company-content
```

## 13) Deployment Notes (Vercel)

1. Push repository to Git provider.
2. Import project in Vercel.
3. Add all env vars from `.env.example`.
4. Deploy preview:

```bash
npx vercel
```

5. For production:

```bash
npx vercel --prod
```

## 14) Future Improvements

1. Full CRUD server actions for admin entities (quotes/projects/library)
2. Real WhatsApp/SMS provider adapters
3. Rich document versioning + approvals
4. Advanced analytics dashboard and KPI reporting
5. Automated scheduled reminders for upcoming milestones

=======
# AluPro-Updates
تحديثات جديده
>>>>>>> a20523f216e8c17aecc9b845b2368dcddd57283d
