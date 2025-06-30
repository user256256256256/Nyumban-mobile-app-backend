import NotificationService from './notification.service.js'
import { success } from '../../common/utils/responseBuilder.js'
import { handleControllerError } from '../../common/utils/handleControllerError.js'

export const getNotificationSettingsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await NotificationService.getUserNotificationSettings(userId);
        return success(res, result, "Notification Preferences retrieved successfully");
    } catch (error) {
        return handleControllerError(res, error, 'FAILED_TO_GET_PREFERENCES', 'Failed to get user notification preferences.');
    }
}

export const updateNotificationSettingsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const updates = req.body;
        const result = await NotificationService.updateUserNotificationSettings(userId, updates);
        return success(res, result, 'Notification settings updated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'UPDATE_FAILED', 'Failed to update preferences.')
    }
}

export const triggerNotificationHandler = async (req, res) => {
    const userId = req.user?.id;
    try {
        const {type, title, body, send_sms = false, send_email = false } = req.body;
        const result = await NotificationService.triggerNotification(userId, type, title, body, send_sms, send_email);
        return success(res, result, 'Notification triggered successfully');
    } catch (error) {
        return handleControllerError(res, error, 'NOTIFICATION_TRIGGER_FAILED', 'Failed to trigger notification');
    }
}

export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { filter = 'all' } = req.query;
        const result = await NotificationService.getUserNotifications(userId, filter);
        return success(res, result, 'Notification fetched successfully');
    } catch (error) {
        return handleControllerError(res, error, 'FAILED_TO_GET', 'Failed to get notifications');
    }
}

export const markAllAsReadHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await NotificationService.markAllAsRead(userId);
        return success(res, result, 'All notification read successfully');
    } catch (error) {
        return handleControllerError(res, error, 'FAILED_TO_READ_NOTIFICATIONS', 'Failed to read notifications');
    }
}

export const clearAllNotificationsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await NotificationService.clearAllNotifications(userId);
        return success(res, result, 'All notifications cleared')
    } catch (error) {
        return handleControllerError(res, error, 'FAILED_TO_CLEAR_NOTIFICATIONS', 'Failed to clear notifications');
    }
}

export const searchNotificationsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { q } = req.query;
        const result = await NotificationService.searchNotifications(userId, q);
        return success(res, result, 'Search successfull');
    } catch (error) {
        return handleControllerError(res, error, 'SEARCH_FAILED', 'Failed to search notifications');
    }
}

export const markAsReadHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const ids = req.body?.ids; 
  
      const result = await NotificationService.markAsRead(userId, ids);
      const message = ids?.length ? 'Selected notifications marked as read successfully' : 'Notifications marked as read successfully';
  
      return success(res, result, message);
    } catch (error) {
      return handleControllerError(res, error, 'MARK_AS_READ_FAILED', 'Failed to mark notifications as read');
    }
  };
  
  

export const clearNotificationHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const ids = req.body?.ids; 
  
      const result = await NotificationService.clearNotifications(userId, ids);
      return success(res, result, ids ? 'Selected notifications cleared successfully' : 'Notifications cleared successfully');
    } catch (error) {
      return handleControllerError(res, error, 'CLEAR_FAILED', 'Failed to clear notifications');
    }
};
  
  
  