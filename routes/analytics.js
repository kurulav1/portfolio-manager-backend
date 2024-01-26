// routes/analytics.js
var express = require('express');
var router = express.Router();
const analyticsService = require('../services/analyticsService');

router.post('/calculate-delta', async (req, res) => {
  try {
    const optionData = req.body;
    const delta = await analyticsService.calculateOptionDelta(optionData);
    res.json({ delta: delta });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
