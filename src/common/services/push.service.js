export const sendPushNotification = async (userId, payload) => {
    // Simulate: Check if user app is active
    const isAppOpen = Math.random() > 0.5; // Random for example
  
    if (isAppOpen) {
      console.log(`[PUSH] Showing in-app notification for ${userId}`);
      console.log(`Title: ${payload.title}\nBody: ${payload.body}`);
    } else {
      console.log(`[PUSH] Sending remote push to ${userId} via FCM`);
      console.log(`Payload:`, payload);
    }
  
    return { delivered: true };
  };
  