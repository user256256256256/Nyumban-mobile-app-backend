import express from 'express'
import { authenticate } from '../auth/auth.middleware.js'; 

import {
    getNotificationSettingsHandler,
    updateNotificationSettingsHandler,
    triggerNotificationHandler,
    getUserNotifications,
    clearAllNotificationsHandler,
    searchNotificationsHandler,
    markAsReadHandler, 
    clearNotificationHandler,
    markAllAsReadHandler,
} from './notification.controller.js'

import { validate } from '../../common/middleware/validate.js';

import { updateNotificationSchema, triggerNotificationSchema, notificationFilterSchema, notificationSearchSchema, markAsReadSchema, clearNotificationSchema } from './notification.validator.js';

const router = express.Router();

router.get('/settings', authenticate, getNotificationSettingsHandler);
router.post('/settings', authenticate, validate(updateNotificationSchema), updateNotificationSettingsHandler)
router.post('/trigger',  authenticate, validate(triggerNotificationSchema), triggerNotificationHandler)
router.get('/notifications', authenticate, validate(notificationFilterSchema), getUserNotifications);
router.post('/read-all', authenticate, markAllAsReadHandler)
router.patch('/mark-read', authenticate, validate(markAsReadSchema), markAsReadHandler);
router.delete('/clear-all', authenticate, clearAllNotificationsHandler)
router.delete('/clear', authenticate, validate(clearNotificationSchema), clearNotificationHandler);
router.get('/search', authenticate, validate(notificationSearchSchema), searchNotificationsHandler)

export default router;