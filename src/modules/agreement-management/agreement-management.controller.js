import { success } from '../../common/utils/response-builder.util.js';
import AgreementManagementService from './agreement-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';
import { generateAgreementPreview } from '../../common/services/generate-agreement-preview.service.js'

export const generateAgreementShareLinkHandler = async (req, res) => {
    try {
        const { agreementId } = req.params;
        const result = await AgreementManagementService.generateAgreementShareLink({ agreementId })
        return success(res, result, 'Share link generated successfully')
    } catch (error) {
        return handleControllerError(res, error, 'GENERATE_SHARE_LINK_FAILED', 'Failed to generate agreement share link')
    }
}

export const downloadAgreementPdfHandler = async (req, res) => {
    try {
      const { agreementId } = req.params;
      const pdfBuffer = await AgreementManagementService.downloadAgreementPdf({ agreementId });
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=agreement-${agreementId}.pdf`);
      
      return res.send(pdfBuffer); // ✅ send buffer directly
    } catch (error) {
      return handleControllerError(res, error, 'DOWNLOAD_AGREEMENT_FAILED', 'Failed to download agreement');
    }
};

export const getAgreementHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const userId = req.user.id
    
    const result = await AgreementManagementService.getAgreement(userId, agreementId)

    return success(res, result, 'Agreement retrieved successfully')

  } catch (error) {
    return handleControllerError(res, error, 'GET_AGREEMENT_ERROR', 'Failed to get agreement');
  }
}

export const getLeaseAgreementHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const { propertyId }  = req.params;

      const { unitId } = req.query;
  
      const result = await AgreementManagementService.getLeaseAgreement(userId, propertyId, unitId);
      
      return success(res, result, 'Lease agreement fetched successfully');
    } catch (error) {
      return handleControllerError(res, error, 'GET_LEASE_AGREEMENT_ERROR', 'Failed to fetch lease agreement');
    }
};

export const deleteRentalAgreementsBatchHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementIds } = req.body;
    const result = await AgreementManagementService.deleteAgreementsBatch(userId, agreementIds);
    return success(res, result, 'Agreements deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_AGREEMENTS_BATCH_ERROR');
  }
};

export const cancelRentalAgreementsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementIds } = req.body;
    const result = await AgreementManagementService.cancelAgreements(userId, agreementIds);
    return success(res, result, 'Agreements cancelled successfully');
  } catch (error) {
    return handleControllerError(res, error, 'CANCEL_AGREEMENTS_ERROR');
  }
};

export const generateAgreementPreviewHandler = async (req, res) => {
  try {
      const { agreementId } = req.params;
      const result = await generateAgreementPreview(agreementId) 
      return success(res, result, 'Agreement preview retrieved successfully')
  } catch (error) {
      handleControllerError(res, error, 'AGREEMENT_PREVIEW_ERROR', 'Failed to preview agreement')
  }
}

export const checkAgreementExistsHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { propertyId } = req.params;
        const { unitId }  = req.query
        const result = await AgreementManagementService.checkAgreementExists(userId, propertyId, unitId)
        return success(res, result, 'Agreeement status retrieved successfully')
    } catch (error) {
        handleControllerError(res, error, 'GET_AGREEMENT_STATUS_ERROR', 'Failed to get agreement status')
    }
}

export const permanentlyDeleteAgreementsBatchHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementIds } = req.body;

    const result = await AgreementManagementService.permanentlyDeleteAgreementsBatch(userId, agreementIds);

    return success(res, result, 'Agreements permanently deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'PERMANENT_DELETE_FAILED', 'Failed to permanently delete agreements');
  }
};

export const recoverDeletedAgreementsBatchHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementIds } = req.body;

    const result = await AgreementManagementService.recoverDeletedAgreementsBatch(userId, agreementIds);

    return success(res, result, 'Agreements recovered successfully');
  } catch (error) {
    return handleControllerError(res, error, 'RECOVER_AGREEMENTS_FAILED', 'Failed to recover deleted agreements');
  }
};
