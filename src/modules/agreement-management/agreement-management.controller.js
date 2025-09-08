import { success } from '../../common/utils/response-builder.util.js';
import AgreementManagementService from './agreement-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

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

// getAgreementHandler

export const getAgreementHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const userId = req.user.userId
    
    const result = AgreementManagementService.getAgreement(userId, agreementId)

    return success(res, result, 'Agreement retrieved successfully')

  } catch (error) {
    return handleControllerError(res, error, 'GET_AGREEMENT_ERROR', 'Failed to get agreement');
  }
}
