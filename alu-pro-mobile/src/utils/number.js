export const parseArabicNum = (value) => {
  if (!value && value !== 0) return 0

  const englishString = String(value)
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
    .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
    .replace(/٫/g, '.')
    .replace(/،/g, '.')
    .replace(/,/g, '.')

  return parseFloat(englishString) || 0
}
