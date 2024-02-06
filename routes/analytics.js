// routes/analytics.js
var express = require('express');
var router = express.Router();
const analyticsService = require('../services/analyticsService');

router.post('/calculate_delta', async (req, res) => {
  try {
    const optionData = req.body;
    const queryParams = new URLSearchParams(optionData).toString();
    const analyticsResponse = await axios.get(`${process.env.ANALYTICS_BACKEND_URL}/calculate_delta?${queryParams}`);
    res.json(analyticsResponse.data);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


module.exports = router;
