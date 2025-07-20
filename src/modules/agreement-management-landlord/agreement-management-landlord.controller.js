import { success } from '../../common/utils/responseBuilder.js';
import AgreementManagementService from './agreement-management-landlord.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const getAllLandlordAgreementsHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const { sort_by = 'date', order = 'desc', status, limit = 10, offset = 0 } = req.query
        const result = await AgreementManagementService.getAllLandlordAgreements({ landlordId, sortBy: sort_by, order, status, limit: parseInt(limit), offset: parseInt(offset) })
        return success(res, result, 'Agreements fetched successfully')
    } catch (error) {
        return handleControllerError(res, error, 'GET_AGREEMENT_FAILED', 'Failed to fetch agreement')
    }
}

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
      const fileStream = await AgreementManagementService.downloadAgreementPdf({ agreementId });
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=agreement-${agreementId}.pdf`);
  
      return fileStream.pipe(res);
    } catch (error) {
      return handleControllerError(res, error, 'DOWNLOAD_AGREEMENT_FAILED', 'Failed to download agreement');
    }
};

export const terminateAgreementHandler = async (req, res) => {
    try {
      const { agreementId } = req.params;
      const { reason } = req.body;
      const landlordId = req.user.id;
  
      await AgreementManagementService.terminateAgreement({ agreementId, landlordId, reason });
  
      return success(res, null, 'Agreement terminated successfully');
    } catch (error) {
      return handleControllerError(res, error, 'TERMINATE_AGREEMENT_FAILED', 'Failed to terminate agreement');
    }
};
  
