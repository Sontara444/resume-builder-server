require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.use('/api/resumes', resumeRoutes);

    // Health Check
    app.get('/', (req, res) => {
      res.send('API is running...');
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
