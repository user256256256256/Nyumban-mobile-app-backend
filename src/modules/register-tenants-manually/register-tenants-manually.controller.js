import { success } from '../../common/utils/response-builder.util.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';
import RegisterTenantsManuallyService from './register-tenants-manually.service.js';

export const registerTenantManuallyHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { agreementId, tenantId } = req.params;

    const result = await RegisterTenantsManuallyService.registerTenantManually({
      landlordId,
      tenantId,
      agreementId,
    });

    return success(res, result, 'Tenant manually registered and notified successfully');
  } catch (error) {
    return handleControllerError(
      res,
      error,
      'MANUAL_TENANT_REGISTRATION_FAILED',
      'Failed to register tenant manually'
    );
  }
};
