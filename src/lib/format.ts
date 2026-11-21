export const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Acepta precios escritos como "2,50", "2.50" o "$ 2,50" (los teclados en español
 * suelen usar coma decimal y los inputs type="number" la descartan en algunos móviles).
 */
export const parsePrice = (raw: string) => {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return Number.NaN;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSeparator = lastComma > lastDot ? ',' : '.';
  const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
  const normalized = cleaned.split(thousandsSeparator).join('').replace(decimalSeparator, '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : Number.NaN;
};

/**
 * Convierte números venezolanos escritos en formato local (0414-1234567) al formato
 * internacional que exige wa.me (584141234567). Si ya trae código de país, lo respeta.
 */
export const normalizeWhatsApp = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return `58${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('4')) return `58${digits}`;
  return digits;
};

export const buildWhatsAppMessage = (
  storeName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
) => {
  const lines = items.map((item) => `• ${item.quantity} x ${item.name} — ${formatMoney(item.quantity * item.price)}`);
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return `Hola ${storeName}, quiero realizar este pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatMoney(total)}\n\n¿Podrían confirmarme la disponibilidad?`;
};

export const buildWhatsAppLink = (phone: string, message: string) =>
  `https://wa.me/${normalizeWhatsApp(phone)}?text=${encodeURIComponent(message)}`;

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'CF';
