// Reusable Add/Edit Transaction modal, shared between dashboard.html and
// transactions.html. Call openTransactionModal() to add, or
// openTransactionModal(transaction) to edit; pass onSaved callback.

let currentModalType = 'expense';
let editingTransactionId = null;
let onTransactionSaved = null;

function buildTransactionModal() {
  if (document.getElementById('txModalOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'txModalOverlay';
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 id="txModalTitle">Add Transaction</h3>
        <button class="btn-icon" id="txModalClose" type="button">✕</button>
      </div>
      <div class="type-toggle">
        <button type="button" class="income" data-type="income">💰 Income</button>
        <button type="button" class="expense" data-type="expense">💸 Expense</button>
      </div>
      <form id="txForm" novalidate>
        <div class="form-group">
          <label for="txAmount">Amount</label>
          <input type="number" id="txAmount" step="0.01" min="0.01" placeholder="0.00" required />
          <div class="field-error" id="err-txAmount"></div>
        </div>
        <div class="form-group">
          <label for="txCategory">Category</label>
          <select id="txCategory" required></select>
          <div class="field-error" id="err-txCategory"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="txDate">Date</label>
            <input type="date" id="txDate" required />
            <div class="field-error" id="err-txDate"></div>
          </div>
          <div class="form-group">
            <label for="txPaymentMethod">Payment Method</label>
            <select id="txPaymentMethod">
              <option>Cash</option>
              <option>Card</option>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="txDescription">Description (optional)</label>
          <textarea id="txDescription" rows="2" maxlength="200" placeholder="e.g. Grocery shopping"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="txCancelBtn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="txSubmitBtn">Save Transaction</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('txModalClose').addEventListener('click', closeTransactionModal);
  document.getElementById('txCancelBtn').addEventListener('click', closeTransactionModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTransactionModal();
  });

  overlay.querySelectorAll('.type-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => setModalType(btn.dataset.type));
  });

  document.getElementById('txForm').addEventListener('submit', handleTransactionSubmit);
}

function setModalType(type) {
  currentModalType = type;
  document.querySelectorAll('.type-toggle button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  const select = document.getElementById('txCategory');
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = categories.map((c) => `<option value="${c}">${CATEGORY_ICONS[c] || ''} ${c}</option>`).join('');
}

function clearTxErrors() {
  ['txAmount', 'txCategory', 'txDate'].forEach((id) => {
    const el = document.getElementById('err-' + id);
    if (el) el.textContent = '';
    const input = document.getElementById(id);
    if (input) input.classList.remove('input-error');
  });
}

function openTransactionModal(transaction, onSaved) {
  buildTransactionModal();
  clearTxErrors();
  onTransactionSaved = onSaved || null;
  editingTransactionId = transaction ? transaction._id : null;

  document.getElementById('txModalTitle').textContent = transaction ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('txSubmitBtn').textContent = transaction ? 'Update Transaction' : 'Save Transaction';

  setModalType(transaction ? transaction.type : 'expense');

  document.getElementById('txAmount').value = transaction ? transaction.amount : '';
  document.getElementById('txDate').value = transaction ? new Date(transaction.date).toISOString().split('T')[0] : todayISO();
  document.getElementById('txDescription').value = transaction ? (transaction.description || '') : '';
  document.getElementById('txPaymentMethod').value = transaction ? (transaction.paymentMethod || 'Cash') : 'Cash';

  if (transaction) {
    setTimeout(() => {
      document.getElementById('txCategory').value = transaction.category;
    }, 0);
  }

  document.getElementById('txModalOverlay').classList.remove('hidden');
}

function closeTransactionModal() {
  const overlay = document.getElementById('txModalOverlay');
  if (overlay) overlay.classList.add('hidden');
  editingTransactionId = null;
}

async function handleTransactionSubmit(e) {
  e.preventDefault();
  clearTxErrors();

  const amount = parseFloat(document.getElementById('txAmount').value);
  const category = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value;
  const description = document.getElementById('txDescription').value.trim();
  const paymentMethod = document.getElementById('txPaymentMethod').value;

  let valid = true;
  if (!amount || amount <= 0) {
    document.getElementById('err-txAmount').textContent = 'Enter an amount greater than 0';
    document.getElementById('txAmount').classList.add('input-error');
    valid = false;
  }
  if (!category) {
    document.getElementById('err-txCategory').textContent = 'Please select a category';
    valid = false;
  }
  if (!date) {
    document.getElementById('err-txDate').textContent = 'Please select a date';
    document.getElementById('txDate').classList.add('input-error');
    valid = false;
  }
  if (!valid) return;

  const payload = { type: currentModalType, amount, category, date, description, paymentMethod };

  const submitBtn = document.getElementById('txSubmitBtn');
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = '<span class="spinner"></span>';

  try {
    let res;
    if (editingTransactionId) {
      res = await api.put(`/transactions/${editingTransactionId}`, payload);
    } else {
      res = await api.post('/transactions', payload);
    }
    notify.success(res.message);
    closeTransactionModal();
    if (onTransactionSaved) onTransactionSaved(res.transaction);
  } catch (err) {
    if (err.errors && err.errors.length) {
      err.errors.forEach((e2) => {
        const el = document.getElementById('err-tx' + e2.field.charAt(0).toUpperCase() + e2.field.slice(1));
        if (el) el.textContent = e2.message;
      });
    }
    notify.error(err.message || 'Something went wrong');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function confirmDeleteTransaction(id, onDeleted) {
  if (!window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')) return;
  try {
    const res = await api.delete(`/transactions/${id}`);
    notify.success(res.message);
    if (onDeleted) onDeleted();
  } catch (err) {
    notify.error(err.message || 'Failed to delete transaction');
  }
}
