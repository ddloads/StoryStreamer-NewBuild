import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger.js';  // Import the logger

import audiobooksRouter from './routes/audiobookRoutes.js';
import usersRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => logger.info("MongoDB database connection established successfully"))
  .catch(err => logger.error("MongoDB connection error: ", err));

app.use('/api/audiobooks', audiobooksRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

app.listen(port, () => {
  logger.info(`Server is running on port: ${port}`);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).send('An unexpected error occurred');
});