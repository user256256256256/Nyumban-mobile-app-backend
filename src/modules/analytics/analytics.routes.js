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
  getLandlordGrowthTrendsHandler,
  getPortfolioSummaryHandler,
  getApplicationsAndToursHandler,
  getFinancialSummaryHandler,
  getSecurityDepositOverviewHandler,
  getTopPerformingPropertiesHandler
} from './analytics.controller.js';

const router = express.Router();

// Property analytics (can send propertyIds in body)
router.post('/properties/analytics', authenticate, authorizeRoles('landlord', 'tenant'), getPropertyAnalyticsHandler);
// User analytics
router.get('/users/analytics', authenticate, authorizeRoles('landlord'), getUserAnalyticsHandler);
// Landlord analytics (optional propertyId via query param ?propertyId=xxx)
router.get('/landlords/properties/performance/', authenticate, authorizeRoles('landlord'), getLandlordPropertyPerformanceHandler);
router.get('/landlords/tenants/insights/', authenticate, authorizeRoles('landlord'), getLandlordTenantInsightsHandler);
router.get('/landlords/financial-metrics/', authenticate, authorizeRoles('landlord'), getLandlordFinancialMetricsHandler);
router.get('/landlords/engagement-metrics/', authenticate, authorizeRoles('landlord'), getLandlordEngagementMetricsHandler);
router.get('/landlords/growth-trends/', authenticate, authorizeRoles('landlord'), getLandlordGrowthTrendsHandler);
// Portfolio summary & applications/tours (optional propertyId)
router.get('/portfolio-summary/', authenticate, authorizeRoles('landlord'), getPortfolioSummaryHandler);
router.get('/applications-tours/', authenticate, authorizeRoles('landlord'), getApplicationsAndToursHandler);
// 💵 Financial summary (optional propertyId)
router.get('/landlords/financial-summary/', authenticate, authorizeRoles('landlord'), getFinancialSummaryHandler);
// 🛡️ Security deposit overview (optional propertyId)
router.get('/landlords/security-deposits/', authenticate, authorizeRoles('landlord'), getSecurityDepositOverviewHandler);
// 🏆 Top performing properties
router.get('/landlords/top-properties', authenticate, authorizeRoles('landlord'), getTopPerformingPropertiesHandler);

export default router;
