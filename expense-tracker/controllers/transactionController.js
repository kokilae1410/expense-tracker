const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date, paymentMethod } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      description,
      date: date || Date.now(),
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} added successfully`,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { type, category, date, month, from, to, q, sort, page, limit } = req.query;

    const query = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      if (year && mon) {
        const start = new Date(year, mon - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, mon, 0, 23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      }
    }

    if (from || to) {
      query.date = query.date || {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (q) {
      query.description = { $regex: q, $options: 'i' };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const sortOption = sort === 'oldest' ? { date: 1 } : { date: -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

const getRecentTransactions = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction id' });
    }

    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction id' });
    }

    let transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { type, amount, category, description, date, paymentMethod } = req.body;

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction id' });
    }

    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const totals = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    totals.forEach((t) => {
      if (t._id === 'income') totalIncome = t.total;
      if (t._id === 'expense') totalExpense = t.total;
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTotals = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    let monthIncome = 0;
    let monthExpense = 0;
    monthTotals.forEach((t) => {
      if (t._id === 'income') monthIncome = t.total;
      if (t._id === 'expense') monthExpense = t.total;
    });

    res.status(200).json({
      success: true,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      monthIncome,
      monthExpense,
      monthBalance: monthIncome - monthExpense,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type, month } = req.query;
    const match = { user: req.user._id, type: type === 'income' ? 'income' : 'expense' };

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      if (year && mon) {
        const start = new Date(year, mon - 1, 1);
        const end = new Date(year, mon, 0, 23, 59, 59, 999);
        match.date = { $gte: start, $lte: end };
      }
    }

    const breakdown = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      breakdown: breakdown.map((b) => ({ category: b._id, total: b.total })),
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrend = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || 6, 24);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const results = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const series = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const income = results.find((r) => r._id.year === year && r._id.month === month && r._id.type === 'income');
      const expense = results.find((r) => r._id.year === year && r._id.month === month && r._id.type === 'expense');
      series.push({
        label: `${d.toLocaleString('default', { month: 'short' })} ${year}`,
        year,
        month,
        income: income ? income.total : 0,
        expense: expense ? expense.total : 0,
      });
    }

    res.status(200).json({ success: true, series });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getRecentTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
};
