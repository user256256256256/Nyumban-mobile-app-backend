import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getAllLandlordAgreementsHandler,
} from './agreement-management-landlord.controller.js';

const router = express.Router();

router.get('/agreements', authenticate, authorizeRoles('landlord'), getAllLandlordAgreementsHandler);

export default router;
