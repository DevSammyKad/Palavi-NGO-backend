const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const donationRoutes = require('./routes/donationRoutes');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = ['https://www.palavisanstha.org'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use donation routes
app.use('/api', donationRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
