import { success } from '../../common/utils/response-builder.util.js';
import TenantManagementService from './tenant-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getTenantsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { status } = req.query; // optional filter

    const tenants = await TenantManagementService.getTenants(landlordId, { status });

    return success(res, tenants, 'Tenants retrieved successfully');
  } catch (error) {
    handleControllerError(
      res,
      error,
      'GET_TENANTS_ERROR',
      'Failed to retrieve tenants'
    );
  }
};


export const getTenantRentHistoryHandler = async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { month, year, status, limit = 20, cursor } = req.query;
  
      const result = await TenantManagementService.getTenantRentHistory(tenantId, {
        limit: Number(limit),
        cursor,
        month: month ? parseInt(month, 10) : undefined,
        year: year ? parseInt(year, 10) : undefined,
        status,
      });
      
        return success(res, result, 'Tenants rent history retrieved successfully');
      } catch (error) {
        handleControllerError(res, error, 'GET_TENANTS_RENT_HISTORY_ERROR', 'Failed to retrieve tenant rent history');
      }      
}

export const sendRentRemindersHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { tenantIds } = req.body;

    const reminders = await TenantManagementService.sendRentReminders(landlordId, tenantIds);

    return success(res, reminders, 'Rent reminders sent successfully');
  } catch (error) {
    handleControllerError(res, error, 'SEND_RENT_REMINDERS_ERROR', 'Failed to send rent reminders');
  }
};

export const getLatestTenantPaymentHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementId } = req.params;
    const result = await TenantManagementService.getLatestTenantPayment(userId, agreementId);
    return success(res, result, 'Latest rent payment retrieved successfully')
  } catch (error) {
    handleControllerError(res, error, 'GET_TENANTS_RENT_PAYMENT_STATUS_ERROR', 'Failed to get latest rent payment')
  }
}

export const getSecurityDepositsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const { status } = req.query;
    const result = await TenantManagementService.getSecurityDeposits(userId, propertyId, status)
    return success(res, result, 'Security deposits retrieved successfully')
  } catch (error) {
    handleControllerError(res, error, 'GET_SECURITY_DEPOSITS_ERROR', 'Failed to get security deposits')
  }
}

export const getSecurityDepositHandler = async (req, res) => {
  try {
    const { securityDepositId } = req.params;
    const result = await TenantManagementService.getSecurityDeposit(securityDepositId);
    return success(res, result, 'Security deposits retrieved successfully')
  } catch (error) {
    handleControllerError(res, error, 'GET_SECURITY_DEPOSIT_ERROR', 'Failed to get security deposit')
  }
}

export const getTenantPaymentByIdHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId } = req.params;

    const result = await TenantManagementService.getTenantPaymentById(userId, paymentId);

    return success(res, result, 'Tenant payment retrieved successfully');
  } catch (error) {
    handleControllerError(
      res,
      error,
      'GET_TENANT_PAYMENT_ERROR',
      'Failed to get tenant payment'
    );
  }
};