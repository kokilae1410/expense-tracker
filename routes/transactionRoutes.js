const express = require('express');
const { body } = require('express-validator');
const {
  createTransaction,
  getTransactions,
  getRecentTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

const transactionValidation = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
];

router.get('/summary', getSummary);
router.get('/recent', getRecentTransactions);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trend', getMonthlyTrend);

router.route('/')
  .get(getTransactions)
  .post(transactionValidation, validate, createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .put(transactionValidation, validate, updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
