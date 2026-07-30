// Transaction History page: filtering, search, pagination, edit/delete.

let currentPage = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;
  initLayout(user);

  populateCategoryFilter();

  document.getElementById('addTransactionBtn').addEventListener('click', () => {
    openTransactionModal(null, () => loadTransactions(currentPage));
  });

  document.getElementById('filterType').addEventListener('change', () => {
    populateCategoryFilter();
    applyFilters();
  });
  document.getElementById('filterCategory').addEventListener('change', applyFilters);
  document.getElementById('filterDate').addEventListener('change', applyFilters);
  document.getElementById('filterMonth').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 400));
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

  await loadTransactions(1);
});

function populateCategoryFilter() {
  const type = document.getElementById('filterType').value;
  const select = document.getElementById('filterCategory');
  const categories = type === 'income' ? INCOME_CATEGORIES : type === 'expense' ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  const prevValue = select.value;
  select.innerHTML = '<option value="">All Categories</option>' + categories.map((c) => `<option value="${c}">${c}</option>`).join('');
  if (categories.includes(prevValue)) select.value = prevValue;
}

function applyFilters() {
  currentFilters = {
    type: document.getElementById('filterType').value,
    category: document.getElementById('filterCategory').value,
    date: document.getElementById('filterDate').value,
    month: document.getElementById('filterMonth').value,
    q: document.getElementById('searchInput').value.trim(),
  };
  // date and month searches are mutually exclusive with each other
  if (currentFilters.date) currentFilters.month = '';
  loadTransactions(1);
}

function clearFilters() {
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterDate').value = '';
  document.getElementById('filterMonth').value = '';
  document.getElementById('searchInput').value = '';
  populateCategoryFilter();
  currentFilters = {};
  loadTransactions(1);
}

async function loadTransactions(page) {
  currentPage = page;
  const tbody = document.getElementById('txTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Loading...</td></tr>`;

  const params = new URLSearchParams({ page, limit: 15 });
  Object.entries(currentFilters).forEach(([k, v]) => { if (v) params.set(k, v); });

  try {
    const res = await api.get(`/transactions?${params.toString()}`);
    renderTransactions(res.transactions);
    renderPagination(res.page, res.pages, res.total);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Failed to load transactions</td></tr>`;
    notify.error(err.message || 'Failed to load transactions');
  }
}

function renderTransactions(transactions) {
  const tbody = document.getElementById('txTableBody');
  if (!transactions.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🔍</div><p>No transactions match your filters</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map((t) => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td>${CATEGORY_ICONS[t.category] || ''} ${escapeHtml2(t.category)}</td>
      <td><span class="badge ${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</span></td>
      <td>${escapeHtml2(t.description) || '<span class="text-muted">—</span>'}</td>
      <td class="amount-cell ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" title="Edit" onclick='editTx("${t._id}")'>✏️</button>
          <button class="btn-icon" title="Delete" onclick='deleteTx("${t._id}")'>🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

let transactionCache = {};

function editTx(id) {
  api.get(`/transactions/${id}`).then((res) => {
    openTransactionModal(res.transaction, () => loadTransactions(currentPage));
  }).catch((err) => notify.error(err.message || 'Failed to load transaction'));
}

function deleteTx(id) {
  confirmDeleteTransaction(id, () => loadTransactions(currentPage));
}

function renderPagination(page, pages, total) {
  const el = document.getElementById('pagination');
  if (pages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <button class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="loadTransactions(${page - 1})">← Prev</button>
    <span>Page ${page} of ${pages} (${total} total)</span>
    <button class="btn btn-secondary btn-sm" ${page >= pages ? 'disabled' : ''} onclick="loadTransactions(${page + 1})">Next →</button>
  `;
}

function escapeHtml2(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
