import Joi from 'joi';

export const resolveApplicationRequestSchema = {
  body: Joi.object({
    action: Joi.string().valid('approved', 'rejected').required(),
    reason: Joi.when('action', {
      is: 'rejected',
      then: Joi.string().min(3).required(),
      otherwise: Joi.forbidden()
    })
  }),
};
