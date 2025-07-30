import prisma from '../../prisma-client.js';
import { generateTicketId } from '../../common/utils/generate-ticket-id.js';
import { EmailService } from '../../common/services/email.service.js'
import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const sendSupportMessage = async (userId, subject, message) => {
    const user = await prisma.users.findUnique({ where: {id: userId } });
    
    if (!user?.email) throw new NotFoundError('User email not found', { field: 'User ID' });

    const ticketId = generateTicketId();

    await EmailService.sendSupportEmail({
        fromEmail: user.email,
        fromName: user.username,
        subject,
        message: `${message}\n\nYour ticket ID is: ${ticketId}`,
    });

    return { success: true };
}

export default {
    sendSupportMessage,
}