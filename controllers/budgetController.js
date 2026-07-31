const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const setBudget = async (req, res, next) => {
  try {
    const { category, month, year, limit } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { $set: { limit } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      budget,
    });
  } catch (error) {
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year }).sort({ category: 1 });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const spendResults = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendMap = new Map(spendResults.map((s) => [s._id, s.spent]));

    const budgetsWithSpend = budgets.map((b) => {
      const spent = spendMap.get(b.category) || 0;
      const percentUsed = b.limit > 0 ? Math.round((spent / b.limit) * 1000) / 10 : 0;
      let status = 'ok';
      if (percentUsed >= 100) status = 'exceeded';
      else if (percentUsed >= 80) status = 'warning';

      return {
        _id: b._id,
        category: b.category,
        month: b.month,
        year: b.year,
        limit: b.limit,
        spent,
        remaining: Math.max(b.limit - spent, 0),
        percentUsed,
        status,
      };
    });

    res.status(200).json({ success: true, month, year, budgets: budgetsWithSpend });
  } catch (error) {
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid budget id' });
    }

    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { setBudget, getBudgets, deleteBudget };
