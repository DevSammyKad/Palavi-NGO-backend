// controllers/donationController.js
const multer = require('multer');
const Donation = require('../models/donation');

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage }).single('upload');

const generateTransactionId = () => {
  return 'TXN' + Date.now();
};

const initiatePayment = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: 'File upload failed.' });
    }
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        address2,
        pan,
        donationAmount,
        purpose,
        termsAccepted,
      } = req.body;

      const uploadFilePath = req.file ? req.file.path : '';

      if (termsAccepted !== 'true') {
        return res.status(400).json({ error: 'Terms must be accepted.' });
      }

      const merchantTransactionId = generateTransactionId();

      // Save the donation in MongoDB with status "PENDING"
      await Donation.create({
        firstName,
        lastName,
        email,
        phone,
        address,
        address2,
        pan,
        donationAmount,
        purpose,
        upload: uploadFilePath,
        termsAccepted: true,
        transactionId: merchantTransactionId,
        paymentStatus: 'PENDING',
      });

      console.log('Donation saved:');

      const data = {
        merchantId: process.env.MERCHANT_ID,
        merchantTransactionId,
        merchantUserId: `MUID${email}`, // Unique user ID
        name: `${firstName} ${lastName}`,
        amount: donationAmount * 100, // Convert to paise
        redirectUrl: `${process.env.APP_BE_URL}/api/donations/status/${merchantTransactionId}`,
        redirectMode: 'POST',
        mobileNumber: phone,
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      };

      const payload = JSON.stringify(data);
      const payloadMain = Buffer.from(payload).toString('base64');
      const string = payloadMain + '/pg/v1/pay' + process.env.SALT_KEY;
      const sha256 = crypto.createHash('sha256').update(string).digest('hex');
      const checksum = sha256 + '###' + 1;

      console.log('Phonepe Host', process.env.PHONEPE_HOST_URL);
      console.log('merchantId', process.env.MERCHANT_ID);
      console.log('merchantTransactionId', merchantTransactionId);

      const options = {
        method: 'POST',
        url: `${process.env.PHONEPE_HOST_URL}/pg/v1/pay`,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
        data: { request: payloadMain },
      };

      console.log('Request Options:', JSON.stringify(options, null, 2));
      console.log('CheckSum', checksum);
      const response = await axios.request(options);
      if (response.data.success && response.data.code === 'PAYMENT_INITIATED') {
        return res.json({
          success: true,
          redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
        });
      } else {
        return res.status(400).json({ error: 'Payment initiation failed.' });
      }
    } catch (error) {
      console.error('Payment initiation error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

// Handle payment status and save donation
const handlePaymentStatus = async (req, res) => {
  try {
    const merchantTransactionId = req.params.txnId;
    const string =
      `/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}` +
      process.env.SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + process.env.SALT_INDEX;

    const options = {
      method: 'GET',
      url: `${process.env.PHONEPE_HOST_URL}/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': process.env.MERCHANT_ID,
      },
    };

    const response = await axios.request(options);
    if (
      response.data.success &&
      response.data.data.responseCode === 'SUCCESS'
    ) {
      const updatedDonation = await Donation.findOneAndUpdate(
        { transactionId: merchantTransactionId },
        { paymentStatus: 'SUCCESS' },
        { new: true }
      );

      if (!updatedDonation) {
        return res.status(400).json({ error: 'Donation not found.' });
      }

      console.log('Donation updated:', updatedDonation);

      // Redirect to success page (update URL as needed)
      return res.redirect(`${process.env.FRONTEND_URL}/success.html`);
    } else {
      // Redirect to failure page (update URL as needed)
      return res.redirect(`${process.env.FRONTEND_URL}/failure.html`);
    }
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { initiatePayment, handlePaymentStatus };
