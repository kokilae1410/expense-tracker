const mongoose = require('mongoose');

const INCOME_CATEGORIES = [
  'Salary', 'Business', 'Investment', 'Gift', 'Freelance', 'Other Income',
];

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment',
  'Healthcare', 'Education', 'Shopping', 'Travel', 'Other Expense',
];

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      validate: {
        validator: function validateCategory(value) {
          if (this.type === 'income') return INCOME_CATEGORIES.includes(value);
          if (this.type === 'expense') return EXPENSE_CATEGORIES.includes(value);
          return true;
        },
        message: (props) => `${props.value} is not a valid category for this transaction type`,
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Other'],
      default: 'Cash',
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1 });
TransactionSchema.index({ user: 1, category: 1 });

TransactionSchema.statics.INCOME_CATEGORIES = INCOME_CATEGORIES;
TransactionSchema.statics.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;

module.exports = mongoose.model('Transaction', TransactionSchema);
