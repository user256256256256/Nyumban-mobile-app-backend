import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.config.js'
import './cron/scheduler.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js'
import supportRoutes from './modules/support/support.route.js'
import tourRequestRoutes from './modules/tour-request/tour-request.route.js'
import addPropertyRoutes from './modules/add-property/add-propery.routes.js'
import evictTenantRoutes from './modules/evict-tenant/evict-tenant.routes.js'
import notificationRoutes from './modules/notifications/notification.routes.js'
import tenantProfileRoutes from './modules/tenant-profile/tenant-profile.routes.js'
import rentManagementRoutes from './modules/rent-management/rent-management.routes.js'
import propertyMngtRoutes from './modules/property-management/property-mngt.routes.js'
import propertySearchRoutes from './modules/property-search/property-search.routes.js'
import landlordProfileRoutes from './modules/landlord-profile/landlord-profile.routes.js'
import agreementSigningRoutes from './modules/agreement-signing/agreement-signing.routes.js'
import tenantManagementRoutes from './modules/tenant-management/tenant-management.routes.js'
import propertyPromotionRoutes from './modules/promote-property/property-promotion.routes.js'
import paymentManagementRoutes from './modules/payment-management/payment-management.routes.js'
import propertyEngagementRoutes from './modules/property-engagement/property-engagement.routes.js'
import applicationRequestRoutes from './modules/application-request/application-request.routes.js'
import reviewAndFeedbackRoutes from './modules/reviews-and-feedback/reviews-and-feedback.routes.js'
import manualRentPaymentRoutes from './modules/manual-rent-payments/manual-rent-payments.routes.js'
import accountVerificationRoutes from './modules/account-verification/account-verification.routes.js'
import tourRequestResolutionRoutes from './modules/tour-request-resolution/tour-request-resolution.routes.js'
import agreementManagementTenantRoutes from './modules/agreement-management-tenant/agreement-management-tenant.routes.js'
import draftingRentalAgreementRoutes from './modules/drafting-rental-agreement/drafting-rental-agreement.routes.js'
import agreementManagementLandlordRoutes from './modules/agreement-management-landlord/agreement-management-landlord.routes.js'
import applicationRequestResolutionRoutes from './modules/application-request-resolution/application-request-resolution.routes.js'

const app = express();
app.use(cors(corsOptions));

app.use(express.json());

const BASE_ROUTE_VERSION_1 = '/api/v1'
const PORT = process.env.PORT || 5050;

app.use(`${BASE_ROUTE_VERSION_1}/auth`, authRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/user`, userRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/support`, supportRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/add-property`, addPropertyRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/evict-tenant`, evictTenantRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/tour-request`, tourRequestRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/notification`, notificationRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/property-mngt`, propertyMngtRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/tenant-profile`, tenantProfileRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/rent-management`, rentManagementRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/property-search`, propertySearchRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/landlord-profile`, landlordProfileRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/agreement-signing`, agreementSigningRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/tenant-management`, tenantManagementRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/promote-property`, propertyPromotionRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/payment-management`, paymentManagementRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/property-engagement`, propertyEngagementRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/application-request`, applicationRequestRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/reviews-and-feedback`, reviewAndFeedbackRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/manual-rent-payments`, manualRentPaymentRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/account-verification`, accountVerificationRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/tour-request-resolution`, tourRequestResolutionRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/drafting-rental-agreement`, draftingRentalAgreementRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/agreement-management-tenant`, agreementManagementTenantRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/agreement-management-landlord`, agreementManagementLandlordRoutes);
app.use(`${BASE_ROUTE_VERSION_1}/application-request-resolution`, applicationRequestResolutionRoutes);

// Testing Route
app.get('/', (req, res) => {
  res.send('NPS Backend API is running successfully. Its ready when you are ready ✅');
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
