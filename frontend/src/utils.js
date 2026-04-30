export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

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

export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('user-updated'));
};

export const imageSrc = (path) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};