import Joi from 'joi';

export const updateNotificationSchema = {
  body: Joi.object({
    notify_nyumban_updates: Joi.boolean().label('Nyumban Update Notification'),
    notify_payment_sms: Joi.boolean().label('Payment SMS Notification'),
  })
    .min(1)
    .messages({
      'object.min': 'At least one notification preference must be provided',
    }),
};

export const triggerNotificationSchema = {
  body: Joi.object({
    type: Joi.string().required().label('Notification Type').messages({
      'any.required': 'Notification type is required',
    }),
    title: Joi.string().required().label('Title').messages({
      'any.required': 'Notification title is required',
    }),
    body: Joi.string().required().label('Body').messages({
      'any.required': 'Notification body is required',
    }),
    send_sms: Joi.boolean().optional().label('Send SMS'),
    send_email: Joi.boolean().optional().label('Send Email'),
  }),
};

export const notificationFilterSchema = {
  query: Joi.object({
    filter: Joi.string().valid('all', 'unread').default('all').label('Notification Filter'),
  }),
};

export const notificationSearchSchema = {
  query: Joi.object({
    q: Joi.string().required().label('Search Query').messages({
      'any.required': 'Search query is required',
      'string.empty': 'Search query cannot be empty',
    }),
  }),
};

export const markAsReadSchema = {
  body: Joi.object({
    ids: Joi.array().items(Joi.string().uuid()).optional().label('Notification IDs'),
  }),
};

export const clearNotificationSchema = {
  body: Joi.object({
    ids: Joi.array().items(Joi.string().uuid()).optional().label('Notification IDs'),
  }),
};