# AluPro Mobile

نسخة جوال مستقلة من مشروع AluPro، مبنية بـ React + Vite + Capacitor.

المشروع هنا منفصل تمامًا عن نسخة سطح المكتب، لذلك أي تطوير أو بناء للجوال لن يغير مشروع Electron الأصلي.

## التشغيل المحلي

```bash
npm install
npm run dev
```

## تجهيز iPhone على macOS

```bash
npm run cap:ios:sync
npm run cap:ios
```

إذا كنت تريد فقط تحديث ملفات iOS بدون فتح Xcode:

```bash
npm run cap:ios:sync
```

## التشخيص

```bash
npm run cap:doctor
```

## مسار مشروع Xcode

```text
ios/App/App.xcodeproj
```

ملاحظة: تشغيل تطبيق iPhone فعليًا يحتاج macOS و Xcode. على ويندوز يمكنك تطوير الواجهة ومزامنة المشروع، لكن الإقلاع النهائي على Simulator أو iPhone يجب أن يتم من جهاز Mac.
