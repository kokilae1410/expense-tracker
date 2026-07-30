// Shared helper functions used across pages.

function getStoredUser() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
}

function setStoredToken(token) {
  if (token) localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
}

function clearSession() {
  localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
  localStorage.removeItem(APP_CONFIG.USER_KEY);
}

function formatCurrency(amount, currency) {
  const cur = currency || (getStoredUser() && getStoredUser().currency) || 'INR';
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[cur] || cur + ' ';
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

// Guards a private page: redirects to /login.html if no session is found,
// then verifies the session against the server. Returns the user object.
async function requireAuth() {
  const cached = getStoredUser();
  if (!cached) {
    window.location.href = '/login.html';
    return null;
  }
  try {
    const res = await api.get('/auth/me');
    setStoredUser(res.user);
    return res.user;
  } catch (err) {
    clearSession();
    window.location.href = '/login.html';
    return null;
  }
}

async function logoutUser() {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // ignore network errors on logout
  }
  clearSession();
  window.location.href = '/login.html';
}
