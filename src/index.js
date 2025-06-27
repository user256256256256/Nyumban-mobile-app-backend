import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js'

const app = express();
app.use(cors());
app.use(express.json());

const BASE_ROUTE = '/api/v1'
const PORT = process.env.PORT || 5050;

//  TESTING ROUTE 
app.post('/test', (req, res) => {
  res.status(200).json({ message: 'Test route works' });
});

app.use(`${BASE_ROUTE}/auth`, authRoutes);
app.use(`${BASE_ROUTE}/user`, userRoutes);

app.get('/', (req, res) => {
  res.send('NPS Backend API is running ✅');
});

// ✅ Await app.listen inside an async IIFE
const startServer = async () => {
  try {
    await app.listen(PORT);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
