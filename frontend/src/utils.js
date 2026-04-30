export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const imageSrc = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `http://localhost:5000${path}`;
};
