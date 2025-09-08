import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
  getPropertyAnalyticsHandler,
  getUserAnalyticsHandler,
  getLandlordPropertyPerformanceHandler,
  getLandlordTenantInsightsHandler,
  getLandlordFinancialMetricsHandler,
  getLandlordEngagementMetricsHandler,
  getLandlordGrowthTrendsHandler
} from './analytics.controller.js';

const router = express.Router();

router.post('/properties/analytics', authenticate, authorizeRoles('landlord', 'tenant'), getPropertyAnalyticsHandler);
router.get('/users/analytics', authenticate, authorizeRoles('landlord'), getUserAnalyticsHandler);
router.get('/landlords/properties/performance', authenticate, authorizeRoles('landlord'), getLandlordPropertyPerformanceHandler);
router.get('/landlords/tenants/insights', authenticate, authorizeRoles('landlord'), getLandlordTenantInsightsHandler);
router.get('/landlords/financial-metrics', authenticate, authorizeRoles('landlord'), getLandlordFinancialMetricsHandler);
router.get('/landlords/engagement-metrics', authenticate, authorizeRoles('landlord'), getLandlordEngagementMetricsHandler);
router.get('/landlords/growth-trends', authenticate, authorizeRoles('landlord'), getLandlordGrowthTrendsHandler);

export default router;
