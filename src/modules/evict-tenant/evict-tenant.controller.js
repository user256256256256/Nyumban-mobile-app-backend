import { success } from '../../common/utils/response-builder.util.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';
import EvictionService from './evict-tenant.service.js';

export const initiateEvictionHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    const { property_id, property_unit_id, reason } = req.body;

    const result = await EvictionService.initiateEviction({
      landlordId,
      tenantId,
      propertyId: property_id,
      unitId: property_unit_id,
      reason,
    });

    return success(res, result, 'Eviction warning issued.');
  } catch (err) {
    return handleControllerError(res, err, 'EVICTION_ERROR', err.message);
  }
};

export const finalizeEvictionHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { evictionLogId } = req.params;

    const result = await EvictionService.finalizeEviction({
      landlordId,
      evictionLogId,
    });

    return success(res, result, 'Eviction finalized successfully.');
  } catch (err) {
    return handleControllerError(res, err, 'FINALIZE_EVICTION_ERROR', err.message);
  }
};
