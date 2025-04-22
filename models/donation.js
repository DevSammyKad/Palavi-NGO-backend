// models/Donation.js
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    address2: { type: String, required: true },
    pan: { type: String, required: true },
    donationAmount: { type: Number, required: true },
    purpose: { type: String, required: true },
    upload: { type: String }, // Store the file name or URL (depending on your use case)
    termsAccepted: { type: Boolean, required: true },
    paymentStatus: { type: String, required: true },
    transactionId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
