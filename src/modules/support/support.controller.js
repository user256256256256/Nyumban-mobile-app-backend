import SupportService from './support.service.js'
import { success } from '../../common/utils/response-builder.util.js'
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js'

export const sendSupportMessageHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { subject, message } = req.body;

        const result = await SupportService.sendSupportMessage(userId, subject, message);
        return success(res, result, "Your support request has been sent. We'll get back to you shortly.")
    } catch (error) {
        return handleControllerError(res, error, 'SUPPORT_SEND_FAILED', 'Failed to send support message');
    }
}