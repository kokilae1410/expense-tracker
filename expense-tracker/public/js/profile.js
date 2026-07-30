// User Profile page: update name/currency/budget goal, change password.

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;
  initLayout(user);
  hydrateProfile(user);
  buildColorSwatches(user.avatarColor);

  document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
  document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
});

function hydrateProfile(user) {
  document.getElementById('profileAvatar').textContent = initials(user.name);
  document.getElementById('profileAvatar').style.background = user.avatarColor;
  document.getElementById('profileNameDisplay').textContent = user.name;
  document.getElementById('profileEmailDisplay').textContent = user.email;

  document.getElementById('name').value = user.name;
  document.getElementById('currency').value = user.currency || 'INR';
  document.getElementById('monthlyBudgetGoal').value = user.monthlyBudgetGoal || '';
}

function buildColorSwatches(selected) {
  const container = document.getElementById('colorSwatches');
  container.innerHTML = AVATAR_COLORS.map((c) => `
    <div class="swatch ${c === selected ? 'selected' : ''}" style="background:${c}" data-color="${c}"></div>
  `).join('');
  container.querySelectorAll('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach((s) => s.classList.remove('selected'));
      sw.classList.add('selected');
    });
  });
}

function getSelectedColor() {
  const el = document.querySelector('.swatch.selected');
  return el ? el.dataset.color : AVATAR_COLORS[0];
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const currency = document.getElementById('currency').value;
  const monthlyBudgetGoal = parseFloat(document.getElementById('monthlyBudgetGoal').value) || 0;
  const avatarColor = getSelectedColor();

  const errEl = document.getElementById('err-name');
  errEl.textContent = '';
  if (name.length < 2) {
    errEl.textContent = 'Name must be at least 2 characters';
    return;
  }

  const btn = document.getElementById('profileSubmitBtn');
  btn.disabled = true;
  const original = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await api.put('/users/profile', { name, currency, monthlyBudgetGoal, avatarColor });
    setStoredUser(res.user);
    notify.success(res.message);
    hydrateProfile(res.user);
    document.getElementById('userChip').querySelector('.avatar').style.background = res.user.avatarColor;
    document.getElementById('userChip').querySelector('.avatar').textContent = initials(res.user.name);
    document.getElementById('userChip').querySelector('.user-name').textContent = res.user.name;
  } catch (err) {
    notify.error(err.message || 'Failed to update profile');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

async function handlePasswordSubmit(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  document.querySelectorAll('#passwordForm .field-error').forEach((el) => (el.textContent = ''));

  let valid = true;
  if (!currentPassword) {
    document.getElementById('err-currentPassword').textContent = 'Current password is required';
    valid = false;
  }
  if (!newPassword || newPassword.length < 6) {
    document.getElementById('err-newPassword').textContent = 'New password must be at least 6 characters';
    valid = false;
  }
  if (newPassword !== confirmNewPassword) {
    document.getElementById('err-confirmNewPassword').textContent = 'Passwords do not match';
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('passwordSubmitBtn');
  btn.disabled = true;
  const original = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await api.put('/users/change-password', { currentPassword, newPassword });
    notify.success(res.message);
    document.getElementById('passwordForm').reset();
  } catch (err) {
    notify.error(err.message || 'Failed to change password');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}
