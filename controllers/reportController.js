const Transaction = require('../models/Transaction');

const dailyReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = from ? new Date(from) : new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    const results = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const map = new Map();
    results.forEach((r) => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { date: key, income: 0, expense: 0 });
      map.get(key)[r._id.type] = r.total;
    });

    const report = Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const monthlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const results = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const report = [];
    for (let m = 1; m <= 12; m += 1) {
      const income = results.find((r) => r._id.month === m && r._id.type === 'income');
      const expense = results.find((r) => r._id.month === m && r._id.type === 'expense');
      report.push({
        month: m,
        label: new Date(year, m - 1, 1).toLocaleString('default', { month: 'short' }),
        income: income ? income.total : 0,
        expense: expense ? expense.total : 0,
      });
    }

    res.status(200).json({ success: true, year, report });
  } catch (error) {
    next(error);
  }
};

const yearlyReport = async (req, res, next) => {
  try {
    const results = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1 } },
    ]);

    const years = [...new Set(results.map((r) => r._id.year))].sort();
    const report = years.map((year) => {
      const income = results.find((r) => r._id.year === year && r._id.type === 'income');
      const expense = results.find((r) => r._id.year === year && r._id.type === 'expense');
      return {
        year,
        income: income ? income.total : 0,
        expense: expense ? expense.total : 0,
      };
    });

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

module.exports = { dailyReport, monthlyReport, yearlyReport };
