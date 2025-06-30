import Joi from 'joi';

export const supportMessageSchema = Joi.object({
  subject: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Subject is required',
    'any.required': 'Subject is required',
  }),
  message: Joi.string().min(10).required().messages({
    'string.empty': 'Message is required',
    'any.required': 'Message is required',
  }),
});


