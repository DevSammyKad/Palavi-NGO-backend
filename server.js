const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const donationRoutes = require('./routes/donationRoutes');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use donation routes
app.use('/api', donationRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
