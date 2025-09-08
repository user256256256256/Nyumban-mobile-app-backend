import express from 'express';
import { authenticate } from '../common/middleware/auth.middleware.js';
import { registerDeviceToken } from '../common/services/sns.service.js';
import { setUserActive } from '../services/user.service.js';
import { NotFoundError } from '../common/services/errors-builder.service.js'
import { success } from '../common/utils/response-builder.util.js';
import { handleControllerError } from '../common/utils/handle-controller-error.util.js';

const router = express.Router();

router.post('/register', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { deviceToken, platformArn } = req.body;

  if (!deviceToken || !platformArn) {
    return NotFoundError('Missing deviceToken or platformArn', { field: 'Device Token or Platform Arn'}) 
  }

  try {
    const result = await registerDeviceToken(userId, deviceToken, platformArn);
    return success(res, result, 'Device registered successfully') 
  } catch (err) {
    return handleControllerError(res, err, 'REGISTER_DEVICE_ERROR', 'Failed to register device') 
  }
  
});

router.post('/heartbeat', authenticate, async (req, res) => {
  try {
    const result =  await setUserActive(req.user.id);
    return success(res, result, 'Heartbeat recorded successfully') 
  } catch (err) {
    return handleControllerError(res, err, 'RECORD_HEARTBEAT_ERROR', 'Failed to record heartbeat')
  }
});

export default router;
