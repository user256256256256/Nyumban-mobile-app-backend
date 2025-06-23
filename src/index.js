import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/test', (req, res) => {
  res.status(200).json({ message: 'Test route works' });
});

app.use('/api/v1/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('NPS Backend API is running ✅');
});

const PORT = process.env.PORT || 5050;

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
