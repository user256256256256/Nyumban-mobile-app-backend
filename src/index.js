import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import './cron/scheduler.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js'
import supportRoutes from './modules/support/support.route.js'
import notificationRoutes from './modules/notifications/notification.routes.js'
import addPropertyRoutes from './modules/add-property/add-propery.routes.js'
import propertyMngtRoutes from './modules/property-management/property-mngt.routes.js'
import propertyPromotionRoutes from './modules/promote-property/property-promotion.routes.js'
import accountVerificationRoutes from './modules/account-verification/account-verification.routes.js'

const app = express();
app.use(cors());
app.use(express.json());

const BASE_ROUTE_VERSION_1 = '/api/v1'
const PORT = process.env.PORT || 5050;

//  TESTING ROUTE 
app.post('/test', (req, res) => {
  res.status(200).json({ message: 'Test route works' });
});

app.use(`${BASE_ROUTE_VERSION_1}/auth`, authRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/user`, userRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/support`, supportRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/notification`, notificationRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/add-property`, addPropertyRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/property-mngt`, propertyMngtRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/promote-property`, propertyPromotionRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/account-verification`, accountVerificationRoutes);


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
