// Handles login and register form logic. Runs on login.html / register.html.

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById('err-' + inputId);
  if (input) input.classList.add('input-error');
  if (errEl) errEl.textContent = message;
}

function clearFormErrors(form) {
  form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
}

function setButtonLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span>' : label;
}

// Redirect already-logged-in users straight to the dashboard
(function redirectIfLoggedIn() {
  const user = getStoredUser();
  const onAuthPage = /login\.html$|register\.html$|^\/$|index\.html$/.test(window.location.pathname);
  if (user && onAuthPage) {
    window.location.href = '/dashboard.html';
  }
})();

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(loginForm);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    if (!email) { showFieldError('email', 'Email is required'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('email', 'Enter a valid email address'); valid = false; }
    if (!password) { showFieldError('password', 'Password is required'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('loginBtn');
    setButtonLoading(btn, true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setStoredToken(res.token);
      setStoredUser(res.user);
      notify.success(res.message);
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 400);
    } catch (err) {
      notify.error(err.message || 'Login failed');
      setButtonLoading(btn, false, 'Log In');
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(registerForm);

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let valid = true;
    if (!name || name.length < 2) { showFieldError('name', 'Name must be at least 2 characters'); valid = false; }
    if (!email) { showFieldError('email', 'Email is required'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('email', 'Enter a valid email address'); valid = false; }
    if (!password || password.length < 6) { showFieldError('password', 'Password must be at least 6 characters'); valid = false; }
    if (password !== confirmPassword) { showFieldError('confirmPassword', 'Passwords do not match'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('registerBtn');
    setButtonLoading(btn, true);

    try {
      const res = await api.post('/auth/register', { name, email, password });
      setStoredToken(res.token);
      setStoredUser(res.user);
      notify.success(res.message);
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 400);
    } catch (err) {
      if (err.errors && err.errors.length) {
        err.errors.forEach((fe) => showFieldError(fe.field, fe.message));
      }
      notify.error(err.message || 'Registration failed');
      setButtonLoading(btn, false, 'Create Account');
    }
  });
}
