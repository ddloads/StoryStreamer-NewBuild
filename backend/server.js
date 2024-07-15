import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import audiobooksRouter from './routes/audiobooks.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch(err => console.log("MongoDB connection error: ", err));

app.use('/api/audiobooks', audiobooksRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
