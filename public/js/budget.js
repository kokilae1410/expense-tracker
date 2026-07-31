// Budget Planning page: set per-category monthly budgets, view spend + alerts.

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;
  initLayout(user);

  populateBudgetMonthSelector();
  populateBudgetCategorySelect();

  document.getElementById('budgetMonthSelect').addEventListener('change', loadBudgets);
  document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);

  await loadBudgets();
});

function populateBudgetMonthSelector() {
  const select = document.getElementById('budgetMonthSelect');
  const now = new Date();
  select.innerHTML = '';
  for (let i = -2; i <= 3; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (i === 0) opt.selected = true;
    select.appendChild(opt);
  }
}

function populateBudgetCategorySelect() {
  const select = document.getElementById('budgetCategory');
  select.innerHTML = EXPENSE_CATEGORIES.map((c) => `<option value="${c}">${CATEGORY_ICONS[c] || ''} ${c}</option>`).join('');
}

function getSelectedMonthYear() {
  const [year, month] = document.getElementById('budgetMonthSelect').value.split('-').map(Number);
  return { month, year };
}

async function handleBudgetSubmit(e) {
  e.preventDefault();
  const category = document.getElementById('budgetCategory').value;
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  const { month, year } = getSelectedMonthYear();

  const errEl = document.getElementById('err-budgetLimit');
  errEl.textContent = '';

  if (!limit || limit <= 0) {
    errEl.textContent = 'Enter a budget limit greater than 0';
    return;
  }

  const btn = document.getElementById('budgetSubmitBtn');
  btn.disabled = true;
  const original = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await api.post('/budgets', { category, month, year, limit });
    notify.success(res.message);
    document.getElementById('budgetLimit').value = '';
    await loadBudgets();
  } catch (err) {
    notify.error(err.message || 'Failed to save budget');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

async function loadBudgets() {
  const { month, year } = getSelectedMonthYear();
  const grid = document.getElementById('budgetGrid');
  grid.innerHTML = `<p class="text-muted">Loading budgets...</p>`;

  try {
    const res = await api.get(`/budgets?month=${month}&year=${year}`);
    if (!res.budgets.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>No budgets set for this month yet. Add one above!</p></div>`;
      return;
    }

    grid.innerHTML = res.budgets.map((b) => `
      <div class="budget-card">
        <div class="budget-card-top">
          <h4>${CATEGORY_ICONS[b.category] || ''} ${escapeHtmlB(b.category)}</h4>
          <span class="badge ${b.status}">${b.status === 'ok' ? 'On Track' : b.status === 'warning' ? 'Warning' : 'Exceeded'}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${b.status !== 'ok' ? b.status : ''}" style="width: ${Math.min(b.percentUsed, 100)}%"></div>
        </div>
        <div class="budget-meta">
          <span>${formatCurrency(b.spent)} of ${formatCurrency(b.limit)}</span>
          <span>${b.percentUsed}%</span>
        </div>
        <div class="flex gap-8" style="margin-top: 12px;">
          <button class="btn btn-secondary btn-sm w-full" onclick="deleteBudgetItem('${b._id}')">Remove</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Failed to load budgets</div>`;
    notify.error(err.message || 'Failed to load budgets');
  }
}

async function deleteBudgetItem(id) {
  if (!window.confirm('Remove this budget?')) return;
  try {
    const res = await api.delete(`/budgets/${id}`);
    notify.success(res.message);
    await loadBudgets();
  } catch (err) {
    notify.error(err.message || 'Failed to remove budget');
  }
}

function escapeHtmlB(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
