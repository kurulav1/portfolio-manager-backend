const axios = require('axios');

async function getRiskFreeRate() {
  try {
    const response = await axios.get(`${process.env.DATA_SERVICE_URL}/treasury_yield`);
    return response.data.treasury_yield;
  } catch (error) {
    console.error('Error fetching risk-free rate:', error);

    return 0.05;
  }
}

async function calculateOptionDelta(optionData) {
  try {
    const riskFreeRate = await getRiskFreeRate();
    const params = {
      S: parseFloat(optionData.marketPrice),
      K: parseFloat(optionData.strikePrice),
      T: calculateTimeToExpiration(optionData.expirationDate),
      r: riskFreeRate,
      v: parseFloat(optionData.impliedVolatility), 
      type: optionData.optionType
    };

    const response = await axios.get(`${process.env.ANALYTICS_SERVICE_URL}/calculate_delta`, { params });
    return response.data.delta;
  } catch (error) {
    console.error('Error in calculating option delta:', error);
    throw error;
  }
}

function calculateTimeToExpiration(expirationDate) {
  const expiration = new Date(expirationDate);
  const now = new Date();
  const millisecondsPerYear = 31557600000;
  return (expiration - now) / millisecondsPerYear;
}

module.exports = { calculateOptionDelta };
