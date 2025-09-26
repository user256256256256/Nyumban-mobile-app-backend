import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getTenantsHandler, 
    getTenantRentHistoryHandler, 
    sendRentRemindersHandler,
    getLatestTenantPaymentHandler,
    getSecurityDepositsHandler,
    getSecurityDepositHandler,
    getTenantPaymentByIdHandler,
} from './tenant-management.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { tenantIdParamSchema, remindTenantRentSchema, agreementIdParamSchema, propertyIdParamSchema, securityDepositIdParamSchema, paymentIdParamSchema } from './tenant-management.validator.js';

const router = express.Router();

router.get('/:agreementId/latest-payment', authenticate, authorizeRoles('landlord', 'tenant'), validate(agreementIdParamSchema), getLatestTenantPaymentHandler)
router.get('/tenants', authenticate, authorizeRoles('landlord'), getTenantsHandler);
router.get('/tenants/:tenantId/rent-history', authenticate, authorizeRoles('landlord'), validate(tenantIdParamSchema), getTenantRentHistoryHandler);
router.post('/tenants/remind-rent', authenticate, authorizeRoles('landlord'), validate(remindTenantRentSchema), sendRentRemindersHandler );  
router.get('/:propertyId/security-deposits', authenticate, authorizeRoles('landlord'), validate(propertyIdParamSchema), getSecurityDepositsHandler)
router.get('/:securityDepositId', authenticate, authorizeRoles('landlord', 'tenant'), validate(securityDepositIdParamSchema), getSecurityDepositHandler)
router.get('/payments/:paymentId', authenticate, authorizeRoles('landlord', 'tenant'), validate(paymentIdParamSchema), getTenantPaymentByIdHandler  );
  
export default router;
