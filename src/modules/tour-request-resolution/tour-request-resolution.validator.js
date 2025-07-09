import Joi from 'joi';

export const resolveTourRequestSchema = {
  body: Joi.object({
    action: Joi.string().valid('accepted', 'declined').required(),
    reason: Joi.string().max(255).when('action', {
      is: 'declined',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
  }),
};
