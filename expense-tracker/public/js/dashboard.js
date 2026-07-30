// Dashboard page logic: summary stats, charts, recent transactions, budget alerts.

let trendChart = null;
let pieChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;
  initLayout(user);

  document.getElementById('addTransactionBtn').addEventListener('click', () => {
    openTransactionModal(null, loadDashboard);
  });

  await loadDashboard();
});

async function loadDashboard() {
  await Promise.all([
    loadSummary(),
    loadRecent(),
    loadTrendChart(),
    loadCategoryChart(),
    loadBudgetAlerts(),
  ]);
}

async function loadSummary() {
  try {
    const res = await api.get('/transactions/summary');
    document.getElementById('totalIncome').textContent = formatCurrency(res.totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(res.totalExpense);
    document.getElementById('balance').textContent = formatCurrency(res.balance);
    document.getElementById('monthExpense').textContent = formatCurrency(res.monthExpense);
  } catch (err) {
    notify.error(err.message || 'Failed to load summary');
  }
}

async function loadRecent() {
  const list = document.getElementById('recentList');
  try {
    const res = await api.get('/transactions/recent?limit=6');
    if (!res.transactions.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🗒️</div><p>No transactions yet. Add your first one!</p></div>`;
      return;
    }
    list.innerHTML = res.transactions.map((t) => `
      <li>
        <div class="recent-item-left">
          <div class="cat-icon">${CATEGORY_ICONS[t.category] || '💳'}</div>
          <div>
            <div class="recent-item-title">${escapeHtml(t.category)}</div>
            <div class="recent-item-sub">${escapeHtml(t.description || '')} · ${formatDate(t.date)}</div>
          </div>
        </div>
        <div class="amount-cell ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</div>
      </li>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state">Failed to load recent transactions</div>`;
  }
}

async function loadTrendChart() {
  try {
    const res = await api.get('/transactions/monthly-trend?months=6');
    const ctx = document.getElementById('trendChart').getContext('2d');
    const labels = res.series.map((s) => s.label);
    const income = res.series.map((s) => s.income);
    const expense = res.series.map((s) => s.expense);

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Income', data: income, backgroundColor: '#16a34a', borderRadius: 6 },
          { label: 'Expense', data: expense, backgroundColor: '#dc2626', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch (err) {
    notify.error('Failed to load trend chart');
  }
}

async function loadCategoryChart() {
  try {
    const res = await api.get(`/transactions/category-breakdown?type=expense&month=${currentMonthValue()}`);
    const ctx = document.getElementById('pieChart').getContext('2d');
    const palette = ['#4f46e5', '#dc2626', '#d97706', '#16a34a', '#0891b2', '#db2777', '#7c3aed', '#65a30d', '#ea580c', '#0284c7'];

    if (pieChart) pieChart.destroy();

    if (!res.breakdown.length) {
      document.getElementById('pieChartEmpty').classList.remove('hidden');
      document.getElementById('pieChart').classList.add('hidden');
      return;
    }
    document.getElementById('pieChartEmpty').classList.add('hidden');
    document.getElementById('pieChart').classList.remove('hidden');

    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: res.breakdown.map((b) => b.category),
        datasets: [{ data: res.breakdown.map((b) => b.total), backgroundColor: palette }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      },
    });
  } catch (err) {
    notify.error('Failed to load category chart');
  }
}

async function loadBudgetAlerts() {
  const box = document.getElementById('budgetAlerts');
  try {
    const res = await api.get('/budgets');
    const alerts = res.budgets.filter((b) => b.status !== 'ok');
    if (!alerts.length) {
      box.classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');
    box.innerHTML = alerts.map((b) => `
      <div class="toast ${b.status === 'exceeded' ? 'error' : 'warning'}" style="position: static; margin-bottom: 8px; animation: none;">
        <span>${b.status === 'exceeded' ? '⚠️' : '🔔'}</span>
        <span><strong>${escapeHtml(b.category)}</strong>: ${b.percentUsed}% of budget used (${formatCurrency(b.spent)} / ${formatCurrency(b.limit)})</span>
      </div>
    `).join('');
  } catch (err) {
    box.classList.add('hidden');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
