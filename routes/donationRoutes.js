// routes/donationRoutes.js
const express = require('express');
const {
  initiatePayment,
  handlePaymentStatus,
} = require('../controllers/donationController');

const router = express.Router();

// POST request to save donation data
router.post('/donations', initiatePayment);
router.post('/donations/status/:txnId', handlePaymentStatus);

module.exports = router;
