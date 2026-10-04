/**
 * Data Formatters and Helper Utilities
 */

/**
 * Format currency value.
 * @param {number|string} amount
 * @param {string} currency - Default 'INR'
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00';
  }

  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Format numeric value with thousands separator.
 * @param {number|string} value
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(Number(value));
}

/**
 * Format date string to standard local date (e.g. 24 Sep 2026).
 * @param {string|Date} dateStr
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format datetime string (e.g. 24 Sep 2026, 14:30).
 * @param {string|Date} dateStr
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format percentage.
 * @param {number|string} value
 * @param {number} decimals
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Get status color scheme for status badges.
 * @param {string} status
 * @returns {'success'|'warning'|'danger'|'info'|'purple'|'neutral'}
 */
export function getStatusVariant(status) {
  if (!status) return 'neutral';
  const s = String(status).toUpperCase();

  // Success states
  if (['COMPLETED', 'DELIVERED', 'PAID', 'RECEIVED', 'ACTIVE', 'APPROVED', 'ACCEPTED'].includes(s)) {
    return 'success';
  }

  // Warning states
  if (['PENDING', 'PROCESSING', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'PARTIALLY_PAID', 'LOW_STOCK', 'IN_INSPECTION'].includes(s)) {
    return 'warning';
  }

  // Danger states
  if (['CANCELLED', 'FAILED', 'REJECTED', 'OVERDUE', 'DAMAGED', 'OUT_OF_STOCK', 'HIGH_RISK', 'INACTIVE'].includes(s)) {
    return 'danger';
  }

  // Info / Specialized states
  if (['CREATED', 'ORDERED', 'SHIPPED', 'REQUESTED'].includes(s)) {
    return 'info';
  }

  return 'neutral';
}

/**
 * Convert string to title case / clean label.
 * @param {string} str
 */
export function formatStatusLabel(str) {
  if (!str) return '—';
  return String(str)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}
