import Joi from 'joi';

export const resolveApplicationRequestSchema = {
  params: Joi.object({
    applicationId: Joi.string().uuid().required().label('Application ID'),
  }),
  body: Joi.object({
    action: Joi.string().valid('approved', 'rejected').required(),
    reason: Joi.when('action', {
      is: 'rejected',
      then: Joi.string().min(3).required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

export const deleteApplicationRequestsSchema = {
  body: Joi.object({
    applicationIds: Joi.array()
      .items(Joi.string().uuid().label('Request ID'))
      .min(1)
      .required()
      .label('Request IDs'),
  })
}