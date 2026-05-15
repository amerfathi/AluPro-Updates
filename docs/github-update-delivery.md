# آلية تحديث ALU PRO عبر GitHub (بدون سيرفر خاص)

هذه الوثيقة تشرح طريقة التحديث للعملاء بحيث أي إصدار جديد يصل لهم تلقائيًا داخل البرنامج.

## ما هو الموجود بالفعل في المشروع

- البرنامج يستخدم `electron-updater` ويتحقق من التحديث عند التشغيل.
- إعداد النشر مضبوط على GitHub داخل `package.json`:
  - `owner: amerfathi`
  - `repo: AluPro-Updates`
- ملفات التحديث التي تُبنى تلقائيًا داخل `dist/`:
  - `AluPro Setup X.Y.Z.exe`
  - `latest.yml`
  - `AluPro Setup X.Y.Z.exe.blockmap`

## المتطلبات (مرة واحدة)

1. يكون مستودع التحديثات `AluPro-Updates` موجودًا على GitHub.
2. على جهاز البناء، ضع توكن GitHub بصلاحية `repo`:
   - PowerShell:
   ```powershell
   setx GH_TOKEN "ضع_التوكن_هنا"
   ```
3. افتح Terminal جديد بعد `setx`.

## النشر كل مرة تحديث

1. ارفع رقم النسخة في `package.json` (مثال: `2.0.8`).
2. نفذ أمر النشر المباشر:
   ```powershell
   npm run release:win:github
   ```
3. الأمر سيبني النسخة ويرفع ملفات التحديث إلى GitHub Releases تلقائيًا.

## ماذا يحدث عند العميل

- عند فتح البرنامج، يتم فحص التحديث.
- إذا وجد إصدار أحدث: يظهر إشعار التحديث.
- العميل يضغط تحميل، ثم إعادة تشغيل للتثبيت.

## ملاحظة مهمة

- لا تنشر تحديثين بنفس رقم النسخة.
- كل تحديث لازم رقم نسخة جديد.

## ربط التطوير اليومي مع GitHub

تم ربط هذا المشروع على الفرع: `aluapp-source` داخل الريبو `amerfathi/AluPro-Updates`.

لجعل أي تعديل في المشروع يذهب إلى GitHub مباشرة، لازم المشروع يكون مربوط بمستودع Git (local + remote) ثم:

```powershell
git add .
git commit -m "وصف التعديل"
git push
```

وبعدها عند تجهيز نسخة للعميل:

```powershell
npm run release:win:github
```
