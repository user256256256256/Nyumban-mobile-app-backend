import { success } from '../../common/utils/response-builder.util.js';
import TenantManagementService from './tenant-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getTenantsHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const tenants = await TenantManagementService.getTenants(landlordId);
        return success(res, tenants, 'Tenants retrieved successfully');
    } catch (error) {
        handleControllerError(res, error, 'GET_TENANTS_ERROR', 'Failed to retrieve tenants');
    }
}

export const getTenantRentHistoryHandler = async (req, res) => {
    try {
        const { tenantId } = req.params
        const result = await TenantManagementService.getTenantRentHistory(tenantId);
        return success(res, result, 'Tenants rent history retrieved successfully');
    } catch (error) {
        handleControllerError(res, error, 'GET_TENANTS_RENT_HISTORY_ERROR', 'Failed to retrieve tenant rent history');
    }
}