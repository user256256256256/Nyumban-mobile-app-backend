import { success } from '../../common/utils/response-builder.util.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';
import EvictionService from './evict-tenant.service.js';

export const evictTenantHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    const { property_id, property_unit_id, reason } = req.body;

    const result = await EvictionService.evictTenant({
      landlordId,
      tenantId,
      propertyId: property_id,
      unitId: property_unit_id,
      reason,
    });

    return success(res, result, 'Tenant eviction processed and agreement terminated');
  } catch (err) {
    return handleControllerError(res, err, 'EVICT_TENANT_ERROR', err.message);
  }
};
