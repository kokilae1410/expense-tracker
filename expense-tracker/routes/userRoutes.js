const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('currency').optional().trim().isLength({ min: 1, max: 10 }),
    body('monthlyBudgetGoal').optional().isFloat({ min: 0 })
      .withMessage('Monthly budget goal must be a positive number'),
  ],
  validate,
  updateProfile
);

router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
