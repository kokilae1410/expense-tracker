const express = require('express');
const { dailyReport, monthlyReport, yearlyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/daily', dailyReport);
router.get('/monthly', monthlyReport);
router.get('/yearly', yearlyReport);

module.exports = router;
