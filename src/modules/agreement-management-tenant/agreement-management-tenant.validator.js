import Joi from 'joi';

export const acceptAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID')
  }),
  body: Joi.object({
    accepted: Joi.boolean().valid(true).required().label('Accepted')
  }),
};
