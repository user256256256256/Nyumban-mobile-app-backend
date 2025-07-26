import Joi from 'joi';

export const supportMessageSchema = {
  body: Joi.object({
    subject: Joi.string().min(3).max(100).required().label('Subject').messages({
      'string.empty': 'Subject is required',
      'string.min': 'Subject must be at least 3 characters',
      'string.max': 'Subject cannot exceed 100 characters',
      'any.required': 'Subject is required',
    }),
    message: Joi.string().min(10).required().label('Message').messages({
      'string.empty': 'Message is required',
      'string.min': 'Message must be at least 10 characters long',
      'any.required': 'Message is required',
    }),
  }),
};
