import prisma from '../../prisma-client.js';

export const EmailService = {
  async sendWelcomeEmail({ email, username }) {
    const subject = `Welcome to Nyumban, ${username || 'there'}! 🎉`;
    const body = `Hi ${username || 'there'},\n\nWelcome to Nyumban! You're all set to get started.\n\nBest,\nThe Nyumban Team`;

    console.log('[EMAIL SERVICE] Sending Welcome Email');
    console.log('To:', email, '\nSubject:', subject, '\nBody:', body);
    return { success: true };
  },

  async sendNotificationEmail({ toUserId, subject, body }) {
    const user = await prisma.users.findUnique({ where: { id: toUserId } });
    if (!user?.email) {
      console.warn(`[EMAIL SERVICE] No email found for user ${toUserId}`);
      return;
    }

    console.log(`[EMAIL SERVICE] Sending notification email to ${user.email}`);
    console.log('Subject:', subject);
    console.log('Body:', body);
    return { success: true };
  },

  async sendSupportEmail({ fromEmail, fromName, subject, message }) {
    const supportEmail = 'support@nyumban.com';

    const composedSubject = `[Support Request] ${subject}`;
    const composedBody = `From: ${fromName} <${fromEmail}>\n\nMessage:\n${message}`;

    console.log(`[EMAIL SERVICE] Sending support email to ${supportEmail}`);
    console.log('Subject:', composedSubject);
    console.log('Body:\n' + composedBody);

    return { success: true };
  }

};
