import { triggerNotification } from '../modules/notifications/notification.service.js';

const userId = '56140da1-9010-4466-a9b2-8b80d0bff87b';

(async () => {
  try {
    const notificationsData = [
      {
        type: 'user',
        title: 'Tour Request 🚚',
        body: 'Your tour #123 has been added.',
        sendSms: true,
        sendEmail: true,
      },
      {
        type: 'user',
        title: 'Payment Reminder 💳',
        body: 'Your rent payment is due in 3 days.',
        sendSms: false,
        sendEmail: true,
      },
      {
        type: 'system',
        title: 'System Update ⚙️',
        body: 'We have updated our privacy policy.',
        sendSms: false,
        sendEmail: false,
      },
      {
        type: 'user',
        title: 'New Message ✉️',
        body: 'You received a new message from your landlord.',
        sendSms: true,
        sendEmail: false,
      },
      {
        type: 'user',
        title: 'Maintenance Scheduled 🛠️',
        body: 'Maintenance scheduled for your property tomorrow.',
        sendSms: true,
        sendEmail: true,
      },
    ];

    // Fire all notifications concurrently
    const results = await Promise.all(
      notificationsData.map(({ type, title, body, sendSms, sendEmail }) =>
        triggerNotification(userId, type, title, body, sendSms, sendEmail)
      )
    );

    console.log(`[TEST] Created ${results.length} notifications:`);
    results.forEach((res, i) => {
      console.log(`  - Notification ${i + 1}: id=${res.id}, title="${res.title}"`);
    });
  } catch (err) {
    console.error('[TEST ERROR]', err);
  }
})();
