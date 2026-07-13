/**
 * Expo Push Notification Service
 * 
 * Sends push notifications via Expo's Push API.
 * No firebase-admin needed — Expo handles FCM/APNs routing.
 * 
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification to one or more Expo push tokens
 * @param {Array<{to: string, title: string, body: string, data?: object}>} messages
 */
const sendPushNotifications = async (messages) => {
  // Filter out invalid tokens
  const validMessages = messages.filter(msg => 
    msg.to && msg.to.startsWith('ExponentPushToken[')
  );

  if (validMessages.length === 0) {
    console.log('[PUSH] No valid Expo push tokens to send to');
    return [];
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validMessages),
    });

    const result = await response.json();
    console.log(`[PUSH] Sent ${validMessages.length} push notification(s):`, 
      result.data?.map(r => r.status) || result
    );
    return result.data || [];
  } catch (error) {
    console.error('[PUSH] Failed to send push notifications:', error.message);
    return [];
  }
};

/**
 * Send a push notification to a single user
 * @param {string} expoPushToken - The user's Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Extra data to pass to the app
 */
const sendToUser = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return null;

  return await sendPushNotifications([{
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  }]);
};

module.exports = { sendPushNotifications, sendToUser };
