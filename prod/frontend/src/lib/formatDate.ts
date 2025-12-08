export function formatDate(value?: string | null, locale = 'ru-RU', fallback = 'Не указана') {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  try {
    return d.toLocaleDateString(locale);
  } catch (e) {
    return fallback;
  }
}

export default formatDate;
