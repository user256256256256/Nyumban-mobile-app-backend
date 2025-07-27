export const logNotification = async ({ userId, type, sentAt, status = 'success' }) => {
    console.log(`[NOTIFICATION LOG] User: ${userId} | Type: ${type} | Status: ${status} | Sent: ${sentAt}`);
}