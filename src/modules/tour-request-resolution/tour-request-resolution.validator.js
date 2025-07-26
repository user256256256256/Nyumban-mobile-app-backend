import Joi from 'joi';

export const resolveTourRequestSchema = {
  body: Joi.object({
    action: Joi.string().valid('accepted', 'declined').required().label('Action'),
    reason: Joi.string().max(255).when('action', {
      is: 'declined',
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }).label('Reason'),
  }),
  params: Joi.object({
    requestId: Joi.string().uuid().required().label('Request ID').messages({
      'string.uuid': 'Request ID must be a valid UUID',
      'any.required': 'Request ID is required',
    }),
  }),
};
