import Joi from 'joi';

export const updateNotificationSchema = Joi.object({
  notify_nyumban_updates: Joi.boolean(),
  notify_payment_sms: Joi.boolean()
});

export const triggerNotificationSchema = Joi.object({
  type: Joi.string().required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  send_sms: Joi.boolean().optional(),
  send_email: Joi.boolean().optional()
});

export const notificationFilterSchema = Joi.object({
  filter: Joi.string().valid('all', 'unread').default('all'),
});

export const notificationSearchSchema = Joi.object({
  q: Joi.string().required().messages({
    'any.required': 'Search query (q) is required',
    'string.empty': 'Search query (q) cannot be empty',
  }),
});

export const markAsReadSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).optional()
});

export const clearNotificationSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).optional()
});

