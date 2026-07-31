// Reports page: daily / monthly / yearly tabs with charts and tables.

let reportChart = null;
let activeTab = 'daily';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;
  initLayout(user);

  document.getElementById('yearSelect').value = new Date().getFullYear();
  populateYearOptions();

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('dailyFrom').value = defaultFrom();
  document.getElementById('dailyTo').value = todayISO();
  document.getElementById('applyDailyRange').addEventListener('click', loadDailyReport);
  document.getElementById('yearSelect').addEventListener('change', loadMonthlyReport);

  await loadDailyReport();
});

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().split('T')[0];
}

function populateYearOptions() {
  const select = document.getElementById('yearSelect');
  const currentYear = new Date().getFullYear();
  select.innerHTML = '';
  for (let y = currentYear; y >= currentYear - 5; y -= 1) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.report-panel').forEach((p) => p.classList.add('hidden'));
  document.getElementById(`panel-${tab}`).classList.remove('hidden');

  if (tab === 'daily') loadDailyReport();
  if (tab === 'monthly') loadMonthlyReport();
  if (tab === 'yearly') loadYearlyReport();
}

function renderChart(labels, income, expense) {
  const ctx = document.getElementById('reportChart').getContext('2d');
  if (reportChart) reportChart.destroy();
  reportChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: income, backgroundColor: '#16a34a', borderRadius: 5 },
        { label: 'Expense', data: expense, backgroundColor: '#dc2626', borderRadius: 5 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderSummaryRow(income, expense) {
  document.getElementById('reportSummary').innerHTML = `
    <div class="summary-pill">Total Income: ${formatCurrency(income)}</div>
    <div class="summary-pill">Total Expense: ${formatCurrency(expense)}</div>
    <div class="summary-pill">Net: ${formatCurrency(income - expense)}</div>
  `;
}

async function loadDailyReport() {
  const from = document.getElementById('dailyFrom').value;
  const to = document.getElementById('dailyTo').value;
  try {
    const res = await api.get(`/reports/daily?from=${from}&to=${to}`);
    const labels = res.report.map((r) => r.date);
    const income = res.report.map((r) => r.income);
    const expense = res.report.map((r) => r.expense);

    renderChart(labels, income, expense);
    renderSummaryRow(income.reduce((a, b) => a + b, 0), expense.reduce((a, b) => a + b, 0));
    renderReportTable(res.report.map((r) => ({ label: r.date, income: r.income, expense: r.expense })));
  } catch (err) {
    notify.error(err.message || 'Failed to load daily report');
  }
}

async function loadMonthlyReport() {
  const year = document.getElementById('yearSelect').value;
  try {
    const res = await api.get(`/reports/monthly?year=${year}`);
    const labels = res.report.map((r) => r.label);
    const income = res.report.map((r) => r.income);
    const expense = res.report.map((r) => r.expense);

    renderChart(labels, income, expense);
    renderSummaryRow(income.reduce((a, b) => a + b, 0), expense.reduce((a, b) => a + b, 0));
    renderReportTable(res.report.map((r) => ({ label: r.label, income: r.income, expense: r.expense })));
  } catch (err) {
    notify.error(err.message || 'Failed to load monthly report');
  }
}

async function loadYearlyReport() {
  try {
    const res = await api.get('/reports/yearly');
    if (!res.report.length) {
      renderChart([], [], []);
      renderSummaryRow(0, 0);
      renderReportTable([]);
      return;
    }
    const labels = res.report.map((r) => String(r.year));
    const income = res.report.map((r) => r.income);
    const expense = res.report.map((r) => r.expense);

    renderChart(labels, income, expense);
    renderSummaryRow(income.reduce((a, b) => a + b, 0), expense.reduce((a, b) => a + b, 0));
    renderReportTable(res.report.map((r) => ({ label: String(r.year), income: r.income, expense: r.expense })));
  } catch (err) {
    notify.error(err.message || 'Failed to load yearly report');
  }
}

function renderReportTable(rows) {
  const tbody = document.getElementById('reportTableBody');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No data for this period</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${r.label}</td>
      <td class="amount-cell income">${formatCurrency(r.income)}</td>
      <td class="amount-cell expense">${formatCurrency(r.expense)}</td>
      <td>${formatCurrency(r.income - r.expense)}</td>
    </tr>
  `).join('');
}
